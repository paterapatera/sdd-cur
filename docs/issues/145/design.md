# 145 設計完了後に「実装依頼する」を選んでも未コミットで request が失敗する

<!-- sdd-cur:form -->

対象は [Issue #145](https://github.com/paterapatera/sdd-cur/issues/145)。`requestImplementation` が、要件と設計の二ファイルだけが未コミットのとき、その二ファイルを一つのコミットにしてから push と「実装依頼」に進む。

## 受け入れ条件

- 1. 条件: 今のブランチが引数の課題番号の作業ブランチ名と一致し、課題の `state` が `open` であり、業務ラベルが無く、要件と設計の `specStatus` がともに `ready` であり、未コミットの変更が `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` の差分だけである 主体: `requestImplementation` 結果: その二ファイルを一つのコミットに含めてコミットする
- 2. 条件: 受け入れ条件 1 のコミット 主体: `requestImplementation` 結果: コミットメッセージは `docs: 課題 <番号> の要件と設計` と一文字も違わない。`<番号>` は引数の課題番号であり、十進で、先頭の零は付けない
- 3. 条件: 受け入れ条件 1 の直前に、二ファイルに差分が無く、他の未コミットの変更も無い 主体: `requestImplementation` 結果: コミットを新しく作らない
- 4. 条件: 作業ブランチ上で、課題の `state` が `open` であり、業務ラベルが無く、要件と設計が `ready` であり、上の二ファイル以外に未コミットの変更がある 主体: `requestImplementation` 結果: 何も変えずに `未コミットの変更があります` で失敗する
- 5. 条件: 要件または設計の `specStatus` が `ready` でない 主体: `requestImplementation` 結果: 仕様用の自動コミットは行わない
- 6. 条件: 今のブランチが作業ブランチ名と一致しない 主体: `requestImplementation` 結果: 何も変えずに `作業ブランチではありません` で失敗する
- 7. 条件: 設計の合格の案内で人が「実装依頼する」を選び、作業ブランチ上で要件と設計だけが未コミットである 主体: SDD スキル 結果: `sdd-cur request <番号>` を実行する
- 8. 条件: 受け入れ条件 1 のコミットの直後、または受け入れ条件 3 のとおりコミットを作らなかった直後であり、未コミットの変更が無く、課題の `state` が `open` であり、業務ラベルが無く、要件と設計の `specStatus` が `ready` であり、リモート名の確認が成功した 主体: `requestImplementation` 結果: 作業ブランチを push する
- 9. 条件: 受け入れ条件 8 の push が成功した 主体: `requestImplementation` 結果: 「実装依頼」を付ける
- 10. 条件: 要件または設計の `specStatus` が `ready` でなく、未コミットの変更が無い 主体: `requestImplementation` 結果: 何も変えずに、従来の `specStatus` 失敗と同じ message で失敗する
- 11. 条件: 要件または設計の `specStatus` が `ready` でなく、未コミットの変更がある 主体: `requestImplementation` 結果: 何も変えずに `未コミットの変更があります` で失敗する
- 12. 条件: 受け入れ条件 7 のとおり `sdd-cur request <番号>` を実行する 主体: SDD スキル 結果: スキル自身は git のコミットを行わない
- 13. 条件: 二ファイルだけが未コミットで `specStatus` が `ready` だが、課題の `state` が `open` でない、または業務ラベルがある 主体: `requestImplementation` 結果: コミットを作らず、従来どおり `課題は閉じています` または `実装のラベルが付いています` で失敗する
- 14. 条件: `src/145.test.ts` を追加する 主体: テスト 結果: 受け入れ条件 1 から 6、および 8 から 11 と 13 をカバーする

## 範囲外

- `skills/` と `agents/` の変更
- 実装コードや実装中の作業ツリーの自動コミット
- `request` 以外のサブコマンドでの仕様ファイルの自動コミット
- `export type GitClient` へのメソッド追加
- `printUsage` の変更

## 決定

| 項目 | 内容 |
|---|---|
| 仕様のパス | `specPaths(issueNumber)` の `requirements` と `design` だけが、未コミットの対象として自動コミットに入る |
| porcelain の読み取り | `git status --porcelain` の出力を行ごとに分け、各行の先頭三文字を除いた残りから、リポジトリ相対パスを一つ取る。`->` がある行は、矢印の右側のパスを取る |
| 仕様だけの未コミット | porcelain に現れるパスの集合が、上の二パスだけであるとき真。集合が空のときは偽。それ以外のパスが一つでもあるときは偽 |
| 自動コミットの message | `docs: 課題 <番号> の要件と設計`。`<番号>` は引数の課題番号であり、十進で、先頭の零は付けない |
| 自動コミットの git | `git add` に二パスを渡し、続けて `git commit -m` に message を渡す。`git add -A` は使わない |
| 確認の順 | 今のブランチ、未コミットの変更の分岐、課題の `state`、業務ラベル、要件の `specStatus`、設計の `specStatus`、仕様の自動コミット、未コミットの変更の再確認、リモート名、push、ラベル付与 |
| 未コミットの分岐 | `hasChanges` が偽のときは、仕様の自動コミットを飛ばし、`openGitHub` へ進む。真のときは `readSpecs` と porcelain を見る。仕様だけの未コミットでないときは `未コミットの変更があります` で拒否する。仕様だけのときは `openGitHub` で `state` と業務ラベルを確認し、`readSpecs` で `specStatus` を確認する。`ready` でないときは、未コミットがあるので `未コミットの変更があります` で拒否する。`state` または業務ラベルが通らないときは、コミットせず、従来の message で拒否する。すべて通ったときだけ自動コミットし、`hasChanges` を再び呼ぶ。まだ真なら `未コミットの変更があります` で拒否する |
| 二ファイルに差分が無い | 仕様だけの未コミットだが、porcelain が空のときは、自動コミットは作らない |
| 失敗時 | 自動コミットの前に拒否したときは、`commitPaths` を呼ばない。`push` と `editLabels` も呼ばない |

`requestImplementation` の `deps.git` は、既存の四メソッドに加え、`statusPorcelain(): Promise<string>` と `commitPaths(message: string, paths: readonly [string, string]): Promise<void>` を持つ。`src/cli.ts` の `request` は、`createGit` の戻り値に、この二つを足して渡す。`createGit` は `statusPorcelain` で `git status --porcelain` の stdout を返す。`commitPaths` は、引数の二パスだけを `git add` し、`git commit -m` する。

`src/request.ts` に `export function changedPathsOnlySpecFiles(porcelain: string, requirementsPath: string, designPath: string): boolean` を置く。上の「仕様だけの未コミット」の判定を行う。

## 正本への差分

### 変更 git REQ-794

もとになった課題は #145 である。

作業ツリーに未コミットの変更があるときは、次のどちらかである。未コミットの変更が、その課題の `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` の差分だけであり、今のブランチが作業ブランチ名と一致し、課題の `state` が `open` であり、業務ラベルが無く、要件と設計の `specStatus` がともに `ready` であるときは、その二ファイルを一つのコミットに含めてコミットし、コミットメッセージは `docs: 課題 <番号> の要件と設計` である。`<番号>` は引数の課題番号であり、十進で、先頭の零は付けない。それ以外で未コミットの変更があるときは、何も変えずに `未コミットの変更があります` で失敗する。未コミットの変更があるとは、既存の `hasChanges` が真のときである。追跡していないファイルがあるときも真である。未追跡ファイルを、未コミットの変更から外すことは採用しない。

### 変更 git REQ-800

もとになった課題は #145 である。

確認の順は、今のブランチ、未コミットの変更、課題の `state`、業務ラベル、要件の `specStatus`、設計の `specStatus`、仕様ファイルの自動コミット、未コミットの変更の再確認、リモート名、push、ラベル付与である。未コミットの変更の確認では、REQ-794 の自動コミットに進む分岐を行う。先の確認が失敗したときは、後の確認とコミットと push とラベル付与はしない。

### 変更 git REQ-797

もとになった課題は #145 である。

要件の状態が `ready` でないときは、何も変えずに失敗する。未コミットの変更があるときは、`未コミットの変更があります` で失敗する。未コミットの変更が無いときは、`missing` の message は `要件がありません` である。`invalid` の message は `要件の見出しが不正です` である。この `ready` は、既存の `specStatus` の `ready` である。`validate` の形式検査とは別である。

### 変更 git REQ-798

もとになった課題は #145 である。

設計ファイルの `specStatus` を見て、戻りが `ready` 以外なら、失敗で戻る。戻るときに変えるものはない。未コミットの変更があるときは、`未コミットの変更があります` で失敗する。未コミットの変更が無いとき、戻りが `missing` であるときの message 字面は、`設計がありません` と一文字も違わない。戻りが `invalid` であるときの message 字面は、`設計の見出しが不正です` と一文字も違わない。ここで使う `ready` は、既存の `specStatus` の `ready` である。

## 変えるファイル

- src/request.ts
- src/git.ts
- src/cli.ts
- src/94.test.ts
- src/145.test.ts
- docs/canonical/git.md

## 作業の一覧

- 1. `changedPathsOnlySpecFiles` と、未コミット分岐を含む `requestImplementation` の順序を実装する [1][2][3][4][5][6][8][9][10][11][13]
- 2. `createGit` に `statusPorcelain` と `commitPaths` を足し、`cli` の `request` から渡す [1][2]
- 3. `docs/canonical/git.md` の REQ-794、REQ-800、REQ-797、REQ-798 を「正本への差分」どおりに変える [8]
- 4. `src/94.test.ts` を新しい `deps.git` の形に合わせ、`src/145.test.ts` で受け入れ条件をカバーする [14]
- 5. `skills/sdd-cur/SKILL.md` は変えない。受け入れ条件 7 と 12 は、#129 の経路のままである [7][12]

## テスト

- `src/145.test.ts` の `changedPathsOnlySpecFiles` は、porcelain が二パスだけのとき真、ほかのパスがあるとき偽、空のとき偽である [1]
- `src/145.test.ts` の `requestImplementation` は、仕様だけが未コミットで `ready` のとき `commitPaths` を呼び、続けて `push` と `editLabels` を呼ぶ [1][2][8][9]
- `src/145.test.ts` の `requestImplementation` は、未コミットが無いとき `commitPaths` を呼ばない [3]
- `src/145.test.ts` の `requestImplementation` は、仕様以外の未コミットがあるとき `commitPaths` を呼ばず `未コミットの変更があります` で失敗する [4]
- `src/145.test.ts` の `requestImplementation` は、`specStatus` が `ready` でないとき `commitPaths` を呼ばない [5]
- `src/94.test.ts` の `requestImplementation` は、作業ブランチでないとき `作業ブランチではありません` で失敗する [6]
- `skills/sdd-cur/SKILL.md` は、この設計の範囲外である。受け入れ条件 7 と 12 は #129 の要件のままである [7][12]
- `src/145.test.ts` の `requestImplementation` は、`specStatus` が `ready` でなく未コミットがあるとき `未コミットの変更があります` で失敗する [11]
- `src/145.test.ts` の `requestImplementation` は、`specStatus` が `ready` でなく未コミットが無いとき、従来の `specStatus` message で失敗する [10]
- `src/145.test.ts` の `requestImplementation` は、仕様だけが未コミットだが課題が閉じているとき `commitPaths` を呼ばず `課題は閉じています` で失敗する [13]
- `src/94.test.ts` の既存 `requestImplementation` テストは、新しい `deps.git` のスタブを渡す形に直す [14]
