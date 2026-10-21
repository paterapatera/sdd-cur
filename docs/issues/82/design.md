# 82 失敗した課題に理由を残し、人が着手前のラベルへ戻せるようにする

対象は [Issue #82](https://github.com/paterapatera/sdd-cur/issues/82)。`process` が失敗したとき、ランナーは理由の日本語一行を標準エラーと課題コメントに残して止まる。ラベルは変えない。人は `restore` で「実装中」を外し、着手前のラベルへ戻す。

設計 6 と設計 69 は、失敗したときにラベルを戻さない。本設計も、失敗の処理ではラベルを変えない。戻すのは、人が別コマンドで `restore` を実行したときだけである。着手で「実装依頼」や「実装完了」を外す `editLabels` は、設計 6、設計 28、設計 56 のままである。

## 受け入れ条件

- `process` が失敗したとき、ランナーは失敗の理由の日本語一行を標準エラーに書く。
- 同じ一行を、その課題に普通のコメントとして書く。
- マージリクエストには、失敗の理由を書かない。
- そのコメントに印は付けない。確認、回答、受け入れ手順の印は使わない。
- 失敗した課題のラベルは変えない。どうするかは人が決める。
- 失敗の理由を課題に書いたあと、ランナーは終了コード 1 で止まる。
- ランナーは、次の課題へ進まない。
- 人は、CLI の一つのサブコマンドで、その課題から「実装中」を外せる。
- そのサブコマンドは、課題番号を引数に取る。
- そのサブコマンドで、その課題を着手前のラベルに戻せる。
- そのサブコマンド名は `restore` である。
- 使い方は `bun src/cli.ts restore <番号>` である。
- このコマンドは、ランナーを呼ばない。
- このコマンドは、スキルを呼ばない。

## 範囲外

次は作らない。

- 失敗した課題を自動で再試行すること
- 失敗したあと、ランナーが止まらずに次の課題へ進むこと
- 着手の排他（#81）
- 失敗の処理でラベルを戻すこと。`poll` の失敗に課題コメントを書くこと
- マージリクエストへの失敗理由。確認、回答、受け入れ手順の印を失敗コメントに付けること
- 着手時のラベル遷移の変更。設計 6、設計 28、設計 56 の `editLabels`
- 作業ツリーの復元。課題の作成とクローズ。`issue close` と `--state`
- 新しいラベル。`workflowLabels` の変更。`src/labels.ts` の変更
- `restore` からランナー、スキル、`agent`、`git` を呼ぶこと
- README、AGENTS.md、この課題以外の `design.md` と `requirements.md` の書き換え
- `docs/conventions.md`、`src/conventions.ts` の変更
- Forgejo、Jira、Backlog
- 依存パッケージ。トークンと環境変数の読み取り

## 決定

| 項目 | 内容 |
|---|---|
| 失敗の一行 | `runLoop` が今使っている理由の一行。`Error` で `message` があるときはその文字列。それ以外は `String(error)` |
| 標準エラー | `process` が失敗したとき、その一行を `logError` へ渡す。これは今のままである |
| 課題コメント | 標準エラーへ書いたあと、同じ文字列を `addComment` の本文にする。印の行は足さない。空にしない。前後も削らない |
| コメントの回数 | 一回だけ書く。拒否した呼び出しのやり直しはしない |
| コメントの失敗 | 投稿が拒否したときは、その理由の一行を標準エラーへ書き、終了コード 1 で止まる。`process` の失敗の一行は、すでに書いてある。ラベルは変えない。次の `poll` は呼ばない |
| マージリクエスト | 失敗理由では `addPullRequestComment` を呼ばない |
| 失敗時のラベル | `editLabels` を呼ばない。着手で付いた「実装中」は残る |
| ループ | `process` が失敗したあとは `return 1` である。次の `poll` は呼ばない。`poll` の失敗は、今どおり標準エラーへ一行書いて `return 1` であり、課題コメントは書かない |
| サブコマンド | `restore`。引数は課題番号が一つ。使い方の行は `sdd-cur restore <番号>` であり、`sdd-cur complete <番号>` の直後に置く |
| 戻し先 | 最後に「実装中」が付いたラベルイベントから 5 秒以内に外れた業務ラベルで決める。決め方は下の「着手前のラベル」 |
| ラベル名 | `workflowLabels` の `name` だけを使う。別の字面で再定義しない |
| `restore` の呼び出し | `createGitHub` だけを使う。ランナー、スキル、`agent`、`git` は呼ばない。課題コメントは書かない。課題は閉じない |

ラベル名は、この表では課題の文言で書く。実装は `workflowLabels` から取る。

## 失敗コメント

`RunLoopDeps` に次を足す。

```ts
commentFailure(issueId: string, line: string): Promise<void>
```

`src/cli.ts` の `run` は、組み立て済みの `createGitHub` でこれを渡す。`issueId` は `parseIssueNumberString` で番号にし、`addComment` の本文はその `line` である。`confirmationBody` と `plainIssueCommentBody` は使わない。

`runLoop` は、`process` が拒否したとき、次の順で行う。この途中で `editLabels` は呼ばない。

1. 失敗の一行を `logError` へ渡す。
2. `commentFailure` に、その仕事の `id` と、同じ一行を渡す。
3. 投稿が成功したときは、終了コード 1 で戻る。
4. 投稿が拒否したときは、その拒否の一行を `logError` へ渡し、終了コード 1 で戻る。

どちらの戻りでも、次の `poll` は呼ばない。`process` をやり直さない。

`poll` が拒否したときは、今どおりその一行を `logError` へ渡して終了コード 1 で戻る。`commentFailure` は呼ばない。

## restore

`src/restore.ts` に置く。

```ts
export type LabelEvent = {
  event: "labeled" | "unlabeled"
  name: string
  createdAt: string
}

export function preStartLabel(events: readonly LabelEvent[]): string | null

export async function restoreIssue(
  github: {
    getIssue: GitHubClient["getIssue"]
    listIssueEvents: GitHubClient["listIssueEvents"]
    editLabels: GitHubClient["editLabels"]
  },
  issueNumber: number,
): Promise<void>
```

`restoreIssue` は、番号が 1 以上の安全な整数でなければ `番号が不正です` で拒否する。このときは `getIssue` を呼ばない。

番号が通ったときは、次の順で、拒否した時点より後は呼ばない。

1. `getIssue`。ラベルに「実装中」が無いときは `実装中がありません`。`listIssueEvents` も `editLabels` も呼ばない。
2. `listIssueEvents`。`preStartLabel` が拒否したときは、その理由のまま拒否する。`editLabels` は呼ばない。
3. `preStartLabel` がラベル名を返したときは、一回の `editLabels` で「実装中」を外し、その名前を付ける。
4. `preStartLabel` が `null` を返したときは、一回の `editLabels` で「実装中」だけを外す。`add` は渡さない。

業務ラベル以外は、付けも外しもしない。成功時は標準出力に何も書かない。

`src/cli.ts` の `restore` は、引数が番号一つでないとき、使い方を書いて終了コード 1 である。番号は `parseIssueNumberString` で、`createGitHub` より前に読む。不正な番号は `番号が不正です` であり、使い方は書かない。通ったときは `createGitHub` のあと `restoreIssue` を一回呼ぶ。成功時の終了コードは 0 である。標準出力は空である。

使い方の全文は、次の十一行である。各行の末尾は改行である。

```
sdd-cur install [project-root]
sdd-cur run [--interval-min <1 以上 1440 以下の整数>]
sdd-cur labels
sdd-cur candidates
sdd-cur show <番号>
sdd-cur branch <番号>
sdd-cur confirm <番号>
sdd-cur close <番号>
sdd-cur reflect <番号> <requirements|design>
sdd-cur complete <番号>
sdd-cur restore <番号>
```

## 着手前のラベル

着手は三通りある。実装は「実装依頼」を外して「実装中」を付ける。修正は「実装完了」を外して「実装中」を付ける。quick は「実装中」だけを付け、業務ラベルは外さない。失敗の時点では、外したラベルは課題に残っていない。`restore` は、ラベルイベントから、最後の着手で外したラベルを決める。

`GitHubClient` に `listIssueEvents(number: number): Promise<LabelEvent[]>` を足す。`gh` の引数は、この順である。

```
api
--paginate
repos/<owner>/<repo>/issues/<番号>/events
```

`--method` は付けない。標準入力は空である。応答が配列でないときは `gh の応答を解釈できません`。要素のうち、`event` が `labeled` または `unlabeled` であり、`label.name` と `created_at` がどちらも文字列であるものだけを、応答の順で返す。それ以外の要素は捨てる。

`preStartLabel` は、引数の配列を変えない。

1. `event` が `labeled` で `name` が「実装中」である要素のうち、`createdAt` を時刻として解釈したときいちばん新しいものを取る。同時刻が複数のときは、配列のうしろのものを取る。一つも無いとき、および時刻を解釈できないときは `着手前のラベルを特定できません`。
2. その時刻との差の絶対値が 5 秒以内である `unlabeled` のうち、`name` が業務ラベルであり、かつ「実装中」ではないものを集める。時刻を解釈できない要素は集めない。
3. 集めた名前が「実装依頼」だけであるときは、その名前を返す。
4. 集めた名前が「実装完了」だけであるときは、その名前を返す。
5. 一つも集めなかったときは `null` を返す。quick の着手であり、「実装中」だけを外す。
6. それ以外は `着手前のラベルを特定できません`。ここには、「実装依頼」と「実装完了」の両方があるとき、「動作確認OK」または「マージ済み」が窓にあるときを含む。

差はミリ秒で 5000 以下である。着手の追加と削除は並行するので、外したイベントが付いたイベントより前でも後でも、この窓に入る。

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。`GhRunner` を注入し、引数と標準入力を記録する。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。

`src/run.test.ts` の既存の `runLoop` は、`commentFailure` を渡す。

- `poll` が拒否したときは、終了コード 1 であり、`commentFailure` は呼ばない。
- `process` が `Error` の `process failed` で拒否したときは、`logError` と `commentFailure` に渡す文字列はどちらも `process failed` である。`commentFailure` の第一引数は、その仕事の `id` である。終了コードは 1 であり、`poll` は一回のままである。
- `commentFailure` が拒否したときは、終了コード 1 であり、`logError` は `process` の一行のあと、投稿の拒否の一行を受ける。`poll` は一回のままである。

`src/github.test.ts` に足す。`gh` は起動しない。

- `listIssueEvents` の引数は、上の三要素と一致する。`labeled` かつ `label.name` と `created_at` がある要素だけを、応答の順で返す。`event` がそれ以外の要素は捨てる。配列でないときは `gh の応答を解釈できません`。

`src/restore.test.ts` に置く。注入した `getIssue`、`listIssueEvents`、`editLabels` の呼び出しを記録する。`gh` は起動しない。

- `preStartLabel` は引数を変えない。最後の `labeled`「実装中」から 5 秒以内の `unlabeled` が「実装依頼」だけであるときは、その名前を返す。「実装完了」だけであるときは、その名前を返す。窓の中に業務ラベルの `unlabeled` が無いときは `null` である。`labeled`「実装中」が無いとき、窓に「実装依頼」と「実装完了」の両方があるとき、窓に「動作確認OK」があるときは `着手前のラベルを特定できません`。外した時刻が付いた時刻より 1 秒後でも、5 秒以内なら組にする。差が 5 秒を超える `unlabeled` は組にしない。
- 「実装中」が無い課題では `実装中がありません` であり、`listIssueEvents` と `editLabels` は呼ばない。
- 戻し先が「実装依頼」のときは、一回の `editLabels` で「実装中」を外し「実装依頼」を付ける。「実装完了」のときも、同じ形で「実装完了」を付ける。`null` のときは「実装中」だけを外し、`add` は無い。
- `preStartLabel` が拒否したときは `editLabels` を呼ばない。

`src/cli.test.ts` の使い方の期待は、上の十一行と一致する。`restore` の引数が無いときは終了コード 1 であり、標準エラーはその十一行である。`restore foo` は終了コード 1 であり、標準エラーは `番号が不正です` の一行である。`gh` は起動しない。

`src/package.test.ts` の使い方の期待も、上の十一行と一致する。`--help` と、`run --interval-min 0` の使い方の部分は、この十一行である。

## 作業の一覧

1. `runLoop` に `commentFailure` を足す。`process` の失敗では、標準エラーの一行と同じ文字列で課題コメントを書き、終了コード 1 で止まる。`poll` の失敗ではコメントを書かない。
2. `listIssueEvents` と `preStartLabel` と `restoreIssue` を置き、注入した呼び出しで戻し先を確かめる。
3. `src/cli.ts` に `restore` を足し、`printUsage` を上の十一行にする。`run` から `commentFailure` を渡す。
4. `bun test` を通し、`gh`、`git`、`agent` を起動しないことを確かめる。
