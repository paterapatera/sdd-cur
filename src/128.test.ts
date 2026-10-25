import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { readFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { formMarkerLine, validateSpecForm } from "./conventions.ts"

const repoRoot = path.join(import.meta.dir, "..")
const cliPath = path.join(import.meta.dir, "cli.ts")
const conventionsPath = path.join(import.meta.dir, "conventions.ts")
const skillsConventionsPath = path.join(
  repoRoot,
  "skills/sdd-cur/conventions.md",
)
const docsConventionsPath = path.join(repoRoot, "docs/conventions.md")
const bunExe = process.execPath

const sevenScenarioRuleLines = [
  "シナリオの一行は、行全体が `- シナリオ: 条件: <条件> 主体: <主体> 結果: <結果>` である。",
  "`<条件>` と `<主体>` と `<結果>` は、それぞれ空白以外の文字を含む。",
  "追加と変更の項目の本文には、その一行が一つ以上ある。",
  "シナリオは見出しにしない。",
  "印がある設計で、追加または変更の項目にその一行が無いと、`validate` は失敗する。",
  "既存の要求は、変更されるときにだけシナリオを足し、一括では書き換えない。",
  "削除の項目にはシナリオを要しない。",
] as const

const sevenScenarioRuleBlock = `${sevenScenarioRuleLines.join("\n")}\n`

const skillsConventionsWithoutScenarioBlockSha256 =
  "49cd23fb97a3a270cdcf9da18031e184168784c8e6201a6d62b76dd9fcbdab51"

const docsConventionsSha256 =
  "945ea61a9cee5825e57bfe371dc1c8e6bbe341fbad463f6b8758483073c937d2"

const acceptanceCriterionItemLine =
  "受け入れ条件の項目は、`- <番号>. 条件: <条件> 主体: <主体> 結果: <結果>` の一行である。"

function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex")
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

function skillsConventionsWithoutScenarioBlocks(text: string): string {
  const toRemove = `\n${sevenScenarioRuleBlock}`
  return text.replaceAll(toRemove, "")
}

const agentScenarioTwoLines = `追加と変更の項目の本文には、行全体が \`- シナリオ: 条件: <条件> 主体: <主体> 結果: <結果>\` であり、\`<条件>\` と \`<主体>\` と \`<結果>\` がそれぞれ空白以外の文字を含む一行が、一つ以上ある。
その一行は見出しにしない。
`

const agentReviewerScenarioFourLines = `- 追加または変更の項目の本文に、行全体が \`- シナリオ: 条件: <条件> 主体: <主体> 結果: <結果>\` であり、\`<条件>\` と \`<主体>\` と \`<結果>\` がそれぞれ空白以外の文字を含む一行が、一つも無い。
追加と変更の項目の本文には、その一行が一つ以上ある。
- シナリオの一行を見出しにしている。
その一行は見出しにしない。
`

const shaDesignAuthorWithoutScenarioLines =
  "907fc9f5fcf8b557520bc41afbd539cb7c832d9e410fe9ee1b89a79db6647884"
const shaDesignReviewerWithoutScenarioLines =
  "f4089d99ee8b169f886a39b52659882bb8522f33f1fd292528c49cfd434443a4"
const shaImplementReviewerWithoutScenarioLines =
  "95b7bac0833a8cd06b8afb455a711b7be650f625752ac6efd73da90d2f1330d1"

const design128Path = path.join(repoRoot, "docs/issues/128/design.md")
const design170Path = path.join(repoRoot, "docs/issues/170/design.md")

const optionalBlockTailLines = [
  "本文は、見出しの次の行から、行が `## ` で始まる次の行の直前までであり、空白と改行だけなら空である。出現する各節の本文をそれぞれ検査する。",
  "本文が空のときの違反は `節の本文が空です: <節名>` であり、節名はデータモデル、インターフェース、図である。",
  "Mermaid の囲みは、行全体がバッククォート三つの直後に `mermaid` を続けたものと一致する開始行で開き、行全体がバッククォート三つと一致する行で閉じたブロックを一つと数える。行頭の空白は無い。中身が空でも数える。",
  "囲みが無いときの違反は `図に Mermaid の囲みがありません` である。",
  "検討した案の本文が空のときの違反は `節の本文が空です: 検討した案` である。",
  "`## 検討した案` の項目は、「案」「選んだか退けたか」「理由」が分かる一行である。一行の記法は、この課題の設計が決めた記法である。",
] as const
const optionalBlockTail = `${optionalBlockTailLines.slice(0, 4).join("\n")}\n\n${optionalBlockTailLines.slice(4).join("\n")}`

const specPrefixSha256 =
  "d8e36e8b2fe071f3857aeb4ded400708b9caab3153ce5c06fcd41bbf6f6331db"

const conventionsPrefixSha256 =
  "9daf3c9cf129f8458e67a5d6184c77f606553de6db1d96e6af9b01ef05f72253"

const unchangedCanonicalSha256: Record<string, string> = {
  "docs/canonical/implement.md":
    "6c83cabd535d7e29c9ac4ed07d342dd4aecbe7c41b020f5d2992943dde3ae9d9",
  "docs/canonical/git.md":
    "a8fbcc9c5fd4ed0b43ab6d511142639a857881389f3531f0d1b0567ace7a72f2",
  "docs/canonical/complete.md":
    "acfe23f933ea0f87c7c54d2708203bfad043557183ae11fe6d644cc9109deec4",
  "docs/canonical/github.md":
    "02f293fd6fd9fdb816dc0471c27d4c529a4b39bdf22362a97f8bd44bdfda5b0e",
  "docs/canonical/labels.md":
    "6c0d68a701f34de8cc796ff7e0a73f7b275fc4e83e0a89bb65e224b564f64875",
  "docs/canonical/install.md":
    "6436bf0febca526ad93286d0edf00588bbbcd9513f450c536d0801f4865aab49",
  "docs/canonical/docs.md":
    "bff55c12ce5fa5cc354a0e946d4382b6838341798d7e56297482c2dd7d7c4704",
  "docs/canonical/init.md":
    "a4d5b9b20e69e86155c0926b8e31ba987d120c6a5f5c5cc2fc12b8c8b7825891",
}

const REQ857_SCENARIO_LINE =
  "- シナリオ: 条件: 「仕様の正本」と「要件と設計の形式」へ足したシナリオの規則の文と、任意の三節の規則の文以外の、配る節の既存の文を見る 主体: その文 結果: 一文字も変えない"

const REQ857_CHANGED_SENTENCE =
  "「仕様の正本」と「要件と設計の形式」へシナリオの規則の文を足すこと、および「要件と設計の形式」へ受け入れ条件 17、受け入れ条件 18、受け入れ条件 41、受け入れ条件 42 で足す文を足すことを除き、これらの節の既存の文は変えない。"

const REQ857_CHANGED_SENTENCE_128 =
  "「仕様の正本」と「要件と設計の形式」へシナリオの規則の文を足すことを除き、これらの節の既存の文は変えない。"

const REQ857_SCENARIO_LINE_128 =
  "- シナリオ: 条件: 「仕様の正本」と「要件と設計の形式」へ足したシナリオの規則の文以外の、配る節の既存の文を見る 主体: その文 結果: 一文字も変えない"

const REQ857_ORIGINAL_SENTENCE = "これらの節の文言は変えない。"

const ENGLISH_KEYWORDS = ["WHEN", "THEN", "SHALL"] as const

function sha256Utf8(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex")
}

function specPrefixBytesForSha(text: string): string {
  const marker = "\n\n## REQ-906\n"
  const index = text.indexOf(marker)
  if (index < 0) {
    throw new Error("missing REQ-906 marker in spec.md")
  }
  return `${text.slice(0, index)}\n`
}

function conventionsPrefixBytesForSha(text: string): string {
  const marker = "\n\n## REQ-907\n"
  const index = text.indexOf(marker)
  if (index < 0) {
    throw new Error("missing REQ-907 marker in conventions.md")
  }
  let prefix = `${text.slice(0, index)}\n`
  prefix = prefix.replace(REQ857_CHANGED_SENTENCE, REQ857_ORIGINAL_SENTENCE)
  prefix = prefix.replace(REQ857_CHANGED_SENTENCE_128, REQ857_ORIGINAL_SENTENCE)
  prefix = prefix.replace(`\n${REQ857_SCENARIO_LINE}\n`, "\n")
  prefix = prefix.replace(`\n${REQ857_SCENARIO_LINE_128}\n`, "\n")
  return prefix
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

function design128DeltaSection(design: string): string {
  const start = design.indexOf("## 正本への差分")
  if (start < 0) {
    throw new Error("missing 正本への差分")
  }
  return design.slice(start)
}

function design128DeltaItemBody(
  design: string,
  kind: "追加" | "変更",
  domain: string,
  id: string,
): string {
  const section = design128DeltaSection(design)
  const pattern = new RegExp(
    `### ${kind} ${domain} ${id}\\n\\n([\\s\\S]*?)(?=\\n### |$)`,
  )
  const match = section.match(pattern)
  if (!match) {
    throw new Error(`missing delta item: ${kind} ${domain} ${id}`)
  }
  return trimLeadingTrailingEmptyLines(match[1])
}

function assertNoEnglishKeywords(text: string): void {
  for (const keyword of ENGLISH_KEYWORDS) {
    expect(text).not.toContain(keyword)
  }
}

function hasScenarioLine(body: string): boolean {
  return body
    .split("\n")
    .some((line) => line.startsWith("- シナリオ: 条件:"))
}

const validScenarioLine =
  "- シナリオ: 条件: 見る 主体: 項目 結果: 残る"

function designWithDelta(
  delta: string,
  options?: { marker?: boolean },
): string {
  const withMarker = options?.marker !== false
  const head = withMarker
    ? `# 128 題\n${formMarkerLine}\n`
    : `# 128 題\n`
  return `${head}## 受け入れ条件
- 1. 条件: c 主体: s 結果: r
## 範囲外

## 決定

## 作業の一覧
- 1. 実装。[1]
## テスト
- [1]

## 正本への差分

${delta}`
}

function markedRequirementsWithDelta(delta: string): string {
  return `# 128 題
${formMarkerLine}
## 受け入れ条件
- 1. 条件: c 主体: s 結果: r

## 正本への差分

${delta}`
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
  const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-128-"))
  try {
    await fn(temp)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

async function writeIssue128(
  temp: string,
  files: { requirements?: string; design?: string },
): Promise<void> {
  const specDir = path.join(temp, "docs", "issues", "128")
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

describe("issue 128 scenario validation", () => {
  test("[1][2][3] シナリオの一行の認識", () => {
    const withValid = designWithDelta(
      `### 追加 spec REQ-1

本文です。
${validScenarioLine}
`,
    )
    expect(
      validateSpecForm("design", withValid).some((v) =>
        v.startsWith("シナリオがありません"),
      ),
    ).toBe(false)

    const invalidOnly = designWithDelta(
      `### 追加 spec REQ-1

- シナリオ: 条件:    主体: x 結果: y
 ${validScenarioLine}
### シナリオ
`,
    )
    expect(validateSpecForm("design", invalidOnly)).toContain(
      "シナリオがありません: REQ-1",
    )
  })

  test("[5] シナリオが無い追加または変更は違反と終了コード 1", async () => {
    const missing = designWithDelta(
      `### 追加 spec REQ-1

本文にシナリオの一行が無い。
`,
    )
    expect(validateSpecForm("design", missing)).toContain(
      "シナリオがありません: REQ-1",
    )

    await withTemp(async (temp) => {
      const okReq = `# 128 題
${formMarkerLine}
## 受け入れ条件
- 1. 条件: c 主体: s 結果: r
`
      await writeIssue128(temp, { requirements: okReq, design: missing })
      const { env } = await makeGitStub(temp)
      const { exitCode, stdout, stderr } = await runValidate(temp, "128", env)
      expect(exitCode).toBe(1)
      expect(stdout).toBe("")
      expect(stderr).toContain("シナリオがありません: REQ-1")
    })
  })

  test("[6] 判定の置き場所は src/conventions.ts", () => {
    const conventions = readFileSync(conventionsPath, "utf8")
    const cli = readFileSync(cliPath, "utf8")
    expect(conventions).toContain("シナリオがありません")
    expect(cli).not.toContain("シナリオがありません")
    expect(cli).toMatch(
      /import\s*\{[^}]*validateSpecForm[^}]*\}\s*from\s*["']\.\/conventions\.ts["']/,
    )
  })

  test("[7] 削除だけシナリオが無くても失敗しない", async () => {
    const design = designWithDelta(
      `### 削除 spec REQ-2

削除の本文。シナリオは無い。

### 追加 spec REQ-1

追加の本文。
${validScenarioLine}
`,
    )
    expect(
      validateSpecForm("design", design).some((v) =>
        v.includes("シナリオがありません"),
      ),
    ).toBe(false)

    await withTemp(async (temp) => {
      const okReq = `# 128 題
${formMarkerLine}
## 受け入れ条件
- 1. 条件: c 主体: s 結果: r
`
      await writeIssue128(temp, { requirements: okReq, design })
      const { env } = await makeGitStub(temp)
      const { exitCode } = await runValidate(temp, "128", env)
      expect(exitCode).toBe(0)
    })
  })

  test("[8] 印が無い設計はシナリオを見ない", async () => {
    const design = designWithDelta(
      `### 追加 spec REQ-1

シナリオの一行が無い。
`,
      { marker: false },
    )
    expect(validateSpecForm("design", design)).toEqual([])

    await withTemp(async (temp) => {
      await writeIssue128(temp, { design })
      const { env } = await makeGitStub(temp)
      const { exitCode } = await runValidate(temp, "128", env)
      expect(exitCode).toBe(0)
    })
  })

  test("[9] 追加も変更も無い印がある設計", async () => {
    const design = designWithDelta(
      `### 削除 spec REQ-1

削除だけ。シナリオは無い。
`,
    )
    expect(
      validateSpecForm("design", design).some((v) =>
        v.includes("シナリオがありません"),
      ),
    ).toBe(false)

    await withTemp(async (temp) => {
      const okReq = `# 128 題
${formMarkerLine}
## 受け入れ条件
- 1. 条件: c 主体: s 結果: r
`
      await writeIssue128(temp, { requirements: okReq, design })
      const { env } = await makeGitStub(temp)
      const { exitCode } = await runValidate(temp, "128", env)
      expect(exitCode).toBe(0)
    })
  })

  test("[10] 要件ファイルはシナリオの有無を見ない", async () => {
    const req = markedRequirementsWithDelta(
      `### 追加 spec REQ-1

要件側の追加。シナリオは無い。
`,
    )
    expect(
      validateSpecForm("requirements", req).some((v) =>
        v.includes("シナリオがありません"),
      ),
    ).toBe(false)

    const design = designWithDelta(
      `### 追加 spec REQ-1

${validScenarioLine}
`,
    )
    await withTemp(async (temp) => {
      await writeIssue128(temp, { requirements: req, design })
      const { env } = await makeGitStub(temp)
      const { exitCode } = await runValidate(temp, "128", env)
      expect(exitCode).toBe(0)
    })
  })
})

describe("issue 128 conventions and acceptance line form", () => {
  test("[12][13][14][15][16][17] 七文が二節に同じ順である", () => {
    const skills = readFileSync(skillsConventionsPath, "utf8")
    const specCanon = markdownSectionBody(
      skills,
      "仕様の正本",
      "レビューが読む範囲",
    )
    const reqDesignForm = markdownSectionBody(
      skills,
      "要件と設計の形式",
      null,
    )
    for (const section of [specCanon, reqDesignForm]) {
      expectLinesInOrder(section, sevenScenarioRuleLines)
    }
    expect(skills.trimEnd()).toBe(
      `${skills.slice(0, skills.lastIndexOf(sevenScenarioRuleLines[0])).trimEnd()}\n\n${sevenScenarioRuleBlock.trimEnd()}\n\n${optionalBlockTail}`,
    )
  })

  test("[18] 七文の塊を除いた skills/sdd-cur/conventions.md の SHA-256", () => {
    const skills = readFileSync(skillsConventionsPath, "utf8")
    const stripped = skillsConventionsWithoutScenarioBlocks(skills)
    expect(sha256Hex(stripped)).toBe(skillsConventionsWithoutScenarioBlockSha256)
    expect(skills.split(`\n${sevenScenarioRuleBlock}`).length - 1).toBe(2)
  })

  test("[19] docs/conventions.md は変えない", () => {
    const docs = readFileSync(docsConventionsPath, "utf8")
    expect(sha256Hex(docs)).toBe(docsConventionsSha256)
  })

  test("[30] 受け入れ条件の一行の形", () => {
    const skills = readFileSync(skillsConventionsPath, "utf8")
    const reqDesignForm = markdownSectionBody(
      skills,
      "要件と設計の形式",
      null,
    )
    expect(
      reqDesignForm
        .split("\n")
        .some((line) => line.startsWith(acceptanceCriterionItemLine)),
    ).toBe(true)
  })
})

describe("issue 128 agent scenario rules", () => {
  test("[20][21][22][23][24][25][31][32][33] 三役への追記と残す定め", () => {
    const designAuthor = readFileSync(
      path.join(repoRoot, "agents/sdd-cur-design-author.md"),
      "utf8",
    )
    const designReviewer = readFileSync(
      path.join(repoRoot, "agents/sdd-cur-design-reviewer.md"),
      "utf8",
    )
    const implementReviewer = readFileSync(
      path.join(repoRoot, "agents/sdd-cur-implement-reviewer.md"),
      "utf8",
    )

    const designAuthorAnchor = "項目の本文は、その識別子の要求の内容である。"
    expect(designAuthor).toContain(designAuthorAnchor)
    expect(designAuthor).toContain(
      `${designAuthorAnchor}\n${agentScenarioTwoLines}`,
    )

    const designReviewerAnchor =
      "- 変更または削除の項目に、その識別子の要求の内容が無い。"
    expect(designReviewer).toContain(designReviewerAnchor)
    expect(designReviewer).toContain(
      `${designReviewerAnchor}\n${agentReviewerScenarioFourLines}`,
    )

    const implementReviewerAnchor =
      "追加と変更は、`docs/canonical/<領域>.md` に `## <識別子>` が一つあり、本文が項目の本文と、先頭と末尾の空行を除いて一致する。"
    expect(implementReviewer).toContain(implementReviewerAnchor)
    expect(implementReviewer).toContain(
      `${implementReviewerAnchor}\n${agentScenarioTwoLines}`,
    )

    expect(
      sha256Utf8(designAuthor.replace(agentScenarioTwoLines, "")),
    ).toBe(shaDesignAuthorWithoutScenarioLines)
    expect(
      sha256Utf8(
        designReviewer.replace(agentReviewerScenarioFourLines, ""),
      ),
    ).toBe(shaDesignReviewerWithoutScenarioLines)
    expect(
      sha256Utf8(implementReviewer.replace(agentScenarioTwoLines, "")),
    ).toBe(shaImplementReviewerWithoutScenarioLines)
  })
})

describe("issue 128 canonical bodies and unchanged bytes", () => {
  const design = readFileSync(design128Path, "utf8")
  const design170 = readFileSync(design170Path, "utf8")
  const specCanonical = readFileSync(
    path.join(repoRoot, "docs/canonical/spec.md"),
    "utf8",
  )
  const conventionsCanonical = readFileSync(
    path.join(repoRoot, "docs/canonical/conventions.md"),
    "utf8",
  )

  test("[11][29] 変えないバイト列の SHA-256 と差分の範囲", () => {
    expect(sha256Utf8(specPrefixBytesForSha(specCanonical))).toBe(
      specPrefixSha256,
    )
    expect(sha256Utf8(conventionsPrefixBytesForSha(conventionsCanonical))).toBe(
      conventionsPrefixSha256,
    )
    for (const [filePath, expected] of Object.entries(unchangedCanonicalSha256)) {
      const content = readFileSync(path.join(repoRoot, filePath), "utf8")
      expect(sha256Utf8(content)).toBe(expected)
    }

    const delta = design128DeltaSection(design)
    expect(delta).not.toMatch(/^### 削除 /m)
    const changeHeadings = [
      ...delta.matchAll(/^### 変更 (\w+) (REQ-\d+)$/gm),
    ].map((m) => `${m[1]} ${m[2]}`)
    expect(changeHeadings).toEqual(["conventions REQ-857"])
  })

  test("[26][27] 正本の本文が設計の差分と一致し REQ-857 の定め", () => {
    const items: {
      file: string
      kind: "追加" | "変更"
      domain: string
      id: string
    }[] = [
      { file: "spec.md", kind: "追加", domain: "spec", id: "REQ-906" },
      {
        file: "conventions.md",
        kind: "追加",
        domain: "conventions",
        id: "REQ-907",
      },
      {
        file: "conventions.md",
        kind: "追加",
        domain: "conventions",
        id: "REQ-908",
      },
      { file: "spec.md", kind: "追加", domain: "spec", id: "REQ-909" },
      {
        file: "conventions.md",
        kind: "変更",
        domain: "conventions",
        id: "REQ-857",
      },
    ]
    for (const { file, kind, domain, id } of items) {
      const canonical = readFileSync(
        path.join(repoRoot, "docs/canonical", file),
        "utf8",
      )
      const expected =
        domain === "conventions" && id === "REQ-857"
          ? design128DeltaItemBody(design170, "変更", domain, id)
          : design128DeltaItemBody(design, kind, domain, id)
      const actual = reqBodyInCanonical(canonical, id)
      expect(actual).toBe(expected)
      expect(hasScenarioLine(actual)).toBe(true)
    }
    expect(reqBodyInCanonical(conventionsCanonical, "REQ-857")).toContain(
      REQ857_CHANGED_SENTENCE,
    )
  })

  test("[28] 七文・二文・四行と正本のシナリオ一行に英語キーワードが無い", () => {
    assertNoEnglishKeywords(sevenScenarioRuleBlock)
    assertNoEnglishKeywords(agentScenarioTwoLines)
    assertNoEnglishKeywords(agentReviewerScenarioFourLines)

    const scenarioLines = [
      reqBodyInCanonical(specCanonical, "REQ-906"),
      reqBodyInCanonical(specCanonical, "REQ-909"),
      reqBodyInCanonical(conventionsCanonical, "REQ-907"),
      reqBodyInCanonical(conventionsCanonical, "REQ-908"),
      reqBodyInCanonical(conventionsCanonical, "REQ-857"),
    ]
      .flatMap((body) => body.split("\n"))
      .filter((line) => line.startsWith("- シナリオ: 条件:"))
    expect(scenarioLines.length).toBeGreaterThanOrEqual(5)
    for (const line of scenarioLines) {
      assertNoEnglishKeywords(line)
    }
  })
})
