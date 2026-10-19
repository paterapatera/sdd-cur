import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { subagentFileNames } from "./install.ts"

const root = path.join(import.meta.dir, "..")
const skillPath = path.join(root, "skills/sdd-cur/SKILL.md")
const explorePath = path.join(root, "agents/sdd-cur-explore.md")
const readmePath = path.join(root, "README.md")

const expectedFirstNine = [
  "sdd-cur-req-author.md",
  "sdd-cur-req-reviewer.md",
  "sdd-cur-req-fixer.md",
  "sdd-cur-design-author.md",
  "sdd-cur-design-reviewer.md",
  "sdd-cur-design-fixer.md",
  "sdd-cur-implement-author.md",
  "sdd-cur-implement-reviewer.md",
  "sdd-cur-implement-fixer.md",
] as const

function sectionBetween(text: string, startHeading: string, endHeading: string): string {
  const start = text.indexOf(startHeading)
  const end = text.indexOf(endHeading, start + startHeading.length)
  expect(start).toBeGreaterThanOrEqual(0)
  expect(end).toBeGreaterThan(start)
  return text.slice(start, end)
}

describe("課題 90", () => {
  test("SDD スキル、explore サブエージェント、install、README", async () => {
    const skill = await readFile(skillPath, "utf8")
    const explore = await readFile(explorePath, "utf8")
    const readme = await readFile(readmePath, "utf8")

    const idxChakushu = skill.indexOf("## 着手")
    const idxShiraberu = skill.indexOf("## 調べる")
    const idxYouken = skill.indexOf("## 要件")
    expect(idxChakushu).toBeGreaterThanOrEqual(0)
    expect(idxShiraberu).toBeGreaterThan(idxChakushu)
    expect(idxYouken).toBeGreaterThan(idxShiraberu)

    const beforeShiraberu = sectionBetween(skill, "## 着手", "## 調べる")
    for (const phrase of [
      "課題は閉じていると伝えて止まる",
      "実装のラベルが付いていると伝えて止まる",
      "`confirm` も `reflect` も実行しない",
    ]) {
      expect(beforeShiraberu).toContain(phrase)
    }

    const shiraberuSection = sectionBetween(skill, "## 調べる", "## 要件")
    for (const phrase of [
      "人が調査を依頼したときだけ",
      "人が調査を依頼していないときは",
      "課題番号が無いときは",
      "bun src/cli.ts show <番号>",
      "終了コードが 0 以外のときは",
      "サブエージェントを起動しない",
      "`state` が `open` でないとき",
      "業務ラベルが一つでもあるときは",
      "ファイルを変えず",
      "業務ラベルが無いときだけ",
      "sdd-cur-explore",
      "`model` は渡さない",
      "`show` が返した課題本文とコメント",
      "ファイルを書かない",
      "課題コメントを書かない",
      "ラベルを変えない",
      "作業ブランチは用意しない",
    ]) {
      expect(shiraberuSection).toContain(phrase)
    }

    expect(explore).toContain("name: sdd-cur-explore")
    expect(explore).toContain("model: composer-2.5[fast=false]")
    expect(explore).toContain("readonly: true")

    for (const phrase of [
      "今のコードを調べる",
      "課題番号に紐づく調査として",
      "課題本文とコメント",
      "`show` が返したもの",
      "`docs/spec/`",
      "`docs/specs/<番号>/`",
      "ファイルと行を根拠に答える",
      "示せないと答える",
      "ファイルを書かない",
      "課題コメントを書かない",
      "ラベルを変えない",
      "課題を作らない",
      "`gh` は起動しない",
      "`show` は実行しない",
    ]) {
      expect(explore).toContain(phrase)
    }

    expect(subagentFileNames).toHaveLength(10)
    expect(subagentFileNames[9]).toBe("sdd-cur-explore.md")
    expect([...subagentFileNames.slice(0, 9)]).toEqual([...expectedFirstNine])

    expect(readme).toContain("調べるだけの段")
    expect(readme).toContain("sdd-cur-explore")
    expect(readme).toContain("十個をコピーする")
  })
})
