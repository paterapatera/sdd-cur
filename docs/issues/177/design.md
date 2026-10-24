# 177 ランナーの quick 判定で本文の quick 対象 を見ない

<!-- sdd-cur:form -->

対象は [Issue #177](https://github.com/paterapatera/sdd-cur/issues/177)。`isQuickTarget` が課題本文の `quick 対象` という連続した文字列だけでも true になり、仕様引用の課題が quick 候補になる。#164 のような誤判定を防ぐ。ランナーの `poll` が読む判定は、GitHub のラベル名が `quick 対象` と完全一致する場合だけに限定する。人が SDD スキルで本文に書いて quick を始める経路は変えない。

#56 は quick の明示に本文またはラベルを使う。#132 は `quick 対象` ラベルを登録した。本課題は、ランナーと `isQuickTarget` の判定だけをラベルに限定し、正本 `docs/canonical/sdd.md` の該当要求を揃える。

## 受け入れ条件

- 1. 条件: 課題の `labels` のどれかが `quickTargetLabel.name` と一文字も違わない 主体: `isQuickTarget` 結果: true である
- 2. 条件: `labels` に `quickTargetLabel.name` が無く、課題本文に `quickTargetLabel.name` が連続してあるだけ 主体: `isQuickTarget` 結果: false である
- 3. 条件: `labels` に `quickTargetLabel.name` が無く、本文が `quick対象` または `Quick 対象` だけ 主体: `isQuickTarget` 結果: false である
- 4. 条件: `isQuickTarget` が見るラベル名の字面 主体: 実装 結果: `src/labels.ts` の `quickTargetLabel.name` から取り、`src/sdd.ts` でその字面を別定義しない
- 5. 条件: 開いていること、担当者、業務ラベルが無いこと、課題番号の昇順で一件 主体: `selectQuickIssue` 結果: いまの条件のままである
- 6. 条件: `createRunner` の `poll` が仕事の種類を選ぶ 主体: 課題ランナー 結果: 優先順は実装依頼、不具合修正、quick、動作確認OK（完了処理）のままである
- 7. 条件: `bun src/cli.ts labels` と `ensureWorkflowLabels` 主体: 実装 結果: `quick 対象` ラベルの登録と挙動は変えない
- 8. 条件: 本文だけで `isQuickTarget` が true になること、または本文だけで quick 候補になることを期待しているテスト 主体: テスト 結果: ラベル `quick 対象` を付けた課題を前提に直す
- 9. 条件: 実装が正本へ反映したあと 主体: `docs/canonical/sdd.md` 結果: REQ-414、REQ-421、REQ-433、REQ-444 の本文は、この設計の「正本への差分」の各変更の本文と一文字も違わない
- 10. 条件: `skills/` と README を quick の明示の「本文またはラベル」で検索した 主体: この設計 結果: ランナー判定と矛盾する文言は無く、スキルファイルは変えない（決定のとおり）
- 11. 条件: `bun test` を実行する 主体: テスト 結果: `gh` を起動しない

## 範囲外

次は、この要件に含めない。

- quick の poll 対象の、開いていること、業務ラベルが無いこと、担当者が `gh` でログインしている利用者であること、番号昇順で一件、の条件を変えること
- `quick 対象` ラベル名と色と説明の定義を変えること
- `poll` の優先順を変えること
- SDD スキルで人が依頼して quick を始める経路そのものを変えること
- 正本 `docs/canonical/labels.md` の `isQuickTarget` が見るラベル名の定め（#132）を変えること
- 過去の課題の `docs/issues/<番号>/requirements.md` と `design.md` を書き換えること
- `candidateViews` の条件を変えること
- `isQuickTarget` の引数の形を変えること

## 決定

| 項目 | 内容 |
|---|---|
| `isQuickTarget` | `issue.labels` に `quickTargetLabel.name` が含まれるときだけ true。`issue.body` は見ない。引数の `body` は残す |
| ラベル名 | `quickTargetLabel.name` を `src/labels.ts` から import する。`src/sdd.ts` に `quick 対象` の字面を書かない |
| `selectQuickIssue` | `isQuickTarget` 以外の条件は変えない |
| 正本 | `docs/canonical/sdd.md` の REQ-414、REQ-421、REQ-433、REQ-444 だけを変える |
| スキル・人向け文書 | `skills/` と README に、quick の対象を「課題本文またはラベル」と書いた箇所は無い。`skills/sdd-cur-quick/SKILL.md` の description は「quick 対象の課題」とだけ書いており、本文での明示を要求しない。スキルと README は変えない |
| 過去の仕様 | `docs/issues/56/` など過去課題の「本文またはラベル」は履歴として残す。書き換えない |

人が SDD スキルで本文に `quick 対象` を書いて進める運用は、ランナーの `poll` とは別経路である。本課題はランナーが読む `isQuickTarget` と正本の poll 向けの明示だけをラベルに揃える。

## isQuickTarget

`src/sdd.ts` の `isQuickTarget` は、ラベル配列に `quickTargetLabel.name` が含まれるときだけ true を返す。本文の `includes` 分岐は除く。

```ts
export function isQuickTarget(issue: {
  body: string
  labels: readonly string[]
}): boolean {
  return issue.labels.includes(quickTargetLabel.name)
}
```

## 変えるファイル

- src/sdd.ts
- docs/canonical/sdd.md
- src/sdd-is-quick-target.test.ts
- src/132.test.ts
- src/runner-select-quick-issue.test.ts
- src/runner-create-runner.test.ts
- src/runner-create-runner-start-claim.test.ts
- src/95.test.ts

## 作業の一覧

- 1. `isQuickTarget` から本文判定を除き、ラベル一致だけにする。[1][2][3][4]
- 2. `docs/canonical/sdd.md` の REQ-414、REQ-421、REQ-433、REQ-444 を「正本への差分」どおりに変える。[9]
- 3. `src/sdd-is-quick-target.test.ts` と `src/132.test.ts` の `isQuickTarget` 期待をラベル前提に直す。本文だけの true 期待は false にする。[8]
- 4. `src/runner-select-quick-issue.test.ts` の quick 候補課題に `labels: ["quick 対象"]` を付ける。本文だけの課題は候補にしない。[5][8]
- 5. `src/runner-create-runner.test.ts`、`src/runner-create-runner-start-claim.test.ts`、`src/95.test.ts` で、本文だけの `quick 対象` を quick 経路の前提にしている箇所を、同ラベルを付けた課題に直す。[6][8]
- 6. `selectQuickIssue` の条件、`poll` の優先順、`labels` 登録は変えないことを、上記テストの直し以外でコードを触らないことで満たす。[5][6][7]
- 7. `skills/` と README を変えない。quick 明示の「本文またはラベル」は無いことを、この設計の決定で満たす。[10]
- 8. `bun test` は `gh` を起動しない。新しい課題番号のテストファイルは足さない。[11]

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。新しい `src/<番号>.test.ts` は足さない。既存の `src/*.test.ts` の期待だけを直す。

- `src/sdd-is-quick-target.test.ts` は、ラベルに `quick 対象` があるとき true、本文だけ・`quick対象`・`Quick 対象`・無関係本文のとき false を確かめる。[1][2][3]
- `src/132.test.ts` は、`isQuickTarget` がラベルだけで true になることと、`src/sdd.ts` が `quickTargetLabel` を import し字面を別定義しないことを確かめる。`ensureWorkflowLabels` の七件期待は変えない。[1][2][4][7]
- `src/runner-select-quick-issue.test.ts` は、ラベル付き quick 課題の最小番号選択と、閉じた課題・業務ラベル・担当外の除外を確かめる。本文だけの課題は候補にしない。[5][8]
- `src/runner-create-runner.test.ts` と `src/runner-create-runner-start-claim.test.ts` は、quick 経路のモック課題に `labels: ["quick 対象"]` を付け、実装依頼と不具合修正が quick より先に選ばれる期待を残す。[6][8]
- `src/95.test.ts` の quick `poll` 用モック課題に `labels: ["quick 対象"]` を付ける。[8]
- `docs/canonical/sdd.md` の REQ-414、REQ-421、REQ-433、REQ-444 の本文は、正本への差分の各変更の本文と一致する。[9]
- `skills/` と README はテストで読まない。変えない。[10]
- 上記を `bun test` で実行し、`gh` を起動しない。[11]

## 関係する課題

- #6（課題ランナー）
- #56（quick の明示）
- #132（`quick 対象` ラベルの登録）
- #164（本文引用で誤って quick 候補になった例）

#56 の設計は、poll 向けの明示を本文またはラベルと書いた履歴である。本課題はランナー判定と正本だけをラベルに揃え、`docs/issues/56/design.md` は書き換えない。

#132 の `quickTargetLabel` と `ensureWorkflowLabels` の七件登録は残す。`docs/issues/132/design.md` の `isQuickTarget` が本文も見る記述は、#177 実装後のコードと食い違うが、過去設計は書き換えない。

#164 は、本文引用が quick 候補になった事例である。本課題の受け入れは、ラベル無し本文だけでは `selectQuickIssue` が選ばないことで満たす。

## 正本への差分

### 変更 sdd REQ-414

もとになった課題は #56 である。

ラベル名が `quick 対象` と完全一致する課題だけを、quick の対象にする。ラベルが無い課題は対象にしない。課題本文に `quick 対象` という連続した文字列があっても対象にしない。題だけでは対象にしない。

- シナリオ: 条件: 開いている課題にラベル `quick 対象` がある 主体: `selectQuickIssue` 結果: 他の条件を満たすときその課題を quick 候補に含める
- シナリオ: 条件: 課題本文に `quick 対象` が連続してありラベル `quick 対象` が無い 主体: `isQuickTarget` 結果: false である

### 変更 sdd REQ-421

もとになった課題は #56 である。

明示は、ラベル名が `quick 対象` と完全一致することだけである。題は見ない。課題本文に `quick 対象` が連続してあっても明示ではない。

- シナリオ: 条件: 課題にラベル `quick 対象` がある 主体: 課題ランナーの quick 判定 結果: 明示があるとみなす
- シナリオ: 条件: 課題本文にだけ `quick 対象` が連続している 主体: 課題ランナーの quick 判定 結果: 明示が無いとみなす

### 変更 sdd REQ-433

もとになった課題は #56 である。

軽微な修正は、課題を作った人が、ラベルで「quick 対象」と明示したものだけである。課題本文だけの明示は含めない。明示が無い課題は、quick の対象にしない。

- シナリオ: 条件: 課題にラベル `quick 対象` があり業務ラベルが無い 主体: `poll` の quick 選定 結果: 他の条件を満たすとき対象にできる
- シナリオ: 条件: 課題本文だけに `quick 対象` と書いてありラベルが無い 主体: `poll` の quick 選定 結果: 軽微な修正の明示が無いため対象にしない

### 変更 sdd REQ-444

もとになった課題は #56 である。

軽微な修正とみなすのは、ラベルで、課題を作った人が「quick 対象」と明示した課題だけである。課題本文だけの明示は含めない。明示が無い課題は、軽微な修正とみなさない。

- シナリオ: 条件: ラベル `quick 対象` が付いた課題 主体: 正本の軽微な修正の定め 結果: 軽微な修正とみなす
- シナリオ: 条件: 本文だけに `quick 対象` とありラベルが無い課題 主体: 正本の軽微な修正の定め 結果: 軽微な修正とみなさない
