# 115 「スキルから CLI を sdd-cur コマンドで呼び、別のプロジェクトでも動くようにする」関連のREADMEを書く

<!-- sdd-cur:form -->

対象は [Issue #115](https://github.com/paterapatera/sdd-cur/issues/115)。README に、スキルが CLI を `sdd-cur` コマンドで呼び、このリポジトリ以外のプロジェクトでも動くことを書く。

重なる課題は #116、#75、#83、#94、#122、#46 である。

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

## 範囲外

次は、この要件に含めない。

- スキルとサブエージェントの本文（#116）
- `AGENTS.md` のコマンド例
- `docs/policy.md`
- `docs/conventions.md`
- 開発時に `bun src/cli.ts` で CLI を起動することをやめること（#75、#116）
- `package.json` の `name`、`bin`、`scripts` を変えること
- 要求レビューの中級と上級の分割（#116）
- 約束と方針のファイルを導入先でどう読むか（#117、#118）

## 決定

| 項目 | 内容 |
|---|---|
| コマンド例 | README のコマンド例から `bun src/cli.ts` を無くす。別プロジェクト向けの表記は、`bunx @paterapatera/sdd-cur <サブコマンド>` と、パスが通ったあとの `sdd-cur <サブコマンド>` の両方である |
| スキル呼び出し分 | 例は「開発中の起動」の二つのコードフェンスである。表は、その節にあるコマンドの表である |
| サブコマンド | `candidates`、`show`、`branch`、`validate`、`confirm`、`reflect`、`review-next`、`complete`、`close` である。例の並びは、この順である |
| `review-next` | 例は `requirements`、`reflect-design`、`quick`、`implement` を、それぞれ `<番号>` の前に置く |
| 引数 | `candidates` に引数は無い。`show`、`branch`、`validate`、`confirm`、`complete`、`close` は `<番号>` を取る。`reflect` は `<番号> <requirements|design>` を取る |
| 主集合に入れない | `install`、`run`、`labels`、`restore`、`spec-check`、`request` を、スキル呼び出し分の例と表に入れない。`labels`、`restore`、`spec-check` のコマンド例は README に書かない。`install` の表の「すること」は、スキル呼び出し分の表から外し、字を変えず「公開後の起動」に残す。`十一個をコピーする` は README に残る |
| 別の節 | `request` は「役割」に書く。`install` と `run` は「公開後の起動」に書く |
| 使い方 | `sdd-cur --help` と `bunx @paterapatera/sdd-cur --help` である。標準エラーへ出る、という文は残す |
| 入れ方 | `bun add -g @paterapatera/sdd-cur` を「公開後の起動」に書く |
| 呼び出しの説明 | 「開発中の起動」に、スキルが CLI を `sdd-cur` コマンドで呼ぶ文と、その呼び出しがこのリポジトリ以外のプロジェクトでも動く文を書く |
| `bun test` | 最初のコードフェンスの末尾と、表の行に残す。スキル呼び出し分のサブコマンド名には数えない |
| 表の説明 | 残す行の「すること」は、いまの字のままである。除く行は `install`、`run`、`labels`、`restore`、`request`、`spec-check` である |
| 移す段落 | `` `install` は、コピーしたスキルが無いときも成功し `` で始まる段落は、字を変えず「公開後の起動」の末尾へ移す |
| 残す導入 | 「開発中の起動」の「公開前は、このリポジトリで次を実行する。」は残す。見出し「開発中の起動」は残す |
| 正本 | REQ-709、REQ-710、REQ-779、REQ-782、REQ-783、REQ-818、REQ-819 を変える。REQ-827、REQ-828、REQ-829、REQ-830、REQ-831 を `docs` に足す。REQ-715、REQ-780、REQ-781、REQ-815、REQ-816、REQ-817 は変えない |
| テストの置き場所 | この課題の README のコマンド表記の確認は `src/115.test.ts` に書く。`src/docs.test.ts` は README の「開発中の起動」を `bun src/cli.ts` の全サブコマンドとして `src/cli.ts` と比べない |

スキル呼び出し分の例からサブコマンド名を取る規則は、次である。行全体が `bun test` である行は数えない。`bunx @paterapatera/sdd-cur ` で始まる行は、その接頭辞の次の空白区切りの語を名前とする。`sdd-cur ` で始まる行は、その接頭辞の次の空白区切りの語を名前とする。表の名前は、行頭が `| ` であり区切り行ではない行の、最初のセルのバッククォートの中である。`bun test` の行は、表にあってもサブコマンド名に数えない。

`docs/policy.md` の表と `AGENTS.md` の「コマンド」の例が `src/cli.ts` のサブコマンドとずれたとき、`bun test` が失敗する定めは残す。

## README

「開発中の起動」「公開後の起動」「役割」以外の節は変えない。

### 開発中の起動

見出しの行は変えない。見出しの次の行から、使い方の文までを、次にする。

公開前は、このリポジトリで次を実行する。

スキルが CLI を `sdd-cur` コマンドで呼ぶ。

その `sdd-cur` コマンドによる呼び出しは、このリポジトリ以外のプロジェクトでも動く。

```sh
bunx @paterapatera/sdd-cur candidates
bunx @paterapatera/sdd-cur show <番号>
bunx @paterapatera/sdd-cur branch <番号>
bunx @paterapatera/sdd-cur validate <番号>
bunx @paterapatera/sdd-cur confirm <番号>
bunx @paterapatera/sdd-cur reflect <番号> <requirements|design>
bunx @paterapatera/sdd-cur review-next requirements <番号>
bunx @paterapatera/sdd-cur review-next reflect-design <番号>
bunx @paterapatera/sdd-cur review-next quick <番号>
bunx @paterapatera/sdd-cur review-next implement <番号>
bunx @paterapatera/sdd-cur complete <番号>
bunx @paterapatera/sdd-cur close <番号>
bun test
```

パスが通ったあとは、同じサブコマンドを次で呼ぶ。

```sh
sdd-cur candidates
sdd-cur show <番号>
sdd-cur branch <番号>
sdd-cur validate <番号>
sdd-cur confirm <番号>
sdd-cur reflect <番号> <requirements|design>
sdd-cur review-next requirements <番号>
sdd-cur review-next reflect-design <番号>
sdd-cur review-next quick <番号>
sdd-cur review-next implement <番号>
sdd-cur complete <番号>
sdd-cur close <番号>
```

| コマンド | すること |
|---|---|
| `candidates` | 着手候補の課題を JSON で一行出力する |
| `show` | 課題と仕様の状態を JSON で一行出力する |
| `branch` | 作業ブランチ名 `task-<番号>` を一行出力する |
| `confirm` | 承認した確認本文を標準入力から受け取り、課題にコメントする |
| `close` | 標準入力の本文を課題にコメントし、課題を閉じる |
| `reflect` | 取り込み先の全文を標準入力から受け取り、未反映の回答を一件記録する |
| `validate` | 指定課題の要件と設計の形式を検査する |
| `complete` | 指定課題の完了処理を行う。作業ツリーの `sdd-cur.completion` は読まない。 |
| `review-next` | レビュー応答と連続不合格と直前の指摘から、次の動作を JSON 一行で返す |
| `bun test` | テスト。`gh` は起動しない |

使い方は `sdd-cur --help` と `bunx @paterapatera/sdd-cur --help` で標準エラーへ出る。

最初のコードフェンスの本体は、`bunx` の十二行と、そのあとの `bun test` である。二番目のコードフェンスの本体は、`sdd-cur` の十二行である。フェンスの閉じの前の空行は、コマンド行に数えない。

### 公開後の起動

見出しは変えない。本文を次にする。

パッケージ名は `@paterapatera/sdd-cur`、実行ファイル名は `sdd-cur` である。

入れ方は `bun add -g @paterapatera/sdd-cur` である。

```sh
bunx @paterapatera/sdd-cur install [project-root]
bunx @paterapatera/sdd-cur run [--interval-min <分>]
```

パスへ入ったあとは `sdd-cur install` と `sdd-cur run` で同じ入口を呼ぶ。

`install` は、コピーしたスキルが無いときも成功し、宛先の絶対パスを標準出力へ書く。`install` がコピーするスキルは `skills/sdd-cur`、`skills/sdd-cur-complete`、`skills/sdd-cur-create-issue`、`skills/sdd-cur-fix`、`skills/sdd-cur-implement`、`skills/sdd-cur-quick` である。

`install` は、`skills/` 直下の各スキルディレクトリと、`agents/<名前>.md` の十一個をコピーする。引数を省くと `~/.cursor/skills` と `~/.cursor/agents`。プロジェクトのルートを一つ渡すと `<root>/.cursor/skills` と `<root>/.cursor/agents`。この文はスキル呼び出し分の表の行にはしない。

`bunx` の二行と、パスの文は、いまの字のままである。

### 役割

「人は Project A で、」で始まる文の `` `bun src/cli.ts request <番号>` `` を `` `sdd-cur request <番号>` `` にする。その文のほかの字は変えない。この節のほかの行は変えない。

## 変えるファイル

- README.md
- src/docs.test.ts
- src/115.test.ts
- src/94.test.ts
- src/122.test.ts
- src/132.test.ts
- docs/canonical/docs.md

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。読むだけで、一時ディレクトリは作らない。新しい `test` は `src/115.test.ts` だけに足す。既存の `src/*.test.ts` に、新しい `test` は足さない。

`src/docs.test.ts` の「サブコマンド一覧が cli.ts の switch と一致する」から、README を読む期待を除く。`docs/policy.md` の `src/cli.ts` の行と、`AGENTS.md` の「コマンド」のコードフェンスを、`src/cli.ts` のサブコマンドと比べる期待は残す。`firstMarkdownTableAfter` と `subcommandsFromMarkdownTable` は、呼び出しが無くなったら消す。`subcommandsFromCliCodeFence` と `firstCodeFenceAfter` は、残った比較に使うので残す。

`src/115.test.ts` は `README.md` と `src/docs.test.ts` を読んで、次を確かめる。

- README 全体に `bun src/cli.ts` が無い。「開発中の起動」の二つのコードフェンスにも無い。使い方の文に `sdd-cur --help` と `bunx @paterapatera/sdd-cur --help` があり、その文に `bun src/cli.ts` が無い。[1][2][5][6][21]
- 「開発中の起動」の最初のコードフェンスのコマンド行は、`bunx` の十二行と末尾の `bun test` である。`bun test` 以外の各行は `bunx @paterapatera/sdd-cur` で始まる。[3][4][8][17]
- 「開発中の起動」の二番目のコードフェンスのコマンド行は、`sdd-cur` の十二行である。各行は `sdd-cur` で始まる。[3][4][9]
- 二つのフェンスから取るサブコマンド名に、`install`、`run`、`labels`、`restore`、`spec-check`、`request` が無い。`bun test` の行は、その名前に数えない。[10][18]
- 「開発中の起動」の表のサブコマンド名は、`bun test` を除いて `candidates`、`show`、`branch`、`validate`、`confirm`、`reflect`、`review-next`、`complete`、`close` である。表に `bun test` の行がある。表に `install`、`run`、`labels`、`restore`、`spec-check`、`request` が無い。[11][12][17][18]
- 「開発中の起動」に、サブコマンド名 `install`、`run`、`request` が無い。「公開後の起動」に `bunx @paterapatera/sdd-cur install [project-root]`、`bunx @paterapatera/sdd-cur run [--interval-min <分>]`、`sdd-cur install`、`sdd-cur run` がある。「役割」の、作業ブランチを push してから「実装依頼」を付ける文は `sdd-cur request <番号>` であり、`bun src/cli.ts` が無い。[7][13][22]
- README に `bun add -g @paterapatera/sdd-cur` がある。「スキルが CLI を `sdd-cur` コマンドで呼ぶ。」と「その `sdd-cur` コマンドによる呼び出しは、このリポジトリ以外のプロジェクトでも動く。」がある。[14][15][16]
- 上の確認は `src/115.test.ts` にある。`src/docs.test.ts` に `firstCodeFenceAfter(readme, "## 開発中の起動")` が無い。`docs/policy.md` と `AGENTS.md` を `src/cli.ts` のサブコマンドと比べる期待は残る。[19][20]
- `src/94.test.ts` の README の期待は、`sdd-cur request <番号>` と、役割のその文に `bun src/cli.ts` が無いことである。`bun src/cli.ts request <番号>` と request の表の行は、README に無い。`docs/policy.md` と `AGENTS.md` の期待は残す。[7][10][12][13][22]
- `src/122.test.ts` の README の期待は、`bun src/cli.ts spec-check` と `` `spec-check` `` の表の行が無いことである。`docs/policy.md` と `AGENTS.md` の期待は残す。[10][12]
- `src/132.test.ts` の README の期待は、labels の表の行が無いことである。`src/sdd.ts` の期待は残す。[10][12]

## 作業の一覧

- 1. README の「開発中の起動」を、この設計の二つのコードフェンス、表、使い方の文、呼び出しの二文にする。[1][2][3][4][5][6][8][9][10][11][12][15][16][17][18][21]
- 2. 「役割」の該当文を `sdd-cur request <番号>` にし、「公開後の起動」に入れ方と `install` と `run` の例を置き、コピー対象の段落をそこへ移す。[7][13][14][22]
- 3. `src/docs.test.ts` から、README の「開発中の起動」を `bun src/cli.ts` の全サブコマンドとして `src/cli.ts` と比べる期待を除く。[20]
- 4. `src/115.test.ts` に、README のコマンド表記の確認を書く。[1][2][3][4][5][6][7][8][9][10][11][12][13][14][15][16][17][18][19][21][22]
- 5. この設計の `## 正本への差分` を `docs/canonical/docs.md` へ反映する。要求ファイルと設計ファイルは変えない。[1][2][3][4][5][6][7][8][9][10][11][12][13][14][15][16][17][18][19][20][21][22]
- 6. `src/94.test.ts`、`src/122.test.ts`、`src/132.test.ts` の README の期待をこの設計の README に合わせる。新しい test は足さない。[7][10][12][13][22]

## 関係する課題

- #116（スキルが CLI を `sdd-cur` で呼ぶ）
- #75（`bunx @paterapatera/sdd-cur` と開発時の `bun src/cli.ts`）
- #83（README の「開発中の起動」の例と表）
- #94（README の `request`）
- #122（README の `spec-check`）
- #46（このリポジトリ以外でも、コマンドで指定したときは手順に入る）

#116 は、スキルが CLI を `sdd-cur` で呼び、このリポジトリ以外の git リポジトリでも使えるようにする。README のコマンド表記は #116 の範囲外である。この設計は、その表記を書く。スキルとサブエージェントの本文は変えない。

#75 は、`bunx @paterapatera/sdd-cur` で今の CLI を起動し、開発時に `bun src/cli.ts` を実行すると今の CLI が起動する、と定める。この設計は、README の別プロジェクト向けの表記を、その `bunx` と、パスが通ったあとの `sdd-cur` の両方にする。開発時に `bun src/cli.ts` で CLI を起動することは残す。`package.json` は変えない。

#83 は、README の「開発中の起動」の例と、そのあとのコマンドの表が、`src/cli.ts` のサブコマンドをすべて含み、例が `bun src/cli.ts` である、と定める。この設計は、その README の例と表を、スキルが呼ぶサブコマンドの表記に変える。`AGENTS.md` の例は変えない。`bun test` は例と表に残す。

#94 は、README が、人が `bun src/cli.ts request <番号>` で作業ブランチを push してから「実装依頼」を付ける、と書くことを定める。この設計は、その文のコマンドを `sdd-cur request <番号>` にする。`request` はスキル呼び出し分の例と表には入れない。`AGENTS.md` の `bun src/cli.ts request <番号>` は変えない。

#122 は、README の「開発中の起動」の例に `bun src/cli.ts spec-check` があり、コマンドの表が `spec-check` を含む、と定める。この設計は、スキル呼び出し分の例と表から `spec-check` を外す。`AGENTS.md` の `bun src/cli.ts spec-check` は変えない。

#46 は、`sdd-cur` をコマンドで指定したとき、このリポジトリ以外のプロジェクトでも手順に入る、と定める。この設計は、その手順で呼ぶ CLI を README に書く。起動条件は、#46 のままである。

## 正本への差分

### 変更 docs REQ-709

もとになった課題は #115 である。

`AGENTS.md` の構成の表にあるサブコマンドの列挙と、`AGENTS.md` の「コマンド」にある `bun src/cli.ts` の例は、それぞれ `src/cli.ts` のサブコマンドをすべて含む。`branch` を含む。README の「開発中の起動」のコマンド例と、そのあとのスキル呼び出し分の表は、`src/cli.ts` のサブコマンドをすべて含む対象から外す。

### 変更 docs REQ-710

もとになった課題は #115 である。

`AGENTS.md` の構成の表にあるサブコマンドの列挙と、`AGENTS.md` の「コマンド」にある `bun src/cli.ts` の例に並ぶサブコマンド名が、`src/cli.ts` のサブコマンドとずれたとき、`bun test` が失敗する。README の一覧が `src/cli.ts` のサブコマンド全体と一致することは、この失敗の条件に含めない。`src/docs.test.ts` は、README の「開発中の起動」を `bun src/cli.ts` の全サブコマンドとして `src/cli.ts` と比べない。`bun test` は、このサブコマンド名に数えない。

### 変更 docs REQ-779

もとになった課題は #115 である。

README は、人が `sdd-cur request <番号>` で作業ブランチを push してから「実装依頼」を付ける、と書く。この文に `bun src/cli.ts` は無い。

### 変更 docs REQ-782

もとになった課題は #115 である。

README の「開発中の起動」の例に `bun src/cli.ts request <番号>` は無い。`request` はスキル呼び出し分の例に無い。

### 変更 docs REQ-783

もとになった課題は #115 である。

README のスキル呼び出し分の表に `request` は無い。

### 変更 docs REQ-818

もとになった課題は #115 である。

README の「開発中の起動」の例に `bun src/cli.ts spec-check` は無い。`spec-check` はスキル呼び出し分の例に無い。

### 変更 docs REQ-819

もとになった課題は #115 である。

README のスキル呼び出し分の表に `spec-check` は無い。

### 追加 docs REQ-827

もとになった課題は #115 である。

README のコマンド例に `bun src/cli.ts` は無い。「開発中の起動」のコードフェンスにも無い。使い方の文は `sdd-cur --help` と `bunx @paterapatera/sdd-cur --help` であり、その文に `bun src/cli.ts` は無い。

### 追加 docs REQ-828

もとになった課題は #115 である。

スキル呼び出し分の `bunx @paterapatera/sdd-cur` の例は、`bunx @paterapatera/sdd-cur candidates`、`bunx @paterapatera/sdd-cur show <番号>`、`bunx @paterapatera/sdd-cur branch <番号>`、`bunx @paterapatera/sdd-cur validate <番号>`、`bunx @paterapatera/sdd-cur confirm <番号>`、`bunx @paterapatera/sdd-cur reflect <番号> <requirements|design>`、`bunx @paterapatera/sdd-cur review-next requirements <番号>`、`bunx @paterapatera/sdd-cur review-next reflect-design <番号>`、`bunx @paterapatera/sdd-cur review-next quick <番号>`、`bunx @paterapatera/sdd-cur review-next implement <番号>`、`bunx @paterapatera/sdd-cur complete <番号>`、`bunx @paterapatera/sdd-cur close <番号>` である。スキル呼び出し分の `sdd-cur` の例は、`sdd-cur candidates`、`sdd-cur show <番号>`、`sdd-cur branch <番号>`、`sdd-cur validate <番号>`、`sdd-cur confirm <番号>`、`sdd-cur reflect <番号> <requirements|design>`、`sdd-cur review-next requirements <番号>`、`sdd-cur review-next reflect-design <番号>`、`sdd-cur review-next quick <番号>`、`sdd-cur review-next implement <番号>`、`sdd-cur complete <番号>`、`sdd-cur close <番号>` である。「開発中の起動」のコードフェンスは、この二つの例の少なくとも一方を含む。そのフェンスの、`bun test` 以外のコマンド行は、`sdd-cur` または `bunx @paterapatera/sdd-cur` で始まる。

### 追加 docs REQ-829

もとになった課題は #115 である。

スキル呼び出し分の表のサブコマンド名は、`bun test` を除いて、`candidates`、`show`、`branch`、`validate`、`confirm`、`reflect`、`review-next`、`complete`、`close` である。スキル呼び出し分の例と表に、`install`、`run`、`labels`、`restore`、`spec-check`、`request` は無い。`bun test` は、README の例と表に残す。スキル呼び出し分のサブコマンド名には数えない。

### 追加 docs REQ-830

もとになった課題は #115 である。

`request`、`install`、`run` を書くときは、スキル呼び出し分の例および表とは別の節に置く。「役割」は `sdd-cur request <番号>` と書く。この文に `bun src/cli.ts` は無い。「公開後の起動」は `bunx @paterapatera/sdd-cur install` と `bunx @paterapatera/sdd-cur run` と、パスが通ったあとの `sdd-cur install` と `sdd-cur run` を書く。入れ方は `bun add -g @paterapatera/sdd-cur` と書く。README は、スキルが CLI を `sdd-cur` コマンドで呼ぶ、と書く。その `sdd-cur` コマンドによる呼び出しは、このリポジトリ以外のプロジェクトでも動く、と書く。

### 追加 docs REQ-831

もとになった課題は #115 である。

この課題で README のコマンド表記を確かめるテストは `src/115.test.ts` に書く。`src/docs.test.ts` は、README の「開発中の起動」を `bun src/cli.ts` の全サブコマンドとして `src/cli.ts` と比べない。
