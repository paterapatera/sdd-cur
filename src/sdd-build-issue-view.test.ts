import { describe, expect, test } from "bun:test"
import { comment, issue } from "./sdd-test-support.ts"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  commentMarkers,
  reflectedCloseLine,
  reflectedOpenLine,
} from "./conventions.ts"
import { subagentFileNames } from "./install.ts"
import type { Issue, IssueComment } from "./github.ts"
import {
  applyIncorporatedAnswer,
  assertSpecWorkAllowed,
  buildIssueView,
  candidateViews,
  confirmationBody,
  listStartCandidates,
  loadIssueView,
  nextUnincorporatedAnswer,
  postConfirmation,
  readSpecFile,
  specHeading,
  specStatus,
  writeSpecFile,
  isQuickTarget,
} from "./sdd.ts"
describe("buildIssueView", () => {
  test("コメント順と nextAnswer", () => {
    const comments = [
      comment({
        id: "b",
        body: `${commentMarkers.answer}\nA2`,
        createdAt: "2020-01-02T00:00:00Z",
      }),
      comment({
        id: "c",
        body: `${commentMarkers.confirm}\nQ`,
        createdAt: "2020-01-03T00:00:00Z",
      }),
      comment({
        id: "a",
        body: `${commentMarkers.answer}\norphan`,
        createdAt: "2020-01-01T00:00:00Z",
      }),
    ]
    const view = buildIssueView({
      issue: issue({ number: 5 }),
      comments,
      requirements: { exists: false, markdown: "" },
      design: { exists: false, markdown: "" },
    })
    expect(view.comments.map((c) => c.id)).toEqual(["a", "b", "c"])
    expect(view.comments.every((c) => !("author" in c && c.author !== undefined))).toBe(
      true,
    )
    expect(view.unanswered[0].payload).toBe("Q")
    expect(view.nextAnswer).toBeNull()
  })

  test("反映済みが二つある要件は拒否する", () => {
    const bad = `${reflectedOpenLine}\n-->\n${reflectedOpenLine}\n${reflectedCloseLine}\n`
    expect(() =>
      buildIssueView({
        issue: issue({ number: 5 }),
        comments: [],
        requirements: { exists: true, markdown: bad },
        design: { exists: false, markdown: "" },
      }),
    ).toThrow("反映済みの記録が複数あります")
  })
})
