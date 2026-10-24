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
describe("isQuickTarget", () => {
  test("ラベルの quick 対象だけが true", () => {
    expect(
      isQuickTarget({ body: "本文に quick 対象 を含む", labels: [] }),
    ).toBe(false)
    expect(isQuickTarget({ body: "", labels: ["quick 対象"] })).toBe(true)
    expect(isQuickTarget({ body: "", labels: [] })).toBe(false)
    expect(isQuickTarget({ body: "quick対象", labels: [] })).toBe(false)
    expect(isQuickTarget({ body: "Quick 対象", labels: [] })).toBe(false)
  })
})
