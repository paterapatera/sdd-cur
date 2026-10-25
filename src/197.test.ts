import { createHash } from "node:crypto"
import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { deltaSectionText } from "./conventions.ts"

const root = path.join(import.meta.dir, "..")
const implementSkillPath = path.join(root, "skills/sdd-cur-implement/SKILL.md")
const quickSkillPath = path.join(root, "skills/sdd-cur-quick/SKILL.md")
const fixSkillPath = path.join(root, "skills/sdd-cur-fix/SKILL.md")
const authorPath = path.join(root, "agents/sdd-cur-implement-author.md")
const fixerPath = path.join(root, "agents/sdd-cur-implement-fixer.md")
const reviewerPath = path.join(root, "agents/sdd-cur-implement-reviewer.md")
const design197Path = path.join(root, "docs/issues/197/design.md")
const specCanonicalPath = path.join(root, "docs/canonical/spec.md")
const implementCanonicalPath = path.join(root, "docs/canonical/implement.md")
const conventionsPath = path.join(root, "src/conventions.ts")
const runnerImplementTestPath = path.join(
  root,
  "src/runner-skill-sdd-cur-implement.test.ts",
)
const agentsFilesTestPath = path.join(root, "src/agents-files.test.ts")

const canonicalReflectProcedure = "`sdd-cur spec-apply <番号>`"
const canonicalReflectProcedureLegacy =
  "設計の `## 正本への差分` を、同じ作業ツリーの `docs/canonical/` へ反映する。"

const quickSkillSha256Before197 =
  "71c7ef10d7ea3f3665e10db2eba6c1b6b73d90457a7e398521ed3f406c8b2bbb"
const fixSkillSha256Before197 =
  "6325a4ab1d8ee5fe5f1e04269a687bcd6031918fcc3d58f0d6d680adc71879ad"

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

function reqBody(text: string, id: string): string {
  const marker = `## ${id}`
  const lines = text.split("\n")
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
  while (bodyLines.length > 0 && bodyLines[0] === "") {
    bodyLines.shift()
  }
  while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] === "") {
    bodyLines.pop()
  }
  return bodyLines.join("\n")
}

function nonEmptyLines(lines: readonly string[]): string[] {
  return lines.filter((line) => line.trim().length > 0)
}

function parseDeltaBodies(
  design: string,
  domain: "spec" | "implement",
): Map<string, string> {
  const section = deltaSectionText(design)
  const headingRe = /^### (追加|変更|削除) (spec|implement) (REQ-\d+)\n\n/gm
  const headings: {
    id: string
    domain: string
    contentStart: number
    start: number
  }[] = []
  for (const match of section.matchAll(headingRe)) {
    headings.push({
      domain: match[2],
      id: match[3],
      start: match.index ?? 0,
      contentStart: (match.index ?? 0) + match[0].length,
    })
  }
  const bodies = new Map<string, string>()
  for (let i = 0; i < headings.length; i += 1) {
    if (headings[i].domain !== domain) {
      continue
    }
    const end =
      i + 1 < headings.length ? headings[i + 1].start : section.length
    bodies.set(
      headings[i].id,
      section.slice(headings[i].contentStart, end).replace(/\n+$/, ""),
    )
  }
  return bodies
}

function changedFilesFromDesign(design: string): string[] {
  const start = design.indexOf("## 変えるファイル\n")
  expect(start).toBeGreaterThanOrEqual(0)
  const after = design.slice(start + "## 変えるファイル\n".length)
  const end = after.indexOf("\n\n")
  const block = end === -1 ? after : after.slice(0, end)
  return block
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2))
}

