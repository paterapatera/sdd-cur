import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  countMermaidFences,
  formMarkerLine,
  sectionBodies,
  validateSpecForm,
} from "./conventions.ts"

const repoRoot = path.join(import.meta.dir, "..")
const cliPath = path.join(import.meta.dir, "cli.ts")
const conventionsPath = path.join(import.meta.dir, "conventions.ts")
const skillsConventionsPath = path.join(
  repoRoot,
  "skills/sdd-cur/conventions.md",
)
const docsConventionsPath = path.join(repoRoot, "docs/conventions.md")
const sddCanonicalPath = path.join(repoRoot, "docs/canonical/sdd.md")
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
const design170Path = path.join(repoRoot, "docs/issues/170/design.md")
const bunExe = process.execPath

const docsConventionsSha256 =
  "945ea61a9cee5825e57bfe371dc1c8e6bbe341fbad463f6b8758483073c937d2"
const sddCanonicalSha256 =
  "667a212ad7e2eb26543fb191576e8962e041c91b08a1870324eb5a4f13492bbd"
const skillsConventionsWithoutOptionalBlockSha256 =
  "798d75d3d121e192d4a1de3735fd6596ab02eea0f05ff2c6e6894a4852cb0c69"
const shaDesignAuthorWithoutOptionalSection =
  "ba4d23fc803452c17a302283b98f0b3ff5821265ece28461699332d5ea3065a1"
const shaDesignReviewerWithoutOptionalLines =
  "d3052e8fd417223a82ec94f7f2f8400cae87119bfe9842d2e7068db7b20961ca"
const conventionsPrefixSha256 =
  "d0c9c60dc0d4ca43740ddb97220fce3a457eb9447e76be7c875beb538afa4913"

const requiredDesignSectionsLine =
  "印がある設計の必須の節は「受け入れ条件」「範囲外」「決定」「テスト」である。"

const optionalBlockLines = [
  "印がある設計には、任意の節 `## データモデル`、`## インターフェース`、`## 図` を書いてよい。節が無いときは `validate` は失敗しない。節があるときは、本文が空でないことを検査する。",
  "`## 図` があるときは、各本文に Mermaid の囲みコードブロックを一つ以上持つことを検査する。",
  "本文は、見出しの次の行から、行が `## ` で始まる次の行の直前までであり、空白と改行だけなら空である。出現する各節の本文をそれぞれ検査する。",
  "本文が空のときの違反は `節の本文が空です: <節名>` であり、節名はデータモデル、インターフェース、図である。",
  "Mermaid の囲みは、行全体がバッククォート三つの直後に `mermaid` を続けたものと一致する開始行で開き、行全体がバッククォート三つと一致する行で閉じたブロックを一つと数える。行頭の空白は無い。中身が空でも数える。",
  "囲みが無いときの違反は `図に Mermaid の囲みがありません` である。",
] as const

const optionalBlockHead = optionalBlockLines.slice(0, 2).join("\n")
const optionalBlockTail = optionalBlockLines.slice(2).join("\n")
const optionalBlockFull = optionalBlockLines.join("\n")

const designAuthorOptionalLines = [
  "課題がデータの形を足すか変えるとき、`## データモデル` を書く。",
  "`## データモデル` には、足す型や JSON、ファイルの形と、各項目の意味を書く。",
  "課題が外から呼ばれる取り決めを足すか変えるとき、`## インターフェース` を書く。",
  "`## インターフェース` には、サブコマンドの引数、標準入出力、終了コード、関数の型など、外から呼ばれる取り決めを書く。",
  "課題が三つ以上の部品の関係を足すか変えるとき、または処理の順を足すか変えるとき、`## 図` を書く。",
  "`## 図` には、Mermaid の囲みコードブロックで、部品の関係や処理の順を描く。",
  "データの形を足さず、変えないとき、`## データモデル` を書かない。",
  "外から呼ばれる取り決めを足さず、変えないとき、`## インターフェース` を書かない。",
  "三つ以上の部品の関係を足さず、変えないとき、かつ、処理の順を足さず、変えないとき、`## 図` を書かない。",
  "課題の大きさでは、三つの節を書くかを判定しない。",
  "「決定」に二つ以上の案を比べた結論があるとき、`## 検討した案` を書く。",
  "`## 検討した案` には、各案と、選んだか退けたかと、理由を書く。",
  "項目は、「案」「選んだか退けたか」「理由」が分かる一行である。",
  "その一行の記法は、この課題の設計が決めた記法である。",
  "「決定」に二つ以上の案を比べた結論が無いとき、`## 検討した案` を書かない。",
] as const

