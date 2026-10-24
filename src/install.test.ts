import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  assertDirectoryExists,
  installAgents,
  installAll,
  installSkills,
  parseInstallArgs,
  readModelFromAgentFile,
  resolveAgentsDestination,
  resolveSkillsDestination,
  setModelLineInAgentFile,
  subagentFileNames,
  subagentModelTierByFileName,
} from "./install.ts"

const defaultAgentsSourceDir = path.join(import.meta.dir, "../agents")

describe("subagentFileNames", () => {
  test("廃止した修正案作成役はリストに無い", () => {
    for (const name of [
      "sdd-cur-req-fix-proposer.md",
      "sdd-cur-design-fix-proposer.md",
      "sdd-cur-implement-fix-proposer.md",
    ]) {
      expect(subagentFileNames).not.toContain(name)
    }
    expect(subagentFileNames).toHaveLength(11)
  })
})

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

  test("ルート一つ", () => {
    expect(parseInstallArgs(["/tmp/proj"])).toEqual({
      ok: true,
      projectRoot: "/tmp/proj",
    })
  })

  test("空文字は失敗", () => {
    const result = parseInstallArgs([""])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBe("install の引数はプロジェクトのルートを一つまでです")
    }
  })

  test("二つのルートは失敗", () => {
    const result = parseInstallArgs(["a", "b"])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBe("install の引数はプロジェクトのルートを一つまでです")
    }
  })

  test("ルートと三フラグの順序入れ替え", () => {
    expect(
      parseInstallArgs([
        "--low-model",
        "low-m",
        "/tmp/r",
        "--high-model",
        "high-m",
        "--medium-model",
        "med-m",
      ]),
    ).toEqual({
      ok: true,
      projectRoot: "/tmp/r",
      highModel: "high-m",
      mediumModel: "med-m",
      lowModel: "low-m",
    })
    expect(
      parseInstallArgs([
        "/tmp/r",
        "--high-model",
        "high-m",
        "--medium-model",
        "med-m",
        "--low-model",
        "low-m",
      ]),
    ).toEqual({
      ok: true,
      projectRoot: "/tmp/r",
      highModel: "high-m",
      mediumModel: "med-m",
      lowModel: "low-m",
    })
  })

  test("値に = や -- 接頭", () => {
    const r = parseInstallArgs(["--high-model", "m=x", "--medium-model", "--foo"])
    expect(r).toEqual({
      ok: true,
      projectRoot: undefined,
      highModel: "m=x",
      mediumModel: "--foo",
    })
  })

  test("フラグ直後に引数が無い", () => {
    const r = parseInstallArgs(["--high-model"])
    expect(r).toEqual({ ok: false, message: "モデルの指定が不正です: --high-model" })
  })

  test("--flag= 形式は失敗", () => {
    const r = parseInstallArgs(["--medium-model=foo"])
    expect(r).toEqual({
      ok: false,
      message: "モデルの指定が不正です: --medium-model=foo",
    })
  })

  test("未知の -- 引数は失敗", () => {
    const r = parseInstallArgs(["/tmp", "--unknown"])
    expect(r).toEqual({ ok: false, message: "モデルの指定が不正です: --unknown" })
  })

  test("重複指定は後の値で失敗", () => {
    const r = parseInstallArgs(["--low-model", "a", "--low-model", "b"])
    expect(r).toEqual({ ok: false, message: "モデルの指定が不正です: b" })
  })

  test("空の値は失敗", () => {
    const r = parseInstallArgs(["--high-model", ""])
    expect(r).toEqual({ ok: false, message: "モデルの指定が不正です: " })
  })
})

describe("subagentModelTierByFileName", () => {
  test("受け入れ条件 6 の割り当て", () => {
    const high = [
      "sdd-cur-req-author.md",
      "sdd-cur-design-author.md",
      "sdd-cur-req-reviewer-high.md",
    ]
    const medium = [
      "sdd-cur-req-reviewer.md",
      "sdd-cur-design-reviewer.md",
      "sdd-cur-implement-reviewer.md",
    ]
    const low = [
      "sdd-cur-implement-author.md",
      "sdd-cur-req-fixer.md",
      "sdd-cur-design-fixer.md",
      "sdd-cur-implement-fixer.md",
      "sdd-cur-explore.md",
    ]
    for (const name of high) {
      expect(subagentModelTierByFileName[name]).toBe("high")
    }
    for (const name of medium) {
      expect(subagentModelTierByFileName[name]).toBe("medium")
    }
    for (const name of low) {
      expect(subagentModelTierByFileName[name]).toBe("low")
    }
  })
})

