import { afterEach, describe, expect, spyOn, test } from "bun:test"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { printUsage } from "./cli.ts"
import type { CommandExists } from "./doctor.ts"
import type { GhRunner } from "./github.ts"
import {
  defaultAgentsSourceDir,
  defaultSkillsSourceDir,
} from "./install.ts"
import { runSetup } from "./setup.ts"

const repoRoot = path.join(import.meta.dir, "..")
const cliPath = path.join(import.meta.dir, "cli.ts")
const setupPath = path.join(import.meta.dir, "setup.ts")
const bunExe = process.execPath
const isolatedPath = path.dirname(bunExe)

const setupUsageLine =
  "sdd-cur setup [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]"

async function runCliSubcommand(
  sub: "install" | "setup",
  args: string[],
  cwd: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([bunExe, cliPath, sub, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    cwd,
    env: { ...process.env, PATH: isolatedPath },
  })
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  return { code: await proc.exited, stdout, stderr }
}

type StepName = "install" | "init" | "labels" | "doctor"

type RecordedStep =
  | { step: "install"; args: string[]; cwd: string }
  | { step: "init"; args: string[]; cwd: string }
  | { step: "labels"; cwd: string }
  | { step: "doctor"; cwd: string }

function createGhRunnerThatMustNotRun(): GhRunner {
  return {
    async run() {
      throw new Error("gh のプロセスは起動しない")
    },
  }
}

function commandExistsNone(): CommandExists {
  return () => false
}

type RecordingRunners = {
  calls: RecordedStep[]
  runInstall: (args: string[], cwd: string) => Promise<number>
  runInit: (args: string[], cwd: string) => Promise<number>
  runLabels: (cwd: string) => Promise<number>
  runDoctor: (cwd: string) => Promise<number>
}

function recordingRunners(codes: {
  install?: number
  init?: number
  labels?: number
  doctor?: number
}): RecordingRunners {
  const calls: RecordedStep[] = []
  return {
    calls,
    runInstall: async (args, cwd) => {
      calls.push({ step: "install", args, cwd })
      return codes.install ?? 0
    },
    runInit: async (args, cwd) => {
      calls.push({ step: "init", args, cwd })
      return codes.init ?? 0
    },
    runLabels: async (cwd) => {
      calls.push({ step: "labels", cwd })
      return codes.labels ?? 0
    },
    runDoctor: async (cwd) => {
      calls.push({ step: "doctor", cwd })
      return codes.doctor ?? 0
    },
  }
}

type SetupFixture = {
  projectRoot: string
  fakeHome: string
  callerCwd: string
}

