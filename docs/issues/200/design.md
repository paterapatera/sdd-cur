# 200 作業ツリーのコードから docs/steering/ の下書きを作るスキルを足す

<!-- sdd-cur:form -->

対象は [Issue #200](https://github.com/paterapatera/sdd-cur/issues/200)。人が明示して起動したときだけ、起動した作業ツリーのソースコードと設定ファイルから `docs/steering/structure.md` と `docs/steering/terms.md` の下書きを書くスキル `sdd-cur-steering` を足す。

導入先は、このスキルを起動した作業ツリーである。書く先は、その作業ツリーの `docs/steering/structure.md` と `docs/steering/terms.md` だけである。スキルのディレクトリ名は `sdd-cur-steering` である。

重なる課題は #199 と #165 と #119 である。この設計は、十サブエージェントの起動時の読み、`doctor`、`init`、`setup`、README の節「他のプロジェクトで使う」の六手順、`skills/sdd-cur-policy/SKILL.md`、`docs/issues/119/design.md` を変えない。このリポジトリに `docs/steering/structure.md` と `docs/steering/terms.md` を成果物として追加しない。

比べる相手は、cc-sdd の `/kiro:steering` と `skills/sdd-cur-policy/SKILL.md` の根拠の付け方である。取り込む挙動は、この課題の要件にあるものだけである。

## 受け入れ条件

- 1. 条件: `skills/sdd-cur-steering/SKILL.md` の frontmatter を見る 主体: そのファイル 結果: `name` は `sdd-cur-steering` であり、`disable-model-invocation: true` がある。`description` から、人が明示して起動したとき、作業ツリーのソースコードと設定ファイルから `docs/steering/structure.md` と `docs/steering/terms.md` の下書きを書くことが読める
- 2. 条件: 人がこのスキルを明示して起動した 主体: `sdd-cur-steering` 結果: 下書きの手順を行う
- 3. 条件: 人がこのスキルを明示して起動していない 主体: `sdd-cur-steering` 結果: 下書きの手順を行わない
- 4. 条件: 下書きの手順を実行する 主体: `sdd-cur-steering` 結果: 下書きの対象は、このスキルを起動した作業ツリーである
- 5. 条件: 下書きの手順を見る 主体: `sdd-cur-steering` 結果: 作業ツリーのソースコードと設定ファイルを読む。README は読まない。パッケージ定義は読まない
- 6. 条件: 下書きの根拠のファイルを見る 主体: `sdd-cur-steering` 結果: 作業ツリーの中のファイルである
- 7. 条件: スキルがファイルを書く 主体: `sdd-cur-steering` 結果: 書くパスは、作業ツリーの `docs/steering/structure.md` と `docs/steering/terms.md` だけである
- 8. 条件: 作業ツリーに `docs/steering/structure.md` が無い、またはそのファイルに非空行が無く、ディレクトリ、命名、テストの置き場所について、根拠のファイルと行の組が一つである記述があり、受け入れ条件 41 のあいだではない 主体: `sdd-cur-steering` 結果: そのパスへ、その記述を書いて下書きとする
- 9. 条件: 作業ツリーに `docs/steering/terms.md` が無い、またはそのファイルに非空行が無く、ドメインの用語について、根拠のファイルと行の組が一つである記述がある 主体: `sdd-cur-steering` 結果: そのパスへ、その記述を書いて下書きとする
- 10. 条件: 下書きに書く記述を一つ見る 主体: `sdd-cur-steering` 結果: その記述は一文であり、作業ツリーの中の一つのファイルと、一つの行番号を含む。その行は `#` で始めない
- 11. 条件: 下書きの根拠の表記を見る 主体: `sdd-cur-steering` 結果: 全角の始め括弧、バッククォート、作業ツリーからの相対パス、バッククォート、半角空白、の、半角空白、行番号、半角空白、行、全角の終わり括弧、の順である。パスは `/` でも `./` でも始めない。行番号は十進であり、先頭の零は付けない
- 12. 条件: 根拠のファイルと行が無い点がある 主体: `sdd-cur-steering` 結果: その点を `docs/steering/structure.md` にも `docs/steering/terms.md` にも書かない
- 13. 条件: 根拠のファイルと行が無い点がある 主体: `sdd-cur-steering` 結果: その点を人に質問する
- 14. 条件: 人が書き足した行がある 主体: `sdd-cur-steering` 結果: その行は変えない
- 15. 条件: 人が書き足した行がある `docs/steering/structure.md` に、まだ無い、ディレクトリ、命名、またはテストの置き場所についての記述があり、その記述の根拠のファイルと行の組は一つである 主体: `sdd-cur-steering` 結果: その記述を、追記の候補として人に見せる。その起動ではファイルへ書かない
- 16. 条件: 人が書き足した行がある `docs/steering/terms.md` に、まだ無い、ドメインの用語についての記述があり、その記述の根拠のファイルと行の組は一つである 主体: `sdd-cur-steering` 結果: その記述を、追記の候補として人に見せる。その起動ではファイルへ書かない
- 17. 条件: 下書きの手順を実行する 主体: `sdd-cur-steering` 結果: 課題を作らない
- 18. 条件: 下書きの手順を実行する 主体: `sdd-cur-steering` 結果: 課題を変えない
- 19. 条件: 下書きの手順を実行する 主体: `sdd-cur-steering` 結果: 課題を閉じない
- 20. 条件: 下書きの手順を実行する 主体: `sdd-cur-steering` 結果: ラベルを変えない
- 21. 条件: 下書きの手順を実行する 主体: `sdd-cur-steering` 結果: 課題コメントを書かない
- 22. 条件: `skills/` 直下に `sdd-cur-steering` がある 主体: `installSkills` 結果: そのディレクトリ名をコピーする
- 23. 条件: `src/install.ts` を見る 主体: `src/install.ts` 結果: `sdd-cur-steering` という文字は無い。コピーは、ソース直下のディレクトリを列挙する現状のままである
- 24. 条件: README の、`install` がコピーするスキルを列挙する行を見る 主体: README 結果: バッククォートで囲んだ `skills/` の名前が、この順で過不足なく `sdd-cur`、`sdd-cur-complete`、`sdd-cur-create-issue`、`sdd-cur-fix`、`sdd-cur-implement`、`sdd-cur-policy`、`sdd-cur-quick`、`sdd-cur-steering` である
- 25. 条件: README の「ディレクトリ」のコードフェンスを見る 主体: README 結果: 行頭の空白を除いて `skills/sdd-cur-steering/` で始まる行が一つあり、行頭の空白を除いて `skills/sdd-cur-quick/` で始まる行より後ろにある。その行から、`install` がコピーすることと、`docs/steering/structure.md` と `docs/steering/terms.md` の下書きであることが読める
- 26. 条件: README の節「他のプロジェクトで使う」の数字の箇条書きを見る 主体: README 結果: 六つの箇条書きは、この課題の前と一文字も同じである
- 27. 条件: README の見出し「ディレクトリ」の直後の文を見る 主体: README 結果: 「正本の表にあるパスは、ここには繰り返さない。」と一文字も同じ文がある
- 28. 条件: `docs/policy.md` の「構成」を見る 主体: `docs/policy.md` 結果: `sdd-cur-steering` が、作業ツリーのソースコードと設定ファイルから `docs/steering/structure.md` と `docs/steering/terms.md` の下書きを書くことが読める。表の場所の列にあるパスの集合は、この課題の前と同じである。`skills/<名前>/` の行に「直下のディレクトリだけが対象」が残る
- 29. 条件: `docs/policy.md` の `##` 見出しを見る 主体: `docs/policy.md` 結果: 見出しは `誰のための道具か`、`技術の前提`、`構成`、`破ってはいけない原則` の四つであり、この順である
- 30. 条件: `docs/policy.md` の見出し `# 方針` の直後の文を見る 主体: `docs/policy.md` 結果: 「このファイルを変えるのは、課題を通したときだけである。」と一文字も同じ文がある
- 31. 条件: `docs/policy.md` の構成の表の `docs/steering/` の行を見る 主体: `docs/policy.md` 結果: `<名前>.md` を任意で置けること、十サブエージェントが `docs/policy.md` のあと直下の `.md` をすべて読むこと、ディレクトリが無いときは読まずに進むこと、食い違うときは `docs/policy.md` を優先すること、が残る
- 32. 条件: この要件の変更を見る 主体: 正本 結果: 設計の「正本への差分」が、`docs/canonical/docs.md` の REQ-717 を変更し、ディレクトリ名に `sdd-cur-steering` を足す。足したあとの名前は、この順で過不足なく `sdd-cur`、`sdd-cur-complete`、`sdd-cur-create-issue`、`sdd-cur-fix`、`sdd-cur-implement`、`sdd-cur-policy`、`sdd-cur-quick`、`sdd-cur-steering` である。この順は、`skillNames.sort()` の既定の並びである
- 33. 条件: `src/119.test.ts` の REQ-717 の一致を見る 主体: テスト 結果: 更新後の REQ-717 の本文を認める。`docs/issues/119/design.md` は変えない。`src/119.test.ts` に新しい `test` は足さない
- 34. 条件: `skills/sdd-cur-steering/SKILL.md` の本文を見る 主体: そのファイル 結果: フロントマターの閉じ `---` の次の行からファイルの末尾まで、一文を一行に書く
- 35. 条件: この課題のテストを書く 主体: テスト 結果: ファイルは `src/200.test.ts` だけである。既存の `src/*.test.ts` に新しい `test` は足さない。ただし受け入れ条件 33 の、`src/119.test.ts` の既存の一致を直すことは除く。`gh` のプロセスは起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す
- 36. 条件: `initTargets` を見る 主体: `init` 結果: 相対パスは `docs/policy.md`、`docs/canonical/README.md`、`docs/issues/README.md` の三つであり、この課題の前と同じである
- 37. 条件: 根拠のファイルと行が無い点について、人の答えがある 主体: `sdd-cur-steering` 結果: その答えだけでは、根拠のファイルと行が無い記述を `docs/steering/structure.md` にも `docs/steering/terms.md` にも書かない
- 38. 条件: 根拠のファイルと行が無い点を人に質問している 主体: `sdd-cur-steering` 結果: その質問だけでは、根拠のファイルと行の組が一つであるほかの記述を下書きへ書くことを止めない
- 39. 条件: ディレクトリ、命名、テストの置き場所のいずれかについて、一つの記述に根拠のファイルと行の組が二つ以上ある 主体: `sdd-cur-steering` 結果: その記述は `docs/steering/structure.md` の下書きに書かない。候補を出して人に選ばせる
- 40. 条件: 受け入れ条件 39 の候補を見る 主体: `sdd-cur-steering` 結果: 候補は、その記述と、作業ツリー内の一つのファイルと、一つの行番号の組である
- 41. 条件: 人が書き足した行が無く、受け入れ条件 39 の候補を出していて、人がまだ選んでいない 主体: `sdd-cur-steering` 結果: その候補に当たる記述を `docs/steering/structure.md` に書かない。そのあいだは `docs/steering/structure.md` を書かない
- 42. 条件: 受け入れ条件 39 の候補を出している 主体: `sdd-cur-steering` 結果: 人が選んだ組は、明示して起動したときの依頼に含まれる。依頼に、その記述の選んだ組が無いときは、まだ選んでいない
- 43. 条件: 依頼に、受け入れ条件 39 の記述について選んだ組があり、このスキルを明示して起動している 主体: `sdd-cur-steering` 結果: 選んだファイルと行番号を、その記述の根拠にする
- 44. 条件: 受け入れ条件 39 の候補が一つ以上あり、まだ選んでいないものが無く、作業ツリーに `docs/steering/structure.md` が無い、またはそのファイルに非空行が無い 主体: `sdd-cur-steering` 結果: 選んだ記述を含めて、そのパスへ下書きを書く
- 45. 条件: ドメインの用語についての一つの記述に、根拠のファイルと行の組が二つ以上ある 主体: `sdd-cur-steering` 結果: その記述は `docs/steering/terms.md` の下書きに書かない。候補を出さない。その点を人に質問しない
- 46. 条件: `docs/steering/structure.md` と `docs/steering/terms.md` の、行頭が `#` である行を見る 主体: `sdd-cur-steering` 結果: 見出しの字面は固定しない。見出しは、作業ツリーのソースコードと設定ファイルから判断して書いてよい
- 47. 条件: その起動の開始時点の `docs/steering/structure.md` または `docs/steering/terms.md` を見る 主体: `sdd-cur-steering` 結果: その時点であった非空行は、すべて人が書き足した行である
- 48. 条件: 人が書き足した行があり、受け入れ条件 39 の候補を出していて、人がまだ選んでいない 主体: `sdd-cur-steering` 結果: その候補に当たる記述は、追記の候補にしない。候補を出して人に選ばせる。根拠のファイルと行の組が一つであり、まだファイルに無い記述は、追記の候補として人に見せる。その起動ではファイルへ書かない
- 49. 条件: 人が追記の候補の採用を明示して、このスキルを再び明示して起動した 主体: `sdd-cur-steering` 結果: 人が書き足した行は変えない。根拠のファイルと行の組が一つである記述だけをファイルへ足す。根拠のファイルと行が無い記述は足さない。根拠のファイルと行の組が二つ以上あり、人が選んでいない記述は足さない
- 50. 条件: 人が書き足した行があり、依頼に受け入れ条件 39 の一つの記述について選んだ組があり、その記述の追記の採用を明示して、このスキルを明示して起動している 主体: `sdd-cur-steering` 結果: 選んだファイルと行番号をその記述の根拠にし、その記述をファイルへ足す。人が書き足した行は変えない
- 51. 条件: 作業ツリーに `docs/steering/structure.md` と `docs/steering/terms.md` のうち、非空行を含むのが一方だけである 主体: `sdd-cur-steering` 結果: 非空行を含むファイルは、その非空行を変えず、追記の候補は人に見せてその起動では書かない。無いか非空行が無いファイルは、受け入れ条件 8 または 9 に当たるとき、そのパスへ下書きを書く
- 52. 条件: 作業ツリーに `docs/steering/terms.md` が無い、またはそのファイルに非空行が無く、ドメインの用語について、根拠のファイルと行の組が一つである記述が一つも無い 主体: `sdd-cur-steering` 結果: `docs/steering/terms.md` を作らない
- 53. 条件: 作業ツリーに `docs/steering/structure.md` が無い、またはそのファイルに非空行が無く、ディレクトリ、命名、テストの置き場所について、根拠のファイルと行の組が一つである記述が一つも無く、受け入れ条件 39 の候補も無い 主体: `sdd-cur-steering` 結果: `docs/steering/structure.md` を作らない

## 範囲外

- `docs/steering/tech.md` と `docs/steering/product.md` を、この課題で作ること
- `docs/steering/structure.md` と `docs/steering/terms.md` 以外のパスへ書くこと
- `docs/steering/` のサブディレクトリへ書くこと
- 人が明示していないときに、下書きの手順を行うこと
- 明示したとみなす字面の一覧を作ること
- この課題の成果物として、このリポジトリに `docs/steering/structure.md` と `docs/steering/terms.md` を追加すること
- 十サブエージェントの起動時の読みを変えること
- `doctor` の検査、`WARN` 行、終了コードを変えること
- `setup` の実行順を変えること
- README の節「他のプロジェクトで使う」の六つの箇条書きを変えること
- 「正本の表にあるパスは、ここには繰り返さない。」を変えること
- `initTargets` を変えること
- `src/install.ts` にスキル名を書くこと
- `skills/sdd-cur-policy/SKILL.md` を変えること
- `docs/issues/119/design.md` を変えること
- CLI を実行するスキルの列挙へ `sdd-cur-steering` を足すこと
- 下書きの手順が README を読むこと
- 下書きの手順がパッケージ定義を読むこと
- 下書きの手順が、読む対象として、最上位のディレクトリ構成を読むこと
- 下書きの手順が、読む対象として、テストの実行方法を読むこと
- `docs/steering/structure.md` と `docs/steering/terms.md` の、行頭が `#` である見出しの字面を固定すること
- 人の答えだけで、根拠のファイルと行が無い記述を書くこと
- `docs/steering/terms.md` について、根拠のファイルと行の組が二つ以上ある記述を人に質問すること
- 追記の候補を、人が採用を明示して再度起動する前にファイルへ書くこと

## 決定

| 項目 | 内容 |
|---|---|
| ディレクトリ名 | `sdd-cur-steering` |
| ファイル | `skills/sdd-cur-steering/SKILL.md` |
| 起動 | 人がこのスキルを明示して起動したときだけ、下書きの手順を行う。字面の一覧は作らない |
| 自動起動 | しない。frontmatter に `disable-model-invocation: true` がある |
| 書く先 | 起動した作業ツリーの `docs/steering/structure.md` と `docs/steering/terms.md` だけである |
| 読むもの | 作業ツリーのソースコードと設定ファイルだけである。README は読まない。パッケージ定義は読まない |
| 空のファイル | 非空行が無い `docs/steering/structure.md` または `docs/steering/terms.md` は、ファイルが無いのと同型に扱う |
| 人が書き足した行 | その起動の開始時点で各ファイルにあった非空行すべてである。スキルが先の起動で書いた行も、その時点の非空行であれば人が書き足した行である。変えない |
| structure の主題 | ディレクトリ、命名、テストの置き場所についての記述だけを `docs/steering/structure.md` に書く |
| terms の主題 | ドメインの用語についての記述だけを `docs/steering/terms.md` に書く |
| 見出し | 行頭が `#` の見出しの字面は固定しない。ソースコードと設定ファイルから判断して書いてよい。記述の行は `#` で始めない |
| 根拠が無い | 両ファイルに書かない。人に質問する。人の答えだけでは書かない。その質問だけでは、組が一つであるほかの記述を下書きへ書くことを止めない |
| structure で組が二つ以上 | その記述は下書きに書かない。候補を出して人に選ばせる。選ぶまでその記述も、人が書き足した行が無いあいだは `docs/steering/structure.md` も書かない |
| terms で組が二つ以上 | その記述は下書きに書かない。候補を出さない。その点を人に質問しない |
| 追記 | 人が書き足した行があるあいだ、組が一つでまだファイルに無い記述は追記の候補として人に見せ、その起動では書かない。採用を明示して再起動したとき、人が書き足した行は変えず、組が一つである記述だけ足す |
| ファイルを作らない | 組が一つである記述が一つも無く、structure 向けの候補も無いときは `docs/steering/structure.md` を作らない。terms 向けの組が一つの記述が一つも無いときは `docs/steering/terms.md` を作らない |
| 一方だけ非空 | 非空行を含むファイルは追記の規則に従い、無いか非空行が無いファイルは受け入れ条件 8 または 9 に当たるとき下書きを書く |
| コピー | `installSkills` は直下のディレクトリをコピーする今の手順のまま、この名前もコピーする。`src/install.ts` は変えない |
| 約束 | 本文に、作業の前に `sdd-cur/conventions.md` を読む、と一行で書く |
| テスト | 新しい `test` は `src/200.test.ts` だけに足す。`src/119.test.ts` は REQ-717 の期待だけ直す。新しい `test` は足さない |
| 正本 | `docs/canonical/docs.md` の REQ-717 だけを変える |

名前の昇順は、`skillNames.sort()` の既定の並びである。並びは `sdd-cur`、`sdd-cur-complete`、`sdd-cur-create-issue`、`sdd-cur-fix`、`sdd-cur-implement`、`sdd-cur-policy`、`sdd-cur-quick`、`sdd-cur-steering` である。

人が選んだ組は、明示して起動したときの依頼に含まれる。依頼に無い組は、まだ選んでいない。同じ起動で候補の選択と採用の両方が依頼に含まれるときは、選んだ組を根拠にしたうえで、その記述を足す。

## スキル

`skills/sdd-cur-steering/SKILL.md` を新しく作る。本文は一文を一行にする。文と文のあいだに空行は入れない。`install` は、直下のディレクトリをコピーする今の手順のまま、このスキルもコピーする。`src/install.ts` は変えない。

ファイルは、末尾の改行を含めて、次と一文字も違わない。

```
---
name: sdd-cur-steering
description: 人が明示して起動したときだけ、起動した作業ツリーのソースコードと設定ファイルから、その作業ツリーの docs/steering/structure.md と docs/steering/terms.md に下書きを書く。
disable-model-invocation: true
---

作業の前に `sdd-cur/conventions.md` を読む。
# sdd-cur-steering

## 起動

人がこのスキルを明示して起動したときだけ、下書きの手順を行う。
人がこのスキルを明示して起動していないときは、下書きの手順を行わない。
明示したとみなす字面の一覧は、作らない。
下書きの対象は、このスキルを起動した作業ツリーである。

## 読む

下書きの手順は、作業ツリーのソースコードを読む。
下書きの手順は、作業ツリーの設定ファイルを読む。
README は読まない。
パッケージ定義は読まない。
根拠にするファイルは、作業ツリーの中のファイルだけである。

## 書く先

ファイルを書くとき、書くパスは、作業ツリーの `docs/steering/structure.md` と `docs/steering/terms.md` だけである。
`docs/steering/structure.md` には、ディレクトリ、命名、テストの置き場所についての記述を書く。
`docs/steering/terms.md` には、ドメインの用語についての記述を書く。
その起動の開始時点の `docs/steering/structure.md` と `docs/steering/terms.md` にあった非空行は、すべて人が書き足した行である。
人が書き足した行は、変えない。
非空行が無い `docs/steering/structure.md` は、ファイルが無いのと同型に扱う。
非空行が無い `docs/steering/terms.md` は、ファイルが無いのと同型に扱う。
作業ツリーに `docs/steering/structure.md` が無い、またはそのファイルに非空行が無く、ディレクトリ、命名、テストの置き場所について、根拠のファイルと行の組が一つである記述があり、人が書き足した行が無く、受け入れ条件と同型の候補を出していて人がまだ選んでいない記述が無いときは、そのパスへ下書きを書く。
作業ツリーに `docs/steering/terms.md` が無い、またはそのファイルに非空行が無く、ドメインの用語について、根拠のファイルと行の組が一つである記述があるときは、そのパスへ下書きを書く。
組が一つである記述が一つも無く、人に選ばせる候補も無いときは、`docs/steering/structure.md` を作らない。
ドメインの用語について、組が一つである記述が一つも無いときは、`docs/steering/terms.md` を作らない。
作業ツリーに `docs/steering/structure.md` と `docs/steering/terms.md` のうち、非空行を含むのが一方だけであるときは、非空行を含むファイルは人が書き足した行を変えず、追記の候補は人に見せてその起動では書かない。
そのとき、無いか非空行が無いファイルは、上の下書きを書く条件に当たるとき、そのパスへ下書きを書く。

## 記述

下書きに書く記述は、一文である。
その文は、作業ツリーの中の一つのファイルと、一つの行番号を含む。
行番号は十進であり、先頭の零は付けない。
パスは、作業ツリーからの相対パスである。
パスは、`/` では始めない。
パスは、`./` では始めない。
根拠の表記は、全角の始め括弧、バッククォート、そのパス、バッククォート、半角空白、の、半角空白、その行番号、半角空白、行、全角の終わり括弧、の順である。
記述の行は、`#` で始めない。
`docs/steering/structure.md` と `docs/steering/terms.md` の、行頭が `#` である見出しの字面は、固定しない。
見出しは、作業ツリーのソースコードと設定ファイルから判断して書いてよい。
根拠のファイルと行が無い点は、`docs/steering/structure.md` にも `docs/steering/terms.md` にも書かない。
その点は、人に質問する。
人の答えだけでは、根拠のファイルと行が無い記述を書かない。
根拠のファイルと行が無い点を質問することは、ほかの記述を下書きへ書くことを止めない。
ディレクトリ、命名、テストの置き場所のいずれかについて、一つの記述に根拠のファイルと行の組が二つ以上あるときは、その記述は `docs/steering/structure.md` の下書きに書かない。
そのときは、候補を出して人に選ばせる。
候補は、その記述と、作業ツリー内の一つのファイルと、一つの行番号の組である。
人がまだ選んでいない候補に当たる記述は、`docs/steering/structure.md` に書かない。
人が書き足した行が無く、候補を出していて、人がまだ選んでいないあいだは、`docs/steering/structure.md` を書かない。
人が選んだ組は、明示して起動したときの依頼に含まれる。
依頼に、選んだ組が無いときは、まだ選んでいない。
人が一つの候補を選び、このスキルを明示して起動しているときは、選んだファイルと行番号を、その記述の根拠にする。
候補が一つ以上あり、まだ選んでいない候補が無く、`docs/steering/structure.md` が無い、またはそのファイルに非空行が無いときは、選んだ記述を含めて下書きを書く。
ドメインの用語についての一つの記述に、根拠のファイルと行の組が二つ以上あるときは、その記述は `docs/steering/terms.md` の下書きに書かない。
そのときは、候補を出さない。
その点を人に質問しない。
人が書き足した行があり、まだファイルに無い記述で、根拠のファイルと行の組が一つであるものは、追記の候補として人に見せる。
その起動ではファイルへ書かない。
人が書き足した行があり、候補を出していて、人がまだ選んでいない記述は、追記の候補にしない。
そのときも、候補を出して人に選ばせる。
根拠のファイルと行の組が一つであり、まだファイルに無い記述は、追記の候補として人に見せる。
その起動ではファイルへ書かない。
人が追記の候補の採用を明示して、このスキルを再び明示して起動したときは、人が書き足した行は変えない。
根拠のファイルと行の組が一つである記述だけをファイルへ足す。
根拠のファイルと行が無い記述は足さない。
組が二つ以上あり、人が選んでいない記述は足さない。
人が書き足した行があり、依頼に一つの記述について選んだ組があり、その記述の追記の採用を明示して、このスキルを明示して起動しているときは、選んだファイルと行番号をその記述の根拠にし、その記述をファイルへ足す。
人が書き足した行は変えない。

## 禁止

課題を作らない。
課題を変えない。
課題を閉じない。
ラベルを変えない。
課題コメントを書かない。
作業ツリーの `docs/steering/structure.md` と `docs/steering/terms.md` 以外のパスへは書かない。
```

## 文書

README の、`install` がコピーするスキルを列挙する文は、次の一行にする。

```
`install` がコピーするスキルは `skills/sdd-cur`、`skills/sdd-cur-complete`、`skills/sdd-cur-create-issue`、`skills/sdd-cur-fix`、`skills/sdd-cur-implement`、`skills/sdd-cur-policy`、`skills/sdd-cur-quick`、`skills/sdd-cur-steering` である。
```

「ディレクトリ」のコードフェンスでは、`skills/sdd-cur-quick/` の行の直後に、次の行を置く。`install` の開始列は、今のスキルの行と同じである。

```
skills/sdd-cur-steering/      install がコピーする steering の下書きのスキル（docs/steering/structure.md と docs/steering/terms.md）
```

`docs/policy.md` の構成の表の `skills/<名前>/` の行の役割の列は、次の一文にする。

```
`install` がコピーするスキル。直下のディレクトリだけが対象。`sdd-cur-steering` は、人が明示して起動したとき、作業ツリーのソースコードと設定ファイルから `docs/steering/structure.md` と `docs/steering/terms.md` の下書きを書く。
```

表の場所の列は変えない。`docs/steering/` の行と、その四つの `##` 見出しと、「このファイルを変えるのは、課題を通したときだけである。」の文は変えない。

`src/docs.test.ts` は変えない。そのテストは、README の列挙文とディレクトリの図から取ったスキル名の集合を、`skills/` 直下のディレクトリ名の集合と比べる。ディレクトリと README を上のとおりにすると、その一致に `sdd-cur-steering` が含まれる。

## テスト

- `bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。新しい `test` は `src/200.test.ts` だけに足す。`src/docs.test.ts` には、新しい `test` を足さない。[35]

- `skills/sdd-cur-steering/SKILL.md` は、「スキル」の全文と、末尾の改行を含めて一文字も違わない。frontmatter の `name` は `sdd-cur-steering` であり、`disable-model-invocation: true` がある。`description` から、明示起動時にソースコードと設定ファイルから二つの steering ファイルの下書きを書くことが読める。明示していないときは下書きの手順を行わない。書くパスは二つの steering ファイルだけである。課題を作らない。課題を変えない。課題を閉じない。ラベルを変えない。課題コメントを書かない。[1][2][3][4][7][17][18][19][20][21][34]
- 同じ全文に、ソースコードと設定ファイルだけを読み、README とパッケージ定義は読まない、とある。根拠は作業ツリー内のファイルだけである。[5][6]
- 同じ全文に、各記述は一文で一つのファイルと一つの行番号を持ち、記述の行は `#` で始めない、見出しの字面は固定しない、根拠が無い点は書かず人に質問し、人の答えだけでは書かない、とある。[10][11][12][13][37][38][46]
- 同じ全文に、structure で組が二つ以上のときは候補を出し選ぶまで書かず、人が書き足した行が無いあいだは structure を書かない、terms で組が二つ以上のときは書かず候補も出さず質問もしない、とある。[39][40][41][42][43][44][45]
- 同じ全文に、人が書き足した行は変えない、追記の候補は見せるだけでその起動では書かない、採用を明示して再起動したとき組が一つである記述だけ足す、空ファイルは無いのと同型、記述が無いときはファイルを作らない、一方だけ非空のときの扱い、とある。[8][9][14][15][16][47][48][49][50][51][52][53]
- 一時ディレクトリを `homedir` と `projectRoot` にし、このリポジトリの `skills/` をソースにして `installSkills` を呼ぶ。`skillNames` に `sdd-cur-steering` がある。コピー先の `SKILL.md` はソースと一致する。`src/install.ts` に `sdd-cur-steering` は無い。[22][23]
- README の列挙文は、「文書」の一行である。バッククォートで囲んだ名前の順が要件どおりである。「ディレクトリ」のコードフェンスに、`skills/sdd-cur-steering/` の行があり、`skills/sdd-cur-quick/` の行より後ろにある。[24][25][27]
- README の節「他のプロジェクトで使う」の六つの箇条書きは、この課題の前と一文字も同じである。[26]
- `docs/policy.md` の構成表で、`sdd-cur-steering` の下書きが読める。表の場所の列のパス集合は変わらない。`skills/<名前>/` の行に「直下のディレクトリだけが対象」が残る。四つの `##` 見出しと「このファイルを変えるのは、課題を通したときだけである。」は変わらない。`docs/steering/` の行の説明は残る。[28][29][30][31]
- `src/docs.test.ts` の、README のスキル記述と `skills/` 直下のディレクトリの一致を確かめるテストは、集合の比較のままである。`skills/sdd-cur-steering` がディレクトリとしてあり、列挙文とディレクトリの図の両方から `sdd-cur-steering` が取れる。[24][25]
- `docs/canonical/docs.md` の REQ-717 は、「正本への差分」の本文である。ディレクトリ名の並びは決定の配列と一文字も違わない。[32]
- `src/119.test.ts` の既存の、`docs/canonical/docs.md` の REQ-717 を確かめる `test` は、期待する本文を `docs/issues/200/design.md` の `### 変更 docs REQ-717` の本文と比べる。`expectedSkillDirOrder` に `sdd-cur-steering` を足す。新しい `test` は足さない。[33]
- `initTargets` は三つの相対パスのままである。[36]

## 一度に実装できる大きさ

一つの作業が一度に実装できる大きさであるとは、次のとおりである。

- `[<番号>]` を一つ以上持つ作業では、その番号の受け入れ条件に直結する実装を、他の受け入れ条件に直結する実装を含めず、実装作成役の一回の起動で書き終えられる
- `[<番号>]` が無い作業では、その作業の行に書かれた実装を、一回の起動で書き終えられる

この設計の作業の一覧の各作業は、上を満たす。

## 変えるファイル

- skills/sdd-cur-steering/SKILL.md
- README.md
- docs/policy.md
- docs/canonical/docs.md
- src/119.test.ts
- src/200.test.ts

## 作業の一覧

- 1. `skills/sdd-cur-steering/SKILL.md` を、「スキル」の全文で作る。`src/install.ts` は変えない。[1][2][3][4][5][6][7][8][9][10][11][12][13][14][15][16][17][18][19][20][21][34][37][38][39][40][41][42][43][44][45][46][47][48][49][50][51][52][53]
- 2. README の列挙文と、「ディレクトリ」のコードフェンスを、「文書」の字面にする。`src/docs.test.ts` は変えない。[24][25][26][27]
- 3. `docs/policy.md` の構成表の `skills/<名前>/` の役割の列を、「文書」の一文にする。[28][29][30][31]
- 4. `docs/canonical/docs.md` の REQ-717 を、「正本への差分」の本文にする。[32]
- 5. `src/200.test.ts` を「テスト」のとおり書く。`src/119.test.ts` の REQ-717 の期待を「テスト」のとおり直す。新しい `test` は `src/200.test.ts` だけに足す。[22][23][33][35][36]
- 6. `installSkills` が `sdd-cur-steering` をコピーすることを、作業 1 と 5 で確かめる。[22][23]

## 関係する課題

- #199（`docs/steering/` を置けるようにし、十サブエージェントが読む。この課題は、その読み方、`doctor`、`init` を変えない）
- #165（`setup` と、README の節「他のプロジェクトで使う」の六手順。この課題は、その六手順と `setup` の実行順を変えない）
- #119（`sdd-cur-policy` の根拠の付け方、`installSkills` がディレクトリをコピーし `src/install.ts` にスキル名を書かないこと、REQ-717 の本文を課題 119 の設計と一文字も同じと確かめるテスト）

#119 の REQ-717 一致は、本課題の実装後は `docs/issues/200/design.md` の「正本への差分」の本文と比べる。`docs/issues/119/design.md` は変えない。

## 正本への差分

### 変更 docs REQ-717

もとになった課題は #119 である。

いまのディレクトリは`sdd-cur`、`sdd-cur-complete`、`sdd-cur-create-issue`、`sdd-cur-fix`、`sdd-cur-implement`、`sdd-cur-policy`、`sdd-cur-quick`、`sdd-cur-steering`。名前の昇順は、`skillNames.sort()` の既定の並びである

- シナリオ: 条件: `skills/` 直下に `sdd-cur-steering` がある 主体: `installSkills` 結果: そのディレクトリ名をコピーする
- シナリオ: 条件: 正本の REQ-717 を読む 主体: 利用者 結果: いまのディレクトリの一覧に `sdd-cur-steering` が含まれる
