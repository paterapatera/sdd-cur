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
description: 人が明示して起動したときだけ、課題のタイプを人に聞いてから、そのタイプの質問の答えで本文を組み立て、起動時の作業ツリーの git リポジトリに GitHub の課題を作る。渡した内容が分割案の形のときは、一回の起動で子の行ごとに課題を作る。作った課題は閉じない。
disable-model-invocation: true
---
`)).toBe(true)
    for (const phrase of [
      "# sdd-cur-create-issue",
      "## 作成",
      "## 禁止",
      "明示して起動",
      "課題のタイプ",
      "スペースと改行だけ",
      "スペースと改行以外の文字",
      "git リポジトリでない",
      "題を決められない",
      "gh issue create",
      "`--repo` は付けない",
      "1 件",
      "番号と URL",
      "チャット",
      "課題を閉じない",
      "依頼が無いとき",
      "`sdd-cur` では課題を作らない",
    ]) {
      expect(text).toContain(phrase)
    }
    expect(text).not.toContain("`gh` を直接起動しない")
    expect(text).not.toContain("issue close")
  })

  test("[172][30] 分割案の形のとき子ごと、でないとき 1 件", async () => {
    const text = await readFile(createIssueSkillPath, "utf8")
    expect(text).toContain("子の行ごとに課題を作る")
    expect(text).toContain("分割案の形でないときに限り、`gh issue create` を 1 回実行し、課題を 1 件作る")
    expect(text).toContain("分割案:")
    expect(text).toContain("一件ずつ選ぶ")
  })

  test("[172][68] 受け入れ条件 68 の文言", async () => {
    const text = await readFile(createIssueSkillPath, "utf8")
    for (const phrase of [
      "git リポジトリでない旨を伝える",
      "番号と URL",
      "課題を閉じない",
      "ラベル、担当者、マイルストーンは付けない",
      "`--repo` は付けない",
      "`sdd-cur` では課題を作らない",
      "依頼が無いときは、課題を作らない",
      "明示して起動していないときは、課題を作らない",
      "作業の前に `sdd-cur/conventions.md` を読む。",
    ]) {
      expect(text).toContain(phrase)
    }
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
