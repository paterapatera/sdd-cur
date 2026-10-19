import { describe, expect, mock, spyOn, test } from "bun:test"
import {
  ic,
  startCommentBody,
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
describe("decideStartClaim", () => {
  test("古い識別子が continue で新しい識別子が yield", () => {
    const comments = [
      ic("1", startCommentBody("old"), "2026-01-02T00:00:00Z"),
      ic("2", startCommentBody("new"), "2026-01-03T00:00:00Z"),
    ]
    const before = comments.map((c) => ({ ...c }))
    expect(decideStartClaim(comments, "old", null)).toBe("continue")
    expect(decideStartClaim(comments, "new", null)).toBe("yield")
    expect(comments).toEqual(before)
  })

  test("createdAt が同じとき id が小さいほうが continue", () => {
    const comments = [
      ic("b", startCommentBody("second"), "2026-01-01T00:00:00Z"),
      ic("a", startCommentBody("first"), "2026-01-01T00:00:00Z"),
    ]
    expect(decideStartClaim(comments, "first", null)).toBe("continue")
    expect(decideStartClaim(comments, "second", null)).toBe("yield")
  })

  test("基準時刻以前の着手は競合に入らない", () => {
    const comments = [
      ic("1", startCommentBody("old"), "2026-01-01T00:00:00Z"),
      ic("2", "通常\n本文", "2026-01-02T00:00:00Z"),
      ic("eq", startCommentBody("same-time"), "2026-01-02T00:00:00Z"),
      ic("3", startCommentBody("mine"), "2026-01-03T00:00:00Z"),
    ]
    expect(decideStartClaim(comments, "mine", "2026-01-02T00:00:00Z")).toBe(
      "continue",
    )
    expect(decideStartClaim(comments, "old", "2026-01-02T00:00:00Z")).toBe(
      "unseen",
    )
    expect(
      decideStartClaim(comments, "same-time", "2026-01-02T00:00:00Z"),
    ).toBe("unseen")
  })

  test("印の行の前に空白があるコメントは着手ではない", () => {
    const comments = [
      ic("1", ` ${startMarker}\nignored`, "2026-01-01T00:00:00Z"),
    ]
    expect(decideStartClaim(comments, "ignored", null)).toBe("unseen")
  })
})
