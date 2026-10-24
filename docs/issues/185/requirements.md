# 185 ランナーの poll 優先順を動作確認OK、quick 対象、実装完了の順にする

対象は [Issue #185](https://github.com/paterapatera/sdd-cur/issues/185)。`createRunner` の `poll` が、実装依頼の課題が無いときに探す種類の順を、動作確認OK（完了処理）、quick 対象、ラベル「実装完了」による不具合修正に変える。実装依頼があるときの最優先は変えない。

重なる課題は #6（課題ランナー）、#28（不具合修正の poll）、#56（quick）、#96（完了前のマージ）、#126（正本の整理）、#177（quick 判定のラベル限定）である。#177 は poll の優先順を変えないと書くが、本課題で優先順を変える。

## 現状

`createRunner` の `poll` は、ラベル「実装依頼」で `listIssues` し `selectImplementationIssue` で一件選ぶ（`src/runner.ts` の 655 行）。選べたときはその課題だけ返す（`src/runner.ts` の 665 行）。

実装依頼が無いときは、`findFixWorkItem` を呼ぶ（`src/runner.ts` の 669 行）。`findFixWorkItem` はラベル「実装完了」で `listIssues` する（`src/runner.ts` の 573 行）。不具合修正の候補があれば返す（`src/runner.ts` の 670 行）。

続けて、開いている課題を担当者で `listIssues` し `selectQuickIssue` で一件選ぶ（`src/runner.ts` の 674 行）。選べたときは返す（`src/runner.ts` の 682 行）。

続けて、ラベル「動作確認OK」で `listIssues` し `selectCompletionIssue` で一件選ぶ（`src/runner.ts` の 686 行）。選べたときは返す（`src/runner.ts` の 697 行）。どれも無いときは `null` である（`src/runner.ts` の 695 行）。

実装依頼が無いときの種類の順は、不具合修正、quick、動作確認OK（完了処理）である。

`process` は、実装依頼、不具合修正ラベル、quick 条件、ラベル「動作確認OK」の順で分岐する（`src/runner.ts` の 709 行）。

正本 `docs/canonical/sdd.md` は、種類の優先順を実装依頼、不具合修正、quick、動作確認OK（完了処理）と書く（`docs/canonical/sdd.md` の 1585 行）。同ファイルは、実装依頼、不具合修正、quick、動作確認OK の順で、先の種類が一件あるとき後の `listIssues` を呼ばない、と書く（`docs/canonical/sdd.md` の 1642 行）。同ファイルは、`run` の poll の種類の優先順を同じ四段と書く（`docs/canonical/sdd.md` の 1717 行）。

`src/runner-create-runner.test.ts` は、不具合修正があるとき quick 用の `listIssues` を呼ばないことを期待する（`src/runner-create-runner.test.ts` の 1354 行）。同ファイルは、quick があるとき動作確認OK 用の `listIssues` を呼ばないことを期待する（`src/runner-create-runner.test.ts` の 1518 行）。

`src/runner-create-runner-fix.test.ts` は、実装依頼があるとき「実装完了」用の `listIssues` を呼ばないことを期待する（`src/runner-create-runner-fix.test.ts` の 39 行）。

## 受け入れ条件

- `poll` は、一度に仕事を一件だけ返す。挙動は変えない。
- ラベル「実装依頼」の課題が一件でも選べるときは、今どおりその課題を最優先で返す。他の種類は探さない。
- 実装依頼が無いとき、探す種類の順は、動作確認OK（完了処理）、quick 対象、ラベル「実装完了」による不具合修正である。
- 実装依頼が無いとき、動作確認OK（完了処理）の候補が一件でもあるときは、その課題を返す。quick 対象と不具合修正は探さない。
- 実装依頼が無いとき、動作確認OK（完了処理）の候補が無く quick 対象の候補が一件でもあるときは、その課題を返す。不具合修正は探さない。
- 実装依頼が無いとき、上の二種の候補が無く不具合修正の候補があるときは、その課題を返す。
- 先の種類の候補が一件でもあるとき、後の種類のために `listIssues` を呼ばない。実装依頼用の `listIssues` は、実装依頼の探索のためだけに呼ぶ。
- `selectImplementationIssue`、`selectQuickIssue`、`selectCompletionIssue`、`findFixWorkItem` が使う各種類の探索条件と、候補の選び方は変えない。
- `process` の分岐と、着手の規則は変えない。
- `src/runner.ts` の `poll` を、上の順と短絡の規則に合わせる。
- `docs/canonical/sdd.md` の、poll の種類の優先順と先の種類があるとき後を探さない、と書いてある要求は、本課題の順に合わせる。変更は設計の「正本への差分」で行い、識別子は変えない。
- 優先順や `listIssues` の呼び方を前提にしているテストは、新しい順に直す。
- `bun test` は `gh` を起動しない。

## 関係する課題

課題は、次を関係するとする。

- #6（課題ランナー）
- #28（不具合修正の poll）
- #56（quick）
- #96（完了前のマージ）
- #126（正本 `runner.md` などの整理）
- #177（quick 判定のラベル限定）

## 範囲外

次は、この要件に含めない。

- `process` の分岐と着手の規則を変えること
- 各種類の探索条件（開いていること、担当者、業務ラベル、番号昇順、不具合の未処理判定など）を変えること
- 実装依頼があるときの最優先を変えること
- `docs/canonical/runner.md` の古い優先順の整理（#126 の対象）
- 過去の課題の `docs/issues/<番号>/requirements.md` と `design.md` を書き換えること
