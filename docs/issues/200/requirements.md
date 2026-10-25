# 200 作業ツリーのコードから docs/steering/ の下書きを作るスキルを足す

<!-- sdd-cur:form -->

対象は [Issue #200](https://github.com/paterapatera/sdd-cur/issues/200)。人が明示して起動したときだけ、起動した作業ツリーのソースコードと設定ファイルから `docs/steering/structure.md` と `docs/steering/terms.md` の下書きを書くスキル `sdd-cur-steering` を足す。`structure.md` の記述は、ディレクトリ、命名、テストの置き場所についてである。`terms.md` の記述は、ドメインの用語についてである。記述は一文ごとに根拠のファイルと行を付ける。根拠の無い点は人に聞く。人の答えだけでは、根拠の無い記述は書かない。一つの記述に根拠のファイルと行の組が二つ以上あるとき、`structure.md` では人に選ばせ、`terms.md` では書かず質問しない。行頭が `#` の見出しの字面は固定しない。記述の行は `#` で始めない。書いてよいパスは、その二つのファイルだけである。その起動の開始時点の非空行は人が書き足した行であり、変えない。根拠のある新規記述は、追記の候補として人に見せ、その起動ではファイルへ書かない。人が採用を明示して再度起動したとき、根拠のある記述だけファイルへ足す。`install` がコピーするスキルに加える。

重なる課題は #199 と #165 である。

## 現状

スキル `sdd-cur-steering` は無い。正本が挙げるスキルのディレクトリ名は、`sdd-cur`、`sdd-cur-complete`、`sdd-cur-create-issue`、`sdd-cur-fix`、`sdd-cur-implement`、`sdd-cur-policy`、`sdd-cur-quick` である（`docs/canonical/docs.md` の 69 行）。

`installSkills` は、ソース直下のディレクトリだけをコピーする（`src/install.ts` の 245 行）。コピーは `cp` である（`src/install.ts` の 251 行）。返る名前は `sort` する（`src/install.ts` の 255 行）。課題 119 のテストは、`src/install.ts` に `sdd-cur-policy` が無いことを確かめる（`src/119.test.ts` の 283 行）。

README は、`install` がコピーするスキルの名前を一文に列挙する（`README.md` の 96 行）。ディレクトリの図の最後のスキル行は `skills/sdd-cur-quick/` である（`README.md` の 141 行）。テストは、README のその記述と `skills/` 直下のディレクトリが一致することを確かめる（`src/docs.test.ts` の 128 行）。節「他のプロジェクトで使う」の三つ目は、Cursor で `sdd-cur-policy` を起動し、`docs/policy.md` の下書きを作る、である（`README.md` の 15 行）。見出し「ディレクトリ」の直後に、「正本の表にあるパスは、ここには繰り返さない。」と書く（`README.md` の 128 行）。

`docs/policy.md` の構成の表の最後の行は `skills/<名前>/` であり、直下のディレクトリだけが対象である、と書く（`docs/policy.md` の 38 行）。同じ表に `docs/steering/` の行がある（`docs/policy.md` の 33 行）。見出しは、`誰のための道具か`（`docs/policy.md` の 5 行）、`技術の前提`（`docs/policy.md` の 9 行）、`構成`（`docs/policy.md` の 17 行）、`破ってはいけない原則`（`docs/policy.md` の 40 行）である。このファイルを変えるのは、課題を通したときだけである、と書く（`docs/policy.md` の 3 行）。

`sdd-cur-policy` の frontmatter に `disable-model-invocation: true` がある（`skills/sdd-cur-policy/SKILL.md` の 4 行）。人がこのスキルを明示して起動したときだけ、下書きの手順を行う、と書く（`skills/sdd-cur-policy/SKILL.md` の 12 行）。導入先は、このスキルを起動した作業ツリーである、と書く（`skills/sdd-cur-policy/SKILL.md` の 15 行）。下書きの手順は、作業ツリーのコードを読む、と書く（`skills/sdd-cur-policy/SKILL.md` の 19 行）。README を読む、と書く（`skills/sdd-cur-policy/SKILL.md` の 20 行）。パッケージ定義を読む、と書く（`skills/sdd-cur-policy/SKILL.md` の 24 行）。最上位のディレクトリ構成を読む、と書く（`skills/sdd-cur-policy/SKILL.md` の 27 行）。テストの実行方法を読む、と書く（`skills/sdd-cur-policy/SKILL.md` の 28 行）。根拠にするファイルは、作業ツリーの中のファイルだけである、と書く（`skills/sdd-cur-policy/SKILL.md` の 29 行）。ファイルを書くとき、書くパスは、作業ツリーの `docs/policy.md` だけである、と書く（`skills/sdd-cur-policy/SKILL.md` の 33 行）。

下書きに書く記述は、一文である、と書く（`skills/sdd-cur-policy/SKILL.md` の 71 行）。その文は、作業ツリーの中の一つのファイルと、一つの行番号を含む、と書く（`skills/sdd-cur-policy/SKILL.md` の 72 行）。行番号は十進であり、先頭の零は付けない、と書く（`skills/sdd-cur-policy/SKILL.md` の 73 行）。パスは、作業ツリーからの相対パスである、と書く（`skills/sdd-cur-policy/SKILL.md` の 74 行）。パスは、`/` では始めない、と書く（`skills/sdd-cur-policy/SKILL.md` の 75 行）。パスは、`./` では始めない、と書く（`skills/sdd-cur-policy/SKILL.md` の 76 行）。根拠の表記は、全角の始め括弧、バッククォート、パス、バッククォート、半角空白、の、半角空白、行番号、半角空白、行、全角の終わり括弧、の順である、と書く（`skills/sdd-cur-policy/SKILL.md` の 77 行）。記述の行は、`#` で始めない、と書く（`skills/sdd-cur-policy/SKILL.md` の 78 行）。根拠のファイルと行が無い点は、書かない、と書く（`skills/sdd-cur-policy/SKILL.md` の 79 行）。その点は、人に質問する、と書く（`skills/sdd-cur-policy/SKILL.md` の 80 行）。人の答えだけでは、根拠のファイルと行が無い記述を書かない、と書く（`skills/sdd-cur-policy/SKILL.md` の 81 行）。根拠の無い点を質問することは、ほかの記述を下書きへ書くことを止めない、と書く（`skills/sdd-cur-policy/SKILL.md` の 82 行）。「誰のための道具か」の記述に、ファイルと行の組が二つ以上あるときは、候補を出して人に選ばせる、と書く（`skills/sdd-cur-policy/SKILL.md` の 83 行）。「破ってはいけない原則」の記述に、ファイルと行の組が二つ以上あるときは、候補を出して人に選ばせる、と書く（`skills/sdd-cur-policy/SKILL.md` の 84 行）。「技術の前提」と「構成」では、ファイルと行の組が二つ以上ある記述は、下書きに書かない、と書く（`skills/sdd-cur-policy/SKILL.md` の 92 行）。

`<名前>` は英小文字で始まり、英小文字と数字が続き、区切りのハイフンを含んでよい（`skills/sdd-cur/conventions.md` の 24 行）。`docs/steering/<名前>.md` の `<名前>` は、その規則と同じである（`skills/sdd-cur/conventions.md` の 26 行）。

`init` が置く相対パスの一つ目は `docs/policy.md` である（`src/init.ts` の 25 行）。二つ目は `docs/canonical/README.md` である（`src/init.ts` の 26 行）。三つ目は `docs/issues/README.md` である（`src/init.ts` の 27 行）。

CLI を実行するスキルの列挙は、`skills/sdd-cur/SKILL.md`、`skills/sdd-cur-quick/SKILL.md`、`skills/sdd-cur-complete/SKILL.md`、`skills/sdd-cur-implement/SKILL.md` である（`docs/canonical/sdd.md` の 2141 行）。

スキル本文は、フロントマターの閉じ `---` の次の行から、一文を一行に書く（`docs/conventions.md` の 8 行）。テストを足すファイルは `src/<番号>.test.ts` だけである（`docs/conventions.md` の 31 行）。テストはホームディレクトリを触らない（`AGENTS.md` の 22 行）。課題 119 のテストは、`docs/canonical/docs.md` の REQ-717 の本文を、課題 119 の設計の差分と一文字も同じと確かめる（`src/119.test.ts` の 334 行）。

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
- 35. 条件: この課題のテストを書く 主体: テスト 結果: ファイルは `src/200.test.ts` だけである。既存の `src/*.test.ts` に新しい `test` を足さない。ただし受け入れ条件 33 の、`src/119.test.ts` の既存の一致を直すことは除く。`gh` のプロセスは起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す
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

## 決定

空の `docs/steering/structure.md` または `docs/steering/terms.md` は、ファイルが無いのと同型に扱う。非空行が無ければ受け入れ条件 8・9 のとおり、そのパスへ下書きを書く。

下書きの手順が読む対象は、作業ツリーのソースコードと設定ファイルだけである。README は読まない。パッケージ定義は読まない。

根拠のファイルと行が無い点は、人に質問する。人の答えだけでは、その記述を下書きに書かない。その質問だけでは、根拠のファイルと行の組が一つであるほかの記述を下書きへ書くことを止めない。

一つの記述に根拠のファイルと行の組が二つ以上あるときの扱いは、`sdd-cur-policy` と同型である。`docs/steering/structure.md` では、ディレクトリ、命名、テストの置き場所のそれぞれについて、その記述は下書きに書かない。候補を出して人に選ばせる。候補は、その記述と、作業ツリー内の一つのファイルと、一つの行番号の組である。人がまだ選んでいない候補に当たる記述は書かない。人が書き足した行が無いあいだは、`docs/steering/structure.md` を書かない。人が選んだ組は、明示して起動したときの依頼に含まれる。依頼に選んだ組が無いときは、まだ選んでいない。人が一つの候補を選び、このスキルを明示して起動しているときは、選んだファイルと行番号をその記述の根拠にする。候補が一つ以上あり、まだ選んでいない候補が無く、`docs/steering/structure.md` が無い、またはそのファイルに非空行が無いときは、選んだ記述を含めて下書きを書く。

`docs/steering/terms.md` では、根拠のファイルと行の組が二つ以上ある記述は下書きに書かない。候補を出さない。その点を人に質問する手順は無い。

`docs/steering/structure.md` と `docs/steering/terms.md` の、行頭が `#` である見出しの字面は固定しない。見出しは、作業ツリーのソースコードと設定ファイルから判断して書いてよい。記述の行は `#` で始めない。

人が書き足した行は、その起動の開始時点でファイルにあった非空行すべてである。スキルが先の起動で書いた行も、その時点の非空行であれば、人が書き足した行である。スキルはその行を変えない。根拠のファイルと行の組が一つであり、まだファイルに無い記述だけを、追記の候補とする。

追記の候補は、人に見せるだけである。その起動ではファイルへ書かない。人が採用を明示して、このスキルを再び明示して起動したとき、根拠のファイルと行の組が一つである記述だけをファイルへ足す。人が書き足した行は変えない。根拠のファイルと行が無い記述は足さない。組が二つ以上あり、人が選んでいない記述は足さない。同じ起動で、候補の選択と採用の両方が依頼に含まれるときは、選んだ組を根拠にしたうえで、その記述を足す。

二つのファイルは別である。非空行を含むのが一方だけであるときは、非空行を含むファイルは上の追記の規則に従い、無いか非空行が無いファイルは、組が一つである記述があるときに下書きを書く。`docs/steering/structure.md` が無い、またはそのファイルに非空行が無く、人がまだ選んでいない候補があるあいだは、そのファイルは書かない。

組が一つである記述が一つも無い `docs/steering/terms.md` は作らない。`docs/steering/structure.md` は、組が一つである記述が一つも無く、人に選ばせる候補も無いときは作らない。

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

## 関係する課題

- #199（`docs/steering/` を置けるようにし、十サブエージェントが読む。この課題は、その読み方、`doctor`、`init` を変えない）
- #165（`setup` と、README の節「他のプロジェクトで使う」の六手順。この課題は、その六手順と `setup` の実行順を変えない）
- #119（`sdd-cur-policy` の根拠の付け方、`installSkills` がディレクトリをコピーし `src/install.ts` にスキル名を書かないこと、REQ-717 の本文を課題 119 の設計と一文字も同じと確かめるテスト）

## 比べる相手

cc-sdd の `/kiro:steering` は、コードベースを読んで `structure.md`、`tech.md`、`product.md` を作り、すでにあるときは更新する。この課題が足す初期の文書は、`structure.md` と `terms.md` の二つである。人が書き足した行は変えず、追記の候補として見せる。

記述ごとに根拠のファイルと行を付ける作法の比べる相手は、`skills/sdd-cur-policy/SKILL.md` である。
