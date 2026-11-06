/* מקלטים טירת כרמל — איתור המקלט הקרוב, ניווט, שיתוף ופנייה למוקד 106 */
(function () {
  'use strict';

  var SHELTERS = window.SHELTERS || [];
  var STREETS = window.STREETS || {};
  var MOKED_EMAIL = 'moked@tirat-carmel.muni.il';
  var CITY_CENTER = [32.7605, 34.9715];
  var WALK_M_PER_MIN = 80;   // ≈4.8 קמ"ש
  var RUN_M_PER_MIN = 160;   // הליכה מהירה / ריצה קלה
  var ROUTE_FACTOR = 1.3;    // המרחק ברחובות ארוך מקו אווירי
  var TYPE_LABEL = { shelter: 'מקלט / מחסה', protected: 'מיגונית' };

  var state = { me: null, filter: 'all', q: '', hl: null, edit: /[?&]edit=1/.test(location.search) || location.hash === '#edit', fixes: {} };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem('tc-shelters:' + k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('tc-shelters:' + k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  };

  /* ---------- geometry ---------- */
  function haversine(a, b) {
    var R = 6371000, toR = Math.PI / 180;
    var dLat = (b[0] - a[0]) * toR, dLng = (b[1] - a[1]) * toR;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function routeMeters(s) { return state.me && s.lat != null ? haversine([state.me.lat, state.me.lng], [s.lat, s.lng]) * ROUTE_FACTOR : null; }
  function fmtDist(m) { return m < 1000 ? Math.round(m / 10) * 10 + ' מ׳' : (m / 1000).toFixed(1) + ' ק״מ'; }
  function fmtMin(m, speed) { var t = m / speed; return t < 1 ? 'פחות מדקה' : Math.round(t) + ' דק׳'; }
  function streetPoint(name) {
    var lines = STREETS[name] || [], pts = [];
    lines.forEach(function (l) { pts = pts.concat(l); });
    if (!pts.length) return null;
    var c = pts.reduce(function (a, p) { return [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length]; }, [0, 0]);
    return pts.reduce(function (best, p) { return haversine(p, c) < haversine(best, c) ? p : best; }, pts[0]);
  }

  /* ---------- links ---------- */
  function exact(s) { return s.precision === 'landmark' && s.lat != null; }
  function wazeUrl(s) {
    return exact(s) ? 'https://waze.com/ul?ll=' + s.lat + ',' + s.lng + '&navigate=yes'
      : 'https://waze.com/ul?q=' + encodeURIComponent(s.navAddress) + '&navigate=yes';
  }
  function gmapsUrl(s) {
    var dest = exact(s) ? s.lat + ',' + s.lng : s.navAddress;
    var u = 'https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=' + encodeURIComponent(dest);
    if (state.me) u += '&origin=' + state.me.lat.toFixed(6) + ',' + state.me.lng.toFixed(6);
    return u;
  }
  function siteUrl() { return location.href.split('#')[0].replace(/[?&]edit=1/, ''); }
  function navButtons(s, small) {
    var c = small ? ' btn--sm' : '';
    return '<a class="btn btn--waze' + c + '" target="_blank" rel="noopener" href="' + esc(wazeUrl(s)) + '">ניווט בוויז</a>' +
      '<a class="btn btn--gmaps' + c + '" target="_blank" rel="noopener" href="' + esc(gmapsUrl(s)) + '">גוגל מפות</a>';
  }
  function badges(s) {
    var b = '<span class="badge' + (s.type === 'protected' ? ' badge--p' : '') + '">' + TYPE_LABEL[s.type] + '</span>';
    if (/פתיחה מרחוק/.test(s.note)) b += '<span class="badge badge--warn">פתיחה מרחוק</span>';
    if (s.precision === 'street') b += '<span class="badge badge--approx">מיקום משוער במפה</span>';
    if (s.precision === 'none') b += '<span class="badge badge--approx">לא מסומן במפה</span>';
    return '<div class="badges">' + b + '</div>';
  }

  /* ---------- share / copy ---------- */
  function copy(text, onDone) {
    function fallback() {
      var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
      document.body.removeChild(t); onDone && onDone(ok);
    }
    try { navigator.clipboard.writeText(text).then(function () { onDone && onDone(true); }, fallback); } catch (e) { fallback(); }
  }
  function share(title, text, url, btn) {
    var full = text + (url ? '\n' + url : '');
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function (e) { if (e && e.name !== 'AbortError') copy(full, flash(btn)); });
    } else copy(full, flash(btn));
  }
  function flash(btn) {
    return function (ok) {
      if (!btn) return; var old = btn.textContent; btn.textContent = ok ? 'הועתק ✓' : 'לא הועתק'; setTimeout(function () { btn.textContent = old; }, 1800);
    };
  }

  /* ---------- map ---------- */
  var map = null, markers = {}, meMarker = null, routeLine = null;
  function initMap() {
    if (!window.L) { $('.mapwrap').hidden = true; return; }
    map = L.map('map', { zoomControl: true, attributionControl: true }).setView(CITY_CENTER, 15);
    map.attributionControl.setPrefix('Leaflet');
    var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    var fails = 0; tiles.on('tileerror', function () { fails++; });
    // street skeleton: keeps the map readable when tiles are blocked or offline
    Object.keys(STREETS).forEach(function (name) {
      STREETS[name].forEach(function (line) { L.polyline(line, { color: '#8AA2BD', weight: 3, opacity: .55, interactive: false }).addTo(map); });
    });
    var bounds = [];
    SHELTERS.forEach(function (s) {
      if (s.lat == null) return;
      var icon = L.divIcon({ className: '', iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -24],
        html: '<div class="pin pin--' + s.type + (s.precision === 'street' ? ' pin--approx' : '') + '"><span>' + (s.type === 'protected' ? 'מג' : 'מ') + '</span></div>' });
      var m = L.marker([s.lat, s.lng], { icon: icon, title: s.address, draggable: state.edit }).addTo(map);
      m.bindPopup(function () { return popupHtml(s); });
      m.on('click', function () { highlight(s.id, false); });
      if (state.edit) m.on('dragend', function () { var p = m.getLatLng(); state.fixes[s.id] = [+p.lat.toFixed(6), +p.lng.toFixed(6)]; renderEdit(); });
      markers[s.id] = m; bounds.push([s.lat, s.lng]);
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [24, 24] });
    map.on('click', function (e) { if (!state.edit && loc.status !== 'live') setMe(e.latlng.lat, e.latlng.lng, 'map'); });
  }
  function popupHtml(s) {
    var m = routeMeters(s);
    return '<b>' + esc(s.address) + '</b><br>' + esc(s.note) +
      (m != null ? '<br>' + fmtDist(m) + ' · ' + fmtMin(m, WALK_M_PER_MIN) + ' הליכה' : '') +
      '<div class="row">' + navButtons(s, true) + '</div>';
  }
  function drawMe() {
    if (!map || !state.me) return;
    var ll = [state.me.lat, state.me.lng];
    if (!meMarker) meMarker = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [20, 20], iconAnchor: [10, 10] }), zIndexOffset: 1000, title: 'המיקום שלי' }).addTo(map);
    else meMarker.setLatLng(ll);
  }

  /* ---------- location: live tracking + automatic recovery ----------
     watchPosition keeps the position (and the nearest shelter) updated while the resident moves.
     If location is blocked or the phone's location services are off, we show how to turn them on and
     retry by ourselves: when the permission changes, when the resident returns from Settings to the
     tab, and every few seconds while the page is visible. No extra tap needed. */
  var watchId = null, retryTimer = null, lastFixAt = 0, nearestId = null;
  var loc = { wanted: !!store.get('wanted'), status: 'off' };   // off | waiting | live | blocked | unavailable
  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent), isAndroid = /Android/.test(navigator.userAgent);

  function setStatus(msg, err) { var el = $('#locate-status'); el.textContent = msg; el.classList.toggle('is-err', !!err); }
  function setLoc(status) {
    loc.status = status;
    $('#live').hidden = status !== 'live' && status !== 'waiting';
    $('#live').classList.toggle('is-wait', status === 'waiting');
    if (status === 'waiting') $('#live-text').textContent = 'מחפש מיקום…';
    $('#loc-help').hidden = !(status === 'blocked' || status === 'unavailable');
    if (status === 'blocked' || status === 'unavailable') renderHelp(status);
    $('#btn-locate-label').textContent = status === 'live' ? 'מרכוז המפה עליי' : 'מצא את המקלט הקרוב אליי';
    scheduleRetry();
  }
  function setMe(lat, lng, src, acc) {
    var first = !state.me || state.me.src !== src;
    state.me = { lat: lat, lng: lng, src: src, acc: acc };
    var far = haversine([lat, lng], CITY_CENTER) > 6000;
    if (src !== 'gps') { stopWatch(); setLoc('off'); }
    setStatus(src === 'gps' ? ('המיקום מתעדכן אוטומטית' + (acc ? ' (דיוק כ-' + Math.round(acc) + ' מ׳)' : '') + (far ? '. נראה שאתם מחוץ לטירת כרמל.' : '.'))
      : src === 'street' ? 'מחושב לפי אמצע הרחוב שבחרתם.' : 'מחושב לפי הנקודה שסימנתם במפה.', far);
    drawMe();
    var top = ranked()[0], changed = top && top.s.id !== nearestId;
    if (changed && nearestId != null && src === 'gps') { setStatus('המקלט הקרוב התעדכן לפי המיקום החדש שלך.'); try { navigator.vibrate && navigator.vibrate(80); } catch (e) { } }
    nearestId = top ? top.s.id : null;
    renderNearest(first || changed, first); renderList();
  }
  function onFix(p) {
    lastFixAt = Date.now();
    if (loc.status !== 'live') setLoc('live');
    var c = p.coords;
    if (!state.me || state.me.src !== 'gps' || haversine([state.me.lat, state.me.lng], [c.latitude, c.longitude]) > 15) setMe(c.latitude, c.longitude, 'gps', c.accuracy);
    else state.me.acc = c.accuracy;
    tickLive();
  }
  function onErr(e) {
    if (e.code === 1) { stopWatch(); setLoc('blocked'); setStatus('שיתוף המיקום כבוי. ההוראות להפעלה מופיעות למטה, והאתר יתעדכן לבד ברגע שתפעילו.', true); }
    else if (e.code === 2) { stopWatch(); setLoc('unavailable'); setStatus('שירותי המיקום בטלפון כבויים או שאין קליטה. הפעילו מיקום והאתר יתעדכן לבד.', true); }
    else if (loc.status !== 'live') setStatus('עדיין מחפש מיקום… אפשר בינתיים לבחור רחוב או להקיש על המפה.');
  }
  function startWatch(fromUser) {
    if (!('geolocation' in navigator)) { setStatus('הדפדפן לא תומך בשיתוף מיקום. בחרו רחוב או הקישו על המפה.', true); return; }
    if (fromUser) { loc.wanted = true; store.set('wanted', true); }
    if (watchId != null) { if (fromUser && state.me && map) map.setView([state.me.lat, state.me.lng], 17); return; }
    if (loc.status !== 'live') { setLoc('waiting'); if (fromUser) setStatus('מאתר את המיקום שלך…'); }
    watchId = navigator.geolocation.watchPosition(onFix, onErr, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
  }
  function stopWatch() { if (watchId != null) { navigator.geolocation.clearWatch(watchId); watchId = null; } }
  function permState(cb) {
    try { navigator.permissions.query({ name: 'geolocation' }).then(function (p) { cb(p.state, p); }, function () { cb('unknown'); }); }
    catch (e) { cb('unknown'); }
  }
  // retry quietly while blocked/unavailable, without re-prompting the resident in a loop
  function scheduleRetry() {
    clearInterval(retryTimer); retryTimer = null;
    if (loc.status !== 'blocked' && loc.status !== 'unavailable') return;
    retryTimer = setInterval(function () {
      if (document.hidden) return;
      permState(function (st) {
        if (st === 'granted' || (loc.status === 'unavailable' && st !== 'denied')) startWatch(false);
      });
    }, 4000);
  }
  function tickLive() {
    if (loc.status !== 'live') return;
    var sec = Math.round((Date.now() - lastFixAt) / 1000);
    $('#live-text').textContent = 'מעקב מיקום חי · עודכן ' + (sec < 5 ? 'עכשיו' : 'לפני ' + (sec < 60 ? sec + ' שנ׳' : Math.round(sec / 60) + ' דק׳')) +
      (state.me && state.me.acc ? ' · דיוק ' + Math.round(state.me.acc) + ' מ׳' : '');
  }
  function renderHelp(status) {
    var steps;
    if (isIOS) steps = status === 'unavailable'
      ? ['פתחו <b>הגדרות</b> ← <b>פרטיות ואבטחה</b> ← <b>שירותי מיקום</b> והפעילו.', 'באותו מסך גללו ל-<b>Safari</b> (או לדפדפן שלכם) ובחרו <b>בזמן השימוש ביישום</b>.', 'חזרו לכאן. האתר יתעדכן לבד.']
      : ['הקישו על <b>אא</b> או על סמל המנעול בשורת הכתובת ← <b>הגדרות אתר</b> ← <b>מיקום</b> ← <b>אפשר</b>.', 'אם אין אפשרות כזו: <b>הגדרות</b> ← <b>Safari</b> ← <b>מיקום</b> ← <b>שאל</b> או <b>אפשר</b>.', 'חזרו לכאן. האתר יתעדכן לבד.'];
    else if (isAndroid) steps = status === 'unavailable'
      ? ['משכו את סרגל ההתראות מלמעלה והקישו על <b>מיקום</b> כדי להפעיל.', 'חזרו לכאן. האתר יתעדכן לבד.']
      : ['הקישו על סמל המנעול או ההגדרות ליד כתובת האתר ← <b>הרשאות</b> ← <b>מיקום</b> ← <b>אפשר</b>.', 'אם המיקום בטלפון כבוי: משכו את סרגל ההתראות והפעילו <b>מיקום</b>.', 'חזרו לכאן. האתר יתעדכן לבד.'];
    else steps = ['לחצו על סמל המנעול ליד כתובת האתר ← <b>מיקום</b> ← <b>אפשר</b>.', 'ודאו ששירותי המיקום מופעלים במחשב.', 'האתר יתעדכן לבד.'];
    $('#loc-help-title').textContent = status === 'unavailable' ? 'איך מפעילים שירותי מיקום בטלפון' : 'איך מאשרים לאתר את המיקום';
    $('#loc-help-steps').innerHTML = steps.map(function (x) { return '<li>' + x + '</li>'; }).join('');
  }
  function initLocation() {
    $('#btn-locate').onclick = function () { startWatch(true); };
    $('#live-stop').onclick = function () { stopWatch(); loc.wanted = false; store.set('wanted', false); setLoc('off'); setStatus('המעקב הופסק. אפשר להפעיל שוב בכל רגע.'); };
    $('#loc-retry').onclick = function () { stopWatch(); startWatch(true); };
    setInterval(tickLive, 5000);
    permState(function (st, p) {
      if (st === 'granted' || (st === 'prompt' && loc.wanted)) startWatch(false);
      else if (st === 'denied' && loc.wanted) setLoc('blocked');
      if (p) p.onchange = function () {   // resident changed the permission (e.g. in site settings)
        if (p.state === 'granted') { stopWatch(); startWatch(false); }
        else if (p.state === 'denied') { stopWatch(); setLoc('blocked'); }
      };
    });
    // coming back from the phone's Settings app: try again immediately
    function onReturn() {
      if (document.hidden || !loc.wanted) return;
      if (loc.status === 'blocked' || loc.status === 'unavailable' || loc.status === 'off' && !state.me) { stopWatch(); startWatch(false); }
    }
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    window.addEventListener('pageshow', onReturn);
  }
  function locate() { startWatch(true); }

  /* ---------- nearest ---------- */
  function ranked() {
    return SHELTERS.filter(function (s) { return s.lat != null; })
      .map(function (s) { return { s: s, m: routeMeters(s) }; })
      .sort(function (a, b) { return a.m - b.m; });
  }
  function renderNearest(fly, scroll) {
    var box = $('#nearest');
    if (!state.me) { box.hidden = true; return; }
    var r = ranked(), top = r[0]; if (!top) return;
    var s = top.s;
    box.innerHTML =
      '<div class="nearest__eyebrow">המרחב המוגן הקרוב אליך</div>' +
      '<div class="nearest__addr">' + esc(s.address) + '</div>' +
      '<div class="nearest__note">' + esc(s.note) + '</div>' + badges(s) +
      '<div class="eta"><div><b>' + fmtMin(top.m, WALK_M_PER_MIN) + '</b><span>בהליכה</span></div>' +
      '<div><b>' + fmtMin(top.m, RUN_M_PER_MIN) + '</b><span>בהליכה מהירה</span></div>' +
      '<div><b>' + fmtDist(top.m) + '</b><span>מרחק משוער</span></div></div>' +
      '<div class="row">' + navButtons(s) + '<button class="btn" type="button" id="share-nearest">שיתוף</button></div>' +
      '<div class="nearest__more"><span class="muted">קרובים נוספים:</span>' +
      r.slice(1, 4).map(function (x) {
        return '<button type="button" data-id="' + x.s.id + '">' + esc(x.s.address) + ' · ' + TYPE_LABEL[x.s.type] + ' · ' + fmtDist(x.m) + ' (' + fmtMin(x.m, WALK_M_PER_MIN) + ')</button>';
      }).join('') + '</div>';
    box.hidden = false;
    $('#share-nearest').onclick = function () {
      share('המקלט הקרוב', 'המקלט הקרוב: ' + s.address + ' — ' + s.note + '\nניווט בוויז: ' + wazeUrl(s) + '\nגוגל מפות: ' + gmapsUrl(s), siteUrl(), this);
    };
    box.querySelectorAll('.nearest__more button').forEach(function (b) { b.onclick = function () { highlight(+b.dataset.id, true); }; });
    if (map) {
      if (routeLine) map.removeLayer(routeLine);
      routeLine = L.polyline([[state.me.lat, state.me.lng], [s.lat, s.lng]], { color: '#E2462F', weight: 4, dashArray: '6 8' }).addTo(map);
      if (fly) map.fitBounds(routeLine.getBounds(), { padding: [60, 60], maxZoom: 17 });
    }
    if (scroll && window.innerWidth < 960) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- list ---------- */
  function renderList() {
    var q = state.q.trim();
    var rows = SHELTERS.map(function (s) { return { s: s, m: routeMeters(s) }; })
      .filter(function (x) { return state.filter === 'all' || x.s.type === state.filter; })
      .filter(function (x) { return !q || (x.s.address + ' ' + x.s.note).indexOf(q) !== -1; });
    if (state.me) rows.sort(function (a, b) { return (a.m == null ? 1e9 : a.m) - (b.m == null ? 1e9 : b.m); });
    $('#list').innerHTML = rows.length ? rows.map(function (x) {
      var s = x.s;
      return '<li class="item' + (state.hl === s.id ? ' is-hl' : '') + '" data-type="' + s.type + '" id="s-' + s.id + '">' +
        '<div class="item__top"><span class="item__addr" data-id="' + s.id + '" role="button" tabindex="0">' + esc(s.address) + '</span>' +
        (x.m != null ? '<span class="item__dist">' + fmtDist(x.m) + ' · ' + fmtMin(x.m, WALK_M_PER_MIN) + '</span>' : '') + '</div>' +
        '<div class="item__note">' + esc(s.note) + '</div>' + badges(s) +
        '<div class="row">' + navButtons(s, true) + '</div></li>';
    }).join('') : '<li class="empty">לא נמצאו תוצאות.</li>';
    ['all', 'shelter', 'protected'].forEach(function (t) {
      $('#c-' + t).textContent = SHELTERS.filter(function (s) { return t === 'all' || s.type === t; }).length;
    });
  }
  function highlight(id, scrollToItem) {
    state.hl = id; renderList();
    var s = SHELTERS.find(function (x) { return x.id === id; });
    if (map && s && s.lat != null && markers[id]) { map.setView([s.lat, s.lng], Math.max(map.getZoom(), 17)); markers[id].openPopup(); }
    if (scrollToItem) { var el = document.getElementById('s-' + id); if (el && window.innerWidth >= 960) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    if (window.innerWidth < 960 && map) $('#map').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------- 106 form ---------- */
  function buildReport() {
    var sid = $('#f-shelter').value, s = SHELTERS.find(function (x) { return String(x.id) === sid; });
    var lines = [
      'פנייה למוקד 106 — עיריית טירת כרמל',
      'נושא: ' + $('#f-topic').value,
      'שם: ' + $('#f-name').value.trim(),
      'טלפון: ' + $('#f-phone').value.trim()
    ];
    if (s) lines.push('מקלט / מיגונית: ' + s.address + ' (' + s.note + ')');
    lines.push('', 'פירוט:', $('#f-msg').value.trim());
    if ($('#f-loc').checked && state.me) lines.push('', 'מיקום הפונה: https://maps.google.com/?q=' + state.me.lat.toFixed(6) + ',' + state.me.lng.toFixed(6));
    lines.push('', 'נשלח מאתר המקלטים של טירת כרמל');
    return { subject: 'פנייה למוקד 106: ' + $('#f-topic').value + (s ? ' — ' + s.address : ''), body: lines.join('\n') };
  }
  function initForm() {
    var sel = $('#f-shelter');
    SHELTERS.forEach(function (s) { var o = document.createElement('option'); o.value = s.id; o.textContent = s.address + ' — ' + TYPE_LABEL[s.type]; sel.appendChild(o); });
    var saved = store.get('contact'); if (saved) { $('#f-name').value = saved.name || ''; $('#f-phone').value = saved.phone || ''; }
    $('#f106').addEventListener('submit', function (e) {
      e.preventDefault();
      var miss = ['#f-name', '#f-phone', '#f-msg'].filter(function (id) { return !$(id).value.trim(); });
      if (miss.length) { $('#f-status').textContent = 'יש למלא שם, טלפון ופירוט הפנייה.'; $(miss[0]).focus(); return; }
      
      store.set('contact', { name: $('#f-name').value, phone: $('#f-phone').value });
      var r = buildReport();
      location.href = 'mailto:' + MOKED_EMAIL + '?subject=' + encodeURIComponent(r.subject) + '&body=' + encodeURIComponent(r.body);
      $('#f-status').textContent = 'אפליקציית הדוא״ל אמורה להיפתח עם הפנייה מוכנה, ושם לוחצים „שלח". אם היא לא נפתחה, העתיקו את הפנייה ושלחו ל-' + MOKED_EMAIL + '.';
    });
    $('#f-copy').onclick = function () { var r = buildReport(); copy('אל: ' + MOKED_EMAIL + '\n' + r.subject + '\n\n' + r.body, flash(this)); };
    $('#f-loc').addEventListener('change', function () { if (this.checked && !state.me) locate(); });
  }

  /* ---------- edit mode (for the security dept. to pin exact locations) ---------- */
  function renderEdit() {
    $('#edit-out').value = JSON.stringify(state.fixes);
  }

  /* ---------- boot ---------- */
  function init() {
    // street picker
    var names = {}; SHELTERS.forEach(function (s) { var base = s.navAddress.split(',')[0].replace(/\s+\d+$/, ''); names[base] = 1; });
    Object.keys(STREETS).concat(Object.keys(names)).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a.localeCompare(b, 'he'); })
      .forEach(function (n) { if (!streetPoint(n) && !SHELTERS.some(function (s) { return s.navAddress.indexOf(n) === 0 && s.lat != null; })) return;
        var o = document.createElement('option'); o.value = n; o.textContent = n; $('#street-pick').appendChild(o); });
    $('#street-pick').addEventListener('change', function () {
      var n = this.value; if (!n) return;
      var p = streetPoint(n);
      if (!p) { var s = SHELTERS.find(function (x) { return x.navAddress.indexOf(n) === 0 && x.lat != null; }); if (s) p = [s.lat, s.lng]; }
      if (p) setMe(p[0], p[1], 'street');
    });

    initMap(); renderList(); initForm();

    initLocation();
    $('#q').addEventListener('input', function () { state.q = this.value; renderList(); });
    document.querySelectorAll('.tab').forEach(function (t) {
      t.onclick = function () {
        document.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-selected', 'false'); });
        t.classList.add('is-on'); t.setAttribute('aria-selected', 'true'); state.filter = t.dataset.f; renderList();
      };
    });
    $('#list').addEventListener('click', function (e) { var a = e.target.closest('.item__addr'); if (a) highlight(+a.dataset.id, false); });
    $('#list').addEventListener('keydown', function (e) { var a = e.target.closest('.item__addr'); if (a && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); highlight(+a.dataset.id, false); } });

    var shareText = 'רשימת המקלטים והמיגוניות בטירת כרמל, עם המקלט הקרוב אליך וניווט בוויז';
    $('#share-site').onclick = function () { share('מקלטים טירת כרמל', shareText, siteUrl(), this); };
    $('#wa-site').href = 'https://wa.me/?text=' + encodeURIComponent(shareText + '\n' + siteUrl());
    $('#share-me').onclick = function () {
      var btn = this;
      if (!state.me) { locate(); setStatus('מאתר מיקום… לחצו שוב על „שיתוף המיקום שלי" אחרי שהמיקום יופיע.'); return; }
      share('המיקום שלי', 'המיקום שלי עכשיו: https://maps.google.com/?q=' + state.me.lat.toFixed(6) + ',' + state.me.lng.toFixed(6), '', btn);
    };

    if (state.edit) { $('#edit-bar').hidden = false; renderEdit(); $('#edit-copy').onclick = function () { copy($('#edit-out').value, flash(this)); }; }


    if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude\.ai|claudeusercontent/.test(location.hostname)) {
      navigator.serviceWorker.register('sw.js').catch(function () { });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
