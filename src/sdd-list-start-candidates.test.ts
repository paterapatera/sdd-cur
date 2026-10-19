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
describe("listStartCandidates", () => {
  test("listIssues を一回だけ呼ぶ", async () => {
    let calls = 0
    const github = {
      async listIssues(query?: { state?: string; limit?: number }) {
        calls += 1
        expect(query).toEqual({ state: "open", limit: 100 })
        return []
      },
    }
    await listStartCandidates(github)
    expect(calls).toBe(1)
  })
})
