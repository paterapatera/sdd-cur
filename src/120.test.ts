import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { prepareBranch, type GitResult, type GitRunner } from "./git.ts"
import { implementationBranch } from "./runner.ts"

const cliPath = path.join(import.meta.dir, "cli.ts")
const bunExe = process.execPath
const root = path.join(import.meta.dir, "..")
const BRANCH = "task-120"
const REMOTE = "origin"

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

function ok(stdout = "", stderr = ""): GitResult {
  return { stdout, stderr, exitCode: 0 }
}

function exitCode(stdout: string, code: number, stderr = ""): GitResult {
  return { stdout, stderr, exitCode: code }
}

function forbiddenInCalls(calls: RecordedCall[], words: string[]): void {
  for (const call of calls) {
    for (const word of words) {
      expect(call.args).not.toContain(word)
    }
  }
}

describe("120 prepare-branch", () => {
  test("help に prepare-branch 行がある", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "--help"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: path.dirname(bunExe) },
    })
    const stderr = await new Response(proc.stderr).text()
    await proc.exited
    expect(stderr.split("\n")).toContain("sdd-cur prepare-branch <番号>")
  })

  test("引数不正は git を起動しない", async () => {
    const cases: { args: string[]; stderr: string }[] = [
      { args: [], stderr: "sdd-cur install" },
      { args: ["1", "2"], stderr: "sdd-cur install" },
      { args: ["foo"], stderr: "番号が不正です" },
      { args: ["0"], stderr: "番号が不正です" },
      { args: ["01"], stderr: "番号が不正です" },
    ]
    for (const { args, stderr: expectStart } of cases) {
      const proc = Bun.spawn([bunExe, cliPath, "prepare-branch", ...args], {
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: path.dirname(bunExe) },
      })
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ])
      const code = await proc.exited
      expect(code).toBe(1)
      expect(stdout).toBe("")
      if (expectStart === "番号が不正です") {
        expect(stderr.trim()).toBe("番号が不正です")
      } else {
        expect(stderr).toContain("sdd-cur install")
      }
    }
  })

  test("implementationBranch と import", async () => {
    expect(implementationBranch(120)).toBe(BRANCH)
    const cliSource = await readFile(cliPath, "utf8")
    const gitSource = await readFile(path.join(import.meta.dir, "git.ts"), "utf8")
    expect(cliSource).not.toContain("task-")
    expect(gitSource).not.toContain("implementationBranch")
  })

  test("リモートが特定できない", async () => {
    for (const stdout of ["", `${REMOTE}\nupstream\n`]) {
      const { runner, calls } = recordingRunner(() => ok(stdout))
      await expect(
        prepareBranch({ git: runner, cwd: "/tmp", branch: BRANCH }),
      ).rejects.toThrow("リモートを特定できません")
      expect(calls.map((c) => c.args)).toEqual([["remote"]])
    }
  })

  test("ローカルにあるとき checkout だけ", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "remote") return ok(`${REMOTE}\n`)
      if (call.args[0] === "show-ref") return exitCode("", 0)
      if (call.args[0] === "checkout") return ok()
      if (call.args[0] === "rev-parse") return ok(`${BRANCH}\n`)
      return ok()
    })
    await prepareBranch({ git: runner, cwd: "/tmp", branch: BRANCH })
    expect(calls.map((c) => c.args)).toEqual([
      ["remote"],
      ["show-ref", "--verify", "--quiet", `refs/heads/${BRANCH}`],
      ["checkout", BRANCH],
      ["rev-parse", "--abbrev-ref", "HEAD"],
    ])
    forbiddenInCalls(calls, ["fetch", "ls-remote", "-b", "-B"])
  })

  test("リモートにあるとき fetch と checkout -B", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "remote") return ok(`${REMOTE}\n`)
      if (call.args[0] === "show-ref") return exitCode("", 1)
      if (call.args[0] === "ls-remote" && call.args[1] === "--heads") {
        return ok(`abc\trefs/heads/${BRANCH}\n`)
      }
      if (call.args[0] === "fetch") return ok()
      if (call.args[0] === "checkout") return ok()
      if (call.args[0] === "rev-parse") return ok(`${BRANCH}\n`)
      return ok()
    })
    await prepareBranch({ git: runner, cwd: "/tmp", branch: BRANCH })
    expect(calls.map((c) => c.args)).toEqual([
      ["remote"],
      ["show-ref", "--verify", "--quiet", `refs/heads/${BRANCH}`],
      ["ls-remote", "--heads", REMOTE, BRANCH],
      ["fetch", REMOTE, BRANCH],
      ["checkout", "-B", BRANCH, "FETCH_HEAD"],
      ["rev-parse", "--abbrev-ref", "HEAD"],
    ])
    expect(calls.some((c) => c.args.includes("-b"))).toBe(false)
    expect(calls.some((c) => c.args.includes("--symref"))).toBe(false)
  })

  test("task-1200 だけではリモートにあることにしない", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "remote") return ok(`${REMOTE}\n`)
      if (call.args[0] === "show-ref") return exitCode("", 1)
      if (call.args[0] === "ls-remote" && call.args[1] === "--heads") {
        return ok(`abc\trefs/heads/task-1200\n`)
      }
      if (call.args[0] === "ls-remote" && call.args[1] === "--symref") {
        return ok(`ref: refs/heads/main\tHEAD\n`)
      }
      if (call.args[0] === "fetch") return ok()
      if (call.args[0] === "checkout") return ok()
      if (call.args[0] === "rev-parse") return ok(`${BRANCH}\n`)
      return ok()
    })
    await prepareBranch({ git: runner, cwd: "/tmp", branch: BRANCH })
    expect(calls.some((c) => c.args[0] === "checkout" && c.args[1] === "-B")).toBe(
      false,
    )
    expect(calls.some((c) => c.args[0] === "checkout" && c.args[1] === "-b")).toBe(
      true,
    )
  })

  test("新規作成は symref から main を fetch して checkout -b", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "remote") return ok(`${REMOTE}\n`)
      if (call.args[0] === "show-ref") return exitCode("", 1)
      if (call.args[0] === "ls-remote" && call.args[1] === "--heads") return ok("")
      if (call.args[0] === "ls-remote" && call.args[1] === "--symref") {
        return ok(`ref: refs/heads/main\tHEAD\n`)
      }
      if (call.args[0] === "fetch") return ok()
      if (call.args[0] === "checkout") return ok()
      if (call.args[0] === "rev-parse") return ok(`${BRANCH}\n`)
      return ok()
    })
    await prepareBranch({ git: runner, cwd: "/tmp", branch: BRANCH })
    expect(calls.map((c) => c.args)).toEqual([
      ["remote"],
      ["show-ref", "--verify", "--quiet", `refs/heads/${BRANCH}`],
      ["ls-remote", "--heads", REMOTE, BRANCH],
      ["ls-remote", "--symref", REMOTE, "HEAD"],
      ["fetch", REMOTE, "main"],
      ["checkout", "-b", BRANCH, "FETCH_HEAD"],
      ["rev-parse", "--abbrev-ref", "HEAD"],
    ])
    expect(calls.some((c) => c.args.includes("-B"))).toBe(false)
  })

  test("デフォルトブランチを特定できない", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "remote") return ok(`${REMOTE}\n`)
      if (call.args[0] === "show-ref") return exitCode("", 1)
      if (call.args[0] === "ls-remote" && call.args[1] === "--heads") return ok("")
      if (call.args[0] === "ls-remote" && call.args[1] === "--symref") {
        return ok(`0123\tHEAD\n`)
      }
      return ok()
    })
    await expect(
      prepareBranch({ git: runner, cwd: "/tmp", branch: BRANCH }),
    ).rejects.toThrow("デフォルトブランチを特定できません")
    expect(calls.some((c) => c.args[0] === "fetch")).toBe(false)
    expect(calls.some((c) => c.args[0] === "checkout")).toBe(false)
  })

  test("途中失敗", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "remote") return ok(`${REMOTE}\n`)
      if (call.args[0] === "show-ref") return exitCode("", 2, "git err")
      return ok()
    })
    await expect(
      prepareBranch({ git: runner, cwd: "/tmp", branch: BRANCH }),
    ).rejects.toThrow("git err")
    expect(calls.some((c) => c.args[0] === "ls-remote")).toBe(false)

    const headsFail = recordingRunner((call) => {
      if (call.args[0] === "remote") return ok(`${REMOTE}\n`)
      if (call.args[0] === "show-ref") return exitCode("", 1)
      if (call.args[0] === "ls-remote" && call.args[1] === "--heads") {
        return exitCode("", 1, "heads fail")
      }
      return ok()
    })
    await expect(
      prepareBranch({ git: headsFail.runner, cwd: "/tmp", branch: BRANCH }),
    ).rejects.toThrow("heads fail")
    expect(headsFail.calls.some((c) => c.args.includes("--symref"))).toBe(false)

    const fetchFail = recordingRunner((call) => {
      if (call.args[0] === "remote") return ok(`${REMOTE}\n`)
      if (call.args[0] === "show-ref") return exitCode("", 1)
      if (call.args[0] === "ls-remote" && call.args[1] === "--heads") return ok("")
      if (call.args[0] === "ls-remote" && call.args[1] === "--symref") {
        return ok(`ref: refs/heads/main\tHEAD\n`)
      }
      if (call.args[0] === "fetch") return exitCode("", 1, "fetch fail")
      return ok()
    })
    await expect(
      prepareBranch({ git: fetchFail.runner, cwd: "/tmp", branch: BRANCH }),
    ).rejects.toThrow("fetch fail")
    expect(
      fetchFail.calls.some(
        (c) => c.args[0] === "checkout" && c.args[1] === "-b",
      ),
    ).toBe(false)

    const emptyErr = recordingRunner((call) => {
      if (call.args[0] === "remote") return ok(`${REMOTE}\n`)
      if (call.args[0] === "show-ref") return exitCode("", 2, "")
      return ok()
    })
    await expect(
      prepareBranch({ git: emptyErr.runner, cwd: "/tmp", branch: BRANCH }),
    ).rejects.toThrow("git が失敗しました")

    const rejectRunner: GitRunner = {
      async run() {
        throw new Error("spawn failed")
      },
    }
    await expect(
      prepareBranch({ git: rejectRunner, cwd: "/tmp", branch: BRANCH }),
    ).rejects.toThrow("git を実行できません")
  })

  test("禁止 git 操作が無い", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "remote") return ok(`${REMOTE}\n`)
      if (call.args[0] === "show-ref") return exitCode("", 0)
      if (call.args[0] === "checkout") return ok()
      if (call.args[0] === "rev-parse") return ok(`${BRANCH}\n`)
      return ok()
    })
    await prepareBranch({ git: runner, cwd: "/tmp", branch: BRANCH })
    forbiddenInCalls(calls, ["merge", "rebase", "push", "reset", "commit"])
  })

  test("HEAD 一致で成功、不一致で止まる", async () => {
    const { runner } = recordingRunner((call) => {
      if (call.args[0] === "remote") return ok(`${REMOTE}\n`)
      if (call.args[0] === "show-ref") return exitCode("", 0)
      if (call.args[0] === "checkout") return ok()
      if (call.args[0] === "rev-parse") return ok(`${BRANCH}\n`)
      return ok()
    })
    await expect(
      prepareBranch({ git: runner, cwd: "/tmp", branch: BRANCH }),
    ).resolves.toBeUndefined()

    const mismatch = recordingRunner((call) => {
      if (call.args[0] === "remote") return ok(`${REMOTE}\n`)
      if (call.args[0] === "show-ref") return exitCode("", 0)
      if (call.args[0] === "checkout") return ok()
      if (call.args[0] === "rev-parse") return ok("main\n")
      return ok()
    })
    await expect(
      prepareBranch({ git: mismatch.runner, cwd: "/tmp", branch: BRANCH }),
    ).rejects.toThrow("今のブランチが作業ブランチと違います")
    expect(mismatch.calls.filter((c) => c.args[0] === "rev-parse").length).toBe(1)
  })

  test("スキル本文と runner", async () => {
    const skill = await readFile(
      path.join(root, "skills/sdd-cur/SKILL.md"),
      "utf8",
    )
    const reqStart = skill.indexOf("## 要件")
    const designStart = skill.indexOf("## 設計")
    const reqSection = skill.slice(reqStart, designStart)
    expect(skill).toContain(
      "`sdd-cur prepare-branch <番号>` を実行し、終了コードが 0 以外なら止まる。",
    )
    expect(skill).toContain("終了コードが 0 以外のとき、要求ファイルを変えない。")
    expect(skill).toContain(
      "終了コードが 0 以外のとき、要求の段のサブエージェントを起動しない。",
    )
    expect(skill).toContain(
      "終了コードが 0 以外のとき、用意のための git を自ら実行しない。",
    )
    expect(skill).toContain("終了コードが 0 のあとだけ、要求作成役を起動する。")
    expect(skill).not.toContain("比較を通ったあとだけ、要求作成役を起動する。")
    for (const word of [
      "git ls-remote",
      "git checkout",
      "git fetch",
      "git remote",
      "implementationBranch",
    ]) {
      expect(reqSection).not.toContain(word)
    }
    expect(skill).toContain("sdd-cur branch <番号>")
    expect(skill).toContain(
      "設計作成役を起動する前に、`sdd-cur prepare-branch <番号>` は実行しない。",
    )
    expect(skill).toContain("checkout をしない。")
    expect(skill).toContain("作業ブランチを新しく作らない。")
    expect(skill).toContain("実装のランナーは、この用意をしない。")

    const runnerSource = await readFile(
      path.join(import.meta.dir, "runner.ts"),
      "utf8",
    )
    expect(runnerSource).not.toContain("prepare-branch")

    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-120-"))
    try {
      await expect(
        prepareBranch({ git: recordingRunner(() => ok()).runner, cwd: temp, branch: BRANCH }),
      ).rejects.toThrow()
      const reqPath = path.join(temp, "docs/issues/120/requirements.md")
      const designPath = path.join(temp, "docs/issues/120/design.md")
      await expect(readFile(reqPath, "utf8")).rejects.toThrow()
      await expect(readFile(designPath, "utf8")).rejects.toThrow()
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("policy と AGENTS", async () => {
    const policy = await readFile(path.join(root, "docs/policy.md"), "utf8")
    const agents = await readFile(path.join(root, "AGENTS.md"), "utf8")
    expect(policy).toContain("prepare-branch")
    expect(agents).toContain("bun src/cli.ts prepare-branch <番号>")
  })

  test("cli switch に prepare-branch", async () => {
    const cliSource = await readFile(cliPath, "utf8")
    expect(cliSource).toContain('case "prepare-branch":')
  })
})