const designReviewerOptionalLines = [
  "- 三つの節の本文が、同じ設計の「決定」または受け入れ条件と、同じ事項について値、手順、または有無が矛盾する。",
  "- 三つの節が書いていないことだけでは、不合格にしない。",
  "- 節にだけ詳細があることは、食い違いにしない。",
  "- 書く条件を満たさない節があることだけでは、不合格にしない。",
  "- 任意節の過剰は指摘してもよい。",
  "- 「決定」と「検討した案」が、同じ事項について、選んだ案、退けた案、または理由が矛盾する。",
  "- 「決定」に二つ以上の案を比べた結論があるのに `## 検討した案` が無いことだけでは、不合格にしない、指摘してもよい。",
  "- 節にだけ詳細があることは、「決定」との食い違いにしない。",
  "- 書く条件を満たさないのに `## 検討した案` があることだけでは、不合格にしない。",
] as const

const designReviewerOptionalBlock =
  `${designReviewerOptionalLines.join("\n")}\n`

const REQ857_CHANGED_SENTENCE =
  "「仕様の正本」と「要件と設計の形式」へシナリオの規則の文を足すこと、および「要件と設計の形式」へ受け入れ条件 17、受け入れ条件 18、受け入れ条件 41、受け入れ条件 42 で足す文を足すことを除き、これらの節の既存の文は変えない。"
const REQ857_PRE170_SENTENCE =
  "「仕様の正本」と「要件と設計の形式」へシナリオの規則の文を足すことを除き、これらの節の既存の文は変えない。"
const REQ857_SCENARIO_LINE =
  "- シナリオ: 条件: 「仕様の正本」と「要件と設計の形式」へ足したシナリオの規則の文と、任意の三節の規則の文以外の、配る節の既存の文を見る 主体: その文 結果: 一文字も変えない"
const REQ857_SCENARIO_PRE170 =
  "- シナリオ: 条件: 「仕様の正本」と「要件と設計の形式」へ足したシナリオの規則の文以外の、配る節の既存の文を見る 主体: その文 結果: 一文字も変えない"

function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex")
}

function trimLeadingTrailingEmptyLines(text: string): string {
  const lines = text.split("\n")
  while (lines.length > 0 && lines[0] === "") {
    lines.shift()
  }
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop()
  }
  return lines.join("\n")
}

function markdownSectionBody(
  text: string,
  heading: string,
  endHeading: string | null,
): string {
  const startMarker = `## ${heading}`
  const start = text.indexOf(startMarker)
  if (start < 0) {
    throw new Error(`missing section: ${heading}`)
  }
  const bodyStart = text.indexOf("\n", start) + 1
  const end =
    endHeading === null
      ? text.length
      : text.indexOf(`## ${endHeading}`, bodyStart)
  if (end < 0) {
    throw new Error(`missing end section: ${endHeading}`)
  }
  return text.slice(bodyStart, end)
}

function expectLinesInOrder(haystack: string, lines: readonly string[]): void {
  let from = 0
  for (const line of lines) {
    const index = haystack.indexOf(line, from)
    expect(index).toBeGreaterThanOrEqual(0)
    from = index + line.length
  }
}

const kenkyuSkillsLines = [
  "印がある設計には、任意の節 `## 検討した案` を書いてよい。節が無いときは `validate` は失敗しない。節があるときは、本文が空でないことを検査する。",
  "検討した案の本文が空のときの違反は `節の本文が空です: 検討した案` である。",
  "`## 検討した案` の項目は、「案」「選んだか退けたか」「理由」が分かる一行である。一行の記法は、この課題の設計が決めた記法である。",
] as const

