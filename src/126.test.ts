import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, test } from "bun:test"
import { checkSpec } from "./spec.ts"
import {
  issue145SupersededGitReqIds,
  issue167SupersededSddReqIds,
  issue176SupersededSddReqIds,
} from "./conventions.ts"

const root = path.join(import.meta.dir, "..")
const designPath = path.join(root, "docs/issues/126/design.md")
const specTsPath = path.join(root, "src/spec.ts")
const cliPath = path.join(root, "src/cli.ts")
const bunExe = process.execPath

const CANONICAL_FILES = ["runner.md", "implement.md", "git.md"] as const

const DELETED_IDS = [
  "REQ-517",
  "REQ-518",
  "REQ-523",
  "REQ-524",
  "REQ-536",
  "REQ-543",
  "REQ-544",
  "REQ-547",
  "REQ-549",
  "REQ-550",
  "REQ-567",
  "REQ-542",
  "REQ-563",
  "REQ-605",
  "REQ-608",
  "REQ-641",
  "REQ-665",
] as const

const KEPT_DELETION_IDS = [
  "REQ-540",
  "REQ-541",
  "REQ-551",
  "REQ-569",
  "REQ-559",
  "REQ-561",
  "REQ-566",
  "REQ-548",
  "REQ-615",
  "REQ-618",
  "REQ-635",
  "REQ-650",
  "REQ-519",
  "REQ-546",
] as const

const UNCHANGED_WRITING_SPLIT_IDS = [
  "REQ-506",
  "REQ-607",
  "REQ-647",
  "REQ-797",
] as const

const BROKEN_SUFFIXES = [
  "ないである",
  "するである",
  "いるである",
  "あるである",
  "るである",
  "うである",
] as const

const SPEC_CHECK_PREFIXES = [
  "本文が近いです: docs/canonical/runner.md ",
  "本文が近いです: docs/canonical/implement.md ",
  "本文が近いです: docs/canonical/git.md ",
  "壊れた文末です: docs/canonical/runner.md ",
  "壊れた文末です: docs/canonical/implement.md ",
  "壊れた文末です: docs/canonical/git.md ",
] as const

const UNTOUCHED_SHA256 =
  "b06020cdf17015761684478bc6188a4af05ff4b2cf0616e3e76438942e349f4a"

/** #173 以降の正本差分で上書きされた要求（#126 の差分本文とは一致しない） */
/** 課題 126 の差分適用後、課題 145 が正本を上書きした REQ */
const SUPERSEDED_BY_ISSUE_145 = new Set(["REQ-798"])

const REQ_HEADING = /^## REQ-([1-9][0-9]*)$/
const ORIGIN_LINE = /^もとになった課題は #([1-9][0-9]*) である。$/
const DELTA_HEADING =
  /^### (削除|変更) (runner|implement|git) (REQ-[1-9][0-9]*)$/

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

function deltaSection(design: string): string {
  const idx = design.indexOf("## 正本への差分")
  return idx >= 0 ? design.slice(idx) : ""
}

