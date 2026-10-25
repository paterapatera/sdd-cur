import { describe, expect, test } from "bun:test"
import { createAgent } from "./agent.ts"
import {
  deleteLocalTaskBranches,
  runLoop,
  type LocalTaskBranchGit,
} from "./run.ts"
import { createRunner, type Runner } from "./runner.ts"
import { issue, VIEWER_LOGIN } from "./runner-test-support.ts"

const zeroLaunches = () => ({ quick: 0, implement: 0, fix: 0 })

function minimalRunnerGit(headSha = "deadbeef") {
  return {
    async remoteName() {
      return "origin"
    },
    async fetch() {},
    async checkoutFetched() {},
    async mergeFetched() {
      return { status: "merged" as const }
    },
    async headCommit() {
      return headSha
    },
    async hasChanges() {
      return false
    },
    async commitAll() {},
    async push() {},
    async createBranch() {},
    async currentBranch() {
      return "main"
    },
    async localBranchNames() {
      return []
    },
    async deleteLocalBranch() {
      throw new Error("deleteLocalBranch should not be called")
    },
  }
}

describe("deleteLocalTaskBranches", () => {
  test("main 上で task- ブランチだけ削除する", async () => {
    const deleted: string[] = []
    const git: LocalTaskBranchGit = {
      async currentBranch() {
        return "main"
      },
      async hasChanges() {
        return false
      },
      async localBranchNames() {
        return ["task-10", "task-2", "main"]
      },
      async deleteLocalBranch(name) {
        deleted.push(name)
      },
    }

    await expect(deleteLocalTaskBranches(git)).resolves.toBe("proceed")
    expect(deleted).toEqual(["task-10", "task-2"])
  })

  test("task- 上で未コミットが無ければ task- ブランチを削除する", async () => {
    const deleted: string[] = []
    const git: LocalTaskBranchGit = {
      async currentBranch() {
        return "task-2"
      },
      async hasChanges() {
        return false
      },
      async localBranchNames() {
        return ["task-10", "task-2"]
      },
      async deleteLocalBranch(name) {
        deleted.push(name)
      },
    }

    await expect(deleteLocalTaskBranches(git)).resolves.toBe("proceed")
    expect(deleted).toEqual(["task-10", "task-2"])
  })

  test("task- で始まる名前が無いときは削除しない", async () => {
    let deleteCalled = false
    const git: LocalTaskBranchGit = {
      async currentBranch() {
        return "main"
      },
      async hasChanges() {
        return false
      },
      async localBranchNames() {
        return ["main", "feature-x"]
      },
      async deleteLocalBranch() {
        deleteCalled = true
      },
    }

    await expect(deleteLocalTaskBranches(git)).resolves.toBe("proceed")
    expect(deleteCalled).toBe(false)
  })
})

