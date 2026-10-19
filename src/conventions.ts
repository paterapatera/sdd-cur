import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import type { IssueComment } from "./github.ts"

export const commentMarkers = {
  confirm: "sdd-cur: 確認",
  answer: "sdd-cur: 回答",
  acceptance: "sdd-cur: 受け入れ手順",
} as const

export type CommentKind = "confirm" | "answer" | "acceptance" | "other"

export type ParsedComment = {
  kind: CommentKind
  payload: string
}

export type RelatedComments = {
  pairs: { confirm: IssueComment; answer: IssueComment }[]
  unanswered: IssueComment[]
  unpairedAnswers: IssueComment[]
  acceptance: IssueComment | null
}

export const reflectedMarker = "sdd-cur:reflected"
export const reflectedOpenLine = `<!-- ${reflectedMarker}`
export const reflectedCloseLine = "-->"

const CANONICAL_READ_FAILED = "正本を読めません"
const DELTA_SECTION_HEADING = "## 正本への差分"
const CANONICAL_REQ_HEADING = /^## REQ-([1-9][0-9]*)$/
const DELTA_ADD_HEADING =
  /^### 追加 ([a-z][a-z0-9]*(?:-[a-z0-9]+)*) (REQ-[1-9][0-9]*)$/
const DELTA_CHANGE_HEADING =
  /^### 変更 ([a-z][a-z0-9]*(?:-[a-z0-9]+)*) (REQ-[1-9][0-9]*)$/
const DELTA_REMOVE_HEADING =
  /^### 削除 ([a-z][a-z0-9]*(?:-[a-z0-9]+)*) (REQ-[1-9][0-9]*)$/

const INVALID_NUMBER = "番号が不正です"
const INVALID_REFLECT_ID = "反映するコメントが不正です"
const MULTIPLE_REFLECTED = "反映済みの記録が複数あります"
const BAD_REFLECTED = "反映済みの記録を解釈できません"

function reject(message: string): never {
  throw new Error(message)
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function assertIssueNumber(issueNumber: number): void {
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) {
    reject(INVALID_NUMBER)
  }
}

function firstNonemptyLineIndex(lines: readonly string[]): number {
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim().length > 0) {
      return i
    }
  }
  return -1
}

function isValidReflectedId(id: string): boolean {
  if (id.length === 0) {
    return false
  }
  if (id !== id.trim()) {
    return false
  }
  if (/[\s<>]/.test(id)) {
    return false
  }
  return true
}

function assertValidReflectCommentId(commentId: string): void {
  if (!isValidReflectedId(commentId)) {
    reject(INVALID_REFLECT_ID)
  }
}

function formatReflectedBlock(ids: readonly string[]): string {
  const lines = [reflectedOpenLine, ...ids, reflectedCloseLine, ""]
  return lines.join("\n")
}

export function specPaths(issueNumber: number): {
  dir: string
  requirements: string
  design: string
} {
  assertIssueNumber(issueNumber)
  const dir = `docs/specs/${issueNumber}`
  return {
    dir,
    requirements: `${dir}/requirements.md`,
    design: `${dir}/design.md`,
  }
}

export function isSpecHeading(markdown: string, issueNumber: number): boolean {
  const lines = normalizeNewlines(markdown).split("\n")
  const index = firstNonemptyLineIndex(lines)
  if (index < 0) {
    return false
  }
  const line = lines[index]
  const prefix = `# ${issueNumber} `
  if (!line.startsWith(prefix)) {
    return false
  }
  const rest = line.slice(prefix.length)
  return /[^\s]/.test(rest)
}

export function parseComment(body: string): ParsedComment {
  const normalized = normalizeNewlines(body)
  const lines = normalized.split("\n")
  const index = firstNonemptyLineIndex(lines)
  if (index < 0) {
    return { kind: "other", payload: normalized }
  }
  const firstLine = lines[index]
  let kind: CommentKind = "other"
  if (firstLine === commentMarkers.confirm) {
    kind = "confirm"
  } else if (firstLine === commentMarkers.answer) {
    kind = "answer"
  } else if (firstLine === commentMarkers.acceptance) {
    kind = "acceptance"
  }
  if (kind === "other") {
    return { kind, payload: normalized }
  }
  const payload = lines.slice(index + 1).join("\n")
  return { kind, payload }
}

export function acceptanceProcedure(body: string): string | null {
  const normalized = normalizeNewlines(body)
  const lines = normalized.split("\n")
  let markerIndex = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] === commentMarkers.acceptance) {
      markerIndex = i
      break
    }
  }
  if (markerIndex < 0) {
    return null
  }
  return lines.slice(markerIndex + 1).join("\n")
}

