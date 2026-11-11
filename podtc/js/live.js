/* podtc — live & municipal layer:
 *  voices · municipal services · live info (news, weather, air, sea, Shabbat, Hebrew date, Wikipedia)
 *  · live radio · municipality social embeds (TikTok / Facebook / YouTube) · QR · quick navigation */
(function () {
  const A = window.PodApp; if (!A) return;
  const $ = s => document.querySelector(s);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LAT = 32.761, LNG = 34.971;
  const store = {
    get(k, d) { try { const v = localStorage.getItem('podtc.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('podtc.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const getJSON = async (url, ms = 9000) => {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
    try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); }
    finally { clearTimeout(t); }
  };

  /* =====================================================================
     1. VOICES — pick the narrator voice and pitch
     ===================================================================== */
  const N = window.Narrator;
  const prettyVoice = v => {
    const n = v.name.replace(/Microsoft |Google |Apple |\(.*?\)|- Hebrew|Hebrew|Online|Natural/gi, ' ').replace(/\s+/g, ' ').trim();
    const tag = /natural|online|neural/i.test(v.name) ? ' טבעי' : /google/i.test(v.name) ? ' · Google' : '';
    return (n || v.name) + tag;
  };
  function renderVoices() {
    if (!N.supported) { $('#voice-sel').innerHTML = '<option>הדפדפן לא תומך בהקראה</option>'; return; }
    const he = N.hebrewVoices(), all = N.allVoices();
    const cur = N.voice ? N.voice.voiceURI : '';
    let html = he.map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === cur ? 'selected' : ''}>${esc(prettyVoice(v))}</option>`).join('');
    if (!he.length) html = '<option value="">לא נמצא קול עברי במכשיר</option>';
    const other = all.filter(v => !/^(he|iw)/i.test(v.lang)).slice(0, 0); // non-Hebrew voices would mispronounce Hebrew: hidden
    $('#voice-sel').innerHTML = html + other.join('');
    $('#voice-note').textContent = he.length > 1 ? `${he.length} קולות עבריים זמינים במכשיר הזה` :
      he.length === 1 ? 'במכשיר הזה יש קול עברי אחד. בדפדפן Edge יש קולות טבעיים נוספים (הילה ואברי), ובאנדרואיד אפשר להוסיף קולות דרך "Google Text-to-Speech"' :
      'כדי לשמוע הקראה, התקינו קול עברי בהגדרות הטלפון (באנדרואיד: Google Text-to-Speech, באייפון: הגדרות ← נגישות ← תוכן מוקרא ← קולות ← עברית)';
    $('#pitch-sel').value = String(N.pitch);
    $('#voice-label').textContent = N.voice ? prettyVoice(N.voice).split(' ')[0] : 'קול';
  }
  N.on('voices', renderVoices);
  const mus = $('#music'); mus.checked = N.music; mus.addEventListener('change', () => N.setMusic(mus.checked));
  // one gentle hint when the device only has a robotic voice
  N.on('state', s => {
    if (s !== 'playing' || N.isNatural() || store.get('voiceHint', false)) return;
    store.set('voiceHint', true);
    const edge = /Edg\//.test(navigator.userAgent);
    setTimeout(() => A.toast(edge ? 'טיפ: בהגדרות אפשר לבחור את הקולות הטבעיים "הילה" ו"אברי"' : 'טיפ: בדפדפן Edge הקול נשמע הרבה יותר טבעי. באנדרואיד אפשר להתקין את "Google Text-to-Speech"'), 4000);
  });
  renderVoices();
  $('#voice-sel').addEventListener('change', e => { N.setVoice(e.target.value); renderVoices(); N.preview() || A.toast('הקול החדש יופעל מהמשפט הבא'); });
  $('#pitch-sel').addEventListener('change', e => { N.setPitch(parseFloat(e.target.value)); N.preview('ככה אני נשמע עכשיו.'); });
  $('#voice-test').addEventListener('click', () => { N.preview() || A.toast('עצרו את הפרק כדי לשמוע דוגמה'); });
  // player button: cycle through the Hebrew voices
  $('#btn-voice').addEventListener('click', () => {
    const he = N.hebrewVoices();
    if (he.length < 2) { A.toast(he.length ? `קול: ${prettyVoice(he[0])}. אין קולות עבריים נוספים במכשיר` : 'לא נמצא קול עברי במכשיר'); A.openLibrary(); return; }
    const i = he.findIndex(v => N.voice && v.voiceURI === N.voice.voiceURI);
    const nx = he[(i + 1) % he.length];
    N.setVoice(nx.voiceURI); renderVoices();
    A.toast(`קול: ${prettyVoice(nx)} (מהמשפט הבא)`);
    N.preview('שלום, זה הקול החדש שלי.');
  });

  /* =====================================================================
     2. MUNICIPAL SERVICES — the city's services in one tap
     ===================================================================== */
  const MUNI = 'https://www.tirat-carmel.muni.il';
  const SERVICES = [
    ['phone', 'מוקד 106', 'דיווח ופניות 24/7', 'tel:106', 'hot'],
    ['card', 'תשלומים מקוונים', 'ארנונה, דוחות, אגרות', MUNI + '/Sservice/Pages/Payments.aspx'],
    ['home', 'ארנונה והוראת קבע', 'תשלום והצטרפות', MUNI + '/Departments/Pages/ArnonaPayments.aspx'],
    ['pin', 'דיווח מפגע עם מיקום', 'שולחים את המיקום המדויק', '#hazard'],
    ['building', 'אתר העירייה', 'הודעות, מחלקות ומידע', MUNI + '/'],
    ['phone', 'מרכזיית העירייה', '04-8547000', 'tel:048547000'],
    ['note', 'המתנ"ס', 'חוגים, אירועים וקייטנות', 'http://www.matnastc.co.il/'],
    ['facebook', 'העירייה בפייסבוק', 'עדכונים שוטפים', 'https://www.facebook.com/TCarmel.muni/']
  ];
  const EMERG = [['', 'משטרה', '100'], ['', 'מד"א', '101'], ['', 'כבאות', '102'], ['siren', 'פיקוד העורף', '104'], ['building', 'מוקד עירוני', '106']];
  function services() {
    $('#svc').innerHTML = SERVICES.map(([e, t, d, u, cls]) => {
      const ext = /^https?:/.test(u);
      return `<a class="svc__item ${cls || ''}" href="${u}" ${ext ? 'target="_blank" rel="noopener"' : ''} ${u === '#hazard' ? 'data-hazard="1"' : ''}>
        <span>${PodIcons.svg(e, 24)}</span><b>${t}</b><small>${d}</small></a>`;
    }).join('');
    $('#emerg').innerHTML = '<b>חירום:</b>' + EMERG.map(([e, t, n]) => `<a href="tel:${n}">${t} <b>${n}</b></a>`).join('');
  }
  // hazard report: grab the location and let the person send it (WhatsApp / SMS / mail / 106)
  function hazard() {
    const send = (lat, lng) => {
      const map = `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
      const text = `דיווח מפגע בטירת כרמל ${map}\nתיאור המפגע: `;
      if (navigator.share) navigator.share({ title: 'דיווח מפגע', text }).catch(() => {});
      else { try { navigator.clipboard.writeText(text); } catch (e) {} A.toast('המיקום הועתק. חייגו 106 או הדביקו בהודעה'); }
    };
    const p = A.pos;
    if (p) return send(p.lat, p.lng);
    if (!navigator.geolocation) return A.toast('אין גישה למיקום. חייגו 106');
    A.toast('מאתרים מיקום…');
    navigator.geolocation.getCurrentPosition(g => send(g.coords.latitude, g.coords.longitude), () => A.toast('לא הצלחנו לאתר מיקום. חייגו 106'), { enableHighAccuracy: true, timeout: 12000 });
  }
  document.addEventListener('click', e => { const a = e.target.closest('[data-hazard]'); if (a) { e.preventDefault(); hazard(); } });

  /* =====================================================================
     3. LIVE INFO — weather, air, sea, sun, Shabbat, Hebrew date, news, Wikipedia
     ===================================================================== */
  const WMO = c => c === 0 ? ['sun', 'בהיר'] : c <= 2 ? ['cloud-sun', 'מעונן חלקית'] : c === 3 ? ['cloud', 'מעונן'] : c <= 48 ? ['fog', 'ערפל']
    : c <= 57 ? ['rain', 'טפטוף'] : c <= 67 ? ['rain', 'גשם'] : c <= 77 ? ['snow', 'שלג'] : c <= 82 ? ['rain', 'ממטרים'] : ['storm', 'סופת רעמים'];
  // times with an offset (Hebcal) → Israel time; naive local times (Open-Meteo, already Asia/Jerusalem) → read as-is
  const hm = iso => !iso ? '' : /(Z|[+-]\d\d:?\d\d)$/.test(iso)
    ? new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' }) : iso.slice(11, 16);
  const dayName = iso => new Date(iso).toLocaleDateString('he-IL', { weekday: 'short' });
  const card = (cls, icon, title, big, sub) => `<div class="lc ${cls}"><span class="lc__i">${PodIcons.svg(icon, 26)}</span><small>${title}</small><b>${big}</b><span class="lc__s">${sub}</span></div>`;
  const cards = {}; // id -> html (rendered in a fixed order as data arrives)
  const LIVE = {};  // raw live data, used by the audio briefing and the smart tip
  const ORDER = ['tip', 'weather', 'forecast', 'air', 'sea', 'sun', 'shabbat', 'holiday', 'hdate'];
  function paintCards() {
    $('#live-cards').innerHTML = ORDER.map(k => cards[k] || `<div class="lc lc--skel"></div>`).join('');
  }

  async function weather() {
    try {
      const d = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&current=temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=Asia%2FJerusalem&forecast_days=4`);
      const c = d.current, dl = d.daily;
      let [ic, desc] = WMO(c.weather_code); if (!c.is_day && c.weather_code === 0) ic = 'moon';
      cards.weather = card('lc--w', ic, 'מזג האוויר עכשיו', `${Math.round(c.temperature_2m)}°`, `${desc} · מורגש ${Math.round(c.apparent_temperature)}° · לחות ${c.relative_humidity_2m}% · רוח ${Math.round(c.wind_speed_10m)} קמ"ש`);
      cards.forecast = `<div class="lc lc--f"><small>תחזית</small><div class="fc">${dl.time.slice(1, 4).map((t, i) => {
        const [fi] = WMO(dl.weather_code[i + 1]);
        return `<span><em>${dayName(t)}</em>${PodIcons.svg(fi, 24)}<b>${Math.round(dl.temperature_2m_max[i + 1])}°</b><i>${Math.round(dl.temperature_2m_min[i + 1])}°</i>${dl.precipitation_probability_max[i + 1] >= 30 ? `<u>${dl.precipitation_probability_max[i + 1]}%</u>` : ''}</span>`;
      }).join('')}</div></div>`;
      const uv = dl.uv_index_max[0];
      LIVE.weather = { t: Math.round(c.temperature_2m), desc, code: c.weather_code, max: Math.round(dl.temperature_2m_max[0]), min: Math.round(dl.temperature_2m_min[0]),
        rain: dl.precipitation_probability_max[0], tomorrow: WMO(dl.weather_code[1])[1], tmax: Math.round(dl.temperature_2m_max[1]), uv, sunset: hm(dl.sunset[0]) };
      cards.tip = smartTip(LIVE.weather);
      cards.sun = card('lc--sun', 'sunrise', 'זריחה ושקיעה', `${hm(dl.sunrise[0])} · ${hm(dl.sunset[0])}`, `מדד UV היום: ${Math.round(uv)}${uv >= 8 ? ' · גבוה מאוד, מומלץ כובע וקרם' : uv >= 6 ? ' · גבוה' : ''}`);
    } catch (e) { cards.weather = card('', 'cloud-sun', 'מזג האוויר', '—', 'לא זמין כרגע'); }
    paintCards();
  }
  async function air() {
    try {
      const d = await getJSON(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LNG}&current=european_aqi,pm2_5,pm10`);
      const q = d.current.european_aqi;
      const lvl = q <= 20 ? ['wind', 'טובה מאוד'] : q <= 40 ? ['wind', 'טובה'] : q <= 60 ? ['wind', 'בינונית'] : q <= 80 ? ['wind', 'ירודה'] : ['wind', 'גרועה'];
      LIVE.air = lvl[1];
      cards.air = card('lc--air', lvl[0], 'איכות האוויר', lvl[1], `מדד ${Math.round(q)} · חלקיקים PM2.5: ${Math.round(d.current.pm2_5)}`);
    } catch (e) { cards.air = ''; }
    paintCards();
  }
  async function sea() {
    try {
      const d = await getJSON(`https://marine-api.open-meteo.com/v1/marine?latitude=32.765&longitude=34.935&current=wave_height,sea_surface_temperature`);
      const w = d.current.wave_height, t = d.current.sea_surface_temperature;
      const st = w < .5 ? 'ים שקט' : w < 1 ? 'ים נוח' : w < 2 ? 'גלי' : 'סוער';
      LIVE.sea = { w: w.toFixed(1), st, t: t != null ? Math.round(t) : null };
      cards.sea = card('lc--sea', 'wave', 'הים מול טירת כרמל', `${w.toFixed(1)} מ׳`, `${st}${t != null ? ` · מים ${Math.round(t)}°` : ''}`);
    } catch (e) { cards.sea = ''; }
    paintCards();
  }
  async function shabbat() {
    try {
      const d = await getJSON(`https://www.hebcal.com/shabbat?cfg=json&latitude=${LAT}&longitude=${LNG}&tzid=Asia%2FJerusalem&M=on&lg=he`);
      const it = d.items || [];
      const cand = it.find(i => i.category === 'candles'), havd = it.find(i => i.category === 'havdalah'), par = it.find(i => i.category === 'parashat');
      LIVE.shabbat = { in: hm(cand && cand.date), out: hm(havd && havd.date), par: par ? (par.hebrew || par.title) : '' };
      cards.shabbat = card('lc--sh', 'candle', 'זמני שבת', `${hm(cand && cand.date)} · ${hm(havd && havd.date)}`, `כניסה · יציאה${par ? ` · ${esc(par.hebrew || par.title)}` : ''}`);
    } catch (e) { cards.shabbat = ''; }
    paintCards();
  }
  async function hdate() {
    try {
      const d = await getJSON('https://www.hebcal.com/converter?cfg=json&g2h=1&strict=1');
      LIVE.hdate = d.hebrew;
      cards.hdate = card('lc--hd', 'calendar', 'התאריך העברי', esc(d.hebrew), new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    } catch (e) { cards.hdate = ''; }
    paintCards();
  }

  /* --- news: local sites (WordPress REST, CORS) → Google News via RSS-to-JSON → links --- */
  const decode = h => { const t = document.createElement('textarea'); t.innerHTML = h; return t.value; };
  const ago = iso => {
    const m = Math.round((Date.now() - new Date(iso)) / 60000);
    return isNaN(m) ? '' : m < 60 ? `לפני ${Math.max(1, m)} דק׳` : m < 1440 ? `לפני ${Math.round(m / 60)} שע׳` : `לפני ${Math.round(m / 1440)} ימים`;
  };
  const NEWS_SITES = [
    ['חדשות טירת כרמל', 'https://www.tcarmel.org.il'],
    ['TC News', 'https://www.tcnews.co.il']
  ];
  const GNEWS = 'https://news.google.com/rss/search?q=%22%D7%98%D7%99%D7%A8%D7%AA+%D7%9B%D7%A8%D7%9E%D7%9C%22&hl=he&gl=IL&ceid=IL:he';
  async function fromWP([name, base]) {
    const d = await getJSON(`${base}/wp-json/wp/v2/posts?per_page=6&_fields=title,link,date`, 8000);
    return d.map(p => ({ title: decode(p.title.rendered), link: p.link, date: p.date, src: name }));
  }
  const GNEWS2 = 'https://news.google.com/rss/search?q=%22%D7%98%D7%99%D7%A8%D7%AA+%D7%94%D7%9B%D7%A8%D7%9E%D7%9C%22&hl=he&gl=IL&ceid=IL:he';
  async function fromGoogle(feed = GNEWS) {
    const d = await getJSON(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`, 9000);
    if (d.status !== 'ok') throw new Error('rss');
    return d.items.map(i => {
      const m = i.title.match(/^(.*) - ([^-]+)$/);
      return { title: m ? m[1] : i.title, link: i.link, date: i.pubDate.replace(' ', 'T') + 'Z', src: m ? m[2] : 'Google News' };
    });
  }
  async function news() {
    const results = await Promise.allSettled([...NEWS_SITES.map(fromWP), fromGoogle(), fromGoogle(GNEWS2)]);
    const seen = new Set();
    const items = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
      .filter(i => i.title && !seen.has(i.title) && seen.add(i.title))
      .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);
    window.PodNews = items.map(i => ({ ...i, ago: ago(i.date) })); window.dispatchEvent(new Event('pod:news'));
    LIVE.news = items.slice(0, 3).map(i => i.title);
    $('#news-list').innerHTML = items.length ? items.slice(0, 8).map(i => `<li><a href="${esc(i.link)}" target="_blank" rel="noopener">
        <b>${esc(i.title)}</b><small>${esc(i.src)} · ${ago(i.date)}</small></a></li>`).join('')
      : `<li class="news__empty">לא הצלחנו לטעון כותרות כרגע. אפשר לקרוא את החדשות ישירות במקורות:</li>`;
    $('#news-more').innerHTML = [
      ['חדשות טירת כרמל בגוגל', 'https://news.google.com/search?q=%22%D7%98%D7%99%D7%A8%D7%AA%20%D7%9B%D7%A8%D7%9E%D7%9C%22&hl=he&gl=IL&ceid=IL:he'],
      ['חדשות טירת כרמל', 'https://www.tcarmel.org.il/'],
      ['הודעות העירייה', MUNI + '/']
    ].map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join('');
  }
  async function wikiLive() {
    try {
      const d = await getJSON('https://he.wikipedia.org/api/rest_v1/page/summary/%D7%98%D7%99%D7%A8%D7%AA_%D7%9B%D7%A8%D7%9E%D7%9C');
      if (!d.extract) return;
      $('#wiki-live').hidden = false;
      $('#wiki-live').innerHTML = `<b>טירת כרמל בוויקיפדיה, מתעדכן ברשת</b><p>${esc(d.extract.slice(0, 420))}${d.extract.length > 420 ? '…' : ''}</p>
        <a href="${esc(d.content_urls && d.content_urls.mobile ? d.content_urls.mobile.page : 'https://he.wikipedia.org/wiki/טירת_כרמל')}" target="_blank" rel="noopener">לערך המלא ›</a>`;
    } catch (e) {}
  }
  async function holiday() {
    try {
      const iso = d => d.toISOString().slice(0, 10), now = new Date(), end = new Date(Date.now() + 75 * 864e5);
      const d = await getJSON(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&ss=off&mf=off&c=off&lg=he&start=${iso(now)}&end=${iso(end)}`);
      const today = iso(now);
      const h = (d.items || []).find(i => i.category === 'holiday' && i.date.slice(0, 10) >= today && !/ערב|Erev/.test(i.title));
      if (!h) { cards.holiday = ''; return paintCards(); }
      const days = Math.round((new Date(h.date.slice(0, 10)) - new Date(today)) / 864e5);
      const name = h.hebrew || h.title;
      LIVE.holiday = { name, days };
      cards.holiday = card('lc--hol', 'star', 'החג הבא', esc(name), days === 0 ? 'היום! חג שמח' : days === 1 ? 'מחר' : `בעוד ${days} ימים · ${new Date(h.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}`);
    } catch (e) { cards.holiday = ''; }
    paintCards();
  }
  /* weather-aware suggestion: rain → listen from home; heat → the spring; otherwise → go for a tour */
  function smartTip(w) {
    const rainy = w.code >= 51 || w.rain >= 50, hot = w.t >= 30 || w.uv >= 8;
    const [ic, title, text, act, btn] = rainy
      ? ['rain', 'יום גשום?', 'מושלם לסיור מהבית. האזינו לכל הסיור "מהכפר אל המעיין" ברצף, מהספה', 'tour-home', 'האזינו מהבית']
      : hot ? ['sun', 'חם היום', `עד ${w.max}°. עדיף לסייר בבוקר או אחרי השקיעה (${w.sunset}), עם מים. בינתיים: עין קדם, המקום הכי מרענן בעיר`, 'ein-kedem', 'לפרק על עין קדם']
      : ['sun', 'מזג אוויר מושלם לסיור', `${w.t}° ו${w.desc}. צאו לסיור "מהכפר אל המעיין", כ־3 ק"מ`, 'tour-go', 'יוצאים לסיור'];
    return `<div class="lc lc--tip"><span class="lc__i">${PodIcons.svg(ic, 26)}</span><small>הטיפ של היום</small><b>${title}</b><span class="lc__s">${text}</span><button class="tip-btn" data-tip="${act}">${btn}</button></div>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-tip]'); if (!b) return;
    const act = b.dataset.tip;
    if (act === 'tour-home') { const t = A.TOURS[0]; A.playQueue(A.tourStops(t).map(p => p.id), t.title); }
    else if (act === 'tour-go') { document.querySelector('.tab[data-view="map"]').click(); A.startTour(A.TOURS[0].id); }
    else { const ep = A.PLACES.find(p => p.id === act); if (ep) { A.select(ep); A.openNow(); } }
  });
  let liveP = null;
  function refreshLive() {
    paintCards();
    liveP = Promise.allSettled([weather(), air(), sea(), shabbat(), hdate(), holiday(), news(), wikiLive()]).then(() => {
      $('#live-upd').textContent = 'עודכן ' + new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    });
    return liveP;
  }

  /* =====================================================================
     4. LIVE RADIO — stations stream straight from the broadcasters
     ===================================================================== */
  const G = q => 'https://www.google.com/search?q=' + encodeURIComponent(q);
  const STW = id => `https://playerservices.streamtheworld.com/api/livestream-redirect/${id}.mp3`;
  const KAN_HLS = id => `https://kancdn.medonecdn.net/livehls/oil/kancdn-live/live/radio/${id}/live.livx/playlist.m3u8?renditions`;
  const STATIONS = [
    { id: 'haifa', name: 'רדיו חיפה', freq: '107.5', tag: 'מקומי', color: '#0ea5e9', url: 'https://1075.livecdn.biz/radiohaifa', site: G('רדיו חיפה 107.5 שידור חי') },
    { id: 'tzafon', name: 'רדיו צפון', freq: '104.5', tag: 'אזורי', color: '#22c55e', url: 'https://radio.streamgates.net/stream/1045fm', alt: ['https://cdn.cybercdn.live/Tzafon_NonStop/Live_Audio/icecast.audio'], site: G('רדיו צפון 104.5 שידור חי') },
    { id: 'kanbet', name: 'כאן ב', freq: 'רשת ב', tag: 'חדשות', color: '#ef4444', url: STW('KAN_BET'), alt: [KAN_HLS('kan_reshet_bet')], site: 'https://www.kan.org.il/live/radio/' },
    { id: 'kangimel', name: 'כאן גימל', freq: 'גימל', tag: 'מוזיקה ישראלית', color: '#f97316', url: STW('KAN_GIMMEL'), alt: [KAN_HLS('kan_gimel')], site: 'https://www.kan.org.il/live/radio/' },
    { id: 'kan88', name: 'כאן 88', freq: '88', tag: 'מוזיקה', color: '#eab308', url: STW('KAN_88'), alt: [KAN_HLS('kan_88')], site: 'https://www.kan.org.il/live/radio/' },
    { id: 'glglz', name: 'גלגלצ', freq: '91.8', tag: 'להיטים', color: '#10b981', url: 'https://glzwizzlv.bynetcdn.com/glglz_mp3', site: 'https://glz.co.il/' },
    { id: 'glz', name: 'גלי צה"ל', freq: 'גל"צ', tag: 'חדשות ותרבות', color: '#3b82f6', url: 'https://glzwizzlv.bynetcdn.com/glz_mp3', site: 'https://glz.co.il/' },
    { id: '103', name: '103FM', freq: '103', tag: 'אקטואליה', color: '#6366f1', url: 'https://cdn.cybercdn.live/103FM/Live/icecast.audio', site: 'https://103fm.maariv.co.il/' },
    { id: 'radios', name: 'רדיוס', freq: '100FM', tag: 'מוזיקה', color: '#ec4899', url: 'https://cdn.cybercdn.live/Radios_100FM/Audio/icecast.audio', site: 'https://100fm.co.il/' },
    { id: 'kantarbut', name: 'כאן תרבות', freq: 'תרבות', tag: 'תרבות', color: '#a855f7', url: STW('KAN_TARBUT'), alt: [KAN_HLS('kan_tarbut')], site: 'https://www.kan.org.il/live/radio/' },
    { id: 'kanmoreshet', name: 'כאן מורשת', freq: 'מורשת', tag: 'יהדות', color: '#14b8a6', url: STW('KAN_MORESHET'), alt: [KAN_HLS('kan_moreshet')], site: 'https://www.kan.org.il/live/radio/' },
    { id: 'kanreka', name: 'כאן רקע', freq: 'רקע', tag: 'עלייה ושפות', color: '#84cc16', url: STW('KAN_REKA'), alt: [KAN_HLS('kan_reka')], site: 'https://www.kan.org.il/live/radio/' },
    { id: 'kankol', name: 'כאן קול המוזיקה', freq: 'קלאסי', tag: 'מוזיקה קלאסית', color: '#d946ef', url: STW('KAN_KOL_HAMUSICA'), alt: [KAN_HLS('kan_kol_hamuzika')], site: 'https://www.kan.org.il/live/radio/' },
    { id: 'kolchai', name: 'קול חי', freq: '93FM', tag: 'מוזיקה יהודית', color: '#0891b2', url: 'https://media2.93fm.co.il/live-new', site: 'https://www.93fm.co.il/' },
    { id: 'kz', name: 'רדיו הקצה', freq: 'KZ', tag: 'אלטרנטיבי', color: '#64748b', url: 'https://kzradio.mediacast.co.il/kzradio_live/kzradio/icecast.audio', site: G('רדיו הקצה שידור חי') },
    { id: 'kids', name: 'שירי ילדים', freq: '100%', tag: 'לילדים', color: '#f59e0b', url: 'https://gb25.streamgates.net/radios-audio/100Kids/icecast.audio', site: 'https://100fm.co.il/' },
    { id: 'disney', name: 'שירי דיסני', freq: '100%', tag: 'לילדים', color: '#8b5cf6', url: 'https://gb25.streamgates.net/radios-audio/100Disney/icecast.audio', site: 'https://100fm.co.il/' },
    { id: '102', name: 'רדיו תל אביב', freq: '102FM', tag: 'אזורי', color: '#f43f5e', url: 'https://102.livecdn.biz/102fm_aac', site: G('102FM רדיו תל אביב שידור חי') }
  ];
  const audio = $('#radio-audio');
  let station = null, tries = [], sleepT = 0, sleepUntil = 0;
  function stations() {
    $('#stations').innerHTML = STATIONS.map(s => `<button class="st ${station && station.id === s.id ? 'on' : ''}" data-st="${s.id}" style="--c:${s.color}">
      <span class="st__logo">${esc(s.freq)}</span><b>${esc(s.name)}</b><small>${esc(s.tag)}</small><i class="st__eq"><i></i><i></i><i></i></i></button>`).join('');
  }
  function radioState(txt, playing) {
    $('#rb-state').textContent = txt;
    $('#radiobar').classList.toggle('playing', !!playing);
    $('#rb-toggle').textContent = playing ? '❚❚' : '▶';
    document.body.classList.toggle('radio-on', !$('#radiobar').hidden);
  }
  function playStation(s) {
    if (N.state === 'playing') N.pause();             // never talk over the radio
    station = s; tries = [s.url, ...(s.alt || [])];
    $('#radiobar').hidden = false;
    $('#rb-name').textContent = `${s.name} ${/^\d/.test(s.freq) ? s.freq : ''}`.trim();
    radioState('מתחבר…', false); stations(); tryNext();
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: s.name, artist: 'רדיו חי · podtc', artwork: [{ src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png' }] });
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('play', () => audio.play());
    }
    store.set('lastStation', s.id);
  }
  function tryNext() {
    const url = tries.shift();
    if (!url) {
      if (!station) return;
      const st = station;
      radioState('השידור לא זמין כרגע', false);
      A.toast(`לא הצלחנו להתחבר ל${st.name}. פותחים את אתר התחנה…`);
      if (st.site) setTimeout(() => { if (station === st) window.open(st.site, '_blank', 'noopener'); }, 900);
      return;
    }
    // HLS (.m3u8) plays natively on Safari only — skip it elsewhere
    if (/\.m3u8/.test(url) && !audio.canPlayType('application/vnd.apple.mpegurl')) return tryNext();
    audio.src = url;
    audio.play().catch(() => {});
  }
  audio.addEventListener('playing', () => radioState('שידור חי', true));
  audio.addEventListener('waiting', () => radioState('טוען…', true));
  audio.addEventListener('pause', () => radioState(sleepUntil && Date.now() >= sleepUntil ? 'כובה בטיימר' : 'מושהה', false));
  audio.addEventListener('error', () => { if (station) tryNext(); });
  $('#stations').addEventListener('click', e => {
    const b = e.target.closest('[data-st]'); if (!b) return;
    const s = STATIONS.find(x => x.id === b.dataset.st);
    if (station && station.id === s.id && !audio.paused) { audio.pause(); return; }
    playStation(s);
  });
  $('#rb-toggle').addEventListener('click', () => { if (!station) return; if (audio.paused) { if (N.state === 'playing') N.pause(); audio.play().catch(() => tryNext()); } else audio.pause(); });
  $('#rb-close').addEventListener('click', () => { audio.pause(); audio.removeAttribute('src'); audio.load(); station = null; $('#radiobar').hidden = true; clearTimeout(sleepT); sleepUntil = 0; $('#rb-sleep').innerHTML = PodIcons.svg('timer', 18); document.body.classList.remove('radio-on'); stations(); });
  $('#rb-sleep').addEventListener('click', () => {
    const cur = sleepUntil ? Math.round((sleepUntil - Date.now()) / 60000) : 0;
    const next = [15, 30, 60].find(m => m > cur + 1) || 0; // 15 → 30 → 60 → off
    clearTimeout(sleepT); sleepUntil = 0;
    if (next) { sleepUntil = Date.now() + next * 60000; sleepT = setTimeout(() => audio.pause(), next * 60000); $('#rb-sleep').textContent = next + "'"; A.toast(`הרדיו ייכבה בעוד ${next} דקות`); }
    else { $('#rb-sleep').innerHTML = PodIcons.svg('timer', 18); A.toast('הטיימר בוטל'); }
  });
  // an episode starting stops the radio
  N.on('state', s => { if (s === 'playing' && !audio.paused) { audio.pause(); A.toast('הרדיו הושהה בזמן הפרק'); } });

  /* =====================================================================
     5. THE MUNICIPALITY ON SOCIAL NETWORKS — embedded (lazy-loaded)
     ===================================================================== */
  const CFG = (window.PODTC_CONFIG && window.PODTC_CONFIG.social) || {};
  const TT = CFG.tiktok || 'tiratcarmel.muni', FB = CFG.facebook || 'TCarmel.muni', YT = CFG.youtubeChannel || 'UCeGhFSCGBTK18f_c3dQPQWg';
  const SOCIAL = {
    tiktok: { name: 'טיקטוק', icon: 'tiktok', handle: '@' + TT, page: `https://www.tiktok.com/@${TT}`,
      search: `https://www.tiktok.com/search/user?q=${encodeURIComponent('עיריית טירת כרמל')}`, cls: 'tt' },
    facebook: { name: 'פייסבוק', icon: 'facebook', handle: FB, page: `https://www.facebook.com/${FB}/`, cls: 'fb',
      frame: w => `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(`https://www.facebook.com/${FB}/`)}&tabs=timeline&width=${w}&height=600&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&locale=he_IL`, h: 600 },
    youtube: { name: 'יוטיוב', icon: 'youtube', handle: 'עיריית טירת כרמל', page: `https://www.youtube.com/channel/${YT}`, cls: 'yt',
      frame: () => `https://www.youtube-nocookie.com/embed/videoseries?list=${YT.replace(/^UC/, 'UU')}`, h: 260 }
  };
  const qrSvg = url => { if (!window.qrcode) return ''; const q = window.qrcode(0, 'M'); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 3, margin: 1, scalable: true }); };
  /* a card that always works: open in the app, search, or scan from another phone */
  const socCard = (s, msg) => `<div class="soc-card soc-card--${s.cls}">
      <span class="soc-card__logo">${PodIcons.svg(s.icon, 26)}</span>
      <div class="soc-card__txt"><b>עיריית טירת כרמל ב${s.name}</b><small>${esc(s.handle)}</small>${msg ? `<em>${msg}</em>` : ''}</div>
      <div class="soc-card__qr">${qrSvg(s.page)}</div>
      <div class="soc-card__btns"><a class="pill-btn" href="${s.page}" target="_blank" rel="noopener">פתחו ב${s.name}</a>
      ${s.search ? `<a class="ghost-btn" href="${s.search}" target="_blank" rel="noopener">חיפוש העירייה</a>` : ''}</div>
    </div>`;
  let socNow = 'tiktok', ttTimer = 0;
  function loadTikTokScript() {
    document.querySelectorAll('script[data-tt]').forEach(x => x.remove()); // re-run the official script so it renders new blockquotes
    const sc = document.createElement('script'); sc.src = 'https://www.tiktok.com/embed.js'; sc.async = true; sc.dataset.tt = '1';
    document.body.appendChild(sc);
  }
  function tiktok(box) {
    const s = SOCIAL.tiktok, vids = (CFG.tiktokVideos || []).filter(Boolean);
    // 1) featured videos — TikTok's official single-video player (reliable iframe)
    const videos = vids.length ? `<div class="tt-videos">${vids.map(id => `<iframe src="https://www.tiktok.com/player/v1/${encodeURIComponent(id)}?music_info=1&description=1&rel=0" title="סרטון טיקטוק של העירייה" allow="fullscreen; encrypted-media" loading="lazy"></iframe>`).join('')}</div>` : '';
    // 2) the official creator-profile embed (blockquote + embed.js)
    box.innerHTML = videos + `<div class="tt-embed"><blockquote class="tiktok-embed" cite="${s.page}" data-unique-id="${esc(TT)}" data-embed-type="creator" style="max-width:780px;min-width:288px;margin:0">
        <section><a target="_blank" rel="noopener" href="${s.page}?refer=creator_embed">${esc(s.handle)}</a></section></blockquote></div>
      <div class="tt-fallback" hidden></div>`;
    loadTikTokScript();
    // 3) if TikTok did not render (blocked, private/unknown account, slow network) → show the card
    clearTimeout(ttTimer);
    ttTimer = setTimeout(() => {
      if (socNow !== 'tiktok') return;
      const ok = box.querySelector('.tt-embed iframe');
      if (!ok) { box.querySelector('.tt-embed').hidden = true; const fb = box.querySelector('.tt-fallback'); fb.hidden = false;
        fb.innerHTML = socCard(s, 'לא הצלחנו להציג כאן את הפיד. אפשר לצפות ישירות בטיקטוק'); $('#soc-links').innerHTML = ''; }
    }, 7000);
  }
  function social(which) {
    socNow = which || socNow;
    const s = SOCIAL[socNow], box = $('#soc-frame');
    document.querySelectorAll('.soc-tab').forEach(t => t.classList.toggle('on', t.dataset.soc === socNow));
    if (socNow === 'tiktok') tiktok(box);
    else {
      const w = Math.min(500, Math.round(box.clientWidth || 340));
      box.innerHTML = `<iframe src="${s.frame(w)}" title="${s.name} של עיריית טירת כרמל" loading="lazy" style="height:${s.h}px"
        allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    }
    // the reliable path is always there, under the embed
    $('#soc-links').innerHTML = socCard(s);
  }
  document.querySelector('.soc-tabs').addEventListener('click', e => { const b = e.target.closest('[data-soc]'); if (b) social(b.dataset.soc); });

  /* =====================================================================
     6. QR — open the app on another phone
     ===================================================================== */
  function qr() {
    if (!window.qrcode) return;
    const q = window.qrcode(0, 'M'); q.addData(location.origin + location.pathname); q.make();
    $('#qr-app').innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }

  /* =====================================================================
     7. quick navigation chips (scroll inside the front page)
     ===================================================================== */
  document.querySelector('.jump').addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    e.preventDefault();
    const el = document.querySelector(a.getAttribute('href'));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* =====================================================================
     8. DAILY AUDIO BRIEFING — "מהדורת טירת כרמל", read by the chosen voice
     ===================================================================== */
  const dayIdx = () => { const d = new Date(); return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); };
  async function briefing() {
    const btn = $('#briefing'); btn.classList.add('loading');
    if (!liveP) refreshLive();
    await Promise.race([liveP, new Promise(r => setTimeout(r, 6000))]);   // wait for live data, but never more than 6s
    btn.classList.remove('loading');
    const now = new Date(), h = now.getHours();
    const greet = h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 21 ? 'ערב טוב' : 'לילה טוב';
    const L = LIVE, parts = [];
    parts.push(`${greet}, וברוכים הבאים למהדורת טירת כרמל של פודטיסי.`);
    parts.push(`היום ${now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}${L.hdate ? `, ${L.hdate}` : ''}.`);
    if (L.weather) {
      const w = L.weather;
      parts.push(`מזג האוויר: כרגע ${w.t} מעלות ו${w.desc}. הטמפרטורה היום תגיע עד ${w.max} מעלות, ובלילה תרד ל־${w.min}.${w.rain >= 40 ? ` הסיכוי לגשם היום ${w.rain} אחוז, כדאי לקחת מטרייה.` : ''} מחר ${w.tomorrow}, עם ${w.tmax} מעלות.${w.uv >= 7 ? ' מדד הקרינה גבוה, אל תשכחו כובע וקרם הגנה.' : ''}`);
    }
    if (L.air) parts.push(`איכות האוויר בעיר ${L.air}.`);
    if (L.sea) parts.push(`ובים מול טירת כרמל: ${L.sea.st}, גובה הגלים כ־${L.sea.w} מטר${L.sea.t != null ? `, וטמפרטורת המים ${L.sea.t} מעלות` : ''}.`);
    if (L.shabbat && L.shabbat.in) parts.push(`זמני השבת הקרובה: כניסת השבת ב־${L.shabbat.in}, ויציאתה ב־${L.shabbat.out}.${L.shabbat.par ? ` ${L.shabbat.par}.` : ''}`);
    if (L.holiday) parts.push(L.holiday.days === 0 ? `היום ${L.holiday.name}, חג שמח!` : `החג הבא הוא ${L.holiday.name}, בעוד ${L.holiday.days} ימים.`);
    if (L.news && L.news.length) parts.push(`ובכותרות על טירת כרמל: ${L.news.map(t => t.replace(/[|–-]\s*$/, '')).join('. ')}.`);
    const ep = A.PLACES[dayIdx() % A.PLACES.length];
    parts.push(`ופרק היום בפודטיסי: ${ep.title}, ${ep.subtitle}. אפשר להאזין לו עכשיו בעמוד הראשי.`);
    parts.push('ואם צריך משהו מהעירייה, המוקד העירוני מאה ושש זמין בכל שעה. יום נפלא!');
    const today = now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
    A.select({ id: 'briefing', category: 'news', title: 'מהדורת טירת כרמל', subtitle: today, emoji: '', lat: LAT, lng: LNG, radius: 1,
      script: parts.join(' '), sources: ['https://open-meteo.com/', 'https://www.hebcal.com/', 'https://news.google.com/'] });
    A.play(); A.openNow();
  }
  $('#briefing').addEventListener('click', briefing);

  /* =====================================================================
     9. BRANDED PHOTO FRAME — "I was here" picture for sharing
     ===================================================================== */
  let photoImg = null, photoBlob = null;
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  function nearestPlace() {
    const p = A.pos; if (!p) return A.current && !A.current.live && A.current.id !== 'briefing' ? A.current : null;
    return A.PLACES.map(x => ({ x, d: A.distance(p.lat, p.lng, x.lat, x.lng) })).sort((a, b) => a.d - b.d)[0].x;
  }
  async function drawFrame() {
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const i = photoImg, k = Math.max(W / i.width, H / i.height);             // cover
    g.drawImage(i, (W - i.width * k) / 2, (H - i.height * k) / 2, i.width * k, i.height * k);
    const top = g.createLinearGradient(0, 0, 0, 220); top.addColorStop(0, 'rgba(6,20,46,.75)'); top.addColorStop(1, 'rgba(6,20,46,0)');
    g.fillStyle = top; g.fillRect(0, 0, W, 220);
    const bot = g.createLinearGradient(0, H - 420, 0, H); bot.addColorStop(0, 'rgba(6,20,46,0)'); bot.addColorStop(.45, 'rgba(6,20,46,.85)'); bot.addColorStop(1, 'rgba(6,20,46,.97)');
    g.fillStyle = bot; g.fillRect(0, H - 420, W, 420);
    try { const logo = await loadImg('assets/wordmark-navy.png'); const lw = 300, lh = lw * logo.height / logo.width; g.drawImage(logo, W - lw - 50, 50, lw, lh); } catch (e) {}
    g.direction = 'rtl'; g.textAlign = 'right';
    g.fillStyle = '#b9d2ee'; g.font = '500 30px Heebo, sans-serif'; g.fillText('מבית עיריית טירת כרמל', W - 52, 50 + 300 * .3 + 40);
    const sel = $('#photo-place').value, place = A.PLACES.find(p => p.id === sel);
    g.fillStyle = '#6dd5fa'; g.font = '700 40px Heebo, sans-serif'; g.fillText('הייתי כאן', W - 60, H - 230);
    g.fillStyle = '#fff'; g.font = '800 76px Rubik, Heebo, sans-serif';
    g.fillText(place ? place.title : 'טירת כרמל', W - 60, H - 145, W - 120);
    g.fillStyle = '#b9d2ee'; g.font = '400 34px Heebo, sans-serif';
    g.fillText(`${place ? 'טירת כרמל · ' : ''}${new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}`, W - 60, H - 90);
    g.textAlign = 'left'; g.fillStyle = '#6dd5fa'; g.font = '500 30px Heebo, sans-serif'; g.fillText('podtc', 60, H - 90);
    g.strokeStyle = 'rgba(109,213,250,.9)'; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10);
    photoBlob = await new Promise(r => c.toBlob(r, 'image/jpeg', .9));
    $('#photo-out').src = URL.createObjectURL(photoBlob);
  }
  $('#photo-input').addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try { photoImg = await loadImg(URL.createObjectURL(f)); } catch (err) { A.toast('לא הצלחנו לפתוח את התמונה'); return; }
    const near = nearestPlace();
    $('#photo-place').innerHTML = `<option value="">טירת כרמל</option>` + A.PLACES.map(p => `<option value="${p.id}" ${near && near.id === p.id ? 'selected' : ''}>${esc(p.title)}</option>`).join('');
    await drawFrame();
    $('#photo-sheet').hidden = false;
    e.target.value = '';
  });
  $('#photo-place').addEventListener('change', drawFrame);
  $('#photo-close').addEventListener('click', () => { $('#photo-sheet').hidden = true; });
  $('#photo-save').addEventListener('click', () => { if (!photoBlob) return; const a = document.createElement('a'); a.href = URL.createObjectURL(photoBlob); a.download = 'podtc-tirat-carmel.jpg'; document.body.appendChild(a); a.click(); a.remove(); });
  $('#photo-share').addEventListener('click', async () => {
    if (!photoBlob) return;
    const file = new File([photoBlob], 'podtc-tirat-carmel.jpg', { type: 'image/jpeg' });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: 'טיילתי בטירת כרמל עם podtc ' }); return; } } catch (e) { return; }
    $('#photo-save').click(); A.toast('התמונה נשמרה. אפשר לשתף אותה מהגלריה');
  });

  /* =====================================================================
     10. KIDS CORNER
     ===================================================================== */
  document.querySelector('.kids').addEventListener('click', e => {
    const b = e.target.closest('[data-kid]'); if (!b) return;
    const k = b.dataset.kid;
    if (k === 'tour') { document.querySelector('.tab[data-view="map"]').click(); A.startTour('family'); }
    else if (k === 'radio') playStation(STATIONS.find(s => s.id === 'kids'));
    else if (k === 'quiz') { const ep = A.PLACES.find(p => p.id === 'gene-simmons') || A.PLACES[0]; A.select(ep); A.openNow(); A.toast('האזינו לפרק וגללו למטה לחידון'); }
  });

  /* ---------- arrived from a QR sign / shared link: name the place on the splash ---------- */
  const deep = A.PLACES.find(p => '#' + p.id === location.hash);
  if (deep) {
    $('.splash__lead').textContent = deep.title;
    $('.splash__text').textContent = `${deep.subtitle}. לחצו כדי להאזין לסיפור של המקום, ואז המשיכו לגלות את שאר העיר.`;
    $('#btn-start').textContent = 'האזינו לפרק';
  }

  /* ---------- boot: heavy things load when their section comes into view ---------- */
  services(); stations(); qr(); paintCards();
  const lazy = new Map([['live', () => { refreshLive(); setInterval(refreshLive, 10 * 60000); }], ['social', () => social()]]);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const f = lazy.get(en.target.id); if (f) { lazy.delete(en.target.id); f(); }
      io.unobserve(en.target);
    }), { root: $('#home'), rootMargin: '400px 0px' });
    ['live', 'social'].forEach(id => io.observe(document.getElementById(id)));
  } else { refreshLive(); social(); }

  window.PodLive = { refreshLive, playStation: id => playStation(STATIONS.find(s => s.id === id)), STATIONS };
})();
