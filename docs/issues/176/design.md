# 176 agents/ のサブエージェント model を ~/.cursor/agents の最適化に合わせる

<!-- sdd-cur:form -->

対象は Issue #176。`install` でコピーされる六つのサブエージェントの frontmatter の `model` 行を、利用者の `~/.cursor/agents` で見直した値に揃える。`reviewModelFromRound3`、`skills/sdd-cur/SKILL.md` の作成説明、関連テスト、正本 `docs/canonical/sdd.md` のモデル割当の記述を、揃えた ID と矛盾しないようにする。実行順、段数、数えるレビュー、連続不合格の数え方、`review-next` の JSON 構造は設計 30 のままである。

重なる課題は #53（モデル ID の正本化）、#55（3 回目以降の括弧書式）、#116（要求レビュー中級と上級の二ファイル）、#161（`install` の model フラグ）、#162（ランナーの `models.json`）である。#161 と #162 は本課題の範囲外である。

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

## 決定

| 項目 | 内容 |
|---|---|
| 実行順・段数・数えるレビュー・連続不合格 | 設計 30 のとおり。変えない |
| 作成と修正の起動 | `model` を渡さない。frontmatter の `model` を使う |
| 要求レビュー 1 回目と 2 回目 | 親は Task に `model` を渡さない。`sdd-cur-req-reviewer` を起動する。frontmatter は `composer-2.5[fast=false]` |
| 要求レビュー 3 回目以降 | `review-next` の `model` は `reviewModelFromRound3` である。空でないとき `sdd-cur-req-reviewer-high` を起動する。親は Task に `model` を渡さない |
| 設計・実装レビュー 1 回目と 2 回目 | `model` を渡さない。frontmatter は `composer-2.5[fast=false]` |
| 設計・実装レビュー 3 回目以降 | `review-next` の `model` が空でないとき、その文字列をレビュー役の `model` に渡す。文字列は `reviewModelFromRound3` である |
| `reviewModelFromRound3` | `grok-4.7[context=256k,reasoning_effort=medium,fast=false]`。要求・設計・実装の 3 回目以降は同じ |
| 要求作成 frontmatter | `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` |
| 設計作成 frontmatter | `composer-2.5[fast=false]` |
| 要求作成と設計作成 | 同じ `model` 文字列を共有しない |
| 3 回目以降と作成 frontmatter | 同一とは書かない。3 回目以降は上級要求レビュー役の frontmatter と `reviewModelFromRound3` に揃える |
| 実装作成・修正役 | `composer-2.5[fast=false]` のまま |
| 人向けの「high の作成 1 回」 | 設計 30 の言い方は残す。作成の機械向け ID を high だけで示さない |
| 人の言葉（要約） | 要求作成は medium の Grok、設計作成は Composer、レビュー開始（中級相当の frontmatter）は Composer、3 回目以降のレビューは medium の Grok、修正は Composer |

六ファイルの frontmatter の `model` は、次の表と一文字も違わない。`name`、`description`、レビュー役の `readonly`、本文は変えない。

| ファイル | frontmatter の `model` |
|---|---|
| `agents/sdd-cur-req-author.md` | `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` |
| `agents/sdd-cur-req-reviewer.md` | `composer-2.5[fast=false]` |
| `agents/sdd-cur-req-reviewer-high.md` | `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` |
| `agents/sdd-cur-design-author.md` | `composer-2.5[fast=false]` |
| `agents/sdd-cur-design-reviewer.md` | `composer-2.5[fast=false]` |
| `agents/sdd-cur-implement-reviewer.md` | `composer-2.5[fast=false]` |

`src/conventions.ts` の `reviewModelFromRound3` は、上級要求レビュー役の `model` と同じ文字列にする。

### スキル `skills/sdd-cur/SKILL.md`

段、回数、`model` を渡す回と渡さない回、要求レビューの中級と上級の切り替えは、設計 30 と #116 のとおりである。変えるのは、作成説明の括弧内と、人向けの作成モデルの読み方だけである。

「要件」の、レビューに入る前の初回成果物作成を説明する一文にある括弧内の機械向け表記を、`grok-4.7[context=256k,reasoning_effort=medium,fast=false]` にする。要求作成と設計作成を同一括弧にまとめない。

