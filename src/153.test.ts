import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { specPaths } from "./conventions.ts"
import { createGit, type GitResult, type GitRunner } from "./git.ts"
import type { Issue } from "./github.ts"
import { workflowLabels } from "./labels.ts"
import { implementationBranch } from "./runner.ts"
import {
  changedPathsOnlySpecFiles,
  requestImplementation,
} from "./request.ts"

const root = join(import.meta.dir, "..")
const designPath = join(root, "docs/issues/153/design.md")
const gitCanonicalPath = join(root, "docs/canonical/git.md")

const ISSUE = 153
const BRANCH = implementationBranch(ISSUE)
const SPEC = specPaths(ISSUE)
const READY_REQ = `# ${ISSUE} 題\n`
const READY_DES = `# ${ISSUE} 題\n`

const LABEL_REQUEST = workflowLabels[0].name

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

function ok(stdout = ""): GitResult {
  return { stdout, stderr: "", exitCode: 0 }
}

function issue(partial: Partial<Issue> & Pick<Issue, "number">): Issue {
  return {
    title: "t",
    body: "",
    state: "open",
    labels: [],
    assignees: [],
    url: "https://example.com/i",
    ...partial,
  }
}

type RequestCalls = {
  hasChanges: number
  statusPorcelain: number
  commitPaths: { message: string; paths: readonly [string, string] }[]
  openGitHub: number
  readSpecs: number[]
  push: { remote: string; branch: string }[]
  editLabels: {
    number: number
    change: { add?: string[]; remove?: string[] }
  }[]
}

