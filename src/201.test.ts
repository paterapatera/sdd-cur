import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { formMarkerLine, sectionBodies, validateSpecForm } from "./conventions.ts"

const repoRoot = path.join(import.meta.dir, "..")
const cliPath = path.join(import.meta.dir, "cli.ts")
const conventionsPath = path.join(import.meta.dir, "conventions.ts")
const skillsConventionsPath = path.join(
  repoRoot,
  "skills/sdd-cur/conventions.md",
)
const docsConventionsPath = path.join(repoRoot, "docs/conventions.md")
const conventionsCanonicalPath = path.join(
  repoRoot,
  "docs/canonical/conventions.md",
)
const designAuthorPath = path.join(
  repoRoot,
  "agents/sdd-cur-design-author.md",
)
const designReviewerPath = path.join(
  repoRoot,
  "agents/sdd-cur-design-reviewer.md",
)
const designSkillPath = path.join(repoRoot, "skills/sdd-cur/design.md")
const bunExe = process.execPath

const docsConventionsSha256 =
  "945ea61a9cee5825e57bfe371dc1c8e6bbe341fbad463f6b8758483073c937d2"
const conventionsCanonicalSha256 =
  "e54fbfd7cbdd5c85d4fd5ebfc496a2b27055c7065758f68b743c6f56cbc77a94"
const skillsConventionsWithoutKenkyuSha256 =
  "4f50f5bc97bff3033deac18761c7bc57f99c11cad8370db70dfc8f384dc80d73"
const shaDesignAuthorWithoutKenkyu =
  "0cceb774be0acf95f8adeb94370914e7b447a5692a18267f154a154f0b0ee633"
const shaDesignReviewerWithoutKenkyu =
  "b1beef4718288a7c454ed05aa96fdd618e0d7ba2a3ce752741230afe40863512"
const shaDesignSkillWithoutKenkyu =
  "d323d9336abbdcbc0eca43f24cc5d407c4d4d3d35cdfaf7ee6e254c81968dd85"

const requiredDesignSectionsLine =
  "印がある設計の必須の節は「受け入れ条件」「範囲外」「決定」「テスト」である。"

const diagramMermaidLine =
  "`## 図` があるときは、各本文に Mermaid の囲みコードブロックを一つ以上持つことを検査する。"
const mermaidMissingViolationLine =
  "囲みが無いときの違反は `図に Mermaid の囲みがありません` である。"

const kenkyuBlockLines = [
  "印がある設計には、任意の節 `## 検討した案` を書いてよい。節が無いときは `validate` は失敗しない。節があるときは、本文が空でないことを検査する。",
  "検討した案の本文が空のときの違反は `節の本文が空です: 検討した案` である。",
  "`## 検討した案` の項目は、「案」「選んだか退けたか」「理由」が分かる一行である。一行の記法は、この課題の設計が決めた記法である。",
] as const

const designAuthorKenkyuLines = [
  "「決定」に二つ以上の案を比べた結論があるとき、`## 検討した案` を書く。",
  "`## 検討した案` には、各案と、選んだか退けたかと、理由を書く。",
  "項目は、「案」「選んだか退けたか」「理由」が分かる一行である。",
  "その一行の記法は、この課題の設計が決めた記法である。",
  "「決定」に二つ以上の案を比べた結論が無いとき、`## 検討した案` を書かない。",
] as const

const designReviewerKenkyuLines = [
  "- 「決定」と「検討した案」が、同じ事項について、選んだ案、退けた案、または理由が矛盾する。",
  "- 「決定」に二つ以上の案を比べた結論があるのに `## 検討した案` が無いことだけでは、不合格にしない、指摘してもよい。",
  "- 節にだけ詳細があることは、「決定」との食い違いにしない。",
  "- 書く条件を満たさないのに `## 検討した案` があることだけでは、不合格にしない。",
] as const

const designSkillKenkyuLines = [
  "設計作成役は、「決定」に二つ以上の案を比べた結論があるとき、`## 検討した案` に、各案と、選んだか退けたかと、理由を書く。",
  "「決定」に二つ以上の案を比べた結論が無いとき、`## 検討した案` を書かない。",
] as const

function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex")
}

function expectLinesInOrder(haystack: string, lines: readonly string[]): void {
  let from = 0
  for (const line of lines) {
    const index = haystack.indexOf(line, from)
    expect(index).toBeGreaterThanOrEqual(0)
    from = index + line.length
  }
}

function skillsConventionsWithoutKenkyu(text: string): string {
  let out = text.replace(
    `\n\n${kenkyuBlockLines[0]}\n`,
    "\n",
  )
  out = out.replace(
    `\n\n${kenkyuBlockLines[1]}\n${kenkyuBlockLines[2]}\n`,
    "\n",
  )
  return out
}

