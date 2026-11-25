// Runs every morning (Vercel Cron). Safe to run more than once a day:
// each reminder is marked as sent, so nobody gets the same message twice.
import { readJson, writeJson, remove, listLoans, push, israelToday, daysBetween, niceDate } from './_lib.js';

export default async function handler(req, res) {
  const today = israelToday();
  const paths = await listLoans();
  const stats = { checked: paths.length, sent: 0, removed: 0, failed: 0 };

  for (const p of paths) {
    const loan = await readJson(p).catch(() => null);
    if (!loan) continue;
    const left = daysBetween(today, loan.due);
    const name = loan.books ? `: ${loan.books}` : '';
    let msg = null;

    if (left <= 0) {
      msg = { title: '📚 היום מחזירים ספרים לספרייה', body: (left === 0 ? 'זה היום האחרון להחזרה' : 'תאריך ההחזרה עבר') + name + '. אפשר גם להתקשר לספרייה ולבקש הארכה.' };
    } else if (left <= 3 && !loan.sent3) {
      msg = { title: `📚 עוד ${left === 1 ? 'יום אחד' : left + ' ימים'} להחזרת ספרים`, body: `עד ${niceDate(loan.due)}${name}. לא מספיקים? אפשר לבקש הארכה בספרייה.` };
    }
    if (!msg) continue;

    try {
      await push(loan.sub, { ...msg, tag: 'loan-' + loan.id });
      stats.sent++;
      if (left <= 0) { await remove(p); stats.removed++; }
      else { loan.sent3 = true; await writeJson(p, loan); }
    } catch (e) {
      stats.failed++;
      // 404/410: the browser unsubscribed or the app was removed. Stop trying.
      if (e && (e.statusCode === 404 || e.statusCode === 410)) { await remove(p); stats.removed++; }
      else console.error('push failed', loan.id, e && e.statusCode, e && e.body);
    }
  }
  console.log('cron', today, JSON.stringify(stats));
  res.status(200).json({ today, ...stats });
}
