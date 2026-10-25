import type { GitRunner } from "./git.ts"
import type { Issue, IssueComment } from "./github.ts"
import { workflowLabels } from "./labels.ts"
import { pullRequestBody, startMarker } from "./runner.ts"

const runnerTestFormMarkerLine = "<!-- sdd-cur:form -->"

export function runnerTestRequirementsMarkdown(issueNumber: number): string {
  return `# ${issueNumber} 題
${runnerTestFormMarkerLine}
## 受け入れ条件
- 1. 条件: c 主体: s 結果: r
`
}

export function runnerTestDesignMarkdown(issueNumber: number): string {
  return `# ${issueNumber} 題
${runnerTestFormMarkerLine}
## 受け入れ条件
- 1. 条件: c 主体: s 結果: r
## 範囲外

## 決定

## 作業の一覧

- 1. ランナー用の作業 [1]

## テスト
- [1]
`
}

export function runnerTestDesignPair(issueNumber = 1) {
  return {
    requirements: {
      exists: true,
      markdown: runnerTestRequirementsMarkdown(issueNumber),
    },
    design: {
      exists: true,
      markdown: runnerTestDesignMarkdown(issueNumber),
    },
  }
}

export const RUNNER_TEST_WORK_LIST_LINE = "- [ ] 1. ランナー用の作業 [1]"

export function runnerTestPullRequestBody(
  issueUrl: string,
  payload: string,
): string {
  return pullRequestBody(issueUrl, payload, [RUNNER_TEST_WORK_LIST_LINE])
}

export function symrefLsRemoteGitRun(
  stdout = "ref: refs/heads/main\tHEAD\n",
): GitRunner["run"] {
  return async (args) => {
    if (args[0] === "ls-remote" && args[1] === "--symref") {
      return { stdout, stderr: "", exitCode: 0 }
    }
    return { stdout: "", stderr: "unexpected git call", exitCode: 1 }
  }
}

export function pullRequestWorkListGitExtras(overrides?: {
  branchOnlyCommitShas?: (
    remote: string,
    defaultBranch: string,
  ) => Promise<readonly string[]>
  commitMessage?: (sha: string) => Promise<string>
  run?: GitRunner["run"]
}) {
  const run = overrides?.run ?? symrefLsRemoteGitRun()
  return {
    run,
    async branchOnlyCommitShas(
      remote: string,
      defaultBranch: string,
    ): Promise<readonly string[]> {
      if (overrides?.branchOnlyCommitShas) {
        return await overrides.branchOnlyCommitShas(remote, defaultBranch)
      }
      return []
    },
    async commitMessage(sha: string): Promise<string> {
      if (overrides?.commitMessage) {
        return await overrides.commitMessage(sha)
      }
      return ""
    },
  }
}

export function startCommentBody(cloneId: string): string {
  return `${startMarker}\n${cloneId}`
}

export function ic(id: string, body: string, createdAt: string): IssueComment {
  return { id, body, author: "", createdAt }
}

export const LABEL_REQUEST = workflowLabels[0].name
export const LABEL_IN_PROGRESS = workflowLabels[1].name
export const LABEL_DONE = workflowLabels[2].name
export const LABEL_VERIFIED = workflowLabels[3].name
export const LABEL_MERGED = workflowLabels[4].name
export const LABEL_CONFLICT = workflowLabels[5].name
export const VIEWER_LOGIN = "octocat"

export function issue(partial: Partial<Issue> & Pick<Issue, "number">): Issue {
  return {
    title: "題",
    body: "",
    state: "open",
    labels: [LABEL_REQUEST],
    assignees: [VIEWER_LOGIN],
    url: "https://github.com/o/r/issues/1",
    ...partial,
  }
}

export function createIssueCommentStore(initial: IssueComment[] = []) {
  const comments = [...initial]
  let seq = comments.length
  return {
    comments,
    async listComments() {
      return [...comments]
    },
    recordStartComment(body: string) {
      if (!body.startsWith(`${startMarker}\n`)) {
        return false
      }
      seq += 1
      comments.push({
        id: `IC_start_${seq}`,
        body,
        author: "",
        createdAt: `2026-08-${String(seq).padStart(2, "0")}T00:00:00Z`,
      })
      return true
    },
  }
}
