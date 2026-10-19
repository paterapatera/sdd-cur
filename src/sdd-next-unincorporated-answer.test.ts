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
describe("nextUnincorporatedAnswer", () => {
  test("古い未反映を返す", () => {
    const comments = [
      comment({
        id: "c1",
        body: `${commentMarkers.confirm}\nQ1`,
        createdAt: "2020-01-01T00:00:00Z",
      }),
      comment({
        id: "a1",
        body: `${commentMarkers.answer}\nR1`,
        createdAt: "2020-01-02T00:00:00Z",
      }),
      comment({
        id: "c2",
        body: `${commentMarkers.confirm}\nQ2`,
        createdAt: "2020-01-03T00:00:00Z",
      }),
      comment({
        id: "a2",
        body: `${commentMarkers.answer}\nR2`,
        createdAt: "2020-01-04T00:00:00Z",
      }),
    ]
    const first = nextUnincorporatedAnswer(comments, {
      requirements: "",
      design: "",
    })
    expect(first?.id).toBe("a1")
    const second = nextUnincorporatedAnswer(comments, {
      requirements: "",
      design: `<!-- sdd-cur:reflected\na1\n-->\n`,
    })
    expect(second?.id).toBe("a2")
  })
})
