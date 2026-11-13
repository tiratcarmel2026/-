/* podtc — municipal portal layer: both logos in the masthead, welcome banner with search,
 * round "quick actions" row, and the voice studio (narrator styles + every Hebrew voice on the device). */
(function () {
  const A = window.PodApp, N = window.Narrator, $ = s => document.querySelector(s);
  if (!A) return;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ic = (n, s) => window.PodIcons ? PodIcons.svg(n, s || 22) : '';
  const MUNI = 'https://www.tirat-carmel.muni.il/';

  /* ---------- masthead: podtc + the municipality's logo ---------- */
  const logo = $('.top__logo');
  if (logo) logo.insertAdjacentHTML('afterend', `<span class="top__sep" aria-hidden="true"></span>
    <a class="top__muni" href="${MUNI}" target="_blank" rel="noopener" aria-label="אתר עיריית טירת כרמל"><img src="assets/muni-logo.png" alt="עיריית טירת כרמל: סביבה טובה בין כרמל לים"></a>`);
  const fl = $('.foot__logo'); if (fl) fl.insertAdjacentHTML('afterend', `<img class="foot__muni" src="assets/muni-logo.png" alt="עיריית טירת כרמל">`);

  /* ---------- welcome banner + quick actions ---------- */
  const inner = $('.home__inner'), dl = $('.dateline');
  const go = id => { const el = document.getElementById(id); if (el) { el.classList.add('in'); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
  const QA = [
    ['phone', 'מוקד 106', 'tel:106'], ['bus', 'אוטובוסים', '#bus-block'], ['news', 'לוח מודעות', '#board-block'], ['sun', 'מזג אוויר', '#live'],
    ['radio', 'רדיו חי', '#radio'], ['walk', 'סיורים', '#tours-block'], ['card', 'תשלומים', MUNI + 'Sservice/Pages/Payments.aspx'], ['pin', 'מפת העיר', '@map'],
    ['camera', 'גלריה', '#gallery-block'], ['building', 'על העיר', '#city-block'], ['mic', 'קולות', '@voice'], ['people', 'נגישות', '@a11y']
  ];
  if (dl) {
    dl.insertAdjacentHTML('beforebegin', `<nav class="qa" aria-label="פעולות מהירות"><h2 class="qa__h">פעולות מהירות</h2><div class="qa__row">${QA.map(([i, t, u]) =>
        u.startsWith('#') || u.startsWith('@') ? `<button class="qa__i" data-qa="${u}"><span>${ic(i, 26)}</span><b>${t}</b></button>`
          : `<a class="qa__i" href="${u}" ${u.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}><span>${ic(i, 26)}</span><b>${t}</b></a>`).join('')}</div></nav>`);
    const hs = $('#hsearch'), qa = $('.qa'); if (hs && qa) qa.insertAdjacentElement('beforebegin', hs);   // search first, then quick actions
  }
  // a resident's priorities first: notices, services and buses come right after the news
  (function order() { const ref = document.getElementById('articles-block'); if (!ref) return; let after = ref.nextElementSibling && ref.nextElementSibling.classList.contains('notice') ? ref.nextElementSibling : ref;
    ['services', 'bus-block', 'board-block'].forEach(id => { const el = document.getElementById(id); if (el) { after.insertAdjacentElement('afterend', el); after = el; } }); })();
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-qa]'); if (!b) return; const u = b.dataset.qa;
    if (u === '@map') { const t = document.querySelector('.tab[data-view="map"]'); if (t) t.click(); }
    else if (u === '@voice') openVoice();
    else if (u === '@a11y') { window.PodA11y && PodA11y.open(); }
    else go(u.slice(1));
  });

  /* ---------- voice studio ---------- */
  // Narration uses the voices installed on the listener's device. Styles combine pitch and pace,
  // so even a phone with a single Hebrew voice gets several distinct narrators.
  const STYLES = [
    { id: 'news', t: 'קריין חדשות', d: 'ברור, ענייני וקצבי', pitch: 1, rate: 1.05, icon: 'news' },
    { id: 'story', t: 'מספר סיפורים', d: 'חם, רגוע ואיטי יותר', pitch: 0.92, rate: 0.88, icon: 'book' },
    { id: 'deep', t: 'קול עמוק', d: 'נמוך וסמכותי', pitch: 0.7, rate: 0.92, icon: 'mic' },
    { id: 'bright', t: 'צעיר ונמרץ', d: 'גבוה ומהיר', pitch: 1.25, rate: 1.12, icon: 'star' },
    { id: 'calm', t: 'רגוע מאוד', d: 'איטי, להאזנה נינוחה', pitch: 0.98, rate: 0.78, icon: 'moon' },
    { id: 'kids', t: 'לילדים', d: 'גבוה, עליז ואיטי', pitch: 1.4, rate: 0.9, icon: 'game' },
    { id: 'quick', t: 'ממהרים', d: 'מהיר במיוחד', pitch: 1, rate: 1.4, icon: 'timer' },
    { id: 'std', t: 'רגיל', d: 'ברירת המחדל', pitch: 1, rate: 0.95, icon: 'headphones' }
  ];
  const ls = { get: (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const pretty = v => { const n = v.name.replace(/Microsoft |Google |Apple |\(.*?\)|- Hebrew|Hebrew|Online|Natural/gi, ' ').replace(/\s+/g, ' ').trim(); return (n || v.name) + (/natural|online|neural/i.test(v.name) ? ' · טבעי' : ''); };
  document.body.insertAdjacentHTML('beforeend', `<div id="voice-sheet" class="share-sheet voice-sheet" hidden role="dialog" aria-modal="true" aria-labelledby="vs-title">
      <div class="share-sheet__card"><button class="x share-sheet__x" aria-label="סגירה">✕</button>
        <span class="ss-k">אולפן הקולות</span><h2 id="vs-title">בחרו את הקריין שלכם</h2>
        <h3 class="vs-h">מי מקריא</h3><div class="vs-narr" id="vs-narr" role="group" aria-label="מי מקריא"></div><h3 class="vs-h">סגנון הקול האוטומטי <small>לפרקים שעוד לא הוקלטו</small></h3><div class="vs-styles" id="vs-styles"></div>
        <h3 class="vs-h">קולות במכשיר <small id="vs-count"></small></h3><div class="vs-voices" id="vs-voices"></div>
        <div class="vs-fine">
          <label>גובה הקול <input type="range" id="vs-pitch" min="0.5" max="1.6" step="0.05"><output id="vs-pitch-o"></output></label>
          <label>מהירות <input type="range" id="vs-rate" min="0.6" max="1.6" step="0.05"><output id="vs-rate-o"></output></label>
          <label class="vs-music"><input type="checkbox" id="vs-music"> מוזיקת רקע ואות פתיחה</label>
        </div>
        <details class="vs-tip"><summary>רוצים קולות נוספים וטבעיים יותר?</summary>
          <p><b>אנדרואיד:</b> הגדרות ← נגישות ← המרת טקסט לדיבור ← מנוע Google ← התקנת נתוני קול ← עברית. שם אפשר לבחור בין כמה קולות.</p>
          <p><b>אייפון:</b> הגדרות ← נגישות ← תוכן מוקרא ← קולות ← עברית, והורידו את "כרמית (משופר)".</p>
          <p><b>מחשב:</b> בדפדפן Edge יש קולות עבריים טבעיים (אברי והילה) בלי התקנה.</p></details>
      </div></div>`);
  const sheet = $('#voice-sheet');
  function paint() {
    if (!N) return;
    const cur = ls.get('podtc.vstyle', 'std');
    const P = A.PLACES, nF = P.filter(p => p.audioF || p.audio).length, nM = P.filter(p => p.audioM || p.audio).length, nr = N.narr || 'f';
    $('#vs-narr').innerHTML = [['f', 'קריינית', nF], ['m', 'קריין', nM], ['tts', 'קול המכשיר', null]].map(([k, t, n]) => `<button class="vnarr${k === nr ? ' on' : ''}" data-narr="${k}" aria-pressed="${k === nr}"><b>${t}</b><small>${n == null ? 'הקראה אוטומטית' : n ? `${n} מתוך ${P.length} פרקים מוקלטים` : 'ההקלטות בדרך'}</small></button>`).join('');
    $('#vs-styles').innerHTML = STYLES.map(s => `<button class="vstyle${s.id === cur ? ' on' : ''}" data-vs="${s.id}">${ic(s.icon, 22)}<b>${s.t}</b><small>${s.d}</small></button>`).join('');
    const he = N.supported ? N.hebrewVoices() : [];
    $('#vs-count').textContent = he.length ? `${he.length} קולות עבריים` : '';
    $('#vs-voices').innerHTML = he.length ? he.map(v => `<div class="vvoice${N.voice && N.voice.voiceURI === v.voiceURI ? ' on' : ''}">
        <button class="vvoice__pick" data-vv="${esc(v.voiceURI)}"><b>${esc(pretty(v))}</b><small>${esc(v.lang)}${v.localService === false ? ' · מקוון' : ''}</small></button>
        <button class="vvoice__try" data-vt="${esc(v.voiceURI)}" aria-label="השמעת דוגמה: ${esc(pretty(v))}">▶</button></div>`).join('')
      : `<p class="vs-empty">${N.supported ? 'לא נמצא קול עברי במכשיר. ראו את ההסבר למטה כדי להתקין אחד.' : 'הדפדפן לא תומך בהקראה. אפשר לקרוא את התמליל של כל פרק.'}</p>`;
    $('#vs-pitch').value = N.pitch; $('#vs-pitch-o').textContent = (+N.pitch).toFixed(2);
    $('#vs-rate').value = N.rate; $('#vs-rate-o').textContent = '×' + (+N.rate).toFixed(2);
    $('#vs-music').checked = ls.get('podtc.music', '1') !== '0';
    const rl = $('#rate-label'); if (rl) rl.textContent = '×' + (+N.rate).toFixed(2).replace(/0$/, '');
    const st = STYLES.find(s => s.id === cur), vl = $('#voice-label'); if (vl && st) vl.textContent = st.id === 'std' ? 'קול' : st.t;
    document.querySelectorAll('.np-speed [data-rate]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.rate === +N.rate)));
  }
  const SAMPLE = 'שלום, כאן podtc. כך אני נשמע כשאני מספר על טירת כרמל.';
  function openVoice() { paint(); sheet.hidden = false; setTimeout(() => sheet.querySelector('.vstyle').focus(), 50); }
  function closeVoice() { sheet.hidden = true; }
  sheet.addEventListener('click', e => {
    if (e.target === sheet || e.target.closest('.share-sheet__x')) return closeVoice();
    const nb = e.target.closest('[data-narr]'); if (nb) { N.setNarr(nb.dataset.narr); paint(); const c = A.current, on = A.isActive && A.isActive();
      A.toast(nb.dataset.narr === 'tts' ? 'הפרקים יוקראו בקול המכשיר' : c && N.recording(c) ? (on ? 'הקול יתחלף מהפרק הבא' : 'נבחר. לחצו הפעלה כדי לשמוע') : 'נבחר. פרקים שעוד לא הוקלטו יוקראו בקול המכשיר'); return; }
    const s = e.target.closest('[data-vs]'), v = e.target.closest('[data-vv]'), t = e.target.closest('[data-vt]');
    if (s) { const st = STYLES.find(x => x.id === s.dataset.vs); ls.set('podtc.vstyle', st.id); N.setPitch(st.pitch); N.setRate(st.rate); paint(); N.preview(SAMPLE) || A.toast(`${st.t}: יופעל מהמשפט הבא`); }
    else if (v) { N.setVoice(v.dataset.vv); paint(); N.preview(SAMPLE) || A.toast('הקול החדש יופעל מהמשפט הבא'); }
    else if (t) { const keep = N.voice && N.voice.voiceURI; N.setVoice(t.dataset.vt); if (!N.preview(SAMPLE)) A.toast('עצרו את הפרק כדי לשמוע דוגמה'); if (keep) setTimeout(() => { N.setVoice(keep); paint(); }, 200); }
  });
  $('#vs-pitch').addEventListener('input', e => { N.setPitch(+e.target.value); ls.set('podtc.vstyle', 'custom'); $('#vs-pitch-o').textContent = (+e.target.value).toFixed(2); });
  $('#vs-rate').addEventListener('input', e => { N.setRate(+e.target.value); ls.set('podtc.vstyle', 'custom'); $('#vs-rate-o').textContent = '×' + (+e.target.value).toFixed(2); });
  $('#vs-pitch').addEventListener('change', () => { paint(); N.preview(SAMPLE); });
  $('#vs-rate').addEventListener('change', () => { paint(); N.preview(SAMPLE); });
  $('#vs-music').addEventListener('change', e => { ls.set('podtc.music', e.target.checked ? '1' : '0'); if (N.setMusic) N.setMusic(e.target.checked); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeVoice(); });
  if (N && N.on) N.on('voices', () => { if (!sheet.hidden) paint(); });
  // the player's voice button and the library's voice box open the studio
  const bv = $('#btn-voice'); if (bv) bv.addEventListener('click', e => { e.stopImmediatePropagation(); openVoice(); }, true);
  const vb = document.querySelector('.voice-box'); if (vb) vb.insertAdjacentHTML('beforeend', `<button class="mini-btn vs-open" data-qa="@voice">אולפן הקולות: 8 סגנונות קריינות</button>`);
  /* ---------- opening screen: logos only for 3 seconds, then straight into the site ---------- */
  (function intro() {
    const sp = $('#splash'), btn = $('#btn-start'); if (!sp || !btn || sp.hidden) return;
    const deep = A.PLACES.some(p => '#' + p.id === location.hash);
    if (deep) { sp.classList.remove('splash--auto'); const d = sp.querySelector('.splash__dots'); if (d) d.remove(); return; }   // QR / shared episode: sound needs one tap, so that screen keeps its button
    let done = false;
    const enter = () => { if (done) return; done = true; btn.click(); };
    const t = setTimeout(enter, 3000);
    sp.addEventListener('click', () => { clearTimeout(t); enter(); });
    // browsers allow sound only after a touch: unlock the narrator on the first one
    const unlock = () => { try { N && N.unlock(); } catch (e) {} };
    document.addEventListener('pointerdown', unlock, { once: true, capture: true });
    document.addEventListener('keydown', unlock, { once: true, capture: true });
  })();

  /* ---------- carousels: right / left buttons on every scrolling row of episodes ---------- */
  (function carousels() {
    const home = $('#home'); if (!home) return;
    const arrow = d => `<svg viewBox="0 0 24 24" width="22" height="22" style="width:22px;height:22px" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
    function sync(row) {
      const box = row.parentElement, pv = box.querySelector(':scope > .car--prev'), nx = box.querySelector(':scope > .car--next'); if (!pv || !nx) return;
      const max = row.scrollWidth - row.clientWidth, pos = Math.abs(row.scrollLeft), scrolls = max > 8 && getComputedStyle(row).overflowX !== 'visible';
      pv.hidden = nx.hidden = !scrolls; if (!scrolls) return;
      pv.disabled = pos < 20; nx.disabled = pos > max - 20;
      const art = row.querySelector('.tile__art, .tour-tile__art, .cover'), h = art ? art.getBoundingClientRect().height : row.clientHeight;
      const top = row.offsetTop + Math.max(22, h / 2) + 'px'; pv.style.top = nx.style.top = top;
    }
    function attach(row) {
      if (row.dataset.car) return; const box = row.parentElement; if (!box) return;
      row.dataset.car = 1; box.classList.add('has-car');
      const name = (box.querySelector('h2, h3') || {}).textContent || 'פרקים';
      // RTL: the list starts on the right, so "next" moves left
      box.insertAdjacentHTML('beforeend', `<button class="car car--prev" type="button" aria-label="הקודמים: ${esc(name.trim())}">${arrow('M9 6l6 6-6 6')}</button><button class="car car--next" type="button" aria-label="הבאים: ${esc(name.trim())}">${arrow('M15 6l-6 6 6 6')}</button>`);
      const step = dir => row.scrollBy({ left: dir * Math.max(240, row.clientWidth * .85), behavior: 'smooth' });
      box.querySelector(':scope > .car--prev').addEventListener('click', () => step(1));
      box.querySelector(':scope > .car--next').addEventListener('click', () => step(-1));
      row.addEventListener('scroll', () => sync(row), { passive: true });
      sync(row);
    }
    const scan = () => document.querySelectorAll('#home .shelf__row, #now .shelf__row').forEach(r => { attach(r); sync(r); });
    let t = 0; const later = () => { if (!t) t = setTimeout(() => { t = 0; scan(); }, 150); };
    new MutationObserver(later).observe(home, { childList: true, subtree: true });
    const now = $('#now'); if (now) new MutationObserver(later).observe(now, { childList: true, subtree: true });
    window.addEventListener('resize', later); window.addEventListener('pod:select', later);
    scan(); setTimeout(scan, 1200);
  })();

  window.PodVoice = { open: openVoice, STYLES };
  if (window.PodIcons) PodIcons.hydrate();
})();
