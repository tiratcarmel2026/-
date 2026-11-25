// Removes one loan (the user returned the books or deleted the reminder).
import { remove, validId, body } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { id } = await body(req);
  if (!validId(id)) return res.status(400).json({ error: 'bad id' });
  await remove(`loans/${id}.json`);
  res.status(200).json({ ok: true });
}
