import { describe, expect, test } from "bun:test"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  commentMarkers,
  reflectedCloseLine,
  reflectedOpenLine,
} from "./conventions.ts"
import { subagentFileNames } from "./install.ts"
import type { Issue, IssueComment } from "./github.ts"
import {
  applyIncorporatedAnswer,
  assertSpecWorkAllowed,
  buildIssueView,
  candidateViews,
  confirmationBody,
  listStartCandidates,
  loadIssueView,
  nextUnincorporatedAnswer,
  postConfirmation,
  readSpecFile,
  specHeading,
  specStatus,
  writeSpecFile,
} from "./sdd.ts"

const skillPath = path.join(import.meta.dir, "../skills/sdd-cur/SKILL.md")
const cliPath = path.join(import.meta.dir, "cli.ts")

function issue(partial: Partial<Issue> & Pick<Issue, "number">): Issue {
  return {
    title: "題",
    body: "",
    state: "open",
    labels: [],
    assignees: [],
    url: "https://example.com/1",
    ...partial,
  }
}

function comment(
  partial: Partial<IssueComment> & Pick<IssueComment, "id" | "body">,
): IssueComment {
  return {
    author: "u",
    createdAt: "2020-01-01T00:00:00Z",
    ...partial,
  }
}

describe("candidateViews", () => {
  test("業務ラベルと閉じた課題を除き number 昇順", () => {
    const issues = [
      issue({ number: 10, state: "open" }),
      issue({ number: 2, state: "open" }),
      issue({ number: 3, state: "closed" }),
      issue({ number: 4, state: "open", labels: ["実装依頼"] }),
      issue({ number: 5, state: "open", labels: ["misc"] }),
    ]
    const before = [...issues]
    const views = candidateViews(issues)
    expect(issues).toEqual(before)
    expect(views.map((v) => v.number)).toEqual([2, 5, 10])
  })
})

describe("listStartCandidates", () => {
  test("listIssues を一回だけ呼ぶ", async () => {
    let calls = 0
    const github = {
      async listIssues(query?: { state?: string; limit?: number }) {
        calls += 1
        expect(query).toEqual({ state: "open", limit: 100 })
        return []
      },
    }
    await listStartCandidates(github)
    expect(calls).toBe(1)
  })
})

describe("specStatus", () => {
  test("無いときと空行だけは missing", () => {
    expect(specStatus(false, "", 5)).toBe("missing")
    expect(specStatus(true, "\n\n", 5)).toBe("missing")
  })

  test("見出しが違うとき invalid、正しいとき ready", () => {
    expect(specStatus(true, "# 4 x", 5)).toBe("invalid")
    expect(specStatus(true, "# 5 題", 5)).toBe("ready")
  })
})

describe("buildIssueView", () => {
  test("コメント順と nextAnswer", () => {
    const comments = [
      comment({
        id: "b",
        body: `${commentMarkers.answer}\nA2`,
        createdAt: "2020-01-02T00:00:00Z",
      }),
      comment({
        id: "c",
        body: `${commentMarkers.confirm}\nQ`,
        createdAt: "2020-01-03T00:00:00Z",
      }),
      comment({
        id: "a",
        body: `${commentMarkers.answer}\norphan`,
        createdAt: "2020-01-01T00:00:00Z",
      }),
    ]
    const view = buildIssueView({
      issue: issue({ number: 5 }),
      comments,
      requirements: { exists: false, markdown: "" },
      design: { exists: false, markdown: "" },
    })
    expect(view.comments.map((c) => c.id)).toEqual(["a", "b", "c"])
    expect(view.comments.every((c) => !("author" in c && c.author !== undefined))).toBe(
      true,
    )
    expect(view.unanswered[0].payload).toBe("Q")
    expect(view.nextAnswer).toBeNull()
  })

  test("反映済みが二つある要件は拒否する", () => {
    const bad = `${reflectedOpenLine}\n-->\n${reflectedOpenLine}\n${reflectedCloseLine}\n`
    expect(() =>
      buildIssueView({
        issue: issue({ number: 5 }),
        comments: [],
        requirements: { exists: true, markdown: bad },
        design: { exists: false, markdown: "" },
      }),
    ).toThrow("反映済みの記録が複数あります")
  })
})

