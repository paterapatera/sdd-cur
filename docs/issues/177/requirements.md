# 177 ランナーの quick 判定で本文の quick 対象 を見ない

対象は [Issue #177](https://github.com/paterapatera/sdd-cur/issues/177)。`isQuickTarget` が課題本文に `quick 対象` という連続した文字列があるだけでも true になるため、仕様や説明の引用だけの課題が quick 候補になる。#164 の本文に「quick 対象」が含まれ、ラベルを付けていないのに担当が付いていると、#176 より先に quick 候補になった。

ランナーと `isQuickTarget` は、GitHub のラベル名が `quick 対象` と完全一致する場合だけ quick の対象とみなす。課題本文に同じ文字列があっても反応しない。SDD スキルで人が本文に書いて quick を始める運用は、ランナーの `poll` とは別経路である。スキルや人向け文書の「本文またはラベル」という文言をどこまでラベルだけに揃えるかは、設計で決める。

#56 は quick の明示として本文またはラベルを使う。#132 は `quick 対象` ラベルの登録を足した。本課題は、ランナーが読む判定だけをラベルに限定する。登録と poll の優先順は変えない。

## 現状

`isQuickTarget` は、課題の `labels` のどれかが `quickTargetLabel.name` と一文字も違わないとき true を返す（`src/sdd.ts` の 134 行）。`labels` に無いときは、`issue.body.includes(quickTargetLabel.name)` が true なら true を返す（`src/sdd.ts` の 137 行）。どちらも無いときは false である（`src/sdd.ts` の 140 行）。

`selectQuickIssue` は、開いていて、担当者に `login` が含まれ、業務ラベルが無く、`isQuickTarget` が true の課題だけを残し、課題番号の昇順で一件返す（`src/runner.ts` の 186 行）。

`createRunner` の `poll` は、実装依頼のあと不具合修正を見、続けて `selectQuickIssue` を呼ぶ（`src/runner.ts` の 593 行）。

正本 `docs/canonical/sdd.md` は、課題本文に `quick 対象` という連続した文字列がある、またはラベル名が `quick 対象` と完全一致する課題だけを quick の対象にする、と書く（`docs/canonical/sdd.md` の 1537 行）。同ファイルは、明示を本文の連続またはラベルの完全一致と書く箇所がある（`docs/canonical/sdd.md` の 1579 行）。軽微な修正を課題本文またはラベルでの明示と書く箇所がある（`docs/canonical/sdd.md` の 1651 行、1711 行）。

`src/sdd-is-quick-target.test.ts` は、本文だけでも `isQuickTarget` が true になることを期待する（`src/sdd-is-quick-target.test.ts` の 32 行）。`src/132.test.ts` も同様である（`src/132.test.ts` の 168 行）。ランナーのテストは、本文に `quick 対象` だけの課題を quick 候補にする（`src/runner-select-quick-issue.test.ts` の 41 行）。

## 受け入れ条件

- `isQuickTarget` は、課題の `labels` のどれかが `quickTargetLabel.name` と一文字も違わないときだけ true である。
- `isQuickTarget` は、`labels` に `quickTargetLabel.name` が無く、課題本文に `quickTargetLabel.name` が連続してあるだけのとき false である。
- `isQuickTarget` は、`labels` に `quickTargetLabel.name` が無く、本文が `quick対象` または `Quick 対象` だけのとき false である。
- `isQuickTarget` が見るラベル名の字面は、引き続き `src/labels.ts` の `quickTargetLabel.name` から取る。
- `src/sdd.ts` で、その字面を別定義しない。
- `selectQuickIssue` の、開いていること、担当者、業務ラベルが無いこと、課題番号の昇順で一件、の条件は変えない。
- `poll` の種類の優先順は、実装依頼、不具合修正、quick、動作確認OK（完了処理）のままである。
- `bun src/cli.ts labels` が登録する `quick 対象` ラベルと、`ensureWorkflowLabels` の挙動は変えない。
- `src/sdd-is-quick-target.test.ts`、`src/132.test.ts`、`src/runner-select-quick-issue.test.ts` と、本文だけで `isQuickTarget` が true になること、または本文だけで quick 候補になることを期待しているテストは、ラベル前提に直す。
- `docs/canonical/sdd.md` の、quick の対象または軽微な修正の明示が課題本文またはラベルと書いてある要求は、ラベルでの明示だけに変える。変更は設計の「正本への差分」で行い、識別子は変えない。
- 設計は、課題本文に書いてあるとおり、スキルや `docs/canonical/` の他ファイルに「本文またはラベル」と書いてある箇所を、ラベルだけに揃える範囲を決める。
- `bun test` は `gh` を起動しない。

## 関係する課題

課題は、次を関係するとする。

- #6（課題ランナー）
- #56（quick の明示）
- #132（`quick 対象` ラベルの登録）
- #164（本文引用で誤って quick 候補になった例）

## 範囲外

次は、この要件に含めない。

- quick の poll 対象の、開いていること、業務ラベルが無いこと、担当者が `gh` でログインしている利用者であること、番号昇順で一件、の条件を変えること
- `quick 対象` ラベル名と色と説明の定義を変えること
- `poll` の優先順を変えること
- SDD スキルで人が依頼して quick を始める経路そのものを変えること
- 正本 `docs/canonical/labels.md` の `isQuickTarget` が見るラベル名の定め（#132）を変えること
- 過去の課題の `docs/issues/<番号>/requirements.md` と `design.md` を書き換えること
