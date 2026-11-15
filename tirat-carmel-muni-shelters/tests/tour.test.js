const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
// בדיקת הסיור הווירטואלי. הרצה (אחרי tools/build_tour.py): node tests/tour.test.js [תיקייה לצילומים]
const ROOT = path.resolve(__dirname, '../tour'), OUT = process.argv[2] || require('os').tmpdir(), LEAF = path.resolve(__dirname, '../vendor/leaflet.js');
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.jpg': 'image/jpeg' }[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise(r => srv.listen(0, r)); const URL = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); c ? pass++ : fail++; };
  for (const [name, opts] of [['desk', { viewport: { width: 1366, height: 820 } }], ['phone', { ...devices['iPhone 13'] }]]) {
    console.log(name);
    const ctx = await b.newContext({ ...opts, deviceScaleFactor: 1 }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/fonts|Failed to load resource/.test(m.text()) && errs.push(m.text()));
    await p.route(/cdnjs.*leaflet/, r => r.fulfill({ path: LEAF, contentType: 'text/javascript' }));
    await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    await p.goto(URL); await p.waitForTimeout(1200);
    ok(await p.isVisible('#start'), 'מסך פתיחה מוצג');
    ok((await p.textContent('#n-protected')) === '28' && (await p.textContent('#n-shelter')) === '33' && (await p.textContent('#n-all')) === '61', 'מספרי תחנות: 28 / 33 / 61');
    await p.screenshot({ path: `${OUT}/t-${name}-start.png` });
    await p.uncheck('#voice-on'); await p.click('.choice[data-mode="protected"]');
    await p.waitForTimeout(3200);
    ok(/תחנה 1 מתוך 28/.test(await p.textContent('#c-eyebrow')), 'תחנה 1 מתוך 28: ' + (await p.textContent('#c-addr')));
    ok(await p.$$eval('.mk b:not([hidden])', l => l.length) === 28, '28 תחנות ממוספרות במפה');
    await p.screenshot({ path: `${OUT}/t-${name}-stop1.png` });
    await p.click('#b-next'); await p.waitForTimeout(2200);
    ok(/תחנה 2 מתוך 28/.test(await p.textContent('#c-eyebrow')), 'כפתור „הבא" עובד: ' + (await p.textContent('#c-addr')));
    const seen = new Set([await p.textContent('#c-addr')]);
    for (let i = 0; i < 27; i++) { await p.click('#b-next'); await p.waitForTimeout(120); if (await p.isVisible('#card')) seen.add(await p.textContent('#c-addr')); }
    await p.waitForTimeout(2500);
    ok(await p.isVisible('#end'), 'מסך סיום: ' + (await p.textContent('#s-stops')) + ' תחנות, ' + (await p.textContent('#s-hoods')) + ' אזורים, ' + (await p.textContent('#s-km')) + ' ק״מ');
    ok(seen.size >= 27, 'כל התחנות שונות זו מזו (' + seen.size + ')');
    await p.screenshot({ path: `${OUT}/t-${name}-end.png` });
    await p.click('#b-explore2'); await p.waitForTimeout(1200);
    await p.evaluate(() => document.getElementById('mk-18').click()); await p.waitForTimeout(1200);
    ok(/הרצל 39/.test(await p.textContent('#c-addr')) && await p.isVisible('#b-close'), 'סיור חופשי: לחיצה על סמן פותחת כרטיס (הרצל 39)');
    // the full tour: every shelter and protected space in one sequence
    await p.click('#b-menu'); await p.click('#b-start-all'); await p.waitForTimeout(3000);
    ok(/תחנה 1 מתוך 61/.test(await p.textContent('#c-eyebrow')), 'הסיור המלא: תחנה 1 מתוך 61 (' + (await p.textContent('#c-addr')) + ')');
    ok(await p.$$eval('.mk b:not([hidden])', l => l.length) === 61 && await p.$$eval('.mk.is-dim', l => l.length) === 0, 'כל 61 המקומות ממוספרים במסלול');
    const kinds = new Set();
    for (let i = 0; i < 61; i++) { const t = await p.$eval('#c-chips', e => e.textContent); kinds.add(/מיגונית/.test(t) ? 'p' : 's'); await p.click('#b-next'); await p.waitForTimeout(40); }
    await p.waitForTimeout(2500);
    ok(kinds.size === 2, 'המסלול עובר גם במקלטים וגם במיגוניות');
    ok(await p.isVisible('#end') && (await p.textContent('#s-stops')) === '61', 'מסך הסיום: 61 תחנות, ' + (await p.textContent('#s-km')) + ' ק״מ');
    // auto-play advances by itself
    await p.click('#b-again'); await p.click('.choice[data-mode="shelter"]'); await p.selectOption('#speed', '1.6');
    await p.waitForTimeout(9000);
    const auto = await p.textContent('#c-eyebrow');
    ok(/תחנה [2-9] מתוך 33/.test(auto), 'ניגון אוטומטי מתקדם לבד: ' + auto);
    ok(errs.length === 0, 'אין שגיאות' + (errs.length ? ': ' + errs.join(' | ') : ''));
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'אין גלילה לרוחב');
    await ctx.close();
  }
  await b.close(); srv.close(); console.log(`${pass} עברו, ${fail} נכשלו`); process.exit(fail ? 1 : 0);
})();