function compareComments(a: IssueComment, b: IssueComment): number {
  if (a.createdAt !== b.createdAt) {
    return a.createdAt < b.createdAt ? -1 : 1
  }
  if (a.id !== b.id) {
    return a.id < b.id ? -1 : 1
  }
  return 0
}

export function relateComments(
  comments: readonly IssueComment[],
): RelatedComments {
  const sorted = [...comments].sort(compareComments)
  const pairs: { confirm: IssueComment; answer: IssueComment }[] = []
  const unanswered: IssueComment[] = []
  const unpairedAnswers: IssueComment[] = []
  const pending: IssueComment[] = []
  let acceptance: IssueComment | null = null

  for (const comment of sorted) {
    const { kind } = parseComment(comment.body)
    if (kind === "confirm") {
      pending.push(comment)
      continue
    }
    if (kind === "answer") {
      if (pending.length === 0) {
        unpairedAnswers.push(comment)
      } else {
        const confirm = pending.shift()!
        pairs.push({ confirm, answer: comment })
      }
      continue
    }
    if (kind === "acceptance") {
      acceptance = comment
    }
  }

  unanswered.push(...pending)

  return {
    pairs,
    unanswered,
    unpairedAnswers,
    acceptance,
  }
}

export function readReflectedIds(markdown: string): string[] {
  const normalized = normalizeNewlines(markdown)
  const lines = normalized.split("\n")
  const openIndices: number[] = []
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] === reflectedOpenLine) {
      openIndices.push(i)
    }
  }
  if (openIndices.length === 0) {
    return []
  }
  if (openIndices.length > 1) {
    reject(MULTIPLE_REFLECTED)
  }
  const openIndex = openIndices[0]
  let closeIndex = -1
  for (let i = openIndex + 1; i < lines.length; i += 1) {
    if (lines[i] === reflectedCloseLine) {
      closeIndex = i
      break
    }
  }
  if (closeIndex < 0) {
    reject(BAD_REFLECTED)
  }
  const ids: string[] = []
  const seen = new Set<string>()
  for (let i = openIndex + 1; i < closeIndex; i += 1) {
    const line = lines[i]
    if (line.trim().length === 0) {
      continue
    }
    if (!isValidReflectedId(line)) {
      reject(BAD_REFLECTED)
    }
    if (seen.has(line)) {
      reject(BAD_REFLECTED)
    }
    seen.add(line)
    ids.push(line)
  }
  for (let i = closeIndex + 1; i < lines.length; i += 1) {
    if (lines[i].trim().length > 0) {
      reject(BAD_REFLECTED)
    }
  }
  return ids
}

export function withReflectedId(markdown: string, commentId: string): string {
  assertValidReflectCommentId(commentId)
  const normalized = normalizeNewlines(markdown)
  const existingIds = readReflectedIds(normalized)
  if (existingIds.includes(commentId)) {
    return normalized
  }
  const newIds = [...existingIds, commentId]
  const block = formatReflectedBlock(newIds)
  const lines = normalized.split("\n")
  const openIndex = lines.findIndex((line) => line === reflectedOpenLine)
  if (openIndex >= 0) {
    if (openIndex === 0) {
      return block
    }
    const before = lines.slice(0, openIndex).join("\n")
    return `${before}\n${block}`
  }
  let base = normalized
  if (base.length > 0 && !base.endsWith("\n")) {
    base = `${base}\n`
  }
  return `${base}${block}`
}

export const reviewJudgmentMarkers = {
  pass: "判定: 合格",
  fail: "判定: 不合格",
} as const

export const reviewConfirmMarkers = {
  yes: "確認: あり",
  no: "確認: なし",
} as const

export type ReviewJudgment = "pass" | "fail" | "absent"

export type ReviewConfirm = "yes" | "no" | "absent"

export type ParsedReview = {
  judgment: ReviewJudgment
  confirm: ReviewConfirm
}

