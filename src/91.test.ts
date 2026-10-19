import { describe, expect, test } from "bun:test"
import { access, readFile, stat } from "node:fs/promises"
import { readFileSync } from "node:fs"
import path from "node:path"
import {
  extractFindings,
  invalidConsecutiveFailuresMessage,
  parseReview,
  reviewConfirmMarkers,
  reviewJudgmentMarkers,
  reviewModelFromRound3,
  reviewNext,
  type ReviewNextInput,
  type ReviewNextSuccess,
  type ReviewStage,
} from "./conventions.ts"

const root = path.join(import.meta.dir, "..")
const cliPath = path.join(import.meta.dir, "cli.ts")
const bunExe = process.execPath
const isolatedPath = path.dirname(bunExe)

const invalidStageMessage = "段階の種別が不正です"
const ACTIONS = new Set(["修正", "やり直し", "合格", "止まる"])

function defaultInput(overrides: Partial<ReviewNextInput> = {}): ReviewNextInput {
  return {
    response: "",
    consecutiveFailures: 0,
    previousFindings: "",
    brokenStampRetries: 0,
    ...overrides,
  }
}

function findingsBlock(...items: string[]): string {
  const lines = ["## 指摘", ...items.map((t, i) => `${i + 1}. ${t}`)]
  return lines.join("\n")
}

function requirementsFailBody(
  finding: string,
  confirm: "yes" | "no" | "absent",
  trailing = "",
): string {
  const parts = [findingsBlock(finding), reviewJudgmentMarkers.fail]
  if (confirm === "yes") {
    parts.splice(1, 0, reviewConfirmMarkers.yes)
  } else if (confirm === "no") {
    parts.splice(1, 0, reviewConfirmMarkers.no)
  }
  if (trailing) {
    parts.push(trailing)
  }
  return parts.join("\n")
}

function quickBody(
  lastLine: string,
  finding?: string,
  confirm?: "yes" | "no" | "invalid",
): string {
  const parts: string[] = []
  if (finding !== undefined) {
    parts.push(findingsBlock(finding))
  }
  if (confirm === "yes") {
    parts.push(reviewConfirmMarkers.yes)
  } else if (confirm === "no") {
    parts.push(reviewConfirmMarkers.no)
  } else if (confirm === "invalid") {
    parts.push("確認: 不明")
  }
  parts.push(lastLine)
  return parts.join("\n")
}

function implementFailBody(options: {
  markers?: string[]
  judgment?: "pass" | "fail" | "absent"
}): string {
  const { markers = [], judgment = "fail" } = options
  const parts = [...markers]
  if (judgment === "pass") {
    parts.push(reviewJudgmentMarkers.pass)
  } else if (judgment === "fail") {
    parts.push(findingsBlock("指摘"), reviewJudgmentMarkers.fail)
  }
  return parts.join("\n")
}

function assertSuccessShape(value: ReviewNextSuccess): void {
  expect(ACTIONS.has(value.action)).toBe(true)
  expect(value.kind.length).toBeGreaterThan(0)
  expect(/^[a-z][a-zA-Z0-9]*$/.test(value.kind)).toBe(true)
  const allowed = new Set([
    "consecutiveFailures",
    "previousFindings",
    "brokenStampRetries",
    "action",
    "model",
    "kind",
    "reason",
    "resultLine",
    "rewriteProcedure",
  ])
  for (const key of Object.keys(value)) {
    expect(allowed.has(key)).toBe(true)
  }
}

function expectOk(
  stage: ReviewStage,
  input: ReviewNextInput,
  expected: Partial<ReviewNextSuccess> &
    Partial<Pick<ReviewNextSuccess, "kind" | "action">>,
): ReviewNextSuccess {
  const result = reviewNext(stage, input)
  expect(result.ok).toBe(true)
  if (!result.ok) {
    throw new Error("expected ok")
  }
  const value = result.value
  assertSuccessShape(value)
  for (const [key, val] of Object.entries(expected)) {
    expect(value[key as keyof ReviewNextSuccess]).toEqual(val)
  }
  return value
}

