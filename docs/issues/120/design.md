# 120 作業ブランチの用意を CLI のサブコマンドに移す

<!-- sdd-cur:form -->

対象は [Issue #120](https://github.com/paterapatera/sdd-cur/issues/120)。SDD スキルが要求作成役の前に行う作業ブランチの用意と、そのあとの今のブランチとの比較を、サブコマンド `prepare-branch` にする。設計作成役の前の比較は、checkout も作業ブランチの新規作成もせず、スキルに残す。

手を入れる対象は `src/cli.ts`、`src/git.ts`、`skills/sdd-cur/SKILL.md` である。作業ブランチ名を作る関数は `implementationBranch` のままである。

重なる課題は #42、#91、#96 である。

## 受け入れ条件

- 1. 条件: サブコマンドを一つ足す 主体: `src/cli.ts` 結果: 名前は `prepare-branch` である。使い方の表示に、行全体が `sdd-cur prepare-branch <番号>` である行がある。起動は `bun src/cli.ts prepare-branch <番号>` である
- 2. 条件: 引数が課題番号一つでない 主体: `prepare-branch` 結果: git は実行しない。終了コードは 1 である。標準出力には書かない。引数が一つでないときは使い方を標準エラーへ書く。課題番号として読めないときは標準エラーへ `番号が不正です` と一行書く。この扱いは `branch` と同じである
- 3. 条件: 作業ブランチ名を作る 主体: `prepare-branch` 結果: 同じ課題番号に対する `branch` の標準出力から末尾の改行を除いた文字列と一文字も違わない。作る関数は `implementationBranch` のままである。このサブコマンドは接頭辞を連結しない
- 4. 条件: `git remote` の空行を除いた名前が一つでない 主体: `prepare-branch` 結果: 標準エラーへ `リモートを特定できません` と一行書く。終了コードは 1 である。作業ブランチを作らない。デフォルトブランチを fetch しない。標準出力には書かない
- 5. 条件: ローカルに `refs/heads/<作業ブランチ>` がある 主体: `prepare-branch` 結果: `git checkout <作業ブランチ>` する。デフォルトブランチは fetch しない。作業ブランチを作り直さない。`git fetch`、`git checkout -b`、`git checkout -B`、`git ls-remote` はしない
- 6. 条件: ローカルに無く、`git ls-remote --heads <remote> <作業ブランチ>` の標準出力にそのブランチがある 主体: `prepare-branch` 結果: `git fetch <remote> <作業ブランチ>` のあと `git checkout -B <作業ブランチ> FETCH_HEAD` する。起点はデフォルトブランチではない。`git checkout -b` はしない
- 7. 条件: ローカルにもリモートにも無い 主体: `prepare-branch` 結果: そのときだけ作業ブランチを新しく作る。デフォルトブランチ名は `git ls-remote --symref <remote> HEAD` の、`ref: refs/heads/` のあと空白の前までである。取れないときは標準エラーへ `デフォルトブランチを特定できません` と一行書き、終了コードは 1 であり、作業ブランチを作らず、標準出力には書かない。取れたときは `git fetch <remote> <デフォルトブランチ>` のあと `git checkout -b <作業ブランチ> FETCH_HEAD` で作る。起点は、この fetch したリモートの最新のデフォルトブランチである。`git checkout -B` はしない
- 8. 条件: 用意の手順の途中で失敗した 主体: `prepare-branch` 結果: 残りの手順を行わない。作業ブランチをデフォルトブランチから作らない。終了コードは 1 である。標準出力には書かない
- 9. 条件: このサブコマンドが用意する 主体: `prepare-branch` 結果: マージしない。rebase しない。`git push` をしない。履歴を書き換えない
- 10. 条件: 用意のあと、今のブランチが作業ブランチ名と一文字も違わない 主体: `prepare-branch` 結果: 終了コードは 0 である。標準出力は作業ブランチ名の一行である
- 11. 条件: 用意のあと、今のブランチが作業ブランチ名と違う 主体: `prepare-branch` 結果: 終了コードは 1 である。標準エラーへ `今のブランチが作業ブランチと違います` と一行書く。標準出力へ作業ブランチ名を書かない。用意で行った checkout は戻さない
- 12. 条件: 要求作成役を起動する前の用意を書く 主体: `skills/sdd-cur/SKILL.md` 結果: `sdd-cur prepare-branch <番号>` を実行し、終了コードが 0 以外なら止まる、という数行になる。その数行は用意の番号付き git 手順を含まない。作業ブランチ名を `sdd-cur branch <番号>` で得てから git を実行する手順は残さない。用意のあとに `branch` の出力と今のブランチを比べる手順は残さない
- 13. 条件: 設計作成役を起動する前に今のブランチを見る 主体: `skills/sdd-cur/SKILL.md` 結果: 作業ブランチ名を `sdd-cur branch <番号>` の標準出力から得て、今のブランチと比べる手順は残す。`prepare-branch` は実行しない。checkout や作業ブランチの新規作成はしない
- 14. 条件: `prepare-branch` の終了コードが 0 以外である 主体: `skills/sdd-cur/SKILL.md` 結果: 要求ファイルを変えない。要求の段のサブエージェントを起動しない。用意のための git を自ら実行しない
- 15. 条件: 用意の主体と、書かないファイル 主体: `prepare-branch` と実装のランナー 結果: 実装のランナーはこの用意をしない。レビューの分岐は変えない。このサブコマンドは要求ファイルを書かない。このサブコマンドは設計ファイルを書かない
- 16. 条件: テストの置き方 主体: テスト 結果: git を起動しない。git の実行を注入し、受け取った引数を記録する。この課題で足すテストは `src/120.test.ts` に書く。スキル本文を文字列で確かめる既存のテストは、`sdd-cur prepare-branch <番号>` を実行し、終了コードが 0 以外なら止まる、という文を期待する
- 17. 条件: サブコマンドの列挙に足す 主体: `docs/policy.md` と `AGENTS.md` 結果: `docs/policy.md` の `src/cli.ts` の行は `prepare-branch` を含む。`AGENTS.md` の「コマンド」の例に `bun src/cli.ts prepare-branch <番号>` の行がある

## 範囲外

次は作らない。

- 用意の三つの場合の git 操作を、今のスキルの手順から変えること
- このサブコマンドがマージすること
- このサブコマンドが rebase すること
- このサブコマンドが `git push` すること
- このサブコマンドが履歴を書き換えること。`rebase`、`reset`、`commit`、`push --force` を実行すること
- 不一致のとき、用意で行った checkout を戻すこと
- 課題ランナーのブランチ操作。課題ランナーがこの用意をすること。課題ランナーが `prepare-branch` を呼ぶこと
- レビューの分岐（#91）。スキルのレビューの節を変えること
- `implementationBranch` の中身を変えること。作業ブランチ名の接頭辞を変えること
- `skills/sdd-cur/SKILL.md` 以外のスキルの本文を変えること
- 設計作成役の前に `prepare-branch` を実行すること。設計の前に checkout すること。設計の前に作業ブランチを新しく作ること
- このサブコマンドが要求ファイルまたは設計ファイルを書くこと
- `gh` を起動すること
- README を変えること
- `export type GitClient` にメソッドを足すこと
- `src/runner.ts` を変えること
- `src/conventions.ts` を変えること
- 使い方に、今無い `restore`、`review-next`、`request` の行を足すこと
- 正本のサブコマンドの順の文（`docs` の REQ-713）を直すこと
- `request` の失敗の字面 `作業ブランチではありません` を変えること
- 課題を作ること。課題を閉じること。ラベルを変えること
- 依存パッケージ。トークンと環境変数の読み取り
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| サブコマンド名 | `prepare-branch` |
| 使い方 | `printUsage` の `sdd-cur branch <番号>` の次の行が `sdd-cur prepare-branch <番号>` である。今ある行の字面は変えない |
| 起動 | `bun src/cli.ts prepare-branch <番号>`。`switch` の `branch` の次に `prepare-branch` を足す |
| 引数 | 課題番号一つ。足りないときと多いときは `printUsage` して終了コード 1。標準出力は空。git は実行しない |
| 番号 | 既存の `parseIssueNumberString` が拒否するときは、標準エラーが `番号が不正です` の一行、終了コード 1、標準出力は空、git は実行しない。`branch` と同じである |
| 名前 | `implementationBranch` の戻り値だけを使う。`src/cli.ts` は `task-` を連結しない。`src/git.ts` は `implementationBranch` を import しない |
| 不一致 | 標準エラーは `今のブランチが作業ブランチと違います` の一行。終了コードは 1。標準出力は空。checkout は戻さない |
| 失敗の終了コード | 失敗は 1。成功は 0 |
| 成功の出力 | 標準出力は作業ブランチ名と末尾の改行一つ。標準エラーは空 |
| 置き場所 | 用意と比較は `src/git.ts` の `prepareBranch`。`src/cli.ts` が引数を見て、それを `defaultGitRunner` と `process.cwd()` で呼ぶ |
| `GitClient` | `export type GitClient` にはメソッドを足さない |
| リモートの拒否 | 既存の `remoteName` と同じであり、字面は `リモートを特定できません` である |
| デフォルトブランチが取れない | 字面は `デフォルトブランチを特定できません` である |
| git の失敗 | ローカルに無いことを表す終了コード 1 以外は、`createGit` が同じ失敗を `Error` にするときの `message` と同じ一行である |
| スキル | 要求の前は `prepare-branch` で用意と比較の両方を行う。設計の前は比較のみ行う |
| 文書 | `docs/policy.md` の `src/cli.ts` の行と、`AGENTS.md` の「コマンド」の例に足す。README は変えない |
| テスト | 新しい `test` は `src/120.test.ts` だけに足す。git の引数は注入した `GitRunner` で記録する |

不一致の一行は、用意のあと今のブランチが作業ブランチ名と違う、という事実だけを書く。ブランチ名は含めない。

`--help` と `-h` は、今の `main` が `spec-check` 以外で先に使い方を出して終了コード 0 にする。この先の扱いは変えない。`prepare-branch` を、その例外に足さない。

```ts
export async function prepareBranch(options: {
  git: GitRunner
  cwd: string
  branch: string
}): Promise<void>
```

成功のときは、何も返さず、標準出力にも標準エラーにも書かない。失敗のときは、`message` が上の字面である `Error` を投げる。`src/cli.ts` は、成功のあと `console.log` で作業ブランチ名を一行書き、終了コード 0 を返す。失敗のときは、その `message` だけを標準エラーへ書き、終了コード 1 を返す。標準出力には書かない。

`branch` 引数は、`implementationBranch` の戻り値である。`prepareBranch` は名前を作らない。

## 用意

最初に `git remote` を実行する。空行を除いた名前が一つでないときは、`リモートを特定できません` で止まる。このとき、あとの git は実行しない。名前が一つであるとき、その名前を `<remote>` とする。

次に、ローカルの有無を見る。引数は、この順である。

```
show-ref
--verify
--quiet
refs/heads/<作業ブランチ>
```

終了コード 0 のとき、ローカルにある。終了コード 1 のとき、ローカルに無い。標準出力は見ない。それ以外の終了コード、および起動の失敗は、用意の失敗である。残りの手順は行わない。

ローカルにあるときは、引数が `checkout` と `<作業ブランチ>` の二つの `git checkout <作業ブランチ>` だけを行う。`fetch`、`ls-remote`、`checkout -b`、`checkout -B` は実行しない。デフォルトブランチは fetch しない。この checkout は、ブランチを作り直さない。

ローカルに無いときは、`git ls-remote --heads <remote> <作業ブランチ>` を実行する。引数は `ls-remote`、`--heads`、`<remote>`、`<作業ブランチ>` の順である。終了コードが 0 以外のときは、用意の失敗である。デフォルトブランチの取得にも、作業ブランチの作成にも進まない。

終了コードが 0 のとき、標準出力を `\n` にそろえて行に分ける。行のうち、タブで分けた最後の欄が `refs/heads/<作業ブランチ>` と一文字も違わない行があるとき、リモートにある。`refs/heads/<作業ブランチ>` を接頭辞とする別の名前は、リモートにあることにしない。そのような行が無いときは、リモートに無い。

リモートにあるときは、`git fetch <remote> <作業ブランチ>` のあと、`git checkout -B <作業ブランチ> FETCH_HEAD` を実行する。引数は、`fetch`、`<remote>`、`<作業ブランチ>` と、`checkout`、`-B`、`<作業ブランチ>`、`FETCH_HEAD` である。起点はデフォルトブランチではない。`checkout -b` は実行しない。`ls-remote --symref` は実行しない。`fetch` が失敗したときは、`checkout -B` を実行しない。

ローカルにもリモートにも無いときだけ、新しく作る。`git ls-remote --symref <remote> HEAD` を実行する。引数は `ls-remote`、`--symref`、`<remote>`、`HEAD` の順である。終了コードが 0 以外のときは、用意の失敗である。作業ブランチは作らない。

終了コードが 0 のとき、`ref: refs/heads/` で始まる最初の行を取る。その接頭辞のあと、スペースまたはタブの前までがデフォルトブランチ名である。そのような行が無いとき、名前が空のときは、名前は取れない。取れないときは `デフォルトブランチを特定できません` で止まる。作業ブランチは作らない。`fetch` も `checkout` も実行しない。標準出力には書かない。

名前が取れたときは、`git fetch <remote> <デフォルトブランチ>` のあと、`git checkout -b <作業ブランチ> FETCH_HEAD` を実行する。引数は、`fetch`、`<remote>`、`<デフォルトブランチ>` と、`checkout`、`-b`、`<作業ブランチ>`、`FETCH_HEAD` である。起点は、この fetch したリモートの最新のデフォルトブランチである。`checkout -B` は実行しない。`fetch` が失敗したときは、`checkout -b` を実行しない。

用意の git が失敗したとき、利用者へ出す一行は、`src/git.ts` の `createGit` が同じ失敗を `Error` にするときの `message` と同じである。行頭と行末の空白を除いて空でない、標準エラーの最初の行がそれである。それが無いときは、標準出力を同じ取り方にした最初の行である。それも無いときは `git が失敗しました` である。起動そのものが失敗したときは `git を実行できません` である。この失敗のあと、残りの git は実行しない。

用意が終わったあと、`git rev-parse --abbrev-ref HEAD` で今のブランチを得る。引数は `rev-parse`、`--abbrev-ref`、`HEAD` の順である。用意が失敗したときは、この比較を行わない。得られた文字列が作業ブランチ名と一文字も違わないとき、成功である。違うとき、`今のブランチが作業ブランチと違います` で失敗する。このあと git は実行しない。用意で行った checkout を戻す checkout は実行しない。

このサブコマンドが実行する git は、上の引数だけである。`merge`、`rebase`、`push`、`reset`、`commit` は実行しない。

`git ls-remote --symref origin HEAD` の標準出力が、末尾の改行を含めて次のとき、デフォルトブランチ名は `main` である。

```
ref: refs/heads/main	HEAD
0123456789abcdef	HEAD
```

`ref: refs/heads/release/1.2	HEAD` のとき、名前は `release/1.2` である。`ref: refs/heads/	HEAD` のとき、名前は取れない。

## スキル

`skills/sdd-cur/SKILL.md` のフロントマターは変えない。レビューの節は変えない。設計の節のうち、下で足す三文以外は変えない。

要求の節の、作業ブランチを用意する段落から、番号付きの git 手順と、用意のあとに `branch` の出力と今のブランチを比べる文までを、次の文に置き換える。文のあいだに空行は入れない。

```
課題が開いていて業務ラベルが無く、要件の状態が `invalid` でないときは、要求作成役を起動する前に作業ブランチを用意する。
`sdd-cur prepare-branch <番号>` を実行し、終了コードが 0 以外なら止まる。
終了コードが 0 以外のとき、要求ファイルを変えない。
終了コードが 0 以外のとき、要求の段のサブエージェントを起動しない。
終了コードが 0 以外のとき、用意のための git を自ら実行しない。
実装のランナーは、この用意をしない。
終了コードが 0 のとき、Project A の作業ツリーはその作業ブランチである。
要求ファイルは、この作業ツリーに書く。
デフォルトブランチには書かない。
新しく作るときの起点は、リモートの最新のデフォルトブランチである。
用意ではマージしない。
rebase はしない。
`git push` をしない。
履歴を書き換えない。
```

この塊に、`git remote`、`git ls-remote`、`git fetch`、`git checkout`、`implementationBranch` は書かない。番号付きの git 手順は書かない。

要求の節の `比較を通ったあとだけ、要求作成役を起動する。` は、`終了コードが 0 のあとだけ、要求作成役を起動する。` に変える。要求の段のサブエージェントの名前と、model を渡さない文は、今の位置のまま残す。

設計の節には、今のブランチが作業ブランチ名と違うときの文の次に、次の三文を足す。

```
設計作成役を起動する前に、`sdd-cur prepare-branch <番号>` は実行しない。
この比較では、checkout をしない。
作業ブランチを新しく作らない。
```

設計の節に残す文は、作業ブランチ名を `sdd-cur branch <番号>` の標準出力から得ること、末尾改行を除くこと、今のブランチと比べること、違うときはファイルを変えず設計のサブエージェントも起動しないこと、比較を通ったあとだけ設計作成役を起動すること、同じ作業ブランチであること、デフォルトブランチから作り直さないこと、デフォルトブランチには書かないこと、である。

## 変えるファイル

- src/cli.ts
- src/git.ts
- src/120.test.ts
- src/cli.test.ts
- src/package.test.ts
- src/94.test.ts
- src/sdd-skill-sdd-cur.test.ts
- skills/sdd-cur/SKILL.md
- docs/policy.md
- AGENTS.md
- docs/canonical/git.md
- docs/canonical/sdd.md
- docs/canonical/docs.md

`src/cli.test.ts`、`src/package.test.ts`、`src/94.test.ts` は、使い方の全文の定数に、行 `sdd-cur prepare-branch <番号>` を `sdd-cur branch <番号>` の次へ足すだけである。新しい `test` は足さない。

`src/sdd-skill-sdd-cur.test.ts` は、必須文言の配列から `implementationBranch`、`git ls-remote --symref`、`git checkout -b` を除き、`` `sdd-cur prepare-branch <番号>` を実行し、終了コードが 0 以外なら止まる。 `` を足すだけである。新しい `test` は足さない。他の必須文言は残す。

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。新しい `test` は `src/120.test.ts` だけに足す。

引数が不正なときの試験は、`bun src/cli.ts prepare-branch` を実行する。この引数では git を起動しない。git の引数の試験は、`prepareBranch` に注入した `GitRunner` が受け取った `args` を記録する。`defaultGitRunner` は呼ばない。正しい番号で `bun src/cli.ts prepare-branch` は実行しない。

作業ブランチ名 `task-120`、リモート名 `origin`、デフォルトブランチ名 `main` で、次を確かめる。

- `src/cli.ts` の `switch` に `prepare-branch` があり、`bun src/cli.ts --help` の標準エラーに、行全体が `sdd-cur prepare-branch <番号>` である行がある。[1]
- 引数が無いとき、引数が二つのとき、標準エラーは使い方の全文であり、終了コードは 1、標準出力は空である。`foo`、`0`、`01` のとき、標準エラーは `番号が不正です` の一行であり、終了コードは 1、標準出力は空である。これらの実行で git は起動しない。[2]
- `prepareBranch` に渡す `branch` は、`implementationBranch(120)` の戻り値 `task-120` と一文字も違わない。`src/cli.ts` に `task-` は無い。`src/git.ts` は `implementationBranch` を import しない。[3]
- `git remote` の標準出力が空、または `origin` と `upstream` の二行のとき、`args` は `remote` の一つだけであり、投げられた `message` は `リモートを特定できません` である。[4]
- 最初の `args` は `remote` である。`show-ref` の終了コードが 0 のとき、そのあとの `args` は `checkout` と `task-120` だけであり、そのあと `rev-parse`、`--abbrev-ref`、`HEAD` である。`fetch`、`ls-remote`、`-b`、`-B` は無い。[5]
- 最初の `args` は `remote` である。`show-ref` の終了コードが 1 であり、`ls-remote --heads` の標準出力に `refs/heads/task-120` の行があるとき、`fetch`、`origin`、`task-120` のあと、`checkout`、`-B`、`task-120`、`FETCH_HEAD` である。`-b` と `--symref` は無い。`refs/heads/task-1200` だけの標準出力は、リモートにあることにしない。[6]
- 最初の `args` は `remote` である。ローカルにもリモートにも無いとき、`--symref` の標準出力から `main` を取り、`fetch`、`origin`、`main` のあと、`checkout`、`-b`、`task-120`、`FETCH_HEAD` である。`-B` は無い。`--symref` の標準出力に `ref: refs/heads/` が無いとき、`message` は `デフォルトブランチを特定できません` であり、`fetch` と `checkout` は無い。[7]
- `show-ref` の終了コードが 2 のとき、`ls-remote` と `fetch` と `checkout` は無い。`ls-remote --heads` の終了コードが 1 のとき、`--symref` と `fetch` と `checkout` は無い。新しく作るときの `fetch` の終了コードが 1 のとき、`checkout -b` は無い。これらの `message` は、行頭と行末の空白を除いた標準エラーの最初の非空行である。標準エラーも標準出力も空のときは `git が失敗しました` である。起動が拒否されたときは `git を実行できません` である。[8]
- 三つの場合のどれでも、記録した `args` に `merge`、`rebase`、`push`、`reset`、`commit` は無い。[9]
- 比較で `HEAD` が `task-120` のとき、`prepareBranch` は成功する。`src/cli.ts` の `prepare-branch` が成功したとき `console.log` に渡す引数は、`prepareBranch` に渡した `branch` 一つである。[10]
- 比較で `HEAD` が `main` のとき、`message` は `今のブランチが作業ブランチと違います` であり、`rev-parse` のあとに git は無い。[11]
- `skills/sdd-cur/SKILL.md` は、`` `sdd-cur prepare-branch <番号>` を実行し、終了コードが 0 以外なら止まる。 `` と、`終了コードが 0 以外のとき、要求ファイルを変えない。` と、`要求の段のサブエージェントを起動しない。` と、`用意のための git を自ら実行しない。` を含む。`## 要件` から `## 設計` の前までに、`git ls-remote`、`git checkout`、`git fetch`、`git remote`、`implementationBranch` は無い。`終了コードが 0 のあとだけ、要求作成役を起動する。` がある。`比較を通ったあとだけ、要求作成役を起動する。` は無い。[12][14]
- 設計の節に、`sdd-cur branch <番号>` の標準出力から得ること、今のブランチと比べること、`` `sdd-cur prepare-branch <番号>` は実行しない。 ``、`checkout をしない。`、`作業ブランチを新しく作らない。` がある。[13]
- `prepareBranch` は、渡した一時ディレクトリに `docs/issues/120/requirements.md` と `docs/issues/120/design.md` を作らない。`src/runner.ts` に `prepare-branch` は無い。`skills/sdd-cur/SKILL.md` に `実装のランナーは、この用意をしない。` がある。この課題のテストは、レビューの必須文言を配列から除かない。[15]
- `src/120.test.ts` の git の試験は、注入した `GitRunner` の `args` を記録する。`Bun.spawn` の引数に `git` は無い。`src/sdd-skill-sdd-cur.test.ts` の必須文言は、上で除く三つの文字列が無く、足す一文がある。[16]
- `docs/policy.md` の `src/cli.ts` の行に `prepare-branch` がある。`AGENTS.md` の「コマンド」のコードフェンスに、行 `bun src/cli.ts prepare-branch <番号>` がある。[17]

## 作業の一覧

- 1. `src/cli.ts` に `prepare-branch` を足し、引数の扱いを `branch` と同じにし、作業ブランチ名は `implementationBranch` の戻り値だけを `prepareBranch` へ渡す。[1][2][3]
- 2. `src/git.ts` に `prepareBranch` を置き、三つの場合の git 引数、途中の失敗、比較、不一致の字面を、この設計のとおりにする。[4][5][6][7][8][9][10][11][15]
- 3. `skills/sdd-cur/SKILL.md` の要求の前の用意を、この設計の数行にし、設計の前の比較は残す。[12][13][14][15]
- 4. `docs/policy.md` と `AGENTS.md` の列挙に `prepare-branch` を足す。この設計の正本への差分を、`docs/canonical/git.md` と `docs/canonical/sdd.md` と `docs/canonical/docs.md` へ反映する。[17]
- 5. `src/120.test.ts` で、注入した git の引数と、引数の失敗と、スキルの文と、列挙を確かめる。既存の使い方の全文定数と、スキル本文の必須文言は、この設計が書いた差分だけ変える。[1][2][3][4][5][6][7][8][9][10][11][12][13][14][15][16][17]

## 関係する課題

- #42（作業ブランチ名を `branch` が返し、設計の前に今のブランチを見る）
- #91（レビューの分岐をコードへ移し、同じスキルを短くする）
- #96（新しい作業ブランチの起点と、課題ランナーの取り込み）

#42 は、作業ブランチ名を `branch <番号>` の標準出力とする。この設計は、その名前の規則を変えない。設計の前は、今のブランチがその名前であるかをスキルが見る。要求の前の比較は、`prepare-branch` が行う。設計の前に、違うブランチへ checkout することはしない。

#91 は、レビュー応答の分岐を `review-next` へ移す。この設計は、その分岐と、スキルのレビューの節を変えない。

#96 は、作業ブランチを新しく作るときの起点を、リモートの最新のデフォルトブランチとする。この設計は、その起点を `prepare-branch` が新しく作るときに残す。課題ランナーのマージと push は、この設計に含めない。実装のランナーは、この用意をしない。

## 正本への差分

### 変更 sdd REQ-308

もとになった課題は #120 である。

`skills/sdd-cur/SKILL.md` の設計の手順は、作業ブランチ名を `branch` の標準出力から得る。末尾の改行は除く。設計作成役を起動する前に、今のブランチとその名前を比べる。違うときは、ファイルを変えず、設計のサブエージェントも起動しない。設計の前に `prepare-branch` は実行しない。checkout はしない。作業ブランチは新しく作らない。

### 変更 sdd REQ-314

もとになった課題は #120 である。

設計の手順は、`sdd-cur branch <番号>` を実行し、標準出力の末尾改行を除いた文字列を作業ブランチ名として使う。要件の手順は、要求作成役を起動する前に、このサブコマンドで名前を得てから git を実行しない。

### 変更 sdd REQ-315

もとになった課題は #120 である。

要件の手順は、要求作成役を起動する前に `sdd-cur prepare-branch <番号>` を実行する。終了コードが 0 以外なら止まる。そのとき、要求ファイルを変えない。そのとき、要求の段のサブエージェントを起動しない。そのとき、用意のための git を自ら実行しない。用意のあとに `branch` の出力と今のブランチを比べない。その比較は `prepare-branch` が行う。

### 変更 git REQ-646

もとになった課題は #120 である。

`prepare-branch` が作業ブランチを新しく作るとき、その起点はリモートの最新のデフォルトブランチである。SDD スキルは、要求作成役を起動する前にこのサブコマンドを実行することで、その作成を行う。

### 変更 git REQ-654

もとになった課題は #120 である。

新しいブランチの起点は、`prepare-branch` が作業ブランチを新しく作るときだけ、リモートの最新のデフォルトブランチである。実装のランナーは、この用意をしない。設計の前には、作業ブランチを新しく作らない。

### 追加 git REQ-832

もとになった課題は #120 である。

サブコマンド名は `prepare-branch` である。使い方の表示は `sdd-cur prepare-branch <番号>` である。起動は `bun src/cli.ts prepare-branch <番号>` である。引数は課題番号一つである。

### 追加 git REQ-833

もとになった課題は #120 である。

引数が課題番号一つでないとき、git は実行しない。終了コードは 1 である。標準出力には書かない。引数が一つでないときは、使い方を標準エラーへ書く。課題番号として読めないときは、標準エラーへ `番号が不正です` と一行書く。この扱いは `branch` と同じである。

### 追加 git REQ-834

もとになった課題は #120 である。

作業ブランチ名は、同じ課題番号に対する `branch` の標準出力から、末尾の改行を除いた文字列と一文字も違わない。作る関数は `implementationBranch` のままである。`prepare-branch` は、作業ブランチ名の接頭辞を連結しない。

### 追加 git REQ-835

もとになった課題は #120 である。

`prepare-branch` は、最初に `git remote` の空行を除いた名前が一つであるかを見る。一つでないときは、標準エラーへ `リモートを特定できません` と一行書く。終了コードは 1 である。作業ブランチを作らない。デフォルトブランチを fetch しない。標準出力には書かない。一つであるとき、その名前を以降の `<remote>` とする。

### 追加 git REQ-836

もとになった課題は #120 である。

ローカルに `refs/heads/<作業ブランチ>` があるかは、`git show-ref --verify --quiet refs/heads/<作業ブランチ>` の終了コードで見る。0 のときあり、1 のとき無い。ありのときは `git checkout <作業ブランチ>` する。デフォルトブランチは fetch しない。作業ブランチを作り直さない。`git fetch`、`git checkout -b`、`git checkout -B`、`git ls-remote` はしない。

### 追加 git REQ-837

もとになった課題は #120 である。

ローカルに無く、`git ls-remote --heads <remote> <作業ブランチ>` の標準出力に、タブで分けた最後の欄が `refs/heads/<作業ブランチ>` である行があるときは、`git fetch <remote> <作業ブランチ>` のあと `git checkout -B <作業ブランチ> FETCH_HEAD` する。起点はデフォルトブランチではない。`git checkout -b` はしない。

### 追加 git REQ-838

もとになった課題は #120 である。

ローカルにもリモートにも無いときだけ、作業ブランチを新しく作る。デフォルトブランチ名は、`git ls-remote --symref <remote> HEAD` の、`ref: refs/heads/` で始まる最初の行の、その接頭辞のあと空白の前までである。取れないときは、標準エラーへ `デフォルトブランチを特定できません` と一行書く。終了コードは 1 である。作業ブランチを作らない。標準出力には書かない。取れたときは、`git fetch <remote> <デフォルトブランチ>` のあと `git checkout -b <作業ブランチ> FETCH_HEAD` で作る。起点は、この fetch したリモートの最新のデフォルトブランチである。`git checkout -B` はしない。

### 追加 git REQ-839

もとになった課題は #120 である。

用意の手順の途中で失敗したときは、残りの手順を行わない。作業ブランチをデフォルトブランチから作らない。終了コードは 1 である。標準出力には書かない。`prepare-branch` は、マージしない。rebase しない。`git push` をしない。履歴を書き換えない。

### 追加 git REQ-840

もとになった課題は #120 である。

用意の手順が終わったあと、`git rev-parse --abbrev-ref HEAD` の結果と作業ブランチ名を比べる。一文字も違わないとき、終了コードは 0 であり、標準出力は作業ブランチ名の一行である。違うとき、終了コードは 1 であり、標準エラーは `今のブランチが作業ブランチと違います` の一行である。標準出力へ作業ブランチ名を書かない。用意で行った checkout は戻さない。

### 追加 git REQ-841

もとになった課題は #120 である。

`prepare-branch` は、要求ファイルを書かない。設計ファイルを書かない。`gh` を起動しない。実装のランナーは、この用意をしない。

### 追加 git REQ-842

もとになった課題は #120 である。

テストは git を起動しない。git の実行は注入し、受け取った引数を記録する。この課題で足すテストは `src/120.test.ts` に書く。既存の `src/*.test.ts` に、新しい `test` は足さない。

### 追加 sdd REQ-843

もとになった課題は #120 である。

`skills/sdd-cur/SKILL.md` の、要求作成役を起動する前の用意は、`sdd-cur prepare-branch <番号>` を実行し、終了コードが 0 以外なら止まる、という数行である。その数行は、用意の番号付き git 手順を含まない。終了コードが 0 以外のとき、スキルは要求ファイルを変えない。終了コードが 0 以外のとき、要求の段のサブエージェントを起動しない。終了コードが 0 以外のとき、用意のための git を自ら実行しない。

### 追加 docs REQ-844

もとになった課題は #120 である。

`docs/policy.md` の構成の表の `src/cli.ts` の行は、サブコマンド `prepare-branch` を含む。

### 追加 docs REQ-845

もとになった課題は #120 である。

`AGENTS.md` の「コマンド」の例に、`bun src/cli.ts prepare-branch <番号>` の行がある。