同じ「要件」の節で、初回作成を説明する人向けの文は、作成の機械向け ID を `grok-4.7-high` や high だけで書かない。medium の Grok で要求作成役を起動する、と読めるようにする。「作成から合格まで 1 回」「high の作成 1 回」など、設計 30 の人向けの high の言い方は残してよい。

「設計」の節に、設計作成役の初回成果物作成だけを説明する括弧内の機械向け表記を足す。値は `composer-2.5[fast=false]` である。要求作成の括弧とは別の括弧である。

同じ「設計」の節で、初回作成を説明する人向けの文は、設計作成のモデルが Composer であると読めるようにする。

3 回目から渡す `model` の文字列を、分岐の散文に新たに書かない。`skills/sdd-cur-quick/SKILL.md` は変えない。

## テスト

`bun test` で実行する。一時ディレクトリを使い、終わったら消す。`gh` は起動しない。ホームディレクトリと、実行中の Cursor のスキルおよびサブエージェントは触らない。

- 六ファイルの frontmatter の `model` は、決定の表と一文字も違わない。六ファイルの `model` 行以外の本文は、実装前と同じである。[1][2][3][4][5][6][7]
- `reviewModelFromRound3` は受け入れ条件 8 の文字列である。`agents/sdd-cur-req-reviewer-high.md` の `model` と一致する。[8][9][21]
- `skills/sdd-cur/SKILL.md` の「要件」に、要求作成の初回成果物作成だけを説明する括弧内があり、値は要求作成 frontmatter と同じである。「設計」に、設計作成の初回成果物作成だけを説明する別括弧があり、値は設計作成 frontmatter と同じである。人向け表記は受け入れ条件 12 と 13 を満たす。[10][11][12][13]
- `src/agents-files.test.ts` の `sdd-cur-req-author.md`、`sdd-cur-req-reviewer.md`、`sdd-cur-design-author.md`、`sdd-cur-design-reviewer.md`、`sdd-cur-implement-reviewer.md` の `model` 期待は、受け入れ条件 1、2、4、5、6 と同じである。ほかの `expected` 項目と `bodyIncludes` は、本課題で変えない理由が無い限り維持する。[18]
- `src/sdd-skill-sdd-cur.test.ts` は、要求作成の括弧内の文字列と、設計作成の括弧内の文字列を、それぞれ受け入れ条件 10 と 11 の値として期待する。単一の high 作成 ID だけを必須にしない。[19]
- `src/docs.test.ts` は、要求作成と設計作成が同じ `model` 文字列を共有する前提を捨て、受け入れ条件 1・4・10・11 と矛盾しない期待に直す。[17]
- `src/spec.test.ts` の正本必須文言は、マージ後の `docs/canonical/sdd.md` に残る機械向け ID（medium Grok・Composer、`high` 系の廃止）と一致させる。[14][17]
- `src/89.test.ts` の六役相当 `model` 期待は、受け入れ条件 1・2・4・5・6 と一致させる。[17][18]
- `src/93.test.ts` の実装レビュー役 frontmatter の `model` 期待は、受け入れ条件 6 と一致させる。[17]
- `src/91.test.ts` ほか、`review-next` の 3 回目以降の `model` を確かめる既存の期待は、受け入れ条件 8 の文字列に合わせる。[20]
- `src/116.test.ts` の上級要求レビュー役の `model` と `reviewModelFromRound3` の一致を確かめる期待は、受け入れ条件 3 と 8 に合わせる。[21]
- `docs/canonical/sdd.md` は、設計の `## 正本への差分` を反映したあと、受け入れ条件 14 から 16 を満たす。[14][15][16]
- 実装者は、`bun test` ではホームを触らない。作業の一覧の `~/.cursor/agents` の確認は、リポジトリの六ファイルと比べ、受け入れ条件 22 を満たす。[22]
- `bun test` の終了コードは 0 である。[17]

## 変えるファイル

- agents/sdd-cur-req-author.md
- agents/sdd-cur-req-reviewer.md
- agents/sdd-cur-req-reviewer-high.md
- agents/sdd-cur-design-author.md
- agents/sdd-cur-design-reviewer.md
- agents/sdd-cur-implement-reviewer.md
- src/conventions.ts
- skills/sdd-cur/SKILL.md
- docs/canonical/sdd.md
- src/agents-files.test.ts
- src/sdd-skill-sdd-cur.test.ts
- src/91.test.ts
- src/116.test.ts
- src/docs.test.ts
- src/spec.test.ts
- src/89.test.ts
- src/93.test.ts

