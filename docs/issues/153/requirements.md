# 153 要件と設計のディレクトリが未追跡だと request が自動コミットせず失敗する

<!-- sdd-cur:form -->

対象は [Issue #153](https://github.com/paterapatera/sdd-cur/issues/153)。#145 のあとでも、要件と設計を新しく書いた直後の `sdd-cur request <番号>` が `未コミットの変更があります` で失敗する。課題のディレクトリ `docs/issues/<番号>/` がまだ追跡されていないと、`git status --porcelain` が二つの仕様ファイルではなくディレクトリを一行で返し、仕様ファイルだけの未コミットと判定されないためである。`request` が使う porcelain を、未追跡ファイルを一件ずつ並べる形にして、#145 の仕様ファイルの自動コミットに進めるようにする。

## 現状

`statusPorcelain` は `git status --porcelain` を実行する（`src/git.ts` の 146 行）。`hasChanges` も同じ引数である（`src/git.ts` の 140 行）。

`requestImplementation` は、未コミットがあるとき `statusPorcelain` の出力を `changedPathsOnlySpecFiles` に渡す（`src/request.ts` の 99 行）。`changedPathsOnlySpecFiles` は、porcelain のパスの集合が `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` だけのとき真になる（`src/request.ts` の 43 行）。

未追跡のディレクトリの中に新しいファイルだけがあるとき、`git status --porcelain` は `?? docs/issues/<番号>/` の一行を返す。ディレクトリより上がすべて未追跡なら `?? docs/` になる。このパスは二つの仕様ファイルのどちらとも一致しないので、`changedPathsOnlySpecFiles` は偽になり、`未コミットの変更があります` で拒否する（`src/request.ts` の 108 行）。

`statusPorcelain` は `git status` に `--porcelain` だけを渡し、`--untracked-files=all` は付けない（`src/git.ts` の 147 行）。

#145 は、未コミットの変更がその課題の要件ファイルと設計ファイルだけであるとき、`request` がその二ファイルを一つのコミットにしてから push と「実装依頼」に進む、と定める（`docs/issues/145/requirements.md` の 5 行）。正本の REQ-794 も同じ自動コミットを定める（`docs/canonical/git.md` の 263 行）。

`src/145.test.ts` の porcelain は、追跡済みファイルの ` M docs/issues/145/requirements.md` のような一行ずつだけである（`src/145.test.ts` の 160 行）。未追跡のディレクトリの形は確かめていない。

`statusPorcelain` を呼ぶのは `requestImplementation` だけである（`src/request.ts` の 99 行）。

## 決定

- `createGit` の `statusPorcelain` は `git status --porcelain --untracked-files=all` を実行する。`hasChanges` は変えない。`changedPathsOnlySpecFiles` は変えない。
- SDD スキルは git のコミットを行わない（#145 の決定のまま）。

## 受け入れ条件

- 1. 条件: 今のブランチが引数の課題番号の作業ブランチ名と一致し、課題の `state` が `open` であり、業務ラベルが無く、要件と設計の `specStatus` がともに `ready` であり、未コミットの変更が `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` の二ファイルだけであり、二ファイルは未追跡の新しいディレクトリにあり、ほかに未コミットの変更が無い 主体: `request` 結果: #145 の受け入れ条件 1 と 2 と同様に二ファイルを一つのコミットに含めてコミットし、そのあと作業ブランチを push し、「実装依頼」を付ける
- 2. 条件: 上と同じブランチ・state・ラベル・`specStatus` の条件を満たし、`docs/issues/<番号>/` に二つの仕様ファイルと、それ以外の未追跡ファイルがある 主体: `request` 結果: 何も変えずに `未コミットの変更があります` で失敗する
- 3. 条件: 上と同じブランチ・state・ラベル・`specStatus` の条件を満たし、二つの仕様ファイルの片方だけが未追跡で、もう片方が変更済みであり、ほかに未コミットの変更が無い 主体: `request` 結果: 仕様ファイルの自動コミットに進む
- 4. 条件: `createGit` に `GitRunner` を注入したテストで `statusPorcelain` を呼ぶ 主体: テスト 結果: 記録された `git` の引数に `--untracked-files=all` が含まれる
- 5. 条件: `changedPathsOnlySpecFiles` に `?? docs/issues/<番号>/requirements.md` と `?? docs/issues/<番号>/design.md` の二行を渡す 主体: テスト 結果: 真になる
- 6. 条件: `changedPathsOnlySpecFiles` に `?? docs/issues/<番号>/` の一行だけを渡す 主体: テスト 結果: 偽になる
- 7. 条件: `changedPathsOnlySpecFiles` に二つの仕様ファイルの行と `?? docs/issues/<番号>/memo.md` を渡す 主体: テスト 結果: 偽になる
- 8. 条件: この要件の変更 主体: 正本 結果: `docs/canonical/git.md` の REQ-794 を、この要件の決定に合わせる差分を設計の「正本への差分」に書く。差分には、未コミットの変更を見るときの porcelain は未追跡ファイルを一件ずつ並べた形である、と一文足す
- 9. 条件: `hasChanges` のテスト 主体: テスト 結果: `git status --porcelain` を `--untracked-files=all` なしで呼び続けることを確かめる

## 範囲外

- `hasChanges` の判定を変えること
- 仕様ファイル以外の未コミットを自動でコミットすること
- SDD スキルが `request` の前に自らコミットすること
- `request` 以外のサブコマンドの porcelain の扱い

## 関係する課題

- #145（仕様ファイルの自動コミット）
- #129（設計合格後の「実装依頼する」経路）
- #94（`request` サブコマンド）
- #119（未追跡ディレクトリで `request` が失敗した事例）
