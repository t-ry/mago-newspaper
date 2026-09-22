# 調査と判断

- Firebase HostingはReact SPAの静的配信とCloud Runへのrewriteに対応する。
- Playwright Chromiumを必要とするため、Functionsの小さな実行パッケージよりDockerを直接制御できるCloud Runを採用する。
- Cloud RunとFirebase Hostingを同一プロジェクト・東京リージョンで運用する。
- 現行データはプロセスメモリにあるため、初期デプロイは最大1インスタンスとする。可用性と永続化を高める段階でFirestore / Cloud Storageへ移行する。
