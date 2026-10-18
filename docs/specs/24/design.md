# 24 ランナーは自身がアサインされた課題だけを対象にする

対象は [Issue #24](https://github.com/paterapatera/sdd-cur/issues/24)。課題ランナーの対象は、自身がアサインされた課題だけにする。

自身は、`gh` でログインしている利用者である。対象は、GitHub Issue の assignees にその利用者が含まれる課題だけである。

## 受け入れ条件

- 課題ランナーの対象は、自身がアサインされた課題だけである。
- 自身は、`gh` でログインしている利用者である。GitHub Issue の assignees にその利用者が含まれる課題だけを対象にする。
- このアサイン条件は、実装依頼の探索と、課題ランナーが行う完了の探索の両方にかける。完了の探索は、「動作確認OK」の課題を探すときである。
- `bun test` は `gh`、`git`、`agent` を起動しない。

## 範囲外

次は作らない。

- 「実装依頼」から「実装完了」までの手順。受け入れ手順のコメント（#6）。`process` の順は設計 27 のままである。`createBranch` は呼ばない。作業ブランチ名は設計 17 の `implementationBranch` のままである
- 完了処理が行うスカッシュマージと「マージ済み」（#7）。`completeIssue` の順は設計 7 と設計 18 のままである
- 完了スキルから完了処理を行うこと（#7）。`complete` サブコマンドは番号を受け、探索しない
- 一つのプロジェクトで、課題ランナーと完了スキルを同時には有効にできないこと（#7）
- 受け入れテストが不合格のとき、ラベルを何にし、どこで直すか（計画の未決）
- マージ時のブランチ削除（#18）
- 使いたくないプロジェクトでスキルを止めること（#19）
- 要求を作ったあとの要求のレビューとレビュー指摘（#20）
- 設計を作ったあとの設計のレビューとレビュー指摘（#21）
- 実装のあとの実装のレビューとレビュー指摘（#22）
- 変えた仕様の巻き戻り防止（#23）
- `sdd-cur.completion` の廃止（#25）
- 要求を作るとき、課題に書いていない部分を決めずに人へ質問し、選択肢に評価スコアを添えること（#26）
- 課題のために作るブランチ名（#17）
- 要求と設計をデフォルトブランチへ入れず、作業ブランチに載せたまま実装すること（#27）
- 課題の作成とクローズ。`issue close` と `--state` は付けない
- 「動作確認OK」を付けること。付けるのは人である
- 着手、要件、設計、確認、回答の取り込み。`src/sdd.ts` の探索は変えない。`listIssues` に `assignee` を渡さない
- `poll` が選んだあとの `process` で、アサインを確かめること
- ポーリングをまたいでログインを記憶すること
- `listIssues` の 101 件目以降。`limit` は 100 のままである
- `src/cli.ts`、`src/run.ts` のループ。`src/git.ts`、`src/agent.ts`、`src/conventions.ts`、`src/install.ts`、`src/labels.ts` の変更
- `docs/plan.md`、`docs/conventions.md`、README、AGENTS.md、既存の `design.md` の書き換え
- Forgejo、Jira、Backlog
- 依存パッケージ。トークンと環境変数の読み取り。`git config` の変更
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| 自身 | `gh api user` の `login`。`GitHubClient.viewerLogin` が返す。トークンも環境変数も読まない |
| 含まれる | assignees の login が、その文字列と完全一致する |
| 実装依頼 | `poll` の最初の `listIssues` に `assignee` を渡し、`selectImplementationIssue` でも同じ login を残す |
| 完了の探索 | `completionCaller` が `"runner"` で実装依頼が無いときだけ、二度目の `listIssues` に同じ `assignee` を渡し、`selectCompletionIssue` でも同じ login を残す |
| 同じ poll | `viewerLogin` は一回である。二度目の探索は、その戻り値を使う |
| 記憶しない | 次の `poll` は、再び `viewerLogin` を呼ぶ |
| ラベル | 設計 6 と設計 7 のラベル条件は残す。アサイン条件はそれに加える |
| 件数 | `limit` は 100 のままである。`assignee` を付けるので、この 100 件はその利用者にアサインされた課題である |
| 失敗 | 理由は一行である。`viewerLogin` と二つの `listIssues` は、拒否した呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まる。成功した呼び出しはやり直さない |
| ラベル名 | `workflowLabels` の `name` だけを使う。別の字面で再定義しない |

ラベル名は、この表では課題の文言で書く。実装は `workflowLabels` から取る。

## ログイン

`GitHubClient` に次を足す。`listIssues` には任意の `assignee` を足す。`listIssues` と `getIssue` の `--json` は、assignees を含む fields に変える。他の操作の引数は変えない。

```ts
viewerLogin(): Promise<string>
```

`api user` を、`createGitHub` の `cwd` で一回呼ぶ。`--repo` は付けない。標準入力は渡さない。

応答は JSON のオブジェクトであり、`login` が空でない文字列のとき、その文字列を返す。オブジェクトでないとき、`login` が文字列でないとき、空のときは `gh の応答を解釈できません` で拒否する。前後の空白は除かない。

終了コードが 0 以外のときは、既存の `gh` の失敗理由のまま拒否する。起動できないときは `gh を実行できません` である。

## 課題の assignees

`Issue` に `assignees` を足す。要素は login の文字列である。

```ts
export type Issue = {
  number: number
  title: string
  body: string
  state: "open" | "closed"
  labels: string[]
  assignees: string[]
  url: string
}
```

`ISSUE_JSON_FIELDS` は `number,title,body,state,labels,assignees,url` である。`listIssues` と `getIssue` がこれを使う。

`gh` の assignees は、要素がオブジェクトの配列である。`normalizeIssue` は、各要素の `login` が文字列のとき、その文字列を順に `assignees` へ入れる。配列でないとき、要素がオブジェクトでないとき、`login` が文字列でないときは `gh の応答を解釈できません` で拒否する。空の配列は成功であり、`assignees` は `[]` である。

`getIssue` も同じ fields を解釈する。`process` と `completeIssue` は `assignees` を見ない。

## 一覧の assignee

`listIssues` の query に、任意の `assignee` を足す。

```ts
listIssues(query?: {
  state?: "open" | "closed" | "all"
  labels?: string[]
  assignee?: string
  limit?: number
}): Promise<Issue[]>
```

`assignee` を省いたときは、`--assignee` を付けない。渡したときは、前後の空白を除いて空なら `アサインの指定が不正です` で拒否し、`gh` を呼ばない。空でないときは、空白を除かずにその文字列を `--assignee` の値にする。

呼ぶ引数は、この順である。`assignee` を省いたときは、`--assignee` の二要素が無い。

```
issue
list
--repo
<repo>
--label
<label>
--assignee
<assignee>
--state
<state>
--limit
<limit>
--json
number,title,body,state,labels,assignees,url
```

`--label` はラベルの数だけ繰り返す。ラベルが無いときは、その二要素が無い。`state` を省いたときの既定は `open`、`limit` を省いたときの既定は 100 であり、これは変えない。

## 探索

```ts
export function selectImplementationIssue(
  issues: readonly Issue[],
  login: string,
): Issue | null

export function selectCompletionIssue(
  issues: readonly Issue[],
  login: string,
): Issue | null
```

どちらも引数の配列を変えない。

`selectImplementationIssue` は、設計 6 のとおり、「実装依頼」が無い課題を除く。「実装中」がある課題を除く。両方のラベルがある課題も除く。加えて、`assignees` に `login` が完全一致で含まれない課題を除く。残った配列を `number` の昇順で並べ、先頭を返す。空なら `null` である。ラベルの一致は完全一致である。

`selectCompletionIssue` は、設計 7 のとおり、「動作確認OK」が無い課題を除く。「マージ済み」が付いていても、ラベルでは除かない。加えて、`assignees` に `login` が完全一致で含まれない課題を除く。残った配列を `number` の昇順で並べ、先頭を返す。空なら `null` である。

`assignees` が空の課題は、どちらの探索でも残らない。複数の assignees のうち `login` が一つでもあれば残る。

`createRunner` の `github` に `viewerLogin` を足す。

`poll` は、最初に `viewerLogin` を呼ぶ。拒否したときは、その呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まり、`listIssues` は呼ばない。

成功したときは、その login で `listIssues({ labels: ["実装依頼"], assignee: login, limit: 100 })` を呼び、`selectImplementationIssue` にその配列と login を渡す。`state` は渡さない。結果があれば、その番号を `id` にして返す。

結果が `null` で、`completionCaller` が `"runner"` のときだけ、続けて `listIssues({ labels: ["動作確認OK"], assignee: login, limit: 100 })` を呼び、`selectCompletionIssue` にその配列と login を渡す。`state` は渡さない。それ以外の `completionCaller` では、二度目の `listIssues` は呼ばない。`viewerLogin` は、このときもすでに一回終わっている。もう一度は呼ばない。

どちらの `listIssues` も、拒否したときその呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まる。成功した `viewerLogin` はやり直さない。

`process` は変えない。選んだあとに `assignees` は見ない。

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。`defaultGhRunner` は呼ばない。ホームディレクトリと、実行中の Cursor のスキルは触らない。

`src/github.test.ts` に足す。

- `viewerLogin` は `api user` を一回だけ呼ぶ。`--repo` は無い。標準入力は無い。`login` が `octocat` のとき `octocat` を返す。
- `login` が無いとき、空のときは `gh の応答を解釈できません` で拒否する。
- `listIssues` に `assignee` を渡したとき、`--label` のあと `--state` の前に `--assignee` とその文字列がある。`--json` は `number,title,body,state,labels,assignees,url` である。
- `assignee` を省いたときは `--assignee` が無い。空の `assignee` は `アサインの指定が不正です` であり、`gh` を呼ばない。
- 応答の assignees が `[{ login: "octocat" }]` のとき、`assignees` は `["octocat"]` である。空の配列は `[]` である。配列でないときは `gh の応答を解釈できません` で拒否する。

既存の `listIssues` と `getIssue` の試験が期待する `--json` は、上の fields と一致する。課題の JSON には assignees を含める。

`src/runner.test.ts` に足す。

- `selectImplementationIssue` は引数を変えない。「実装中」を持つ課題、「実装依頼」が無い課題、両方のラベルがある課題を除く。`assignees` に login が無い課題を除く。login が複数の assignees の一つである課題は残す。番号 `10` と `2` がどちらもその login を含むときは `2` を返す。番号 `1` の assignees に login が無く、番号 `2` にあるときは `2` を返す。
- `poll` は、`viewerLogin` のあと `listIssues({ labels: ["実装依頼"], assignee: login, limit: 100 })` を呼ぶ。`state` は渡さない。候補が無いときは `null` である。
- `listIssues` が、ラベルは合うが `assignees` に login が無い課題だけを返したときは、`poll` は `null` である。`completionCaller` が `"runner"` でないときは、二度目の `listIssues` は呼ばない。
- `viewerLogin` が一度拒否し、二度目に login を返すとき、`listIssues` はその login で一回である。二度とも拒否したときは、その理由で拒否し、`listIssues` は呼ばない。
- `completionCaller` が `null` または `"skill"` のとき、`viewerLogin` は一回であり、「動作確認OK」の `listIssues` は呼ばない。
- `"runner"` で、実装依頼の結果に login を含む課題があるときは、その課題を返し、「動作確認OK」の `listIssues` は呼ばない。`viewerLogin` は一回である。
- `"runner"` で実装依頼が無く、「動作確認OK」の課題の `assignees` に login が含まれるときは、その番号を返す。二度目の `listIssues` の `assignee` は、同じ login である。`assignees` に login が無い課題は返さない。

既存の `createRunner` の試験は、`viewerLogin` を足す。`process` の試験は、これまでと同じ呼び出し順である。`createBranch` は呼ばない。

`src/complete.test.ts` に足す。

- `selectCompletionIssue` は引数を変えない。「動作確認OK」が無い課題を除く。`assignees` に login が無い課題を除く。番号 `10` と `2` がどちらもその login を含むときは `2` を返す。「マージ済み」があっても、login が含まれていれば除かない。

`src/sdd.test.ts` が課題を組み立てる箇所は、`assignees` を空の配列にする。探索の期待は変えない。

## 実装の順序

1. `Issue.assignees`、`viewerLogin`、`listIssues` の `assignee` を `src/github.ts` に足し、引数と応答の試験を通す。
2. `selectImplementationIssue` と `selectCompletionIssue` に login を足し、アサインで除く試験を通す。
3. `poll` が `viewerLogin` と `assignee` を使うようにし、二つの探索の試験を通す。`process` は変えない。
4. 課題を組み立てる既存の試験に `assignees` を足し、`bun test` を通す。`gh`、`git`、`agent` を起動しないことを確かめる。
