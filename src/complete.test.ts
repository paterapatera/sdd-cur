import { describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  completeIssue,
  completionCallerFileName,
  parseCompletionCaller,
  readCompletionCaller,
  selectCompletionIssue,
} from "./complete.ts"
import {
  createGitHub,
  type GhResult,
  type GhRunner,
  type GhRunOptions,
  type Issue,
} from "./github.ts"
import { workflowLabels } from "./labels.ts"

type RecordedCall = { args: string[]; options: GhRunOptions }

function recordingRunner(
  handler: (call: RecordedCall, index: number) => GhResult,
): { runner: GhRunner; calls: RecordedCall[] } {
  const calls: RecordedCall[] = []
  const runner: GhRunner = {
    async run(args, options) {
      const call = { args, options }
      calls.push(call)
      return handler(call, calls.length - 1)
    },
  }
  return { runner, calls }
}

function okJson(stdout: unknown): GhResult {
  return { stdout: JSON.stringify(stdout), stderr: "", exitCode: 0 }
}

const completeSkillPath = path.join(
  import.meta.dir,
  "../skills/sdd-cur-complete/SKILL.md",
)
const cliPath = path.join(import.meta.dir, "cli.ts")
const bunExe = process.execPath

const LABEL_VERIFIED = workflowLabels[3].name
const LABEL_MERGED = workflowLabels[4].name
const VIEWER_LOGIN = "octocat"

function issue(partial: Partial<Issue> & Pick<Issue, "number">): Issue {
  return {
    title: "t",
    body: "",
    state: "open",
    labels: [],
    assignees: [VIEWER_LOGIN],
    url: "https://example.com/i",
    ...partial,
  }
}

describe("parseCompletionCaller", () => {
  test("runner と skill を返す", () => {
    expect(parseCompletionCaller("runner")).toBe("runner")
    expect(parseCompletionCaller("skill")).toBe("skill")
    expect(parseCompletionCaller("  runner  ")).toBe("runner")
  })

  test("空や並べた文字列は拒否する", () => {
    expect(() => parseCompletionCaller("")).toThrow("完了の呼び出し元が不正です")
    expect(() => parseCompletionCaller("runner\nskill")).toThrow(
      "完了の呼び出し元が不正です",
    )
    expect(() => parseCompletionCaller("runner skill")).toThrow(
      "完了の呼び出し元が不正です",
    )
  })
})

