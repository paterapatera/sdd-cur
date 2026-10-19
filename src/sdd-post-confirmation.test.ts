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
describe("postConfirmation", () => {
  const specs = { requirements: "", design: "" }

  test("未反映と未回答で addComment を呼ばない", async () => {
    let addCalls = 0
    const github = {
      async getIssue() {
        return issue({ number: 5 })
      },
      async listComments() {
        return [
          comment({
            id: "c1",
            body: `${commentMarkers.confirm}\nQ`,
            createdAt: "2020-01-01T00:00:00Z",
          }),
        ]
      },
      async addComment() {
        addCalls += 1
        return { url: "https://example.com/c" }
      },
    }
    await expect(
      postConfirmation(github, 5, "本文", specs),
    ).rejects.toThrow("未回答の確認があります")
    expect(addCalls).toBe(0)
  })

  test("反映済み id があるときは投稿できる", async () => {
    let body = ""
    const github = {
      async getIssue() {
        return issue({ number: 5 })
      },
      async listComments() {
        return [
          comment({
            id: "c1",
            body: `${commentMarkers.confirm}\nQ`,
            createdAt: "2020-01-01T00:00:00Z",
          }),
          comment({
            id: "a1",
            body: `${commentMarkers.answer}\nR`,
            createdAt: "2020-01-02T00:00:00Z",
          }),
        ]
      },
      async addComment(_n: number, text: string) {
        body = text
        return { url: "https://example.com/c" }
      },
    }
    const reflected = `<!-- sdd-cur:reflected\na1\n-->\n`
    const result = await postConfirmation(github, 5, "本文", {
      requirements: reflected,
      design: "",
    })
    expect(result.url).toBe("https://example.com/c")
    expect(body.startsWith(`${commentMarkers.confirm}\n`)).toBe(true)
  })
})
