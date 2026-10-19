import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { createGit, type GitResult, type GitRunner } from "./git.ts"
import type { Issue } from "./github.ts"
import { workflowLabels } from "./labels.ts"
import { implementationBranch } from "./runner.ts"
import { requestImplementation } from "./request.ts"

const root = path.join(import.meta.dir, "..")
const cliPath = path.join(import.meta.dir, "cli.ts")
const bunExe = process.execPath

const usageText =
  "sdd-cur install [project-root]\n" +
  "sdd-cur run [--interval-min <1 以上 1440 以下の整数>]\n" +
  "sdd-cur labels\n" +
  "sdd-cur candidates\n" +
  "sdd-cur show <番号>\n" +
  "sdd-cur branch <番号>\n" +
  "sdd-cur confirm <番号>\n" +
  "sdd-cur close <番号>\n" +
  "sdd-cur reflect <番号> <requirements|design>\n" +
  "sdd-cur validate <番号>\n" +
  "sdd-cur complete <番号>\n"

const LABEL_REQUEST = workflowLabels[0].name
const LABEL_IN_PROGRESS = workflowLabels[1].name

const ISSUE = 94
const BRANCH = implementationBranch(ISSUE)
const READY_REQ = `# ${ISSUE} 題\n`
const READY_DES = `# ${ISSUE} 題\n`

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

function issue(partial: Partial<Issue> & Pick<Issue, "number">): Issue {
  return {
    title: "t",
    body: "",
    state: "open",
    labels: [],
    assignees: [],
    url: "https://example.com/i",
    ...partial,
  }
}

type RequestCalls = {
  currentBranch: number
  hasChanges: number
  openGitHub: number
  getIssue: number
  readSpecs: number[]
  remoteName: number
  push: { remote: string; branch: string }[]
  editLabels: {
    number: number
    change: { add?: string[]; remove?: string[] }
  }[]
}

function makeRequestDeps(options: {
  branch?: string
  hasChanges?: boolean
  issue?: Issue
  requirements?: { exists: boolean; markdown: string }
  design?: { exists: boolean; markdown: string }
  remote?: string | Error
  push?: Error
  editLabels?: Error
}) {
  const calls: RequestCalls = {
    currentBranch: 0,
    hasChanges: 0,
    openGitHub: 0,
    getIssue: 0,
    readSpecs: [],
    remoteName: 0,
    push: [],
    editLabels: [],
  }

  const deps = {
    git: {
      async currentBranch() {
        calls.currentBranch += 1
        return options.branch ?? BRANCH
      },
      async hasChanges() {
        calls.hasChanges += 1
        return options.hasChanges ?? false
      },
      async remoteName() {
        calls.remoteName += 1
        if (options.remote instanceof Error) {
          throw options.remote
        }
        return options.remote ?? "origin"
      },
      async push(remote: string, branch: string) {
        calls.push.push({ remote, branch })
        if (options.push instanceof Error) {
          throw options.push
        }
      },
    },
    openGitHub: async () => {
      calls.openGitHub += 1
      return {
        async getIssue(n: number) {
          calls.getIssue += 1
          return options.issue ?? issue({ number: n })
        },
        async editLabels(
          number: number,
          change: { add?: string[]; remove?: string[] },
        ) {
          calls.editLabels.push({ number, change })
          if (options.editLabels instanceof Error) {
            throw options.editLabels
          }
        },
      }
    },
    readSpecs: async (n: number) => {
      calls.readSpecs.push(n)
      return {
        requirements: options.requirements ?? {
          exists: true,
          markdown: READY_REQ,
        },
        design: options.design ?? { exists: true, markdown: READY_DES },
      }
    },
  }

  return { deps, calls }
}

