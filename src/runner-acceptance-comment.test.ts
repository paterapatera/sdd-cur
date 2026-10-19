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
describe("acceptanceComment", () => {
  test("空と印を拒否し成功時は印と payload", () => {
    expect(() => acceptanceComment("   ")).toThrow("受け入れ手順が空です")
    expect(() => acceptanceComment("sdd-cur: 確認\nx")).toThrow(
      "受け入れ手順に印を含めない",
    )
    const body = acceptanceComment(" 手順  ")
    expect(body.startsWith(`${commentMarkers.acceptance}\n`)).toBe(true)
    expect(body.endsWith(" 手順  ")).toBe(true)
  })
})
