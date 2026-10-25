# 174 途中で止まった実装を、終わった作業の次から再開する

<!-- sdd-cur:form -->

対象は [Issue #174](https://github.com/paterapatera/sdd-cur/issues/174)。agent の再試行も失敗したとき、または `sdd-cur run` のプロセスが落ちたとき、課題は「実装中」のまま残る。起動時に一度だけ、条件を満たす課題を探し、ラベルを変えずにローカルの `task-<番号>` から実装の agent をやり直す。クローン識別子は作業ディレクトリへ永続化し、最新の着手コメントの識別子と一致する課題だけを再開する。

手を入れる対象は、`src/run.ts`、`src/runner.ts`、`docs/canonical/runner.md` である。

重なる課題は #173（作業ごとのコミットと `done`）、#6（課題ランナー）、#81（着手コメントとクローン識別子）、#95（失敗時の標準エラーと括弧行）、#151（ローカルの `task-` ブランチの削除）である。

## 受け入れ条件

- 1. 条件: `runLoop` を呼ぶ 主体: `src/run.ts` 結果: `while` で `poll` を繰り返すより前に、再開の探索とやり直しを一度だけ行う。二度目以降の `poll` の前には行わない
- 2. 条件: 受け入れ条件 1 の探索で、再開の対象が無い 主体: `runLoop` 結果: 失敗にせず、今の `poll` と `process` の繰り返しに入る
- 3. 条件: 再開の探索で `listIssues` を呼ぶ 主体: 課題ランナー 結果: `state` は `open`、`labels` は `実装中` のみ、`limit` は 100 である
- 4. 条件: 再開候補の課題を見る 主体: 課題ランナー 結果: `state` が `open` であり、ラベルに「実装中」がある
- 5. 条件: 再開候補の課題のコメントを見る 主体: 課題ランナー 結果: 最新の着手コメントのクローン識別子が、このクローンの識別子と一致する。最新は、着手コメントの `createdAt` の文字列が最大のものであり、同じときはコメント `id` の文字列が最大のものである。着手コメントは、最初の非空行が `sdd-cur: 着手` と一文字も違わず、直後の行が空でなく空白を含まないコメントである
- 6. 条件: 再開候補に、着手コメントが一件も無い課題がある 主体: 課題ランナー 結果: その課題は候補に含めない
- 7. 条件: 再開候補に、最新の着手コメントのクローン識別子がこのクローンの識別子と一致しない課題がある 主体: 課題ランナー 結果: その課題は候補に含めない。ラベルを変えない。その作業ブランチをチェックアウトしない
- 8. 条件: 再開候補に、`isQuickTarget(issue)` が真の課題がある 主体: 課題ランナー 結果: その課題は候補に含めない。失敗にしない。ラベルを変えない
- 9. 条件: 再開候補の課題で `head` が `task-<番号>` のマージリクエストを列挙する 主体: 課題ランナー 結果: `listPullRequests` の `state` は `all` である。一件でもあれば、その課題は候補に含めない
- 10. 条件: 再開候補の課題で、ローカルに `refs/heads/task-<番号>` が無い 主体: 課題ランナー 結果: その課題は候補に含めない。失敗にしない。ラベルを変えない
- 11. 条件: 受け入れ条件 4 から 10 を満たす課題が一件以上ある 主体: 課題ランナー 結果: 課題番号の昇順で先頭の一件だけをやり直す。残りは、この起動ではやり直さない
- 12. 条件: 受け入れ条件 11 のやり直し 主体: 課題ランナー 結果: `runQuick` を呼ばない。`runFixProcess` を呼ばない。`editLabels` を呼ばない。`ensureStartClaim` を呼ばない
- 13. 条件: 受け入れ条件 11 のやり直しで作業ブランチに乗る 主体: 課題ランナー 結果: `git checkout <branch>` だけである。`<branch>` は `task-<番号>` である。`fetch` しない。`checkout -B` で `FETCH_HEAD` に合わせない
- 14. 条件: 受け入れ条件 11 のやり直しの前を見る 主体: `runLoop` 結果: `deleteLocalTaskBranches` を呼んでいない。再開は `poll` が仕事を返したあとのローカル `task-` ブランチの削除より前である
- 15. 条件: 受け入れ条件 11 のやり直しで実装の agent を起動する 主体: 課題ランナー 結果: `runImplementation` と同じ `runAgentWithHeadCheck` と `deps.agent.implement` の経路である。`done` が真の作業の実装作成役は起動しない判定は #173 のままである。実装スキルの本文は変えない
- 16. 条件: 受け入れ条件 11 のやり直しが成功し、実装が終わった 主体: 課題ランナー 結果: 今の `runImplementation` と同じく push し、マージリクエストを作り、「実装中」を外して「実装完了」を付ける。課題は閉じない。そのあと `poll` と `process` の繰り返しに入る。起動時の探索はもうしない
- 17. 条件: 受け入れ条件 11 のやり直しが失敗した 主体: `runLoop` 結果: 終了コードは 1 である。ラベル「実装中」は付いたままである。「実装完了」は付けない。「実装依頼」は付けない。標準エラーへ書くのは、行全体が `<番号>: <理由>` である一行だけである。`<番号>` は十進で先頭の零は付けない。`<理由>` は `errorLine` の戻り値と一文字も違わない。かかった時間と起動回数の括弧だけの一行は書かない。`commentFailure` は呼ばない。同じ課題を、そのプロセスの中で再び再開しない。受け入れ条件 11 の残り候補も、この止まりでは再開しない。その課題のローカル `task-<番号>` は削除しない
- 18. 条件: `selectImplementationIssue` を見る 主体: 課題ランナー 結果: ラベルに「実装中」がある課題を残さないままである。再開は、この選択とは別である
- 19. 条件: 同じプロセスの中で、実装の agent の再試行も失敗した 主体: 課題ランナー 結果: 今どおり「実装中」のまま止まり、そのプロセスの中では再開しない。再開は、次の `sdd-cur run` の起動時である
- 20. 条件: ラベルを変える 主体: 課題ランナー 結果: `issue edit` の `--add-label` と `--remove-label` だけである。課題を作らない。課題を閉じない
- 21. 条件: クローン識別子を、`sdd-cur run` の再起動の前後で見る 主体: `createRunner` 結果: 作業ディレクトリに `.sdd-cur/clone-id` が無いときは、`randomUUID` で一つ作り、その文字列をファイルへ書く。あるときは、新しく作らず、読んだ文字列を使う。再起動後も同じ文字列である。環境変数からは読まない
- 22. 条件: `.sdd-cur/clone-id` の内容を見る 主体: `createRunner` 結果: ファイルは一行だけであり、その行は空でなく空白を含まない。前後の空白は除いて比べる。除いたあと空、または空白を含むときは、無いときと同じく新規作成して上書きする
- 23. 条件: この設計の変更 主体: 実装 結果: `docs/canonical/runner.md` について、この設計に合わせる追加または変更を「正本への差分」に書く。識別子は変えない
- 24. 条件: この課題で足すテストを置く 主体: テスト 結果: `src/174.test.ts` に書く。既存の `src/*.test.ts` に新しい `test` を足さない。`gh` を起動しない
- 25. 条件: 既存のテストが、起動時に止まっている実装を再開しないことを期待している 主体: テスト 結果: その期待をこの設計に合わせる

## 範囲外

- 他のクローンが着手した課題を再開すること
- 作業のコミットを途中で push し、別のクローンが同じ課題を再開すること
- 課題を作ること
- 課題を閉じること
- `issue edit` の `--add-label` と `--remove-label` 以外でラベルを変えること
- `selectImplementationIssue` が「実装中」の課題を選ぶようにすること
- 実装スキルの本文を変えること
- #173 の `done` の判定を変えること
- `poll` が探す種類の順を変えること
- 同じプロセスの中の、agent の再試行の回数を変えること
- quick を再開すること
- 不具合修正を再開すること
- 起動時に、再開の対象を二つ以上やり直すこと
- ローカルに `task-<番号>` が無い課題を再開すること
- ローカルに `task-<番号>` が無い課題を、失敗にすること
- 再開の失敗で、かかった時間と起動回数の括弧だけの一行を標準エラーへ書くこと
- 再開の失敗で、課題コメントを投稿すること
- 識別子を作業ディレクトリに残さず、再起動のたびに別の文字列にすること
- 識別子を環境変数から読むこと
- `src/git.ts` の `export type GitClient` の形を変えること

## 決定

| 項目 | 内容 |
|---|---|
| 作業ディレクトリ | `createRunner` に渡す `workDir` である。`cmdRun` は `process.cwd()` を渡す |
| 識別子のファイル | `path.join(workDir, ".sdd-cur", "clone-id")` である。無いときは親ディレクトリ `.sdd-cur` を `mkdir` してから書く |
| 識別子の読み書き | `readCloneIdFile` と `writeCloneIdFile` を `src/runner.ts` から export する。`loadOrCreateCloneId(workDir)` が、読み取りまたは新規作成の文字列を返す |
| 最新の着手 | `latestStartEntry(comments)` を export する。着手コメントだけを集め、`createdAt` の文字列の降順、同じときは `id` の文字列の降順で先頭を取る。先頭の `cloneId` が無いときは、候補に含めない |
| 再開候補の判定 | `isResumableImplementationIssue(issue, login, cloneId, latestCloneId, isQuick, prCount, hasLocalBranch)` を export する。`latestCloneId` は `latestStartEntry` の `cloneId` である。`prCount` は `head` が `task-<番号>` の `listPullRequests` の件数である |
| 再開対象の選択 | `selectResumableImplementationIssue(candidates)` を export する。候補の `number` 昇順で先頭一件。空なら `null` |
| 起動時の再開 | `resumeInterruptedImplementationOnce(deps, cloneId)` を export する。`null` を返したときは何もしない。やり直しが成功したときも `undefined` で戻る。失敗したときは `Error` を投げ、メッセージは `formatResumeFailureLine(issueNumber, reason)` と一文字も違わない |
| 失敗行 | `formatResumeFailureLine(issueNumber, reason)` は `` `${issueNumber}: ${reason}` `` である。`issueNumber` は十進で先頭の零は付けない |
| `runLoop` | 先頭で `resumeInterruptedImplementationOnce` を一度呼ぶ。投げたときは `logError` に `errorLine` の結果を一行書き、終了コード 1 で戻る。`commentFailure` も括弧行も呼ばない。成功または対象無しのあと、既存の `while` に入る |
| やり直し本体 | `resumeImplementation(deps, issueNumber, issue, cloneId)` は内部関数である。`checkoutLocalBranch(branch)` でローカルの `task-<番号>` に乗る。`mergeDefaultBranchIntoWorkBranch` は `runImplementation` と同じである。そのあと `runAgentWithHeadCheck` と `commitAndPushImplementation`、マージリクエスト作成、完了ラベルは `runImplementation` と同じ経路を共有する |
| `checkoutLocalBranch` | `src/git.ts` の `createGit` の戻り値に足す。`refs/heads/<branch>` が無いときは拒否する。あるときは `git checkout <branch>` だけである |
| `runImplementation` の共有 | `runImplementation` は、着手ラベルと `fetch` と `checkoutFetched` のあとから、マージ、agent、push、マージリクエスト、完了ラベルまでを `continueImplementationOnBranch` に切り出す。`resumeImplementation` も `continueImplementationOnBranch` を呼ぶ |
| 途中 push | 採用しない。作業ごとのコミットはローカルに残す。push は、実装の agent が戻ったあとの一回のままである。別クローンでの再開は範囲外である |
| 不具合修正の途中 | 再開対象にしない。多くの場合、head が `task-<番号>` のマージリクエストが既にあり、受け入れ条件 9 で除外される |

`latestStartEntry` と `decideStartClaim` の「いちばん古い」は別である。再開は、着手コメントのうち `createdAt` が最大の一件の識別子だけを見る。

`resumeInterruptedImplementationOnce` は、プロセスごとに一度だけ呼ばれる。失敗したあとは、同じプロセスで他の候補を試さない。

## 変えるファイル

- src/run.ts
- src/runner.ts
- src/git.ts
- src/cli.ts
- src/174.test.ts
- docs/canonical/runner.md

既存の `src/*.test.ts` のうち、この設計で期待が変わるファイルは、新しい `test` を足さず、既存の `test` の期待だけを変える。

## テスト

`bun test` で実行する。`gh` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。新しい `test` は `src/174.test.ts` だけに足す。

- `readCloneIdFile` と `loadOrCreateCloneId` が、無いときに書き、あるときに同じ文字列を返し、空白だけのファイルを上書きすることを確かめる。[21][22]
- `latestStartEntry` が、`createdAt` と `id` の最大で最新を取り、着手でないコメントを無視することを確かめる。[5][6]
- `isResumableImplementationIssue` と `selectResumableImplementationIssue` が、quick、マージリクエスト、ローカルブランチ無し、識別子不一致を除外し、番号昇順で先頭を取ることを確かめる。[7][8][9][10][11]
- `resumeInterruptedImplementationOnce` が、再開の探索で `listIssues` を `state` が `open`、`labels` が `実装中` のみ、`limit` が 100 で呼び、再開候補は `open` でラベルに「実装中」がある課題だけを見ることを注入で確かめる。[3][4]
- `formatResumeFailureLine` の形を確かめる。[17]
- `runLoop` が、`resumeInterruptedImplementationOnce` を `poll` より前に一度呼び、対象無しのときは `poll` に進み、失敗のときは `commentFailure` と括弧行を呼ばず終了コード 1 になることを注入で確かめる。[1][2][14][17]
- `resumeImplementation` が、`editLabels` と `ensureStartClaim` と `fetch` と `checkoutFetched` を呼ばず、`checkoutLocalBranch` のあと agent 経路に入ることを注入で確かめる。やり直し成功でラベルを変えるときは、`issue edit` の `--add-label` と `--remove-label` だけを使い、課題を作らず閉じない。[12][13][15][16][20]
- 同じプロセスで実装の agent の再試行も失敗したとき、そのプロセスでは再開せず、次の `sdd-cur run` の起動まで「実装中」のままであることを注入で確かめる。[19]
- `selectImplementationIssue` が「実装中」を除くままであることを、既存の `src/runner-select-implementation-issue.test.ts` で確かめる。[18]
- 新しい `test` は `src/174.test.ts` にだけある。[24]
- 既存の `src/run.test.ts` ほかで、起動時再開のモック期待をこの設計に合わせる。[25]
- `docs/canonical/runner.md` の REQ-575 と REQ-948 から REQ-953 が、設計の「正本への差分」に書いた追加と変更と一致することを確かめる。[23]

## 作業の一覧

- 1. `src/git.ts` に `checkoutLocalBranch` を足し、`createGit` の戻り値に含める。[13]
- 2. `src/runner.ts` に `readCloneIdFile`、`writeCloneIdFile`、`loadOrCreateCloneId` を足す。`createRunner` は `workDir` を受け取り `loadOrCreateCloneId` を使う。[21][22]
- 3. `src/runner.ts` に `latestStartEntry`、`isResumableImplementationIssue`、`selectResumableImplementationIssue`、`formatResumeFailureLine` を足す。[3][4][5][6][7][8][9][10][11]
- 4. `src/runner.ts` で `runImplementation` から `continueImplementationOnBranch` を切り出し、既存の `runImplementation` がそれを呼ぶ形に直す。[15][16][20]
- 5. `src/runner.ts` に `resumeImplementation` を足し、`checkoutLocalBranch` のあと `continueImplementationOnBranch` を呼ぶ。`editLabels`、`ensureStartClaim`、`fetch`、`checkoutFetched` は呼ばない。[12][13]
- 6. `src/runner.ts` に `resumeInterruptedImplementationOnce` を足す。作業 3 の選択関数を使い、一件だけ `resumeImplementation` を呼ぶ。[18][19]
- 7. `src/run.ts` の `runLoop` が、先頭で `resumeInterruptedImplementationOnce` を一度呼び、失敗時は再開専用の標準エラー一行だけで終了コード 1 にする。[1][2][14][17]
- 8. `src/cli.ts` の `createRunner` 呼び出しに `workDir: cwd` を渡す。[21]
- 9. `src/174.test.ts` を書く。[24]
- 10. 既存の `src/*.test.ts` の期待を、この設計に合わせて直す。[25]
- 11. 正本への差分を同じ作業ツリーの `docs/canonical/runner.md` に反映する。[23]

## 関係する課題

- #173（作業ごとのコミットと `done`。再開時も `done` が真の作業は起動しない）
- #6（課題ランナー）
- #81（着手コメントとクローン識別子。再開は最新の着手の識別子を見る）
- #95（`process` 失敗の括弧行。再開失敗では括弧行を書かない）
- #151（`poll` が仕事を返したあとの `task-` 削除。再開はそのより前）

#81 の「いちばん古い着手で続ける」は、新しい着手の排他のままである。本設計は、落ちた実装を同じクローンが再開するときだけ、最新の着手の識別子を見る。

#95 の `process` 失敗は、理由のあと括弧行を書き、`commentFailure` を呼ぶ。再開のやり直しが失敗したときは、`<番号>: <理由>` の一行だけを書き、括弧行も `commentFailure` も呼ばない。

#151 の削除は、`poll` が仕事を返したあとである。起動時の再開は、その削除より前であり、再開対象のローカル `task-<番号>` を消さない。

## 正本への差分

### 変更 runner REQ-575

もとになった課題は #174 である。

識別子は、`createRunner` に渡す作業ディレクトリの `.sdd-cur/clone-id` に永続化する。ファイルが無いときは、`node:crypto` の `randomUUID` で一つ作り、その文字列を書く。あるときは、新しく作らず、読んだ文字列を使う。一行だけであり、前後の空白を除いたあと、空でなく空白を含まないときだけその文字列を使う。除いたあと空、または空白を含むときは、無いときと同じく新規作成して上書きする。再起動後も同じ文字列である。ログイン名ではない。環境変数からは読まない。同じ `createRunner` の呼び出しのあいだは変えない。同じアカウントの二つのプロセスは、作業ディレクトリが違えば別の識別子を持ちうる。

- シナリオ: 条件: 作業ディレクトリに `.sdd-cur/clone-id` が無い 主体: `createRunner` 結果: 新しい識別子をファイルへ書き、その文字列を使う

- シナリオ: 条件: `.sdd-cur/clone-id` に有効な一行がある 主体: 次の `createRunner` 結果: 同じ文字列を使う

### 追加 runner REQ-948

もとになった課題は #174 である。

`sdd-cur run` の起動時、`runLoop` は `while` で `poll` を繰り返すより前に、再開の探索とやり直しを一度だけ行う。対象が無いときは失敗にせず、いつもどおり `poll` と `process` を繰り返す。同じプロセスのあいだ、二度目以降の `poll` の前には再開しない。

- シナリオ: 条件: 再開の対象が無い 主体: `runLoop` 結果: 失敗にせず `poll` に入る

### 追加 runner REQ-949

もとになった課題は #174 である。

再開の探索は、開いていてラベルに「実装中」がある課題を列挙する。`isQuickTarget(issue)` が真の課題は候補に含めない。最新の着手コメントのクローン識別子が、このクローンの識別子と一致しない課題は候補に含めない。着手コメントが無い課題は候補に含めない。head が `task-<番号>` のマージリクエストが一件でもある課題は候補に含めない。件数には `state` が `open` でないマージリクエストも含む。ローカルに `task-<番号>` が無い課題は候補に含めない。失敗にもしない。候補が二件以上あるときは、課題番号の昇順で先頭一件だけをやり直す。残りは、この起動ではやり直さない。

- シナリオ: 条件: 条件を満たす課題が 174 と 200 がある 主体: 起動時の再開 結果: 174 だけをやり直す

- シナリオ: 条件: head が `task-<番号>` のマージリクエストが一件ある 主体: 起動時の再開 結果: その課題は候補に含めない

### 追加 runner REQ-950

もとになった課題は #174 である。

起動時のやり直しは、`runQuick` を呼ばない。`runFixProcess` を呼ばない。再開を始めるとき `editLabels` を呼ばない。作業ブランチは、ローカルの `task-<番号>` を `git checkout` するだけである。`fetch` して `checkout -B` で `FETCH_HEAD` に合わせない。そのあとの実装の agent 起動は、`runImplementation` と同じ `runAgentWithHeadCheck` と `deps.agent.implement` である。`done` が真の作業の実装作成役は起動しない。成功したあとは、今の実装と同じく push し、マージリクエストを作り、「実装中」を外して「実装完了」を付ける。課題は閉じない。

- シナリオ: 条件: 起動時のやり直しが成功した 主体: 課題ランナー 結果: マージリクエストを作り「実装完了」を付ける

### 追加 runner REQ-951

もとになった課題は #174 である。

起動時のやり直しが失敗したとき、終了コードは 1 である。ラベル「実装中」は付いたままである。「実装完了」は付けない。「実装依頼」は付けない。標準エラーへ書くのは、行全体が `<番号>: <理由>` である一行だけである。`<番号>` は十進で先頭の零は付けない。かかった時間と起動回数の括弧だけの一行は書かない。課題コメントは投稿しない。同じ課題を、そのプロセスの中で再び再開しない。他の候補も、その止まりでは再開しない。ローカルの `task-<番号>` は削除しない。

- シナリオ: 条件: 起動時のやり直しが agent の失敗で止まった 主体: `sdd-cur run` 結果: 標準エラーは `<番号>: <理由>` の一行だけである

### 追加 runner REQ-952

もとになった課題は #174 である。

作業のコミットを、実装の agent が戻る前に push しない。別のクローンが同じ課題を再開するための途中 push は行わない。

- シナリオ: 条件: 作業ごとのコミットだけがローカルにある 主体: 課題ランナー 結果: push は実装の agent が戻ったあとの一回のままである

### 追加 runner REQ-953

もとになった課題は #174 である。

テストは `src/174.test.ts` に書く。起動時の再開と識別子の永続化を、注入した依存で確かめる。そのテストは `gh` を起動しない。

- シナリオ: 条件: `bun test` を実行する 主体: 開発者 結果: `src/174.test.ts` が `gh` を起動しない
