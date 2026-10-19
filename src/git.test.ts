import { describe, expect, test } from "bun:test"
import { createGit, type GitResult, type GitRunner } from "./git.ts"

type RecordedCall = { args: string[]; cwd: string }

function recordingRunner(
  handler: (call: RecordedCall, index: number) => GitResult,
): { runner: GitRunner; calls: RecordedCall[] } {
  const calls: RecordedCall[] = []
  const runner: GitRunner = {
    async run(args, options) {
      const call = { args, cwd: options.cwd }
      calls.push(call)
      return handler(call, calls.length - 1)
    },
  }
  return { runner, calls }
}

function ok(stdout = ""): GitResult {
  return { stdout, stderr: "", exitCode: 0 }
}

function fail(stderr: string): GitResult {
  return { stdout: "", stderr, exitCode: 1 }
}

describe("createGit", () => {
  test("remoteName は origin 一行のとき origin", async () => {
    const { runner } = recordingRunner(() => ok("origin\n"))
    const git = createGit({ git: runner, cwd: "/proj" })
    await expect(git.remoteName()).resolves.toBe("origin")
  })

  test("remoteName は空のとき リモートを特定できません", async () => {
    const { runner } = recordingRunner(() => ok(""))
    const git = createGit({ git: runner, cwd: "/proj" })
    await expect(git.remoteName()).rejects.toThrow("リモートを特定できません")
  })

  test("remoteName は二行のとき リモートを特定できません", async () => {
    const { runner } = recordingRunner(() => ok("origin\nupstream\n"))
    const git = createGit({ git: runner, cwd: "/proj" })
    await expect(git.remoteName()).rejects.toThrow("リモートを特定できません")
  })

  test("fetch checkoutFetched push の引数", async () => {
    const { runner, calls } = recordingRunner(() => ok())
    const git = createGit({ git: runner, cwd: "/proj" })
    await git.fetch("origin", "sdd-cur/1")
    await git.checkoutFetched("sdd-cur/1")
    await git.push("origin", "sdd-cur/1")
    expect(calls[0]?.args).toEqual(["fetch", "origin", "sdd-cur/1"])
    expect(calls[1]?.args).toEqual(["checkout", "-B", "sdd-cur/1", "FETCH_HEAD"])
    expect(calls[2]?.args).toEqual(["push", "-u", "origin", "sdd-cur/1"])
    expect(calls[2]?.args).not.toContain("--force")
  })

  test("hasChanges", async () => {
    let calls = 0
    const { runner } = recordingRunner(() => {
      calls += 1
      return calls === 1 ? ok("") : ok(" M file\n")
    })
    const git = createGit({ git: runner, cwd: "/proj" })
    await expect(git.hasChanges()).resolves.toBe(false)
    await expect(git.hasChanges()).resolves.toBe(true)
  })

  test("commitAll は add のあと commit", async () => {
    const { runner, calls } = recordingRunner(() => ok())
    const git = createGit({ git: runner, cwd: "/proj" })
    await git.commitAll("msg")
    expect(calls[0]?.args).toEqual(["add", "-A"])
    expect(calls[1]?.args).toEqual(["commit", "-m", "msg"])
  })

  test("headCommit は rev-parse HEAD の最初の非空行", async () => {
    const { runner, calls } = recordingRunner(() => ok("\n  abcdef  \n"))
    const git = createGit({ git: runner, cwd: "/proj" })
    await expect(git.headCommit()).resolves.toBe("abcdef")
    expect(calls[0]?.args).toEqual(["rev-parse", "HEAD"])
  })

  test("commitAll は add が拒否したとき commit を呼ばない", async () => {
    let n = 0
    const { runner, calls } = recordingRunner(() => {
      n += 1
      return n === 1 ? fail("add failed") : ok()
    })
    const git = createGit({ git: runner, cwd: "/proj" })
    await expect(git.commitAll("msg")).rejects.toThrow("add failed")
    expect(calls).toHaveLength(1)
  })

  test("mergeFetched 成功は merge のみ", async () => {
    const { runner, calls } = recordingRunner(() => ok())
    const git = createGit({ git: runner, cwd: "/proj" })
    await expect(git.mergeFetched()).resolves.toEqual({ status: "merged" })
    expect(calls).toEqual([{ args: ["merge", "FETCH_HEAD", "--no-edit"], cwd: "/proj" }])
  })

  test("mergeFetched コンフリクトは abort して files を返す", async () => {
    let n = 0
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "merge" && call.args[1] === "FETCH_HEAD") {
        return fail("conflict")
      }
      if (call.args[0] === "diff") {
        return ok("b\na\n")
      }
      return ok()
    })
    const git = createGit({ git: runner, cwd: "/proj" })
    await expect(git.mergeFetched()).resolves.toEqual({
      status: "conflict",
      files: ["a", "b"],
    })
    expect(calls.map((c) => c.args)).toEqual([
      ["merge", "FETCH_HEAD", "--no-edit"],
      ["diff", "--name-only", "--diff-filter=U"],
      ["merge", "--abort"],
    ])
  })

  test("mergeFetched 未マージパスが空のとき abort しない", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "merge" && call.args[1] === "FETCH_HEAD") {
        return fail("merge err")
      }
      return ok("")
    })
    const git = createGit({ git: runner, cwd: "/proj" })
    await expect(git.mergeFetched()).rejects.toThrow("merge err")
    expect(calls.some((c) => c.args[0] === "merge" && c.args[1] === "--abort")).toBe(
      false,
    )
  })

  test("mergeFetched abort 失敗", async () => {
    const { runner } = recordingRunner((call) => {
      if (call.args[0] === "merge" && call.args[1] === "FETCH_HEAD") {
        return fail("conflict")
      }
      if (call.args[0] === "diff") {
        return ok("f\n")
      }
      if (call.args[0] === "merge" && call.args[1] === "--abort") {
        return fail("abort err")
      }
      return ok()
    })
    const git = createGit({ git: runner, cwd: "/proj" })
    await expect(git.mergeFetched()).rejects.toThrow("abort err")
  })
})
