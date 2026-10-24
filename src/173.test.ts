import { describe, expect, test } from "bun:test"
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  createGit,
  messageHasSddCurTaskForNumber,
  messageHasSddCurTaskTrailer,
  parseDefaultBranchFromSymref,
  taskDoneCommitSubject,
  taskDoneCommitTrailer,
  type GitResult,
  type GitRunner,
} from "./git.ts"
import {
  createIssueCommentStore,
  issue,
  VIEWER_LOGIN,
} from "./runner-test-support.ts"
import { createRunner } from "./runner.ts"

const root = path.join(import.meta.dir, "..")
const cliPath = path.join(import.meta.dir, "cli.ts")
const bunExe = process.execPath

const minimalDesign = `## 作業の一覧

- 1. 一つ目 [1]
- 2. 二つ目 [2]

## テスト

\`bun test\`
`

type RecordedCall = { args: string[]; cwd: string }

function recordingRunner(
  handler: (call: RecordedCall, index: number) => GitResult,
): { runner: GitRunner; calls: RecordedCall[] } {
  const calls: RecordedCall[] = []
  const runner: GitRunner = {
    async run(args, options) {
      const call = { args, cwd: options.cwd }
      calls.push(call)
      return handler(call, calls.length - 1)
    },
  }
  return { runner, calls }
}

function ok(stdout = "", stderr = ""): GitResult {
  return { stdout, stderr, exitCode: 0 }
}

function git(cwd: string, command: string): void {
  execSync(`git ${command}`, { cwd, stdio: "pipe" })
}

function initGitRepo(cwd: string): string {
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
  return bare
}

function taskCommit(
  cwd: string,
  issueNumber: number,
  taskNumber: number,
): void {
  const subject = taskDoneCommitSubject(issueNumber, taskNumber)
  const trailer = taskDoneCommitTrailer(taskNumber)
  git(
    cwd,
    `commit --allow-empty -m "${subject}" -m "" -m "${trailer}"`,
  )
}