function designAuthorWithoutKenkyu(text: string): string {
  const block = `\n\n${designAuthorKenkyuLines.join("\n")}\n\n`
  return text.replace(block, "\n\n")
}

function designReviewerWithoutKenkyu(text: string): string {
  let out = text
  for (const line of designReviewerKenkyuLines) {
    out = out.replace(`${line}\n`, "")
  }
  return out
}

function designSkillWithoutKenkyu(text: string): string {
  const block = `\n\n${designSkillKenkyuLines.join("\n")}\n`
  return text.replace(block, "\n")
}

function minimalDesign201(
  options: {
    marker?: boolean
    extraSections?: string
    acceptance?: string
  } = {},
): string {
  const withMarker = options.marker !== false
  const head = withMarker
    ? `# 201 題\n${formMarkerLine}\n`
    : `# 201 題\n`
  const acceptance =
    options.acceptance ?? "- 1. 条件: c 主体: s 結果: r\n"
  const extra = options.extraSections ?? ""
  return `${head}## 受け入れ条件
${acceptance}## 範囲外
- [1]
## 決定
- [1]
${extra}## 作業の一覧
- 1. 実装。[1]
## テスト
- [1]

## 正本への差分

項目が無いときは、正本を変えない。`
}

function markedRequirements201(extra = ""): string {
  return `# 201 題
${formMarkerLine}
## 受け入れ条件
- 1. 条件: c 主体: s 結果: r
${extra}`
}

async function makeGitStub(
  temp: string,
): Promise<{ env: Record<string, string | undefined> }> {
  const gitDir = path.join(temp, "bin")
  await mkdir(gitDir, { recursive: true })
  const script = `#!/usr/bin/env bun
if (process.argv[2] !== undefined && process.argv[2].startsWith("main:")) {
  process.exit(1)
}
process.exit(2)
`
  await writeFile(path.join(gitDir, "git"), script)
  return {
    env: {
      ...process.env,
      PATH: `${gitDir}:${process.env.PATH ?? ""}`,
    },
  }
}

async function runValidate(
  cwd: string,
  issueNumber: string,
  env: Record<string, string | undefined>,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([bunExe, cliPath, "validate", issueNumber], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env,
  })
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  return { exitCode: await proc.exited, stdout, stderr }
}

