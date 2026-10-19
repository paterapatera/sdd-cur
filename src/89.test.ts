import { describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  collectChangeFilePathViolations,
  collectEvidenceViolations,
  countGitShowContentLines,
  formMarkerLine,
  validateSpecForm,
} from "./conventions.ts"

const root = path.join(import.meta.dir, "..")
const cliPath = path.join(import.meta.dir, "cli.ts")
const bunExe = process.execPath

const agentPaths = [
  "agents/sdd-cur-req-author.md",
  "agents/sdd-cur-req-reviewer.md",
  "agents/sdd-cur-design-author.md",
  "agents/sdd-cur-design-reviewer.md",
  "agents/sdd-cur-implement-reviewer.md",
] as const

const expectedFrontmatter: Record<
  string,
  { name: string; model: string; readonly?: true }
> = {
  "agents/sdd-cur-req-author.md": {
    name: "sdd-cur-req-author",
    model: "grok-4.7[context=256k,reasoning_effort=high,fast=false]",
  },
  "agents/sdd-cur-req-reviewer.md": {
    name: "sdd-cur-req-reviewer",
    model: "grok-4.7[context=256k,reasoning_effort=medium,fast=false]",
    readonly: true,
  },
  "agents/sdd-cur-design-author.md": {
    name: "sdd-cur-design-author",
    model: "grok-4.7[context=256k,reasoning_effort=high,fast=false]",
  },
  "agents/sdd-cur-design-reviewer.md": {
    name: "sdd-cur-design-reviewer",
    model: "grok-4.7[context=256k,reasoning_effort=medium,fast=false]",
    readonly: true,
  },
  "agents/sdd-cur-implement-reviewer.md": {
    name: "sdd-cur-implement-reviewer",
    model: "grok-4.7[context=256k,reasoning_effort=medium,fast=false]",
    readonly: true,
  },
}

function parseFrontmatter(text: string): {
  name: string
  model: string
  readonly?: boolean
} {
  const m = text.match(
    /^---\nname: ([^\n]+)\nmodel: ([^\n]+)\n(?:description:[^\n]*\n)*(?:readonly: (true)\n)?---/,
  )
  if (!m) {
    throw new Error("frontmatter")
  }
  return {
    name: m[1],
    model: m[2],
    readonly: m[3] === "true" ? true : undefined,
  }
}

async function makeGitStub(
  temp: string,
  files: Record<string, { content: string; exitCode?: number }>,
): Promise<{ gitDir: string; log: { args: string[] }[] }> {
  const gitDir = path.join(temp, "bin")
  await mkdir(gitDir, { recursive: true })
  const log: { args: string[] }[] = []
  const script = `#!/usr/bin/env bun
const logPath = ${JSON.stringify(path.join(temp, "git-log.json"))}
const files = ${JSON.stringify(
    Object.fromEntries(
      Object.entries(files).map(([k, v]) => [k, { content: v.content, exitCode: v.exitCode ?? 0 }]),
    ),
  )}
const args = process.argv.slice(2)
const fs = require("node:fs")
let entries = []
try { entries = JSON.parse(fs.readFileSync(logPath, "utf8")) } catch {}
entries.push({ args })
fs.writeFileSync(logPath, JSON.stringify(entries))
if (args[0] !== "show" || args.length !== 2 || !args[1].startsWith("main:")) {
  process.exit(2)
}
const p = args[1].slice(5)
const entry = files[p]
if (!entry || entry.exitCode !== 0) process.exit(1)
process.stdout.write(entry.content)
`
  await writeFile(path.join(gitDir, "git"), script)
  await writeFile(path.join(temp, "git-log.json"), "[]")
  return { gitDir, log }
}

