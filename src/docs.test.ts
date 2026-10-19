import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const root = join(import.meta.dir, "..")
const expectedHighModel =
  "grok-4.7[context=256k,reasoning_effort=high,fast=false]"

function sorted(set: Set<string>): string[] {
  return [...set].sort()
}

function cliSubcommandNames(): Set<string> {
  const text = readFileSync(join(root, "src/cli.ts"), "utf8")
  const names = new Set<string>()
  for (const m of text.matchAll(/case "([^"]+)":/g)) {
    names.add(m[1])
  }
  return names
}

function backtickNamesInText(text: string): Set<string> {
  const names = new Set<string>()
  for (const m of text.matchAll(/`([^`]+)`/g)) {
    names.add(m[1])
  }
  return names
}

function subcommandsFromCliCodeFence(fence: string): Set<string> {
  const names = new Set<string>()
  for (const line of fence.split("\n")) {
    const trimmed = line.trim()
    if (trimmed === "bun test") continue
    const parts = trimmed.split(/\s+/)
    if (parts[0] === "bun" && parts[1] === "src/cli.ts" && parts[2]) {
      names.add(parts[2])
    }
  }
  return names
}

function firstCodeFenceAfter(text: string, heading: string): string {
  const idx = text.indexOf(heading)
  expect(idx).toBeGreaterThanOrEqual(0)
  const after = text.slice(idx + heading.length)
  const fenceStart = after.indexOf("```")
  expect(fenceStart).toBeGreaterThanOrEqual(0)
  const rest = after.slice(fenceStart + 3)
  const langEnd = rest.indexOf("\n")
  const bodyStart = langEnd === -1 ? 0 : langEnd + 1
  const fenceEnd = rest.indexOf("```", bodyStart)
  expect(fenceEnd).toBeGreaterThanOrEqual(0)
  return rest.slice(bodyStart, fenceEnd)
}

function firstMarkdownTableAfter(text: string, afterIndex: number): string {
  const after = text.slice(afterIndex)
  const lines = after.split("\n")
  let start = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("|") && lines[i].includes("---")) {
      start = i - 1
      break
    }
  }
  expect(start).toBeGreaterThanOrEqual(0)
  const tableLines: string[] = []
  for (let i = start; i < lines.length; i++) {
    if (!lines[i].startsWith("|")) break
    tableLines.push(lines[i])
  }
  return tableLines.join("\n")
}

function subcommandsFromMarkdownTable(table: string): Set<string> {
  const names = new Set<string>()
  for (const line of table.split("\n")) {
    if (!line.startsWith("|") || line.includes("---")) continue
    const m = line.match(/^\|\s*`([^`]+)`\s*\|/)
    if (!m) continue
    if (m[1] === "bun test") continue
    names.add(m[1])
  }
  return names
}

function agentsCliTableRoleCell(agents: string): string {
  for (const line of agents.split("\n")) {
    if (line.startsWith("| `src/cli.ts` |")) {
      const parts = line.split("|")
      return parts[2]?.trim() ?? ""
    }
  }
  throw new Error("AGENTS.md に src/cli.ts の行がありません")
}

function skillDirNames(): Set<string> {
  const skillsRoot = join(root, "skills")
  const names = new Set<string>()
  for (const ent of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (ent.isDirectory()) names.add(ent.name)
  }
  return names
}

function skillNamesFromInstallSentence(readme: string): Set<string> {
  const line = readme
    .split("\n")
    .find((l) => l.includes("`install` がコピーするスキルは"))
  expect(line).toBeDefined()
  const names = new Set<string>()
  for (const m of line!.matchAll(/`skills\/([^`/]+)`/g)) {
    names.add(m[1])
  }
  return names
}

function skillNamesFromDirectoryDiagram(readme: string): Set<string> {
  const heading = "## ディレクトリ"
  const fence = firstCodeFenceAfter(readme, heading)
  const names = new Set<string>()
  for (const line of fence.split("\n")) {
    const trimmed = line.trimStart()
    const m = trimmed.match(/^skills\/([^/]+)\//)
    if (m) names.add(m[1])
  }
  return names
}

function raisedModelFromSkill(text: string): string | null {
  const m = text.match(/model に `([^`]+)` を渡す/)
  return m ? m[1] : null
}

function frontmatterModel(agentText: string): string {
  const m = agentText.match(/^---\n[\s\S]*?\nmodel:\s*(.+)\n[\s\S]*?---/)
  expect(m).not.toBeNull()
  return m![1].trim()
}

describe("docs と skills の整合", () => {
  test("サブコマンド一覧が cli.ts の switch と一致する", () => {
    const expected = cliSubcommandNames()
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8")
    const readme = readFileSync(join(root, "README.md"), "utf8")

    const fromAgentsTable = backtickNamesInText(agentsCliTableRoleCell(agents))
    expect(sorted(fromAgentsTable)).toEqual(sorted(expected))

    const agentsFence = firstCodeFenceAfter(agents, "## コマンド")
    expect(sorted(subcommandsFromCliCodeFence(agentsFence))).toEqual(
      sorted(expected),
    )

    const readmeFence = firstCodeFenceAfter(readme, "## 開発中の起動")
    expect(sorted(subcommandsFromCliCodeFence(readmeFence))).toEqual(
      sorted(expected),
    )

    const fenceEnd =
      readme.indexOf("## 開発中の起動") +
      readme.slice(readme.indexOf("## 開発中の起動")).indexOf("```", 3) +
      3
    const table = firstMarkdownTableAfter(readme, fenceEnd)
    expect(sorted(subcommandsFromMarkdownTable(table))).toEqual(sorted(expected))
  })

  test("README のスキル記述が skills/ 直下のディレクトリと一致する", () => {
    const expected = skillDirNames()
    const readme = readFileSync(join(root, "README.md"), "utf8")
    expect(sorted(skillNamesFromInstallSentence(readme))).toEqual(
      sorted(expected),
    )
    expect(sorted(skillNamesFromDirectoryDiagram(readme))).toEqual(
      sorted(expected),
    )
  })

  test("上げたあとのモデル名が揃い、grok-4.7-high が無い", () => {
    const reqAuthor = readFileSync(
      join(root, "agents/sdd-cur-req-author.md"),
      "utf8",
    )
    const designAuthor = readFileSync(
      join(root, "agents/sdd-cur-design-author.md"),
      "utf8",
    )
    expect(frontmatterModel(reqAuthor)).toBe(expectedHighModel)
    expect(frontmatterModel(designAuthor)).toBe(expectedHighModel)

    const skillsRoot = join(root, "skills")
    for (const ent of readdirSync(skillsRoot, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue
      const skillPath = join(skillsRoot, ent.name, "SKILL.md")
      const text = readFileSync(skillPath, "utf8")
      expect(text).not.toContain("grok-4.7-high")
      const raised = raisedModelFromSkill(text)
      if (raised !== null) {
        expect(raised).toBe(expectedHighModel)
      }
    }

    const agentsDir = join(root, "agents")
    for (const name of readdirSync(agentsDir)) {
      if (!name.endsWith(".md")) continue
      const text = readFileSync(join(agentsDir, name), "utf8")
      expect(text).not.toContain("grok-4.7-high")
    }
  })

  test("AGENTS.md の課題作成の記述", () => {
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8")
    expect(agents).toContain(
      "人が明示して起動したときに、`skills/sdd-cur-create-issue` が課題を作る。",
    )
    expect(agents).toContain("課題ランナーは課題を作らない。")
    expect(agents).not.toContain("SDD スキルも課題ランナーも、課題を作らない")
  })
})