async function withTemp(
  fn: (temp: string) => Promise<void>,
): Promise<void> {
  const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-201-"))
  try {
    await fn(temp)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

async function writeIssue201(
  temp: string,
  files: { requirements?: string; design?: string },
): Promise<void> {
  const specDir = path.join(temp, "docs", "issues", "201")
  await mkdir(specDir, { recursive: true })
  if (files.requirements !== undefined) {
    await writeFile(
      path.join(specDir, "requirements.md"),
      files.requirements,
    )
  }
  if (files.design !== undefined) {
    await writeFile(path.join(specDir, "design.md"), files.design)
  }
}

describe("issue 201 検討した案 optional section", () => {
  test("[1][2][11] 節が無い最小骨格", async () => {
    const design = minimalDesign201()
    const violations = validateSpecForm("design", design)
    expect(violations).toEqual([])
    expect(
      violations.some((v) => v === "必須の節がありません: 検討した案"),
    ).toBe(false)

    await withTemp(async (temp) => {
      await writeIssue201(temp, { design })
      const { env } = await makeGitStub(temp)
      const { exitCode } = await runValidate(temp, "201", env)
      expect(exitCode).toBe(0)
    })
  })

  test("[8] 設計に印が無いとき検討した案を見ない", () => {
    const design = minimalDesign201({
      marker: false,
      extraSections: `## 検討した案

`,
    })
    expect(validateSpecForm("design", design)).toEqual([])
  })

  test("[9] 要件では検討した案を見ない", () => {
    const req = markedRequirements201(`## 検討した案

`)
    expect(validateSpecForm("requirements", req)).toEqual([])
  })

  test("[10] 必須の節は四つ", () => {
    const missing = validateSpecForm(
      "design",
      `# 201 題\n${formMarkerLine}\n`,
    )
    for (const section of ["受け入れ条件", "範囲外", "決定", "テスト"]) {
      expect(missing).toContain(`必須の節がありません: ${section}`)
    }
    for (const name of ["検討した案", "データモデル", "インターフェース", "図"]) {
      expect(missing).not.toContain(`必須の節がありません: ${name}`)
    }
  })

  test("[3][4][5] 検討した案だけ空本文", () => {
    const design = minimalDesign201({
      extraSections: `## 検討した案
   
`,
    })
    const bodies = sectionBodies(design, "検討した案")
    expect(bodies).toHaveLength(1)
    expect(bodies[0].replace(/\s/g, "")).toBe("")
    const violations = validateSpecForm("design", design)
    expect(violations).toEqual(["節の本文が空です: 検討した案"])
    expect(violations).not.toContain("図に Mermaid の囲みがありません")
  })

  test("[6] 重複見出しの一方が空", () => {
    const design = minimalDesign201({
      extraSections: `## 検討した案
- 案: A 判定: 採用 理由: r
## 検討した案

`,
    })
    const violations = validateSpecForm("design", design).filter(
      (v) => v === "節の本文が空です: 検討した案",
    )
    expect(violations.length).toBeGreaterThanOrEqual(1)
  })

  test("[7] 本文あり記法違いでも失敗しない", () => {
    const design = minimalDesign201({
      extraSections: `## 検討した案
自由形式の一行
`,
    })
    expect(validateSpecForm("design", design)).toEqual([])
  })

  test("[12] データモデル空は従来どおり", () => {
    const design = minimalDesign201({
      extraSections: `## データモデル

`,
    })
    expect(validateSpecForm("design", design)).toContain(
      "節の本文が空です: データモデル",
    )
  })

  test("[13] validateSpecForm と cli", () => {
    const conventions = readFileSync(conventionsPath, "utf8")
    const cli = readFileSync(cliPath, "utf8")
    expect(conventions).toContain('"検討した案"')
    expect(conventions.indexOf('"検討した案"')).toBeGreaterThan(
      conventions.indexOf('"インターフェース"'),
    )
    expect(conventions).toContain("collectOptionalBasicSectionViolations")
    expect(cli).not.toContain("節の本文が空です: 検討した案")
    expect(cli).toMatch(
      /import\s*\{[^}]*validateSpecForm[^}]*\}\s*from\s*["']\.\/conventions\.ts["']/,
    )
  })
})

describe("issue 201 skills agents and docs", () => {
  test("[14][15] skills conventions 検討した案の塊", () => {
    const skills = readFileSync(skillsConventionsPath, "utf8")
    expect(skills).toContain(requiredDesignSectionsLine)
    expect(skills).toContain(
      `${diagramMermaidLine}\n\n${kenkyuBlockLines[0]}`,
    )
    expect(skills).toContain(
      `${mermaidMissingViolationLine}\n\n${kenkyuBlockLines[1]}\n${kenkyuBlockLines[2]}`,
    )
    expectLinesInOrder(skills, kenkyuBlockLines)
    expect(sha256Hex(skillsConventionsWithoutKenkyu(skills))).toBe(
      skillsConventionsWithoutKenkyuSha256,
    )
  })

  test("[16][17][21] 設計作成役", () => {
    const designAuthor = readFileSync(designAuthorPath, "utf8")
    const anchor = "課題の大きさでは、三つの節を書くかを判定しない。"
    expect(designAuthor).toContain(
      `${anchor}\n\n${designAuthorKenkyuLines.join("\n")}\n\n## 禁止`,
    )
    expectLinesInOrder(designAuthor, designAuthorKenkyuLines)
    expect(sha256Hex(designAuthorWithoutKenkyu(designAuthor))).toBe(
      shaDesignAuthorWithoutKenkyu,
    )
  })

  test("[18][23][24][25][26] 設計レビュー役", () => {
    const designReviewer = readFileSync(designReviewerPath, "utf8")
    const anchor = "- 任意節の過剰は指摘してもよい。"
    expect(designReviewer).toContain(anchor)
    expectLinesInOrder(designReviewer, designReviewerKenkyuLines)
    expect(
      sha256Hex(designReviewerWithoutKenkyu(designReviewer)),
    ).toBe(shaDesignReviewerWithoutKenkyu)
    expect(designReviewer).toContain(
      "- 三つの節が書いていないことだけでは、不合格にしない。",
    )
  })

  test("[19][22] skills/sdd-cur/design.md", () => {
    const designSkill = readFileSync(designSkillPath, "utf8")
    const anchor = "設計作成役は、既存の正しい見出しは変えない。"
    expect(designSkill).toContain(
      `${anchor}\n\n${designSkillKenkyuLines.join("\n")}\n親は`,
    )
    expectLinesInOrder(designSkill, designSkillKenkyuLines)
    expect(sha256Hex(designSkillWithoutKenkyu(designSkill))).toBe(
      shaDesignSkillWithoutKenkyu,
    )
  })

  test("[20][27] docs は変えない", () => {
    expect(sha256Hex(readFileSync(docsConventionsPath, "utf8"))).toBe(
      docsConventionsSha256,
    )
    expect(
      sha256Hex(readFileSync(conventionsCanonicalPath, "utf8")),
    ).toBe(conventionsCanonicalSha256)
  })
})
