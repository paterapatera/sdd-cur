import { describe, expect, test } from "bun:test"
import {
  createGitHub,
  type GhResult,
  type GhRunner,
  type GhRunOptions,
} from "./github.ts"
import { ensureWorkflowLabels, workflowLabels } from "./labels.ts"

type RecordedCall = { args: string[]; options: GhRunOptions }

function recordingRunner(): { runner: GhRunner; calls: RecordedCall[] } {
  const calls: RecordedCall[] = []
  let getCalls = 0
  const runner: GhRunner = {
    async run(args, options) {
      const call = { args, options }
      calls.push(call)
      if (args.includes("--method")) {
        const body = JSON.parse(String(options.stdin)) as { name: string }
        return okJson({ name: body.name })
      }
      getCalls += 1
      if (getCalls === 1) {
        return fail404()
      }
      const label = workflowLabels[getCalls - 1]
      return okJson({ name: label.name })
    },
  }
  return { runner, calls }
}

function okJson(stdout: unknown): GhResult {
  return { stdout: JSON.stringify(stdout), stderr: "", exitCode: 0 }
}

function fail404(): GhResult {
  return { stdout: "", stderr: "gh: Not Found (HTTP 404)\n", exitCode: 1 }
}

describe("workflowLabels", () => {
  test("名前、説明、色は設計の表と一致する", () => {
    expect(workflowLabels).toEqual([
      {
        name: "実装依頼",
        description: "設計が終わり、実装してよい",
        color: "FBCA04",
      },
      { name: "実装中", description: "実装を始めた", color: "D93F0B" },
      {
        name: "実装完了",
        description: "実装が終わり、受け入れ手順がコメントにある",
        color: "0E8A16",
      },
      {
        name: "動作確認OK",
        description: "受け入れテストに合格した",
        color: "1D76DB",
      },
      {
        name: "マージ済み",
        description: "スカッシュマージと同時に付ける",
        color: "5319E7",
      },
    ])
  })
})

describe("ensureWorkflowLabels", () => {
  test("無いラベルだけ createLabel する", async () => {
    const { runner, calls } = recordingRunner()
    const github = createGitHub({ gh: runner, repo: "o/r" })
    const results = await ensureWorkflowLabels(github)
    expect(results).toEqual([
      { name: "実装依頼", status: "created" },
      { name: "実装中", status: "existing" },
      { name: "実装完了", status: "existing" },
      { name: "動作確認OK", status: "existing" },
      { name: "マージ済み", status: "existing" },
    ])
    const creates = calls.filter((call) => call.args.includes("--method"))
    expect(creates.length).toBe(1)
    expect(creates[0]?.options.stdin).toBe(
      JSON.stringify({
        name: workflowLabels[0].name,
        color: workflowLabels[0].color,
        description: workflowLabels[0].description,
      }),
    )
  })

  test("三件目の createLabel が拒否されたとき残りを見ない", async () => {
    const calls: RecordedCall[] = []
    let getCalls = 0
    let createCalls = 0
    const runner: GhRunner = {
      async run(args, options) {
        const call = { args, options }
        calls.push(call)
        if (args.includes("--method")) {
          createCalls += 1
          if (createCalls === 3) {
            return { stdout: "", stderr: "create failed", exitCode: 1 }
          }
          const body = JSON.parse(String(options.stdin)) as { name: string }
          return okJson({ name: body.name })
        }
        getCalls += 1
        return fail404()
      },
    }
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(ensureWorkflowLabels(github)).rejects.toThrow("create failed")
    expect(getCalls).toBe(3)
    expect(createCalls).toBe(3)
    expect(calls.length).toBe(6)
  })
})
