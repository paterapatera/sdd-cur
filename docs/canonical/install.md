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

`install` は、スキルのディレクトリを、今どおり中身ごとコピーする。`skills/sdd-cur/conventions.md` は、導入先の `sdd-cur/conventions.md` になる。`skills/sdd-cur/` には、入口の `SKILL.md` と、着手・調べる・要件・設計・確認・回答・合格後の `start.md`、`explore.md`、`requirements.md`、`design.md`、`confirm.md`、`reflect.md`、`after-pass.md` がある。書き方の節は、コピーしたファイルに無い。`sdd-cur conventions` サブコマンドは、足さない。

- シナリオ: 条件: `install` でスキルをコピーした 主体: 導入先 結果: `conventions.md` と七つの段ファイルが `sdd-cur/` にある

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

## REQ-936

もとになった課題は #165 である。

第1引数が `setup` のとき、`src/cli.ts` は `install`、`init`、`labels` をこの順に実行する。最初に終了コードが 0 でない段で止め、それより後のコマンドは実行しない。三つが終了コード 0 のあと、`doctor` と同じ確認を行い、その標準出力、標準エラー、終了コードを出す。
- シナリオ: 条件: `setup` が三つの段を順に実行する 主体: `setup` 結果: 最初の非 0 で止まり、三つが 0 のときだけ `doctor` と同じ確認が続く

## REQ-937

もとになった課題は #165 である。

`setup` は `parseInstallArgs` で引数を読む。`--high-model`、`--medium-model`、`--low-model` は `install` と同じ規則である。成功したとき、受けたフラグと値は同じ並びで `install` へ渡す。`--model` は受けない。三つのモデルフラグ以外で `--` で始まる引数は、`install` と同じ規則で失敗する。
- シナリオ: 条件: `setup` に `--high-model` と値を付ける 主体: `setup` 結果: 同じ引数列で `install` が実行される
- シナリオ: 条件: `setup` に `--model` がある 主体: `setup` 結果: `install` も実行せず、`install` と同じ失敗になる

## REQ-938

もとになった課題は #165 である。

`setup` でプロジェクトのルートが解析されないとき、`install` と `init` には `path.resolve(process.cwd())` の絶対パスをルート引数として渡す。`labels` と `doctor` の確認の作業ディレクトリはその絶対パスである。プロジェクトのルートが一つあるとき、`install` には解析の文字列をそのまま渡し、`init` には `assertDirectoryExists` のあと `path.resolve` した絶対パスを渡す。`labels` と `doctor` の確認の作業ディレクトリは、`init` と同じ絶対パスである。
- シナリオ: 条件: ルートを省いてプロジェクトのルートで `setup` を実行する 主体: `setup` 結果: 三つの段と `doctor` の確認がそのルートを向く

## REQ-939

もとになった課題は #165 である。

使い方を標準エラーへ出すとき、行全体が `sdd-cur setup [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]` である行が一つある。使い方に `--model` は無い。
- シナリオ: 条件: `sdd-cur --help` を実行する 主体: `sdd-cur` 結果: 上の `setup` 行が使い方に含まれる

## REQ-942

もとになった課題は #165 である。

`setup` を足しても、`install`、`init`、`labels`、`doctor` を単体で実行したときの引数、入出力、終了コードは変えない。`doctor` はファイルもラベルも変えない。
- シナリオ: 条件: `labels` を単体で実行する 主体: `labels` 結果: 挙動は `setup` 追加前と同じである

## REQ-943

もとになった課題は #168 である。

`install` は、`skills/sdd-cur/` を中身ごとコピーする。導入先の `sdd-cur/` に、`start.md`、`explore.md`、`requirements.md`、`design.md`、`confirm.md`、`reflect.md`、`after-pass.md` があり、それぞれパッケージの同じパスのファイルと内容が一致する。入口の `SKILL.md` も同じ内容である。

- シナリオ: 条件: プロジェクトで `install` を実行した 主体: 導入先の `sdd-cur/` 結果: 七つの段ファイルと `SKILL.md` がパッケージと一致する
