import { describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises"
import { completionCallerFileName } from "./complete.ts"
import os from "node:os"
import path from "node:path"
import { reflectedOpenLine } from "./conventions.ts"

const cliPath = path.join(import.meta.dir, "cli.ts")
const bunExe = process.execPath
const isolatedPath = path.dirname(bunExe)

const usageText =
  "sdd-cur install [project-root]\n" +
  "sdd-cur run [--interval-min <1 以上 1440 以下の整数>]\n" +
  "sdd-cur labels\n" +
  "sdd-cur candidates\n" +
  "sdd-cur show <番号>\n" +
  "sdd-cur branch <番号>\n" +
  "sdd-cur confirm <番号>\n" +
  "sdd-cur reflect <番号> <requirements|design>\n" +
  "sdd-cur complete <番号>\n"

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

  test("run は gh 無しの cwd で終了コード 1", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-run-"))
    try {
      const proc = Bun.spawn(
        [bunExe, cliPath, "run", "--interval-min", "1"],
        {
          cwd: temp,
          stdout: "pipe",
          stderr: "pipe",
          env: { ...process.env, PATH: isolatedPath },
        },
      )
      const exitCode = await proc.exited
      expect(exitCode).toBe(1)
      const stderr = await new Response(proc.stderr).text()
      expect(stderr.trim()).toBe("gh を実行できません")
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
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
    expect(stderr).toContain("sdd-cur show")
  })

  test("confirm 1 --help は使い方を書いて終了コード 0", async () => {
    const proc = Bun.spawn(["bun", cliPath, "confirm", "1", "--help"], {
      stdout: "pipe",
      stderr: "pipe",
    })
    expect(await proc.exited).toBe(0)
    const stderr = await new Response(proc.stderr).text()
    expect(stderr).toBe(usageText)
  })

  test("candidates extra は使い方の九行で終了コード 1", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "candidates", "extra"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: isolatedPath },
    })
    expect(await proc.exited).toBe(1)
    const stderr = await new Response(proc.stderr).text()
    expect(stderr).toBe(usageText)
  })

  test("branch 17 の標準出力は task-17 と末尾改行だけ", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "branch", "17"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: isolatedPath },
    })
    expect(await proc.exited).toBe(0)
    expect(await new Response(proc.stdout).text()).toBe("task-17\n")
    expect(await new Response(proc.stderr).text()).toBe("")
  })

  test("branch の引数が無いときは終了コード 1", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "branch"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: isolatedPath },
    })
    expect(await proc.exited).toBe(1)
    expect(await new Response(proc.stderr).text()).toBe(usageText)
  })

  test("branch foo は番号が不正です", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "branch", "foo"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: isolatedPath },
    })
    expect(await proc.exited).toBe(1)
    expect(await new Response(proc.stderr).text().then((s) => s.trim())).toBe(
      "番号が不正です",
    )
  })

  test("show 01 は番号が不正です", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "show", "01"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: isolatedPath },
    })
    expect(await proc.exited).toBe(1)
    const stderr = await new Response(proc.stderr).text()
    expect(stderr.trim()).toBe("番号が不正です")
  })

  test("confirm 5 の空の標準入力は確認の本文が空です", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "confirm", "5"], {
      stdin: new Blob([""]).stream(),
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: isolatedPath },
    })
    expect(await proc.exited).toBe(1)
    const stderr = await new Response(proc.stderr).text()
    expect(stderr.trim()).toBe("確認の本文が空です")
  })

  test("confirm 5 の印行は確認の本文に印を含めない", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "confirm", "5"], {
      stdin: new Blob(["sdd-cur: 確認\n本文"]).stream(),
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: isolatedPath },
    })
    expect(await proc.exited).toBe(1)
    const stderr = await new Response(proc.stderr).text()
    expect(stderr.trim()).toBe("確認の本文に印を含めない")
  })

  test("reflect 5 design は要件が無いとき docs/specs/5 を作らない", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-reflect-"))
    try {
      const proc = Bun.spawn([bunExe, cliPath, "reflect", "5", "design"], {
        cwd: temp,
        stdin: new Blob(["# 5 設計\n本文"]).stream(),
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await proc.exited).toBe(1)
      const stderr = await new Response(proc.stderr).text()
      expect(stderr.trim()).toBe("要件がありません")
      await expect(stat(path.join(temp, "docs", "specs", "5"))).rejects.toThrow()
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("reflect 5 requirements の見出し欠如はファイルを作らない", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-reflect-req-"))
    try {
      const proc = Bun.spawn([bunExe, cliPath, "reflect", "5", "requirements"], {
        cwd: temp,
        stdin: new Blob(["本文だけ"]).stream(),
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await proc.exited).toBe(1)
      const stderr = await new Response(proc.stderr).text()
      expect(stderr.trim()).toBe("見出しが不正です")
      await expect(
        stat(path.join(temp, "docs", "specs", "5", "requirements.md")),
      ).rejects.toThrow()
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("complete の引数が無いときは使い方", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "complete"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: isolatedPath },
    })
    expect(await proc.exited).toBe(1)
    expect(await new Response(proc.stderr).text()).toBe(usageText)
  })

  test("complete 01 は番号が不正です", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "complete", "01"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: isolatedPath },
    })
    expect(await proc.exited).toBe(1)
    expect(await new Response(proc.stderr).text().then((s) => s.trim())).toBe(
      "番号が不正です",
    )
  })

  test("complete 7 はファイル無しで gh 無し", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-complete-"))
    try {
      const proc = Bun.spawn([bunExe, cliPath, "complete", "7"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await proc.exited).toBe(1)
      expect(await new Response(proc.stderr).text().then((s) => s.trim())).toBe(
        "gh を実行できません",
      )
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("complete 7 は runner の呼び出し元", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-complete-run-"))
    try {
      await writeFile(path.join(temp, completionCallerFileName), "runner")
      const proc = Bun.spawn([bunExe, cliPath, "complete", "7"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await proc.exited).toBe(1)
      expect(await new Response(proc.stderr).text().then((s) => s.trim())).toBe(
        "完了は課題ランナーが行います",
      )
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("complete 7 は skill で gh 無し", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-complete-skill-"))
    try {
      await writeFile(path.join(temp, completionCallerFileName), "skill")
      const proc = Bun.spawn([bunExe, cliPath, "complete", "7"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await proc.exited).toBe(1)
      expect(await new Response(proc.stderr).text().then((s) => s.trim())).toBe(
        "gh を実行できません",
      )
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("show 5 は反映済みが二つあるとき gh を呼ばない", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-show-"))
    try {
      const specDir = path.join(temp, "docs", "specs", "5")
      await mkdir(specDir, { recursive: true })
      await writeFile(
        path.join(specDir, "requirements.md"),
        `${reflectedOpenLine}\na\n-->\n${reflectedOpenLine}\n-->\n`,
      )
      const proc = Bun.spawn([bunExe, cliPath, "show", "5"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await proc.exited).toBe(1)
      const stderr = await new Response(proc.stderr).text()
      expect(stderr.trim()).toBe("反映済みの記録が複数あります")
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})
