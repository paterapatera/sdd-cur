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
      "--workspace",
      "/proj",
      "--output-format",
      "text",
      "/sdd-cur-implement 6 /tmp/procedure.txt",
    ])
    expect(calls[0]?.args).not.toContain("--api-key")
  })
})
