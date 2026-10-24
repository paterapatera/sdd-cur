import { describe, expect, test } from "bun:test"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import { subagentFileNames } from "./install.ts"

const root = path.join(import.meta.dir, "..")
const skillsRoot = path.join(root, "skills")
const agentsRoot = path.join(root, "agents")

const hashIssueRef = /#\d/
const designIssueRef = /設計 \d/

async function listFilesRecursive(dir: string): Promise<string[]> {
  const out: string[] = []
  async function walk(current: string, prefix: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(full, rel)
      } else if (entry.isFile()) {
        out.push(rel)
      }
    }
  }
  await walk(dir, "")
  return out.sort()
}

function assertNoIssueNumberRefs(relativePath: string, text: string): void {
  const hashMatch = hashIssueRef.exec(text)
  if (hashMatch) {
    expect.unreachable(
      `${relativePath}: 「#」の直後が十進数字である部分がある: ${hashMatch[0]}`,
    )
  }
  const designMatch = designIssueRef.exec(text)
  if (designMatch) {
    expect.unreachable(
      `${relativePath}: 「設計 」の直後が十進数字である部分がある: ${designMatch[0]}`,
    )
  }
}

describe("課題 163", () => {
  test("配布する skills/ と install の agents/ に課題番号形式の参照が無い", async () => {
    const skillRelPaths = await listFilesRecursive(skillsRoot)
    expect(skillRelPaths.length).toBeGreaterThan(0)

    for (const rel of skillRelPaths) {
      const text = await readFile(path.join(skillsRoot, rel), "utf8")
      assertNoIssueNumberRefs(`skills/${rel}`, text)
    }

    for (const name of subagentFileNames) {
      const text = await readFile(path.join(agentsRoot, name), "utf8")
      assertNoIssueNumberRefs(`agents/${name}`, text)
    }
  })
})
