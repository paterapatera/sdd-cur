import { describe, expect, spyOn, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { cmdGate, type GateCmdDeps } from "./cli.ts"
import { evaluateGate, parseGateStage, type GateStage } from "./gate.ts"
import { workflowLabels } from "./labels.ts"
import { implementationBranch } from "./runner.ts"
import { issue } from "./sdd-test-support.ts"
import {
  assertSpecWorkAllowed,
  buildIssueView,
  postConfirmation,
  type IssueView,
} from "./sdd.ts"

const ISSUE = 166
const BRANCH = implementationBranch(ISSUE)
const WORKFLOW_LABEL = workflowLabels[0].name
const bunExe = process.execPath
const cliPath = path.join(import.meta.dir, "cli.ts")

function sectionView(overrides: {
  issue?: Partial<IssueView["issue"]>
  unanswered?: IssueView["unanswered"]
  nextAnswer?: IssueView["nextAnswer"]
  specs?: IssueView["specs"]
}): IssueView {
  return {
    issue: {
      number: ISSUE,
      title: "題",
      body: "",
      state: "open",
      labels: [],
      url: `https://example.com/${ISSUE}`,
      ...overrides.issue,
    },
    comments: [],
    unanswered: overrides.unanswered ?? [],
    nextAnswer: overrides.nextAnswer ?? null,
    specs: overrides.specs ?? { requirements: "missing", design: "missing" },
  }
}

const readySpecs = { requirements: "ready" as const, design: "ready" as const }

type GateCase = {
  ac: number
  stage: GateStage
  view: IssueView
  branch?: string
  expect: { allowed: true } | { allowed: false; reason: string }
}

const evaluateCases: GateCase[] = [
  {
    ac: 11,
    stage: "explore",
    view: sectionView({}),
    expect: { allowed: true },
  },
  {
    ac: 12,
    stage: "explore",
    view: sectionView({ issue: { state: "closed" } }),
    expect: { allowed: false, reason: "課題は閉じている" },
  },
  {
    ac: 13,
    stage: "explore",
    view: sectionView({ issue: { labels: [WORKFLOW_LABEL] } }),
    expect: { allowed: false, reason: "実装のラベルが付いている" },
  },
  {
    ac: 14,
    stage: "requirements",
    view: sectionView({ specs: { requirements: "missing", design: "missing" } }),
    expect: { allowed: true },
  },
  {
    ac: 15,
    stage: "requirements",
    view: sectionView({
      issue: { state: "closed" },
      specs: { requirements: "ready", design: "missing" },
    }),
    expect: { allowed: false, reason: "課題は閉じている" },
  },
  {
    ac: 16,
    stage: "requirements",
    view: sectionView({
      issue: { labels: [WORKFLOW_LABEL] },
      specs: { requirements: "ready", design: "missing" },
    }),
    expect: { allowed: false, reason: "実装のラベルが付いている" },
  },
  {
    ac: 17,
    stage: "requirements",
    view: sectionView({
      specs: { requirements: "invalid", design: "missing" },
    }),
    expect: { allowed: false, reason: "要件の見出しが不正である" },
  },
  {
    ac: 18,
    stage: "design",
    view: sectionView({ specs: { requirements: "ready", design: "missing" } }),
    branch: BRANCH,
    expect: { allowed: true },
  },
  {
    ac: 20,
    stage: "design",
    view: sectionView({
      unanswered: [{ id: "c1", payload: "Q" }],
      specs: readySpecs,
    }),
    branch: BRANCH,
    expect: {
      allowed: false,
      reason: "未回答の確認があるため、設計には進まない",
    },
  },
  {
    ac: 21,
    stage: "design",
    view: sectionView({
      nextAnswer: { id: "a1", payload: "A" },
      specs: readySpecs,
    }),
    branch: BRANCH,
    expect: {
      allowed: false,
      reason: "まだ要求へ反映していない回答があるため、設計には進まない",
    },
  },
  {
    ac: 22,
    stage: "design",
    view: sectionView({
      unanswered: [{ id: "c1", payload: "Q" }],
      nextAnswer: { id: "a1", payload: "A" },
      specs: readySpecs,
    }),
    branch: BRANCH,
    expect: {
      allowed: false,
      reason: "未回答の確認があるため、設計には進まない",
    },
  },
  {
    ac: 23,
    stage: "design",
    view: sectionView({
      specs: { requirements: "missing", design: "missing" },
    }),
    branch: BRANCH,
    expect: { allowed: false, reason: "要件が無い" },
  },
  {
    ac: 24,
    stage: "design",
    view: sectionView({
      specs: { requirements: "invalid", design: "missing" },
    }),
    branch: BRANCH,
    expect: { allowed: false, reason: "要件の見出しが不正である" },
  },
  {
    ac: 25,
    stage: "design",
    view: sectionView({
      specs: { requirements: "ready", design: "invalid" },
    }),
    branch: BRANCH,
    expect: { allowed: false, reason: "設計の見出しが不正である" },
  },
  {
    ac: 26,
    stage: "design",
    view: sectionView({ specs: { requirements: "ready", design: "ready" } }),
    branch: "main",
    expect: { allowed: false, reason: "作業ブランチではない" },
  },
  {
    ac: 27,
    stage: "design",
    view: sectionView({
      issue: { state: "closed" },
      specs: readySpecs,
    }),
    branch: BRANCH,
    expect: { allowed: false, reason: "課題は閉じている" },
  },
  {
    ac: 28,
    stage: "design",
    view: sectionView({
      issue: { labels: [WORKFLOW_LABEL] },
      specs: readySpecs,
    }),
    branch: BRANCH,
    expect: { allowed: false, reason: "実装のラベルが付いている" },
  },
  {
    ac: 29,
    stage: "confirm",
    view: sectionView({}),
    expect: { allowed: true },
  },
  {
    ac: 30,
    stage: "confirm",
    view: sectionView({ unanswered: [{ id: "c1", payload: "Q" }] }),
    expect: {
      allowed: false,
      reason: "未回答の確認があるため、次の確認は投稿しない",
    },
  },
  {
    ac: 31,
    stage: "confirm",
    view: sectionView({
      nextAnswer: { id: "a1", payload: "A" },
    }),
    expect: {
      allowed: false,
      reason: "まだ反映していない回答があるため、次の確認は投稿しない",
    },
  },
  {
    ac: 32,
    stage: "confirm",
    view: sectionView({
      unanswered: [{ id: "c1", payload: "Q" }],
      nextAnswer: { id: "a1", payload: "A" },
    }),
    expect: {
      allowed: false,
      reason: "未回答の確認があるため、次の確認は投稿しない",
    },
  },
  {
    ac: 33,
    stage: "reflect",
    view: sectionView({ nextAnswer: null }),
    expect: { allowed: false, reason: "未反映の回答は無い" },
  },
  {
    ac: 34,
    stage: "reflect",
    view: sectionView({
      nextAnswer: { id: "a1", payload: "A" },
    }),
    expect: { allowed: true },
  },
  {
    ac: 35,
    stage: "design",
    view: sectionView({
      issue: { state: "closed", labels: [WORKFLOW_LABEL] },
      specs: readySpecs,
    }),
    branch: BRANCH,
    expect: { allowed: false, reason: "課題は閉じている" },
  },
  {
    ac: 48,
    stage: "request",
    view: sectionView({ specs: readySpecs }),
    branch: BRANCH,
    expect: { allowed: true },
  },
  {
    ac: 49,
    stage: "request",
    view: sectionView({
      issue: { state: "closed" },
      specs: readySpecs,
    }),
    branch: BRANCH,
    expect: { allowed: false, reason: "課題は閉じている" },
  },
  {
    ac: 52,
    stage: "request",
    view: sectionView({
      issue: { labels: [WORKFLOW_LABEL] },
      specs: readySpecs,
    }),
    branch: BRANCH,
    expect: { allowed: false, reason: "実装のラベルが付いている" },
  },
  {
    ac: 53,
    stage: "request",
    view: sectionView({
      unanswered: [{ id: "c1", payload: "Q" }],
      specs: readySpecs,
    }),
    branch: BRANCH,
    expect: {
      allowed: false,
      reason: "未回答の確認があるため、設計には進まない",
    },
  },
  {
    ac: 54,
    stage: "request",
    view: sectionView({
      nextAnswer: { id: "a1", payload: "A" },
      specs: readySpecs,
    }),
    branch: BRANCH,
    expect: {
      allowed: false,
      reason: "まだ要求へ反映していない回答があるため、設計には進まない",
    },
  },
  {
    ac: 55,
    stage: "request",
    view: sectionView({
      unanswered: [{ id: "c1", payload: "Q" }],
      nextAnswer: { id: "a1", payload: "A" },
      specs: readySpecs,
    }),
    branch: BRANCH,
    expect: {
      allowed: false,
      reason: "未回答の確認があるため、設計には進まない",
    },
  },
  {
    ac: 56,
    stage: "request",
    view: sectionView({
      specs: { requirements: "missing", design: "missing" },
    }),
    branch: BRANCH,
    expect: { allowed: false, reason: "要件が無い" },
  },
  {
    ac: 57,
    stage: "request",
    view: sectionView({
      specs: { requirements: "invalid", design: "missing" },
    }),
    branch: BRANCH,
    expect: { allowed: false, reason: "要件の見出しが不正である" },
  },
  {
    ac: 58,
    stage: "request",
    view: sectionView({
      specs: { requirements: "ready", design: "invalid" },
    }),
    branch: BRANCH,
    expect: { allowed: false, reason: "設計の見出しが不正である" },
  },
  {
    ac: 59,
    stage: "request",
    view: sectionView({ specs: readySpecs }),
    branch: "main",
    expect: { allowed: false, reason: "作業ブランチではない" },
  },
  {
    ac: 60,
    stage: "request",
    view: sectionView({
      specs: { requirements: "ready", design: "missing" },
    }),
    branch: BRANCH,
    expect: { allowed: false, reason: "設計が無い" },
  },
]

describe("166 evaluateGate", () => {
  for (const { ac, stage, view, branch, expect: expected } of evaluateCases) {
    test(`[${ac}] ${stage}`, () => {
      const result = evaluateGate(stage, view, branch ?? BRANCH, ISSUE)
      expect(result).toEqual(expected)
    })
  }
})

describe("166 parseGateStage", () => {
  test("[10] 段が不正です", () => {
    expect(() => parseGateStage("bogus")).toThrow("段が不正です")
  })
})

type CmdCapture = { code: number; stdout: string; stderr: string }

async function runGateCmd(
  args: string[],
  deps: GateCmdDeps,
): Promise<CmdCapture> {
  const logs: string[] = []
  const errors: string[] = []
  const logSpy = spyOn(console, "log").mockImplementation((msg: string) => {
    logs.push(msg)
  })
  const errSpy = spyOn(console, "error").mockImplementation((msg: string) => {
    errors.push(msg)
  })
  try {
    const code = await cmdGate(args, deps)
    return {
      code,
      stdout: logs.join("\n"),
      stderr: errors.join("\n"),
    }
  } finally {
    logSpy.mockRestore()
    errSpy.mockRestore()
  }
}

function makeGateDeps(
  view: IssueView,
  options: { branch?: string; loadError?: string } = {},
) {
  const sideEffects = {
    addComment: 0,
    editLabels: 0,
    wroteFile: false,
  }
  const calls = {
    readSpecPair: 0,
    loadIssueView: 0,
    openGitHub: 0,
    currentBranch: 0,
  }

  const deps: GateCmdDeps = {
    readSpecPair: async () => {
      calls.readSpecPair += 1
      return {
        requirements: { exists: true, markdown: "" },
        design: { exists: true, markdown: "" },
      }
    },
    assertSpecFilesReflected: () => {},
    loadIssueView: async () => {
      calls.loadIssueView += 1
      if (options.loadError) {
        throw new Error(options.loadError)
      }
      return view
    },
    openGitHub: async () => {
      calls.openGitHub += 1
      return {
        async getIssue() {
          return issue({ number: ISSUE })
        },
        async listComments() {
          return []
        },
        async addComment() {
          sideEffects.addComment += 1
          return { url: "https://example.com/c" }
        },
        async editLabels() {
          sideEffects.editLabels += 1
        },
        async closeIssue() {},
      }
    },
    currentBranch: async () => {
      calls.currentBranch += 1
      return options.branch ?? BRANCH
    },
  }

  return { deps, calls, sideEffects }
}

describe("166 cmdGate", () => {
  test("[5][10] 引数と段と番号の拒否", async () => {
    const { deps } = makeGateDeps(sectionView({}))
    for (const args of [
      [],
      ["166"],
      ["166", "explore", "extra"],
      ["166", "bogus"],
    ]) {
      const { code, stdout, stderr } = await runGateCmd(args, deps)
      expect(code).toBe(1)
      expect(stdout).toBe("")
      expect(stderr).toBe("段が不正です")
      expect(stderr).not.toContain("allowed")
    }
    const badNumber = await runGateCmd(["foo", "explore"], deps)
    expect(badNumber.code).toBe(1)
    expect(badNumber.stdout).toBe("")
    expect(badNumber.stderr).toBe("番号が不正です")
    expect(badNumber.stderr).not.toContain("allowed")
  })

  test("[4] loadIssueView が拒否したとき", async () => {
    const { deps } = makeGateDeps(sectionView({}), {
      loadError: "課題が見つかりません",
    })
    const { code, stdout, stderr } = await runGateCmd(
      [String(ISSUE), "explore"],
      deps,
    )
    expect(code).toBe(1)
    expect(stderr).toBe("課題が見つかりません")
    expect(stdout).not.toContain("allowed")
  })

  test("[1][2][3] 成功時の JSON 一行", async () => {
    const { deps } = makeGateDeps(sectionView({}))
    const allowed = await runGateCmd([String(ISSUE), "explore"], deps)
    expect(allowed.code).toBe(0)
    expect(allowed.stderr).toBe("")
    expect(allowed.stdout).toBe('{"allowed":true}')

    const denied = await runGateCmd([String(ISSUE), "design"], deps)
    expect(denied.code).toBe(0)
    const line = denied.stdout
    expect(line.startsWith('{"allowed":false,"reason":')).toBe(true)
    expect(line.endsWith("}")).toBe(true)
    const parsed = JSON.parse(line) as Record<string, unknown>
    expect(Object.keys(parsed).sort()).toEqual(["allowed", "reason"])
    expect(parsed.allowed).toBe(false)
    expect(typeof parsed.reason).toBe("string")
  })

  test("[6][7][8] 副作用なし", async () => {
    const { deps, sideEffects } = makeGateDeps(sectionView({}))
    await runGateCmd([String(ISSUE), "explore"], deps)
    expect(sideEffects.addComment).toBe(0)
    expect(sideEffects.editLabels).toBe(0)
    expect(sideEffects.wroteFile).toBe(false)
  })

  test("[19] 作業ブランチ名は implementationBranch と一致", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "branch", String(ISSUE)], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: path.dirname(bunExe) },
    })
    expect(await proc.exited).toBe(0)
    const branchOut = (await new Response(proc.stdout).text()).trimEnd()
    expect(branchOut).toBe(BRANCH)
    expect(BRANCH).toBe(`task-${ISSUE}`)

    const { deps } = makeGateDeps(
      sectionView({ specs: { requirements: "ready", design: "ready" } }),
      { branch: branchOut },
    )
    const { code, stdout } = await runGateCmd(
      [String(ISSUE), "design"],
      deps,
    )
    expect(code).toBe(0)
    expect(stdout).toBe('{"allowed":true}')
  })
})

