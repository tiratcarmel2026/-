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
    const tag = /natural|online|neural/i.test(v.name) ? ' ✨ טבעי' : /google/i.test(v.name) ? ' · Google' : '';
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
    A.toast(`🎙️ קול: ${prettyVoice(nx)} (מהמשפט הבא)`);
    N.preview('שלום, זה הקול החדש שלי.');
  });

  /* =====================================================================
     2. MUNICIPAL SERVICES — the city's services in one tap
     ===================================================================== */
  const MUNI = 'https://www.tirat-carmel.muni.il';
  const SERVICES = [
    ['☎️', 'מוקד 106', 'דיווח ופניות 24/7', 'tel:106', 'hot'],
    ['💳', 'תשלומים מקוונים', 'ארנונה, דוחות, אגרות', MUNI + '/Sservice/Pages/Payments.aspx'],
    ['🏠', 'ארנונה והוראת קבע', 'תשלום והצטרפות', MUNI + '/Departments/Pages/ArnonaPayments.aspx'],
    ['📍', 'דיווח מפגע עם מיקום', 'שולחים את המיקום המדויק', '#hazard'],
    ['🏛️', 'אתר העירייה', 'הודעות, מחלקות ומידע', MUNI + '/'],
    ['📞', 'מרכזיית העירייה', '04-8547000', 'tel:048547000'],
    ['🎭', 'המתנ"ס', 'חוגים, אירועים וקייטנות', 'http://www.matnastc.co.il/'],
    ['📘', 'העירייה בפייסבוק', 'עדכונים שוטפים', 'https://www.facebook.com/TCarmel.muni/']
  ];
  const EMERG = [['👮', 'משטרה', '100'], ['🚑', 'מד"א', '101'], ['🚒', 'כבאות', '102'], ['🚨', 'פיקוד העורף', '104'], ['🏛️', 'מוקד עירוני', '106']];
  function services() {
    $('#svc').innerHTML = SERVICES.map(([e, t, d, u, cls]) => {
      const ext = /^https?:/.test(u);
      return `<a class="svc__item ${cls || ''}" href="${u}" ${ext ? 'target="_blank" rel="noopener"' : ''} ${u === '#hazard' ? 'data-hazard="1"' : ''}>
        <span>${e}</span><b>${t}</b><small>${d}</small></a>`;
    }).join('');
    $('#emerg').innerHTML = '<b>חירום:</b>' + EMERG.map(([e, t, n]) => `<a href="tel:${n}">${e} ${t} <b>${n}</b></a>`).join('');
  }
  // hazard report: grab the location and let the person send it (WhatsApp / SMS / mail / 106)
  function hazard() {
    const send = (lat, lng) => {
      const map = `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
      const text = `דיווח מפגע בטירת כרמל 📍 ${map}\nתיאור המפגע: `;
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
  const WMO = c => c === 0 ? ['☀️', 'בהיר'] : c <= 2 ? ['⛅', 'מעונן חלקית'] : c === 3 ? ['☁️', 'מעונן'] : c <= 48 ? ['🌫️', 'ערפל']
    : c <= 57 ? ['🌦️', 'טפטוף'] : c <= 67 ? ['🌧️', 'גשם'] : c <= 77 ? ['❄️', 'שלג'] : c <= 82 ? ['🌦️', 'ממטרים'] : ['⛈️', 'סופת רעמים'];
  // times with an offset (Hebcal) → Israel time; naive local times (Open-Meteo, already Asia/Jerusalem) → read as-is
  const hm = iso => !iso ? '' : /(Z|[+-]\d\d:?\d\d)$/.test(iso)
    ? new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' }) : iso.slice(11, 16);
  const dayName = iso => new Date(iso).toLocaleDateString('he-IL', { weekday: 'short' });
  const card = (cls, icon, title, big, sub) => `<div class="lc ${cls}"><span class="lc__i">${icon}</span><small>${title}</small><b>${big}</b><span class="lc__s">${sub}</span></div>`;
  const cards = {}; // id -> html (rendered in a fixed order as data arrives)
  const ORDER = ['weather', 'forecast', 'air', 'sea', 'sun', 'shabbat', 'hdate'];
  function paintCards() {
    $('#live-cards').innerHTML = ORDER.map(k => cards[k] || `<div class="lc lc--skel"></div>`).join('');
  }

  async function weather() {
    try {
      const d = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&current=temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=Asia%2FJerusalem&forecast_days=4`);
      const c = d.current, dl = d.daily;
      let [ic, desc] = WMO(c.weather_code); if (!c.is_day && c.weather_code === 0) ic = '🌙';
      cards.weather = card('lc--w', ic, 'מזג האוויר עכשיו', `${Math.round(c.temperature_2m)}°`, `${desc} · מורגש ${Math.round(c.apparent_temperature)}° · לחות ${c.relative_humidity_2m}% · רוח ${Math.round(c.wind_speed_10m)} קמ"ש`);
      cards.forecast = `<div class="lc lc--f"><small>תחזית</small><div class="fc">${dl.time.slice(1, 4).map((t, i) => {
        const [fi] = WMO(dl.weather_code[i + 1]);
        return `<span><em>${dayName(t)}</em>${fi}<b>${Math.round(dl.temperature_2m_max[i + 1])}°</b><i>${Math.round(dl.temperature_2m_min[i + 1])}°</i>${dl.precipitation_probability_max[i + 1] >= 30 ? `<u>💧${dl.precipitation_probability_max[i + 1]}%</u>` : ''}</span>`;
      }).join('')}</div></div>`;
      const uv = dl.uv_index_max[0];
      cards.sun = card('lc--sun', '🌅', 'זריחה ושקיעה', `${hm(dl.sunrise[0])} · ${hm(dl.sunset[0])}`, `מדד UV היום: ${Math.round(uv)}${uv >= 8 ? ' · גבוה מאוד, מומלץ כובע וקרם' : uv >= 6 ? ' · גבוה' : ''}`);
    } catch (e) { cards.weather = card('', '⛅', 'מזג האוויר', '—', 'לא זמין כרגע'); }
    paintCards();
  }
  async function air() {
    try {
      const d = await getJSON(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LNG}&current=european_aqi,pm2_5,pm10`);
      const q = d.current.european_aqi;
      const lvl = q <= 20 ? ['🟢', 'טובה מאוד'] : q <= 40 ? ['🟢', 'טובה'] : q <= 60 ? ['🟡', 'בינונית'] : q <= 80 ? ['🟠', 'ירודה'] : ['🔴', 'גרועה'];
      cards.air = card('lc--air', lvl[0], 'איכות האוויר', lvl[1], `מדד ${Math.round(q)} · חלקיקים PM2.5: ${Math.round(d.current.pm2_5)}`);
    } catch (e) { cards.air = ''; }
    paintCards();
  }
  async function sea() {
    try {
      const d = await getJSON(`https://marine-api.open-meteo.com/v1/marine?latitude=32.765&longitude=34.935&current=wave_height,sea_surface_temperature`);
      const w = d.current.wave_height, t = d.current.sea_surface_temperature;
      const st = w < .5 ? 'ים שקט' : w < 1 ? 'ים נוח' : w < 2 ? 'גלי' : 'סוער';
      cards.sea = card('lc--sea', '🌊', 'הים מול טירת כרמל', `${w.toFixed(1)} מ׳`, `${st}${t != null ? ` · מים ${Math.round(t)}°` : ''}`);
    } catch (e) { cards.sea = ''; }
    paintCards();
  }
  async function shabbat() {
    try {
      const d = await getJSON(`https://www.hebcal.com/shabbat?cfg=json&latitude=${LAT}&longitude=${LNG}&tzid=Asia%2FJerusalem&M=on&lg=he`);
      const it = d.items || [];
      const cand = it.find(i => i.category === 'candles'), havd = it.find(i => i.category === 'havdalah'), par = it.find(i => i.category === 'parashat');
      cards.shabbat = card('lc--sh', '🕯️', 'זמני שבת', `${hm(cand && cand.date)} · ${hm(havd && havd.date)}`, `כניסה · יציאה${par ? ` · ${esc(par.hebrew || par.title)}` : ''}`);
    } catch (e) { cards.shabbat = ''; }
    paintCards();
  }
  async function hdate() {
    try {
      const d = await getJSON('https://www.hebcal.com/converter?cfg=json&g2h=1&strict=1');
      cards.hdate = card('lc--hd', '📅', 'התאריך העברי', esc(d.hebrew), new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
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
  async function fromGoogle() {
    const d = await getJSON(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(GNEWS)}`, 9000);
    if (d.status !== 'ok') throw new Error('rss');
    return d.items.map(i => {
      const m = i.title.match(/^(.*) - ([^-]+)$/);
      return { title: m ? m[1] : i.title, link: i.link, date: i.pubDate.replace(' ', 'T') + 'Z', src: m ? m[2] : 'Google News' };
    });
  }
  async function news() {
    const results = await Promise.allSettled([...NEWS_SITES.map(fromWP), fromGoogle()]);
    const seen = new Set();
    const items = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
      .filter(i => i.title && !seen.has(i.title) && seen.add(i.title))
      .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
    $('#news-list').innerHTML = items.length ? items.map(i => `<li><a href="${esc(i.link)}" target="_blank" rel="noopener">
        <b>${esc(i.title)}</b><small>${esc(i.src)} · ${ago(i.date)}</small></a></li>`).join('')
      : `<li class="news__empty">לא הצלחנו לטעון כותרות כרגע. אפשר לקרוא את החדשות ישירות במקורות:</li>`;
    $('#news-more').innerHTML = [
      ['🔎 חדשות טירת כרמל בגוגל', 'https://news.google.com/search?q=%22%D7%98%D7%99%D7%A8%D7%AA%20%D7%9B%D7%A8%D7%9E%D7%9C%22&hl=he&gl=IL&ceid=IL:he'],
      ['📰 חדשות טירת כרמל', 'https://www.tcarmel.org.il/'],
      ['🏛️ הודעות העירייה', MUNI + '/']
    ].map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join('');
  }
  async function wikiLive() {
    try {
      const d = await getJSON('https://he.wikipedia.org/api/rest_v1/page/summary/%D7%98%D7%99%D7%A8%D7%AA_%D7%9B%D7%A8%D7%9E%D7%9C');
      if (!d.extract) return;
      $('#wiki-live').hidden = false;
      $('#wiki-live').innerHTML = `<b>📖 טירת כרמל בוויקיפדיה, מתעדכן ברשת</b><p>${esc(d.extract.slice(0, 420))}${d.extract.length > 420 ? '…' : ''}</p>
        <a href="${esc(d.content_urls && d.content_urls.mobile ? d.content_urls.mobile.page : 'https://he.wikipedia.org/wiki/טירת_כרמל')}" target="_blank" rel="noopener">לערך המלא ›</a>`;
    } catch (e) {}
  }
  function refreshLive() {
    paintCards();
    Promise.allSettled([weather(), air(), sea(), shabbat(), hdate(), news(), wikiLive()]).then(() => {
      $('#live-upd').textContent = 'עודכן ' + new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    });
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
    $('#rb-name').textContent = `📻 ${s.name} ${/^\d/.test(s.freq) ? s.freq : ''}`.trim();
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
      radioState('השידור לא זמין כרגע', false);
      A.toast(`לא הצלחנו להתחבר ל${station.name}. פותחים את אתר התחנה…`);
      if (station.site) setTimeout(() => window.open(station.site, '_blank', 'noopener'), 900);
      return;
    }
    // HLS (.m3u8) plays natively on Safari only — skip it elsewhere
    if (/\.m3u8/.test(url) && !audio.canPlayType('application/vnd.apple.mpegurl')) return tryNext();
    audio.src = url;
    audio.play().catch(() => {});
  }
  audio.addEventListener('playing', () => radioState('🔴 שידור חי', true));
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
  $('#rb-close').addEventListener('click', () => { audio.pause(); audio.removeAttribute('src'); audio.load(); station = null; $('#radiobar').hidden = true; clearTimeout(sleepT); sleepUntil = 0; $('#rb-sleep').textContent = '⏲'; document.body.classList.remove('radio-on'); stations(); });
  $('#rb-sleep').addEventListener('click', () => {
    const cur = sleepUntil ? Math.round((sleepUntil - Date.now()) / 60000) : 0;
    const next = [15, 30, 60].find(m => m > cur + 1) || 0; // 15 → 30 → 60 → off
    clearTimeout(sleepT); sleepUntil = 0;
    if (next) { sleepUntil = Date.now() + next * 60000; sleepT = setTimeout(() => audio.pause(), next * 60000); $('#rb-sleep').textContent = next + "'"; A.toast(`⏲ הרדיו ייכבה בעוד ${next} דקות`); }
    else { $('#rb-sleep').textContent = '⏲'; A.toast('הטיימר בוטל'); }
  });
  // an episode starting stops the radio
  N.on('state', s => { if (s === 'playing' && !audio.paused) { audio.pause(); A.toast('📻 הרדיו הושהה בזמן הפרק'); } });

  /* =====================================================================
     5. THE MUNICIPALITY ON SOCIAL NETWORKS — embedded (lazy-loaded)
     ===================================================================== */
  const SOCIAL = {
    tiktok: { name: 'טיקטוק', handle: '@tiratcarmel.muni', page: 'https://www.tiktok.com/@tiratcarmel.muni',
      frame: 'https://www.tiktok.com/embed/@tiratcarmel.muni', h: 620 },
    facebook: { name: 'פייסבוק', handle: 'TCarmel.muni', page: 'https://www.facebook.com/TCarmel.muni/',
      frame: w => `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent('https://www.facebook.com/TCarmel.muni/')}&tabs=timeline&width=${w}&height=600&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&locale=he_IL`, h: 600 },
    youtube: { name: 'יוטיוב', handle: 'עיריית טירת כרמל', page: 'https://www.youtube.com/channel/UCeGhFSCGBTK18f_c3dQPQWg',
      frame: 'https://www.youtube-nocookie.com/embed/videoseries?list=UUeGhFSCGBTK18f_c3dQPQWg', h: 260 }
  };
  let socNow = 'tiktok', socLoaded = false;
  function social(which) {
    socNow = which || socNow;
    const s = SOCIAL[socNow];
    document.querySelectorAll('.soc-tab').forEach(t => t.classList.toggle('on', t.dataset.soc === socNow));
    const w = Math.min(500, Math.round($('#soc-frame').clientWidth || 340));
    const src = typeof s.frame === 'function' ? s.frame(w) : s.frame;
    $('#soc-frame').innerHTML = `<iframe src="${src}" title="${s.name} של עיריית טירת כרמל" loading="lazy" style="height:${s.h}px"
      allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    $('#soc-links').innerHTML = Object.values(SOCIAL).map(x => `<a href="${x.page}" target="_blank" rel="noopener">פתחו ב${x.name} ›</a>`).join('');
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

  /* ---------- arrived from a QR sign / shared link: name the place on the splash ---------- */
  const deep = A.PLACES.find(p => '#' + p.id === location.hash);
  if (deep) {
    $('.splash__lead').textContent = `${deep.emoji} ${deep.title}`;
    $('.splash__text').textContent = `${deep.subtitle}. לחצו כדי להאזין לסיפור של המקום, ואז המשיכו לגלות את שאר העיר.`;
    $('#btn-start').textContent = '🎧 האזינו לפרק';
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
