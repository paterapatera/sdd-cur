# 185 ランナーの poll 優先順を動作確認OK、quick 対象、実装完了の順にする

対象は [Issue #185](https://github.com/paterapatera/sdd-cur/issues/185)。`createRunner` の `poll` が、実装依頼の課題が無いときに探す種類の順を、動作確認OK（完了処理）、quick 対象、ラベル「実装完了」による不具合修正に変える。実装依頼があるときの最優先は変えない。

#177 の設計は、poll の優先順を変えないと書いたが、本課題で実装依頼の次を動作確認OK、quick、不具合修正に変える。`process` の分岐順（実装依頼、不具合修正ラベル、quick、動作確認OK）は、課題のラベルに応じた処理のままである。

## 受け入れ条件

- 1. 条件: `poll` を呼ぶ 主体: 課題ランナー 結果: 一度に仕事を一件だけ返す（挙動は変えない）
- 2. 条件: ラベル「実装依頼」の課題が `selectImplementationIssue` で一件選べる 主体: `poll` 結果: その課題だけを返し、動作確認OK・quick・不具合修正の探索は行わない
- 3. 条件: 実装依頼が選べず、動作確認OK（完了処理）の候補が一件でもある 主体: `poll` 結果: その課題を返し、quick と不具合修正は探さない
- 4. 条件: 実装依頼と動作確認OK の候補が無く、quick 対象の候補が一件でもある 主体: `poll` 結果: その課題を返し、不具合修正は探さない
- 5. 条件: 実装依頼・動作確認OK・quick の候補が無く、不具合修正の候補がある 主体: `poll` 結果: その不具合修正の課題を返す
- 6. 条件: 先の種類の候補が一件でもある 主体: `poll` 結果: 後の種類のために `listIssues` を呼ばない。実装依頼用の `listIssues` は実装依頼の探索のためだけに呼ぶ
- 7. 条件: 各探索 主体: `selectImplementationIssue`、`selectQuickIssue`、`selectCompletionIssue`、`findFixWorkItem` 結果: 使う条件と候補の選び方は変えない
- 8. 条件: 課題を処理する 主体: `process` 結果: 分岐と着手の規則は変えない
- 9. 条件: 実装 主体: `src/runner.ts` の `poll` 結果: 上の順と短絡の規則に合わせる
- 10. 条件: 正本反映後 主体: `docs/canonical/sdd.md` の REQ-415、REQ-424、REQ-436 結果: 本文は本設計の「正本への差分」の各変更の本文と一文字も違わない
- 11. 条件: 優先順や `listIssues` の呼び方を前提にしたテスト 主体: テスト 結果: 新しい順に直す
- 12. 条件: `bun test` を実行する 主体: テスト 結果: `gh` を起動しない

## 範囲外

次は、この要件に含めない。

- `process` の分岐と着手の規則を変えること
- 各種類の探索条件（開いていること、担当者、業務ラベル、番号昇順、不具合の未処理判定など）を変えること
- 実装依頼があるときの最優先を変えること
- `docs/canonical/runner.md` の古い優先順の整理（#126 の対象）
- 過去の課題の `docs/issues/<番号>/requirements.md` と `design.md` を書き換えること

## 決定

| 項目 | 内容 |
|---|---|
| 実装依頼 | いまどおり最初。ラベル「実装依頼」で `listIssues` し `selectImplementationIssue`。一件選べたら返して終わり |
| 実装依頼が無いときの順 | 動作確認OK（完了処理）、quick 対象、不具合修正（ラベル「実装完了」と `findFixWorkItem` の判定） |
| 短絡 | 動作確認OK の候補が一件でもあれば、quick 用・不具合修正用の `listIssues`（および `findFixWorkItem` 内の追加呼び出し）は行わない。動作確認OK が無く quick の候補が一件でもあれば、不具合修正は探さない |
| `findFixWorkItem` | 本体は変えない。`poll` から呼ぶ位置だけ、quick の探索の後に移す |
| `process` | `hasRequest`、`issueHasFixLabels`、quick、`LABEL_VERIFIED` の分岐順は変えない |
| 正本 | REQ-415、REQ-424、REQ-436 の poll 優先順の文だけ変える。識別子は変えない |

## poll

`src/runner.ts` の `createRunner` が返す `poll` は、実装依頼のブロックのあと、次の順で探す。

1. ラベル「動作確認OK」で `listIssues`（`assignee` は `viewerLogin` の利用者、`limit` は 100）。`selectCompletionIssue` で一件選べたら `{ id: "<番号>" }` を返す。
2. 選べなければ、開いている課題を担当者で `listIssues`（いまと同じ引数）。`selectQuickIssue` で一件選べたら返す。
3. 選べなければ、`findFixWorkItem(deps, login)` を呼ぶ。非 `null` なら返す。
4. どれも無ければ `null`。

実装依頼用の `listIssues` と `selectImplementationIssue` は、いまの行順・引数・戻りの扱いのまま先頭に置く。

```ts
// 実装依頼ブロック（変更なし）の直後に、いまの 686–697 行相当（動作確認OK）を置き、
// 続けて 674–684 行相当（quick）、最後に 669–672 行相当（findFixWorkItem）を置く。
```

各 `listIssues` のラベル・`state`・`assignee`・`limit` は、移動前と同じである。`withRetry` の包み方も変えない。

## 変えるファイル

- src/runner.ts
- docs/canonical/sdd.md
- src/runner-create-runner.test.ts
- src/runner-create-runner-completion.test.ts
- src/runner-create-runner-fix.test.ts

## 作業の一覧

- 1. `poll` で実装依頼の次を、動作確認OK、quick、`findFixWorkItem` の順に並べ替え、短絡どおり後段の `listIssues` を呼ばないようにする。[3][4][5][6][9]
- 2. `docs/canonical/sdd.md` の REQ-415、REQ-424、REQ-436 を「正本への差分」どおりに変える。[10]
- 3. `src/runner-create-runner.test.ts` の poll 短絡テストを新しい順に合わせる。動作確認OK があるとき quick・不具合修正用の `listIssues` を呼ばないこと、quick があるとき不具合修正を探さないこと、実装依頼があるとき従来どおり後段を呼ばないことを確かめる。[6][11]
- 4. `src/runner-create-runner-completion.test.ts` の `listIssues` 回数や、実装依頼があるとき動作確認OK を探さない期待を、動作確認OK が実装依頼の直後に探される順に合わせる。[3][6][11]
- 5. `src/runner-create-runner-fix.test.ts` の、実装依頼優先と実装完了探索の期待を、動作確認OK と quick が先に試される順に合わせる。[2][4][5][11]
- 6. `selectImplementationIssue`、`selectQuickIssue`、`selectCompletionIssue`、`findFixWorkItem`、`process` の探索条件・分岐は、上記以外でコードを触らないことで変えない。[7][8]
- 7. `bun test` は `gh` を起動しない。[12]

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。新しい `src/<番号>.test.ts` は足さない。

- `src/runner-create-runner.test.ts` は、実装依頼が一件あるとき後段の open・`LABEL_VERIFIED`・`LABEL_DONE` 用の quick 相当 `listIssues` を呼ばない期待を残す。[2][6]
- 同ファイルは、「不具合修正だけがあるとき quick を呼ばない」を、「quick だけがあるとき `LABEL_DONE` 用の不具合修正探索（`findFixWorkItem` が進むまでの `listIssues`）を呼ばない」に直す。動作確認OK だけがあるときは quick と不具合修正を呼ばず、その課題を返すテストを足すか既存の完了系期待に寄せる。[3][4][5][6]
- 同ファイルは、「quick があるとき動作確認OK を探さない」を、「動作確認OK があるとき quick を探さない」に直す。[3][6]
- `src/runner-create-runner-completion.test.ts` の「前段が空のとき動作確認OK を探す」は、実装依頼の `listIssues` のあと動作確認OK 用だけで返るため、`listIssues` の回数が新しい順と一致する。[3][6]
- `src/runner-create-runner-fix.test.ts` の実装依頼と実装完了の poll 期待は、動作確認OK・quick が先に試されることを反映する。[2][4][5]
- `docs/canonical/sdd.md` の REQ-415、REQ-424、REQ-436 は正本への差分の各変更本文と一致する。[10]
- 上記を `bun test` で実行し、`gh` を起動しない。[12]

## 関係する課題

- #6（課題ランナー）
- #28（不具合修正の poll）
- #56（quick）
- #96（完了前のマージ）
- #126（正本 `runner.md` などの整理）
- #177（quick 判定のラベル限定）

#177 の設計は poll 優先順を変えないと書いた履歴である。本課題は REQ-415、REQ-424、REQ-436 の優先順だけを変え、`docs/issues/177/design.md` は書き換えない。

#96 の完了処理と取り込みは、`process` 側のままである。本課題は `poll` が動作確認OK をより早く返すことだけを変える。

## 正本への差分

### 変更 sdd REQ-415

もとになった課題は #56 である。

poll が返す仕事は一つである。種類の優先順は、実装依頼、動作確認OK（完了処理）、quick、不具合修正である。先の種類が一件でもあるときは、後の種類を探さない。

- シナリオ: 条件: 実装依頼の候補が一件も無く、動作確認OK の候補が一件ある 主体: `poll` 結果: 動作確認OK の課題を返し、quick と不具合修正は探さない
- シナリオ: 条件: 実装依頼と動作確認OK の候補が無く、quick の候補が一件ある 主体: `poll` 結果: quick の課題を返し、不具合修正は探さない

### 変更 sdd REQ-424

もとになった課題は #56 である。

優先は実装依頼、動作確認OK（完了処理）、quick、不具合修正。先の種類が一件あるときは、後の `listIssues` を呼ばない。

- シナリオ: 条件: 動作確認OK の候補が一件ある 主体: `poll` 結果: quick 用と不具合修正用の `listIssues` を呼ばない
- シナリオ: 条件: 動作確認OK の候補が無く quick の候補が一件ある 主体: `poll` 結果: 不具合修正用の `listIssues` を呼ばない

### 変更 sdd REQ-436

もとになった課題は #56 である。

`run` の poll は、仕事を一つ返す。種類の優先順は、実装依頼、動作確認OK（完了処理）、quick、不具合修正である。同時に複数種があるときは、この順で最初の 1 件だけ返す。

- シナリオ: 条件: 実装依頼の候補が無く、動作確認OK と quick の候補が同時にある 主体: `run` の `poll` 結果: 動作確認OK の課題だけ返す
- シナリオ: 条件: 実装依頼の候補が無く、動作確認OK の候補が無く quick と不具合修正の候補がある 主体: `run` の `poll` 結果: quick の課題だけ返す
