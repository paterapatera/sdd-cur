# 73 スカッシュマージ後のコミットメッセージに課題番号を含める

対象は [Issue #73](https://github.com/paterapatera/sdd-cur/issues/73)。完了処理がマージリクエストをスカッシュマージしたあと、デフォルトブランチに残るコミットの件名に、その課題の番号を含める。件名から、どの課題のマージかが分かる。

## 受け入れ条件

- 完了処理がスカッシュマージしたあと、デフォルトブランチに残るコミットの件名に、その課題の番号が含まれる。
- その件名から、どの課題のマージかが分かる。
- 件名は、`【課題 <番号>】` の直後に課題の題を続けた文字列である。`<番号>` は `completeIssue` に渡した課題番号であり、十進で先頭の零は無い。角括弧は全角である。`feat:` などの接頭辞は付けない。
- `createPullRequest` の `title` は課題の題のままである。このプレフィックスを付けるのは、`squashMerge` の `--subject` に渡す件名だけである。
- 課題ランナー経由と完了スキル経由の両方で、同じ完了処理がこの件名を残す。
- `bun test` は `gh`、`git`、`agent` を起動しない。

## 範囲外

次は作らない。

- すでにマージ済みのマージリクエストを、もう一度マージしないこと（#7）。この判断は設計 7 のままである
- 「マージ済み」を付けること（#7）。`editLabels` の追加と削除の内容は設計 7 のままである
- 一つのプロジェクトで、課題ランナーと完了スキルを同時には有効にできないこと（#7）
- マージしたブランチの削除（#18）。`--delete-branch` は設計 18 のまま残す
- 実装のコミットメッセージ `feat: 課題 <番号> を実装する` を変えること
- 不具合修正のコミットメッセージ `fix: 課題 <番号> の不具合を修正する` を変えること
- マージリクエストの題を変えること。`createPullRequest` の `title` は課題の題のままである
- 「動作確認OK」を付けること。付けるのは人である
- 課題の作成とクローズ。`issue close` と `--state` は付けない
- ラベルの変更。この課題では `editLabels` の追加と削除を変えない
- 受け入れ手順
- 着手、要件、設計、確認、回答の取り込み。`skills/sdd-cur/SKILL.md` と `skills/sdd-cur-complete/SKILL.md`
- マージを試みる成否判定。`pr merge` のあと `merged` を見る規則は設計 2 のままである
- `--merge`、`--rebase`、`--admin`、`--auto`
- `--body`、`--body-file`。コミットの本文は渡さない
- `deleteBranch`。参照を消す別の `api` も呼ばない
- `src/cli.ts` の使い方。`complete` は設計 7 のとおり `completeIssue` を一回呼ぶ
- `src/run.ts` のループの形。`src/git.ts`、`src/agent.ts`、`src/conventions.ts`、`src/install.ts`、`src/labels.ts`、`src/sdd.ts` の変更
- `src/runner.ts` の完了分岐。`process` が完了へ進むときは、設計 7 のとおり `completeIssue` を一回呼ぶ
- `docs/plan.md`、`docs/conventions.md`、課題 2、課題 7、課題 18 を含む既存の `design.md` の書き換え
- Forgejo、Jira、Backlog
- 依存パッケージ。トークンと環境変数の読み取り。`git config` の変更
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| 件名を残す主体 | `completeIssue` が呼ぶ `squashMerge` だけが、スカッシュマージのコミット件名を渡す。ランナーも `complete` サブコマンドも `squashMerge` を直接呼ばない |
| 番号 | 件名に含める番号は、`completeIssue` に渡した課題番号である。十進で、先頭の零は付けない。マージリクエスト番号は、課題番号の代わりに使わない |
| 件名の形 | `【課題 <番号>】` の直後に課題の題を続ける。`】` と題のあいだに空白は無い。`<番号>` は上の課題番号である。`課題` と番号のあいだは半角空白一つである。角括弧は全角の `【】` である。`feat:` などの接頭辞は付けない。課題の題の文字は変えない。課題の題は、完了処理がすでに呼ぶ `getIssue` の戻り値の `title` である。題を取るための新しい操作は足さない。課題 73 で題が「スカッシュマージ後のコミットメッセージに課題番号を含める」のとき、件名は `【課題 73】スカッシュマージ後のコミットメッセージに課題番号を含める` である |
| 操作 | `pr merge <マージリクエスト番号> --repo <repo> --squash --delete-branch --subject <件名>`。成否判定は設計 2 のままである。`--delete-branch` は設計 18 のままである |
| 件名の渡し方 | `squashMerge` の第二引数を、変えずに `--subject` の次の一つの引数にする。空白で分割しない。`squashMerge` は件名へプレフィックスを足さない |
| 本文 | 渡さない。`--body` と `--body-file` は付けない |
| 題 | `createPullRequest` の `title` は課題の題のままである。プレフィックスは付けない。上の形にするのは、`squashMerge` の `--subject` に渡すときだけである。実装と不具合修正のコミットメッセージも変えない |
| 再マージしない | 設計 7 のままである。`merged` が true のときは `squashMerge` を呼ばない。件名は渡さない |
| 課題は閉じない | ラベル変更は `editLabels` の追加と削除だけである |
| 再試行 | 設計 7 と同じく、拒否した外部呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まる。成功した呼び出しはやり直さない。件名だけを分けてやり直さない |

## 件名

`squashMerge` に件名の引数を足す。`GitHubClient` に操作は足さない。

```ts
squashMerge(number: number, subject: string): Promise<void>
```

`number` はマージリクエスト番号である。1 以上の安全な整数でないときは、設計 2 のとおり `番号が不正です` で拒否し、`gh` を呼ばない。`subject` は、デフォルトブランチに残るコミットの件名である。`squashMerge` は `subject` の文字を変えない。`【課題` も `feat:` も、ここでは足さない。

`completeIssue` が渡す `subject` は、決定の件名の形である。プレフィックスを付ける処理は、`squashMerge` の中には置かない。`--subject` の次の引数は、渡された `subject` そのものである。

| 操作 | 引数 | 標準入力 |
|---|---|---|
| `squashMerge` の第一段 | `pr merge <番号> --repo <repo> --squash --delete-branch --subject <件名>` | 渡さない |

`<番号>` はマージリクエスト番号である。`<件名>` は `subject` であり、`--subject` の直後の一つの引数である。

`--merge`、`--rebase`、`--admin`、`--auto`、`--body`、`--body-file` は付けない。参照を消す `api` は呼ばない。

終了コードが 0 のとき、設計 2 のとおり `getPullRequest` と同じ取得を行う。`merged` が true のときだけ成功とする。false のときは `マージリクエストはマージされていません` で拒否する。取得が拒否されたときは、その理由で拒否する。終了コードが 0 以外のときは、取得を呼ばない。失敗の理由は設計 2 の失敗規則である。`squashMerge` の中では再試行しない。

`docs/specs/2/design.md` と `docs/specs/18/design.md` は書き換えない。

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

次は設計 7 と設計 18 のままである。

- 番号が 1 以上の安全な整数でないときは `番号が不正です` で拒否し、GitHub を呼ばない。
- `getIssue` のあと、「動作確認OK」が無いときの分岐。
- ヘッドは `implementationBranch` の戻り値である。`listPullRequests({ head, limit: 100 })` を呼ぶ。0 件は `マージリクエストがありません`、2 件以上は `マージリクエストを特定できません` で拒否する。
- `merged` が false のときだけ、`squashMerge` を呼ぶ。
- `editLabels` で「動作確認OK」を外し、「マージ済み」を付ける。追加と削除は一回にまとめる。
- 閉じているがマージされていないマージリクエストの特別扱いはしない。

`merged` が false のときの呼び出しは `squashMerge(pr.number, subject)` である。`pr.number` はマージリクエスト番号である。`subject` は、`【課題 <番号>】` の直後に、`getIssue` が返した課題の題を続けた文字列である。`<番号>` は `completeIssue` に渡した課題番号であり、十進で先頭の零は付けない。角括弧は全角の `【` と `】` である。`課題` と番号のあいだは半角空白一つであり、`】` と題のあいだに空白は無い。題の文字は変えない。`feat:` などの接頭辞は付けない。題は、すでに呼んだ `getIssue` の `title` であり、題を取るための新しい操作は足さない。この `title` は、`createPullRequest` の `title` に使う課題の題と同じ文字列である。`createPullRequest` の `title` には、このプレフィックスを付けない。マージリクエスト番号は、課題番号の代わりに件名へ使わない。`merged` が true のときは `squashMerge` を呼ばず、件名は渡さない。

ブランチの削除は、設計 18 のとおり、この `squashMerge` に含まれる。

`getIssue`、`listPullRequests`、`squashMerge`、`editLabels` は、設計 7 と同じく、拒否したときその呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まる。成功した呼び出しはやり直さない。件名だけを分けてやり直さない。

`createRunner` の github 依存は設計 7 のままである。`squashMerge` の型は、上の第二引数を持つ `GitHubClient` の型に従う。`process` が完了へ進むときは、設計 7 のとおり `completeIssue` を一回呼ぶ。この分岐で `git`、`agent`、`addComment` は呼ばない。`completeIssue` が拒否したときは、その理由で `process` が拒否する。ランナーは `completeIssue` の外側ではやり直さない。`complete` サブコマンドも、設計 7 のとおり `completeIssue` を一回呼ぶ。残す件名は、どちらの経路でもこの `completeIssue` が渡す件名である。

## テスト

`bun:test` の `describe` と `test` を使う。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。

`src/github.test.ts` の `squashMerge` の期待を変える。

- `squashMerge(7, "t")` は、`pr merge`、`7`、`--repo`、リポジトリ、`--squash`、`--delete-branch`、`--subject`、`t` を、この順で一回呼ぶ。標準入力は無い。`--body` と `--body-file` は無い。件名 `t` は一つの引数のままである。`【課題` も `feat:` も付かない。`squashMerge` はプレフィックスを付けない。
- 終了コードが 0 のときだけ、設計 2 のとおり `getPullRequest` と同じ引数で取得する。`merged` が false のときは `マージリクエストはマージされていません` で拒否する。`pr merge` が 0 以外のときは取得を呼ばない。
- `deleteBranch` は無く、`api` で `git/refs/heads` を消す呼び出しは無い。

`src/complete.test.ts` に足す。

- 課題番号が `7`、`getIssue` の題が `t`、マージリクエスト番号が `9`、`merged` が false のとき、`squashMerge` は一回である。第一引数は `9` であり、第二引数は `【課題 7】t` である。`【課題 9】t`、`【課題 7】 t`、`feat: 【課題 7】t` ではない。`issue close` は呼ばない。
- 同じ組で、`pr merge` の引数に `--subject` と `【課題 7】t` がこの順で入る。`--delete-branch` は残る。`--body` は無い。`createPullRequest` は呼ばない。
- `merged` が true のときは `squashMerge` を呼ばない。
- `completeIssue` の依存に、新しい操作は無い。`deleteBranch` は無い。

`src/runner.test.ts` に足す。

- 「動作確認OK」があり「実装依頼」が無い課題の `process` は、`completeIssue` 経由で `squashMerge` を呼ぶ。第一引数はマージリクエスト番号であり、第二引数は決定の件名の形である。課題番号 `5`、題が `題`、マージリクエスト番号 `2` のときは、第一引数が `2`、第二引数が `【課題 5】題` である。`createPullRequest` の `title` にこのプレフィックスが付くことは期待しない。`deleteBranch` は呼ばない。`commitAll`、`createPullRequest`、`addComment` は呼ばない。`issue close` は呼ばない。
- `process` は `squashMerge` を `completeIssue` の外で呼ばない。

## 実装の順序

1. `squashMerge` に件名の引数を足し、`pr merge` の引数が上の順であることと、成否の試験を通す。`squashMerge` は件名へプレフィックスを足さない。
2. `completeIssue` が、マージリクエスト番号と課題番号が違うときに、決定の件名の形を `squashMerge` へ渡す試験を通す。`merged` が true のときは渡さない。
3. 完了の `process` が、同じ `completeIssue` 経由でその件名を残す試験を通す。ランナーは `squashMerge` を直接呼ばない。`createPullRequest` の `title` は変えない。
