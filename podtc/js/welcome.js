/* podtc — first visit: three short screens (what podtc is, location, install + notifications),
 * a light / dark switch that follows the phone by default, privacy-friendly visit counting, and the
 * "episode page" link in the player. */
(function () {
  const A = window.PodApp, CFG = window.PODTC_CONFIG || {}, $ = s => document.querySelector(s); if (!A) return;
  const ls = { get: (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const ic = (n, s) => window.PodIcons ? PodIcons.svg(n, s || 26) : '';

  /* ---------- light / dark ---------- */
  const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function applyTheme() { const m = ls.get('podtc.theme', 'auto'), dark = m === 'dark' || (m === 'auto' && mq && mq.matches);
    document.documentElement.classList.toggle('dark', !!dark); const b = $('#theme-btn'); if (b) { b.setAttribute('aria-pressed', String(!!dark)); b.title = b.ariaLabel = dark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה'; }
    const tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.content = dark ? '#0A1428' : '#ffffff'; }
  if (mq && mq.addEventListener) mq.addEventListener('change', applyTheme);
  const sb = $('.top-search');
  if (sb) sb.insertAdjacentHTML('beforebegin', `<button class="theme-btn" id="theme-btn" aria-pressed="false" aria-label="מעבר למצב כהה"><svg class="i-moon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/></svg><svg class="i-sun" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>`);
  document.addEventListener('click', e => { if (!e.target.closest('#theme-btn')) return; const dark = document.documentElement.classList.contains('dark'); ls.set('podtc.theme', dark ? 'light' : 'dark'); applyTheme(); });
  applyTheme();

  /* ---------- episode page link in the player ---------- */
  const pages = window.PODTC_SHARE_PAGES || [], acts = $('.now .actions');
  if (acts) { acts.insertAdjacentHTML('afterbegin', `<a class="act" id="ep-page" href="#" target="_blank" rel="noopener" hidden>${ic('book', 18)}עמוד הפרק</a>`);
    window.addEventListener('pod:select', e => { const ep = e.detail, a = $('#ep-page'); const ok = ep && pages.includes(ep.id); a.hidden = !ok; if (ok) a.href = `e/${ep.id}.html`; }); }

  /* ---------- visit counting (GoatCounter: free, no cookies), only when set in the management screen ---------- */
  const gc = CFG.analytics || (window.PODTC_CONTENT_ACTIVE && window.PODTC_CONTENT_ACTIVE.settings && window.PODTC_CONTENT_ACTIVE.settings.goatcounter);
  if (gc && /^[a-z0-9-]+$/i.test(gc) && !window.PODTC_PREVIEW && navigator.doNotTrack !== '1') {
    window.goatcounter = { allow_local: false };
    const s = document.createElement('script'); s.async = true; s.src = 'https://gc.zgo.at/count.js'; s.dataset.goatcounter = `https://${gc}.goatcounter.com/count`; document.head.appendChild(s);
    const count = path => { try { window.goatcounter.count && window.goatcounter.count({ path, title: document.title }); } catch (e) {} };
    window.addEventListener('pod:page', e => count('/page/' + e.detail));
    window.addEventListener('pod:select', e => { if (e.detail && e.detail.id) count('/episode/' + e.detail.id); });
  }

  /* ---------- welcome screens, once ---------- */
  const deep = A.PLACES.some(p => '#' + p.id === location.hash);
  if (ls.get('podtc.welcomed', '') || deep || window.PODTC_PREVIEW || /^#\/\w/.test(location.hash)) return;
  const STEPS = [
    { i: 'headphones', c: '#06B6E8', k: 'ברוכים הבאים', t: 'טירת כרמל מספרת את עצמה', d: 'פודקאסטים קצרים על המקומות, האנשים והסיפורים של העיר, וגם חדשות, רדיו ומידע לתושב. הכול במקום אחד.' },
    { i: 'pin', c: '#F5B301', k: 'הולכים ומקשיבים', t: 'הפרק מתחיל כשאתם מגיעים', d: 'אשרו מיקום, והאתר ישמיע את הסיפור של המקום ברגע שתגיעו אליו. המיקום נשאר אצלכם במכשיר ולא נשלח לאף אחד.', btn: ['loc', 'אישור מיקום'] },
    { i: 'download', c: '#FF6B5E', k: 'תמיד בהישג יד', t: 'התקינו והישארו מעודכנים', d: 'הוסיפו את podtc למסך הבית, וקבלו התראה כשיש עדכון יומי, שידור חי או הודעה חשובה מהעירייה.', btn: ['install', 'הוספה למסך הבית'], btn2: ['notify', 'קבלת התראות'] }
  ];
  let step = 0;
  function render() {
    const S = STEPS[step], last = step === STEPS.length - 1;
    $('#wlc').innerHTML = `<div class="wlc__card" style="--w:${S.c}">
        <button class="wlc__skip" data-w="skip">דלגו</button>
        <span class="wlc__ic">${ic(S.i, 40)}</span>
        <span class="wlc__k">${S.k}</span><h2 id="wlc-t">${S.t}</h2><p>${S.d}</p>
        ${S.btn ? `<div class="wlc__acts"><button class="wlc__b" data-w="${S.btn[0]}">${S.btn[1]}</button>${S.btn2 ? `<button class="wlc__b wlc__b--alt" data-w="${S.btn2[0]}">${S.btn2[1]}</button>` : ''}</div>` : ''}
        <div class="wlc__foot"><span class="wlc__dots">${STEPS.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</span>
          <button class="wlc__next" data-w="${last ? 'done' : 'next'}">${last ? 'בואו נתחיל' : 'הבא'} ←</button></div></div>`;
    const f = $('#wlc .wlc__next'); if (f) f.focus();
  }
  function close() { ls.set('podtc.welcomed', '1'); const w = $('#wlc'); if (w) { w.classList.add('out'); setTimeout(() => w.remove(), 300); } }
  function open() {
    document.body.insertAdjacentHTML('beforeend', '<div class="wlc" id="wlc" role="dialog" aria-modal="true" aria-labelledby="wlc-t"></div>'); render();
    $('#wlc').addEventListener('click', async e => {
      const b = e.target.closest('[data-w]'); if (!b) { if (e.target.id === 'wlc') close(); return; } const a = b.dataset.w;
      if (a === 'next') { step++; render(); } else if (a === 'done' || a === 'skip') close();
      else if (a === 'loc') { if (!navigator.geolocation) { A.toast('המכשיר לא תומך במיקום'); return; } b.textContent = 'רגע…'; navigator.geolocation.getCurrentPosition(() => { b.textContent = 'המיקום אושר ✓'; b.disabled = true; }, () => { b.textContent = 'אפשר לאשר אחר כך בהגדרות'; b.disabled = true; }, { timeout: 15000 }); }
      else if (a === 'install') { const c = document.querySelector('#install-card button, #btn-install'); if (c) c.click(); else A.toast('בתפריט הדפדפן בחרו "הוספה למסך הבית"'); }
      else if (a === 'notify') { if (!('Notification' in window)) { A.toast('המכשיר לא תומך בהתראות'); return; } const r = await Notification.requestPermission(); b.textContent = r === 'granted' ? 'ההתראות פעילות ✓' : 'אפשר לאשר אחר כך'; b.disabled = true; }
    });
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape' && $('#wlc')) { close(); document.removeEventListener('keydown', k); } });
  }
  // after the opening logo
  const sp = $('#splash');
  const wait = () => { if (!sp || sp.hidden) setTimeout(open, 500); else setTimeout(wait, 300); }; wait();
})();
