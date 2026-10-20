# 116 スキルから CLI を sdd-cur コマンドで呼び、別のプロジェクトでも動くようにする

対象は [Issue #116](https://github.com/paterapatera/sdd-cur/issues/116)。スキルが CLI を `bun src/cli.ts` で呼ぶのをやめ、パスの通った `sdd-cur` コマンドで呼ぶ。`install` でコピーしたスキルを、このリポジトリ以外のプロジェクトでもそのまま使えるようにする。要求レビューは、中級と上級の二つのサブエージェントに分ける。

Cursor、GitHub、Bun、日本語は前提のままである。

重なる課題は #75、#115、#46 である。要求レビューの中級と上級は、#30 と #91 にも重なる。

## 現状

「リポジトリのルートで `bun src/cli.ts` を使う。」である（`skills/sdd-cur/SKILL.md` の 9 行）。

着手は `bun src/cli.ts candidates` を実行する（`skills/sdd-cur/SKILL.md` の 19 行）。人が番号を決めたあとの表示は `bun src/cli.ts show <番号>` である（`skills/sdd-cur/SKILL.md` の 24 行）。調べる段の表示も `bun src/cli.ts show <番号>` である（`skills/sdd-cur/SKILL.md` の 35 行）。

要件の段は、先に `bun src/cli.ts show <番号>` を実行する（`skills/sdd-cur/SKILL.md` の 53 行）。作業ブランチ名は `bun src/cli.ts branch <番号>` の標準出力から得る（`skills/sdd-cur/SKILL.md` の 64 行）。用意のあとにも同じコマンドで得る（`skills/sdd-cur/SKILL.md` の 90 行）。人が本文を承認したあとの確認の投稿は `bun src/cli.ts confirm <番号>` である（`skills/sdd-cur/SKILL.md` の 135 行）。要求ファイルがあるときの検査は `bun src/cli.ts validate <番号>` である（`skills/sdd-cur/SKILL.md` の 148 行）。レビューの分岐は `bun src/cli.ts review-next requirements <番号>` である（`skills/sdd-cur/SKILL.md` の 163 行）。

設計の段は、先に `bun src/cli.ts show <番号>` を実行する（`skills/sdd-cur/SKILL.md` の 196 行）。設計作成役の前に作業ブランチ名を `bun src/cli.ts branch <番号>` で得る（`skills/sdd-cur/SKILL.md` の 221 行）。設計ファイルがあるときの検査は `bun src/cli.ts validate <番号>` である（`skills/sdd-cur/SKILL.md` の 243 行）。レビューの分岐は `bun src/cli.ts review-next requirements <番号>` である（`skills/sdd-cur/SKILL.md` の 261 行）。

確認の投稿は `bun src/cli.ts confirm <番号>` である（`skills/sdd-cur/SKILL.md` の 312 行）。回答の取り込みは `bun src/cli.ts reflect <番号> <requirements|design>` である（`skills/sdd-cur/SKILL.md` の 325 行）。取り込み先が `requirements` のときの検査は `bun src/cli.ts validate <番号>` である（`skills/sdd-cur/SKILL.md` の 344 行）。取り込み先が `design` のときの検査も同じコマンドである（`skills/sdd-cur/SKILL.md` の 350 行）。設計側の反映後のレビューは `bun src/cli.ts review-next reflect-design <番号>` である（`skills/sdd-cur/SKILL.md` の 383 行）。閉じるを選んだときは `bun src/cli.ts close <番号>` を実行する（`skills/sdd-cur/SKILL.md` の 440 行）。

`bun src/cli.ts show <番号>` である（`skills/sdd-cur-quick/SKILL.md` の 18 行）。要件の検査は `bun src/cli.ts validate <番号>` である（`skills/sdd-cur-quick/SKILL.md` の 52 行）。要件のレビュー分岐は `bun src/cli.ts review-next quick <番号>` である（`skills/sdd-cur-quick/SKILL.md` の 64 行）。設計のレビュー分岐も同じコマンドである（`skills/sdd-cur-quick/SKILL.md` の 116 行）。設計の検査は `bun src/cli.ts validate <番号>` である（`skills/sdd-cur-quick/SKILL.md` の 142 行）。

承認が無いときは、`bun src/cli.ts complete <番号>` を実行しない、と書く（`skills/sdd-cur-complete/SKILL.md` の 18 行）。承認のあとは、作業ツリーのルートで同じコマンドを実行する（`skills/sdd-cur-complete/SKILL.md` の 21 行）。禁止にも、承認があるまで同じコマンドを実行しない、と書く（`skills/sdd-cur-complete/SKILL.md` の 40 行）。

「`bun src/cli.ts` では課題を作らない。」である（`skills/sdd-cur-create-issue/SKILL.md` の 73 行）。

レビューの分岐を `bun src/cli.ts review-next implement <番号>` の標準入力へ渡す、と書く（`skills/sdd-cur-implement/SKILL.md` の 162 行）。

`name` は `@paterapatera/sdd-cur` である（`package.json` の 2 行）。`version` は `0.0.0` である（`package.json` の 3 行）。`bin.sdd-cur` は `src/cli.ts` である（`package.json` の 7 行）。`#!/usr/bin/env bun` である（`src/cli.ts` の 1 行）。

スキルのコピー先は `resolveSkillsDestination` が決める（`src/install.ts` の 20 行）。スキルのコピーは `cp` である（`src/install.ts` の 109 行）。サブエージェントのコピーも `cp` である（`src/install.ts` の 128 行）。スキルのコピーは、本文を書き換えない（`src/install.ts` の 109 行）。サブエージェントのコピーは、本文を書き換えない（`src/install.ts` の 128 行）。

`bun src/cli.ts` を期待する（`src/sdd-skill-sdd-cur.test.ts` の 48 行）。`bun src/cli.ts close` を期待する（`src/sdd-skill-sdd-cur.test.ts` の 60 行）。`bun src/cli.ts branch` を期待する（`src/sdd-skill-sdd-cur.test.ts` の 102 行）。`bun src/cli.ts validate <番号>` を期待する（`src/sdd-skill-sdd-cur.test.ts` の 155 行）。`bun src/cli.ts show <番号>` を期待する（`src/90.test.ts` の 58 行）。`bun src/cli.ts review-next` を期待する（`src/91.test.ts` の 1036 行）。`bun src/cli.ts review-next` を期待する（`src/92.test.ts` の 37 行）。`bun src/cli.ts review-next` を期待する（`src/93.test.ts` の 64 行）。`bun src/cli.ts complete` を期待する（`src/complete.test.ts` の 658 行）。「`bun src/cli.ts` では課題を作らない」を期待する（`src/create-issue.test.ts` の 40 行）。

中級の要求レビュー役の frontmatter の `name` は `sdd-cur-req-reviewer` である（`agents/sdd-cur-req-reviewer.md` の 2 行）。frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である（`agents/sdd-cur-req-reviewer.md` の 3 行）。

上級の要求レビュー役のファイルがあり、frontmatter の `name` は `sdd-cur-req-reviewer-high` である（`agents/sdd-cur-req-reviewer-high.md` の 2 行）。frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である（`agents/sdd-cur-req-reviewer-high.md` の 3 行）。

`reviewModelFromRound3` の値は、その上級の `model` と同じ文字列である（`src/conventions.ts` の 337 行）。数えるレビューの 1 回目と 2 回目では、返す `model` は空文字である（`src/conventions.ts` の 379 行）。3 回目以降では、返す `model` は `reviewModelFromRound3` である（`src/conventions.ts` の 382 行）。

SDD スキルの要求の手順は、サブエージェント名に `sdd-cur-req-reviewer-high` を含む（`skills/sdd-cur/SKILL.md` の 95 行）。要求レビュー役の初回起動は `sdd-cur-req-reviewer` である（`skills/sdd-cur/SKILL.md` の 168 行）。`review-next` のあと、返った `model` が空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する（`skills/sdd-cur/SKILL.md` の 169 行）。そのあと、model は渡さない、と書く（`skills/sdd-cur/SKILL.md` の 170 行）。

quick の要求の手順も、サブエージェント名に `sdd-cur-req-reviewer-high` を含む（`skills/sdd-cur-quick/SKILL.md` の 29 行）。初回起動は `sdd-cur-req-reviewer` である（`skills/sdd-cur-quick/SKILL.md` の 69 行）。空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する（`skills/sdd-cur-quick/SKILL.md` の 70 行）。そのあと、model は渡さない、と書く（`skills/sdd-cur-quick/SKILL.md` の 71 行）。

設計の手順は、返った `model` が空文字のときはレビュー役に model を渡さない（`skills/sdd-cur/SKILL.md` の 267 行）。空でないときは、その文字列をレビュー役の model に渡す（`skills/sdd-cur/SKILL.md` の 268 行）。quick の設計の手順も、空文字のときは渡さない（`skills/sdd-cur-quick/SKILL.md` の 122 行）。空でないときは、その文字列を渡す（`skills/sdd-cur-quick/SKILL.md` の 123 行）。実装のレビュー手順も、空文字のときは渡さない（`skills/sdd-cur-implement/SKILL.md` の 167 行）。空でないときは、その文字列を渡す（`skills/sdd-cur-implement/SKILL.md` の 168 行）。

`subagentFileNames` は `sdd-cur-req-reviewer-high.md` を含む（`src/install.ts` の 10 行）。長さが 11 であることを期待する（`src/install.test.ts` の 24 行）。README の `install` の説明は、コピーするサブエージェントを十一个と書く（`README.md` の 37 行）。

正本は、コピーするサブエージェントを十個とし、列に `sdd-cur-req-reviewer-high.md` は無い（`docs/spec/sdd.md` の 405 行）。正本の README の定めは、コピーする数を十個とする（`docs/spec/docs.md` の 91 行）。要求のレビューは `sdd-cur-req-reviewer.md` である、と正本は書く（`docs/spec/sdd.md` の 429 行）。

スキル本文のテストは `sdd-cur-req-reviewer-high` を期待する（`src/sdd-skill-sdd-cur.test.ts` の 82 行）。同じテストは `sdd-cur-req-reviewer-high` を起動する、を期待する（`src/sdd-skill-sdd-cur.test.ts` の 157 行）。quick のスキル本文のテストは `sdd-cur-req-reviewer-high` を期待する（`src/runner-skill-sdd-cur-quick.test.ts` の 56 行）。

`subagentFileNames` では、`sdd-cur-req-reviewer.md` の次が `sdd-cur-req-reviewer-high.md` である（`src/install.ts` の 10 行）。その次は `sdd-cur-req-fixer.md` である（`src/install.ts` の 11 行）。末尾は `sdd-cur-explore.md` である（`src/install.ts` の 18 行）。

中級であることの表示は、frontmatter の description にある（`agents/sdd-cur-req-reviewer.md` の 4 行）。本文の最初の文にもある（`agents/sdd-cur-req-reviewer.md` の 8 行）。中級の `readonly` は `true` である（`agents/sdd-cur-req-reviewer.md` の 5 行）。

上級であることの表示は、frontmatter の description にある（`agents/sdd-cur-req-reviewer-high.md` の 4 行）。本文の最初の文にもある（`agents/sdd-cur-req-reviewer-high.md` の 8 行）。上級の `readonly` は `true` である（`agents/sdd-cur-req-reviewer-high.md` の 5 行）。

## 受け入れ条件

- `skills/` の本文に `bun src/cli.ts` が無い。
- `agents/` の本文に `bun src/cli.ts` が無い。
- `skills/` と `agents/` で CLI を呼ぶ文は、コマンドを `sdd-cur` にする。
- `skills/` と `agents/` の本文で、サブコマンドがある呼び出しは、`sdd-cur` のあとに空白一つと、今と同じサブコマンドを続ける。
- `skills/` と `agents/` の本文で、引数がある呼び出しは、今と同じ引数を続ける。
- `skills/` と `agents/` の本文で、サブコマンドも引数も無い `bun src/cli.ts` は、`sdd-cur` にする。
- `skills/sdd-cur-create-issue/SKILL.md` は、「`sdd-cur` では課題を作らない。」と書く。
- このリポジトリ以外の git リポジトリでも、`sdd-cur` にパスが通っていれば、着手、要件、設計、確認、回答、完了、quick の各段は、CLI を `sdd-cur` で呼べる。
- CLI を実行するスキルは、`sdd-cur` が見つからないとき、その入れ方を一行で伝える。
- その一行には `bun add -g @paterapatera/sdd-cur` が含まれる。
- その一行を伝えたあと、スキルは止まる。
- 止まったあと、スキルは `sdd-cur` を実行しない。
- このリポジトリで `bun link` を実行したあと、`sdd-cur` は手元の `src/cli.ts` を実行する。
- `install` は、スキルをコピーする。
- `install` は、スキル本文を書き換えない。
- `install` は、コピーした版をスキルの横に記録しない。
- 実行中の `sdd-cur` の版が違っても、スキルは知らせない。
- スキル本文を文字列で確かめ、サブコマンドがある `bun src/cli.ts` の呼び出しを期待しているテストは、`sdd-cur` のあとに空白一つと、今と同じサブコマンドが続く文字列を期待する。
- スキル本文を文字列で確かめ、引数がある `bun src/cli.ts` の呼び出しを期待しているテストは、今と同じ引数を期待する。
- スキル本文を文字列で確かめ、サブコマンドも引数も無い `bun src/cli.ts` を期待しているテストは、`sdd-cur` を期待する。
- 課題を作らない文を期待しているテストは、「`sdd-cur` では課題を作らない」を期待する。
- 要求レビューの中級のファイルは `agents/sdd-cur-req-reviewer.md` である。
- 要求レビューの中級の frontmatter の `name` は `sdd-cur-req-reviewer` である。
- 要求レビューの中級の frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=medium,fast=false]` である。
- 要求レビューの上級のファイルは `agents/sdd-cur-req-reviewer-high.md` である。
- 要求レビューの上級の frontmatter の `name` は `sdd-cur-req-reviewer-high` である。
- 要求レビューの上級の frontmatter の `model` は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` である。
- 上級の frontmatter の `model` は、`src/conventions.ts` の `reviewModelFromRound3` と一文字も違わない。
- 要求レビューの初回の起動は `sdd-cur-req-reviewer` である。
- 要求レビューの 1 回目と 2 回目の起動は `sdd-cur-req-reviewer` である。
- `review-next` のあと、要求レビュー役を起動するとき、返った `model` が空文字なら `sdd-cur-req-reviewer` を起動する。
- `review-next` のあと、要求レビュー役を起動するとき、返った `model` が空でないなら `sdd-cur-req-reviewer-high` を起動する。
- 人が答えたあとに要求レビュー役を再び起動するとき、返った `model` が空文字なら `sdd-cur-req-reviewer` である。
- 人が答えたあとに要求レビュー役を再び起動するとき、返った `model` が空でないなら `sdd-cur-req-reviewer-high` である。
- 親は、要求レビュー役を起動するとき、Task に `model` を渡さない。
- 中級と上級は、起動するサブエージェント名で切り替える。
- `skills/sdd-cur/SKILL.md` の要求レビュー手順は、初回の起動が `sdd-cur-req-reviewer` であると書く。
- その手順は、`review-next` のあと、返った `model` が空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する、と書く。
- その手順は、要求レビュー役を起動するとき model を渡さない、と書く。
- `skills/sdd-cur-quick/SKILL.md` の要求レビュー手順は、上の三つの書き方と同じである。
- `skills/sdd-cur/SKILL.md` と `skills/sdd-cur-quick/SKILL.md` の設計レビュー手順は、返った `model` が空でないとき、その文字列をレビュー役の model に渡す。
- `skills/sdd-cur-implement/SKILL.md` のレビュー手順は、返った `model` が空でないとき、その文字列をレビュー役の model に渡す。
- `install` の `subagentFileNames` は `sdd-cur-req-reviewer-high.md` を含む。
- `install` がコピーするサブエージェントは十一個である。
- 従来の十個のファイル名は `subagentFileNames` に残る。十個は `sdd-cur-req-author.md`、`sdd-cur-req-reviewer.md`、`sdd-cur-req-fixer.md`、`sdd-cur-design-author.md`、`sdd-cur-design-reviewer.md`、`sdd-cur-design-fixer.md`、`sdd-cur-implement-author.md`、`sdd-cur-implement-reviewer.md`、`sdd-cur-implement-fixer.md`、`sdd-cur-explore.md` である。
- `subagentFileNames` では、`sdd-cur-req-reviewer-high.md` は `sdd-cur-req-reviewer.md` の直後である。
- `subagentFileNames` では、ほかの十個の相対順は変えない。
- `subagentFileNames` の末尾は `sdd-cur-explore.md` である。
- `subagentFileNames` の順は、`sdd-cur-req-author.md`、`sdd-cur-req-reviewer.md`、`sdd-cur-req-reviewer-high.md`、`sdd-cur-req-fixer.md`、`sdd-cur-design-author.md`、`sdd-cur-design-reviewer.md`、`sdd-cur-design-fixer.md`、`sdd-cur-implement-author.md`、`sdd-cur-implement-reviewer.md`、`sdd-cur-implement-fixer.md`、`sdd-cur-explore.md` である。
- 上級のレビューの見方は、中級と同じである。
- 中級のファイルと上級のファイルで違うのは、frontmatter の `name` と `model` と、上級であることの表示である。
- 上級の frontmatter の `readonly` は `true` であり、中級と同じである。
- README の `install` の説明は、コピーするサブエージェントの数を十一個と書く。
- スキル本文を文字列で確かめ、`skills/sdd-cur/SKILL.md` の要求レビュー手順を期待しているテストは、初回の起動が `sdd-cur-req-reviewer` である文字列を期待する。
- 同じテストは、返った `model` が空文字のときは `sdd-cur-req-reviewer` を、空でないときは `sdd-cur-req-reviewer-high` を起動する、という文字列を期待する。
- 同じテストは、要求レビュー役の起動で model を渡さない、という文字列を期待する。
- スキル本文を文字列で確かめ、`skills/sdd-cur-quick/SKILL.md` の要求レビュー手順を期待しているテストは、上の三つの文字列を期待する。
- 設計レビューまたは実装レビューの手順を文字列で期待しているテストは、空でない `model` をレビュー役に渡す期待を、この要件では変えない。