## 作業の一覧

- 1. 六ファイルの frontmatter の `model` 行を、決定の表にする。[1][2][3][4][5][6][7]
- 2. `src/conventions.ts` の `reviewModelFromRound3` を受け入れ条件 8 にする。[8][9]
- 3. `skills/sdd-cur/SKILL.md` を、決定のスキルのとおり直す。[10][11][12][13]
- 4. `docs/canonical/sdd.md` に、作成・人向け表記まわり（REQ-167、REQ-174、REQ-204、REQ-228、REQ-229、REQ-400、REQ-923 など）を正本への差分のとおり反映する。[10][11][12][13][14][15]
- 5. 同ファイルに、レビュー 3 回目以降と `reviewModelFromRound3`、中級・上級の切り替え（REQ-205、REQ-209、REQ-227、REQ-231、REQ-233、REQ-372、REQ-375、REQ-376、REQ-382、REQ-383、REQ-398、REQ-399、REQ-407、REQ-810 など）を反映する。[8][9][14][16]
- 6. 同ファイルに、テスト・スキル・ID 表（REQ-377、REQ-378、REQ-379、REQ-387、REQ-388、REQ-389、REQ-390、REQ-391、REQ-392、REQ-393、REQ-402、REQ-411、REQ-412 など）を反映する。[14][16][18][19]
- 7. 上記四ファイルに加え、`src/docs.test.ts`、`src/spec.test.ts`、`src/89.test.ts`、`src/93.test.ts` を、テスト節のとおり直す。[17][18][19][20][21]
- 8. 利用者の `~/.cursor/agents` の六ファイルを、リポジトリの `agents/` と揃える。あるファイルは `diff` が無いこと、無いファイルは frontmatter の `model` 行が受け入れ条件 1 から 6 と一致すること。[22]
- 9. `bun test` が成功することを確かめる。[17]

## 関係する課題

- #53（サブエージェントの `model` と 3 回目以降を正本に定めた。本課題は割当を更新する）
- #55（3 回目以降の括弧書式。本課題は 3 回目の値を medium Grok に変える）
- #116（要求レビュー中級と上級。上級の `model` は本課題で medium Grok になる。分岐構造は変えない）
- #161（`install` の model フラグ。触らない）
- #162（`models.json` と `AGENT_MODEL`。触らない）

## 正本への差分

### 変更 sdd REQ-167

もとになった課題は #20 である。

人の言葉でのモデル名は、要求作成が medium の Grok、レビュー（要求レビュー中級の frontmatter）が Composer、修正が `composer-2.5[fast=false]` である。機械向けの ID は、要求作成が `grok-4.7[context=256k,reasoning_effort=medium,fast=false]`、要求レビュー中級が `composer-2.5[fast=false]`、修正が `composer-2.5[fast=false]` である。修正案作成のファイルは `agents/` に無い。

- シナリオ: 条件: 要求作成 `agents/sdd-cur-req-author.md` の frontmatter を読む 主体: 検査 結果: `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である

### 変更 sdd REQ-174

もとになった課題は #21 である。

人の言葉でのモデル名は、設計作成が Composer、レビュー（設計レビュー役の frontmatter）が Composer、修正が `composer-2.5[fast=false]` である。機械向けの ID は、設計作成が `composer-2.5[fast=false]`、設計レビューが `composer-2.5[fast=false]`、修正が `composer-2.5[fast=false]` である。修正案作成のファイルは `agents/` に無い。要求作成の frontmatter の `model` は、設計作成と同じ文字列ではない。

- シナリオ: 条件: 要求作成と設計作成の frontmatter の `model` を比べる 主体: 検査 結果: 一文字も同じではない

### 変更 sdd REQ-204

もとになった課題は #30 である。

要求作成の frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。設計作成の frontmatter の `model` は `composer-2.5[fast=false]` である。実装作成の frontmatter の `model` は `composer-2.5[fast=false]` である。「作成から合格まで 1 回」および high の作成 1 回は、レビューに入る前の初回の成果物作成を指す。要求作成のその作成の `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。設計作成のその作成の `model` は `composer-2.5[fast=false]` である。設計 26 の質問で人が通常の選択肢を選んだあとの要求作成役の再起動は、同じ要求の続きであり、作成の high の 2 回目に数えない。レビューの不合格のあとは、作成役を起動しない。不合格のあと、作成はやり直さない。修正の frontmatter の `model` は `composer-2.5[fast=false]` 。

