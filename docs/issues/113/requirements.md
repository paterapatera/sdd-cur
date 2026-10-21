# 113 仕様ディレクトリ spec と specs の名前を紛らわしくないものに変える

対象は [Issue #113](https://github.com/paterapatera/sdd-cur/issues/113)。仕様ディレクトリの名前 `spec` と `specs` が紛らわしい。この二つのディレクトリ名を、紛らわしくないものに変える。

## 現状

課題ごとの要件のパスは `docs/specs/<番号>/requirements.md` である（`docs/conventions.md` の 11 行）。

課題ごとの設計のパスは `docs/specs/<番号>/design.md` である（`docs/conventions.md` の 12 行）。

今のシステムの挙動を表す仕様の正本は、`docs/spec/` に置く（`docs/conventions.md` の 18 行）。

正本のファイルは `docs/spec/<領域>.md` である（`docs/conventions.md` の 22 行）。

課題ごとの `docs/specs/<番号>/requirements.md` と `docs/specs/<番号>/design.md` の置き場所は、「課題ごとのファイル」のままである（`docs/conventions.md` の 30 行）。

要求レビュー役が読む正本は `docs/spec/` に置く。比べる課題の要件は `docs/specs/<番号>/requirements.md` である（`docs/conventions.md` の 34 行）。

設計レビュー役が読む正本は `docs/spec/` に置く。比べる課題の設計は `docs/specs/<番号>/design.md` である（`docs/conventions.md` の 36 行）。

既存の `docs/specs/<番号>/` は消さず、履歴として残す（`docs/conventions.md` の 40 行）。

#4 の設計は、課題ごとのパスを `docs/specs/<番号>/requirements.md` と `docs/specs/<番号>/design.md` とする（`docs/specs/4/design.md` の 34 行）。

`specPaths` が返す課題ディレクトリは、`docs/specs/` と課題番号を連結したものである（`src/conventions.ts` の 97 行）。

`readCanonicalIds` が読む正本のディレクトリは `docs/spec` である（`src/conventions.ts` の 1498 行）。

見つかった要求のパスは、`docs/spec/` とファイル名を連結する（`src/spec.ts` の 180 行）。

`checkSpec` が読む正本のディレクトリは `docs/spec` である（`src/spec.ts` の 186 行）。

方針の構成は、`src/spec.ts` が `docs/spec/` 直下の要求を検査する、と書く（`docs/policy.md` の 22 行）。

README のディレクトリの例は `docs/specs/<番号>/` である（`README.md` の 117 行）。

着手前に読む設計のパスは `docs/specs/<番号>/design.md` である（`AGENTS.md` の 9 行）。

SDD スキルは、要件のファイルを `docs/specs/<番号>/requirements.md` として扱う（`skills/sdd-cur/SKILL.md` の 54 行）。

実装スキルは、設計の正本への差分を `docs/spec/` へ反映する（`skills/sdd-cur-implement/SKILL.md` の 21 行）。

正本の REQ-1 は、正本を `docs/spec/<領域>.md` に置き、課題ごとの要件と設計を `docs/specs/<番号>/requirements.md` と `docs/specs/<番号>/design.md` とする（`docs/spec/spec.md` の 5 行）。

正本の REQ-96 は、パスを `docs/specs/<番号>/requirements.md` と `docs/specs/<番号>/design.md` とする（`docs/spec/conventions.md` の 31 行）。

正本の REQ-148 は、要求レビュー役が比べる範囲を、`docs/spec/` の正本と、対象課題の `docs/specs/<番号>/requirements.md` の「関係する課題」に挙げた課題の仕様だけとする（`docs/spec/conventions.md` の 343 行）。

正本の REQ-150 は、既存の `docs/specs/<番号>/` を消さず、履歴として残す、とする（`docs/spec/conventions.md` の 355 行）。

正本の REQ-804 は、検査する正本を、作業ディレクトリの `docs/spec/` 直下の `.md` とする（`docs/spec/spec.md` の 47 行）。

## 受け入れ条件

- 正本のディレクトリは `docs/canonical/` である。
- 正本のファイルは `docs/canonical/<領域>.md` である。
- 課題ごとの要件のパスは `docs/issues/<番号>/requirements.md` である。
- 課題ごとの設計のパスは `docs/issues/<番号>/design.md` である。
- 正本のディレクトリ名と、課題ごとの要件と設計のディレクトリ名に、`docs/canonical/` と `docs/issues/` 以外の候補は使わない。
- 既存の `docs/spec/` は `docs/canonical/` へ移す。
- 移したあと、`docs/spec/` は無い。
- 既存の `docs/specs/<番号>/` は `docs/issues/<番号>/` へ移す。
- 移したあと、`docs/specs/` は無い。
- 履歴として残す課題ごとのファイルの場所は `docs/issues/<番号>/` である。
- コードが読む正本のディレクトリは `docs/canonical/` である。
- コードが読む課題ごとの要件と設計のディレクトリは `docs/issues/` である。
- `docs/conventions.md` のパス表記は、正本を `docs/canonical/`、課題ごとの要件と設計を `docs/issues/<番号>/` とする。
- `docs/policy.md` にある正本のパス表記は、`docs/canonical/` に揃える。
- README にある課題ごとの要件と設計のパス表記は、`docs/issues/<番号>/` に揃える。
- `AGENTS.md` にある課題ごとの要件と設計のパス表記は、`docs/issues/<番号>/` に揃える。
- スキルのパス表記は、正本を `docs/canonical/`、課題ごとの要件と設計を `docs/issues/<番号>/` とする。
- テストのパス表記は、正本を `docs/canonical/`、課題ごとの要件と設計を `docs/issues/<番号>/` とする。
- 正本の REQ のパス表記は、正本を `docs/canonical/`、課題ごとの要件と設計を `docs/issues/<番号>/` とする。
- 過去の課題ファイルの中のパス表記は、正本を `docs/canonical/`、課題ごとの要件と設計を `docs/issues/<番号>/` とする。
- この課題の「現状」は、移す前のパスを、移す前のファイルの行を根拠にして残す。
- サブコマンド名は `spec-check` のままである。
- ソースファイル名は `src/spec.ts` のままである。
- `spec-check` が検査する正本のディレクトリは `docs/canonical/` である。
- `src/spec.ts` が読む正本のディレクトリは `docs/canonical/` である。

## 決定

正本のディレクトリは `docs/canonical/` とする。

課題ごとの要件と設計のディレクトリは `docs/issues/` とする。

他の候補名は、採用しない。

既存の `docs/spec/` は `docs/canonical/` へ移す。移したあと、`docs/spec/` は無い。

既存の `docs/specs/<番号>/` は `docs/issues/<番号>/` へ移す。移したあと、`docs/specs/` は無い。

履歴として残す課題ごとのファイルは、`docs/issues/<番号>/` に置く。

コード、`docs/conventions.md`、`docs/policy.md`、README、`AGENTS.md`、スキル、テスト、正本の REQ、過去の課題ファイルの中のパス表記を、新しいパスに揃える。

新しいパスは、正本が `docs/canonical/`、課題ごとの要件と設計が `docs/issues/<番号>/` である。

過去の課題ファイルは、この課題以外の `requirements.md` と `design.md` である。揃えるのは、その中のパス表記である。この課題の「現状」は、移す前のパスを、移す前のファイルの行を根拠にして残す。

「コード・約束・正本 REQ だけ」に揃えることと、「実行時コードだけ」に揃えることは、採用しない。

サブコマンド名 `spec-check` は変えない。ファイル名 `src/spec.ts` は変えない。この二つが正本を読むディレクトリは、`docs/canonical/` に揃える。

リネーム案は、採用しない。

## 関係する課題

課題は、次を関係するとする。

- #4（課題ごとのファイルのパス）
- #86（正本の置き場所）
- #87（履歴として残すことと、レビューが読む範囲）
- #122（正本の検査）

#4 は、課題ごとの要件と設計のパスを `docs/specs/<番号>/requirements.md` と `docs/specs/<番号>/design.md` とする。この要件は、そのパスを `docs/issues/<番号>/requirements.md` と `docs/issues/<番号>/design.md` に移す。

#86 は、課題ごとの `docs/specs/<番号>/` とは別に、正本を `docs/spec/` に置く。この要件は、正本を `docs/canonical/` に移す。課題ごとのディレクトリは `docs/issues/` に移す。

#87 は、既存の `docs/specs/<番号>/` を消さず、履歴として残す。レビューが読む正本は `docs/spec/` である。この要件は、その履歴を `docs/issues/<番号>/` へ移す。移したあと、`docs/specs/` は残さない。レビューが読む正本は `docs/canonical/` である。

#122 は、検査する正本を、作業ディレクトリの `docs/spec/` とする。この要件は、検査する正本のディレクトリを `docs/canonical/` に揃える。サブコマンド名 `spec-check` とファイル名 `src/spec.ts` は変えない。

## 範囲外

次は、この要件に含めない。

- 要求の識別子を変えること
- 正本の `<領域>` の形を変えること
- 課題ごとのファイル名 `requirements.md` と `design.md` を変えること
- サブコマンドを新しく足すこと
