# 166 段を始めてよいかの判定を sdd-cur gate に移す

<!-- sdd-cur:form -->

対象は [Issue #166](https://github.com/paterapatera/sdd-cur/issues/166)。段を始めてよいかの判定を `sdd-cur gate <番号> <段>` に集め、SDD スキルは各段の先頭でそれを実行する。`<段>` は `explore`、`requirements`、`design`、`confirm`、`reflect`、`request` である。`show` の JSON は変えない。`confirm` と `reflect` は、ゲートのあとも今と同じ拒否をする。

重なる課題は #5 である。

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
- 41. 条件: `<段>` が `design` である 主体: SDD スキル 結果: 設計作成役を起動する前に `sdd-cur prepare-branch <番号>` は実行しない
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

## 決定

| 項目 | 内容 |
|---|---|
| サブコマンド名 | `gate` |
| 呼び出し | `bun src/cli.ts gate <番号> <段>`。スキルが呼ぶときは `sdd-cur gate <番号> <段>` |
| 置き場所 | 判定は `src/gate.ts` の `evaluateGate` と `parseGateStage`。`src/cli.ts` の `cmdGate` が `loadIssueView` と `currentBranch` を集めて呼ぶ |
| 引数 | 課題番号と `<段>` の二つ。`--help` と `-h` を除いた残りを数える。残りが二つでないときは、標準エラーへ `段が不正です` の一行、終了コード 1、標準出力は空。`printUsage` は書かない |
| 段 | `explore`、`requirements`、`design`、`confirm`、`reflect`、`request` の六つだけ。それ以外の第二引数は、引数が二つでも `段が不正です` |
| 番号 | 段と件数を通したあと、`parseIssueNumberString` が拒否するときは、標準エラーへ `番号が不正です` の一行、終了コード 1、標準出力は空。`gh` は呼ばない |
| 使い方の例外 | 引数に `--help` または `-h` があり、最初の引数が `spec-check` でないときは、今の `main` が使い方を出して終了コード 0 で戻る。`gate` を、`spec-check` と同じ例外にしない |
| 読み込み | `show` と同じ順で、`readSpecPair`、`assertSpecFilesReflected`、`githubFromCwd`、`loadIssueView` を呼ぶ。あわせて `createGit` の `currentBranch` を呼ぶ。拒否した時点より後は呼ばない |
| 成功 | 終了コード 0。標準エラーは空。標準出力は `JSON.stringify` の結果を一行で書き、末尾に改行一つ |
| 失敗 | `loadIssueView` 以前の拒否と、`loadIssueView` と `currentBranch` の拒否は、標準エラーへ理由の一行、終了コード 1、標準出力は空。`allowed` を含む JSON は出さない |
| 副作用 | ファイルを書かない。ラベルを変えない。課題コメントを投稿しない |
| 業務ラベル | `workflowLabels` の `name` と `issue.labels` の完全一致。一つでもあれば業務ラベルあり |
| 作業ブランチ名 | `implementationBranch(issueNumber)` の戻り値。`branch` サブコマンドと同じ |
| `confirm` と `reflect` | ゲートは `unanswered` と `nextAnswer` だけを見る。閉じている課題と業務ラベルは、ゲートのあと `confirm` と `reflect` が今と同じ拒否をする |

`main` の `switch` では、`show` の次に `case "gate"` を足す。`default` より前である。`printUsage` は、行全体が `sdd-cur show <番号>` である行の次に、`sdd-cur gate <番号> <段>` を足す。今ある行の字面は変えない。

`docs/policy.md` の構成の表の `src/cli.ts` の行は、サブコマンドの列挙の末尾に `` `gate` `` を足す。`AGENTS.md` の「コマンド」の最初のコードフェンスでは、`bun src/cli.ts show <番号>` の次に `bun src/cli.ts gate <番号> <段>` の行を足す。

### `evaluateGate`

```ts
export type GateStage =
  | "explore"
  | "requirements"
  | "design"
  | "confirm"
  | "reflect"
  | "request"

export type GateResult =
  | { allowed: true }
  | { allowed: false; reason: string }

export function parseGateStage(text: string): GateStage

export function evaluateGate(
  stage: GateStage,
  view: IssueView,
  currentBranch: string,
  issueNumber: number,
): GateResult
```

`parseGateStage` は、引数が六つのどれかと完全一致するときだけその段を返す。それ以外は `段が不正です` で拒否する。

`evaluateGate` は `view` と `currentBranch` と `issueNumber` だけを見る。`issueNumber` は作業ブランチ名の比較に使う。`implementationBranch(issueNumber)` と `currentBranch` を比べる。

業務ラベルがあるかは、`view.issue.labels` の要素が `workflowLabelNames` に含まれるかで見る。`workflowLabelNames` は `src/sdd.ts` と同じ集合である。判定の写しを `src/gate.ts` に二重に持たない。`src/gate.ts` は `workflowLabels` から作るか、`src/sdd.ts` から export した集合を使う。

`design` と `request` で止まりが複数あるときは、次の順で最初に当たった `reason` だけを返す。

1. `view.issue.state` が `open` でないときは `課題は閉じている`
2. 業務ラベルが一つでもあるときは `実装のラベルが付いている`
3. `view.unanswered` が空でないときは `未回答の確認があるため、設計には進まない`
4. `view.unanswered` が空であり `view.nextAnswer` が `null` でないときは `まだ要求へ反映していない回答があるため、設計には進まない`
5. `view.specs.requirements` が `missing` のときは `要件が無い`
6. `view.specs.requirements` が `invalid` のときは `要件の見出しが不正である`
7. `view.specs.design` が `invalid` のときは `設計の見出しが不正である`
8. `currentBranch` が `implementationBranch(issueNumber)` と違うときは `作業ブランチではない`
9. `stage` が `request` であり、上に当たらず `view.specs.design` が `missing` のときは `設計が無い`

`design` で `allowed` が true のときは、5 から 8 のどれにも当たらず、`specs.requirements` が `ready` であり、`specs.design` が `missing` または `ready` である。

`request` で `allowed` が true のときは、5 から 9 のどれにも当たらず、`specs.requirements` と `specs.design` がともに `ready` である。

`explore` と `requirements` は、`unanswered` と `nextAnswer` を見ない。`explore` で `allowed` が true のときは、`state` が `open` であり、業務ラベルが無い。`requirements` で `allowed` が true のときは、同じく開いて業務ラベルが無く、`specs.requirements` が `missing` または `ready` である。

`confirm` の順は次である。

1. `view.unanswered` が空でないときは `未回答の確認があるため、次の確認は投稿しない`
2. `view.unanswered` が空であり `view.nextAnswer` が `null` でないときは `まだ反映していない回答があるため、次の確認は投稿しない`

両方に当たるときは 1 を先に返す。どちらにも当たらないときは `allowed` が true である。

`reflect` は、`view.nextAnswer` が `null` のとき `未反映の回答は無い`、`null` でないとき `allowed` が true である。

成功時の JSON は、`allowed` が true のとき `{"allowed":true}`。false のとき `{"allowed":false,"reason":<文字列>}`。キーはこの二つだけである。`reason` は `JSON.stringify` がエスケープする。

### SDD スキル

`skills/sdd-cur/SKILL.md` の `## 調べる`、`## 要件`、`## 設計`、`## 確認`、`## 回答` の、段を始めてよいかを並べた文は除く。各節の先頭は、次の形にする。一文が一行である。

- `## 調べる` の、課題番号を決めたあとの手順の先頭は、`sdd-cur gate <番号> explore` を実行し、終了コードが 0 以外なら止まる。`allowed` が `false` なら `reason` を伝えて止まる。`allowed` が `true` なら、続けて `sdd-cur show <番号>` を実行し、終了コードが 0 以外なら止まる。`allowed` が `true` のときだけ `sdd-cur-explore` を起動する。
- `## 要件` の、人が要件を依頼したときの手順の先頭は、`sdd-cur gate <番号> requirements` を実行し、終了コードが 0 以外なら止まる。`allowed` が `false` なら `reason` を伝えて止まる。`allowed` が `true` のあとは、今の `prepare-branch` と要求作成役の手順のままである。
- `## 設計` の、設計を扱う手順の先頭は、`sdd-cur gate <番号> design` を実行し、終了コードが 0 以外なら止まる。`allowed` が `false` なら `reason` を伝えて止まる。`allowed` が `true` のあとは、ゲートで作業ブランチを確認済みである。`sdd-cur branch <番号>` と今のブランチの比較の文は除く。`prepare-branch` を設計作成役の前に実行しない文は残す。実装依頼の質問の直前は、`sdd-cur gate <番号> request` を実行し、終了コードが 0 以外なら止まる。`allowed` が `false` なら `reason` を伝えて止まる。`unanswered` と `nextAnswer` で `request` を実行しない、と並べた文は除く。
- `## 確認` の先頭は、`sdd-cur gate <番号> confirm` を実行し、終了コードが 0 以外なら止まる。`allowed` が `false` なら `reason` を伝えて止まる。`allowed` が `true` のあとは、今の payload と `confirm` の手順のままである。
- `## 回答` の、取り込みを依頼したときの先頭は、`sdd-cur gate <番号> reflect` を実行し、終了コードが 0 以外なら止まる。`allowed` が `false` なら `reason` を伝えて止まる。`allowed` が `true` のあとは、今の取り込み手順のままである。

`## 着手` は変えない。`show` の JSON の形は変えない。

## 正本への差分

### 追加 sdd REQ-923

もとになった課題は #166 である。

サブコマンド名は `gate` である。使い方の表示には、行全体が `sdd-cur gate <番号> <段>` である行がある。`src/cli.ts` の `switch` に `gate` がある。`show` の次であり、`default` より前である。開発時の起動は `bun src/cli.ts gate <番号> <段>` である。スキルが呼ぶときは `sdd-cur gate <番号> <段>` である。`<段>` は `explore`、`requirements`、`design`、`confirm`、`reflect`、`request` のどれかである。

- シナリオ: 条件: 引数が課題番号と六つの段のどれかである 主体: `gate` 結果: 標準出力は JSON の一行であり、終了コードは 0 である

### 追加 sdd REQ-924

もとになった課題は #166 である。

`gate` の引数は、課題番号と `<段>` の二つである。`--help` と `-h` を除いた残りが二つでないときは、標準エラーへ `段が不正です` の一行を書き、終了コードは 1 である。標準出力には書かない。`printUsage` は書かない。第二引数が六つの段のどれでもないときも、引数が二つでないときと同じである。引数が二つであり、第二引数が六つの段のどれかであり、番号が不正なときは、`parseIssueNumberString` が拒否するときと同じである。標準エラーへ書く一行は `番号が不正です` と一文字も違わない。終了コードは 1 である。標準出力には書かない。この検証で拒否するときは `gh` を呼ばない。

- シナリオ: 条件: 引数の数が二つでない、または段が六つのどれでもない 主体: `gate` 結果: 標準エラーは `段が不正です` であり、`allowed` を含む JSON は出さない
- シナリオ: 条件: 引数が二つであり段が六つのどれかであり番号が不正である 主体: `gate` 結果: 標準エラーは `番号が不正です` であり、`allowed` を含む JSON は出さない

### 追加 sdd REQ-925

もとになった課題は #166 である。

`gate` は、`show` と同じ順で `readSpecPair`、`assertSpecFilesReflected`、`loadIssueView` を呼ぶ。あわせて `createGit` の `currentBranch` を呼ぶ。判定は `loadIssueView` の結果と `currentBranch` だけを使う。ファイルを変えない。ラベルを変えない。課題コメントを投稿しない。成功の標準出力は、`allowed` が true のとき `{"allowed":true}`、`allowed` が false のとき `{"allowed":false,"reason":` で始まり `}` で終わり、キーは `allowed` と `reason` だけである。`reason` の値は人に伝える一文である。`loadIssueView` と `currentBranch` が拒否したときは、終了コードは 1 である。標準エラーは一行である。`allowed` を含む JSON は出さない。

- シナリオ: 条件: 判定がその段を始めてよい 主体: `gate` 結果: 標準出力の一行は `{"allowed":true}` である
- シナリオ: 条件: 判定がその段を始めてはいけない 主体: `gate` 結果: 標準出力は `allowed` が false の JSON 一行であり、`reason` は人に伝える一文である

### 追加 sdd REQ-926

もとになった課題は #166 である。

`evaluateGate` は `src/gate.ts` に置く。作業ブランチ名は `implementationBranch` の戻り値である。業務ラベルは `workflowLabels` の `name` と `issue.labels` の完全一致である。`explore` で `state` が `open` でないときの `reason` は `課題は閉じている` である。`explore` で `state` が `open` であり業務ラベルが一つでもあるときの `reason` は `実装のラベルが付いている` である。`explore` で `allowed` が true のときは、`state` が `open` であり、業務ラベルが無い。

- シナリオ: 条件: 段が `explore` であり課題が開いて業務ラベルが無い 主体: `gate` 結果: `{"allowed":true}` である
- シナリオ: 条件: 段が `explore` であり課題が閉じている 主体: `gate` 結果: `reason` は `課題は閉じている` である

### 追加 sdd REQ-927

もとになった課題は #166 である。

`requirements` で `state` が `open` でないときの `reason` は `課題は閉じている` である。`requirements` で業務ラベルが一つでもあるときの `reason` は `実装のラベルが付いている` である。`requirements` で `specs.requirements` が `invalid` のときの `reason` は `要件の見出しが不正である` である。`requirements` で `allowed` が true のときは、`state` が `open` であり、業務ラベルが無く、`specs.requirements` が `missing` または `ready` である。`requirements` は `unanswered` と `nextAnswer` を見ない。

- シナリオ: 条件: 段が `requirements` であり開いて業務ラベルが無く要件が `missing` または `ready` である 主体: `gate` 結果: `{"allowed":true}` である
- シナリオ: 条件: 段が `requirements` であり要件が `invalid` である 主体: `gate` 結果: `reason` は `要件の見出しが不正である` である

### 追加 sdd REQ-928

もとになった課題は #166 である。

`design` と `request` で複数の止まりに当たるときは、次の順で最初の `reason` だけを返す。`state` が `open` でないときは `課題は閉じている`。業務ラベルが一つでもあるときは `実装のラベルが付いている`。`unanswered` が空でないときは `未回答の確認があるため、設計には進まない`。`unanswered` が空であり `nextAnswer` が `null` でないときは `まだ要求へ反映していない回答があるため、設計には進まない`。`specs.requirements` が `missing` のときは `要件が無い`。`specs.requirements` が `invalid` のときは `要件の見出しが不正である`。`specs.design` が `invalid` のときは `設計の見出しが不正である`。`currentBranch` が作業ブランチ名と違うときは `作業ブランチではない`。`request` で上に当たらず `specs.design` が `missing` のときは `設計が無い`。`design` で `allowed` が true のときは、`specs.requirements` が `ready` であり、`specs.design` が `missing` または `ready` であり、作業ブランチ名と一致する。`request` で `allowed` が true のときは、要件と設計がともに `ready` であり、作業ブランチ名と一致する。

- シナリオ: 条件: 段が `design` であり受け入れ条件 18 の条件を満たす 主体: `gate` 結果: `{"allowed":true}` である
- シナリオ: 条件: 段が `design` であり未回答の確認がある 主体: `gate` 結果: `reason` は `未回答の確認があるため、設計には進まない` である
- シナリオ: 条件: 段が `request` であり設計が `missing` で他の止まりに当たらない 主体: `gate` 結果: `reason` は `設計が無い` である

### 追加 sdd REQ-929

もとになった課題は #166 である。

`confirm` で `unanswered` が空でないときの `reason` は `未回答の確認があるため、次の確認は投稿しない` である。`unanswered` が空であり `nextAnswer` が `null` でないときの `reason` は `まだ反映していない回答があるため、次の確認は投稿しない` である。両方に当たるときは前者を先に返す。どちらにも当たらないときは `allowed` が true である。`reflect` で `nextAnswer` が `null` のときの `reason` は `未反映の回答は無い` である。`nextAnswer` が `null` でないときは `allowed` が true である。`confirm` と `reflect` は、ゲートのあと `confirm` と `reflect` が、閉じている課題と業務ラベルについて今と同じ拒否をする。

- シナリオ: 条件: 段が `confirm` であり未回答の確認が無く未反映の回答が無い 主体: `gate` 結果: `{"allowed":true}` である
- シナリオ: 条件: 段が `reflect` であり未反映の回答がある 主体: `gate` 結果: `{"allowed":true}` である
- シナリオ: 条件: 段が `reflect` であり未反映の回答が無い 主体: `gate` 結果: `reason` は `未反映の回答は無い` である

### 変更 sdd REQ-755

もとになった課題は #90 である。

調べるだけの段では、`sdd-cur gate <番号> explore` を実行する。終了コードが 0 以外のときは、サブエージェントを起動しない。このときは止まる。`allowed` が `false` のときは、`reason` を伝えて止まり、サブエージェントを起動しない。`allowed` が `true` のときは、`sdd-cur show <番号>` を実行する。終了コードが 0 のときだけ、サブエージェントを一つ起動する。起動する名前は `sdd-cur-explore` である。`model` は渡さない。frontmatter の `model` を使う。起動するときに、課題番号と、人が依頼した調査の内容と、`show` が返した課題本文とコメントを渡す。

- シナリオ: 条件: 調査を依頼しゲートが `allowed` true である 主体: SDD スキル 結果: `show` のあと `sdd-cur-explore` を起動する
- シナリオ: 条件: ゲートの `allowed` が false である 主体: SDD スキル 結果: `reason` を伝えて止まりサブエージェントを起動しない

### 変更 sdd REQ-760

もとになった課題は #116 である。

`sdd-cur gate <番号> explore` の終了コードが 0 以外のときは、サブエージェントを起動しない。このときは止まる。`sdd-cur show <番号>` の終了コードが 0 以外のときも、サブエージェントを起動しない。このときは止まる。

- シナリオ: 条件: `gate` の終了コードが 0 以外である 主体: SDD スキル 結果: 調べる段のサブエージェントを起動しない

### 変更 sdd REQ-308

もとになった課題は #120 である。

`skills/sdd-cur/SKILL.md` の設計の手順は、`sdd-cur gate <番号> design` を実行し、終了コードが 0 以外なら止まる。`allowed` が `false` なら `reason` を伝えて止まる。`allowed` が `true` のあとは、設計作成役を起動する。設計の前に `prepare-branch` は実行しない。checkout はしない。作業ブランチは新しく作らない。作業ブランチ名と今のブランチの比較は `gate` が行う。スキルは `branch` の出力と今のブランチを比べない。

- シナリオ: 条件: 設計のゲートが `allowed` true である 主体: SDD スキル 結果: `prepare-branch` を設計作成役の前に実行しない
- シナリオ: 条件: 設計のゲートが `allowed` false である 主体: SDD スキル 結果: 設計のサブエージェントを起動しない

### 追加 sdd REQ-930

もとになった課題は #166 である。

`skills/sdd-cur/SKILL.md` の `## 要件`、`## 確認`、`## 回答` の段を始める手順の先頭は、それぞれ `sdd-cur gate <番号> requirements`、`sdd-cur gate <番号> confirm`、`sdd-cur gate <番号> reflect` を実行し、終了コードが 0 以外なら止まる。`allowed` が `false` なら `reason` を伝えて止まる。`allowed` が `false` のときは、その段のサブエージェントを起動しない。`requirements` で `allowed` が `true` のあとは、要求作成役を起動する前に `sdd-cur prepare-branch <番号>` を実行する。`## 設計` で実装依頼の質問の直前は、`sdd-cur gate <番号> request` を実行し、終了コードが 0 以外なら止まる。`allowed` が `false` なら `reason` を伝えて止まる。段を始めてよいかを並べた文は、これらの節から除く。

- シナリオ: 条件: 要件のゲートが `allowed` true である 主体: SDD スキル 結果: `prepare-branch` を要求作成役の前に実行する
- シナリオ: 条件: 設計で実装依頼の質問の直前のゲートが `allowed` false である 主体: SDD スキル 結果: `reason` を伝えて止まり `request` を実行しない

### 変更 docs REQ-713

もとになった課題は #83 である。

サブコマンドの正は `src/cli.ts` の `main` にある `switch (sub)` の `case "..."` である。`default` は含めない。順は `install`、`run`、`labels`、`candidates`、`show`、`gate`、`branch`、`prepare-branch`、`confirm`、`close`、`reflect`、`validate`、`complete`、`restore`、`review-next`、`request`、`spec-check`、`tasks` である。

- シナリオ: 条件: `src/cli.ts` に `gate` の `case` がある 主体: 文書と CLI 結果: `docs/canonical/docs.md` の列挙に `gate` が含まれる

## 変えるファイル

- src/gate.ts
- src/cli.ts
- src/sdd.ts
- skills/sdd-cur/SKILL.md
- docs/policy.md
- AGENTS.md
- docs/canonical/sdd.md
- docs/canonical/docs.md
- src/166.test.ts
- src/sdd-skill-sdd-cur.test.ts

## 作業の一覧

- 1. `src/gate.ts` に型・`parseGateStage`・`evaluateGate` の `explore` と `requirements` を足す。`src/cli.ts` に `cmdGate` と `case "gate"` を足し、引数検証・読み込み・`currentBranch` の取得・JSON 出力の骨格を書く。`src/sdd.ts` から業務ラベル判定用の集合を export する。[1][2][3][4][5][6][7][8][9][10][11][12][13][14][15][16][17][19]
- 2. `evaluateGate` に `design` と `request` の判定順序と `reason` を足す。[18][20][21][22][23][24][25][26][27][28][35][48][49][52][53][54][55][56][57][58][59][60]
- 3. `evaluateGate` に `confirm` と `reflect` の判定を足す。[29][30][31][32][33][34]
- 4. `skills/sdd-cur/SKILL.md` の各段の先頭をゲートの一文にし、段を始めてよいかを並べた文と、設計のブランチ比較と `request` の並べた文を除く。`prepare-branch` と `show` の残す手順は変えない。[36][37][38][39][40][41][42][43][50][51]
- 5. `docs/policy.md`、`AGENTS.md`、`docs/canonical/sdd.md`、`docs/canonical/docs.md` を「正本への差分」どおりに変える。[45][46]
- 6. `src/166.test.ts` で `evaluateGate` と `cmdGate` を注入テストし、受け入れ条件をカバーする。ゲートが confirm または reflect で `allowed` true のあとも、閉じた課題と業務ラベルで confirm と reflect が今と同じ拒否をする。[36][37][38][39][40][41][42][43][44][47][50][51]

## テスト

`bun test` で実行する。`gh` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。新しい `test` は `src/166.test.ts` と、既存の `src/sdd-skill-sdd-cur.test.ts` の文言期待の更新だけに書く。

- `src/166.test.ts` の `evaluateGate` は、六つの段それぞれで受け入れ条件 11 から 34、48 から 60 の代表ケースを表で確かめる。判定は `loadIssueView` の結果と `currentBranch` だけを使う。[9][11][12][13][14][15][16][17][18][20][21][22][23][24][25][26][27][28][29][30][31][32][33][34][35][48][49][52][53][54][55][56][57][58][59][60]
- `src/166.test.ts` の `cmdGate` は、引数の件数と段と番号の拒否が受け入れ条件 5 と 10 と同じである。[5][10]
- `src/166.test.ts` の `cmdGate` は、`loadIssueView` が拒否したとき終了コード 1 で `allowed` を含む JSON を出さない。[4]
- `src/166.test.ts` の `cmdGate` は、成功時の標準出力が `{"allowed":true}` または `allowed` と `reason` だけの false JSON 一行である。[1][2][3]
- `src/166.test.ts` の `cmdGate` は、ファイルとラベルと課題コメントを変えない。[6][7][8]
- `src/166.test.ts` の `cmdGate` は、作業ブランチ名が `implementationBranch` と一致することを確かめる。[19]
- `src/sdd-skill-sdd-cur.test.ts` は、`sdd-cur gate` と各段名を含み、設計の旧いゲート文の必須文字列を除く。[36][37][38][39][40][41][42][43][50][51]
- `docs/canonical/sdd.md` と `docs/canonical/docs.md` は、正本への差分の識別子どおりである。[46][45]
- `show` の出力形は、既存の `src/cli.test.ts` または `src/166.test.ts` で今と同じである。[44]
- `src/166.test.ts` は、ゲートが confirm または reflect で `allowed` true のあとも、閉じた課題と業務ラベルで confirm と reflect が今と同じ拒否をする。[47]
