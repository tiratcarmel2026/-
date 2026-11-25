import { vapid } from './_lib.js';

export default async function handler(req, res) {
  const { publicKey } = await vapid();
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).json({ publicKey });
}
