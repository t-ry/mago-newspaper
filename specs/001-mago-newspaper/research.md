# 調査と判断

- OrcaRouter公式Quickstart: https://docs.orcarouter.ai/getting-started/quickstart — Bearer認証、`/v1/chat/completions`。
- エラー: https://docs.orcarouter.ai/operations/errors — エラーコードごとに認証、残高、キー上限、モデル許可を区別する。
- 利用状況: https://docs.orcarouter.ai/operations/billing-and-usage — 認証済みの利用量・クォータ確認APIと管理画面を利用する。
- 画像入力: https://docs.orcarouter.ai/advanced/vision — `image_url`にbase64 data URIを渡せる。標準モデルは画像入力・JSON契約を実機検証した`openai/gpt-5.2`。
- JSON: https://docs.orcarouter.ai/advanced/structured-outputs — `response_format: {type: json_object}`とサーバー側の独立した検証を組み合わせる。
- 画面とPDFの一致、日本語折返しを優先してChromium PDFを採用。画像だけのPDFではなく文字を保持する。
- 郵送事業者は未指定。汎用Webhookを実在の郵送APIとして扱わず、模擬アダプターの後ろに実事業者実装を追加する。
- 公開先は https://github.com/t-ry/mago-newspaper 。PUBLIC設定と未認証アクセスを確認済み。
- OrcaRouter実接続では認証、モデル一覧、`orcarouter/free`のテキスト生成に成功。提供キーの再設定後、`openai/gpt-5.2`とJPEG data URIで記事生成に成功した。比較した`anthropic/claude-sonnet-5`は現行のJSON契約を満たさず、MVPでは採用しなかった。
