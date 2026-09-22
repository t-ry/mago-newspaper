# Implementation Plan: AWS Amplifyスマホ公開

**Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

## Architecture

```text
smartphone
  -> AWS Amplify Hosting (React / HTTPS)
  -> /api/** reverse proxy
  -> AWS App Runner (Express / Playwright / OrcaRouter)
  -> AWS Secrets Manager
```

静的画面はAmplify Hostingへ配置する。220MBのAmplify Computeバンドル上限に対してChromium入り実行環境が大きいため、APIとPDF生成はDockerを実行できるApp Runnerへ分離する。ECRにイメージを保存し、最大インスタンス数を1に制限する。

## Security

- OrcaRouterキーはSecrets Managerから実行時に注入する。
- App Runnerのインスタンスロールは対象シークレットの読み取りだけを許可する。
- APIはAmplifyの公開Originだけを許可する。
- 一時認証を利用し、AWS長期アクセスキーをリポジトリへ保存しない。
