import { describe, expect, test } from "bun:test"
import {
  createGitHub,
  type GhResult,
  type GhRunner,
  type GhRunOptions,
  parseRepo,
  resolveRepo,
  writeGhStdin,
} from "./github.ts"

type RecordedCall = { args: string[]; options: GhRunOptions }

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

function okJson(stdout: unknown): GhResult {
  return { stdout: JSON.stringify(stdout), stderr: "", exitCode: 0 }
}

function okText(stdout: string): GhResult {
  return { stdout, stderr: "", exitCode: 0 }
}

function fail(stderr: string, exitCode = 1): GhResult {
  return { stdout: "", stderr, exitCode }
}

describe("parseRepo", () => {
  test("owner/repo を分解する", () => {
    expect(parseRepo("paterapatera/sdd-cur")).toEqual({
      owner: "paterapatera",
      name: "sdd-cur",
    })
  })

  test("空の owner は拒否する", () => {
    expect(() => parseRepo("/repo")).toThrow("リポジトリの指定が不正です")
  })

  test("空白を含む owner は拒否する", () => {
    expect(() => parseRepo("a b/c")).toThrow("リポジトリの指定が不正です")
  })
})

describe("createGitHub", () => {
  test("不正な repo は run を呼ばずに拒否する", async () => {
    const { runner, calls } = recordingRunner(() => okJson([]))
    expect(() => createGitHub({ gh: runner, repo: "bad" })).toThrow(
      "リポジトリの指定が不正です",
    )
    expect(calls.length).toBe(0)
  })

  test("listIssues は既定で open と limit 100", async () => {
    const { runner, calls } = recordingRunner(() => okJson([]))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await github.listIssues()
    expect(calls[0]?.args).toEqual([
      "issue",
      "list",
      "--repo",
      "o/r",
      "--state",
      "open",
      "--limit",
      "100",
      "--json",
      "number,title,body,state,labels,url",
    ])
    expect(calls[0]?.options.stdin).toBeUndefined()
  })

  test("listIssues は --label を --state の前に付ける", async () => {
    const { runner, calls } = recordingRunner(() => okJson([]))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await github.listIssues({ labels: ["実装依頼", "実装中"] })
    expect(calls[0]?.args).toEqual([
      "issue",
      "list",
      "--repo",
      "o/r",
      "--label",
      "実装依頼",
      "--label",
      "実装中",
      "--state",
      "open",
      "--limit",
      "100",
      "--json",
      "number,title,body,state,labels,url",
    ])
  })

  test("listIssues は応答を正規化する", async () => {
    const { runner } = recordingRunner(() =>
      okJson([
        {
          number: 2,
          title: "t",
          body: null,
          state: "OPEN",
          labels: [{ name: "bug" }],
          url: "https://github.com/o/r/issues/2",
        },
      ]),
    )
    const github = createGitHub({ gh: runner, repo: "o/r" })
    const issues = await github.listIssues()
    expect(issues[0]).toEqual({
      number: 2,
      title: "t",
      body: "",
      state: "open",
      labels: ["bug"],
      url: "https://github.com/o/r/issues/2",
    })
  })

  test("getIssue と listComments の引数", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args.includes("comments")) {
        return okJson({
          comments: [
            {
              id: "1",
              body: null,
              createdAt: "2026-01-01",
            },
          ],
        })
      }
      return okJson({
        number: 1,
        title: "t",
        body: "b",
        state: "CLOSED",
        labels: [],
        url: "https://github.com/o/r/issues/1",
      })
    })
    const github = createGitHub({ gh: runner, repo: "o/r" })
    const issue = await github.getIssue(1)
    expect(issue.state).toBe("closed")
    const comments = await github.listComments(1)
    expect(comments[0]).toEqual({
      id: "1",
      body: "",
      author: "",
      createdAt: "2026-01-01",
    })
    expect(calls[0]?.args).toContain("issue")
    expect(calls[0]?.args).toContain("view")
    expect(calls[1]?.args.at(-1)).toBe("comments")
  })

  test("addComment は stdin に本文を渡し URL を返す", async () => {
    const { runner, calls } = recordingRunner(() =>
      okText("https://github.com/o/r/issues/1#issuecomment-9\n"),
    )
    const github = createGitHub({ gh: runner, repo: "o/r" })
    const result = await github.addComment(1, "hello")
    expect(result.url).toBe("https://github.com/o/r/issues/1#issuecomment-9")
    expect(calls[0]?.options.stdin).toBe("hello")
  })

  test("空のコメントは拒否する", async () => {
    const { runner, calls } = recordingRunner(() => okText(""))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(github.addComment(1, "   ")).rejects.toThrow(
      "コメント本文が空です",
    )
    expect(calls.length).toBe(0)
  })

  test("editLabels は一回の issue edit にまとめる", async () => {
    const { runner, calls } = recordingRunner(() => okJson({}))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await github.editLabels(3, { add: ["a"], remove: ["b"] })
    expect(calls[0]?.args).toEqual([
      "issue",
      "edit",
      "3",
      "--repo",
      "o/r",
      "--add-label",
      "a",
      "--remove-label",
      "b",
    ])
    expect(calls[0]?.args).not.toContain("close")
    expect(calls[0]?.args).not.toContain("--state")
  })

  test("createBranch は取得パスで / を %2F にする", async () => {
    const { runner, calls } = recordingRunner((call, index) => {
      if (index === 0) {
        return okJson({ object: { sha: "abc" } })
      }
      return okJson({})
    })
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await github.createBranch("feature/new", "feature/foo")
    expect(calls[0]?.args[1]).toBe("repos/o/r/git/ref/heads/feature%2Ffoo")
    expect(calls[1]?.args).toContain("-f")
    expect(calls[1]?.args).toContain("ref=refs/heads/feature/new")
    expect(calls[0]?.options.stdin).toBeUndefined()
  })

  test("createPullRequest は api と JSON の順序", async () => {
    const { runner, calls } = recordingRunner(() =>
      okJson({ number: 10, html_url: "https://github.com/o/r/pull/10" }),
    )
    const github = createGitHub({ gh: runner, repo: "o/r" })
    const pr = await github.createPullRequest({
      title: "t",
      head: "h",
      base: "main",
      body: "",
    })
    expect(pr).toEqual({
      number: 10,
      url: "https://github.com/o/r/pull/10",
    })
    expect(calls[0]?.args).toEqual([
      "api",
      "--method",
      "POST",
      "repos/o/r/pulls",
      "--input",
      "-",
    ])
    expect(calls[0]?.options.stdin).toBe(
      JSON.stringify({ title: "t", head: "h", base: "main", body: "" }),
    )
  })

  test("getPullRequest は mergedAt がある CLOSED を merged にする", async () => {
    const { runner } = recordingRunner(() =>
      okJson({
        number: 5,
        url: "https://github.com/o/r/pull/5",
        state: "CLOSED",
        mergedAt: "2026-01-01T00:00:00Z",
      }),
    )
    const github = createGitHub({ gh: runner, repo: "o/r" })
    const pr = await github.getPullRequest(5)
    expect(pr).toEqual({
      number: 5,
      url: "https://github.com/o/r/pull/5",
      state: "merged",
      merged: true,
    })
  })

  test("squashMerge は pr merge のあと merged を確認する", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "pr" && call.args[1] === "merge") {
        return okJson({})
      }
      return okJson({
        number: 7,
        url: "https://github.com/o/r/pull/7",
        state: "MERGED",
        mergedAt: "2026-01-01",
      })
    })
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await github.squashMerge(7)
    expect(calls[0]?.args).toEqual([
      "pr",
      "merge",
      "7",
      "--repo",
      "o/r",
      "--squash",
    ])
    expect(calls[1]?.args[0]).toBe("pr")
    expect(calls[1]?.args[1]).toBe("view")
  })

  test("squashMerge は merged が false なら拒否する", async () => {
    const { runner, calls } = recordingRunner((call) => {
      if (call.args[0] === "pr" && call.args[1] === "merge") {
        return okJson({})
      }
      return okJson({
        number: 7,
        url: "https://github.com/o/r/pull/7",
        state: "OPEN",
        mergedAt: null,
      })
    })
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(github.squashMerge(7)).rejects.toThrow(
      "マージリクエストはマージされていません",
    )
    expect(calls.length).toBe(2)
  })

  test("squashMerge は pr merge 失敗時に取得しない", async () => {
    const { runner, calls } = recordingRunner(() => fail("merge failed"))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(github.squashMerge(1)).rejects.toThrow("merge failed")
    expect(calls.length).toBe(1)
  })

  test("gh 失敗時は stderr の先頭行を返す", async () => {
    const { runner } = recordingRunner(() => fail("first error\nsecond"))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(github.getIssue(1)).rejects.toThrow("first error")
  })

  test("gh 失敗で stderr が空のときは stdout の先頭行", async () => {
    const { runner } = recordingRunner(() => ({
      stdout: "stdout line\n",
      stderr: "",
      exitCode: 2,
    }))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(github.getIssue(1)).rejects.toThrow("stdout line")
  })

  test("不正な limit は run を呼ばない", async () => {
    const { runner, calls } = recordingRunner(() => okJson([]))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(github.listIssues({ limit: 0 })).rejects.toThrow(
      "取得件数の指定が不正です",
    )
    expect(calls.length).toBe(0)
  })

  test("getLabel は符号化済みパスで api を呼ぶ", async () => {
    const { runner, calls } = recordingRunner(() =>
      okJson({ name: "実装依頼" }),
    )
    const github = createGitHub({ gh: runner, repo: "o/r" })
    const label = await github.getLabel("実装依頼")
    expect(label).toEqual({ name: "実装依頼" })
    expect(calls[0]?.args).toEqual([
      "api",
      "repos/o/r/labels/%E5%AE%9F%E8%A3%85%E4%BE%9D%E9%A0%BC",
    ])
    expect(calls[0]?.options.stdin).toBeUndefined()
  })

  test("getLabel は HTTP 404 を null にする", async () => {
    const { runner } = recordingRunner(() =>
      fail("gh: Not Found (HTTP 404)\n", 1),
    )
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(github.getLabel("実装依頼")).resolves.toBeNull()
  })

  test("getLabel は HTTP 404 以外の失敗を拒否する", async () => {
    const { runner } = recordingRunner(() => fail("forbidden", 1))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(github.getLabel("実装依頼")).rejects.toThrow("forbidden")
  })

  test("getLabel は name が一致しないとき拒否する", async () => {
    const { runner } = recordingRunner(() => okJson({ name: "other" }))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(github.getLabel("実装依頼")).rejects.toThrow(
      "gh の応答を解釈できません",
    )
  })

  test("getLabel の標準出力が JSON でないとき拒否する", async () => {
    const { runner } = recordingRunner(() => okText("not json"))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(github.getLabel("実装依頼")).rejects.toThrow(
      "gh の応答を解釈できません",
    )
  })

  test("createLabel は JSON の順序と stdin", async () => {
    const { runner, calls } = recordingRunner(() =>
      okJson({ name: "実装依頼" }),
    )
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await github.createLabel({
      name: "実装依頼",
      color: "FBCA04",
      description: "設計が終わり、実装してよい",
    })
    expect(calls[0]?.args).toEqual([
      "api",
      "--method",
      "POST",
      "repos/o/r/labels",
      "--input",
      "-",
    ])
    expect(calls[0]?.options.stdin).toBe(
      JSON.stringify({
        name: "実装依頼",
        color: "FBCA04",
        description: "設計が終わり、実装してよい",
      }),
    )
  })

  test("createLabel は応答の name が一致しないとき拒否する", async () => {
    const { runner } = recordingRunner(() => okJson({ name: "other" }))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(
      github.createLabel({
        name: "実装依頼",
        color: "FBCA04",
        description: "d",
      }),
    ).rejects.toThrow("gh の応答を解釈できません")
  })

  test("createLabel の標準出力が JSON でないとき拒否する", async () => {
    const { runner } = recordingRunner(() => okText("not json"))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(
      github.createLabel({
        name: "実装依頼",
        color: "FBCA04",
        description: "d",
      }),
    ).rejects.toThrow("gh の応答を解釈できません")
  })

  test("不正なラベル名は getLabel で run を呼ばない", async () => {
    const { runner, calls } = recordingRunner(() => okJson({ name: "x" }))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(github.getLabel("")).rejects.toThrow("ラベル名が不正です")
    expect(calls.length).toBe(0)
  })

  test("不正な色と説明は createLabel で run を呼ばない", async () => {
    const { runner, calls } = recordingRunner(() => okJson({ name: "x" }))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(
      github.createLabel({ name: "a", color: "bad", description: "d" }),
    ).rejects.toThrow("ラベルの色が不正です")
    await expect(
      github.createLabel({ name: "a", color: "FFFFFF", description: "  " }),
    ).rejects.toThrow("ラベルの説明が空です")
    expect(calls.length).toBe(0)
  })
})

