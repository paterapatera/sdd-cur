# 167 skills/sdd-cur/SKILL.md の重複した禁止と案内を一か所にまとめる

<!-- sdd-cur:form -->

対象は [Issue #167](https://github.com/paterapatera/sdd-cur/issues/167)。`skills/sdd-cur/SKILL.md` に繰り返されている同じ禁止と案内を、一か所にだけ書き、他の節はその節を名前で参照する。手順と判定の意味は変えない。人に見せる質問の選択肢の文言と順は変えない。本文は一文を一行のままである。#166 は本課題の前に行う。作業ツリーの技能は、すでに `sdd-cur gate` を実行する。本課題は、その判定と実行位置を変えない。

## 現状

`skills/sdd-cur/SKILL.md` の最終行は、作業ツリーの実装を書かない、である（`skills/sdd-cur/SKILL.md` の 604 行）。見出し `## 着手` がある（`skills/sdd-cur/SKILL.md` の 19 行）。見出し `## 調べる` がある（`skills/sdd-cur/SKILL.md` の 31 行）。見出し `## 要件` がある（`skills/sdd-cur/SKILL.md` の 50 行）。見出し `## 設計` がある（`skills/sdd-cur/SKILL.md` の 185 行）。見出し `## 確認` がある（`skills/sdd-cur/SKILL.md` の 354 行）。見出し `## 回答` がある（`skills/sdd-cur/SKILL.md` の 374 行）。見出し `## 禁止` がある（`skills/sdd-cur/SKILL.md` の 581 行）。`### 満たされているかの判断` は `## 回答` の中にある（`skills/sdd-cur/SKILL.md` の 501 行）。

スキルとサブエージェントの本文は、一文を一行に書く（`docs/conventions.md` の 8 行）。

`## 要件` は、合格の案内を、Cursor の質問機能で「設計に進む」と「ここで止める」を、この順で出す（`skills/sdd-cur/SKILL.md` の 170 行）。この質問は、「満たされているかの判断」の節が案内を伝えるとしたときだけ出す（`skills/sdd-cur/SKILL.md` の 171 行）。質問を出しているあいだ、人がどちらかを選ぶまで、設計の手順に入らない（`skills/sdd-cur/SKILL.md` の 172 行）。「ここで止める」を選んだときは、設計の作成役と設計の修正役を起動しない（`skills/sdd-cur/SKILL.md` の 174 行）。「設計に進む」を選んだときは、`## 設計` の手順の先頭から、人が設計を依頼したときと同じ手順に入る（`skills/sdd-cur/SKILL.md` の 176 行）。

`## 回答` は、要件側の合格のあとの案内は、要件の節の合格のときと同じである、と書く（`skills/sdd-cur/SKILL.md` の 429 行）。そのあとに、Cursor の質問機能で「設計に進む」と「ここで止める」を、この順で出す、と再び書く（`skills/sdd-cur/SKILL.md` の 432 行）。繰り返した側は、質問を出しているあいだ、設計の作成役と設計の修正役を起動しない、と書く（`skills/sdd-cur/SKILL.md` の 435 行）。`## 要件` の質問を出しているあいだの文は、設計の手順に入らない、である（`skills/sdd-cur/SKILL.md` の 172 行）。

`## 設計` は、人が設計を依頼したとき、または要件の合格の案内で「設計に進む」を選んだときに始める（`skills/sdd-cur/SKILL.md` の 187 行）。この二つの始め方で、あとの手順は同じである（`skills/sdd-cur/SKILL.md` の 188 行）。合格の案内を人に伝える前に、`sdd-cur gate <番号> request` を実行する（`skills/sdd-cur/SKILL.md` の 321 行）。`allowed` が `false` なら `reason` を伝えて止まる（`skills/sdd-cur/SKILL.md` の 322 行）。案内は、Cursor の質問機能で「実装依頼する」と「ここで止める」を、この順で出す（`skills/sdd-cur/SKILL.md` の 323 行）。質問を出しているあいだは、作業ブランチを push しない（`skills/sdd-cur/SKILL.md` の 325 行）。質問を出しているあいだは、「実装依頼」を付けない（`skills/sdd-cur/SKILL.md` の 326 行）。質問を出しているあいだは、`sdd-cur request <番号>` を実行しない（`skills/sdd-cur/SKILL.md` の 327 行）。「ここで止める」を選んだときは、push するのは、要求と設計を含む作業ブランチである（`skills/sdd-cur/SKILL.md` の 334 行）。「実装依頼する」を選んだときは、`sdd-cur request <番号>` を実行する（`skills/sdd-cur/SKILL.md` の 335 行）。`unanswered` が空でない、または `nextAnswer` が `null` でないときは、次の段へ進む質問を出さない（`skills/sdd-cur/SKILL.md` の 345 行）。その枝の最後は、「実装依頼」を付けない、である（`skills/sdd-cur/SKILL.md` の 348 行）。

`## 回答` は、設計側の合格のあとの案内は、設計の節の合格のときと同じである、と書く（`skills/sdd-cur/SKILL.md` の 463 行）。そのあとの先頭は、人に伝える前に `show` を改めて実行する、である（`skills/sdd-cur/SKILL.md` の 466 行）。「ここで止める」を選んだときの最後の文は、「実装依頼」は人が付ける、である（`skills/sdd-cur/SKILL.md` の 478 行）。`unanswered` が空でない、または `nextAnswer` が `null` でないときは、`sdd-cur request <番号>` を実行しない、と書く（`skills/sdd-cur/SKILL.md` の 493 行）。

`### 満たされているかの判断` は、要件の合格の案内と設計の合格の案内の二択を定義する（`skills/sdd-cur/SKILL.md` の 509 行）。`閉じない` を選んだあとに、同じ二択の定義を再び書く（`skills/sdd-cur/SKILL.md` の 547 行）。`閉じる` と `閉じない` を出しているあいだは、で始まる文が六つ続く（`skills/sdd-cur/SKILL.md` の 531 行）。六つ目は、設計の手順に入らない、である（`skills/sdd-cur/SKILL.md` の 536 行）。`閉じる` を選んだあとは、二つの二択を出さない、作業ブランチを push しない、「実装依頼」を付けない、`sdd-cur request <番号>` を実行しない、と別に並ぶ（`skills/sdd-cur/SKILL.md` の 572 行）。

`## 禁止` は、ラベルは変えない、と書く（`skills/sdd-cur/SKILL.md` の 585 行）。実装依頼は人が付ける、と書く（`skills/sdd-cur/SKILL.md` の 586 行）。push は人が行う、と書く（`skills/sdd-cur/SKILL.md` の 587 行）。人が「実装依頼する」を選んだとき以外は、直前の三文に従う、と書く（`skills/sdd-cur/SKILL.md` の 588 行）。その案内で「実装依頼する」を選んだときは、スキルが `sdd-cur request <番号>` を実行する（`skills/sdd-cur/SKILL.md` の 589 行）。

`## 要件` は、レビューの指摘について、ファイルにも課題コメントにも残さない、と書く（`skills/sdd-cur/SKILL.md` の 136 行）。段の開始時の `consecutiveFailures`、`previousFindings`、`brokenStampRetries` についても、同じ文を書く（`skills/sdd-cur/SKILL.md` の 139 行）。`## 設計` も、レビューの指摘について同じ文を書き（`skills/sdd-cur/SKILL.md` の 272 行）、三つの値について再び書く（`skills/sdd-cur/SKILL.md` の 278 行）。分割案については、分割案をファイルにも課題コメントにも残さない、と別の文で書く（`skills/sdd-cur/SKILL.md` の 300 行）。

`src/129.test.ts` は、`## 要件` の合格案内を文字列で確かめる（`src/129.test.ts` の 323 行）。`## 設計` の合格案内の期待からは、未回答の枝の `sdd-cur request <番号>` を実行しない、を除く（`src/129.test.ts` の 354 行）。`## 回答` の設計側は、その文を含めて確かめる（`src/129.test.ts` の 388 行）。`## 禁止` の本文を文字列で確かめる（`src/129.test.ts` の 432 行）。`src/sdd-skill-sdd-cur.test.ts` は、`skills/sdd-cur/SKILL.md` の本文を文字列で確かめる（`src/sdd-skill-sdd-cur.test.ts` の 44 行）。`src/91.test.ts` は、同じファイルの本文を文字列で確かめる（`src/91.test.ts` の 1043 行）。`src/116.test.ts` は、同じファイルの要件の段を文字列で確かめる（`src/116.test.ts` の 291 行）。`src/88.test.ts` は、同じファイルの本文を文字列で確かめる（`src/88.test.ts` の 10 行）。

正本は、`## 要件`、`## 確認`、`## 回答` の先頭と、`## 設計` の実装依頼の質問の直前で `sdd-cur gate` を実行する、と定める（`docs/canonical/sdd.md` の 2481 行）。判断は、要件の手順が合格し設計に進めると人に伝える直前、および設計の手順が合格し実装依頼に進めると人に伝える直前に行う、と定める（`docs/canonical/sdd.md` の 1891 行）。設計の合格の案内で「実装依頼する」を選んだときに `sdd-cur request <番号>` を呼ぶ定めは、`docs/canonical/git.md` にある（`docs/canonical/git.md` の 304 行）。

## 受け入れ条件

- 1. 条件: 本要件を実装した 主体: `skills/sdd-cur/SKILL.md` 結果: 見出しの文言が `合格のあとの案内` である節が一つある
- 2. 条件: 要件の合格のときの二択、設計の合格のときの二択、それぞれの選択のあとと、その質問を出しているあいだにすることとしないこと 主体: `skills/sdd-cur/SKILL.md` 結果: 受け入れ条件 1 の節にだけ書く
- 3. 条件: `## 要件`、`## 設計`、`## 回答` が合格のあとの案内を扱う 主体: `skills/sdd-cur/SKILL.md` 結果: 各節は「合格のあとの案内に従う」と書き、受け入れ条件 2 の規則の本文をその節に繰り返さない
- 4. 条件: 人に見せる質問 主体: SDD スキル 結果: 選択肢の文言と順は、「設計に進む」の次に「ここで止める」、「実装依頼する」の次に「ここで止める」、`閉じる` の次に `閉じない` のままである
- 5. 条件: 次の段へ進む質問を出しているあいだの、作業ブランチの push と、「実装依頼」の付与と、`sdd-cur request <番号>` の禁止 主体: `skills/sdd-cur/SKILL.md` 結果: 一文であり、意味は、人が選ぶまでその三つをしない、であり、コマンドは `sdd-cur request <番号>` のままである
- 6. 条件: `閉じる` と `閉じない` を出しているあいだの禁止 主体: `skills/sdd-cur/SKILL.md` 結果: 一文であり、禁止する対象は、二つの合格の案内を出さないこと、作業ブランチを push しないこと、「実装依頼」を付けないこと、`sdd-cur request <番号>` を実行しないこと、設計の手順に入らないこと、のままである。次の段へ進む質問を出しているあいだの禁止とは別の条件のままである
- 7. 条件: `閉じる` を選んだあとの禁止 主体: `skills/sdd-cur/SKILL.md` 結果: 質問を出しているあいだの禁止とは別の条件のままである。禁止する対象は、二つの合格の案内を出さないこと、作業ブランチを push しないこと、「実装依頼」を付けないこと、`sdd-cur request <番号>` を実行しないこと、のままである
- 8. 条件: `## 要件` と `## 設計` のそれぞれで、レビューの指摘と、段の開始時の `consecutiveFailures`、`previousFindings`、`brokenStampRetries` を、ファイルと課題コメントに残さないと書く 主体: `skills/sdd-cur/SKILL.md` 結果: 一つの段の中では二度書かない。残さない対象は、今の二つの文が受けている対象のままである
- 9. 条件: 分割案を人に見せて止まる 主体: SDD スキル 結果: 分割案をファイルにも課題コメントにも残さない、という止まりの意味は今のままである
- 10. 条件: 本要件を実装した 主体: `skills/sdd-cur/SKILL.md` 結果: 行数の目安は 400 以下である
- 11. 条件: 本要件を実装した 主体: `skills/sdd-cur/SKILL.md` 結果: フロントマターの閉じ `---` の次の行から末尾まで、一文を一行に書く
- 12. 条件: 本要件を実装した 主体: `docs/conventions.md` 結果: 本文は今のままである
- 13. 条件: 合格のあとと、並んだ禁止をまとめた 主体: SDD スキル 結果: まとめる前の各規則の意味は残る。ある節に無かった禁止を、他の節へ広げない。対応が付かない規則を消さない
- 14. 条件: 本要件を実装した 主体: SDD スキル 結果: `sdd-cur gate` を実行する位置と、`allowed` が `false` のときの止まりは今のままである
- 15. 条件: `## 回答` の設計側の合格の案内 主体: SDD スキル 結果: `sdd-cur gate <番号> request` を足さない
- 16. 条件: 設計の手順を始める 主体: SDD スキル 結果: 始め方は、人が設計を依頼したとき、または「設計に進む」を選んだとき、のままであり、この二つの始め方のあとの手順は同じである
- 17. 条件: `## 禁止` が「直前の三文」で指している三つ 主体: `skills/sdd-cur/SKILL.md` 結果: ラベルは変えないこと、実装依頼は人が付けること、push は人が行うこと、は残る。人が「実装依頼する」を選んだとき以外は、その三つに従う。参照は節の名前であり、「直前の三文」という位置への参照は残さない
- 18. 条件: すでに main で満たされているかの判断 主体: SDD スキル 結果: 閉じるかの判断の手順は残る。合格の案内の二択の定義は受け入れ条件 1 の節にだけあり、判断の節は節の名前で参照する
- 19. 条件: この課題の設計を書いた 主体: この課題の設計 結果: まとめる前の `skills/sdd-cur/SKILL.md` の規則ごとに、まとめたあとの行を対応させた表があり、対応の無い規則は無い
- 20. 条件: 受け入れ条件 19 の表が、複数の現在の規則を同じ規則だと対応させた 主体: `skills/sdd-cur/SKILL.md` 結果: その規則は一か所にだけ書き、他の節は節の名前で参照する
- 21. 条件: `skills/sdd-cur/SKILL.md` の本文を文字列で確かめている `src/*.test.ts` 主体: この課題の設計 結果: どの期待をどう直すかを決める。直したテストは、まとめたあとの本文を確かめる
- 22. 条件: 新しい `test` を足す 主体: 実装 結果: `src/167.test.ts` だけに書く。既存の `src/*.test.ts` に新しい `test` を足さない
- 23. 条件: `skills/sdd-cur/SKILL.md` 以外のファイルの本文を文字列で確かめているテスト 主体: この課題の設計 結果: そのファイルを変えない限り、その期待は直さない
- 24. 条件: 本要件を実装した 主体: `docs/canonical/sdd.md` 結果: 同じ規則を `skills/sdd-cur/SKILL.md` の一節にだけ書き、他の節は節の名前で参照する、と書いてある。手順の意味は今の正本のままである。識別子は変えない
- 25. 条件: 受け入れ条件 24 主体: この課題の設計 結果: `docs/canonical/sdd.md` への追加または変更を `## 正本への差分` に書く
- 26. 条件: `bun test` を実行する 主体: テスト 結果: `gh` を起動しない

## 範囲外

次は、この要件に含めない。

- 手順と判定の意味を変えること
- 人に見せる質問の選択肢の文言と順を変えること
- `docs/conventions.md` を変えること
- フロントマターを変えること
- `sdd-cur gate` の判定と、実行する位置を変えること
- `## 回答` の設計側へ `sdd-cur gate <番号> request` を足すこと
- ある節にだけある禁止を、他の節へ広げること
- `skills/sdd-cur-quick/SKILL.md`、`skills/sdd-cur-implement/SKILL.md`、`skills/sdd-cur-complete/SKILL.md`、`skills/sdd-cur-create-issue/SKILL.md`、`skills/sdd-cur-fix/SKILL.md` を変えること
- サブエージェントの手順を変えること
- `docs/canonical/git.md` と `docs/canonical/docs.md` を変えること
- `docs/policy.md` を変えること
- OpenSpec の三段構成へ、このスキルの段を組み替えること
- 課題の作成
- 課題を閉じること
- ラベルの変更
- 受け入れ手順
- 完了処理

## 関係する課題

- #166（段を始めてよいかを `sdd-cur gate` へ移す。本課題の前に行う）
- #129（合格のあとの二択と `sdd-cur request`）
- #69（すでに main で満たされているときの閉じる判断）