describe("197 spec-apply と正本", () => {
  test("[4][10] 実装スキルは spec-apply とレビューは spec-diff の終了コード", async () => {
    const skill = await readFile(implementSkillPath, "utf8")
    expect(skill).toContain("sdd-cur spec-apply <番号>")
    expect(skill).not.toContain(canonicalReflectProcedureLegacy)
    expect(skill).toContain(
      "`docs/canonical/` へ設計の `## 正本への差分` を書くのは、実装作成役には任せない。",
    )
    expect(skill).toContain(canonicalReflectProcedure)
    expect(skill).toContain(
      "正本が差分どおりかは、親が渡す `spec-diff` の終了コードだけを見る。",
    )
    expect(skill).not.toContain(
      "実装レビュー役は、作業ツリーの `docs/canonical/` が、設計の `## 正本への差分` のとおりかを見る。",
    )
  })

  test("[1][3][11][24][25] tasks 成功のあと spec-apply を一度、位置と未完了作業の直前には実行しない", async () => {
    const skill = await readFile(implementSkillPath, "utf8")
    expect(skill).toContain("各未完了作業の直前には実行しない。")
    expect(skill).toContain("`tasks` より前には実行しない。")
    expectLinesInOrder(skill, [
      "親は、作成役を起動する前に、`sdd-cur tasks <番号>` を一度実行する。",
      "`sdd-cur tasks <番号>` が終了コード 0 で成功したあと、親は `sdd-cur spec-apply <番号>` を一度だけ実行する。",
      "`spec-apply` の終了コードが 0 のとき、`done` が偽の作業があるときは、次の実装作成役を起動する直前まで進む。",
      "作成役を起動する順は、その `tasks` の並びの順であり、作業の一覧の順である。",
      "すべての作業の `done` が真で実装作成役を一度も起動しないときは、レビューに入る前に `sdd-cur spec-apply <番号>` を一度実行する。",
    ])
    const firstSpecApply = skill.indexOf(
      "`sdd-cur tasks <番号>` が終了コード 0 で成功したあと、親は `sdd-cur spec-apply <番号>` を一度だけ実行する。",
    )
    const taskDoneBeforeNext = skill.indexOf(
      "その起動が作業ツリーを変えたときは、次の作業の前に `sdd-cur task-done <番号> <作業番号>` を実行する。",
    )
    expect(firstSpecApply).toBeLessThan(taskDoneBeforeNext)
  })

  test("[2] spec-apply 失敗時は一行で止まり役を起動しない", async () => {
    const skill = await readFile(implementSkillPath, "utf8")
    for (const phrase of [
      "`spec-apply` の終了コードが 0 以外のときは、人に見せる一行は、標準エラーの最初の非空行であり、それが空のときは標準出力の最初の非空行である。",
      "実装作成役を起動しない。",
      "実装修正役を起動しない。",
      "実装レビュー役を起動しない。",
      "agent は失敗で終える。",
      "終了コードは 0 以外である。",
    ]) {
      expect(skill).toContain(phrase)
    }
    const failBlock = skill.slice(
      skill.indexOf(
        "`spec-apply` の終了コードが 0 以外のときは、人に見せる一行は",
      ),
      skill.indexOf("作成役を起動する順は"),
    )
    expect(failBlock).toContain("実装作成役を起動しない。")
    expect(failBlock).not.toContain("sdd-cur-implement-author")
  })

  test("[5][7][13] 実装作成役は正本を書かず要求・設計も作らない", async () => {
    const author = await readFile(authorPath, "utf8")
    expect(author).toContain("`docs/canonical/` を書かない")
    expect(author).toContain("`spec-apply` は親が実行する。")
    expect(author).not.toContain(canonicalReflectProcedure)
    expect(author).not.toContain(canonicalReflectProcedureLegacy)
    expect(author).not.toContain(
      "`docs/canonical/` のファイルは、作業ツリーの実装に含める。",
    )
    expect(author).toContain("要求ファイルと設計ファイルは作らない。")
    expect(author).toContain("変えない。")
    const fixSkill = await readFile(fixSkillPath, "utf8")
    expect(fixSkill).toContain("sdd-cur-implement-author")
    expect(fixSkill).not.toContain("spec-apply")
  })

  test("[6] 実装修正役は docs/canonical/ を書かない", async () => {
    const fixer = await readFile(fixerPath, "utf8")
    expect(fixer).toContain("`docs/canonical/` を書かない。")
    expect(fixer).toContain("差分が `docs/canonical/` を変えるときも変えない。")
    expect(fixer).not.toContain("変えてよい")
    expect(fixer).not.toContain(
      "`docs/canonical/` のファイルは、作業ツリーの実装に含める。",
    )
  })

  test("[8][9] 実装レビュー役は突き合わせせず残す指摘はある", async () => {
    const reviewer = await readFile(reviewerPath, "utf8")
    expect(reviewer).toContain(
      "正本の本文を、設計の `## 正本への差分` の項目の本文と突き合わせない。",
    )
    expect(reviewer).toContain(
      "正本が差分どおりかは、親が渡す `spec-diff` の終了コードだけを見る。",
    )
    expect(reviewer).toContain("`spec-diff` を自分で実行しない。")
    expect(reviewer).not.toContain("この段落は残す。")
    expect(reviewer).not.toContain("docs/canonical/<領域>.md")
    expect(reviewer).not.toContain(
      "- 作業ツリーの `docs/canonical/` が、設計の `## 正本への差分` どおりでない。",
    )
    for (const phrase of [
      "要求どおりでない",
      "設計通りでない",
      "渡された終了コードが 0 以外である",
      "作業ツリーと main の差分",
      "## 変えるファイル",
      "受け入れ手順が、設計の受け入れ条件",
    ]) {
      expect(reviewer).toContain(phrase)
    }
  })

  test("[10][12] テスト節の親実行と spec-diff 手順は #123 のまま", async () => {
    const skill = await readFile(implementSkillPath, "utf8")
    for (const phrase of [
      "実行すべき記述がある「テスト」節があるとき、親は、実装レビュー役を起動する前に、その節を実行する。",
      "実装レビュー役を起動するたびに、その前に実行する。",
      "レビュー役は、設計の「テスト」節を実行しない。",
      "親は、実装レビュー役を起動する前に、`sdd-cur spec-diff <番号>` を実行する。",
      "「テスト」節が無いときも、実行すべき記述が無いときも、実行する。",
      "終了コードが 0 以外でも、親はレビュー役を起動する。",
      "失敗の扱いは、設計の「テスト」節の実行と同じである。",
      "レビュー役は、`spec-diff` を実行しない。",
    ]) {
      expect(skill).toContain(phrase)
    }
  })

  test("[14][15][26] quick と fix の本文は課題前と同一で spec-apply を足さない", async () => {
    const quick = await readFile(quickSkillPath, "utf8")
    const fix = await readFile(fixSkillPath, "utf8")
    expect(sha256Hex(quick)).toBe(quickSkillSha256Before197)
    expect(sha256Hex(fix)).toBe(fixSkillSha256Before197)
    expect(quick).not.toContain("spec-apply")
    expect(fix).not.toContain("spec-apply")
  })

  test("[19] 変えるファイルに conventions.ts とコマンド実装の変更は無い", async () => {
    const design = await readFile(design197Path, "utf8")
    const changed = changedFilesFromDesign(design)
    expect(changed).not.toContain("src/conventions.ts")
    expect(changed).not.toContain("src/cli.ts")
    const conventions = readFileSync(conventionsPath, "utf8")
    expect(conventions).toContain("export async function specApply")
    expect(conventions).toContain("export async function specDiff")
  })

  test("[16][17][18][25] 正本 REQ-7 REQ-9 REQ-925 REQ-884 REQ-970 が差分どおり", async () => {
    const design = await readFile(design197Path, "utf8")
    const specCanon = await readFile(specCanonicalPath, "utf8")
    const implementCanon = await readFile(implementCanonicalPath, "utf8")
    const specDelta = parseDeltaBodies(design, "spec")
    const implementDelta = parseDeltaBodies(design, "implement")
    for (const [id, body] of specDelta) {
      expect(nonEmptyLines(reqBody(specCanon, id).split("\n"))).toEqual(
        nonEmptyLines(body.split("\n")),
      )
    }
    for (const [id, body] of implementDelta) {
      expect(nonEmptyLines(reqBody(implementCanon, id).split("\n"))).toEqual(
        nonEmptyLines(body.split("\n")),
      )
    }
    expect(implementCanon).toContain("## REQ-970")
    expect(implementCanon).toContain("もとになった課題は #197 である。")
  })

  test("[20] runner と agents-files の期待語を満たす実装スキルと三役", async () => {
    const runnerTest = await readFile(runnerImplementTestPath, "utf8")
    const agentsTest = await readFile(agentsFilesTestPath, "utf8")
    expect(runnerTest).toContain("docs/canonical/")
    expect(runnerTest).toContain("## 正本への差分")
    expect(agentsTest).toContain("docs/canonical/")
    expect(agentsTest).toContain("## 正本への差分")
    const skill = await readFile(implementSkillPath, "utf8")
    expect(skill).toContain("docs/canonical/")
    expect(skill).toContain(canonicalReflectProcedure)
    expect(skill).not.toContain(canonicalReflectProcedureLegacy)
    for (const file of [authorPath, reviewerPath, fixerPath]) {
      const text = await readFile(file, "utf8")
      expect(text).toContain("docs/canonical/")
    }
  })

  test("[21] 196 の spec-apply 期待と整合", async () => {
    const skill = await readFile(implementSkillPath, "utf8")
    const author = await readFile(authorPath, "utf8")
    expect(skill).toContain(canonicalReflectProcedure)
    expect(skill).not.toContain(canonicalReflectProcedureLegacy)
    expect(author).not.toContain(canonicalReflectProcedure)
    expect(author).not.toContain(canonicalReflectProcedureLegacy)
    expect(author).toContain("`docs/canonical/` を書かない")
  })

  test("[22] 123 のレビュー役期待と整合", async () => {
    const reviewer = await readFile(reviewerPath, "utf8")
    expect(reviewer).toContain("`spec-diff` を自分で実行しない。")
    expect(reviewer).toContain(
      "`spec-diff` の終了コードが 0 以外であることは、渡された終了コードが 0 以外であることの指摘である。",
    )
    expect(reviewer).not.toContain("docs/canonical/<領域>.md")
    expect(reviewer).not.toContain("この段落は残す。")
  })
})
