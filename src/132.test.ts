import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"
import {
  createGitHub,
  type GhResult,
  type GhRunner,
  type GhRunOptions,
} from "./github.ts"
import {
  ensureWorkflowLabels,
  quickTargetLabel,
  workflowLabels,
} from "./labels.ts"
import { isQuickTarget } from "./sdd.ts"

const root = path.join(import.meta.dir, "..")

type RecordedCall = { args: string[]; options: GhRunOptions }

function okJson(stdout: unknown): GhResult {
  return { stdout: JSON.stringify(stdout), stderr: "", exitCode: 0 }
}

function fail404(): GhResult {
  return { stdout: "", stderr: "gh: Not Found (HTTP 404)\n", exitCode: 1 }
}

describe("課題 132", () => {
  test("quickTargetLabel の名前、説明、色", () => {
    expect(quickTargetLabel).toEqual({
      name: "quick 対象",
      description: "軽微な修正として quick で進める",
      color: "0075CA",
    })
    expect(workflowLabels.some((l) => l.name === quickTargetLabel.name)).toBe(
      false,
    )
  })

  test("ensureWorkflowLabels の戻り値は七件で並びは workflowLabels のあと quick 対象", async () => {
    let getCalls = 0
    const runner: GhRunner = {
      async run(args, options) {
        if (args.includes("--method")) {
          const body = JSON.parse(String(options.stdin)) as { name: string }
          return okJson({ name: body.name })
        }
        getCalls += 1
        if (getCalls === 1) {
          return fail404()
        }
        if (getCalls <= workflowLabels.length) {
          const label = workflowLabels[getCalls - 1]
          return okJson({ name: label.name })
        }
        return okJson({ name: quickTargetLabel.name })
      },
    }
    const github = createGitHub({ gh: runner, repo: "o/r" })
    const results = await ensureWorkflowLabels(github)
    expect(results).toHaveLength(7)
    expect(results.slice(0, 6).map((r) => r.name)).toEqual(
      workflowLabels.map((l) => l.name),
    )
    expect(results[6]).toEqual({
      name: quickTargetLabel.name,
      status: "existing",
    })
  })

  test("七件目だけ無いとき七件目だけ createLabel する", async () => {
    const calls: RecordedCall[] = []
    let getCalls = 0
    const runner: GhRunner = {
      async run(args, options) {
        calls.push({ args, options })
        if (args.includes("--method")) {
          const body = JSON.parse(String(options.stdin)) as { name: string }
          return okJson({ name: body.name })
        }
        getCalls += 1
        if (getCalls <= workflowLabels.length) {
          const label = workflowLabels[getCalls - 1]
          return okJson({ name: label.name })
        }
        return fail404()
      },
    }
    const github = createGitHub({ gh: runner, repo: "o/r" })
    const results = await ensureWorkflowLabels(github)
    expect(results[6]).toEqual({
      name: quickTargetLabel.name,
      status: "created",
    })
    const creates = calls.filter((call) => call.args.includes("--method"))
    expect(creates).toHaveLength(1)
    expect(creates[0]?.options.stdin).toBe(
      JSON.stringify({
        name: quickTargetLabel.name,
        color: quickTargetLabel.color,
        description: quickTargetLabel.description,
      }),
    )
  })

  test("七件目がすでにあるとき createLabel せず existing", async () => {
    const calls: RecordedCall[] = []
    let getCalls = 0
    const runner: GhRunner = {
      async run(args, options) {
        calls.push({ args, options })
        if (args.includes("--method")) {
          const body = JSON.parse(String(options.stdin)) as { name: string }
          return okJson({ name: body.name })
        }
        getCalls += 1
        if (getCalls <= workflowLabels.length) {
          return fail404()
        }
        return okJson({ name: quickTargetLabel.name })
      },
    }
    const github = createGitHub({ gh: runner, repo: "o/r" })
    const results = await ensureWorkflowLabels(github)
    expect(results[6]).toEqual({
      name: quickTargetLabel.name,
      status: "existing",
    })
    const creates = calls.filter((call) => call.args.includes("--method"))
    expect(creates).toHaveLength(6)
    expect(
      creates.every(
        (call) =>
          JSON.parse(String(call.options.stdin)).name !== quickTargetLabel.name,
      ),
    ).toBe(true)
  })

  test("三件目の createLabel が拒否されたとき四件目以降の getLabel も七件目も見ない", async () => {
    const calls: RecordedCall[] = []
    let getCalls = 0
    let createCalls = 0
    const runner: GhRunner = {
      async run(args, options) {
        calls.push({ args, options })
        if (args.includes("--method")) {
          createCalls += 1
          if (createCalls === 3) {
            return { stdout: "", stderr: "create failed", exitCode: 1 }
          }
          const body = JSON.parse(String(options.stdin)) as { name: string }
          return okJson({ name: body.name })
        }
        getCalls += 1
        return fail404()
      },
    }
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(ensureWorkflowLabels(github)).rejects.toThrow("create failed")
    expect(getCalls).toBe(3)
    expect(createCalls).toBe(3)
    expect(calls.length).toBe(6)
  })

  test("isQuickTarget は quickTargetLabel.name のラベルだけで true", () => {
    expect(
      isQuickTarget({
        body: `本文に ${quickTargetLabel.name} を含む`,
        labels: [],
      }),
    ).toBe(false)
    expect(
      isQuickTarget({ body: "", labels: [quickTargetLabel.name] }),
    ).toBe(true)
    expect(isQuickTarget({ body: "", labels: [] })).toBe(false)
    expect(isQuickTarget({ body: "quick対象", labels: [] })).toBe(false)
    expect(isQuickTarget({ body: "Quick 対象", labels: [] })).toBe(false)
  })

  test("README の labels 行と src/sdd.ts の import", async () => {
    const readme = await readFile(path.join(root, "README.md"), "utf8")
    expect(readme).not.toContain(
      "| `labels` | 作業ツリーのリポジトリに、六つの業務ラベルと `quick 対象` ラベルを、無いものだけ作る |",
    )

    const sddSource = await readFile(path.join(root, "src/sdd.ts"), "utf8")
    expect(sddSource).not.toContain("quick 対象")
    expect(sddSource).toContain('from "./labels.ts"')
    expect(sddSource).toContain("quickTargetLabel")
  })
})
