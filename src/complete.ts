import type { GitHubClient, Issue } from "./github.ts"
import { workflowLabels } from "./labels.ts"
import { implementationBranch } from "./runner.ts"

const LABEL_VERIFIED = workflowLabels[3].name
const LABEL_MERGED = workflowLabels[4].name

const NO_VERIFIED = "動作確認OKがありません"
const NO_PR = "マージリクエストがありません"
const AMBIGUOUS_PR = "マージリクエストを特定できません"

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

export function selectCompletionIssue(
  issues: readonly Issue[],
  login: string,
): Issue | null {
  const filtered = issues.filter(
    (issue) =>
      issue.labels.includes(LABEL_VERIFIED) &&
      issue.assignees.includes(login),
  )
  const sorted = [...filtered].sort((a, b) => a.number - b.number)
  return sorted[0] ?? null
}

export async function completeIssue(
  github: {
    getIssue: GitHubClient["getIssue"]
    listPullRequests: GitHubClient["listPullRequests"]
    squashMerge: GitHubClient["squashMerge"]
    editLabels: GitHubClient["editLabels"]
  },
  issueNumber: number,
): Promise<void> {
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) {
    reject("番号が不正です")
  }

  const issue = await retryOnce(() => github.getIssue(issueNumber))
  const hasVerified = issue.labels.includes(LABEL_VERIFIED)
  const hasMerged = issue.labels.includes(LABEL_MERGED)
  if (!hasVerified) {
    if (hasMerged) {
      return
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
  if (!pr.merged) {
    await retryOnce(() => github.squashMerge(pr.number))
  }

  await retryOnce(() =>
    github.editLabels(issueNumber, {
      remove: [LABEL_VERIFIED],
      add: [LABEL_MERGED],
    }),
  )
}
