/* PODTC — main app: map, location tracking, geofences, player UI. */
(function () {
  const PLACES = window.PODTC_PLACES, CENTER = window.PODTC_CENTER;
  const { distance, fmt } = window.PodGeo;
  const $ = s => document.querySelector(s);
  const PLAYED_KEY = 'podtc.played', AUTO_KEY = 'podtc.autoplay';

  let played = new Set(JSON.parse(localStorage.getItem(PLAYED_KEY) || '[]'));
  let autoplay = localStorage.getItem(AUTO_KEY) !== '0';
  let pos = null, demo = false, watchId = null;
  let current = null;        // episode shown in the player
  let insideId = null;       // curated place whose geofence we're inside
  let liveItems = [], lastWikiPos = null;
  let map, userMarker, accCircle, markers = {};

  /* ---------- map ---------- */
  function initMap() {
    map = L.map('map', { zoomControl: false, attributionControl: true }).setView([CENTER.lat, CENTER.lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap'
    }).addTo(map);
    L.control.zoom({ position: 'topleft' }).addTo(map);
    PLACES.forEach(p => {
      L.circle([p.lat, p.lng], { radius: p.radius, color: '#e8590c', weight: 1, fillOpacity: 0.08 }).addTo(map);
      const icon = L.divIcon({ className: 'pin', html: `<span>${p.emoji}</span>`, iconSize: [38, 38], iconAnchor: [19, 19] });
      markers[p.id] = L.marker([p.lat, p.lng], { icon, title: p.title }).addTo(map).on('click', () => select(p, true));
    });
    map.on('click', e => { if (demo) setPosition(e.latlng.lat, e.latlng.lng, 10); });
  }

  function refreshPins() {
    PLACES.forEach(p => {
      const el = markers[p.id].getElement();
      if (el) { el.classList.toggle('pin--played', played.has(p.id)); el.classList.toggle('pin--here', p.id === insideId); }
    });
  }

  /* ---------- location ---------- */
  function startTracking() {
    if (!('geolocation' in navigator)) { toast('המכשיר לא תומך בשירותי מיקום — עוברים למצב הדגמה'); enableDemo(); return; }
    watchId = navigator.geolocation.watchPosition(
      g => { if (!demo) setPosition(g.coords.latitude, g.coords.longitude, g.coords.accuracy); },
      err => {
        if (pos && err.code !== 1) return; // transient timeout while we already have a fix
        toast(err.code === 1 ? 'לא ניתנה הרשאת מיקום. אפשר לאשר בהגדרות הדפדפן, או להשתמש במצב הדגמה.' : 'לא הצלחנו לאתר מיקום.');
        $('#btn-demo').classList.add('pulse');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  }

  function enableDemo() {
    demo = !demo;
    $('#btn-demo').classList.toggle('active', demo);
    $('#btn-demo').classList.remove('pulse');
    toast(demo ? 'מצב הדגמה: לחצו על המפה כדי "ללכת" לשם' : 'חזרה למיקום אמיתי');
    if (demo && !pos) setPosition(CENTER.lat, CENTER.lng, 10);
  }

  let firstFix = true;
  function setPosition(lat, lng, acc) {
    pos = { lat, lng, acc };
    if (!userMarker) {
      userMarker = L.marker([lat, lng], { icon: L.divIcon({ className: 'me', iconSize: [18, 18] }), interactive: false, zIndexOffset: 1000 }).addTo(map);
      accCircle = L.circle([lat, lng], { radius: acc, color: '#1971c2', weight: 0, fillOpacity: 0.12, interactive: false }).addTo(map);
    } else { userMarker.setLatLng([lat, lng]); accCircle.setLatLng([lat, lng]).setRadius(acc); }
    if (firstFix) { firstFix = false; map.setView([lat, lng], 16); }

    const inTown = distance(lat, lng, CENTER.lat, CENTER.lng) < CENTER.radius;
    $('#status').textContent = inTown ? '📍 אתם בטירת כרמל' : '📍 אתם מחוץ לטירת כרמל — ' + fmt(distance(lat, lng, CENTER.lat, CENTER.lng)) + ' מהמרכז';

    // geofence: closest curated place whose radius contains us
    const here = PLACES.map(p => ({ p, d: distance(lat, lng, p.lat, p.lng) }))
      .filter(x => x.d <= x.p.radius).sort((a, b) => a.d / a.p.radius - b.d / b.p.radius)[0];
    const newInside = here ? here.p.id : null;
    if (newInside !== insideId) {
      insideId = newInside;
      if (here) onEnter(here.p);
      refreshPins();
    }
    if (!current || (!insideId && Narrator.state !== 'playing')) showNearest();
    renderList();
    maybeFetchWiki();
  }

  function onEnter(place) {
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
    const busy = Narrator.state === 'playing';
    select(place, false);
    if (autoplay && !busy && !played.has(place.id)) play();
    else toast(`${place.emoji} הגעתם ל${place.title} — יש כאן פרק!`);
  }

  function showNearest() {
    if (!pos || Narrator.state === 'playing') return;
    const all = PLACES.concat(liveItems);
    const n = all.map(p => ({ p, d: distance(pos.lat, pos.lng, p.lat, p.lng) })).sort((a, b) => a.d - b.d)[0];
    if (n && (!current || current.id !== n.p.id)) select(n.p, false);
  }

  async function maybeFetchWiki() {
    if (!pos || insideId) return;
    if (lastWikiPos && distance(pos.lat, pos.lng, lastWikiPos.lat, lastWikiPos.lng) < 250) return;
    lastWikiPos = { ...pos };
    try {
      const items = await PodWiki.nearby(pos.lat, pos.lng);
      // skip Wikipedia items that sit inside a curated geofence (we already have a better episode there)
      liveItems = items.filter(w => !PLACES.some(p => distance(w.lat, w.lng, p.lat, p.lng) < p.radius * 0.6)).slice(0, 8);
      renderList();
    } catch (e) { /* offline or blocked — curated content still works */ }
  }

  /* ---------- player ---------- */
  function select(ep, pan) {
    current = ep;
    $('#ep-emoji').textContent = ep.emoji;
    $('#ep-title').textContent = ep.title;
    $('#ep-sub').textContent = ep.subtitle + (ep.live ? '' : '');
    const d = pos ? distance(pos.lat, pos.lng, ep.lat, ep.lng) : null;
    $('#ep-dist').textContent = d == null ? '' : (d <= (ep.radius || 100) ? 'אתם כאן ✓' : 'במרחק ' + fmt(d));
    $('#ep-text').textContent = (ep.intro ? ep.intro + '. ' : '') + ep.script;
    $('#ep-sources').innerHTML = (ep.sources || []).map(s => `<a href="${s}" target="_blank" rel="noopener">${decodeURIComponent(s).replace(/^https?:\/\/(www\.)?/, '').slice(0, 48)}</a>`).join(' · ');
    $('#ep-approx').hidden = !ep.approx;
    if (Narrator.state !== 'playing') setPlayIcon('idle');
    $('#player').classList.add('player--has');
    if (pan) map.panTo([ep.lat, ep.lng]);
  }

  function play() {
    if (!current) return;
    if (!Narrator.supported) { toast('הדפדפן לא תומך בהקראה — אפשר לקרוא את התמליל'); openText(true); return; }
    Narrator.play(current);
    markPlayed(current.id);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: current.title, artist: 'PODTC · טירת כרמל', album: current.subtitle });
      navigator.mediaSession.setActionHandler('pause', () => Narrator.pause());
      navigator.mediaSession.setActionHandler('play', () => Narrator.resume());
    }
  }

  function markPlayed(id) { played.add(id); localStorage.setItem(PLAYED_KEY, JSON.stringify([...played])); refreshPins(); renderList(); }

  function setPlayIcon(s) {
    const b = $('#btn-play');
    b.textContent = s === 'playing' ? '❚❚' : '▶';
    b.setAttribute('aria-label', s === 'playing' ? 'השהיה' : 'השמעה');
  }
  Narrator.on('state', s => {
    setPlayIcon(s);
    if (s === 'ended') { $('#progress').style.width = '100%'; showNearestAfterEnd(); }
  });
  Narrator.on('progress', f => { $('#progress').style.width = Math.round(f * 100) + '%'; });
  function showNearestAfterEnd() { setTimeout(() => { if (Narrator.state === 'ended') showNearest(); }, 2500); }

  function togglePlay() {
    const s = Narrator.state;
    if (s === 'playing') Narrator.pause();
    else if (s === 'paused') Narrator.resume();
    else { $('#progress').style.width = '0'; play(); }
  }

  function openText(force) { const t = $('#ep-textwrap'); t.hidden = force === true ? false : !t.hidden; }

  /* ---------- list ---------- */
  function renderList() {
    const rows = PLACES.concat(liveItems).map(p => ({ p, d: pos ? distance(pos.lat, pos.lng, p.lat, p.lng) : null }));
    if (pos) rows.sort((a, b) => a.d - b.d);
    $('#count').textContent = `${[...played].filter(id => PLACES.some(p => p.id === id)).length}/${PLACES.length}`;
    $('#list').innerHTML = rows.map(({ p, d }) => `
      <li class="row ${played.has(p.id) ? 'row--played' : ''} ${p.id === insideId ? 'row--here' : ''}" data-id="${p.id}">
        <span class="row__emoji">${p.emoji}</span>
        <span class="row__body"><b>${p.title}</b><small>${p.subtitle}</small></span>
        <span class="row__meta">${d == null ? '' : fmt(d)}${played.has(p.id) ? ' ✓' : ''}${p.live ? '<em>חי</em>' : ''}</span>
      </li>`).join('');
  }
  $('#list').addEventListener('click', e => {
    const li = e.target.closest('.row'); if (!li) return;
    const ep = PLACES.concat(liveItems).find(p => p.id === li.dataset.id);
    if (ep) { Narrator.stop(); select(ep, true); toggleDrawer(false); }
  });
  function toggleDrawer(open) { $('#drawer').classList.toggle('drawer--open', open); }

  /* ---------- misc ---------- */
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 4200); }

  function start() {
    Narrator.unlock();
    $('#splash').hidden = true;
    if (Narrator.supported && !Narrator.hasHebrewVoice()) toast('לא נמצא קול עברי במכשיר — ההקראה עשויה להישמע לא טבעית. מומלץ להתקין "Google Text-to-Speech" עם עברית.');
    map.invalidateSize();
    startTracking();
  }

  /* ---------- wire up ---------- */
  initMap();
  renderList();
  $('#btn-start').addEventListener('click', start);
  $('#btn-start-demo').addEventListener('click', () => { start(); enableDemo(); });
  $('#btn-play').addEventListener('click', togglePlay);
  $('#btn-text').addEventListener('click', () => openText());
  $('#btn-list').addEventListener('click', () => toggleDrawer(true));
  $('#btn-close').addEventListener('click', () => toggleDrawer(false));
  $('#btn-demo').addEventListener('click', enableDemo);
  $('#btn-locate').addEventListener('click', () => pos ? map.setView([pos.lat, pos.lng], 17) : toast('עדיין מחפשים מיקום…'));
  const auto = $('#auto'); auto.checked = autoplay;
  auto.addEventListener('change', () => { autoplay = auto.checked; localStorage.setItem(AUTO_KEY, autoplay ? '1' : '0'); });
  const rate = $('#rate'); rate.value = Narrator.rate;
  rate.addEventListener('change', () => Narrator.setRate(parseFloat(rate.value)));
  $('#btn-reset').addEventListener('click', () => { played.clear(); localStorage.removeItem(PLAYED_KEY); refreshPins(); renderList(); toast('ההתקדמות אופסה'); });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
