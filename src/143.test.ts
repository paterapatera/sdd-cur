import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

const root = path.join(import.meta.dir, "..")
const skillPath = path.join(root, "skills/sdd-cur-create-issue/SKILL.md")
const designPath = path.join(root, "docs/issues/143/design.md")
const design172Path = path.join(root, "docs/issues/172/design.md")
const sddPath = path.join(root, "docs/canonical/sdd.md")

const expectedFrontmatter = `---
name: sdd-cur-create-issue
description: 人が明示して起動したときだけ、課題のタイプを人に聞いてから、そのタイプの質問の答えで本文を組み立て、起動時の作業ツリーの git リポジトリに GitHub の課題を作る。渡した内容が分割案の形のときは、一回の起動で子の行ごとに課題を作る。作った課題は閉じない。
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

const canonicalIds172 = [
  "REQ-486",
  "REQ-487",
  "REQ-494",
  "REQ-948",
  "REQ-949",
  "REQ-950",
  "REQ-951",
  "REQ-952",
  "REQ-953",
  "REQ-954",
  "REQ-955",
] as const

const splitTypeChoiceIds = [
  "ユーザーストーリー",
  "修正",
  "機能改善",
  "調査",
  "一件ずつ選ぶ",
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
  const design172 = readFileSync(design172Path, "utf8")
  const sdd = readFileSync(sddPath, "utf8")
  const kidou = sectionBetween(skill, "## 作成", "## 禁止")
  const singleIssueMarker = "分割案の形でないときは、次の一件作成の手順に進む。"
  const singleIssueKidou = kidou.slice(kidou.indexOf(singleIssueMarker))

  test("[49] frontmatter", () => {
    expect(skill.startsWith(expectedFrontmatter)).toBe(true)
  })

  test("[50] 受け入れ条件 50 の文言", () => {
    for (const phrase of req50Phrases) {
      expect(skill).toContain(phrase)
    }
  })

  test("[1][2][3][6][7][13][16] タイプ選択と質問の順", () => {
    expect(singleIssueKidou).toContain("Cursor の質問機能の選択肢")
    for (const id of typeChoiceIds) {
      expect(singleIssueKidou).toContain(`\`${id}\``)
      expect(singleIssueKidou).toContain(`各 ID と一文字も違わない`)
    }
    expect(singleIssueKidou).toContain("選ばれた選択肢の ID")
    indexBefore(singleIssueKidou, "どのタイプの課題を作るか", "誰のための変更ですか？")
    indexBefore(singleIssueKidou, "どのタイプの課題を作るか", "分割案の形でないときに限り")
    expect(singleIssueKidou).toContain(
      "本文用の内容が無いとき、および渡した内容がスペースと改行だけであるときは、内容が欠けていることを理由に止まらない",
    )
    expect(singleIssueKidou).toContain(
      "内容が欠けていることを理由に不足を伝えない",
    )
  })

  test("[4][5][8][9][10] 本文の組み立て", () => {
    expect(singleIssueKidou).toContain("起動時に渡した内容そのものを課題の本文にしない")
    expect(singleIssueKidou).toContain("素材・参考として使う")
    expect(singleIssueKidou).toContain("二つのタイプが違うとき、見出しの並びは違う")
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
    expect(singleIssueKidou).not.toContain("内容が欠けているときは、課題を作らない")
    expect(skill).not.toContain("不足を伝える")
  })

  test("[17][18][19][20][21] 組み立てた本文から題を決める", () => {
    expect(singleIssueKidou).toContain("組み立てた本文をもとに、このスキルを実行するエージェントが決める")
    expect(singleIssueKidou).toContain("題を人に尋ねない")
    expect(singleIssueKidou).toContain("分割案の形でないときに限り、`gh issue create` を 1 回実行し、課題を 1 件作る")
  })

  test("[22][23][24][25] 組み立てた本文から題を決められない", () => {
    expect(singleIssueKidou).toContain("組み立てた本文から題を決められないときは、課題を作らない")
    expect(singleIssueKidou).toContain("題を決められない旨を伝える")
  })

  test("[26][27][28] 渡した内容から題を決める", () => {
    expect(singleIssueKidou).toContain("渡した内容をもとに、このスキルを実行するエージェントが決める")
    expect(singleIssueKidou).toContain("人は題を指定しない")
  })

  test("[29][30] ユーザーストーリー", () => {
    expectLinesInOrder(singleIssueKidou, userStoryQuestions)
    expectLinesInOrder(singleIssueKidou, userStoryHeadings)
  })

  test("[31][32] 修正", () => {
    expectLinesInOrder(singleIssueKidou, fixQuestions)
    expectLinesInOrder(singleIssueKidou, fixHeadings)
  })

  test("[33][34] 機能改善", () => {
    expectLinesInOrder(singleIssueKidou, improvementQuestions)
    expectLinesInOrder(singleIssueKidou, improvementHeadings)
  })

  test("[35][36] 調査", () => {
    expectLinesInOrder(singleIssueKidou, researchQuestions)
    expectLinesInOrder(singleIssueKidou, researchHeadings)
  })

  test("[37][38][39][48] 不正なタイプ ID", () => {
    expect(singleIssueKidou).toContain("聞き直す")
    expect(singleIssueKidou).toContain("その ID では課題を作らない")
    expect(singleIssueKidou).toContain("選んだタイプ向けの質問へ進む")
  })

  test("[40][41][42][43] 空の答え", () => {
    expect(singleIssueKidou).toContain("足りない質問として伝える")
    expect(singleIssueKidou).toContain("答えが空である質問、または答えがスペースと改行だけである質問")
  })

  test("[44][45][46][47] 渡した内容から題を決められない", () => {
    expect(singleIssueKidou).toContain("渡した内容から題を決められないときは、課題を作らない")
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
    expect(singleIssueKidou).toContain(
      "どのタイプの課題を作るかを人に聞くより前に止まる",
    )
    expect(singleIssueKidou).toContain("git リポジトリでない旨を伝える")
  })

  test("[52][56] git でなく題も決められない", () => {
    expect(singleIssueKidou).toContain(
      "先に git リポジトリでない旨を伝え、次に題を決められない旨を伝える。この二つの伝達は、どのタイプの課題を作るかを人に聞くより前である。",
    )
  })

  test("スキル本文に人が渡した内容という連続は無い", () => {
    expect(skill).not.toContain("人が渡した内容")
  })

  test("[172][29][66] 正本と設計 172 の正本への差分", () => {
    const deltas = parseDesignDeltas(design172)
    for (const id of canonicalIds172) {
      const designBody = deltas.get(id)
      expect(designBody).toBeDefined()
      expect(nonEmptyLines(reqBodyLines(sdd, id))).toEqual(
        nonEmptyLines(designBody!.split("\n")),
      )
    }
  })

  test("[172][1][2] 明示起動なし", () => {
    expect(kidou).toContain("明示して起動していないときは、課題を作らない")
    expect(kidou).toContain("依頼が無いときは、課題を作らない")
    expect(kidou).toContain("`gh issue create` は実行しない")
  })

  test("[172][3][4][24][25] 一件と複数件", () => {
    expect(kidou).toContain("一回の起動で、子の行ごとに課題を作る")
    expect(singleIssueKidou).toContain("内容が複数の話題でも、作る課題は 1 件である")
    expect(kidou).toContain("作った課題の数は子の行の数である")
    expect(kidou).toContain("作った課題ごとに番号と URL を人に伝える")
    expect(singleIssueKidou).toContain("内容が複数の話題でも、作る課題は 1 件である")
  })

  test("[172][5][10][11][12][13][48] 分割案のタイプ選択", () => {
    indexBefore(kidou, "渡した内容が分割案の形かどうかを最初に見る", singleIssueMarker)
    for (const id of splitTypeChoiceIds) {
      expect(kidou).toContain(`\`${id}\``)
    }
    expect(kidou).toContain("件ごとに、選択肢の ID が上から `ユーザーストーリー`、`修正`、`機能改善`、`調査` である質問でタイプを聞く")
    expect(kidou).toContain("課題 143 の要件が定める見出しだけであり、その順である")
  })

  test("[172][6][7][8][9] 分割案で git でない", () => {
    expect(kidou).toContain("タイプを聞く質問より前に止まる")
    indexBefore(kidou, "タイプを聞く質問より前に止まる", "元の課題の番号は？")
  })

  test("[172][14][15][16][17][18][53][54][55] 題と承認", () => {
    expect(kidou).toContain("その子の行の `題` を初期値とする")
    expect(kidou).toContain("全件の題と本文を人に見せ、承認を得る")
    expect(kidou).toContain("`この内容で課題を作る`")
    expect(kidou).toContain("渡された全文を人に見せる")
    expect(kidou).toContain("見せ直した全文について `この内容で課題を作る` を選ぶまで")
  })

  test("[172][19][38][39][40][41][42][43][46][47] show と埋め方", () => {
    expect(kidou).toContain("`bun src/cli` + `.ts show <番号>`")
    expect(kidou).toContain("元の課題の番号は？")
    expect(kidou).toContain("分割案と `sdd-cur show` で埋められる節は、人に問わず埋める")
    expect(kidou).toContain("埋められない節だけを、件ごとに")
    expect(kidou).toContain("足りない質問として伝える")
    expect(kidou).toContain("元の課題を `sdd-cur show` で読む")
  })

  test("[172][20][21][22][23][56][65] 依存順と失敗", () => {
    expect(kidou).toContain("依存先を先にするトポロジカル順")
    expect(kidou).toContain("まだ `gh issue create` を実行していない子については、`gh issue create` を実行しない")
    expect(kidou).toContain("それまでに作れた課題の番号と URL を人に伝える")
    expect(kidou).toContain("作った課題を閉じない")
    expect(kidou).toContain("分割案の子番号の昇順")
  })

  test("[172][26][27][28] 元課題への非介入", () => {
    expect(kidou).toContain("元の課題へコメントを投稿しない")
    expect(kidou).toContain("元の課題のラベルを変えない")
    expect(kidou).toContain("元の課題に担当者を付けない")
  })

  test("[172][31][32][33][34][35][36][37] 重なる課題と #子", () => {
    expect(kidou).toContain("一件を作るときに人がその節へ答える形式を、得たまま書く")
    expect(kidou).toContain("#子` の直後にその子番号を続ける")
    expect(kidou).toContain("`依存` が `なし` のときは、`#子` 行は書かない")
    expect(kidou).toContain("元の課題の番号は置き換えない")
    expect(kidou).toContain("置換後の本文を、人の承認のためには見せ直さない")
    expect(kidou).toContain("置き換えた本文でその子の `gh issue create` を実行する")
  })

  test("[172][49][50][51][52][57][58][59][60][61][62][63][64] 不正タイプと依存", () => {
    expect(kidou).toContain("五つの ID 以外が選ばれたときは")
    expect(kidou).toContain("四つの ID 以外が選ばれたときは")
    expect(kidou).toContain("循環があるとき")
    expect(kidou).toContain("理由を伝えて止まる")
    expect(kidou).toContain("`依存` が `なし` でなく同じ分割案の子番号でもないときは")
  })

  test("[172][4] 一件作成手順が残る", () => {
    expect(singleIssueKidou).toContain(singleIssueMarker)
    expect(singleIssueKidou).toContain("どのタイプの課題を作るかを、Cursor の質問機能の選択肢で人に聞く")
  })
})