describe("166 confirm と reflect はゲートのあと課題状態を拒否", () => {
  test("[47] confirm", async () => {
    const gateView = sectionView({ issue: { state: "closed" } })
    expect(evaluateGate("confirm", gateView, BRANCH, ISSUE)).toEqual({
      allowed: true,
    })
    const github = {
      async getIssue() {
        return issue({ number: ISSUE, state: "closed" })
      },
      async listComments() {
        return []
      },
      async addComment() {
        return { url: "https://example.com/c" }
      },
    }
    await expect(
      postConfirmation(github, ISSUE, "本文", { requirements: "", design: "" }),
    ).rejects.toThrow("課題は閉じています")

    const labeled = sectionView({ issue: { labels: [WORKFLOW_LABEL] } })
    expect(evaluateGate("confirm", labeled, BRANCH, ISSUE)).toEqual({
      allowed: true,
    })
    await expect(
      postConfirmation(
        {
          async getIssue() {
            return issue({ number: ISSUE, labels: [WORKFLOW_LABEL] })
          },
          async listComments() {
            return []
          },
          async addComment() {
            return { url: "https://example.com/c" }
          },
        },
        ISSUE,
        "本文",
        { requirements: "", design: "" },
      ),
    ).rejects.toThrow("実装のラベルが付いています")
  })

  test("[47] reflect", () => {
    const gateView = sectionView({
      issue: { state: "closed" },
      nextAnswer: { id: "a1", payload: "A" },
    })
    expect(evaluateGate("reflect", gateView, BRANCH, ISSUE)).toEqual({
      allowed: true,
    })
    expect(() =>
      assertSpecWorkAllowed(issue({ number: ISSUE, state: "closed" })),
    ).toThrow("課題は閉じています")

    const labeled = sectionView({
      nextAnswer: { id: "a1", payload: "A" },
      issue: { labels: [WORKFLOW_LABEL] },
    })
    expect(evaluateGate("reflect", labeled, BRANCH, ISSUE)).toEqual({
      allowed: true,
    })
    expect(() =>
      assertSpecWorkAllowed(issue({ number: ISSUE, labels: [WORKFLOW_LABEL] })),
    ).toThrow("実装のラベルが付いています")
  })
})

