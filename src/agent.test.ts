import { describe, expect, test } from "bun:test"
import { createAgent, type AgentRunner } from "./agent.ts"
import type { GitResult } from "./git.ts"

type RecordedCall = { args: string[]; cwd: string }

function recordingRunner(
  handler: () => GitResult,
): { runner: AgentRunner; calls: RecordedCall[] } {
  const calls: RecordedCall[] = []
  const runner: AgentRunner = {
    async run(args, options) {
      calls.push({ args, cwd: options.cwd })
      return handler()
    },
  }
  return { runner, calls }
}

describe("createAgent", () => {
  test("不正な番号と空白を含む手順パスは run を呼ばない", async () => {
    const { runner, calls } = recordingRunner(() => ({
      stdout: "",
      stderr: "",
      exitCode: 0,
    }))
    const agent = createAgent({ agent: runner, cwd: "/proj" })
    await expect(
      agent.implement({ issueNumber: 0, procedurePath: "/tmp/p" }),
    ).rejects.toThrow("番号が不正です")
    await expect(
      agent.implement({ issueNumber: 1, procedurePath: "/tmp/a b" }),
    ).rejects.toThrow("受け入れ手順のパスが不正です")
    expect(calls).toHaveLength(0)
  })

  test("成功時の引数", async () => {
    const { runner, calls } = recordingRunner(() => ({
      stdout: "",
      stderr: "",
      exitCode: 0,
    }))
    const agent = createAgent({ agent: runner, cwd: "/proj" })
    await agent.implement({
      issueNumber: 6,
      procedurePath: "/tmp/procedure.txt",
    })
    expect(calls).toHaveLength(1)
    expect(calls[0]?.cwd).toBe("/proj")
    expect(calls[0]?.args).toEqual([
      "-p",
      "--force",
      "--trust",
      "--model",
      "composer-2.5[fast=false]",
      "--workspace",
      "/proj",
      "--output-format",
      "text",
      "/sdd-cur-implement 6 /tmp/procedure.txt",
    ])
    expect(calls[0]?.args).not.toContain("--api-key")
  })

  test("fix は不正入力で run を呼ばない", async () => {
    const { runner, calls } = recordingRunner(() => ({
      stdout: "",
      stderr: "",
      exitCode: 0,
    }))
    const agent = createAgent({ agent: runner, cwd: "/proj" })
    await expect(
      agent.fix({ issueNumber: 0, resultPath: "/tmp/r", bugs: [] }),
    ).rejects.toThrow("番号が不正です")
    await expect(
      agent.fix({
        issueNumber: 1,
        resultPath: "/tmp/a b",
        bugs: [{ id: "IC_x", payload: "" }],
      }),
    ).rejects.toThrow("修正結果のパスが不正です")
    await expect(
      agent.fix({
        issueNumber: 1,
        resultPath: "/tmp/r",
        bugs: [],
      }),
    ).rejects.toThrow("修正する不具合がありません")
    expect(calls).toHaveLength(0)
  })

  test("fix 成功時の引数", async () => {
    const { runner, calls } = recordingRunner(() => ({
      stdout: "",
      stderr: "",
      exitCode: 0,
    }))
    const agent = createAgent({ agent: runner, cwd: "/proj" })
    await agent.fix({
      issueNumber: 6,
      resultPath: "/tmp/result.txt",
      bugs: [{ id: "IC_a", payload: "不具合" }],
    })
    expect(calls).toHaveLength(1)
    expect(calls[0]?.cwd).toBe("/proj")
    expect(calls[0]?.args).toEqual([
      "-p",
      "--force",
      "--trust",
      "--model",
      "composer-2.5[fast=false]",
      "--workspace",
      "/proj",
      "--output-format",
      "text",
      '/sdd-cur-fix 6 /tmp/result.txt\n[{"id":"IC_a","payload":"不具合"}]',
    ])
    expect(calls[0]?.args).not.toContain("--api-key")
  })

  test("quick のプロンプトと不正な結果パス", async () => {
    const { runner, calls } = recordingRunner(() => ({
      stdout: "",
      stderr: "",
      exitCode: 0,
    }))
    const agent = createAgent({ agent: runner, cwd: "/proj" })
    await expect(
      agent.quick({ issueNumber: 1, resultPath: "" }),
    ).rejects.toThrow("quick の結果パスが不正です")
    expect(calls).toHaveLength(0)
    await agent.quick({
      issueNumber: 6,
      resultPath: "/tmp/quick-result.txt",
    })
    expect(calls).toHaveLength(1)
    expect(calls[0]?.args).toEqual([
      "-p",
      "--force",
      "--trust",
      "--model",
      "composer-2.5[fast=false]",
      "--workspace",
      "/proj",
      "--output-format",
      "text",
      "/sdd-cur-quick 6 /tmp/quick-result.txt",
    ])
  })
})
