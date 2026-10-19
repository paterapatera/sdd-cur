# エージェント向け

このリポジトリは `@paterapatera/sdd-cur` である。このプロジェクト専用の SDD スキルと課題ランナーを、Bun で直接実行する TypeScript として作る。

## 着手前に読むもの

1. [docs/conventions.md](docs/conventions.md)。スキル、サブエージェント、テストの書き方は、このファイルを読む。
2. 対象課題の `docs/specs/<番号>/design.md`

設計の受け入れ条件、決定、範囲の中で実装する。設計に書いた「範囲外」は作らない。設計が無い挙動は足さない。

人が明示して起動したときに、`skills/sdd-cur-create-issue` が課題を作る。課題ランナーは課題を作らない。人が閉じるを選んだときに SDD スキルが閉じる場合を除き、課題は閉じない。課題ランナーは課題を閉じない。お客さまの確認が取れてから、人が閉じる。

## 構成

| 場所 | 役割 |
|---|---|
| `src/cli.ts` | 入口。サブコマンドは `install`、`run`、`labels`、`candidates`、`show`、`branch`、`confirm`、`close`、`reflect`、`complete`、`restore` |
| `src/install.ts` | `skills/<名前>/` を `~/.cursor/skills` または `<project>/.cursor/skills` へ、`agents/<名前>.md` を `~/.cursor/agents` または `<project>/.cursor/agents` へコピーする |
| `src/run.ts` | 停止まで `poll` と `process` を繰り返す。処理のあいだは次の `poll` を呼ばない |
| `src/runner.ts` | `poll` と `process`。`run` が「実装依頼」から「実装完了」までと、「動作確認OK」の完了を、このファイルを読まずに行う |
| `src/complete.ts` | `completeIssue` |
| `src/git.ts` | クローン上の git 操作 |
| `src/agent.ts` | Cursor `agent` の起動 |
| `src/github.ts` | Issue の取得、コメント、ラベル、ブランチ、マージリクエスト、スカッシュマージ |
| `src/labels.ts` | 業務フロー用ラベル名と `ensureWorkflowLabels` |
| `docs/conventions.md` | 要件・設計の置き場所と課題コメントの約束。スキル、サブエージェント、テストの書き方は、このファイルを読む。 |
| `src/conventions.ts` | 上記約束の判定（パス、種別、対応、反映済み、未反映） |
| `src/sdd.ts` | SDD スキル用の候補、表示、確認投稿、回答の反映 |
| `skills/<名前>/` | `install` がコピーするスキル。直下のディレクトリだけが対象 |

GitHub の操作は `createGitHub` から呼ぶ。`gh` を子プロセスで起動し、認証は `gh` のログインに任せる。このモジュールはトークンも環境変数も読まない。

ラベルの変更は `issue edit` の `--add-label` と `--remove-label` だけである。`issue close` は、人が閉じるを選んだときに SDD スキルが課題を閉じる場合だけ付ける。課題ランナーは付けない。`--state` は付けない。

## 文言

利用者向けのメッセージ、ドキュメント、コミットメッセージの説明は日本語で書く。識別子は英語にする。失敗の理由は日本語の一行にし、`Error` で返す。

## テスト

```sh
bun test
```

- テストは `src/*.test.ts` に置き、`bun:test` の `describe` と `test` を使う。
- `gh` は起動しない。`GhRunner` を注入し、引数と標準入力を記録する。
- ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。
- 設計の「テスト」節にある項目を、その節の期待どおりに確認する。

## コマンド

```sh
bun src/cli.ts install [project-root]
bun src/cli.ts run [--interval-min <1 以上 1440 以下の整数>]
bun src/cli.ts labels
bun src/cli.ts candidates
bun src/cli.ts show <番号>
bun src/cli.ts branch <番号>
bun src/cli.ts confirm <番号>
bun src/cli.ts close <番号>
bun src/cli.ts reflect <番号> <requirements|design>
bun src/cli.ts complete <番号>
bun src/cli.ts restore <番号>
bun test
```

依存パッケージは置かない。`package.json` の script 名は `install` にしない。開発時の script 名は `sdd-cur` と `test` である。

## コミット

依頼されたときだけコミットする。メッセージは [Conventional Commits](https://www.conventionalcommits.org/) にし、説明は日本語で書く。