export function parseReview(body: string): ParsedReview {
  const normalized = normalizeNewlines(body)
  const lines = normalized.split("\n")
  let judgmentIndex = -1
  let judgment: ReviewJudgment = "absent"
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]
    if (line === reviewJudgmentMarkers.pass) {
      judgment = "pass"
      judgmentIndex = i
      break
    }
    if (line === reviewJudgmentMarkers.fail) {
      judgment = "fail"
      judgmentIndex = i
      break
    }
  }
  if (judgment !== "fail") {
    return { judgment, confirm: "absent" }
  }
  for (let i = judgmentIndex - 1; i >= 0; i -= 1) {
    const line = lines[i]
    if (line === reviewConfirmMarkers.yes) {
      return { judgment, confirm: "yes" }
    }
    if (line === reviewConfirmMarkers.no) {
      return { judgment, confirm: "no" }
    }
  }
  return { judgment, confirm: "absent" }
}

export function unincorporatedAnswers(
  comments: readonly IssueComment[],
  specs: { requirements: string; design: string },
): IssueComment[] {
  const reqIds = readReflectedIds(specs.requirements)
  const designIds = readReflectedIds(specs.design)
  const reflected = new Set([...reqIds, ...designIds])
  const { pairs } = relateComments(comments)
  const result: IssueComment[] = []
  for (const pair of pairs) {
    if (!reflected.has(pair.answer.id)) {
      result.push(pair.answer)
    }
  }
  return result
}

export const pullRequestCommentMarkers = {
  bug: "sdd-cur: 不具合",
  fix: "sdd-cur: 修正",
} as const

export const fixedMarker = "sdd-cur:fixed"
export const fixedOpenLine = `<!-- ${fixedMarker}`
export const fixedCloseLine = "-->"

export type PullRequestCommentKind = "bug" | "fix" | "other"

export type ParsedPullRequestComment = {
  kind: PullRequestCommentKind
  payload: string
}

const MULTIPLE_FIXED = "修正の記録が複数あります"
const BAD_FIXED = "修正の記録を解釈できません"
const EMPTY_FIX_COMMENT = "修正コメントが空です"
const MARKER_IN_FIX = "修正コメントに印を含めない"
const NO_BUGS_TO_FIX = "修正する不具合がありません"
const INVALID_FIX_ID = "修正するコメントが不正です"

const allIssueMarkers = new Set<string>([
  ...Object.values(commentMarkers),
  ...Object.values(pullRequestCommentMarkers),
])

function formatFixedBlock(ids: readonly string[]): string {
  const lines = [fixedOpenLine, ...ids, fixedCloseLine, ""]
  return lines.join("\n")
}

export function parsePullRequestComment(body: string): ParsedPullRequestComment {
  const normalized = normalizeNewlines(body)
  const lines = normalized.split("\n")
  const index = firstNonemptyLineIndex(lines)
  if (index < 0) {
    return { kind: "other", payload: normalized }
  }
  const firstLine = lines[index]
  let kind: PullRequestCommentKind = "other"
  if (firstLine === pullRequestCommentMarkers.bug) {
    kind = "bug"
  } else if (firstLine === pullRequestCommentMarkers.fix) {
    kind = "fix"
  }
  if (kind === "other") {
    return { kind, payload: normalized }
  }
  const payload = lines.slice(index + 1).join("\n")
  return { kind, payload }
}

export function readFixedIds(body: string): string[] {
  const normalized = normalizeNewlines(body)
  const lines = normalized.split("\n")
  const openIndices: number[] = []
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] === fixedOpenLine) {
      openIndices.push(i)
    }
  }
  if (openIndices.length === 0) {
    return []
  }
  if (openIndices.length > 1) {
    reject(MULTIPLE_FIXED)
  }
  const openIndex = openIndices[0]
  let closeIndex = -1
  for (let i = openIndex + 1; i < lines.length; i += 1) {
    if (lines[i] === fixedCloseLine) {
      closeIndex = i
      break
    }
  }
  if (closeIndex < 0) {
    reject(BAD_FIXED)
  }
  const ids: string[] = []
  const seen = new Set<string>()
  for (let i = openIndex + 1; i < closeIndex; i += 1) {
    const line = lines[i]
    if (line.trim().length === 0) {
      continue
    }
    if (!isValidReflectedId(line)) {
      reject(BAD_FIXED)
    }
    if (seen.has(line)) {
      reject(BAD_FIXED)
    }
    seen.add(line)
    ids.push(line)
  }
  for (let i = closeIndex + 1; i < lines.length; i += 1) {
    if (lines[i].trim().length > 0) {
      reject(BAD_FIXED)
    }
  }
  return ids
}

