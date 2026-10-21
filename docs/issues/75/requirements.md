# 75 パッケージを公開し bunx で実行できるようにする

対象は [Issue #75](https://github.com/paterapatera/sdd-cur/issues/75)。`@paterapatera/sdd-cur` を公開し、リポジトリをクローンせずに `bunx @paterapatera/sdd-cur` で今の CLI を実行できるようにする。

設計 1 は npm への公開を範囲外としている。本課題は、その公開をしたパッケージを `bunx` で実行できることを対象にする。

## 現状

`package.json` の `name` は `@paterapatera/sdd-cur`、`private` は `true`、`version` は `0.0.0` である。`bin.sdd-cur` は `src/cli.ts` であり、その先頭は `#!/usr/bin/env bun` である。今の CLI の入口は `src/cli.ts` である。

依存パッケージは置かない。実行は Bun が TypeScript を直接行う。開発時は `bun src/cli.ts` で起動する。

`install` は、パッケージ内の `skills/` と `agents/` をコピーする。

README の「公開後の起動」は、次を書いている。

```sh
bunx @paterapatera/sdd-cur install [project-root]
bunx @paterapatera/sdd-cur run [--interval-min <分>]
```

公開はしていない。`bunx` では実行できない。

## 受け入れ条件

- リポジトリをクローンしていない環境で、`bunx @paterapatera/sdd-cur` に今の CLI のサブコマンドを渡すと、そのサブコマンドが起動する。
- 公開物には、リポジトリの `skills/` が含まれる。
- 公開物には、リポジトリの `agents/` が含まれる。
- 公開したパッケージの `install` は、その公開物の `skills/` をコピーする。
- 公開したパッケージの `install` は、その公開物の `agents/` をコピーする。
- 開発時に `bun src/cli.ts` を実行すると、今の CLI が起動する。

## 関係する課題

課題は、次を関係するとする。

- #1（パッケージ骨格。npm への公開は範囲外）

## 範囲外

次は、この要件に含めない。

- `docs/issues/1/design.md` の書き換え
- 課題の作成とクローズ
- ラベルの変更
- 受け入れ手順
- 完了処理
