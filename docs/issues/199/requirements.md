# 199 docs/steering/ の任意の文書を、作成役、修正役、レビュー役が読む

<!-- sdd-cur:form -->

対象は [Issue #199](https://github.com/paterapatera/sdd-cur/issues/199)。`docs/steering/<名前>.md` を任意で置けるようにする。要求・設計・実装の作成役、修正役、レビュー役は、`docs/policy.md` のあと、`docs/steering/` 直下の `.md` をすべて読む。ディレクトリが無いときは読まずに進む。`docs/policy.md` と食い違うときは `docs/policy.md` を優先し、レビュー役は食い違いを指摘する。`sdd-cur doctor` は、`docs/steering/` があるとき、名前の規則に合わないファイルを一行ずつ知らせる。

重なる課題は #164（`doctor`）と #165（`setup`）である。

## 現状

`agents/sdd-cur-req-author.md` は、`docs/policy.md` が無いとき止まって `sdd-cur init` を案内する、と書く（`agents/sdd-cur-req-author.md` の 13 行）。あるときは起動時に `docs/policy.md` を読む、と書く（`agents/sdd-cur-req-author.md` の 14 行）。`agents/sdd-cur-design-author.md` は、無いとき止まって `sdd-cur init` を案内する、と書く（`agents/sdd-cur-design-author.md` の 13 行）。あるときは起動時に読む、と書く（`agents/sdd-cur-design-author.md` の 14 行）。`agents/sdd-cur-req-reviewer.md` は、無いとき止まって `sdd-cur init` を案内する、と書く（`agents/sdd-cur-req-reviewer.md` の 15 行）。あるときは起動時に読む、と書く（`agents/sdd-cur-req-reviewer.md` の 16 行）。`agents/sdd-cur-req-reviewer-high.md` は、無いとき止まって `sdd-cur init` を案内する、と書く（`agents/sdd-cur-req-reviewer-high.md` の 15 行）。あるときは起動時に読む、と書く（`agents/sdd-cur-req-reviewer-high.md` の 16 行）。`agents/sdd-cur-design-reviewer.md` は、無いとき止まって `sdd-cur init` を案内する、と書く（`agents/sdd-cur-design-reviewer.md` の 15 行）。あるときは起動時に読む、と書く（`agents/sdd-cur-design-reviewer.md` の 16 行）。

`agents/sdd-cur-req-fixer.md` の起動時の一つ目は、渡された要求ファイルと差分と、人が決めた条件を読む、である（`agents/sdd-cur-req-fixer.md` の 13 行）。`agents/sdd-cur-design-fixer.md` の起動時の一つ目は、渡された設計ファイルと差分を読む、である（`agents/sdd-cur-design-fixer.md` の 13 行）。`agents/sdd-cur-implement-author.md` の起動時の一つ目は、課題番号、題、作業の行、要件、設計を読む、である（`agents/sdd-cur-implement-author.md` の 13 行）。`agents/sdd-cur-implement-fixer.md` の起動時の一つ目は、渡された差分を読む、である（`agents/sdd-cur-implement-fixer.md` の 13 行）。`agents/sdd-cur-implement-reviewer.md` の起動時の一つ目は、課題番号、要件、設計、作業ツリーの実装、受け入れ手順、コマンドの記述と終了コードと出力を読む、である（`agents/sdd-cur-implement-reviewer.md` の 39 行）。

`agents/sdd-cur-req-reviewer.md` は、レビューしている要求のうち、`docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する、と書く（`agents/sdd-cur-req-reviewer.md` の 106 行）。`agents/sdd-cur-req-reviewer-high.md` も、同じ指摘を書く（`agents/sdd-cur-req-reviewer-high.md` の 106 行）。`agents/sdd-cur-design-reviewer.md` は、レビューしている設計のうち、同じ節と食い違う記述を指摘する、と書く（`agents/sdd-cur-design-reviewer.md` の 86 行）。`agents/sdd-cur-implement-reviewer.md` の実装の指摘は、要求どおりでないこと、設計通りでないこと、渡された終了コードが 0 以外であること、である（`agents/sdd-cur-implement-reviewer.md` の 97 行）。

正本は、上の五つの作成役とレビュー役が、`docs/policy.md` が無いとき止まって `sdd-cur init` を案内し、あるとき起動時に読む、と定める（`docs/canonical/sdd.md` の 2272 行）。

`docs/policy.md` は、誰のための道具か、技術の前提、構成、破ってはいけない原則の正本であり、変えるのは課題を通したときだけである、と書く（`docs/policy.md` の 3 行）。`##` 見出しは、`誰のための道具か`（`docs/policy.md` の 5 行）、`技術の前提`（`docs/policy.md` の 9 行）、`構成`（`docs/policy.md` の 17 行）、`破ってはいけない原則`（`docs/policy.md` の 39 行）である。構成の表に `docs/policy.md` の行がある（`docs/policy.md` の 32 行）。構成の表の最後の行は `skills/<名前>/` である（`docs/policy.md` の 37 行）。

`skills/sdd-cur/conventions.md` の仕様の正本の表は、`docs/canonical/<領域>.md` をその領域の要求とする（`skills/sdd-cur/conventions.md` の 22 行）。`<領域>` は英小文字で始まり、英小文字と数字が続き、区切りのハイフンを含んでよい。ハイフンは先頭、末尾、連続には使わない（`skills/sdd-cur/conventions.md` の 24 行）。正本の REQ-1 は、`<領域>` は英小文字で始まり、英小文字と数字が続き、区切りのハイフンを含んでよい、と書く（`docs/canonical/spec.md` の 7 行）。領域名の照合に使う正規表現は、`src/conventions.ts` の `CANONICAL_DOMAIN` である（`src/conventions.ts` の 1894 行）。

`doctorCheckLabels` の一つ目は `` `bun` がある `` である（`src/doctor.ts` の 13 行）。八つ目は、スキルとサブエージェントがパッケージの中身と同じである、という項目である（`src/doctor.ts` の 20 行）。`checkDocsCanonicalAndIssues` が見るディレクトリは `docs/canonical` と `docs/issues` である（`src/doctor.ts` の 170 行）。八つの検査のあと、終了コードは、一つでも失敗なら 1、すべて成功なら 0 である（`src/doctor.ts` の 314 行）。警告の行は `WARN #<番号>: 「実装依頼」が付いているが担当者にあなたの login が無い` である（`src/doctor.ts` の 287 行）。

`init` が置く文書の一つは `docs/canonical/README.md` である（`src/init.ts` の 26 行）。もう一つは `docs/issues/README.md` である（`src/init.ts` の 27 行）。

`setup` は、`install`、`init`、`labels` がいずれも終了コード 0 のあと、`doctor` と同じ確認を行い、その標準出力、標準エラー、終了コードを出す（`docs/canonical/install.md` の 161 行）。

README は、誰のための道具か、技術の前提、構成、破ってはいけない原則の正本を `docs/policy.md` とする（`README.md` の 3 行）。`sdd-cur doctor` は導入の前提を一つずつ確かめるコマンドである、と書く（`README.md` の 91 行）。見出し `ディレクトリ` がある（`README.md` の 123 行）。構成の正本の表にあるパスは、README には繰り返さない、と書く（`README.md` の 125 行）。その節の木の最初の行は `docs/issues/<番号>/` である（`README.md` の 128 行）。

`agents/sdd-cur-explore.md` が仕様として調べる範囲は、`docs/canonical/` と、対象課題の `docs/issues/<番号>/` である（`agents/sdd-cur-explore.md` の 18 行）。

テストを足す場所は `src/<番号>.test.ts` だけである（`docs/conventions.md` の 31 行）。テストはホームディレクトリを触らない（`AGENTS.md` の 22 行）。

## 受け入れ条件

- 1. 条件: `docs/steering/` がディレクトリとしてある 主体: プロジェクト 結果: 直下に `<名前>.md` を任意の個数置ける
- 2. 条件: `<名前>` を領域名の規則と照合する 主体: `docs/steering/<名前>.md` 結果: `<名前>` は `docs/canonical/<領域>.md` の `<領域>` と同じ規則である。英小文字で始まり、英小文字と数字が続き、区切りのハイフンを含んでよい。ハイフンは先頭、末尾、連続には使わない
- 3. 条件: 次の十ファイルが起動する 主体: `agents/sdd-cur-req-author.md`、`agents/sdd-cur-req-fixer.md`、`agents/sdd-cur-req-reviewer.md`、`agents/sdd-cur-req-reviewer-high.md`、`agents/sdd-cur-design-author.md`、`agents/sdd-cur-design-fixer.md`、`agents/sdd-cur-design-reviewer.md`、`agents/sdd-cur-implement-author.md`、`agents/sdd-cur-implement-fixer.md`、`agents/sdd-cur-implement-reviewer.md` 結果: 各ファイルは、起動時に `docs/policy.md` を読み、そのあと `docs/steering/` 直下の `.md` をすべて読む、と書く。この順の読みは、十ファイルで揃える
- 4. 条件: `docs/steering/` がディレクトリとして無い 主体: 受け入れ条件 3 の十ファイル 結果: 各ファイルは、直下の `.md` を読まずに進み、ディレクトリが無いことでは止まらない、と書く
- 5. 条件: `docs/steering/` のサブディレクトリの中に `.md` がある 主体: 受け入れ条件 3 の十ファイル 結果: 各ファイルは、そのサブディレクトリの中の `.md` を読まない、と書く
- 6. 条件: `docs/steering/` 直下に、名前が `.md` で終わらないファイルがある 主体: 受け入れ条件 3 の十ファイル 結果: 各ファイルは、そのファイルを読まない、と書く
- 7. 条件: `docs/steering/` 直下に、受け入れ条件 2 の規則に合わない `.md` がある 主体: 受け入れ条件 3 の十ファイル 結果: 各ファイルは、その `.md` も読む、と書く
- 8. 条件: `docs/policy.md` が無い 主体: 受け入れ条件 3 の十ファイル 結果: 各ファイルは、止まって `sdd-cur init` を案内する、と書く。要求の修正、設計の修正、実装の作成、実装の修正、実装のレビューの五役も、この停止と案内を書く。この停止と案内は、十ファイルで揃える
- 9. 条件: `docs/policy.md` と `docs/steering/` 直下の `.md` が食い違う 主体: 受け入れ条件 3 の十ファイル 結果: 各ファイルは、従うのは `docs/policy.md` である、と書く
- 10. 条件: `docs/policy.md` と `docs/steering/` 直下の `.md` が食い違う 主体: `agents/sdd-cur-req-reviewer.md`、`agents/sdd-cur-req-reviewer-high.md`、`agents/sdd-cur-design-reviewer.md`、`agents/sdd-cur-implement-reviewer.md` 結果: 各ファイルは、その食い違いを指摘する、と書く
- 11. 条件: `agents/sdd-cur-req-reviewer.md` と `agents/sdd-cur-req-reviewer-high.md` と `agents/sdd-cur-design-reviewer.md` を見る 主体: その三ファイル 結果: `docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する文が残る
- 12. 条件: `docs/steering/` がディレクトリとして無い 主体: `doctor` 結果: 名前の規則に合わないファイルを知らせる行は出さない
- 13. 条件: `docs/steering/` がディレクトリとして無い 主体: `doctor` 結果: 八つの検査の項目、各検査の `OK` 行と `NG` 行、`WARN` 行、終了コードは、この課題の前と同じである
- 14. 条件: `docs/steering/` がディレクトリとしてある 主体: `doctor` 結果: 八つの検査の項目と、各検査の `OK` 行と `NG` 行の形は、この課題の前と同じである
- 15. 条件: `docs/steering/` がディレクトリとしてあり、直下に受け入れ条件 2 の規則に合わない `<名前>.md` がある 主体: `doctor` 結果: 八つの検査の `OK` 行と `NG` 行のあと、既存の `WARN` 行の前に、その `<名前>.md` を標準出力へ一行ずつ出す。各行は `WARN ` に続けて、そのファイルの作業ディレクトリからの相対パスを一文字も違わず書き、行末まで他の文字を付けない。既存の `WARN` 行は、`WARN #<番号>: 「実装依頼」が付いているが担当者にあなたの login が無い` である
- 16. 条件: `docs/steering/` がディレクトリとしてあり、直下に受け入れ条件 2 の規則に合わない `<名前>.md` が無い 主体: `doctor` 結果: 名前の規則に合わないファイルを知らせる行は出さない
- 17. 条件: `docs/policy.md` の構成の表を見る 主体: `docs/policy.md` 結果: `docs/steering/` の行があり、その行から、`<名前>.md` を任意で置けること、受け入れ条件 3 の役が `docs/policy.md` のあと直下の `.md` をすべて読むこと、ディレクトリが無いときは読まずに進むこと、食い違うときは `docs/policy.md` を優先すること、が読める
- 18. 条件: `docs/policy.md` の `##` 見出しを見る 主体: `docs/policy.md` 結果: 見出しは `誰のための道具か`、`技術の前提`、`構成`、`破ってはいけない原則` の四つであり、この順である
- 19. 条件: `docs/policy.md` の見出し `# 方針` の直後の文を見る 主体: `docs/policy.md` 結果: 「このファイルを変えるのは、課題を通したときだけである。」と一文字も同じ文がある
- 20. 条件: `skills/sdd-cur/conventions.md` を読む 主体: そのファイル 結果: `<名前>.md` を `docs/steering/` 直下に任意で置けること、`<名前>` が受け入れ条件 2 の規則であること、受け入れ条件 3 の役が `docs/policy.md` のあと直下の `.md` をすべて読むこと、ディレクトリが無いときは読まずに進むこと、食い違うときは `docs/policy.md` を優先すること、レビュー役が食い違いを指摘すること、が書いてある
- 21. 条件: `README.md` を読む 主体: `README.md` 結果: 受け入れ条件 20 に書いた六つのことが書いてある
- 22. 条件: `README.md` を読む 主体: `README.md` 結果: `doctor` は `docs/steering/` があるとき、名前の規則に合わないファイルを一行ずつ知らせる、と書いてある
- 23. 条件: `README.md` の見出し `ディレクトリ` を見る 主体: `README.md` 結果: 「正本の表にあるパスは、ここには繰り返さない。」と一文字も同じ文がある
- 24. 条件: この課題のテストを書く 主体: テスト 結果: ファイルは `src/199.test.ts` だけである。既存の `src/*.test.ts` に新しい `test` を足さない。`gh` のプロセスは起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す
- 25. 条件: `doctor` を `src/199.test.ts` で確かめる 主体: テスト 結果: `GhRunner` を注入する
- 26. 条件: `agents/sdd-cur-explore.md` をこの課題の前後で比べる 主体: そのファイル 結果: 本文は一文字も変えない
- 27. 条件: `init` がファイルを作る 主体: `init` 結果: `docs/steering/` は作らない
- 28. 条件: `setup` の実行順を見る 主体: `setup` 結果: `install`、`init`、`labels` の順と、三つが終了コード 0 のあと `doctor` と同じ確認の標準出力、標準エラー、終了コードを出す定めは、この課題の前と同じである
- 29. 条件: `docs/steering/` 直下に、受け入れ条件 2 の規則に合わない `<名前>.md` がある 主体: `doctor` 結果: 終了コードは八つの検査の結果だけで決まる。一つでも失敗なら 1、すべて成功なら 0 である。この命名違反だけでは終了コードを 1 にしない
- 30. 条件: `docs/steering/` のサブディレクトリの中にファイルがある、直下に名前が `.md` で終わらないファイルがある、直下にディレクトリがある、のいずれかである 主体: `doctor` 結果: それらを知らせる行は出さない。知らせるのは、直下の、受け入れ条件 2 の規則に合わない `<名前>.md` だけである
- 31. 条件: `gh` の検査と git・`resolveRepo` の検査が `OK` であり、`viewerLogin` または課題一覧の取得が失敗し、`docs/steering/` がディレクトリとしてあり、直下に受け入れ条件 2 の規則に合わない `<名前>.md` がある 主体: `doctor` 結果: 八つの検査の `OK` 行と `NG` 行のあと、受け入れ条件 15 と同じ形の steering 用 `WARN` 行を出す。課題担当の `WARN` 行は出さない。取得に失敗したことは標準エラーへ短く書く。終了コードは八つの検査の結果だけで決まる

## 決定

`doctor` が steering の名前規則違反を知らせる行は、八つの検査の `OK` 行と `NG` 行のあと、既存の `WARN` 行の前に、標準出力へ一行ずつ書く。既存の `WARN` 行は、`WARN #<番号>: 「実装依頼」が付いているが担当者にあなたの login が無い` である。知らせる各行の接頭辞は `WARN` であり、その行はパスを示す。終了コードは、八つの検査の結果だけで決まる。八つの検査の一つでも失敗なら 1、すべて成功なら 0 である。steering の命名違反だけでは、終了コードを 1 にしない。

`doctor` が知らせる対象は、`docs/steering/` 直下の `.md` だけである。受け入れ条件 2 の規則に合わない `<名前>.md` だけを、一行ずつ知らせる。サブディレクトリの中にあるファイルは、知らせない。直下の、名前が `.md` で終わらないファイルは、知らせない。直下のディレクトリは、知らせない。

十役は、起動時に `docs/policy.md` を読み、そのあと `docs/steering/` 直下の `.md` をすべて読む。十役は、受け入れ条件 3 の十ファイルである。`docs/policy.md` が無いときは、要求の修正、設計の修正、実装の作成、実装の修正、実装のレビューの五役も、止まって `sdd-cur init` を案内する。この停止と案内は、十役で揃える。

`gh` の検査と git・`resolveRepo` の検査が `OK` のあと、`viewerLogin` または課題一覧の取得が失敗したときも、命名違反の steering 用 `WARN` 行は出す。課題担当の `WARN` 行だけ出さない。

十役は、規則に合わない `<名前>.md` も、直下の `.md` として読む。

## 範囲外

- `docs/policy.md` の四つの `##` 見出しを増やすこと、減らすこと、見出しの字面を変えること
- 「このファイルを変えるのは、課題を通したときだけである。」を変えること
- `docs/canonical/` と `docs/issues/` の置き場所と形を変えること
- `docs/steering/` が無いときに、その不在を理由に役が止まること
- `docs/steering/` が無いときに、`doctor` の八つの検査、`WARN` 行、終了コードを、この課題の前と変えること
- `doctor` がファイルを書くこと、ファイルを消すこと、ラベルを変えること
- `agents/sdd-cur-explore.md` を変えること
- `init` が `docs/steering/` を作ること
- `setup` の実行順と、`doctor` と同じ確認の結果を出す定めを変えること
- 受け入れ条件 3 の十ファイルの frontmatter の `name`、`model`、`description`、`readonly` を変えること
- `skills/sdd-cur/conventions.md` 以外のスキル本文を変えること
- `skills/sdd-cur/conventions.md` の、課題コメントの印と、要件と設計の形式の検査の定めを変えること
- `src/doctor.ts` と `src/199.test.ts` 以外の `src/*.ts` を変えること

## 関係する課題

- #164（`doctor`。八つの検査、`WARN`、終了コード）
- #165（`setup`。三つが終了コード 0 のあと、`doctor` と同じ確認の結果を出す）
