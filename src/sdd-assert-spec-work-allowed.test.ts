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
describe("assertSpecWorkAllowed", () => {
  test("閉じた課題を先に拒否する", () => {
    expect(() =>
      assertSpecWorkAllowed(
        issue({ number: 1, state: "closed", labels: ["実装依頼"] }),
      ),
    ).toThrow("課題は閉じています")
    expect(() =>
      assertSpecWorkAllowed(issue({ number: 1, labels: ["実装依頼"] })),
    ).toThrow("実装のラベルが付いています")
  })
})
