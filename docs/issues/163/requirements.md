# 163 配布するスキルとサブエージェントから、このリポジトリ固有の課題番号と古い正本のパスを除く

<!-- sdd-cur:form -->

対象は [Issue #163](https://github.com/paterapatera/sdd-cur/issues/163)。`install` が他のプロジェクトへコピーするスキルとサブエージェントから、このリポジトリ固有の課題番号と、正本の古いパス `docs/spec/` を除く。正本は `docs/canonical/<領域>.md` である。配布物では、課題番号に頼らず、意味の分かる言葉かコマンド名で書く。スキルとサブエージェントの手順と判定は変えない。このリポジトリの `docs/issues/` と `docs/canonical/` にある課題番号の参照は、履歴として残す。

## 現状

`installSkills` は `skills/` 直下のディレクトリをコピーする（`src/install.ts` の 110 行）。

`installAgents` は `subagentFileNames` のファイルをコピーする（`src/install.ts` の 126 行）。

`subagentFileNames` の並びは `src/install.ts` の 7 行から始まる（`src/install.ts` の 7 行）。

食い違いと巻き戻りを探すときに読む範囲は、`docs/spec/` 直下の `.md` と、対象課題の `docs/specs/<番号>/requirements.md` の「関係する課題」に挙げた課題の仕様だけを読んで比べる、と書く（`agents/sdd-cur-req-reviewer.md` の 21 行）。

正本は、設計 86 が置く `docs/spec/<領域>.md` である、と書く（`agents/sdd-cur-req-reviewer.md` の 22 行）。

挙げた課題の仕様は、その課題の `docs/specs/<番号>/requirements.md` と `docs/specs/<番号>/design.md` である、と書く（`agents/sdd-cur-req-reviewer.md` の 23 行）。

`docs/spec/` が無いときは、正本の比較対象は空である、と書く（`agents/sdd-cur-req-reviewer.md` の 29 行）。

食い違いと巻き戻りを探すときに読む範囲は、`docs/spec/` 直下の `.md` と、対象課題の `docs/specs/<番号>/requirements.md` の「関係する課題」に挙げた課題の仕様だけを読んで比べる、と書く（`agents/sdd-cur-req-reviewer-high.md` の 21 行）。

正本は、設計 86 が置く `docs/spec/<領域>.md` である、と書く（`agents/sdd-cur-req-reviewer-high.md` の 22 行）。

挙げた課題の仕様は、その課題の `docs/specs/<番号>/requirements.md` と `docs/specs/<番号>/design.md` である、と書く（`agents/sdd-cur-req-reviewer-high.md` の 23 行）。

`docs/spec/` が無いときは、正本の比較対象は空である、と書く（`agents/sdd-cur-req-reviewer-high.md` の 29 行）。

食い違いと巻き戻りを探すときに読む範囲は、`docs/spec/` 直下の `.md` と、対象課題の `docs/specs/<番号>/design.md` の「関係する課題」に挙げた課題の仕様だけを読んで比べる、と書く（`agents/sdd-cur-design-reviewer.md` の 21 行）。

正本は、設計 86 が置く `docs/spec/<領域>.md` である、と書く（`agents/sdd-cur-design-reviewer.md` の 22 行）。

挙げた課題の仕様は、その課題の `docs/specs/<番号>/requirements.md` と `docs/specs/<番号>/design.md` である、と書く（`agents/sdd-cur-design-reviewer.md` の 23 行）。

`docs/spec/` が無いときは、正本の比較対象は空である、と書く（`agents/sdd-cur-design-reviewer.md` の 29 行）。

設計レビュー役は、識別子が正本にあるかは見ない、と書く（`agents/sdd-cur-design-reviewer.md` の 37 行）。

それは #85 の検査である、と書く（`agents/sdd-cur-design-reviewer.md` の 38 行）。

#85 の検査を通った前提で、差分の本文が、その課題の受け入れ条件と矛盾する、と書く（`agents/sdd-cur-design-reviewer.md` の 80 行）。

設計のレビュー役は、識別子が当時の正本に対して追加、変更、削除のどれに該当するかは見ない、と書く（`docs/canonical/spec.md` の 29 行）。

その機械確認は #85 の検査が行う、と書く（`docs/canonical/spec.md` の 29 行）。

#85 の検査は、追加する識別子が正本にまだ無いことを見る、と書く（`docs/canonical/spec.md` の 49 行）。

#85 の検査は、変更する識別子と削除する識別子が正本にあることを見る、と書く（`docs/canonical/spec.md` の 49 行）。

`validateCanonicalDelta` は `src/conventions.ts` で定義する（`src/conventions.ts` の 1678 行）。

`src/conventions.test.ts` は `validateCanonicalDelta` を呼ぶ（`src/conventions.test.ts` の 535 行）。

サブコマンド名は `spec-diff` である、と書く（`docs/canonical/spec.md` の 121 行）。

`spec-diff` は、リモートのデフォルトブランチの `docs/canonical/` に、渡された課題番号の設計の `## 正本への差分` を当てた結果と、作業ディレクトリの `docs/canonical/` を比べる、と書く（`docs/canonical/spec.md` の 133 行）。

要求レビュー役が食い違いと巻き戻りを探すときに読んで比べる範囲は、#86 で作る正本と、対象課題の `docs/issues/<番号>/requirements.md` の「関係する課題」に挙げた課題の仕様だけである、と書く（`skills/sdd-cur/conventions.md` の 42 行）。

正本は `docs/canonical/` に置く、と書く（`skills/sdd-cur/conventions.md` の 42 行）。

設計レビュー役が食い違いと巻き戻りを探すときに読んで比べる範囲は、#86 で作る正本と、対象課題の `docs/issues/<番号>/design.md` の「関係する課題」に挙げた課題の仕様だけである、と書く（`skills/sdd-cur/conventions.md` の 44 行）。

正本は `docs/canonical/` に置く、と書く（`skills/sdd-cur/conventions.md` の 44 行）。

`src/conventions.test.ts` は、`skills/sdd-cur/conventions.md` の 42 行の「#86 で作る正本」を含む文を期待する（`src/conventions.test.ts` の 880 行）。

`src/conventions.test.ts` は、`skills/sdd-cur/conventions.md` の 44 行の「#86 で作る正本」を含む文を期待する（`src/conventions.test.ts` の 883 行）。

設計 26 の質問で人が通常の選択肢を選んだあとの要求作成役の再起動は、同じ要求の続きであり、作成の high の 2 回目に数えない、と書く（`skills/sdd-cur/SKILL.md` の 172 行）。

設計 26 の質問で人が通常の選択肢を選んだあとの要求作成役の再起動は、同じ要求の続きであり、作成の high の 2 回目に数えない、と書く（`docs/canonical/sdd.md` の 315 行）。

閉じるかどうかの確認の出し方は、#114 のままである、と書く（`skills/sdd-cur/SKILL.md` の 521 行）。

根拠を示せるときは、合格の案内より先に、`閉じる` と `閉じない` を出す、と書く（`skills/sdd-cur/SKILL.md` の 522 行）。

`src/129.test.ts` は、「閉じるかどうかの確認の出し方は、#114 のままである。」を期待する（`src/129.test.ts` の 390 行）。

`src/129.test.ts` は、「根拠を示せるときは、合格の案内より先に、`閉じる` と `閉じない` を出す。」を期待する（`src/129.test.ts` の 391 行）。

`skills/sdd-cur/SKILL.md` の description に「このプロジェクトの課題について」と書く（`skills/sdd-cur/SKILL.md` の 3 行）。

このリポジトリは `@paterapatera/sdd-cur` である。このプロジェクト専用の SDD スキルと課題ランナーである、と書く（`docs/policy.md` の 7 行）。

`init` が作る `docs/policy.md` は、このリポジトリの各節の本文を写さない、と書く（`docs/canonical/init.md` の 37 行）。

`#` の直後が数字である部分は `#85` である（`agents/sdd-cur-design-reviewer.md` の 38 行）。

`#` の直後が数字である部分は `#85` である（`agents/sdd-cur-design-reviewer.md` の 80 行）。

`#` の直後が数字である部分は `#86` である（`skills/sdd-cur/conventions.md` の 42 行）。

`#` の直後が数字である部分は `#86` である（`skills/sdd-cur/conventions.md` の 44 行）。

`#` の直後が数字である部分は `#114` である（`skills/sdd-cur/SKILL.md` の 521 行）。

`設計 ` の直後が数字である部分は `86` である（`agents/sdd-cur-req-reviewer.md` の 22 行）。

`設計 ` の直後が数字である部分は `86` である（`agents/sdd-cur-req-reviewer-high.md` の 22 行）。

`設計 ` の直後が数字である部分は `86` である（`agents/sdd-cur-design-reviewer.md` の 22 行）。

`設計 ` の直後が数字である部分は `26` である（`skills/sdd-cur/SKILL.md` の 172 行）。

課題番号を `<番号>` とする、と書く（`skills/sdd-cur/conventions.md` の 7 行）。

仕様として調べる範囲は、`docs/spec/` と、対象課題の `docs/specs/<番号>/` である、と書く（`agents/sdd-cur-explore.md` の 18 行）。

`docs/specs/<番号>/requirements.md` と `docs/specs/<番号>/design.md` を読む、と書く（`agents/sdd-cur-implement-author.md` の 13 行）。

設計の `## 正本への差分` を、同じ作業ツリーの `docs/spec/` へ反映する、と書く（`agents/sdd-cur-implement-author.md` の 24 行）。

項目が無いときは、`docs/spec/` を変えない、と書く（`agents/sdd-cur-implement-author.md` の 25 行）。

`docs/spec/` のファイルは、作業ツリーの実装に含める、と書く（`agents/sdd-cur-implement-author.md` の 33 行）。

`docs/spec/` のファイルは、作業ツリーの実装に含める、と書く（`agents/sdd-cur-implement-fixer.md` の 27 行）。

差分が `docs/spec/` を変えるときは、そのファイルを変えてよい、と書く（`agents/sdd-cur-implement-fixer.md` の 28 行）。

人が指定した課題の `docs/specs/<番号>/requirements.md` だけを書く、と書く（`agents/sdd-cur-req-author.md` の 9 行）。

書いてよいのは、`docs/specs/<番号>/requirements.md` だけである、と書く（`agents/sdd-cur-req-author.md` の 38 行）。

リポジトリルートからの相対パスは `docs/specs/<番号>/requirements.md` である、と書く（`agents/sdd-cur-req-author.md` の 99 行）。

書いてよいのは、`docs/specs/<番号>/requirements.md` だけである、と書く（`agents/sdd-cur-req-fixer.md` の 21 行）。

人が指定した課題の `docs/specs/<番号>/design.md` だけを書く、と書く（`agents/sdd-cur-design-author.md` の 9 行）。

書いてよいのは、`docs/specs/<番号>/design.md` だけである、と書く（`agents/sdd-cur-design-author.md` の 54 行）。

リポジトリルートからの相対パスは `docs/specs/<番号>/design.md` である、と書く（`agents/sdd-cur-design-author.md` の 77 行）。

書いてよいのは、`docs/specs/<番号>/design.md` だけである、と書く（`agents/sdd-cur-design-fixer.md` の 21 行）。

`src/agents-files.test.ts` は、`docs/specs/<番号>/requirements.md` を期待する（`src/agents-files.test.ts` の 25 行）。

`src/agents-files.test.ts` は、`sdd-cur-req-reviewer.md` に `docs/spec/` があることを期待する（`src/agents-files.test.ts` の 80 行）。

`src/agents-files.test.ts` は、`docs/specs/<番号>/requirements.md` を期待する（`src/agents-files.test.ts` の 97 行）。

`src/agents-files.test.ts` は、`docs/specs/<番号>/design.md` を期待する（`src/agents-files.test.ts` の 110 行）。

`src/agents-files.test.ts` は、`sdd-cur-design-reviewer.md` に `docs/spec/` があることを期待する（`src/agents-files.test.ts` の 162 行）。

`src/agents-files.test.ts` は、`docs/specs/<番号>/design.md` を期待する（`src/agents-files.test.ts` の 180 行）。

`src/agents-files.test.ts` は、`docs/spec/` を期待する（`src/agents-files.test.ts` の 198 行）。

`src/agents-files.test.ts` は、`docs/spec/` を期待する（`src/agents-files.test.ts` の 242 行）。

`src/90.test.ts` は、`docs/spec/` を期待する（`src/90.test.ts` の 87 行）。

`src/90.test.ts` は、`docs/specs/<番号>/` を期待する（`src/90.test.ts` の 88 行）。

`src/113.test.ts` は、課題 113 以外の要件と設計に古いパスの文字列が無いことを期待する（`src/113.test.ts` の 233 行）。

テストを足すファイルは `src/<番号>.test.ts` だけである（`docs/conventions.md` の 31 行）。

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

## 決定

設計レビュー役の「#85 の検査」は、「識別子が正本にあるかを見る検査」と書く。`sdd-cur spec-diff` の検査は、採用しない。

`agents/sdd-cur-req-reviewer.md`、`agents/sdd-cur-req-reviewer-high.md`、`agents/sdd-cur-design-reviewer.md` の `docs/specs/<番号>/` は、`docs/issues/<番号>/` にする。三つのレビュー役の `docs/specs/<番号>/` を残すことは、採用しない。

`install` がコピーする `agents/` のすべてで、`docs/spec/` は `docs/canonical/` にし、`docs/specs/` は `docs/issues/` にする。手を入れる対象に書いたファイルだけ変えることは、採用しない。

## 範囲外

- レビューが指摘にする条件、判定行、確認行、起動する役の名前
- 閉じるかどうかの確認で、根拠を示せるときに `閉じる` と `閉じない` を出し、合格の案内より先であり、`閉じる` を選んだときに `sdd-cur close <番号>` を実行すること
- 要求の未記載の質問のあと、要求作成役の再起動を作成の high の 2 回目に数えないこと
- `docs/issues/` と `docs/canonical/` に既にある、課題番号での参照
- `init` が他のプロジェクトへ書く `docs/policy.md` のひな型
- `skills/sdd-cur/SKILL.md` の frontmatter
- 新しい `test` を、`src/163.test.ts` 以外の `src/*.test.ts` に足すこと
- `validateCanonicalDelta` を CLI のコマンドから呼ぶこと
- `spec-diff` の比較対象を変えること

## 関係する課題

- #85（「#85 の検査」と書いてある元）
- #86（「#86 で作る正本」と書いてある元）
- #114（閉じるかどうかの確認の出し方の元）
