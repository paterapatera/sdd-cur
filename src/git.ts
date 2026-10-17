export type GitResult = {
  stdout: string
  stderr: string
  exitCode: number
}

export type GitRunner = {
  run: (args: string[], options: { cwd: string }) => Promise<GitResult>
}

export type GitClient = {
  remoteName(): Promise<string>
  fetch(remote: string, branch: string): Promise<void>
  checkoutFetched(branch: string): Promise<void>
  hasChanges(): Promise<boolean>
  commitAll(message: string): Promise<void>
  push(remote: string, branch: string): Promise<void>
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
  return "git が失敗しました"
}

function assertGitOk(result: GitResult): void {
  if (result.exitCode !== 0) {
    reject(failReason(result))
  }
}

export function createGit(options: { git: GitRunner; cwd: string }): GitClient {
  const git = options.git
  const cwd = options.cwd

  async function run(args: string[]): Promise<GitResult> {
    try {
      return await git.run(args, { cwd })
    } catch {
      reject("git を実行できません")
    }
  }

  return {
    async remoteName() {
      const result = await run(["remote"])
      assertGitOk(result)
      const names = result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
      if (names.length !== 1) {
        reject("リモートを特定できません")
      }
      return names[0]
    },

    async fetch(remote, branch) {
      const result = await run(["fetch", remote, branch])
      assertGitOk(result)
    },

    async checkoutFetched(branch) {
      const result = await run(["checkout", "-B", branch, "FETCH_HEAD"])
      assertGitOk(result)
    },

    async hasChanges() {
      const result = await run(["status", "--porcelain"])
      assertGitOk(result)
      return result.stdout.trim().length > 0
    },

    async commitAll(message) {
      const addResult = await run(["add", "-A"])
      assertGitOk(addResult)
      const commitResult = await run(["commit", "-m", message])
      assertGitOk(commitResult)
    },

    async push(remote, branch) {
      const result = await run(["push", "-u", remote, branch])
      assertGitOk(result)
    },
  }
}

export const defaultGitRunner: GitRunner = {
  async run(args, options) {
    try {
      const proc = Bun.spawn(["git", ...args], {
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
      reject("git を実行できません")
    }
  },
}
