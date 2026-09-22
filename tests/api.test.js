import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/app.js";
import { generateWithOrca } from "../server/orca.js";
import { newspaperHtml } from "../shared/newspaper.js";

const photo = {
  id: "p1",
  dataUrl:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9WQAAAAASUVORK5CYII=",
};
const input = { mode: "demo", childName: "はる", note: "", photos: [photo] };
const recipient = {
  name: "おばあちゃん",
  postalCode: "1000001",
  address: "東京都千代田区千代田1",
};
async function client(t, options = {}) {
  const app = createApp({
    pdfRenderer: async () => Buffer.from("%PDF-1.7 test"),
    ...options,
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  let cookie = "";
  return async (path, method = "GET", body, ownCookie = true) => {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}${path}`,
      {
        method,
        headers: {
          "content-type": "application/json",
          ...(ownCookie && cookie ? { cookie } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
    );
    if (ownCookie && response.headers.get("set-cookie"))
      cookie = response.headers.get("set-cookie").split(";")[0];
    const data = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? await response.json()
      : await response.text();
    return { status: response.status, data };
  };
}

test("承認前PDF拒否、編集で承認解除、古い版を拒否", async (t) => {
  const call = await client(t);
  const { data: paper } = await call("/api/newspapers", "POST", input);
  assert.ok(paper.id);
  const path = `/api/newspapers/${paper.id}`;
  assert.equal((await call(`${path}/pdf`)).status, 409);
  assert.equal(
    (await call(`${path}/approve`, "POST", { revision: 1 })).status,
    200,
  );
  assert.equal((await call(`${path}/pdf`)).status, 200);
  const update = {
    revision: 1,
    headline: "新しい見出し",
    intro: paper.intro,
    articles: paper.articles,
    message: paper.message,
  };
  const edited = await call(path, "PATCH", update);
  assert.equal(edited.data.revision, 2);
  assert.equal(edited.data.approvedRevision, null);
  assert.equal((await call(`${path}/pdf`)).status, 409);
  assert.equal(
    (await call(`${path}/approve`, "POST", { revision: 1 })).status,
    409,
  );
  assert.equal((await call(path, "GET", undefined, false)).status, 404);
});

test("注文は承認・住所を検証し重複を防ぐ", async (t) => {
  const call = await client(t);
  const { data: paper } = await call("/api/newspapers", "POST", input);
  const path = `/api/newspapers/${paper.id}`;
  assert.equal(
    (await call(`${path}/orders`, "POST", { revision: 1, recipient })).status,
    409,
  );
  await call(`${path}/approve`, "POST", { revision: 1 });
  assert.equal(
    (
      await call(`${path}/orders`, "POST", {
        revision: 1,
        recipient: { ...recipient, postalCode: "a" },
      })
    ).status,
    400,
  );
  const first = await call(`${path}/orders`, "POST", {
    revision: 1,
    recipient,
  });
  const second = await call(`${path}/orders`, "POST", {
    revision: 1,
    recipient,
  });
  assert.equal(first.status, 200);
  assert.equal(first.data.mode, "demo");
  assert.equal(first.data.id, second.data.id);
});

test("入力制限とキー未設定を明示しデモに自動フォールバックしない", async (t) => {
  const call = await client(t, { apiKey: "" });
  assert.equal(
    (await call("/api/newspapers", "POST", { ...input, photos: [] })).status,
    400,
  );
  assert.equal(
    (await call("/api/newspapers", "POST", { ...input, mode: "live" })).status,
    503,
  );
  assert.equal(
    (
      await call("/api/newspapers", "POST", {
        ...input,
        photos: [{ id: "p1", dataUrl: "https://example.com/image.png" }],
      })
    ).status,
    400,
  );
});

test("OrcaRouterへ実画像とBearer認証を送り、応答を検証する", async () => {
  let request;
  const good = {
    headline: "今日の小さなニュース",
    intro: "元気な毎日をお届け。",
    message: "また会おうね。",
    articles: [
      {
        photoId: "p1",
        headline: "笑顔の時間",
        body: "写真に写る日常をお届けします。",
        reason: "表情が見える写真です。",
      },
    ],
  };
  const result = await generateWithOrca(input, {
    apiKey: "test-only",
    model: "openai/gpt-4o-mini",
    fetchImpl: async (url, options) => {
      request = { url, ...options };
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(good) } }],
        }),
        { status: 200 },
      );
    },
  });
  assert.match(
    request.url,
    /^https:\/\/api\.orcarouter\.ai\/v1\/chat\/completions$/,
  );
  assert.equal(request.headers.Authorization, "Bearer test-only");
  assert.ok(
    JSON.parse(request.body).messages[1].content.some(
      (part) => part.image_url?.url === photo.dataUrl,
    ),
  );
  assert.equal(result.articles[0].photoId, "p1");
  await assert.rejects(
    () =>
      generateWithOrca(input, {
        apiKey: "test-only",
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      ...good,
                      articles: [{ ...good.articles[0], photoId: "unknown" }],
                    }),
                  },
                },
              ],
            }),
          ),
      }),
    /写真/,
  );
  await assert.rejects(
    () =>
      generateWithOrca(input, {
        apiKey: "test-only",
        fetchImpl: async () => new Response("secret upstream", { status: 401 }),
      }),
    /認証/,
  );
  await assert.rejects(
    () =>
      generateWithOrca(input, {
        apiKey: "test-only",
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              error: { type: "orcarouter_api_error", code: "payment_required" },
            }),
            { status: 402, headers: { "content-type": "application/json" } },
          ),
      }),
    /クレジット/,
  );
  await assert.rejects(
    () =>
      generateWithOrca(input, {
        apiKey: "test-only",
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              error: {
                type: "orcarouter_api_error",
                code: "pre_consume_token_quota_failed",
              },
            }),
            { status: 403, headers: { "content-type": "application/json" } },
          ),
      }),
    /APIキーの利用上限/,
  );
});

test("並行する注文は同じ結果を返し、処理中の編集は拒否する", async (t) => {
  let start, finish;
  const started = new Promise((resolve) => {
    start = resolve;
  });
  const gate = new Promise((resolve) => {
    finish = resolve;
  });
  const call = await client(t, {
    pdfRenderer: async () => {
      start();
      await gate;
      return Buffer.from("%PDF");
    },
  });
  const { data: paper } = await call("/api/newspapers", "POST", input);
  const path = `/api/newspapers/${paper.id}`;
  await call(`${path}/approve`, "POST", { revision: 1 });
  const first = call(`${path}/orders`, "POST", { revision: 1, recipient });
  await started;
  const second = call(`${path}/orders`, "POST", { revision: 1, recipient });
  const edit = await call(path, "PATCH", { ...paper, revision: 1 });
  assert.equal(edit.status, 409);
  finish();
  const results = await Promise.all([first, second]);
  assert.equal(results[0].data.id, results[1].data.id);
});

test("PDF生成中に版が変わったら古いPDFを返さない", async (t) => {
  let start, finish;
  const started = new Promise((resolve) => {
    start = resolve;
  });
  const gate = new Promise((resolve) => {
    finish = resolve;
  });
  const call = await client(t, {
    pdfRenderer: async () => {
      start();
      await gate;
      return Buffer.from("%PDF");
    },
  });
  const { data: paper } = await call("/api/newspapers", "POST", input);
  const path = `/api/newspapers/${paper.id}`;
  await call(`${path}/approve`, "POST", { revision: 1 });
  const pdf = call(`${path}/pdf`);
  await started;
  await call(path, "PATCH", {
    ...paper,
    headline: "改版しました",
    revision: 1,
  });
  finish();
  assert.equal((await pdf).status, 409);
});

test("紙面では入力文字列をHTMLとして実行しない", () => {
  const html = newspaperHtml({
    childName: "<script>alert(1)</script>",
    issueDate: "today",
    headline: "<img src=x onerror=alert(1)>",
    intro: "& hello",
    message: "<iframe>",
    photos: [photo],
    articles: [{ photoId: "p1", headline: "<svg>", body: "本文" }],
  });
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;script&gt;"));
});
