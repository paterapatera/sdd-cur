import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"

const root = path.join(import.meta.dir, "..")
const skillPath = path.join(root, "skills/sdd-cur-implement/SKILL.md")

function sectionBetween(text: string, startHeading: string, endHeading: string): string {
  const start = text.indexOf(startHeading)
  expect(start).toBeGreaterThanOrEqual(0)
  const lines = text.slice(start).split("\n")
  let endLine = lines.length
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === endHeading) {
      endLine = i
      break
    }
  }
  expect(endLine).toBeGreaterThan(0)
  return lines.slice(0, endLine).join("\n")
}

describe("課題 92", () => {
  test("skills/sdd-cur-implement/SKILL.md の実装とレビュー", async () => {
    const text = await readFile(skillPath, "utf8")

    const implSection = sectionBetween(text, "## 実装", "## レビュー")
    expect(implSection).toContain(
      "番号付き指摘の本文が直前の不合格レビューと同じではない",
    )
    expect(implSection).toContain(
      "番号付き指摘の本文が直前の不合格レビューと同じときも、書き直さない",
    )

    const reviewSection = sectionBetween(text, "## レビュー", "## 禁止")
    for (const phrase of [
      "直前の不合格レビューは無い",
      "番号付き指摘",
      "2 回連続",
      "要求のレビュー手順の直前は使わない",
      "設計のレビュー手順の直前は使わない",
      "別の agent 起動",
      "本文が直前と同じときは",
      "次のレビューを起動しない",
      "修正役を起動しない",
      "このやり直しをしない",
      "失敗理由の固定文言は書かない",
      "その都度、条件を満たす日本語の一行を出す",
      "`実装レビューが不合格のまま10回に達した` ではない",
      "`レビューの判定がありません` ではない",
      "確認行は、この止まりの条件に含めない",
      "実装レビューが不合格のまま10回に達した",
    ]) {
      expect(reviewSection).toContain(phrase)
    }

    expect(reviewSection).toContain("確認: あり")
    expect(reviewSection).toContain("確認: なし")
    expect(reviewSection).toContain("では分岐しない")
  })
})
