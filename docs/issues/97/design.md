# 97 同時に進む課題がコンフリクトしにくいよう、スキルとテストの書き方を変える

対象は [Issue #97](https://github.com/paterapatera/sdd-cur/issues/97)。同時に進む課題が同じ行を変えてコンフリクトしないよう、スキル、サブエージェント、テストの書き方を変える。

#96 は、最新のデフォルトブランチを作業ブランチへ取り込む。同じ行を変えた課題どうしは、そのあとでもコンフリクトする。この設計は、変更が同じ行に重ならない書き方にする。

重なる課題は #96、#91、#83 である。この課題以外の `design.md` と `requirements.md` は書き換えない。

`skills/sdd-cur/SKILL.md` の本文は、一つの段落を一行に書く行がある。`src/sdd.test.ts` の `describe("skills/sdd-cur/SKILL.md")` は、必須文言を一つの配列に足す形である。`src/agents.test.ts` は `describe("agents/*.md")` が一つで、`expected` の配列に文言を足す形である。`src/runner.test.ts` は、トップレベルの `describe` を一つのファイルに置き、`createRunner`、`createRunner completion`、`createRunner fix` が大きい。スキルの必須文言は、ファイル末尾の三つの `describe` にある。

## 受け入れ条件

- `skills/*/SKILL.md` の本文は、一文を一行に書く。
- `agents/*.md` の本文は、一文を一行に書く。
- Markdown として表示したときは、今と同じである。文のあいだは空行にしない。行末の空白二つと、行末の `\` は入れない。
- スキルとサブエージェントの文言は変えない。変えるのは、本文を一文一行にするための改行である。
- `src/sdd.test.ts`、`src/agents.test.ts`、`src/runner.test.ts` にあるテストは、別の課題が同じ場所に足さない置き方にする。置き方は、課題ごとの `src/<番号>.test.ts` である。節ごとのファイルにはしない。
- テストが確かめる内容は変えない。
- テストがスキルまたはサブエージェントの本文を文字列で確かめるとき、期待する文字列の改行は、一文一行の書き方に合わせる。確かめる文言は変えない。
- 書き方の約束の本文は `docs/conventions.md` に書く。
- この書き方は、cc-sdd の steering や Spec Kit の constitution に相当する永続ルールとして、`docs/conventions.md` に集約する。
- この書き方のために `AGENTS.md` が変わる箇所は、着手前の一覧の参照と、構成表の参照だけである。
- 着手前の一覧の参照と、構成表の参照は、この書き方の詳細を `docs/conventions.md` で読む形である。
- この書き方の詳細本文は `AGENTS.md` に書かない。
- 作成役、修正役、実装役は、スキル、サブエージェント、テストを書くとき、`docs/conventions.md` に書いたこの書き方に従う。
- `bun test` は `gh`、`git`、`agent` を起動しない。

## 範囲外

次は作らない。

- スキルの手順を短くすること（#91）
- 作業ブランチへの取り込み（#96）
- ドキュメントとスキルのずれを直すこと（#83）。この課題が変えるのは、本文の改行、約束、`AGENTS.md` の二つの参照、テストの置き場所である
- スキルとサブエージェントの文言の変更。フロントマターの変更。フロントマターの `description` を折ること
- スキルとサブエージェントへ、この書き方に従う旨の新しい文を足すこと。従うことは約束の節に書く
- 一文一行を、`docs/conventions.md` の既存の節、`AGENTS.md` の本文、要件、設計、README へ適用すること
- 既存のテストを、過去の課題番号ごとに割り当てて分けること。どの断言がどの課題のものか、ファイルに書いていない
- 新しいテストを、節ごとのファイルへ足すこと
- `src/complete.test.ts` と `src/create-issue.test.ts` を、`describe` ごとに分けること。この二ファイルは残す
- `src/conventions.ts` の判定。コメントの印。ラベル。課題の作成とクローズ。`issue close` と `--state`
- README の書き換え。この課題以外の `design.md` と `requirements.md` の書き換え
- 依存パッケージ。トークンと環境変数の読み取り
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| 一文の単位 | 本文の文の終わりは `。`、`！`、`？` である。バッククォート一つに挟まれた区間の中は、文の終わりにしない |
| 本文 | フロントマターの閉じ `---` の次の行から、ファイルの末尾までである。フロントマターは変えない |
| 分け方 | 文の終わりのあと、同じ行に空白以外の文字があるとき、その直後で行を分ける。文のあいだに空行は入れない。行はまとめない |
| 足す文字 | 改行だけである。文の終わりの直後の空白は残さない。続きの行へ足す空白は、元の行の先頭にあった空白だけである |
| 分けない行 | 行頭の空白を除いて `#` で始まる見出し、`|` で始まる表の行、バッククォート三つで始まるフェンスの行、フェンスの中。いまのスキルとサブエージェントに、表とフェンスは無い |
| 表示 | 表示は今と同じである。箇条書きの続きは、字下げを足さない。CommonMark の lazy continuation で同じ項目に残る。いまの本文を分けた続きは、箇条書きの印や見出しで始まらない |
| テストの置き方 | 課題ごと。節ごとにはしない。新しく足す `test` は `src/<番号>.test.ts` だけである |
| 既存の三ファイル | トップレベルの `describe` ごとに、下の表のファイルへ移す。移したファイルへ新しい `test` は足さない。三つの元ファイルは削除する |
| 既存の期待 | `describe` の名前、`test` の名前、期待する文言は変えない。本文の二つ以上の文を改行なしで肯定している期待だけ、文のあいだを改行一つにする。三ファイルの肯定の期待に、その形は無い |
| 約束 | `docs/conventions.md` の末尾に節を足す。既存の節の文言は変えない。`src/conventions.ts` は変えない |
| `AGENTS.md` | 着手前の一覧の 1 番と、構成表の `docs/conventions.md` の行だけを変える。詳細の本文は書かない |
| 従う役 | 作成役、修正役、実装役。スキルとサブエージェントのファイルへ、その文は足さない |

空行にすると段落が分かれる。行末の空白二つは、表示の改行になる。どちらも、表示が今と同じ、に合わない。

節ごとのファイルにしない。同じ節を二つの課題が変えると、その節のファイルの同じ配列に足して、同じ行が再びぶつかる。`describe("skills/sdd-cur/SKILL.md")` の必須文言が、その形である。`createRunner` は一つの `describe` が大きい。`describe` で分けても、同じ `describe` に足す課題どうしはぶつかる。

## 一文一行

対象は、`skills/` 直下の各ディレクトリの `SKILL.md` と、`agents/*.md` である。いまあるのは、`sdd-cur`、`sdd-cur-complete`、`sdd-cur-create-issue`、`sdd-cur-fix`、`sdd-cur-implement`、`sdd-cur-quick` と、`agents/` の九ファイルである。

フロントマターは、ファイル先頭の `---` から、次の行全体が `---` である行までである。この区間は一文字も変えない。既存の `startsWith` が比べるフロントマターは、この区間である。`description` に文が複数あっても、YAML の一行のままである。

本文の各行を、上から処理する。フェンスは、行頭の空白を除いてバッククォート三つで始まる行で開閉する。開いているあいだの行は変えない。見出し、表の行、フェンスの行も変えない。バッククォートが奇数の行は、いま無い。その行は分けない。

それ以外の行は、バッククォート一つから次の一つまでを飛ばして、`。`、`！`、`？` を探す。その文字のあと、行の残りに空白以外があるときは、その文字の直後で分ける。直後の空白は、続きへも前の行末へも残さない。続きの行の先頭には、元の行の先頭の空白だけを付ける。箇条書きの `- ` や番号の `1. ` は、続きの行へ付けない。

すでに文が一つで終わっている行は、そのままである。空行は残す。段落のあいだの空行は、足さないし、消さない。

分けたあとも、インラインコードの中身、見出しの字面、表、フェンスは、分ける前と一文字も違わない。違ってよいのは、本文の文の境界に入った改行と、その境界から除いた空白だけである。いまの本文に、句点の直後の空白は無い。

## 約束

`docs/conventions.md` の、着手の課題コメントの節までを変えない。ファイルの末尾に、次を足す。この節が、書き方の永続ルールである。

```
## スキル、サブエージェント、テストの書き方

この節は、スキル、サブエージェント、テストの書き方の永続ルールである。
作成役、修正役、実装役は、スキル、サブエージェント、テストを書くとき、この節に従う。

`skills/*/SKILL.md` と `agents/*.md` の本文は、一文を一行に書く。
本文は、フロントマターの閉じ `---` の次の行から、ファイルの末尾までである。
フロントマターは、この節では変えない。

文の終わりは `。`、`！`、`？` である。
バッククォート一つで囲まれた区間の中は、文の終わりにしない。
同じ行に、文の終わりのあと、空白以外の文字がまだあるときは、その文の終わりの直後で行を分ける。
文と文のあいだに空行は入れない。
行末に空白は残さない。
文の終わりの直後にあった空白は、残さず、改行だけにする。
見出しの行、空行、元から分かれている段落の区切りは、変えない。
行をまとめない。
続きの行は、元の行の先頭にある空白だけを残す。
新しい空白は足さない。
フェンスで囲んだコードの中と、`|` で始まる表の行と、行頭が `#` の見出しは、文の境界で分けない。

文言は変えない。
足す文字は、改行だけである。

Markdown として表示したときは、分ける前と同じである。
文のあいだを空行にしない。
行末の空白二つと、行末の `\` は入れない。

テストを足すときは、`src/<番号>.test.ts` だけに書く。
`<番号>` は課題番号であり、十進で、先頭の零は付けない。
他の課題は、そのファイルにテストを足さない。
既存の `src/*.test.ts` に、新しい `test` を足さない。
テストが確かめる内容は、置き場所を理由に変えない。
テストがスキルまたはサブエージェントの本文を文字列で確かめるとき、期待する文字列の改行は、本文の一文一行に合わせる。
確かめる文言は変えない。
```

`src/conventions.test.ts` の、既存の印と文言の期待は残す。この節の期待は、`src/97.test.ts` に書く。`src/conventions.test.ts` へは足さない。

## AGENTS.md

「着手前に読むもの」の 1 番を、次の一行にする。2 番と、そのあとの段落は変えない。

```
1. [docs/conventions.md](docs/conventions.md)。スキル、サブエージェント、テストの書き方は、このファイルを読む。
```

構成の表で、1 列目が `` `docs/conventions.md` `` の行の役割を、次にする。場所の列は変えない。

```
要件・設計の置き場所と課題コメントの約束。スキル、サブエージェント、テストの書き方は、このファイルを読む。
```

「テスト」の節は変えない。テストファイルは、いまのとおり `src/*.test.ts` に置ける。`src/<番号>.test.ts` も、移したあとの `describe` のファイルも、この形に合う。書き方の詳細は、この節へ書かない。`一文を一行` は、`AGENTS.md` に書かない。

## テストの配置

新しく足す `test` は、その課題の `src/<番号>.test.ts` だけに書く。この課題が足すテストは `src/97.test.ts` である。他の課題は、このファイルにテストを足さない。

`src/sdd.test.ts`、`src/agents.test.ts`、`src/runner.test.ts` のトップレベルの `describe` は、次のファイルへ移す。`describe` の第一引数と、各 `test` の名前は変えない。一つのファイルのトップレベルの `describe` は一つである。`describe` の中の `test` は、課題ごとにばらさない。移したファイルへ、新しい `test` は足さない。三つの元ファイルは、移したあと削除する。

| 元 | `describe` | 移す先 |
|---|---|---|
| `src/sdd.test.ts` | `isQuickTarget` | `src/sdd-is-quick-target.test.ts` |
| `src/sdd.test.ts` | `candidateViews` | `src/sdd-candidate-views.test.ts` |
| `src/sdd.test.ts` | `listStartCandidates` | `src/sdd-list-start-candidates.test.ts` |
| `src/sdd.test.ts` | `specStatus` | `src/sdd-spec-status.test.ts` |
| `src/sdd.test.ts` | `buildIssueView` | `src/sdd-build-issue-view.test.ts` |
| `src/sdd.test.ts` | `loadIssueView` | `src/sdd-load-issue-view.test.ts` |
| `src/sdd.test.ts` | `nextUnincorporatedAnswer` | `src/sdd-next-unincorporated-answer.test.ts` |
| `src/sdd.test.ts` | `specHeading` | `src/sdd-spec-heading.test.ts` |
| `src/sdd.test.ts` | `confirmationBody` | `src/sdd-confirmation-body.test.ts` |
| `src/sdd.test.ts` | `assertSpecWorkAllowed` | `src/sdd-assert-spec-work-allowed.test.ts` |
| `src/sdd.test.ts` | `postConfirmation` | `src/sdd-post-confirmation.test.ts` |
| `src/sdd.test.ts` | `applyIncorporatedAnswer` | `src/sdd-apply-incorporated-answer.test.ts` |
| `src/sdd.test.ts` | `readSpecFile` | `src/sdd-read-spec-file.test.ts` |
| `src/sdd.test.ts` | `skills/sdd-cur/SKILL.md` | `src/sdd-skill-sdd-cur.test.ts` |
| `src/agents.test.ts` | `agents/*.md` | `src/agents-files.test.ts` |
| `src/runner.test.ts` | `selectQuickIssue` | `src/runner-select-quick-issue.test.ts` |
| `src/runner.test.ts` | `selectImplementationIssue` | `src/runner-select-implementation-issue.test.ts` |
| `src/runner.test.ts` | `implementationBranch` | `src/runner-implementation-branch.test.ts` |
| `src/runner.test.ts` | `issueHasFixLabels` | `src/runner-issue-has-fix-labels.test.ts` |
| `src/runner.test.ts` | `selectCompletionIssue` | `src/runner-select-completion-issue.test.ts` |
| `src/runner.test.ts` | `selectFixIssues` | `src/runner-select-fix-issues.test.ts` |
| `src/runner.test.ts` | `classifyFixPullRequests` | `src/runner-classify-fix-pull-requests.test.ts` |
| `src/runner.test.ts` | `acceptanceComment` | `src/runner-acceptance-comment.test.ts` |
| `src/runner.test.ts` | `pullRequestBody` | `src/runner-pull-request-body.test.ts` |
| `src/runner.test.ts` | `startComment` | `src/runner-start-comment.test.ts` |
| `src/runner.test.ts` | `decideStartClaim` | `src/runner-decide-start-claim.test.ts` |
| `src/runner.test.ts` | `issueStartCutoff` | `src/runner-issue-start-cutoff.test.ts` |
| `src/runner.test.ts` | `createRunner start claim` | `src/runner-create-runner-start-claim.test.ts` |
| `src/runner.test.ts` | `createRunner` | `src/runner-create-runner.test.ts` |
| `src/runner.test.ts` | `createRunner completion` | `src/runner-create-runner-completion.test.ts` |
| `src/runner.test.ts` | `createRunner fix` | `src/runner-create-runner-fix.test.ts` |
| `src/runner.test.ts` | `skills/sdd-cur-quick/SKILL.md` | `src/runner-skill-sdd-cur-quick.test.ts` |
| `src/runner.test.ts` | `skills/sdd-cur-implement/SKILL.md` | `src/runner-skill-sdd-cur-implement.test.ts` |
| `src/runner.test.ts` | `skills/sdd-cur-fix/SKILL.md` | `src/runner-skill-sdd-cur-fix.test.ts` |

二つ以上の `describe` から使う関数と定数は、`src/sdd-test-support.ts` と `src/runner-test-support.ts` へ、今の実装のまま移す。一つだけの `describe` が使う名前は、そのテストファイルへ移す。`sdd` の `issue` と、`runner` の `issue` は、別の関数のままである。一つにまとめない。サポートのファイル名は `.test.ts` で終わらない。サポートに `test` は置かない。テストファイルからサポートを import する。サポートはテストファイルを import しない。

`import.meta.dir` は、移したあとも `src/` のファイルから見る。スキルへの相対パス `../skills` は、そのままで届く。

`src/complete.test.ts` と `src/create-issue.test.ts` の既存の `describe` は、そのファイルに残す。この二ファイルへ、新しい `test` は足さない。

以後の課題が、既存の `test` の期待を、文言の変更に合わせて直すときは、その既存ファイルを直してよい。新しい `test` は、`src/<番号>.test.ts` に足す。必須文言の配列へ、新しい語句を足さない。

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。移したテストが一時ディレクトリを作るときは、いまのとおり終わったら消す。`src/97.test.ts` は、ファイルを読むだけで、一時ディレクトリは作らない。

移したテストの期待は、移す前と一文字も違わない。三ファイルの `toContain` の語句は、文をまたいでいない。フロントマターの `startsWith` は、本文ではないので変えない。分けたあとも、これらの期待はそのまま通る。

本文を文字列で確かめる期待が、二つ以上の文を改行なしで肯定していて失敗するときだけ、その文のあいだへ改行を一つ足す。語句は変えない。インラインコードの中は分けない。`src/complete.test.ts` の `ラベルを変えない。スカッシュマージしない。` は、二つの文が一つの行に続かないことの不在である。この期待へ改行は足さない。

`src/97.test.ts` が確かめるのは、次である。

- `docs/conventions.md` に、見出し `## スキル、サブエージェント、テストの書き方` と、`一文を一行` と、`src/<番号>.test.ts` がある。
- `AGENTS.md` の着手前の 1 番に、`スキル、サブエージェント、テストの書き方は、このファイルを読む。` がある。構成の表の `` `docs/conventions.md` `` の行の役割にも、同じ文がある。
- `AGENTS.md` に `一文を一行` は無い。
- `src/sdd.test.ts`、`src/agents.test.ts`、`src/runner.test.ts` は無い。
- 上の表の移す先が、それぞれある。各ファイルのトップレベルの `describe` は一つで、第一引数は表の文字列と一文字も違わない。
- 各 `skills/*/SKILL.md` と `agents/*.md` の本文は、一文一行である。判定は、本文の分け方と同じである。フロントマターは見ない。フェンスの中、見出し、表の行は見ない。バッククォート一つの区間を除いたあとに、`。`、`！`、`？` があり、そのあと空白以外の文字がある行は、失敗である。

`src/conventions.test.ts` と `src/docs.test.ts` の既存の期待は残す。`AGENTS.md` の課題作成の文と、`docs/conventions.md` の既存の印は、この課題でも残る。

## 作業の一覧

1. `docs/conventions.md` の末尾に、上の節を足す。既存の節は変えない。
2. `AGENTS.md` の着手前の 1 番と、構成表の `docs/conventions.md` の役割だけを、上の文言にする。
3. `skills/*/SKILL.md` と `agents/*.md` の本文を、一文一行にする。フロントマターと文言は変えない。
4. 本文を文字列で確かめる期待のうち、二つ以上の文を改行なしで肯定しているものだけ、文のあいだを改行一つにする。三ファイルの肯定の期待は、この形ではない。不在を見ている期待へ改行は足さない。
5. 三ファイルの `describe` を、上の表のファイルへ移す。共有の関数と定数は、二つのサポートへ移す。三つの元ファイルは削除する。
6. `src/97.test.ts` を、上の期待で書く。移したファイルと、`src/conventions.test.ts` と、`src/docs.test.ts` へは足さない。
7. `bun test` を通し、`gh`、`git`、`agent` を起動しないことを確かめる。
