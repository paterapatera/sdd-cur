import { describe, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { commentMarkers } from "./conventions.ts"
import type { Issue } from "./github.ts"
import { workflowLabels } from "./labels.ts"
import {
  acceptanceComment,
  createRunner,
  selectImplementationIssue,
} from "./runner.ts"

const implementSkillPath = path.join(
  import.meta.dir,
  "../skills/sdd-cur-implement/SKILL.md",
)
const cliPath = path.join(import.meta.dir, "cli.ts")
const bunExe = process.execPath

const LABEL_REQUEST = workflowLabels[0].name
const LABEL_IN_PROGRESS = workflowLabels[1].name
const LABEL_DONE = workflowLabels[2].name

function issue(partial: Partial<Issue> & Pick<Issue, "number">): Issue {
  return {
    title: "題",
    body: "",
    state: "open",
    labels: [LABEL_REQUEST],
    url: "https://github.com/o/r/issues/1",
    ...partial,
  }
}

describe("selectImplementationIssue", () => {
  test("実装中と実装依頼なしと両方を除き number 昇順", () => {
    const issues = [
      issue({ number: 10 }),
      issue({ number: 2 }),
      issue({ number: 3, labels: [LABEL_IN_PROGRESS] }),
      issue({ number: 4, labels: [] }),
      issue({ number: 5, labels: [LABEL_REQUEST, LABEL_IN_PROGRESS] }),
    ]
    const before = issues.map((i) => ({ ...i, labels: [...i.labels] }))
    const selected = selectImplementationIssue(issues)
    expect(issues).toEqual(before)
    expect(selected?.number).toBe(2)
  })
})

describe("acceptanceComment", () => {
  test("空と印を拒否し成功時は印と payload", () => {
    expect(() => acceptanceComment("   ")).toThrow("受け入れ手順が空です")
    expect(() => acceptanceComment("sdd-cur: 確認\nx")).toThrow(
      "受け入れ手順に印を含めない",
    )
    const body = acceptanceComment(" 手順  ")
    expect(body.startsWith(`${commentMarkers.acceptance}\n`)).toBe(true)
    expect(body.endsWith(" 手順  ")).toBe(true)
  })
})

describe("createRunner", () => {
  test("poll は listIssues を実装依頼で呼び候補が無いとき null", async () => {
    let calls = 0
    const runner = createRunner({
      github: {
        async listIssues(query) {
          calls += 1
          expect(query).toEqual({ labels: [LABEL_REQUEST], limit: 100 })
          return []
        },
        async getIssue() {
          throw new Error("unexpected")
        },
        async editLabels() {},
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment() {
          return { url: "https://c" }
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
      },
      agent: {
        async implement() {},
      },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await expect(runner.poll()).resolves.toBeNull()
    expect(calls).toBe(1)
  })

  test("poll は listIssues が一度拒否し二度目に返す", async () => {
    let calls = 0
    const runner = createRunner({
      github: {
        async listIssues() {
          calls += 1
          if (calls === 1) {
            throw new Error("temporary")
          }
          return [issue({ number: 1 })]
        },
        async getIssue() {
          throw new Error("unexpected")
        },
        async editLabels() {},
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment() {
          return { url: "https://c" }
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
      },
      agent: { async implement() {} },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await expect(runner.poll()).resolves.toEqual({ id: "1" })
    expect(calls).toBe(2)
  })

  test("process はラベルが違うとき editLabels を呼ばない", async () => {
    let editCalled = false
    const runner = createRunner({
      github: {
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 1, labels: [LABEL_IN_PROGRESS] })
        },
        async editLabels() {
          editCalled = true
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment() {
          return { url: "https://c" }
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
      },
      agent: { async implement() {} },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })
    await runner.process({ id: "1" })
    expect(editCalled).toBe(false)
  })

  test("通過した process の呼び出し順", async () => {
    const log: string[] = []
    const procedurePath = "/tmp/procedure.txt"
    await writeFile(procedurePath, "手順本文", "utf8")

    const runner = createRunner({
      github: {
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 1, title: "題", url: "https://issue/1" })
        },
        async editLabels(_n, change) {
          if (change.add?.includes(LABEL_IN_PROGRESS)) {
            log.push("editLabels:start")
          } else {
            log.push("editLabels:done")
          }
        },
        async getDefaultBranch() {
          log.push("getDefaultBranch")
          return "main"
        },
        async createBranch(name, from) {
          log.push(`createBranch:${name}:${from}`)
        },
        async createPullRequest(input) {
          log.push(`createPullRequest:${input.body}`)
          expect(input.body).toBe("https://issue/1")
          expect(input.body).not.toContain("Fixes")
          expect(input.body).not.toContain("Closes")
          return { number: 1, url: "https://pr" }
        },
        async addComment(_n, body) {
          log.push(`addComment:${body.split("\n")[0]}`)
          return { url: "https://c" }
        },
      },
      git: {
        async remoteName() {
          log.push("remoteName")
          return "origin"
        },
        async fetch(remote, branch) {
          log.push(`fetch:${remote}:${branch}`)
        },
        async checkoutFetched() {
          log.push("checkoutFetched")
        },
        async hasChanges() {
          log.push("hasChanges")
          return true
        },
        async commitAll() {
          log.push("commitAll")
        },
        async push() {
          log.push("push")
        },
      },
      agent: {
        async implement() {
          log.push("implement")
        },
      },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await runner.process({ id: "1" })
    expect(log).toEqual([
      "editLabels:start",
      "getDefaultBranch",
      "createBranch:sdd-cur/1:main",
      "remoteName",
      "fetch:origin:sdd-cur/1",
      "checkoutFetched",
      "implement",
      "hasChanges",
      "commitAll",
      "push",
      "createPullRequest:https://issue/1",
      `addComment:${commentMarkers.acceptance}`,
      "editLabels:done",
    ])
    await rm(procedurePath, { force: true })
  })

  test("implement が一度拒否し二度目に成功", async () => {
    let implementCalls = 0
    const procedurePath = "/tmp/procedure-retry.txt"
    await writeFile(procedurePath, "手順", "utf8")

    const runner = createRunner({
      github: {
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
        async addComment() {
          return { url: "https://c" }
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
      },
      agent: {
        async implement() {
          implementCalls += 1
          if (implementCalls === 1) {
            throw new Error("agent fail")
          }
        },
      },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await runner.process({ id: "1" })
    expect(implementCalls).toBe(2)
    await rm(procedurePath, { force: true })
  })

  test("implement が二度拒否したとき後続を呼ばない", async () => {
    let commitCalled = false
    const runner = createRunner({
      github: {
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
        async addComment() {
          return { url: "https://c" }
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async hasChanges() {
          return true
        },
        async commitAll() {
          commitCalled = true
        },
        async push() {},
      },
      agent: {
        async implement() {
          throw new Error("agent fail")
        },
      },
      createProcedureFile: async () => ({
        path: "/tmp/p",
        async remove() {},
      }),
    })

    await expect(runner.process({ id: "1" })).rejects.toThrow("agent fail")
    expect(commitCalled).toBe(false)
  })

  test("変更が無いとき 実装の変更がありません", async () => {
    let prCalled = false
    const procedurePath = "/tmp/procedure-empty.txt"
    await writeFile(procedurePath, "手順", "utf8")

    const runner = createRunner({
      github: {
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
          prCalled = true
          return { number: 1, url: "https://pr" }
        },
        async addComment() {
          return { url: "https://c" }
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async hasChanges() {
          return false
        },
        async commitAll() {},
        async push() {},
      },
      agent: { async implement() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await expect(runner.process({ id: "1" })).rejects.toThrow(
      "実装の変更がありません",
    )
    expect(prCalled).toBe(false)
    await rm(procedurePath, { force: true })
  })

  test("createBranch が一度拒否し二度目に成功", async () => {
    let branchCalls = 0
    const procedurePath = "/tmp/procedure-branch.txt"
    await writeFile(procedurePath, "手順", "utf8")

    const runner = createRunner({
      github: {
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
        async createBranch() {
          branchCalls += 1
          if (branchCalls === 1) {
            throw new Error("branch fail")
          }
        },
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment() {
          return { url: "https://c" }
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
      },
      agent: { async implement() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await runner.process({ id: "1" })
    expect(branchCalls).toBe(2)
    await rm(procedurePath, { force: true })
  })

  test("addComment 成功後 editLabels が二度拒否", async () => {
    let addCalls = 0
    let doneEditCalls = 0
    const procedurePath = "/tmp/procedure-labels.txt"
    await writeFile(procedurePath, "手順", "utf8")

    const runner = createRunner({
      github: {
        async listIssues() {
          return []
        },
        async getIssue() {
          return issue({ number: 1 })
        },
        async editLabels(_n, change) {
          if (change.add?.includes(LABEL_DONE)) {
            doneEditCalls += 1
            throw new Error("label fail")
          }
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment() {
          addCalls += 1
          return { url: "https://c" }
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async hasChanges() {
          return true
        },
        async commitAll() {},
        async push() {},
      },
      agent: { async implement() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    await expect(runner.process({ id: "1" })).rejects.toThrow("label fail")
    expect(addCalls).toBe(1)
    expect(doneEditCalls).toBe(2)
    await rm(procedurePath, { force: true })
  })

  test("二つの poll で実装中になった課題を除く", async () => {
    const procedurePath = path.join(
      await mkdtemp(path.join(os.tmpdir(), "sdd-runner-proc-")),
      "procedure.txt",
    )
    await writeFile(procedurePath, "手順", "utf8")

    const store = new Map<number, string[]>()
    store.set(1, [LABEL_REQUEST])
    store.set(2, [LABEL_REQUEST])

    const runner = createRunner({
      github: {
        async listIssues() {
          return [
            issue({ number: 1, labels: store.get(1) ?? [] }),
            issue({ number: 2, labels: store.get(2) ?? [] }),
          ]
        },
        async getIssue(n) {
          return issue({ number: n, labels: store.get(n) ?? [] })
        },
        async editLabels(n, change) {
          const labels = store.get(n) ?? []
          let next = labels.filter((l) => !change.remove?.includes(l))
          if (change.add) {
            next = [...next, ...change.add]
          }
          store.set(n, next)
        },
        async getDefaultBranch() {
          return "main"
        },
        async createBranch() {},
        async createPullRequest() {
          return { number: 1, url: "https://pr" }
        },
        async addComment() {
          return { url: "https://c" }
        },
      },
      git: {
        async remoteName() {
          return "origin"
        },
        async fetch() {},
        async checkoutFetched() {},
        async hasChanges() {
          return false
        },
        async commitAll() {},
        async push() {},
      },
      agent: { async implement() {} },
      createProcedureFile: async () => ({
        path: procedurePath,
        async remove() {},
      }),
    })

    const first = await runner.poll()
    expect(first?.id).toBe("1")
    await expect(runner.process(first!)).rejects.toThrow(
      "実装の変更がありません",
    )

    const second = await runner.poll()
    expect(second?.id).toBe("2")
    await rm(path.dirname(procedurePath), { recursive: true, force: true })
  })
})

describe("skills/sdd-cur-implement/SKILL.md", () => {
  test("フロントマターと本文", async () => {
    const text = await readFile(implementSkillPath, "utf8")
    expect(text.startsWith(`---
name: sdd-cur-implement
description: クローンの作業ツリーで、指定された課題の要件と設計を実装し、受け入れ手順の本文を指定パスへ書く。課題ランナーが agent から起動する。
disable-model-invocation: true
---
`)).toBe(true)
    for (const phrase of [
      "## 実装",
      "## 禁止",
      "docs/specs",
      "課題を作らない",
      "課題を閉じない",
      "ラベルを変えない",
      "コミットしない",
      "push しない",
      "マージリクエストを作らない",
      "スカッシュマージしない",
      "コメントを投稿しない",
      "`gh` を直接起動しない",
    ]) {
      expect(text).toContain(phrase)
    }
  })

  test("install が sdd-cur-implement をコピーする", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-runner-install-"))
    try {
      const proc = Bun.spawn(["bun", cliPath, "install", temp], {
        stdout: "pipe",
        stderr: "pipe",
      })
      expect(await proc.exited).toBe(0)
      const installed = await readFile(
        path.join(temp, ".cursor", "skills", "sdd-cur-implement", "SKILL.md"),
        "utf8",
      )
      const source = await readFile(implementSkillPath, "utf8")
      expect(installed).toBe(source)
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})
