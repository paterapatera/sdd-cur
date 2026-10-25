import { afterEach, describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { defaultSkillsSourceDir, installSkills } from "./install.ts"

const repoRoot = path.join(import.meta.dir, "..")
const designPath = path.join(repoRoot, "docs/issues/200/design.md")
const skillPath = path.join(repoRoot, "skills/sdd-cur-steering/SKILL.md")
const readmePath = path.join(repoRoot, "README.md")
const policyPath = path.join(repoRoot, "docs/policy.md")
const docsCanonicalPath = path.join(repoRoot, "docs/canonical/docs.md")
const installSrcPath = path.join(import.meta.dir, "install.ts")
const initSrcPath = path.join(import.meta.dir, "init.ts")

const expectedSkillDirOrder = [
  "sdd-cur",
  "sdd-cur-complete",
  "sdd-cur-create-issue",
  "sdd-cur-fix",
  "sdd-cur-implement",
  "sdd-cur-policy",
  "sdd-cur-quick",
  "sdd-cur-steering",
] as const

const otherProjectSection = `## 他のプロジェクトで使う

1. \`bun add -g @paterapatera/sdd-cur\`
2. プロジェクトのルートで \`sdd-cur setup\` を実行する。
3. Cursor で \`sdd-cur-policy\` を起動し、\`docs/policy.md\` の下書きを作る。
4. \`sdd-cur-create-issue\` で課題を作り、\`sdd-cur\` で要件と設計を進める。
5. ランナー用に別のディレクトリへクローンし、そこで \`sdd-cur run\` を動かす。
6. 課題の担当者を、ランナーの \`gh\` のログインにする。
`

function fencedBlockAfter(text: string, anchor: string): string {
  const pos = text.indexOf(anchor)
  expect(pos).toBeGreaterThanOrEqual(0)
  const open = text.indexOf("```\n", pos)
  expect(open).toBeGreaterThanOrEqual(0)
  const bodyStart = open + 4
  const close = text.indexOf("\n```", bodyStart)
  expect(close).toBeGreaterThan(bodyStart)
  return `${text.slice(bodyStart, close)}\n`
}

function sectionBetween(
  text: string,
  startHeading: string,
  endHeading: string,
): string {
  const start = text.indexOf(startHeading)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = text.indexOf(endHeading, start + startHeading.length)
  expect(end).toBeGreaterThan(start)
  return text.slice(start, end)
}

function firstCodeFenceAfter(text: string, heading: string): string {
  const idx = text.indexOf(heading)
  expect(idx).toBeGreaterThanOrEqual(0)
  const after = text.slice(idx + heading.length)
  const fenceStart = after.indexOf("```")
  expect(fenceStart).toBeGreaterThanOrEqual(0)
  const rest = after.slice(fenceStart + 3)
  const langEnd = rest.indexOf("\n")
  const bodyStart = langEnd === -1 ? 0 : langEnd + 1
  const fenceEnd = rest.indexOf("```", bodyStart)
  expect(fenceEnd).toBeGreaterThanOrEqual(0)
  return rest.slice(bodyStart, fenceEnd)
}

function skillDirNames(): Set<string> {
  const skillsRoot = path.join(repoRoot, "skills")
  const names = new Set<string>()
  for (const ent of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (ent.isDirectory()) names.add(ent.name)
  }
  return names
}

function skillNamesFromInstallSentence(readme: string): Set<string> {
  const line = readme
    .split("\n")
    .find((l) => l.includes("`install` がコピーするスキルは"))
  expect(line).toBeDefined()
  const names = new Set<string>()
  for (const m of line!.matchAll(/`skills\/([^`/]+)`/g)) {
    names.add(m[1])
  }
  return names
}

function skillNamesFromDirectoryDiagram(readme: string): Set<string> {
  const fence = firstCodeFenceAfter(readme, "## ディレクトリ")
  const names = new Set<string>()
  for (const line of fence.split("\n")) {
    const trimmed = line.trimStart()
    const m = trimmed.match(/^skills\/([^/]+)\//)
    if (m) names.add(m[1])
  }
  return names
}

function reqBody(canonical: string, id: string): string {
  const heading = `## ${id}`
  const start = canonical.indexOf(heading)
  expect(start).toBeGreaterThanOrEqual(0)
  const after = canonical.slice(start + heading.length)
  const next = after.search(/\n## REQ-/)
  const block = next === -1 ? after : after.slice(0, next)
  return block
    .split("\n")
    .slice(1)
    .join("\n")
    .trim()
}

function sorted(set: Set<string>): string[] {
  return [...set].sort()
}

describe("課題 200", () => {
  test("skills/sdd-cur-steering/SKILL.md は設計「スキル」と一致する", async () => {
    const design = await readFile(designPath, "utf8")
    const expected = fencedBlockAfter(
      design,
      "ファイルは、末尾の改行を含めて、次と一文字も違わない。",
    )
    const skill = await readFile(skillPath, "utf8")
    expect(skill).toBe(expected)
    expect(skill).toContain("disable-model-invocation: true")
    expect(skill).toContain("name: sdd-cur-steering")
    expect(skill).toContain(
      "人が明示して起動したときだけ、起動した作業ツリーのソースコードと設定ファイルから",
    )
    expect(skill).toContain("docs/steering/structure.md")
    expect(skill).toContain("docs/steering/terms.md")
  })

  test("スキル本文の起動・禁止・書き先", async () => {
    const skill = await readFile(skillPath, "utf8")
    const kidou = sectionBetween(skill, "## 起動", "## 読む")
    const kaku = sectionBetween(skill, "## 書く先", "## 記述")
    const kinshi = skill.slice(skill.indexOf("## 禁止"))

    for (const phrase of [
      "人がこのスキルを明示して起動したときだけ、下書きの手順を行う。",
      "人がこのスキルを明示して起動していないときは、下書きの手順を行わない。",
    ]) {
      expect(kidou).toContain(phrase)
    }

    expect(kaku).toContain(
      "ファイルを書くとき、書くパスは、作業ツリーの `docs/steering/structure.md` と `docs/steering/terms.md` だけである。",
    )

    for (const phrase of [
      "課題を作らない。",
      "課題を変えない。",
      "課題を閉じない。",
      "ラベルを変えない。",
      "課題コメントを書かない。",
      "作業ツリーの `docs/steering/structure.md` と `docs/steering/terms.md` 以外のパスへは書かない。",
    ]) {
      expect(kinshi).toContain(phrase)
    }
  })

  test("スキル本文の読む対象", async () => {
    const skill = await readFile(skillPath, "utf8")
    const yomu = sectionBetween(skill, "## 読む", "## 書く先")

    for (const phrase of [
      "下書きの手順は、作業ツリーのソースコードを読む。",
      "下書きの手順は、作業ツリーの設定ファイルを読む。",
      "README は読まない。",
      "パッケージ定義は読まない。",
      "根拠にするファイルは、作業ツリーの中のファイルだけである。",
    ]) {
      expect(yomu).toContain(phrase)
    }
  })

  test("スキル本文の記述と根拠", async () => {
    const skill = await readFile(skillPath, "utf8")
    const kisai = sectionBetween(skill, "## 記述", "## 禁止")

    for (const phrase of [
      "下書きに書く記述は、一文である。",
      "作業ツリーの中の一つのファイルと、一つの行番号を含む。",
      "記述の行は、`#` で始めない。",
      "根拠のファイルと行が無い点は、`docs/steering/structure.md` にも `docs/steering/terms.md` にも書かない。",
      "その点は、人に質問する。",
      "人の答えだけでは、根拠のファイルと行が無い記述を書かない。",
      "根拠のファイルと行が無い点を質問することは、ほかの記述を下書きへ書くことを止めない。",
      "見出しの字面は、固定しない。",
    ]) {
      expect(kisai).toContain(phrase)
    }
  })

  test("スキル本文の候補選択と追記", async () => {
    const skill = await readFile(skillPath, "utf8")
    const kisai = sectionBetween(skill, "## 記述", "## 禁止")
    const kaku = sectionBetween(skill, "## 書く先", "## 記述")

    for (const phrase of [
      "ディレクトリ、命名、テストの置き場所のいずれかについて、一つの記述に根拠のファイルと行の組が二つ以上あるときは、その記述は `docs/steering/structure.md` の下書きに書かない。",
      "そのときは、候補を出して人に選ばせる。",
      "人がまだ選んでいない候補に当たる記述は、`docs/steering/structure.md` に書かない。",
      "人が書き足した行が無く、候補を出していて、人がまだ選んでいないあいだは、`docs/steering/structure.md` を書かない。",
      "ドメインの用語についての一つの記述に、根拠のファイルと行の組が二つ以上あるときは、その記述は `docs/steering/terms.md` の下書きに書かない。",
      "そのときは、候補を出さない。",
      "その点を人に質問しない。",
      "人が書き足した行は、変えない。",
      "追記の候補として人に見せる。",
      "その起動ではファイルへ書かない。",
    ]) {
      expect(kisai.includes(phrase) || kaku.includes(phrase)).toBe(true)
    }

    for (const phrase of [
      "組が一つである記述が一つも無く、人に選ばせる候補も無いときは、`docs/steering/structure.md` を作らない。",
      "ドメインの用語について、組が一つである記述が一つも無いときは、`docs/steering/terms.md` を作らない。",
      "非空行が無い `docs/steering/structure.md` は、ファイルが無いのと同型に扱う。",
      "非空行が無い `docs/steering/terms.md` は、ファイルが無いのと同型に扱う。",
    ]) {
      expect(kaku).toContain(phrase)
    }
  })

  test("スキル本文は一文一行", async () => {
    const skill = await readFile(skillPath, "utf8")
    const body = skill.split("---\n").slice(2).join("---\n").trimEnd()
    const lines = body.split("\n")
    for (const line of lines) {
      if (line.startsWith("#") || line.trim() === "") continue
      expect(line).not.toMatch(/。.*。/)
    }
  })

  describe("installSkills", () => {
    let tempRoot = ""

    afterEach(async () => {
      if (tempRoot) {
        await rm(tempRoot, { recursive: true, force: true })
        tempRoot = ""
      }
    })

    test("sdd-cur-steering をコピーし install.ts に名前は無い", async () => {
      tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-200-install-"))
      const source = await readFile(skillPath, "utf8")
      const result = await installSkills({
        homedir: tempRoot,
        projectRoot: tempRoot,
        skillsSourceDir: defaultSkillsSourceDir,
      })
      expect(result.skillNames).toContain("sdd-cur-steering")
      const copied = await readFile(
        path.join(result.destDir, "sdd-cur-steering", "SKILL.md"),
        "utf8",
      )
      expect(copied).toBe(source)
      const installSrc = await readFile(installSrcPath, "utf8")
      expect(installSrc).not.toContain("sdd-cur-steering")
    })
  })

  test("README のスキル列挙とディレクトリ図", async () => {
    const design = await readFile(designPath, "utf8")
    const readme = await readFile(readmePath, "utf8")
    const expectedSentence = fencedBlockAfter(
      design,
      "README の、`install` がコピーするスキルを列挙する文は、次の一行にする。",
    ).trimEnd()
    const expectedDiagramLine = fencedBlockAfter(
      design,
      "「ディレクトリ」のコードフェンスでは、`skills/sdd-cur-quick/` の行の直後に、次の行を置く。",
    ).trimEnd()

    const installLine = readme
      .split("\n")
      .find((l) => l.includes("`install` がコピーするスキルは"))
    expect(installLine).toBeDefined()
    expect(installLine).toContain(expectedSentence)

    const fence = firstCodeFenceAfter(readme, "## ディレクトリ")
    expect(fence.split("\n").some((l) => l === expectedDiagramLine)).toBe(true)
    const quickIdx = fence
      .split("\n")
      .findIndex((l) => l.trimStart().startsWith("skills/sdd-cur-quick/"))
    const steeringIdx = fence
      .split("\n")
      .findIndex((l) => l.trimStart().startsWith("skills/sdd-cur-steering/"))
    expect(quickIdx).toBeGreaterThanOrEqual(0)
    expect(steeringIdx).toBeGreaterThan(quickIdx)
    expect(readme).toContain("正本の表にあるパスは、ここには繰り返さない。")
  })

  test("README の他のプロジェクトで使う", async () => {
    const readme = await readFile(readmePath, "utf8")
    const start = readme.indexOf(otherProjectSection)
    expect(start).toBeGreaterThanOrEqual(0)
  })

  test("README と skills/ の一致に sdd-cur-steering が含まれる", () => {
    const expected = skillDirNames()
    const readme = readFileSync(readmePath, "utf8")
    expect(sorted(skillNamesFromInstallSentence(readme))).toEqual(
      sorted(expected),
    )
    expect(sorted(skillNamesFromDirectoryDiagram(readme))).toEqual(
      sorted(expected),
    )
    expect(expected.has("sdd-cur-steering")).toBe(true)
  })

  test("docs/policy.md の構成", async () => {
    const policy = await readFile(policyPath, "utf8")
    expect(policy).toContain(
      "`sdd-cur-steering` は、人が明示して起動したとき、作業ツリーのソースコードと設定ファイルから `docs/steering/structure.md` と `docs/steering/terms.md` の下書きを書く。",
    )
    expect(policy).toContain("直下のディレクトリだけが対象")
    expect(policy).toContain(
      "任意で `<名前>.md` を直下に置ける。十サブエージェントは `docs/policy.md` のあと直下の `.md` をすべて読む。",
    )
    expect(policy.indexOf("## 誰のための道具か")).toBeLessThan(
      policy.indexOf("## 技術の前提"),
    )
    expect(policy.indexOf("## 技術の前提")).toBeLessThan(
      policy.indexOf("## 構成"),
    )
    expect(policy.indexOf("## 構成")).toBeLessThan(
      policy.indexOf("## 破ってはいけない原則"),
    )
    expect(policy).toContain(
      "このファイルを変えるのは、課題を通したときだけである。",
    )
  })

  test("docs/canonical/docs.md の REQ-717", async () => {
    const design = await readFile(designPath, "utf8")
    const canonical = await readFile(docsCanonicalPath, "utf8")
    const diffSection = design.split("## 正本への差分")[1] ?? ""
    const m = diffSection.match(/^### 変更 docs REQ-717\n\n([\s\S]*)$/m)
    expect(m).not.toBeNull()
    const expectedBody = m![1].trimEnd()
    expect(reqBody(canonical, "REQ-717")).toBe(expectedBody)
    for (const name of expectedSkillDirOrder) {
      expect(expectedBody).toContain(name)
    }
  })

  test("initTargets は三つの相対パスのまま", async () => {
    const initSrc = await readFile(initSrcPath, "utf8")
    expect(initSrc).toContain('rel: "docs/policy.md"')
    expect(initSrc).toContain('rel: "docs/canonical/README.md"')
    expect(initSrc).toContain('rel: "docs/issues/README.md"')
    const relMatches = [...initSrc.matchAll(/rel: "([^"]+)"/g)].map((m) => m[1])
    const initRels = relMatches.filter((r) => r.startsWith("docs/"))
    expect(initRels).toEqual([
      "docs/policy.md",
      "docs/canonical/README.md",
      "docs/issues/README.md",
    ])
  })
})
