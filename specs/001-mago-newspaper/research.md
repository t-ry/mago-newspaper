# 調査と判断

- OrcaRouter公式Quickstart: https://docs.orcarouter.ai/getting-started/quickstart — Bearer認証、`/v1/chat/completions`。
- 画像入力: https://docs.orcarouter.ai/advanced/vision — `image_url`にbase64 data URIを渡す場合、OpenAI/Geminiを利用できる。初期モデルは公式例の`openai/gpt-4o-mini`。
- JSON: https://docs.orcarouter.ai/advanced/structured-outputs — `response_format: {type: json_object}`とサーバー側の独立した検証を組み合わせる。
- 画面とPDFの一致、日本語折返しを優先してChromium PDFを採用。画像だけのPDFではなく文字を保持する。
- 郵送事業者は未指定。汎用Webhookを実在の郵送APIとして扱わず、模擬アダプターの後ろに実事業者実装を追加する。
- 10:41 JST時点でGit remoteなし。READMEは導入時のものだけ。gh認証はネットワーク許可下で再確認が必要。
