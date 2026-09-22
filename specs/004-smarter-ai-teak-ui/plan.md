# Implementation Plan: AI品質向上とチークUI

**Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

## AI model

OrcaRouterで候補モデルを同じデモJPEGとJSON契約で比較する。`anthropic/claude-sonnet-5`は応答を既存契約として検証できなかったため採用せず、画像入力、JSON構造、写真ID整合性を通過した`openai/gpt-5.2`を標準にする。

## Visual system

- チーク: 深い茶色をサイドバーと主要操作へ使う。
- 紙: 生成りを画面背景とカードへ使う。
- 蜂蜜色: アイコン、選択状態、補助要素へ使う。
- 書体: Zen Maru Gothicを操作UI、Noto Serif JPを見出しと紙面へ使う。

既存CSSの構造を保ち、最後に読み込むテーマ層で視覚表現を変更する。これによりカメラ、承認、PDFなどの動作ロジックへ影響を与えずに変更する。

## Validation

APIテスト、本番ビルド、公開390px E2E、公開OrcaRouter実生成、デスクトップとモバイルのスクリーンショットを確認する。
