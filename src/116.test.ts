import { afterEach, describe, expect, test } from "bun:test"
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
} from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { reviewModelFromRound3 } from "./conventions.ts"
import {
  defaultSkillsSourceDir,
  installSkills,
} from "./install.ts"

const repoRoot = path.join(import.meta.dir, "..")
const skillsRoot = path.join(repoRoot, "skills")
const agentsRoot = path.join(repoRoot, "agents")

const notFoundSentenceOne =
  "`sdd-cur` が見つからないときは、`bun add -g @paterapatera/sdd-cur` を含む一行を伝えて止まる。"
const notFoundSentenceTwo = "止まったあとは、`sdd-cur` を実行しない。"

const reqReviewFourSentences = [
  "要求レビュー役の初回の起動が `sdd-cur-req-reviewer` である。",
  "`review-next` のあと、返った `model` が空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する。",
  "要求レビュー役を起動するとき model を渡さない。",
  "要求レビュー役の起動で model を渡さない。",
] as const

const reqReviewAfterAnswerThree = [
  "人が答えたあとに要求レビュー役を再び起動するとき、返った `model` が空文字なら `sdd-cur-req-reviewer` である。",
  "返った `model` が空でないなら `sdd-cur-req-reviewer-high` である。",
  "この再起動は回数を増やさない。",
] as const

const cliExecutingSkills = [
  "sdd-cur/SKILL.md",
  "sdd-cur-quick/SKILL.md",
  "sdd-cur-complete/SKILL.md",
  "sdd-cur-implement/SKILL.md",
] as const

const skillsWithoutNotFound = [
  "sdd-cur-create-issue/SKILL.md",
  "sdd-cur-fix/SKILL.md",
] as const

async function listMarkdownFiles(dir: string): Promise<string[]> {
  const out: string[] = []
  async function walk(current: string, prefix: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(full, rel)
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        out.push(rel)
      }
    }
  }
  await walk(dir, "")
  return out.sort()
}

async function listFilesRecursive(root: string): Promise<string[]> {
  const out: string[] = []
  async function walk(current: string, prefix: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(full, rel)
      } else if (entry.isFile()) {
        out.push(rel)
      }
    }
  }
  await walk(root, "")
  return out.sort()
}

function bodyAfterFrontmatter(text: string): string {
  const fmEnd = text.indexOf("\n---\n", 4)
  if (fmEnd === -1) return text
  return text.slice(fmEnd + 5)
}

function fixReadonlyParse(text: string): {
  name: string
  model: string
  description: string
  readonly?: boolean
} {
  const m = text.match(
    /^---\nname: ([^\n]+)\nmodel: ([^\n]+)\ndescription: ([^\n]+)\n(?:readonly: (true)\n)?---/,
  )
  if (!m) {
    throw new Error("frontmatter")
  }
  return {
    name: m[1],
    model: m[2],
    description: m[3],
    readonly: m[4] === "true" ? true : undefined,
  }
}

function sectionBetween(
  text: string,
  startHeading: string,
  endHeading: string,
): string {
  const start = text.indexOf(startHeading)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = text.indexOf(endHeading, start + startHeading.length)
  expect(end).toBeGreaterThan(start)
  return text.slice(start, end)
}

