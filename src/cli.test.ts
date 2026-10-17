import { describe, expect, test } from "bun:test"
import { mkdtemp, rm, stat } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const cliPath = path.join(import.meta.dir, "cli.ts")

describe("cli subprocess", () => {
  test("install が <temp>/.cursor/skills を作る", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-cli-install-"))
    try {
      const proc = Bun.spawn(["bun", cliPath, "install", temp], {
        stdout: "pipe",
        stderr: "pipe",
      })
      const exitCode = await proc.exited
      expect(exitCode).toBe(0)
      const skillsDir = path.join(temp, ".cursor", "skills")
      const info = await stat(skillsDir)
      expect(info.isDirectory()).toBe(true)
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("run は SIGTERM で 1 分待たず終了コード 0", async () => {
    const proc = Bun.spawn(["bun", cliPath, "run", "--interval-min", "1"], {
      stdout: "pipe",
      stderr: "pipe",
    })

    await Bun.sleep(50)
    proc.kill("SIGTERM")
    const exitCode = await proc.exited
    expect(exitCode).toBe(0)
  })

  test("未知のサブコマンドは終了コード 1", async () => {
    const proc = Bun.spawn(["bun", cliPath, "unknown"], {
      stdout: "pipe",
      stderr: "pipe",
    })
    expect(await proc.exited).toBe(1)
  })

  test("--help は終了コード 0", async () => {
    const proc = Bun.spawn(["bun", cliPath, "--help"], {
      stdout: "pipe",
      stderr: "pipe",
    })
    expect(await proc.exited).toBe(0)
    const stderr = await new Response(proc.stderr).text()
    expect(stderr).toContain("sdd-cur labels")
  })

  test("labels extra は使い方の三行で終了コード 1", async () => {
    const bunExe = process.execPath
    const proc = Bun.spawn([bunExe, cliPath, "labels", "extra"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: path.dirname(bunExe) },
    })
    expect(await proc.exited).toBe(1)
    const stderr = await new Response(proc.stderr).text()
    expect(stderr).toBe(
      "sdd-cur install [project-root]\n" +
        "sdd-cur run [--interval-min <1 以上 1440 以下の整数>]\n" +
        "sdd-cur labels\n",
    )
  })
})
