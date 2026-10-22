import { readdir, readFile, stat } from "node:fs/promises"
import { join } from "node:path"
import type { GitRunner } from "./git.ts"
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
  const dir = `docs/issues/${issueNumber}`
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

export const reviewModelFromRound3 =
  "grok-4.7[context=256k,reasoning_effort=high,fast=false]"

export const invalidConsecutiveFailuresMessage = "連続不合格の回数が不正です"

export type ReviewStage =
  | "requirements"
  | "reflect-design"
  | "quick"
  | "implement"

export type ReviewAction = "修正" | "やり直し" | "合格" | "止まる"

export type ReviewNextInput = {
  response: string
  consecutiveFailures: number
  previousFindings: string
  brokenStampRetries: number
}

export type ReviewNextSuccess = {
  consecutiveFailures: number
  previousFindings: string
  brokenStampRetries: number
  action: ReviewAction
  model: string
  kind: string
  reason?: string
  resultLine?: string
  rewriteProcedure?: boolean
}

export type ReviewNextResult =
  | { ok: true; value: ReviewNextSuccess }
  | { ok: false; message: typeof invalidConsecutiveFailuresMessage }

const FINDINGS_HEADING = "## 指摘"
const FINDINGS_LIST_INTRO = "1. 指摘。"
const NO_FINDINGS_LINE = "指摘なし"
const NUMBERED_LINE_HEADING_RE = /^\d+\./

function roundReviewModel(reviewRound: number): string {
  if (reviewRound === 1 || reviewRound === 2) {
    return ""
  }
  if (reviewRound >= 3) {
    return reviewModelFromRound3
  }
  return ""
}

function isNumberedFindingLine(line: string): boolean {
  const trimmed = line.trimStart()
  if (!NUMBERED_LINE_HEADING_RE.test(trimmed)) {
    return false
  }
  return line !== FINDINGS_LIST_INTRO
}

function numberedLineBody(line: string): string {
  const trimmed = line.trimStart()
  const dotIndex = trimmed.indexOf(".")
  if (dotIndex < 0) {
    return ""
  }
  let rest = trimmed.slice(dotIndex + 1)
  if (rest.startsWith(" ")) {
    rest = rest.slice(1)
  }
  return rest
}

function extractFindingsBlockLines(response: string): string[] {
  const lines = normalizeNewlines(response).split("\n")
  let start = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] === FINDINGS_HEADING) {
      start = i + 1
      break
    }
  }
  if (start < 0) {
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i] === FINDINGS_LIST_INTRO) {
        start = i + 1
        break
      }
    }
    if (start < 0) {
      return []
    }
    const block: string[] = []
    for (let i = start; i < lines.length; i += 1) {
      const line = lines[i]
      if (line.startsWith("#")) {
        break
      }
      if (line.startsWith("2. 直す箇所と")) {
        break
      }
      if (line.startsWith("2. パスごとの直す箇所")) {
        break
      }
      block.push(line)
    }
    return block
  }
  const block: string[] = []
  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.startsWith("#")) {
      break
    }
    block.push(line)
  }
  return block
}

export function extractFindings(response: string): string {
  const block = extractFindingsBlockLines(response)
  if (block.length === 0) {
    return ""
  }
  for (const line of block) {
    if (line === NO_FINDINGS_LINE) {
      return ""
    }
  }
  const bodies: string[] = []
  for (const line of block) {
    if (isNumberedFindingLine(line)) {
      bodies.push(numberedLineBody(line))
    }
  }
  if (bodies.length === 0) {
    return ""
  }
  if (bodies.length === 1) {
    return bodies[0]
  }
  return bodies.join("\n")
}

function lastNonemptyLine(response: string): string | null {
  const lines = normalizeNewlines(response).split("\n")
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lines[i].trim().length > 0) {
      return lines[i]
    }
  }
  return null
}

