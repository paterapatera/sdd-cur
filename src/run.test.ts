import { describe, expect, test } from "bun:test"
import { MAX_INTERVAL_MIN, MIN_INTERVAL_MIN, parseRunArgs, runLoop } from "./run.ts"
import type { Runner, WorkItem } from "./runner.ts"

function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
} {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe("parseRunArgs", () => {
  test("省略時は 1 分", () => {
    expect(parseRunArgs([])).toEqual({ ok: true, intervalMin: 1 })
  })

  test("1 と 1440 は受け付ける", () => {
    expect(parseRunArgs(["--interval-min", "1"])).toEqual({
      ok: true,
      intervalMin: 1,
    })
    expect(parseRunArgs(["--interval-min", String(MAX_INTERVAL_MIN)])).toEqual({
      ok: true,
      intervalMin: MAX_INTERVAL_MIN,
    })
  })

  test("範囲外や整数でない値は失敗", () => {
    expect(parseRunArgs(["--interval-min", "0"]).ok).toBe(false)
    expect(parseRunArgs(["--interval-min", "1441"]).ok).toBe(false)
    expect(parseRunArgs(["--interval-min", "1.5"]).ok).toBe(false)
    expect(parseRunArgs(["--interval-min", "x"]).ok).toBe(false)
  })
})

describe("runLoop", () => {
  test("poll が null のあと停止すると poll は一度だけ", async () => {
    let pollCount = 0
    let stop = false
    const runner: Runner = {
      async poll() {
        pollCount += 1
        stop = true
        return null
      },
      async process() {},
    }

    const logs: string[] = []
    const code = await runLoop({
      runner,
      intervalMin: MIN_INTERVAL_MIN,
      shouldStop: () => stop,
      sleep: async () => {},
      log: (line) => logs.push(line),
      logError: () => {},
    })

    expect(pollCount).toBe(1)
    expect(code).toBe(0)
    expect(logs).toContain("終了します")
  })

  test("process の実行中に二度目の poll が呼ばれない", async () => {
    let pollCount = 0
    const processGate = deferred<void>()
    const runner: Runner = {
      async poll() {
        pollCount += 1
        if (pollCount === 1) {
          return { id: "1" }
        }
        return null
      },
      async process() {
        await processGate.promise
      },
    }

    let stop = false
    const loopPromise = runLoop({
      runner,
      intervalMin: 1,
      shouldStop: () => stop,
      sleep: async () => {},
      log: () => {},
      logError: () => {},
    })

    await Bun.sleep(10)
    expect(pollCount).toBe(1)

    processGate.resolve()
    stop = true
    await loopPromise
    expect(pollCount).toBe(1)
  })

  test("process 完了後、停止していなければ poll が再び呼ばれる", async () => {
    let pollCount = 0
    const runner: Runner = {
      async poll() {
        pollCount += 1
        if (pollCount === 1) {
          return { id: "1" }
        }
        return null
      },
      async process() {},
    }

    let stop = false
    const code = await runLoop({
      runner,
      intervalMin: 1,
      shouldStop: () => stop,
      sleep: async () => {
        stop = true
      },
      log: () => {},
      logError: () => {},
    })

    expect(pollCount).toBe(2)
    expect(code).toBe(0)
  })

  test("process の途中で停止フラグが立つと完了後に poll しない", async () => {
    let pollCount = 0
    const processGate = deferred<void>()
    let stop = false
    const runner: Runner = {
      async poll() {
        pollCount += 1
        return { id: "1" }
      },
      async process() {
        stop = true
        await processGate.promise
      },
    }

    const loopPromise = runLoop({
      runner,
      intervalMin: 1,
      shouldStop: () => stop,
      sleep: async () => {},
      log: () => {},
      logError: () => {},
    })

    await Bun.sleep(10)
    processGate.resolve()
    await loopPromise
    expect(pollCount).toBe(1)
  })

  test("待機中の停止は間隔の満了を待たない", async () => {
    let sleptMs = 0
    let stop = false
    const runner: Runner = {
      async poll() {
        return null
      },
      async process() {},
    }

    await runLoop({
      runner,
      intervalMin: 1440,
      shouldStop: () => stop,
      sleep: async (ms) => {
        sleptMs += ms
        stop = true
      },
      log: () => {},
      logError: () => {},
    })

    expect(sleptMs).toBeLessThanOrEqual(100)
  })

  test("poll が仕事を返した時点で停止フラグが立っていれば process は呼ばれない", async () => {
    let processCalled = false
    let pollCount = 0
    let stop = false
    const runner: Runner = {
      async poll() {
        pollCount += 1
        stop = true
        return { id: "1" }
      },
      async process() {
        processCalled = true
      },
    }

    const logs: string[] = []
    const code = await runLoop({
      runner,
      intervalMin: 1,
      shouldStop: () => stop,
      sleep: async () => {},
      log: (line) => logs.push(line),
      logError: () => {},
    })

    expect(pollCount).toBe(1)
    expect(processCalled).toBe(false)
    expect(code).toBe(0)
    expect(logs).toEqual(["終了します"])
  })

  test("poll または process が拒否すると終了コード 1", async () => {
    const pollFail: Runner = {
      async poll() {
        throw new Error("poll failed")
      },
      async process() {},
    }
    expect(
      await runLoop({
        runner: pollFail,
        intervalMin: 1,
        shouldStop: () => false,
        sleep: async () => {},
        log: () => {},
        logError: () => {},
      }),
    ).toBe(1)

    let polled = false
    const processFail: Runner = {
      async poll() {
        polled = true
        return { id: "1" }
      },
      async process() {
        throw new Error("process failed")
      },
    }
    expect(
      await runLoop({
        runner: processFail,
        intervalMin: 1,
        shouldStop: () => false,
        sleep: async () => {},
        log: () => {},
        logError: () => {},
      }),
    ).toBe(1)
    expect(polled).toBe(true)
  })
})