describe("writeGhStdin", () => {
  test("Promise write の完了を待ってから end する", async () => {
    let writeDone = false
    let ended = false
    const stdin = {
      write() {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            writeDone = true
            resolve()
          }, 5)
        })
      },
      end() {
        ended = true
      },
    }
    await writeGhStdin(stdin, "payload")
    expect(writeDone).toBe(true)
    expect(ended).toBe(true)
  })
})

describe("resolveRepo", () => {
  test("repo view を cwd で呼ぶ", async () => {
    const { runner, calls } = recordingRunner(() =>
      okJson({ nameWithOwner: "o/r" }),
    )
    const repo = await resolveRepo(runner, "/tmp/proj")
    expect(repo).toBe("o/r")
    expect(calls[0]?.args).toEqual(["repo", "view", "--json", "nameWithOwner"])
    expect(calls[0]?.options.cwd).toBe("/tmp/proj")
    expect(calls[0]?.options.stdin).toBeUndefined()
  })
})

describe("getDefaultBranch", () => {
  test("defaultBranchRef.name が main のとき main を返す", async () => {
    const { runner, calls } = recordingRunner(() =>
      okJson({ defaultBranchRef: { name: "main" } }),
    )
    const github = createGitHub({ gh: runner, repo: "o/r", cwd: "/tmp" })
    const branch = await github.getDefaultBranch()
    expect(branch).toBe("main")
    expect(calls).toHaveLength(1)
    expect(calls[0]?.args).toEqual([
      "repo",
      "view",
      "--json",
      "defaultBranchRef",
    ])
    expect(calls[0]?.options.cwd).toBe("/tmp")
  })

  test("name が無いとき gh の応答を解釈できません", async () => {
    const { runner } = recordingRunner(() => okJson({}))
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(github.getDefaultBranch()).rejects.toThrow(
      "gh の応答を解釈できません",
    )
  })

  test("規則を満たさない name は gh の応答を解釈できません", async () => {
    const { runner, calls } = recordingRunner(() =>
      okJson({ defaultBranchRef: { name: ".." } }),
    )
    const github = createGitHub({ gh: runner, repo: "o/r" })
    await expect(github.getDefaultBranch()).rejects.toThrow(
      "gh の応答を解釈できません",
    )
    expect(calls).toHaveLength(1)
  })
})
