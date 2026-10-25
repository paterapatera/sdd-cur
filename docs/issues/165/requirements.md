# 165 他のプロジェクト向けに setup と導入手順を用意する

<!-- sdd-cur:form -->

対象は [Issue #165](https://github.com/paterapatera/sdd-cur/issues/165)。他のプロジェクトへ入れる人に向けた通しの手順が無く、導入は `install`、`init`、`labels` をこの順に自分で実行する。`setup` を足し、この三つをこの順に実行して、最初に終了コードが 0 でないコマンドで止まる。三つが終了コード 0 のあとは、`sdd-cur doctor` と同じ確認を行い、その結果を出す。README の最初の節を「他のプロジェクトで使う」にする。

## 現状

サブコマンド `setup` は無い。未知の第1引数は使い方を標準エラーへ書き（`src/cli.ts` の 1128 行）、終了コードは 1 である（`src/cli.ts` の 1129 行）。使い方の最初の行は `sdd-cur install [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]` である（`src/cli.ts` の 74 行）。`switch` の最初の `case` は `install` である（`src/cli.ts` の 1083 行）。

引数に `--help` または `-h` があり、第1引数が `spec-check` でも `doctor` でもないときは、使い方を標準エラーへ書き、終了コードは 0 である（`src/cli.ts` の 1070 行）。

`install` は、プロジェクトのルートを省くとスキルのコピー先をホームの `.cursor/skills` にする（`src/install.ts` の 94 行）。サブエージェントのコピー先はホームの `.cursor/agents` である（`src/install.ts` の 104 行）。ルートを渡すと、スキルのコピー先はその `.cursor/skills` である（`src/install.ts` の 96 行）。モデル指定のフラグ名は `--high-model`（`src/install.ts` の 40 行）、`--medium-model`（`src/install.ts` の 41 行）、`--low-model`（`src/install.ts` の 42 行）である。これら以外で `--` で始まる引数は失敗する（`src/install.ts` の 166 行）。`install` は `docs/policy.md` を作らない（`docs/canonical/install.md` の 139 行）。

`init` は、引数が無いときプロジェクトのルートを未指定にする（`src/init.ts` の 36 行）。未指定のとき、カレントディレクトリをプロジェクトのルートとする（`src/cli.ts` の 432 行）。使い方では、`sdd-cur install [project-root]` の次の行全体は `sdd-cur init [project-root]` である（`docs/canonical/init.md` の 13 行）。

`labels` は、引数が一つでもあると使い方を出して終了コード 1 で終わる（`src/cli.ts` の 514 行）。引数が無いときは、カレントディレクトリのリポジトリでラベルを作る（`src/cli.ts` の 520 行）。カレントディレクトリは `process.cwd()` である（`src/cli.ts` の 371 行）。

`doctor` は引数を受け取らない。引数があるときは `引数は受け取れません` と書き、終了コードは 1 である（`src/cli.ts` の 976 行）。検査の作業ディレクトリはカレントディレクトリである（`src/cli.ts` の 981 行）。スキルとサブエージェントの一致は、そのカレントディレクトリをプロジェクトのルートとしてコピー先を決める（`src/doctor.ts` の 221 行）。正本は、その検査が作業ディレクトリの `.cursor` だけを見て、ホームの `~/.cursor` は見ない、と書く（`docs/canonical/doctor.md` の 51 行）。終了コードは、八つの検査の一つ以上が失敗のとき 1、すべて成功のとき 0 である（`src/doctor.ts` の 314 行）。

README の最初の `##` 見出しは `前提` である（`README.md` の 9 行）。その次の節は `開発中の起動` である（`README.md` の 13 行）。入れ方は `bun add -g @paterapatera/sdd-cur` である（`README.md` の 73 行）。導入の順は `install`、`init`、`labels` である（`README.md` の 82 行）。正本も、README がその順を書く、と定める（`docs/canonical/docs.md` の 219 行）。課題ランナーは Project A の作業ディレクトリでは動かさない（`README.md` の 95 行）。`docs/policy.md` の構成の表の `src/cli.ts` の行に、サブコマンド `setup` は無い（`docs/policy.md` の 21 行）。`AGENTS.md` の「コマンド」の例の最初の行は `bun src/cli.ts install [project-root]` である（`AGENTS.md` の 28 行）。`src/cli.ts` の `switch` の `case` の名前の集合は、方針のその行と一致する（`src/docs.test.ts` の 120 行）。同じ集合は `AGENTS.md` の「コマンド」の例とも一致する（`src/docs.test.ts` の 123 行）。

テストが新しい課題の検査を書く場所は `src/<番号>.test.ts` である（`docs/conventions.md` の 31 行）。`GhRunner` は `gh` の起動を注入する型である（`src/github.ts` の 16 行）。テストはホームディレクトリを触らない（`AGENTS.md` の 22 行）。

## 受け入れ条件

- 1. 条件: 第1引数が `setup` であり、その後ろに引数が無い 主体: `sdd-cur` 結果: `install`、`init`、`labels` をこの順に実行する。終了コードが 0 でないコマンドが最初に出たところで止まり、それより後ろのコマンドは実行しない。`doctor` の確認も実行しない
- 2. 条件: `install`、`init`、`labels` のいずれかが終了コード 0 以外で終わる 主体: `setup` 結果: 後続のコマンドと `doctor` の確認は実行しない。それより前に成功したコマンドの結果は戻さない。`setup` の終了コードは、失敗したコマンドの終了コードである
- 3. 条件: `setup` が `install`、`init`、`labels` のいずれかを実行する 主体: `setup` 結果: そのコマンドを同じ引数と同じ作業ディレクトリで単体実行したときと同じファイル、同じラベル、同じ標準出力、同じ標準エラー、同じ終了コードになる
- 4. 条件: `install`、`init`、`labels` がいずれも終了コード 0 で終わる 主体: `setup` 結果: そのあと `doctor` と同じ確認を行う。`doctor` がその確認で標準出力へ書く行と、標準エラーへ書く行を、それぞれ同じ順で出す。終了コードは `doctor` と同じである。八つの検査の一つ以上が `NG` なら 1、八つが `OK` なら 0 である。警告だけでは 1 にしない
- 5. 条件: `install` を単体で実行する 主体: `install` 結果: 引数、コピー先、終了コード、標準出力、標準エラーは、この課題の前と同じである
- 6. 条件: `init` を単体で実行する 主体: `init` 結果: 引数、作るファイル、終了コード、標準出力、標準エラーは、この課題の前と同じである
- 7. 条件: `labels` を単体で実行する 主体: `labels` 結果: 引数、ラベルの作成、終了コード、標準出力、標準エラーは、この課題の前と同じである
- 8. 条件: `doctor` を単体で実行する 主体: `doctor` 結果: 引数、終了コード、標準出力、標準エラー、ファイルを書かないこと、ファイルを消さないこと、ラベルを変えないことは、この課題の前と同じである
- 9. 条件: README の `##` 見出しの順を見る 主体: README 結果: 最初の `##` 見出しは `他のプロジェクトで使う` である。今ある `前提`、`開発中の起動`、`公開後の起動`、`役割`、`ラベル`、`ディレクトリ` は、この順のまま、その節より後ろにある
- 10. 条件: README の節「他のプロジェクトで使う」を読む 主体: README 結果: 手順は次の順である。一つ目は `bun add -g @paterapatera/sdd-cur` である。二つ目は、プロジェクトのルートで `sdd-cur setup` を実行する、である。三つ目は、Cursor で `sdd-cur-policy` を起動し、`docs/policy.md` の下書きを作る、である。四つ目は、`sdd-cur-create-issue` で課題を作り、`sdd-cur` で要件と設計を進める、である。五つ目は、ランナー用に別のディレクトリへクローンし、そこで `sdd-cur run` を動かす、である。六つ目は、課題の担当者を、ランナーの `gh` のログインにする、である
- 11. 条件: README を読む 主体: README 結果: 『導入の順は `install`、`init`、`labels` である。』と一文字も同じ文があり、『`sdd-cur doctor` は導入の前提を一つずつ確かめるコマンドである。』と一文字も同じ文がある
- 12. 条件: README の「開発中の起動」の節を見る 主体: README 結果: その節にサブコマンド名 `init` は無い
- 13. 条件: README の課題ランナーの説明を見る 主体: README 結果: `課題ランナーは Project A の作業ディレクトリでは動かさない。` と一文字も同じ文がある
- 14. 条件: `docs/policy.md` の構成の表の `src/cli.ts` の行を見る 主体: 表 結果: バッククォートで囲んだサブコマンド名に `setup` がある。その行のバッククォートで囲んだサブコマンド名の集合は、`src/cli.ts` の `switch` の `case` の名前の集合と一致する
- 15. 条件: `AGENTS.md` の「コマンド」のコードフェンスを見る 主体: `AGENTS.md` 結果: `bun src/cli.ts setup` で始まる行がある。その行に `--model`、`--high-model`、`--medium-model`、`--low-model` は無い。そのフェンスの `bun src/cli.ts` の行から取れるサブコマンド名の集合は、`src/cli.ts` の `switch` の `case` の名前の集合と一致する
- 16. 条件: 第1引数が `setup` であり、引数に `--help` または `-h` がある 主体: `sdd-cur` 結果: `install` も `init` も `labels` も `doctor` の確認も実行せず、使い方を標準エラーへ書き、終了コードは 0 である
- 17. 条件: `setup` を確かめるテストを書く 主体: テスト 結果: ファイルは `src/165.test.ts` だけである。既存の `src/*.test.ts` に新しい `test` を足さない。`GhRunner` を注入し、`gh` のプロセスを起動せず、ホームディレクトリを触らず、一時ディレクトリを使い、終わったら消す
- 18. 条件: この要件を正本へ反映する 主体: 設計の「正本への差分」 結果: 追加と変更のファイルは `docs/canonical/install.md`、`docs/canonical/init.md`、`docs/canonical/docs.md` だけである。`setup` が `install`、`init`、`labels` をこの順に実行し、最初に終了コードが 0 でないコマンドで止まり、後続を実行しないこと、三つが終了コード 0 のあと `doctor` と同じ確認の結果を標準出力と標準エラーへ出し、終了コードも `doctor` と同じであること、`--high-model`、`--medium-model`、`--low-model` を `install` と同じ規則で受けて同じ引数のまま `install` へ渡し、`--model` は受けないこと、引数を省いたときはカレントディレクトリを、ルートを指定したときはそのディレクトリを `install` と `init` の引数として渡し、`labels` と `doctor` の確認はそのディレクトリを作業ディレクトリにすること、三つの単体実行の挙動は変えないこと、README の最初の `##` 見出しが `他のプロジェクトで使う` であり手順が受け入れ条件 10 の六つであること、使い方に行全体が `sdd-cur setup [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]` である行があること、をこの要件に合わせる
- 19. 条件: 使い方を標準エラーへ出す 主体: `sdd-cur` 結果: 行全体が `sdd-cur setup [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]` である行が一つある。使い方に `--model` は無い
- 20. 条件: 第1引数が `setup` であり、`--high-model`、`--medium-model`、`--low-model` を `install` と同じ規則で付ける 主体: `setup` 結果: 受けた引数を同じまま `install` へ渡す
- 21. 条件: 第1引数が `setup` であり、引数に `--model` がある 主体: `setup` 結果: `--model` は受けず、`install` へ渡さない。失敗は、`install` が三つのモデル指定以外で `--` で始まる引数を失敗させる規則と同じである
- 22. 条件: 第1引数が `setup` であり、プロジェクトのルートが無い 主体: `setup` 結果: 実行する `install` と `init` には、カレントディレクトリを引数として渡す。実行する `labels` と `doctor` の確認の作業ディレクトリは、カレントディレクトリである
- 23. 条件: 第1引数が `setup` であり、プロジェクトのルートが一つある 主体: `setup` 結果: 実行する `install` と `init` には、そのディレクトリを引数として渡す。実行する `labels` と `doctor` の確認の作業ディレクトリは、そのディレクトリである

## 決定

`setup` は `--high-model`、`--medium-model`、`--low-model` を `install` と同じ規則で受ける。受けた引数は、同じまま `install` へ渡す。この三つのフラグ以外で `--` で始まる引数は、`install` と同じ規則で失敗する。

フラグ `--model` を受けて `install` へ渡すことは、採用しない。

使い方には、行全体が `sdd-cur setup [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]` である行がある。使い方に `--model` は無い。`AGENTS.md` の「コマンド」の `setup` の行は、`install` の行と同じく、モデル指定のフラグを書かない。`--model` も書かない。

引数を省いたときは、カレントディレクトリを `install` と `init` の引数として渡す。プロジェクトのルートを指定したときは、そのディレクトリを `install` と `init` の引数として渡す。`labels` と `doctor` の確認は、そのディレクトリを作業ディレクトリにする。

引数を省いたときに `install`、`init`、`labels` を引数なしで実行し、ルートを指定したときに `labels` と `doctor` の確認をカレントディレクトリのままにすることは、採用しない。

`install`、`init`、`labels` がいずれも終了コード 0 のとき、`setup` の終了コードは `doctor` と同じである。八つの検査の一つ以上が `NG` なら 1、八つが `OK` なら 0 である。警告だけでは 1 にしない。

三つが成功したときに終了コードを 0 のままにし、`doctor` の `NG` では 1 にしないことは、採用しない。

## 範囲外

- `install`、`init`、`labels`、`doctor` を単体で実行したときの挙動を変えること
- 課題ランナーを Project A の作業ディレクトリで動かすこと
- `setup` が課題を作ること
- `setup` が課題を閉じること
- `doctor` の確認がファイルを書くこと、ファイルを消すこと、ラベルを変えること
- 比べる相手の導入コマンドから、この課題の具体案に無い選択肢を持ち込むこと
- `docs/canonical/` に新しい領域のファイルを足すこと
- コピーするスキルとサブエージェントの一覧を変えること

## 関係する課題

- #164（`doctor`。この課題の前提）
- #161（`install` のモデル指定）
- #118（`init` と、README が導入の順を `install`、`init`、`labels` と書くこと）

## 比べる相手

Spec Kit の `specify init`、OpenSpec の `openspec init`、cc-sdd の `npx cc-sdd@latest` は、一つのコマンドで導入が終わる。この課題が足すのは、`install`、`init`、`labels` をこの順に実行する `setup` と、他のプロジェクト向けの導入手順である。
