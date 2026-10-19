# 83 ドキュメントとスキルのずれを直し、ずれをテストで見つける

対象は [Issue #83](https://github.com/paterapatera/sdd-cur/issues/83)。README が `install` のコピー対象として書くスキル、`AGENTS.md` と README のサブコマンドの一覧、`AGENTS.md` の課題作成の文、`skills/sdd-cur-quick/SKILL.md` が上げたあとに渡すと書くモデル名を、今の実装に揃える。同じ種類のずれは `bun test` が失敗する。

重なる課題は #72 と #75 である。`docs/specs/72/design.md` と `docs/specs/75/design.md` は書き換えない。

## 受け入れ条件

- README が `install` のコピー対象のスキルとして書く範囲は、`skills/` 直下のディレクトリの全体と一致する。ディレクトリの図に書くスキルも、その全体と一致する。
- `skills/` 直下のディレクトリと、README のスキルの記述がずれたとき、`bun test` が失敗する。
- `AGENTS.md` の構成の表にあるサブコマンドの列挙、`AGENTS.md` の「コマンド」にある `bun src/cli.ts` の例、README の「開発中の起動」にある `bun src/cli.ts` の例、README のそのあとのコマンドの表は、それぞれ `src/cli.ts` のサブコマンドをすべて含む。`branch` を含む。README のこの例と表は `close` も含む。
- これらの一覧に並ぶ `src/cli.ts` のサブコマンド名と、`src/cli.ts` のサブコマンドがずれたとき、`bun test` が失敗する。`bun test` は、このサブコマンド名に数えない。
- `AGENTS.md` は、人が明示して起動したときに `skills/sdd-cur-create-issue` が課題を作ることを書く。
- `AGENTS.md` は、課題ランナーが課題を作らないことを書く。
- `AGENTS.md` に、SDD スキルも課題ランナーも課題を作らない、という記述は無い。
- `skills/sdd-cur-quick/SKILL.md` が上げたあとに渡すと書くモデル名は、`grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。ほかのスキルが書く上げたあとのモデル名と、要求作成および設計作成のサブエージェントの frontmatter の `model` と、一文字も違わない。
- スキルとサブエージェントが、同じモデルを別の表記で書いたとき、`bun test` が失敗する。上げたあとのモデルでは、`grok-4.7-high` と `grok-4.7[context=256k,reasoning_effort=high,fast=false]` が別の表記である。

## 範囲外

次は、この要件に含めない。

- スキルの手順そのものを短くすること（#91）
- 方針の置き場所をまとめること（#84）
- `src/cli.ts` と `src/install.ts` の変更。サブコマンドの追加と削除。`printUsage` の変更
- `src/package.test.ts` の変更。使い方の期待文字列は、`close` の行が無く、`printUsage` と一致しない。この差は、この課題の受け入れ条件に無い
- `agents/*.md` の変更。frontmatter の `model` は、いまの値のままである
- `skills/sdd-cur-quick/SKILL.md` のうち、上げたあとに渡すモデル名以外の変更
- ほかの `skills/*/SKILL.md` の変更
- README の「役割」と「公開後の起動」
- 要件ファイルの変更。`docs/specs/72/design.md` と `docs/specs/75/design.md` の書き換え
- 課題の作成とクローズ。ラベルの変更。確認コメント。受け入れ手順。完了処理
- 依存パッケージ。`package.json` の変更

## 決定

| 項目 | 内容 |
|---|---|
| サブコマンドの正 | `src/cli.ts` の `main` にある `switch (sub)` の `case "..."` である。`default` は含めない。順は `install`、`run`、`labels`、`candidates`、`show`、`branch`、`confirm`、`close`、`reflect`、`complete` |
| 文書に書く順 | 上の switch の順。テストが見るのは名前の集合であり、並びの一致は見ない |
| `bun test` | 開発用のコマンドとして、いま書いてある例と README の表に残す。サブコマンド名には数えない |
| スキルの正 | `skills/` 直下のディレクトリである。ファイルは含めない。`installSkills` がディレクトリだけをコピーする規則と同じである |
| いまのディレクトリ | `sdd-cur`、`sdd-cur-complete`、`sdd-cur-create-issue`、`sdd-cur-fix`、`sdd-cur-implement`、`sdd-cur-quick`。名前の昇順は、`skillNames.sort()` の既定の並びである |
| 上げたあとのモデル | `grok-4.7[context=256k,reasoning_effort=high,fast=false]`。`grok-4.7-high` は、このモデルの別の表記であり、スキルとサブエージェントには書かない |
| 課題を作る主体 | 人が明示して起動したとき、`skills/sdd-cur-create-issue` が課題を作る。課題ランナーは課題を作らない |
| 変えるファイル | README、`AGENTS.md`、`skills/sdd-cur-quick/SKILL.md`、`src/runner.test.ts` の quick の必須文言一箇所、新規の `src/docs.test.ts` |
| テスト | `src/docs.test.ts`。`bun:test` の `describe` と `test`。`gh` は起動しない。ホームディレクトリは使わない。読むだけで、一時ディレクトリは作らない |

## README

### 開発中の起動

「開発中の起動」のコードフェンスを、次にする。既存の行の引数の形は残す。足すのは `branch` と `close` の二行である。`bun test` は最後に残す。

```sh
bun src/cli.ts install [project-root]
bun src/cli.ts run [--interval-min <1 以上 1440 以下の整数>]
bun src/cli.ts labels
bun src/cli.ts candidates
bun src/cli.ts show <番号>
bun src/cli.ts branch <番号>
bun src/cli.ts confirm <番号>
bun src/cli.ts close <番号>
bun src/cli.ts reflect <番号> <requirements|design>
bun src/cli.ts complete <番号>
bun test
```

そのあとの表には、次の二行を、switch の順の位置へ足す。`show` の次が `branch`、`confirm` の次が `close` である。`bun test` の行は残す。ほかの行の文言は変えない。

| コマンド | すること |
|---|---|
| `branch` | 作業ブランチ名 `task-<番号>` を一行出力する |
| `close` | 標準入力の本文を課題にコメントし、課題を閉じる |

`branch` は `implementationBranch` の戻り値を標準出力へ書く。`close` は、標準入力の本文を課題コメントにしたあと、課題を閉じる。

### コピーするスキル

`` `install` がコピーするスキルは `` で始まる文を、次の一文にする。

`install` がコピーするスキルは `skills/sdd-cur`、`skills/sdd-cur-complete`、`skills/sdd-cur-create-issue`、`skills/sdd-cur-fix`、`skills/sdd-cur-implement`、`skills/sdd-cur-quick` である。

「ディレクトリ」の図では、いまの三つの `skills/` 行を、次の六行に置き換える。各行は、`install` がコピーするスキルである。

```
skills/sdd-cur/               install がコピーする SDD スキル
skills/sdd-cur-complete/      install がコピーする完了スキル
skills/sdd-cur-create-issue/  install がコピーする課題作成スキル
skills/sdd-cur-fix/           install がコピーする修正スキル
skills/sdd-cur-implement/     install がコピーする実装スキル
skills/sdd-cur-quick/         install がコピーする quick のスキル
```

図のほかの行は残す。

## AGENTS.md

「着手前に読むもの」の、課題を作る主体を述べる段落の最初の二文を、次の二文に置き換える。うしろの、課題を閉じる三文は残す。

人が明示して起動したときに、`skills/sdd-cur-create-issue` が課題を作る。課題ランナーは課題を作らない。

置き換えたあとの段落は、次である。

人が明示して起動したときに、`skills/sdd-cur-create-issue` が課題を作る。課題ランナーは課題を作らない。人が閉じるを選んだときに SDD スキルが閉じる場合を除き、課題は閉じない。課題ランナーは課題を閉じない。お客さまの確認が取れてから、人が閉じる。

`SDD スキルも課題ランナーも、課題を作らない` は、このファイルに残さない。

構成の表の `src/cli.ts` の行は、次のセルにする。役割の列だけを変え、場所の列は `` `src/cli.ts` `` のままである。

入口。サブコマンドは `install`、`run`、`labels`、`candidates`、`show`、`branch`、`confirm`、`close`、`reflect`、`complete`

「コマンド」のコードフェンスには、`bun src/cli.ts show <番号>` の次へ、次の一行を足す。`close` の行と `bun test` の行は残す。ほかの行は変えない。

```sh
bun src/cli.ts branch <番号>
```

## モデル名

`skills/sdd-cur-quick/SKILL.md` の、上げたあとに渡すモデル名だけを置き換える。いまの部分は `3 回目から model に `grok-4.7-high` を渡す` である。置き換え後は `3 回目から model に `grok-4.7[context=256k,reasoning_effort=high,fast=false]` を渡す` である。

前後の「1 回目と 2 回目は model を渡さない」「合格まで渡す」「medium には戻さない」は残す。手順は変えない。

`skills/sdd-cur/SKILL.md` と `skills/sdd-cur-implement/SKILL.md` が、3 回目から `model` に渡すと書く文字列は、すでにこの表記である。要求作成 `agents/sdd-cur-req-author.md` と設計作成 `agents/sdd-cur-design-author.md` の frontmatter の `model` も、すでにこの表記である。これらのファイルは変えない。

`src/runner.test.ts` の `skills/sdd-cur-quick/SKILL.md` の必須文言のうち、`grok-4.7-high` を `grok-4.7[context=256k,reasoning_effort=high,fast=false]` に置き換える。この項目以外の必須文言は残す。

## テスト

`src/docs.test.ts` に置く。リポジトリのファイルを読む。`gh` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。

サブコマンドは、`src/cli.ts` の `main` の `switch (sub)` にある `case "..."` の文字列である。`default` は含めない。期待の名前をテストの配列へ写さない。

次の四つの集合は、それぞれそのサブコマンドの集合と一致する。過不足があるとき、テストは失敗する。`bun test` は、比較の前に除く。

- `AGENTS.md` の構成の表で、1 列目が `` `src/cli.ts` `` の行。その役割のセルにある、バッククォートで囲まれた名前
- `AGENTS.md` の「コマンド」にある最初のコードフェンス。行を空白で分け、先頭が `bun`、次が `src/cli.ts` である行の、その次のトークン。`bun test` だけの行は除く
- README の「開発中の起動」にある最初のコードフェンス。取り方は、上のコードフェンスと同じである
- README の、そのコードフェンスのあとに来る最初の表。1 列目のバッククォートの中身。中身が `bun test` である行は除く

スキルの名前は、`skills/` を `readdir` し、直下のディレクトリだけを取る。次の二つの集合は、それぞれその名前の集合と一致する。過不足があるとき、テストは失敗する。

- README の、`` `install` がコピーするスキルは `` で始まる文。バッククォートの中身が `skills/` で始まるものについて、`skills/` のうしろから、末尾の `/` を除いた残り
- README の「ディレクトリ」のコードフェンス。行頭の空白を除いて `skills/` で始まり、そのあとに名前と `/` がある行。名前は、`skills/` と次の `/` のあいだである

上げたあとに渡すモデル名は、各 `skills/*/SKILL.md` にある `model に ` と ` を渡す` のあいだの、バッククォートで囲まれた文字列である。この文字列と、`agents/sdd-cur-req-author.md` の frontmatter の `model` と、`agents/sdd-cur-design-author.md` の frontmatter の `model` は、すべて `grok-4.7[context=256k,reasoning_effort=high,fast=false]` と一文字も違わない。一つでも違うとき、テストは失敗する。`model に `...` を渡す` が無いスキルは、この比較に名前を出さない。

`skills/*/SKILL.md` と `agents/*.md` のいずれかに、文字列 `grok-4.7-high` があるとき、テストは失敗する。`docs/specs/` は見ない。人向けの「high」という語だけでは失敗しない。

`AGENTS.md` は、次の二文を含む。`SDD スキルも課題ランナーも、課題を作らない` は含まない。

- 人が明示して起動したときに、`skills/sdd-cur-create-issue` が課題を作る。
- 課題ランナーは課題を作らない。

## 実装の順序

1. README の「開発中の起動」、そのあとの表、コピーするスキルの文、ディレクトリの図を、上のとおりにする。
2. `AGENTS.md` の課題作成の段落、構成の表、`branch` の例を、上のとおりにする。
3. `skills/sdd-cur-quick/SKILL.md` の上げたあとのモデル名と、`src/runner.test.ts` の対応する必須文言を、同じ表記にする。
4. `src/docs.test.ts` を書き、このファイルのテストを確認する。
5. `src/cli.ts`、`src/install.ts`、`src/package.test.ts`、`agents/`、quick 以外のスキルは変えない。
