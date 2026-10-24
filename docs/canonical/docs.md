# docs

## REQ-707

もとになった課題は #83 である。

README が `install` のコピー対象のスキルとして書く範囲は、`skills/` 直下のディレクトリの全体と一致する。ディレクトリの図に書くスキルも、その全体と一致する。

## REQ-708

もとになった課題は #83 である。

`skills/` 直下のディレクトリと、README のスキルの記述がずれたとき、`bun test` が失敗する。

## REQ-709

もとになった課題は #115 である。

`AGENTS.md` の構成の表にあるサブコマンドの列挙と、`AGENTS.md` の「コマンド」にある `bun src/cli.ts` の例は、それぞれ `src/cli.ts` のサブコマンドをすべて含む。`branch` を含む。README の「開発中の起動」のコマンド例と、そのあとのスキル呼び出し分の表は、`src/cli.ts` のサブコマンドをすべて含む対象から外す。

## REQ-710

もとになった課題は #115 である。

`AGENTS.md` の構成の表にあるサブコマンドの列挙と、`AGENTS.md` の「コマンド」にある `bun src/cli.ts` の例に並ぶサブコマンド名が、`src/cli.ts` のサブコマンドとずれたとき、`bun test` が失敗する。README の一覧が `src/cli.ts` のサブコマンド全体と一致することは、この失敗の条件に含めない。`src/docs.test.ts` は、README の「開発中の起動」を `bun src/cli.ts` の全サブコマンドとして `src/cli.ts` と比べない。`bun test` は、このサブコマンド名に数えない。

## REQ-711

もとになった課題は #83 である。

`AGENTS.md` に、SDD スキルも課題ランナーも課題を作らない、という記述は無い。

## REQ-712

もとになった課題は #83 である。

同じモデルをスキルとサブエージェントが別の字面で書くと、`bun test` は失敗する。上げたあとのモデルでは、`grok-4.7-high` と `grok-4.7[context=256k,reasoning_effort=high,fast=false]` は、別の字面である。

## REQ-713

もとになった課題は #83 である。

サブコマンドの正は `src/cli.ts` の `main` にある `switch (sub)` の `case "..."` である。`default` は含めない。順は `install`、`run`、`labels`、`candidates`、`show`、`gate`、`branch`、`prepare-branch`、`confirm`、`close`、`reflect`、`validate`、`complete`、`restore`、`review-next`、`request`、`spec-check`、`tasks` である。

- シナリオ: 条件: `src/cli.ts` に `gate` の `case` がある 主体: 文書と CLI 結果: `docs/canonical/docs.md` の列挙に `gate` が含まれる

## REQ-714

もとになった課題は #83 である。

文書に書く順は上の switch の順。テストが見るのは名前の集合であり、並びの一致は見ない。

## REQ-715

もとになった課題は #83 である。

`bun test`は開発用のコマンドとして、いま書いてある例と README の表に残す。サブコマンド名には数えない。

## REQ-716

もとになった課題は #83 である。

スキルの正は`skills/` 直下のディレクトリである。ファイルは含めない。`installSkills` がディレクトリだけをコピーする規則と同じである

## REQ-717

もとになった課題は #119 である。

いまのディレクトリは`sdd-cur`、`sdd-cur-complete`、`sdd-cur-create-issue`、`sdd-cur-fix`、`sdd-cur-implement`、`sdd-cur-policy`、`sdd-cur-quick`。名前の昇順は、`skillNames.sort()` の既定の並びである

## REQ-718

もとになった課題は #83 である。

モデルを上げたあとに本文へ書く識別子は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。`grok-4.7-high` は別表記なので、スキルとサブエージェントの本文へは置かない。

## REQ-719

もとになった課題は #83 である。

テストは`src/docs.test.ts`。`bun:test` の `describe` と `test`。`gh` は起動しない。ホームディレクトリは使わない。読むだけで、一時ディレクトリは作らない。

## REQ-720

もとになった課題は #83 である。

3 回目以降に渡す `model` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。レビューの開始は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。修正は `composer-2.5[fast=false]` である。2 回連続の不合格のあと 3 回目から high にし、合格まで high のままにする、という段の数え方は #30 のまま残す

