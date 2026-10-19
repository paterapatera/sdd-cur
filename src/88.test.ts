import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"

const skillPath = path.join(import.meta.dir, "../skills/sdd-cur/SKILL.md")

describe("issue 88 skills/sdd-cur/SKILL.md 設計", () => {
  test("課題全体が大きすぎるときの止まりと作成一回の文言", async () => {
    const text = await readFile(skillPath, "utf8")
    const requirementsStart = text.indexOf("## 要件")
    const designStart = text.indexOf("## 設計")
    const confirmStart = text.indexOf("## 確認")
    const requirementsSlice = text.slice(requirementsStart, designStart)
    const designSlice = text.slice(designStart, confirmStart)

    for (const phrase of [
      "課題全体が大きすぎる",
      "人の判断を待つ",
      "設計修正役を起動しない",
    ]) {
      expect(designSlice).toContain(phrase)
    }

    expect(requirementsSlice).toContain("作成から合格まで 1 回")
    expect(designSlice).toContain(
      "設計作成役を起動する前には `validate` を実行しない",
    )
    expect(designSlice).toContain("比較を通ったあとだけ、設計作成役を起動する")
  })
})
