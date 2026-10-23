# 151 処理開始前にローカルブランチを削除する

<!-- sdd-cur:form -->

対象は [Issue #151](https://github.com/paterapatera/sdd-cur/issues/151)。ランナーをずっと起動していると、ローカルに対応済みのブランチが大量に残る。毎回、処理の開始前に、名前が `task-` で始まるローカルブランチを削除する。

## 受け入れ条件

- 1. 条件: チェックアウト中のブランチが `task-` で始まらず、名前が `task-` で始まるローカルブランチがある 主体: `deleteLocalTaskBranches` 結果: そのブランチを `deleteLocalBranch` で一つずつ削除する
- 2. 条件: チェックアウト中のブランチが `task-` で始まり、`hasChanges` が偽であり、名前が `task-` で始まるローカルブランチがある 主体: `deleteLocalTaskBranches` 結果: そのブランチを `deleteLocalBranch` で一つずつ削除する
- 3. 条件: `runLoop` で `poll` が仕事を返し、`shouldStop` が偽であり、`deleteLocalTaskBranches` が `proceed` で戻った 主体: `runLoop` 結果: その戻りよりあとで `処理を開始します: <id>` を書き、そのあと `process` を `{ skipWork: false }` で呼ぶ
- 4. 条件: `runLoop` で `poll` が仕事を返した 主体: `runLoop` 結果: `処理を開始します: <id>` を書き、`process` を呼ぶ
- 5. 条件: チェックアウト中のブランチが `task-` で始まり、`hasChanges` が真である 主体: `runLoop` 結果: `localBranchNames` と `deleteLocalBranch` を呼ばず、`logError` を呼ばず、`処理を開始します: <id>` を書き、`process` を `{ skipWork: true }` で呼ぶ
- 6. 条件: `process` の第 2 引数の `skipWork` が真である 主体: `process` 結果: `resetLaunchCounts` のあと `getIssue` を呼ばずに戻る
- 7. 条件: `deleteLocalTaskBranches` が拒否した 主体: `runLoop` 結果: 既存の `errorLine` の戻り値を `logError` へ一行渡す。この一行は `処理を開始します: <id>` より前である。そのあと `処理を開始します: <id>` を書き、`process` を `{ skipWork: true }` で呼ぶ
- 8. 条件: 受け入れ条件 5 または 7 の `process` が戻った 主体: `runLoop` 結果: `commentFailure` を呼ばない。終了コードを 1 にしない。`処理を終了します` を書く。次の `poll` を呼ぶ
- 9. 条件: 名前が `task-` で始まるローカルブランチが無い 主体: `deleteLocalTaskBranches` 結果: 拒否しない。`deleteLocalBranch` を呼ばない
- 10. 条件: `process` の第 2 引数が無い、または `skipWork` が偽である 主体: `process` 結果: `getIssue` を呼ぶ
- 11. 条件: `poll` が `null` を返した 主体: `runLoop` 結果: `deleteLocalTaskBranches` を呼ばない
- 14. 条件: 名前が `task-` で始まらないローカルブランチがある 主体: `deleteLocalTaskBranches` 結果: その名前では `deleteLocalBranch` を呼ばない
- 18. 条件: `runLoop` が削除または見送りの手順を行う 主体: `runLoop` 結果: かかった時間の起点は `処理を開始します` を書いたあとである。削除の時間は含めない
- 19. 条件: この課題のテストを足す 主体: テスト 結果: `src/151.test.ts` が受け入れ条件 1、2、3、4、5、6、7、8、9、10、11、14、18 をカバーする。既存の `src/*.test.ts` には新しい `test` を足さない

## 範囲外

- リモートブランチと `refs/remotes` の削除
- 名前が `task-` で始まらないローカルブランチの削除
- `git push`、削除の手順の中の `fetch`
- `checkoutFetched` の変更
- `export type GitClient` へのメソッド追加
- `run` 以外のサブコマンド
- 削除の失敗を課題コメントに書くこと
- 削除の失敗で終了コードを 1 にすること
- 見送りのあとに間隔を足すこと
- `処理を開始します` と `処理を終了します` の文言を変えること
- かかった時間の起点を、`処理を開始します` より前へ動かすこと
- `src/cli.ts` の `logError` を変えること
- スキル、エージェント、要件ファイル、この課題以外の設計
- 依存パッケージ

## 決定

| 項目 | 内容 |
|---|---|
| 関数 | `src/run.ts` から export する `deleteLocalTaskBranches(git: LocalTaskBranchGit)`。戻り値の型は `"proceed"` と `"skip"` のユニオンである |
| 呼び出し | `runLoop` が、`item` があるとき、`処理を開始します` より前に呼ぶ。`poll` が `null` のときは呼ばない |
| 戻り | 未コミットの `task-` のときは `skip`。削除したものが無いときと、削除が終わったときは `proceed`。失敗は拒否する |
| 手順 | `currentBranch`。チェックアウト中が `task-` で始まり、`hasChanges` が真なら `skip`。`localBranchNames` から `task-` で始まる名前だけを残す。空なら `proceed`。残った名前を `deleteLocalBranch` で一つずつ呼ぶ |
| 失敗 | 拒否した時点で戻る |
| `runLoop` の失敗 | `deleteLocalTaskBranches` が拒否したときの `catch` で、既存の `errorLine` を `logError` へ渡す。`skipWork` を真にする。この見送りでは `commentFailure` を呼ばない。終了コードは 1 にしない |
| `process` | 第 2 引数は `{ skipWork: boolean }` で、省略できる。先頭で既存の `resetLaunchCounts?.()` を呼ぶ。`skipWork` が真なら、そのあと `getIssue` を呼ばずに戻る。省略と偽は既存の本体へ進む |
| 進行 | `deleteLocalTaskBranches` が `proceed` のとき、`process(item, { skipWork: false })` |
| 見送り | `skip` で戻ったときと、拒否したときのどちらも `process(item, { skipWork: true })`。戻ったあとは既存どおり `処理を終了します` を書き、間隔を待たずに次の `poll` へ進む |
| 時刻 | `startedAt` を取る位置は、開始の行を書いたあと、今の位置のままである |
| git の型 | `export type GitClient` は変えない。`currentBranch` と `hasChanges` は既存のままである。ローカルブランチ名の列挙と、名前を一つ指定してローカルブランチを削除できる操作は `createGit` の戻り値に足す |
| `run` | `src/cli.ts` は、今作っている `createGit` の戻り値を `runLoop` の `git` に渡す。`logError` は変えない |
| 既存テストの git | `currentBranch` は `main` を返す。`localBranchNames` は空配列を返す。`hasChanges` は偽を返す。`deleteLocalBranch` は呼ばれたら拒否する |

`LocalTaskBranchGit` は `src/run.ts` から export する。メソッドは `currentBranch(): Promise<string>`、`hasChanges(): Promise<boolean>`、`localBranchNames(): Promise<readonly string[]>`、`deleteLocalBranch(name: string): Promise<void>` である。

削除が `proceed` で終わったあと、本処理は既存の `checkoutFetched` で作業ブランチを `FETCH_HEAD` からチェックアウトする。`checkoutFetched` は変えない。見送りのときは `getIssue` に進まないので、`checkoutFetched` は呼ばない。

`task-` で始まらないブランチ上に未コミットの変更があっても、削除は行い、見送りにはしない。

## 正本への差分

### 追加 runner REQ-899

もとになった課題は #151 である。

`runLoop` で `poll` が仕事を返したとき、`処理を開始します` を書くより前に、名前が `task-` で始まるローカルブランチをすべて削除する。この削除は `process` を呼ぶより前であり、`checkoutFetched` より前である。`poll` が `null` のときは削除しない。チェックアウト中のブランチが `task-` で始まり、かつ未コミットの変更があるときは削除しない。未コミットの変更があるとは、既存の `hasChanges` が真のときである。チェックアウト中のブランチが `task-` で始まらないときは、未コミットの変更があっても削除する。名前が `task-` で始まるローカルブランチが無いときは、削除の失敗にしない。

### 追加 runner REQ-900

もとになった課題は #151 である。

`poll` が仕事を返したときは、削除をしないときも、削除が失敗したときも、`処理を開始します: <id>` を書き、`process` を呼ぶ。チェックアウト中のブランチが `task-` で始まり未コミットの変更があるときと、削除の手順が失敗したときは、`process` の第 2 引数の `skipWork` は真である。それ以外で `process` を呼ぶときは `skipWork` は偽である。`skipWork` が真のとき、`process` は `resetLaunchCounts` のあと `getIssue` を呼ばずに戻る。この戻りは失敗ではない。`commentFailure` は呼ばない。終了コードは 1 にしない。`処理を終了します` を書く。次の `poll` を呼ぶ。見送りのあとに間隔は足さない。かかった時間の起点は、`処理を開始します` を書いてから測る既存の区間のままである。削除にかかった時間は含めない。

### 追加 runner REQ-901

もとになった課題は #151 である。

削除の手順の git 操作が失敗したときは、既存の `errorLine` の戻り値を `logError` へ一行渡す。この一行は `処理を開始します` より前である。`process` は `{ skipWork: true }` で呼ぶ。

## 変えるファイル

- src/run.ts
- src/runner.ts
- src/git.ts
- src/cli.ts
- src/run.test.ts
- src/95.test.ts
- src/151.test.ts
- docs/canonical/runner.md

## 作業の一覧

- 1. `src/run.ts` に `LocalTaskBranchGit` と `deleteLocalTaskBranches` と、`runLoop` からの呼び出しを書く [1][2][3][4][5][7][8][9][11][14][18]
- 2. `src/runner.ts` の `process` が、`skipWork` が真のとき `resetLaunchCounts` のあと戻る [6][10]
- 3. `src/git.ts` で、名前を一つ指定してローカルブランチを削除できるようにする [1][14]
- 4. `src/cli.ts` の `run` が、同じ `createGit` の戻り値を `runLoop` の `git` に渡す [3]
- 5. `docs/canonical/runner.md` を「正本への差分」の追加どおりに書く [3][8][18]
- 6. `src/run.test.ts` と `src/95.test.ts` の `runLoop` の引数に、削除が起きない `git` を足す [19]
- 7. `src/151.test.ts` を追加する [1][2][3][4][5][6][7][8][9][10][11][14][18][19]

## テスト

- `src/151.test.ts` の `deleteLocalTaskBranches` は、チェックアウト中が `main` で `task-10` と `task-2` と `main` があるとき、`deleteLocalBranch` を `task-10` と `task-2` に呼ぶ。`main` には呼ばない [1][14]
- `src/151.test.ts` の `deleteLocalTaskBranches` は、チェックアウト中が `task-2` で未コミットが無く `task-10` と `task-2` があるとき、`deleteLocalBranch` をその二つに呼ぶ [2]
- `src/151.test.ts` の `runLoop` は、`deleteLocalTaskBranches` が `proceed` で戻るとき、そのあと `処理を開始します: <id>` を書き、`process` を `{ skipWork: false }` で呼ぶ [3][4]
- `src/151.test.ts` の `runLoop` は、チェックアウト中が `task-2` で未コミットがあるとき、一覧と削除と `logError` を呼ばず、`処理を開始します: <id>` を書き、`process` を `{ skipWork: true }` で呼ぶ [4][5]
- `src/151.test.ts` の `process` は、`skipWork` が真のとき `resetLaunchCounts` のあと `getIssue` を呼ばない [6]
- `src/151.test.ts` の `runLoop` は、`deleteLocalTaskBranches` が拒否したとき、`errorLine` の戻りを `処理を開始します` より前に `logError` へ渡し、`process` を `{ skipWork: true }` で呼ぶ [4][7]
- `src/151.test.ts` の `runLoop` は、未コミットの見送りと削除の失敗の見送りの両方で、`commentFailure` を呼ばず、終了コードを 1 にせず、`処理を終了します` を書き、次の `poll` を呼ぶ [8]
- `src/151.test.ts` の `deleteLocalTaskBranches` は、`task-` で始まる名前が無いとき拒否せず、`deleteLocalBranch` を呼ばない [9]
- `src/151.test.ts` の `process` は、第 2 引数が無いときと `skipWork` が偽のときに `getIssue` を呼ぶ [10]
- `src/151.test.ts` の `runLoop` は、`poll` が `null` のとき `deleteLocalTaskBranches` を呼ばない [11]
- `src/151.test.ts` の `runLoop` は、開始の行を書いたあとに時刻を取り、削除の前には取らない [18]
- この課題で足す `test` は `src/151.test.ts` だけである。`src/run.test.ts` と `src/95.test.ts` は、`runLoop` の引数に削除が起きない `git` を足すだけで、新しい `test` は足さない [19]

## 関係する課題

- #6（課題ランナーが、対象の課題を取って処理する）
- #95（処理の開始に `処理を開始します: <id>` を書く）