## REQ-762

もとになった課題は #116 である。

README の SDD スキルの役割に、調べるだけの段を書く。README に、サブエージェント `sdd-cur-explore` を書く。`install` がコピーするサブエージェントの数は、十一個である。

## REQ-779

もとになった課題は #115 である。

README は、人が `sdd-cur request <番号>` で作業ブランチを push してから「実装依頼」を付ける、と書く。この文に `bun src/cli.ts` は無い。

## REQ-780

もとになった課題は #94 である。

`docs/policy.md` の構成表で、`src/cli.ts` を説明する行に、サブコマンド名 `request` がある。

## REQ-781

もとになった課題は #94 である。

`AGENTS.md` のコマンド例には、`bun src/cli.ts request <番号>` という一行がある。

## REQ-782

もとになった課題は #115 である。

README の「開発中の起動」の例は、`bun src/cli.ts request <番号>` を含まない。スキル呼び出しの例も、`request` を含まない。

## REQ-783

もとになった課題は #115 である。

README でスキル呼び出しをまとめた表は、`request` の行を持たない。

## REQ-815

もとになった課題は #122 である。

方針の構成表は、`src/cli.ts` の入口の説明へ `spec-check` を書く。

## REQ-816

もとになった課題は #113 である。

`docs/policy.md` の構成の表に `src/spec.ts` の行がある。この行は、`docs/canonical/` 直下の要求について、近い本文、壊れた文末、空の本文、識別子の重複を検査する、と書く。

## REQ-817

もとになった課題は #122 である。

開発者向けの `AGENTS.md` は、`spec-check` を `bun src/cli.ts spec-check` としてコマンドの例に載せる。

## REQ-818

もとになった課題は #115 である。

`bun src/cli.ts spec-check` は、README の開発中の起動例に置かない。スキルを呼び出す側の例にも、このサブコマンド名は置かない。

## REQ-819

もとになった課題は #115 である。

スキル呼び出しの表に、`spec-check` という名前は出さない。

## REQ-827

もとになった課題は #115 である。

README のコマンド例に `bun src/cli.ts` は無い。「開発中の起動」のコードフェンスにも無い。使い方の文は `sdd-cur --help` と `bunx @paterapatera/sdd-cur --help` であり、その文に `bun src/cli.ts` は無い。

## REQ-828

もとになった課題は #115 である。

スキル呼び出し分の `bunx @paterapatera/sdd-cur` の例は、`bunx @paterapatera/sdd-cur candidates`、`bunx @paterapatera/sdd-cur show <番号>`、`bunx @paterapatera/sdd-cur branch <番号>`、`bunx @paterapatera/sdd-cur validate <番号>`、`bunx @paterapatera/sdd-cur confirm <番号>`、`bunx @paterapatera/sdd-cur reflect <番号> <requirements|design>`、`bunx @paterapatera/sdd-cur review-next requirements <番号>`、`bunx @paterapatera/sdd-cur review-next reflect-design <番号>`、`bunx @paterapatera/sdd-cur review-next quick <番号>`、`bunx @paterapatera/sdd-cur review-next implement <番号>`、`bunx @paterapatera/sdd-cur complete <番号>`、`bunx @paterapatera/sdd-cur close <番号>` である。スキル呼び出し分の `sdd-cur` の例は、`sdd-cur candidates`、`sdd-cur show <番号>`、`sdd-cur branch <番号>`、`sdd-cur validate <番号>`、`sdd-cur confirm <番号>`、`sdd-cur reflect <番号> <requirements|design>`、`sdd-cur review-next requirements <番号>`、`sdd-cur review-next reflect-design <番号>`、`sdd-cur review-next quick <番号>`、`sdd-cur review-next implement <番号>`、`sdd-cur complete <番号>`、`sdd-cur close <番号>` である。「開発中の起動」のコードフェンスは、この二つの例の少なくとも一方を含む。そのフェンスの、`bun test` 以外のコマンド行は、`sdd-cur` または `bunx @paterapatera/sdd-cur` で始まる。

