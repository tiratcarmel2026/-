/* PODTC service worker — app shell offline; map tiles & Wikipedia cached as you go. */
const V = 'podtc-v37';
const SHELL = ['./', 'index.html', 'css/site.css', 'js/content.js', 'manifest.webmanifest', 'accessibility.html', 'assets/wordmark-navy.png', 'assets/wordmark-white.png', 'assets/muni-logo.png', 'assets/icon-192.png', 'assets/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('basemaps.cartocdn.com') || url.hostname === 'server.arcgisonline.com' || url.hostname === 'tile.openstreetmap.org') { // cache-first for tiles
    e.respondWith(caches.open(V + '-tiles').then(async c => (await c.match(req)) || fetch(req).then(r => { c.put(req, r.clone()); return r; })));
    return;
  }
  // live data, radio streams and embeds go straight to the network (never through the cache)
  if (url.origin !== location.origin) return;
  // network-first for everything else, falling back to cache
  e.respondWith(fetch(req).then(r => { if (r.ok && (url.origin === location.origin || url.hostname === 'cdnjs.cloudflare.com')) { const copy = r.clone(); caches.open(V).then(c => c.put(req, copy)); } return r; })
    .catch(() => caches.match(req)));
});

/* a tap on an announcement opens the site (or the link it carries) */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { const c = cs.find(x => 'focus' in x); return c ? c.focus() : self.clients.openWindow(url); }));
});
