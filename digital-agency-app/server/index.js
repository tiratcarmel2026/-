import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './routes/api.js';
import { startScheduler } from './scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use('/api', apiRouter);
app.use(express.static(path.join(__dirname, '..', 'public')));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`[server] סוכנות הדיגיטל של טירת כרמל פועלת על פורט ${port}`);
  startScheduler();
});
