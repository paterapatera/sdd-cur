import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  assertDirectoryExists,
  installAll,
  installSkills,
  parseInstallArgs,
  resolveAgentsDestination,
  resolveSkillsDestination,
  subagentFileNames,
} from "./install.ts"

describe("resolveSkillsDestination", () => {
  test("引数なしの宛先は homedir に .cursor/skills を足す", () => {
    const dest = resolveSkillsDestination("/home/test", undefined)
    expect(dest).toBe(path.join("/home/test", ".cursor", "skills"))
  })

  test("プロジェクトのルートを渡すと <root>/.cursor/skills になる", () => {
    const root = "/tmp/myproject"
    const dest = resolveSkillsDestination("/home/test", root)
    expect(dest).toBe(path.join(root, ".cursor", "skills"))
  })
})

describe("resolveAgentsDestination", () => {
  test("引数なしの宛先は homedir に .cursor/agents を足す", () => {
    const dest = resolveAgentsDestination("/home/test", undefined)
    expect(dest).toBe(path.join("/home/test", ".cursor", "agents"))
  })

  test("プロジェクトのルートを渡すと <root>/.cursor/agents になる", () => {
    const root = "/tmp/myproject"
    const dest = resolveAgentsDestination("/home/test", root)
    expect(dest).toBe(path.join(root, ".cursor", "agents"))
  })
})

describe("parseInstallArgs", () => {
  test("引数なしはホーム向け", () => {
    expect(parseInstallArgs([])).toEqual({ ok: true, projectRoot: undefined })
  })

  test("空文字は失敗", () => {
    const result = parseInstallArgs([""])
    expect(result.ok).toBe(false)
  })

  test("二つ以上は失敗", () => {
    const result = parseInstallArgs(["a", "b"])
    expect(result.ok).toBe(false)
  })
})

describe("installSkills", () => {
  let tempRoot: string
  let skillsSource: string
  let destParent: string

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-install-"))
    skillsSource = path.join(tempRoot, "skills-src")
    destParent = path.join(tempRoot, "dest-parent")
    await mkdir(skillsSource, { recursive: true })
    await mkdir(destParent, { recursive: true })
  })

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true })
  })

  test("スキルディレクトリがコピーされる", async () => {
    await mkdir(path.join(skillsSource, "aaa"), { recursive: true })
    await writeFile(path.join(skillsSource, "aaa", "SKILL.md"), "skill")

    const result = await installSkills({
      homedir: destParent,
      projectRoot: destParent,
      skillsSourceDir: skillsSource,
    })

    const content = await readFile(
      path.join(result.destDir, "aaa", "SKILL.md"),
      "utf8",
    )
    expect(content).toBe("skill")
    expect(result.skillNames).toEqual(["aaa"])
  })

  test("宛先に既にある別のディレクトリは残る", async () => {
    await mkdir(path.join(skillsSource, "aaa"), { recursive: true })
    const destDir = path.join(destParent, ".cursor", "skills")
    await mkdir(path.join(destDir, "other"), { recursive: true })
    await writeFile(path.join(destDir, "other", "keep.txt"), "keep")

    await installSkills({
      homedir: destParent,
      projectRoot: destParent,
      skillsSourceDir: skillsSource,
    })

    const keep = await readFile(path.join(destDir, "other", "keep.txt"), "utf8")
    expect(keep).toBe("keep")
  })

  test("同名スキルは置き換わり、消えたファイルは残らない", async () => {
    const destDir = path.join(destParent, ".cursor", "skills")
    await mkdir(path.join(destDir, "aaa"), { recursive: true })
    await writeFile(path.join(destDir, "aaa", "hoge.md"), "old")

    await mkdir(path.join(skillsSource, "aaa"), { recursive: true })
    await writeFile(path.join(skillsSource, "aaa", "fuga.md"), "new")

    await installSkills({
      homedir: destParent,
      projectRoot: destParent,
      skillsSourceDir: skillsSource,
    })

    const fugaPath = path.join(destDir, "aaa", "fuga.md")
    const hogePath = path.join(destDir, "aaa", "hoge.md")
    expect(await readFile(fugaPath, "utf8")).toBe("new")
    await expect(readFile(hogePath, "utf8")).rejects.toThrow()
  })

  test("skills が空でも宛先が作られる", async () => {
    const result = await installSkills({
      homedir: destParent,
      projectRoot: destParent,
      skillsSourceDir: skillsSource,
    })
    expect(result.skillNames).toEqual([])
    const info = await stat(result.destDir)
    expect(info.isDirectory()).toBe(true)
  })

  test("存在しないプロジェクトのルートは失敗", async () => {
    const missing = path.join(tempRoot, "missing")
    await expect(assertDirectoryExists(missing)).rejects.toThrow(
      "ディレクトリが存在しません",
    )
  })

  test("ファイルを渡すとディレクトリではない", async () => {
    const file = path.join(tempRoot, "file.txt")
    await writeFile(file, "x")
    await expect(assertDirectoryExists(file)).rejects.toThrow(
      "ディレクトリではありません",
    )
  })
})

