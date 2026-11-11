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
    }).join('');
    paintWave(0);
  }
  function paintWave(f) { const n = Math.round(f * BARS); $('#wave').querySelectorAll('i').forEach((b, i) => b.classList.toggle('on', i < n)); }
  N.on('progress', paintWave);
  $('#wave').addEventListener('click', e => {
    const r = $('#wave').getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (r.right - e.clientX) / r.width));    // RTL: progress grows from the right
    const total = document.querySelectorAll('#transcript span[data-i]').length || 1;
    const i = Math.min(total - 1, Math.floor(f * total));
    if (['playing', 'paused', 'skipping'].includes(N.state)) N.seek(i); else { A.play(); setTimeout(() => N.seek(i), 80); }
    paintWave(f);
  });
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
  window.addEventListener('pod:select', e => { wave(e.detail); related(e.detail); setTimeout(upnext, 0); markPlaying(); });
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

  renderHome(); animateIn();
  A.onUpdate(() => setTimeout(animateIn, 400));
  if (window.PodIcons) PodIcons.hydrate();
})();
