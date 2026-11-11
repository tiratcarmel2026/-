/* podtc — accessibility toolbar
 * Built to Israeli Standard IS 5568 (based on WCAG 2.0 AA) and the Equal Rights for Persons
 * with Disabilities (Service Accessibility Adjustments) Regulations, 2013.
 * Every setting is saved on this device and can be reset in one click. Shortcut: Alt+A. */
(function () {
  const KEY = 'podtc.a11y';
  const root = document.documentElement;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  let st = load();

  /* toggles → class on <html>. group: only one of a group can be on */
  const T = [
    { k: 'kbd', t: 'ניווט מקלדת', d: 'מסגרת בולטת לרכיב בפוקוס', ic: 'M3 7h18v10H3zM7 11h1M11 11h1M15 11h1M8 14h8' },
    { k: 'hc', g: 'contrast', t: 'ניגודיות גבוהה', d: 'טקסט צהוב ולבן על שחור', ic: 'M12 3a9 9 0 100 18zM12 3a9 9 0 010 18' },
    { k: 'inv', g: 'contrast', t: 'ניגודיות הפוכה', d: 'היפוך צבעים', ic: 'M12 3v18M4 12a8 8 0 0116 0 8 8 0 01-16 0' },
    { k: 'light', g: 'contrast', t: 'רקע בהיר', d: 'שחור על לבן, ללא צבעים', ic: 'M12 4v2M12 18v2M4 12h2M18 12h2M12 8a4 4 0 100 8 4 4 0 000-8z' },
    { k: 'gray', g: 'contrast', t: 'גווני אפור', d: 'ללא צבעים', ic: 'M4 4h16v16H4zM4 12h16M12 4v16' },
    { k: 'sat', g: 'contrast', t: 'רוויה נמוכה', d: 'צבעים רכים', ic: 'M12 3s6 6 6 11a6 6 0 01-12 0c0-5 6-11 6-11z' },
    { k: 'links', t: 'הדגשת קישורים', d: 'קו תחתון ומסגרת לכל קישור וכפתור', ic: 'M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1' },
    { k: 'heads', t: 'הדגשת כותרות', d: 'מסגרת סביב כותרות', ic: 'M6 4v16M18 4v16M6 12h12' },
    { k: 'font', t: 'גופן קריא', d: 'Arial במקום הגופן המעוצב', ic: 'M5 20L12 4l7 16M8 14h8' },
    { k: 'lh', t: 'ריווח שורות', d: 'מרווח גדול בין שורות', ic: 'M10 6h10M10 12h10M10 18h10M4 4v16M2 6l2-2 2 2M2 18l2 2 2-2' },
    { k: 'ls', t: 'ריווח אותיות', d: 'מרווח גדול בין אותיות', ic: 'M3 18L7 6l4 12M4.5 14h5M14 6v12M20 6v12M14 12h6' },
    { k: 'align', t: 'יישור לימין', d: 'כל הטקסט מיושר לימין', ic: 'M4 6h16M8 10h12M4 14h16M8 18h12' },
    { k: 'still', t: 'עצירת אנימציות', d: 'ללא תנועה והבהובים', ic: 'M7 5h4v14H7zM13 5h4v14h-4z' },
    { k: 'cursor', g: 'cursor', t: 'סמן גדול שחור', d: 'סמן עכבר מוגדל', ic: 'M5 3l14 8-6 2-2 6z' },
    { k: 'cursorw', g: 'cursor', t: 'סמן גדול לבן', d: 'סמן עכבר מוגדל בהיר', ic: 'M5 3l14 8-6 2-2 6z' },
    { k: 'guide', t: 'סרגל קריאה', d: 'פס שעוקב אחרי העכבר', ic: 'M3 10h18v4H3z' },
    { k: 'mask', t: 'מסכת קריאה', d: 'מחשיך הכול חוץ מהשורה הנקראת', ic: 'M3 4h18v6H3zM3 14h18v6H3z' },
    { k: 'noimg', t: 'הסתרת תמונות', d: 'הסתרת איורים ותמונות', ic: 'M4 5h16v14H4zM4 15l5-5 5 5M14 13l2-2 4 4M3 3l18 18' },
    { k: 'tts', t: 'הקראת טקסט', d: 'לחצו על טקסט כדי לשמוע אותו', ic: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 010 6M19 6a8 8 0 010 12' },
    { k: 'tips', t: 'תיאור רכיבים', d: 'מציג את שם הכפתור במעבר עכבר', ic: 'M4 4h16v12H8l-4 4zM8 9h8M8 12h5' },
  ];
  const ICON = d => `<svg viewBox="0 0 24 24" width="22" height="22" style="width:22px;height:22px" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

  /* ---- UI ---- */
  const fab = document.createElement('button');
  fab.className = 'a11y-fab'; fab.type = 'button';
  fab.setAttribute('aria-label', 'תפריט נגישות (Alt+A)'); fab.setAttribute('aria-haspopup', 'dialog'); fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" style="width:28px;height:28px" fill="currentColor" aria-hidden="true"><circle cx="12" cy="4" r="2"/><path d="M19 8.5c-2.2.6-4.6.9-7 .9s-4.8-.3-7-.9l-.5 1.9c1.9.5 3.8.8 5.5.9V22h2v-5h2v5h2V11.3c1.7-.1 3.6-.4 5.5-.9z"/></svg>`;

  const panel = document.createElement('div');
  panel.className = 'a11y'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'a11y-title');
  panel.innerHTML = `
    <div class="a11y__head">
      <h2 id="a11y-title">הגדרות נגישות</h2>
      <button type="button" class="a11y__x" aria-label="סגירת תפריט הנגישות">✕</button>
    </div>
    <div class="a11y__body">
      <div class="a11y__size" role="group" aria-label="גודל טקסט">
        <span>גודל טקסט</span>
        <button type="button" data-z="-1" aria-label="הקטנת טקסט">א-</button>
        <output id="a11y-z" aria-live="polite">100%</output>
        <button type="button" data-z="1" aria-label="הגדלת טקסט">א+</button>
      </div>
      <div class="a11y__grid">${T.map(o => `<button type="button" class="a11y__opt" data-k="${o.k}" aria-pressed="false">${ICON(o.ic)}<b>${o.t}</b><small>${o.d}</small></button>`).join('')}</div>
      <button type="button" class="a11y__reset">איפוס כל ההגדרות</button>
      <nav class="a11y__links" aria-label="מידע נגישות">
        <a href="accessibility.html">הצהרת נגישות</a>
        <a href="accessibility.html#contact">דיווח על בעיית נגישות</a>
      </nav>
      <p class="a11y__note">האתר מותאם לתקן הישראלי 5568 ולהנחיות WCAG 2.0 ברמה AA. קיצור מקלדת: Alt+A</p>
    </div>`;
  const guide = document.createElement('div'); guide.className = 'a11y-rguide'; guide.setAttribute('aria-hidden', 'true');
  const mask = document.createElement('div'); mask.className = 'a11y-rmask'; mask.setAttribute('aria-hidden', 'true'); mask.innerHTML = '<i></i><i></i>';
  const tip = document.createElement('div'); tip.className = 'a11y-tip'; tip.setAttribute('aria-hidden', 'true');
  const live = document.createElement('div'); live.className = 'sr-only'; live.setAttribute('aria-live', 'polite');
  document.body.append(fab, panel, guide, mask, tip, live);

  const ZOOMS = [100, 112, 125, 140, 160, 180, 200];
  function apply() {
    T.forEach(o => {
      root.classList.toggle('a11y-' + o.k, !!st[o.k]);
      const b = panel.querySelector(`[data-k="${o.k}"]`); if (b) b.setAttribute('aria-pressed', st[o.k] ? 'true' : 'false');
    });
    const z = ZOOMS[st.z || 0] || 100;
    root.style.setProperty('--a11y-z', z / 100);
    root.classList.toggle('a11y-zoom', z !== 100);
    panel.querySelector('#a11y-z').textContent = z + '%';
    fab.classList.toggle('on', Object.keys(st).some(k => st[k]));
    if (window.speechSynthesis && !st.tts) { /* leave the narrator alone */ }
  }
  function toggle(k) {
    const o = T.find(x => x.k === k); if (!o) return;
    const on = !st[k];
    if (on && o.g) T.filter(x => x.g === o.g).forEach(x => delete st[x.k]);
    if (on) st[k] = 1; else delete st[k];
    save(st); apply();
    live.textContent = `${o.t} ${on ? 'הופעל' : 'כובה'}`;
  }
  function open() { panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); panel.querySelector('.a11y__x').focus(); }
  function close() { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); fab.focus(); }

  fab.addEventListener('click', () => panel.hidden ? open() : close());
  panel.querySelector('.a11y__x').addEventListener('click', close);
  panel.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.k) toggle(b.dataset.k);
    else if (b.dataset.z) { st.z = Math.max(0, Math.min(ZOOMS.length - 1, (st.z || 0) + +b.dataset.z)); if (!st.z) delete st.z; save(st); apply(); live.textContent = 'גודל טקסט ' + ZOOMS[st.z || 0] + '%'; }
    else if (b.classList.contains('a11y__reset')) { st = {}; save(st); apply(); live.textContent = 'ההגדרות אופסו'; }
  });
  document.addEventListener('click', e => { const o = e.target.closest('[data-a11y-open]'); if (o) { e.preventDefault(); open(); } });
  document.addEventListener('keydown', e => {
    if (e.altKey && (e.key === 'a' || e.key === 'A' || e.key === 'ש')) { e.preventDefault(); panel.hidden ? open() : close(); }
    else if (e.key === 'Escape' && !panel.hidden) close();
    else if (e.key === 'Tab' && !panel.hidden && panel.contains(document.activeElement)) {
      // keep focus inside the open panel
      const f = [...panel.querySelectorAll('button,a,[tabindex]')].filter(x => !x.disabled);
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
    if (e.key === 'Tab') root.classList.add('a11y-tabbing');
  });
  document.addEventListener('mousedown', () => root.classList.remove('a11y-tabbing'));

  // reading guide and mask follow the pointer
  document.addEventListener('pointermove', e => {
    if (st.guide) guide.style.transform = `translateY(${e.clientY - 6}px)`;
    if (st.mask) { mask.children[0].style.height = Math.max(0, e.clientY - 40) + 'px'; mask.children[1].style.top = (e.clientY + 40) + 'px'; }
    if (st.tips) {
      const el = e.target.closest && e.target.closest('[aria-label],[title],button,a');
      const t = el && !panel.contains(el) ? (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent.trim()).slice(0, 80) : '';
      tip.textContent = t; tip.style.display = t ? 'block' : 'none';
      tip.style.transform = `translate(${Math.min(innerWidth - 40, e.clientX + 14)}px,${e.clientY + 18}px)`;
    }
  }, { passive: true });

  // read text aloud on click
  document.addEventListener('click', e => {
    if (!st.tts || !window.speechSynthesis || panel.contains(e.target) || e.target === fab) return;
    const el = e.target.closest('p,h1,h2,h3,h4,li,b,small,span,a,button,label,figcaption'); if (!el) return;
    const t = (el.getAttribute('aria-label') || el.innerText || '').trim(); if (!t) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t.slice(0, 400)); u.lang = 'he-IL';
      const v = speechSynthesis.getVoices().find(v => /^he|^iw/i.test(v.lang)); if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (err) {}
  }, true);

  apply();
  window.PodA11y = { open, close, toggle, get state() { return { ...st }; } };
})();
