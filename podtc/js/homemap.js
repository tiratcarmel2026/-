/* podtc — a live map of the city on the front page.
 * Every episode is a coloured point (by topic); tap one to hear it. Your position appears as a blue dot
 * and the nearest stories are listed under the map. On phones the map waits for a tap before it can be
 * dragged, so scrolling the page never gets stuck inside it. */
(function () {
  const A = window.PodApp, L = window.L, $ = s => document.querySelector(s); if (!A || !L) return;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inner = $('.home__inner'), CENTER = window.PODTC_CENTER || { lat: 32.761, lng: 34.9705 }, PAGES = window.PODTC_SHARE_PAGES || [];
  const cats = Object.keys(A.CATS).filter(k => k !== 'live' && k !== 'news' && A.PLACES.some(p => p.category === k));
  const touch = matchMedia('(hover: none)').matches;
  // distinct colours on the map, so topics are easy to tell apart
  const PAL = ['#06B6E8', '#F5B301', '#FF6B5E', '#0E9F6E', '#7B61FF', '#0B1F47', '#E11D48', '#0891B2', '#C2410C', '#65A30D', '#9333EA', '#475569'];
  const col = k => PAL[Math.max(0, cats.indexOf(k)) % PAL.length];

  const html = `<section class="hmap" id="homemap" aria-label="מפת העיר">
      <div class="shelf__h"><h2>מפת העיר <small>${A.PLACES.length} מקומות עם סיפור</small></h2><button class="rall" id="hmap-full">למפה המלאה ←</button></div>
      <div class="hmap__chips" role="group" aria-label="סינון לפי נושא"><button class="hchip on" data-hc="">הכול</button>${cats.map(k => `<button class="hchip" data-hc="${k}" style="--c:${col(k)}"><i></i>${esc(A.CATS[k].label)}</button>`).join('')}</div>
      <div class="hmap__box"><div class="hmap__map" id="hmap" role="application" aria-label="מפה אינטראקטיבית של טירת כרמל"></div>
        <button class="hmap__me" id="hmap-me" aria-label="הצגת המיקום שלי"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></button>
        ${touch ? '<button class="hmap__lock" id="hmap-lock">הקישו כדי להזיז את המפה</button>' : ''}</div>
      <div class="hmap__near" id="hmap-near"></div>
    </section>`;
  const anchor = $('.qa') || $('.rhero'); if (anchor) anchor.insertAdjacentHTML('afterend', html); else inner.insertAdjacentHTML('afterbegin', html);

  let map = null, layer = null, me = null, meAcc = null, filter = '', markers = [];
  function popup(p) {
    const c = A.CATS[p.category] || {};
    return `<div class="hpop" style="--c:${col(p.category)}"><span class="hpop__k">${esc(c.label || '')}</span><b>${esc(p.title)}</b><small>${esc(p.subtitle || '')}</small>
      <div class="hpop__a"><button data-hplay="${esc(p.id)}">▶ האזנה</button>${PAGES.includes(p.id) ? `<a href="e/${esc(p.id)}.html" target="_blank" rel="noopener">עמוד הפרק</a>` : ''}</div></div>`;
  }
  function draw() {
    if (!map) return; if (layer) layer.remove(); markers = [];
    layer = L.layerGroup(A.PLACES.filter(p => !filter || p.category === filter).map(p => {
      const c = col(p.category), played = A.played && A.played.has && A.played.has(p.id);
      const m = L.circleMarker([p.lat, p.lng], { radius: 10, color: '#fff', weight: 3, fillColor: c, fillOpacity: played ? .55 : 1 }).bindPopup(popup(p), { closeButton: true, maxWidth: 260, className: 'hpop-wrap' });
      m.bindTooltip(p.title, { direction: 'top', offset: [0, -8] }); markers.push([p, m]); return m;
    })).addTo(map);
  }
  function near() {
    const box = $('#hmap-near'), pos = A.pos; if (!box) return;
    if (!pos) { box.innerHTML = `<span class="hmap__hint">אשרו מיקום, והמפה תראה איפה אתם ומה הכי קרוב אליכם.</span>`; return; }
    const list = A.PLACES.map(p => [p, A.distance(pos.lat, pos.lng, p.lat, p.lng)]).sort((a, b) => a[1] - b[1]).slice(0, 3);
    box.innerHTML = `<b>הכי קרוב אליכם:</b>${list.map(([p, d]) => `<button class="hnear" data-hplay="${esc(p.id)}" style="--c:${col(p.category)}"><i></i>${esc(p.title)} <small>${A.fmt(d)}</small></button>`).join('')}`;
  }
  function locate(fly) {
    const pos = A.pos; if (!map || !pos) return false;
    const ll = [pos.lat, pos.lng];
    if (!me) { meAcc = L.circle(ll, { radius: pos.acc || 30, color: '#2563EB', weight: 1, fillColor: '#2563EB', fillOpacity: .12, interactive: false }).addTo(map);
      me = L.circleMarker(ll, { radius: 8, color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }).bindTooltip('אתם כאן').addTo(map); }
    else { me.setLatLng(ll); meAcc.setLatLng(ll).setRadius(pos.acc || 30); }
    if (fly) map.flyTo(ll, 16, { duration: .8 }); return true;
  }
  function init() {
    if (map) return;
    map = L.map('hmap', { zoomControl: true, attributionControl: true, scrollWheelZoom: false, dragging: !touch, tap: false, maxZoom: 19, minZoom: 12 }).setView([CENTER.lat, CENTER.lng], 14);
    map.zoomControl.setPosition('topleft');
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    draw(); locate(false); near();
    const bounds = L.latLngBounds(A.PLACES.map(p => [p.lat, p.lng])); map.fitBounds(bounds.pad(.08));
    setInterval(() => { locate(false); near(); }, 5000);
    if (window.ResizeObserver) new ResizeObserver(() => map.invalidateSize()).observe($('#hmap'));
  }
  // build the map only when it is about to be seen
  const el = $('#homemap');
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { init(); io.disconnect(); } }, { rootMargin: '400px' }); io.observe(el); } else init();
  window.addEventListener('pod:page', () => setTimeout(() => map && map.invalidateSize(), 80));

  document.addEventListener('click', e => {
    const c = e.target.closest('[data-hc]'); if (c) { filter = c.dataset.hc; document.querySelectorAll('.hchip').forEach(x => x.classList.toggle('on', x === c)); draw();
      if (map && filter) { const pts = A.PLACES.filter(p => p.category === filter); if (pts.length) map.fitBounds(L.latLngBounds(pts.map(p => [p.lat, p.lng])).pad(.25), { maxZoom: 16 }); } return; }
    const pl = e.target.closest('[data-hplay]'); if (pl) { const ep = A.PLACES.find(p => p.id === pl.dataset.hplay); if (ep) { A.select(ep); A.play(); if (map) map.closePopup(); } return; }
    if (e.target.closest('#hmap-me')) { init(); if (!locate(true)) A.toast('המיקום עוד לא זמין. אשרו מיקום בדפדפן'); return; }
    if (e.target.closest('#hmap-full')) { const t = document.querySelector('.tab[data-view="map"]'); if (t) t.click(); return; }
    if (e.target.closest('#hmap-lock')) { init(); map.dragging.enable(); const b = $('#hmap-lock'); if (b) b.remove(); }
  });
})();
