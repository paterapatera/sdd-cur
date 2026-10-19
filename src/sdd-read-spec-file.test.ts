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
describe("readSpecFile", () => {
  test("無いパスとディレクトリ", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-read-"))
    try {
      const missing = await readSpecFile(path.join(temp, "none.md"))
      expect(missing).toEqual({ exists: false, markdown: "" })
      await mkdir(path.join(temp, "dir"))
      await expect(readSpecFile(path.join(temp, "dir"))).rejects.toThrow(
        "仕様を読めません",
      )
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("writeSpecFile はそのまま書く", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-write-"))
    try {
      const file = path.join(temp, "a", "b.md")
      await writeSpecFile(file, "x")
      expect(await readFile(file, "utf8")).toBe("x")
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})
