import { mkdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"

export const policyTemplate = `## 誰のための道具か

この節には、誰のための道具かを書く。

## 技術の前提

この節には、技術の前提を書く。

## 構成

この節には、構成を書く。

## 破ってはいけない原則

この節には、破ってはいけない原則を書く。
`

const canonicalReadmeContent = "仕様の正本を置く。\n"
const issuesReadmeContent = "課題ごとの要件と設計を置く。\n"

const initTargets: { rel: string; content: string }[] = [
  { rel: "docs/policy.md", content: policyTemplate },
  { rel: "docs/canonical/README.md", content: canonicalReadmeContent },
  { rel: "docs/issues/README.md", content: issuesReadmeContent },
]

export type ParseInitArgsResult =
  | { ok: true; projectRoot: string | undefined }
  | { ok: false; message: string }

export function parseInitArgs(args: string[]): ParseInitArgsResult {
  if (args.length === 0) {
    return { ok: true, projectRoot: undefined }
  }
  if (args.length > 1) {
    return { ok: false, message: "init の引数はプロジェクトのルートを一つまでです" }
  }
  const projectRoot = args[0]
  if (projectRoot === "") {
    return { ok: false, message: "init の引数はプロジェクトのルートを一つまでです" }
  }
  return { ok: true, projectRoot }
}

export async function initProject(root: string): Promise<string[]> {
  const created: string[] = []
  for (const { rel, content } of initTargets) {
    const filePath = path.join(root, rel)
    let info: Awaited<ReturnType<typeof stat>>
    try {
      info = await stat(filePath)
    } catch {
      await mkdir(path.dirname(filePath), { recursive: true })
      await writeFile(filePath, content, "utf8")
      created.push(rel)
      continue
    }
    if (!info.isFile()) {
      continue
    }
  }
  return created
}
