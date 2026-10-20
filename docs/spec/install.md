# install

## REQ-11

もとになった課題は #1 である。

`bun src/cli.ts install` と `bun src/cli.ts run` でそれぞれの処理が起動する。

## REQ-12

もとになった課題は #1 である。

`run` は SIGINT または SIGTERM までループする。処理のあいだは次の `poll` を呼ばない。処理が終わったら、再び `poll` する。

## REQ-13

もとになった課題は #1 である。

実行はTypeScript を Bun が直接実行する。依存パッケージは置かないである。

## REQ-14

もとになった課題は #1 である。

開発時の起動は`bun src/cli.ts <subcommand>`。`package.json` の script 名は `install` にしないである。

## REQ-15

もとになった課題は #1 である。

`install` の引数は省略時は `~/.cursor/skills`。あるときはプロジェクトのルートを一つ受け、`<root>/.cursor/skills` に置くである。

## REQ-16

もとになった課題は #1 である。

スキルが無いときは`skills/` が空でも `install` は成功する。宛先ディレクトリは作るである。

## REQ-17

もとになった課題は #1 である。

間隔は既定は 1 分。`--interval-min` で 1 以上 1440 以下の整数分に変える。範囲外や整数でない値は終了コード 1 とする。待機は終了シグナルで中断するである。

## REQ-18

もとになった課題は #1 である。

終了はSIGINT と SIGTERM。処理中ならその `process` が終わってから抜け、次の `poll` はしない。終了コードは 0である。

## REQ-19

もとになった課題は #75 である。

公開物には、リポジトリの `skills/` が含まれる。

## REQ-20

もとになった課題は #75 である。

公開物には、リポジトリの `agents/` が含まれる。

## REQ-21

もとになった課題は #75 である。

公開したパッケージの `install` は、その公開物の `skills/` をコピーする。

## REQ-22

もとになった課題は #75 である。

公開したパッケージの `install` は、その公開物の `agents/` をコピーする。

## REQ-23

もとになった課題は #75 である。

開発時に `bun src/cli.ts` を実行すると、今の CLI が起動する。

## REQ-24

もとになった課題は #75 である。

レジストリへの送信は実装の作業に含めない。実装は公開できる形（`package.json` の変更と pack のテスト）までである。`bun publish` は人が別途行うである。

## REQ-25

もとになった課題は #75 である。

`private`は`false`。`true` のときは `bun publish` が失敗するである。

## REQ-26

もとになった課題は #75 である。

`bin`は`bin.sdd-cur` は `src/cli.ts` のまま。先頭行は `#!/usr/bin/env bun` のままである。

## REQ-27

もとになった課題は #75 である。

開発時の起動は`bun src/cli.ts`。`scripts.sdd-cur` は `bun src/cli.ts`。`scripts.test` は `bun test`。script 名 `install` は置かないである。

## REQ-28

もとになった課題は #75 である。

公開物の位置はリポジトリと同じ相対位置で `src/`、`skills/`、`agents/` を含める。`files` は足さない。`skills/` または `agents/` を除く無視ファイルは足さないである。

## REQ-29

もとになった課題は #75 である。

`install` のコピー元は`defaultSkillsSourceDir` と `defaultAgentsSourceDir` のまま。公開物として展開されたときは、その公開物の `skills/` と `agents/` を指すである。

## REQ-808

もとになった課題は #116 である。

このリポジトリで `bun link` を実行したあと、`sdd-cur` は手元の `src/cli.ts` を実行する。`bin.sdd-cur` は `src/cli.ts` のままである。`src/cli.ts` の先頭行は `#!/usr/bin/env bun` のままである。開発時の `bun src/cli.ts` は残す。

## REQ-809

もとになった課題は #116 である。

`install` は、スキルをコピーする。スキル本文を書き換えない。コピーした版をスキルの横に記録しない。実行中の `sdd-cur` の版が違っても、スキルは知らせない。版の記録と、版が違うときの通知は、採用しない。
