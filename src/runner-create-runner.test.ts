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
describe("createRunner", () => {
  test("poll は listIssues を実装依頼で呼び候補が無いとき null", async () => {
    let calls = 0
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues(query) {
          calls += 1
          if (calls === 1) {
            expect(query).toEqual({
              labels: [LABEL_REQUEST],
              assignee: VIEWER_LOGIN,
              limit: 100,
            })
            return []
          }
          if (calls === 2) {
            expect(query).toEqual({
              labels: [LABEL_DONE],
              assignee: VIEWER_LOGIN,
              limit: 100,
            })
            return []
          }
          if (calls === 3) {
            expect(query).toEqual({
              state: "open",
              assignee: VIEWER_LOGIN,
              limit: 100,
            })
            return []
          }
          expect(query).toEqual({
            labels: [LABEL_VERIFIED],
            assignee: VIEWER_LOGIN,
            limit: 100,
          })
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
      agent: {
        async implement() {},
        async fix() {},
        async quick() {},
      },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await expect(runner.poll()).resolves.toBeNull()
    expect(calls).toBe(4)
  })

  test("poll は listIssues が一度拒否し二度目に返す", async () => {
    let calls = 0
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          calls += 1
          if (calls === 1) {
            throw new Error("temporary")
          }
          return [issue({ number: 1 })]
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
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await expect(runner.poll()).resolves.toEqual({ id: "1" })
    expect(calls).toBe(2)
  })

  test("viewerLogin が一度拒否し二度目に login を返すとき listIssues は一回", async () => {
    let viewerCalls = 0
    let listCalls = 0
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          viewerCalls += 1
          if (viewerCalls === 1) {
            throw new Error("auth")
          }
          return VIEWER_LOGIN
        },
        async listIssues() {
          listCalls += 1
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
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await expect(runner.poll()).resolves.toBeNull()
    expect(viewerCalls).toBe(2)
    expect(listCalls).toBe(4)
  })

  test("viewerLogin が二度とも拒否すると listIssues は呼ばない", async () => {
    let listCalls = 0
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          throw new Error("auth failed")
        },
        async listIssues() {
          listCalls += 1
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
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await expect(runner.poll()).rejects.toThrow("auth failed")
    expect(listCalls).toBe(0)
  })

  test("ラベルは合うが assignees に login が無いとき poll は null", async () => {
    let listCalls = 0
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues(query) {
          listCalls += 1
          if (query.labels?.includes(LABEL_VERIFIED)) {
            return [issue({ number: 9, labels: [LABEL_VERIFIED], assignees: ["other"] })]
          }
          return [issue({ number: 5, assignees: ["other"] })]
        },
        async getIssue() {
          return issue({ number: 5 })
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
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/x",
        async remove() {},
      }),
    })
    expect(await runner.poll()).toBeNull()
    expect(listCalls).toBe(4)
  })

  test("process はラベルが違うとき editLabels を呼ばない", async () => {
    let editCalled = false
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
          return issue({ number: 1, labels: [LABEL_IN_PROGRESS] })
        },
        async editLabels() {
          editCalled = true
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
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await runner.process({ id: "1" })
    expect(editCalled).toBe(false)
  })

  test("通過した process の呼び出し順", async () => {
    const log: string[] = []
    const procedurePath = "/tmp/procedure.txt"
    await writeFile(procedurePath, "手順本文", "utf8")

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
          return issue({ number: 1, title: "題", url: "https://issue/1" })
        },
        async editLabels(_n, change) {
          if (change.add?.includes(LABEL_IN_PROGRESS)) {
            log.push("editLabels:start")
          } else {
            log.push("editLabels:done")
          }
        },
        async getDefaultBranch() {
          log.push("getDefaultBranch")
          return "main"
        },
        async createBranch() {
          log.push("createBranch")
        },
        async createPullRequest(input) {
          log.push(`createPullRequest:${input.body}`)
          expect(input.base).toBe("main")
          expect(input.head).toBe("task-1")
          expect(input.body).toBe(
            pullRequestBody("https://issue/1", "手順本文"),
          )
          expect(input.body).not.toContain("Fixes")
          expect(input.body).not.toContain("Closes")
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            return { url: "https://start-comment" }
          }
          log.push(`addComment:${body}`)
          expect(body).toBe("https://pr")
          expect(body).not.toContain(commentMarkers.acceptance)
          return { url: "https://c" }
        },
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
        async commitAll() {
          log.push("commitAll")
        },
        async push() {
          log.push("push")
        },
      },
      agent: {
        async implement() {
          log.push("implement")
        },
      },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await runner.process({ id: "1" })
    expect(log).not.toContain("createBranch")
    expect(log.join("\n")).not.toContain("sdd-cur/1")
    expect(log).toEqual([
      "editLabels:start",
      "getDefaultBranch",
      "remoteName",
      "fetch:origin:task-1",
      "checkoutFetched:task-1",
      "fetch:origin:main",
      "mergeFetched",
      "headCommit",
      "implement",
      "headCommit",
      "hasChanges",
      "commitAll",
      "push",
      `createPullRequest:${pullRequestBody("https://issue/1", "手順本文")}`,
      "addComment:https://pr",
      "editLabels:done",
    ])
    await rm(procedurePath, { force: true })
  })

  test("acceptanceComment が拒否する payload では createPullRequest と addComment を呼ばない", async () => {
    let prCalled = false
    let commentCalled = false
    const procedurePath = "/tmp/procedure-reject.txt"
    await writeFile(procedurePath, "   ", "utf8")

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
          return issue({ number: 1 })
        },
        async editLabels() {},
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          prCalled = true
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            return { url: "https://start-comment" }
          }
          commentCalled = true
          return { url: "https://c" }
        },
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
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await expect(runner.process({ id: "1" })).rejects.toThrow(
      "受け入れ手順が空です",
    )
    expect(prCalled).toBe(false)
    expect(commentCalled).toBe(false)
    await rm(procedurePath, { force: true })
  })

  test("implement が一度拒否し二度目に成功", async () => {
    let implementCalls = 0
    const procedurePath = "/tmp/procedure-retry.txt"
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
        async quick() {},
        async implement() {
          implementCalls += 1
          if (implementCalls === 1) {
            throw new Error("agent fail")
          }
        },
      },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await runner.process({ id: "1" })
    expect(implementCalls).toBe(2)
    await rm(procedurePath, { force: true })
  })

  test("implement が二度拒否したとき後続を呼ばない", async () => {
    let commitCalled = false
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
        async commitAll() {
          commitCalled = true
        },
        async push() {},
      },
      agent: {
        async implement() {
          throw new Error("agent fail")
        },
      },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })

    await expect(runner.process({ id: "1" })).rejects.toThrow("agent fail")
    expect(commitCalled).toBe(false)
  })

  test("implement の直後に HEAD が違うとき agent がブランチの先頭を変えました", async () => {
    let headCalls = 0
    let commitCalled = false
    const procedurePath = "/tmp/procedure-head.txt"
    await writeFile(procedurePath, "手順", "utf8")

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
          return true
        },
        async commitAll() {
          commitCalled = true
        },
        async push() {},
      },
      agent: {
        async implement() {},
      },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await expect(runner.process({ id: "1" })).rejects.toThrow(
      "agent がブランチの先頭を変えました",
    )
    expect(commitCalled).toBe(false)
    await rm(procedurePath, { force: true })
  })

  test("implement が一度失敗し HEAD が違うとき二度目は呼ばない", async () => {
    let implementCalls = 0
    let headCalls = 0
    const procedurePath = "/tmp/procedure-head-fail.txt"
    await writeFile(procedurePath, "手順", "utf8")

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
          if (headCalls === 1) {
            return "before"
          }
          if (headCalls === 2) {
            return "after"
          }
          return "before"
        },
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
      },
      agent: {
        async implement() {
          implementCalls += 1
          throw new Error("agent fail")
        },
      },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await expect(runner.process({ id: "1" })).rejects.toThrow(
      "agent がブランチの先頭を変えました",
    )
    expect(implementCalls).toBe(1)
    await rm(procedurePath, { force: true })
  })

  test("変更が無いとき 実装の変更がありません", async () => {
    let prCalled = false
    const procedurePath = "/tmp/procedure-empty.txt"
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
          return issue({ number: 1 })
        },
        async editLabels() {},
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          prCalled = true
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            return { url: "https://start-comment" }
          }
          return { url: "https://c" }
        },
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
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await expect(runner.process({ id: "1" })).rejects.toThrow(
      "実装の変更がありません",
    )
    expect(prCalled).toBe(false)
    await rm(procedurePath, { force: true })
  })

  test("fetch が一度拒否し二度目に成功", async () => {
    let fetchCalls = 0
    let checkoutCalls = 0
    let implementCalls = 0
    const procedurePath = "/tmp/procedure-fetch.txt"
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
          return issue({ number: 1 })
        },
        async editLabels() {},
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {
          throw new Error("createBranch must not run")
        },
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            return { url: "https://start-comment" }
          }
          return { url: "https://c" }
        },
      async listComments() {
          return startIssueComments.listComments()
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {
          fetchCalls += 1
          if (fetchCalls === 1) {
            throw new Error("fetch fail")
          }
        },
        async checkoutFetched() {
          checkoutCalls += 1
        },
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
        async quick() {},
        async implement() {
          implementCalls += 1
        },
      },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await runner.process({ id: "1" })
    expect(checkoutCalls).toBe(1)
    expect(fetchCalls).toBe(3)
    expect(implementCalls).toBe(1)
    await rm(procedurePath, { force: true })
  })

  test("fetch が二度拒否したときは checkout と implement を呼ばない", async () => {
    let fetchCalls = 0
    let checkoutCalls = 0
    let implementCalls = 0
    const procedurePath = "/tmp/procedure-fetch-fail.txt"
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
          return issue({ number: 1 })
        },
        async editLabels() {},
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {
          throw new Error("createBranch must not run")
        },
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            return { url: "https://start-comment" }
          }
          return { url: "https://c" }
        },
      async listComments() {
          return startIssueComments.listComments()
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {
          fetchCalls += 1
          throw new Error("fetch fail")
        },
        async checkoutFetched() {
          checkoutCalls += 1
        },
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
        async quick() {},
        async implement() {
          implementCalls += 1
        },
      },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await expect(runner.process({ id: "1" })).rejects.toThrow("fetch fail")
    expect(fetchCalls).toBe(2)
    expect(checkoutCalls).toBe(0)
    expect(implementCalls).toBe(0)
    await rm(procedurePath, { force: true })
  })

  test("addComment 成功後 editLabels が二度拒否", async () => {
    let addCalls = 0
    let doneEditCalls = 0
    const procedurePath = "/tmp/procedure-labels.txt"
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
          return issue({ number: 1 })
        },
        async editLabels(_n, change) {
          if (change.add?.includes(LABEL_DONE)) {
            doneEditCalls += 1
            throw new Error("label fail")
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
          addCalls += 1
          return { url: "https://c" }
        },
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
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await expect(runner.process({ id: "1" })).rejects.toThrow("label fail")
    expect(addCalls).toBe(1)
    expect(doneEditCalls).toBe(2)
    await rm(procedurePath, { force: true })
  })

  test("二つの poll で実装中になった課題を除く", async () => {
    const procedurePath = path.join(
      await mkdtemp(path.join(os.tmpdir(), "sdd-runner-proc-")),
      "procedure.txt",
    )
    await writeFile(procedurePath, "手順", "utf8")

    const store = new Map<number, string[]>()
    store.set(1, [LABEL_REQUEST])
    store.set(2, [LABEL_REQUEST])

    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return [
            issue({ number: 1, labels: store.get(1) ?? [] }),
            issue({ number: 2, labels: store.get(2) ?? [] }),
          ]
        },
        async getIssue(n) {
          return issue({ number: n, labels: store.get(n) ?? [] })
        },
        async editLabels(n, change) {
          const labels = store.get(n) ?? []
          let next = labels.filter((l) => !change.remove?.includes(l))
          if (change.add) {
            next = [...next, ...change.add]
          }
          store.set(n, next)
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
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    const first = await runner.poll()
    expect(first?.id).toBe("1")
    await expect(runner.process(first!)).rejects.toThrow(
      "実装の変更がありません",
    )

    const second = await runner.poll()
    expect(second?.id).toBe("2")
    await rm(path.dirname(procedurePath), { recursive: true, force: true })
  })

  test("poll は不具合修正があるとき quick の listIssues を呼ばない", async () => {
    let quickListed = false
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues(query) {
          if (
            !query.labels?.includes(LABEL_REQUEST) &&
            !query.labels?.includes(LABEL_DONE)
          ) {
            quickListed = true
          }
          if (query.labels?.includes(LABEL_REQUEST)) {
            return []
          }
          return [issue({ number: 2, labels: [LABEL_DONE] })]
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
    const item = await runner.poll()
    expect(item?.id).toBe("2")
    expect(quickListed).toBe(false)
  })

  test("poll は実装依頼があるとき quick の listIssues を呼ばない", async () => {
    let quickListed = false
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues(query) {
          if (!query.labels?.includes(LABEL_REQUEST) && !query.labels?.includes(LABEL_DONE)) {
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
    const item = await runner.poll()
    expect(item?.id).toBe("1")
    expect(quickListed).toBe(false)
  })

  test("poll は quick があるとき動作確認OK を探さない", async () => {
    let verifiedListed = false
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
            return []
          }
          if (query.state === "open" && !query.labels) {
            return [
              issue({ number: 7, body: "quick 対象", labels: [], assignees: [VIEWER_LOGIN] }),
            ]
          }
          return []
        },
        async getIssue() {
          return issue({ number: 7, body: "quick 対象", labels: [] })
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
    const item = await runner.poll()
    expect(item?.id).toBe("7")
    expect(verifiedListed).toBe(false)
  })

  test("quick process は仕様から実装完了までの順序", async () => {
    const log: string[] = []
    let procedureRound = 0
    const quickPath = "/tmp/quick-result-order.txt"
    const implementPath = "/tmp/quick-impl-order.txt"
    await writeFile(quickPath, "続行\n", "utf8")
    await writeFile(implementPath, "手順", "utf8")

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
          return issue({
            number: 56,
            body: "quick 対象",
            labels: [],
            title: "題",
            url: "https://issue/56",
          })
        },
        async editLabels(_n, change) {
          if (change.add?.includes(LABEL_IN_PROGRESS)) {
            log.push("editLabels:start")
          } else {
            log.push("editLabels:done")
          }
        },
        async getDefaultBranch() {
          log.push("getDefaultBranch")
          return "main"
        },
        async createBranch() {
          log.push("createBranch")
        },
        async createPullRequest(input) {
          log.push("createPullRequest")
          expect(input.head).toBe("task-56")
          expect(input.base).toBe("main")
          expect(input.body).toBe(pullRequestBody("https://issue/56", "手順"))
          expect(input.body).not.toContain("Fixes")
          expect(input.body).not.toContain("Closes")
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            return { url: "https://start-comment" }
          }
          log.push(`addComment:${body}`)
          expect(body).toBe("https://pr")
          expect(body).not.toContain(commentMarkers.acceptance)
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
        async commitAll() {
          log.push("commitAll")
        },
        async push() {
          log.push("push")
        },
      },
      agent: {
        async quick() {
          log.push("quick")
        },
        async implement() {
          log.push("implement")
        },
        async fix() {},
      },
      createProcedureFile: async () => {
        procedureRound += 1
        const path =
          procedureRound === 1 ? quickPath : implementPath
        return {
          path,
          async remove() {},
        }
      },
    })

    await runner.process({ id: "56" })
    expect(log).not.toContain("createBranch")
    expect(log).toEqual([
      "editLabels:start",
      "getDefaultBranch",
      "remoteName",
      "fetch:origin:main",
      "checkoutFetched:task-56",
      "headCommit",
      "quick",
      "headCommit",
      "headCommit",
      "implement",
      "headCommit",
      "hasChanges",
      "commitAll",
      "push",
      "createPullRequest",
      "addComment:https://pr",
      "editLabels:done",
    ])
    await rm(quickPath, { force: true })
    await rm(implementPath, { force: true })
  })

  test("quick が軽微でないとき状況コメントのみ", async () => {
    let implementCalled = false
    let commentBody = ""
    const quickPath = "/tmp/quick-not-minor.txt"
    await writeFile(quickPath, "軽微でない\n詳細", "utf8")

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
        async editLabels(_n, change) {
          expect(change.add).toEqual([LABEL_IN_PROGRESS])
          expect(change.remove).toBeUndefined()
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
          commentBody = body
        },
        async listPullRequests() {
          return []
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
        async commitAll() {
          throw new Error("unexpected")
        },
        async push() {
          throw new Error("unexpected")
        },
      },
      agent: {
        async quick() {},
        async implement() {
          implementCalled = true
        },
        async fix() {},
      },
      createProcedureFile: async () => ({
        path: quickPath,
        async remove() {},
      }),
    })

    await runner.process({ id: "1" })
    expect(implementCalled).toBe(false)
    expect(commentBody.startsWith("処理の途中で軽微な修正でないと分かりました")).toBe(
      true,
    )
    expect(commentBody).toContain("詳細")
    await rm(quickPath, { force: true })
  })

  test("quick が決められないとき状況コメントに点を含める", async () => {
    let commentBody = ""
    const quickPath = "/tmp/quick-undecided.txt"
    await writeFile(quickPath, "決められない\n未記載の点", "utf8")

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
          commentBody = body
        },
        async listPullRequests() {
          return []
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
        async quick() {},
        async implement() {
          throw new Error("unexpected")
        },
        async fix() {},
      },
      createProcedureFile: async () => ({
        path: quickPath,
        async remove() {},
      }),
    })

    await runner.process({ id: "1" })
    expect(commentBody.startsWith("決められない点があるため止めました")).toBe(
      true,
    )
    expect(commentBody).toContain("未記載の点")
    await rm(quickPath, { force: true })
  })

  test("agent.quick が二度拒否したとき状況コメントを投稿しない", async () => {
    let commentCalled = false
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
          commentCalled = true
        },
        async listPullRequests() {
          return []
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
        async quick() {
          throw new Error("fail")
        },
        async implement() {},
        async fix() {},
      },
      createProcedureFile: async () => ({
        path: "/tmp/quick-fail.txt",
        async remove() {},
      }),
    })

    await runner.process({ id: "1" })
    expect(commentCalled).toBe(false)
  })

  test("quick 成功後に HEAD が違うとき implement commit push を呼ばず agent がブランチの先頭を変えました", async () => {
    let implementCalled = false
    let commitCalled = false
    let pushCalled = false
    let headCalls = 0
    const quickPath = "/tmp/quick-head-success.txt"
    await writeFile(quickPath, "続行\n", "utf8")

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
          return issue({ number: 1, body: "quick 対象", labels: [] })
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
          return true
        },
        async commitAll() {
          commitCalled = true
        },
        async push() {
          pushCalled = true
        },
      },
      agent: {
        async quick() {},
        async implement() {
          implementCalled = true
        },
        async fix() {},
      },
      createProcedureFile: async () => ({
        path: quickPath,
        async remove() {},
      }),
    })

    await expect(runner.process({ id: "1" })).rejects.toThrow(
      "agent がブランチの先頭を変えました",
    )
    expect(implementCalled).toBe(false)
    expect(commitCalled).toBe(false)
    expect(pushCalled).toBe(false)
    await rm(quickPath, { force: true })
  })

  test("quick が二度失敗し二度目に HEAD が違うとき quick は2回 implement を呼ばず agent がブランチの先頭を変えました", async () => {
    let quickCalls = 0
    let implementCalled = false
    let headCalls = 0
    const quickPath = "/tmp/quick-head-fail-twice.txt"

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
          return issue({ number: 1, body: "quick 対象", labels: [] })
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
          if (headCalls === 1 || headCalls === 2) {
            return "before"
          }
          return "after"
        },
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
      },
      agent: {
        async quick() {
          quickCalls += 1
          throw new Error("quick fail")
        },
        async implement() {
          implementCalled = true
        },
        async fix() {},
      },
      createProcedureFile: async () => ({
        path: quickPath,
        async remove() {},
      }),
    })

    await expect(runner.process({ id: "1" })).rejects.toThrow(
      "agent がブランチの先頭を変えました",
    )
    expect(quickCalls).toBe(2)
    expect(implementCalled).toBe(false)
  })

  test("実装の mergeFetched が conflict のとき implement を呼ばない", async () => {
    let implementCalled = false
    let mergeFetchedCalls = 0
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
        async listComments() {
          return startIssueComments.listComments()
        },
        async listPullRequests() {
          return []
        },
        async addPullRequestComment() {},
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async mergeFetched() {
          mergeFetchedCalls += 1
          return { status: "conflict", files: ["x.ts"] }
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
        async implement() {
          implementCalled = true
        },
      },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await runner.process({ id: "1" })
    expect(mergeFetchedCalls).toBe(1)
    expect(implementCalled).toBe(false)
  })

  test("quick の process は mergeFetched を呼ばない", async () => {
    let mergeFetchedCalls = 0
    const quickPath = "/tmp/quick-merge.txt"
    await writeFile(quickPath, "軽微でない\n詳細", "utf8")
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 9, body: "quick 対象", labels: [] })
        },
        async editLabels() {},
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment() {
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
          return []
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async mergeFetched() {
          mergeFetchedCalls += 1
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
        async quick() {},
      },
      createProcedureFile: async () => ({
        path: quickPath,
        async remove() {},
      }),
    })
    await runner.process({ id: "9" })
    expect(mergeFetchedCalls).toBe(0)
    await rm(quickPath, { force: true })
  })
})
