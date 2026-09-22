# Implementation Plan: スマホ公開環境

**Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

## Summary

Viteの`dist/`をFirebase Hostingへ配置し、`/api/**`を東京リージョンのCloud Runサービス`mago-newspaper-api`へrewriteする。既存ExpressをPlaywright Chromium入りDockerコンテナとして実行する。

## Technical Context

- Frontend: Firebase Hosting、HTTPS、SPA rewrite。
- Backend: Cloud Run、Node.js 20、Express、最大1インスタンス、1GiBメモリ、120秒タイムアウト。
- Secret: Secret Managerの`orcarouter-api-key`を`ORCAROUTER_API_KEY`へ注入。
- PDF: Dockerビルド時にPlaywright ChromiumとOS依存ライブラリを導入。
- Region: `asia-northeast1`。

## Constitution Check

秘密情報を成果物へ含めず、実APIとデモを区別する。既存MVPのメモリ保存制約を維持し、永続化済みと誤認させない。実デプロイ前にプロジェクトと課金状態を確認する。