describe("165 setup", () => {
  const fixtures: SetupFixture[] = []

  afterEach(async () => {
    while (fixtures.length > 0) {
      const f = fixtures.pop()
      if (!f) {
        continue
      }
      process.chdir(f.callerCwd)
      await rm(f.projectRoot, { recursive: true, force: true })
      await rm(f.fakeHome, { recursive: true, force: true })
    }
  })

  async function createFixture(): Promise<SetupFixture> {
    const callerCwd = process.cwd()
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-165-proj-"))
    const fakeHome = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-165-home-"))
    const fixture = { projectRoot, fakeHome, callerCwd }
    fixtures.push(fixture)
    return fixture
  }

  async function runSetupAtCwd(
    cwd: string,
    fixture: SetupFixture,
    args: string[],
    runners: RecordingRunners,
  ): Promise<number> {
    process.chdir(cwd)
    return await runSetup({
      args,
      homedir: fixture.fakeHome,
      skillsSourceDir: defaultSkillsSourceDir,
      agentsSourceDir: defaultAgentsSourceDir,
      gh: createGhRunnerThatMustNotRun(),
      commandExists: commandExistsNone(),
      runInstall: runners.runInstall,
      runInit: runners.runInit,
      runLabels: runners.runLabels,
      runDoctor: runners.runDoctor,
    })
  }

  async function runInProject(
    fixture: SetupFixture,
    args: string[],
    runners: RecordingRunners,
  ): Promise<number> {
    return await runSetupAtCwd(fixture.projectRoot, fixture, args, runners)
  }

  async function captureRunSetup(
    fixture: SetupFixture,
    args: string[],
    runners: RecordingRunners,
  ): Promise<{ code: number; stderr: string }> {
    const stderrLines: string[] = []
    const errSpy = spyOn(console, "error").mockImplementation((...parts: unknown[]) => {
      stderrLines.push(parts.map(String).join(" "))
    })
    try {
      const code = await runInProject(fixture, args, runners)
      return { code, stderr: stderrLines.join("\n") }
    } finally {
      errSpy.mockRestore()
    }
  }

  function stepNames(calls: RecordedStep[]): StepName[] {
    return calls.map((c) => c.step)
  }

  test("[1][4] 三つが 0 のとき install、init、labels、runDoctor の順で終了コードは runDoctor と同じ", async () => {
    const fixture = await createFixture()
    const runners = recordingRunners({ doctor: 1 })
    const code = await runInProject(fixture, [], runners)
    expect(code).toBe(1)
    expect(stepNames(runners.calls)).toEqual([
      "install",
      "init",
      "labels",
      "doctor",
    ])
    const resolvedRoot = path.resolve(fixture.projectRoot)
    expect(runners.calls[0]).toEqual({
      step: "install",
      args: [resolvedRoot],
      cwd: resolvedRoot,
    })
    expect(runners.calls[1]).toEqual({
      step: "init",
      args: [resolvedRoot],
      cwd: resolvedRoot,
    })
    expect(runners.calls[2]).toEqual({ step: "labels", cwd: resolvedRoot })
    expect(runners.calls[3]).toEqual({ step: "doctor", cwd: resolvedRoot })
  })

  test("[1][4] runDoctor が 0 を返すとき setup の終了コードは 0", async () => {
    const fixture = await createFixture()
    const runners = recordingRunners({ doctor: 0 })
    const code = await runInProject(fixture, [], runners)
    expect(code).toBe(0)
    expect(runners.calls.at(-1)?.step).toBe("doctor")
  })

  test("[1][2] install が非 0 のとき init、labels、runDoctor を呼ばない", async () => {
    const fixture = await createFixture()
    const runners = recordingRunners({ install: 3 })
    const code = await runInProject(fixture, [], runners)
    expect(code).toBe(3)
    expect(stepNames(runners.calls)).toEqual(["install"])
  })

  test("[1][2] init が非 0 のとき labels と runDoctor を呼ばない", async () => {
    const fixture = await createFixture()
    const runners = recordingRunners({ init: 4 })
    const code = await runInProject(fixture, [], runners)
    expect(code).toBe(4)
    expect(stepNames(runners.calls)).toEqual(["install", "init"])
  })

  test("[1][2] labels が非 0 のとき runDoctor を呼ばない", async () => {
    const fixture = await createFixture()
    const runners = recordingRunners({ labels: 5 })
    const code = await runInProject(fixture, [], runners)
    expect(code).toBe(5)
    expect(stepNames(runners.calls)).toEqual(["install", "init", "labels"])
  })

  test("[21] ルート無しのとき install と init のルートは cwd の絶対パス、labels と doctor の cwd も同じ", async () => {
    const fixture = await createFixture()
    const runners = recordingRunners({})
    const code = await runInProject(fixture, [], runners)
    expect(code).toBe(0)
    const root = path.resolve(fixture.projectRoot)
    expect(runners.calls[0]).toEqual({
      step: "install",
      args: [root],
      cwd: root,
    })
    expect(runners.calls[1]).toEqual({
      step: "init",
      args: [root],
      cwd: root,
    })
    expect(runners.calls[2]).toEqual({ step: "labels", cwd: root })
    expect(runners.calls[3]).toEqual({ step: "doctor", cwd: root })
  })

  test("[22] ルートありのとき install は解析文字列のまま、init・labels・doctor は解決済み絶対パス", async () => {
    const fixture = await createFixture()
    const parent = path.dirname(fixture.projectRoot)
    const rootArg = path.basename(fixture.projectRoot)
    const runners = recordingRunners({})
    const code = await runSetupAtCwd(parent, fixture, [rootArg], runners)
    expect(code).toBe(0)
    const resolvedRoot = path.resolve(parent, rootArg)
    const stepCwd = path.resolve(parent)
    expect(runners.calls[0]).toEqual({
      step: "install",
      args: [rootArg],
      cwd: stepCwd,
    })
    expect(runners.calls[1]).toEqual({
      step: "init",
      args: [resolvedRoot],
      cwd: stepCwd,
    })
    expect(runners.calls[2]).toEqual({ step: "labels", cwd: resolvedRoot })
    expect(runners.calls[3]).toEqual({ step: "doctor", cwd: resolvedRoot })
  })

  test("[3][19] ルート無しのときモデルフラグは install へ渡した順のまま先頭に解決済みルートが付く", async () => {
    const fixture = await createFixture()
    const runners = recordingRunners({})
    const args = ["--high-model", "high-id", "--low-model", "low-id"]
    const code = await runInProject(fixture, args, runners)
    expect(code).toBe(0)
    const root = path.resolve(fixture.projectRoot)
    expect(runners.calls[0]).toEqual({
      step: "install",
      args: [root, "--high-model", "high-id", "--low-model", "low-id"],
      cwd: root,
    })
    expect(runners.calls[1]).toEqual({
      step: "init",
      args: [root],
      cwd: root,
    })
    expect(runners.calls[2]).toEqual({ step: "labels", cwd: root })
    expect(runners.calls[3]).toEqual({ step: "doctor", cwd: root })
  })

  test("[3][19][22] ルートありのとき install へ渡す引数列はユーザーが渡した並びのまま", async () => {
    const fixture = await createFixture()
    const runners = recordingRunners({})
    const args = ["--high-model", "high-id", ".", "--low-model", "low-id"]
    const code = await runInProject(fixture, args, runners)
    expect(code).toBe(0)
    const root = path.resolve(fixture.projectRoot)
    expect(runners.calls[0]).toEqual({
      step: "install",
      args: ["--high-model", "high-id", ".", "--low-model", "low-id"],
      cwd: root,
    })
    expect(runners.calls[1]).toEqual({
      step: "init",
      args: [root],
      cwd: root,
    })
    expect(runners.calls[2]).toEqual({ step: "labels", cwd: root })
    expect(runners.calls[3]).toEqual({ step: "doctor", cwd: root })
  })

  test("[17] GhRunner を注入し一時ディレクトリだけを使う", async () => {
    const fixture = await createFixture()
    const runners = recordingRunners({})
    const code = await runInProject(fixture, [], runners)
    expect(code).toBe(0)
    expect(fixture.fakeHome.startsWith(os.tmpdir())).toBe(true)
    expect(fixture.projectRoot.startsWith(os.tmpdir())).toBe(true)
    expect(fixture.fakeHome).not.toBe(os.homedir())
    expect(typeof runSetup).toBe("function")
  })

  test("[20][23] 解析失敗のとき段は呼ばず stderr と終了コードは install と同じ", async () => {
    const fixture = await createFixture()
    for (const args of [["--model"], ["a", "b"]] as const) {
      const installRef = await runCliSubcommand("install", [...args], fixture.projectRoot)
      const runners = recordingRunners({})
      const setupResult = await captureRunSetup(fixture, [...args], runners)
      expect(setupResult.code).toBe(installRef.code)
      expect(setupResult.stderr).toBe(installRef.stderr.trimEnd())
      expect(runners.calls).toEqual([])
    }
  })

  test("[24] 存在しないルートのとき段は呼ばず stderr と終了コードは install と同じ", async () => {
    const fixture = await createFixture()
    const missing = path.join(fixture.projectRoot, "missing")
    const installRef = await runCliSubcommand("install", [missing], fixture.projectRoot)
    const runners = recordingRunners({})
    const setupResult = await captureRunSetup(fixture, [missing], runners)
    expect(setupResult.code).toBe(installRef.code)
    expect(setupResult.stderr.trim()).toBe(installRef.stderr.trim())
    expect(runners.calls).toEqual([])
  })

  test("[16] setup --help は install も init も labels も doctor も実行せず終了コード 0", async () => {
    const fixture = await createFixture()
    for (const flag of ["--help", "-h"]) {
      const proc = Bun.spawn([bunExe, cliPath, "setup", flag], {
        stdout: "pipe",
        stderr: "pipe",
        cwd: fixture.projectRoot,
        env: { ...process.env, PATH: isolatedPath },
      })
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ])
      expect(await proc.exited).toBe(0)
      expect(stdout).toBe("")
      expect(stderr.length).toBeGreaterThan(0)
      expect(stderr).toContain(setupUsageLine)
    }
  })

  test("[18] printUsage に setup 行が一つあり --model が無い", () => {
    const lines: string[] = []
    const errSpy = spyOn(console, "error").mockImplementation((msg: string) => {
      lines.push(msg)
    })
    try {
      printUsage()
    } finally {
      errSpy.mockRestore()
    }
    expect(lines.filter((line) => line === setupUsageLine)).toHaveLength(1)
    for (const line of lines) {
      if (line.includes("setup")) {
        expect(line).not.toContain("--model")
      }
    }
    const initIdx = lines.indexOf("sdd-cur init [project-root]")
    expect(lines[initIdx + 1]).toBe(setupUsageLine)
  })

  test("[25] runSetup を export し cmdSetup が runSetup を呼ぶ", async () => {
    const setupSource = await readFile(setupPath, "utf8")
    expect(setupSource).toContain("export async function runSetup")
    expect(setupSource).toContain("export type SetupStepRunner")
    expect(typeof runSetup).toBe("function")

    const cliSource = await readFile(cliPath, "utf8")
    expect(cliSource).toContain('case "setup":')
    expect(cliSource).toContain("async function cmdSetup")
    expect(cliSource).toMatch(/return await runSetup\(/)
  })

  test("[9][10][11][12][13] README の他プロジェクト向け導入手順と既存節", async () => {
    const readme = await readFile(path.join(repoRoot, "README.md"), "utf8")

    const h2 = [...readme.matchAll(/^## (.+)$/gm)].map((m) => m[1])
    expect(h2[0]).toBe("他のプロジェクトで使う")
    const laterSections = [
      "前提",
      "開発中の起動",
      "公開後の起動",
      "役割",
      "ラベル",
      "ディレクトリ",
    ]
    let prev = 0
    for (const title of laterSections) {
      const idx = h2.indexOf(title)
      expect(idx).toBeGreaterThan(0)
      expect(idx).toBeGreaterThan(prev)
      prev = idx
    }

    const otherStart = readme.indexOf("## 他のプロジェクトで使う")
    const otherEnd = readme.indexOf("\n## ", otherStart + 1)
    const otherSection = readme.slice(otherStart, otherEnd)
    const stepKeys = [
      "bun add -g @paterapatera/sdd-cur",
      "sdd-cur setup",
      "sdd-cur-policy",
      "docs/policy.md",
      "sdd-cur-create-issue",
      "sdd-cur run",
      "担当者",
      "gh",
      "ログイン",
    ]
    let pos = 0
    for (const key of stepKeys) {
      const i = otherSection.indexOf(key, pos)
      expect(i).toBeGreaterThanOrEqual(0)
      pos = i + key.length
    }

    expect(readme).toContain("導入の順は `install`、`init`、`labels` である。")
    expect(readme).toContain(
      "`sdd-cur doctor` は導入の前提を一つずつ確かめるコマンドである。",
    )

    const devStart = readme.indexOf("## 開発中の起動")
    const devEnd = readme.indexOf("\n## ", devStart + 1)
    const devSection = readme.slice(devStart, devEnd)
    expect(devSection).not.toMatch(/\binit\b/)

    expect(readme).toContain(
      "課題ランナーは Project A の作業ディレクトリでは動かさない。",
    )
  })
})