function skillsConventionsWithoutOptionalBlocks(text: string): string {
  let out = text.replace(`\n${optionalBlockHead}\n`, "\n")
  out = out.replace(`\n\n${kenkyuSkillsLines[0]}\n`, "\n")
  out = out.replace(`\n\n${optionalBlockTail}\n`, "\n")
  out = out.replace(
    `\n\n${kenkyuSkillsLines[1]}\n${kenkyuSkillsLines[2]}\n`,
    "\n",
  )
  return out
}

function reqBodyInCanonical(canonical: string, id: string): string {
  const marker = `## ${id}`
  const lines = canonical.split("\n")
  const idx = lines.findIndex((line) => line === marker)
  if (idx < 0) {
    throw new Error(`${marker} が無い`)
  }
  const bodyLines: string[] = []
  for (let i = idx + 1; i < lines.length; i++) {
    if (/^## REQ-/.test(lines[i])) {
      break
    }
    bodyLines.push(lines[i])
  }
  return trimLeadingTrailingEmptyLines(bodyLines.join("\n"))
}

function design170DeltaItemBody(
  design: string,
  kind: "追加" | "変更",
  domain: string,
  id: string,
): string {
  const start = design.indexOf("## 正本への差分")
  if (start < 0) {
    throw new Error("missing 正本への差分")
  }
  const section = design.slice(start)
  const pattern = new RegExp(
    `### ${kind} ${domain} ${id}\\n\\n([\\s\\S]*?)(?=\\n### |\\n## |$)`,
  )
  const match = section.match(pattern)
  if (!match) {
    throw new Error(`missing delta item: ${kind} ${domain} ${id}`)
  }
  return trimLeadingTrailingEmptyLines(match[1])
}

function conventionsPrefixBytesForSha(text: string): string {
  const marker = "\n\n## REQ-909\n"
  const index = text.indexOf(marker)
  if (index < 0) {
    throw new Error("missing REQ-909 marker in conventions.md")
  }
  let prefix = `${text.slice(0, index)}\n`
  prefix = prefix.replace(REQ857_CHANGED_SENTENCE, REQ857_PRE170_SENTENCE)
  prefix = prefix.replace(
    `\n${REQ857_SCENARIO_LINE}\n`,
    `\n${REQ857_SCENARIO_PRE170}\n`,
  )
  return prefix
}

function minimalDesign170(
  options: {
    marker?: boolean
    extraSections?: string
    delta?: string
    acceptance?: string
  } = {},
): string {
  const withMarker = options.marker !== false
  const head = withMarker
    ? `# 170 題\n${formMarkerLine}\n`
    : `# 170 題\n`
  const acceptance =
    options.acceptance ?? "- 1. 条件: c 主体: s 結果: r\n"
  const extra = options.extraSections ?? ""
  const delta = options.delta ?? ""
  const deltaSection =
    delta.length > 0 ? `## 正本への差分\n\n${delta}` : ""
  return `${head}## 受け入れ条件
${acceptance}## 範囲外

## 決定

${extra}## 作業の一覧
- 1. 実装。[1]
## テスト
- [1]

${deltaSection}`
}

