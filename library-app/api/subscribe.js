// Saves one loan with the browser's push subscription and sends a confirmation.
import { writeJson, push, newId, validId, validDate, israelToday, daysBetween, niceDate, body } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const b = await body(req);
  const sub = b.subscription;
  if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys) {
    return res.status(400).json({ error: 'bad subscription' });
  }
  if (!validDate(b.due)) return res.status(400).json({ error: 'bad date' });
  const left = daysBetween(israelToday(), b.due);
  if (left < 0 || left > 366) return res.status(400).json({ error: 'date out of range' });

  const id = validId(b.id) ? b.id : newId();
  const loan = {
    id, due: b.due,
    books: String(b.books || '').slice(0, 120),
    who: String(b.who || '').slice(0, 60),
    sub: { endpoint: sub.endpoint, keys: { p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth) } },
    sent3: left < 3, // already inside the 3-day window: skip the early reminder, the confirmation covers it
    created: new Date().toISOString()
  };
  await writeJson(`loans/${id}.json`, loan);

  try {
    await push(loan.sub, {
      title: '✅ התזכורת נשמרה',
      body: `נזכיר לך להחזיר את הספרים עד ${niceDate(b.due)}` + (left > 3 ? ', 3 ימים לפני ובבוקר של אותו יום.' : '.'),
      tag: 'confirm-' + id
    });
  } catch (e) {
    return res.status(200).json({ id, confirmed: false });
  }
  res.status(200).json({ id, confirmed: true });
}