- シナリオ: 条件: 設計作成 `agents/sdd-cur-design-author.md` の frontmatter を読む 主体: 検査 結果: `model` は `composer-2.5[fast=false]` である

### 変更 sdd REQ-205

もとになった課題は #30 である。

レビューと修正指示は、要求・設計・実装のレビュー役 frontmatter に従い、中級相当は `composer-2.5[fast=false]` で始める。数えたレビューの不合格が 2 回続いたあと、3 回目から `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。合格までその文字列のままである。中級相当の Composer には戻さない。

- シナリオ: 条件: 同じ流れで数えたレビューが 3 回目である 主体: `review-next` 結果: 返る `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である

### 変更 sdd REQ-209

もとになった課題は #116 である。

要求レビューでは、親は Task に `model` を渡さない。`review-next` が返した `model` が空文字のときは `sdd-cur-req-reviewer` を起動する。空でないときは `sdd-cur-req-reviewer-high` を起動する。1 回目と 2 回目の返る `model` は空文字である。設計レビューと実装レビューでは、数えた 1 回目と 2 回目は `model` を渡さない。frontmatter は `composer-2.5[fast=false]` である。1 回目と 2 回目が続けて不合格のとき、3 回目から親が `model` に `review-next` が返した文字列を渡す。その文字列は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。合格まで渡す。中級相当の Composer には戻さないである。

- シナリオ: 条件: 設計レビューで数えた 1 回目である 主体: 親 結果: レビュー役の起動に `model` を渡さない

### 変更 sdd REQ-227

もとになった課題は #30 である。

3 以降は `review-next` が `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` を返す。要求レビューは `model` を渡さない。返った `model` が空でないときは `sdd-cur-req-reviewer-high` を起動する。設計レビューと実装レビューは、返った `model` が空でないとき、その文字列を渡す。合格まで戻さない。

- シナリオ: 条件: 実装レビューで数えた 3 回目である 主体: `review-next` 結果: 返る `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である

### 変更 sdd REQ-228

もとになった課題は #30 である。

人の言葉でのモデル名は、要求作成が medium の Grok、設計作成が Composer、実装作成が composer-2.5、レビューの開始が Composer、3 回目からのレビューが medium の Grok、修正が composer-2.5 である。fast はすべて false であり、frontmatter の `model` と同じ指定である。3 回目から渡す文字列は、要求レビュー上級 `agents/sdd-cur-req-reviewer-high.md` の frontmatter の `model` と `reviewModelFromRound3` と一文字も違わない。要求作成および設計作成の frontmatter の `model` とは違う。実装作成の frontmatter の `model` は `composer-2.5[fast=false]` であり、3 回目から渡す文字列とは違う。

- シナリオ: 条件: 3 回目以降に渡す文字列と要求作成 frontmatter の `model` を比べる 主体: 検査 結果: 一文字も同じではない

### 変更 sdd REQ-229

もとになった課題は #30 である。

「作成から合格まで 1 回」および high の作成 1 回は、レビューに入る前の初回の成果物作成を指す。要求作成の frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。設計作成の frontmatter の `model` は `composer-2.5[fast=false]` である。設計 26 の質問で人が通常の選択肢を選んだあとの要求作成役の再起動は、同じ要求の続きであり、作成の high の 2 回目に数えない。レビューの不合格のあと、作成役は起動しない。

- シナリオ: 条件: 要求作成 frontmatter を読む 主体: 検査 結果: `model` は medium の Grok 指定である

### 変更 sdd REQ-231

もとになった課題は #30 である。

レビューと修正指示のモデルは、中級相当の frontmatter は `composer-2.5[fast=false]` で始める。レビュー不合格が 2 回続いたあと、3 回目のレビューから `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。合格までその文字列のままである。中級相当の Composer には戻さない。

