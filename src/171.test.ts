import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

const root = path.join(import.meta.dir, "..")
const skillPath = path.join(root, "skills/sdd-cur/SKILL.md")
const designReviewerPath = path.join(root, "agents/sdd-cur-design-reviewer.md")
const reqReviewerPath = path.join(root, "agents/sdd-cur-req-reviewer.md")
const reqReviewerHighPath = path.join(
  root,
  "agents/sdd-cur-req-reviewer-high.md",
)
const designPath = path.join(root, "docs/issues/171/design.md")
const sddCanonicalPath = path.join(root, "docs/canonical/sdd.md")

function sectionBetween(
  text: string,
  startHeading: string,
  endHeading: string,
): string {
  const startMarker = `\n${startHeading}\n`
  const endMarker = `\n${endHeading}\n`
  const start = text.indexOf(startMarker)
  if (start < 0) {
    throw new Error(`missing section: ${startHeading}`)
  }
  const end = text.indexOf(endMarker, start + startMarker.length)
  if (end < 0) {
    throw new Error(`missing section: ${endHeading}`)
  }
  return text.slice(start + 1, end)
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

function designDeltaItemBody(
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

const skill = readFileSync(skillPath, "utf8")
const designReviewer = readFileSync(designReviewerPath, "utf8")
const reqReviewer = readFileSync(reqReviewerPath, "utf8")
const reqReviewerHigh = readFileSync(reqReviewerHighPath, "utf8")
const designMarkdown = readFileSync(designPath, "utf8")
const sddCanonical = readFileSync(sddCanonicalPath, "utf8")
const designProcedure = sectionBetween(skill, "## 設計", "## 確認")
const requirementsProcedure = sectionBetween(skill, "## 要件", "## 設計")
const reflectDesignSlice = skill.slice(
  skill.indexOf("側が `design` のとき"),
  skill.indexOf("`action` が `合格` でないあいだは、設計の作成手順を続けない。"),
)

describe("issue 171", () => {
  test("[1][2][3][4][5][6][7][8][9][10][11][12][13][14][15][16][22] agents/sdd-cur-design-reviewer.md", () => {
    for (const phrase of [
      "課題全体が大きすぎる",
      "分割案:",
      "依存: なし",
      "目安を超える",
      "差分なし",
      "確認: なし",
      "判定: 不合格",
      "判定: 合格",
      "受け入れ条件: <番号の列> 依存: <依存>",
      "列挙のあとに分割案を書く",
      "分割案は書かない",
    ]) {
      expect(designReviewer).toContain(phrase)
    }
  })

  test("[17][18][19][20][21][23] skills/sdd-cur/SKILL.md 設計の段", () => {
    for (const phrase of [
      "課題全体が大きすぎる",
      "分割案:",
      "sdd-cur-create-issue` に分割案を渡して起動すれば子の課題を作れる。",
      "分割案をファイルにも課題コメントにも残さない",
      "人の判断を待って止まる",
      "設計修正役を起動しない",
    ]) {
      expect(designProcedure).toContain(phrase)
    }
  })

  test("[24] 反映後設計レビューが設計の節と同じ", () => {
    expect(reflectDesignSlice).toContain("設計の節と同じである")
    expect(reflectDesignSlice).toContain("分割案の止まりも、設計の節と同じである")
  })

  test("[25] 要求レビュー役に分割案: が無い", () => {
    expect(reqReviewer).not.toContain("分割案:")
    expect(reqReviewerHigh).not.toContain("分割案:")
  })

  test("[26] 要件の段に課題全体が大きすぎるが無い", () => {
    expect(requirementsProcedure).not.toContain("課題全体が大きすぎる")
  })

  test("[27] docs/canonical/sdd.md の REQ-939 から REQ-945", () => {
    for (let n = 939; n <= 945; n += 1) {
      const id = `REQ-${n}`
      const expected = designDeltaItemBody(designMarkdown, "追加", "sdd", id)
      expect(reqBodyInCanonical(sddCanonical, id)).toBe(expected)
    }
  })
})
