import { describe, expect, test } from "bun:test"
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { acceptanceProcedure, commentMarkers } from "./conventions.ts"
import {
  createGit,
  shortCommitHash,
  taskDoneCommitTrailer,
  type GitResult,
  type GitRunner,
} from "./git.ts"
import {
  NO_WORK_LIST_ITEMS,
  NO_WORK_LIST_SECTION,
  acceptanceComment,
  collectTasks,
  formatWorkListLine,
  pullRequestBody,
  resolveWorkListLinesForPullRequest,
} from "./runner.ts"

const cliPath = path.join(import.meta.dir, "cli.ts")
const bunExe = process.execPath

const designFixture = `## 作業の一覧

- 1. 一つ目 [1]
- 2. 二つ目 [2]

## テスト

\`bun test\`
`

const designNoItems = `## 作業の一覧

- 説明だけで番号付き作業ではない

## テスト

\`bun test\`
`

const designNoSection = `## 受け入れ条件

- 1. 条件

## テスト

\`bun test\`
`

type RecordedCall = { args: string[]; cwd: string }

function recordingRunner(
  handler: (call: RecordedCall) => GitResult,
): { runner: GitRunner; calls: RecordedCall[] } {
  const calls: RecordedCall[] = []
  const runner: GitRunner = {
    async run(args, options) {
      const call = { args, cwd: options.cwd }
      calls.push(call)
      return handler(call)
    },
  }
  return { runner, calls }
}

function ok(stdout = "", stderr = ""): GitResult {
  return { stdout, stderr, exitCode: 0 }
}

function fail(stderr = "", stdout = "", exitCode = 1): GitResult {
  return { stdout, stderr, exitCode }
}

function git(cwd: string, command: string): void {
  execSync(`git ${command}`, { cwd, stdio: "pipe" })
}

function initGitRepo(cwd: string): void {
  git(cwd, "init -b main")
  git(cwd, "config user.email t@example.com")
  git(cwd, "config user.name t")
  git(cwd, "commit --allow-empty -m init")
  const bare = path.join(
    path.dirname(cwd),
    `${path.basename(cwd)}-origin.git`,
  )
  git(cwd, `init --bare -b main "${bare}"`)
  git(cwd, `remote add origin "${bare}"`)
  git(cwd, "push -u origin main")
}

