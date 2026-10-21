# 116 スキルから CLI を sdd-cur コマンドで呼び、別のプロジェクトでも動くようにする

<!-- sdd-cur:form -->

対象は [Issue #116](https://github.com/paterapatera/sdd-cur/issues/116)。スキルが CLI を `bun src/cli.ts` で呼ぶのをやめ、パスの通った `sdd-cur` で呼ぶ。`install` でコピーしたスキルを、このリポジトリ以外の git リポジトリでも使えるようにする。要求レビューは、中級の `sdd-cur-req-reviewer` と上級の `sdd-cur-req-reviewer-high` に分ける。

重なる課題は #75、#115、#46 である。要求レビューの中級と上級は、#30 と #91 にも重なる。

## 受け入れ条件

- 1. 条件: `skills/` の本文を見る 主体: 検査 結果: `bun src/cli.ts` が無い
- 2. 条件: `agents/` の本文を見る 主体: 検査 結果: `bun src/cli.ts` が無い
- 3. 条件: `skills/` と `agents/` で CLI を呼ぶ文がある 主体: その文 結果: コマンドは `sdd-cur` である
- 4. 条件: `skills/` と `agents/` の本文で、サブコマンドがある呼び出しがある 主体: その呼び出し 結果: `sdd-cur` のあとに空白一つと、置き換える前と同じサブコマンドが続く
- 5. 条件: `skills/` と `agents/` の本文で、引数がある呼び出しがある 主体: その呼び出し 結果: 置き換える前と同じ引数が続く
- 6. 条件: `skills/` と `agents/` の本文で、サブコマンドも引数も無い `bun src/cli.ts` がある 主体: その呼び出し 結果: `sdd-cur` である
- 7. 条件: `skills/sdd-cur-create-issue/SKILL.md` の、課題を作らない文 主体: そのファイル 結果: 「`sdd-cur` では課題を作らない。」と書く
- 8. 条件: このリポジトリ以外の git リポジトリで、`sdd-cur` にパスが通っている 主体: 着手、要件、設計、確認、回答、完了、quick の各段 結果: CLI を `sdd-cur` で呼ぶ
- 9. 条件: CLI を実行するスキルが `sdd-cur` を見つけられない 主体: そのスキル 結果: 入れ方を一行で伝える
- 10. 条件: その一行を伝える 主体: そのスキル 結果: その一行に `bun add -g @paterapatera/sdd-cur` が含まれる
- 11. 条件: その一行を伝えた 主体: そのスキル 結果: 止まる
- 12. 条件: 止まった 主体: そのスキル 結果: `sdd-cur` を実行しない
- 13. 条件: このリポジトリで `bun link` を実行したあと 主体: `sdd-cur` 結果: 手元の `src/cli.ts` を実行する
- 14. 条件: `install` を実行する 主体: `install` 結果: スキルをコピーする
- 15. 条件: `install` がスキルをコピーする 主体: `install` 結果: スキル本文を書き換えない
- 16. 条件: `install` がスキルをコピーする 主体: `install` 結果: コピーした版をスキルの横に記録しない
- 17. 条件: 実行中の `sdd-cur` の版が、スキルをコピーしたときと違う 主体: スキル 結果: 知らせない
- 18. 条件: スキル本文を文字列で確かめ、サブコマンドがある `bun src/cli.ts` の呼び出しを期待している 主体: そのテスト 結果: `sdd-cur` のあとに空白一つと、今と同じサブコマンドが続く文字列を期待する
- 19. 条件: スキル本文を文字列で確かめ、引数がある `bun src/cli.ts` の呼び出しを期待している 主体: そのテスト 結果: 今と同じ引数を期待する
- 20. 条件: スキル本文を文字列で確かめ、サブコマンドも引数も無い `bun src/cli.ts` を期待している 主体: そのテスト 結果: `sdd-cur` を期待する
- 21. 条件: 課題を作らない文を期待している 主体: そのテスト 結果: 「`sdd-cur` では課題を作らない」を期待する
- 22. 条件: 要求レビューの中級のファイルを見る 主体: 検査 結果: `agents/sdd-cur-req-reviewer.md` である
- 23. 条件: 要求レビューの中級の frontmatter を見る 主体: 検査 結果: `name` は `sdd-cur-req-reviewer` である
- 24. 条件: 要求レビューの中級の frontmatter を見る 主体: 検査 結果: `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である
- 25. 条件: 要求レビューの上級のファイルを見る 主体: 検査 結果: `agents/sdd-cur-req-reviewer-high.md` である
- 26. 条件: 要求レビューの上級の frontmatter を見る 主体: 検査 結果: `name` は `sdd-cur-req-reviewer-high` である
- 27. 条件: 要求レビューの上級の frontmatter を見る 主体: 検査 結果: `model` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である
- 28. 条件: 上級の frontmatter の `model` と `src/conventions.ts` の `reviewModelFromRound3` を比べる 主体: 検査 結果: 一文字も違わない
- 29. 条件: 要求レビューを初めて起動する 主体: 親 結果: `sdd-cur-req-reviewer` を起動する
- 30. 条件: 要求レビューの 1 回目と 2 回目を起動する 主体: 親 結果: `sdd-cur-req-reviewer` を起動する
- 31. 条件: `review-next` のあと、要求レビュー役を起動し、返った `model` が空文字である 主体: 親 結果: `sdd-cur-req-reviewer` を起動する
- 32. 条件: `review-next` のあと、要求レビュー役を起動し、返った `model` が空でない 主体: 親 結果: `sdd-cur-req-reviewer-high` を起動する
- 33. 条件: 人が答えたあとに要求レビュー役を再び起動し、返った `model` が空文字である 主体: `skills/sdd-cur/SKILL.md` の要求の段 結果: `sdd-cur-req-reviewer` である
- 34. 条件: 人が答えたあとに要求レビュー役を再び起動し、返った `model` が空でない 主体: `skills/sdd-cur/SKILL.md` の要求の段 結果: `sdd-cur-req-reviewer-high` である
- 35. 条件: 要求レビュー役を起動する 主体: 親 結果: Task に `model` を渡さない
- 36. 条件: 要求レビューの中級と上級を切り替える 主体: 親 結果: 起動するサブエージェント名で切り替える
- 37. 条件: `skills/sdd-cur/SKILL.md` の要求レビュー手順を読む 主体: その手順 結果: 初回の起動が `sdd-cur-req-reviewer` であると書く
- 38. 条件: `skills/sdd-cur/SKILL.md` の要求レビュー手順を読む 主体: その手順 結果: `review-next` のあと、返った `model` が空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する、と書く
- 39. 条件: `skills/sdd-cur/SKILL.md` の要求レビュー手順を読む 主体: その手順 結果: 要求レビュー役を起動するとき model を渡さない、と書く
- 40. 条件: `skills/sdd-cur-quick/SKILL.md` の要求レビュー手順を読む 主体: その手順 結果: 上の三つの書き方と同じである
- 41. 条件: `skills/sdd-cur/SKILL.md` と `skills/sdd-cur-quick/SKILL.md` の設計レビュー手順で、返った `model` が空でない 主体: その手順 結果: その文字列をレビュー役の model に渡す
- 42. 条件: `skills/sdd-cur-implement/SKILL.md` のレビュー手順で、返った `model` が空でない 主体: その手順 結果: その文字列をレビュー役の model に渡す
- 43. 条件: `install` の `subagentFileNames` を見る 主体: 検査 結果: `sdd-cur-req-reviewer-high.md` を含む
- 44. 条件: `install` がコピーするサブエージェントを数える 主体: 検査 結果: 十一個である
- 45. 条件: `subagentFileNames` を見る 主体: 検査 結果: 従来の十個のファイル名が残る。十個は `sdd-cur-req-author.md`、`sdd-cur-req-reviewer.md`、`sdd-cur-req-fixer.md`、`sdd-cur-design-author.md`、`sdd-cur-design-reviewer.md`、`sdd-cur-design-fixer.md`、`sdd-cur-implement-author.md`、`sdd-cur-implement-reviewer.md`、`sdd-cur-implement-fixer.md`、`sdd-cur-explore.md` である
- 46. 条件: `subagentFileNames` の並びを見る 主体: 検査 結果: `sdd-cur-req-reviewer-high.md` は `sdd-cur-req-reviewer.md` の直後である
- 47. 条件: `subagentFileNames` の並びを見る 主体: 検査 結果: ほかの十個の相対順は、今の並びと同じである
- 48. 条件: `subagentFileNames` の末尾を見る 主体: 検査 結果: `sdd-cur-explore.md` である
- 49. 条件: `subagentFileNames` の順を見る 主体: 検査 結果: `sdd-cur-req-author.md`、`sdd-cur-req-reviewer.md`、`sdd-cur-req-reviewer-high.md`、`sdd-cur-req-fixer.md`、`sdd-cur-design-author.md`、`sdd-cur-design-reviewer.md`、`sdd-cur-design-fixer.md`、`sdd-cur-implement-author.md`、`sdd-cur-implement-reviewer.md`、`sdd-cur-implement-fixer.md`、`sdd-cur-explore.md` である
- 50. 条件: 上級のレビューの見方と中級のレビューの見方を比べる 主体: 二つのファイル 結果: 同じである
- 51. 条件: 中級のファイルと上級のファイルを比べる 主体: 二つのファイル 結果: 違うのは、frontmatter の `name` と `model` と、上級であることの表示である
- 52. 条件: 上級の frontmatter の `readonly` を見る 主体: 検査 結果: `true` であり、中級と同じである
- 53. 条件: README の `install` の説明を読む 主体: README 結果: コピーするサブエージェントの数を十一個と書く
- 54. 条件: スキル本文を文字列で確かめ、`skills/sdd-cur/SKILL.md` の要求レビュー手順を期待している 主体: そのテスト 結果: 初回の起動が `sdd-cur-req-reviewer` である文字列を期待する
- 55. 条件: その同じテストが要求レビュー手順を期待する 主体: そのテスト 結果: 返った `model` が空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する、という文字列を期待する
- 56. 条件: その同じテストが要求レビュー手順を期待する 主体: そのテスト 結果: 要求レビュー役の起動で model を渡さない、という文字列を期待する
- 57. 条件: スキル本文を文字列で確かめ、`skills/sdd-cur-quick/SKILL.md` の要求レビュー手順を期待している 主体: そのテスト 結果: 上の三つの文字列を期待する
- 58. 条件: 設計レビューまたは実装レビューの手順を文字列で期待し、空でない `model` をレビュー役に渡すことを期待している 主体: そのテスト 結果: その期待を変えない

## 範囲外

次は、この要件に含めない。

- README のコマンド表記（#115）
- 設計レビューと実装レビューの中級と上級の分割
- 設計レビューと実装レビューで、親が `model` を渡すことの変更
- 約束と方針のファイルを導入先でどう読むか（#117、#118）
- Cursor 以外のエージェント、GitHub 以外のトラッカー、英語化
- 開発時の `bun src/cli.ts` をやめること。`package.json` の `scripts.sdd-cur` を変えること
- `review-next` が返す `model` を変えること
- 版の記録と、版が違うときの通知
- `docs/policy.md`、`docs/conventions.md`、`AGENTS.md` の書き換え

## 決定

| 項目 | 内容 |
|---|---|
| コマンド | `skills/` と `agents/` の本文にある `bun src/cli.ts` は、すべて `sdd-cur` にする。サブコマンドと引数の字面は残す |
| ほかのリポジトリ | 呼び出しはパスの通った `sdd-cur` である。このリポジトリの `src/cli.ts` へのパスは、スキルに書かない |
| 見つからないとき | CLI を実行する四つのスキルに、下の二文を一つずつ置く |
| 手元のソース | `bin.sdd-cur` は `src/cli.ts` のままである。先頭行は `#!/usr/bin/env bun` のままである。このリポジトリで `bun link` したあと、`sdd-cur` はそのファイルを実行する。別の入口は足さない |
| 開発時 | `bun src/cli.ts` と `scripts.sdd-cur` の `bun src/cli.ts` は残す |
| コピー | `install` は、今どおり `cp` でスキルをコピーする。本文は書き換えない。版のファイルは置かない。スキルは版の違いを知らせない |
| 要求レビュー | 初回は `sdd-cur-req-reviewer` である。`review-next` のあと、返った `model` が空なら中級、空でなければ上級である。親は Task に `model` を渡さない |
| 1 回目と 2 回目 | `review-next` の戻りは空文字のままである。空文字なので中級を起動する |
| 3 回目以降 | `review-next` の戻りは `reviewModelFromRound3` のままである。空でないので上級を起動する |
| 設計と実装 | 返った `model` が空でないとき、その文字列をレビュー役の model に渡す。この文は残す |
| サブエージェント | `subagentFileNames` は十一個である。`sdd-cur-req-reviewer-high.md` は `sdd-cur-req-reviewer.md` の直後である。末尾は `sdd-cur-explore.md` である。失敗文は変えない |
| README | `install` の説明の、コピーする数だけを十一個にする。コマンド表記は変えない |

CLI を実行するスキルは、`skills/sdd-cur/SKILL.md`、`skills/sdd-cur-quick/SKILL.md`、`skills/sdd-cur-complete/SKILL.md`、`skills/sdd-cur-implement/SKILL.md` である。`skills/sdd-cur-create-issue/SKILL.md` と `skills/sdd-cur-fix/SKILL.md` は、CLI を実行しない。見つからないときの二文は置かない。

二文は、次である。

```
`sdd-cur` が見つからないときは、`bun add -g @paterapatera/sdd-cur` を含む一行を伝えて止まる。
止まったあとは、`sdd-cur` を実行しない。
```

伝える一行は、この二文とは別である。その一行は、`bun add -g @paterapatera/sdd-cur` を含み、一行である。

置く場所は、次である。

- `skills/sdd-cur/SKILL.md` では、`リポジトリのルートで `sdd-cur` を使う。` の直後
- `skills/sdd-cur-quick/SKILL.md` では、`## 起動` の中で、最初の `sdd-cur show <番号>` より前
- `skills/sdd-cur-complete/SKILL.md` では、`## 完了` の中で、承認のあとに `sdd-cur complete <番号>` を実行する文の直前
- `skills/sdd-cur-implement/SKILL.md` では、`## レビュー` の中で、`sdd-cur review-next implement <番号>` の文の直前

`skills/sdd-cur/SKILL.md` の要求の段では、返った `model` をレビュー役の model に渡す二文を、次に置き換える。

```
要求レビュー役の初回の起動が `sdd-cur-req-reviewer` である。
`review-next` のあと、返った `model` が空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する。
要求レビュー役を起動するとき model を渡さない。
要求レビュー役の起動で model を渡さない。
```

同じ段の、人が答えたあとの再起動は、次である。回数を増やさないことは残す。`モデルは、`確認: あり` を返したそのレビューと同じである。` は、この段からは除く。

```
人が答えたあとに要求レビュー役を再び起動するとき、返った `model` が空文字なら `sdd-cur-req-reviewer` である。
返った `model` が空でないなら `sdd-cur-req-reviewer-high` である。
この再起動は回数を増やさない。
```

要求の段が挙げるサブエージェント名に、`sdd-cur-req-reviewer-high` を含める。作成と修正に model を渡さない文は残す。

`skills/sdd-cur-quick/SKILL.md` の `## 要件` も、上の四文と同じである。人が答えたあとの再起動の三文は書かない。quick は人に質問しない。`## 設計` の、空でない `model` を渡す文は残す。

`skills/sdd-cur/SKILL.md` の `## 設計` にある、空でない `model` を渡す文と、人が答えたあとに返った `model` で設計レビューを再び起動する文は残す。`## 回答` の、要求側の反映後レビューは、要求の段に従う。設計側は、設計の段に従う。

初回の成果物作成を説明する括弧内の `grok-4.7[context=256k,reasoning_effort=high,fast=false]` は残す。`skills/sdd-cur-quick/SKILL.md` には、この文字列を足さない。

上級のファイルは、`agents/sdd-cur-req-reviewer.md` を写す。変えるのは、次だけである。

- frontmatter の `name` は `sdd-cur-req-reviewer-high`
- frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]`
- frontmatter の `description` は、中級の description の値の先頭に `上級である。` を足す
- 本文の最初の文は `あなたは sdd-cur の上級の要求レビュー役である。`

`readonly` は `true` のままである。本文の 2 文目以降は、中級のファイルと一文字も違わない。中級のファイルは変えない。

`subagentFileNames` の順は、受け入れ条件 49 の十一個である。いまの十個の相対順は、`sdd-cur-req-reviewer-high.md` を `sdd-cur-req-reviewer.md` の直後に挿入したこと以外は変えない。

README の `install` の行では、`十個をコピーする` を `十一個をコピーする` にする。その行のほかの字は変えない。

正本でコマンド名を変える識別子は、`docs/canonical/sdd.md` の REQ-294、REQ-299、REQ-304、REQ-306、REQ-314、REQ-327、REQ-450、REQ-457、REQ-755、REQ-760 と、`docs/canonical/complete.md` の REQ-677、REQ-691、REQ-698 である。変えるのは、スキルが呼ぶコマンド名だけである。REQ-355 の本文は変えない。着手、要件、設計、確認、回答のスキル本文は、コマンド名だけを変える。REQ-307、REQ-346、REQ-459、REQ-721 と、`docs/canonical/install.md` の開発時の `bun src/cli.ts` は変えない。

## 変えるファイル

- skills/sdd-cur/SKILL.md
- skills/sdd-cur-quick/SKILL.md
- skills/sdd-cur-complete/SKILL.md
- skills/sdd-cur-create-issue/SKILL.md
- skills/sdd-cur-implement/SKILL.md
- agents/sdd-cur-req-reviewer-high.md
- src/install.ts
- README.md
- docs/canonical/sdd.md
- docs/canonical/complete.md
- docs/canonical/docs.md
- docs/canonical/install.md
- src/sdd-skill-sdd-cur.test.ts
- src/runner-skill-sdd-cur-quick.test.ts
- src/90.test.ts
- src/91.test.ts
- src/92.test.ts
- src/93.test.ts
- src/complete.test.ts
- src/create-issue.test.ts
- src/install.test.ts
- src/116.test.ts

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。`bun link` は実行しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。新しい `test` は `src/116.test.ts` だけに足す。既存の `src/*.test.ts` に、新しい `test` は足さない。既存の `test` の、下に書く期待する文字列は変える。

- `skills/` と `agents/` の各本文に `bun src/cli.ts` が無い。呼び出しは `sdd-cur` で始まり、サブコマンドと引数は置き換える前と同じである。`skills/sdd-cur-create-issue/SKILL.md` は「`sdd-cur` では課題を作らない。」を含む。[1][2][3][4][5][6][7][8]
- 四つのスキルは、決定の二文を、決定の場所に一つずつ持つ。`skills/sdd-cur-create-issue/SKILL.md` と `skills/sdd-cur-fix/SKILL.md` は、`bun add -g @paterapatera/sdd-cur` を含まない。[9][10][11][12]
- `package.json` の `bin.sdd-cur` は `src/cli.ts` であり、`src/cli.ts` の先頭行は `#!/usr/bin/env bun` であり、`scripts.sdd-cur` は `bun src/cli.ts` である。一時ディレクトリへ `install` したスキルの本文は、コピー元と一文字も違わない。宛先に、コピー元に無い版のファイルは無い。[13][14][15][16][17]
- `src/sdd-skill-sdd-cur.test.ts` の期待は、`sdd-cur`、`sdd-cur close`、`sdd-cur branch`、`sdd-cur validate <番号>` である。`src/90.test.ts` の調べる段の期待は `sdd-cur show <番号>` である。`src/91.test.ts`、`src/92.test.ts`、`src/93.test.ts` の期待は `sdd-cur review-next` である。`src/complete.test.ts` の期待は `sdd-cur complete` である。引数の `<番号>` と、`review-next` の段階名は残す。[18][19][20]
- `src/create-issue.test.ts` の期待は「`sdd-cur` では課題を作らない」である。[21]
- `agents/sdd-cur-req-reviewer.md` の `name` と `model` は、受け入れ条件 23 と 24 の文字列のままである。`agents/sdd-cur-req-reviewer-high.md` の `name`、`model`、`readonly` は、受け入れ条件 26、27、52 のとおりである。`model` は `reviewModelFromRound3` と一文字も違わない。description は中級の値の先頭に `上級である。` がある。本文の最初の文は決定の文である。2 文目以降は中級と一文字も違わない。[22][23][24][25][26][27][28][50][51][52]
- `skills/sdd-cur/SKILL.md` の `## 要件` から `## 設計` の直前は、決定の四文と、人が答えたあとの三文を含む。`その文字列をレビュー役の model に渡す` は、この区間に無い。`skills/sdd-cur-quick/SKILL.md` の `## 要件` から `## 設計` の直前は、決定の四文を含み、人が答えたあとの三文を含まない。`grok-4.7[context=256k,reasoning_effort=high,fast=false]` は quick のファイルに無い。[29][30][31][32][33][34][35][36][37][38][39][40]
- `skills/sdd-cur/SKILL.md` と `skills/sdd-cur-quick/SKILL.md` の `## 設計` は、`空でないときは、その文字列をレビュー役の model に渡す。` を含む。`skills/sdd-cur-implement/SKILL.md` の `## レビュー` も、この文を含む。この文を期待する既存のテストは、この文の期待を変えない。`sdd-cur review-next` への置換は、この文の期待とは別である。[41][42][58]
- `subagentFileNames` は、受け入れ条件 49 の順で十一個である。`src/install.test.ts` の長さの期待は 11 である。テスト名の件数は十一個である。ソースが無いときに失敗し、スキルの宛先もサブエージェントの宛先も作られない期待は残す。`src/90.test.ts` の長さ、末尾、並びの期待は、この十一個である。README は `十一個をコピーする` を含む。コマンド表記の `bun src/cli.ts` は README に残る。[43][44][45][46][47][48][49][53]
- `src/sdd-skill-sdd-cur.test.ts` の、`skills/sdd-cur/SKILL.md` を読む既存の `test` は、`初回の起動が `sdd-cur-req-reviewer` である` と、`返った `model` が空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する` と、`要求レビュー役の起動で model を渡さない` を期待する。新しい `test` は足さない。[54][55][56]
- `src/runner-skill-sdd-cur-quick.test.ts` の、`skills/sdd-cur-quick/SKILL.md` を読む既存の `test` は、上の三つの文字列を期待する。新しい `test` は足さない。[57]

## 作業の一覧

- 1. `skills/` の `bun src/cli.ts` を `sdd-cur` に置き換え、四つのスキルへ見つからないときの二文を置く。`docs/canonical/sdd.md` と `docs/canonical/complete.md` の、コマンド名を変える識別子と、REQ-804、REQ-805、REQ-806、REQ-807 を、正本への差分の本文にする。[1][2][3][4][5][6][7][8][9][10][11][12]
- 2. `bin.sdd-cur` と shebang と `scripts.sdd-cur` を残す。`install` のコピーは本文を書き換えず、版のファイルを置かない。`docs/canonical/install.md` に REQ-808 と REQ-809 を足す。[13][14][15][16][17]
- 3. スキル本文の `bun src/cli.ts` を期待している既存の `test` の文字列を、`sdd-cur` と、同じサブコマンドと、同じ引数に変える。課題を作らない文の期待を変える。[18][19][20][21]
- 4. `agents/sdd-cur-req-reviewer-high.md` を、決定のとおり中級から写す。中級のファイルは変えない。`docs/canonical/sdd.md` の REQ-165、REQ-220 と、REQ-810 を、正本への差分の本文にする。[22][23][24][25][26][27][28][50][51][52]
- 5. `skills/sdd-cur/SKILL.md` と `skills/sdd-cur-quick/SKILL.md` の要求の段を、決定の起動文にする。設計の段と、`skills/sdd-cur-implement/SKILL.md` のレビューの段の、空でない `model` を渡す文は残す。`docs/canonical/sdd.md` の REQ-209、REQ-394、REQ-399 を、正本への差分の本文にする。[29][30][31][32][33][34][35][36][37][38][39][40][41][42]
- 6. `subagentFileNames` を受け入れ条件 49 の順にする。README のコピーする数を十一個にする。`src/install.test.ts` と `src/90.test.ts` の長さと並びと件数の期待を、この順に合わせる。`docs/canonical/sdd.md` の REQ-216 と、`docs/canonical/docs.md` の REQ-762 を、正本への差分の本文にする。[43][44][45][46][47][48][49][53]
- 7. `src/sdd-skill-sdd-cur.test.ts` と `src/runner-skill-sdd-cur-quick.test.ts` の既存の `test` に、要求レビュー手順の三つの文字列を期待させる。設計レビューと実装レビューの、空でない `model` を渡す期待は変えない。`bun test` を通し、`gh` を起動しない。[54][55][56][57][58]
- 8. `src/116.test.ts` に、`skills/` と `agents/` のコマンド置換と、課題を作らない文と、四つのスキルの見つからないときの二文の確認を書く。[1][2][3][4][5][6][7][8][9][10][11][12]
- 9. `src/116.test.ts` に、`bin.sdd-cur` と先頭行と `scripts.sdd-cur` と、`install` が本文を書き換えず版のファイルを置かない確認を書く。[13][14][15][16][17]
- 10. `src/116.test.ts` に、中級と上級の要求レビュー役のファイルの確認を書く。[22][23][24][25][26][27][28][50][51][52]
- 11. `src/116.test.ts` に、`skills/sdd-cur/SKILL.md` と `skills/sdd-cur-quick/SKILL.md` の要求の段の確認を書く。[29][30][31][32][33][34][35][36][37][38][39][40]

## 関係する課題

- #30（レビューのモデル）
- #75（パッケージを公開し、`bunx` で実行できるようにする）
- #91（`review-next` が返す `model`）
- #115（関連する README）
- #46（明示して起動したときは、このリポジトリ以外でも手順に入る）

#75 は、`bin.sdd-cur` を `src/cli.ts` にし、開発時に `bun src/cli.ts` を実行すると今の CLI が起動する、と定める。この設計は、スキルの CLI 呼び出しを `sdd-cur` にする。開発時に手元のソースを `sdd-cur` として呼ぶ方法は、このリポジトリでの `bun link` である。開発時の `bun src/cli.ts` は残す。

#115 の README のコマンド表記は、この設計に含めない。コピーするサブエージェントの件数は、コマンド表記ではない。この設計は、その件数を十一個と書く。

#30 は、レビューを medium で始め、1 回目と 2 回目は `model` を渡さず、3 回目から親が `model` に high を渡す、と定める。この設計は、要求レビューでは親が `model` を渡さず、サブエージェント名で中級と上級を切り替える。設計レビューと実装レビューの `model` 渡しは変えない。

#91 は、`review-next` が返す `model` を、1 回目と 2 回目は空文字、3 回目以降は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` とする。この設計は、その空と空でないを、要求レビューの起動名の切り替えに使う。返す値は変えない。

#46 は、スキルをコマンドで指定して起動したとき、このリポジトリ以外でも手順に入る、と定める。この設計は、その手順に入ったあとの CLI 呼び出しを、パスの通った `sdd-cur` にする。起動条件は変えない。

## 正本への差分

### 変更 sdd REQ-294

もとになった課題は #116 である。

完了スキルは、人が Cursor のチャットで、対象マージリクエストの URL とマージする旨を明示して承認するまで、`sdd-cur complete <番号>` を実行しない。その承認のあとだけ実行する。

### 変更 sdd REQ-299

もとになった課題は #116 である。

承認が無いときは`sdd-cur complete <番号>` を実行しない。対象マージリクエストの URL とマージする旨の両方が要ることを伝えるである。

### 変更 sdd REQ-304

もとになった課題は #116 である。

人が明示するのは、マージする旨である。スカッシュマージとして実行するのは、承認のあとの `sdd-cur complete <番号>` である。

### 変更 sdd REQ-306

もとになった課題は #116 である。

承認を要するのは、完了スキルが `sdd-cur complete <番号>` でマージするときだけである。完了スキルは、その承認があるまで、このコマンドを実行しない。承認のあと、このコマンドを実行する。コマンドが行うスカッシュマージと、「動作確認OK」を外して「マージ済み」を付けることは、現状のままである。

### 変更 sdd REQ-314

もとになった課題は #116 である。

作業ブランチ名の取得はSDD スキルは `sdd-cur branch <番号>` を実行し、標準出力の末尾改行を除いた文字列を名前として使うである。

### 変更 sdd REQ-327

もとになった課題は #116 である。

比較は `src/conventions.ts` の `reviewNext` が行う。親は `sdd-cur review-next` の戻り値に従う。`parseReview` の読み方は変えない。

### 変更 sdd REQ-450

もとになった課題は #116 である。

すでに main で満たされていると、課題番号、ファイル、行を根拠として示せるときは、Cursor の質問機能で、閉じるか閉じないかの二択を出す。閉じるを選んだときだけ、判断と根拠を課題のコメントに書き、課題を閉じる。そのとき SDD スキルは `sdd-cur close <番号>` を使う。標準入力は、印のない判断と根拠である。

### 変更 sdd REQ-457

もとになった課題は #116 である。

閉じるは判断と根拠を本文とする通常のコメントを課題に書き、コメントを書けたときだけ課題を閉じる。SDD スキルは `sdd-cur close <番号>` を使う。標準入力は印のない判断と根拠である。設計に進める旨と、実装依頼に進める旨は伝えないである。

### 変更 sdd REQ-755

もとになった課題は #116 である。

調べるだけの段では、`sdd-cur show <番号>` を実行する。終了コードが 0 であり、`state` が `open` であり、業務ラベルが無いときだけ、サブエージェントを一つ起動する。起動する名前は `sdd-cur-explore` である。`model` は渡さない。frontmatter の `model` を使う。起動するときに、課題番号と、人が依頼した調査の内容と、`show` が返した課題本文とコメントを渡す。

### 変更 sdd REQ-760

もとになった課題は #116 である。

`sdd-cur show <番号>` の終了コードが 0 以外のときは、サブエージェントを起動しない。このときは止まる。

### 変更 complete REQ-677

もとになった課題は #116 である。

完了スキルは`skills/sdd-cur-complete/SKILL.md`。人が Project A で起動する。処理は `sdd-cur complete <番号>` が行うである。

### 変更 complete REQ-691

もとになった課題は #116 である。

完了スキルはファイルを読まない。作らない。承認のあと、作業ツリーのルートで `sdd-cur complete <番号>` を実行する。完了処理の中身は、このコマンドが行うである。

### 変更 complete REQ-698

もとになった課題は #116 である。

完了の指定は人が完了スキルで課題番号を指定すること。完了スキルは作業ツリーのルートで `sdd-cur complete <番号>` を実行する。完了処理の中身は、このコマンドが行うである。

### 変更 sdd REQ-216

もとになった課題は #116 である。

`subagentFileNames` は、次の十一個をこの順で置く。`sdd-cur-req-author.md`、`sdd-cur-req-reviewer.md`、`sdd-cur-req-reviewer-high.md`、`sdd-cur-req-fixer.md`、`sdd-cur-design-author.md`、`sdd-cur-design-reviewer.md`、`sdd-cur-design-fixer.md`、`sdd-cur-implement-author.md`、`sdd-cur-implement-reviewer.md`、`sdd-cur-implement-fixer.md`、`sdd-cur-explore.md` である。宛先、標準出力、ソースが揃わないときの失敗文は、設計 22 のままである。

### 変更 docs REQ-762

もとになった課題は #116 である。

README の SDD スキルの役割に、調べるだけの段を書く。README に、サブエージェント `sdd-cur-explore` を書く。`install` がコピーするサブエージェントの数は、十一個である。

### 変更 sdd REQ-165

もとになった課題は #116 である。

要求のレビューは、中級の `sdd-cur-req-reviewer.md` と、上級の `sdd-cur-req-reviewer-high.md` である。

### 変更 sdd REQ-220

もとになった課題は #116 である。

要求のレビューと修正指示は、中級の `sdd-cur-req-reviewer` と、上級の `sdd-cur-req-reviewer-high` である。

### 変更 sdd REQ-209

もとになった課題は #116 である。

要求レビューでは、親は Task に `model` を渡さない。`review-next` が返した `model` が空文字のときは `sdd-cur-req-reviewer` を起動する。空でないときは `sdd-cur-req-reviewer-high` を起動する。1 回目と 2 回目の返る `model` は空文字である。設計レビューと実装レビューでは、数えた 1 回目と 2 回目は `model` を渡さない。frontmatter は medium のままである。1 回目と 2 回目が続けて不合格のとき、3 回目から親が `model` に `grok-4.7[reasoning_effort=high,fast=false]` を渡す。合格まで渡す。medium には戻さないである。

### 変更 sdd REQ-394

もとになった課題は #116 である。

作成と修正の起動では、引き続き `model` を渡さない。frontmatter の `model` を使う。要求レビューでは、親は Task に `model` を渡さない。返った `model` が空文字なら `sdd-cur-req-reviewer` を、空でないなら `sdd-cur-req-reviewer-high` を起動する。設計レビューと実装レビューの 1 回目と 2 回目は `model` を渡さない。3 回目から親が `model` に `grok-4.7-high` を渡す。

### 変更 sdd REQ-399

もとになった課題は #116 である。

`review-next` が返す `model` は変えない。1 回目と 2 回目は空文字である。3 回目以降は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。合格まで、空文字には戻さない。要求レビューでは、親は Task に `model` を渡さない。返った `model` が空文字なら `sdd-cur-req-reviewer` を、空でないなら `sdd-cur-req-reviewer-high` を起動する。`skills/sdd-cur/SKILL.md` は、この文字列を要求レビューの分岐の散文として書かない。設計レビューと実装レビューでは、返った `model` が空でないとき、その文字列をレビュー役の model に渡す。

### 追加 sdd REQ-804

もとになった課題は #116 である。

`skills/` と `agents/` の本文に `bun src/cli.ts` は無い。CLI を呼ぶ文のコマンドは `sdd-cur` である。サブコマンドがある呼び出しは、`sdd-cur` のあとに空白一つと、そのサブコマンドを続ける。引数がある呼び出しは、その引数を続ける。サブコマンドも引数も無い呼び出しは、`sdd-cur` である。

### 追加 sdd REQ-805

もとになった課題は #116 である。

`skills/sdd-cur-create-issue/SKILL.md` は、「`sdd-cur` では課題を作らない。」と書く。

### 追加 sdd REQ-806

もとになった課題は #116 である。

このリポジトリ以外の git リポジトリでも、`sdd-cur` にパスが通っていれば、着手、要件、設計、確認、回答、完了、quick の各段は、CLI を `sdd-cur` で呼ぶ。

### 追加 sdd REQ-807

もとになった課題は #116 である。

CLI を実行するスキルは、`skills/sdd-cur/SKILL.md`、`skills/sdd-cur-quick/SKILL.md`、`skills/sdd-cur-complete/SKILL.md`、`skills/sdd-cur-implement/SKILL.md` である。`sdd-cur` が見つからないときは、`bun add -g @paterapatera/sdd-cur` を含む一行を伝える。伝えたあと、スキルは止まる。止まったあと、`sdd-cur` を実行しない。

### 追加 sdd REQ-810

もとになった課題は #116 である。

要求レビューの中級のファイルは `agents/sdd-cur-req-reviewer.md` である。frontmatter の `name` は `sdd-cur-req-reviewer` である。frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。要求レビューの上級のファイルは `agents/sdd-cur-req-reviewer-high.md` である。frontmatter の `name` は `sdd-cur-req-reviewer-high` である。frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` であり、`reviewModelFromRound3` と一文字も違わない。上級のレビューの見方は、中級と同じである。違うのは、frontmatter の `name` と `model` と、上級であることの表示である。上級であることの表示は、frontmatter の description の先頭の `上級である。` と、本文の最初の文 `あなたは sdd-cur の上級の要求レビュー役である。` である。上級の frontmatter の `readonly` は `true` であり、中級と同じである。

### 追加 install REQ-808

もとになった課題は #116 である。

このリポジトリで `bun link` を実行したあと、`sdd-cur` は手元の `src/cli.ts` を実行する。`bin.sdd-cur` は `src/cli.ts` のままである。`src/cli.ts` の先頭行は `#!/usr/bin/env bun` のままである。開発時の `bun src/cli.ts` は残す。

### 追加 install REQ-809

もとになった課題は #116 である。

`install` は、スキルをコピーする。スキル本文を書き換えない。コピーした版をスキルの横に記録しない。実行中の `sdd-cur` の版が違っても、スキルは知らせない。版の記録と、版が違うときの通知は、採用しない。
