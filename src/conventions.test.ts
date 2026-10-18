import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  commentMarkers,
  fixComment,
  fixedOpenLine,
  isSpecHeading,
  parseComment,
  parsePullRequestComment,
  pullRequestCommentMarkers,
  readFixedIds,
  readReflectedIds,
  reflectedOpenLine,
  relateComments,
  selectUnprocessedBugs,
  specPaths,
  unincorporatedAnswers,
  withReflectedId,
} from "./conventions.ts"
import type { IssueComment } from "./github.ts"

const root = join(import.meta.dir, "..")

function comment(
  id: string,
  body: string,
  createdAt = "2026-01-01T00:00:00Z",
): IssueComment {
  return { id, body, author: "", createdAt }
}

describe("specPaths", () => {
  test("不正な番号を拒否する", () => {
    for (const n of [0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => specPaths(n)).toThrow("番号が不正です")
    }
  })

  test("課題 4 のパス", () => {
    expect(specPaths(4)).toEqual({
      dir: "docs/specs/4",
      requirements: "docs/specs/4/requirements.md",
      design: "docs/specs/4/design.md",
    })
  })
})

describe("isSpecHeading", () => {
  test("先頭の空行を飛ばし、番号と題で判定する", () => {
    expect(isSpecHeading("\n\n# 4 レイアウト\n", 4)).toBe(true)
    expect(isSpecHeading("# 3 別", 4)).toBe(false)
    expect(isSpecHeading("# 4", 4)).toBe(false)
    expect(isSpecHeading("# 4 ", 4)).toBe(false)
    expect(isSpecHeading("# 04 題", 4)).toBe(false)
  })

  test("課題 1〜3 の design.md", () => {
    for (const n of [1, 2, 3]) {
      const md = readFileSync(
        join(root, `docs/specs/${n}/design.md`),
        "utf8",
      )
      expect(isSpecHeading(md, n)).toBe(true)
    }
  })
})

describe("parseComment", () => {
  test("三つの印を見分ける", () => {
    expect(parseComment(`${commentMarkers.confirm}\n質問`)).toEqual({
      kind: "confirm",
      payload: "質問",
    })
    expect(parseComment(`${commentMarkers.answer}\n回答`)).toEqual({
      kind: "answer",
      payload: "回答",
    })
    expect(parseComment(`${commentMarkers.acceptance}\n手順`)).toEqual({
      kind: "acceptance",
      payload: "手順",
    })
  })

  test("印の前の空行は無視する", () => {
    expect(parseComment(`\n\n${commentMarkers.confirm}\n本文`)).toEqual({
      kind: "confirm",
      payload: "本文",
    })
  })

  test("余分な空白や印が先頭でないときは other", () => {
    expect(parseComment(` ${commentMarkers.confirm}`).kind).toBe("other")
    expect(parseComment(`前置\n${commentMarkers.answer}`).kind).toBe("other")
  })

  test("印が末尾のとき payload は空、次の空行は残る", () => {
    expect(parseComment(commentMarkers.confirm)).toEqual({
      kind: "confirm",
      payload: "",
    })
    expect(parseComment(`${commentMarkers.confirm}\n\n本文`)).toEqual({
      kind: "confirm",
      payload: "\n本文",
    })
  })
})

describe("relateComments", () => {
  test("確認と回答を組にし、配列を変えない", () => {
    const comments = [
      comment("c1", `${commentMarkers.confirm}\nQ1`, "2026-01-02"),
      comment("o1", "通常", "2026-01-02T12:00:00Z"),
      comment(
        "a1",
        `${commentMarkers.acceptance}\n旧`,
        "2026-01-02T12:30:00Z",
      ),
      comment("a2", `${commentMarkers.answer}\nA1`, "2026-01-03"),
      comment(
        "a3",
        `${commentMarkers.acceptance}\n新`,
        "2026-01-04",
      ),
      comment("c2", `${commentMarkers.confirm}\nQ2`, "2026-01-05"),
    ]
    const snapshot = comments.map((c) => ({ ...c }))
    const related = relateComments(comments)
    expect(comments).toEqual(snapshot)
    expect(related.pairs).toEqual([
      { confirm: comments[0], answer: comments[3] },
    ])
    expect(related.unanswered).toEqual([comments[5]])
    expect(related.unpairedAnswers).toEqual([])
    expect(related.acceptance).toBe(comments[4])
  })

})

