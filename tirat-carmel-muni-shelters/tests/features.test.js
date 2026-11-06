// בדיקות: זמן התגוננות, קישור משלט QR, מצב סקר שטח. הרצה: node tests/features.test.js
const { chromium, server, CENTER, ok, text, visible, newPage, result } = require('./helpers');
const HERZL39 = { latitude: 32.764465, longitude: 34.970896 };   // קניון לב העיר (מיקום מדויק)
const BEN_ZVI = { latitude: 32.75232, longitude: 34.97167 };

(async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();

  console.log('1. זמן התגוננות: ליד מקלט, אפשר להגיע בזמן');
  {
    const { ctx, page, errors } = await newPage(browser, { geolocation: HERZL39, permissions: ['geolocation'] });
    await page.goto(URL); await page.waitForSelector('#prot', { timeout: 8000 }).catch(() => {});
    ok(await page.$eval('#prot', e => e.dataset.ok).catch(() => '') === '1', 'מוצג „אפשר להגיע בזמן ההתגוננות": ' + (await text(page, '#prot')).split('\n')[0]);
    ok(/60 שניות/.test(await text(page, '#prot')), 'זמן ההתגוננות (60 שניות) מופיע בהסבר');
    ok(/60 שניות/.test(await text(page, '#prot-sec')), 'זמן ההתגוננות מוצג גם בכרטיס מספרי החירום');
    ok(await page.$$eval('.item__dist.is-ok', l => l.length) > 0, 'ברשימה מסומנים מקלטים שמגיעים אליהם בזמן');
    ok(await page.evaluate(() => !!document.querySelector('path.leaflet-interactive, .leaflet-overlay-pane path')), 'עיגול טווח ההגעה מצויר במפה');

    console.log('2. זמן התגוננות: רחוק מכל מקלט, מוצגות הנחיות פיקוד העורף');
    await ctx.setGeolocation({ latitude: 32.7700, longitude: 34.9600 });   // צפון-מערב, רחוק מהרשימה
    await page.waitForFunction(() => document.querySelector('#prot')?.dataset.ok === '0', null, { timeout: 8000 }).catch(() => {});
    const far = await text(page, '#prot');
    ok(/רחוק מכדי להגיע בזמן/.test(far), 'מוצגת אזהרה „המקלט הציבורי רחוק מכדי להגיע בזמן"');
    ok(/ממ״ד/.test(far) && /שכבו על הקרקע/.test(far) && /10 דקות/.test(far), 'מוצגות הנחיות: ממ״ד, בחוץ, ברכב, 10 דקות');
    ok(errors.length === 0, 'אין שגיאות JavaScript' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await ctx.close();
  }

  console.log('3. סריקת שלט QR (?s=18): נפתח על המקלט, דיווח „נעול" בלחיצה');
  {
    const { ctx, page, errors } = await newPage(browser, {});
    await page.goto(URL + '?s=18');
    ok(await visible(page, '#scanned'), 'כרטיס „סרקתם את השלט של" מוצג');
    ok(/הרצל 39/.test(await text(page, '#scanned')), 'הכרטיס מציג את הרצל 39');
    ok(await page.$eval('#s-18', e => e.classList.contains('is-hl')).catch(() => false), 'המקלט מודגש ברשימה');
    await page.click('#sc-locked');
    ok(await page.$eval('#f-shelter', e => e.value) === '18', 'בטופס 106 נבחר המקלט הנכון');
    ok(await page.$eval('#f-topic', e => e.value) === 'מקלט / מיגונית נעולים', 'הנושא „נעולים" נבחר');
    ok(/נעול/.test(await page.$eval('#f-msg', e => e.value)), 'הפירוט מולא מראש');
    await page.goto(URL + '#s-1'); await page.reload();
    ok(/ביאליק 4/.test(await text(page, '#scanned')) && /חייגו/.test(await text(page, '#scanned')), 'גם #s-1 עובד, עם הודעה על פתיחה מרחוק');
    ok(errors.length === 0, 'אין שגיאות JavaScript' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await ctx.close();
  }

  console.log('4. מצב סקר שטח (?survey=1): עובד עומד ליד המקלט ושומר מיקום');
  {
    const { ctx, page, errors } = await newPage(browser, { geolocation: { ...BEN_ZVI, accuracy: 6 }, permissions: ['geolocation'] });
    await page.goto(URL + '?survey=1');
    ok(await visible(page, '#survey'), 'לוח הסקר מוצג');
    ok(/0 מתוך 61 אומתו/.test(await text(page, '#sv-progress')), 'התקדמות: ' + await text(page, '#sv-progress'));
    await page.waitForSelector('#live:not(.is-wait)', { timeout: 8000 }).catch(() => {});
    await page.waitForFunction(() => /בן צבי/.test(document.querySelector('#sv-info').textContent), null, { timeout: 4000 }).catch(() => {});
    ok(/בן צבי/.test(await text(page, '#sv-info')), 'עם קבלת GPS נבחר אוטומטית המקום הקרוב שלא אומת: ' + (await text(page, '#sv-info')).split('\n')[0]);
    await page.selectOption('#sv-pick', '4');            // בן צבי 7, כרגע אמצע הרחוב
    await page.click('#sv-here');
    await page.waitForFunction(() => /נשמר/.test(document.querySelector('#sv-status').textContent), null, { timeout: 4000 }).catch(() => {});
    ok(/נשמר: בן צבי 7/.test(await text(page, '#sv-status')), 'המיקום נשמר: ' + await text(page, '#sv-status'));
    ok(/1 מתוך 61 אומתו/.test(await text(page, '#sv-progress')), 'ההתקדמות עלתה ל-1');
    const out = JSON.parse(await page.$eval('#sv-out', e => e.value));
    ok(out['4'] && Math.abs(out['4'][0] - BEN_ZVI.latitude) < 1e-4, 'בפלט לשליחה: מיקום ה-GPS של בן צבי 7');
    await page.reload();
    ok(/1 מתוך 61 אומתו/.test(await text(page, '#sv-progress')), 'התיקון נשמר בטלפון גם אחרי רענון');
    await page.click('#survey summary');
    await page.fill('#sv-in', 'תיקונים: {"5":[32.7525,34.9719,6,"2026-11-06","gps"]}');
    await page.click('#sv-import');
    ok(/2 מתוך 61 אומתו/.test(await text(page, '#sv-progress')), 'ייבוא תיקונים מטלפון אחר עובד');
    await page.click('#sv-clear'); await page.click('#sv-clear');
    ok(/0 מתוך 61 אומתו/.test(await text(page, '#sv-progress')), 'מחיקה דו-שלבית מנקה את התיקונים');
    ok(errors.length === 0, 'אין שגיאות JavaScript' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await ctx.close();
  }

  console.log('5. דף השלטים');
  {
    const { ctx, page, errors } = await newPage(browser, {});
    await page.goto(URL + 'signs/');
    ok(await page.$$eval('.sign', l => l.length) === 61, '61 שלטים');
    ok(await page.$$eval('.sign svg.qr', l => l.length) === 61, 'לכל שלט קוד QR');
    ok(await page.evaluate(() => document.fonts.check('40px "Secular One"', 'מקלט')), 'הגופן נטען מקומית (בלי תלות ב-Google)');
    ok(errors.length === 0, 'אין שגיאות');
    await ctx.close();
  }

  await browser.close(); server.close();
  console.log(`\n${result.pass} עברו, ${result.fail} נכשלו`);
  process.exit(result.fail ? 1 : 0);
})();
