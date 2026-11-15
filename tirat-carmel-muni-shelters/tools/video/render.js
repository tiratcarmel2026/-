// Render the 60-second shelters video, frame by frame, then encode with ffmpeg.
//   node tools/video/render.js WORK_DIR OUT.mp4 [fps=30] [--preview]
//   --resume keeps the frames already rendered (after an interruption) and renders only the missing ones.
// WORK_DIR must contain tiles/{z}/{x}/{y}.png (OpenStreetMap, see tiles.py) — everything else is assembled here.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');

const HERE = __dirname, SITE = path.resolve(HERE, '../..');
const [WORK, OUT, FPS_ARG] = process.argv.slice(2);
const FPS = +(FPS_ARG && !FPS_ARG.startsWith('--') ? FPS_ARG : 30), PREVIEW = process.argv.includes('--preview');

// ---- route: every shelter and protected space, nearest neighbour from the municipal centre + 2-opt
const data = JSON.parse(/window\.SHELTERS = (\[[\s\S]*\]);/.exec(fs.readFileSync(path.join(SITE, 'data/shelters.js'), 'utf8'))[1]);
const cfg = fs.readFileSync(path.join(SITE, 'data/config.js'), 'utf8');
const siteUrl = /siteUrl:\s*'([^']+)'/.exec(cfg)[1];
const START = (data.find(s => s.address === 'העצמאות 4') || data[0]);
const m = (a, b) => Math.hypot((a.lat - b.lat) * 110540, (a.lng - b.lng) * 93800);
let left = data.slice(), cur = START, route = [];
while (left.length) { left.sort((a, b) => m(cur, a) - m(cur, b)); cur = left.shift(); route.push(cur); }
for (let it = 0, imp = true; imp && it < 80; it++) {
  imp = false;
  for (let i = 1; i < route.length - 2; i++) for (let j = i + 1; j < route.length - 1; j++) {
    const a = route[i - 1], b = route[i], c = route[j], d = route[j + 1];
    if (m(a, c) + m(b, d) < m(a, b) + m(c, d) - 1) { route = route.slice(0, i).concat(route.slice(i, j + 1).reverse(), route.slice(j + 1)); imp = true; }
  }
}
const stops = route.map(s => ({ id: s.id, type: s.type, address: s.address, note: s.note, lat: s.lat, lng: s.lng }));
fs.writeFileSync(path.join(WORK, 'stops.js'), 'window.VIDEO = ' + JSON.stringify({ stops, start: [START.lat, START.lng], siteUrl }) + ';');
for (const [src, dst] of [[path.join(HERE, 'video.html'), 'index.html'], [path.join(SITE, 'vendor/leaflet.js'), 'leaflet.js'],
  [path.join(SITE, 'vendor/leaflet.css'), 'leaflet.css'], [path.join(SITE, 'assets/logo.png'), 'logo.png']]) fs.copyFileSync(src, path.join(WORK, dst));
fs.mkdirSync(path.join(WORK, 'fonts'), { recursive: true });
for (const f of fs.readdirSync(path.join(SITE, 'signs/fonts'))) fs.copyFileSync(path.join(SITE, 'signs/fonts', f), path.join(WORK, 'fonts', f));

const BLANK = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN89+r1fwAJBwOdQ6SSCwAAAABJRU5ErkJggg==', 'base64');
const RESUME = process.argv.includes('--resume');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(WORK, p);
  if (!f.startsWith(WORK) || !fs.existsSync(f)) {
    // a map tile outside the downloaded area: answer at once with an empty tile instead of making the frame wait
    if (/^\/tiles\//.test(p)) { r.writeHead(200, { 'Content-Type': 'image/png' }); return r.end(BLANK); }
    r.writeHead(404); return r.end();
  }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'max-age=3600' }); fs.createReadStream(f).pipe(r);
});

(async () => {
  await new Promise(r => srv.listen(0, r));
  const frames = path.join(WORK, 'frames');
  if (!RESUME) fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
  await p.goto(`http://localhost:${srv.address().port}/`); await p.evaluate(() => window.ready);
  const dur = await p.evaluate(() => window.DURATION);
  const times = PREVIEW ? [1.5, 5.5, 9, 20, 35, 52, 55, 58.5] : Array.from({ length: Math.round(dur * FPS) }, (_, i) => i / FPS);
  const t0 = Date.now();
  for (let i = 0; i < times.length; i++) {
    const file = path.join(frames, `f${String(i).padStart(5, '0')}.jpg`);
    if (RESUME && fs.existsSync(file) && fs.statSync(file).size > 0) continue;
    await p.evaluate(t => window.frame(t), times[i]);
    await p.screenshot({ path: file, type: 'jpeg', quality: 92 });
    if (i % 150 === 0) console.log(`frame ${i}/${times.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await b.close(); srv.close();
  if (PREVIEW) { console.log('preview frames in', frames); return; }
  // the soundtrack (tools/video/music.py), synced to the same timeline
  execFileSync('python3', ['-I', path.join(HERE, 'music.py'), WORK], { stdio: 'inherit' });
  const enc = (out, scale, crf) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, 'f%05d.jpg'),
    '-i', path.join(WORK, 'music.wav'), ...(scale ? ['-vf', `scale=${scale}:flags=lanczos`] : []),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out]);
  enc(OUT, null, 20);
  const light = OUT.replace(/\.mp4$/, ' - לוואטסאפ.mp4');
  enc(light, '720:1280', 26);
  console.log('light version ->', light);
  console.log('video ->', OUT);
})();
