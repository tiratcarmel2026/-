/* podtc — extra podcast-app elements and "liveliness":
 * recently played · editors' top 10 · browse by topic · short episodes · "your podtc" summary
 * global search · player waveform, up next, more in this topic, sleep timer
 * now-playing marks on covers, reveal-on-scroll motion. */
(function () {
  const A = window.PodApp, N = window.Narrator; if (!A || !N) return;
  const $ = s => document.querySelector(s);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const byId = id => A.PLACES.find(p => p.id === id);
  const words = ep => ep.script.split(/\s+/).length;
  const playIc = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  const exc = (ep, n) => { const t = ep.script.replace(/\s+/g, ' '); return t.length > n ? t.slice(0, t.lastIndexOf(' ', n)) + '…' : t; };
  const tile = (ep, meta, extra = '') => `<div class="tile" data-ep="${ep.id}" style="--c:${A.catOf(ep).color}">${extra}
      <button class="tile__art" data-x="open" data-id="${ep.id}" aria-label="${esc(ep.title)}">${PodCovers.html(ep)}<span class="tile__live" aria-hidden="true"><i></i><i></i><i></i></span></button>
      <button class="tile__play" data-x="listen" data-id="${ep.id}" aria-label="האזנה: ${esc(ep.title)}">${playIc}</button>
      <span class="tile__k">${A.catOf(ep).label}</span><b class="tile__t">${esc(ep.title)}</b><span class="tile__x">${esc(ep.subtitle)}. ${esc(exc(ep, 95))}</span><small class="tile__m">${meta || A.minutes(ep)}</small></div>`;

  /* ================= home shelves ================= */
  function recent() {
    const h = A.history().slice(0, 10);
    $('#recent-block').hidden = !h.length;
    $('#recent').innerHTML = h.map(ep => tile(ep, `${A.catOf(ep).label} · נשמע`)).join('');
  }
  const TOP = ['em-habanim', 'ein-kedem', 'gene-simmons', 'old-core', 'fire-2010', 'summer-1948', 'hai-bar', 'maabara', 'metronit', 'shnot-80'];
  function top10() {
    $('#top10').innerHTML = TOP.map(byId).filter(Boolean).map((ep, i) =>
      `<div class="rank"><span class="rank__n" aria-hidden="true">${i + 1}</span>${tile(ep)}</div>`).join('');
  }
  const ORDER = ['history', 'heritage', 'memory', 'nature', 'trails', 'community', 'culture', 'sport', 'city', 'future', 'transport'];
  function browse() {
    $('#browse').innerHTML = ORDER.filter(k => A.CATS[k] && A.PLACES.some(p => p.category === k)).map(k => {
      const eps = A.PLACES.filter(p => p.category === k), done = eps.filter(p => A.played.has(p.id)).length;
      return `<button class="genre" data-x="genre" data-id="${k}" style="--c:${A.CATS[k].color}">
        <b>${esc(A.CATS[k].label)}</b><small>${eps.length} פרקים${done ? ` · ${done} נשמעו` : ''}</small>
        <span class="genre__art">${PodCovers.html(eps[0])}</span><span class="genre__ic">${PodIcons.cat(k, 22)}</span></button>`;
    }).join('');
  }
  function shorts() {
    $('#shorts').innerHTML = A.PLACES.slice().sort((a, b) => words(a) - words(b)).slice(0, 10).map(ep => tile(ep, `${A.minutes(ep)} · ${A.catOf(ep).label}`)).join('');
  }
  function wrapped() {
    const heard = A.PLACES.filter(p => A.played.has(p.id));
    const mins = Math.round(heard.reduce((m, p) => m + words(p) / 120, 0));
    const byCat = {}; heard.forEach(p => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
    const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    const pct = Math.round(heard.length / A.PLACES.length * 100);
    $('#wrapped').innerHTML = `<div class="wrap">
      <div class="wrap__head"><span class="wrap__kick">ה־podtc שלכם</span>
        <h2>${heard.length ? `גיליתם ${pct}% מטירת כרמל` : 'הסיפור שלכם בטירת כרמל מתחיל כאן'}</h2>
        <p>${heard.length ? (topCat ? `הנושא שהכי מעניין אתכם: <b>${esc(A.CATS[topCat[0]].label)}</b>` : '') : 'כל פרק שתשמעו ייכנס לכאן: דקות האזנה, נושאים, רצף ונקודות'}</p></div>
      <div class="wrap__stats">
        <div><b>${heard.length}</b><span>פרקים</span></div>
        <div><b>${mins}</b><span>דקות האזנה</span></div>
        <div><b>${A.streak()}</b><span>ימי רצף</span></div>
        <div><b>${A.points()}</b><span>נקודות</span></div>
      </div>
      <div class="wrap__bar"><i style="width:${pct}%"></i></div>
    </div>`;
  }
  function renderHome() { recent(); top10(); browse(); shorts(); wrapped(); markPlaying(); }
  let t = 0;
  A.onUpdate(() => { clearTimeout(t); t = setTimeout(renderHome, 300); });

  /* clicks inside the new blocks */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    const ep = byId(b.dataset.id);
    switch (b.dataset.x) {
      case 'open': if (ep) { A.select(ep); A.openNow(); } break;
      case 'listen': if (ep) A.listen(ep); break;
      case 'genre': { const sh = document.getElementById('shelf-' + b.dataset.id); if (sh) sh.scrollIntoView({ behavior: 'smooth', block: 'start' }); break; }
      case 'search-hit': closeSearch(); if (ep) { A.select(ep); A.openNow(); } break;
      case 'share': openShare(ep); break;
      case 'art-ep': if (ep) A.listen(ep); break;
      case 'search-cat': $('#gsearch').value = A.CATS[b.dataset.id].label; runSearch(); break;
    }
  });

  /* ================= global search ================= */
  function openSearch() {
    $('#search-sheet').hidden = false; document.body.classList.add('searching');
    $('#gsearch-chips').innerHTML = ORDER.filter(k => A.CATS[k]).map(k => `<button class="schip" data-x="search-cat" data-id="${k}">${esc(A.CATS[k].label)}</button>`).join('');
    runSearch(); setTimeout(() => $('#gsearch').focus(), 50);
  }
  function closeSearch() { $('#search-sheet').hidden = true; document.body.classList.remove('searching'); }
  function runSearch() {
    const q = $('#gsearch').value.trim();
    const hits = A.PLACES.filter(p => !q || [p.title, p.subtitle, p.script, A.catOf(p).label].some(x => x && x.includes(q))).slice(0, 30);
    $('#gsearch-res').innerHTML = (q ? `<p class="search-count">${hits.length} תוצאות</p>` : '<p class="search-count">כל הפרקים</p>') +
      hits.map(p => `<button class="srow" data-x="search-hit" data-id="${p.id}"><span class="srow__art">${PodCovers.html(p)}</span>
        <span class="srow__t"><b>${esc(p.title)}</b><small>${esc(A.catOf(p).label)} · ${A.minutes(p)}${A.played.has(p.id) ? ' · נשמע' : ''}</small></span></button>`).join('') +
      (hits.length ? '' : '<p class="search-empty">לא נמצאו פרקים. נסו מילה אחרת.</p>');
  }
  $('#btn-search').addEventListener('click', openSearch);
  $('#search-close').addEventListener('click', closeSearch);
  $('#gsearch').addEventListener('input', runSearch);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#search-sheet').hidden) closeSearch(); if (e.key === '/' && e.target === document.body) { e.preventDefault(); openSearch(); } });

  /* ================= player: waveform, up next, related, sleep timer ================= */
  const BARS = 48;
  function wave(ep) {
    let h = 0; for (const ch of ep.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => (h = (h * 1103515245 + 12345) >>> 0) / 4294967296;
    $('#wave').innerHTML = Array.from({ length: BARS }, (_, i) => {
      const env = Math.sin(Math.PI * (i + .5) / BARS) * .55 + .45;          // louder in the middle, like speech
      return `<i style="height:${Math.round((20 + rnd() * 80) * env)}%"></i>`;
    }).join('') + '<span class="wave__tip" id="wave-tip" hidden></span>';
    paintWave(0);
  }
  function paintWave(f) { const n = Math.round(f * BARS); $('#wave').querySelectorAll('i').forEach((b, i) => b.classList.toggle('on', i < n)); }
  N.on('progress', paintWave);
  /* ---- interactive player ---- */
  const spans = () => document.querySelectorAll('#transcript span[data-i]');
  const active = () => ['playing', 'paused', 'skipping'].includes(N.state);
  const totalSec = () => { const c = A.current; if (!c || !c.script) return 0; return c.script.split(/\s+/).length / 120 * 60 / (N.rate || 1); };
  const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  let frac = 0;
  function setTime(f) {
    frac = f; const T = totalSec();
    $('#np-el').textContent = fmt(f * T); $('#np-rem').textContent = fmt((1 - f) * T) + '-';
    $('#wave').setAttribute('aria-valuenow', Math.round(f * 100)); $('#wave').setAttribute('aria-valuetext', `${fmt(f * T)} מתוך ${fmt(T)}`);
  }
  N.on('progress', setTime);
  const seekTo = f => {
    const total = spans().length || 1, i = Math.min(total - 1, Math.max(0, Math.floor(f * total)));
    if (active()) N.seek(i); else { A.play(); setTimeout(() => N.seek(i), 80); }
    paintWave(i / total); setTime(i / total);
  };
  const fracAt = x => { const r = $('#wave').getBoundingClientRect(); return Math.min(1, Math.max(0, (r.right - x) / r.width)); }; // RTL
  function tipAt(f, x) {
    const tip = $('#wave-tip'); if (!tip) return;
    const sp = spans()[Math.min(spans().length - 1, Math.floor(f * spans().length))];
    tip.hidden = false; tip.textContent = `${fmt(f * totalSec())} · ${sp ? sp.textContent.trim().slice(0, 42) + '…' : ''}`;
    const r = $('#wave').getBoundingClientRect(); tip.style.left = Math.min(r.width - 40, Math.max(40, x - r.left)) + 'px';
  }
  let drag = false;
  $('#wave').addEventListener('pointerdown', e => { drag = true; $('#wave').setPointerCapture(e.pointerId); $('#wave').classList.add('drag'); const f = fracAt(e.clientX); paintWave(f); tipAt(f, e.clientX); });
  $('#wave').addEventListener('pointermove', e => { const f = fracAt(e.clientX); if (drag) paintWave(f); if (drag || e.pointerType === 'mouse') tipAt(f, e.clientX); });
  $('#wave').addEventListener('pointerup', e => { if (!drag) return; drag = false; $('#wave').classList.remove('drag'); $('#wave-tip').hidden = true; seekTo(fracAt(e.clientX)); });
  $('#wave').addEventListener('pointerleave', () => { if (!drag && $('#wave-tip')) $('#wave-tip').hidden = true; });
  $('#wave').addEventListener('keydown', e => {
    const n = spans().length || 1, cur = Math.floor(frac * n);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); seekTo(Math.min(n - 1, cur + 1) / n + .001); }       // RTL: left = forward
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); seekTo(Math.max(0, cur - 1) / n + .001); }
    else if (e.key === 'Home') { e.preventDefault(); seekTo(0); } else if (e.key === 'End') { e.preventDefault(); seekTo((n - 1) / n); }
  });
  // live captions: the sentence being read, big, under the artwork
  N.on('chunk', i => {
    const sp = spans()[i], cap = $('#np-cap'); if (!cap) return;
    cap.classList.remove('in'); void cap.offsetWidth; cap.textContent = sp ? sp.textContent.trim() : ''; cap.classList.add('in');
    $('#np-chap').textContent = spans().length ? `משפט ${i + 1} מתוך ${spans().length}` : '';
  });
  // speed chips
  function paintRate() { document.querySelectorAll('.np-speed [data-rate]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.rate === N.rate))); }
  document.querySelector('.np-speed').addEventListener('click', e => {
    const b = e.target.closest('[data-rate]'); if (!b) return;
    N.setRate(+b.dataset.rate); $('#rate-label').textContent = '×' + b.dataset.rate; paintRate(); setTime(frac);
    if (A.current) $('#now-dur').textContent = A.minutes(A.current);
  });
  $('#btn-rate').addEventListener('click', () => setTimeout(paintRate, 0));
  paintRate();
  // swipe the artwork for the next / previous episode, double-tap to like
  function neighbour(d) {
    const c = A.current; if (!c) return null;
    const list = A.PLACES.filter(p => p.category === c.category); const pool = list.length > 1 ? list : A.PLACES;
    const i = pool.findIndex(p => p.id === c.id); return pool[(i + d + pool.length) % pool.length];
  }
  function go(d) { const n = neighbour(d); if (!n) return; const box = $('#now-artbox'); box.classList.remove('sw-l', 'sw-r'); void box.offsetWidth; box.classList.add(d > 0 ? 'sw-l' : 'sw-r'); A.select(n); A.play(); }
  let sx = 0, sy = 0, lastTap = 0;
  const box = $('#now-artbox');
  box.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
  box.addEventListener('pointerup', e => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { go(dx < 0 ? 1 : -1); return; }   // RTL: swipe left → next
    const now = Date.now();
    if (now - lastTap < 320) { like(); lastTap = 0; } else lastTap = now;
  });
  function like() {
    const fav = $('#now-fav'); if (!fav.classList.contains('on')) fav.click();
    const b = box.querySelector('.np-burst'); b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
  }
  // keyboard shortcuts while the player is open
  document.addEventListener('keydown', e => {
    if (!$('#now').classList.contains('open') || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target === $('#wave')) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft') { e.preventDefault(); N.skip(1); } else if (k === 'arrowright') { e.preventDefault(); N.skip(-1); }
    else if (k === 'n' || k === 'מ') go(1); else if (k === 'p' || k === 'פ') go(-1);
    else if (k === 'l' || k === 'ך') like();
    else if (k === ' ' && e.target !== document.body && e.target.tagName !== 'BUTTON') { e.preventDefault(); A.toggle ? A.toggle() : $('#now-play').click(); }
  });
  // mini player: tap / drag on its progress bar to seek
  const mb = document.querySelector('.mini__bar');
  if (mb) {
    mb.setAttribute('role', 'slider'); mb.setAttribute('aria-label', 'מיקום בפרק'); mb.tabIndex = 0;
    mb.addEventListener('click', e => { e.stopPropagation(); const r = mb.getBoundingClientRect(); seekTo(Math.min(1, Math.max(0, (r.right - e.clientX) / r.width))); });
  }
  function related(ep) {
    const box = $('#related');
    if (!ep || !ep.category || ep.id === 'briefing') { box.innerHTML = ''; return; }
    const more = A.PLACES.filter(p => p.category === ep.category && p.id !== ep.id).slice(0, 8);
    box.innerHTML = more.length ? `<h3>עוד ב${esc(A.catOf(ep).label)}</h3><div class="shelf__row shelf__row--sm">${more.map(p => tile(p, A.minutes(p))).join('')}</div>` : '';
  }
  function upnext() {
    const q = A.queue.map(byId).filter(Boolean), box = $('#upnext');
    box.hidden = !q.length;
    box.innerHTML = q.length ? `<h3>הבא בתור · ${esc(A.queueName)}</h3>${q.slice(0, 5).map((p, i) => `<button class="srow" data-x="open" data-id="${p.id}">
      <span class="srow__n">${i + 1}</span><span class="srow__art">${PodCovers.html(p)}</span><span class="srow__t"><b>${esc(p.title)}</b><small>${A.minutes(p)}</small></span></button>`).join('')}` : '';
  }
  window.addEventListener('pod:select', e => { wave(e.detail); setTime(0); if ($('#np-cap')) $('#np-cap').textContent = ''; $('#np-chap').textContent = ''; related(e.detail); setTimeout(upnext, 0); markPlaying(); });
  N.on('state', s => { upnext(); markPlaying(); if (s === 'ended' && sleepEnd) { sleepEnd = false; setSleep(0); const c = A.current; if (c) A.select(c); A.toast('לילה טוב! הטיימר עצר אחרי הפרק'); } });

  let sleepT = 0, sleepEnd = false, sleepIdx = 0;
  const SLEEP = [0, 10, 20, 30, 'end'];
  function setSleep(v) {
    clearTimeout(sleepT); sleepEnd = false;
    if (v === 'end') { sleepEnd = true; $('#sleep-label').textContent = 'עד סוף הפרק'; }
    else if (v) { sleepT = setTimeout(() => { N.pause(); A.toast('הטיימר עצר את ההאזנה'); setSleep(0); sleepIdx = 0; }, v * 60000); $('#sleep-label').textContent = `${v} דק׳`; }
    else $('#sleep-label').textContent = 'טיימר שינה';
  }
  $('#btn-sleep').addEventListener('click', () => {
    sleepIdx = (sleepIdx + 1) % SLEEP.length; const v = SLEEP[sleepIdx]; setSleep(v);
    A.toast(v === 'end' ? 'ההאזנה תיעצר בסוף הפרק' : v ? `ההאזנה תיעצר בעוד ${v} דקות` : 'טיימר השינה בוטל');
  });

  /* ================= liveliness ================= */
  // the episode that's playing pulses on every cover where it appears
  function markPlaying() {
    const id = A.current && A.current.id, on = N.state === 'playing' || N.state === 'skipping';
    document.querySelectorAll('.tile.is-playing').forEach(t => t.classList.remove('is-playing'));
    if (id && on) document.querySelectorAll(`.tile[data-ep="${id}"], .tile__art[data-id="${id}"]`).forEach(el => (el.closest('.tile') || el).classList.add('is-playing'));
  }
  // sections rise into view as you scroll
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }),
    { root: $('#home'), rootMargin: '0px 0px -8% 0px', threshold: .05 }) : null;
  function animateIn() { document.querySelectorAll('#home .shelf:not(.rise), #home .block:not(.rise), #home .hero:not(.rise)').forEach(el => { el.classList.add('rise'); io ? io.observe(el) : el.classList.add('in'); }); }

  /* ================= current articles ================= */
  // hand-picked recent coverage (always shown) + live headlines from the web when they load
  const PICKS = window.PODTC_ARTICLES || [
    { title: 'פי 3 תושבים וחוף ים: תוכנית המתאר של טירת כרמל אושרה', src: 'מרכז הנדל"ן', link: 'https://www.nadlancenter.co.il/article/8168', ep: 'beach-plan' },
    { title: '1,200 דירות בטירת כרמל: אושרה תוכנית הענק של נופי רוממה וצמח המרמן', src: 'מרכז הנדל"ן', link: 'https://www.nadlancenter.co.il/article/15566', ep: 'weizmann-towers' },
    { title: 'תושבי הצפון נוהרים לרחוב שיהפוך לדיזנגוף', src: 'מעריב', link: 'https://www.maariv.co.il/economy/realestate/article-1350591', ep: 'herzl-street' },
    { title: 'למי קראתם פרבר? העיר שהפכה מתחת לרדאר ללהיט של הצפון', src: 'מעריב', link: 'https://www.maariv.co.il/economy/realestate/article-1211715', ep: 'nof-yam' },
    { title: 'מגדלים בטירת כרמל: תוכניות התחדשות ליותר מ־1,800 דירות יגיעו לדיון על הפקדה', src: 'מרכז הנדל"ן', link: 'https://www.nadlancenter.co.il/article/11512', ep: 'city-renewal' }
  ];
  const SRC_C = ['#1557A8', '#2563EB', '#1E6FC2', '#0A6E9E', '#12407A', '#2A8AD6', '#0E86B8', '#123E7C'];
  const srcColor = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return SRC_C[h % SRC_C.length]; };
  function articles() {
    const live = (window.PodNews || []).slice(0, 6).map(n => ({ ...n, live: true }));
    const list = [...live, ...PICKS].slice(0, 9);
    $('#articles').innerHTML = list.map((a, i) => {
      const ep = a.ep && byId(a.ep), c = ep ? A.catOf(ep).color : srcColor(a.src);
      return `<article class="art${i === 0 ? ' art--lead' : ''}" style="--c:${c}">
        <a class="art__a" href="${esc(a.link)}" target="_blank" rel="noopener">
          <span class="art__k"><i></i>${esc(a.src || 'חדשות')}${a.live ? ` · <em>${esc(a.ago || 'עכשיו')}</em>` : ''}</span>
          <b class="art__t">${esc(a.title)}</b>
          <span class="art__more">לכתבה המלאה ←</span>
        </a>
        ${ep ? `<button class="art__ep" data-x="art-ep" data-id="${ep.id}"><span class="art__eq"><i></i><i></i><i></i><i></i></span>האזינו לפרק: ${esc(ep.title)}</button>` : ''}
      </article>`;
    }).join('');
  }
  window.addEventListener('pod:news', articles);

  /* ================= share sheet ================= */
  const qrSvg = url => { try { const q = window.qrcode(0, 'M'); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 4, margin: 1, scalable: true }); } catch (e) { return ''; } };
  const BASE = location.origin + location.pathname;
  function openShare(ep) {
    const sh = $('#share-sheet'), bar = $('#ss-bar');
    if (ep && !ep.live && ep.id !== 'briefing') {
      bar.dataset.ctx = 'ep'; bar.dataset.id = ep.id;
      $('#ss-art').innerHTML = PodCovers.html(ep); $('#ss-k').textContent = 'שיתוף פרק · ' + A.catOf(ep).label;
      $('#ss-title').textContent = ep.title; $('#ss-sub').textContent = ep.subtitle;
      $('#ss-qr').innerHTML = qrSvg(BASE + '#' + ep.id);
    } else {
      bar.dataset.ctx = 'app'; delete bar.dataset.id;
      $('#ss-art').innerHTML = `<img src="assets/icon-192.png" alt="">`; $('#ss-k').textContent = 'שיתוף האפליקציה';
      $('#ss-title').textContent = 'podtc: טירת כרמל מספרת את עצמה'; $('#ss-sub').textContent = 'פודקאסטים קצרים על כל מקום בעיר';
      $('#ss-qr').innerHTML = qrSvg(BASE);
    }
    bar.querySelector('[data-share="native"]').hidden = !navigator.share;
    sh.hidden = false; document.body.classList.add('sharing');
    if (window.PodIcons) PodIcons.hydrate(sh);
    setTimeout(() => sh.querySelector('.sb').focus(), 50);
  }
  function closeShare() { $('#share-sheet').hidden = true; document.body.classList.remove('sharing'); }
  $('#share-sheet').addEventListener('click', e => { if (e.target === $('#share-sheet') || e.target.closest('.share-sheet__x')) closeShare(); else if (e.target.closest('[data-share]')) setTimeout(closeShare, 400); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#share-sheet').hidden) closeShare(); });
  $('#btn-share-top').addEventListener('click', () => openShare(null));
  // the player's share button opens the big sheet for the current episode
  $('#now-share').addEventListener('click', e => { e.stopImmediatePropagation(); openShare(A.current); }, true);
  // a share button on every episode card
  const shIc = window.PodIcons ? PodIcons.svg('share', 16) : '';
  function decorate() {
    document.querySelectorAll('.tile:not([data-sh])').forEach(t => {
      t.dataset.sh = 1; const id = t.dataset.ep; if (!id || !byId(id)) return;
      t.insertAdjacentHTML('afterbegin', `<button class="tile__sh" data-x="share" data-id="${id}" aria-label="שיתוף: ${esc(byId(id).title)}">${shIc}</button>`);
    });
  }
  let decT = 0;
  new MutationObserver(() => { if (!decT) decT = setTimeout(() => { decT = 0; decorate(); }, 80); }).observe($('#home'), { childList: true, subtree: true });
  articles(); decorate();

  if (A.current) { wave(A.current); related(A.current); setTime(0); }
  renderHome(); animateIn();
  A.onUpdate(() => setTimeout(animateIn, 400));
  if (window.PodIcons) PodIcons.hydrate();
})();
