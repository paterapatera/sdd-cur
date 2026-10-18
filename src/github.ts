export type GhResult = {
  stdout: string
  stderr: string
  exitCode: number
}

export type GhRunOptions = {
  cwd?: string
  stdin?: string
}

export type GhRunner = {
  run: (args: string[], options: GhRunOptions) => Promise<GhResult>
}

export type Issue = {
  number: number
  title: string
  body: string
  state: "open" | "closed"
  labels: string[]
  assignees: string[]
  url: string
}

export type IssueComment = {
  id: string
  body: string
  author: string
  createdAt: string
}

export type PullRequest = {
  number: number
  url: string
  state: "open" | "closed" | "merged"
  merged: boolean
}

export type GitHubClient = {
  viewerLogin(): Promise<string>
  listIssues(query?: {
    state?: "open" | "closed" | "all"
    labels?: string[]
    assignee?: string
    limit?: number
  }): Promise<Issue[]>
  getIssue(number: number): Promise<Issue>
  listComments(number: number): Promise<IssueComment[]>
  addComment(number: number, body: string): Promise<{ url: string }>
  listPullRequestComments(number: number): Promise<IssueComment[]>
  addPullRequestComment(number: number, body: string): Promise<{ url: string }>
  editLabels(
    number: number,
    change: { add?: string[]; remove?: string[] },
  ): Promise<void>
  createBranch(name: string, from: string): Promise<void>
  createPullRequest(input: {
    base: string
    head: string
    title: string
    body: string
  }): Promise<{ number: number; url: string }>
  getPullRequest(number: number): Promise<PullRequest>
  listPullRequests(query: {
    head: string
    limit?: number
  }): Promise<PullRequest[]>
  squashMerge(number: number): Promise<void>
  getLabel(name: string): Promise<{ name: string } | null>
  createLabel(input: {
    name: string
    description: string
    color: string
  }): Promise<void>
  getDefaultBranch(): Promise<string>
}

const ISSUE_JSON_FIELDS =
  "number,title,body,state,labels,assignees,url"
const INVALID_ASSIGNEE = "アサインの指定が不正です"
const PARSE_ERROR = "gh の応答を解釈できません"
const NOT_MERGED = "マージリクエストはマージされていません"

type RepoParts = { owner: string; name: string }

function reject(message: string): never {
  throw new Error(message)
}

function firstNonemptyLine(text: string): string | null {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }
  return null
}

function failReason(result: GhResult): string {
  const fromStderr = firstNonemptyLine(result.stderr)
  if (fromStderr) {
    return fromStderr
  }
  const fromStdout = firstNonemptyLine(result.stdout)
  if (fromStdout) {
    return fromStdout
  }
  return "gh が失敗しました"
}

function assertGhOk(result: GhResult): void {
  if (result.exitCode !== 0) {
    reject(failReason(result))
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    reject(PARSE_ERROR)
  }
}

export function parseRepo(repo: string): RepoParts {
  if (repo.trim() !== repo || !repo.includes("/")) {
    reject("リポジトリの指定が不正です")
  }
  const slash = repo.indexOf("/")
  if (slash <= 0 || slash !== repo.lastIndexOf("/")) {
    reject("リポジトリの指定が不正です")
  }
  const owner = repo.slice(0, slash)
  const name = repo.slice(slash + 1)
  if (owner.length === 0 || name.length === 0) {
    reject("リポジトリの指定が不正です")
  }
  if (/\s/.test(owner) || /\s/.test(name)) {
    reject("リポジトリの指定が不正です")
  }
  return { owner, name }
}

function assertPositiveInteger(n: number): void {
  if (!Number.isInteger(n) || n < 1) {
    reject("番号が不正です")
  }
}

function assertLabelName(label: string): void {
  if (label.length === 0 || label !== label.trim() || label.includes(",")) {
    reject("ラベル名が不正です")
  }
}

function assertLabelColor(color: string): void {
  if (!/^[0-9A-Fa-f]{6}$/.test(color)) {
    reject("ラベルの色が不正です")
  }
}

function assertLabelDescription(description: string): void {
  if (description.trim().length === 0) {
    reject("ラベルの説明が空です")
  }
}

