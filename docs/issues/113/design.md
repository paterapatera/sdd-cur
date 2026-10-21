# 113 仕様ディレクトリ spec と specs の名前を紛らわしくないものに変える

<!-- sdd-cur:form -->

対象は [Issue #113](https://github.com/paterapatera/sdd-cur/issues/113)。正本のディレクトリを `docs/canonical/` にし、課題ごとの要件と設計のディレクトリを `docs/issues/` にする。

重なる課題は #4、#86、#87、#122 である。

## 受け入れ条件

- 1. 条件: 正本のディレクトリを置く 主体: リポジトリ 結果: `docs/canonical/` である
- 2. 条件: 正本のファイルを置く 主体: リポジトリ 結果: `docs/canonical/<領域>.md` である
- 3. 条件: 課題ごとの要件のパスを返す 主体: `specPaths` 結果: `docs/issues/<番号>/requirements.md` である
- 4. 条件: 課題ごとの設計のパスを返す 主体: `specPaths` 結果: `docs/issues/<番号>/design.md` である
- 5. 条件: 正本のディレクトリ名と、課題ごとのディレクトリ名を選ぶ 主体: この課題 結果: `docs/canonical/` と `docs/issues/` 以外の候補は使わない
- 6. 条件: 既存の `docs/spec/` を移す 主体: 作業ツリー 結果: 同じファイル名が `docs/canonical/` にある
- 7. 条件: 移したあとの作業ツリーを見る 主体: 作業ツリー 結果: `docs/spec/` は無い
- 8. 条件: 既存の `docs/specs/<番号>/` を移す 主体: 作業ツリー 結果: 同じ相対パスが `docs/issues/<番号>/` にある
- 9. 条件: 移したあとの作業ツリーを見る 主体: 作業ツリー 結果: `docs/specs/` は無い
- 10. 条件: 履歴として残す課題ごとのファイルの場所を見る 主体: 作業ツリー 結果: `docs/issues/<番号>/` である
- 11. 条件: コードが正本を読む 主体: `readCanonicalIds` と `checkSpec` 結果: 読むディレクトリは `docs/canonical/` である
- 12. 条件: コードが課題ごとの要件と設計を読む 主体: `specPaths` 結果: 読むディレクトリは `docs/issues/` である
- 13. 条件: `docs/conventions.md` のパス表記を見る 主体: `docs/conventions.md` 結果: 正本は `docs/canonical/`、課題ごとの要件と設計は `docs/issues/<番号>/` である
- 14. 条件: `docs/policy.md` にある正本のパス表記を見る 主体: `docs/policy.md` 結果: `docs/canonical/` である
- 15. 条件: README にある課題ごとの要件と設計のパス表記を見る 主体: README 結果: `docs/issues/<番号>/` である
- 16. 条件: `AGENTS.md` にある課題ごとの要件と設計のパス表記を見る 主体: `AGENTS.md` 結果: `docs/issues/<番号>/` である
- 17. 条件: スキルのパス表記を見る 主体: `skills/` 結果: 正本は `docs/canonical/`、課題ごとの要件と設計は `docs/issues/<番号>/` である
- 18. 条件: テストのパス表記を見る 主体: `src/agents-files.test.ts` と `src/90.test.ts` 以外の `src/*.test.ts` 結果: 正本は `docs/canonical/`、課題ごとの要件と設計は `docs/issues/<番号>/` である
- 19. 条件: 正本の REQ のパス表記を見る 主体: `docs/canonical/` 結果: 正本は `docs/canonical/`、課題ごとの要件と設計は `docs/issues/<番号>/` である
- 20. 条件: 過去の課題ファイルの中のパス表記を見る 主体: この課題以外の `requirements.md` と `design.md` 結果: 正本は `docs/canonical/`、課題ごとの要件と設計は `docs/issues/<番号>/` である
- 21. 条件: この課題の「現状」を見る 主体: `docs/issues/113/requirements.md` 結果: 移す前のパスを、移す前のファイルの行を根拠にして残す
- 22. 条件: サブコマンド名を見る 主体: `src/cli.ts` 結果: `spec-check` のままである
- 23. 条件: ソースファイル名を見る 主体: 作業ツリー 結果: `src/spec.ts` のままである
- 24. 条件: `spec-check` が検査する正本のディレクトリを見る 主体: `spec-check` 結果: `docs/canonical/` である
- 25. 条件: `src/spec.ts` が読む正本のディレクトリを見る 主体: `src/spec.ts` 結果: `docs/canonical/` である

## 範囲外

次は、この要件に含めない。

- 要求の識別子を変えること
- 正本の `<領域>` の形を変えること
- 課題ごとのファイル名 `requirements.md` と `design.md` を変えること
- サブコマンドを新しく足すこと

## 決定

| 項目 | 内容 |
|---|---|
| 正本 | ディレクトリは `docs/canonical/`。ファイルは `docs/canonical/<領域>.md`。`<領域>` の形は変えない |
| 課題ごと | `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md`。ファイル名は変えない |
| 候補 | 正本と課題ごとのディレクトリに、`docs/canonical/` と `docs/issues/` 以外は使わない。リネーム案は採用しない |
| 移す正本 | `docs/spec/` 直下のファイルを、同じファイル名で `docs/canonical/` へ移す。移したあと `docs/spec/` は無い |
| 移す課題 | `docs/specs/<番号>/` のファイルを、同じ相対パスで `docs/issues/<番号>/` へ移す。移したあと `docs/specs/` は無い |
| 履歴 | 課題ごとのファイルは消さず、`docs/issues/<番号>/` に残す |
| コード | `specPaths` のディレクトリ文字列は `docs/issues/`。`readCanonicalIds` と `checkSpec` が読むディレクトリは `docs/canonical/`。`src/spec.ts` がパスを作るとき、`docs/canonical/` とファイル名を連結する。関数名は変えない |
| 名前 | サブコマンド名は `spec-check`。ソースファイル名は `src/spec.ts`。`src/cli.ts` は変えない |
| 検査 | `spec-check` が検査する正本は `docs/canonical/` 直下の `.md`。見つけたもののパスは `docs/canonical/<ファイル名>`。検査の他の規則は変えない |
| 置換 | 一段目は文字列 `docs/specs` を `docs/issues` にする。二段目は文字列 `docs/spec` を `docs/canonical` にする。一段目のあとで二段目を行う。変える文字は、この二つの文字列だけである |
| 置換の対象 | `docs/conventions.md`、`docs/policy.md`、README、`AGENTS.md`、`skills/` にあるスキル、既存の `src/*.test.ts`（`src/agents-files.test.ts` と `src/90.test.ts` を除く）、この課題以外の `requirements.md` と `design.md` |
| 置換しない | この課題の `requirements.md` と `design.md`。正本は、この置換を使わず、`## 正本への差分` のとおり変える。`src/agents-files.test.ts` と `src/90.test.ts`。この二つのテストファイルにある `docs/specs` と `docs/spec` は、`agents/` の本文を確かめる期待文字列であり、置換しない |
| 現状 | この課題の「現状」は、移す前のパスと、移す前のファイルの行の引用のまま残す |
| 見出し | 過去の課題ファイルの見出しにパス表記があるときも、同じ置換をする。課題 4 の見出しは、その一例である |
| 揃える範囲 | コード、`docs/conventions.md`、`docs/policy.md`、README、`AGENTS.md`、スキル、テスト、正本の REQ、過去の課題ファイルである。「コード・約束・正本 REQ だけ」と「実行時コードだけ」は、採用しない |
| テストの追加 | 新しい `test` は `src/113.test.ts` だけに書く。`src/agents-files.test.ts` と `src/90.test.ts` 以外の既存の `src/*.test.ts` は、パス文字列の置換だけを行い、新しい `test` は足さない。この二つのファイルは変えない |

移すファイルの本文に、文字列 `docs/specs` も文字列 `docs/spec` も無いときは、本文は変えない。

`src/113.test.ts` は、古いパスの文字列が残っていないことを確かめる検索語として、その文字列を持つ。検索語以外のパス表記は、新しいパスである。

## テスト

`bun test` で実行する。`gh` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。

新しい `test` は `src/113.test.ts` だけである。既存の `src/*.test.ts` に、新しい `test` は足さない。既存のテストファイルに行うのは、決定の置換だけである。

- 作業ツリーに `docs/canonical/` があり、直下の `.md` のファイル名は、移す前の `docs/spec/` 直下と同じである。`docs/spec/` は無い。[1][2][6][7]
- 作業ツリーに `docs/issues/<番号>/` があり、移す前の `docs/specs/<番号>/` と同じ相対パスのファイルがある。`docs/specs/` は無い。[8][9][10]
- `specPaths` が返す `dir` は `docs/issues/<番号>`、`requirements` は `docs/issues/<番号>/requirements.md`、`design` は `docs/issues/<番号>/design.md` である。[3][4][5][12]
- `src/conventions.ts` の `readCanonicalIds` と `src/spec.ts` の `checkSpec` が読むディレクトリは `docs/canonical` である。`src/spec.ts` が作るパスは `docs/canonical/` とファイル名を連結したものである。ファイル `src/spec.ts` がある。`src/cli.ts` にサブコマンド `spec-check` がある。[11][22][23][24][25]
- `docs/conventions.md`、`docs/policy.md`、README、`AGENTS.md`、`skills/` に、文字列 `docs/specs` と文字列 `docs/spec` が無い。[13][14][15][16][17]
- `src/113.test.ts`、`src/agents-files.test.ts`、`src/90.test.ts` 以外の `src/*.test.ts` に、文字列 `docs/specs` と文字列 `docs/spec` が無い。[18]
- `docs/canonical/` 直下の `.md` に、文字列 `docs/specs` と文字列 `docs/spec` が無い。[19]
- この課題以外の `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` に、文字列 `docs/specs` と文字列 `docs/spec` が無い。[5][20]
- この課題の `requirements.md` の「現状」節に、`docs/specs/<番号>/requirements.md`、`docs/spec/<領域>.md`、`docs/conventions.md` の 11 行、`src/conventions.ts` の 1498 行がある。「現状」節に `docs/canonical/` は無く、`docs/issues/` は無い。[21]
- 一時ディレクトリに `docs/canonical/` が無いとき、`bun src/cli.ts spec-check` の終了コードは 0 であり、標準出力も標準エラーも空である。`docs/canonical/a.md` に近い本文があるとき、標準エラーのパスは `docs/canonical/a.md` である。[24][25]

## 変えるファイル

- src/conventions.ts
- src/spec.ts
- src/113.test.ts
- src/89.test.ts
- src/122.test.ts
- src/cli.test.ts
- src/conventions.test.ts
- src/runner-skill-sdd-cur-fix.test.ts
- src/runner-skill-sdd-cur-implement.test.ts
- src/sdd-skill-sdd-cur.test.ts
- src/spec.test.ts
- docs/conventions.md
- docs/policy.md
- README.md
- AGENTS.md
- skills/sdd-cur/SKILL.md
- skills/sdd-cur-fix/SKILL.md
- skills/sdd-cur-implement/SKILL.md
- skills/sdd-cur-quick/SKILL.md
- docs/canonical/complete.md
- docs/canonical/conventions.md
- docs/canonical/docs.md
- docs/canonical/git.md
- docs/canonical/github.md
- docs/canonical/implement.md
- docs/canonical/install.md
- docs/canonical/labels.md
- docs/canonical/runner.md
- docs/canonical/sdd.md
- docs/canonical/spec.md
- docs/issues/1/design.md
- docs/issues/2/design.md
- docs/issues/3/design.md
- docs/issues/4/design.md
- docs/issues/5/design.md
- docs/issues/6/design.md
- docs/issues/6/requirements.md
- docs/issues/7/design.md
- docs/issues/7/requirements.md
- docs/issues/17/design.md
- docs/issues/17/requirements.md
- docs/issues/18/design.md
- docs/issues/18/requirements.md
- docs/issues/20/design.md
- docs/issues/20/requirements.md
- docs/issues/21/design.md
- docs/issues/21/requirements.md
- docs/issues/22/design.md
- docs/issues/22/requirements.md
- docs/issues/23/design.md
- docs/issues/23/requirements.md
- docs/issues/24/design.md
- docs/issues/24/requirements.md
- docs/issues/25/design.md
- docs/issues/25/requirements.md
- docs/issues/26/design.md
- docs/issues/26/requirements.md
- docs/issues/27/design.md
- docs/issues/27/requirements.md
- docs/issues/28/design.md
- docs/issues/28/requirements.md
- docs/issues/29/design.md
- docs/issues/29/requirements.md
- docs/issues/30/design.md
- docs/issues/30/requirements.md
- docs/issues/36/design.md
- docs/issues/36/requirements.md
- docs/issues/37/design.md
- docs/issues/37/requirements.md
- docs/issues/38/design.md
- docs/issues/38/requirements.md
- docs/issues/39/design.md
- docs/issues/39/requirements.md
- docs/issues/40/design.md
- docs/issues/40/requirements.md
- docs/issues/41/design.md
- docs/issues/41/requirements.md
- docs/issues/42/design.md
- docs/issues/42/requirements.md
- docs/issues/43/design.md
- docs/issues/43/requirements.md
- docs/issues/44/requirements.md
- docs/issues/45/design.md
- docs/issues/45/requirements.md
- docs/issues/46/design.md
- docs/issues/46/requirements.md
- docs/issues/47/design.md
- docs/issues/47/requirements.md
- docs/issues/48/design.md
- docs/issues/48/requirements.md
- docs/issues/53/design.md
- docs/issues/53/requirements.md
- docs/issues/55/design.md
- docs/issues/55/requirements.md
- docs/issues/56/design.md
- docs/issues/56/requirements.md
- docs/issues/69/design.md
- docs/issues/69/requirements.md
- docs/issues/72/design.md
- docs/issues/72/requirements.md
- docs/issues/73/design.md
- docs/issues/73/requirements.md
- docs/issues/75/design.md
- docs/issues/75/requirements.md
- docs/issues/81/design.md
- docs/issues/81/requirements.md
- docs/issues/82/design.md
- docs/issues/82/requirements.md
- docs/issues/83/design.md
- docs/issues/83/requirements.md
- docs/issues/84/design.md
- docs/issues/84/requirements.md
- docs/issues/85/design.md
- docs/issues/85/requirements.md
- docs/issues/86/design.md
- docs/issues/86/requirements.md
- docs/issues/87/design.md
- docs/issues/87/requirements.md
- docs/issues/88/design.md
- docs/issues/88/requirements.md
- docs/issues/89/design.md
- docs/issues/89/requirements.md
- docs/issues/90/design.md
- docs/issues/90/requirements.md
- docs/issues/91/design.md
- docs/issues/91/requirements.md
- docs/issues/92/design.md
- docs/issues/92/requirements.md
- docs/issues/93/design.md
- docs/issues/93/requirements.md
- docs/issues/94/design.md
- docs/issues/94/requirements.md
- docs/issues/95/design.md
- docs/issues/95/requirements.md
- docs/issues/96/design.md
- docs/issues/96/requirements.md
- docs/issues/97/design.md
- docs/issues/97/requirements.md
- docs/issues/113/design.md
- docs/issues/113/requirements.md
- docs/issues/115/design.md
- docs/issues/115/requirements.md
- docs/issues/116/design.md
- docs/issues/116/requirements.md
- docs/issues/122/design.md
- docs/issues/122/requirements.md
- docs/issues/132/design.md
- docs/issues/132/requirements.md

## 作業の一覧

- 1. `docs/spec/` 直下のファイルを同じファイル名で `docs/canonical/` へ移し、`docs/specs/<番号>/` のファイルを同じ相対パスで `docs/issues/<番号>/` へ移す。移したあと `docs/spec/` と `docs/specs/` は無い。[1][2][5][6][7][8][9][10]
- 2. `specPaths` のディレクトリ文字列を `docs/issues/` にし、`readCanonicalIds` と `checkSpec` が読むディレクトリと、`src/spec.ts` が作るパスを `docs/canonical/` にする。サブコマンド名 `spec-check` とファイル名 `src/spec.ts` は変えない。[3][4][11][12][22][23][24][25]
- 3. `docs/conventions.md`、`docs/policy.md`、README、`AGENTS.md` のパス表記を、決定の置換で新しいパスにする。[13][14][15][16]
- 4. `skills/` のパス表記を、決定の置換で新しいパスにする。[17]
- 5. `src/agents-files.test.ts` と `src/90.test.ts` 以外の既存の `src/*.test.ts` のパス表記を、決定の置換で新しいパスにする。この二つのファイルは変えない。新しい `test` は足さない。[18][22]
- 6. この課題以外の `requirements.md` と `design.md` のパス表記を、決定の置換で新しいパスにする。この課題の `requirements.md` と `design.md` は置換しない。この課題の「現状」は、移す前のパスと、移す前のファイルの行の引用のまま残す。[20][21]
- 7. この設計の `## 正本への差分` を、同じ作業ツリーの `docs/canonical/` へ反映する。要求ファイルと設計ファイルは変えない。[19]
- 8. `src/113.test.ts` で、上の結果を確かめる。[1][2][3][4][5][6][7][8][9][10][11][12][13][14][15][16][17][18][19][20][21][22][23][24][25]

## 関係する課題

- #4（課題ごとのファイルのパス）
- #86（正本の置き場所）
- #87（履歴として残すことと、レビューが読む範囲）
- #122（正本の検査）

#4 は、課題ごとの要件と設計のパスを `docs/specs/<番号>/requirements.md` と `docs/specs/<番号>/design.md` とする。この設計は、そのパスを `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` に移す。

#86 は、課題ごとのディレクトリとは別に、正本を `docs/spec/` に置く。この設計は、正本を `docs/canonical/` に移す。課題ごとのディレクトリは `docs/issues/` に移す。

#87 は、既存の `docs/specs/<番号>/` を消さず、履歴として残す。レビューが読む正本は `docs/spec/` である。この設計は、その履歴を `docs/issues/<番号>/` へ移す。移したあと、`docs/specs/` は残さない。レビューが読む正本は `docs/canonical/` である。

#122 は、検査する正本を、作業ディレクトリの `docs/spec/` とする。この設計は、検査する正本のディレクトリを `docs/canonical/` に揃える。サブコマンド名 `spec-check` とファイル名 `src/spec.ts` は変えない。

## 正本への差分

### 変更 spec REQ-1

もとになった課題は #113 である。

正本は `docs/canonical/<領域>.md` に置く。`<領域>` は英小文字で始まり、英小文字と数字が続き、区切りのハイフンを含んでよい。課題ごとの要件と設計は `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` である。

### 変更 spec REQ-6

もとになった課題は #113 である。

設計のレビュー役は、`## 正本への差分` の各項目が、識別子付きの追加、変更、削除のいずれかとして書かれていることを見る。変更と削除の項目に、その識別子の要求の内容があることを見る。差分だけで、何が変わるかが読めることを見る。識別子が当時の正本に対して追加、変更、削除のどれに該当するかは見ない。その機械確認は #85 の検査が行う。#85 の検査を通った前提で、差分が課題の受け入れ条件と矛盾しないことを見る。他の課題の `docs/issues/` との食い違いと巻き戻しは、これまでどおり見る。マージ後の正本が差分どおりかは見ない。

### 変更 spec REQ-7

もとになった課題は #113 である。

実装の作成役は、コードと同じ作業ツリーで、設計の `## 正本への差分` を `docs/canonical/` へ反映する。要求ファイルと設計ファイルは変えない。正本の変更は、その実装のマージリクエストに入る。

### 変更 spec REQ-9

もとになった課題は #113 である。

実装レビュー役は、作業ツリーの `docs/canonical/` が、その課題の設計の `## 正本への差分` どおりに変わったかを見る。

### 変更 spec REQ-804

もとになった課題は #113 である。

サブコマンド名は `spec-check` である。引数が無いときの起動は `bun src/cli.ts spec-check` である。使い方の表示には、行全体が `sdd-cur spec-check` である行がある。検査する正本は、作業ディレクトリの `docs/canonical/` 直下の `.md` である。サブディレクトリは見ない。

### 変更 spec REQ-806

もとになった課題は #113 である。

作業ディレクトリに `docs/canonical/` が無いときは、見つけたものが一件も無いときと同じである。終了コードは 0 である。標準出力には書かない。標準エラーには書かない。

### 変更 spec REQ-807

もとになった課題は #113 である。

`docs/canonical/` があり、読み取りに失敗したとき、標準エラーは `正本を読めません` の一行である。終了コードは 1 である。標準出力には書かない。見つけたものの行は書かない。

### 変更 spec REQ-808

もとになった課題は #113 である。

`spec-check` は、同じ `docs/canonical/<ファイル名>` にある二つの要求の組を見る。別のファイルの要求は組にしない。比較する本文は、要求の本文から、行全体が `もとになった課題は #<番号> である。` である行を除いた残りである。`<番号>` は十進で、先頭の零は無い。近さは、その残りの、隣り合う二つの符号位置を一つとする 2-gram の集合の Jaccard 係数である。同じ 2-gram は集合に一つである。共通の個数を n、和集合の個数を u とする。u が 0 のときは近くない。u が 1 以上で n * 5 が u * 3 以上のとき、その組は近い。近い組は、その組を一件として数える。

### 変更 spec REQ-811

もとになった課題は #113 である。

識別子の重複とは、行全体が同じ `## REQ-<番号>` である見出しが、`docs/canonical/` 直下の `.md` に二度以上あることである。`<番号>` は十進で、先頭の零は無い。重複は、識別子ごとに一件である。同じ識別子が三回以上あっても一件である。

### 変更 spec REQ-812

もとになった課題は #113 である。

見つけたもの一件につき、標準エラーへ日本語の一行を書く。識別子の重複は `識別子が重複しています: ` のあとに識別子と、出現ごとの `docs/canonical/<ファイル名>` を書く。空の本文は `本文が空です: ` のあとにパスと識別子を書く。壊れた文末は `壊れた文末です: ` のあとにパスと行番号と識別子を書く。近い組は `本文が近いです: ` のあとにパスと、ファイルの中で先に出る識別子と、後に出る識別子を書く。種類が違う見つけたものは別の行であり、順は識別子の重複、空の本文、壊れた文末、近い組である。一件以上あるとき終了コードは 1 である。一件も無いとき終了コードは 0 であり、標準エラーには書かない。見つけたものは標準出力には書かない。一件も無いときも標準出力には書かない。

### 変更 spec REQ-814

もとになった課題は #113 である。

テストは、一時ディレクトリを作業ディレクトリにして `bun src/cli.ts spec-check` を実行する。今のリポジトリの `docs/canonical/` がこの検査を通ることは、受け入れ条件にしない。

### 変更 conventions REQ-96

もとになった課題は #113 である。

パスは`docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md`。`<番号>` は十進で、先頭の零は付けないである。

### 変更 conventions REQ-148

もとになった課題は #113 である。

要求レビュー役が食い違いと巻き戻りを探すときに読んで比べる範囲は、`docs/canonical/` の正本と、対象課題の `docs/issues/<番号>/requirements.md` の「関係する課題」に挙げた課題の仕様だけである。挙げた課題の仕様は、その課題の `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` である。

### 変更 conventions REQ-149

もとになった課題は #113 である。

設計レビュー役が食い違いと巻き戻りを探すときに読んで比べる範囲は、`docs/canonical/` の正本と、対象課題の `docs/issues/<番号>/design.md` の「関係する課題」に挙げた課題の仕様だけである。挙げた課題の仕様は、その課題の `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` である。

### 変更 conventions REQ-150

もとになった課題は #113 である。

既存の `docs/issues/<番号>/` は消さず、履歴として残す。

### 変更 sdd REQ-260

もとになった課題は #113 である。

既存の仕様は同じ手順を定める既存の要件と設計。置き場所は `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` である

### 変更 sdd REQ-292

もとになった課題は #113 である。

仕様ファイルは、`docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` である。

### 変更 sdd REQ-296

もとになった課題は #113 である。

仕様ファイルは`docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md`である。

### 変更 sdd REQ-362

もとになった課題は #113 である。

パスは要求は `docs/issues/<番号>/requirements.md`。設計は `docs/issues/<番号>/design.md`。リポジトリルートから書く。`/` や `./` では始めない。`<番号>` は先頭の零を付けない十進である

### 変更 sdd REQ-417

もとになった課題は #113 である。

要件と設計のパスは `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` である。作成、レビュー、修正の段は、今の要求と設計の段と同じである。

### 変更 sdd REQ-439

もとになった課題は #113 である。

要件と設計は、`docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` に残す。

### 変更 sdd REQ-446

もとになった課題は #113 である。

要件と設計のファイルは、今と同様に残す。パスは `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` である。

### 変更 sdd REQ-757

もとになった課題は #113 である。

`sdd-cur-explore` は読み取り専用である。今のコードを調べる。課題番号に紐づく調査として、`show` が返した課題本文とコメントも調べる。`show` は実行しない。仕様として調べる範囲は、`docs/canonical/` と、対象課題の `docs/issues/<番号>/` である。

### 変更 docs REQ-816

もとになった課題は #113 である。

`docs/policy.md` の構成の表に `src/spec.ts` の行がある。この行は、`docs/canonical/` 直下の要求について、近い本文、壊れた文末、空の本文、識別子の重複を検査する、と書く。

### 変更 runner REQ-499

もとになった課題は #113 である。

ブランチは名前は `sdd-cur/<番号>`。起点はリモートのデフォルトブランチであり、`createBranch` がその参照の現在の SHA から作る。ここが、push 済みの `docs/issues` を含むリモートの状態である

### 変更 runner REQ-500

もとになった課題は #113 である。

作業ツリーはリモートブランチを `fetch` し、その `FETCH_HEAD` をローカルブランチとして checkout する。実装のスキルは、この作業ツリーの `docs/issues` を読むである。
