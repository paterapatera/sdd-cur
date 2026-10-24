# 方針

このファイルが、誰のための道具か、技術の前提、構成、破ってはいけない原則の正本である。このファイルを変えるのは、課題を通したときだけである。

## 誰のための道具か

このリポジトリは `@paterapatera/sdd-cur` である。このプロジェクト専用の SDD スキルと課題ランナーである。

## 技術の前提

SDD スキルと課題ランナーは、Bun で直接実行する TypeScript として作る。依存パッケージは置かない。

GitHub の操作は `createGitHub` から呼ぶ。`gh` を子プロセスで起動し、認証は `gh` のログインに任せる。このモジュールはトークンも環境変数も読まない。

利用者向けのメッセージ、ドキュメント、コミットメッセージの説明は日本語で書く。識別子は英語にする。失敗の理由は日本語の一行にし、`Error` で返す。

## 構成

| 場所 | 役割 |
|---|---|
| `src/cli.ts` | 入口。サブコマンドは `install`、`init`、`doctor`、`run`、`labels`、`candidates`、`show`、`branch`、`prepare-branch`、`confirm`、`close`、`reflect`、`validate`、`complete`、`restore`、`review-next`、`request`、`spec-check`、`tasks`、`spec-diff` |
| `src/doctor.ts` | 導入の前提を検査する |
| `src/spec.ts` | `docs/canonical/` 直下の要求について、近い本文、壊れた文末、空の本文、識別子の重複を検査する |
| `src/install.ts` | `skills/<名前>/` を `~/.cursor/skills` または `<project>/.cursor/skills` へ、`agents/<名前>.md` を `~/.cursor/agents` または `<project>/.cursor/agents` へコピーする |
| `src/run.ts` | 停止まで `poll` と `process` を繰り返す。処理のあいだは次の `poll` を呼ばない |
| `src/runner.ts` | `poll` と `process`。`run` が「実装依頼」から「実装完了」までと、「動作確認OK」の完了を、このファイルを読まずに行う |
| `src/complete.ts` | `completeIssue` |
| `src/git.ts` | クローン上の git 操作 |
| `src/agent.ts` | Cursor `agent` の起動 |
| `src/github.ts` | Issue の取得、コメント、ラベル、ブランチ、マージリクエスト、スカッシュマージ |
| `src/labels.ts` | 業務フロー用ラベル名と `ensureWorkflowLabels` |
| `docs/policy.md` | 誰のための道具か、技術の前提、構成、破ってはいけない原則の正本 |
| `docs/conventions.md` | スキル、サブエージェント、テストの書き方は、このファイルを読む。 |
| `skills/sdd-cur/conventions.md` | 要件・設計の置き場所と課題コメントの約束。 |
| `src/conventions.ts` | 上記約束の判定（パス、種別、対応、反映済み、未反映） |
| `src/sdd.ts` | SDD スキル用の候補、表示、確認投稿、回答の反映 |
| `skills/<名前>/` | `install` がコピーするスキル。直下のディレクトリだけが対象 |

## 破ってはいけない原則

人が明示して起動したときに、`skills/sdd-cur-create-issue` が課題を作る。課題ランナーは課題を作らない。人が閉じるを選んだときに SDD スキルが閉じる場合を除き、課題は閉じない。課題ランナーは課題を閉じない。お客さまの確認が取れてから、人が閉じる。

設計に書いた「範囲外」は作らない。設計が無い挙動は足さない。

ラベルの変更は `issue edit` の `--add-label` と `--remove-label` だけである。`issue close` は、人が閉じるを選んだときに SDD スキルが課題を閉じる場合だけ付ける。課題ランナーは付けない。`--state` は付けない。