describe("loadIssueView", () => {
  test("不正な番号では getIssue を呼ばない", async () => {
    let getCalls = 0
    await expect(
      loadIssueView(
        {
          async getIssue() {
            getCalls += 1
            return issue({ number: 1 })
          },
          async listComments() {
            return []
          },
        },
        0,
        {
          requirements: { exists: false, markdown: "" },
          design: { exists: false, markdown: "" },
        },
      ),
    ).rejects.toThrow("番号が不正です")
    expect(getCalls).toBe(0)
  })

  test("getIssue が拒否したとき listComments を呼ばない", async () => {
    let listCalls = 0
    await expect(
      loadIssueView(
        {
          async getIssue() {
            throw new Error("失敗")
          },
          async listComments() {
            listCalls += 1
            return []
          },
        },
        5,
        {
          requirements: { exists: false, markdown: "" },
          design: { exists: false, markdown: "" },
        },
      ),
    ).rejects.toThrow("失敗")
    expect(listCalls).toBe(0)
  })
})

describe("nextUnincorporatedAnswer", () => {
  test("古い未反映を返す", () => {
    const comments = [
      comment({
        id: "c1",
        body: `${commentMarkers.confirm}\nQ1`,
        createdAt: "2020-01-01T00:00:00Z",
      }),
      comment({
        id: "a1",
        body: `${commentMarkers.answer}\nR1`,
        createdAt: "2020-01-02T00:00:00Z",
      }),
      comment({
        id: "c2",
        body: `${commentMarkers.confirm}\nQ2`,
        createdAt: "2020-01-03T00:00:00Z",
      }),
      comment({
        id: "a2",
        body: `${commentMarkers.answer}\nR2`,
        createdAt: "2020-01-04T00:00:00Z",
      }),
    ]
    const first = nextUnincorporatedAnswer(comments, {
      requirements: "",
      design: "",
    })
    expect(first?.id).toBe("a1")
    const second = nextUnincorporatedAnswer(comments, {
      requirements: "",
      design: `<!-- sdd-cur:reflected\na1\n-->\n`,
    })
    expect(second?.id).toBe("a2")
  })
})

describe("specHeading", () => {
  test("正しい見出しと題の拒否", () => {
    expect(specHeading(5, "題")).toBe("# 5 題")
    expect(() => specHeading(5, "  ")).toThrow("題が不正です")
    expect(() => specHeading(5, "a\nb")).toThrow("題が不正です")
  })
})

describe("confirmationBody", () => {
  test("空と印を拒否し payload の空白は残す", () => {
    expect(() => confirmationBody("")).toThrow("確認の本文が空です")
    expect(() => confirmationBody(`${commentMarkers.confirm}\n`)).toThrow(
      "確認の本文に印を含めない",
    )
    const body = confirmationBody(" 本文  ")
    expect(body.startsWith(`${commentMarkers.confirm}\n`)).toBe(true)
    expect(body.endsWith(" 本文  ")).toBe(true)
  })
})

describe("assertSpecWorkAllowed", () => {
  test("閉じた課題を先に拒否する", () => {
    expect(() =>
      assertSpecWorkAllowed(
        issue({ number: 1, state: "closed", labels: ["実装依頼"] }),
      ),
    ).toThrow("課題は閉じています")
    expect(() =>
      assertSpecWorkAllowed(issue({ number: 1, labels: ["実装依頼"] })),
    ).toThrow("実装のラベルが付いています")
  })
})

