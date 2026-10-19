import { parseIssueNumberString } from "./sdd.ts"
import type { GitResult } from "./git.ts"

export type AgentRunner = {
  run: (args: string[], options: { cwd: string }) => Promise<GitResult>
}

export type AgentLaunchCounts = {
  quick: number
  implement: number
  fix: number
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
const INVALID_RESULT_PATH = "修正結果のパスが不正です"
const INVALID_QUICK_RESULT_PATH = "quick の結果パスが不正です"
const NO_BUGS_TO_FIX = "修正する不具合がありません"
const INVALID_FIX_ID = "修正するコメントが不正です"
const BAD_FIX_IDS = "修正の記録を解釈できません"

function assertProcedurePath(path: string): void {
  if (path.length === 0 || path !== path.trim() || /[\s\n\r]/.test(path)) {
    reject(INVALID_PROCEDURE_PATH)
  }
}

function assertResultPath(path: string): void {
  if (path.length === 0 || path !== path.trim() || /[\s\n\r]/.test(path)) {
    reject(INVALID_RESULT_PATH)
  }
}

function isValidFixId(id: string): boolean {
  if (id.length === 0) {
    return false
  }
  if (id !== id.trim()) {
    return false
  }
  if (/[\s<>]/.test(id)) {
    return false
  }
  return true
}

function assertBugIds(bugs: readonly { id: string; payload: string }[]): void {
  if (bugs.length === 0) {
    reject(NO_BUGS_TO_FIX)
  }
  const seen = new Set<string>()
  for (const bug of bugs) {
    if (!isValidFixId(bug.id)) {
      reject(INVALID_FIX_ID)
    }
    if (seen.has(bug.id)) {
      reject(BAD_FIX_IDS)
    }
    seen.add(bug.id)
  }
}

export function createAgent(options: {
  agent: AgentRunner
  cwd: string
}): {
  implement(input: { issueNumber: number; procedurePath: string }): Promise<void>
  fix(input: {
    issueNumber: number
    resultPath: string
    bugs: readonly { id: string; payload: string }[]
  }): Promise<void>
  quick(input: { issueNumber: number; resultPath: string }): Promise<void>
  launchCounts(): AgentLaunchCounts
  resetLaunchCounts(): void
} {
  const agent = options.agent
  const cwd = options.cwd
  const counts: AgentLaunchCounts = { quick: 0, implement: 0, fix: 0 }

  return {
    launchCounts() {
      return { ...counts }
    },
    resetLaunchCounts() {
      counts.quick = 0
      counts.implement = 0
      counts.fix = 0
    },

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

      counts.implement += 1
      let result: GitResult
      try {
        result = await agent.run(args, { cwd })
      } catch {
        reject("agent を実行できません")
      }
      assertAgentOk(result)
    },

    async fix(input) {
      if (!Number.isSafeInteger(input.issueNumber) || input.issueNumber < 1) {
        reject("番号が不正です")
      }
      parseIssueNumberString(String(input.issueNumber))
      assertResultPath(input.resultPath)
      assertBugIds(input.bugs)

      const line1 = `/sdd-cur-fix ${input.issueNumber} ${input.resultPath}`
      const line2 = JSON.stringify(
        input.bugs.map((b) => ({ id: b.id, payload: b.payload })),
      )
      const prompt = `${line1}\n${line2}`
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

      counts.fix += 1
      let result: GitResult
      try {
        result = await agent.run(args, { cwd })
      } catch {
        reject("agent を実行できません")
      }
      assertAgentOk(result)
    },

    async quick(input) {
      if (!Number.isSafeInteger(input.issueNumber) || input.issueNumber < 1) {
        reject("番号が不正です")
      }
      parseIssueNumberString(String(input.issueNumber))
      if (
        input.resultPath.length === 0 ||
        input.resultPath !== input.resultPath.trim() ||
        /[\s\n\r]/.test(input.resultPath)
      ) {
        reject(INVALID_QUICK_RESULT_PATH)
      }

      const prompt = `/sdd-cur-quick ${input.issueNumber} ${input.resultPath}`
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

      counts.quick += 1
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
