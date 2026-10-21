# 75 パッケージを公開し bunx で実行できるようにする

対象は [Issue #75](https://github.com/paterapatera/sdd-cur/issues/75)。`@paterapatera/sdd-cur` を npm へ公開し、リポジトリをクローンせずに `bunx @paterapatera/sdd-cur` で今の CLI を実行できるようにする。

設計 1 は npm への公開を範囲外としている。本設計は、その公開物の形と、公開物の `bin` から今の CLI が起動すること、`install` が公開物の `skills/` と `agents/` をコピーすることを書く。`docs/issues/1/design.md` は書き換えない。

## 受け入れ条件

- リポジトリをクローンしていない環境で、`bunx @paterapatera/sdd-cur` に今の CLI のサブコマンドを渡すと、そのサブコマンドが起動する。
- 公開物には、リポジトリの `skills/` が含まれる。
- 公開物には、リポジトリの `agents/` が含まれる。
- 公開したパッケージの `install` は、その公開物の `skills/` をコピーする。
- 公開したパッケージの `install` は、その公開物の `agents/` をコピーする。
- 開発時に `bun src/cli.ts` を実行すると、今の CLI が起動する。

## 範囲外

次は作らない。

- `docs/issues/1/design.md` の書き換え
- 課題の作成とクローズ
- ラベルの変更
- 受け入れ手順
- 完了処理
- サブコマンドの追加と削除。使い方の文言の変更
- `install` のコピー規則と宛先の変更
- TypeScript を JavaScript へビルドすること
- 依存パッケージ
- README と AGENTS.md の書き換え
- npm レジストリへの送信（`bun publish`）

実装は公開できる形までである。`package.json` の変更と pack のテストを行う。`bun publish` は人が別途行う。実装の作業に npm レジストリへの送信は含めない。

## 決定

| 項目 | 内容 |
|---|---|
| レジストリ | npm。`bunx @paterapatera/sdd-cur` が取得する公開先は、ここである |
| レジストリへの送信 | 実装の作業に含めない。実装は公開できる形（`package.json` の変更と pack のテスト）までである。`bun publish` は人が別途行う |
| 名前 | `@paterapatera/sdd-cur` のまま |
| `version` | `0.0.0` のまま |
| `private` | `false`。`true` のときは `bun publish` が失敗する |
| 公開範囲 | `publishConfig.access` は `public`。スコープ付きの名前を、クローンしていない環境の `bunx` が取得できるようにする |
| 実行 | 依存パッケージは置かない。TypeScript を JavaScript へビルドしない。Bun が `src/cli.ts` を直接実行する |
| `bin` | `bin.sdd-cur` は `src/cli.ts` のまま。先頭行は `#!/usr/bin/env bun` のまま |
| 開発時の起動 | `bun src/cli.ts`。`scripts.sdd-cur` は `bun src/cli.ts`。`scripts.test` は `bun test`。script 名 `install` は置かない |
| サブコマンド | 今の九つのまま。使い方の文言は変えない |
| 公開物の位置 | リポジトリと同じ相対位置で `src/`、`skills/`、`agents/` を含める。`files` は足さない。`skills/` または `agents/` を除く無視ファイルは足さない |
| `install` のコピー元 | `defaultSkillsSourceDir` と `defaultAgentsSourceDir` のまま。公開物として展開されたときは、その公開物の `skills/` と `agents/` を指す |
| 設計 1 | `docs/issues/1/design.md` は変えない。`package.json` の `private` と `publishConfig` は、この設計に従う |

## パッケージ

`package.json` のキーと値は、次と一致する。キーの順は問わない。これ以外のキーは置かない。`dependencies` と `devDependencies` は置かない。

```json
{
  "name": "@paterapatera/sdd-cur",
  "version": "0.0.0",
  "private": false,
  "type": "module",
  "bin": {
    "sdd-cur": "src/cli.ts"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "sdd-cur": "bun src/cli.ts",
    "test": "bun test"
  }
}
```

`bun pm pack` が作る tarball の根は `package/` である。リポジトリの `skills/` にある各ファイルは、`package/skills/` の同じ相対パスに、同じ内容で入る。`agents/` も同様に `package/agents/` へ入る。`package/src/cli.ts` と、それが import する `src` の TypeScript も入る。

`bunx @paterapatera/sdd-cur` は、この公開物の `bin.sdd-cur` を Bun で起動する。うしろの引数は、今の CLI へそのまま渡る。起動するサブコマンドは、次の九つである。使い方の九行は、この九行である。各行の末尾は改行である。

```
sdd-cur install [project-root]
sdd-cur run [--interval-min <1 以上 1440 以下の整数>]
sdd-cur labels
sdd-cur candidates
sdd-cur show <番号>
sdd-cur branch <番号>
sdd-cur confirm <番号>
sdd-cur reflect <番号> <requirements|design>
sdd-cur complete <番号>
```

開発時は、リポジトリで `bun src/cli.ts` に同じ引数を渡す。入口のファイルと shebang は残す。

## install

コピー元は `src/install.ts` の `defaultSkillsSourceDir` と `defaultAgentsSourceDir` のままである。どちらも `import.meta.dir` から見た `../skills` と `../agents` である。

リポジトリで `bun src/cli.ts install` を実行したときは、リポジトリの `skills/` と `agents/` をコピーする。公開物の `src/cli.ts` を実行したときは、その公開物の `skills/` と `agents/` をコピーする。相対位置が同じなので、解決の式は分けない。

コピーするスキルは、`skills/` 直下のディレクトリである。コピーするサブエージェントは、次の九つのファイルのままである。宛先の規則は変えない。

```
sdd-cur-req-author.md
sdd-cur-req-reviewer.md
sdd-cur-req-fixer.md
sdd-cur-design-author.md
sdd-cur-design-reviewer.md
sdd-cur-design-fixer.md
sdd-cur-implement-author.md
sdd-cur-implement-reviewer.md
sdd-cur-implement-fixer.md
```

## テスト

`src/package.test.ts` に置き、`bun:test` の `describe` と `test` を使う。`gh` は起動しない。ホームディレクトリは使わない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。テストは npm レジストリへ公開しない。

`bunx @paterapatera/sdd-cur` が起動するのは、公開物の `bin` である。テストは、`bun pm pack` の tarball を別の一時ディレクトリへ `bun add` し、その `node_modules/.bin/sdd-cur` を起動する。この一時ディレクトリは、リポジトリのクローンではない。子プロセスの `PATH` は、`bun` のあるディレクトリだけにする。

- `package.json` は、上のオブジェクトと一致する。
- `src/cli.ts` の先頭行は `#!/usr/bin/env bun` である。
- `bun pm pack --destination <temp>` の tarball に、リポジトリの `skills/` と `agents/` の各ファイルが、`package/skills/` と `package/agents/` の同じ相対パスで含まれ、内容が一致する。`package/src/cli.ts` が含まれる。
- インストールした bin の `--help` は終了コード 0 であり、標準エラーは使い方の九行である。
- 同じ bin の `run --interval-min 0` は終了コード 1 であり、標準エラーは `--interval-min は 1 以上 1440 以下の整数です` の行のあとに、使い方の九行である。
- 同じ bin の `labels` と `candidates` は、引数なしで終了コード 1 であり、標準エラーは `gh を実行できません` の一行である。
- 同じ bin の `show 01`、`confirm 01`、`complete 01` は終了コード 1 であり、標準エラーは `番号が不正です` の一行である。
- 同じ bin の `reflect 1 foo` は終了コード 1 であり、標準エラーは `種別が不正です` の一行である。
- 同じ bin の `branch 75` は終了コード 0 であり、標準出力は `task-75\n`、標準エラーは空である。
- インストールしたパッケージの `skills/sdd-cur/` に、リポジトリのそのディレクトリには無いファイルを一つ書く。中身は空でない。インストールしたパッケージの `agents/sdd-cur-req-author.md` を、リポジトリの同名ファイルと違う内容に置き換える。そのあと、同じ bin の `install <dest>` を、別の一時ディレクトリ `<dest>` に対して実行する。終了コードは 0 である。`<dest>/.cursor/skills/sdd-cur/` に、足したファイルが同じ内容である。`<dest>/.cursor/agents/` の九つのファイルは、置き換え後のインストール先パッケージの `agents/` の同名ファイルと一致する。`sdd-cur-req-author.md` は、リポジトリのファイルとは一致しない。
- リポジトリで `bun src/cli.ts --help` は終了コード 0 であり、標準エラーは使い方の九行である。

## 作業の一覧

1. `package.json` を、上のオブジェクトにする。
2. `src/package.test.ts` を書き、`bun test` を通す。
3. `src/cli.ts`、`src/install.ts`、`skills/`、`agents/`、`docs/issues/1/design.md`、README、AGENTS.md は変えない。
4. `bun publish` は実行しない。npm レジストリへは送らない。
