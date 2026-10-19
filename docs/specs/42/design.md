# 42 作業ブランチ名を返し設計前に今のブランチを確認する

対象は [Issue #42](https://github.com/paterapatera/sdd-cur/issues/42)。作業ブランチの名前を sdd-cur の要件と設計の手順が得られず、設計時に今のブランチを確かめない。

要求の決定どおり、サブコマンド `branch <番号>` が `task-<番号>` を返し、要件と設計のファイルを書く手順の前に、今のブランチがそれと一致することを見る。一致しないときはファイルを書かない。

## 受け入れ条件

- `bun src/cli.ts branch <番号>` が、標準出力に `task-<番号>` の文字列だけを返す。末尾の改行のみ可である。
- `skills/sdd-cur/SKILL.md` の要件と設計の手順は、作業ブランチ名を、このサブコマンドの戻り値として得る。
- 要件と設計のどちらのファイルを書く手順でも、サブエージェントを起動する前に今のブランチを見る。今のブランチが、その戻り値でないときは、ファイルを書かず、サブエージェントも起動しない。

## 範囲外

次は作らない。

- ブランチ名の規則の変更。`implementationBranch` の実装は変えない
- 実装ランナーの `fetch` と `checkoutFetched` の手順
- `show` の JSON にブランチ名フィールドを足すこと
- 今のブランチが違うときに、作業ブランチへ自動で切り替えること
- クローン同士の同時実装（#8）
- 「実装中」でクローン同士を分けること（計画）
- 課題の作成とクローズ。ラベルの変更。実装。受け入れ手順。完了処理
- `src/conventions.ts` の変更
- `docs/plan.md`、`docs/conventions.md` の書き換え
- Forgejo、Jira、Backlog
- 依存パッケージ。`package.json` の変更

## 決定

| 項目 | 内容 |
|---|---|
| サブコマンド | `branch`。引数は `show` と同様に課題番号を一つ |
| 名前の出所 | `src/runner.ts` の `implementationBranch` の戻り値を、そのまま標準出力に書く |
| 出力 | `console.log` による一行。内容は `task-<番号>` だけであり、末尾の改行のみ可である |
| 拒否 | 番号が不正なときは `parseIssueNumberString` と `implementationBranch` の既存の拒否どおり `番号が不正です` |
| 引数の数 | `show` と同じ。足りない、多いときは `printUsage` して終了コード 1 |
| 作業ブランチ名の取得 | SDD スキルは `bun src/cli.ts branch <番号>` を実行し、標準出力の末尾改行を除いた文字列を名前として使う |
| 今のブランチ | 書く前に見る |
| 比較 | 今のブランチと、作業ブランチ名が一致すること |
| 不一致 | 要求ファイルも設計ファイルも書かない。要求作成役、設計作成役、修正役を起動しない |
| 確認の順 | 要件では、作業ブランチを用意したあと、要求作成役を起動する前に行う。設計では、設計作成役を起動する前に行う |
| 設計 27 | 作業ブランチを用意するタイミングと、デフォルトブランチから作り直さないことは変えない |

## `branch` サブコマンド

`src/cli.ts` に `cmdBranch` を足す。`printUsage` と `main` の `switch` に `branch` を足す。

```ts
function cmdBranch(args: string[]): Promise<number>
```

- 引数が一つでないときは `printUsage` して 1。
- `parseIssueNumberString` で番号を得る。
- `implementationBranch(issueNumber)` の戻り値を `console.log` する。
- 成功時は 0。

`implementationBranch` は `src/runner.ts` から import する。`gh` は呼ばない。

## スキルの手順

`skills/sdd-cur/SKILL.md` の「要件」と「設計」を変える。着手、確認、回答、禁止の既存の必須文言は残す。フロントマターは変えない。

「要件」では、次を変える。

- 作業ブランチの名前は、`implementationBranch` の戻り値ではなく、`bun src/cli.ts branch <番号>` の標準出力から得る。末尾改行は除く。
- 課題が開いていて業務ラベルが無く、要件の状態が `invalid` でないときは、要求作成役を起動する前に作業ブランチを用意する。用意のあと、作業ブランチ名を `branch` で得て、今のブランチと比べる。違うときは、ファイルを変えず、サブエージェントも起動しない。
- 上記の比較を通ったあとだけ、要求作成役を起動する。

「設計」では、次を変える。

- 設計ファイルを書く作業ツリーは、要求のときに用意した同じ作業ブランチである。デフォルトブランチから作業ブランチを作り直さない。
- 設計作成役を起動する前に、作業ブランチ名を `branch` で得て、今のブランチと比べる。違うときは、ファイルを変えず、設計のサブエージェントも起動しない。
- 上記の比較を通ったあとだけ、設計作成役を起動する。

`state` が `open` でないとき、業務ラベルがあるとき、要件が `ready` でないとき、設計が `invalid` のとき、`unanswered` や `nextAnswer` のゲートは、設計 26 のままである。

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。

`src/cli.test.ts` に足す。

- `usageText` に `sdd-cur branch <番号>` の行を足す。
- `branch 17` の標準出力は `task-17` と末尾改行だけである。
- `branch` の引数が無いときは終了コード 1 である。
- `branch foo` は `番号が不正です` で終了コード 1 である。

`src/sdd.test.ts` の、`skills/sdd-cur/SKILL.md` の既存の必須文言は残す。加えて、次が含まれる。

- `bun src/cli.ts branch`
- `要求作成役を起動する前に`
- `設計作成役を起動する前に`
- `ファイルを変えず`

## 作業の一覧

1. `src/cli.ts` に `branch` を足し、`printUsage` を変える。
2. `skills/sdd-cur/SKILL.md` の「要件」と「設計」を、上の手順に変える。
3. `src/cli.test.ts` と `src/sdd.test.ts` を、上の期待に合わせる。
4. `bun test` を通し、`gh`、`git`、`agent` を起動しないことを確かめる。
