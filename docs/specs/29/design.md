# 29 受け入れ手順は PR の概要に書き課題コメントは PR のリンクだけにする

対象は [Issue #29](https://github.com/paterapatera/sdd-cur/issues/29)。課題ランナーが投稿するコメントは、マージリクエストの URL だけである。受け入れ手順は、マージリクエストの本文に書く。課題の URL も本文に残す。

## 受け入れ条件

- 課題ランナーが投稿するコメントは、マージリクエストの URL だけである。
- 確認と回答の課題コメントは変えない。
- 受け入れ手順は、マージリクエストの本文に書く。
- マージリクエストの本文には、課題の URL も残す。
- 本文の並びは、課題の URL、印、受け入れ手順の順である。
- 印 `sdd-cur: 受け入れ手順` は、本文にある受け入れ手順の最初の非空行である。
- 課題の URL は、印の行より後ろの手順に含めない。
- 現在の手順は、本文の印の行より後ろから取る。
- 課題ランナーが投稿するコメントには、印を書かない。
- `bun test` は `gh`、`git`、`agent` を起動しない。

## 範囲外

次は作らない。

- ラベルの変更。`src/labels.ts` の説明文も変えない
- 課題の作成とクローズ。`issue close` と `--state` は付けない
- 完了処理。スカッシュマージと「マージ済み」（#7）。`completeIssue` の順は、設計 7 と設計 18 のままである
- 不具合と修正の会話コメント（#28）。修正で、本文も課題の受け入れ手順も書き直さない
- 受け入れ手順が受け入れ条件を一通り確かめられるかの検査（#40）
- 確認と回答の投稿。`confirmationBody`、`postConfirmation`、`parseComment`、`relateComments`、`commentMarkers`、`readReflectedIds`
- 手順ファイルの形。印の行は書かない。`skills/sdd-cur-implement/`、`skills/sdd-cur-fix/`、`skills/sdd-cur-quick/`、`agents/` は変えない
- `acceptanceComment` の拒否理由と、成功時の戻り値
- `createPullRequest` の引数の形と、戻り値の `number` と `url`。`src/github.ts` は変えない
- `base`、`head`、`title`。`Fixes` と `Closes` は足さない
- quick の止まりの課題コメント。`poll` の優先順。着手と完了のラベルの遷移
- README、AGENTS.md、この課題以外の `design.md` と `requirements.md`
- Forgejo、Jira、Backlog
- 依存パッケージ。トークンと環境変数の読み取り。`git config` の変更
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| 課題コメント | 実装と quick が投稿する完了のコメントは、`createPullRequest` が返した `url` だけである。題、説明、印、受け入れ手順、課題の URL は付けない。改行も足さない |
| 投稿しないもの | 課題に付くコメントをすべて、マージリクエストの URL にすることはしない。確認、回答、quick の止まりは、今の本文のままである |
| 本文 | `createPullRequest` の `body` は、課題の `url`、印 `sdd-cur: 受け入れ手順`、受け入れ手順の順である。課題の `url` も残す |
| 印の位置 | 印は、本文にある受け入れ手順の最初の非空行である。課題の `url` は印より前であり、印の行より後ろには書かない |
| 現在の手順 | 本文の、印の行より後ろである。課題の `url` は含めない。payload の空白は削らない |
| 二つの終わり | 実装の `runImplementation` と、quick の実装の終わりは、同じ本文と同じ課題コメントである。設計 56 の、終わりは今の実装ランナーと同じ、は残す |
| 書き直さない | 不具合の修正は、マージリクエストの本文も課題コメントも書かない。再確認の手順は、修正コメントの本文に書く。設計 28 のままである |
| 課題コメントの判定 | `parseComment` と `relateComments` は変えない。印のある課題コメントの最後の一件は、これまでどおり `acceptance` である。ランナーはその印の課題コメントを投稿しない |
| 失敗 | 理由は一行である。外部呼び出しは、拒否したその呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まり、成功した呼び出しはやり直さない |

## 本文

`src/runner.ts` に足す。`acceptanceComment` の拒否と、成功時の戻り値は変えない。

```ts
export function pullRequestBody(issueUrl: string, payload: string): string
```

`pullRequestBody` は、`acceptanceComment(payload)` を先に行う。拒否したときは、その理由のまま拒否する。GitHub は呼ばない。成功時は、`issueUrl`、`\n`、`acceptanceComment` の戻り値を、この順で連結する。`issueUrl` と payload の空白は削らない。足す改行は、その `\n` だけである。`acceptanceComment` の戻り値が、印、`\n`、payload であるため、本文の並びは、課題の URL、印、受け入れ手順である。

印の行は、この戻り値の中の受け入れ手順の最初の非空行である。payload の前後の空白を除いて空のとき、および空でない最初の行が三つの印のどれかと完全一致するときは、`acceptanceComment` が拒否する。本文は作らない。

`Fixes` と `Closes` は足さない。題は本文に書かない。

## 現在の手順

`src/conventions.ts` に足す。`commentMarkers`、`parseComment`、`relateComments`、`readReflectedIds`、`withReflectedId` は変えない。

```ts
export function acceptanceProcedure(body: string): string | null
```

`acceptanceProcedure` は、改行を `\n` にそろえる。行全体が `commentMarkers.acceptance` と一文字も違わない最初の行を、印の行とする。前後の空白を除いて比べない。印の行が無いときは `null` である。現在の手順は無い。あるときは、その行より後ろを `\n` で結合して返す。印の行そのものは含めない。うしろが無いときは空文字である。印の行が二つ以上あるときは、最初の行より後ろを返す。うしろの印の行では切り直さない。GitHub は呼ばない。

課題の URL は印より前なので、この戻り値には含まれない。payload に同じ URL の文字があるときだけ、戻り値にその文字が残る。ランナーは、課題の `url` を印のうしろへ書かない。

`pullRequestBody` の成功時の戻り値を `acceptanceProcedure` に渡すと、payload の改行を `\n` にそろえた文字列になる。課題の `url` にはならない。

## ランナー

変える呼び出しは、`runImplementation` と、quick の実装の終わりの、`createPullRequest` の `body` と `addComment` の本文だけである。順は変えない。

手順ファイルを読み、`pullRequestBody(issue.url, payload)` に通す。拒否したときは、これまでどおりファイルを消し、コミット、`createPullRequest`、`addComment`、完了の `editLabels` を呼ばない。成功したあとの、変更が無いときの `実装の変更がありません` も、これまでどおりである。

`createPullRequest` の `base` はデフォルトブランチ、`head` は作業ブランチ、`title` は課題の題である。`body` は `pullRequestBody` の戻り値である。`Fixes` と `Closes` は足さない。

`addComment` の本文は、`createPullRequest` が返した `url` と一文字も違わない。`number` は書かない。印は書かない。受け入れ手順は書かない。課題の `url` は書かない。

完了の `editLabels` は、この `addComment` のあとである。追加と削除は一回にまとめる。ラベル名は `workflowLabels` の `name` のままである。

quick の止まりは、この本文もこのコメントも使わない。状況の課題コメントは、設計 56 のままである。`createPullRequest` は呼ばない。

不具合の `runFix` は、`createPullRequest` も課題の `addComment` も呼ばない。マージリクエストの本文を更新する操作は足さない。

`createPullRequest` が成功したあと、`addComment` が二度拒否したときは、`createPullRequest` は一回のままである。完了の `editLabels` は呼ばない。

## 約束

`docs/conventions.md` の、確認と回答の文、三つの印の表、反映済み、未反映、マージリクエストの会話コメント、処理済みの不具合、レビューの判定は、文も印も変えない。

課題コメントの種別の、次の段落だけを置き換える。

```
印の行より後ろが本文である。確認と回答は、古いコメントから見て、未対応のうちいちばん古い確認に回答を一つ付ける。課題コメントにある受け入れ手順は、同じ順の最後の一件である。課題ランナーが書く現在の手順は、マージリクエストの本文から取る。
```

ファイルの末尾に、次の節を足す。

```
## マージリクエストの本文

課題ランナーが書く受け入れ手順は、マージリクエストの本文に置く。課題ランナーは、課題コメントに受け入れ手順を書かない。

本文の並びは、課題の URL、印 `sdd-cur: 受け入れ手順`、受け入れ手順の順である。印の行は、本文にある受け入れ手順の最初の非空行である。

課題の URL は印より前である。印の行より後ろには含めない。現在の手順は、本文の印の行より後ろである。

課題ランナーが投稿する課題コメントは、マージリクエストの URL だけである。題や説明は付けない。このコメントには印を書かない。

確認と回答の課題コメントは、変えない。課題コメントの印と、最後の受け入れ手順コメントを取る規則は、変えない。
```

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。`defaultGhRunner`、`defaultGitRunner`、`defaultAgentRunner` は呼ばない。ホームディレクトリと、実行中の Cursor のスキルは触らない。

`src/conventions.test.ts` に足す。

- `acceptanceProcedure` は、課題の URL、印、`手順` の順の本文から `手順` を返す。戻り値に課題の URL は無い。印の行は無い。
- payload の前後の空白は残る。印のうしろの空行は残る。改行は `\n` だけである。
- 印の行が無いとき、および課題の URL だけのときは `null` である。印の行が末尾のときは空文字である。
- 印の行に空白が一つでもあれば、その行は印ではない。
- `parseComment` と `relateComments` の既存の期待は変えない。マージリクエストの URL だけの本文は `other` である。

`src/runner.test.ts` に足す。

- `pullRequestBody` は、空の payload を `受け入れ手順が空です` で拒否する。最初の非空行が三つの印のいずれかのときは `受け入れ手順に印を含めない` で拒否する。成功時は、課題の URL、`\n`、`acceptanceComment` の戻り値である。
- `acceptanceComment` の既存の期待は変えない。成功時の先頭行は印であり、payload の空白は残る。
- 通過した実装の `process` は、これまでの呼び出し順である。`createPullRequest` の `body` は、課題の `url`、印、手順ファイルの payload の順であり、`Fixes` と `Closes` を含まない。`addComment` の本文は、`createPullRequest` が返した `url` と一文字も違わない。印を含まない。完了の `editLabels` より前に `addComment` がある。
- 通過した quick の `process` も、同じ本文と同じ `addComment` である。呼び出し順は変えない。`createBranch` は呼ばない。
- quick の止まりは、これまでどおり状況の課題コメントだけを投稿する。`createPullRequest` は呼ばない。その本文は印で始まらない。
- `acceptanceComment` が拒否する payload のときは、`createPullRequest` と `addComment` を呼ばない。
- 既存の不具合の `process` は、課題の `addComment` と `createPullRequest` を呼ばない。

`docs/conventions.md` の文書テストに足す。

- 置き換えた段落の、`課題コメントにある受け入れ手順は、同じ順の最後の一件である。` と、`課題ランナーが書く現在の手順は、マージリクエストの本文から取る。` がある。
- 末尾の節に、`マージリクエストの本文`、`マージリクエストの URL だけ`、`確認と回答の課題コメントは、変えない。` がある。
- 三つの印、`課題のコメントだけに書く`、`未回答の確認があるあいだ、次の確認は投稿しない` は残る。

## 実装の順序

1. `acceptanceProcedure` を `src/conventions.ts` に足し、試験を通す。`parseComment` と `relateComments` の既存の試験は変えない。
2. `pullRequestBody` を `src/runner.ts` に足し、`runImplementation` と quick の実装の終わりで、本文と課題コメントを上の形にする。試験を通す。
3. `docs/conventions.md` の一段落と末尾の節を、上の文に変える。