describe("runLoop", () => {
  test("削除が proceed のあと開始行と skipWork 偽で process を呼ぶ", async () => {
    let pollCount = 0
    let processOptions: { skipWork?: boolean } | undefined
    let stop = false
    const runner: Runner = {
      async poll() {
        pollCount += 1
        if (pollCount === 1) {
          return { id: "9" }
        }
        stop = true
        return null
      },
      async process(_item, options) {
        processOptions = options
      },
      agentLaunches: zeroLaunches,
      resumeInterruptedImplementationOnce: async () => {},
    }

    const logs: string[] = []
    await runLoop({
      runner,
      git: {
        async currentBranch() {
          return "main"
        },
        async hasChanges() {
          return false
        },
        async localBranchNames() {
          return []
        },
        async deleteLocalBranch() {
          throw new Error("unexpected delete")
        },
      },
      intervalMin: 1,
      shouldStop: () => stop,
      sleep: async () => {},
      log: (line) => logs.push(line),
      logError: () => {},
      commentFailure: async () => {},
    })

    expect(logs[0]).toBe("処理を開始します: 9")
    expect(processOptions).toEqual({ skipWork: false })
  })

  test("task- 上で未コミットがあるとき削除せず skipWork 真で process を呼ぶ", async () => {
    let localNamesCalled = false
    let deleteCalled = false
    let logErrorCalled = false
    let processOptions: { skipWork?: boolean } | undefined
    let pollCount = 0
    let stop = false
    const runner: Runner = {
      async poll() {
        pollCount += 1
        if (pollCount === 1) {
          return { id: "5" }
        }
        stop = true
        return null
      },
      async process(_item, options) {
        processOptions = options
      },
      agentLaunches: zeroLaunches,
      resumeInterruptedImplementationOnce: async () => {},
    }

    const logs: string[] = []
    const code = await runLoop({
      runner,
      git: {
        async currentBranch() {
          return "task-2"
        },
        async hasChanges() {
          return true
        },
        async localBranchNames() {
          localNamesCalled = true
          return ["task-10", "task-2"]
        },
        async deleteLocalBranch() {
          deleteCalled = true
        },
      },
      intervalMin: 1,
      shouldStop: () => stop,
      sleep: async () => {},
      log: (line) => logs.push(line),
      logError: () => {
        logErrorCalled = true
      },
      commentFailure: async () => {},
    })

    expect(localNamesCalled).toBe(false)
    expect(deleteCalled).toBe(false)
    expect(logErrorCalled).toBe(false)
    expect(logs[0]).toBe("処理を開始します: 5")
    expect(processOptions).toEqual({ skipWork: true })
    expect(code).toBe(0)
  })

  test("削除が拒否したとき開始行より前に logError し skipWork 真で process を呼ぶ", async () => {
    const deleteReason = "branch delete failed"
    let processOptions: { skipWork?: boolean } | undefined
    let pollCount = 0
    let stop = false
    const runner: Runner = {
      async poll() {
        pollCount += 1
        if (pollCount === 1) {
          return { id: "7" }
        }
        stop = true
        return null
      },
      async process(_item, options) {
        processOptions = options
      },
      agentLaunches: zeroLaunches,
      resumeInterruptedImplementationOnce: async () => {},
    }

    const logs: string[] = []
    const errors: string[] = []
    await runLoop({
      runner,
      git: {
        async currentBranch() {
          return "main"
        },
        async hasChanges() {
          return false
        },
        async localBranchNames() {
          return ["task-1"]
        },
        async deleteLocalBranch() {
          throw new Error(deleteReason)
        },
      },
      intervalMin: 1,
      shouldStop: () => stop,
      sleep: async () => {},
      log: (line) => logs.push(line),
      logError: (line) => errors.push(line),
      commentFailure: async () => {},
    })

    expect(errors).toEqual([deleteReason])
    expect(logs[0]).toBe("処理を開始します: 7")
    expect(processOptions).toEqual({ skipWork: true })
  })

  test("見送りでも commentFailure せず終了コード 0 で終了行のあと次の poll", async () => {
    async function runSkipScenario(
      git: LocalTaskBranchGit,
    ): Promise<{ pollCount: number; commentCalled: boolean; code: 0 | 1; logs: string[] }> {
      let pollCount = 0
      let commentCalled = false
      let stop = false
      const logs: string[] = []
      const runner: Runner = {
        async poll() {
          pollCount += 1
          if (pollCount === 1) {
            return { id: "8" }
          }
          stop = true
          return null
        },
        async process() {},
        agentLaunches: zeroLaunches,
        resumeInterruptedImplementationOnce: async () => {},
      }

      const code = await runLoop({
        runner,
        git,
        intervalMin: 1,
        shouldStop: () => stop,
        sleep: async () => {},
        log: (line) => logs.push(line),
        logError: () => {},
        commentFailure: async () => {
          commentCalled = true
        },
        now: () => 0,
      })

      return { pollCount, commentCalled, code, logs }
    }

    const uncommitted = await runSkipScenario({
      async currentBranch() {
        return "task-1"
      },
      async hasChanges() {
        return true
      },
      async localBranchNames() {
        return ["task-1"]
      },
      async deleteLocalBranch() {
        throw new Error("should not delete")
      },
    })
    expect(uncommitted.commentCalled).toBe(false)
    expect(uncommitted.code).toBe(0)
    expect(uncommitted.logs).toContain("処理を終了します: 8 (0s)")
    expect(uncommitted.pollCount).toBe(2)

    const deleteFailed = await runSkipScenario({
      async currentBranch() {
        return "main"
      },
      async hasChanges() {
        return false
      },
      async localBranchNames() {
        return ["task-3"]
      },
      async deleteLocalBranch() {
        throw new Error("delete rejected")
      },
    })
    expect(deleteFailed.commentCalled).toBe(false)
    expect(deleteFailed.code).toBe(0)
    expect(deleteFailed.logs).toContain("処理を終了します: 8 (0s)")
    expect(deleteFailed.pollCount).toBe(2)
  })

  test("poll が null のとき削除手順を呼ばない", async () => {
    let gitTouched = false
    let stop = false
    const runner: Runner = {
      async poll() {
        stop = true
        return null
      },
      async process() {},
      agentLaunches: zeroLaunches,
      resumeInterruptedImplementationOnce: async () => {},
    }

    await runLoop({
      runner,
      git: {
        async currentBranch() {
          gitTouched = true
          return "main"
        },
        async hasChanges() {
          gitTouched = true
          return false
        },
        async localBranchNames() {
          gitTouched = true
          return []
        },
        async deleteLocalBranch() {
          gitTouched = true
        },
      },
      intervalMin: 1,
      shouldStop: () => stop,
      sleep: async () => {},
      log: () => {},
      logError: () => {},
      commentFailure: async () => {},
    })

    expect(gitTouched).toBe(false)
  })

  test("開始行のあとで時刻を取り削除の前では取らない", async () => {
    let nowCalls = 0
    const now = () => {
      nowCalls += 1
      if (nowCalls === 1) {
        return 1000
      }
      return 5000
    }

    let pollCount = 0
    let stop = false
    const runner: Runner = {
      async poll() {
        pollCount += 1
        if (pollCount === 1) {
          return { id: "18" }
        }
        stop = true
        return null
      },
      async process() {},
      agentLaunches: zeroLaunches,
      resumeInterruptedImplementationOnce: async () => {},
    }

    const logs: string[] = []
    await runLoop({
      runner,
      git: {
        async currentBranch() {
          return "main"
        },
        async hasChanges() {
          return false
        },
        async localBranchNames() {
          return ["task-99"]
        },
        async deleteLocalBranch() {
          expect(nowCalls).toBe(0)
        },
      },
      intervalMin: 1,
      shouldStop: () => stop,
      sleep: async () => {},
      log: (line) => logs.push(line),
      logError: () => {},
      commentFailure: async () => {},
      now,
    })

    expect(nowCalls).toBeGreaterThanOrEqual(1)
    expect(logs[0]).toBe("処理を開始します: 18")
    expect(logs[1]).toBe("処理を終了します: 18 (4s)")
  })
})

