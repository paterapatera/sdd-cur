# 91 レビューの判定と回数の数え方をコードに移し、スキルを短くする

<!-- sdd-cur:form -->

対象は [Issue #91](https://github.com/paterapatera/sdd-cur/issues/91)。レビュー応答から次の動作を選ぶ分岐を、テストされたコードへ移す。スキルは、レビュー応答をそのコードへ渡し、返った JSON に従う。

規則そのものは変えない。次の動作と、次のレビューのモデルは、今のスキルの分岐と同じである。重なる課題は #83 と #92 である。#92 の、実装レビューの止まり方を変える変更はしない。設計 43 の判定の読み方と、設計 45 の同じ指摘の止まりは、このコマンドの中へ移す。`docs/specs/43/design.md` と `docs/specs/45/design.md` は書き換えない。

## 受け入れ条件

- 1. 条件: `bun src/cli.ts review-next <段階の種別> <番号>` を、決定の節の正しい標準入力で実行する 主体: `src/cli.ts` 結果: `<段階の種別>` は `requirements`、`reflect-design`、`quick`、`implement` のいずれか一つであり、終了コードは 0 であり、標準出力は JSON の一行と末尾の改行一つである
- 2. 条件: 第1引数がその四つ以外である、または第1引数が無い 主体: `src/cli.ts` 結果: 終了コードは 1 であり、標準エラーは `段階の種別が不正です` の一行であり、標準出力は空である
- 3. 条件: 成功した 主体: `reviewNext` 結果: 一行 JSON は適用後の `consecutiveFailures`、`previousFindings`、`brokenStampRetries`、`action`、`model`、`kind` を含み、`action` は `修正`、`やり直し`、`合格`、`止まる` のいずれか一つであり、`reason` は人に見せる理由を返す分岐だけ、`resultLine` は quick が `決められない` で止まるときだけ、`rewriteProcedure` は implement が書き直すかを決める分岐だけ含む
- 4. 条件: 同じ `action` で分岐が違う 主体: `reviewNext` 結果: `kind` が違い、値は決定の節に列挙した空でない camelCase である
- 5. 条件: 第1引数が `requirements` である 主体: `reviewNext` 結果: 判定行と確認行は `parseReview` と同じであり、要求と設計の表の `action`、`kind`、回数、`previousFindings`、`brokenStampRetries`、`model` になる
- 6. 条件: 第1引数が `reflect-design` である 主体: `reviewNext` 結果: 確認行が `確認: なし` のとき `kind` は `stopReflectDesignNoFix` で `action` は `止まる` であり、それ以外は要求と設計の表と同じである
- 7. 条件: 第1引数が `quick` である 主体: `reviewNext` 結果: 最後の非空行が `判定: 合格` でも `判定: 不合格` でもないとき、および不合格で確認行が `確認: あり` でも `確認: なし` でもないときは、`action` が `止まる` で `resultLine` が `決められない` であり、判定行が無いときの 1 回のやり直しはしない
- 8. 条件: 第1引数が `implement` であり、`consecutiveFailures` が 0 以上 9 以下の整数である 主体: `reviewNext` 結果: 確認行では分岐せず、`実装の指摘なし` と `成否が分からない` と `テスト節の実行省略` または `実行していない` の有無で実装の表になり、`previousFindings` は入力のままである
- 9. 条件: 次のレビューの回が、その回の数え方で 1 または 2 である 主体: `reviewNext` 結果: `model` は空文字である。回が 3 以上のとき `model` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である
- 10. 条件: `review-next` を実行する 主体: `src/cli.ts` 結果: `gh` を起動せず、作業ツリーのファイルと課題コメントへ回数も直前の指摘も残さず、課題コメントから読まない
- 11. 条件: 三つのスキルが次の `review-next` を呼ぶ 主体: `skills/sdd-cur/SKILL.md` と `skills/sdd-cur-quick/SKILL.md` と `skills/sdd-cur-implement/SKILL.md` 結果: 標準入力の `consecutiveFailures`、`previousFindings`、`brokenStampRetries` は、直前の成功の標準出力の同じプロパティである
- 12. 条件: 比較に使う本文を `response` から取る 主体: `extractFindings` 結果: 決定の節の指摘の塊の取り方と一文字も違わない
- 13. 条件: 三つのスキルの、レビュー応答から次の動作を選ぶ段落である 主体: その三つの `SKILL.md` 結果: 条件の散文を除き、四プロパティを `bun src/cli.ts review-next <段階の種別> <番号>` の標準入力へ渡すことと、返った `action`、`model`、`kind` と、その分岐が使う `reason`、`resultLine`、`rewriteProcedure` に従うことが書いてある
- 14. 条件: この三つ以外のスキル、および作成役、レビュー役、修正役のエージェントファイルである 主体: 実装 結果: 変えない
- 15. 条件: `skills/sdd-cur/SKILL.md` または `skills/sdd-cur-quick/SKILL.md` で `validate` の終了コードが 0 以外である 主体: そのスキル 結果: レビュー役を起動せず、標準エラーの全文をその段の修正役に渡し、`review-next` へは渡さない。`skills/sdd-cur-implement/SKILL.md` は `validate` を実行しない
- 16. 条件: `src/cli.ts` のサブコマンドの列挙を書く 主体: `docs/policy.md` と `AGENTS.md` と `README.md` 結果: 各列挙が `review-next` を含む
- 17. 条件: 分岐と失敗と三つのスキルの契約を確かめる 主体: `src/91.test.ts` 結果: `bun:test` の `describe` と `test` で確かめ、`gh` を起動せず、ホームディレクトリと実行中の Cursor のスキルを触らない
- 19. 条件: 第1引数が `implement` であり、標準入力のほかは決定の形であり、`consecutiveFailures` が 10 以上の整数である 主体: `src/cli.ts` 結果: 終了コードは 1 であり、標準エラーは `連続不合格の回数が不正です` の一行であり、標準出力は空であり、成功の一行 JSON は無く、使い方は書かない

## 範囲外

次は作らない。

- 分岐の規則を変えること。実装レビューの止まり方を変えること（#92）。10 回の打ち切りの回数を変えること。同じ指摘が 2 回連続したときの止まりを変えること。モデル名を変えること
- 判定行と確認行の読み方を変えること。`parseReview` の結果を変えること
- 作成役、レビュー役、修正役の役割と、`agents/*.md`
- `skills/sdd-cur/SKILL.md`、`skills/sdd-cur-quick/SKILL.md`、`skills/sdd-cur-implement/SKILL.md` 以外のスキル。`skills/sdd-cur-fix/SKILL.md` を含む
- #83 の、ドキュメントとスキルのずれを直す作業。このサブコマンドを、サブコマンドの列挙へ足すことだけは、この設計に含める
- `printUsage` の変更。`src/cli.test.ts` と `src/package.test.ts` の使い方の期待文字列。`restore` が使い方に無い現状は、この課題では直さない
- レビュー役がテスト節を実行することの変更。実行すべき記述、失敗、`readonly: true` の段落
- 列挙された点と、修正へ渡す差分を、コードが切り出すこと。スキルが今どおりレスポンスから渡す
- `src/runner.ts`、`src/agent.ts`、`src/run.ts`、`src/github.ts`、`src/sdd.ts`、`src/git.ts`、`src/labels.ts`、`src/install.ts`、`src/complete.ts`、`src/restore.ts` の変更。`src/cli.ts` は、ある関数を呼ぶだけである
- `docs/conventions.md` の「レビューの判定」。課題コメントの印。ラベル。課題の作成とクローズ。確認コメントの投稿。受け入れ手順。完了処理
- `package.json`。依存パッケージ。トークンと環境変数の読み取り
- この課題以外の `docs/specs/` の要件と設計
- Forgejo、Jira、Backlog

## 決定

| 項目 | 内容 |
|---|---|
| コマンド | `review-next`。`src/cli.ts` の `switch` の `restore` の次に `case` を足す |
| 呼び出し | `bun src/cli.ts review-next <段階の種別> <番号>` |
| 段階 | `requirements`、`reflect-design`、`quick`、`implement`。この四つ以外、または第1引数が無いときは、終了コード 1、標準エラーは `段階の種別が不正です` の一行、標準出力は空。使い方は書かない |
| 番号 | 第2引数は番号である。番号は分岐に使わない。ファイルも課題も読まない |
| 関数 | `src/conventions.ts` の `extractFindings` と `reviewNext`。同期である。ファイルを読まない。`gh` を呼ばない。`parseReview` を、下の段階から呼ぶ |
| 状態 | 呼び出しのあいだ、作業ツリーにも課題コメントにも残さない。次の標準入力の三つは、直前の成功の標準出力の同じプロパティである |
| モデル定数 | `grok-4.7[context=256k,reasoning_effort=high,fast=false]`。渡さないときは空文字。これ以外の文字列は返さない |
| 固定項目だけの JSON | 採用しない。常に六つ。`reason`、`resultLine`、`rewriteProcedure` は、その分岐が使うときだけ足す |
| テストの置き場 | 新しく足す `test` は `src/91.test.ts` だけである。既存ファイルへ新しい `test` は足さない |

標準入力は、空白を除いたあと改行を含まない、JSON の一行である。プロパティは `response`、`consecutiveFailures`、`previousFindings`、`brokenStampRetries` である。この四つ以外のプロパティは無視する。`response` と `previousFindings` は文字列である。`consecutiveFailures` と `brokenStampRetries` は数である。

第1引数が `implement` であり、上の形を満たし、`consecutiveFailures` が 10 以上の整数のときは、終了コード 1、標準エラーは `連続不合格の回数が不正です` の一行、標準出力は空である。成功の JSON は書かない。使い方は書かない。応答は見ない。実装の表は見ない。`requirements`、`reflect-design`、`quick` では、`consecutiveFailures` が 10 以上の整数でも、この失敗にはしない。入力が 9 以下で、増やした回が 10 になる `stopImplementMaxReviews` は、この失敗ではない。成功の JSON を返す。

成功の標準出力は、次の順のプロパティを `JSON.stringify` した一行のあと、改行一つである。標準エラーは空である。`consecutiveFailures`、`previousFindings`、`brokenStampRetries`、`action`、`model`、`kind`。使うときだけ、この順で `reason`、`resultLine`、`rewriteProcedure` を足す。

`model` の回は、1 から数える。回が 1 または 2 のとき空文字、3 以上のときモデル定数である。回数を増やさないやり直しでは、入力の `consecutiveFailures` に 1 を足した回である。`action` が `修正` のとき、および `rewriteProcedure` が `true` のときは、返した `consecutiveFailures` に 1 を足した回である。`requirements` と `reflect-design` の `stopWaitConfirm` は、入力の `consecutiveFailures` に 1 を足した回であり、人が答えたあとの再起動が使う。それ以外で次のレビューを起動しないときは、空文字である。quick の `stopQuickConfirmListed` は再起動しないので、空文字である。

`requirements` は、要求のレビュー、設計のレビュー、回答の反映先が requirements のあとのレビューである。`reflect-design` は、回答の反映先が design のあとである。`quick` は、quick の要求のレビューと設計のレビューである。`implement` は、実装のレビューである。各段の開始時、`consecutiveFailures` は 0、`previousFindings` は空文字、`brokenStampRetries` は 0 である。要求の段の三つを設計の段へ渡さない。設計の段の三つを要求の段へ渡さない。実装の回数は、一回の agent 起動の中だけであり、ランナーが `implement` を再試行しても引き継がない。

`requirements`、`reflect-design`、`implement` の判定と確認は、`parseReview` の戻り値である。読み方は変えない。判定がある応答のあと、返した `brokenStampRetries` は 0 である。判定が無く入力の `brokenStampRetries` が 0 のときは 1 である。判定が無く入力が 1 以上のときは、入力のままである。

quick の判定は、最後の非空行である。非空行は、空白を除くと長さが 1 以上の行であり、比べるのは空白を除く前の行である。その行が `判定: 合格` または `判定: 不合格` と一文字も違わないときだけ、その判定である。確認は、その行が `判定: 不合格` のときだけ、`parseReview` の `confirm` である。quick は `brokenStampRetries` を変えない。

比較に使う本文は `extractFindings` の戻り値である。改行は `\n` にそろえる。行全体が `## 指摘` である最初の行があるときは、その次の行から、次に行頭が `#` である行の直前までが塊である。その行が無いときは、行全体が `1. 指摘。` である最初の行の次から、次に行頭が `#` である行、行頭が `2. 直す箇所と` である行、または行頭が `2. パスごとの直す箇所` である行の、最初の行の直前までが塊である。どちらも無いときは、塊は空であり、戻り値は空文字である。

塊の中で、行頭の空白を除いたあとに十進の数字が一つ以上あり、その直後が `.` である行が、番号付きの行である。行全体が `1. 指摘。` である行は数えない。番号と `.` と、その直後に続く空白を除いた残りが、その行の本文である。本文が二つ以上のときは出現順に改行一つで連結する。一つだけのときはその本文だけである。末尾の改行は付けない。無いときは空文字である。塊に行全体が `指摘なし` と一文字も違わない行があるときは、番号付きの行は連結せず、空文字である。観点ごとの短い評価、差分、確認行、判定行は、この連結に入れない。

`previousFindings` が空文字のときは、直前が無い。空文字どうしは、同じ指摘の 2 回目にしない。

表は上から見て、最初に当てはまる行一つを使う。`cf` は `consecutiveFailures`、`pf` は `previousFindings`、`bsr` は `brokenStampRetries` である。`+1` は入力に 1 を足す。`in` は入力のまま。`extract` は `extractFindings(response)` である。`round(n)` は、n が 1 または 2 のとき空文字、3 以上のときモデル定数である。

### 要求と設計

第1引数は `requirements` である。判定が不合格の行は、`pf` が `extract`、`bsr` が 0 である。人が答えたあとに起動するレビューでないとき、`cf` は `+1` である。人が答えたあとに起動するレビューは、回数を増やさない。モデルは、`確認: あり` を返したそのレビューと同じである。再起動の応答が不合格のとき、返る `consecutiveFailures` は、`stopWaitConfirm` が返した値のままである。

| 条件 | action | kind | model | 追加 |
|---|---|---|---|---|
| 判定が無い。入力 `bsr` が 0 | `やり直し` | `retryBrokenStamp` | `round(入力 cf + 1)` | `cf` は `in`。`pf` は `in`。`bsr` は 1 |
| 判定が無い。入力 `bsr` が 1 以上 | `止まる` | `stopBrokenStampTwice` | 空文字 | `cf` は `in`。`pf` は `in`。`bsr` は `in` |
| 判定が合格 | `合格` | `passReview` | 空文字 | `cf` は `in`。`pf` は `in`。`bsr` は 0 |
| 不合格。確認が `確認: あり` | `止まる` | `stopWaitConfirm` | `round(入力 cf + 1)` | 失敗の共通 |
| 不合格。確認が `確認: なし`。直前が無いか、本文が直前と違う | `修正` | `fixAfterReview` | `round(返した cf + 1)` | 失敗の共通 |
| 不合格。確認が `確認: なし`。直前が空でなく、本文が直前と同じ | `止まる` | `stopSameFindingTwice` | 空文字 | 失敗の共通 |
| 不合格。確認が無い | `止まる` | `stopMissingConfirmLine` | 空文字 | 失敗の共通 |

`reason`、`resultLine`、`rewriteProcedure` は付けない。

### 回答の反映先が設計のあと

第1引数は `reflect-design` である。上の表の `retryBrokenStamp`、`stopBrokenStampTwice`、`passReview`、`stopWaitConfirm`、`stopMissingConfirmLine` は、同じ条件で同じ戻り値である。確認が `確認: なし` のときは、本文が同じかどうかを見ない。`action` は `止まる`、`kind` は `stopReflectDesignNoFix`、`model` は空文字、`pf` は `extract`、`bsr` は 0 である。人が答えたあとに起動するレビューでないとき、`cf` は `+1` である。人が答えたあとに起動するレビューは、回数を増やさない。`fixAfterReview` と `stopSameFindingTwice` は返さない。

### quick

第1引数は `quick` である。`bsr` はどの行でも `in` である。最後の非空行が不合格の行は、`cf` が `+1`、`pf` が `extract` である。合格の行と、どちらでもない行は、`cf` が `in`、`pf` が `in` である。

| 条件 | action | kind | model | resultLine |
|---|---|---|---|---|
| 最後の非空行が合格でも不合格でもない | `止まる` | `stopQuickUndecidable` | 空文字 | `決められない` |
| 不合格。確認が `確認: あり` | `止まる` | `stopQuickConfirmListed` | 空文字 | `決められない` |
| 不合格。確認が `確認: あり` でも `確認: なし` でもない | `止まる` | `stopQuickInvalidConfirm` | 空文字 | `決められない` |
| 不合格。確認が `確認: なし`。直前が無いか、本文が直前と違う | `修正` | `fixAfterReview` | `round(返した cf + 1)` | 付けない |
| 不合格。確認が `確認: なし`。直前が空でなく、本文が直前と同じ | `止まる` | `stopSameFindingTwice` | 空文字 | 付けない |
| 最後の非空行が合格 | `合格` | `passReview` | 空文字 | 付けない |

`reason` と `rewriteProcedure` は付けない。`retryBrokenStamp` と `stopBrokenStampTwice` は返さない。

### 実装

第1引数は `implement` である。入力の `consecutiveFailures` が 10 以上の整数のときは、上の失敗であり、下の表は使わない。表は、入力の `consecutiveFailures` が 0 以上 9 以下の整数のときだけ使う。確認では分岐しない。`pf` はどの行でも `in` である。実装の指摘が無いことは、`response` に `実装の指摘なし` が含まれることである。手順未網羅は、`response` に `成否が分からない` が含まれることである。文字列 `手順未網羅` の有無だけでは決めない。実行省略は、`response` に `テスト節の実行省略` または `実行していない` が含まれることである。実行省略だけとは、不合格であり、実装の指摘が無く、手順未網羅が無く、実行省略があることである。サブコマンドはテストを実行しない。

合格の行には `rewriteProcedure` を付けない。それ以外の行には付ける。`true` は親が同じパスの手順本文を書き直す。`false` は書き直さない。合格のあと、手順本文が実装と合わないときだけ書き直す判断は、このプロパティに含めない。

| 条件 | action | kind | model | cf | bsr | rewriteProcedure | reason |
|---|---|---|---|---|---|---|---|
| 判定が無い。入力 `bsr` が 0 | `やり直し` | `retryBrokenStamp` | `round(入力 cf + 1)` | `in` | 1 | `false` | 付けない |
| 判定が無い。入力 `bsr` が 1 以上 | `止まる` | `stopImplementNoJudgment` | 空文字 | `in` | `in` | `false` | `レビューの判定がありません` |
| 判定が合格 | `合格` | `passReview` | 空文字 | `in` | 0 | 付けない | 付けない |
| 実行省略だけ | `やり直し` | `retryTestOmissionOnly` | `round(入力 cf + 1)` | `in` | 0 | `false` | 付けない |
| 不合格。実装の指摘が無い。手順未網羅が無い。実行省略が無い。入力 `cf` が 9 以下 | `やり直し` | `retryImplementAmbiguousFail` | `round(入力 cf + 1)` | `in` | 0 | `false` | 付けない |
| 上に当てはまらない不合格で、`cf` を `+1` した値が 10 | `止まる` | `stopImplementMaxReviews` | 空文字 | `+1` | 0 | `false` | `実装レビューが不合格のまま10回に達した` |
| 上に当てはまらない不合格で、`cf` を `+1` した値が 9 以下。`実装の指摘なし` が無い | `修正` | `fixAfterReview` | `round(返した cf + 1)` | `+1` | 0 | `false` | 付けない |
| 上に当てはまらない不合格で、`cf` を `+1` した値が 9 以下。`実装の指摘なし` があり、`成否が分からない` がある | `やり直し` | `rewriteProcedureThenReview` | `round(返した cf + 1)` | `+1` | 0 | `true` | 付けない |

実行省略だけは、回数を増やす行より前に見る。入力 `cf` が 9 で判定が無い 1 回目のあとの 2 回目が、実行省略だけ、または実装の指摘なしだけのときは、10 の行に入らない。2 回目も判定が無いときは `stopImplementNoJudgment` である。2 回目が合格のときは `passReview` である。2 回目が、実行省略だけでも実装の指摘なしだけでもない不合格のときは、`cf` が 10 になり `stopImplementMaxReviews` である。

## 文書

`docs/policy.md` の、1 列目が `` `src/cli.ts` `` の行の役割に、`restore` のあとに `review-next` を同じ並びで足す。ほかのセルは変えない。

`AGENTS.md` の「コマンド」のコードフェンスで、`bun test` の直前に次の一行を足す。ほかの行は変えない。

```sh
bun src/cli.ts review-next <requirements|reflect-design|quick|implement> <番号>
```

`README.md` の「開発中の起動」のコードフェンスにも、同じ一行を `bun test` の直前に足す。そのあとの表で、`bun test` の行の直前に次を足す。ほかの行は変えない。

| コマンド | すること |
|---|---|
| `review-next` | レビュー応答と連続不合格と直前の指摘から、次の動作を JSON 一行で返す |

`src/docs.test.ts` へ新しい `test` は足さない。今の一覧の test が、switch と三つの列挙の集合の一致を見る。

## スキル

変えるファイルは三つだけである。フロントマターは変えない。足す文は一文を一行にする。次の動作を、判定行、確認行、回数、直前の本文、モデルの上げ方から選ぶ段落は除く。合格のあとの案内、`validate`、質問、作業ブランチ、テスト節の実行、禁止は残す。

三つのスキルに共通する文は、次である。段の開始時の三つは、その段の中だけ覚える。ファイルにも課題コメントにも残さない。

```
レビュー役のレスポンスを受け取ったら、`response`、`consecutiveFailures`、`previousFindings`、`brokenStampRetries` を `bun src/cli.ts review-next <段階の種別> <番号>` の標準入力へ、JSON 一行で渡す。
返った一行 JSON の `action`、`model`、`kind` に従う。
その分岐が `reason`、`resultLine`、`rewriteProcedure` を含むときは、そのプロパティにも従う。
次に `review-next` を呼ぶとき、`consecutiveFailures`、`previousFindings`、`brokenStampRetries` は、直前の成功の標準出力が返した同じプロパティである。
`response` は、その呼び出しで判定するレビュー応答の全文である。
`model` が空文字のときは、レビュー役に model を渡さない。
空でないときは、その文字列をレビュー役の model に渡す。
修正役と作成役には、model を渡さない。
```

`<段階の種別>` は、その段の引数に置き換える。

`action` が `修正` のとき、修正役を起動する。差分だけを渡す。作成役は起動しない。修正のあと、レビューに戻る。`action` が `やり直し` のとき、レビュー役をもう一度起動する。修正役も作成役も起動しない。`rewriteProcedure` が `true` のときは、その起動の前に、親が同じパスの手順本文を書き直す。`action` が `合格` のとき、修正役も作成役も起動しない。合格のあとの案内は、今のその段の合格のときと同じである。`action` が `止まる` のとき、修正役を起動しない。

### `skills/sdd-cur/SKILL.md`

「要件」では、`数えるレビューは、ファイルを書いたあとの最初と、修正のあとである。` から、確認行が無いときの `レスポンスを人に見せて止まる。` までを除き、共通の文と次を書く。第1引数は `requirements` である。開始時の三つは 0、空文字、0 である。`validate` の失敗はこの標準入力へ渡さない。`validate` をレビュー役の直前に実行する段落は残す。

`kind` が `stopWaitConfirm` のとき、列挙された点を人に見せる。確認コメントは投稿しない。人が答えるまで、その部分は要求へ書かない。人が答えたあとは、返った `model` でレビューを再び起動する。この再起動は回数を増やさない。モデルは、`確認: あり` を返したそのレビューと同じである。`kind` が `stopBrokenStampTwice`、`stopSameFindingTwice`、`stopMissingConfirmLine` のときは、レスポンスを人に見せて止まる。レビューにも修正にも戻らない。`action` が `修正` のとき、レビューに入る前に人が選んだ通常の回答を、人が決めた条件として渡す。要求作成役は起動しない。「作成から合格まで 1 回」の文は、要求作成役の再起動の隣に残す。括弧内のモデル表記は残す。

「設計」では、`回数、モデル、` で始まる段から、確認行が無いときの `レスポンスを人に見せて止まる。` までを除く。第1引数は `requirements` である。開始時の三つは、要件の段とは別に 0、空文字、0 である。`stopWaitConfirm` で人が答えるまで書かない先は、設計である。合格の案内は、今の設計の合格のままである。`validate` の段落は残す。

「回答」では、反映した側の判定行をスキルが読む段落を除く。反映先が requirements のとき、第1引数は `requirements` であり、要件の節のレビューの段全体である。反映先が design のとき、第1引数は `reflect-design` である。`validate` の段落、反映が失敗したときにレビューを起動しないこと、合格まで設計の作成手順と設計の修正手順を続けないこと、合格のあとの案内は残す。`確認: なしでも、設計の修正役は起動しない。` は残す。`reflect-design` で `action` が `止まる` のとき、レスポンスを人に見せ、設計の修正役は起動しない。`kind` が `stopWaitConfirm` の再起動は、設計の節と同じである。

### `skills/sdd-cur-quick/SKILL.md`

要求の段と設計の段のどちらも、第1引数は `quick` である。開始時の三つは段ごとに 0、空文字、0 であり、要求の段の三つを設計の段へ渡さない。回数、モデル、最後の非空行、`確認: あり` で再開しないこと、確認が二択でないことを、スキルの条件としては書かない。`validate` の段落は残す。質問を使わないこと、軽微でないこと、作業ブランチを用意しないこと、業務ラベルが「実装中」であることを止めないことは残す。

`resultLine` があるとき、結果ファイルの最初の非空行はその文字列である。`kind` が `stopQuickConfirmListed` のとき、列挙された点を 2 行目以降に書く。修正は起動しない。再レビューはしない。`confirm` は実行しない。要求の段で `action` が `合格` のとき、人へ設計に進めるとは伝えて終わらない。同じ agent の起動の中で、設計の段へ進む。設計の段で `action` が `合格` のとき、結果ファイルの最初の非空行は `続行` である。人へ実装依頼に進めるとは伝えない。

### `skills/sdd-cur-implement/SKILL.md`

第1引数は `implement` である。開始時の三つは 0、空文字、0 である。この一回の agent 起動の中だけ覚える。`validate` は実行しない。テスト節の実行、`readonly: true`、失敗の定義、受け入れ条件が無いときの段落は残す。回数、判定行の探し方、実行省略だけの条件、10 回の条件、モデルを上げる条件は除く。

`reason` があるとき、その文字列を失敗の理由にする。agent は失敗で終える。手順本文は、`rewriteProcedure` が `true` のときだけ、レビューへ戻る前に書き直す。印の行は書かない。書き直した本文は、受け入れ条件を一通り確かめられるものとする。`action` が `合格` のとき、修正役は起動しない。手順本文が実装と合わないときだけ、親が同じパスの本文を書き直す。この書き直しのあとにはレビューへ戻らない。成功で終える前の本文は、空でなく、最初の非空行は印ではない。不合格のあと、実装作成役は起動しない。

## 既存の文言テスト

新しい `test` は足さない。配列から除く文言は、除いた段落にだけあったものである。残す段落の文言は、配列に残す。

`src/sdd-skill-sdd-cur.test.ts` の必須文言から除くのは、`下から`、`行全体`、`あと 1 回`、`合計最大 2 回`、`印が壊れている`、`番号付き指摘`、`2 回連続`、`直前の不合格レビュー` である。要件の節と設計の節の両方に求める配列から除くのは、`番号付き指摘` と `2 回連続` である。`修正を起動しない` は残す。`最後の非空行` が無いことは残す。

`src/runner-skill-sdd-cur-implement.test.ts` の必須文言から除くのは、`3回目`、`grok-4.7[context=256k,reasoning_effort=high,fast=false]`、`実装レビューが不合格のまま10回に達した`、`レビューの判定がありません`、`下から`、`行全体`、`あと 1 回`、`合計最大 2 回`、`印が壊れている`、`確認: あり`、`確認: なし`、`では分岐しない` である。`実装の指摘なし`、`手順本文を書き直す`、`最初の非空行`、テスト節の実行の文言は残す。`最後の非空行が` が無いことは残す。

`src/runner-skill-sdd-cur-quick.test.ts` の必須文言から除くのは、`grok-4.7[context=256k,reasoning_effort=high,fast=false]` と `確認: あり` である。`決められない`、`続行`、`` `confirm` は実行しない `` は残す。

## 正本への差分

### 変更 docs REQ-713

サブコマンドの正は `src/cli.ts` の `main` にある `switch (sub)` の `case "..."` である。`default` は含めない。順は `install`、`run`、`labels`、`candidates`、`show`、`branch`、`confirm`、`close`、`reflect`、`validate`、`complete`、`restore`、`review-next` である。

### 変更 sdd REQ-327

比較は `src/conventions.ts` の `reviewNext` が行う。親は `bun src/cli.ts review-next` の戻り値に従う。`parseReview` の読み方は変えない。

### 変更 sdd REQ-399

3 回目から渡す `model` の文字列は、`review-next` が返す `model` である。値は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。1 回目と 2 回目の `model` は空文字である。合格まで、空文字には戻さない。`skills/sdd-cur/SKILL.md` は、この文字列をレビューの分岐の散文として書かない。返った `model` に従う。

### 変更 sdd REQ-401

`skills/sdd-cur/SKILL.md` の「設計」のレビューの次の動作は、第1引数 `requirements` の `review-next` に従う。回数とモデルの規則は、要求のレビューと同じである。

### 変更 sdd REQ-402

`skills/sdd-cur-implement/SKILL.md` の「レビュー」は、第1引数 `implement` の `review-next` に従う。3 回目からの `model` は、返った `model` が `grok-4.7[context=256k,reasoning_effort=high,fast=false]` であるとき、その文字列である。実装作成は `model` を渡さない。10 回の打ち切りは、`reason` が `実装レビューが不合格のまま10回に達した` のときである。

### 変更 sdd REQ-403

`skills/sdd-cur/SKILL.md` は、3 回目から渡すモデルの文字列を、分岐の散文に書かない。その文字列は `review-next` の `model` である。要求作成役の初回成果物作成を説明する括弧内のモデル表記は残す。`grok-4.7-high` は書かない。

### 変更 sdd REQ-404

`skills/sdd-cur-implement/SKILL.md` は、3 回目から渡すモデルの文字列を、分岐の散文に書かない。その文字列は `review-next` の `model` である。`grok-4.7-high` は書かない。失敗の理由の文字列は、スキルに書かず、`reason` で返す。

### 追加 conventions REQ-721

レビュー応答から次の動作を選ぶ関数は、`src/conventions.ts` の `reviewNext` である。同期関数である。ファイルを読まない。`gh` を呼ばない。入口は `bun src/cli.ts review-next <段階の種別> <番号>` である。段階は `requirements`、`reflect-design`、`quick`、`implement` である。

### 追加 conventions REQ-722

標準入力は、`response`、`consecutiveFailures`、`previousFindings`、`brokenStampRetries` の JSON 一行である。成功の標準出力は、適用後のこの三つと `action`、`model`、`kind` の JSON 一行である。`reason`、`resultLine`、`rewriteProcedure` は、その分岐が使うときだけ含む。状態は作業ツリーにも課題コメントにも残さない。

### 追加 conventions REQ-723

`requirements` の `kind` は、判定が無くやり直しが 0 のとき `retryBrokenStamp`、判定が無くやり直しが 1 以上のとき `stopBrokenStampTwice`、合格のとき `passReview`、不合格で確認がありのとき `stopWaitConfirm`、不合格で確認がなしで指摘が違うとき `fixAfterReview`、指摘が同じとき `stopSameFindingTwice`、確認行が無いとき `stopMissingConfirmLine` である。判定と確認の読みは `parseReview` と同じである。

### 追加 conventions REQ-724

`reflect-design` は、`retryBrokenStamp`、`stopBrokenStampTwice`、`passReview`、`stopWaitConfirm`、`stopMissingConfirmLine` を `requirements` と同じ条件で返す。確認が `確認: なし` のときは `stopReflectDesignNoFix` であり、`action` は `止まる` である。設計の修正役は起動しない。

### 追加 conventions REQ-725

`quick` の判定は最後の非空行である。それが合格でも不合格でもないときは `stopQuickUndecidable` である。不合格で確認がありのときは `stopQuickConfirmListed` である。不合格で確認が二択でないときは `stopQuickInvalidConfirm` である。この三つの `action` は `止まる` であり、`resultLine` は `決められない` である。判定行が無いときの 1 回のやり直しはしない。`brokenStampRetries` は入力のままである。

### 追加 conventions REQ-726

`implement` は確認行で分岐しない。入力の `consecutiveFailures` が 10 以上の整数のときは、終了コード 1、標準エラーは `連続不合格の回数が不正です` の一行であり、成功の JSON は無い。応答は見ない。表は、入力が 0 以上 9 以下のときだけ使う。実行省略だけは `retryTestOmissionOnly` であり、回数は増やさない。実装の指摘が無く、手順未網羅が無く、実行省略が無く、入力の連続不合格が 9 以下のときは `retryImplementAmbiguousFail` であり、回数は増やさない。それ以外の不合格で増やした回数が 10 のときは `stopImplementMaxReviews` であり、`reason` は `実装レビューが不合格のまま10回に達した` である。入力が 9 以下で増やした回が 10 のこの止まりは、成功の JSON である。9 以下で実装の指摘があるときは `fixAfterReview` である。9 以下で実装の指摘が無く手順未網羅があるときは `rewriteProcedureThenReview` であり、`rewriteProcedure` は `true` である。判定が無い 2 回目は `stopImplementNoJudgment` であり、`reason` は `レビューの判定がありません` である。実装の指摘が無いことは `実装の指摘なし`、手順未網羅は `成否が分からない`、実行省略は `テスト節の実行省略` または `実行していない` が応答に含まれることである。

### 追加 conventions REQ-727

次のレビューの 1 回目と 2 回目の `model` は空文字である。3 回目以降は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。回数を増やさないやり直しの `model` は、その数えるレビューと同じである。`action` が `修正` のときの `model` は、修正のあとに起動する次のレビューのモデルである。修正役と作成役には渡さない。

### 追加 conventions REQ-728

比較に使う番号付き指摘の本文は `extractFindings` が返す。`## 指摘` の節、または `1. 指摘。` の次から次の見出しもしくは差分の見出しの手前までを塊とする。番号付きの行の本文を出現順に改行で連結する。行全体が `指摘なし` のときは空文字である。`implement` が返す `previousFindings` は入力のままである。

## テスト

`bun test` で実行する。`reviewNext` と `extractFindings` には文字列を渡す。`gh` は起動しない。一時ディレクトリは、この課題のテストでは使わない。

- `src/91.test.ts` は、四つの段階の成功が終了コード 0 であり、標準出力が JSON 一行と改行一つであることを確かめる。[1][3]
- 第1引数が四つ以外のとき、および第1引数が無いとき、終了コード 1、標準エラーが `段階の種別が不正です` の一行、標準出力が空であることを確かめる。[2]
- 成功の JSON を解釈し、六つのプロパティがあること、`action` が四つのいずれかであること、`reason` と `resultLine` と `rewriteProcedure` が決定の節で付ける行にだけあることを確かめる。[3][4]
- `requirements` の表の各行を、判定の位置、確認の位置、直前が空のとき、直前と同じとき、直前と違うとき、`brokenStampRetries` が 0 のときと 1 のときで確かめる。後ろに非空行があっても `parseReview` と同じ判定であることを確かめる。[5][9][12]
- `reflect-design` で確認が `確認: なし` のとき、本文が同じでも違っても `stopReflectDesignNoFix` であり、ほかの行が要求と設計の表と同じであることを確かめる。[6]
- `quick` で、最後の非空行が判定でないとき、不合格で確認が二択でないとき、`確認: あり` のとき、`確認: なし` の同じ指摘と違う指摘のとき、合格のときを確かめる。`brokenStampRetries` が入力のままであることを確かめる。[7][9]
- `implement` で、実行省略だけ、実装の指摘なしだけ、手順未網羅、指摘がある不合格、回が 10、判定が無い 1 回目と 2 回目、合格、入力の回が 9 の 2 回目が実行省略だけまたは実装の指摘なしだけのときを確かめる。`previousFindings` が入力のままであることを確かめる。`rewriteProcedure` が合格に無いことを確かめる。[8][9]
- 回が 1 と 2 の `model` が空文字であり、3 以上がモデル定数であることを、やり直し、修正のあと、`stopWaitConfirm`、quick の `stopQuickConfirmListed` で確かめる。[9]
- `review-next` の試験は `gh` を起動しない。戻り値をファイルと課題コメントへ書かない。[10][17]
- 三つのスキルに、四プロパティを標準入力へ渡す文、返った `action`、`model`、`kind` に従う文、次の呼び出しが返った三つを渡す文、それぞれの第1引数があることを確かめる。除くと決めた条件の段落が無いことを確かめる。[11][13][15]
- `extractFindings` が、`## 指摘` の塊、`1. 指摘。` の次の塊、`指摘なし`、番号付きが無い塊、空の応答で、決定の節の本文を返すことを確かめる。[12]
- `skills/sdd-cur-fix/SKILL.md` と `agents/` を、この課題のテストは変更しない。[14]
- `docs/policy.md` の `src/cli.ts` の行、`AGENTS.md` の「コマンド」、`README.md` の「開発中の起動」のフェンスと表に、`review-next` があることを確かめる。[16]
- 第1引数が `implement` であり、標準入力のほかは決定の形であり、`consecutiveFailures` が 10 と 11 のとき、終了コード 1、標準エラーが `連続不合格の回数が不正です` の一行、標準出力が空であり、成功の JSON が無いことを確かめる。応答が合格でも、実行省略だけでも、同じ失敗であることを確かめる。`consecutiveFailures` が 9 のとき、および第1引数が `implement` でないときは、この文言にしない。[19]
- 既存の `src/sdd-skill-sdd-cur.test.ts`、`src/runner-skill-sdd-cur-implement.test.ts`、`src/runner-skill-sdd-cur-quick.test.ts` は、既存の文言テストの節で除くと書いた文言だけを配列から除き、新しい `test` は足さない。[13][17]

## 作業の一覧

- 1. `extractFindings` と `reviewNext` を `src/conventions.ts` に足す。`parseReview` の結果は変えない。[3][4][5][6][7][8][9][12][19]
- 2. `src/91.test.ts` を、この設計のテスト節の期待で書く。[1][2][3][10][17][19]
- 3. `src/cli.ts` に `review-next` を足す。`printUsage` は変えない。`gh` は呼ばない。[1][2]
- 4. `docs/policy.md`、`AGENTS.md`、`README.md` の列挙に `review-next` を足す。[16]
- 5. `skills/sdd-cur/SKILL.md`、`skills/sdd-cur-quick/SKILL.md`、`skills/sdd-cur-implement/SKILL.md` を、この設計のスキルの節に合わせる。作成役、レビュー役、修正役と、この三つ以外のスキルは変えない。既存の三つの文言テストは、配列から除く文言だけを変える。[11][13][14][15][17]
- 6. この設計の `## 正本への差分` を、同じ作業ツリーの `docs/spec/` へ反映する。要求ファイルと設計ファイルは変えない。
- 7. `bun test` を実行する。[17]

## 実装の順序

1. `extractFindings` と `reviewNext` を `src/conventions.ts` に足す。`parseReview` の結果は変えない。
2. `src/91.test.ts` に、上の分岐、失敗、スキルの契約、文書の列挙を書く。
3. `src/cli.ts` に `review-next` を足す。`printUsage` は変えない。`gh` は呼ばない。
4. `docs/policy.md`、`AGENTS.md`、`README.md` の列挙に `review-next` を足す。
5. 三つの `SKILL.md` を、スキルの節に合わせる。既存の三つの文言テストは、配列から除く文言だけを変える。
6. 正本への差分を `docs/spec/` へ反映する。要求ファイルと設計ファイルは変えない。
7. `bun test` を実行する。

## 関係する課題

- #43 判定行と確認行の読み方。`parseReview` は変えない
- #45 同じ指摘が 2 回連続したときの止まり。比べる本文の取り方は、この設計の `extractFindings` である
- #83 サブコマンドの列挙。この課題が足すのは `review-next` だけである
- #92 実装レビューの止まり方。この設計は変えない