export function selectUnprocessedBugs(
  comments: readonly IssueComment[],
): IssueComment[] {
  const sorted = [...comments].sort(compareComments)
  const fixedIds = new Set<string>()
  for (const comment of sorted) {
    const { kind } = parsePullRequestComment(comment.body)
    if (kind !== "fix") {
      continue
    }
    const ids = readFixedIds(comment.body)
    for (const id of ids) {
      fixedIds.add(id)
    }
  }
  const result: IssueComment[] = []
  for (const comment of sorted) {
    const { kind } = parsePullRequestComment(comment.body)
    if (kind !== "bug") {
      continue
    }
    if (!fixedIds.has(comment.id)) {
      result.push(comment)
    }
  }
  return result
}

export const formMarker = "sdd-cur:form"
export const formMarkerLine = `<!-- ${formMarker} -->`

export const ambiguousWords: readonly string[] = [
  "適切に",
  "必要に応じて",
  "適宜",
  "可能な限り",
  "十分に",
  "なるべく",
  "できるだけ",
  "高速に",
  "使いやすく",
  "柔軟に",
  "基本的に",
  "原則として",
  "一般的に",
  "望ましくは",
  "できれば",
  "TBD",
  "TODO",
  "FIXME",
]

export function hasFormMarker(markdown: string): boolean {
  const lines = normalizeNewlines(markdown).split("\n")
  const nonempty: string[] = []
  for (const line of lines) {
    if (line.trim().length > 0) {
      nonempty.push(line)
    }
  }
  if (nonempty.length < 2) {
    return false
  }
  return nonempty[1] === formMarkerLine
}

const REQUIRED_SECTIONS: Record<
  "requirements" | "design",
  readonly string[]
> = {
  requirements: ["受け入れ条件"],
  design: ["受け入れ条件", "範囲外", "決定", "テスト"],
}

function hasExactSectionHeading(markdown: string, name: string): boolean {
  const heading = `## ${name}`
  for (const line of normalizeNewlines(markdown).split("\n")) {
    if (line === heading) {
      return true
    }
  }
  return false
}

function firstSectionBody(markdown: string, name: string): string | null {
  const heading = `## ${name}`
  const lines = normalizeNewlines(markdown).split("\n")
  let start = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] === heading) {
      start = i + 1
      break
    }
  }
  if (start < 0) {
    return null
  }
  const bodyLines: string[] = []
  for (let i = start; i < lines.length; i += 1) {
    if (lines[i].startsWith("## ")) {
      break
    }
    bodyLines.push(lines[i])
  }
  return bodyLines.join("\n")
}

type ParsedAcceptanceItem = {
  number: number
  line: string
}

function isNonEmptyTrimmed(value: string): boolean {
  return value.length > 0 && value === value.trim()
}

function parseAcceptanceLine(line: string): ParsedAcceptanceItem | null {
  if (!line.startsWith("- ")) {
    return null
  }
  const condLabel = ". 条件: "
  const condIdx = line.indexOf(condLabel)
  if (condIdx < 2) {
    return null
  }
  const numStr = line.slice(2, condIdx)
  if (!/^[1-9]\d*$/.test(numStr)) {
    return null
  }
  const number = Number(numStr)
  if (!Number.isSafeInteger(number) || number < 1) {
    return null
  }
  const subjectLabel = " 主体: "
  const resultLabel = " 結果: "
  const afterCond = line.slice(condIdx + condLabel.length)
  const subjectIdx = afterCond.indexOf(subjectLabel)
  if (subjectIdx < 0) {
    return null
  }
  const condition = afterCond.slice(0, subjectIdx)
  const afterSubject = afterCond.slice(subjectIdx + subjectLabel.length)
  const resultIdx = afterSubject.indexOf(resultLabel)
  if (resultIdx < 0) {
    return null
  }
  const subject = afterSubject.slice(0, resultIdx)
  const result = afterSubject.slice(resultIdx + resultLabel.length)
  if (
    !isNonEmptyTrimmed(condition) ||
    !isNonEmptyTrimmed(subject) ||
    !isNonEmptyTrimmed(result)
  ) {
    return null
  }
  if (condition.includes(subjectLabel) || subject.includes(resultLabel)) {
    return null
  }
  return { number, line }
}

function collectAcceptanceViolations(body: string | null): {
  shapeViolations: string[]
  numbers: number[]
} {
  if (body === null) {
    return { shapeViolations: [], numbers: [] }
  }
  const shapeViolations: string[] = []
  const numbers: number[] = []
  for (const line of body.split("\n")) {
    if (line.trim().length === 0) {
      continue
    }
    const parsed = parseAcceptanceLine(line)
    if (parsed === null) {
      shapeViolations.push(`受け入れ条件の形が不正です: ${line}`)
      continue
    }
    numbers.push(parsed.number)
  }
  return { shapeViolations, numbers }
}

