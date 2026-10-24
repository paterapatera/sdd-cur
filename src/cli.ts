#!/usr/bin/env bun
import { homedir } from "node:os"
import path from "node:path"
import process from "node:process"
import {
  collectChangeFilePathViolations,
  collectEvidenceViolationsAsync,
  extractTestRefs,
  firstSectionBody,
  isWorkListItemLine,
  reviewNext,
  sectionBodies,
  specDiff,
  specPaths,
  validateSpecForm,
  type ReviewNextInput,
  type ReviewNextSuccess,
  type ReviewStage,
} from "./conventions.ts"
import {
  assertDirectoryExists,
  defaultAgentsSourceDir,
  defaultSkillsSourceDir,
  installAll,
  parseInstallArgs,
} from "./install.ts"
import { initProject, parseInitArgs } from "./init.ts"
import { completeIssue } from "./complete.ts"
import {
  createGitHub,
  defaultGhRunner,
  resolveRepo,
} from "./github.ts"
import { ensureWorkflowLabels } from "./labels.ts"
import { createAgent, defaultAgentRunner } from "./agent.ts"
import {
  createGit,
  defaultGitRunner,
  messageHasSddCurTaskForNumber,
  parseDefaultBranchFromSymref,
  prepareBranch,
} from "./git.ts"
import { parseRunArgs, runLoop } from "./run.ts"
import { restoreIssue } from "./restore.ts"
import { requestImplementation } from "./request.ts"
import {
  createRunner,
  defaultCreateProcedureFile,
  implementationBranch,
} from "./runner.ts"
import {
  applyIncorporatedAnswer,
  assertSpecFilesReflected,
  assertSpecWorkAllowed,
  confirmationBody,
  listStartCandidates,
  loadIssueView,
  parseIssueNumberString,
  parseSpecKind,
  plainIssueCommentBody,
  postConfirmation,
  readSpecFile,
  readSpecPair,
  readStdinAll,
  validateReflectLocal,
  writeSpecFile,
} from "./sdd.ts"
import { evaluateGate, parseGateStage, type GateStage } from "./gate.ts"
import { checkSpec } from "./spec.ts"
import { defaultCommandExists, runDoctor } from "./doctor.ts"

export function printUsage(): void {
  console.error(
    "sdd-cur install [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]",
  )
  console.error("sdd-cur init [project-root]")
  console.error("sdd-cur run [--interval-min <1 以上 1440 以下の整数>]")
  console.error("sdd-cur labels")
  console.error("sdd-cur candidates")
  console.error("sdd-cur show <番号>")
  console.error("sdd-cur gate <番号> <段>")
  console.error("sdd-cur branch <番号>")
  console.error("sdd-cur prepare-branch <番号>")
  console.error("sdd-cur confirm <番号>")
  console.error("sdd-cur close <番号>")
  console.error("sdd-cur reflect <番号> <requirements|design>")
  console.error("sdd-cur validate <番号>")
  console.error("sdd-cur complete <番号>")
  console.error("sdd-cur spec-check")
  console.error("sdd-cur tasks <番号>")
  console.error("sdd-cur task-done <番号> <作業番号>")
  console.error("sdd-cur spec-diff <番号>")
}

const NO_WORK_LIST_SECTION = "設計に作業の一覧がありません"
const NO_WORK_LIST_ITEMS = "作業の一覧に作業がありません"

function isFenceDelimiterLine(line: string): boolean {
  const trimmed = line.trimStart()
  return /^`{3,}/.test(trimmed)
}

function pushInlineBacktickCommands(line: string, commands: string[]): void {
  let i = 0
  while (i < line.length) {
    if (line[i] !== "`") {
      i += 1
      continue
    }
    let run = 0
    let j = i
    while (j < line.length && line[j] === "`") {
      run += 1
      j += 1
    }
    if (run !== 1) {
      i = j
      continue
    }
    const close = line.indexOf("`", j)
    if (close < 0) {
      break
    }
    const content = line.slice(j, close)
    if (/[ \t]/.test(content)) {
      commands.push(content)
    }
    i = close + 1
  }
}

