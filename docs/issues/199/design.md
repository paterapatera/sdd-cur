# 199 docs/steering/ の任意の文書を、作成役、修正役、レビュー役が読む

<!-- sdd-cur:form -->

対象は [Issue #199](https://github.com/paterapatera/sdd-cur/issues/199)。`docs/steering/<名前>.md` を任意で置けるようにする。要求・設計・実装の作成役、修正役、レビュー役は、`docs/policy.md` のあと、`docs/steering/` 直下の `.md` をすべて読む。ディレクトリが無いときは読まずに進む。`docs/policy.md` と食い違うときは `docs/policy.md` を優先し、レビュー役は食い違いを指摘する。`sdd-cur doctor` は、`docs/steering/` があるとき、名前の規則に合わないファイルを一行ずつ知らせる。

重なる課題は #164（`doctor`）と #165（`setup`）である。

## 受け入れ条件

- 1. 条件: `docs/steering/` がディレクトリとしてある 主体: プロジェクト 結果: 直下に `<名前>.md` を任意の個数置ける
- 2. 条件: `<名前>` を領域名の規則と照合する 主体: `docs/steering/<名前>.md` 結果: `<名前>` は `docs/canonical/<領域>.md` の `<領域>` と同じ規則である。英小文字で始まり、英小文字と数字が続き、区切りのハイフンを含んでよい。ハイフンは先頭、末尾、連続には使わない
- 3. 条件: 次の十ファイルが起動する 主体: `agents/sdd-cur-req-author.md`、`agents/sdd-cur-req-fixer.md`、`agents/sdd-cur-req-reviewer.md`、`agents/sdd-cur-req-reviewer-high.md`、`agents/sdd-cur-design-author.md`、`agents/sdd-cur-design-fixer.md`、`agents/sdd-cur-design-reviewer.md`、`agents/sdd-cur-implement-author.md`、`agents/sdd-cur-implement-fixer.md`、`agents/sdd-cur-implement-reviewer.md` 結果: 各ファイルは、起動時に `docs/policy.md` を読み、そのあと `docs/steering/` 直下の `.md` をすべて読む、と書く。この順の読みは、十ファイルで揃える
- 4. 条件: `docs/steering/` がディレクトリとして無い 主体: 受け入れ条件 3 の十ファイル 結果: 各ファイルは、直下の `.md` を読まずに進み、ディレクトリが無いことでは止まらない、と書く
- 5. 条件: `docs/steering/` のサブディレクトリの中に `.md` がある 主体: 受け入れ条件 3 の十ファイル 結果: 各ファイルは、そのサブディレクトリの中の `.md` を読まない、と書く
- 6. 条件: `docs/steering/` 直下に、名前が `.md` で終わらないファイルがある 主体: 受け入れ条件 3 の十ファイル 結果: 各ファイルは、そのファイルを読まない、と書く
- 7. 条件: `docs/steering/` 直下に、受け入れ条件 2 の規則に合わない `<名前>.md` がある 主体: 受け入れ条件 3 の十ファイル 結果: 各ファイルは、その `.md` も読む、と書く
- 8. 条件: `docs/policy.md` が無い 主体: 受け入れ条件 3 の十ファイル 結果: 各ファイルは、止まって `sdd-cur init` を案内する、と書く。要求の修正、設計の修正、実装の作成、実装の修正、実装のレビューの五役も、この停止と案内を書く。この停止と案内は、十ファイルで揃える
- 9. 条件: `docs/policy.md` と `docs/steering/` 直下の `.md` が食い違う 主体: 受け入れ条件 3 の十ファイル 結果: 各ファイルは、従うのは `docs/policy.md` である、と書く
- 10. 条件: `docs/policy.md` と `docs/steering/` 直下の `.md` が食い違う 主体: `agents/sdd-cur-req-reviewer.md`、`agents/sdd-cur-req-reviewer-high.md`、`agents/sdd-cur-design-reviewer.md`、`agents/sdd-cur-implement-reviewer.md` 結果: 各ファイルは、その食い違いを指摘する、と書く
- 11. 条件: `agents/sdd-cur-req-reviewer.md` と `agents/sdd-cur-req-reviewer-high.md` と `agents/sdd-cur-design-reviewer.md` を見る 主体: その三ファイル 結果: `docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する文が残る
- 12. 条件: `docs/steering/` がディレクトリとして無い 主体: `doctor` 結果: 名前の規則に合わないファイルを知らせる行は出さない
- 13. 条件: `docs/steering/` がディレクトリとして無い 主体: `doctor` 結果: 八つの検査の項目、各検査の `OK` 行と `NG` 行、`WARN` 行、終了コードは、この課題の前と同じである
- 14. 条件: `docs/steering/` がディレクトリとしてある 主体: `doctor` 結果: 八つの検査の項目と、各検査の `OK` 行と `NG` 行の形は、この課題の前と同じである
- 15. 条件: `docs/steering/` がディレクトリとしてあり、直下に受け入れ条件 2 の規則に合わない `<名前>.md` がある 主体: `doctor` 結果: 八つの検査の `OK` 行と `NG` 行のあと、既存の `WARN` 行の前に、その `<名前>.md` を標準出力へ一行ずつ出す。各行は `WARN ` に続けて、そのファイルの作業ディレクトリからの相対パスを一文字も違わず書き、行末まで他の文字を付けない。既存の `WARN` 行は、`WARN #<番号>: 「実装依頼」が付いているが担当者にあなたの login が無い` である
- 16. 条件: `docs/steering/` がディレクトリとしてあり、直下に受け入れ条件 2 の規則に合わない `<名前>.md` が無い 主体: `doctor` 結果: 名前の規則に合わないファイルを知らせる行は出さない
- 17. 条件: `docs/policy.md` の構成の表を見る 主体: `docs/policy.md` 結果: `docs/steering/` の行があり、その行から、`<名前>.md` を任意で置けること、受け入れ条件 3 の役が `docs/policy.md` のあと直下の `.md` をすべて読むこと、ディレクトリが無いときは読まずに進むこと、食い違うときは `docs/policy.md` を優先すること、が読める
- 18. 条件: `docs/policy.md` の `##` 見出しを見る 主体: `docs/policy.md` 結果: 見出しは `誰のための道具か`、`技術の前提`、`構成`、`破ってはいけない原則` の四つであり、この順である
- 19. 条件: `docs/policy.md` の見出し `# 方針` の直後の文を見る 主体: `docs/policy.md` 結果: 「このファイルを変えるのは、課題を通したときだけである。」と一文字も同じ文がある
- 20. 条件: `skills/sdd-cur/conventions.md` を読む 主体: そのファイル 結果: `<名前>.md` を `docs/steering/` 直下に任意で置けること、`<名前>` が受け入れ条件 2 の規則であること、受け入れ条件 3 の役が `docs/policy.md` のあと直下の `.md` をすべて読むこと、ディレクトリが無いときは読まずに進むこと、食い違うときは `docs/policy.md` を優先すること、レビュー役が食い違いを指摘すること、が書いてある
- 21. 条件: `README.md` を読む 主体: `README.md` 結果: 受け入れ条件 20 に書いた六つのことが書いてある
- 22. 条件: `README.md` を読む 主体: `README.md` 結果: `doctor` は `docs/steering/` があるとき、名前の規則に合わないファイルを一行ずつ知らせる、と書いてある
- 23. 条件: `README.md` の見出し `ディレクトリ` を見る 主体: `README.md` 結果: 「正本の表にあるパスは、ここには繰り返さない。」と一文字も同じ文がある
- 24. 条件: この課題のテストを書く 主体: テスト 結果: ファイルは `src/199.test.ts` だけである。既存の `src/*.test.ts` に新しい `test` を足さない。`gh` のプロセスは起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す
- 25. 条件: `doctor` を `src/199.test.ts` で確かめる 主体: テスト 結果: `GhRunner` を注入する
- 26. 条件: `agents/sdd-cur-explore.md` をこの課題の前後で比べる 主体: そのファイル 結果: 本文は一文字も変えない
- 27. 条件: `init` がファイルを作る 主体: `init` 結果: `docs/steering/` は作らない
- 28. 条件: `setup` の実行順を見る 主体: `setup` 結果: `install`、`init`、`labels` の順と、三つが終了コード 0 のあと `doctor` と同じ確認の標準出力、標準エラー、終了コードを出す定めは、この課題の前と同じである
- 29. 条件: `docs/steering/` 直下に、受け入れ条件 2 の規則に合わない `<名前>.md` がある 主体: `doctor` 結果: 終了コードは八つの検査の結果だけで決まる。一つでも失敗なら 1、すべて成功なら 0 である。この命名違反だけでは終了コードを 1 にしない
- 30. 条件: `docs/steering/` のサブディレクトリの中にファイルがある、直下に名前が `.md` で終わらないファイルがある、直下にディレクトリがある、のいずれかである 主体: `doctor` 結果: それらを知らせる行は出さない。知らせるのは、直下の、受け入れ条件 2 の規則に合わない `<名前>.md` だけである
- 31. 条件: `gh` の検査と git・`resolveRepo` の検査が `OK` であり、`viewerLogin` または課題一覧の取得が失敗し、`docs/steering/` がディレクトリとしてあり、直下に受け入れ条件 2 の規則に合わない `<名前>.md` がある 主体: `doctor` 結果: 八つの検査の `OK` 行と `NG` 行のあと、受け入れ条件 15 と同じ形の steering 用 `WARN` 行を出す。課題担当の `WARN` 行は出さない。取得に失敗したことは標準エラーへ短く書く。終了コードは八つの検査の結果だけで決まる

## 範囲外

- `docs/policy.md` の四つの `##` 見出しを増やすこと、減らすこと、見出しの字面を変えること
- 「このファイルを変えるのは、課題を通したときだけである。」を変えること
- `docs/canonical/` と `docs/issues/` の置き場所と形を変えること
- `docs/steering/` が無いときに、その不在を理由に役が止まること
- `docs/steering/` が無いときに、`doctor` の八つの検査、`WARN` 行、終了コードを、この課題の前と変えること
- `doctor` がファイルを書くこと、ファイルを消すこと、ラベルを変えること
- `agents/sdd-cur-explore.md` を変えること
- `init` が `docs/steering/` を作ること
- `setup` の実行順と、`doctor` と同じ確認の結果を出す定めを変えること
- 受け入れ条件 3 の十ファイルの frontmatter の `name`、`model`、`description`、`readonly` を変えること
- `skills/sdd-cur/conventions.md` 以外のスキル本文を変えること
- `skills/sdd-cur/conventions.md` の、課題コメントの印と、要件と設計の形式の検査の定めを変えること
- `src/doctor.ts` と `src/199.test.ts` 以外の `src/*.ts` を変えること

## 関係する課題

- #164（`doctor`。八つの検査、`WARN`、終了コード）
- #165（`setup`。三つが終了コード 0 のあと、`doctor` と同じ確認の結果を出す）

## 決定

| 項目 | 内容 |
|---|---|
| `<名前>` の規則 | `src/conventions.ts` の `CANONICAL_DOMAIN` と同じ正規表現である。`src/doctor.ts` に同じ正規表現を置く。`src/conventions.ts` は変えない |
| 十役のファイル | 受け入れ条件 3 の十ファイル。frontmatter は変えない |
| 十役の起動時の読み | `docs/policy.md` が無いときは、止まって `sdd-cur init` を案内する。あるときは起動時に `docs/policy.md` を読む。そのあと、`docs/steering/` がディレクトリであるときだけ、直下の名前が `.md` で終わる通常ファイルを、ファイル名の昇順（`localeCompare` の既定）ですべて読む。サブディレクトリの中、名前が `.md` で終わらない直下のファイルは読まない。規則に合わない `<名前>.md` も読む。ディレクトリが無いときは読まずに進み、止まらない |
| 十役の優先 | `docs/policy.md` と `docs/steering/` 直下の `.md` が食い違うとき、従うのは `docs/policy.md` である。十ファイルで同じ文言 |
| レビュー四役の指摘 | `docs/policy.md` と `docs/steering/` 直下の `.md` の食い違いを指摘する。要求レビュー二役と設計レビュー役の、`docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する文は残す |
| `docs/policy.md` の表 | `docs/policy.md` の行の次に、`docs/steering/` の行を足す。役割の説明に、受け入れ条件 17 の四つが読める |
| `skills/sdd-cur/conventions.md` | 節「仕様の正本」の表の直後に、steering の置き場所と読み方と優先とレビュー指摘を書く。受け入れ条件 20 の六つを満たす。課題コメントの印と要件と設計の形式の検査の定めは変えない |
| README | 受け入れ条件 20 の六つと、受け入れ条件 22 の `doctor` の説明を足す。見出し `ディレクトリ` の「正本の表にあるパスは、ここには繰り返さない。」は変えない |
| steering 用 `WARN` 行 | 八つの検査の `OK` 行と `NG` 行のすべてのあと、課題担当の `WARN` 行の前に書く。各行は `WARN ` に続けて、作業ディレクトリからの相対パスだけであり、スラッシュ区切りである。行末まで他の文字を付けない |
| steering 用 `WARN` の対象 | `docs/steering/` がディレクトリであり、直下にあり、名前が `.md` で終わり、拡張子を除いた `<名前>` が規則に合わない通常ファイルだけ |
| steering 用 `WARN` の順 | 相対パスの昇順（`localeCompare` の既定） |
| steering 用 `WARN` と `gh` | 八つの検査の成否や `gh` の検査の成否に依存しない。`docs/steering/` があるときだけ列挙する |
| 課題担当の `WARN` | #164 のとおり。`gh` の検査と git・`resolveRepo` の検査が `OK` のあとだけ試す。取得に失敗したときは課題担当の行だけ出さない。steering 用の行は出す |
| 終了コード | 八つの検査だけで決める。steering の命名違反だけでは 1 にしない |
| 正本 | 実装時に `docs/canonical/sdd.md`、`docs/canonical/doctor.md`、`docs/canonical/conventions.md`、`docs/canonical/docs.md` を、この設計の「正本への差分」どおりに変える |
| テスト | 新しい `test` は `src/199.test.ts` だけ |

## インターフェース

`src/doctor.ts` に置く。

```ts
const STEERING_DOMAIN = /^([a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/

export function steeringBasenameIsValid(filename: string): boolean

export async function listSteeringNameWarningLines(cwd: string): Promise<string[]>
```

`steeringBasenameIsValid` は、引数が `.md` で終わり、拡張子を除いた部分が `STEERING_DOMAIN` に一致するとき真、それ以外は偽である。

`listSteeringNameWarningLines` は、`path.join(cwd, "docs/steering")` がディレクトリでないとき、空配列を返す。ディレクトリであるとき、`readdir` で直下の名前だけを見る。各名前について、通常ファイルであり、`.md` で終わり、かつ `steeringBasenameIsValid` が偽のものだけを残す。サブディレクトリ、名前が `.md` で終わらない通常ファイル、規則に合う `.md` は残さない。残した各ファイルの、作業ディレクトリからの相対パスは `docs/steering/<名前>` である。返す文字列は、相対パスの昇順で、各行が `WARN ` に続けてその相対パスだけである。

`runDoctor` は、八つの検査の行をすべて書いたあと、`listSteeringNameWarningLines` の各行を標準出力へ書き、そのあと、#164 と同じ条件で課題担当の `WARN` 行を書く。終了コードの計算は、八つの検査のあと、警告を書く前に決める。

## 十役の起動時の文言

十ファイルの `## 起動時` に、次の塊を同じ文言で足す。既存の、課題番号や差分を読む行の前に置く。五つの作成役とレビュー役は、既にある `docs/policy.md` の停止と読む定めと置き換えず、その直後に続ける。

```
`docs/steering/` がディレクトリであるときは、そのあと `docs/steering/` 直下の名前が `.md` で終わるファイルを、ファイル名の昇順ですべて読む。
`docs/steering/` がディレクトリでないときは、直下の `.md` を読まずに進む。
`docs/steering/` のサブディレクトリの中の `.md` は読まない。
`docs/steering/` 直下の、名前が `.md` で終わらないファイルは読まない。
規則に合わない `<名前>.md` も読む。
`docs/policy.md` と `docs/steering/` 直下の `.md` が食い違うとき、従うのは `docs/policy.md` である。
```

五つの修正役と実装作成役と実装レビュー役は、`docs/policy.md` が無いとき止まって `sdd-cur init` を案内する、と、十ファイルで揃えた文言を、`## 起動時` の先頭に足す。あるときは起動時に `docs/policy.md` を読む、と書き、その直後に上の塊を置く。

`agents/sdd-cur-req-reviewer.md`、`agents/sdd-cur-req-reviewer-high.md`、`agents/sdd-cur-design-reviewer.md` の指摘の箇条書きに、次の一行を足す。

```
- レビューしている要求または設計のうち、`docs/policy.md` と `docs/steering/` 直下の `.md` が食い違う記述。
```

設計レビュー役の文は「設計」に読み替える。要求レビュー二役は「要求」に読み替える。既存の「破ってはいけない原則」と食い違う記述を指摘する箇条は残す。

`agents/sdd-cur-implement-reviewer.md` の「指摘にするもの」に、次の一行を足す。

```
- 作業ツリーの実装または渡された手順の記述のうち、`docs/policy.md` と `docs/steering/` 直下の `.md` が食い違う記述。
```

## `skills/sdd-cur/conventions.md` に足す文

節「仕様の正本」の、`<領域>` の規則を述べる段落の直後に、次の段落を足す。表の行は変えない。

```
任意で `docs/steering/<名前>.md` を `docs/steering/` 直下に置ける。`<名前>` は、上の `<領域>` と同じ規則である。要求・設計・実装の作成役、修正役、レビュー役の十サブエージェントは、起動時に `docs/policy.md` を読んだあと、ディレクトリがあるときだけ `docs/steering/` 直下の `.md` をすべて読む。ディレクトリが無いときは読まずに進む。食い違うときは `docs/policy.md` を優先する。レビュー役は、`docs/policy.md` と `docs/steering/` 直下の `.md` の食い違いを指摘する。
```

## テスト

`bun test` で実行する。新しい `test` は `src/199.test.ts` だけに足す。`GhRunner` と `commandExists` を注入する。`gh` のプロセスは起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。一時ディレクトリを `<root>` にし、終わったら消す。

- 一時ディレクトリに `docs/steering/` を置き、規則に合う `<名前>.md` を複数置ける。[1]
- `steeringBasenameIsValid` が、規則に合う `<名前>.md` と合わない名前を切り分ける。[2]
- `listSteeringNameWarningLines` が、ディレクトリ無し、規則違反の `.md` のみ、サブディレクトリ内、非 `.md`、規則に合う `.md` を正しく扱う。[12][15][16][30]
- `runDoctor` が、八行のあと steering 用 `WARN` を昇順で出し、課題担当の `WARN` の前に出す。[15][29]
- `runDoctor` が、`docs/steering/` があるときも八つの検査の `<項目>` の字面と順が #164 のままである。[14]
- `runDoctor` が、命名違反だけでは終了コード 0 を保ち、八つに `NG` があれば 1 である。[29]
- 注入で `viewerLogin` または `listIssues` が失敗し、命名違反があるとき、steering 用 `WARN` は出し、課題担当の `WARN` は出さず、標準エラーに一行がある。[31]
- `docs/steering/` が無いとき、steering 用 `WARN` が無く、八つの検査の形と終了コードが #164 のままである。[13]
- `src/199.test.ts` だけに `test` を足し、`GhRunner` を注入する。[24][25]
- `docs/policy.md` の四つの `##` 見出しと「このファイルを変えるのは、課題を通したときだけである。」の文が要件どおりである。[18][19]
- 十ファイルと `docs/policy.md` と `skills/sdd-cur/conventions.md` と README が、受け入れ条件 3 から 11、17、20、21、22、23 を満たす。[3][4][5][6][7][8][9][10][11][17][20][21][22][23]
- 実装時に正本四ファイルを「正本への差分」どおりに変える。[20][22]
- `agents/sdd-cur-explore.md` は変えない。[26]
- `init` と `setup` のソースは変えない。[27][28]

## 変えるファイル

- src/doctor.ts
- src/199.test.ts
- agents/sdd-cur-req-author.md
- agents/sdd-cur-req-fixer.md
- agents/sdd-cur-req-reviewer.md
- agents/sdd-cur-req-reviewer-high.md
- agents/sdd-cur-design-author.md
- agents/sdd-cur-design-fixer.md
- agents/sdd-cur-design-reviewer.md
- agents/sdd-cur-implement-author.md
- agents/sdd-cur-implement-fixer.md
- agents/sdd-cur-implement-reviewer.md
- docs/policy.md
- skills/sdd-cur/conventions.md
- README.md
- docs/canonical/sdd.md
- docs/canonical/doctor.md
- docs/canonical/conventions.md
- docs/canonical/docs.md

## 作業の一覧

- 1. `src/doctor.ts` に `STEERING_DOMAIN`、`steeringBasenameIsValid`、`listSteeringNameWarningLines` を足し、`runDoctor` が八行のあと steering 用 `WARN` を課題担当の `WARN` の前に出す。[2][12][14][15][16][29][30][31]
- 2. `src/199.test.ts` に、命名判定、`listSteeringNameWarningLines`、`runDoctor` の出力順と終了コードと取得失敗時を確かめる test を書く。[1][13][24][25][29][31]
- 3. 十サブエージェントの `## 起動時` とレビュー四役の指摘を、「十役の起動時の文言」のとおりに更新する。`agents/sdd-cur-explore.md` は触らない。[3][4][5][6][7][8][9][10][11][26]
- 4. `docs/policy.md` の構成表に `docs/steering/` の行を足す。[1][17][18][19]
- 5. `skills/sdd-cur/conventions.md` と README を「決定」と「`skills/sdd-cur/conventions.md` に足す文」のとおりに更新する。[20][21][22][23]
- 6. `docs/canonical/sdd.md`、`docs/canonical/doctor.md`、`docs/canonical/conventions.md`、`docs/canonical/docs.md` を「正本への差分」どおりに変える。[20][22]
- 7. `init` と `setup` の実装は変えず、範囲外のままであることを実装後に確認する。[27][28]

## 正本への差分

### 変更 sdd REQ-886

もとになった課題は #118 である。

`agents/sdd-cur-req-author.md`、`agents/sdd-cur-req-fixer.md`、`agents/sdd-cur-req-reviewer.md`、`agents/sdd-cur-req-reviewer-high.md`、`agents/sdd-cur-design-author.md`、`agents/sdd-cur-design-fixer.md`、`agents/sdd-cur-design-reviewer.md`、`agents/sdd-cur-implement-author.md`、`agents/sdd-cur-implement-fixer.md`、`agents/sdd-cur-implement-reviewer.md` は、`docs/policy.md` が無いとき、止まって、`sdd-cur init` を案内する、と書く。`docs/policy.md` があるとき、起動時に `docs/policy.md` を読み、そのあと `docs/steering/` がディレクトリであるときは `docs/steering/` 直下の名前が `.md` で終わるファイルを、ファイル名の昇順ですべて読む、と書く。`docs/steering/` がディレクトリでないときは、直下の `.md` を読まずに進む、と書く。

- シナリオ: 条件: 十サブエージェントの定義を読む 主体: 正本 結果: 起動時に `docs/policy.md` のあと `docs/steering/` 直下の `.md` をすべて読むと書いてある

### 追加 sdd REQ-960

もとになった課題は #199 である。

十サブエージェントは、`docs/policy.md` と `docs/steering/` 直下の `.md` が食い違うとき、従うのは `docs/policy.md` である、と書く。`docs/steering/` のサブディレクトリの中の `.md` は読まない、と書く。`docs/steering/` 直下の、名前が `.md` で終わらないファイルは読まない、と書く。`<名前>` が領域名の規則に合わない `docs/steering/<名前>.md` も読む、と書く。

- シナリオ: 条件: `docs/policy.md` と steering の `.md` が食い違う 主体: 十サブエージェント 結果: 従うのは `docs/policy.md` であると書いてある

### 追加 sdd REQ-961

もとになった課題は #199 である。

`agents/sdd-cur-req-reviewer.md`、`agents/sdd-cur-req-reviewer-high.md`、`agents/sdd-cur-design-reviewer.md`、`agents/sdd-cur-implement-reviewer.md` は、`docs/policy.md` と `docs/steering/` 直下の `.md` が食い違う記述を指摘する、と書く。`agents/sdd-cur-req-reviewer.md` と `agents/sdd-cur-req-reviewer-high.md` は、レビューしている要求のうち、`docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する、と書く。`agents/sdd-cur-design-reviewer.md` は、レビューしている設計のうち、`docs/policy.md` の「破ってはいけない原則」と食い違う記述を指摘する、と書く。

- シナリオ: 条件: 要求レビュー役の定義を読む 主体: 正本 結果: steering と policy の食い違いと、破ってはいけない原則の食い違いの両方を指摘すると書いてある

### 変更 doctor REQ-929

もとになった課題は #164 である。

`gh` の検査と git・`resolveRepo` の検査が `OK` のあと、警告対象の課題を取得できたとき、標準出力へ八つの検査の行のすべてのあとに、まず `docs/steering/` の命名違反ごとの steering 用 `WARN` 行を、相対パスの昇順で一行ずつ書き、次に番号の昇順で `WARN #<番号>: 「実装依頼」が付いているが担当者にあなたの login が無い` を一行ずつ書く。課題担当の対象は `state` が `open` でラベルに「実装依頼」があり、`assignees` に `viewerLogin` の login が無い課題である。`docs/steering/` がディレクトリでないとき、または命名違反が無いときは、steering 用の行は書かない。

- シナリオ: 条件: 命名違反の steering ファイルと課題担当の警告対象が両方ある 主体: `doctor` 結果: 八行のあと steering 用 `WARN` が先で、課題番号の `WARN` が後である

### 変更 doctor REQ-930

もとになった課題は #164 である。

`gh` の検査と git・`resolveRepo` の検査が `OK` のあと、`viewerLogin` または課題一覧の取得が失敗したとき、課題担当の接頭辞 `WARN` の行は出さない。失敗の理由を標準エラーへ短い一行で書く。終了コードは八つの検査の `NG` だけで決まる。`docs/steering/` がディレクトリであり命名違反があるときは、八つの検査の行のあとに steering 用の `WARN` 行を、取得の失敗とは独立に一行ずつ書く。

- シナリオ: 条件: 八つがすべて `OK` で `viewerLogin` が失敗し steering の命名違反がある 主体: `doctor` 結果: steering 用 `WARN` は出し課題担当の `WARN` は出さず終了コードは 0 である

### 追加 doctor REQ-963

もとになった課題は #199 である。

`docs/steering/` がディレクトリであり、直下に、名前が `.md` で終わり、拡張子を除いた `<名前>` が `docs/canonical/<領域>.md` の `<領域>` と同じ規則に合わない通常ファイルがあるとき、`doctor` は八つの検査の `OK` 行と `NG` 行のすべてのあと、課題担当の `WARN` 行の前に、そのファイルごとに一行、標準出力へ書く。各行は `WARN ` に続けて、作業ディレクトリからの相対パスだけである。終了コードは八つの検査だけで決め、命名違反だけでは 1 にしない。サブディレクトリの中のファイル、直下の名前が `.md` で終わらないファイル、直下のディレクトリは知らせない。

- シナリオ: 条件: `docs/steering/Bad.md` だけが命名違反である 主体: `doctor` 結果: `WARN docs/steering/Bad.md` の一行だけが steering 用として出る

### 追加 conventions REQ-964

もとになった課題は #199 である。

`skills/sdd-cur/conventions.md` は、任意で `docs/steering/<名前>.md` を直下に置けること、`<名前>` が領域名と同じ規則であること、十サブエージェントが `docs/policy.md` のあと直下の `.md` をすべて読むこと、ディレクトリが無いときは読まずに進むこと、食い違うときは `docs/policy.md` を優先すること、レビュー役が食い違いを指摘すること、を書く。

- シナリオ: 条件: `skills/sdd-cur/conventions.md` を読む 主体: 人 結果: steering の置き場所と読み方と優先が書いてある

### 追加 docs REQ-965

もとになった課題は #199 である。

`docs/policy.md` の構成の表に `docs/steering/` の行がある。その行から、`<名前>.md` を任意で置けること、十サブエージェントが `docs/policy.md` のあと直下の `.md` をすべて読むこと、ディレクトリが無いときは読まずに進むこと、食い違うときは `docs/policy.md` を優先することが読める。`docs/policy.md` の四つの `##` 見出しと、「このファイルを変えるのは、課題を通したときだけである。」の文は変えない。

- シナリオ: 条件: `docs/policy.md` の構成表を読む 主体: 人 結果: `docs/steering/` の行がある

### 追加 docs REQ-966

もとになった課題は #199 である。

README は、次の六つを書く。`<名前>.md` を `docs/steering/` 直下に任意で置けること。`<名前>` が領域名と同じ規則であること。十サブエージェントが `docs/policy.md` のあと `docs/steering/` 直下の `.md` をすべて読むこと。ディレクトリが無いときは読まずに進むこと。食い違うときは `docs/policy.md` を優先すること。レビュー役が `docs/policy.md` と `docs/steering/` 直下の `.md` の食い違いを指摘すること。README は、`doctor` が `docs/steering/` があるとき、名前の規則に合わないファイルを一行ずつ知らせる、と書く。見出し `ディレクトリ` の「正本の表にあるパスは、ここには繰り返さない。」は変えない。

- シナリオ: 条件: README の `doctor` の説明を読む 主体: 人 結果: steering の命名違反を知らせると書いてある