describe("readCompletionCaller", () => {
  test("ファイルが無いとき null", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-complete-caller-"))
    try {
      expect(await readCompletionCaller(temp)).toBe(null)
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("runner と skill のファイル", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-complete-caller-"))
    try {
      await writeFile(path.join(temp, completionCallerFileName), "runner\n")
      expect(await readCompletionCaller(temp)).toBe("runner")
      await writeFile(path.join(temp, completionCallerFileName), "skill")
      expect(await readCompletionCaller(temp)).toBe("skill")
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("不正な中身とディレクトリは拒否する", async () => {
    const invalid = await mkdtemp(path.join(os.tmpdir(), "sdd-complete-caller-"))
    const asDir = await mkdtemp(path.join(os.tmpdir(), "sdd-complete-caller-"))
    try {
      await writeFile(path.join(invalid, completionCallerFileName), "both")
      await expect(readCompletionCaller(invalid)).rejects.toThrow(
        "完了の呼び出し元が不正です",
      )
      await mkdir(path.join(asDir, completionCallerFileName))
      await expect(readCompletionCaller(asDir)).rejects.toThrow(
        "完了の呼び出し元が不正です",
      )
    } finally {
      await rm(invalid, { recursive: true, force: true })
      await rm(asDir, { recursive: true, force: true })
    }
  })
})

describe("selectCompletionIssue", () => {
  test("動作確認OK があり番号昇順の先頭", () => {
    const issues = [
      issue({ number: 10, labels: [LABEL_VERIFIED] }),
      issue({ number: 2, labels: [LABEL_VERIFIED] }),
      issue({ number: 3, labels: ["実装依頼"] }),
    ]
    const copy = [...issues]
    expect(selectCompletionIssue(copy, VIEWER_LOGIN)?.number).toBe(2)
    expect(copy).toEqual(issues)
  })

  test("マージ済みがあっても除かない", () => {
    const selected = selectCompletionIssue(
      [issue({ number: 1, labels: [LABEL_VERIFIED, LABEL_MERGED] })],
      VIEWER_LOGIN,
    )
    expect(selected?.number).toBe(1)
  })

  test("assignees に login が無い課題を除く", () => {
    const issues = [
      issue({ number: 10, labels: [LABEL_VERIFIED], assignees: ["other"] }),
      issue({ number: 2, labels: [LABEL_VERIFIED] }),
    ]
    expect(selectCompletionIssue(issues, VIEWER_LOGIN)?.number).toBe(2)
  })
})

describe("completeIssue", () => {
  test("不正な番号は GitHub を呼ばない", async () => {
    let called = false
    await expect(
      completeIssue(
        {
          async getIssue() {
            called = true
            return issue({ number: 1 })
          },
          async listPullRequests() {
            return []
          },
          async squashMerge() {},
          async editLabels() {},
        },
        0,
      ),
    ).rejects.toThrow("番号が不正です")
    expect(called).toBe(false)
  })

  test("動作確認OK が無いとき", async () => {
    let listed = false
    await expect(
      completeIssue(
        {
          async getIssue() {
            return issue({ number: 1, labels: [] })
          },
          async listPullRequests() {
            listed = true
            return []
          },
          async squashMerge() {},
          async editLabels() {},
        },
        1,
      ),
    ).rejects.toThrow("動作確認OKがありません")
    expect(listed).toBe(false)
  })

  test("マージ済みのみのときは何もしない", async () => {
    let listed = false
    await completeIssue(
      {
        async getIssue() {
          return issue({ number: 1, labels: [LABEL_MERGED] })
        },
        async listPullRequests() {
          listed = true
          return []
        },
        async squashMerge() {},
        async editLabels() {},
      },
      1,
    )
    expect(listed).toBe(false)
  })

  test("マージリクエスト件数", async () => {
    const head = "task-1"
    let squashCalled = false
    await expect(
      completeIssue(
        {
          async getIssue() {
            return issue({ number: 1, labels: [LABEL_VERIFIED] })
          },
          async listPullRequests(query) {
            expect(query.head).toBe(head)
            return []
          },
          async squashMerge() {
            squashCalled = true
          },
          async editLabels() {},
        },
        1,
      ),
    ).rejects.toThrow("マージリクエストがありません")
    expect(squashCalled).toBe(false)

    await expect(
      completeIssue(
        {
          async getIssue() {
            return issue({ number: 1, labels: [LABEL_VERIFIED] })
          },
          async listPullRequests() {
            return [
              {
                number: 1,
                url: "https://pr/1",
                state: "open",
                merged: false,
              },
              {
                number: 2,
                url: "https://pr/2",
                state: "open",
                merged: false,
              },
            ]
          },
          async squashMerge() {
            squashCalled = true
          },
          async editLabels() {},
        },
        1,
      ),
    ).rejects.toThrow("マージリクエストを特定できません")
    expect(squashCalled).toBe(false)
  })

  test("merged false のとき squashMerge のあと editLabels を一回", async () => {
    const calls: string[] = []
    await completeIssue(
      {
        async getIssue() {
          return issue({ number: 7, labels: [LABEL_VERIFIED] })
        },
        async listPullRequests() {
          return [
            {
              number: 9,
              url: "https://pr/9",
              state: "open",
              merged: false,
            },
          ]
        },
        async squashMerge(n) {
          calls.push(`squash:${n}`)
        },
        async editLabels(n, change) {
          calls.push(`labels:${n}:${change.remove?.join(",")}:${change.add?.join(",")}`)
        },
      },
      7,
    )
    expect(calls).toEqual([
      "squash:9",
      `labels:7:${LABEL_VERIFIED}:${LABEL_MERGED}`,
    ])
  })

  test("merged true のとき squashMerge を呼ばない", async () => {
    const calls: string[] = []
    await completeIssue(
      {
        async getIssue() {
          return issue({ number: 7, labels: [LABEL_VERIFIED] })
        },
        async listPullRequests() {
          return [
            {
              number: 9,
              url: "https://pr/9",
              state: "merged",
              merged: true,
            },
          ]
        },
        async squashMerge() {
          calls.push("squash")
        },
        async editLabels(n, change) {
          calls.push(`labels:${n}`)
        },
      },
      7,
    )
    expect(calls).toEqual(["labels:7"])
  })

  test("squashMerge の再試行", async () => {
    let squashAttempts = 0
    let editCalled = false
    await completeIssue(
      {
        async getIssue() {
          return issue({ number: 1, labels: [LABEL_VERIFIED] })
        },
        async listPullRequests() {
          return [
            {
              number: 1,
              url: "https://pr/1",
              state: "open",
              merged: false,
            },
          ]
        },
        async squashMerge() {
          squashAttempts += 1
          if (squashAttempts === 1) {
            throw new Error("一時的な失敗")
          }
        },
        async editLabels() {
          editCalled = true
        },
      },
      1,
    )
    expect(squashAttempts).toBe(2)
    expect(editCalled).toBe(true)
  })

  test("editLabels が二度拒否したとき squashMerge は一回", async () => {
    let squashAttempts = 0
    let editAttempts = 0
    await expect(
      completeIssue(
        {
          async getIssue() {
            return issue({ number: 1, labels: [LABEL_VERIFIED] })
          },
          async listPullRequests() {
            return [
              {
                number: 1,
                url: "https://pr/1",
                state: "open",
                merged: false,
              },
            ]
          },
          async squashMerge() {
            squashAttempts += 1
          },
          async editLabels() {
            editAttempts += 1
            throw new Error("ラベル失敗")
          },
        },
        1,
      ),
    ).rejects.toThrow("ラベル失敗")
    expect(squashAttempts).toBe(1)
    expect(editAttempts).toBe(2)
  })

  test("completeIssue の依存に deleteBranch は無い", () => {
    type Deps = Parameters<typeof completeIssue>[0]
    const keys: (keyof Deps)[] = [
      "editLabels",
      "getIssue",
      "listPullRequests",
      "squashMerge",
    ]
    expect(keys.sort()).toEqual([
      "editLabels",
      "getIssue",
      "listPullRequests",
      "squashMerge",
    ])
    expect(keys).not.toContain("deleteBranch" as keyof Deps)
  })

  test("merged false で squashMerge が一回 issue close は呼ばない", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "issue" && call.args[1] === "view") {
        return okJson({
          number: 7,
          title: "t",
          body: "",
          state: "OPEN",
          labels: [{ name: LABEL_VERIFIED }],
          assignees: [],
          url: "https://github.com/o/r/issues/7",
        })
      }
      if (call.args[0] === "pr" && call.args[1] === "list") {
        return okJson([
          {
            number: 9,
            url: "https://github.com/o/r/pull/9",
            state: "OPEN",
            mergedAt: null,
          },
        ])
      }
      if (call.args[0] === "pr" && call.args[1] === "merge") {
        return okJson({})
      }
      if (call.args[0] === "pr" && call.args[1] === "view") {
        return okJson({
          number: 9,
          url: "https://github.com/o/r/pull/9",
          state: "MERGED",
          mergedAt: "2026-01-01",
        })
      }
      if (call.args[0] === "issue" && call.args[1] === "edit") {
        return okJson({})
      }
      return okJson({})
    })
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await completeIssue(github, 7)
    const mergeCalls = calls.filter(
      (c) => c.args[0] === "pr" && c.args[1] === "merge",
    )
    expect(mergeCalls.length).toBe(1)
    expect(mergeCalls[0]?.args).toContain("--delete-branch")
    for (const call of calls) {
      expect(call.args).not.toContain("close")
      if (call.args[0] === "issue" && call.args[1] === "edit") {
        expect(call.args).not.toContain("--state")
      }
    }
  })
})

