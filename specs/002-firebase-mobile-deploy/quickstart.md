# Firebase / Cloud Runデプロイ

前提: Google CloudとFirebaseへログイン済みで、対象プロジェクトがFirebaseへ登録され、課金が有効。

```bash
npm run deploy:firebase -- <project-id>
```

このコマンドはOrcaRouterキーを`.env`から一時ファイルへ読み、Secret Managerへ登録する。一時ファイルは終了時に削除する。Cloud RunへAPIをデプロイし、続けてFirebase Hostingへ`dist/`を公開する。

デプロイ後は`https://<project-id>.web.app`で、カメラ追加、AI生成、承認、PDF、模擬注文を実機確認する。
