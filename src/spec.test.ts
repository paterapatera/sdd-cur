import { describe, expect, test } from "bun:test"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const root = join(import.meta.dir, "..")
const specDir = join(root, "docs/canonical")

function parseRequirements(text: string): { id: string; body: string }[] {
  const reqs: { id: string; body: string }[] = []
  const lines = text.split("\n")
  let i = 0
  while (i < lines.length) {
    const m = lines[i].match(/^## (REQ-\d+)$/)
    if (m) {
      const id = m[1]
      i += 1
      const bodyLines: string[] = []
      while (i < lines.length && !lines[i].startsWith("## ")) {
        bodyLines.push(lines[i])
        i += 1
      }
      const trimmed = bodyLines.join("\n").trim()
      reqs.push({ id, body: trimmed })
      continue
    }
    i += 1
  }
  return reqs
}

describe("docs/canonical/", () => {
  test("領域ファイルの見出し", () => {
    for (const name of readdirSync(specDir).filter((f) => f.endsWith(".md"))) {
      const text = readFileSync(join(specDir, name), "utf8")
      const domain = name.replace(/\.md$/, "")
      const first = text.split("\n").find((l) => l.trim() !== "")
      expect(first).toBe(`# ${domain}`)
    }
  })

  test("REQ 識別子ともと課題行", () => {
    for (const name of readdirSync(specDir).filter((f) => f.endsWith(".md"))) {
      if (name === "spec.md") continue
      const ids = new Set<string>()
      const text = readFileSync(join(specDir, name), "utf8")
      for (const { id, body } of parseRequirements(text)) {
        const num = Number(id.slice(4))
        expect(num).toBeGreaterThanOrEqual(11)
        expect(ids.has(id)).toBe(false)
        ids.add(id)
        const lines = body.split("\n").filter((l) => l.trim() !== "")
        expect(lines[0]).toMatch(/^もとになった課題は #\d+ である。$/)
      }
    }
  })

  test("正本の必須文言", () => {
    let all = ""
    for (const name of readdirSync(specDir).filter((f) => f.endsWith(".md"))) {
      all += readFileSync(join(specDir, name), "utf8")
    }
    expect(all).toContain("もとになった課題は #113 である。")
    expect(all).toContain(
      "要求レビュー役が食い違いと巻き戻りを探すときに読んで比べる範囲は、`docs/canonical/` の正本と、対象課題の `docs/issues/<番号>/requirements.md` の「関係する課題」に挙げた課題の仕様だけである。",
    )
    expect(all).toContain(
      "設計レビュー役が食い違いと巻き戻りを探すときに読んで比べる範囲は、`docs/canonical/` の正本と、対象課題の `docs/issues/<番号>/design.md` の「関係する課題」に挙げた課題の仕様だけである。",
    )
    expect(all).toContain("履歴として残す")
    expect(all).toContain(
      "grok-4.7[context=256k,reasoning_effort=high,fast=false]",
    )
    expect(all).not.toContain("使用するサブエージェントは、下の表の四つである")
    expect(all).not.toContain("既定の `poll` は常に `null` を返す")
  })

  test("docs/issues の履歴", () => {
    const d37 = readFileSync(join(root, "docs/issues/37/design.md"), "utf8")
    expect(d37).toContain(
      "`docs/issues/` にある既存の `requirements.md` と `design.md` を読む",
    )
    const r20 = readFileSync(
      join(root, "docs/issues/20/requirements.md"),
      "utf8",
    )
    expect(r20).toContain("下の表の四つ")
  })
})