- シナリオ: 条件: 設計レビューで不合格が 2 回続いたあと 3 回目を起動する 主体: 親 結果: レビュー役に渡す `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である

### 変更 sdd REQ-232

もとになった課題は #30 である。

1. 作成を 1 回行う。要求作成の frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。設計作成の frontmatter の `model` は `composer-2.5[fast=false]` である。実装作成の frontmatter の `model` は `composer-2.5[fast=false]` 。
2. レビューと修正指示を、1 回の起動で行う。
3. 合格のときは、修正を起動せず、その流れを終える。
4. 不合格のときは、修正を行う。修正の frontmatter の `model` は `composer-2.5[fast=false]` である。修正のあと、レビューと修正指示に戻る。

- シナリオ: 条件: 設計の流れで作成を 1 回行う 主体: 親 結果: 設計作成役の frontmatter の `model` は `composer-2.5[fast=false]` である

### 変更 sdd REQ-233

もとになった課題は #30 である。

レビューと修正指示は、中級相当は `composer-2.5[fast=false]` で始める。同じ流れでレビューの不合格が 2 回続いたあと、3 回目のレビューから `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` を使う。いったんその文字列にしたあとは、合格までその文字列のままである。中級相当の Composer には戻さない。不合格のエスカレーションで使う 3 回目以降の文字列は、このレビューと修正指示である。修正の frontmatter の `model` は `composer-2.5[fast=false]` のまま。

- シナリオ: 条件: 要求の流れで 3 回目のレビューである 主体: 親 結果: 上級要求レビュー役を起動し、Task に `model` は渡さない

### 変更 sdd REQ-372

もとになった課題は #53 である。

要求作成の frontmatter は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。設計作成の frontmatter は `composer-2.5[fast=false]` である。実装の作成は `composer-2.5[fast=false]` である。レビューは中級相当の frontmatter が `composer-2.5[fast=false]` で始める。数えたレビューの不合格が 2 回続いたあと 3 回目から `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。合格までその文字列のままである。中級相当の Composer には戻さない。修正は `composer-2.5[fast=false]` である。

- シナリオ: 条件: `src/conventions.ts` の `reviewModelFromRound3` を読む 主体: 検査 結果: 値は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である

### 変更 sdd REQ-375

もとになった課題は #53 である。

3 回目以降に親が渡す、または `review-next` が返す `model` の文字列は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。値は `reviewModelFromRound3` と要求レビュー上級の frontmatter の `model` と一文字も違わない。要求作成および設計作成の frontmatter の `model` と同一とは書かない。実装作成の frontmatter は `composer-2.5[fast=false]` である。実装のレビュー 3 回目以降に渡す `model` も、同じ `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。

- シナリオ: 条件: 正本で要求作成と設計作成の `model` の関係を読む 主体: 検査 結果: 両者が同じ文字列を共有する、とは書かれていない

### 変更 sdd REQ-376

もとになった課題は #53 である。

`skills/sdd-cur/SKILL.md` の要件と設計の手順は、3 回目から渡す `model` を `grok-4.7-high` と書かない。3 回目以降の文字列は `review-next` の `model` であり、`grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。1 回目と 2 回目は `model` を渡さない。合格まで渡す。中級相当の Composer には戻さない。

- シナリオ: 条件: 数えたレビューが 3 回目である 主体: `review-next` 結果: `model` は空文字ではない

### 変更 sdd REQ-377

もとになった課題は #53 である。

`skills/sdd-cur-implement/SKILL.md` のレビュー手順は、3 回目から渡す `model` を `grok-4.7-high` と書かない。空でないときに渡す文字列は `review-next` の `model` であり、`grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。実装作成は `model` を渡さず、frontmatter の `composer-2.5[fast=false]` を使う。10 回打ち切りや `model` を渡さない回の扱いは設計 30 のとおりである。

- シナリオ: 条件: 実装レビューで `review-next` が空でない `model` を返す 主体: 親 結果: その文字列を実装レビュー役に渡す

### 変更 sdd REQ-378

もとになった課題は #53 である。

`src/agents.test.ts` は無い。`src/agents-files.test.ts` が、九つの `model` 期待値を確かめる。要求作成は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]`、設計作成は `composer-2.5[fast=false]`、要求・設計・実装のレビュー中級相当は `composer-2.5[fast=false]`、実装作成と修正は `composer-2.5[fast=false]` である。本文の必須文言の確認は、設計 30 以降のまま残す。

