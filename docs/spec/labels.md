# labels

## REQ-62

もとになった課題は #3 である。

`bun src/cli.ts labels` を、対象リポジトリの作業ツリーで実行すると、下の五つのラベルが GitHub 上に存在する。すでにあるラベルは作り直さない。

## REQ-63

もとになった課題は #3 である。

五つの名前、説明、色の定義は `workflowLabels` だけが持つ。この課題では `editLabels` を呼ばない。

## REQ-64

もとになった課題は #3 である。

`bun test` は `gh` を起動しない。注入した実行係が、取得と作成の引数と標準入力を記録する。

## REQ-65

もとになった課題は #3 である。

名前の置き場所は`src/labels.ts` の `workflowLabels`。説明は計画の「意味」と同じ文字列にするである。

## REQ-66

もとになった課題は #3 である。

作成は`GitHubClient` に `getLabel` と `createLabel` を足す。`ensureWorkflowLabels` が五件を順に、無いものだけ作るである。

## REQ-67

もとになった課題は #3 である。

既存は同名があるときは色も説明も変えない。`created` にせず `existing` とするである。

## REQ-68

もとになった課題は #3 である。

実行は`gh` の `api`。認証は `gh` のログインに任せる。トークンも環境変数も読まないである。

## REQ-69

もとになった課題は #3 である。

入口はサブコマンド `labels`。引数は取らない。`install` と `run` の動作は変えないである。

## REQ-70

もとになった課題は #3 である。

リポジトリは`resolveRepo` で作業ツリーの `cwd` から得る。`api` はパスにリポジトリを含めるである。

## REQ-71

もとになった課題は #3 である。

ラベルは次の順で、この色にする。色は `#` の無い 6 桁である。

## REQ-72

もとになった課題は #3 である。

```ts
export const workflowLabels: readonly {
  name: string
  description: string
  color: string
}[]

## REQ-73

もとになった課題は #3 である。

export type LabelEnsureResult = {
  name: string
  status: "created" | "existing"
}

## REQ-74

もとになった課題は #3 である。

export function ensureWorkflowLabels(
  github: GitHubClient,
): Promise<LabelEnsureResult[]>
```

## REQ-75

もとになった課題は #3 である。

`GitHubClient` に次を足す。

## REQ-76

もとになった課題は #3 である。

```ts
getLabel(name: string): Promise<{ name: string } | null>
createLabel(input: {
  name: string
  description: string
  color: string
}): Promise<void>
```

## REQ-77

もとになった課題は #3 である。

`ensureWorkflowLabels` は `workflowLabels` の順に `getLabel` を呼ぶ。`null` のときだけ `createLabel` を呼び、`status` を `"created"` にする。名前が返ったときは `createLabel` を呼ばず `"existing"` にする。戻り値は五件で、並びは `workflowLabels` と同じである。

## REQ-78

もとになった課題は #82 である。

`process` が失敗したとき、ランナーは失敗の理由の日本語一行を標準エラーに書く。

## REQ-79

もとになった課題は #82 である。

そのサブコマンド名は `restore` である。

## REQ-80

もとになった課題は #82 である。

使い方は `bun src/cli.ts restore <番号>` である。

## REQ-81

もとになった課題は #82 である。

失敗の一行は`runLoop` が今使っている理由の一行。`Error` で `message` があるときはその文字列。それ以外は `String(error)`である。

## REQ-82

もとになった課題は #82 である。

標準エラーは`process` が失敗したとき、その一行を `logError` へ渡す。これは今のままである

## REQ-83

もとになった課題は #82 である。

課題コメントは標準エラーへ書いたあと、同じ文字列を `addComment` の本文にする。印の行は足さない。空にしない。前後も削らないである。

## REQ-84

もとになった課題は #82 である。

コメントの失敗は投稿が拒否したときは、その理由の一行を標準エラーへ書き、終了コード 1 で止まる。`process` の失敗の一行は、すでに書いてある。ラベルは変えない。次の `poll` は呼ばないである。

## REQ-85

もとになった課題は #82 である。

マージリクエストは失敗理由では `addPullRequestComment` を呼ばないである。

## REQ-86

もとになった課題は #82 である。

失敗時のラベルは`editLabels` を呼ばない。着手で付いた「実装中」は残るである。

## REQ-87

もとになった課題は #82 である。

ループは`process` が失敗したあとは `return 1` である。次の `poll` は呼ばない。`poll` の失敗は、今どおり標準エラーへ一行書いて `return 1` であり、課題コメントは書かないである。

## REQ-88

もとになった課題は #82 である。

サブコマンドは`restore`。引数は課題番号が一つ。使い方の行は `sdd-cur restore <番号>` であり、`sdd-cur complete <番号>` の直後に置くである。

## REQ-89

もとになった課題は #82 である。

`restore` の呼び出しは`createGitHub` だけを使う。ランナー、スキル、`agent`、`git` は呼ばない。課題コメントは書かない。課題は閉じないである。

## REQ-90

もとになった課題は #82 である。

「実装中」を外して着手前のラベルに戻す CLI のサブコマンド名は `restore` である。

## REQ-91

もとになった課題は #82 である。

使い方は `bun src/cli.ts restore <番号>` である。`<番号>` は課題番号である。
