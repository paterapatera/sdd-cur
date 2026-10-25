import { afterEach, describe, expect, spyOn, test } from "bun:test"
import { readFileSync } from "node:fs"
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  doctorCheckLabels,
  listSteeringNameWarningLines,
  runDoctor,
  steeringBasenameIsValid,
  type CommandExists,
  type RunDoctorOptions,
} from "./doctor.ts"
import { type GhResult, type GhRunner, type GhRunOptions } from "./github.ts"
import { initProject } from "./init.ts"
import { installAll, subagentFileNames } from "./install.ts"
import { quickTargetLabel, workflowLabels } from "./labels.ts"

const repoRoot = path.join(import.meta.dir, "..")
const TEST_REPO = "test-owner/test-repo"
const DOCTOR_WARN_SUFFIX =
  "「実装依頼」が付いているが担当者にあなたの login が無い"

type IssueFixture = { number: number; assignees: string[] }
type RecordedCall = { args: string[]; options: GhRunOptions }

function okJson(stdout: unknown): GhResult {
  return { stdout: JSON.stringify(stdout), stderr: "", exitCode: 0 }
}

function createGhRunner(
  options: {
    authExitCode?: number
    resolveRepo?: string | "fail"
    labelNames?: Set<string>
    issues?: IssueFixture[]
    viewerLoginFail?: boolean
    listIssuesFail?: boolean
  } = {},
): GhRunner {
  const authExitCode = options.authExitCode ?? 0
  const labelNames =
    options.labelNames ??
    new Set([...workflowLabels.map((e) => e.name), quickTargetLabel.name])
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
        const issues = (options.issues ?? []).map((item) => ({
          number: item.number,
          title: `issue-${item.number}`,
          body: "",
          state: "open",
          labels: [{ name: "実装依頼" }],
          assignees: item.assignees.map((login) => ({ login })),
          url: `https://github.com/${TEST_REPO}/issues/${item.number}`,
        }))
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
        return { stdout: "", stderr: "gh: Not Found (HTTP 404)\n", exitCode: 1 }
      }
      return { stdout: "", stderr: `unexpected: ${args.join(" ")}`, exitCode: 1 }
    },
  }
}

function commandExistsAll(): CommandExists {
  return () => true
}

async function captureRunDoctor(
  options: RunDoctorOptions,
): Promise<{ code: number; lines: string[]; stderrLines: string[] }> {
  const lines: string[] = []
  const stderrLines: string[] = []
  const logSpy = spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(" "))
  })
  const errSpy = spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    stderrLines.push(args.map(String).join(" "))
  })
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

