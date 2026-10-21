import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { defaultSkillsSourceDir, installSkills } from "./install.ts"

const repoRoot = path.join(import.meta.dir, "..")
const skillsRoot = path.join(repoRoot, "skills")
const agentsRoot = path.join(repoRoot, "agents")

const introLine =
  "スキルと課題ランナーが同じ規則を使う。判定の実装は `src/conventions.ts` にある。"

const distributedSectionHeadings = [
  "## 課題ごとのファイル",
  "## 仕様の正本",
  "## レビューが読む範囲",
  "## 課題コメントの種別",
  "## 反映済みの回答",
  "## 未反映の回答",
  "## マージリクエストの会話コメント",
  "## 処理済みの不具合",
  "## レビューの判定",
  "## マージリクエストの本文",
  "## 着手の課題コメント",
  "## 要件と設計の形式",
] as const

const conventionsReadLine = "作業の前に `sdd-cur/conventions.md` を読む。"

const skillFiles = [
  "sdd-cur/SKILL.md",
  "sdd-cur-quick/SKILL.md",
  "sdd-cur-implement/SKILL.md",
  "sdd-cur-complete/SKILL.md",
  "sdd-cur-create-issue/SKILL.md",
  "sdd-cur-fix/SKILL.md",
] as const

const agentFiles = [
  "sdd-cur-req-author.md",
  "sdd-cur-req-reviewer.md",
  "sdd-cur-req-reviewer-high.md",
  "sdd-cur-req-fixer.md",
  "sdd-cur-design-author.md",
  "sdd-cur-design-reviewer.md",
  "sdd-cur-design-fixer.md",
  "sdd-cur-implement-author.md",
  "sdd-cur-implement-reviewer.md",
  "sdd-cur-implement-fixer.md",
  "sdd-cur-explore.md",
] as const

const agentsBeforeRead = [
  "1. [docs/policy.md](docs/policy.md)",
  "2. [skills/sdd-cur/conventions.md](skills/sdd-cur/conventions.md)",
  "3. [docs/conventions.md](docs/conventions.md) の節「スキル、サブエージェント、テストの書き方」",
  "4. 対象課題の `docs/issues/<番号>/design.md`",
] as const

function firstNonEmptyLine(text: string): string {
  for (const line of text.split("\n")) {
    if (line.trim() !== "") return line
  }
  return ""
}

function headingPositions(text: string, headings: readonly string[]): number[] {
  const positions: number[] = []
  for (const h of headings) {
    const idx = text.indexOf(`${h}\n`)
    expect(idx).toBeGreaterThanOrEqual(0)
    positions.push(idx)
  }
  for (let i = 1; i < positions.length; i += 1) {
    expect(positions[i]).toBeGreaterThan(positions[i - 1])
  }
  return positions
}

describe("issue 117 distributed conventions", () => {
  test("skills/sdd-cur/conventions.md の題・導入・十二節", async () => {
    const text = await readFile(
      path.join(skillsRoot, "sdd-cur", "conventions.md"),
      "utf8",
    )
    expect(firstNonEmptyLine(text)).toBe("# 約束")
    expect(text).toContain(introLine)
    headingPositions(text, distributedSectionHeadings)
    expect(text).not.toContain(
      "## スキル、サブエージェント、テストの書き方",
    )
  })

  test("docs/conventions.md はリンクと書き方の節だけ", async () => {
    const text = await readFile(
      path.join(repoRoot, "docs/conventions.md"),
      "utf8",
    )
    expect(text).toContain(
      "仕組みの約束は [skills/sdd-cur/conventions.md](skills/sdd-cur/conventions.md) にある。",
    )
    expect(text).not.toContain("# 約束")
    for (const h of distributedSectionHeadings) {
      expect(text).not.toContain(h)
    }
    const h2 = text.match(/^## .+/gm) ?? []
    expect(h2).toEqual(["## スキル、サブエージェント、テストの書き方"])
    expect(text).toContain("一文を一行")
    expect(text).toContain("src/<番号>.test.ts")
  })
})

describe("issue 117 install copies conventions", () => {
  let tempRoot: string

  afterEach(async () => {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true })
      tempRoot = ""
    }
  })

  test("installSkills が sdd-cur/conventions.md をコピーする", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-117-install-"))
    const source = await readFile(
      path.join(skillsRoot, "sdd-cur", "conventions.md"),
      "utf8",
    )
    const result = await installSkills({
      homedir: tempRoot,
      projectRoot: tempRoot,
      skillsSourceDir: defaultSkillsSourceDir,
    })
    const dest = path.join(result.destDir, "sdd-cur", "conventions.md")
    const copied = await readFile(dest, "utf8")
    expect(copied).toBe(source)
    expect(copied).not.toContain(
      "## スキル、サブエージェント、テストの書き方",
    )
  })
})

describe("issue 117 skills and agents references", () => {
  test("六スキルと十一エージェントが conventions を読む一行を持つ", async () => {
    for (const rel of skillFiles) {
      const text = await readFile(path.join(skillsRoot, rel), "utf8")
      expect(text.split("\n").some((l) => l === conventionsReadLine)).toBe(
        true,
      )
      expect(text).not.toContain("docs/conventions.md")
    }
    for (const name of agentFiles) {
      const text = await readFile(path.join(agentsRoot, name), "utf8")
      expect(text.split("\n").some((l) => l === conventionsReadLine)).toBe(
        true,
      )
      expect(text).not.toContain("docs/conventions.md")
    }
  })

  test("上級要求レビュー役の 2 行目が conventions 行", async () => {
    const text = await readFile(
      path.join(agentsRoot, "sdd-cur-req-reviewer-high.md"),
      "utf8",
    )
    const body = text.slice(text.indexOf("\n---\n", 4) + 5).trimStart()
    const lines = body.split("\n")
    expect(lines[0]).toBe("あなたは sdd-cur の上級の要求レビュー役である。")
    expect(lines[1]).toBe(conventionsReadLine)
  })
})

describe("issue 117 AGENTS and policy", () => {
  test("AGENTS.md の着手前に読むもの", async () => {
    const text = await readFile(path.join(repoRoot, "AGENTS.md"), "utf8")
    const section = text.slice(
      text.indexOf("## 着手前に読むもの"),
      text.indexOf("設計の受け入れ条件"),
    )
    for (const line of agentsBeforeRead) {
      expect(section).toContain(line)
    }
    expect(text).not.toContain("一文を一行")
    expect(text).not.toContain(
      "スキル、サブエージェント、テストの書き方は、このファイルを読む。",
    )
  })

  test("docs/policy.md の構成表", async () => {
    const policy = await readFile(
      path.join(repoRoot, "docs/policy.md"),
      "utf8",
    )
    expect(policy).toContain(
      "| `docs/conventions.md` | スキル、サブエージェント、テストの書き方は、このファイルを読む。 |",
    )
    expect(policy).toContain(
      "| `skills/sdd-cur/conventions.md` | 要件・設計の置き場所と課題コメントの約束。 |",
    )
    expect(policy).toContain(
      "| `src/conventions.ts` | 上記約束の判定（パス、種別、対応、反映済み、未反映） |",
    )
    expect(policy).not.toContain(
      "要件・設計の置き場所と課題コメントの約束。スキル、サブエージェント、テストの書き方は、このファイルを読む。",
    )
  })

  test("cli に conventions サブコマンドは無い", async () => {
    const cli = await readFile(path.join(repoRoot, "src/cli.ts"), "utf8")
    expect(cli).not.toContain('case "conventions"')
  })
})
