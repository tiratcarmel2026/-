/* podtc — news-style front page: daily story, live ticker, weather, sections, links, share & install. */
(function () {
  const A = window.PodApp; if (!A) return;
  const $ = s => document.querySelector(s);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const BASE = location.origin + location.pathname;
  const byId = id => A.PLACES.find(p => p.id === id);
  const excerpt = (ep, n = 170) => { const t = ep.script.replace(/\s+/g, ' '); return t.length > n ? t.slice(0, t.lastIndexOf(' ', n)) + '…' : t; };
  const thumb = (ep, cls = '') => { const c = A.catOf(ep).color; return `<span class="thumb ${cls}" style="--c:${c}">${ep.emoji}</span>`; };

  /* ================= views ================= */
  function setView(v) {
    if (v === 'library') { A.openLibrary(); return; }
    if (v === 'install') { install(); return; }
    document.body.classList.toggle('view-home', v === 'home');
    document.body.classList.toggle('view-map', v === 'map');
    document.querySelectorAll('.tab[data-view]').forEach(t => t.classList.toggle('on', t.dataset.view === v));
    if (v === 'map') setTimeout(() => A.invalidate(), 60);
    if (v === 'home') $('#home').scrollTop = $('#home').scrollTop; // keep position
  }
  document.querySelector('.tabbar').addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) setView(b.dataset.view); });

  /* ================= dateline: greeting, date, weather ================= */
  function dateline() {
    const h = new Date().getHours();
    $('#greet').textContent = h < 5 ? 'לילה טוב' : h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 21 ? 'ערב טוב' : 'לילה טוב';
    $('#today').textContent = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · טירת כרמל';
    streak();
  }
  function streak() {
    const n = A.streak();
    $('#streak').textContent = n >= 2 ? `🔥 רצף האזנה: ${n} ימים` : n === 1 ? '🔥 האזנתם היום, חזרו מחר להתחיל רצף' : '';
  }
  const WMO = c => c === 0 ? ['☀️', 'בהיר'] : c <= 2 ? ['⛅', 'מעונן חלקית'] : c === 3 ? ['☁️', 'מעונן'] : c <= 48 ? ['🌫️', 'ערפל']
    : c <= 57 ? ['🌦️', 'טפטוף'] : c <= 67 ? ['🌧️', 'גשם'] : c <= 77 ? ['❄️', 'שלג'] : c <= 82 ? ['🌦️', 'ממטרים'] : ['⛈️', 'סופת רעמים'];
  let weatherLine = '';
  async function weather() {
    try {
      const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=32.761&longitude=34.971&current=temperature_2m,weather_code,is_day,wind_speed_10m&timezone=Asia%2FJerusalem');
      const d = (await r.json()).current;
      let [icon, desc] = WMO(d.weather_code);
      if (!d.is_day && d.weather_code === 0) icon = '🌙';
      $('#w-icon').textContent = icon; $('#w-temp').textContent = Math.round(d.temperature_2m) + '°'; $('#w-desc').textContent = desc;
      weatherLine = `${icon} עכשיו בטירת כרמל: ${Math.round(d.temperature_2m)}°, ${desc}` +
        (d.weather_code < 50 && d.is_day ? '. מזג אוויר מצוין לסיור!' : d.weather_code >= 51 ? '. אולי סיור קצר עם מטרייה?' : '');
      ticker();
    } catch (e) { $('#weather').hidden = true; }
  }

  /* ================= ticker ================= */
  function ticker() {
    const newest = A.PLACES.slice(-6).reverse().map(p => `🆕 חדש באפליקציה: ${p.title}`);
    const items = [
      weatherLine,
      `🎧 ${A.PLACES.length} פרקים קצרים על טירת כרמל, בעברית`,
      ...newest.slice(0, 3),
      `🚶 ${A.TOURS.length} סיורים מודרכים מחכים לכם`,
      '🧠 ענו על החידון בסוף כל פרק וצברו נקודות',
      ...newest.slice(3),
      A.pos ? `📍 ${A.PLACES.filter(p => A.distance(A.pos.lat, A.pos.lng, p.lat, p.lng) < 1000).length} פרקים במרחק הליכה מכם` : '📍 הפעילו מיקום וגלו מה קרוב אליכם'
    ].filter(Boolean);
    const html = items.map(t => `<span class="ticker__item">${esc(t)}</span>`).join('');
    $('#ticker').innerHTML = html + html; // duplicated for a seamless loop
    $('#ticker').style.animationDuration = Math.max(30, items.length * 7) + 's';
  }

  /* ================= hero: episode of the day ================= */
  const dayIndex = () => { const d = new Date(); return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); };
  const heroEp = () => A.PLACES[dayIndex() % A.PLACES.length];
  function hero() {
    const ep = heroEp(), cat = A.catOf(ep);
    const d = A.pos ? A.distance(A.pos.lat, A.pos.lng, ep.lat, ep.lng) : null;
    $('#hero').innerHTML = `
      <div class="hero__art" style="--c:${cat.color}"><span>${ep.emoji}</span><i class="hero__badge">🎧 פרק היום</i></div>
      <div class="hero__body">
        <span class="kick" style="--c:${cat.color}">${cat.label}</span>
        <h1>${esc(ep.title)}</h1>
        <p class="hero__sub">${esc(ep.subtitle)}</p>
        <p class="hero__ex">${esc(excerpt(ep, 190))}</p>
        <p class="hero__meta">⏱ ${A.minutes(ep)} האזנה${d != null ? ` · 📍 ${A.fmt(d)} מכם` : ''}${A.played.has(ep.id) ? ' · ✓ האזנתם' : ''}</p>
        <div class="hero__cta">
          <button class="cta-btn" data-act="listen" data-id="${ep.id}">▶ האזינו עכשיו</button>
          <button class="ghost-btn" data-act="map" data-id="${ep.id}">🗺️ במפה</button>
        </div>
        <div class="sharebar sharebar--sm" data-ctx="ep" data-id="${ep.id}">${shareButtons(true)}</div>
      </div>`;
  }

  /* ================= continue listening ================= */
  function resume() {
    const r = A.resumeInfo(), box = $('#resume');
    if (!r || (A.current && A.current.id === r.ep.id && A.isActive())) { box.hidden = true; return; }
    const pct = Math.round(r.i / r.n * 100);
    box.hidden = false;
    box.innerHTML = `${thumb(r.ep)}<div><small>המשיכו להאזין</small><b>${esc(r.ep.title)}</b>
      <span class="resume__bar"><i style="width:${pct}%"></i></span></div>
      <button class="pill-btn" data-act="resume">▶ ${pct}%</button>`;
  }

  /* ================= favourites ================= */
  function favs() {
    const list = A.PLACES.filter(p => A.favs.has(p.id));
    $('#fav-block').hidden = !list.length;
    $('#favs').innerHTML = list.map(ep => `<button class="ncard" data-act="open" data-id="${ep.id}">
      ${thumb(ep, 'thumb--lg')}<span class="ncard__kick" style="--c:${A.catOf(ep).color}">♥ ${A.catOf(ep).label}</span>
      <b>${esc(ep.title)}</b><small>${A.minutes(ep)}${A.played.has(ep.id) ? ' · ✓' : ''}</small></button>`).join('');
  }

  /* ================= near you ================= */
  function near() {
    let list = A.PLACES.slice();
    if (A.pos) list.sort((a, b) => A.distance(A.pos.lat, A.pos.lng, a.lat, a.lng) - A.distance(A.pos.lat, A.pos.lng, b.lat, b.lng));
    else list = list.slice(-8).reverse();
    $('#near').innerHTML = list.slice(0, 8).map(ep => {
      const d = A.pos ? A.distance(A.pos.lat, A.pos.lng, ep.lat, ep.lng) : null;
      return `<button class="ncard" data-act="open" data-id="${ep.id}">
        ${thumb(ep, 'thumb--lg')}
        <span class="ncard__kick" style="--c:${A.catOf(ep).color}">${A.catOf(ep).label}</span>
        <b>${esc(ep.title)}</b>
        <small>${d != null ? (d <= ep.radius ? '📍 אתם כאן' : '📍 ' + A.fmt(d)) : '🆕 חדש'} · ${A.minutes(ep)}${A.played.has(ep.id) ? ' · ✓' : ''}</small>
      </button>`;
    }).join('');
  }

  /* ================= stats (animated counters) ================= */
  function stats() {
    const totalMin = Math.round(A.PLACES.reduce((m, p) => m + p.script.split(/\s+/).length / 120, 0));
    const cats = new Set(A.PLACES.map(p => p.category)).size;
    const items = [[A.PLACES.length, 'פרקים'], [cats, 'נושאים'], [A.TOURS.length, 'סיורים'], [totalMin, 'דקות האזנה'], [A.points(), 'הנקודות שלכם']];
    $('#stats').innerHTML = items.map(([n, l]) => `<div><b data-n="${n}">${statsShown ? n : 0}</b><span>${l}</span></div>`).join('');
  }
  let statsShown = false;
  function countUp() {
    statsShown = true;
    document.querySelectorAll('#stats b[data-n]').forEach(el => {
      const target = +el.dataset.n, t0 = performance.now();
      const step = t => { const k = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  /* ================= tours ================= */
  function tours() {
    $('#home-tours').innerHTML = A.TOURS.map(t => {
      const st = A.tourStops(t), done = st.filter(p => A.played.has(p.id)).length, on = A.tourId === t.id;
      return `<div class="tcard2 ${on ? 'on' : ''}">
        <span class="tcard2__emoji">${t.emoji}</span>
        <b>${esc(t.title)}</b><p>${esc(t.desc)}</p>
        <small>${st.length} תחנות · ${A.fmt(A.tourLength(t))}${done ? ` · ${done}/${st.length} ✓` : ''}</small>
        <span class="tcard2__btns"><button data-act="tour" data-id="${t.id}">${on ? 'בסיור עכשיו ›' : done ? 'המשיכו ›' : 'יוצאים ›'}</button>
        <button class="alt" data-act="tourplay" data-id="${t.id}" title="האזנה לכל הסיור ברצף, בלי ללכת">🛋️ מהבית</button></span>
      </div>`;
    }).join('');
  }

  /* ================= "did you know" rotator ================= */
  const facts = Object.entries(A.QUIZ).map(([id, q]) => ({ id, q: q.q, a: q.a[0] }));
  let fi = dayIndex() % facts.length, factTimer;
  function showFact(i) {
    fi = (i + facts.length) % facts.length;
    const f = facts[fi], box = $('#fact');
    box.classList.remove('in'); void box.offsetWidth;
    box.innerHTML = `${esc(f.q)} <b>${esc(f.a)}</b> <button class="link" data-act="open" data-id="${f.id}">לפרק המלא ›</button>`;
    box.classList.add('in');
    $('#fact-dots').innerHTML = Array.from({ length: 5 }, (_, k) => `<i class="${k === fi % 5 ? 'on' : ''}"></i>`).join('');
  }
  function rotateFacts() { clearInterval(factTimer); factTimer = setInterval(() => showFact(fi + 1), 7000); }
  $('#fact-box').addEventListener('click', e => { if (!e.target.closest('[data-act]')) { showFact(fi + 1); rotateFacts(); } });

  /* ================= category sections (news-style) ================= */
  const ORDER = ['history', 'heritage', 'memory', 'nature', 'trails', 'community', 'culture', 'sport', 'city', 'future', 'transport'];
  const expanded = new Set();
  function sections() {
    $('#sections').innerHTML = ORDER.filter(k => A.CATS[k] && A.PLACES.some(p => p.category === k)).map(k => {
      const cat = A.CATS[k], eps = A.PLACES.filter(p => p.category === k);
      const [lead, ...rest] = eps, shown = expanded.has(k) ? rest : rest.slice(0, 3);
      return `<section class="block sect reveal in">
        <h2 class="kicker"><i style="--c:${cat.color}"></i>${cat.label}<small>${eps.length} פרקים</small><button class="play-all" data-act="playcat" data-id="${k}">▶ הכול ברצף</button></h2>
        <button class="lead" data-act="open" data-id="${lead.id}">
          <span class="lead__art" style="--c:${cat.color}">${lead.emoji}</span>
          <span class="lead__body"><b>${esc(lead.title)}</b><small>${esc(lead.subtitle)}</small>
            <span class="lead__ex">${esc(excerpt(lead, 120))}</span>
            <span class="meta">⏱ ${A.minutes(lead)}${A.played.has(lead.id) ? ' · ✓ האזנתם' : ''}</span></span>
        </button>
        ${shown.map(ep => `<button class="row" data-act="open" data-id="${ep.id}">${thumb(ep)}
          <span><b>${esc(ep.title)}</b><small>${esc(ep.subtitle)} · ${A.minutes(ep)}${A.played.has(ep.id) ? ' · ✓' : ''}</small></span><i>›</i></button>`).join('')}
        ${rest.length > 3 && !expanded.has(k) ? `<button class="more" data-act="more" data-id="${k}">עוד ${rest.length - 3} פרקים ב${cat.label} ›</button>` : ''}
      </section>`;
    }).join('');
  }

  /* ================= the city of tomorrow ================= */
  const FUTURE_IDS = ['city-renewal', 'metronit', 'hahotrim', 'imi-site', 'nof-yam', 'coast', 'municipality'];
  const FUTURE = [
    ['86,000', 'תושבים', 'היעד של תוכנית המתאר (כ־32 אלף היום)', 'imi-site'],
    ['12,000', 'דירות חדשות', 'בתוכנית המתאר, כמחציתן בהתחדשות עירונית', 'imi-site'],
    ['4,700', 'דירות בפינוי־בינוי', 'החזון של ראש העירייה', 'city-renewal'],
    ['כ־30', 'תחנות מטרונית', 'בחיפה ובטירת כרמל, לאורך רחוב הרצל', 'metronit'],
    ['2,153', 'דירות בשכונת החותרים', 'ופארק לאורך נחל גלים', 'hahotrim'],
    ['כ־5,000', 'דירות במתחם תע"ש', 'שכונה חדשה במקום המפעל', 'imi-site'],
    ['30', 'קומות', 'גובה המגדלים במרכז העיר המתחדש', 'city-renewal'],
    ['🌊', 'חוף ים', 'חיבור העיר אל הים', 'coast']
  ];
  function future() {
    $('#future-grid').innerHTML = FUTURE.filter(f => byId(f[3])).map(([n, l, d, id]) =>
      `<button class="fnum" data-act="open" data-id="${id}"><b>${n}</b><span>${l}</span><small>${d}</small></button>`).join('');
  }

  /* ================= useful links ================= */
  const LINKS = [
    ['🏛️', 'אתר עיריית טירת כרמל', 'האתר הרשמי: הודעות ושירותים', 'https://www.tirat-carmel.muni.il/'],
    ['💳', 'תשלומים מקוונים', 'ארנונה, דוחות ואגרות', 'https://www.tirat-carmel.muni.il/Sservice/Pages/Payments.aspx'],
    ['☎️', 'מוקד עירוני 106', 'זמין 24 שעות ביממה', 'tel:106'],
    ['📞', 'מרכזיית העירייה', '04-8547000', 'tel:048547000'],
    ['🎭', 'מתנ"ס טירת כרמל', 'חוגים, אירועים וקייטנות', 'http://www.matnastc.co.il/'],
    ['🕯️', 'בית הכנסת אם הבנים', 'אתר מורשת, הפלמ"ח 12', 'https://emhabanim.co.il/'],
    ['🦌', 'חי בר כרמל', 'שמורת חיות הבר בכרמל', 'https://www.tiuli.com/attractions/220/%D7%97%D7%99-%D7%91%D7%A8-%D7%91%D7%9B%D7%A8%D7%9E%D7%9C'],
    ['🌳', 'רשות הטבע והגנים', 'שמורות, גנים לאומיים והזמנות', 'https://www.parks.org.il/'],
    ['💧', 'עין קדם ונחל נדר', 'מידע ומסלול למעיין', 'https://www.tiuli.com/points-of-interest/566/%D7%A2%D7%99%D7%9F-%D7%A7%D7%93%D7%9D-%D7%95%D7%A0%D7%97%D7%9C-%D7%A0%D7%93%D7%A8'],
    ['🚆', 'רכבת ישראל', 'לוחות זמנים, תחנת חוף הכרמל', 'https://www.rail.co.il/'],
    ['🚇', 'מנהרות הכרמל', 'מידע ותעריפים', 'https://www.carmeltunnels.co.il/'],
    ['🚨', 'פיקוד העורף', 'התרעות והנחיות', 'https://www.oref.org.il/'],
    ['🚌', 'תחבורה ציבורית לטירת כרמל', 'מסלול באוטובוס וברכבת', 'https://www.google.com/maps/dir/?api=1&destination=%D7%98%D7%99%D7%A8%D7%AA+%D7%9B%D7%A8%D7%9E%D7%9C&travelmode=transit'],
    ['🚗', 'ניווט לעירייה', 'הרצל 6, בוויז', 'https://waze.com/ul?q=%D7%A2%D7%99%D7%A8%D7%99%D7%99%D7%AA%20%D7%98%D7%99%D7%A8%D7%AA%20%D7%9B%D7%A8%D7%9E%D7%9C&navigate=yes'],
    ['🧹', 'ניקי שומרת על הניקיון', 'משחק לילדים של העירייה', '../'],
    ['📖', 'טירת כרמל בוויקיפדיה', 'הערך המלא', 'https://he.wikipedia.org/wiki/%D7%98%D7%99%D7%A8%D7%AA_%D7%9B%D7%A8%D7%9E%D7%9C'],
    ['🏺', 'המועצה לשימור אתרי מורשת', 'אתרי מורשת בישראל', 'https://shimur.org/']
  ];
  function links() {
    $('#links').innerHTML = LINKS.map(([e, t, d, u]) =>
      `<a class="lnk" href="${u}" ${u.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}><span>${e}</span><b>${t}</b><small>${d}</small></a>`).join('');
  }

  /* ================= sharing ================= */
  function shareButtons(compact) {
    const b = (k, label, cls) => `<button class="sh sh--${k}" data-share="${k}" aria-label="שיתוף ב${label}">${compact && k !== 'native' ? '' : ''}${label}</button>`;
    return [
      b('wa', 'וואטסאפ'), b('fb', 'פייסבוק'), b('tg', 'טלגרם'), b('x', 'X'), b('mail', 'מייל'), b('copy', 'העתקת קישור'),
      navigator.share ? b('native', 'עוד…') : ''
    ].join('');
  }
  function shareData(bar) {
    const ctx = bar.dataset.ctx;
    const ep = ctx === 'ep' ? byId(bar.dataset.id) : ctx === 'current' ? A.current : null;
    if (ep && !ep.live) return { url: BASE + '#' + ep.id, text: `🎧 "${ep.title}": ${ep.subtitle}. פרק קצר על טירת כרמל ב־podtc` };
    return { url: BASE, text: '🎧 podtc: טירת כרמל מספרת את עצמה. פודקאסטים קצרים בעברית על כל מקום בעיר, לפי המיקום שלכם' };
  }
  async function doShare(kind, bar) {
    const { url, text } = shareData(bar), u = encodeURIComponent(url), t = encodeURIComponent(text);
    const open = href => window.open(href, '_blank', 'noopener');
    switch (kind) {
      case 'wa': open(`https://wa.me/?text=${t}%20${u}`); break;
      case 'fb': open(`https://www.facebook.com/sharer/sharer.php?u=${u}`); break;
      case 'tg': open(`https://t.me/share/url?url=${u}&text=${t}`); break;
      case 'x': open(`https://twitter.com/intent/tweet?text=${t}&url=${u}`); break;
      case 'mail': location.href = `mailto:?subject=${encodeURIComponent('podtc: טירת כרמל באוזניים')}&body=${t}%0A${u}`; break;
      case 'copy':
        try { await navigator.clipboard.writeText(text + ' ' + url); A.toast('🔗 הקישור הועתק'); }
        catch (e) { prompt('העתיקו את הקישור:', url); }
        break;
      case 'native': try { await navigator.share({ title: 'podtc', text, url }); } catch (e) {} break;
    }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-share]'); if (!b) return;
    doShare(b.dataset.share, b.closest('.sharebar'));
  });

  /* ================= add to home screen ================= */
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(navigator.userAgent);
  async function install() {
    if (standalone()) { A.toast('podtc כבר מותקנת אצלכם 🎉'); return; }
    const ev = A.deferredInstall;
    if (ev) {
      ev.prompt();
      try { const r = await ev.userChoice; if (r.outcome === 'accepted') { A.toast('🎉 podtc נוספה למסך הבית'); $('#install-card').hidden = true; } } catch (e) {}
      A.clearInstall(); return;
    }
    const steps = isIOS ? [
      'פתחו את הקישור בדפדפן <b>Safari</b>',
      'לחצו על כפתור השיתוף <span class="kbd">⬆︎</span> בתחתית המסך',
      'גללו ובחרו <b>"הוספה למסך הבית"</b>',
      'לחצו <b>"הוספה"</b>. הסמל של podtc יופיע אצלכם בטלפון'
    ] : isAndroid ? [
      'פתחו את הקישור בדפדפן <b>Chrome</b>',
      'לחצו על התפריט <span class="kbd">⋮</span> בפינה העליונה',
      'בחרו <b>"התקנת אפליקציה"</b> או <b>"הוספה למסך הבית"</b>',
      'אשרו. podtc תופיע עם שאר האפליקציות'
    ] : [
      'בכרום או באדג׳: לחצו על סמל ההתקנה <span class="kbd">⊕</span> בשורת הכתובת',
      'או: תפריט הדפדפן ← <b>"התקנת podtc"</b>',
      'הכי מומלץ: פתחו את הקישור בטלפון והוסיפו למסך הבית'
    ];
    $('#install-steps').innerHTML = `<ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
    $('#install-sheet').hidden = false;
  }
  $('#install-close').addEventListener('click', () => { $('#install-sheet').hidden = true; });
  $('#install-sheet').addEventListener('click', e => { if (e.target.id === 'install-sheet') $('#install-sheet').hidden = true; });
  $('#home-install').addEventListener('click', install);
  $('#install-x').addEventListener('click', () => { $('#install-card').hidden = true; try { localStorage.setItem('podtc.installDismissed', '1'); } catch (e) {} });
  $('#btn-install').addEventListener('click', install);
  function installCard() {
    let dismissed = false; try { dismissed = !!localStorage.getItem('podtc.installDismissed'); } catch (e) {}
    $('#install-card').hidden = standalone() || dismissed;
    $('#tab-install').hidden = standalone();
    $('#btn-install').hidden = standalone();
  }

  /* ================= actions (event delegation) ================= */
  $('#home').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = b.dataset.id, ep = byId(id);
    switch (b.dataset.act) {
      case 'listen': A.listen(ep); break;
      case 'open': A.select(ep); A.openNow(); break;
      case 'map': setView('map'); A.showOnMap(ep); break;
      case 'tour': setView('map'); A.startTour(id); break;
      case 'more': expanded.add(id); sections(); break;
      case 'resume': A.resume(); break;
      case 'playfuture': A.playQueue(FUTURE_IDS, 'העיר של מחר'); break;
      case 'playcat': A.playQueue(A.PLACES.filter(p => p.category === id).map(p => p.id), A.CATS[id].label); break;
      case 'playfav': A.playQueue(A.PLACES.filter(p => A.favs.has(p.id)).map(p => p.id), 'המועדפים'); break;
      case 'tourplay': { const t = A.TOURS.find(x => x.id === id); A.playQueue(A.tourStops(t).map(p => p.id), t.title); break; }
    }
  });
  $('#foot-feedback').addEventListener('click', () => A.feedback());

  /* ================= reveal-on-scroll ================= */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in'); io.unobserve(en.target);
    if (en.target.id === 'stats' && !statsShown) countUp();
  }), { root: $('#home'), threshold: .15 }) : null;
  function observe() { document.querySelectorAll('#home .reveal:not(.in)').forEach(el => io ? io.observe(el) : el.classList.add('in')); }

  /* ================= render & live updates ================= */
  function renderAll() { resume(); hero(); favs(); near(); stats(); tours(); sections(); ticker(); observe(); }
  let pending = 0;
  A.onUpdate(() => { // fires on location / progress / playback changes; coalesce bursts, never drop the last one
    clearTimeout(pending);
    pending = setTimeout(() => {
      resume(); hero(); favs(); near(); tours(); sections(); stats(); streak();
      if (statsShown) document.querySelectorAll('#stats b[data-n]').forEach(el => el.textContent = el.dataset.n);
    }, 250);
  });

  // after the splash: land on the front page (demo mode goes straight to the map)
  $('#btn-start').addEventListener('click', () => setView('home'));
  $('#btn-start-demo').addEventListener('click', () => setView('map'));

  document.querySelector('#share-ep').dataset.ctx = 'current';
  $('#share-ep').innerHTML = shareButtons();
  $('#share-app').dataset.ctx = 'app';
  $('#share-app').innerHTML = shareButtons();

  dateline(); setInterval(dateline, 60000);
  links(); future(); installCard(); renderAll(); showFact(fi); rotateFacts(); weather();
  setView('home');
  window.addEventListener('appinstalled', () => { A.toast('🎉 podtc הותקנה!'); installCard(); });
})();