function quickJudgmentFromLastLine(
  lastLine: string | null,
): ReviewJudgment {
  if (lastLine === reviewJudgmentMarkers.pass) {
    return "pass"
  }
  if (lastLine === reviewJudgmentMarkers.fail) {
    return "fail"
  }
  return "absent"
}

function buildReviewNextSuccess(
  base: Omit<ReviewNextSuccess, "reason" | "resultLine" | "rewriteProcedure">,
  extras: {
    reason?: string
    resultLine?: string
    rewriteProcedure?: boolean
  },
): ReviewNextSuccess {
  const result: ReviewNextSuccess = { ...base }
  if (extras.reason !== undefined) {
    result.reason = extras.reason
  }
  if (extras.resultLine !== undefined) {
    result.resultLine = extras.resultLine
  }
  if (extras.rewriteProcedure !== undefined) {
    result.rewriteProcedure = extras.rewriteProcedure
  }
  return result
}

function implementContainsNoImplementationFinding(response: string): boolean {
  return response.includes("実装の指摘なし")
}

function implementContainsProcedureGap(response: string): boolean {
  return response.includes("成否が分からない")
}

function implementContainsTestOmission(response: string): boolean {
  return (
    response.includes("テスト節の実行省略") ||
    response.includes("実行していない")
  )
}

function isImplementTestOmissionOnly(
  parsed: ParsedReview,
  response: string,
): boolean {
  if (parsed.judgment !== "fail") {
    return false
  }
  if (!implementContainsNoImplementationFinding(response)) {
    return false
  }
  if (implementContainsProcedureGap(response)) {
    return false
  }
  return implementContainsTestOmission(response)
}

function isImplementAmbiguousFailOnly(
  parsed: ParsedReview,
  response: string,
  cf: number,
): boolean {
  if (parsed.judgment !== "fail") {
    return false
  }
  if (cf > 9) {
    return false
  }
  if (!implementContainsNoImplementationFinding(response)) {
    return false
  }
  if (implementContainsProcedureGap(response)) {
    return false
  }
  if (implementContainsTestOmission(response)) {
    return false
  }
  return true
}

function reviewNextRequirementsLike(
  stage: "requirements" | "reflect-design",
  input: ReviewNextInput,
): ReviewNextSuccess {
  const { response, brokenStampRetries } = input
  let cf = input.consecutiveFailures
  let pf = input.previousFindings
  let bsr = brokenStampRetries
  const parsed = parseReview(response)
  const extract = extractFindings(response)

  if (parsed.judgment === "absent") {
    if (bsr === 0) {
      return buildReviewNextSuccess(
        {
          consecutiveFailures: cf,
          previousFindings: pf,
          brokenStampRetries: 1,
          action: "やり直し",
          model: roundReviewModel(cf + 1),
          kind: "retryBrokenStamp",
        },
        {},
      )
    }
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: bsr,
        action: "止まる",
        model: "",
        kind: "stopBrokenStampTwice",
      },
      {},
    )
  }

  bsr = 0

  if (parsed.judgment === "pass") {
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: 0,
        action: "合格",
        model: "",
        kind: "passReview",
      },
      {},
    )
  }

  pf = extract
  cf += 1

  if (parsed.confirm === "yes") {
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: 0,
        action: "止まる",
        model: roundReviewModel(input.consecutiveFailures + 1),
        kind: "stopWaitConfirm",
      },
      {},
    )
  }

  if (parsed.confirm === "no") {
    if (stage === "reflect-design") {
      return buildReviewNextSuccess(
        {
          consecutiveFailures: cf,
          previousFindings: pf,
          brokenStampRetries: 0,
          action: "止まる",
          model: "",
          kind: "stopReflectDesignNoFix",
        },
        {},
      )
    }
    const sameFinding =
      input.previousFindings.length > 0 &&
      extract === input.previousFindings
    if (sameFinding) {
      return buildReviewNextSuccess(
        {
          consecutiveFailures: cf,
          previousFindings: pf,
          brokenStampRetries: 0,
          action: "止まる",
          model: "",
          kind: "stopSameFindingTwice",
        },
        {},
      )
    }
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: 0,
        action: "修正",
        model: roundReviewModel(cf + 1),
        kind: "fixAfterReview",
      },
      {},
    )
  }

  return buildReviewNextSuccess(
    {
      consecutiveFailures: cf,
      previousFindings: pf,
      brokenStampRetries: 0,
      action: "止まる",
      model: "",
      kind: "stopMissingConfirmLine",
    },
    {},
  )
}

