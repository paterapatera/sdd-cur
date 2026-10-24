import { mkdir, readFile, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import {
  commentMarkers,
  type CommentKind,
  isSpecHeading,
  parseComment,
  readReflectedIds,
  reflectedOpenLine,
  relateComments,
  specPaths,
  unincorporatedAnswers,
  withReflectedId,
} from "./conventions.ts"
import type { GitHubClient, Issue, IssueComment } from "./github.ts"
import { quickTargetLabel, workflowLabels } from "./labels.ts"

const INVALID_NUMBER = "番号が不正です"
const INVALID_KIND = "種別が不正です"
const EMPTY_CONFIRM = "確認の本文が空です"
const MARKER_IN_CONFIRM = "確認の本文に印を含めない"
const EMPTY_CLOSE = "コメント本文が空です"
const MARKER_IN_CLOSE = "コメント本文に印を含めない"
const INVALID_TITLE = "題が不正です"
const CLOSED_ISSUE = "課題は閉じています"
const WORKFLOW_LABEL = "実装のラベルが付いています"
const UNINCORPORATED = "未反映の回答があります"
const UNANSWERED = "未回答の確認があります"
const NO_ANSWER = "未反映の回答はありません"
const NOT_REFLECTED = "回答が本文に反映されていません"
const NO_REQUIREMENTS = "要件がありません"
const BAD_REQ_HEADING = "要件の見出しが不正です"
const BAD_DES_HEADING = "設計の見出しが不正です"
const BAD_HEADING = "見出しが不正です"
const CANT_READ_SPEC = "仕様を読めません"

const workflowLabelNames = new Set(workflowLabels.map((l) => l.name))
const allMarkers = new Set<string>(Object.values(commentMarkers))

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

function compareComments(a: IssueComment, b: IssueComment): number {
  if (a.createdAt !== b.createdAt) {
    return a.createdAt < b.createdAt ? -1 : 1
  }
  if (a.id !== b.id) {
    return a.id < b.id ? -1 : 1
  }
  return 0
}

function contentWithoutReflectedBlock(markdown: string): string {
  const normalized = normalizeNewlines(markdown)
  const lines = normalized.split("\n")
  const openIndex = lines.findIndex((line) => line === reflectedOpenLine)
  if (openIndex < 0) {
    return normalized
  }
  if (openIndex === 0) {
    return ""
  }
  return lines.slice(0, openIndex).join("\n")
}

export function parseIssueNumberString(text: string): number {
  if (!/^[1-9]\d*$/.test(text)) {
    reject(INVALID_NUMBER)
  }
  const issueNumber = Number(text)
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) {
    reject(INVALID_NUMBER)
  }
  return issueNumber
}

export function parseSpecKind(text: string): "requirements" | "design" {
  if (text === "requirements" || text === "design") {
    return text
  }
  reject(INVALID_KIND)
}

export type Candidate = {
  number: number
  title: string
  url: string
}

export function candidateViews(issues: readonly Issue[]): Candidate[] {
  const result: Candidate[] = []
  for (const issue of issues) {
    if (issue.state !== "open") {
      continue
    }
    if (issue.labels.some((label) => workflowLabelNames.has(label))) {
      continue
    }
    result.push({
      number: issue.number,
      title: issue.title,
      url: issue.url,
    })
  }
  result.sort((a, b) => a.number - b.number)
  return result
}

export function isQuickTarget(issue: {
  body: string
  labels: readonly string[]
}): boolean {
  return issue.labels.includes(quickTargetLabel.name)
}

export async function listStartCandidates(github: {
  listIssues: GitHubClient["listIssues"]
}): Promise<Candidate[]> {
  const issues = await github.listIssues({ state: "open", limit: 100 })
  return candidateViews(issues)
}

export type SpecStatus = "missing" | "invalid" | "ready"

export function specStatus(
  exists: boolean,
  markdown: string,
  issueNumber: number,
): SpecStatus {
  if (!exists) {
    return "missing"
  }
  const normalized = normalizeNewlines(markdown)
  const lines = normalized.split("\n")
  if (lines.every((line) => line.trim().length === 0)) {
    return "missing"
  }
  if (isSpecHeading(normalized, issueNumber)) {
    return "ready"
  }
  return "invalid"
}

export type IssueView = {
  issue: {
    number: number
    title: string
    body: string
    state: "open" | "closed"
    labels: string[]
    url: string
  }
  comments: {
    id: string
    kind: CommentKind
    payload: string
    createdAt: string
  }[]
  unanswered: { id: string; payload: string }[]
  nextAnswer: { id: string; payload: string } | null
  specs: { requirements: SpecStatus; design: SpecStatus }
}

