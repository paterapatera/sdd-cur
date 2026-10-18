# 17 作成するブランチ名を task-{番号} にする

対象は [Issue #17](https://github.com/paterapatera/sdd-cur/issues/17)。課題のために作るブランチ名を、`sdd-cur/<番号>` から `task-<番号>` に変える。

`<番号>` は課題番号の十進であり、先頭の零は付けない。区切りは `-` である。課題 17 の名前は `task-17` である。

## 受け入れ条件

- 課題のために作る作業ブランチの名前は `task-<番号>` である。
- 要求を書き始めるときの作業ブランチ、クローンが実装する作業ブランチ、マージリクエストの head、完了処理がマージリクエストを探す head は、同じ `task-<番号>` である。
- `sdd-cur/<番号>` は、課題の作業ブランチとして作らず、上記でも使わない。

## 範囲外

次は作らない。

- パッケージ名 `@paterapatera/sdd-cur`、スキルのディレクトリ名、サブエージェント名
- 作業ブランチを用意するタイミングと、デフォルトブランチから作業ブランチを作り直さないこと（#27）。`skills/sdd-cur/SKILL.md` は変えない
- 番号が 1 以上の安全な整数でないときの拒否。理由は設計 6 の `番号が不正です` のままである
- ブランチの削除（#18）
- ラベルの変更
- 課題の作成とクローズ
- 受け入れ手順
- 完了処理のうち、head に使うブランチ名以外。スカッシュマージと「マージ済み」は設計 7 のままである
- 既存の `sdd-cur/<番号>` ブランチの改名、付け替え、削除
- `src/github.ts` のブランチ名の規則。`src/git.ts` の引数
- `src/git.test.ts` と `src/github.test.ts` の、引数の例として渡しているブランチ名。課題の作業ブランチ名ではない
- `docs/plan.md`、`docs/conventions.md`、README、AGENTS.md の書き換え
- `docs/specs/6/design.md`、`docs/specs/7/design.md`、`docs/specs/27/design.md` の書き換え。設計 6 が書いた作業ブランチ名は、この設計の `implementationBranch` の戻り値で置き換わる
- Forgejo、Jira、Backlog

## 決定

| 項目 | 内容 |
|---|---|
| 名前の出所 | `src/runner.ts` の `implementationBranch` だけが、課題の作業ブランチ名を作る。呼び出し側は接頭辞を連結しない |
| 成功時 | `task-` と十進の番号を連結する。先頭の零は付けない |
| 例 | 課題 1 は `task-1`。課題 17 は `task-17` |
| 要求 | 用意する作業ブランチの名前は、この戻り値である。スキルの手順は設計 27 のままである |
| 実装 | クローンが `fetch` し、`checkoutFetched` し、`push` するブランチと、`createPullRequest` の `head` は、この戻り値である。手順は設計 27 のままである。ランナーは `createBranch` を呼ばない |
| 完了 | `listPullRequests` の `head` は、この戻り値である。`src/complete.ts` は `implementationBranch` を import したままである |
| 旧名 | `implementationBranch` は `sdd-cur/<番号>` を返さない。要求の作業ブランチ、クローンの作業ブランチ、マージリクエストの head、完了処理の head でも使わない |
| 過去の設計 | 設計 6 の作業ブランチ名だけが、この戻り値に置き換わる。設計 27 が定めた着手手順は変えない。設計 7 の「ヘッドは `implementationBranch` の戻り値」は、この戻り値を指す |

## 名前

```ts
export function implementationBranch(issueNumber: number): string
```

成功時の戻り値は、`task-` と十進の課題番号を連結した文字列である。番号に先頭の零は付けない。`1` は `task-1`、`17` は `task-17` である。

番号が 1 以上の安全な整数でないときは、設計 6 のとおり `番号が不正です` で拒否する。この拒否は変えない。

この戻り値を、次のすべてで使う。

- 要求を書き始めるときに用意する作業ブランチ
- クローンが `fetch` し、`checkoutFetched` し、その上で実装する作業ブランチ。`push` に渡す名前もこの戻り値である
- `createPullRequest` の `head`
- `completeIssue` が `listPullRequests` に渡す `head`

`runImplementation` の順は設計 27 のままである。ランナーは `createBranch` を呼ばない。`GitHubClient.createBranch` は残す。`src/complete.ts` は `implementationBranch` を import し、戻り値をそのまま `head` にする。完了処理の中で接頭辞と番号を組み立て直さない。

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。

`src/runner.test.ts` に足す。

- `implementationBranch(1)` は `task-1` である。`implementationBranch(17)` は `task-17` である。
- 通過した `process` の `fetch` と `checkoutFetched` に渡すブランチ名、および `createPullRequest` の `head` は `task-1` である。`sdd-cur/1` は無い。

`src/complete.test.ts` の、マージリクエストを探す `head` の期待を `task-1` に変える。`sdd-cur/1` は無い。

## 実装の順序

1. `implementationBranch` の成功時の戻り値を、`task-` と十進の番号の連結に変える。拒否は変えない。
2. `src/runner.test.ts` に戻り値の試験を足し、`process` が期待するブランチ名を `task-1` に変える。
3. `src/complete.test.ts` が期待する `head` を `task-1` に変える。
4. `bun test` を通し、`gh`、`git`、`agent` を起動しないことを確かめる。
