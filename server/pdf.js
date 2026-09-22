import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { newspaperHtml } from '../shared/newspaper.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fonts;
export function getFontCss() {
  if (fonts) return fonts;
  const fontRoot = path.join(root, 'node_modules/@fontsource/noto-serif-jp');
  fonts = [400, 700].map(weight => readFileSync(path.join(fontRoot, `${weight}.css`), 'utf8').replace(/,\s*url\([^)]+\) format\('woff'\)/g, '').replace(/url\(([^)]+)\)/g, (_, url) => {
    const file = path.join(fontRoot, url.replace(/["']/g, ''));
    return `url(data:font/woff2;base64,${readFileSync(file).toString('base64')})`;
  })).join('\n');
  return fonts;
}

let rendering = 0;
export async function renderPdf(paper) {
  if (rendering >= 2) { const error = new Error('PDFを作成中です。少し待って再度お試しください。'); error.status = 429; throw error; }
  rendering++;
  let browser;
  try {
    process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(root, '.cache/ms-playwright');
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ javaScriptEnabled: false });
    await context.route('**/*', route => route.abort());
    const page = await context.newPage();
    await page.setContent(newspaperHtml(paper, getFontCss()), { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => ({
      imagesValid: [...document.images].every(img => img.complete && img.naturalWidth > 0),
      contentBottom: document.querySelector('.family-note').getBoundingClientRect().bottom,
      footerTop: document.querySelector('.paper-footer').getBoundingClientRect().top,
    }));
    if (!layout.imagesValid) { const error = new Error('写真を読み込めませんでした。別の写真で作成してください。'); error.status = 400; throw error; }
    if (layout.contentBottom > layout.footerTop - 8) { const error = new Error('記事がA4紙面に収まりません。見出しや本文を短くして再承認してください。'); error.status = 400; throw error; }
    return await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  } finally { await browser?.close(); rendering--; }
}
