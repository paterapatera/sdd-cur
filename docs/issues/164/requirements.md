# 164 導入の前提を確かめる sdd-cur doctor を足す

<!-- sdd-cur:form -->

対象は [Issue #164](https://github.com/paterapatera/sdd-cur/issues/164)。他のプロジェクトで使うときの前提がそろっているかを、まとめて確かめる手段が無い。`sdd-cur doctor` を足し、前提を一つずつ確かめて結果を出す。一つでも `NG` があれば終了コードは 1 である。警告だけなら終了コードは 0 である。`doctor` はファイルもラベルも変えない。

## 現状

サブコマンド `doctor` は無い。未知の第1引数は使い方を標準エラーへ書く（`src/cli.ts` の 911 行）。そのときの終了コードは 1 である（`src/cli.ts` の 912 行）。

`selectImplementationIssue` は、`issue.assignees` に `login` が含まれる課題だけを残す（`src/runner.ts` の 143 行）。この `login` は `viewerLogin` の戻り値である（`src/runner.ts` の 568 行）。`viewerLogin` は `gh api user` を呼ぶ（`src/github.ts` の 429 行）。

課題の `state` は `open` または `closed` である（`src/github.ts` の 24 行）。`listIssues` は `state` を省くと `open` にする（`src/github.ts` の 442 行）。

`resolveRepo` は作業ディレクトリで `gh repo view --json nameWithOwner` を呼ぶ（`src/github.ts` の 817 行）。`gh` の終了コードが 0 でないときは失敗である（`src/github.ts` の 120 行）。

業務フローのラベル名は `workflowLabels` にある（`src/labels.ts` の 3 行）。「quick 対象」は `quickTargetLabel` の `name` である（`src/labels.ts` の 45 行）。

`init` の方針の雛形は `policyTemplate` である（`src/init.ts` の 4 行）。`init` は `docs/canonical/README.md` を置く（`src/init.ts` の 26 行）。`init` は `docs/issues/README.md` を置く（`src/init.ts` の 27 行）。

`install` は、引数を省くとホームの `~/.cursor/skills` へコピーする（`src/install.ts` の 26 行）。プロジェクトのルートを渡すと、その直下の `.cursor/skills` へコピーする（`src/install.ts` の 28 行）。サブエージェントは、引数を省くとホームの `~/.cursor/agents` へコピーする（`src/install.ts` の 36 行）。プロジェクトのルートを渡すと、その直下の `.cursor/agents` へコピーする（`src/install.ts` の 38 行）。スキルのコピーは `skills/` 直下のディレクトリである（`src/install.ts` の 104 行）。サブエージェントのコピー対象は `subagentFileNames` である（`src/install.ts` の 126 行）。

`docs/policy.md` の構成の表の `src/cli.ts` の行に、サブコマンド `doctor` は無い（`docs/policy.md` の 21 行）。`src/cli.ts` の `switch` のサブコマンド名は、この表のその行と一致する（`src/docs.test.ts` の 118 行）。同じ名前は `AGENTS.md` の「コマンド」の例とも一致する（`src/docs.test.ts` の 121 行）。

README の導入の順は `install`、`init`、`labels` である（`README.md` の 82 行）。

テストが新しい課題の検査を書く場所は `src/<番号>.test.ts` である（`docs/conventions.md` の 31 行）。`GhRunner` は `gh` の起動を注入する型である（`src/github.ts` の 16 行）。テストはホームディレクトリを触らない（`AGENTS.md` の 22 行）。

## 受け入れ条件

- 1. 条件: 第1引数が `doctor` であり、その後ろに引数が無い 主体: `sdd-cur` 結果: カレントディレクトリを作業ディレクトリとして導入の前提を検査し、結果の行を標準出力へ書く
- 2. 条件: 検査結果のうち `OK` の行と `NG` の行を数える 主体: `doctor` 結果: その行は八つであり、出力の順で、一つ目の項目は『`bun` がある』と一文字も同じであり、二つ目の項目は『`gh` があり、`gh auth status` が成功する』と一文字も同じであり、三つ目の項目は『`agent` コマンドがある』と一文字も同じであり、四つ目の項目は『作業ディレクトリが git リポジトリであり、GitHub のリモートを `resolveRepo` で解決できる』と一文字も同じであり、五つ目の項目は『業務フローのラベルと「quick 対象」が、リポジトリにすべてある（無ければ `sdd-cur labels` を案内する）』と一文字も同じであり、六つ目の項目は『`docs/policy.md` があり、`init` の雛形のままではない（雛形のままなら `sdd-cur-policy` スキルを案内する）』と一文字も同じであり、七つ目の項目は『`docs/canonical/` と `docs/issues/` がある』と一文字も同じであり、八つ目の項目は『スキルとサブエージェントが `~/.cursor` か `<root>/.cursor` かに入っていて、パッケージの中身と同じである（違えば `sdd-cur install` を案内する）』と一文字も同じである。警告の行はこの八つに数えない
- 3. 条件: 八つの検査のどれかが成功する 主体: `doctor` 結果: その検査の行は `OK <項目>` であり、`<項目>` は受け入れ条件 2 の対応する項目と一文字も同じである
- 4. 条件: 八つの検査のどれかが失敗する 主体: `doctor` 結果: その検査の行は `NG <項目>: <理由>` であり、`<項目>` は受け入れ条件 2 の対応する項目と一文字も同じである
- 5. 条件: 注入された関数が `bun` の有無を真と返す 主体: `doctor` 結果: `bun` の検査は `OK` である
- 6. 条件: 注入された関数が `bun` の有無を偽と返す 主体: `doctor` 結果: `bun` の検査は `NG` である
- 7. 条件: 注入された関数が `gh` の有無を真と返し、`gh auth status` の終了コードが 0 である 主体: `doctor` 結果: `gh` の検査は `OK` である
- 8. 条件: 注入された関数が `gh` の有無を偽と返す 主体: `doctor` 結果: `gh auth status` を呼ばず、`gh` の検査は `NG` であり、理由は `gh` が無いことである
- 9. 条件: 注入された関数が `gh` の有無を真と返し、`gh auth status` の終了コードが 0 でない 主体: `doctor` 結果: `gh` の検査は `NG` である
- 10. 条件: 注入された関数が `agent` の有無を真と返す 主体: `doctor` 結果: `agent` の検査は `OK` である
- 11. 条件: 注入された関数が `agent` の有無を偽と返す 主体: `doctor` 結果: `agent` の検査は `NG` である
- 12. 条件: `bun`、`gh`、`agent` の有無を判定する 主体: `doctor` 結果: 判定は注入された関数の戻り値である。テスト以外の実行では、その環境にコマンドがあるとき真である
- 13. 条件: 作業ディレクトリが git リポジトリであり、`resolveRepo` が `owner/repo` を返す 主体: `doctor` 結果: git リポジトリと `resolveRepo` の検査は一つの項目であり、`OK` である
- 14. 条件: 作業ディレクトリが git リポジトリでない 主体: `doctor` 結果: git リポジトリと `resolveRepo` の検査は `NG` である
- 15. 条件: 作業ディレクトリが git リポジトリであり、`resolveRepo` が失敗する 主体: `doctor` 結果: git リポジトリと `resolveRepo` の検査は `NG` である
- 16. 条件: `workflowLabels` のすべての `name` と `quickTargetLabel` の `name` が、`resolveRepo` の返すリポジトリにある 主体: `doctor` 結果: ラベルの検査は `OK` である
- 17. 条件: それらの名前の少なくとも一つが、そのリポジトリに無い 主体: `doctor` 結果: ラベルの検査は `NG` であり、理由に `sdd-cur labels` が含まれる
- 18. 条件: 作業ディレクトリの `docs/policy.md` がファイルとしてあり、その内容が `policyTemplate` の文字列と一致しない 主体: `doctor` 結果: `docs/policy.md` の検査は `OK` である
- 19. 条件: 作業ディレクトリに `docs/policy.md` が無い 主体: `doctor` 結果: `docs/policy.md` の検査は `NG` である
- 20. 条件: 作業ディレクトリの `docs/policy.md` の内容が `policyTemplate` の文字列と一致する 主体: `doctor` 結果: `docs/policy.md` の検査は `NG` であり、理由に `sdd-cur-policy` が含まれる
- 21. 条件: 作業ディレクトリにディレクトリ `docs/canonical/` とディレクトリ `docs/issues/` が両方ある 主体: `doctor` 結果: その検査は `OK` である
- 22. 条件: `docs/canonical/` と `docs/issues/` の少なくとも一方がディレクトリで無い 主体: `doctor` 結果: その検査は `NG` である
- 23. 条件: 作業ディレクトリの `<root>/.cursor` について、`sdd-cur install <root>` がコピーするスキルまたはサブエージェントが、パッケージ側の対応するファイルと内容が違う、または足りない 主体: `doctor` 結果: その検査は `NG` であり、理由に `sdd-cur install` が含まれる
- 24. 条件: 八つの検査の一部が `NG` である 主体: `doctor` 結果: 八つの検査のすべてが、それぞれ結果の一行を標準出力へ出す
- 25. 条件: 八つの検査の一つ以上が `NG` である 主体: `doctor` 結果: 終了コードは 1 である
- 26. 条件: 八つの検査がすべて `OK` であり、警告の取得が成功し、警告の対象が無い 主体: `doctor` 結果: 終了コードは 0 である
- 27. 条件: 八つの検査がすべて `OK` であり、警告の取得が成功し、警告の対象がある 主体: `doctor` 結果: 終了コードは 0 である
- 28. 条件: `gh` の検査と `resolveRepo` の検査が `OK` であり、`viewerLogin` がログインを返し、課題一覧の取得が成功し、`state` が `open` でラベルに「実装依頼」があり `assignees` にそのログインが無い課題がある 主体: `doctor` 結果: 八つの検査の `OK` 行と `NG` 行をすべて標準出力へ書いたあと、その課題を番号の昇順で、番号ごとに一行、標準出力へ書く。各行は `WARN #`、その課題番号、`: 「実装依頼」が付いているが担当者にあなたの login が無い` をこの順につないだものであり、課題番号以外はこの文言と一文字も同じである。この出力は八つの検査の `NG` ではない
- 29. 条件: 受け入れ条件 28 の取得は成功し、八つの検査の別の検査が `NG` であり、警告の対象がある 主体: `doctor` 結果: 終了コードは 1 であり、八つの検査の結果行のすべてより後ろに、対象の課題を番号の昇順で、番号ごとに受け入れ条件 28 と同じ形の一行を標準出力へ書く
- 30. 条件: `gh` の検査と `resolveRepo` の検査が `OK` であり、`viewerLogin` がログインを返し、課題一覧の取得が成功し、警告の対象が無い 主体: `doctor` 結果: 接頭辞 `WARN` の行は出ない
- 31. 条件: `doctor` を実行する 主体: `doctor` 結果: ファイルを書かず、ファイルを消さず、ラベルを変えない
- 32. 条件: `doctor` が `gh` を起動する 主体: `doctor` 結果: 起動は注入された `GhRunner` を通す
- 33. 条件: `src/164.test.ts` が `doctor` を確かめる 主体: テスト 結果: `GhRunner` と、コマンドの有無を返す関数を注入し、`gh` のプロセスを起動せず、ホームディレクトリを触らず、一時ディレクトリを使い、終わったら消す
- 34. 条件: 検査の実装を置く 主体: リポジトリ 結果: 新しいファイルは `src/doctor.ts` であり、`src/cli.ts` の `doctor` がそれを呼ぶ
- 35. 条件: `docs/policy.md` の構成の表を更新する 主体: `docs/policy.md` 結果: `src/cli.ts` の行のサブコマンド名に `doctor` があり、`src/doctor.ts` の行がある
- 36. 条件: `src/cli.ts` の switch に `doctor` がある 主体: `AGENTS.md` 結果: 「コマンド」の例に `bun src/cli.ts doctor` がある
- 37. 条件: README を更新する 主体: README 結果: `sdd-cur doctor` が、導入の前提を一つずつ確かめるコマンドとして書かれる
- 38. 条件: この要件を正本へ足す 主体: 設計の「正本への差分」 結果: 領域 `doctor` の `docs/canonical/doctor.md` への追加として、八つの検査と警告と終了コードと、ファイルもラベルも変えないことを書く
- 39. 条件: 課題ランナーが「実装依頼」の課題を選ぶ 主体: `selectImplementationIssue` 結果: `assignees` に `login` が含まれる課題だけを残す条件は変えない
- 40. 条件: 作業ディレクトリの `<root>/.cursor` に、`sdd-cur install <root>` がコピーするスキルとサブエージェントがすべてあり、パッケージ側の対応するファイルと内容が同じ 主体: `doctor` 結果: スキルとサブエージェントの検査は `OK` である
- 41. 条件: スキルとサブエージェントの一致を検査する 主体: `doctor` 結果: 作業ディレクトリの `<root>/.cursor` だけを見る。見る先は `sdd-cur install <root>` がコピーする先と同じである。ホームの `~/.cursor` は見ない
- 42. 条件: `gh` の検査と `resolveRepo` の検査が `OK` であり、`viewerLogin` または課題一覧の取得が失敗する 主体: `doctor` 結果: 八つの検査の結果行は標準出力へ書く。接頭辞 `WARN` の行は出さない。取得に失敗したことだけを標準エラーへ短く書く。終了コードは、八つの検査の一つ以上が `NG` のときは 1、八つがすべて `OK` のときは 0 であり、取得の失敗では変わらない

## 決定

スキルとサブエージェントの一致は、作業ディレクトリの `<root>/.cursor` だけを検査する。比べる先は、`sdd-cur install <root>` がスキルとサブエージェントをコピーする先と同じである。ホームの `~/.cursor` は検査しない。

各検査の `OK` 行と `NG` 行の項目は、課題本文の具体案の箇条書きと、一行ずつ同じ文言である。順も、その箇条書きと同じである。項目は次の八つである。

- `bun` がある
- `gh` があり、`gh auth status` が成功する
- `agent` コマンドがある
- 作業ディレクトリが git リポジトリであり、GitHub のリモートを `resolveRepo` で解決できる
- 業務フローのラベルと「quick 対象」が、リポジトリにすべてある（無ければ `sdd-cur labels` を案内する）
- `docs/policy.md` があり、`init` の雛形のままではない（雛形のままなら `sdd-cur-policy` スキルを案内する）
- `docs/canonical/` と `docs/issues/` がある
- スキルとサブエージェントが `~/.cursor` か `<root>/.cursor` かに入っていて、パッケージの中身と同じである（違えば `sdd-cur install` を案内する）

検査の項目を短いラベルに正規化することは、採用しない。

警告の行は、対象の課題番号の昇順で、番号ごとに一行である。各行は `WARN #<番号>: 「実装依頼」が付いているが担当者にあなたの login が無い` であり、`<番号>` はその課題の番号である。番号の直前に `#` がある。課題番号以外は、この文言と一文字も同じである。

八つの検査の `OK` 行と `NG` 行は、上の八つの順ですべて標準出力へ書く。警告の行は、その八つの行のすべてのあとである。

`gh` の検査と `resolveRepo` の検査が `OK` のあと、`viewerLogin` または課題一覧の取得が失敗したときは、警告の行は出さない。取得に失敗したことだけを、標準エラーへ短く書く。終了コードは、八つの検査の `NG` だけで決まり、取得の失敗では変わらない。

`gh` が無いときは、`gh auth status` を呼ばない。その検査は `NG` であり、理由は `gh` が無いことである。

`gh` が無いときに `gh auth status` を呼ぶことは、採用しない。

## 範囲外

- 既存のサブコマンドの入出力と終了コードを変えること
- `selectImplementationIssue` が担当者で課題を選ぶ規則を変えること
- `doctor` がファイルを書くこと、ファイルを消すこと、ラベルを変えること
- 足りない前提を `doctor` が `install`、`labels`、`init` の代わりに作ること
- Spec Kit の `specify check` の検査項目を持ち込むこと

## 関係する課題

- #2（GitHub 接続と `resolveRepo`）
- #3（業務フローのラベル）
- #6（課題ランナーが担当者で課題を選ぶこと）
- #118（`init` の `policyTemplate`）
