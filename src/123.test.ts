import { describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { readFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { specDiff } from "./conventions.ts"
import type { GitRunner } from "./git.ts"

const root = path.join(import.meta.dir, "..")
const cliPath = path.join(import.meta.dir, "cli.ts")
const conventionsPath = path.join(import.meta.dir, "conventions.ts")
const bunExe = process.execPath

const baselineSpec = `# spec

## REQ-1
基準の本文です。
## REQ-2
消える本文です。
`

const exampleDelta = `## 正本への差分

### 変更 spec REQ-1

変えた本文です。

### 削除 spec REQ-2

消える本文です。

### 追加 spec REQ-3

足す本文です。
`

const exampleDesign = `# 123 題

${exampleDelta}
`

type RecordedGitCall = { args: string[]; cwd: string }

function exampleGitRunner(
  onCall: (call: RecordedGitCall) => {
    stdout: string
    stderr: string
    exitCode: number
  },
): GitRunner {
  return {
    run: async (args, options) => {
      return onCall({ args, cwd: options.cwd })
    },
  }
}

async function withTemp(
  fn: (temp: string) => Promise<void>,
): Promise<void> {
  const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-123-"))
  try {
    await fn(temp)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

async function runCli(
  cwd: string,
  argv: string[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([bunExe, cliPath, "spec-diff", ...argv], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, PATH: path.dirname(bunExe) },
  })
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  return { exitCode: await proc.exited, stdout, stderr }
}

describe("123 spec-diff", () => {
  test("[1] switch に spec-diff があり task-done の次である", () => {
    const cli = readFileSync(cliPath, "utf8")
    const tasksIdx = cli.indexOf('case "tasks":')
    const taskDoneIdx = cli.indexOf('case "task-done":')
    const specDiffIdx = cli.indexOf('case "spec-diff":')
    const defaultIdx = cli.indexOf("default:")
    expect(specDiffIdx).toBeGreaterThan(-1)
    expect(tasksIdx).toBeGreaterThan(-1)
    expect(taskDoneIdx).toBeGreaterThan(tasksIdx)
    expect(specDiffIdx).toBeGreaterThan(taskDoneIdx)
    expect(specDiffIdx).toBeLessThan(defaultIdx)
    const cmdStart = cli.indexOf("async function cmdSpecDiff")
    const cmdEnd = cli.indexOf("function wantsHelp", cmdStart)
    expect(cmdStart).toBeGreaterThan(-1)
    expect(cmdEnd).toBeGreaterThan(cmdStart)
    const cmdBlock = cli.slice(cmdStart, cmdEnd)
    expect(cmdBlock).toContain("defaultGitRunner")
    expect(cmdBlock).toContain("specDiff")
    expect(cmdBlock).not.toContain("getDefaultBranch")
    expect(cmdBlock).not.toContain("defaultGhRunner")
  })

  test("[2] 使い方に spec-diff が task-done の次にある", async () => {
    await withTemp(async (temp) => {
      const { stderr } = await runCli(temp, [])
      const taskLine = "sdd-cur tasks <番号>"
      const taskDoneLine = "sdd-cur task-done <番号> <作業番号>"
      const specLine = "sdd-cur spec-diff <番号>"
      const lines = stderr.split("\n")
      const taskIdx = lines.indexOf(taskLine)
      const taskDoneIdx = lines.indexOf(taskDoneLine)
      const specIdx = lines.indexOf(specLine)
      expect(taskIdx).toBeGreaterThan(-1)
      expect(taskDoneIdx).toBe(taskIdx + 1)
      expect(specIdx).toBe(taskDoneIdx + 1)
    })
  })

  test("[3][4] 引数と --help", async () => {
    await withTemp(async (temp) => {
      const usageProc = Bun.spawn([bunExe, cliPath], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: path.dirname(bunExe) },
      })
      const expectedUsage = await new Response(usageProc.stderr).text()
      expect(await usageProc.exited).toBe(1)
      for (const args of [[], ["1", "2"]]) {
        const { exitCode, stdout, stderr } = await runCli(temp, args)
        expect(exitCode).toBe(1)
        expect(stdout).toBe("")
        expect(stderr).toBe(expectedUsage)
      }
      for (const flag of ["--help", "-h"]) {
        const proc = Bun.spawn([bunExe, cliPath, "spec-diff", flag], {
          cwd: temp,
          stdout: "pipe",
          stderr: "pipe",
          env: { ...process.env, PATH: path.dirname(bunExe) },
        })
        const [stdout, stderr] = await Promise.all([
          new Response(proc.stdout).text(),
          new Response(proc.stderr).text(),
        ])
        expect(await proc.exited).toBe(0)
        expect(stdout).toBe("")
        expect(stderr.length).toBeGreaterThan(0)
      }
    })
  })

  test("[5] 課題番号が不正", async () => {
    await withTemp(async (temp) => {
      for (const arg of ["foo", "0", "01"]) {
        const { exitCode, stdout, stderr } = await runCli(temp, [arg])
        expect(exitCode).toBe(1)
        expect(stderr.trim()).toBe("番号が不正です")
        expect(stdout).toBe("")
      }
    })
  })

  test("[6][7][11] 例の節で一致", async () => {
    await withTemp(async (temp) => {
      const designPath = path.join(temp, "docs/issues/123/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, exampleDesign)
      const canonicalDir = path.join(temp, "docs/canonical")
      await mkdir(canonicalDir, { recursive: true })
      await writeFile(
        path.join(canonicalDir, "spec.md"),
        `# spec

## REQ-3
足す本文です。
## REQ-1
変えた本文です。
`,
      )
      const calls: RecordedGitCall[] = []
      const git = exampleGitRunner((call) => {
        calls.push(call)
        const { args } = call
        if (args[0] === "remote") {
          return { stdout: "origin\n", stderr: "", exitCode: 0 }
        }
        if (args[0] === "symbolic-ref") {
          return {
            stdout: "refs/remotes/origin/main\n",
            stderr: "",
            exitCode: 0,
          }
        }
        if (args[0] === "ls-tree") {
          return {
            stdout: "docs/canonical/spec.md\n",
            stderr: "",
            exitCode: 0,
          }
        }
        if (args[0] === "show") {
          return { stdout: baselineSpec, stderr: "", exitCode: 0 }
        }
        return { stdout: "", stderr: "", exitCode: 1 }
      })
      const lines = await specDiff({ cwd: temp, issueNumber: 123, git })
      expect(lines).toEqual([])
      expect(calls.map((c) => c.args)).toEqual([
        ["remote"],
        ["symbolic-ref", "refs/remotes/origin/HEAD"],
        ["ls-tree", "--name-only", "refs/remotes/origin/main", "docs/canonical"],
        ["show", "refs/remotes/origin/main:docs/canonical/spec.md"],
      ])
      for (const call of calls) {
        expect(call.cwd).toBe(temp)
      }
    })
  })

  test("[8][9][10] 不一致の行", async () => {
    await withTemp(async (temp) => {
      const designPath = path.join(temp, "docs/issues/123/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, exampleDesign)
      const canonicalDir = path.join(temp, "docs/canonical")
      await mkdir(canonicalDir, { recursive: true })
      await writeFile(path.join(canonicalDir, "spec.md"), baselineSpec)
      await writeFile(
        path.join(canonicalDir, "docs.md"),
        `# docs

## REQ-9
余です。
`,
      )
      const git = exampleGitRunner((call) => {
        const { args } = call
        if (args[0] === "remote") {
          return { stdout: "origin\n", stderr: "", exitCode: 0 }
        }
        if (args[0] === "symbolic-ref") {
          return {
            stdout: "refs/remotes/origin/main\n",
            stderr: "",
            exitCode: 0,
          }
        }
        if (args[0] === "ls-tree") {
          return {
            stdout: "docs/canonical/spec.md\n",
            stderr: "",
            exitCode: 0,
          }
        }
        if (args[0] === "show") {
          return { stdout: baselineSpec, stderr: "", exitCode: 0 }
        }
        return { stdout: "", stderr: "", exitCode: 1 }
      })
      const lines = await specDiff({ cwd: temp, issueNumber: 123, git })
      const expected = [
        "正本が一致しません: spec REQ-1 本文が違います",
        "正本が一致しません: spec REQ-2 作業ツリーにだけあります",
        "正本が一致しません: spec REQ-3 作業ツリーにありません",
        "正本が一致しません: docs REQ-9 作業ツリーにだけあります",
      ]
      expect(lines.sort()).toEqual(expected.sort())
    })
  })

  test("[12] 設計が無い・項目無し", async () => {
    await withTemp(async (temp) => {
      const canonicalDir = path.join(temp, "docs/canonical")
      await mkdir(canonicalDir, { recursive: true })
      await writeFile(path.join(canonicalDir, "spec.md"), baselineSpec)
      const git = exampleGitRunner((call) => {
        const { args } = call
        if (args[0] === "remote") {
          return { stdout: "origin\n", stderr: "", exitCode: 0 }
        }
        if (args[0] === "symbolic-ref") {
          return {
            stdout: "refs/remotes/origin/main\n",
            stderr: "",
            exitCode: 0,
          }
        }
        if (args[0] === "ls-tree") {
          return {
            stdout: "docs/canonical/spec.md\n",
            stderr: "",
            exitCode: 0,
          }
        }
        if (args[0] === "show") {
          return { stdout: baselineSpec, stderr: "", exitCode: 0 }
        }
        return { stdout: "", stderr: "", exitCode: 1 }
      })
      const noDesign = await specDiff({ cwd: temp, issueNumber: 123, git })
      expect(noDesign).toEqual([])

      const designPath = path.join(temp, "docs/issues/123/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, "# 7 題\n")
      const noItems = await specDiff({ cwd: temp, issueNumber: 123, git })
      expect(noItems).toEqual([])
    })
  })

  test("[13] 設計がディレクトリ", async () => {
    await withTemp(async (temp) => {
      const designPath = path.join(temp, "docs/issues/123/design.md")
      await mkdir(designPath, { recursive: true })
      const calls: RecordedGitCall[] = []
      const git = exampleGitRunner((call) => {
        calls.push(call)
        return { stdout: "", stderr: "", exitCode: 0 }
      })
      const { exitCode, stdout, stderr } = await runCli(temp, ["123"])
      expect(exitCode).toBe(1)
      expect(stderr.trim()).toBe("仕様を読めません")
      expect(stdout).toBe("")
      expect(calls).toEqual([])
    })
  })

  test("[14] 先頭末尾の空行", async () => {
    await withTemp(async (temp) => {
      const designPath = path.join(temp, "docs/issues/123/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(
        designPath,
        `# 123

## 正本への差分

### 変更 spec REQ-1


変えた本文です。

`,
      )
      const canonicalDir = path.join(temp, "docs/canonical")
      await mkdir(canonicalDir, { recursive: true })
      await writeFile(
        path.join(canonicalDir, "spec.md"),
        `# spec

## REQ-1
変えた本文です。
`,
      )
      const git = exampleGitRunner((call) => {
        const { args } = call
        if (args[0] === "remote") {
          return { stdout: "origin\n", stderr: "", exitCode: 0 }
        }
        if (args[0] === "symbolic-ref") {
          return {
            stdout: "refs/remotes/origin/main\n",
            stderr: "",
            exitCode: 0,
          }
        }
        if (args[0] === "ls-tree") {
          return {
            stdout: "docs/canonical/spec.md\n",
            stderr: "",
            exitCode: 0,
          }
        }
        if (args[0] === "show") {
          return {
            stdout: `# spec

## REQ-1
基準です。
`,
            stderr: "",
            exitCode: 0,
          }
        }
        return { stdout: "", stderr: "", exitCode: 1 }
      })
      expect(await specDiff({ cwd: temp, issueNumber: 123, git })).toEqual([])
    })
  })

  test("[15] show の終了コードが 0 でない", async () => {
    await withTemp(async (temp) => {
      const designPath = path.join(temp, "docs/issues/123/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, exampleDesign)
      const canonicalDir = path.join(temp, "docs/canonical")
      await mkdir(canonicalDir, { recursive: true })
      await writeFile(
        path.join(canonicalDir, "spec.md"),
        `# spec

## REQ-1
変えた本文です。
`,
      )
      const git = exampleGitRunner((call) => {
        const { args } = call
        if (args[0] === "remote") {
          return { stdout: "origin\n", stderr: "", exitCode: 0 }
        }
        if (args[0] === "symbolic-ref") {
          return {
            stdout: "refs/remotes/origin/main\n",
            stderr: "",
            exitCode: 0,
          }
        }
        if (args[0] === "ls-tree") {
          return {
            stdout: "docs/canonical/spec.md\n",
            stderr: "",
            exitCode: 0,
          }
        }
        if (args[0] === "show") {
          return { stdout: "", stderr: "missing", exitCode: 1 }
        }
        return { stdout: "", stderr: "", exitCode: 1 }
      })
      const lines = await specDiff({ cwd: temp, issueNumber: 123, git })
      expect(lines).toEqual([
        "正本が一致しません: spec REQ-3 作業ツリーにありません",
      ])
    })
  })

  test("[16] remote 失敗", async () => {
    await withTemp(async (temp) => {
      const designPath = path.join(temp, "docs/issues/123/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, exampleDesign)
      const git = exampleGitRunner(() => ({
        stdout: "",
        stderr: "",
        exitCode: 1,
      }))
      await expect(
        specDiff({ cwd: temp, issueNumber: 123, git }),
      ).rejects.toThrow("git を実行できません")
    })
  })

  test("[17] specDiff に getDefaultBranch が無い", () => {
    const text = readFileSync(conventionsPath, "utf8")
    expect(text).toContain("export async function specDiff")
    expect(text).not.toContain("getDefaultBranch")
    expect(text).not.toContain("defaultGhRunner")
  })

  test("[19] policy と AGENTS", async () => {
    const policy = await readFile(path.join(root, "docs/policy.md"), "utf8")
    const agents = await readFile(path.join(root, "AGENTS.md"), "utf8")
    expect(policy).toContain("`spec-diff`")
    const agentsFence = agents
      .split("## コマンド")[1]
      .split("```")[1]
    const agentsLines = agentsFence.split("\n")
    const tasksIdx = agentsLines.findIndex(
      (line) => line === "bun src/cli.ts tasks <番号>",
    )
    const taskDoneIdx = agentsLines.findIndex(
      (line) => line === "bun src/cli.ts task-done <番号> <作業番号>",
    )
    const specIdx = agentsLines.findIndex(
      (line) => line === "bun src/cli.ts spec-diff <番号>",
    )
    const specApplyIdx = agentsLines.findIndex(
      (line) => line === "bun src/cli.ts spec-apply <番号>",
    )
    const testIdx = agentsLines.findIndex((line) => line === "bun test")
    expect(tasksIdx).toBeGreaterThan(-1)
    expect(taskDoneIdx).toBe(tasksIdx + 1)
    expect(specIdx).toBe(taskDoneIdx + 1)
    expect(specApplyIdx).toBe(specIdx + 1)
    expect(testIdx).toBe(specApplyIdx + 1)
  })

  test("[21][22] 実装スキル", async () => {
    const skill = await readFile(
      path.join(root, "skills/sdd-cur-implement/SKILL.md"),
      "utf8",
    )
    expect(skill).toContain("sdd-cur spec-diff <番号>")
    expect(skill).toContain("「テスト」節が無いときも、実行すべき記述が無いときも、実行する。")
    expect(skill).toContain(
      "失敗の扱いは、設計の「テスト」節の実行と同じである。",
    )
    expect(skill).toContain("終了コードが 0 以外でも、親はレビュー役を起動する。")
  })

  test("[23][24] 実装レビュー役", async () => {
    const reviewer = await readFile(
      path.join(root, "agents/sdd-cur-implement-reviewer.md"),
      "utf8",
    )
    expect(reviewer).toContain("`spec-diff` を自分で実行しない。")
    expect(reviewer).toContain(
      "`spec-diff` の終了コードが 0 以外であることは、渡された終了コードが 0 以外であることの指摘である。",
    )
    expect(reviewer).toContain("docs/canonical/<領域>.md")
    expect(reviewer).toContain("この段落は残す。")
    expect(reviewer).not.toMatch(/docs\/spec\/<領域>/)
  })
})