function duplicateNumberViolations(numbers: readonly number[]): string[] {
  const counts = new Map<number, number>()
  for (const n of numbers) {
    counts.set(n, (counts.get(n) ?? 0) + 1)
  }
  const dups = [...counts.entries()]
    .filter(([, c]) => c > 1)
    .map(([n]) => n)
    .sort((a, b) => a - b)
  return dups.map((n) => `受け入れ条件の番号が重複しています: ${n}`)
}

function extractTestRefs(line: string): number[] {
  const refs: number[] = []
  const re = /\[([1-9]\d*)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) {
    const n = Number(m[1])
    if (Number.isSafeInteger(n) && n >= 1 && String(n) === m[1]) {
      refs.push(n)
    }
  }
  return refs
}

function collectTestReferenceViolations(
  markdown: string,
  acceptanceNumbers: readonly number[],
): string[] {
  const violations: string[] = []
  const acceptanceBody = firstSectionBody(markdown, "受け入れ条件")
  const testBody = firstSectionBody(markdown, "テスト")
  if (acceptanceBody === null || testBody === null) {
    return violations
  }
  const acceptanceSet = new Set(acceptanceNumbers)
  const referenced = new Set<number>()
  const seenBadRef = new Set<number>()

  for (const line of testBody.split("\n")) {
    if (!line.startsWith("- ")) {
      continue
    }
    const refs = extractTestRefs(line)
    if (refs.length === 0) {
      violations.push(`テストが受け入れ条件を参照していません: ${line}`)
      continue
    }
    for (const ref of refs) {
      if (!acceptanceSet.has(ref)) {
        if (!seenBadRef.has(ref)) {
          seenBadRef.add(ref)
          violations.push(
            `テストが参照する受け入れ条件がありません: ${ref}`,
          )
        }
      } else {
        referenced.add(ref)
      }
    }
  }

  const unreferenced = [...acceptanceSet]
    .filter((n) => !referenced.has(n))
    .sort((a, b) => a - b)
  for (const n of unreferenced) {
    violations.push(`受け入れ条件がテストから参照されていません: ${n}`)
  }
  return violations
}

function isWorkListItemLine(line: string): boolean {
  if (!line.startsWith("- ")) {
    return false
  }
  return /^[1-9]\d*\. /.test(line.slice(2))
}

function collectWorkListReferenceViolations(
  markdown: string,
  acceptanceNumbers: readonly number[],
): string[] {
  const acceptanceSet = new Set(acceptanceNumbers)
  if (acceptanceSet.size === 0) {
    return []
  }
  const workListBody = firstSectionBody(markdown, "作業の一覧")
  const referenced = new Set<number>()
  if (workListBody !== null) {
    for (const line of workListBody.split("\n")) {
      if (!isWorkListItemLine(line)) {
        continue
      }
      for (const ref of extractTestRefs(line)) {
        if (acceptanceSet.has(ref)) {
          referenced.add(ref)
        }
      }
    }
  }
  const violations: string[] = []
  const missing = [...acceptanceSet]
    .filter((n) => !referenced.has(n))
    .sort((a, b) => a - b)
  for (const n of missing) {
    violations.push(`受け入れ条件が作業の一覧に入っていません: ${n}`)
  }
  return violations
}

function collectReflectedViolation(markdown: string): string | null {
  try {
    readReflectedIds(markdown)
    return null
  } catch (error) {
    if (error instanceof Error) {
      return error.message
    }
    return BAD_REFLECTED
  }
}

function collectAmbiguousWordViolations(markdown: string): string[] {
  const normalized = normalizeNewlines(markdown)
  const violations: string[] = []
  for (const word of ambiguousWords) {
    if (normalized.includes(word)) {
      violations.push(`曖昧な語があります: ${word}`)
    }
  }
  return violations
}

