# 118 導入先に方針ファイルと仕様の置き場所を用意する init を足す

<!-- sdd-cur:form -->

対象は [Issue #118](https://github.com/paterapatera/sdd-cur/issues/118)。`sdd-cur init [project-root]` を足す。導入先に、方針ファイル `docs/policy.md` のひな形を、無いときだけ作る。既存のファイルは上書きしない。`init` は `gh` を起動しない。

重なる課題は #116、#117、#84 である。この要件は #113 に合わせ、`docs/canonical/` と `docs/issues/` を用意する。README の書き分けと、サブコマンド一覧の一致は #115 に関わる。

## 現状

要求作成役は、起動時に `docs/policy.md` を読む（`agents/sdd-cur-req-author.md` の 13 行）。

設計作成役は、起動時に `docs/policy.md` を読む（`agents/sdd-cur-design-author.md` の 13 行）。

要求レビュー役は、起動時に `docs/policy.md` を読む（`agents/sdd-cur-req-reviewer.md` の 15 行）。指摘に、`docs/policy.md` の「破ってはいけない原則」と食い違う記述を含む（`agents/sdd-cur-req-reviewer.md` の 105 行）。

上級の要求レビュー役は、起動時に `docs/policy.md` を読む（`agents/sdd-cur-req-reviewer-high.md` の 15 行）。指摘に、同じ食い違いを含む（`agents/sdd-cur-req-reviewer-high.md` の 105 行）。

設計レビュー役は、起動時に `docs/policy.md` を読む（`agents/sdd-cur-design-reviewer.md` の 15 行）。指摘に、設計のうち同じ食い違いを含む（`agents/sdd-cur-design-reviewer.md` の 76 行）。

「誰のための道具か」の見出しは、その行である（`docs/policy.md` の 5 行）。「技術の前提」の見出しは、その行である（`docs/policy.md` の 9 行）。「構成」の見出しは、その行である（`docs/policy.md` の 17 行）。「破ってはいけない原則」の見出しは、その行である（`docs/policy.md` の 38 行）。

誰のための道具かは、このリポジトリが `@paterapatera/sdd-cur` である、と書く（`docs/policy.md` の 7 行）。

構成の表の `src/cli.ts` の行は、サブコマンドの列挙に `init` を含まない（`docs/policy.md` の 21 行）。

`install` の役割は、スキルとサブエージェントをコピーすることである（`docs/policy.md` の 23 行）。

`labels` の役割は、業務フロー用ラベル名と `ensureWorkflowLabels` である（`docs/policy.md` の 30 行）。

`installAll` は、スキルをコピーする（`src/install.ts` の 142 行）。続けてサブエージェントをコピーする（`src/install.ts` の 147 行）。

引数を省いたときのスキルの宛先は、ホームディレクトリの `.cursor/skills` である（`src/install.ts` の 26 行）。

使い方の最初の行は `sdd-cur install [project-root]` である（`src/cli.ts` の 62 行）。`sdd-cur labels` がある（`src/cli.ts` の 64 行）。`switch` は `install` を呼ぶ（`src/cli.ts` の 800 行）。`labels` を呼ぶ（`src/cli.ts` の 804 行）。一致しないサブコマンドは使い方を出して終了コード 1 である（`src/cli.ts` の 834 行）。

`install` は、コピー先のディレクトリを標準出力へ書く（`src/cli.ts` の 252 行）。

`labels` は `githubFromCwd` を呼ぶ（`src/cli.ts` の 321 行）。そのあと `ensureWorkflowLabels` を呼ぶ（`src/cli.ts` の 322 行）。

README の公開後の例は `bunx @paterapatera/sdd-cur install [project-root]` である（`README.md` の 76 行）。パスが通ったあとは `sdd-cur install` と `sdd-cur run` である（`README.md` の 80 行）。

課題ごとの要件のパスは `docs/issues/<番号>/requirements.md` である（`skills/sdd-cur/conventions.md` の 11 行）。正本は `docs/canonical/` に置く（`skills/sdd-cur/conventions.md` の 18 行）。

`specPaths` のディレクトリは `docs/issues/` と課題番号を連結する（`src/conventions.ts` の 97 行）。

正本を読むディレクトリは `docs/canonical` である（`src/spec.ts` の 186 行）。

正本は、正本を `docs/canonical/<領域>.md` に置き、課題ごとの要件と設計を `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` とする（`docs/canonical/spec.md` の 7 行）。

#113 の要件は、正本のディレクトリを `docs/canonical/` とする（`docs/issues/113/requirements.md` の 55 行）。

`docs/policy.md` の構成の表から取るサブコマンド名の集合は、`src/cli.ts` の `case` の集合と一致する、とテストが期待する（`src/docs.test.ts` の 117 行）。`AGENTS.md` の「コマンド」のコードフェンスから取るサブコマンド名の集合も、同じ集合と一致する、とテストが期待する（`src/docs.test.ts` の 121 行）。

正本は、`AGENTS.md` の「コマンド」にある `bun src/cli.ts` の例が、`src/cli.ts` のサブコマンドをすべて含む、とする（`docs/canonical/docs.md` の 19 行）。

スキル呼び出し分の例と表に、`install`、`run`、`labels` は無い、と正本は書く（`docs/canonical/docs.md` の 169 行）。

`AGENTS.md` の「コマンド」の最初の例は `bun src/cli.ts install [project-root]` である（`AGENTS.md` の 28 行）。

使い方のテストが期待する最初の行は `sdd-cur install [project-root]` である（`src/cli.test.ts` の 13 行）。同じ期待がある（`src/package.test.ts` の 35 行）。

#116 の範囲外に、約束と方針のファイルを導入先でどう読むか、がある（`docs/issues/116/requirements.md` の 173 行）。

#117 の範囲外に、方針ファイルを導入先に用意すること、`init` を足すこと、方針のひな形を作ること、がある（`docs/issues/117/requirements.md` の 92 行）。

## 受け入れ条件

- 1. 条件: 第1引数が `init` である 主体: `src/cli.ts` 結果: `src/init.ts` の処理を呼ぶ
- 2. 条件: 使い方を標準エラーへ出す 主体: `printUsage` 結果: 行全体が `sdd-cur init [project-root]` である行がある
- 3. 条件: `src/cli.test.ts` が期待する使い方の文字列を見る 主体: テスト 結果: 行 `sdd-cur init [project-root]` を含む
- 4. 条件: `src/package.test.ts` が期待する使い方の文字列を見る 主体: テスト 結果: 行 `sdd-cur init [project-root]` を含む
- 5. 条件: プロジェクトのルートを一つ渡して `init` を実行し、そのルートに `docs/policy.md` が無い 主体: `init` 結果: そのルートの下の `docs/policy.md` にひな形を作る
- 6. 条件: プロジェクトのルートを一つ渡して `init` を実行し、そのルートに `docs/policy.md` がある 主体: `init` 結果: そのファイルを上書きしない
- 7. 条件: 既にあるファイルと同じパスへ `init` が書こうとする 主体: `init` 結果: 上書きしない
- 8. 条件: 既にあるファイルと同じパスへ `init` が書こうとする 主体: `init` 結果: そのパスを標準出力へ書かない
- 9. 条件: `init` が作った `docs/policy.md` の見出し行を見る 主体: ひな形 結果: この順で `## 誰のための道具か`、`## 技術の前提`、`## 構成`、`## 破ってはいけない原則` であり、ほかの見出しは無い
- 10. 条件: `init` が作った `docs/policy.md` の、見出し以外の非空行を見る 主体: ひな形 結果: 四行であり、各行はその直前の節に何を書くかを述べる
- 11. 条件: `init` が作った `docs/policy.md` の各節の本文を見る 主体: ひな形 結果: このリポジトリの `docs/policy.md` の各節の本文を写さない
- 12. 条件: `init` がパスを一つ以上作った 主体: `init` 結果: 作ったパスを、プロジェクトのルートからの相対パスで、標準出力へ一行に一つ書く
- 13. 条件: `init` がパスを一つも作らなかった 主体: `init` 結果: 標準出力にパスの行を書かない
- 14. 条件: `init` を実行する 主体: `init` 結果: `gh` を起動しない
- 15. 条件: `init` を実行する 主体: `init` 結果: ラベルを作らない
- 16. 条件: `init` を実行する 主体: `init` 結果: サブコマンド `labels` を実行しない
- 17. 条件: `labels` を実行する 主体: `labels` 結果: `ensureWorkflowLabels` でラベルを作る
- 18. 条件: `install` を実行する 主体: `install` 結果: `docs/policy.md` を作らない
- 19. 条件: `docs/policy.md` が無いときの手順を見る 主体: `agents/sdd-cur-req-author.md` 結果: 止まって、`sdd-cur init` を案内する、と書く
- 20. 条件: `docs/policy.md` が無いときの手順を見る 主体: `agents/sdd-cur-design-author.md` 結果: 止まって、`sdd-cur init` を案内する、と書く
- 21. 条件: `docs/policy.md` が無いときの手順を見る 主体: `agents/sdd-cur-req-reviewer.md` 結果: 止まって、`sdd-cur init` を案内する、と書く
- 22. 条件: `docs/policy.md` が無いときの手順を見る 主体: `agents/sdd-cur-req-reviewer-high.md` 結果: 止まって、`sdd-cur init` を案内する、と書く
- 23. 条件: `docs/policy.md` が無いときの手順を見る 主体: `agents/sdd-cur-design-reviewer.md` 結果: 止まって、`sdd-cur init` を案内する、と書く
- 24. 条件: `docs/policy.md` があるときの手順を見る 主体: `agents/sdd-cur-req-author.md` 結果: 起動時に `docs/policy.md` を読む、と書く
- 25. 条件: `docs/policy.md` があるときの手順を見る 主体: `agents/sdd-cur-design-author.md` 結果: 起動時に `docs/policy.md` を読む、と書く
- 26. 条件: `docs/policy.md` があるときの手順を見る 主体: `agents/sdd-cur-req-reviewer.md` 結果: 起動時に `docs/policy.md` を読む、と書く
- 27. 条件: `docs/policy.md` があるときの手順を見る 主体: `agents/sdd-cur-req-reviewer-high.md` 結果: 起動時に `docs/policy.md` を読む、と書く
- 28. 条件: `docs/policy.md` があるときの手順を見る 主体: `agents/sdd-cur-design-reviewer.md` 結果: 起動時に `docs/policy.md` を読む、と書く
- 29. 条件: 指摘の対象を見る 主体: `agents/sdd-cur-req-reviewer.md` 結果: `docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する、と書く
- 30. 条件: 指摘の対象を見る 主体: `agents/sdd-cur-req-reviewer-high.md` 結果: `docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する、と書く
- 31. 条件: 指摘の対象を見る 主体: `agents/sdd-cur-design-reviewer.md` 結果: `docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する、と書く
- 32. 条件: README を見る 主体: README 結果: 導入の順が `install`、`init`、`labels` である、と書く
- 33. 条件: README の「開発中の起動」のコードフェンスと、そのあとのスキル呼び出し分の表を見る 主体: README 結果: `init` が無い
- 34. 条件: `docs/policy.md` の構成の表の `src/cli.ts` の行を見る 主体: `docs/policy.md` 結果: バッククォートで囲んだサブコマンド名の集合が、`src/cli.ts` の `switch` の `case` の名前の集合と一致する
- 35. 条件: `AGENTS.md` の「コマンド」のコードフェンスを見る 主体: `AGENTS.md` 結果: `bun src/cli.ts init [project-root]` の行がある
- 36. 条件: `AGENTS.md` の「コマンド」のコードフェンスを見る 主体: `AGENTS.md` 結果: `bun src/cli.ts` の行から取れるサブコマンド名の集合が、`src/cli.ts` の `switch` の `case` の名前の集合と一致する
- 37. 条件: プロジェクトのルートを一つ渡して `init` を実行する 主体: `init` 結果: そのルートに `AGENTS.md` を作らない
- 38. 条件: `init` を実行する 主体: `init` 結果: `docs/conventions.md` を作らない
- 39. 条件: この要件の変更を見る 主体: この要件 結果: `skills/sdd-cur/conventions.md` の置き場所を変えない
- 40. 条件: `[project-root]` を省いて `init` を実行し、カレントディレクトリに `docs/policy.md` が無い 主体: `init` 結果: その下の `docs/policy.md` にひな形を作る
- 41. 条件: 引数で渡したプロジェクトのルート、または `[project-root]` を省いたときのカレントディレクトリの、`docs/canonical/` に README が無い 主体: `init` 結果: `docs/canonical/` を用意し、その中に一行の README を一つ置く
- 42. 条件: 引数で渡したプロジェクトのルート、または `[project-root]` を省いたときのカレントディレクトリの、`docs/issues/` に README が無い 主体: `init` 結果: `docs/issues/` を用意し、その中に一行の README を一つ置く
- 45. 条件: `init` が `docs/policy.md` を作った 主体: `init` 結果: 標準出力に、行全体が `docs/policy.md` である行がある
- 46. 条件: `[project-root]` を省いて `init` を実行する 主体: `init` 結果: カレントディレクトリをプロジェクトのルートとする

## 決定

`init` が導入先に用意する仕様の置き場は、`docs/canonical/` と `docs/issues/` である。

空のディレクトリが git に残らないため、`docs/canonical/` と `docs/issues/` のそれぞれに、一行の README を置く。

`sdd-cur init` で `[project-root]` を省いたとき、カレントディレクトリをプロジェクトのルートとする。

`init` が標準出力へ書く、作ったパスは、プロジェクトのルートからの相対パスである。例は `docs/policy.md` である。

## 関係する課題

課題は、次を関係するとする。

- #116（スキルの CLI 呼び出しを `sdd-cur` にする）
- #117（仕組みの約束をスキルに同梱する）
- #84（方針を一つのファイルにまとめる）
- #113（仕様ディレクトリの名前）
- #115（README のコマンド表記）
- #119（方針の中身を既存コードから下書きする）

#116 は、約束と方針のファイルを導入先でどう読むかを、#117 とこの課題に残した。この要件は、導入先に方針のひな形を作る `init` と、`docs/policy.md` が無いときの要求と設計の作成役とレビュー役の止まりを足す。#116 が変えた CLI のコマンド名は変えない。

#117 は、仕組みの約束を `skills/sdd-cur/conventions.md` に置く。この要件は、約束のファイルの置き場所を変えない。`init` は `docs/conventions.md` を作らない。

#84 は、誰のための道具か、技術の前提、構成、破ってはいけない原則を、一つの方針ファイルにまとめる。この要件は、ひな形の節見出しをその四つにする。このリポジトリの `docs/policy.md` の節本文は、ひな形へ写さない。

#113 は、正本を `docs/canonical/`、課題ごとの要件と設計を `docs/issues/` に置く、と定める。この要件は、#113 のあとのレイアウトに合わせ、導入先に `docs/canonical/` と `docs/issues/` を用意する。空のディレクトリが git に残らないため、それぞれに一行の README を置く。#113 が置いたコードと約束のパスは動かさない。

#115 は、README のスキル呼び出し分の例と表に `install` と `labels` を書かない、と定める。`AGENTS.md` の「コマンド」の例は、`src/cli.ts` のサブコマンドをすべて含む、と定める。この要件は、導入の順をスキル呼び出し分の例と表の外に書く。`init` をサブコマンドに足すので、このリポジトリの `AGENTS.md` の「コマンド」の例と、`docs/policy.md` の構成の表は、`src/cli.ts` の `case` の集合と一致させる。導入先へ `AGENTS.md` を生成することは、範囲外のままである。

#119 は、方針の中身を既存コードから下書きする。この要件は、その下書きをしない。

## 範囲外

次は、この要件に含めない。

- 方針の中身を既存コードから下書きすること（#119）
- `AGENTS.md` の生成
- `labels` を `init` に統合すること
- 約束のファイルの置き場所（#117）
