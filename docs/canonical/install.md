# install

## REQ-11

もとになった課題は #1 である。

`bun src/cli.ts install` と `bun src/cli.ts run` でそれぞれの処理が起動する。

## REQ-12

もとになった課題は #1 である。

`run` は SIGINT または SIGTERM までループする。処理のあいだは次の `poll` を呼ばない。処理が終わったら、再び `poll` する。

## REQ-13

もとになった課題は #1 である。

実行はTypeScript を Bun が直接実行する。依存パッケージは置かない。

## REQ-14

もとになった課題は #1 である。

開発時の起動は`bun src/cli.ts <subcommand>`。`package.json` の script 名は `install` にしない。

## REQ-15

もとになった課題は #1 である。

`install` の引数は省略時は `~/.cursor/skills`。あるときはプロジェクトのルートを一つ受け、`<root>/.cursor/skills` に置くである。

## REQ-16

もとになった課題は #1 である。

スキルが無いときは`skills/` が空でも `install` は成功する。宛先ディレクトリは作る。

## REQ-17

もとになった課題は #1 である。

間隔は既定は 1 分。`--interval-min` で 1 以上 1440 以下の整数分に変える。範囲外や整数でない値は終了コード 1 とする。待機は終了シグナルで中断する。

## REQ-18

もとになった課題は #1 である。

終了はSIGINT と SIGTERM。処理中ならその `process` が終わってから抜け、次の `poll` はしない。終了コードは 0である。

## REQ-19

もとになった課題は #75 である。

パッケージとして公開する収録物は、リポジトリにある `skills/` を含む。

## REQ-20

もとになった課題は #75 である。

`agents/` は、公開するパッケージへ入れるディレクトリである。

## REQ-21

もとになった課題は #75 である。

公開済みのパッケージで `install` が写すのは、そのパッケージに入っている `skills/` である。

## REQ-22

もとになった課題は #75 である。

公開済みパッケージ側の `agents/` を、`install` がコピー先へ写す。

## REQ-23

もとになった課題は #75 である。

開発時に `bun src/cli.ts` を実行すると、今の CLI が起動する。

## REQ-24

もとになった課題は #75 である。

レジストリへの送信は実装の作業に含めない。実装は公開できる形（`package.json` の変更と pack のテスト）までである。`bun publish` は人が別途行う。

## REQ-25

もとになった課題は #75 である。

`private`は`false`。`true` のときは `bun publish` が失敗する。

## REQ-26

もとになった課題は #75 である。

`bin`は`bin.sdd-cur` は `src/cli.ts` のまま。先頭行は `#!/usr/bin/env bun` のままである。

## REQ-27

もとになった課題は #75 である。

開発時の起動は`bun src/cli.ts`。`scripts.sdd-cur` は `bun src/cli.ts`。`scripts.test` は `bun test`。script 名 `install` は置かない。

## REQ-28

もとになった課題は #75 である。

公開物の位置はリポジトリと同じ相対位置で `src/`、`skills/`、`agents/` を含める。`files` は足さない。`skills/` または `agents/` を除く無視ファイルは足さない。

## REQ-29

もとになった課題は #75 である。

`install` のコピー元は`defaultSkillsSourceDir` と `defaultAgentsSourceDir` のまま。公開物として展開されたときは、その公開物の `skills/` と `agents/` を指すである。

## REQ-808

もとになった課題は #116 である。

このリポジトリで `bun link` を実行したあと、`sdd-cur` は手元の `src/cli.ts` を実行する。`bin.sdd-cur` は `src/cli.ts` のままである。`src/cli.ts` の先頭行は `#!/usr/bin/env bun` のままである。開発時の `bun src/cli.ts` は残す。

## REQ-809

もとになった課題は #116 である。

`install` は、スキルをコピーする。スキル本文を書き換えない。コピーした版をスキルの横に記録しない。実行中の `sdd-cur` の版が違っても、スキルは知らせない。版の記録と、版が違うときの通知は、採用しない。

## REQ-858

もとになった課題は #117 である。

`install` は、スキルのディレクトリを、今どおり中身ごとコピーする。`skills/sdd-cur/conventions.md` は、導入先の `sdd-cur/conventions.md` になる。書き方の節は、コピーしたファイルに無い。`sdd-cur conventions` サブコマンドは、足さない。

## REQ-885

もとになった課題は #118 である。

`install` を実行しても、`docs/policy.md` を作らない。

## REQ-923

もとになった課題は #161 である。

`install` は、公開済みパッケージ側の `agents/` をコピー先へ写したあと、オプションの `--high-model`、`--medium-model`、`--low-model` で指定した種別のモデルを、コピー先のフロントマターの `model:` 行にだけ反映できる。フラグ名は `--high-model`、`--medium-model`、`--low-model` である。値は各フラグの直後の別引数であり、引数全体が値である。値は `=` を含んでよい。値は `--` で始まってもよい。フラグと値を `=` で一引数にした形は拒否する。同じ種別のフラグを二回指定したとき、および直後の値が無いとき、直後の値が空文字のとき、値として消費されていない引数のうち三種類のフラグ以外で `--` で始まるものがあるときは、何もコピーせず `モデルの指定が不正です: <指定>` で失敗する。種別フラグの直後の引数は、値として消費したあとは、知らない `--` 引数として扱わない。`--` で始まらない引数はプロジェクトのルートであり、一つまでである。プロジェクトのルートは、種別フラグより前でも後でもよい。

high 種別は `sdd-cur-req-author`、`sdd-cur-design-author`、`sdd-cur-req-reviewer-high` である。medium 種別は `sdd-cur-req-reviewer`、`sdd-cur-design-reviewer`、`sdd-cur-implement-reviewer` である。low 種別は `sdd-cur-implement-author`、`sdd-cur-req-fixer`、`sdd-cur-design-fixer`、`sdd-cur-implement-fixer`、`sdd-cur-explore` である。割り当ては `install` のコードに固定で持つ。`agents/` の元ファイルは変えない。指定しなかった種別のサブエージェントは、コピー元の `model:` のままである。指定した種別だけ、コピー先の `model:` 行を `model:`、空白一つ、モデル、の形に書き換える。

成功したとき、標準出力には、スキル宛先の絶対パスを一行書く。コピーしたスキルが無いときは続けて `配置するスキルはありません` を一行書く。そのあと、十一個のサブエージェントについて、ファイル名から `.md` を除いた名前、空白一つ、最終的なモデル、を `subagentFileNames` の順で一行ずつ書く。失敗したときは、これらのモデルの行は出さない。

- シナリオ: 条件: 三種類のモデルフラグを別引数で渡して `install` が成功する 主体: `install` 結果: 各種別に属するコピー先の `model:` が指定したモデルになり、標準出力に十一行の最終モデルが出る
- シナリオ: 条件: 種別フラグを一つだけ渡して `install` が成功する 主体: `install` 結果: その種別のコピー先だけ `model:` が変わり、ほかはコピー元のままである
- シナリオ: 条件: 種別フラグの指定が不正である 主体: `install` 結果: 何もコピーせず `モデルの指定が不正です: <指定>` で失敗する