async function withTemp(fn: (temp: string) => Promise<void>): Promise<void> {
  const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-175-"))
  try {
    await fn(temp)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

async function runCli(
  cwd: string,
  argv: string[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([bunExe, cliPath, ...argv], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      PATH: `${path.dirname(bunExe)}${path.delimiter}${process.env.PATH ?? ""}`,
    },
  })
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  return { exitCode: await proc.exited, stdout, stderr }
}

function symrefRun(stdout = "ref: refs/heads/main\tHEAD\n"): GitRunner["run"] {
  return async (args) => {
    if (args[0] === "ls-remote" && args[1] === "--symref") {
      return ok(stdout)
    }
    return fail("unexpected git call")
  }
}

type InjectedResolveGit = {
  remoteName?: () => Promise<string>
  branchOnlyCommitShas?: (
    remote: string,
    defaultBranch: string,
  ) => Promise<readonly string[]>
  commitMessage?: (sha: string) => Promise<string>
  run?: GitRunner["run"]
}

function injectedResolveGit(overrides: InjectedResolveGit = {}) {
  const run = overrides.run ?? symrefRun()
  return {
    async remoteName() {
      if (overrides.remoteName) {
        return await overrides.remoteName()
      }
      return "origin"
    },
    async branchOnlyCommitShas(
      remote: string,
      defaultBranch: string,
    ): Promise<readonly string[]> {
      if (overrides.branchOnlyCommitShas) {
        return await overrides.branchOnlyCommitShas(remote, defaultBranch)
      }
      return []
    },
    async commitMessage(sha: string): Promise<string> {
      if (overrides.commitMessage) {
        return await overrides.commitMessage(sha)
      }
      return ""
    },
    run,
  }
}

describe("175 pull request work list", () => {
  test("shortCommitHash は全文 SHA の先頭 7 文字を十六進小文字で返す", () => {
    expect(shortCommitHash("ABCDEF0123456789ABCDEF0123456789")).toBe("abcdef0")
    expect(shortCommitHash("0123456789abcdef")).toBe("0123456")
  })

  test("formatWorkListLine がコミットあり・なし・短いハッシュの形になる", () => {
    const fullSha = "FEDCBA0987654321FEDCBA0987654321FEDCBA09"
    const body = "1. 作業の本文 [3]"
    expect(formatWorkListLine(body, fullSha)).toBe(
      `- [x] ${body} (${shortCommitHash(fullSha)})`,
    )
    expect(formatWorkListLine(body, null)).toBe(`- [ ] ${body}`)
    const withSha = formatWorkListLine(body, fullSha)
    expect(withSha.startsWith(`- [x] ${body} `)).toBe(true)
    expect(withSha.endsWith(`(${shortCommitHash(fullSha)})`)).toBe(true)
  })

  test("formatWorkListLine は branch-only の先頭 SHA の短いハッシュを使う", () => {
    const first = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    const second = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    const body = "1. 複数コミット [20]"
    expect(formatWorkListLine(body, first)).toBe(
      `- [x] ${body} (${shortCommitHash(first)})`,
    )
    expect(formatWorkListLine(body, first)).not.toBe(
      `- [x] ${body} (${shortCommitHash(second)})`,
    )
  })

  test("collectTasks が cmdTasks と同じ並びと line を返す", async () => {
    await withTemp(async (temp) => {
      initGitRepo(temp)
      const designPath = path.join(temp, "docs/issues/175/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, designFixture, "utf8")

      const collected = collectTasks(designFixture)
      expect("error" in collected).toBe(false)
      if ("error" in collected) {
        return
      }

      const cli = await runCli(temp, ["tasks", "175"])
      expect(cli.exitCode).toBe(0)
      const parsed = JSON.parse(cli.stdout.trim()) as {
        tasks: { number: number; line: string; refs: number[] }[]
      }
      expect(collected.map((t) => t.number)).toEqual(
        parsed.tasks.map((t) => t.number),
      )
      expect(collected.map((t) => t.line)).toEqual(
        parsed.tasks.map((t) => t.line),
      )
      expect(collected.map((t) => t.refs)).toEqual(
        parsed.tasks.map((t) => t.refs),
      )
    })
  })

  test("pullRequestBody が作業行を URL と印のあいだに空行なしで挟み acceptanceProcedure は payload だけ", () => {
    const issueUrl = "https://github.com/o/r/issues/175"
    const payload = "  手順本文  \n二行目"
    const workListLines = [
      "- [x] 1. 一つ目 [1] (abcdef0)",
      "- [ ] 2. 二つ目 [2]",
    ]
    const body = pullRequestBody(issueUrl, payload, workListLines)
    expect(body).toBe(
      `${issueUrl}\n${workListLines.join("\n")}\n${acceptanceComment(payload)}`,
    )
    const parts = body.split("\n")
    expect(parts[0]).toBe(issueUrl)
    expect(parts[1]).toBe(workListLines[0])
    expect(parts[2]).toBe(workListLines[1])
    expect(parts[3]).toBe(commentMarkers.acceptance)
    expect(parts.slice(0, 3).every((line) => line !== "")).toBe(true)
    expect(acceptanceProcedure(body)).toBe(payload)
    expect(acceptanceProcedure(body)).not.toContain(issueUrl)
    expect(acceptanceProcedure(body)).not.toContain(workListLines[0])
  })

  test("pullRequestBody は未完了の作業行を本文に残す", () => {
    const unchecked = "- [ ] 2. 二つ目 [2]"
    const body = pullRequestBody("https://issue/175", "手順", [unchecked])
    expect(body).toContain(unchecked)
    expect(() => pullRequestBody("https://issue/175", "手順", [unchecked])).not.toThrow()
  })

  test("resolveWorkListLinesForPullRequest が branch-only の順と Sdd-Cur-Task で行を組み立てる", async () => {
    const sha1First = "cccccccccccccccccccccccccccccccccccccccc"
    const sha1Second = "dddddddddddddddddddddddddddddddddddddddd"
    const shaWrongTask = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    const git = injectedResolveGit({
      async branchOnlyCommitShas() {
        return [sha1First, sha1Second, shaWrongTask]
      },
      async commitMessage(sha) {
        if (sha === sha1First || sha === sha1Second) {
          return `feat\n\n${taskDoneCommitTrailer(1)}\n`
        }
        if (sha === shaWrongTask) {
          return `feat\n\n${taskDoneCommitTrailer(99)}\n`
        }
        return ""
      },
    })
    const lines = await resolveWorkListLinesForPullRequest(
      designFixture,
      git,
      "/tmp",
    )
    expect(lines).toEqual([
      formatWorkListLine("1. 一つ目 [1]", sha1First),
      formatWorkListLine("2. 二つ目 [2]", null),
    ])
  })

  test("resolveWorkListLinesForPullRequest は branch-only に無いトレーラーを未完了にする", async () => {
    const git = injectedResolveGit({
      async branchOnlyCommitShas() {
        return []
      },
    })
    const lines = await resolveWorkListLinesForPullRequest(
      designFixture,
      git,
      "/tmp",
    )
    expect(lines).toEqual([
      formatWorkListLine("1. 一つ目 [1]", null),
      formatWorkListLine("2. 二つ目 [2]", null),
    ])
  })

  test("resolveWorkListLinesForPullRequest は別作業番号のトレーラーだけでは完了にしない", async () => {
    const sha = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    const git = injectedResolveGit({
      async branchOnlyCommitShas() {
        return [sha]
      },
      async commitMessage() {
        return `feat\n\n${taskDoneCommitTrailer(99)}\n`
      },
    })
    const lines = await resolveWorkListLinesForPullRequest(
      designFixture,
      git,
      "/tmp",
    )
    expect(lines.every((line) => line.startsWith("- [ ] "))).toBe(true)
  })

  test("resolveWorkListLinesForPullRequest の失敗理由", async () => {
    const cwd = "/tmp"
    await expect(
      resolveWorkListLinesForPullRequest(designNoSection, injectedResolveGit(), cwd),
    ).rejects.toThrow(NO_WORK_LIST_SECTION)

    await expect(
      resolveWorkListLinesForPullRequest(designNoItems, injectedResolveGit(), cwd),
    ).rejects.toThrow(NO_WORK_LIST_ITEMS)

    await expect(
      resolveWorkListLinesForPullRequest(
        designFixture,
        injectedResolveGit({
          async remoteName() {
            throw new Error("リモートを特定できません")
          },
        }),
        cwd,
      ),
    ).rejects.toThrow("リモートを特定できません")

    await expect(
      resolveWorkListLinesForPullRequest(
        designFixture,
        injectedResolveGit({
          run: symrefRun("abc\tHEAD\n"),
        }),
        cwd,
      ),
    ).rejects.toThrow("デフォルトブランチを特定できません")

    await expect(
      resolveWorkListLinesForPullRequest(
        designFixture,
        injectedResolveGit({
          run: async () => fail("symref failed", "", 2),
        }),
        cwd,
      ),
    ).rejects.toThrow("symref failed")

    const rejectRunner: GitRunner = {
      async run() {
        throw new Error("spawn failed")
      },
    }
    await expect(
      resolveWorkListLinesForPullRequest(
        designFixture,
        createGit({ git: rejectRunner, cwd }),
        cwd,
      ),
    ).rejects.toThrow("git を実行できません")

    const { runner } = recordingRunner((call) => {
      if (call.args[0] === "remote") {
        return ok("origin\n")
      }
      if (call.args[0] === "ls-remote" && call.args[1] === "--symref") {
        return ok("ref: refs/heads/main\tHEAD\n")
      }
      if (call.args[0] === "rev-parse") {
        return fail("", "", 1)
      }
      if (call.args[0] === "ls-remote") {
        return ok("")
      }
      return ok()
    })
    const gitClient = Object.assign(createGit({ git: runner, cwd }), {
      run: runner.run,
    })
    await expect(
      resolveWorkListLinesForPullRequest(designFixture, gitClient, cwd),
    ).rejects.toThrow("git が失敗しました")
  })

  test("[15] skills/sdd-cur/conventions.md のマージリクエストの本文の並び", () => {
    const skillsPath = path.join(
      import.meta.dir,
      "..",
      "skills/sdd-cur/conventions.md",
    )
    const text = readFileSync(skillsPath, "utf8")
    const sectionStart = text.indexOf("## マージリクエストの本文")
    expect(sectionStart).toBeGreaterThanOrEqual(0)
    const nextSection = text.indexOf("\n## ", sectionStart + 1)
    const section =
      nextSection < 0
        ? text.slice(sectionStart)
        : text.slice(sectionStart, nextSection)
    expectLinesInOrder(section, [
      "課題の URL",
      "作業の一覧",
      "印 `sdd-cur: 受け入れ手順`",
      "受け入れ手順",
    ])
  })
})

function expectLinesInOrder(haystack: string, lines: readonly string[]): void {
  let from = 0
  for (const line of lines) {
    const index = haystack.indexOf(line, from)
    expect(index).toBeGreaterThanOrEqual(0)
    from = index + line.length
  }
}
