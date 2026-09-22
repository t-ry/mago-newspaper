# MVP検証記録

## 環境

2026-09-22 / Node.js 20.20.2 / Linux / Playwright Chromium。

## 実行結果

- `npm run build`: 成功。
- `npm test`: 7件成功。APIとOrcaRouterリクエスト形式、承認・編集、セッション分離、注文の並行実行、PDF生成中の改版、HTMLエスケープを検証。
- `npm run test:e2e`: 成功（1シナリオ）。背面カメラ指定、撮影ファイル取り込み、サンプル生成→編集→承認→PDF→模擬注文→モバイル確認。
- App Runner用DockerイメージをDebian 13 slimと必要なChromium依存だけの構成へ更新。非root実行を維持し、約3.39GBから約2.62GBへ削減。ECR基本スキャンはCritical 0、High 9、Medium 13、Low 2、Undefined 1。
- 公開元検証: 設定した`PUBLIC_ORIGIN`からのAPI呼び出しを許可し、未知の外部Originを403で拒否。
- AWS Amplify公開: https://main.d2lslwov00yd74.amplifyapp.com
- 公開URLのE2E: カメラ入力処理→サンプル生成→編集→承認→A4 PDF→模擬注文が成功。
- 公開URLの実AI: Secrets Managerから注入したキーでOrcaRouter `openai/gpt-5.2`を呼び、同梱デモ画像から記事1件を生成。写真参照の構造検証も成功。
- App Runner APIヘルスチェック: `aiConfigured: true`、東京リージョン、最大1インスタンスを確認。
- PDFを`pdf-lib`で解析し、1ページ、約595×842pt（A4縦）であることを確認。
- 日本語フォントを同梱し、画面・紙面プレビューで日本語が表示されることを確認。
- 390px幅で横スクロールが発生しないことを確認。
- チーク材を基調にした配色、生成りの紙面背景、Zen Maru Gothicの本文書体をデスクトップ1440pxとモバイル390pxで目視確認。
- モバイル初期画面で「カメラで撮る」が表示され、`capture="environment"`、単一画像入力、撮影後のプレビュー追加を確認。
- npm導入時の監査: 既知の脆弱性0件。
- OrcaRouter実API: APIキー認証、`GET /v1/models`（198モデル）、`orcarouter/free`のテキスト生成が成功。
- OrcaRouter画像生成: `openai/gpt-5.2`へ同梱デモ画像をJPEG data URIで送信し、記事1件、写真ID参照、生成文章の構造検証が成功。`anthropic/claude-sonnet-5`も比較したが、現行のJSON契約を満たさなかったため採用を見送った。
- Qiita公開: https://qiita.com/t-ry/items/5fde876e1a0c8c08cf40
- Spec Kit成果物監査: 9件の機能要件と5件の成功条件を実装・検証タスクへ対応づけ、重大な不整合0件。SC-004を実APIで達成し、SC-005の両URLを確定。

## 修正した不具合

- 日本語システムフォント未導入環境でUIが文字化け → Noto Sans JPを同梱。
- 隠しファイル入力がCSSで表示される → hidden属性の表示規則を修正。
- ViteとNode監視の競合で再起動ループ → Node側の監視を外す。
- PDF画像失敗と紙面下端のはみ出しを検出し、出力成功にしない。
- 新しい号へ戻った後も前号の完了トーストが残る → 号の初期化時にトーストを消去。
- 従来の`openai/gpt-4o-mini`から、画像入力とJSON契約を満たす`openai/gpt-5.2`へ標準モデルを更新。

## 未検証・制約

- iOS・Android実機でのOSカメラ画面起動は未確認。E2Eでは背面カメラ指定属性と撮影ファイル取り込み後の処理を検証。
- 実郵送は範囲外。模擬注文のみ。
- ブラウザの紙面とPDF寸法は確認済み。実プリンターでの出力は未実施。
- 公開サービスとしての負荷テスト、複数家族用認証、永続保存は未実装。
- Android / iOS実機での最終確認は未実施。公開URLの390pxブラウザE2Eは成功。

スクリーンショット・PDFは`test-results/`に生成（Git対象外）。公開用の同梱デモ素材だけを`docs/assets/`へコピーする。
