import cron from 'node-cron';
import { generateHourlyBatch } from './services/contentGenerator.js';
import { appendBatch } from './db.js';

let lastRunAt = null;
let lastError = null;
let running = false;

export function getSchedulerStatus() {
  return { lastRunAt, lastError, running };
}

export async function runGenerationCycle() {
  if (running) {
    throw new Error('יצירת תוכן כבר רצה כרגע, נסו שוב בעוד רגע');
  }
  running = true;
  try {
    const batch = await generateHourlyBatch();
    await appendBatch(batch);
    lastRunAt = new Date().toISOString();
    lastError = null;
    console.log(`[scheduler] נוצר batch חדש: ${batch.id}`);
    return batch;
  } catch (err) {
    lastError = err.message;
    console.error('[scheduler] שגיאה ביצירת תוכן:', err.message);
    throw err;
  } finally {
    running = false;
  }
}

export function startScheduler() {
  // כל שעה עגולה (בדקה 0), לפי אזור הזמן שהוגדר ב-TZ
  cron.schedule(
    '0 * * * *',
    () => {
      runGenerationCycle().catch(() => {});
    },
    { timezone: process.env.TZ || 'Asia/Jerusalem' }
  );

  console.log('[scheduler] תזמון שעתי הופעל (כל שעה עגולה)');

  if (process.env.RUN_ON_STARTUP === 'true') {
    runGenerationCycle().catch(() => {});
  }
}
