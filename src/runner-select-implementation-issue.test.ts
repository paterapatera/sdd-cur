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
describe("selectImplementationIssue", () => {
  test("実装中と実装依頼なしと両方を除き number 昇順", () => {
    const issues = [
      issue({ number: 10 }),
      issue({ number: 2 }),
      issue({ number: 3, labels: [LABEL_IN_PROGRESS] }),
      issue({ number: 4, labels: [] }),
      issue({ number: 5, labels: [LABEL_REQUEST, LABEL_IN_PROGRESS] }),
    ]
    const before = issues.map((i) => ({ ...i, labels: [...i.labels] }))
    const selected = selectImplementationIssue(issues, VIEWER_LOGIN)
    expect(issues).toEqual(before)
    expect(selected?.number).toBe(2)
  })

  test("assignees に login が無い課題を除く", () => {
    const issues = [
      issue({ number: 1, assignees: ["other"] }),
      issue({ number: 2 }),
    ]
    expect(selectImplementationIssue(issues, VIEWER_LOGIN)?.number).toBe(2)
  })

  test("login が複数 assignees の一つなら残す", () => {
    const issues = [
      issue({ number: 3, assignees: ["other", VIEWER_LOGIN] }),
    ]
    expect(selectImplementationIssue(issues, VIEWER_LOGIN)?.number).toBe(3)
  })

  test("コンフリクトがある課題を返さない", () => {
    const issues = [
      issue({ number: 1, labels: [LABEL_REQUEST, LABEL_CONFLICT] }),
      issue({ number: 2 }),
    ]
    expect(selectImplementationIssue(issues, VIEWER_LOGIN)?.number).toBe(2)
  })
})
