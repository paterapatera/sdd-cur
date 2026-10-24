# 161 install でサブエージェントのモデルを指定できるようにする

<!-- sdd-cur:form -->

対象は [Issue #161](https://github.com/paterapatera/sdd-cur/issues/161)。`install` は十一個のサブエージェントをコピーしたあと、指定された種別のモデルだけを、コピー先のフロントマターの `model:` 行に反映する。種別は `--high-model`、`--medium-model`、`--low-model` の三つである。

重なる課題は #1 である。課題ランナーと上級レビューのモデルは別課題で扱う。

## 受け入れ条件

- 1. 条件: 引数を省いて `install` する 主体: `install` 結果: スキルのコピー先はホームディレクトリの `.cursor/skills` であり、サブエージェントのコピー先はホームディレクトリの `.cursor/agents` であり、十一個のコピー先の `model:` はコピー元のフロントマターのままである
- 2. 条件: 存在するプロジェクトのルートを一つ渡して `install` する 主体: `install` 結果: スキルのコピー先は `<root>/.cursor/skills` であり、サブエージェントのコピー先は `<root>/.cursor/agents` である
- 3. 条件: `--` で始まらない引数が二つ以上ある、または空文字である 主体: `install` 結果: `install の引数はプロジェクトのルートを一つまでです` で失敗し、スキルもサブエージェントもコピーしない
- 4. 条件: 存在しないパスをプロジェクトのルートとして渡す 主体: `install` 結果: `ディレクトリが存在しません: <パス>` で失敗し、スキルもサブエージェントもコピーしない
- 5. 条件: ファイルをプロジェクトのルートとして渡す 主体: `install` 結果: `ディレクトリではありません: <パス>` で失敗し、スキルもサブエージェントもコピーしない
- 6. 条件: `--high-model <モデル>`、`--medium-model <モデル>`、`--low-model <モデル>` を、フラグと値を別の引数で渡して `install` が成功する 主体: `install` 結果: `sdd-cur-req-author` と `sdd-cur-design-author` と `sdd-cur-req-reviewer-high` のコピー先の `model:` が `--high-model` のモデルになり、`sdd-cur-req-reviewer` と `sdd-cur-design-reviewer` と `sdd-cur-implement-reviewer` のコピー先の `model:` が `--medium-model` のモデルになり、`sdd-cur-implement-author` と `sdd-cur-req-fixer` と `sdd-cur-design-fixer` と `sdd-cur-implement-fixer` と `sdd-cur-explore` のコピー先の `model:` が `--low-model` のモデルになる
- 7. 条件: `--high-model`、`--medium-model`、`--low-model` のいずれかの直後に値の引数がある 主体: `install` 結果: 値はその引数全体である。値は `=` を含んでよい。値は `--` で始まってもよい
- 8. 条件: 存在するプロジェクトのルートを一つと、有効な `--high-model`、`--medium-model`、`--low-model` を、どちらを先にしても渡す 主体: `install` 結果: そのルートのコピー先へ成功し、各種別のモデルを受け入れ条件 6 のサブエージェントへ反映する
- 9. 条件: `--high-model`、`--medium-model`、`--low-model` のいずれかの直後に引数が無い 主体: `install` 結果: 標準エラーに `モデルの指定が不正です: <指定>` と出て終了コード 1 で失敗し、スキルもサブエージェントもコピーせず、既にあるコピー先も変えない。`<指定>` はそのフラグである
- 10. 条件: `--high-model=`、`--medium-model=`、`--low-model=` のいずれかで始まる一つの引数がある 主体: `install` 結果: 標準エラーに `モデルの指定が不正です: <指定>` と出て終了コード 1 で失敗し、スキルもサブエージェントもコピーせず、既にあるコピー先も変えない。`<指定>` はその引数全体である
- 11. 条件: `--high-model`、`--medium-model`、`--low-model` のいずれかを付けて `install` が成功する 主体: `install` 結果: コピーしたあと、反映した種別に属する各コピー先のフロントマターの `model:` の行だけを書き換える。行は `model:`、空白一つ、そのモデルの順であり、モデルの文字列の前後に文字を足さない。本文と、フロントマターの他の行はコピー元と一致する
- 12. 条件: `install` が成功する 主体: `install` 結果: `agents/` の元ファイルは変わらない
- 13. 条件: コピーするスキルのディレクトリとサブエージェントのファイル名を見る 主体: `install` 結果: 今の一覧のままである
- 14. 条件: `install` が成功する 主体: `install` 結果: 標準出力に、十一個の最終的なモデルを `subagentFileNames` の順で一行ずつ出す。一行は、ファイル名から `.md` を除いた名前、空白一つ、最終的なモデルである。モデルの行は、スキルの宛先の絶対パスの行のあとであり、`配置するスキルはありません` を出すときはその行のあとである。三種類の指定が無く、十一個がコピー元のモデルのままのときも出す
- 15. 条件: `install` が成功する 主体: `install` 結果: スキルの宛先の絶対パスを標準出力へ書く。コピーしたスキルが無いときは `配置するスキルはありません` も標準出力へ書く
- 16. 条件: 使い方を表示する 主体: `install` の使い方 結果: `install` の行が `sdd-cur install [project-root] [--high-model <モデル>] [--medium-model <モデル>] [--low-model <モデル>]` である
- 17. 条件: `README.md` の `install` の説明を見る 主体: `README.md` 結果: `--high-model`、`--medium-model`、`--low-model` で三種類を指定し、受け入れ条件 6 のサブエージェントへ反映できる、と書く
- 18. 条件: この要件の変更を正本へ反映する 主体: `docs/canonical/install.md` 結果: フラグは `--high-model`、`--medium-model`、`--low-model` であり、割り当ては受け入れ条件 6 のとおりであり、指定しなかった種別はコピー元の `model:` のままであり、同じフラグの重複と空の値は `モデルの指定が不正です: <指定>` で失敗し、値として消費されていない引数のうち三種類のフラグ以外で `--` で始まるものは `モデルの指定が不正です: <指定>` で失敗し、種別フラグの直後の引数は `--` で始まっていても値であり知らない `--` 引数の検査の対象にせず、元の `agents/` は変えず、成功時のモデルの行は名前、空白一つ、最終的なモデルで `subagentFileNames` の順であり、宛先の絶対パスの行のあと（`配置するスキルはありません` を出すときはその行のあと）に成功したときだけ出す、とこの要件に合わせる
- 19. 条件: 三種類のモデル指定の解析を見る 主体: この課題 結果: `src/install.ts` の `parseInstallArgs` にある
- 20. 条件: コピー先の `model:` の書き換えを見る 主体: この課題 結果: `src/install.ts` の `installAgents` にある
- 21. 条件: `install` が失敗する 主体: `install` 結果: サブエージェントごとの最終的なモデルの行は出さない
- 22. 条件: `--help` も `-h` も無く、種別のフラグの値として消費されていない引数に、`--high-model`、`--medium-model`、`--low-model` 以外で `--` で始まるものがある 主体: `install` 結果: 標準エラーに `モデルの指定が不正です: <指定>` と出て終了コード 1 で失敗し、スキルもサブエージェントもコピーせず、既にあるコピー先も変えない。`<指定>` はその引数である
- 23. 条件: `--high-model <モデル>` だけを付け、`--medium-model` と `--low-model` は付けない 主体: `install` 結果: `sdd-cur-req-author` と `sdd-cur-design-author` と `sdd-cur-req-reviewer-high` のコピー先の `model:` がそのモデルになり、残りの八つのコピー先の `model:` はコピー元のままである
- 24. 条件: `--medium-model <モデル>` だけを付け、`--high-model` と `--low-model` は付けない 主体: `install` 結果: `sdd-cur-req-reviewer` と `sdd-cur-design-reviewer` と `sdd-cur-implement-reviewer` のコピー先の `model:` がそのモデルになり、残りの八つのコピー先の `model:` はコピー元のままである
- 25. 条件: `--low-model <モデル>` だけを付け、`--high-model` と `--medium-model` は付けない 主体: `install` 結果: `sdd-cur-implement-author` と `sdd-cur-req-fixer` と `sdd-cur-design-fixer` と `sdd-cur-implement-fixer` と `sdd-cur-explore` のコピー先の `model:` がそのモデルになり、残りの六つのコピー先の `model:` はコピー元のままである
- 26. 条件: `--high-model`、`--medium-model`、`--low-model` のいずれか一つを、空でない値で二回指定する 主体: `install` 結果: 標準エラーに `モデルの指定が不正です: <指定>` と出て終了コード 1 で失敗し、スキルもサブエージェントもコピーせず、既にあるコピー先も変えない。`<指定>` は後から現れた方の値の引数である
- 27. 条件: `--high-model`、`--medium-model`、`--low-model` のいずれかの直後の引数が空文字である 主体: `install` 結果: 標準エラーに `モデルの指定が不正です: <指定>` と出て終了コード 1 で失敗し、スキルもサブエージェントもコピーせず、既にあるコピー先も変えない。`<指定>` はその空の引数である
- 28. 条件: 三種の割り当てを見る 主体: この課題 結果: `src/install.ts` に固定で持つ。`agents/` の元ファイルには種別を書かない
- 29. 条件: `--high-model`、`--medium-model`、`--low-model` のいずれかの直後の引数が `--` で始まり、空でない 主体: `install` 結果: その引数全体をその種別のモデルとして反映し、その引数を理由に失敗しない

## 範囲外

- 引数を省いたときのコピー先と、プロジェクトのルートを一つ渡したときのコピー先を変えること
- コピーするスキルとサブエージェントの一覧を変えること
- 三種類のモデルをどれも指定しなかったときに、コピー先のモデルを変えること
- `agents/` の元ファイルを変えること
- スキルの中身を書き換えること
- 課題ランナーがサブエージェントを起動するときに渡すモデル
- `review-next` が返す上級レビューのモデル
- 指定されたモデル文字列を、既知のモデル一覧と照合すること
- 導入時の言語の選択
- `install` 以外のサブコマンドの使い方の行を変えること
- 引数に `--help` または `-h` があるときの、使い方を出して終了コード 0 で終わることを変えること

## 決定

| 項目 | 内容 |
|---|---|
| フラグ | `--high-model`、`--medium-model`、`--low-model`。値は直後の別引数。`=` 一引数は拒否する |
| プロジェクトのルート | `--` で始まらない引数は、高々一つ。フラグより前でも後でもよい |
| 種別の固定表 | `src/install.ts` に `subagentModelTierByFileName` を置く。キーは `subagentFileNames` の各ファイル名。値は `high`、`medium`、`low` のいずれか。対応は要件の「決定」と同じ |
| 解析 | `parseInstallArgs` が三種類のモデル文字列を返す。成功時は `projectRoot` と、指定された種別だけ `highModel`、`mediumModel`、`lowModel` を持つ |
| コピーと書き換え | `installAgents` は `cp` のあと、指定された種別に属するファイルだけ、コピー先の `model:` 行を書き換える。指定の無い種別は、コピー元のバイト列のまま |
| `model:` 行 | フロントマター内の、行頭が `model:` である最初の行だけを、`model: ` とモデルと改行に置き換える。`model:` の直後は空白一つ |
| 元のモデル | コピー元ファイルのフロントマターから `model:` 行を読む。書き換えの要否は、種別の指定があるかだけで決める |
| 標準出力 | 成功時、`installAll` が `subagentFileNames` の順の `{ baseName, model }` を返す。`baseName` は `.md` を除いた名前。`cmdInstall` が宛先のあと、必要なら `配置するスキルはありません` のあと、各行を `baseName`、空白一つ、`model` で出す |
| 正本 | 足す識別子は REQ-923 だけである |

`subagentModelTierByFileName` の対応は次である。

| 種別 | ファイル名 |
|---|---|
| `high` | `sdd-cur-req-author.md`、`sdd-cur-design-author.md`、`sdd-cur-req-reviewer-high.md` |
| `medium` | `sdd-cur-req-reviewer.md`、`sdd-cur-design-reviewer.md`、`sdd-cur-implement-reviewer.md` |
| `low` | `sdd-cur-implement-author.md`、`sdd-cur-req-fixer.md`、`sdd-cur-design-fixer.md`、`sdd-cur-implement-fixer.md`、`sdd-cur-explore.md` |

`parseInstallArgs` は、引数を左から見る。

1. 引数が `--high-model`、`--medium-model`、`--low-model` のいずれかであるとき、直後に引数が無いときは、そのフラグを `<指定>` にして `モデルの指定が不正です: <指定>` で失敗する。直後の引数が空文字のときは、その空の引数を `<指定>` にして失敗する。値があるとき、同じ種別が既に指定されていれば、後の値の引数を `<指定>` にして失敗する。そうでなければ、その直後の引数全体を値として消費する。
2. 引数が `--high-model=`、`--medium-model=`、`--low-model=` で始まる一つの引数であるとき、その引数全体を `<指定>` にして失敗する。
3. 引数が `--` で始まり、1 と 2 に当てはまらないとき、値としてまだ消費していない引数なら、その引数全体を `<指定>` にして失敗する。直前の種別フラグの値として消費した引数は、ここでは見ない。
4. それ以外の引数はプロジェクトのルートである。既にルートがある、または空文字なら、`install の引数はプロジェクトのルートを一つまでです` で失敗する。

`installAgents` の引数に、指定された種別のモデル文字列を渡す。各ファイルについて、コピー元から `readModelFromAgentFile` でモデルを読む。種別に対する指定があれば最終モデルはその文字列、無ければコピー元のモデルである。指定があるファイルだけ、コピー先を `setModelLineInAgentFile` で更新する。戻り値に、十一個の最終モデルを `subagentFileNames` の順で含める。

`installAll` は、スキルとサブエージェントのコピーに `parseInstallArgs` のモデル指定を渡し、戻りにスキル宛先と `subagentModels` を含める。解析が成功したあと、ディレクトリ検査とコピーの前にモデル指定の失敗は起きない。

`printUsage` の `install` 行は、受け入れ条件 16 の一行にする。`src/cli.test.ts`、`src/94.test.ts`、`src/package.test.ts` の `usageText` も同じ一行にする。

## 変えるファイル

- src/install.ts
- src/cli.ts
- README.md
- docs/canonical/install.md
- src/install.test.ts
- src/161.test.ts
- src/cli.test.ts
- src/94.test.ts
- src/package.test.ts

## テスト

`bun test` で実行する。`gh`、`git`、`agent` は起動しない。ホームディレクトリと、実行中の Cursor のスキルは触らない。ファイルを作るときは一時ディレクトリを使い、終わったら消す。

- `parseInstallArgs` は、引数なし、ルート一つ、ルートと三フラグの順序入れ替え、値に `=` や `--` 接頭、単独フラグ、重複、空値、`--flag=`、未知の `--` 引数、二つのルート、空ルートを確かめる [3][7][8][9][10][19][22][26][27][29]
- `subagentModelTierByFileName` は、受け入れ条件 6 の割り当てと一致する [6][28]
- `readModelFromAgentFile` と `setModelLineInAgentFile` は、リポジトリの `agents/` の実ファイル形に対し、`model:` 行だけを読み書きする [11]
- `installAgents` は一時ディレクトリで、三種すべて指定、各種別だけ指定、指定なしを確かめる。コピー元 `agents/` は読み取り専用のコピーを使い、元ファイルは変えない [6][11][12][20][23][24][25]
- `installAll` と `cmdInstall` を、一時ディレクトリと `Bun.spawn` で確かめる。成功時の標準出力の行順、失敗時にモデル行が無いこと、既存の宛先が失敗で変わらないことを含める。`subagentFileNames` の一覧と並びは変えない [1][2][4][5][13][14][15][21]
- `printUsage` と README の文言 [16][17]
- `docs/canonical/install.md` の REQ-923 が、正本への差分の本文と一文字も違わない [18]

## 作業の一覧

- 1. `subagentModelTierByFileName`、`readModelFromAgentFile`、`setModelLineInAgentFile` を `src/install.ts` に足す [6][11][28]
- 2. `parseInstallArgs` を決定の規則で書き換え、戻りの型を広げる [3][7][8][9][10][19][22][26][27][29]
- 3. `installAgents` と `installAll` でモデル指定を反映し、最終モデル一覧を返す [6][11][12][14][20][23][24][25]
- 4. `cmdInstall` で、成功時のモデル行の出力と、失敗時にモデル行を出さないことを行い、`printUsage` の `install` 行を受け入れ条件 16 の一行にする [14][15][16][21]
- 5. `README.md` と `docs/canonical/install.md` を更新する [17][18]
- 6. `src/install.test.ts` を、テスト節の `parseInstallArgs`、`subagentModelTierByFileName`、`readModelFromAgentFile` と `setModelLineInAgentFile`、`installAgents` の項目どおりにする [3][6][7][9][10][11][19][20][22][23][24][25][26][27][28][29]
- 7. `src/161.test.ts` を、テスト節の `installAll` と `cmdInstall` の項目どおりにする [1][2][4][5][8][13][14][15][21]
- 8. `src/cli.test.ts`、`src/94.test.ts`、`src/package.test.ts` を、テスト節の `printUsage` と README の項目どおりにする [16][17]。`docs/canonical/install.md` の REQ-923 は、テスト節の項目どおり一文字も違わないことを確かめる [18]

## 関係する課題

- #1（パッケージ骨格）
- 課題ランナーがサブエージェントを起動するときのモデルと、上級レビューのモデルの選択は、この課題のあとの別の課題で扱う

## 正本への差分

### 追加 install REQ-923

もとになった課題は #161 である。

`install` は、公開済みパッケージ側の `agents/` をコピー先へ写したあと、オプションの `--high-model`、`--medium-model`、`--low-model` で指定した種別のモデルを、コピー先のフロントマターの `model:` 行にだけ反映できる。フラグ名は `--high-model`、`--medium-model`、`--low-model` である。値は各フラグの直後の別引数であり、引数全体が値である。値は `=` を含んでよい。値は `--` で始まってもよい。フラグと値を `=` で一引数にした形は拒否する。同じ種別のフラグを二回指定したとき、および直後の値が無いとき、直後の値が空文字のとき、値として消費されていない引数のうち三種類のフラグ以外で `--` で始まるものがあるときは、何もコピーせず `モデルの指定が不正です: <指定>` で失敗する。種別フラグの直後の引数は、値として消費したあとは、知らない `--` 引数として扱わない。`--` で始まらない引数はプロジェクトのルートであり、一つまでである。プロジェクトのルートは、種別フラグより前でも後でもよい。

high 種別は `sdd-cur-req-author`、`sdd-cur-design-author`、`sdd-cur-req-reviewer-high` である。medium 種別は `sdd-cur-req-reviewer`、`sdd-cur-design-reviewer`、`sdd-cur-implement-reviewer` である。low 種別は `sdd-cur-implement-author`、`sdd-cur-req-fixer`、`sdd-cur-design-fixer`、`sdd-cur-implement-fixer`、`sdd-cur-explore` である。割り当ては `install` のコードに固定で持つ。`agents/` の元ファイルは変えない。指定しなかった種別のサブエージェントは、コピー元の `model:` のままである。指定した種別だけ、コピー先の `model:` 行を `model:`、空白一つ、モデル、の形に書き換える。

成功したとき、標準出力には、スキル宛先の絶対パスを一行書く。コピーしたスキルが無いときは続けて `配置するスキルはありません` を一行書く。そのあと、十一個のサブエージェントについて、ファイル名から `.md` を除いた名前、空白一つ、最終的なモデル、を `subagentFileNames` の順で一行ずつ書く。失敗したときは、これらのモデルの行は出さない。

- シナリオ: 条件: 三種類のモデルフラグを別引数で渡して `install` が成功する 主体: `install` 結果: 各種別に属するコピー先の `model:` が指定したモデルになり、標準出力に十一行の最終モデルが出る
- シナリオ: 条件: 種別フラグを一つだけ渡して `install` が成功する 主体: `install` 結果: その種別のコピー先だけ `model:` が変わり、ほかはコピー元のままである
- シナリオ: 条件: 種別フラグの指定が不正である 主体: `install` 結果: 何もコピーせず `モデルの指定が不正です: <指定>` で失敗する
