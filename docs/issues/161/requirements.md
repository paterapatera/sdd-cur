# 161 install でサブエージェントのモデルを指定できるようにする

<!-- sdd-cur:form -->

対象は [Issue #161](https://github.com/paterapatera/sdd-cur/issues/161)。`install` はサブエージェント十一個を、フロントマターの `model:` を含めてコピーする。使えるモデルが違う利用者は、コピー先を手で書き換えるしかなく、次の `install` で上書きされて戻る。モデルの指定は、`--high-model`、`--medium-model`、`--low-model` の三種類である。指定した種別のモデルを、その種別に属する各サブエージェントのコピー先へ反映する。

## 現状

使い方の `install` の行は `sdd-cur install [project-root]` である（`src/cli.ts` の 65 行）。

`parseInstallArgs` は、引数が無いときプロジェクトのルートを未指定にする（`src/install.ts` の 47 行）。引数が二つ以上のときは `install の引数はプロジェクトのルートを一つまでです` で失敗する（`src/install.ts` の 50 行）。空文字も同じメッセージで失敗する（`src/install.ts` の 54 行）。

`cmdInstall` は、解析が失敗するとそのメッセージを標準エラーへ書き、使い方を出して終了コード 1 で終わる（`src/cli.ts` の 260 行）。

引数に `--help` または `-h` があるとき、`wantsHelp` は真になる（`src/cli.ts` の 248 行）。サブコマンドが `spec-check` でなければ使い方を出す（`src/cli.ts` の 859 行）。終了コードは 0 である（`src/cli.ts` の 860 行）。サブコマンドへ渡す残りの引数からは `--help` と `-h` を除く（`src/cli.ts` の 864 行）。プロジェクトのルートがディレクトリでないときは、コピーの前に失敗して終了コード 1 で終わる（`src/cli.ts` の 270 行）。存在しないパスは `ディレクトリが存在しません: <パス>` である（`src/install.ts` の 64 行）。ファイルを渡すと `ディレクトリではありません: <パス>` である（`src/install.ts` の 67 行）。

成功すると、スキルの宛先の絶対パスを標準出力へ書く（`src/cli.ts` の 288 行）。コピーしたスキルが無いときは、続けて `配置するスキルはありません` を標準出力へ書く（`src/cli.ts` の 290 行）。

コピーするサブエージェントは十一個である（`src/install.test.ts` の 24 行）。一覧は `subagentFileNames` である（`src/install.ts` の 7 行）。`installAgents` は、その十一個をコピー先へ `cp` で写し、中身は書き換えない（`src/install.ts` の 129 行）。`installSkills` は、スキルのディレクトリを `cp` で写す（`src/install.ts` の 110 行）。

十一個のどれかが無いとき、`installAll` はコピーの前に失敗し、スキルの宛先もサブエージェントの宛先も作らない（`src/install.test.ts` の 248 行）。その検査はコピーより前である（`src/install.ts` の 141 行）。

引数を省くと、スキルのコピー先はホームの `.cursor/skills`（`src/install.ts` の 26 行）、サブエージェントのコピー先はホームの `.cursor/agents` である（`src/install.ts` の 36 行）。プロジェクトのルートを渡すと、スキルは `<root>/.cursor/skills`（`src/install.ts` の 28 行）、サブエージェントは `<root>/.cursor/agents` である（`src/install.ts` の 38 行）。

README は、十一個をコピーし、引数を省くとホーム、ルートを一つ渡すとプロジェクト配下、と書く（`README.md` の 86 行）。成功時に宛先の絶対パスを標準出力へ書く、とも書く（`README.md` の 84 行）。起動例は `bunx @paterapatera/sdd-cur install [project-root]` である（`README.md` の 76 行）。

正本は、公開済みパッケージの `agents/` をコピー先へ写す、と書く（`docs/canonical/install.md` の 73 行）。

各ファイルの名前と、フロントマターの `model:` は次のとおりである。

- `sdd-cur-req-author` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]`（`agents/sdd-cur-req-author.md` の 3 行）
- `sdd-cur-design-author` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]`（`agents/sdd-cur-design-author.md` の 3 行）
- `sdd-cur-implement-author` は `composer-2.5[fast=false]`（`agents/sdd-cur-implement-author.md` の 3 行）
- `sdd-cur-req-reviewer` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]`（`agents/sdd-cur-req-reviewer.md` の 3 行）
- `sdd-cur-design-reviewer` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]`（`agents/sdd-cur-design-reviewer.md` の 3 行）
- `sdd-cur-implement-reviewer` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]`（`agents/sdd-cur-implement-reviewer.md` の 3 行）
- `sdd-cur-req-reviewer-high` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]`（`agents/sdd-cur-req-reviewer-high.md` の 3 行）
- `sdd-cur-req-fixer` は `composer-2.5[fast=false]`（`agents/sdd-cur-req-fixer.md` の 3 行）
- `sdd-cur-design-fixer` は `composer-2.5[fast=false]`（`agents/sdd-cur-design-fixer.md` の 3 行）
- `sdd-cur-implement-fixer` は `composer-2.5[fast=false]`（`agents/sdd-cur-implement-fixer.md` の 3 行）
- `sdd-cur-explore` は `composer-2.5[fast=false]`（`agents/sdd-cur-explore.md` の 3 行）

