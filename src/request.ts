import { specPaths } from "./conventions.ts"
import type { GitHubClient } from "./github.ts"
import { workflowLabels } from "./labels.ts"
import { implementationBranch } from "./runner.ts"
import { specStatus } from "./sdd.ts"

const INVALID_NUMBER = "番号が不正です"
const WRONG_BRANCH = "作業ブランチではありません"
const HAS_CHANGES = "未コミットの変更があります"
const CLOSED_ISSUE = "課題は閉じています"
const WORKFLOW_LABEL = "実装のラベルが付いています"
const NO_REQUIREMENTS = "要件がありません"
const BAD_REQ_HEADING = "要件の見出しが不正です"
const NO_DESIGN = "設計がありません"
const BAD_DES_HEADING = "設計の見出しが不正です"

const workflowLabelNames = new Set(workflowLabels.map((l) => l.name))
const LABEL_REQUEST = workflowLabels[0].name

function reject(message: string): never {
  throw new Error(message)
}

export function pathsFromPorcelain(porcelain: string): Set<string> {
  const paths = new Set<string>()
  for (const line of porcelain.split(/\r?\n/)) {
    if (line.trim().length === 0) {
      continue
    }
    const rest = line.length <= 3 ? "" : line.slice(3).trim()
    if (rest.length === 0) {
      continue
    }
    const arrow = rest.indexOf(" -> ")
    const path = arrow === -1 ? rest : rest.slice(arrow + 4).trim()
    if (path.length > 0) {
      paths.add(path)
    }
  }
  return paths
}

export function changedPathsOnlySpecFiles(
  porcelain: string,
  requirementsPath: string,
  designPath: string,
): boolean {
  const paths = pathsFromPorcelain(porcelain)
  if (paths.size === 0) {
    return false
  }
  for (const path of paths) {
    if (path !== requirementsPath && path !== designPath) {
      return false
    }
  }
  return true
}

export async function requestImplementation(
  deps: {
    git: {
      currentBranch(): Promise<string>
      hasChanges(): Promise<boolean>
      statusPorcelain(): Promise<string>
      commitPaths(
        message: string,
        paths: readonly [string, string],
      ): Promise<void>
      remoteName(): Promise<string>
      push(remote: string, branch: string): Promise<void>
    }
    openGitHub(): Promise<{
      getIssue: GitHubClient["getIssue"]
      editLabels: GitHubClient["editLabels"]
    }>
    readSpecs(issueNumber: number): Promise<{
      requirements: { exists: boolean; markdown: string }
      design: { exists: boolean; markdown: string }
    }>
  },
  issueNumber: number,
): Promise<void> {
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) {
    reject(INVALID_NUMBER)
  }

  const branch = implementationBranch(issueNumber)

  const current = await deps.git.currentBranch()
  if (current !== branch) {
    reject(WRONG_BRANCH)
  }

  const hasChangesInitial = await deps.git.hasChanges()
  let porcelain = ""

  if (hasChangesInitial) {
    porcelain = await deps.git.statusPorcelain()
    const spec = specPaths(issueNumber)
    if (
      !changedPathsOnlySpecFiles(
        porcelain,
        spec.requirements,
        spec.design,
      )
    ) {
      reject(HAS_CHANGES)
    }
  }

  const github = await deps.openGitHub()
  const issue = await github.getIssue(issueNumber)
  if (issue.state !== "open") {
    reject(CLOSED_ISSUE)
  }

  if (issue.labels.some((label) => workflowLabelNames.has(label))) {
    reject(WORKFLOW_LABEL)
  }

  const specs = await deps.readSpecs(issueNumber)
  const reqStatus = specStatus(
    specs.requirements.exists,
    specs.requirements.markdown,
    issueNumber,
  )
  const desStatus = specStatus(
    specs.design.exists,
    specs.design.markdown,
    issueNumber,
  )

  if (hasChangesInitial) {
    if (reqStatus !== "ready" || desStatus !== "ready") {
      reject(HAS_CHANGES)
    }

    const changed = pathsFromPorcelain(porcelain)
    if (changed.size > 0) {
      const spec = specPaths(issueNumber)
      const message = `docs: 課題 ${issueNumber} の要件と設計`
      await deps.git.commitPaths(message, [
        spec.requirements,
        spec.design,
      ])
    }

    if (await deps.git.hasChanges()) {
      reject(HAS_CHANGES)
    }
  } else {
    if (reqStatus === "missing") {
      reject(NO_REQUIREMENTS)
    }
    if (reqStatus === "invalid") {
      reject(BAD_REQ_HEADING)
    }
    if (desStatus === "missing") {
      reject(NO_DESIGN)
    }
    if (desStatus === "invalid") {
      reject(BAD_DES_HEADING)
    }
  }

  const remote = await deps.git.remoteName()
  await deps.git.push(remote, branch)
  await github.editLabels(issueNumber, { add: [LABEL_REQUEST] })
}
