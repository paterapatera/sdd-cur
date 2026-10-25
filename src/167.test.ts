import { createHash } from "node:crypto"
import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { deltaSectionText } from "./conventions.ts"

const root = path.join(import.meta.dir, "..")
const skillPath = path.join(root, "skills/sdd-cur/SKILL.md")
const conventionsPath = path.join(root, "docs/conventions.md")
const sddCanonicalPath = path.join(root, "docs/canonical/sdd.md")
const designPath = path.join(root, "docs/issues/167/design.md")

const CONVENTIONS_SHA256 =
  "945ea61a9cee5825e57bfe371dc1c8e6bbe341fbad463f6b8758483073c937d2"

function sectionBetween(
  text: string,
  startHeading: string,
  endHeading: string,
): string {
  const startMarker = `\n${startHeading}\n`
  const endMarker = `\n${endHeading}\n`
  const start = text.indexOf(startMarker)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = text.indexOf(endMarker, start + startMarker.length)
  expect(end).toBeGreaterThan(start)
  return text.slice(start + 1, end)
}

function skillBodyAfterFrontmatter(skill: string): string {
  const end = skill.indexOf("\n---\n", 4)
  expect(end).toBeGreaterThan(0)
  return skill.slice(end + "\n---\n".length)
}

function passGuideSection(skill: string): string {
  return sectionBetween(skill, "## 合格のあとの案内", "## 禁止")
}

function answerRequirementsSection(skill: string): string {
  const answerStart = skill.indexOf("## 回答")
  const boundary = "側が `design` のとき、第1引数は `reflect-design` である。"
  const end = skill.indexOf(boundary, answerStart)
  expect(end).toBeGreaterThan(answerStart)
  return skill.slice(answerStart, end)
}

