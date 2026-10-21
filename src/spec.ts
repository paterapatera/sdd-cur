import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"

const READ_FAILED = "正本を読めません"

const REQ_HEADING = /^## REQ-([1-9][0-9]*)$/
const ORIGIN_LINE = /^もとになった課題は #([1-9][0-9]*) である。$/

const BROKEN_SUFFIXES = [
  "ないである",
  "するである",
  "いるである",
  "あるである",
  "るである",
  "うである",
] as const

const BROKEN_EXCLUDE_SUFFIXES = ["こうである", "そうである", "どうである"] as const

function readFailed(): never {
  throw new Error(READ_FAILED)
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function isWhitespaceChar(ch: string): boolean {
  return (
    ch === " " ||
    ch === "\t" ||
    ch === "\n" ||
    ch === "\r" ||
    ch === "\u3000"
  )
}

type BodyLine = { lineNum: number; text: string }

type Requirement = {
  id: string
  num: number
  headingLine: number
  bodyLines: BodyLine[]
  fileName: string
}

function parseRequirements(fileName: string, content: string): Requirement[] {
  const normalized = normalizeNewlines(content)
  const lines = normalized.split("\n")
  const reqs: Requirement[] = []
  let i = 0
  while (i < lines.length) {
    const match = lines[i].match(REQ_HEADING)
    if (!match) {
      i++
      continue
    }
    const num = Number(match[1])
    const id = `REQ-${match[1]}`
    const headingLine = i + 1
    i++
    const bodyLines: BodyLine[] = []
    while (i < lines.length && !REQ_HEADING.test(lines[i])) {
      bodyLines.push({ lineNum: i + 1, text: lines[i] })
      i++
    }
    reqs.push({ id, num, headingLine, bodyLines, fileName })
  }
  return reqs
}

function comparisonText(bodyLines: BodyLine[]): string {
  const kept = bodyLines.filter((l) => !ORIGIN_LINE.test(l.text))
  if (kept.length === 0) {
    return ""
  }
  if (kept.length === 1) {
    return kept[0].text
  }
  return kept.map((l) => l.text).join("\n")
}

function bigrams(text: string): Set<string> {
  const points = [...text]
  const set = new Set<string>()
  for (let i = 0; i + 1 < points.length; i++) {
    set.add(points[i] + points[i + 1])
  }
  return set
}

function isSimilarPair(a: string, b: string): boolean {
  const sa = bigrams(a)
  const sb = bigrams(b)
  let n = 0
  for (const g of sa) {
    if (sb.has(g)) {
      n++
    }
  }
  const u = new Set([...sa, ...sb]).size
  if (u === 0) {
    return false
  }
  return n * 5 >= u * 3
}

function trimmedEnd(line: string): string {
  return line.replace(/[ \t]+$/, "")
}

function endsWithBrokenSuffix(line: string): boolean {
  let t = trimmedEnd(line)
  if (t.endsWith("。")) {
    t = t.slice(0, -1)
  }
  for (const suffix of BROKEN_EXCLUDE_SUFFIXES) {
    if (t.endsWith(suffix)) {
      return false
    }
  }
  for (const suffix of BROKEN_SUFFIXES) {
    if (t.endsWith(suffix)) {
      return true
    }
  }
  return false
}

function isFenceLine(line: string): boolean {
  return line.trimStart().startsWith("```")
}

function brokenEndingHits(
  content: string,
  reqs: Requirement[],
): { lineNum: number; id: string }[] {
  const owner = new Map<number, string>()
  for (const req of reqs) {
    for (const line of req.bodyLines) {
      owner.set(line.lineNum, req.id)
    }
  }
  const lines = normalizeNewlines(content).split("\n")
  const hits: { lineNum: number; id: string }[] = []
  let inFence = false
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i]
    if (isFenceLine(text)) {
      inFence = !inFence
      continue
    }
    if (inFence) {
      continue
    }
    const id = owner.get(i + 1)
    if (id === undefined) {
      continue
    }
    if (endsWithBrokenSuffix(text)) {
      hits.push({ lineNum: i + 1, id })
    }
  }
  return hits
}

function isEmptyBody(bodyLines: BodyLine[]): boolean {
  for (const line of bodyLines) {
    for (const ch of line.text) {
      if (!isWhitespaceChar(ch)) {
        return false
      }
    }
  }
  return true
}

function specPath(fileName: string): string {
  return `docs/canonical/${fileName}`
}

type IdOccurrence = { fileName: string; lineNum: number }