- シナリオ: 条件: `src/agents-files.test.ts` の要求作成の `model` 期待を読む 主体: テスト 結果: `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である

### 変更 sdd REQ-379

もとになった課題は #53 である。

`src/sdd.test.ts` は無い。`src/sdd-skill-sdd-cur.test.ts` が、`skills/sdd-cur/SKILL.md` の必須文言のうち、要求作成の初回成果物作成の括弧内を `grok-4.7[context=256k,reasoning_effort=medium,fast=false]`、設計作成の初回成果物作成の括弧内を `composer-2.5[fast=false]` として確かめる。`grok-4.7-high` は必須にしない。設計 26・27 の分と、設計 30 で残すその他の必須文言は維持する。

- シナリオ: 条件: `src/sdd-skill-sdd-cur.test.ts` を読む 主体: テスト 結果: 設計作成の括弧内の期待が `composer-2.5[fast=false]` である

### 変更 sdd REQ-382

もとになった課題は #53 である。

レビューの 3 回目以降は1 回目と 2 回目が続けて不合格のとき、親が `model` に `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` を渡す。合格まで渡す。中級相当の Composer には戻さない。

- シナリオ: 条件: 設計レビューで 2 回続けて不合格のあと 3 回目である 主体: 親 結果: 渡す `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である

### 変更 sdd REQ-383

もとになった課題は #53 である。

要求・設計の作成の frontmatter は、要求作成が `grok-4.7[context=256k,reasoning_effort=medium,fast=false]`、設計作成が `composer-2.5[fast=false]` である。要求・設計のレビュー 3 回目以降に渡す文字列は `reviewModelFromRound3` であり、作成 frontmatter と同一とは書かない。

- シナリオ: 条件: 正本の当該要求を読む 主体: 検査 結果: 作成二役が同じ `model` と書かれていない

### 変更 sdd REQ-384

もとになった課題は #53 である。

実装の作成と 3 回目以降は実装作成の frontmatter は `composer-2.5[fast=false]` である。実装のレビュー 3 回目以降に渡す文字列は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。この二つは揃えない。

- シナリオ: 条件: 実装レビューで数えた 3 回目である 主体: 親 結果: 渡す `model` は `reviewModelFromRound3` と同じ medium の Grok である

### 変更 sdd REQ-386

もとになった課題は #53 である。

実装の打ち切りは設計 30 のとおり。数えた不合格が 10 のとき、修正も次のレビューも起動しない。10 回には中級相当の Composer によるレビューと、3 回目以降の medium の Grok によるレビューの両方が入る。

- シナリオ: 条件: 実装レビューで数えた不合格が 10 に達する 主体: 親 結果: 修正も次のレビューも起動しない

### 変更 sdd REQ-387

もとになった課題は #53 である。

使う ID は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` と `composer-2.5[fast=false]` である。要求作成と要求レビュー上級の frontmatter と 3 回目以降に渡す文字列は medium の Grok である。設計作成と要求・設計・実装のレビュー中級相当の frontmatter は Composer である。実装作成と修正は `composer-2.5[fast=false]` である。

- シナリオ: 条件: 要求レビュー中級の frontmatter を読む 主体: 検査 結果: `model` は `composer-2.5[fast=false]` である

### 変更 sdd REQ-388

もとになった課題は #53 である。

使わない ID は `grok-4.7-high`、`grok-4.7-medium`、`grok-4.7-high[fast=false]`、`grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。3 回目以降に渡す `model` や作成説明の括弧内では、上記および high の bracket 形式は使わない。使う bracket 形式は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` と `composer-2.5[fast=false]` である。

- シナリオ: 条件: 正本で 3 回目以降に渡す `model` の記述を読む 主体: 検査 結果: `grok-4.7[context=256k,reasoning_effort=high,fast=false]` とは書かれていない

### 変更 sdd REQ-389

もとになった課題は #53 である。

1 と 2は中級相当。`model` は渡さない。要求レビュー中級の frontmatter は `composer-2.5[fast=false]` である。設計レビューと実装レビューの frontmatter は `composer-2.5[fast=false]` である。

- シナリオ: 条件: 要求レビュー中級の frontmatter を読む 主体: 検査 結果: `model` は `composer-2.5[fast=false]` である

### 変更 sdd REQ-390

もとになった課題は #53 である。

設計レビューと実装レビューでは、数えた 3 回目以降、親が `model` に `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` を渡す。合格まで戻さない。要求レビューでは親は Task に `model` を渡さない。返った `model` が空でないときは `sdd-cur-req-reviewer-high` を起動する。

- シナリオ: 条件: 数えたレビューが 3 以降である 主体: `review-next` 結果: 返る `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である

