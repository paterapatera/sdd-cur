---
name: sdd-cur-complete
description: Project A の Cursor で、人が指定した課題の完了処理を行う。
---

# sdd-cur-complete

## 完了

起動した人が指定した課題番号を使い、作業ツリーのルートで `bun src/cli.ts complete <番号>` を実行する。完了処理の中身は、このコマンドが行う。

## 禁止

課題を作らない。課題を閉じない。ラベルを変えない。スカッシュマージしない。コメントを投稿しない。`gh` を直接起動しない。`sdd-cur.completion` を作らない。