describe("postConfirmation", () => {
  const specs = { requirements: "", design: "" }

  test("未反映と未回答で addComment を呼ばない", async () => {
    let addCalls = 0
    const github = {
      async getIssue() {
        return issue({ number: 5 })
      },
      async listComments() {
        return [
          comment({
            id: "c1",
            body: `${commentMarkers.confirm}\nQ`,
            createdAt: "2020-01-01T00:00:00Z",
          }),
        ]
      },
      async addComment() {
        addCalls += 1
        return { url: "https://example.com/c" }
      },
    }
    await expect(
      postConfirmation(github, 5, "本文", specs),
    ).rejects.toThrow("未回答の確認があります")
    expect(addCalls).toBe(0)
  })

  test("反映済み id があるときは投稿できる", async () => {
    let body = ""
    const github = {
      async getIssue() {
        return issue({ number: 5 })
      },
      async listComments() {
        return [
          comment({
            id: "c1",
            body: `${commentMarkers.confirm}\nQ`,
            createdAt: "2020-01-01T00:00:00Z",
          }),
          comment({
            id: "a1",
            body: `${commentMarkers.answer}\nR`,
            createdAt: "2020-01-02T00:00:00Z",
          }),
        ]
      },
      async addComment(_n: number, text: string) {
        body = text
        return { url: "https://example.com/c" }
      },
    }
    const reflected = `<!-- sdd-cur:reflected\na1\n-->\n`
    const result = await postConfirmation(github, 5, "本文", {
      requirements: reflected,
      design: "",
    })
    expect(result.url).toBe("https://example.com/c")
    expect(body.startsWith(`${commentMarkers.confirm}\n`)).toBe(true)
  })
})

describe("applyIncorporatedAnswer", () => {
  test("設計で要件が無いとき拒否する", () => {
    expect(() =>
      applyIncorporatedAnswer({
        issueNumber: 5,
        kind: "design",
        requirements: { exists: false, markdown: "" },
        design: { exists: false, markdown: "" },
        comments: [],
        edited: "# 5 設計",
      }),
    ).toThrow("要件がありません")
  })

  test("反映済みブロックの後ろに本文がある edited は拒否する", () => {
    const edited = `# 5 題\n本文\n${reflectedOpenLine}\nid\n${reflectedCloseLine}\n後`
    expect(() =>
      applyIncorporatedAnswer({
        issueNumber: 5,
        kind: "requirements",
        requirements: { exists: true, markdown: "# 5 題\n" },
        design: { exists: false, markdown: "" },
        comments: [
          comment({
            id: "c",
            body: `${commentMarkers.confirm}\nQ`,
            createdAt: "1",
          }),
          comment({
            id: "a",
            body: `${commentMarkers.answer}\nR`,
            createdAt: "2",
          }),
        ],
        edited,
      }),
    ).toThrow("反映済みの記録を解釈できません")
  })

  test("ディスクに無く edited にだけある決定は成功する", () => {
    const comments = [
      comment({
        id: "c",
        body: `${commentMarkers.confirm}\nQ`,
        createdAt: "1",
      }),
      comment({
        id: "a-old",
        body: `${commentMarkers.answer}\nR1`,
        createdAt: "2",
      }),
      comment({
        id: "c2",
        body: `${commentMarkers.confirm}\nQ2`,
        createdAt: "3",
      }),
      comment({
        id: "a-new",
        body: `${commentMarkers.answer}\nR2`,
        createdAt: "4",
      }),
    ]
    const result = applyIncorporatedAnswer({
      issueNumber: 5,
      kind: "requirements",
      requirements: { exists: true, markdown: "# 5 題\n" },
      design: { exists: false, markdown: "" },
      comments,
      edited: "# 5 題\n決定\n",
    })
    expect(result.answerId).toBe("a-old")
    expect(result.requirements).toContain("a-old")
    expect(result.requirements).not.toContain("a-new")
  })
})

