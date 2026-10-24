import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"

export const defaultSkillsSourceDir = path.join(import.meta.dir, "../skills")
export const defaultAgentsSourceDir = path.join(import.meta.dir, "../agents")

export const subagentFileNames = [
  "sdd-cur-req-author.md",
  "sdd-cur-req-reviewer.md",
  "sdd-cur-req-reviewer-high.md",
  "sdd-cur-req-fixer.md",
  "sdd-cur-design-author.md",
  "sdd-cur-design-reviewer.md",
  "sdd-cur-design-fixer.md",
  "sdd-cur-implement-author.md",
  "sdd-cur-implement-reviewer.md",
  "sdd-cur-implement-fixer.md",
  "sdd-cur-explore.md",
] as const

export type SubagentModelTier = "high" | "medium" | "low"

export const subagentModelTierByFileName: Record<
  (typeof subagentFileNames)[number],
  SubagentModelTier
> = {
  "sdd-cur-req-author.md": "high",
  "sdd-cur-req-reviewer.md": "medium",
  "sdd-cur-req-reviewer-high.md": "high",
  "sdd-cur-req-fixer.md": "low",
  "sdd-cur-design-author.md": "high",
  "sdd-cur-design-reviewer.md": "medium",
  "sdd-cur-design-fixer.md": "low",
  "sdd-cur-implement-author.md": "low",
  "sdd-cur-implement-reviewer.md": "medium",
  "sdd-cur-implement-fixer.md": "low",
  "sdd-cur-explore.md": "low",
}

const HIGH_MODEL_FLAG = "--high-model"
const MEDIUM_MODEL_FLAG = "--medium-model"
const LOW_MODEL_FLAG = "--low-model"

function isModelFlagEqualsForm(arg: string): boolean {
  return (
    arg.startsWith(`${HIGH_MODEL_FLAG}=`) ||
    arg.startsWith(`${MEDIUM_MODEL_FLAG}=`) ||
    arg.startsWith(`${LOW_MODEL_FLAG}=`)
  )
}

export function readModelFromAgentFile(content: string): string {
  const lines = content.split("\n")
  if (lines[0] !== "---") {
    throw new Error("フロントマターがありません")
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      break
    }
    if (lines[i].startsWith("model:")) {
      const rest = lines[i].slice("model:".length)
      if (!rest.startsWith(" ")) {
        throw new Error("model: の形式が不正です")
      }
      return rest.slice(1)
    }
  }
  throw new Error("model: がありません")
}

export function setModelLineInAgentFile(content: string, model: string): string {
  const lines = content.split("\n")
  if (lines[0] !== "---") {
    throw new Error("フロントマターがありません")
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      break
    }
    if (lines[i].startsWith("model:")) {
      lines[i] = `model: ${model}`
      return lines.join("\n")
    }
  }
  throw new Error("model: がありません")
}

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
  | {
      ok: true
      projectRoot: string | undefined
      highModel?: string
      mediumModel?: string
      lowModel?: string
    }
  | { ok: false; message: string }

export function parseInstallArgs(args: string[]): ParseInstallArgsResult {
  if (args.length === 0) {
    return { ok: true, projectRoot: undefined }
  }

  let projectRoot: string | undefined
  let highModel: string | undefined
  let mediumModel: string | undefined
  let lowModel: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === HIGH_MODEL_FLAG || arg === MEDIUM_MODEL_FLAG || arg === LOW_MODEL_FLAG) {
      const tier =
        arg === HIGH_MODEL_FLAG ? "high" : arg === MEDIUM_MODEL_FLAG ? "medium" : "low"
      if (i + 1 >= args.length) {
        return { ok: false, message: `モデルの指定が不正です: ${arg}` }
      }
      const value = args[++i]
      if (value === "") {
        return { ok: false, message: `モデルの指定が不正です: ${value}` }
      }
      const already =
        tier === "high"
          ? highModel !== undefined
          : tier === "medium"
            ? mediumModel !== undefined
            : lowModel !== undefined
      if (already) {
        return { ok: false, message: `モデルの指定が不正です: ${value}` }
      }
      if (tier === "high") {
        highModel = value
      } else if (tier === "medium") {
        mediumModel = value
      } else {
        lowModel = value
      }
      continue
    }

    if (isModelFlagEqualsForm(arg)) {
      return { ok: false, message: `モデルの指定が不正です: ${arg}` }
    }

    if (arg.startsWith("--")) {
      return { ok: false, message: `モデルの指定が不正です: ${arg}` }
    }

    if (projectRoot !== undefined || arg === "") {
      return { ok: false, message: "install の引数はプロジェクトのルートを一つまでです" }
    }
    projectRoot = arg
  }

  const result: Extract<ParseInstallArgsResult, { ok: true }> = {
    ok: true,
    projectRoot,
  }
  if (highModel !== undefined) {
    result.highModel = highModel
  }
  if (mediumModel !== undefined) {
    result.mediumModel = mediumModel
  }
  if (lowModel !== undefined) {
    result.lowModel = lowModel
  }
  return result
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

export type SubagentModelLine = {
  baseName: string
  model: string
}

export type InstallAllResult = InstallSkillsResult & {
  subagentModels: SubagentModelLine[]
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
  highModel?: string
  mediumModel?: string
  lowModel?: string
}): Promise<{ destDir: string; subagentModels: SubagentModelLine[] }> {
  const destDir = resolveAgentsDestination(options.homedir, options.projectRoot)
  await mkdir(destDir, { recursive: true })

  const subagentModels: SubagentModelLine[] = []

  for (const name of subagentFileNames) {
    const source = path.join(options.agentsSourceDir, name)
    const target = path.join(destDir, name)
    const sourceContent = await readFile(source, "utf8")
    const originalModel = readModelFromAgentFile(sourceContent)
    const tier = subagentModelTierByFileName[name]

    let override: string | undefined
    if (tier === "high") {
      override = options.highModel
    } else if (tier === "medium") {
      override = options.mediumModel
    } else {
      override = options.lowModel
    }

    const finalModel = override ?? originalModel

    await cp(source, target)
    if (override !== undefined) {
      const copied = await readFile(target, "utf8")
      await writeFile(target, setModelLineInAgentFile(copied, finalModel))
    }

    subagentModels.push({
      baseName: name.slice(0, -".md".length),
      model: finalModel,
    })
  }

  return { destDir, subagentModels }
}

export async function installAll(options: {
  homedir: string
  projectRoot?: string
  skillsSourceDir: string
  agentsSourceDir: string
  highModel?: string
  mediumModel?: string
  lowModel?: string
}): Promise<InstallAllResult> {
  await assertSubagentSourceFiles(options.agentsSourceDir)
  const skillsResult = await installSkills({
    homedir: options.homedir,
    projectRoot: options.projectRoot,
    skillsSourceDir: options.skillsSourceDir,
  })
  const agentsResult = await installAgents({
    homedir: options.homedir,
    projectRoot: options.projectRoot,
    agentsSourceDir: options.agentsSourceDir,
    highModel: options.highModel,
    mediumModel: options.mediumModel,
    lowModel: options.lowModel,
  })
  return { ...skillsResult, subagentModels: agentsResult.subagentModels }
}
