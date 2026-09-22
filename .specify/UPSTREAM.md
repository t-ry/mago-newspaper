# Spec Kitの出典と導入範囲

- Source: https://github.com/github/spec-kit
- Commit: b9e7389d1414cfefe3964917a7ca48cd99503815
- Retrieved: 2026-09-22
- License: MIT（`LICENSE.spec-kit`）

公式ソースから`templates/*-template.md`、`templates/commands/`、`scripts/bash/`をコピーした手動導入。
開発原則とルートのAGENTS.md、README.md、docs/は本プロジェクト用に作成。

Specify CLIは未インストール。`.agents`と`.codex`が読み取り専用のため、エージェント用スキル／スラッシュコマンドの登録は行っていない。
この会話では公式手順ファイルを参照して各段階を実行する。コピーした手順は未レンダリングのため、コマンド名などのプレースホルダーが含まれる。
