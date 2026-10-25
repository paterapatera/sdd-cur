import { describe, expect, test } from "bun:test"
import { mkdir } from "node:fs/promises"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  runLoop,
  type LocalTaskBranchGit,
} from "./run.ts"
import {
  createRunner,
  formatResumeFailureLine,
  isResumableImplementationIssue,
  latestStartEntry,
  loadOrCreateCloneId,
  readCloneIdFile,
  selectResumableImplementationIssue,
  startComment,
  type Runner,
} from "./runner.ts"
import {
  createIssueCommentStore,
  ic,
  issue,
  LABEL_IN_PROGRESS,
  VIEWER_LOGIN,
} from "./runner-test-support.ts"

async function withWorkDir(
  fn: (workDir: string) => Promise<void>,
): Promise<void> {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-174-"))
  try {
    await fn(workDir)
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

function noopResumeRunner(poll: Runner["poll"]): Runner {
  return {
    poll,
    async process() {},
    agentLaunches: () => ({ quick: 0, implement: 0, fix: 0 }),
    resumeInterruptedImplementationOnce: async () => {},
  }
}

describe("clone id file", () => {
  test("無いときに書き、あるときに同じ文字列を返す", async () => {
    await withWorkDir(async (workDir) => {
      const first = await loadOrCreateCloneId(workDir)
      expect(first.length).toBeGreaterThan(0)
      const second = await loadOrCreateCloneId(workDir)
      expect(second).toBe(first)
      const fromFile = await readCloneIdFile(workDir)
      expect(fromFile).toBe(first)
    })
  })

  test("空白だけのファイルは上書きする", async () => {
    await withWorkDir(async (workDir) => {
      const dir = path.join(workDir, ".sdd-cur")
      await mkdir(dir, { recursive: true })
      await writeFile(path.join(dir, "clone-id"), "   \n", "utf8")
      const id = await loadOrCreateCloneId(workDir)
      expect(id.length).toBeGreaterThan(0)
      expect((await readCloneIdFile(workDir))?.trim()).toBe(id)
    })
  })
})

describe("latestStartEntry", () => {
  test("createdAt と id の最大で最新を取り、着手でないコメントを無視する", () => {
    const comments = [
      ic("a", "not start", "2020-01-02T00:00:00Z"),
      ic("b", startComment("clone-b"), "2020-01-01T00:00:00Z"),
      ic("c", startComment("clone-c"), "2020-01-03T00:00:00Z"),
      ic("d", startComment("clone-d"), "2020-01-03T00:00:00Z"),
    ]
    const latest = latestStartEntry(comments)
    expect(latest).toEqual({
      cloneId: "clone-d",
      createdAt: "2020-01-03T00:00:00Z",
      id: "d",
    })
  })
})

describe("resumable selection", () => {
  const cloneId = "my-clone"
  const latest = {
    cloneId: "my-clone",
    createdAt: "2020-01-01T00:00:00Z",
    id: "1",
  }

  test("quick と PR とローカル無しと識別子不一致を除外し番号昇順で先頭", () => {
    const base = issue({
      number: 200,
      labels: [LABEL_IN_PROGRESS],
      state: "open",
    })
    expect(
      isResumableImplementationIssue(
        base,
        VIEWER_LOGIN,
        cloneId,
        latest,
        true,
        0,
        true,
      ),
    ).toBe(false)
    expect(
      isResumableImplementationIssue(
        base,
        VIEWER_LOGIN,
        cloneId,
        latest,
        false,
        1,
        true,
      ),
    ).toBe(false)
    expect(
      isResumableImplementationIssue(
        base,
        VIEWER_LOGIN,
        cloneId,
        latest,
        false,
        0,
        false,
      ),
    ).toBe(false)
    expect(
      isResumableImplementationIssue(
        base,
        VIEWER_LOGIN,
        cloneId,
        { ...latest, cloneId: "other" },
        false,
        0,
        true,
      ),
    ).toBe(false)

    const low = issue({ number: 174, labels: [LABEL_IN_PROGRESS] })
    const high = issue({ number: 200, labels: [LABEL_IN_PROGRESS] })
    expect(
      selectResumableImplementationIssue([
        high,
        low,
      ])?.number,
    ).toBe(174)
  })
})

describe("formatResumeFailureLine", () => {
  test("番号と理由の形", () => {
    expect(formatResumeFailureLine(174, "agent が失敗しました")).toBe(
      "174: agent が失敗しました",
    )
  })
})

describe("resumeInterruptedImplementationOnce", () => {
  test("listIssues を実装中だけ open limit 100 で呼ぶ", async () => {
    await withWorkDir(async (workDir) => {
      await mkdir(path.join(workDir, ".sdd-cur"), { recursive: true })
      await writeFile(
        path.join(workDir, ".sdd-cur", "clone-id"),
        "cid\n",
        "utf8",
      )
      let listQuery: unknown
      const runner = createRunner({
        workDir,
        github: {
          async viewerLogin() {
            return VIEWER_LOGIN
          },
          async listIssues(query) {
            listQuery = query
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
            return {
              number: 1,
              url: "https://github.com/o/r/pull/1",
              state: "open",
              mergedAt: null,
            }
          },
          async addComment() {},
          async listComments() {
            return []
          },
          async listPullRequests() {
            return []
          },
          async listPullRequestComments() {
            return []
          },
          async addPullRequestComment() {},
          async squashMerge() {},
        },
        git: {
          async remoteName() {
            return "origin"
          },
          async fetch() {},
          async checkoutFetched() {},
          async mergeFetched() {
            return { status: "merged" }
          },
          async headCommit() {
            return "abc"
          },
          async hasChanges() {
            return false
          },
          async commitAll() {},
          async push() {},
          async localBranchNames() {
            return []
          },
          async checkoutLocalBranch() {},
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
      await runner.resumeInterruptedImplementationOnce()
      expect(listQuery).toEqual({
        state: "open",
        labels: [LABEL_IN_PROGRESS],
        limit: 100,
      })
    })
  })
})

describe("runLoop resume", () => {
  test("resume を poll より前に呼び、失敗時は commentFailure と括弧行を呼ばない", async () => {
    const order: string[] = []
    const errors: string[] = []
    let pollCount = 0
    const runner: Runner = {
      async resumeInterruptedImplementationOnce() {
        order.push("resume")
        throw new Error("174: agent が失敗しました")
      },
      async poll() {
        order.push("poll")
        pollCount += 1
        return null
      },
      async process() {
        order.push("process")
      },
      agentLaunches: () => ({ quick: 0, implement: 0, fix: 0 }),
    }
    let commentCalled = false
    const code = await runLoop({
      runner,
      git: {
        async currentBranch() {
          return "main"
        },
        async localBranchNames() {
          return []
        },
        async hasChanges() {
          return false
        },
        async deleteLocalBranch() {},
      },
      intervalMin: 1,
      shouldStop: () => pollCount >= 1,
      sleep: async () => {},
      log: () => {},
      logError: (line) => errors.push(line),
      commentFailure: async () => {
        commentCalled = true
      },
    })
    expect(code).toBe(1)
    expect(order).toEqual(["resume"])
    expect(errors).toEqual(["174: agent が失敗しました"])
    expect(commentCalled).toBe(false)
    expect(errors.some((line) => line.startsWith("("))).toBe(false)
  })

  test("resume が成功すると poll に進む", async () => {
    let pollCount = 0
    const runner = noopResumeRunner(async () => {
      pollCount += 1
      return null
    })
    const code = await runLoop({
      runner,
      git: {
        async currentBranch() {
          return "main"
        },
        async localBranchNames() {
          return []
        },
        async hasChanges() {
          return false
        },
        async deleteLocalBranch() {},
      },
      intervalMin: 1,
      shouldStop: () => pollCount >= 1,
      sleep: async () => {},
      log: () => {},
      logError: () => {},
      commentFailure: async () => {},
    })
    expect(code).toBe(0)
    expect(pollCount).toBe(1)
  })
})

describe("resumeImplementation path", () => {
  test("editLabels と fetch と checkoutFetched を呼ばず checkoutLocalBranch のあと agent", async () => {
    await withWorkDir(async (workDir) => {
      const cloneId = "resume-clone"
      await mkdir(path.join(workDir, ".sdd-cur"), { recursive: true })
      await writeFile(
        path.join(workDir, ".sdd-cur", "clone-id"),
        `${cloneId}\n`,
        "utf8",
      )
      const ghLog: string[] = []
      const gitLog: string[] = []
      const comments = createIssueCommentStore([
        ic("s1", startComment(cloneId), "2020-01-02T00:00:00Z"),
      ])
      const runner = createRunner({
        workDir,
        github: {
          async viewerLogin() {
            return VIEWER_LOGIN
          },
          async listIssues() {
            return [
              issue({
                number: 174,
                labels: [LABEL_IN_PROGRESS],
                assignees: [VIEWER_LOGIN],
              }),
            ]
          },
          async getIssue() {
            return issue({ number: 174, labels: [LABEL_IN_PROGRESS] })
          },
          async editLabels(_n, labels) {
            ghLog.push(`editLabels:${JSON.stringify(labels)}`)
          },
          async getDefaultBranch() {
            return "main"
          },
          async createBranch() {},
          async createPullRequest() {
            ghLog.push("createPullRequest")
            return {
              number: 1,
              url: "https://github.com/o/r/pull/1",
              state: "open",
              mergedAt: null,
            }
          },
          async addComment() {
            ghLog.push("addComment")
          },
          async listComments() {
            return comments.listComments()
          },
          async listPullRequests() {
            return []
          },
          async listPullRequestComments() {
            return []
          },
          async addPullRequestComment() {},
          async squashMerge() {},
        },
        git: {
          async remoteName() {
            return "origin"
          },
          async fetch() {
            gitLog.push("fetch")
          },
          async checkoutFetched() {
            gitLog.push("checkoutFetched")
          },
          async checkoutLocalBranch(branch: string) {
            gitLog.push(`checkoutLocalBranch:${branch}`)
          },
          async mergeFetched() {
            return { status: "merged" }
          },
          async headCommit() {
            return "before"
          },
          async hasChanges() {
            return true
          },
          async commitAll() {
            gitLog.push("commitAll")
          },
          async push() {
            gitLog.push("push")
          },
          async localBranchNames() {
            return ["task-174"]
          },
        },
        agent: {
          async implement() {
            ghLog.push("implement")
          },
          async fix() {},
          async quick() {},
        },
        createProcedureFile: async () => {
          const filePath = path.join(workDir, "procedure.txt")
          await writeFile(filePath, "手順\n", "utf8")
          return {
            path: filePath,
            async remove() {},
          }
        },
      })
      await runner.resumeInterruptedImplementationOnce()
      expect(gitLog).toContain("checkoutLocalBranch:task-174")
      expect(gitLog).not.toContain("checkoutFetched")
      expect(ghLog).not.toContain("editLabels:undefined")
      expect(ghLog.filter((l) => l.startsWith("editLabels")).length).toBe(1)
      expect(ghLog).toContain("implement")
      expect(ghLog).toContain("createPullRequest")
    })
  })
})

describe("canonical runner REQ", () => {
  test("REQ-948 から REQ-953 と変更 REQ-575", async () => {
    const text = await readFile(
      path.join(import.meta.dir, "..", "docs", "canonical", "runner.md"),
      "utf8",
    )
    expect(text).toContain("## REQ-948")
    expect(text).toContain("## REQ-949")
    expect(text).toContain("## REQ-950")
    expect(text).toContain("## REQ-951")
    expect(text).toContain("## REQ-952")
    expect(text).toContain("## REQ-953")
    expect(text).toContain(".sdd-cur/clone-id")
    expect(text).not.toContain(
      "識別子は`createRunner` を一回呼ぶたびに、`node:crypto` の `randomUUID` で一つ作る。ログイン名ではない。同じアカウントの二つのプロセスは、別の識別子を持つ。環境変数もファイルも読まない。",
    )
  })
})