export async function checkSpec(root: string): Promise<string[]> {
  const specDir = join(root, "docs/canonical")
  let entries: Awaited<ReturnType<typeof readdir>>
  try {
    entries = await readdir(specDir, { withFileTypes: true })
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code: string }).code
        : ""
    if (code === "ENOENT") {
      return []
    }
    readFailed()
  }
  const mdFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort()

  const fileContents = new Map<string, string>()
  for (const name of mdFiles) {
    try {
      const content = await readFile(join(specDir, name), "utf8")
      fileContents.set(name, content)
    } catch {
      readFailed()
    }
  }

  const allReqs: Requirement[] = []
  const idOccurrences = new Map<string, IdOccurrence[]>()

  for (const name of mdFiles) {
    const content = fileContents.get(name)!
    const reqs = parseRequirements(name, content)
    allReqs.push(...reqs)
    for (const req of reqs) {
      let list = idOccurrences.get(req.id)
      if (!list) {
        list = []
        idOccurrences.set(req.id, list)
      }
      list.push({ fileName: name, lineNum: req.headingLine })
    }
  }

  const duplicateLines: string[] = []
  const duplicateIds = [...idOccurrences.entries()]
    .filter(([, occs]) => occs.length >= 2)
    .sort((a, b) => {
      const numA = Number(a[0].slice(4))
      const numB = Number(b[0].slice(4))
      return numA - numB
    })
  for (const [id, occs] of duplicateIds) {
    const sortedOccs = [...occs].sort((a, b) => {
      if (a.fileName !== b.fileName) {
        return a.fileName < b.fileName ? -1 : 1
      }
      return a.lineNum - b.lineNum
    })
    const paths = sortedOccs.map((o) => specPath(o.fileName)).join(" ")
    duplicateLines.push(`識別子が重複しています: ${id} ${paths}`)
  }

  const emptyLines: string[] = []
  const emptyReqs = allReqs.filter((r) => isEmptyBody(r.bodyLines))
  emptyReqs.sort((a, b) => {
    if (a.fileName !== b.fileName) {
      return a.fileName < b.fileName ? -1 : 1
    }
    return a.headingLine - b.headingLine
  })
  for (const req of emptyReqs) {
    emptyLines.push(`本文が空です: ${specPath(req.fileName)} ${req.id}`)
  }

  const brokenLines: string[] = []
  type BrokenHit = { fileName: string; lineNum: number; id: string }
  const brokenHits: BrokenHit[] = []
  for (const name of mdFiles) {
    const reqs = allReqs.filter((req) => req.fileName === name)
    for (const hit of brokenEndingHits(fileContents.get(name)!, reqs)) {
      brokenHits.push({
        fileName: name,
        lineNum: hit.lineNum,
        id: hit.id,
      })
    }
  }
  brokenHits.sort((a, b) => {
    if (a.fileName !== b.fileName) {
      return a.fileName < b.fileName ? -1 : 1
    }
    return a.lineNum - b.lineNum
  })
  for (const hit of brokenHits) {
    brokenLines.push(
      `壊れた文末です: ${specPath(hit.fileName)} ${hit.lineNum} ${hit.id}`,
    )
  }

  const similarLines: string[] = []
  type SimilarHit = {
    fileName: string
    firstLine: number
    secondLine: number
    firstId: string
    secondId: string
  }
  const similarHits: SimilarHit[] = []
  const byFile = new Map<string, Requirement[]>()
  for (const req of allReqs) {
    let list = byFile.get(req.fileName)
    if (!list) {
      list = []
      byFile.set(req.fileName, list)
    }
    list.push(req)
  }
  for (const [fileName, reqs] of byFile) {
    const sorted = [...reqs].sort((a, b) => a.headingLine - b.headingLine)
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i]
        const b = sorted[j]
        if (
          isSimilarPair(
            comparisonText(a.bodyLines),
            comparisonText(b.bodyLines),
          )
        ) {
          similarHits.push({
            fileName,
            firstLine: a.headingLine,
            secondLine: b.headingLine,
            firstId: a.id,
            secondId: b.id,
          })
        }
      }
    }
  }
  similarHits.sort((a, b) => {
    if (a.fileName !== b.fileName) {
      return a.fileName < b.fileName ? -1 : 1
    }
    if (a.firstLine !== b.firstLine) {
      return a.firstLine - b.firstLine
    }
    return a.secondLine - b.secondLine
  })
  for (const hit of similarHits) {
    similarLines.push(
      `本文が近いです: ${specPath(hit.fileName)} ${hit.firstId} ${hit.secondId}`,
    )
  }

  return [...duplicateLines, ...emptyLines, ...brokenLines, ...similarLines]
}
