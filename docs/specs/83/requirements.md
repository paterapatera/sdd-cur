# 83 ドキュメントとスキルのずれを直し、ずれをテストで見つける

対象は [Issue #83](https://github.com/paterapatera/sdd-cur/issues/83)。README、`AGENTS.md`、`skills/*/SKILL.md`、`agents/*.md` の記述を、今の実装に揃える。同じ種類のずれが再び出たとき、`bun test` が失敗する。

重なる課題は #72（課題を作るスキル）と #75（パッケージの公開）である。

## 現状

`skills/` 直下のディレクトリは、次の六つである。

- `sdd-cur`
- `sdd-cur-implement`
- `sdd-cur-complete`
- `sdd-cur-quick`
- `sdd-cur-fix`
- `sdd-cur-create-issue`

`install` は、`skills/` 直下のディレクトリをすべてコピーする。

README は、`install` がコピーするスキルを `skills/sdd-cur`、`skills/sdd-cur-implement`、`skills/sdd-cur-complete` の三つと書いている。ディレクトリの図も、この三つだけを、`install` がコピーするスキルとして書いている。

`src/cli.ts` のサブコマンドは、`install`、`run`、`labels`、`candidates`、`show`、`branch`、`confirm`、`close`、`reflect`、`complete` である。

`AGENTS.md` の構成の表にあるサブコマンドの列挙に、`branch` が無い。`AGENTS.md` の「コマンド」にある `bun src/cli.ts` の例にも、`branch` が無い。`skills/sdd-cur/SKILL.md` は `bun src/cli.ts branch <番号>` を使う。README の「開発中の起動」にある `bun src/cli.ts` の例と、そのあとのコマンドの表に、`branch` と `close` が無い。これらの一覧には `bun test` もある。`bun test` は `src/cli.ts` のサブコマンドではない。

`AGENTS.md` は、SDD スキルも課題ランナーも課題を作らない、と書いている。人が明示して起動したときに課題を作る `skills/sdd-cur-create-issue` がある。

`skills/sdd-cur-quick/SKILL.md` だけが、上げたあとのモデルを `grok-4.7-high` と書く。ほかのスキルは、上げたあとのモデルを `grok-4.7[context=256k,reasoning_effort=high,fast=false]` と書く。要求作成と設計作成のサブエージェントの frontmatter の `model` も、この括弧の表記である。レビューのサブエージェントの frontmatter は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。修正のサブエージェントと実装作成の frontmatter は `composer-2.5[fast=false]` である。

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
