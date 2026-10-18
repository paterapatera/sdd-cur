# 53 サブエージェントのモデル指定を有効な ID にする

対象は [Issue #53](https://github.com/paterapatera/sdd-cur/issues/53)。作成役とレビュー役の frontmatter の `model`、およびスキルがレビュー 3 回目以降に渡す `model` を、Cursor が受け付ける ID にする。実行順、段数、数えるレビュー、連続不合格の数え方は設計 30 のままである。実装作成のモデルだけは、人が決めた条件により composer-2.5 である。

## 受け入れ条件

- 要求・設計の作成は grok-4.7-high である。実装の作成は composer-2.5 である。レビューは grok-4.7-medium で始める。数えたレビューの不合格が 2 回続いたあと 3 回目から grok-4.7-high である。合格まで high のままである。medium には戻さない。修正は composer-2.5 である。
- 実行順、段数、数えるレビュー、連続不合格の数え方は、設計 30 のとおりである。
- 次のモデル ID は Cursor が有効とみなす指定である。
  - `grok-4.7-high`
  - `grok-4.7-medium`
  - `composer-2.5[fast=false]`
- 次は使わない。
  - `grok-4.7[` で始まる形式（`reasoning_effort` や `fast` の括弧指定を含むもの）すべて
  - `grok-4.7-high[fast=false]` および、high や medium に括弧付きオプションを足した形式
- 次の九つのサブエージェントの frontmatter の `model` は、次の表と一文字も違わない。`name` と `description`、レビュー役の `readonly`、本文は変えない。

| 役割 | ファイル | frontmatter の model |
|---|---|---|
| 要求作成 | `sdd-cur-req-author.md` | `grok-4.7-high` |
| 要求のレビューと修正指示 | `sdd-cur-req-reviewer.md` | `grok-4.7-medium` |
| 設計作成 | `sdd-cur-design-author.md` | `grok-4.7-high` |
| 設計のレビューと修正指示 | `sdd-cur-design-reviewer.md` | `grok-4.7-medium` |
| 実装作成 | `sdd-cur-implement-author.md` | `composer-2.5[fast=false]` |
| 実装のレビューと修正指示 | `sdd-cur-implement-reviewer.md` | `grok-4.7-medium` |
| 要求の修正 | `sdd-cur-req-fixer.md` | `composer-2.5[fast=false]` |
| 設計の修正 | `sdd-cur-design-fixer.md` | `composer-2.5[fast=false]` |
| 実装の修正 | `sdd-cur-implement-fixer.md` | `composer-2.5[fast=false]` |

- 要求作成と設計作成の frontmatter の `model` と、要求・設計のレビュー 3 回目以降に親が渡す `model` の文字列は、同じ `grok-4.7-high` である。実装作成の frontmatter は `composer-2.5[fast=false]` である。実装のレビュー 3 回目以降に親が渡す `model` は `grok-4.7-high` である。
- `skills/sdd-cur/SKILL.md` の要件と設計の手順で、3 回目から渡す `model` の記述は `grok-4.7-high` である。1 回目と 2 回目は `model` を渡さない、合格まで渡す、medium には戻さない、など設計 30 の手順は変えない。
- `skills/sdd-cur-implement/SKILL.md` のレビュー手順で、3 回目から渡す `model` の記述は `grok-4.7-high` である。実装作成は `model` を渡さず、frontmatter の `composer-2.5[fast=false]` を使う。10 回打ち切りや `model` を渡さない回の扱いは設計 30 のとおりである。
- `src/agents.test.ts` は、九つの `model` 期待値が上の表と一致することを確かめる。本文の必須文言の確認は、設計 30 以降のまま維持する。
- `src/sdd.test.ts` は、`skills/sdd-cur/SKILL.md` の必須文言のうち、3 回目から渡すモデルに関する部分を `grok-4.7-high` に合わせる。設計 26・27 の分と、設計 30 で残すその他の必須文言は維持する。旧形式 `grok-4.7[reasoning_effort=high,fast=false]` を必須にしない。
- `src/runner.test.ts` は、`skills/sdd-cur-implement/SKILL.md` の必須文言のうち、3 回目から渡すモデルに関する部分を `grok-4.7-high` に合わせる。設計 6・22 で残すその他の必須文言は維持する。旧形式を必須にしない。
- `bun test` が通る。`gh` は起動しない。ホームディレクトリと、実行中の Cursor のスキルおよびサブエージェントは触らない。

## 範囲外

次は作らない。

- 設計 30 の実行順、段数、数えるレビュー、連続不合格の数え方の変更
- 各サブエージェントのプロンプト本文の変更
- `src/runner.ts`、`src/agent.ts`、`src/run.ts`、`src/cli.ts`、`src/sdd.ts`、`src/install.ts` の変更（`subagentFileNames` の一覧や install の挙動は変えない）
- 設計 30 や、本課題以外の `docs/specs/*/design.md` と `requirements.md` の書き換え
- `docs/plan.md`、`docs/conventions.md` の変更
- 課題の作成とクローズ
- ラベルの変更
- 受け入れ手順
- 完了処理
- 依存パッケージ、`package.json` の変更
- Forgejo、Jira、Backlog

## 決定

| 項目 | 内容 |
|---|---|
| 実行順 | 設計 30 のとおり。レビューに入る前の初回の成果物作成を 1 回、続けてレビューと修正指示を 1 回の起動、合格なら終了、不合格なら修正のあと再びレビューと修正指示。合格のときは修正を起動しない |
| 段数 | 設計 30 のとおり。流れごとに作成、レビューと修正指示、修正の三つ。修正案作成役は起動しない |
| 数えるレビュー | 設計 30 のとおり。作成のあと、および修正のあとに行うレビューと修正指示が 1 回である。作成と修正は数えない。人の確認のあとの再起動は数えない |
| 連続不合格 | 設計 30 のとおり。数えるレビューの最後の非空行が `判定: 不合格` のときに 1 増える。合格で流れは終わる。確認のための再起動では増えない |
| 作成と修正の起動 | `model` を渡さない。frontmatter の `model` を使う |
| レビューの 1 回目と 2 回目 | `model` を渡さない。frontmatter の `model` は `grok-4.7-medium` である |
| レビューの 3 回目以降 | 1 回目と 2 回目が続けて不合格のとき、親が `model` に `grok-4.7-high` を渡す。合格まで渡す。medium には戻さない |
| 要求・設計の作成と 3 回目以降 | 要求作成と設計作成の frontmatter と、要求・設計のレビュー 3 回目以降に渡す文字列は、同じ `grok-4.7-high` である |
| 実装の作成と 3 回目以降 | 実装作成の frontmatter は `composer-2.5[fast=false]` である。実装のレビュー 3 回目以降に渡す文字列は `grok-4.7-high` である。この二つは揃えない |
| 修正 | 三つの frontmatter は `composer-2.5[fast=false]` のままである |
| 実装の打ち切り | 設計 30 のとおり。数えた不合格が 10 のとき、修正も次のレビューも起動しない。10 回には medium のレビューと high のレビューの両方が入る |
| 使う ID | `grok-4.7-high`、`grok-4.7-medium`、`composer-2.5[fast=false]` |
| 使わない ID | `grok-4.7[` で始まる形式。`grok-4.7-high[fast=false]`、および high や medium に括弧付きオプションを足した形式 |

人の言葉でのモデル名は、要求・設計の作成が grok-4.7-high、実装の作成が composer-2.5、レビューの開始が grok-4.7-medium、3 回目からのレビューが grok-4.7-high、修正が composer-2.5 である。機械向けの ID は、上の frontmatter の表である。

| 数えた回数 | レビューのモデル | 不合格のとき |
|---|---|---|
| 1 と 2 | medium。`model` は渡さない。frontmatter は `grok-4.7-medium` | 要求と設計は確認の行で分岐する。実装は、9 回までなら差分を修正へ渡す |
| 3 以降 | 親が `model` に `grok-4.7-high` を渡す。合格まで戻さない | 要求と設計は合格まで繰り返す。実装は 9 回まで修正へ渡し、10 回目は打ち切る |

## サブエージェント

変えるのは、次の六つの frontmatter の `model` の値だけである。`name`、`description`、レビュー役の `readonly`、本文は変えない。フロントマターの順は `name`、`description`、`model` のままである。レビュー役は、その次の `readonly: true` を残す。

| ファイル | model |
|---|---|
| `agents/sdd-cur-req-author.md` | `grok-4.7-high` |
| `agents/sdd-cur-req-reviewer.md` | `grok-4.7-medium` |
| `agents/sdd-cur-design-author.md` | `grok-4.7-high` |
| `agents/sdd-cur-design-reviewer.md` | `grok-4.7-medium` |
| `agents/sdd-cur-implement-author.md` | `composer-2.5[fast=false]` |
| `agents/sdd-cur-implement-reviewer.md` | `grok-4.7-medium` |

いまの六つの `model` は、`grok-4.7[reasoning_effort=high,fast=false]` または `grok-4.7[reasoning_effort=medium,fast=false]` である。値だけを上の表に置き換える。

修正役三つの `model` は、すでに `composer-2.5[fast=false]` である。ファイルは変えない。

- `agents/sdd-cur-req-fixer.md`
- `agents/sdd-cur-design-fixer.md`
- `agents/sdd-cur-implement-fixer.md`

## スキルの手順

段、回数、`model` を渡す回と渡さない回は、設計 30 のままである。置き換えるのは、3 回目から渡す `model` の文字列だけである。

### 要件

`skills/sdd-cur/SKILL.md` の「要件」にある次の文字列を、`grok-4.7-high` に置き換える。

`grok-4.7[reasoning_effort=high,fast=false]`

置き換えたあとの該当部分は、`3回目から model に `grok-4.7-high` を渡す` である。前後の「1 回目と 2 回目のレビューは model を渡さない」「合格まで渡す」「medium には戻さない」は残す。作成と修正の「model は渡さない。frontmatter の `model` を使う」は残す。

### 設計

`skills/sdd-cur/SKILL.md` の「設計」は、回数とモデルを要件の手順と同じとする文のままである。3 回目から渡す `model` は、要件の手順に書いた `grok-4.7-high` である。この節へモデル ID の文を足さない。

### 実装

`skills/sdd-cur-implement/SKILL.md` の「レビュー」にある次の文字列を、`grok-4.7-high` に置き換える。

`grok-4.7[reasoning_effort=high,fast=false]`

置き換えたあとの該当部分は、`3回目から model に `grok-4.7-high` を渡す` である。「1 回目と 2 回目のレビューは model を渡さない」「合格まで渡す」「10 回目も、その回が 3 以上なら high を渡してから判定を見る」は残す。

「実装」の、作成と修正に model は渡さない、は残す。実装作成は、この渡さない起動で frontmatter の `composer-2.5[fast=false]` を使う。この ID をスキル本文へ足さない。

フロントマター、`## 実装` の他の文、`## 禁止` は変えない。

## テスト

`bun test` で実行する。一時ディレクトリを使い、終わったら消す。`gh` は起動しない。ホームディレクトリと、実行中の Cursor のスキルおよびサブエージェントは触らない。

`src/agents.test.ts` の九つの `model` 期待値を、受け入れ条件の表と一文字も違わない値にする。変える期待は次の六つである。

- `sdd-cur-req-author.md` は `grok-4.7-high`
- `sdd-cur-req-reviewer.md` は `grok-4.7-medium`
- `sdd-cur-design-author.md` は `grok-4.7-high`
- `sdd-cur-design-reviewer.md` は `grok-4.7-medium`
- `sdd-cur-implement-author.md` は `composer-2.5[fast=false]`
- `sdd-cur-implement-reviewer.md` は `grok-4.7-medium`

三つの修正役の `model` 期待は `composer-2.5[fast=false]` のままである。`bodyIncludes` と、廃止した三つのファイルが無いことの確認は、設計 30 以降のまま残す。設計 36 が要求レビュー役へ足した本文の必須文言も残す。

`src/sdd.test.ts` の `skills/sdd-cur/SKILL.md` の必須文言は、`grok-4.7[reasoning_effort=high,fast=false]` を `grok-4.7-high` に置き換える。この項目以外の必須文言は残す。残すものには、設計 26、設計 27、設計 30、設計 36 の分が入る。旧形式は必須にしない。無いことの確認は足さない。install が `subagentFileNames` の全ファイルをパッケージと見比べる確認は残す。

`src/runner.test.ts` の `skills/sdd-cur-implement/SKILL.md` の必須文言は、`grok-4.7[reasoning_effort=high,fast=false]` を `grok-4.7-high` に置き換える。この項目以外の必須文言は残す。残すものには、設計 6 のフロントマターと、設計 22 および設計 30 の分が入る。旧形式は必須にしない。無いことの確認は足さない。

## 実装の順序

1. 六つのサブエージェントの `model` を、受け入れ条件の表にする。`src/agents.test.ts` の六つの期待を合わせる。
2. `skills/sdd-cur/SKILL.md` の「要件」と、`skills/sdd-cur-implement/SKILL.md` の「レビュー」の、3 回目から渡すモデル文字列を `grok-4.7-high` にする。`src/sdd.test.ts` と `src/runner.test.ts` の必須文言を合わせる。
3. `bun test` が成功することを確かめる。