describe("readReflectedIds", () => {
  const block = (ids: string[]) =>
    `${reflectedOpenLine}\n${ids.join("\n")}\n-->\n`

  test("開始行が無いとき空配列", () => {
    expect(readReflectedIds("本文")).toEqual([])
  })

  test("id を上から返し、空行は飛ばす", () => {
    expect(readReflectedIds(block(["a", "b"]))).toEqual(["a", "b"])
    expect(
      readReflectedIds(`${reflectedOpenLine}\n\na\n\nb\n-->\n`),
    ).toEqual(["a", "b"])
  })

  test("複数の開始行を拒否する", () => {
    const md = `${block(["a"])}\n${reflectedOpenLine}\nid\n-->\n`
    expect(() => readReflectedIds(md)).toThrow("反映済みの記録が複数あります")
  })

  test("不正なブロックを拒否する", () => {
    expect(() => readReflectedIds(`${reflectedOpenLine}\na`)).toThrow(
      "反映済みの記録を解釈できません",
    )
    expect(() => readReflectedIds(block(["a b"]))).toThrow(
      "反映済みの記録を解釈できません",
    )
    expect(() => readReflectedIds(block(["<x>"]))).toThrow(
      "反映済みの記録を解釈できません",
    )
    expect(() => readReflectedIds(block(["a", "a"]))).toThrow(
      "反映済みの記録を解釈できません",
    )
    expect(() => readReflectedIds(`${block(["a"])}\n残り`)).toThrow(
      "反映済みの記録を解釈できません",
    )
  })
})

describe("withReflectedId", () => {
  test("不正な id を先に拒否する", () => {
    expect(() => withReflectedId("本文", "")).toThrow(
      "反映するコメントが不正です",
    )
    expect(() => withReflectedId("本文", "a b")).toThrow(
      "反映するコメントが不正です",
    )
    expect(() => withReflectedId("本文", "<x>")).toThrow(
      "反映するコメントが不正です",
    )
  })

  test("開始行が無い本文の末尾にブロックを足す", () => {
    const result = withReflectedId("本文", "id1")
    expect(result).toBe(
      `本文\n${reflectedOpenLine}\nid1\n-->\n`,
    )
    expect(readReflectedIds(result)).toEqual(["id1"])
  })

  test("既存 id は重複させず、新しい id はうしろに足す", () => {
    const first = withReflectedId("本文", "id1")
    const second = withReflectedId(first, "id1")
    expect(second).toBe(first)
    const third = withReflectedId(first, "id2")
    expect(readReflectedIds(third)).toEqual(["id1", "id2"])
  })

  test("反映ブロック直前の空行を残し、先頭のブロックはそのまま置き換える", () => {
    const withBlank = `本文\n\n${reflectedOpenLine}\nid1\n-->\n`
    const added = withReflectedId(withBlank, "id2")
    expect(added).toBe(
      `本文\n\n${reflectedOpenLine}\nid1\nid2\n-->\n`,
    )
    const atStart = `${reflectedOpenLine}\nid1\n-->\n`
    const replaced = withReflectedId(atStart, "id2")
    expect(replaced).toBe(`${reflectedOpenLine}\nid1\nid2\n-->\n`)
    expect(replaced.startsWith(reflectedOpenLine)).toBe(true)
  })

  test("改行は常に \\n だけ", () => {
    const body = "本文\r\n"
    const added = withReflectedId(body, "id1")
    expect(added).not.toContain("\r")
    expect(added).toBe(`本文\n${reflectedOpenLine}\nid1\n-->\n`)
    const again = withReflectedId(`x\r\n${reflectedOpenLine}\nid1\n-->\n`, "id1")
    expect(again).not.toContain("\r")
    expect(again).toBe(`x\n${reflectedOpenLine}\nid1\n-->\n`)
  })
})