作成役のファイル名は、`sdd-cur-req-author.md`（`src/install.ts` の 8 行）、`sdd-cur-design-author.md`（`src/install.ts` の 12 行）、`sdd-cur-implement-author.md`（`src/install.ts` の 15 行）である。レビュー役のファイル名は、`sdd-cur-req-reviewer.md`（`src/install.ts` の 9 行）、`sdd-cur-design-reviewer.md`（`src/install.ts` の 13 行）、`sdd-cur-implement-reviewer.md`（`src/install.ts` の 16 行）である。上級の要求レビューは `sdd-cur-req-reviewer-high.md` である（`src/install.ts` の 10 行）。修正役のファイル名は、`sdd-cur-req-fixer.md`（`src/install.ts` の 11 行）、`sdd-cur-design-fixer.md`（`src/install.ts` の 14 行）、`sdd-cur-implement-fixer.md`（`src/install.ts` の 17 行）である。調べるだけのファイル名は `sdd-cur-explore.md` である（`src/install.ts` の 18 行）。

## 受け入れ条件

- 1. 条件: 引数を省いて `install` する 主体: `install` 結果: スキルのコピー先はホームディレクトリの `.cursor/skills` であり、サブエージェントのコピー先はホームディレクトリの `.cursor/agents` であり、十一個のコピー先の `model:` はコピー元のフロントマターのままである
- 2. 条件: 存在するプロジェクトのルートを一つ渡して `install` する 主体: `install` 結果: スキルのコピー先は `<root>/.cursor/skills` であり、サブエージェントのコピー先は `<root>/.cursor/agents` である
- 3. 条件: `--` で始まらない引数が二つ以上ある、または空文字である 主体: `install` 結果: `install の引数はプロジェクトのルートを一つまでです` で失敗し、スキルもサブエージェントもコピーしない
- 4. 条件: 存在しないパスをプロジェクトのルートとして渡す 主体: `install` 結果: `ディレクトリが存在しません: <パス>` で失敗し、スキルもサブエージェントもコピーしない
- 5. 条件: ファイルをプロジェクトのルートとして渡す 主体: `install` 結果: `ディレクトリではありません: <パス>` で失敗し、スキルもサブエージェントもコピーしない
- 6. 条件: `--high-model <モデル>`、`--medium-model <モデル>`、`--low-model <モデル>` を、フラグと値を別の引数で渡して `install` が成功する 主体: `install` 結果: `sdd-cur-req-author` と `sdd-cur-design-author` と `sdd-cur-req-reviewer-high` のコピー先の `model:` が `--high-model` のモデルになり、`sdd-cur-req-reviewer` と `sdd-cur-design-reviewer` と `sdd-cur-implement-reviewer` のコピー先の `model:` が `--medium-model` のモデルになり、`sdd-cur-implement-author` と `sdd-cur-req-fixer` と `sdd-cur-design-fixer` と `sdd-cur-implement-fixer` と `sdd-cur-explore` のコピー先の `model:` が `--low-model` のモデルになる
- 7. 条件: `--high-model`、`--medium-model`、`--low-model` のいずれかの直後に値の引数がある 主体: `install` 結果: 値はその引数全体である。値は `=` を含んでよい。値は `--` で始まってもよい
- 8. 条件: 存在するプロジェクトのルートを一つと、有効な `--high-model`、`--medium-model`、`--low-model` を、どちらを先にしても渡す 主体: `install` 結果: そのルートのコピー先へ成功し、各種別のモデルを受け入れ条件 6 のサブエージェントへ反映する
- 9. 条件: `--high-model`、`--medium-model`、`--low-model` のいずれかの直後に引数が無い 主体: `install` 結果: 標準エラーに `モデルの指定が不正です: <指定>` と出て終了コード 1 で失敗し、スキルもサブエージェントもコピーせず、既にあるコピー先も変えない。`<指定>` はそのフラグである
- 10. 条件: `--high-model=`、`--medium-model=`、`--low-model=` のいずれかで始まる一つの引数がある 主体: `install` 結果: 標準エラーに `モデルの指定が不正です: <指定>` と出て終了コード 1 で失敗し、スキルもサブエージェントもコピーせず、既にあるコピー先も変えない。`<指定>` はその引数全体である
- 11. 条件: `--high-model`、`--medium-model`、`--low-model` のいずれかを付けて `install` が成功する 主体: `install` 結果: コピーしたあと、反映した種別に属する各コピー先のフロントマターの `model:` の行だけを書き換える。行は `model:`、空白一つ、そのモデルの順であり、モデルの文字列の前後に文字を足さない。本文と、フロントマターの他の行はコピー元と一致する
- 12. 条件: `install` が成功する 主体: `install` 結果: `agents/` の元ファイルは変わらない
- 13. 条件: コピーするスキルのディレクトリとサブエージェントのファイル名を見る 主体: `install` 結果: 今の一覧のままである
- 14. 条件: `install` が成功する 主体: `install` 結果: 標準出力に、十一個の最終的なモデルを `subagentFileNames` の順で一行ずつ出す。一行は、ファイル名から `.md` を除いた名前、空白一つ、最終的なモデルである。モデルの行は、スキルの宛先の絶対パスの行のあとであり、`配置するスキルはありません` を出すときはその行のあとである。三種類の指定が無く、十一個がコピー元のモデルのままのときも出す
- 15. 条件: `install` が成功する 主体: `install` 結果: スキルの宛先の絶対パスを標準出力へ書く。コピーしたスキルが無いときは `配置するスキルはありません` も標準出力へ書く
- 16. 条件: 使い方を表示する 主体: `install` の使い方 結果: `install` の行が `sdd-cur install [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]` である
- 17. 条件: `README.md` の `install` の説明を見る 主体: `README.md` 結果: `--high-model`、`--medium-model`、`--low-model` で三種類を指定し、受け入れ条件 6 のサブエージェントへ反映できる、と書く
- 18. 条件: この要件の変更を正本へ反映する 主体: `docs/canonical/install.md` 結果: フラグは `--high-model`、`--medium-model`、`--low-model` であり、割り当ては受け入れ条件 6 のとおりであり、指定しなかった種別はコピー元の `model:` のままであり、同じフラグの重複と空の値は `モデルの指定が不正です: <指定>` で失敗し、値として消費されていない引数のうち三種類のフラグ以外で `--` で始まるものは `モデルの指定が不正です: <指定>` で失敗し、種別フラグの直後の引数は `--` で始まっていても値であり知らない `--` 引数の検査の対象にせず、元の `agents/` は変えず、成功時のモデルの行は名前、空白一つ、最終的なモデルで `subagentFileNames` の順であり、宛先の絶対パスの行のあと（`配置するスキルはありません` を出すときはその行のあと）に成功したときだけ出す、とこの要件に合わせる
- 19. 条件: 三種類のモデル指定の解析を見る 主体: この課題 結果: `src/install.ts` の `parseInstallArgs` にある
- 20. 条件: コピー先の `model:` の書き換えを見る 主体: この課題 結果: `src/install.ts` の `installAgents` にある
- 21. 条件: `install` が失敗する 主体: `install` 結果: サブエージェントごとの最終的なモデルの行は出さない
- 22. 条件: `--help` も `-h` も無く、種別のフラグの値として消費されていない引数に、`--high-model`、`--medium-model`、`--low-model` 以外で `--` で始まるものがある 主体: `install` 結果: 標準エラーに `モデルの指定が不正です: <指定>` と出て終了コード 1 で失敗し、スキルもサブエージェントもコピーせず、既にあるコピー先も変えない。`<指定>` はその引数である
- 23. 条件: `--high-model <モデル>` だけを付け、`--medium-model` と `--low-model` は付けない 主体: `install` 結果: `sdd-cur-req-author` と `sdd-cur-design-author` と `sdd-cur-req-reviewer-high` のコピー先の `model:` がそのモデルになり、残りの八つのコピー先の `model:` はコピー元のままである
- 24. 条件: `--medium-model <モデル>` だけを付け、`--high-model` と `--low-model` は付けない 主体: `install` 結果: `sdd-cur-req-reviewer` と `sdd-cur-design-reviewer` と `sdd-cur-implement-reviewer` のコピー先の `model:` がそのモデルになり、残りの八つのコピー先の `model:` はコピー元のままである
- 25. 条件: `--low-model <モデル>` だけを付け、`--high-model` と `--medium-model` は付けない 主体: `install` 結果: `sdd-cur-implement-author` と `sdd-cur-req-fixer` と `sdd-cur-design-fixer` と `sdd-cur-implement-fixer` と `sdd-cur-explore` のコピー先の `model:` がそのモデルになり、残りの六つのコピー先の `model:` はコピー元のままである
- 26. 条件: `--high-model`、`--medium-model`、`--low-model` のいずれか一つを、空でない値で二回指定する 主体: `install` 結果: 標準エラーに `モデルの指定が不正です: <指定>` と出て終了コード 1 で失敗し、スキルもサブエージェントもコピーせず、既にあるコピー先も変えない。`<指定>` は後から現れた方の値の引数である
- 27. 条件: `--high-model`、`--medium-model`、`--low-model` のいずれかの直後の引数が空文字である 主体: `install` 結果: 標準エラーに `モデルの指定が不正です: <指定>` と出て終了コード 1 で失敗し、スキルもサブエージェントもコピーせず、既にあるコピー先も変えない。`<指定>` はその空の引数である
- 28. 条件: 三種の割り当てを見る 主体: この課題 結果: `src/install.ts` に固定で持つ。`agents/` の元ファイルには種別を書かない
- 29. 条件: `--high-model`、`--medium-model`、`--low-model` のいずれかの直後の引数が `--` で始まり、空でない 主体: `install` 結果: その引数全体をその種別のモデルとして反映し、その引数を理由に失敗しない

