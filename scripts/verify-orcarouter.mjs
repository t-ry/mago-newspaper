import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { generateWithOrca } from "../server/orca.js";

async function main() {
  if (!process.env.ORCAROUTER_API_KEY) {
    throw new Error("ORCAROUTER_API_KEY is not configured in .env");
  }

  const svg = await readFile("public/demo/park.svg");
  const browser = await chromium.launch({ headless: true });
  let jpeg;

  try {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 700 },
    });
    const source = `data:image/svg+xml;base64,${svg.toString("base64")}`;
    await page.setContent(
      `<style>*{margin:0}html,body,img{width:100%;height:100%}img{object-fit:cover}</style><img src="${source}" alt="demo">`,
    );
    await page.locator("img").waitFor();
    jpeg = await page.screenshot({ type: "jpeg", quality: 82 });
  } finally {
    await browser.close();
  }

  const photoId = "orcarouter-live-demo-photo";
  const result = await generateWithOrca({
    childName: "はるちゃん",
    note: "公園で過ごした日のデモ用イラストです。事実は画像とこのメモの範囲に限定してください。",
    photos: [
      {
        id: photoId,
        dataUrl: `data:image/jpeg;base64,${jpeg.toString("base64")}`,
      },
    ],
  });

  const textLengths = [
    result.headline.length,
    result.intro.length,
    result.message.length,
    ...result.articles.flatMap((article) => [
      article.headline.length,
      article.body.length,
      article.reason.length,
    ]),
  ];

  console.log(
    JSON.stringify({
      verified: true,
      endpoint: "https://api.orcarouter.ai/v1/chat/completions",
      model: process.env.ORCAROUTER_MODEL || "openai/gpt-5.2",
      imageInput: "jpeg-data-uri",
      articleCount: result.articles.length,
      validPhotoReferences: result.articles.every(
        (article) => article.photoId === photoId,
      ),
      generatedTextLengths: textLengths,
    }),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      verified: false,
      stage: "image-generation",
      message: error.message,
    }),
  );
  process.exitCode = 1;
});
