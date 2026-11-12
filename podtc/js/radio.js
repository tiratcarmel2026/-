/* podtc — "digital radio" front: the layout of the approved mock-up.
 * Utility bar · text logo + main nav + LIVE button · "what's new" strip · welcome card + PODTC radio card ·
 * three-point strip · "latest news" · full-width player bar with time, volume and link. */
(function () {
  const A = window.PodApp, N = window.Narrator, CFG = window.PODTC_CONFIG || {}, $ = s => document.querySelector(s);
  if (!A) return;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ic = (n, s) => window.PodIcons ? PodIcons.svg(n, s || 20) : '';
  const PLAY = '<svg viewBox="0 0 24 24" width="16" height="16" style="width:16px;height:16px;fill:currentColor;stroke:none" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  const MIC = s => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" style="width:${s}px;height:${s}px" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M8.5 21h7"/></svg>`;
  const home = $('#home'), inner = $('.home__inner'), top = $('.top');
  const go = id => { const el = document.getElementById(id); if (!el) return; const hv = document.querySelector('.tab[data-view="home"]'); if (hv && !document.body.classList.contains('view-home')) hv.click(); el.classList.add('in'); setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); };
  const FB = (CFG.social && CFG.social.facebook) || 'TCarmel.muni';

  /* ---------- "PODTC radio": every episode, one after the other, non-stop ---------- */
  function playRadio() {
    const cur = A.current && !A.current.live ? A.current.id : null;
    if (A.isActive && A.isActive()) { const b = $('#mini-play'); if (b) b.click(); return; }       // already on air: pause / resume
    const ids = A.PLACES.map(p => p.id); const start = cur ? ids.indexOf(cur) : new Date().getDate() % ids.length;
    A.playQueue(ids.slice(start).concat(ids.slice(0, start)), 'רדיו PODTC');
    const close = $('#now-close'); if (close) setTimeout(() => close.click(), 50);                 // stay on the page; the bar at the bottom is the player
  }

  /* ---------- masthead ---------- */
  if (top) {
    const oldLogo = top.querySelector('.top__logo');
    const logo = `<a class="rlogo rlogo--img" href="./" aria-label="podtc, דף הבית"><img class="top__logo" src="assets/wordmark-navy.png" alt="podtc"></a>`;
    if (oldLogo) oldLogo.outerHTML = logo; else top.insertAdjacentHTML('afterbegin', logo);
    top.insertAdjacentHTML('afterbegin', `<div class="util"><div class="util__in">
        <span class="util__r"><i class="util__dot"></i><b>הקול של העיר, בכל מקום</b><span class="util__sep">|</span><span>חדשות • פודקאסטים • רדיו</span></span>
        <span class="util__l"><a href="https://www.facebook.com/${FB}" target="_blank" rel="noopener">עקבו אחרינו</a><button data-rgo="sections">פודקאסטים</button><button data-rgo="articles-block">חדשות</button></span></div></div>`);
    const muni = top.querySelector('.top__muni');
    (muni || top.querySelector('.rlogo')).insertAdjacentHTML('afterend', `<nav class="mnav" aria-label="ניווט ראשי">
        <button class="on" data-rgo="@top">ראשי</button><button data-rgo="articles-block">חדשות</button><button data-rgo="sections">פודקאסטים</button><button data-rgo="radio">רדיו חי</button><button data-rgo="@map">מפה</button><button data-rgo="@contact">צרו קשר</button></nav>`);
    top.insertAdjacentHTML('beforeend', `<button class="rlive" id="rlive" aria-label="האזינו לרדיו PODTC">${PLAY}<span>האזינו לרדיו</span><b>LIVE</b></button>`);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-rgo]'); if (!b) return; const t = b.dataset.rgo;
    if (t === '@map') { const m = document.querySelector('.tab[data-view="map"]'); if (m) m.click(); }
    else if (t === '@top') { const h = document.querySelector('.tab[data-view="home"]'); if (h) h.click(); home.scrollTo({ top: 0, behavior: 'smooth' }); }
    else if (t === '@contact') { const f = $('#foot-feedback'); if (f) f.click(); else go('links-block'); }
    else if (t === '@radio') playRadio();
    else go(t);
    if (b.closest('.mnav')) document.querySelectorAll('.mnav button').forEach(x => x.classList.toggle('on', x === b));
  });
  const rl = $('#rlive'); if (rl) rl.addEventListener('click', playRadio);

  /* ---------- "what's new" strip ---------- */
  const tk = $('.ticker');
  if (tk) { const lab = tk.querySelector('.ticker__label'); if (lab) lab.innerHTML = 'מה חדש?'; tk.insertAdjacentHTML('beforeend', '<span class="ticker__brand">PODTC DIGITAL RADIO</span>'); }

  /* ---------- welcome card + radio card ---------- */
  const bars = Array.from({ length: 10 }, (_, i) => `<i style="--h:${[34, 58, 44, 70, 52, 84, 62, 40, 66, 48][i]}%;--d:${(0.9 + (i % 4) * .25).toFixed(2)}s"></i>`).join('');
  inner.insertAdjacentHTML('afterbegin', `<section class="rhero" aria-label="ברוכים הבאים">
      <div class="rwel">
        <div class="rwel__arc" aria-hidden="true"></div>
        <svg class="rwel__mic" viewBox="0 0 120 180" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><g transform="rotate(-14 60 60)"><rect x="38" y="8" width="44" height="96" rx="22"/><path d="M40 40h14M40 54h14M40 68h14M66 40h14M66 54h14M66 68h14"/><path d="M24 78a36 36 0 0072 0"/></g><path d="M74 124l10 46M56 176l52 -12"/></svg>
        <div class="rwel__bars" aria-hidden="true">${bars}</div>
        <div class="rwel__in">
          <span class="rwel__k">ברוכים הבאים ל־PODTC</span>
          <h1>העיר מדברת.<br><em>אנחנו מקשיבים.</em></h1>
          <p>כל מה שקורה בעיר, כל הסיפורים שמאחורי הכותרות, האנשים והקולות — במקום אחד.</p>
          <div class="rwel__btns"><button class="rbtn rbtn--pri" data-rgo="@radio">${PLAY}<span>האזנה לרדיו</span></button><button class="rbtn rbtn--out" data-rgo="sections"><span>לכל הפודקאסטים</span><span aria-hidden="true">←</span></button></div>
        </div>
      </div>
      <div class="rrad">
        <div class="rrad__head"><span class="rrad__tag"><i></i>תחנת הרדיו של PODTC</span><span class="rrad__en">DIGITAL RADIO</span></div>
        <div class="rrad__orb" aria-hidden="true"><span class="rrad__ring"></span><span class="rrad__ring rrad__ring--2"></span><span class="rrad__core">${MIC(46)}</span><i class="rrad__spark"></i><i class="rrad__dot"></i></div>
        <h2>רדיו PODTC</h2>
        <p class="rrad__sub">סיפורים, אנשים, מקומות וכל מה שביניהם</p>
        <div class="rrad__player"><span class="rrad__eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="rrad__st" id="rrad-st" aria-live="polite">מוכן לשידור</span><button class="rrad__play" id="rrad-play" aria-label="הפעלת רדיו PODTC">${PLAY}</button></div>
      </div>
    </section>
    <ul class="rpoints"><li><b>מקום אחד</b> לכל החדשות</li><li><b>קולות מקומיים</b> בפודקאסטים</li><li><b>ללא הפסקה</b> ברדיו PODTC</li></ul>`);
  $('#rrad-play').addEventListener('click', playRadio);

  /* ---------- section order and English eyebrows, like the mock-up ---------- */
  const pts = $('.rpoints'), arts = document.getElementById('articles-block');
  if (pts && arts) { pts.insertAdjacentElement('afterend', arts); const h = arts.querySelector('h2'); if (h) h.innerHTML = 'החדשות האחרונות'; arts.querySelector('.shelf__h').insertAdjacentHTML('beforeend', `<a class="rall" href="https://news.google.com/search?q=%22%D7%98%D7%99%D7%A8%D7%AA%20%D7%9B%D7%A8%D7%9E%D7%9C%22&hl=he&gl=IL&ceid=IL:he" target="_blank" rel="noopener">לכל החדשות ←</a>`); }
  const secs = document.getElementById('sections');
  if (secs) secs.insertAdjacentHTML('beforebegin', `<div class="rtitle" id="podcasts-title"><span class="eyebrow">PODCASTS</span><h2>הפודקאסטים שלנו</h2><p>35 פרקים קצרים על המקומות, האנשים והסיפורים של טירת כרמל</p></div>`);
  const EYE = { 'articles-block': 'NEWS & STORIES', 'near-block': 'NEAR YOU', 'top10-block': "EDITOR'S PICKS", 'tours-block': 'AUDIO TOURS', 'browse-block': 'TOPICS', 'shorts-block': 'SHORT EPISODES', 'recent-block': 'RECENTLY PLAYED',
    'fav-block': 'YOUR FAVOURITES', 'board-block': 'NOTICE BOARD', 'bus-block': 'PUBLIC TRANSPORT', services: 'CITY SERVICES', live: 'LIVE NOW', radio: 'LIVE RADIO', 'city-block': 'ABOUT THE CITY', future: 'THE CITY OF TOMORROW',
    kids: 'KIDS', social: 'SOCIAL', 'gallery-block': 'GALLERY', 'links-block': 'USEFUL LINKS' };
  Object.keys(EYE).forEach(id => { const s = document.getElementById(id); if (!s || s.querySelector('.eyebrow')) return; const h = s.querySelector('.shelf__h, .kicker, h2'); if (h) h.insertAdjacentHTML('beforebegin', `<span class="eyebrow">${EYE[id]}</span>`); });

  /* ---------- the player bar: time, progress knob, volume, link ---------- */
  const mini = $('#mini');
  if (mini) {
    mini.insertAdjacentHTML('beforeend', `<span class="mtime" id="mt-el">00:00</span><span class="mtime mtime--r" id="mt-rem">00:00</span>
      <span class="mvol"><span aria-hidden="true">${ic('radio', 18)}</span><input type="range" id="mvol" min="0" max="1" step="0.05" value="1" aria-label="עוצמת קול"></span>
      <button class="mlink" id="mlink" aria-label="העתקת קישור לפרק">${ic('link', 20)}</button>`);
    const vi = mini.querySelector('.mvol span'); if (vi) vi.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" style="width:18px;height:18px" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9zM16.5 9.5a4 4 0 010 5"/></svg>';
    const fmt = s => { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
    const total = () => { const c = A.current; return c && c.script ? c.script.split(/\s+/).length / 120 * 60 / ((N && N.rate) || 1) : 0; };
    const paint = f => { const T = total(); $('#mt-el').textContent = fmt(f * T); $('#mt-rem').textContent = fmt(T); };
    if (N && N.on) { N.on('progress', paint); N.on('state', s => {
      const on = s === 'playing' || s === 'skipping', st = $('#rrad-st'), c = A.current;
      if (st) st.textContent = on && c ? `משדר עכשיו: ${c.title}` : s === 'paused' ? 'השידור מושהה' : 'מוכן לשידור';
      document.body.classList.toggle('on-air', on);
      const b = $('#rrad-play'); if (b) b.setAttribute('aria-label', on ? 'השהיית רדיו PODTC' : 'הפעלת רדיו PODTC');
    }); }
    window.addEventListener('pod:select', () => setTimeout(() => paint(0), 0)); paint(0);
    // volume: live radio and mp3 directly; the narrator through each utterance
    let vol = 1; try { vol = parseFloat(localStorage.getItem('podtc.vol')) || 1; } catch (e) {}
    const applyVol = () => { document.querySelectorAll('audio').forEach(a => { a.volume = vol; }); };
    const slider = $('#mvol'); slider.value = vol; applyVol();
    slider.addEventListener('input', () => { vol = +slider.value; try { localStorage.setItem('podtc.vol', String(vol)); } catch (e) {} applyVol(); });
    try { const ss = window.speechSynthesis, sp = ss && ss.speak; if (sp) ss.speak = function (u) { try { u.volume = vol; } catch (e) {} return sp.call(ss, u); }; } catch (e) {}
    $('#mlink').addEventListener('click', async () => {
      const c = A.current, url = location.origin + location.pathname + (c && !c.live && c.id !== 'briefing' ? '#' + c.id : '');
      try { await navigator.clipboard.writeText(url); A.toast('הקישור הועתק'); } catch (e) { prompt('העתיקו את הקישור:', url); }
    });
  }
  /* speech did not start on this device: say so clearly and offer the transcript, instead of music with no voice */
  if (N && N.on) N.on('silent', () => {
    const he = N.hebrewVoices ? N.hebrewVoices().length : 0;
    A.toast(he ? 'ההקראה לא התחילה. לחצו שוב על הפעלה, או קראו את התמליל' : 'אין במכשיר קול בעברית, ולכן אי אפשר להקריא. אפשר לקרוא את התמליל');
    A.openNow(); setTimeout(() => { const t = document.getElementById('transcript'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 400);
    if (!he && window.PodVoice) setTimeout(() => PodVoice.open(), 2600);
  });
  if (window.PodIcons) PodIcons.hydrate();
})();
