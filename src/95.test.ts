import { describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { createAgent, type AgentRunner } from "./agent.ts"
import type { GitResult } from "./git.ts"
import {
  formatDurationMs,
  formatProcessTiming,
  runLoop,
  type LocalTaskBranchGit,
} from "./run.ts"
import { createRunner, type Runner } from "./runner.ts"
import {
  createIssueCommentStore,
  issue,
  LABEL_IN_PROGRESS,
  VIEWER_LOGIN,
} from "./runner-test-support.ts"

function recordingAgentRunner(
  handler: () => GitResult,
): { runner: AgentRunner; calls: { args: string[]; cwd: string }[] } {
  const calls: { args: string[]; cwd: string }[] = []
  const runner: AgentRunner = {
    async run(args, options) {
      calls.push({ args, cwd: options.cwd })
      return handler()
    },
  }
  return { runner, calls }
}

function noDeletionGit(): LocalTaskBranchGit {
  return {
    async currentBranch() {
      return "main"
    },
    async localBranchNames() {
      return []
    },
    async hasChanges() {
      return false
    },
    async deleteLocalBranch() {
      throw new Error("deleteLocalBranch should not be called")
    },
  }
}

function minimalGitDeps(headSha = "deadbeef") {
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
      return true
    },
    async commitAll() {},
    async push() {},
    async createBranch() {},
  }
}

describe("formatDurationMs", () => {
  test.each([
    [0, "0s"],
    [999, "0s"],
    [1000, "1s"],
    [15000, "15s"],
    [59600, "59s"],
    [59900, "59s"],
    [59999, "59s"],
    [60000, "1m"],
    [120000, "2m"],
    [135000, "2m15s"],
    [3930000, "65m30s"],
  ] as const)("formatDurationMs(%i) is %s", (elapsedMs, expected) => {
    expect(formatDurationMs(elapsedMs)).toBe(expected)
  })
})

describe("formatProcessTiming", () => {
  const elapsed135s = 135000

  test("135000 with quick=1 implement=2 fix=0", () => {
    expect(
      formatProcessTiming(elapsed135s, { quick: 1, implement: 2, fix: 0 }),
    ).toBe("(2m15s quick=1 implement=2)")
  })

  test("135000 with all launch types at 1", () => {
    expect(
      formatProcessTiming(elapsed135s, { quick: 1, implement: 1, fix: 1 }),
    ).toBe("(2m15s quick=1 implement=1 fix=1)")
  })

  test("135000 with no agent launches", () => {
    expect(
      formatProcessTiming(elapsed135s, { quick: 0, implement: 0, fix: 0 }),
    ).toBe("(2m15s)")
  })

  test("135000 with quick=1 only", () => {
    expect(
      formatProcessTiming(elapsed135s, { quick: 1, implement: 0, fix: 0 }),
    ).toBe("(2m15s quick=1)")
  })
})

