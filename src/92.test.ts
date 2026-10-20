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
      "sdd-cur review-next",
      "`response`、`consecutiveFailures`、`previousFindings`、`brokenStampRetries`",
      "返った一行 JSON の `action`、`model`、`kind` に従う",
      "`reason` があるとき、その文字列を失敗の理由にする",
      "第1引数は `implement` である",
      "実装レビュー役を起動する前",
      "レビュー役は、設計の「テスト」節を実行しない",
    ]) {
      expect(reviewSection).toContain(phrase)
    }

    for (const phrase of [
      "直前の不合格レビューは無い",
      "2 回連続",
      "実装レビューが不合格のまま10回に達した",
      "レビューの判定がありません",
      "確認: あり",
      "確認: なし",
      "では分岐しない",
    ]) {
      expect(reviewSection).not.toContain(phrase)
    }
  })
})