## 決定

- サブエージェントごとのモデル指定は採用しない。
- モデルの指定は、high-model、medium-model、low-model の三種類である。指定した種別のモデルを、その種別に属する各サブエージェントへ反映する。
- 成功したとき、標準出力のモデルの行は、ファイル名から `.md` を除いた名前、空白一つ、最終的なモデル、の順である。並びは `subagentFileNames` の順である。モデルの行は、スキルの宛先の絶対パスの行のあとである。`配置するスキルはありません` を出すときは、その行のあとである。モデルの行は、成功したときだけ出す。
- 三種類のフラグは、プロジェクトのルートより前でも後ろでもよい。`--` で始まらない引数はプロジェクトのルートであり、一つまでである。
- 各種別のフラグと値は別の引数である。値はフラグの直後の引数全体であり、`=` を含んでよい。直後に引数が無いとき、およびフラグと値を `=` で一引数に付けたときは、何もコピーせず `モデルの指定が不正です: <指定>` で失敗する。値が無いときの `<指定>` はフラグそのものである。一引数のときの `<指定>` はその引数全体である。
- 値として消費されていない引数のうち、三種類のモデル指定のフラグ以外で `--` で始まるものがあるときは、何もコピーせず `モデルの指定が不正です: <指定>` で失敗する。`<指定>` はその引数である。
- 種別のフラグの直後の引数は、`--` で始まっていても値として受ける。知らない `--` 引数の検査は、値として消費した引数には掛けない。
- high-model は `sdd-cur-req-author`、`sdd-cur-design-author`、`sdd-cur-req-reviewer-high` である。medium-model は `sdd-cur-req-reviewer`、`sdd-cur-design-reviewer`、`sdd-cur-implement-reviewer` である。low-model は `sdd-cur-implement-author`、`sdd-cur-req-fixer`、`sdd-cur-design-fixer`、`sdd-cur-implement-fixer`、`sdd-cur-explore` である。この対応は `install` のコードに固定で持つ。`agents/` の元ファイルは変えない。
- フラグ名は `--high-model`、`--medium-model`、`--low-model` である。
- 指定しなかった種別のサブエージェントは、コピー元の `model:` のままである。指定した種別だけを反映する。
- 同じ種別のフラグを複数回指定したときは、何もコピーせず `モデルの指定が不正です: <指定>` で失敗する。`<指定>` は後から現れた方の値の引数である。
- フラグの直後の値が空文字のときは、何もコピーせず `モデルの指定が不正です: <指定>` で失敗する。`<指定>` はその空の引数である。

## 範囲外

- 引数を省いたときのコピー先と、プロジェクトのルートを一つ渡したときのコピー先を変えること
- コピーするスキルとサブエージェントの一覧を変えること
- 三種類のモデルをどれも指定しなかったときに、コピー先のモデルを変えること
- `agents/` の元ファイルを変えること
- スキルの中身を書き換えること
- 課題ランナーがサブエージェントを起動するときに渡すモデル
- `review-next` が返す上級レビューのモデル
- 指定されたモデル文字列を、既知のモデル一覧と照合すること
- 導入時の言語の選択
- `install` 以外のサブコマンドの使い方の行を変えること
- 引数に `--help` または `-h` があるときの、使い方を出して終了コード 0 で終わることを変えること

## 関係する課題

- #1（パッケージ骨格）
- 課題ランナーがサブエージェントを起動するときのモデルと、上級レビューのモデルの選択は、この課題のあとの別の課題で扱う。課題番号は、この課題の本文に無い

## 比べる相手

cc-sdd は、`npx cc-sdd@latest --cursor --lang ja` のように、導入時にエージェントと言語を選べる。この課題が足すのは、コピーするサブエージェントのモデルの指定である。
