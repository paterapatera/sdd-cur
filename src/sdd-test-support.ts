import type { Issue, IssueComment } from "./github.ts"

export function issue(partial: Partial<Issue> & Pick<Issue, "number">): Issue {
  return {
    title: "題",
    body: "",
    state: "open",
    labels: [],
    assignees: [],
    url: "https://example.com/1",
    ...partial,
  }
}

export function comment(
  partial: Partial<IssueComment> & Pick<IssueComment, "id" | "body">,
): IssueComment {
  return {
    author: "u",
    createdAt: "2020-01-01T00:00:00Z",
    ...partial,
  }
}