function reviewNextQuick(input: ReviewNextInput): ReviewNextSuccess {
  const { response, brokenStampRetries } = input
  let cf = input.consecutiveFailures
  let pf = input.previousFindings
  const bsr = brokenStampRetries
  const lastLine = lastNonemptyLine(response)
  const judgment = quickJudgmentFromLastLine(lastLine)

  if (judgment === "absent") {
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: bsr,
        action: "止まる",
        model: "",
        kind: "stopQuickUndecidable",
      },
      { resultLine: "決められない" },
    )
  }

  if (judgment === "pass") {
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: bsr,
        action: "合格",
        model: "",
        kind: "passReview",
      },
      {},
    )
  }

  cf += 1
  pf = extractFindings(response)
  const parsed = parseReview(response)

  if (parsed.confirm === "yes") {
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: bsr,
        action: "止まる",
        model: "",
        kind: "stopQuickConfirmListed",
      },
      { resultLine: "決められない" },
    )
  }

  if (parsed.confirm === "no") {
    const sameFinding =
      input.previousFindings.length > 0 &&
      pf === input.previousFindings
    if (sameFinding) {
      return buildReviewNextSuccess(
        {
          consecutiveFailures: cf,
          previousFindings: pf,
          brokenStampRetries: bsr,
          action: "止まる",
          model: "",
          kind: "stopSameFindingTwice",
        },
        {},
      )
    }
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: bsr,
        action: "修正",
        model: roundReviewModel(cf + 1),
        kind: "fixAfterReview",
      },
      {},
    )
  }

  return buildReviewNextSuccess(
    {
      consecutiveFailures: cf,
      previousFindings: pf,
      brokenStampRetries: bsr,
      action: "止まる",
      model: "",
      kind: "stopQuickInvalidConfirm",
    },
    { resultLine: "決められない" },
  )
}

function reviewNextImplement(input: ReviewNextInput): ReviewNextSuccess {
  const { response, brokenStampRetries } = input
  const cfIn = input.consecutiveFailures
  let cf = cfIn
  const pf = input.previousFindings
  let bsr = brokenStampRetries
  const parsed = parseReview(response)

  if (parsed.judgment === "absent") {
    if (bsr === 0) {
      return buildReviewNextSuccess(
        {
          consecutiveFailures: cf,
          previousFindings: pf,
          brokenStampRetries: 1,
          action: "やり直し",
          model: roundReviewModel(cf + 1),
          kind: "retryBrokenStamp",
        },
        { rewriteProcedure: false },
      )
    }
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: bsr,
        action: "止まる",
        model: "",
        kind: "stopImplementNoJudgment",
      },
      {
        rewriteProcedure: false,
        reason: "レビューの判定がありません",
      },
    )
  }

  bsr = 0

  if (parsed.judgment === "pass") {
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: 0,
        action: "合格",
        model: "",
        kind: "passReview",
      },
      {},
    )
  }

  if (isImplementTestOmissionOnly(parsed, response)) {
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: 0,
        action: "やり直し",
        model: roundReviewModel(cf + 1),
        kind: "retryTestOmissionOnly",
      },
      { rewriteProcedure: false },
    )
  }

  if (isImplementAmbiguousFailOnly(parsed, response, cfIn)) {
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: 0,
        action: "やり直し",
        model: roundReviewModel(cf + 1),
        kind: "retryImplementAmbiguousFail",
      },
      { rewriteProcedure: false },
    )
  }

  cf += 1

  if (cf === 10) {
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: 0,
        action: "止まる",
        model: "",
        kind: "stopImplementMaxReviews",
      },
      {
        rewriteProcedure: false,
        reason: "実装レビューが不合格のまま10回に達した",
      },
    )
  }

  if (!implementContainsNoImplementationFinding(response)) {
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: 0,
        action: "修正",
        model: roundReviewModel(cf + 1),
        kind: "fixAfterReview",
      },
      { rewriteProcedure: false },
    )
  }

  if (implementContainsProcedureGap(response)) {
    return buildReviewNextSuccess(
      {
        consecutiveFailures: cf,
        previousFindings: pf,
        brokenStampRetries: 0,
        action: "やり直し",
        model: roundReviewModel(cf + 1),
        kind: "rewriteProcedureThenReview",
      },
      { rewriteProcedure: true },
    )
  }

  return buildReviewNextSuccess(
    {
      consecutiveFailures: cf,
      previousFindings: pf,
      brokenStampRetries: 0,
      action: "修正",
      model: roundReviewModel(cf + 1),
      kind: "fixAfterReview",
    },
    { rewriteProcedure: false },
  )
}

