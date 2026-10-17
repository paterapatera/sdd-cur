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
