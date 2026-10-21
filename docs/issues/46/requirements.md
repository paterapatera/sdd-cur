# 46 このリポジトリ以外では SDD スキルを起動しない

対象は [Issue #46](https://github.com/paterapatera/sdd-cur/issues/46)。ユーザー全体へ置くと、対象外のプロジェクトでも SDD スキルが起動する。インストール先がホームだと、別の作業ツリーで「要件を作って」と依頼しても起動できる。このプロジェクト専用の手順が、他のリポジトリへ広がる。

対象は、`sdd-cur` と `sdd-cur-complete` の起動条件である。`sdd-cur` は、どのプロジェクトでも、`sdd-cur` をコマンドで指定したときだけ手順に入る。`sdd-cur-complete` は、どのプロジェクトでも、`sdd-cur-complete` をコマンドで指定したときだけ手順に入る。そのスキルをコマンドで指定していないときは、このリポジトリ以外では、そのスキルは手順に入らない。`sdd-cur` をコマンドで指定したときは、このリポジトリ以外のプロジェクトでも、`sdd-cur` は手順に入る。`sdd-cur-complete` をコマンドで指定したときは、このリポジトリ以外のプロジェクトでも、`sdd-cur-complete` は手順に入る。

重なる課題は #19 である。

## 現状

`skills/sdd-cur/SKILL.md` に `disable-model-invocation` は無い。説明文は、このプロジェクトの課題について使う、と書く。起動をこのリポジトリに限る手順は無い。

`skills/sdd-cur-complete/SKILL.md` に `disable-model-invocation` は無い。説明文は、Project A の Cursor で、人が指定した課題の完了処理を行う、と書く。起動をこのリポジトリに限る手順は無い。

設計 5 は、`skills/sdd-cur/SKILL.md` に `disable-model-invocation` が無いことを受け入れ条件にしている。設計 7 は、`skills/sdd-cur-complete/SKILL.md` に `disable-model-invocation` が無いことを受け入れ条件にしている。

`skills/sdd-cur-implement/SKILL.md` には `disable-model-invocation: true` がある。

引数を省いた `install` は、スキルをホームの `~/.cursor/skills` へコピーする。

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

## 決定

`sdd-cur` は、どのプロジェクトでも使う。手順に入るのは、`sdd-cur` をコマンドで指定したときだけである。`sdd-cur` をコマンドで指定したとは、Cursor のチャットで、スキル `sdd-cur` を @ する、または `sdd-cur` のスキル呼び出しで明示して起動したときである。「要件を作って」など、`sdd-cur` を明示しない通常の依頼だけでは、`sdd-cur` をコマンドで指定したとはみなさない。

`sdd-cur-complete` は、どのプロジェクトでも使う。手順に入るのは、`sdd-cur-complete` をコマンドで指定したときだけである。`sdd-cur-complete` をコマンドで指定したとは、Cursor のチャットで、スキル `sdd-cur-complete` を @ する、または `sdd-cur-complete` のスキル呼び出しで明示して起動したときである。`sdd-cur-complete` を明示しない通常の依頼だけでは、`sdd-cur-complete` をコマンドで指定したとはみなさない。

課題の「このリポジトリ以外では手順に入らない」は、そのスキルをコマンドで指定していないときである。`sdd-cur` をコマンドで指定していないときは、このリポジトリ以外では、`sdd-cur` は手順に入らない。`sdd-cur-complete` をコマンドで指定していないときは、このリポジトリ以外では、`sdd-cur-complete` は手順に入らない。

`sdd-cur` をコマンドで指定したときは、このリポジトリ以外のプロジェクトでも、`sdd-cur` は手順に入る。`sdd-cur-complete` をコマンドで指定したときは、このリポジトリ以外のプロジェクトでも、`sdd-cur-complete` は手順に入る。

## 手順

`sdd-cur` の手順は、着手、要件、設計、確認、回答である。

`sdd-cur-complete` の手順は、完了である。

`sdd-cur` の手順に入るのは、`sdd-cur` をコマンドで指定したときだけである。`sdd-cur` をコマンドで指定していないときは、このリポジトリ以外では、`sdd-cur` の手順に入らない。`sdd-cur` をコマンドで指定したときは、このリポジトリ以外のプロジェクトでも、`sdd-cur` の手順に入る。

`sdd-cur-complete` の手順に入るのは、`sdd-cur-complete` をコマンドで指定したときだけである。`sdd-cur-complete` をコマンドで指定していないときは、このリポジトリ以外では、`sdd-cur-complete` の手順に入らない。`sdd-cur-complete` をコマンドで指定したときは、このリポジトリ以外のプロジェクトでも、`sdd-cur-complete` の手順に入る。

## 範囲外

次は、この要件に含めない。

- 実装スキルの `disable-model-invocation` を外すこと
- 課題の作成とクローズ
- ラベルの変更
- Forgejo、Jira、Backlog
