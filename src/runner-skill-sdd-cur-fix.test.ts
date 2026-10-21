import { describe, expect, mock, spyOn, test } from "bun:test"
import {
  createIssueCommentStore,
  issue,
  LABEL_CONFLICT,
  LABEL_DONE,
  LABEL_IN_PROGRESS,
  LABEL_MERGED,
  LABEL_REQUEST,
  LABEL_VERIFIED,
  VIEWER_LOGIN,
} from "./runner-test-support.ts"
import * as nodeCrypto from "node:crypto"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  commentMarkers,
  pullRequestCommentMarkers,
} from "./conventions.ts"
import { selectCompletionIssue } from "./complete.ts"
import {
  acceptanceComment,
  classifyFixPullRequests,
  createRunner,
  implementationBranch,
  issueHasFixLabels,
  pullRequestBody,
  selectFixIssues,
  selectImplementationIssue,
  selectQuickIssue,
  decideStartClaim,
  issueStartCutoff,
  latestCreatedAt,
  startComment,
  startMarker,
} from "./runner.ts"
const fixSkillPath = path.join(import.meta.dir, "../skills/sdd-cur-fix/SKILL.md")
const cliPath = path.join(import.meta.dir, "cli.ts")

describe("skills/sdd-cur-fix/SKILL.md", () => {
  test("フロントマターと本文", async () => {
    const text = await readFile(fixSkillPath, "utf8")
    expect(text.startsWith(`---
name: sdd-cur-fix
description: クローンの作業ツリーで、指定された課題の不具合を要件と設計の範囲内で直し、修正コメントの本文を指定パスへ書く。課題ランナーが agent から起動する。
disable-model-invocation: true
---
`)).toBe(true)
    for (const phrase of [
      "# sdd-cur-fix",
      "## 修正",
      "## 禁止",
      "docs/issues",
      "sdd-cur-implement-author",
      "model は渡さない",
      "設計の範囲外のため直していない",
      "課題を作らない",
      "課題を閉じない",
      "ラベルを変えない",
      "コミットしない",
      "push しない",
      "マージリクエストを作らない",
      "スカッシュマージしない",
      "コメントを投稿しない",
      "受け入れ手順を書き直さない",
      "`gh` を直接起動しない",
      "ブランチの先頭を動かす",
    ]) {
      expect(text).toContain(phrase)
    }
  })

  test("install が sdd-cur-fix をコピーする", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-runner-fix-install-"))
    try {
      const proc = Bun.spawn(["bun", cliPath, "install", temp], {
        stdout: "pipe",
        stderr: "pipe",
      })
      expect(await proc.exited).toBe(0)
      const installed = await readFile(
        path.join(temp, ".cursor", "skills", "sdd-cur-fix", "SKILL.md"),
        "utf8",
      )
      const source = await readFile(fixSkillPath, "utf8")
      expect(installed).toBe(source)
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})
