import { afterEach, describe, expect, spyOn, test } from "bun:test"
import { readFileSync } from "node:fs"
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  doctorCheckLabels,
  runDoctor,
  type CommandExists,
  type RunDoctorOptions,
} from "./doctor.ts"
import {
  type GhResult,
  type GhRunner,
  type GhRunOptions,
} from "./github.ts"
import { policyTemplate } from "./init.ts"
import {
  defaultAgentsSourceDir,
  defaultSkillsSourceDir,
  installAll,
  subagentFileNames,
} from "./install.ts"
import { quickTargetLabel, workflowLabels } from "./labels.ts"

const repoRoot = path.join(import.meta.dir, "..")
const cliPath = path.join(repoRoot, "src/cli.ts")
const bunExe = process.execPath

const TEST_REPO = "test-owner/test-repo"

const DOCTOR_WARN_SUFFIX =
  "「実装依頼」が付いているが担当者にあなたの login が無い"

type IssueFixture = { number: number; assignees: string[] }

type RecordedCall = { args: string[]; options: GhRunOptions }

function okJson(stdout: unknown): GhResult {
  return { stdout: JSON.stringify(stdout), stderr: "", exitCode: 0 }
}

function fail404(): GhResult {
  return { stdout: "", stderr: "gh: Not Found (HTTP 404)\n", exitCode: 1 }
}

function recordingRunner(
  handler: (call: RecordedCall, index: number) => GhResult,
): { runner: GhRunner; calls: RecordedCall[] } {
  const calls: RecordedCall[] = []
  const runner: GhRunner = {
    async run(args, options) {
      const call = { args, options }
      calls.push(call)
      return handler(call, calls.length - 1)
    },
  }
  return { runner, calls }
}

function defaultLabelNames(): Set<string> {
  return new Set([
    ...workflowLabels.map((entry) => entry.name),
    quickTargetLabel.name,
  ])
}

function issueListJsonItem(number: number, assignees: string[]): unknown {
  return {
    number,
    title: `issue-${number}`,
    body: "",
    state: "open",
    labels: [{ name: "実装依頼" }],
    assignees: assignees.map((login) => ({ login })),
    url: `https://github.com/${TEST_REPO}/issues/${number}`,
  }
}

function createGhRunner(options: {
  authExitCode?: number
  resolveRepo?: string | "fail"
  labelNames?: Set<string>
  issues?: IssueFixture[]
  viewerLoginFail?: boolean
  listIssuesFail?: boolean
} = {}): GhRunner {
  const authExitCode = options.authExitCode ?? 0
  const labelNames = options.labelNames ?? defaultLabelNames()
  return {
    async run(args) {
      if (args[0] === "auth" && args[1] === "status") {
        return {
          stdout: "",
          stderr: authExitCode === 0 ? "" : "not logged in",
          exitCode: authExitCode,
        }
      }
      if (args[0] === "repo" && args[1] === "view") {
        if (options.resolveRepo === "fail") {
          return { stdout: "", stderr: "no remote", exitCode: 1 }
        }
        return okJson({ nameWithOwner: options.resolveRepo ?? TEST_REPO })
      }
      if (args[0] === "api" && args[1] === "user") {
        if (options.viewerLoginFail) {
          return { stdout: "", stderr: "viewer login failed", exitCode: 1 }
        }
        return okJson({ login: "viewer" })
      }
      if (args[0] === "issue" && args[1] === "list") {
        if (options.listIssuesFail) {
          return { stdout: "", stderr: "list issues failed", exitCode: 1 }
        }
        const issues = (options.issues ?? []).map((item) =>
          issueListJsonItem(item.number, item.assignees),
        )
        return okJson(issues)
      }
      if (
        args[0] === "api" &&
        typeof args[1] === "string" &&
        args[1].includes("/labels/")
      ) {
        const encoded = args[1].split("/labels/")[1] ?? ""
        const name = decodeURIComponent(encoded)
        if (labelNames.has(name)) {
          return okJson({ name })
        }
        return fail404()
      }
      return { stdout: "", stderr: `unexpected: ${args.join(" ")}`, exitCode: 1 }
    },
  }
}