async function setupPassingDoctorTree(
  root: string,
  fakeHome: string,
  skillsSourceDir: string,
  agentsSourceDir: string,
): Promise<void> {
  await mkdir(path.join(root, ".git"), { recursive: true })
  await mkdir(path.join(root, "docs/canonical"), { recursive: true })
  await mkdir(path.join(root, "docs/issues"), { recursive: true })
  await writeFile(path.join(root, "docs/policy.md"), "独自の方針\n")
  await installAll({
    homedir: fakeHome,
    projectRoot: root,
    skillsSourceDir,
    agentsSourceDir,
  })
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

// 作業 3: 十サブエージェントの起動時とレビュー指摘を更新済み。
// 作業 5: conventions.md と README を更新済み。
// 作業 6: 正本四ファイルを差分どおり更新済み。
// 作業 7: init と setup は範囲外のまま（本テストで確認）。
// 作業 6: 正本反映の追跡用コミット。
// 作業 7: init/setup 確認の追跡用コミット。

describe("199 steering", () => {
  const roots: string[] = []

  afterEach(async () => {
    while (roots.length > 0) {
      const root = roots.pop()
      if (root) {
        await rm(root, { recursive: true, force: true })
      }
    }
  })

  async function tempRoot(): Promise<string> {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-199-"))
    roots.push(root)
    return root
  }

  test("[1] docs/steering/ 直下に規則に合う md を複数置ける", async () => {
    const root = await tempRoot()
    const steering = path.join(root, "docs/steering")
    await mkdir(steering, { recursive: true })
    await writeFile(path.join(steering, "alpha.md"), "# a\n")
    await writeFile(path.join(steering, "beta.md"), "# b\n")
    const names = await readdir(steering)
    expect(names.sort()).toEqual(["alpha.md", "beta.md"])
  })

  test("[2] steeringBasenameIsValid が名前を切り分ける", () => {
    expect(steeringBasenameIsValid("good.md")).toBe(true)
    expect(steeringBasenameIsValid("my-domain.md")).toBe(true)
    expect(steeringBasenameIsValid("Bad.md")).toBe(false)
    expect(steeringBasenameIsValid("readme.txt")).toBe(false)
    expect(steeringBasenameIsValid("-bad.md")).toBe(false)
  })

  test("[12][16] steering 無しまたは違反無しで WARN 行は空", async () => {
    const root = await tempRoot()
    expect(await listSteeringNameWarningLines(root)).toEqual([])
    const steering = path.join(root, "docs/steering")
    await mkdir(steering, { recursive: true })
    await writeFile(path.join(steering, "valid.md"), "# ok\n")
    expect(await listSteeringNameWarningLines(root)).toEqual([])
  })

  test("[15][30] listSteeringNameWarningLines が違反 md だけ昇順で返す", async () => {
    const root = await tempRoot()
    const steering = path.join(root, "docs/steering")
    await mkdir(steering, { recursive: true })
    await writeFile(path.join(steering, "Bad.md"), "# bad\n")
    await writeFile(path.join(steering, "valid.md"), "# ok\n")
    await writeFile(path.join(steering, "note.txt"), "x\n")
    await mkdir(path.join(steering, "nested"), { recursive: true })
    await writeFile(path.join(steering, "nested", "Wrong.md"), "# w\n")
    expect(await listSteeringNameWarningLines(root)).toEqual([
      "WARN docs/steering/Bad.md",
    ])
  })

  test("[13] docs/steering 無しで八検査の形は変わらない", async () => {
    const root = await tempRoot()
    const fakeHome = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-199-home-"))
    roots.push(fakeHome)
    const { skillsSourceDir, agentsSourceDir } = await writeMinimalPackage(root)
    await setupPassingDoctorTree(root, fakeHome, skillsSourceDir, agentsSourceDir)
    const { code, lines } = await captureRunDoctor({
      cwd: root,
      homedir: fakeHome,
      skillsSourceDir,
      agentsSourceDir,
      commandExists: commandExistsAll(),
      gh: createGhRunner(),
    })
    expect(code).toBe(0)
    expectEightCheckLinesInOrder(lines)
    expect(lines.some((l) => l.startsWith("WARN docs/steering"))).toBe(false)
  })

  test("[14][15][29] runDoctor が八行のあと steering WARN を課題 WARN の前に出す", async () => {
    const root = await tempRoot()
    const fakeHome = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-199-home2-"))
    roots.push(fakeHome)
    const { skillsSourceDir, agentsSourceDir } = await writeMinimalPackage(root)
    await setupPassingDoctorTree(root, fakeHome, skillsSourceDir, agentsSourceDir)
    const steering = path.join(root, "docs/steering")
    await mkdir(steering, { recursive: true })
    await writeFile(path.join(steering, "Bad.md"), "# bad\n")
    const { code, lines } = await captureRunDoctor({
      cwd: root,
      homedir: fakeHome,
      skillsSourceDir,
      agentsSourceDir,
      commandExists: commandExistsAll(),
      gh: createGhRunner({
        issues: [{ number: 3, assignees: [] }],
      }),
    })
    expect(code).toBe(0)
    expectEightCheckLinesInOrder(lines)
    const steerIdx = lines.indexOf("WARN docs/steering/Bad.md")
    const issueIdx = lines.findIndex((l) => l.startsWith("WARN #3:"))
    expect(steerIdx).toBeGreaterThan(7)
    expect(issueIdx).toBeGreaterThan(steerIdx)
    expect(lines[issueIdx]).toBe(`WARN #3: ${DOCTOR_WARN_SUFFIX}`)
  })

  test("[31] viewerLogin 失敗でも steering WARN は出し課題 WARN は出さない", async () => {
    const root = await tempRoot()
    const fakeHome = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-199-home3-"))
    roots.push(fakeHome)
    const { skillsSourceDir, agentsSourceDir } = await writeMinimalPackage(root)
    await setupPassingDoctorTree(root, fakeHome, skillsSourceDir, agentsSourceDir)
    await mkdir(path.join(root, "docs/steering"), { recursive: true })
    await writeFile(path.join(root, "docs/steering", "Bad.md"), "# bad\n")
    const { code, lines, stderrLines } = await captureRunDoctor({
      cwd: root,
      homedir: fakeHome,
      skillsSourceDir,
      agentsSourceDir,
      commandExists: commandExistsAll(),
      gh: createGhRunner({ viewerLoginFail: true }),
    })
    expect(code).toBe(0)
    expect(lines).toContain("WARN docs/steering/Bad.md")
    expect(lines.some((l) => l.startsWith("WARN #"))).toBe(false)
    expect(stderrLines).toEqual(["viewer login failed"])
  })

  test("[24][25] GhRunner を注入して runDoctor を呼ぶ", async () => {
    const root = await tempRoot()
    const fakeHome = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-199-home4-"))
    roots.push(fakeHome)
    const { skillsSourceDir, agentsSourceDir } = await writeMinimalPackage(root)
    await setupPassingDoctorTree(root, fakeHome, skillsSourceDir, agentsSourceDir)
    const calls: RecordedCall[] = []
    const inner = createGhRunner()
    const gh: GhRunner = {
      async run(args, options) {
        calls.push({ args, options })
        return inner.run(args, options)
      },
    }
    await captureRunDoctor({
      cwd: root,
      homedir: fakeHome,
      skillsSourceDir,
      agentsSourceDir,
      commandExists: commandExistsAll(),
      gh,
    })
    expect(calls.some((c) => c.args[0] === "auth")).toBe(true)
  })

  test("[18][19] docs/policy.md の見出しと固定文", () => {
    const policy = readFileSync(path.join(repoRoot, "docs/policy.md"), "utf8")
    const headings = [...policy.matchAll(/^## (.+)$/gm)].map((m) => m[1])
    expect(headings).toEqual([
      "誰のための道具か",
      "技術の前提",
      "構成",
      "破ってはいけない原則",
    ])
    expect(policy).toContain(
      "このファイルを変えるのは、課題を通したときだけである。",
    )
  })

  test("[27] init は docs/steering を作らない", async () => {
    const root = await tempRoot()
    await initProject(root)
    const rels: string[] = []
    async function walk(dir: string, prefix: string): Promise<void> {
      for (const ent of await readdir(dir, { withFileTypes: true })) {
        const rel = prefix ? `${prefix}/${ent.name}` : ent.name
        if (ent.isDirectory()) {
          await walk(path.join(dir, ent.name), rel)
        } else {
          rels.push(rel)
        }
      }
    }
    await walk(root, "")
    expect(rels.some((r) => r.startsWith("docs/steering"))).toBe(false)
    expect(rels).toContain("docs/policy.md")
  })

  test("[28] setup の実行順と doctor 連携の定めは変わらない", () => {
    const setup = readFileSync(path.join(repoRoot, "src/setup.ts"), "utf8")
    expect(setup).toContain("install")
    expect(setup).toContain("init")
    expect(setup).toContain("labels")
    expect(setup).toContain("runDoctor")
  })

  test("[26] agents/sdd-cur-explore.md は課題用に変えない", () => {
    const explore = readFileSync(
      path.join(repoRoot, "agents/sdd-cur-explore.md"),
      "utf8",
    )
    expect(explore).toContain("docs/canonical/")
  })
})
