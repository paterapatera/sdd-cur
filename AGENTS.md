# エージェント向け

このリポジトリは `@paterapatera/sdd-cur` である。このプロジェクト専用の SDD スキルと課題ランナーを、Bun で直接実行する TypeScript として作る。

## 着手前に読むもの

1. [docs/plan.md](docs/plan.md)
2. 対象課題の `docs/specs/<番号>/design.md`

設計の受け入れ条件、決定、範囲の中で実装する。設計に書いた「範囲外」は作らない。設計が無い挙動は足さない。

課題を作るのは人である。SDD スキルも課題ランナーも、課題を作らない。課題は閉じない。お客さまの確認が取れてから、人が閉じる。

## 構成

| 場所 | 役割 |
|---|---|
| `src/cli.ts` | 入口。サブコマンドは `install`、`run`、`labels` |
| `src/install.ts` | `skills/<名前>/` を `~/.cursor/skills` または `<project>/.cursor/skills` へコピーする |
| `src/run.ts` | 停止まで `poll` と `process` を繰り返す。処理のあいだは次の `poll` を呼ばない |
| `src/runner.ts` | `poll` と `process`。ループの形はここを差し替えて保つ |
| `src/github.ts` | Issue の取得、コメント、ラベル、ブランチ、マージリクエスト、スカッシュマージ |
| `src/labels.ts` | 業務フロー用ラベル名と `ensureWorkflowLabels` |
| `skills/<名前>/` | `install` がコピーするスキル。直下のディレクトリだけが対象 |

GitHub の操作は `createGitHub` から呼ぶ。`gh` を子プロセスで起動し、認証は `gh` のログインに任せる。このモジュールはトークンも環境変数も読まない。

ラベルの変更は `issue edit` の `--add-label` と `--remove-label` だけである。`issue close` と `--state` は付けない。

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
bun test
```

依存パッケージは置かない。`package.json` の script 名は `install` にしない。開発時の script 名は `sdd-cur` と `test` である。

## コミット

依頼されたときだけコミットする。メッセージは [Conventional Commits](https://www.conventionalcommits.org/) にし、説明は日本語で書く。
