# 165 他のプロジェクト向けに setup と導入手順を用意する

<!-- sdd-cur:form -->

対象は [Issue #165](https://github.com/paterapatera/sdd-cur/issues/165)。サブコマンド `setup` を足し、`install`、`init`、`labels` をこの順に実行する。最初に終了コードが 0 でない段で止め、それより後は実行しない。三つが終了コード 0 のあと、`doctor` と同じ確認を行い、その標準出力、標準エラー、終了コードを出す。README の先頭に、他のプロジェクト向けの導入手順を置く。

オーケストレーションは `src/setup.ts` の `runSetup` に置く。`src/cli.ts` の `setup` はそれを呼ぶ。`install`、`init`、`labels`、`doctor` を単体で実行したときの挙動は変えない。

重なる課題は #164（`doctor`）、#161（`install` のモデル指定）、#118（`init` と README の導入の順）である。

## 受け入れ条件

- 1. 条件: 第1引数が `setup` であり、引数の解析が成功する 主体: `setup` 結果: `install`、`init`、`labels` をこの順に実行する。最初に終了コードが 0 でない段で止め、それより後のコマンドと `doctor` の確認は実行しない
- 2. 条件: `install`、`init`、`labels` のいずれかが終了コード 0 以外で終わる 主体: `setup` 結果: 後続と `doctor` の確認は実行しない。それより前に成功したコマンドの結果は戻さない。`setup` の終了コードは、失敗した段の終了コードである
- 3. 条件: `setup` が `install`、`init`、`labels` のいずれかを実行する 主体: `setup` 結果: その段を、単体実行と同じ引数、同じ作業ディレクトリで呼び、単体実行と同じファイル、同じラベル、同じ標準出力、同じ標準エラー、同じ終了コードになる
- 4. 条件: `install`、`init`、`labels` がいずれも終了コード 0 で終わる 主体: `setup` 結果: そのあと `runDoctor` を、プロジェクトのルートを `cwd` に渡して呼ぶ。`doctor` 単体が同じ `cwd` で出す標準出力の行と標準エラーの行を、それぞれ同じ順で出す。終了コードは `runDoctor` の戻り値と同じである。八つの検査の一つ以上が `NG` なら 1、八つが `OK` なら 0 である。警告だけでは 1 にしない
- 5. 条件: `install` を単体で実行する 主体: `install` 結果: 引数、コピー先、終了コード、標準出力、標準エラーは、この課題の前と同じである
- 6. 条件: `init` を単体で実行する 主体: `init` 結果: 引数、作るファイル、終了コード、標準出力、標準エラーは、この課題の前と同じである
- 7. 条件: `labels` を単体で実行する 主体: `labels` 結果: 引数、ラベルの作成、終了コード、標準出力、標準エラーは、この課題の前と同じである
- 8. 条件: `doctor` を単体で実行する 主体: `doctor` 結果: 引数、終了コード、標準出力、標準エラー、ファイルを書かないこと、ファイルを消さないこと、ラベルを変えないことは、この課題の前と同じである
- 9. 条件: README の `##` 見出しの順を見る 主体: README 結果: 最初の `##` 見出しは `他のプロジェクトで使う` である。`前提`、`開発中の起動`、`公開後の起動`、`役割`、`ラベル`、`ディレクトリ` は、この順のまま、その節より後ろにある
- 10. 条件: README の節「他のプロジェクトで使う」を読む 主体: README 結果: 手順は次の順である。一つ目は `bun add -g @paterapatera/sdd-cur` である。二つ目は、プロジェクトのルートで `sdd-cur setup` を実行する、である。三つ目は、Cursor で `sdd-cur-policy` を起動し、`docs/policy.md` の下書きを作る、である。四つ目は、`sdd-cur-create-issue` で課題を作り、`sdd-cur` で要件と設計を進める、である。五つ目は、ランナー用に別のディレクトリへクローンし、そこで `sdd-cur run` を動かす、である。六つ目は、課題の担当者を、ランナーの `gh` のログインにする、である
- 11. 条件: README を読む 主体: README 結果: 『導入の順は `install`、`init`、`labels` である。』と一文字も同じ文があり、『`sdd-cur doctor` は導入の前提を一つずつ確かめるコマンドである。』と一文字も同じ文がある
- 12. 条件: README の「開発中の起動」の節を見る 主体: README 結果: その節にサブコマンド名 `init` は無い
- 13. 条件: README の課題ランナーの説明を見る 主体: README 結果: `課題ランナーは Project A の作業ディレクトリでは動かさない。` と一文字も同じ文がある
- 14. 条件: `docs/policy.md` の構成の表の `src/cli.ts` の行を見る 主体: 表 結果: バッククォートで囲んだサブコマンド名に `setup` がある。その行のバッククォートで囲んだサブコマンド名の集合は、`src/cli.ts` の `switch` の `case` の名前の集合と一致する
- 15. 条件: `AGENTS.md` の「コマンド」のコードフェンスを見る 主体: `AGENTS.md` 結果: `bun src/cli.ts setup` で始まる行がある。その行に `--model`、`--high-model`、`--medium-model`、`--low-model` は無い。そのフェンスの `bun src/cli.ts` の行から取れるサブコマンド名の集合は、`src/cli.ts` の `switch` の `case` の名前の集合と一致する
- 16. 条件: 第1引数が `setup` であり、引数に `--help` または `-h` がある 主体: `sdd-cur` 結果: `install` も `init` も `labels` も `doctor` の確認も実行せず、使い方を標準エラーへ書き、終了コードは 0 である
- 17. 条件: `setup` を確かめるテストを書く 主体: テスト 結果: ファイルは `src/165.test.ts` だけである。既存の `src/*.test.ts` に新しい `test` を足さない。`GhRunner` を注入し、`gh` のプロセスを起動せず、ホームディレクトリを触らず、一時ディレクトリを使い、終わったら消す
- 18. 条件: 使い方を標準エラーへ出す 主体: `sdd-cur` 結果: 行全体が `sdd-cur setup [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]` である行が一つある。使い方に `--model` は無い
- 19. 条件: 第1引数が `setup` であり、`--high-model`、`--medium-model`、`--low-model` を `install` と同じ規則で付ける 主体: `setup` 結果: `parseInstallArgs` で読み、成功したとき `install` へ渡す引数列は、同じフラグと同じプロジェクトのルートの並びである
- 20. 条件: 第1引数が `setup` であり、引数に `--model` がある 主体: `setup` 結果: `parseInstallArgs` が失敗し、`install` も `init` も `labels` も実行しない。標準エラーと終了コードは、`install` が同じ引数で失敗したときと同じである
- 21. 条件: 第1引数が `setup` であり、プロジェクトのルートが無い 主体: `setup` 結果: `install` と `init` へ渡す引数のうちルートは `process.cwd()` を `path.resolve` した絶対パスである。`labels` と `runDoctor` の `cwd` はその絶対パスである
- 22. 条件: 第1引数が `setup` であり、プロジェクトのルートが一つある 主体: `setup` 結果: `install` と `init` へ渡すルートは、解析で得た文字列をそのまま用い、`assertDirectoryExists` 後に `init` では `path.resolve` した絶対パスをルートとする。`labels` と `runDoctor` の `cwd` は、その `init` と同じ絶対パスである
- 23. 条件: `setup` の引数解析が失敗する 主体: `setup` 結果: `install` も `init` も `labels` も実行しない。標準エラーと終了コードは、失敗の種類に応じて `install` が同じ引数で失敗したときと同じである
- 24. 条件: `setup` の引数解析が成功し、渡したプロジェクトのルートの確認が失敗する 主体: `setup` 結果: `install` も `init` も `labels` も実行しない。標準エラーと終了コードは、`install` が同じルートで失敗したときと同じである
- 25. 条件: `runSetup` を export する 主体: `src/setup.ts` 結果: `cmdSetup` がそれを呼び、テストが段ごとの実装を注入できる
- 26. 条件: 設計の「正本への差分」を実装する 主体: 正本 結果: `docs/canonical/install.md`、`docs/canonical/init.md`、`docs/canonical/docs.md` を差分どおり更新する

## 範囲外

次は作らない。

- `install`、`init`、`labels`、`doctor` を単体で実行したときの挙動を変えること
- 課題ランナーを Project A の作業ディレクトリで動かすこと
- `setup` が課題を作ること
- `setup` が課題を閉じること
- `doctor` の確認がファイルを書くこと、ファイルを消すこと、ラベルを変えること
- 比べる相手の導入コマンドから、この課題の具体案に無い選択肢を持ち込むこと
- `docs/canonical/` に新しい領域のファイルを足すこと
- コピーするスキルとサブエージェントの一覧を変えること

## 関係する課題

- #164（`doctor`。三つ成功後の確認）
- #161（`install` のモデル指定。`setup` は同じ規則で `install` へ渡す）
- #118（`init` と README の導入の順）

## 決定

| 項目 | 内容 |
|---|---|
| サブコマンド名 | `setup` |
| 置き場所 | オーケストレーションは `src/setup.ts` の `runSetup`。`src/cli.ts` は `cmdSetup` でそれを呼ぶ |
| 引数の解析 | `src/install.ts` の `parseInstallArgs` をそのまま使う。`--model` は受けない |
| プロジェクトのルート | 解析でルートが無いとき、`install` と `init` へ渡すルート引数は `path.resolve(process.cwd())` である。ルートがあるときは、解析の文字列を `install` へ渡し、`assertDirectoryExists` のあと `init` のルートは `path.resolve` した絶対パスである |
| `install` へ渡す引数 | ルート文字列と、指定された `--high-model`、`--medium-model`、`--low-model` とその値を、ユーザーが `setup` に渡した順序どおり再構成する。ルートが解析で無かったときは、先頭に解決済みの絶対パスを置き、続けてフラグと値を並べる |
| `init` へ渡す引数 | ルート一つのみ。`install` と同じ解決済み絶対パスを一引数で渡す |
| `labels` の作業ディレクトリ | `init` と同じ絶対パスを `cwd` とする。`process.cwd()` は変えない |
| `doctor` の確認 | 三つが終了コード 0 のあと、`runDoctor` に `cwd` を上と同じ絶対パスで渡す |
| 実行順 | `install` → `init` → `labels` →（三つ成功時のみ）`runDoctor` |
| 失敗時 | 失敗した段の終了コードを `setup` の終了コードにする。後続は実行しない。成功済みのファイルとラベルは戻さない |
| 終了コード | 三つが終了コード 0 のあと、`setup` の終了コードは `runDoctor` の戻り値と同じである。八つの検査の一つ以上が `NG` なら 1、八つが `OK` なら 0 である。警告だけでは 1 にしない。三つが成功したときに終了コードを 0 のままにし、`doctor` の `NG` では 1 にしないことは採用しない |
| ヘルプ | `setup` は `spec-check` と `doctor` の引数例外には入れない。`--help` または `-h` があるときは、既存の `wantsHelp` が使い方を出して終了コード 0 で戻る |
| `switch` | `init` の次、`doctor` の前に `setup` を足す |
| 使い方の行 | `printUsage` に、行全体が `sdd-cur setup [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]` である行を一つ足す。`sdd-cur init [project-root]` の次に置く |
| 単体コマンド | `cmdInstall`、`cmdInit`、`cmdLabels`、`cmdDoctor` の外から見える挙動は変えない。`labels` と `doctor` の `cwd` 指定は、`runSetup` と共通の内部関数に切り出してもよい |
| テスト | 新しい `test` は `src/165.test.ts` だけに足す |

## 引数と失敗

`cmdSetup` は、サブコマンド名のうしろの引数配列を `parseInstallArgs` に渡す。

解析が失敗したときは、`install` も `init` も `labels` も呼ばない。標準エラーは `parsed.message` を一行で書く。`message` が `モデルの指定が不正です:` で始まらないときだけ `printUsage` を続けて出す。終了コードは 1 である。

解析が成功し、ルートが解析結果にあるときは、`assertDirectoryExists` をルート文字列へ呼ぶ。失敗したときは、`install` も `init` も `labels` も呼ばない。標準エラーと終了コードは `cmdInstall` が同じルートで失敗したときと同じである。

解析が成功したあと、解決済みの絶対パスを `root` とする。`install` 用の引数列を「決定」のとおり組み立て、`init` 用は `[root]` である。

## `runSetup`

```ts
export type SetupStepRunner = (args: string[], cwd: string) => Promise<number>

export type RunSetupOptions = {
  args: string[]
  homedir: string
  skillsSourceDir: string
  agentsSourceDir: string
  gh: GhRunner
  commandExists: CommandExists
  runInstall: SetupStepRunner
  runInit: SetupStepRunner
  runLabels: (cwd: string) => Promise<number>
  runDoctor: (cwd: string) => Promise<number>
}

export async function runSetup(options: RunSetupOptions): Promise<number>
```

`runSetup` は `parseInstallArgs(options.args)` から始める。失敗とルート確認は「引数と失敗」のとおりである。

`options.runInstall(installArgs, process.cwd())` の終了コードが 0 でなければ、それを返す。`options.runInit([root], process.cwd())` も同様。`options.runLabels(root)` も同様。

三つが 0 のとき、`return await options.runDoctor(root)` である。

`cmdSetup` は、`runInstall` に `cmdInstall` と同じ処理、`runInit` に `cmdInit` と同じ処理を渡す。`runLabels` は、指定 `cwd` で `resolveRepo` と `ensureWorkflowLabels` を行う処理であり、単体の `labels` がその `cwd` で動いたときと同じ入出力と終了コードになる。`runDoctor` は `runDoctor` を同じオプションで呼ぶ。

本番の `cmdSetup` は `process.cwd()` を `runSetup` の各段の作業ディレクトリとして渡す。`labels` と `doctor` だけ、引数の `cwd` が `root` である。

## CLI

`src/cli.ts` に `cmdSetup` を足す。`case "setup"` は `init` の次、`doctor` の前に置く。`return await cmdSetup(rest)` とする。

`printUsage` の `sdd-cur init [project-root]` の次に、使い方の `setup` 行を足す。

## 文書

README の先頭に `## 他のプロジェクトで使う` を置き、受け入れ条件 10 の六手順を書く。既存の `## 前提` 以降の節は、今の順序と本文の役割を保ち、その新しい節の後ろへ移す。受け入れ条件 11 の二文は、今 README にある位置（「公開後の起動」付近）に残すか、同じ字面で読める場所に置く。受け入れ条件 12 と 13 を満たす。

`docs/policy.md` の構成の表の `src/cli.ts` の行は、サブコマンド列挙に `` `setup` `` を足した行にする。`switch` の `case` 集合と一致させる。

`AGENTS.md` の「コマンド」のコードフェンスは、`bun src/cli.ts init [project-root]` の次に `bun src/cli.ts setup` の行を足す。モデル指定のフラグは書かない。

## テスト

`bun test` で実行する。新しい `test` は `src/165.test.ts` だけに足す。`GhRunner` と段 runner を注入し、`gh` のプロセスは起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。一時ディレクトリをプロジェクトのルートにし、終わったら消す。

- 注入した runner の呼び出し順が `install`、`init`、`labels` で、いずれかが非 0 のとき後続と `runDoctor` が呼ばれない。[1][2]
- 三つが 0 のときだけ `runDoctor` が呼ばれ、戻り値が `setup` の終了コードになる。[4]
- ルート無し／ルートありのとき、各段へ渡す引数と `labels` および `runDoctor` の `cwd` が「決定」と一致する。モデルフラグは `install` へ同じ並びで渡る。[3][19][21][22]
- 既存の `src/*.test.ts` は `install`、`init`、`labels`、`doctor` の単体挙動を変えない。新しい `test` は `src/165.test.ts` だけに足す。[5][6][7][8][17]
- `--model` と不正なモデルフラグで解析失敗し、段は一つも呼ばれない。[20][23]
- 存在しないルートで `assertDirectoryExists` 失敗し、段は呼ばれない。[24]
- `sdd-cur setup --help` で使い方のみ、終了コード 0。[16]
- `printUsage` に `setup` 行が一つあり `--model` が無い。[18]
- `runSetup` が export され `cmdSetup` が接続されている。[25]
- README、`docs/policy.md`、`AGENTS.md` が「文書」のとおりである。[9][10][11][12][13][14][15]
- 実装時に正本三ファイルを「正本への差分」どおり更新する。[26]

## 一度に実装できる大きさ

一つの作業が一度に実装できる大きさであるとは、次のとおりである。

- `[<番号>]` を一つ以上持つ作業では、その番号の受け入れ条件に直結する実装を、他の受け入れ条件に直結する実装を含めず、実装作成役の一回の起動で書き終えられる
- `[<番号>]` が無い作業では、その作業の行に書かれた実装を、一回の起動で書き終えられる

作業の一覧の各作業は、分割後に上を満たす。

## 変えるファイル

- src/setup.ts
- src/cli.ts
- src/165.test.ts
- README.md
- docs/policy.md
- AGENTS.md
- docs/canonical/install.md
- docs/canonical/init.md
- docs/canonical/docs.md

## 作業の一覧

- 1. `src/setup.ts` に `runSetup` と `SetupStepRunner` を実装し、引数解析・ルート解決・三段の順実行と失敗時の打ち切りを書く。[1][2][21][22][23][24][25]
- 2. `src/cli.ts` に `cmdSetup` と `case "setup"` を足し、`runInstall`／`runInit`／`runLabels`／`runDoctor` を単体と同じ処理で渡す。三つ成功後に `runDoctor` を呼ぶ。[3][4]
- 9. `cmdInstall`、`cmdInit`、`cmdLabels`、`cmdDoctor` の外から見える挙動を変えない。`labels` と `doctor` の `cwd` 指定を共通化する場合も、単体実行の入出力と終了コードは変えない。[5][6][7][8]
- 3. `printUsage` に `setup` 行を足す。[18][19][20]
- 4. README、`docs/policy.md`、`AGENTS.md` を「文書」のとおり更新する。[9][10][11][12][13][14][15][16]
- 5. `src/165.test.ts` に、注入 runner による順序・打ち切り・`runDoctor` の呼び出しを確かめる test を書く。[1][2][4][17]
- 6. `src/165.test.ts` に、ルート無し／ルートありとモデルフラグの引数が「決定」と一致することを確かめる test を書く。[3][19][21][22]
- 7. `src/165.test.ts` に、解析失敗・存在しないルート・`--help`・`printUsage` の `setup` 行・`runSetup` の export を確かめる test を書く。[16][18][20][23][24][25]
- 8. `docs/canonical/install.md`、`docs/canonical/init.md`、`docs/canonical/docs.md` を「正本への差分」どおり更新する。[26]

## 正本への差分

### 追加 install REQ-936

もとになった課題は #165 である。

第1引数が `setup` のとき、`src/cli.ts` は `install`、`init`、`labels` をこの順に実行する。最初に終了コードが 0 でない段で止め、それより後のコマンドは実行しない。三つが終了コード 0 のあと、`doctor` と同じ確認を行い、その標準出力、標準エラー、終了コードを出す。
- シナリオ: 条件: `setup` が三つの段を順に実行する 主体: `setup` 結果: 最初の非 0 で止まり、三つが 0 のときだけ `doctor` と同じ確認が続く

### 追加 install REQ-937

もとになった課題は #165 である。

`setup` は `parseInstallArgs` で引数を読む。`--high-model`、`--medium-model`、`--low-model` は `install` と同じ規則である。成功したとき、受けたフラグと値は同じ並びで `install` へ渡す。`--model` は受けない。三つのモデルフラグ以外で `--` で始まる引数は、`install` と同じ規則で失敗する。
- シナリオ: 条件: `setup` に `--high-model` と値を付ける 主体: `setup` 結果: 同じ引数列で `install` が実行される
- シナリオ: 条件: `setup` に `--model` がある 主体: `setup` 結果: `install` も実行せず、`install` と同じ失敗になる

### 追加 install REQ-938

もとになった課題は #165 である。

`setup` でプロジェクトのルートが解析されないとき、`install` と `init` には `path.resolve(process.cwd())` の絶対パスをルート引数として渡す。`labels` と `doctor` の確認の作業ディレクトリはその絶対パスである。プロジェクトのルートが一つあるとき、`install` には解析の文字列をそのまま渡し、`init` には `assertDirectoryExists` のあと `path.resolve` した絶対パスを渡す。`labels` と `doctor` の確認の作業ディレクトリは、`init` と同じ絶対パスである。
- シナリオ: 条件: ルートを省いてプロジェクトのルートで `setup` を実行する 主体: `setup` 結果: 三つの段と `doctor` の確認がそのルートを向く

### 追加 install REQ-939

もとになった課題は #165 である。

使い方を標準エラーへ出すとき、行全体が `sdd-cur setup [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]` である行が一つある。使い方に `--model` は無い。
- シナリオ: 条件: `sdd-cur --help` を実行する 主体: `sdd-cur` 結果: 上の `setup` 行が使い方に含まれる

### 追加 install REQ-942

もとになった課題は #165 である。

`setup` を足しても、`install`、`init`、`labels`、`doctor` を単体で実行したときの引数、入出力、終了コードは変えない。`doctor` はファイルもラベルも変えない。
- シナリオ: 条件: `labels` を単体で実行する 主体: `labels` 結果: 挙動は `setup` 追加前と同じである

### 追加 init REQ-940

もとになった課題は #165 である。

`setup` が `init` を呼ぶとき、渡す引数はプロジェクトのルート一つである。`setup` でルートを省いたときは、`path.resolve(process.cwd())` の絶対パスを一引数で渡す。ルートを指定したときは、`install` と同じ解決済み絶対パスを一引数で渡す。
- シナリオ: 条件: ルート無しで `setup` が `init` を呼ぶ 主体: `setup` 結果: `init` への引数はカレントディレクトリのルート一つである

### 変更 init REQ-876

もとになった課題は #165 である。

使い方を標準エラーへ出すとき、`sdd-cur install [project-root]` の次の行全体は `sdd-cur init [project-root]` である。その次の行全体は `sdd-cur setup [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]` である。
- シナリオ: 条件: 使い方の `init` 行の直後を見る 主体: `printUsage` 結果: `setup` 行が続く

### 追加 docs REQ-941

もとになった課題は #165 である。

README の最初の `##` 見出しは `他のプロジェクトで使う` である。その節に、次の六手順をこの順で書く。`bun add -g @paterapatera/sdd-cur`、プロジェクトのルートで `sdd-cur setup`、Cursor で `sdd-cur-policy` を起動して `docs/policy.md` の下書きを作る、`sdd-cur-create-issue` で課題を作り `sdd-cur` で要件と設計を進める、ランナー用に別ディレクトリへクローンして `sdd-cur run`、課題の担当者をランナーの `gh` のログインにする。
- シナリオ: 条件: README の先頭の節を読む 主体: README 結果: 六手順がこの順である

### 変更 docs REQ-890

もとになった課題は #165 である。

`docs/policy.md` の構成の表の `src/cli.ts` の行は、バッククォートで囲んだ `doctor` と `setup` を含む。その行のバッククォートで囲んだサブコマンド名の集合は、`src/cli.ts` の `switch` の `case` の名前の集合と一致する。
- シナリオ: 条件: `setup` を `switch` に足した 主体: `docs/policy.md` 結果: 構成表の `src/cli.ts` の行も同じ集合を列挙する

### 変更 docs REQ-891

もとになった課題は #165 である。

`AGENTS.md` の「コマンド」のコードフェンスに、`bun src/cli.ts doctor` の行がある。`bun src/cli.ts setup` で始まる行がある。その行に `--model`、`--high-model`、`--medium-model`、`--low-model` は無い。そのフェンスの `bun src/cli.ts` の行から取れるサブコマンド名の集合は、`src/cli.ts` の `switch` の `case` の名前の集合と一致する。
- シナリオ: 条件: `AGENTS.md` のコマンド例を見る 主体: `AGENTS.md` 結果: `bun src/cli.ts setup` の行がある
