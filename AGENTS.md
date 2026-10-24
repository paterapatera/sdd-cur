# エージェント向け

誰のための道具か、技術の前提、構成、破ってはいけない原則の正本は [docs/policy.md](docs/policy.md) である。

## 着手前に読むもの

1. [docs/policy.md](docs/policy.md)
2. [skills/sdd-cur/conventions.md](skills/sdd-cur/conventions.md)
3. [docs/conventions.md](docs/conventions.md) の節「スキル、サブエージェント、テストの書き方」
4. 対象課題の `docs/issues/<番号>/design.md`

設計の受け入れ条件、決定、範囲の中で実装する。

## テスト

```sh
bun test
```

- テストは `src/*.test.ts` に置き、`bun:test` の `describe` と `test` を使う。
- `gh` は起動しない。`GhRunner` を注入し、引数と標準入力を記録する。
- ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。
- 設計の「テスト」節にある項目を、その節の期待どおりに確認する。

## コマンド

```sh
bun src/cli.ts install [project-root]
bun src/cli.ts init [project-root]
bun src/cli.ts run [--interval-min <1 以上 1440 以下の整数>]
bun src/cli.ts labels
bun src/cli.ts candidates
bun src/cli.ts show <番号>
bun src/cli.ts gate <番号> <段>
bun src/cli.ts branch <番号>
bun src/cli.ts prepare-branch <番号>
bun src/cli.ts confirm <番号>
bun src/cli.ts close <番号>
bun src/cli.ts reflect <番号> <requirements|design>
bun src/cli.ts validate <番号>
bun src/cli.ts complete <番号>
bun src/cli.ts restore <番号>
bun src/cli.ts request <番号>
bun src/cli.ts review-next <requirements|reflect-design|quick|implement> <番号>
bun src/cli.ts spec-check
bun src/cli.ts tasks <番号>
bun src/cli.ts spec-diff <番号>
bun test
```

`package.json` の script 名は `install` にしない。開発時の script 名は `sdd-cur` と `test` である。

## コミット

依頼されたときだけコミットする。メッセージは [Conventional Commits](https://www.conventionalcommits.org/) にする。