### 変更 sdd REQ-391

もとになった課題は #53 である。

人の言葉でのモデル名は、要求作成が medium の Grok、設計作成が Composer、実装の作成が composer-2.5、レビューの開始が Composer、3 回目からのレビューが medium の Grok、修正が composer-2.5 である。機械向けの ID は、要求作成が `grok-4.7[context=256k,reasoning_effort=medium,fast=false]`、設計作成とレビュー中級相当が `composer-2.5[fast=false]`、実装作成と修正が `composer-2.5[fast=false]`、3 回目から渡す `model` が `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。

- シナリオ: 条件: 正本の人の言葉でのモデル名を読む 主体: 検査 結果: 設計作成が Composer と読める

### 変更 sdd REQ-392

もとになった課題は #53 である。

人が決めた条件として、実装作成のモデルは `composer-2.5[fast=false]` である。要求作成は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]`、設計作成は `composer-2.5[fast=false]`、レビューの開始は `composer-2.5[fast=false]`、3 回目からのレビューは `grok-4.7[context=256k,reasoning_effort=medium,fast=false]`、修正は `composer-2.5[fast=false]` である。

- シナリオ: 条件: 要求作成の機械向け ID を読む 主体: 検査 結果: medium の Grok である

### 変更 sdd REQ-393

もとになった課題は #53 である。

作成とレビュー中級相当の frontmatter の機械向け ID は、`grok-4.7[context=256k,reasoning_effort=medium,fast=false]` と `composer-2.5[fast=false]` である。3 回目以降に渡す文字列は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。`grok-4.7-high` と `grok-4.7-medium` は書かない。実装作成は `composer-2.5[fast=false]` である。

- シナリオ: 条件: スキル本文に `grok-4.7-high` を探す 主体: 検査 結果: 3 回目の `model` や作成括弧内の必須表記として無い

### 変更 sdd REQ-398

もとになった課題は #55 である。

機械向けに親がレビュー 3 回目以降に渡す `model` の文字列は、要求作成および設計作成の frontmatter の `model` と一文字も違わない、とは書かない。値は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` であり、`reviewModelFromRound3` と要求レビュー上級の frontmatter の `model` と一文字も違わない。

- シナリオ: 条件: 3 回目以降の文字列と設計作成 frontmatter を比べる 主体: 検査 結果: 一文字も同じではない

### 変更 sdd REQ-399

もとになった課題は #116 である。

`review-next` が返す `model` は、1 回目と 2 回目は空文字である。3 回目以降は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。合格まで、空文字には戻さない。要求レビューでは、親は Task に `model` を渡さない。返った `model` が空文字なら `sdd-cur-req-reviewer` を、空でないなら `sdd-cur-req-reviewer-high` を起動する。`skills/sdd-cur/SKILL.md` は、この文字列を要求レビューの分岐の散文として書かない。設計レビューと実装レビューでは、返った `model` が空でないとき、その文字列をレビュー役の model に渡す。

- シナリオ: 条件: `reviewModelFromRound3` の定義を読む 主体: `src/conventions.ts` 結果: `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である

### 変更 sdd REQ-400

もとになった課題は #55 である。

`skills/sdd-cur/SKILL.md` の「要件」で、要求作成役の初回成果物作成を説明する括弧内のモデル表記は、要求作成 `agents/sdd-cur-req-author.md` の frontmatter の `model` と一文字も違わない。値は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。

- シナリオ: 条件: `skills/sdd-cur/SKILL.md` の「要件」の作成括弧を読む 主体: 検査 結果: 値は medium の Grok である

### 変更 sdd REQ-402

もとになった課題は #55 である。