function expectJsonKeyOrder(
  stdout: string,
  keys: string[],
): Record<string, unknown> {
  expect(stdout.endsWith("\n")).toBe(true)
  const line = stdout.slice(0, -1)
  expect(line.split("\n").length).toBe(1)
  let pos = 0
  for (const key of keys) {
    const needle = `"${key}"`
    const idx = line.indexOf(needle, pos)
    expect(idx).toBeGreaterThanOrEqual(0)
    pos = idx + needle.length
  }
  return JSON.parse(line) as Record<string, unknown>
}

function stdinLine(input: ReviewNextInput): string {
  return `${JSON.stringify(input)}\n`
}

async function runReviewNextCli(
  args: string[],
  stdin: string,
  cwd = root,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([bunExe, cliPath, "review-next", ...args], {
    cwd,
    stdin: new Blob([stdin]).stream(),
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, PATH: isolatedPath },
  })
  const exitCode = await proc.exited
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  return { exitCode, stdout, stderr }
}

function policyCliTableRoleCell(policy: string): string {
  for (const line of policy.split("\n")) {
    if (line.startsWith("| `src/cli.ts` |")) {
      const parts = line.split("|")
      return parts[2]?.trim() ?? ""
    }
  }
  throw new Error("policy row missing")
}

function firstCodeFenceAfter(text: string, heading: string): string {
  const idx = text.indexOf(heading)
  expect(idx).toBeGreaterThanOrEqual(0)
  const after = text.slice(idx + heading.length)
  const fenceStart = after.indexOf("```")
  expect(fenceStart).toBeGreaterThanOrEqual(0)
  const rest = after.slice(fenceStart + 3)
  const langEnd = rest.indexOf("\n")
  const bodyStart = langEnd === -1 ? 0 : langEnd + 1
  const fenceEnd = rest.indexOf("```", bodyStart)
  expect(fenceEnd).toBeGreaterThanOrEqual(0)
  return rest.slice(bodyStart, fenceEnd)
}

function sectionBetween(
  text: string,
  startHeading: string,
  endHeading: string,
): string {
  const start = text.indexOf(startHeading)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = text.indexOf(endHeading, start + startHeading.length)
  expect(end).toBeGreaterThan(start)
  return text.slice(start, end)
}

