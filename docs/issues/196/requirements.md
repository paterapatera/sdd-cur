# 196 設計の正本への差分を docs/canonical/ に書き込む spec-apply を足す

<!-- sdd-cur:form -->

対象は [Issue #196](https://github.com/paterapatera/sdd-cur/issues/196)。設計の `## 正本への差分` を `docs/canonical/` へ書き込むのは、実装作成役である。`spec-diff` は、デフォルトブランチの正本に差分を当てた期待値を計算し、作業ツリーと比べる。期待値はファイルへ書かない。`sdd-cur spec-apply <番号>` を足し、同じ手順の期待値を `docs/canonical/<領域>.md` へ書く。

重なる課題は #123、#128 である。

比べる相手は、OpenSpec の archive と Delta Specs である。OpenSpec は、変更フォルダの delta spec を `archive` で正本へ統合する。

手を入れる対象は、`src/conventions.ts`、`src/cli.ts`、`docs/policy.md`、`AGENTS.md`、`README.md`、`skills/sdd-cur/conventions.md` の「仕様の正本」である。

## 現状

設計の `## 正本への差分` を、同じ作業ツリーの `docs/canonical/` へ反映するのは、実装スキルである（`skills/sdd-cur-implement/SKILL.md` の 22 行）。実装作成役も、同じ反映を書く（`agents/sdd-cur-implement-author.md` の 24 行）。項目が無いときは、`docs/canonical/` を変えない、と書く（`agents/sdd-cur-implement-author.md` の 25 行）。正本は、実装の作成役が設計の `## 正本への差分` を `docs/canonical/` へ反映する、と定める（`docs/canonical/spec.md` の 35 行）。

`applyDeltaToBaseline` は、基準の対応へ差分の項目を当て、対応を返す（`src/conventions.ts` の 1999 行）。`specDiff` は、設計ファイルが無いときは項目を空にする（`src/conventions.ts` の 2219 行）。期待値は、その対応へ項目を当てた結果である（`src/conventions.ts` の 2221 行）。`specDiff` は、期待値と作業ツリーの正本を比べた行を返す（`src/conventions.ts` の 2223 行）。`cmdSpecDiff` は、その行を標準エラーへ書く（`src/cli.ts` の 294 行）。

使い方の最後の行は `sdd-cur spec-diff <番号>` である（`src/cli.ts` の 95 行）。`switch` に `spec-diff` がある（`src/cli.ts` の 1089 行）。`docs/policy.md` の構成の表が挙げるサブコマンドは、`spec-diff` までである（`docs/policy.md` の 21 行）。`AGENTS.md` の「コマンド」の例で、`bun test` の直前は `bun src/cli.ts spec-diff <番号>` である（`AGENTS.md` の 50 行）。サブコマンド一覧が `switch` と一致することを確かめるテストがある（`src/docs.test.ts` の 114 行）。

`compareCanonicalMaps` は、期待値と作業ツリーの対応を比べる（`src/conventions.ts` の 2157 行）。要求の見出しは、行全体が `## REQ-<番号>` に合う行である（`src/conventions.ts` の 33 行）。`canonicalReqBodiesFromMarkdown` は、その見出しの本文を、先頭と末尾の空行を除いて読む（`src/conventions.ts` の 1912 行）。領域ファイルの最初の見出しの例は `# spec` である（`docs/canonical/spec.md` の 1 行）。

`validateCanonicalDelta` は、追加する識別子が正本にあるとき違反にする（`src/conventions.ts` の 1765 行）。変更する識別子が正本に無いとき違反にする（`src/conventions.ts` の 1767 行）。削除する識別子が正本に無いとき違反にする（`src/conventions.ts` の 1769 行）。`cmdValidate` が設計ファイルに対して集める違反は、`validateSpecForm` である（`src/cli.ts` の 802 行）。続けて `collectChangeFilePathViolations` である（`src/cli.ts` の 805 行）。`readCanonicalIds` は、渡されたルートの `docs/canonical` 直下から識別子を読む（`src/conventions.ts` の 1591 行）。

差分の節の見出しは、行全体が `## 正本への差分` である（`src/conventions.ts` の 32 行）。項目の見出しは、`### 追加 <領域> REQ-<番号>`、`### 変更 <領域> REQ-<番号>`、`### 削除 <領域> REQ-<番号>` のいずれかである（`skills/sdd-cur/conventions.md` の 28 行）。正本は `docs/canonical/` に置く（`skills/sdd-cur/conventions.md` の 18 行）。「仕様の正本」の見出しは、この行である（`skills/sdd-cur/conventions.md` の 16 行）。

`spec-diff` は、リモートのデフォルトブランチの正本に差分を当てた結果と、作業ディレクトリの正本を比べる（`docs/canonical/spec.md` の 133 行）。README の「開発中の起動」の例に `bunx @paterapatera/sdd-cur validate <番号>` がある（`README.md` の 34 行）。正本は、README の「開発中の起動」のコマンド例と、そのあとのスキル呼び出し分の表を、サブコマンドをすべて含む対象から外す、と定める（`docs/canonical/docs.md` の 19 行）。

テストを足すときは、`src/<番号>.test.ts` だけに書く（`docs/conventions.md` の 31 行）。テストは `gh` を起動しない（`AGENTS.md` の 21 行）。

## 受け入れ条件

- 1. 条件: `src/cli.ts` の `switch` を見る 主体: `src/cli.ts` 結果: `spec-apply` がある
- 2. 条件: 使い方の表示を見る 主体: `src/cli.ts` 結果: 行全体が `sdd-cur spec-apply <番号>` である行がある
- 3. 条件: `docs/policy.md` の構成の表の `src/cli.ts` の行を見る 主体: その行 結果: バッククォートで囲んだ `spec-apply` を含む
- 4. 条件: `AGENTS.md` の「コマンド」のコードフェンスを見る 主体: そのフェンス 結果: 行全体が `bun src/cli.ts spec-apply <番号>` である行がある
- 5. 条件: 設計の `## 正本への差分` がある 主体: `spec-apply` 結果: `spec-diff` と同じ手順で期待値を作る。`docs/canonical/<領域>.md` へ書くのは、差分対象の識別子だけである
- 6. 条件: 追加の項目がある 主体: `spec-apply` 結果: その領域ファイルの末尾に、見出しが行全体で `## REQ-<番号>` である節を足す
- 7. 条件: 追加の項目の領域ファイルが無い 主体: `spec-apply` 結果: 最初の見出しが行全体で `# <領域>` であるファイルを作り、その末尾に受け入れ条件 6 の節を足す
- 8. 条件: 変更の項目がある 主体: `spec-apply` 結果: 同じ識別子の節の本文だけを置き換え、ほかの節の並びと本文は変えない
- 9. 条件: 削除の項目がある 主体: `spec-apply` 結果: その識別子の節を除く
- 10. 条件: `spec-apply` がファイルを書いたあと `spec-diff` を実行する。終了コードが 0 になる前提は、追加、変更、削除の対象でない節が、すでにリモートのデフォルトブランチの基準と一致していることである 主体: `spec-diff` 結果: 終了コードは 0 である
- 11. 条件: 設計に差分が無い、または設計が無い 主体: `spec-apply` 結果: 何も書かずに終了コード 0 で終わる
- 12. 条件: `validate` の「正本への差分」の検査に失敗する。失敗とは、追加する識別子が正本にあること、または変更する識別子か削除する識別子が正本に無いことである。検査は `validate` と同じ `validateCanonicalDelta` であり、識別子の集合は作業ツリーの `readCanonicalIds(cwd)` である 主体: `spec-apply` 結果: ファイルは書かない。違反は識別子ごとに標準エラーへ、`validateCanonicalDelta` が返す既存の日本語一行を書く。例は `追加する識別子が正本にあります: REQ-n` である。違反が複数あるときは一行ずつ標準エラーに書く。標準出力には書かない。終了コードは 1 である
- 13. 条件: 期待値の計算を見る 主体: `src/conventions.ts` 結果: `specDiff` から切り出した関数を `spec-apply` と共有する
- 14. 条件: 正本の一致の比較を見る 主体: `compareCanonicalMaps` 結果: 今の比較のまま使う
- 15. 条件: 節の本文を切り出して書き、再び読む 主体: 読み書き 結果: 切り出しは `canonicalReqBodiesFromMarkdown` と同じ規則であり、往復で本文が変わらないことをテストが確かめる
- 16. 条件: `## 正本への差分` の見出しの形と、`validate` の既存の検査を見る 主体: この課題 結果: 変えない
- 17. 条件: `spec-diff` の出力と終了コードを見る 主体: この課題 結果: 変えない
- 18. 条件: 既存の `docs/issues/<番号>/` を見る 主体: この課題 結果: 変えない
- 19. 条件: 正本にすでにある節のうち、追加、変更、削除の対象でない節の並びと本文を見る 主体: `spec-apply` 結果: 変えない。差分対象の識別子だけを書き換える
- 20. 条件: 実装スキルとサブエージェントの手順を見る 主体: この課題 結果: 変えない
- 21. 条件: 受け取る課題番号の数を見る 主体: `spec-apply` 結果: 一つである
- 22. 条件: 引数が一つでない 主体: `spec-apply` 結果: 終了コードは 1 であり、使い方を標準エラーへ書き、標準出力には書かない
- 23. 条件: 課題番号が不正である 主体: `spec-apply` 結果: 終了コードは 1 であり、標準エラーへ日本語の一行を書き、標準出力には書かない。その一行の字面は、設計で決める
- 24. 条件: 設計ファイルを読めない 主体: `spec-apply` 結果: 終了コードは 1 であり、標準エラーへ日本語の一行を書き、標準出力には書かない。その一行の字面は、設計で決める
- 25. 条件: git の起動に失敗した 主体: `spec-apply` 結果: 終了コードは 1 であり、標準エラーへ日本語の一行を書き、標準出力には書かない。その一行の字面は、設計で決める
- 26. 条件: README の「開発中の起動」を見る 主体: README 結果: `spec-apply` の起動例が 1 行ある。その行以外の、その節の既存の文は一文字も変わらない
- 27. 条件: `skills/sdd-cur/conventions.md` の「仕様の正本」を見る 主体: その節 結果: `spec-apply` が設計の `## 正本への差分` を `docs/canonical/` に書く旨の文が、1 文または 2 文ある。足す文以外の既存の文は一文字も変わらない

## 決定

`spec-apply` の「正本への差分」の検査は、`validate` と同じ `validateCanonicalDelta` である。

識別子の集合は、作業ツリーの `readCanonicalIds(cwd)` である。

検査に失敗したときは、ファイルは書かない。

違反は、識別子ごとに、標準エラーへ書く。

書く行は、`validateCanonicalDelta` が返す既存の日本語一行である。

例は `追加する識別子が正本にあります: REQ-n` である。

違反が複数あるときは、一行ずつ標準エラーに書く。

検査に失敗したとき、標準出力には書かない。

検査に失敗したとき、終了コードは 1 である。

`spec-apply` は、課題番号を一つ受け取る。

引数が一つでないときは、終了コードは 1 である。

引数が一つでないときは、使い方を標準エラーへ書く。

引数が一つでないときは、標準出力には書かない。

課題番号が不正なときは、終了コードは 1 である。

課題番号が不正なときは、標準エラーへ日本語の一行を書く。

課題番号が不正なときの、その一行の字面は、設計で決める。

課題番号が不正なときは、標準出力には書かない。

設計ファイルを読めないときは、終了コードは 1 である。

設計ファイルを読めないときは、標準エラーへ日本語の一行を書く。

設計ファイルを読めないときの、その一行の字面は、設計で決める。

設計ファイルを読めないときは、標準出力には書かない。

git の起動に失敗したときは、終了コードは 1 である。

git の起動に失敗したときは、標準エラーへ日本語の一行を書く。

git の起動に失敗したときの、その一行の字面は、設計で決める。

git の起動に失敗したときは、標準出力には書かない。

README の「開発中の起動」に、`spec-apply` の起動例を 1 行足す。

足す行以外の、その節の既存の文は一文字も変えない。

`skills/sdd-cur/conventions.md` の「仕様の正本」に、`spec-apply` が設計の `## 正本への差分` を `docs/canonical/` に書く旨を、1 文または 2 文足す。

足す文以外の既存の文は一文字も変えない。

`spec-apply` は、差分対象の識別子だけを書き換える。

追加、変更、削除の対象でない節の並びと本文は変えない。

`spec-diff` の終了コードが 0 になる前提は、追加、変更、削除の対象でない節が、すでにリモートのデフォルトブランチの基準と一致していることである。

## 関係する課題

課題は、次を関係するとする。

- #123（正本が差分どおりに変わったかを CLI で確かめる）
- #128（正本の要求にシナリオを持たせ、validate で検査する）

#123 は、`spec-diff` がリモートのデフォルトブランチの正本に差分を当てた結果と、作業ツリーの正本を比べる、と定める。この要件は、その比較の出力と終了コードを変えない。`spec-apply` は、`spec-diff` と同じ手順で期待値を作る。ファイルへ書くのは、差分対象の識別子だけである。追加、変更、削除の対象でない節の並びと本文は変えない。`spec-diff` の終了コードが 0 になる前提は、その対象でない節が、すでにリモートのデフォルトブランチの基準と一致していることである。`compareCanonicalMaps` は、今の比較のまま使う。

#128 は、追加と変更の項目の本文にシナリオの一行を一つ以上含め、印がある設計でそれが無いと `validate` が失敗する、と定める。この要件は、その規則と、`validate` の既存の検査を変えない。書く本文は、項目の本文である。

## 範囲外

次は、この要件に含めない。

- 実装スキルとサブエージェントの手順を変えること
- `spec-diff` の出力と終了コードを変えること
- `## 正本への差分` の見出しの形を変えること
- `validate` の既存の検査を変えること
- 既存の `docs/issues/<番号>/` を変えること
- 追加、変更、削除の対象でない、正本にすでにある節の並びと本文を変えること
