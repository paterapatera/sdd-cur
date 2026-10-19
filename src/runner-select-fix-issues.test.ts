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
describe("selectFixIssues", () => {
  test("ラベルと assignee で絞り number 昇順", () => {
    const issues = [
      issue({ number: 10, labels: [LABEL_DONE] }),
      issue({ number: 2, labels: [LABEL_DONE] }),
      issue({ number: 3, labels: [LABEL_IN_PROGRESS, LABEL_DONE] }),
      issue({ number: 4, labels: [LABEL_DONE, LABEL_VERIFIED] }),
      issue({ number: 5, labels: [LABEL_DONE, LABEL_MERGED] }),
      issue({ number: 6, labels: [] }),
      issue({ number: 7, labels: [LABEL_DONE], assignees: ["other"] }),
    ]
    const before = issues.map((i) => ({ ...i, labels: [...i.labels] }))
    const selected = selectFixIssues(issues, VIEWER_LOGIN)
    expect(issues).toEqual(before)
    expect(selected.map((i) => i.number)).toEqual([2, 10])
  })
})
