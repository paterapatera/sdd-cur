import { describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { readModelFromAgentFile, subagentFileNames } from "./install.ts"

const repoRoot = path.join(import.meta.dir, "..")
const cliPath = path.join(import.meta.dir, "cli.ts")
const bunExe = process.execPath
const designPath = path.join(repoRoot, "docs/issues/161/design.md")
const canonicalInstallPath = path.join(repoRoot, "docs/canonical/install.md")

function reqBodyFromDesign(design: string, id: string): string {
  const marker = `### 追加 install ${id}`
  const start = design.indexOf(marker)
  expect(start).toBeGreaterThanOrEqual(0)
  const afterHeading = design.slice(start + marker.length)
  const lines = afterHeading.split("\n")
  const bodyLines: string[] = []
  let i = 0
  while (i < lines.length && lines[i].trim() === "") {
    i++
  }
  while (i < lines.length) {
    if (lines[i].startsWith("### ")) {
      break
    }
    bodyLines.push(lines[i])
    i++
  }
  return bodyLines.join("\n").trim()
}

function reqBodyInCanonical(canonical: string, id: string): string {
  const heading = `## ${id}`
  const start = canonical.indexOf(heading)
  expect(start).toBeGreaterThanOrEqual(0)
  const after = canonical.slice(start + heading.length)
  const next = after.search(/\n## REQ-/)
  const block = next === -1 ? after : after.slice(0, next)
  return block
    .split("\n")
    .slice(1)
    .join("\n")
    .trim()
}

async function runInstall(
  args: string[],
  options?: { cwd?: string; env?: Record<string, string> },
): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([bunExe, cliPath, "install", ...args], {
    cwd: options?.cwd ?? repoRoot,
    stdout: "pipe",
    stderr: "pipe",
    env: options?.env ?? process.env,
  })
  const code = await proc.exited
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  return { code, stdout, stderr }
}

describe("課題 161 installAll と cmdInstall", () => {
  test("プロジェクトルートで成功し標準出力の行順", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-161-install-"))
    try {
      const { code, stdout, stderr } = await runInstall([temp])
      expect(code).toBe(0)
      expect(stderr).toBe("")
      const lines = stdout.trimEnd().split("\n")
      const skillsDest = path.resolve(path.join(temp, ".cursor", "skills"))
      expect(lines[0]).toBe(skillsDest)
      let offset = 1
      const modelLines = lines.slice(offset)
      expect(modelLines.length).toBeGreaterThanOrEqual(11)
      const tail = modelLines.slice(-11)
      for (let i = 0; i < subagentFileNames.length; i++) {
        const name = subagentFileNames[i]
        const base = name.slice(0, -".md".length)
        const agentContent = await readFile(path.join(repoRoot, "agents", name), "utf8")
        const model = readModelFromAgentFile(agentContent)
        expect(tail[i]).toBe(`${base} ${model}`)
      }
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("存在しないパスとファイルは失敗しモデル行を出さない", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-161-bad-"))
    try {
      const missing = path.join(temp, "missing")
      const r1 = await runInstall([missing])
      expect(r1.code).toBe(1)
      expect(r1.stdout).toBe("")
      expect(r1.stderr.trim()).toBe(`ディレクトリが存在しません: ${missing}`)

      const file = path.join(temp, "file.txt")
      await writeFile(file, "x")
      const r2 = await runInstall([file])
      expect(r2.code).toBe(1)
      expect(r2.stdout).toBe("")
      expect(r2.stderr.trim()).toBe(`ディレクトリではありません: ${file}`)
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("モデル指定不正はコピーせず既存宛先を変えない", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-161-nocopy-"))
    try {
      const agentsDest = path.join(temp, ".cursor", "agents")
      await mkdir(agentsDest, { recursive: true })
      await writeFile(path.join(agentsDest, "keep.md"), "keep")

      const r = await runInstall([temp, "--high-model"])
      expect(r.code).toBe(1)
      expect(r.stdout).toBe("")
      expect(r.stderr.trim()).toBe("モデルの指定が不正です: --high-model")

      const keep = await readFile(path.join(agentsDest, "keep.md"), "utf8")
      expect(keep).toBe("keep")
      await expect(stat(path.join(temp, ".cursor", "skills"))).rejects.toThrow()
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("ルートとフラグの順序入れ替えで反映", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-161-flags-"))
    try {
      const args = [
        "--high-model",
        "high-x",
        temp,
        "--medium-model",
        "med-x",
        "--low-model",
        "low-x",
      ]
      const { code, stdout } = await runInstall(args)
      expect(code).toBe(0)
      const agentsDest = path.join(temp, ".cursor", "agents")
      const highNames = [
        "sdd-cur-req-author.md",
        "sdd-cur-design-author.md",
        "sdd-cur-req-reviewer-high.md",
      ]
      for (const name of highNames) {
        const c = await readFile(path.join(agentsDest, name), "utf8")
        expect(readModelFromAgentFile(c)).toBe("high-x")
      }
      const lines = stdout.trimEnd().split("\n")
      const tail = lines.slice(-11)
      expect(tail.some((l) => l.startsWith("sdd-cur-req-author high-x"))).toBe(true)
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})

describe("課題 161 README と使い方", () => {
  test("README の install 説明に三種類のモデル指定", async () => {
    const readme = await readFile(path.join(repoRoot, "README.md"), "utf8")
    expect(readme).toContain("--high-model")
    expect(readme).toContain("--medium-model")
    expect(readme).toContain("--low-model")
    expect(readme).toContain("sdd-cur-req-author")
    expect(readme).toContain("sdd-cur-explore")
  })
})

describe("課題 161 正本", () => {
  test("REQ-923 が設計の正本への差分と一文字も違わない", async () => {
    const design = await readFile(designPath, "utf8")
    const canonical = await readFile(canonicalInstallPath, "utf8")
    const expected = reqBodyFromDesign(design, "REQ-923")
    const actual = reqBodyInCanonical(canonical, "REQ-923")
    expect(actual).toBe(expected)
  })
})
