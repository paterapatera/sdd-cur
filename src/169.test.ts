import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { deltaSectionText } from "./conventions.ts"

const root = path.join(import.meta.dir, "..")
const skillDir = path.join(root, "skills/sdd-cur")
const reviewLoopPath = path.join(skillDir, "review-loop.md")
const requirementsPath = path.join(skillDir, "requirements.md")
const designPath = path.join(skillDir, "design.md")
const reflectPath = path.join(skillDir, "reflect.md")
const quickPath = path.join(root, "skills/sdd-cur-quick/SKILL.md")
const implementPath = path.join(root, "skills/sdd-cur-implement/SKILL.md")
const skillPath = path.join(skillDir, "SKILL.md")
const design169Path = path.join(root, "docs/issues/169/design.md")
const sddCanonicalPath = path.join(root, "docs/canonical/sdd.md")
const implementCanonicalPath = path.join(root, "docs/canonical/implement.md")

const sharedPhrase = "直前の成功の標準出力が返した同じプロパティ"

function sectionBetween(
  text: string,
  startHeading: string,
  endHeading: string,
): string {
  const start = text.indexOf(startHeading)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = text.indexOf(endHeading, start + startHeading.length)
  expect(end).toBeGreaterThan(start)
  return text.slice(start, end)
}

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
  domain: "sdd" | "implement",
): Map<string, string> {
  const section = deltaSectionText(design)
  const headingRe = /^### (追加|変更|削除) (sdd|implement) (REQ-\d+)\n\n/gm
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

function bodyAfterFrontmatter(text: string): string {
  const fmEnd = text.indexOf("\n---\n", 4)
  if (fmEnd === -1) return text
  return text.slice(fmEnd + 5)
}

function oneSentencePerLine(text: string): void {
  for (const line of text.split("\n")) {
    if (line.trim() === "") continue
    if (line.startsWith("#")) continue
    if (line.startsWith("- ")) continue
    if (line.startsWith("|")) continue
    expect(line.includes("。") || line.includes("である")).toBe(true)
  }
}

const stageTable: {
  file: string
  read: () => Promise<string>
  firstArg: string
  reviewer: string
  fixer: string
  senior?: string
  validate: boolean
}[] = [
  {
    file: "requirements.md",
    read: () => readFile(requirementsPath, "utf8"),
    firstArg: "requirements",
    reviewer: "sdd-cur-req-reviewer",
    senior: "sdd-cur-req-reviewer-high",
    fixer: "sdd-cur-req-fixer",
    validate: true,
  },
  {
    file: "design.md",
    read: () => readFile(designPath, "utf8"),
    firstArg: "requirements",
    reviewer: "sdd-cur-design-reviewer",
    fixer: "sdd-cur-design-fixer",
    validate: true,
  },
  {
    file: "reflect requirements",
    read: () => readFile(reflectPath, "utf8"),
    firstArg: "requirements",
    reviewer: "sdd-cur-req-reviewer",
    senior: "sdd-cur-req-reviewer-high",
    fixer: "sdd-cur-req-fixer",
    validate: true,
  },
  {
    file: "reflect design",
    read: () => readFile(reflectPath, "utf8"),
    firstArg: "reflect-design",
    reviewer: "sdd-cur-design-reviewer",
    fixer: "sdd-cur-design-fixer",
    validate: true,
  },
  {
    file: "quick requirements",
    read: async () => {
      const t = await readFile(quickPath, "utf8")
      return sectionBetween(t, "## 要件", "## 設計")
    },
    firstArg: "quick",
    reviewer: "sdd-cur-req-reviewer",
    senior: "sdd-cur-req-reviewer-high",
    fixer: "sdd-cur-req-fixer",
    validate: true,
  },
  {
    file: "quick design",
    read: async () => {
      const t = await readFile(quickPath, "utf8")
      return sectionBetween(t, "## 設計", "## 結果")
    },
    firstArg: "quick",
    reviewer: "sdd-cur-design-reviewer",
    fixer: "sdd-cur-design-fixer",
    validate: true,
  },
  {
    file: "implement",
    read: () => readFile(implementPath, "utf8"),
    firstArg: "implement",
    reviewer: "sdd-cur-implement-reviewer",
    fixer: "sdd-cur-implement-fixer",
    validate: false,
  },
]

describe("169", () => {
  test("review-loop.md の存在と共有ループ", async () => {
    const text = await readFile(reviewLoopPath, "utf8")
    expect(text).toContain("## レビューのループ")
    expect(text).toContain("sdd-cur review-next")
    expect(text).toContain(
      "`response`、`consecutiveFailures`、`previousFindings`、`brokenStampRetries`",
    )
    expect(text).toContain("`action` が `修正`")
    expect(text).toContain("呼び出し側は、ループに入る直前に")
    oneSentencePerLine(text)
  })

  test("段ファイルは review-loop を参照し共有フレーズを重複しない", async () => {
    const files = [
      await readFile(requirementsPath, "utf8"),
      await readFile(designPath, "utf8"),
      await readFile(reflectPath, "utf8"),
      await readFile(quickPath, "utf8"),
      await readFile(implementPath, "utf8"),
    ]
    for (const text of files) {
      expect(text).toContain("review-loop.md")
      expect(text).not.toContain(sharedPhrase)
    }
    const loop = await readFile(reviewLoopPath, "utf8")
    expect(loop).toContain(sharedPhrase)
  })

  test("requirements と design の固有文言", async () => {
    const req = await readFile(requirementsPath, "utf8")
    const design = await readFile(designPath, "utf8")
    expect(req).toContain("第1引数は `requirements`")
    expect(req).toContain("sdd-cur-req-reviewer-high")
    expect(design).toContain("第1引数は `requirements`")
    expect(design).toContain("課題全体が大きすぎる")
  })

  test("reflect は要件段全体参照を書かない", async () => {
    const reflect = await readFile(reflectPath, "utf8")
    expect(reflect).not.toContain(
      "`requirements.md` の `## 要件` のレビューの段全体",
    )
  })

  test("SKILL.md の段一覧に review-loop は無い", async () => {
    const skill = await readFile(skillPath, "utf8")
    expect(skill).toContain("段の一覧は、次の七つである。")
    expect(skill).not.toContain("review-loop.md")
  })

  test("段ごと表の値が各ファイルにある", async () => {
    for (const row of stageTable) {
      const text = await row.read()
      expect(text).toContain(`第1引数は \`${row.firstArg}\``)
      expect(text).toContain(row.reviewer)
      expect(text).toContain(row.fixer)
      if (row.validate) {
        expect(text).toContain("レビューの前に `validate` を実行する")
      } else if (row.firstArg === "implement") {
        expect(text).toContain("レビューの直前に validate コマンドは実行しない")
      } else {
        expect(text).toContain("レビューの前に `validate` は実行しない")
      }
      if (row.senior) {
        expect(text).toContain(row.senior)
      }
    }
  })

  test("一文一行（quick と implement）", async () => {
    oneSentencePerLine(bodyAfterFrontmatter(await readFile(quickPath, "utf8")))
    oneSentencePerLine(bodyAfterFrontmatter(await readFile(implementPath, "utf8")))
  })

  test("正本が設計の差分と一致", async () => {
    const design = await readFile(design169Path, "utf8")
    const sdd = await readFile(sddCanonicalPath, "utf8")
    const implement = await readFile(implementCanonicalPath, "utf8")
    const sddDelta = parseDeltaBodies(design, "sdd")
    const implDelta = parseDeltaBodies(design, "implement")
    for (const [id, body] of sddDelta) {
      expect(reqBody(sdd, id)).toBe(body)
    }
    for (const [id, body] of implDelta) {
      expect(reqBody(implement, id)).toBe(body)
    }
    expect(sddDelta.has("REQ-957")).toBe(true)
  })
})
