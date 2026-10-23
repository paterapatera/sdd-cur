import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

const root = path.join(import.meta.dir, "..")
const skillPath = path.join(root, "skills/sdd-cur-create-issue/SKILL.md")
const designPath = path.join(root, "docs/issues/143/design.md")
const sddPath = path.join(root, "docs/canonical/sdd.md")

const expectedFrontmatter = `---
name: sdd-cur-create-issue
description: 人が明示して起動したときだけ、課題のタイプを人に聞いてから、そのタイプの質問の答えで本文を組み立て、起動時の作業ツリーの git リポジトリに GitHub の課題を 1 件作る。作った課題は閉じない。
disable-model-invocation: true
---
`

const typeChoiceIds = [
  "ユーザーストーリー",
  "修正",
  "機能改善",
  "調査",
] as const

const userStoryQuestions = [
  "誰のための変更ですか？",
  "何ができるようにしたいですか？",
  "背景はなんですか？",
  "手を入れる対象はどこですか？",
  "重なる課題はどれですか？",
  "比べる相手はありますか？",
] as const

const userStoryHeadings = [
  "## ユーザーストーリー",
  "## 背景",
  "## 手を入れる対象",
  "## 重なる課題",
  "## 比べる相手",
] as const

const fixQuestions = [
  "何が失敗していますか？",
  "どの手順で失敗しますか？",
  "失敗したとき、どうなるべきですか？",
  "背景はなんですか？",
  "重なる課題はどれですか？",
] as const

const fixHeadings = [
  "## 失敗していること",
  "## 失敗する手順",
  "## 期待する結果",
  "## 背景",
  "## 重なる課題",
] as const

const improvementQuestions = [
  "今の挙動は何ですか？",
  "どう変えたいですか？",
  "背景はなんですか？",
  "変えないことは何ですか？",
  "手を入れる対象はどこですか？",
  "重なる課題はどれですか？",
  "比べる相手はありますか？",
] as const

const improvementHeadings = [
  "## 今の挙動",
  "## 変えたいこと",
  "## 背景",
  "## 変えないこと",
  "## 手を入れる対象",
  "## 重なる課題",
  "## 比べる相手",
] as const

const researchQuestions = [
  "何を調べますか？",
  "背景はなんですか？",
  "どこを調べますか？",
  "何が分かれば調べ終わりですか？",
  "重なる課題はどれですか？",
] as const

const researchHeadings = [
  "## 調べること",
  "## 背景",
  "## 調べる範囲",
  "## 調べ終わり",
  "## 重なる課題",
] as const

const req50Phrases = [
  "git リポジトリでない旨を伝える",
  "番号と URL",
  "課題を閉じない",
  "ラベル、担当者、マイルストーンは付けない",
  "`--repo` は付けない",
  "`sdd-cur` では課題を作らない",
  "依頼が無いときは、課題を作らない",
  "明示して起動していないときは、課題を作らない",
  "作業の前に `sdd-cur/conventions.md` を読む。",
] as const

const canonicalIds = [
  "REQ-483",
  "REQ-489",
  "REQ-493",
  "REQ-494",
  "REQ-906",
  "REQ-907",
  "REQ-908",
  "REQ-909",
  "REQ-910",
  "REQ-911",
  "REQ-912",
  "REQ-913",
  "REQ-914",
] as const

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function sectionBetween(text: string, startHeading: string, endHeading: string): string {
  const start = text.indexOf(startHeading)
  expect(start).toBeGreaterThanOrEqual(0)
  const bodyStart = text.indexOf("\n", start) + 1
  const end = text.indexOf(endHeading, bodyStart)
  expect(end).toBeGreaterThanOrEqual(0)
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

function nonEmptyLines(lines: readonly string[]): string[] {
  return lines.filter((line) => line.trim().length > 0)
}

function deltaSectionText(designMarkdown: string): string {
  const lines = normalizeNewlines(designMarkdown).split("\n")
  let start = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] === "## 正本への差分") {
      start = i + 1
      break
    }
  }
  if (start < 0) return ""
  const sectionLines: string[] = []
  for (let i = start; i < lines.length; i += 1) {
    if (lines[i].startsWith("## ")) break
    sectionLines.push(lines[i])
  }
  return sectionLines.join("\n")
}

function parseDesignDeltas(design: string): Map<string, string> {
  const section = deltaSectionText(design)
  const headingRe = /^### (追加|変更) sdd (REQ-\d+)\n\n/gm
  const headings: { id: string; start: number; contentStart: number }[] = []
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
    const body = section.slice(headings[i].contentStart, end).replace(/\n+$/, "")
    bodies.set(headings[i].id, body)
  }
  return bodies
}

