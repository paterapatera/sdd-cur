import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const repoRoot = path.join(import.meta.dir, "..")
const bunExe = process.execPath
const isolatedPath = path.dirname(bunExe)

const expectedPackageJson = {
  name: "@paterapatera/sdd-cur",
  version: "0.2.1",
  private: false,
  type: "module",
  bin: {
    "sdd-cur": "src/cli.ts",
  },
  publishConfig: {
    access: "public",
  },
  scripts: {
    "sdd-cur": "bun src/cli.ts",
    test: "bun test",
  },
}

const usageText =
  "sdd-cur install [project-root]\n" +
  "sdd-cur init [project-root]\n" +
  "sdd-cur run [--interval-min <1 以上 1440 以下の整数>]\n" +
  "sdd-cur labels\n" +
  "sdd-cur candidates\n" +
  "sdd-cur show <番号>\n" +
  "sdd-cur branch <番号>\n" +
  "sdd-cur prepare-branch <番号>\n" +
  "sdd-cur confirm <番号>\n" +
  "sdd-cur close <番号>\n" +
  "sdd-cur reflect <番号> <requirements|design>\n" +
  "sdd-cur validate <番号>\n" +
  "sdd-cur complete <番号>\n" +
  "sdd-cur spec-check\n" +
  "sdd-cur tasks <番号>\n" +
  "sdd-cur task-done <番号> <作業番号>\n" +
  "sdd-cur spec-diff <番号>\n"

async function listFilesRecursive(root: string): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string, prefix: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full, rel)
      } else if (entry.isFile()) {
        out.push(rel)
      }
    }
  }
  await walk(root, "")
  return out.sort()
}

async function readTarballMember(
  tarball: string,
  member: string,
): Promise<Buffer> {
  const proc = Bun.spawn(["tar", "-xOf", tarball, member], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    const err = await new Response(proc.stderr).text()
    throw new Error(`tar -xOf failed: ${err}`)
  }
  return Buffer.from(await new Response(proc.stdout).arrayBuffer())
}

async function packToDestination(destDir: string): Promise<string> {
  const proc = Bun.spawn(["bun", "pm", "pack", "--destination", destDir], {
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
  })
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    const err = await new Response(proc.stderr).text()
    throw new Error(`bun pm pack failed: ${err}`)
  }
  const entries = await readdir(destDir)
  const tgz = entries.find((e) => e.endsWith(".tgz"))
  if (!tgz) {
    throw new Error("tarball not found after pack")
  }
  return path.join(destDir, tgz)
}

async function installPackedPackage(tarball: string): Promise<{
  projectDir: string
  binPath: string
  packageDir: string
}> {
  const projectDir = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-pack-add-"))
  await writeFile(
    path.join(projectDir, "package.json"),
    JSON.stringify({ name: "sdd-cur-pack-consumer", version: "0.0.0", private: true }),
  )
  const proc = Bun.spawn(["bun", "add", tarball], {
    cwd: projectDir,
    stdout: "pipe",
    stderr: "pipe",
  })
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    const err = await new Response(proc.stderr).text()
    await rm(projectDir, { recursive: true, force: true })
    throw new Error(`bun add failed: ${err}`)
  }
  return {
    projectDir,
    binPath: path.join(projectDir, "node_modules", ".bin", "sdd-cur"),
    packageDir: path.join(projectDir, "node_modules", "@paterapatera", "sdd-cur"),
  }
}

function spawnInstalledBin(binPath: string, args: string[], cwd?: string) {
  return Bun.spawn([binPath, ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, PATH: isolatedPath },
  })
}

describe("package publish shape", () => {
  test("package.json は設計どおり", async () => {
    const raw = await readFile(path.join(repoRoot, "package.json"), "utf8")
    const parsed = JSON.parse(raw) as Record<string, unknown>
    expect(parsed).toEqual(expectedPackageJson)
  })

  test("src/cli.ts の先頭行は shebang", async () => {
    const first = (await readFile(path.join(repoRoot, "src", "cli.ts"), "utf8"))
      .split("\n")[0]
    expect(first).toBe("#!/usr/bin/env bun")
  })

  test("bun pm pack の tarball に skills/ agents/ src/cli.ts が入る", async () => {
    const packDest = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-pack-"))
    try {
      const tarball = await packToDestination(packDest)
      for (const rel of await listFilesRecursive(path.join(repoRoot, "skills"))) {
        const repoContent = await readFile(
          path.join(repoRoot, "skills", rel),
        )
        const packed = await readTarballMember(
          tarball,
          `package/skills/${rel.replace(/\\/g, "/")}`,
        )
        expect(packed.equals(repoContent)).toBe(true)
      }
      for (const rel of await listFilesRecursive(path.join(repoRoot, "agents"))) {
        const repoContent = await readFile(
          path.join(repoRoot, "agents", rel),
        )
        const packed = await readTarballMember(
          tarball,
          `package/agents/${rel.replace(/\\/g, "/")}`,
        )
        expect(packed.equals(repoContent)).toBe(true)
      }
      const cliPacked = await readTarballMember(tarball, "package/src/cli.ts")
      const cliRepo = await readFile(path.join(repoRoot, "src", "cli.ts"))
      expect(cliPacked.equals(cliRepo)).toBe(true)
    } finally {
      await rm(packDest, { recursive: true, force: true })
    }
  })
})

