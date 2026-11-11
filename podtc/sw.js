/* PODTC service worker — app shell offline; map tiles & Wikipedia cached as you go. */
const V = 'podtc-v18';
const SHELL = ['./', 'index.html', 'css/app.css', 'css/theme.css', 'css/theme-blue.css', 'css/podcast.css', 'css/news.css', 'css/vivid.css', 'css/a11y.css', 'js/a11y.js', 'js/city.js', 'accessibility.html', 'assets/wordmark-navy.png', 'js/covers.js', 'js/extras.js', 'js/icons.js', 'assets/wordmark-white.png', 'js/geo.js', 'js/config.js', 'js/places.js', 'js/quiz.js', 'js/narrator.js', 'js/wiki.js', 'js/app.js', 'js/home.js', 'js/live.js', 'vendor/qrcode/qrcode.js', 'manifest.webmanifest', 'assets/wordmark.png', 'assets/logo-full.png', 'assets/icon-192.png', 'assets/icon-512.png',
  'vendor/leaflet/leaflet.css', 'vendor/leaflet/leaflet.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('basemaps.cartocdn.com') || url.hostname === 'server.arcgisonline.com') { // cache-first for tiles
    e.respondWith(caches.open(V + '-tiles').then(async c => (await c.match(req)) || fetch(req).then(r => { c.put(req, r.clone()); return r; })));
    return;
  }
  // live data, radio streams and embeds go straight to the network (never through the cache)
  if (url.origin !== location.origin) return;
  // network-first for everything else, falling back to cache
  e.respondWith(fetch(req).then(r => { if (r.ok && (url.origin === location.origin || url.hostname === 'cdnjs.cloudflare.com')) { const copy = r.clone(); caches.open(V).then(c => c.put(req, copy)); } return r; })
    .catch(() => caches.match(req)));
});
