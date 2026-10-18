import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  completeIssue,
  type CompletionCaller,
  selectCompletionIssue,
} from "./complete.ts"
import { commentMarkers } from "./conventions.ts"
import type { GitHubClient, Issue } from "./github.ts"
import type { GitClient } from "./git.ts"
import { workflowLabels } from "./labels.ts"
import { parseIssueNumberString } from "./sdd.ts"

export type WorkItem = {
  id: string
}

export type Runner = {
  poll: () => Promise<WorkItem | null>
  process: (item: WorkItem) => Promise<void>
}

const EMPTY_ACCEPTANCE = "受け入れ手順が空です"
const MARKER_IN_ACCEPTANCE = "受け入れ手順に印を含めない"
const NO_CHANGES = "実装の変更がありません"

const allMarkers = new Set<string>(Object.values(commentMarkers))

const LABEL_REQUEST = workflowLabels[0].name
const LABEL_IN_PROGRESS = workflowLabels[1].name
const LABEL_DONE = workflowLabels[2].name
const LABEL_VERIFIED = workflowLabels[3].name

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

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch {
    return await fn()
  }
}

export function selectImplementationIssue(
  issues: readonly Issue[],
): Issue | null {
  const filtered = issues.filter((issue) => {
    const labels = issue.labels
    if (!labels.includes(LABEL_REQUEST)) {
      return false
    }
    if (labels.includes(LABEL_IN_PROGRESS)) {
      return false
    }
    return true
  })
  const sorted = [...filtered].sort((a, b) => a.number - b.number)
  return sorted[0] ?? null
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
  completionCaller: CompletionCaller | null
  github: {
    listIssues: GitHubClient["listIssues"]
    getIssue: GitHubClient["getIssue"]
    editLabels: GitHubClient["editLabels"]
    getDefaultBranch: GitHubClient["getDefaultBranch"]
    createBranch: GitHubClient["createBranch"]
    createPullRequest: GitHubClient["createPullRequest"]
    addComment: GitHubClient["addComment"]
    listPullRequests: GitHubClient["listPullRequests"]
    squashMerge: GitHubClient["squashMerge"]
  }
  git: GitClient
  agent: {
    implement(input: {
      issueNumber: number
      procedurePath: string
    }): Promise<void>
  }
  createProcedureFile: () => Promise<{
    path: string
    remove(): Promise<void>
  }>
}

export function createRunner(deps: RunnerDeps): Runner {
  return {
    async poll() {
      const issues = await withRetry(() =>
        deps.github.listIssues({ labels: [LABEL_REQUEST], limit: 100 }),
      )
      const selected = selectImplementationIssue(issues)
      if (selected !== null) {
        return { id: String(selected.number) }
      }
      if (deps.completionCaller !== "runner") {
        return null
      }
      const completionIssues = await withRetry(() =>
        deps.github.listIssues({ labels: [LABEL_VERIFIED], limit: 100 }),
      )
      const completion = selectCompletionIssue(completionIssues)
      if (completion === null) {
        return null
      }
      return { id: String(completion.number) }
    },

    async process(item) {
      const issueNumber = parseIssueNumberString(item.id)

      const issue = await withRetry(() => deps.github.getIssue(issueNumber))
      const hasRequest = issue.labels.includes(LABEL_REQUEST)
      const hasInProgress = issue.labels.includes(LABEL_IN_PROGRESS)
      if (hasRequest && !hasInProgress) {
        await runImplementation(deps, issueNumber, issue)
        return
      }

      if (
        deps.completionCaller === "runner" &&
        issue.labels.includes(LABEL_VERIFIED)
      ) {
        await completeIssue(deps.github, issueNumber)
      }
    },
  }
}

async function runImplementation(
  deps: RunnerDeps,
  issueNumber: number,
  issue: Issue,
): Promise<void> {
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

      const procedure = await deps.createProcedureFile()
      try {
        try {
          await withRetry(() =>
            deps.agent.implement({
              issueNumber,
              procedurePath: procedure.path,
            }),
          )
        } catch (error) {
          await procedure.remove()
          throw error
        }

        let commentBody: string
        try {
          const payload = await readFile(procedure.path, "utf8")
          commentBody = acceptanceComment(payload)
        } catch (error) {
          await procedure.remove()
          throw error
        }
        await procedure.remove()

        const changed = await withRetry(() => deps.git.hasChanges())
        if (!changed) {
          reject(NO_CHANGES)
        }

        const commitMessage = `feat: 課題 ${issueNumber} を実装する`
        await withRetry(() => deps.git.commitAll(commitMessage))
        await withRetry(() => deps.git.push(remote, branch))

        await withRetry(() =>
          deps.github.createPullRequest({
            base: defaultBranch,
            head: branch,
            title: issue.title,
            body: issue.url,
          }),
        )

        await withRetry(() =>
          deps.github.addComment(issueNumber, commentBody),
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
}