async function writeMinimalAgents(agentsSource: string): Promise<void> {
  await mkdir(agentsSource, { recursive: true })
  for (const name of subagentFileNames) {
    await writeFile(path.join(agentsSource, name), `# ${name}\n`)
  }
}

describe("installAll", () => {
  let tempRoot: string
  let skillsSource: string
  let agentsSource: string
  let destParent: string

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-install-all-"))
    skillsSource = path.join(tempRoot, "skills-src")
    agentsSource = path.join(tempRoot, "agents-src")
    destParent = path.join(tempRoot, "dest-parent")
    await mkdir(skillsSource, { recursive: true })
    await mkdir(destParent, { recursive: true })
    await writeMinimalAgents(agentsSource)
  })

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true })
  })

  test("サブエージェントがコピーされる", async () => {
    await mkdir(path.join(skillsSource, "aaa"), { recursive: true })
    await writeFile(path.join(skillsSource, "aaa", "SKILL.md"), "skill")

    await installAll({
      homedir: destParent,
      projectRoot: destParent,
      skillsSourceDir: skillsSource,
      agentsSourceDir: agentsSource,
    })

    const agentsDest = path.join(destParent, ".cursor", "agents")
    for (const name of subagentFileNames) {
      const content = await readFile(path.join(agentsDest, name), "utf8")
      expect(content).toBe(`# ${name}\n`)
    }
  })

  test("宛先に既にある別のファイルは残る", async () => {
    const agentsDest = path.join(destParent, ".cursor", "agents")
    await mkdir(agentsDest, { recursive: true })
    await writeFile(path.join(agentsDest, "other.md"), "keep")

    await installAll({
      homedir: destParent,
      projectRoot: destParent,
      skillsSourceDir: skillsSource,
      agentsSourceDir: agentsSource,
    })

    const keep = await readFile(path.join(agentsDest, "other.md"), "utf8")
    expect(keep).toBe("keep")
  })

  test("同名のサブエージェントは置き換わる", async () => {
    const agentsDest = path.join(destParent, ".cursor", "agents")
    await mkdir(agentsDest, { recursive: true })
    await writeFile(path.join(agentsDest, subagentFileNames[0]), "old")

    await installAll({
      homedir: destParent,
      projectRoot: destParent,
      skillsSourceDir: skillsSource,
      agentsSourceDir: agentsSource,
    })

    const content = await readFile(
      path.join(agentsDest, subagentFileNames[0]),
      "utf8",
    )
    expect(content).toBe(`# ${subagentFileNames[0]}\n`)
  })

  test("八つのいずれかが無いときは失敗し、スキルの宛先もサブエージェントの宛先も作られない", async () => {
    const incomplete = path.join(tempRoot, "agents-incomplete")
    await mkdir(incomplete, { recursive: true })
    await writeFile(path.join(incomplete, subagentFileNames[0]), "x")

    const skillsDest = path.join(destParent, ".cursor", "skills")
    const agentsDest = path.join(destParent, ".cursor", "agents")

    await expect(
      installAll({
        homedir: destParent,
        projectRoot: destParent,
        skillsSourceDir: skillsSource,
        agentsSourceDir: incomplete,
      }),
    ).rejects.toThrow("サブエージェントがありません")

    await expect(stat(skillsDest)).rejects.toThrow()
    await expect(stat(agentsDest)).rejects.toThrow()
  })
})
