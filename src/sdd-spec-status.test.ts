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
describe("specStatus", () => {
  test("無いときと空行だけは missing", () => {
    expect(specStatus(false, "", 5)).toBe("missing")
    expect(specStatus(true, "\n\n", 5)).toBe("missing")
  })

  test("見出しが違うとき invalid、正しいとき ready", () => {
    expect(specStatus(true, "# 4 x", 5)).toBe("invalid")
    expect(specStatus(true, "# 5 題", 5)).toBe("ready")
  })
})
