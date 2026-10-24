import { readFile, readdir, stat } from "node:fs/promises"
import path from "node:path"
import { quickTargetLabel, workflowLabels } from "./labels.ts"
import { createGitHub, resolveRepo, type GhRunner } from "./github.ts"
import { policyTemplate } from "./init.ts"
import {
  resolveAgentsDestination,
  resolveSkillsDestination,
  subagentFileNames,
} from "./install.ts"

export const doctorCheckLabels = [
  "`bun` がある",
  "`gh` があり、`gh auth status` が成功する",
  "`agent` コマンドがある",
  "作業ディレクトリが git リポジトリであり、GitHub のリモートを `resolveRepo` で解決できる",
  "業務フローのラベルと「quick 対象」が、リポジトリにすべてある（無ければ `sdd-cur labels` を案内する）",
  "`docs/policy.md` があり、`init` の雛形のままではない（雛形のままなら `sdd-cur-policy` スキルを案内する）",
  "`docs/canonical/` と `docs/issues/` がある",
  "スキルとサブエージェントが `~/.cursor` か `<root>/.cursor` かに入っていて、パッケージの中身と同じである（違えば `sdd-cur install` を案内する）",
] as const

export type DoctorCommandName = "bun" | "gh" | "agent"

export type CommandExists = (name: DoctorCommandName) => boolean

export type DoctorCheckResult =
  | { ok: true; label: string }
  | { ok: false; label: string; reason: string }

export type RunDoctorOptions = {
  cwd: string
  homedir: string
  skillsSourceDir: string
  agentsSourceDir: string
  commandExists: CommandExists
  gh: GhRunner
}

export function defaultCommandExists(name: DoctorCommandName): boolean {
  const cmd = name === "bun" ? "bun" : name === "gh" ? "gh" : "agent"
  return Bun.which(cmd) !== null
}

function printDoctorCheckResult(result: DoctorCheckResult): void {
  if (result.ok) {
    console.log(`OK ${result.label}`)
  } else {
    console.log(`NG ${result.label}: ${result.reason}`)
  }
}

async function checkBun(commandExists: CommandExists): Promise<DoctorCheckResult> {
  const label = doctorCheckLabels[0]
  if (commandExists("bun")) {
    return { ok: true, label }
  }
  return { ok: false, label, reason: "bun がありません" }
}

async function checkGh(
  commandExists: CommandExists,
  gh: GhRunner,
  cwd: string,
): Promise<DoctorCheckResult> {
  const label = doctorCheckLabels[1]
  if (!commandExists("gh")) {
    return { ok: false, label, reason: "gh がありません" }
  }
  const result = await gh.run(["auth", "status"], { cwd })
  if (result.exitCode === 0) {
    return { ok: true, label }
  }
  return { ok: false, label, reason: "gh auth status が失敗しました" }
}

async function checkAgent(commandExists: CommandExists): Promise<DoctorCheckResult> {
  const label = doctorCheckLabels[2]
  if (commandExists("agent")) {
    return { ok: true, label }
  }
  return { ok: false, label, reason: "agent コマンドがありません" }
}

async function isGitRepository(cwd: string): Promise<boolean> {
  try {
    const info = await stat(path.join(cwd, ".git"))
    return info.isDirectory() || info.isFile()
  } catch {
    return false
  }
}

type GitResolveRepoCheck = DoctorCheckResult & { repo?: string }

async function checkGitAndResolveRepo(
  gh: GhRunner,
  cwd: string,
): Promise<GitResolveRepoCheck> {
  const label = doctorCheckLabels[3]
  if (!(await isGitRepository(cwd))) {
    return { ok: false, label, reason: "git リポジトリではありません" }
  }
  try {
    const repo = await resolveRepo(gh, cwd)
    return { ok: true, label, repo }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    return { ok: false, label, reason }
  }
}

async function checkLabels(
  gh: GhRunner,
  cwd: string,
  gitCheck: GitResolveRepoCheck,
): Promise<DoctorCheckResult> {
  const label = doctorCheckLabels[4]
  if (!gitCheck.ok || gitCheck.repo === undefined) {
    return { ok: false, label, reason: "GitHub リポジトリを解決できません" }
  }
  const github = createGitHub({ gh, repo: gitCheck.repo, cwd })
  const names = [...workflowLabels.map((entry) => entry.name), quickTargetLabel.name]
  for (const name of names) {
    const existing = await github.getLabel(name)
    if (existing === null) {
      return {
        ok: false,
        label,
        reason: "不足しているラベルがあります。sdd-cur labels を実行してください",
      }
    }
  }
  return { ok: true, label }
}

async function checkPolicyMd(cwd: string): Promise<DoctorCheckResult> {
  const label = doctorCheckLabels[5]
  const policyPath = path.join(cwd, "docs/policy.md")
  try {
    const info = await stat(policyPath)
    if (!info.isFile()) {
      return { ok: false, label, reason: "docs/policy.md がありません" }
    }
    const content = await readFile(policyPath, "utf8")
    if (content === policyTemplate) {
      return {
        ok: false,
        label,
        reason: "init の雛形のままです。sdd-cur-policy スキルで方針を書いてください",
      }
    }
    return { ok: true, label }
  } catch {
    return { ok: false, label, reason: "docs/policy.md がありません" }
  }
}

