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
const quickSkillPath = path.join(
  import.meta.dir,
  "../skills/sdd-cur-quick/SKILL.md",
)
const cliPath = path.join(import.meta.dir, "cli.ts")

describe("skills/sdd-cur-quick/SKILL.md", () => {
  test("フロントマターと必須の文言", async () => {
    const text = await readFile(quickSkillPath, "utf8")
    expect(text.startsWith(`---
name: sdd-cur-quick
description: クローンの作業ツリーで、quick 対象の課題の要件と設計を、人への質問と確認コメントなしで書く。課題ランナーが agent から起動する。
disable-model-invocation: true
---
`)).toBe(true)
    for (const phrase of [
      "sdd-cur-req-author",
      "sdd-cur-req-reviewer",
      "sdd-cur-req-fixer",
      "sdd-cur-design-author",
      "sdd-cur-design-reviewer",
      "sdd-cur-design-fixer",
      "決められない",
      "軽微でない",
      "続行",
      "質問する未記載",
      "`confirm` は実行しない",
      "「実装依頼」は付けない",
      "ブランチの先頭を動かす",
    ]) {
      expect(text).toContain(phrase)
    }
    expect(text).not.toContain("sdd-cur-implement-author")
    const requirementsStart = text.indexOf("## 要件")
    const designStart = text.indexOf("## 設計")
    const requirementsSlice = text.slice(requirementsStart, designStart)
    for (const phrase of [
      "初回の起動が `sdd-cur-req-reviewer` である",
      "返った `model` が空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する",
      "要求レビュー役の起動で model を渡さない",
    ]) {
      expect(requirementsSlice).toContain(phrase)
    }
  })

  test("install が sdd-cur-quick をコピーする", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-runner-quick-install-"))
    try {
      const proc = Bun.spawn(["bun", cliPath, "install", temp], {
        stdout: "pipe",
        stderr: "pipe",
      })
      expect(await proc.exited).toBe(0)
      const installed = await readFile(
        path.join(temp, ".cursor", "skills", "sdd-cur-quick", "SKILL.md"),
        "utf8",
      )
      const source = await readFile(quickSkillPath, "utf8")
      expect(installed).toBe(source)
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})
