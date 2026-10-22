import { describe, expect, test } from "bun:test"
import { specPaths } from "./conventions.ts"
import type { Issue } from "./github.ts"
import { workflowLabels } from "./labels.ts"
import { implementationBranch } from "./runner.ts"
import {
  changedPathsOnlySpecFiles,
  requestImplementation,
} from "./request.ts"

const ISSUE = 145
const BRANCH = implementationBranch(ISSUE)
const SPEC = specPaths(ISSUE)
const READY_REQ = `# ${ISSUE} 題\n`
const READY_DES = `# ${ISSUE} 題\n`

const LABEL_REQUEST = workflowLabels[0].name
const LABEL_IN_PROGRESS = workflowLabels[1].name

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

describe("課題 145", () => {
  describe("changedPathsOnlySpecFiles", () => {
    test("porcelain が二パスだけのとき真", () => {
      const porcelain =
        ` M ${SPEC.requirements}\n` + ` M ${SPEC.design}\n`
      expect(
        changedPathsOnlySpecFiles(
          porcelain,
          SPEC.requirements,
          SPEC.design,
        ),
      ).toBe(true)
    })

    test("ほかのパスがあるとき偽", () => {
      const porcelain =
        ` M ${SPEC.requirements}\n` + "?? other.txt\n"
      expect(
        changedPathsOnlySpecFiles(
          porcelain,
          SPEC.requirements,
          SPEC.design,
        ),
      ).toBe(false)
    })

    test("空のとき偽", () => {
      expect(
        changedPathsOnlySpecFiles("", SPEC.requirements, SPEC.design),
      ).toBe(false)
    })
  })

  describe("requestImplementation", () => {
    test("仕様だけが未コミットで ready のとき commitPaths と push と editLabels", async () => {
      const porcelain = ` M ${SPEC.requirements}\n M ${SPEC.design}\n`
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

    test("未コミットが無いとき commitPaths を呼ばない", async () => {
      const { deps, calls } = makeRequestDeps({ hasChanges: false })
      await requestImplementation(deps, ISSUE)
      expect(calls.commitPaths).toHaveLength(0)
      expect(calls.statusPorcelain).toBe(0)
    })

    test("仕様以外の未コミットがあるとき commitPaths を呼ばず失敗", async () => {
      const { deps, calls } = makeRequestDeps({
        hasChanges: true,
        porcelain: "?? src/request.ts\n",
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "未コミットの変更があります",
      )
      expect(calls.commitPaths).toHaveLength(0)
      expect(calls.openGitHub).toBe(0)
    })

    test("specStatus が ready でないとき commitPaths を呼ばない", async () => {
      const porcelain = ` M ${SPEC.requirements}\n`
      const { deps, calls } = makeRequestDeps({
        hasChanges: true,
        porcelain,
        requirements: { exists: false, markdown: "" },
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "未コミットの変更があります",
      )
      expect(calls.commitPaths).toHaveLength(0)
    })

    test("specStatus が ready でなく未コミットが無いとき従来の message", async () => {
      const { deps, calls } = makeRequestDeps({
        hasChanges: false,
        requirements: { exists: false, markdown: "" },
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "要件がありません",
      )
      expect(calls.commitPaths).toHaveLength(0)
    })

    test("specStatus が ready でなく未コミットがあるとき未コミットの変更があります", async () => {
      const porcelain = ` M ${SPEC.requirements}\n`
      const { deps, calls } = makeRequestDeps({
        hasChanges: true,
        porcelain,
        design: { exists: true, markdown: "# 1 x" },
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "未コミットの変更があります",
      )
      expect(calls.commitPaths).toHaveLength(0)
    })

    test("仕様だけが未コミットだが課題が閉じているとき commitPaths を呼ばない", async () => {
      const porcelain = ` M ${SPEC.requirements}\n`
      const { deps, calls } = makeRequestDeps({
        hasChanges: true,
        porcelain,
        issue: issue({ number: ISSUE, state: "closed" }),
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "課題は閉じています",
      )
      expect(calls.commitPaths).toHaveLength(0)
    })

    test("仕様だけが未コミットだが業務ラベルがあるとき commitPaths を呼ばない", async () => {
      const porcelain = ` M ${SPEC.requirements}\n`
      const { deps, calls } = makeRequestDeps({
        hasChanges: true,
        porcelain,
        issue: issue({ number: ISSUE, labels: [LABEL_IN_PROGRESS] }),
      })
      await expect(requestImplementation(deps, ISSUE)).rejects.toThrow(
        "実装のラベルが付いています",
      )
      expect(calls.commitPaths).toHaveLength(0)
    })
  })
})