function cliInvocationsInBackticks(text: string): string[] {
  const found: string[] = []
  for (const m of text.matchAll(/`([^`]+)`/g)) {
    const inner = m[1]
    if (inner === "sdd-cur" || inner.startsWith("sdd-cur ")) {
      found.push(inner)
    }
  }
  return found
}

describe("issue 116 skills and agents CLI", () => {
  test("skills と agents の本文に bun src/cli.ts が無い", async () => {
    for (const rel of await listMarkdownFiles(skillsRoot)) {
      const text = await readFile(path.join(skillsRoot, rel), "utf8")
      expect(text).not.toContain("bun src/cli.ts")
    }
    for (const rel of await listMarkdownFiles(agentsRoot)) {
      const text = await readFile(path.join(agentsRoot, rel), "utf8")
      expect(text).not.toContain("bun src/cli.ts")
    }
  })

  test("CLI 呼び出しは sdd-cur で始まりサブコマンドと引数を保つ", async () => {
    for (const rel of await listMarkdownFiles(skillsRoot)) {
      const text = await readFile(path.join(skillsRoot, rel), "utf8")
      for (const invocation of cliInvocationsInBackticks(text)) {
        expect(invocation).toMatch(/^sdd-cur( .+)?$/)
        expect(invocation).not.toMatch(/^sdd-cur-/)
      }
    }
  })

  test("create-issue は課題を作らない文を含む", async () => {
    const text = await readFile(
      path.join(skillsRoot, "sdd-cur-create-issue/SKILL.md"),
      "utf8",
    )
    expect(text).toContain("`sdd-cur` では課題を作らない。")
  })

  test("CLI を実行する四スキルは見つからないときの二文を持つ", async () => {
    for (const rel of cliExecutingSkills) {
      const text = await readFile(path.join(skillsRoot, rel), "utf8")
      expect(text).toContain(notFoundSentenceOne)
      expect(text).toContain(notFoundSentenceTwo)
    }
  })

  test("create-issue と fix は bun add -g を含まない", async () => {
    for (const rel of skillsWithoutNotFound) {
      const text = await readFile(path.join(skillsRoot, rel), "utf8")
      expect(text).not.toContain("bun add -g @paterapatera/sdd-cur")
    }
  })
})

describe("issue 116 package bin and install copy", () => {
  let tempRoot: string

  afterEach(async () => {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true })
      tempRoot = ""
    }
  })

  test("bin.sdd-cur と shebang と scripts.sdd-cur", async () => {
    const pkg = JSON.parse(
      await readFile(path.join(repoRoot, "package.json"), "utf8"),
    ) as {
      bin: Record<string, string>
      scripts: Record<string, string>
    }
    expect(pkg.bin["sdd-cur"]).toBe("src/cli.ts")
    const first = (
      await readFile(path.join(repoRoot, "src", "cli.ts"), "utf8")
    ).split("\n")[0]
    expect(first).toBe("#!/usr/bin/env bun")
    expect(pkg.scripts["sdd-cur"]).toBe("bun src/cli.ts")
  })

  test("install はスキル本文を書き換えず版のファイルを置かない", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-116-install-"))
    const destParent = path.join(tempRoot, "dest")
    await mkdir(destParent, { recursive: true })

    const result = await installSkills({
      homedir: destParent,
      projectRoot: destParent,
      skillsSourceDir: defaultSkillsSourceDir,
    })

    const sourceSkillDirs = (
      await readdir(defaultSkillsSourceDir, { withFileTypes: true })
    )
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()

    expect(result.skillNames.sort()).toEqual(sourceSkillDirs)

    for (const name of sourceSkillDirs) {
      const sourceDir = path.join(defaultSkillsSourceDir, name)
      const destDir = path.join(result.destDir, name)
      const sourceFiles = await listFilesRecursive(sourceDir)
      const destFiles = await listFilesRecursive(destDir)
      expect(destFiles).toEqual(sourceFiles)
      for (const rel of sourceFiles) {
        const sourceText = await readFile(path.join(sourceDir, rel), "utf8")
        const destText = await readFile(path.join(destDir, rel), "utf8")
        expect(destText).toBe(sourceText)
      }
    }

    const destOnly = await listFilesRecursive(result.destDir)
    for (const rel of destOnly) {
      expect(rel).not.toMatch(/version/i)
      expect(path.basename(rel)).not.toMatch(/^\.sdd-cur/)
    }
  })
})

describe("issue 116 req reviewer agents", () => {
  const mediumPath = path.join(agentsRoot, "sdd-cur-req-reviewer.md")
  const highPath = path.join(agentsRoot, "sdd-cur-req-reviewer-high.md")

  test("中級のファイルと frontmatter", async () => {
    await expect(stat(mediumPath)).resolves.toBeDefined()
    const text = await readFile(mediumPath, "utf8")
    const fm = fixReadonlyParse(text)
    expect(fm.name).toBe("sdd-cur-req-reviewer")
    expect(fm.model).toBe("composer-2.5[fast=false]")
    expect(fm.readonly).toBe(true)
  })

  test("上級のファイルと frontmatter", async () => {
    await expect(stat(highPath)).resolves.toBeDefined()
    const text = await readFile(highPath, "utf8")
    const fm = fixReadonlyParse(text)
    expect(fm.name).toBe("sdd-cur-req-reviewer-high")
    expect(fm.model).toBe(
      "grok-4.7[context=256k,reasoning_effort=medium,fast=false]",
    )
    expect(fm.model).toBe(reviewModelFromRound3)
    expect(fm.readonly).toBe(true)
    expect(fm.description.startsWith("上級である。")).toBe(true)
    const mediumFm = fixReadonlyParse(await readFile(mediumPath, "utf8"))
    expect(fm.description).toBe(`上級である。${mediumFm.description}`)
    const highLines = bodyAfterFrontmatter(text).trimStart().split("\n")
    expect(highLines[0]).toBe("あなたは sdd-cur の上級の要求レビュー役である。")
  })

  test("上級の 2 文目以降は中級と同じ", async () => {
    const mediumLines = bodyAfterFrontmatter(
      await readFile(mediumPath, "utf8"),
    )
      .trimStart()
      .split("\n")
    const highLines = bodyAfterFrontmatter(await readFile(highPath, "utf8"))
      .trimStart()
      .split("\n")
    expect(highLines.slice(1).join("\n")).toBe(mediumLines.slice(1).join("\n"))
  })
})

describe("issue 116 requirements section in skills", () => {
  test("sdd-cur の要件の段", async () => {
    const text = await readFile(path.join(skillsRoot, "sdd-cur/SKILL.md"), "utf8")
    const section = sectionBetween(text, "## 要件", "## 設計")
    for (const phrase of reqReviewFourSentences) {
      expect(section).toContain(phrase)
    }
    for (const phrase of reqReviewAfterAnswerThree) {
      expect(section).toContain(phrase)
    }
    expect(section).not.toContain("その文字列をレビュー役の model に渡す")
  })

  test("sdd-cur-quick の要件の段", async () => {
    const text = await readFile(
      path.join(skillsRoot, "sdd-cur-quick/SKILL.md"),
      "utf8",
    )
    const section = sectionBetween(text, "## 要件", "## 設計")
    for (const phrase of reqReviewFourSentences) {
      expect(section).toContain(phrase)
    }
    for (const phrase of reqReviewAfterAnswerThree) {
      expect(section).not.toContain(phrase)
    }
    expect(text).not.toContain(
      "grok-4.7[context=256k,reasoning_effort=high,fast=false]",
    )
  })
})