function markedRequirements170(extra = ""): string {
  return `# 170 題
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
  const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-170-"))
  try {
    await fn(temp)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

async function writeIssue170(
  temp: string,
  files: { requirements?: string; design?: string },
): Promise<void> {
  const specDir = path.join(temp, "docs", "issues", "170")
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

describe("issue 170 optional sections and validate", () => {
  test("[1][2][3][11][12] 三つの任意の節が無い最小骨格", async () => {
    const design = minimalDesign170()
    const violations = validateSpecForm("design", design)
    expect(violations).toEqual([])
    for (const name of ["データモデル", "インターフェース", "図"]) {
      expect(
        violations.some((v) => v === `必須の節がありません: ${name}`),
      ).toBe(false)
    }
    const missing = validateSpecForm(
      "design",
      `# 170 題\n${formMarkerLine}\n`,
    )
    for (const section of ["受け入れ条件", "範囲外", "決定", "テスト"]) {
      expect(missing).toContain(`必須の節がありません: ${section}`)
    }
    for (const name of ["データモデル", "インターフェース", "図"]) {
      expect(missing).not.toContain(`必須の節がありません: ${name}`)
    }

    await withTemp(async (temp) => {
      await writeIssue170(temp, { design })
      const { env } = await makeGitStub(temp)
      const { exitCode } = await runValidate(temp, "170", env)
      expect(exitCode).toBe(0)
    })
  })

  test("[9] 設計に印が無いとき三つの節を見ない", async () => {
    const design = minimalDesign170({
      marker: false,
      extraSections: `## データモデル

## インターフェース

## 図

`,
    })
    expect(validateSpecForm("design", design)).toEqual([])

    await withTemp(async (temp) => {
      await writeIssue170(temp, { design })
      const { env } = await makeGitStub(temp)
      const { exitCode } = await runValidate(temp, "170", env)
      expect(exitCode).toBe(0)
    })
  })

  test("[10] 印がある要件に三つの節があっても失敗しない", async () => {
    const req = markedRequirements170(`## データモデル
x
## インターフェース
y
## 図
z
`)
    expect(validateSpecForm("requirements", req)).toEqual([])

    const design = minimalDesign170()
    await withTemp(async (temp) => {
      await writeIssue170(temp, { requirements: req, design })
      const { env } = await makeGitStub(temp)
      const { exitCode } = await runValidate(temp, "170", env)
      expect(exitCode).toBe(0)
    })
  })

  test("[13][14] 曖昧な語と受け入れ条件の形は変えない", () => {
    const base = minimalDesign170({
      acceptance: "- 01. 条件: c 主体: s 結果: r\n",
    })
    const shapeOnly = validateSpecForm("design", base).filter((v) =>
      v.startsWith("受け入れ条件の形が不正"),
    )
    expect(shapeOnly).toHaveLength(1)

    const withOptional = minimalDesign170({
      acceptance: "- 01. 条件: c 主体: s 結果: r\n",
      extraSections: `## データモデル
本文
`,
    })
    const shapeWithOptional = validateSpecForm("design", withOptional).filter(
      (v) => v.startsWith("受け入れ条件の形が不正"),
    )
    expect(shapeWithOptional).toEqual(shapeOnly)

    const amb = minimalDesign170({
      acceptance: "- 1. 条件: 不適切に 主体: s 結果: r\n",
    })
    expect(validateSpecForm("design", amb)).toContain(
      "曖昧な語があります: 適切に",
    )
    const ambWithSection = minimalDesign170({
      acceptance: "- 1. 条件: 不適切に 主体: s 結果: r\n",
      extraSections: `## インターフェース
定義
`,
    })
    expect(validateSpecForm("design", ambWithSection)).toContain(
      "曖昧な語があります: 適切に",
    )
  })

  test("[16] 節の有無は行全体が見出しと一致する行で決まる", () => {
    const exact = minimalDesign170({
      extraSections: `## データモデル
   
`,
    })
    expect(validateSpecForm("design", exact)).toContain(
      "節の本文が空です: データモデル",
    )

    const notExact = minimalDesign170({
      extraSections: `## データモデル 
   
`,
    })
    expect(
      validateSpecForm("design", notExact).some((v) =>
        v.includes("データモデル"),
      ),
    ).toBe(false)
  })

  test("[15] 三つの節の検査は validateSpecForm にある", () => {
    const conventions = readFileSync(conventionsPath, "utf8")
    const cli = readFileSync(cliPath, "utf8")
    expect(conventions).toContain("collectOptionalBasicSectionViolations")
    expect(conventions).toContain("collectOptionalDiagramSectionViolations")
    expect(conventions).toContain("countMermaidFences")
    expect(cli).not.toContain("節の本文が空です")
    expect(cli).not.toContain("図に Mermaid の囲みがありません")
    expect(cli).toMatch(
      /import\s*\{[^}]*validateSpecForm[^}]*\}\s*from\s*["']\.\/conventions\.ts["']/,
    )
  })
})

