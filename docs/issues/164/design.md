# 164 導入の前提を確かめる sdd-cur doctor を足す

<!-- sdd-cur:form -->

対象は [Issue #164](https://github.com/paterapatera/sdd-cur/issues/164)。`sdd-cur doctor` を足し、カレントディレクトリを作業ディレクトリとして導入の前提を八つ検査し、結果の行を標準出力へ書く。八つの検査の一つ以上が `NG` のとき終了コードは 1、八つがすべて `OK` のときは 0 である。警告の行は終了コードを変えない。`doctor` はファイルもラベルも変えない。

検査の実装は `src/doctor.ts` の `runDoctor` に置く。`src/cli.ts` の `doctor` はそれを呼ぶ。`gh` の起動は注入された `GhRunner` を通す。

重なる課題は #2、#3、#6、#118 である。`selectImplementationIssue` の担当者による絞り込みは変えない。

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
- 43. 条件: `doctor` のうしろに引数が一つ以上ある 主体: `doctor` 結果: 検査しない。終了コードは 1 である。標準エラーは `引数は受け取れません` の一行である。標準出力は空である

## 範囲外

次は作らない。

- 既存のサブコマンドの入出力と終了コードを変えること
- `selectImplementationIssue` が担当者で課題を選ぶ規則を変えること
- `doctor` がファイルを書くこと、ファイルを消すこと、ラベルを変えること
- 足りない前提を `doctor` が `install`、`labels`、`init` の代わりに作ること
- Spec Kit の `specify check` の検査項目を持ち込むこと
- `printUsage` の行一覧へ `doctor` を足すこと

## 関係する課題

- #2（GitHub 接続と `resolveRepo`）
- #3（業務フローのラベル）
- #6（課題ランナーが担当者で課題を選ぶこと）
- #118（`init` の `policyTemplate`）

## 決定

| 項目 | 内容 |
|---|---|
| サブコマンド名 | `doctor` |
| 置き場所 | 検査は `src/doctor.ts` の `runDoctor`。`src/cli.ts` は `cmdDoctor` でそれを呼ぶ |
| 引数 | サブコマンド名のうしろは、一つも受け取らない。`--help` と `-h` も引数である |
| 引数があるとき | `spec-check` と同様。標準エラーは `引数は受け取れません` の一行。終了コードは 1。標準出力は空。検査しない |
| 作業ディレクトリ | カレントディレクトリを `<root>` とする |
| `switch` | `init` の次、`run` の前に `doctor` を足す |
| 検査の項目 | 次の八つを、この順のまま `<項目>` に使う。短いラベルへの正規化はしない |
| スキルとサブエージェント | 作業ディレクトリの `<root>/.cursor` だけを検査する。比べる先は `resolveSkillsDestination` と `resolveAgentsDestination` が `projectRoot` に `<root>` を渡したときのパスである。ホームの `~/.cursor` は見ない。八つ目の `<項目>` の字面は要件の箇条書きどおり（`~/.cursor` か `<root>/.cursor` か、と書く） |
| 警告の行 | `WARN #<番号>: 「実装依頼」が付いているが担当者にあなたの login が無い`。対象は `state` が `open` でラベルに「実装依頼」があり、`assignees` に `viewerLogin` の login が無い課題。番号の昇順で一行ずつ |
| 出力の順 | 八つの `OK` 行と `NG` 行をすべて書いたあとに、警告の行 |
| `gh` が無いとき | `gh auth status` を呼ばない。`NG` の理由は `gh` が無いこと |
| 警告の取得失敗 | `gh` の検査と `resolveRepo` の検査が `OK` のあと、`viewerLogin` または `listIssues` が失敗したとき、警告は出さない。失敗の `message` を標準エラーへ一行で書く。終了コードは八つの検査だけで決める |
| 終了コード | 八つの検査の一つ以上が `NG` なら 1。八つがすべて `OK` なら 0。警告だけでは 1 にしない |
| 副作用 | ファイルを書かない。消さない。ラベルを変えない |
| `selectImplementationIssue` | 変えない |
| テスト | 新しい `test` は `src/164.test.ts` だけに足す |

八つの検査の `<項目>` は次である。

1. `` `bun` がある ``
2. `` `gh` があり、`gh auth status` が成功する ``
3. `` `agent` コマンドがある ``
4. `` 作業ディレクトリが git リポジトリであり、GitHub のリモートを `resolveRepo` で解決できる ``
5. `` 業務フローのラベルと「quick 対象」が、リポジトリにすべてある（無ければ `sdd-cur labels` を案内する） ``
6. `` `docs/policy.md` があり、`init` の雛形のままではない（雛形のままなら `sdd-cur-policy` スキルを案内する） ``
7. `` `docs/canonical/` と `docs/issues/` がある ``
8. `` スキルとサブエージェントが `~/.cursor` か `<root>/.cursor` かに入っていて、パッケージの中身と同じである（違えば `sdd-cur install` を案内する） ``

`src/doctor.ts` は、上の八つを配列 `doctorCheckLabels` として export し、順序と字面を一箇所に置く。

## 標準出力と標準エラー

各行の末尾は改行である。

八つの検査は、成功なら `OK <項目>`、失敗なら `NG <項目>: <理由>` を一行ずつ標準出力へ書く。`<項目>` は「決定」の八つと一文字も違わない。`<理由>` は日本語の一行である。八つとも一行を出す。一部が `NG` でも、残りの検査は続け、八行すべてを出す。

警告の行は、八つの行のすべてのあとに書く。形式は `WARN #<番号>: 「実装依頼」が付いているが担当者にあなたの login が無い` である。`<番号>` は十進の課題番号であり、`#` の直後に書く。

`viewerLogin` または課題一覧の取得が失敗したときは、警告の行は出さない。失敗の `Error` の `message` を標準エラーへ一行で書く。

## `runDoctor`

```ts
export type DoctorCommandName = "bun" | "gh" | "agent"

export type CommandExists = (name: DoctorCommandName) => boolean

export type DoctorCheckResult =
  | { ok: true; label: string }
  | { ok: false; label: string; reason: string }

export type RunDoctorOptions = {
  cwd: string
  homedir: string
  skillsSourceDir: string
  agentsSourceDir: string
  commandExists: CommandExists
  gh: GhRunner
}

export async function runDoctor(options: RunDoctorOptions): Promise<number>
```

`runDoctor` は、八つの検査を順に実行し、各結果を標準出力へ一行ずつ書く。そのあと、警告対象が取れたときだけ警告の行を書く。戻り値は終了コードである。

`defaultCommandExists` は `Bun.which` で、`bun` は `"bun"`、`gh` は `"gh"`、`agent` は `"agent"` を探す。見つかったとき真、見つからないとき偽である。

`cmdDoctor` は、`runDoctor` に `cwd` を `process.cwd()`、`homedir` を `os.homedir()`、`skillsSourceDir` を `defaultSkillsSourceDir`、`agentsSourceDir` を `defaultAgentsSourceDir`、`commandExists` を `defaultCommandExists`、`gh` を `defaultGhRunner` で渡す。戻り値を `main` の終了コードにする。

## 各検査の判定

**`bun`。** `commandExists("bun")` が真なら `OK`。偽なら `NG`。理由は `bun` が無い旨の一行。

**`gh`。** `commandExists("gh")` が偽なら `gh auth status` を呼ばず `NG`。理由は `gh` が無い旨の一行。真のとき、`gh.run(["auth", "status"], { cwd })` の終了コードが 0 なら `OK`。0 でなければ `NG`。理由は認証に失敗した旨の一行。

**`agent`。** `commandExists("agent")` が真なら `OK`。偽なら `NG`。

**git と `resolveRepo`。** `path.join(cwd, ".git")` を `stat` し、無いかディレクトリでもファイルでもないときは git リポジトリでないとして `NG`。あるとき `resolveRepo(gh, cwd)` を呼び、成功なら `OK`。`resolveRepo` が投げた `Error` の `message` を `<理由>` にして `NG`。

**ラベル。** 四つ目の検査が `OK` でないときは、リポジトリを解決せず `NG`。理由は GitHub リポジトリを解決できない旨の一行。解決できたとき、`createGitHub({ gh, repo, cwd })` の `getLabel` で、`workflowLabels` の各 `name` と `quickTargetLabel.name` を調べる。すべて存在すれば `OK`。一つでも無ければ `NG`。理由に `sdd-cur labels` を含む一行。

**`docs/policy.md`。** `path.join(cwd, "docs/policy.md")` を読む。無ければ `NG`。読めた内容が `policyTemplate`（`src/init.ts` の export）と一致すれば `NG`。理由に `sdd-cur-policy` を含む。ファイルがあり雛形と一致しなければ `OK`。

**`docs/canonical/` と `docs/issues/`。** 両方ともディレクトリなら `OK`。どちらか一方でもディレクトリでなければ `NG`。

**スキルとサブエージェント。** `resolveSkillsDestination(homedir, cwd)` と `resolveAgentsDestination(homedir, cwd)` の下を見る。`skillsSourceDir` 直下の各スキルディレクトリについて、宛先の同名ディレクトリ内の各ファイルが、ソースと同じ内容であること。`subagentFileNames` の各ファイルについて、宛先の `agents/<名前>.md` がソースと同じ内容であること。足りない、または内容が違えば `NG`。理由に `sdd-cur install` を含む。すべて一致すれば `OK`。

ファイル内容の比較は、UTF-8 の文字列として読み、ソースと宛先が一文字も違わないことでよい。

## 警告の取得

`gh` の検査と git・`resolveRepo` の検査がどちらも `OK` のときだけ試す。

`createGitHub` で `viewerLogin` を呼ぶ。失敗したら、警告は出さず、標準エラーへ `message` を一行で書き、終了コードの計算だけ続ける。

成功した login を `L` とする。`listIssues({ state: "open", labels: ["実装依頼"] })` を呼ぶ。失敗したら、警告は出さず、標準エラーへ `message` を一行で書く。

返った課題のうち、`assignees` に `L` が含まれないものを残し、`number` の昇順で並べる。各行を「標準出力と標準エラー」の形式で書く。

`gh` の検査または git・`resolveRepo` の検査が `NG` のときは、`viewerLogin` も `listIssues` も呼ばない。

## CLI

`src/cli.ts` に `cmdDoctor` を足す。`cmdSpecCheck` と同じ形で、サブコマンド名のうしろの引数配列を受け取る。`args.length > 0` のときは `console.error("引数は受け取れません")` を一行だけ書き、1 を返す。`runDoctor` は呼ばない。`args.length` が 0 のときだけ `runDoctor` を呼び、その戻り値を返す。

`case "doctor"` は `init` の次、`run` の前に置く。`return await cmdDoctor(rest)` とする。

## 文書

`docs/policy.md` の構成の表の `src/cli.ts` の行は、サブコマンドの列挙の `init` の次に `` `doctor` `` を足した行にする。`src/doctor.ts` の行を足す。役割の説明は「導入の前提を検査する」である。

`AGENTS.md` の「コマンド」のコードフェンスは、`bun src/cli.ts init [project-root]` の次に、次の行を足す。今ある行の字面は変えない。

```
bun src/cli.ts doctor
```

README の「公開後の起動」に、導入の順の文の近くに、`sdd-cur doctor` が導入の前提を一つずつ確かめるコマンドである、と書く。導入の順 `install`、`init`、`labels` の字面は変えない。

## テスト

`bun test` で実行する。新しい `test` は `src/164.test.ts` だけに足す。`gh` のプロセスは起動しない。`GhRunner` と `commandExists` を注入する。ホームディレクトリと、実行中の Cursor のスキルは触らない。一時ディレクトリを `<root>` にし、終わったら消す。

- 第1引数が `doctor` で残り引数が無いとき、カレントディレクトリで八つの検査の行を標準出力へ書く。[1][2][3][4]
- `doctor` のうしろに引数が一つ以上あるとき、検査せず、標準エラーは `引数は受け取れません` の一行、終了コードは 1、標準出力は空である。[43]
- `runDoctor` を export し、`cmdDoctor` がそれを呼ぶ。[34]
- `src/164.test.ts` が `GhRunner` と `commandExists` を注入し、一時ディレクトリだけを使う。[33]
- 注入で `bun` あり／なし、`gh` あり／なしと `gh auth status` の終了コード、`agent` あり／なしを切り替え、対応する `OK`／`NG` 行を確かめる。[5][6][7][8][9][10][11][12]
- 一時ディレクトリで `.git` 無し、`.git` ありで `resolveRepo` 成功／失敗、を注入の `GhRunner` で確かめる。[13][14][15]
- `workflowLabels` と `quickTargetLabel` の名前が `getLabel` で揃う／欠ける。[16][17]
- `docs/policy.md` 無し、雛形どおり、雛形と違う。[18][19][20]
- `docs/canonical/` と `docs/issues/` の両方あり／片方欠け。[21][22]
- `<root>/.cursor` とパッケージ側の一致／不一致。ホームの `.cursor` は作っても検査に影響しない。[23][40][41]
- 八つ中に `NG` があっても八行出る。`NG` ありで終了コード 1。八つ `OK` で 0。警告ありでも 0。[24][25][26][27]
- 警告対象の課題があるとき、八行のあと `WARN #<番号>: …` が昇順。`NG` が混ざっても警告は八行のあと。終了コードは `NG` で 1。[28][29]
- 警告対象無しで `WARN` 行無し。[30]
- 実行でファイルもラベルも変わらない。[31]
- 記録した `GhRunner` 経由で `gh` が呼ばれる。[32]
- `viewerLogin` または `listIssues` 失敗で `WARN` 無し、標準エラー一行、終了コードは八つの検査だけ。[42]
- `docs/policy.md` の表と `AGENTS.md` のコマンド例。[35][36]
- README に `sdd-cur doctor` の説明。[37]
- `selectImplementationIssue` のソースは変えない。[39]
- 実装時に `docs/canonical/doctor.md` を追加し、`docs/canonical/docs.md` を正本への差分どおり更新する。[38]

## 一度に実装できる大きさ

一つの作業が一度に実装できる大きさであるとは、次のとおりである。

- `[<番号>]` を一つ以上持つ作業では、その番号の受け入れ条件に直結する実装を、他の受け入れ条件に直結する実装を含めず、実装作成役の一回の起動で書き終えられる
- `[<番号>]` が無い作業では、その作業の行に書かれた実装を、一回の起動で書き終えられる

作業の一覧の各作業は、分割後に上を満たす。

## 変えるファイル

- src/doctor.ts
- src/cli.ts
- src/164.test.ts
- docs/policy.md
- AGENTS.md
- README.md
- docs/canonical/doctor.md
- docs/canonical/docs.md

## 作業の一覧

- 1. `src/doctor.ts` に `doctorCheckLabels`、`defaultCommandExists`、`runDoctor` の骨格と、`bun`・`gh`・`agent` の三検査と `OK`/`NG` 行の出力を実装する。[2][3][4][5][6][7][8][9][10][11][12]
- 2. `runDoctor` に git・`resolveRepo` とラベル検査を足す。[13][14][15][16][17]
- 3. `runDoctor` に `docs/policy.md`・`docs/canonical/`・`docs/issues/` の三検査を足す。[18][19][20][21][22]
- 4. `runDoctor` にスキルとサブエージェントの一致検査を足す。[23][40][41]
- 5. `runDoctor` に終了コード、副作用の無さ、`GhRunner` 経由の `gh` 起動、警告の取得と出力、取得失敗時の標準エラー処理を足す。[1][24][25][26][27][28][29][30][31][32][42]
- 6. `src/cli.ts` に `cmdDoctor` と `case "doctor"` を足す。余分な引数は `cmdSpecCheck` と同様に拒否する。[1][34][43]
- 7. `docs/policy.md`、`AGENTS.md`、README を「文書」のとおり更新する。[35][36][37]
- 8. `src/164.test.ts` に、コマンド三つ・git・`resolveRepo`・ラベル・`docs/policy.md`・ディレクトリ・スキル一致の検査を確かめる test。[5][6][7][8][9][10][11][12][13][14][15][16][17][18][19][20][21][22][23][40][41]
- 9. `src/164.test.ts` に、終了コード・警告・副作用・GhRunner 注入・取得失敗・余分な引数・CLI 接続を確かめる test を足す。[1][24][25][26][27][28][29][30][31][32][33][34][43]
- 10. `docs/canonical/doctor.md` を追加し、`docs/canonical/docs.md` を正本への差分どおり更新する。[38]
- 11. `selectImplementationIssue` と `src/runner.ts` の担当者による絞り込みは変えない。[39]

## 正本への差分

### 追加 doctor REQ-923

もとになった課題は #164 である。

第1引数が `doctor` で残り引数が無いとき、`src/cli.ts` はカレントディレクトリを作業ディレクトリとして `src/doctor.ts` の `runDoctor` を呼ぶ。八つの検査の結果行を標準出力へ書く。
- シナリオ: 条件: 第1引数が `doctor` で残り引数が無い 主体: `sdd-cur` 結果: カレントディレクトリで八つの検査を行い、各行を標準出力へ書く

### 追加 doctor REQ-935

もとになった課題は #164 である。

`doctor` は引数を受け取らない。サブコマンド名のうしろに一つでもあるときは、検査しない。`--help` と `-h` も引数である。終了コードは 1 である。標準エラーは `引数は受け取れません` の一行である。標準出力には書かない。
- シナリオ: 条件: `doctor` のうしろに引数が一つ以上ある 主体: `doctor` 結果: 検査せず終了コード 1 で標準エラーに `引数は受け取れません` の一行だけを書く

### 追加 doctor REQ-924

もとになった課題は #164 である。

八つの検査の `<項目>` は、この順であり、次の字面と一文字も違わない。`` `bun` がある ``、`` `gh` があり、`gh auth status` が成功する ``、`` `agent` コマンドがある ``、`` 作業ディレクトリが git リポジトリであり、GitHub のリモートを `resolveRepo` で解決できる ``、`` 業務フローのラベルと「quick 対象」が、リポジトリにすべてある（無ければ `sdd-cur labels` を案内する） ``、`` `docs/policy.md` があり、`init` の雛形のままではない（雛形のままなら `sdd-cur-policy` スキルを案内する） ``、`` `docs/canonical/` と `docs/issues/` がある ``、`` スキルとサブエージェントが `~/.cursor` か `<root>/.cursor` かに入っていて、パッケージの中身と同じである（違えば `sdd-cur install` を案内する） ``。
- シナリオ: 条件: `doctor` が八つの検査を出力する 主体: `doctor` 結果: 八行の `<項目>` が上の順と字面どおりである

### 追加 doctor REQ-925

もとになった課題は #164 である。

検査に成功した行は `OK <項目>` である。失敗した行は `NG <項目>: <理由>` である。八つの検査は、それぞれ一行ずつ標準出力へ書く。
- シナリオ: 条件: 八つの検査のうち一つが成功する 主体: `doctor` 結果: その行は `OK` と対応する `<項目>` で始まる一行である
- シナリオ: 条件: 八つの検査のうち一つが失敗する 主体: `doctor` 結果: その行は `NG` と対応する `<項目>` と理由を含む一行である

### 追加 doctor REQ-926

もとになった課題は #164 である。

八つの検査の一つ以上が `NG` のとき、終了コードは 1 である。八つがすべて `OK` のとき、終了コードは 0 である。警告の行だけでは終了コードを 1 にしない。
- シナリオ: 条件: 八つの検査の一つ以上が `NG` である 主体: `doctor` 結果: 終了コードは 1 である
- シナリオ: 条件: 八つがすべて `OK` で警告の対象がある 主体: `doctor` 結果: 終了コードは 0 である

### 追加 doctor REQ-927

もとになった課題は #164 である。

`gh` が無いとき、`gh auth status` を呼ばない。その検査は `NG` であり、理由は `gh` が無いことである。
- シナリオ: 条件: 注入された関数が `gh` の有無を偽と返す 主体: `doctor` 結果: `gh auth status` を呼ばず `NG` となる

### 追加 doctor REQ-928

もとになった課題は #164 である。

スキルとサブエージェントの一致検査は、作業ディレクトリの `<root>/.cursor` だけを見る。見る先は `sdd-cur install <root>` がコピーする先と同じである。ホームの `~/.cursor` は見ない。
- シナリオ: 条件: ホームの `~/.cursor` だけがパッケージと一致し作業ディレクトリの `.cursor` が一致しない 主体: `doctor` 結果: 八つ目の検査は `NG` である

### 追加 doctor REQ-929

もとになった課題は #164 である。

`gh` の検査と git・`resolveRepo` の検査が `OK` のあと、警告対象の課題を取得できたとき、標準出力へ八つの検査の行のすべてのあとに、番号の昇順で `WARN #<番号>: 「実装依頼」が付いているが担当者にあなたの login が無い` を一行ずつ書く。対象は `state` が `open` でラベルに「実装依頼」があり、`assignees` に `viewerLogin` の login が無い課題である。
- シナリオ: 条件: 警告対象の open 課題が二つある 主体: `doctor` 結果: 八行のあと、番号の昇順で二行の `WARN` 行が出る

### 追加 doctor REQ-930

もとになった課題は #164 である。

`gh` の検査と git・`resolveRepo` の検査が `OK` のあと、`viewerLogin` または課題一覧の取得が失敗したとき、接頭辞 `WARN` の行は出さない。失敗の理由を標準エラーへ短い一行で書く。終了コードは八つの検査の `NG` だけで決まる。
- シナリオ: 条件: 八つがすべて `OK` で `viewerLogin` が失敗する 主体: `doctor` 結果: `WARN` 行は無く終了コードは 0 で、標準エラーに失敗の一行がある

### 追加 doctor REQ-931

もとになった課題は #164 である。

`doctor` はファイルを書かない。ファイルを消さない。ラベルを変えない。
- シナリオ: 条件: `doctor` を実行する 主体: `doctor` 結果: 作業ディレクトリのファイルと GitHub のラベルは変わらない

### 追加 doctor REQ-932

もとになった課題は #164 である。

`doctor` が `gh` を起動するとき、注入された `GhRunner` を通す。`bun`、`gh`、`agent` の有無は注入された関数の戻り値で判定する。注入が無い実行では、その環境にコマンドがあるとき真とする。
- シナリオ: 条件: テストが `GhRunner` と `commandExists` を注入する 主体: `doctor` 結果: 実際の `gh` プロセスは起動しない

### 追加 docs REQ-933

もとになった課題は #164 である。

README に、`sdd-cur doctor` が導入の前提を一つずつ確かめるコマンドである、と書く。
- シナリオ: 条件: README を読む 主体: README 結果: `sdd-cur doctor` の説明がある

### 追加 docs REQ-934

もとになった課題は #164 である。

`docs/policy.md` の構成の表に `src/doctor.ts` の行がある。`src/cli.ts` の行のサブコマンド列挙に `doctor` がある。`AGENTS.md` の「コマンド」の例に `bun src/cli.ts doctor` がある。
- シナリオ: 条件: `docs/policy.md` の `src/cli.ts` の行を見る 主体: 表 結果: サブコマンド列挙に `doctor` がある

### 変更 docs REQ-890

もとになった課題は #164 である。

`docs/policy.md` の構成の表の `src/cli.ts` の行は、バッククォートで囲んだ `doctor` を含む。その行のバッククォートで囲んだサブコマンド名の集合は、`src/cli.ts` の `switch` の `case` の名前の集合と一致する。
- シナリオ: 条件: `doctor` を `switch` に足した 主体: `docs/policy.md` 結果: 構成表の `src/cli.ts` の行も同じ集合を列挙する

### 変更 docs REQ-891

もとになった課題は #164 である。

`AGENTS.md` の「コマンド」のコードフェンスに、`bun src/cli.ts doctor` の行がある。そのフェンスの `bun src/cli.ts` の行から取れるサブコマンド名の集合は、`src/cli.ts` の `switch` の `case` の名前の集合と一致する。
- シナリオ: 条件: `AGENTS.md` のコマンド例を見る 主体: `AGENTS.md` 結果: `bun src/cli.ts doctor` の行がある
