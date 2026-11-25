// Shared helpers: private Blob storage and Web Push keys.
// The VAPID key pair is created on first use and kept in the private store,
// so no secret ever has to be pasted anywhere.
import { put, get, del, list } from '@vercel/blob';
import webpush from 'web-push';
import { randomBytes } from 'node:crypto';

const OPTS = { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' };
const KEYS = 'config/vapid.json';

export async function readJson(pathname) {
  const r = await get(pathname, { access: 'private', useCache: false });
  if (!r || !r.stream) return null;
  return JSON.parse(await new Response(r.stream).text());
}

export async function writeJson(pathname, data) {
  await put(pathname, JSON.stringify(data), OPTS);
}

export async function remove(pathname) {
  try { await del(pathname); } catch (e) { /* already gone */ }
}

export async function listLoans() {
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix: 'loans/', cursor, limit: 1000 });
    out.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

let cached;
export async function vapid() {
  if (cached) return cached;
  let keys = await readJson(KEYS);
  if (!keys) {
    keys = webpush.generateVAPIDKeys();
    await put(KEYS, JSON.stringify(keys), { ...OPTS, allowOverwrite: false }).catch(async () => {
      keys = await readJson(KEYS); // another request created it first
    });
  }
  webpush.setVapidDetails('https://tirat-carmel-library.vercel.app', keys.publicKey, keys.privateKey);
  cached = keys;
  return keys;
}

export async function push(sub, payload) {
  await vapid();
  return webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 60 * 60 * 20, urgency: 'high' });
}

export const newId = () => randomBytes(16).toString('hex');
export const validId = (id) => typeof id === 'string' && /^[a-f0-9]{32}$/.test(id);
export const validDate = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

// Today's date in Israel, as YYYY-MM-DD.
export function israelToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date());
}
export function daysBetween(from, to) {
  return Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000);
}
export function niceDate(iso) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('he-IL', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });
}

export async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const c of req) raw += c;
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}
