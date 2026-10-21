# 87 既存の仕様を正本へ移し、レビュー役が読む範囲を正本に絞る

対象は [Issue #87](https://github.com/paterapatera/sdd-cur/issues/87)。#86 で作る正本へ、今ある `docs/issues/` の内容を移す。移したあと、要求レビュー役と設計レビュー役が食い違いと巻き戻りを探すとき、`docs/issues/` 全体ではなく、その正本と、対象課題の「関係する課題」に挙げた課題の仕様を読む。要求レビューでは、その「関係する課題」は対象課題の `docs/issues/<番号>/requirements.md` の節だけを読む。設計レビューでは、その「関係する課題」は対象課題の `docs/issues/<番号>/design.md` の節だけを読む。

この要件がいう正本は、#86 で作る正本である。

手を入れる対象は、その正本のファイル、`agents/sdd-cur-req-reviewer.md`、`agents/sdd-cur-design-reviewer.md`、`docs/conventions.md` である。

## 現状

`docs/issues/` には、課題ごとの要件と設計がある。後の課題が前の課題の決定を変えたものも含む。

要求レビュー役 `sdd-cur-req-reviewer` は、`docs/issues/` にある既存の `requirements.md` と `design.md` を読む。レビューしている要求ファイル以外は、同じ手順の決定と比べるために読む。

設計レビュー役 `sdd-cur-design-reviewer` は、`docs/issues/` にある既存の `requirements.md` と `design.md` を読む。レビューしている設計ファイル以外は、同じ手順の決定と比べるために読む。

## 受け入れ条件

- 今ある `docs/issues/` の要件と設計の内容を、#86 で作る正本へ移す。
- #86 で作る正本に書く挙動は、main の今の挙動と一致する。
- 後の課題で変わった決定は、#86 で作る正本では、変わったあとの形で書く。
- #86 で作る正本の各要求から、もとになった課題の番号をたどれる。
- 挙げた課題の仕様は、その課題の `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` である。
- `agents/sdd-cur-req-reviewer.md` では、食い違いと巻き戻りを探すときに読んで比べる範囲は、#86 で作る正本と、対象課題の `docs/issues/<番号>/requirements.md` の「関係する課題」に挙げた課題の仕様だけである。
- `agents/sdd-cur-design-reviewer.md` では、食い違いと巻き戻りを探すときに読んで比べる範囲は、#86 で作る正本と、対象課題の `docs/issues/<番号>/design.md` の「関係する課題」に挙げた課題の仕様だけである。
- `docs/conventions.md` は、要求レビュー役が食い違いと巻き戻りを探すときに読んで比べる範囲を、#86 で作る正本と、対象課題の `docs/issues/<番号>/requirements.md` の「関係する課題」に挙げた課題の仕様だけと書く。
- `docs/conventions.md` は、設計レビュー役が食い違いと巻き戻りを探すときに読んで比べる範囲を、#86 で作る正本と、対象課題の `docs/issues/<番号>/design.md` の「関係する課題」に挙げた課題の仕様だけと書く。
- 既存の `docs/issues/<番号>/` は消さず、履歴として残す。

## 決定

要求レビューのとき、対象課題の「関係する課題」は、その課題の `docs/issues/<番号>/requirements.md` の「関係する課題」だけを読む。設計レビューのとき、対象課題の「関係する課題」は、その課題の `docs/issues/<番号>/design.md` の「関係する課題」だけを読む。

## 関係する課題

課題は、次を関係するとする。

- #86（正本の形と、差分を反映する流れ）

## 範囲外

次は、この要件に含めない。

- 正本の形（#86）
- 差分を反映する流れ（#86）
- 既存の `docs/issues/` を新しい形へ書き直すこと
