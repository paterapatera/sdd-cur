# 27 要求と設計が main に入り実装ブランチへ載せ直している

対象は [Issue #27](https://github.com/paterapatera/sdd-cur/issues/27)。要求と設計をデフォルトブランチへ入れず、課題の作業ブランチに載せたまま実装する。

課題が言う main は、リモートのデフォルトブランチである。

## 受け入れ条件

- 要求を書き始めるとき、作業ブランチがあり、Project A の作業ツリーはそのブランチである。
- 要求と設計は、その作業ブランチに書く。デフォルトブランチには書かない。
- 人は、要求と設計を含む作業ブランチを push してから「実装依頼」を付ける。
- クローンの実装は、push 済みのその作業ブランチの上で行う。
- 実装着手時に、リモートのデフォルトブランチから作業ブランチを作り直さない。要求と設計の差分を、そこへ載せ直さない。
- `bun test` は `gh`、`git`、`agent` を起動しない。

## 範囲外

次は作らない。

- 要求や設計の時点でマージリクエストを作ること
- 要求と設計をチェリーピックで移すこと
- 要求と設計の push。行うのは人である。ランナーが実装の変更を push する設計 6 の手順は変えない
- 「実装依頼」を付けること。付けるのは人である
- ラベルの変更。設計 6 の着手と実装完了の `editLabels` は変えない
- 課題の作成とクローズ
- 受け入れ手順
- 完了処理
- ブランチの削除（#18）
- Forgejo、Jira、Backlog
- `docs/specs/6/design.md` の書き換え。実装着手で `createBranch` を呼ばないことは、この設計が定める
- `src/github.ts` の `createBranch` と `getDefaultBranch` の実装。`src/git.ts` の引数
- `agents/` の変更
- `docs/plan.md`、`docs/conventions.md`、課題 1〜7 と課題 20〜22 の `design.md` の書き換え

## 決定

| 項目 | 内容 |
|---|---|
| 作業ブランチ | 名前は `implementationBranch` の戻り値である。関数の実装は変えない |
| 用意する主体 | 要求を書き始める SDD スキルの手順。実装のランナーは用意しない |
| 用意の結果 | Project A の作業ツリーは、その作業ブランチである。要求ファイルと設計ファイルは、この作業ツリーに書く |
| デフォルトブランチ | 要求ファイルも設計ファイルも書かない |
| 設計 | 要求のときに用意した同じ作業ブランチで書く。デフォルトブランチから作業ブランチを作り直さない |
| 実装 | クローンは push 済みの作業ブランチを `fetch` し、`checkoutFetched` でその上にいる。要求と設計は、そのブランチに既にある。`createBranch` は呼ばない |
| 載せ直し | デフォルトブランチから切り直したブランチへ、要求と設計の差分を移さない。`cherry-pick` は呼ばない |
| push と実装依頼 | 人が行う。push するのは、要求と設計を含む作業ブランチである |
| マージリクエスト | 要求と設計の手順では作らない。実装の `createPullRequest` は設計 6 のままである。`base` はデフォルトブランチ、`head` は作業ブランチ |

## スキルの手順

`skills/sdd-cur/SKILL.md` の「要件」と「設計」を変える。着手、確認、回答、禁止の既存の必須文言は残す。フロントマターは変えない。

「要件」では、`show` のあと、課題が開いていて業務ラベルが無く、要件の状態が `invalid` でないときに、要求作成役を起動する前に作業ブランチを用意する。

- 作業ブランチの名前は `implementationBranch` の戻り値である。
- 用意は、この手順の中で行う。実装のランナーは、この用意をしない。
- 用意したとき、Project A の作業ツリーはその作業ブランチである。
- 要求ファイルは、この作業ツリーに書く。デフォルトブランチには書かない。
- `state` が `open` でないとき、および業務ラベルが一つでもあるときは、これまでどおり止まり、作業ブランチも用意しない。
- 要件の状態が `invalid` のときは上書きしない。作業ブランチも用意しない。サブエージェントは起動しない。

「設計」では、要求の状態が `ready` であり、設計の状態が `invalid` でないとき、設計ファイルを書く作業ツリーは、要求のときに用意した同じ作業ブランチである。

- デフォルトブランチから作業ブランチを作り直さない。
- 設計ファイルは、この作業ツリーに書く。デフォルトブランチには書かない。
- この手順は要求ファイルを作らない。
- 人が設計の完了を伝えたときは、push と「実装依頼」は人が行う。push するのは、要求と設計を含む作業ブランチである。

## ランナー

`src/runner.ts` の `runImplementation` から `createBranch` を外す。`implementationBranch`、`getDefaultBranch`、`fetch`、`checkoutFetched`、`createPullRequest` は残す。`poll` は変えない。

`process` が実装するときの順は、設計 6 の手順から `createBranch` を除いたものである。拒否した時点より後は呼ばない。作業ツリーの復元と、ラベルを戻す呼び出しはしない。

1. `id` が番号でなければ `番号が不正です`。
2. `getIssue`。ラベルに「実装依頼」が無い、または「実装中」があるときは、何もせず戻る。
3. `editLabels` で「実装依頼」を外し、「実装中」を付ける。
4. `getDefaultBranch`。
5. 作業ブランチ名は `implementationBranch` の戻り値である。`createBranch` は呼ばない。
6. リモートが一つでなければ `リモートを特定できません`。
7. そのリモートの作業ブランチを `fetch` し、その `FETCH_HEAD` を `checkoutFetched` する。
8. 手順ファイル、`implement`、受け入れ手順、変更の有無、コミット、push、`createPullRequest`、`addComment`、完了の `editLabels` は設計 6 のままである。

`createPullRequest` の `base` は 4 のデフォルトブランチ、`head` は作業ブランチ、`title` は課題の題、`body` は課題の `url` である。`Fixes` と `Closes` は足さない。

`fetch` が拒否したときは、その呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まる。`createBranch` は呼ばない。`checkoutFetched` も `implement` も呼ばない。失敗の理由は、設計 6 の git の失敗理由のままである。

再試行の対象から `createBranch` を外す。それ以外の外部呼び出しの再試行は設計 6 のままである。`GitHubClient.createBranch` は残す。実装の `process` からは呼ばない。

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。

`src/sdd.test.ts` の、`skills/sdd-cur/SKILL.md` の既存の必須文言は残す。加えて、次が含まれる。

- `作業ブランチを用意する`
- `implementationBranch`
- `実装のランナーは、この用意をしない`
- `デフォルトブランチには書かない`
- `同じ作業ブランチ`
- `デフォルトブランチから作業ブランチを作り直さない`
- `要求と設計を含む作業ブランチ`

`src/runner.test.ts` で、注入した github と git の呼び出しを記録する。`gh`、`git`、`agent` は起動しない。

- 通過した `process` は、着手の `editLabels`、`getDefaultBranch`、`remoteName`、`fetch`、`checkoutFetched`、`implement`、`hasChanges`、`commitAll`、`push`、`createPullRequest`、`addComment`、完了の `editLabels` の順で呼ぶ。`createBranch` は呼ばない。
- `fetch` に渡すブランチ名、`checkoutFetched` に渡すブランチ名、`createPullRequest` の `head` は `implementationBranch` の戻り値である。`createPullRequest` の `base` は `getDefaultBranch` の戻り値である。`body` は課題の `url` であり、`Fixes` と `Closes` を含まない。
- `fetch` が一度拒否し、二度目に成功したときは、`checkoutFetched` へ進む。`createBranch` は呼ばない。
- `fetch` が二度拒否したときは、その理由で止まる。`createBranch`、`checkoutFetched`、`implement` は呼ばない。

## 作業の一覧

1. `skills/sdd-cur/SKILL.md` の「要件」と「設計」を、上の手順に変える。既存の必須文言は残す。文言の試験を足す。
2. `src/runner.ts` の実装着手から `createBranch` を外す。`src/runner.test.ts` の順序と、`fetch` が拒否したときの試験を、上の期待に変える。
3. `bun test` を通し、`gh`、`git`、`agent` を起動しないことを確かめる。
