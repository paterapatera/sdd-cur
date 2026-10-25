import { describe, expect, test } from "bun:test"
import {
  access,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import {
  canonicalReqBodiesFromMarkdown,
  canonicalReqSectionMarkdown,
  specApply,
  specDiff,
  validateCanonicalDelta,
} from "./conventions.ts"
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
## REQ-10
触らない本文です。
`

const exampleDelta = `## 正本への差分

### 変更 spec REQ-1

変えた本文です。

### 削除 spec REQ-2

消える本文です。

### 追加 spec REQ-3

足す本文です。

### 追加 docs REQ-20

新領域の本文です。
`

const exampleDesign = `# 196 題

${exampleDelta}
`

const deleteOnlyDelta = `## 正本への差分

### 削除 docs REQ-99

消えるだけです。
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

function baselineGitRunner(
  baselineByPath: Record<string, string>,
): GitRunner {
  return exampleGitRunner((call) => {
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
      const paths = Object.keys(baselineByPath)
        .map((p) => `${p}\n`)
        .join("")
      return { stdout: paths, stderr: "", exitCode: 0 }
    }
    if (args[0] === "show") {
      const treePath = args[1].split(":")[1]
      const content = baselineByPath[treePath]
      if (content === undefined) {
        return { stdout: "", stderr: "missing", exitCode: 1 }
      }
      return { stdout: content, stderr: "", exitCode: 0 }
    }
    return { stdout: "", stderr: "", exitCode: 1 }
  })
}

