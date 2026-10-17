import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  assertDirectoryExists,
  installSkills,
  parseInstallArgs,
  resolveSkillsDestination,
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
