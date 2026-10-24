import { randomUUID } from "node:crypto"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  completeIssue,
  conflictFileComment,
  selectCompletionIssue,
} from "./complete.ts"
import {
  commentMarkers,
  fixComment,
  parsePullRequestComment,
  selectUnprocessedBugs,
} from "./conventions.ts"
import type { GitHubClient, Issue, IssueComment, PullRequest } from "./github.ts"
import { messageHasSddCurTaskTrailer, type GitClient } from "./git.ts"
import { workflowLabels } from "./labels.ts"
import type { AgentLaunchCounts } from "./agent.ts"
import {
  isQuickTarget,
  parseIssueNumberString,
  readSpecPair,
  specStatus,
} from "./sdd.ts"

export type WorkItem = {
  id: string
}

export type { AgentLaunchCounts }

export type Runner = {
  poll: () => Promise<WorkItem | null>
  process: (
    item: WorkItem,
    options?: { skipWork?: boolean },
  ) => Promise<void>
  agentLaunches: () => AgentLaunchCounts
}

const EMPTY_ACCEPTANCE = "受け入れ手順が空です"
const MARKER_IN_ACCEPTANCE = "受け入れ手順に印を含めない"
const NO_CHANGES = "実装の変更がありません"
const HEAD_CHANGED = "agent がブランチの先頭を変えました"
const AMBIGUOUS_PR = "マージリクエストを特定できません"
const OUT_OF_SCOPE_LINE = "設計の範囲外のため直していない"
const NO_REQUIREMENTS = "要件がありません"
const BAD_REQ_HEADING = "要件の見出しが不正です"
const NO_DESIGN = "設計がありません"
const BAD_DES_HEADING = "設計の見出しが不正です"
const BAD_QUICK_RESULT = "quick の結果を解釈できません"
const NOT_MINOR_LINE = "処理の途中で軽微な修正でないと分かりました"
const UNDECIDED_LINE = "決められない点があるため止めました"
const INVALID_CLONE_ID = "クローン識別子が不正です"
export const startMarker = "sdd-cur: 着手"

const allMarkers = new Set<string>(Object.values(commentMarkers))
const workflowLabelNames = new Set(workflowLabels.map((l) => l.name))

const LABEL_REQUEST = workflowLabels[0].name
const LABEL_IN_PROGRESS = workflowLabels[1].name
const LABEL_DONE = workflowLabels[2].name
const LABEL_VERIFIED = workflowLabels[3].name
const LABEL_MERGED = workflowLabels[4].name
const LABEL_CONFLICT = workflowLabels[5].name

function reject(message: string): never {
  throw new Error(message)
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function firstNonemptyLineIndex(lines: readonly string[]): number {
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim().length > 0) {
      return i
    }
  }
  return -1
}

function isOutOfScopeOnly(payload: string): boolean {
  const normalized = normalizeNewlines(payload)
  const nonEmpty = normalized.split("\n").filter((line) => line.trim().length > 0)
  return nonEmpty.length === 1 && nonEmpty[0] === OUT_OF_SCOPE_LINE
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch {
    return await fn()
  }
}

type RunnerGitExtras = {
  commitsAfterExclusive(
    before: string,
    after: string,
  ): Promise<readonly string[]>
  commitMessage(sha: string): Promise<string>
  branchOnlyCommitMessages(
    remote: string,
    defaultBranch: string,
  ): Promise<readonly string[]>
}

function runnerGitExtras(git: GitClient): RunnerGitExtras {
  return git as GitClient & RunnerGitExtras
}

function normalizeRunnerGit(git: GitClient): GitClient & RunnerGitExtras {
  const partial = git as GitClient & Partial<RunnerGitExtras>
  return {
    ...git,
    commitsAfterExclusive:
      partial.commitsAfterExclusive ??
      (async (before, after) => (before === after ? [] : [after])),
    commitMessage:
      partial.commitMessage ?? (async () => "feat: agent\n"),
    branchOnlyCommitMessages:
      partial.branchOnlyCommitMessages ?? (async () => []),
  }
}