export function nextUnincorporatedAnswer(
  comments: readonly IssueComment[],
  specs: { requirements: string; design: string },
): IssueComment | null {
  const answers = unincorporatedAnswers(comments, specs)
  if (answers.length === 0) {
    return null
  }
  return answers[0]
}

export function buildIssueView(input: {
  issue: Issue
  comments: readonly IssueComment[]
  requirements: { exists: boolean; markdown: string }
  design: { exists: boolean; markdown: string }
}): IssueView {
  readReflectedIds(input.requirements.markdown)
  readReflectedIds(input.design.markdown)

  const issueNumber = input.issue.number
  const sorted = [...input.comments].sort(compareComments)
  const comments = sorted.map((comment) => {
    const parsed = parseComment(comment.body)
    return {
      id: comment.id,
      kind: parsed.kind,
      payload: parsed.payload,
      createdAt: comment.createdAt,
    }
  })

  const related = relateComments(sorted)
  const unanswered = related.unanswered.map((comment) => {
    const parsed = parseComment(comment.body)
    return { id: comment.id, payload: parsed.payload }
  })

  const next = nextUnincorporatedAnswer(sorted, {
    requirements: input.requirements.markdown,
    design: input.design.markdown,
  })
  const nextAnswer =
    next === null
      ? null
      : {
          id: next.id,
          payload: parseComment(next.body).payload,
        }

  return {
    issue: {
      number: input.issue.number,
      title: input.issue.title,
      body: input.issue.body,
      state: input.issue.state,
      labels: [...input.issue.labels],
      url: input.issue.url,
    },
    comments,
    unanswered,
    nextAnswer,
    specs: {
      requirements: specStatus(
        input.requirements.exists,
        input.requirements.markdown,
        issueNumber,
      ),
      design: specStatus(
        input.design.exists,
        input.design.markdown,
        issueNumber,
      ),
    },
  }
}

export async function loadIssueView(
  github: {
    getIssue: GitHubClient["getIssue"]
    listComments: GitHubClient["listComments"]
  },
  issueNumber: number,
  files: {
    requirements: { exists: boolean; markdown: string }
    design: { exists: boolean; markdown: string }
  },
): Promise<IssueView> {
  assertIssueNumber(issueNumber)
  const issue = await github.getIssue(issueNumber)
  const comments = await github.listComments(issueNumber)
  return buildIssueView({
    issue,
    comments,
    requirements: files.requirements,
    design: files.design,
  })
}

export function assertSpecFilesReflected(files: {
  requirements: string
  design: string
}): void {
  readReflectedIds(files.requirements)
  readReflectedIds(files.design)
}

export async function readSpecPair(issueNumber: number): Promise<{
  requirements: { exists: boolean; markdown: string }
  design: { exists: boolean; markdown: string }
}> {
  const paths = specPaths(issueNumber)
  const requirements = await readSpecFile(paths.requirements)
  const design = await readSpecFile(paths.design)
  return { requirements, design }
}

export function specHeading(issueNumber: number, title: string): string {
  assertIssueNumber(issueNumber)
  const trimmed = title.trim()
  if (trimmed.length === 0 || title.includes("\n")) {
    reject(INVALID_TITLE)
  }
  return `# ${issueNumber} ${title}`
}

export function confirmationBody(payload: string): string {
  if (payload.trim().length === 0) {
    reject(EMPTY_CONFIRM)
  }
  const normalized = normalizeNewlines(payload)
  const lines = normalized.split("\n")
  const index = firstNonemptyLineIndex(lines)
  if (index >= 0 && allMarkers.has(lines[index])) {
    reject(MARKER_IN_CONFIRM)
  }
  return `${commentMarkers.confirm}\n${payload}`
}

export function plainIssueCommentBody(payload: string): string {
  if (payload.trim().length === 0) {
    reject(EMPTY_CLOSE)
  }
  const normalized = normalizeNewlines(payload)
  const lines = normalized.split("\n")
  const index = firstNonemptyLineIndex(lines)
  if (index >= 0 && allMarkers.has(lines[index])) {
    reject(MARKER_IN_CLOSE)
  }
  return payload
}

export function assertSpecWorkAllowed(issue: Issue): void {
  if (issue.state !== "open") {
    reject(CLOSED_ISSUE)
  }
  if (issue.labels.some((label) => workflowLabelNames.has(label))) {
    reject(WORKFLOW_LABEL)
  }
}

