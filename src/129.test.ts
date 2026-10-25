import { afterEach, describe, expect, test } from "bun:test"
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const root = path.join(import.meta.dir, "..")
const policyPath = path.join(root, "docs/policy.md")
const cliPath = path.join(import.meta.dir, "cli.ts")
const requestPath = path.join(import.meta.dir, "request.ts")
const skillPath = path.join(root, "skills/sdd-cur/SKILL.md")
const afterPassPath = path.join(root, "skills/sdd-cur/after-pass.md")
const requirementsStagePath = path.join(root, "skills/sdd-cur/requirements.md")
const designStagePath = path.join(root, "skills/sdd-cur/design.md")
const reflectStagePath = path.join(root, "skills/sdd-cur/reflect.md")
const followPassGuide =
  "`after-pass.md` の `## 合格のあとの案内` に従う。"
const gitCanonicalPath = path.join(root, "docs/canonical/git.md")
const docsCanonicalPath = path.join(root, "docs/canonical/docs.md")

const descriptionLine =
  "このプロジェクトの課題について、着手候補の提示、要件、設計、確認コメントの投稿、未反映の回答の取り込みを行う。着手、要件、設計、確認、回答の取り込みを依頼されたときに使う。課題は作らない。人が閉じるを選んだときに SDD スキルが閉じる場合を除き、課題は閉じない。ラベルの変更、実装、受け入れ手順、完了処理はしない。設計の合格の案内で人が「実装依頼する」を選んだときに `sdd-cur request <番号>` が「実装依頼」を付けることは、ラベルの変更をしない定めの例外である。そのときも、実装、受け入れ手順、完了処理はしない。"

const canonicalBodies: Record<string, string> = {
  "REQ-635": `もとになった課題は #129 である。

設計の合格の案内で「ここで止める」を選んだときは、人は、要求と設計を含む作業ブランチを push してから「実装依頼」を付ける。
設計の合格の案内で「実装依頼する」を選んだときは、SDD スキルが実行する \`sdd-cur request <番号>\` が、push のあと「実装依頼」を付ける。
\`<番号>\` は対象の課題番号である。`,
  "REQ-801": `もとになった課題は #129 である。

設計の合格の案内で人が「実装依頼する」を選んだときに限り、SDD スキルは \`sdd-cur request <番号>\` を呼ぶ。
\`<番号>\` は対象の課題番号である。
それ以外では、SDD スキルは \`sdd-cur request <番号>\` を呼ばない。`,
  "REQ-803": `もとになった課題は #129 である。

このコマンドは \`sdd-cur request <番号>\` である。
\`<番号>\` は対象の課題番号である。
設計の合格の案内で人が「実装依頼する」を選んだとき以外は、「実装依頼」を付けるのは人である。
そのとき以外は、このコマンドを実行するのも人である。
設計の合格の案内で人が「実装依頼する」を選んだときは、質問での選択を人が「実装依頼」を付けたこととみなす。
そのときは、このコマンドを実行するのは SDD スキルである。`,
  "REQ-802": `もとになった課題は #94 である。

課題ランナーは、このコマンドを呼ばない。`,
  "REQ-790": `もとになった課題は #94 である。

人が、作業ツリーで \`bun src/cli.ts request <番号>\` を実行すると、その課題番号の作業ブランチを push し、その push が成功したあと、その課題に「実装依頼」を付ける。`,
  "REQ-779": `もとになった課題は #115 である。

README は、人が \`sdd-cur request <番号>\` で作業ブランチを push してから「実装依頼」を付ける、と書く。この文に \`bun src/cli.ts\` は無い。`,
}

const showBeforePassGuidePhrase = "人に伝える前に `show` を改めて実行する。"