describe("readModelFromAgentFile と setModelLineInAgentFile", () => {
  test("agents/ の実ファイルで model: 行だけ読み書き", async () => {
    for (const name of subagentFileNames) {
      const content = await readFile(path.join(defaultAgentsSourceDir, name), "utf8")
      const model = readModelFromAgentFile(content)
      expect(model.length).toBeGreaterThan(0)
      const replaced = setModelLineInAgentFile(content, "custom-model")
      expect(readModelFromAgentFile(replaced)).toBe("custom-model")
      const lines = replaced.split("\n")
      const modelLines = lines.filter((l) => l.startsWith("model:"))
      expect(modelLines).toHaveLength(1)
      expect(modelLines[0]).toBe("model: custom-model")
    }
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

async function writeMinimalAgents(agentsSource: string, model = "orig-model"): Promise<void> {
  await mkdir(agentsSource, { recursive: true })
  for (const name of subagentFileNames) {
    await writeFile(
      path.join(agentsSource, name),
      `---\nname: ${name}\nmodel: ${model}\ndescription: test\n---\n\n# ${name}\n`,
    )
  }
}

describe("installAgents", () => {
  let tempRoot: string
  let agentsSource: string
  let destParent: string

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-install-agents-"))
    agentsSource = path.join(tempRoot, "agents-src")
    destParent = path.join(tempRoot, "dest-parent")
    await mkdir(destParent, { recursive: true })
    await writeMinimalAgents(agentsSource)
  })

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true })
  })

  test("三種すべて指定", async () => {
    const { subagentModels } = await installAgents({
      homedir: destParent,
      projectRoot: destParent,
      agentsSourceDir: agentsSource,
      highModel: "H",
      mediumModel: "M",
      lowModel: "L",
    })
    const agentsDest = path.join(destParent, ".cursor", "agents")
    for (const name of subagentFileNames) {
      const content = await readFile(path.join(agentsDest, name), "utf8")
      const tier = subagentModelTierByFileName[name]
      const expected =
        tier === "high" ? "H" : tier === "medium" ? "M" : "L"
      expect(readModelFromAgentFile(content)).toBe(expected)
    }
    expect(subagentModels).toHaveLength(11)
  })

  test("high だけ指定", async () => {
    await installAgents({
      homedir: destParent,
      projectRoot: destParent,
      agentsSourceDir: agentsSource,
      highModel: "H",
    })
    const agentsDest = path.join(destParent, ".cursor", "agents")
    for (const name of subagentFileNames) {
      const content = await readFile(path.join(agentsDest, name), "utf8")
      const tier = subagentModelTierByFileName[name]
      expect(readModelFromAgentFile(content)).toBe(tier === "high" ? "H" : "orig-model")
    }
  })

  test("medium だけ指定", async () => {
    await installAgents({
      homedir: destParent,
      projectRoot: destParent,
      agentsSourceDir: agentsSource,
      mediumModel: "M",
    })
    const agentsDest = path.join(destParent, ".cursor", "agents")
    for (const name of subagentFileNames) {
      const content = await readFile(path.join(agentsDest, name), "utf8")
      const tier = subagentModelTierByFileName[name]
      expect(readModelFromAgentFile(content)).toBe(
        tier === "medium" ? "M" : "orig-model",
      )
    }
  })

  test("low だけ指定", async () => {
    await installAgents({
      homedir: destParent,
      projectRoot: destParent,
      agentsSourceDir: agentsSource,
      lowModel: "L",
    })
    const agentsDest = path.join(destParent, ".cursor", "agents")
    for (const name of subagentFileNames) {
      const content = await readFile(path.join(agentsDest, name), "utf8")
      const tier = subagentModelTierByFileName[name]
      expect(readModelFromAgentFile(content)).toBe(tier === "low" ? "L" : "orig-model")
    }
  })

  test("指定なしはコピー元の model のまま", async () => {
    await installAgents({
      homedir: destParent,
      projectRoot: destParent,
      agentsSourceDir: agentsSource,
    })
    const agentsDest = path.join(destParent, ".cursor", "agents")
    for (const name of subagentFileNames) {
      const content = await readFile(path.join(agentsDest, name), "utf8")
      expect(readModelFromAgentFile(content)).toBe("orig-model")
    }
  })

  test("コピー元 agents/ は変えない", async () => {
    const before = await readFile(
      path.join(agentsSource, subagentFileNames[0]),
      "utf8",
    )
    await installAgents({
      homedir: destParent,
      projectRoot: destParent,
      agentsSourceDir: agentsSource,
      highModel: "H",
    })
    const after = await readFile(path.join(agentsSource, subagentFileNames[0]), "utf8")
    expect(after).toBe(before)
  })
})

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
      expect(readModelFromAgentFile(content)).toBe("orig-model")
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
    expect(readModelFromAgentFile(content)).toBe("orig-model")
  })

  test("十一個のいずれかが無いときは失敗し、スキルの宛先もサブエージェントの宛先も作られない", async () => {
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
