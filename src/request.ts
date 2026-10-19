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

export async function requestImplementation(
  deps: {
    git: {
      currentBranch(): Promise<string>
      hasChanges(): Promise<boolean>
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

  if (await deps.git.hasChanges()) {
    reject(HAS_CHANGES)
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
  if (reqStatus === "missing") {
    reject(NO_REQUIREMENTS)
  }
  if (reqStatus === "invalid") {
    reject(BAD_REQ_HEADING)
  }

  const desStatus = specStatus(
    specs.design.exists,
    specs.design.markdown,
    issueNumber,
  )
  if (desStatus === "missing") {
    reject(NO_DESIGN)
  }
  if (desStatus === "invalid") {
    reject(BAD_DES_HEADING)
  }

  const remote = await deps.git.remoteName()
  await deps.git.push(remote, branch)
  await github.editLabels(issueNumber, { add: [LABEL_REQUEST] })
}