function parseLabelNameResponse(stdout: string, expectedName: string): { name: string } {
  const parsed = parseJson(stdout)
  if (typeof parsed !== "object" || parsed === null) {
    reject(PARSE_ERROR)
  }
  const name = (parsed as { name?: unknown }).name
  if (typeof name !== "string" || name !== expectedName) {
    reject(PARSE_ERROR)
  }
  return { name }
}

function assertBranchName(name: string): void {
  if (name.includes(":")) {
    reject("ブランチ名が不正です")
  }
  if (
    name.includes("..") ||
    name.includes("//") ||
    name.endsWith("/") ||
    !/^[0-9A-Za-z][0-9A-Za-z._/-]*$/.test(name)
  ) {
    reject("ブランチ名が不正です")
  }
}

function assertTitle(title: string): void {
  if (title.trim().length === 0 || title.includes("\n")) {
    reject("タイトルが不正です")
  }
}

function assertIssueState(state: string): void {
  if (state !== "open" && state !== "closed" && state !== "all") {
    reject("課題の状態が不正です")
  }
}

function assertLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
    reject("取得件数の指定が不正です")
  }
}

function assertAssigneeQuery(assignee: string): void {
  if (assignee.trim().length === 0) {
    reject(INVALID_ASSIGNEE)
  }
}

function assertPullRequestLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    reject("取得件数の指定が不正です")
  }
}

