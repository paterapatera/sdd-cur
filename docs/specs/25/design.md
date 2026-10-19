# 25 sdd-cur.completion を廃止する

対象は [Issue #25](https://github.com/paterapatera/sdd-cur/issues/25)。`sdd-cur.completion` を廃止する。このファイルが無くても、スキルとランナーは動く。

分割元は #16 である。

重なる課題は #48（完了の指定だけで完了処理に届く）である。#48 はファイルを廃止しない。ファイルが無いとき、`complete` が `completeIssue` に届くことだけが似る。この課題はファイルを廃止し、中身が `runner` か `skill` か未設定かで経路を分けない。ファイルが無いときの `complete` の到達は #48 と同じで、番号が正しいあと `resolveRepo` と `createGitHub` を行い、`completeIssue` を一回呼ぶ。中身が `runner` のときの拒否は残さない。課題ランナーがファイル無しで「動作確認OK」の完了を行うことは、#48 の範囲外であり、この課題の要件である。

## 受け入れ条件

- `sdd-cur.completion` を廃止する。
- 中身が `runner` か `skill` か未設定かで経路を分ける仕組みを無くす。
- スキルとランナーは、このファイルを読まない。
- ファイルがあっても、中身では経路を分けない。
- ファイルが無いことを理由に失敗しない。
- SDD スキル（着手・要件・設計・確認・反映など）は、このファイル無しで行う。
- 完了スキルは、このファイルを読まない。
- 承認のあと、complete が完了処理へ進む。
- ランナーは、「実装依頼」から「実装完了」までを、このファイル無しで行う。
- ランナーは、「動作確認OK」の完了処理を、このファイル無しで行う。
- `bun test` は `gh`、`git`、`agent` を起動しない。

## 範囲外

次は作らない。

- 課題の作成とクローズ。`issue close` と `--state` は付けない
- Forgejo、Jira、Backlog
- `completeIssue` の処理順、スカッシュマージ、ラベル。設計 7 と設計 18 のままである
- `selectCompletionIssue` の引数と選び方
- `poll` の優先順。実装依頼、未処理の不具合、quick、「動作確認OK」の順は、現行の `src/runner.ts` のままである。外すのは、最後の段の `completionCaller` の条件だけである
- 完了スキルの承認ゲート。`## 完了` と `## 禁止` の文言は変えない。`sdd-cur.completion` を作らない、は残す
- `disable-model-invocation`。現行の完了スキルにある `true` は残す
- `skills/sdd-cur/SKILL.md` と `skills/sdd-cur-implement/SKILL.md`
- `src/run.ts` のループ、`src/github.ts`、`src/sdd.ts`、`src/git.ts`、`src/agent.ts`、`src/install.ts`、`src/labels.ts`、`src/conventions.ts`
- `complete` の使い方の行、引数の数、番号の検証。設計 7 のまま、読み取りより前である
- ランナーと `complete` が同じ課題を同時に完了するときの、新しい排他
- 実行時に作業ツリーの `sdd-cur.completion` を削除すること。読まない
- `docs/plan.md`、`docs/conventions.md`、設計 7 と設計 48 を含む既存の `design.md` と `requirements.md` の書き換え
- 課題の作成。ラベルの変更。受け入れ手順。確認コメント
- 依存パッケージ。トークンと環境変数の読み取り

## 決定

| 項目 | 内容 |
|---|---|
| 廃止 | 作業ツリー直下の `sdd-cur.completion` を、経路の切り替えに使わない。リポジトリ直下のこのファイルは削除する。実行時に作らない |
| 読み取り | `run`、`complete`、課題ランナー、SDD スキル、完了スキルは、このファイルを読まない |
| ファイルが無い | 失敗理由にしない。`run` はループへ進む。`complete` は `completeIssue` を一回呼ぶ |
| ファイルがある | 中身が `runner`、`skill`、それ以外、ディレクトリのいずれでも、経路を分けない。`完了の呼び出し元が不正です`、`完了の呼び出し元が未設定です`、`完了は課題ランナーが行います` は書かない |
| 呼び出し元の型 | `completionCallerFileName`、`CompletionCaller`、`parseCompletionCaller`、`readCompletionCaller` を無くす。`createRunner` の依存から `completionCaller` を外す |
| 課題ランナー | ファイル無しで、「実装依頼」から「実装完了」までを行う。前段が空のときは「動作確認OK」を探し、`completeIssue` を一回呼ぶ |
| 完了スキル | ファイルを読まない。作らない。承認のあと、作業ツリーのルートで `bun src/cli.ts complete <番号>` を実行する。完了処理の中身は、このコマンドが行う |
| SDD スキル | 着手、要件、設計、確認、反映は、このファイルを読まずに行う。手順は変えない |
| 同時の完了 | 課題ランナーと `complete` の両方が完了処理を行う。ファイルでどちらか一方に限らない。同時に呼ばれたときの処理は、既存の `completeIssue` のままである |

## 変更するモジュール

### `src/complete.ts`

`selectCompletionIssue` と `completeIssue` は残す。処理順は変えない。

次を削除する。

- `completionCallerFileName`
- `CompletionCaller`
- `parseCompletionCaller`
- `readCompletionCaller`
- `完了の呼び出し元が不正です`

ファイルの `stat` と `readFile` は、この読み取りにだけ使っている。読み取りを削除したあとは import しない。

### 課題ランナー

`src/runner.ts` の `createRunner` は `completionCaller` を受け取らない。`src/cli.ts` の `run` は、ループの前に `readCompletionCaller` を呼ばない。作業ディレクトリにファイルが無くても、あっても、`resolveRepo` へ進む。読み取りの失敗では終わらない。

`poll` の順は、現行のままである。先に仕事が返った時点で、後は呼ばない。

1. `labels: ["実装依頼"]`、assignee、limit 100 で `listIssues` し、`selectImplementationIssue` する。
2. `findFixWorkItem` で未処理の不具合を探す。
3. `state: "open"`、assignee、limit 100 で `listIssues` し、`selectQuickIssue` する。
4. 1 から 3 が空のときは、`listIssues({ labels: ["動作確認OK"], assignee: login, limit: 100 })` を呼び、`selectCompletionIssue` にその配列と login を渡す。`state` は渡さない。`viewerLogin` は、この `poll` で既に一回終わっている。もう一度は呼ばない。

4 は、ファイルの有無と中身にかかわらず行う。結果が無ければ `null` である。

`process` の分岐の順は、現行のままである。

1. `id` が番号でなければ `番号が不正です`。
2. `getIssue`。
3. 「実装依頼」があり「実装中」が無いときは、`runImplementation` である。`completeIssue` は呼ばない。
4. `issueHasFixLabels` のときは、不具合修正である。
5. 開いていて、業務ラベルが無く、assignees に `viewerLogin` が含まれ、`isQuickTarget` が true のときは、quick である。
6. ラベルに「動作確認OK」があるときは、`completeIssue` を一回呼ぶ。`git`、`agent`、`addComment` は呼ばない。`completeIssue` が拒否したときは、その理由で `process` が拒否する。ランナーは `completeIssue` の外側ではやり直さない。
7. どれでもないときは、何もせず戻る。

6 は、ファイルの有無と中身にかかわらず行う。

### `complete`

変えるのは `src/cli.ts` の `cmdComplete` である。引数の数と番号の検証は、設計 7 のまま、そのあとの処理より前である。

番号が正しいあと、作業ディレクトリの `sdd-cur.completion` は読まない。`resolveRepo` と `createGitHub` のあと、`completeIssue` を一回呼ぶ。ファイルが無いときと、中身が `runner`、`skill`、それ以外のときとで、分岐しない。

`completeIssue` が成功したときは、標準出力へ `完了しました: <番号>` を一行書き、終了コード 0 である。拒否したときは、その理由を標準エラーへ一行書き、終了コード 1 である。使い方は書かない。

### 完了スキル

`skills/sdd-cur-complete/SKILL.md` の description から、呼び出し元ファイルの条件を外す。先頭は、次のフロントマターと一致する。

```yaml
---
name: sdd-cur-complete
description: Project A の Cursor で、人が指定した課題の完了処理を行う。
disable-model-invocation: true
---
```

description は、人が指定した課題の完了処理を行う旨である。現行の「作業ツリーの呼び出し元が skill のときに使う。」は書かない。`name` と `disable-model-invocation` は変えない。

本文は変えない。最初の見出しは `# sdd-cur-complete` である。`## 完了` と `## 禁止` の順と文言は変えない。禁止の `sdd-cur.completion` を作らない、は残す。完了スキルは、このファイルを読む手順も、作る手順も足さない。承認のあとだけ `bun src/cli.ts complete <番号>` を実行する、は残す。

### SDD スキル

`skills/sdd-cur/SKILL.md` は変えない。着手、要件、設計、確認、反映の手順は、このファイルを読まない。`candidates`、`show`、`confirm`、`reflect` は、このファイルを読まない。ファイルが無いことを理由に失敗しない。

### README と AGENTS.md

README のコマンド一覧のうち、`run` の行を次の文に置き換える。

SIGINT または SIGTERM まで、「実装依頼」を探して「実装完了」まで行う。「動作確認OK」の完了処理も行う。処理のあいだは次の課題を取らない。間隔の既定は 1 分

`complete` の行を次の文に置き換える。

指定課題の完了処理を行う。作業ツリーの `sdd-cur.completion` は読まない。

役割の節の、完了処理を呼ぶ場所の文を次の文に置き換える。

完了処理は、マージリクエストのスカッシュマージと「マージ済み」ラベルの付与である。課題ランナーと、承認のあとの `complete` が行う。

ディレクトリ一覧の `src/runner.ts` は、実装依頼から実装完了までと、「動作確認OK」の完了を行う、とする。`src/complete.ts` は、完了処理、とする。呼び出し元の読み取りとは書かない。

AGENTS.md の構成のうち、`src/runner.ts` の行は、`run` が「実装依頼」から「実装完了」までと、「動作確認OK」の完了を、このファイルを読まずに行う、とする。`src/complete.ts` の行は、`completeIssue`、とする。呼び出し元ファイルの読み取りとは書かない。

### リポジトリのファイル

リポジトリ直下の `sdd-cur.completion` を削除する。現行の中身は `runner` である。この削除は、経路の切り替えを残さないためである。

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。

`src/complete.test.ts` から、`parseCompletionCaller` と `readCompletionCaller` の試験を削除する。`selectCompletionIssue` と `completeIssue` の試験は残す。

`src/cli.test.ts` の、`complete` の引数が無いときと `complete 01` の期待は、設計 7 のままである。子プロセスの作業ディレクトリは一時ディレクトリにし、`PATH` は `bun` のあるディレクトリだけにする。

- ファイルが無いディレクトリでの `complete 7` は、`gh を実行できません` であり、終了コード 1 である。`完了の呼び出し元が未設定です` ではない。
- 中身が `runner` のときの `complete 7` は、`gh を実行できません` であり、終了コード 1 である。`完了は課題ランナーが行います` ではない。
- 中身が `skill` のときの `complete 7` は、`gh を実行できません` であり、終了コード 1 である。
- 中身が `runner` でも `skill` でもないときの `complete 7` は、`gh を実行できません` であり、終了コード 1 である。`完了の呼び出し元が不正です` ではない。

この標準エラーは、設計 7 の `"skill"` の試験と同じく、呼び出し元の拒否で止まっていないことを示す。到達した先は、`resolveRepo` と `createGitHub` のあと `completeIssue` を一回呼ぶ分岐である。

`run` は、ファイルが無いディレクトリ、中身が `runner` のディレクトリ、中身が `skill` のディレクトリ、中身がどちらでもないディレクトリで、`gh を実行できません` であり、終了コード 1 である。`完了の呼び出し元が不正です` ではない。

`src/runner.test.ts` は、`createRunner` に `completionCaller` を渡さない。

- 実装依頼、未処理の不具合、quick が無いとき、`poll` は「動作確認OK」の `listIssues` を呼ぶ。候補があれば、その番号を返す。`viewerLogin` は一回である。
- 実装依頼があるとき、未処理の不具合があるとき、quick があるときは、その時点で返り、「動作確認OK」の `listIssues` は呼ばない。
- 「動作確認OK」だけの課題の `process` は、`completeIssue` を一回呼ぶ。`git`、`agent`、`addComment` は呼ばない。
- 「実装依頼」があり「実装中」が無い課題の `process` は、実装を行い、`completeIssue` は呼ばない。
- `completionCaller` が `null` または `skill` だから「動作確認OK」を探さない、という期待は捨てる。

`src/complete.test.ts` のフロントマターの期待は、上のフロントマターと一致する。`作業ツリーの呼び出し元が skill のときに使う` は期待しない。`disable-model-invocation` があること、二つの見出し、`bun src/cli.ts complete`、`課題を作らない`、`課題を閉じない`、`ラベルを変えない`、`スカッシュマージしない`、`コメントを投稿しない`、`gh を直接起動しない`、`sdd-cur.completion` を作らない、は残す。install が一時ディレクトリへコピーする確認は残す。

`skills/sdd-cur/SKILL.md` の既存の試験は残す。このファイル名を読む期待は足さない。

## 実装の順序

1. `src/complete.ts` から呼び出し元の読み取りを削除する。リポジトリ直下の `sdd-cur.completion` を削除する。
2. `src/runner.ts` の `completionCaller` を外し、前段が空のときは「動作確認OK」を探して `completeIssue` を呼ぶ。
3. `src/cli.ts` の `run` と `complete` から読み取りと、中身による分岐を外す。
4. `src/runner.test.ts`、`src/cli.test.ts`、`src/complete.test.ts` の期待を、上の試験に合わせる。
5. `skills/sdd-cur-complete/SKILL.md` の description を、上のフロントマターにする。本文は変えない。
6. README と AGENTS.md の、このファイルを経路に使う文を、上の文に置き換える。
7. `bun test` を通す。`gh`、`git`、`agent` は起動しない。
