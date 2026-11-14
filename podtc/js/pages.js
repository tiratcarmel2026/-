/* podtc — pages. The front page keeps the essentials; everything else moves to its own page:
 *   #/            ראשי      live, daily update, news headlines, notices, services, near you, top 10, radio
 *   #/podcasts    פודקאסטים all episodes by topic, tours, short episodes, your history
 *   #/news        חדשות     news, notice board, live info, social networks
 *   #/city        העיר      the city in brief, buses, the city of tomorrow, gallery
 *   #/contact     צרו קשר   services, useful links, sharing
 * Sections are moved by showing / hiding them (nothing is rebuilt), so every feature keeps working. */
(function () {
  const A = window.PodApp, $ = s => document.querySelector(s); if (!A) return;
  const home = $('#home'), inner = $('.home__inner'); if (!inner) return;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ic = (n, s) => window.PodIcons ? PodIcons.svg(n, s || 22) : '';

  const PAGES = {
    home: { t: 'ראשי', icon: 'home' },
    podcasts: { t: 'פודקאסטים', d: 'כל הפרקים על המקומות, האנשים והסיפורים של טירת כרמל', icon: 'headphones' },
    news: { t: 'חדשות', d: 'כתבות, מודעות העירייה, מה קורה עכשיו ומה חדש ברשתות', icon: 'news' },
    city: { t: 'העיר', d: 'טירת כרמל במספרים, תחבורה ציבורית, תוכניות לעתיד וגלריה', icon: 'building' },
    contact: { t: 'צרו קשר', d: 'שירותי העירייה, מספרי טלפון וקישורים שימושיים', icon: 'phone' }
  };
  // which page(s) each section lives on; the first page listed is its home
  const MAP = {
    onair: ['home', 'news'], 'daily-block': ['home', 'news'], rhero: ['home'], rpoints: ['home'], tmarq: ['home', 'podcasts'], qa: ['home'], hsearch: ['podcasts'],
    'articles-block': ['news', 'home'], 'board-block': ['news', 'home'], services: ['contact', 'home', 'city'], 'near-block': ['podcasts', 'home'], 'top10-block': ['podcasts', 'home'],
    radio: ['home'], homemap: ['home', 'city'], 'hub-now': ['home'], 'hub-listen': ['home'], 'share-band': ['contact'], 'install-card': ['contact'],
    'podcasts-title': ['podcasts'], resume: ['podcasts'], quick: ['podcasts'], hero: ['podcasts'], 'recent-block': ['podcasts'], 'fav-block': ['podcasts'], 'tours-block': ['podcasts'],
    'browse-block': ['podcasts'], sections: ['podcasts'], 'shorts-block': ['podcasts'], wrapped: ['podcasts'], kids: ['podcasts'],
    live: ['news'], social: ['news'], notice: ['news'],
    'city-block': ['city'], 'bus-block': ['city', 'contact'], future: ['city'], 'gallery-block': ['city'], photo: ['city'],
    'links-block': ['contact'], 'share-app': ['contact'], foot: ['*']
  };
  const keyOf = el => el.id && MAP[el.id] ? el.id : ['rhero', 'rpoints', 'tmarq', 'qa', 'hsearch', 'notice', 'share-app', 'foot'].find(c => el.classList.contains(c)) || el.id || '';
  const pagesOf = el => {
    if (el.classList.contains('cblock')) { let p = el.previousElementSibling; while (p && p.classList.contains('cblock')) p = p.previousElementSibling; return p ? pagesOf(p) : ['home']; }  // free blocks follow the section they were placed after
    return MAP[keyOf(el)] || [];                                                                                     // anything unlisted (date line, jump chips…) is retired
  };
  const pageOf = id => { const el = document.getElementById(id); return el ? (pagesOf(el)[0] || 'home') : 'home'; };

  /* ---------- front page order: live, the two main cards, daily update, search, quick actions ---------- */
  ['tmarq', 'rpoints', 'homemap', 'qa', 'hsearch', 'daily-block', 'rhero', 'onair'].forEach(k => { const el = document.getElementById(k) || inner.querySelector(':scope > .' + k); if (el) inner.prepend(el); });

  /* ---------- page header (every page but home) ---------- */
  inner.insertAdjacentHTML('afterbegin', `<header class="pghead" id="pghead" hidden><span class="eyebrow" id="pg-k"></span><h1 id="pg-t"></h1><p id="pg-d"></p><div class="pghead__x" id="pg-x"></div></header>`);
  const EXTRA = {
    podcasts: `<button class="pgbtn" data-pgact="library">${ic('book', 18)}הספרייה שלי</button><button class="pgbtn" data-pgact="voice">${ic('mic', 18)}בחירת קול</button><button class="pgbtn pgbtn--pri" data-rgo="@radio">${ic('radio', 18)}השמעה ברצף</button>`,
    city: `<button class="pgbtn" data-pgact="map">${ic('pin', 18)}מפת העיר</button><a class="pgbtn" href="https://www.tirat-carmel.muni.il/" target="_blank" rel="noopener">${ic('building', 18)}אתר העירייה</a>`,
    contact: `<a class="pgbtn pgbtn--pri" href="tel:106">${ic('phone', 18)}מוקד 106</a><a class="pgbtn" href="tel:048547000">${ic('phone', 18)}מרכזיית העירייה</a><button class="pgbtn" data-pgact="feedback">${ic('mail', 18)}שלחו לנו הודעה</button>`,
    news: `<button class="pgbtn" data-pgact="notify">${ic('alert', 18)}קבלת התראות</button>`
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-pgact]'); if (!b) return; const a = b.dataset.pgact;
    if (a === 'library') A.openLibrary(); else if (a === 'voice' && window.PodVoice) PodVoice.open(); else if (a === 'map') { const t = document.querySelector('.tab[data-view="map"]'); if (t) t.click(); }
    else if (a === 'feedback') { const f = $('#foot-feedback'); if (f) f.click(); } else if (a === 'notify') { const n = $('#notif-on'); if (n) n.click(); } });

  /* ---------- navigation: desktop menu + mobile tab bar ---------- */
  const NAV = [['home', 'ראשי'], ['podcasts', 'פודקאסטים'], ['news', 'חדשות'], ['city', 'העיר'], ['@map', 'מפה'], ['contact', 'צרו קשר']];
  const mnav = $('.mnav'); if (mnav) mnav.innerHTML = NAV.map(([p, t]) => `<button data-nav="${p}">${t}</button>`).join('');
  const util = $('.util__l'); if (util) util.innerHTML = `<button data-nav="podcasts">פודקאסטים</button><button data-nav="news">חדשות</button><button data-nav="contact">צרו קשר</button><a href="admin.html">כניסת מנהלים</a>`;
  const tb = $('.tabbar');
  if (tb) { const keep = [...tb.querySelectorAll('.tab[data-view="map"]')];
    tb.innerHTML = [['home', 'ראשי', 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z'], ['podcasts', 'פודקאסטים', 'M4 14v-2a8 8 0 0116 0v2M4 14h3v6H5a1 1 0 01-1-1zM20 14h-3v6h2a1 1 0 001-1z'],
      ['news', 'חדשות', 'M4 5h13v14H6a2 2 0 01-2-2zM17 9h3v8a2 2 0 01-2 2M7 9h7M7 13h7M7 17h4'], ['city', 'העיר', 'M3 21h18M5 21V9l5-3v15M10 21V4l9 4v13M13 10h3M13 14h3M13 18h3']]
      .map(([p, t, d]) => `<button class="tab" data-view="home" data-nav="${p}"><svg viewBox="0 0 24 24"><path d="${d}"/></svg><span>${t}</span></button>`).join('');
    keep.forEach(k => tb.appendChild(k)); }

  /* ---------- routing ---------- */
  let cur = null;
  function show(page, opts = {}) {
    if (!PAGES[page]) page = 'home';
    const changed = page !== cur; cur = page;
    document.body.dataset.page = page;
    [...inner.children].forEach(el => { if (el.id === 'pghead') return; const ps = pagesOf(el); el.classList.toggle('pg-off', !(ps.includes(page) || ps.includes('*'))); });
    // notices live on the news page
    if (page === 'news') inner.querySelectorAll(':scope > .notice').forEach(el => el.classList.remove('pg-off'));
    const P = PAGES[page], h = $('#pghead'); h.hidden = page === 'home';
    if (page !== 'home') {  $('#pg-t').textContent = P.t; $('#pg-d').textContent = P.d; $('#pg-x').innerHTML = EXTRA[page] || ''; }
    document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('on', b.dataset.nav === page && document.body.classList.contains('view-home')));
    document.title = page === 'home' ? 'podtc — טירת כרמל' : `${P.t} · podtc — טירת כרמל`;
    if (changed && !opts.keepScroll) home.scrollTo({ top: 0 });
    if (changed) { window.dispatchEvent(new CustomEvent('pod:page', { detail: page })); setTimeout(() => window.dispatchEvent(new Event('resize')), 30); }
  }
  const fromHash = () => { const m = /^#\/(\w+)/.exec(location.hash); return m ? m[1] : 'home'; };
  function go(page) {
    const t = document.querySelector('.tab[data-view="home"]'); if (!document.body.classList.contains('view-home') && t) t.click();
    const h = page === 'home' ? '#/' : '#/' + page;
    if (location.hash !== h) history.pushState(null, '', h); show(page);
  }
  window.addEventListener('popstate', () => show(fromHash()));
  window.addEventListener('hashchange', () => { if (/^#\//.test(location.hash) || !location.hash) show(fromHash()); });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-nav]'); if (!b) return; e.preventDefault();
    const p = b.dataset.nav; if (p === '@map') { const t = document.querySelector('.tab[data-view="map"]'); if (t) t.click(); document.querySelectorAll('[data-nav]').forEach(x => x.classList.toggle('on', x === b)); return; }
    go(p);
  });
  // links and buttons that jump to a section: open the page that holds it first (runs before their own handlers)
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-rgo], [data-qa], [data-go], a[href^="#"]:not([href^="#/"])'); if (!b) return;
    const raw = b.dataset.rgo || (b.dataset.qa || '').replace(/^#/, '') || b.dataset.go || (b.getAttribute('href') || '').slice(1);
    if (!raw || raw[0] === '@') return; const el = document.getElementById(raw); if (!el || !inner.contains(el)) return;
    if (el.classList.contains('pg-off')) { const p = pageOf(raw); history.pushState(null, '', p === 'home' ? '#/' : '#/' + p); show(p, { keepScroll: true }); }
  }, true);
  // the map view and the tab bar stay in step (the older tab code marks every "home" tab; this corrects it)
  const sync = () => { const onHome = document.body.classList.contains('view-home');
    document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('on', onHome ? b.dataset.nav === cur : b.dataset.nav === '@map'));
    document.querySelectorAll('.tabbar .tab[data-view="map"]').forEach(b => b.classList.toggle('on', !onHome)); };
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('click', e => { if (e.target.closest('.tabbar, .mnav, [data-nav]')) setTimeout(sync, 0); });
  setTimeout(sync, 0); setTimeout(sync, 1500); setTimeout(sync, 4000);
  // sections that are added later (free blocks, notices) take their place too
  let t = 0; new MutationObserver(() => { if (!t) t = setTimeout(() => { t = 0; show(cur, { keepScroll: true }); }, 120); }).observe(inner, { childList: true });

  show(fromHash(), { keepScroll: true });
  window.PodPages = { go, show, get current() { return cur; } };
  if (window.PodIcons) PodIcons.hydrate();
})();