async function assertAgentHeadAllowed(
  deps: RunnerDeps,
  before: string,
): Promise<void> {
  const after = await withRetry(() => deps.git.headCommit())
  const extras = runnerGitExtras(deps.git)
  const newShas = await withRetry(() =>
    extras.commitsAfterExclusive(before, after),
  )
  if (newShas.length === 0) {
    return
  }
  for (const sha of newShas) {
    const message = await withRetry(() => extras.commitMessage(sha))
    if (!messageHasSddCurTaskTrailer(message)) {
      reject(HEAD_CHANGED)
    }
  }
}

async function commitAndPushImplementation(
  deps: RunnerDeps,
  issueNumber: number,
  remote: string,
  branch: string,
  before: string,
): Promise<void> {
  const changed = await withRetry(() => deps.git.hasChanges())
  if (changed) {
    const commitMessage = `feat: 課題 ${issueNumber} を実装する`
    await withRetry(() => deps.git.commitAll(commitMessage))
  } else {
    const after = await withRetry(() => deps.git.headCommit())
    const shas = await withRetry(() =>
      runnerGitExtras(deps.git).commitsAfterExclusive(before, after),
    )
    let hasTaskCommit = false
    for (const sha of shas) {
      const message = await withRetry(() =>
        runnerGitExtras(deps.git).commitMessage(sha),
      )
      if (messageHasSddCurTaskTrailer(message)) {
        hasTaskCommit = true
        break
      }
    }
    if (!hasTaskCommit) {
      reject(NO_CHANGES)
    }
  }
  await withRetry(() => deps.git.push(remote, branch))
}

async function runAgentWithHeadCheck(
  deps: RunnerDeps,
  run: () => Promise<void>,
): Promise<string> {
  const before = await withRetry(() => deps.git.headCommit())
  try {
    await run()
  } catch (firstError) {
    await assertAgentHeadAllowed(deps, before)
    try {
      await run()
    } catch (secondError) {
      await assertAgentHeadAllowed(deps, before)
      throw secondError
    }
  }
  await assertAgentHeadAllowed(deps, before)
  return before
}

export function selectImplementationIssue(
  issues: readonly Issue[],
  login: string,
): Issue | null {
  const filtered = issues.filter((issue) => {
    const labels = issue.labels
    if (!labels.includes(LABEL_REQUEST)) {
      return false
    }
    if (labels.includes(LABEL_IN_PROGRESS)) {
      return false
    }
    if (labels.includes(LABEL_CONFLICT)) {
      return false
    }
    if (!issue.assignees.includes(login)) {
      return false
    }
    return true
  })
  const sorted = [...filtered].sort((a, b) => a.number - b.number)
  return sorted[0] ?? null
}

export function issueHasFixLabels(issue: Issue): boolean {
  const labels = issue.labels
  if (!labels.includes(LABEL_DONE)) {
    return false
  }
  if (labels.includes(LABEL_IN_PROGRESS)) {
    return false
  }
  if (labels.includes(LABEL_CONFLICT)) {
    return false
  }
  if (labels.includes(LABEL_VERIFIED)) {
    return false
  }
  if (labels.includes(LABEL_MERGED)) {
    return false
  }
  return true
}

export function selectQuickIssue(
  issues: readonly Issue[],
  login: string,
): Issue | null {
  const filtered = issues.filter((issue) => {
    if (issue.state !== "open") {
      return false
    }
    if (!issue.assignees.includes(login)) {
      return false
    }
    if (issue.labels.some((label) => workflowLabelNames.has(label))) {
      return false
    }
    if (!isQuickTarget(issue)) {
      return false
    }
    return true
  })
  const sorted = [...filtered].sort((a, b) => a.number - b.number)
  return sorted[0] ?? null
}

function issueHasWorkflowLabel(labels: readonly string[]): boolean {
  return labels.some((label) => workflowLabelNames.has(label))
}

type QuickParseResult =
  | { kind: "continue" }
  | { kind: "not-minor"; tail: string }
  | { kind: "undecided"; tail: string }

function parseQuickResult(content: string): QuickParseResult {
  const normalized = normalizeNewlines(content)
  const lines = normalized.split("\n")
  const index = firstNonemptyLineIndex(lines)
  if (index < 0) {
    reject(BAD_QUICK_RESULT)
  }
  const first = lines[index]
  const tail = lines.slice(index + 1).join("\n")
  if (first === "続行") {
    return { kind: "continue" }
  }
  if (first === "軽微でない") {
    return { kind: "not-minor", tail }
  }
  if (first === "決められない") {
    return { kind: "undecided", tail }
  }
  reject(BAD_QUICK_RESULT)
}

