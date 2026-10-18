import { describe, expect, test } from "bun:test"
import { access, readFile } from "node:fs/promises"
import path from "node:path"

const agentsDir = path.join(import.meta.dir, "../agents")

const abolished = [
  "sdd-cur-req-fix-proposer.md",
  "sdd-cur-design-fix-proposer.md",
  "sdd-cur-implement-fix-proposer.md",
] as const

const expected = [
  {
    file: "sdd-cur-req-author.md",
    name: "sdd-cur-req-author",
    model: "grok-4.7-high",
    bodyIncludes: ["決定", "質問のスコアは書かない", "課題のコメントで確認する"],
  },
  {
    file: "sdd-cur-req-reviewer.md",
    name: "sdd-cur-req-reviewer",
    model: "grok-4.7-medium",
    bodyIncludes: [
      "判定: 合格",
      "判定: 不合格",
      "確認: あり",
      "確認: なし",
      "全文は書かない",
      "E1",
      "E2",
      "E3",
      "義務を二つ以上",
      "二通り以上に読める",
      "判定できない",
      "同時に満たせない",
      "未決",
      "サブエージェント四つ",
    ],
  },
  {
    file: "sdd-cur-req-fixer.md",
    name: "sdd-cur-req-fixer",
    model: "composer-2.5[fast=false]",
    bodyIncludes: ["人が決めた条件", "決定", "質問のスコアは書かない", "差分"],
  },
  {
    file: "sdd-cur-design-author.md",
    name: "sdd-cur-design-author",
    model: "grok-4.7-high",
    bodyIncludes: [] as string[],
  },
  {
    file: "sdd-cur-design-reviewer.md",
    name: "sdd-cur-design-reviewer",
    model: "grok-4.7-medium",
    bodyIncludes: [
      "判定: 合格",
      "判定: 不合格",
      "確認: あり",
      "確認: なし",
      "全文は書かない",
    ],
  },
  {
    file: "sdd-cur-design-fixer.md",
    name: "sdd-cur-design-fixer",
    model: "composer-2.5[fast=false]",
    bodyIncludes: ["差分"],
  },
  {
    file: "sdd-cur-implement-author.md",
    name: "sdd-cur-implement-author",
    model: "composer-2.5[fast=false]",
    bodyIncludes: [] as string[],
  },
  {
    file: "sdd-cur-implement-reviewer.md",
    name: "sdd-cur-implement-reviewer",
    model: "grok-4.7-medium",
    bodyIncludes: [
      "判定: 合格",
      "判定: 不合格",
      "全文は書かない",
      "人に確認しない",
    ],
  },
  {
    file: "sdd-cur-implement-fixer.md",
    name: "sdd-cur-implement-fixer",
    model: "composer-2.5[fast=false]",
    bodyIncludes: ["差分", "人に確認しない"],
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

  for (const file of abolished) {
    test(`${file} は存在しない`, async () => {
      await expect(access(path.join(agentsDir, file))).rejects.toThrow()
    })
  }
})
