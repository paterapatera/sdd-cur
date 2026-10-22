# 118 導入先に方針ファイルと仕様の置き場所を用意する init を足す

<!-- sdd-cur:form -->

対象は [Issue #118](https://github.com/paterapatera/sdd-cur/issues/118)。`sdd-cur init [project-root]` を足す。導入先に、方針ファイル `docs/policy.md` のひな形を、無いときだけ作る。既存のファイルは上書きしない。`init` は `gh` を起動しない。

手を入れる対象は `src/cli.ts` と、新しい `src/init.ts` である。ファイルを作る処理は `src/init.ts` の `initProject` に置く。

重なる課題は #116、#117、#84 である。この設計は #113 に合わせ、`docs/canonical/` と `docs/issues/` を用意する。README の書き分けと、サブコマンド一覧の一致は #115 に関わる。

## 受け入れ条件

- 1. 条件: 第1引数が `init` である 主体: `src/cli.ts` 結果: `--help` も `-h` も無いとき `src/init.ts` の `parseInitArgs` を呼び、引数の失敗とルートの確認の失敗のときは `initProject` を呼ばず、それらが無いとき `initProject` を呼ぶ
- 2. 条件: 使い方を標準エラーへ出す 主体: `printUsage` 結果: `sdd-cur install [project-root]` の次の行全体が `sdd-cur init [project-root]` である
- 3. 条件: `src/cli.test.ts` が期待する使い方の文字列を見る 主体: テスト 結果: 行 `sdd-cur init [project-root]` を含み、`printUsage` の出力と一文字も違わない
- 4. 条件: `src/package.test.ts` が期待する使い方の文字列を見る 主体: テスト 結果: 行 `sdd-cur init [project-root]` を含み、`printUsage` の出力と一文字も違わない
- 5. 条件: プロジェクトのルートを一つ渡して `init` を実行し、そのルートに `docs/policy.md` が無い 主体: `init` 結果: そのルートの下の `docs/policy.md` に、この設計の「ひな形」の全文を作る
- 6. 条件: プロジェクトのルートを一つ渡して `init` を実行し、そのルートに `docs/policy.md` がある 主体: `init` 結果: そのファイルの内容を変えない
- 7. 条件: 既にあるファイルと同じパスへ `init` が書こうとする 主体: `init` 結果: そのファイルの内容を変えない
- 8. 条件: 既にあるファイルと同じパスへ `init` が書こうとする 主体: `init` 結果: そのパスを標準出力へ書かない
- 9. 条件: `init` が作った `docs/policy.md` の見出し行を見る 主体: ひな形 結果: この順で `## 誰のための道具か`、`## 技術の前提`、`## 構成`、`## 破ってはいけない原則` であり、ほかの見出しは無い
- 10. 条件: `init` が作った `docs/policy.md` の、見出し以外の非空行を見る 主体: ひな形 結果: 「ひな形」の四文であり、各文はその直前の節に何を書くかを述べる
- 11. 条件: `init` が作った `docs/policy.md` の各節の本文を見る 主体: ひな形 結果: このリポジトリの `docs/policy.md` のどの行とも一致しない
- 12. 条件: `init` がパスを一つ以上作った 主体: `init` 結果: 作ったパスを、プロジェクトのルートからの相対パスで、標準出力へ一行に一つ書く。並びは「標準出力」の順である
- 13. 条件: `init` がパスを一つも作らなかった 主体: `init` 結果: 標準出力には何も書かない
- 14. 条件: `init` を実行する 主体: `init` 結果: `gh` を起動しない
- 15. 条件: `init` を実行する 主体: `init` 結果: ラベルを作らない
- 16. 条件: `init` を実行する 主体: `init` 結果: サブコマンド `labels` を実行しない
- 17. 条件: `labels` を実行する 主体: `labels` 結果: `ensureWorkflowLabels` でラベルを作る
- 18. 条件: `install` を実行する 主体: `install` 結果: `docs/policy.md` を作らない
- 19. 条件: `docs/policy.md` が無いときの手順を見る 主体: `agents/sdd-cur-req-author.md` 結果: 止まって、`sdd-cur init` を案内する、と書く
- 20. 条件: `docs/policy.md` が無いときの手順を見る 主体: `agents/sdd-cur-design-author.md` 結果: 止まって、`sdd-cur init` を案内する、と書く
- 21. 条件: `docs/policy.md` が無いときの手順を見る 主体: `agents/sdd-cur-req-reviewer.md` 結果: 止まって、`sdd-cur init` を案内する、と書く
- 22. 条件: `docs/policy.md` が無いときの手順を見る 主体: `agents/sdd-cur-req-reviewer-high.md` 結果: 止まって、`sdd-cur init` を案内する、と書く
- 23. 条件: `docs/policy.md` が無いときの手順を見る 主体: `agents/sdd-cur-design-reviewer.md` 結果: 止まって、`sdd-cur init` を案内する、と書く
- 24. 条件: `docs/policy.md` があるときの手順を見る 主体: `agents/sdd-cur-req-author.md` 結果: 起動時に `docs/policy.md` を読む、と書く
- 25. 条件: `docs/policy.md` があるときの手順を見る 主体: `agents/sdd-cur-design-author.md` 結果: 起動時に `docs/policy.md` を読む、と書く
- 26. 条件: `docs/policy.md` があるときの手順を見る 主体: `agents/sdd-cur-req-reviewer.md` 結果: 起動時に `docs/policy.md` を読む、と書く
- 27. 条件: `docs/policy.md` があるときの手順を見る 主体: `agents/sdd-cur-req-reviewer-high.md` 結果: 起動時に `docs/policy.md` を読む、と書く
- 28. 条件: `docs/policy.md` があるときの手順を見る 主体: `agents/sdd-cur-design-reviewer.md` 結果: 起動時に `docs/policy.md` を読む、と書く
- 29. 条件: 指摘の対象を見る 主体: `agents/sdd-cur-req-reviewer.md` 結果: `docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する、と書く
- 30. 条件: 指摘の対象を見る 主体: `agents/sdd-cur-req-reviewer-high.md` 結果: `docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する、と書く
- 31. 条件: 指摘の対象を見る 主体: `agents/sdd-cur-design-reviewer.md` 結果: `docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する、と書く
- 32. 条件: README を見る 主体: README 結果: 導入の順が `install`、`init`、`labels` である、と書く
- 33. 条件: README の「開発中の起動」のコードフェンスと、そのあとのスキル呼び出し分の表を見る 主体: README 結果: `init` が無い
- 34. 条件: `docs/policy.md` の構成の表の `src/cli.ts` の行を見る 主体: `docs/policy.md` 結果: バッククォートで囲んだサブコマンド名の集合が、`src/cli.ts` の `switch` の `case` の名前の集合と一致し、`init` を含む
- 35. 条件: `AGENTS.md` の「コマンド」のコードフェンスを見る 主体: `AGENTS.md` 結果: `bun src/cli.ts init [project-root]` の行がある
- 36. 条件: `AGENTS.md` の「コマンド」のコードフェンスを見る 主体: `AGENTS.md` 結果: `bun src/cli.ts` の行から取れるサブコマンド名の集合が、`src/cli.ts` の `switch` の `case` の名前の集合と一致する
- 37. 条件: プロジェクトのルートを一つ渡して `init` を実行する 主体: `init` 結果: そのルートに `AGENTS.md` を作らない
- 38. 条件: `init` を実行する 主体: `init` 結果: `docs/conventions.md` を作らない
- 39. 条件: 約束のファイルの置き場所を見る 主体: このリポジトリ 結果: `skills/sdd-cur/conventions.md` のままである
- 40. 条件: `[project-root]` を省いて `init` を実行し、カレントディレクトリに `docs/policy.md` が無い 主体: `init` 結果: その下の `docs/policy.md` にひな形を作る
- 41. 条件: 引数で渡したプロジェクトのルート、または `[project-root]` を省いたときのカレントディレクトリの、`docs/canonical/README.md` が無い 主体: `init` 結果: `docs/canonical/` を用意し、その中に「README」の一行を置く
- 42. 条件: 引数で渡したプロジェクトのルート、または `[project-root]` を省いたときのカレントディレクトリの、`docs/issues/README.md` が無い 主体: `init` 結果: `docs/issues/` を用意し、その中に「README」の一行を置く
- 43. 条件: `init` が `docs/policy.md` を作った 主体: `init` 結果: 標準出力に、行全体が `docs/policy.md` である行がある
- 44. 条件: `[project-root]` を省いて `init` を実行する 主体: `init` 結果: カレントディレクトリをプロジェクトのルートとする
- 45. 条件: 起動の引数に `--help` も `-h` も無く、`init` の残り引数が二つ以上である 主体: `init` 結果: 標準エラーの最初の行全体が `init の引数はプロジェクトのルートを一つまでです` であり、続けて `printUsage` を出し、終了コードは 1 であり、標準出力は空であり、ファイルもディレクトリも作らない
- 46. 条件: `init` の引数が空文字一つである 主体: `init` 結果: 標準エラーの最初の行全体が `init の引数はプロジェクトのルートを一つまでです` であり、続けて `printUsage` を出し、終了コードは 1 であり、標準出力は空であり、ファイルもディレクトリも作らない
- 47. 条件: 空でないプロジェクトのルートを一つ渡して `init` を実行し、そのパスが存在しない 主体: `init` 結果: 標準エラーの一行が `ディレクトリが存在しません: ` に渡した文字列を足したものであり、終了コードは 1 であり、標準出力は空であり、ファイルもディレクトリも作らず、使い方は出さない
- 48. 条件: 空でないプロジェクトのルートを一つ渡して `init` を実行し、そのパスがディレクトリでない 主体: `init` 結果: 標準エラーの一行が `ディレクトリではありません: ` に渡した文字列を足したものであり、終了コードは 1 であり、標準出力は空であり、ファイルもディレクトリも作らず、使い方は出さない
- 49. 条件: `initProject` が書き込みの失敗で `Error` を投げる 主体: `src/cli.ts` 結果: その `message` を標準エラーへ一行で書き、終了コードは 1 であり、標準出力は空であり、使い方は出さない
- 50. 条件: 作る対象のパスが存在し通常ファイルでなく、引数の失敗もルートの確認の失敗も書き込みの失敗も無い 主体: `init` 結果: そのパスを変えず、そのパスを標準出力へ書かず、ほかのパスは続け、終了コードは 0 であり、標準エラーには書かない

## 範囲外

次は作らない。

- 方針の中身を既存コードから下書きすること（#119）
- 導入先への `AGENTS.md` の生成
- `labels` を `init` に統合すること
- 約束のファイルの置き場所を変えること（#117）
- `skills/sdd-cur/conventions.md` を変えること
- 五つのサブエージェント以外の本文を変えること
- 課題を作ること。課題を閉じること。ラベルを変えること

## 決定

| 項目 | 内容 |
|---|---|
| サブコマンド名 | `init` |
| 置き場所 | 処理は `src/init.ts` の `initProject`。`src/cli.ts` はそれを呼ぶ |
| 引数が無い | カレントディレクトリをプロジェクトのルートとする |
| 引数が一つ | 空でない文字列をプロジェクトのルートとする。そのパスがディレクトリであるとき、相対パスはカレントディレクトリから解決し、その場所の下にファイルを作る |
| 引数が二つ以上 | `--help` も `-h` も無いとき、標準エラーの最初の行全体は `init の引数はプロジェクトのルートを一つまでです` である。続けて `printUsage` を出す。終了コードは 1 である。標準出力は空である。ファイルもディレクトリも作らない |
| 空文字の引数 | 引数が空文字一つのときは、二つ以上のときと同じ `message` を出し、続けて `printUsage` を出す。終了コードは 1 である。標準出力は空である。ファイルもディレクトリも作らない |
| 使い方の行 | `printUsage` の、`sdd-cur install [project-root]` の次に `sdd-cur init [project-root]` を足す。今ある行の字面は変えない |
| `switch` | `install` の次、`run` の前に `init` を足す |
| 終了コード | 引数が無く、書き込みが失敗しないとき、終了コードは 0 である。空でない引数が一つあり、そのパスがディレクトリであり、書き込みが失敗しないとき、終了コードは 0 である。これらのとき、標準エラーには書かない。引数の失敗、ルートの確認の失敗、書き込みの失敗のときは、終了コードは 1 である |
| ヘルプ | `init` は `spec-check` の引数例外には入らない。`--help` または `-h` があるときは、今の `wantsHelp` が使い方を出して終了コード 0 で戻る。ファイルは作らない |
| ルートの確認 | 空でない引数が一つのとき、ファイルを作る前に `assertDirectoryExists` を渡した文字列へ呼ぶ。失敗したときは、その `message` を標準エラーへ一行で書く。終了コードは 1 である。使い方は出さない。標準出力は空である。ファイルもディレクトリも作らない |
| 書き込みの失敗 | `Error` の `message` を標準エラーへ一行で書く。終了コードは 1 である。標準出力は空である。使い方は出さない |
| 上書き | 作る三つのパスに通常ファイルがあるときは、内容を変えず、そのパスを標準出力へ書かない。存在し通常ファイルでないときも、そのパスを変えず、標準出力へ書かない。ほかのパスは続ける |
| `install` | `docs/policy.md` を作る処理は足さない |
| `labels` | `cmdLabels` は変えない。`ensureWorkflowLabels` を呼ぶ今のままである。`init` は `cmdLabels` を呼ばない |
| 約束 | `skills/sdd-cur/conventions.md` の置き場所も本文も変えない |
| テスト | 新しい `test` は `src/118.test.ts` だけに足す。`src/cli.test.ts` と `src/package.test.ts` は、使い方の期待する文字列へ行を足す。新しい `test` は足さない |

```ts
export type ParseInitArgsResult =
  | { ok: true; projectRoot: string | undefined }
  | { ok: false; message: string }

export function parseInitArgs(args: string[]): ParseInitArgsResult

export async function initProject(root: string): Promise<string[]>
```

戻り値は、その実行で作ったファイルの、プロジェクトのルートからの相対パスである。「標準出力」の順であり、作らなかったパスは含まない。存在して通常ファイルでないパスは、作らなかったパスである。一つも作らなかったときは、空配列である。`src/cli.ts` は、戻り値の各文字列を `console.log` で一行ずつ書く。空配列のときは、標準出力へは書かない。

`initProject` は `gh` を起動しない。`createGitHub` も `ensureWorkflowLabels` も呼ばない。ラベルは作らない。

引数の失敗、ルートの確認の失敗、書き込みの失敗、通常ファイルでないパスは、「引数と失敗」のとおりである。

## 引数と失敗

`parseInitArgs` は `src/init.ts` にある。引数の分け方は `parseInstallArgs` と同じである。

引数が無いときは、成功である。プロジェクトのルートは無い。`src/cli.ts` はカレントディレクトリをプロジェクトのルートとする。`assertDirectoryExists` は呼ばない。

引数が二つ以上のときは、失敗である。`message` は `init の引数はプロジェクトのルートを一つまでです` である。

引数が一つであり、その文字列が空文字のときは、失敗である。`message` は、二つ以上のときと同じ `init の引数はプロジェクトのルートを一つまでです` である。

引数が一つであり、その文字列が空でないときは、成功である。その文字列がプロジェクトのルートである。

失敗のとき、`src/cli.ts` は `message` を標準エラーへ一行で書き、続けて `printUsage` を呼び、終了コード 1 で戻る。標準出力は空である。ファイルもディレクトリも作らない。`initProject` は呼ばない。

`--help` または `-h` があるときは、この失敗にしない。今の `wantsHelp` が、`parseInitArgs` より前に、使い方を出して終了コード 0 で戻る。ファイルは作らない。

成功し、プロジェクトのルートの文字列があるとき、`src/cli.ts` はファイルを作る前に `src/install.ts` の `assertDirectoryExists` を、その文字列へ呼ぶ。この関数は複製しない。失敗したときは、その `Error` の `message` を標準エラーへ一行で書き、終了コード 1 で戻る。`printUsage` は呼ばない。標準出力は空である。ファイルもディレクトリも作らない。`initProject` は呼ばない。存在しないときの `message` は、`ディレクトリが存在しません: ` に渡した文字列を足した一行である。ディレクトリでないときの `message` は、`ディレクトリではありません: ` に渡した文字列を足した一行である。渡した文字列は、絶対パスへ解決してから足さない。

`initProject` が `Error` を投げたとき、`src/cli.ts` は `cmdInstall` と同じように、その `message` を標準エラーへ一行で書き、終了コード 1 で戻る。標準出力は空である。`printUsage` は呼ばない。失敗より前にその実行で作ったファイルは消さない。`initProject` は、書き込みの失敗を別の文へ替えず、受けた `Error` をそのまま投げる。

作る三つのパスは、`docs/policy.md`、`docs/canonical/README.md`、`docs/issues/README.md` の順に扱う。各パスについて、`stat` が成功し通常ファイルであるときは、内容を変えず、標準出力へ書かない。`stat` が成功し通常ファイルでないときは、そのパスを変えず、中も変えず、標準出力へ書かない。`stat` が失敗したときは、そのパスを作る。作ることに失敗したときは、その `Error` をそのまま投げる。一つのパスを飛ばしても、ほかのパスは続ける。この飛ばしだけでは終了コードを 1 にしない。引数の失敗も、ルートの確認の失敗も、書き込みの失敗も無いときは、終了コードは 0 であり、標準エラーには書かない。

## ひな形

`init` が作る `docs/policy.md` は、末尾の改行を含めて、次と一文字も違わない。

```
## 誰のための道具か

この節には、誰のための道具かを書く。

## 技術の前提

この節には、技術の前提を書く。

## 構成

この節には、構成を書く。

## 破ってはいけない原則

この節には、破ってはいけない原則を書く。
```

行頭が `#` である行は、上の四つの `##` だけである。見出し以外の非空行は、上の四文だけである。各文は、その直前の節に何を書くかを述べる。この四文は、このリポジトリの `docs/policy.md` のどの行とも一致しない。題 `# 方針` は置かない。このリポジトリの `docs/policy.md` の節本文は写さない。

## README

`docs/canonical/README.md` が無いとき、`docs/canonical/` を用意し、その中にこのファイルを置く。末尾の改行を含めて、次の一行である。

```
仕様の正本を置く。
```

`docs/issues/README.md` が無いとき、`docs/issues/` を用意し、その中にこのファイルを置く。末尾の改行を含めて、次の一行である。

```
課題ごとの要件と設計を置く。
```

親ディレクトリが無いときは作る。既にあるディレクトリは、そのまま使う。置くファイルは、この二つと `docs/policy.md` だけである。

## 標準出力

作ったファイルのパスだけを、標準出力へ一行に一つ書く。パスは、プロジェクトのルートからの相対パスであり、スラッシュ区切りである。`.` では始めない。絶対パスにはしない。解決したプロジェクトのルートがカレントディレクトリでなくても、書く文字列は次の三つのうち作ったものだけである。

1. `docs/policy.md`
2. `docs/canonical/README.md`
3. `docs/issues/README.md`

一つも作らなかったときは、標準出力には何も書かない。ディレクトリのパスは書かない。各行の末尾は改行である。`docs/policy.md` を作ったときは、行全体が `docs/policy.md` である行がある。

三つとも作ったときの標準出力は、末尾の改行を含めて、次である。

```
docs/policy.md
docs/canonical/README.md
docs/issues/README.md
```

`docs/policy.md` だけが既にあり、二つの README が無いときの標準出力は、末尾の改行を含めて、次である。

```
docs/canonical/README.md
docs/issues/README.md
```

## サブエージェント

変えるファイルは、次の五つだけである。フロントマターは変えない。

- `agents/sdd-cur-req-author.md`
- `agents/sdd-cur-design-author.md`
- `agents/sdd-cur-req-reviewer.md`
- `agents/sdd-cur-req-reviewer-high.md`
- `agents/sdd-cur-design-reviewer.md`

各ファイルの「起動時」の、行 `1. `docs/policy.md` を読む。` を、次の二行に替える。あとの番号の行は変えない。

```
1. `docs/policy.md` が無いときは、止まって、`sdd-cur init` を案内する。
`docs/policy.md` があるときは、起動時に `docs/policy.md` を読む。
```

`agents/sdd-cur-req-reviewer.md` と `agents/sdd-cur-req-reviewer-high.md` の、次の行は変えない。

```
- レビューしている要求のうち、`docs/policy.md` の「破ってはいけない原則」と食い違う記述。
```

`agents/sdd-cur-design-reviewer.md` の、次の行は変えない。

```
- レビューしている設計のうち、`docs/policy.md` の「破ってはいけない原則」と食い違う記述。
```

## 文書

README の「公開後の起動」に、行 `パスへ入ったあとは `sdd-cur install` と `sdd-cur run` で同じ入口を呼ぶ。` の次へ、次の文を足す。

```
導入の順は `install`、`init`、`labels` である。
```

「開発中の起動」のコードフェンスと、そのあとのスキル呼び出し分の表には、`init` を書かない。「公開後の起動」のコードフェンスにある `install` と `run` の例は残す。

`docs/policy.md` の構成の表の `src/cli.ts` の行は、サブコマンドの列挙の `install` の次に `init` を足した、次の行である。

```
| `src/cli.ts` | 入口。サブコマンドは `install`、`init`、`run`、`labels`、`candidates`、`show`、`branch`、`prepare-branch`、`confirm`、`close`、`reflect`、`validate`、`complete`、`restore`、`review-next`、`request`、`spec-check`、`tasks` |
```

`AGENTS.md` の「コマンド」のコードフェンスは、`bun src/cli.ts install [project-root]` の次に、次の行を足す。今ある行の字面は変えない。

```
bun src/cli.ts init [project-root]
```

`src/cli.test.ts` と `src/package.test.ts` の使い方の期待する文字列も、`sdd-cur install [project-root]` の次に `sdd-cur init [project-root]` を足す。二つの期待する文字列は、`printUsage` の出力と一文字も違わない。

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。新しい `test` は `src/118.test.ts` だけに足す。`src/cli.test.ts` と `src/package.test.ts` には、新しい `test` を足さない。

`init` と `install` は、一時ディレクトリをプロジェクトのルートにして実行する。引数を省く `init` は、`Bun.spawn` の `cwd` をその一時ディレクトリにする。このリポジトリのディレクトリは、`init` のプロジェクトのルートにしない。

- 第1引数が `init` で、`--help` も `-h` も無く、引数が成功し、ルートの確認が失敗しないとき、`src/cli.ts` は `initProject` を呼ぶ。引数の失敗とルートの確認の失敗のときは `initProject` を呼ばない。`src/init.ts` が `initProject` を export する。[1]
- `bun src/cli.ts --help` の標準エラーは、`sdd-cur install [project-root]` の次の行全体が `sdd-cur init [project-root]` である。[2]
- `src/cli.test.ts` と `src/package.test.ts` の使い方の期待する文字列は、その行を含み、`printUsage` の出力と一文字も違わない。[3][4]
- 空の一時ディレクトリをルートに渡して `init` したとき、`docs/policy.md` は「ひな形」の全文であり、見出し以外の非空行の四文は、このリポジトリの `docs/policy.md` のどの行とも一致しない。終了コードは 0 である。標準エラーは空である。[5][9][10][11]
- `docs/policy.md` だけを別の内容で置いて再び `init` したとき、その内容は変わらない。標準出力に `docs/policy.md` は無い。標準出力は二つの README の行だけである。[6][7][8][12][41][42]
- 空の一時ディレクトリで `init` したとき、標準出力は「標準出力」の三行である。`docs/canonical/README.md` は `仕様の正本を置く。` の一行であり、`docs/issues/README.md` は `課題ごとの要件と設計を置く。` の一行である。[12][41][42][43]
- 三つのファイルがある一時ディレクトリで `init` したとき、標準出力は空であり、終了コードは 0 であり、三つの内容は変わらない。[7][8][13]
- `PATH` から `gh` を外した一時ディレクトリで `init` する。終了コードは 0 である。`src/init.ts` に `ensureWorkflowLabels` と `createGitHub` は無い。[14][15]
- `src/cli.ts` の `init` の分岐は `cmdLabels` を呼ばない。`labels` の分岐は `ensureWorkflowLabels` を呼ぶ。[16][17]
- 一時ディレクトリをプロジェクトのルートにして `install` したあと、そのルートに `docs/policy.md` は無い。[18]
- 五つのサブエージェントは、「サブエージェント」の二文を書く。[19][20][21][22][23][24][25][26][27][28]
- 要求のレビュー二役と設計レビュー役の、原則と食い違う記述の行は、「サブエージェント」の行のままである。[29][30][31]
- README の「公開後の起動」に、導入の順の文がある。「開発中の起動」から次の `## ` 見出しの前までに、`init` は無い。[32][33]
- `docs/policy.md` の `src/cli.ts` の行は「文書」の行であり、そのバッククォートの集合は `switch` の `case` の集合と一致する。[34]
- `AGENTS.md` の「コマンド」のコードフェンスに `bun src/cli.ts init [project-root]` があり、そこから取れるサブコマンド名の集合は `switch` の `case` の集合と一致する。[35][36]
- 一時ディレクトリで `init` したあと、`AGENTS.md` と `docs/conventions.md` は無い。[37][38]
- このリポジトリの `skills/sdd-cur/conventions.md` の最初の非空行は `# 約束` である。[39]
- 引数を省き、`cwd` を、`docs/policy.md` が無い一時ディレクトリにして `init` したとき、その下にひな形ができる。標準出力の `docs/policy.md` は、そのカレントディレクトリからの相対パスである。[40][43][44]
- `--help` も `-h` も無い `init` に、引数を二つ渡したとき、標準エラーの最初の行全体は `init の引数はプロジェクトのルートを一つまでです` であり、そのあとは `printUsage` の出力である。終了コードは 1 である。標準出力は空である。ファイルもディレクトリも無い。[45]
- 空文字一つの引数で `init` したとき、標準エラーの最初の行全体は `init の引数はプロジェクトのルートを一つまでです` であり、そのあとは `printUsage` の出力である。終了コードは 1 である。標準出力は空である。ファイルもディレクトリも無い。[46]
- 存在しないパスを一つ渡して `init` したとき、標準エラーは `ディレクトリが存在しません: ` に渡した文字列を足した一行である。渡した文字列は、絶対パスへ解決してから足さない。終了コードは 1 である。標準出力は空である。使い方は出さない。ファイルもディレクトリも無い。[47]
- 通常ファイルのパスを一つ渡して `init` したとき、標準エラーは `ディレクトリではありません: ` に渡した文字列を足した一行である。渡した文字列は、絶対パスへ解決してから足さない。終了コードは 1 である。標準出力は空である。使い方は出さない。そのファイルの内容は変わらない。[48]
- `docs/canonical` を通常ファイルにした一時ディレクトリで `init` したとき、終了コードは 1 である。標準出力は空である。標準エラーは、その失敗の `Error` の `message` の一行であり、使い方は出さない。その実行で作った `docs/policy.md` は残る。`docs/canonical` は通常ファイルのままである。[49]
- `docs/policy.md` をディレクトリにし、その中にファイルを置いて `init` したとき、そのファイルは残り、`docs/policy.md` はディレクトリのままである。標準出力に `docs/policy.md` は無い。標準出力は `docs/canonical/README.md` と `docs/issues/README.md` の二行である。終了コードは 0 である。標準エラーは空である。[50]

## 一度に実装できる大きさ

一つの作業が一度に実装できる大きさであるとは、次のとおりである。

- `[<番号>]` を一つ以上持つ作業では、その番号の受け入れ条件に直結する実装を、他の受け入れ条件に直結する実装を含めず、実装作成役の一回の起動で書き終えられる
- `[<番号>]` が無い作業では、その作業の行に書かれた実装を、一回の起動で書き終えられる

この設計の作業の一覧の各作業は、上を満たす。

## 変えるファイル

- src/cli.ts
- src/init.ts
- src/118.test.ts
- src/cli.test.ts
- src/package.test.ts
- agents/sdd-cur-req-author.md
- agents/sdd-cur-design-author.md
- agents/sdd-cur-req-reviewer.md
- agents/sdd-cur-req-reviewer-high.md
- agents/sdd-cur-design-reviewer.md
- README.md
- docs/policy.md
- AGENTS.md
- docs/canonical/init.md
- docs/canonical/install.md
- docs/canonical/sdd.md
- docs/canonical/docs.md

## 作業の一覧

- 1. `src/init.ts` に `initProject` を置く。三つのファイルを無いときだけ作り、作った相対パスを返す。`AGENTS.md` と `docs/conventions.md` は作らない。`gh` とラベルは呼ばない。[5][6][7][8][9][10][11][12][13][14][15][37][38][41][42][43]
- 2. `src/cli.ts` の `init` から `initProject` を呼ぶ。引数が無いときはカレントディレクトリを渡す。空でない引数が一つあり、そのパスがディレクトリであるときは、そのパスを渡す。使い方の行を足し、`src/cli.test.ts` と `src/package.test.ts` の使い方の期待する文字列へ同じ行を足す。`labels` は実行しない。新しい `test` は足さない。[1][2][3][4][12][13][14][16][40][43][44]
- 3. `install` は `docs/policy.md` を作らないままにする。`labels` は `ensureWorkflowLabels` を呼ぶままにする。`skills/sdd-cur/conventions.md` は変えない。[17][18][39]
- 4. 五つのサブエージェントの「起動時」を「サブエージェント」の二行に替える。原則と食い違う記述の行は残す。[19][20][21][22][23][24][25][26][27][28][29][30][31]
- 5. README、「文書」の `docs/policy.md`、`AGENTS.md` の「コマンド」を、この設計の字面にする。[32][33][34][35][36]
- 6. `src/118.test.ts` を「テスト」のとおり書く。この設計の正本への差分を、同じ作業ツリーの `docs/canonical/` へ反映する。要求ファイルと設計ファイルは変えない。[1][2][3][4][5][6][7][8][9][10][11][12][13][14][15][16][17][18][19][20][21][22][23][24][25][26][27][28][29][30][31][32][33][34][35][36][37][38][39][40][41][42][43][44][45][46][47][48][49][50]
- 7. `src/init.ts` に `parseInitArgs` を置く。`src/cli.ts` は、引数の失敗、`assertDirectoryExists` の失敗、`initProject` が投げた `Error` を「引数と失敗」のとおり扱う。作る対象のパスが存在し通常ファイルでないときは、既にあるファイルと同じく飛ばす。[45][46][47][48][49][50]

## 関係する課題

- #116（スキルの CLI 呼び出しを `sdd-cur` にする）
- #117（仕組みの約束をスキルに同梱する）
- #84（方針を一つのファイルにまとめる）
- #113（仕様ディレクトリの名前）
- #115（README のコマンド表記）
- #119（方針の中身を既存コードから下書きする）

#116 は、約束と方針のファイルを導入先でどう読むかを、#117 とこの課題に残した。この設計は、導入先に方針のひな形を作る `init` と、`docs/policy.md` が無いときの要求と設計の作成役とレビュー役の止まりを足す。#116 が変えた CLI のコマンド名は変えない。

#117 は、仕組みの約束を `skills/sdd-cur/conventions.md` に置く。この設計は、約束のファイルの置き場所を変えない。`init` は `docs/conventions.md` を作らない。

#84 は、誰のための道具か、技術の前提、構成、破ってはいけない原則を、一つの方針ファイルにまとめる。この設計は、ひな形の節見出しをその四つにする。このリポジトリの `docs/policy.md` の節本文は、ひな形へ写さない。

#113 は、正本を `docs/canonical/`、課題ごとの要件と設計を `docs/issues/` に置く、と定める。この設計は、#113 のあとのレイアウトに合わせ、導入先に `docs/canonical/` と `docs/issues/` を用意する。空のディレクトリが git に残らないため、それぞれに一行の README を置く。#113 が置いたコードと約束のパスは動かさない。

#115 は、README のスキル呼び出し分の例と表に `install` と `labels` を書かない、と定める。`AGENTS.md` の「コマンド」の例は、`src/cli.ts` のサブコマンドをすべて含む、と定める。この設計は、導入の順をスキル呼び出し分の例と表の外に書く。`init` をサブコマンドに足すので、このリポジトリの `AGENTS.md` の「コマンド」の例と、`docs/policy.md` の構成の表は、`src/cli.ts` の `case` の集合と一致させる。導入先へ `AGENTS.md` を生成することは、範囲外のままである。

#119 は、方針の中身を既存コードから下書きする。この設計は、その下書きをしない。

## 正本への差分

### 追加 init REQ-875

もとになった課題は #118 である。

第1引数が `init` のとき、`src/cli.ts` は `src/init.ts` の `parseInitArgs` で引数を読む。成功し、プロジェクトのルートがディレクトリであるとき、`initProject` を呼ぶ。引数が無く、書き込みが失敗しないとき、終了コードは 0 である。空でない引数が一つあり、そのパスがディレクトリであり、書き込みが失敗しないとき、終了コードは 0 である。これらのとき、標準エラーには書かない。

### 追加 init REQ-876

もとになった課題は #118 である。

使い方を標準エラーへ出すとき、`sdd-cur install [project-root]` の次の行全体は `sdd-cur init [project-root]` である。

### 追加 init REQ-877

もとになった課題は #118 である。

`[project-root]` を省いたとき、カレントディレクトリをプロジェクトのルートとする。そのディレクトリに `docs/policy.md` が無いときは、その下の `docs/policy.md` にひな形を作る。

### 追加 init REQ-878

もとになった課題は #118 である。

空でないプロジェクトのルートを一つ渡し、そのパスがディレクトリであるとき、そのパスをプロジェクトのルートとする。そのルートに `docs/policy.md` が無いときは、その下の `docs/policy.md` にひな形を作る。

### 追加 init REQ-879

もとになった課題は #118 である。

既にあるファイルと同じパスへは書かない。そのファイルの内容は変えない。そのパスは標準出力へ書かない。

### 追加 init REQ-880

もとになった課題は #118 である。

`init` が作る `docs/policy.md` の、行頭が `#` である行は、この順で `## 誰のための道具か`、`## 技術の前提`、`## 構成`、`## 破ってはいけない原則` だけである。見出し以外の非空行は、この順で `この節には、誰のための道具かを書く。`、`この節には、技術の前提を書く。`、`この節には、構成を書く。`、`この節には、破ってはいけない原則を書く。` の四行である。各行は、その直前の節に何を書くかを述べる。このリポジトリの `docs/policy.md` の各節の本文は写さない。この四行は、このリポジトリの `docs/policy.md` のどの行とも一致しない。

### 追加 init REQ-881

もとになった課題は #118 である。

作ったパスは、プロジェクトのルートからの相対パスで、標準出力へ一行に一つ書く。パスは `docs/policy.md`、`docs/canonical/README.md`、`docs/issues/README.md` のうち作ったものだけであり、この順である。`.` では始めない。絶対パスにはしない。`docs/policy.md` を作ったときは、行全体が `docs/policy.md` である行がある。一つも作らなかったときは、標準出力には何も書かない。

### 追加 init REQ-882

もとになった課題は #118 である。

`init` は `gh` を起動しない。ラベルを作らない。サブコマンド `labels` を実行しない。

### 追加 init REQ-883

もとになった課題は #118 である。

`docs/canonical/README.md` が無いとき、`docs/canonical/` を用意し、その中に一行の README を置く。その一行は `仕様の正本を置く。` である。`docs/issues/README.md` が無いとき、`docs/issues/` を用意し、その中に一行の README を置く。その一行は `課題ごとの要件と設計を置く。` である。

### 追加 init REQ-884

もとになった課題は #118 である。

`init` は、プロジェクトのルートに `AGENTS.md` を作らない。`docs/conventions.md` を作らない。

### 追加 install REQ-885

もとになった課題は #118 である。

`install` を実行しても、`docs/policy.md` を作らない。

### 追加 sdd REQ-886

もとになった課題は #118 である。

`agents/sdd-cur-req-author.md`、`agents/sdd-cur-design-author.md`、`agents/sdd-cur-req-reviewer.md`、`agents/sdd-cur-req-reviewer-high.md`、`agents/sdd-cur-design-reviewer.md` は、`docs/policy.md` が無いとき、止まって、`sdd-cur init` を案内する、と書く。`docs/policy.md` があるとき、起動時に `docs/policy.md` を読む、と書く。

### 追加 sdd REQ-887

もとになった課題は #118 である。

`agents/sdd-cur-req-reviewer.md` と `agents/sdd-cur-req-reviewer-high.md` は、レビューしている要求のうち、`docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する、と書く。`agents/sdd-cur-design-reviewer.md` は、レビューしている設計のうち、`docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する、と書く。

### 追加 docs REQ-888

もとになった課題は #118 である。

README は、導入の順が `install`、`init`、`labels` である、と書く。

### 追加 docs REQ-889

もとになった課題は #118 である。

README の「開発中の起動」のコードフェンスと、そのあとのスキル呼び出し分の表に、`init` は無い。

### 追加 docs REQ-890

もとになった課題は #118 である。

`docs/policy.md` の構成の表の `src/cli.ts` の行は、バッククォートで囲んだ `init` を含む。その行のバッククォートで囲んだサブコマンド名の集合は、`src/cli.ts` の `switch` の `case` の名前の集合と一致する。

### 追加 docs REQ-891

もとになった課題は #118 である。

`AGENTS.md` の「コマンド」のコードフェンスに、`bun src/cli.ts init [project-root]` の行がある。そのフェンスの `bun src/cli.ts` の行から取れるサブコマンド名の集合は、`src/cli.ts` の `switch` の `case` の名前の集合と一致する。

### 追加 init REQ-893

もとになった課題は #118 である。

`--help` も `-h` も無いとき、`init` の残り引数が二つ以上ならば、標準エラーの最初の行全体は `init の引数はプロジェクトのルートを一つまでです` である。続けて使い方を標準エラーへ出す。終了コードは 1 である。標準出力は空である。ファイルもディレクトリも作らない。

### 追加 init REQ-894

もとになった課題は #118 である。

引数が空文字一つのとき、標準エラーの最初の行全体は `init の引数はプロジェクトのルートを一つまでです` である。続けて使い方を標準エラーへ出す。終了コードは 1 である。標準出力は空である。ファイルもディレクトリも作らない。

### 追加 init REQ-895

もとになった課題は #118 である。

空でないプロジェクトのルートを一つ渡し、そのパスが存在しないとき、標準エラーの一行は `ディレクトリが存在しません: ` に渡した文字列を足したものである。渡した文字列は、絶対パスへ解決してから足さない。終了コードは 1 である。標準出力は空である。ファイルもディレクトリも作らない。使い方は出さない。

### 追加 init REQ-896

もとになった課題は #118 である。

空でないプロジェクトのルートを一つ渡し、そのパスがディレクトリでないとき、標準エラーの一行は `ディレクトリではありません: ` に渡した文字列を足したものである。渡した文字列は、絶対パスへ解決してから足さない。終了コードは 1 である。標準出力は空である。ファイルもディレクトリも作らない。使い方は出さない。

### 追加 init REQ-897

もとになった課題は #118 である。

書き込みが失敗したとき、その `Error` の `message` を標準エラーへ一行で書く。終了コードは 1 である。標準出力は空である。使い方は出さない。失敗より前にその実行で作ったファイルは消さない。

### 追加 init REQ-898

もとになった課題は #118 である。

作る対象のパスが存在し、通常ファイルでないときは、そのパスを変えず、中も変えず、標準出力へ書かない。ほかのパスは続ける。引数の失敗も、ルートの確認の失敗も、書き込みの失敗も無いときは、終了コードは 0 であり、標準エラーには書かない。