function quickStopComment(kind: "not-minor" | "undecided", tail: string): string {
  const head = kind === "not-minor" ? NOT_MINOR_LINE : UNDECIDED_LINE
  const trimmedTail = tail.trim()
  if (trimmedTail.length === 0) {
    return head
  }
  return `${head}\n${tail}`
}

async function assertSpecsReadyForImplement(issueNumber: number): Promise<void> {
  const pair = await readSpecPair(issueNumber)
  const reqStatus = specStatus(
    pair.requirements.exists,
    pair.requirements.markdown,
    issueNumber,
  )
  if (reqStatus === "missing") {
    reject(NO_REQUIREMENTS)
  }
  if (reqStatus === "invalid") {
    reject(BAD_REQ_HEADING)
  }
  const desStatus = specStatus(
    pair.design.exists,
    pair.design.markdown,
    issueNumber,
  )
  if (desStatus === "missing") {
    reject(NO_DESIGN)
  }
  if (desStatus === "invalid") {
    reject(BAD_DES_HEADING)
  }
}

export function selectFixIssues(
  issues: readonly Issue[],
  login: string,
): Issue[] {
  const filtered = issues.filter((issue) => {
    if (!issueHasFixLabels(issue)) {
      return false
    }
    if (!issue.assignees.includes(login)) {
      return false
    }
    return true
  })
  return [...filtered].sort((a, b) => a.number - b.number)
}

export function classifyFixPullRequests(
  pullRequests: readonly PullRequest[],
):
  | { kind: "none" }
  | { kind: "ambiguous" }
  | { kind: "not-open" }
  | { kind: "open"; pullRequest: PullRequest } {
  if (pullRequests.length === 0) {
    return { kind: "none" }
  }
  if (pullRequests.length >= 2) {
    return { kind: "ambiguous" }
  }
  const pr = pullRequests[0]
  if (pr.state === "open") {
    return { kind: "open", pullRequest: pr }
  }
  return { kind: "not-open" }
}

export function implementationBranch(issueNumber: number): string {
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) {
    reject("番号が不正です")
  }
  return `task-${issueNumber}`
}

export function acceptanceComment(payload: string): string {
  if (payload.trim().length === 0) {
    reject(EMPTY_ACCEPTANCE)
  }
  const normalized = normalizeNewlines(payload)
  const lines = normalized.split("\n")
  const index = firstNonemptyLineIndex(lines)
  if (index >= 0 && allMarkers.has(lines[index])) {
    reject(MARKER_IN_ACCEPTANCE)
  }
  return `${commentMarkers.acceptance}\n${payload}`
}

export function pullRequestBody(issueUrl: string, payload: string): string {
  const acceptance = acceptanceComment(payload)
  return `${issueUrl}\n${acceptance}`
}

function parseStartCommentBody(body: string): {
  isStart: boolean
  cloneId: string | null
} {
  const normalized = normalizeNewlines(body)
  const lines = normalized.split("\n")
  const firstIdx = firstNonemptyLineIndex(lines)
  if (firstIdx < 0) {
    return { isStart: false, cloneId: null }
  }
  if (lines[firstIdx] !== startMarker) {
    return { isStart: false, cloneId: null }
  }
  const idLine = lines[firstIdx + 1]
  if (idLine === undefined) {
    return { isStart: true, cloneId: null }
  }
  if (idLine.length === 0 || /\s/.test(idLine)) {
    return { isStart: true, cloneId: null }
  }
  return { isStart: true, cloneId: idLine }
}

function isStartComment(body: string): boolean {
  return parseStartCommentBody(body).isStart
}

function startCommentCloneId(body: string): string | null {
  return parseStartCommentBody(body).cloneId
}

export function startComment(cloneId: string): string {
  if (cloneId.length === 0 || /\s/.test(cloneId)) {
    reject(INVALID_CLONE_ID)
  }
  return `${startMarker}\n${cloneId}`
}

