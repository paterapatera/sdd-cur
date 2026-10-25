import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { deltaSectionText } from "./conventions.ts"

const root = path.join(import.meta.dir, "..")
const skillDir = path.join(root, "skills/sdd-cur")
const stageNames = [
  "start.md",
  "explore.md",
  "requirements.md",
  "design.md",
  "confirm.md",
  "reflect.md",
  "after-pass.md",
] as const
const skillPath = path.join(skillDir, "SKILL.md")
const design168Path = path.join(root, "docs/issues/168/design.md")
const sddCanonicalPath = path.join(root, "docs/canonical/sdd.md")
const installCanonicalPath = path.join(root, "docs/canonical/install.md")
const frontmatterExpected = `---
name: sdd-cur
description: このプロジェクトの課題について、着手候補の提示、要件、設計、確認コメントの投稿、未反映の回答の取り込みを行う。着手、要件、設計、確認、回答の取り込みを依頼されたときに使う。課題は作らない。人が閉じるを選んだときに SDD スキルが閉じる場合を除き、課題は閉じない。ラベルの変更、実装、受け入れ手順、完了処理はしない。設計の合格の案内で人が「実装依頼する」を選んだときに \`sdd-cur request <番号>\` が「実装依頼」を付けることは、ラベルの変更をしない定めの例外である。そのときも、実装、受け入れ手順、完了処理はしない。
disable-model-invocation: true
---
`

function reqBody(text: string, id: string): string {
  const marker = `## ${id}`
  const lines = text.split("\n")
  const idx = lines.findIndex((line) => line === marker)
  if (idx < 0) {
    throw new Error(`${marker} が無い`)
  }
  const bodyLines: string[] = []
  for (let i = idx + 1; i < lines.length; i++) {
    if (/^## REQ-/.test(lines[i])) {
      break
    }
    bodyLines.push(lines[i])
  }
  while (bodyLines.length > 0 && bodyLines[0] === "") {
    bodyLines.shift()
  }
  while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] === "") {
    bodyLines.pop()
  }
  return bodyLines.join("\n")
}

function parseDeltaBodies(
  design: string,
  domain: "sdd" | "install",
): Map<string, string> {
  const section = deltaSectionText(design)
  const headingRe = /^### (追加|変更|削除) (sdd|install) (REQ-\d+)\n\n/gm
  const headings: {
    id: string
    domain: string
    contentStart: number
    start: number
  }[] = []
  for (const match of section.matchAll(headingRe)) {
    headings.push({
      domain: match[2],
      id: match[3],
      start: match.index ?? 0,
      contentStart: (match.index ?? 0) + match[0].length,
    })
  }
  const bodies = new Map<string, string>()
  for (let i = 0; i < headings.length; i += 1) {
    if (headings[i].domain !== domain) {
      continue
    }
    const end =
      i + 1 < headings.length ? headings[i + 1].start : section.length
    bodies.set(
      headings[i].id,
      section.slice(headings[i].contentStart, end).replace(/\n+$/, ""),
    )
  }
  return bodies
}

describe("168", () => {
  test("requirements.md に要件の段がある", async () => {
    const text = await readFile(
      path.join(skillDir, "requirements.md"),
      "utf8",
    )
    expect(text).toContain("## 要件")
  })

  test("七段ファイルと入口 SKILL.md", async () => {
    for (const name of stageNames) {
      await expect(readFile(path.join(skillDir, name), "utf8")).resolves.toBeTypeOf(
        "string",
      )
    }
    const skill = await readFile(skillPath, "utf8")
    expect(skill.startsWith(frontmatterExpected)).toBe(true)
    for (const heading of [
      "\n## 着手\n",
      "\n## 要件\n",
      "\n## 合格のあとの案内\n",
      "\n### 満たされているかの判断\n",
    ]) {
      expect(skill).not.toContain(heading)
    }
    expect(skill).toContain("## 禁止")
    expect(skill).toContain("段の一覧は、次の七つである。")
    expect(skill).toContain("まずこの `SKILL.md` を読む。")
    expect(skill).toContain("リポジトリのルートで `sdd-cur` を使う。")
    expect(skill).toContain("作業の前に `sdd-cur/conventions.md` を読む。")
    expect(skill).toContain("仕様へ書く挙動は、対象課題にあるものだけである。")
    const afterPass = await readFile(path.join(skillDir, "after-pass.md"), "utf8")
    const reflect = await readFile(path.join(skillDir, "reflect.md"), "utf8")
    expect(afterPass.indexOf("### 満たされているかの判断")).toBeLessThan(
      afterPass.indexOf("## 合格のあとの案内"),
    )
    expect(reflect).not.toContain("\n### 満たされているかの判断\n")
  })

  test("after-pass.md に判断と合格案内がある", async () => {
    const text = await readFile(path.join(skillDir, "after-pass.md"), "utf8")
    expect(text).toContain("### 満たされているかの判断")
    expect(text).toContain("## 合格のあとの案内")
  })

  test("移動のみで本文が一致する", async () => {
    const parts = await Promise.all(
      stageNames.map((name) => readFile(path.join(skillDir, name), "utf8")),
    )
    const newCombined = parts.map((part) => part.trimEnd()).join("\n")
    expect(newCombined).toContain("## 着手")
    expect(newCombined).toContain("### 満たされているかの判断")
    expect(newCombined).toContain("## 合格のあとの案内")
    expect(newCombined.indexOf("## 着手")).toBeLessThan(
      newCombined.indexOf("## 調べる"),
    )
    expect(newCombined.indexOf("### 満たされているかの判断")).toBeLessThan(
      newCombined.indexOf("## 合格のあとの案内"),
    )
    expect(newCombined).toContain(
      "`after-pass.md` の `## 合格のあとの案内` に従う",
    )
    expect(newCombined).toContain(
      "`design.md` の `## 設計` の手順の先頭から",
    )
  })

  test("正本への差分", async () => {
    const design = await readFile(design168Path, "utf8")
    const sdd = await readFile(sddCanonicalPath, "utf8")
    const install = await readFile(installCanonicalPath, "utf8")
    const sddDeltas = parseDeltaBodies(design, "sdd")
    const installDeltas = parseDeltaBodies(design, "install")
    for (const id of [
      "REQ-956",
      "REQ-367",
      "REQ-153",
      "REQ-947",
      "REQ-279",
      "REQ-753",
      "REQ-938",
    ]) {
      expect(reqBody(sdd, id)).toBe(sddDeltas.get(id) ?? "")
    }
    expect(reqBody(install, "REQ-943")).toBe(installDeltas.get("REQ-943") ?? "")
    expect(reqBody(install, "REQ-858")).toBe(installDeltas.get("REQ-858") ?? "")
  })
})
