/* podtc — main app: map, location tracking, geofences, player UI. */
(function () {
  const PLACES = window.PODTC_PLACES, CENTER = window.PODTC_CENTER, CATS = window.PODTC_CATEGORIES;
  const { distance, fmt, bearing, dirName } = window.PodGeo;
  const TOURS = window.PODTC_TOURS || [window.PODTC_TOUR];
  const QUIZ = window.PODTC_QUIZ || {};
  const $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('podtc.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('podtc.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const WPM = 120; // Hebrew TTS ≈ 110–130 words/min

  /* editor overrides (fixed coordinates / radius) are applied before anything is drawn */
  let editing = /[?&]edit\b/.test(location.search) || store.get('editing', false);
  let edits = store.get('edits', {});
  PLACES.forEach(p => {
    const e = edits[p.id]; if (!e) return;
    if (typeof e.lat === 'number') { p.lat = e.lat; p.lng = e.lng; p.approx = false; }
    if (e.radius) p.radius = e.radius;
  });

  let played = new Set(store.get('played', []));
  let autoplay = store.get('autoplay', true), chime = store.get('chime', true);
  let filter = 'all';
  let pos = null, demo = false;
  let current = null, insideId = null, liveItems = [], lastWikiPos = null;
  let map, userMarker, accCircle, markers = {}, liveLayer, baseLayer, tourLine;
  let heading = null;                 // device compass heading (deg), null if unknown
  let tourId = store.get('tourId', store.get('tourOn', false) ? TOURS[0].id : null);
  let tourOn = !!tourId;
  let quizRes = store.get('quiz', {});   // episode id -> first answer correct?
  let query = '';
  let favs = new Set(store.get('favs', []));
  let queue = [], queueName = '';            // back-to-back playback ("listen from home")
  const byId = id => PLACES.find(p => p.id === id);
  let mapStyle = store.get('mapStyle', 'sat');
  let chunkEls = [];
  let follow = true; // map follows the user until they drag it

  const catOf = ep => CATS[ep.live ? 'live' : ep.category] || CATS.history;
  const minutes = ep => {
    const words = ((ep.intro || '') + ' ' + ep.script).split(/\s+/).length;
    const m = words / WPM / Narrator.rate;
    return m < 1 ? 'פחות מדקה' : (Math.round(m * 2) / 2).toString().replace('.5', '½') + ' דק׳';
  };
  const allEpisodes = () => PLACES.concat(liveItems);

  /* ================= map ================= */
  function initMap() {
    map = L.map('map', { zoomControl: false, attributionControl: true, maxZoom: 20, zoomSnap: .5 }).setView([CENTER.lat, CENTER.lng], 15);
    setStyle(mapStyle, true);
    PLACES.forEach(p => {
      const c = catOf(p).color;
      const circle = L.circle([p.lat, p.lng], { radius: p.radius, color: c, weight: 1, opacity: .5, fillColor: c, fillOpacity: .06, dashArray: '4 6', interactive: false }).addTo(map);
      const icon = L.divIcon({ className: '', html: `<div class="pin" style="--c:${c};width:42px;height:42px">${p.emoji}</div>`, iconSize: [42, 42], iconAnchor: [21, 21] });
      const m = L.marker([p.lat, p.lng], { icon, title: p.title }).addTo(map).on('click', () => { select(p); openNow(); })
        .on('dragend', e => saveEdit(p, e.target.getLatLng()));
      markers[p.id] = { m, circle };
    });
    liveLayer = L.layerGroup().addTo(map);
    map.on('click', e => { if (demo) setPosition(e.latlng.lat, e.latlng.lng, 8); });
    map.on('dragstart', () => { follow = false; $('#btn-locate').classList.remove('active'); });
  }

  /* ---------- map styles: satellite (real imagery), street (detailed), night (brand) ---------- */
  const OSM = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const CARTO = '© <a href="https://carto.com/attributions">CARTO</a>';
  const STYLES = {
    sat: { icon: '🛰️', label: 'לוויין', make: () => L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 20, maxNativeZoom: 19, attribution: 'צילום אוויר © Esri, Maxar, Earthstar Geographics' }),
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}{r}.png', {
        maxZoom: 20, maxNativeZoom: 19, subdomains: 'abcd', attribution: OSM + ' · ' + CARTO })
    ]) },
    street: { icon: '🗺️', label: 'רחובות', make: () => L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20, maxNativeZoom: 19, subdomains: 'abcd', attribution: OSM + ' · ' + CARTO }) },
    night: { icon: '🌙', label: 'לילה', make: () => L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20, maxNativeZoom: 19, subdomains: 'abcd', attribution: OSM + ' · ' + CARTO }) }
  };
  function setStyle(name, silent) {
    if (!STYLES[name]) name = 'sat';
    if (baseLayer) map.removeLayer(baseLayer);
    baseLayer = STYLES[name].make().addTo(map);
    mapStyle = name; store.set('mapStyle', name);
    document.body.classList.remove('style-sat', 'style-street', 'style-night');
    document.body.classList.add('style-' + name);
    const order = Object.keys(STYLES), next = STYLES[order[(order.indexOf(name) + 1) % order.length]];
    $('#style-icon').textContent = next.icon; $('#style-label').textContent = next.label; // the button shows what you switch TO
    if (!silent) toast(`תצוגת מפה: ${STYLES[name].label}`);
  }

  function refreshPins() {
    const stopIds = tourOn ? tourStops().map(s => s.id) : [];
    PLACES.forEach(p => {
      const el = markers[p.id].m.getElement(); if (!el) return;
      const pin = el.firstElementChild;
      pin.classList.toggle('pin--played', played.has(p.id));
      const n = stopIds.indexOf(p.id);
      let num = pin.querySelector('.num');
      if (n >= 0 && !num) { num = document.createElement('b'); num.className = 'num'; pin.appendChild(num); }
      if (num) { if (n >= 0) num.textContent = n + 1; else num.remove(); }
      pin.classList.toggle('pin--here', p.id === insideId);
      const dim = !matchFilter(p);
      pin.classList.toggle('pin--dim', dim);
      markers[p.id].circle.setStyle({ opacity: dim ? 0 : .5, fillOpacity: dim ? 0 : .06 });
    });
    liveLayer.clearLayers();
    if (filter === 'all' || filter === 'live') liveItems.forEach(w => {
      const icon = L.divIcon({ className: '', html: `<div class="pin pin--live" style="width:30px;height:30px">📖</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
      L.marker([w.lat, w.lng], { icon, title: w.title }).on('click', () => { select(w); openNow(); }).addTo(liveLayer);
    });
  }

  function matchFilter(p) {
    return filter === 'all' || (filter === 'fav' ? favs.has(p.id) : filter === 'live' ? !!p.live : p.category === filter);
  }
  function renderFilters() {
    const used = ['all', ...(favs.size ? ['fav'] : []), ...Object.keys(CATS).filter(k => k === 'live' ? liveItems.length : PLACES.some(p => p.category === k))];
    $('#filters').innerHTML = used.map(k => k === 'all'
      ? `<button class="fchip" data-f="all" aria-pressed="${filter === 'all'}">הכול</button>`
      : k === 'fav' ? `<button class="fchip" data-f="fav" style="--c:#f472b6" aria-pressed="${filter === 'fav'}">♥ מועדפים</button>`
      : `<button class="fchip" data-f="${k}" style="--c:${CATS[k].color}" aria-pressed="${filter === k}"><i></i>${CATS[k].label}</button>`).join('');
  }
  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('.fchip'); if (!b) return;
    filter = b.dataset.f; renderFilters(); refreshPins(); renderList();
    const vis = PLACES.filter(matchFilter);
    if (vis.length) map.flyToBounds(L.latLngBounds(vis.map(p => [p.lat, p.lng])).pad(.35), { duration: .8, maxZoom: 16 });
  });

  /* ================= location ================= */
  function startTracking() {
    if (!('geolocation' in navigator)) { toast('המכשיר לא תומך בשירותי מיקום. עוברים למצב הדגמה'); toggleDemo(true); return; }
    navigator.geolocation.watchPosition(
      g => { if (demo) return; if (g.coords.heading != null && !isNaN(g.coords.heading) && g.coords.speed > .5) gpsHeading = g.coords.heading; setPosition(g.coords.latitude, g.coords.longitude, g.coords.accuracy); },
      err => {
        if (pos && err.code !== 1) return;
        toast(err.code === 1 ? 'לא ניתנה הרשאת מיקום. אפשר לאשר בהגדרות, או לנסות במצב הדגמה.' : 'לא הצלחנו לאתר מיקום');
        $('#btn-demo').classList.add('pulse');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  }

  function toggleDemo(force) {
    demo = typeof force === 'boolean' ? force : !demo;
    $('#btn-demo').classList.toggle('active', demo);
    $('#btn-demo').classList.remove('pulse');
    toast(demo ? 'מצב הדגמה: לחצו על המפה כדי "ללכת" לשם' : 'חזרה למיקום האמיתי');
    if (demo && !pos) setPosition(CENTER.lat, CENTER.lng, 8);
  }

  let firstFix = true;
  function setPosition(lat, lng, acc) {
    pos = { lat, lng, acc };
    if (!userMarker) {
      userMarker = L.marker([lat, lng], { icon: L.divIcon({ className: '', html: '<div class="me-wrap"><div class="cone" id="cone"></div><div class="me"></div></div>', iconSize: [20, 20], iconAnchor: [10, 10] }), interactive: false, zIndexOffset: 2000 }).addTo(map);
      accCircle = L.circle([lat, lng], { radius: acc, color: '#38bdf8', weight: 0, fillOpacity: .1, interactive: false }).addTo(map);
    } else { userMarker.setLatLng([lat, lng]); accCircle.setLatLng([lat, lng]).setRadius(acc); }
    if (firstFix) { firstFix = false; map.flyTo([lat, lng], 16, { duration: 1.2 }); }
    else if (follow && !demo) map.panTo([lat, lng], { animate: true, duration: .6 });

    const dc = distance(lat, lng, CENTER.lat, CENTER.lng), inTown = dc < CENTER.radius;
    $('#status').classList.toggle('ok', inTown);
    $('#status-text').textContent = demo ? 'מצב הדגמה · לחצו על המפה' : inTown ? 'אתם בטירת כרמל' : `מחוץ לטירת כרמל · ${fmt(dc)} מהמרכז`;

    const here = PLACES.map(p => ({ p, d: distance(lat, lng, p.lat, p.lng) }))
      .filter(x => x.d <= x.p.radius).sort((a, b) => a.d / a.p.radius - b.d / b.p.radius)[0];
    const newInside = here ? here.p.id : null;
    if (newInside !== insideId) { insideId = newInside; if (here) onEnter(here.p); refreshPins(); }
    if (!current || (!editing && !insideId && !isActive())) showNearest();
    if (!heading && gpsHeading != null) setHeading(gpsHeading);
    updateMeta(); renderList(); updateTour(); maybeFetchWiki();
  }

  /* ---------- compass ---------- */
  let gpsHeading = null, headRaf = 0;
  function setHeading(h) {
    heading = h;
    if (headRaf) return;
    headRaf = requestAnimationFrame(() => {
      headRaf = 0;
      const c = document.getElementById('cone');
      if (c) { c.style.transform = `rotate(${heading}deg)`; c.classList.add('on'); }
      updateTourArrow();
    });
  }
  function onOrient(e) {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;          // iOS
    else if (e.absolute && typeof e.alpha === 'number') h = (360 - e.alpha) % 360;       // Android (absolute)
    if (h != null) setHeading(h);
  }
  function startCompass() {
    try {
      const DOE = window.DeviceOrientationEvent;
      if (!DOE) return;
      const listen = () => {
        if ('ondeviceorientationabsolute' in window) addEventListener('deviceorientationabsolute', onOrient);
        addEventListener('deviceorientation', onOrient); // iOS gives webkitCompassHeading here
      };
      listen();
      if (typeof DOE.requestPermission === 'function') DOE.requestPermission().then(r => { if (r === 'granted') listen(); }).catch(() => {});
    } catch (e) {}
  }

  /* ---------- guided tours ---------- */
  const activeTour = () => TOURS.find(t => t.id === tourId) || null;
  /* order stops into a walkable path: start at the first stop, then always the nearest unvisited */
  function orderStops(t) {
    const ps = t.order.map(id => PLACES.find(p => p.id === id)).filter(Boolean);
    if (!ps.length) return ps;
    const out = [ps.shift()];
    while (ps.length) {
      const l = out[out.length - 1]; let bi = 0, bd = Infinity;
      ps.forEach((p, i) => { const d = distance(l.lat, l.lng, p.lat, p.lng); if (d < bd) { bd = d; bi = i; } });
      out.push(ps.splice(bi, 1)[0]);
    }
    return out;
  }
  const tourStops = (t = activeTour()) => t ? orderStops(t) : [];
  const tourNext = () => tourStops().find(p => !played.has(p.id)) || null;
  function tourLength(t) {
    const st = tourStops(t); let d = 0;
    for (let i = 1; i < st.length; i++) d += distance(st[i - 1].lat, st[i - 1].lng, st[i].lat, st[i].lng);
    return d;
  }
  function drawTourLine() {
    if (tourLine) { map.removeLayer(tourLine); tourLine = null; }
    if (!tourOn) return;
    const pts = tourStops().map(p => [p.lat, p.lng]);
    tourLine = L.layerGroup([
      L.polyline(pts, { color: '#06142e', weight: 9, opacity: .55, interactive: false }),
      L.polyline(pts, { color: '#6dd5fa', weight: 4, opacity: .95, dashArray: '2 10', lineCap: 'round', interactive: false })
    ]).addTo(map);
    return pts;
  }
  function setTour(id, fly = true) {
    tourId = id || null; tourOn = !!tourId; store.set('tourId', tourId); store.set('tourOn', tourOn);
    const pts = drawTourLine();
    if (tourOn) {
      if (fly && pts.length) map.flyToBounds(L.latLngBounds(pts).pad(.25), { duration: .9 });
      const n = tourNext(); if (n && !isActive()) select(n);
      if (fly) toast(`${activeTour().emoji} התחלתם: ${activeTour().title}`);
    }
    refreshPins(); updateTour(); renderTours();
  }
  function updateTour() {
    const box = $('#tour');
    const n = tourOn ? tourNext() : null;
    box.hidden = !n;
    if (!n) {
      if (tourOn && tourStops().every(p => played.has(p.id))) { toast(`🎉 סיימתם את הסיור "${activeTour().title}"! כל הכבוד`); setTour(null, false); }
      return;
    }
    const st = tourStops();
    $('#tour-step').textContent = `${activeTour().emoji} התחנה הבאה · ${st.indexOf(n) + 1} מתוך ${st.length}`;
    $('#tour-title').textContent = `${n.emoji} ${n.title}`;
    if (pos) {
      const d = distance(pos.lat, pos.lng, n.lat, n.lng);
      $('#tour-dist').textContent = d <= n.radius ? 'הגעתם! הפרק מתנגן' : `${fmt(d)} ${dirName(bearing(pos.lat, pos.lng, n.lat, n.lng))} · כ־${Math.max(1, Math.round(d / 75))} דק׳ הליכה`;
    } else $('#tour-dist').textContent = '';
    updateTourArrow();
  }
  function updateTourArrow() {
    const n = tourOn && tourNext(); if (!n || !pos) return;
    const b = bearing(pos.lat, pos.lng, n.lat, n.lng) - (heading || 0); // relative to where you face, if we know it
    $('#tour-arrow svg').style.transform = `rotate(${b}deg)`;
  }
  function renderTours() {
    $('#tours').innerHTML = TOURS.map(t => {
      const st = tourStops(t), done = st.filter(p => played.has(p.id)).length, on = t.id === tourId;
      const walk = Math.round(tourLength(t) / 75), listen = Math.round(st.reduce((m, p) => m + p.script.split(/\s+/).length / WPM, 0));
      return `<div class="tcard ${on ? 'on' : ''}">
        <b>${t.emoji} ${t.title}</b><p>${t.desc}</p>
        <small>${st.length} תחנות · ${fmt(tourLength(t))} · כ־${walk + listen} דק׳</small>
        <div class="bar"><i style="width:${Math.round(done / st.length * 100)}%"></i></div>
        <button data-tour="${t.id}" class="${on ? 'stop' : ''}">${on ? 'סיום הסיור' : done ? `המשיכו (${done}/${st.length})` : 'התחילו'}</button>
      </div>`;
    }).join('');
  }
  $('#tours').addEventListener('click', e => {
    const b = e.target.closest('button[data-tour]'); if (!b) return;
    if (b.dataset.tour === tourId) setTour(null, false); else { setTour(b.dataset.tour); toggleDrawer(false); }
  });
  $('#tour').addEventListener('click', e => {
    if (e.target.closest('#tour-stop')) { setTour(null, false); return; }
    const n = tourNext(); if (!n) return;
    select(n); map.flyTo([n.lat, n.lng], 17, { duration: .8 }); openNow();
  });

  /* ---------- quiz ---------- */
  function seededShuffle(arr, seed) {
    let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function renderQuiz(ep) {
    const box = $('#quiz'), q = QUIZ[ep.id];
    if (!q) { box.hidden = true; return; }
    box.hidden = false;
    const answered = ep.id in quizRes;
    box.classList.toggle('done', answered);
    $('#quiz-q').textContent = q.q;
    const opts = seededShuffle(q.a.map((t, i) => ({ t, ok: i === 0 })), ep.id);
    $('#quiz-a').innerHTML = opts.map(o => `<button data-ok="${o.ok ? 1 : 0}" ${answered ? 'disabled' : ''} class="${answered && o.ok ? 'ok' : ''}">${o.t}</button>`).join('');
    $('#quiz-state').textContent = !answered ? 'ענו נכון וצברו 10 נקודות' : quizRes[ep.id] ? '✓ עניתם נכון · +10' : 'כבר עניתם על השאלה';
  }
  $('#quiz-a').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !current || current.id in quizRes) return;
    const ok = b.dataset.ok === '1';
    quizRes[current.id] = ok; store.set('quiz', quizRes);
    b.classList.add(ok ? 'ok' : 'bad');
    $('#quiz-a').querySelectorAll('button').forEach(x => { x.disabled = true; if (x.dataset.ok === '1') x.classList.add('ok'); });
    $('#quiz').classList.add('done');
    $('#quiz-state').textContent = ok ? '✓ עניתם נכון · +10' : 'לא נורא, עכשיו אתם יודעים!';
    if (ok) { toast('🎉 תשובה נכונה! +10 נקודות'); if (chime) playChime(); if (navigator.vibrate) navigator.vibrate(60); }
    else toast('כמעט! התשובה הנכונה מסומנת בירוק');
    checkBadges(); renderProgress();
  });

  /* ---------- editor mode (fix coordinates on the ground) ---------- */
  function setEditing(on) {
    editing = on; store.set('editing', on);
    document.body.classList.toggle('editing', on);
    $('#editor-tools').hidden = !on;
    PLACES.forEach(p => { const d = markers[p.id] && markers[p.id].m.dragging; if (d) on ? d.enable() : d.disable(); });
    if (current) renderEdit(current);
    renderEditsCount();
  }
  function renderEditsCount() { $('#edits-count').textContent = `${Object.keys(edits).length} מקומות נערכו (נשמר במכשיר הזה)`; }
  function renderEdit(ep) {
    const box = $('#edit-box');
    box.hidden = !editing || !!ep.live;
    if (box.hidden) return;
    $('#edit-info').textContent = `${ep.title} · ${ep.lat.toFixed(5)}, ${ep.lng.toFixed(5)} · ${edits[ep.id] ? 'נערך ✓' : ep.approx ? 'מיקום משוער' : 'מיקום מאומת'}`;
    $('#radius-label').textContent = ep.radius + ' מ׳';
  }
  function saveEdit(p, ll, radius) {
    if (ll) { p.lat = +ll.lat.toFixed(6); p.lng = +ll.lng.toFixed(6); p.approx = false; }
    if (radius) p.radius = radius;
    edits[p.id] = { lat: p.lat, lng: p.lng, radius: p.radius }; store.set('edits', edits);
    const mk = markers[p.id]; mk.m.setLatLng([p.lat, p.lng]); mk.circle.setLatLng([p.lat, p.lng]).setRadius(p.radius);
    drawTourLine(); renderTours(); renderEditsCount();
    if (current && current.id === p.id) { renderEdit(p); $('#now-approx').hidden = true; }
    toast(`✓ נשמר: ${p.title}`);
  }
  const RADII = [100, 150, 200, 250, 300, 400, 500];
  function exportEdits() {
    const data = PLACES.map(p => ({ id: p.id, title: p.title, lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6), radius: p.radius, edited: !!edits[p.id] }));
    const json = JSON.stringify(data, null, 2);
    try { navigator.clipboard.writeText(json); } catch (e) {}
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = 'podtc-locations.json';
    document.body.appendChild(a); a.click(); a.remove();
    toast('הקובץ ירד והועתק. שלחו אותו כדי לעדכן את האפליקציה לכולם');
  }
  // secret entry: tap the logo 5 times
  let logoTaps = [];
  $('.top__logo').addEventListener('click', () => {
    const now = Date.now(); logoTaps = logoTaps.filter(t => now - t < 2500); logoTaps.push(now);
    if (logoTaps.length >= 5) { logoTaps = []; setEditing(!editing); toast(editing ? '🛠️ מצב עורך פעיל: גררו סיכות או קבעו מיקום מתוך פרק' : 'יצאתם ממצב עורך'); }
  });

  function onEnter(place) {
    if (editing) { toast(`🛠️ אתם באזור של: ${place.title}`); return; } // editor: never switch the place being edited
    if (navigator.vibrate) navigator.vibrate([90, 50, 90]);
    if (chime) playChime();
    const busy = isActive();
    if (!busy) select(place);
    if (autoplay && !busy && !played.has(place.id)) { play(); toast(`${place.emoji} הגעתם ל${place.title}`); }
    else toast(`${place.emoji} הגעתם ל${place.title}. יש כאן פרק!`);
  }

  const isActive = () => ['playing', 'paused', 'skipping'].includes(Narrator.state);

  function nearest(excludeId) {
    if (!pos) return null;
    return allEpisodes().filter(p => p.id !== excludeId)
      .map(p => ({ p, d: distance(pos.lat, pos.lng, p.lat, p.lng) + (played.has(p.id) ? 400 : 0) }))
      .sort((a, b) => a.d - b.d)[0]?.p || null;
  }
  function showNearest() {
    if (isActive()) return;
    const n = nearest();
    if (n && (!current || current.id !== n.id)) select(n);
  }

  async function maybeFetchWiki() {
    if (!pos || insideId) return;
    if (lastWikiPos && distance(pos.lat, pos.lng, lastWikiPos.lat, lastWikiPos.lng) < 250) return;
    lastWikiPos = { ...pos };
    try {
      const items = await PodWiki.nearby(pos.lat, pos.lng);
      liveItems = items.filter(w => !PLACES.some(p => distance(w.lat, w.lng, p.lat, p.lng) < p.radius * .6)).slice(0, 8);
      renderFilters(); refreshPins(); renderList();
    } catch (e) { /* offline: curated content still works */ }
  }

  /* ================= player ================= */
  function select(ep, keepQueue) {
    if (!keepQueue) { queue = []; queueName = ''; }
    if (current && current.id !== ep.id && isActive()) Narrator.stop();
    current = ep;
    const cat = catOf(ep);
    $('#mini-art').textContent = $('#now-art').textContent = ep.emoji;
    $('#mini-title').textContent = $('#now-title').textContent = ep.title;
    $('#now-sub').textContent = ep.subtitle;
    const pill = $('#now-cat'); pill.textContent = cat.label; pill.style.setProperty('--c', cat.color);
    $('#now-dur').textContent = '🎧 ' + minutes(ep);
    $('#now-approx').hidden = !ep.approx;
    $('#now-sources').innerHTML = (ep.sources || []).map(s => `<a href="${s}" target="_blank" rel="noopener">${decodeURIComponent(s).replace(/^https?:\/\/(www\.)?/, '').slice(0, 46)}</a>`).join(' · ');
    // transcript, split exactly like the narrator so we can highlight the sentence being read
    const text = ep.intro ? ep.intro + '. ' + ep.script : ep.script;
    const parts = Narrator.split(text);
    $('#transcript').innerHTML = parts.map((t, i) => `<span data-i="${i}">${t} </span>`).join('');
    chunkEls = [...$('#transcript').children];
    renderQuiz(ep); renderEdit(ep); renderFav();
    setProgress(0);
    updateMeta();
  }

  function renderFav() {
    const on = current && favs.has(current.id);
    $('#now-fav').classList.toggle('on', !!on);
    $('#now-fav').setAttribute('aria-label', on ? 'הסרה מהמועדפים' : 'הוספה למועדפים');
  }
  function toggleFav(id) {
    if (!id) return;
    if (favs.has(id)) { favs.delete(id); toast('הוסר מהמועדפים'); } else { favs.add(id); toast('♥ נשמר במועדפים'); if (navigator.vibrate) navigator.vibrate(30); }
    store.set('favs', [...favs]); renderFav(); renderFilters(); refreshPins(); renderList();
  }
  function updateMeta() {
    if (!current) return;
    const d = pos ? distance(pos.lat, pos.lng, current.lat, current.lng) : null;
    const here = d != null && d <= (current.radius || 100);
    const sub = $('#mini-sub');
    sub.classList.toggle('here', here);
    sub.textContent = isActive() ? current.subtitle + (queue.length ? ` · ${queueName}: עוד ${queue.length}` : '') : here ? 'אתם כאן · ' + minutes(current) : d != null ? `במרחק ${fmt(d)} · ${minutes(current)}` : current.subtitle;
    $('#now-dist').textContent = d == null ? '' : here ? '📍 אתם כאן' : '📍 ' + fmt(d);
  }

  function play() {
    if (!current) return;
    if (!Narrator.supported) { toast('הדפדפן לא תומך בהקראה. אפשר לקרוא את התמליל'); openNow(); return; }
    Narrator.play(current);
    markPlayed(current.id);
    const today = new Date().toISOString().slice(0, 10), days = store.get('days', []);
    if (!days.includes(today)) { days.push(today); store.set('days', days.slice(-90)); }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: current.title, artist: 'podtc · טירת כרמל', album: current.subtitle,
        artwork: [{ src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png' }] });
      navigator.mediaSession.setActionHandler('pause', () => Narrator.pause());
      navigator.mediaSession.setActionHandler('play', () => Narrator.resume());
      try { navigator.mediaSession.setActionHandler('nexttrack', playNext); } catch (e) {}
    }
  }
  function togglePlay() {
    const s = Narrator.state;
    if (s === 'playing' || s === 'skipping') Narrator.pause();
    else if (s === 'paused') Narrator.resume();
    else play();
  }
  function playNext() {
    const n = nearest(current && current.id);
    if (!n) { toast('אין עוד פרקים בסביבה'); return; }
    select(n); play();
  }

  function setProgress(f) { $('#mini-progress').style.width = $('#now-progress').style.width = Math.round(f * 100) + '%'; }
  Narrator.on('progress', setProgress);
  Narrator.on('chunk', i => {
    if (current && !current.live) { if (i > 0 && i < chunkEls.length - 1) store.set('resume', { id: current.id, i, n: chunkEls.length }); }
    chunkEls.forEach((el, j) => { el.classList.toggle('cur', j === i); el.classList.toggle('done', j < i); });
    // follow along only when the listener is already reading the transcript (don't yank the controls away)
    const el = chunkEls[i], sc = $('.now__scroll');
    if (el && $('#now').classList.contains('open') && $('#transcript').getBoundingClientRect().top < sc.clientHeight * .5) {
      const r = el.getBoundingClientRect();
      if (r.top < 90 || r.bottom > sc.clientHeight - 40) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });
  Narrator.on('state', s => {
    document.body.classList.toggle('playing', s === 'playing' || s === 'skipping');
    updateMeta();
    if (s !== 'skipping') emitUpdate();
    if (s === 'ended') {
      setProgress(1); chunkEls.forEach(el => { el.classList.remove('cur'); el.classList.add('done'); });
      const rs = store.get('resume', null); if (rs && current && rs.id === current.id) store.set('resume', null);
      if (queue.length) {
        const nx = byId(queue[0]);
        toast(`⏭ הפרק הבא ב${queueName}: ${nx.emoji} ${nx.title}`);
        setTimeout(() => { if (Narrator.state === 'ended' && queue.length) { const n = byId(queue.shift()); select(n, true); play(); } }, 3000);
        checkBadges();
        return;
      }
      if (queueName) { const qn = queueName; setTimeout(() => toast(`✓ סיימתם להאזין: ${qn}`), 600); queueName = ''; checkBadges(); return; }
      checkBadges();
      if (current && QUIZ[current.id] && !(current.id in quizRes)) {
        setTimeout(() => toast('🧠 יש חידון קצר על הפרק! גללו למטה בנגן'), 1200);
        if ($('#now').classList.contains('open')) setTimeout(() => $('#quiz').scrollIntoView({ block: 'center', behavior: 'smooth' }), 600);
      }
      if (tourOn) {
        const n = tourNext();
        updateTour();
        if (n) { toast(`המשיכו לתחנה הבאה: ${n.emoji} ${n.title}`); setTimeout(() => { if (Narrator.state === 'ended') select(n); }, 2500); }
      } else setTimeout(() => { if (Narrator.state === 'ended') showNearest(); }, 4000);
    }
  });
  $('#transcript').addEventListener('click', e => {
    const sp = e.target.closest('span[data-i]'); if (!sp) return;
    const i = +sp.dataset.i;
    if (isActive()) Narrator.seek(i); else { play(); setTimeout(() => Narrator.seek(i), 80); }
  });

  /* ---------- progress & badges ---------- */
  const quizCorrect = () => Object.values(quizRes).filter(Boolean).length;
  const points = () => curatedPlayed() * 5 + quizCorrect() * 10;
  const BADGES = [
    { id: 'l1', label: 'מאזינ/ה ראשון/ה', test: () => curatedPlayed() >= 1 },
    { id: 'l5', label: 'סייר/ת', test: () => curatedPlayed() >= 5 },
    { id: 'l12', label: 'חוקר/ת העיר', test: () => curatedPlayed() >= 12 },
    { id: 'q5', label: 'ראש גדול', test: () => quizCorrect() >= 5 },
    { id: 'q15', label: 'אלופ/ת החידון', test: () => quizCorrect() >= 15 },
    { id: 'streak3', label: 'רצף 3 ימים', test: () => window.PodApp && window.PodApp.streak() >= 3 },
    { id: 'tour', label: 'מסיימ/ת סיור', test: () => TOURS.some(t => tourStops(t).every(p => played.has(p.id))) },
    { id: 'all', label: 'מכיר/ה כל פינה', test: () => curatedPlayed() >= PLACES.length }
  ];
  function markPlayed(id) {
    played.add(id); store.set('played', [...played]); refreshPins(); renderList();
  }
  function curatedPlayed() { return PLACES.filter(p => played.has(p.id)).length; }
  function checkBadges() {
    const seen = store.get('badges2', []);
    BADGES.forEach(b => { if (b.test() && !seen.includes(b.id)) { seen.push(b.id); store.set('badges2', seen); setTimeout(() => toast(`🏅 תג חדש: ${b.label}`), 2600); } });
  }
  function renderProgress() {
    const n = curatedPlayed(), tot = PLACES.length, off = 97.4 * (1 - n / tot);
    $('#ring-mini').style.strokeDashoffset = off; $('#ring-big').style.strokeDashoffset = off;
    $('#count').textContent = `${n}/${tot}`;
    $('#pc-title').textContent = n === 0 ? 'התחילו לגלות' : n === tot ? 'גיליתם את כל העיר! 🎉' : `גיליתם ${Math.round(n / tot * 100)}% מהעיר`;
    $('#pc-sub').textContent = `${n} מתוך ${tot} מקומות`;
    $('#pc-points').textContent = `⭐ ${points()} נקודות · ${quizCorrect()} תשובות נכונות בחידון`;
    $('#badges').innerHTML = BADGES.map(b => `<span class="badge ${b.test() ? 'on' : ''}">${b.label}</span>`).join('');
  }

  /* ---------- library ---------- */
  function renderList() {
    renderProgress();
    const q = query.trim();
    let rows = allEpisodes().filter(matchFilter)
      .filter(p => !q || [p.title, p.subtitle, p.script, catOf(p).label].some(t => t && t.includes(q)))
      .map(p => ({ p, d: pos ? distance(pos.lat, pos.lng, p.lat, p.lng) : null }));
    if (pos) rows.sort((a, b) => a.d - b.d);
    $('#list').innerHTML = rows.map(({ p, d }) => {
      const c = catOf(p);
      return `<li class="card ${p.id === insideId ? 'card--here' : ''}" data-id="${p.id}">
        <span class="art art--sm">${p.emoji}</span>
        <span class="card__body"><b>${p.title}</b><small>${p.subtitle}</small>
          <span class="card__tags"><i style="--c:${c.color}">${c.label}</i>· ${minutes(p)}</span></span>
        <span class="card__meta">${d == null ? '' : p.id === insideId ? 'אתם כאן' : fmt(d)}${favs.has(p.id) ? '<span class="card__fav">♥</span>' : ''}${played.has(p.id) ? '<span class="card__check">✓</span>' : ''}</span>
      </li>`;
    }).join('');
    $('#list-empty').hidden = rows.length > 0;
    emitUpdate();
  }
  function emitUpdate() { const l = window.PodApp && window.PodApp._l; if (l) l.forEach(f => { try { f(); } catch (e) { console.warn(e); } }); }
  $('#list').addEventListener('click', e => {
    const li = e.target.closest('.card'); if (!li) return;
    const ep = allEpisodes().find(p => p.id === li.dataset.id);
    if (ep) { select(ep); toggleDrawer(false); map.flyTo([ep.lat, ep.lng], 16, { duration: .8 }); openNow(); }
  });

  /* ---------- sheets ---------- */
  function toggleDrawer(open) {
    $('#drawer').classList.toggle('open', open); $('#scrim').classList.toggle('on', open);
    $('#drawer').setAttribute('aria-hidden', String(!open));
  }
  function openNow() { $('#now').classList.add('open'); $('#now').setAttribute('aria-hidden', 'false'); }
  function closeNow() { $('#now').classList.remove('open'); $('#now').setAttribute('aria-hidden', 'true'); }

  /* ---------- extras ---------- */
  function playChime() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ctx = playChime.ctx || (playChime.ctx = new AC());
      [880, 1318.5].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * .14;
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.18, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + .7);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + .75);
      });
    } catch (e) {}
  }
  async function share() {
    if (!current) return;
    const data = { title: `podtc · ${current.title}`, text: `האזנתי לפרק על "${current.title}" בטירת כרמל 🎧`, url: location.href.split('#')[0] + '#' + current.id };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(data.text + ' ' + data.url); toast('הקישור הועתק'); }
    } catch (e) {}
  }
  function navigate() {
    if (!current) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${current.lat},${current.lng}&travelmode=walking`, '_blank', 'noopener');
  }
  function streetView() {
    if (!current) return;
    window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${current.lat},${current.lng}`, '_blank', 'noopener');
  }
  /* achievement card (image) to share on WhatsApp / Instagram */
  async function shareCard() {
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const bg = g.createRadialGradient(W / 2, 0, 50, W / 2, H * .4, H);
    bg.addColorStop(0, '#174a96'); bg.addColorStop(.55, '#06142e'); bg.addColorStop(1, '#030b1c');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const logo = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = 'assets/logo-full.png'; });
    if (logo) { const w = 640, h = w * logo.height / logo.width; g.drawImage(logo, (W - w) / 2, 120, w, h); }
    const n = curatedPlayed(), pct = Math.round(n / PLACES.length * 100);
    g.direction = 'rtl'; g.textAlign = 'center'; g.fillStyle = '#ffffff';
    g.font = '700 64px Rubik, Heebo, sans-serif'; g.fillText('גיליתי', W / 2, 560);
    g.fillStyle = '#6dd5fa'; g.font = '800 220px Rubik, Heebo, sans-serif'; g.fillText(pct + '%', W / 2, 780);
    g.fillStyle = '#ffffff'; g.font = '700 64px Rubik, Heebo, sans-serif'; g.fillText('מטירת כרמל', W / 2, 870);
    g.fillStyle = '#93acc9'; g.font = '400 44px Heebo, sans-serif';
    g.fillText(`${n} מקומות · ⭐ ${points()} נקודות · ${quizCorrect()} תשובות נכונות`, W / 2, 960);
    const earned = BADGES.filter(b => b.test()).map(b => b.label);
    if (earned.length) { g.fillStyle = '#eaf6ff'; g.font = '500 40px Heebo, sans-serif'; g.fillText('🏅 ' + earned.slice(-3).join(' · '), W / 2, 1050); }
    g.fillStyle = '#6dd5fa'; g.font = '500 38px Heebo, sans-serif'; g.fillText('האזינו גם אתם: tiratcarmel2026.github.io/-/podtc', W / 2, 1240);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const file = new File([blob], 'podtc.png', { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'podtc', text: `גיליתי ${pct}% מטירת כרמל עם podtc 🎧` }); return; }
    } catch (e) { return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'podtc.png'; document.body.appendChild(a); a.click(); a.remove();
    toast('התמונה ירדה למכשיר. אפשר לשתף אותה');
  }

  /* save the map of the whole city (current style) for offline use: the service worker caches the tiles */
  async function saveOffline() {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) { toast('האפשרות תהיה זמינה אחרי טעינה מחדש של האפליקציה'); return; }
    const b = L.latLngBounds(PLACES.map(p => [p.lat, p.lng])).pad(.15);
    const r = L.Browser.retina ? '@2x' : '', subs = 'abcd';
    const lon2x = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
    const lat2y = (lat, z) => { const t = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(t) + 1 / Math.cos(t)) / Math.PI) / 2 * 2 ** z); };
    const tpl = {
      sat: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}{r}.png'],
      street: ['https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'],
      night: ['https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png']
    }[mapStyle];
    const urls = [];
    for (let z = 13; z <= 17; z++)
      for (let x = lon2x(b.getWest(), z); x <= lon2x(b.getEast(), z); x++)
        for (let y = lat2y(b.getNorth(), z); y <= lat2y(b.getSouth(), z); y++)
          tpl.forEach(t => urls.push(t.replace('{s}', subs[(x + y) % 4]).replace('{z}', z).replace('{x}', x).replace('{y}', y).replace('{r}', r)));
    const btn = $('#btn-offline'), label = btn.textContent; let done = 0, fail = 0;
    btn.disabled = true;
    const worker = async () => { while (urls.length) { const u = urls.pop(); try { await fetch(u, { mode: 'no-cors' }); } catch (e) { fail++; } done++; btn.textContent = `📥 שומרים את המפה… ${done}`; } };
    const total = urls.length;
    await Promise.all(Array.from({ length: 6 }, worker));
    btn.disabled = false; btn.textContent = label;
    toast(fail > total / 3 ? 'השמירה לא הושלמה. נסו שוב עם חיבור טוב יותר' : `✓ מפת העיר נשמרה (${total - fail} אריחים). אפשר לטייל גם בלי קליטה`);
  }

  function feedback() {
    const ep = current ? `\nמקום: ${current.title} (${current.id})` : '';
    const body = `שלום,\nרציתי להציע מקום חדש / לדווח על טעות באפליקציה podtc.${ep}\n\nהפרטים:\n`;
    location.href = `mailto:?subject=${encodeURIComponent('podtc: הצעה או תיקון')}&body=${encodeURIComponent(body)}`;
  }

  const RATES = [0.85, 1, 1.15, 1.3];
  function cycleRate() {
    const r = RATES[(RATES.indexOf(Narrator.rate) + 1) % RATES.length] || 1;
    Narrator.setRate(r); $('#rate-label').textContent = '×' + r; if (current) { $('#now-dur').textContent = '🎧 ' + minutes(current); }
    toast(`מהירות הקראה ×${r} (תחול מהמשפט הבא)`);
  }

  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; $('#btn-install').hidden = false; });

  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3800); }

  function start() {
    Narrator.unlock();
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC && !playChime.ctx) playChime.ctx = new AC(); } catch (e) {} // unlock audio inside the tap
    $('#splash').classList.add('out'); setTimeout(() => { $('#splash').hidden = true; }, 520);
    if (Narrator.supported && !Narrator.hasHebrewVoice()) setTimeout(() => toast('לא נמצא קול עברי במכשיר. מומלץ להתקין "Google Text-to-Speech" עם עברית'), 1500);
    map.invalidateSize();
    startTracking();
    startCompass();
    const deep = PLACES.find(p => '#' + p.id === location.hash); // shared link
    if (deep) { select(deep); map.setView([deep.lat, deep.lng], 16); openNow(); }
  }

  /* ================= public API (used by the home page, js/home.js) ================= */
  window.PodApp = {
    _l: [],
    onUpdate(fn) { this._l.push(fn); },
    PLACES, CATS, TOURS, QUIZ, catOf, minutes, distance, fmt, tourStops, tourLength,
    get pos() { return pos; }, get played() { return played; }, get current() { return current; }, get tourId() { return tourId; },
    get deferredInstall() { return deferredInstall; }, clearInstall() { deferredInstall = null; $('#btn-install').hidden = true; },
    select, play, openNow, toast, points, curatedPlayed, quizCorrect, feedback, isActive,
    listen(ep) { select(ep); play(); openNow(); },
    showOnMap(ep) { select(ep); map.invalidateSize(); map.flyTo([ep.lat, ep.lng], 17, { duration: .9 }); follow = false; },
    startTour(id) { setTour(id); },
    get favs() { return favs; }, toggleFav,
    playQueue(ids, name) {
      const list = ids.filter(byId); if (!list.length) return;
      const first = byId(list.shift());
      select(first); queue = list; queueName = name || 'השמעה רציפה'; play(); openNow();
      toast(`▶ ${queueName}: ${list.length + 1} פרקים ברצף`);
    },
    resumeInfo() { const r = store.get('resume', null); return r && byId(r.id) ? { ep: byId(r.id), i: r.i, n: r.n } : null; },
    resume() { const r = this.resumeInfo(); if (!r) return; select(r.ep); play(); openNow(); setTimeout(() => Narrator.seek(r.i), 120); },
    streak() {
      const days = new Set(store.get('days', [])); let n = 0; const d = new Date();
      if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1); // a streak survives until the end of today
      while (days.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
      return n;
    },
    openLibrary() { toggleDrawer(true); },
    invalidate() { map.invalidateSize(); }
  };

  /* ================= wire up ================= */
  initMap(); renderFilters(); renderList(); renderTours(); if (tourId) setTour(tourId, false);
  if (editing) setEditing(true);
  const a11yOn = store.get('a11y', false); document.body.classList.toggle('a11y', a11yOn);
  $('#feat-count').textContent = PLACES.length;
  $('#rate-label').textContent = '×' + Narrator.rate;

  $('#btn-start').addEventListener('click', start);
  $('#btn-start-demo').addEventListener('click', () => { start(); toggleDemo(true); });
  $('#mini-play').addEventListener('click', () => { if (!current) { const n = nearest() || PLACES[0]; select(n); } togglePlay(); });
  $('#now-play').addEventListener('click', togglePlay);
  $('#mini-open').addEventListener('click', () => { if (!current) select(nearest() || PLACES[0]); openNow(); });
  $('#now-close').addEventListener('click', closeNow);
  $('#now-share').addEventListener('click', share);
  $('#now-fav').addEventListener('click', () => current && !current.live && toggleFav(current.id));
  $('#btn-back').addEventListener('click', () => Narrator.skip(-1));
  $('#btn-fwd').addEventListener('click', () => Narrator.skip(1));
  $('#btn-nav').addEventListener('click', navigate);
  $('#btn-street').addEventListener('click', streetView);
  $('#btn-style').addEventListener('click', () => { const o = Object.keys(STYLES); setStyle(o[(o.indexOf(mapStyle) + 1) % o.length]); });
  $('#btn-rate').addEventListener('click', cycleRate);
  $('#btn-next').addEventListener('click', playNext);
  $('#btn-list').addEventListener('click', () => toggleDrawer(true));
  $('#btn-close').addEventListener('click', () => toggleDrawer(false));
  $('#scrim').addEventListener('click', () => toggleDrawer(false));
  $('#btn-demo').addEventListener('click', () => toggleDemo());
  $('#btn-locate').addEventListener('click', () => {
    if (!pos) return toast('עדיין מחפשים מיקום…');
    follow = true; $('#btn-locate').classList.add('active'); map.flyTo([pos.lat, pos.lng], 17, { duration: .8 });
  });
  // install button is handled in js/home.js (prompt + per-platform instructions)
  const auto = $('#auto'); auto.checked = autoplay; auto.addEventListener('change', () => { autoplay = auto.checked; store.set('autoplay', autoplay); });
  const ch = $('#chime'); ch.checked = chime; ch.addEventListener('change', () => { chime = ch.checked; store.set('chime', chime); if (chime) playChime(); });
  $('#btn-reset').addEventListener('click', () => { played.clear(); store.set('played', []); store.set('badges', []); quizRes = {}; store.set('quiz', {}); store.set('badges2', []); refreshPins(); renderList(); updateTour(); renderTours(); if (current) renderQuiz(current); toast('ההתקדמות אופסה'); });
  const a11y = $('#a11y'); a11y.checked = a11yOn;
  a11y.addEventListener('change', () => { document.body.classList.toggle('a11y', a11y.checked); store.set('a11y', a11y.checked); });
  $('#search').addEventListener('input', e => { query = e.target.value; renderList(); });
  $('#btn-share-card').addEventListener('click', shareCard);
  $('#btn-offline').addEventListener('click', saveOffline);
  $('#btn-feedback').addEventListener('click', feedback);
  $('#btn-setloc').addEventListener('click', () => {
    if (!current || current.live) return;
    if (!pos || demo) return toast('צריך מיקום GPS אמיתי. צאו ממצב הדגמה ועמדו במקום עצמו');
    if (pos.acc > 30) toast(`שימו לב: דיוק ה־GPS כרגע ${Math.round(pos.acc)} מ׳`);
    saveEdit(current, L.latLng(pos.lat, pos.lng));
  });
  $('#btn-radius').addEventListener('click', () => {
    if (!current || current.live) return;
    const r = RADII[(RADII.indexOf(current.radius) + 1) % RADII.length] || 150;
    saveEdit(current, null, r);
  });
  $('#btn-export').addEventListener('click', exportEdits);
  $('#btn-clear-edits').addEventListener('click', () => { if (confirm('לבטל את כל העריכות במכשיר הזה?')) { store.set('edits', {}); location.reload(); } });
  $('#btn-exit-edit').addEventListener('click', () => { setEditing(false); toast('יצאתם ממצב עורך'); });
  // swipe down to close the player
  let y0 = null; const nowEl = $('#now');
  nowEl.addEventListener('touchstart', e => { y0 = $('.now__scroll').scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
  nowEl.addEventListener('touchend', e => { if (y0 != null && e.changedTouches[0].clientY - y0 > 90) closeNow(); y0 = null; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeNow(); toggleDrawer(false); } if (e.key === ' ' && e.target === document.body) { e.preventDefault(); togglePlay(); } });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
