# AWS公開環境

## 公開URL

https://main.d2lslwov00yd74.amplifyapp.com

## 構成

- AWS Amplify Hosting: Reactの静的画面と`/api/**`のリバースプロキシ。
- AWS App Runner: Express、OrcaRouter連携、Playwright ChromiumによるPDF生成。
- Amazon ECR: `mago-newspaper-api:latest`コンテナ。
- AWS Secrets Manager: `mago-newspaper/orcarouter-api-key`。
- Region: `ap-northeast-1`（東京）。

App Runnerは最大1インスタンスに制限している。これにより現在のメモリセッションを同じプロセスで扱うが、再起動時には作成中の新聞が消える。

## 更新

AWS CLI 2.32以降で`aws login --remote --region ap-northeast-1 --profile mago`を実行した後に更新する。

```bash
AWS_CLI=/path/to/aws npm run deploy:aws
```

DockerイメージをECRへpushしてApp Runnerのデプロイを開始し、`dist/`をAmplify Hostingへ手動デプロイする。OrcaRouterキーは更新しない。

各npmスクリプトはPATH上の`aws`、または`/tmp/mago-aws-bin/aws`を自動検出する。別の場所にある場合は`AWS_CLI=/path/to/aws`を付けて実行する。

Docker実行イメージはNode.js 22 / Debian 13 slimを基に、Playwrightが必要とするChromiumと実行ライブラリだけを導入する。アプリは`node`ユーザーで実行する。2026-09-22のECR基本スキャン結果はCritical 0、High 9、Medium 13、Low 2、Undefined 1。

## 一時停止と再開

App Runnerは待機中も料金が発生する。デモを公開しない期間はAPIを一時停止できる。Amplifyの画面は残るが、停止中は新聞生成・PDF・注文APIを利用できない。

```bash
AWS_CLI=/path/to/aws npm run pause:aws
AWS_CLI=/path/to/aws npm run resume:aws
```

## AWSリソース

- Amplify app: `d2lslwov00yd74`
- App Runner service: `mago-newspaper-api`
- ECR repository: `mago-newspaper-api`
- Secrets Manager secret: `mago-newspaper/orcarouter-api-key`
- IAM roles: `MagoNewspaperAppRunnerEcrAccess` / `MagoNewspaperAppRunnerInstance`
- Auto Scaling: `mago-newspaper-single-instance`（min 1 / max 1）