function encodeBranchRefPath(branch: string): string {
  return branch.replace(/\//g, "%2F")
}

function normalizeIssueState(raw: unknown): Issue["state"] {
  if (raw === "OPEN" || raw === "open") {
    return "open"
  }
  if (raw === "CLOSED" || raw === "closed") {
    return "closed"
  }
  reject(PARSE_ERROR)
}

function normalizeIssue(raw: unknown): Issue {
  if (typeof raw !== "object" || raw === null) {
    reject(PARSE_ERROR)
  }
  const o = raw as Record<string, unknown>
  if (typeof o.number !== "number" || !Number.isInteger(o.number)) {
    reject(PARSE_ERROR)
  }
  if (typeof o.title !== "string" || typeof o.url !== "string") {
    reject(PARSE_ERROR)
  }
  const body = o.body === null ? "" : o.body
  if (typeof body !== "string") {
    reject(PARSE_ERROR)
  }
  const labelsRaw = o.labels
  if (!Array.isArray(labelsRaw)) {
    reject(PARSE_ERROR)
  }
  const labels: string[] = []
  for (const item of labelsRaw) {
    if (typeof item !== "object" || item === null) {
      reject(PARSE_ERROR)
    }
    const name = (item as { name?: unknown }).name
    if (typeof name !== "string") {
      reject(PARSE_ERROR)
    }
    labels.push(name)
  }
  const assigneesRaw = o.assignees
  if (!Array.isArray(assigneesRaw)) {
    reject(PARSE_ERROR)
  }
  const assignees: string[] = []
  for (const item of assigneesRaw) {
    if (typeof item !== "object" || item === null) {
      reject(PARSE_ERROR)
    }
    const login = (item as { login?: unknown }).login
    if (typeof login !== "string") {
      reject(PARSE_ERROR)
    }
    assignees.push(login)
  }
  return {
    number: o.number,
    title: o.title,
    body,
    state: normalizeIssueState(o.state),
    labels,
    assignees,
    url: o.url,
  }
}

function normalizeComment(raw: unknown): IssueComment {
  if (typeof raw !== "object" || raw === null) {
    reject(PARSE_ERROR)
  }
  const o = raw as Record<string, unknown>
  if (typeof o.id !== "string" || typeof o.createdAt !== "string") {
    reject(PARSE_ERROR)
  }
  const body = o.body === null ? "" : o.body
  if (typeof body !== "string") {
    reject(PARSE_ERROR)
  }
  let author = ""
  const authorRaw = o.author
  if (authorRaw !== null && authorRaw !== undefined) {
    if (typeof authorRaw !== "object") {
      reject(PARSE_ERROR)
    }
    const login = (authorRaw as { login?: unknown }).login
    if (typeof login === "string") {
      author = login
    }
  }
  return {
    id: o.id,
    body,
    author,
    createdAt: o.createdAt,
  }
}

function normalizePullRequest(raw: unknown): PullRequest {
  if (typeof raw !== "object" || raw === null) {
    reject(PARSE_ERROR)
  }
  const o = raw as Record<string, unknown>
  if (typeof o.number !== "number" || !Number.isInteger(o.number)) {
    reject(PARSE_ERROR)
  }
  if (typeof o.url !== "string") {
    reject(PARSE_ERROR)
  }
  const mergedAt = o.mergedAt
  const merged =
    mergedAt !== null && mergedAt !== undefined && String(mergedAt).length > 0
  let state: PullRequest["state"]
  const rawState = o.state
  if (rawState === "MERGED" || rawState === "merged") {
    state = "merged"
  } else if (rawState === "OPEN" || rawState === "open") {
    state = "open"
  } else if (rawState === "CLOSED" || rawState === "closed") {
    state = merged ? "merged" : "closed"
  } else {
    reject(PARSE_ERROR)
  }
  return {
    number: o.number,
    url: o.url,
    state,
    merged,
  }
}

function runOptions(cwd?: string, stdin?: string): GhRunOptions {
  const opts: GhRunOptions = {}
  if (cwd !== undefined) {
    opts.cwd = cwd
  }
  if (stdin !== undefined) {
    opts.stdin = stdin
  }
  return opts
}

async function ghCall(
  gh: GhRunner,
  args: string[],
  cwd?: string,
  stdin?: string,
): Promise<GhResult> {
  try {
    return await gh.run(args, runOptions(cwd, stdin))
  } catch {
    reject("gh を実行できません")
  }
}

export function createGitHub(options: {
  gh: GhRunner
  repo: string
  cwd?: string
}): GitHubClient {
  const parts = parseRepo(options.repo)
  const repo = options.repo
  const cwd = options.cwd
  const gh = options.gh

  async function runGh(args: string[], stdin?: string): Promise<GhResult> {
    const result = await ghCall(gh, args, cwd, stdin)
    assertGhOk(result)
    return result
  }

  return {
    async viewerLogin() {
      const result = await runGh(["api", "user"])
      const parsed = parseJson(result.stdout)
      if (typeof parsed !== "object" || parsed === null) {
        reject(PARSE_ERROR)
      }
      const login = (parsed as { login?: unknown }).login
      if (typeof login !== "string" || login.length === 0) {
        reject(PARSE_ERROR)
      }
      return login
    },

    async listIssues(query = {}) {
      const state = query.state ?? "open"
      assertIssueState(state)
      const limit = query.limit ?? 100
      assertLimit(limit)
      const labels = query.labels ?? []
      for (const label of labels) {
        assertLabelName(label)
      }
      const assigneeArgs: string[] = []
      if (query.assignee !== undefined) {
        assertAssigneeQuery(query.assignee)
        assigneeArgs.push("--assignee", query.assignee)
      }
      const args = [
        "issue",
        "list",
        "--repo",
        repo,
        ...labels.flatMap((label) => ["--label", label]),
        ...assigneeArgs,
        "--state",
        state,
        "--limit",
        String(limit),
        "--json",
        ISSUE_JSON_FIELDS,
      ]
      const result = await runGh(args)
      const parsed = parseJson(result.stdout)
      if (!Array.isArray(parsed)) {
        reject(PARSE_ERROR)
      }
      return parsed.map((item) => normalizeIssue(item))
    },

    async getIssue(number) {
      assertPositiveInteger(number)
      const result = await runGh([
        "issue",
        "view",
        String(number),
        "--repo",
        repo,
        "--json",
        ISSUE_JSON_FIELDS,
      ])
      return normalizeIssue(parseJson(result.stdout))
    },

    async listComments(number) {
      assertPositiveInteger(number)
      const result = await runGh([
        "issue",
        "view",
        String(number),
        "--repo",
        repo,
        "--json",
        "comments",
      ])
      const parsed = parseJson(result.stdout) as { comments?: unknown }
      if (typeof parsed !== "object" || parsed === null) {
        reject(PARSE_ERROR)
      }
      const comments = parsed.comments
      if (comments === undefined) {
        return []
      }
      if (!Array.isArray(comments)) {
        reject(PARSE_ERROR)
      }
      return comments.map((c) => normalizeComment(c))
    },

    async addComment(number, body) {
      assertPositiveInteger(number)
      if (body.trim().length === 0) {
        reject("コメント本文が空です")
      }
      const result = await runGh(
        ["issue", "comment", String(number), "--repo", repo, "--body-file", "-"],
        body,
      )
      const line = firstNonemptyLine(result.stdout)
      if (line === null || !line.startsWith("https://")) {
        reject(PARSE_ERROR)
      }
      return { url: line }
    },

    async listPullRequestComments(number) {
      assertPositiveInteger(number)
      const result = await runGh([
        "pr",
        "view",
        String(number),
        "--repo",
        repo,
        "--json",
        "comments",
      ])
      const parsed = parseJson(result.stdout) as { comments?: unknown }
      if (typeof parsed !== "object" || parsed === null) {
        reject(PARSE_ERROR)
      }
      const comments = parsed.comments
      if (comments === undefined) {
        return []
      }
      if (!Array.isArray(comments)) {
        reject(PARSE_ERROR)
      }
      return comments.map((c) => normalizeComment(c))
    },

    async addPullRequestComment(number, body) {
      assertPositiveInteger(number)
      if (body.trim().length === 0) {
        reject("コメント本文が空です")
      }
      const result = await runGh(
        ["pr", "comment", String(number), "--repo", repo, "--body-file", "-"],
        body,
      )
      const line = firstNonemptyLine(result.stdout)
      if (line === null || !line.startsWith("https://")) {
        reject(PARSE_ERROR)
      }
      return { url: line }
    },

    async editLabels(number, change) {
      assertPositiveInteger(number)
      const add = change.add ?? []
      const remove = change.remove ?? []
      if (add.length === 0 && remove.length === 0) {
        reject("変更するラベルがありません")
      }
      for (const label of [...add, ...remove]) {
        assertLabelName(label)
      }
      const args = ["issue", "edit", String(number), "--repo", repo]
      if (add.length > 0) {
        args.push("--add-label", add.join(","))
      }
      if (remove.length > 0) {
        args.push("--remove-label", remove.join(","))
      }
      await runGh(args)
    },

    async createBranch(name, from) {
      assertBranchName(name)
      assertBranchName(from)
      const refPath = encodeBranchRefPath(from)
      const getResult = await runGh([
        "api",
        `repos/${parts.owner}/${parts.name}/git/ref/heads/${refPath}`,
      ])
      const refJson = parseJson(getResult.stdout) as {
        object?: { sha?: unknown }
      }
      const sha = refJson.object?.sha
      if (typeof sha !== "string" || sha.length === 0) {
        reject(PARSE_ERROR)
      }
      await runGh([
        "api",
        "--method",
        "POST",
        `repos/${parts.owner}/${parts.name}/git/refs`,
        "-f",
        `ref=refs/heads/${name}`,
        "-f",
        `sha=${sha}`,
      ])
    },

    async createPullRequest(input) {
      assertBranchName(input.base)
      assertBranchName(input.head)
      assertTitle(input.title)
      const payload = JSON.stringify({
        title: input.title,
        head: input.head,
        base: input.base,
        body: input.body,
      })
      const result = await runGh(
        [
          "api",
          "--method",
          "POST",
          `repos/${parts.owner}/${parts.name}/pulls`,
          "--input",
          "-",
        ],
        payload,
      )
      const parsed = parseJson(result.stdout) as {
        number?: unknown
        html_url?: unknown
      }
      const number = parsed.number
      const htmlUrl = parsed.html_url
      if (
        typeof number !== "number" ||
        !Number.isInteger(number) ||
        number < 1
      ) {
        reject(PARSE_ERROR)
      }
      if (typeof htmlUrl !== "string" || !htmlUrl.startsWith("https://")) {
        reject(PARSE_ERROR)
      }
      return { number, url: htmlUrl }
    },

    async getPullRequest(number) {
      assertPositiveInteger(number)
      const result = await runGh([
        "pr",
        "view",
        String(number),
        "--repo",
        repo,
        "--json",
        "number,url,state,mergedAt",
      ])
      return normalizePullRequest(parseJson(result.stdout))
    },

    async listPullRequests(query) {
      assertBranchName(query.head)
      const limit = query.limit ?? 100
      assertPullRequestLimit(limit)
      const result = await runGh([
        "pr",
        "list",
        "--repo",
        repo,
        "--head",
        query.head,
        "--state",
        "all",
        "--limit",
        String(limit),
        "--json",
        "number,url,state,mergedAt",
      ])
      const parsed = parseJson(result.stdout)
      if (!Array.isArray(parsed)) {
        reject(PARSE_ERROR)
      }
      return parsed.map((item) => normalizePullRequest(item))
    },

    async squashMerge(number) {
      assertPositiveInteger(number)
      await runGh([
        "pr",
        "merge",
        String(number),
        "--repo",
        repo,
        "--squash",
        "--delete-branch",
      ])
      const pr = await this.getPullRequest(number)
      if (!pr.merged) {
        reject(NOT_MERGED)
      }
    },

    async getLabel(name) {
      assertLabelName(name)
      const encoded = encodeURIComponent(name)
      const result = await ghCall(
        gh,
        ["api", `repos/${parts.owner}/${parts.name}/labels/${encoded}`],
        cwd,
      )
      if (result.exitCode !== 0) {
        if (result.stderr.includes("HTTP 404")) {
          return null
        }
        reject(failReason(result))
      }
      return parseLabelNameResponse(result.stdout, name)
    },

    async createLabel(input) {
      assertLabelName(input.name)
      assertLabelColor(input.color)
      assertLabelDescription(input.description)
      const payload = JSON.stringify({
        name: input.name,
        color: input.color,
        description: input.description,
      })
      const result = await ghCall(
        gh,
        [
          "api",
          "--method",
          "POST",
          `repos/${parts.owner}/${parts.name}/labels`,
          "--input",
          "-",
        ],
        cwd,
        payload,
      )
      if (result.exitCode !== 0) {
        reject(failReason(result))
      }
      parseLabelNameResponse(result.stdout, input.name)
    },

    async getDefaultBranch() {
      const result = await ghCall(
        gh,
        ["repo", "view", "--json", "defaultBranchRef"],
        cwd,
      )
      assertGhOk(result)
      const parsed = parseJson(result.stdout) as {
        defaultBranchRef?: { name?: unknown }
      }
      const name = parsed.defaultBranchRef?.name
      if (typeof name !== "string") {
        reject(PARSE_ERROR)
      }
      try {
        assertBranchName(name)
      } catch {
        reject(PARSE_ERROR)
      }
      return name
    },
  }
}

export async function resolveRepo(
  gh: GhRunner,
  cwd: string,
): Promise<string> {
  const result = await ghCall(gh, ["repo", "view", "--json", "nameWithOwner"], cwd)
  assertGhOk(result)
  const parsed = parseJson(result.stdout) as { nameWithOwner?: unknown }
  if (typeof parsed.nameWithOwner !== "string") {
    reject(PARSE_ERROR)
  }
  parseRepo(parsed.nameWithOwner)
  return parsed.nameWithOwner
}

export type GhStdin = {
  write(chunk: string): number | Promise<number | boolean | void>
  end(): void | Promise<void>
}

export async function writeGhStdin(
  stdin: GhStdin,
  data?: string,
): Promise<void> {
  if (data !== undefined) {
    const written = stdin.write(data)
    if (written instanceof Promise) {
      await written
    }
  }
  const ended = stdin.end()
  if (ended instanceof Promise) {
    await ended
  }
}

export const defaultGhRunner: GhRunner = {
  async run(args, options) {
    try {
      const proc = Bun.spawn(["gh", ...args], {
        cwd: options.cwd,
        env: process.env,
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
      })
      await writeGhStdin(proc.stdin, options.stdin)
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ])
      return { stdout, stderr, exitCode }
    } catch {
      reject("gh を実行できません")
    }
  },
}