export function reviewNext(
  stage: ReviewStage,
  input: ReviewNextInput,
): ReviewNextResult {
  if (stage === "implement") {
    const cf = input.consecutiveFailures
    if (Number.isInteger(cf) && cf >= 10) {
      return { ok: false, message: invalidConsecutiveFailuresMessage }
    }
  }

  switch (stage) {
    case "requirements":
      return { ok: true, value: reviewNextRequirementsLike("requirements", input) }
    case "reflect-design":
      return {
        ok: true,
        value: reviewNextRequirementsLike("reflect-design", input),
      }
    case "quick":
      return { ok: true, value: reviewNextQuick(input) }
    case "implement":
      return { ok: true, value: reviewNextImplement(input) }
  }
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

function isMarkdownFenceLine(line: string): boolean {
  return /^`{3,}/.test(line.trimStart())
}

export function sectionBodies(markdown: string, name: string): string[] {
  const heading = `## ${name}`
  const lines = normalizeNewlines(markdown).split("\n")
  const bodies: string[] = []
  let i = 0
  let inFence = false
  while (i < lines.length) {
    const line = lines[i]
    if (isMarkdownFenceLine(line)) {
      inFence = !inFence
      i += 1
      continue
    }
    if (!inFence && line === heading) {
      const bodyLines: string[] = []
      let j = i + 1
      for (; j < lines.length; j += 1) {
        if (lines[j].startsWith("## ")) {
          break
        }
        bodyLines.push(lines[j])
      }
      bodies.push(bodyLines.join("\n"))
      i = j
    } else {
      i += 1
    }
  }
  return bodies
}

export function firstSectionBody(markdown: string, name: string): string | null {
  const bodies = sectionBodies(markdown, name)
  if (bodies.length === 0) {
    return null
  }
  return bodies[0]
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

export function extractTestRefs(line: string): number[] {
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

export function isWorkListItemLine(line: string): boolean {
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

const evidenceCitationPattern = /（`([^`]+)` の ([0-9]+) 行）/g

export function countGitShowContentLines(content: string): number {
  if (content.length === 0) {
    return 0
  }
  const lines = content.split("\n")
  if (content.endsWith("\n")) {
    return lines.length - 1
  }
  return lines.length
}

function formatEvidenceLineNumber(nLiteral: string): string {
  return String(parseInt(nLiteral, 10))
}

export function collectEvidenceViolations(
  markdown: string,
  readMainFile: (path: string) => string | null,
): string[] {
  if (!hasFormMarker(markdown)) {
    return []
  }
  const body = firstSectionBody(markdown, "現状")
  if (body === null) {
    return []
  }

  const violations: string[] = []
  const pattern = new RegExp(evidenceCitationPattern.source, "g")
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) {
    const filePath = match[1]
    const nLiteral = match[2]
    const nValue = parseInt(nLiteral, 10)
    const nDisplay = formatEvidenceLineNumber(nLiteral)

    const content = readMainFile(filePath)
    if (content === null) {
      violations.push(`根拠のファイルが main にありません: ${filePath}`)
      continue
    }
    if (nValue < 1) {
      violations.push(`根拠の行番号が不正です: ${nDisplay}`)
      continue
    }
    const lineCount = countGitShowContentLines(content)
    if (nValue > lineCount) {
      violations.push(
        `根拠の行番号がファイルの行数を超えています: ${filePath} ${nDisplay}`,
      )
    }
  }
  return violations
}

export async function collectEvidenceViolationsAsync(
  markdown: string,
  readMainFile: (path: string) => Promise<string | null>,
): Promise<string[]> {
  if (!hasFormMarker(markdown)) {
    return []
  }
  const body = firstSectionBody(markdown, "現状")
  if (body === null) {
    return []
  }

  const violations: string[] = []
  const pattern = new RegExp(evidenceCitationPattern.source, "g")
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) {
    const filePath = match[1]
    const nLiteral = match[2]
    const nValue = parseInt(nLiteral, 10)
    const nDisplay = formatEvidenceLineNumber(nLiteral)

    const content = await readMainFile(filePath)
    if (content === null) {
      violations.push(`根拠のファイルが main にありません: ${filePath}`)
      continue
    }
    if (nValue < 1) {
      violations.push(`根拠の行番号が不正です: ${nDisplay}`)
      continue
    }
    const lineCount = countGitShowContentLines(content)
    if (nValue > lineCount) {
      violations.push(
        `根拠の行番号がファイルの行数を超えています: ${filePath} ${nDisplay}`,
      )
    }
  }
  return violations
}

export function collectChangeFilePathViolations(markdown: string): string[] {
  if (!hasFormMarker(markdown)) {
    return []
  }
  const body = firstSectionBody(markdown, "変えるファイル")
  if (body === null) {
    return []
  }

  const violations: string[] = []
  for (const line of body.split("\n")) {
    const filePath = line.startsWith("- ") ? line.slice(2) : line
    if (filePath.startsWith("..") || filePath.startsWith("/")) {
      violations.push(`変えるファイルのパスが不正です: ${filePath}`)
    }
  }
  return violations
}

const SPEC_DIFF_CANT_READ = "仕様を読めません"
const SPEC_DIFF_GIT_FAILED = "git を実行できません"
const CANONICAL_DOMAIN =
  /^([a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/

function isBlankLine(line: string): boolean {
  return line.trim().length === 0
}

function trimBodyEdges(bodyLines: readonly string[]): string {
  let start = 0
  let end = bodyLines.length
  while (start < end && isBlankLine(bodyLines[start])) {
    start += 1
  }
  while (end > start && isBlankLine(bodyLines[end - 1])) {
    end -= 1
  }
  return bodyLines.slice(start, end).join("\n")
}

function canonicalReqBodiesFromMarkdown(markdown: string): Map<string, string> {
  const lines = normalizeNewlines(markdown).split("\n")
  const map = new Map<string, string>()
  let i = 0
  while (i < lines.length) {
    const match = lines[i].match(CANONICAL_REQ_HEADING)
    if (match) {
      const id = `REQ-${match[1]}`
      const bodyLines: string[] = []
      i += 1
      while (i < lines.length) {
        if (lines[i].match(CANONICAL_REQ_HEADING)) {
          break
        }
        bodyLines.push(lines[i])
        i += 1
      }
      map.set(id, trimBodyEdges(bodyLines))
      continue
    }
    i += 1
  }
  return map
}

function specDiffReqKey(domain: string, id: string): string {
  return `${domain}\0${id}`
}

function parseDeltaItemHeadingWithDomain(
  line: string,
): { kind: DeltaItemKind; domain: string; id: string } | null {
  let match = line.match(DELTA_ADD_HEADING)
  if (match) {
    return { kind: "add", domain: match[1], id: match[2] }
  }
  match = line.match(DELTA_CHANGE_HEADING)
  if (match) {
    return { kind: "change", domain: match[1], id: match[2] }
  }
  match = line.match(DELTA_REMOVE_HEADING)
  if (match) {
    return { kind: "remove", domain: match[1], id: match[2] }
  }
  return null
}

type DeltaItemWithBody = {
  kind: DeltaItemKind
  domain: string
  id: string
  body: string
}

function parseDeltaItems(designMarkdown: string): DeltaItemWithBody[] {
  const lines = normalizeNewlines(designMarkdown).split("\n")
  const sectionLines = extractDeltaSectionLines(lines)
  if (sectionLines === null) {
    return []
  }
  const items: DeltaItemWithBody[] = []
  let i = 0
  while (i < sectionLines.length) {
    const heading = parseDeltaItemHeadingWithDomain(sectionLines[i])
    if (!heading) {
      i += 1
      continue
    }
    const bodyLines: string[] = []
    i += 1
    while (i < sectionLines.length) {
      if (parseDeltaItemHeadingWithDomain(sectionLines[i])) {
        break
      }
      bodyLines.push(sectionLines[i])
      i += 1
    }
    items.push({
      kind: heading.kind,
      domain: heading.domain,
      id: heading.id,
      body: trimBodyEdges(bodyLines),
    })
  }
  return items
}

function applyDeltaToBaseline(
  baseline: Map<string, string>,
  items: readonly DeltaItemWithBody[],
): Map<string, string> {
  const result = new Map(baseline)
  for (const item of items) {
    const key = specDiffReqKey(item.domain, item.id)
    if (item.kind === "remove") {
      result.delete(key)
    } else {
      result.set(key, item.body)
    }
  }
  return result
}

function firstNonemptyLineFromGitOutput(text: string): string | null {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }
  return null
}

function domainFromLsTreePath(treePath: string): string | null {
  const prefix = "docs/canonical/"
  if (!treePath.startsWith(prefix) || !treePath.endsWith(".md")) {
    return null
  }
  const domain = treePath.slice(prefix.length, -3)
  if (!CANONICAL_DOMAIN.test(domain)) {
    return null
  }
  return domain
}

async function runGitForSpecDiff(
  git: GitRunner,
  args: string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    return await git.run(args, { cwd })
  } catch {
    throw new Error(SPEC_DIFF_GIT_FAILED)
  }
}

async function readBaselineCanonicalMap(
  git: GitRunner,
  cwd: string,
): Promise<Map<string, string>> {
  const remoteResult = await runGitForSpecDiff(git, ["remote"], cwd)
  if (remoteResult.exitCode !== 0) {
    throw new Error(SPEC_DIFF_GIT_FAILED)
  }
  const remote = firstNonemptyLineFromGitOutput(remoteResult.stdout)
  if (!remote) {
    throw new Error(SPEC_DIFF_GIT_FAILED)
  }
  const symResult = await runGitForSpecDiff(
    git,
    ["symbolic-ref", `refs/remotes/${remote}/HEAD`],
    cwd,
  )
  if (symResult.exitCode !== 0) {
    throw new Error(SPEC_DIFF_GIT_FAILED)
  }
  const ref = firstNonemptyLineFromGitOutput(symResult.stdout)
  if (!ref) {
    throw new Error(SPEC_DIFF_GIT_FAILED)
  }
  let listResult = await runGitForSpecDiff(
    git,
    ["ls-tree", "--name-only", ref, "docs/canonical"],
    cwd,
  )
  if (listResult.exitCode !== 0) {
    throw new Error(SPEC_DIFF_GIT_FAILED)
  }
  let treePaths = listResult.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  if (!treePaths.some((line) => line.endsWith(".md"))) {
    listResult = await runGitForSpecDiff(
      git,
      ["ls-tree", "--name-only", ref, "docs/canonical/"],
      cwd,
    )
    if (listResult.exitCode !== 0) {
      throw new Error(SPEC_DIFF_GIT_FAILED)
    }
    treePaths = listResult.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  }
  const baseline = new Map<string, string>()
  for (const treePath of treePaths) {
    const domain = domainFromLsTreePath(treePath)
    if (!domain) {
      continue
    }
    const showResult = await runGitForSpecDiff(
      git,
      ["show", `${ref}:${treePath}`],
      cwd,
    )
    if (showResult.exitCode !== 0) {
      continue
    }
    const bodies = canonicalReqBodiesFromMarkdown(showResult.stdout)
    for (const [id, body] of bodies) {
      baseline.set(specDiffReqKey(domain, id), body)
    }
  }
  return baseline
}

async function readWorktreeCanonicalMap(
  root: string,
): Promise<Map<string, string>> {
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
      return new Map()
    }
    throw err
  }
  const map = new Map<string, string>()
  const mdFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort()
  for (const name of mdFiles) {
    const domain = name.slice(0, -3)
    if (!CANONICAL_DOMAIN.test(domain)) {
      continue
    }
    const content = await readFile(join(specDir, name), "utf8")
    const bodies = canonicalReqBodiesFromMarkdown(content)
    for (const [id, body] of bodies) {
      map.set(specDiffReqKey(domain, id), body)
    }
  }
  return map
}

function compareCanonicalMaps(
  expected: Map<string, string>,
  worktree: Map<string, string>,
): string[] {
  const lines: string[] = []
  const keys = new Set([...expected.keys(), ...worktree.keys()])
  for (const key of keys) {
    const sep = key.indexOf("\0")
    const domain = key.slice(0, sep)
    const id = key.slice(sep + 1)
    const inExpected = expected.has(key)
    const inWorktree = worktree.has(key)
    if (inExpected && inWorktree) {
      if (expected.get(key) !== worktree.get(key)) {
        lines.push(`正本が一致しません: ${domain} ${id} 本文が違います`)
      }
    } else if (inExpected && !inWorktree) {
      lines.push(`正本が一致しません: ${domain} ${id} 作業ツリーにありません`)
    } else if (!inExpected && inWorktree) {
      lines.push(`正本が一致しません: ${domain} ${id} 作業ツリーにだけあります`)
    }
  }
  return lines
}

async function readDesignForSpecDiff(
  designPath: string,
): Promise<{ exists: boolean; markdown: string }> {
  try {
    const info = await stat(designPath)
    if (!info.isFile()) {
      throw new Error(SPEC_DIFF_CANT_READ)
    }
    const markdown = await readFile(designPath, "utf8")
    return { exists: true, markdown }
  } catch (error) {
    if (error instanceof Error && error.message === SPEC_DIFF_CANT_READ) {
      throw error
    }
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "ENOENT"
    ) {
      return { exists: false, markdown: "" }
    }
    throw new Error(SPEC_DIFF_CANT_READ)
  }
}

export async function specDiff(options: {
  cwd: string
  issueNumber: number
  git: GitRunner
}): Promise<string[]> {
  const { cwd, issueNumber, git } = options
  const paths = specPaths(issueNumber)
  const designPath = join(cwd, paths.design)
  const designFile = await readDesignForSpecDiff(designPath)
  const deltaItems = designFile.exists
    ? parseDeltaItems(designFile.markdown)
    : []
  const baseline = await readBaselineCanonicalMap(git, cwd)
  const expected = applyDeltaToBaseline(baseline, deltaItems)
  const worktree = await readWorktreeCanonicalMap(cwd)
  return compareCanonicalMaps(expected, worktree)
}
