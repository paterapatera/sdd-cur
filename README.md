# sdd-cur

`@paterapatera/sdd-cur` は、このプロジェクト専用の SDD スキルと課題ランナーである。課題の作成、要件、設計、お客さまへの確認は人が Cursor で行う。実装と、選んだ場合の完了処理は、課題ランナーが別のクローンで行う。

計画の全文は [docs/plan.md](docs/plan.md) にある。要件と設計の置き場所と課題コメントの約束は [docs/conventions.md](docs/conventions.md) にある。

## 前提

- [Bun](https://bun.sh)
- GitHub を操作するときは、ログイン済みの [`gh`](https://cli.github.com/)

依存パッケージは置かない。TypeScript は Bun が直接実行する。

## 開発中の起動

公開前は、このリポジトリで次を実行する。

```sh
bun src/cli.ts install [project-root]
bun src/cli.ts run [--interval-min <1 以上 1440 以下の整数>]
bun src/cli.ts labels
bun src/cli.ts candidates
bun src/cli.ts show <番号>
bun src/cli.ts confirm <番号>
bun src/cli.ts reflect <番号> <requirements|design>
bun src/cli.ts complete <番号>
bun test
```

| コマンド | すること |
|---|---|
| `install` | `skills/` 直下の各スキルディレクトリと、`agents/<名前>.md` の九つをコピーする。引数を省くと `~/.cursor/skills` と `~/.cursor/agents`。プロジェクトのルートを一つ渡すと `<root>/.cursor/skills` と `<root>/.cursor/agents` |
| `run` | SIGINT または SIGTERM まで、「実装依頼」を探して「実装完了」まで行う。作業ツリー直下の `sdd-cur.completion` が `runner` のときは、「動作確認OK」の完了処理も行う。処理のあいだは次の課題を取らない。間隔の既定は 1 分 |
| `labels` | 作業ツリーのリポジトリに、計画の五つの業務ラベルを作る。無いものだけ作る |
| `candidates` | 着手候補の課題を JSON で一行出力する |
| `show` | 課題と仕様の状態を JSON で一行出力する |
| `confirm` | 承認した確認本文を標準入力から受け取り、課題にコメントする |
| `reflect` | 取り込み先の全文を標準入力から受け取り、未反映の回答を一件記録する |
| `complete` | 作業ツリー直下の `sdd-cur.completion` が `skill` のとき、指定課題の完了処理を行う |
| `bun test` | テスト。`gh` は起動しない |

`install` は、コピーしたスキルが無いときも成功し、宛先の絶対パスを標準出力へ書く。`install` がコピーするスキルは `skills/sdd-cur`、`skills/sdd-cur-implement`、`skills/sdd-cur-complete` である。

使い方は `bun src/cli.ts --help` で標準エラーへ出る。

## 公開後の起動

パッケージ名は `@paterapatera/sdd-cur`、実行ファイル名は `sdd-cur` である。

```sh
bunx @paterapatera/sdd-cur install [project-root]
bunx @paterapatera/sdd-cur run [--interval-min <分>]
```

パスへ入ったあとは `sdd-cur install` と `sdd-cur run` で同じ入口を呼ぶ。

## 役割

| もの | 動く場所 | 役割 |
|---|---|---|
| SDD スキル | 人が開いている Project A の Cursor | 着手する課題の提案、要件、設計、回答の取り込み、完了処理 |
| 課題ランナー | Project A をクローンしたディレクトリ | 「実装依頼」の実装、「動作確認OK」の完了処理 |

課題を作るのは人である。SDD スキルも課題ランナーも、課題は作らない。課題ランナーは Project A の作業ディレクトリでは動かさない。クローンは複数でよく、別の課題を同時に実装できる。

人が Project A で書いた `docs/specs` をリモートへ push してから、課題に「実装依頼」を付ける。クローンはその push を含むリモートから作業する。

## ラベル

ラベルは次の順に進む。課題は閉じない。お客さまの確認が取れてから、人が閉じる。

| ラベル | 付ける主体 | 意味 |
|---|---|---|
| 実装依頼 | 人 | 設計が終わり、実装してよい |
| 実装中 | 課題ランナー | 実装を始めた |
| 実装完了 | 課題ランナー | 実装が終わり、受け入れ手順がコメントにある |
| 動作確認OK | 人 | 受け入れテストに合格した |
| マージ済み | 完了処理 | スカッシュマージと同時に付ける |

完了処理は、マージリクエストのスカッシュマージと「マージ済み」ラベルの付与である。呼ぶ場所は、課題ランナーと、Cursor の SDD スキルのどちらか一つである。

## ディレクトリ

```
docs/plan.md          計画
docs/conventions.md   要件・設計の置き場所と課題コメントの約束
docs/specs/<番号>/    課題ごとの要件と設計
package.json
src/cli.ts            install、run、labels、SDD サブコマンドの入口
src/install.ts        スキルとサブエージェントのコピー
agents/               install がコピーする要求・設計・実装レビュー用サブエージェント
src/run.ts            ポーリングのループ
src/runner.ts         poll と process（実装依頼から実装完了）
src/git.ts            クローン上の git 操作
src/agent.ts          Cursor agent の起動
src/github.ts         GitHub Issue と GitHub
src/labels.ts         業務フロー用ラベル
src/conventions.ts    specs パスと課題コメントの判定
src/sdd.ts            SDD スキル用の判定と投稿
src/complete.ts       完了処理と呼び出し元の読み取り
src/*.test.ts
skills/sdd-cur/       install がコピーする SDD スキル
skills/sdd-cur-implement/  install がコピーする実装スキル
skills/sdd-cur-complete/   install がコピーする完了スキル
```

設計は `docs/specs/<番号>/design.md` に置く。実装済みの設計は [パッケージ骨格](docs/specs/1/design.md)、[GitHub 接続](docs/specs/2/design.md)、[業務ラベル](docs/specs/3/design.md)、[specs とコメント種別](docs/specs/4/design.md)、[SDD スキル](docs/specs/5/design.md)、[課題ランナー](docs/specs/6/design.md)、[完了処理](docs/specs/7/design.md) である。
