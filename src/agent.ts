import { parseIssueNumberString } from "./sdd.ts"
import type { GitResult } from "./git.ts"

export type AgentRunner = {
  run: (args: string[], options: { cwd: string }) => Promise<GitResult>
}

function reject(message: string): never {
  throw new Error(message)
}

function firstNonemptyLine(text: string): string | null {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }
  return null
}

function failReason(result: GitResult): string {
  const fromStderr = firstNonemptyLine(result.stderr)
  if (fromStderr) {
    return fromStderr
  }
  const fromStdout = firstNonemptyLine(result.stdout)
  if (fromStdout) {
    return fromStdout
  }
  return "agent が失敗しました"
}

function assertAgentOk(result: GitResult): void {
  if (result.exitCode !== 0) {
    reject(failReason(result))
  }
}

const INVALID_PROCEDURE_PATH = "受け入れ手順のパスが不正です"

function assertProcedurePath(path: string): void {
  if (path.length === 0 || path !== path.trim() || /[\s\n\r]/.test(path)) {
    reject(INVALID_PROCEDURE_PATH)
  }
}

export function createAgent(options: {
  agent: AgentRunner
  cwd: string
}): {
  implement(input: { issueNumber: number; procedurePath: string }): Promise<void>
} {
  const agent = options.agent
  const cwd = options.cwd

  return {
    async implement(input) {
      if (!Number.isSafeInteger(input.issueNumber) || input.issueNumber < 1) {
        reject("番号が不正です")
      }
      parseIssueNumberString(String(input.issueNumber))
      assertProcedurePath(input.procedurePath)

      const prompt = `/sdd-cur-implement ${input.issueNumber} ${input.procedurePath}`
      const args = [
        "-p",
        "--force",
        "--trust",
        "--workspace",
        cwd,
        "--output-format",
        "text",
        prompt,
      ]

      let result: GitResult
      try {
        result = await agent.run(args, { cwd })
      } catch {
        reject("agent を実行できません")
      }
      assertAgentOk(result)
    },
  }
}

export const defaultAgentRunner: AgentRunner = {
  async run(args, options) {
    try {
      const proc = Bun.spawn(["agent", ...args], {
        cwd: options.cwd,
        env: process.env,
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
      })
      proc.stdin.end()
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ])
      return { stdout, stderr, exitCode }
    } catch {
      reject("agent を実行できません")
    }
  },
}
