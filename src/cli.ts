#!/usr/bin/env bun
import { homedir } from "node:os"
import process from "node:process"
import { specPaths } from "./conventions.ts"
import {
  assertDirectoryExists,
  defaultSkillsSourceDir,
  installSkills,
  parseInstallArgs,
} from "./install.ts"
import {
  createGitHub,
  defaultGhRunner,
  resolveRepo,
} from "./github.ts"
import { ensureWorkflowLabels } from "./labels.ts"
import { createAgent, defaultAgentRunner } from "./agent.ts"
import { createGit, defaultGitRunner } from "./git.ts"
import { parseRunArgs, runLoop } from "./run.ts"
import {
  createRunner,
  defaultCreateProcedureFile,
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
  postConfirmation,
  readSpecPair,
  readStdinAll,
  validateReflectLocal,
  writeSpecFile,
} from "./sdd.ts"

export function printUsage(): void {
  console.error("sdd-cur install [project-root]")
  console.error("sdd-cur run [--interval-min <1 以上 1440 以下の整数>]")
  console.error("sdd-cur labels")
  console.error("sdd-cur candidates")
  console.error("sdd-cur show <番号>")
  console.error("sdd-cur confirm <番号>")
  console.error("sdd-cur reflect <番号> <requirements|design>")
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
    printUsage()
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

  const result = await installSkills({
    homedir: home,
    projectRoot: parsed.projectRoot,
    skillsSourceDir: defaultSkillsSourceDir,
  })

  console.log(result.destDir)
  if (result.skillNames.length === 0) {
    console.log("配置するスキルはありません")
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
    intervalMin: parsed.intervalMin,
    shouldStop: () => stop,
    sleep: (ms) => Bun.sleep(ms),
    log: (line) => {
      lines.push(line)
      console.log(line)
    },
    logError: (line) => console.error(line),
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

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  if (wantsHelp(argv)) {
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
    case "run":
      return await cmdRun(rest)
    case "labels":
      return await cmdLabels(rest)
    case "candidates":
      return await cmdCandidates(rest)
    case "show":
      return await cmdShow(rest)
    case "confirm":
      return await cmdConfirm(rest)
    case "reflect":
      return await cmdReflect(rest)
    default:
      printUsage()
      return 1
  }
}

const exitCode = await main()
process.exit(exitCode)
