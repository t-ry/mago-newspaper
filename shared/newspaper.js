export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

export const newspaperCss = `
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#292f27}body{font-family:'Noto Serif JP',serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.paper{width:794px;height:1122px;padding:42px 48px 32px;background:#fffdf7;overflow:hidden;position:relative}.paper-kicker{display:flex;justify-content:space-between;font-size:10px;letter-spacing:2px;border-bottom:1px solid #394733;padding-bottom:10px}.paper-masthead{display:flex;align-items:center;justify-content:space-between;border-bottom:4px double #394733;padding:14px 0 17px}.paper-masthead h1{font-size:43px;letter-spacing:5px;margin:0;line-height:1.5}.paper-seal{border:1px solid #b36445;color:#b36445;font-size:13px;writing-mode:vertical-rl;padding:7px;letter-spacing:3px}.paper-subtitle{font-size:10px;letter-spacing:3px;margin:4px 0 0}.paper-date{font-size:10px;line-height:1.9;text-align:right}.paper-headline{font-size:27px;line-height:1.6;margin:19px 0 8px;letter-spacing:1px;overflow-wrap:anywhere}.paper-intro{font-size:11px;line-height:1.9;margin:0 0 16px;overflow-wrap:anywhere}.lead{display:grid;grid-template-columns:1.38fr 1fr;gap:22px;padding-bottom:19px;border-bottom:1px solid #a6ac9b}.lead img{width:100%;height:266px;object-fit:cover;display:block}.article-number{font-family:Georgia,serif;color:#b16d48;font-size:11px;letter-spacing:2px}.lead h3{font-size:22px;line-height:1.65;margin:8px 0 10px;overflow-wrap:anywhere}.lead p{font-size:12px;line-height:2.05;margin:0;overflow-wrap:anywhere}.secondary{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:18px}.secondary article+article{border-left:1px solid #d4d5ca;padding-left:22px}.secondary img{width:100%;height:150px;object-fit:cover}.secondary h3{font-size:15px;line-height:1.7;margin:9px 0 6px;overflow-wrap:anywhere}.secondary p{font-size:10px;line-height:1.95;margin:0;overflow-wrap:anywhere}.family-note{margin-top:19px;background:#f0f0e4;border-top:1px solid #c6ccb7;padding:13px 18px;display:flex;gap:18px;align-items:center}.family-note span{font-size:10px;color:#596a49;white-space:nowrap}.family-note p{font-size:12px;line-height:1.9;margin:0;overflow-wrap:anywhere}.paper-footer{position:absolute;bottom:24px;left:48px;right:48px;border-top:1px solid #a6ac9b;padding-top:9px;font-size:9px;display:flex;justify-content:space-between;letter-spacing:1px}.single .lead img{height:380px}.single .lead{margin-top:28px}.single .family-note{margin-top:36px}@page{size:A4 portrait;margin:0}@media print{.paper{width:210mm;height:297mm}}
`;

export function newspaperHtml(paper, fontCss = "") {
  const e = escapeHtml;
  const photo = (id) => {
    const url = paper.photos.find((p) => p.id === id)?.dataUrl || "";
    return /^data:image\/(jpeg|png|webp);base64,/.test(url) ? e(url) : "";
  };
  const [lead, ...rest] = paper.articles;
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${fontCss}\n${newspaperCss}</style></head><body><main class="paper ${rest.length ? "" : "single"}">
<div class="paper-kicker"><span>THE LITTLE FAMILY TIMES</span><span>なんでもない日が、家族の宝物。</span></div>
<header class="paper-masthead"><div><h1>孫ニュースペーパ</h1><p class="paper-subtitle">${e(paper.childName)}の、ちいさな日常通信</p></div><span class="paper-seal">家族限定版</span><div class="paper-date">${e(paper.issueDate)}<br>第 01 号<br>${paper.source === "demo" ? "サンプル紙面" : "家族の編集室 発行"}</div></header>
<h2 class="paper-headline">${e(paper.headline)}</h2><p class="paper-intro">${e(paper.intro)}</p>
<section class="lead"><img src="${photo(lead.photoId)}" alt="掲載写真"><div><span class="article-number">01 / TOP STORY</span><h3>${e(lead.headline)}</h3><p>${e(lead.body)}</p></div></section>
${rest.length ? `<section class="secondary">${rest.map((a, i) => `<article><img src="${photo(a.photoId)}" alt="掲載写真 ${i + 2}"><h3>${e(a.headline)}</h3><p>${e(a.body)}</p></article>`).join("")}</section>` : ""}
<aside class="family-note"><span>家族からの<br>ひとこと</span><p>${e(paper.message)}</p></aside>
<footer class="paper-footer"><span>離れていても、いつも家族。</span><span>孫ニュースペーパ · ${paper.source === "demo" ? "DEMO" : "MADE WITH LOVE"}</span></footer></main></body></html>`;
}
