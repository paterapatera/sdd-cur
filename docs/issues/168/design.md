# 168 skills/sdd-cur/SKILL.md を段ごとのファイルに分け、依頼された段だけを読む

<!-- sdd-cur:form -->

対象は [Issue #168](https://github.com/paterapatera/sdd-cur/issues/168)。`skills/sdd-cur/SKILL.md` にまとまっている段の手順を、同じディレクトリの段ごとのファイルに分け、依頼された段のファイルだけを読む。共通の規則と段の一覧は `SKILL.md` に残す。手順と判定の意味、スキルの名前と frontmatter、`install` のコピー先は変えない。#167 は本課題の前に行う。

課題本文の分割案（`start.md` から `after-pass.md` の七ファイル、`SKILL.md` に共通規則と段の一覧、合格後に `after-pass.md`、ファイル名と節の名前での参照）をそのまま採用する。

重なる課題は #167、#47、#90、#117 である。

## 受け入れ条件

- 1. 条件: 本要件を実装した 主体: `skills/sdd-cur/` 結果: `SKILL.md` と同じディレクトリに `start.md`、`explore.md`、`requirements.md`、`design.md`、`confirm.md`、`reflect.md`、`after-pass.md` がある
- 2. 条件: 本要件を実装した 主体: 段のファイル 結果: 行全体が `## 着手` である見出しが `start.md` に、`## 調べる` が `explore.md` に、`## 要件` が `requirements.md` に、`## 設計` が `design.md` に、`## 確認` が `confirm.md` に、`## 回答` が `reflect.md` にある。各ファイルは、その見出しの段の手順を持つ。`reflect.md` の `## 回答` には、受け入れ条件 3 の `### 満たされているかの判断` の手順本文を置かない
- 3. 条件: 本要件を実装した 主体: `skills/sdd-cur/after-pass.md` 結果: 行全体が `### 満たされているかの判断` である見出しと、行全体が `## 合格のあとの案内` である見出しがある。見出しの並びは、分ける前の `skills/sdd-cur/SKILL.md` と同じである。この二つの手順本文は、このファイルにだけある
- 4. 条件: 本要件を実装した 主体: `skills/sdd-cur/SKILL.md` 結果: 着手、調べる、要件、設計、確認、回答、満たされているかの判断、合格のあとの案内の手順本文を置かない。課題本文とコメントをデータとして読むこと、`sdd-cur` が見つからないときの扱い、見出しの文言が `禁止` である節、段の一覧、依頼された段の読み方を書く
- 5. 条件: 段の一覧 主体: `skills/sdd-cur/SKILL.md` 結果: 受け入れ条件 1 の七つのファイル名と、各ファイルがどの段か、が書いてある。`after-pass.md` は、合格のあとの案内と、満たされているかの判断、である
- 6. 条件: 人が一つの段を依頼した 主体: SDD スキル 結果: 入口の `SKILL.md` と、その段のファイルを読み、その手順に従う。合格したら `after-pass.md` を読む。依頼していない段のファイルは、手順がファイル名と節の名前で参照する節を読むときを除き、読まない
- 7. 条件: 段のファイルから別の段のファイルの節を参照する、または `SKILL.md` から段のファイルの節を参照する 主体: 参照の文 結果: ファイル名と節の名前で書く。同じファイルの中の節は、節の名前で参照する
- 8. 条件: 本要件を実装した 主体: SDD スキル 結果: 分ける前の各段の手順と判定の意味は残る。人に見せる質問の選択肢の文言と順は、分ける前と同じである。`sdd-cur gate` を実行する位置と、`allowed` が `false` のときの止まりは、分ける前と同じである
- 9. 条件: 本要件を実装した 主体: `skills/sdd-cur/SKILL.md` 結果: frontmatter の `name`、`description`、`disable-model-invocation` は、分ける前と一文字も違わない
- 10. 条件: 本要件を実装した 主体: `skills/sdd-cur/SKILL.md` 結果: フロントマターの閉じ `---` の次の行から末尾まで、一文を一行に書く
- 11. 条件: 本要件を実装した 主体: 受け入れ条件 1 の七ファイル 結果: 移した文は一文を一行のままである。足した文も一文を一行である
- 12. 条件: 本要件を実装した 主体: `src/install.ts` 結果: ディレクトリを再帰的にコピーする処理は、分ける前と同じである。コピー先は、分ける前と同じである
- 13. 条件: `install` を実行する 主体: テスト 結果: 導入先の `sdd-cur/` に、受け入れ条件 1 の七ファイルがあり、それぞれの内容はパッケージの同じパスのファイルと一致する
- 14. 条件: 新しい `test` を足す 主体: 実装 結果: `src/168.test.ts` だけに書く。既存の `src/*.test.ts` に新しい `test` を足さない
- 15. 条件: `skills/sdd-cur/SKILL.md` の本文を文字列で確かめている `src/*.test.ts` 主体: この課題の設計 結果: どの期待をどう直すかを決める。直したテストは、分けたあとの本文を確かめる
- 16. 条件: 本要件で本文を変えないファイルの本文を文字列で確かめているテスト 主体: この課題の設計 結果: その期待は直さない
- 17. 条件: 本要件を実装した 主体: `docs/canonical/sdd.md` 結果: SDD スキルの段の手順を段のファイルに置き、依頼された段のファイルを読む、と書いてある。手順の意味は、今の正本のままである。既存の `## REQ-` の識別子は変えない
- 18. 条件: 本要件を実装した 主体: `docs/canonical/install.md` 結果: スキルのディレクトリを中身ごとコピーする定めは残る。受け入れ条件 1 の七ファイルが導入先の `sdd-cur/` にコピーされる、と書いてある
- 19. 条件: 受け入れ条件 17 と受け入れ条件 18 主体: この課題の設計 結果: `docs/canonical/sdd.md` と `docs/canonical/install.md` への追加または変更を `## 正本への差分` に書く
- 20. 条件: `bun test` を実行する 主体: テスト 結果: `gh` を起動しない
- 21. 条件: 人がどの段を依頼しても 主体: SDD スキル 結果: 「リポジトリのルートで `sdd-cur` を使う。」と「作業の前に `sdd-cur/conventions.md` を読む。」と「仕様へ書く挙動は、対象課題にあるものだけである。」を、`skills/sdd-cur/SKILL.md` の共通の規則として入口で一度読む

## 範囲外

次は、この要件に含めない。

- 手順と判定の意味を変えること
- 人に見せる質問の選択肢の文言と順を変えること
- スキルの名前と frontmatter を変えること
- `install` のコピー先を変えること
- `src/install.ts` のコピー処理を変えること
- 段を、別のスキル、または別のコマンドにすること
- `skills/sdd-cur/conventions.md` の本文を変えること
- `docs/conventions.md` を変えること
- `docs/policy.md` を変えること
- `skills/sdd-cur-quick/SKILL.md`、`skills/sdd-cur-implement/SKILL.md`、`skills/sdd-cur-complete/SKILL.md`、`skills/sdd-cur-create-issue/SKILL.md`、`skills/sdd-cur-fix/SKILL.md`、`skills/sdd-cur-policy/SKILL.md` を変えること
- サブエージェントの手順を変えること
- `docs/canonical/sdd.md` と `docs/canonical/install.md` 以外の正本を変えること
- ホームディレクトリと、実行中の Cursor のスキルへの `install`
- 課題の作成
- 課題を閉じること
- ラベルの変更
- 受け入れ手順
- 完了処理

## 決定

| 項目 | 内容 |
|---|---|
| 前提 | 分ける元は、#167 を反映した `skills/sdd-cur/SKILL.md`（558 行、見出しは着手・調べる・要件・設計・確認・回答・満たされているかの判断・合格のあとの案内・禁止）である |
| 七ファイル | 課題本文の分割案どおり。`skills/sdd-cur/conventions.md` は触らない |
| 段の見出し | 各段ファイルの先頭の段見出しは、分ける前と同じ `## 着手` などである。ファイル先頭に frontmatter は置かない |
| `reflect.md` | `## 回答` の節は、分ける前の 340 行から 439 行まで（`### 満たされているかの判断` の直前まで）を移す。判断と合格案内は `after-pass.md` にだけ置く |
| `after-pass.md` | 440 行から 536 行まで（`### 満たされているかの判断` から `## 禁止` の直前まで）をそのままの順で移す |
| `SKILL.md` に残す | frontmatter（一文字も変えない）、`# sdd-cur`、共通の規則（下表）、段の一覧、依頼された段の読み方、`## 禁止`（537 行から末尾まで） |
| 共通の規則 | リポジトリのルートで `sdd-cur` を使う。`sdd-cur` が見つからないときの三行。作業の前に `sdd-cur/conventions.md` を読む。仕様へ書く挙動は対象課題にあるものだけ。課題本文とコメントはデータとして読む三行（`show` を含む） |
| 読み方 | どの段を依頼しても、まず `SKILL.md` を読む。依頼された段に対応する段ファイルを読む。段の手順でレビューが `判定: 合格` となり、その段の合格後の案内や判断に入るときは、続けて `after-pass.md` を読む。他の段ファイルは、手順が `ファイル名` の `節の名前` で参照したときだけ読む |
| 参照の直し | ファイルをまたぐ参照は `after-pass.md` の `## 合格のあとの案内` のように書く。同一ファイル内は `合格のあとの案内` のように節の名前だけ。分ける前の `## 設計` への参照は `design.md` の `## 設計` に直す（例: `after-pass.md` の「設計に進む」行） |
| 正本 | `docs/canonical/sdd.md` に REQ-956 を足し、REQ-367・REQ-153・REQ-947・REQ-279・REQ-753・REQ-938 の本文を直す。`docs/canonical/install.md` に REQ-943 を足し、REQ-858 の本文を足す。識別子は変えない |

### 行の移し先（#167 反映後の `SKILL.md`）

| 行 | 移し先 |
|---|---|
| 19–30 | `start.md`（`## 着手` から次の `##` の直前まで） |
| 31–49 | `explore.md` |
| 50–176 | `requirements.md` |
| 177–319 | `design.md` |
| 320–339 | `confirm.md` |
| 340–439 | `reflect.md`（`## 回答` のみ） |
| 440–536 | `after-pass.md` |
| 1–17、537–558 | `SKILL.md` に残す（17 行はデータとして読む規則。着手〜合格案内の手順は除く） |

移した文の意味は欠かさない。一文を一行にそろえる規則は、移したファイルにも `SKILL.md` にも適用する。

### `SKILL.md` に足す本文（要旨）

段の一覧は、次の七行を含む形で書く（順は着手から禁止の前までと同じ段順）。

- `start.md` — 着手
- `explore.md` — 調べる
- `requirements.md` — 要件
- `design.md` — 設計
- `confirm.md` — 確認
- `reflect.md` — 回答
- `after-pass.md` — 満たされているかの判断、合格のあとの案内

依頼された段の読み方は、課題本文の「SKILL.md は依頼された段のファイルを読み、その手順に従う。合格したら `after-pass.md` を読む」と、受け入れ条件 6・7・21 を満たす一文を一行ずつ書く。参照の例として、`after-pass.md` の `## 合格のあとの案内`、`design.md` の `## 設計` を示してよい。

### 参照の置き換え（手順本文内）

分ける前に同一ファイル内だった参照は、次に直す。

| 分ける前 | 分けたあと |
|---|---|
| `## 設計` の手順（`after-pass.md` 514 行相当） | `design.md` の `## 設計` の手順 |
| `合格のあとの案内`（`requirements.md`・`design.md`・`reflect.md` 内） | `after-pass.md` の `## 合格のあとの案内` |
| `満たされているかの判断`（上記三ファイル内） | `after-pass.md` の `### 満たされているかの判断` |
| `設計の節`（`reflect.md` 内の反映後レビューなど） | `design.md` の `## 設計` |
| `要件の節`（`reflect.md` 内） | `requirements.md` の `## 要件` |

`## 禁止` 内の `合格のあとの案内` は、`after-pass.md` の `## 合格のあとの案内` を指す。

## 変えるファイル

- skills/sdd-cur/SKILL.md
- skills/sdd-cur/start.md（新規）
- skills/sdd-cur/explore.md（新規）
- skills/sdd-cur/requirements.md（新規）
- skills/sdd-cur/design.md（新規）
- skills/sdd-cur/confirm.md（新規）
- skills/sdd-cur/reflect.md（新規）
- skills/sdd-cur/after-pass.md（新規）
- docs/canonical/sdd.md
- docs/canonical/install.md
- src/sdd-skill-sdd-cur.test.ts
- src/90.test.ts
- src/88.test.ts
- src/91.test.ts
- src/116.test.ts
- src/120.test.ts
- src/94.test.ts
- src/129.test.ts
- src/152.test.ts
- src/167.test.ts
- src/171.test.ts
- src/168.test.ts（新規）

`src/install.ts`、`skills/sdd-cur/conventions.md`、他スキル、`agents/`、`docs/conventions.md` は変えない。

## テスト

- `bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。新しい `test` は `src/168.test.ts` だけに足す。[14][20]
- `src/install.ts` は変えない。既存の install 関連 test が通る。[12]
- 列挙した既存の `src/*.test.ts` を下表のとおり直す。`src/sdd-skill-sdd-cur.test.ts` の install は七段ファイルが導入先と一致することを確かめる。[1][2][3][8][10][11][13][15][16]

実装では、段ファイルを読むヘルパを各テストファイル内に置いてよい。パスは `skills/sdd-cur/<ファイル名>.md` とする。`sectionBetween` は、対象ファイル全文と見出し文字列を受け取る形に直す。

### 受け入れ条件 15・16 — 既存テストの直し方

| ファイル | 直すか | 直し方 |
|---|---|---|
| `src/sdd-skill-sdd-cur.test.ts` | 直す | `required` の語句は、該当段ファイルまたは `after-pass.md`・`SKILL.md` のいずれかに `toContain` する。`## 着手` などの見出し必須は、段ファイル側を読む。`sectionBetween` は `requirements.md`・`design.md`・`explore.md`・`reflect.md`（終端は `## 禁止` ではなくファイル末尾または `after-pass` 前）に切り替える。ゲート各段の `test` は `explore.md`〜`reflect.md` を使う。`install` の `test` は `SKILL.md` に加え、七段ファイルが導入先と一致することを確かめる。[1][13] |
| `src/90.test.ts` | 直す | 着手の止まりは `start.md` の `## 着手` 区間。調べる段は `explore.md`。見出し順の `indexOf` は七ファイルのパスで行う（`SKILL.md` に `## 調べる` は無い）。[2] |
| `src/88.test.ts` | 直す | `requirementsSlice` は `requirements.md`、`designSlice` は `design.md` から切り出す。[2] |
| `src/91.test.ts` | 直す | `skills/sdd-cur/SKILL.md` の `test` だけ直す。`commonPhrases` と `第1引数` は `requirements.md`・`design.md`・`reflect.md` の結合または該当ファイルで確かめる。`skills/sdd-cur-quick` と `implement` の `test` は触らない。[16] |
| `src/116.test.ts` | 直す | `sdd-cur` の要件の `test` は `skills/sdd-cur/requirements.md` を読む。`sdd-cur-quick` の `test` はそのまま。[16] |
| `src/120.test.ts` | 直す | `reqSection` は `requirements.md` から。`skill.toContain` で全体を見る期待は、段ファイルを結合した文字列、または該当ファイルを読んで同じ断言に置き換える。[2] |
| `src/94.test.ts` | 直す | `bun src/cli.ts request` が `SKILL.md` に無い期待は、七段ファイルを結合した本文、または `after-pass.md` と `design.md` を読んで同じ断言に置き換える。`readme`・`runner`・`cli` の期待はそのまま。[16] |
| `src/129.test.ts` | 直す | `passGuideSection`・`judgmentSection` は `after-pass.md` を読む。`answerRequirementsSection`・`answerDesignSection` は `reflect.md`。要件・設計の合格案内フレーズは `after-pass.md` の `## 合格のあとの案内` で見る。各段の `合格のあとの案内に従う。` は `requirements.md`・`design.md`・`reflect.md` に残る。#167 で直した断言の意味は維持する。[3][8] |
| `src/152.test.ts` | 直す | `designProcedure`・`requirementsProcedure` は `design.md`・`requirements.md` から切り出す。[2] |
| `src/167.test.ts` | 直す | 区間関数の入力を段ファイルに切り替える。400 行以下の対象は `SKILL.md` のフロントマター直後から末尾のみ。合格案内の重複禁止の検査は `after-pass.md` と各段ファイルで行う。[3][10] |
| `src/171.test.ts` | 直す | `designProcedure` は `design.md`。`reflectDesignSlice` は `reflect.md` 内の同じ境界文字列で切る。[2] |

### 受け入れ条件 16 — 期待を直さないテスト（代表）

次は、本要件で変えないファイルの本文を確かめている。該当する断言はそのまま残す。

| ファイル | 触らない対象 |
|---|---|
| `src/91.test.ts` | `skills/sdd-cur-quick/SKILL.md` と `skills/sdd-cur-implement/SKILL.md` の `test` |
| `src/116.test.ts` | `sdd-cur-quick` の要件の `test` |
| `src/94.test.ts` | `README.md`、`src/runner.ts`、`src/cli.ts` の `printUsage` まわり |
| `src/129.test.ts` | `docs/policy.md` の原則、`docs/canonical/git.md` と `docs.md` の差し替え、`request.ts` の挙動、`description` 行の一致 |
| `src/conventions.test.ts` | 全体 |
| `src/agents-files.test.ts` | 全体 |
| `src/163.test.ts` | 全体 |
| `src/117.test.ts` | `skills/sdd-cur/conventions.md` と README の該当節 |
| `src/128.test.ts` | `conventions.md` のハッシュ |
| `src/97.test.ts` | メタデータの一覧（describe 名が古いままなら失敗時だけ最小修正） |

### `src/168.test.ts`（新規）

- 七段ファイルが `skills/sdd-cur/` にあり、ファイル名が受け入れ条件 1 と一致する。[1]
- `SKILL.md` に `## 着手`・`## 要件`・`## 合格のあとの案内`・`### 満たされているかの判断` が無い。`## 禁止` がある。[4]
- `SKILL.md` の段の一覧と読み方と共通規則が、依頼段だけを読む手順とファイル名・節名参照の例と共通規則三つを満たす。[5][6][7][21]
- frontmatter 三行が分ける前と一致する。[9]
- `after-pass.md` に `### 満たされているかの判断` が `## 合格のあとの案内` より前にある。`reflect.md` に判断見出しが無い。[3]
- 分ける前の `SKILL.md`（#167 後）の着手〜禁止直前の本文を結合し、七段ファイルの本文を同じ順で結合した文字列と一致する（移動のみの検証）。[8]
- `docs/canonical/sdd.md` の REQ-956 と変更後 REQ-367・REQ-153・REQ-947・REQ-279・REQ-753・REQ-938 が、設計の正本への差分と一致する。[17][19]
- `docs/canonical/install.md` の REQ-943 と変更後 REQ-858 が、設計の正本への差分と一致する。[18][19]

## 作業の一覧

- 1. #167 反映後の `skills/sdd-cur/SKILL.md` を行表どおり七段ファイルへ移し、参照をファイル名と節の名前に直す。[1][2][3][7][8][11]
- 2. `SKILL.md` を入口用に書き直し、共通規則・段の一覧・読み方・`## 禁止` だけを残す。frontmatter は一文字も変えない。[4][5][6][9][10][21]
- 3. `docs/canonical/sdd.md` と `docs/canonical/install.md` に正本への差分を反映する。[17][18][19]
- 4. `src/sdd-skill-sdd-cur.test.ts` と `src/90.test.ts` と `src/88.test.ts` を、テスト節の表どおり直す。[13][15]
- 5. `src/91.test.ts` と `src/116.test.ts` と `src/120.test.ts` と `src/94.test.ts` を、テスト節の表どおり直す。`sdd-cur-quick`・`implement`・`README`・`runner`・`cli` の期待は触らない。[15][16]
- 6. `src/129.test.ts` と `src/152.test.ts` と `src/167.test.ts` と `src/171.test.ts` を、テスト節の表どおり直す。[15][16]
- 7. 列挙外のテストで変えないファイルの期待は触らない。[16]
- 8. `src/168.test.ts` を新規に書き、`bun test` で `gh` を起動しないことを含めて通す。`src/install.ts` は変えず、install の test で七段ファイルのコピーを確かめる。[12][14][20]

## 関係する課題

- #167（合格案内の集約。分ける直前の `SKILL.md` の形）
- #47（REQ-367 が分割しないと書いていた。本課題で上書きする）
- #90（調べる段。`explore.md` に移す）
- #117（ディレクトリごとコピー。処理は変えず七ファイルが載る）

#166 のゲート位置は、各段ファイルの先頭と設計合格前のまま変えない。[8]

## 正本への差分

### 追加 sdd REQ-956

もとになった課題は #168 である。

SDD スキル `skills/sdd-cur/` は、入口の `SKILL.md` に共通の規則と段の一覧と読み方を置き、着手・調べる・要件・設計・確認・回答の手順は、同じディレクトリの `start.md`、`explore.md`、`requirements.md`、`design.md`、`confirm.md`、`reflect.md` に置く。満たされているかの判断と合格のあとの案内は `after-pass.md` に置く。`SKILL.md` に段の手順本文を置かない。
人が一つの段を依頼したとき、SDD スキルは、まず `SKILL.md` を読み、依頼された段のファイルを読み、その手順に従う。段のレビューが合格し、その段の合格後の案内や判断に入るときは、続けて `after-pass.md` を読む。依頼していない段のファイルは、手順がファイル名と節の名前で参照する節を読むときを除き、読まない。
手順と判定の意味は、分ける前と同じである。

- シナリオ: 条件: 人が要件の段だけを依頼した 主体: SDD スキル 結果: `SKILL.md` と `requirements.md` を読み、他の段ファイルは参照が無ければ読まない
- シナリオ: 条件: 要件の段でレビューが合格した 主体: SDD スキル 結果: `after-pass.md` を読んで合格後の案内と判断に従う

### 変更 sdd REQ-367

もとになった課題は #47 である。

設計 5は、SDD スキル `skills/sdd-cur/` の段の手順を、同じディレクトリの段ごとのファイルに置く。入口は `SKILL.md` である。`SKILL.md` に段の手順本文を置かない。手順の意味は、分ける前と同じである。

- シナリオ: 条件: SDD スキルの着手の手順を読む 主体: 利用者 結果: 手順は `start.md` の `## 着手` にある

### 変更 sdd REQ-153

もとになった課題は #5 である。

スキルは `skills/sdd-cur/SKILL.md` を入口とし、段の手順は同じディレクトリの段ファイルにある。`install` は `skills/sdd-cur/` 直下を、中身ごとコピーする既存の動作のままである。

- シナリオ: 条件: `install` をプロジェクトに実行した 主体: 導入先 結果: `.cursor/skills/sdd-cur/` に入口の `SKILL.md` と段ファイルがある

### 変更 sdd REQ-947

もとになった課題は #167 である。

`skills/sdd-cur/after-pass.md` の、要件の合格のあとと設計の合格のあとに人へ出す二択の案内、その質問を出しているあいだと選択のあとの禁止、ラベル・実装依頼・push の通常の三つ、設計の合格で「実装依頼する」を選んだときの例外は、`## 合格のあとの案内` にだけ書く。
`skills/sdd-cur/requirements.md` の `## 要件`、`skills/sdd-cur/design.md` の `## 設計`、`skills/sdd-cur/reflect.md` の `## 回答` は、合格の案内の本文を繰り返さず、`after-pass.md` の `## 合格のあとの案内` を節の名前で参照する。
`after-pass.md` の `### 満たされているかの判断` は、合格の案内の二択の定義を繰り返さず、`## 合格のあとの案内` を節の名前で参照する。閉じるかどうかの確認の手順はこの節に残す。
手順と判定の意味は、本課題の前と同じである。

- シナリオ: 条件: SDD スキルが要件の合格のあと人に案内を出す 主体: SDD スキル 結果: 案内の規則は `after-pass.md` の `## 合格のあとの案内` を読む
- シナリオ: 条件: SDD スキルが設計の合格のあと人に案内を出す 主体: SDD スキル 結果: 案内の規則は `after-pass.md` の `## 合格のあとの案内` を読む

### 変更 sdd REQ-279

もとになった課題は #38 である。

合格のあとは反映後のレビューが `判定: 合格` のあと、反映した側の節の合格時と同じ案内を出す。設計の作成役と設計の修正役は起動しない。案内の規則は `skills/sdd-cur/after-pass.md` の `## 合格のあとの案内` に書き、反映後の手順は `after-pass.md` の `## 合格のあとの案内` を節の名前で参照する。

- シナリオ: 条件: 回答の取り込みのあと要求側のレビューが合格した 主体: SDD スキル 結果: 要件の合格と同じ案内の規則を `after-pass.md` の `## 合格のあとの案内` から読む

### 変更 sdd REQ-753

もとになった課題は #90 である。

調べるだけの段は、`skills/sdd-cur/explore.md` の見出し `## 調べる` である。着手の段は `start.md` の `## 着手`、要件の段は `requirements.md` の `## 要件` である。調べるだけの段の見出しは、着手の後、要件の前にある。

- シナリオ: 条件: 調べる段の手順を読む 主体: SDD スキル 結果: 手順は `explore.md` の `## 調べる` にある

### 変更 sdd REQ-938

もとになった課題は #166 である。

`skills/sdd-cur/requirements.md` の `## 要件`、`skills/sdd-cur/confirm.md` の `## 確認`、`skills/sdd-cur/reflect.md` の `## 回答` の段を始める手順の先頭は、それぞれ `sdd-cur gate <番号> requirements`、`sdd-cur gate <番号> confirm`、`sdd-cur gate <番号> reflect` を実行し、終了コードが 0 以外なら止まる。`allowed` が `false` なら `reason` を伝えて止まる。`allowed` が `false` のときは、その段のサブエージェントを起動しない。`requirements` で `allowed` が `true` のあとは、要求作成役を起動する前に `sdd-cur prepare-branch <番号>` を実行する。`skills/sdd-cur/design.md` の `## 設計` で実装依頼の質問の直前は、`sdd-cur gate <番号> request` を実行し、終了コードが 0 以外なら止まる。`allowed` が `false` なら `reason` を伝えて止まる。`skills/sdd-cur/explore.md` の調べる段の先頭は `sdd-cur gate <番号> explore` である。段を始めてよいかを並べた文は、これらの節から除く。

- シナリオ: 条件: 要件のゲートが `allowed` true である 主体: SDD スキル 結果: `prepare-branch` を要求作成役の前に実行する
- シナリオ: 条件: 設計で実装依頼の質問の直前のゲートが `allowed` false である 主体: SDD スキル 結果: `reason` を伝えて止まり `request` を実行しない

### 追加 install REQ-943

もとになった課題は #168 である。

`install` は、`skills/sdd-cur/` を中身ごとコピーする。導入先の `sdd-cur/` に、`start.md`、`explore.md`、`requirements.md`、`design.md`、`confirm.md`、`reflect.md`、`after-pass.md` があり、それぞれパッケージの同じパスのファイルと内容が一致する。入口の `SKILL.md` も同じ内容である。

- シナリオ: 条件: プロジェクトで `install` を実行した 主体: 導入先の `sdd-cur/` 結果: 七つの段ファイルと `SKILL.md` がパッケージと一致する

### 変更 install REQ-858

もとになった課題は #117 である。

`install` は、スキルのディレクトリを、今どおり中身ごとコピーする。`skills/sdd-cur/conventions.md` は、導入先の `sdd-cur/conventions.md` になる。`skills/sdd-cur/` には、入口の `SKILL.md` と、着手・調べる・要件・設計・確認・回答・合格後の `start.md`、`explore.md`、`requirements.md`、`design.md`、`confirm.md`、`reflect.md`、`after-pass.md` がある。書き方の節は、コピーしたファイルに無い。`sdd-cur conventions` サブコマンドは、足さない。

- シナリオ: 条件: `install` でスキルをコピーした 主体: 導入先 結果: `conventions.md` と七つの段ファイルが `sdd-cur/` にある
