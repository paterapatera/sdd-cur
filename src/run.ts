import type { Runner, WorkItem } from "./runner.ts"

export const MIN_INTERVAL_MIN = 1
export const MAX_INTERVAL_MIN = 1440
export const DEFAULT_INTERVAL_MIN = 1

export type ParseRunArgsResult =
  | { ok: true; intervalMin: number }
  | { ok: false; message: string }

export function parseIntervalMin(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null
  }
  const n = Number(value)
  if (!Number.isInteger(n) || n < MIN_INTERVAL_MIN || n > MAX_INTERVAL_MIN) {
    return null
  }
  return n
}

export function parseRunArgs(args: string[]): ParseRunArgsResult {
  let intervalMin = DEFAULT_INTERVAL_MIN
  let i = 0
  while (i < args.length) {
    const arg = args[i]
    if (arg === "--interval-min") {
      const value = args[i + 1]
      if (value === undefined) {
        return { ok: false, message: "--interval-min には値が必要です" }
      }
      const parsed = parseIntervalMin(value)
      if (parsed === null) {
        return {
          ok: false,
          message: `--interval-min は ${MIN_INTERVAL_MIN} 以上 ${MAX_INTERVAL_MIN} 以下の整数です`,
        }
      }
      intervalMin = parsed
      i += 2
      continue
    }
    return { ok: false, message: `不明な引数です: ${arg}` }
  }
  return { ok: true, intervalMin }
}

export type LocalTaskBranchGit = {
  currentBranch(): Promise<string>
  hasChanges(): Promise<boolean>
  localBranchNames(): Promise<readonly string[]>
  deleteLocalBranch(name: string): Promise<void>
}

export type DeleteLocalTaskBranchesResult = "proceed" | "skip"

export async function deleteLocalTaskBranches(
  git: LocalTaskBranchGit,
): Promise<DeleteLocalTaskBranchesResult> {
  const branch = await git.currentBranch()
  if (branch.startsWith("task-") && (await git.hasChanges())) {
    return "skip"
  }
  const taskBranches = (await git.localBranchNames()).filter((name) =>
    name.startsWith("task-"),
  )
  if (taskBranches.length === 0) {
    return "proceed"
  }
  for (const name of taskBranches) {
    await git.deleteLocalBranch(name)
  }
  return "proceed"
}

type ProcessRunner = (
  item: WorkItem,
  options?: { skipWork?: boolean },
) => Promise<void>

export type RunLoopDeps = {
  runner: Runner
  git: LocalTaskBranchGit
  intervalMin: number
  shouldStop: () => boolean
  sleep: (ms: number) => Promise<void>
  log: (line: string) => void
  logError: (line: string) => void
  commentFailure: (issueId: string, line: string) => Promise<void>
  now?: () => number
}

export function formatDurationMs(elapsedMs: number): string {
  const seconds = Math.floor(elapsedMs / 1000)
  if (seconds < 1) {
    return "0s"
  }
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  if (remainder === 0) {
    return `${minutes}m`
  }
  if (minutes === 0) {
    return `${seconds}s`
  }
  return `${minutes}m${remainder}s`
}

export function formatProcessTiming(
  elapsedMs: number,
  counts: { quick: number; implement: number; fix: number },
): string {
  const duration = formatDurationMs(elapsedMs)
  const parts: string[] = []
  if (counts.quick >= 1) {
    parts.push(`quick=${counts.quick}`)
  }
  if (counts.implement >= 1) {
    parts.push(`implement=${counts.implement}`)
  }
  if (counts.fix >= 1) {
    parts.push(`fix=${counts.fix}`)
  }
  if (parts.length === 0) {
    return `(${duration})`
  }
  return `(${duration} ${parts.join(" ")})`
}

function errorLine(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return String(error)
}

export async function runLoop(deps: RunLoopDeps): Promise<0 | 1> {
  const intervalMs = deps.intervalMin * 60 * 1000
  const now = deps.now ?? Date.now

  try {
    await deps.runner.resumeInterruptedImplementationOnce()
  } catch (error) {
    deps.logError(errorLine(error))
    return 1
  }

  while (!deps.shouldStop()) {
    let item: WorkItem | null
    try {
      item = await deps.runner.poll()
    } catch (error) {
      deps.logError(errorLine(error))
      return 1
    }

    if (item !== null) {
      if (deps.shouldStop()) {
        deps.log("終了します")
        return 0
      }

      let skipWork = false
      try {
        const deleteResult = await deleteLocalTaskBranches(deps.git)
        if (deleteResult === "skip") {
          skipWork = true
        }
      } catch (error) {
        deps.logError(errorLine(error))
        skipWork = true
      }

      deps.log(`処理を開始します: ${item.id}`)
      const startedAt = now()
      const processRunner = deps.runner.process as ProcessRunner
      try {
        await processRunner(item, { skipWork })
      } catch (error) {
        const line = errorLine(error)
        deps.logError(line)
        const elapsedMs = now() - startedAt
        const timing = formatProcessTiming(elapsedMs, deps.runner.agentLaunches())
        deps.logError(timing)
        try {
          await deps.commentFailure(item.id, line)
        } catch (commentError) {
          deps.logError(errorLine(commentError))
        }
        return 1
      }
      const elapsedMs = now() - startedAt
      const timing = formatProcessTiming(elapsedMs, deps.runner.agentLaunches())
      deps.log(`処理を終了します: ${item.id} ${timing}`)

      if (deps.shouldStop()) {
        deps.log("終了します")
        return 0
      }
      continue
    }

    const deadline = Date.now() + intervalMs
    while (!deps.shouldStop() && Date.now() < deadline) {
      const remaining = deadline - Date.now()
      if (remaining <= 0) {
        break
      }
      await deps.sleep(Math.min(remaining, 100))
    }
  }

  deps.log("終了します")
  return 0
}
