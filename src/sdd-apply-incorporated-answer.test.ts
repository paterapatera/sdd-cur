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
describe("applyIncorporatedAnswer", () => {
  test("設計で要件が無いとき拒否する", () => {
    expect(() =>
      applyIncorporatedAnswer({
        issueNumber: 5,
        kind: "design",
        requirements: { exists: false, markdown: "" },
        design: { exists: false, markdown: "" },
        comments: [],
        edited: "# 5 設計",
      }),
    ).toThrow("要件がありません")
  })

  test("反映済みブロックの後ろに本文がある edited は拒否する", () => {
    const edited = `# 5 題\n本文\n${reflectedOpenLine}\nid\n${reflectedCloseLine}\n後`
    expect(() =>
      applyIncorporatedAnswer({
        issueNumber: 5,
        kind: "requirements",
        requirements: { exists: true, markdown: "# 5 題\n" },
        design: { exists: false, markdown: "" },
        comments: [
          comment({
            id: "c",
            body: `${commentMarkers.confirm}\nQ`,
            createdAt: "1",
          }),
          comment({
            id: "a",
            body: `${commentMarkers.answer}\nR`,
            createdAt: "2",
          }),
        ],
        edited,
      }),
    ).toThrow("反映済みの記録を解釈できません")
  })

  test("ディスクに無く edited にだけある決定は成功する", () => {
    const comments = [
      comment({
        id: "c",
        body: `${commentMarkers.confirm}\nQ`,
        createdAt: "1",
      }),
      comment({
        id: "a-old",
        body: `${commentMarkers.answer}\nR1`,
        createdAt: "2",
      }),
      comment({
        id: "c2",
        body: `${commentMarkers.confirm}\nQ2`,
        createdAt: "3",
      }),
      comment({
        id: "a-new",
        body: `${commentMarkers.answer}\nR2`,
        createdAt: "4",
      }),
    ]
    const result = applyIncorporatedAnswer({
      issueNumber: 5,
      kind: "requirements",
      requirements: { exists: true, markdown: "# 5 題\n" },
      design: { exists: false, markdown: "" },
      comments,
      edited: "# 5 題\n決定\n",
    })
    expect(result.answerId).toBe("a-old")
    expect(result.requirements).toContain("a-old")
    expect(result.requirements).not.toContain("a-new")
  })
})
