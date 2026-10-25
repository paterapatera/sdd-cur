# sdd-cur

誰のための道具か、技術の前提、構成、破ってはいけない原則の正本は [docs/policy.md](docs/policy.md) である。

課題の作成、要件、設計、お客さまへの確認は人が Cursor で行う。実装と、選んだ場合の完了処理は、課題ランナーが別のクローンで行う。

要件と設計の置き場所と課題コメントの約束は [docs/conventions.md](docs/conventions.md) にある。

任意で `docs/steering/<名前>.md` を `docs/steering/` 直下に置ける。`<名前>` は `docs/canonical/<領域>.md` の `<領域>` と同じ規則である。要求・設計・実装の作成役、修正役、レビュー役の十サブエージェントは、起動時に `docs/policy.md` を読んだあと、ディレクトリがあるときだけ `docs/steering/` 直下の `.md` をすべて読む。ディレクトリが無いときは読まずに進む。食い違うときは `docs/policy.md` を優先する。レビュー役は、`docs/policy.md` と `docs/steering/` 直下の `.md` の食い違いを指摘する。

## 他のプロジェクトで使う

1. `bun add -g @paterapatera/sdd-cur`
2. プロジェクトのルートで `sdd-cur setup` を実行する。
3. Cursor で `sdd-cur-policy` を起動し、`docs/policy.md` の下書きを作る。
4. `sdd-cur-create-issue` で課題を作り、`sdd-cur` で要件と設計を進める。
5. ランナー用に別のディレクトリへクローンし、そこで `sdd-cur run` を動かす。
6. 課題の担当者を、ランナーの `gh` のログインにする。

## 前提

技術の前提は [docs/policy.md](docs/policy.md) の「技術の前提」にある。

## 開発中の起動

公開前は、このリポジトリで次を実行する。

スキルが CLI を `sdd-cur` コマンドで呼ぶ。

その `sdd-cur` コマンドによる呼び出しは、このリポジトリ以外のプロジェクトでも動く。

```sh
bunx @paterapatera/sdd-cur candidates
bunx @paterapatera/sdd-cur show <番号>
bunx @paterapatera/sdd-cur branch <番号>
bunx @paterapatera/sdd-cur validate <番号>
bunx @paterapatera/sdd-cur confirm <番号>
bunx @paterapatera/sdd-cur reflect <番号> <requirements|design>
bunx @paterapatera/sdd-cur review-next requirements <番号>
bunx @paterapatera/sdd-cur review-next reflect-design <番号>
bunx @paterapatera/sdd-cur review-next quick <番号>
bunx @paterapatera/sdd-cur review-next implement <番号>
bunx @paterapatera/sdd-cur complete <番号>
bunx @paterapatera/sdd-cur close <番号>
bunx @paterapatera/sdd-cur spec-apply <番号>
bun test
```

パスが通ったあとは、同じサブコマンドを次で呼ぶ。

```sh
sdd-cur candidates
sdd-cur show <番号>
sdd-cur branch <番号>
sdd-cur validate <番号>
sdd-cur confirm <番号>
sdd-cur reflect <番号> <requirements|design>
sdd-cur review-next requirements <番号>
sdd-cur review-next reflect-design <番号>
sdd-cur review-next quick <番号>
sdd-cur review-next implement <番号>
sdd-cur complete <番号>
sdd-cur close <番号>
```

| コマンド | すること |
|---|---|
| `candidates` | 着手候補の課題を JSON で一行出力する |
| `show` | 課題と仕様の状態を JSON で一行出力する |
| `branch` | 作業ブランチ名 `task-<番号>` を一行出力する |
| `confirm` | 承認した確認本文を標準入力から受け取り、課題にコメントする |
| `close` | 標準入力の本文を課題にコメントし、課題を閉じる |
| `reflect` | 取り込み先の全文を標準入力から受け取り、未反映の回答を一件記録する |
| `validate` | 指定課題の要件と設計の形式を検査する |
| `complete` | 指定課題の完了処理を行う。作業ツリーの `sdd-cur.completion` は読まない。 |
| `review-next` | レビュー応答と連続不合格と直前の指摘から、次の動作を JSON 一行で返す |
| `bun test` | テスト。`gh` は起動しない |

使い方は `sdd-cur --help` と `bunx @paterapatera/sdd-cur --help` で標準エラーへ出る。

## 公開後の起動

パッケージ名は `@paterapatera/sdd-cur`、実行ファイル名は `sdd-cur` である。

入れ方は `bun add -g @paterapatera/sdd-cur` である。

```sh
bunx @paterapatera/sdd-cur install [project-root]
bunx @paterapatera/sdd-cur run [--interval-min <分>]
```

