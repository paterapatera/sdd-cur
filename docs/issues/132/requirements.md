# 132 「quick 対象」ラベルが登録時の対象に含まれていない

対象は [Issue #132](https://github.com/paterapatera/sdd-cur/issues/132)。`bun src/cli.ts labels` で GitHub に登録するラベルの対象に、「quick 対象」が含まれていない。人が課題に「quick 対象」ラベルを付けて quick を使う前に、リポジトリにそのラベル名が無いと付けられない。

#56 は、quick の明示として課題本文またはラベル名 `quick 対象` を使う。#56 の範囲外に、「quick 対象」を `ensureWorkflowLabels` で作ることと書いた。いまは、登録だけ足す。

#3 は、業務ラベルを `labels` で登録する。#94 と正本は、「quick 対象」は業務ラベルではない、と定める。この要件は、その定めを変えない。

## 現状

`src/labels.ts` の `workflowLabels` は六件である。名前は「実装依頼」「実装中」「実装完了」「動作確認OK」「マージ済み」「コンフリクト」である（`src/labels.ts` の 7 行）。

`ensureWorkflowLabels` は、`workflowLabels` の六件だけを順に見て、無いものだけ GitHub に作る（`src/labels.ts` の 45 行）。

`src/cli.ts` のサブコマンド `labels` は、引数を取らず、`ensureWorkflowLabels` を呼ぶ（`src/cli.ts` の 174 行）。

README のコマンド表は、`labels` について、作業ツリーのリポジトリに六つの業務ラベルを作る、と書く（`README.md` の 39 行）。

`isQuickTarget` は、課題のラベルのどれかが `quick 対象` と一文字も違わないとき true である（`src/sdd.ts` の 130 行）。

業務ラベルかどうかの集合は、`workflowLabels` の `name` から作る（`src/sdd.ts` の 38 行）。「quick 対象」はその集合に含まれない。

正本 `docs/canonical/labels.md` は、`ensureWorkflowLabels` が `workflowLabels` の件数だけを、無いものだけ作る、と書く（`docs/canonical/labels.md` の 115 行）。

## 受け入れ条件

- `bun src/cli.ts labels` を、対象リポジトリの作業ツリーで実行すると、GitHub 上に名前が `quick 対象` のラベルが存在する。
- 名前が `quick 対象` のラベルがすでに GitHub 上にあるときは、作り直さない。
- `labels` が登録する対象は、業務ラベル六件に加え、名前が `quick 対象` のラベル一件である。
- 名前が `quick 対象` のラベルの、説明と色の定義は `src/labels.ts` に一箇所だけ置く。
- 名前が `quick 対象` のラベルの説明と色の定義は、`workflowLabels` の各要素と同じ形である。
- 名前が `quick 対象` のラベルの説明は `軽微な修正として quick で進める` である。
- 名前が `quick 対象` のラベルの色は、先頭の `#` を付けない 6 桁 `0075CA` である。
- `quick 対象` の名前、説明、色は `workflowLabels` には含めない。
- 業務ラベルは、引き続き `workflowLabels` の `name` だけである。
- 「quick 対象」は業務ラベルではない。
- `workflowLabels` の `name` から作る業務ラベルの集合に、「quick 対象」は含めない。
- `isQuickTarget` が見るラベル名は、登録で使う名前と一文字も違わない。
- `isQuickTarget` が見るラベル名の字面の定義は `src/labels.ts` から取る。
- `src/sdd.ts` で、その字面を別定義しない。
- 既存の同名ラベルがあるときは、色も説明も変えない。
- 既存の同名ラベルがあるときは、`created` にせず `existing` とする。
- 業務ラベル六件について、既存の同名ラベルがあるときの扱いは、いまの `ensureWorkflowLabels` と同じである。
- 登録の途中で拒否したときは、残りを見ない。
- 登録の途中で拒否したとき、すでに作ったものは消さない。
- 業務ラベル六件について、登録の途中で拒否したときの扱いは、いまと同じである。
- `ensureWorkflowLabels` の戻り値の件数は、業務ラベル六件と `quick 対象` の一件の、合計七件である。
- `ensureWorkflowLabels` の戻り値の並びは、先に `workflowLabels` と同じ順の六件、そのあと `quick 対象` 一件である。
- `bun test` は `gh` を起動しない。
- 注入した実行係が、取得と作成の引数と標準入力を記録する。
- この課題のテストは `src/132.test.ts` に書く。
- README の `labels` の行は、業務ラベル六件と `quick 対象` ラベルを、無いものだけ作る、と書く。
- `labels` サブコマンドの引数の取り方は変えない。
- `install` の動作は変えない。
- `run` の動作は変えない。

## 決定

登録対象の `quick 対象` の説明は、次の文字列とする。`軽微な修正として quick で進める`

登録対象の `quick 対象` の色は、次の 6 桁とする。`0075CA`

説明の文字列は #56 の quick が扱う「軽微な修正」の意味に沿う。

`quick 対象` の名前、説明、色は、`workflowLabels` とは別の定数として `src/labels.ts` に置く。`ensureWorkflowLabels` が、六件のあとにこの一件も、同じ規則で見る。

## 関係する課題

課題は、次を関係するとする。

- #3（業務ラベルの登録）
- #56（quick の明示）
- #83（README と実装の一致）

## 範囲外

次は、この要件に含めない。

- 「quick 対象」を業務ラベルにすること
- `isQuickTarget` の条件を変えること
- 課題作成スキルが、作る課題に「quick 対象」を付けること
- 正本 `docs/canonical/` への反映（設計の「正本への差分」で行う）
- `workflowLabels` の六件の名前、説明、色を変えること