export function issueStartCutoff(
  comments: readonly IssueComment[],
): string | null {
  let max: string | null = null
  for (const comment of comments) {
    if (isStartComment(comment.body)) {
      continue
    }
    if (max === null || comment.createdAt > max) {
      max = comment.createdAt
    }
  }
  return max
}

export function latestCreatedAt(
  comments: readonly IssueComment[],
): string | null {
  if (comments.length === 0) {
    return null
  }
  let max = comments[0].createdAt
  for (let i = 1; i < comments.length; i += 1) {
    if (comments[i].createdAt > max) {
      max = comments[i].createdAt
    }
  }
  return max
}

export function decideStartClaim(
  comments: readonly IssueComment[],
  cloneId: string,
  cutoff: string | null,
): "continue" | "yield" | "unseen" {
  type Entry = { cloneId: string; createdAt: string; id: string }
  const entries: Entry[] = []
  for (const comment of comments) {
    const id = startCommentCloneId(comment.body)
    if (id === null) {
      continue
    }
    if (cutoff !== null && comment.createdAt <= cutoff) {
      continue
    }
    entries.push({
      cloneId: id,
      createdAt: comment.createdAt,
      id: comment.id,
    })
  }
  const hasOwn = entries.some((e) => e.cloneId === cloneId)
  if (!hasOwn) {
    return "unseen"
  }
  const sorted = [...entries].sort((a, b) => {
    if (a.createdAt !== b.createdAt) {
      return a.createdAt < b.createdAt ? -1 : 1
    }
    if (a.id !== b.id) {
      return a.id < b.id ? -1 : 1
    }
    return 0
  })
  const winner = sorted[0]
  if (winner.cloneId === cloneId) {
    return "continue"
  }
  return "yield"
}

export async function defaultCreateProcedureFile(): Promise<{
  path: string
  remove(): Promise<void>
}> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-proc-"))
  const filePath = path.join(dir, "procedure.txt")
  await writeFile(filePath, "", "utf8")
  return {
    path: filePath,
    async remove() {
      await rm(dir, { recursive: true, force: true })
    },
  }
}

type RunnerDeps = {
  github: {
    viewerLogin: GitHubClient["viewerLogin"]
    listIssues: GitHubClient["listIssues"]
    getIssue: GitHubClient["getIssue"]
    editLabels: GitHubClient["editLabels"]
    getDefaultBranch: GitHubClient["getDefaultBranch"]
    createBranch: GitHubClient["createBranch"]
    createPullRequest: GitHubClient["createPullRequest"]
    addComment: GitHubClient["addComment"]
    listComments: GitHubClient["listComments"]
    listPullRequests: GitHubClient["listPullRequests"]
    listPullRequestComments: GitHubClient["listPullRequestComments"]
    addPullRequestComment: GitHubClient["addPullRequestComment"]
    squashMerge: GitHubClient["squashMerge"]
  }
  git: GitClient
  agent: {
    implement(input: {
      issueNumber: number
      procedurePath: string
    }): Promise<void>
    fix(input: {
      issueNumber: number
      resultPath: string
      bugs: readonly { id: string; payload: string }[]
    }): Promise<void>
    quick(input: {
      issueNumber: number
      resultPath: string
    }): Promise<void>
    launchCounts?(): AgentLaunchCounts
    resetLaunchCounts?(): void
  }
  createProcedureFile: () => Promise<{
    path: string
    remove(): Promise<void>
  }>
}

async function findFixWorkItem(
  deps: RunnerDeps,
  login: string,
): Promise<WorkItem | null> {
  const fixIssues = await withRetry(() =>
    deps.github.listIssues({
      labels: [LABEL_DONE],
      assignee: login,
      limit: 100,
    }),
  )
  const candidates = selectFixIssues(fixIssues, login)
  for (const candidate of candidates) {
    const head = implementationBranch(candidate.number)
    const pullRequests = await withRetry(() =>
      deps.github.listPullRequests({ head, limit: 100 }),
    )
    const classified = classifyFixPullRequests(pullRequests)
    if (classified.kind === "none" || classified.kind === "not-open") {
      continue
    }
    if (classified.kind === "ambiguous") {
      reject(AMBIGUOUS_PR)
    }
    const comments = await withRetry(() =>
      deps.github.listPullRequestComments(classified.pullRequest.number),
    )
    const unprocessed = selectUnprocessedBugs(comments)
    if (unprocessed.length > 0) {
      return { id: String(candidate.number) }
    }
  }
  return null
}

