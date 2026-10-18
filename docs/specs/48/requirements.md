# 48 完了の指定だけで完了処理に届く

対象は [Issue #48](https://github.com/paterapatera/sdd-cur/issues/48)。完了スキルと、`complete` の呼び出し元である。完了スキルは呼び出し元ファイルを作れず、ファイルが無いと完了できない。人が完了を指定したときに、その選択だけで `completeIssue` まで届く。

重なる課題は #25（`sdd-cur.completion` の廃止）である。

## 現状

完了スキルは `sdd-cur.completion` を作らない、と禁止する。`complete` は、そのファイルが `skill` のときだけ完了する。ファイルが無いときは未設定で拒否する。

計画の未決の 2 項目目（どちらから呼ぶか）は残したままである。ファイルが無い状態は未設定である。人が完了を依頼しても、別の手作業が先に必要になる。

## 完了の指定

完了の指定は、人が完了スキルで課題番号を指定することである。完了スキルは `sdd-cur.completion` を作らない。

`complete` は、作業ツリーに `sdd-cur.completion` が無くても `completeIssue` を呼ぶ。

完了スキル `sdd-cur-complete` の description は、人が指定した課題の完了処理を行う旨である。その description に、呼び出し元ファイルの条件は無い。

## 受け入れ条件

- 人が完了を指定したとき、作業ツリーに `sdd-cur.completion` が無くても、`completeIssue` が呼ばれる。
- 完了スキルは `sdd-cur.completion` を作らない。
- 完了スキル `sdd-cur-complete` の description は、人が指定した課題の完了処理を行う旨である。
- 完了スキル `sdd-cur-complete` の description に、呼び出し元ファイルの条件は無い。

## 決定

`complete` は、作業ツリーに `sdd-cur.completion` が無いときも `completeIssue` を呼ぶ。

完了スキルは `sdd-cur.completion` を作らない。この禁止は維持する。

完了スキル `sdd-cur-complete` の description は、人が指定した課題の完了処理を行う旨である。その description に、呼び出し元ファイルの条件は無い。

## 範囲外

次は、この要件に含めない。

- 計画の未決の 1 項目目（受け入れ不合格のラベル）
- 課題を閉じること