const reqPassGuideCorePhrases = [
  "要件の合格の案内は、Cursor の質問機能で「設計に進む」と「ここで止める」を、この順で出すことである。",
  "案内を人に伝えるときは、Cursor の質問機能で上の二択を出す。この質問は、「満たされているかの判断」の節が案内を伝えるとしたときだけ出す。",
  "「設計に進む」と「ここで止める」の質問を出しているあいだ、人がどちらかを選ぶまで、設計の手順に入らない。",
  "「設計に進む」と「ここで止める」の質問を出しているあいだ、人がどちらかを選ぶまで、設計の作成役と設計の修正役を起動しない。",
  "「ここで止める」を選んだときは、その回は設計の手順に入らない。",
  "「ここで止める」を選んだときは、設計の作成役と設計の修正役を起動しない。",
  "「ここで止める」を選んだときは、設計の手順は、人が設計を依頼したときだけ始める。",
  "「設計に進む」を選んだときは、`design.md` の `## 設計` の手順の先頭から、人が設計を依頼したときと同じ手順に入る。",
] as const

const reqPassGuideBranchPhrases = [
  "`unanswered` が空でない、または `nextAnswer` が `null` でないときは、「設計に進む」と「ここで止める」の質問を出さない。",
  "そのときは、設計の手順に入らない。",
  "`action` が `合格` でないときは、「設計に進む」と「ここで止める」の質問を出さない。",
  "`action` が `合格` でないときは、設計の手順に入らない。",
] as const

const answerReqExtraPhrases = [
  "「設計に進む」と「ここで止める」の質問を出しているあいだ、人がどちらかを選ぶまで、設計の作成役と設計の修正役を起動しない。",
  "回答の手順は、設計のファイルを作らない。",
] as const

const designPassGuideCorePhrases = [
  "設計の合格の案内は、Cursor の質問機能で「実装依頼する」と「ここで止める」を、この順で出すことである。",
  "「実装依頼する」と「ここで止める」の質問を出しているあいだ、人がどちらかを選ぶまで、作業ブランチを push しないし、「実装依頼」を付けないし、`sdd-cur request <番号>` を実行しない。",
  "「ここで止める」を選んだときは、作業ブランチを push しない。",
  "「ここで止める」を選んだときは、「実装依頼」を付けない。",
  "「ここで止める」を選んだときは、`sdd-cur request <番号>` を実行しない。",
  "「ここで止める」を選んだときは、ラベルは変えない。",
  "「ここで止める」を選んだときは、push は人が行う。",
  "「ここで止める」を選んだときは、「実装依頼」は人が付ける。",
  "「ここで止める」を選んだときは、push するのは、要求と設計を含む作業ブランチである。",
] as const

const designPassGuideBranchPhrases = [
  "`unanswered` が空でない、または `nextAnswer` が `null` でないときは、次の段へ進む質問を出さない。",
  "そのときは、判断もしない。",
  "そのときは、作業ブランチを push しない。",
  "そのときは、「実装依頼」を付けない。",
  "そのときは、`sdd-cur request <番号>` を実行しない。",
  "`action` が `合格` でないときは、設計の合格のあとの次の段の質問を出さない。",
  "`action` が `合格` でないときは、作業ブランチを push しない。",
  "`action` が `合格` でないときは、「実装依頼」を付けない。",
  "`action` が `合格` でないときは、`sdd-cur request <番号>` を実行しない。",
] as const

const requestWhenChosenPhrases = [
  "「実装依頼する」を選んだときは、`sdd-cur request <番号>` を実行する。",
  "`<番号>` は対象の課題番号である。",
  "質問での選択は、人が「実装依頼」を付けたこととみなす。",
  "push は、そのコマンドが行う。",
  "「実装依頼」の付与は、そのコマンドが行う。",
  "スキルは `gh` を直接起動しない。",
  "スキルはラベルを `issue edit` で直接変えない。",
] as const

const noImplAcceptCompletePhrases = [
  "この経路でも、実装はしない。",
  "この経路でも、受け入れ手順はしない。",
  "この経路でも、完了処理はしない。",
] as const

const judgmentWhileClosePhrase =
  "`閉じる` と `閉じない` を出しているあいだは、「設計に進む」と「ここで止める」を出さないし、「実装依頼する」と「ここで止める」を出さないし、作業ブランチを push しないし、「実装依頼」を付けないし、`sdd-cur request <番号>` を実行しないし、設計の手順に入らない。"

