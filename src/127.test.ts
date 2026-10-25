import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"
import { checkSpec } from "./spec.ts"
import {
  issue168SupersededInstallReqIds,
  issue175SupersededConventionsReqIds,
} from "./conventions.ts"

const root = join(import.meta.dir, "..")
const designPath = join(root, "docs/issues/127/design.md")
const bunExe = process.execPath
const cliPath = join(root, "src/cli.ts")

const DOMAINS = [
  "conventions",
  "complete",
  "github",
  "labels",
  "install",
  "docs",
] as const

const UNTOUCHED_SHA256 =
  "c81b4259ffd6fc68f366e4846d141f1bc066fa9ba1302993cbab58e4a039ee89"

const DELETED: { domain: string; id: string }[] = [
  { domain: "conventions", id: "REQ-103" },
  { domain: "conventions", id: "REQ-122" },
  { domain: "conventions", id: "REQ-123" },
  { domain: "conventions", id: "REQ-137" },
  { domain: "conventions", id: "REQ-138" },
  { domain: "conventions", id: "REQ-139" },
  { domain: "conventions", id: "REQ-140" },
  { domain: "complete", id: "REQ-675" },
  { domain: "complete", id: "REQ-678" },
  { domain: "complete", id: "REQ-701" },
  { domain: "complete", id: "REQ-702" },
  { domain: "labels", id: "REQ-78" },
  { domain: "labels", id: "REQ-80" },
]

const KEPT_DUPLICATE: { domain: string; id: string }[] = [
  { domain: "conventions", id: "REQ-113" },
  { domain: "conventions", id: "REQ-145" },
  { domain: "conventions", id: "REQ-146" },
  { domain: "labels", id: "REQ-82" },
  { domain: "labels", id: "REQ-91" },
]

const SIX_CANONICAL = DOMAINS.map((d) => `docs/canonical/${d}.md`)

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
  deleted: { domain: string; id: string }[]
  changed: Map<string, string>
} {
  const section = deltaSectionText(design)
  const headingRe = /^### (削除|変更) (\w+) (REQ-\d+)\n\n/gm
  const headings: {
    type: string
    domain: string
    id: string
    start: number
    contentStart: number
  }[] = []
  for (const match of section.matchAll(headingRe)) {
    headings.push({
      type: match[1],
      domain: match[2],
      id: match[3],
      start: match.index ?? 0,
      contentStart: (match.index ?? 0) + match[0].length,
    })
  }
  const deleted: { domain: string; id: string }[] = []
  const changed = new Map<string, string>()
  for (let i = 0; i < headings.length; i += 1) {
    const h = headings[i]
    const end = i + 1 < headings.length ? headings[i + 1].start : section.length
    const body = section.slice(h.contentStart, end).replace(/\n+$/, "")
    const key = `${h.domain}:${h.id}`
    if (h.type === "削除") {
      deleted.push({ domain: h.domain, id: h.id })
    } else {
      changed.set(key, body)
    }
  }
  return { deleted, changed }
}

function allUntouchedHash(touched: ReadonlySet<string>): string {
  const parts: string[] = []
  for (const domain of DOMAINS) {
    const content = readFileSync(
      join(root, "docs/canonical", `${domain}.md`),
      "utf8",
    )
    const reqs = parseRequirements(content)
    for (const req of reqs) {
      const key = `${domain}:${req.id}`
      if (touched.has(key)) continue
      parts.push(`${key}\n${req.bodyLines.join("\n")}\n---\n`)
    }
  }
  return createHash("sha256").update(parts.join(""), "utf8").digest("hex")
}

async function runSpecCheck(): Promise<{ exitCode: number; stderr: string }> {
  const proc = Bun.spawn([bunExe, cliPath, "spec-check"], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  })
  const stderr = await new Response(proc.stderr).text()
  const exitCode = await proc.exited
  return { exitCode, stderr }
}

function sixFileNearOrBroken(stderr: string): string[] {
  return stderr
    .split("\n")
    .filter((line) => {
      if (
        !line.startsWith("本文が近いです:") &&
        !line.startsWith("壊れた文末です:")
      ) {
        return false
      }
      return SIX_CANONICAL.some((p) => line.includes(p))
    })
}