async function ensureStartClaim(
  deps: RunnerDeps,
  issueNumber: number,
  cloneId: string,
  fixedCutoff: string | null,
  recomputeIssueCutoff: boolean,
): Promise<boolean> {
  let issueCutoff = fixedCutoff

  const cutoffFor = (comments: readonly IssueComment[]): string | null =>
    recomputeIssueCutoff ? issueStartCutoff(comments) : issueCutoff

  let comments = await withRetry(() => deps.github.listComments(issueNumber))
  let claim = decideStartClaim(comments, cloneId, cutoffFor(comments))

  if (claim === "yield") {
    return false
  }

  if (claim === "unseen") {
    await withRetry(() =>
      deps.github.addComment(issueNumber, startComment(cloneId)),
    )
    comments = await withRetry(() => deps.github.listComments(issueNumber))
    claim = decideStartClaim(comments, cloneId, cutoffFor(comments))
    if (claim === "unseen") {
      comments = await withRetry(() => deps.github.listComments(issueNumber))
      claim = decideStartClaim(comments, cloneId, cutoffFor(comments))
    }
  }

  if (claim !== "continue") {
    return false
  }

  comments = await withRetry(() => deps.github.listComments(issueNumber))
  claim = decideStartClaim(comments, cloneId, cutoffFor(comments))
  if (claim !== "continue") {
    return false
  }

  return true
}

export function createRunner(rawDeps: RunnerDeps): Runner {
  const deps: RunnerDeps = {
    ...rawDeps,
    git: normalizeRunnerGit(rawDeps.git),
  }
  const cloneId = randomUUID()
  return {
    async poll() {
      const login = await withRetry(() => deps.github.viewerLogin())
      const issues = await withRetry(() =>
        deps.github.listIssues({
          labels: [LABEL_REQUEST],
          assignee: login,
          limit: 100,
        }),
      )
      const selected = selectImplementationIssue(issues, login)
      if (selected !== null) {
        return { id: String(selected.number) }
      }

      const fixItem = await findFixWorkItem(deps, login)
      if (fixItem !== null) {
        return fixItem
      }

      const quickIssues = await withRetry(() =>
        deps.github.listIssues({
          state: "open",
          assignee: login,
          limit: 100,
        }),
      )
      const quickSelected = selectQuickIssue(quickIssues, login)
      if (quickSelected !== null) {
        return { id: String(quickSelected.number) }
      }

      const completionIssues = await withRetry(() =>
        deps.github.listIssues({
          labels: [LABEL_VERIFIED],
          assignee: login,
          limit: 100,
        }),
      )
      const completion = selectCompletionIssue(completionIssues, login)
      if (completion === null) {
        return null
      }
      return { id: String(completion.number) }
    },

    async process(item, options) {
      deps.agent.resetLaunchCounts?.()
      if (options?.skipWork) {
        return
      }

      const issueNumber = parseIssueNumberString(item.id)

      const issue = await withRetry(() => deps.github.getIssue(issueNumber))
      const hasRequest = issue.labels.includes(LABEL_REQUEST)
      const hasInProgress = issue.labels.includes(LABEL_IN_PROGRESS)
      if (hasRequest && !hasInProgress) {
        await runImplementation(deps, issueNumber, issue, cloneId)
        return
      }

      if (issueHasFixLabels(issue)) {
        await runFixProcess(deps, issueNumber, cloneId)
        return
      }

      const login = await withRetry(() => deps.github.viewerLogin())
      if (
        issue.state === "open" &&
        !issueHasWorkflowLabel(issue.labels) &&
        issue.assignees.includes(login) &&
        isQuickTarget(issue)
      ) {
        await runQuick(deps, issueNumber, issue, cloneId)
        return
      }

      if (issue.labels.includes(LABEL_VERIFIED)) {
        await completeIssue(deps.github, deps.git, issueNumber)
      }
    },

    agentLaunches() {
      if (deps.agent.launchCounts) {
        return deps.agent.launchCounts()
      }
      return { quick: 0, implement: 0, fix: 0 }
    },
  }
}