const judgmentCloseChosenPhrases = [
  "「設計に進む」と「ここで止める」を出さない。",
  "「実装依頼する」と「ここで止める」を出さない。",
  "作業ブランチを push しない。",
  "「実装依頼」を付けない。",
  "`sdd-cur request <番号>` を実行しない。",
] as const

const prohibitionPhrases = [
  "設計の合格の案内で人が「実装依頼する」を選んだとき以外は、`after-pass.md` の `## 合格のあとの案内` に書く三つに従う。",
  "その案内で「実装依頼する」を選んだときは、スキルが `sdd-cur request <番号>` を実行する。",
  "そのときは、質問での選択を人が「実装依頼」を付けたこととみなす。",
  "そのときは、push はそのコマンドが行う。",
  "そのときは、「実装依頼」の付与はそのコマンドが行う。",
  "そのときは、スキルは `gh` を直接起動しない。",
  "そのときは、スキルはラベルを `issue edit` で直接変えない。",
  "そのときも、実装はしない。",
  "そのときも、受け入れ手順はしない。",
  "そのときも、完了処理はしない。",
] as const

function principlesSection(policy: string): string {
  const heading = "## 破ってはいけない原則"
  const start = policy.indexOf(heading)
  if (start < 0) {
    throw new Error(`${heading} が無い`)
  }
  return policy.slice(start)
}

function sliceFunction(source: string, signature: string, nextSignature: string): string {
  const start = source.indexOf(signature)
  if (start < 0) {
    throw new Error(`${signature} が無い`)
  }
  const end = source.indexOf(nextSignature, start + signature.length)
  if (end < 0) {
    throw new Error(`${nextSignature} が無い`)
  }
  return source.slice(start, end)
}

function sectionBetween(
  text: string,
  startHeading: string,
  endHeading: string,
): string {
  const startMarker = `\n${startHeading}\n`
  const endMarker = `\n${endHeading}\n`
  const start = text.indexOf(startMarker)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = text.indexOf(endMarker, start + startMarker.length)
  expect(end).toBeGreaterThan(start)
  return text.slice(start + 1, end)
}

function skillDescription(skill: string): string {
  const m = skill.match(/^---\n[\s\S]*?\ndescription: ([^\n]+)\n/)
  expect(m).not.toBeNull()
  return m![1]
}

function answerRequirementsSection(reflect: string): string {
  const answerStart = reflect.indexOf("## 回答")
  const boundary = "側が `design` のとき、第1引数は `reflect-design` である。"
  const end = reflect.indexOf(boundary, answerStart)
  expect(end).toBeGreaterThan(answerStart)
  return reflect.slice(answerStart, end)
}

function answerDesignSection(reflect: string): string {
  const boundary = "側が `design` のとき、第1引数は `reflect-design` である。"
  const start = reflect.indexOf(boundary)
  expect(start).toBeGreaterThanOrEqual(0)
  return reflect.slice(start)
}

function passGuideSection(afterPass: string): string {
  const start = afterPass.indexOf("## 合格のあとの案内")
  expect(start).toBeGreaterThanOrEqual(0)
  return afterPass.slice(start)
}

function judgmentSection(afterPass: string): string {
  const start = afterPass.indexOf("### 満たされているかの判断")
  const end = afterPass.indexOf("## 合格のあとの案内", start)
  expect(start).toBeGreaterThanOrEqual(0)
  expect(end).toBeGreaterThan(start)
  return afterPass.slice(start, end)
}

function prohibitionSection(skill: string): string {
  const start = skill.indexOf("## 禁止")
  expect(start).toBeGreaterThanOrEqual(0)
  return skill.slice(start)
}

function paragraphFrom(skill: string, startMarker: string, endMarker: string): string {
  const start = skill.indexOf(startMarker)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = skill.indexOf(endMarker, start + startMarker.length)
  expect(end).toBeGreaterThan(start)
  return skill.slice(start, end)
}

function reqBody(text: string, id: string): string {
  const marker = `## ${id}`
  const lines = text.split("\n")
  const idx = lines.findIndex((line) => line === marker)
  if (idx < 0) {
    throw new Error(`${marker} が無い`)
  }
  const bodyLines: string[] = []
  for (let i = idx + 1; i < lines.length; i++) {
    if (/^## REQ-/.test(lines[i])) {
      break
    }
    bodyLines.push(lines[i])
  }
  while (bodyLines.length > 0 && bodyLines[0] === "") {
    bodyLines.shift()
  }
  while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] === "") {
    bodyLines.pop()
  }
  return bodyLines.join("\n")
}

