import { describe, expect, mock, spyOn, test } from "bun:test"
import {
  createIssueCommentStore,
  issue,
  LABEL_CONFLICT,
  LABEL_DONE,
  LABEL_IN_PROGRESS,
  LABEL_MERGED,
  LABEL_REQUEST,
  LABEL_VERIFIED,
  VIEWER_LOGIN,
} from "./runner-test-support.ts"
import * as nodeCrypto from "node:crypto"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  commentMarkers,
  pullRequestCommentMarkers,
} from "./conventions.ts"
import { selectCompletionIssue } from "./complete.ts"
import {
  acceptanceComment,
  classifyFixPullRequests,
  createRunner,
  implementationBranch,
  issueHasFixLabels,
  pullRequestBody,
  selectFixIssues,
  selectImplementationIssue,
  selectQuickIssue,
  decideStartClaim,
  issueStartCutoff,
  latestCreatedAt,
  startComment,
  startMarker,
} from "./runner.ts"
describe("classifyFixPullRequests", () => {
  test("件数と open", () => {
    expect(classifyFixPullRequests([]).kind).toBe("none")
    expect(
      classifyFixPullRequests([
        { number: 1, url: "", state: "open", merged: false },
        { number: 2, url: "", state: "open", merged: false },
      ]).kind,
    ).toBe("ambiguous")
    const open = classifyFixPullRequests([
      { number: 1, url: "", state: "open", merged: false },
    ])
    expect(open.kind).toBe("open")
    if (open.kind === "open") {
      expect(open.pullRequest.number).toBe(1)
    }
    expect(
      classifyFixPullRequests([
        { number: 1, url: "", state: "merged", merged: true },
      ]).kind,
    ).toBe("not-open")
    expect(
      classifyFixPullRequests([
        { number: 1, url: "", state: "closed", merged: false },
      ]).kind,
    ).toBe("not-open")
  })
})
