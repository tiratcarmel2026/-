// בדיקת קצה-לקצה למיקום חי. הרצה: node tests/location.test.js   (דורש playwright + chromium)
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});

const CENTER = { latitude: 32.7590, longitude: 34.9712 };   // ליד כ"ג יורדי הסירה
const SOUTH = { latitude: 32.7508, longitude: 34.9746 };    // ליד רזיאל
let pass = 0, fail = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✔ ' : '  ✘ ') + msg); cond ? pass++ : fail++; };
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

(async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();

  console.log('1. מיקום מאושר מראש: נפתח אוטומטית בלי לחיצה');
  {
    const { ctx, page, errors } = await newPage(browser, { geolocation: CENTER, permissions: ['geolocation'] });
    await page.goto(URL); await page.waitForSelector('#nearest:not([hidden])', { timeout: 8000 }).catch(() => {});
    const first = await text(page, '#nearest .nearest__addr');
    ok(first.length > 0, `המקלט הקרוב הוצג אוטומטית: ${first}`);
    ok(/מעקב מיקום חי/.test(await text(page, '#live')), 'מחוון "מעקב מיקום חי" מוצג: ' + (await text(page, '#live-text')));
    ok(/דק׳|פחות מדקה/.test(await text(page, '#nearest .eta')), 'זמן הגעה מוצג');

    console.log('2. התושב זז: האתר מתעדכן לבד');
    await ctx.setGeolocation(SOUTH);
    await page.waitForFunction(f => document.querySelector('#nearest .nearest__addr')?.textContent !== f, first, { timeout: 8000 }).catch(() => {});
    const second = await text(page, '#nearest .nearest__addr');
    ok(second && second !== first, `המקלט הקרוב התעדכן מ"${first}" ל"${second}"`);
    ok(/התעדכן/.test(await text(page, '#locate-status')), 'הודעת "המקלט הקרוב התעדכן" הוצגה');
    const order = await page.$$eval('#list .item__addr', l => l.slice(0, 1).map(e => e.textContent));
    ok(order[0] === second, 'הרשימה ממוינת מחדש לפי המיקום החדש');

    console.log('3. הפסקת מעקב');
    await page.click('#live-stop');
    ok(!(await visible(page, '#live')), 'המעקב הופסק');
    ok(errors.length === 0, 'אין שגיאות JavaScript' + (errors.length ? ': ' + errors.join(' | ') : ''));
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'אין גלילה לרוחב בטלפון');
    await ctx.close();
  }

  console.log('4. מיקום חסום, התושב מאשר בהגדרות: האתר מתעדכן לבד');
  {
    const { ctx, page, errors } = await newPage(browser, { geolocation: CENTER, permissions: [] });
    await page.goto(URL);
    ok(!(await visible(page, '#nearest')), 'בלי אישור לא מוצג מקלט');
    await page.click('#btn-locate');
    await page.waitForSelector('#loc-help:not([hidden])', { timeout: 8000 }).catch(() => {});
    ok(await visible(page, '#loc-help'), 'הוראות הפעלת מיקום מוצגות: ' + (await text(page, '#loc-help-title')));
    await ctx.grantPermissions(['geolocation']);      // התושב אישר בהגדרות, בלי לגעת באתר
    await page.waitForSelector('#nearest:not([hidden])', { timeout: 10000 }).catch(() => {});
    ok(await visible(page, '#nearest'), 'אחרי האישור המקלט הקרוב הופיע אוטומטית');
    ok(!(await visible(page, '#loc-help')), 'ההוראות נעלמו');
    ok(errors.length === 0, 'אין שגיאות JavaScript' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await ctx.close();
  }

  console.log('5. שירותי המיקום בטלפון כבויים, מופעלים וחוזרים לאתר');
  {
    // מדמה טלפון ששירותי המיקום שלו כבויים (שגיאה 2) עד ש-window.__gpsOn נדלק
    const stub = () => {
      window.__gpsOn = false; let watchers = [];
      const pos = () => ({ coords: { latitude: 32.7590, longitude: 34.9712, accuracy: 12 }, timestamp: Date.now() });
      const err = { code: 2, message: 'Location services off', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
      const g = {
        getCurrentPosition: (ok, ko) => setTimeout(() => window.__gpsOn ? ok(pos()) : ko && ko(err), 50),
        watchPosition: (ok, ko) => { const id = watchers.length + 1; watchers.push(id); setTimeout(() => window.__gpsOn ? ok(pos()) : ko && ko(err), 50); return id; },
        clearWatch: () => {}
      };
      Object.defineProperty(navigator, 'geolocation', { get: () => g });
    };
    const { ctx, page, errors } = await newPage(browser, {}, stub);
    await page.goto(URL);
    await page.click('#btn-locate');
    await page.waitForSelector('#loc-help:not([hidden])', { timeout: 5000 }).catch(() => {});
    ok(/שירותי מיקום/.test(await text(page, '#loc-help-title')), 'הוצגו הוראות להפעלת שירותי מיקום בטלפון');
    await page.evaluate(() => { window.__gpsOn = true; });   // התושב הפעיל מיקום בסרגל ההתראות
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));   // וחזר לדפדפן
    await page.waitForSelector('#nearest:not([hidden])', { timeout: 6000 }).catch(() => {});
    ok(await visible(page, '#nearest'), 'בחזרה לאתר המקלט הקרוב הופיע אוטומטית');
    ok(await visible(page, '#live'), 'המעקב החי פעיל');
    ok(errors.length === 0, 'אין שגיאות JavaScript' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await ctx.close();
  }

  await browser.close(); server.close();
  console.log(`\n${pass} עברו, ${fail} נכשלו`);
  process.exit(fail ? 1 : 0);
})();
