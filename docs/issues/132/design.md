# 132 「quick 対象」ラベルが登録時の対象に含まれていない

対象は [Issue #132](https://github.com/paterapatera/sdd-cur/issues/132)。`bun src/cli.ts labels` で GitHub に登録する対象に、名前が `quick 対象` のラベルを足す。業務ラベル六件の定義と集合は変えない。

#56 は quick の明示にラベル名 `quick 対象` を使う。#56 の範囲外に、`ensureWorkflowLabels` で作ることと書いた。いまは登録だけ足す。#94 と正本は、「quick 対象」は業務ラベルではない、と定める。この設計は、その定めを変えない。

## 受け入れ条件

- 1. `bun src/cli.ts labels` を、対象リポジトリの作業ツリーで実行すると、GitHub 上に名前が `quick 対象` のラベルが存在する。
- 2. 名前が `quick 対象` のラベルがすでに GitHub 上にあるときは、作り直さない。
- 3. `labels` が登録する対象は、業務ラベル六件に加え、名前が `quick 対象` のラベル一件である。
- 4. 名前が `quick 対象` のラベルの、説明と色の定義は `src/labels.ts` に一箇所だけ置く。
- 5. 名前が `quick 対象` のラベルの説明と色の定義は、`workflowLabels` の各要素と同じ形である。
- 6. 名前が `quick 対象` のラベルの説明は `軽微な修正として quick で進める` である。
- 7. 名前が `quick 対象` のラベルの色は、先頭の `#` を付けない 6 桁 `0075CA` である。
- 8. `quick 対象` の名前、説明、色は `workflowLabels` には含めない。
- 9. 業務ラベルは、引き続き `workflowLabels` の `name` だけである。
- 10. 「quick 対象」は業務ラベルではない。
- 11. `workflowLabels` の `name` から作る業務ラベルの集合に、「quick 対象」は含めない。
- 12. `isQuickTarget` が見るラベル名は、登録で使う名前と一文字も違わない。
- 13. `isQuickTarget` が見るラベル名の字面の定義は `src/labels.ts` から取る。
- 14. `src/sdd.ts` で、その字面を別定義しない。
- 15. 既存の同名ラベルがあるときは、色も説明も変えない。
- 16. 既存の同名ラベルがあるときは、`created` にせず `existing` とする。
- 17. 業務ラベル六件について、既存の同名ラベルがあるときの扱いは、いまの `ensureWorkflowLabels` と同じである。
- 18. 登録の途中で拒否したときは、残りを見ない。
- 19. 登録の途中で拒否したとき、すでに作ったものは消さない。
- 20. 業務ラベル六件について、登録の途中で拒否したときの扱いは、いまと同じである。
- 21. `ensureWorkflowLabels` の戻り値の件数は、業務ラベル六件と `quick 対象` の一件の、合計七件である。
- 22. `ensureWorkflowLabels` の戻り値の並びは、先に `workflowLabels` と同じ順の六件、そのあと `quick 対象` 一件である。
- 23. `bun test` は `gh` を起動しない。
- 24. 注入した実行係が、取得と作成の引数と標準入力を記録する。
- 25. この課題のテストは `src/132.test.ts` に書く。
- 26. README の `labels` の行は、業務ラベル六件と `quick 対象` ラベルを、無いものだけ作る、と書く。
- 27. `labels` サブコマンドの引数の取り方は変えない。
- 28. `install` の動作は変えない。
- 29. `run` の動作は変えない。

## 範囲外

次は、この要件に含めない。

- 「quick 対象」を業務ラベルにすること
- `isQuickTarget` の条件を変えること
- 課題作成スキルが、作る課題に「quick 対象」を付けること
- `workflowLabels` の六件の名前、説明、色を変えること
- `src/cli.ts` の `labels` 以外のサブコマンドの追加
- `GitHubClient` の `getLabel` と `createLabel` の契約の変更
- `skills/`、`agents/`、`src/runner.ts` の変更

## 決定

| 項目 | 内容 |
|---|---|
| 別定数 | `src/labels.ts` に `quickTargetLabel` を置く。形は `{ name: string; description: string; color: string }` であり、`workflowLabels` の各要素と同じ三フィールドである |
| 名前 | `quick 対象` |
| 説明 | `軽微な修正として quick で進める` |
| 色 | `0075CA` |
| 業務ラベル | `workflowLabels` の六件の `name` だけ。`quickTargetLabel.name` は含めない |
| 登録 | `ensureWorkflowLabels` は、いまどおり `workflowLabels` を順に見たあと、`quickTargetLabel` を同じ規則で一件見る |
| 既存 | 同名があるときは `createLabel` を呼ばず `"existing"` にする。色と説明は変えない |
| 途中の拒否 | 六件のあいだで拒否したときは、七件目を見ない。六件が終わったあとで拒否したときは、すでに作ったものは消さない |
| 戻り値 | 七件。先頭六件は `workflowLabels` と同じ順、そのあと `quickTargetLabel.name` 一件 |
| `isQuickTarget` | `src/sdd.ts` は `quickTargetLabel.name` を import して、ラベル一致と本文の連続文字列の両方に使う。`src/sdd.ts` に `quick 対象` の字面を書かない |
| README | コマンド表の `` `labels` `` の行だけを変える |

## labels

`src/labels.ts` に次を足す。`workflowLabels` の配列は変えない。

```ts
export const quickTargetLabel: {
  name: string
  description: string
  color: string
} = {
  name: "quick 対象",
  description: "軽微な修正として quick で進める",
  color: "0075CA",
}
```

`ensureWorkflowLabels` は、いまの `workflowLabels` への for ループのあと、`quickTargetLabel` に対して同じ `getLabel` と `createLabel` の分岐を一回だけ行う。ループ本体は、六件目までと七件目で同じ規則である。

`src/sdd.ts` の `QUICK_TARGET_LABEL` と `QUICK_TARGET_BODY` はやめ、`quickTargetLabel.name` を `src/labels.ts` から import する。`isQuickTarget` の真偽の条件は、#56 の設計のままである。

`src/cli.ts` の `labels` サブコマンドは、引数の取り方と `ensureWorkflowLabels` の呼び方を変えない。標準出力の一行ずつの形も変えない。

## ドキュメント

README のコマンド表で、`` `labels` `` の行を次に置き換える。ほかの行は変えない。

置き換え前:

```
| `labels` | 作業ツリーのリポジトリに、六つの業務ラベルを作る。無いものだけ作る |
```

置き換え後:

```
| `labels` | 作業ツリーのリポジトリに、六つの業務ラベルと `quick 対象` ラベルを、無いものだけ作る |
```

## テスト

`bun test` で実行する。`gh` は起動しない。注入した `GhRunner` が、取得と作成の引数と標準入力を記録する。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。

新しく足す `test` は `src/132.test.ts` だけである。既存の `src/*.test.ts` に、新しい `test` は足さない。

`src/132.test.ts` で、注入した `GitHubClient` を使い、次を確かめる。

- `quickTargetLabel` の名前、説明、色が、決定のとおりである。[4][5][6][7][8]
- `ensureWorkflowLabels` の戻り値は七件であり、先頭六件の `name` は `workflowLabels` と同じ順、その七件目の `name` は `quickTargetLabel.name` である。[21][22]
- 七件目だけ GitHub に無いとき、七件目だけ `createLabel` され、標準入力の JSON は `name`、`color`、`description` の順で `quickTargetLabel` の三フィールドと一致する。[1][2][4][15][16]
- 七件目がすでにあるとき、七件目に `createLabel` は呼ばれず、七件目の `status` は `"existing"` である。[2][15][16]
- 三件目の `createLabel` が拒否したとき、四件目以降の `getLabel` は呼ばれず、七件目も見ない。[18][19][20]
- `isQuickTarget` は、ラベルに `quickTargetLabel.name` があるとき、および本文にその名前が連続してあるとき true である。条件そのものは変えない。[12][13][14]

`src/labels.test.ts` の、`` `ensureWorkflowLabels` の無いラベルだけ `` の期待は、戻り値が七件になるよう変える。三件目で止まる試験の、`getCalls` と `createCalls` が三である期待は変えない。[20][21]

ファイルを読んで確かめる。

- README のコマンド表の `` `labels` `` の行が、置き換え後の文言である。[26]
- `src/sdd.ts` に、`quick 対象` という字面の定数定義が無い。`quickTargetLabel` は `src/labels.ts` から import している。[13][14]

## 一度に実装できる大きさ

一つの作業が一度に実装できる大きさであるとは、次のとおりである。

- `[<番号>]` を一つ以上持つ作業では、その番号の受け入れ条件に直結する実装を、他の受け入れ条件に直結する実装を含めず、実装作成役の一回の起動で書き終えられる
- `[<番号>]` が無い作業では、その作業の行に書かれた実装を、一回の起動で書き終えられる

この課題は、作業を分けなくても上を満たす。

## 変えるファイル

- src/labels.ts
- src/sdd.ts
- src/labels.test.ts
- src/132.test.ts
- README.md
- docs/canonical/labels.md

## 作業の一覧

- 1. `quickTargetLabel` を足し、`ensureWorkflowLabels` が七件を返すようにする。`src/sdd.ts` は `quickTargetLabel.name` を import する。[1][2][3][4][5][6][7][8][9][10][11][12][13][14][15][16][17][18][19][20][21][22][27][28][29]
- 2. README の `` `labels` `` の行を置き換える。[26]
- 3. `src/labels.test.ts` と `src/132.test.ts` を「テスト」のとおり書く。[23][24][25]
- 4. この設計の `## 正本への差分` を、同じ作業ツリーの `docs/canonical/labels.md` へ反映する。要求ファイルと設計ファイルは変えない。[1][2][3][4][5][6][7][8][9][10][11][12][13][14][15][16][17][18][19][20][21][22]

## 関係する課題

- #3（業務ラベルの登録）
- #56（quick の明示）
- #83（README と実装の一致）

#3 の `labels` 入口と、無いものだけ作る規則は残す。`docs/issues/3/design.md` は書き換えない。

#56 の quick 対象の明示と、`isQuickTarget` の条件は残す。`docs/issues/56/design.md` は書き換えない。

#83 は README と実装の一致である。この課題は、`` `labels` `` の一行だけを揃える。

## 正本への差分

### 変更 labels REQ-62

もとになった課題は #132 である。

`bun src/cli.ts labels` を、対象リポジトリの作業ツリーで実行すると、業務ラベル六件と、名前が `quick 対象` のラベル一件が GitHub 上に存在する。すでにあるラベルは作り直さない。

### 変更 labels REQ-63

もとになった課題は #132 である。

業務ラベル六件の名前、説明、色の定義は `workflowLabels` だけが持つ。名前が `quick 対象` のラベルの名前、説明、色の定義は `quickTargetLabel` だけが持つ。この課題では `editLabels` を呼ばない。

### 変更 labels REQ-66

もとになった課題は #132 である。

作成は`GitHubClient` に `getLabel` と `createLabel` を足す。`ensureWorkflowLabels` が業務ラベル六件を順に、続けて名前が `quick 対象` のラベル一件を、無いものだけ作るである。

### 変更 labels REQ-77

もとになった課題は #132 である。

`ensureWorkflowLabels` は、先に `workflowLabels` の順に `getLabel` を呼ぶ。`null` のときだけ `createLabel` を呼び、`status` を `"created"` にする。名前が返ったときは `createLabel` を呼ばず `"existing"` にする。そのあと、名前が `quick 対象` のラベルについて、同じ規則で `getLabel` と `createLabel` を一回だけ行う。戻り値は七件で、並びは `workflowLabels` と同じ六件のあと、名前が `quick 対象` のラベル一件である。

### 追加 labels REQ-92

もとになった課題は #132 である。

`src/labels.ts` に `quickTargetLabel` を置く。形は `{ name: string; description: string; color: string }` であり、`workflowLabels` の各要素と同じ三フィールドである。名前は `quick 対象`、説明は `軽微な修正として quick で進める`、色は `0075CA` である。`quickTargetLabel` は `workflowLabels` に含めない。

### 追加 labels REQ-93

もとになった課題は #132 である。

名前が `quick 対象` のラベルは業務ラベルではない。`workflowLabels` の `name` から作る業務ラベルの集合に含めない。

### 追加 labels REQ-94

もとになった課題は #132 である。

`isQuickTarget` が見るラベル名の字面は、`quickTargetLabel.name` である。`bun src/cli.ts labels` が登録で使う名前と一文字も違わない。字面の定義は `src/labels.ts` に一箇所だけ置き、`src/sdd.ts` で別定義しない。
