import { describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { readFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { checkSpec } from "./spec.ts"

const root = path.join(import.meta.dir, "..")
const cliPath = path.join(root, "src/cli.ts")
const bunExe = process.execPath

async function runSpecCheck(
  cwd: string,
  args: string[] = [],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([bunExe, cliPath, "spec-check", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  })
  const exitCode = await proc.exited
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  return { exitCode, stdout, stderr }
}

async function withTempDir(
  fn: (temp: string, specDir: string) => Promise<void>,
): Promise<void> {
  const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-122-"))
  const specDir = path.join(temp, "docs/spec")
  try {
    await fn(temp, specDir)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

async function writeSpec(specDir: string, name: string, content: string): Promise<void> {
  await mkdir(specDir, { recursive: true })
  await writeFile(path.join(specDir, name), content, "utf8")
}

describe("課題 122 spec-check", () => {
  test("switch に spec-check がある", () => {
    const cli = readFileSync(cliPath, "utf8")
    expect(cli).toContain('case "spec-check":')
  })

  test("--help に sdd-cur spec-check の行", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "--help"], {
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
    })
    expect(await proc.exited).toBe(0)
    const stderr = await new Response(proc.stderr).text()
    expect(stderr.split("\n").some((l) => l === "sdd-cur spec-check")).toBe(true)
  })

  test("余分な引数は検査せず引数は受け取れません", async () => {
    await withTempDir(async (temp, specDir) => {
      await writeSpec(
        specDir,
        "a.md",
        "## REQ-1\n呼ばないである。\n",
      )
      for (const extra of [["foo"], ["--help"], ["-h"], ["foo", "bar"]] as const) {
        const { exitCode, stdout, stderr } = await runSpecCheck(temp, [...extra])
        expect(exitCode).toBe(1)
        expect(stdout).toBe("")
        expect(stderr).toBe("引数は受け取れません\n")
      }
    })
  })

  test("docs/spec/ が無いとき 0", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-122-"))
    try {
      const { exitCode, stdout, stderr } = await runSpecCheck(temp)
      expect(exitCode).toBe(0)
      expect(stdout).toBe("")
      expect(stderr).toBe("")
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("docs/spec がファイルのとき正本を読めません", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-122-"))
    try {
      await mkdir(path.join(temp, "docs"), { recursive: true })
      await writeFile(path.join(temp, "docs/spec"), "not a dir", "utf8")
      const { exitCode, stdout, stderr } = await runSpecCheck(temp)
      expect(exitCode).toBe(1)
      expect(stdout).toBe("")
      expect(stderr).toBe("正本を読めません\n")
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("近い本文 REQ-1 REQ-2", async () => {
    await withTempDir(async (temp, specDir) => {
      await writeSpec(
        specDir,
        "a.md",
        "## REQ-1\nあいうえお\n## REQ-2\nあいうえか\n## REQ-3\nかきくけこ\n",
      )
      const { exitCode, stdout, stderr } = await runSpecCheck(temp)
      expect(exitCode).toBe(1)
      expect(stdout).toBe("")
      expect(stderr).toBe("本文が近いです: docs/spec/a.md REQ-1 REQ-2\n")
    })
  })

  test("遠い本文は近い組を書かない", async () => {
    await withTempDir(async (temp, specDir) => {
      await writeSpec(
        specDir,
        "a.md",
        "## REQ-1\nあいうえお\n## REQ-2\nかきくけこ\n",
      )
      const { exitCode, stdout, stderr } = await runSpecCheck(temp)
      expect(exitCode).toBe(0)
      expect(stdout).toBe("")
      expect(stderr).toBe("")
    })
  })

  test("壊れた文末は行ごとに二件", async () => {
    await withTempDir(async (temp, specDir) => {
      await writeSpec(
        specDir,
        "a.md",
        "## REQ-1\n呼ばないである。\n作るである。\n",
      )
      const { exitCode, stdout, stderr } = await runSpecCheck(temp)
      expect(exitCode).toBe(1)
      expect(stdout).toBe("")
      const lines = stderr.trimEnd().split("\n")
      expect(lines).toEqual([
        "壊れた文末です: docs/spec/a.md 2 REQ-1",
        "壊れた文末です: docs/spec/a.md 3 REQ-1",
      ])
    })
  })

  test("壊れた文末の除外", async () => {
    await withTempDir(async (temp, specDir) => {
      await writeSpec(
        specDir,
        "a.md",
        [
          "## REQ-1",
          "状態はこうである。",
          "状態はそうである。",
          "状態はどうである。",
          "することである。",
          "```",
          "呼ばないである。",
          "```",
        ].join("\n") + "\n",
      )
      const { exitCode, stdout, stderr } = await runSpecCheck(temp)
      expect(exitCode).toBe(0)
      expect(stdout).toBe("")
      expect(stderr).toBe("")
    })
  })

  test("空の本文", async () => {
    await withTempDir(async (temp, specDir) => {
      await writeSpec(
        specDir,
        "a.md",
        "## REQ-1\n\n## REQ-2\nあ\n",
      )
      const { exitCode, stdout, stderr } = await runSpecCheck(temp)
      expect(exitCode).toBe(1)
      expect(stderr).toBe("本文が空です: docs/spec/a.md REQ-1\n")
      expect(stdout).toBe("")

      await writeSpec(specDir, "a.md", "## REQ-1\n\u3000\n## REQ-2\nあ\n")
      const again = await runSpecCheck(temp)
      expect(again.stderr).toBe("本文が空です: docs/spec/a.md REQ-1\n")
    })
  })

  test("由来の行だけの要求は空にしない", async () => {
    await withTempDir(async (temp, specDir) => {
      await writeSpec(
        specDir,
        "a.md",
        "## REQ-1\nもとになった課題は #1 である。\n",
      )
      const { exitCode, stderr } = await runSpecCheck(temp)
      expect(exitCode).toBe(0)
      expect(stderr).toBe("")
    })
  })

  test("識別子が二ファイルに一度ずつ", async () => {
    await withTempDir(async (temp, specDir) => {
      await writeSpec(specDir, "a.md", "## REQ-1\nあいうえお\n")
      await writeSpec(specDir, "b.md", "## REQ-1\nかきくけこ\n")
      const { exitCode, stderr } = await runSpecCheck(temp)
      expect(exitCode).toBe(1)
      expect(stderr).toBe(
        "識別子が重複しています: REQ-1 docs/spec/a.md docs/spec/b.md\n",
      )
    })
  })

  test("識別子が三回でも一件", async () => {
    await withTempDir(async (temp, specDir) => {
      await writeSpec(specDir, "a.md", "## REQ-1\nあ\n## REQ-1\nい\n")
      await writeSpec(specDir, "b.md", "## REQ-1\nう\n")
      const { exitCode, stderr } = await runSpecCheck(temp)
      expect(exitCode).toBe(1)
      expect(stderr).toBe(
        "識別子が重複しています: REQ-1 docs/spec/a.md docs/spec/a.md docs/spec/b.md\n",
      )
    })
  })

  test("四種類同時の順と字面", async () => {
    await withTempDir(async (temp, specDir) => {
      await writeSpec(
        specDir,
        "a.md",
        [
          "# a",
          "",
          "## REQ-9",
          "",
          "## REQ-4",
          "呼ばないである。",
          "作るである。",
          "## REQ-4",
          "あいうえお",
        ].join("\n") + "\n",
      )
      await writeSpec(
        specDir,
        "b.md",
        [
          "# b",
          "",
          "## REQ-8",
          "あいうえお",
          "## REQ-7",
          "あいうえか",
          "## REQ-6",
          "かきくけこ",
        ].join("\n") + "\n",
      )
      const { exitCode, stdout, stderr } = await runSpecCheck(temp)
      expect(exitCode).toBe(1)
      expect(stdout).toBe("")
      expect(stderr).toBe(
        [
          "識別子が重複しています: REQ-4 docs/spec/a.md docs/spec/a.md",
          "本文が空です: docs/spec/a.md REQ-9",
          "壊れた文末です: docs/spec/a.md 6 REQ-4",
          "壊れた文末です: docs/spec/a.md 7 REQ-4",
          "本文が近いです: docs/spec/b.md REQ-8 REQ-7",
        ].join("\n") + "\n",
      )
    })
  })

  test("由来行を除いた近さと別ファイル", async () => {
    await withTempDir(async (temp, specDir) => {
      await writeSpec(
        specDir,
        "a.md",
        [
          "## REQ-1",
          "もとになった課題は #1 である。",
          "あいうえお",
          "## REQ-2",
          "もとになった課題は #2 である。",
          "あいうえか",
          "## REQ-3",
          "か",
        ].join("\n") + "\n",
      )
      const near = await runSpecCheck(temp)
      expect(near.exitCode).toBe(1)
      expect(near.stdout).toBe("")
      expect(near.stderr).toBe("本文が近いです: docs/spec/a.md REQ-1 REQ-2\n")

      await writeSpec(
        specDir,
        "a.md",
        [
          "## REQ-1",
          "もとになった課題は #1 である。",
          "あいうえお",
          "## REQ-2",
          "もとになった課題は #1 である。",
          "かきくけこ",
        ].join("\n") + "\n",
      )
      const far = await runSpecCheck(temp)
      expect(far.exitCode).toBe(0)
      expect(far.stdout).toBe("")
      expect(far.stderr).toBe("")

      await writeSpec(specDir, "a.md", "## REQ-1\n同じ本文です。\n")
      await writeSpec(specDir, "b.md", "## REQ-2\n同じ本文です。\n")
      const { exitCode, stderr } = await runSpecCheck(temp)
      expect(exitCode).toBe(0)
      expect(stderr).toBe("")
    })
  })

  test("checkSpec を import し conventions に近い本文文言が無い", () => {
    expect(typeof checkSpec).toBe("function")
    const conventions = readFileSync(path.join(root, "src/conventions.ts"), "utf8")
    expect(conventions).not.toContain("本文が近いです")
  })

  test("policy AGENTS README", async () => {
    const policy = await readFile(path.join(root, "docs/policy.md"), "utf8")
    expect(policy).toContain("spec-check")
    expect(policy).toContain("| `src/spec.ts` |")

    const agents = await readFile(path.join(root, "AGENTS.md"), "utf8")
    expect(agents).toContain("bun src/cli.ts spec-check")

    const readme = await readFile(path.join(root, "README.md"), "utf8")
    expect(readme).not.toContain("bun src/cli.ts spec-check")
    expect(readme).not.toContain("| `spec-check` |")
  })
})