describe("unincorporatedAnswers", () => {
  test("対応づいた未反映の回答だけを返す", () => {
    const comments = [
      comment("c1", `${commentMarkers.confirm}\nQ`, "2026-01-01"),
      comment("a1", `${commentMarkers.answer}\nA1`, "2026-01-02"),
      comment("a2", `${commentMarkers.answer}\n孤立`, "2026-01-03"),
    ]
    const req = withReflectedId("", "a1")
    const result = unincorporatedAnswers(comments, {
      requirements: req,
      design: "",
    })
    expect(result).toEqual([])
    const empty = unincorporatedAnswers(comments, {
      requirements: "",
      design: "",
    })
    expect(empty).toEqual([comments[1]])
  })

  test("要件の本文が拒否されるときはその理由で拒否する", () => {
    const comments = [
      comment("c1", `${commentMarkers.confirm}\nQ`, "2026-01-01"),
      comment("a1", `${commentMarkers.answer}\nA`, "2026-01-02"),
    ]
    const bad = `${reflectedOpenLine}\na\n`
    expect(() =>
      unincorporatedAnswers(comments, { requirements: bad, design: "" }),
    ).toThrow("反映済みの記録を解釈できません")
  })
})

describe("parsePullRequestComment", () => {
  test("不具合と修正の印と other", () => {
    const bug = parsePullRequestComment(
      `\n${pullRequestCommentMarkers.bug}\n本文`,
    )
    expect(bug.kind).toBe("bug")
    expect(bug.payload).toBe("本文")
    const fix = parsePullRequestComment(
      `${pullRequestCommentMarkers.fix}\n修正`,
    )
    expect(fix.kind).toBe("fix")
    expect(fix.payload).toBe("修正")
    const spaced = parsePullRequestComment(
      ` ${pullRequestCommentMarkers.bug} \n全体`,
    )
    expect(spaced.kind).toBe("other")
    expect(spaced.payload).toContain("全体")
  })
})

describe("parseComment PR markers", () => {
  test("不具合と修正の印は other", () => {
    expect(parseComment(`${pullRequestCommentMarkers.bug}\nx`).kind).toBe(
      "other",
    )
    expect(parseComment(`${pullRequestCommentMarkers.fix}\nx`).kind).toBe(
      "other",
    )
  })
})

describe("readFixedIds", () => {
  test("例と拒否", () => {
    const block = `<!-- sdd-cur:fixed\nIC_kwDOExample123\n-->`
    expect(readFixedIds(block)).toEqual(["IC_kwDOExample123"])
    expect(readFixedIds("no block")).toEqual([])
    expect(() =>
      readFixedIds(`${fixedOpenLine}\na\n${fixedOpenLine}\nb\n-->`),
    ).toThrow("修正の記録が複数あります")
    expect(() => readFixedIds(`${fixedOpenLine}\na`)).toThrow(
      "修正の記録を解釈できません",
    )
    expect(() =>
      readFixedIds(`${fixedOpenLine}\n bad\n-->\n`),
    ).toThrow("修正の記録を解釈できません")
    expect(() =>
      readFixedIds(`${fixedOpenLine}\na\na\n-->`),
    ).toThrow("修正の記録を解釈できません")
    expect(() =>
      readFixedIds(`${fixedOpenLine}\na\n-->\ntrail`),
    ).toThrow("修正の記録を解釈できません")
  })
})

