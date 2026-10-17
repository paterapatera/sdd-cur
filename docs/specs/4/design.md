# 4 docs/specs レイアウトと課題コメント種別

対象は [Issue #4](https://github.com/paterapatera/sdd-cur/issues/4)。要件と設計の置き場所、課題コメントの種別、未反映の回答の判定を、スキルとランナーが同じ約束として参照できるようにする。

## 受け入れ条件

- `docs/conventions.md` に、課題ごとのファイル、三つのコメント種別、未反映の回答の判定が書いてある。
- README と AGENTS.md から、その文書へ辿れる。
- `src/conventions.ts` を import すれば、パス、種別、確認と回答の対応、反映済み id、未反映の回答を同じ規則で得られる。
- `bun test` は `gh` を起動しない。

## 範囲外

次は作らない。

- 確認コメントの投稿、回答本文の要件または設計への取り込み（#5）
- SDD スキルの本文と、`install` がコピーするスキル（#5）
- 受け入れ手順コメントの投稿、ラベルの付け替え、`poll` と `process`（#6）
- 完了処理（#7）
- `src/github.ts`、`src/cli.ts`、`src/runner.ts`、`src/run.ts`、`src/labels.ts`、`src/install.ts` の変更
- 新しいサブコマンド
- 課題 1〜3 の `design.md` の書き換えと、それらへの `requirements.md` の追加
- 課題の作成とクローズ
- `author` によるコメントの絞り込み
- Forgejo、Jira、Backlog
- 依存パッケージ

## 決定

| 項目 | 内容 |
|---|---|
| 約束 | `docs/conventions.md`。この設計のファイル、コメント、対応、反映済み、未反映を短く書く。この設計に無い規則は足さない |
| 判定 | `src/conventions.ts`。同期関数だけである。ファイルは読まない。`gh` は呼ばない。呼び出し側が文字列を渡す |
| パス | `docs/specs/<番号>/requirements.md` と `docs/specs/<番号>/design.md`。`<番号>` は十進で、先頭の零は付けない |
| 既存 | 課題 1〜3 は `design.md` だけのまま残す。見出しはすでにこの規則を満たす |
| 見出し | 最初の非空行が `# <番号> ` で始まり、その後ろに題が一つ以上ある |
| 種別 | 最初の非空行が、下の印と一文字も違わない |
| 対応 | `createdAt` の昇順、同じときは `id` の昇順で見て、未対応のうちいちばん古い確認に回答を一つ付ける |
| 受け入れ手順 | 同じ順の最後の一件を現在の手順とする。無いときは無い。投稿は #6 |
| 反映済み | 各ファイルの末尾ブロックに、取り込んだ回答コメントの `id` だけを書く。確認文も回答文も書かない |
| 未反映 | 対応づいた回答のうち、要件と設計のどちらのブロックにも `id` が無いもの |
| 書く場所 | 確認と回答は課題のコメントだけに書く。要件、設計、コミットメッセージ、マージリクエストには書かない |

`docs/conventions.md` には、未回答の確認があるあいだ次の確認を投稿しない、と書く。投稿の抑制は #5 が `unanswered` を見て行う。この課題は投稿しない。

## パスと見出し

```ts
export function specPaths(issueNumber: number): {
  dir: string
  requirements: string
  design: string
}

export function isSpecHeading(markdown: string, issueNumber: number): boolean
```

`specPaths` は、`issueNumber` が 1 以上の安全な整数でないとき `番号が不正です` で拒否する。返すパスは `/` 区切りのリポジトリ相対パスである。`4` は `docs/specs/4`、`docs/specs/4/requirements.md`、`docs/specs/4/design.md` である。

`isSpecHeading` は改行を `\n` にそろえたあと、前後の空白だけの行を飛ばす。最初の非空行が `# `、`String(issueNumber)`、空白一つ、のあと、空白以外の文字を一つ以上持つときだけ true である。`# 04 ` や、番号のあとに空白が無い行は false である。

## コメント

印は次の定数だけが持つ。

```ts
export const commentMarkers: {
  readonly confirm: "sdd-cur: 確認"
  readonly answer: "sdd-cur: 回答"
  readonly acceptance: "sdd-cur: 受け入れ手順"
}

export type CommentKind = "confirm" | "answer" | "acceptance" | "other"

export type ParsedComment = {
  kind: CommentKind
  payload: string
}

export function parseComment(body: string): ParsedComment
```

`parseComment` は、まず `\r\n` と単独の `\r` を `\n` にする。最初の非空行は、`trim` して空でない最初の行である。その行が印と完全一致するとき、その種別になる。一致は `trim` した値では見ない。印の行の前後に空白があれば `other` である。印が最初の非空行でなければ `other` である。

種別が印のとき、`payload` は印の行より後ろの行を `\n` で結合した文字列である。印が末尾のときは空文字である。`other` の `payload` は、改行をそろえた本文全体である。

## 対応

```ts
import type { IssueComment } from "./github.ts"

export type RelatedComments = {
  pairs: { confirm: IssueComment; answer: IssueComment }[]
  unanswered: IssueComment[]
  unpairedAnswers: IssueComment[]
  acceptance: IssueComment | null
}

export function relateComments(
  comments: readonly IssueComment[],
): RelatedComments
```

`relateComments` は引数の配列を変えない。見る順は `createdAt` の文字列昇順、同じときは `id` の文字列昇順である。日付への変換はしない。`other` は対応にも受け入れ手順にも使わない。

歩きながら、`confirm` は未対応の列の末尾に足す。`answer` は、未対応の列の先頭の確認と組にして `pairs` に足し、その確認を列から外す。未対応が空のときの回答は `unpairedAnswers` に足す。歩き終わって残った確認が `unanswered` である。`pairs`、`unanswered`、`unpairedAnswers` の並びは、この歩きで足した順である。要素は引数と同じオブジェクトである。

`acceptance` は、同じ順で最後に現れた受け入れ手順である。無いときは `null` である。受け入れ手順は確認の列を消費しない。

## 反映済み

開始行は、`<!--`、空白一つ、`sdd-cur:reflected` を、この順で連結した一行である。終了行は `-->` だけの行である。ブロックはこの二行と、そのあいだの id 行である。

```ts
export const reflectedMarker = "sdd-cur:reflected"
export const reflectedOpenLine: string
export const reflectedCloseLine = "-->"

export function readReflectedIds(markdown: string): string[]

export function withReflectedId(markdown: string, commentId: string): string
```

`reflectedOpenLine` は、上の連結と同じ文字列である。`src/conventions.ts` ではこの定数を使い、開始行の字面を別の場所で組み立て直さない。

`readReflectedIds` は改行を `\n` にそろえる。開始行が無いときは空配列である。開始行が二行以上あるときは `反映済みの記録が複数あります` で拒否する。終了行が開始行より後ろに無いときは `反映済みの記録を解釈できません` で拒否する。

開始行と終了行のあいだでは、`trim` して空の行は飛ばす。それ以外の行は、前後に空白が無く、空白、`<`、`>` を含まないときだけ id である。そうでない行、または同じ id が二度あるときは `反映済みの記録を解釈できません` で拒否する。終了行のあと、`trim` して空でない行があるときも同じ理由で拒否する。戻り値は、ブロック内の出現順である。

`withReflectedId` は、先に `commentId` を見る。空、空白、`<`、`>` のいずれかを含むときは、本文を見ずに `反映するコメントが不正です` で拒否する。id が正当なときは、本文の改行を `\n` にそろえてから `readReflectedIds` を呼ぶ。拒否されたらその理由のまま拒否する。成功時の戻り値は、このそろえた文字列に対する結果であり、常に `\n` だけを改行に使う。

id がすでに含まれるときは、そろえた本文をそのまま返す。含まれないときは、既存の id の末尾に足したブロックで、そろえた本文の開始行から文末までを置き換える。開始行が無いときは、そろえた本文が空でなく、かつ `\n` で終わっていなければ `\n` を一つ足してから、ブロックを末尾に足す。ブロックは開始行、id が一つ以上あるときは改行区切りの id、終了行、末尾の `\n` である。id が無いブロックは作らない。

この課題の `design.md` と、課題 1〜3 の `design.md` には、開始行そのものの行を書かない。例は `docs/conventions.md` に一つだけ、開始行と終了行を両方含む囲みコードブロックとして置く。囲みの外には開始行を書かない。

## 未反映

```ts
export function unincorporatedAnswers(
  comments: readonly IssueComment[],
  specs: { requirements: string; design: string },
): IssueComment[]
```

`relateComments` の `pairs` のうち、回答の `id` が `readReflectedIds(specs.requirements)` と `readReflectedIds(specs.design)` のどちらにも無いものを、`pairs` の順で返す。`unpairedAnswers` と `unanswered` は含めない。どちらかの読み取りが拒否されたときは、その理由で拒否する。ファイルが無いときは、呼び出し側が空文字を渡す。空文字は反映済み id が無いと同じである。

## テスト

`src/conventions.test.ts` に置き、`bun:test` の `describe` と `test` を使う。`gh` は起動しない。一時ディレクトリは使わない。

- `specPaths` は、1 未満、整数でない、安全な整数でない番号を `番号が不正です` で拒否する。`4` の三つのパスが、上の文字列と一致する。
- `isSpecHeading` は、先頭の空行を飛ばし、`# 4 ` のあとに題があるときだけ true である。番号が違う、空白が無い、題が無いときは false である。課題 1〜3 の `design.md` は、それぞれの番号で true である。
- `parseComment` は三つの印を見分ける。印の前の空行は無視する。印の行に余分な空白があるとき、印が最初の非空行でないときは `other` である。印が末尾のとき `payload` は空文字である。印の次の空行は `payload` に残る。
- `relateComments` は引数の配列を変えない。確認、そのあいだの `other` と受け入れ手順、回答の順で、その確認と回答を組にする。未対応が無い回答は `unpairedAnswers` である。残った確認は `unanswered` である。受け入れ手順が複数のときは最後の一件、無いときは `null` である。
- `readReflectedIds` は、開始行が無いとき空配列である。id は上から返す。空行は飛ばす。開始行が二つあるときは `反映済みの記録が複数あります`。終了行が無いとき、id に空白または `<` か `>` があるとき、同じ id が二度あるとき、終了行のあとに本文があるときは `反映済みの記録を解釈できません`。
- `withReflectedId` は、不正な id を本文より先に `反映するコメントが不正です` で拒否する。開始行が無い本文の末尾にブロックを足す。すでにある id は重複させず、改行を `\n` にそろえた本文を返す。新しい id は既存のうしろに足す。`\r\n` の本文でも、id がすでにあるときと、新しく足すときのどちらも、戻り値の改行は `\n` だけである。
- `unincorporatedAnswers` は、対応づいた回答のうち、二つの本文のどちらにも id が無いものだけを、`pairs` の順で返す。対応の無い回答は含めない。要件の本文が拒否されるときは、その理由で拒否する。

文書の確認も同じテストファイルで行う。

- `docs/conventions.md` に、三つの印、`sdd-cur:reflected`、`requirements.md`、`design.md`、`課題のコメントだけに書く`、`未回答の確認があるあいだ、次の確認は投稿しない` が含まれる。開始行の例は囲みコードブロックの中にあり、同じブロックに終了行 `-->` がある。囲みの外に開始行は無い。
- `README.md` と `AGENTS.md` に `docs/conventions.md` が含まれる。`AGENTS.md` に `src/conventions.ts` が含まれる。

## 実装の順序

1. `specPaths`、`isSpecHeading`、`parseComment`、`relateComments`、`readReflectedIds`、`withReflectedId`、`unincorporatedAnswers` を `src/conventions.ts` に置き、関数テストを通す。
2. `docs/conventions.md` を書き、印、パス、課題コメントだけに書くこと、未回答のあいだは次の確認を投稿しないことを、上の文書テストで確かめる。開始行の例は、このファイルの囲みコードブロックの中に、終了行と組で一つだけ置く。
3. README のディレクトリに `docs/conventions.md` を足し、約束へのリンクを書く。実装済みの設計の列挙に、この設計を足す。AGENTS.md の「着手前に読むもの」に `docs/conventions.md` を足し、「構成」に `docs/conventions.md` と `src/conventions.ts` を足す。