describe("readSpecFile", () => {
  test("無いパスとディレクトリ", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-read-"))
    try {
      const missing = await readSpecFile(path.join(temp, "none.md"))
      expect(missing).toEqual({ exists: false, markdown: "" })
      await mkdir(path.join(temp, "dir"))
      await expect(readSpecFile(path.join(temp, "dir"))).rejects.toThrow(
        "仕様を読めません",
      )
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("writeSpecFile はそのまま書く", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-write-"))
    try {
      const file = path.join(temp, "a", "b.md")
      await writeSpecFile(file, "x")
      expect(await readFile(file, "utf8")).toBe("x")
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})

describe("skills/sdd-cur/SKILL.md", () => {
  test("フロントマターと必須の文言", async () => {
    const text = await readFile(skillPath, "utf8")
    expect(text.startsWith(`---
name: sdd-cur
description: このプロジェクトの課題について、着手候補の提示、要件、設計、確認コメントの投稿、未反映の回答の取り込みを行う。着手、要件、設計、確認、回答の取り込みを依頼されたときに使う。課題の作成とクローズ、ラベルの変更、実装、受け入れ手順、完了処理はしない。
---
`)).toBe(true)
    expect(text).not.toContain("disable-model-invocation")
    const required = [
      "## 着手",
      "## 要件",
      "## 設計",
      "## 確認",
      "## 回答",
      "## 禁止",
      "bun src/cli.ts",
      "docs/plan.md",
      "docs/conventions.md",
      "決めるのは人",
      "着手できる課題は無い",
      "課題は作らない",
      "課題は閉じない",
      "ラベルは変えない",
      "実装依頼は人が付ける",
      "push は人が行う",
      "実装は課題ランナーが行う",
      "受け入れ手順は投稿しない",
      "完了処理は行わない",
      "gh は直接起動しない",
      "人がその本文を承認したあとだけ",
      "課題は閉じている",
      "実装のラベルが付いている",
      "ファイルを変えず",
      "人が直したときは、直した文字列を改めて見せ",
      "未回答の確認があるあいだ、次の確認は投稿しない",
      "未反映の回答があるとき、人が取り込み先を決めるまでファイルは変えない",
      "reflect が成功するまでディスク上のファイルは変えない",
      "反映済みブロックより前",
      "既存の正しい見出しは変えない",
      "本文には id を書かない",
      "sdd-cur-req-author",
      "sdd-cur-req-reviewer",
      "sdd-cur-req-fixer",
      "model は渡さない",
      "判定: 合格",
      "判定: 不合格",
      "確認: あり",
      "確認: なし",
      "指摘はどこにも置かない",
      "判定が合格なら設計に進むことができる",
      "人が答えるまで",
      "3回目",
      "grok-4.7[reasoning_effort=high,fast=false]",
      "全文は書かない",
      "sdd-cur-design-author",
      "sdd-cur-design-reviewer",
      "sdd-cur-design-fixer",
      "判定が合格なら実装依頼に進むことができる",
      "作業ブランチを用意する",
      "implementationBranch",
      "bun src/cli.ts branch",
      "要求作成役を起動する前に",
      "設計作成役を起動する前に",
      "実装のランナーは、この用意をしない",
      "デフォルトブランチには書かない",
      "同じ作業ブランチ",
      "デフォルトブランチから作業ブランチを作り直さない",
      "要求と設計を含む作業ブランチ",
      "Cursor の質問機能",
      "[スコア ",
      "課題のコメントで確認する",
      "スコアは拘束力を持たない",
      "reflect では取り込まない",
      "E1",
      "E2",
      "E3",
      "課題整合",
      "計画整合",
      "仕様の明確さ",
      "範囲の狭さ",
      "あとでお客さま確認が要る度合い",
      "自然で明確",
      "どちらともいえない",
      "兄弟課題が混ざる",
      "unanswered",
      "nextAnswer",
      "設計には進まない",
      "質問もしない",
      "決められない点は、一つである",
      "決定を二つ以上書かない",
      "スコアを書かない",
      "まとめた確認は、投稿しない",
      "一点ずつ",
    ]
    for (const phrase of required) {
      expect(text).toContain(phrase)
    }
    for (const name of [
      "sdd-cur-req-fix-proposer",
      "sdd-cur-design-fix-proposer",
    ]) {
      expect(text).not.toContain(name)
    }
    expect(text).not.toContain("createGitHub")
    expect(text).not.toContain("src/sdd.ts")
    expect(text).not.toContain(reflectedOpenLine)
  })

  test("install で SKILL.md とサブエージェントがコピーされる", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-install-skill-"))
    const agentsDir = path.join(import.meta.dir, "../agents")
    try {
      const proc = Bun.spawn(["bun", cliPath, "install", temp], {
        stdout: "pipe",
        stderr: "pipe",
      })
      expect(await proc.exited).toBe(0)
      const copied = await readFile(
        path.join(temp, ".cursor", "skills", "sdd-cur", "SKILL.md"),
        "utf8",
      )
      const source = await readFile(skillPath, "utf8")
      expect(copied).toBe(source)
      for (const name of subagentFileNames) {
        const copiedAgent = await readFile(
          path.join(temp, ".cursor", "agents", name),
          "utf8",
        )
        const agentSource = await readFile(path.join(agentsDir, name), "utf8")
        expect(copiedAgent).toBe(agentSource)
      }
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})
