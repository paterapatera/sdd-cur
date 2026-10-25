import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import type { CommandExists } from "./doctor.ts"
import type { GhRunner } from "./github.ts"
import {
  defaultAgentsSourceDir,
  defaultSkillsSourceDir,
} from "./install.ts"
import { runSetup } from "./setup.ts"

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

  async function runInProject(
    fixture: SetupFixture,
    args: string[],
    runners: RecordingRunners,
  ): Promise<number> {
    process.chdir(fixture.projectRoot)
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
})
