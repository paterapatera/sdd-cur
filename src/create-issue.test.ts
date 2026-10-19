import { describe, expect, test } from "bun:test"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const createIssueSkillPath = path.join(
  import.meta.dir,
  "../skills/sdd-cur-create-issue/SKILL.md",
)
const cliPath = path.join(import.meta.dir, "cli.ts")

describe("skills/sdd-cur-create-issue/SKILL.md", () => {
  test("フロントマターと必須の文言", async () => {
    const text = await readFile(createIssueSkillPath, "utf8")
    expect(text.startsWith(`---
name: sdd-cur-create-issue
description: 人が内容を渡して明示して起動したときだけ、起動時の作業ツリーの git リポジトリに GitHub の課題を 1 件作る。作った課題は閉じない。
disable-model-invocation: true
---
`)).toBe(true)
    for (const phrase of [
      "# sdd-cur-create-issue",
      "## 作成",
      "## 禁止",
      "明示して起動",
      "人が渡した内容",
      "内容が欠けている",
      "スペースと改行だけ",
      "スペースと改行以外の文字",
      "不足を伝える",
      "git リポジトリでない",
      "題を決められない",
      "gh issue create",
      "`--repo` は付けない",
      "1 件",
      "番号と URL",
      "チャット",
      "課題を閉じない",
      "依頼が無いとき",
      "`bun src/cli.ts` では課題を作らない",
    ]) {
      expect(text).toContain(phrase)
    }
    expect(text).not.toContain("`gh` を直接起動しない")
    expect(text).not.toContain("issue close")
  })

  test("install が sdd-cur-create-issue をコピーする", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-create-issue-install-"))
    try {
      const proc = Bun.spawn(["bun", cliPath, "install", temp], {
        stdout: "pipe",
        stderr: "pipe",
      })
      expect(await proc.exited).toBe(0)
      const installed = await readFile(
        path.join(temp, ".cursor", "skills", "sdd-cur-create-issue", "SKILL.md"),
        "utf8",
      )
      const source = await readFile(createIssueSkillPath, "utf8")
      expect(installed).toBe(source)
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})
