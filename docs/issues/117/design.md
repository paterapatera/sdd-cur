# 117 仕組みの約束をスキルと一緒に配り、このリポジトリ固有の書き方と分ける

<!-- sdd-cur:form -->

対象は [Issue #117](https://github.com/paterapatera/sdd-cur/issues/117)。`docs/conventions.md` のうち、仕組みの約束を `skills/sdd-cur/conventions.md` へ移す。`install` はスキルのディレクトリを、今どおり中身ごとコピーする。このリポジトリでスキルとテストを書くときだけの書き方は、`docs/conventions.md` に残す。

重なる課題は #116、#97、#113 である。方針ファイルの扱いは #118 である。

## 受け入れ条件

- 1. 条件: 仕組みの約束として配る節を見る 主体: `skills/sdd-cur/conventions.md` 結果: 「課題ごとのファイル」「仕様の正本」「レビューが読む範囲」「課題コメントの種別」「反映済みの回答」「未反映の回答」「マージリクエストの会話コメント」「処理済みの不具合」「レビューの判定」「マージリクエストの本文」「着手の課題コメント」「要件と設計の形式」である
- 2. 条件: 配る十二節を見る 主体: `skills/sdd-cur/conventions.md` 結果: 節の文言は、移す前と一文字も違わない
- 3. 条件: 題 `# 約束` の置き場所を見る 主体: リポジトリ 結果: `skills/sdd-cur/conventions.md` にある
- 4. 条件: 導入の置き場所を見る 主体: リポジトリ 結果: 今の `docs/conventions.md` の導入が `skills/sdd-cur/conventions.md` にある
- 5. 条件: 導入の文言を見る 主体: `skills/sdd-cur/conventions.md` 結果: 移す前と一文字も違わない
- 6. 条件: 節「スキル、サブエージェント、テストの書き方」の置き場所を見る 主体: このリポジトリ 結果: `docs/conventions.md` に残る
- 7. 条件: 書き方の節を見る 主体: `docs/conventions.md` 結果: 見出しと文言は、移す前と一文字も違わない
- 8. 条件: `install` がコピーするファイルを見る 主体: コピーされた `sdd-cur/conventions.md` 結果: 書き方の節を含まない
- 9. 条件: 配る本文を見る 主体: `skills/sdd-cur/conventions.md` 結果: 書き方の節を含まない
- 10. 条件: `docs/conventions.md` に残る節を見る 主体: `docs/conventions.md` 結果: 書き方の節だけである
- 11. 条件: `docs/conventions.md` を見る 主体: `docs/conventions.md` 結果: 仕組みの約束へのリンクがある
- 12. 条件: そのリンクの行き先を見る 主体: `docs/conventions.md` 結果: `skills/sdd-cur/conventions.md` である
- 13. 条件: 仕組みの約束の置き場所を見る 主体: リポジトリ 結果: `skills/sdd-cur/conventions.md` である
- 14. 条件: `install` がスキルのディレクトリをコピーする 主体: `install` 結果: 導入先の `sdd-cur/conventions.md` になる
- 15. 条件: ほかのスキルとサブエージェントの本文を見る 主体: その本文 結果: `sdd-cur/conventions.md` を読む、と書く
- 16. 条件: 導入先のプロジェクトに `docs/conventions.md` が無い 主体: スキルとサブエージェント 結果: 仕組みの約束を読める
- 17. 条件: 仕組みの約束の参照先を見る 主体: スキルとサブエージェント 結果: 導入先の `docs/conventions.md` ではない
- 18. 条件: `skills/sdd-cur/SKILL.md` の、作業の前に読む参照を見る 主体: そのファイル 結果: `sdd-cur/conventions.md` を読む参照である
- 19. 条件: `AGENTS.md` の着手前に読むものを見る 主体: `AGENTS.md` 結果: `skills/sdd-cur/conventions.md` を読む
- 20. 条件: `AGENTS.md` の着手前に読むものを見る 主体: `AGENTS.md` 結果: `docs/conventions.md` に残した書き方の節を読む
- 21. 条件: `AGENTS.md` を見る 主体: `AGENTS.md` 結果: 書き方の節の本文は無い
- 22. 条件: `docs/policy.md` の構成表を見る 主体: 構成表 結果: 仕組みの約束の置き場所は `skills/sdd-cur/conventions.md` である
- 23. 条件: `docs/policy.md` の構成表を見る 主体: 構成表 結果: 文「スキル、サブエージェント、テストの書き方は、このファイルを読む。」が残る
- 24. 条件: その文の指すファイルを見る 主体: 構成表 結果: 書き方の節を残した `docs/conventions.md` である
- 25. 条件: スキル本文を文字列で確かめ、`docs/conventions.md` を仕組みの約束の参照として期待している 主体: そのテスト 結果: `sdd-cur/conventions.md` の参照を期待する
- 26. 条件: 仕組みの約束の文言を `docs/conventions.md` から読んで確かめている 主体: そのテスト 結果: `skills/sdd-cur/conventions.md` の同じ文言を確かめる
- 27. 条件: 書き方の節を `docs/conventions.md` に期待している 主体: そのテスト 結果: 移したあとも `docs/conventions.md` のその節を期待する
- 28. 条件: `AGENTS.md` の参照を文字列で確かめている 主体: そのテスト 結果: 着手前に `skills/sdd-cur/conventions.md` を読む参照を期待する
- 29. 条件: `docs/policy.md` に、書き方はこのファイルを読む、と期待している 主体: そのテスト 結果: その文を期待したままである
- 30. 条件: `AGENTS.md` に書き方の詳細の文が無いことを期待している 主体: そのテスト 結果: 期待は変わらない
- 31. 条件: これらのテストが確かめる約束の節の文言を見る 主体: そのテスト 結果: 文言は変えない

## 範囲外

次は、この要件に含めない。

- 約束の中身を変えること
- `src/conventions.ts` の判定を変えること
- 方針ファイルを導入先に用意すること。`init` を足すこと。方針のひな形を作ること（#118）
- 仕様ディレクトリの名前を変えること（#113）
- `sdd-cur conventions` サブコマンドを足すこと
- `src/install.ts` と `src/cli.ts` を変えること
- README を変えること
- #116 が変えた、スキルとサブエージェントのコマンド名を変えること
- 一文一行の分割を、配る十二節と、残す書き方の節へ適用すること
- この課題以外の `requirements.md` と `design.md` を変えること

## 決定

| 項目 | 内容 |
|---|---|
| 配るファイル | `skills/sdd-cur/conventions.md`。導入先では、スキル宛先の `sdd-cur/conventions.md` |
| 残すファイル | `docs/conventions.md`。残す節は書き方の節だけである。同じファイルに、配るファイルへのリンクを置く |
| コピー | `installSkills` は変えない。ディレクトリ以外はコピーしない今の規則のまま、ディレクトリの中身をコピーする。`conventions.md` は `skills/sdd-cur/` の中に置く |
| サブコマンド | `sdd-cur conventions` は足さない。`src/cli.ts` の `case` は、今の十五個のままである |
| 参照 | スキルとサブエージェントが読むパスは `sdd-cur/conventions.md` である。このリポジトリの `AGENTS.md` が読むパスは `skills/sdd-cur/conventions.md` である |
| 判定 | `src/conventions.ts` は変えない。ファイルは読まない今のままである |
| 正本 | 変える識別子は、REQ-92、REQ-94、REQ-102、REQ-561 である。足す識別子は、REQ-832、REQ-833、REQ-834、REQ-835 である |

配るファイルは、今の `docs/conventions.md` から、見出し `## スキル、サブエージェント、テストの書き方` の節だけを除いたものである。節は、その見出しの直前の空行から、その見出しの本文の末尾までである。本文の末尾は、行全体が `確かめる文言は変えない。` である行である。次の `## ` 見出しと、その見出しの前の空行は残す。残った文字は、一文字も変えない。足す文は無い。

残る並びは、題 `# 約束`、導入、十二節である。導入は、行全体が `スキルと課題ランナーが同じ規則を使う。判定の実装は `src/conventions.ts` にある。` である行である。十二節の見出しは、この順である。

1. `## 課題ごとのファイル`
2. `## 仕様の正本`
3. `## レビューが読む範囲`
4. `## 課題コメントの種別`
5. `## 反映済みの回答`
6. `## 未反映の回答`
7. `## マージリクエストの会話コメント`
8. `## 処理済みの不具合`
9. `## レビューの判定`
10. `## マージリクエストの本文`
11. `## 着手の課題コメント`
12. `## 要件と設計の形式`

`docs/conventions.md` は、次の一行と、空行と、今の書き方の節だけにする。書き方の節は、見出し `## スキル、サブエージェント、テストの書き方` から、行全体が `確かめる文言は変えない。` である行までである。この範囲の文字は、一文字も変えない。`# 約束` は、このファイルに残さない。導入は、このファイルに残さない。十二節の見出しは、このファイルに残さない。

```
仕組みの約束は [skills/sdd-cur/conventions.md](skills/sdd-cur/conventions.md) にある。
```

スキルとサブエージェントに置く一行は、次である。一文であり、一行である。フロントマターは変えない。

```
作業の前に `sdd-cur/conventions.md` を読む。
```

`skills/sdd-cur/SKILL.md` では、今の `作業の前に `docs/conventions.md` を読む。` を、この一行に置き換える。同じ一行は、このファイルに一つである。

ほかの五つのスキルでは、見出しの次の空行の直後に、この一行を足す。足す前からある空行は残す。五つのファイルは、`skills/sdd-cur-quick/SKILL.md`、`skills/sdd-cur-implement/SKILL.md`、`skills/sdd-cur-complete/SKILL.md`、`skills/sdd-cur-create-issue/SKILL.md`、`skills/sdd-cur-fix/SKILL.md` である。

十一個のサブエージェントでは、本文の最初の非空行の直後に、この一行を足す。最初の非空行は残す。十一個は、`agents/sdd-cur-req-author.md`、`agents/sdd-cur-req-reviewer.md`、`agents/sdd-cur-req-reviewer-high.md`、`agents/sdd-cur-req-fixer.md`、`agents/sdd-cur-design-author.md`、`agents/sdd-cur-design-reviewer.md`、`agents/sdd-cur-design-fixer.md`、`agents/sdd-cur-implement-author.md`、`agents/sdd-cur-implement-reviewer.md`、`agents/sdd-cur-implement-fixer.md`、`agents/sdd-cur-explore.md` である。中級と上級の要求レビュー役は、どちらも本文の 2 行目がこの一行になる。上級の本文の最初の行は、`あなたは sdd-cur の上級の要求レビュー役である。` のままである。2 行目以降は、中級と一文字も違わないままである。

この一行を置いたスキルとサブエージェントの本文に、`docs/conventions.md` は無い。

`AGENTS.md` の「着手前に読むもの」は、次の四行にする。その前後の見出しと、直後の段落 `設計の受け入れ条件、決定、範囲の中で実装する。` は変えない。書き方の節の本文は書かない。`一文を一行` は書かない。文「スキル、サブエージェント、テストの書き方は、このファイルを読む。」は書かない。

```
1. [docs/policy.md](docs/policy.md)
2. [skills/sdd-cur/conventions.md](skills/sdd-cur/conventions.md)
3. [docs/conventions.md](docs/conventions.md) の節「スキル、サブエージェント、テストの書き方」
4. 対象課題の `docs/issues/<番号>/design.md`
```

`docs/policy.md` の構成表では、今の `docs/conventions.md` の行の役割を、書き方の文だけにする。その直後に、仕組みの約束の行を足す。`src/conventions.ts` の行の文言は変えない。`上記約束` が指す直前の行は、仕組みの約束の行である。ほかの行は変えない。

```
| `docs/conventions.md` | スキル、サブエージェント、テストの書き方は、このファイルを読む。 |
| `skills/sdd-cur/conventions.md` | 要件・設計の置き場所と課題コメントの約束。 |
| `src/conventions.ts` | 上記約束の判定（パス、種別、対応、反映済み、未反映） |
```

`install` のコピー先は、`resolveSkillsDestination` が返すディレクトリの `sdd-cur/conventions.md` である。プロジェクトのルートを渡したときは、`<project>/.cursor/skills/sdd-cur/conventions.md` である。書き方の節は、配るファイルに無いので、コピー先にも無い。`docs/conventions.md` は `skills/` の外にあるので、`install` はコピーしない。

## 変えるファイル

- skills/sdd-cur/conventions.md
- docs/conventions.md
- skills/sdd-cur/SKILL.md
- skills/sdd-cur-quick/SKILL.md
- skills/sdd-cur-implement/SKILL.md
- skills/sdd-cur-complete/SKILL.md
- skills/sdd-cur-create-issue/SKILL.md
- skills/sdd-cur-fix/SKILL.md
- agents/sdd-cur-req-author.md
- agents/sdd-cur-req-reviewer.md
- agents/sdd-cur-req-reviewer-high.md
- agents/sdd-cur-req-fixer.md
- agents/sdd-cur-design-author.md
- agents/sdd-cur-design-reviewer.md
- agents/sdd-cur-design-fixer.md
- agents/sdd-cur-implement-author.md
- agents/sdd-cur-implement-reviewer.md
- agents/sdd-cur-implement-fixer.md
- agents/sdd-cur-explore.md
- AGENTS.md
- docs/policy.md
- docs/canonical/conventions.md
- docs/canonical/runner.md
- docs/canonical/install.md
- docs/canonical/sdd.md
- docs/canonical/docs.md
- src/sdd-skill-sdd-cur.test.ts
- src/conventions.test.ts
- src/97.test.ts
- src/117.test.ts

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。新しい `test` は `src/117.test.ts` だけに足す。既存の `src/*.test.ts` に、新しい `test` は足さない。

- `skills/sdd-cur/conventions.md` の最初の非空行は `# 約束` である。導入の行は、決定の導入と一文字も違わない。十二節の見出しは、決定の順で並ぶ。`src/conventions.test.ts` の `docs/conventions.md` という題の `test` は、読み先を `skills/sdd-cur/conventions.md` にする。その `test` の中の `expect` は、一文字も変えない。[1][2][3][4][5][13][26][31]
- `docs/conventions.md` の `## ` 見出しは、`## スキル、サブエージェント、テストの書き方` だけである。決定のリンクの一行がある。`# 約束` は無い。十二節の見出しは無い。`src/97.test.ts` の「docs/conventions.md の書き方の節」は、読み先も、見出しと、`一文を一行` と、`src/<番号>.test.ts` の期待も変えない。[6][7][10][11][12][27]
- `skills/sdd-cur/conventions.md` に、見出し `## スキル、サブエージェント、テストの書き方` は無い。一時ディレクトリを `projectRoot` と `homedir` にして `installSkills` を実行し、スキルのソースはこのリポジトリの `skills/` である。宛先の `sdd-cur/conventions.md` は、ソースの `skills/sdd-cur/conventions.md` と一文字も違わない。終わったら一時ディレクトリを消す。[8][9][14]
- 六つの `SKILL.md` と十一個の `agents/*.md` は、行全体が決定の一行である行を、一つずつ持つ。これらのファイルに `docs/conventions.md` は無い。`src/sdd-skill-sdd-cur.test.ts` の必須文言の `docs/conventions.md` は、`sdd-cur/conventions.md` になる。このファイルに新しい `test` は足さない。[15][16][17][18][25]
- `AGENTS.md` の「着手前に読むもの」の番号付き四行は、決定の四行と一文字も違わない。`一文を一行` は無い。文「スキル、サブエージェント、テストの書き方は、このファイルを読む。」は無い。`src/97.test.ts` の「AGENTS.md の参照」にある今の `expect` は残す。同じ `test` に、`[skills/sdd-cur/conventions.md](skills/sdd-cur/conventions.md)` を含む期待を足す。`src/conventions.test.ts` の「README と AGENTS.md」は、`docs/conventions.md` を含む期待を残し、同じリンクを含む期待を足す。README の期待は変えない。[19][20][21][28][30]
- `docs/policy.md` の構成表に、決定の三行がある。役割が `要件・設計の置き場所と課題コメントの約束。スキル、サブエージェント、テストの書き方は、このファイルを読む。` である行は無い。`src/97.test.ts` が `docs/policy.md` に期待する、書き方はこのファイルを読む、という文は、期待を変えない。`src/cli.ts` に `case "conventions"` は無い。[22][23][24][29]

## 作業の一覧

- 1. `skills/sdd-cur/conventions.md` を、決定の移し方で作る。十二節、題、導入の文字は変えない。[1][2][3][4][5][13]
- 2. `docs/conventions.md` を、決定のリンクの一行と、今の書き方の節だけにする。[6][7][10][11][12]
- 3. 六つのスキルと十一個のサブエージェントへ、決定の一行を置く。`docs/conventions.md` という参照は、これらの本文から除く。[15][16][17][18]
- 4. `AGENTS.md` の着手前の番号付き行を、決定の四行にする。書き方の節の本文は書かない。[19][20][21]
- 5. `docs/policy.md` の構成表を、決定の三行にする。`src/conventions.ts` の行の文言と、ほかの行は変えない。[22][23][24]
- 6. `src/install.ts` と `src/cli.ts` は変えない。`sdd-cur conventions` は足さない。配るファイルは、スキルのディレクトリの中にあるので、今のコピーで導入先の `sdd-cur/conventions.md` になる。書き方の節は、そのファイルに無い。[8][9][14]
- 7. `docs/canonical/conventions.md`、`docs/canonical/runner.md`、`docs/canonical/install.md`、`docs/canonical/sdd.md`、`docs/canonical/docs.md` を、正本への差分の本文にする。[1][2][13][14][15][16][17][18][19][20][21][22][23][24]
- 8. `src/sdd-skill-sdd-cur.test.ts` と `src/conventions.test.ts` と `src/97.test.ts` の、テストの節に書いた期待だけを変える。新しい `test` は足さない。確かめる約束の文言は変えない。[25][26][27][28][29][30][31]
- 9. `src/117.test.ts` に、テストの節の確認を書く。`installSkills` は一時ディレクトリへ実行し、終わったら消す。`gh` は起動しない。[1][3][4][5][6][8][9][10][11][12][13][14][15][16][17][18][19][20][21][22][23][24]

## 関係する課題

- #116（スキルの CLI 呼び出しを `sdd-cur` にする）
- #97（書き方の節を `docs/conventions.md` に置く）
- #113（仕様ディレクトリの名前）
- #118（方針ファイルを導入先に用意する）

#116 は、スキルが CLI を `sdd-cur` で呼ぶようにし、約束と方針のファイルを導入先でどう読むかを、この課題と #118 に残した。この設計は、仕組みの約束の置き場所と参照を変える。#116 が変えたコマンド名は変えない。

#97 は、書き方の節を `docs/conventions.md` に置き、詳細本文を `AGENTS.md` に書かない、と定める。この設計は、その節をこのリポジトリに残し、`install` ではコピーしない。節の文言は変えない。詳細本文は `AGENTS.md` に書かない。

#113 は、仕様ディレクトリの名前を変えた。この設計は、ディレクトリの名前を変えない。移す節の中のパスの文言は変えない。

#118 は、導入先に方針ファイルのひな形と仕様の置き場所を用意する `init` を足す。この設計は、`init` を足さない。方針のひな形を作らない。`docs/policy.md` では、構成表の、仕組みの約束と書き方の参照だけを変える。

## 正本への差分

### 変更 conventions REQ-92

もとになった課題は #117 である。

`skills/sdd-cur/conventions.md` に、課題ごとのファイル、三つのコメント種別、未反映の回答の判定が書いてある。

### 変更 conventions REQ-94

もとになった課題は #117 である。

約束は`skills/sdd-cur/conventions.md`。この設計のファイル、コメント、対応、反映済み、未反映を短く書く。この設計に無い規則は足さないである。

### 変更 conventions REQ-102

もとになった課題は #117 である。

`skills/sdd-cur/conventions.md` には、未回答の確認があるあいだ次の確認を投稿しない、と書く。投稿の抑制は #5 が `unanswered` を見て行う。この課題は投稿しない。

### 変更 runner REQ-561

もとになった課題は #117 である。

不具合の印は `sdd-cur: 不具合` である。`skills/sdd-cur/conventions.md` に、この種別を足す。最初の非空行が印と一文字も違わないとき、その種別である。印の行に、印以外の文字があるときは、種別は付かない。印より後ろが本文である。1 コメントに複数の不具合を書いてよい。判定の実装は `src/conventions.ts` であり、課題コメントの印と同じ規則である。

### 追加 conventions REQ-832

もとになった課題は #117 である。

仕組みの約束として配る節は、「課題ごとのファイル」「仕様の正本」「レビューが読む範囲」「課題コメントの種別」「反映済みの回答」「未反映の回答」「マージリクエストの会話コメント」「処理済みの不具合」「レビューの判定」「マージリクエストの本文」「着手の課題コメント」「要件と設計の形式」である。これらの節の文言は変えない。題 `# 約束` と、導入「スキルと課題ランナーが同じ規則を使う。判定の実装は `src/conventions.ts` にある。」は、`skills/sdd-cur/conventions.md` にある。導入の文言は変えない。節「スキル、サブエージェント、テストの書き方」は、このリポジトリの `docs/conventions.md` に残す。この節の見出しと文言は変えない。`docs/conventions.md` に残す節は、この書き方の節だけである。同じファイルに、行き先が `skills/sdd-cur/conventions.md` であるリンクを置く。配る本文に、この書き方の節は含めない。

### 追加 install REQ-833

もとになった課題は #117 である。

`install` は、スキルのディレクトリを、今どおり中身ごとコピーする。`skills/sdd-cur/conventions.md` は、導入先の `sdd-cur/conventions.md` になる。書き方の節は、コピーしたファイルに無い。`sdd-cur conventions` サブコマンドは、足さない。

### 追加 sdd REQ-834

もとになった課題は #117 である。

`skills/sdd-cur/SKILL.md` は、作業の前に `sdd-cur/conventions.md` を読む、と書く。ほかのスキルとサブエージェントの本文も、`sdd-cur/conventions.md` を読む、と書く。仕組みの約束の参照先は `sdd-cur/conventions.md` である。導入先のプロジェクトに `docs/conventions.md` が無くても、スキルとサブエージェントは、コピーされた `sdd-cur/conventions.md` で仕組みの約束を読める。

### 追加 docs REQ-835

もとになった課題は #117 である。

`AGENTS.md` の着手前に読むものは、`skills/sdd-cur/conventions.md` と、`docs/conventions.md` に残した書き方の節である。書き方の節の本文は、`AGENTS.md` に書かない。`docs/policy.md` の構成表は、仕組みの約束の置き場所を `skills/sdd-cur/conventions.md` として書く。同じ構成表は、文「スキル、サブエージェント、テストの書き方は、このファイルを読む。」を残す。この文の指すファイルは、書き方の節を残した `docs/conventions.md` である。
