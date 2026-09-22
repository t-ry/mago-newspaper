import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve('.cache/ms-playwright');
const { chromium } = await import('playwright');

test('サンプル→編集→承認→A4 PDF→模擬注文、モバイル表示', { timeout: 120000 }, async () => {
  await mkdir('test-results', { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:3000');
    await page.getByRole('button', { name: 'サンプルで体験する' }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
    await page.getByRole('button', { name: 'サンプルで体験する' }).click();
    await page.getByRole('heading', { name: '今週号が、できました。' }).waitFor();
    await page.frameLocator('iframe').locator('.family-note').waitFor();
    assert.equal(await page.getByRole('button', { name: 'この紙面を承認する' }).isDisabled(), true);
    await page.getByRole('button', { name: '記事・写真を編集する' }).click();
    await page.getByLabel('メイン見出し').fill('小さな毎日を、おじいちゃんへ。');
    await page.getByRole('button', { name: '変更を保存' }).click();
    await page.getByLabel('写真・記事を確認しました。').check();
    await page.getByRole('button', { name: 'この紙面を承認する' }).click();
    await page.getByRole('button', { name: 'A4 PDFをダウンロード' }).waitFor();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'A4 PDFをダウンロード' }).click();
    const download = await downloadPromise;
    await download.saveAs('test-results/newspaper.pdf');
    const doc = await PDFDocument.load(await readFile('test-results/newspaper.pdf'));
    assert.equal(doc.getPageCount(), 1);
    const size = doc.getPage(0).getSize();
    assert.ok(Math.abs(size.width - 595.28) < 2); assert.ok(Math.abs(size.height - 841.89) < 2);
    await page.screenshot({ path: 'test-results/newspaper-desktop.png', fullPage: true });
    await page.getByRole('button', { name: '印刷・郵送を試す' }).click();
    await page.getByLabel('お名前', { exact: true }).fill('デモ 花子');
    await page.getByLabel('郵便番号', { exact: true }).fill('100-0001');
    await page.getByLabel('住所', { exact: true }).fill('東京都千代田区 デモ用住所');
    await page.getByRole('button', { name: '模擬注文を確定する' }).click();
    await page.getByRole('heading', { name: '家族へのお届けを、体験しました。' }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'test-results/newspaper-mobile.png', fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('button', { name: '新しい号をつくる', exact: true }).last().click();
    await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
