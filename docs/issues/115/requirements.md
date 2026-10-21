# 115 「スキルから CLI を sdd-cur コマンドで呼び、別のプロジェクトでも動くようにする」関連のREADMEを書く

<!-- sdd-cur:form -->

対象は [Issue #115](https://github.com/paterapatera/sdd-cur/issues/115)。README に、スキルが CLI を `sdd-cur` コマンドで呼び、別のプロジェクトでも動くことを書く。

#116 は、スキルの CLI 呼び出しを `sdd-cur` にし、README のコマンド表記をこの課題に残した。

スキル呼び出し分とは、スキルが呼ぶサブコマンドの例と、そのサブコマンドを並べる表である。

## 現状

README の「開発中の起動」は、公開前はこのリポジトリで次を実行する、と書く（`README.md` の 15 行）。例の最初の行は `bun src/cli.ts install [project-root]` である（`README.md` の 18 行）。例は `bun src/cli.ts spec-check` を含む（`README.md` の 32 行）。例は `bun test` を含む（`README.md` の 33 行）。

使い方は `bun src/cli.ts --help` で標準エラーへ出る、と書く（`README.md` の 57 行）。

「公開後の起動」は、パッケージ名を `@paterapatera/sdd-cur`、実行ファイル名を `sdd-cur` とする（`README.md` の 61 行）。例は `bunx @paterapatera/sdd-cur install [project-root]` である（`README.md` の 64 行）。例は `bunx @paterapatera/sdd-cur run [--interval-min <分>]` である（`README.md` の 65 行）。パスへ入ったあとは `sdd-cur install` と `sdd-cur run` で同じ入口を呼ぶ、と書く（`README.md` の 68 行）。

「役割」は、人が Project A で `bun src/cli.ts request <番号>` で作業ブランチを push してから「実装依頼」を付ける、と書く（`README.md` の 79 行）。

SDD スキルは、リポジトリのルートで `sdd-cur` を使う、と書く（`skills/sdd-cur/SKILL.md` の 9 行）。`sdd-cur` が見つからないときは、`bun add -g @paterapatera/sdd-cur` を含む一行を伝えて止まる、と書く（`skills/sdd-cur/SKILL.md` の 10 行）。着手は `sdd-cur candidates` を実行する（`skills/sdd-cur/SKILL.md` の 21 行）。人が番号を決めたあとは `sdd-cur show <番号>` を実行する（`skills/sdd-cur/SKILL.md` の 26 行）。

作業ブランチ名は `sdd-cur branch <番号>` の標準出力から得る（`skills/sdd-cur/SKILL.md` の 66 行）。人が本文を承認したあとの確認は `sdd-cur confirm <番号>` である（`skills/sdd-cur/SKILL.md` の 137 行）。要求のレビューの直前の検査は `sdd-cur validate <番号>` である（`skills/sdd-cur/SKILL.md` の 150 行）。要求のレビューの分岐は `sdd-cur review-next requirements <番号>` へ渡す（`skills/sdd-cur/SKILL.md` の 165 行）。回答の取り込みは `sdd-cur reflect <番号> <requirements|design>` の標準入力へ渡す（`skills/sdd-cur/SKILL.md` の 331 行）。設計側の反映後のレビューは `sdd-cur review-next reflect-design <番号>` に従う（`skills/sdd-cur/SKILL.md` の 389 行）。閉じるを選んだときは `sdd-cur close <番号>` を実行する（`skills/sdd-cur/SKILL.md` の 446 行）。

quick は、`sdd-cur` が見つからないときは、`bun add -g @paterapatera/sdd-cur` を含む一行を伝えて止まる、と書く（`skills/sdd-cur-quick/SKILL.md` の 18 行）。先に `sdd-cur show <番号>` を実行する（`skills/sdd-cur-quick/SKILL.md` の 21 行）。quick のレビューの分岐は `sdd-cur review-next quick <番号>` へ渡す（`skills/sdd-cur-quick/SKILL.md` の 67 行）。

実装スキルは、`sdd-cur` が見つからないときは、`bun add -g @paterapatera/sdd-cur` を含む一行を伝えて止まる、と書く（`skills/sdd-cur-implement/SKILL.md` の 162 行）。レビューの分岐は `sdd-cur review-next implement <番号>` へ渡す、と書く（`skills/sdd-cur-implement/SKILL.md` の 165 行）。

完了スキルは、`sdd-cur` が見つからないときは、`bun add -g @paterapatera/sdd-cur` を含む一行を伝えて止まる、と書く（`skills/sdd-cur-complete/SKILL.md` の 21 行）。承認のあとは `sdd-cur complete <番号>` を実行する（`skills/sdd-cur-complete/SKILL.md` の 24 行）。

`package.json` の `name` は `@paterapatera/sdd-cur` である（`package.json` の 2 行）。`bin.sdd-cur` は `src/cli.ts` である（`package.json` の 7 行）。`scripts.sdd-cur` は `bun src/cli.ts` である（`package.json` の 13 行）。`src/cli.ts` の先頭は `#!/usr/bin/env bun` である（`src/cli.ts` の 1 行）。

`AGENTS.md` の「コマンド」の例の最初の行は `bun src/cli.ts install [project-root]` である（`AGENTS.md` の 27 行）。

正本は、README の「開発中の起動」にある `bun src/cli.ts` の例が、`src/cli.ts` のサブコマンドをすべて含む、とする（`docs/canonical/docs.md` の 19 行）。それらの一覧のサブコマンド名が `src/cli.ts` とずれたとき、`bun test` が失敗する、とする（`docs/canonical/docs.md` の 25 行）。`bun test` は開発用のコマンドとして、いま書いてある例と README の表に残す、とする（`docs/canonical/docs.md` の 55 行）。README は、人が `bun src/cli.ts request <番号>` で作業ブランチを push する、と書く（`docs/canonical/docs.md` の 97 行）。「開発中の起動」の例の行は `bun src/cli.ts request <番号>` である（`docs/canonical/docs.md` の 115 行）。README のコマンドの表は `request` を含む（`docs/canonical/docs.md` の 121 行）。「開発中の起動」の例に `bun src/cli.ts spec-check` の行がある（`docs/canonical/docs.md` の 145 行）。README のコマンドの表は `spec-check` を含む（`docs/canonical/docs.md` の 151 行）。

`src/docs.test.ts` は、コードフェンスの行を空白で分け、先頭が `bun`、次が `src/cli.ts` であるとき、その次をサブコマンド名とする（`src/docs.test.ts` の 36 行）。README の「開発中の起動」の最初のコードフェンスを、その取り方で見る（`src/docs.test.ts` の 157 行）。

#116 の要件の範囲外に、README のコマンド表記がある（`docs/issues/116/requirements.md` の 170 行）。

## 受け入れ条件

- 1. 条件: README のコマンド例を見る 主体: 検査 結果: `bun src/cli.ts` が無い
- 2. 条件: 「開発中の起動」のコードフェンスを見る 主体: README 結果: `bun src/cli.ts` が無い
- 3. 条件: 「開発中の起動」のコードフェンスの、`bun test` 以外のコマンド行を見る 主体: README 結果: 各行は `sdd-cur` または `bunx @paterapatera/sdd-cur` で始まる
- 4. 条件: 「開発中の起動」のコードフェンスを見る 主体: README 結果: スキル呼び出し分の `sdd-cur` の例か、`bunx @paterapatera/sdd-cur` の例の、少なくとも一方を含む
- 5. 条件: 使い方の文を見る 主体: README 結果: `sdd-cur --help` がある
- 6. 条件: 使い方の文を見る 主体: README 結果: `bunx @paterapatera/sdd-cur --help` がある
- 7. 条件: 「役割」の、作業ブランチを push してから「実装依頼」を付ける文を見る 主体: README 結果: `sdd-cur request <番号>` と書く
- 8. 条件: スキル呼び出し分の `bunx @paterapatera/sdd-cur` の例を見る 主体: README 結果: `bunx @paterapatera/sdd-cur candidates`、`bunx @paterapatera/sdd-cur show <番号>`、`bunx @paterapatera/sdd-cur branch <番号>`、`bunx @paterapatera/sdd-cur validate <番号>`、`bunx @paterapatera/sdd-cur confirm <番号>`、`bunx @paterapatera/sdd-cur reflect <番号> <requirements|design>`、`bunx @paterapatera/sdd-cur review-next requirements <番号>`、`bunx @paterapatera/sdd-cur review-next reflect-design <番号>`、`bunx @paterapatera/sdd-cur review-next quick <番号>`、`bunx @paterapatera/sdd-cur review-next implement <番号>`、`bunx @paterapatera/sdd-cur complete <番号>`、`bunx @paterapatera/sdd-cur close <番号>` がある
- 9. 条件: スキル呼び出し分の `sdd-cur` の例を見る 主体: README 結果: `sdd-cur candidates`、`sdd-cur show <番号>`、`sdd-cur branch <番号>`、`sdd-cur validate <番号>`、`sdd-cur confirm <番号>`、`sdd-cur reflect <番号> <requirements|design>`、`sdd-cur review-next requirements <番号>`、`sdd-cur review-next reflect-design <番号>`、`sdd-cur review-next quick <番号>`、`sdd-cur review-next implement <番号>`、`sdd-cur complete <番号>`、`sdd-cur close <番号>` がある
- 10. 条件: スキル呼び出し分の例のサブコマンド名を見る 主体: 検査 結果: `install`、`run`、`labels`、`restore`、`spec-check`、`request` が無い
- 11. 条件: スキル呼び出し分の表のサブコマンド名を、`bun test` を除いて見る 主体: 検査 結果: `candidates`、`show`、`branch`、`validate`、`confirm`、`reflect`、`review-next`、`complete`、`close` である
- 12. 条件: スキル呼び出し分の表を見る 主体: 検査 結果: `install`、`run`、`labels`、`restore`、`spec-check`、`request` が無い
- 13. 条件: README が `request`、`install`、`run` のいずれかのコマンドを書く 主体: その記述 結果: スキル呼び出し分の例および表とは別の節にある
- 14. 条件: README を見る 主体: README 結果: `bun add -g @paterapatera/sdd-cur` がある
- 15. 条件: README を見る 主体: README 結果: スキルが CLI を `sdd-cur` コマンドで呼ぶ、と書く
- 16. 条件: README を見る 主体: README 結果: その `sdd-cur` コマンドによる呼び出しが、このリポジトリ以外のプロジェクトでも動く、と書く
- 17. 条件: README の例と表を見る 主体: README 結果: `bun test` がある
- 18. 条件: スキル呼び出し分のサブコマンド名を数える 主体: 検査 結果: `bun test` を含めない
- 19. 条件: この課題で README のコマンド表記を確かめるテストを書く 主体: テスト 結果: `src/115.test.ts` に書く
- 20. 条件: `src/docs.test.ts` が README の「開発中の起動」を、`bun src/cli.ts` の全サブコマンドとして `src/cli.ts` と比べる 主体: その検査 結果: その比較をしない
- 21. 条件: 使い方の文を見る 主体: README 結果: `bun src/cli.ts` が無い
- 22. 条件: 「役割」の、作業ブランチを push してから「実装依頼」を付ける文を見る 主体: README 結果: `bun src/cli.ts` が無い

## 決定

別プロジェクト向けのコマンド表記は、`bunx @paterapatera/sdd-cur <サブコマンド>` の例と、パスが通ったあとの `sdd-cur <サブコマンド>` の例の両方である。

スキル呼び出し分のサブコマンドは、`candidates`、`show`、`branch`、`validate`、`confirm`、`reflect`、`review-next`、`complete`、`close` である。`review-next` の例は、`requirements`、`reflect-design`、`quick`、`implement` を、それぞれ `<番号>` の前に置く。引数は、スキルが今呼ぶ形である。`candidates` に引数は無い。`show`、`branch`、`validate`、`confirm`、`complete`、`close` は `<番号>` を取る。`reflect` は `<番号> <requirements|design>` を取る。

`install`、`run`、`labels`、`restore`、`spec-check` をスキル呼び出し分の例と表の主集合に含めることは、採用しない。

`request`、`install`、`run` を書くときは、スキル呼び出し分の例と表とは別の節に置く。「役割」の、作業ブランチを push してから「実装依頼」を付ける文は、`sdd-cur request <番号>` とする。

「開発中の起動」に `bun src/cli.ts` の例を残すことは、採用しない。README のコマンド例は、別プロジェクト向けの表記に置き換える。使い方は `sdd-cur --help` と `bunx @paterapatera/sdd-cur --help` とする。「役割」のコマンド表記も、`sdd-cur` 系にする。

入れ方は、`bun add -g @paterapatera/sdd-cur` と書く。

`bun test` は開発用のコマンドとして、例と表に残す。スキル呼び出し分のサブコマンドには数えない。

この要件は、正本のうち README のコマンド表記を定める REQ-709、REQ-779、REQ-782、REQ-783、REQ-818、REQ-819 を変える。REQ-710 のうち、README の一覧が `src/cli.ts` のサブコマンド全体と一致する定めは変える。`AGENTS.md` の一覧がずれたとき `bun test` が失敗する定めは残す。

`src/docs.test.ts` は、README の「開発中の起動」を `bun src/cli.ts` の全サブコマンドとして `src/cli.ts` と比べない。この課題の README のコマンド表記のテストは `src/115.test.ts` に書く。

## 関係する課題

課題は、次を関係するとする。

- #116（スキルが CLI を `sdd-cur` で呼ぶ）
- #75（`bunx @paterapatera/sdd-cur` と開発時の `bun src/cli.ts`）
- #83（README の「開発中の起動」の例と表）
- #94（README の `request`）
- #122（README の `spec-check`）
- #46（このリポジトリ以外でも、コマンドで指定したときは手順に入る）

#116 は、スキルが CLI を `sdd-cur` で呼び、このリポジトリ以外の git リポジトリでも使えるようにする。README のコマンド表記は #116 の範囲外であり、この課題である。

#75 は、`bunx @paterapatera/sdd-cur` で今の CLI を起動し、開発時に `bun src/cli.ts` を実行すると今の CLI が起動する、と定める。この要件は、README の別プロジェクト向けの表記を、その `bunx` と、パスが通ったあとの `sdd-cur` の両方にする。開発時に `bun src/cli.ts` で CLI を起動することは残す。

#83 は、README の「開発中の起動」の例と、そのあとのコマンドの表が、`src/cli.ts` のサブコマンドをすべて含み、例が `bun src/cli.ts` である、と定める。この要件は、その README の例と表を、スキルが呼ぶサブコマンドの表記に変える。`AGENTS.md` の例は変えない。`bun test` は例と表に残す。

#94 は、README が、人が `bun src/cli.ts request <番号>` で作業ブランチを push してから「実装依頼」を付ける、と書くことを定める。この要件は、その文のコマンドを `sdd-cur request <番号>` にする。`request` はスキル呼び出し分の例と表には入れない。`AGENTS.md` の `bun src/cli.ts request <番号>` は変えない。

#122 は、README の「開発中の起動」の例に `bun src/cli.ts spec-check` があり、コマンドの表が `spec-check` を含む、と定める。この要件は、スキル呼び出し分の例と表から `spec-check` を外す。`AGENTS.md` の `bun src/cli.ts spec-check` は変えない。

#46 は、`sdd-cur` をコマンドで指定したとき、このリポジトリ以外のプロジェクトでも手順に入る、と定める。この要件は、その手順で呼ぶ CLI を README に書く。起動条件は、#46 のままである。

## 範囲外

次は、この要件に含めない。

- スキルとサブエージェントの本文（#116）
- `AGENTS.md` のコマンド例
- `docs/policy.md`
- `docs/conventions.md`
- 正本 `docs/canonical/` への反映（設計の「正本への差分」で行う）
- 開発時に `bun src/cli.ts` で CLI を起動することをやめること（#75、#116）
- `package.json` の `name`、`bin`、`scripts` を変えること
- 要求レビューの中級と上級の分割（#116）
- 約束と方針のファイルを導入先でどう読むか（#117、#118）
