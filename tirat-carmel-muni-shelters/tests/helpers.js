// משותף לבדיקות: שרת סטטי מקומי ופתיחת דף בטלפון מדומה
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});

const CENTER = { latitude: 32.7590, longitude: 34.9712 };   // ליד כ"ג יורדי הסירה
const SOUTH = { latitude: 32.7508, longitude: 34.9746 };    // ליד רזיאל
const result = { pass: 0, fail: 0 };
const ok = (cond, msg) => { console.log((cond ? '  ✔ ' : '  ✘ ') + msg); cond ? result.pass++ : result.fail++; };
const text = (p, sel) => p.$eval(sel, e => e.hidden ? '' : e.innerText).catch(() => '');
const visible = (p, sel) => p.$eval(sel, e => !e.hidden).catch(() => false);

async function newPage(browser, ctxOpts, initScript) {
  const ctx = await browser.newContext({ ...devices['Pixel 7'], locale: 'he-IL', ...ctxOpts });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|tile/i.test(m.text())) errors.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)|tile\.openstreetmap/, r => r.abort());
  if (initScript) await page.addInitScript(initScript);
  return { ctx, page, errors };
}

module.exports = { chromium, server, CENTER, SOUTH, ok, text, visible, newPage, result };
