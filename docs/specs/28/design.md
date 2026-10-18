# 28 動作確認の不具合を PR のコメントに書くとランナーが修正する

対象は [Issue #28](https://github.com/paterapatera/sdd-cur/issues/28)。動作確認で見つけた不具合を、人がマージリクエストの会話コメントに書くと、課題ランナーが修正する。

## 受け入れ条件

- 修正のきっかけは、人がマージリクエストの会話コメントに書いた不具合である。人は、修正のためにラベルを付けない。
- `poll` の優先順は、(1) 実装依頼、(2) 未処理の不具合、(3) 動作確認OK である。(3) は `sdd-cur.completion` が `runner` のときだけであり、既存の完了の探索と同じである。(2) は、完了の呼び出し元が `runner` であるかどうかにかかわらず探す。
- 不具合の探索対象は、自身がアサインされた課題だけである。自身は、`gh` でログインしている利用者である。ラベルは「実装完了」があり、「実装中」が無く、「動作確認OK」が無く、「マージ済み」が無い。
- 未処理の不具合がある課題が複数あるときは、課題番号の昇順で、いちばん小さい番号を 1 件だけ着手する。
- head が `task-<番号>` のマージリクエストが 0 件のときは、その課題をスキップする。2 件以上のときは `マージリクエストを特定できません` で拒否し、`run` を停止する。1 件で open のときだけ、会話コメントを読む。merged または closed であり open でない 1 件はスキップする。
- 不具合の印は `sdd-cur: 不具合`、修正の印は `sdd-cur: 修正` である。最初の非空行が印と一文字も違わないとき、その種別である。未処理とは、どの修正コメントの fixed ブロックにも、その不具合コメントの id が無いことである。着手のときに未処理であるものを、一度に処理する。
- 修正が終わったら、マージリクエストの会話コメントを 1 つ書く。末尾の fixed ブロックの印は `sdd-cur:fixed` である。直した不具合も、範囲外で直さなかった不具合も、この id に含める。
- 新しいラベルは作らない。開始で「実装完了」を外し「実装中」を付ける。終了で「実装中」を外し「実装完了」を付ける。
- 修正は、その課題の要件と設計の範囲内だけである。範囲外は、修正コメントの本文に `設計の範囲外のため直していない` と 1 行書く。すべて範囲外でコミットが無いときは失敗にしない。範囲内があるのに作業ツリーの変更が無いときは `実装の変更がありません` で失敗し、修正コメントは書かず、ラベルは「実装中」のままである。
- 課題の受け入れ手順コメントは書き直さない。再確認の手順は、修正コメントの本文に書く。
- 読むコメントと書くコメントは、マージリクエストの会話コメントだけである。
- 範囲内の変更は、`task-<番号>` に `fix: 課題 <番号> の不具合を修正する` でコミットし、そのマージリクエストに載せる。
- 修正のスキルは `skills/sdd-cur-fix/` に置く。ランナーは、不具合の本文と、結果を書く一時ファイルを agent に渡す。一時ファイルの扱いは、受け入れ手順の一時ファイルと同じである。
- `docs/plan.md` の未決の 1 項目目を解消する。未決の 2 項目目は残す。
- `bun test` は `gh`、`git`、`agent` を起動しない。

## 範囲外

次は作らない。

- 「実装依頼」から最初の「実装完了」までの手順の詳細。受け入れ手順コメントの初回の投稿（#6）。`runImplementation` の順は、設計 27 のままである
- 完了処理。スカッシュマージと「マージ済み」（#7）。`completeIssue` の順は、設計 7 と設計 18 のままである
- 受け入れ手順の置き場を変えること（#29）
- Project A の Cursor で不具合を直すこと
- #13 を閉じること
- レビューコメントと、レビュー本文。`reviews` は取らない
- 新しいラベルを作ること。`src/labels.ts` は変えない
- 「動作確認OK」を付けること。付けるのは人である
- 課題の作成とクローズ。`issue close` と `--state` は付けない
- 計画の未決の 2 項目目。完了処理を、課題ランナーと Cursor のどちらから呼ぶか
- 確認、回答、受け入れ手順、反映済みの規則を変えること。`parseComment`、`relateComments`、`readReflectedIds`、`commentMarkers` の三つの印は変えない
- ブランチ名を変えること。名前は `implementationBranch` の `task-<番号>` のままである（#17）
- `sdd-cur-implement` に入力を足すこと。`skills/sdd-cur-implement/` と `agents/sdd-cur-implement-*.md` は変えない
- 修正スキルの中のレビュー周回。実装レビュー（#22、#30）は、このスキルへコピーしない
- 新しいエージェントファイル。`subagentFileNames` は変えない
- 新しいブランチ、新しいマージリクエスト、スカッシュマージ
- 失敗した作業ツリーの復元。`process` 全体の最初からのやり直し
- `listIssues` の 101 件目以降。ヘッドが一致するマージリクエストの 101 件目以降。どちらも `limit` は 100 のままである
- `src/run.ts` のループ。`WorkItem` は `{ id: string }` のままである
- `src/git.ts`、`src/sdd.ts`、`src/complete.ts`、`src/cli.ts` の引数。`createAgent` の戻りに `fix` が増えると、既存の組み立てのまま `createRunner` に渡る
- `install` のコピー規則。`skills/` 直下のディレクトリをコピーする既存の動作のままである
- README、AGENTS.md、既存の `design.md` の書き換え
- Forgejo、Jira、Backlog
- 依存パッケージ。トークンと環境変数の読み取り。`git config` の変更
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| 優先 | `poll` は仕事を一つ返す。実装依頼、未処理の不具合、動作確認OK の順である。先の段に該当があるときは、後の段を探さない。処理のあいだは次の `poll` を呼ばない |
| 不具合の探索 | 完了の呼び出し元にかかわらず行う。`viewerLogin` は、この `poll` で一回である。後の段もその login を使う |
| 自身 | 設計 24 のとおり、`viewerLogin` の login と assignees の完全一致である |
| ラベル | 「実装完了」がある。「実装中」「動作確認OK」「マージ済み」が無い。人は修正のためにラベルを付けない |
| 件数 | 課題もマージリクエストも `limit` は 100 である。head は `implementationBranch` の戻り値である。件数の見方は、`completeIssue` が `listPullRequests` の配列の長さを見るときと同じである |
| 0 件と open でない | その課題をスキップし、次の番号を見る。会話コメントは読まない |
| 2 件以上 | `マージリクエストを特定できません` で拒否する。次の課題も、動作確認OK も見ない。`run` は終了コード 1 で止まる |
| open が 1 件 | そのマージリクエストの会話コメントだけを読む。未処理があれば、その課題を返す。無ければスキップする |
| 処理の単位 | 不具合コメントの id である。1 コメントに複数の不具合を書いてよい。着手のときに未処理である id を、一度の修正でまとめて処理する |
| 記録 | 修正コメントを 1 つ書く。末尾の fixed に、その id をすべて記録する。範囲外で直さなかった id も含める |
| ラベルの遷移 | 新しいラベルは作らない。開始の一回の `editLabels` で「実装完了」を外し「実装中」を付ける。修正コメントのあと、一回の `editLabels` で「実装中」を外し「実装完了」を付ける |
| 範囲 | その課題の要件と設計の範囲内だけを直す。設計に無い挙動は直さない。範囲外の理由は、修正コメントの本文の 1 行 `設計の範囲外のため直していない` である |
| 変更が無い | その 1 行だけの本文であり、作業ツリーの変更が無いときは、失敗にしない。コミットも push もしない。修正コメントは書き、ラベルは「実装完了」に戻す。それ以外で変更が無いときは `実装の変更がありません` で失敗する。修正コメントは書かず、ラベルは「実装中」のままである |
| 受け入れ手順 | 課題コメントの `sdd-cur: 受け入れ手順` は書き直さない。再確認の手順は、修正コメントの本文に書く |
| ブランチ | `task-<番号>` にコミットし、同じマージリクエストに載せる。新しいブランチも新しいマージリクエストも作らない。スカッシュマージはしない。課題は閉じない |
| コミット | 変更があるときだけ、`fix: 課題 <番号> の不具合を修正する` |
| スキル | `skills/sdd-cur-fix/SKILL.md`。agent は `/sdd-cur-fix` で起動する。結果の一時ファイルは、受け入れ手順と同じ `createProcedureFile` である |
| エージェント | 新しくファイルは作らない。範囲内を作業ツリーへ書くときに、`sdd-cur-implement-author` を流用する。`model` は渡さない |
| 計画 | 未決の 1 項目目を消し、不合格のときは人がマージリクエストに不具合を書き、課題ランナーが直す、と本文に書く。未決の 2 項目目は残す |
| 失敗 | 理由は一行である。外部呼び出しは、拒否したその呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まり、成功した呼び出しはやり直さない。ラベルを戻すのは、修正コメントを書いたあとの終了だけである |
| ラベル名 | `workflowLabels` の `name` だけを使う。別の字面で再定義しない |

ラベル名は、この表では課題の文言で書く。実装は `workflowLabels` から取る。

## 約束

`docs/conventions.md` の、課題コメントの種別、反映済み、未反映は、文も印も変えない。ファイルの末尾に、次の二つの節をこの順で足す。

### マージリクエストの会話コメント

不具合と修正は、マージリクエストの会話コメントだけに書く。課題のコメント、要件、設計、コミットメッセージには書かない。

コメントの最初の非空行が、次の印と一文字も違わないとき、その種別になる。印の行の前後に空白があれば、種別は付かない。判定は、課題コメントの印と同じ規則である。

| 種別 | 印 |
|---|---|
| 不具合 | `sdd-cur: 不具合` |
| 修正 | `sdd-cur: 修正` |

印の行より後ろが本文である。1 コメントに複数の不具合を書いてよい。処理の単位は、コメントの id である。

確認、回答、受け入れ手順の印と、課題コメントの規則は、変えない。

### 処理済みの不具合

修正コメントの末尾に、その修正で処理した不具合コメントの `id` だけを記録する。形は、反映済みの記録と同じである。印だけが `sdd-cur:fixed` である。

記録の例:

```
<!-- sdd-cur:fixed
IC_kwDOExample123
-->
```

どの修正コメントのこの記録にも `id` が無い不具合コメントが、未処理である。

`sdd-cur:reflected` は、要件と設計のファイルに書く、反映済みの回答の記録のままである。`sdd-cur:fixed` は、マージリクエストの修正コメントに書く。

## 種別と fixed

`src/conventions.ts` に足す。課題コメント用の `commentMarkers`、`parseComment`、`relateComments`、`readReflectedIds`、`withReflectedId` は変えない。

```ts
export const pullRequestCommentMarkers = {
  bug: "sdd-cur: 不具合",
  fix: "sdd-cur: 修正",
} as const

export const fixedMarker = "sdd-cur:fixed"
export const fixedOpenLine = `<!-- ${fixedMarker}`
export const fixedCloseLine = "-->"

export type PullRequestCommentKind = "bug" | "fix" | "other"

export type ParsedPullRequestComment = {
  kind: PullRequestCommentKind
  payload: string
}

export function parsePullRequestComment(body: string): ParsedPullRequestComment

export function readFixedIds(body: string): string[]

export function selectUnprocessedBugs(
  comments: readonly IssueComment[],
): IssueComment[]

export function fixComment(payload: string, ids: readonly string[]): string
```

`parsePullRequestComment` は、`parseComment` と同じ手順である。改行を `\n` にそろえ、空行を飛ばした最初の行が印と完全一致するとき、その種別である。その行より後ろを `payload` にする。一致しないときは `other` であり、`payload` はそろえた本文全体である。印の行に、印以外の文字があるときは `other` である。前後の空白を除いて比べない。

`readFixedIds` の解釈は、`readReflectedIds` と同じである。開始行だけが `<!-- sdd-cur:fixed` である。開始行が無いときは `[]` である。開始行が二つ以上のときは `修正の記録が複数あります` で拒否する。閉じ行が無いとき、id が空、前後に空白がある、空白か `<` か `>` を含むとき、id が重複するとき、閉じ行より後ろに非空行があるときは `修正の記録を解釈できません` で拒否する。ブロックの中の空行は飛ばす。id の順は、ブロックの中の順である。

`selectUnprocessedBugs` は引数の配列も要素も変えない。`createdAt` の昇順、同じときは `id` の昇順で見る。この順は、課題コメントの `relateComments` と同じである。種別が修正のものにだけ `readFixedIds` を使い、id の集合を作る。種別が不具合で、その id が集合に無いものを、同じ順で返す。修正以外の本文にある fixed ブロックは、処理済みに数えない。`readFixedIds` が拒否したときは、その理由のまま拒否する。次のコメントでは取り戻さない。

`fixComment` は、次のとき拒否する。GitHub は呼ばない。

| 条件 | 理由 |
|---|---|
| `payload` の前後の空白を除いて空 | `修正コメントが空です` |
| 空でない最初の行が、確認、回答、受け入れ手順、不具合、修正のどれかと完全一致 | `修正コメントに印を含めない` |
| いずれかの行が `fixedOpenLine` と完全一致 | `修正コメントに印を含めない` |
| `ids` が空 | `修正する不具合がありません` |
| id が、`readFixedIds` の id の規則を満たさない | `修正するコメントが不正です` |
| `ids` に同じ id が二度ある | `修正の記録を解釈できません` |

成功時は、`pullRequestCommentMarkers.fix`、`\n`、渡された `payload` を連結する。`payload` の空白は削らない。末尾が改行でなければ改行を一つ足し、そのあとに fixed ブロックを足す。ブロックは、開始行、`ids` の各行、閉じ行、末尾の改行である。`ids` の順は、渡された順のままである。

## マージリクエストの会話コメント

`GitHubClient` に次を足す。既存の操作の引数と、課題の `listComments`、`addComment` は変えない。

```ts
listPullRequestComments(number: number): Promise<IssueComment[]>
addPullRequestComment(number: number, body: string): Promise<{ url: string }>
```

どちらも、番号が 1 以上の整数でないとき `番号が不正です` で拒否し、`gh` を呼ばない。

`listPullRequestComments` は、`createGitHub` の repo で、次を一回呼ぶ。

```
pr
view
<number>
--repo
<repo>
--json
comments
```

標準入力は渡さない。応答の `comments` が無いときは `[]` である。配列でないとき、要素を課題コメントと同じ正規化で解釈できないときは `gh の応答を解釈できません` で拒否する。正規化は `listComments` と同じであり、`id` は文字列、`createdAt` は文字列、`body` は文字列、`author` は login である。レビューコメントは、この配列に含まれない。

`addPullRequestComment` は、本文の前後の空白を除いて空のとき `コメント本文が空です` で拒否し、`gh` を呼ばない。空でないときは、次を一回呼ぶ。標準入力は本文である。

```
pr
comment
<number>
--repo
<repo>
--body-file
-
```

標準出力の最初の非空行が `https://` で始まるとき、その行を `url` にして返す。そうでないときは `gh の応答を解釈できません` で拒否する。課題の `issue comment` は呼ばない。

終了コードが 0 以外のときは、既存の `gh` の失敗理由のまま拒否する。起動できないときは `gh を実行できません` である。

## 探索

```ts
export function issueHasFixLabels(issue: Issue): boolean

export function selectFixIssues(
  issues: readonly Issue[],
  login: string,
): Issue[]

export function classifyFixPullRequests(
  pullRequests: readonly PullRequest[],
):
  | { kind: "none" }
  | { kind: "ambiguous" }
  | { kind: "not-open" }
  | { kind: "open"; pullRequest: PullRequest }
```

三つとも引数の配列を変えない。

`issueHasFixLabels` は、ラベルの完全一致で、次のすべてを満たすときだけ `true` である。

- 「実装完了」がある
- 「実装中」が無い
- 「動作確認OK」が無い
- 「マージ済み」が無い

`selectFixIssues` は、`issueHasFixLabels` を満たし、`assignees` に `login` が完全一致で含まれる課題だけを残す。残った配列を `number` の昇順で並べて返す。空なら空の配列である。`assignees` が空の課題は残らない。複数の assignees のうち `login` が一つでもあれば残る。

`classifyFixPullRequests` は、長さが 0 のとき `none`、2 以上のとき `ambiguous` である。この二つは、要素の `state` を見ない。長さが 1 で `state` が `open` のとき `open` であり、その要素を返す。長さが 1 で `open` でないときは `not-open` である。`merged` と `closed` は、どちらも `not-open` である。

`createRunner` の `github` に、`listPullRequestComments` と `addPullRequestComment` を足す。`agent` に `fix` を足す。

`poll` は、最初に `viewerLogin` を呼ぶ。拒否したときは、その呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まり、`listIssues` は呼ばない。

成功したときは、その login で、次の順に一つだけ仕事を返す。

1. `listIssues({ labels: ["実装依頼"], assignee: login, limit: 100 })` を呼び、`selectImplementationIssue` にその配列と login を渡す。`state` は渡さない。結果があれば、その番号を十進の `id` にして返す。このとき、不具合の `listIssues` と、動作確認OK の `listIssues` は呼ばない。
2. `listIssues({ labels: ["実装完了"], assignee: login, limit: 100 })` を呼び、`selectFixIssues` にその配列と login を渡す。`state` は渡さない。返った配列を先頭から見る。
3. 2 が空であり、`completionCaller` が `"runner"` のときだけ、これまでどおり `listIssues({ labels: ["動作確認OK"], assignee: login, limit: 100 })` を呼び、`selectCompletionIssue` に渡す。`state` は渡さない。それ以外の `completionCaller` では、この `listIssues` は呼ばない。`viewerLogin` は、もう一度呼ばない。

2 の各課題では、`head` を `implementationBranch` の戻り値にして `listPullRequests({ head, limit: 100 })` を呼ぶ。`classifyFixPullRequests` の結果で分岐する。

- `none` または `not-open` のときは、会話コメントを読まず、次の番号を見る。
- `ambiguous` のときは `マージリクエストを特定できません` で拒否する。この拒否は、`listPullRequests` が成功したあとに一度だけ行う。次の番号は見ない。3 も呼ばない。
- `open` のときは、その `pullRequest.number` で `listPullRequestComments` を呼ぶ。`selectUnprocessedBugs` の結果が 1 件以上のとき、その課題番号を十進の `id` にして返す。より大きい番号は見ない。結果が空のときは、次の番号を見る。

2 を最後まで見て該当が無ければ、不具合の仕事は無い。3 へ進む。3 も無ければ `null` である。

`viewerLogin`、各 `listIssues`、各 `listPullRequests`、各 `listPullRequestComments` は、拒否したときその呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まる。成功した呼び出しはやり直さない。スキップは、`none`、`not-open`、未処理が無いときだけである。取得の拒否と、fixed の解釈の拒否は、スキップしない。

`selectImplementationIssue` と `selectCompletionIssue` の判定は変えない。

## 修正

`process` は、`id` を番号にし、`getIssue` する。この順は変えない。番号でなければ `番号が不正です` である。

1. ラベルに「実装依頼」があり「実装中」が無いときは、`runImplementation` を呼び、戻る。この中では `fix` も `addPullRequestComment` も呼ばない。
2. `issueHasFixLabels` が `true` のときは、下の不具合の手順に入る。assignees は見ない。
3. `completionCaller` が `"runner"` であり、ラベルに「動作確認OK」があるときは、`completeIssue` を呼ぶ。
4. どれでもないときは、何もせず戻る。

2 では、`poll` と同じ `listPullRequests` と `classifyFixPullRequests` を使う。`none` または `not-open`、および open でも未処理が無いときは、`editLabels` も `agent` も呼ばず戻る。`ambiguous`、および `readFixedIds` の拒否は、ラベルを変える前に、その理由で拒否する。

未処理があるときは、その配列を着手時の不具合として `runFix` に渡す。あとから付いた会話コメントは、この一度には含めない。

`runFix` は次の順で、拒否した時点より後は呼ばない。作業ツリーの復元はしない。

1. 渡された id を、`fixComment` と同じ id の規則で確かめる。空、不正、重複のときは、その理由で拒否する。`editLabels` はまだ呼ばない。
2. `editLabels` で「実装完了」を外し、「実装中」を付ける。追加と削除は一回にまとめる。
3. リモートが一つでなければ `リモートを特定できません`。
4. ブランチ名は `implementationBranch` の戻り値である。そのリモートのブランチを `fetch` し、`FETCH_HEAD` を checkout する。`createBranch` も `getDefaultBranch` も呼ばない。
5. `createProcedureFile` で結果ファイルを作る。作業ツリーの外である。`agent.fix` に、課題番号、結果ファイルの絶対パス、着手時の不具合の id と本文を渡す。本文は `parsePullRequestComment` の `payload` である。一度拒否したときは、結果ファイルを残し、同じパスと同じ不具合でもう一度呼ぶ。
6. `fix` が成功したときは、結果ファイルを読み、`fixComment` に、その本文と着手時の id を渡す。id の順は、`selectUnprocessedBugs` の順である。読み終えたあとにファイルを消す。`fixComment` が拒否したときも消す。`fix` が二度拒否したときは、読まずにファイルを消す。
7. 作業ツリーに変更が無く、結果の本文が範囲外だけであるときは、コミットも push もしない。変更が無く、範囲外だけでもないときは `実装の変更がありません` で拒否する。変更があるときは、範囲外の 1 行が本文に含まれていても、メッセージ `fix: 課題 <番号> の不具合を修正する` で一件コミットし、そのリモートへ push する。
8. `addPullRequestComment` に、open のマージリクエスト番号と、`fixComment` の戻り値を渡す。課題の `addComment` は呼ばない。
9. `editLabels` で「実装中」を外し、「実装完了」を付ける。追加と削除は一回にまとめる。

範囲外だけとは、結果の本文の改行を `\n` にそろえたとき、空でない行がちょうど一つであり、その行が `設計の範囲外のため直していない` と一文字も違わないことである。空行は数えない。その行の前後に空白があるときは、範囲外だけではない。

6 で `fixComment` が拒否したとき、および 7 で `実装の変更がありません` のときは、8 と 9 を呼ばない。ラベルは「実装中」のままである。2 より前に戻ったときは、ラベルを変えていない。

2、3、4、5 の `fix`、7 の `hasChanges` と `commitAll` と `push`、8、9 は、拒否したときその呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まる。`fix` が二度拒否したとき、および `fixComment` が拒否したときは、コミット、`addPullRequestComment`、9 を呼ばない。8 が成功したあと 9 が二度拒否したときは、`addPullRequestComment` は一回のままである。

`createPullRequest` と `squashMerge` は呼ばない。

## agent

`createAgent` の戻りに `fix` を足す。`implement` の引数とプロンプトは変えない。

```ts
fix(input: {
  issueNumber: number
  resultPath: string
  bugs: readonly { id: string; payload: string }[]
}): Promise<void>
```

番号が 1 以上の安全な整数でないときは `番号が不正です` で、`run` を呼ばない。`resultPath` が空、前後の空白と違う、空白か改行を含むときは `修正結果のパスが不正です` で、`run` を呼ばない。`bugs` が空のときは `修正する不具合がありません`、id が fixed の規則を満たさないときは `修正するコメントが不正です`、id が重複するときは `修正の記録を解釈できません` で、`run` を呼ばない。`payload` は空でもよい。

成功時の引数は、この順の配列である。`implement` と同じ八要素であり、最後だけが違う。

```
-p
--force
--trust
--workspace
<cwd>
--output-format
text
/sdd-cur-fix <番号> <結果パス>
<JSON>
```

最後の要素は一つの文字列である。1 行目は、スキル名、空白一つ、十進の番号、空白一つ、結果パスを連結する。2 行目は、`bugs` を JSON の配列にしたものである。要素のキーは `id`、`payload` の順であり、配列の順は渡された順である。子プロセスの作業ディレクトリは `cwd` である。標準出力は、終了コード 0 のとき読まない。`--api-key` は付けない。

起動できないときは `agent を実行できません` で拒否する。終了コードが 0 以外のときの理由は、`implement` と同じ順で、最後は `agent が失敗しました` である。トークンも環境変数も読まない。

結果ファイルは、`createProcedureFile` が作る。名前は `procedure.txt` のままである。不具合の本文用のファイルは作らない。本文は、上のプロンプトの JSON で渡す。`remove` は、そのディレクトリを消す。

## スキル

`skills/sdd-cur-fix/SKILL.md` の先頭は、次のフロントマターと一致する。

```yaml
---
name: sdd-cur-fix
description: クローンの作業ツリーで、指定された課題の不具合を要件と設計の範囲内で直し、修正コメントの本文を指定パスへ書く。課題ランナーが agent から起動する。
disable-model-invocation: true
---
```

本文の最初の見出しは `# sdd-cur-fix` である。そのあとに `## 修正` と `## 禁止` を、この順で置く。

`## 修正` では、プロンプトの 1 行目を空白で分け、課題番号と結果の絶対パスを取る。2 行目以降を JSON の配列として読む。要素は `id` と `payload` であり、この順を変えない。プロンプトがこの形でないときは、`不具合の指定を解釈できません` で失敗する。

`docs/specs/<番号>/requirements.md` と `docs/specs/<番号>/design.md` を読む。直してよいのは、その設計の受け入れ条件、決定、範囲の中だけである。設計に無い挙動は足さない。

`payload` が範囲外のものと、範囲内のものに分ける。

- すべて範囲外のときは、サブエージェントを起動しない。作業ツリーを変えない。結果ファイルには、`設計の範囲外のため直していない` の 1 行だけを書く。
- 範囲内が一つでもあるときは、`sdd-cur-implement-author` を名前で一度起動する。`model` は渡さない。渡すのは、範囲内の `payload` だけである。範囲外は直させない。既にある実装の、その不具合だけを直させる。作業ツリーを変えないときは、`実装の変更がありません` で失敗する。変えたあとは、親が結果ファイルへ本文を書く。再確認の手順を先に書く。範囲外が一つでもあるときは、最後の非空行を `設計の範囲外のため直していない` にする。この行は、範囲外がいくつでも 1 行である。

結果ファイルには、印の行も fixed ブロックも書かない。サブエージェントには、結果パスを渡さない。印の行は書かない。失敗のときは、終了コードを 0 以外にする。理由は日本語の一行であり、標準エラーの最初の非空行、それが空のときは標準出力の最初の非空行に書く。

`## 禁止` には、課題を作らない、課題を閉じない、ラベルを変えない、新しいラベルを作らない、コミットしない、push しない、マージリクエストを作らない、スカッシュマージしない、コメントを投稿しない、受け入れ手順を書き直さない、要求ファイルと設計ファイルは作らない、変えない、`gh` を直接起動しない、を書く。

`install` は、`skills/sdd-cur-fix/` を直下のディレクトリとして、既存の規則でコピーする。このスキル用のスクリプトは置かない。エージェントのファイルは増やさない。

## 計画

`docs/plan.md` の、次の三箇所だけを変える。業務フローの合格側、手順 14 から 16、図、未決の 2 項目目は変えない。

冒頭の、課題ランナーが行うことの文を、実装と、動作確認の不具合の修正と、選んだ場合の完了処理は、課題ランナーが別のクローンで行う、に変える。

作るものの表の、課題ランナーの役割を、`「実装依頼」の実装、動作確認の不具合の修正、「動作確認OK」の完了処理` に変える。

「実装の範囲」のあとに、次の節を足す。

```
## 受け入れが不合格のとき

受け入れテストが不合格のときは、人がマージリクエストの会話コメントに不具合を書く。人は、修正のためにラベルを付けない。課題ランナーが直す。ラベルは「実装完了」を外して「実装中」にし、修正が終わったら「実装中」を外して「実装完了」に戻す。合格したときの「動作確認OK」と完了処理は、変えない。
```

未決からは、不合格のときのラベルと、直す場所の項目を消す。残す項目は、次の一つである。

```
- 一つのプロジェクトで、完了処理を課題ランナーと Cursor のどちらから呼ぶか。両方を同時に有効にはしない。
```

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。`defaultGhRunner`、`defaultGitRunner`、`defaultAgentRunner` は呼ばない。ホームディレクトリと、実行中の Cursor のスキルは触らない。

`src/conventions.test.ts` に足す。

- `parsePullRequestComment` は、最初の非空行が `sdd-cur: 不具合` のとき `bug` であり、`payload` はその行より後ろである。`sdd-cur: 修正` のとき `fix` である。印の行に空白が一つでもあれば `other` であり、`payload` は本文全体である。
- `parseComment` は、最初の非空行が `sdd-cur: 不具合` でも `sdd-cur: 修正` でも `other` である。確認、回答、受け入れ手順の既存の期待は変えない。
- `readFixedIds` は、例のブロックから `IC_kwDOExample123` を返す。開始行が無いときは `[]` である。開始行が二つあるときは `修正の記録が複数あります` で拒否する。閉じ行が無いとき、id が不正なとき、id が重複するとき、閉じ行のあとに非空行があるときは `修正の記録を解釈できません` で拒否する。
- `selectUnprocessedBugs` は引数を変えない。修正コメントの fixed にある id の不具合は返さない。どの fixed にも無い不具合は返す。修正以外のコメントにある fixed は、処理済みに数えない。`createdAt` が古い不具合を先に返す。同じ `createdAt` のときは `id` の昇順である。
- `fixComment` は、空の payload を `修正コメントが空です` で拒否する。最初の非空行が五つの印のどれかのときは `修正コメントに印を含めない` で拒否する。`ids` が空のときは `修正する不具合がありません` で拒否する。成功時の最初の非空行は `sdd-cur: 修正` であり、payload の空白は残り、末尾の fixed を `readFixedIds` すると渡した id の順である。

`src/github.test.ts` に足す。

- `listPullRequestComments` は `pr view <number> --repo <repo> --json comments` を一回だけ呼ぶ。`comments` が課題コメントと同じ形のとき、`id`、`body`、`author`、`createdAt` を返す。`comments` が無いときは `[]` である。配列でないときは `gh の応答を解釈できません` で拒否する。
- `addPullRequestComment` は `pr comment <number> --repo <repo> --body-file -` を一回呼び、標準入力は本文である。`https://` で始まる行を `url` にして返す。空の本文は `コメント本文が空です` であり、`gh` を呼ばない。`issue comment` は呼ばない。

`src/agent.test.ts` に足す。

- `fix` は、不正な番号、空白を含む結果パス、空の `bugs`、不正な id では `run` を呼ばない。
- 成功時の引数は、上の八要素と一致し、最後の要素の 1 行目は `/sdd-cur-fix <番号> <結果パス>`、2 行目はその JSON である。`cwd` は渡した作業ディレクトリである。`--api-key` は無い。

`src/runner.test.ts` に足す。

- `selectFixIssues` は引数を変えない。「実装完了」が無い課題、「実装中」がある課題、「動作確認OK」がある課題、「マージ済み」がある課題、`assignees` に login が無い課題を除く。番号 `10` と `2` がどちらも条件を満たすときは、`2` が先である。
- `classifyFixPullRequests` は、0 件が `none`、2 件以上が `ambiguous`、1 件の `open` が `open`、1 件の `merged` と `closed` が `not-open` である。
- `poll` は、実装依頼があるとき、その課題を返し、ラベル「実装完了」の `listIssues` を呼ばない。`viewerLogin` は一回である。
- 実装依頼が無く、未処理の不具合があるときは、その課題番号を返す。`listIssues` のラベルは「実装完了」、`assignee` は login、`limit` は 100 であり、`state` は無い。`listPullRequests` の `head` は `task-<番号>` である。`listPullRequestComments` は、open が 1 件のときだけ呼ぶ。
- より小さい番号が 0 件、または open でない 1 件、または未処理が無いときは、次の番号を見る。未処理がある番号が見つかったあと、より大きい番号の `listPullRequests` は呼ばない。
- 2 件以上のときは `マージリクエストを特定できません` であり、より大きい番号も、動作確認OK の `listIssues` も呼ばない。
- 不具合が無く、`completionCaller` が `runner` でないときは `null` であり、動作確認OK の `listIssues` は呼ばない。`runner` のときは、既存の完了の探索を行う。`viewerLogin` は一回である。
- `completionCaller` が `null` または `skill` でも、未処理の不具合は探す。
- 一方が不具合の着手の `editLabels` を終えたあと、もう一方の `poll` は、その課題を返さない。
- 通過した不具合の `process` は、着手の `editLabels`、`fetch`、`checkoutFetched`、`fix`、`commitAll`、`push`、`addPullRequestComment`、終了の `editLabels` の順である。`commitAll` のメッセージは `fix: 課題 <番号> の不具合を修正する` である。`addPullRequestComment` の最初の非空行は `sdd-cur: 修正` であり、fixed には着手時の id がすべて入る。課題の `addComment`、`createBranch`、`createPullRequest`、`squashMerge` は呼ばない。
- `fix` が一度で成功したときは、結果ファイルを読み、`fixComment` に通したあと消す。一度拒否したときは、同じパスでもう一度呼ぶ。二度目も拒否したときは、ファイルを消し、`commitAll`、`addPullRequestComment`、終了の `editLabels` を呼ばない。
- 結果の本文が `設計の範囲外のため直していない` の 1 行だけであり、変更が無いときは、`commitAll` を呼ばない。`addPullRequestComment` と、終了の `editLabels` は呼ぶ。失敗にはしない。
- 範囲内の本文で変更が無いときは `実装の変更がありません` であり、`addPullRequestComment` と終了の `editLabels` を呼ばない。
- 着手の `editLabels` が成功したあと、終了の `editLabels` が二度拒否したときは、`addPullRequestComment` は一回のままである。
- 既存の実装の `process` は、これまでと同じ呼び出し順である。`addPullRequestComment` と `fix` は呼ばない。`createBranch` は呼ばない。

既存の `createRunner` の試験は、`listPullRequestComments`、`addPullRequestComment`、`agent.fix` を足す。

スキルと配置の確認も `src/runner.test.ts` で行う。一時ディレクトリを使う。

- `skills/sdd-cur-fix/SKILL.md` の先頭が、上のフロントマターと一致する。本文に、`# sdd-cur-fix`、`## 修正`、`## 禁止`、`docs/specs`、`sdd-cur-implement-author`、`model は渡さない`、`設計の範囲外のため直していない`、`課題を作らない`、`課題を閉じない`、`ラベルを変えない`、`コミットしない`、`push しない`、`マージリクエストを作らない`、`スカッシュマージしない`、`コメントを投稿しない`、`受け入れ手順を書き直さない`、`gh を直接起動しない` が含まれる。
- `bun src/cli.ts install <temp>` の終了コードは 0 であり、`<temp>/.cursor/skills/sdd-cur-fix/SKILL.md` はパッケージのそのファイルと一致する。

## 実装の順序

1. `parsePullRequestComment`、`readFixedIds`、`selectUnprocessedBugs`、`fixComment` を `src/conventions.ts` に足し、試験を通す。課題コメントの既存の試験は変えない。
2. `listPullRequestComments` と `addPullRequestComment` を `src/github.ts` に足し、引数と応答の試験を通す。
3. `createAgent` に `fix` を足し、プロンプトの試験を通す。`implement` の引数は変えない。
4. `issueHasFixLabels`、`selectFixIssues`、`classifyFixPullRequests`、`poll` の不具合の段、`runFix` を `src/runner.ts` に足し、優先順と修正の手順の試験を通す。
5. `skills/sdd-cur-fix/SKILL.md` を書き、フロントマターと禁止の文言、一時ディレクトリへの `install` を確かめる。
6. `docs/conventions.md` に二つの節を足し、`docs/plan.md` の三箇所を、上の文に変える。
