import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"

const root = path.join(import.meta.dir, "..")
const skillPath = path.join(root, "skills/sdd-cur-implement/SKILL.md")
const reviewerPath = path.join(root, "agents/sdd-cur-implement-reviewer.md")

function bodyAfterFrontmatter(text: string): string {
  const fmEnd = text.indexOf("\n---\n", 4)
  if (fmEnd === -1) return text
  return text.slice(fmEnd + 5)
}

function parseImplementReviewerFrontmatter(text: string): {
  model: string
  readonly?: boolean
} {
  const m = text.match(
    /^---\nname: [^\n]+\nmodel: ([^\n]+)\n(?:description:[^\n]*\n)*(?:readonly: (true)\n)?---/,
  )
  if (!m) {
    throw new Error("frontmatter")
  }
  return {
    model: m[1],
    readonly: m[2] === "true" ? true : undefined,
  }
}

describe("課題 93", () => {
  test("設計の「テスト」節の実行主体と実装レビュー役", async () => {
    const skill = await readFile(skillPath, "utf8")

    for (const phrase of [
      "実装レビュー役を起動する前",
      "起動するたび",
      "レビュー役は、設計の「テスト」節を実行しない",
      "作業ツリー",
      "書かれた順にすべて実行する",
      "残りの節を飛ばさない",
      "実行したコマンドが無い",
      "readonly: true",
      "親は外さない",
      "実装の意図的な編集はしない",
      "この優先は、親が「テスト」節を実行するときだけである",
    ]) {
      expect(skill).toContain(phrase)
    }

    for (const phrase of [
      "一時ディレクトリ",
      "既存のテスト用一時ファイル",
      "テスト節の実行省略",
      "親は実行しない",
      "テスト節の実行は、レビュー役が行う",
      "上の実行省略のやり直し",
      "実行を省略する",
    ]) {
      expect(skill).not.toContain(phrase)
    }

    expect(skill).toContain("印が壊れている")
    expect(skill).toContain("sdd-cur review-next")
    for (const phrase of [
      "実装レビューが不合格のまま10回に達した",
      "レビューの判定がありません",
      "grok-4.7[context=256k,reasoning_effort=high,fast=false]",
    ]) {
      expect(skill).not.toContain(phrase)
    }

    const reviewer = await readFile(reviewerPath, "utf8")
    const fm = parseImplementReviewerFrontmatter(reviewer)
    expect(fm.readonly).toBe(true)
    expect(fm.model).toBe(
      "grok-4.7[context=256k,reasoning_effort=medium,fast=false]",
    )

    const body = bodyAfterFrontmatter(reviewer)
    for (const phrase of [
      "設計の「テスト」節を実行しない",
      "終了コードが 0 以外",
      "終了コードが 0 のコマンドは、失敗ではない",
      "実行したコマンドが無い",
      "readonly: true",
      "実装の意図的な編集はしない",
      "実装の指摘なし",
    ]) {
      expect(body).toContain(phrase)
    }

    for (const phrase of [
      "一時ディレクトリ",
      "既存のテスト用一時ファイル",
      "テスト節の実行省略",
      "バッククォートまたはコードフェンス",
      "書かれた順にすべて実行する",
      "残りの節を飛ばさない",
    ]) {
      expect(body).not.toContain(phrase)
    }
  })
})