function extractTestCommandLines(sectionBody: string): string[] {
  const commands: string[] = []
  let inFence = false
  for (const line of sectionBody.split("\n")) {
    if (isFenceDelimiterLine(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) {
      if (line.trim().length === 0) {
        continue
      }
      commands.push(line)
      continue
    }
    if (line.startsWith("- ")) {
      continue
    }
    pushInlineBacktickCommands(line, commands)
  }
  return commands
}

function collectTestCommands(markdown: string): string[] {
  const commands: string[] = []
  for (const body of sectionBodies(markdown, "テスト")) {
    commands.push(...extractTestCommandLines(body))
  }
  return commands
}

type CollectedTask = {
  number: number
  line: string
  refs: number[]
}

type TaskItem = CollectedTask & {
  done: boolean
}

async function defaultBranchFromSymref(
  remote: string,
  cwd: string,
): Promise<string> {
  const symrefResult = await defaultGitRunner.run(
    ["ls-remote", "--symref", remote, "HEAD"],
    { cwd },
  )
  if (symrefResult.exitCode !== 0) {
    const fromStderr = symrefResult.stderr
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0)
    if (fromStderr) {
      throw new Error(fromStderr)
    }
    const fromStdout = symrefResult.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0)
    if (fromStdout) {
      throw new Error(fromStdout)
    }
    throw new Error("git が失敗しました")
  }
  const defaultBranch = parseDefaultBranchFromSymref(symrefResult.stdout)
  if (defaultBranch === null) {
    throw new Error("デフォルトブランチを特定できません")
  }
  return defaultBranch
}

function collectTasks(markdown: string): CollectedTask[] | { error: string } {
  const workListBody = firstSectionBody(markdown, "作業の一覧")
  if (workListBody === null) {
    return { error: NO_WORK_LIST_SECTION }
  }
  const tasks: CollectedTask[] = []
  for (const line of workListBody.split("\n")) {
    if (!isWorkListItemLine(line)) {
      continue
    }
    const afterDash = line.slice(2)
    const dotIdx = afterDash.indexOf(". ")
    const numStr = afterDash.slice(0, dotIdx)
    tasks.push({
      number: Number(numStr),
      line,
      refs: extractTestRefs(line),
    })
  }
  if (tasks.length === 0) {
    return { error: NO_WORK_LIST_ITEMS }
  }
  return tasks
}

