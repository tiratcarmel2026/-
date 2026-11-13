/* podtc — life and sharing: scroll progress, live clock, topic marquee, count-up numbers,
 * a floating share rail, share buttons on news and notices, back-to-top. */
(function () {
  const A = window.PodApp, $ = s => document.querySelector(s); if (!A) return;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ic = (n, s) => window.PodIcons ? PodIcons.svg(n, s || 18) : '';
  const home = $('#home'), BASE = location.origin + location.pathname;
  const APP_TEXT = 'podtc: טירת כרמל מספרת את עצמה. פודקאסטים קצרים, חדשות ורדיו של העיר';
  const cur = () => { const c = A.current; return c && !c.live && c.id !== 'briefing' && A.isActive && A.isActive() ? { url: window.PodShareUrl ? PodShareUrl(c) : BASE + '#' + c.id, text: `"${c.title}": ${c.subtitle}. האזינו ב־podtc` } : { url: BASE, text: APP_TEXT }; };
  const open = (kind, d) => { const u = encodeURIComponent(d.url), t = encodeURIComponent(d.text), w = h => window.open(h, '_blank', 'noopener');
    if (kind === 'wa') w(`https://wa.me/?text=${t}%20${u}`); else if (kind === 'fb') w(`https://www.facebook.com/sharer/sharer.php?u=${u}`); else if (kind === 'tg') w(`https://t.me/share/url?url=${u}&text=${t}`);
    else if (kind === 'x') w(`https://twitter.com/intent/tweet?text=${t}&url=${u}`); else if (kind === 'mail') location.href = `mailto:?subject=${encodeURIComponent('podtc')}&body=${t}%0A${u}`;
    else if (kind === 'native' && navigator.share) navigator.share({ title: 'podtc', text: d.text, url: d.url }).catch(() => {});
    else (navigator.clipboard ? navigator.clipboard.writeText(d.text + ' ' + d.url) : Promise.reject()).then(() => A.toast('הקישור הועתק'), () => prompt('העתיקו את הקישור:', d.url)); };
  const BTN = [['wa', 'וואטסאפ', 'chat'], ['fb', 'פייסבוק', 'facebook'], ['tg', 'טלגרם', 'send'], ['x', 'X', 'hash'], ['mail', 'מייל', 'mail'], ['copy', 'העתקת קישור', 'link']];
  const row = (cls, list) => `<span class="${cls}">${(list || BTN).map(([k, l, i]) => `<button class="pshare pshare--${k}" data-ps="${k}" aria-label="שיתוף: ${l}" title="${l}">${ic(i, 18)}</button>`).join('')}</span>`;

  /* ---------- floating share rail ---------- */
  document.body.insertAdjacentHTML('beforeend', `<aside class="srail" aria-label="שיתוף"><b>שתפו</b>${row('srail__b')}</aside>`);
  /* ---------- share rows in the two main cards and in the player bar ---------- */
  const wel = $('.rwel__in'); if (wel) wel.insertAdjacentHTML('beforeend', `<div class="rwel__share"><span>שתפו את podtc</span>${row('rwel__sb', BTN.slice(0, 4).concat([BTN[5]]))}</div>`);
  const rr = $('.rrad__player'); if (rr) rr.insertAdjacentHTML('afterend', `<div class="rrad__share"><span>שתפו את השידור</span>${row('rrad__sb', BTN.slice(0, 3).concat([BTN[5]]))}</div>`);
  const mini = $('#mini'); if (mini) mini.insertAdjacentHTML('beforeend', `<button class="mshare" id="mshare" aria-label="שיתוף הפרק">${ic('share', 20)}</button>`);
  const ms = $('#mshare'); if (ms) ms.addEventListener('click', () => { const b = $('#now-share'); if (b) b.click(); });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ps]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    const host = b.closest('[data-surl]'); open(b.dataset.ps, host ? { url: host.dataset.surl, text: host.dataset.stext || APP_TEXT } : cur());
  });
  /* ---------- share on every news card and notice ---------- */
  function decorate() {
    document.querySelectorAll('.art:not([data-ps-on])').forEach(a => { a.dataset.psOn = 1; const l = a.querySelector('.art__a'), t = a.querySelector('.art__t'); if (!l || !t) return;
      a.insertAdjacentHTML('beforeend', `<span class="art__share" data-surl="${esc(l.href)}" data-stext="${esc(t.textContent.trim())}">${row('art__sb', [BTN[0], BTN[1], BTN[5]])}</span>`); });
    document.querySelectorAll('.notice:not([data-ps-on]), .bnote:not([data-ps-on])').forEach(n => { n.dataset.psOn = 1; const t = n.querySelector('b'); const l = n.matches('a') ? n : n.querySelector('a'); if (!t) return;
      const html = `<span class="n__share" data-surl="${esc((l && l.href) || BASE)}" data-stext="${esc('מודעת עיריית טירת כרמל: ' + t.textContent.trim())}">${row('n__sb', [BTN[0], BTN[5]])}</span>`;
      (n.querySelector('.notice__act') || n).insertAdjacentHTML('beforeend', html); });
  }
  let dt = 0; new MutationObserver(() => { if (!dt) dt = setTimeout(() => { dt = 0; decorate(); }, 200); }).observe(home, { childList: true, subtree: true }); decorate();

  /* ---------- the daily update: a recorded voice note from the municipality ---------- */
  const DAILY = window.PODTC_DAILY || [];
  if (DAILY.length) {
    const fmtD = d => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); if (!m) return ''; const dt = new Date(+m[1], +m[2] - 1, +m[3]), today = new Date(); today.setHours(0, 0, 0, 0); const diff = Math.round((today - dt) / 864e5);
      return diff === 0 ? 'היום' : diff === 1 ? 'אתמול' : dt.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }); };
    const asEp = (d, i) => ({ id: 'daily-' + (d.date || i), category: 'news', title: d.title || 'העדכון היומי', subtitle: [fmtD(d.date), d.by].filter(Boolean).join(' · ') || 'העדכון היומי', lat: 32.761, lng: 34.9705, radius: 1,
      script: d.text || d.title || 'העדכון היומי של עיריית טירת כרמל.', audio: d.audio || undefined, sources: [] });
    const d0 = DAILY[0], rest = DAILY.slice(1, 8), ref = document.querySelector('.rhero');
    const PL = '<svg viewBox="0 0 24 24" width="22" height="22" style="width:22px;height:22px;fill:currentColor;stroke:none" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
    if (ref) ref.insertAdjacentHTML('afterend', `<section class="daily" id="daily-block" aria-label="העדכון היומי">
        <button class="daily__play" data-daily="0" aria-label="האזנה לעדכון היומי">${PL}</button>
        <div class="daily__b"><span class="daily__k"><i></i>העדכון היומי${d0.audio ? ' · הקלטה' : ''}</span><h2>${esc(d0.title || 'מה חדש היום בטירת כרמל')}</h2>
          <p class="daily__m">${esc([fmtD(d0.date), d0.by].filter(Boolean).join(' · '))}</p>${d0.text ? `<p class="daily__t">${esc(d0.text.length > 200 ? d0.text.slice(0, 200).replace(/\s+\S*$/, '') + '…' : d0.text)}</p>` : ''}
          <span class="daily__eq" aria-hidden="true">${'<i></i>'.repeat(24)}</span></div>
        <div class="daily__side" data-surl="${esc(BASE)}" data-stext="${esc('העדכון היומי של טירת כרמל: ' + (d0.title || ''))}"><span>שתפו</span>${row('daily__sb', [BTN[0], BTN[1], BTN[5]])}</div>
        ${rest.length ? `<details class="daily__old"><summary>עדכונים קודמים (${rest.length})</summary>${rest.map((d, i) => `<button data-daily="${i + 1}"><b>${esc(d.title || 'עדכון')}</b><small>${esc(fmtD(d.date))}${d.audio ? ' · הקלטה' : ''}</small></button>`).join('')}</details>` : ''}
      </section>`);
    document.addEventListener('click', e => { const b = e.target.closest('[data-daily]'); if (!b) return; const i = +b.dataset.daily, ep = asEp(DAILY[i], i);
      if (A.current && A.current.id === ep.id && A.isActive()) { const m = $('#mini-play'); if (m) m.click(); return; } A.select(ep); A.play(); });
    const N = window.Narrator; if (N && N.on) N.on('state', s => { const on = (s === 'playing' || s === 'skipping') && A.current && String(A.current.id).indexOf('daily-') === 0; document.body.classList.toggle('daily-on', !!on); });
  }

  /* ---------- scroll progress + back to top ---------- */
  document.body.insertAdjacentHTML('beforeend', `<div class="sprog" aria-hidden="true"><i></i></div><button class="totop" id="totop" aria-label="חזרה לראש העמוד" hidden>${ic('share', 20)}</button>`);
  const bar = $('.sprog i'), tt = $('#totop');
  home.addEventListener('scroll', () => { const max = home.scrollHeight - home.clientHeight; bar.style.transform = `scaleX(${max > 0 ? home.scrollTop / max : 0})`; tt.hidden = home.scrollTop < 900; }, { passive: true });
  tt.addEventListener('click', () => home.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- live clock in the utility bar ---------- */
  const ur = $('.util__r'); if (ur) { ur.insertAdjacentHTML('beforeend', '<span class="util__sep">|</span><span class="util__clock" id="uclock"></span>');
    const tick = () => { const d = new Date(); $('#uclock').textContent = d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }); }; tick(); setInterval(tick, 20000); }

  /* ---------- marquee of topics, each in its own colour ---------- */
  const POP = ['#06B6E8', '#F5B301', '#FF6B5E', '#0E9F6E', '#7B61FF', '#0B1F47'];
  const pts = $('.rpoints'), cats = Object.keys(A.CATS).filter(k => k !== 'live' && k !== 'news' && A.PLACES.some(p => p.category === k));
  if (pts && cats.length) { const chips = cats.map((k, i) => `<button class="tchip" style="--p:${POP[i % POP.length]}" data-tc="${k}"><i></i>${esc(A.CATS[k].label)}<small>${A.PLACES.filter(p => p.category === k).length}</small></button>`).join('');
    pts.insertAdjacentHTML('afterend', `<div class="tmarq" aria-label="נושאי הפודקאסטים"><div class="tmarq__in">${chips}${chips}</div></div>`); }
  document.addEventListener('click', e => { const b = e.target.closest('[data-tc]'); if (!b) return; const s = document.getElementById('shelf-' + b.dataset.tc); if (s) { s.classList.add('in'); s.scrollIntoView({ behavior: 'smooth', block: 'center' }); } });

  /* ---------- numbers count up when they come into view ---------- */
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) return; io.unobserve(en.target); const el = en.target, raw = el.textContent.trim(), m = raw.match(/^([\d,]+)(.*)$/); if (!m) return;
      const to = +m[1].replace(/,/g, ''), comma = m[1].includes(','); if (!to || to > 1e7 || (to > 1900 && to < 2100 && !comma)) return; const t0 = performance.now();
      const step = t => { const k = Math.min(1, (t - t0) / 1100), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = (comma ? v.toLocaleString('en-US') : v) + m[2]; if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }), { root: home, threshold: .6 });
    const scan = () => document.querySelectorAll('.fact b:not([data-cu]), .wrap__stats b:not([data-cu]), .fnum b:not([data-cu])').forEach(el => { el.dataset.cu = 1; io.observe(el); }); scan(); setTimeout(scan, 2500); }

  /* ---------- section eyebrows and titles take turns with the accent colours ---------- */
  document.querySelectorAll('.home__inner > section, .home__inner > .rtitle').forEach((s, i) => s.style.setProperty('--p', POP[i % POP.length]));
  if (window.PodIcons) PodIcons.hydrate();
})();