function commandExistsFrom(
  map: Partial<Record<"bun" | "gh" | "agent", boolean>>,
): CommandExists {
  return (name) => map[name] === true
}

function commandExistsAll(): CommandExists {
  return () => true
}

function lineForCheck(lines: string[], index: number): string {
  const label = doctorCheckLabels[index]
  const found = lines.find(
    (line) => line.startsWith(`OK ${label}`) || line.startsWith(`NG ${label}:`),
  )
  expect(found).toBeDefined()
  return found ?? ""
}

function expectEightCheckLinesInOrder(lines: string[]): void {
  const checkLines = lines.filter((line) =>
    doctorCheckLabels.some(
      (label) =>
        line.startsWith(`OK ${label}`) || line.startsWith(`NG ${label}:`),
    ),
  )
  expect(checkLines).toHaveLength(8)
  for (let i = 0; i < 8; i++) {
    const label = doctorCheckLabels[i]
    expect(
      checkLines[i].startsWith(`OK ${label}`) ||
        checkLines[i].startsWith(`NG ${label}:`),
    ).toBe(true)
  }
}

async function runDoctorCli(
  cwd: string,
  args: string[] = [],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([bunExe, cliPath, "doctor", ...args], {
    cwd,
    env: { ...process.env, PATH: cwd },
    stdout: "pipe",
    stderr: "pipe",
  })
  const exitCode = await proc.exited
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  return { exitCode, stdout, stderr }
}

async function snapshotTree(dir: string): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  async function walk(rel: string): Promise<void> {
    const full = rel ? path.join(dir, rel) : dir
    for (const ent of await readdir(full, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${ent.name}` : ent.name
      if (ent.isDirectory()) {
        await walk(childRel)
      } else if (ent.isFile()) {
        map.set(childRel, await readFile(path.join(dir, childRel), "utf8"))
      }
    }
  }
  await walk("")
  return map
}

async function setupPassingChecks(f: DoctorFixture): Promise<void> {
  await setupGitRoot(f.root)
  await setupDocsLayout(f.root, "独自の方針\n")
  await installCursorToProject(
    f.root,
    f.fakeHome,
    f.skillsSourceDir,
    f.agentsSourceDir,
  )
}

function wrapGhRunner(
  inner: GhRunner,
  calls: RecordedCall[],
): GhRunner {
  return {
    async run(args, options) {
      calls.push({ args, options })
      return inner.run(args, options)
    },
  }
}

async function captureRunDoctor(
  options: RunDoctorOptions,
): Promise<{ code: number; lines: string[]; stderrLines: string[] }> {
  const lines: string[] = []
  const stderrLines: string[] = []
  const logSpy = spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(" "))
  })
  const errSpy = spyOn(console, "error").mockImplementation(
    (...args: unknown[]) => {
      stderrLines.push(args.map(String).join(" "))
    },
  )
  try {
    const code = await runDoctor(options)
    return { code, lines, stderrLines }
  } finally {
    logSpy.mockRestore()
    errSpy.mockRestore()
  }
}

async function writeMinimalPackage(
  base: string,
): Promise<{ skillsSourceDir: string; agentsSourceDir: string }> {
  const skillsSourceDir = path.join(base, "skills-src")
  const agentsSourceDir = path.join(base, "agents-src")
  await mkdir(path.join(skillsSourceDir, "mini-skill"), { recursive: true })
  await writeFile(
    path.join(skillsSourceDir, "mini-skill", "SKILL.md"),
    "mini-skill-content\n",
  )
  await mkdir(agentsSourceDir, { recursive: true })
  for (const name of subagentFileNames) {
    await writeFile(
      path.join(agentsSourceDir, name),
      `---\nname: ${name}\nmodel: test-model\ndescription: test\n---\n\n# ${name}\n`,
    )
  }
  return { skillsSourceDir, agentsSourceDir }
}

async function setupGitRoot(root: string): Promise<void> {
  await mkdir(path.join(root, ".git"), { recursive: true })
}

async function setupDocsLayout(
  root: string,
  policyContent: string,
): Promise<void> {
  await mkdir(path.join(root, "docs/canonical"), { recursive: true })
  await mkdir(path.join(root, "docs/issues"), { recursive: true })
  await writeFile(path.join(root, "docs/policy.md"), policyContent)
}

