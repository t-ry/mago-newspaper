import { readFile } from "node:fs/promises";
import path from "node:path";

process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve(".cache/ms-playwright");
const { chromium } = await import("playwright");

const baseUrl = new URL(process.env.TEST_BASE_URL || "http://127.0.0.1:3000")
  .origin;

async function demoJpeg() {
  const svg = await readFile("public/demo/park.svg");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 700 },
    });
    const source = `data:image/svg+xml;base64,${svg.toString("base64")}`;
    await page.setContent(
      `<style>*{margin:0}html,body,img{width:100%;height:100%}img{object-fit:cover}</style><img src="${source}" alt="demo">`,
    );
    await page.locator("img").waitFor();
    return await page.screenshot({ type: "jpeg", quality: 82 });
  } finally {
    await browser.close();
  }
}

async function main() {
  const photoId = "public-live-demo-photo";
  const jpeg = await demoJpeg();
  const response = await fetch(`${baseUrl}/api/newspapers`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseUrl,
    },
    body: JSON.stringify({
      mode: "live",
      childName: "はるちゃん",
      note: "公園で過ごした日のデモ用イラストです。事実は画像とこのメモの範囲に限定してください。",
      photos: [
        {
          id: photoId,
          dataUrl: `data:image/jpeg;base64,${jpeg.toString("base64")}`,
        },
      ],
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  if (result.source !== "orcarouter") throw new Error("AI生成元が不正です。");
  if (!result.articles?.length) throw new Error("記事が生成されませんでした。");
  if (result.articles.some((article) => article.photoId !== photoId))
    throw new Error("生成記事が未知の写真を参照しています。");

  console.log(
    JSON.stringify({
      verified: true,
      baseUrl,
      source: result.source,
      model: result.model,
      articleCount: result.articles.length,
      validPhotoReferences: true,
    }),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({ verified: false, baseUrl, message: error.message }),
  );
  process.exitCode = 1;
});