function makeRequestDeps(options: {
  hasChanges?: boolean | boolean[]
  porcelain?: string
  issue?: Issue
  requirements?: { exists: boolean; markdown: string }
  design?: { exists: boolean; markdown: string }
}) {
  const hasChangesQueue =
    options.hasChanges === undefined
      ? [false]
      : Array.isArray(options.hasChanges)
        ? options.hasChanges
        : [options.hasChanges]

  const calls: RequestCalls = {
    hasChanges: 0,
    statusPorcelain: 0,
    commitPaths: [],
    openGitHub: 0,
    readSpecs: [],
    push: [],
    editLabels: [],
  }

  const deps = {
    git: {
      async currentBranch() {
        return BRANCH
      },
      async hasChanges() {
        calls.hasChanges += 1
        const index = calls.hasChanges - 1
        return hasChangesQueue[index] ?? hasChangesQueue.at(-1) ?? false
      },
      async statusPorcelain() {
        calls.statusPorcelain += 1
        return options.porcelain ?? ""
      },
      async commitPaths(
        message: string,
        paths: readonly [string, string],
      ) {
        calls.commitPaths.push({ message, paths })
      },
      async remoteName() {
        return "origin"
      },
      async push(remote: string, branch: string) {
        calls.push.push({ remote, branch })
      },
    },
    openGitHub: async () => {
      calls.openGitHub += 1
      return {
        async getIssue(n: number) {
          return options.issue ?? issue({ number: n })
        },
        async editLabels(
          number: number,
          change: { add?: string[]; remove?: string[] },
        ) {
          calls.editLabels.push({ number, change })
        },
      }
    },
    readSpecs: async (n: number) => {
      calls.readSpecs.push(n)
      return {
        requirements: options.requirements ?? {
          exists: true,
          markdown: READY_REQ,
        },
        design: options.design ?? { exists: true, markdown: READY_DES },
      }
    },
  }

  return { deps, calls }
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function designReq794Body(designMarkdown: string): string {
  const normalized = normalizeNewlines(designMarkdown)
  const marker = "### 変更 git REQ-794\n\n"
  const start = normalized.indexOf(marker)
  if (start < 0) {
    throw new Error("design delta REQ-794 not found")
  }
  const rest = normalized.slice(start + marker.length)
  const endMatch = rest.match(/\n## /)
  const body = endMatch ? rest.slice(0, endMatch.index) : rest
  return body.replace(/\n+$/, "")
}

function canonicalReq794Body(gitMarkdown: string): string {
  const normalized = normalizeNewlines(gitMarkdown)
  const marker = "## REQ-794\n\n"
  const start = normalized.indexOf(marker)
  if (start < 0) {
    throw new Error("canonical REQ-794 not found")
  }
  const rest = normalized.slice(start + marker.length)
  const endMatch = rest.match(/\n## REQ-/)
  const body = endMatch ? rest.slice(0, endMatch.index) : rest
  return body.replace(/\n+$/, "")
}

describe("課題 153", () => {
  describe("createGit", () => {
    test("statusPorcelain は --untracked-files=all を渡す [4]", async () => {
      const { runner, calls } = recordingRunner(() => ok(""))
      const git = createGit({ git: runner, cwd: "/proj" })
      await git.statusPorcelain()
      const statusCall = calls.find((c) => c.args[0] === "status")
      expect(statusCall?.args).toEqual([
        "status",
        "--porcelain",
        "--untracked-files=all",
      ])
    })

    test("hasChanges は status と --porcelain だけで --untracked-files=all を含まない [9]", async () => {
      const { runner, calls } = recordingRunner(() => ok(""))
      const git = createGit({ git: runner, cwd: "/proj" })
      await git.hasChanges()
      const statusCall = calls.find((c) => c.args[0] === "status")
      expect(statusCall?.args).toEqual(["status", "--porcelain"])
      expect(statusCall?.args).not.toContain("--untracked-files=all")
    })
  })

  describe("changedPathsOnlySpecFiles", () => {
    test("?? の二仕様パスだけのとき真 [5]", () => {
      const porcelain =
        `?? ${SPEC.requirements}\n` + `?? ${SPEC.design}\n`
      expect(
        changedPathsOnlySpecFiles(
          porcelain,
          SPEC.requirements,
          SPEC.design,
        ),
      ).toBe(true)
    })

    test("?? docs/issues/<番号>/ の一行だけのとき偽 [6]", () => {
      const porcelain = `?? ${SPEC.dir}/\n`
      expect(
        changedPathsOnlySpecFiles(
          porcelain,
          SPEC.requirements,
          SPEC.design,
        ),
      ).toBe(false)
    })

    test("二仕様パスと ?? memo.md のとき偽 [7]", () => {
      const porcelain =
        `?? ${SPEC.requirements}\n` +
        `?? ${SPEC.design}\n` +
        `?? ${SPEC.dir}/memo.md\n`
      expect(
        changedPathsOnlySpecFiles(
          porcelain,
          SPEC.requirements,
          SPEC.design,
        ),
      ).toBe(false)
    })
  })

  describe("requestImplementation", () => {
    test("porcelain が二仕様の ?? だけで ready のとき commitPaths と push と editLabels [1]", async () => {
      const porcelain =
        `?? ${SPEC.requirements}\n` + `?? ${SPEC.design}\n`
      const { deps, calls } = makeRequestDeps({
        hasChanges: [true, false],
        porcelain,
      })
      await requestImplementation(deps, ISSUE)
      expect(calls.commitPaths).toEqual([
        {
          message: `docs: 課題 ${ISSUE} の要件と設計`,
          paths: [SPEC.requirements, SPEC.design],
        },
      ])
      expect(calls.push).toEqual([{ remote: "origin", branch: BRANCH }])
      expect(calls.editLabels).toEqual([
        { number: ISSUE, change: { add: [LABEL_REQUEST] } },
      ])
    })

    test("二仕様とほかの未追跡があるとき commitPaths を呼ばず失敗 [2]", async () => {
      const porcelain =
        `?? ${SPEC.requirements}\n` +
        `?? ${SPEC.design}\n` +
        `?? ${SPEC.dir}/memo.md\n`
      const { deps, calls } = makeRequestDeps({
        hasChanges: true,
        porcelain,
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "未コミットの変更があります",
      )
      expect(calls.commitPaths).toHaveLength(0)
      expect(calls.openGitHub).toBe(0)
    })

    test("片方 ?? 片方 M の二仕様だけで ready のとき自動コミットに進む [3]", async () => {
      const porcelain =
        `?? ${SPEC.requirements}\n` + ` M ${SPEC.design}\n`
      const { deps, calls } = makeRequestDeps({
        hasChanges: [true, false],
        porcelain,
      })
      await requestImplementation(deps, ISSUE)
      expect(calls.commitPaths).toEqual([
        {
          message: `docs: 課題 ${ISSUE} の要件と設計`,
          paths: [SPEC.requirements, SPEC.design],
        },
      ])
      expect(calls.push).toEqual([{ remote: "origin", branch: BRANCH }])
      expect(calls.editLabels).toEqual([
        { number: ISSUE, change: { add: [LABEL_REQUEST] } },
      ])
    })
  })

  test("docs/canonical/git.md の REQ-794 が設計の正本への差分と一致 [8]", () => {
    const design = readFileSync(designPath, "utf8")
    const gitCanonical = readFileSync(gitCanonicalPath, "utf8")
    expect(canonicalReq794Body(gitCanonical)).toBe(designReq794Body(design))
  })
})
