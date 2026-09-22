# Feature Specification: AWS Amplifyスマホ公開

**Created**: 2026-09-22 | **Status**: 実装中

親がスマホからHTTPSのURLを開き、カメラ撮影から新聞作成、A4 PDF、模擬注文まで利用できるAWS公開環境を用意する。

## User Scenarios & Testing

### US1 AmplifyのURLから利用する（P1）

1. 親はインストールなしでAmplify HostingのHTTPS URLを開ける。
2. `main`ブランチ相当の画面から`/api/**`を同一オリジンとして利用できる。
3. OrcaRouterキーはブラウザやコンテナイメージへ含まれない。

### US2 新聞を最後まで作成する（P1）

1. スマホカメラの写真を取り込める。
2. AI記事生成、編集、承認、A4 PDF取得、模擬注文が完了する。

## Requirements

- FR-001: Reactの`dist/`をAWS Amplify HostingからHTTPS配信する。
- FR-002: Amplifyの`/api/**`を東京リージョンのAWS App Runnerへリバースプロキシする。
- FR-003: App Runnerは既存のDockerfileを使い、Playwright ChromiumでPDFを生成する。
- FR-004: OrcaRouterキーをAWS Secrets Managerへ保存し、専用IAMロールだけへ読み取りを許可する。
- FR-005: メモリセッションを維持するためApp Runnerの最大インスタンス数を1にする。
- FR-006: AWSリソース名、公開手順、停止手順を文書化する。

## Success Criteria

- SC-001: AmplifyのHTTPS URLがスマホとPCから表示できる。
- SC-002: 公開URLでカメラ追加から模擬注文までE2Eが成功する。
- SC-003: 公開成果物、Git、ECRイメージにAPIキーが含まれない。

## Scope

初期公開はハッカソンMVP向け。App Runnerは待機中も料金が発生するため、デモ終了後に停止または削除できる手順を用意する。永続保存、ユーザー認証、実郵送は次段階とする。