async function runQuick(
  deps: RunnerDeps,
  issueNumber: number,
  issue: Issue,
  cloneId: string,
): Promise<void> {
  if (
    !(await ensureStartClaim(deps, issueNumber, cloneId, null, true))
  ) {
    return
  }

  await withRetry(() =>
    deps.github.editLabels(issueNumber, {
      add: [LABEL_IN_PROGRESS],
    }),
  )

  const defaultBranch = await withRetry(() => deps.github.getDefaultBranch())
  const branch = implementationBranch(issueNumber)

  const remote = await withRetry(() => deps.git.remoteName())
  await withRetry(() => deps.git.fetch(remote, defaultBranch))
  await withRetry(() => deps.git.checkoutFetched(branch))

  const quickResult = await deps.createProcedureFile()
  try {
    try {
      await runAgentWithHeadCheck(deps, () =>
        deps.agent.quick({
          issueNumber,
          resultPath: quickResult.path,
        }),
      )
    } catch (error) {
      if (error instanceof Error && error.message === HEAD_CHANGED) {
        await quickResult.remove()
        throw error
      }
      try {
        await runAgentWithHeadCheck(deps, () =>
          deps.agent.quick({
            issueNumber,
            resultPath: quickResult.path,
          }),
        )
      } catch (error2) {
        if (error2 instanceof Error && error2.message === HEAD_CHANGED) {
          await quickResult.remove()
          throw error2
        }
        await quickResult.remove()
        return
      }
    }

    let parsed: QuickParseResult
    try {
      const content = await readFile(quickResult.path, "utf8")
      parsed = parseQuickResult(content)
    } catch (error) {
      await quickResult.remove()
      if (error instanceof Error && error.message === BAD_QUICK_RESULT) {
        reject(BAD_QUICK_RESULT)
      }
      reject(BAD_QUICK_RESULT)
    }
    await quickResult.remove()

    if (parsed.kind === "not-minor") {
      await withRetry(() =>
        deps.github.addComment(
          issueNumber,
          quickStopComment("not-minor", parsed.tail),
        ),
      )
      return
    }
    if (parsed.kind === "undecided") {
      await withRetry(() =>
        deps.github.addComment(
          issueNumber,
          quickStopComment("undecided", parsed.tail),
        ),
      )
      return
    }

    await assertSpecsReadyForImplement(issueNumber)

    const procedure = await deps.createProcedureFile()
    try {
      let headBefore: string
      try {
        headBefore = await runAgentWithHeadCheck(deps, () =>
          deps.agent.implement({
            issueNumber,
            procedurePath: procedure.path,
          }),
        )
      } catch (error) {
        await procedure.remove()
        throw error
      }

      let prBody: string
      try {
        const payload = await readFile(procedure.path, "utf8")
        prBody = pullRequestBody(issue.url, payload)
      } catch (error) {
        await procedure.remove()
        throw error
      }
      await procedure.remove()

      await commitAndPushImplementation(
        deps,
        issueNumber,
        remote,
        branch,
        headBefore,
      )

      const pullRequest = await withRetry(() =>
        deps.github.createPullRequest({
          base: defaultBranch,
          head: branch,
          title: issue.title,
          body: prBody,
        }),
      )

      await withRetry(() =>
        deps.github.addComment(issueNumber, pullRequest.url),
      )

      await withRetry(() =>
        deps.github.editLabels(issueNumber, {
          remove: [LABEL_IN_PROGRESS],
          add: [LABEL_DONE],
        }),
      )
    } catch (error) {
      try {
        await procedure.remove()
      } catch {
        // ignore cleanup errors
      }
      throw error
    }
  } catch (error) {
    try {
      await quickResult.remove()
    } catch {
      // ignore cleanup errors
    }
    throw error
  }
}

