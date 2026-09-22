# Tasks: 孫ニュースペーパ

## Setup
- [x] T001 `package.json`と開発・ビルド環境を構築。
- [x] T002 `shared/schema.js`、`server/app.js`で入力検証・所有セッション・版管理を実装。

## US1 自動編集
- [x] T003 `tests/api.test.js`にAI不正応答・未設定・入力制限のテストを作成し失敗を確認。
- [x] T004 `server/orca.js`に画像付きOrcaRouter呼び出しとJSON検証を実装。
- [x] T005 `src/App.jsx`に写真追加・縮小・生成・サンプル体験を実装。

## US2 PDFと承認
- [x] T006 `tests/api.test.js`に未承認拒否・編集後承認解除・別セッション拒否のテスト。
- [x] T007 `shared/newspaper.js`に共有新聞HTML、`server/pdf.js`にA4 PDF生成。
- [x] T008 `src/App.jsx`に記事修正・プレビュー・承認・印刷操作。

## US3 郵送注文
- [x] T009 `tests/api.test.js`に注文重複と宛先検証のテスト。
- [x] T010 `server/orders.js`に模擬注文アダプター、画面に宛先入力と受付結果。
- [x] T011 ユーザー指定により今回は模擬郵送で完了。実事業者接続は次段階へ移動。

## 提出と検証
- [x] T012 `tests/e2e.test.js`で主要操作・PDF寸法とページ数・モバイル表示を検証。
- [x] T013 `README.md`、`docs/qiita-draft.md`、`docs/submission.md`を整備。
- [ ] T014 OrcaRouter実接続を確認（APIキー依存）。
- [ ] T015 GitHub公開とQiita記事公開、提出URL確定（公開先・認証依存）。

順序: Setup → US1 → US2 → US3 → 提出。外部依存の回答待ちは独立したローカル実装を妨げない。
