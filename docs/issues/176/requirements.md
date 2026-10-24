# 176 agents/ のサブエージェント model を ~/.cursor/agents の最適化に合わせる

<!-- sdd-cur:form -->

対象は Issue #176。`install` で `agents/` の十一個のサブエージェントが `~/.cursor/agents` または `<project>/.cursor/agents` にコピーされる（`docs/policy.md` の 23 行）。利用者の `~/.cursor/agents` では、役割ごとに frontmatter の `model` を見直した。リポジトリの `agents/` を、次の六ファイルの `model` 行だけ同じ値に揃える。本文、`name`、`description`、レビュー役の `readonly` は変えない。

重なる課題は #161（`install` の model フラグ）と #162（ランナーの `models.json`）である。#161 と #162 は本課題の範囲外である。

## 現状

要求作成 `agents/sdd-cur-req-author.md` の frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である（`agents/sdd-cur-req-author.md` の 3 行）。

要求レビュー中級 `agents/sdd-cur-req-reviewer.md` の frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である（`agents/sdd-cur-req-reviewer.md` の 3 行）。

要求レビュー上級 `agents/sdd-cur-req-reviewer-high.md` の frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である（`agents/sdd-cur-req-reviewer-high.md` の 3 行）。

設計作成 `agents/sdd-cur-design-author.md` の frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である（`agents/sdd-cur-design-author.md` の 3 行）。

設計レビュー `agents/sdd-cur-design-reviewer.md` の frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である（`agents/sdd-cur-design-reviewer.md` の 3 行）。

実装レビュー `agents/sdd-cur-implement-reviewer.md` の frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である（`agents/sdd-cur-implement-reviewer.md` の 3 行）。

`src/conventions.ts` の `reviewModelFromRound3` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である（`src/conventions.ts` の 337 行）。`review-next` は 3 回目以降、この定数を `model` に返す（`src/conventions.ts` の 383 行）。