describe("runLoop", () => {
  test("正常終了は開始行のあとの時間と agentLaunches を終了行に書く", async () => {
    let nowCall = 0
    const now = () => {
      nowCall += 1
      if (nowCall === 1) {
        return 1000
      }
      return 136000
    }
    let pollCount = 0
    const runner: Runner = {
      async poll() {
        pollCount += 1
        if (pollCount === 1) {
          return { id: "42" }
        }
        return null
      },
      async process() {},
      agentLaunches() {
        return { quick: 1, implement: 2, fix: 0 }
      },
    }

    const logs: string[] = []
    const errors: string[] = []
    let stop = false
    await runLoop({
      runner,
      git: noDeletionGit(),
      intervalMin: 1,
      shouldStop: () => stop,
      sleep: async () => {
        stop = true
      },
      log: (line) => logs.push(line),
      logError: (line) => errors.push(line),
      commentFailure: async () => {},
      now,
    })

    expect(logs[0]).toBe("処理を開始します: 42")
    expect(logs[1]).toBe(
      "処理を終了します: 42 (2m15s quick=1 implement=2)",
    )
    expect(errors).toEqual([])
  })

  test("process 失敗は理由のあと括弧行を commentFailure の前に書く", async () => {
    const reason = "理由"
    let nowCall = 0
    const now = () => {
      nowCall += 1
      if (nowCall === 1) {
        return 0
      }
      return 135000
    }
    let pollCount = 0
    let commentAfterTiming = false
    let timingWritten = false
    const runner: Runner = {
      async poll() {
        pollCount += 1
        return { id: "42" }
      },
      async process() {
        throw new Error(reason)
      },
      agentLaunches() {
        return { quick: 1, implement: 0, fix: 0 }
      },
    }

    const errors: string[] = []
    const code = await runLoop({
      runner,
      git: noDeletionGit(),
      intervalMin: 1,
      shouldStop: () => false,
      sleep: async () => {},
      log: () => {},
      logError: (line) => {
        if (line === "(2m15s quick=1)") {
          timingWritten = true
        }
        errors.push(line)
      },
      commentFailure: async (_issueId, line) => {
        commentAfterTiming = timingWritten
        expect(line).toBe(reason)
      },
      now,
    })

    expect(code).toBe(1)
    expect(errors).toEqual([reason, "(2m15s quick=1)"])
    expect(commentAfterTiming).toBe(true)
    expect(pollCount).toBe(1)
  })

  test("括弧行は commentFailure 中の now では変わらない", async () => {
    let nowCall = 0
    const now = () => {
      nowCall += 1
      if (nowCall === 1) {
        return 0
      }
      if (nowCall === 2) {
        return 15000
      }
      return 999999
    }
    const runner: Runner = {
      async poll() {
        return { id: "1" }
      },
      async process() {
        throw new Error("fail")
      },
      agentLaunches() {
        return { quick: 0, implement: 0, fix: 0 }
      },
    }

    const errors: string[] = []
    await runLoop({
      runner,
      git: noDeletionGit(),
      intervalMin: 1,
      shouldStop: () => false,
      sleep: async () => {},
      log: () => {},
      logError: (line) => errors.push(line),
      commentFailure: async () => {
        now()
      },
      now,
    })

    expect(errors).toEqual(["fail", "(15s)"])
  })

  test("投稿拒否は理由と括弧行のあとに拒否の一行", async () => {
    let pollCount = 0
    const runner: Runner = {
      async poll() {
        pollCount += 1
        return { id: "3" }
      },
      async process() {
        throw new Error("process failed")
      },
      agentLaunches() {
        return { quick: 0, implement: 0, fix: 0 }
      },
    }

    const errors: string[] = []
    const code = await runLoop({
      runner,
      git: noDeletionGit(),
      intervalMin: 1,
      shouldStop: () => false,
      sleep: async () => {},
      log: () => {},
      logError: (line) => errors.push(line),
      commentFailure: async () => {
        throw new Error("comment rejected")
      },
      now: () => 0,
    })

    expect(code).toBe(1)
    expect(errors).toEqual(["process failed", "(0s)", "comment rejected"])
    expect(pollCount).toBe(1)
  })

  test("poll 失敗は理由の一行だけで括弧行は無く commentFailure は呼ばない", async () => {
    const pollReason = "poll 失敗"
    let commentCalled = false
    const runner: Runner = {
      async poll() {
        throw new Error(pollReason)
      },
      async process() {},
      agentLaunches() {
        return { quick: 0, implement: 0, fix: 0 }
      },
    }

    const errors: string[] = []
    const code = await runLoop({
      runner,
      git: noDeletionGit(),
      intervalMin: 1,
      shouldStop: () => false,
      sleep: async () => {},
      log: () => {},
      logError: (line) => errors.push(line),
      commentFailure: async () => {
        commentCalled = true
      },
      now: () => 0,
    })

    expect(code).toBe(1)
    expect(errors).toEqual([pollReason])
    expect(commentCalled).toBe(false)
  })
})

