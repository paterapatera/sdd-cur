# 163 配布するスキルとサブエージェントから、このリポジトリ固有の課題番号と古い正本のパスを除く

<!-- sdd-cur:form -->

対象は [Issue #163](https://github.com/paterapatera/sdd-cur/issues/163)。`install` が他のプロジェクトへコピーするスキルとサブエージェントから、このリポジトリ固有の課題番号と、正本の古いパス `docs/spec/` を除く。正本は `docs/canonical/<領域>.md` である。配布物では、課題番号に頼らず、意味の分かる言葉かコマンド名で書く。スキルとサブエージェントの手順と判定は変えない。このリポジトリの `docs/issues/` と `docs/canonical/` にある課題番号の参照は、履歴として残す。

重なる課題は #85、#86、#114 である。

## 受け入れ条件

- 1. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-reviewer.md` 結果: 文字列 `docs/spec/` が無い
- 2. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-reviewer-high.md` 結果: 文字列 `docs/spec/` が無い
- 3. 条件: 本要件を実装した 主体: `agents/sdd-cur-design-reviewer.md` 結果: 文字列 `docs/spec/` が無い
- 4. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-reviewer.md` 結果: 「正本は、`docs/canonical/<領域>.md` である。」がある
- 5. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-reviewer-high.md` 結果: 「正本は、`docs/canonical/<領域>.md` である。」がある
- 6. 条件: 本要件を実装した 主体: `agents/sdd-cur-design-reviewer.md` 結果: 「正本は、`docs/canonical/<領域>.md` である。」がある
- 7. 条件: 本要件を実装した 主体: 受け入れ条件 1 から受け入れ条件 3 までの三ファイル 結果: `設計 86` が無い
- 8. 条件: 本要件を実装した 主体: `skills/sdd-cur/conventions.md` 結果: 「要求レビュー役が食い違いと巻き戻りを探すときに読んで比べる範囲は、正本と、対象課題の `docs/issues/<番号>/requirements.md` の「関係する課題」に挙げた課題の仕様だけである。正本は `docs/canonical/` に置く。」がある
- 9. 条件: 本要件を実装した 主体: `skills/sdd-cur/conventions.md` 結果: 「設計レビュー役が食い違いと巻き戻りを探すときに読んで比べる範囲は、正本と、対象課題の `docs/issues/<番号>/design.md` の「関係する課題」に挙げた課題の仕様だけである。正本は `docs/canonical/` に置く。」がある
- 10. 条件: 本要件を実装した 主体: `skills/sdd-cur/conventions.md` 結果: `#86` が無い
- 11. 条件: 本要件を実装した 主体: `skills/sdd-cur/SKILL.md` 結果: 「要求の未記載の質問で人が通常の選択肢を選んだあとの要求作成役の再起動は、同じ要求の続きであり、作成の high の 2 回目に数えない。」がある
- 12. 条件: 本要件を実装した 主体: `skills/sdd-cur/SKILL.md` 結果: `設計 26` が無い
- 13. 条件: 本要件を実装した 主体: `skills/sdd-cur/SKILL.md` 結果: 「閉じるかどうかの確認は、根拠を示せるときに `閉じる` と `閉じない` を出す。」がある
- 14. 条件: 本要件を実装した 主体: `skills/sdd-cur/SKILL.md` 結果: 「根拠を示せるときは、合格の案内より先に、`閉じる` と `閉じない` を出す。」がある
- 15. 条件: 本要件を実装した 主体: `skills/sdd-cur/SKILL.md` 結果: `#114` が無い
- 16. 条件: 本要件を実装した 主体: `docs/policy.md` の「誰のための道具か」 結果: 本文が「このリポジトリは `@paterapatera/sdd-cur` である。Cursor、GitHub（`gh`）、Bun があれば、どのプロジェクトでも使える SDD スキルと課題ランナーである。」である
- 17. 条件: `src/163.test.ts` が、`skills/` 配下のファイルと、`install` がコピーする `agents/` のサブエージェントファイルを読む 主体: そのテスト 結果: `#` の直後が十進数字である部分と、`設計 ` の直後が十進数字である部分が、どのファイルにも無い
- 18. 条件: 本要件を実装した 主体: `src/conventions.test.ts` 結果: 受け入れ条件 8 の文を期待する
- 19. 条件: 本要件を実装した 主体: `src/conventions.test.ts` 結果: 受け入れ条件 9 の文を期待する
- 20. 条件: 本要件を実装した 主体: `src/129.test.ts` 結果: 「閉じるかどうかの確認の出し方は、#114 のままである。」を期待しない
- 21. 条件: 本要件を実装した 主体: `src/129.test.ts` 結果: 受け入れ条件 13 の文を期待する
- 22. 条件: 本要件を実装した 主体: `src/agents-files.test.ts` 結果: `sdd-cur-req-reviewer.md` に期待する文言が `docs/canonical/` であり、`docs/spec/` ではない
- 23. 条件: 本要件を実装した 主体: `src/agents-files.test.ts` 結果: `sdd-cur-design-reviewer.md` に期待する文言が `docs/canonical/` であり、`docs/spec/` ではない
- 24. 条件: 本要件を実装した 主体: `agents/sdd-cur-design-reviewer.md` 結果: 「それは識別子が正本にあるかを見る検査である。」がある
- 25. 条件: 本要件を実装した 主体: `agents/sdd-cur-design-reviewer.md` 結果: 「識別子が正本にあるかを見る検査を通った前提で、差分の本文が、その課題の受け入れ条件と矛盾する。」がある
- 26. 条件: 本要件を実装した 主体: `agents/sdd-cur-design-reviewer.md` 結果: `#85` が無い
- 27. 条件: 本要件を実装した 主体: `agents/sdd-cur-design-reviewer.md` 結果: `spec-diff` が無い
- 28. 条件: 本要件を実装した 主体: `install` がコピーする `agents/` の各ファイル 結果: 文字列 `docs/spec/` が無い
- 29. 条件: 本要件を実装した 主体: `install` がコピーする `agents/` の各ファイル 結果: 文字列 `docs/specs/` が無い
- 30. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-reviewer.md` 結果: 「`docs/canonical/` 直下の `.md` と、対象課題の `docs/issues/<番号>/requirements.md`」がある
- 31. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-reviewer.md` 結果: 「`docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md`」がある
- 32. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-reviewer.md` 結果: 「`docs/canonical/` が無いときは、正本の比較対象は空である。」がある
- 33. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-reviewer-high.md` 結果: 「`docs/canonical/` 直下の `.md` と、対象課題の `docs/issues/<番号>/requirements.md`」がある
- 34. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-reviewer-high.md` 結果: 「`docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md`」がある
- 35. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-reviewer-high.md` 結果: 「`docs/canonical/` が無いときは、正本の比較対象は空である。」がある
- 36. 条件: 本要件を実装した 主体: `agents/sdd-cur-design-reviewer.md` 結果: 「`docs/canonical/` 直下の `.md` と、対象課題の `docs/issues/<番号>/design.md`」がある
- 37. 条件: 本要件を実装した 主体: `agents/sdd-cur-design-reviewer.md` 結果: 「`docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md`」がある
- 38. 条件: 本要件を実装した 主体: `agents/sdd-cur-design-reviewer.md` 結果: 「`docs/canonical/` が無いときは、正本の比較対象は空である。」がある
- 39. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-author.md` 結果: 「人が指定した課題の `docs/issues/<番号>/requirements.md` だけを書く。」がある
- 40. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-author.md` 結果: 「書いてよいのは、`docs/issues/<番号>/requirements.md` だけである。」がある
- 41. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-author.md` 結果: 「リポジトリルートからの相対パス `docs/issues/<番号>/requirements.md`」がある
- 42. 条件: 本要件を実装した 主体: `agents/sdd-cur-req-fixer.md` 結果: 「書いてよいのは、`docs/issues/<番号>/requirements.md` だけである。」がある
- 43. 条件: 本要件を実装した 主体: `agents/sdd-cur-design-author.md` 結果: 「人が指定した課題の `docs/issues/<番号>/design.md` だけを書く。」がある
- 44. 条件: 本要件を実装した 主体: `agents/sdd-cur-design-author.md` 結果: 「書いてよいのは、`docs/issues/<番号>/design.md` だけである。」がある
- 45. 条件: 本要件を実装した 主体: `agents/sdd-cur-design-author.md` 結果: 「リポジトリルートからの相対パス `docs/issues/<番号>/design.md`」がある
- 46. 条件: 本要件を実装した 主体: `agents/sdd-cur-design-fixer.md` 結果: 「書いてよいのは、`docs/issues/<番号>/design.md` だけである。」がある
- 47. 条件: 本要件を実装した 主体: `agents/sdd-cur-implement-author.md` 結果: 「`docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` を読む。」がある
- 48. 条件: 本要件を実装した 主体: `agents/sdd-cur-implement-author.md` 結果: 「同じ作業ツリーの `docs/canonical/` へ反映する。」がある
- 49. 条件: 本要件を実装した 主体: `agents/sdd-cur-implement-author.md` 結果: 「項目が無いときは、`docs/canonical/` を変えない。」がある
- 50. 条件: 本要件を実装した 主体: `agents/sdd-cur-implement-author.md` 結果: 「`docs/canonical/` のファイルは、作業ツリーの実装に含める。」がある
- 51. 条件: 本要件を実装した 主体: `agents/sdd-cur-implement-fixer.md` 結果: 「`docs/canonical/` のファイルは、作業ツリーの実装に含める。」がある
- 52. 条件: 本要件を実装した 主体: `agents/sdd-cur-implement-fixer.md` 結果: 「差分が `docs/canonical/` を変えるときは、そのファイルを変えてよい。」がある
- 53. 条件: 本要件を実装した 主体: `agents/sdd-cur-explore.md` 結果: 「仕様として調べる範囲は、`docs/canonical/` と、対象課題の `docs/issues/<番号>/` である。」がある
- 54. 条件: 本要件を実装した 主体: `src/agents-files.test.ts` 結果: 「書いてよいのは、`docs/issues/<番号>/requirements.md` だけである。」を期待する
- 55. 条件: 本要件を実装した 主体: `src/agents-files.test.ts` 結果: 「書いてよいのは、`docs/issues/<番号>/design.md` だけである。」を期待する
- 56. 条件: 本要件を実装した 主体: `src/agents-files.test.ts` 結果: `sdd-cur-implement-author.md` に期待する文言が `docs/canonical/` であり、`docs/spec/` ではない
- 57. 条件: 本要件を実装した 主体: `src/agents-files.test.ts` 結果: `sdd-cur-implement-fixer.md` に期待する文言が `docs/canonical/` であり、`docs/spec/` ではない
- 58. 条件: 本要件を実装した 主体: `src/90.test.ts` 結果: `docs/canonical/` を期待する
- 59. 条件: 本要件を実装した 主体: `src/90.test.ts` 結果: `docs/issues/<番号>/` を期待する
- 60. 条件: 課題 163 の `docs/issues/163/requirements.md` の「現状」に古いパスの文字列がある 主体: `src/113.test.ts` 結果: その文字列だけでは失敗しない
- 61. 条件: 本要件を実装した 主体: `src/agents-files.test.ts` の `bodyIncludes` 結果: `docs/specs/` が無い
- 62. 条件: 本要件を実装した 主体: `src/90.test.ts` が期待する文言 結果: `docs/spec/` が無い
- 63. 条件: 本要件を実装した 主体: `src/90.test.ts` が期待する文言 結果: `docs/specs/` が無い

## 範囲外

次は、この要件に含めない。

- レビューが指摘にする条件、判定行、確認行、起動する役の名前
- 閉じるかどうかの確認で、根拠を示せるときに `閉じる` と `閉じない` を出し、合格の案内より先であり、`閉じる` を選んだときに `sdd-cur close <番号>` を実行すること
- 要求の未記載の質問のあと、要求作成役の再起動を作成の high の 2 回目に数えないこと
- `docs/issues/` と `docs/canonical/` に既にある、課題番号での参照
- `init` が他のプロジェクトへ書く `docs/policy.md` のひな型
- `skills/sdd-cur/SKILL.md` の frontmatter
- 新しい `test` を、`src/163.test.ts` 以外の `src/*.test.ts` に足すこと
- `validateCanonicalDelta` を CLI のコマンドから呼ぶこと
- `spec-diff` の比較対象を変えること

## 決定

| 項目 | 内容 |
|---|---|
| 設計レビュー役の検査の呼び方 | 「#85 の検査」は書かない。「識別子が正本にあるかを見る検査」と書く。`sdd-cur spec-diff` の検査は、採用しない |
| 三つのレビュー役の課題ごとのパス | `docs/specs/<番号>/` は `docs/issues/<番号>/` にする。三つのレビュー役に `docs/specs/<番号>/` を残すことは、採用しない |
| `install` がコピーする `agents/` | すべてで、文字列 `docs/spec/` は `docs/canonical/` にし、文字列 `docs/specs/` は `docs/issues/` にする。手を入れる対象に書いたファイルだけ変えることは、採用しない |
| 課題番号の参照 | `skills/` 配下と `install` がコピーする `agents/` から、`#` の直後が十進数字である部分と、`設計 ` の直後が十進数字である部分を除く。課題番号を受け取る `<番号>` は残す |
| `docs/policy.md` | 「誰のための道具か」の本文だけを、受け入れ条件 16 の一文にする。他の節は変えない |
| 正本 | 実装は `docs/canonical/` を変えない。この設計の `## 正本への差分` に項目は無い |

三つの要求・設計レビュー役の起動時第 6 項は、次の形にそろえる。要求レビュー役と要求レビュー役 high は、食い違いと巻き戻りを探すときは、`docs/canonical/` 直下の `.md` と、対象課題の `docs/issues/<番号>/requirements.md` の「関係する課題」に挙げた課題の仕様だけを読んで比べる。設計レビュー役は、対象が `docs/issues/<番号>/design.md` である。正本は、`docs/canonical/<領域>.md` である。挙げた課題の仕様は、その課題の `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` である。`docs/canonical/` が無いときは、正本の比較対象は空である。

設計レビュー役の「識別子が正本にあるかは見ない。」の直後は、「それは識別子が正本にあるかを見る検査である。」とする。指摘の「#85 の検査を通った前提で、差分の本文が、その課題の受け入れ条件と矛盾する。」は、「識別子が正本にあるかを見る検査を通った前提で、差分の本文が、その課題の受け入れ条件と矛盾する。」にする。

`skills/sdd-cur/conventions.md` の「## レビューが読む範囲」の二文は、受け入れ条件 8 と受け入れ条件 9 の一文に置き換える。`#86` は残さない。

`skills/sdd-cur/SKILL.md` の「設計 26 の質問で人が通常の選択肢を選んだあとの要求作成役の再起動は、同じ要求の続きであり、作成の high の 2 回目に数えない。」は、「要求の未記載の質問で人が通常の選択肢を選んだあとの要求作成役の再起動は、同じ要求の続きであり、作成の high の 2 回目に数えない。」に置き換える。「閉じるかどうかの確認の出し方は、#114 のままである。」は、「閉じるかどうかの確認は、根拠を示せるときに `閉じる` と `閉じない` を出す。」に置き換える。「根拠を示せるときは、合格の案内より先に、`閉じる` と `閉じない` を出す。」は残す。

作成・修正・実装・調査の各サブエージェントは、本文中の `docs/specs/<番号>/` を `docs/issues/<番号>/` に、`docs/spec/` を `docs/canonical/` に置き換える。手順と判定の意味は変えない。

`src/conventions.test.ts` は、`skills/sdd-cur/conventions.md` を読むテストで、受け入れ条件 8 と 9 の文を期待する。`#86 で作る正本` を含む期待は除く。

`src/129.test.ts` は、「満たされているかの判断」に関するテストで、「閉じるかどうかの確認の出し方は、#114 のままである。」を期待しない。受け入れ条件 13 の文を期待する。

`src/agents-files.test.ts` は、`bodyIncludes` の期待文字列を、上のパス置換と受け入れ条件 54 と 55 にそろえる。`docs/spec/` と `docs/specs/` を期待しない。

`src/90.test.ts` は、期待する文言を `docs/canonical/` と `docs/issues/<番号>/` にそろえる。`docs/spec/` と `docs/specs/` を期待しない。

`src/113.test.ts` は、課題 113 と課題 163 以外の `docs/issues/<番号>/requirements.md` と `design.md` に、旧パス文字列が無いことを確かめる。課題 163 の「現状」に古いパスが残っていても失敗しない。

`src/163.test.ts` は新規である。`skills/` 配下のファイルと、`install` がコピーする `agents/` のサブエージェントファイルを読み、`#` の直後が十進数字である部分と、`設計 ` の直後が十進数字である部分が、どのファイルにも無いことを確かめる。

## テスト

`bun test` で実行する。`gh` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。

新しい `test` は `src/163.test.ts` だけに書く。既存の `src/*.test.ts` に、新しい `test` は足さない。既存のテストファイルに行うのは、期待文字列の置換と、課題 163 を `src/113.test.ts` の除外に足すことだけである。

- `agents/sdd-cur-req-reviewer.md`、`agents/sdd-cur-req-reviewer-high.md`、`agents/sdd-cur-design-reviewer.md` に文字列 `docs/spec/` が無く、「正本は、`docs/canonical/<領域>.md` である。」があり、`設計 86` が無い。設計レビュー役には受け入れ条件 24 から 27 と 36 から 38 の文言がある。[1][2][3][4][5][6][7][24][25][26][27][30][31][32][33][34][35][36][37][38]
- `skills/sdd-cur/conventions.md` に受け入れ条件 8 と 9 の文があり、`#86` が無い。[8][9][10]
- `skills/sdd-cur/SKILL.md` に受け入れ条件 11、13、14 の文があり、`設計 26` と `#114` が無い。[11][12][13][14][15]
- `docs/policy.md` の「誰のための道具か」が受け入れ条件 16 の一文である。[16]
- `install` がコピーする `agents/` の各ファイルに `docs/spec/` と `docs/specs/` が無く、作成・修正・実装・調査の各ファイルに受け入れ条件 39 から 53 の文言がある。[28][29][39][40][41][42][43][44][45][46][47][48][49][50][51][52][53]
- `src/163.test.ts` が配布物に課題番号形式の `#` 数字と `設計 ` 数字を残していない。[17]
- `src/conventions.test.ts` が受け入れ条件 8 と 9 の文を期待する。[18][19]
- `src/129.test.ts` が「#114 のまま」を期待せず、受け入れ条件 13 の文を期待する。[20][21]
- `src/agents-files.test.ts` と `src/90.test.ts` が新しいパスを期待し、古いパスを期待しない。[22][23][54][55][56][57][58][59][61][62][63]
- `src/113.test.ts` が課題 163 の要件の「現状」だけでは失敗しない。[60]

## 作業の一覧

- 1. 三つのレビュー役の起動時の読む範囲、正本のパス、設計レビュー役の検査の呼び方を、決定どおりに書き換える。[1][2][3][4][5][6][7][24][25][26][27][30][31][32][33][34][35][36][37][38]
- 2. `install` がコピーする `agents/` の残りのファイルのパス表記を、決定の置換で `docs/issues/` と `docs/canonical/` にそろえる。[28][29][39][40][41][42][43][44][45][46][47][48][49][50][51][52][53]
- 3. `skills/sdd-cur/conventions.md` の「## レビューが読む範囲」を、受け入れ条件 8 と 9 の文に置き換える。[8][9][10]
- 4. `skills/sdd-cur/SKILL.md` の課題番号参照と閉じる確認の文を、決定どおりに置き換える。frontmatter は変えない。[11][12][13][14][15]
- 5. `docs/policy.md` の「誰のための道具か」を、受け入れ条件 16 の一文にする。[16]
- 6. `src/conventions.test.ts`、`src/129.test.ts`、`src/agents-files.test.ts`、`src/90.test.ts`、`src/113.test.ts` の期待を決定どおりにそろえる。[18][19][20][21][22][23][54][55][56][57][58][59][60][61][62][63]
- 7. `src/163.test.ts` を新規に書き、配布物に課題番号形式の参照が残っていないことを確かめる。[17]

## 変えるファイル

- agents/sdd-cur-req-author.md
- agents/sdd-cur-req-reviewer.md
- agents/sdd-cur-req-reviewer-high.md
- agents/sdd-cur-req-fixer.md
- agents/sdd-cur-design-author.md
- agents/sdd-cur-design-reviewer.md
- agents/sdd-cur-design-fixer.md
- agents/sdd-cur-implement-author.md
- agents/sdd-cur-implement-fixer.md
- agents/sdd-cur-explore.md
- skills/sdd-cur/conventions.md
- skills/sdd-cur/SKILL.md
- docs/policy.md
- src/conventions.test.ts
- src/129.test.ts
- src/agents-files.test.ts
- src/90.test.ts
- src/113.test.ts
- src/163.test.ts

## 関係する課題

- #85（「#85 の検査」と書いてある元）
- #86（「#86 で作る正本」と書いてある元）
- #114（閉じるかどうかの確認の出し方の元）

## 正本への差分

項目が無いときは、正本を変えない。
