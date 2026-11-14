/* podtc — a calmer front page that flows.
 * The front page is a short sequence of colour bands; most content sits behind tabs instead of in a
 * long column:
 *   ① the two main cards (+ live broadcast, + daily update)
 *   ② quick actions
 *   ③ "מה קורה בעיר"   tabs: news · notices · services · radio
 *   ④ the city map
 *   ⑤ "מה לשמוע"       tabs: near you · editor's picks · topics
 * The tab panels are the existing sections; on other pages they show as usual. */
(function () {
  const A = window.PodApp, $ = s => document.querySelector(s); if (!A) return;
  const inner = $('.home__inner'); if (!inner) return;
  const ic = (n, s) => window.PodIcons ? PodIcons.svg(n, s || 20) : '';
  const HUBS = [
    { id: 'hub-now', t: 'מה קורה בעיר', d: 'חדשות, מודעות העירייה, שירותים ורדיו, במקום אחד', tabs: [
      { k: 'articles-block', t: 'חדשות', i: 'news', c: '#FF6B5E', more: ['news', 'לכל החדשות'] },
      { k: 'board-block', t: 'מודעות', i: 'alert', c: '#F5B301', more: ['news', 'ללוח המודעות'] },
      { k: 'services', t: 'שירותים', i: 'building', c: '#06B6E8', more: ['contact', 'לכל השירותים'] },
      { k: 'radio', t: 'רדיו', i: 'radio', c: '#7B61FF' }] },
    { id: 'hub-listen', t: 'מה לשמוע', d: 'פרקים קצרים על המקומות והאנשים של טירת כרמל', tabs: [
      { k: 'near-block', t: 'קרוב אליכם', i: 'pin', c: '#0E9F6E', more: ['podcasts', 'לכל הפרקים'] },
      { k: 'top10-block', t: 'מומלצים', i: 'star', c: '#FF6B5E', more: ['podcasts', 'לכל הפרקים'] },
      { k: 'tmarq', t: 'לפי נושא', i: 'headphones', c: '#7B61FF', more: ['podcasts', 'לכל הפרקים'] }] }
  ];
  const panel = k => document.getElementById(k) || inner.querySelector(':scope > .' + k);
  const ls = { get: (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

  HUBS.forEach(H => {
    inner.insertAdjacentHTML('beforeend', `<section class="hub" id="${H.id}" aria-labelledby="${H.id}-t">
        <div class="hub__head"><h2 id="${H.id}-t">${H.t}</h2><p>${H.d}</p></div>
        <div class="hub__tabs" role="tablist" aria-label="${H.t}">${H.tabs.map((T, i) => `<button class="hub__tab" role="tab" id="${H.id}-tab-${i}" aria-controls="${T.k}" data-hub="${H.id}" data-k="${T.k}" style="--t:${T.c}"><span class="hub__ic">${ic(T.i, 18)}</span>${T.t}</button>`).join('')}</div>
        <a class="hub__more" id="${H.id}-more" href="#/"></a>
      </section>`);
    H.tabs.forEach((T, i) => { const p = panel(T.k); if (p) { p.classList.add('hub-panel'); p.dataset.hub = H.id; p.style.setProperty('--t', T.c); p.setAttribute('aria-labelledby', `${H.id}-tab-${i}`); } });
  });

  function select(hid, k, focus) {
    const H = HUBS.find(h => h.id === hid), T = H.tabs.find(t => t.k === k) || H.tabs[0]; ls.set('podtc.' + hid, T.k);
    document.querySelectorAll(`.hub__tab[data-hub="${hid}"]`).forEach(b => { const on = b.dataset.k === T.k; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    H.tabs.forEach(t => { const p = panel(t.k); if (!p) return; const on = t.k === T.k; p.classList.toggle('hub-off', !on); if (on) { p.setAttribute('role', 'tabpanel'); p.classList.remove('hub-in'); void p.offsetWidth; p.classList.add('hub-in'); } });
    const m = document.getElementById(hid + '-more'); if (m) { m.hidden = !T.more; if (T.more) { m.href = '#/' + T.more[0]; m.textContent = T.more[1] + ' ←'; } }
    const hub = document.getElementById(hid); if (hub) hub.style.setProperty('--t', T.c);
    window.dispatchEvent(new Event('resize'));
  }
  document.addEventListener('click', e => { const b = e.target.closest('.hub__tab'); if (b) select(b.dataset.hub, b.dataset.k); });
  document.addEventListener('keydown', e => {
    const b = e.target.closest && e.target.closest('.hub__tab'); if (!b || !/Arrow(Left|Right)|Home|End/.test(e.key)) return; e.preventDefault();
    const all = [...document.querySelectorAll(`.hub__tab[data-hub="${b.dataset.hub}"]`)], i = all.indexOf(b);
    const j = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : (i + (e.key === 'ArrowLeft' ? 1 : -1) + all.length) % all.length;   // RTL: left = next
    select(b.dataset.hub, all.at(j).dataset.k, true);
  });

  /* front page order (CSS order inside a column, so no section is moved in the page itself) */
  const ORDER = ['onair', 'rhero', 'daily-block', 'qa', 'hub-now', 'articles-block', 'board-block', 'services', 'radio', 'homemap', 'hub-listen', 'near-block', 'top10-block', 'tmarq', 'foot'];
  function arrange(page) {
    const home = page === 'home';
    inner.classList.toggle('flow', home);
    ORDER.forEach((k, i) => { const el = panel(k); if (el) el.style.order = home ? String(i + 1) : ''; });
    // outside the front page the panels show as ordinary sections
    document.querySelectorAll('.hub-panel').forEach(p => { if (!home) p.classList.remove('hub-off'); });
    if (home) HUBS.forEach(H => select(H.id, ls.get('podtc.' + H.id, H.tabs[0].k)));
  }
  window.addEventListener('pod:page', e => arrange(e.detail));
  window.PodHub = { select, arrange };
})();
