import { randomUUID } from 'node:crypto';

// 実事業者との契約・API仕様が確定後、同じ境界に実アダプターを追加する。
export async function createDemoOrder(paper, recipient, pdf) {
  if (!pdf.length) throw new Error('PDFが空です。');
  return { id: `DEMO-${randomUUID().slice(0, 8).toUpperCase()}`, newspaperId: paper.id, revision: paper.revision,
    recipient, mode: 'demo', status: 'simulated', createdAt: new Date().toISOString(),
    message: 'デモ注文を受け付けました。実際の印刷・郵送や料金の請求は発生しません。' };
}
