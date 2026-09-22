# 提出メモ

締切: **2026-09-22 15:00 JST**

## 提出URL

- GitHub: https://github.com/t-ry/mago-newspaper （PUBLIC / main、公開確認済み）
- Qiita投稿先: https://qiita.com/t-ry
- Qiita記事: 原稿作成済み、公開認証の設定待ち

## 5分デモ

1. `npm run dev`で起動。トップ画面でコンセプトを説明。
2. 「サンプルで体験する」で紙面を表示（固定文章・イラスト、AI未使用と明示）。
3. 「記事・写真を編集する」で一言を変更し保存。
4. チェックボックスで確認し「この紙面を承認する」。
5. A4 PDFを保存して開く。日本語・写真・1ページを確認。
6. 「印刷・郵送を試す」でデモ宛先を入力し模擬注文。
7. 実AI設定済みなら、新しい号で写真を追加しOrcaRouterによる選定を実演。

## 投稿準備

- [x] Qiita原稿: `docs/qiita-draft.md`
- [x] READMEに導入・OrcaRouter・模擬郵送・制約を記載
- [x] 公開リポジトリ作成・push、PUBLIC状態確認、未認証HTTP 200確認
- [x] 実OrcaRouter疎通結果を記事へ反映（認証・モデル一覧・無料テキスト成功、画像生成は残高不足のHTTP 402）
- [x] 公開GitHub URLをQiita原稿へ反映
- [x] AI HACK・OrcaRouter様への言及と公式リンクを記事へ反映
- [x] Qiitaタグを確定（AI、React、JavaScript、ハッカソン、OrcaRouter）
- [ ] Qiita投稿・公開URL確認
- [ ] 提出フォームに両URLを記入

OrcaRouterの画像入力を使う最終確認は、ワークスペースへのクレジット反映後に`npm run verify:orcarouter`で実行する。
Qiitaの`write_qiita`権限を持つトークンを`.env`の`QIITA_ACCESS_TOKEN`へ設定後、`npm run publish:qiita`で公開する。同じタイトルの記事が既にある場合は重複投稿せず、そのURLを返す。

写真・APIキー・宛先・`.env`は公開対象に含めない。掲載スクリーンショットには同梱デモ素材のみを使う。

タグ候補: AI、React、個人開発、ハッカソン、OrcaRouter。募集要項の指定タグがあれば優先する。
