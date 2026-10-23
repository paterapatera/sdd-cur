# 153 要件と設計のディレクトリが未追跡だと request が自動コミットせず失敗する

<!-- sdd-cur:form -->

対象は [Issue #153](https://github.com/paterapatera/sdd-cur/issues/153)。#145 のあとでも、課題の `docs/issues/<番号>/` がまだ追跡されていないと、`requestImplementation` が `git status --porcelain` のディレクトリ一行を仕様ファイルのパスと照合できず、`未コミットの変更があります` で失敗する。`statusPorcelain` だけ `--untracked-files=all` を付け、未追跡の仕様ファイルを一行ずつ並べた porcelain で #145 の自動コミットに進める。

## 受け入れ条件

- 1. 条件: 今のブランチが引数の課題番号の作業ブランチ名と一致し、課題の `state` が `open` であり、業務ラベルが無く、要件と設計の `specStatus` がともに `ready` であり、未コミットの変更が `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` の二ファイルだけであり、二ファイルは未追跡の新しいディレクトリにあり、ほかに未コミットの変更が無い 主体: `requestImplementation` 結果: #145 の受け入れ条件 1 と 2 と同様に二ファイルを一つのコミットに含めてコミットし、そのあと作業ブランチを push し、「実装依頼」を付ける
- 2. 条件: 上と同じブランチ・`state`・ラベル・`specStatus` の条件を満たし、`docs/issues/<番号>/` に二つの仕様ファイルと、それ以外の未追跡ファイルがある 主体: `requestImplementation` 結果: 何も変えずに `未コミットの変更があります` で失敗する
- 3. 条件: 上と同じブランチ・`state`・ラベル・`specStatus` の条件を満たし、二つの仕様ファイルの片方だけが未追跡で、もう片方が変更済みであり、ほかに未コミットの変更が無い 主体: `requestImplementation` 結果: 仕様ファイルの自動コミットに進む
- 4. 条件: `createGit` に `GitRunner` を注入したテストで `statusPorcelain` を呼ぶ 主体: テスト 結果: 記録された `git` の引数に `--untracked-files=all` が含まれる
- 5. 条件: `changedPathsOnlySpecFiles` に `?? docs/issues/<番号>/requirements.md` と `?? docs/issues/<番号>/design.md` の二行を渡す 主体: テスト 結果: 真になる
- 6. 条件: `changedPathsOnlySpecFiles` に `?? docs/issues/<番号>/` の一行だけを渡す 主体: テスト 結果: 偽になる
- 7. 条件: `changedPathsOnlySpecFiles` に二つの仕様ファイルの行と `?? docs/issues/<番号>/memo.md` を渡す 主体: テスト 結果: 偽になる
- 8. 条件: この設計の「正本への差分」 主体: 正本 結果: `docs/canonical/git.md` の REQ-794 を、差分どおりに変える
- 9. 条件: `createGit` に `GitRunner` を注入したテストで `hasChanges` を呼ぶ 主体: テスト 結果: 記録された `git` の引数は `status` と `--porcelain` だけであり、`--untracked-files=all` は含まれない
- 10. 条件: `src/153.test.ts` を追加する 主体: テスト 結果: 受け入れ条件 1 から 3、4 から 7、9 をカバーする

## 範囲外

- `hasChanges` の判定を変えること
- 仕様ファイル以外の未コミットを自動でコミットすること
- SDD スキルが `request` の前に自らコミットすること
- `request` 以外のサブコマンドの porcelain の扱い
- `changedPathsOnlySpecFiles` と `requestImplementation` の分岐の変更
- `skills/` と `agents/` の変更
- 既存の `src/145.test.ts` と `src/94.test.ts` に新しい `test` を足すこと

## 決定

| 項目 | 内容 |
|---|---|
| `statusPorcelain` の引数 | `git status --porcelain --untracked-files=all`。`createGit` は `["status", "--porcelain", "--untracked-files=all"]` を渡す |
| `hasChanges` の引数 | `git status --porcelain` のまま。`--untracked-files=all` は付けない |
| `changedPathsOnlySpecFiles` | 変えない。#145 の porcelain の読み取りと「仕様だけの未コミット」の判定のまま |
| 自動コミットの message と git | #145 の設計の決定のまま |
| SDD スキル | git のコミットを行わない（#145 のまま） |

`statusPorcelain` を呼ぶのは `requestImplementation` だけである。`hasChanges` は従来どおり未コミットの有无の入口である。

## 正本への差分

### 変更 git REQ-794

もとになった課題は #145 である。

作業ツリーに未コミットの変更があるときは、次のどちらかである。未コミットの変更が、その課題の `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` の差分だけであり、今のブランチが作業ブランチ名と一致し、課題の `state` が `open` であり、業務ラベルが無く、要件と設計の `specStatus` がともに `ready` であるときは、その二ファイルを一つのコミットに含めてコミットし、コミットメッセージは `docs: 課題 <番号> の要件と設計` である。`<番号>` は引数の課題番号であり、十進で、先頭の零は付けない。それ以外で未コミットの変更があるときは、何も変えずに `未コミットの変更があります` で失敗する。未コミットの変更があるとは、既存の `hasChanges` が真のときである。追跡していないファイルがあるときも真である。未追跡ファイルを、未コミットの変更から外すことは採用しない。未コミットの変更を見るときの porcelain は未追跡ファイルを一件ずつ並べた形である。

## 変えるファイル

- src/git.ts
- docs/canonical/git.md
- src/153.test.ts

## 作業の一覧

- 1. `createGit` の `statusPorcelain` が `["status", "--porcelain", "--untracked-files=all"]` を渡すようにする。`hasChanges` は `["status", "--porcelain"]` のままにする [1][3][4][9]
- 2. `docs/canonical/git.md` の REQ-794 を「正本への差分」どおりに変える [8]
- 3. `src/153.test.ts` を「テスト」のとおり書く [1][2][3][4][5][6][7][9][10]

## テスト

`bun test` で実行する。`gh` と `agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。新しい `test` は `src/153.test.ts` だけに書く。

- `src/153.test.ts` の `createGit` は、`statusPorcelain` を呼んだとき記録された引数に `--untracked-files=all` がある [4]
- `src/153.test.ts` の `createGit` は、`hasChanges` を呼んだとき記録された引数が `["status", "--porcelain"]` であり、`--untracked-files=all` を含まない [9]
- `src/153.test.ts` の `changedPathsOnlySpecFiles` は、`??` の二仕様パスだけのとき真である [5]
- `src/153.test.ts` の `changedPathsOnlySpecFiles` は、`?? docs/issues/<番号>/` の一行だけのとき偽である [6]
- `src/153.test.ts` の `changedPathsOnlySpecFiles` は、二仕様パスと `?? docs/issues/<番号>/memo.md` のとき偽である [7]
- `src/153.test.ts` の `requestImplementation` は、porcelain が二仕様ファイルの `??` 行だけで `ready` のとき `commitPaths` を呼び、続けて `push` と `editLabels` を呼ぶ [1]
- `src/153.test.ts` の `requestImplementation` は、二仕様ファイルの行とほかの未追跡パスがあるとき `commitPaths` を呼ばず `未コミットの変更があります` で失敗する [2]
- `src/153.test.ts` の `requestImplementation` は、片方が `??` で片方が ` M` の二仕様パスだけで `ready` のとき仕様の自動コミットに進む [3]
- `docs/canonical/git.md` の REQ-794 の本文は、正本への差分の変更 git REQ-794 と一文字も違わない [8]
- `src/153.test.ts` を追加し、受け入れ条件 1 から 3、4 から 7、9 をカバーする [10]