describe("createAgent launch counts", () => {
  test("不正な implement は run を呼ばず回数は 0", async () => {
    const { runner, calls } = recordingAgentRunner(() => ({
      stdout: "",
      stderr: "",
      exitCode: 0,
    }))
    const agent = createAgent({ agent: runner, cwd: "/proj" })
    await expect(
      agent.implement({ issueNumber: 0, procedurePath: "/tmp/p" }),
    ).rejects.toThrow("番号が不正です")
    expect(calls).toHaveLength(0)
    expect(agent.launchCounts()).toEqual({ quick: 0, implement: 0, fix: 0 })
  })

  test("implement は run の成否に関わらず 1 回起動分を数え、レビューは数えない", async () => {
    const ok = { stdout: "", stderr: "", exitCode: 0 }
    const fail = { stdout: "", stderr: "err", exitCode: 1 }

    for (const result of [fail, ok, ok]) {
      const { runner } = recordingAgentRunner(() => result)
      const agent = createAgent({ agent: runner, cwd: "/proj" })
      const procedurePath = "/tmp/procedure.txt"
      if (result.exitCode !== 0) {
        await expect(
          agent.implement({ issueNumber: 1, procedurePath }),
        ).rejects.toThrow()
      } else {
        await agent.implement({
          issueNumber: 1,
          procedurePath,
        })
      }
      expect(agent.launchCounts().implement).toBe(1)
    }

    const { runner } = recordingAgentRunner(() => ({
      stdout: "レビュー\nレビュー\nレビュー",
      stderr: "",
      exitCode: 0,
    }))
    const agent = createAgent({ agent: runner, cwd: "/proj" })
    await agent.implement({
      issueNumber: 1,
      procedurePath: "/tmp/procedure.txt",
    })
    expect(agent.launchCounts().implement).toBe(1)
  })

  test("implement は agent.run が拒否しても 1 回起動分を数える", async () => {
    const agent = createAgent({
      agent: {
        async run() {
          throw new Error("spawn failed")
        },
      },
      cwd: "/proj",
    })
    await expect(
      agent.implement({
        issueNumber: 1,
        procedurePath: "/tmp/procedure.txt",
      }),
    ).rejects.toThrow("agent を実行できません")
    expect(agent.launchCounts().implement).toBe(1)
  })

  test("resetLaunchCounts で三種類とも 0", () => {
    const agent = createAgent({
      agent: {
        async run() {
          return { stdout: "", stderr: "", exitCode: 0 }
        },
      },
      cwd: "/proj",
    })
    agent.resetLaunchCounts()
    expect(agent.launchCounts()).toEqual({ quick: 0, implement: 0, fix: 0 })
  })
})

describe("createRunner agentLaunches", () => {
  test("quick 失敗のやり直しで quick が 4、process 先頭で回数を戻す", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-95-"))
    try {
    const failAgent: GitResult = { stdout: "", stderr: "fail", exitCode: 1 }
    const { runner: agentRunner } = recordingAgentRunner(() => failAgent)
    const agent = createAgent({ agent: agentRunner, cwd: tempDir })

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
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          startIssueComments.recordStartComment(body)
          return { url: "https://start" }
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
      git: minimalGitDeps(),
      agent,
      createProcedureFile: async () => ({
        path: path.join(tempDir, "quick-result.txt"),
        async remove() {},
      }),
    })

    await runner.process({ id: "1" })
    expect(runner.agentLaunches()).toEqual({
      quick: 4,
      implement: 0,
      fix: 0,
    })

    const { runner: okRunner } = recordingAgentRunner(() => ({
      stdout: "",
      stderr: "",
      exitCode: 0,
    }))
    const agentWithImplement = createAgent({ agent: okRunner, cwd: tempDir })
    await agentWithImplement.implement({
      issueNumber: 1,
      procedurePath: path.join(tempDir, "procedure.txt"),
    })
    expect(agentWithImplement.launchCounts().implement).toBe(1)

    const resetRunner = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({
            number: 1,
            state: "closed",
            body: "",
            labels: [],
          })
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
      git: minimalGitDeps(),
      agent: agentWithImplement,
      createProcedureFile: async () => ({
        path: path.join(tempDir, "unused.txt"),
        async remove() {},
      }),
    })

    await resetRunner.process({ id: "1" })
    expect(resetRunner.agentLaunches()).toEqual({
      quick: 0,
      implement: 0,
      fix: 0,
    })
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })
})
