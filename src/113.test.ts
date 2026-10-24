import { describe, expect, test } from "bun:test"
import { execSync } from "node:child_process"
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { readCanonicalIds, specPaths } from "./conventions.ts"
import { checkSpec } from "./spec.ts"

const root = path.join(import.meta.dir, "..")
const cliPath = path.join(root, "src/cli.ts")
const specTsPath = path.join(root, "src/spec.ts")
const bunExe = process.execPath

/** 古いパスが残っていないことを確かめる検索語 */
const SEARCH_DOCS_SPECS = "docs/specs"
const SEARCH_DOCS_SPEC = "docs/spec"

const exemptTestFiles = new Set([
  "113.test.ts",
  "agents-files.test.ts",
  "90.test.ts",
])

function hasOldPathString(text: string): boolean {
  return text.includes(SEARCH_DOCS_SPECS) || text.includes(SEARCH_DOCS_SPEC)
}

function gitLines(command: string): string[] {
  try {
    const out = execSync(`${command} 2>/dev/null`, { cwd: root, encoding: "utf8" }).trim()
    if (!out) return []
    return out.split("\n")
  } catch {
    return []
  }
}

function gitCanonicalBasenames(): string[] {
  const fromCanonical = gitLines("git ls-tree --name-only HEAD:docs/canonical")
  const names = new Set<string>()
  if (fromCanonical.length > 0) {
    for (const name of fromCanonical) {
      if (name.endsWith(".md")) names.add(name)
    }
  } else {
    for (const name of gitLines("git ls-tree --name-only HEAD:docs/spec")) {
      if (name.endsWith(".md")) names.add(name)
    }
  }
  for (const tracked of gitLines("git ls-files 'docs/canonical/*.md'")) {
    names.add(path.basename(tracked))
  }
  return [...names].sort()
}

