// Offline support: the list, map data and app keep working without internet (map tiles excepted).
const CACHE = 'tc-shelters-v1';
const SHELL = ['./', 'index.html', 'css/app.css', 'js/app.js', 'data/shelters.js', 'data/streets.js',
  'vendor/leaflet.js', 'vendor/leaflet.css', 'assets/logo.png', 'manifest.webmanifest'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // network first so updates to the list arrive immediately; cache when offline
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
