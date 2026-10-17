#!/usr/bin/env bun
import { homedir } from "node:os"
import process from "node:process"
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
import { parseRunArgs, runLoop } from "./run.ts"
import { defaultRunner } from "./runner.ts"

export function printUsage(): void {
  console.error("sdd-cur install [project-root]")
  console.error("sdd-cur run [--interval-min <1 以上 1440 以下の整数>]")
  console.error("sdd-cur labels")
}

function wantsHelp(argv: string[]): boolean {
  return argv.includes("--help") || argv.includes("-h")
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

  const lines: string[] = []
  const code = await runLoop({
    runner: defaultRunner,
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
    const cwd = process.cwd()
    const repo = await resolveRepo(defaultGhRunner, cwd)
    const github = createGitHub({ gh: defaultGhRunner, repo, cwd })
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
    default:
      printUsage()
      return 1
  }
}

const exitCode = await main()
process.exit(exitCode)
