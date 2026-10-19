# 18 マージ時にブランチを削除する

対象は [Issue #18](https://github.com/paterapatera/sdd-cur/issues/18)。完了処理がマージリクエストをスカッシュマージするとき、そのヘッドであるブランチを削除する。

## 受け入れ条件

- 完了処理がスカッシュマージするとき、そのヘッドであるブランチも削除する。
- 課題ランナー経由と完了スキル経由の両方で、同じ `completeIssue` がこの削除を行う。
- 課題は閉じない。
- `bun test` は `gh`、`git`、`agent` を起動しない。

## 範囲外

次は作らない。

- すでにマージ済みのマージリクエストを、もう一度マージしないこと（#7）。この判断は設計 7 のままである
- 「マージ済み」を付けること（#7）。`editLabels` の追加と削除の内容は設計 7 のままである
- 一つのプロジェクトで、課題ランナーと完了スキルを同時には有効にできないこと（#7）
- 「動作確認OK」を付けること。付けるのは人である
- 「実装依頼」から「実装完了」まで。受け入れ手順のコメント（#6）
- 課題の作成とクローズ。`issue close` と `--state` は付けない
- 着手、要件、設計、確認、回答の取り込み。`skills/sdd-cur/SKILL.md` と `skills/sdd-cur-complete/SKILL.md`
- フォーク、レビュー依頼、ドラフト（#2）
- マージを試みる成否判定。`pr merge` のあと `merged` を見る規則は設計 2 のままである
- `--merge`、`--rebase`、`--admin`、`--auto`
- `deleteBranch`。参照を消す別の `api` も呼ばない
- `src/cli.ts` の使い方。`complete` は設計 7 のとおり `completeIssue` を一回呼ぶ
- `src/run.ts` のループの形。`src/git.ts`、`src/agent.ts`、`src/conventions.ts`、`src/install.ts`、`src/labels.ts`、`src/sdd.ts` の変更
- `docs/plan.md`、`docs/conventions.md`、課題 2 と課題 7 を含む既存の `design.md` の書き換え
- Forgejo、Jira、Backlog
- 依存パッケージ。トークンと環境変数の読み取り。`git config` の変更
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| 削除する主体 | `completeIssue` が呼ぶ `squashMerge` だけが、スカッシュマージするときにヘッドを削除する。ランナーも `complete` サブコマンドも `squashMerge` を直接呼ばない。`deleteBranch` は作らない |
| 対象 | `listPullRequests` に渡した `head`。値は `implementationBranch` の戻り値である |
| 操作 | `pr merge <番号> --repo <repo> --squash --delete-branch`。`squashMerge` の成否判定は設計 2 のままである |
| ブランチ名 | 設計 2 の規則。`head` に `owner:branch` は使わない |
| 課題は閉じない | ラベル変更は `editLabels` の追加と削除だけである |
| 再試行 | 設計 7 と同じく、拒否した外部呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まる。成功した呼び出しはやり直さない。削除だけを分けてやり直さない |

## ブランチの削除

`squashMerge` の第一段の引数を変える。`GitHubClient` に操作は足さない。`deleteBranch` は作らない。

| 操作 | 引数 | 標準入力 |
|---|---|---|
| `squashMerge` の第一段 | `pr merge <番号> --repo <repo> --squash --delete-branch` | 渡さない |

`--merge`、`--rebase`、`--admin`、`--auto` は付けない。参照を消す `api` は呼ばない。

終了コードが 0 のとき、設計 2 のとおり `getPullRequest` と同じ取得を行う。`merged` が true のときだけ成功とする。false のときは `マージリクエストはマージされていません` で拒否する。取得が拒否されたときは、その理由で拒否する。終了コードが 0 以外のときは、取得を呼ばない。失敗の理由は設計 2 の失敗規則である。`squashMerge` の中では再試行しない。

`docs/specs/2/design.md` は書き換えない。

## 完了処理

```ts
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

次は設計 7 のままである。

- 番号が 1 以上の安全な整数でないときは `番号が不正です` で拒否し、GitHub を呼ばない。
- `getIssue` のあと、「動作確認OK」が無いときの分岐。
- ヘッドは `implementationBranch` の戻り値である。`listPullRequests({ head, limit: 100 })` を呼ぶ。0 件は `マージリクエストがありません`、2 件以上は `マージリクエストを特定できません` で拒否する。
- `merged` が false のときだけ、その番号で `squashMerge` を呼ぶ。
- `editLabels` で「動作確認OK」を外し、「マージ済み」を付ける。追加と削除は一回にまとめる。
- 閉じているがマージされていないマージリクエストの特別扱いはしない。

ブランチの削除は、この `squashMerge` に含まれる。`merged` が true で `squashMerge` を呼ばないときは、ブランチは削除しない。

`getIssue`、`listPullRequests`、`squashMerge`、`editLabels` は、設計 7 と同じく、拒否したときその呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まる。成功した呼び出しはやり直さない。削除だけを分けてやり直さない。

`createRunner` の github 依存は設計 7 のままである。`deleteBranch` は足さない。`process` が完了へ進むときは、設計 7 のとおり `completeIssue` を一回呼ぶ。この分岐で `git`、`agent`、`addComment` は呼ばない。`completeIssue` が拒否したときは、その理由で `process` が拒否する。ランナーは `completeIssue` の外側ではやり直さない。

## テスト

`bun:test` の `describe` と `test` を使う。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。

`src/github.test.ts` の `squashMerge` の期待を変える。

- `squashMerge` は、`pr merge`、番号、`--repo`、リポジトリ、`--squash`、`--delete-branch` を、この順で一回呼ぶ。標準入力は無い。
- 終了コードが 0 のときだけ、設計 2 のとおり `getPullRequest` と同じ引数で取得する。`merged` が false のときは `マージリクエストはマージされていません` で拒否する。`pr merge` が 0 以外のときは取得を呼ばない。
- `deleteBranch` は無く、`api` で `git/refs/heads` を消す呼び出しは無い。

`src/complete.test.ts` に足す。

- `completeIssue` の依存に `deleteBranch` は無い。
- `merged` が false で `squashMerge` が成功したときは、`squashMerge` が一回であり、`issue close` は呼ばない。
- `merged` が true のときは `squashMerge` を呼ばない。

`src/runner.test.ts` に足す。

- 「動作確認OK」があり「実装依頼」が無い課題の `process` は、`completeIssue` 経由で `squashMerge` を呼ぶ。`deleteBranch` は呼ばない。`commitAll`、`createPullRequest`、`addComment` は呼ばない。`issue close` は呼ばない。
- `createRunner` の github 依存に `deleteBranch` は無い。`process` は `squashMerge` を `completeIssue` の外で呼ばない。

## 作業の一覧

1. `squashMerge` の `pr merge` に `--delete-branch` を足し、引数と成否の試験を通す。
2. `completeIssue` の依存は設計 7 のままにし、`deleteBranch` を足さない。スカッシュマージするとき `squashMerge` だけが削除を含む試験を通す。
3. `createRunner` の github 依存は設計 7 のままにし、完了の `process` が同じ `completeIssue` 経由で `squashMerge` を呼び、`deleteBranch` を呼ばない試験を通す。