describe("skills/sdd-cur-complete/SKILL.md", () => {
  test("フロントマターと禁止", async () => {
    const text = await readFile(completeSkillPath, "utf8")
    expect(text.startsWith(`---
name: sdd-cur-complete
description: Project A の Cursor で、人が指定した課題の完了処理を行う。
---
`)).toBe(true)
    expect(text).not.toContain("disable-model-invocation")
    for (const phrase of [
      "# sdd-cur-complete",
      "## 完了",
      "## 禁止",
      "bun src/cli.ts complete",
      "課題を作らない",
      "課題を閉じない",
      "ラベルを変えない",
      "スカッシュマージしない",
      "コメントを投稿しない",
      "`gh` を直接起動しない",
      "`sdd-cur.completion` を作らない",
    ]) {
      expect(text).toContain(phrase)
    }
  })

  test("install が sdd-cur-complete をコピーする", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-complete-install-"))
    try {
      const proc = Bun.spawn(["bun", cliPath, "install", temp], {
        stdout: "pipe",
        stderr: "pipe",
      })
      expect(await proc.exited).toBe(0)
      const installed = await readFile(
        path.join(temp, ".cursor", "skills", "sdd-cur-complete", "SKILL.md"),
        "utf8",
      )
      const source = await readFile(completeSkillPath, "utf8")
      expect(installed).toBe(source)
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})
