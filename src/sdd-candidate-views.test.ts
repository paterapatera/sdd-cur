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
describe("candidateViews", () => {
  test("業務ラベルと閉じた課題を除き number 昇順", () => {
    const issues = [
      issue({ number: 10, state: "open" }),
      issue({ number: 2, state: "open" }),
      issue({ number: 3, state: "closed" }),
      issue({ number: 4, state: "open", labels: ["実装依頼"] }),
      issue({ number: 5, state: "open", labels: ["misc"] }),
    ]
    const before = [...issues]
    const views = candidateViews(issues)
    expect(issues).toEqual(before)
    expect(views.map((v) => v.number)).toEqual([2, 5, 10])
  })
})
