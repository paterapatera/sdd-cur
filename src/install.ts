import { cp, mkdir, readdir, rm, stat } from "node:fs/promises"
import path from "node:path"

export const defaultSkillsSourceDir = path.join(import.meta.dir, "../skills")
export const defaultAgentsSourceDir = path.join(import.meta.dir, "../agents")

export const subagentFileNames = [
  "sdd-cur-req-author.md",
  "sdd-cur-req-reviewer.md",
  "sdd-cur-req-fixer.md",
  "sdd-cur-design-author.md",
  "sdd-cur-design-reviewer.md",
  "sdd-cur-design-fixer.md",
  "sdd-cur-implement-author.md",
  "sdd-cur-implement-reviewer.md",
  "sdd-cur-implement-fixer.md",
  "sdd-cur-explore.md",
] as const

export function resolveSkillsDestination(
  homedir: string,
  projectRoot: string | undefined,
): string {
  if (projectRoot === undefined) {
    return path.join(homedir, ".cursor", "skills")
  }
  return path.join(path.resolve(projectRoot), ".cursor", "skills")
}

export function resolveAgentsDestination(
  homedir: string,
  projectRoot: string | undefined,
): string {
  if (projectRoot === undefined) {
    return path.join(homedir, ".cursor", "agents")
  }
  return path.join(path.resolve(projectRoot), ".cursor", "agents")
}

export type ParseInstallArgsResult =
  | { ok: true; projectRoot: string | undefined }
  | { ok: false; message: string }

export function parseInstallArgs(args: string[]): ParseInstallArgsResult {
  if (args.length === 0) {
    return { ok: true, projectRoot: undefined }
  }
  if (args.length > 1) {
    return { ok: false, message: "install の引数はプロジェクトのルートを一つまでです" }
  }
  const projectRoot = args[0]
  if (projectRoot === "") {
    return { ok: false, message: "install の引数はプロジェクトのルートを一つまでです" }
  }
  return { ok: true, projectRoot }
}

export async function assertDirectoryExists(dirPath: string): Promise<void> {
  let info: Awaited<ReturnType<typeof stat>>
  try {
    info = await stat(dirPath)
  } catch {
    throw new Error(`ディレクトリが存在しません: ${dirPath}`)
  }
  if (!info.isDirectory()) {
    throw new Error(`ディレクトリではありません: ${dirPath}`)
  }
}

export async function assertSubagentSourceFiles(agentsSourceDir: string): Promise<void> {
  await assertDirectoryExists(agentsSourceDir)
  for (const name of subagentFileNames) {
    const filePath = path.join(agentsSourceDir, name)
    let info: Awaited<ReturnType<typeof stat>>
    try {
      info = await stat(filePath)
    } catch {
      throw new Error(`サブエージェントがありません: agents/${name}`)
    }
    if (!info.isFile()) {
      throw new Error(`サブエージェントではありません: agents/${name}`)
    }
  }
}

export type InstallSkillsResult = {
  destDir: string
  skillNames: string[]
}

export async function installSkills(options: {
  homedir: string
  projectRoot?: string
  skillsSourceDir: string
}): Promise<InstallSkillsResult> {
  const destDir = resolveSkillsDestination(options.homedir, options.projectRoot)
  await mkdir(destDir, { recursive: true })

  const entries = await readdir(options.skillsSourceDir, { withFileTypes: true })
  const skillNames: string[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }
    const source = path.join(options.skillsSourceDir, entry.name)
    const target = path.join(destDir, entry.name)
    await rm(target, { recursive: true, force: true })
    await cp(source, target, { recursive: true })
    skillNames.push(entry.name)
  }

  skillNames.sort()
  return { destDir, skillNames }
}

export async function installAgents(options: {
  homedir: string
  projectRoot?: string
  agentsSourceDir: string
}): Promise<{ destDir: string }> {
  const destDir = resolveAgentsDestination(options.homedir, options.projectRoot)
  await mkdir(destDir, { recursive: true })

  for (const name of subagentFileNames) {
    const source = path.join(options.agentsSourceDir, name)
    const target = path.join(destDir, name)
    await cp(source, target)
  }

  return { destDir }
}

export async function installAll(options: {
  homedir: string
  projectRoot?: string
  skillsSourceDir: string
  agentsSourceDir: string
}): Promise<InstallSkillsResult> {
  await assertSubagentSourceFiles(options.agentsSourceDir)
  const skillsResult = await installSkills({
    homedir: options.homedir,
    projectRoot: options.projectRoot,
    skillsSourceDir: options.skillsSourceDir,
  })
  await installAgents({
    homedir: options.homedir,
    projectRoot: options.projectRoot,
    agentsSourceDir: options.agentsSourceDir,
  })
  return skillsResult
}
