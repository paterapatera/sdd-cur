# 55 3 回目以降のレビューに渡す model を frontmatter と同じ書式にする。。

対象は [Issue #55](https://github.com/paterapatera/sdd-cur/issues/55)。要求作成と設計作成の `agents/*.md` の frontmatter の `model` は、コミット `8a949c3` で `grok-4.7[context=256k,reasoning_effort=high,fast=false]` に揃えた。スキルがレビュー 3 回目以降に親が渡す `model` の記述と、要求作成の説明に残る機械向けの表記は `grok-4.7-high` のままである。レビューの段数、回数、モデルの割当は設計 30 のままである。直すのは、3 回目以降に渡す文字列と作成役の説明、およびそれを固定するテストの必須文言だけである。

## 現状

要求作成 `agents/sdd-cur-req-author.md` と設計作成 `agents/sdd-cur-design-author.md` の frontmatter の `model` は、いずれも `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。

`skills/sdd-cur/SKILL.md` の「要件」は、1 回目と 2 回目が続けて不合格のとき、3 回目から `model` に `grok-4.7-high` を渡すと書いている。同じファイルの「要件」は、初回の成果物作成を `grok-4.7-high` と説明している。「設計」は、回数とモデルを要件の手順と同じとする文であり、3 回目以降に渡す文字列は要件の手順に従う。

`skills/sdd-cur-implement/SKILL.md` の「レビュー」は、1 回目と 2 回目が続けて不合格のとき、3 回目から `model` に `grok-4.7-high` を渡すと書いている。

`src/sdd.test.ts` は、`skills/sdd-cur/SKILL.md` の必須文言のうち、3 回目から渡すモデルに関する部分を `grok-4.7-high` とみなしている。

`src/runner.test.ts` は、`skills/sdd-cur-implement/SKILL.md` の必須文言のうち、3 回目から渡すモデルに関する部分を `grok-4.7-high` とみなしている。

## 受け入れ条件

- 要求・設計の作成、レビューの開始、修正の割当、数え方、連続不合格 2 回のあと 3 回目から high に上げる条件は、設計 30 のとおりである。変更しない。
- 機械向けに親がレビュー 3 回目以降に渡す `model` の文字列は、要求作成と設計作成の frontmatter の `model` と一文字も違わない。値は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。
- `skills/sdd-cur/SKILL.md` の「要件」で、3 回目から渡す `model` の記述は、上の文字列である。1 回目と 2 回目は `model` を渡さない、合格まで渡す、medium には戻さない、など設計 30 の手順は変えない。
- `skills/sdd-cur/SKILL.md` の「要件」で、要求作成役の初回成果物作成を説明する括弧内のモデル表記は、要求作成 `agents/sdd-cur-req-author.md` の frontmatter の `model` と一文字も違わない。値は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。
- `skills/sdd-cur/SKILL.md` の「設計」は、回数とモデルを要件の手順と同じとする文のままである。3 回目から渡す `model` は、要件の手順に書いた文字列である。
- `skills/sdd-cur-implement/SKILL.md` の「レビュー」で、3 回目から渡す `model` の記述は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。実装作成は `model` を渡さず、frontmatter の `composer-2.5[fast=false]` を使う。10 回打ち切りや `model` を渡さない回の扱いは設計 30 のとおりである。
- `src/sdd.test.ts` は、`skills/sdd-cur/SKILL.md` の必須文言のうち、3 回目から渡すモデルと作成説明の括弧内に関する部分を `grok-4.7[context=256k,reasoning_effort=high,fast=false]` に合わせる。設計 26・27 の分と、設計 30 で残すその他の必須文言は維持する。`grok-4.7-high` を、3 回目から渡すモデルまたは作成説明の括弧内の必須文言として要求しない。
- `src/runner.test.ts` は、`skills/sdd-cur-implement/SKILL.md` の必須文言のうち、3 回目から渡すモデルに関する部分を `grok-4.7[context=256k,reasoning_effort=high,fast=false]` に合わせる。設計 6・22 で残すその他の必須文言は維持する。`grok-4.7-high` を、3 回目から渡すモデルの必須文言として要求しない。
- `bun test` が通る。`gh` は起動しない。ホームディレクトリと、実行中の Cursor のスキルおよびサブエージェントは触らない。

## 範囲外

次は、この要件に含めない。

- 設計 30 の実行順、段数、数えるレビュー、連続不合格の数え方の変更
- 各サブエージェントの `agents/*.md` の変更（本課題の対象ファイルに含めない。frontmatter は既に括弧書式である）
- `skills/sdd-cur-quick/SKILL.md` の変更
- `src/agents.test.ts` の変更
- `src/runner.ts`、`src/agent.ts`、`src/run.ts`、`src/cli.ts`、`src/sdd.ts`、`src/install.ts` の変更
- `docs/specs/53/requirements.md` と `docs/specs/53/design.md` の書き換え
- 設計 30 や、本課題以外の `docs/specs/*/design.md` と `requirements.md` の書き換え
- `docs/plan.md`、`docs/conventions.md` の変更
- 課題の作成とクローズ
- ラベルの変更
- 受け入れ手順
- 完了処理
- 依存パッケージ、`package.json` の変更
- Forgejo、Jira、Backlog
