# 3 業務フロー用ラベルの整備

対象は [Issue #3](https://github.com/paterapatera/sdd-cur/issues/3)。計画の五つのラベルを、このリポジトリと利用プロジェクトの GitHub に作れるようにする。名前、説明、色は一箇所に置く。後続の課題が、この配列の `name` を `editLabels` に渡す。

## 受け入れ条件

- `bun src/cli.ts labels` を、対象リポジトリの作業ツリーで実行すると、下の五つのラベルが GitHub 上に存在する。すでにあるラベルは作り直さない。
- 五つの名前、説明、色の定義は `workflowLabels` だけが持つ。この課題では `editLabels` を呼ばない。
- `bun test` は `gh` を起動しない。注入した実行係が、取得と作成の引数と標準入力を記録する。

## 範囲外

次は作らない。

- 課題へのラベル付け外し、遷移の強制（#6、#7）。`editLabels` の引数は変えない
- すでにマージ済みのマージリクエストを再マージしない判断（#7）
- 既存ラベルの色と説明の更新、ラベルの削除、五つの以外のラベルの作成
- コメント種別、`docs/issues` の課題ごとの構成（#4）
- SDD スキルの本文（#5）
- `poll` と `process` からのラベル作成。`src/runner.ts` と `src/run.ts` は変えない
- 課題の作成とクローズ
- `--repo` 引数。リポジトリは作業ツリーから決める
- Forgejo、Jira、Backlog
- 依存パッケージ

## 決定

| 項目 | 内容 |
|---|---|
| 名前の置き場所 | `src/labels.ts` の `workflowLabels`。説明は計画の「意味」と同じ文字列にする |
| 作成 | `GitHubClient` に `getLabel` と `createLabel` を足す。`ensureWorkflowLabels` が五件を順に、無いものだけ作る |
| 既存 | 同名があるときは色も説明も変えない。`created` にせず `existing` とする |
| 失敗 | 五件の途中で拒否したときは、残りのラベルを見ない。すでに作ったものは消さない |
| 実行 | `gh` の `api`。認証は `gh` のログインに任せる。トークンも環境変数も読まない |
| 入口 | サブコマンド `labels`。引数は取らない。`install` と `run` の動作は変えない |
| リポジトリ | `resolveRepo` で作業ツリーの `cwd` から得る。`api` はパスにリポジトリを含める |

ラベルは次の順で、この色にする。色は `#` の無い 6 桁である。

| 名前 | 説明 | 色 |
|---|---|---|
| 実装依頼 | 設計が終わり、実装してよい | `FBCA04` |
| 実装中 | 実装を始めた | `D93F0B` |
| 実装完了 | 実装が終わり、受け入れ手順がコメントにある | `0E8A16` |
| 動作確認OK | 受け入れテストに合格した | `1D76DB` |
| マージ済み | スカッシュマージと同時に付ける | `5319E7` |

```ts
export const workflowLabels: readonly {
  name: string
  description: string
  color: string
}[]

export type LabelEnsureResult = {
  name: string
  status: "created" | "existing"
}

export function ensureWorkflowLabels(
  github: GitHubClient,
): Promise<LabelEnsureResult[]>
```

`GitHubClient` に次を足す。

```ts
getLabel(name: string): Promise<{ name: string } | null>
createLabel(input: {
  name: string
  description: string
  color: string
}): Promise<void>
```

`ensureWorkflowLabels` は `workflowLabels` の順に `getLabel` を呼ぶ。`null` のときだけ `createLabel` を呼び、`status` を `"created"` にする。名前が返ったときは `createLabel` を呼ばず `"existing"` にする。戻り値は五件で、並びは `workflowLabels` と同じである。

## 検証

ラベル名は `getLabel` と `createLabel` の両方が、`gh` を呼ぶ前に拒否する。色と説明は `createLabel` だけが拒否する。

| 条件 | 理由 |
|---|---|
| ラベル名が空、前後に空白、カンマを含む | `ラベル名が不正です` |
| 色が `#` 無しの 6 桁の 16 進でない | `ラベルの色が不正です` |
| 説明が、前後の空白を除いて空 | `ラベルの説明が空です` |

説明は、空の判定にだけ trim を使い、渡す文字列そのものは変えない。

## 操作

`api` に `--repo` は付けない。

| 操作 | 引数 | 標準入力 |
|---|---|---|
| `getLabel` | `api repos/<owner>/<repo>/labels/<符号化名>` | 渡さない |
| `createLabel` | `api --method POST repos/<owner>/<repo>/labels --input -` | `name`、`color`、`description` をこの順で持つ JSON |

`<符号化名>` は `encodeURIComponent` と同じ規則である。`実装依頼` は `%E5%AE%9F%E8%A3%85%E4%BE%9D%E9%A0%BC` になり、パスは `labels/%E5%AE%9F%E8%A3%85%E4%BE%9D%E9%A0%BC` になる。

`getLabel` は終了コードを見たうえで 404 を判定する。0 以外を先に例外にする経路には載せない。終了コードが 0 以外で、標準エラーに `HTTP 404` を含むときは `null` を返す。それ以外の 0 以外は、#2 の失敗規則で拒否する。標準エラーの先頭の非空行、それが無ければ標準出力の先頭の非空行、それも無ければ `gh が失敗しました`。

標準出力を JSON として解釈できないときは `gh の応答を解釈できません` で拒否する。終了コードが 0 のときは、応答の `name` が要求した名前と一致するときだけ `{ name }` を返す。一致しない、または `name` が文字列でないときは `gh の応答を解釈できません` で拒否する。色と説明は見ない。

`createLabel` が 0 以外のときは、取得をやり直さず、その失敗理由で拒否する。終了コードが 0 のときは、応答の `name` が要求した名前と一致するときだけ成功とする。標準出力を JSON として解釈できないとき、一致しないとき、または `name` が文字列でないときは `gh の応答を解釈できません` で拒否する。

## labels

1. 引数が一つでもあるときは、使い方を書いて終了コード 1 で終わる。
2. `resolveRepo(defaultGhRunner, process.cwd())` で `owner/repo` を得る。
3. `createGitHub({ gh: defaultGhRunner, repo, cwd: process.cwd() })` を作る。
4. `ensureWorkflowLabels` を呼ぶ。
5. 結果の順に、標準出力へ一行ずつ書く。`created` は `作成しました: <名前>`、`existing` は `既にあります: <名前>`。成功時の終了コードは 0 である。
6. 拒否したときは、`Error` の message だけを標準エラーへ一行書き、終了コード 1 で終わる。

使い方は次の三行である。`install` と `run` の行は変えない。

```
sdd-cur install [project-root]
sdd-cur run [--interval-min <1 以上 1440 以下の整数>]
sdd-cur labels
```

`--help` と `-h` は、これまでどおり使い方を標準エラーへ書き、終了コード 0 で終わる。`labels` の処理はしない。

## テスト

`bun test` で、`createGitHub` に記録用の `GhRunner` を渡す。

- 不正なラベル名、色、空の説明は、`run` を呼ばずに拒否する。
- `getLabel` は符号化済みのパスで `api` を一回だけ呼ぶ。`stdin` は付かない。標準エラーに `HTTP 404` がある失敗は `null` である。`HTTP 404` の無い失敗は、その先頭行で拒否する。
- `getLabel` は、応答の `name` が要求と一致するとき `{ name }` を返す。一致しないときは拒否する。
- `getLabel` の標準出力が JSON でないときは `gh の応答を解釈できません` で拒否する。
- `createLabel` は上記の `api` を一回だけ呼ぶ。標準入力の JSON は `name`、`color`、`description` をこの順で持つ。終了コードが 0 でも、応答の `name` が要求と一致しないとき、または JSON でないときは拒否する。
- `ensureWorkflowLabels` は五件を表の順に見る。無いラベルだけ `createLabel` し、あるラベルは `createLabel` しない。戻り値の `name` と `status` が、その結果と一致する。
- 三件目の `createLabel` が拒否したとき、四件目以降の `getLabel` は呼ばれない。
- `workflowLabels` の名前、説明、色は、上の表と一致する。

起動の確認は、`gh` を起動しない範囲で子プロセスに行う。

- `bun src/cli.ts --help` の標準エラーに `sdd-cur labels` がある。終了コードは 0 である。
- `bun src/cli.ts labels extra` の標準エラーは使い方の三行である。子プロセスの `PATH` から `gh` を外しても、同じ三行で終了コード 1 になる。

`bun test` のあと、このリポジトリの作業ツリーで `bun src/cli.ts labels` を一回実行する。標準出力が五件で、終了コードが 0 であることを確かめる。もう一度実行し、五行とも `既にあります:` で、終了コードが 0 であることを確かめる。

## 作業の一覧

1. `getLabel` と `createLabel` を `src/github.ts` に足し、符号化、404、作成の JSON、不正値のテストを通す。
2. `workflowLabels` と `ensureWorkflowLabels` を `src/labels.ts` に置き、無いものだけ作り、途中の拒否で止まることを確かめる。
3. `labels` サブコマンドと使い方の三行目を `src/cli.ts` に足す。`--help` と余分な引数を子プロセスで確かめる。
4. このリポジトリで `bun src/cli.ts labels` を二回実行し、五つのラベルが残り、二回目はどれも作成しないことを確かめる。
5. README と AGENTS.md のコマンド一覧に、`labels` の一行を足す。