パスへ入ったあとは `sdd-cur install` と `sdd-cur run` で同じ入口を呼ぶ。

導入の順は `install`、`init`、`labels` である。`sdd-cur doctor` は導入の前提を一つずつ確かめるコマンドである。`doctor` は `docs/steering/` があるとき、名前の規則に合わないファイルを一行ずつ知らせる。

`install` は、コピーしたスキルが無いときも成功し、宛先の絶対パスを標準出力へ書く。`install` がコピーするスキルは `skills/sdd-cur`、`skills/sdd-cur-complete`、`skills/sdd-cur-create-issue`、`skills/sdd-cur-fix`、`skills/sdd-cur-implement`、`skills/sdd-cur-policy`、`skills/sdd-cur-quick`、`skills/sdd-cur-steering` である。

`install` は、`skills/` 直下の各スキルディレクトリと、`agents/<名前>.md` の十一個をコピーする。引数を省くと `~/.cursor/skills` と `~/.cursor/agents`。プロジェクトのルートを一つ渡すと `<root>/.cursor/skills` と `<root>/.cursor/agents`。`--high-model`、`--medium-model`、`--low-model` で三種類を指定し、high は `sdd-cur-req-author` と `sdd-cur-design-author` と `sdd-cur-req-reviewer-high`、medium は `sdd-cur-req-reviewer` と `sdd-cur-design-reviewer` と `sdd-cur-implement-reviewer`、low は `sdd-cur-implement-author` と `sdd-cur-req-fixer` と `sdd-cur-design-fixer` と `sdd-cur-implement-fixer` と `sdd-cur-explore` のコピー先の `model:` に反映できる。

## 役割

| もの | 動く場所 | 役割 |
|---|---|---|
| SDD スキル | 人が開いている Project A の Cursor | 着手する課題の提案、調べるだけの段、要件、設計、回答の取り込み、完了処理 |
| 課題ランナー | Project A をクローンしたディレクトリ | 「実装依頼」の実装、「動作確認OK」の完了処理 |

課題を作るのは人である。SDD スキルも課題ランナーも、課題は作らない。課題ランナーは Project A の作業ディレクトリでは動かさない。クローンは複数でよく、別の課題を同時に実装できる。

人は Project A で、`sdd-cur request <番号>` で作業ブランチを push してから「実装依頼」を付ける。クローンはその push を含むリモートから作業する。

## ラベル

ラベルは次の順に進む。課題を閉じる原則は [docs/policy.md](docs/policy.md) の「破ってはいけない原則」にある。

| ラベル | 付ける主体 | 意味 |
|---|---|---|
| 実装依頼 | 人 | 設計が終わり、実装してよい |
| 実装中 | 課題ランナー | 実装を始めた |
| 実装完了 | 課題ランナー | 実装が終わり、受け入れ手順がコメントにある |
| 動作確認OK | 人 | 受け入れテストに合格した |
| マージ済み | 完了処理 | スカッシュマージと同時に付ける |
| コンフリクト | 課題ランナーと完了処理 | 取り込みがコンフリクトした |

完了処理は、スカッシュマージの前にリモートの最新のデフォルトブランチを作業ブランチへマージして push し、そのあとマージリクエストのスカッシュマージと「マージ済み」ラベルの付与である。課題ランナーと、承認のあとの `complete` が行う。

## ディレクトリ

構成の正本は [docs/policy.md](docs/policy.md) の「構成」にある。正本の表にあるパスは、ここには繰り返さない。

```
docs/issues/<番号>/    課題ごとの要件と設計
package.json
agents/               install がコピーするサブエージェント。要求・設計・実装の作成、レビュー、修正と、調べるだけの sdd-cur-explore
src/*.test.ts
skills/sdd-cur/               install がコピーする SDD スキル
skills/sdd-cur-complete/      install がコピーする完了スキル
skills/sdd-cur-create-issue/  install がコピーする課題作成スキル
skills/sdd-cur-fix/           install がコピーする修正スキル
skills/sdd-cur-implement/     install がコピーする実装スキル
skills/sdd-cur-policy/        install がコピーする方針の下書きのスキル
skills/sdd-cur-quick/         install がコピーする quick のスキル
skills/sdd-cur-steering/      install がコピーする steering の下書きのスキル（docs/steering/structure.md と docs/steering/terms.md）
```

設計は `docs/issues/<番号>/design.md` に置く。実装済みの設計は [パッケージ骨格](docs/issues/1/design.md)、[GitHub 接続](docs/issues/2/design.md)、[業務ラベル](docs/issues/3/design.md)、[specs とコメント種別](docs/issues/4/design.md)、[SDD スキル](docs/issues/5/design.md)、[課題ランナー](docs/issues/6/design.md)、[完了処理](docs/issues/7/design.md) である。