export function validateSpecForm(
  kind: "requirements" | "design",
  markdown: string,
): string[] {
  if (!hasFormMarker(markdown)) {
    return []
  }

  const violations: string[] = []

  for (const section of REQUIRED_SECTIONS[kind]) {
    if (!hasExactSectionHeading(markdown, section)) {
      violations.push(`必須の節がありません: ${section}`)
    }
  }

  const acceptanceBody = firstSectionBody(markdown, "受け入れ条件")
  const { shapeViolations, numbers } =
    collectAcceptanceViolations(acceptanceBody)
  violations.push(...shapeViolations)
  violations.push(...duplicateNumberViolations(numbers))

  if (
    kind === "design" &&
    acceptanceBody !== null &&
    firstSectionBody(markdown, "テスト") !== null
  ) {
    violations.push(...collectTestReferenceViolations(markdown, numbers))
  }

  if (kind === "design") {
    violations.push(...collectWorkListReferenceViolations(markdown, numbers))
  }

  const reflected = collectReflectedViolation(markdown)
  if (reflected !== null) {
    violations.push(reflected)
  }

  violations.push(...collectAmbiguousWordViolations(markdown))

  return violations
}

export function fixComment(payload: string, ids: readonly string[]): string {
  if (payload.trim().length === 0) {
    reject(EMPTY_FIX_COMMENT)
  }
  const normalized = normalizeNewlines(payload)
  const lines = normalized.split("\n")
  const index = firstNonemptyLineIndex(lines)
  if (index >= 0 && allIssueMarkers.has(lines[index])) {
    reject(MARKER_IN_FIX)
  }
  for (const line of lines) {
    if (line === fixedOpenLine) {
      reject(MARKER_IN_FIX)
    }
  }
  if (ids.length === 0) {
    reject(NO_BUGS_TO_FIX)
  }
  const seen = new Set<string>()
  for (const id of ids) {
    if (!isValidReflectedId(id)) {
      reject(INVALID_FIX_ID)
    }
    if (seen.has(id)) {
      reject(BAD_FIXED)
    }
    seen.add(id)
  }
  let body = `${pullRequestCommentMarkers.fix}\n${payload}`
  if (!body.endsWith("\n")) {
    body = `${body}\n`
  }
  return `${body}${formatFixedBlock(ids)}`
}

export function canonicalIdsFromMarkdown(markdown: string): string[] {
  const lines = normalizeNewlines(markdown).split("\n")
  const ids: string[] = []
  for (const line of lines) {
    const match = line.match(CANONICAL_REQ_HEADING)
    if (match) {
      ids.push(`REQ-${match[1]}`)
    }
  }
  return ids
}

export async function readCanonicalIds(root: string): Promise<string[]> {
  const specDir = join(root, "docs/spec")
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
    reject(CANONICAL_READ_FAILED)
  }
  const mdFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort()
  const ids: string[] = []
  for (const name of mdFiles) {
    let content: string
    try {
      content = await readFile(join(specDir, name), "utf8")
    } catch {
      reject(CANONICAL_READ_FAILED)
    }
    ids.push(...canonicalIdsFromMarkdown(content))
  }
  return ids
}

type DeltaItemKind = "add" | "change" | "remove"

function parseDeltaItemHeading(
  line: string,
): { kind: DeltaItemKind; id: string } | null {
  let match = line.match(DELTA_ADD_HEADING)
  if (match) {
    return { kind: "add", id: match[2] }
  }
  match = line.match(DELTA_CHANGE_HEADING)
  if (match) {
    return { kind: "change", id: match[2] }
  }
  match = line.match(DELTA_REMOVE_HEADING)
  if (match) {
    return { kind: "remove", id: match[2] }
  }
  return null
}

function extractDeltaSectionLines(lines: readonly string[]): string[] | null {
  let startIndex = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] === DELTA_SECTION_HEADING) {
      startIndex = i
      break
    }
  }
  if (startIndex < 0) {
    return null
  }
  const sectionLines: string[] = []
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (lines[i].startsWith("## ")) {
      break
    }
    sectionLines.push(lines[i])
  }
  return sectionLines
}

export function validateCanonicalDelta(
  designMarkdown: string,
  canonicalIds: readonly string[],
): string[] {
  const lines = normalizeNewlines(designMarkdown).split("\n")
  const sectionLines = extractDeltaSectionLines(lines)
  if (sectionLines === null) {
    return []
  }
  const idSet = new Set(canonicalIds)
  const violations: string[] = []
  for (const line of sectionLines) {
    const item = parseDeltaItemHeading(line)
    if (!item) {
      continue
    }
    const hasId = idSet.has(item.id)
    if (item.kind === "add" && hasId) {
      violations.push(`追加する識別子が正本にあります: ${item.id}`)
    } else if (item.kind === "change" && !hasId) {
      violations.push(`変更する識別子が正本にありません: ${item.id}`)
    } else if (item.kind === "remove" && !hasId) {
      violations.push(`削除する識別子が正本にありません: ${item.id}`)
    }
  }
  return violations
}
