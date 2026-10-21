# 81 同じアカウントの二つのクローンが同じ課題を実装しないようにする

対象は [Issue #81](https://github.com/paterapatera/sdd-cur/issues/81)。同じアカウントで動く二つのクローンが、同じ課題の実装、修正、軽微な修正の着手を同時に取ったとき、続けるのは一つのクローンだけである。

どのクローンが続けるかは、この設計が決める。着手コメントにクローン識別子を書き、読み直して、いちばん古い着手コメントが自分のときだけ続ける。

## 受け入れ条件

- 同じアカウントで動く二つのクローンが、同じ課題の実装、修正、軽微な修正のいずれかの着手を同時に取ったとき、続けるのは一つだけである。
- 続けないクローンは、作業ブランチを変えない。
- 続けないクローンは、マージリクエストを変えない。
- 続けないクローンは、ラベルを変えない。
- 続けないクローンは、次の `poll` に戻る。
- `bun test` は `gh`、`git`、`agent` を起動しない。

## 範囲外

次は作らない。

- 失敗した課題の扱い（#82）。着手コメントのあと、続けるクローンがラベルを付ける前に止まったとき、別の識別子のプロセスが代わりに続けること
- 別のアカウントで動くクローンどうしの排他。担当者で分かれている
- ファイルのロック。設計 1 の、ロックを持たないことは変えない
- `poll` の探索条件と優先順。`src/run.ts` のループ。間隔の待機
- 続けると決めたあとの着手ラベルの中身。実装は「実装依頼」を外し「実装中」を付ける。修正は「実装完了」を外し「実装中」を付ける。quick は「実装中」だけを付ける。そのあとの `fetch`、`checkoutFetched`、agent、コミット、push、マージリクエスト、完了のラベルは、今のまま
- 新しいラベル。`src/labels.ts` と `workflowLabels`
- 課題の作成とクローズ。`issue close` と `--state` は付けない
- `src/github.ts` の関数、引数、戻り値。`listComments` と `addComment` は今のまま使う
- `src/conventions.ts`。`commentMarkers`、`parseComment`、`relateComments`、`readReflectedIds`
- `src/git.ts`、`src/cli.ts`、`src/sdd.ts`、`src/complete.ts`、`src/agent.ts`
- スキルと `agents/`。確認、回答、受け入れ手順の印。不具合と修正の印。修正コメントの `sdd-cur:fixed`
- 着手コメントの削除。ラベルを戻すこと。作業ツリーの復元。`--force` の push
- コメント一覧の続き。`listComments` に limit は足さない
- この課題以外の `design.md` と `requirements.md`。README、AGENTS.md
- Forgejo、Jira、Backlog
- 依存パッケージ。トークンと環境変数の読み取り。`git config` の変更
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| 続けるクローン | 同じ課題の、今回の着手コメントのうち、いちばん古いものの識別子が自分のときだけ続ける |
| 識別子 | `createRunner` を一回呼ぶたびに、`node:crypto` の `randomUUID` で一つ作る。ログイン名ではない。同じアカウントの二つのプロセスは、別の識別子を持つ。環境変数もファイルも読まない。呼び出しのあいだは変えない |
| 書く場所 | 課題コメント。最初の非空行は `sdd-cur: 着手`。直後の行が識別子である。マージリクエストの会話、要件、設計、コミットメッセージには書かない |
| 順番 | 続けると決めたクローンだけが、今の着手の `editLabels` を呼ぶ。それより前にコメントを書いて読み直す。続けないクローンは `editLabels` を呼ばない |
| 基準時刻 | 実装と quick は、着手ではない課題コメントの、いちばん新しい `createdAt`。無いときは、着手コメントをすべて比べる。修正は、未処理があると分かったときに読んだマージリクエストの会話コメントの、いちばん新しい `createdAt`。無いときは、課題の着手コメントをすべて比べる。終わった回の着手コメントが、次の回を止めないようにするためである |
| いちばん古い | 基準時刻より `createdAt` が新しい着手コメントだけを比べる。基準時刻と同じ文字列は含めない。`createdAt` の文字列の昇順、同じときはコメント `id` の文字列の昇順で先頭を取る。時刻としては解釈しない |
| 戻る | 続けないと決めた `process` は拒否せずに戻る。`runLoop` は次の `poll` をすぐ呼ぶ。失敗にせず、終了コード 1 にもしない |
| 失敗 | 外部呼び出しは、拒否したその呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まり、着手の `editLabels` より後は呼ばない。成功した呼び出しはやり直さない。ラベルは戻さない |
| ラベル名 | `workflowLabels` の `name` だけを使う。別の字面で再定義しない |

## 関係する課題

### #6 実装依頼から実装完了まで

`poll` は変えない。同じ課題を二つの `process` が同時に受け取ることがある。分けるのは、その `process` の着手である。先に続けると決めたクローンが「実装中」を付けたあと、もう一方の探索からは、今どおり外れる。ファイルのロックは足さない。

### #28 不具合の修正

修正は、未処理の不具合があると分かったあと、着手の `editLabels` の前に判定する。未処理が無く戻るときは、着手コメントを書かない。不具合と修正は、今どおりマージリクエストの会話コメントに書く。着手コメントは課題に書く。基準時刻は、そのときに読んだ会話コメントの、いちばん新しい `createdAt` である。

### #56 軽微な修正

quick は、「実装中」を付ける前に判定する。「実装依頼」は付けない。外さない。止まりの課題コメントと、終わりのマージリクエストを知らせるコメントは、今のままである。

### #29 課題コメントはマージリクエストの URL

マージリクエストを知らせる課題コメントは、URL だけであり、印は付けない。着手コメントは、それとは別の課題コメントであり、着手の判定より前に書く。

## 約束

`docs/conventions.md` の、確認、回答、受け入れ手順の表は変えない。`## マージリクエストの本文` にある、課題ランナーが投稿する課題コメントの文を、次の一文に変える。

```
課題ランナーが、マージリクエストを知らせる課題コメントは、マージリクエストの URL だけである。題や説明は付けない。このコメントには印を書かない。
```

その直後の、確認と回答を変えない文は残す。ファイルの末尾に、次の節を足す。

### 着手の課題コメント

実装、修正、軽微な修正の着手は、課題のコメントに書く。要件、設計、コミットメッセージ、マージリクエストの会話には書かない。

コメントの最初の非空行が `sdd-cur: 着手` と一文字も違わないとき、着手である。印の行の前後に空白があれば、着手ではない。

印の直後の行は、クローン識別子である。識別子は、空でなく、空白を含まない一行である。

確認、回答、受け入れ手順の印と、その判定は、変えない。マージリクエストを知らせる課題コメントは、「マージリクエストの本文」の節のままである。

`src/conventions.ts` は変えない。着手の印は `commentMarkers` に足さない。`parseComment` は着手を `other` のままにする。

## 着手コメント

`src/runner.ts` に置く。印は `sdd-cur: 着手` である。

```ts
export function startComment(cloneId: string): string

export function issueStartCutoff(comments: readonly IssueComment[]): string | null

export function latestCreatedAt(comments: readonly IssueComment[]): string | null

export function decideStartClaim(
  comments: readonly IssueComment[],
  cloneId: string,
  cutoff: string | null,
): "continue" | "yield" | "unseen"
```

`startComment` は、識別子が空、または空白を含むとき `クローン識別子が不正です` で拒否する。空白は、前後だけではない。成功時は、印、`\n`、識別子をこの順で連結する。末尾に改行は付けない。

課題コメントの本文は、改行を `\n` にそろえてから行に分ける。前後の空白を除いて空の行を飛ばし、最初の非空行を取る。その行全体が印と一文字も違わないとき、着手コメントである。行を `trim` してから印と比べない。印の行の直後の行が識別子である。空行を挟んで次の非空行を識別子にはしない。識別子の行は、空でなく、空白を含まないときだけ有効である。

`issueStartCutoff` は、引数の配列を変えない。着手コメントを除き、残った `createdAt` の文字列で最大のものを返す。残らないときは `null` である。識別子の行が無効でも、最初の非空行が印なら着手コメントであり、基準時刻からは除く。

`latestCreatedAt` は、引数の配列を変えない。空なら `null`。空でないときは、`createdAt` の文字列の最大を返す。

`decideStartClaim` は、引数の配列を変えない。比べるのは、有効な識別子を持つ着手コメントのうち、`cutoff` が `null` のとき全部、文字列のときは `createdAt` が `cutoff` より大きいものだけである。`cutoff` と同じ文字列は含めない。

自分の識別子を持つものが、その中に無いときは `unseen` である。あるときは、`createdAt` の昇順、同じときは `id` の昇順で先頭を取る。先頭の識別子が `cloneId` と一致するときは `continue`、一致しないときは `yield` である。

## ランナー

`createRunner` の `github` に `listComments` を足す。型は `GitHubClient["listComments"]` である。他の関数の引数は変えない。識別子は、`createRunner` の中で一度だけ作る。

完了処理と、ラベルが着手の条件を満たさず戻る `process` は、着手コメントを書かない。`poll` も書かない。

実装と quick と修正は、今の着手の `editLabels` より前に、次の順で判定する。拒否した時点より後は呼ばない。

1. 課題の `listComments` を呼ぶ。実装と quick の基準時刻は `issueStartCutoff` の戻り値である。修正の基準時刻は、未処理の不具合があると判断したときに読んだ会話コメントを `latestCreatedAt` に渡した戻り値である。`decideStartClaim` を呼ぶ。
2. `yield` のときは、`addComment` も着手の `editLabels` も呼ばず戻る。
3. `unseen` のときは、`startComment` の戻り値で課題に `addComment` する。`listComments` を呼び、下の基準時刻で、もう一度 `decideStartClaim` を呼ぶ。まだ `unseen` のときは、`listComments` をもう一度だけ呼び、同じ判定をする。
4. 判定が `continue` でないときは、着手の `editLabels` を呼ばず戻る。
5. 着手の `editLabels` の直前に、`listComments` をもう一度呼ぶ。下の基準時刻で `decideStartClaim` を呼ぶ。`continue` のときだけ、今の着手の `editLabels` へ進む。それ以外は呼ばず戻る。

修正の 1 の会話コメントは、`resolveFixContext` がすでに読む一覧である。未処理が無く `skip` のときは、この判定に入らない。実装と quick は、1 の時点では着手コメントを書いていない。基準時刻は、1 で読んだ課題コメントから取る。3 と 5 で読み直したときも、実装と quick の基準時刻は、その一覧の `issueStartCutoff` である。修正の基準時刻は、1 で決めた会話コメントの値のままである。課題コメントを読み直しても取り直さない。

続けないと戻るときは、`fetch`、`checkoutFetched`、`commitAll`、`push`、`createPullRequest`、`addPullRequestComment`、agent を呼ばない。書いた着手コメントは消さない。ラベルは戻さない。

続けるときの `editLabels` からあとは、今の `runImplementation`、`runQuick`、`runFix` のままである。`createBranch` は呼ばない。

各 `listComments` と `addComment` は、他の外部呼び出しと同じく、拒否したその呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まり、着手の `editLabels` は呼ばない。

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。

`src/runner.test.ts` に足す。注入した github、git、agent の呼び出しを記録する。識別子は、`addComment` に渡った本文から取る。`createRunner` の引数には足さない。

- `startComment` は、空の識別子と、空白を含む識別子を `クローン識別子が不正です` で拒否する。成功時は、先頭行が `sdd-cur: 着手` であり、次の行が渡した識別子である。
- `decideStartClaim` は、引数の配列を変えない。`createdAt` が古い識別子を `continue` とし、新しい識別子を `yield` とする。`createdAt` が同じときは、`id` の文字列が小さいほうを続ける。
- 基準時刻と同じ `createdAt`、およびそれより小さい着手コメントは、競合に入らない。それより新しい自分のコメントが最古のときは `continue` である。
- 印の行の前に空白があるコメントは、着手コメントではない。
- `issueStartCutoff` は、着手コメントを除いた、いちばん新しい `createdAt` を返す。着手以外が無いときは `null` である。
- 実装の `process` は、最初の `listComments` に自分の着手コメントが無く、書いたあとの一覧で自分のものが最古のとき、`listComments`、着手の `addComment`、`listComments`、`listComments`、着手の `editLabels` の順で呼び、そのあと今までどおり `getDefaultBranch` から完了の `editLabels` まで進む。`createBranch` は呼ばない。
- 実装の `process` は、書いたあとの一覧に、自分より古い他の識別子の着手コメントがあるとき、着手の `editLabels`、`fetch`、`checkoutFetched`、`push`、`createPullRequest` を呼ばず、拒否せずに戻る。確認の `listComments` は呼ばない。
- 最初の一覧に、自分の識別子と、それより古い他の識別子があるときは、`addComment` を呼ばず戻る。
- 書いたあとの二度の `listComments` にも自分の識別子が無いときは、着手の `editLabels` を呼ばず戻る。
- quick も、同じ三つの戻り方にする。続けるときは、今の quick の順で、「実装中」の追加から完了まで進む。「実装依頼」は外さない。続けないときは `checkoutFetched` を呼ばない。
- 修正は、未処理が無く戻るとき、着手の `addComment` を呼ばない。未処理があるときは、着手の `editLabels` より前に判定する。続けないときは、`fetch`、`checkoutFetched`、`push`、`addPullRequestComment`、終了の `editLabels` を呼ばない。続けるときは、今の修正の順で、着手の `editLabels` から終了まで進む。基準時刻は、会話コメントのいちばん新しい `createdAt` であり、それ以前の課題の着手コメントでは止まらない。
- 既存の完了処理の試験は、着手の `addComment` を呼ばない。
- `poll` は、着手の `addComment` を呼ばない。

`createRunner` の github モックは `listComments` を持つ。着手しない既存の試験は、空の一覧を返し、`listComments` を呼ばない。

`src/conventions.test.ts` の文書の試験に、`sdd-cur: 着手` が `docs/conventions.md` に含まれることを足す。`マージリクエストの URL だけ` と `確認と回答の課題コメントは、変えない。` は残す。

`src/github.test.ts` は、この課題では足さない。

## 作業の一覧

1. `src/runner.ts` に `startComment`、`issueStartCutoff`、`latestCreatedAt`、`decideStartClaim` を足し、純関数の試験を通す。
2. `createRunner` の識別子と、`github.listComments` を足す。実装、quick、修正の着手の `editLabels` の前に、上の判定を入れる。
3. `src/runner.test.ts` を、上の順と、続けない側の期待に合わせる。既存のモックに `listComments` を足す。
4. `docs/conventions.md` を、上の「約束」のとおり変える。`src/conventions.test.ts` に、印が含まれる期待を足す。
5. `bun test` を通し、`gh`、`git`、`agent` を起動しないことを確かめる。
