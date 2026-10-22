import { afterEach, describe, expect, test } from "bun:test"
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises"
import { readFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { initProject, parseInitArgs, policyTemplate } from "./init.ts"

const repoRoot = path.join(import.meta.dir, "..")
const cliPath = path.join(import.meta.dir, "cli.ts")
const bunExe = process.execPath
const isolatedPath = path.dirname(bunExe)

const policyStartupLines = [
  "1. `docs/policy.md` が無いときは、止まって、`sdd-cur init` を案内する。",
  "`docs/policy.md` があるときは、起動時に `docs/policy.md` を読む。",
] as const

const fiveAgents = [
  "sdd-cur-req-author.md",
  "sdd-cur-design-author.md",
  "sdd-cur-req-reviewer.md",
  "sdd-cur-req-reviewer-high.md",
  "sdd-cur-design-reviewer.md",
] as const

async function runCli(
  args: string[],
  options: { cwd?: string; env?: Record<string, string | undefined> } = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([bunExe, cliPath, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: options.cwd,
    env: { ...process.env, PATH: isolatedPath, ...options.env },
  })
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  const code = await proc.exited
  return { code, stdout, stderr }
}

function repoPolicyNonHeadingLines(): string[] {
  const policy = readFileSync(path.join(repoRoot, "docs/policy.md"), "utf8")
  return policy
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#") && !l.startsWith("|"))
}

describe("118 init", () => {
  let tempRoot = ""

  afterEach(async () => {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true })
      tempRoot = ""
    }
  })

  test("initProject を export し cli が parseInitArgs と initProject を使う", async () => {
    const cliText = await readFile(cliPath, "utf8")
    expect(cliText).toContain('case "init":')
    expect(cliText).toContain("parseInitArgs")
    expect(cliText).toContain("initProject")
    expect(cliText).toContain("assertDirectoryExists")
    expect(typeof initProject).toBe("function")
    expect(typeof parseInitArgs).toBe("function")
  })

  test("printUsage と --help に init 行", async () => {
    const help = await runCli(["--help"])
    expect(help.code).toBe(0)
    const helpLines = help.stderr.split("\n")
    const idx = helpLines.indexOf("sdd-cur install [project-root]")
    expect(helpLines[idx + 1]).toBe("sdd-cur init [project-root]")
  })

  test("空の一時ディレクトリで init がひな形と README を作る", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-118-init-"))
    const { code, stdout, stderr } = await runCli(["init", tempRoot])
    expect(code).toBe(0)
    expect(stderr).toBe("")
    expect(stdout).toBe(
      "docs/policy.md\ndocs/canonical/README.md\ndocs/issues/README.md\n",
    )
    const policy = await readFile(path.join(tempRoot, "docs/policy.md"), "utf8")
    expect(policy).toBe(policyTemplate)
    const headings = policy
      .split("\n")
      .filter((l) => l.startsWith("## "))
    expect(headings).toEqual([
      "## 誰のための道具か",
      "## 技術の前提",
      "## 構成",
      "## 破ってはいけない原則",
    ])
    const bodyLines = policy
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "" && !l.startsWith("#"))
    for (const line of bodyLines) {
      expect(repoPolicyNonHeadingLines()).not.toContain(line)
    }
    expect(await readFile(path.join(tempRoot, "docs/canonical/README.md"), "utf8")).toBe(
      "仕様の正本を置く。\n",
    )
    expect(await readFile(path.join(tempRoot, "docs/issues/README.md"), "utf8")).toBe(
      "課題ごとの要件と設計を置く。\n",
    )
    await expect(access(path.join(tempRoot, "AGENTS.md"))).rejects.toThrow()
    await expect(access(path.join(tempRoot, "docs/conventions.md"))).rejects.toThrow()
  })

  test("既存 docs/policy.md は上書きしない", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-118-policy-"))
    const custom = "custom policy content\n"
    await mkdir(path.join(tempRoot, "docs"), { recursive: true })
    await writeFile(path.join(tempRoot, "docs/policy.md"), custom)
    const { code, stdout } = await runCli(["init", tempRoot])
    expect(code).toBe(0)
    expect(stdout).toBe(
      "docs/canonical/README.md\ndocs/issues/README.md\n",
    )
    expect(await readFile(path.join(tempRoot, "docs/policy.md"), "utf8")).toBe(custom)
  })

  test("三つともあるときは標準出力は空", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-118-all-"))
    await mkdir(path.join(tempRoot, "docs/canonical"), { recursive: true })
    await mkdir(path.join(tempRoot, "docs/issues"), { recursive: true })
    await writeFile(path.join(tempRoot, "docs/policy.md"), "x\n")
    await writeFile(path.join(tempRoot, "docs/canonical/README.md"), "a\n")
    await writeFile(path.join(tempRoot, "docs/issues/README.md"), "b\n")
    const { code, stdout, stderr } = await runCli(["init", tempRoot])
    expect(code).toBe(0)
    expect(stdout).toBe("")
    expect(stderr).toBe("")
  })

  test("PATH に gh が無くても init は成功する", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-118-nogh-"))
    const initSrc = await readFile(path.join(import.meta.dir, "init.ts"), "utf8")
    expect(initSrc).not.toContain("ensureWorkflowLabels")
    expect(initSrc).not.toContain("createGitHub")
    const { code } = await runCli(["init", tempRoot], { env: { PATH: isolatedPath } })
    expect(code).toBe(0)
  })

  test("init 分岐は labels を呼ばない", async () => {
    const cliText = await readFile(cliPath, "utf8")
    const initBlock = cliText.slice(
      cliText.indexOf("async function cmdInit"),
      cliText.indexOf("async function cmdRun"),
    )
    expect(initBlock).not.toContain("cmdLabels")
    expect(initBlock).not.toContain("ensureWorkflowLabels")
  })

  test("install は docs/policy.md を作らない", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-118-install-"))
    const home = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-118-home-"))
    const { code } = await runCli(["install", tempRoot], {
      env: { HOME: home, USERPROFILE: home },
    })
    expect(code).toBe(0)
    await expect(access(path.join(tempRoot, "docs/policy.md"))).rejects.toThrow()
    await rm(home, { recursive: true, force: true })
  })

  test("五つのサブエージェントの起動時", async () => {
    for (const name of fiveAgents) {
      const text = await readFile(path.join(repoRoot, "agents", name), "utf8")
      const section = text.slice(text.indexOf("## 起動時"))
      for (const line of policyStartupLines) {
        expect(section).toContain(line)
      }
    }
  })

  test("レビュー役の原則と食い違う記述の行", async () => {
    const req = await readFile(
      path.join(repoRoot, "agents/sdd-cur-req-reviewer.md"),
      "utf8",
    )
    const reqHigh = await readFile(
      path.join(repoRoot, "agents/sdd-cur-req-reviewer-high.md"),
      "utf8",
    )
    const design = await readFile(
      path.join(repoRoot, "agents/sdd-cur-design-reviewer.md"),
      "utf8",
    )
    expect(req).toContain(
      "- レビューしている要求のうち、`docs/policy.md` の「破ってはいけない原則」と食い違う記述。",
    )
    expect(reqHigh).toContain(
      "- レビューしている要求のうち、`docs/policy.md` の「破ってはいけない原則」と食い違う記述。",
    )
    expect(design).toContain(
      "- レビューしている設計のうち、`docs/policy.md` の「破ってはいけない原則」と食い違う記述。",
    )
  })

  test("README の導入の順と開発中の起動に init が無い", async () => {
    const readme = await readFile(path.join(repoRoot, "README.md"), "utf8")
    expect(readme).toContain("導入の順は `install`、`init`、`labels` である。")
    const devStart = readme.indexOf("## 開発中の起動")
    const nextH2 = readme.indexOf("\n## ", devStart + 1)
    const section = readme.slice(devStart, nextH2)
    expect(section).not.toMatch(/\binit\b/)
  })

  test("skills/sdd-cur/conventions.md の題", async () => {
    const text = await readFile(
      path.join(repoRoot, "skills/sdd-cur/conventions.md"),
      "utf8",
    )
    expect(text.trimStart().startsWith("# 約束")).toBe(true)
  })

  test("引数を省いた init は cwd をルートにする", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-118-cwd-"))
    const { code, stdout } = await runCli(["init"], { cwd: tempRoot })
    expect(code).toBe(0)
    expect(stdout).toContain("docs/policy.md\n")
    expect((await stat(path.join(tempRoot, "docs/policy.md"))).isFile()).toBe(true)
  })

  test("引数二つと空文字は失敗", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-118-args-"))
    for (const args of [["init", "a", "b"], ["init", ""]]) {
      const { code, stdout, stderr } = await runCli(args, { cwd: tempRoot })
      expect(code).toBe(1)
      expect(stdout).toBe("")
      expect(stderr.split("\n")[0]).toBe(
        "init の引数はプロジェクトのルートを一つまでです",
      )
      expect(stderr).toContain("sdd-cur install [project-root]")
    }
  })

  test("存在しないパスとファイルパス", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-118-badroot-"))
    const missing = path.join(tempRoot, "no-such-dir")
    const { code: c1, stdout: o1, stderr: e1 } = await runCli(["init", missing])
    expect(c1).toBe(1)
    expect(o1).toBe("")
    expect(e1.trim()).toBe(`ディレクトリが存在しません: ${missing}`)
    expect(e1).not.toContain("sdd-cur install")

    const filePath = path.join(tempRoot, "file.txt")
    await writeFile(filePath, "x")
    const { code: c2, stdout: o2, stderr: e2 } = await runCli(["init", filePath])
    expect(c2).toBe(1)
    expect(o2).toBe("")
    expect(e2.trim()).toBe(`ディレクトリではありません: ${filePath}`)
    expect(await readFile(filePath, "utf8")).toBe("x")
  })

  test("docs/canonical が通常ファイルのとき書き込み失敗", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-118-canfile-"))
    await mkdir(path.join(tempRoot, "docs"), { recursive: true })
    await writeFile(path.join(tempRoot, "docs/canonical"), "blocker\n")
    const { code, stdout, stderr } = await runCli(["init", tempRoot])
    expect(code).toBe(1)
    expect(stdout).toBe("")
    expect(stderr.trim().length).toBeGreaterThan(0)
    expect(stderr).not.toContain("sdd-cur install")
    expect((await stat(path.join(tempRoot, "docs/policy.md"))).isFile()).toBe(true)
    const info = await stat(path.join(tempRoot, "docs/canonical"))
    expect(info.isFile()).toBe(true)
  })

  test("docs/policy.md がディレクトリのとき飛ばす", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-118-poldir-"))
    const inner = path.join(tempRoot, "docs/policy.md", "inner.txt")
    await mkdir(path.dirname(inner), { recursive: true })
    await writeFile(inner, "keep\n")
    const { code, stdout, stderr } = await runCli(["init", tempRoot])
    expect(code).toBe(0)
    expect(stderr).toBe("")
    expect(stdout).toBe(
      "docs/canonical/README.md\ndocs/issues/README.md\n",
    )
    expect(await readFile(inner, "utf8")).toBe("keep\n")
    const info = await stat(path.join(tempRoot, "docs/policy.md"))
    expect(info.isDirectory()).toBe(true)
  })
})
