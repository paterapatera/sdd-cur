# 5 SDD スキル: 着手提案・要件・設計

対象は [Issue #5](https://github.com/paterapatera/sdd-cur/issues/5)。Project A の Cursor が読む SDD スキルを作り、`install` で配置する。手順は、着手候補の提示、要件、設計、人が承認した確認の投稿、未反映の回答の取り込みである。

## 受け入れ条件

- `bun src/cli.ts install <project-root>` が、`<project-root>/.cursor/skills/sdd-cur/SKILL.md` をパッケージの `skills/sdd-cur/SKILL.md` と同じ内容で置く。
- スキルの手順で、着手候補の提示、要件、設計、承認後の確認投稿、未反映の回答の取り込みができる。課題の作成、ラベルの変更、実装、受け入れ手順、完了処理は手順に含まない。
- `bun test` は `gh` を起動しない。

## 範囲外

次は作らない。

- 実装用スキル、`poll` と `process`、ラベルの付け替え、受け入れ手順の投稿（#6）
- 完了処理、完了スキル、スカッシュマージ、「マージ済み」（#7）
- 課題の作成とクローズ。回答コメントの投稿。`commit` と `push`
- `src/github.ts`、`src/install.ts`、`src/run.ts`、`src/runner.ts`、`src/labels.ts`、`src/conventions.ts` の変更
- `docs/conventions.md`、`docs/plan.md`、課題 1〜4 の `design.md` の書き換え
- スキルディレクトリの中のスクリプト。手順は `SKILL.md` だけが持つ
- オープンな課題の 101 件目以降。`listIssues` の続きは取らない
- `author` によるコメントの絞り込み
- 確認の本文を、要件、設計、コミットメッセージ、マージリクエストへ書くこと
- Forgejo、Jira、Backlog
- 依存パッケージ。`package.json` の変更
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| スキル | `skills/sdd-cur/SKILL.md`。`install` は直下のディレクトリをコピーする既存の動作のまま |
| 判定と投稿 | `src/sdd.ts`。スキルはファイルを直接 import しない。入口は下の四つのサブコマンドだけ |
| 同じ規則 | パス、見出し、印、対応、反映済み id は `src/conventions.ts` を使う。ラベル名は `workflowLabels` の `name` だけを使う。スキルもサブコマンドも、この規則を別の字面で再実装しない |
| GitHub | サブコマンドが `resolveRepo` と `createGitHub` を、`labels` と同じく作業ツリーの `cwd` で呼ぶ。`gh` をスキルの手順から直接起動しない |
| 承認 | 確認の投稿は、人がその payload を承認したあとだけ `confirm` を実行する。関数は承認を待たず、渡された payload を投稿する |
| 着手 | 候補を見せる。選ぶのは人である。候補が空でも課題は作らない |
| 成果 | 書いてよいファイルは `specPaths` の `requirements` と `design` だけである |
| 確認 | 最初の非空行は `commentMarkers.confirm`。未反映の回答があるとき、および未回答の確認があるときは投稿しない |
| 回答 | 人が課題に書く。取り込むのは `unincorporatedAnswers` の先頭一件だけ。id の記録は `reflect` が `withReflectedId` で行う |
| 使い方 | 既存の三行のあとに、四つのサブコマンドをこの順で足す。`install`、`run`、`labels` の動作は変えない |

使い方の全文は次である。

```
sdd-cur install [project-root]
sdd-cur run [--interval-min <1 以上 1440 以下の整数>]
sdd-cur labels
sdd-cur candidates
sdd-cur show <番号>
sdd-cur confirm <番号>
sdd-cur reflect <番号> <requirements|design>
```

## サブコマンド

引数の数が違うときは、使い方を標準エラーへ書き、終了コード 1 で終わる。ドメインの失敗は、理由を標準エラーへ一行書き、使い方は書かない。終了コードは 1 である。成功時の終了コードは 0 である。

課題番号の文字列は、`1` から `9` で始まり、以降が数字だけであり、`Number` が 1 以上の安全な整数である。`01`、小数、空白を含む文字列は `番号が不正です` である。種別は `requirements` と `design` だけが正しく、それ以外は `種別が不正です` である。番号を先に見、種別はその次である。この検証で拒否するときは `gh` を呼ばない。

`--help` と `-h` は、引数のどこにあっても、これまでどおり使い方を標準エラーへ書いて終了コード 0 で終わる。`confirm` と `reflect` は実行しない。

| サブコマンド | 引数 | 標準入力 | 成功時の標準出力 |
|---|---|---|---|
| `candidates` | なし | 読まない | `candidateViews` の JSON 一行。空なら `[]` |
| `show` | 番号 | 読まない | `IssueView` の JSON 一行 |
| `confirm` | 番号 | payload の全文 | `addComment` が返した URL 一行 |
| `reflect` | 番号、種別 | id を足す前の、決定を書いたファイル全文 | `反映しました: <id>` |

JSON は `JSON.stringify` の結果を一行で書く。キーの順は、下のオブジェクトリテラルの順である。テストは `JSON.parse` してフィールドを見る。

`confirm` と `reflect` は、標準入力を UTF-8 の文字列として最後まで読む。payload とファイル本文は、空の判定と印の判定にだけ別の処理を使い、渡す文字列の空白は削らない。

`show`、`confirm`、`reflect` は、ローカルの仕様ファイルを `gh` より先に読む。ただし `confirm` は、番号と `confirmationBody` が通ってから読む。`readReflectedIds` が拒否したときは、その理由で終わり、`gh` は呼ばない。ファイルが無いときは空文字であり、エラーではない。`ENOENT` 以外で読めないとき、およびパスがディレクトリのときは `仕様を読めません` で、`gh` は呼ばない。

`show` の手順は一列である。番号、両方の `readSpecFile`、両方の `readReflectedIds`、`loadIssueView` の順で、拒否した時点より後は呼ばない。`readReflectedIds` が拒否したときは `getIssue` を呼ばない。

`confirm` の手順は一列である。途中で拒否したときは、それより後を呼ばない。

1. 番号が不正なら `番号が不正です`。標準入力もファイルも見ない。
2. 標準入力を読み、`confirmationBody` が拒否したときは、ファイルも `gh` も見ない。
3. 両方の `readSpecFile`。
4. 両方の `readReflectedIds`。
5. `postConfirmation` に、番号、payload、二つの本文を渡す。

## 候補

```ts
export type Candidate = {
  number: number
  title: string
  url: string
}

export function candidateViews(issues: readonly Issue[]): Candidate[]

export function listStartCandidates(github: {
  listIssues: GitHubClient["listIssues"]
}): Promise<Candidate[]>
```

`candidateViews` は引数の配列を変えない。`state` が `open` であり、`labels` が `workflowLabels` のどの `name` とも一致しない課題だけを残す。一致は完全一致である。並びは `number` の昇順である。返すフィールドは `number`、`title`、`url` だけである。

`listStartCandidates` は `listIssues({ state: "open", limit: 100 })` を一回だけ呼ぶ。`labels` は渡さない。結果を `candidateViews` に渡す。

## 課題の表示

```ts
export type SpecStatus = "missing" | "invalid" | "ready"

export function specStatus(
  exists: boolean,
  markdown: string,
  issueNumber: number,
): SpecStatus

export type IssueView = {
  issue: {
    number: number
    title: string
    body: string
    state: "open" | "closed"
    labels: string[]
    url: string
  }
  comments: {
    id: string
    kind: CommentKind
    payload: string
    createdAt: string
  }[]
  unanswered: { id: string; payload: string }[]
  nextAnswer: { id: string; payload: string } | null
  specs: { requirements: SpecStatus; design: SpecStatus }
}

export function buildIssueView(input: {
  issue: Issue
  comments: readonly IssueComment[]
  requirements: { exists: boolean; markdown: string }
  design: { exists: boolean; markdown: string }
}): IssueView

export function loadIssueView(
  github: {
    getIssue: GitHubClient["getIssue"]
    listComments: GitHubClient["listComments"]
  },
  issueNumber: number,
  files: {
    requirements: { exists: boolean; markdown: string }
    design: { exists: boolean; markdown: string }
  },
): Promise<IssueView>
```

`specStatus` は、`exists` が false のとき `missing` であり、本文は見ない。true のときは改行を `\n` にそろえ、空行しか無いとき `missing`、`isSpecHeading` が true のとき `ready`、それ以外は `invalid` である。

`buildIssueView` は、コメントを `createdAt` の昇順、同じときは `id` の昇順に並べ、全部を `comments` に入れる。`kind` と `payload` は `parseComment` の結果である。`author` は入れない。`unanswered` は `relateComments` の `unanswered` を、その順で `{ id, payload }` にしたものである。`nextAnswer` は、下の先頭一件の `id` と `payload` であり、無いときは `null` である。`specs` はそれぞれの `specStatus` である。どちらの本文も `readReflectedIds` を通し、拒否されたときはその理由で拒否する。

`loadIssueView` は、番号が不正なら `getIssue` を呼ばない。番号が正しいときは `getIssue`、成功したあと `listComments`、そのあと `buildIssueView` である。`getIssue` が拒否したときは `listComments` を呼ばない。

```ts
export function nextUnincorporatedAnswer(
  comments: readonly IssueComment[],
  specs: { requirements: string; design: string },
): IssueComment | null
```

`unincorporatedAnswers` の先頭である。無いときは `null` である。返すオブジェクトは、引数のコメントと同じ参照である。対応の無い回答は返さない。

## 確認

```ts
export function specHeading(issueNumber: number, title: string): string

export function confirmationBody(payload: string): string

export function assertSpecWorkAllowed(issue: Issue): void

export function postConfirmation(
  github: {
    getIssue: GitHubClient["getIssue"]
    listComments: GitHubClient["listComments"]
    addComment: GitHubClient["addComment"]
  },
  issueNumber: number,
  payload: string,
  specs: { requirements: string; design: string },
): Promise<{ url: string }>
```

`specHeading` は、番号が不正なら `番号が不正です` で拒否する。題は、前後の空白を除いて空のとき、または改行を含むとき `題が不正です` で拒否する。題の文字列はそれ以外を変えない。戻り値は `# `、番号、空白一つ、題を連結した一行である。`isSpecHeading` を満たす。

`confirmationBody` は、番号を見ない。payload の前後の空白を除いて空のときは `確認の本文が空です` で拒否する。空でないときは、改行を `\n` にそろえたあと、`trim` して空でない最初の行が三つの印のどれかと完全一致するとき `確認の本文に印を含めない` で拒否する。成功時は `commentMarkers.confirm`、`\n`、渡された payload を連結した文字列である。payload の空白は削らない。

`assertSpecWorkAllowed` は、`state` が `open` でないとき `課題は閉じています` で拒否する。開いていて、`workflowLabels` のいずれかの `name` を `labels` が持つときは `実装のラベルが付いています` で拒否する。閉じている課題は、ラベルより先に `課題は閉じています` である。

`postConfirmation` は次の順で、拒否した時点より後を呼ばない。

1. 番号が不正なら `番号が不正です`。payload も `specs` も見ない。
2. `confirmationBody`。
3. 両方の本文を `readReflectedIds` に通す。拒否したときは `getIssue` を呼ばない。
4. `getIssue`。
5. `assertSpecWorkAllowed`。
6. `listComments`。
7. `nextUnincorporatedAnswer(comments, specs)` が `null` でないとき `未反映の回答があります`。
8. `relateComments` の `unanswered` が空でないとき `未回答の確認があります`。
9. `addComment` に、番号と `confirmationBody` の戻り値を渡す。戻り値の `url` を返す。

`editLabels` は呼ばない。

## 反映

```ts
export function assertRequirementsReady(
  exists: boolean,
  markdown: string,
  issueNumber: number,
): void

export function applyIncorporatedAnswer(input: {
  issueNumber: number
  kind: "requirements" | "design"
  requirements: { exists: boolean; markdown: string }
  design: { exists: boolean; markdown: string }
  comments: readonly IssueComment[]
  edited: string
}): { requirements: string; design: string; answerId: string }

export function readSpecFile(
  filePath: string,
): Promise<{ exists: boolean; markdown: string }>

export function writeSpecFile(filePath: string, markdown: string): Promise<void>
```

`assertRequirementsReady` は、`specStatus` が `missing` のとき `要件がありません`、`invalid` のとき `要件の見出しが不正です` で拒否する。`ready` のときは何もしない。

`applyIncorporatedAnswer` はファイルを書かない。次の順で、拒否したら戻り値は無い。

1. 番号が不正なら `番号が不正です`。
2. `kind` が `design` のときは `assertRequirementsReady` を要件のファイルに対して呼ぶ。
3. 書き込み先のファイルが存在し、その `specStatus` が `invalid` のときは、要件なら `要件の見出しが不正です`、設計なら `設計の見出しが不正です` で拒否する。存在しないときはこの検証をしない。
4. `edited` が `isSpecHeading` を満たさないときは `見出しが不正です`。
5. 要件、設計、`edited` の `readReflectedIds` が拒否したときは、その理由で拒否する。
6. 元の要件と設計の本文から `nextUnincorporatedAnswer` を求める。`null` のときは `未反映の回答はありません`。
7. 書き込み先の本文と `edited` から、反映済みブロックを除いた文字列を比べる。同じときは `回答が本文に反映されていません`。除くブロックは、開始行以降を捨て、開始行より前を `\n` で結合したものである。開始行が無いときは、改行を `\n` にそろえた全文である。比較の前に両方を `\n` へそろえる。
8. `withReflectedId(edited, next.id)` の戻り値を、選んだ側の新しい本文にする。選んでいない側は、引数の `markdown` をそのまま返す。

`answerId` は、この先頭一件の `id` である。二件目以降の id は記録しない。

`readSpecFile` は、ファイルが無いとき `{ exists: false, markdown: "" }` を返す。ファイルであるときは、内容を削らず `{ exists: true, markdown }` を返す。それ以外は `仕様を読めません` で拒否する。

`writeSpecFile` は、親ディレクトリを再帰的に作り、`markdown` を UTF-8 でそのパスへ書く。末尾に改行を足さない。

`reflect` サブコマンドは、ローカルの検証を `gh` より先に行う。番号、種別、両方の `readSpecFile`、両方の `readReflectedIds`、設計のときの `assertRequirementsReady`、書き込み先が `invalid` であるときの拒否、`edited` の見出し、この順である。ここで拒否したときはファイルを作らない。通過したあと `getIssue`、`assertSpecWorkAllowed`、`listComments`、`applyIncorporatedAnswer` の順である。`assertSpecWorkAllowed` が拒否したときは `listComments` を呼ばない。`applyIncorporatedAnswer` が成功してから、`specPaths` の選んだ側だけを `writeSpecFile` する。もう一方は書かない。成功の標準出力は `反映しました: ` に `answerId` を足した一行である。

標準入力は、ディスクへまだ書いていない全文である。追記は、既存の反映済みブロックより前にある。ブロックより後ろに本文があるときは、`readReflectedIds` が `反映済みの記録を解釈できません` で拒否し、ファイルは書かない。

## スキル

`SKILL.md` の先頭は、次のフロントマターと一致する。`disable-model-invocation` は付けない。

```yaml
---
name: sdd-cur
description: このプロジェクトの課題について、着手候補の提示、要件、設計、確認コメントの投稿、未反映の回答の取り込みを行う。着手、要件、設計、確認、回答の取り込みを依頼されたときに使う。課題の作成とクローズ、ラベルの変更、実装、受け入れ手順、完了処理はしない。
---
```

本文の最初の見出しは `# sdd-cur` である。そのあとに `## 着手`、`## 要件`、`## 設計`、`## 確認`、`## 回答`、`## 禁止` を、この順で置く。コマンドはリポジトリのルートで `bun src/cli.ts` を使う、と書く。

着手では `candidates` を実行する。空なら、着手できる課題は無いと伝え、課題は作らない。空でないときは番号、題、URL を見せ、決めるのは人であると書く。人が番号を決めるまで、要件も設計も始めない。

人が番号を決めたあとは `show` を実行する。`state` が `open` でないときは、課題は閉じていると伝えて止まる。業務ラベルが一つでもあるときは、実装のラベルが付いていると伝えて止まる。この二つのときはファイルを変えず、`confirm` も `reflect` も実行しない。

要件では、人が要件を依頼したときだけ `requirements.md` を書く。`specs.requirements` が `missing` のときは、`specHeading(number, issue.title)` を最初の見出しにして新しいファイルを作る。題が不正なら、別の題を作らずに止まる。`invalid` のときは上書きしない。`ready` のときは、既存の正しい見出しを変えずに本文を続ける。設計のファイルはこの手順で作らない。

設計では、人が設計を依頼したときだけ `design.md` を書く。要件の状態が `ready` でないときは、`missing` なら要件が無い、`invalid` なら要件の見出しが不正である、と伝えてファイルを変えない。設計ファイルの `missing`、`invalid`、`ready` は、要件ファイルと同じ扱いである。人が設計の完了を伝えたときは、push と「実装依頼」は人が行う、と伝えて終わる。

確認では、課題、計画、既存の回答から決められない点だけを payload にする。決められない点は仕様ファイルへ書かない。`nextAnswer` が `null` でないときは投稿しない。`unanswered` が空でないときは、いちばん古い未回答の payload を見せ、新しい確認は投稿しない。どちらでもないとき、payload を人に見せ、その文字列の承認があるまで `confirm` を実行しない。人が直したときは、直した文字列を改めて見せる。標準入力は承認された payload だけであり、印の行は入れない。

回答では、回答コメントを投稿しない。人が取り込みを依頼したとき、`nextAnswer` が `null` なら、未反映の回答は無いと伝えてファイルを変えない。`null` でないときは、人が `requirements` か `design` かを決めるまでファイルを変えない。決めたあとも、`reflect` が成功するまでディスク上のファイルは変えない。決定を書いた全文は、`reflect` の標準入力だけに渡す。追記は、既存の反映済みブロックより前に置く。印の行と、本文中の id は書かない。`reflect` が id を足してから、選んだ側のファイルを書く。一度の `reflect` のあと、残りの未反映があっても、次の依頼まで続けない。

作業の前に `docs/plan.md` と `docs/conventions.md` を読む。仕様へ書く挙動は、対象課題とこの計画にあるものだけである。

禁止の節には、課題は作らない、課題は閉じない、ラベルは変えない、実装依頼は人が付ける、push は人が行う、実装は課題ランナーが行う、受け入れ手順は投稿しない、完了処理は行わない、`gh` は直接起動しない、を書く。

`SKILL.md` には、反映済みブロックの開始行を書かない。

## テスト

`src/sdd.test.ts` に置き、`bun:test` の `describe` と `test` を使う。`gh` は起動しない。`createGitHub` と `defaultGhRunner` は呼ばない。GitHub を呼ぶ関数には、使うメソッドだけを持つオブジェクトを渡す。

- `candidateViews` は引数の配列を変えない。閉じた課題、五つの業務ラベルのいずれかを持つ課題を除く。別のラベルだけの開いた課題は残す。`number` が `10` と `2` のときは `2` が先である。
- `listStartCandidates` は `listIssues({ state: "open", limit: 100 })` を一回だけ呼ぶ。
- `specStatus` は、ファイルが無いときと、空行だけのとき `missing` である。見出しが違うときは `invalid`、`# 5 ` のあとに題があるときは `ready` である。
- `buildIssueView` は、コメントを時刻と `id` の順に並べ、`author` を含めない。未回答の payload は印の行を含まない。対応の無い回答は `nextAnswer` を `null` にする。反映済みの開始行が二つある要件は `反映済みの記録が複数あります` で拒否する。
- `loadIssueView` は、不正な番号で `getIssue` を呼ばない。`getIssue` が拒否したとき `listComments` を呼ばない。
- `nextUnincorporatedAnswer` は、未反映のいちばん古い回答と同じ参照を返す。新しい未反映が同時にあっても、古い方を返す。
- `specHeading` は `# 5 題` を返し、空の題と改行を含む題を `題が不正です` で拒否する。
- `confirmationBody` は、空の payload を `確認の本文が空です` で拒否する。最初の非空行が三つの印のいずれかのときは `確認の本文に印を含めない` で拒否する。成功時の先頭行は印であり、payload の空白は残る。
- `assertSpecWorkAllowed` は、閉じた課題をラベルより先に `課題は閉じています` で拒否する。開いていて「実装依頼」を持つ課題は `実装のラベルが付いています` で拒否する。
- `postConfirmation` は、不正な番号では payload も `specs` も `getIssue` も見ない。空の payload では `getIssue` を呼ばない。要件または設計の `readReflectedIds` が拒否したときは `getIssue` を呼ばない。対応づいた回答の id が、どちらの本文にも無いときは `未反映の回答があります` で `addComment` を呼ばない。その id がどちらか一方、または両方にあるときは、未回答が無ければ `addComment` を呼ぶ。業務ラベルがある課題では `listComments` を呼ばない。未回答だけがあるときは `未回答の確認があります` で、`addComment` を呼ばない。通過したときは `confirmationBody` の戻り値を `addComment` へ渡し、返った URL を返す。
- `applyIncorporatedAnswer` は、設計で要件が `missing` のとき `要件がありません` で拒否する。要件の見出しが不正なときは `要件の見出しが不正です`、設計の既存見出しが不正なときは `設計の見出しが不正です` で拒否する。`edited` の反映済みブロックより後ろに本文があるときは `反映済みの記録を解釈できません` で拒否する。ディスク上の本文には無く、`edited` では反映済みブロックより前にある決定は、選んだ側へ id を足して成功する。本文が同じときは `回答が本文に反映されていません` で拒否する。成功時は選んだ側の末尾に、先頭の未反映の id だけを足し、もう一方の文字列は引数のままである。二件あるときは古い id だけを記録する。
- `readSpecFile` は、無いパスを `{ exists: false, markdown: "" }` にする。ディレクトリは `仕様を読めません` で拒否する。`writeSpecFile` は親ディレクトリを作り、渡した文字列をそのまま書く。

文書と起動の確認も同じテストファイルで行う。一時ディレクトリを使い、ホームディレクトリは使わない。

- `skills/sdd-cur/SKILL.md` の先頭が、上のフロントマターと一致する。`disable-model-invocation` は無い。本文に、六つの見出し、`bun src/cli.ts`、`docs/plan.md`、`docs/conventions.md`、`決めるのは人`、`着手できる課題は無い`、`課題は作らない`、`課題は閉じない`、`ラベルは変えない`、`実装依頼は人が付ける`、`push は人が行う`、`実装は課題ランナーが行う`、`受け入れ手順は投稿しない`、`完了処理は行わない`、`gh は直接起動しない`、`人がその本文を承認したあとだけ`、`未回答の確認があるあいだ、次の確認は投稿しない`、`未反映の回答があるとき、人が取り込み先を決めるまでファイルは変えない`、`reflect が成功するまでディスク上のファイルは変えない`、`反映済みブロックより前`、`既存の正しい見出しは変えない`、`本文には id を書かない` が含まれる。`createGitHub`、`src/sdd.ts`、反映済みブロックの開始行は含まれない。
- `bun src/cli.ts install <temp>` の終了コードは 0 であり、`<temp>/.cursor/skills/sdd-cur/SKILL.md` はパッケージのそのファイルと一致する。

`src/cli.test.ts` の使い方の完全一致は、上の七行に更新する。`gh` を起動しない子プロセスで、次を確かめる。`PATH` は、これまでの `labels` のテストと同じく、`bun` のあるディレクトリだけにする。

- `--help` の標準エラーに `sdd-cur show` がある。終了コードは 0 である。
- `confirm 1 --help` は使い方を書いて終了コード 0 である。
- `candidates extra` は使い方の七行で終了コード 1 である。
- `show 01` の標準エラーは `番号が不正です` の一行である。
- `confirm 5` の標準入力が空のとき、標準エラーは `確認の本文が空です` の一行である。
- `confirm 5` の標準入力の最初の非空行が `sdd-cur: 確認` のとき、標準エラーは `確認の本文に印を含めない` の一行である。
- 一時ディレクトリで `reflect 5 design` の標準入力が見出しと本文でも、要件ファイルが無いときは `要件がありません` であり、`docs/specs/5` は作られない。
- 一時ディレクトリで `reflect 5 requirements` の標準入力が見出しを欠くとき、`見出しが不正です` であり、ファイルは作られない。
- 一時ディレクトリの要件ファイルに反映済みの開始行が二行あるとき、`show 5` は `反映済みの記録が複数あります` で終了コード 1 である。

実装の確認では、GitHub へコメントを投稿しない。

## 作業の一覧

1. `candidateViews`、`listStartCandidates`、`specStatus`、`buildIssueView`、`loadIssueView`、`nextUnincorporatedAnswer`、確認、`applyIncorporatedAnswer`、仕様ファイルの読み書きを `src/sdd.ts` に置き、関数テストを通す。
2. 四つのサブコマンドと使い方の七行を `src/cli.ts` に足す。`src/cli.test.ts` の使い方の期待を更新し、`gh` を呼ばない引数テストを通す。
3. `skills/sdd-cur/SKILL.md` を書き、フロントマター、見出し、禁止の文言をテストで確かめる。`skills/.gitkeep` は残す。
4. 一時ディレクトリへ `install` し、コピーされた `SKILL.md` がパッケージ側と一致することを確かめる。
5. README の、配置するスキルはまだ無い、という文を、`install` がコピーするスキルは `skills/sdd-cur` である、に変える。コマンド一覧とディレクトリに、四つのサブコマンド、`src/sdd.ts`、`skills/sdd-cur/` を足す。実装済みの設計に、この設計へのリンクを足す。AGENTS.md の構成のサブコマンド、`src/sdd.ts` の行、コマンド欄に、同じ四つを足す。