// 作業 10
describe("issue 170 data model and interface sections", () => {
  test("[4] データモデルだけ空本文", async () => {
    const design = minimalDesign170({
      extraSections: `## データモデル
   
`,
    })
    const violations = validateSpecForm("design", design)
    expect(violations).toEqual(["節の本文が空です: データモデル"])

    await withTemp(async (temp) => {
      await writeIssue170(temp, { design })
      const { env } = await makeGitStub(temp)
      const { exitCode } = await runValidate(temp, "170", env)
      expect(exitCode).toBe(1)
    })
  })

  test("[5] インターフェースだけ空本文", () => {
    const design = minimalDesign170({
      extraSections: `## インターフェース

`,
    })
    expect(validateSpecForm("design", design)).toEqual([
      "節の本文が空です: インターフェース",
    ])
  })

  test("[34][35] 本文の切り出しは sectionBodies と同じ", () => {
    const design = minimalDesign170({
      extraSections: `## データモデル
次の行

## インターフェース
   
`,
    })
    const bodies = sectionBodies(design, "データモデル")
    expect(bodies).toHaveLength(1)
    expect(bodies[0]).toBe("次の行\n")
    expect(validateSpecForm("design", design)).toContain(
      "節の本文が空です: インターフェース",
    )
    expect(
      validateSpecForm("design", design).filter((v) =>
        v.includes("データモデル"),
      ),
    ).toHaveLength(0)
  })

  test("[36] データモデル見出しが二つとも空", () => {
    const design = minimalDesign170({
      extraSections: `## データモデル

## データモデル
   
`,
    })
    const violations = validateSpecForm("design", design).filter(
      (v) => v === "節の本文が空です: データモデル",
    )
    expect(violations).toHaveLength(2)
  })
})

// 作業 11
describe("issue 170 diagram section", () => {
  test("[6][48] 図だけ空本文", () => {
    const design = minimalDesign170({
      extraSections: `## 図

`,
    })
    const violations = validateSpecForm("design", design)
    expect(violations).toEqual([
      "節の本文が空です: 図",
      "図に Mermaid の囲みがありません",
    ])
    expect(
      violations.filter((v) => v === "節の本文が空です: 図"),
    ).toHaveLength(1)
  })

  test("[7] 図に本文があり Mermaid が無い", () => {
    const design = minimalDesign170({
      extraSections: `## 図
説明だけ
`,
    })
    expect(validateSpecForm("design", design)).toEqual([
      "図に Mermaid の囲みがありません",
    ])
  })

  test("[38] 図が二つあり一方が空もう一方に囲みが無い", () => {
    const design = minimalDesign170({
      extraSections: `## 図

## 図
テキストのみ
`,
    })
    const violations = validateSpecForm("design", design)
    expect(violations).toEqual([
      "節の本文が空です: 図",
      "図に Mermaid の囲みがありません",
      "図に Mermaid の囲みがありません",
    ])
  })

  test("[39] 行頭空白の mermaid 開始行は数えない", () => {
    const body = `説明
 \`\`\`mermaid
graph LR
\`\`\`
`
    expect(countMermaidFences(body)).toBe(0)
    const design = minimalDesign170({
      extraSections: `## 図
${body}`,
    })
    expect(validateSpecForm("design", design)).toContain(
      "図に Mermaid の囲みがありません",
    )
  })

  test("[8][37][40] Mermaid 囲みが二つと空の囲み", async () => {
    const twoFences = minimalDesign170({
      extraSections: `## 図
\`\`\`mermaid
graph LR
\`\`\`
\`\`\`mermaid
\`\`\`
`,
    })
    expect(validateSpecForm("design", twoFences)).toEqual([])

    await withTemp(async (temp) => {
      await writeIssue170(temp, { design: twoFences })
      const { env } = await makeGitStub(temp)
      const { exitCode } = await runValidate(temp, "170", env)
      expect(exitCode).toBe(0)
    })

    expect(countMermaidFences("```mermaid\n```")).toBe(1)
  })
})

