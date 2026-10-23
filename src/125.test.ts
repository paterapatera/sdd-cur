import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { describe, expect, test } from "bun:test"
import path from "node:path"
import { checkSpec } from "./spec.ts"

const root = path.join(import.meta.dir, "..")
const sddPath = path.join(root, "docs/canonical/sdd.md")
const designPath = path.join(root, "docs/issues/125/design.md")

const SCOPE_ISSUE_NUMBERS = new Set([
  46, 47, 53, 55, 56, 69, 72, 89, 90, 92,
])

const UNTOUCHED_SHA256 =
  "2b4f536ac30ce113d12fb3cac6f94419d44b54977d1fede59de8fff92b2709bc"

const DELETED_IDS = [
  "REQ-381",
  "REQ-385",
  "REQ-405",
  "REQ-406",
  "REQ-408",
  "REQ-442",
  "REQ-449",
  "REQ-451",
  "REQ-453",
  "REQ-454",
  "REQ-469",
  "REQ-470",
  "REQ-476",
  "REQ-482",
  "REQ-485",
] as const

const KEPT_DUPLICATE_IDS = [
  "REQ-389",
  "REQ-409",
  "REQ-447",
  "REQ-460",
  "REQ-462",
  "REQ-463",
  "REQ-467",
  "REQ-491",
  "REQ-492",
  "REQ-493",
  "REQ-494",
] as const

const REQ_HEADING = /^## REQ-([1-9][0-9]*)$/
const ORIGIN_LINE = /^もとになった課題は #([1-9][0-9]*) である。$/

type ParsedRequirement = {
  id: string
  bodyLines: string[]
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function parseRequirements(content: string): ParsedRequirement[] {
  const lines = normalizeNewlines(content).split("\n")
  const reqs: ParsedRequirement[] = []
  let i = 0
  while (i < lines.length) {
    const match = lines[i].match(REQ_HEADING)
    if (!match) {
      i += 1
      continue
    }
    const id = `REQ-${match[1]}`
    i += 1
    const bodyLines: string[] = []
    while (i < lines.length && !REQ_HEADING.test(lines[i])) {
      bodyLines.push(lines[i])
      i += 1
    }
    reqs.push({ id, bodyLines })
  }
  return reqs
}

function nonEmptyLines(lines: readonly string[]): string[] {
  return lines.filter((line) => line.trim().length > 0)
}

function deltaSectionText(designMarkdown: string): string {
  const lines = normalizeNewlines(designMarkdown).split("\n")
  let start = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] === "## 正本への差分") {
      start = i + 1
      break
    }
  }
  if (start < 0) return ""
  const sectionLines: string[] = []
  for (let i = start; i < lines.length; i += 1) {
    if (lines[i].startsWith("## ")) break
    sectionLines.push(lines[i])
  }
  return sectionLines.join("\n")
}

function parseDesignDeltas(design: string): {
  deleted: string[]
  changed: Map<string, string>
} {
  const section = deltaSectionText(design)
  const headingRe = /^### (削除|変更) sdd (REQ-\d+)\n\n/gm
  const headings: {
    type: string
    id: string
    start: number
    contentStart: number
  }[] = []
  for (const match of section.matchAll(headingRe)) {
    headings.push({
      type: match[1],
      id: match[2],
      start: match.index ?? 0,
      contentStart: (match.index ?? 0) + match[0].length,
    })
  }
  const deleted: string[] = []
  const changed = new Map<string, string>()
  for (let i = 0; i < headings.length; i += 1) {
    const end =
      i + 1 < headings.length ? headings[i + 1].start : section.length
    const body = section.slice(headings[i].contentStart, end).replace(/\n+$/, "")
    if (headings[i].type === "削除") {
      deleted.push(headings[i].id)
    } else {
      changed.set(headings[i].id, body)
    }
  }
  return { deleted, changed }
}

function requirementInScope(bodyLines: readonly string[]): boolean {
  for (const line of bodyLines) {
    const match = line.match(ORIGIN_LINE)
    if (match && SCOPE_ISSUE_NUMBERS.has(Number(match[1]))) {
      return true
    }
  }
  return false
}

function untouchedRequirementsHash(
  reqs: readonly ParsedRequirement[],
  touched: ReadonlySet<string>,
): string {
  const parts: string[] = []
  for (const req of reqs) {
    if (touched.has(req.id)) {
      continue
    }
    parts.push(`${req.id}\n${req.bodyLines.join("\n")}\n---\n`)
  }
  return createHash("sha256").update(parts.join(""), "utf8").digest("hex")
}

function brokenEndingId(finding: string): string | undefined {
  const parts = finding.split(" ")
  return parts[parts.length - 1]
}

describe("125", () => {
  const sdd = readFileSync(sddPath, "utf8")
  const design = readFileSync(designPath, "utf8")
  const requirements = parseRequirements(sdd)
  const { deleted, changed } = parseDesignDeltas(design)
  const touched = new Set<string>([...deleted, ...changed.keys()])
  const scopeIds = new Set(
    requirements
      .filter((req) => requirementInScope(req.bodyLines))
      .map((r) => r.id),
  )

  test("[2][7] 正本への差分に追加見出しが無く、変更と削除だけで領域は sdd", () => {
    const section = deltaSectionText(design)
    expect(section).not.toMatch(/^### 追加 /m)
    for (const match of section.matchAll(/^### (削除|変更) (\w+) /gm)) {
      expect(match[2]).toBe("sdd")
    }
  })

  test("[1][3][6] 削除した十五の見出しが無く、残した見出しがある", () => {
    expect(deleted.sort()).toEqual([...DELETED_IDS].sort())
    for (const id of DELETED_IDS) {
      expect(sdd).not.toContain(`## ${id}`)
    }
    for (const id of KEPT_DUPLICATE_IDS) {
      expect(sdd).toContain(`## ${id}`)
    }
  })

  test("[4][6][14] 変更した要求の非空行が正本への差分と一致する", () => {
    const byId = new Map(requirements.map((req) => [req.id, req]))
    for (const [id, designBody] of changed) {
      const req = byId.get(id)
      expect(req).toBeDefined()
      expect(nonEmptyLines(req!.bodyLines)).toEqual(
        nonEmptyLines(designBody.split("\n")),
      )
    }
  })

  test("[5][13] checkSpec の壊れた文末にこの範囲と変更した識別子が無い", async () => {
    const findings = await checkSpec(root)
    const broken = findings.filter((line) => line.startsWith("壊れた文末"))
    for (const line of broken) {
      const id = brokenEndingId(line)
      expect(id).toBeDefined()
      expect(scopeIds.has(id!)).toBe(false)
      expect(changed.has(id!)).toBe(false)
    }
    expect(sdd).not.toContain("## REQ-381")
  })

  test("[10][12] 触らない要求の SHA-256", () => {
    expect(untouchedRequirementsHash(requirements, touched)).toBe(
      UNTOUCHED_SHA256,
    )
  })
})
