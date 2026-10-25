# 169 レビューのループの手順を共通のファイルにまとめる

<!-- sdd-cur:form -->

対象は [Issue #169](https://github.com/paterapatera/sdd-cur/issues/169)。`review-next` を使うレビューのループの手順を `skills/sdd-cur/review-loop.md` に一度だけ書き、各スキルはそのファイルを参照して段の値だけを書く。各段のループの挙動、`review-next` の入力と出力、サブエージェントの名前、model を渡すか渡さないかは変えない。段ごとに違う扱いは、各スキルに残す。#168 は本課題の前に行う。作業ツリーでは、要件、設計、回答の手順は、すでに段のファイルにある。比べる相手は無い。

## 現状

`skills/sdd-cur/requirements.md` は、レビュー役のレスポンスを受け取ったら、`response`、`consecutiveFailures`、`previousFindings`、`brokenStampRetries` を `sdd-cur review-next requirements <番号>` の標準入力へ、JSON 一行で渡す、と書く（`skills/sdd-cur/requirements.md` の 90 行）。返った一行 JSON の `action`、`model`、`kind` に従う、と書く（`skills/sdd-cur/requirements.md` の 91 行）。`action` が `修正` のとき、修正役を起動する、と書く（`skills/sdd-cur/requirements.md` の 101 行）。`action` が `やり直し` のとき、レビュー役をもう一度起動する、と書く（`skills/sdd-cur/requirements.md` の 102 行）。`action` が `合格` のとき、修正役も作成役も起動しない、と書く（`skills/sdd-cur/requirements.md` の 103 行）。`action` が `止まる` のとき、修正役を起動しない、と書く（`skills/sdd-cur/requirements.md` の 104 行）。`validate` の失敗は、この標準入力へ渡さない、と書く（`skills/sdd-cur/requirements.md` の 106 行）。`kind` が `stopWaitConfirm` のとき、列挙された点を人に見せる、と書く（`skills/sdd-cur/requirements.md` の 108 行）。`kind` が `stopBrokenStampTwice`、`stopSameFindingTwice`、`stopMissingConfirmLine` のときは、レスポンスを人に見せて止まる、と書く（`skills/sdd-cur/requirements.md` の 111 行）。

要求のレビュー役を起動する直前に `sdd-cur validate <番号>` を実行する、と書く（`skills/sdd-cur/requirements.md` の 77 行）。この失敗は連続不合格に数えない、と書く（`skills/sdd-cur/requirements.md` の 81 行）。要求作成役を起動する前には `validate` を実行しない、と書く（`skills/sdd-cur/requirements.md` の 83 行）。段の開始時、`consecutiveFailures` は 0、`previousFindings` は空文字、`brokenStampRetries` は 0 である、と書く（`skills/sdd-cur/requirements.md` の 87 行）。第1引数は `requirements` である、と書く（`skills/sdd-cur/requirements.md` の 88 行）。サブエージェントは `sdd-cur-req-author`、`sdd-cur-req-reviewer`、`sdd-cur-req-reviewer-high`、`sdd-cur-req-fixer` の名前で起動する、と書く（`skills/sdd-cur/requirements.md` の 24 行）。返った `model` が空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する、と書く（`skills/sdd-cur/requirements.md` の 96 行）。要求レビュー役を起動するとき model を渡さない、と書く（`skills/sdd-cur/requirements.md` の 97 行）。`stopWaitConfirm` の再起動は、返った `model` が空文字なら `sdd-cur-req-reviewer` である、と書く（`skills/sdd-cur/requirements.md` の 108 行）。この再起動は回数を増やさない、と書く（`skills/sdd-cur/requirements.md` の 110 行）。`action` が `修正` のとき、レビューに入る前に人が選んだ通常の回答を、人が決めた条件として渡す、と書く（`skills/sdd-cur/requirements.md` の 112 行）。

`skills/sdd-cur/design.md` は、同じ四つの値を `sdd-cur review-next requirements <番号>` の標準入力へ、JSON 一行で渡す、と書く（`skills/sdd-cur/design.md` の 91 行）。第1引数は `requirements` である、と書く（`skills/sdd-cur/design.md` の 89 行）。サブエージェントは `sdd-cur-design-author`、`sdd-cur-design-reviewer`、`sdd-cur-design-fixer` の名前で起動する、と書く（`skills/sdd-cur/design.md` の 19 行）。`model` が空文字のときは、レビュー役に model を渡さない、と書く（`skills/sdd-cur/design.md` の 96 行）。空でないときは、その文字列をレビュー役の model に渡す、と書く（`skills/sdd-cur/design.md` の 97 行）。設計のレビュー役を起動する直前に `sdd-cur validate <番号>` を実行する、と書く（`skills/sdd-cur/design.md` の 78 行）。この失敗は連続不合格に数えない、と書く（`skills/sdd-cur/design.md` の 82 行）。設計作成役を起動する前には `validate` を実行しない、と書く（`skills/sdd-cur/design.md` の 84 行）。段の開始時の三つは、要件の段の三つとは別である、と書く（`skills/sdd-cur/design.md` の 88 行）。レスポンスに `課題全体が大きすぎる` と一文字も違わない行があるときは、返った `action` と `kind` には従わない、と書く（`skills/sdd-cur/design.md` の 100 行）。`分割案:` と一文字も違わない行があるときは、分割案を人に見せて止まる、と書く（`skills/sdd-cur/design.md` の 108 行）。人に伝える文の字面は、`sdd-cur-create-issue` に分割案を渡して起動すれば子の課題を作れる、である、と書く（`skills/sdd-cur/design.md` の 109 行）。`stopWaitConfirm` の再起動は、返った `model` で行い、回数を増やさない、と書く（`skills/sdd-cur/design.md` の 123 行）。そのモデルは、`確認: あり` を返したそのレビューと同じである、と書く（`skills/sdd-cur/design.md` の 123 行）。

`skills/sdd-cur/reflect.md` は、`reflect` が失敗したときはレビューを起動しない、と書く（`skills/sdd-cur/reflect.md` の 21 行）。そのとき `validate` も実行しない、と書く（`skills/sdd-cur/reflect.md` の 22 行）。側が `requirements` のとき、第1引数は `requirements` である、と書く（`skills/sdd-cur/reflect.md` の 48 行）。反映後のレビューは、`requirements.md` の `## 要件` のレビューの段全体である、と書く（`skills/sdd-cur/reflect.md` の 49 行）。側が `requirements` のとき、要求のレビュー役を起動する直前に `sdd-cur validate <番号>` を実行する、と書く（`skills/sdd-cur/reflect.md` の 28 行）。この失敗は連続不合格に数えない、と書く（`skills/sdd-cur/reflect.md` の 32 行）。側が `design` のとき、第1引数は `reflect-design` である、と書く（`skills/sdd-cur/reflect.md` の 68 行）。反映後のレビューは、`sdd-cur review-next reflect-design <番号>` に従う、と書く（`skills/sdd-cur/reflect.md` の 70 行）。`design.md` の `## 設計` にある `review-next requirements` は、この段では使わない、と書く（`skills/sdd-cur/reflect.md` の 71 行）。`課題全体が大きすぎる` の止まりは、`design.md` の `## 設計` と同じである、と書く（`skills/sdd-cur/reflect.md` の 72 行）。`kind` が `stopWaitConfirm` の再起動は、`design.md` の `## 設計` と同じである、と書く（`skills/sdd-cur/reflect.md` の 75 行）。側が `design` のとき、設計のレビュー役を起動する直前に `sdd-cur validate <番号>` を実行する、と書く（`skills/sdd-cur/reflect.md` の 34 行）。

`skills/sdd-cur-quick/SKILL.md` の要件の段は、段の形は今の `skills/sdd-cur/SKILL.md` の「要件」と同じである、と書く（`skills/sdd-cur-quick/SKILL.md` の 37 行）。第1引数は `quick` である、と書く（`skills/sdd-cur-quick/SKILL.md` の 63 行）。四つの値を `sdd-cur review-next quick <番号>` の標準入力へ、JSON 一行で渡す、と書く（`skills/sdd-cur-quick/SKILL.md` の 68 行）。返った `model` が空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する、と書く（`skills/sdd-cur-quick/SKILL.md` の 74 行）。要求レビュー役を起動するとき model を渡さない、と書く（`skills/sdd-cur-quick/SKILL.md` の 75 行）。要求のレビュー役を起動する直前に `sdd-cur validate <番号>` を実行する、と書く（`skills/sdd-cur-quick/SKILL.md` の 56 行）。この失敗は連続不合格に数えない、と書く（`skills/sdd-cur-quick/SKILL.md` の 59 行）。段の開始時の三つは、設計の段の三つとは別である、と書く（`skills/sdd-cur-quick/SKILL.md` の 65 行）。要求の段の三つを設計の段へ渡さない、と書く（`skills/sdd-cur-quick/SKILL.md` の 66 行）。`resultLine` があるとき、結果ファイルの最初の非空行はその文字列である、と書く（`skills/sdd-cur-quick/SKILL.md` の 86 行）。`kind` が `stopQuickConfirmListed` のとき、列挙された点を 2 行目以降に書く、と書く（`skills/sdd-cur-quick/SKILL.md` の 87 行）。`action` が `合格` のとき、同じ agent の起動の中で、設計の段へ進む、と書く（`skills/sdd-cur-quick/SKILL.md` の 92 行）。

`skills/sdd-cur-quick/SKILL.md` の設計の段のサブエージェントは `sdd-cur-design-author`、`sdd-cur-design-reviewer`、`sdd-cur-design-fixer` である、と書く（`skills/sdd-cur-quick/SKILL.md` の 96 行）。第1引数は `quick` である、と書く（`skills/sdd-cur-quick/SKILL.md` の 118 行）。四つの値を `sdd-cur review-next quick <番号>` の標準入力へ、JSON 一行で渡す、と書く（`skills/sdd-cur-quick/SKILL.md` の 122 行）。`model` が空文字のときは、レビュー役に model を渡さない、と書く（`skills/sdd-cur-quick/SKILL.md` の 127 行）。空でないときは、その文字列をレビュー役の model に渡す、と書く（`skills/sdd-cur-quick/SKILL.md` の 128 行）。要求の段の三つを設計の段へ渡さない、と書く（`skills/sdd-cur-quick/SKILL.md` の 120 行）。`kind` が `stopQuickConfirmListed` のとき、列挙された点を 2 行目以降に書く、と書く（`skills/sdd-cur-quick/SKILL.md` の 139 行）。`action` が `合格` のとき、結果ファイルの最初の非空行は `続行` である、と書く（`skills/sdd-cur-quick/SKILL.md` の 144 行）。設計のレビュー役を起動する直前に `sdd-cur validate <番号>` を実行する、と書く（`skills/sdd-cur-quick/SKILL.md` の 148 行）。この失敗は連続不合格に数えない、と書く（`skills/sdd-cur-quick/SKILL.md` の 151 行）。

`skills/sdd-cur-implement/SKILL.md` は、サブエージェントを三つ、名前で起動する、と書く（`skills/sdd-cur-implement/SKILL.md` の 31 行）。一つ目は `sdd-cur-implement-author` である（`skills/sdd-cur-implement/SKILL.md` の 35 行）。二つ目は `sdd-cur-implement-reviewer` である（`skills/sdd-cur-implement/SKILL.md` の 36 行）。三つ目は `sdd-cur-implement-fixer` である（`skills/sdd-cur-implement/SKILL.md` の 37 行）。見出し `## レビュー` がある（`skills/sdd-cur-implement/SKILL.md` の 123 行）。第1引数は `implement` である、と書く（`skills/sdd-cur-implement/SKILL.md` の 191 行）。四つの値を `sdd-cur review-next implement <番号>` の標準入力へ、JSON 一行で渡す、と書く（`skills/sdd-cur-implement/SKILL.md` の 200 行）。`model` が空文字のときは、レビュー役に model を渡さない、と書く（`skills/sdd-cur-implement/SKILL.md` の 205 行）。空でないときは、その文字列をレビュー役の model に渡す、と書く（`skills/sdd-cur-implement/SKILL.md` の 206 行）。段の開始時の三つは、この一回の agent 起動の中だけ覚える、と書く（`skills/sdd-cur-implement/SKILL.md` の 193 行）。ランナーが `implement` を再試行しても、回数は引き継がない、と書く（`skills/sdd-cur-implement/SKILL.md` の 195 行）。`rewriteProcedure` が `true` のときは、その起動の前に、親が同じパスの手順本文を書き直す、と書く（`skills/sdd-cur-implement/SKILL.md` の 211 行）。`reason` があるとき、その文字列を失敗の理由にする、と書く（`skills/sdd-cur-implement/SKILL.md` の 215 行）。`src/91.test.ts` は、実装スキルの本文が `validate` を含まないことを確かめる（`src/91.test.ts` の 1106 行）。

`skills/sdd-cur/SKILL.md` の段の一覧は七つである（`skills/sdd-cur/SKILL.md` の 19 行）。`install` がコピーするスキルは、直下のディレクトリだけが対象である（`docs/policy.md` の 37 行）。コピーは、ディレクトリを再帰的に行う（`src/install.ts` の 251 行）。正本は、`install` は `skills/sdd-cur/` 直下を中身ごとコピーする、と定める（`docs/canonical/sdd.md` の 19 行）。スキルとサブエージェントの本文は、一文を一行に書く（`docs/conventions.md` の 8 行）。テストを足すときは、`src/<番号>.test.ts` だけに書く（`docs/conventions.md` の 31 行）。

`src/91.test.ts` は、要件、設計、回答、quick、implement の本文が、四つの値と、返った `action`、`model`、`kind` に従うこと、を含むことを確かめる（`src/91.test.ts` の 1035 行）。要件の段の第1引数は `requirements` であることを確かめる（`src/91.test.ts` の 1055 行）。回答の段に `reflect-design` があることを確かめる（`src/91.test.ts` の 1056 行）。`src/116.test.ts` は、`skills/sdd-cur/requirements.md` が、空の `model` では `sdd-cur-req-reviewer` を、空でない `model` では `sdd-cur-req-reviewer-high` を起動する文を含むことを確かめる（`src/116.test.ts` の 296 行）。quick の要件の段も、その四文を含むことを確かめる（`src/116.test.ts` の 311 行）。quick の本文は、`stopWaitConfirm` の再起動の三文を含まないことを確かめる（`src/116.test.ts` の 315 行）。`src/92.test.ts` は、実装スキルの `## レビュー` が第1引数 `implement` を含むことを確かめる（`src/92.test.ts` の 41 行）。`src/171.test.ts` は、設計の段のファイルが `課題全体が大きすぎる` を含むことを確かめる（`src/171.test.ts` の 119 行）。要件の段のファイルが `課題全体が大きすぎる` を含まないことを確かめる（`src/171.test.ts` の 145 行）。

正本は、設計のレビューの次の動作は、第1引数 `requirements` の `review-next` に従う、と定める（`docs/canonical/sdd.md` の 1530 行）。正本は、実装のレビューは、第1引数 `implement` の `review-next` に従う、と定める（`docs/canonical/sdd.md` の 1536 行）。正本は、実装のレビューの分岐は、`sdd-cur review-next implement <番号>` のままである、と定める（`docs/canonical/implement.md` の 279 行）。正本は、`review-next` の標準入力は四つの値の JSON 一行である、と定める（`docs/canonical/conventions.md` の 397 行）。

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

## 関係する課題

- #168（`skills/sdd-cur/SKILL.md` を段ごとのファイルに分ける。本課題の前に行う）
- #91（`review-next` の入力と出力。本課題は変えない）
- #116（要求レビューは model を渡さず、空の `model` と空でない `model` でレビュー役の名前を切り替える）
- #171（設計の段の `課題全体が大きすぎる` と分割案の止まり）