function expectContainsAll(section: string, phrases: readonly string[]): void {
  for (const phrase of phrases) {
    expect(section).toContain(phrase)
  }
}

function expectQuestionOrder(section: string, first: string, second: string): void {
  const a = section.indexOf(first)
  const b = section.indexOf(second)
  expect(a).toBeGreaterThanOrEqual(0)
  expect(b).toBeGreaterThan(a)
}

function expectSectionLacksPassGuidePhrases(
  section: string,
  phrases: readonly string[],
): void {
  for (const phrase of phrases) {
    expect(section).not.toContain(phrase)
  }
}

describe("129", () => {
  let tempRoot = ""

  afterEach(async () => {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true })
      tempRoot = ""
    }
  })

  test("[12] docs/policy.md の破ってはいけない原則", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-129-policy-"))
    const copyPath = path.join(tempRoot, "policy.md")
    await copyFile(policyPath, copyPath)
    const policy = await readFile(copyPath, "utf8")
    const principles = principlesSection(policy)
    expect(principles).toContain(
      "人が閉じるを選んだときに SDD スキルが閉じる場合を除き、課題は閉じない",
    )
    expect(principles).toContain("設計に書いた「範囲外」は作らない")
    expect(principles).toContain(
      "ラベルの変更は `issue edit` の `--add-label` と `--remove-label` だけである",
    )
  })

  test("[73] skills/sdd-cur/SKILL.md に sdd-cur request 失敗後の文は無い", async () => {
    const skill = await readFile(skillPath, "utf8")
    expect(skill).not.toContain("sdd-cur request <番号>` が失敗")
    expect(skill).not.toMatch(/`sdd-cur request <番号>`[^\n]*失敗/)
    for (const line of skill.split("\n")) {
      if (line.includes("`sdd-cur request <番号>`") && /失敗/.test(line)) {
        throw new Error(`request 失敗の文: ${line}`)
      }
    }
  })

  test("[74] cmdRequest の失敗時は message を標準エラーへ書き終了コード 1", async () => {
    const cliSource = await readFile(cliPath, "utf8")
    const cmdRequest = sliceFunction(
      cliSource,
      "async function cmdRequest",
      "\nasync function cmdComplete",
    )
    expect(cmdRequest).toContain(
      "console.error(error instanceof Error ? error.message : String(error))",
    )
    expect(cmdRequest).toContain("return 1")
  })

  test("[74] requestImplementation は push のあと editLabels の add", async () => {
    const requestSource = await readFile(requestPath, "utf8")
    expect(requestSource).toContain("export async function requestImplementation")
    const fnStart = requestSource.indexOf("export async function requestImplementation")
    const fnBody = requestSource.slice(fnStart)
    const pushLine = "await deps.git.push(remote, branch)"
    const labelsLine = "await github.editLabels(issueNumber, { add: [LABEL_REQUEST] })"
    expect(fnBody).toContain(pushLine)
    expect(fnBody).toContain(labelsLine)
    expect(fnBody.indexOf(pushLine)).toBeLessThan(fnBody.indexOf(labelsLine))
  })

  test("[11] 説明の description 行", async () => {
    const skill = await readFile(skillPath, "utf8")
    expect(skillDescription(skill)).toBe(descriptionLine)
    expect(descriptionLine).toContain("ラベルの変更、実装、受け入れ手順、完了処理はしない。")
    expect(descriptionLine).toContain(
      "`sdd-cur request <番号>` が「実装依頼」を付けることは、ラベルの変更をしない定めの例外である",
    )
    expect(descriptionLine).toContain("そのときも、実装、受け入れ手順、完了処理はしない。")
  })

  test("[1][18] 要件の節 合格案内", async () => {
    const section = await readFile(requirementsStagePath, "utf8")
    const afterPass = await readFile(afterPassPath, "utf8")
    const passGuide = passGuideSection(afterPass)
    expect(section).toContain(followPassGuide)
    expectSectionLacksPassGuidePhrases(section, reqPassGuideCorePhrases)
    expectContainsAll(passGuide, reqPassGuideCorePhrases)
    expectContainsAll(section, reqPassGuideBranchPhrases)
    expect(section).toContain(showBeforePassGuidePhrase)
    expectQuestionOrder(
      passGuide,
      "「設計に進む」と「ここで止める」を、この順で出すことである",
      "「設計に進む」と「ここで止める」の質問を出しているあいだ",
    )
  })

  test("[2][3][19][20] 要件の節 設計に進むとここで止める", async () => {
    const section = await readFile(requirementsStagePath, "utf8")
    expect(section).toContain("要件の節は、設計のファイルを作らない。")
  })

  test("[3] 設計の節の始め方", async () => {
    const section = await readFile(designStagePath, "utf8")
    expect(section).toContain(
      "人が設計を依頼したとき、または要件の合格の案内で「設計に進む」を選んだとき、次の手順で `docs/issues/<番号>/design.md` を扱う。",
    )
    expect(section).toContain("この二つの始め方で、あとの手順は同じである。")
  })

  test("[5][22][23][24] 設計の節 合格案内", async () => {
    const section = await readFile(designStagePath, "utf8")
    const afterPass = await readFile(afterPassPath, "utf8")
    const passGuide = passGuideSection(afterPass)
    expect(section).toContain(followPassGuide)
    expect(section).toContain("`sdd-cur gate <番号> request` を実行し、終了コードが 0 以外なら止まる。")
    expectSectionLacksPassGuidePhrases(section, designPassGuideCorePhrases)
    expectContainsAll(passGuide, designPassGuideCorePhrases)
    expectContainsAll(section, designPassGuideBranchPhrases.filter(
      (phrase) => phrase !== "そのときは、`sdd-cur request <番号>` を実行しない。",
    ))
    expect(section).toContain(showBeforePassGuidePhrase)
    expectQuestionOrder(
      passGuide,
      "「実装依頼する」と「ここで止める」を、この順で出すことである",
      "「実装依頼する」と「ここで止める」の質問を出しているあいだ",
    )
  })

  test("[10][37][38][39][40][41][42][43][44] 設計の節 実装依頼する", async () => {
    const afterPass = await readFile(afterPassPath, "utf8")
    const passGuide = passGuideSection(afterPass)
    expectContainsAll(passGuide, requestWhenChosenPhrases)
    expectContainsAll(passGuide, noImplAcceptCompletePhrases)
  })

  test("[1][4][8][21][33] 回答の要件側 合格案内", async () => {
    const reflect = await readFile(reflectStagePath, "utf8")
    const afterPass = await readFile(afterPassPath, "utf8")
    const section = answerRequirementsSection(reflect)
    const passGuide = passGuideSection(afterPass)
    expect(section).toContain(followPassGuide)
    expectSectionLacksPassGuidePhrases(section, reqPassGuideCorePhrases)
    expectContainsAll(section, reqPassGuideBranchPhrases)
    expect(section).toContain(showBeforePassGuidePhrase)
    expect(passGuide).toContain(
      answerReqExtraPhrases[0],
    )
    expect(section).not.toContain(answerReqExtraPhrases[0])
    expect(section).toContain(answerReqExtraPhrases[1])
  })

  test("[5][7][9][30][31][32][34][35][36] 回答の設計側 合格案内", async () => {
    const reflect = await readFile(reflectStagePath, "utf8")
    const afterPass = await readFile(afterPassPath, "utf8")
    const section = answerDesignSection(reflect)
    const passGuide = passGuideSection(afterPass)
    expect(section).toContain("修正を起動しない。")
    expect(section).toContain("作成も起動しない。")
    expect(section).toContain(followPassGuide)
    expectSectionLacksPassGuidePhrases(section, designPassGuideCorePhrases)
    expectContainsAll(passGuide, designPassGuideCorePhrases)
    expectContainsAll(section, designPassGuideBranchPhrases)
    expect(section).toContain(showBeforePassGuidePhrase)
    expect(section).not.toContain("`sdd-cur gate <番号> request`")
    expectContainsAll(passGuide, requestWhenChosenPhrases)
    expectContainsAll(passGuide, noImplAcceptCompletePhrases)
  })

  test("[13][14][54][55][56][57][58][59][60][61][62] 満たされているかの判断", async () => {
    const afterPass = await readFile(afterPassPath, "utf8")
    const section = judgmentSection(afterPass)
    expect(section).toContain(
      "閉じるかどうかの確認は、根拠を示せるときに `閉じる` と `閉じない` を出す。",
    )
    expect(section).toContain(
      "根拠を示せるときは、合格の案内より先に、`閉じる` と `閉じない` を出す。",
    )
    expect(section).toContain("選択肢の文言は `閉じる` と `閉じない` である。")
    expect(section).toContain("`sdd-cur close <番号>`")
    expect(section).toContain(judgmentWhileClosePhrase)
    const closeChosen = paragraphFrom(
      afterPass,
      "`閉じる` を選んだときは、`sdd-cur close <番号>` を実行する。",
      "どちらの選択でも、その回に書いた要件ファイルと設計ファイルは、",
    )
    expectContainsAll(closeChosen, judgmentCloseChosenPhrases)
    const shimenai = paragraphFrom(
      afterPass,
      "`閉じない` を選んだときは、課題を閉じない。",
      "`閉じる` を選んだときは、`sdd-cur close <番号>` を実行する。",
    )
    expect(shimenai).not.toContain(
      "設計の手順は、人が設計を依頼したときだけ始める。",
    )
    expect(shimenai).not.toContain(
      "人が設計の完了を伝えたときの push と「実装依頼」は、今どおり人が行う。",
    )
    expect(shimenai).toContain("合格のあとの案内に従う。")
    for (const phrase of requestWhenChosenPhrases) {
      expect(shimenai).not.toContain(phrase)
    }
    for (const phrase of noImplAcceptCompletePhrases) {
      expect(shimenai).not.toContain(phrase)
    }
    expect(section).toContain(
      "合格の案内の二択と、その選択のあとと、質問を出しているあいだの禁止は、`合格のあとの案内` に書く。",
    )
    expect(section).not.toContain(
      "要件の合格の案内は、Cursor の質問機能で「設計に進む」と「ここで止める」を、この順で出すことである。",
    )
    const passGuide = passGuideSection(afterPass)
    expect(passGuide).toContain(
      "要件の合格の案内は、Cursor の質問機能で「設計に進む」と「ここで止める」を、この順で出すことである。",
    )
    expect(passGuide).toContain(
      "設計の合格の案内は、Cursor の質問機能で「実装依頼する」と「ここで止める」を、この順で出すことである。",
    )
  })

  test("[45][46][47][48][49][50][51][52][53] 禁止", async () => {
    const skill = await readFile(skillPath, "utf8")
    const section = prohibitionSection(skill)
    expectContainsAll(section, prohibitionPhrases)
    expect(section).not.toContain("直前の三文")
    expect(section).toContain("`after-pass.md` の `## 合格のあとの案内`")
  })

  test("[15][63][64][65][66][67][68][69] 正本 git REQ-635 REQ-801 REQ-803（REQ-641 は無い）", async () => {
    const git = await readFile(gitCanonicalPath, "utf8")
    expect(git).not.toContain("## REQ-641")
    for (const id of ["REQ-635", "REQ-801", "REQ-803"] as const) {
      expect(reqBody(git, id)).toBe(canonicalBodies[id])
    }
  })

  test("[70][71][72] 正本 REQ-802 REQ-790 REQ-779 は変えない", async () => {
    const git = await readFile(gitCanonicalPath, "utf8")
    const docs = await readFile(docsCanonicalPath, "utf8")
    expect(reqBody(git, "REQ-802")).toBe(canonicalBodies["REQ-802"])
    expect(reqBody(git, "REQ-790")).toBe(canonicalBodies["REQ-790"])
    expect(reqBody(docs, "REQ-779")).toBe(canonicalBodies["REQ-779"])
  })
})