describe("selectUnprocessedBugs", () => {
  test("fixed と順序", () => {
    const comments = [
      comment("b2", `${pullRequestCommentMarkers.bug}\n2`, "2026-01-02"),
      comment("b1", `${pullRequestCommentMarkers.bug}\n1`, "2026-01-01"),
      comment(
        "f1",
        `${pullRequestCommentMarkers.fix}\nok\n<!-- sdd-cur:fixed\nb1\n-->`,
        "2026-01-03",
      ),
      comment(
        "o1",
        `<!-- sdd-cur:fixed\nb2\n-->`,
        "2026-01-04",
      ),
    ]
    const before = comments.map((c) => ({ ...c }))
    const bugs = selectUnprocessedBugs(comments)
    expect(comments).toEqual(before)
    expect(bugs.map((b) => b.id)).toEqual(["b2"])
  })
})

describe("fixComment", () => {
  test("拒否と成功", () => {
    expect(() => fixComment("  ", ["a"])).toThrow("修正コメントが空です")
    for (const marker of [
      commentMarkers.confirm,
      commentMarkers.answer,
      commentMarkers.acceptance,
      pullRequestCommentMarkers.bug,
      pullRequestCommentMarkers.fix,
    ]) {
      expect(() => fixComment(`${marker}\nx`, ["IC_x"])).toThrow(
        "修正コメントに印を含めない",
      )
    }
    expect(() =>
      fixComment(`x\n${fixedOpenLine}\n`, ["IC_x"]),
    ).toThrow("修正コメントに印を含めない")
    expect(() => fixComment("ok", [])).toThrow("修正する不具合がありません")
    const body = fixComment(" 本文  ", ["IC_a", "IC_b"])
    expect(body.split("\n")[0]).toBe(pullRequestCommentMarkers.fix)
    expect(body).toContain(" 本文  ")
    expect(readFixedIds(body)).toEqual(["IC_a", "IC_b"])
  })
})

describe("relateComments unpaired fix", () => {
  test("確認のあとにだけ回答を組にする", () => {
    const comments = [
      comment("a1", `${commentMarkers.answer}\n先`, "2026-01-01"),
      comment("c1", `${commentMarkers.confirm}\nQ`, "2026-01-02"),
      comment("a2", `${commentMarkers.answer}\n後`, "2026-01-03"),
    ]
    const related = relateComments(comments)
    expect(related.unpairedAnswers).toEqual([comments[0]])
    expect(related.pairs).toEqual([
      { confirm: comments[1], answer: comments[2] },
    ])
  })
})

describe("文書", () => {
  test("docs/conventions.md", () => {
    const text = readFileSync(join(root, "docs/conventions.md"), "utf8")
    expect(text).toContain(commentMarkers.confirm)
    expect(text).toContain(commentMarkers.answer)
    expect(text).toContain(commentMarkers.acceptance)
    expect(text).toContain("sdd-cur:reflected")
    expect(text).toContain("requirements.md")
    expect(text).toContain("design.md")
    expect(text).toContain("課題のコメントだけに書く")
    expect(text).toContain("未回答の確認があるあいだ、次の確認は投稿しない")
    expect(text).toContain(pullRequestCommentMarkers.bug)
    expect(text).toContain(pullRequestCommentMarkers.fix)
    expect(text).toContain("sdd-cur:fixed")

    const fences = text.split("```")
    let inFence = false
    let openOutside = false
    for (let i = 0; i < fences.length; i += 1) {
      const part = fences[i]
      if (i % 2 === 1) {
        if (part.includes(reflectedOpenLine) && part.includes("-->")) {
          inFence = true
        }
      } else if (part.includes(reflectedOpenLine)) {
        openOutside = true
      }
    }
    expect(inFence).toBe(true)
    expect(openOutside).toBe(false)
  })

  test("README と AGENTS.md", () => {
    const readme = readFileSync(join(root, "README.md"), "utf8")
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8")
    expect(readme).toContain("docs/conventions.md")
    expect(agents).toContain("docs/conventions.md")
    expect(agents).toContain("src/conventions.ts")
  })
})
