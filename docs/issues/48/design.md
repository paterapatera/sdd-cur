# 48 完了の指定だけで完了処理に届く

対象は [Issue #48](https://github.com/paterapatera/sdd-cur/issues/48)。完了スキルと、`complete` の呼び出し元である。人が完了を指定したときに、作業ツリーに `sdd-cur.completion` が無くても `completeIssue` まで届く。

重なる課題は #25（`sdd-cur.completion` の廃止）である。この課題では、そのファイルを廃止しない。

計画の未決の 2 項目目（どちらから呼ぶか）は残す。課題ランナーと `sdd-cur.completion` の関係は、設計 7 のままである。

## 受け入れ条件

- 人が完了を指定したとき、作業ツリーに `sdd-cur.completion` が無くても、`completeIssue` が呼ばれる。
- 完了スキルは `sdd-cur.completion` を作らない。
- 完了スキル `sdd-cur-complete` の description は、人が指定した課題の完了処理を行う旨である。
- 完了スキル `sdd-cur-complete` の description に、呼び出し元ファイルの条件は無い。
- 中身が `runner` のとき、`complete` は `完了は課題ランナーが行います` で拒否し、GitHub は呼ばない。
- ファイルが無いとき、課題ランナーは完了処理をしない。
- `bun test` は `gh`、`git`、`agent` を起動しない。

## 範囲外

次は作らない。

- 計画の未決の 1 項目目（受け入れ不合格のラベル）
- 課題を閉じること。`issue close` と `--state` は付けない
- 計画の未決の 2 項目目を決めること。このリポジトリに `sdd-cur.completion` を置くこと。課題ランナーと完了スキルのどちらをこのプロジェクトで有効にするかは決めない
- 課題ランナーとファイルの関係の変更。`run` がループの前に `readCompletionCaller` を読むこと、`completionCaller` が `"runner"` のときだけ「動作確認OK」の完了へ進むことは、設計 7 のままである
- `readCompletionCaller` と `parseCompletionCaller`。ファイルが無いときの戻り値は `null` のままである。不正な中身の拒否は `完了の呼び出し元が不正です` のままである
- `completeIssue` の処理順、スカッシュマージ、ラベル。設計 7 と設計 18 のままである
- `sdd-cur.completion` の廃止（#25）
- 完了スキルが `sdd-cur.completion` を作ること。禁止は維持する
- 完了スキルの本文。`## 完了` と `## 禁止` は変えない。`name` は変えない。`disable-model-invocation` は足さない
- `skills/sdd-cur/SKILL.md` と `skills/sdd-cur-implement/SKILL.md`
- `src/complete.ts`、`src/runner.ts`、`src/run.ts`、`src/github.ts`、`src/sdd.ts` の変更
- `complete` の使い方の行、引数の数、番号の検証。設計 7 のままである
- `src/runner.test.ts` の期待の変更
- `docs/plan.md`、`docs/conventions.md`、AGENTS.md、設計 7 を含む既存の `design.md` と `requirements.md` の書き換え
- 課題の作成。ラベルの変更。受け入れ手順。確認コメント
- 依存パッケージ。トークンと環境変数の読み取り

## 決定

| 項目 | 内容 |
|---|---|
| 完了の指定 | 人が完了スキルで課題番号を指定すること。完了スキルは作業ツリーのルートで `bun src/cli.ts complete <番号>` を実行する。完了処理の中身は、このコマンドが行う |
| ファイルが無いとき | `complete` は `completeIssue` を一回呼ぶ |
| 中身が `skill` | 設計 7 のとおり、`complete` は `completeIssue` を一回呼ぶ |
| 中身が `runner` | 設計 7 のとおり、`complete` は拒否する。GitHub は呼ばない。課題ランナーだけが完了する |
| 読み取りの拒否 | 設計 7 のとおり、その理由で `complete` は拒否する。GitHub は呼ばない |
| 課題ランナー | ファイルが `runner` のときだけ完了する。無いときと `skill` のときは完了しない。設計 7 のままである |
| 未決の 2 | このプロジェクトでどちらを有効にするかは決めない。リポジトリに `sdd-cur.completion` は置かない |
| 完了スキルの禁止 | `sdd-cur.completion` を作らない。この禁止は維持する |
| description | `Project A の Cursor で、人が指定した課題の完了処理を行う。` 呼び出し元ファイルの条件は書かない |

一つのプロジェクトで課題ランナーと完了スキルを同時に有効にできないことは、設計 7 のままである。ファイルが `runner` のときは `complete` が拒否する。無いときと `skill` のときは、課題ランナーが完了しない。

## 変更箇所

### `complete`

変えるのは `src/cli.ts` の `cmdComplete` だけである。番号が正しいあと、作業ディレクトリで `readCompletionCaller` を呼ぶ。この読み取りは `resolveRepo` より前である。引数の数と番号の検証は、設計 7 のまま、読み取りより前である。

設計 7 の完了スキル節の表のうち、`null` の行を次に置き換える。

| 読み取り | すること |
|---|---|
| 拒否 | 設計 7 のまま。その理由を標準エラーへ一行書き、終了コード 1。GitHub は呼ばない |
| `null` | `"skill"` と同じ。`resolveRepo` と `createGitHub` のあと、`completeIssue` を一回呼ぶ |
| `"runner"` | 設計 7 のまま。`完了は課題ランナーが行います`。終了コード 1。GitHub は呼ばない |
| `"skill"` | 設計 7 のまま。`resolveRepo` と `createGitHub` のあと、`completeIssue` を一回呼ぶ |

`complete` は `完了の呼び出し元が未設定です` を書かない。

`completeIssue` が成功したときは、標準出力へ `完了しました: <番号>` を一行書き、終了コード 0 である。拒否したときは、その理由を標準エラーへ一行書き、終了コード 1 である。使い方は書かない。出力は、設計 7 の `"skill"` と同じである。

`src/cli.ts` の `run` は変えない。`null` を `createRunner` へ渡す。ファイルが無いとき、課題ランナーは完了処理をしない。

### 完了スキル

`skills/sdd-cur-complete/SKILL.md` の先頭は、次のフロントマターと一致する。`disable-model-invocation` は無い。

```yaml
---
name: sdd-cur-complete
description: Project A の Cursor で、人が指定した課題の完了処理を行う。
---
```

description は、人が指定した課題の完了処理を行う旨である。呼び出し元ファイルの条件は無い。現行の「作業ツリーの呼び出し元が skill のときに使う。」は書かない。

本文の最初の見出しは `# sdd-cur-complete` である。そのあとの `## 完了` と `## 禁止` の順と文言は変えない。禁止の `sdd-cur.completion` を作らない、は残す。完了スキルは、このファイルを作る手順を足さない。

### README

README のコマンド一覧のうち、`complete` の行だけを次の文に置き換える。`run` の行は変えない。

指定課題の完了処理を行う。作業ツリー直下の `sdd-cur.completion` が無いとき、および中身が `skill` のときは行う。中身が `runner` のときは拒否する。

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。

`src/cli.test.ts` の、`complete` の引数が無いときと `complete 01` の期待は、設計 7 のままである。子プロセスの作業ディレクトリは一時ディレクトリにし、`PATH` は `bun` のあるディレクトリだけにする。

- ファイルが無いディレクトリでの `complete 7` は、`gh を実行できません` であり、終了コード 1 である。`完了の呼び出し元が未設定です` ではない。この標準エラーは、設計 7 の `"skill"` の試験と同じく、呼び出し元の拒否で止まっていないことを示す。到達した先は、`resolveRepo` と `createGitHub` のあと `completeIssue` を一回呼ぶ分岐である。
- 中身が `runner` のときの `complete 7` は、`完了は課題ランナーが行います` であり、`gh を実行できません` ではない。
- 中身が `skill` のときの `complete 7` は、`gh を実行できません` であり、終了コード 1 である。

`src/complete.test.ts` のフロントマターの期待は、上の description と一致する。`作業ツリーの呼び出し元が skill のときに使う` は期待しない。`disable-model-invocation` が無いこと、二つの見出し、`bun src/cli.ts complete`、`課題を作らない`、`課題を閉じない`、`ラベルを変えない`、`スカッシュマージしない`、`コメントを投稿しない`、`gh を直接起動しない`、`sdd-cur.completion` を作らない、は残す。install が一時ディレクトリへコピーする確認は残す。

`readCompletionCaller` がファイルの無いディレクトリで `null` を返す試験は残す。`parseCompletionCaller` の試験は残す。`src/runner.test.ts` は変えない。`completionCaller` が `null` のとき、完了の探索をしない試験は設計 7 のまま残る。

## 作業の一覧

1. `src/cli.ts` の `cmdComplete` で、`null` を `"skill"` と同じ分岐にする。`完了の呼び出し元が未設定です` は書かない。
2. `skills/sdd-cur-complete/SKILL.md` の description を、上のフロントマターにする。本文は変えない。
3. `src/cli.test.ts` と `src/complete.test.ts` の期待を、上の試験に合わせる。
4. README の `complete` の行を、上の文に置き換える。
5. `bun test` を通す。`gh`、`git`、`agent` は起動しない。
