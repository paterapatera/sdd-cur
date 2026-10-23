export type GitResult = {
  stdout: string
  stderr: string
  exitCode: number
}

export type GitRunner = {
  run: (args: string[], options: { cwd: string }) => Promise<GitResult>
}

export type MergeFetchedResult =
  | { status: "merged" }
  | { status: "conflict"; files: readonly string[] }

export type GitClient = {
  remoteName(): Promise<string>
  fetch(remote: string, branch: string): Promise<void>
  checkoutFetched(branch: string): Promise<void>
  mergeFetched(): Promise<MergeFetchedResult>
  headCommit(): Promise<string>
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

export function createGit(
  options: { git: GitRunner; cwd: string },
): GitClient & { currentBranch(): Promise<string> } {
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

    async mergeFetched() {
      const mergeResult = await run(["merge", "FETCH_HEAD", "--no-edit"])
      if (mergeResult.exitCode === 0) {
        return { status: "merged" }
      }
      const diffResult = await run([
        "diff",
        "--name-only",
        "--diff-filter=U",
      ])
      assertGitOk(diffResult)
      const files = diffResult.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .sort((a, b) => a.localeCompare(b))
      if (files.length === 0) {
        reject(failReason(mergeResult))
      }
      const abortResult = await run(["merge", "--abort"])
      assertGitOk(abortResult)
      return { status: "conflict", files }
    },

    async headCommit() {
      const result = await run(["rev-parse", "HEAD"])
      assertGitOk(result)
      const line = firstNonemptyLine(result.stdout)
      if (line === null) {
        reject("git が失敗しました")
      }
      return line.trim()
    },

    async currentBranch() {
      const result = await run(["rev-parse", "--abbrev-ref", "HEAD"])
      assertGitOk(result)
      const line = firstNonemptyLine(result.stdout)
      if (line === null) {
        reject("git が失敗しました")
      }
      return line.trim()
    },

    async hasChanges() {
      const result = await run(["status", "--porcelain"])
      assertGitOk(result)
      return result.stdout.trim().length > 0
    },

    async statusPorcelain() {
      const result = await run([
        "status",
        "--porcelain",
        "--untracked-files=all",
      ])
      assertGitOk(result)
      return result.stdout
    },

    async commitPaths(message, paths) {
      const addResult = await run(["add", paths[0], paths[1]])
      assertGitOk(addResult)
      const commitResult = await run(["commit", "-m", message])
      assertGitOk(commitResult)
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

function parseDefaultBranchFromSymref(stdout: string): string | null {
  const prefix = "ref: refs/heads/"
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.startsWith(prefix)) {
      continue
    }
    const rest = line.slice(prefix.length)
    const match = rest.match(/^([^\s\t]+)/)
    if (match === null || match[1].length === 0) {
      return null
    }
    return match[1]
  }
  return null
}

function remoteExistsOnHeads(stdout: string, branch: string): boolean {
  const target = `refs/heads/${branch}`
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed.length === 0) {
      continue
    }
    const parts = trimmed.split(/\t/)
    const ref = parts[parts.length - 1]
    if (ref === target) {
      return true
    }
  }
  return false
}

export async function prepareBranch(options: {
  git: GitRunner
  cwd: string
  branch: string
}): Promise<void> {
  const { git, cwd, branch } = options

  async function run(args: string[]): Promise<GitResult> {
    try {
      return await git.run(args, { cwd })
    } catch {
      reject("git を実行できません")
    }
  }

  const remoteResult = await run(["remote"])
  if (remoteResult.exitCode !== 0) {
    reject(failReason(remoteResult))
  }
  const remoteNames = remoteResult.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  if (remoteNames.length !== 1) {
    reject("リモートを特定できません")
  }
  const remote = remoteNames[0]

  const showRefResult = await run([
    "show-ref",
    "--verify",
    "--quiet",
    `refs/heads/${branch}`,
  ])
  if (showRefResult.exitCode === 0) {
    const checkoutResult = await run(["checkout", branch])
    assertGitOk(checkoutResult)
  } else if (showRefResult.exitCode === 1) {
    const lsHeadsResult = await run(["ls-remote", "--heads", remote, branch])
    if (lsHeadsResult.exitCode !== 0) {
      reject(failReason(lsHeadsResult))
    }
    if (remoteExistsOnHeads(lsHeadsResult.stdout, branch)) {
      const fetchResult = await run(["fetch", remote, branch])
      assertGitOk(fetchResult)
      const checkoutBResult = await run([
        "checkout",
        "-B",
        branch,
        "FETCH_HEAD",
      ])
      assertGitOk(checkoutBResult)
    } else {
      const symrefResult = await run(["ls-remote", "--symref", remote, "HEAD"])
      if (symrefResult.exitCode !== 0) {
        reject(failReason(symrefResult))
      }
      const defaultBranch = parseDefaultBranchFromSymref(symrefResult.stdout)
      if (defaultBranch === null) {
        reject("デフォルトブランチを特定できません")
      }
      const fetchDefaultResult = await run(["fetch", remote, defaultBranch])
      assertGitOk(fetchDefaultResult)
      const checkoutBResult = await run([
        "checkout",
        "-b",
        branch,
        "FETCH_HEAD",
      ])
      assertGitOk(checkoutBResult)
    }
  } else {
    reject(failReason(showRefResult))
  }

  const headResult = await run(["rev-parse", "--abbrev-ref", "HEAD"])
  assertGitOk(headResult)
  const current = firstNonemptyLine(headResult.stdout)
  if (current === null) {
    reject("git が失敗しました")
  }
  if (current !== branch) {
    reject("今のブランチが作業ブランチと違います")
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