describe("課題 94", () => {
  describe("createGit", () => {
    test("currentBranch は rev-parse --abbrev-ref HEAD の最初の非空行", async () => {
      const { runner, calls } = recordingRunner(() => ok("\n  task-94  \n"))
      const git = createGit({ git: runner, cwd: "/proj" })
      await expect(git.currentBranch()).resolves.toBe("task-94")
      expect(calls[0]?.args).toEqual(["rev-parse", "--abbrev-ref", "HEAD"])
    })

    test("currentBranch は非零終了コードのとき標準エラーの最初の非空行", async () => {
      const { runner } = recordingRunner(() => fail("branch err\n"))
      const git = createGit({ git: runner, cwd: "/proj" })
      await expect(git.currentBranch()).rejects.toThrow("branch err")
    })

    test("currentBranch は非空行が無いとき git が失敗しました", async () => {
      const { runner } = recordingRunner(() => ok("\n\n"))
      const git = createGit({ git: runner, cwd: "/proj" })
      await expect(git.currentBranch()).rejects.toThrow("git が失敗しました")
    })

    test("hasChanges は ?? a のとき真", async () => {
      const { runner } = recordingRunner(() => ok("?? a\n"))
      const git = createGit({ git: runner, cwd: "/proj" })
      await expect(git.hasChanges()).resolves.toBe(true)
    })
  })

  describe("requestImplementation", () => {
    test("番号 0 は番号が不正ですで currentBranch を呼ばない", async () => {
      const { deps, calls } = makeRequestDeps({})
      await expect(requestImplementation(deps, 0)).rejects.toThrow("番号が不正です")
      expect(calls.currentBranch).toBe(0)
    })

    test("作業ブランチでないときは hasChanges 以降を呼ばない", async () => {
      const { deps, calls } = makeRequestDeps({ branch: "main" })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "作業ブランチではありません",
      )
      expect(calls.currentBranch).toBe(1)
      expect(calls.hasChanges).toBe(0)
      expect(calls.openGitHub).toBe(0)
      expect(calls.readSpecs).toHaveLength(0)
      expect(calls.push).toHaveLength(0)
      expect(calls.editLabels).toHaveLength(0)
    })

    test("未コミットの変更があるときは openGitHub 以降を呼ばない", async () => {
      const { deps, calls } = makeRequestDeps({ hasChanges: true })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "未コミットの変更があります",
      )
      expect(calls.hasChanges).toBe(1)
      expect(calls.openGitHub).toBe(0)
      expect(calls.readSpecs).toHaveLength(0)
      expect(calls.push).toHaveLength(0)
      expect(calls.editLabels).toHaveLength(0)
    })

    test("課題が closed のときは readSpecs 以降を呼ばない", async () => {
      const { deps, calls } = makeRequestDeps({
        issue: issue({ number: ISSUE, state: "closed" }),
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "課題は閉じています",
      )
      expect(calls.getIssue).toBe(1)
      expect(calls.readSpecs).toHaveLength(0)
      expect(calls.push).toHaveLength(0)
      expect(calls.editLabels).toHaveLength(0)
    })

    test("ラベルに実装中があるときは readSpecs 以降を呼ばない", async () => {
      const { deps, calls } = makeRequestDeps({
        issue: issue({ number: ISSUE, labels: [LABEL_IN_PROGRESS] }),
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "実装のラベルが付いています",
      )
      expect(calls.readSpecs).toHaveLength(0)
      expect(calls.push).toHaveLength(0)
      expect(calls.editLabels).toHaveLength(0)
    })

    test("ラベルに実装依頼があるときは readSpecs 以降を呼ばない", async () => {
      const { deps, calls } = makeRequestDeps({
        issue: issue({ number: ISSUE, labels: [LABEL_REQUEST] }),
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "実装のラベルが付いています",
      )
      expect(calls.readSpecs).toHaveLength(0)
      expect(calls.push).toHaveLength(0)
      expect(calls.editLabels).toHaveLength(0)
    })

    test("quick 対象 だけでは拒否しない", async () => {
      const { deps, calls } = makeRequestDeps({
        issue: issue({ number: ISSUE, labels: ["quick 対象"] }),
      })
      await requestImplementation(deps, ISSUE)
      expect(calls.readSpecs).toEqual([ISSUE])
      expect(calls.push).toEqual([{ remote: "origin", branch: BRANCH }])
      expect(calls.editLabels).toEqual([
        { number: ISSUE, change: { add: [LABEL_REQUEST] } },
      ])
    })

    test("要件 missing は設計を見ず push と editLabels を呼ばない", async () => {
      const { deps, calls } = makeRequestDeps({
        requirements: { exists: false, markdown: "" },
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "要件がありません",
      )
      expect(calls.push).toHaveLength(0)
      expect(calls.editLabels).toHaveLength(0)
    })

    test("要件 invalid は push と editLabels を呼ばない", async () => {
      const { deps, calls } = makeRequestDeps({
        requirements: { exists: true, markdown: "# 1 x" },
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "要件の見出しが不正です",
      )
      expect(calls.push).toHaveLength(0)
      expect(calls.editLabels).toHaveLength(0)
    })

    test("設計 missing は push と editLabels を呼ばない", async () => {
      const { deps, calls } = makeRequestDeps({
        design: { exists: false, markdown: "" },
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "設計がありません",
      )
      expect(calls.push).toHaveLength(0)
      expect(calls.editLabels).toHaveLength(0)
    })

    test("設計 invalid は push と editLabels を呼ばない", async () => {
      const { deps, calls } = makeRequestDeps({
        design: { exists: true, markdown: "# 1 x" },
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "設計の見出しが不正です",
      )
      expect(calls.push).toHaveLength(0)
      expect(calls.editLabels).toHaveLength(0)
    })

    test("remoteName が拒否したとき push と editLabels を呼ばない", async () => {
      const { deps, calls } = makeRequestDeps({
        remote: new Error("リモートを特定できません"),
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "リモートを特定できません",
      )
      expect(calls.push).toHaveLength(0)
      expect(calls.editLabels).toHaveLength(0)
    })

    test("push が拒否したとき editLabels を呼ばない", async () => {
      const { deps, calls } = makeRequestDeps({
        push: new Error("push failed"),
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow("push failed")
      expect(calls.push).toHaveLength(1)
      expect(calls.editLabels).toHaveLength(0)
    })

    test("成功時は push と editLabels の引数", async () => {
      const { deps, calls } = makeRequestDeps({})
      await requestImplementation(deps, ISSUE)
      expect(calls.push).toEqual([{ remote: "origin", branch: BRANCH }])
      expect(calls.editLabels).toEqual([
        { number: ISSUE, change: { add: [LABEL_REQUEST] } },
      ])
      expect(calls.editLabels[0]?.change.remove).toBeUndefined()
    })

    test("editLabels が拒否しても push は一回", async () => {
      const { deps, calls } = makeRequestDeps({
        editLabels: new Error("label err"),
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow("label err")
      expect(calls.push).toHaveLength(1)
    })
  })

  describe("cli request", () => {
    test("引数が無いときと二つのときは使い方の十一行", async () => {
      for (const args of [["request"], ["request", "94", "95"]] as const) {
        const proc = Bun.spawn([bunExe, cliPath, ...args], {
          cwd: root,
          stdout: "pipe",
          stderr: "pipe",
        })
        expect(await proc.exited).toBe(1)
        expect(await new Response(proc.stderr).text()).toBe(usageText)
      }
    })

    test("引数 foo は番号が不正ですのみ", async () => {
      const proc = Bun.spawn([bunExe, cliPath, "request", "foo"], {
        cwd: root,
        stdout: "pipe",
        stderr: "pipe",
      })
      expect(await proc.exited).toBe(1)
      expect(await new Response(proc.stderr).text()).toBe("番号が不正です\n")
    })
  })

  test("ドキュメントとスキル、runner、printUsage", async () => {
    const policy = await readFile(path.join(root, "docs/policy.md"), "utf8")
    expect(policy).toContain(
      "サブコマンドは `install`、`run`、`labels`、`candidates`、`show`、`branch`、`confirm`、`close`、`reflect`、`validate`、`complete`、`restore`、`review-next`、`request`",
    )

    const agents = await readFile(path.join(root, "AGENTS.md"), "utf8")
    expect(agents).toContain("bun src/cli.ts request <番号>")

    const readme = await readFile(path.join(root, "README.md"), "utf8")
    expect(readme).toContain("bun src/cli.ts request <番号>")
    expect(readme).toContain(
      "| `request` | 作業ブランチを push し、成功したあと課題に「実装依頼」を付ける |",
    )
    expect(readme).toContain(
      "人は Project A で、`bun src/cli.ts request <番号>` で作業ブランチを push してから「実装依頼」を付ける。",
    )
    expect(readme).toContain("| 実装依頼 | 人 |")

    const skill = await readFile(path.join(root, "skills/sdd-cur/SKILL.md"), "utf8")
    expect(skill).not.toContain("bun src/cli.ts request")

    const runnerSource = await readFile(path.join(root, "src/runner.ts"), "utf8")
    expect(runnerSource).not.toContain("requestImplementation")

    const cliSource = await readFile(cliPath, "utf8")
    expect(cliSource).not.toContain("sdd-cur request")
    const printUsageBlock = cliSource.slice(
      cliSource.indexOf("export function printUsage"),
      cliSource.indexOf("function wantsHelp"),
    )
    expect(printUsageBlock).not.toContain("request")
    expect(printUsageBlock).not.toContain("restore")
  })
})
