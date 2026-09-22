# HTTP API

全APIは同一オリジン、セッションCookie、JSONエラー`{error}`を使用。

| Method / Path | Input | Output |
| --- | --- | --- |
| GET /api/config | — | AI設定有無、モデル、郵送モード |
| POST /api/newspapers | childName, note, photos, mode | 新聞と記事、版、生成元 |
| GET /api/newspapers/:id | — | 所有する新聞 |
| PATCH /api/newspapers/:id | revision, headline, intro, articles, message | 改版された新聞、承認解除 |
| POST /api/newspapers/:id/approve | revision | 承認済み新聞 |
| GET /api/newspapers/:id/pdf | — | 承認済みA4 PDF |
| POST /api/newspapers/:id/orders | revision, recipient | 注文（デモを明示） |

400入力不正、404新聞が存在しない/所有者不一致、409版不一致/未承認、413過大、429処理中/上限、502外部AI失敗、503キー未設定。