async function isDirectory(dirPath: string): Promise<boolean> {
  try {
    const info = await stat(dirPath)
    return info.isDirectory()
  } catch {
    return false
  }
}

async function checkDocsCanonicalAndIssues(cwd: string): Promise<DoctorCheckResult> {
  const label = doctorCheckLabels[6]
  const canonicalPath = path.join(cwd, "docs/canonical")
  const issuesPath = path.join(cwd, "docs/issues")
  if ((await isDirectory(canonicalPath)) && (await isDirectory(issuesPath))) {
    return { ok: true, label }
  }
  return {
    ok: false,
    label,
    reason: "docs/canonical/ または docs/issues/ がありません",
  }
}

async function listFilesRecursive(root: string): Promise<string[]> {
  const out: string[] = []
  async function walk(current: string, prefix: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(full, rel)
      } else if (entry.isFile()) {
        out.push(rel)
      }
    }
  }
  await walk(root, "")
  return out
}

async function fileContentsMatch(sourcePath: string, destPath: string): Promise<boolean> {
  let sourceText: string
  let destText: string
  try {
    sourceText = await readFile(sourcePath, "utf8")
    destText = await readFile(destPath, "utf8")
  } catch {
    return false
  }
  return sourceText === destText
}

const skillsInstallMismatchReason =
  "スキルまたはサブエージェントがパッケージと一致しません。sdd-cur install を実行してください"

async function checkSkillsAndSubagents(options: {
  homedir: string
  cwd: string
  skillsSourceDir: string
  agentsSourceDir: string
}): Promise<DoctorCheckResult> {
  const label = doctorCheckLabels[7]
  const skillsDestDir = resolveSkillsDestination(options.homedir, options.cwd)
  const agentsDestDir = resolveAgentsDestination(options.homedir, options.cwd)

  let skillEntries: Awaited<ReturnType<typeof readdir>>
  try {
    skillEntries = await readdir(options.skillsSourceDir, { withFileTypes: true })
  } catch {
    return { ok: false, label, reason: skillsInstallMismatchReason }
  }

  for (const entry of skillEntries) {
    if (!entry.isDirectory()) {
      continue
    }
    const sourceSkillDir = path.join(options.skillsSourceDir, entry.name)
    const destSkillDir = path.join(skillsDestDir, entry.name)
    const relFiles = await listFilesRecursive(sourceSkillDir)
    for (const rel of relFiles) {
      const sourcePath = path.join(sourceSkillDir, rel)
      const destPath = path.join(destSkillDir, rel)
      if (!(await fileContentsMatch(sourcePath, destPath))) {
        return { ok: false, label, reason: skillsInstallMismatchReason }
      }
    }
  }

  for (const name of subagentFileNames) {
    const sourcePath = path.join(options.agentsSourceDir, name)
    const destPath = path.join(agentsDestDir, name)
    if (!(await fileContentsMatch(sourcePath, destPath))) {
      return { ok: false, label, reason: skillsInstallMismatchReason }
    }
  }

  return { ok: true, label }
}

const doctorWarnLine =
  "「実装依頼」が付いているが担当者にあなたの login が無い"

async function printDoctorWarnings(
  gh: GhRunner,
  cwd: string,
  repo: string,
): Promise<void> {
  const github = createGitHub({ gh, repo, cwd })
  let login: string
  try {
    login = await github.viewerLogin()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    return
  }
  let issues: Awaited<ReturnType<typeof github.listIssues>>
  try {
    issues = await github.listIssues({ state: "open", labels: ["実装依頼"] })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    return
  }
  const toWarn = issues
    .filter((issue) => !issue.assignees.includes(login))
    .sort((a, b) => a.number - b.number)
  for (const issue of toWarn) {
    console.log(`WARN #${issue.number}: ${doctorWarnLine}`)
  }
}

export async function runDoctor(options: RunDoctorOptions): Promise<number> {
  const gitCheck = await checkGitAndResolveRepo(options.gh, options.cwd)
  const ghCheck = await checkGh(options.commandExists, options.gh, options.cwd)
  const results: DoctorCheckResult[] = [
    await checkBun(options.commandExists),
    ghCheck,
    await checkAgent(options.commandExists),
    gitCheck,
    await checkLabels(options.gh, options.cwd, gitCheck),
    await checkPolicyMd(options.cwd),
    await checkDocsCanonicalAndIssues(options.cwd),
    await checkSkillsAndSubagents({
      homedir: options.homedir,
      cwd: options.cwd,
      skillsSourceDir: options.skillsSourceDir,
      agentsSourceDir: options.agentsSourceDir,
    }),
  ]

  for (const result of results) {
    printDoctorCheckResult(result)
  }

  const exitCode = results.some((result) => !result.ok) ? 1 : 0

  if (ghCheck.ok && gitCheck.ok && gitCheck.repo !== undefined) {
    await printDoctorWarnings(options.gh, options.cwd, gitCheck.repo)
  }

  return exitCode
}
