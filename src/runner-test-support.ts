import type { Issue, IssueComment } from "./github.ts"
import { workflowLabels } from "./labels.ts"
import { startMarker } from "./runner.ts"

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
