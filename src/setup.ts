import path from "node:path"
import type { CommandExists } from "./doctor.ts"
import type { GhRunner } from "./github.ts"
import {
  assertDirectoryExists,
  parseInstallArgs,
  type ParseInstallArgsResult,
} from "./install.ts"

export type SetupStepRunner = (args: string[], cwd: string) => Promise<number>

export type RunSetupOptions = {
  args: string[]
  homedir: string
  skillsSourceDir: string
  agentsSourceDir: string
  gh: GhRunner
  commandExists: CommandExists
  runInstall: SetupStepRunner
  runInit: SetupStepRunner
  runLabels: (cwd: string) => Promise<number>
  runDoctor: (cwd: string) => Promise<number>
}

function buildInstallArgs(
  args: string[],
  parsed: Extract<ParseInstallArgsResult, { ok: true }>,
  root: string,
): string[] {
  if (parsed.projectRoot === undefined) {
    return [root, ...args]
  }
  return args
}

export async function runSetup(options: RunSetupOptions): Promise<number> {
  const parsed = parseInstallArgs(options.args)
  if (!parsed.ok) {
    console.error(parsed.message)
    if (!parsed.message.startsWith("モデルの指定が不正です:")) {
      const { printUsage } = await import("./cli.ts")
      printUsage()
    }
    return 1
  }

  let root: string
  if (parsed.projectRoot === undefined) {
    root = path.resolve(process.cwd())
  } else {
    try {
      await assertDirectoryExists(parsed.projectRoot)
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      return 1
    }
    root = path.resolve(parsed.projectRoot)
  }

  const installArgs = buildInstallArgs(options.args, parsed, root)
  const stepCwd = process.cwd()

  const installCode = await options.runInstall(installArgs, stepCwd)
  if (installCode !== 0) {
    return installCode
  }

  const initCode = await options.runInit([root], stepCwd)
  if (initCode !== 0) {
    return initCode
  }

  const labelsCode = await options.runLabels(root)
  if (labelsCode !== 0) {
    return labelsCode
  }

  return await options.runDoctor(root)
}
