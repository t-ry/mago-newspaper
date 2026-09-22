# 起動・デモ

1. `npm ci`
2. `npx playwright install chromium`（Linuxの共有ライブラリ不足時は`npx playwright install --with-deps chromium`）
3. `.env.example`を`.env`にコピーし、`ORCAROUTER_API_KEY`を設定。
4. `npm run dev`で起動し、表示URLを開く。
5. サンプル体験 → 記事修正 → 保存 → 承認 → PDF → 模擬郵送注文。
6. 実写真を追加してAI生成を確認する。実AI生成に失敗した場合はエラーを表示し、デモに自動切替しない。

検証: `npm test`、`npm run build`、`npm run test:e2e`。
