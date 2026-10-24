import { describe, expect, mock, spyOn, test } from "bun:test"
import {
  createIssueCommentStore,
  issue,
  LABEL_CONFLICT,
  LABEL_DONE,
  LABEL_IN_PROGRESS,
  LABEL_MERGED,
  LABEL_REQUEST,
  LABEL_VERIFIED,
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
describe("createRunner fix", () => {
  test("poll は実装依頼を優先し動作確認OK・quick・実装完了の listIssues を呼ばない", async () => {
    let doneList = false
    let verifiedListed = false
    let quickListed = false
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues(query) {
          if (query.labels?.includes(LABEL_VERIFIED)) {
            verifiedListed = true
          }
          if (query.labels?.includes(LABEL_DONE)) {
            doneList = true
          }
          if (query.state === "open" && !query.labels) {
            quickListed = true
          }
          if (query.labels?.includes(LABEL_REQUEST)) {
            return [issue({ number: 1 })]
          }
          return []
        },
        async getIssue() {
          return issue({ number: 1 })
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
    expect(await runner.poll()).toEqual({ id: "1" })
    expect(verifiedListed).toBe(false)
    expect(quickListed).toBe(false)
    expect(doneList).toBe(false)
  })

  test("未処理の不具合がある課題を返す", async () => {
    let prCalls = 0
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
          if (query.labels?.includes(LABEL_VERIFIED)) {
            return []
          }
          if (query.state === "open" && !query.labels) {
            return []
          }
          if (query.labels?.includes(LABEL_DONE)) {
            return [issue({ number: 5, labels: [LABEL_DONE] })]
          }
          return []
        },
        async getIssue() {
          return issue({ number: 5, labels: [LABEL_DONE] })
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
        async listPullRequests(query) {
          prCalls += 1
          expect(query.head).toBe("task-5")
          return [{ number: 9, url: "https://pr/9", state: "open", merged: false }]
        },
        async listPullRequestComments() {
          return [
            {
              id: "IC_bug",
              body: `${pullRequestCommentMarkers.bug}\n内容`,
              author: "u",
              createdAt: "2026-01-01",
            },
          ]
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
    expect(await runner.poll()).toEqual({ id: "5" })
    expect(prCalls).toBe(1)
  })

  test("2 件以上のマージリクエストで拒否", async () => {
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
          if (query.labels?.includes(LABEL_VERIFIED)) {
            return []
          }
          if (query.state === "open" && !query.labels) {
            return []
          }
          if (query.labels?.includes(LABEL_DONE)) {
            return [issue({ number: 1, labels: [LABEL_DONE] })]
          }
          return []
        },
        async getIssue() {
          return issue({ number: 1 })
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
            { number: 1, url: "", state: "open", merged: false },
            { number: 2, url: "", state: "open", merged: false },
          ]
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
    await expect(runner.poll()).rejects.toThrow("マージリクエストを特定できません")
  })

  test("通過した不具合 process の呼び出し順", async () => {
    const log: string[] = []
    const procedurePath = "/tmp/fix-proc.txt"
    await writeFile(procedurePath, "再確認手順", "utf8")
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
        async editLabels(_n, change) {
          if (change.add?.includes(LABEL_IN_PROGRESS)) {
            log.push("editLabels:start")
          } else {
            log.push("editLabels:done")
          }
        },
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
          log.push("addComment")
          return { url: "https://c" }
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
              createdAt: "2026-01-01",
            },
          ]
        },
        async addPullRequestComment(_n, body) {
          log.push(`addPullRequestComment:${body.split("\n")[0]}`)
          return { url: "https://c" }
        },
        async squashMerge() {},
      async listComments() {
          return startIssueComments.listComments()
        },
      },
      git: {
        async remoteName() {
          log.push("remoteName")
          return "origin"
        },
        async fetch(remote, branch) {
          log.push(`fetch:${remote}:${branch}`)
        },
        async checkoutFetched(branch) {
          log.push(`checkoutFetched:${branch}`)
        },
        async mergeFetched() {
          log.push("mergeFetched")
          return { status: "merged" as const }
        },
        async headCommit() {
          log.push("headCommit")
          return "deadbeef"
        },
        async hasChanges() {
          log.push("hasChanges")
          return true
        },
        async commitAll(msg) {
          log.push(`commitAll:${msg}`)
        },
        async push() {
          log.push("push")
        },
      },
      agent: {
        async implement() {},
        async fix() {
          log.push("fix")
        },
      },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })
    await runner.process({ id: "3" })
    expect(log).toEqual([
      "editLabels:start",
      "remoteName",
      "fetch:origin:task-3",
      "checkoutFetched:task-3",
      "fetch:origin:main",
      "mergeFetched",
      "headCommit",
      "fix",
      "headCommit",
      "hasChanges",
      "commitAll:fix: 課題 3 の不具合を修正する",
      "push",
      `addPullRequestComment:${pullRequestCommentMarkers.fix}`,
      "editLabels:done",
    ])
    expect(log).not.toContain("addComment")
    expect(log.join("\n")).not.toContain("createPullRequest")
    await rm(procedurePath, { force: true })
  })

  test("小さい番号をスキップし未処理がある番号だけ返す", async () => {
    let prFor10 = 0
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
          if (query.labels?.includes(LABEL_VERIFIED)) {
            return []
          }
          if (query.state === "open" && !query.labels) {
            return []
          }
          if (query.labels?.includes(LABEL_DONE)) {
            return [
              issue({ number: 10, labels: [LABEL_DONE] }),
              issue({ number: 20, labels: [LABEL_DONE] }),
            ]
          }
          return []
        },
        async getIssue() {
          return issue({ number: 20, labels: [LABEL_DONE] })
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
        async listPullRequests(query) {
          if (query.head === "task-10") {
            return []
          }
          if (query.head === "task-20") {
            prFor10 += 1
            return [{ number: 2, url: "", state: "open", merged: false }]
          }
          return []
        },
        async listPullRequestComments() {
          return [
            {
              id: "IC_b",
              body: `${pullRequestCommentMarkers.bug}\nb`,
              author: "",
              createdAt: "2026-01-01",
            },
          ]
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
    expect(await runner.poll()).toEqual({ id: "20" })
    expect(prFor10).toBe(1)
  })

  test("不具合を探す", async () => {
    let verifiedListed = false
    let quickListed = false
    let fixListed = false
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues(query) {
          if (query.labels?.includes(LABEL_VERIFIED)) {
            verifiedListed = true
          }
          if (query.state === "open" && !query.labels) {
            quickListed = true
          }
          if (query.labels?.includes(LABEL_DONE)) {
            fixListed = true
          }
          if (query.labels?.includes(LABEL_REQUEST)) {
            return []
          }
          if (query.labels?.includes(LABEL_VERIFIED)) {
            return []
          }
          if (query.state === "open" && !query.labels) {
            return []
          }
          if (query.labels?.includes(LABEL_DONE)) {
            return [issue({ number: 2, labels: [LABEL_DONE] })]
          }
          return []
        },
        async getIssue() {
          return issue({ number: 2, labels: [LABEL_DONE] })
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
          return [{ number: 1, url: "", state: "open", merged: false }]
        },
        async listPullRequestComments() {
          return [
            {
              id: "IC_b",
              body: `${pullRequestCommentMarkers.bug}\nx`,
              author: "",
              createdAt: "2026-01-01",
            },
          ]
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
    expect(await runner.poll()).toEqual({ id: "2" })
    expect(verifiedListed).toBe(true)
    expect(quickListed).toBe(true)
    expect(fixListed).toBe(true)
  })

  test("範囲外のみで変更なしは commit せず PR コメントと完了ラベル", async () => {
    const log: string[] = []
    const procedurePath = "/tmp/fix-oos.txt"
    await writeFile(procedurePath, "設計の範囲外のため直していない", "utf8")
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
          return issue({ number: 4, labels: [LABEL_DONE] })
        },
        async editLabels(_n, c) {
          log.push(c.add?.includes(LABEL_IN_PROGRESS) ? "start" : "done")
        },
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
          return [{ number: 3, url: "", state: "open", merged: false }]
        },
        async listPullRequestComments() {
          return [
            {
              id: "IC_b",
              body: `${pullRequestCommentMarkers.bug}\n外`,
              author: "",
              createdAt: "2026-01-01",
            },
          ]
        },
        async addPullRequestComment() {
          log.push("prComment")
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
        async mergeFetched() {
          return { status: "merged" as const }
        },
        async headCommit() {
          return "deadbeef"
        },
        async hasChanges() {
          log.push("hasChanges")
          return false
        },
        async commitAll() {
          log.push("commitAll")
        },
        async push() {
          log.push("push")
        },
      },
      agent: { async implement() {}, async fix() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })
    await runner.process({ id: "4" })
    expect(log).toEqual(["start", "hasChanges", "prComment", "done"])
    await rm(procedurePath, { force: true })
  })

  test("fix 成功後に HEAD が違うとき commit push addPullRequestComment を呼ばず範囲外のみの成功にも進まない", async () => {
    const log: string[] = []
    let headCalls = 0
    const procedurePath = "/tmp/fix-head-oos.txt"
    await writeFile(procedurePath, "設計の範囲外のため直していない", "utf8")

    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      completionCaller: null,
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
        async editLabels(_n, c) {
          log.push(c.add?.includes(LABEL_IN_PROGRESS) ? "start" : "done")
        },
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
          return [{ number: 3, url: "", state: "open", merged: false }]
        },
        async listPullRequestComments() {
          return [
            {
              id: "IC_b",
              body: `${pullRequestCommentMarkers.bug}\n外`,
              author: "",
              createdAt: "2026-01-01",
            },
          ]
        },
        async addPullRequestComment() {
          log.push("prComment")
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
        async mergeFetched() {
          return { status: "merged" as const }
        },
        async headCommit() {
          headCalls += 1
          return headCalls === 1 ? "before" : "after"
        },
        async hasChanges() {
          log.push("hasChanges")
          return false
        },
        async commitAll() {
          log.push("commitAll")
        },
        async push() {
          log.push("push")
        },
      },
      agent: { async implement() {}, async fix() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await expect(runner.process({ id: "4" })).rejects.toThrow(
      "agent がブランチの先頭を変えました",
    )
    expect(log).toEqual(["start"])
    await rm(procedurePath, { force: true })
  })

  test("範囲内で変更なしは失敗し PR コメントと完了ラベルは呼ばない", async () => {
    const log: string[] = []
    const procedurePath = "/tmp/fix-nochg.txt"
    await writeFile(procedurePath, "直した", "utf8")
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
          return issue({ number: 4, labels: [LABEL_DONE] })
        },
        async editLabels(_n, c) {
          if (c.add?.includes(LABEL_IN_PROGRESS)) {
            log.push("editLabels:start")
          }
        },
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
          return [{ number: 3, url: "", state: "open", merged: false }]
        },
        async listPullRequestComments() {
          return [
            {
              id: "IC_b",
              body: `${pullRequestCommentMarkers.bug}\n内`,
              author: "",
              createdAt: "2026-01-01",
            },
          ]
        },
        async addPullRequestComment() {
          log.push("prComment")
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
      agent: { async implement() {}, async fix() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })
    await expect(runner.process({ id: "4" })).rejects.toThrow(
      "実装の変更がありません",
    )
    expect(log).toEqual(["editLabels:start"])
    expect(log).not.toContain("prComment")
    await rm(procedurePath, { force: true })
  })

  test("fix が一度拒否し二度目に成功", async () => {
    let fixCalls = 0
    const procedurePath = "/tmp/fix-retry.txt"
    await writeFile(procedurePath, "手順", "utf8")
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
          return [{ number: 1, url: "", state: "open", merged: false }]
        },
        async listPullRequestComments() {
          return [
            {
              id: "IC_b",
              body: `${pullRequestCommentMarkers.bug}\nx`,
              author: "",
              createdAt: "2026-01-01",
            },
          ]
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
      agent: {
        async implement() {},
        async fix() {
          fixCalls += 1
          if (fixCalls === 1) {
            throw new Error("agent fail")
          }
        },
      },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })
    await runner.process({ id: "2" })
    expect(fixCalls).toBe(2)
    await rm(procedurePath, { force: true })
  })

  test("実装中の課題は poll の不具合探索で返さない", async () => {
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
          if (query.labels?.includes(LABEL_VERIFIED)) {
            return []
          }
          if (query.state === "open" && !query.labels) {
            return []
          }
          if (query.labels?.includes(LABEL_DONE)) {
            return [
              issue({
                number: 5,
                labels: [LABEL_DONE, LABEL_IN_PROGRESS],
              }),
            ]
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
    expect(await runner.poll()).toBeNull()
  })
})

const quickSkillPath = path.join(
  import.meta.dir,
  "../skills/sdd-cur-quick/SKILL.md",
)