function parseDesignDeltas(design: string): {
  deleted: string[]
  changed: Map<string, string>
} {
  const section = deltaSection(design)
  const headingRe =
    /^### (削除|変更) (runner|implement|git) (REQ-[1-9][0-9]*)\n\n/gm
  const headings: {
    type: string
    id: string
    contentStart: number
    start: number
  }[] = []
  for (const match of section.matchAll(headingRe)) {
    headings.push({
      type: match[1],
      id: match[3],
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

function allCanonicalRequirements(): ParsedRequirement[] {
  const all: ParsedRequirement[] = []
  for (const file of CANONICAL_FILES) {
    const content = readFileSync(
      path.join(root, "docs/canonical", file),
      "utf8",
    )
    all.push(...parseRequirements(content))
  }
  return all
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

function lineEndsWithBrokenSuffix(line: string): boolean {
  for (const suffix of BROKEN_SUFFIXES) {
    if (line.endsWith(suffix)) {
      return true
    }
  }
  return false
}

async function runSpecCheck(): Promise<{ exitCode: number; stderr: string }> {
  const proc = Bun.spawn([bunExe, cliPath, "spec-check"], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  })
  const exitCode = await proc.exited
  const stderr = await new Response(proc.stderr).text()
  return { exitCode, stderr }
}

describe("126", () => {
  const design = readFileSync(designPath, "utf8")
  const { deleted, changed } = parseDesignDeltas(design)
  const touched = new Set<string>([...deleted, ...changed.keys()])
  const requirements = allCanonicalRequirements()
  const byId = new Map(requirements.map((req) => [req.id, req]))
  const skipCanonicalMatch = new Set([
    "REQ-502",
    "REQ-575",
    "REQ-798",
    ...issue176SupersededSddReqIds(),
    ...issue167SupersededSddReqIds(),
    ...issue145SupersededGitReqIds(),
  ])

  test("[1][2] 正本への差分に追加が無い", () => {
    const section = deltaSection(design)
    expect(section.split("\n").some((line) => line.startsWith("### 追加"))).toBe(
      false,
    )
    expect(deleted.length).toBeGreaterThan(0)
    expect(changed.size).toBeGreaterThan(0)
  })

  test("[3][4][9] 削除した見出しが無く、残した見出しがある", () => {
    const combined = CANONICAL_FILES.map((f) =>
      readFileSync(path.join(root, "docs/canonical", f), "utf8"),
    ).join("\n")
    for (const id of DELETED_IDS) {
      expect(combined).not.toContain(`## ${id}`)
    }
    for (const id of KEPT_DELETION_IDS) {
      expect(combined).toContain(`## ${id}`)
    }
    for (const id of UNCHANGED_WRITING_SPLIT_IDS) {
      expect(changed.has(id)).toBe(false)
    }
  })

  test("[5][6] 変更した要求の非空行が正本への差分と一致し、壊れた接尾辞が無い", () => {
    for (const [id, designBody] of changed) {
      if (skipCanonicalMatch.has(id)) {
        continue
      }
      const req = byId.get(id)
      expect(req).toBeDefined()
      expect(nonEmptyLines(req!.bodyLines)).toEqual(
        nonEmptyLines(designBody.split("\n")),
      )
      for (const line of nonEmptyLines(req!.bodyLines)) {
        if (ORIGIN_LINE.test(line)) {
          continue
        }
        expect(lineEndsWithBrokenSuffix(line)).toBe(false)
      }
    }
  })

  test("[7][11] REQ-499 と REQ-632", () => {
    const req499 = byId.get("REQ-499")
    const req632 = byId.get("REQ-632")
    expect(req499).toBeDefined()
    expect(req632).toBeDefined()
    const body499 = req499!.bodyLines.join("\n")
    const body632 = req632!.bodyLines.join("\n")
    expect(body499).toContain("task-<番号>")
    expect(body499).not.toContain("sdd-cur/<番号>")
    expect(body632).toContain("sdd-cur/<番号>")
    expect(body632).toContain("を返さない")
    for (const [id, designBody] of changed) {
      if (id === "REQ-499") {
        continue
      }
      const body = byId.get(id)!.bodyLines.join("\n")
      expect(body.includes("sdd-cur/<番号>")).toBe(
        designBody.includes("sdd-cur/<番号>"),
      )
    }
  })

  test("[8][10][19][20] 変更の由来行は変えない", () => {
    for (const [id, designBody] of changed) {
      if (skipCanonicalMatch.has(id)) {
        continue
      }
      const req = byId.get(id)
      expect(req).toBeDefined()
      const designOrigins = designBody
        .split("\n")
        .filter((line) => ORIGIN_LINE.test(line))
      const canonicalOrigins = req!.bodyLines.filter((line) =>
        ORIGIN_LINE.test(line),
      )
      expect(canonicalOrigins).toEqual(designOrigins)
    }
  })

  test("[12] src/spec.ts の式と接尾辞", () => {
    const specTs = readFileSync(specTsPath, "utf8")
    expect(specTs).toContain("n * 5 >= u * 3")
    for (const suffix of BROKEN_SUFFIXES) {
      expect(specTs).toContain(suffix)
    }
    const order = BROKEN_SUFFIXES.map((s) => specTs.indexOf(`"${s}"`))
    expect(order.every((v, i, arr) => i === 0 || v > arr[i - 1])).toBe(true)
  })

  test("[13][14][15][16][17][18] spec-check の三ファイルの報告", async () => {
    const { stderr } = await runSpecCheck()
    const lines = stderr.split("\n").filter((line) => line.length > 0)
    for (const prefix of SPEC_CHECK_PREFIXES) {
      expect(lines.some((line) => line.startsWith(prefix))).toBe(false)
    }
  })

  test("[19] 触らない要求の SHA-256", () => {
    expect(untouchedRequirementsHash(requirements, touched)).toBe(
      UNTOUCHED_SHA256,
    )
  })

  test("差分見出しは変更か削除だけ", () => {
    const section = deltaSection(design)
    for (const line of section.split("\n")) {
      if (line.startsWith("### ")) {
        expect(line.match(DELTA_HEADING)).not.toBeNull()
      }
    }
  })
})
