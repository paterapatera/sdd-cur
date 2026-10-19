# 6 課題ランナー: 実装依頼から実装完了まで

対象は [Issue #6](https://github.com/paterapatera/sdd-cur/issues/6)。クローン上の `run` が、「実装依頼」から「実装完了」までを行う。

## 受け入れ条件

- クローン一つで、「実装依頼」の課題を「実装完了」まで進められる。
- 二つのクローンが、別々の「実装依頼」を同時に進められる。先に「実装中」へ変えた課題は、もう一方の探索から外れる。
- `bun test` は `gh`、`git`、`agent` を起動しない。

## 範囲外

次は作らない。

- 完了処理。`squashMerge`、「動作確認OK」、「マージ済み」（#7）
- 課題の作成とクローズ。`issue close` と `--state` は付けない
- Project A かどうかの判定。起動するディレクトリは人がクローンにする
- ロック。設計 1 のとおり、クローンは別プロセスであり、排他はラベルの変更だけである
- 失敗したラベルの戻し、作業ツリーの復元。`process` 全体の最初からのやり直し
- オープンな課題の 101 件目以降。`listIssues` の続きは取らない
- `src/run.ts` のループの形。`src/conventions.ts`、`src/install.ts`、`src/labels.ts`、`src/sdd.ts` の変更
- `docs/plan.md`、`docs/conventions.md`、課題 1〜5 の `design.md` の書き換え
- Forgejo、Jira、Backlog
- 依存パッケージ。トークンと環境変数の読み取り。`git config` の変更
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| ループ | `src/run.ts` はそのままである。`poll` が仕事を返してから `process` が終わるまで、次の `poll` は呼ばない |
| 入口 | `src/cli.ts` の `run` が、作業ディレクトリで `resolveRepo` と `createGitHub` を呼び、`createRunner` をループへ渡す |
| 探索 | `listIssues({ labels: ["実装依頼"], limit: 100 })`。`state` は渡さない。返った配列から、「実装中」を持つ課題を除き、`number` の昇順で先頭一件を取る |
| 着手 | 実装より前に、`editLabels` で「実装依頼」を外し、「実装中」を付ける。追加と削除は一回の `editLabels` にまとめる |
| ブランチ | 名前は `sdd-cur/<番号>`。起点はリモートのデフォルトブランチであり、`createBranch` がその参照の現在の SHA から作る。ここが、push 済みの `docs/specs` を含むリモートの状態である |
| 作業ツリー | リモートブランチを `fetch` し、その `FETCH_HEAD` をローカルブランチとして checkout する。実装のスキルは、この作業ツリーの `docs/specs` を読む |
| スキル | `skills/sdd-cur-implement/SKILL.md`。`install` の既存のコピーで置ける。ランナーは `agent` を、そのクローンのディレクトリで起動する |
| 結果 | 変更を一件コミットして push し、`createPullRequest` で開いたマージリクエストにする。`squashMerge` は呼ばない |
| 実装完了 | 受け入れ手順のコメントのあと、`editLabels` で「実装中」を外し、「実装完了」を付ける。追加と削除は一回の `editLabels` にまとめる |
| ラベル名 | `workflowLabels` の `name` だけを使う。別の字面で再定義しない |
| 失敗 | 理由は一行である。`poll` と `process` は、拒否した外部呼び出しだけをもう一度行う。二度目も拒否したときは、その理由をループへ返し、設計 1 のとおり終了コード 1 で止まる。成功した呼び出しはやり直さない。ラベルは戻さない |

ラベル名は、この表では課題の文言で書く。実装は `workflowLabels` から取る。

## ランナー

```ts
export function selectImplementationIssue(issues: readonly Issue[]): Issue | null

export function implementationBranch(issueNumber: number): string

export function acceptanceComment(payload: string): string

export function createRunner(deps: {
  github: {
    listIssues: GitHubClient["listIssues"]
    getIssue: GitHubClient["getIssue"]
    editLabels: GitHubClient["editLabels"]
    getDefaultBranch: GitHubClient["getDefaultBranch"]
    createBranch: GitHubClient["createBranch"]
    createPullRequest: GitHubClient["createPullRequest"]
    addComment: GitHubClient["addComment"]
  }
  git: GitClient
  agent: {
    implement(input: { issueNumber: number; procedurePath: string }): Promise<void>
  }
  createProcedureFile(): Promise<{ path: string; remove(): Promise<void> }>
}): Runner
```

`WorkItem` は設計 1 のままである。`id` は課題番号を十進にした文字列であり、先頭の零は付けない。

`selectImplementationIssue` は引数の配列を変えない。「実装依頼」が無い課題を除く。「実装中」がある課題を除く。両方のラベルがある課題も除く。残った配列を `number` の昇順で並べ、先頭を返す。空なら `null` である。ラベルの一致は完全一致である。

`implementationBranch` は、番号が 1 以上の安全な整数でないとき `番号が不正です` で拒否する。成功時は `sdd-cur/` と十進の番号を連結する。

`acceptanceComment` は、payload の前後の空白を除いて空のとき `受け入れ手順が空です` で拒否する。空でないときは、改行を `\n` にそろえたあと、`trim` して空でない最初の行が三つの印のどれかと完全一致するとき `受け入れ手順に印を含めない` で拒否する。成功時は `commentMarkers.acceptance`、`\n`、渡された payload を連結する。payload の空白は削らない。

`createRunner` の `poll` は、`listIssues` を上の引数で呼び、`selectImplementationIssue` の結果を `WorkItem` にする。無いときは `null` である。

`poll` と `process` の各外部呼び出しは、拒否したときその呼び出しだけをもう一度行う。二度目も拒否したときは、そこで止まり、それより後は呼ばない。`listIssues`、`getIssue`、`editLabels`、`getDefaultBranch`、`createBranch`、`remoteName`、`fetch`、`checkoutFetched`、`implement`、`hasChanges`、`commitAll`、`push`、`createPullRequest`、`addComment` が対象である。`process` を最初の着手からやり直すことはしない。

`process` は次の順で、拒否した時点より後は呼ばない。作業ツリーの復元と、ラベルを戻す呼び出しはしない。

1. `id` が番号でなければ `番号が不正です`。
2. `getIssue`。ラベルに「実装依頼」が無い、または「実装中」があるときは、何もせず戻る。
3. `editLabels` で「実装依頼」を外し、「実装中」を付ける。
4. `getDefaultBranch`。ブランチ名は `implementationBranch` の戻り値である。
5. `createBranch(name, defaultBranch)`。
6. リモートが一つでなければ `リモートを特定できません`。
7. そのリモートのブランチを `fetch` し、`FETCH_HEAD` を checkout する。
8. 作業ツリーの外に手順ファイルを作り、`agent.implement` に番号とその絶対パスを渡す。一度拒否したときは、手順ファイルを残し、同じパスでもう一度呼ぶ。
9. `implement` が成功したときは、手順ファイルを読み、`acceptanceComment` に通す。読み終えたあとにファイルを消す。`acceptanceComment` が拒否したときも消す。`implement` が二度拒否したときは、読まずにファイルを消す。
10. 作業ツリーに変更が無いときは `実装の変更がありません`。コミットもマージリクエストも作らない。
11. メッセージ `feat: 課題 <番号> を実装する` で一件コミットし、そのリモートへ push する。
12. `createPullRequest`。`base` はデフォルトブランチ、`head` は作業ブランチ、`title` は課題の題、`body` は課題の `url` である。`Fixes` と `Closes` は足さない。
13. `addComment` に、番号と `acceptanceComment` の戻り値を渡す。
14. `editLabels` で「実装中」を外し、「実装完了」を付ける。

2 で戻るときは、`editLabels` も `agent` も呼ばない。`implement` が二度拒否したとき、および `acceptanceComment` が拒否したときは、コミット、`createPullRequest`、`addComment`、14 を呼ばない。

`src/cli.ts` の `run` は、シグナルの受け取りを今どおり登録したあと、作業ディレクトリで `resolveRepo` と `createGitHub` を呼ぶ。ここで拒否したときは、その理由を標準エラーへ一行書き、ループへ入らず終了コード 1 である。通過したときは `createGit` と `createAgent` と `createRunner` を組み立て、既存の `runLoop` へ渡す。

## デフォルトブランチ

`GitHubClient` に次を足す。既存の操作の引数は変えない。

```ts
getDefaultBranch(): Promise<string>
```

`repo view --json defaultBranchRef` を、`resolveRepo` と同じく `--repo` なしで、`createGitHub` の `cwd` で一回呼ぶ。応答の `defaultBranchRef.name` が、ブランチ名の規則を満たす文字列のとき、その文字列を返す。無いとき、または規則を満たさないときは `gh の応答を解釈できません` で拒否する。

## git

`src/git.ts` に置く。`gh` は呼ばない。

```ts
export type GitResult = {
  stdout: string
  stderr: string
  exitCode: number
}

export type GitRunner = {
  run: (
    args: string[],
    options: { cwd: string },
  ) => Promise<GitResult>
}

export type GitClient = {
  remoteName(): Promise<string>
  fetch(remote: string, branch: string): Promise<void>
  checkoutFetched(branch: string): Promise<void>
  hasChanges(): Promise<boolean>
  commitAll(message: string): Promise<void>
  push(remote: string, branch: string): Promise<void>
}

export function createGit(options: { git: GitRunner; cwd: string }): GitClient
```

`defaultGitRunner` は `Bun.spawn` で `git` を起動する。`args` に実行ファイル名は含めない。標準入力は空のパイプを閉じて渡す。標準出力と標準エラーは集め、端末へは流さない。環境は今のプロセスのものを子へ渡す。モジュールは環境変数を読まない。起動できないときは `git を実行できません` で拒否する。終了コードが 0 以外のときは、標準エラーの先頭の非空行、それが無ければ標準出力の先頭の非空行、それも無ければ `git が失敗しました` で拒否する。

| 操作 | 引数 |
|---|---|
| `remoteName` | `remote` |
| `fetch` | `fetch <remote> <branch>` |
| `checkoutFetched` | `checkout -B <branch> FETCH_HEAD` |
| `hasChanges` | `status --porcelain` |
| `commitAll` | `add -A` のあと `commit -m <message>` |
| `push` | `push -u <remote> <branch>` |

`remoteName` は、標準出力を改行で分け、空行を除いた名前が一つだけのとき、その名前を返す。ゼロまたは二つ以上のときは `リモートを特定できません` であり、`run` が成功していても拒否する。

`hasChanges` は、終了コード 0 の標準出力から、前後の空白を除いて空でないとき `true` である。

`commitAll` の `add` が拒否したときは `commit` を呼ばない。`--force` は付けない。`git config` は呼ばない。

## agent

`src/agent.ts` に置く。

```ts
export type AgentRunner = {
  run: (
    args: string[],
    options: { cwd: string },
  ) => Promise<GitResult>
}

export function createAgent(options: {
  agent: AgentRunner
  cwd: string
}): {
  implement(input: { issueNumber: number; procedurePath: string }): Promise<void>
}
```

`defaultAgentRunner` は `agent` を、`defaultGitRunner` と同じ形で起動する。起動できないときは `agent を実行できません` で拒否する。終了コードが 0 以外のときの理由は、git と同じ順で、最後は `agent が失敗しました` である。トークンも環境変数も読まない。`--api-key` は付けない。

`implement` は、番号が不正なら `番号が不正です` で、`run` を呼ばない。手順パスが空、または空白か改行を含むときは `受け入れ手順のパスが不正です` で、`run` を呼ばない。成功時の引数は、この順の配列である。

```
-p
--force
--trust
--workspace
<cwd>
--output-format
text
/sdd-cur-implement <番号> <手順パス>
```

最後の要素は、スキル名、空白一つ、十進の番号、空白一つ、手順パスを連結した一つの文字列である。子プロセスの作業ディレクトリは `cwd` である。標準出力は、終了コード 0 のとき読まない。手順の本文はファイルから取る。

手順ファイルは、`os.tmpdir()` の下に `mkdtemp` で作ったディレクトリの `procedure.txt` である。作業ツリーの中には作らない。`createProcedureFile` の既定実装がこれを作り、`remove` はそのディレクトリを消す。

## スキル

`skills/sdd-cur-implement/SKILL.md` の先頭は、次のフロントマターと一致する。

```yaml
---
name: sdd-cur-implement
description: クローンの作業ツリーで、指定された課題の要件と設計を実装し、受け入れ手順の本文を指定パスへ書く。課題ランナーが agent から起動する。
disable-model-invocation: true
---
```

本文の最初の見出しは `# sdd-cur-implement` である。そのあとに `## 実装` と `## 禁止` を、この順で置く。

実装では、プロンプトのスキル名のあとにある課題番号と絶対パスを使う。`docs/specs/<番号>/requirements.md` と `docs/specs/<番号>/design.md` を読み、その設計の受け入れ条件、決定、範囲の中だけを作業ツリーへ実装する。受け入れ手順の本文は、渡された絶対パスへ書く。印の行は書かない。

禁止には、課題を作らない、課題を閉じない、ラベルを変えない、コミットしない、push しない、マージリクエストを作らない、スカッシュマージしない、コメントを投稿しない、`gh` を直接起動しない、を書く。

`install` は直下のディレクトリをコピーする既存の動作のままである。このスキル用のスクリプトは置かない。

## テスト

`bun:test` の `describe` と `test` を使う。`gh`、`git`、`agent` は起動しない。`defaultGhRunner`、`defaultGitRunner`、`defaultAgentRunner` は呼ばない。ホームディレクトリと、実行中の Cursor のスキルは触らない。

`src/github.test.ts` に足す。

- `getDefaultBranch` は `repo view --json defaultBranchRef` を一回だけ呼ぶ。`--repo` は無い。`defaultBranchRef.name` が `main` のとき `main` を返す。`name` が無いときは `gh の応答を解釈できません` で拒否する。

`src/git.test.ts` に置く。

- `remoteName` は、出力が `origin` 一行のとき `origin` を返す。空、および二行のときは `リモートを特定できません` で拒否する。
- `fetch` と `checkoutFetched` と `push` の引数が、上の表と一致する。`push` に `--force` は無い。
- `hasChanges` は、空の標準出力のとき `false`、一行あるとき `true` である。
- `commitAll` は `add -A` のあと `commit -m` を呼ぶ。`add` が拒否したとき `commit` は呼ばない。

`src/agent.test.ts` に置く。

- 不正な番号と、空白を含む手順パスは `run` を呼ばない。
- 成功時の引数は、上の八要素と一致し、`cwd` は渡した作業ディレクトリである。`--api-key` は無い。

`src/runner.test.ts` に置く。

- `selectImplementationIssue` は引数を変えない。「実装中」を持つ課題を除く。「実装依頼」が無い課題を除く。「実装依頼」と「実装中」の両方がある課題を除く。番号 `10` と `2` のときは `2` を返す。
- `acceptanceComment` は、空の payload を `受け入れ手順が空です` で拒否する。最初の非空行が三つの印のいずれかのときは `受け入れ手順に印を含めない` で拒否する。成功時の先頭行は印であり、payload の空白は残る。
- `poll` は `listIssues({ labels: ["実装依頼"], limit: 100 })` を呼ぶ。`state` は渡さない。候補が無いときは `null` である。`listIssues` が一度拒否し、二度目に候補を返すとき、その候補を返す。呼び出しは二回である。二度とも拒否したときは、その理由で拒否する。
- `process` は、着手時のラベルが違う課題では `editLabels` を呼ばない。
- 通過した `process` は、着手の `editLabels`、`createBranch`、`fetch`、`implement`、`commitAll`、`push`、`createPullRequest`、`addComment`、完了の `editLabels` の順で呼ぶ。`createPullRequest` の `body` は課題の `url` であり、`Fixes` と `Closes` を含まない。`addComment` の本文は `acceptanceComment` の戻り値である。完了の `editLabels` より前に `addComment` がある。
- `implement` が一度で成功したときは、手順ファイルを読み、`acceptanceComment` に通したあと消す。`addComment` の本文はその戻り値である。
- `implement` が一度拒否したときは、手順ファイルを残し、同じパスでもう一度呼ぶ。二度目が成功したときは、その先へ進む。二度目も拒否したときは、手順ファイルを消したあと、`commitAll`、`createPullRequest`、`addComment`、完了の `editLabels` を呼ばない。
- 変更が無いときは `実装の変更がありません` であり、`createPullRequest` と `addComment` を呼ばない。
- `process` は、`createBranch` が一度拒否し、二度目に成功したとき、その先へ進む。`createBranch` は二回である。
- `addComment` が成功したあと、完了の `editLabels` が二度拒否したときは、`addComment` は一回のままである。
- 共有した課題の組で、一方が着手の `editLabels` を終えたあと、もう一方の `poll` はその課題を返さず、別の「実装依頼」を返す。

スキルと配置の確認も `src/runner.test.ts` で行う。一時ディレクトリを使う。

- `skills/sdd-cur-implement/SKILL.md` の先頭が、上のフロントマターと一致する。本文に、二つの見出し、`docs/specs`、`課題を作らない`、`課題を閉じない`、`ラベルを変えない`、`コミットしない`、`push しない`、`マージリクエストを作らない`、`スカッシュマージしない`、`コメントを投稿しない`、`gh を直接起動しない` が含まれる。
- `bun src/cli.ts install <temp>` の終了コードは 0 であり、`<temp>/.cursor/skills/sdd-cur-implement/SKILL.md` はパッケージのそのファイルと一致する。

`src/cli.test.ts` の、`run` を子プロセスで起動して SIGTERM を送る試験は、一時ディレクトリを作業ディレクトリにし、`PATH` を `bun` のあるディレクトリだけにする。標準エラーは `gh を実行できません` の一行、終了コードは 1 であり、1 分は待たない。SIGINT と SIGTERM でループが終了コード 0 になることは、既存の `src/run.test.ts` が注入で確かめる。

## 作業の一覧

1. `getDefaultBranch` を `src/github.ts` に足し、引数と応答の試験を通す。
2. `src/git.ts` と `src/agent.ts` を置き、注入した実行係で引数の試験を通す。
3. `selectImplementationIssue`、`acceptanceComment`、`createRunner` を `src/runner.ts` に置き、順序と二つの探索の試験を通す。
4. `src/cli.ts` の `run` を `createRunner` へつなぎ、子プロセスが `gh` を起動せずに終了することを確かめる。
5. `skills/sdd-cur-implement/SKILL.md` を書き、フロントマターと禁止の文言、一時ディレクトリへの `install` を確かめる。
6. README の、`run` の既定の `poll` は仕事を返さない、という文を、`run` は「実装依頼」を探して「実装完了」まで行う、に変える。`install` がコピーするスキルに `skills/sdd-cur-implement` を足す。ディレクトリに `src/git.ts`、`src/agent.ts`、`skills/sdd-cur-implement/` を足す。実装済みの設計に、この設計へのリンクを足す。AGENTS.md の構成に、同じ三つの場所と、`run` がこのランナーを使うことを足す。
