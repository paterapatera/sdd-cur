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
describe("implementationBranch", () => {
  test("十進の課題番号を task- と連結する", () => {
    expect(implementationBranch(1)).toBe("task-1")
    expect(implementationBranch(17)).toBe("task-17")
  })
})
