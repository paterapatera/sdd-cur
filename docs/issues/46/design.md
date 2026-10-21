# 46 このリポジトリ以外では SDD スキルを起動しない

対象は [Issue #46](https://github.com/paterapatera/sdd-cur/issues/46)。`sdd-cur` と `sdd-cur-complete` は、どのプロジェクトでも、そのスキルをコマンドで指定したときだけ手順に入る。指定していない通常の依頼では、このリポジトリ以外でも手順に入らない。指定したときは、このリポジトリ以外のプロジェクトでも手順に入る。

重なる課題は #19 である。

## 受け入れ条件

- `sdd-cur` をコマンドで指定したとは、Cursor のチャットで、スキル `sdd-cur` を @ する、または `sdd-cur` のスキル呼び出しで明示して起動したときである。
- `sdd-cur-complete` をコマンドで指定したとは、Cursor のチャットで、スキル `sdd-cur-complete` を @ する、または `sdd-cur-complete` のスキル呼び出しで明示して起動したときである。
- 「要件を作って」など、スキル `sdd-cur` を明示しない通常の依頼だけでは、`sdd-cur` をコマンドで指定したとはみなさない。
- スキル `sdd-cur-complete` を明示しない通常の依頼だけでは、`sdd-cur-complete` をコマンドで指定したとはみなさない。
- `sdd-cur` は、どのプロジェクトでも、`sdd-cur` をコマンドで指定したときだけ手順に入る。
- `sdd-cur-complete` は、どのプロジェクトでも、`sdd-cur-complete` をコマンドで指定したときだけ手順に入る。
- `sdd-cur` をコマンドで指定していないときは、このリポジトリ以外では、`sdd-cur` は手順に入らない。
- `sdd-cur-complete` をコマンドで指定していないときは、このリポジトリ以外では、`sdd-cur-complete` は手順に入らない。
- インストール先がホームのとき、このリポジトリ以外の作業ツリーで「要件を作って」と依頼しても、`sdd-cur` をコマンドで指定していなければ、`sdd-cur` の手順に入らない。
- `sdd-cur` をコマンドで指定したときは、このリポジトリ以外のプロジェクトでも、`sdd-cur` は手順に入る。
- `sdd-cur-complete` をコマンドで指定したときは、このリポジトリ以外のプロジェクトでも、`sdd-cur-complete` は手順に入る。

## 範囲外

次は作らない。

- 実装スキルの `disable-model-invocation` を外すこと。`skills/sdd-cur-implement/SKILL.md` は変えない
- `skills/sdd-cur-fix/SKILL.md`。サブエージェント
- 二つのスキルの本文、`name`、`description`。着手、要件、設計、確認、回答、完了の手順
- リポジトリのパスで手順に入ることを拒む判定
- `src/install.ts`。引数を省いた `install` のコピー先。`install` が直下のディレクトリをコピーする動作
- `src/sdd.ts`、`src/complete.ts`、`src/cli.ts`、`src/runner.ts`、`src/github.ts`、`src/conventions.ts`
- `src/runner.test.ts` の期待
- `docs/plan.md`、`docs/conventions.md`、README、AGENTS.md、この課題以外の `design.md` と `requirements.md` の書き換え
- 課題の作成とクローズ
- ラベルの変更
- Forgejo、Jira、Backlog
- 依存パッケージ。`package.json` の変更
- ホームディレクトリと、実行中の Cursor のスキルへの `install`

## 決定

| 項目 | 内容 |
|---|---|
| 対象 | `skills/sdd-cur/SKILL.md` と `skills/sdd-cur-complete/SKILL.md` の起動条件だけである |
| 使う場所 | どちらのスキルも、どのプロジェクトでも使う |
| コマンドで指定 | Cursor のチャットで、そのスキルを @ する、またはそのスキルのスキル呼び出しで明示して起動したときである。`bun src/cli.ts` のサブコマンドではない |
| 通常の依頼 | 「要件を作って」など、そのスキルを明示しない依頼だけでは、コマンドで指定したとはみなさない。`sdd-cur-complete` を明示しない通常の依頼も、同様にみなさない |
| 手順に入るとき | 各スキルは、そのスキルをコマンドで指定したときだけ手順に入る。指定したときは、このリポジトリ以外のプロジェクトでも手順に入る |
| 手順に入らないとき | そのスキルをコマンドで指定していないときは、このリポジトリ以外では手順に入らない。インストール先がホームでも同じである |
| 手段 | 二つの frontmatter に `disable-model-invocation: true` を足す。明示して名前を指定したときだけスキルを読み込む |
| 本文 | 変えない。パスで起動を拒む文は足さない。読み込まれたあとの手順は、現状のままである |
| `name` と `description` | 変えない |
| 設計 5 | `skills/sdd-cur/SKILL.md` に `disable-model-invocation` が無い、という指定は、この課題が上書きする。設計 5 のファイルは書き換えない |
| 設計 7 | `skills/sdd-cur-complete/SKILL.md` に `disable-model-invocation` が無い、という指定は、この課題が上書きする。設計 7 のファイルは書き換えない |
| 設計 41 | この二ファイルの frontmatter を変えない、という指定は、この課題が上書きする。設計 41 の本文の文言は残す。設計 41 のファイルは書き換えない |
| 実装スキル | `disable-model-invocation: true` は残す。外さない |
| install | `src/install.ts` は変えない。コピーされるのは、この設計で変えた frontmatter を含むファイルである |

`sdd-cur` の手順は、着手、要件、設計、確認、回答である。`sdd-cur-complete` の手順は、完了である。手順の中身は変えない。変わるのは、手順に入る前の起動である。

## 変更するファイル

| ファイル | 変更 |
|---|---|
| `skills/sdd-cur/SKILL.md` | frontmatter に `disable-model-invocation: true` を足す。本文は変えない |
| `skills/sdd-cur-complete/SKILL.md` | 同じ |
| `src/sdd.test.ts` | `sdd-cur` のフロントマター期待を、下の YAML に更新する。無いことの期待を外す |
| `src/complete.test.ts` | `sdd-cur-complete` のフロントマター期待を、下の YAML に更新する。無いことの期待を外す |

## スキル `sdd-cur`

`skills/sdd-cur/SKILL.md` の先頭は、次のフロントマターと一致する。`name` と `description` は現状のままである。`disable-model-invocation: true` は、`description` の次の行である。

```yaml
---
name: sdd-cur
description: このプロジェクトの課題について、着手候補の提示、要件、設計、確認コメントの投稿、未反映の回答の取り込みを行う。着手、要件、設計、確認、回答の取り込みを依頼されたときに使う。課題の作成とクローズ、ラベルの変更、実装、受け入れ手順、完了処理はしない。
disable-model-invocation: true
---
```

閉じる `---` より後ろは変えない。`## 着手`、`## 要件`、`## 設計`、`## 確認`、`## 回答`、`## 禁止` は残す。

## スキル `sdd-cur-complete`

`skills/sdd-cur-complete/SKILL.md` の先頭は、次のフロントマターと一致する。`name` と `description` は現状のままである。`disable-model-invocation: true` は、`description` の次の行である。

```yaml
---
name: sdd-cur-complete
description: Project A の Cursor で、人が指定した課題の完了処理を行う。作業ツリーの呼び出し元が skill のときに使う。
disable-model-invocation: true
---
```

閉じる `---` より後ろは変えない。`# sdd-cur-complete`、`## 完了`、`## 禁止` と、設計 41 の本文は残す。

## テスト

`bun test` で実行する。一時ディレクトリを使い、終わったら消す。`gh` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。

新しいテストファイルは作らない。`src/install.ts` のテストは変えない。`src/runner.test.ts` の実装スキルの期待は変えない。

`src/sdd.test.ts` の `skills/sdd-cur/SKILL.md` は、先頭が上のフロントマターと一致する。`expect(text).not.toContain("disable-model-invocation")` は外す。本文の既存の必須文言は残す。

`src/complete.test.ts` の `skills/sdd-cur-complete/SKILL.md` は、先頭が上のフロントマターと一致する。`disable-model-invocation` は無い、という期待は外す。本文の既存の必須文言は残す。

install の検証は、既存の一時ディレクトリの試験のままである。期待の文は変えない。

- `src/sdd.test.ts` は、`bun src/cli.ts install <temp>` の終了コードが 0 であり、`<temp>/.cursor/skills/sdd-cur/SKILL.md` がパッケージのそのファイルと一致することを確かめる。
- `src/complete.test.ts` は、同じ `install` で、`<temp>/.cursor/skills/sdd-cur-complete/SKILL.md` がパッケージのそのファイルと一致することを確かめる。

この一致が、足した `disable-model-invocation: true` もコピー先に含まれることを確かめる。ホームの `~/.cursor/skills` へコピーしたことの試験は足さない。

## 作業の一覧

1. `skills/sdd-cur/SKILL.md` の frontmatter を、この設計の YAML にする。本文は変えない。`src/sdd.test.ts` の先頭一致を更新し、`disable-model-invocation` が無いという期待を外す。
2. `skills/sdd-cur-complete/SKILL.md` の frontmatter を、この設計の YAML にする。本文は変えない。`src/complete.test.ts` の先頭一致を更新し、`disable-model-invocation` が無いという期待を外す。
3. `bun test` が成功することを確かめる。install の既存試験は、コピーがパッケージ側と一致することで、新しい frontmatter がコピーされることを確かめる。
