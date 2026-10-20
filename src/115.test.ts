import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = join(import.meta.dir, "..")

const skillSubcommandOrder = [
  "candidates",
  "show",
  "branch",
  "validate",
  "confirm",
  "reflect",
  "review-next",
  "complete",
  "close",
] as const

const excludedFromSkillExamples = [
  "install",
  "run",
  "labels",
  "restore",
  "spec-check",
  "request",
] as const

const bunxPrefix = "bunx @paterapatera/sdd-cur"

const expectedBunxLines = [
  `${bunxPrefix} candidates`,
  `${bunxPrefix} show <番号>`,
  `${bunxPrefix} branch <番号>`,
  `${bunxPrefix} validate <番号>`,
  `${bunxPrefix} confirm <番号>`,
  `${bunxPrefix} reflect <番号> <requirements|design>`,
  `${bunxPrefix} review-next requirements <番号>`,
  `${bunxPrefix} review-next reflect-design <番号>`,
  `${bunxPrefix} review-next quick <番号>`,
  `${bunxPrefix} review-next implement <番号>`,
  `${bunxPrefix} complete <番号>`,
  `${bunxPrefix} close <番号>`,
  "bun test",
] as const

const expectedSddCurLines = [
  "sdd-cur candidates",
  "sdd-cur show <番号>",
  "sdd-cur branch <番号>",
  "sdd-cur validate <番号>",
  "sdd-cur confirm <番号>",
  "sdd-cur reflect <番号> <requirements|design>",
  "sdd-cur review-next requirements <番号>",
  "sdd-cur review-next reflect-design <番号>",
  "sdd-cur review-next quick <番号>",
  "sdd-cur review-next implement <番号>",
  "sdd-cur complete <番号>",
  "sdd-cur close <番号>",
] as const

function sorted(set: Set<string>): string[] {
  return [...set].sort()
}

function codeFencesAfter(text: string, heading: string): string[] {
  const idx = text.indexOf(heading)
  expect(idx).toBeGreaterThanOrEqual(0)
  let after = text.slice(idx + heading.length)
  const fences: string[] = []
  while (true) {
    const fenceStart = after.indexOf("```")
    if (fenceStart < 0) break
    const rest = after.slice(fenceStart + 3)
    const langEnd = rest.indexOf("\n")
    const bodyStart = langEnd === -1 ? 0 : langEnd + 1
    const fenceEnd = rest.indexOf("```", bodyStart)
    if (fenceEnd < 0) break
    fences.push(rest.slice(bodyStart, fenceEnd))
    after = rest.slice(fenceEnd + 3)
  }
  return fences
}

function sectionBetween(
  text: string,
  startHeading: string,
  endHeading: string,
): string {
  const start = text.indexOf(startHeading)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = text.indexOf(endHeading, start + startHeading.length)
  expect(end).toBeGreaterThan(start)
  return text.slice(start, end)
}