正本は、要求レビュー上級の frontmatter の `model` が `reviewModelFromRound3` と一文字も違わない、と定める（`docs/canonical/sdd.md` の 2041 行）。正本は、要求作成と設計作成の frontmatter の `model` と、要求・設計のレビュー 3 回目以降に親が渡す `model` の文字列が、同じ `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である、と定める（`docs/canonical/sdd.md` の 1333 行、1375 行、1501 行ほか）。

`skills/sdd-cur/SKILL.md` の「要件」で、初回の成果物作成を説明する括弧内のモデル表記は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である（`skills/sdd-cur/SKILL.md` の 171 行）。

`src/agents-files.test.ts` は、要求作成と設計作成の `model` を `grok-4.7[context=256k,reasoning_effort=high,fast=false]`、要求・設計・実装のレビュー（中級相当）を `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` と期待する（`src/agents-files.test.ts` の 17 行、48 行、105 行、137 行、205 行）。

`src/sdd-skill-sdd-cur.test.ts` は、`skills/sdd-cur/SKILL.md` の作成説明の括弧内を `grok-4.7[context=256k,reasoning_effort=high,fast=false]` として確かめる（`src/sdd-skill-sdd-cur.test.ts` の 89 行）。

`src/116.test.ts` は、上級要求レビュー役の `model` が `reviewModelFromRound3` と一致することを確かめる（`src/116.test.ts` の 266 行）。

`src/91.test.ts` は、`review-next` の 3 回目以降の `model` が `reviewModelFromRound3` であることを複数箇所で確かめる（`src/91.test.ts` の 451 行ほか）。

## 受け入れ条件

- 1. 条件: `agents/sdd-cur-req-author.md` の frontmatter の `model` 行を見る 主体: そのファイル 結果: `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である
- 2. 条件: `agents/sdd-cur-req-reviewer.md` の frontmatter の `model` 行を見る 主体: そのファイル 結果: `composer-2.5[fast=false]` である
- 3. 条件: `agents/sdd-cur-req-reviewer-high.md` の frontmatter の `model` 行を見る 主体: そのファイル 結果: `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である
- 4. 条件: `agents/sdd-cur-design-author.md` の frontmatter の `model` 行を見る 主体: そのファイル 結果: `composer-2.5[fast=false]` である
- 5. 条件: `agents/sdd-cur-design-reviewer.md` の frontmatter の `model` 行を見る 主体: そのファイル 結果: `composer-2.5[fast=false]` である
- 6. 条件: `agents/sdd-cur-implement-reviewer.md` の frontmatter の `model` 行を見る 主体: そのファイル 結果: `composer-2.5[fast=false]` である
- 7. 条件: 受け入れ条件 1 から 6 の六ファイルの本文を、実装前のリポジトリと比べる 主体: その六ファイル 結果: frontmatter の `model` 行以外は一文字も変わっていない
- 8. 条件: `src/conventions.ts` の `reviewModelFromRound3` を見る 主体: その定数 結果: `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である
- 9. 条件: 受け入れ条件 8 の文字列と `agents/sdd-cur-req-reviewer-high.md` の frontmatter の `model` を比べる 主体: 実装 結果: 一文字も違わない
- 10. 条件: `skills/sdd-cur/SKILL.md` の「要件」で、要求作成の初回成果物作成だけを説明する括弧内のモデル表記を見る（設計作成と同一括弧で書かない） 主体: その括弧内 結果: `agents/sdd-cur-req-author.md` の frontmatter の `model` と一文字も違わない
- 11. 条件: `skills/sdd-cur/SKILL.md` の「設計」で、設計作成役の初回成果物作成を説明する括弧内のモデル表記を見る（要求作成と同一括弧で書かない） 主体: その括弧内 結果: `agents/sdd-cur-design-author.md` の frontmatter の `model` と一文字も違わない
- 12. 条件: 受け入れ条件 10 のあと、同ファイルの「要件」で要求作成の初回作成を説明する人向け表記を見る 主体: その表記 結果: high だけを作成モデル名として書かない。要求作成のモデルは medium の Grok であると読める
- 13. 条件: 受け入れ条件 11 のあと、同ファイルの「設計」で設計作成の初回作成を説明する人向け表記を見る 主体: その表記 結果: 設計作成のモデルは Composer であると読める
- 14. 条件: 設計の `## 正本への差分` をマージしたあと `docs/canonical/sdd.md` を見る 主体: 正本 結果: 要求作成・設計作成・各レビュー役の frontmatter の `model`、3 回目以降の `review-next` の `model`、`reviewModelFromRound3` の関係、人の言葉でのモデル名が、受け入れ条件 1 から 13 と矛盾しない
- 15. 条件: 設計の `## 正本への差分` をマージしたあと `docs/canonical/sdd.md` を見る 主体: 正本 結果: 要求作成の frontmatter と設計作成の frontmatter が、同じ `model` 文字列を共有する、と書かない（Composer と Grok medium は別である）
- 16. 条件: 設計の `## 正本への差分` をマージしたあと `docs/canonical/sdd.md` を見る 主体: 正本 結果: 3 回目以降に親が渡す `model` の文字列は、要求作成または設計作成の frontmatter の `model` と同一、とは書かない。3 回目以降の文字列は `reviewModelFromRound3` であり、要求レビュー上級の frontmatter の `model` と一致する、と書く
- 17. 条件: `bun test` を実行する 主体: テスト 結果: 終了コードは 0 である
- 18. 条件: `src/agents-files.test.ts` の `expected` に含まれる五役（要求作成・要求レビュー中級・設計作成・設計レビュー・実装レビュー）の `model` 期待値を見る 主体: そのテスト 結果: 受け入れ条件 1、2、4、5、6 と一致する
- 19. 条件: `src/sdd-skill-sdd-cur.test.ts` の作成説明括弧内の期待値を見る 主体: そのテスト 結果: 受け入れ条件 10 と 11 と一致する
- 20. 条件: `review-next` の 3 回目以降の `model` を確かめるテストを見る 主体: `src/91.test.ts` ほか 結果: 受け入れ条件 8 の文字列を期待する
- 21. 条件: 上級要求レビュー役の `model` と `reviewModelFromRound3` を確かめるテストを見る 主体: `src/116.test.ts` 結果: 受け入れ条件 3 と 8 を期待する
- 22. 条件: 利用者の `~/.cursor/agents` に同じ六ファイルがある 主体: 実装者 結果: リポジトリの `agents/<名前>.md` と `~/.cursor/agents/<名前>.md` を比べ、diff が無い。無いファイルは、frontmatter の `model` 行が受け入れ条件 1 から 6 と一致することで足りる

## 範囲外

次は、この要件に含めない。

- 六ファイルのサブエージェント本文の手順の変更
- `review-next` の JSON 構造、分岐、`consecutiveFailures` の数え方の変更
- 実装作成 `agents/sdd-cur-implement-author.md`、三つの修正役、探索役の frontmatter の `model` の変更
- `src/agent.ts` の `AGENT_MODEL`（#162）
- `install` がコピー先へ付ける model フラグの変更（#161）
- ランナーの `models.json`（#162）
- 課題の作成とクローズ、ラベルの変更、受け入れ手順、完了処理

## 関係する課題

- #161（`install` の model フラグ。本課題では触らない）
- #162（ランナーの `models.json` と `AGENT_MODEL`。本課題では触らない）
- #53（サブエージェントの `model` と `review-next` の 3 回目以降を正本に定めた課題。本課題はそのモデル割当を更新する）
- #116（要求レビュー中級と上級の二ファイル。上級の `model` は本課題で medium Grok に変わるが、役の分岐構造は変えない）
