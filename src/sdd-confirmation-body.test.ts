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
describe("confirmationBody", () => {
  test("空と印を拒否し payload の空白は残す", () => {
    expect(() => confirmationBody("")).toThrow("確認の本文が空です")
    expect(() => confirmationBody(`${commentMarkers.confirm}\n`)).toThrow(
      "確認の本文に印を含めない",
    )
    const body = confirmationBody(" 本文  ")
    expect(body.startsWith(`${commentMarkers.confirm}\n`)).toBe(true)
    expect(body.endsWith(" 本文  ")).toBe(true)
  })
})