## 決定

`install` は、コピーした版をスキルの横に記録しない。実行中の `sdd-cur` の版が違っても、スキルは知らせない。

版の記録と、版が違うときの通知は、採用しない。

この要件は、正本のうち、スキルが CLI を `bun src/cli.ts` で呼ぶと書いた要求を変える。変えるのは、その呼び出しのコマンド名だけである。サブコマンドは変えない。引数は変えない。

対象は、`docs/spec/sdd.md` の REQ-294、REQ-299、REQ-304、REQ-306、REQ-314、REQ-327、REQ-450、REQ-457、REQ-755、REQ-760 と、`docs/spec/complete.md` の REQ-677、REQ-691、REQ-698 である。

`docs/spec/sdd.md` の REQ-355 が変えないとする着手、要件、設計、確認、回答の本文は、この要件では CLI のコマンド名だけを変える。

設計レビューと実装レビューを、中級と上級のサブエージェントに分けることは、採用しない。

要求レビューを中級と上級に分けることについて、正本のうち次を変える。`docs/spec/sdd.md` の REQ-216 は、コピーするサブエージェントを十一個とし、`sdd-cur-req-reviewer-high.md` を含む。従来の十個のファイル名は残る。`docs/spec/docs.md` の REQ-762 は、README が書くコピー数を十一個とする。`docs/spec/sdd.md` の REQ-165 と REQ-220 は、要求レビューを中級の `sdd-cur-req-reviewer` と上級の `sdd-cur-req-reviewer-high` とする。

