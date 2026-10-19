import { describe, expect, mock, spyOn, test } from "bun:test"
import {
  createIssueCommentStore,
  ic,
  issue,
  LABEL_CONFLICT,
  LABEL_DONE,
  LABEL_IN_PROGRESS,
  LABEL_MERGED,
  LABEL_REQUEST,
  LABEL_VERIFIED,
  startCommentBody,
  VIEWER_LOGIN,
} from "./runner-test-support.ts"
import * as nodeCrypto from "node:crypto"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  commentMarkers,
  pullRequestCommentMarkers,
} from "./conventions.ts"
import { selectCompletionIssue } from "./complete.ts"
import {
  acceptanceComment,
  classifyFixPullRequests,
  createRunner,
  implementationBranch,
  issueHasFixLabels,
  pullRequestBody,
  selectFixIssues,
  selectImplementationIssue,
  selectQuickIssue,
  decideStartClaim,
  issueStartCutoff,
  latestCreatedAt,
  startComment,
  startMarker,
} from "./runner.ts"
describe("createRunner start claim", () => {
  test("実装の着手は listComments と着手 addComment のあと editLabels", async () => {
    const ghLog: string[] = []
    const procedurePath = "/tmp/start-claim-proc.txt"
    await writeFile(procedurePath, "手順", "utf8")
    const startIssueComments = createIssueCommentStore()
    let postedStartId = ""
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 9, url: "https://issue/9" })
        },
        async listComments() {
          ghLog.push("listComments")
          return startIssueComments.listComments()
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            postedStartId = body.split("\n")[1] ?? ""
            ghLog.push("addComment:start")
            return { url: "https://start" }
          }
          ghLog.push("addComment:pr")
          return { url: "https://c" }
        },
        async editLabels(_n, change) {
          if (change.add?.includes(LABEL_IN_PROGRESS)) {
            ghLog.push("editLabels:start")
          } else {
            ghLog.push("editLabels:done")
          }
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          ghLog.push("createPullRequest")
          return { number: 1, url: "https://pr" }
        },
        async listPullRequests() {
          return []
        },
        async listPullRequestComments() {
          return []
        },
        async addPullRequestComment() {
          return { url: "https://c" }
        },
        async squashMerge() {},
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async mergeFetched() {
          return { status: "merged" as const }
        },
        async headCommit() {
          return "deadbeef"
        },
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {
          ghLog.push("push")
        },
      },
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })
    await runner.process({ id: "9" })
    expect(ghLog.slice(0, 5)).toEqual([
      "listComments",
      "addComment:start",
      "listComments",
      "listComments",
      "editLabels:start",
    ])
    expect(postedStartId.length).toBeGreaterThan(0)
    await rm(procedurePath, { force: true })
  })

  test("書いたあとに自分より古い他識別子があるとき editLabels と fetch を呼ばない", async () => {
    const ghLog: string[] = []
    let listCall = 0
    let myCloneId = ""
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 1 })
        },
        async listComments() {
          listCall += 1
          ghLog.push("listComments")
          if (listCall === 1) {
            return []
          }
          if (listCall === 2) {
            return [
              ic(
                "older",
                startCommentBody("other-clone"),
                "2026-08-01T00:00:00Z",
              ),
              ic(
                "mine",
                startCommentBody(myCloneId),
                "2026-08-02T00:00:00Z",
              ),
            ]
          }
          return startIssueComments.listComments()
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            myCloneId = body.split("\n")[1] ?? ""
            ghLog.push("addComment:start")
            return { url: "https://start" }
          }
          return { url: "https://c" }
        },
        async editLabels() {
          ghLog.push("editLabels")
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          ghLog.push("createPullRequest")
          return { number: 1, url: "https://pr" }
        },
        async listPullRequests() {
          return []
        },
        async listPullRequestComments() {
          return []
        },
        async addPullRequestComment() {
          return { url: "https://c" }
        },
        async squashMerge() {},
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {
          ghLog.push("fetch")
        },
        async checkoutFetched() {
          ghLog.push("checkoutFetched")
        },
        async headCommit() {
          return "deadbeef"
        },
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {
          ghLog.push("push")
        },
      },
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await runner.process({ id: "1" })
    expect(ghLog).toEqual([
      "listComments",
      "addComment:start",
      "listComments",
    ])
    expect(myCloneId.length).toBeGreaterThan(0)
  })

  test("最初の listComments に古い他識別子と自分があるとき addComment も editLabels も呼ばない", async () => {
    const ghLog: string[] = []
    const uuidSpy = spyOn(nodeCrypto, "randomUUID").mockReturnValue("mine-id")
    try {
      const runner = createRunner({
        github: {
          async viewerLogin() {
            return VIEWER_LOGIN
          },
          async listIssues() {
            return []
          },
          async getIssue() {
            return issue({ number: 1 })
          },
          async listComments() {
            ghLog.push("listComments")
            return [
              ic(
                "older",
                startCommentBody("other-clone"),
                "2026-08-01T00:00:00Z",
              ),
              ic("mine", startCommentBody("mine-id"), "2026-08-02T00:00:00Z"),
            ]
          },
          async addComment() {
            ghLog.push("addComment:start")
            return { url: "https://start" }
          },
          async editLabels() {
            ghLog.push("editLabels")
          },
          async getDefaultBranch() {
            return "main"
          },
          async createBranch() {},
          async createPullRequest() {
            ghLog.push("createPullRequest")
            return { number: 1, url: "https://pr" }
          },
          async listPullRequests() {
            return []
          },
          async listPullRequestComments() {
            return []
          },
          async addPullRequestComment() {
            return { url: "https://c" }
          },
          async squashMerge() {},
        },
        git: {
          async remoteName() {
            return "origin"
          },
          async fetch() {
            ghLog.push("fetch")
          },
          async checkoutFetched() {
            ghLog.push("checkoutFetched")
          },
          async headCommit() {
            return "deadbeef"
          },
          async hasChanges() {
            return true
          },
          async commitAll() {},
          async push() {
            ghLog.push("push")
          },
        },
        agent: { async implement() {}, async quick() {} },
        createProcedureFile: async () => ({
          path: "/tmp/p",
          async remove() {},
        }),
      })
      await runner.process({ id: "1" })
      expect(ghLog).toEqual(["listComments"])
    } finally {
      uuidSpy.mockRestore()
      mock.restore()
    }
  })

  test("listComments が常に空のとき editLabels を呼ばない", async () => {
    const ghLog: string[] = []
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 1 })
        },
        async listComments() {
          ghLog.push("listComments")
          return []
        },
        async addComment(_n, body) {
          if (body.startsWith(`${startMarker}\n`)) {
            ghLog.push("addComment:start")
            return { url: "https://start" }
          }
          return { url: "https://c" }
        },
        async editLabels() {
          ghLog.push("editLabels")
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async listPullRequests() {
          return []
        },
        async listPullRequestComments() {
          return []
        },
        async addPullRequestComment() {
          return { url: "https://c" }
        },
        async squashMerge() {},
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async headCommit() {
          return "deadbeef"
        },
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
      },
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await runner.process({ id: "1" })
    expect(ghLog).toEqual([
      "listComments",
      "addComment:start",
      "listComments",
      "listComments",
    ])
  })

  test("quick は listComments が常に空のとき editLabels を呼ばない", async () => {
    const ghLog: string[] = []
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 1, body: "quick 対象", labels: [] })
        },
        async listComments() {
          ghLog.push("listComments")
          return []
        },
        async addComment(_n, body) {
          if (body.startsWith(`${startMarker}\n`)) {
            ghLog.push("addComment:start")
            return { url: "https://start" }
          }
          return { url: "https://c" }
        },
        async editLabels() {
          ghLog.push("editLabels")
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async listPullRequests() {
          return []
        },
        async listPullRequestComments() {
          return []
        },
        async addPullRequestComment() {
          return { url: "https://c" }
        },
        async squashMerge() {},
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {
          ghLog.push("checkoutFetched")
        },
        async headCommit() {
          return "deadbeef"
        },
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
      },
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await runner.process({ id: "1" })
    expect(ghLog).toEqual([
      "listComments",
      "addComment:start",
      "listComments",
      "listComments",
    ])
    expect(ghLog).not.toContain("checkoutFetched")
  })

  test("quick は最初の listComments に古い他識別子と自分があるとき addComment も editLabels も呼ばない", async () => {
    const ghLog: string[] = []
    const uuidSpy = spyOn(nodeCrypto, "randomUUID").mockReturnValue("mine-id")
    try {
      const runner = createRunner({
        github: {
          async viewerLogin() {
            return VIEWER_LOGIN
          },
          async listIssues() {
            return []
          },
          async getIssue() {
            return issue({ number: 1, body: "quick 対象", labels: [] })
          },
          async listComments() {
            ghLog.push("listComments")
            return [
              ic(
                "older",
                startCommentBody("other-clone"),
                "2026-08-01T00:00:00Z",
              ),
              ic("mine", startCommentBody("mine-id"), "2026-08-02T00:00:00Z"),
            ]
          },
          async addComment() {
            ghLog.push("addComment:start")
            return { url: "https://start" }
          },
          async editLabels() {
            ghLog.push("editLabels")
          },
          async getDefaultBranch() {
            return "main"
          },
          async createBranch() {},
          async createPullRequest() {
            return { number: 1, url: "https://pr" }
          },
          async listPullRequests() {
            return []
          },
          async listPullRequestComments() {
            return []
          },
          async addPullRequestComment() {
            return { url: "https://c" }
          },
          async squashMerge() {},
        },
        git: {
          async remoteName() {
            return "origin"
          },
          async fetch() {},
          async checkoutFetched() {
            ghLog.push("checkoutFetched")
          },
          async headCommit() {
            return "deadbeef"
          },
          async hasChanges() {
            return true
          },
          async commitAll() {},
          async push() {},
        },
        agent: { async implement() {}, async quick() {} },
        createProcedureFile: async () => ({
          path: "/tmp/p",
          async remove() {},
        }),
      })
      await runner.process({ id: "1" })
      expect(ghLog).toEqual(["listComments"])
      expect(ghLog).not.toContain("checkoutFetched")
    } finally {
      uuidSpy.mockRestore()
      mock.restore()
    }
  })

  test("quick は書いたあとに自分より古い他識別子があるとき checkoutFetched と editLabels を呼ばない", async () => {
    const ghLog: string[] = []
    let listCall = 0
    let myCloneId = ""
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 1, body: "quick 対象", labels: [] })
        },
        async listComments() {
          listCall += 1
          ghLog.push("listComments")
          if (listCall === 1) {
            return []
          }
          if (listCall === 2) {
            return [
              ic(
                "older",
                startCommentBody("other-clone"),
                "2026-08-01T00:00:00Z",
              ),
              ic(
                "mine",
                startCommentBody(myCloneId),
                "2026-08-02T00:00:00Z",
              ),
            ]
          }
          return startIssueComments.listComments()
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            myCloneId = body.split("\n")[1] ?? ""
            ghLog.push("addComment:start")
            return { url: "https://start" }
          }
          return { url: "https://c" }
        },
        async editLabels(_n, change) {
          ghLog.push(
            `editLabels:remove=${change.remove?.join(",") ?? ""}:add=${change.add?.join(",") ?? ""}`,
          )
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async listPullRequests() {
          return []
        },
        async listPullRequestComments() {
          return []
        },
        async addPullRequestComment() {
          return { url: "https://c" }
        },
        async squashMerge() {},
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {
          ghLog.push("checkoutFetched")
        },
        async headCommit() {
          return "deadbeef"
        },
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
      },
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await runner.process({ id: "1" })
    expect(ghLog).toEqual([
      "listComments",
      "addComment:start",
      "listComments",
    ])
    expect(ghLog).not.toContain("checkoutFetched")
    expect(ghLog.some((e) => e.startsWith("editLabels"))).toBe(false)
  })

  test("quick が続けるとき editLabels は実装中だけを付け実装依頼は外さない", async () => {
    const labelChanges: { remove?: string[]; add?: string[] }[] = []
    const startIssueComments = createIssueCommentStore()
    const quickPath = "/tmp/quick-start-claim.txt"
    await writeFile(quickPath, "続行\n", "utf8")
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 1, body: "quick 対象", labels: [] })
        },
        async listComments() {
          return startIssueComments.listComments()
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            return { url: "https://start" }
          }
          return { url: "https://c" }
        },
        async editLabels(_n, change) {
          labelChanges.push(change)
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async listPullRequests() {
          return []
        },
        async listPullRequestComments() {
          return []
        },
        async addPullRequestComment() {
          return { url: "https://c" }
        },
        async squashMerge() {},
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async headCommit() {
          return "deadbeef"
        },
        async hasChanges() {
          return false
        },
        async commitAll() {},
        async push() {},
      },
      agent: {
        async implement() {},
        async quick() {},
      },
      createProcedureFile: async () => ({
        path: quickPath,
        async remove() {},
      }),
    })
    try {
      await runner.process({ id: "1" })
    } catch {
      // 着手の editLabels まで進めば足りる
    }
    const startEdit = labelChanges.find((c) =>
      c.add?.includes(LABEL_IN_PROGRESS),
    )
    expect(startEdit).toBeDefined()
    expect(startEdit?.remove ?? []).not.toContain(LABEL_REQUEST)
    await rm(quickPath, { force: true })
  })

  test("修正は未処理が無いとき着手 addComment を呼ばない", async () => {
    const ghLog: string[] = []
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 2, labels: [LABEL_DONE] })
        },
        async listComments() {
          ghLog.push("listComments")
          return startIssueComments.listComments()
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            ghLog.push("addComment:start")
            return { url: "https://start" }
          }
          return { url: "https://c" }
        },
        async editLabels() {
          ghLog.push("editLabels")
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async listPullRequests() {
          return [{ number: 1, url: "https://pr", state: "open", merged: false }]
        },
        async listPullRequestComments() {
          return []
        },
        async addPullRequestComment() {
          ghLog.push("addPullRequestComment")
          return { url: "https://c" }
        },
        async squashMerge() {},
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {
          ghLog.push("fetch")
        },
        async checkoutFetched() {
          ghLog.push("checkoutFetched")
        },
        async headCommit() {
          return "deadbeef"
        },
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {
          ghLog.push("push")
        },
      },
      agent: { async implement() {}, async fix() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await runner.process({ id: "2" })
    expect(ghLog).not.toContain("addComment:start")
    expect(ghLog).not.toContain("listComments")
  })

  test("修正は続けないとき fetch と editLabels を呼ばない", async () => {
    const ghLog: string[] = []
    let listCall = 0
    let myCloneId = ""
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 3, labels: [LABEL_DONE] })
        },
        async listComments() {
          listCall += 1
          ghLog.push("listComments")
          if (listCall === 1) {
            return []
          }
          if (listCall === 2) {
            return [
              ic(
                "older",
                startCommentBody("other-clone"),
                "2026-08-01T00:00:00Z",
              ),
              ic(
                "mine",
                startCommentBody(myCloneId),
                "2026-08-02T00:00:00Z",
              ),
            ]
          }
          return startIssueComments.listComments()
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            myCloneId = body.split("\n")[1] ?? ""
            ghLog.push("addComment:start")
            return { url: "https://start" }
          }
          return { url: "https://c" }
        },
        async editLabels() {
          ghLog.push("editLabels")
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async listPullRequests() {
          return [{ number: 7, url: "https://pr/7", state: "open", merged: false }]
        },
        async listPullRequestComments() {
          return [
            {
              id: "IC_bug1",
              body: `${pullRequestCommentMarkers.bug}\n不具合`,
              author: "u",
              createdAt: "2026-02-01T00:00:00Z",
            },
          ]
        },
        async addPullRequestComment() {
          ghLog.push("addPullRequestComment")
          return { url: "https://c" }
        },
        async squashMerge() {},
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {
          ghLog.push("fetch")
        },
        async checkoutFetched() {
          ghLog.push("checkoutFetched")
        },
        async headCommit() {
          return "deadbeef"
        },
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {
          ghLog.push("push")
        },
      },
      agent: { async implement() {}, async fix() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await runner.process({ id: "3" })
    expect(ghLog).toEqual([
      "listComments",
      "addComment:start",
      "listComments",
    ])
    expect(ghLog).not.toContain("fetch")
    expect(ghLog).not.toContain("checkoutFetched")
    expect(ghLog).not.toContain("push")
    expect(ghLog).not.toContain("addPullRequestComment")
    expect(ghLog).not.toContain("editLabels")
  })

  test("修正は会話の基準時刻より前の課題着手では止まらない", async () => {
    const ghLog: string[] = []
    const startIssueComments = createIssueCommentStore()
    const procedurePath = "/tmp/fix-cutoff-proc.txt"
    await writeFile(procedurePath, "再確認手順", "utf8")
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 4, labels: [LABEL_DONE] })
        },
        async listComments() {
          ghLog.push("listComments")
          const stored = await startIssueComments.listComments()
          return [
            ic(
              "old-issue-start",
              startCommentBody("other-clone"),
              "2026-01-01T00:00:00Z",
            ),
            ...stored,
          ]
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            ghLog.push("addComment:start")
            return { url: "https://start" }
          }
          return { url: "https://c" }
        },
        async editLabels(_n, change) {
          if (change.add?.includes(LABEL_IN_PROGRESS)) {
            ghLog.push("editLabels:start")
          }
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async listPullRequests() {
          return [{ number: 9, url: "https://pr/9", state: "open", merged: false }]
        },
        async listPullRequestComments() {
          return [
            {
              id: "IC_bug1",
              body: `${pullRequestCommentMarkers.bug}\n不具合`,
              author: "u",
              createdAt: "2026-02-01T00:00:00Z",
            },
          ]
        },
        async addPullRequestComment() {
          ghLog.push("addPullRequestComment")
          return { url: "https://c" }
        },
        async squashMerge() {},
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {
          ghLog.push("fetch")
        },
        async checkoutFetched() {
          ghLog.push("checkoutFetched")
        },
        async mergeFetched() {
          return { status: "merged" as const }
        },
        async headCommit() {
          return "deadbeef"
        },
        async hasChanges() {
          return false
        },
        async commitAll() {},
        async push() {},
      },
      agent: {
        async implement() {},
        async fix() {
          ghLog.push("fix")
        },
      },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })
    await expect(runner.process({ id: "4" })).rejects.toThrow(
      "実装の変更がありません",
    )
    expect(ghLog).toContain("editLabels:start")
    expect(ghLog).toContain("addComment:start")
    await rm(procedurePath, { force: true })
  })

  test("poll は着手 addComment を呼ばない", async () => {
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues(query) {
          if (query.labels?.includes(LABEL_REQUEST)) {
            return [issue({ number: 1 })]
          }
          return []
        },
        async getIssue() {
          throw new Error("unexpected")
        },
        async editLabels() {},
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            return { url: "https://start-comment" }
          }
          return { url: "https://c" }
        },
        async listPullRequests() {
          return []
        },
        async listPullRequestComments() {
          return []
        },
        async addPullRequestComment() {
          return { url: "https://c" }
        },
        async squashMerge() {},
        async listComments() {
          return startIssueComments.listComments()
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async headCommit() {
          return "deadbeef"
        },
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
      },
      agent: { async implement() {}, async fix() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await runner.poll()
    expect(startIssueComments.comments).toEqual([])
  })

  test("動作確認OK の process は着手 addComment を呼ばない", async () => {
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues(query) {
          if (query.labels?.includes(LABEL_REQUEST)) {
            return []
          }
          return [issue({ number: 5, labels: [LABEL_VERIFIED] })]
        },
        async getIssue() {
          return issue({ number: 5, labels: [LABEL_VERIFIED] })
        },
        async editLabels() {},
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            return { url: "https://start-comment" }
          }
          return { url: "https://c" }
        },
        async listPullRequests() {
          return [
            {
              number: 4,
              url: "https://pr/4",
              state: "open",
              merged: false,
            },
          ]
        },
        async squashMerge() {},
        async listComments() {
          return startIssueComments.listComments()
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async mergeFetched() {
          return { status: "merged" as const }
        },
        async headCommit() {
          return "deadbeef"
        },
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
      },
      agent: { async implement() {}, async fix() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/x",
        async remove() {},
      }),
    })
    const item = await runner.poll()
    await runner.process(item!)
    expect(startIssueComments.comments).toEqual([])
  })
})
