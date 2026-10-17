# 2 GitHub 接続（Issue とバージョン管理）

対象は [Issue #2](https://github.com/paterapatera/sdd-cur/issues/2)。計画の「作る順序」1 のうち、課題の取得、コメント、ラベル、ブランチ、マージリクエスト、スカッシュマージを、パッケージ内の共有モジュールにする。

## 受け入れ条件

- `src/github.ts` の `createGitHub` を import すれば、上記の操作を呼べる。
- `bun test` は `gh` を起動しない。注入した実行係が、各操作の引数と標準入力を記録し、成功と失敗を確かめる。

## 範囲外

次は作らない。

- 業務フロー用ラベルの作成（#3）。無いラベルを付けたときの失敗は、`gh` の終了をそのまま返す
- コメント種別の判定と、未反映の回答の取り込み（#4、#5）
- SDD スキルの本文と、新しい CLI サブコマンド（#5、#7）
- `poll` と `process` への接続、ローカルの checkout、commit、push（#6）
- すでにマージ済みのマージリクエストを再マージしない判断と、「マージ済み」ラベル（#7）。`squashMerge` は毎回マージを試みる
- 課題の作成とクローズ。`Fixes` や `Closes` を本文へ足さない。呼び出し側が本文に書いたときは、GitHub の仕様に従う
- フォーク、レビュー依頼、ドラフト、ブランチの削除
- Forgejo、Jira、Backlog
- 依存パッケージ、トークンファイル、環境変数の読み取り

## 決定

| 項目 | 内容 |
|---|---|
| 実行 | `gh` を子プロセスで起動する。認証は `gh` のログインに任せる。モジュールはトークンも環境変数も参照しない。`defaultGhRunner` は、今のプロセスの環境を子プロセスへそのまま渡す |
| 置き場所 | `src/github.ts`。`src/cli.ts` と `src/runner.ts` は変えない |
| リポジトリ | `owner/repo`。`owner` と `repo` はどちらも空にしない。ホスト名は付けない。`issue` と `pr` の操作は `--repo` を渡す。`api` はパスにリポジトリを含める。これらの操作は、ローカルの作業ツリーが無くても呼べる。`resolveRepo` だけは、作業ツリーの `cwd` で `repo view` を呼ぶ |
| 対話 | 標準入力を渡す操作は、その文字列をパイプへ書き、書き終えたら閉じる。渡さない操作は `stdin` を付けない。`defaultGhRunner` は、`stdin` が無いとき空のパイプを閉じて子へ渡す。標準出力と標準エラーは集め、端末へは流さない |
| 失敗 | 終了コードが 0 以外のときは拒否する。理由は標準エラーの先頭の非空行、それが無ければ標準出力の先頭の非空行、それも無ければ `gh が失敗しました`。再試行はしない |
| 起動不能 | `gh` を起動できないときは `gh を実行できません` で拒否する |
| 応答 | JSON を期待する操作で解釈できないときは `gh の応答を解釈できません` で拒否する |
| 課題を閉じない | `issue close` と `--state` は付けない。ラベル変更は `issue edit` の `--add-label` と `--remove-label` だけである |
| ブランチ | リモートの参照を API で作る。ローカルブランチは作らない。同名があるときは更新せず拒否する |
| マージ | `pr merge <番号> --repo <repo> --squash` だけを付ける。`--delete-branch`、`--merge`、`--rebase`、`--admin`、`--auto` は付けない |
| `squashMerge` の成功 | `pr merge` が終了コード 0 で戻ったあと、`getPullRequest` と同じ取得を行う。`merged` が true のときだけ成功とする。false のときは `マージリクエストはマージされていません` で拒否する。取得が拒否されたときは、その理由で拒否する。`pr merge` が 0 以外のときは、取得を呼ばない |

呼び出しは次の形である。

```ts
import { createGitHub, defaultGhRunner, resolveRepo } from "./github.ts"

const repo = await resolveRepo(defaultGhRunner, cwd)
const github = createGitHub({ gh: defaultGhRunner, repo, cwd })
```

`cwd` を省いたときは、子プロセスの作業ディレクトリはプロセスのカレントディレクトリである。`cwd` があるときは、そのパスを子プロセスへ渡す。

## 型

```ts
export type GhResult = {
  stdout: string
  stderr: string
  exitCode: number
}

export type GhRunOptions = {
  cwd?: string
  stdin?: string
}

export type GhRunner = {
  run: (args: string[], options: GhRunOptions) => Promise<GhResult>
}

export type Issue = {
  number: number
  title: string
  body: string
  state: "open" | "closed"
  labels: string[]
  url: string
}

export type IssueComment = {
  id: string
  body: string
  author: string
  createdAt: string
}

export type PullRequest = {
  number: number
  url: string
  state: "open" | "closed" | "merged"
  merged: boolean
}

export type GitHubClient = {
  listIssues(query?: {
    state?: "open" | "closed" | "all"
    labels?: string[]
    limit?: number
  }): Promise<Issue[]>
  getIssue(number: number): Promise<Issue>
  listComments(number: number): Promise<IssueComment[]>
  addComment(number: number, body: string): Promise<{ url: string }>
  editLabels(
    number: number,
    change: { add?: string[]; remove?: string[] },
  ): Promise<void>
  createBranch(name: string, from: string): Promise<void>
  createPullRequest(input: {
    base: string
    head: string
    title: string
    body: string
  }): Promise<{ number: number; url: string }>
  getPullRequest(number: number): Promise<PullRequest>
  squashMerge(number: number): Promise<void>
}
```

`defaultGhRunner` は `Bun.spawn` で `gh` を起動する。`args` に実行ファイル名は含めない。標準出力と標準エラーを集め、終了コードを返す。環境は今のプロセスのものを子へ渡す。

## 検証

`gh` を呼ぶ前に拒否する。理由は次の一文である。不正な `repo` は `createGitHub` がその場で拒否し、`run` は呼ばない。

| 条件 | 理由 |
|---|---|
| `repo` が `owner/repo` でない。`owner` と `repo` の一方が空、空白を含む、スラッシュが一つでない | `リポジトリの指定が不正です` |
| 課題番号またはマージリクエスト番号が 1 以上の整数でない | `番号が不正です` |
| ラベル名が空、前後に空白、カンマを含む | `ラベル名が不正です` |
| `editLabels` の `add` と `remove` がどちらも空、または省略 | `変更するラベルがありません` |
| コメント本文が、前後の空白を除いて空 | `コメント本文が空です` |
| ブランチ名が規則に合わない | `ブランチ名が不正です` |
| タイトルが、前後の空白を除いて空、または改行を含む | `タイトルが不正です` |
| `state` が `open`、`closed`、`all` のどれでもない | `課題の状態が不正です` |
| `limit` が 1 以上 1000 以下の整数でない | `取得件数の指定が不正です` |

ブランチ名は、先頭が英数字で、以降が英数字、`.`、`_`、`-`、`/` だけである。`..`、`//`、末尾の `/` は含めない。`from`、`base`、`head` も同じ規則である。`head` に `owner:branch` は使わない。

コメント本文とマージリクエスト本文は、空の判定にだけ trim を使い、渡す文字列そのものは変えない。タイトルも同様に、渡す文字列は変えない。

## 操作

`issue` と `pr` の操作は共通して `--repo <repo>` を付ける。`api` は `--repo` を付けない。`listIssues` の `state` 省略時は `open`、`limit` 省略時は `100` である。`labels` が空または省略のときは `--label` を付けない。`--label` は `--repo` の直後かつ `--state` の前に繰り返す。複数の `--label` は `gh` の既定どおり、すべてを持つ課題に絞る。並び順は `gh` の既定のままである。返る件数は `limit` 以下で、続きがあることは返さない。

| 操作 | 引数 | 標準入力 |
|---|---|---|
| `listIssues` | `issue list --repo <repo>` に、ラベルごとの `--label <名前>`、続けて `--state <state> --limit <n> --json number,title,body,state,labels,url` | 渡さない |
| `getIssue` | `issue view <番号> --repo <repo> --json number,title,body,state,labels,url` | 渡さない |
| `listComments` | `issue view <番号> --repo <repo> --json comments` | 渡さない |
| `addComment` | `issue comment <番号> --repo <repo> --body-file -` | 本文 |
| `editLabels` | `issue edit <番号> --repo <repo>` に、追加があれば `--add-label <カンマ結合>`、削除があれば `--remove-label <カンマ結合>` | 渡さない |
| `createBranch` | 下記の二回 | 渡さない |
| `createPullRequest` | `api --method POST repos/<owner>/<repo>/pulls --input -` | `title`、`head`、`base`、`body` だけをこの順で持つ JSON。本文が空のときは `body` を空文字 |
| `getPullRequest` | `pr view <番号> --repo <repo> --json number,url,state,mergedAt` | 渡さない |
| `squashMerge` | 下記の二段 | 渡さない |
| `resolveRepo` | `repo view --json nameWithOwner`。`--repo` は付けない | 渡さない |

`createBranch` は次の順で二回呼ぶ。

1. `api repos/<owner>/<repo>/git/ref/heads/<from>`。`<from>` に含まれる `/` は `%2F` にする。`feature/foo` は `heads/feature%2Ffoo` になる。応答の `object.sha` が空でない文字列であることを確かめる。
2. `api --method POST repos/<owner>/<repo>/git/refs -f ref=refs/heads/<name> -f sha=<sha>`。`ref` の値では `/` を `%2F` にしない。

1 が成功し 2 が拒否されたとき、参照は更新しない。2 の失敗理由は、その呼び出しの失敗規則に従う。

`squashMerge` は次の順で行う。

1. `pr merge <番号> --repo <repo> --squash`。
2. 1 が終了コード 0 のとき、`getPullRequest` と同じ引数で取得する。`merged` が true のときだけ成功とする。false のときは `マージリクエストはマージされていません` で拒否する。取得が拒否されたときは、その理由で拒否する。1 が 0 以外のときは 2 を呼ばない。

## 応答の正規化

課題の `state` は `OPEN` を `open`、`CLOSED` を `closed` にする。ラベルは各要素の `name` だけを、並びを保って文字列の配列にする。`body` が JSON の `null` のときは空文字にする。この形に足りないときは `gh の応答を解釈できません` で拒否する。

コメントは `id`、`body`、`author.login`、`createdAt` を取る。`body` が JSON の `null` のときは空文字にする。`author` が無いときは `author` を空文字にする。`id` と `createdAt` は文字列のまま返す。コメントが無いときは空配列である。

`addComment` は、標準出力の先頭の非空行を URL として返す。その行が `https://` で始まらないときは拒否する。

`createPullRequest` は、応答の `number` と `html_url` を返す。`number` が 1 以上の整数でないとき、または `html_url` が `https://` で始まらないときは拒否する。

`getPullRequest` は `mergedAt` が空でないとき `merged` を true にする。`state` は `OPEN` を `open`、`CLOSED` を `closed`、`MERGED` を `merged` にする。`CLOSED` かつ `mergedAt` があるときは `state` を `merged` にする。

`resolveRepo` は JSON の `nameWithOwner` を返す。値が `owner/repo` の形でないときは拒否する。

## テスト

`bun test` で、`createGitHub` に記録用の `GhRunner` を渡す。

- リポジトリ、番号、ラベル、空のコメント、ブランチ名、タイトル、`state`、`limit` の不正値は、`run` を呼ばずに拒否する。不正な `repo` は `createGitHub` が拒否する。
- `listIssues` は省略時に `--state open --limit 100` と `--json number,title,body,state,labels,url` を付ける。`--label` は `--repo` の直後かつ `--state` の前に繰り返す。応答のラベル名と `open` / `closed` に正規化する。
- `getIssue` と `listComments` は、上の表の引数で呼び、コメントの `author` が無いとき空文字にする。コメントの `body` が `null` のとき空文字にする。
- `addComment` は本文を標準入力に渡し、`https://` で始まる先頭行を返す。
- `editLabels` は追加と削除を一回の `issue edit` にまとめる。引数に `close` と `--state` は無い。
- `createBranch` は SHA の取得のあと、`refs/heads/<name>` を POST する。取得のパスでは `/` を `%2F` にし、POST の `ref` ではそのまま渡す。POST が拒否されたとき、その理由で拒否する。
- `createPullRequest` は上記の `api` を一回だけ呼ぶ。標準入力の JSON は `title`、`head`、`base`、`body` をこの順で持つ。応答の `number` と `html_url` を返す。本文が空でも `body` は空文字である。
- `squashMerge` は、まず `pr merge`、番号、`--repo`、リポジトリ、`--squash` だけを呼ぶ。終了コードが 0 のときだけ `getPullRequest` と同じ引数で取得する。`merged` が false のときは `マージリクエストはマージされていません` で拒否する。`pr merge` が 0 以外のときは取得を呼ばない。
- `getPullRequest` は `mergedAt` がある `CLOSED` を `merged: true` かつ `state: "merged"` にする。
- 終了コードが 0 以外で標準エラーがあるときは、その先頭行で拒否する。標準エラーが空のときは標準出力の先頭行、どちらも空のときは `gh が失敗しました`。
- JSON でない応答、`https://` でないコメント URL、`createPullRequest` の不正な `number` または `html_url` は拒否する。
- 標準入力を渡さない操作では、記録用の `GhRunner` に `stdin` が付かない。
- `resolveRepo` は `repo view --json nameWithOwner` を、渡した `cwd` で呼ぶ。

## 実装の順序

1. `GhRunner`、`createGitHub`、検証を置き、不正値が `gh` を呼ばずに拒否されることを確かめる。
2. `listIssues`、`getIssue`、`listComments` と応答の正規化を作り、関数テストを通す。
3. `addComment` と `editLabels` を作り、課題を閉じる引数が無いことを確かめる。
4. `createBranch` の二回呼び出しを作り、作成の失敗が理由付きで返ることを確かめる。
5. `createPullRequest`、`getPullRequest`、`squashMerge` を作り、スカッシュマージの引数が表と一致することを確かめる。
6. `resolveRepo` と `defaultGhRunner` を置く。`defaultGhRunner` は `bun test` から起動しない。