describe("installed bin", () => {
  let projectDir: string
  let binPath: string
  let packageDir: string
  let packDest: string

  beforeAll(async () => {
    packDest = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-pack-out-"))
    const tarball = await packToDestination(packDest)
    ;({ projectDir, binPath, packageDir } = await installPackedPackage(tarball))
  })

  afterAll(async () => {
    await rm(projectDir, { recursive: true, force: true })
    await rm(packDest, { recursive: true, force: true })
  })

  test("--help は終了コード 0 で使い方の十一行", async () => {
    const proc = spawnInstalledBin(binPath, ["--help"])
    expect(await proc.exited).toBe(0)
    expect(await new Response(proc.stderr).text()).toBe(usageText)
  })

  test("run --interval-min 0 はエラー行のあと使い方の十一行", async () => {
    const proc = spawnInstalledBin(binPath, ["run", "--interval-min", "0"])
    expect(await proc.exited).toBe(1)
    const stderr = await new Response(proc.stderr).text()
    expect(stderr).toBe(
      `--interval-min は 1 以上 1440 以下の整数です\n${usageText}`,
    )
  })

  test("labels と candidates は gh を実行できません", async () => {
    for (const sub of ["labels", "candidates"] as const) {
      const proc = spawnInstalledBin(binPath, [sub])
      expect(await proc.exited).toBe(1)
      expect(await new Response(proc.stderr).text().then((s) => s.trim())).toBe(
        "gh を実行できません",
      )
    }
  })

  test("show confirm complete の 01 は番号が不正です", async () => {
    for (const sub of ["show", "confirm", "complete"] as const) {
      const proc = spawnInstalledBin(binPath, [sub, "01"])
      expect(await proc.exited).toBe(1)
      expect(await new Response(proc.stderr).text().then((s) => s.trim())).toBe(
        "番号が不正です",
      )
    }
  })

  test("reflect 1 foo は種別が不正です", async () => {
    const proc = spawnInstalledBin(binPath, ["reflect", "1", "foo"])
    expect(await proc.exited).toBe(1)
    expect(await new Response(proc.stderr).text().then((s) => s.trim())).toBe(
      "種別が不正です",
    )
  })

  test("branch 75 は task-75 と改行だけ", async () => {
    const proc = spawnInstalledBin(binPath, ["branch", "75"])
    expect(await proc.exited).toBe(0)
    expect(await new Response(proc.stdout).text()).toBe("task-75\n")
    expect(await new Response(proc.stderr).text()).toBe("")
  })

  test("公開物を改変した install は改変内容をコピーする", async () => {
    const extraRel = "sdd-cur/extra-pack-only.txt"
    const extraContent = "pack-only skill file\n"
    await mkdir(path.join(packageDir, "skills", "sdd-cur"), { recursive: true })
    await writeFile(
      path.join(packageDir, "skills", extraRel),
      extraContent,
    )
    const agentName = "sdd-cur-req-author.md"
    const replacedAgent = "# replaced in installed package\n"
    await writeFile(
      path.join(packageDir, "agents", agentName),
      replacedAgent,
    )
    const repoAgent = await readFile(
      path.join(repoRoot, "agents", agentName),
      "utf8",
    )
    expect(replacedAgent).not.toBe(repoAgent)

    const dest = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-install-dest-"))
    try {
      const proc = spawnInstalledBin(binPath, ["install", dest])
      expect(await proc.exited).toBe(0)
      const copiedExtra = await readFile(
        path.join(dest, ".cursor", "skills", extraRel),
        "utf8",
      )
      expect(copiedExtra).toBe(extraContent)
      const copiedAgent = await readFile(
        path.join(dest, ".cursor", "agents", agentName),
        "utf8",
      )
      expect(copiedAgent).toBe(replacedAgent)
      expect(copiedAgent).not.toBe(repoAgent)
    } finally {
      await rm(dest, { recursive: true, force: true })
    }
  })

})

describe("dev entry", () => {
  test("bun src/cli.ts --help は終了コード 0 で使い方の十一行", async () => {
    const cliPath = path.join(repoRoot, "src", "cli.ts")
    const proc = Bun.spawn([bunExe, cliPath, "--help"], {
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe",
    })
    expect(await proc.exited).toBe(0)
    expect(await new Response(proc.stderr).text()).toBe(usageText)
  })
})
