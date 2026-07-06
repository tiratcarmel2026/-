import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const BATCHES_FILE = path.join(DATA_DIR, 'batches.json');

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(BATCHES_FILE);
  } catch {
    await fs.writeFile(BATCHES_FILE, '[]', 'utf8');
  }
}

export async function readBatches() {
  await ensureDataFile();
  const raw = await fs.readFile(BATCHES_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function appendBatch(batch, { maxKept = 500 } = {}) {
  const batches = await readBatches();
  batches.unshift(batch);
  const trimmed = batches.slice(0, maxKept);
  await fs.writeFile(BATCHES_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
  return batch;
}

export async function getBatch(id) {
  const batches = await readBatches();
  return batches.find((b) => b.id === id) ?? null;
}
