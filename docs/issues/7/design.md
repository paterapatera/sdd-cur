# 7 完了処理の共通化と完了スキル

対象は [Issue #7](https://github.com/paterapatera/sdd-cur/issues/7)。完了処理を一つにし、課題ランナーと完了スキルの両方から呼ぶ。

## 受け入れ条件

- 課題ランナー経由と完了スキル経由の両方で、同じ `completeIssue` が動く。
- すでにマージ済みのマージリクエストは、もう一度マージしない。残っている「マージ済み」だけを揃える。
- 一つのプロジェクトで、課題ランナーと完了スキルを同時には有効にできない。
- 完了処理を終えた課題は、次の「動作確認OK」の探索から外れる。
- `bun test` は `gh`、`git`、`agent` を起動しない。

## 範囲外

次は作らない。

- 受け入れテストが不合格のときのラベルと、直す場所（計画の未決）
- このリポジトリに `sdd-cur.completion` を置くこと。このプロジェクトで有効にする呼び出し元は、計画の未決である
- 「動作確認OK」を付けること
- 「実装依頼」から「実装完了」までの手順。`poll` が実装を完了より先に取ることと、`process` が完了へ分岐することだけを足す
- 課題の作成とクローズ。`issue close` と `--state` は付けない
- `skills/sdd-cur/SKILL.md`。着手、要件、設計、確認、回答の取り込み
- `squashMerge` の引数と、マージを試みる成否判定。すでにマージ済みかを見るのは `completeIssue` である
- `src/run.ts` のループの形。`WorkItem` は `{ id: string }` のままである
- `src/conventions.ts`、`src/install.ts`、`src/labels.ts`、`src/sdd.ts`、`src/git.ts`、`src/agent.ts` の変更
- `docs/plan.md`、`docs/conventions.md`、課題 1〜6 の `design.md` の書き換え
- 完了時のコメント、ブランチの削除
- オープンな課題、およびヘッドが一致するマージリクエストの 101 件目以降
- Forgejo、Jira、Backlog
- 依存パッケージ。トークンと環境変数の読み取り。`git config` の変更
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| 完了処理 | `src/complete.ts` の `completeIssue` だけが、スカッシュマージと「マージ済み」を行う。ランナーも `complete` サブコマンドも、これを呼ぶ。どちらも `squashMerge` を直接呼ばない |
| 探索から外す | マージの結果が分かったあと、一回の `editLabels` で「動作確認OK」を外し、「マージ済み」を付ける。探索は「動作確認OK」のままである。外れた課題は次の探索に出ない。ラベルだけを揃えたときも、この `editLabels` で外す |
| 再マージしない | `listPullRequests` の結果の `merged` が true のときは `squashMerge` を呼ばない。false のときだけ呼ぶ |
| 課題は閉じない | ラベル変更は `editLabels` の追加と削除だけである |
| 呼び出し元 | 作業ツリー直下の `sdd-cur.completion`。中身は `runner` か `skill` の一方だけである。ファイルが無いときは未設定であり、どちらも完了処理をしない |
| ランナー | `runner` のときだけ、「実装依頼」が無いあとに「動作確認OK」を探す。`skill` と未設定のときは、設計 6 の探索のままである |
| 完了スキル | `skills/sdd-cur-complete/SKILL.md`。人が Project A で起動する。処理は `bun src/cli.ts complete <番号>` が行う |
| サブコマンド | `complete` は、呼び出し元が `skill` のときだけ `completeIssue` を呼ぶ。`runner` のときは拒否し、GitHub は呼ばない |
| マージリクエスト | ヘッドは `implementationBranch` の戻り値である。件数が 1 のときだけ、その番号を使う |
| 失敗 | 理由は一行である。`completeIssue` は、拒否した外部呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まり、成功した呼び出しはやり直さない |
| ラベル名 | `workflowLabels` の `name` だけを使う。別の字面で再定義しない |

ラベル名は、この表では課題の文言で書く。実装は `workflowLabels` から取る。

## 呼び出し元

ファイル名は `sdd-cur.completion` である。パスは、渡したディレクトリの直下である。この課題では、このリポジトリにファイルを作らない。

```ts
export const completionCallerFileName = "sdd-cur.completion"

export type CompletionCaller = "runner" | "skill"

export function parseCompletionCaller(text: string): CompletionCaller

export function readCompletionCaller(dir: string): Promise<CompletionCaller | null>
```

`parseCompletionCaller` は、前後の空白を除いた文字列が `runner` または `skill` のとき、その値を返す。それ以外は `完了の呼び出し元が不正です` で拒否する。空、`runner` と `skill` の両方、改行で二つを並べた文字列は、この拒否である。

`readCompletionCaller` は、ファイルが無いとき `null` を返す。読めたときは、その全文を `parseCompletionCaller` に渡す。ディレクトリである、または読めないときは `完了の呼び出し元が不正です` で拒否する。

未設定は、両方を有効にした状態ではない。`runner` と `skill` を同時に表す値は無い。

## 完了処理

```ts
export function selectCompletionIssue(issues: readonly Issue[]): Issue | null

export function completeIssue(
  github: {
    getIssue: GitHubClient["getIssue"]
    listPullRequests: GitHubClient["listPullRequests"]
    squashMerge: GitHubClient["squashMerge"]
    editLabels: GitHubClient["editLabels"]
  },
  issueNumber: number,
): Promise<void>
```

`selectCompletionIssue` は引数の配列を変えない。「動作確認OK」が無い課題を除く。残った配列を `number` の昇順で並べ、先頭を返す。空なら `null` である。ラベルの一致は完全一致である。「マージ済み」が付いていても、ここでは除かない。

`completeIssue` は、番号が 1 以上の安全な整数でないとき `番号が不正です` で拒否し、GitHub を呼ばない。

通過したときは次の順で、拒否した時点より後は呼ばない。

1. `getIssue`。
2. 「動作確認OK」が無いとき、「マージ済み」があれば何もせず戻る。「マージ済み」も無いときは `動作確認OKがありません` で拒否する。
3. ヘッドは `implementationBranch` の戻り値である。`listPullRequests({ head, limit: 100 })` を呼ぶ。0 件は `マージリクエストがありません`、2 件以上は `マージリクエストを特定できません` で拒否する。
4. 1 件の `merged` が true のときは `squashMerge` を呼ばない。false のときだけ、その番号で `squashMerge` を呼ぶ。
5. `editLabels` で「動作確認OK」を外し、「マージ済み」を付ける。追加と削除は一回にまとめる。

2 で戻るときは、`listPullRequests` も `squashMerge` も `editLabels` も呼ばない。4 で `squashMerge` を呼ばなかったときも、5 は行う。5 まで終わった課題は「動作確認OK」を持たない。

閉じているがマージされていないマージリクエストは、特別扱いしない。`squashMerge` が拒否したときは、その理由で止まり、5 は呼ばない。「動作確認OK」は残る。

`getIssue`、`listPullRequests`、`squashMerge`、`editLabels` は、拒否したときその呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まる。`squashMerge` が成功したあとに `editLabels` が二度拒否したときは、`squashMerge` は一回のままである。

`src/complete.ts` は `implementationBranch` を `src/runner.ts` から import する。`src/runner.ts` は `completeIssue` と `selectCompletionIssue` と `readCompletionCaller` を import する。モジュールの評価中には、これらの関数を呼ばない。

## マージリクエストの取得

`GitHubClient` に次を足す。既存の操作の引数は変えない。`squashMerge` の実装は変えない。

```ts
listPullRequests(query: { head: string; limit?: number }): Promise<PullRequest[]>
```

`head` はブランチ名の規則で拒否する。`limit` を省いたときは 100 である。1 未満または 100 を超えるときは、`listIssues` の `limit` と同じ理由で拒否する。どちらも `gh` の前に拒否する。

呼ぶ引数は、この順である。

```
pr
list
--repo
<repo>
--head
<head>
--state
all
--limit
<limit>
--json
number,url,state,mergedAt
```

標準入力は渡さない。応答は配列であり、各要素は `getPullRequest` と同じ規則で `PullRequest` にする。配列でないとき、要素が解釈できないときは `gh の応答を解釈できません` で拒否する。空の配列は成功であり、`[]` を返す。

## 課題ランナー

`createRunner` の依存に、次を足す。

```ts
completionCaller: CompletionCaller | null
```

`poll` は、これまでどおり `listIssues({ labels: ["実装依頼"], limit: 100 })` を呼び、`selectImplementationIssue` の結果があれば、その番号を `id` にして返す。`state` は渡さない。

結果が `null` で、`completionCaller` が `"runner"` のときだけ、続けて `listIssues({ labels: ["動作確認OK"], limit: 100 })` を呼び、`selectCompletionIssue` の結果を同じ形の `WorkItem` にする。それ以外の `completionCaller` では、二度目の `listIssues` は呼ばない。どちらの `listIssues` も、拒否したときその呼び出しだけをもう一度行う。

`process` は、これまでどおり `getIssue` のあと、ラベルに「実装依頼」があり「実装中」が無いときは、設計 6 の実装を行う。`completeIssue` は呼ばない。

その条件に当たらず、`completionCaller` が `"runner"` であり、ラベルに「動作確認OK」があるときは、`completeIssue` を一回だけ呼ぶ。`git`、`agent`、`addComment` は呼ばない。`completeIssue` が拒否したときは、その理由で `process` が拒否する。ランナーは `completeIssue` の外側ではやり直さない。

「動作確認OK」が無いとき、および `completionCaller` が `"runner"` でないときは、何もせず戻る。

`src/cli.ts` の `run` は、引数の解析のあと、ループの前に作業ディレクトリで `readCompletionCaller` を呼ぶ。ここで拒否したときは、その理由を標準エラーへ一行書き、`resolveRepo` は呼ばず、終了コード 1 である。`null`、`"skill"`、`"runner"` のときは、その値を `createRunner` へ渡す。以降の `resolveRepo` とループは、設計 6 のままである。

## 完了スキル

サブコマンド `complete` を足す。使い方は、既存の七行のあとに次の一行を足した八行である。

```
sdd-cur install [project-root]
sdd-cur run [--interval-min <1 以上 1440 以下の整数>]
sdd-cur labels
sdd-cur candidates
sdd-cur show <番号>
sdd-cur confirm <番号>
sdd-cur reflect <番号> <requirements|design>
sdd-cur complete <番号>
```

引数の数が 1 でないときは、使い方を標準エラーへ書き、終了コード 1 で終わる。番号の検証は、設計 5 と同じく `gh` より前に行う。不正な番号は `番号が不正です` であり、使い方は書かない。

番号が正しいときは、作業ディレクトリで `readCompletionCaller` を呼ぶ。この読み取りは `resolveRepo` より前である。

| 読み取り | すること |
|---|---|
| 拒否 | その理由を標準エラーへ一行書き、終了コード 1。GitHub は呼ばない |
| `null` | `完了の呼び出し元が未設定です`。終了コード 1。GitHub は呼ばない |
| `"runner"` | `完了は課題ランナーが行います`。終了コード 1。GitHub は呼ばない |
| `"skill"` | `resolveRepo` と `createGitHub` のあと、`completeIssue` を一回呼ぶ |

`completeIssue` が成功したときは、標準出力へ `完了しました: <番号>` を一行書き、終了コード 0 である。拒否したときは、その理由を標準エラーへ一行書き、終了コード 1 である。使い方は書かない。

`skills/sdd-cur-complete/SKILL.md` の先頭は、次のフロントマターと一致する。`disable-model-invocation` は無い。

```yaml
---
name: sdd-cur-complete
description: Project A の Cursor で、人が指定した課題の完了処理を行う。作業ツリーの呼び出し元が skill のときに使う。
---
```

本文の最初の見出しは `# sdd-cur-complete` である。そのあとに `## 完了` と `## 禁止` を、この順で置く。

完了では、起動した人が指定した課題番号を使い、作業ツリーのルートで `bun src/cli.ts complete <番号>` を実行する。完了処理の中身は、このコマンドが行う。

禁止には、課題を作らない、課題を閉じない、ラベルを変えない、スカッシュマージしない、コメントを投稿しない、`gh` を直接起動しない、`sdd-cur.completion` を作らない、を書く。

`install` は直下のディレクトリをコピーする既存の動作のままである。このスキル用のスクリプトは置かない。

## テスト

`bun:test` の `describe` と `test` を使う。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。

`src/github.test.ts` に足す。

- `listPullRequests` は、上の引数で `pr list` を一回だけ呼ぶ。`--state` は `all` である。標準入力は無い。
- 空の配列は `[]` である。`mergedAt` がある要素は `merged` が true である。
- 配列でない応答は `gh の応答を解釈できません` で拒否する。
- 不正な `head` と、範囲外の `limit` は `gh` を呼ばない。

`src/complete.test.ts` に置く。

- `parseCompletionCaller` は `runner` と `skill` を返す。空白を除いたあとに同じ語になるときも返す。空、`runner` と `skill` を並べた文字列は `完了の呼び出し元が不正です` で拒否する。
- `readCompletionCaller` は、ファイルが無いディレクトリで `null` を返す。`runner` と `skill` のファイルは、その値を返す。それ以外の中身、およびディレクトリを指したときは拒否する。
- `selectCompletionIssue` は引数を変えない。「動作確認OK」が無い課題を除く。番号 `10` と `2` のときは `2` を返す。「マージ済み」があっても除かない。
- `completeIssue` は、不正な番号で GitHub を呼ばない。
- 「動作確認OK」と「マージ済み」がどちらも無いときは `動作確認OKがありません` であり、`listPullRequests` を呼ばない。
- 「マージ済み」があり「動作確認OK」が無いときは、`listPullRequests` と `squashMerge` と `editLabels` を呼ばない。
- マージリクエストが 0 件のときは `マージリクエストがありません`、2 件のときは `マージリクエストを特定できません` であり、`squashMerge` を呼ばない。
- `merged` が false のときは、`squashMerge` のあと `editLabels` を呼ぶ。`editLabels` の削除は「動作確認OK」、追加は「マージ済み」であり、一回である。`issue close` は呼ばない。
- `merged` が true のときは `squashMerge` を呼ばず、同じ `editLabels` を一回呼ぶ。
- `squashMerge` が一度拒否し、二度目に成功したときは、`squashMerge` が二回であり、そのあと `editLabels` を呼ぶ。
- `squashMerge` が成功したあと、`editLabels` が二度拒否したときは、`squashMerge` は一回のままである。

`src/runner.test.ts` に足す。既存の実装の試験は `completionCaller: null` を渡し、設計 6 の呼び出しと順序のままである。

- `completionCaller` が `null` または `"skill"` のとき、`poll` は「実装依頼」の `listIssues` だけを呼ぶ。候補が無いとき、二度目は呼ばない。
- `"runner"` で「実装依頼」があるときは、その課題を返し、「動作確認OK」の `listIssues` は呼ばない。
- `"runner"` で「実装依頼」が無く「動作確認OK」があるときは、その番号を返す。
- `process` は、「実装依頼」があり「実装中」が無い課題では `completeIssue` の依存を呼ばない。
- `"runner"` で「動作確認OK」があり「実装依頼」が無い課題では、`squashMerge` と完了の `editLabels` だけを、上の順で呼ぶ。`commitAll`、`createPullRequest`、`addComment` は呼ばない。
- 同じ課題の組で、一方の `process` が完了の `editLabels` を終えたあと、もう一方の `poll` はその課題を返さない。

スキルと配置の確認も `src/complete.test.ts` で行う。一時ディレクトリを使う。

- `skills/sdd-cur-complete/SKILL.md` の先頭が、上のフロントマターと一致する。`disable-model-invocation` は無い。本文に、二つの見出し、`bun src/cli.ts complete`、`課題を作らない`、`課題を閉じない`、`ラベルを変えない`、`スカッシュマージしない`、`コメントを投稿しない`、`gh を直接起動しない`、`sdd-cur.completion` を作らない、が含まれる。
- `bun src/cli.ts install <temp>` の終了コードは 0 であり、`<temp>/.cursor/skills/sdd-cur-complete/SKILL.md` はパッケージのそのファイルと一致する。

`src/cli.test.ts` に足す。使い方の文字列は、上の八行である。子プロセスの作業ディレクトリは一時ディレクトリにし、`PATH` は `bun` のあるディレクトリだけにする。

- `complete` の引数が無いときは、使い方を書いて終了コード 1 になる。
- `complete 01` は `番号が不正です` であり、終了コード 1 である。
- ファイルが無いディレクトリでの `complete 7` は、`完了の呼び出し元が未設定です` であり、`gh を実行できません` ではない。
- 中身が `runner` のときの `complete 7` は、`完了は課題ランナーが行います` であり、`gh を実行できません` ではない。
- 中身が `skill` のときの `complete 7` は、`gh を実行できません` であり、終了コード 1 である。

## 作業の一覧

1. `listPullRequests` を `src/github.ts` に足し、引数と応答の試験を通す。
2. `src/complete.ts` を置き、呼び出し元、探索、`completeIssue` の試験を通す。
3. `createRunner` に `completionCaller` を足し、実装の既存試験が `null` で通り、`"runner"` の探索と完了の試験を通す。
4. `src/cli.ts` に `complete` を足し、`run` がループの前に呼び出し元を読むようにする。子プロセスの試験を通す。
5. `skills/sdd-cur-complete/SKILL.md` を書き、フロントマターと禁止の文言、一時ディレクトリへの `install` を確かめる。
6. README のコマンド一覧に `complete` を足す。`run` の説明に、`sdd-cur.completion` が `runner` のときは「動作確認OK」の完了処理も行う、を足す。`install` がコピーするスキルに `skills/sdd-cur-complete` を足す。ディレクトリに `src/complete.ts` と `skills/sdd-cur-complete/` を足す。実装済みの設計に、この設計へのリンクを足す。AGENTS.md の構成とコマンドに、`complete`、`src/complete.ts`、完了スキルを足す。
