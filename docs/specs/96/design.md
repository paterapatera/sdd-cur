# 96 スカッシュマージでコンフリクトしないよう、作業ブランチを最新のデフォルトブランチに追従させる

対象は [Issue #96](https://github.com/paterapatera/sdd-cur/issues/96)。作業ブランチをリモートの最新のデフォルトブランチに追従させ、取り込みのコンフリクトで課題ランナーが止まらないようにする。

設計 27 は、要求と設計を作業ブランチに載せたまま実装し、実装着手時にデフォルトブランチから作業ブランチを作り直さない。この設計は、その定めを変えない。デフォルトブランチから作業ブランチを作り直さない。リモートの最新のデフォルトブランチを、作業ブランチへマージする。

## 受け入れ条件

- SDD スキルが作業ブランチを新しく作るとき、その起点はリモートの最新のデフォルトブランチである。
- 既にある作業ブランチを、デフォルトブランチから作り直さない。
- 課題ランナーは、実装の agent を起動する前に、リモートの最新のデフォルトブランチを作業ブランチへマージする。
- 課題ランナーは、修正の agent を起動する前に、リモートの最新のデフォルトブランチを作業ブランチへマージする。
- 完了処理は、スカッシュマージの前に、リモートの最新のデフォルトブランチを作業ブランチへマージする。
- 完了処理は、スカッシュマージの前に、作業ブランチを push する。
- 課題ランナーの完了処理と `complete` の両方で、このマージと push は同じ `completeIssue` が行う。
- 取り込みでコンフリクトしたときは、マージを取り消し、作業ブランチにそのマージを残さず、push しない。
- 取り込みでコンフリクトし、マージリクエストが無いときは、課題コメントに、コンフリクトしたファイルの一覧を書く。
- 取り込みでコンフリクトし、開いているマージリクエストがちょうど一件のときは、そのマージリクエストの会話に、コンフリクトしたファイルの一覧を書く。
- 取り込みでコンフリクトし、開いているマージリクエストが二件以上あるときは、課題コメントに、コンフリクトしたファイルの一覧を書く。
- 取り込みでコンフリクトし、開いているマージリクエストが無く、閉じたマージリクエストだけがあるときは、課題コメントに、コンフリクトしたファイルの一覧を書く。
- 取り込みでコンフリクトしても、課題ランナーは止まらない。
- 取り込みでコンフリクトした課題は、ラベル「コンフリクト」により、次の `poll` で返さない。
- 取り込みは、作業ブランチの履歴を書き換えない。rebase はしない。force push はしない。
- `bun test` は `gh`、`git`、`agent` を起動しない。

## 範囲外

次は作らない。

- コンフリクトの自動解消
- 取り込んだあとに、テストや受け入れテストをやり直すこと
- 設計 27 の「デフォルトブランチから作業ブランチを作り直さない」を変えること。`docs/specs/27/design.md` は書き換えない
- quick（#56）の作業ブランチの用意、および quick が実装の agent を起動する前の取り込み。`runQuick` は `mergeFetched` を呼ばない
- コンフリクトを人が解消したあとに、同じ課題を自動で再開すること。外したラベルは付け直さない
- 同時に進む課題がコンフリクトしにくいファイルの書き方（#97）
- 失敗した課題に理由を残すこと（#82）。コンフリクトのコメントは、下のファイル一覧だけである
- 成功した完了が「マージ済み」を付けること（#7）。コンフリクトのときは「マージ済み」を付けない
- マージしたブランチの削除（#18）。削除は設計 18 の `squashMerge` のままである。コンフリクトのときは `squashMerge` を呼ばない
- すでにマージ済みのマージリクエストを、もう一度スカッシュマージしないこと（#7）。`merged` が true のときは git を呼ばない
- スカッシュマージのコマンド自体が拒否したときの扱い。取り込みのコンフリクトとは分け、設計 7 のとおり止まり、「動作確認OK」は残る
- 「動作確認OK」を付けること。付けるのは人である
- 課題の作成とクローズ。`issue close` と `--state` は付けない
- 受け入れ手順、確認、回答。コメントの印は足さない。`src/conventions.ts` は変えない
- サブコマンドの追加。`src/cli.ts` の使い方の文言
- `src/run.ts` のループの形。`src/agent.ts`、`src/install.ts`、`src/sdd.ts` の変更。`candidateViews` と `selectQuickIssue` のコードは変えない
- `checkoutFetched` の引数と意味。`GitHubClient.createBranch` をこの取り込みから呼ぶこと
- 作業ブランチ上のコミットを、ローカルでスカッシュすること
- オープンな課題、およびヘッドが一致するマージリクエストの 101 件目以降
- `docs/conventions.md`、AGENTS.md、この課題以外の `design.md` と `requirements.md` の書き換え
- `agents/` の変更。`skills/sdd-cur-complete/SKILL.md` の禁止、承認、フロントマター
- Forgejo、Jira、Backlog
- 依存パッケージ。トークンと環境変数の読み取り。`git config` の変更
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| 新しいブランチの起点 | SDD スキルが作業ブランチを新しく作るときだけ、リモートの最新のデフォルトブランチである。実装のランナーは、この用意をしない |
| 既にあるブランチ | デフォルトブランチから作り直さない。用意ではマージしない |
| 実装の前 | `checkoutFetched` のあと、実装の agent の前に、デフォルトブランチを作業ブランチへマージする。成功しても、この時点では push しない |
| 修正の前 | 修正の agent の前に、同じマージをする。成功しても、この時点では push しない |
| 完了の前 | `merged` が false のとき、スカッシュマージの前に同じマージをし、そのあと作業ブランチを push する。主体は `completeIssue` だけである |
| 履歴 | `git merge FETCH_HEAD --no-edit`。早送りできるときは早送りする。rebase、`pull`、`--ff-only`、`--no-ff`、`--force` は使わない |
| コンフリクト | 未マージのパスがあるとき。`git merge --abort` で取り消す。push しない。agent を起動しない。スカッシュマージしない |
| ファイル一覧 | `open` が一件のとき、その会話。それ以外（マージリクエストが無い、`open` が二件以上、`open` が無く `closed` のみ）は課題コメント |
| ラベル | 業務ラベル「コンフリクト」。`workflowLabels` の末尾に足す。既存の五つの名前、説明、色、添字は変えない |
| poll から外す | 「コンフリクト」を付け、その探索が使うラベルを外す。三つの選択関数は「コンフリクト」がある課題を残さない。`listIssues` の引数と探索の優先順は変えない |
| ランナー | コンフリクトの処理がコメントとラベル変更まで終わったとき、`process` は拒否しない。`runLoop` は続行する |
| `complete` | 同じ `completeIssue` が `conflict` を返したとき、終了コード 1 である。`完了しました` は書かない |
| ラベル名 | `workflowLabels` の `name` だけを使う。別の字面で再定義しない |

ラベル名は、この表では課題の文言で書く。実装は `workflowLabels` から取る。

## ラベル

`src/labels.ts` の `workflowLabels` の末尾に、次を足す。先頭から五件の名前、説明、色は、今のままである。

| 名前 | 説明 | 色 |
|---|---|---|
| コンフリクト | 取り込みがコンフリクトした | `B60205` |

色は `#` の無い 6 桁である。`コンフリクト` は `workflowLabels[5].name` である。`ensureWorkflowLabels` は、この六件を今の順で、無いものだけ作る。既存の同名は、色も説明も変えない。

「コンフリクト」は業務ラベルである。`candidateViews` は、業務ラベルがある課題を残さない今の条件のまま、このラベルでも外れる。コードは変えない。SDD スキルは、業務ラベルが一つでもあるときは、今どおり要件も設計も始めず、作業ブランチも用意しない。

README の `labels` の説明は、六つの業務ラベルを作る、に変える。ラベルの表に、付ける主体を課題ランナーと完了処理、意味を「取り込みがコンフリクトした」として「コンフリクト」の行を足す。この行は、実装依頼からマージ済みまでの順の次ではない。完了処理の説明には、スカッシュマージの前にリモートの最新のデフォルトブランチを作業ブランチへマージして push する、を足す。スカッシュマージと「マージ済み」は、そのあとである。

## スキルの手順

`skills/sdd-cur/SKILL.md` の「要件」のうち、作業ブランチを用意する段落を変える。名前の取得、比較、デフォルトブランチには書かないこと、実装のランナーはこの用意をしないこと、は残す。フロントマターと禁止は変えない。`gh` は直接起動しない。

作業ブランチ名は、今どおり `bun src/cli.ts branch <番号>` の標準出力から得る。末尾改行は除く。

用意は、要求作成役を起動する前に、次の順で行う。失敗したときは、作業ブランチをデフォルトブランチから作らず、要求ファイルを作らず、要求作成役を起動しない。

1. `git remote` の空行を除いた名前が一つでなければ、`リモートを特定できません` として止まる。
2. ローカルに `refs/heads/<作業ブランチ>` があるときは、`git checkout <作業ブランチ>` する。デフォルトブランチは fetch しない。作り直さない。
3. ローカルに無く、`git ls-remote --heads <remote> <作業ブランチ>` の標準出力にそのブランチがあるときは、そのリモートの作業ブランチを `git fetch <remote> <作業ブランチ>` し、`git checkout -B <作業ブランチ> FETCH_HEAD` する。起点はデフォルトブランチではない。
4. ローカルにもリモートにも無いときだけ、新しく作る。`git ls-remote --symref <remote> HEAD` の、`ref: refs/heads/` のあと空白の前までが、デフォルトブランチ名である。取れないときは `デフォルトブランチを特定できません` として止まる。その名前を `git fetch <remote> <デフォルトブランチ>` し、`git checkout -b <作業ブランチ> FETCH_HEAD` で作る。起点は、この fetch したリモートの最新のデフォルトブランチである。

用意ではマージしない。rebase はしない。`git push` をしない。履歴を書き換えない。

用意のあと、作業ブランチ名と今のブランチを比べる今の手順は残す。違うときは、ファイルを変えず、サブエージェントを起動しない。

「設計」では、作業ブランチを新しく作らない。デフォルトブランチから作業ブランチを作り直さない。設計ファイルは、要求のときに用意した同じ作業ブランチに書く。デフォルトブランチには書かない。

`skills/sdd-cur-complete/SKILL.md` の、コマンドが行うことの文を変える。承認、禁止、フロントマター、「課題ランナーの完了処理は現状どおり」は残す。「これは現状のままである。」は残さない。コマンドの説明は、スカッシュマージの前にリモートの最新のデフォルトブランチを作業ブランチへマージし、作業ブランチを push し、そのあとスカッシュマージして「動作確認OK」を外し「マージ済み」を付ける、である。スキル自身はコメントを投稿しない。投稿するのは `complete` が呼ぶ `completeIssue` である。

## git

`GitClient` に次を足す。既存の操作の引数は変えない。`push` は `push -u <remote> <branch>` のままである。`--force` は付けない。

```ts
export type MergeFetchedResult =
  | { status: "merged" }
  | { status: "conflict"; files: readonly string[] }

mergeFetched(): Promise<MergeFetchedResult>
```

`mergeFetched` は、今のブランチへ `FETCH_HEAD` をマージする。呼ぶ直前の `fetch` は、デフォルトブランチである。

成功の引数は、この順である。

```
merge
FETCH_HEAD
--no-edit
```

終了コードが 0 のときは `{ status: "merged" }` を返す。すでに最新であるときも、終了コード 0 であり、同じである。

終了コードが 0 以外のときは、次の引数で未マージのパスを取る。

```
diff
--name-only
--diff-filter=U
```

標準出力を改行で分け、前後の空白を除き、空の行を除いたものが一件以上あるとき、コンフリクトである。次の引数でマージを取り消す。

```
merge
--abort
```

取り消しの終了コードが 0 のとき、パスをコード単位の昇順に並べ、`{ status: "conflict", files }` を返す。このとき拒否しない。取り消したあとの先頭は、そのマージを始める前の先頭である。

未マージのパスが無いときは、取り消しを呼ばず、設計 6 の git の失敗理由で拒否する。取り消しが 0 以外のときも、その失敗理由で拒否する。`conflict` は返さない。

`rebase`、`pull`、`reset` は呼ばない。`--ff-only` と `--no-ff` は付けない。早送りできるときは早送りする。分岐しているときは、`git merge` がマージコミットを作る。件名は `--no-edit` の既定である。履歴は書き換えない。

## 実装と修正

`runImplementation` は、今の着手の `editLabels`、`getDefaultBranch`、作業ブランチ名、`remoteName`、作業ブランチの `fetch`、`checkoutFetched` のあと、手順ファイルを作る前に、取り込みを行う。

1. 同じリモートの、着手で得ている `getDefaultBranch` の戻り値を `fetch` する。`FETCH_HEAD` はこのデフォルトブランチになる。
2. `mergeFetched` を呼ぶ。
3. `conflict` のときは、下の「コンフリクト」へ進み、`process` から戻る。手順ファイル、`implement`、コミット、push、マージリクエストは作らない。
4. `merged` のときは、今の手順ファイル、`implement`、受け入れ手順、変更の有無、コミット、push、`createPullRequest`、`addComment`、完了の `editLabels` へ進む。push はこのコミットのあとであり、`--force` は付けない。

`runFix` は、今の着手の `editLabels`、`remoteName`、作業ブランチの `fetch`、`checkoutFetched` のあと、手順ファイルを作る前に、同じ取り込みを行う。デフォルトブランチ名は、この時点の `getDefaultBranch` である。`conflict` のときは、修正の agent を起動しない。コミットも push もしない。`merged` のときは、今の修正の続きへ進む。push は、修正のコミットのあとである。

各外部呼び出しは、拒否したときその呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まり、それより後は呼ばない。`mergeFetched` の `conflict` は拒否ではない。やり直さない。成功した呼び出しはやり直さない。ラベルは戻さない。作業ツリーは戻さない。

`runQuick` は、この取り込みを足さない。`mergeFetched` を呼ばない。

## コンフリクト

コンフリクトのとき、作業ブランチにそのマージは残っていない。push しない。リモートの作業ブランチは、この取り込みでは動かない。課題は閉じない。

ファイル一覧の本文は、`conflictFileComment` の戻り値である。

```ts
export function conflictFileComment(files: readonly string[]): string
```

置き場所は `src/complete.ts` である。引数の配列は変えない。空の要素を除き、コード単位の昇順で並べる。最初の行は `コンフリクトしたファイル` と一文字も違わない。2 行目以降が、一行に一つのパスである。行の区切りは `\n` である。末尾に `\n` は付けない。最初の非空行は、確認、回答、受け入れ手順、不具合、修正の印にしない。

コメント先は、次である。

| 場面 | マージリクエスト（実装は `listPullRequests` の結果） | 書く場所 |
|---|---|---|
| 実装 | `open` が一件 | その会話。`addPullRequestComment` |
| 実装 | 無い、`open` が二件以上、`open` が無く `closed` のみ | 課題コメント。`addComment` |
| 修正 | 着手で特定した一件 | その会話。`addPullRequestComment` |
| 完了 | その一件の `state` が `open` | その会話。`addPullRequestComment` |
| 完了 | その一件が `open` でない | 課題コメント。`addComment` |

開いているは、`state` が `open` と一文字も違わないときである。実装のコンフリクトのときだけ、`listPullRequests({ head, limit: 100 })` を呼ぶ。`head` は `implementationBranch` の戻り値である。コメント先は、`open` が一件のときだけその会話へ書く。それ以外（無い、二件以上、`open` が無く `closed` のみ）のときは課題コメントへ書く。二件以上でも `マージリクエストを特定できません` では拒否しない。`closed` だけあるときは「開いているマージリクエストがある」には当たらない。修正は、着手で特定したマージリクエストの会話へ書く。もう一度は探さない。

コメントのあと、一回の `editLabels` で「コンフリクト」を付ける。

| 場面 | `remove` | `add` |
|---|---|---|
| 実装 | 「実装中」 | 「コンフリクト」 |
| 修正 | 「実装中」 | 「コンフリクト」 |
| 完了 | 「動作確認OK」 | 「コンフリクト」 |

「マージ済み」は付けない。着手で外した「実装依頼」と「実装完了」は、付け直さない。コメントと `editLabels` は、拒否したときその呼び出しだけをもう一度行う。二度目も拒否したときは、その理由で止まり、それより後は呼ばない。コメントが二度拒否したときは、`editLabels` を呼ばない。

コメントと `editLabels` が両方終わったとき、`process` は拒否しない。`runLoop` は、その課題の処理を終えて続行する。終了コードは 0 である。

`selectImplementationIssue` は、ラベルに「コンフリクト」がある課題を残さない。「実装依頼」があっても残さない。`issueHasFixLabels` は、「コンフリクト」がある課題を、修正の対象にしない。「実装完了」があっても対象にしない。`selectCompletionIssue` は、「コンフリクト」がある課題を残さない。「動作確認OK」があっても残さない。`selectQuickIssue` は変えない。「コンフリクト」は業務ラベルなので、今の条件で残らない。

`poll` の `listIssues` の引数は変えない。優先順は、実装依頼、不具合修正、quick、動作確認OKのままである。上の選択で残らない課題は、次の `poll` の戻り値にしない。

## 完了処理

```ts
export type CompleteResult = "completed" | "conflict"

export function completeIssue(
  github: {
    getIssue: GitHubClient["getIssue"]
    listPullRequests: GitHubClient["listPullRequests"]
    getDefaultBranch: GitHubClient["getDefaultBranch"]
    addComment: GitHubClient["addComment"]
    addPullRequestComment: GitHubClient["addPullRequestComment"]
    squashMerge: GitHubClient["squashMerge"]
    editLabels: GitHubClient["editLabels"]
  },
  git: {
    remoteName: GitClient["remoteName"]
    fetch: GitClient["fetch"]
    checkoutFetched: GitClient["checkoutFetched"]
    mergeFetched: GitClient["mergeFetched"]
    push: GitClient["push"]
  },
  issueNumber: number,
): Promise<CompleteResult>
```

番号が不正なとき、および「動作確認OK」が無いときの分岐は、設計 7 のままである。この分岐では git を呼ばない。何もせず戻るときは `"completed"` を返す。`動作確認OKがありません` のときは拒否する。

通過し、マージリクエストが 0 件または 2 件以上のときは、設計 7 のとおり拒否する。取り込みは始めない。この拒否はコンフリクトではない。

マージリクエストが一件で `merged` が true のときは、git も `squashMerge` も呼ばない。`editLabels` で「動作確認OK」を外し、「マージ済み」を付ける。`"completed"` を返す。

`merged` が false のときは、スカッシュマージの前に、次の順で、拒否した時点より後は呼ばない。

1. `remoteName`。
2. そのリモートの作業ブランチを `fetch` し、`checkoutFetched` する。作業ブランチ名は `implementationBranch` の戻り値である。
3. `getDefaultBranch`。
4. そのリモートのデフォルトブランチを `fetch` する。
5. `mergeFetched`。
6. `conflict` のときは、上の「コンフリクト」の完了の行でコメントし、`editLabels` する。push しない。`squashMerge` を呼ばない。「マージ済み」を付けない。`"conflict"` を返す。
7. `merged` のときは、そのリモートの作業ブランチへ `push` する。`--force` は付けない。
8. その番号で `squashMerge` を呼ぶ。件名は設計 73 のままである。ブランチの削除は、この `squashMerge` に含まれる。
9. `editLabels` で「動作確認OK」を外し、「マージ済み」を付ける。`"completed"` を返す。

1 から 5、7 から 9 は、拒否したときその呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まる。`mergeFetched` の `conflict` は拒否ではない。push も `squashMerge` も呼ばない。`squashMerge` が成功したあとに 9 が二度拒否したときは、`squashMerge` は一回のままである。

`src/runner.ts` の完了分岐は、`completeIssue(deps.github, deps.git, issueNumber)` を一回呼ぶ。戻り値では分岐しない。`"completed"` でも `"conflict"` でも `process` は拒否しない。`completeIssue` が拒否したときは、その理由で `process` が拒否する。ランナーは外側ではやり直さない。

`src/cli.ts` の `complete` は、`createGitHub` のあと、作業ディレクトリで `createGit` を作り、`completeIssue` へ渡す。`"completed"` のときは、標準出力へ `完了しました: <番号>` を一行書き、終了コード 0 である。`"conflict"` のときは、標準エラーへ `取り込みがコンフリクトしました` を一行書き、終了コード 1 である。`完了しました` は書かない。拒否したときは、その理由を標準エラーへ一行書き、終了コード 1 である。使い方は書かない。

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。

`src/labels.test.ts` では、`workflowLabels` の六件目が、上の名前、説明、色と一致する。先頭五件は今のままである。`ensureWorkflowLabels` の、無いものだけの戻り値は六件である。三件目の `createLabel` で止まる試験の、三件で止まる期待は変えない。

`src/git.test.ts` に足す。注入した `GitRunner` の引数を記録する。

- 終了コード 0 の `mergeFetched` は、`merge`、`FETCH_HEAD`、`--no-edit` をこの順で一回呼び、`merged` を返す。`merge --abort` は呼ばない。
- `merge` が 0 以外で、`diff --name-only --diff-filter=U` が `b` と `a` を返すときは、`merge --abort` を呼び、`conflict` の `files` は `a`、`b` の順である。拒否しない。
- `merge` が 0 以外で、未マージのパスが空のときは、`merge --abort` を呼ばず、その失敗理由で拒否する。
- 未マージのパスがあり、`merge --abort` が 0 以外のときは、その失敗理由で拒否する。`conflict` は返さない。

`src/complete.test.ts` に足す。

- `conflictFileComment` は引数を変えない。最初の行は `コンフリクトしたファイル` であり、パスは昇順である。
- `merged` が false で取り込みが `merged` のときは、作業ブランチの `fetch`、`checkoutFetched`、デフォルトブランチの `fetch`、`mergeFetched`、`push`、`squashMerge`、完了の `editLabels` の順である。`push` に `--force` は無い。`editLabels` の削除は「動作確認OK」、追加は「マージ済み」である。
- `merged` が true のときは、git と `squashMerge` を呼ばない。
- マージリクエストが 0 件のときは、git を呼ばない。
- `mergeFetched` が `conflict` を返し、特定した一件のマージリクエストの `state` が `open` のときは、`addPullRequestComment` の本文がファイル一覧であり、`push` と `squashMerge` を呼ばない。`editLabels` の削除は「動作確認OK」、追加は「コンフリクト」であり、「マージ済み」は無い。戻り値は `conflict` である。`issue close` は呼ばない。
- その一件の `state` が `open` でないとき（`closed` のみなど）は、課題の `addComment` を呼び、`addPullRequestComment` は呼ばない。
- `squashMerge` が成功したあと、完了の `editLabels` が二度拒否したときは、`squashMerge` は一回のままである。
- `skills/sdd-cur-complete/SKILL.md` に、スカッシュマージの前のマージと push がある。「これは現状のままである。」は無い。禁止の既存の文言は残る。

`src/runner.test.ts` に足す。注入した github と git の呼び出しを記録する。既存の git のモックは `mergeFetched` を持つ。成功時は `{ status: "merged" }` を返す。

- 通過した実装の `process` は、作業ブランチの `fetch` と `checkoutFetched` のあと、デフォルトブランチの `fetch` と `mergeFetched` を呼び、そのあと `implement` を呼ぶ。デフォルトブランチの `fetch` に渡す名前は、`getDefaultBranch` の戻り値である。`mergeFetched` より前に `implement` は呼ばない。
- 実装の `mergeFetched` が `conflict` を返し、`listPullRequests` の `open` が一件のときは、`addPullRequestComment` を呼び、`implement` と `push` を呼ばない。`editLabels` で「実装中」を外し「コンフリクト」を付ける。`process` は拒否しない。
- `open` が無いとき、二件以上のとき、`open` が無く `closed` のみのときは、課題の `addComment` を呼び、`addPullRequestComment` は呼ばない。`implement` と `push` を呼ばない。`process` は拒否しない。
- 修正の `mergeFetched` が `conflict` のときは、その修正のマージリクエストの会話へファイル一覧を書き、`fix` と `push` を呼ばない。「実装中」を外し「コンフリクト」を付ける。
- quick の `process` は `mergeFetched` を呼ばない。
- `selectImplementationIssue` は、「コンフリクト」がある課題を返さない。`issueHasFixLabels` は、「実装完了」があっても「コンフリクト」がある課題を対象にしない。`selectCompletionIssue` は、「動作確認OK」があっても「コンフリクト」がある課題を返さない。
- 完了の `process` は、`completeIssue` が `conflict` のとき拒否しない。`squashMerge` を呼ばない。同じ課題が「コンフリクト」を持ち「動作確認OK」を持たないとき、次の `poll` はその課題を返さない。

`src/sdd.test.ts` の、`skills/sdd-cur/SKILL.md` の既存の必須文言は残す。加えて、次が含まれる。

- `リモートの最新のデフォルトブランチ`
- `git ls-remote --symref`
- `git checkout -b`
- `用意ではマージしない`
- `rebase はしない`

`デフォルトブランチから作業ブランチを作り直さない` は、残ったままである。

## 作業の一覧

1. `workflowLabels` の末尾に「コンフリクト」を足し、`src/labels.test.ts` を上の期待に合わせる。
2. `src/git.ts` に `mergeFetched` を足し、`src/git.test.ts` を通す。
3. `src/complete.ts` に `conflictFileComment` と、完了の前のマージと push と、コンフリクトの戻り値を足す。`src/complete.test.ts` を通す。
4. `src/runner.ts` の実装と修正に、agent の前のマージを足す。三つの選択関数から「コンフリクト」を外す。quick は変えない。`src/runner.test.ts` を上の期待に合わせる。
5. `src/cli.ts` の `complete` が `createGit` を渡し、`conflict` のとき終了コード 1 と `取り込みがコンフリクトしました` を書くようにする。
6. `skills/sdd-cur/SKILL.md` の用意と、`skills/sdd-cur-complete/SKILL.md` のコマンドの説明を、上の文言に変える。文言の試験を合わせる。
7. README のラベルの数、表、完了処理の文を、上のとおり変える。
8. `bun test` を通し、`gh`、`git`、`agent` を起動しないことを確かめる。