function reqBodyLines(canonical: string, id: string): string[] {
  const heading = `## ${id}`
  const start = canonical.indexOf(heading)
  expect(start).toBeGreaterThanOrEqual(0)
  const after = canonical.slice(start + heading.length)
  const next = after.search(/\n## REQ-/)
  const block = next === -1 ? after : after.slice(0, next)
  return block.split("\n").slice(1)
}

function indexBefore(haystack: string, needle: string, before: string): void {
  const needleIndex = haystack.indexOf(needle)
  const beforeIndex = haystack.indexOf(before)
  expect(needleIndex).toBeGreaterThanOrEqual(0)
  expect(beforeIndex).toBeGreaterThanOrEqual(0)
  expect(needleIndex).toBeLessThan(beforeIndex)
}

describe("143", () => {
  const skill = readFileSync(skillPath, "utf8")
  const design = readFileSync(designPath, "utf8")
  const sdd = readFileSync(sddPath, "utf8")
  const kidou = sectionBetween(skill, "## 作成", "## 禁止")

  test("[49] frontmatter", () => {
    expect(skill.startsWith(expectedFrontmatter)).toBe(true)
  })

  test("[50] 受け入れ条件 50 の文言", () => {
    for (const phrase of req50Phrases) {
      expect(skill).toContain(phrase)
    }
  })

  test("[1][2][3][6][7][13][16] タイプ選択と質問の順", () => {
    expect(kidou).toContain("Cursor の質問機能の選択肢")
    for (const id of typeChoiceIds) {
      expect(kidou).toContain(`\`${id}\``)
      expect(kidou).toContain(`各 ID と一文字も違わない`)
    }
    expect(kidou).toContain("選ばれた選択肢の ID")
    indexBefore(kidou, "どのタイプの課題を作るか", "誰のための変更ですか？")
    indexBefore(kidou, "どのタイプの課題を作るか", "gh issue create")
    expect(kidou).toContain(
      "本文用の内容が無いとき、および渡した内容がスペースと改行だけであるときは、内容が欠けていることを理由に止まらない",
    )
    expect(kidou).toContain(
      "内容が欠けていることを理由に不足を伝えない",
    )
  })

  test("[4][5][8][9][10] 本文の組み立て", () => {
    expect(kidou).toContain("起動時に渡した内容そのものを課題の本文にしない")
    expect(kidou).toContain("素材・参考として使う")
    expect(kidou).toContain("二つのタイプが違うとき、見出しの並びは違う")
    const sequences = [
      userStoryHeadings.join("\n"),
      fixHeadings.join("\n"),
      improvementHeadings.join("\n"),
      researchHeadings.join("\n"),
    ]
    for (let i = 0; i < sequences.length; i += 1) {
      for (let j = 0; j < sequences.length; j += 1) {
        if (i !== j) {
          expect(sequences[i]).not.toBe(sequences[j])
        }
      }
    }
  })

  test("[11][12][14][15] 内容欠如で止まらない", () => {
    expect(kidou).not.toContain("内容が欠けているときは、課題を作らない")
    expect(skill).not.toContain("不足を伝える")
  })

  test("[17][18][19][20][21] 組み立てた本文から題を決める", () => {
    expect(kidou).toContain("組み立てた本文をもとに、このスキルを実行するエージェントが決める")
    expect(kidou).toContain("題を人に尋ねない")
    expect(kidou).toContain("`gh issue create` を 1 回実行し、課題を 1 件作る")
  })

  test("[22][23][24][25] 組み立てた本文から題を決められない", () => {
    expect(kidou).toContain("組み立てた本文から題を決められないときは、課題を作らない")
    expect(kidou).toContain("題を決められない旨を伝える")
  })

  test("[26][27][28] 渡した内容から題を決める", () => {
    expect(kidou).toContain("渡した内容をもとに、このスキルを実行するエージェントが決める")
    expect(kidou).toContain("人は題を指定しない")
  })

  test("[29][30] ユーザーストーリー", () => {
    expectLinesInOrder(kidou, userStoryQuestions)
    expectLinesInOrder(kidou, userStoryHeadings)
  })

  test("[31][32] 修正", () => {
    expectLinesInOrder(kidou, fixQuestions)
    expectLinesInOrder(kidou, fixHeadings)
  })

  test("[33][34] 機能改善", () => {
    expectLinesInOrder(kidou, improvementQuestions)
    expectLinesInOrder(kidou, improvementHeadings)
  })

  test("[35][36] 調査", () => {
    expectLinesInOrder(kidou, researchQuestions)
    expectLinesInOrder(kidou, researchHeadings)
  })

  test("[37][38][39][48] 不正なタイプ ID", () => {
    expect(kidou).toContain("聞き直す")
    expect(kidou).toContain("その ID では課題を作らない")
    expect(kidou).toContain("選んだタイプ向けの質問へ進む")
  })

  test("[40][41][42][43] 空の答え", () => {
    expect(kidou).toContain("足りない質問として伝える")
    expect(kidou).toContain("答えが空である質問、または答えがスペースと改行だけである質問")
  })

  test("[44][45][46][47] 渡した内容から題を決められない", () => {
    expect(kidou).toContain("渡した内容から題を決められないときは、課題を作らない")
  })

  test("[51] 正本と設計の正本への差分", () => {
    const deltas = parseDesignDeltas(design)
    for (const id of canonicalIds) {
      const designBody = deltas.get(id)
      expect(designBody).toBeDefined()
      expect(nonEmptyLines(reqBodyLines(sdd, id))).toEqual(
        nonEmptyLines(designBody!.split("\n")),
      )
    }
  })

  test("[52][53][54][55] git リポジトリでない", () => {
    expect(kidou).toContain(
      "どのタイプの課題を作るかを人に聞くより前に止まる",
    )
    expect(kidou).toContain("git リポジトリでない旨を伝える")
  })

  test("[52][56] git でなく題も決められない", () => {
    expect(kidou).toContain(
      "先に git リポジトリでない旨を伝え、次に題を決められない旨を伝える。この二つの伝達は、どのタイプの課題を作るかを人に聞くより前である。",
    )
  })

  test("スキル本文に人が渡した内容という連続は無い", () => {
    expect(skill).not.toContain("人が渡した内容")
  })
})