function gitIssueRelativePaths(): string[] {
  const fromSpecs = gitLines("git ls-tree -r --name-only HEAD docs/specs")
  if (fromSpecs.length > 0) {
    return fromSpecs
      .map((p) => p.replace(/^docs\/specs\//, ""))
      .sort()
  }
  const rel = new Set<string>()
  for (const p of gitLines("git ls-tree -r --name-only HEAD docs/issues")) {
    rel.add(p.replace(/^docs\/issues\//, ""))
  }
  for (const p of gitLines("git ls-files docs/issues")) {
    rel.add(p.replace(/^docs\/issues\//, ""))
  }
  for (const p of gitLines(
    "git ls-files -o --exclude-standard docs/issues",
  )) {
    rel.add(p.replace(/^docs\/issues\//, ""))
  }
  return [...rel].sort()
}

async function listIssueRelativePathsOnDisk(): Promise<string[]> {
  const issuesRoot = path.join(root, "docs/issues")
  const out: string[] = []
  async function walk(dir: string, prefix: string): Promise<void> {
    for (const ent of await readdir(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name
      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        await walk(full, rel)
      } else if (ent.isFile()) {
        out.push(rel)
      }
    }
  }
  await walk(issuesRoot, "")
  return out.sort()
}

async function listMarkdownUnder(dir: string): Promise<string[]> {
  const out: string[] = []
  async function walk(current: string, prefix: string): Promise<void> {
    for (const ent of await readdir(current, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name
      const full = path.join(current, ent.name)
      if (ent.isDirectory()) {
        await walk(full, rel)
      } else if (ent.isFile() && ent.name.endsWith(".md")) {
        out.push(rel)
      }
    }
  }
  await walk(dir, "")
  return out.sort()
}

async function runSpecCheck(
  cwd: string,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([bunExe, cliPath, "spec-check"], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  })
  const exitCode = await proc.exited
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  return { exitCode, stdout, stderr }
}

function extractGenjoSection(requirements: string): string {
  const start = requirements.indexOf("## 現状\n")
  expect(start).toBeGreaterThanOrEqual(0)
  const after = requirements.slice(start + "## 現状\n".length)
  const end = after.indexOf("\n## ")
  return end === -1 ? after : after.slice(0, end)
}

describe("課題 113 仕様ディレクトリ", () => {
  test("docs/canonical と旧 docs/spec/ のファイル名、docs/spec/ は無い", async () => {
    const canonicalDir = path.join(root, "docs/canonical")
    const onDisk = readdirSync(canonicalDir)
      .filter((name) => name.endsWith(".md"))
      .sort()
    expect(onDisk).toEqual(gitCanonicalBasenames())
    expect(existsSync(path.join(root, "docs/spec"))).toBe(false)
  })

  test("docs/issues の相対パスと docs/specs/ は無い", async () => {
    const onDisk = await listIssueRelativePathsOnDisk()
    expect(onDisk).toEqual(gitIssueRelativePaths())
    expect(onDisk.length).toBeGreaterThan(0)
    expect(existsSync(path.join(root, "docs/specs"))).toBe(false)
    for (const ent of readdirSync(path.join(root, "docs/issues"), {
      withFileTypes: true,
    })) {
      if (!ent.isDirectory()) continue
      expect(ent.name).toMatch(/^\d+$/)
    }
  })

  test("specPaths は docs/issues/", () => {
    for (const n of [1, 4, 113, 122]) {
      expect(specPaths(n)).toEqual({
        dir: `docs/issues/${n}`,
        requirements: `docs/issues/${n}/requirements.md`,
        design: `docs/issues/${n}/design.md`,
      })
    }
  })

  test("readCanonicalIds checkSpec spec.ts cli spec-check", async () => {
    const conventionsSrc = readFileSync(
      path.join(root, "src/conventions.ts"),
      "utf8",
    )
    expect(conventionsSrc).toContain('join(root, "docs/canonical")')

    const specSrc = readFileSync(specTsPath, "utf8")
    expect(specSrc).toContain('join(root, "docs/canonical")')
    expect(specSrc).toContain("`docs/canonical/${fileName}`")

    await access(specTsPath)
    expect(readFileSync(cliPath, "utf8")).toContain('case "spec-check":')

    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-113-"))
    try {
      const specDir = path.join(temp, "docs/canonical")
      await mkdir(specDir, { recursive: true })
      await writeFile(
        path.join(specDir, "a.md"),
        "## REQ-1\nもとになった課題は #1 である。\n",
        "utf8",
      )
      expect(await readCanonicalIds(temp)).toEqual(["REQ-1"])
      const findings = await checkSpec(temp)
      expect(findings).toEqual([])
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("docs conventions policy README AGENTS skills に旧パス文字列が無い", async () => {
    const paths = [
      "docs/conventions.md",
      "docs/policy.md",
      "README.md",
      "AGENTS.md",
    ]
    for (const rel of paths) {
      const text = await readFile(path.join(root, rel), "utf8")
      expect(hasOldPathString(text)).toBe(false)
    }
    for (const rel of await listMarkdownUnder(path.join(root, "skills"))) {
      const text = await readFile(path.join(root, "skills", rel), "utf8")
      expect(hasOldPathString(text)).toBe(false)
    }
  })

  test("除外以外の src/*.test.ts に旧パス文字列が無い", async () => {
    for (const name of readdirSync(path.join(root, "src")).filter((f) =>
      f.endsWith(".test.ts"),
    )) {
      if (exemptTestFiles.has(name)) continue
      const text = await readFile(path.join(root, "src", name), "utf8")
      expect(hasOldPathString(text)).toBe(false)
    }
  })

  test("docs/canonical 直下の .md に旧パス文字列が無い", async () => {
    const canonicalDir = path.join(root, "docs/canonical")
    for (const name of readdirSync(canonicalDir).filter((f) => f.endsWith(".md"))) {
      const text = await readFile(path.join(canonicalDir, name), "utf8")
      expect(hasOldPathString(text)).toBe(false)
    }
  })

  test("課題 113 以外の requirements.md design.md に旧パス文字列が無い", async () => {
    const issuesRoot = path.join(root, "docs/issues")
    for (const ent of readdirSync(issuesRoot, { withFileTypes: true })) {
      if (!ent.isDirectory() || ent.name === "113" || ent.name === "123") continue
      for (const file of ["requirements.md", "design.md"] as const) {
        const full = path.join(issuesRoot, ent.name, file)
        if (!existsSync(full)) continue
        const text = await readFile(full, "utf8")
        expect(hasOldPathString(text)).toBe(false)
      }
    }
  })

  test("課題 113 requirements の現状節", async () => {
    const requirements = await readFile(
      path.join(root, "docs/issues/113/requirements.md"),
      "utf8",
    )
    const genjo = extractGenjoSection(requirements)
    expect(genjo).toContain("docs/specs/<番号>/requirements.md")
    expect(genjo).toContain("docs/spec/<領域>.md")
    expect(genjo).toContain("`docs/conventions.md` の 11 行")
    expect(genjo).toContain("`src/conventions.ts` の 1498 行")
    expect(genjo).not.toContain("docs/canonical/")
    expect(genjo).not.toContain("docs/issues/")
  })

  test("spec-check 一時ディレクトリ", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-113-"))
    try {
      const empty = await runSpecCheck(temp)
      expect(empty.exitCode).toBe(0)
      expect(empty.stdout).toBe("")
      expect(empty.stderr).toBe("")

      const specDir = path.join(temp, "docs/canonical")
      await mkdir(specDir, { recursive: true })
      await writeFile(
        path.join(specDir, "a.md"),
        "## REQ-1\nあいうえお\n## REQ-2\nあいうえか\n## REQ-3\nかきくけこ\n",
        "utf8",
      )
      const near = await runSpecCheck(temp)
      expect(near.exitCode).toBe(1)
      expect(near.stdout).toBe("")
      expect(near.stderr).toBe(
        "本文が近いです: docs/canonical/a.md REQ-1 REQ-2\n",
      )
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})
