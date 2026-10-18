# 53 サブエージェントのモデル指定を有効な ID にする

対象は [Issue #53](https://github.com/paterapatera/sdd-cur/issues/53)。作成役とレビュー役の frontmatter、およびスキルがレビュー 3 回目以降に渡す `model` が、`grok-4.7[reasoning_effort=…,fast=false]` 形式のままである。Cursor はこの形式を拒否し、親モデルへフォールバックする。要求・設計の作成、レビュー、修正の割当は設計 30 のままである。指定文字列だけを Cursor が受け付ける ID に直す。実装作成だけは、人が決めた条件により composer-2.5 である。

## 現状

要求作成、設計作成、実装作成、三つのレビュー役の `agents/*.md` の frontmatter の `model` は、いずれも `grok-4.7[reasoning_effort=high,fast=false]` または `grok-4.7[reasoning_effort=medium,fast=false]` である。実装作成は、設計 30 の表では grok high になっているが、運用上は composer-2.5 である。

| 役割 | ファイル | いまの frontmatter（無効な形式） |
|---|---|---|
| 要求作成 | `sdd-cur-req-author.md` | `grok-4.7[reasoning_effort=high,fast=false]` |
| 要求のレビューと修正指示 | `sdd-cur-req-reviewer.md` | `grok-4.7[reasoning_effort=medium,fast=false]` |
| 設計作成 | `sdd-cur-design-author.md` | `grok-4.7[reasoning_effort=high,fast=false]` |
| 設計のレビューと修正指示 | `sdd-cur-design-reviewer.md` | `grok-4.7[reasoning_effort=medium,fast=false]` |
| 実装作成 | `sdd-cur-implement-author.md` | `grok-4.7[reasoning_effort=high,fast=false]` |
| 実装のレビューと修正指示 | `sdd-cur-implement-reviewer.md` | `grok-4.7[reasoning_effort=medium,fast=false]` |

`skills/sdd-cur/SKILL.md` の要件・設計の手順と、`skills/sdd-cur-implement/SKILL.md` のレビュー手順は、レビュー 1 回目と 2 回目が続けて不合格のとき、3 回目から `model` に `grok-4.7[reasoning_effort=high,fast=false]` を渡すと書いている。

`src/agents.test.ts`、`src/sdd.test.ts`、`src/runner.test.ts` は、上記の旧形式を期待している。

修正役三つの `model` は `composer-2.5[fast=false]` であり、Cursor が受け付ける。形式は変えない。

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

## 決定

人が決めた条件として、実装作成のモデルは composer-2.5 である。要求・設計の作成は grok-4.7-high、レビューの開始は grok-4.7-medium、3 回目からのレビューは grok-4.7-high、修正は composer-2.5 である。

frontmatter とスキルが書く機械向けの ID は、括弧付きの `grok-4.7[…]` ではなく、受け入れ条件の表どおりである。実装作成は `composer-2.5[fast=false]` である。

作成と修正の起動では、引き続き `model` を渡さない。frontmatter の `model` を使う。レビューの 1 回目と 2 回目も `model` を渡さない。3 回目から親が `model` に `grok-4.7-high` を渡す。

## 範囲外

次は、この要件に含めない。

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
