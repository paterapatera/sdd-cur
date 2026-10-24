import { describe, expect, test } from "bun:test"
import { execSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { readFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import {
  extractTestRefs,
  firstSectionBody,
  sectionBodies,
} from "./conventions.ts"

const root = path.join(import.meta.dir, "..")
const cliPath = path.join(import.meta.dir, "cli.ts")
const bunExe = process.execPath

const exampleDesign = `# 7 例

## 作業の一覧

前置き
- 1. 一つ目を書く [1]
### 途中
- 2. 二つ目を書く [2][2]
- 5. 括弧が無い
2. ダッシュが無い [9]
- 0. 零
- 01. 零始まり

## 別

- 3. ここは作業の一覧ではない [3]

## テスト

\`bun test\` で実行する。\`gh\` は起動しない。

\`\`\`
echo a

echo b
\`\`\`

- \`bun src/cli.ts tasks 7\` を実行する

## テスト

\`sdd-cur show 7\` を見る。

## 作業の一覧

- 4. 二度目は使わない [4]
`

const exampleJson =
  '{"tasks":[{"number":1,"line":"- 1. 一つ目を書く [1]","refs":[1],"done":false},{"number":2,"line":"- 2. 二つ目を書く [2][2]","refs":[2,2],"done":false},{"number":5,"line":"- 5. 括弧が無い","refs":[],"done":false}],"testCommands":["bun test","echo a","echo b","sdd-cur show 7"]}\n'

function git(cwd: string, command: string): void {
  execSync(`git ${command}`, { cwd, stdio: "pipe" })
}

function initTasksGitRepo(cwd: string): void {
  git(cwd, "init -b main")
  git(cwd, "config user.email t@example.com")
  git(cwd, "config user.name t")
  git(cwd, "commit --allow-empty -m init")
  const bare = path.join(
    path.dirname(cwd),
    `${path.basename(cwd)}-origin.git`,
  )
  git(cwd, `init --bare -b main "${bare}"`)
  git(cwd, `remote add origin "${bare}"`)
  git(cwd, "push -u origin main")
}

async function runTasks(
  cwd: string,
  args: string[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([bunExe, cliPath, "tasks", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      PATH: `${path.dirname(bunExe)}${path.delimiter}${process.env.PATH ?? ""}`,
    },
  })
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  return { exitCode: await proc.exited, stdout, stderr }
}

async function withTemp(
  fn: (temp: string) => Promise<void>,
): Promise<void> {
  const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-121-"))
  try {
    await fn(temp)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

describe("121 tasks", () => {
  test("switch と usage に tasks がある", () => {
    const cli = readFileSync(cliPath, "utf8")
    expect(cli).toContain('case "tasks":')
    expect(cli).toContain("sdd-cur tasks <番号>")
    expect(cli).toContain("firstSectionBody")
    expect(cli).toContain("sectionBodies")
    expect(cli).not.toMatch(/function isWorkListItemLine/)
    expect(cli).not.toMatch(/function firstSectionBody/)
    expect(cli).not.toMatch(/function extractTestRefs/)
  })

  test("例の design.md", async () => {
    await withTemp(async (temp) => {
      initTasksGitRepo(temp)
      const designPath = path.join(temp, "docs/issues/7/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(designPath, exampleDesign, "utf8")
      const { exitCode, stdout, stderr } = await runTasks(temp, ["7"])
      expect(exitCode).toBe(0)
      expect(stderr).toBe("")
      expect(stdout).toBe(exampleJson)
    })
  })

  test("作業の一覧のあとに ## が無い", async () => {
    await withTemp(async (temp) => {
      initTasksGitRepo(temp)
      const designPath = path.join(temp, "docs/issues/7/design.md")
      await mkdir(path.dirname(designPath), { recursive: true })
      await writeFile(
        designPath,
        "## 作業の一覧\n### 子\n- 1. 末尾 [8]\n",
        "utf8",
      )
      const { exitCode, stdout, stderr } = await runTasks(temp, ["7"])
      expect(exitCode).toBe(0)
      const parsed = JSON.parse(stdout.trim()) as {
        tasks: { line: string; refs: number[] }[]
        testCommands: string[]
      }
      expect(parsed.tasks).toHaveLength(1)
      expect(parsed.tasks[0].line).toBe("- 1. 末尾 [8]")
      expect(parsed.tasks[0].refs).toEqual([8])
      expect(parsed.tasks[0].done).toBe(false)
      expect(parsed.testCommands).toEqual([])
      expect(stderr).toBe("")
    })
  })

  test("設計が無い・空・作業なし・読めない", async () => {
    await withTemp(async (temp) => {
      const dir = path.join(temp, "docs/issues/7")
      await mkdir(dir, { recursive: true })
      for (const [setup, err] of [
        [async () => {}, "設計に作業の一覧がありません"],
        [async () => writeFile(path.join(dir, "design.md"), "", "utf8"), "設計に作業の一覧がありません"],
        [
          async () =>
            writeFile(
              path.join(dir, "design.md"),
              "## 作業の一覧\n- 0. 零\n",
              "utf8",
            ),
          "作業の一覧に作業がありません",
        ],
        [async () => mkdir(path.join(dir, "design.md"), { recursive: true }), "仕様を読めません"],
      ] as const) {
        await rm(dir, { recursive: true, force: true })
        await mkdir(dir, { recursive: true })
        await setup()
        const { exitCode, stdout, stderr } = await runTasks(temp, ["7"])
        expect(exitCode).toBe(1)
        expect(stdout).toBe("")
        expect(stderr.trim()).toBe(err)
      }
    })
  })

  test("引数と help", async () => {
    const noArgs = Bun.spawn([bunExe, cliPath], {
      stdout: "pipe",
      stderr: "pipe",
      cwd: root,
    })
    const noArgsErr = await new Response(noArgs.stderr).text()
    await noArgs.exited

    await withTemp(async (temp) => {
      const { exitCode, stdout, stderr } = await runTasks(temp, [])
      expect(exitCode).toBe(1)
      expect(stdout).toBe("")
      expect(stderr).toBe(noArgsErr)

      const two = await runTasks(temp, ["1", "2"])
      expect(two.exitCode).toBe(1)
      expect(two.stdout).toBe("")
      expect(two.stderr).toBe(noArgsErr)

      for (const bad of ["0", "01", "a"]) {
        const r = await runTasks(temp, [bad])
        expect(r.exitCode).toBe(1)
        expect(r.stdout).toBe("")
        expect(r.stderr.trim()).toBe("番号が不正です")
      }

      for (const args of [["--help"], ["1", "--help"]] as const) {
        const proc = Bun.spawn([bunExe, cliPath, "tasks", ...args], {
          cwd: temp,
          stdout: "pipe",
          stderr: "pipe",
        })
        expect(await proc.exited).toBe(0)
        const stderr = await new Response(proc.stderr).text()
        expect(await new Response(proc.stdout).text()).toBe("")
        expect(stderr.split("\n")).toContain("sdd-cur tasks <番号>")
      }
    })
  })

  test("firstSectionBody と sectionBodies", () => {
    const bodies = sectionBodies(exampleDesign, "作業の一覧")
    expect(bodies).toHaveLength(2)
    expect(firstSectionBody(exampleDesign, "作業の一覧")).toBe(bodies[0])
    expect(extractTestRefs("[1][1][01][0]")).toEqual([1, 1])
  })

  test("実装スキルと文書", async () => {
    const skill = await readFile(
      path.join(root, "skills/sdd-cur-implement/SKILL.md"),
      "utf8",
    )
    const phrases = [
      "sdd-cur tasks <番号>",
      "testCommands",
      "その要素の `line`",
      "その要素の `refs`",
      "設計に作業の一覧がありません",
      "作業の一覧に作業がありません",
      "仕様を読めません",
      "作業の一覧の順",
      "バッククォートまたはコードフェンス",
      "明示的な手順の箇条書き",
      "実装作成が作業ツリーを変えませんでした",
      "sdd-cur review-next implement <番号>",
      "同時には起動しない",
    ]
    for (const p of phrases) {
      expect(skill).toContain(p)
    }
    expect(skill).not.toContain("作業の一覧の本文とする")
    expect(skill).not.toContain("節を終わらせない")
    expect(skill).not.toContain("`- <番号>. `")
    expect(skill).not.toContain("`<番号>. `")

    const policy = readFileSync(path.join(root, "docs/policy.md"), "utf8")
    expect(policy).toContain("`tasks`")

    const agents = readFileSync(path.join(root, "AGENTS.md"), "utf8")
    expect(agents).toContain("bun src/cli.ts tasks <番号>")
  })

  test("正本への差分の本文", () => {
    const design = readFileSync(
      path.join(root, "docs/issues/121/design.md"),
      "utf8",
    )
    const sdd = readFileSync(path.join(root, "docs/canonical/sdd.md"), "utf8")
    const implement = readFileSync(
      path.join(root, "docs/canonical/implement.md"),
      "utf8",
    )
    const docs = readFileSync(path.join(root, "docs/canonical/docs.md"), "utf8")

    const map: Record<string, string> = {
      "REQ-832": "REQ-861",
      "REQ-833": "REQ-862",
      "REQ-834": "REQ-863",
      "REQ-835": "REQ-864",
      "REQ-836": "REQ-865",
      "REQ-837": "REQ-866",
      "REQ-838": "REQ-867",
      "REQ-839": "REQ-868",
      "REQ-845": "REQ-869",
      "REQ-840": "REQ-870",
      "REQ-841": "REQ-871",
      "REQ-842": "REQ-872",
      "REQ-843": "REQ-873",
      "REQ-844": "REQ-874",
    }

    const section = design.split("## 正本への差分")[1]?.split("## 例")[0] ?? ""
    for (const m of section.matchAll(
      /^### (?:追加|変更) (\w+) (REQ-\d+)\n\n([\s\S]*?)(?=\n### |\n## |$)/gm,
    )) {
      const [, domain, designId, body] = m
      const id = m[1] === "変更" ? designId : map[designId] ?? designId
      const file =
        domain === "sdd"
          ? sdd
          : domain === "implement"
            ? implement
            : docs
      expect(file).toContain(`## ${id}`)
      const snippet = body
        .split("\n")
        .slice(1)
        .join("\n")
        .trim()
        .slice(0, 40)
      expect(file).toContain(snippet)
    }
  })
})