async function withTemp(
  fn: (temp: string) => Promise<void>,
): Promise<void> {
  const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-196-"))
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
  const proc = Bun.spawn([bunExe, cliPath, "spec-apply", ...argv], {
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

describe("196 spec-apply", () => {
  test("[1] switch に spec-apply があり spec-diff の次である", () => {
    const cli = readFileSync(cliPath, "utf8")
    const specDiffIdx = cli.indexOf('case "spec-diff":')
    const specApplyIdx = cli.indexOf('case "spec-apply":')
    const defaultIdx = cli.indexOf("default:")
    expect(specDiffIdx).toBeGreaterThan(-1)
    expect(specApplyIdx).toBeGreaterThan(specDiffIdx)
    expect(specApplyIdx).toBeLessThan(defaultIdx)
    const cmdStart = cli.indexOf("async function cmdSpecApply")
    const cmdEnd = cli.indexOf("function wantsHelp", cmdStart)
    expect(cmdStart).toBeGreaterThan(-1)
    expect(cmdEnd).toBeGreaterThan(cmdStart)
    const cmdBlock = cli.slice(cmdStart, cmdEnd)
    expect(cmdBlock).toContain("defaultGitRunner")
    expect(cmdBlock).toContain("specApply")
    expect(cmdBlock).not.toContain("defaultGhRunner")
  })

  test("[2] 使い方に spec-apply が spec-diff の次にある", async () => {
    await withTemp(async (temp) => {
      const { stderr } = await runCli(temp, [])
      const specDiffLine = "sdd-cur spec-diff <番号>"
      const specApplyLine = "sdd-cur spec-apply <番号>"
      const lines = stderr.split("\n")
      const diffIdx = lines.indexOf(specDiffLine)
      const applyIdx = lines.indexOf(specApplyLine)
      expect(diffIdx).toBeGreaterThan(-1)
      expect(applyIdx).toBe(diffIdx + 1)
    })
  })

  test("[3] policy に spec-apply がある", async () => {
    const policy = await readFile(path.join(root, "docs/policy.md"), "utf8")
    expect(policy).toContain("`spec-apply`")
  })

  test("[4] AGENTS のコマンドに spec-apply が spec-diff の次にある", async () => {
    const agents = await readFile(path.join(root, "AGENTS.md"), "utf8")
    const agentsFence = agents.split("## コマンド")[1].split("```")[1]
    const agentsLines = agentsFence.split("\n")
    const specDiffIdx = agentsLines.findIndex(
      (line) => line === "bun src/cli.ts spec-diff <番号>",
    )
    const specApplyIdx = agentsLines.findIndex(
      (line) => line === "bun src/cli.ts spec-apply <番号>",
    )
    expect(specDiffIdx).toBeGreaterThan(-1)
    expect(specApplyIdx).toBe(specDiffIdx + 1)
  })

  test("[5][6][7][8][9][10][19] 追加・変更・削除と spec-diff 一致", async () => {
    await withTemp(async (temp) => {
      const designPath = path.join(temp, "docs/issues/196/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, exampleDesign)
      const canonicalDir = path.join(temp, "docs/canonical")
      await mkdir(canonicalDir, { recursive: true })
      const specBefore = baselineSpec
      await writeFile(path.join(canonicalDir, "spec.md"), specBefore)
      const untouchedMarker = "## REQ-10\n触らない本文です。"
      expect(specBefore).toContain(untouchedMarker)

      const baselineByPath = {
        "docs/canonical/spec.md": baselineSpec,
      }
      const git = baselineGitRunner(baselineByPath)

      const violations = await specApply({ cwd: temp, issueNumber: 196, git })
      expect(violations).toEqual([])

      const specAfter = await readFile(
        path.join(canonicalDir, "spec.md"),
        "utf8",
      )
      expect(specAfter).toContain(untouchedMarker)
      expect(specAfter.indexOf("## REQ-10")).toBeLessThan(
        specAfter.indexOf("## REQ-3"),
      )
      expect(specAfter).toContain("## REQ-1\n変えた本文です。")
      expect(specAfter).not.toContain("## REQ-2")
      expect(specAfter).toContain("## REQ-3\n足す本文です。")

      const docsPath = path.join(canonicalDir, "docs.md")
      const docsContent = await readFile(docsPath, "utf8")
      expect(docsContent.startsWith("# docs\n")).toBe(true)
      expect(docsContent).toContain("## REQ-20\n新領域の本文です。")

      const diffLines = await specDiff({ cwd: temp, issueNumber: 196, git })
      expect(diffLines).toEqual([])
    })
  })

  test("[9] 削除だけで領域ファイルが無くなる", async () => {
    await withTemp(async (temp) => {
      const designPath = path.join(temp, "docs/issues/196/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(
        designPath,
        `# 196

${deleteOnlyDelta}`,
      )
      const canonicalDir = path.join(temp, "docs/canonical")
      await mkdir(canonicalDir, { recursive: true })
      const orphanPath = path.join(canonicalDir, "docs.md")
      await writeFile(
        orphanPath,
        `# docs

## REQ-99
消えるだけです。
`,
      )
      const git = baselineGitRunner({
        "docs/canonical/docs.md": `# docs

## REQ-99
消えるだけです。
`,
      })
      expect(await specApply({ cwd: temp, issueNumber: 196, git })).toEqual([])
      await expect(access(orphanPath)).rejects.toThrow()
    })
  })

  test("[11] 設計が無い・節だけ・項目無し", async () => {
    await withTemp(async (temp) => {
      const canonicalDir = path.join(temp, "docs/canonical")
      await mkdir(canonicalDir, { recursive: true })
      const specPath = path.join(canonicalDir, "spec.md")
      await writeFile(specPath, baselineSpec)
      const before = await readFile(specPath, "utf8")
      const git = baselineGitRunner({
        "docs/canonical/spec.md": baselineSpec,
      })

      expect(await specApply({ cwd: temp, issueNumber: 196, git })).toEqual([])
      expect(await readFile(specPath, "utf8")).toBe(before)

      const designPath = path.join(temp, "docs/issues/196/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, "# 196 題\n")
      expect(await specApply({ cwd: temp, issueNumber: 196, git })).toEqual([])
      expect(await readFile(specPath, "utf8")).toBe(before)
    })
  })

  test("[12] 追加識別子が既にあるとき違反で書かない", async () => {
    await withTemp(async (temp) => {
      const designPath = path.join(temp, "docs/issues/196/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(
        designPath,
        `# 196

## 正本への差分

### 追加 spec REQ-3

足す本文です。
`,
      )
      const canonicalDir = path.join(temp, "docs/canonical")
      await mkdir(canonicalDir, { recursive: true })
      const specPath = path.join(canonicalDir, "spec.md")
      const original = `# spec

## REQ-3
既にあります。
`
      await writeFile(specPath, original)
      const git = baselineGitRunner({
        "docs/canonical/spec.md": `# spec
`,
      })
      const violations = await specApply({ cwd: temp, issueNumber: 196, git })
      expect(violations).toEqual([
        "追加する識別子が正本にあります: REQ-3",
      ])
      expect(await readFile(specPath, "utf8")).toBe(original)
    })
  })

  test("[13] specDiff が expectedCanonicalMapForDesign を呼ぶ", () => {
    const text = readFileSync(conventionsPath, "utf8")
    const start = text.indexOf("export async function specDiff")
    const end = text.indexOf("function normalizeDesignNewlines", start)
    expect(start).toBeGreaterThan(-1)
    expect(end).toBeGreaterThan(start)
    const block = text.slice(start, end)
    expect(block).toContain("expectedCanonicalMapForDesign")
    expect(block).toContain("compareCanonicalMaps")
    expect(block).toContain("readWorktreeCanonicalMap")
  })

  test("[14] compareCanonicalMaps の比較文言は変わらない", () => {
    const text = readFileSync(conventionsPath, "utf8")
    expect(text).toContain("function compareCanonicalMaps")
    expect(text).toContain("本文が違います")
    expect(text).toContain("作業ツリーにありません")
    expect(text).toContain("作業ツリーにだけあります")
  })

  test("[15] canonicalReqSectionMarkdown の往復", () => {
    const fixture = `# spec

## REQ-1
一行です。

## REQ-2


先頭と末尾の空行

## REQ-3
`
    const bodies = canonicalReqBodiesFromMarkdown(fixture)
    for (const [id, body] of bodies) {
      const roundtrip = `# spec\n\n${canonicalReqSectionMarkdown(id, body)}`
      const again = canonicalReqBodiesFromMarkdown(roundtrip)
      expect(again.get(id)).toBe(body)
    }
  })

  test("[21] cmdSpecApply が番号を specApply に渡す", () => {
    const cli = readFileSync(cliPath, "utf8")
    const block = cli.slice(
      cli.indexOf("async function cmdSpecApply"),
      cli.indexOf("function wantsHelp"),
    )
    expect(block).toContain("parseIssueNumberString(args[0])")
    expect(block).toContain("issueNumber,")
    expect(block).toContain("specApply({")
  })

  test("[22] 引数が無いときと二つあるときは使い方", async () => {
    await withTemp(async (temp) => {
      const usageProc = Bun.spawn([bunExe, cliPath, "spec-apply"], {
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
    })
  })

  test("[23] 課題番号が不正", async () => {
    await withTemp(async (temp) => {
      for (const arg of ["foo", "0", "01"]) {
        const { exitCode, stdout, stderr } = await runCli(temp, [arg])
        expect(exitCode).toBe(1)
        expect(stderr.trim()).toBe("番号が不正です")
        expect(stdout).toBe("")
      }
    })
  })

  test("[24] 設計がディレクトリのとき仕様を読めません", async () => {
    await withTemp(async (temp) => {
      const designPath = path.join(temp, "docs/issues/196/design.md")
      await mkdir(designPath, { recursive: true })
      const calls: RecordedGitCall[] = []
      const git = exampleGitRunner((call) => {
        calls.push(call)
        return { stdout: "", stderr: "", exitCode: 0 }
      })
      const { exitCode, stdout, stderr } = await runCli(temp, ["196"])
      expect(exitCode).toBe(1)
      expect(stderr.trim()).toBe("仕様を読めません")
      expect(stdout).toBe("")
      expect(calls).toEqual([])
      await expect(
        specApply({ cwd: temp, issueNumber: 196, git }),
      ).rejects.toThrow("仕様を読めません")
    })
  })

  test("[25] git 失敗で書かない", async () => {
    await withTemp(async (temp) => {
      const designPath = path.join(temp, "docs/issues/196/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, exampleDesign)
      const canonicalDir = path.join(temp, "docs/canonical")
      await mkdir(canonicalDir, { recursive: true })
      const specPath = path.join(canonicalDir, "spec.md")
      await writeFile(specPath, baselineSpec)
      const before = await readFile(specPath, "utf8")

      const gitFail = exampleGitRunner(() => ({
        stdout: "",
        stderr: "",
        exitCode: 1,
      }))
      await expect(
        specApply({ cwd: temp, issueNumber: 196, git: gitFail }),
      ).rejects.toThrow("git を実行できません")
      expect(await readFile(specPath, "utf8")).toBe(before)

      const gitThrow: GitRunner = {
        run: async () => {
          throw new Error("spawn failed")
        },
      }
      await expect(
        specApply({ cwd: temp, issueNumber: 196, git: gitThrow }),
      ).rejects.toThrow("git を実行できません")
      expect(await readFile(specPath, "utf8")).toBe(before)
    })
  })

  test("[26] README に spec-apply の起動例", async () => {
    const readme = await readFile(path.join(root, "README.md"), "utf8")
    expect(readme).toContain(
      "bunx @paterapatera/sdd-cur spec-apply <番号>",
    )
    const section = readme.split("## 開発中の起動")[1]?.split("##")[0] ?? ""
    const lines = section.split("\n")
    const testIdx = lines.findIndex((line) => line === "bun test")
    const applyIdx = lines.findIndex(
      (line) => line === "bunx @paterapatera/sdd-cur spec-apply <番号>",
    )
    expect(testIdx).toBeGreaterThan(-1)
    expect(applyIdx).toBe(testIdx - 1)
  })

  test("spec-apply 正本の docs.md SHA-256", () => {
    const docsMd = readFileSync(
      path.join(root, "docs/canonical/docs.md"),
      "utf8",
    )
    expect(createHash("sha256").update(docsMd, "utf8").digest("hex")).toBe(
      "bff55c12ce5fa5cc354a0e946d4382b6838341798d7e56297482c2dd7d7c4704",
    )
  })

  test("[27] skills の仕様の正本に spec-apply の文", async () => {
    const conv = await readFile(
      path.join(root, "skills/sdd-cur/conventions.md"),
      "utf8",
    )
    const section = conv.split("## 仕様の正本")[1] ?? ""
    expect(section).toContain("sdd-cur spec-apply")
    expect(section).toContain("docs/canonical/")
    expect(section).toContain("期待値の計算は `spec-diff` と同じ手順である。")
  })
})

const canonicalReflectProcedure =
  "設計の `## 正本への差分` を、同じ作業ツリーの `docs/canonical/` へ反映する。"

describe("196 触らない面", () => {
  test("[18] docs/issues の spec-apply 言及は 196 だけ", async () => {
    const issuesDir = path.join(root, "docs/issues")
    const issueDirs = await readdir(issuesDir, { withFileTypes: true })
    for (const entry of issueDirs) {
      if (!entry.isDirectory()) {
        continue
      }
      const issueNumber = entry.name
      for (const name of ["requirements.md", "design.md"] as const) {
        const filePath = path.join(issuesDir, issueNumber, name)
        try {
          await access(filePath)
        } catch {
          continue
        }
        const text = await readFile(filePath, "utf8")
        if (text.includes("spec-apply")) {
          expect(issueNumber).toBe("196")
        }
      }
    }
  })

  test("[20] 実装スキルに spec-apply は無く正本反映の手順は残る", async () => {
    const skill = await readFile(
      path.join(root, "skills/sdd-cur-implement/SKILL.md"),
      "utf8",
    )
    expect(skill).not.toContain("spec-apply")
    expect(skill).toContain(canonicalReflectProcedure)
  })

  test("[20] 実装作成役は正本へ反映する手順のまま", async () => {
    const author = await readFile(
      path.join(root, "agents/sdd-cur-implement-author.md"),
      "utf8",
    )
    expect(author).not.toContain("spec-apply")
    expect(author).toContain(canonicalReflectProcedure)
  })

  test("[16] validateCanonicalDelta の違反文言は既存のまま", () => {
    const addMd = `# 題

## 正本への差分

### 追加 spec REQ-1

本文
`
    expect(validateCanonicalDelta(addMd, ["REQ-1"])).toEqual([
      "追加する識別子が正本にあります: REQ-1",
    ])
    const changeMd = `# 題

## 正本への差分

### 変更 spec REQ-2

本文
`
    expect(validateCanonicalDelta(changeMd, [])).toEqual([
      "変更する識別子が正本にありません: REQ-2",
    ])
    const removeMd = `# 題

## 正本への差分

### 削除 spec REQ-3

本文
`
    expect(validateCanonicalDelta(removeMd, [])).toEqual([
      "削除する識別子が正本にありません: REQ-3",
    ])
  })

  test("[17] cmdSpecDiff の出力と終了コードの形は変わらない", () => {
    const cli = readFileSync(cliPath, "utf8")
    const block = cli.slice(
      cli.indexOf("async function cmdSpecDiff"),
      cli.indexOf("async function cmdSpecApply"),
    )
    expect(block).toContain("await specDiff({")
    expect(block).toContain("for (const line of lines)")
    expect(block).toContain("console.error(line)")
    expect(block).toContain("return lines.length > 0 ? 1 : 0")
    expect(block).not.toContain("specApply")
  })
})