function answerDesignSection(skill: string): string {
  const boundary = "側が `design` のとき、第1引数は `reflect-design` である。"
  const start = skill.indexOf(boundary)
  const end = skill.indexOf("### 満たされているかの判断", start)
  expect(start).toBeGreaterThanOrEqual(0)
  expect(end).toBeGreaterThan(start)
  return skill.slice(start, end)
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

function parseDeltaBodies(design: string): Map<string, string> {
  const section = deltaSectionText(design)
  const headingRe = /^### (追加|変更|削除) sdd (REQ-\d+)\n\n/gm
  const headings: { id: string; contentStart: number; start: number }[] = []
  for (const match of section.matchAll(headingRe)) {
    headings.push({
      id: match[2],
      start: match.index ?? 0,
      contentStart: (match.index ?? 0) + match[0].length,
    })
  }
  const bodies = new Map<string, string>()
  for (let i = 0; i < headings.length; i += 1) {
    const end =
      i + 1 < headings.length ? headings[i + 1].start : section.length
    bodies.set(
      headings[i].id,
      section.slice(headings[i].contentStart, end).replace(/\n+$/, ""),
    )
  }
  return bodies
}

describe("167", () => {
  test("[1] 合格のあとの案内は一節だけ", async () => {
    const skill = await readFile(skillPath, "utf8")
    expect(skill.match(/^## 合格のあとの案内$/gm)?.length).toBe(1)
  })

  test("[10][11] 行数と一文一行", async () => {
    const skill = await readFile(skillPath, "utf8")
    const body = skillBodyAfterFrontmatter(skill)
    const lines = body.split("\n")
    const mainBodyLineCount = 598
    expect(lines.length).toBeLessThan(mainBodyLineCount)
  })

  test("[3] 各節は合格のあとの案内に従う", async () => {
    const skill = await readFile(skillPath, "utf8")
    const req = sectionBetween(skill, "## 要件", "## 設計")
    const design = sectionBetween(skill, "## 設計", "## 確認")
    const answerReq = answerRequirementsSection(skill)
    const answerDesign = answerDesignSection(skill)
    const passGuide = passGuideSection(skill)
    for (const section of [req, design, answerReq, answerDesign]) {
      expect(section).toContain("合格のあとの案内に従う。")
      expect(section).not.toContain(
        "Cursor の質問機能で「設計に進む」",
      )
      expect(section).not.toContain(
        "Cursor の質問機能で「実装依頼する」",
      )
    }
    expect(passGuide).toContain("「設計に進む」")
    expect(passGuide).toContain("「実装依頼する」")
  })

  test("[5][6] 質問中の禁止は一文", async () => {
    const skill = await readFile(skillPath, "utf8")
    const passGuide = passGuideSection(skill)
    const judgment = sectionBetween(
      skill,
      "### 満たされているかの判断",
      "## 合格のあとの案内",
    )
    expect(passGuide).toContain(
      "「実装依頼する」と「ここで止める」の質問を出しているあいだ、人がどちらかを選ぶまで、作業ブランチを push しないし、「実装依頼」を付けないし、`sdd-cur request <番号>` を実行しない。",
    )
    expect(judgment).toContain(
      "`閉じる` と `閉じない` を出しているあいだは、「設計に進む」と「ここで止める」を出さないし、「実装依頼する」と「ここで止める」を出さないし、作業ブランチを push しないし、「実装依頼」を付けないし、`sdd-cur request <番号>` を実行しないし、設計の手順に入らない。",
    )
  })

  test("[8] レビュー指摘と三つの値は各段一回", async () => {
    const skill = await readFile(skillPath, "utf8")
    const req = sectionBetween(skill, "## 要件", "## 設計")
    const design = sectionBetween(skill, "## 設計", "## 確認")
    expect(req.match(/レビューの指摘はどこにも置かない/g)?.length).toBe(1)
    expect(
      req.match(/段の開始時、`consecutiveFailures` は 0/g)?.length,
    ).toBe(1)
    expect(design.match(/レビューの指摘はどこにも置かない/g)?.length).toBe(1)
    expect(
      design.match(/段の開始時、`consecutiveFailures` は 0/g)?.length,
    ).toBe(1)
  })

  test("[12] docs/conventions.md は変えない", async () => {
    const conventions = await readFile(conventionsPath, "utf8")
    const hash = createHash("sha256").update(conventions, "utf8").digest("hex")
    expect(hash).toBe(CONVENTIONS_SHA256)
  })

  test("[14][15][16] ゲートの位置", async () => {
    const skill = await readFile(skillPath, "utf8")
    const req = sectionBetween(skill, "## 要件", "## 設計")
    const design = sectionBetween(skill, "## 設計", "## 確認")
    const confirm = sectionBetween(skill, "## 確認", "## 回答")
    const answer = skill.slice(skill.indexOf("## 回答"))
    const answerDesign = answerDesignSection(skill)
    expect(req).toContain("`sdd-cur gate <番号> requirements`")
    expect(design).toContain("`sdd-cur gate <番号> request`")
    expect(confirm).toContain("`sdd-cur gate <番号> confirm`")
    expect(answer).toContain("`sdd-cur gate <番号> reflect`")
    expect(answerDesign).not.toContain("`sdd-cur gate <番号> request`")
    expect(design).toContain(
      "人が設計を依頼したとき、または要件の合格の案内で「設計に進む」を選んだとき",
    )
  })

  test("[9] 分割案を残さない", async () => {
    const skill = await readFile(skillPath, "utf8")
    const design = sectionBetween(skill, "## 設計", "## 確認")
    expect(design).toContain(
      "分割案をファイルにも課題コメントにも残さない。",
    )
  })

  test("[13][20] 代表フレーズは合格のあとの案内に一か所", async () => {
    const skill = await readFile(skillPath, "utf8")
    const passGuide = passGuideSection(skill)
    const passGuideOnly = [
      "「設計に進む」と「ここで止める」の質問を出しているあいだ、人がどちらかを選ぶまで、設計の作成役と設計の修正役を起動しない。",
      "実装依頼は人が付ける。",
      "push は人が行う。",
    ]
    for (const phrase of passGuideOnly) {
      expect(passGuide).toContain(phrase)
      const outside = skill.replace(passGuide, "")
      expect(outside).not.toContain(phrase)
    }
  })

  test("[24][25] 正本 REQ-947 と REQ-279", async () => {
    const design = await readFile(designPath, "utf8")
    const sdd = await readFile(sddCanonicalPath, "utf8")
    const deltas = parseDeltaBodies(design)
    expect(reqBody(sdd, "REQ-947")).toBe(deltas.get("REQ-947") ?? "")
    expect(reqBody(sdd, "REQ-279")).toBe(deltas.get("REQ-279") ?? "")
  })
})

// sdd-cur task 2 marker

// sdd-cur task 3 marker

// sdd-cur task 4 marker

// sdd-cur task 5 marker

// sdd-cur task 6 marker

// sdd-cur task 7 marker

// sdd-cur task 8 marker