// 作業 12: skills と agents
describe("issue 170 skills and agents", () => {
  test("[17][18][19][20][41][42] skills の塊の置き場所と必須の節", () => {
    const skills = readFileSync(skillsConventionsPath, "utf8")
    expect(skills).toContain(requiredDesignSectionsLine)
    expect(skills).toContain(
      `${requiredDesignSectionsLine}\n\n${optionalBlockHead}`,
    )
    expect(skills).toContain(optionalBlockTail)
    const reqDesignForm = markdownSectionBody(
      skills,
      "要件と設計の形式",
      null,
    )
    expectLinesInOrder(reqDesignForm, optionalBlockLines)
    expect(
      skillsConventionsWithoutOptionalBlocks(skills).includes(
        optionalBlockLines[0],
      ),
    ).toBe(false)
    expect(sha256Hex(skillsConventionsWithoutOptionalBlocks(skills))).toBe(
      skillsConventionsWithoutOptionalBlockSha256,
    )
  })

  test("[21][22][23][24][25][26][27][28][29][43] 設計作成役の任意の節", () => {
    const designAuthor = readFileSync(designAuthorPath, "utf8")
    expect(designAuthor).toContain("## 任意の節")
    const body = markdownSectionBody(designAuthor, "任意の節", "禁止")
    expectLinesInOrder(body, designAuthorOptionalLines)
    const optionalSection170Lines = designAuthorOptionalLines.slice(0, 10)
    const optionalSectionKenkyuLines = designAuthorOptionalLines.slice(10)
    expect(designAuthor).toContain(
      `\n## 任意の節\n\n${optionalSection170Lines.join("\n")}\n\n${optionalSectionKenkyuLines.join("\n")}\n\n## 禁止`,
    )
    expect(
      sha256Hex(
        designAuthor.replace(
          /\n## 任意の節\n\n[\s\S]*?(?=\n## 禁止\n)/,
          "",
        ),
      ),
    ).toBe(shaDesignAuthorWithoutOptionalSection)
  })

  test("[30][31][44][45][46] 設計レビュー役の五行", () => {
    const designReviewer = readFileSync(designReviewerPath, "utf8")
    const anchor = "- 同じ識別子が、その節に二度ある。"
    expect(designReviewer).toContain(anchor)
    expect(designReviewer).toContain(
      `${anchor}\n${designReviewerOptionalBlock}`,
    )
    for (const line of designReviewerOptionalLines) {
      expect(designReviewer).toContain(line)
    }
    expect(
      sha256Hex(designReviewer.replace(designReviewerOptionalBlock, "")),
    ).toBe(shaDesignReviewerWithoutOptionalLines)
  })

  test("[33] docs/conventions.md は変えない", () => {
    const docs = readFileSync(docsConventionsPath, "utf8")
    expect(sha256Hex(docs)).toBe(docsConventionsSha256)
  })

  test("[47] docs/canonical/sdd.md は変えない", () => {
    const sdd = readFileSync(sddCanonicalPath, "utf8")
    expect(sha256Hex(sdd)).toBe(sddCanonicalSha256)
  })
})

// 作業 13: canonical
describe("issue 170 canonical conventions", () => {
  const design = readFileSync(design170Path, "utf8")
  const conventionsCanonical = readFileSync(conventionsCanonicalPath, "utf8")

  test("[32][50] REQ-909 の本文は塊と一致し skills と同じ", () => {
    const expectedDelta = design170DeltaItemBody(
      design,
      "追加",
      "conventions",
      "REQ-909",
    )
    const scenarioLine =
      "- シナリオ: 条件: 印がある設計に三つの任意の節が無い 主体: `validate` 結果: 終了コードを 1 にせず、違反 `必須の節がありません` にデータモデル、インターフェース、図を続けない"
    const actual = reqBodyInCanonical(conventionsCanonical, "REQ-909")
    expect(actual).toBe(expectedDelta)
    const blockInReq = trimLeadingTrailingEmptyLines(
      actual
        .replace(/^もとになった課題は #\d+ である。\n\n/, "")
        .replace(`\n${scenarioLine}`, ""),
    )
    expect(blockInReq).toBe(optionalBlockFull)
  })

  test("[49] REQ-857 と prefix のバイト列", () => {
    const expected857 = design170DeltaItemBody(
      design,
      "変更",
      "conventions",
      "REQ-857",
    )
    expect(reqBodyInCanonical(conventionsCanonical, "REQ-857")).toBe(
      expected857,
    )
    expect(expected857).toContain(REQ857_CHANGED_SENTENCE)
    expect(sha256Hex(conventionsPrefixBytesForSha(conventionsCanonical))).toBe(
      conventionsPrefixSha256,
    )
  })
})
