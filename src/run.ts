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

export type RunLoopDeps = {
  runner: Runner
  intervalMin: number
  shouldStop: () => boolean
  sleep: (ms: number) => Promise<void>
  log: (line: string) => void
  logError: (line: string) => void
  commentFailure: (issueId: string, line: string) => Promise<void>
}

function errorLine(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return String(error)
}

export async function runLoop(deps: RunLoopDeps): Promise<0 | 1> {
  const intervalMs = deps.intervalMin * 60 * 1000

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

      deps.log(`処理を開始します: ${item.id}`)
      try {
        await deps.runner.process(item)
      } catch (error) {
        const line = errorLine(error)
        deps.logError(line)
        try {
          await deps.commentFailure(item.id, line)
        } catch (commentError) {
          deps.logError(errorLine(commentError))
        }
        return 1
      }
      deps.log(`処理を終了します: ${item.id}`)

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