describe("createRunner process skipWork", () => {
  test("skipWork が真のとき resetLaunchCounts のあと getIssue を呼ばない", async () => {
    let getIssueCalls = 0
    const agent = createAgent({
      agent: {
        async run() {
          return { stdout: "", stderr: "", exitCode: 0 }
        },
      },
      cwd: "/proj",
    })
    await agent.implement({
      issueNumber: 1,
      procedurePath: "/tmp/p",
    })
    expect(agent.launchCounts().implement).toBe(1)

    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          getIssueCalls += 1
          return issue({ number: 1, state: "closed", body: "", labels: [] })
        },
        async editLabels() {
          throw new Error("unexpected editLabels")
        },
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
      git: minimalRunnerGit(),
      agent,
      createProcedureFile: async () => ({
        path: "/tmp/unused.txt",
        async remove() {},
      }),
    })

    await runner.process({ id: "1" }, { skipWork: true })
    expect(getIssueCalls).toBe(0)
    expect(runner.agentLaunches()).toEqual({ quick: 0, implement: 0, fix: 0 })
  })

  test("第 2 引数が無いときと skipWork が偽のとき getIssue を呼ぶ", async () => {
    let getIssueCalls = 0
    const agent = createAgent({
      agent: {
        async run() {
          return { stdout: "", stderr: "", exitCode: 0 }
        },
      },
      cwd: "/proj",
    })

    const runner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue(n: number) {
          getIssueCalls += 1
          return issue({ number: n, state: "closed", body: "", labels: [] })
        },
        async editLabels() {
          throw new Error("unexpected editLabels")
        },
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
      git: minimalRunnerGit(),
      agent,
      createProcedureFile: async () => ({
        path: "/tmp/unused.txt",
        async remove() {},
      }),
    })

    await runner.process({ id: "1" })
    await runner.process({ id: "2" }, { skipWork: false })
    expect(getIssueCalls).toBe(2)
  })
})
