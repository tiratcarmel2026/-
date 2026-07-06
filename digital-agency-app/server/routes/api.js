import { Router } from 'express';
import { readBatches, getBatch } from '../db.js';
import { runGenerationCycle, getSchedulerStatus } from '../scheduler.js';

export const apiRouter = Router();

apiRouter.get('/batches', async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const batches = await readBatches();
  res.json(batches.slice(0, limit));
});

apiRouter.get('/batches/:id', async (req, res) => {
  const batch = await getBatch(req.params.id);
  if (!batch) return res.status(404).json({ error: 'לא נמצא' });
  res.json(batch);
});

apiRouter.post('/generate', async (req, res) => {
  try {
    const batch = await runGenerationCycle();
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/status', async (req, res) => {
  const scheduler = getSchedulerStatus();
  res.json({
    anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    facebookConfigured: Boolean(process.env.FB_PAGE_ID && process.env.FB_PAGE_ACCESS_TOKEN),
    socialMode: process.env.FB_PAGE_ID && process.env.FB_PAGE_ACCESS_TOKEN ? 'facebook' : 'mock',
    scheduler,
    serverTime: new Date().toISOString(),
    timezone: process.env.TZ || 'Asia/Jerusalem',
  });
});
