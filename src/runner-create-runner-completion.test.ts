import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test"
import {
  createIssueCommentStore,
  issue,
  LABEL_CONFLICT,
  LABEL_DONE,
  LABEL_IN_PROGRESS,
  LABEL_MERGED,
  LABEL_REQUEST,
  LABEL_VERIFIED,
  runnerTestDesignPair,
  VIEWER_LOGIN,
} from "./runner-test-support.ts"
import * as sdd from "./sdd.ts"
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
  selectFixIssues,
  selectImplementationIssue,
  selectQuickIssue,
  decideStartClaim,
  issueStartCutoff,
  latestCreatedAt,
  startComment,
  startMarker,
} from "./runner.ts"
describe("createRunner completion", () => {
  let readSpecPairSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    readSpecPairSpy = spyOn(sdd, "readSpecPair").mockImplementation(
      async (issueNumber: number) => runnerTestDesignPair(issueNumber),
    )
  })

  afterEach(() => {
    readSpecPairSpy.mockRestore()
  })

  test("前段が空のとき動作確認OK を探す", async () => {
    let listCalls = 0
    let verifiedAssignee: string | undefined
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues(query) {
          listCalls += 1
          if (query.labels?.includes(LABEL_VERIFIED)) {
            verifiedAssignee = query.assignee
            return [issue({ number: 9, labels: [LABEL_VERIFIED] })]
          }
          return []
        },
        async getIssue() {
          return issue({ number: 9, labels: [LABEL_VERIFIED] })
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
    expect(await runner.poll()).toEqual({ id: "9" })
    expect(listCalls).toBe(1)
    expect(verifiedAssignee).toBe(VIEWER_LOGIN)
  })

  test("runner で動作確認OK があれば実装依頼より先に返す", async () => {
    let requestListed = false
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues(query) {
          if (query.labels?.includes(LABEL_REQUEST)) {
            requestListed = true
            return [issue({ number: 3 })]
          }
          if (query.labels?.includes(LABEL_VERIFIED)) {
            return [issue({ number: 8, labels: [LABEL_VERIFIED] })]
          }
          return []
        },
        async getIssue() {
          return issue({ number: 8, labels: [LABEL_VERIFIED] })
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
          return false
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
    const item = await runner.poll()
    expect(item?.id).toBe("8")
    expect(requestListed).toBe(false)
  })

  test("runner で動作確認OK のみを返す", async () => {
    let secondAssignee: string | undefined
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues(query) {
          if (query.labels?.includes(LABEL_VERIFIED)) {
            secondAssignee = query.assignee
            return [issue({ number: 8, labels: [LABEL_VERIFIED] })]
          }
          return []
        },
        async getIssue() {
          return issue({ number: 8, labels: [LABEL_VERIFIED] })
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
              number: 11,
              url: "https://pr/11",
              state: "merged",
              merged: true,
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
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/x",
        async remove() {},
      }),
    })
    expect(await runner.poll()).toEqual({ id: "8" })
    expect(secondAssignee).toBe(VIEWER_LOGIN)
  })

  test("実装依頼課題では complete の依存を呼ばない", async () => {
    let squashCalled = false
    const procDir = await mkdtemp(path.join(os.tmpdir(), "sdd-runner-proc-"))
    const procedurePath = path.join(procDir, "procedure.txt")
    await writeFile(procedurePath, "手順", "utf8")
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return [issue({ number: 1 })]
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
        async squashMerge() {
          squashCalled = true
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
    const item = await runner.poll()
    await expect(runner.process(item!)).rejects.toThrow(
      "実装の変更がありません",
    )
    expect(squashCalled).toBe(false)
    await rm(procDir, { recursive: true, force: true })
  })

  test("実装依頼の process は completeIssue の外で squashMerge を呼ばない", async () => {
    let squashCalls = 0
    const procDir = await mkdtemp(
      path.join(os.tmpdir(), "sdd-runner-impl-squash-"),
    )
    const procedurePath = path.join(procDir, "procedure.txt")
    await writeFile(procedurePath, "手順", "utf8")
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return [issue({ number: 1 })]
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
        async squashMerge() {
          squashCalls += 1
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
    const item = await runner.poll()
    await runner.process(item!)
    expect(squashCalls).toBe(0)
    await rm(procDir, { recursive: true, force: true })
  })

  test("動作確認OK では squashMerge と完了 editLabels だけ", async () => {
    const calls: string[] = []
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
        async editLabels(n, change) {
          calls.push(`edit:${n}:${change.remove?.join(",")}:${change.add?.join(",")}`)
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {
          calls.push("createBranch")
        },
        async createPullRequest() {
          calls.push("createPullRequest")
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            return { url: "https://start-comment" }
          }
          calls.push("addComment")
          return { url: "https://c" }
        },
        async addPullRequestComment() {},
        async listPullRequests() {
          return [
            {
              number: 2,
              url: "https://pr/2",
              state: "open",
              merged: false,
            },
          ]
        },
        async squashMerge(n, subject) {
          calls.push(`squash:${n}:${subject}`)
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
          calls.push("commitAll")
        },
        async push() {
          calls.push("push")
        },
      },
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/x",
        async remove() {},
      }),
    })
    const item = await runner.poll()
    await runner.process(item!)
    expect(calls).toEqual([
      "push",
      "squash:2:【課題 5】題",
      `edit:5:${LABEL_VERIFIED}:${LABEL_MERGED}`,
    ])
  })

  test("完了後の poll はその課題を返さない", async () => {
    let verifiedIssues = [issue({ number: 6, labels: [LABEL_VERIFIED] })]
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
          return verifiedIssues
        },
        async getIssue(n) {
          const found = verifiedIssues.find((i) => i.number === n)
          return found ?? issue({ number: n, labels: [LABEL_VERIFIED] })
        },
        async editLabels(n, change) {
          verifiedIssues = verifiedIssues.map((i) => {
            if (i.number !== n) {
              return i
            }
            let labels = i.labels.filter((l) => !change.remove?.includes(l))
            labels = [...labels, ...(change.add ?? [])]
            return { ...i, labels }
          })
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
          return [
            {
              number: 3,
              url: "https://pr/3",
              state: "merged",
              merged: true,
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
      agent: { async implement() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/x",
        async remove() {},
      }),
    })
    const item = await runner.poll()
    expect(item?.id).toBe("6")
    await runner.process(item!)
    expect(await runner.poll()).toBe(null)
  })

  test("createRunner の github 依存に deleteBranch は無い", () => {
    type GithubDeps = Parameters<typeof createRunner>[0]["github"]
    const keys: (keyof GithubDeps)[] = [
      "addComment",
      "createBranch",
      "createPullRequest",
      "editLabels",
      "getDefaultBranch",
      "getIssue",
      "listIssues",
      "listPullRequests",
      "squashMerge",
      "viewerLogin",
    ]
    expect(keys.sort()).toEqual([
      "addComment",
      "createBranch",
      "createPullRequest",
      "editLabels",
      "getDefaultBranch",
      "getIssue",
      "listIssues",
      "listPullRequests",
      "squashMerge",
      "viewerLogin",
    ])
    expect(keys).not.toContain("deleteBranch" as keyof GithubDeps)
  })

  test("動作確認OK の process は completeIssue 経由で squashMerge し deleteBranch と issue close は呼ばない", async () => {
    const calls: string[] = []
    const github = {
      async viewerLogin() {
        return VIEWER_LOGIN
      },
      async listIssues(query: { labels?: string[] }) {
        if (query.labels?.includes(LABEL_REQUEST)) {
          return []
        }
        return [issue({ number: 8, labels: [LABEL_VERIFIED] })]
      },
      async getIssue() {
        return issue({ number: 8, labels: [LABEL_VERIFIED] })
      },
      async editLabels(n: number, change: { add?: string[]; remove?: string[] }) {
        calls.push(
          `edit:${n}:${change.remove?.join(",")}:${change.add?.join(",")}`,
        )
      },
      async getDefaultBranch() {
        return "main"
      },
      async createBranch() {
        calls.push("createBranch")
      },
      async createPullRequest() {
        calls.push("createPullRequest")
        return { number: 1, url: "https://pr" }
      },
      async addComment(_n, body) {
          if (startIssueComments.recordStartComment(body)) {
            return { url: "https://start-comment" }
          }
        calls.push("addComment")
        return { url: "https://c" }
      },
      async addPullRequestComment() {},
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
      async squashMerge(n: number, subject: string) {
        calls.push(`squash:${n}:${subject}`)
      },
    }
    expect("deleteBranch" in github).toBe(false)
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      github,
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
          calls.push("commitAll")
        },
        async push() {
          calls.push("push")
        },
      },
      agent: { async implement() {}, async fix() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/x",
        async remove() {},
      }),
    })
    const item = await runner.poll()
    await runner.process(item!)
    expect(calls).toEqual([
      "push",
      "squash:4:【課題 8】題",
      `edit:8:${LABEL_VERIFIED}:${LABEL_MERGED}`,
    ])
    expect(calls).not.toContain("createPullRequest")
    expect(calls).not.toContain("commitAll")
    expect(calls).not.toContain("addComment")
  })

  test("動作確認OK の process は completeIssue の外で squashMerge を呼ばない", async () => {
    let squashCalls = 0
    const startIssueComments = createIssueCommentStore()
    const runner = createRunner({
      completionCaller: "runner",
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues(query: { labels?: string[] }) {
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
              number: 2,
              url: "https://pr/2",
              state: "open",
              merged: false,
            },
          ]
        },
        async squashMerge(_n, subject) {
          squashCalls += 1
          expect(subject).toBe("【課題 5】題")
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
      agent: { async implement() {}, async fix() {}, async quick() {} },
      createProcedureFile: async () => ({
        path: "/tmp/x",
        async remove() {},
      }),
    })
    const item = await runner.poll()
    await runner.process(item!)
    expect(squashCalls).toBe(1)
  })
})
