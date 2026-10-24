import { describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises"
const completionCallerFileName = "sdd-cur.completion"
import os from "node:os"
import path from "node:path"
import { reflectedOpenLine } from "./conventions.ts"

const cliPath = path.join(import.meta.dir, "cli.ts")
const bunExe = process.execPath
const isolatedPath = path.dirname(bunExe)

const usageText =
  "sdd-cur install [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]\n" +
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
  "sdd-cur spec-diff <番号>\n"

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

  test("candidates extra は使い方の十一行で終了コード 1", async () => {
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

  test("reflect 5 design は要件が無いとき docs/issues/5 を作らない", async () => {
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
      await expect(stat(path.join(temp, "docs", "issues", "5"))).rejects.toThrow()
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
        stat(path.join(temp, "docs", "issues", "5", "requirements.md")),
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

  test("restore の引数が無いときは使い方", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "restore"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: isolatedPath },
    })
    expect(await proc.exited).toBe(1)
    expect(await new Response(proc.stderr).text()).toBe(usageText)
  })

  test("restore foo は番号が不正です", async () => {
    const proc = Bun.spawn([bunExe, cliPath, "restore", "foo"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: isolatedPath },
    })
    expect(await proc.exited).toBe(1)
    expect(await new Response(proc.stderr).text()).toBe("番号が不正です\n")
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

  test("complete 7 は runner ファイルでも gh 無し", async () => {
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
        "gh を実行できません",
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

  test("complete 7 は不正な中身でも gh 無し", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-complete-bad-"))
    try {
      await writeFile(path.join(temp, completionCallerFileName), "both")
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

  test("run は runner ファイルでも gh 無し", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-run-runner-"))
    try {
      await writeFile(path.join(temp, completionCallerFileName), "runner")
      const proc = Bun.spawn(
        [bunExe, cliPath, "run", "--interval-min", "1"],
        {
          cwd: temp,
          stdout: "pipe",
          stderr: "pipe",
          env: { ...process.env, PATH: isolatedPath },
        },
      )
      expect(await proc.exited).toBe(1)
      expect(await new Response(proc.stderr).text().then((s) => s.trim())).toBe(
        "gh を実行できません",
      )
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("run は skill ファイルでも gh 無し", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-run-skill-"))
    try {
      await writeFile(path.join(temp, completionCallerFileName), "skill")
      const proc = Bun.spawn(
        [bunExe, cliPath, "run", "--interval-min", "1"],
        {
          cwd: temp,
          stdout: "pipe",
          stderr: "pipe",
          env: { ...process.env, PATH: isolatedPath },
        },
      )
      expect(await proc.exited).toBe(1)
      expect(await new Response(proc.stderr).text().then((s) => s.trim())).toBe(
        "gh を実行できません",
      )
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("run は不正な中身でも gh 無し", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-run-bad-"))
    try {
      await writeFile(path.join(temp, completionCallerFileName), "both")
      const proc = Bun.spawn(
        [bunExe, cliPath, "run", "--interval-min", "1"],
        {
          cwd: temp,
          stdout: "pipe",
          stderr: "pipe",
          env: { ...process.env, PATH: isolatedPath },
        },
      )
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
      const specDir = path.join(temp, "docs", "issues", "5")
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

  test("validate の引数", async () => {
    for (const args of [[], ["1", "extra"]] as const) {
      const proc = Bun.spawn([bunExe, cliPath, "validate", ...args], {
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await proc.exited).toBe(1)
      expect(await new Response(proc.stderr).text()).toBe(usageText)
    }
    const bad = Bun.spawn([bunExe, cliPath, "validate", "01"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: isolatedPath },
    })
    expect(await bad.exited).toBe(1)
    expect(await new Response(bad.stderr).text()).toBe("番号が不正です\n")
  })

  test("validate 1 は specs 無しで 0", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-val-empty-"))
    try {
      const proc = Bun.spawn([bunExe, cliPath, "validate", "1"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await proc.exited).toBe(0)
      expect(await new Response(proc.stdout).text()).toBe("")
      expect(await new Response(proc.stderr).text()).toBe("")
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("validate の形式検査", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-val-"))
    const form = "<!-- sdd-cur:form -->"
    try {
      const specDir = path.join(temp, "docs", "issues", "9")
      await mkdir(specDir, { recursive: true })
      const okReq = `# 9 題\n${form}\n## 受け入れ条件\n- 1. 条件: c 主体: s 結果: r\n`
      const okDesign = `# 9 題\n${form}\n## 受け入れ条件\n- 1. 条件: c 主体: s 結果: r\n## 範囲外\n\n## 決定\n\n## 作業の一覧\n- 1. 実装する。[1]\n## テスト\n- [1]\n`
      await writeFile(path.join(specDir, "requirements.md"), okReq)
      await writeFile(path.join(specDir, "design.md"), okDesign)
      const okProc = Bun.spawn([bunExe, cliPath, "validate", "9"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await okProc.exited).toBe(0)

      const badReq = `# 9 題\n${form}\n## 受け入れ条件\n- bad\n`
      await writeFile(path.join(specDir, "requirements.md"), badReq)
      await rm(path.join(specDir, "design.md"))
      const reqOnly = Bun.spawn([bunExe, cliPath, "validate", "9"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await reqOnly.exited).toBe(1)
      const reqErr = await new Response(reqOnly.stderr).text()
      expect(reqErr).toMatch(
        /^docs\/issues\/9\/requirements\.md: /m,
      )
      expect(await new Response(reqOnly.stdout).text()).toBe("")

      await writeFile(path.join(specDir, "requirements.md"), "# 9 題\n")
      await writeFile(
        path.join(specDir, "design.md"),
        `# 9 題\n${form}\n## 受け入れ条件\n- bad\n`,
      )
      const designOnly = Bun.spawn([bunExe, cliPath, "validate", "9"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await designOnly.exited).toBe(1)
      expect(await new Response(designOnly.stderr).text()).toMatch(
        /^docs\/issues\/9\/design\.md: /m,
      )

      await writeFile(path.join(specDir, "requirements.md"), badReq)
      await writeFile(path.join(specDir, "design.md"), badReq)
      const both = Bun.spawn([bunExe, cliPath, "validate", "9"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await both.exited).toBe(1)
      const bothErr = await new Response(both.stderr).text()
      const lines = bothErr.trimEnd().split("\n")
      expect(lines[0]).toMatch(/^docs\/issues\/9\/requirements\.md: /)
      expect(lines.some((l) => l.startsWith("docs/issues/9/design.md: "))).toBe(
        true,
      )

      await writeFile(path.join(specDir, "requirements.md"), "適切に\n")
      await writeFile(path.join(specDir, "design.md"), "適切に\n")
      const noMarker = Bun.spawn([bunExe, cliPath, "validate", "9"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await noMarker.exited).toBe(0)

      await rm(path.join(specDir, "requirements.md"))
      await mkdir(path.join(specDir, "requirements.md"), { recursive: true })
      const dirProc = Bun.spawn([bunExe, cliPath, "validate", "9"], {
        cwd: temp,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PATH: isolatedPath },
      })
      expect(await dirProc.exited).toBe(1)
      expect(await new Response(dirProc.stderr).text().then((s) => s.trim())).toBe(
        "仕様を読めません",
      )
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})
