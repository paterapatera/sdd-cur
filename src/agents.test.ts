import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"

const agentsDir = path.join(import.meta.dir, "../agents")

const expected = [
  {
    file: "sdd-cur-req-author.md",
    name: "sdd-cur-req-author",
    model: "grok-4.7[reasoning_effort=high,fast=false]",
    bodyIncludes: [] as string[],
  },
  {
    file: "sdd-cur-req-reviewer.md",
    name: "sdd-cur-req-reviewer",
    model: "grok-4.7[reasoning_effort=medium,fast=false]",
    bodyIncludes: ["判定: 合格", "判定: 不合格"],
  },
  {
    file: "sdd-cur-req-fix-proposer.md",
    name: "sdd-cur-req-fix-proposer",
    model: "grok-4.7[reasoning_effort=high,fast=false]",
    bodyIncludes: ["確認: あり", "確認: なし"],
  },
  {
    file: "sdd-cur-req-fixer.md",
    name: "sdd-cur-req-fixer",
    model: "composer-2.5[fast=false]",
    bodyIncludes: [] as string[],
  },
  {
    file: "sdd-cur-design-author.md",
    name: "sdd-cur-design-author",
    model: "grok-4.7[reasoning_effort=high,fast=false]",
    bodyIncludes: [] as string[],
  },
  {
    file: "sdd-cur-design-reviewer.md",
    name: "sdd-cur-design-reviewer",
    model: "grok-4.7[reasoning_effort=medium,fast=false]",
    bodyIncludes: ["判定: 合格", "判定: 不合格"],
  },
  {
    file: "sdd-cur-design-fix-proposer.md",
    name: "sdd-cur-design-fix-proposer",
    model: "grok-4.7[reasoning_effort=high,fast=false]",
    bodyIncludes: ["確認: あり", "確認: なし"],
  },
  {
    file: "sdd-cur-design-fixer.md",
    name: "sdd-cur-design-fixer",
    model: "composer-2.5[fast=false]",
    bodyIncludes: [] as string[],
  },
  {
    file: "sdd-cur-implement-author.md",
    name: "sdd-cur-implement-author",
    model: "grok-4.7[reasoning_effort=high,fast=false]",
    bodyIncludes: [] as string[],
  },
  {
    file: "sdd-cur-implement-reviewer.md",
    name: "sdd-cur-implement-reviewer",
    model: "grok-4.7[reasoning_effort=medium,fast=false]",
    bodyIncludes: ["判定: 合格", "判定: 不合格"],
  },
  {
    file: "sdd-cur-implement-fix-proposer.md",
    name: "sdd-cur-implement-fix-proposer",
    model: "grok-4.7[reasoning_effort=high,fast=false]",
    bodyIncludes: ["確認: なし", "人に確認しない"],
  },
  {
    file: "sdd-cur-implement-fixer.md",
    name: "sdd-cur-implement-fixer",
    model: "composer-2.5[fast=false]",
    bodyIncludes: [] as string[],
  },
] as const

describe("agents/*.md", () => {
  for (const item of expected) {
    test(`${item.file} の frontmatter`, async () => {
      const text = await readFile(path.join(agentsDir, item.file), "utf8")
      expect(text).toContain(`name: ${item.name}`)
      expect(text).toContain(`model: ${item.model}`)
      for (const phrase of item.bodyIncludes) {
        expect(text).toContain(phrase)
      }
    })
  }
})
