import type { GitHubClient, Issue, PullRequest } from "./github.ts"
import type { GitClient } from "./git.ts"
import { workflowLabels } from "./labels.ts"
import { implementationBranch } from "./runner.ts"

const LABEL_VERIFIED = workflowLabels[3].name
const LABEL_MERGED = workflowLabels[4].name
const LABEL_CONFLICT = workflowLabels[5].name

const NO_VERIFIED = "動作確認OKがありません"
const NO_PR = "マージリクエストがありません"
const AMBIGUOUS_PR = "マージリクエストを特定できません"

export type CompleteResult = "completed" | "conflict"

function reject(message: string): never {
  throw new Error(message)
}

async function retryOnce<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch {
    return await fn()
  }
}

export function conflictFileComment(files: readonly string[]): string {
  const sorted = [...files]
    .filter((f) => f.length > 0)
    .sort((a, b) => a.localeCompare(b))
  return ["コンフリクトしたファイル", ...sorted].join("\n")
}

export function selectCompletionIssue(
  issues: readonly Issue[],
  login: string,
): Issue | null {
  const filtered = issues.filter(
    (issue) =>
      issue.labels.includes(LABEL_VERIFIED) &&
      !issue.labels.includes(LABEL_CONFLICT) &&
      issue.assignees.includes(login),
  )
  const sorted = [...filtered].sort((a, b) => a.number - b.number)
  return sorted[0] ?? null
}

async function reportCompletionConflict(
  github: {
    addComment: GitHubClient["addComment"]
    addPullRequestComment: GitHubClient["addPullRequestComment"]
    editLabels: GitHubClient["editLabels"]
  },
  issueNumber: number,
  pullRequest: PullRequest,
  files: readonly string[],
): Promise<void> {
  const body = conflictFileComment(files)
  if (pullRequest.state === "open") {
    await retryOnce(() =>
      github.addPullRequestComment(pullRequest.number, body),
    )
  } else {
    await retryOnce(() => github.addComment(issueNumber, body))
  }
  await retryOnce(() =>
    github.editLabels(issueNumber, {
      remove: [LABEL_VERIFIED],
      add: [LABEL_CONFLICT],
    }),
  )
}

export async function completeIssue(
  github: {
    getIssue: GitHubClient["getIssue"]
    listPullRequests: GitHubClient["listPullRequests"]
    getDefaultBranch: GitHubClient["getDefaultBranch"]
    addComment: GitHubClient["addComment"]
    addPullRequestComment: GitHubClient["addPullRequestComment"]
    squashMerge: GitHubClient["squashMerge"]
    editLabels: GitHubClient["editLabels"]
  },
  git: {
    remoteName: GitClient["remoteName"]
    fetch: GitClient["fetch"]
    checkoutFetched: GitClient["checkoutFetched"]
    mergeFetched: GitClient["mergeFetched"]
    push: GitClient["push"]
  },
  issueNumber: number,
): Promise<CompleteResult> {
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) {
    reject("番号が不正です")
  }

  const issue = await retryOnce(() => github.getIssue(issueNumber))
  const hasVerified = issue.labels.includes(LABEL_VERIFIED)
  const hasMerged = issue.labels.includes(LABEL_MERGED)
  if (!hasVerified) {
    if (hasMerged) {
      return "completed"
    }
    reject(NO_VERIFIED)
  }

  const head = implementationBranch(issueNumber)
  const pullRequests = await retryOnce(() =>
    github.listPullRequests({ head, limit: 100 }),
  )
  if (pullRequests.length === 0) {
    reject(NO_PR)
  }
  if (pullRequests.length > 1) {
    reject(AMBIGUOUS_PR)
  }
  const pr = pullRequests[0]!
  if (pr.merged) {
    await retryOnce(() =>
      github.editLabels(issueNumber, {
        remove: [LABEL_VERIFIED],
        add: [LABEL_MERGED],
      }),
    )
    return "completed"
  }

  const remote = await retryOnce(() => git.remoteName())
  await retryOnce(() => git.fetch(remote, head))
  await retryOnce(() => git.checkoutFetched(head))

  const defaultBranch = await retryOnce(() => github.getDefaultBranch())
  await retryOnce(() => git.fetch(remote, defaultBranch))
  const mergeResult = await git.mergeFetched()
  if (mergeResult.status === "conflict") {
    await reportCompletionConflict(github, issueNumber, pr, mergeResult.files)
    return "conflict"
  }

  await retryOnce(() => git.push(remote, head))

  const subject = `【課題 ${issueNumber}】${issue.title}`
  await retryOnce(() => github.squashMerge(pr.number, subject))

  await retryOnce(() =>
    github.editLabels(issueNumber, {
      remove: [LABEL_VERIFIED],
      add: [LABEL_MERGED],
    }),
  )
  return "completed"
}