describe("127", () => {
  const design = readFileSync(designPath, "utf8")
  const { deleted, changed } = parseDesignDeltas(design)
  const touched = new Set<string>([
    ...deleted.map((d) => `${d.domain}:${d.id}`),
    ...changed.keys(),
    ...[...issue168SupersededInstallReqIds()].map((id) => `install:${id}`),
    ...[...issue175SupersededConventionsReqIds()].map(
      (id) => `conventions:${id}`,
    ),
    "install:REQ-943",
  ])

  test("[7] 正本への差分に追加見出しが無く、変更と削除だけ", () => {
    const section = deltaSectionText(design)
    expect(section).not.toMatch(/^### 追加 /m)
    for (const match of section.matchAll(/^### (削除|変更) (\w+) /gm)) {
      expect(DOMAINS as readonly string[]).toContain(match[2])
    }
  })

  test("[1][2][15] 削除と残した重複の見出し", () => {
    expect(deleted).toEqual(DELETED)
    for (const { domain, id } of DELETED) {
      const text = readFileSync(
        join(root, "docs/canonical", `${domain}.md`),
        "utf8",
      )
      expect(text).not.toContain(`## ${id}`)
    }
    for (const { domain, id } of KEPT_DUPLICATE) {
      const text = readFileSync(
        join(root, "docs/canonical", `${domain}.md`),
        "utf8",
      )
      expect(text).toContain(`## ${id}`)
    }
  })

  test("[4][8] 変更した要求の非空行が正本への差分と一致する", () => {
    for (const domain of DOMAINS) {
      const content = readFileSync(
        join(root, "docs/canonical", `${domain}.md`),
        "utf8",
      )
      const byId = new Map(parseRequirements(content).map((r) => [r.id, r]))
      for (const [key, designBody] of changed) {
        if (!key.startsWith(`${domain}:`)) continue
        if (key === "docs:REQ-713") continue
        const id = key.slice(domain.length + 1)
        if (
          domain === "conventions" &&
          issue175SupersededConventionsReqIds().has(id)
        ) {
          continue
        }
        const req = byId.get(id)
        expect(req).toBeDefined()
        expect(nonEmptyLines(req!.bodyLines)).toEqual(
          nonEmptyLines(designBody.split("\n")),
        )
      }
    }
  })

  test("[8] 触らない要求の SHA-256", () => {
    expect(allUntouchedHash(touched)).toBe(UNTOUCHED_SHA256)
  })

  test("[5] 壊れた文末の修正はであるを外して句点で終わる", () => {
    const brokenSuffix =
      /(ない|する|いる|ある|る|う)である。$/
    for (const domain of DOMAINS) {
      const content = readFileSync(
        join(root, "docs/canonical", `${domain}.md`),
        "utf8",
      )
      for (const [key] of changed) {
        if (!key.startsWith(`${domain}:`)) continue
        const id = key.slice(domain.length + 1)
        const req = parseRequirements(content).find((r) => r.id === id)
        expect(req).toBeDefined()
        for (const line of nonEmptyLines(req!.bodyLines)) {
          if (line.match(ORIGIN_LINE)) continue
          expect(line.endsWith("である。") && brokenSuffix.test(line)).toBe(
            false,
          )
        }
      }
    }
  })

  test("[9] spec.ts の近さの式と壊れた文末の接尾辞", () => {
    const specSrc = readFileSync(join(root, "src/spec.ts"), "utf8")
    expect(specSrc).toContain("n * 5 >= u * 3")
    for (const suffix of [
      "ないである",
      "するである",
      "いるである",
      "あるである",
      "るである",
      "うである",
    ]) {
      expect(specSrc).toContain(`"${suffix}"`)
    }
    for (const suffix of ["こうである", "そうである", "どうである"]) {
      expect(specSrc).toContain(`"${suffix}"`)
    }
  })

  test("[10] cli github complete labels install の該当箇所は変えない", () => {
    const cli = readFileSync(join(root, "src/cli.ts"), "utf8")
    expect(cli).toContain('case "tasks":')
    expect(cli).toContain('case "spec-check":')
    const github = readFileSync(join(root, "src/github.ts"), "utf8")
    expect(github).toContain("--delete-branch")
    expect(github).toContain("--subject")
    const complete = readFileSync(join(root, "src/complete.ts"), "utf8")
    expect(complete).toContain("completeIssue")
    const labels = readFileSync(join(root, "src/labels.ts"), "utf8")
    expect(labels).toContain("workflowLabels")
    const install = readFileSync(join(root, "src/install.ts"), "utf8")
    expect(install).toContain("defaultSkillsSourceDir")
    expect(install).toContain("defaultAgentsSourceDir")
  })

  test("[11] docs/canonical/spec.md の REQ-808 は変えない", async () => {
    const spec = readFileSync(join(root, "docs/canonical/spec.md"), "utf8")
    const req808 = (text: string) => {
      const m = text.match(/## REQ-808\n\n([\s\S]*?)(?=\n## REQ-|$)/)
      return m?.[1]?.trim() ?? ""
    }
    const fromMain = await Bun.$`git show main:docs/canonical/spec.md`
      .quiet()
      .text()
    expect(req808(spec)).toBe(req808(fromMain))
  })

  test("[12] ほか四領域の正本の先頭 REQ 見出し", async () => {
    const files = ["runner.md", "sdd.md", "git.md", "implement.md"]
    for (const name of files) {
      const work = readFileSync(join(root, "docs/canonical", name), "utf8")
      const main = await Bun.$`git show main:docs/canonical/${name}`
        .quiet()
        .text()
      const first = (t: string) => t.match(/^## (REQ-\d+)/m)?.[1]
      expect(first(work)).toBe(first(main))
    }
  })

  test("[13] 約束ファイルのパスと本文", () => {
    const docsConv = join(root, "docs/conventions.md")
    const skillsConv = join(root, "skills/sdd-cur/conventions.md")
    expect(readFileSync(docsConv, "utf8").length).toBeGreaterThan(0)
    expect(readFileSync(skillsConv, "utf8").length).toBeGreaterThan(0)
  })

  test("[14] 要求にシナリオ節が無い", () => {
    const req = readFileSync(
      join(root, "docs/issues/127/requirements.md"),
      "utf8",
    )
    expect(req).not.toMatch(/^## シナリオ/m)
  })

  test("[17][18] 六領域の正本で近い組と壊れた文末が無い", async () => {
    const findings = await checkSpec(root)
    const bad = findings.filter((line) =>
      SIX_CANONICAL.some(
        (p) =>
          (line.startsWith("本文が近いです:") ||
            line.startsWith("壊れた文末です:")) &&
          line.includes(p),
      ),
    )
    expect(bad).toEqual([])
  })

  test("[17][18] spec-check の六領域行", async () => {
    const { stderr } = await runSpecCheck()
    expect(sixFileNearOrBroken(stderr)).toEqual([])
  })
})
