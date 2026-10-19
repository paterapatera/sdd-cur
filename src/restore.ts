import type { GitHubClient } from "./github.ts"
import { workflowLabels } from "./labels.ts"

export type LabelEvent = {
  event: "labeled" | "unlabeled"
  name: string
  createdAt: string
}

const LABEL_REQUEST = workflowLabels[0].name
const LABEL_DONE = workflowLabels[2].name
const LABEL_IN_PROGRESS = workflowLabels[1].name

const workflowLabelNames = new Set(workflowLabels.map((l) => l.name))

const CANNOT_IDENTIFY = "着手前のラベルを特定できません"
const NO_IN_PROGRESS = "実装中がありません"
const INVALID_NUMBER = "番号が不正です"

const WINDOW_MS = 5000

function reject(message: string): never {
  throw new Error(message)
}

function parseTime(iso: string): number | null {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) {
    return null
  }
  return t
}

function isWorkflowBusinessLabel(name: string): boolean {
  return workflowLabelNames.has(name) && name !== LABEL_IN_PROGRESS
}

export function preStartLabel(events: readonly LabelEvent[]): string | null {
  let latestIndex = -1
  let latestTime: number | null = null

  for (let i = 0; i < events.length; i += 1) {
    const ev = events[i]
    if (ev.event !== "labeled" || ev.name !== LABEL_IN_PROGRESS) {
      continue
    }
    const t = parseTime(ev.createdAt)
    if (t === null) {
      continue
    }
    if (
      latestTime === null ||
      t > latestTime ||
      (t === latestTime && i > latestIndex)
    ) {
      latestTime = t
      latestIndex = i
    }
  }

  if (latestTime === null) {
    reject(CANNOT_IDENTIFY)
  }

  const collected = new Set<string>()
  for (const ev of events) {
    if (ev.event !== "unlabeled") {
      continue
    }
    if (!isWorkflowBusinessLabel(ev.name)) {
      continue
    }
    const t = parseTime(ev.createdAt)
    if (t === null) {
      continue
    }
    if (Math.abs(t - latestTime) <= WINDOW_MS) {
      collected.add(ev.name)
    }
  }

  if (collected.size === 0) {
    return null
  }
  if (collected.size === 1 && collected.has(LABEL_REQUEST)) {
    return LABEL_REQUEST
  }
  if (collected.size === 1 && collected.has(LABEL_DONE)) {
    return LABEL_DONE
  }
  reject(CANNOT_IDENTIFY)
}

export async function restoreIssue(
  github: {
    getIssue: GitHubClient["getIssue"]
    listIssueEvents: GitHubClient["listIssueEvents"]
    editLabels: GitHubClient["editLabels"]
  },
  issueNumber: number,
): Promise<void> {
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) {
    reject(INVALID_NUMBER)
  }

  const issue = await github.getIssue(issueNumber)
  if (!issue.labels.includes(LABEL_IN_PROGRESS)) {
    reject(NO_IN_PROGRESS)
  }

  const events = await github.listIssueEvents(issueNumber)
  const target = preStartLabel(events)

  if (target === null) {
    await github.editLabels(issueNumber, { remove: [LABEL_IN_PROGRESS] })
    return
  }

  await github.editLabels(issueNumber, {
    remove: [LABEL_IN_PROGRESS],
    add: [target],
  })
}
