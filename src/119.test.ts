import { afterEach, describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { policyTemplate } from "./init.ts"
import { defaultSkillsSourceDir, installSkills } from "./install.ts"

const repoRoot = path.join(import.meta.dir, "..")
const designPath = path.join(repoRoot, "docs/issues/119/design.md")
const design200Path = path.join(repoRoot, "docs/issues/200/design.md")
const skillPath = path.join(repoRoot, "skills/sdd-cur-policy/SKILL.md")
const readmePath = path.join(repoRoot, "README.md")
const docsCanonicalPath = path.join(repoRoot, "docs/canonical/docs.md")
const installSrcPath = path.join(import.meta.dir, "install.ts")

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

const policyTemplateNonEmptyLines = policyTemplate
  .split("\n")
  .filter((line) => line.trim() !== "")

const expectedInstallSkillSentence =
  "`install` がコピーするスキルは `skills/sdd-cur`、`skills/sdd-cur-complete`、`skills/sdd-cur-create-issue`、`skills/sdd-cur-fix`、`skills/sdd-cur-implement`、`skills/sdd-cur-policy`、`skills/sdd-cur-quick`、`skills/sdd-cur-steering` である。"

const expectedDirectoryDiagramLine =
  "skills/sdd-cur-policy/        install がコピーする方針の下書きのスキル"

function sorted(set: Set<string>): string[] {
  return [...set].sort()
}

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

describe("課題 119", () => {
  test("skills/sdd-cur-policy/SKILL.md は設計「スキル」と一致する", async () => {
    const design = await readFile(designPath, "utf8")
    const expected = fencedBlockAfter(
      design,
      "ファイルは、末尾の改行を含めて、次と一文字も違わない。",
    )
    const skill = await readFile(skillPath, "utf8")
    expect(skill).toBe(expected)
    expect(skill).toContain("disable-model-invocation: true")
    const dir = path.dirname(skillPath)
    expect(path.basename(dir)).toBe("sdd-cur-policy")
    expect(path.basename(skillPath)).toBe("SKILL.md")
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
      "ファイルを書くとき、書くパスは、作業ツリーの `docs/policy.md` だけである。",
    )

    for (const phrase of [
      "課題を作らない。",
      "課題を変えない。",
      "ラベルを変えない。",
      "課題コメントを書かない。",
      "作業ツリーの `docs/policy.md` 以外のパスへは書かない。",
    ]) {
      expect(kinshi).toContain(phrase)
    }

    for (const phrase of [
      "作業ツリーに `docs/policy.md` が無いときは、そのパスへ四節の下書きを書く。",
      "非空行がすべて上の八つのいずれかであるときは、そのパスへ四節の下書きを書く。",
    ]) {
      expect(kaku).toContain(phrase)
    }

    for (const line of policyTemplateNonEmptyLines) {
      expect(kaku).toContain(`- \`${line}\``)
    }
  })

  test("スキル本文の記述と根拠", async () => {
    const skill = await readFile(skillPath, "utf8")
    const kisai = sectionBetween(skill, "## 記述", "## 禁止")

    for (const phrase of [
      "一つ目は `## 誰のための道具か` である。",
      "二つ目は `## 技術の前提` である。",
      "三つ目は `## 構成` である。",
      "四つ目は `## 破ってはいけない原則` である。",
      "下書きに書く記述は、一文である。",
      "作業ツリーの中の一つのファイルと、一つの行番号を含む。",
      "根拠のファイルと行が無い点は、`docs/policy.md` に書かない。",
      "その点は、人に質問する。",
    ]) {
      expect(kisai).toContain(phrase)
    }
    expect(skill).toContain("作業の前に `sdd-cur/conventions.md` を読む。")
  })

  test("スキル本文の読む対象", async () => {
    const skill = await readFile(skillPath, "utf8")
    const yomu = sectionBetween(skill, "## 読む", "## 書く先")

    for (const phrase of [
      "下書きの手順は、作業ツリーのコードを読む。",
      "作業ツリーに README があるときは、その README を読む。",
      "作業ツリーに README が無いときは、README を読まない。",
      "README が無いときは、README を除き、下書きの手順が読むほかの対象だけで進める。",
      "README が無いときは、README を根拠にする記述を書かない。",
      "下書きの手順は、作業ツリーのパッケージ定義を読む。",
      "作業ツリーに `package.json` が一つあるときは、そのファイルを読む。",
      "作業ツリーに `package.json` が複数あるときは、作業ツリーのルートにある `package.json` だけを読む。",
      "下書きの手順は、作業ツリーの最上位のディレクトリ構成を読む。",
      "下書きの手順は、テストの実行方法を読む。",
      "根拠にするファイルは、作業ツリーの中のファイルだけである。",
    ]) {
      expect(yomu).toContain(phrase)
    }
  })

  test("スキル本文の候補選択", async () => {
    const skill = await readFile(skillPath, "utf8")
    const kisai = sectionBetween(skill, "## 記述", "## 禁止")
    const kaku = sectionBetween(skill, "## 書く先", "## 記述")

    for (const phrase of [
      "「誰のための道具か」の記述に、ファイルと行の組が二つ以上あるときは、候補を出して人に選ばせる。",
      "「破ってはいけない原則」の記述に、ファイルと行の組が二つ以上あるときは、候補を出して人に選ばせる。",
      "人がまだ選んでいない候補に当たる記述は、`docs/policy.md` に書かない。",
      "候補を出していて、人がまだ選んでいないあいだは、`docs/policy.md` を書かない。",
      "選んだファイルと行番号を、その記述の根拠にする。",
      "選んだ記述を含めて四節の下書きを書く。",
    ]) {
      expect(kisai).toContain(phrase)
    }
    expect(kaku).toContain(
      "このときは、人が候補を選んでも、そのファイルへは書かない。",
    )
  })

  test("スキル本文の既存 policy と通常ファイル", async () => {
    const skill = await readFile(skillPath, "utf8")
    const kaku = sectionBetween(skill, "## 書く先", "## 記述")

    for (const phrase of [
      "上の八つのどれとも一致しない非空行があるときは、そのファイルの内容を変えない。",
      "その文がまだそのファイルに無いものを、人に見せる。",
      "そのファイルへ書かずに止まる。",
      "通常ファイルは、`stat` の結果で `isFile()` が真であるファイルである。",
      "`docs/policy.md` が存在し、通常ファイルではないときは、そのパスの内容を変えない。",
      "そのときは、下書きを書かない。",
      "そのときは、理由を人に伝えて止まる。",
      "そのときは、非空行の一致は見ない。",
      "そのときは、人が候補を選んでも、そのファイルへは書かない。",
      "`docs/policy.md` への書き込みが失敗したときは、下書きを完了とみなさない。",
      "失敗したあとの `docs/policy.md` は、書き込みを始める前と同じである。",
    ]) {
      expect(kaku).toContain(phrase)
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

    test("sdd-cur-policy をコピーし install.ts に名前は無い", async () => {
      tempRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-cur-119-install-"))
      const source = await readFile(skillPath, "utf8")
      const result = await installSkills({
        homedir: tempRoot,
        projectRoot: tempRoot,
        skillsSourceDir: defaultSkillsSourceDir,
      })
      expect(result.skillNames).toContain("sdd-cur-policy")
      const copied = await readFile(
        path.join(result.destDir, "sdd-cur-policy", "SKILL.md"),
        "utf8",
      )
      expect(copied).toBe(source)
      const installSrc = await readFile(installSrcPath, "utf8")
      expect(installSrc).not.toContain("sdd-cur-policy")
    })
  })

  test("README のスキル列挙とディレクトリ図", async () => {
    const design = await readFile(design200Path, "utf8")
    const readme = await readFile(readmePath, "utf8")
    const expectedSentence = fencedBlockAfter(
      design,
      "README の、`install` がコピーするスキルを列挙する文は、次の一行にする。",
    ).trimEnd()
    const expectedDiagramLine = fencedBlockAfter(
      design,
      "「ディレクトリ」のコードフェンスでは、`skills/sdd-cur-quick/` の行の直後に、次の行を置く。",
    ).trimEnd()

    expect(readme).toContain(expectedSentence)
    expect(readme).toContain(expectedInstallSkillSentence)
    const installLine = readme
      .split("\n")
      .find((l) => l.includes("`install` がコピーするスキルは"))
    expect(installLine).toBeDefined()
    expect(installLine).toContain(expectedInstallSkillSentence)
    expect(installLine).toContain("`skills/sdd-cur-policy`")

    const fence = firstCodeFenceAfter(readme, "## ディレクトリ")
    expect(fence.split("\n").some((l) => l === expectedDiagramLine)).toBe(true)
    expect(fence).toContain(expectedDirectoryDiagramLine)
  })

  test("README と skills/ の一致に sdd-cur-policy が含まれる", () => {
    const expected = skillDirNames()
    const readme = readFileSync(readmePath, "utf8")
    expect(sorted(skillNamesFromInstallSentence(readme))).toEqual(
      sorted(expected),
    )
    expect(sorted(skillNamesFromDirectoryDiagram(readme))).toEqual(
      sorted(expected),
    )
    expect(expected.has("sdd-cur-policy")).toBe(true)
  })

  test("docs/canonical/docs.md の REQ-717", async () => {
    const design = await readFile(design200Path, "utf8")
    const canonical = await readFile(docsCanonicalPath, "utf8")
    const diffSection = design.split("## 正本への差分")[1] ?? ""
    const m = diffSection.match(/^### 変更 docs REQ-717\n\n([\s\S]*)$/m)
    expect(m).not.toBeNull()
    const expectedBody = m![1].trimEnd()
    expect(reqBody(canonical, "REQ-717")).toBe(expectedBody)
    expect([...expectedSkillDirOrder].sort()).toEqual([
      ...expectedSkillDirOrder,
    ])
    for (const name of expectedSkillDirOrder) {
      expect(expectedBody).toContain(name)
    }
  })
})