export async function postConfirmation(
  github: {
    getIssue: GitHubClient["getIssue"]
    listComments: GitHubClient["listComments"]
    addComment: GitHubClient["addComment"]
  },
  issueNumber: number,
  payload: string,
  specs: { requirements: string; design: string },
): Promise<{ url: string }> {
  assertIssueNumber(issueNumber)
  const body = confirmationBody(payload)
  readReflectedIds(specs.requirements)
  readReflectedIds(specs.design)

  const issue = await github.getIssue(issueNumber)
  assertSpecWorkAllowed(issue)
  const comments = await github.listComments(issueNumber)

  const next = nextUnincorporatedAnswer(comments, specs)
  if (next !== null) {
    reject(UNINCORPORATED)
  }

  const related = relateComments(comments)
  if (related.unanswered.length > 0) {
    reject(UNANSWERED)
  }

  return await github.addComment(issueNumber, body)
}

export function assertRequirementsReady(
  exists: boolean,
  markdown: string,
  issueNumber: number,
): void {
  const status = specStatus(exists, markdown, issueNumber)
  if (status === "missing") {
    reject(NO_REQUIREMENTS)
  }
  if (status === "invalid") {
    reject(BAD_REQ_HEADING)
  }
}

export function validateReflectLocal(input: {
  issueNumber: number
  kind: "requirements" | "design"
  requirements: { exists: boolean; markdown: string }
  design: { exists: boolean; markdown: string }
  edited: string
}): void {
  assertIssueNumber(input.issueNumber)
  readReflectedIds(input.requirements.markdown)
  readReflectedIds(input.design.markdown)

  if (input.kind === "design") {
    assertRequirementsReady(
      input.requirements.exists,
      input.requirements.markdown,
      input.issueNumber,
    )
  }

  const target =
    input.kind === "requirements" ? input.requirements : input.design
  if (target.exists) {
    const status = specStatus(
      target.exists,
      target.markdown,
      input.issueNumber,
    )
    if (status === "invalid") {
      reject(input.kind === "requirements" ? BAD_REQ_HEADING : BAD_DES_HEADING)
    }
  }

  if (!isSpecHeading(input.edited, input.issueNumber)) {
    reject(BAD_HEADING)
  }
}

export function applyIncorporatedAnswer(input: {
  issueNumber: number
  kind: "requirements" | "design"
  requirements: { exists: boolean; markdown: string }
  design: { exists: boolean; markdown: string }
  comments: readonly IssueComment[]
  edited: string
}): { requirements: string; design: string; answerId: string } {
  assertIssueNumber(input.issueNumber)

  if (input.kind === "design") {
    assertRequirementsReady(
      input.requirements.exists,
      input.requirements.markdown,
      input.issueNumber,
    )
  }

  const target =
    input.kind === "requirements" ? input.requirements : input.design
  if (target.exists) {
    const status = specStatus(
      target.exists,
      target.markdown,
      input.issueNumber,
    )
    if (status === "invalid") {
      reject(input.kind === "requirements" ? BAD_REQ_HEADING : BAD_DES_HEADING)
    }
  }

  if (!isSpecHeading(input.edited, input.issueNumber)) {
    reject(BAD_HEADING)
  }

  readReflectedIds(input.requirements.markdown)
  readReflectedIds(input.design.markdown)
  readReflectedIds(input.edited)

  const specs = {
    requirements: input.requirements.markdown,
    design: input.design.markdown,
  }
  const next = nextUnincorporatedAnswer(input.comments, specs)
  if (next === null) {
    reject(NO_ANSWER)
  }

  const diskMarkdown =
    input.kind === "requirements"
      ? input.requirements.markdown
      : input.design.markdown
  const beforeDisk = normalizeNewlines(
    contentWithoutReflectedBlock(diskMarkdown),
  )
  const beforeEdited = normalizeNewlines(
    contentWithoutReflectedBlock(input.edited),
  )
  if (beforeDisk === beforeEdited) {
    reject(NOT_REFLECTED)
  }

  const updated = withReflectedId(input.edited, next.id)
  if (input.kind === "requirements") {
    return {
      requirements: updated,
      design: input.design.markdown,
      answerId: next.id,
    }
  }
  return {
    requirements: input.requirements.markdown,
    design: updated,
    answerId: next.id,
  }
}

export async function readSpecFile(
  filePath: string,
): Promise<{ exists: boolean; markdown: string }> {
  try {
    const info = await stat(filePath)
    if (!info.isFile()) {
      reject(CANT_READ_SPEC)
    }
    const markdown = await readFile(filePath, "utf8")
    return { exists: true, markdown }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return { exists: false, markdown: "" }
    }
    if (error instanceof Error && error.message === CANT_READ_SPEC) {
      throw error
    }
    reject(CANT_READ_SPEC)
  }
}

export async function writeSpecFile(
  filePath: string,
  markdown: string,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, markdown, "utf8")
}

export async function readStdinAll(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString("utf8")
}
