# 55 3 回目以降のレビューに渡す model を frontmatter と同じ書式にする。。

対象は [Issue #55](https://github.com/paterapatera/sdd-cur/issues/55)。要求作成と設計作成の `agents/*.md` の frontmatter の `model` は、すでに `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。スキルがレビュー 3 回目以降に親が渡す `model` の記述と、要求作成の説明に残る機械向けの表記は `grok-4.7-high` のままである。レビューの段数、回数、モデルの割当は設計 30 のままである。直すのは、3 回目以降に渡す文字列と作成役の説明の括弧内、およびそれを固定するテストの必須文言だけである。

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
- `docs/issues/53/requirements.md` と `docs/issues/53/design.md` の書き換え
- 設計 30 や、本課題以外の `docs/issues/*/design.md` と `requirements.md` の書き換え
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
| 実行順 | 設計 30 のとおり |
| 段数 | 設計 30 のとおり |
| 数えるレビュー | 設計 30 のとおり |
| 連続不合格 | 設計 30 のとおり |
| 作成と修正の起動 | `model` を渡さない。frontmatter の `model` を使う |
| レビューの 1 回目と 2 回目 | `model` を渡さない。frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である |
| レビューの 3 回目以降 | 1 回目と 2 回目が続けて不合格のとき、親が `model` に `grok-4.7[context=256k,reasoning_effort=high,fast=false]` を渡す。合格まで渡す。medium には戻さない |
| 要求・設計の作成と 3 回目以降 | 要求作成 `agents/sdd-cur-req-author.md` と設計作成 `agents/sdd-cur-design-author.md` の frontmatter の `model` と、要求・設計のレビュー 3 回目以降に渡す文字列は、同じ `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である |
| 要求作成の説明（括弧内） | 「要件」の初回成果物作成を説明する括弧内の機械向け表記も、上と同じ文字列である |
| 実装の作成と 3 回目以降 | 実装作成の frontmatter は `composer-2.5[fast=false]` である。実装のレビュー 3 回目以降に渡す文字列は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。この二つは揃えない |
| 修正 | 三つの修正役の frontmatter は `composer-2.5[fast=false]` のままである |
| 実装の打ち切り | 設計 30 のとおり |
| 人の言葉でのモデル名 | 設計 30 のとおり。スキル本文の「high の作成 1 回」など、人向けの high の言い方は残す |
| 機械向けの high 文字列 | `grok-4.7[context=256k,reasoning_effort=high,fast=false]`。`grok-4.7-high` は、3 回目から渡す `model` や作成説明の括弧内では使わない |

参照する frontmatter の値は、次と一文字も違わない。

| 用途 | ファイル | frontmatter の model |
|---|---|---|
| 要求・設計の作成、3 回目以降のレビューに渡す文字列、要件の括弧内 | `agents/sdd-cur-req-author.md`（設計作成は `agents/sdd-cur-design-author.md` で同値） | `grok-4.7[context=256k,reasoning_effort=high,fast=false]` |

`agents/*.md` は本課題では変えない。表は、スキルとテストが揃えるべき文字列の定義である。

## スキルの手順

段、回数、`model` を渡す回と渡さない回は、設計 30 のままである。置き換えるのは、機械向けの high 文字列だけである。値は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。

### 要件

`skills/sdd-cur/SKILL.md` の「要件」で、次の二箇所の `grok-4.7-high` を、上の文字列に置き換える。

1. レビュー 3 回目以降に渡す記述。いまの部分は `3回目から model に `grok-4.7-high` を渡す` である。置き換え後は `3回目から model に `grok-4.7[context=256k,reasoning_effort=high,fast=false]` を渡す` である。
2. 初回の成果物作成の括弧内。いまの部分は `初回の成果物作成（grok-4.7-high）` である。置き換え後は `初回の成果物作成（grok-4.7[context=256k,reasoning_effort=high,fast=false]）` である。

「1 回目と 2 回目のレビューは model を渡さない」「合格まで渡す」「medium には戻さない」「作成から合格まで 1 回」「high の作成 1 回」など、その前後の文は残す。作成と修正の「model は渡さない。frontmatter の `model` を使う」は残す。

### 設計

`skills/sdd-cur/SKILL.md` の「設計」は、回数とモデルを要件の手順と同じとする文のままである。3 回目から渡す `model` は、要件の手順に書いた `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。この節へモデル ID の文を足さない。

### 実装

`skills/sdd-cur-implement/SKILL.md` の「レビュー」にある次の文字列を、上の high 文字列に置き換える。

`grok-4.7-high`

置き換え対象は、バッククォートで囲んだ `model` に渡す ID だけである。いまの該当部分は `3回目から model に `grok-4.7-high` を渡す` である。置き換え後は `3回目から model に `grok-4.7[context=256k,reasoning_effort=high,fast=false]` を渡す` である。

「1 回目と 2 回目のレビューは model を渡さない」「合格まで渡す」「10 回目も、その回が 3 以上なら high を渡してから判定を見る」は残す。後者の high は人向けの言い方であり、機械向け ID には置き換えない。

「実装」の、作成と修正に model は渡さない、は残す。実装作成は、この渡さない起動で frontmatter の `composer-2.5[fast=false]` を使う。この ID をスキル本文へ足さない。

フロントマター、`## 実装` の他の文、`## 禁止` は変えない。

## テスト

`bun test` で実行する。一時ディレクトリを使い、終わったら消す。`gh` は起動しない。ホームディレクトリと、実行中の Cursor のスキルおよびサブエージェントは触らない。

`src/agents.test.ts` は変えない。

`src/sdd.test.ts` の `skills/sdd-cur/SKILL.md` の必須文言リストで、`grok-4.7-high` を `grok-4.7[context=256k,reasoning_effort=high,fast=false]` に置き換える。この一項目で、3 回目から渡すモデルと作成説明の括弧内の両方をカバーする。それ以外の必須文言は残す。残すものには、設計 26、設計 27、設計 30、設計 36 の分が入る。`grok-4.7-high` を必須にしない。無いことの確認は足さない。install が `subagentFileNames` の全ファイルをパッケージと見比べる確認は残す。

`src/runner.test.ts` の `describe("skills/sdd-cur-implement/SKILL.md")` 内の必須文言リストで、`grok-4.7-high` を `grok-4.7[context=256k,reasoning_effort=high,fast=false]` に置き換える。`describe("skills/sdd-cur-quick/SKILL.md")` の必須文言は変えない。implement のテストで、それ以外の必須文言は残す。残すものには、設計 6 のフロントマターと、設計 22 および設計 30 の分が入る。`grok-4.7-high` を implement の 3 回目モデルの必須文言として要求しない。旧形式や `grok-4.7-high` の無いことの確認は足さない。

## 作業の一覧

1. `skills/sdd-cur/SKILL.md` の「要件」の二箇所と、`skills/sdd-cur-implement/SKILL.md` の「レビュー」の 3 回目モデル文字列を、決定の high 文字列にする。
2. `src/sdd.test.ts` と `src/runner.test.ts` の implement 用必須文言を合わせる。quick 用のテストは触らない。
3. `bun test` が成功することを確かめる。