async function withTemp(
  fn: (temp: string) => Promise<void>,
): Promise<void> {
  const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-173-"))
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

describe("173 task-done and tasks", () => {
  test("switch usage policy agents", () => {
    const cli = readFileSync(cliPath, "utf8")
    expect(cli).toContain('case "task-done":')
    expect(cli).toContain("sdd-cur task-done <番号> <作業番号>")
    const policy = readFileSync(path.join(root, "docs/policy.md"), "utf8")
    expect(policy).toContain("`task-done`")
    const agents = readFileSync(path.join(root, "AGENTS.md"), "utf8")
    expect(agents).toContain("bun src/cli.ts task-done <番号> <作業番号>")
  })

  test("task-done 引数と番号", async () => {
    const noArgs = Bun.spawn([bunExe, cliPath], {
      stdout: "pipe",
      stderr: "pipe",
      cwd: root,
    })
    const usage = await new Response(noArgs.stderr).text()
    await noArgs.exited

    await withTemp(async (temp) => {
      initGitRepo(temp)
      for (const args of [[], ["1"], ["1", "2", "3"]] as const) {
        const r = await runCli(temp, ["task-done", ...args])
        expect(r.exitCode).toBe(1)
        expect(r.stdout).toBe("")
        expect(r.stderr).toBe(usage)
      }
      for (const bad of ["0", "01", "a"]) {
        const r = await runCli(temp, ["task-done", bad, "1"])
        expect(r.exitCode).toBe(1)
        expect(r.stdout).toBe("")
        expect(r.stderr.trim()).toBe("番号が不正です")
      }
    })
  })

  test("task-done は注入 git のみで gh を起動しない", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "status" && call.args[1] === "--porcelain") {
        return ok(" M x\n")
      }
      return ok()
    })
    const gitClient = createGit({ git: runner, cwd: "/tmp" })
    await gitClient.commitTaskDone(173, 1)
    expect(calls.length).toBeGreaterThan(0)
    expect(calls.every((c) => c.args[0] !== "gh")).toBe(true)
  })

  test("task-done 成功時のコミットと hasChanges 偽", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "status" && call.args[1] === "--porcelain") {
        return ok(" M file\n")
      }
      return ok()
    })
    const gitClient = createGit({ git: runner, cwd: "/proj" })
    await gitClient.commitTaskDone(173, 2)
    const addIdx = calls.findIndex((c) => c.args[0] === "add" && c.args[1] === "-A")
    const commitIdx = calls.findIndex(
      (c) =>
        c.args[0] === "commit" &&
        c.args.includes(taskDoneCommitSubject(173, 2)),
    )
    expect(addIdx).toBeGreaterThanOrEqual(0)
    expect(commitIdx).toBeGreaterThan(addIdx)
    expect(calls[commitIdx]?.args).toEqual([
      "commit",
      "-m",
      "feat: 課題 173 作業 2",
      "-m",
      "",
      "-m",
      "Sdd-Cur-Task: 2",
    ])
    expect(calls.some((c) => c.args[0] === "push")).toBe(false)

    await withTemp(async (temp) => {
      initGitRepo(temp)
      const r = await runCli(temp, ["task-done", "173", "1"])
      expect(r.exitCode).toBe(1)
      expect(r.stdout).toBe("")
      expect(r.stderr.trim()).toBe("作業の変更がありません")
    })
  })

  test("tasks JSON の形と gh 無し", async () => {
    await withTemp(async (temp) => {
      initGitRepo(temp)
      const designPath = path.join(temp, "docs/issues/173/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, minimalDesign, "utf8")
      const { exitCode, stdout, stderr } = await runCli(temp, ["tasks", "173"])
      expect(exitCode).toBe(0)
      expect(stderr).toBe("")
      const parsed = JSON.parse(stdout.trim()) as {
        tasks: Record<string, unknown>[]
        testCommands: string[]
      }
      expect(Object.keys(parsed)).toEqual(["tasks", "testCommands"])
      expect(parsed.tasks).toHaveLength(2)
      for (const task of parsed.tasks) {
        expect(Object.keys(task)).toEqual(["number", "line", "refs", "done"])
        expect(typeof task.done).toBe("boolean")
      }
    })
  })

  test("tasks done の branch-only 判定", async () => {
    await withTemp(async (temp) => {
      initGitRepo(temp)
      const designPath = path.join(temp, "docs/issues/173/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, minimalDesign, "utf8")

      git(temp, "checkout -b feature")
      taskCommit(temp, 173, 1)
      let r = await runCli(temp, ["tasks", "173"])
      const onBranch = JSON.parse(r.stdout.trim()) as {
        tasks: { number: number; done: boolean }[]
      }
      expect(onBranch.tasks.find((t) => t.number === 1)?.done).toBe(true)
      expect(onBranch.tasks.find((t) => t.number === 2)?.done).toBe(false)

      git(temp, "checkout main")
      taskCommit(temp, 173, 2)
      git(temp, "checkout feature")
      r = await runCli(temp, ["tasks", "173"])
      const mainOnly = JSON.parse(r.stdout.trim()) as {
        tasks: { number: number; done: boolean }[]
      }
      expect(mainOnly.tasks.find((t) => t.number === 2)?.done).toBe(false)

      taskCommit(temp, 173, 3)
      r = await runCli(temp, ["tasks", "173"])
      const wrongTrailer = JSON.parse(r.stdout.trim()) as {
        tasks: { number: number; done: boolean }[]
      }
      expect(wrongTrailer.tasks.find((t) => t.number === 1)?.done).toBe(true)
      expect(wrongTrailer.tasks.find((t) => t.number === 2)?.done).toBe(false)
    })
  })

  test("tasks リモートと symref エラー", async () => {
    await withTemp(async (temp) => {
      const designPath = path.join(temp, "docs/issues/173/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, minimalDesign, "utf8")

      git(temp, "init -b main")
      git(temp, "config user.email t@example.com")
      git(temp, "config user.name t")
      let r = await runCli(temp, ["tasks", "173"])
      expect(r.exitCode).toBe(1)
      expect(r.stdout).toBe("")
      expect(r.stderr.trim()).toBe("リモートを特定できません")

      const bare = path.join(temp, "a.git")
      const bare2 = path.join(temp, "b.git")
      git(temp, `init --bare -b main "${bare}"`)
      git(temp, `init --bare -b main "${bare2}"`)
      git(temp, `remote add origin "${bare}"`)
      git(temp, `remote add upstream "${bare2}"`)
      r = await runCli(temp, ["tasks", "173"])
      expect(r.exitCode).toBe(1)
      expect(r.stdout).toBe("")
      expect(r.stderr.trim()).toBe("リモートを特定できません")
    })

    expect(
      parseDefaultBranchFromSymref(
        "ref: refs/heads/main\tHEAD\nabc\tHEAD\n",
      ),
    ).toBe("main")
    expect(parseDefaultBranchFromSymref("abc\tHEAD\n")).toBe(null)

    await withTemp(async (temp) => {
      const designPath = path.join(temp, "docs/issues/173/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, minimalDesign, "utf8")
      git(temp, "init -b main")
      git(temp, "config user.email t@example.com")
      git(temp, "config user.name t")
      const fakeRemote = path.join(temp, "empty.git")
      git(temp, `init --bare "${fakeRemote}"`)
      git(temp, `remote add origin "${fakeRemote}"`)
      const r = await runCli(temp, ["tasks", "173"])
      expect(r.exitCode).toBe(1)
      expect(r.stdout).toBe("")
      expect(r.stderr.trim()).toBe("デフォルトブランチを特定できません")
    })
  })

  test("Sdd-Cur-Task 行の判定", () => {
    const msg = `feat: 課題 173 作業 1\n\nSdd-Cur-Task: 1\n`
    expect(messageHasSddCurTaskTrailer(msg)).toBe(true)
    expect(messageHasSddCurTaskForNumber(msg, 1)).toBe(true)
    expect(messageHasSddCurTaskForNumber(msg, 2)).toBe(false)
    expect(messageHasSddCurTaskTrailer("Sdd-Cur-Task: 01")).toBe(false)
  })

  test("実装スキル本文", async () => {
    const skill = await readFile(
      path.join(root, "skills/sdd-cur-implement/SKILL.md"),
      "utf8",
    )
    for (const phrase of [
      "task-done",
      "`done` が真の作業",
      "`task-done` 以外はコミットしない",
      "`reset`、`checkout`、`rebase` はしない",
      "`task-done` でコミットしない",
      "ブランチの先頭を進めることは禁止しない",
    ]) {
      expect(skill).toContain(phrase)
    }
    expect(skill).not.toContain("スキルはコミットしない。")
    expect(skill.split("\n").some((l) => l === "コミットしない。")).toBe(false)
  })

  test("ランナー HEAD 確認と feat コミット分岐", async () => {
    const procedurePath = "/tmp/sdd-cur-173-procedure.txt"
    await writeFile(procedurePath, "手順", "utf8")
    let headCalls = 0
    let commitMsg = ""
    const taskOnlyComments = createIssueCommentStore()
    const runnerTaskOnly = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 1 })
        },
        async editLabels() {},
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          if (taskOnlyComments.recordStartComment(body)) {
            return { url: "https://start-comment" }
          }
          return { url: "https://c" }
        },
        async listComments() {
          return taskOnlyComments.listComments()
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async mergeFetched() {
          return { status: "merged" as const }
        },
        async headCommit() {
          headCalls += 1
          return headCalls === 1 ? "before" : "after"
        },
        async hasChanges() {
          return false
        },
        async commitAll(msg) {
          commitMsg = msg
        },
        async push() {},
        async commitsAfterExclusive(before, after) {
          return before === after ? [] : [after]
        },
        async commitMessage() {
          return `feat: 課題 173 作業 1\n\nSdd-Cur-Task: 1\n`
        },
        async branchOnlyCommitMessages() {
          return [`feat: 課題 173 作業 1\n\nSdd-Cur-Task: 1\n`]
        },
      },
      agent: { async implement() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })
    await runnerTaskOnly.process({ id: "1" })
    expect(commitMsg).toBe("")
    await rm(procedurePath, { force: true })

    headCalls = 0
    commitMsg = ""
    await writeFile(procedurePath, "手順", "utf8")
    const withChangesComments = createIssueCommentStore()
    const runnerWithChanges = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 1 })
        },
        async editLabels() {},
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          if (withChangesComments.recordStartComment(body)) {
            return { url: "https://start-comment" }
          }
          return { url: "https://c" }
        },
        async listComments() {
          return withChangesComments.listComments()
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async mergeFetched() {
          return { status: "merged" as const }
        },
        async headCommit() {
          return "deadbeef"
        },
        async hasChanges() {
          return true
        },
        async commitAll(msg) {
          commitMsg = msg
        },
        async push() {},
      },
      agent: { async implement() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })
    await runnerWithChanges.process({ id: "1" })
    expect(commitMsg).toBe("feat: 課題 1 を実装する")
    await rm(procedurePath, { force: true })

    let badHeadCalls = 0
    const badHeadComments = createIssueCommentStore()
    await writeFile(procedurePath, "手順", "utf8")
    const runnerBadHead = createRunner({
      github: {
        async viewerLogin() {
          return VIEWER_LOGIN
        },
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 1 })
        },
        async editLabels() {},
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          if (badHeadComments.recordStartComment(body)) {
            return { url: "https://start-comment" }
          }
          return { url: "https://c" }
        },
        async listComments() {
          return badHeadComments.listComments()
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async mergeFetched() {
          return { status: "merged" as const }
        },
        async headCommit() {
          badHeadCalls += 1
          return badHeadCalls === 1 ? "before" : "after"
        },
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
        async commitsAfterExclusive(before, after) {
          return before === after ? [] : [after]
        },
        async commitMessage() {
          return "bad commit without trailer\n"
        },
      },
      agent: { async implement() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })
    await expect(runnerBadHead.process({ id: "1" })).rejects.toThrow(
      "agent がブランチの先頭を変えました",
    )
    await rm(procedurePath, { force: true })
  })

  test("正本への差分の識別子", () => {
    const design = readFileSync(
      path.join(root, "docs/issues/173/design.md"),
      "utf8",
    )
    const sdd = readFileSync(path.join(root, "docs/canonical/sdd.md"), "utf8")
    const implement = readFileSync(
      path.join(root, "docs/canonical/implement.md"),
      "utf8",
    )
    const runner = readFileSync(path.join(root, "docs/canonical/runner.md"), "utf8")
    const gitCanon = readFileSync(path.join(root, "docs/canonical/git.md"), "utf8")

    for (const id of [
      "REQ-923",
      "REQ-924",
      "REQ-930",
      "REQ-925",
      "REQ-926",
      "REQ-927",
    ]) {
      expect(
        sdd.includes(`## ${id}`) ||
          implement.includes(`## ${id}`) ||
          runner.includes(`## ${id}`) ||
          gitCanon.includes(`## ${id}`),
      ).toBe(true)
    }
    for (const id of ["REQ-462", "REQ-463", "REQ-466", "REQ-867", "REQ-870", "REQ-502"]) {
      const file =
        id === "REQ-502"
          ? runner
          : id === "REQ-870" || id === "REQ-925"
            ? implement
            : id === "REQ-927"
              ? gitCanon
              : sdd
      expect(file).toContain(`## ${id}`)
      expect(file).toContain("もとになった課題は #173 である。")
    }
  })
})

