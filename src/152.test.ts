import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

const root = path.join(import.meta.dir, "..")
const skillPath = path.join(root, "skills/sdd-cur/SKILL.md")
const designPath = path.join(root, "docs/issues/152/design.md")
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
const designMarkdown = readFileSync(designPath, "utf8")
const sddCanonical = readFileSync(sddCanonicalPath, "utf8")
const designProcedure = sectionBetween(skill, "## 設計", "## 確認")
const requirementsProcedure = sectionBetween(skill, "## 要件", "## 設計")

describe("issue 152", () => {
  test("[1][28] 設計の手順に「設計レビューを起動しない」", () => {
    expect(designProcedure).toContain("設計レビューを起動しない")
  })

  test("[2][29] 設計の手順に「設計修正指示を起動しない」と「設計の修正役も起動しない」", () => {
    expect(designProcedure).toContain("設計修正指示を起動しない")
    expect(designProcedure).toContain("設計の修正役も起動しない")
  })

  test("[3] 設計の手順に「判定が合格なら実装依頼に進めることができる、とは伝えない」", () => {
    expect(designProcedure).toContain(
      "判定が合格なら実装依頼に進めることができる、とは伝えない",
    )
  })

  test("[4] 設計の手順に「決められない点は設計ファイルへ書かない」", () => {
    expect(designProcedure).toContain("決められない点は設計ファイルへ書かない")
  })

  test("[5] 設計の手順に「確認待ち以外の点があるときだけ、Cursor の質問機能で人に質問する」", () => {
    expect(designProcedure).toContain(
      "確認待ち以外の点があるときだけ、Cursor の質問機能で人に質問する",
    )
  })

  test("[6] 設計の手順に「人が答えるまで設計の手順を止まる」", () => {
    expect(designProcedure).toContain("人が答えるまで設計の手順を止まる")
  })

  test("[7] 設計の手順に「質問文と選択肢は SDD スキルの親が作る」", () => {
    expect(designProcedure).toContain("質問文と選択肢は SDD スキルの親が作る")
  })

  test("[8] 設計の手順に「設計作成役は質問を出さない」", () => {
    expect(designProcedure).toContain("設計作成役は質問を出さない")
  })

  test("[9] 設計の手順に採点ラベルの形式", () => {
    expect(designProcedure).toContain(
      "先頭を `[スコア `、1 以上 5 以下の整数、`]` の順で始め、続けて選択肢本文とする。",
    )
  })

  test("[10] 設計の手順に通常の選択肢と末尾の確認選択肢", () => {
    expect(designProcedure).toContain(
      "通常の選択肢を 1 つ以上並べ、最後に `課題のコメントで確認する` を置く。",
    )
  })

  test("[11] 設計の手順に「最後の選択肢には、通常の選択肢の形式を付けない。」", () => {
    expect(designProcedure).toContain(
      "最後の選択肢には、通常の選択肢の形式を付けない。",
    )
  })

  test("[12] 設計の手順に「Cursor の質問を一つ出す。」", () => {
    expect(designProcedure).toContain("Cursor の質問を一つ出す。")
  })

  test("[13] 設計の手順に通常の選択肢を選んだときの再起動とラベル全体", () => {
    expect(designProcedure).toContain(
      "人が通常の選択肢を選んだときは、選ばれたラベル全体を人が決めた条件として、設計作成役を再び起動する。",
    )
    expect(designProcedure).toContain(
      "選ばれたラベル全体は、先頭の `[スコア `、その選択肢の 1 以上 5 以下の整数、`]`、選択肢本文を、この順で続けたものである。",
    )
  })

  test("[14] 設計の手順に「列挙が空になるまで、設計レビューと修正指示に入らない。」", () => {
    expect(designProcedure).toContain(
      "列挙が空になるまで、設計レビューと修正指示に入らない。",
    )
  })

  test("[15] 設計の手順に「その点は決定として書かない。」", () => {
    expect(designProcedure).toContain("その点は決定として書かない。")
  })

  test("[16] 設計の手順に「課題コメントの確認手順に回す。」", () => {
    expect(designProcedure).toContain("課題コメントの確認手順に回す。")
  })

  test("[17] 設計の手順に「確認の手順に入る前に `show` を改めて実行する。」", () => {
    expect(designProcedure).toContain(
      "確認の手順に入る前に `show` を改めて実行する。",
    )
  })

  test("[18] 設計の手順に「payload を人に見せる。」", () => {
    expect(designProcedure).toContain("payload を人に見せる。")
  })

  test("[19] 設計の手順に承認のあとだけ confirm", () => {
    expect(designProcedure).toContain(
      "人がその本文を承認したあとだけ `sdd-cur confirm <番号>` を実行する。",
    )
  })

  test("[20] 設計の手順に「印の行は入れない。」", () => {
    expect(designProcedure).toContain("印の行は入れない。")
  })

  test("[21] 設計の手順に直した文字列の承認まで confirm しない", () => {
    expect(designProcedure).toContain(
      "直した文字列を改めて見せ、その文字列の承認があるまで `confirm` を実行しない。",
    )
  })

  test("[22] 設計の手順に unanswered の確認投稿抑止", () => {
    expect(designProcedure).toContain(
      "`unanswered` が空でないときは、次の確認は投稿しない。",
    )
  })

  test("[23] 設計の手順に nextAnswer の確認投稿抑止", () => {
    expect(designProcedure).toContain(
      "`nextAnswer` が `null` でないときは、次の確認は投稿しない。",
    )
  })

  test("[24] 設計の手順に「依存の判断では待ちの点として扱う。」", () => {
    expect(designProcedure).toContain("依存の判断では待ちの点として扱う。")
  })

  test("[25] 設計の手順に「列挙を人に見せて止まる」が無い", () => {
    expect(designProcedure).not.toContain("列挙を人に見せて止まる")
  })

  test("[26] 設計の手順に「列挙を Cursor の質問機能で聞いて止まる」", () => {
    expect(designProcedure).toContain(
      "列挙を Cursor の質問機能で聞いて止まる",
    )
  })

  test("[27] 設計の手順に「設計作成役が返す列挙に含める。」", () => {
    expect(designProcedure).toContain("設計作成役が返す列挙に含める。")
  })

  test("[30] 設計の手順に reflect 後の設計作成役の再起動", () => {
    expect(designProcedure).toContain(
      "その確認が `reflect` で設計へ取り込まれたあとは、その回答を人が決めた条件として、設計作成役を再び起動する。",
    )
  })

  test("[31] 設計の手順に他の点の回答を待たず再起動", () => {
    expect(designProcedure).toContain(
      "他の点の回答を待たずに、その点の選ばれたラベル全体を人が決めた条件として、設計作成役を再び起動する。",
    )
  })

  test("[32] 設計の手順に依存しない別の点だけ質問", () => {
    expect(designProcedure).toContain(
      "その待ちの点に依存しないときは、その別の点だけを Cursor の質問機能で質問する。",
    )
  })

  test("[33] 設計の手順に他の節の文言を変えるときは質問しない", () => {
    expect(designProcedure).toContain(
      "他の節の文言を変えるときは、その別の点を質問しない。",
    )
  })

  test("[34][36][38] 設計の手順に設計作成役へ渡さない", () => {
    expect(designProcedure).toContain(
      "その別の点を人が決めた条件として設計作成役へ渡さない。",
    )
  })

  test("[35] 設計の手順に依存すると判断したときは質問しない", () => {
    expect(designProcedure).toContain(
      "待ちの点に依存すると判断したときは、その別の点を質問しない。",
    )
  })

  test("[37] 設計の手順に判断に迷ったときは質問しない", () => {
    expect(designProcedure).toContain(
      "判断に迷ったときは、その別の点を質問しない。",
    )
  })

  test("[39] 設計の手順に再び質問しない", () => {
    expect(designProcedure).toContain(
      "その点を Cursor の質問機能で再び質問しない。",
    )
  })

  test("[40] 設計の手順に「Cursor の質問機能で質問を出さない。」", () => {
    expect(designProcedure).toContain("Cursor の質問機能で質問を出さない。")
  })

  test("[41] 設計の手順に「Cursor の質問機能で質問を続ける。」", () => {
    expect(designProcedure).toContain("Cursor の質問機能で質問を続ける。")
  })

  test("[42] 設計の手順に要求の未記載と同様の定義", () => {
    expect(designProcedure).toContain(
      "要求の未記載を聞くのと同様に質問するとは、親が設計作成役の列挙を読んで Cursor の質問機能で質問することに限る。",
    )
  })

  test("[43] 設計の手順に質問の形式が要求の手順と同じの定義", () => {
    expect(designProcedure).toContain(
      "質問の形式が要求の手順と同じとは、採点ラベル、通常の選択肢を 1 つ以上並べること、最後の `課題のコメントで確認する`、最後の選択肢に通常の形式を付けないこと、に限る。",
    )
  })

  test("[44] 設計の手順に要求の手順と同じ扱いの定義", () => {
    expect(designProcedure).toContain(
      "要求の手順と同じ扱いとは、決定として書かないこと、確認手順に回すこと、`show` の再実行、payload を人に見せること、承認のあとだけ `confirm` を実行すること、印の行を入れないこと、直した文字列の承認まで `confirm` しないこと、`unanswered` が空でないときと `nextAnswer` が `null` でないときは次の確認を投稿しないこと、依存の判断では待ちの点として扱うこと、に限る。",
    )
  })

  test("[45] 設計の手順に「スコアに拘束力を持たせない」が無い", () => {
    expect(designProcedure).not.toContain("スコアに拘束力を持たせない")
  })

  test("[46] 設計の手順に「親がスコアの高い選択肢を選ばない」が無い", () => {
    expect(designProcedure).not.toContain("親がスコアの高い選択肢を選ばない")
  })

  test("[47] 設計の手順に「観点を質問本文に示す」が無い", () => {
    expect(designProcedure).not.toContain("観点を質問本文に示す")
  })

  test("[48] docs/canonical/sdd.md の REQ-290 が設計の変更差分と一致", () => {
    const expected = designDeltaItemBody(
      designMarkdown,
      "変更",
      "sdd",
      "REQ-290",
    )
    expect(reqBodyInCanonical(sddCanonical, "REQ-290")).toBe(expected)
  })

  test("[49] docs/canonical/sdd.md の REQ-915 から REQ-922 が設計の追加差分と一致", () => {
    for (let n = 906; n <= 913; n += 1) {
      const canonicalId = `REQ-${n + 9}`
      const designId = `REQ-${n}`
      const expected = designDeltaItemBody(
        designMarkdown,
        "追加",
        "sdd",
        designId,
      )
      expect(reqBodyInCanonical(sddCanonical, canonicalId)).toBe(expected)
    }
  })

  test("[50] 要件の手順に Cursor の質問と設計用の列挙文言", () => {
    expect(requirementsProcedure).toContain(
      "返信に質問する未記載があるときは、レビューに入る前に、その点を Cursor の質問機能で質問する。",
    )
    expect(requirementsProcedure).not.toContain(
      "列挙を Cursor の質問機能で聞いて止まる",
    )
  })
})
