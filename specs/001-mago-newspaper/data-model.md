# データと状態

- Session: ランダムID、作成/最終利用時刻、新聞Map。Cookieのみで関連づけ、別セッションには取得させない。
- Newspaper: id, revision, childName, issueDate, headline, intro, articles[{photoId, headline, body, reason}], message, photos[{id,dataUrl}], source(demo/orcarouter), model, approvedRevision, order。
- Order: id, newspaperId, revision, recipient{name,postalCode,address}, mode(demo), status(simulated), createdAt。

draft → approve → approved → order → simulated。
draft/approvedで編集するとrevisionを増やしapprovedRevisionを解除。注文済み版の編集は拒否し、次号を作成する。
注文APIは保存済み承認版を使い、同じ新聞版には既存注文を返す。PDF作成中の版変更は409で拒否する。