async function installCursorToProject(
  projectRoot: string,
  fakeHome: string,
  skillsSourceDir: string,
  agentsSourceDir: string,
): Promise<void> {
  await installAll({
    homedir: fakeHome,
    projectRoot,
    skillsSourceDir,
    agentsSourceDir,
  })
}

type DoctorFixture = {
  root: string
  fakeHome: string
  skillsSourceDir: string
  agentsSourceDir: string
}

async function createDoctorFixture(): Promise<DoctorFixture> {
  const root = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-164-"))
  const fakeHome = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-164-home-"))
  const { skillsSourceDir, agentsSourceDir } = await writeMinimalPackage(root)
  return { root, fakeHome, skillsSourceDir, agentsSourceDir }
}

function baseDoctorOptions(
  fixture: DoctorFixture,
  overrides: Partial<RunDoctorOptions> = {},
): RunDoctorOptions {
  return {
    cwd: fixture.root,
    homedir: fixture.fakeHome,
    skillsSourceDir: fixture.skillsSourceDir,
    agentsSourceDir: fixture.agentsSourceDir,
    commandExists: commandExistsAll(),
    gh: createGhRunner(),
    ...overrides,
  }
}

describe("164 doctor", () => {
  const fixtures: DoctorFixture[] = []

  afterEach(async () => {
    while (fixtures.length > 0) {
      const fixture = fixtures.pop()
      if (fixture) {
        await rm(fixture.root, { recursive: true, force: true })
        await rm(fixture.fakeHome, { recursive: true, force: true })
      }
    }
  })

  async function fixture(): Promise<DoctorFixture> {
    const f = await createDoctorFixture()
    fixtures.push(f)
    return f
  }

  test("[5] bun ありは OK", async () => {
    const f = await fixture()
    const { lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        commandExists: commandExistsFrom({ bun: true, gh: false, agent: false }),
      }),
    )
    expect(lineForCheck(lines, 0)).toBe(`OK ${doctorCheckLabels[0]}`)
  })

  test("[6] bun なしは NG", async () => {
    const f = await fixture()
    const { lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        commandExists: commandExistsFrom({ bun: false }),
      }),
    )
    expect(lineForCheck(lines, 0)).toBe(
      `NG ${doctorCheckLabels[0]}: bun がありません`,
    )
  })

  test("[7] gh ありで auth status 成功は OK", async () => {
    const f = await fixture()
    const { lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        commandExists: commandExistsFrom({ gh: true }),
        gh: createGhRunner({ authExitCode: 0 }),
      }),
    )
    expect(lineForCheck(lines, 1)).toBe(`OK ${doctorCheckLabels[1]}`)
  })

  test("[8] gh なしは auth status を呼ばず NG", async () => {
    const f = await fixture()
    const { runner, calls } = recordingRunner(() =>
      okJson({ nameWithOwner: TEST_REPO }),
    )
    const { lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        commandExists: commandExistsFrom({ gh: false }),
        gh: runner,
      }),
    )
    expect(
      calls.some((call) => call.args[0] === "auth" && call.args[1] === "status"),
    ).toBe(false)
    expect(lineForCheck(lines, 1)).toBe(
      `NG ${doctorCheckLabels[1]}: gh がありません`,
    )
  })

  test("[9] gh auth status 失敗は NG", async () => {
    const f = await fixture()
    const { lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        commandExists: commandExistsFrom({ gh: true }),
        gh: createGhRunner({ authExitCode: 1 }),
      }),
    )
    expect(lineForCheck(lines, 1)).toBe(
      `NG ${doctorCheckLabels[1]}: gh auth status が失敗しました`,
    )
  })

  test("[10] agent ありは OK", async () => {
    const f = await fixture()
    const { lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        commandExists: commandExistsFrom({ agent: true }),
      }),
    )
    expect(lineForCheck(lines, 2)).toBe(`OK ${doctorCheckLabels[2]}`)
  })

  test("[11] agent なしは NG", async () => {
    const f = await fixture()
    const { lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        commandExists: commandExistsFrom({ agent: false }),
      }),
    )
    expect(lineForCheck(lines, 2)).toBe(
      `NG ${doctorCheckLabels[2]}: agent コマンドがありません`,
    )
  })

  test("[12] コマンド有無は注入の戻り値で決まる", async () => {
    const f = await fixture()
    let bunSeen = false
    const commandExists: CommandExists = (name) => {
      if (name === "bun") {
        bunSeen = true
        return true
      }
      return false
    }
    const { lines } = await captureRunDoctor(
      baseDoctorOptions(f, { commandExists }),
    )
    expect(bunSeen).toBe(true)
    expect(lineForCheck(lines, 0)).toBe(`OK ${doctorCheckLabels[0]}`)
    expect(lineForCheck(lines, 1)).toBe(
      `NG ${doctorCheckLabels[1]}: gh がありません`,
    )
  })

  test("[13] git と resolveRepo 成功は OK", async () => {
    const f = await fixture()
    await setupGitRoot(f.root)
    const { lines } = await captureRunDoctor(baseDoctorOptions(f))
    expect(lineForCheck(lines, 3)).toBe(`OK ${doctorCheckLabels[3]}`)
  })

  test("[14] .git が無いとき git 検査は NG", async () => {
    const f = await fixture()
    const { lines } = await captureRunDoctor(baseDoctorOptions(f))
    expect(lineForCheck(lines, 3)).toBe(
      `NG ${doctorCheckLabels[3]}: git リポジトリではありません`,
    )
  })

  test("[15] resolveRepo 失敗は NG", async () => {
    const f = await fixture()
    await setupGitRoot(f.root)
    const { lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        gh: createGhRunner({ resolveRepo: "fail" }),
      }),
    )
    const line = lineForCheck(lines, 3)
    expect(line.startsWith(`NG ${doctorCheckLabels[3]}:`)).toBe(true)
    expect(line).not.toBe(`OK ${doctorCheckLabels[3]}`)
  })

  test("[16] 業務ラベルと quick 対象が揃うとき OK", async () => {
    const f = await fixture()
    await setupGitRoot(f.root)
    const { lines } = await captureRunDoctor(baseDoctorOptions(f))
    expect(lineForCheck(lines, 4)).toBe(`OK ${doctorCheckLabels[4]}`)
  })

  test("[17] ラベル不足は NG で sdd-cur labels を案内", async () => {
    const f = await fixture()
    await setupGitRoot(f.root)
    const missing = quickTargetLabel.name
    const present = new Set(defaultLabelNames())
    present.delete(missing)
    const { lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        gh: createGhRunner({ labelNames: present }),
      }),
    )
    const line = lineForCheck(lines, 4)
    expect(line.startsWith(`NG ${doctorCheckLabels[4]}:`)).toBe(true)
    expect(line).toContain("sdd-cur labels")
  })

  test("[18] policy が雛形と違うとき OK", async () => {
    const f = await fixture()
    await mkdir(path.join(f.root, "docs"), { recursive: true })
    await writeFile(path.join(f.root, "docs/policy.md"), "独自の方針\n")
    const { lines } = await captureRunDoctor(baseDoctorOptions(f))
    expect(lineForCheck(lines, 5)).toBe(`OK ${doctorCheckLabels[5]}`)
  })

  test("[19] policy が無いとき NG", async () => {
    const f = await fixture()
    const { lines } = await captureRunDoctor(baseDoctorOptions(f))
    expect(lineForCheck(lines, 5)).toBe(
      `NG ${doctorCheckLabels[5]}: docs/policy.md がありません`,
    )
  })

  test("[20] policy が雛形のままは NG で sdd-cur-policy", async () => {
    const f = await fixture()
    await mkdir(path.join(f.root, "docs"), { recursive: true })
    await writeFile(path.join(f.root, "docs/policy.md"), policyTemplate)
    const { lines } = await captureRunDoctor(baseDoctorOptions(f))
    const line = lineForCheck(lines, 5)
    expect(line.startsWith(`NG ${doctorCheckLabels[5]}:`)).toBe(true)
    expect(line).toContain("sdd-cur-policy")
  })

  test("[21] docs/canonical と docs/issues があるとき OK", async () => {
    const f = await fixture()
    await setupDocsLayout(f.root, "方針\n")
    const { lines } = await captureRunDoctor(baseDoctorOptions(f))
    expect(lineForCheck(lines, 6)).toBe(`OK ${doctorCheckLabels[6]}`)
  })

  test("[22] canonical または issues が無いとき NG", async () => {
    const f = await fixture()
    await mkdir(path.join(f.root, "docs/issues"), { recursive: true })
    const { lines } = await captureRunDoctor(baseDoctorOptions(f))
    expect(lineForCheck(lines, 6)).toBe(
      `NG ${doctorCheckLabels[6]}: docs/canonical/ または docs/issues/ がありません`,
    )
  })

  test("[23] スキル不一致は NG で sdd-cur install", async () => {
    const f = await fixture()
    await installCursorToProject(
      f.root,
      f.fakeHome,
      f.skillsSourceDir,
      f.agentsSourceDir,
    )
    const skillPath = path.join(
      f.root,
      ".cursor",
      "skills",
      "mini-skill",
      "SKILL.md",
    )
    await writeFile(skillPath, "changed\n")
    const { lines } = await captureRunDoctor(baseDoctorOptions(f))
    const line = lineForCheck(lines, 7)
    expect(line.startsWith(`NG ${doctorCheckLabels[7]}:`)).toBe(true)
    expect(line).toContain("sdd-cur install")
  })

  test("[40] パッケージと <root>/.cursor が一致するとき OK", async () => {
    const f = await fixture()
    await installCursorToProject(
      f.root,
      f.fakeHome,
      defaultSkillsSourceDir,
      defaultAgentsSourceDir,
    )
    const { lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        skillsSourceDir: defaultSkillsSourceDir,
        agentsSourceDir: defaultAgentsSourceDir,
      }),
    )
    expect(lineForCheck(lines, 7)).toBe(`OK ${doctorCheckLabels[7]}`)
  })

  test("[41] ホームだけ一致しても <root>/.cursor を見る", async () => {
    const f = await fixture()
    await installAll({
      homedir: f.fakeHome,
      projectRoot: undefined,
      skillsSourceDir: f.skillsSourceDir,
      agentsSourceDir: f.agentsSourceDir,
    })
    const { lines } = await captureRunDoctor(baseDoctorOptions(f))
    const line = lineForCheck(lines, 7)
    expect(line.startsWith(`NG ${doctorCheckLabels[7]}:`)).toBe(true)
    expect(line).toContain("sdd-cur install")
  })

  test("[41] ホームだけ一致でもプロジェクト側が揃えば OK", async () => {
    const f = await fixture()
    await installAll({
      homedir: f.fakeHome,
      projectRoot: undefined,
      skillsSourceDir: f.skillsSourceDir,
      agentsSourceDir: f.agentsSourceDir,
    })
    await installCursorToProject(
      f.root,
      f.fakeHome,
      f.skillsSourceDir,
      f.agentsSourceDir,
    )
    const { lines } = await captureRunDoctor(baseDoctorOptions(f))
    expect(lineForCheck(lines, 7)).toBe(`OK ${doctorCheckLabels[7]}`)
  })

  test("[1] CLI doctor はカレントで八つの検査行を標準出力へ", async () => {
    const f = await fixture()
    const { exitCode, stdout } = await runDoctorCli(f.root)
    const lines = stdout
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0)
    expectEightCheckLinesInOrder(lines)
    expect(exitCode).toBeGreaterThanOrEqual(0)
  })

  test("[24] NG が混ざっても八つの検査行をすべて出す", async () => {
    const f = await fixture()
    const { lines } = await captureRunDoctor(baseDoctorOptions(f))
    expectEightCheckLinesInOrder(lines)
  })

  test("[25] 一つ以上 NG のとき終了コード 1", async () => {
    const f = await fixture()
    const { code } = await captureRunDoctor(baseDoctorOptions(f))
    expect(code).toBe(1)
  })

  test("[26] 八つすべて OK で警告なしのとき終了コード 0", async () => {
    const f = await fixture()
    await setupPassingChecks(f)
    const { code, lines } = await captureRunDoctor(baseDoctorOptions(f))
    expect(code).toBe(0)
    expect(lines.some((line) => line.startsWith("WARN "))).toBe(false)
  })

  test("[27] 八つすべて OK で警告ありでも終了コード 0", async () => {
    const f = await fixture()
    await setupPassingChecks(f)
    const { code, lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        gh: createGhRunner({
          issues: [{ number: 7, assignees: ["other"] }],
        }),
      }),
    )
    expect(code).toBe(0)
    expect(lines.some((line) => line.startsWith("WARN #7:"))).toBe(true)
  })

  test("[28] 警告対象は八行のあと番号昇順で WARN 行", async () => {
    const f = await fixture()
    await setupPassingChecks(f)
    const { lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        gh: createGhRunner({
          issues: [
            { number: 50, assignees: ["other"] },
            { number: 10, assignees: [] },
            { number: 20, assignees: ["viewer"] },
          ],
        }),
      }),
    )
    expectEightCheckLinesInOrder(lines)
    const warnLines = lines.filter((line) => line.startsWith("WARN #"))
    expect(warnLines).toEqual([
      `WARN #10: ${DOCTOR_WARN_SUFFIX}`,
      `WARN #50: ${DOCTOR_WARN_SUFFIX}`,
    ])
  })

  test("[29] NG ありでも警告は八行のあとで終了コード 1", async () => {
    const f = await fixture()
    await setupPassingChecks(f)
    const { code, lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        commandExists: (name) => name !== "agent",
        gh: createGhRunner({
          issues: [{ number: 3, assignees: ["other"] }],
        }),
      }),
    )
    expect(code).toBe(1)
    expectEightCheckLinesInOrder(lines)
    const checkEnd = lines.findLastIndex((line) =>
      doctorCheckLabels.some(
        (label) =>
          line.startsWith(`OK ${label}`) || line.startsWith(`NG ${label}:`),
      ),
    )
    const warnIdx = lines.findIndex((line) => line.startsWith("WARN #3:"))
    expect(warnIdx).toBeGreaterThan(checkEnd)
  })

  test("[30] 警告対象が無いとき WARN 行は出ない", async () => {
    const f = await fixture()
    await setupPassingChecks(f)
    const { lines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        gh: createGhRunner({
          issues: [
            { number: 1, assignees: ["viewer"] },
            { number: 2, assignees: ["viewer", "other"] },
          ],
        }),
      }),
    )
    expect(lines.some((line) => line.startsWith("WARN "))).toBe(false)
  })

  test("[31] 実行でファイルもラベルも変わらない", async () => {
    const f = await fixture()
    await setupPassingChecks(f)
    const before = await snapshotTree(f.root)
    const { code } = await captureRunDoctor(baseDoctorOptions(f))
    const after = await snapshotTree(f.root)
    expect(code).toBe(0)
    expect(after.size).toBe(before.size)
    for (const [rel, content] of before) {
      expect(after.get(rel)).toBe(content)
    }
  })

  test("[32] gh の起動は注入された GhRunner を通す", async () => {
    const f = await fixture()
    await setupPassingChecks(f)
    const calls: RecordedCall[] = []
    const inner = createGhRunner()
    const { code } = await captureRunDoctor(
      baseDoctorOptions(f, { gh: wrapGhRunner(inner, calls) }),
    )
    expect(code).toBe(0)
    expect(
      calls.some(
        (call) => call.args[0] === "auth" && call.args[1] === "status",
      ),
    ).toBe(true)
    expect(calls.some((call) => call.args[0] === "repo")).toBe(true)
    expect(
      calls.some((call) => call.args[0] === "api" && call.args[1] === "user"),
    ).toBe(true)
    expect(calls.some((call) => call.args[0] === "issue")).toBe(true)
  })

  test("[33] runDoctor を export し一時ディレクトリだけ使う", () => {
    expect(typeof runDoctor).toBe("function")
  })

  test("[34] cli の doctor が runDoctor を呼ぶ", () => {
    const cli = readFileSync(cliPath, "utf8")
    expect(cli).toContain('case "doctor":')
    expect(cli).toContain("async function cmdDoctor")
    expect(cli).toContain("runDoctor(")
  })

  test("[42] viewerLogin 失敗で WARN 無し・標準エラー一行・終了コードは検査のみ", async () => {
    const f = await fixture()
    await setupPassingChecks(f)
    const { code, lines, stderrLines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        gh: createGhRunner({ viewerLoginFail: true }),
      }),
    )
    expect(code).toBe(0)
    expect(lines.some((line) => line.startsWith("WARN "))).toBe(false)
    expect(stderrLines).toEqual(["viewer login failed"])
  })

  test("[42] listIssues 失敗でも終了コードは八つの検査だけ", async () => {
    const f = await fixture()
    await setupPassingChecks(f)
    const { code, lines, stderrLines } = await captureRunDoctor(
      baseDoctorOptions(f, {
        gh: createGhRunner({ listIssuesFail: true }),
      }),
    )
    expect(code).toBe(0)
    expect(lines.some((line) => line.startsWith("WARN "))).toBe(false)
    expect(stderrLines).toEqual(["list issues failed"])
  })

  test("[43] 余分な引数は検査せず終了コード 1", async () => {
    const f = await fixture()
    for (const extra of [["foo"], ["--help"], ["-h"], ["foo", "bar"]] as const) {
      const { exitCode, stdout, stderr } = await runDoctorCli(f.root, [...extra])
      expect(exitCode).toBe(1)
      expect(stdout).toBe("")
      expect(stderr).toBe("引数は受け取れません\n")
    }
  })

  test("[35][36] policy と AGENTS に doctor", () => {
    const policy = readFileSync(path.join(repoRoot, "docs/policy.md"), "utf8")
    expect(policy).toContain("| `src/doctor.ts` |")
    expect(policyCliTableHasDoctor(policy)).toBe(true)

    const agents = readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8")
    expect(agents).toContain("bun src/cli.ts doctor")
  })

  test("[37] README は sdd-cur doctor を導入の前提の確認として書く", () => {
    const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8")
    expect(readme).toContain("導入の順は `install`、`init`、`labels` である。")
    expect(readme).toContain(
      "`sdd-cur doctor` は導入の前提を一つずつ確かめるコマンドである。",
    )
  })

  test("[38] 正本に doctor の追加と docs の差分がある", () => {
    const doctorDoc = readFileSync(
      path.join(repoRoot, "docs/canonical/doctor.md"),
      "utf8",
    )
    for (const id of [
      "REQ-923",
      "REQ-935",
      "REQ-924",
      "REQ-925",
      "REQ-926",
      "REQ-927",
      "REQ-928",
      "REQ-929",
      "REQ-930",
      "REQ-931",
      "REQ-932",
    ]) {
      expect(doctorDoc).toContain(`## ${id}`)
    }
    const docsDoc = readFileSync(
      path.join(repoRoot, "docs/canonical/docs.md"),
      "utf8",
    )
    expect(docsDoc).toContain("## REQ-890")
    expect(docsDoc).toContain("## REQ-891")
    expect(docsDoc).toContain("## REQ-933")
    expect(docsDoc).toContain("## REQ-934")
    expect(docsDoc).toContain(
      "バッククォートで囲んだ `doctor` と `setup` を含む",
    )
    expect(docsDoc).toContain("`bun src/cli.ts doctor` の行がある")
    expect(docsDoc).toContain("`bun src/cli.ts setup` で始まる行がある")
  })

  test("[39] selectImplementationIssue は担当者の login で残す", () => {
    const source = readFileSync(path.join(repoRoot, "src/runner.ts"), "utf8")
    const start = source.indexOf("export function selectImplementationIssue(")
    const end = source.indexOf("\nexport function issueHasFixLabels(")
    const body = source.slice(start, end)
    expect(body).toContain(
      "if (!issue.assignees.includes(login)) {\n      return false\n    }",
    )
  })
})

function policyCliTableHasDoctor(policy: string): boolean {
  for (const line of policy.split("\n")) {
    if (line.startsWith("| `src/cli.ts` |")) {
      return line.includes("`doctor`")
    }
  }
  return false
}