function commandLinesInFence(fence: string): string[] {
  return fence
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function subcommandNamesFromSkillCodeFence(fence: string): Set<string> {
  const names = new Set<string>()
  for (const line of commandLinesInFence(fence)) {
    if (line === "bun test") continue
    if (line.startsWith("bunx @paterapatera/sdd-cur ")) {
      const rest = line.slice("bunx @paterapatera/sdd-cur ".length)
      names.add(rest.split(/\s+/)[0]!)
      continue
    }
    if (line.startsWith("sdd-cur ")) {
      const rest = line.slice("sdd-cur ".length)
      names.add(rest.split(/\s+/)[0]!)
    }
  }
  return names
}

function firstMarkdownTableIn(text: string): string {
  const lines: string[] = []
  let inTable = false
  for (const line of text.split("\n")) {
    if (line.startsWith("|")) {
      inTable = true
      lines.push(line)
    } else if (inTable) {
      break
    }
  }
  expect(lines.length).toBeGreaterThan(0)
  return lines.join("\n")
}

function subcommandNamesInTableOrder(table: string): string[] {
  const names: string[] = []
  for (const line of table.split("\n")) {
    if (!line.startsWith("|")) continue
    if (line.includes("---")) continue
    const m = line.match(/^\| `([^`]+)` \|/)
    if (m) names.push(m[1])
  }
  return names
}

function subcommandsFromMarkdownTable(table: string): Set<string> {
  return new Set(subcommandNamesInTableOrder(table))
}

describe("課題 115 README のコマンド表記", () => {
  const readme = readFileSync(join(root, "README.md"), "utf8")
  const devSection = sectionBetween(
    readme,
    "## 開発中の起動",
    "## 公開後の起動",
  )
  const publicSection = sectionBetween(readme, "## 公開後の起動", "## 役割")
  const roleSection = sectionBetween(readme, "## 役割", "## ラベル")

  test("README 全体と開発中の起動に bun src/cli.ts が無く、使い方の文が sdd-cur 系である", () => {
    expect(readme).not.toContain("bun src/cli.ts")

    const fences = codeFencesAfter(readme, "## 開発中の起動")
    for (const fence of fences) {
      expect(fence).not.toContain("bun src/cli.ts")
    }

    const usageLine = devSection
      .split("\n")
      .find((line) => line.includes("使い方は"))
    expect(usageLine).toBeDefined()
    expect(usageLine!).toContain("sdd-cur --help")
    expect(usageLine!).toContain("bunx @paterapatera/sdd-cur --help")
    expect(usageLine!).not.toContain("bun src/cli.ts")
  })

  test("開発中の起動の二つのコードフェンスのコマンド行", () => {
    const fences = codeFencesAfter(readme, "## 開発中の起動")
    expect(fences.length).toBeGreaterThanOrEqual(2)

    const bunxFence = fences[0]
    expect(commandLinesInFence(bunxFence)).toEqual([...expectedBunxLines])
    for (const line of commandLinesInFence(bunxFence)) {
      if (line === "bun test") continue
      expect(line.startsWith("bunx @paterapatera/sdd-cur")).toBe(true)
    }

    const sddCurFence = fences[1]
    expect(commandLinesInFence(sddCurFence)).toEqual([...expectedSddCurLines])
    for (const line of commandLinesInFence(sddCurFence)) {
      expect(line.startsWith("sdd-cur")).toBe(true)
    }
  })

  test("スキル呼び出し分の例のサブコマンド名に主集合外が無く bun test を数えない", () => {
    const fences = codeFencesAfter(readme, "## 開発中の起動")
    const fromFences = new Set<string>()
    for (const fence of fences.slice(0, 2)) {
      for (const name of subcommandNamesFromSkillCodeFence(fence)) {
        fromFences.add(name)
      }
    }
    for (const excluded of excludedFromSkillExamples) {
      expect(fromFences.has(excluded)).toBe(false)
    }
    expect(fromFences.has("bun test")).toBe(false)
    expect([...fromFences]).toEqual([...skillSubcommandOrder])
  })

  test("開発中の起動の表のサブコマンド名", () => {
    const table = firstMarkdownTableIn(devSection)
    const tableOrder = subcommandNamesInTableOrder(table)
    expect(tableOrder).toContain("bun test")
    const tableSkillNames = new Set(
      tableOrder.filter((name) => name !== "bun test"),
    )
    expect(sorted(tableSkillNames)).toEqual([...skillSubcommandOrder].sort())

    const fromTable = subcommandsFromMarkdownTable(table)

    for (const excluded of excludedFromSkillExamples) {
      expect(fromTable.has(excluded)).toBe(false)
    }
  })

  test("install run request は別節、公開後と役割のコマンド例", () => {
    const devNames = subcommandNamesFromSkillCodeFence(
      codeFencesAfter(readme, "## 開発中の起動")[0],
    )
    for (const name of ["install", "run", "request"] as const) {
      expect(devNames.has(name)).toBe(false)
    }
    const devTable = subcommandsFromMarkdownTable(firstMarkdownTableIn(devSection))
    for (const name of ["install", "run", "request"] as const) {
      expect(devTable.has(name)).toBe(false)
    }

    expect(publicSection).toContain(
      "bunx @paterapatera/sdd-cur install [project-root]",
    )
    expect(publicSection).toContain(
      "bunx @paterapatera/sdd-cur run [--interval-min <分>]",
    )
    expect(publicSection).toContain("sdd-cur install")
    expect(publicSection).toContain("sdd-cur run")

    expect(roleSection).toContain("sdd-cur request <番号>")
    expect(roleSection).not.toContain("bun src/cli.ts")
  })

  test("入れ方とスキルが sdd-cur で呼ぶ説明", () => {
    expect(readme).toContain("bun add -g @paterapatera/sdd-cur")
    expect(devSection).toContain("スキルが CLI を `sdd-cur` コマンドで呼ぶ。")
    expect(devSection).toContain(
      "その `sdd-cur` コマンドによる呼び出しは、このリポジトリ以外のプロジェクトでも動く。",
    )
  })

  test("docs.test.ts は README の開発中の起動フェンスを cli と比べない", () => {
    const docsTest = readFileSync(join(root, "src/docs.test.ts"), "utf8")
    expect(docsTest).not.toContain(
      'firstCodeFenceAfter(readme, "## 開発中の起動")',
    )
  })
})