async function reportImplementationConflict(
  deps: RunnerDeps,
  issueNumber: number,
  files: readonly string[],
): Promise<void> {
  const head = implementationBranch(issueNumber)
  const pullRequests = await withRetry(() =>
    deps.github.listPullRequests({ head, limit: 100 }),
  )
  const open = pullRequests.filter((pr) => pr.state === "open")
  const body = conflictFileComment(files)
  if (open.length === 1) {
    await withRetry(() =>
      deps.github.addPullRequestComment(open[0]!.number, body),
    )
  } else {
    await withRetry(() => deps.github.addComment(issueNumber, body))
  }
  await withRetry(() =>
    deps.github.editLabels(issueNumber, {
      remove: [LABEL_IN_PROGRESS],
      add: [LABEL_CONFLICT],
    }),
  )
}

async function reportFixConflict(
  deps: RunnerDeps,
  issueNumber: number,
  pullRequest: PullRequest,
  files: readonly string[],
): Promise<void> {
  const body = conflictFileComment(files)
  await withRetry(() =>
    deps.github.addPullRequestComment(pullRequest.number, body),
  )
  await withRetry(() =>
    deps.github.editLabels(issueNumber, {
      remove: [LABEL_IN_PROGRESS],
      add: [LABEL_CONFLICT],
    }),
  )
}

async function mergeDefaultBranchIntoWorkBranch(
  deps: RunnerDeps,
  remote: string,
  defaultBranch: string,
): Promise<
  | { status: "merged" }
  | { status: "conflict"; files: readonly string[] }
> {
  await withRetry(() => deps.git.fetch(remote, defaultBranch))
  return deps.git.mergeFetched()
}

async function runImplementation(
  deps: RunnerDeps,
  issueNumber: number,
  issue: Issue,
  cloneId: string,
): Promise<void> {
  if (
    !(await ensureStartClaim(deps, issueNumber, cloneId, null, true))
  ) {
    return
  }

  await withRetry(() =>
    deps.github.editLabels(issueNumber, {
      remove: [LABEL_REQUEST],
      add: [LABEL_IN_PROGRESS],
    }),
  )

  const defaultBranch = await withRetry(() => deps.github.getDefaultBranch())
  const branch = implementationBranch(issueNumber)

  const remote = await withRetry(() => deps.git.remoteName())
  await withRetry(() => deps.git.fetch(remote, branch))
  await withRetry(() => deps.git.checkoutFetched(branch))

  const mergeResult = await mergeDefaultBranchIntoWorkBranch(
    deps,
    remote,
    defaultBranch,
  )
  if (mergeResult.status === "conflict") {
    await reportImplementationConflict(deps, issueNumber, mergeResult.files)
    return
  }

  const procedure = await deps.createProcedureFile()
  try {
    let headBefore: string
    try {
      headBefore = await runAgentWithHeadCheck(deps, () =>
        deps.agent.implement({
          issueNumber,
          procedurePath: procedure.path,
        }),
      )
    } catch (error) {
      await procedure.remove()
      throw error
    }

    let prBody: string
    try {
      const payload = await readFile(procedure.path, "utf8")
      prBody = pullRequestBody(issue.url, payload)
    } catch (error) {
      await procedure.remove()
      throw error
    }
    await procedure.remove()

    await commitAndPushImplementation(
      deps,
      issueNumber,
      remote,
      branch,
      headBefore,
    )

    const pullRequest = await withRetry(() =>
      deps.github.createPullRequest({
        base: defaultBranch,
        head: branch,
        title: issue.title,
        body: prBody,
      }),
    )

    await withRetry(() =>
      deps.github.addComment(issueNumber, pullRequest.url),
    )

    await withRetry(() =>
      deps.github.editLabels(issueNumber, {
        remove: [LABEL_IN_PROGRESS],
        add: [LABEL_DONE],
      }),
    )
  } catch (error) {
    try {
      await procedure.remove()
    } catch {
      // ignore cleanup errors
    }
    throw error
  }
}

async function resolveFixContext(
  deps: RunnerDeps,
  issueNumber: number,
): Promise<
  | { kind: "skip" }
  | {
      kind: "work"
      pullRequest: PullRequest
      bugs: IssueComment[]
      prComments: IssueComment[]
    }
