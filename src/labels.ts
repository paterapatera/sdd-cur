import type { GitHubClient } from "./github.ts"

export const workflowLabels: readonly {
  name: string
  description: string
  color: string
}[] = [
  {
    name: "実装依頼",
    description: "設計が終わり、実装してよい",
    color: "FBCA04",
  },
  {
    name: "実装中",
    description: "実装を始めた",
    color: "D93F0B",
  },
  {
    name: "実装完了",
    description: "実装が終わり、受け入れ手順がコメントにある",
    color: "0E8A16",
  },
  {
    name: "動作確認OK",
    description: "受け入れテストに合格した",
    color: "1D76DB",
  },
  {
    name: "マージ済み",
    description: "スカッシュマージと同時に付ける",
    color: "5319E7",
  },
  {
    name: "コンフリクト",
    description: "取り込みがコンフリクトした",
    color: "B60205",
  },
]

export const quickTargetLabel: {
  name: string
  description: string
  color: string
} = {
  name: "quick 対象",
  description: "軽微な修正として quick で進める",
  color: "0075CA",
}

export type LabelEnsureResult = {
  name: string
  status: "created" | "existing"
}

export async function ensureWorkflowLabels(
  github: GitHubClient,
): Promise<LabelEnsureResult[]> {
  const results: LabelEnsureResult[] = []
  for (const label of [...workflowLabels, quickTargetLabel]) {
    const existing = await github.getLabel(label.name)
    if (existing !== null) {
      results.push({ name: label.name, status: "existing" })
      continue
    }
    await github.createLabel(label)
    results.push({ name: label.name, status: "created" })
  }
  return results
}
