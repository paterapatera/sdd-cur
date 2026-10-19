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
describe("startComment", () => {
  test("空と空白を含む識別子を拒否する", () => {
    expect(() => startComment("")).toThrow("クローン識別子が不正です")
    expect(() => startComment(" ")).toThrow("クローン識別子が不正です")
    expect(() => startComment("a b")).toThrow("クローン識別子が不正です")
  })

  test("成功時は印と識別子の二行", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000"
    const body = startComment(id)
    const lines = body.split("\n")
    expect(lines[0]).toBe(startMarker)
    expect(lines[1]).toBe(id)
    expect(lines.length).toBe(2)
  })
})
