import { describe, expect, test } from "bun:test"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  acceptanceProcedure,
  ambiguousWords,
  canonicalIdsFromMarkdown,
  commentMarkers,
  fixComment,
  fixedOpenLine,
  formMarkerLine,
  hasFormMarker,
  isSpecHeading,
  parseComment,
  parsePullRequestComment,
  parseReview,
  readCanonicalIds,
  reviewConfirmMarkers,
  reviewJudgmentMarkers,
  pullRequestCommentMarkers,
  readFixedIds,
  readReflectedIds,
  reflectedOpenLine,
  relateComments,
  selectUnprocessedBugs,
  specPaths,
  unincorporatedAnswers,
  validateCanonicalDelta,
  validateSpecForm,
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
      dir: "docs/issues/4",
      requirements: "docs/issues/4/requirements.md",
      design: "docs/issues/4/design.md",
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
        join(root, `docs/issues/${n}/design.md`),
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

describe("acceptanceProcedure", () => {
  const issueUrl = "https://github.com/o/r/issues/1"

  test("課題 URL・印・手順の本文から手順だけ返す", () => {
    const body = `${issueUrl}\n${commentMarkers.acceptance}\n手順`
    expect(acceptanceProcedure(body)).toBe("手順")
    expect(acceptanceProcedure(body)).not.toContain(issueUrl)
    expect(acceptanceProcedure(body)).not.toContain(commentMarkers.acceptance)
  })

  test("payload の空白と印のうしろの空行を残し改行は \\n だけ", () => {
    const body = `${issueUrl}\n${commentMarkers.acceptance}\n  手順  \n\n`
    expect(acceptanceProcedure(body)).toBe("  手順  \n\n")
    expect(acceptanceProcedure(body)).not.toContain("\r")
    const cr = `${issueUrl}\r\n${commentMarkers.acceptance}\r\n手順`
    expect(acceptanceProcedure(cr)).toBe("手順")
  })

  test("印が無いときと課題 URL だけは null、印の行が末尾なら空文字", () => {
    expect(acceptanceProcedure("本文だけ")).toBeNull()
    expect(acceptanceProcedure(issueUrl)).toBeNull()
    expect(acceptanceProcedure(`${issueUrl}\n${commentMarkers.acceptance}`)).toBe(
      "",
    )
  })

  test("印の行に空白があれば印ではない", () => {
    expect(
      acceptanceProcedure(`${issueUrl}\n ${commentMarkers.acceptance}\n手順`),
    ).toBeNull()
  })

  test("二つ目の印では切り直さない", () => {
    const body = `${issueUrl}\n${commentMarkers.acceptance}\n手順1\n${commentMarkers.acceptance}\n手順2`
    expect(acceptanceProcedure(body)).toBe(
      `手順1\n${commentMarkers.acceptance}\n手順2`,
    )
  })

  test("マージリクエストの URL だけの本文は parseComment で other", () => {
    expect(parseComment("https://github.com/o/r/pull/1").kind).toBe("other")
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

describe("parseReview", () => {
  test("判定だけの合格", () => {
    expect(parseReview(reviewJudgmentMarkers.pass)).toEqual({
      judgment: "pass",
      confirm: "absent",
    })
  })

  test("判定行の後ろに非空行", () => {
    expect(
      parseReview(`${reviewJudgmentMarkers.pass}\n余計な行`),
    ).toEqual({ judgment: "pass", confirm: "absent" })
    expect(
      parseReview(`${reviewJudgmentMarkers.fail}\n余計な行`),
    ).toEqual({ judgment: "fail", confirm: "absent" })
  })

  test("複数の判定行は下から最初", () => {
    const body = `${reviewJudgmentMarkers.pass}\n本文\n${reviewJudgmentMarkers.fail}`
    expect(parseReview(body)).toEqual({
      judgment: "fail",
      confirm: "absent",
    })
  })

  test("不合格と確認あり", () => {
    const body = `${reviewConfirmMarkers.yes}\n別の行\n${reviewJudgmentMarkers.fail}\n余計`
    expect(parseReview(body)).toEqual({
      judgment: "fail",
      confirm: "yes",
    })
  })

  test("確認行は下から最初", () => {
    const body = `${reviewConfirmMarkers.yes}\n${reviewConfirmMarkers.no}\n${reviewJudgmentMarkers.fail}`
    expect(parseReview(body)).toEqual({
      judgment: "fail",
      confirm: "no",
    })
  })

  test("確認が判定行より後ろだけ", () => {
    const body = `${reviewJudgmentMarkers.fail}\n${reviewConfirmMarkers.yes}`
    expect(parseReview(body)).toEqual({
      judgment: "fail",
      confirm: "absent",
    })
  })

  test("合格の前に確認ありでも confirm は absent", () => {
    const body = `${reviewConfirmMarkers.yes}\n${reviewJudgmentMarkers.pass}`
    expect(parseReview(body)).toEqual({
      judgment: "pass",
      confirm: "absent",
    })
  })

  test("壊れた印", () => {
    for (const body of [
      "",
      ` ${reviewJudgmentMarkers.pass}`,
      `${reviewJudgmentMarkers.pass} `,
      `結果は${reviewJudgmentMarkers.pass}`,
    ]) {
      expect(parseReview(body)).toEqual({
        judgment: "absent",
        confirm: "absent",
      })
    }
  })

  test("改行が \\r\\n", () => {
    expect(parseReview(`${reviewJudgmentMarkers.pass}\r\n`)).toEqual({
      judgment: "pass",
      confirm: "absent",
    })
  })
})

describe("canonicalIdsFromMarkdown", () => {
  test("行全体が ## REQ-1 の識別子だけを返す", () => {
    const md = [
      "## REQ-1",
      "body",
      "## REQ-01",
      " ## REQ-1",
      "### REQ-1",
      "## REQ-1",
    ].join("\n")
    expect(canonicalIdsFromMarkdown(md)).toEqual(["REQ-1", "REQ-1"])
  })
})

describe("validateCanonicalDelta", () => {
  const section = (items: string) =>
    `## 正本への差分\n${items}\n## 次`

  test("節が無い、または項目が無いとき空", () => {
    expect(validateCanonicalDelta("# 1 題\n", [])).toEqual([])
    expect(validateCanonicalDelta(section(""), [])).toEqual([])
  })

  test("追加", () => {
    const md = section("### 追加 spec REQ-1\nx")
    expect(validateCanonicalDelta(md, [])).toEqual([])
    expect(validateCanonicalDelta(md, ["REQ-1"])).toEqual([
      "追加する識別子が正本にあります: REQ-1",
    ])
  })

  test("変更", () => {
    const md = section("### 変更 spec REQ-2\nx")
    expect(validateCanonicalDelta(md, ["REQ-2"])).toEqual([])
    expect(validateCanonicalDelta(md, [])).toEqual([
      "変更する識別子が正本にありません: REQ-2",
    ])
  })

  test("削除", () => {
    const md = section("### 削除 spec REQ-3\nx")
    expect(validateCanonicalDelta(md, ["REQ-3"])).toEqual([])
    expect(validateCanonicalDelta(md, [])).toEqual([
      "削除する識別子が正本にありません: REQ-3",
    ])
  })

  test("同じ節で追加のあと変更は反映後の集合を見ない", () => {
    const md = section("### 追加 spec REQ-1\na\n### 変更 spec REQ-1\nb")
    expect(validateCanonicalDelta(md, [])).toEqual([
      "変更する識別子が正本にありません: REQ-1",
    ])
  })

  test("節の外と二度目の節、形に合わない見出しは見ない", () => {
    const md = [
      "### 追加 spec REQ-9",
      "## 正本への差分",
      "### 追加 spec REQ-1",
      "### 追加 spec REQ-1 余分",
      "## 正本への差分",
      "### 変更 spec REQ-2",
    ].join("\n")
    expect(validateCanonicalDelta(md, [])).toEqual([])
    expect(validateCanonicalDelta(md, ["REQ-2"])).toEqual([])
  })
})

describe("readCanonicalIds", () => {
  test("docs/canonical が無いとき空", async () => {
    const temp = await mkdtemp(join(tmpdir(), "sdd-canonical-"))
    try {
      expect(await readCanonicalIds(temp)).toEqual([])
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })

  test("ファイル名昇順で .md だけ読む", async () => {
    const temp = await mkdtemp(join(tmpdir(), "sdd-canonical-"))
    try {
      const specDir = join(temp, "docs/canonical")
      await mkdir(specDir, { recursive: true })
      await writeFile(join(specDir, "spec.md"), "## REQ-1\nx\n", "utf8")
      await writeFile(join(specDir, "a.md"), "## REQ-2\ny\n", "utf8")
      await writeFile(join(specDir, "note.txt"), "## REQ-9\n", "utf8")
      expect(await readCanonicalIds(temp)).toEqual(["REQ-2", "REQ-1"])
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})

describe("hasFormMarker", () => {
  test("2 行目の非空行が印のときだけ true", () => {
    expect(
      hasFormMarker(`# 1 題\n${formMarkerLine}\n`),
    ).toBe(true)
    expect(
      hasFormMarker(`\n\n# 1 題\n${formMarkerLine}\n`),
    ).toBe(true)
    expect(hasFormMarker(`# 1 題\n${formMarkerLine}\r\n`)).toBe(true)
    expect(hasFormMarker(`${formMarkerLine}\n# 1 題\n`)).toBe(false)
    expect(hasFormMarker(`# 1 題\n\n${formMarkerLine}\n`)).toBe(true)
    expect(hasFormMarker(`# 1 題\n ${formMarkerLine}\n`)).toBe(false)
    expect(hasFormMarker(`# 1 題\n${formMarkerLine} \n`)).toBe(false)
    expect(hasFormMarker("# 1 題\n")).toBe(false)
  })
})

describe("ambiguousWords", () => {
  test("十八語と同じ順", () => {
    expect([...ambiguousWords]).toEqual([
      "適切に",
      "必要に応じて",
      "適宜",
      "可能な限り",
      "十分に",
      "なるべく",
      "できるだけ",
      "高速に",
      "使いやすく",
      "柔軟に",
      "基本的に",
      "原則として",
      "一般的に",
      "望ましくは",
      "できれば",
      "TBD",
      "TODO",
      "FIXME",
    ])
  })
})

describe("validateSpecForm", () => {
  const marker = `# 1 題\n${formMarkerLine}\n`

  test("印が無いとき空配列", () => {
    expect(validateSpecForm("requirements", "# 1 題\n")).toEqual([])
    expect(
      validateSpecForm(
        "design",
        `# 1 題\n## 受け入れ条件\n- x\n## テスト\n- y\n適切に\n${reflectedOpenLine}\n${reflectedOpenLine}\n-->\n`,
      ),
    ).toEqual([])
  })

  test("印がある要件", () => {
    const ok = `${marker}## 受け入れ条件\n- 1. 条件: c 主体: s 結果: r\n## 現状\n任意\n`
    expect(validateSpecForm("requirements", ok)).toEqual([])
    const missing = `${marker}## 現状\n`
    expect(validateSpecForm("requirements", missing)).toEqual([
      "必須の節がありません: 受け入れ条件",
    ])
  })

  test("印がある設計の必須の節", () => {
    const base = `${marker}`
    expect(validateSpecForm("design", base)).toEqual([
      "必須の節がありません: 受け入れ条件",
      "必須の節がありません: 範囲外",
      "必須の節がありません: 決定",
      "必須の節がありません: テスト",
    ])
  })

  test("受け入れ条件の形", () => {
    const body = `${marker}## 受け入れ条件\n- 01. 条件: c 主体: s 結果: r\n- 1.条件: c 主体: s 結果: r\n- 1. 条件:  主体: s 結果: r\n- 1. 条件: c 主体： s 結果: r\n`
    const v = validateSpecForm("requirements", body)
    expect(v.filter((x) => x.startsWith("受け入れ条件の形が不正"))).toHaveLength(
      4,
    )
  })

  test("番号の重複", () => {
    const body = `${marker}## 受け入れ条件\n- 1. 条件: a 主体: s 結果: r\n- 1. 条件: b 主体: s 結果: r\n- x\n`
    expect(validateSpecForm("requirements", body)).toContain(
      "受け入れ条件の番号が重複しています: 1",
    )
  })

  test("設計のテスト参照", () => {
    const body = `${marker}## 受け入れ条件\n- 1. 条件: a 主体: s 結果: r\n- 2. 条件: b 主体: s 結果: r\n## 範囲外\n\n## 決定\n\n## テスト\n- [1]\n  - [2]\n- [9]\n`
    const v = validateSpecForm("design", body)
    expect(v).toContain("受け入れ条件がテストから参照されていません: 2")
    expect(v).toContain("テストが参照する受け入れ条件がありません: 9")
    expect(v.some((x) => x.startsWith("テストが受け入れ条件を参照していません"))).toBe(
      false,
    )
  })

  test("要件のテスト節は参照を見ない", () => {
    const body = `${marker}## 受け入れ条件\n- 1. 条件: a 主体: s 結果: r\n## テスト\n- no ref\n`
    expect(
      validateSpecForm("requirements", body).some((x) =>
        x.includes("テスト"),
      ),
    ).toBe(false)
  })

  test("反映済みと曖昧な語", () => {
    const noOpen = `${marker}## 受け入れ条件\n- 1. 条件: a 主体: s 結果: r\n`
    expect(
      validateSpecForm("requirements", noOpen).some((x) =>
        x.includes("反映済み"),
      ),
    ).toBe(false)
    const multi = `${marker}## 受け入れ条件\n- 1. 条件: a 主体: s 結果: r\n${reflectedOpenLine}\n${reflectedOpenLine}\n-->\n`
    expect(validateSpecForm("requirements", multi)).toContain(
      "反映済みの記録が複数あります",
    )
    const amb = `${marker}## 受け入れ条件\n- 1. 条件: a 主体: s 結果: r\n不適切に\n`
    expect(validateSpecForm("requirements", amb)).toContain(
      "曖昧な語があります: 適切に",
    )
    expect(validateSpecForm("requirements", `${marker}fixme\n`)).not.toContain(
      "曖昧な語があります: FIXME",
    )
  })

  const designSections = (
    parts: {
      acceptance: string
      workList?: string
      test: string
    },
  ): string =>
    [
      `${marker}## 受け入れ条件\n${parts.acceptance}`,
      "## 範囲外\n",
      "## 決定\n",
      parts.workList === undefined
        ? ""
        : `## 作業の一覧\n${parts.workList}`,
      `## テスト\n${parts.test}`,
    ]
      .filter((s) => s.length > 0)
      .join("\n")

  const twoAcceptance =
    "- 1. 条件: a 主体: s 結果: r\n- 2. 条件: b 主体: s 結果: r\n"

  test("作業の一覧に無い受け入れ条件", () => {
    const body = designSections({
      acceptance: twoAcceptance,
      workList: "- 1. 実装する。[1]\n",
      test: "- [1]\n- [2]\n",
    })
    expect(validateSpecForm("design", body)).toContain(
      "受け入れ条件が作業の一覧に入っていません: 2",
    )
  })

  test("作業の一覧が受け入れ条件をすべて参照", () => {
    const body = designSections({
      acceptance: twoAcceptance,
      workList: "- 1. 一。[1]\n- 2. 二。[2]\n",
      test: "- [1]\n- [2]\n",
    })
    const v = validateSpecForm("design", body)
    expect(
      v.some((x) => x.startsWith("受け入れ条件が作業の一覧に入っていません")),
    ).toBe(false)
  })

  test("同じ番号が複数の作業にある", () => {
    const body = designSections({
      acceptance: twoAcceptance,
      workList: "- 1. 一。[1]\n- 2. 二。[1][2]\n",
      test: "- [1]\n- [2]\n",
    })
    const v = validateSpecForm("design", body)
    expect(
      v.some((x) => x.startsWith("受け入れ条件が作業の一覧に入っていません")),
    ).toBe(false)
  })

  test("作業が存在しない受け入れ条件番号を参照", () => {
    const body = designSections({
      acceptance: "- 1. 条件: a 主体: s 結果: r\n",
      workList: "- 1. 実装。[9]\n",
      test: "- [1]\n",
    })
    const v = validateSpecForm("design", body)
    expect(v).toContain("受け入れ条件が作業の一覧に入っていません: 1")
    expect(v.some((x) => x.includes("作業の一覧") && x.includes("9"))).toBe(
      false,
    )
  })

  test("作業の一覧の節が無い", () => {
    const body = designSections({
      acceptance: twoAcceptance,
      test: "- [1]\n- [2]\n",
    })
    const v = validateSpecForm("design", body)
    expect(v).toEqual([
      "受け入れ条件が作業の一覧に入っていません: 1",
      "受け入れ条件が作業の一覧に入っていません: 2",
    ])
    expect(v.some((x) => x.includes("必須の節がありません: 作業の一覧"))).toBe(
      false,
    )
  })

  test("テスト参照の違反が作業の一覧の違反より前", () => {
    const body = designSections({
      acceptance: twoAcceptance,
      workList: "- 1. 実装。[1]\n",
      test: "- [1]\n",
    })
    const v = validateSpecForm("design", body)
    const testIdx = v.indexOf("受け入れ条件がテストから参照されていません: 2")
    const workIdx = v.indexOf("受け入れ条件が作業の一覧に入っていません: 2")
    expect(testIdx).toBeGreaterThanOrEqual(0)
    expect(workIdx).toBeGreaterThanOrEqual(0)
    expect(testIdx).toBeLessThan(workIdx)
  })

  test("印が無い設計と要件では作業の一覧を見ない", () => {
    const withWork = `# 1 題\n## 受け入れ条件\n- 1. 条件: a 主体: s 結果: r\n## 作業の一覧\n- 1. x\n## テスト\n- [1]\n`
    expect(validateSpecForm("design", withWork)).toEqual([])
    const req = `${marker}## 受け入れ条件\n- 1. 条件: a 主体: s 結果: r\n- 2. 条件: b 主体: s 結果: r\n## 作業の一覧\n- 1. x。[1]\n`
    expect(
      validateSpecForm("requirements", req).some((x) =>
        x.includes("作業の一覧"),
      ),
    ).toBe(false)
  })

  test("行頭が番号だけの行は作業に数えない", () => {
    const body = designSections({
      acceptance: "- 1. 条件: a 主体: s 結果: r\n",
      workList: "1. 旧形式。[1]\n",
      test: "- [1]\n",
    })
    expect(validateSpecForm("design", body)).toContain(
      "受け入れ条件が作業の一覧に入っていません: 1",
    )
  })
})

describe("文書", () => {
  test("docs/conventions.md", () => {
    const text = readFileSync(
      join(root, "skills/sdd-cur/conventions.md"),
      "utf8",
    )
    expect(text).toContain(commentMarkers.confirm)
    expect(text).toContain(commentMarkers.answer)
    expect(text).toContain(commentMarkers.acceptance)
    expect(text).toContain(reviewJudgmentMarkers.pass)
    expect(text).toContain(reviewJudgmentMarkers.fail)
    expect(text).toContain(reviewConfirmMarkers.yes)
    expect(text).toContain(reviewConfirmMarkers.no)
    expect(text).toContain("下から")
    expect(text).toContain("parseReview")
    expect(text).toContain("sdd-cur:reflected")
    expect(text).toContain("requirements.md")
    expect(text).toContain("design.md")
    expect(text).toContain("docs/canonical/<領域>.md")
    expect(text).toContain("## レビューが読む範囲")
    expect(text).toContain(
      "要求レビュー役が食い違いと巻き戻りを探すときに読んで比べる範囲は、正本と、対象課題の `docs/issues/<番号>/requirements.md` の「関係する課題」に挙げた課題の仕様だけである。正本は `docs/canonical/` に置く。",
    )
    expect(text).toContain(
      "設計レビュー役が食い違いと巻き戻りを探すときに読んで比べる範囲は、正本と、対象課題の `docs/issues/<番号>/design.md` の「関係する課題」に挙げた課題の仕様だけである。正本は `docs/canonical/` に置く。",
    )
    expect(text).toContain("履歴として残す")
    expect(text).toContain("## 正本への差分")
    expect(text).toContain("### 追加 <領域> REQ-<番号>")
    expect(text).toContain("### 変更 <領域> REQ-<番号>")
    expect(text).toContain("### 削除 <領域> REQ-<番号>")
    const fileSection = text.indexOf("## 課題ごとのファイル")
    const canonicalSection = text.indexOf("## 仕様の正本")
    const commentSection = text.indexOf("## 課題コメントの種別")
    expect(fileSection).toBeGreaterThanOrEqual(0)
    expect(canonicalSection).toBeGreaterThan(fileSection)
    expect(commentSection).toBeGreaterThan(canonicalSection)
    expect(text).toContain("課題のコメントだけに書く")
    expect(text).toContain("未回答の確認があるあいだ、次の確認は投稿しない")
    expect(text).toContain(
      "課題コメントにある受け入れ手順は、同じ順の最後の一件である。",
    )
    expect(text).toContain(
      "課題ランナーが書く現在の手順は、マージリクエストの本文から取る。",
    )
    expect(text).toContain("## マージリクエストの本文")
    expect(text).toContain("マージリクエストの URL だけ")
    expect(text).toContain("sdd-cur: 着手")
    expect(text).toContain("確認と回答の課題コメントは、変えない。")
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

    expect(text).toContain(formMarkerLine)
    let formInFence = false
    let formOutside = false
    for (let i = 0; i < fences.length; i += 1) {
      const part = fences[i]
      if (i % 2 === 1) {
        if (part.includes(formMarkerLine)) {
          formInFence = true
        }
      } else if (part.includes(formMarkerLine)) {
        formOutside = true
      }
    }
    expect(formInFence).toBe(true)
    expect(formOutside).toBe(false)
    expect(text).toContain(
      "- <番号>. 条件: <条件> 主体: <主体> 結果: <結果>",
    )
    expect(text).toContain("[<番号>]")
    expect(text).toContain("「受け入れ条件」")
    expect(text).toContain("「範囲外」")
    expect(text).toContain("「決定」")
    expect(text).toContain("「テスト」")
    const ambBlock = ambiguousWords.join("\n")
    expect(text).toContain(ambBlock)
    expect(text).toContain("## 作業の一覧")
    expect(text).toContain(
      "受け入れ条件が作業の一覧に入っていません: <番号>",
    )
  })

  test("docs/issues の design.md 見出し置換 [20]", () => {
    const specsRoot = join(root, "docs/issues")
    const oldHeading = "## 実装の順序"
    const newHeading = "## 作業の一覧"
    for (const ent of readdirSync(specsRoot, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue
      const path = join(specsRoot, ent.name, "design.md")
      if (!existsSync(path)) continue
      const md = readFileSync(path, "utf8")
      for (const line of md.split("\n")) {
        expect(line).not.toBe(oldHeading)
      }
    }
    const d23 = readFileSync(join(root, "docs/issues/23/design.md"), "utf8")
    for (const line of d23.split("\n")) {
      expect(line).not.toBe(newHeading)
    }
    const d42 = readFileSync(join(root, "docs/issues/42/design.md"), "utf8")
    const workIdx = d42.indexOf(`${newHeading}\n`)
    expect(workIdx).toBeGreaterThanOrEqual(0)
    const afterHeading = d42.slice(workIdx + newHeading.length + 1)
    const firstWorkLine = afterHeading.split("\n").find((l) => l.trim() !== "")
    expect(firstWorkLine).toBe(
      "1. `src/cli.ts` に `branch` を足し、`printUsage` を変える。",
    )
  })

  test("README と AGENTS.md", () => {
    const readme = readFileSync(join(root, "README.md"), "utf8")
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8")
    expect(readme).toContain("docs/conventions.md")
    expect(agents).toContain("docs/conventions.md")
    expect(agents).toContain(
      "[skills/sdd-cur/conventions.md](skills/sdd-cur/conventions.md)",
    )
    const policy = readFileSync(join(root, "docs/policy.md"), "utf8")
    expect(readme).toContain("docs/policy.md")
    expect(agents).toContain("docs/policy.md")
    expect(policy).toContain(
      "人が閉じるを選んだときに SDD スキルが閉じる場合を除き、課題は閉じない",
    )
    expect(policy).toContain("課題ランナーは課題を閉じない")
    expect(policy).toContain(
      "`issue close` は、人が閉じるを選んだときに SDD スキルが課題を閉じる場合だけ付ける",
    )
    expect(policy).toContain("src/conventions.ts")
  })
})
