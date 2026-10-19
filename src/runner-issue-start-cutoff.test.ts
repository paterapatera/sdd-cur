import { describe, expect, mock, spyOn, test } from "bun:test"
import { ic, startCommentBody } from "./runner-test-support.ts"
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
describe("issueStartCutoff", () => {
  test("着手を除いた最新 createdAt", () => {
    const comments = [
      ic("1", startCommentBody("x"), "2026-01-05T00:00:00Z"),
      ic("2", "plain", "2026-01-03T00:00:00Z"),
      ic("3", "other", "2026-01-04T00:00:00Z"),
    ]
    expect(issueStartCutoff(comments)).toBe("2026-01-04T00:00:00Z")
    expect(issueStartCutoff([ic("1", startCommentBody("x"), "2026-01-01")]))
      .toBeNull()
  })
})