> {
  const head = implementationBranch(issueNumber)
  const pullRequests = await withRetry(() =>
    deps.github.listPullRequests({ head, limit: 100 }),
  )
  const classified = classifyFixPullRequests(pullRequests)
  if (classified.kind === "none" || classified.kind === "not-open") {
    return { kind: "skip" }
  }
  if (classified.kind === "ambiguous") {
    reject(AMBIGUOUS_PR)
  }
  const comments = await withRetry(() =>
    deps.github.listPullRequestComments(classified.pullRequest.number),
  )
  const bugs = selectUnprocessedBugs(comments)
  if (bugs.length === 0) {
    return { kind: "skip" }
  }
  return {
    kind: "work",
    pullRequest: classified.pullRequest,
    bugs,
    prComments: comments,
  }
}

async function runFixProcess(
  deps: RunnerDeps,
  issueNumber: number,
  cloneId: string,
): Promise<void> {
  const ctx = await resolveFixContext(deps, issueNumber)
  if (ctx.kind === "skip") {
    return
  }
  await runFix(
    deps,
    issueNumber,
    ctx.pullRequest,
    ctx.bugs,
    ctx.prComments,
    cloneId,
  )
}

async function runFix(
  deps: RunnerDeps,
  issueNumber: number,
  pullRequest: PullRequest,
  bugs: IssueComment[],
  prComments: readonly IssueComment[],
  cloneId: string,
): Promise<void> {
  const fixCutoff = latestCreatedAt(prComments)
  if (
    !(await ensureStartClaim(deps, issueNumber, cloneId, fixCutoff, false))
  ) {
    return
  }

  const bugIds = bugs.map((b) => b.id)
  fixComment(".", bugIds)

  const bugInputs = bugs.map((bug) => ({
    id: bug.id,
    payload: parsePullRequestComment(bug.body).payload,
  }))

  let commentBody: string
  const branch = implementationBranch(issueNumber)

  try {
    await withRetry(() =>
      deps.github.editLabels(issueNumber, {
        remove: [LABEL_DONE],
        add: [LABEL_IN_PROGRESS],
      }),
    )

    const remote = await withRetry(() => deps.git.remoteName())
    await withRetry(() => deps.git.fetch(remote, branch))
    await withRetry(() => deps.git.checkoutFetched(branch))

    const defaultBranch = await withRetry(() => deps.github.getDefaultBranch())
    const mergeResult = await mergeDefaultBranchIntoWorkBranch(
      deps,
      remote,
      defaultBranch,
    )
    if (mergeResult.status === "conflict") {
      await reportFixConflict(
        deps,
        issueNumber,
        pullRequest,
        mergeResult.files,
      )
      return
    }

    const procedure = await deps.createProcedureFile()

    try {
      await runAgentWithHeadCheck(deps, () =>
        deps.agent.fix({
          issueNumber,
          resultPath: procedure.path,
          bugs: bugInputs,
        }),
      )
    } catch (error) {
      await procedure.remove()
      throw error
    }

    let resultPayload: string
    try {
      resultPayload = await readFile(procedure.path, "utf8")
      commentBody = fixComment(
        resultPayload,
        bugs.map((b) => b.id),
      )
    } catch (error) {
      await procedure.remove()
      throw error
    }
    await procedure.remove()

    const changed = await withRetry(() => deps.git.hasChanges())
    if (!changed) {
      if (isOutOfScopeOnly(resultPayload)) {
        await withRetry(() =>
          deps.github.addPullRequestComment(pullRequest.number, commentBody),
        )
        await withRetry(() =>
          deps.github.editLabels(issueNumber, {
            remove: [LABEL_IN_PROGRESS],
            add: [LABEL_DONE],
          }),
        )
        return
      }
      reject(NO_CHANGES)
    }

    const commitMessage = `fix: 課題 ${issueNumber} の不具合を修正する`
    await withRetry(() => deps.git.commitAll(commitMessage))
    await withRetry(() => deps.git.push(remote, branch))

    await withRetry(() =>
      deps.github.addPullRequestComment(pullRequest.number, commentBody),
    )

    await withRetry(() =>
      deps.github.editLabels(issueNumber, {
        remove: [LABEL_IN_PROGRESS],
        add: [LABEL_DONE],
      }),
    )
  } catch (error) {
    try {
      await procedure.remove()
    } catch {
      // ignore cleanup errors
    }
    throw error
  }
}

export const defaultRunner: Runner = {
  async poll() {
    return null
  },
  async process() {},
  agentLaunches() {
    return { quick: 0, implement: 0, fix: 0 }
  },
}
