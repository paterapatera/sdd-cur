# 169 レビューのループの手順を共通のファイルにまとめる

<!-- sdd-cur:form -->

対象は [Issue #169](https://github.com/paterapatera/sdd-cur/issues/169)。`review-next` を使うレビューのループの手順を `skills/sdd-cur/review-loop.md` に一度だけ書き、各段はそのファイルを参照して段の値だけを書く。#168 を反映した段ファイルを前提とする。#168 は本課題の前に行う。

重なる課題は #168、#91、#116、#171 である。

## 受け入れ条件

- 1. 条件: 本要件を実装した 主体: `skills/sdd-cur/review-loop.md` 結果: ファイルがある。`review-next` を使うレビューのループの手順は、このファイルに一度だけ書く
- 2. 条件: 本要件を実装した 主体: `skills/sdd-cur/review-loop.md` 結果: 呼び出し側が差し込む値は、`review-next` の第1引数、レビュー役の名前、修正役の名前、レビューの前に `validate` を実行するか、段ごとの止まり、である。返った `model` の空文字でレビュー役の名前を切り替える段は、上級レビュー役の名前も差し込む
- 3. 条件: 本要件を実装した 主体: `skills/sdd-cur/review-loop.md` 結果: `response`、`consecutiveFailures`、`previousFindings`、`brokenStampRetries` を JSON 一行で `sdd-cur review-next` の標準入力へ渡すこと、返った `action`、`model`、`kind` に従うこと、分岐が `reason`、`resultLine`、`rewriteProcedure` を含むときはそのプロパティに従うこと、次の呼び出しの三つの値は直前の成功の標準出力の同じプロパティであること、`response` はその呼び出しで判定するレビュー応答の全文であること、を書く
- 4. 条件: 本要件を実装した 主体: `skills/sdd-cur/review-loop.md` 結果: `action` が `修正` のときは修正役を起動し、差分だけを渡し、作成役は起動せず、修正のあとレビューに戻る。`action` が `やり直し` のときはレビュー役をもう一度起動し、修正役も作成役も起動しない。`action` が `合格` のときは修正役も作成役も起動しない。`action` が `止まる` のときは修正役を起動しない。`validate` の失敗は、この標準入力へ渡さない。`validate` の失敗は連続不合格に数えない
- 5. 条件: 本要件を実装した 主体: `skills/sdd-cur/requirements.md` の `## 要件` 結果: `sdd-cur/review-loop.md` に従うと書き、共有のループの手順の文は繰り返さない。第1引数は `requirements`、レビュー役は `sdd-cur-req-reviewer`、上級レビュー役は `sdd-cur-req-reviewer-high`、修正役は `sdd-cur-req-fixer`、レビューの前に `validate` を実行する、である。要求レビュー役を起動するとき model は渡さない。返った `model` が空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する
- 6. 条件: 本要件を実装した 主体: `skills/sdd-cur/requirements.md` の `## 要件` 結果: `kind` が `stopWaitConfirm` の再起動は、返った `model` が空文字なら `sdd-cur-req-reviewer`、空でないなら `sdd-cur-req-reviewer-high` であり、回数を増やさない。`kind` が `stopBrokenStampTwice`、`stopSameFindingTwice`、`stopMissingConfirmLine` のときは、レスポンスを人に見せて止まり、修正を起動せず、レビューにも修正にも戻らない。`action` が `修正` のとき、レビューに入る前に人が選んだ通常の回答を、人が決めた条件として渡す扱いは残る。要求ファイルが無いときは `validate` を実行しない。要求作成役を起動する前には `validate` を実行しない
- 7. 条件: 本要件を実装した 主体: `skills/sdd-cur/design.md` の `## 設計` 結果: `sdd-cur/review-loop.md` に従うと書き、共有のループの手順の文は繰り返さない。第1引数は `requirements` のままである。レビュー役は `sdd-cur-design-reviewer`、修正役は `sdd-cur-design-fixer`、レビューの前に `validate` を実行する、である。`model` が空文字のときはレビュー役に model を渡さない。空でないときは、その文字列をレビュー役の model に渡す。上級レビュー役の名前では切り替えない
- 8. 条件: 本要件を実装した 主体: `skills/sdd-cur/design.md` の `## 設計` 結果: レスポンスに `課題全体が大きすぎる` と一文字も違わない行があるときは、返った `action` と `kind` には従わない。`分割案:` と一文字も違わない行があるときの止まりと、人に伝える一文と、その行が無いときに人の判断を待って止まること、は今のままである。`stopWaitConfirm` の再起動は、返った `model` で行い、回数を増やさない。モデルは、`確認: あり` を返したそのレビューと同じである。段の開始時の三つは、要件の段の三つとは別のままである。設計ファイルが無いときは `validate` を実行しない。設計作成役を起動する前には `validate` を実行しない
- 9. 条件: 本要件を実装した 主体: `skills/sdd-cur/reflect.md` の `## 回答` 結果: `sdd-cur/review-loop.md` に従うと書き、共有のループの手順の文は繰り返さない。側が `requirements` のとき、第1引数は `requirements` であり、レビュー役、上級レビュー役、修正役、model を渡さないこと、`validate` をレビューの前に実行することは、受け入れ条件 5 と同じである。要求ファイルが無いときは `validate` を実行しない。段ごとの止まりは、受け入れ条件 6 のうち、`kind` が `stopWaitConfirm` の再起動と、`kind` が `stopBrokenStampTwice`、`stopSameFindingTwice`、`stopMissingConfirmLine` のときと、`action` が `修正` のときに人が決めた条件を渡す扱いと、同じである。反映後のレビューは `requirements.md` の `## 要件` のレビューの段全体を参照すると書かない。反映後のレビューが合格になるまで、設計の作成役も設計の修正役も起動しない。`reflect` が失敗したときは、レビューを起動せず、`validate` も実行しない
- 10. 条件: 本要件を実装した 主体: `skills/sdd-cur/reflect.md` の `## 回答` 結果: `sdd-cur/review-loop.md` に従うと書き、共有のループの手順の文は繰り返さない。側が `design` のとき、第1引数は `reflect-design` である。レビュー役は `sdd-cur-design-reviewer`、修正役は `sdd-cur-design-fixer`、レビューの前に `validate` を実行する、である。`model` が空文字のときはレビュー役に model を渡さない。空でないときは、その文字列をレビュー役の model に渡す。上級レビュー役の名前では切り替えない。`design.md` の `## 設計` にある第1引数 `requirements` は、この段では使わない。`課題全体が大きすぎる` の止まり、分割案の止まり、`stopWaitConfirm` の再起動は、受け入れ条件 8 と同じである。`action` が `止まる` のとき、レスポンスを人に見せ、設計の修正役は起動しない
- 11. 条件: 本要件を実装した 主体: `skills/sdd-cur-quick/SKILL.md` の `## 要件` 結果: `sdd-cur/review-loop.md` に従うと書き、共有のループの手順の文は繰り返さない。第1引数は `quick`、レビュー役は `sdd-cur-req-reviewer`、上級レビュー役は `sdd-cur-req-reviewer-high`、修正役は `sdd-cur-req-fixer`、レビューの前に `validate` を実行する、である。要求レビュー役を起動するとき model は渡さない。返った `model` が空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する。`resultLine` と `stopQuickConfirmListed` の扱いは今のままである。`action` が `合格` のとき、同じ agent の起動の中で設計の段へ進む。`stopWaitConfirm` の再起動の三文は、この段に書かない。段の形の比較先に、`skills/sdd-cur/SKILL.md` の「要件」とは書かない。見出し `## 要件` の「違いは、次だけである」の箇条書きは残る
- 12. 条件: 本要件を実装した 主体: `skills/sdd-cur-quick/SKILL.md` の `## 設計` 結果: `sdd-cur/review-loop.md` に従うと書き、共有のループの手順の文は繰り返さない。第1引数は `quick`、レビュー役は `sdd-cur-design-reviewer`、修正役は `sdd-cur-design-fixer`、レビューの前に `validate` を実行する、である。`model` が空文字のときはレビュー役に model を渡さない。空でないときは、その文字列をレビュー役の model に渡す。上級レビュー役の名前では切り替えない。`resultLine` と `stopQuickConfirmListed` の扱いは今のままである。`action` が `合格` のとき、結果ファイルの最初の非空行は `続行` であり、人へ実装依頼に進めるとは伝えず、「実装依頼」は付けず、push しない。要求の段の三つは、設計の段へ渡さない。「設計の段の違いは、次だけである」の箇条書きは残る
- 13. 条件: 本要件を実装した 主体: `skills/sdd-cur-implement/SKILL.md` の `## レビュー` 結果: `sdd-cur/review-loop.md` に従うと書き、共有のループの手順の文は繰り返さない。第1引数は `implement`、レビュー役は `sdd-cur-implement-reviewer`、修正役は `sdd-cur-implement-fixer`、レビューの前に `validate` は実行しない、である。`model` が空文字のときはレビュー役に model を渡さない。空でないときは、その文字列をレビュー役の model に渡す。上級レビュー役の名前では切り替えない。`rewriteProcedure`、`reason`、レビュー役の起動より前の「テスト」節の実行、`sdd-cur spec-diff <番号>` は、このスキルに残る。段の開始時の三つは、この一回の agent 起動の中だけ覚え、再試行へは引き継がない。確認行では分岐しない
- 14. 条件: 本要件を実装した 主体: 各段のスキル 結果: 今その段が扱う `action` と `kind` の扱いは残る。今その段に無い `kind` の扱いを、その段へ足さない。サブエージェントの名前は今のままである。model を渡す段と渡さない段は、今のままである
- 15. 条件: 本要件を実装した 主体: `skills/sdd-cur/SKILL.md` 結果: 段の一覧の七つは今のままである。`review-loop.md` は段の一覧に入れない。frontmatter の `name`、`description`、`disable-model-invocation` は今のままである
- 16. 条件: 本要件を実装した 主体: `skills/sdd-cur/review-loop.md` と、本要件で本文を変えるスキルのファイル 結果: 一文を一行に書く。`skills/sdd-cur-quick/SKILL.md` と `skills/sdd-cur-implement/SKILL.md` は、フロントマターの閉じ `---` の次の行から末尾まで、一文を一行である
- 17. 条件: 本要件を実装した 主体: `src/install.ts` 結果: ディレクトリを再帰的にコピーする処理は今のままである。`skills/sdd-cur/review-loop.md` は `skills/sdd-cur/` の中にあり、そのコピーで導入先の `sdd-cur/review-loop.md` になる
- 18. 条件: この課題の設計を書いた 主体: この課題の設計 結果: まとめる前の各段のループの値と止まりを、まとめたあとの参照と値に対応させた一覧がある。第1引数が `requirements` のままの設計の段、第1引数が `reflect-design` の回答の設計側、第1引数が `quick` の quick、第1引数が `implement` の実装、レビューの前に `validate` を実行する段と実行しない段、model を渡す段と渡さない段、が一覧にある
- 19. 条件: 受け入れ条件 18 の一覧 主体: 各段のスキル 結果: 一覧の各段のループの挙動は、まとめる前と同じである
- 20. 条件: 新しい `test` を足す 主体: 実装 結果: `src/169.test.ts` だけに書く。既存の `src/*.test.ts` に新しい `test` を足さない
- 21. 条件: 本要件で本文を変えるファイルの本文を文字列で確かめている `src/*.test.ts` 主体: この課題の設計 結果: どの期待をどう直すかを決める。直したテストは、移したあとの本文を確かめる。`review-next` の入出力を確かめる期待は直さない
- 22. 条件: 本要件で本文を変えないファイルの本文を文字列で確かめているテスト 主体: この課題の設計 結果: その期待は直さない
- 23. 条件: 本要件を実装した 主体: `docs/canonical/sdd.md` と `docs/canonical/implement.md` 結果: レビューのループの手順は `skills/sdd-cur/review-loop.md` に一度あり、各段は値を差し込んで従う、と書いてある。各段のループの意味と、`review-next` の入力と出力は、今の正本のままである。既存の `## REQ-` の識別子は変えない
- 24. 条件: 受け入れ条件 23 主体: この課題の設計 結果: `docs/canonical/sdd.md` と `docs/canonical/implement.md` への追加または変更を `## 正本への差分` に書く
- 25. 条件: `bun test` を実行する 主体: テスト 結果: `gh` を起動しない

## 範囲外

次は、この要件に含めない。

- `review-next` の入力と出力を変えること
- `src/conventions.ts` の `reviewNext` と、`src/cli.ts` の `review-next` を変えること
- 各段のループの挙動を変えること
- サブエージェントの名前を変えること
- model を渡すか渡さないかを変えること
- 今その段に無い `kind` の扱いを、その段へ足すこと
- `skills/sdd-cur/SKILL.md` の段の一覧の七つを変えること
- `review-loop.md` を段のファイルにすること
- `review-loop.md` を、`skills/sdd-cur/` 以外のディレクトリへ複製すること
- 既存スキルの frontmatter を変えること
- `src/install.ts` のコピー処理を変えること
- `docs/canonical/sdd.md` と `docs/canonical/implement.md` 以外の正本を変えること
- `docs/canonical/conventions.md` を変えること
- `docs/conventions.md` を変えること
- `docs/policy.md` を変えること
- `skills/sdd-cur/conventions.md` を変えること
- サブエージェントの手順を変えること
- `skills/sdd-cur-complete/SKILL.md`、`skills/sdd-cur-create-issue/SKILL.md`、`skills/sdd-cur-fix/SKILL.md`、`skills/sdd-cur-policy/SKILL.md` を変えること
- 各段の、レビューのループ以外の手順を変えること
- 合格のあとの案内、`sdd-cur gate`、`prepare-branch`、質問、確認コメントの手順を変えること
- ホームディレクトリと、実行中の Cursor のスキルへの `install`
- 課題の作成
- 課題を閉じること
- ラベルの変更
- 受け入れ手順
- 完了処理

## 決定

| 項目 | 内容 |
|---|---|
| 前提 | #168 反映後の段ファイルと quick・implement スキルが、レビューのループ手順を各所に重複して書いている状態である |
| 新規ファイル | `skills/sdd-cur/review-loop.md`。frontmatter は置かない。見出しは `## レビューのループ` 一つである |
| 読み方 | 各段は、ループに入る直前に第1引数・レビュー役・修正役・上級レビュー役（使う段だけ）・レビュー前の `validate` の有無を一行ずつ書き、`review-loop.md` の `## レビューのループ` を読んで従う。共有の `review-next` 入出力と `action` の四分岐と、三つの `stop*` の止まりは `review-loop.md` にだけ書く |
| `validate` | レビュー役の直前の `validate` と、失敗時の修正役への渡し方は、今どおり各段ファイルに残す。`validate` の失敗を `review-next` に渡さないことは `review-loop.md` に書く |
| 上級レビュー役 | 要求系の段だけ、ループ内の「`review-next` のあとのレビュー役の選び方」と `stopWaitConfirm` の再起動を `review-loop.md` に書く。設計系・実装は、返った `model` をレビュー役に渡すか渡さないかの分岐を `review-loop.md` に書く |
| 段固有 | 合格後の案内、ゲート、`課題全体が大きすぎる`、分割案、quick の `resultLine` と `stopQuickConfirmListed`、implement の `rewriteProcedure` と `reason` とテスト・`spec-diff`、reflect の側ごとの制約、要求の `action` が `修正` のときの人の回答、は各段に残す |
| 正本 | `docs/canonical/sdd.md` に REQ-957 を足し、REQ-319・REQ-320・REQ-376・REQ-399・REQ-401・REQ-403 の本文を直す。`docs/canonical/implement.md` の REQ-872 の本文を直す。識別子は変えない |

### `review-loop.md` に移す本文（要旨）

#168 後の各段から、次の意味の文を除き、一度だけ `review-loop.md` に置く。文言は #168 後の現行と同じ意味であり、一文を一行にそろえる。

- レビューの指摘はどこにも置かない。ファイルにも課題コメントにも残さない。
- 段の開始時、`consecutiveFailures` は 0、`previousFindings` は空文字、`brokenStampRetries` は 0 である。ファイルにも課題コメントにも残さない。（implement の「一回の agent 起動の中だけ」「再試行へ引き継がない」は implement スキルに残す）
- 呼び出し側が直前に書いた第1引数を使い、`sdd-cur review-next` の標準入力へ四つの値を JSON 一行で渡すこと、返った `action`、`model`、`kind` と、あるときの `reason`、`resultLine`、`rewriteProcedure` に従うこと、次の三つは直前の成功の標準出力の同じプロパティであること、`response` はその呼び出しのレビュー応答の全文であること
- `action` が `修正`・`やり直し`・`合格`・`止まる` のときの修正役・作成役の起動と戻り方（段固有の追加条件は各段に残す）
- `validate` の失敗はこの標準入力へ渡さない
- `kind` が `stopBrokenStampTwice`、`stopSameFindingTwice`、`stopMissingConfirmLine` のときの止まり
- 要求系（上級レビュー役を差し込む段）：`review-next` のあとのレビュー役の選び方、レビュー役起動で model を渡さない、修正役と作成役に model を渡さない
- 設計系・実装：`model` が空文字のときはレビュー役に渡さない、空でないときは渡す、修正役と作成役に渡さない

`stopWaitConfirm` の列挙と再起動は、要求系と設計系で違うため、要求系の再起動（上級切り替え・回数を増やさない）は `review-loop.md` の要求系用の段落、設計系の再起動（返った `model`・同じモデル・回数を増やさない）は設計系用の段落として `review-loop.md` に分けて書く。quick の `stopQuickConfirmListed` と `stopWaitConfirm` 再起動の三文は quick にだけ残す。

### 段ごとの差し込み値と止まり（受け入れ条件 18・19）

| 段 | 手順の置き場 | `review-next` 第1引数 | レビュー役 | 上級レビュー役 | 修正役 | レビュー前 `validate` | model |
|---|---|---|---|---|---|---|---|
| 要件 | `requirements.md` の `## 要件` | `requirements` | `sdd-cur-req-reviewer` | `sdd-cur-req-reviewer-high` | `sdd-cur-req-fixer` | あり（要求ファイルがあるとき） | レビューに渡さない。空 `model` で役を切り替え |
| 設計 | `design.md` の `## 設計` | `requirements` | `sdd-cur-design-reviewer` | 使わない | `sdd-cur-design-fixer` | あり（設計ファイルがあるとき） | 空なら渡さない。非空ならレビュー役に渡す |
| 回答・要求側 | `reflect.md` の `## 回答`（側 `requirements`） | `requirements` | 要件と同じ | 要件と同じ | 要件と同じ | 要件と同じ | 要件と同じ |
| 回答・設計側 | `reflect.md` の `## 回答`（側 `design`） | `reflect-design` | 設計と同じ | 使わない | 設計と同じ | 設計と同じ | 設計と同じ。`design.md` の `requirements` 引数は使わない |
| quick 要件 | `sdd-cur-quick/SKILL.md` の `## 要件` | `quick` | 要件と同じ | 要件と同じ | 要件と同じ | あり | 要件と同じ。`stopWaitConfirm` 再起動三文は書かない |
| quick 設計 | `sdd-cur-quick/SKILL.md` の `## 設計` | `quick` | 設計と同じ | 使わない | 設計と同じ | あり | 設計と同じ。要件の三つを設計へ渡さない |
| 実装レビュー | `sdd-cur-implement/SKILL.md` の `## レビュー` | `implement` | `sdd-cur-implement-reviewer` | 使わない | `sdd-cur-implement-fixer` | なし | 設計と同じ。三つは agent 一回だけ。確認行で分岐しない |

段固有の止まり（まとめ前と同じ位置・同じ意味）：要件は受け入れ条件 6 の `stopWaitConfirm` と `action` が `修正` の人の回答。設計は受け入れ条件 8 の oversized・分割案・設計側 `stopWaitConfirm`。reflect 要求側は要件と同じ止まりで、合格まで設計役を起動しない。reflect 設計側は設計と同じ止まりで、`action` が `止まる` のとき修正役を起動しない。quick は `resultLine`・`stopQuickConfirmListed`・合格後の段遷移・設計合格時の `続行`。implement は `rewriteProcedure`・`reason`・レビュー前のテスト節と `spec-diff`。

reflect の要求側は、「反映後のレビューは `requirements.md` の `## 要件` のレビューの段全体を参照する」文を削除し、上表の差し込み値と `review-loop.md` 参照に置き換える。設計側は oversized・分割案・`stopWaitConfirm` は引き続き `design.md` の `## 設計` と同じであると書く。

### 各段ファイルに残すレビューまわり（移さない）

- `requirements.md`：`validate`、作成前に `validate` しない、修正後の再 `validate`、`action` が `合格` のあとの `show` と `after-pass.md` 参照、作成 high の説明、不合格後に作成役を起動しない
- `design.md`：設計用 `validate`、oversized・分割案の止まり、設計側 `stopWaitConfirm`、段の三つが要件と別である一文、`action` が `合格` で設計を終える
- `reflect.md`：`reflect` 失敗時、側ごとの `validate` と設計役を起動しない制約、要求側の合格案内、設計側の `reflect-design` と設計段参照
- quick：段の違いの箇条書き、`resultLine`、`stopQuickConfirmListed`、合格後の進み方、設計段の `続行`
- implement：`## レビュー` のテスト・`spec-diff`・`readonly`・手順書き直しの前段、三つの記憶の一文、第1引数 `implement` の直前まで

## 変えるファイル

- skills/sdd-cur/review-loop.md（新規）
- skills/sdd-cur/requirements.md
- skills/sdd-cur/design.md
- skills/sdd-cur/reflect.md
- skills/sdd-cur-quick/SKILL.md
- skills/sdd-cur-implement/SKILL.md
- docs/canonical/sdd.md
- docs/canonical/implement.md
- src/91.test.ts
- src/116.test.ts
- src/167.test.ts
- src/169.test.ts（新規）

`skills/sdd-cur/SKILL.md`、`src/install.ts`、`src/92.test.ts`、`src/93.test.ts`、`src/94.test.ts`、`src/115.test.ts`、`src/121.test.ts`、`src/171.test.ts`、`src/sdd-skill-sdd-cur.test.ts` は、本設計のテスト節で触ると決めた部分以外は変えない。

## テスト

- `bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。新しい `test` は `src/169.test.ts` だけに足す。[20][25]
- `src/install.ts` は変えない。install 関連の既存 test は、`review-loop.md` が `skills/sdd-cur/` に増えても、再帰コピーで導入先に載ることを既存の期待で確かめる。[17]
- `review-next` の CLI と `reviewNext` の期待は `src/91.test.ts` の `describe("reviewNext")` など、入出力を確かめる部分は直さない。[21]

### 受け入れ条件 21・22 — 既存テストの直し方

| ファイル | 直すか | 直し方 |
|---|---|---|
| `src/91.test.ts` | 直す | `describe("スキル契約")` の `skills/sdd-cur/SKILL.md` の `test` だけ。`commonPhrases` は `review-loop.md` を読んで `toContain` する。`requirements`・`design`・`reflect` の結合には、各ファイルが `review-loop.md` に従う旨と、第1引数・役名の差し込みが残ることを確かめる。`reflect` の `reflect-design` は `reflect.md` に残す。`req` の `validate` と `review-next` の順序期待（`not.toMatch(/validate[\s\S]{0,200}review-next/)`）は `requirements.md` に対してそのまま行う |
| `src/116.test.ts` | 直す | `sdd-cur` の要件の `test` は、`requirements.md` と `review-loop.md` を結合した文字列で `reqReviewFourSentences` を確かめる。`reqReviewAfterAnswerThree` は `requirements.md` だけに残る想定で、そのファイルだけを読む。quick の `test` は触らない。[22] |
| `src/167.test.ts` | 直す | `[8] レビュー指摘と三つの値は各段一回`：`レビューの指摘はどこにも置かない` は `review-loop.md` に一回、`requirements.md` と `design.md` には無いことを確かめる。`段の開始時、`consecutiveFailures` は 0` は `review-loop.md` に一回。`design.md` には `要件の段の三つとは別` の一文だけ残ることを確かめる |

### 受け入れ条件 22 — 期待を直さないテスト（代表）

| ファイル | 触らない対象 |
|---|---|
| `src/91.test.ts` | `describe("reviewNext")` 以下の CLI・関数の入出力。quick と implement のスキル契約 `test` |
| `src/92.test.ts` | implement の `review-next implement` を含む期待 |
| `src/93.test.ts` | implement スキルに `sdd-cur review-next` が含まれる期待 |
| `src/94.test.ts` | README・runner・cli の列挙 |
| `src/115.test.ts` | `review-next` 四種の CLI 表記 |
| `src/121.test.ts` | implement の `review-next` 表記 |
| `src/171.test.ts` | 設計段の oversized 文言（`design.md` に残る） |
| `src/sdd-skill-sdd-cur.test.ts` | 段ファイルの install 一致（`review-loop.md` もコピーされるだけ） |

- テスト節の表に挙げたファイル以外の、本文を文字列で確かめる既存 test の期待は直さない。[22]

### `src/169.test.ts`（新規）

- `skills/sdd-cur/review-loop.md` が存在し、`## レビューのループ` があり、差し込み値の説明と、`sdd-cur review-next` と四つの標準入力プロパティと `action` の四分岐が含まれる。`review-loop.md` と本文を変えるスキルは一文を一行である。[1][2][3][4][16]
- `requirements.md`・`design.md`・`reflect.md`・quick・implement が、`review-loop.md` に従う旨を含み、共有フレーズ（例：`直前の成功の標準出力が返した同じプロパティ`）を重複して含まない。各段の `action` と `kind` の扱いは段ファイルに残る。[5][6][7][9][10][11][12][13][14]
- `requirements.md` に第1引数 `requirements` と上級切り替えの四文が残る。`design.md` に第1引数 `requirements` と `課題全体が大きすぎる` が残る。[5][7][8]
- `reflect.md` に `requirements.md` の `## 要件` のレビューの段全体を参照する文が無い。[9]
- `SKILL.md` の段の一覧に `review-loop.md` が無い。[15]
- 決定の段ごと表の各行について、該当ファイルに表の第1引数・役名・`validate` の有無が含まれる。[18][19]
- 正本の REQ-957 と変更後 REQ-319・REQ-320・REQ-376・REQ-399・REQ-401・REQ-403・REQ-872 が、本設計の正本への差分の本文と一致する。[23][24]

## 作業の一覧

- 1. `skills/sdd-cur/review-loop.md` を新規に書き、決定の「移す本文」どおり共有ループを置く。[1][2][3][4][16]
- 2. `requirements.md`・`design.md`・`reflect.md` から共有文を除き、差し込み値・段固有止まり・`review-loop.md` 参照を書く。[5][6][7][8][9][10][14]
- 3. `skills/sdd-cur-quick/SKILL.md` の要件・設計の段と `skills/sdd-cur-implement/SKILL.md` の `## レビュー` を同様に直す。[11][12][13][14][16]
- 4. `docs/canonical/sdd.md` と `docs/canonical/implement.md` に正本への差分を反映する。[23][24]
- 5. `src/91.test.ts`・`src/116.test.ts`・`src/167.test.ts` をテスト節の表どおり直す。[21]
- 6. テスト節で触らない既存 test の期待はそのまま残す。[22]
- 7. `src/169.test.ts` を新規に書き、段ごと表と install・`SKILL.md` 段一覧を確かめ、`bun test` で `gh` を起動しないことを含めて通す。[15][17][18][19][20][25]

## 関係する課題

- #168（段ファイル化。本課題の前に行う）
- #91（`review-next` の入力と出力。本課題は変えない）
- #116（要求レビューは model を渡さず、空の `model` と空でない `model` でレビュー役の名前を切り替える）
- #171（設計の段の `課題全体が大きすぎる` と分割案の止まり）

## 正本への差分

### 追加 sdd REQ-957

もとになった課題は #169 である。

`review-next` を使うレビューのループの手順は、`skills/sdd-cur/review-loop.md` の `## レビューのループ` に一度だけ書く。
各段のスキルは、ループに入る直前に、その段の第1引数、レビュー役、修正役、上級レビュー役（使う段だけ）、レビューの前に `validate` を実行するか、を書き、`review-loop.md` を読んで従う。
`review-next` の入力と出力の意味と、各段のループの挙動は、本課題の前と同じである。

- シナリオ: 条件: SDD スキルが要件のレビューに入る 主体: SDD スキル 結果: 共有のループ手順は `review-loop.md` を読み、第1引数と役名は `requirements.md` の `## 要件` に書いた値を使う
- シナリオ: 条件: 実装スキルがレビューに入る 主体: 実装スキル 結果: 共有のループ手順は `review-loop.md` を読み、第1引数 `implement` と役名は `## レビュー` に書いた値を使う

### 変更 sdd REQ-319

もとになった課題は #45 である。

`skills/sdd-cur/requirements.md` の `## 要件` のレビューのループは、`skills/sdd-cur/review-loop.md` に従う。同じ指摘が 2 回連続したとき、2 回目の不合格レビューで人に見せて止まる挙動は、ループの意味として変わらない。

- シナリオ: 条件: 要求レビューで同じ指摘が 2 回連続した 主体: SDD スキル 結果: 2 回目の不合格で人に見せて止まる

### 変更 sdd REQ-320

もとになった課題は #45 である。

`skills/sdd-cur/design.md` の `## 設計` のレビューのループは、`skills/sdd-cur/review-loop.md` に従う。同じ指摘が 2 回連続したとき、2 回目の不合格レビューで人に見せて止まる挙動は、ループの意味として変わらない。

- シナリオ: 条件: 設計レビューで同じ指摘が 2 回連続した 主体: SDD スキル 結果: 2 回目の不合格で人に見せて止まる

### 変更 sdd REQ-376

もとになった課題は #53 である。

`skills/sdd-cur/requirements.md` の `## 要件` と `skills/sdd-cur/design.md` の `## 設計` は、レビューのループで `review-next` の `model` に従う。3 回目から渡す `model` を `grok-4.7-high` と書かない。1 回目と 2 回目は、設計レビューでは `model` を渡さない。合格まで渡す。中級相当の Composer には戻さない。

- シナリオ: 条件: 設計のレビューで数えた 3 回目である 主体: SDD スキル 結果: 返った `model` の文字列をレビュー役に渡す

### 変更 sdd REQ-399

もとになった課題は #116 である。

`review-next` が返す `model` は、1 回目と 2 回目は空文字である。3 回目以降は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。合格まで、空文字には戻さない。要求レビューでは、親は Task に `model` を渡さない。返った `model` が空文字なら `sdd-cur-req-reviewer` を、空でないなら `sdd-cur-req-reviewer-high` を起動する。`skills/sdd-cur/requirements.md` の `## 要件` は、この文字列を要求レビューの分岐の散文として書かない。設計レビューと実装レビューでは、返った `model` が空でないとき、その文字列をレビュー役の model に渡す。

- シナリオ: 条件: 要求レビューで `review-next` が空でない `model` を返す 主体: SDD スキル 結果: `sdd-cur-req-reviewer-high` を起動する

### 変更 sdd REQ-401

もとになった課題は #55 である。

`skills/sdd-cur/design.md` の `## 設計` のレビューのループは、第1引数 `requirements` の `review-next` に従う。手順の置き場は `review-loop.md` である。回数とモデルの規則は、要求のレビューと同じである。

- シナリオ: 条件: 設計のレビューで `review-next` を呼ぶ 主体: SDD スキル 結果: 第1引数は `requirements` である

### 変更 sdd REQ-403

もとになった課題は #55 である。

`skills/sdd-cur/requirements.md` の `## 要件` と `skills/sdd-cur/design.md` の `## 設計` は、3 回目から渡すモデルの文字列を、分岐の散文に書かない。その文字列は `review-next` の `model` である。`skills/sdd-cur/requirements.md` の要求作成役の初回成果物作成を説明する括弧内のモデル表記は残す。`grok-4.7-high` は書かない。

- シナリオ: 条件: 要件の段の手順を読む 主体: 検査 結果: 3 回目以降の Grok 文字列を散文に書いていない

### 変更 implement REQ-872

もとになった課題は #121 である。

テスト節を実行する主体は、実装の agent の親のままである。親は、レビュー役を起動する前に、実行すべき記述がある「テスト」節を、書かれた順にすべて実行する。コマンド行は `testCommands` の要素を配列の順に起動する。`testCommands` が空であるときは、その配列からはコマンドを起動しない。明示的な手順の箇条書きは、`testCommands` の要素としては実行しない。親は、その箇条書きを、実行すべき記述として扱う。コマンド行は `testCommands` から起動する。同じコマンド行を、設計の本文から重ねて起動しない。実行の場所は、作業ツリーのままである。レビューのループの手順は `skills/sdd-cur/review-loop.md` に従う。レビューの分岐は、`sdd-cur review-next implement <番号>` のままである。作業ツリーを変えなかったときの理由は、`実装作成が作業ツリーを変えませんでした` のままである。

- シナリオ: 条件: 実装スキルがレビューに入る 主体: 実装スキル 結果: テスト節と `spec-diff` のあと、ループは `review-loop.md` に従う
