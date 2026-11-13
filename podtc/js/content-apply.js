/* podtc — applies the content managed in admin.html on top of the built-in content.
 * Loaded right after places.js / config.js / content.js and before the app, so every screen sees the result.
 * A manager's unpublished draft (kept in their own browser) is shown only to them, in preview mode. */
(function () {
  let C = window.PODTC_CONTENT || {};
  let preview = false;
  try { if (localStorage.getItem('podtc.preview') === '1') { const d = JSON.parse(localStorage.getItem('podtc.draft') || 'null'); if (d) { C = d; preview = true; } } } catch (e) {}
  window.PODTC_CONTENT_ACTIVE = C; window.PODTC_PREVIEW = preview;
  const CFG = window.PODTC_CONFIG = window.PODTC_CONFIG || {};
  const P = window.PODTC_PLACES || [];
  const E = C.episodes || {};

  /* ---- episodes: edits, additions, hiding, order ---- */
  Object.keys(E.edits || {}).forEach(id => { const p = P.find(x => x.id === id), e = E.edits[id]; if (!p || !e) return;
    ['title', 'subtitle', 'script', 'category', 'audio', 'youtube'].forEach(k => { if (e[k] != null && e[k] !== '') p[k] = e[k]; });
    if (isFinite(e.lat) && e.lat !== '' && e.lat != null) p.lat = +e.lat; if (isFinite(e.lng) && e.lng !== '' && e.lng != null) p.lng = +e.lng;
    if (e.audio === '') delete p.audio; });
  (E.added || []).forEach(a => { if (!a || !a.id || !a.title || P.some(x => x.id === a.id)) return;
    P.push({ id: a.id, category: a.category || 'city', title: a.title, subtitle: a.subtitle || '', lat: +a.lat || 32.761, lng: +a.lng || 34.9705, radius: +a.radius || 200, approx: true,
      script: a.script || a.subtitle || a.title, audio: a.audio || undefined, youtube: a.youtube || undefined, sources: a.source ? [a.source] : [] }); });
  (E.hidden || []).forEach(id => { const i = P.findIndex(x => x.id === id); if (i > -1) P.splice(i, 1); });
  if ((E.order || []).length) P.sort((a, b) => { const i = E.order.indexOf(a.id), j = E.order.indexOf(b.id); return (i < 0 ? 1e6 : i) - (j < 0 ? 1e6 : j); });
  (window.PODTC_TOURS || []).forEach(t => { t.order = (t.order || []).filter(id => P.some(p => p.id === id)); });

  /* ---- lists ---- */
  if (Array.isArray(C.notices)) CFG.notices = C.notices;
  if (Array.isArray(C.gallery)) CFG.gallery = C.gallery;
  if (Array.isArray(C.articles)) window.PODTC_ARTICLES = C.articles;
  if (Array.isArray(C.links)) window.PODTC_LINKS = C.links;
  window.PODTC_LIVE = C.live || null; window.PODTC_PUSH = C.push || null;
  window.PODTC_DAILY = (C.daily || []).filter(d => d && (d.title || d.text || d.audio));
  if (C.settings) { CFG.social = Object.assign({}, CFG.social, ['tiktok', 'facebook', 'youtubeChannel'].reduce((o, k) => { if (C.settings[k]) o[k] = C.settings[k]; return o; }, {}));
    if (C.settings.goatcounter) CFG.analytics = C.settings.goatcounter;
    if (C.settings.radioStream) CFG.radio = { stream: C.settings.radioStream, name: C.settings.radioName || 'רדיו PODTC' }; }

  /* ---- after the page is built: texts, free blocks, section order and visibility ---- */
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const safeUrl = u => /^(https?:|tel:|mailto:|#|\.\/|\.\.\/|[a-z0-9_\-/]+\.html)/i.test(String(u || '')) ? u : '';
  function finish() {
    const $ = s => document.querySelector(s), T = C.texts || {};
    const set = (sel, v, html) => { const el = $(sel); if (el && v) { if (html) el.innerHTML = v; else el.textContent = v; } };
    if (T.heroTitle1 || T.heroTitle2) set('.rwel h1', `${esc(T.heroTitle1 || 'העיר מדברת.')}<br><em>${esc(T.heroTitle2 || 'אנחנו מקשיבים.')}</em>`, true);
    set('.rwel p', T.heroText); set('.rwel__k', T.heroKicker); set('.rrad h2', T.radioTitle); set('.rrad__sub', T.radioSub);
    set('.util__r b', T.slogan); set('#articles-block h2', T.newsTitle); set('#podcasts-title h2', T.podcastsTitle); set('#podcasts-title p', T.podcastsText);
    if (T.footer) set('.legal p', T.footer);
    if (Array.isArray(C.ticker) && C.ticker.length) { const tr = $('#ticker'); if (tr) { const items = C.ticker.filter(Boolean).map(t => `<span class="ticker__item">${esc(t)}</span>`).join(''); tr.innerHTML = items + items; } }
    // free blocks: a title, text, picture and button, placed after any section
    (C.blocks || []).forEach((b, i) => { if (!b || (!b.title && !b.text && !b.image)) return; const ref = document.getElementById(b.after || 'articles-block'); if (!ref) return;
      const img = safeUrl(b.image), url = safeUrl(b.url);
      ref.insertAdjacentHTML('afterend', `<section class="cblock cblock--${esc(b.style || 'light')}" id="cblock-${i}">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ''}<div class="cblock__b">
        ${b.kicker ? `<span class="eyebrow">${esc(b.kicker)}</span>` : ''}${b.title ? `<h2>${esc(b.title)}</h2>` : ''}${b.text ? `<p>${esc(b.text).replace(/\n/g, '<br>')}</p>` : ''}
        ${url ? `<a class="cblock__btn" href="${esc(url)}" ${/^https?:/.test(url) ? 'target="_blank" rel="noopener"' : ''}>${esc(b.button || 'לפרטים')}</a>` : ''}</div></section>`); });
    const L = C.layout || {}, inner = $('.home__inner');
    if (inner && (L.order || []).length) { const foot = inner.querySelector('.share-app') || inner.querySelector('.foot');
      L.order.forEach(id => { const el = document.getElementById(id); if (!el || el.parentElement !== inner || !foot) return; if (id === 'sections') { const t = document.getElementById('podcasts-title'); if (t) inner.insertBefore(t, foot); } inner.insertBefore(el, foot); }); }
    (L.hidden || []).forEach(id => { const el = document.getElementById(id); if (el) { el.hidden = true; el.style.display = 'none'; } });
    if (preview) document.body.insertAdjacentHTML('beforeend', `<div class="pvbar">תצוגה מקדימה של טיוטה שלא פורסמה <a href="admin.html">חזרה לניהול</a><button id="pv-off">יציאה מתצוגה מקדימה</button></div>`);
    const off = document.getElementById('pv-off'); if (off) off.addEventListener('click', () => { try { localStorage.removeItem('podtc.preview'); } catch (e) {} location.reload(); });
  }
  if (document.readyState === 'complete') finish(); else window.addEventListener('DOMContentLoaded', () => setTimeout(finish, 0));
})();