## REQ-829

もとになった課題は #115 である。

スキル呼び出し分の表のサブコマンド名は、`bun test` を除いて、`candidates`、`show`、`branch`、`validate`、`confirm`、`reflect`、`review-next`、`complete`、`close` である。スキル呼び出し分の例と表に、`install`、`run`、`labels`、`restore`、`spec-check`、`request` は無い。`bun test` は、README の例と表に残す。スキル呼び出し分のサブコマンド名には数えない。

## REQ-830

もとになった課題は #115 である。

`request`、`install`、`run` を書くときは、スキル呼び出し分の例および表とは別の節に置く。「役割」は `sdd-cur request <番号>` と書く。この文に `bun src/cli.ts` は無い。「公開後の起動」は `bunx @paterapatera/sdd-cur install` と `bunx @paterapatera/sdd-cur run` と、パスが通ったあとの `sdd-cur install` と `sdd-cur run` を書く。入れ方は `bun add -g @paterapatera/sdd-cur` と書く。README は、スキルが CLI を `sdd-cur` コマンドで呼ぶ、と書く。その `sdd-cur` コマンドによる呼び出しは、このリポジトリ以外のプロジェクトでも動く、と書く。

## REQ-831

もとになった課題は #115 である。

この課題で README のコマンド表記を確かめるテストは `src/115.test.ts` に書く。`src/docs.test.ts` は、README の「開発中の起動」を `bun src/cli.ts` の全サブコマンドとして `src/cli.ts` と比べない。

## REQ-844

もとになった課題は #120 である。

方針ファイルの構成にある `src/cli.ts` の行へ、`prepare-branch` というサブコマンド名が入っている。

## REQ-845

もとになった課題は #120 である。

`prepare-branch` の起動例 `bun src/cli.ts prepare-branch <番号>` は、`AGENTS.md` のコマンドの節にある。

## REQ-860

もとになった課題は #117 である。

`AGENTS.md` の着手前に読むものは、`skills/sdd-cur/conventions.md` と、`docs/conventions.md` に残した書き方の節である。書き方の節の本文は、`AGENTS.md` に書かない。`docs/policy.md` の構成表は、仕組みの約束の置き場所を `skills/sdd-cur/conventions.md` として書く。同じ構成表は、文「スキル、サブエージェント、テストの書き方は、このファイルを読む。」を残す。この文の指すファイルは、書き方の節を残した `docs/conventions.md` である。

## REQ-873

もとになった課題は #121 である。

表は `docs/policy.md` にあり、`tasks` が `src/cli.ts` の説明行へ載る。

## REQ-874

もとになった課題は #121 である。

`AGENTS.md` がコマンドの例として示すものの一つが、`bun src/cli.ts tasks <番号>` である。

## REQ-888

もとになった課題は #118 である。

README は、導入の順が `install`、`init`、`labels` である、と書く。

## REQ-889

もとになった課題は #118 である。

README の「開発中の起動」のコードフェンスと、そのあとのスキル呼び出し分の表に、`init` は無い。

## REQ-890

もとになった課題は #118 である。

`docs/policy.md` の構成の表の `src/cli.ts` の行は、バッククォートで囲んだ `init` を含む。その行のバッククォートで囲んだサブコマンド名の集合は、`src/cli.ts` の `switch` の `case` の名前の集合と一致する。

## REQ-891

もとになった課題は #118 である。

`AGENTS.md` の「コマンド」のコードフェンスに、`bun src/cli.ts init [project-root]` の行がある。そのフェンスの `bun src/cli.ts` の行から取れるサブコマンド名の集合は、`src/cli.ts` の `switch` の `case` の名前の集合と一致する。

## REQ-885

もとになった課題は #123 である。

`spec-diff` という名前は、方針の構成表で CLI 入口の行にバッククォートで出る。方針は `docs/policy.md`。

## REQ-886

もとになった課題は #123 である。

`AGENTS.md` の「コマンド」の例に、行全体が `bun src/cli.ts spec-diff <番号>` である行がある。
