# docs

## REQ-707

もとになった課題は #83 である。

README が `install` のコピー対象のスキルとして書く範囲は、`skills/` 直下のディレクトリの全体と一致する。ディレクトリの図に書くスキルも、その全体と一致する。

## REQ-708

もとになった課題は #83 である。

`skills/` 直下のディレクトリと、README のスキルの記述がずれたとき、`bun test` が失敗する。

## REQ-709

もとになった課題は #83 である。

`AGENTS.md` の構成の表にあるサブコマンドの列挙、`AGENTS.md` の「コマンド」にある `bun src/cli.ts` の例、README の「開発中の起動」にある `bun src/cli.ts` の例、README のそのあとのコマンドの表は、それぞれ `src/cli.ts` のサブコマンドをすべて含む。`branch` を含む。README のこの例と表は `close` も含む。

## REQ-710

もとになった課題は #83 である。

これらの一覧に並ぶ `src/cli.ts` のサブコマンド名と、`src/cli.ts` のサブコマンドがずれたとき、`bun test` が失敗する。`bun test` は、このサブコマンド名に数えない。

## REQ-711

もとになった課題は #83 である。

`AGENTS.md` に、SDD スキルも課題ランナーも課題を作らない、という記述は無い。

## REQ-712

もとになった課題は #83 である。

スキルとサブエージェントが、同じモデルを別の表記で書いたとき、`bun test` が失敗する。上げたあとのモデルでは、`grok-4.7-high` と `grok-4.7[context=256k,reasoning_effort=high,fast=false]` が別の表記である。

## REQ-713

もとになった課題は #83 である。

サブコマンドの正は `src/cli.ts` の `main` にある `switch (sub)` の `case "..."` である。`default` は含めない。順は `install`、`run`、`labels`、`candidates`、`show`、`branch`、`confirm`、`close`、`reflect`、`validate`、`complete`、`restore`、`review-next` である。

## REQ-714

もとになった課題は #83 である。

文書に書く順は上の switch の順。テストが見るのは名前の集合であり、並びの一致は見ないである。

## REQ-715

もとになった課題は #83 である。

`bun test`は開発用のコマンドとして、いま書いてある例と README の表に残す。サブコマンド名には数えないである。

## REQ-716

もとになった課題は #83 である。

スキルの正は`skills/` 直下のディレクトリである。ファイルは含めない。`installSkills` がディレクトリだけをコピーする規則と同じである

## REQ-717

もとになった課題は #83 である。

いまのディレクトリは`sdd-cur`、`sdd-cur-complete`、`sdd-cur-create-issue`、`sdd-cur-fix`、`sdd-cur-implement`、`sdd-cur-quick`。名前の昇順は、`skillNames.sort()` の既定の並びである

## REQ-718

もとになった課題は #83 である。

上げたあとのモデルは`grok-4.7[context=256k,reasoning_effort=high,fast=false]`。`grok-4.7-high` は、このモデルの別の表記であり、スキルとサブエージェントには書かないである。

## REQ-719

もとになった課題は #83 である。

テストは`src/docs.test.ts`。`bun:test` の `describe` と `test`。`gh` は起動しない。ホームディレクトリは使わない。読むだけで、一時ディレクトリは作らないである。

## REQ-720

もとになった課題は #83 である。

3 回目以降に渡す `model` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。レビューの開始は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。修正は `composer-2.5[fast=false]` である。2 回連続の不合格のあと 3 回目から high にし、合格まで high のままにする、という段の数え方は #30 のまま残す

## REQ-762

もとになった課題は #90 である。

README の SDD スキルの役割に、調べるだけの段を書く。README に、サブエージェント `sdd-cur-explore` を書く。`install` がコピーするサブエージェントの数は、十個である。

## REQ-779

もとになった課題は #94 である。

README は、人が `bun src/cli.ts request <番号>` で作業ブランチを push してから「実装依頼」を付ける、と書く。

## REQ-780

もとになった課題は #94 である。

`docs/policy.md` の構成の表の `src/cli.ts` の行は、サブコマンド `request` を含む。

## REQ-781

もとになった課題は #94 である。

`AGENTS.md` の「コマンド」の例の行は `bun src/cli.ts request <番号>` である。

## REQ-782

もとになった課題は #94 である。

README の「開発中の起動」の例の行は `bun src/cli.ts request <番号>` である。

## REQ-783

もとになった課題は #94 である。

README のコマンドの表は `request` を含む。
