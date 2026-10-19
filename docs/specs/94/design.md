# 94 作業ブランチの push と「実装依頼」の付与を一つのコマンドで行う

対象は [Issue #94](https://github.com/paterapatera/sdd-cur/issues/94)。人が作業ツリーで一つのサブコマンドを実行すると、課題番号の作業ブランチを push し、その push が成功したあと、その課題に「実装依頼」を付ける。

#27 は、人は要求と設計を含む作業ブランチを push してから「実装依頼」を付ける、と定める。このコマンドは、その順を人が一度の実行で行う。#6 は、課題ランナーが「実装依頼」の課題を、push 済みの作業ブランチの上で実装する。この設計は、その探索と `fetch` と `checkoutFetched` を変えない。

## 受け入れ条件

- 1. サブコマンド名は `request` である。
- 2. 使い方は `bun src/cli.ts request <番号>` である。`<番号>` は課題番号であり、引数で渡す。
- 3. 人が、作業ツリーで `bun src/cli.ts request <番号>` を実行すると、その課題番号の作業ブランチを push し、その push が成功したあと、その課題に「実装依頼」を付ける。
- 4. push する作業ブランチの名前は `task-<番号>` である。`<番号>` は課題番号であり、十進で、先頭の零は付けない。
- 5. 「実装依頼」の名前は、`workflowLabels` の `name` である。別の字面で再定義しない。
- 6. 今のブランチが `task-<番号>` でないときは、何も変えずに日本語の一行で失敗する。`<番号>` は引数の課題番号である。
- 7. 作業ツリーに未コミットの変更があるときは、何も変えずに日本語の一行で失敗する。未コミットの変更があるとは、既存の `hasChanges` が真のときである。`git status --porcelain` の出力が空でないとき真であり、追跡していないファイルがあるときも真である。
- 8. 課題の `state` が `open` でないときは、何も変えずに日本語の一行で失敗する。
- 9. 課題に業務ラベルが一つでもあるときは、何も変えずに日本語の一行で失敗する。
- 10. 業務ラベルは `workflowLabels` の `name` である。「quick 対象」は業務ラベルではない。
- 11. 要件の状態が `ready` でないときは、何も変えずに日本語の一行で失敗する。
- 12. 設計の状態が `ready` でないときは、何も変えずに日本語の一行で失敗する。
- 13. この `ready` は、既存の `specStatus` の `ready` である。
- 14. push に失敗したときは、「実装依頼」を付けない。
- 15. SDD スキルは、このコマンドを呼ばない。
- 16. 課題ランナーは、このコマンドを呼ばない。
- 17. 「実装依頼」を付けるのは人である。
- 18. README は、人が `bun src/cli.ts request <番号>` で作業ブランチを push してから「実装依頼」を付ける、と書く。
- 19. `request` を `src/cli.ts` に足したとき、`docs/policy.md` の構成の表は `request` を含む。
- 20. `request` を `src/cli.ts` に足したとき、`AGENTS.md` の「コマンド」の例の行は `bun src/cli.ts request <番号>` である。
- 21. `request` を `src/cli.ts` に足したとき、README の「開発中の起動」の例の行は `bun src/cli.ts request <番号>` である。
- 22. `request` を `src/cli.ts` に足したとき、README のコマンドの表は `request` を含む。

## 範囲外

次は作らない。

- コミットを作ること
- 担当者を付けること
- 課題番号を、今のブランチ名から取ること
- 未追跡ファイルを、未コミットの変更から外すこと
- `printUsage` の行を変えること。`request` の行も `restore` の行も足さない
- SDD スキル、または課題ランナーが、このコマンドを呼ぶこと
- `skills/`、`agents/`、`src/runner.ts` の変更
- 課題コメントを書くこと。課題を閉じること。マージリクエストを作ること
- `validate` の形式検査を、このコマンドの `ready` の判定に使うこと
- push を取り消すこと。`--force`、rebase、`fetch`、`merge`
- `export type GitClient` にメソッドを足すこと
- `package.json` の script を足すこと
- `docs/conventions.md`、`src/conventions.ts` の変更
- この課題以外の `design.md` と `requirements.md` の書き換え
- 依存パッケージ。トークンと環境変数の読み取り
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| サブコマンド名 | `request` |
| 使い方 | `bun src/cli.ts request <番号>`。`<番号>` は課題番号であり、引数で渡す |
| 番号の出所 | 引数だけである。今のブランチ名から課題番号は取らない |
| ブランチ名 | `implementationBranch` の戻り値だけが作る。呼び出し側は `task-` を連結しない |
| ブランチの一致 | 今のブランチが、その戻り値と一致しないときは、何も変えずに `作業ブランチではありません` で失敗する |
| 未コミット | 既存の `hasChanges` が真のときである。未追跡ファイルを、この真から外すことは採用しない。失敗の message は `未コミットの変更があります` |
| 閉じた課題 | `state` が `open` でないときの message は `課題は閉じています` である。字面は `src/sdd.ts` の `CLOSED_ISSUE` と一文字も違わない |
| 業務ラベルの失敗 | 一つでもあるときの message は `実装のラベルが付いています` である。字面は `src/sdd.ts` の `WORKFLOW_LABEL` と一文字も違わない |
| 要件の失敗 | `missing` は `要件がありません`。`invalid` は `要件の見出しが不正です`。`assertSpecsReadyForImplement` と同じである。一つの字面にはまとめない |
| 設計の失敗 | `missing` は `設計がありません`。`invalid` は `設計の見出しが不正です`。`assertSpecsReadyForImplement` と同じである。一つの字面にはまとめない |
| ラベル名 | `workflowLabels` の先頭の `name` である。いまの値は「実装依頼」である。別の字面で再定義しない。並びは変えない |
| 付ける人 | 「実装依頼」を付けるのは人である。このコマンドを実行するのも人である |
| 確認の順 | 今のブランチ、未コミットの変更、課題の `state`、業務ラベル、要件の `specStatus`、設計の `specStatus`、リモート名、push、ラベル付与。先が失敗したとき、後は呼ばない |
| push | 既存の `GitClient.push`。`git push -u <remote> <branch>`。`<branch>` は作業ブランチ名。`--force` は付けない |
| ラベル付与 | push が成功したあと、一回の `editLabels` で `add` だけを渡す。`remove` は渡さない |
| push の失敗 | 「実装依頼」を付けない。`editLabels` は呼ばない |
| 何も変えない | `push` を呼ばない。`editLabels` を呼ばない。`commitAll` を呼ばない。ファイルを書かない。課題コメントを書かない。課題を閉じない |
| `ready` | 既存の `specStatus` の `ready` である。`validate` は呼ばない |
| 今のブランチ | `createGit` の戻り値が `currentBranch` を持つ。`git rev-parse --abbrev-ref HEAD` である。`export type GitClient` には足さない |
| 使い方の表示 | `printUsage` は変えない。行は、今の `install` から `complete` までの十一行のままである |
| 成功時 | 終了コードは 0。標準出力は空である |
| 失敗時 | 終了コードは 1。理由は標準エラーの、改行を含まない一行である。引数が一つでないときだけ、今の `printUsage` を書く |

失敗の `Error` の `message` は、上の六条件の字面である。定数を公開するために `src/sdd.ts` と `src/runner.ts` は変えない。

## コマンド

`src/request.ts` に置く。`request.ts` は `implementationBranch` を `src/runner.ts` から import する。`src/runner.ts` は `request.ts` を import しない。

```ts
export async function requestImplementation(
  deps: {
    git: {
      currentBranch(): Promise<string>
      hasChanges(): Promise<boolean>
      remoteName(): Promise<string>
      push(remote: string, branch: string): Promise<void>
    }
    openGitHub(): Promise<{
      getIssue: GitHubClient["getIssue"]
      editLabels: GitHubClient["editLabels"]
    }>
    readSpecs(issueNumber: number): Promise<{
      requirements: { exists: boolean; markdown: string }
      design: { exists: boolean; markdown: string }
    }>
  },
  issueNumber: number,
): Promise<void>
```

`requestImplementation` は、番号が 1 以上の安全な整数でなければ `番号が不正です` で拒否する。このときは `git` も `openGitHub` も `readSpecs` も呼ばない。

番号が通ったときは、作業ブランチ名を `implementationBranch(issueNumber)` で得る。接頭辞は連結しない。そのあと、次の順で行う。拒否した時点より後は呼ばない。

1. `currentBranch`。戻り値が作業ブランチ名と一致しないときは、`作業ブランチではありません` で拒否する。`hasChanges`、`openGitHub`、`readSpecs`、`remoteName`、`push`、`editLabels` は呼ばない。
2. `hasChanges`。真のときは、`未コミットの変更があります` で拒否する。`openGitHub` 以降は呼ばない。偽のときだけ先へ進む。真偽の判定は、既存の `hasChanges` に任せる。未追跡ファイルだけを除く判定は足さない。
3. `openGitHub`。返った `getIssue` を一回呼ぶ。`state` が `open` でないときは、`課題は閉じています` で拒否する。`readSpecs`、`remoteName`、`push`、`editLabels` は呼ばない。
4. その `getIssue` の `labels` に、`workflowLabels` の `name` が一つでもあるときは、`実装のラベルが付いています` で拒否する。`getIssue` はやり直さない。「quick 対象」だけでは拒否しない。`readSpecs` 以降は呼ばない。
5. `readSpecs`。要件を `specStatus(exists, markdown, issueNumber)` に渡す。`missing` のときは `要件がありません`、`invalid` のときは `要件の見出しが不正です` で拒否する。設計の `specStatus` は見ない。`remoteName`、`push`、`editLabels` は呼ばない。
6. 設計を、同じ `specStatus` に渡す。`missing` のときは `設計がありません`、`invalid` のときは `設計の見出しが不正です` で拒否する。`remoteName`、`push`、`editLabels` は呼ばない。
7. `remoteName`。拒否したときは、その理由のまま拒否する。`push` と `editLabels` は呼ばない。
8. `push`。第一引数は `remoteName` の戻り値、第二引数は作業ブランチ名である。拒否したときは、その理由のまま拒否する。`editLabels` は呼ばない。
9. `editLabels`。`add` は、`workflowLabels` の先頭の `name` を一つだけ要素に持つ配列である。`remove` は渡さない。

`readSpecs` が拒否したときは、その理由のまま拒否する。`push` と `editLabels` は呼ばない。`editLabels` が拒否したときは、その理由のまま拒否する。push の取り消しはしない。

`src/cli.ts` の `switch` に、`case "request"` を `case "restore"` の次、`default` の前に置く。

引数が一つでないときは、`printUsage` を書いて終了コード 1 である。`git` も `gh` も呼ばない。番号は `parseIssueNumberString` で、`createGit` より前に読む。不正な番号は、そのメッセージを標準エラーへ書き、終了コード 1 である。使い方は書かない。

番号が通ったときは、`createGit` を作業ツリーの `cwd` で作る。`openGitHub` は、その時点では呼ばない。関数が `openGitHub` を呼んだときだけ、`resolveRepo` と `createGitHub` を、`complete` と同じくその `cwd` で行う。`readSpecs` は `readSpecPair` である。`requestImplementation` を一回呼ぶ。成功時の終了コードは 0 である。標準出力は空である。拒否したときは、`Error` の `message` を標準エラーへ書き、終了コード 1 である。

`createRunner`、`runLoop`、`agent` は呼ばない。課題コメントは書かない。課題は閉じない。`commitAll` は呼ばない。

## git

`createGit` の戻り値に、次を足す。既存のメソッドの引数と意味は変えない。`push` は `push -u <remote> <branch>` のままである。

```ts
currentBranch(): Promise<string>
```

実行する引数は `rev-parse`、`--abbrev-ref`、`HEAD` の三つである。終了コードが 0 でないときは、既存の `failReason` で拒否する。標準出力の最初の非空行を、`headCommit` と同じ取り方で trim して返す。非空行が無いときは `git が失敗しました` で拒否する。

`export type GitClient` のメソッド一覧には、`currentBranch` を足さない。`createGit` の戻り値の型は、`GitClient` にこのメソッドを足したものである。`git: GitClient` を満たす既存のオブジェクトは、このメソッドを持たなくてよい。

detached HEAD のとき、`rev-parse --abbrev-ref HEAD` の戻り値は `HEAD` である。これは作業ブランチ名と一致しないので、`作業ブランチではありません` で拒否する。別の失敗にはしない。

## ドキュメント

`docs/policy.md` の構成の表で、1 列目が `` `src/cli.ts` `` の行の役割の末尾に、`、`request`` を足す。足す前のサブコマンドの並びは変えない。足したあとの役割は、次である。

```
入口。サブコマンドは `install`、`run`、`labels`、`candidates`、`show`、`branch`、`confirm`、`close`、`reflect`、`validate`、`complete`、`restore`、`request`
```

`AGENTS.md` の「コマンド」のコードフェンスで、`bun src/cli.ts restore <番号>` の次の行に、次の一行を足す。`bun test` の行は、その次のままである。ほかの行は変えない。

```
bun src/cli.ts request <番号>
```

README の「開発中の起動」のコードフェンスも、同じ位置に同じ一行を足す。`bun test` の行は残す。ほかの行は変えない。

README の、そのコードフェンスのあとのコマンドの表に、`` `restore` `` の行の次へ、次の行を足す。`` `bun test` `` の行は残す。ほかの行は変えない。

```
| `request` | 作業ブランチを push し、成功したあと課題に「実装依頼」を付ける |
```

README の「役割」にある、次の一文を置き換える。次の文「クローンはその push を含むリモートから作業する。」は残す。

置き換え前:

```
人が Project A で書いた `docs/specs` をリモートへ push してから、課題に「実装依頼」を付ける。
```

置き換え後:

```
人は Project A で、`bun src/cli.ts request <番号>` で作業ブランチを push してから「実装依頼」を付ける。
```

ラベルの表で、「実装依頼」を付ける主体は「人」のままである。この行は変えない。

`skills/sdd-cur/SKILL.md` は変えない。課題ランナーのファイルは変えない。`printUsage` は変えない。

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。`GitRunner` と、注入した `openGitHub`、`readSpecs`、`getIssue`、`editLabels` の呼び出しを記録する。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。

新しく足す `test` は `src/94.test.ts` だけである。既存の `src/*.test.ts` に、新しい `test` は足さない。

`createGit` の `currentBranch` は、引数が `rev-parse`、`--abbrev-ref`、`HEAD` である。標準出力の最初の非空行を trim して返す。非空行が無いときは `git が失敗しました` である。終了コードが 0 でないときは、標準エラーの最初の非空行で拒否する。

`createGit` の `hasChanges` は、`git status --porcelain` の標準出力が `?? a\n` のとき真である。

`requestImplementation` は、注入した依存の呼び出し順と、拒否した `Error` の `message` で確かめる。

- 番号が 0 のときは `番号が不正です` であり、`currentBranch` は呼ばない。[2]
- 今のブランチが作業ブランチ名と違うときは、`作業ブランチではありません` であり、`hasChanges`、`openGitHub`、`readSpecs`、`push`、`editLabels` は呼ばない。[4][6]
- `hasChanges` が真のときは、`未コミットの変更があります` であり、`openGitHub`、`readSpecs`、`push`、`editLabels` は呼ばない。[7]
- `state` が `closed` のときは、`課題は閉じています` であり、`readSpecs`、`push`、`editLabels` は呼ばない。[8]
- ラベルに「実装中」があるとき、および「実装依頼」があるときは、`実装のラベルが付いています` であり、`readSpecs`、`push`、`editLabels` は呼ばない。[5][9][10]
- ラベルが「quick 対象」だけのときは、そのことだけでは拒否しない。[10]
- 要件の `specStatus` が `missing` のときは、`要件がありません` である。`invalid` のときは、`要件の見出しが不正です` である。どちらも設計の `specStatus` は見ず、`push` と `editLabels` は呼ばない。[11][13]
- 要件が `ready` であり、設計が `missing` のときは、`設計がありません` である。設計が `invalid` のときは、`設計の見出しが不正です` である。どちらも `push` と `editLabels` は呼ばない。[12][13]
- `remoteName` が拒否したときは、`push` と `editLabels` は呼ばない。[14]
- `push` が拒否したときは、`editLabels` は呼ばない。[14]
- すべての確認が通り、`push` が成功したときは、`push` の引数はリモート名と `task-<番号>` であり、`editLabels` の `add` は `workflowLabels` の先頭の `name` 一つであり、`remove` は無い。[3][4][5]
- `editLabels` が拒否したとき、`push` は一回のままである。取り消す呼び出しは無い。[14]

`src/94.test.ts` から `bun src/cli.ts` を起動して確かめる。

- 引数が無いとき、および引数が二つのときは、終了コード 1 であり、標準エラーは今の `printUsage` の十一行である。[2]
- 引数が `foo` のときは、終了コード 1 であり、標準エラーは `番号が不正です` の一行である。使い方は書かない。[2]

ファイルを読んで確かめる。

- `docs/policy.md` の `src/cli.ts` の行に、`` `request` `` がある。[19]
- `AGENTS.md` の「コマンド」のコードフェンスに、`bun src/cli.ts request <番号>` の行がある。[20]
- README の「開発中の起動」のコードフェンスに、同じ行がある。[21]
- README のコマンドの表に、`` `request` `` の行がある。[22]
- README に、`bun src/cli.ts request <番号>` で作業ブランチを push してから「実装依頼」を付ける、という文がある。[17][18]
- README のラベルの表で、「実装依頼」の付ける主体は「人」のままである。[17]
- `skills/sdd-cur/SKILL.md` に `bun src/cli.ts request` は無い。[15]
- `src/runner.ts` に `requestImplementation` は無い。[16]
- `src/cli.ts` の `printUsage` に `sdd-cur request` は無い。[2]

## 一度に実装できる大きさ

一つの作業が一度に実装できる大きさであるとは、次のとおりである。

- `[<番号>]` を一つ以上持つ作業では、その番号の受け入れ条件に直結する実装を、他の受け入れ条件に直結する実装を含めず、実装作成役の一回の起動で書き終えられる
- `[<番号>]` が無い作業では、その作業の行に書かれた実装を、一回の起動で書き終えられる

目安を超えるのは、上を満たさず、作業の一覧の中でその作業を複数の作業に分ければ、分けた各作業が上を満たすときである。

課題全体が大きすぎるのは、作業の一覧の中で作業をどう分けても、分けたあとのどれかが上を満たさないときである。受け入れ条件の件数、行数、ファイル数、その他の固定の数値や式では判定しない。

この目安を見るのは、設計レビュー役である。`validate` は見ない。

## 変えるファイル

- src/git.ts
- src/request.ts
- src/cli.ts
- src/94.test.ts
- docs/policy.md
- AGENTS.md
- README.md
- docs/spec/git.md
- docs/spec/docs.md

## 作業の一覧

- 1. `createGit` の戻り値に `currentBranch` を足し、`src/request.ts` に `requestImplementation` を書く。[3][4][5][6][7][8][9][10][11][12][13][14]
- 2. `src/cli.ts` にサブコマンド `request` を足す。`printUsage` は変えない。[1][2]
- 3. `docs/policy.md`、`AGENTS.md`、README を「ドキュメント」のとおり変える。スキルと課題ランナーは変えない。[15][16][17][18][19][20][21][22]
- 4. `src/94.test.ts` を「テスト」のとおり書く。[1][2][3][4][5][6][7][8][9][10][11][12][13][14][15][16][17][18][19][20][21][22]
- 5. この設計の `## 正本への差分` を、同じ作業ツリーの `docs/spec/git.md` と `docs/spec/docs.md` へ反映する。要求ファイルと設計ファイルは変えない。[1][2][3][4][5][6][7][8][9][10][11][12][13][14][15][16][17][18][19][20][21][22]

## 関係する課題

- #6（課題ランナー）
- #27（作業ブランチへの要求と設計）

#6 の探索、`fetch`、`checkoutFetched` は残す。リモートに作業ブランチが無いときの取得失敗は、今のままである。`docs/specs/6/design.md` は書き換えない。

#27 の「人が push してから実装依頼を付ける」は残す。この課題は、その順を人が `request` で行うことを足す。`docs/specs/27/design.md` は書き換えない。

## 正本への差分

### 追加 git REQ-763

もとになった課題は #94 である。

サブコマンド名は `request` である。

### 追加 git REQ-764

もとになった課題は #94 である。

使い方は `bun src/cli.ts request <番号>` である。`<番号>` は課題番号であり、引数で渡す。課題番号を今のブランチ名から取ることは採用しない。

### 追加 git REQ-765

もとになった課題は #94 である。

人が、作業ツリーで `bun src/cli.ts request <番号>` を実行すると、その課題番号の作業ブランチを push し、その push が成功したあと、その課題に「実装依頼」を付ける。

### 追加 git REQ-766

もとになった課題は #94 である。

push する作業ブランチの名前は `implementationBranch` の戻り値である。`task-<番号>` であり、十進で、先頭の零は付けない。呼び出し側は接頭辞を連結しない。

### 追加 git REQ-767

もとになった課題は #94 である。

「実装依頼」の名前は、`workflowLabels` の `name` である。別の字面で再定義しない。

### 追加 git REQ-768

もとになった課題は #94 である。

今のブランチが作業ブランチ名と一致しないときは、何も変えずに `作業ブランチではありません` で失敗する。作業ブランチ名は、引数の課題番号に対する `implementationBranch` の戻り値である。

### 追加 git REQ-769

もとになった課題は #94 である。

作業ツリーに未コミットの変更があるときは、何も変えずに `未コミットの変更があります` で失敗する。未コミットの変更があるとは、既存の `hasChanges` が真のときである。追跡していないファイルがあるときも真である。未追跡ファイルを、未コミットの変更から外すことは採用しない。

### 追加 git REQ-770

もとになった課題は #94 である。

課題の `state` が `open` でないときは、何も変えずに `課題は閉じています` で失敗する。字面は `src/sdd.ts` の `CLOSED_ISSUE` と一文字も違わない。

### 追加 git REQ-771

もとになった課題は #94 である。

課題に業務ラベルが一つでもあるときは、何も変えずに `実装のラベルが付いています` で失敗する。字面は `src/sdd.ts` の `WORKFLOW_LABEL` と一文字も違わない。業務ラベルは `workflowLabels` の `name` である。「quick 対象」は業務ラベルではない。

### 追加 git REQ-772

もとになった課題は #94 である。

要件の状態が `ready` でないときは、何も変えずに失敗する。`missing` の message は `要件がありません` である。`invalid` の message は `要件の見出しが不正です` である。この `ready` は、既存の `specStatus` の `ready` である。`validate` の形式検査とは別である。

### 追加 git REQ-773

もとになった課題は #94 である。

設計の状態が `ready` でないときは、何も変えずに失敗する。`missing` の message は `設計がありません` である。`invalid` の message は `設計の見出しが不正です` である。この `ready` は、既存の `specStatus` の `ready` である。

### 追加 git REQ-774

もとになった課題は #94 である。

push に失敗したときは、「実装依頼」を付けない。

### 追加 git REQ-775

もとになった課題は #94 である。

確認の順は、今のブランチ、未コミットの変更、課題の `state`、業務ラベル、要件の `specStatus`、設計の `specStatus`、リモート名、push、ラベル付与である。先の確認が失敗したときは、後の確認と push とラベル付与はしない。

### 追加 git REQ-776

もとになった課題は #94 である。

SDD スキルは、このコマンドを呼ばない。

### 追加 git REQ-777

もとになった課題は #94 である。

課題ランナーは、このコマンドを呼ばない。

### 追加 git REQ-778

もとになった課題は #94 である。

「実装依頼」を付けるのは人である。このコマンドを実行するのも人である。

### 追加 docs REQ-779

もとになった課題は #94 である。

README は、人が `bun src/cli.ts request <番号>` で作業ブランチを push してから「実装依頼」を付ける、と書く。

### 追加 docs REQ-780

もとになった課題は #94 である。

`docs/policy.md` の構成の表の `src/cli.ts` の行は、サブコマンド `request` を含む。

### 追加 docs REQ-781

もとになった課題は #94 である。

`AGENTS.md` の「コマンド」の例の行は `bun src/cli.ts request <番号>` である。

### 追加 docs REQ-782

もとになった課題は #94 である。

README の「開発中の起動」の例の行は `bun src/cli.ts request <番号>` である。

### 追加 docs REQ-783

もとになった課題は #94 である。

README のコマンドの表は `request` を含む。
