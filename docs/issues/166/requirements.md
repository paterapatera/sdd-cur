# 166 段を始めてよいかの判定を sdd-cur gate に移す

<!-- sdd-cur:form -->

対象は [Issue #166](https://github.com/paterapatera/sdd-cur/issues/166)。段を始めてよいかの判定を、AI が `skills/sdd-cur/SKILL.md` の文章から読むことから、`sdd-cur gate <番号> <段>` へ移す。`<段>` は `explore`、`requirements`、`design`、`confirm`、`reflect`、`request` のどれかである。どの状態で進めるか、止めるかは、今のままである。SKILL がすでに一文で人に伝えている文言は、その一文のままである。一文が無かった止まりの `reason` と、確認の段の `reason` は、決定のとおりである。`show` の出力は、今のままである。

## 現状

段を始めてよいかは、`skills/sdd-cur/SKILL.md` の文が人に伝える（`skills/sdd-cur/SKILL.md` の 199 行）。

着手の節は、`state` が `open` でないときは、課題は閉じていると伝えて止まる（`skills/sdd-cur/SKILL.md` の 27 行）。業務ラベルが一つでもあるときは、実装のラベルが付いていると伝えて止まる（`skills/sdd-cur/SKILL.md` の 28 行）。

調べる段は、`sdd-cur show <番号>` を実行する（`skills/sdd-cur/SKILL.md` の 37 行）。終了コードが 0 以外のときは、サブエージェントを起動しない（`skills/sdd-cur/SKILL.md` の 38 行）。終了コードが 0 のあと、`state` が `open` でないとき、業務ラベルが一つでもあるときは、ファイルを変えず、サブエージェントも起動しない（`skills/sdd-cur/SKILL.md` の 40 行）。終了コードが 0 であり、`state` が `open` であり、業務ラベルが無いときだけ、サブエージェントを起動する（`skills/sdd-cur/SKILL.md` の 42 行）。起動する名前は `sdd-cur-explore` である（`skills/sdd-cur/SKILL.md` の 43 行）。起動するときに、`show` が返した課題本文とコメントを渡す（`skills/sdd-cur/SKILL.md` の 46 行）。正本は、この止まりでは着手の文言を変えない、と定める（`docs/canonical/sdd.md` の 2047 行）。

要件の節は、先に `sdd-cur show <番号>` を実行する（`skills/sdd-cur/SKILL.md` の 55 行）。`state` が `open` でないとき、および業務ラベルが一つでもあるときは、ファイルを変えず、サブエージェントも起動しない（`skills/sdd-cur/SKILL.md` の 56 行）。`specs.requirements` が `invalid` のときは上書きしない（`skills/sdd-cur/SKILL.md` の 58 行）。課題が開いていて業務ラベルが無く、要件の状態が `invalid` でないときは、要求作成役を起動する前に作業ブランチを用意する（`skills/sdd-cur/SKILL.md` の 65 行）。用意は `sdd-cur prepare-branch <番号>` を実行する（`skills/sdd-cur/SKILL.md` の 66 行）。正本は、用意のあとに `branch` の出力と今のブランチを比べない、と定める（`docs/canonical/sdd.md` の 973 行）。

設計の節は、`state` が `open` でないとき、および業務ラベルが一つでもあるときは、ファイルを変えず、サブエージェントも起動しない（`skills/sdd-cur/SKILL.md` の 197 行）。`unanswered` が空でないときは、未回答の確認があるため、設計には進まない、と伝えて止まる（`skills/sdd-cur/SKILL.md` の 199 行）。`nextAnswer` が `null` でないときは、まだ要求へ反映していない回答があるため、設計には進まない、と伝えて止まる（`skills/sdd-cur/SKILL.md` の 200 行）。両方が残っているときは、未回答の確認を先に伝える（`skills/sdd-cur/SKILL.md` の 201 行）。要件の状態が `ready` でないときは、`missing` なら要件が無い、`invalid` なら要件の見出しが不正である、と伝えてファイルを変えない（`skills/sdd-cur/SKILL.md` の 204 行）。`specs.design` が `invalid` のときは上書きしない（`skills/sdd-cur/SKILL.md` の 206 行）。設計作成役を起動する前に、作業ブランチ名を `sdd-cur branch <番号>` の標準出力から得る（`skills/sdd-cur/SKILL.md` の 221 行）。今のブランチが作業ブランチ名と違うときは、ファイルを変えず、設計のサブエージェントも起動しない（`skills/sdd-cur/SKILL.md` の 224 行）。設計作成役を起動する前に、`sdd-cur prepare-branch <番号>` は実行しない（`skills/sdd-cur/SKILL.md` の 225 行）。正本は、同じ比較と、設計の前に `prepare-branch` を実行しないことを定める（`docs/canonical/sdd.md` の 931 行）。`branch` の標準出力は `task-<番号>` である（`docs/canonical/sdd.md` の 925 行）。`implementationBranch` は `task-` と課題番号を連結した文字列を返す（`src/runner.ts` の 300 行）。

確認の節は、`show` の `nextAnswer` が `null` でないときは投稿しない（`skills/sdd-cur/SKILL.md` の 376 行）。`unanswered` が空でないときは、いちばん古い未回答の payload を見せ、未回答の確認があるあいだ、次の確認は投稿しない（`skills/sdd-cur/SKILL.md` の 377 行）。

回答の節は、`nextAnswer` が `null` なら、未反映の回答は無いと伝えてファイルを変えない（`skills/sdd-cur/SKILL.md` の 388 行）。

`sdd-cur request <番号>` は、設計の合格の案内で人が「実装依頼する」を選んだときに実行する（`skills/sdd-cur/SKILL.md` の 344 行）。`unanswered` が空でない、または `nextAnswer` が `null` でないときは、次の段へ進む質問を出さない（`skills/sdd-cur/SKILL.md` の 354 行）。そのときは、`sdd-cur request <番号>` を実行しない（`skills/sdd-cur/SKILL.md` の 358 行）。段の見出し `## 回答` は、反映の節である（`skills/sdd-cur/SKILL.md` の 385 行）。

`confirm` は、課題が閉じていれば `課題は閉じています` で拒否する（`src/sdd.ts` の 26 行）。業務ラベルがあれば `実装のラベルが付いています` で拒否する（`src/sdd.ts` の 27 行）。この拒否は `assertSpecWorkAllowed` である（`src/sdd.ts` の 343 行）。着手が人に伝える文言は「課題は閉じている」である（`skills/sdd-cur/SKILL.md` の 27 行）。

`show` は `loadIssueView` の結果を JSON で標準出力へ書く（`src/cli.ts` の 479 行）。`unanswered` は、未回答の確認である（`src/sdd.ts` の 186 行）。`nextAnswer` は、未反映の回答か `null` である（`src/sdd.ts` の 187 行）。`specs` は、要件と設計の状態である（`src/sdd.ts` の 188 行）。状態の値は `missing`、`invalid`、`ready` である（`src/sdd.ts` の 150 行）。失敗は終了コード 1 と、標準エラーの一行である（`src/cli.ts` の 482 行）。`gh` の失敗理由は、標準エラーの最初の非空行である（`src/github.ts` の 108 行）。番号が不正なときの文言は `番号が不正です` である（`src/sdd.ts` の 19 行）。

方針の「構成」のサブコマンドの一覧に `gate` は無い（`docs/policy.md` の 21 行）。

業務ラベルの一つは `実装依頼` である（`src/labels.ts` の 9 行）。

## 受け入れ条件

- 1. 条件: `sdd-cur gate <番号> <段>` の判定ができた 主体: `sdd-cur gate` 結果: 標準出力は JSON の一行であり、終了コードは 0 である
- 2. 条件: 判定が、その段を始めてよい 主体: `sdd-cur gate` 結果: 標準出力の一行は `{"allowed":true}` である
- 3. 条件: 判定が、その段を始めてはいけない 主体: `sdd-cur gate` 結果: 標準出力の一行は、空白を挟まず `{"allowed":false,"reason":` で始まり `}` で終わり、`reason` の値は人に伝える一文であり、キーはこの二つだけである
- 4. 条件: 課題が見つからないなど、コマンド自体が失敗した 主体: `sdd-cur gate` 結果: 終了コードは 1 であり、標準エラーは一行であり、`allowed` を含む JSON は出さない
- 5. 条件: 引数の数が二つであり、`<段>` が `explore`、`requirements`、`design`、`confirm`、`reflect`、`request` のどれかであり、番号が不正である 主体: `sdd-cur gate` 結果: 今のサブコマンドと同じく、標準エラーの一行は `番号が不正です` であり、終了コードは 1 である
- 6. 条件: `sdd-cur gate` を実行した 主体: `sdd-cur gate` 結果: ファイルを変えない
- 7. 条件: `sdd-cur gate` を実行した 主体: `sdd-cur gate` 結果: ラベルを変えない
- 8. 条件: `sdd-cur gate` を実行した 主体: `sdd-cur gate` 結果: 課題コメントを投稿しない
- 9. 条件: `sdd-cur gate` が判定する 主体: `sdd-cur gate` 結果: 判定に使うのは `loadIssueView` の結果と今のブランチだけである
- 10. 条件: `<段>` が `explore`、`requirements`、`design`、`confirm`、`reflect`、`request` のどれでもない、または `sdd-cur gate` の引数の数が二つでない 主体: `sdd-cur gate` 結果: 終了コードは 1 であり、標準エラーの一行は `段が不正です` であり、`allowed` を含む JSON は出さない
- 11. 条件: `<段>` が `explore` であり、`state` が `open` であり、業務ラベルが無い 主体: `sdd-cur gate` 結果: `{"allowed":true}` である
- 12. 条件: `<段>` が `explore` であり、`state` が `open` でない 主体: `sdd-cur gate` 結果: `reason` は `課題は閉じている` である
- 13. 条件: `<段>` が `explore` であり、`state` が `open` であり、業務ラベルが一つでもある 主体: `sdd-cur gate` 結果: `reason` は `実装のラベルが付いている` である
- 14. 条件: `<段>` が `requirements` であり、`state` が `open` であり、業務ラベルが無く、`specs.requirements` が `missing` または `ready` である 主体: `sdd-cur gate` 結果: `{"allowed":true}` である
- 15. 条件: `<段>` が `requirements` であり、`state` が `open` でない 主体: `sdd-cur gate` 結果: `reason` は `課題は閉じている` である
- 16. 条件: `<段>` が `requirements` であり、`state` が `open` であり、業務ラベルが一つでもある 主体: `sdd-cur gate` 結果: `reason` は `実装のラベルが付いている` である
- 17. 条件: `<段>` が `requirements` であり、`state` が `open` であり、業務ラベルが無く、`specs.requirements` が `invalid` である 主体: `sdd-cur gate` 結果: `reason` は `要件の見出しが不正である` である
- 18. 条件: `<段>` が `design` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空であり、`nextAnswer` が `null` であり、`specs.requirements` が `ready` であり、`specs.design` が `missing` または `ready` であり、今のブランチが作業ブランチ名と一致する 主体: `sdd-cur gate` 結果: `{"allowed":true}` である
- 19. 条件: 作業ブランチ名 主体: `sdd-cur gate` 結果: `sdd-cur branch <番号>` の標準出力から末尾改行を除いた文字列と一致し、その文字列は `task-<番号>` である
- 20. 条件: `<段>` が `design` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空でない 主体: `sdd-cur gate` 結果: `reason` は `未回答の確認があるため、設計には進まない` である
- 21. 条件: `<段>` が `design` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空であり、`nextAnswer` が `null` でない 主体: `sdd-cur gate` 結果: `reason` は `まだ要求へ反映していない回答があるため、設計には進まない` である
- 22. 条件: `<段>` が `design` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空でなく、`nextAnswer` が `null` でない 主体: `sdd-cur gate` 結果: `reason` は `未回答の確認があるため、設計には進まない` である
- 23. 条件: `<段>` が `design` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空であり、`nextAnswer` が `null` であり、`specs.requirements` が `missing` である 主体: `sdd-cur gate` 結果: `reason` は `要件が無い` である
- 24. 条件: `<段>` が `design` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空であり、`nextAnswer` が `null` であり、`specs.requirements` が `invalid` である 主体: `sdd-cur gate` 結果: `reason` は `要件の見出しが不正である` である
- 25. 条件: `<段>` が `design` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空であり、`nextAnswer` が `null` であり、`specs.requirements` が `ready` であり、`specs.design` が `invalid` である 主体: `sdd-cur gate` 結果: `reason` は `設計の見出しが不正である` である
- 26. 条件: `<段>` が `design` であり、受け入れ条件 18 の残りの条件を満たし、今のブランチが作業ブランチ名と違う 主体: `sdd-cur gate` 結果: `reason` は `作業ブランチではない` である
- 27. 条件: `<段>` が `design` であり、`state` が `open` でない 主体: `sdd-cur gate` 結果: `reason` は `課題は閉じている` である
- 28. 条件: `<段>` が `design` であり、`state` が `open` であり、業務ラベルが一つでもある 主体: `sdd-cur gate` 結果: `reason` は `実装のラベルが付いている` である
- 29. 条件: `<段>` が `confirm` であり、`unanswered` が空であり、`nextAnswer` が `null` である 主体: `sdd-cur gate` 結果: `{"allowed":true}` である
- 30. 条件: `<段>` が `confirm` であり、`unanswered` が空でない 主体: `sdd-cur gate` 結果: `reason` は `未回答の確認があるため、次の確認は投稿しない` である
- 31. 条件: `<段>` が `confirm` であり、`unanswered` が空であり、`nextAnswer` が `null` でない 主体: `sdd-cur gate` 結果: `reason` は `まだ反映していない回答があるため、次の確認は投稿しない` である
- 32. 条件: `<段>` が `confirm` であり、`unanswered` が空でなく、`nextAnswer` が `null` でない 主体: `sdd-cur gate` 結果: 先に伝える `reason` は `未回答の確認があるため、次の確認は投稿しない` である
- 33. 条件: `<段>` が `reflect` であり、`nextAnswer` が `null` である 主体: `sdd-cur gate` 結果: `reason` は `未反映の回答は無い` である
- 34. 条件: `<段>` が `reflect` であり、`nextAnswer` が `null` でない 主体: `sdd-cur gate` 結果: `{"allowed":true}` である
- 35. 条件: 複数の条件に当たり、スキルがその段で先に伝える条件がある 主体: `sdd-cur gate` 結果: `reason` は一つであり、その先の条件の文言である
- 36. 条件: 本要件を実装した 主体: SDD スキル 結果: `## 調べる`、`## 要件`、`## 設計`、`## 確認`、`## 回答` の各節の最初の文は、`sdd-cur gate <番号> <段>` を実行し、`allowed` が `false` なら `reason` を伝えて止まる。である
- 37. 条件: 受け入れ条件 36 主体: SDD スキル 結果: その段を始めてよいかの条件を並べた文は、その節から消える
- 38. 条件: `allowed` が `false` である 主体: SDD スキル 結果: `reason` を伝えて止まり、その段のサブエージェントを起動しない
- 39. 条件: `sdd-cur gate` の終了コードが 0 以外である 主体: SDD スキル 結果: その段のサブエージェントを起動しない
- 40. 条件: `<段>` が `requirements` であり、`allowed` が `true` である 主体: SDD スキル 結果: 今と同じく、要求作成役を起動する前に `sdd-cur prepare-branch <番号>` を実行する
- 41. 条件: `<段>` が `design` である 主体: SDD スキル 結果: 設計作成役を起動する前に `sdd-cur prepare-branch <番号>` を実行しない
- 42. 条件: `<段>` が `explore` であり、`allowed` が `true` である 主体: SDD スキル 結果: 今と同じく、`show` が返した課題本文とコメントを `sdd-cur-explore` に渡す
- 43. 条件: `allowed` が `true` のあと 主体: SDD スキル 結果: 段を始めてよいかの条件を並べた文以外の、その段の手順は残る
- 44. 条件: 本要件を実装した 主体: `show` 結果: 標準出力は、今の `loadIssueView` の JSON のままである
- 45. 条件: 本要件を実装した 主体: `docs/policy.md` 結果: 「構成」の `src/cli.ts` の行のサブコマンドの一覧に `gate` がある
- 46. 条件: 本要件を実装した 主体: `docs/canonical/sdd.md` 結果: 段を始めてよいかを `sdd-cur gate` が判定し、SDD スキルの各段の先頭がそれを実行することが書いてある
- 47. 条件: `<段>` が `confirm` または `reflect` であり、ゲートが `{"allowed":true}` のあと、課題が閉じている、または業務ラベルがある 主体: `confirm` または `reflect` 結果: 今と同じく、コマンドが `課題は閉じています` または `実装のラベルが付いています` で失敗する
- 48. 条件: `<段>` が `request` であり、`state` が `open` であり、業務ラベルが無く、`specs.requirements` が `ready` であり、`specs.design` が `ready` であり、`unanswered` が空であり、`nextAnswer` が `null` であり、今のブランチが作業ブランチ名と一致する 主体: `sdd-cur gate` 結果: `{"allowed":true}` である
- 49. 条件: `<段>` が `request` であり、`state` が `open` でない 主体: `sdd-cur gate` 結果: `reason` は `課題は閉じている` である
- 50. 条件: 本要件を実装した 主体: SDD スキル 結果: `## 設計` の最初の「実装依頼する」の直前の文は、`sdd-cur gate <番号> request` を実行し、`allowed` が `false` なら `reason` を伝えて止まる。である
- 51. 条件: 受け入れ条件 50 主体: SDD スキル 結果: `## 設計` で、`unanswered` が空でない、または `nextAnswer` が `null` でないときは `sdd-cur request <番号>` を実行しない、と並べた文は無い
- 52. 条件: `<段>` が `request` であり、`state` が `open` であり、業務ラベルが一つでもある 主体: `sdd-cur gate` 結果: `reason` は `実装のラベルが付いている` である
- 53. 条件: `<段>` が `request` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空でない 主体: `sdd-cur gate` 結果: `reason` は `未回答の確認があるため、設計には進まない` である
- 54. 条件: `<段>` が `request` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空であり、`nextAnswer` が `null` でない 主体: `sdd-cur gate` 結果: `reason` は `まだ要求へ反映していない回答があるため、設計には進まない` である
- 55. 条件: `<段>` が `request` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空でなく、`nextAnswer` が `null` でない 主体: `sdd-cur gate` 結果: `reason` は `未回答の確認があるため、設計には進まない` である
- 56. 条件: `<段>` が `request` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空であり、`nextAnswer` が `null` であり、`specs.requirements` が `missing` である 主体: `sdd-cur gate` 結果: `reason` は `要件が無い` である
- 57. 条件: `<段>` が `request` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空であり、`nextAnswer` が `null` であり、`specs.requirements` が `invalid` である 主体: `sdd-cur gate` 結果: `reason` は `要件の見出しが不正である` である
- 58. 条件: `<段>` が `request` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空であり、`nextAnswer` が `null` であり、`specs.requirements` が `ready` であり、`specs.design` が `invalid` である 主体: `sdd-cur gate` 結果: `reason` は `設計の見出しが不正である` である
- 59. 条件: `<段>` が `request` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空であり、`nextAnswer` が `null` であり、`specs.requirements` が `ready` であり、`specs.design` が `missing` または `ready` であり、今のブランチが作業ブランチ名と違う 主体: `sdd-cur gate` 結果: `reason` は `作業ブランチではない` である
- 60. 条件: `<段>` が `request` であり、`state` が `open` であり、業務ラベルが無く、`unanswered` が空であり、`nextAnswer` が `null` であり、`specs.requirements` が `ready` であり、`specs.design` が `missing` であり、今のブランチが作業ブランチ名と一致する 主体: `sdd-cur gate` 結果: `reason` は `設計が無い` である

## 決定

`explore`、`requirements`、`design`、`request` で、`state` が `open` でないときの `reason` は「課題は閉じている」である。この文言は着手が人に伝える文言と同じであり、四つの段で共通である。`state` が `open` でないときは、業務ラベルがあってもこの文言である。

`explore`、`requirements`、`design`、`request` で、`state` が `open` であり業務ラベルが一つでもあるときの `reason` は「実装のラベルが付いている」である。この文言は着手が人に伝える文言と同じであり、四つの段で共通である。

`design` で、`specs.requirements` が `missing` のときの `reason` は「要件が無い」である。`specs.requirements` が `invalid` のときの `reason` は「要件の見出しが不正である」である。`specs.design` が `invalid` のときの `reason` は「設計の見出しが不正である」である。今のブランチが作業ブランチ名と違うときの `reason` は「作業ブランチではない」である。

`requirements` で、`specs.requirements` が `invalid` のときの `reason` は「要件の見出しが不正である」である。

`confirm` で、`unanswered` が空でないときの `reason` は「未回答の確認があるため、次の確認は投稿しない」である。`unanswered` が空であり `nextAnswer` が `null` でないときの `reason` は「まだ反映していない回答があるため、次の確認は投稿しない」である。両方が残っているときは、先の `reason` は「未回答の確認があるため、次の確認は投稿しない」である。

`request` のゲートは、`## 設計` の最初の「実装依頼する」の直前に置く。`allowed` が true になるのは、`state` が `open` であり、業務ラベルが無く、`specs.requirements` と `specs.design` が `ready` であり、`unanswered` が空であり、`nextAnswer` が `null` であり、今のブランチが作業ブランチ名と一致するときである。`request` が未コミットの変更を見て失敗する判定は、ゲートの外である。

`request` で `allowed` が false のときの `reason` の文言と、複数の条件に当たるときの順は、`design` と同じである。順は、`state` が `open` でないときは「課題は閉じている」、`state` が `open` であり業務ラベルが一つでもあるときは「実装のラベルが付いている」、`unanswered` が空でないときは「未回答の確認があるため、設計には進まない」、`unanswered` が空であり `nextAnswer` が `null` でないときは「まだ要求へ反映していない回答があるため、設計には進まない」、`specs.requirements` が `missing` のときは「要件が無い」、`specs.requirements` が `invalid` のときは「要件の見出しが不正である」、`specs.design` が `invalid` のときは「設計の見出しが不正である」、今のブランチが作業ブランチ名と違うときは「作業ブランチではない」、である。`unanswered` が空でなく、`nextAnswer` が `null` でないときは、「未回答の確認があるため、設計には進まない」である。

`request` で、`specs.design` が `missing` であり、上の順の止まりに当たらないときの `reason` は「設計が無い」である。この止まりは、今のブランチが作業ブランチ名と違うときの次である。

`<段>` が `explore`、`requirements`、`design`、`confirm`、`reflect`、`request` のどれでもないとき、および `sdd-cur gate` の引数の数が二つでないとき、標準エラーの一行は「段が不正です」である。番号が不正でも、このいずれかに当たるときは「段が不正です」である。引数が二つであり `<段>` が六つのどれかであり番号が不正なときは、標準エラーの一行は「番号が不正です」である。

## 範囲外

次は、この要件に含めない。

- `show` の出力を変えること
- どの状態で段に進めるか、止めるかを変えること
- 決定に書いた `reason` 以外で、人に伝える文言を変えること
- 段の承認状態をファイルに書くこと
- `## 着手` を、ゲートの一文に置き換えること
- `skills/sdd-cur-quick/SKILL.md`、`skills/sdd-cur-implement/SKILL.md`、`skills/sdd-cur-complete/SKILL.md` の手順を変えること
- `request` が未コミットの変更を見て失敗する判定を、`gate` の入力に入れること
- 課題の作成
- 課題を閉じること
- ラベルの変更
- 受け入れ手順
- 完了処理

## 関係する課題

- #5（SDD スキル）
