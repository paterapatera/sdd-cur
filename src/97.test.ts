import { describe, expect, test } from "bun:test"
import { access, readFile, readdir } from "node:fs/promises"
import path from "node:path"

const root = path.join(import.meta.dir, "..")

function bodyAfterFrontmatter(text: string): string {
  const fmEnd = text.indexOf("\n---\n", 4)
  if (fmEnd === -1) return text
  return text.slice(fmEnd + 5)
}

function lineViolatesOneSentencePerLine(line: string): boolean {
  const trimmedStart = line.match(/^(\s*)/)?.[1] ?? ""
  const content = line.slice(trimmedStart.length)
  if (content.startsWith("#") || content.startsWith("|")) return false
  if (content.trim() === "") return false
  let inBacktick = false
  for (let i = 0; i < content.length; i++) {
    const c = content[i]
    if (c === "`") {
      inBacktick = !inBacktick
      continue
    }
    if (!inBacktick && (c === "。" || c === "！" || c === "？")) {
      let j = i + 1
      while (j < content.length && content[j] === " ") j += 1
      if (j < content.length) return true
    }
  }
  return false
}

function assertBodyOneSentencePerLine(body: string): void {
  let inFence = false
  for (const line of body.split("\n")) {
    const stripped = line.replace(/^\s*/, "")
    if (stripped.startsWith("```")) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    expect(lineViolatesOneSentencePerLine(line)).toBe(false)
  }
}

const movedDescribes: { file: string; describe: string }[] = [
  { file: "sdd-is-quick-target.test.ts", describe: "isQuickTarget" },
  { file: "sdd-candidate-views.test.ts", describe: "candidateViews" },
  { file: "sdd-list-start-candidates.test.ts", describe: "listStartCandidates" },
  { file: "sdd-spec-status.test.ts", describe: "specStatus" },
  { file: "sdd-build-issue-view.test.ts", describe: "buildIssueView" },
  { file: "sdd-load-issue-view.test.ts", describe: "loadIssueView" },
  {
    file: "sdd-next-unincorporated-answer.test.ts",
    describe: "nextUnincorporatedAnswer",
  },
  { file: "sdd-spec-heading.test.ts", describe: "specHeading" },
  { file: "sdd-confirmation-body.test.ts", describe: "confirmationBody" },
  {
    file: "sdd-assert-spec-work-allowed.test.ts",
    describe: "assertSpecWorkAllowed",
  },
  { file: "sdd-post-confirmation.test.ts", describe: "postConfirmation" },
  {
    file: "sdd-apply-incorporated-answer.test.ts",
    describe: "applyIncorporatedAnswer",
  },
  { file: "sdd-read-spec-file.test.ts", describe: "readSpecFile" },
  { file: "sdd-skill-sdd-cur.test.ts", describe: "skills/sdd-cur/SKILL.md" },
  { file: "agents-files.test.ts", describe: "agents/*.md" },
  { file: "runner-select-quick-issue.test.ts", describe: "selectQuickIssue" },
  {
    file: "runner-select-implementation-issue.test.ts",
    describe: "selectImplementationIssue",
  },
  {
    file: "runner-implementation-branch.test.ts",
    describe: "implementationBranch",
  },
  {
    file: "runner-issue-has-fix-labels.test.ts",
    describe: "issueHasFixLabels",
  },
  {
    file: "runner-select-completion-issue.test.ts",
    describe: "selectCompletionIssue",
  },
  { file: "runner-select-fix-issues.test.ts", describe: "selectFixIssues" },
  {
    file: "runner-classify-fix-pull-requests.test.ts",
    describe: "classifyFixPullRequests",
  },
  {
    file: "runner-acceptance-comment.test.ts",
    describe: "acceptanceComment",
  },
  { file: "runner-pull-request-body.test.ts", describe: "pullRequestBody" },
  { file: "runner-start-comment.test.ts", describe: "startComment" },
  { file: "runner-decide-start-claim.test.ts", describe: "decideStartClaim" },
  { file: "runner-issue-start-cutoff.test.ts", describe: "issueStartCutoff" },
  {
    file: "runner-create-runner-start-claim.test.ts",
    describe: "createRunner start claim",
  },
  { file: "runner-create-runner.test.ts", describe: "createRunner" },
  {
    file: "runner-create-runner-completion.test.ts",
    describe: "createRunner completion",
  },
  { file: "runner-create-runner-fix.test.ts", describe: "createRunner fix" },
  {
    file: "runner-skill-sdd-cur-quick.test.ts",
    describe: "skills/sdd-cur-quick/SKILL.md",
  },
  {
    file: "runner-skill-sdd-cur-implement.test.ts",
    describe: "skills/sdd-cur-implement/SKILL.md",
  },
  {
    file: "runner-skill-sdd-cur-fix.test.ts",
    describe: "skills/sdd-cur-fix/SKILL.md",
  },
]

describe("issue 97 conventions and layout", () => {
  test("docs/conventions.md の書き方の節", async () => {
    const text = await readFile(path.join(root, "docs/conventions.md"), "utf8")
    expect(text).toContain("## スキル、サブエージェント、テストの書き方")
    expect(text).toContain("一文を一行")
    expect(text).toContain("src/<番号>.test.ts")
  })

  test("AGENTS.md の参照", async () => {
    const text = await readFile(path.join(root, "AGENTS.md"), "utf8")
    const policy = await readFile(path.join(root, "docs/policy.md"), "utf8")
    expect(text).toContain("[docs/conventions.md](docs/conventions.md)")
    expect(text).not.toContain("一文を一行")
    expect(text).not.toContain(
      "スキル、サブエージェント、テストの書き方は、このファイルを読む。",
    )
    expect(policy).toContain(
      "スキル、サブエージェント、テストの書き方は、このファイルを読む。",
    )
  })

  test("旧三ファイルは無い", async () => {
    for (const f of ["sdd.test.ts", "agents.test.ts", "runner.test.ts"]) {
      await expect(access(path.join(root, "src", f))).rejects.toThrow()
    }
  })

  test("移した describe のファイル", async () => {
    for (const { file, describe: name } of movedDescribes) {
      await access(path.join(root, "src", file))
      const source = await readFile(path.join(root, "src", file), "utf8")
      const matches = source.match(/^describe\(/gm) ?? []
      expect(matches.length).toBe(1)
      expect(source).toContain(`describe("${name}"`)
    }
  })

  test("skills の本文は一文一行", async () => {
    const skillRoot = path.join(root, "skills")
    for (const dir of await readdir(skillRoot)) {
      const p = path.join(skillRoot, dir, "SKILL.md")
      try {
        const text = await readFile(p, "utf8")
        assertBodyOneSentencePerLine(bodyAfterFrontmatter(text))
      } catch {
        /* not a skill dir */
      }
    }
  })

  test("agents の本文は一文一行", async () => {
    const agentsDir = path.join(root, "agents")
    for (const file of await readdir(agentsDir)) {
      if (!file.endsWith(".md")) continue
      const text = await readFile(path.join(agentsDir, file), "utf8")
      assertBodyOneSentencePerLine(bodyAfterFrontmatter(text))
    }
  })

  test("validate は sdd-cur と sdd-cur-quick だけ", async () => {
    for (const rel of [
      "sdd-cur-implement/SKILL.md",
      "sdd-cur-fix/SKILL.md",
      "sdd-cur-complete/SKILL.md",
      "sdd-cur-create-issue/SKILL.md",
    ]) {
      const text = await readFile(path.join(root, "skills", rel), "utf8")
      expect(text).not.toContain("bun src/cli.ts validate")
    }
  })
})