`docs/spec/sdd.md` の REQ-209、REQ-394、REQ-399 は、要求レビューの起動に限って変える。要求レビューでは、親は Task に `model` を渡さない。返った `model` が空文字なら中級を、空でないなら上級を起動する。設計レビューと実装レビューでは、これらの要求の、親が `model` を渡す定めを残す。

`review-next` が返す `model` は変えない。1 回目と 2 回目は空文字である。3 回目以降は `reviewModelFromRound3` である。

README のコマンド表記は、この要件に含めない。README の、コピーするサブエージェントの件数は、十一個とする。#115 に要件の範囲外は無い。この要件の範囲外にあるのは、README のコマンド表記である。件数はコマンド表記ではない。

`subagentFileNames` では、`sdd-cur-req-reviewer-high.md` を `sdd-cur-req-reviewer.md` の直後に置く。ほかの十個の相対順は変えない。末尾は `sdd-cur-explore.md` のままである。順は、`sdd-cur-req-author.md`、`sdd-cur-req-reviewer.md`、`sdd-cur-req-reviewer-high.md`、`sdd-cur-req-fixer.md`、`sdd-cur-design-author.md`、`sdd-cur-design-reviewer.md`、`sdd-cur-design-fixer.md`、`sdd-cur-implement-author.md`、`sdd-cur-implement-reviewer.md`、`sdd-cur-implement-fixer.md`、`sdd-cur-explore.md` である。`docs/spec/sdd.md` の REQ-216 の並びも、この順である。

