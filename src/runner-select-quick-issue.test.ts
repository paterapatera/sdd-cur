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
describe("selectQuickIssue", () => {
  test("条件を満たす最小番号を返す", () => {
    const issues = [
      issue({ number: 10, body: "quick 対象", labels: [] }),
      issue({ number: 2, body: "quick 対象", labels: ["quick 対象"] }),
      issue({ number: 3, state: "closed", body: "quick 対象", labels: ["quick 対象"] }),
      issue({ number: 4, labels: [LABEL_REQUEST] }),
      issue({ number: 5, body: "quick 対象", labels: ["quick 対象"], assignees: ["other"] }),
      issue({ number: 6, body: "通常" }),
    ]
    expect(selectQuickIssue(issues, VIEWER_LOGIN)?.number).toBe(2)
  })
})
