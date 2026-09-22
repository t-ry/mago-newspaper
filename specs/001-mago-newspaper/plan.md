# Implementation Plan: 孫ニュースペーパ

**Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

## Summary

React + Viteの画面とNode.js/Express APIを同じプロジェクトに置く。OrcaRouterの画像入力から記事JSONを得て、共有の新聞HTMLを画面とPlaywright Chromium PDFで描画する。

## Technical Context

- Node.js 20.20.2 / JavaScript ES modules / React / Vite 6（Node 20対応）
- Express、Zod、Playwright、自己ホスト日本語フォント（Noto Serif JP）
- 保存: セッション別のメモリ。2時間で失効、上限あり。CookieはHttpOnly/SameSite。
- AI: `https://api.orcarouter.ai/v1/chat/completions`、初期モデル`openai/gpt-4o-mini`、環境変数で差し替え。
- 画像: ブラウザで最大1600pxに縮小してJPEG再エンコード、位置情報等を持ち込まない。
- PDF: 印刷用HTMLをChromiumでA4出力。日本語フォントを埋め込み、外部リソースを禁止。
- テスト: Node test runnerでAPI・状態遷移・AI応答検証、Playwrightでデモ操作とPDF生成。
- 提出: README、Qiita Markdown原稿、公開手順、検証記録。

## Constitution Check

仕様作成済み。P1を一貫実装。キーはサーバー限定。デモを実AI・実発送と偽らない。承認と版はサーバーで検証。重大な原則違反なし。

## Structure

`src/` UI、`server/` API・AI・PDF・注文、`shared/` 新聞テンプレートとスキーマ、`tests/`、`docs/` 提出物、`specs/001-mago-newspaper/` 仕様。

## 外部依存

実郵送アダプターは事業者決定後に追加し、MVPでは模擬注文を使う。OrcaRouterキーはローカル設定済みで、認証・モデル一覧・無料テキスト生成に加え、`openai/gpt-4o-mini`への画像付き記事生成を実接続で確認した。GitHubは公開済み。Qiitaは原稿と投稿スクリプトを用意し、`write_qiita`権限のトークン設定後に公開する。
