# 125 正本 sdd.md の重複と壊れた文を整理する（もとになった課題 #46〜#92）

対象は [Issue #125](https://github.com/paterapatera/sdd-cur/issues/125)。正本 `docs/canonical/sdd.md` のうち、この範囲の要求について、同じことを言う組だけを一つにまとめ、同じことを言わない組は残し、この範囲の壊れた文末を直す。検査がこの範囲で「本文が近いです」を出さないことは、受け入れにしない。正本 `docs/canonical/sdd.md` 全体で `spec-check` が報告しないことは、受け入れにしない。この範囲の要求と、#124 の範囲の要求が同じことを言うときは、この課題で一つにまとめる。今のコードやファイル構成と食い違う要求は、人に確認してから、変更か削除の差分にする。

この範囲の課題番号は、46、47、53、55、56、69、72、89、90、92 である。この範囲の要求は、`docs/canonical/sdd.md` の要求のうち、本文に、行全体が `もとになった課題は #<課題番号> である。` であり、その課題番号がこの範囲の課題番号である要求である。

重なる課題は #122、#124、#97 である。

## 現状

正本のファイルは `docs/canonical/<領域>.md` である（`skills/sdd-cur/conventions.md` の 22 行）。`docs/canonical/sdd.md` の最初の見出しは `# sdd` である（`docs/canonical/sdd.md` の 1 行）。要求は、行全体が `もとになった課題は #46 である。` のように、もとになった課題を一行で示す（`docs/canonical/sdd.md` の 1084 行）。

#46 の要求がある（`docs/canonical/sdd.md` の 1084 行）。#47 の要求がある（`docs/canonical/sdd.md` の 1240 行）。#53 の要求がある（`docs/canonical/sdd.md` の 1312 行）。#55 の要求がある（`docs/canonical/sdd.md` の 1450 行）。#56 の要求がある（`docs/canonical/sdd.md` の 1564 行）。#69 の要求がある（`docs/canonical/sdd.md` の 1774 行）。#72 の要求がある（`docs/canonical/sdd.md` の 1894 行）。#89 の要求がある（`docs/canonical/sdd.md` の 2140 行）。#90 の要求がある（`docs/canonical/sdd.md` の 1210 行）。#92 の要求がある（`docs/canonical/sdd.md` の 367 行）。

361 行は #30 である（`docs/canonical/sdd.md` の 361 行）。367 行は #92 である（`docs/canonical/sdd.md` の 367 行）。379 行は #30 である（`docs/canonical/sdd.md` の 379 行）。1204 行は #46 である（`docs/canonical/sdd.md` の 1204 行）。1210 行は #90 である（`docs/canonical/sdd.md` の 1210 行）。1216 行は #46 である（`docs/canonical/sdd.md` の 1216 行）。

REQ-361 は、`agents/sdd-cur-design-author.md` の `## 親への返信` は書いたファイルの全文を求めず、この節に `書いたファイルの全文` は無い、と書く（`docs/canonical/sdd.md` の 1248 行）。もとになった課題は #47 である（`docs/canonical/sdd.md` の 1246 行）。REQ-370 は、同じ節は書いたファイルの全文を求めない、と書く（`docs/canonical/sdd.md` の 1302 行）。もとになった課題は #47 である（`docs/canonical/sdd.md` の 1300 行）。

REQ-454 は、課題ランナーが起動した agent の前後で `HEAD` が変わっていたら失敗で止まり、失敗の理由は `agent がブランチの先頭を変えました` である、と書く（`docs/canonical/sdd.md` の 1806 行）。もとになった課題は #69 である（`docs/canonical/sdd.md` の 1804 行）。REQ-466 は、課題ランナーが起動した agent の前後で `HEAD` が変わっていたら、作業コピーは戻さず、コミットも push もせず、失敗で止まる、と書く（`docs/canonical/sdd.md` の 1878 行）。もとになった課題は #69 である（`docs/canonical/sdd.md` の 1876 行）。

REQ-450 は、閉じるか閉じないかの二択と、閉じるを選んだときの `sdd-cur close <番号>` を書く（`docs/canonical/sdd.md` の 1782 行）。もとになった課題は #116 である（`docs/canonical/sdd.md` の 1780 行）。REQ-465 は、閉じるか閉じないかの二択と、閉じるを選んだときに課題を閉じることを書く（`docs/canonical/sdd.md` の 1872 行）。もとになった課題は #69 である（`docs/canonical/sdd.md` の 1870 行）。

REQ-379 は、`src/sdd.test.ts` が `skills/sdd-cur/SKILL.md` の必須文言のうち、3 回目から渡すモデルに関する部分を `grok-4.7-high` に合わせる、と書く（`docs/canonical/sdd.md` の 1356 行）。もとになった課題は #53 である（`docs/canonical/sdd.md` の 1354 行）。REQ-403 は、`skills/sdd-cur/SKILL.md` が 3 回目から渡すモデルの文字列を分岐の散文に書かず、その文字列は `review-next` の `model` である、と書く（`docs/canonical/sdd.md` の 1500 行）。もとになった課題は #55 である（`docs/canonical/sdd.md` の 1498 行）。

設計 97 の「テストの配置」は、`src/sdd.test.ts` の `skills/sdd-cur/SKILL.md` を `src/sdd-skill-sdd-cur.test.ts` へ移す、と書く（`docs/issues/97/design.md` の 162 行）。移したあと `src/sdd.test.ts` を削除する、と書く（`docs/issues/97/design.md` の 145 行）。`src/sdd.test.ts` は無い、と書く（`docs/issues/97/design.md` の 205 行）。`src/sdd-skill-sdd-cur.test.ts` に `describe("skills/sdd-cur/SKILL.md"` がある（`src/sdd-skill-sdd-cur.test.ts` の 32 行）。

REQ-384 は、実装作成の frontmatter が `composer-2.5[fast=false]` であり、実装のレビュー 3 回目以降に渡す文字列が `grok-4.7-high` である、と書く（`docs/canonical/sdd.md` の 1386 行）。もとになった課題は #53 である（`docs/canonical/sdd.md` の 1384 行）。REQ-408 は、実装作成の frontmatter が `composer-2.5[fast=false]` であり、実装のレビュー 3 回目以降に渡す文字列が `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である、と書く（`docs/canonical/sdd.md` の 1530 行）。もとになった課題は #55 である（`docs/canonical/sdd.md` の 1528 行）。

REQ-303 は、コピーされるのは、この設計で変えたファイルの内容である、と書く（`docs/canonical/sdd.md` の 900 行）。もとになった課題は #41 である（`docs/canonical/sdd.md` の 898 行）。REQ-354 は、コピーされるのは、この設計で変えた frontmatter を含むファイルである、と書く（`docs/canonical/sdd.md` の 1206 行）。もとになった課題は #46 である（`docs/canonical/sdd.md` の 1204 行）。

1260 行は「消した節の旧本文は返さないである。」で終わる（`docs/canonical/sdd.md` の 1260 行）。この行の要求のもとになった課題は #47 である（`docs/canonical/sdd.md` の 1258 行）。1272 行は「`## 親への返信` は変えないである。」で終わる（`docs/canonical/sdd.md` の 1272 行）。この行の要求のもとになった課題は #47 である（`docs/canonical/sdd.md` の 1270 行）。壊れた文末の末尾に `ないである` がある（`src/spec.ts` の 10 行）。報告の行は `壊れた文末です:` で始まる（`src/spec.ts` の 284 行）。

比較する本文から、もとになった課題の行を除く（`src/spec.ts` の 74 行）。近いかの式は `n * 5 >= u * 3` である（`src/spec.ts` の 106 行）。近い組の報告は `本文が近いです:` で始まる（`src/spec.ts` の 340 行）。

使い方に `sdd-cur spec-check` がある（`src/cli.ts` の 78 行）。`spec-check` は、見つけた行を標準エラーへ書く（`src/cli.ts` の 773 行）。行が一件以上あるとき、終了コードは 1 である（`src/cli.ts` の 775 行）。`src/spec.ts` は、近い本文、壊れた文末、空の本文、識別子の重複を検査する（`docs/policy.md` の 22 行）。#122 は、正本とコードの食い違いの検出を範囲外にする（`docs/issues/122/requirements.md` の 179 行）。#124 は、もとになった課題が #46 以降の要求を変えない（`docs/issues/124/requirements.md` の 55 行）。

正本は、今のシステムの挙動を表す（`skills/sdd-cur/conventions.md` の 18 行）。変更は識別子を変えない（`skills/sdd-cur/conventions.md` の 26 行）。設計の `## 正本への差分` は、識別子ごとの追加、変更、削除である（`skills/sdd-cur/conventions.md` の 28 行）。既存の `docs/issues/<番号>/` は消さず、履歴として残す（`skills/sdd-cur/conventions.md` の 40 行）。

## 受け入れ条件

- 整理する正本は `docs/canonical/sdd.md` だけである。
- この範囲の課題番号は、46、47、53、55、56、69、72、89、90、92 である。
- この範囲の要求は、`docs/canonical/sdd.md` の要求のうち、本文に、行全体が `もとになった課題は #<課題番号> である。` であり、その課題番号がこの範囲の課題番号である要求である。
- この範囲は、`docs/canonical/sdd.md` の中の位置では決めない。
- 同じことを言う組だけを、一つにまとめる。
- 同じことを言わない組は、残す。
- 残す要求の識別子は、整理の前から変えない。
- 残さない要求は、削除の差分にする。
- 新しい要求の識別子は作らない。
- この範囲の要求と、#124 の範囲の要求が、同じことを言うときは、この課題で一つにまとめる。
- 壊れた文末を直すのは、この範囲の要求に限る。
- この範囲について、`spec-check` が壊れた文末として報告する行を直す。
- 直した文の意味は、直す前と同じである。
- 直したあと、`spec-check` は、この範囲の要求を壊れた文末として報告しない。
- 今のコードやファイル構成と食い違う要求は、その要求について人が確認する前には、変更の差分にしない。
- 今のコードやファイル構成と食い違う要求は、その要求について人が確認する前には、削除の差分にしない。
- 人が確認したあと、その要求は、変更か削除の差分にする。
- 差分は、この課題の設計の `## 正本への差分` に書く。
- その項目の見出しは、`### 変更 sdd REQ-<番号>` と `### 削除 sdd REQ-<番号>` だけである。
- `spec-check` の検出は変えない。
- `spec-check` の終了コードが 0 であることは、受け入れにしない。
- 検査がこの範囲で「本文が近いです」を出さないことは、受け入れにしない。
- 正本 `docs/canonical/sdd.md` 全体で `spec-check` が報告しないことは、受け入れにしない。
- もとになった課題が、この範囲の課題番号でない要求は、変えない。

## 決定

同じことを言う組だけを、一つにまとめる。

同じことを言わない組は、残す。

壊れた文末を直すのは、この範囲の要求に限る。

検査がこの範囲で「本文が近いです」を出さないことを受け入れ条件にすることは、採用しない。

正本 `docs/canonical/sdd.md` 全体で `spec-check` が報告しないことを受け入れ条件にすることは、採用しない。

`spec-check` の終了コードが 0 であることを受け入れ条件にすることは、採用しない。

もとになった課題が、この範囲の課題番号でない要求は、変えない。

## 関係する課題

課題は、次を関係するとする。

- #122（正本の重複と壊れた文を見つける検査を足す）
- #124（もとになった課題が #5〜#45 の要求）
- #97（テストの配置）

#122 は、`spec-check` が言い換えの重複と壊れた文末を報告する、と定める。この要件は、その検出を変えない。この範囲の壊れた文末を、その検査が報告しないところまで直す。この範囲で、検査が「本文が近いです」を出さないことは、受け入れにしない。正本 `docs/canonical/sdd.md` 全体で `spec-check` が報告しないことは、受け入れにしない。

#124 は、もとになった課題が 5、20、21、23、26、30、36、37、38、39、41、42、44、45 の要求を整理する。その受け入れ条件は、もとになった課題が #46 以降の要求を変えない、である。この要件は、この範囲の要求を整理する。同じことを言う組だけを一つにまとめる。同じことを言わない組は残す。この範囲の要求と、#124 の範囲の要求が同じことを言うときは、この課題で一つにまとめる。

#97 は、`src/sdd.test.ts` を移したあと削除する。この要件は、その配置を戻さない。`src/sdd.test.ts` を書く要求は、人が確認してから、変更か削除の差分にする。

## 範囲外

次は、この要件に含めない。

- 挙動の変更
- `spec-check` の検出を変えること
- `docs/canonical/sdd.md` 以外の領域
- 検査がこの範囲で「本文が近いです」を出さないこと
- 正本 `docs/canonical/sdd.md` 全体で `spec-check` が報告しないこと
- `spec-check` の終了コードを 0 にすること
- もとになった課題が、この範囲の課題番号でない要求
- 要求へシナリオを足すこと（#128）
- この課題以外の `docs/issues/<番号>/` を消すこと、およびその文言を変えること
