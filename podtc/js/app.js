/* podtc — main app: map, location tracking, geofences, player UI. */
(function () {
  const PLACES = window.PODTC_PLACES, CENTER = window.PODTC_CENTER, CATS = window.PODTC_CATEGORIES;
  const { distance, fmt } = window.PodGeo;
  const $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('podtc.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('podtc.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const WPM = 120; // Hebrew TTS ≈ 110–130 words/min

  let played = new Set(store.get('played', []));
  let autoplay = store.get('autoplay', true), chime = store.get('chime', true);
  let filter = 'all';
  let pos = null, demo = false;
  let current = null, insideId = null, liveItems = [], lastWikiPos = null;
  let map, userMarker, accCircle, markers = {}, liveLayer;
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
    map = L.map('map', { zoomControl: false, attributionControl: true }).setView([CENTER.lat, CENTER.lng], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19, subdomains: 'abcd',
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    PLACES.forEach(p => {
      const c = catOf(p).color;
      const circle = L.circle([p.lat, p.lng], { radius: p.radius, color: c, weight: 1, opacity: .5, fillColor: c, fillOpacity: .06, dashArray: '4 6', interactive: false }).addTo(map);
      const icon = L.divIcon({ className: '', html: `<div class="pin" style="--c:${c};width:42px;height:42px">${p.emoji}</div>`, iconSize: [42, 42], iconAnchor: [21, 21] });
      const m = L.marker([p.lat, p.lng], { icon, title: p.title }).addTo(map).on('click', () => { select(p); openNow(); });
      markers[p.id] = { m, circle };
    });
    liveLayer = L.layerGroup().addTo(map);
    map.on('click', e => { if (demo) setPosition(e.latlng.lat, e.latlng.lng, 8); });
    map.on('dragstart', () => { follow = false; $('#btn-locate').classList.remove('active'); });
  }

  function refreshPins() {
    PLACES.forEach(p => {
      const el = markers[p.id].m.getElement(); if (!el) return;
      const pin = el.firstElementChild;
      pin.classList.toggle('pin--played', played.has(p.id));
      pin.classList.toggle('pin--here', p.id === insideId);
      const dim = filter !== 'all' && p.category !== filter;
      pin.classList.toggle('pin--dim', dim);
      markers[p.id].circle.setStyle({ opacity: dim ? 0 : .5, fillOpacity: dim ? 0 : .06 });
    });
    liveLayer.clearLayers();
    if (filter === 'all' || filter === 'live') liveItems.forEach(w => {
      const icon = L.divIcon({ className: '', html: `<div class="pin pin--live" style="width:30px;height:30px">📖</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
      L.marker([w.lat, w.lng], { icon, title: w.title }).on('click', () => { select(w); openNow(); }).addTo(liveLayer);
    });
  }

  function renderFilters() {
    const used = ['all', ...Object.keys(CATS).filter(k => k === 'live' ? liveItems.length : PLACES.some(p => p.category === k))];
    $('#filters').innerHTML = used.map(k => k === 'all'
      ? `<button class="fchip" data-f="all" aria-pressed="${filter === 'all'}">הכול</button>`
      : `<button class="fchip" data-f="${k}" style="--c:${CATS[k].color}" aria-pressed="${filter === k}"><i></i>${CATS[k].label}</button>`).join('');
  }
  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('.fchip'); if (!b) return;
    filter = b.dataset.f; renderFilters(); refreshPins(); renderList();
    const vis = PLACES.filter(p => filter === 'all' || p.category === filter);
    if (vis.length) map.flyToBounds(L.latLngBounds(vis.map(p => [p.lat, p.lng])).pad(.35), { duration: .8, maxZoom: 16 });
  });

  /* ================= location ================= */
  function startTracking() {
    if (!('geolocation' in navigator)) { toast('המכשיר לא תומך בשירותי מיקום. עוברים למצב הדגמה'); toggleDemo(true); return; }
    navigator.geolocation.watchPosition(
      g => { if (!demo) setPosition(g.coords.latitude, g.coords.longitude, g.coords.accuracy); },
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
      userMarker = L.marker([lat, lng], { icon: L.divIcon({ className: '', html: '<div class="me" style="width:20px;height:20px"></div>', iconSize: [20, 20], iconAnchor: [10, 10] }), interactive: false, zIndexOffset: 2000 }).addTo(map);
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
    if (!current || (!insideId && !isActive())) showNearest();
    updateMeta(); renderList(); maybeFetchWiki();
  }

  function onEnter(place) {
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
  function select(ep) {
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
    setProgress(0);
    updateMeta();
  }

  function updateMeta() {
    if (!current) return;
    const d = pos ? distance(pos.lat, pos.lng, current.lat, current.lng) : null;
    const here = d != null && d <= (current.radius || 100);
    const sub = $('#mini-sub');
    sub.classList.toggle('here', here);
    sub.textContent = isActive() ? current.subtitle : here ? 'אתם כאן · ' + minutes(current) : d != null ? `במרחק ${fmt(d)} · ${minutes(current)}` : current.subtitle;
    $('#now-dist').textContent = d == null ? '' : here ? '📍 אתם כאן' : '📍 ' + fmt(d);
  }

  function play() {
    if (!current) return;
    if (!Narrator.supported) { toast('הדפדפן לא תומך בהקראה. אפשר לקרוא את התמליל'); openNow(); return; }
    Narrator.play(current);
    markPlayed(current.id);
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
    if (s === 'ended') {
      setProgress(1); chunkEls.forEach(el => { el.classList.remove('cur'); el.classList.add('done'); });
      checkBadges();
      setTimeout(() => { if (Narrator.state === 'ended') showNearest(); }, 4000);
    }
  });
  $('#transcript').addEventListener('click', e => {
    const sp = e.target.closest('span[data-i]'); if (!sp) return;
    const i = +sp.dataset.i;
    if (isActive()) Narrator.seek(i); else { play(); setTimeout(() => Narrator.seek(i), 80); }
  });

  /* ---------- progress & badges ---------- */
  const BADGES = [
    { n: 1, label: 'מאזינ/ה ראשון/ה' }, { n: 3, label: 'סייר/ת' },
    { n: 6, label: 'חוקר/ת העיר' }, { n: PLACES.length, label: 'מכיר/ה כל פינה' }
  ];
  function markPlayed(id) {
    played.add(id); store.set('played', [...played]); refreshPins(); renderList();
  }
  function curatedPlayed() { return PLACES.filter(p => played.has(p.id)).length; }
  function checkBadges() {
    const n = curatedPlayed(), seen = store.get('badges', []);
    BADGES.forEach(b => { if (n >= b.n && !seen.includes(b.n)) { seen.push(b.n); store.set('badges', seen); toast(`🏅 תג חדש: ${b.label}`); } });
  }
  function renderProgress() {
    const n = curatedPlayed(), tot = PLACES.length, off = 97.4 * (1 - n / tot);
    $('#ring-mini').style.strokeDashoffset = off; $('#ring-big').style.strokeDashoffset = off;
    $('#count').textContent = `${n}/${tot}`;
    $('#pc-title').textContent = n === 0 ? 'התחילו לגלות' : n === tot ? 'גיליתם את כל העיר! 🎉' : `גיליתם ${Math.round(n / tot * 100)}% מהעיר`;
    $('#pc-sub').textContent = `${n} מתוך ${tot} מקומות`;
    $('#badges').innerHTML = BADGES.map(b => `<span class="badge ${n >= b.n ? 'on' : ''}">${b.label}</span>`).join('');
  }

  /* ---------- library ---------- */
  function renderList() {
    renderProgress();
    let rows = allEpisodes().filter(p => filter === 'all' || (filter === 'live' ? p.live : p.category === filter))
      .map(p => ({ p, d: pos ? distance(pos.lat, pos.lng, p.lat, p.lng) : null }));
    if (pos) rows.sort((a, b) => a.d - b.d);
    $('#list').innerHTML = rows.map(({ p, d }) => {
      const c = catOf(p);
      return `<li class="card ${p.id === insideId ? 'card--here' : ''}" data-id="${p.id}">
        <span class="art art--sm">${p.emoji}</span>
        <span class="card__body"><b>${p.title}</b><small>${p.subtitle}</small>
          <span class="card__tags"><i style="--c:${c.color}">${c.label}</i>· ${minutes(p)}</span></span>
        <span class="card__meta">${d == null ? '' : p.id === insideId ? 'אתם כאן' : fmt(d)}${played.has(p.id) ? '<span class="card__check">✓</span>' : ''}</span>
      </li>`;
    }).join('');
  }
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
    const deep = PLACES.find(p => '#' + p.id === location.hash); // shared link
    if (deep) { select(deep); map.setView([deep.lat, deep.lng], 16); openNow(); }
  }

  /* ================= wire up ================= */
  initMap(); renderFilters(); renderList();
  $('#feat-count').textContent = PLACES.length;
  $('#rate-label').textContent = '×' + Narrator.rate;

  $('#btn-start').addEventListener('click', start);
  $('#btn-start-demo').addEventListener('click', () => { start(); toggleDemo(true); });
  $('#mini-play').addEventListener('click', () => { if (!current) { const n = nearest() || PLACES[0]; select(n); } togglePlay(); });
  $('#now-play').addEventListener('click', togglePlay);
  $('#mini-open').addEventListener('click', () => { if (!current) select(nearest() || PLACES[0]); openNow(); });
  $('#now-close').addEventListener('click', closeNow);
  $('#now-share').addEventListener('click', share);
  $('#btn-back').addEventListener('click', () => Narrator.skip(-1));
  $('#btn-fwd').addEventListener('click', () => Narrator.skip(1));
  $('#btn-nav').addEventListener('click', navigate);
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
  $('#btn-install').addEventListener('click', async () => { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; $('#btn-install').hidden = true; } });
  const auto = $('#auto'); auto.checked = autoplay; auto.addEventListener('change', () => { autoplay = auto.checked; store.set('autoplay', autoplay); });
  const ch = $('#chime'); ch.checked = chime; ch.addEventListener('change', () => { chime = ch.checked; store.set('chime', chime); if (chime) playChime(); });
  $('#btn-reset').addEventListener('click', () => { played.clear(); store.set('played', []); store.set('badges', []); refreshPins(); renderList(); toast('ההתקדמות אופסה'); });
  // swipe down to close the player
  let y0 = null; const nowEl = $('#now');
  nowEl.addEventListener('touchstart', e => { y0 = $('.now__scroll').scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
  nowEl.addEventListener('touchend', e => { if (y0 != null && e.changedTouches[0].clientY - y0 > 90) closeNow(); y0 = null; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeNow(); toggleDrawer(false); } if (e.key === ' ' && e.target === document.body) { e.preventDefault(); togglePlay(); } });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
