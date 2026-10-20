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

function policyCliTableRoleCell(policy: string): string {
  for (const line of policy.split("\n")) {
    if (line.startsWith("| `src/cli.ts` |")) {
      const parts = line.split("|")
      return parts[2]?.trim() ?? ""
    }
  }
  throw new Error("docs/policy.md に src/cli.ts の行が無い")
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
    const policy = readFileSync(join(root, "docs/policy.md"), "utf8")
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8")

    const fromPolicyTable = backtickNamesInText(policyCliTableRoleCell(policy))
    expect(sorted(fromPolicyTable)).toEqual(sorted(expected))

    const agentsFence = firstCodeFenceAfter(agents, "## コマンド")
    expect(sorted(subcommandsFromCliCodeFence(agentsFence))).toEqual(
      sorted(expected),
    )
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

  test("docs/policy.md の課題作成の記述", () => {
    const policy = readFileSync(join(root, "docs/policy.md"), "utf8")
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8")
    const readme = readFileSync(join(root, "README.md"), "utf8")

    expect(policy).toContain(
      "人が明示して起動したときに、`skills/sdd-cur-create-issue` が課題を作る。",
    )
    expect(policy).toContain("課題ランナーは課題を作らない。")
    expect(policy).not.toContain("SDD スキルも課題ランナーも、課題は作らない")
    expect(agents).not.toContain("SDD スキルも課題ランナーも、課題は作らない")

    expect(agents).toContain("docs/policy.md")
    expect(agents).not.toContain("## 構成")
    expect(agents).not.toContain("## 文言")
    expect(agents).not.toContain("依存パッケージは置かない。")
    expect(agents).not.toContain("設計に書いた「範囲外」は作らない。")
    expect(agents).not.toContain(
      "利用者向けのメッセージ、ドキュメント、コミットメッセージの説明は日本語で書く。",
    )
    expect(agents).not.toContain(
      "人が明示して起動したときに、`skills/sdd-cur-create-issue` が課題を作る。",
    )

    expect(policy).toContain("依存パッケージは置かない。")
    expect(policy).toContain("設計に書いた「範囲外」は作らない。")
    expect(policy).toContain(
      "利用者向けのメッセージ、ドキュメント、コミットメッセージの説明は日本語で書く。",
    )

    expect(readme).toContain("docs/policy.md")
    expect(readme).not.toContain("依存パッケージは置かない。")
    expect(readme).not.toContain("TypeScript は Bun が直接実行する。")
    expect(readme).not.toContain("お客さまの確認が取れてから、人が閉じる。")
  })
})
