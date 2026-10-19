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
describe("loadIssueView", () => {
  test("不正な番号では getIssue を呼ばない", async () => {
    let getCalls = 0
    await expect(
      loadIssueView(
        {
          async getIssue() {
            getCalls += 1
            return issue({ number: 1 })
          },
          async listComments() {
            return []
          },
        },
        0,
        {
          requirements: { exists: false, markdown: "" },
          design: { exists: false, markdown: "" },
        },
      ),
    ).rejects.toThrow("番号が不正です")
    expect(getCalls).toBe(0)
  })

  test("getIssue が拒否したとき listComments を呼ばない", async () => {
    let listCalls = 0
    await expect(
      loadIssueView(
        {
          async getIssue() {
            throw new Error("失敗")
          },
          async listComments() {
            listCalls += 1
            return []
          },
        },
        5,
        {
          requirements: { exists: false, markdown: "" },
          design: { exists: false, markdown: "" },
        },
      ),
    ).rejects.toThrow("失敗")
    expect(listCalls).toBe(0)
  })
})