async function cmdTasks(args: string[]): Promise<number> {
  if (args.length !== 1) {
    printUsage()
    return 1
  }

  let issueNumber: number
  try {
    issueNumber = parseIssueNumberString(args[0])
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  const paths = specPaths(issueNumber)
  let designFile: Awaited<ReturnType<typeof readSpecFile>>
  try {
    designFile = await readSpecFile(paths.design)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  const collected = collectTasks(designFile.markdown)
  if ("error" in collected) {
    console.error(collected.error)
    return 1
  }

  const cwd = process.cwd()
  const git = createGit({ git: defaultGitRunner, cwd })

  let remote: string
  try {
    remote = await git.remoteName()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  let defaultBranch: string
  try {
    defaultBranch = await defaultBranchFromSymref(remote, cwd)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  let branchOnlyMessages: readonly string[]
  try {
    branchOnlyMessages = await git.branchOnlyCommitMessages(
      remote,
      defaultBranch,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  const tasks: TaskItem[] = collected.map((task) => ({
    number: task.number,
    line: task.line,
    refs: task.refs,
    done: branchOnlyMessages.some((message) =>
      messageHasSddCurTaskForNumber(message, task.number),
    ),
  }))

  const testCommands = collectTestCommands(designFile.markdown)
  console.log(JSON.stringify({ tasks, testCommands }))
  return 0
}

// task-done subcommand.
async function cmdTaskDone(args: string[]): Promise<number> {
  if (args.length !== 2) {
    printUsage()
    return 1
  }

  let issueNumber: number
  let taskNumber: number
  try {
    issueNumber = parseIssueNumberString(args[0])
    taskNumber = parseIssueNumberString(args[1])
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  const git = createGit({ git: defaultGitRunner, cwd: process.cwd() })

  try {
    if (!(await git.hasChanges())) {
      console.error("作業の変更がありません")
      return 1
    }
    await git.commitTaskDone(issueNumber, taskNumber)
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

async function cmdSpecDiff(args: string[]): Promise<number> {
  if (args.length !== 1) {
    printUsage()
    return 1
  }

  let issueNumber: number
  try {
    issueNumber = parseIssueNumberString(args[0])
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  const cwd = process.cwd()
  try {
    const lines = await specDiff({
      cwd,
      issueNumber,
      git: defaultGitRunner,
    })
    for (const line of lines) {
      console.error(line)
    }
    return lines.length > 0 ? 1 : 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

function wantsHelp(argv: string[]): boolean {
  return argv.includes("--help") || argv.includes("-h")
}

async function githubFromCwd() {
  const cwd = process.cwd()
  const repo = await resolveRepo(defaultGhRunner, cwd)
  return createGitHub({ gh: defaultGhRunner, repo, cwd })
}

async function cmdInstall(args: string[]): Promise<number> {
  const parsed = parseInstallArgs(args)
  if (!parsed.ok) {
    console.error(parsed.message)
    if (!parsed.message.startsWith("モデルの指定が不正です:")) {
      printUsage()
    }
    return 1
  }

  const home = homedir()
  if (parsed.projectRoot !== undefined) {
    try {
      await assertDirectoryExists(parsed.projectRoot)
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      return 1
    }
  }

  let result: Awaited<ReturnType<typeof installAll>>
  try {
    result = await installAll({
      homedir: home,
      projectRoot: parsed.projectRoot,
      skillsSourceDir: defaultSkillsSourceDir,
      agentsSourceDir: defaultAgentsSourceDir,
      highModel: parsed.highModel,
      mediumModel: parsed.mediumModel,
      lowModel: parsed.lowModel,
    })
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  console.log(result.destDir)
  if (result.skillNames.length === 0) {
    console.log("配置するスキルはありません")
  }
  for (const line of result.subagentModels) {
    console.log(`${line.baseName} ${line.model}`)
  }
  return 0
}

async function cmdInit(args: string[]): Promise<number> {
  const parsed = parseInitArgs(args)
  if (!parsed.ok) {
    console.error(parsed.message)
    printUsage()
    return 1
  }

  let root: string
  if (parsed.projectRoot === undefined) {
    root = process.cwd()
  } else {
    try {
      await assertDirectoryExists(parsed.projectRoot)
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      return 1
    }
    root = path.resolve(parsed.projectRoot)
  }

  let created: string[]
  try {
    created = await initProject(root)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  for (const rel of created) {
    console.log(rel)
  }
  return 0
}

async function cmdRun(args: string[]): Promise<number> {
  const parsed = parseRunArgs(args)
  if (!parsed.ok) {
    console.error(parsed.message)
    printUsage()
    return 1
  }

  let stop = false
  const onSignal = () => {
    stop = true
  }
  process.on("SIGINT", onSignal)
  process.on("SIGTERM", onSignal)

  const cwd = process.cwd()

  let github
  try {
    const repo = await resolveRepo(defaultGhRunner, cwd)
    github = createGitHub({ gh: defaultGhRunner, repo, cwd })
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  const git = createGit({ git: defaultGitRunner, cwd })
  const agent = createAgent({ agent: defaultAgentRunner, cwd })
  const runner = createRunner({
    github,
    git,
    agent,
    createProcedureFile: defaultCreateProcedureFile,
  })

  const lines: string[] = []
  const code = await runLoop({
    runner,
    git,
    intervalMin: parsed.intervalMin,
    shouldStop: () => stop,
    sleep: (ms) => Bun.sleep(ms),
    log: (line) => {
      lines.push(line)
      console.log(line)
    },
    logError: (line) => console.error(line),
    commentFailure: async (issueId, line) => {
      const issueNumber = parseIssueNumberString(issueId)
      await github.addComment(issueNumber, line)
    },
  })

  return code
}

async function cmdLabels(args: string[]): Promise<number> {
  if (args.length > 0) {
    printUsage()
    return 1
  }

  try {
    const github = await githubFromCwd()
    const results = await ensureWorkflowLabels(github)
    for (const result of results) {
      if (result.status === "created") {
        console.log(`作成しました: ${result.name}`)
      } else {
        console.log(`既にあります: ${result.name}`)
      }
    }
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

async function cmdCandidates(args: string[]): Promise<number> {
  if (args.length > 0) {
    printUsage()
    return 1
  }

  try {
    const github = await githubFromCwd()
    const candidates = await listStartCandidates(github)
    console.log(JSON.stringify(candidates))
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

async function cmdBranch(args: string[]): Promise<number> {
  if (args.length !== 1) {
    printUsage()
    return 1
  }

  try {
    const issueNumber = parseIssueNumberString(args[0])
    console.log(implementationBranch(issueNumber))
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

async function cmdPrepareBranch(args: string[]): Promise<number> {
  if (args.length !== 1) {
    printUsage()
    return 1
  }

  try {
    const issueNumber = parseIssueNumberString(args[0])
    const branch = implementationBranch(issueNumber)
    await prepareBranch({
      git: defaultGitRunner,
      cwd: process.cwd(),
      branch,
    })
    console.log(branch)
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

async function cmdShow(args: string[]): Promise<number> {
  if (args.length !== 1) {
    printUsage()
    return 1
  }

  try {
    const issueNumber = parseIssueNumberString(args[0])
    const files = await readSpecPair(issueNumber)
    assertSpecFilesReflected({
      requirements: files.requirements.markdown,
      design: files.design.markdown,
    })
    const github = await githubFromCwd()
    const view = await loadIssueView(github, issueNumber, files)
    console.log(JSON.stringify(view))
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

export type GateCmdDeps = {
  readSpecPair: typeof readSpecPair
  assertSpecFilesReflected: typeof assertSpecFilesReflected
  loadIssueView: typeof loadIssueView
  openGitHub: typeof githubFromCwd
  currentBranch: () => Promise<string>
}

export function defaultGateCmdDeps(): GateCmdDeps {
  return {
    readSpecPair,
    assertSpecFilesReflected,
    loadIssueView,
    openGitHub: githubFromCwd,
    currentBranch: async () => {
      const git = createGit({ git: defaultGitRunner, cwd: process.cwd() })
      return await git.currentBranch()
    },
  }
}

export async function cmdGate(
  args: string[],
  deps: GateCmdDeps = defaultGateCmdDeps(),
): Promise<number> {
  if (args.length !== 2) {
    console.error("段が不正です")
    return 1
  }

  let stage: GateStage
  try {
    stage = parseGateStage(args[1])
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  let issueNumber: number
  try {
    issueNumber = parseIssueNumberString(args[0])
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  try {
    const files = await deps.readSpecPair(issueNumber)
    deps.assertSpecFilesReflected({
      requirements: files.requirements.markdown,
      design: files.design.markdown,
    })
    const github = await deps.openGitHub()
    const view = await deps.loadIssueView(github, issueNumber, files)
    const currentBranch = await deps.currentBranch()
    const result = evaluateGate(stage, view, currentBranch, issueNumber)
    console.log(JSON.stringify(result))
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

async function cmdConfirm(args: string[]): Promise<number> {
  if (args.length !== 1) {
    printUsage()
    return 1
  }

  try {
    const issueNumber = parseIssueNumberString(args[0])
    const payload = await readStdinAll()
    confirmationBody(payload)
    const files = await readSpecPair(issueNumber)
    assertSpecFilesReflected({
      requirements: files.requirements.markdown,
      design: files.design.markdown,
    })
    const github = await githubFromCwd()
    const result = await postConfirmation(
      github,
      issueNumber,
      payload,
      {
        requirements: files.requirements.markdown,
        design: files.design.markdown,
      },
    )
    console.log(result.url)
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

async function cmdClose(args: string[]): Promise<number> {
  if (args.length !== 1) {
    printUsage()
    return 1
  }

  try {
    const issueNumber = parseIssueNumberString(args[0])
    const payload = await readStdinAll()
    const body = plainIssueCommentBody(payload)
    const github = await githubFromCwd()
    await github.addComment(issueNumber, body)
    await github.closeIssue(issueNumber)
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

async function cmdReflect(args: string[]): Promise<number> {
  if (args.length !== 2) {
    printUsage()
    return 1
  }

  try {
    const issueNumber = parseIssueNumberString(args[0])
    const kind = parseSpecKind(args[1])
    const edited = await readStdinAll()
    const files = await readSpecPair(issueNumber)
    validateReflectLocal({
      issueNumber,
      kind,
      requirements: files.requirements,
      design: files.design,
      edited,
    })

    const github = await githubFromCwd()
    const issue = await github.getIssue(issueNumber)
    assertSpecWorkAllowed(issue)
    const comments = await github.listComments(issueNumber)
    const result = applyIncorporatedAnswer({
      issueNumber,
      kind,
      requirements: files.requirements,
      design: files.design,
      comments,
      edited,
    })

    const paths = specPaths(issueNumber)
    const targetPath =
      kind === "requirements" ? paths.requirements : paths.design
    const markdown =
      kind === "requirements" ? result.requirements : result.design
    await writeSpecFile(targetPath, markdown)
    console.log(`反映しました: ${result.answerId}`)
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

async function cmdValidate(args: string[]): Promise<number> {
  if (args.length !== 1) {
    printUsage()
    return 1
  }

  let issueNumber: number
  try {
    issueNumber = parseIssueNumberString(args[0])
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  const paths = specPaths(issueNumber)
  let reqFile: Awaited<ReturnType<typeof readSpecFile>>
  try {
    reqFile = await readSpecFile(paths.requirements)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  const cwd = process.cwd()
  const readMainFile = async (filePath: string): Promise<string | null> => {
    const result = await defaultGitRunner.run(["show", `main:${filePath}`], {
      cwd,
    })
    if (result.exitCode !== 0) {
      return null
    }
    return result.stdout
  }

  const violations: string[] = []
  if (reqFile.exists) {
    for (const v of validateSpecForm("requirements", reqFile.markdown)) {
      violations.push(`${paths.requirements}: ${v}`)
    }
    for (const v of await collectEvidenceViolationsAsync(
      reqFile.markdown,
      readMainFile,
    )) {
      violations.push(`${paths.requirements}: ${v}`)
    }
  }

  let designFile: Awaited<ReturnType<typeof readSpecFile>>
  try {
    designFile = await readSpecFile(paths.design)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  if (designFile.exists) {
    for (const v of validateSpecForm("design", designFile.markdown)) {
      violations.push(`${paths.design}: ${v}`)
    }
    for (const v of collectChangeFilePathViolations(designFile.markdown)) {
      violations.push(`${paths.design}: ${v}`)
    }
  }

  if (violations.length > 0) {
    for (const line of violations) {
      console.error(line)
    }
    return 1
  }
  return 0
}

const reviewStageNames = new Set<string>([
  "requirements",
  "reflect-design",
  "quick",
  "implement",
])

function parseReviewStage(value: string | undefined): ReviewStage | null {
  if (value === undefined || !reviewStageNames.has(value)) {
    return null
  }
  return value as ReviewStage
}

function parseReviewNextStdin(raw: string): ReviewNextInput {
  const parsed = JSON.parse(raw.trim()) as Record<string, unknown>
  return {
    response: String(parsed.response ?? ""),
    consecutiveFailures: Number(parsed.consecutiveFailures),
    previousFindings: String(parsed.previousFindings ?? ""),
    brokenStampRetries: Number(parsed.brokenStampRetries),
  }
}

function formatReviewNextLine(value: ReviewNextSuccess): string {
  const obj: Record<string, unknown> = {
    consecutiveFailures: value.consecutiveFailures,
    previousFindings: value.previousFindings,
    brokenStampRetries: value.brokenStampRetries,
    action: value.action,
    model: value.model,
    kind: value.kind,
  }
  if (value.reason !== undefined) {
    obj.reason = value.reason
  }
  if (value.resultLine !== undefined) {
    obj.resultLine = value.resultLine
  }
  if (value.rewriteProcedure !== undefined) {
    obj.rewriteProcedure = value.rewriteProcedure
  }
  return JSON.stringify(obj)
}

async function cmdReviewNext(args: string[]): Promise<number> {
  const stage = parseReviewStage(args[0])
  if (stage === null) {
    console.error("段階の種別が不正です")
    return 1
  }

  let stdin: string
  try {
    stdin = await readStdinAll()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  let input: ReviewNextInput
  try {
    input = parseReviewNextStdin(stdin)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  const result = reviewNext(stage, input)
  if (!result.ok) {
    console.error(result.message)
    return 1
  }

  console.log(formatReviewNextLine(result.value))
  return 0
}

async function cmdRestore(args: string[]): Promise<number> {
  if (args.length !== 1) {
    printUsage()
    return 1
  }

  let issueNumber: number
  try {
    issueNumber = parseIssueNumberString(args[0])
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  const cwd = process.cwd()

  try {
    const repo = await resolveRepo(defaultGhRunner, cwd)
    const github = createGitHub({ gh: defaultGhRunner, repo, cwd })
    await restoreIssue(github, issueNumber)
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

async function cmdSpecCheck(args: string[]): Promise<number> {
  if (args.length > 0) {
    console.error("引数は受け取れません")
    return 1
  }

  const cwd = process.cwd()
  try {
    const lines = await checkSpec(cwd)
    for (const line of lines) {
      console.error(line)
    }
    return lines.length > 0 ? 1 : 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

async function cmdDoctor(args: string[]): Promise<number> {
  if (args.length > 0) {
    console.error("引数は受け取れません")
    return 1
  }

  return await runDoctor({
    cwd: process.cwd(),
    homedir: homedir(),
    skillsSourceDir: defaultSkillsSourceDir,
    agentsSourceDir: defaultAgentsSourceDir,
    commandExists: defaultCommandExists,
    gh: defaultGhRunner,
  })
}

async function cmdRequest(args: string[]): Promise<number> {
  if (args.length !== 1) {
    printUsage()
    return 1
  }

  let issueNumber: number
  try {
    issueNumber = parseIssueNumberString(args[0])
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  const cwd = process.cwd()

  try {
    const git = createGit({ git: defaultGitRunner, cwd })
    await requestImplementation(
      {
        git,
        openGitHub: async () => {
          const repo = await resolveRepo(defaultGhRunner, cwd)
          const github = createGitHub({ gh: defaultGhRunner, repo, cwd })
          return {
            getIssue: github.getIssue.bind(github),
            editLabels: github.editLabels.bind(github),
          }
        },
        readSpecs: readSpecPair,
      },
      issueNumber,
    )
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

async function cmdComplete(args: string[]): Promise<number> {
  if (args.length !== 1) {
    printUsage()
    return 1
  }

  let issueNumber: number
  try {
    issueNumber = parseIssueNumberString(args[0])
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  const cwd = process.cwd()

  try {
    const repo = await resolveRepo(defaultGhRunner, cwd)
    const github = createGitHub({ gh: defaultGhRunner, repo, cwd })
    const git = createGit({ git: defaultGitRunner, cwd })
    const result = await completeIssue(github, git, issueNumber)
    if (result === "conflict") {
      console.error("取り込みがコンフリクトしました")
      return 1
    }
    console.log(`完了しました: ${issueNumber}`)
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  if (
    wantsHelp(argv) &&
    argv[0] !== "spec-check" &&
    argv[0] !== "doctor"
  ) {
    printUsage()
    return 0
  }

  const sub = argv[0]
  const rest = argv.slice(1).filter((arg) => arg !== "--help" && arg !== "-h")

  if (sub === undefined) {
    printUsage()
    return 1
  }

  switch (sub) {
    case "install":
      return await cmdInstall(rest)
    case "init":
      return await cmdInit(rest)
    case "doctor":
      return await cmdDoctor(argv.slice(1))
    case "run":
      return await cmdRun(rest)
    case "labels":
      return await cmdLabels(rest)
    case "candidates":
      return await cmdCandidates(rest)
    case "show":
      return await cmdShow(rest)
    case "gate":
      return await cmdGate(rest)
    case "branch":
      return await cmdBranch(rest)
    case "prepare-branch":
      return await cmdPrepareBranch(rest)
    case "confirm":
      return await cmdConfirm(rest)
    case "close":
      return await cmdClose(rest)
    case "reflect":
      return await cmdReflect(rest)
    case "validate":
      return await cmdValidate(rest)
    case "complete":
      return await cmdComplete(rest)
    case "restore":
      return await cmdRestore(rest)
    case "review-next":
      return await cmdReviewNext(rest)
    case "request":
      return await cmdRequest(rest)
    case "spec-check":
      return await cmdSpecCheck(argv.slice(1))
    case "tasks":
      return await cmdTasks(rest)
    case "task-done":
      return await cmdTaskDone(rest)
    case "spec-diff":
      return await cmdSpecDiff(rest)
    default:
      printUsage()
      return 1
  }
}

const exitCode = await main()
process.exit(exitCode)