`skills/sdd-cur-implement/SKILL.md` の「レビュー」は、第1引数 `implement` の `review-next` に従う。3 回目からの `model` は、返った `model` が `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` であるとき、その文字列である。実装作成は `model` を渡さない。10 回の打ち切りは、`reason` が `実装レビューが不合格のまま10回に達した` のときである。

- シナリオ: 条件: 実装で 3 回目の `review-next` を呼ぶ 主体: CLI 結果: `model` は medium の Grok である

### 変更 sdd REQ-407

もとになった課題は #55 である。

要求作成 `agents/sdd-cur-req-author.md` の frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。設計作成 `agents/sdd-cur-design-author.md` の frontmatter の `model` は `composer-2.5[fast=false]` である。要求・設計のレビュー 3 回目以降に渡す文字列は、どちらの作成 frontmatterとも同一ではなく、`reviewModelFromRound3` である。

- シナリオ: 条件: 正本の当該要求を読む 主体: 検査 結果: 作成二役と 3 回目が同一文字列、とは書かれていない

### 変更 sdd REQ-411

もとになった課題は #55 である。

3 回目以降に渡す機械向けの文字列は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。`grok-4.7-high` は、3 回目から渡す `model` や作成説明の括弧内では使わない。

- シナリオ: 条件: 作成説明の括弧内を読む 主体: 検査 結果: `grok-4.7-high` ではない

### 変更 sdd REQ-412

もとになった課題は #55 である。

参照する frontmatter の値は、次と一文字も違わない。要求作成は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]`。設計作成は `composer-2.5[fast=false]`。要求・設計・実装のレビュー中級相当は `composer-2.5[fast=false]`。要求レビュー上級は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]`。3 回目以降に渡す文字列は上級と同じ medium の Grok である。

- シナリオ: 条件: 設計作成 frontmatter を読む 主体: 検査 結果: `composer-2.5[fast=false]` である

### 変更 sdd REQ-810

もとになった課題は #116 である。

要求レビューの中級のファイルは `agents/sdd-cur-req-reviewer.md` である。frontmatter の `name` は `sdd-cur-req-reviewer` である。frontmatter の `model` は `composer-2.5[fast=false]` である。要求レビューの上級のファイルは `agents/sdd-cur-req-reviewer-high.md` である。frontmatter の `name` は `sdd-cur-req-reviewer-high` である。frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` であり、`reviewModelFromRound3` と一文字も違わない。上級のレビューの見方は、中級と同じである。違うのは、frontmatter の `name` と `model` と、上級であることの表示である。上級であることの表示は、frontmatter の description の先頭の `上級である。` と、本文の最初の文 `あなたは sdd-cur の上級の要求レビュー役である。` である。上級の frontmatter の `readonly` は `true` であり、中級と同じである。

- シナリオ: 条件: 上級の `model` と `reviewModelFromRound3` を比べる 主体: 検査 結果: 一文字も違わない

### 変更 sdd REQ-394

もとになった課題は #116 である。

作成と修正の起動では、引き続き `model` を渡さない。frontmatter の `model` を使う。要求レビューでは、親は Task に `model` を渡さない。返った `model` が空文字なら `sdd-cur-req-reviewer` を、空でないなら `sdd-cur-req-reviewer-high` を起動する。設計レビューと実装レビューでは、数えた 1 回目と 2 回目は `model` を渡さない。frontmatter は `composer-2.5[fast=false]` である。1 回目と 2 回目が続けて不合格のとき、3 回目から親が `model` に `review-next` が返した文字列を渡す。その文字列は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。合格まで渡す。中級相当の Composer には戻さないである。

- シナリオ: 条件: 実装レビューで数えた 3 回目である 主体: 親 結果: 渡す `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である

### 追加 sdd REQ-923

もとになった課題は #176 である。

`skills/sdd-cur/SKILL.md` の「設計」で、設計作成役の初回成果物作成を説明する括弧内のモデル表記は、設計作成 `agents/sdd-cur-design-author.md` の frontmatter の `model` と一文字も違わない。値は `composer-2.5[fast=false]` である。要求作成の初回成果物作成を説明する括弧内とは、別の括弧である。

- シナリオ: 条件: `skills/sdd-cur/SKILL.md` の「設計」に設計作成の括弧がある 主体: 検査 結果: 括弧内は `composer-2.5[fast=false]` である