describe("課題 91", () => {
  describe("extractFindings", () => {
    test("## 指摘 の塊", () => {
      const response = [
        "## 指摘",
        "1. 一つ目",
        "2. 二つ目",
        "# 次",
      ].join("\n")
      expect(extractFindings(response)).toBe("一つ目\n二つ目")
    })

    test("1. 指摘。 の次の塊", () => {
      const response = [
        "1. 指摘。",
        "1. alpha",
        "2. beta",
        "2. 直す箇所と",
      ].join("\n")
      expect(extractFindings(response)).toBe("alpha\nbeta")
    })

    test("指摘なし", () => {
      const response = ["## 指摘", "指摘なし", "1. 無視"].join("\n")
      expect(extractFindings(response)).toBe("")
    })

    test("番号付きが無い塊", () => {
      const response = ["## 指摘", "観点", "差分"].join("\n")
      expect(extractFindings(response)).toBe("")
    })

    test("空の応答", () => {
      expect(extractFindings("")).toBe("")
    })

    test("2. パスごとの直す箇所で塊が終わる", () => {
      const response = [
        "1. 指摘。",
        "1. only",
        "2. パスごとの直す箇所",
        "999. 無視",
      ].join("\n")
      expect(extractFindings(response)).toBe("only")
    })
  })

  describe("reviewNext 成功 JSON の形", () => {
    test("reason と resultLine と rewriteProcedure は付ける行だけ", () => {
      const cases: {
        stage: ReviewStage
        input: ReviewNextInput
        optional: ("reason" | "resultLine" | "rewriteProcedure")[]
      }[] = [
        {
          stage: "requirements",
          input: defaultInput({ response: reviewJudgmentMarkers.pass }),
          optional: [],
        },
        {
          stage: "quick",
          input: defaultInput({ response: quickBody("x") }),
          optional: ["resultLine"],
        },
        {
          stage: "implement",
          input: defaultInput({
            response: implementFailBody({}),
            consecutiveFailures: 9,
          }),
          optional: ["reason", "rewriteProcedure"],
        },
        {
          stage: "implement",
          input: defaultInput({
            response: implementFailBody({
              markers: ["実装の指摘なし", "テスト節の実行省略"],
            }),
          }),
          optional: ["rewriteProcedure"],
        },
      ]
      for (const { stage, input, optional } of cases) {
        const result = reviewNext(stage, input)
        expect(result.ok).toBe(true)
        if (!result.ok) continue
        const value = result.value
        const base = [
          "consecutiveFailures",
          "previousFindings",
          "brokenStampRetries",
          "action",
          "model",
          "kind",
        ]
        expect(new Set(Object.keys(value))).toEqual(
          new Set([...base, ...optional]),
        )
        if (!optional.includes("reason")) expect(value.reason).toBeUndefined()
        if (!optional.includes("resultLine")) {
          expect(value.resultLine).toBeUndefined()
        }
        if (!optional.includes("rewriteProcedure")) {
          expect(value.rewriteProcedure).toBeUndefined()
        }
      }
    })

    test("次の呼び出しは直前の成功の三つを渡す", () => {
      const first = reviewNext(
        "requirements",
        defaultInput({ response: requirementsFailBody("a", "no") }),
      )
      expect(first.ok).toBe(true)
      if (!first.ok) return
      const second = reviewNext(
        "requirements",
        defaultInput({
          response: requirementsFailBody("b", "no"),
          consecutiveFailures: first.value.consecutiveFailures,
          previousFindings: first.value.previousFindings,
          brokenStampRetries: first.value.brokenStampRetries,
        }),
      )
      expect(second.ok).toBe(true)
      if (!second.ok) return
      expect(second.value.consecutiveFailures).toBe(2)
      expect(second.value.previousFindings).toBe("b")
    })
  })

  describe("reviewNext requirements", () => {
    test("判定が無く bsr が 0", () => {
      expectOk(
        "requirements",
        defaultInput({ response: "壊れた", brokenStampRetries: 0 }),
        {
          action: "やり直し",
          kind: "retryBrokenStamp",
          consecutiveFailures: 0,
          previousFindings: "",
          brokenStampRetries: 1,
          model: "",
        },
      )
    })

    test("判定が無く bsr が 1 以上", () => {
      expectOk(
        "requirements",
        defaultInput({ response: "壊れた", brokenStampRetries: 1 }),
        {
          action: "止まる",
          kind: "stopBrokenStampTwice",
          consecutiveFailures: 0,
          previousFindings: "",
          brokenStampRetries: 1,
          model: "",
        },
      )
    })

    test("合格", () => {
      const body = `${reviewJudgmentMarkers.pass}\n後ろの行`
      expect(parseReview(body).judgment).toBe("pass")
      expectOk(
        "requirements",
        defaultInput({ response: body, consecutiveFailures: 2 }),
        {
          action: "合格",
          kind: "passReview",
          consecutiveFailures: 2,
          previousFindings: "",
          brokenStampRetries: 0,
          model: "",
        },
      )
    })

    test("不合格で確認あり", () => {
      const body = requirementsFailBody("指摘A", "yes")
      const value = expectOk(
        "requirements",
        defaultInput({ response: body, consecutiveFailures: 1 }),
        {
          action: "止まる",
          kind: "stopWaitConfirm",
          consecutiveFailures: 2,
          model: "",
        },
      )
      expect(value.previousFindings).toBe("指摘A")
      expect(value.reason).toBeUndefined()
      expect(value.resultLine).toBeUndefined()
    })

    test("不合格で確認なし、直前が無い", () => {
      const body = requirementsFailBody("指摘B", "no")
      expectOk(
        "requirements",
        defaultInput({ response: body }),
        {
          action: "修正",
          kind: "fixAfterReview",
          consecutiveFailures: 1,
          previousFindings: "指摘B",
          brokenStampRetries: 0,
          model: "",
        },
      )
    })

    test("不合格で確認なし、直前と同じ", () => {
      const body = requirementsFailBody("同じ", "no")
      expectOk(
        "requirements",
        defaultInput({
          response: body,
          consecutiveFailures: 1,
          previousFindings: "同じ",
        }),
        {
          action: "止まる",
          kind: "stopSameFindingTwice",
          consecutiveFailures: 2,
          previousFindings: "同じ",
          model: "",
        },
      )
    })

    test("不合格で確認なし、直前と違う", () => {
      const body = requirementsFailBody("新しい", "no")
      expectOk(
        "requirements",
        defaultInput({
          response: body,
          consecutiveFailures: 2,
          previousFindings: "古い",
        }),
        {
          action: "修正",
          kind: "fixAfterReview",
          consecutiveFailures: 3,
          previousFindings: "新しい",
          model: reviewModelFromRound3,
        },
      )
    })

    test("不合格で確認行が無い", () => {
      const body = `${findingsBlock("x")}\n${reviewJudgmentMarkers.fail}`
      expectOk(
        "requirements",
        defaultInput({ response: body }),
        {
          action: "止まる",
          kind: "stopMissingConfirmLine",
          consecutiveFailures: 1,
          previousFindings: "x",
          model: "",
        },
      )
    })

    test("同じ action でも kind が分岐で違う", () => {
      const wait = reviewNext(
        "requirements",
        defaultInput({
          response: requirementsFailBody("a", "yes"),
        }),
      )
      const missing = reviewNext(
        "requirements",
        defaultInput({
          response: `${findingsBlock("a")}\n${reviewJudgmentMarkers.fail}`,
        }),
      )
      expect(wait.ok && missing.ok).toBe(true)
      if (!wait.ok || !missing.ok) return
      expect(wait.value.action).toBe("止まる")
      expect(missing.value.action).toBe("止まる")
      expect(wait.value.kind).toBe("stopWaitConfirm")
      expect(missing.value.kind).toBe("stopMissingConfirmLine")
      expect(wait.value.kind).not.toBe(missing.value.kind)
    })
  })

  describe("reviewNext reflect-design", () => {
    test("確認なしは本文の同異に関わらず stopReflectDesignNoFix", () => {
      for (const pf of ["", "同じ", "違う"]) {
        const body = requirementsFailBody(pf || "本文", "no")
        expectOk(
          "reflect-design",
          defaultInput({
            response: body,
            previousFindings: pf === "同じ" ? "同じ" : "別",
          }),
          {
            action: "止まる",
            kind: "stopReflectDesignNoFix",
            consecutiveFailures: 1,
            model: "",
          },
        )
      }
    })

    test("retryBrokenStamp は requirements と同じ", () => {
      const input = defaultInput({ response: "x", brokenStampRetries: 0 })
      const req = reviewNext("requirements", input)
      const ref = reviewNext("reflect-design", input)
      expect(req).toEqual(ref)
    })

    test("stopWaitConfirm は requirements と同じ", () => {
      const input = defaultInput({
        response: requirementsFailBody("a", "yes"),
        consecutiveFailures: 0,
      })
      expect(reviewNext("requirements", input)).toEqual(
        reviewNext("reflect-design", input),
      )
    })
  })

  describe("reviewNext quick", () => {
    test("最後の非空行が判定でない", () => {
      const value = expectOk(
        "quick",
        defaultInput({
          response: quickBody("結果: 保留"),
          brokenStampRetries: 3,
        }),
        {
          action: "止まる",
          kind: "stopQuickUndecidable",
          consecutiveFailures: 0,
          previousFindings: "",
          brokenStampRetries: 3,
          model: "",
          resultLine: "決められない",
        },
      )
      expect(value.rewriteProcedure).toBeUndefined()
    })

    test("不合格で確認あり", () => {
      const value = expectOk(
        "quick",
        defaultInput({
          response: quickBody(reviewJudgmentMarkers.fail, "a", "yes"),
        }),
        {
          action: "止まる",
          kind: "stopQuickConfirmListed",
          consecutiveFailures: 1,
          previousFindings: "a",
          model: "",
          resultLine: "決められない",
        },
      )
      expect(value.brokenStampRetries).toBe(0)
    })

    test("不合格で確認が二択でない", () => {
      expectOk(
        "quick",
        defaultInput({
          response: quickBody(reviewJudgmentMarkers.fail, "a", "invalid"),
        }),
        {
          action: "止まる",
          kind: "stopQuickInvalidConfirm",
          resultLine: "決められない",
          model: "",
        },
      )
    })

    test("不合格で確認なし、直前と同じ", () => {
      expectOk(
        "quick",
        defaultInput({
          response: quickBody(reviewJudgmentMarkers.fail, "同じ", "no"),
          previousFindings: "同じ",
        }),
        {
          action: "止まる",
          kind: "stopSameFindingTwice",
          consecutiveFailures: 1,
          model: "",
        },
      )
    })

    test("不合格で確認なし、直前と違う", () => {
      expectOk(
        "quick",
        defaultInput({
          response: quickBody(reviewJudgmentMarkers.fail, "新", "no"),
          previousFindings: "旧",
          consecutiveFailures: 1,
        }),
        {
          action: "修正",
          kind: "fixAfterReview",
          consecutiveFailures: 2,
          previousFindings: "新",
          model: reviewModelFromRound3,
        },
      )
    })

    test("合格", () => {
      expectOk(
        "quick",
        defaultInput({
          response: quickBody(reviewJudgmentMarkers.pass),
          consecutiveFailures: 4,
          brokenStampRetries: 2,
        }),
        {
          action: "合格",
          kind: "passReview",
          consecutiveFailures: 4,
          previousFindings: "",
          brokenStampRetries: 2,
          model: "",
        },
      )
    })

    test("判定行が無いときのやり直しはしない", () => {
      const result = reviewNext(
        "quick",
        defaultInput({ response: quickBody("メモだけ") }),
      )
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.kind).toBe("stopQuickUndecidable")
      expect(result.value.action).not.toBe("やり直し")
    })
  })

  describe("reviewNext implement", () => {
    test("previousFindings は入力のまま", () => {
      const pf = "保持"
      const value = expectOk(
        "implement",
        defaultInput({
          response: implementFailBody({ markers: ["実装の指摘なし"] }),
          previousFindings: pf,
          consecutiveFailures: 3,
        }),
        {
          action: "やり直し",
          kind: "retryImplementAmbiguousFail",
          previousFindings: pf,
        },
      )
      expect(value.previousFindings).toBe(pf)
    })

    test("実行省略だけ", () => {
      expectOk(
        "implement",
        defaultInput({
          response: implementFailBody({
            markers: ["実装の指摘なし", "実行していない"],
          }),
        }),
        {
          action: "やり直し",
          kind: "retryTestOmissionOnly",
          consecutiveFailures: 0,
          rewriteProcedure: false,
          model: "",
        },
      )
    })

    test("実装の指摘なしだけ", () => {
      expectOk(
        "implement",
        defaultInput({
          response: implementFailBody({ markers: ["実装の指摘なし"] }),
          consecutiveFailures: 5,
        }),
        {
          action: "やり直し",
          kind: "retryImplementAmbiguousFail",
          consecutiveFailures: 5,
          model: reviewModelFromRound3,
        },
      )
    })

    test("手順未網羅", () => {
      expectOk(
        "implement",
        defaultInput({
          response: implementFailBody({
            markers: ["実装の指摘なし", "成否が分からない"],
          }),
        }),
        {
          action: "やり直し",
          kind: "rewriteProcedureThenReview",
          consecutiveFailures: 1,
          rewriteProcedure: true,
          model: "",
        },
      )
    })

    test("指摘がある不合格", () => {
      expectOk(
        "implement",
        defaultInput({ response: implementFailBody({}) }),
        {
          action: "修正",
          kind: "fixAfterReview",
          consecutiveFailures: 1,
          rewriteProcedure: false,
          model: "",
        },
      )
    })

    test("10 回目で止まる", () => {
      const value = expectOk(
        "implement",
        defaultInput({
          response: implementFailBody({}),
          consecutiveFailures: 9,
        }),
        {
          action: "止まる",
          kind: "stopImplementMaxReviews",
          consecutiveFailures: 10,
          reason: "実装レビューが不合格のまま10回に達した",
          rewriteProcedure: false,
          model: "",
        },
      )
      expect(value.resultLine).toBeUndefined()
    })

    test("判定が無い 1 回目と 2 回目", () => {
      expectOk(
        "implement",
        defaultInput({ response: "壊れ", brokenStampRetries: 0 }),
        {
          action: "やり直し",
          kind: "retryBrokenStamp",
          brokenStampRetries: 1,
          rewriteProcedure: false,
        },
      )
      expectOk(
        "implement",
        defaultInput({ response: "壊れ", brokenStampRetries: 1 }),
        {
          action: "止まる",
          kind: "stopImplementNoJudgment",
          reason: "レビューの判定がありません",
          rewriteProcedure: false,
        },
      )
    })

    test("合格に rewriteProcedure は無い", () => {
      const value = expectOk(
        "implement",
        defaultInput({
          response: implementFailBody({ judgment: "pass" }),
        }),
        {
          action: "合格",
          kind: "passReview",
        },
      )
      expect(value.rewriteProcedure).toBeUndefined()
    })

    test("cf 9 で 1 回目が判定無し、2 回目が実行省略だけ", () => {
      const first = reviewNext(
        "implement",
        defaultInput({
          response: "壊れ",
          consecutiveFailures: 9,
          brokenStampRetries: 0,
        }),
      )
      expect(first.ok).toBe(true)
      if (!first.ok) return
      expect(first.value.kind).toBe("retryBrokenStamp")
      expect(first.value.consecutiveFailures).toBe(9)

      const second = reviewNext(
        "implement",
        defaultInput({
          response: implementFailBody({
            markers: ["実装の指摘なし", "テスト節の実行省略"],
          }),
          consecutiveFailures: 9,
          brokenStampRetries: 1,
        }),
      )
      expect(second.ok).toBe(true)
      if (!second.ok) return
      expect(second.value.kind).toBe("retryTestOmissionOnly")
      expect(second.value.consecutiveFailures).toBe(9)
    })

    test("cf 9 で 2 回目が実装の指摘なしだけ", () => {
      const second = reviewNext(
        "implement",
        defaultInput({
          response: implementFailBody({ markers: ["実装の指摘なし"] }),
          consecutiveFailures: 9,
          brokenStampRetries: 1,
        }),
      )
      expect(second.ok).toBe(true)
      if (!second.ok) return
      expect(second.value.kind).toBe("retryImplementAmbiguousFail")
      expect(second.value.consecutiveFailures).toBe(9)
    })

    test("cf 9 で 2 回目が通常不合格", () => {
      expectOk(
        "implement",
        defaultInput({
          response: implementFailBody({}),
          consecutiveFailures: 9,
          brokenStampRetries: 1,
        }),
        {
          kind: "stopImplementMaxReviews",
          consecutiveFailures: 10,
        },
      )
    })

    test("cf 10 以上は reviewNext が拒否", () => {
      for (const cf of [10, 11]) {
        const result = reviewNext(
          "implement",
          defaultInput({
            response: reviewJudgmentMarkers.pass,
            consecutiveFailures: cf,
          }),
        )
        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.message).toBe(invalidConsecutiveFailuresMessage)
      }
    })

    test("implement 以外では cf 10 でも拒否しない", () => {
      const result = reviewNext(
        "requirements",
        defaultInput({
          response: reviewJudgmentMarkers.pass,
          consecutiveFailures: 10,
        }),
      )
      expect(result.ok).toBe(true)
    })
  })

  describe("reviewNext model", () => {
    test("1 と 2 回目は空、3 回目以降は定数", () => {
      for (const [cf, model] of [
        [0, ""],
        [1, ""],
        [2, reviewModelFromRound3],
      ] as const) {
        const value = expectOk(
          "requirements",
          defaultInput({ response: "壊れ", consecutiveFailures: cf }),
          { action: "やり直し", kind: "retryBrokenStamp", model },
        )
        expect(value.model).toBe(model)
      }
      const fix = expectOk(
        "requirements",
        defaultInput({
          response: requirementsFailBody("a", "no"),
          consecutiveFailures: 1,
        }),
        { action: "修正", kind: "fixAfterReview" },
      )
      expect(fix.model).toBe(reviewModelFromRound3)
    })

    test("stopWaitConfirm の model", () => {
      const value = expectOk(
        "requirements",
        defaultInput({
          response: requirementsFailBody("a", "yes"),
          consecutiveFailures: 2,
        }),
        { kind: "stopWaitConfirm", model: reviewModelFromRound3 },
      )
      expect(value.model).toBe(reviewModelFromRound3)
    })

    test("quick の stopQuickConfirmListed は空", () => {
      expectOk(
        "quick",
        defaultInput({
          response: quickBody(reviewJudgmentMarkers.fail, "a", "yes"),
        }),
        { kind: "stopQuickConfirmListed", model: "" },
      )
    })
  })

  describe("review-next CLI", () => {
    const validStdin = defaultInput({
      response: reviewJudgmentMarkers.pass,
    })

    test("四段階が終了コード 0 で JSON 一行", async () => {
      for (const stage of [
        "requirements",
        "reflect-design",
        "quick",
        "implement",
      ] as const) {
        const { exitCode, stdout, stderr } = await runReviewNextCli(
          [stage, "91"],
          stdinLine(validStdin),
        )
        expect(exitCode).toBe(0)
        expect(stderr).toBe("")
        const obj = expectJsonKeyOrder(stdout, [
          "consecutiveFailures",
          "previousFindings",
          "brokenStampRetries",
          "action",
          "model",
          "kind",
        ])
        expect(obj.action).toBe("合格")
      }
    })

    test("段階が不正", async () => {
      for (const args of [["foo", "91"], ["91"]] as const) {
        const { exitCode, stdout, stderr } = await runReviewNextCli(
          args,
          stdinLine(validStdin),
        )
        expect(exitCode).toBe(1)
        expect(stdout).toBe("")
        expect(stderr).toBe(`${invalidStageMessage}\n`)
      }
      const noStage = await runReviewNextCli([], stdinLine(validStdin))
      expect(noStage.exitCode).toBe(1)
      expect(noStage.stderr).toBe(`${invalidStageMessage}\n`)
    })

    test("implement で cf 10 と 11", async () => {
      for (const cf of [10, 11]) {
        for (const response of [
          reviewJudgmentMarkers.pass,
          implementFailBody({ markers: ["テスト節の実行省略"] }),
        ]) {
          const { exitCode, stdout, stderr } = await runReviewNextCli(
            ["implement", "91"],
            stdinLine(
              defaultInput({
                response,
                consecutiveFailures: cf,
              }),
            ),
          )
          expect(exitCode).toBe(1)
          expect(stdout).toBe("")
          expect(stderr).toBe(`${invalidConsecutiveFailuresMessage}\n`)
        }
      }
    })

    test("implement で cf 9 は成功、他段階でも cf 10 は連続不合格エラーにしない", async () => {
      const ok9 = await runReviewNextCli(
        ["implement", "91"],
        stdinLine(
          defaultInput({
            response: reviewJudgmentMarkers.pass,
            consecutiveFailures: 9,
          }),
        ),
      )
      expect(ok9.exitCode).toBe(0)

      const req10 = await runReviewNextCli(
        ["requirements", "91"],
        stdinLine(
          defaultInput({
            response: reviewJudgmentMarkers.pass,
            consecutiveFailures: 10,
          }),
        ),
      )
      expect(req10.exitCode).toBe(0)
      expect(req10.stderr).not.toContain(invalidConsecutiveFailuresMessage)
    })

    test("gh を起動せずファイルも書かない", async () => {
      const marker = path.join(root, "src", "91.test.ts")
      const before = await stat(marker)
      const { exitCode, stdout } = await runReviewNextCli(
        ["requirements", "91"],
        stdinLine(validStdin),
      )
      expect(exitCode).toBe(0)
      expect(stdout.length).toBeGreaterThan(0)
      const after = await stat(marker)
      expect(after.mtimeMs).toBe(before.mtimeMs)
      await expect(access(path.join(root, "gh-log.txt"))).rejects.toThrow()
    })
  })

  describe("スキル契約", () => {
    const commonPhrases = [
      "bun src/cli.ts review-next",
      "`response`、`consecutiveFailures`、`previousFindings`、`brokenStampRetries`",
      "返った一行 JSON の `action`、`model`、`kind` に従う",
      "`reason`、`resultLine`、`rewriteProcedure`",
      "直前の成功の標準出力が返した同じプロパティ",
    ] as const

    test("skills/sdd-cur/SKILL.md", async () => {
      const text = await readFile(path.join(root, "skills/sdd-cur/SKILL.md"), "utf8")
      for (const phrase of commonPhrases) {
        expect(text).toContain(phrase)
      }
      expect(text).toContain("第1引数は `requirements`")
      expect(text).toContain("第1引数は `reflect-design`")

      const removed = [
        "下から",
        "行全体",
        "あと 1 回",
        "合計最大 2 回",
        "印が壊れている",
        "番号付き指摘",
        "2 回連続",
        "直前の不合格レビュー",
      ]
      const req = sectionBetween(text, "## 要件", "## 設計")
      const design = sectionBetween(text, "## 設計", "## 確認")
      for (const phrase of removed) {
        expect(req).not.toContain(phrase)
        expect(design).not.toContain(phrase)
      }

      expect(req).toContain(
        "終了コードが 0 以外のときは `sdd-cur-req-reviewer` を起動しない",
      )
      expect(req).toContain("標準エラーの全文を `sdd-cur-req-fixer` に渡す")
      expect(req).not.toMatch(/validate[\s\S]{0,200}review-next/)
    })

    test("skills/sdd-cur-quick/SKILL.md", async () => {
      const text = await readFile(
        path.join(root, "skills/sdd-cur-quick/SKILL.md"),
        "utf8",
      )
      for (const phrase of commonPhrases) {
        expect(text).toContain(phrase)
      }
      expect(text).toContain("第1引数は `quick`")
      expect(text).not.toContain("grok-4.7[context=256k,reasoning_effort=high,fast=false]")
      expect(text).not.toContain("確認: あり")
      expect(text).toContain("終了コードが 0 以外")
      expect(text).toContain("標準エラーの全文")
    })

    test("skills/sdd-cur-implement/SKILL.md", async () => {
      const text = await readFile(
        path.join(root, "skills/sdd-cur-implement/SKILL.md"),
        "utf8",
      )
      for (const phrase of commonPhrases) {
        expect(text).toContain(phrase)
      }
      expect(text).toContain("第1引数は `implement`")
      const review = sectionBetween(text, "## レビュー", "## 禁止")
      expect(text).not.toMatch(/`\s*validate\s*`|bun src\/cli\.ts validate/)
      for (const phrase of [
        "3回目",
        "grok-4.7[context=256k,reasoning_effort=high,fast=false]",
        "実装レビューが不合格のまま10回に達した",
        "レビューの判定がありません",
        "確認: あり",
        "確認: なし",
        "では分岐しない",
      ]) {
        expect(review).not.toContain(phrase)
      }
    })
  })

  describe("文書列挙", () => {
    test("review-next が列挙にある", () => {
      const policy = readFileSync(path.join(root, "docs/policy.md"), "utf8")
      const agents = readFileSync(path.join(root, "AGENTS.md"), "utf8")
      const readme = readFileSync(path.join(root, "README.md"), "utf8")

      expect(policyCliTableRoleCell(policy)).toContain("review-next")
      expect(firstCodeFenceAfter(agents, "## コマンド")).toContain(
        "review-next",
      )
      const readmeFence = firstCodeFenceAfter(readme, "## 開発中の起動")
      expect(readmeFence).toContain("review-next")
      expect(readme).toContain("| `review-next` |")
    })
  })
})
