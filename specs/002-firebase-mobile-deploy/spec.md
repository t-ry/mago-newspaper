# Feature Specification: スマホ公開環境

**Created**: 2026-09-22 | **Status**: AWS移行のため中止

親がスマホからHTTPSのURLを開き、カメラ撮影から新聞作成まで利用できる公開環境を用意する。

## User Scenarios & Testing

### US1 スマホから安全に開く（P1）

1. 親はインストール作業なしでHTTPSのURLを開ける。
2. 同じURLから画面とAPIを利用でき、ブラウザへOrcaRouterキーを配布しない。
3. 「カメラで撮る」から撮影した写真を取り込み、AI記事生成へ進める。

### US2 PDFと模擬注文を利用する（P1）

1. 公開環境でも承認済み新聞をA4 PDFとして取得できる。
2. 模擬郵送注文まで同一セッションで完了できる。

## Requirements

- FR-001: Reactの静的ファイルをFirebase HostingからHTTPS配信する。
- FR-002: `/api/**`を同一FirebaseプロジェクトのCloud Runへ転送する。
- FR-003: OrcaRouterキーをSecret Managerからサーバーへ渡し、イメージ・Git・画面に含めない。
- FR-004: Playwright Chromiumを含む再現可能なコンテナでPDFを生成する。
- FR-005: MVPのメモリセッションを維持するためCloud Runの最大インスタンス数を1にする。再起動でデータが消える制約を表示・文書化する。

## Success Criteria

- SC-001: `web.app`のHTTPS URLをスマホで開ける。
- SC-002: 公開URLでカメラ写真追加、OrcaRouter記事生成、承認、A4 PDF、模擬注文が成功する。
- SC-003: 公開された静的ファイルとコンテナにAPIキーが含まれない。

## Assumptions / Scope

- 初期公開はハッカソンMVP向け。Firebase Authentication、Firestore、Cloud Storage、独自ドメインは次段階。
- Cloud Runの再起動時に新聞データは失われる。永続化前は長期保存サービスとして扱わない。
- Google Cloudの課金有効化が必要。対象プロジェクトと課金設定はユーザー確認後に決定する。
