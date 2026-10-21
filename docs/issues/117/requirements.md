# 117 仕組みの約束をスキルと一緒に配り、このリポジトリ固有の書き方と分ける

対象は [Issue #117](https://github.com/paterapatera/sdd-cur/issues/117)。`docs/conventions.md` のうち、sdd-cur の仕組みとしての約束を、`install` がコピーするスキルに同梱する。このリポジトリでスキルとテストを書くときだけの書き方は、このリポジトリに残す。

重なる課題は #116、#97、#113 である。方針ファイルの扱いは #118 である。

## 現状

作業の前に `docs/conventions.md` を読む、とスキルに書く（`skills/sdd-cur/SKILL.md` の 12 行）。

`docs/conventions.md` の最初の見出しは `# 約束` である（`docs/conventions.md` の 1 行）。導入は、スキルと課題ランナーが同じ規則を使い、判定の実装は `src/conventions.ts` にある、と書く（`docs/conventions.md` の 3 行）。

「課題ごとのファイル」の見出しは `docs/conventions.md` の 5 行である。「仕様の正本」の見出しは `docs/conventions.md` の 16 行である。「レビューが読む範囲」の見出しは `docs/conventions.md` の 32 行である。「課題コメントの種別」の見出しは `docs/conventions.md` の 42 行である。「反映済みの回答」の見出しは `docs/conventions.md` の 58 行である。「未反映の回答」の見出しは `docs/conventions.md` の 70 行である。「マージリクエストの会話コメント」の見出しは `docs/conventions.md` の 74 行である。「処理済みの不具合」の見出しは `docs/conventions.md` の 89 行である。「レビューの判定」の見出しは `docs/conventions.md` の 105 行である。「マージリクエストの本文」の見出しは `docs/conventions.md` の 125 行である。「着手の課題コメント」の見出しは `docs/conventions.md` の 137 行である。「要件と設計の形式」の見出しは `docs/conventions.md` の 183 行である。

「スキル、サブエージェント、テストの書き方」の見出しは `docs/conventions.md` の 147 行である。この節は、「着手の課題コメント」のあと、「要件と設計の形式」の前にある。作成役、修正役、実装役がこの節に従う、と書く（`docs/conventions.md` の 150 行）。スキルとサブエージェントの本文を一文一行にする、と書く（`docs/conventions.md` の 152 行）。テストを足す場所は `src/<番号>.test.ts` だけである、と書く（`docs/conventions.md` の 175 行）。

`installSkills` は、スキルのソースにあるディレクトリ以外をコピーしない（`src/install.ts` の 104 行）。ディレクトリは、中身ごとコピーする（`src/install.ts` の 110 行）。

`AGENTS.md` の着手前に読むものの 2 番は `docs/conventions.md` である（`AGENTS.md` の 8 行）。

`docs/policy.md` の構成表は、`docs/conventions.md` の役割を、要件・設計の置き場所と課題コメントの約束、およびスキル、サブエージェント、テストの書き方をこのファイルで読むこと、とする（`docs/policy.md` の 32 行）。

スキル本文のテストは、文字列 `docs/conventions.md` を期待する（`src/sdd-skill-sdd-cur.test.ts` の 49 行）。

文書のテストは、`docs/conventions.md` を読んで仕組みの約束の文言を確かめる（`src/conventions.test.ts` の 861 行）。`AGENTS.md` が `docs/conventions.md` を含むことを確かめるテストがある（`src/conventions.test.ts` の 987 行）。

書き方の節のテストは、`docs/conventions.md` にその節があることを確かめる（`src/97.test.ts` の 128 行）。`AGENTS.md` が `docs/conventions.md` へのリンクを含むことを確かめる（`src/97.test.ts` の 137 行）。`docs/policy.md` が、書き方はこのファイルを読む、という文を含むことを確かめる（`src/97.test.ts` の 143 行）。`AGENTS.md` が、書き方の詳細の文を含まないことを確かめる（`src/97.test.ts` の 140 行）。

## 受け入れ条件

- 仕組みの約束として配る節は、「課題ごとのファイル」「仕様の正本」「レビューが読む範囲」「課題コメントの種別」「反映済みの回答」「未反映の回答」「マージリクエストの会話コメント」「処理済みの不具合」「レビューの判定」「マージリクエストの本文」「着手の課題コメント」「要件と設計の形式」である。
- これらの節の文言は変えない。
- 題 `# 約束` は、`skills/sdd-cur/conventions.md` へ移す。
- `docs/conventions.md` の 3 行にある導入は、`skills/sdd-cur/conventions.md` へ移す。
- その導入の文言は変えない。
- 節「スキル、サブエージェント、テストの書き方」は、このリポジトリの `docs/conventions.md` に残す。
- この節の見出しと文言は変えない。
- この節は、`install` がコピーするファイルに含めない。
- 配る本文にも、この節は含めない。
- `docs/conventions.md` に残す節は、この書き方の節だけである。
- 同じファイルに、仕組みの約束へのリンクを置く。
- リンクの行き先は、`skills/sdd-cur/conventions.md` である。
- 仕組みの約束は、`skills/sdd-cur/conventions.md` に置く。
- `install` がスキルのディレクトリをコピーすると、導入先の `sdd-cur/conventions.md` になる。
- ほかのスキルとサブエージェントの本文は、そのファイルを読む、と書く。
- 導入先のプロジェクトに `docs/conventions.md` が無くても、スキルとサブエージェントは仕組みの約束を読める。
- 仕組みの約束の参照先は、導入先の `docs/conventions.md` ではない。
- `skills/sdd-cur/SKILL.md` の、作業の前に `docs/conventions.md` を読む、という参照は、`sdd-cur/conventions.md` を読む参照に変える。
- `AGENTS.md` の着手前に読むものは、`skills/sdd-cur/conventions.md` を読む。
- `AGENTS.md` の着手前に読むものは、`docs/conventions.md` に残した書き方の節を読む。
- 書き方の節の本文は、`AGENTS.md` に書かない。
- `docs/policy.md` の構成表は、仕組みの約束の置き場所を、`skills/sdd-cur/conventions.md` として書く。
- 同じ構成表は、文「スキル、サブエージェント、テストの書き方は、このファイルを読む。」を残す。
- この文の指すファイルは、書き方の節を残した `docs/conventions.md` である。
- スキル本文を文字列で確かめ、`docs/conventions.md` を仕組みの約束の参照として期待しているテストは、`sdd-cur/conventions.md` の参照を期待する。
- 仕組みの約束の文言を `docs/conventions.md` から読んで確かめているテストは、`skills/sdd-cur/conventions.md` の同じ文言を確かめる。
- 書き方の節を `docs/conventions.md` に期待しているテストは、移したあとも `docs/conventions.md` のその節を期待する。
- `AGENTS.md` の参照を文字列で確かめているテストは、着手前に `skills/sdd-cur/conventions.md` を読む参照を期待する。
- `docs/policy.md` に、書き方はこのファイルを読む、と期待しているテストは、その文を期待したままにする。
- `AGENTS.md` に書き方の詳細の文が無いことを期待しているテストは、期待を変えない。
- これらのテストが確かめる、約束の節の文言は変えない。

## 決定

仕組みの約束は、`skills/sdd-cur/conventions.md` に置く。`install` は、スキルのディレクトリごとコピーする。導入先では、`sdd-cur/conventions.md` を読む。ほかのスキルとサブエージェントの本文は、そのファイルを読む、と書く。

`sdd-cur conventions` サブコマンド方式は、採用しない。

## 関係する課題

課題は、次を関係するとする。

- #116（スキルの CLI 呼び出しを `sdd-cur` にする）
- #97（書き方の節を `docs/conventions.md` に置く）
- #113（仕様ディレクトリの名前）
- #118（方針ファイルを導入先に用意する）

#116 は、スキルが CLI を `sdd-cur` で呼ぶようにし、約束と方針のファイルを導入先でどう読むかを、この課題と #118 に残した。この要件は、仕組みの約束の置き場所と参照を変える。#116 が変えた、既存の呼び出しのコマンド名は変えない。

#97 は、書き方の節を `docs/conventions.md` に置き、詳細本文を `AGENTS.md` に書かない、と定める。この要件は、その節をこのリポジトリに残し、`install` ではコピーしない。節の文言は変えない。詳細本文は `AGENTS.md` に書かない。

#113 は、仕様ディレクトリの名前を変えた。この要件は、ディレクトリの名前を変えない。移す節の中のパスの文言は変えない。

#118 は、導入先に方針ファイルのひな形と仕様の置き場所を用意する `init` を足す。この要件は、`init` を足さない。方針のひな形を作らない。`docs/policy.md` では、構成表の、仕組みの約束と書き方の参照だけを変える。

## 範囲外

次は、この要件に含めない。

- 約束の中身を変えること
- `src/conventions.ts` の判定を変えること
- 方針ファイルを導入先に用意すること。`init` を足すこと。方針のひな形を作ること（#118）
- 仕様ディレクトリの名前を変えること（#113）