describe("課題 89", () => {
  test("エージェント本文と frontmatter", async () => {
    for (const rel of agentPaths) {
      const text = await readFile(path.join(root, rel), "utf8")
      const fm = parseFrontmatter(text)
      const exp = expectedFrontmatter[rel]
      expect(fm.name).toBe(exp.name)
      expect(fm.model).toBe(exp.model)
      if (exp.readonly) {
        expect(fm.readonly).toBe(true)
      }
    }

    const reqAuthor = await readFile(
      path.join(root, "agents/sdd-cur-req-author.md"),
      "utf8",
    )
    const idx = reqAuthor.indexOf("要件の「現状」の各項目の根拠は")
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(reqAuthor.slice(idx)).toContain(
      "要件の「現状」の各項目の根拠は、（`パス` の N 行）の表記だけである。",
    )
    expect(reqAuthor.slice(idx)).toContain("パスは、リポジトリ相対パスである。")
    expect(reqAuthor.slice(idx)).toContain("N は、一つの行番号である。")
    expect(reqAuthor.slice(idx)).toContain("行の範囲は、根拠に書かない。")

    const reqReviewer = await readFile(
      path.join(root, "agents/sdd-cur-req-reviewer.md"),
      "utf8",
    )
    expect(reqReviewer).toContain(
      "「現状」の項目の根拠の字面が、（`パス` の N 行）だけになっていない",
    )
    expect(reqReviewer).toContain(
      "N は、`0` から `9` が一つ以上並んだ字面である。",
    )
    expect(reqReviewer).toContain("先頭の零があっても、この形式に合う。")

    const designAuthor = await readFile(
      path.join(root, "agents/sdd-cur-design-author.md"),
      "utf8",
    )
    expect(designAuthor).toContain("## 正本への差分")
    expect(designAuthor).toContain(
      "見出しが `## 変えるファイル` と一文字も違わない、変えるファイルの一覧の節を書く",
    )

    const designReviewer = await readFile(
      path.join(root, "agents/sdd-cur-design-reviewer.md"),
      "utf8",
    )
    expect(designReviewer).toContain("## 正本への差分")
    expect(designReviewer).toContain(
      "`## 変えるファイル` と一文字も違わない見出しが無い",
    )

    const implReviewer = await readFile(
      path.join(root, "agents/sdd-cur-implement-reviewer.md"),
      "utf8",
    )
    expect(implReviewer).toContain(
      "作業ツリーと main の差分に現れるパスが、設計の `## 変えるファイル` の一覧に無い",
    )
    expect(implReviewer).toContain("差分のパスは、追加、変更、削除である。")
    expect(implReviewer).toContain("未コミットの差分を含む。")
    expect(implReviewer).toContain("行頭の `- ` を除いた残りである。")
    expect(implReviewer).toContain("作業ツリーの実装が、要求どおりでない。")
  })

  test("countGitShowContentLines", () => {
    expect(countGitShowContentLines("")).toBe(0)
    expect(countGitShowContentLines("a")).toBe(1)
    expect(countGitShowContentLines("a\n")).toBe(1)
    expect(countGitShowContentLines("a\nb\n")).toBe(2)
  })

  test("validateSpecForm は根拠と一覧の違反を返さない", () => {
    const marker = `# 1 題\n${formMarkerLine}\n`
    const req = `${marker}## 現状\n（\`missing/on/main\` の 999 行）\n## 受け入れ条件\n- 1. 条件: c 主体: s 結果: r\n`
    expect(validateSpecForm("requirements", req)).toEqual([])
    const design = `${marker}## 変えるファイル\n- ../a\n- /b\n## 受け入れ条件\n- 1. 条件: c 主体: s 結果: r\n## 範囲外\n\n## 決定\n\n## 作業の一覧\n- 1. 実装。[1]\n## テスト\n- [1]\n`
    expect(validateSpecForm("design", design)).toEqual([])
  })

  test("collectEvidenceViolations と collectChangeFilePathViolations", () => {
    const marker = `# 1 題\n${formMarkerLine}\n`
    const read = (p: string): string | null => {
      if (p === "src/a.ts") {
        return "line1\nline2\nline3\nline4\nline5\nline6\nline7\n"
      }
      if (p === "empty.ts") return ""
      return null
    }
    const req = `${marker}## 現状\n（\`no/file\` の 1 行）と（\`src/a.ts\` の 007 行）\n`
    const v = collectEvidenceViolations(req, read)
    expect(v).toContain("根拠のファイルが main にありません: no/file")
    expect(v).not.toContain("根拠の行番号がファイルの行数を超えています: src/a.ts 7")

    const badN = `${marker}## 現状\n（\`src/a.ts\` の 00 行）\n`
    expect(collectEvidenceViolations(badN, read)).toContain(
      "根拠の行番号が不正です: 0",
    )

    const over = `${marker}## 現状\n（\`src/a.ts\` の 9 行）\n`
    expect(collectEvidenceViolations(over, read)).toContain(
      "根拠の行番号がファイルの行数を超えています: src/a.ts 9",
    )

    const emptyFile = `${marker}## 現状\n（\`empty.ts\` の 1 行）\n`
    expect(collectEvidenceViolations(emptyFile, read)).toContain(
      "根拠の行番号がファイルの行数を超えています: empty.ts 1",
    )

    const design = `${marker}## 変えるファイル\n- ../a\n- /b\n./c\n## 受け入れ条件\n`
    expect(collectChangeFilePathViolations(design)).toEqual([
      "変えるファイルのパスが不正です: ../a",
      "変えるファイルのパスが不正です: /b",
    ])
  })

  test("cmdValidate と git show", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-89-val-"))
    const form = formMarkerLine
    try {
      const specDir = path.join(temp, "docs", "specs", "89")
      await mkdir(specDir, { recursive: true })
      const okReq = `# 89 題\n${form}\n## 受け入れ条件\n- 1. 条件: c 主体: s 結果: r\n`
      const okDesign = `# 89 題\n${form}\n## 受け入れ条件\n- 1. 条件: c 主体: s 結果: r\n## 範囲外\n\n## 決定\n\n## 作業の一覧\n- 1. 実装。[1]\n## テスト\n- [1]\n`
      await writeFile(path.join(specDir, "requirements.md"), okReq)
      await writeFile(path.join(specDir, "design.md"), okDesign)

      const { gitDir } = await makeGitStub(temp, {})
      const env = {
        ...process.env,
        PATH: `${gitDir}:${process.env.PATH ?? ""}`,
      }
      let proc = Bun.spawn([bunExe, cliPath, "validate", "89"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env,
      })
      expect(await proc.exited).toBe(0)

      await writeFile(
        path.join(specDir, "requirements.md"),
        `# 89 題\n${form}\n## 現状\n（\`src/missing.ts\` の 1 行）\n## 受け入れ条件\n- 1. 条件: c 主体: s 結果: r\n`,
      )
      proc = Bun.spawn([bunExe, cliPath, "validate", "89"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env,
      })
      expect(await proc.exited).toBe(1)
      expect(await new Response(proc.stderr).text()).toBe(
        "docs/specs/89/requirements.md: 根拠のファイルが main にありません: src/missing.ts\n",
      )

      await writeFile(
        path.join(specDir, "design.md"),
        `${okDesign}\n## 変えるファイル\n- ../x\n`,
      )
      proc = Bun.spawn([bunExe, cliPath, "validate", "89"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env,
      })
      expect(await proc.exited).toBe(1)
      const err = await new Response(proc.stderr).text()
      expect(err).toContain(
        "docs/specs/89/design.md: 変えるファイルのパスが不正です: ../x",
      )

      const logPath = path.join(temp, "git-log.json")
      const log = JSON.parse(await readFile(logPath, "utf8")) as {
        args: string[]
      }[]
      for (const entry of log) {
        expect(entry.args[0]).toBe("show")
        expect(entry.args[1]?.startsWith("main:")).toBe(true)
        expect(entry.args.length).toBe(2)
      }
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})