上級のレビューの見方は、中級と同じである。中級のファイルと上級のファイルで違うのは、frontmatter の `name` と `model` と、上級であることの表示である。上級の frontmatter の `readonly` は `true` であり、中級と同じである。

## 関係する課題

課題は、次を関係するとする。

- #30（レビューのモデル）
- #75（パッケージを公開し、`bunx` で実行できるようにする）
- #91（`review-next` が返す `model`）
- #115（関連する README）
- #46（明示して起動したときは、このリポジトリ以外でも手順に入る）

#75 は、`bin.sdd-cur` を `src/cli.ts` にし、開発時に `bun src/cli.ts` を実行すると今の CLI が起動する、と定める。この要件は、スキルの CLI 呼び出しを `sdd-cur` にする。開発時に手元のソースを `sdd-cur` として呼ぶ方法は、このリポジトリでの `bun link` である。開発時の `bun src/cli.ts` は、この要件では残す。

#115 の README のコマンド表記は、この要件に含めない。#115 の要件ファイルは無い。コピーするサブエージェントの件数は、コマンド表記ではない。この要件は、その件数を十一個と書く。

#30 は、レビューを medium で始め、1 回目と 2 回目は `model` を渡さず、3 回目から親が `model` に high を渡す、と定める。この要件は、要求レビューでは親が `model` を渡さず、サブエージェント名で中級と上級を切り替える。設計レビューと実装レビューの `model` 渡しは変えない。

#91 は、`review-next` が返す `model` を、1 回目と 2 回目は空文字、3 回目以降は `grok-4.7[context=256k,reasoning_effort=high,fast=false]` とする。この要件は、その空と空でないを、要求レビューの起動名の切り替えに使う。返す値は変えない。

#46 は、スキルをコマンドで指定して起動したとき、このリポジトリ以外でも手順に入る、と定める。この要件は、その手順に入ったあとの CLI 呼び出しを、パスの通った `sdd-cur` にする。起動条件は変えない。

## 範囲外

次は、この要件に含めない。

- README のコマンド表記（#115）
- 設計レビューと実装レビューの中級と上級の分割
- 設計レビューと実装レビューで、親が `model` を渡すことの変更
- 約束と方針のファイルを導入先でどう読むか（#117、#118）
- Cursor 以外のエージェント、GitHub 以外のトラッカー、英語化