describe("166 show の JSON 形", () => {
  test("[44] buildIssueView の形は変わらない", () => {
    const view = buildIssueView({
      issue: issue({ number: ISSUE }),
      comments: [],
      requirements: { exists: false, markdown: "" },
      design: { exists: false, markdown: "" },
    })
    expect(JSON.parse(JSON.stringify(view))).toEqual(view)
    expect(view).toHaveProperty("issue")
    expect(view).toHaveProperty("comments")
    expect(view).toHaveProperty("unanswered")
    expect(view).toHaveProperty("nextAnswer")
    expect(view).toHaveProperty("specs")
  })
})

describe("166 正本", () => {
  test("[45][46] docs/canonical", async () => {
    const sdd = await readFile(
      path.join(import.meta.dir, "../docs/canonical/sdd.md"),
      "utf8",
    )
    const docs = await readFile(
      path.join(import.meta.dir, "../docs/canonical/docs.md"),
      "utf8",
    )
    expect(sdd).toContain("sdd-cur gate")
    expect(sdd).toContain("sdd-cur gate <番号> explore")
    expect(sdd).toContain("sdd-cur gate <番号> requirements")
    expect(sdd).toContain("sdd-cur gate <番号> confirm")
    expect(sdd).toContain("sdd-cur gate <番号> reflect")
    expect(sdd).toContain("sdd-cur gate <番号> request")
    expect(docs).toMatch(/`show`、`gate`、`branch`/)
  })
})
