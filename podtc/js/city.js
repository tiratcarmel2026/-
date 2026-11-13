/* podtc — city layer: home search bar · bus lines · city facts · municipal notices between sections · photo gallery */
(function () {
  const A = window.PodApp, CFG = window.PODTC_CONFIG || {}, $ = s => document.querySelector(s);
  if (!A) return;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ic = (n, s) => window.PodIcons ? PodIcons.svg(n, s || 20) : '';
  const inner = $('.home__inner');
  const before = (html, id) => { const ref = document.getElementById(id); if (ref) ref.insertAdjacentHTML('beforebegin', html); else inner.insertAdjacentHTML('beforeend', html); };
  const after = (html, id) => { const ref = document.getElementById(id); if (ref) ref.insertAdjacentHTML('afterend', html); };
  const FB = (CFG.social && CFG.social.facebook) || 'TCarmel.muni';

  /* ================= 1. search bar on the front page ================= */
  const jump = $('.jump');
  if (jump) jump.insertAdjacentHTML('beforebegin', `<button class="hsearch" id="hsearch" aria-label="חיפוש באתר">
      ${ic('search', 20)}<span>חפשו מקום, נושא, קו אוטובוס או שירות…</span><kbd>/</kbd></button>`);
  document.addEventListener('click', e => { if (e.target.closest('#hsearch')) $('#btn-search').click(); });

  /* ================= 2. bus lines ================= */
  // Sources: bus.co.il (lines serving Tirat Carmel), busnearby.co.il, markav.net, Maale HaCarmel directions page.
  const BUS = [
    ['44', 'טירת כרמל (מעלה הכרמל)', 'חיפה, גרנד קניון', 'דרך הרצל וזיו', 'c'],
    ['45', 'מרכזית חוף הכרמל', 'טירת כרמל (מעלה הכרמל)', 'קו עירוני מהרכבת', 'c'],
    ['46', 'טירת כרמל', 'חיפה', 'עוצר בצומת טירת כרמל', 'c'],
    ['47', 'מרכזית חוף הכרמל', 'טירת כרמל (מעלה הכרמל)', 'דרך הרצל ומוצקין', 'c'],
    ['49', 'מרכזית חוף הכרמל', 'טירת כרמל (מעלה הכרמל)', 'קו עירוני מהרכבת', 'c'],
    ['110', 'טירת כרמל', 'כפר חסידים', 'עוצר בצומת טירת כרמל', 'r'],
    ['111', 'טירת כרמל', 'נשר', 'קו ישיר מנשר', 'r'],
    ['148', 'טירת כרמל', 'אוניברסיטת חיפה', 'לסטודנטים', 'r'],
    ['202', 'טירת כרמל', 'רכבת פרדס חנה־כרכור', 'לכיוון דרום', 'i'],
    ['205', 'חיפה', 'טירת כרמל (מעלה הכרמל)', 'עובר בהרצל', 'c'],
    ['221', 'טירת כרמל', 'מרכזית חוף הכרמל', 'עוצר באזור התעשייה', 'i'],
    ['245', 'חיפה', 'טירת כרמל (מעלה הכרמל)', 'עובר בהרצל', 'c'],
    ['21', 'טירת כרמל', 'חיפה', 'עוצר בתחנת בסיס תובלה', 'c'],
    ['921', 'טירת כרמל', 'חיפה', 'עוצר בתחנת בסיס תובלה', 'i']
  ];
  const KIND = { c: ['עירוני', '#0E86B8'], r: ['אזורי', '#2563EB'], i: ['בין־עירוני', '#12407A'] };
  const busUrl = n => `https://busnearby.co.il/%D7%A7%D7%95%D7%95%D7%99%D7%9D/%D7%98%D7%99%D7%A8%D7%AA%20%D7%9B%D7%A8%D7%9E%D7%9C`;
  const busRow = ([n, a, b, note, k]) => `<a class="bus" style="--c:${KIND[k][1]}" href="${busUrl()}" target="_blank" rel="noopener" data-q="${esc(n + ' ' + a + ' ' + b + ' ' + note + ' ' + KIND[k][0])}">
      <b class="bus__n">${n}</b><span class="bus__r"><strong>${esc(a)} <i aria-hidden="true">⇄</i> ${esc(b)}</strong><small>${KIND[k][0]} · ${esc(note)}</small></span></a>`;
  before(`<section class="shelf block" id="bus-block" style="--c:#0E86B8">
      <div class="shelf__h"><h2>קווי אוטובוס <small>${BUS.length} קווים שעוברים בטירת כרמל</small></h2></div>
      <div class="bus-tools">
        <label class="bus-find">${ic('search', 18)}<input id="bus-q" type="search" placeholder="מספר קו או יעד, למשל 45 או נשר" aria-label="חיפוש קו אוטובוס"></label>
        <div class="bus-filters" role="group" aria-label="סוג קו">
          <button class="bchip on" data-bk="">הכול</button><button class="bchip" data-bk="עירוני">עירוני</button><button class="bchip" data-bk="אזורי">אזורי</button><button class="bchip" data-bk="בין־עירוני">בין־עירוני</button>
        </div>
      </div>
      <div class="bus-grid" id="bus-grid">${BUS.map(busRow).join('')}</div>
      <p class="bus-empty" id="bus-empty" hidden>לא נמצא קו מתאים.</p>
      <div class="bus-more">
        <a class="pillc" style="--c:#0E86B8" href="${busUrl()}" target="_blank" rel="noopener">${ic('bus', 18)}זמני הגעה בזמן אמת</a>
        <a class="pillc" style="--c:#2563EB" href="https://www.bus.co.il/otobusimmvc/Lines/0/0/972478/Tirat%20Carmel" target="_blank" rel="noopener">${ic('calendar', 18)}לוחות זמנים מלאים</a>
        <a class="pillc" style="--c:#1E6FC2" href="https://www.rail.co.il/" target="_blank" rel="noopener">${ic('train', 18)}רכבת: חוף הכרמל</a>
        <a class="pillc" style="--c:#12407A" href="tel:*8787">${ic('phone', 18)}מוקד כל־קו <bdi dir="ltr">*8787</bdi></a>
      </div>
      <p class="shelf__note bus-note">המטרונית (קו 1) והרכבת עוצרות במרכזית חוף הכרמל, ומשם ממשיכים לעיר בקווים 45, 47 ו־49. המידע לפי מאגרי תחבורה ציבורית פתוחים. מסלולים וזמנים משתנים, ולכן כדאי לבדוק לפני היציאה.</p>
    </section>`, 'services');
  let bk = '';
  function busFilter() {
    const q = ($('#bus-q').value || '').trim(); let n = 0;
    document.querySelectorAll('#bus-grid .bus').forEach(el => { const ok = (!q || el.dataset.q.includes(q)) && (!bk || el.dataset.q.includes(bk)); el.hidden = !ok; if (ok) n++; });
    $('#bus-empty').hidden = n > 0;
  }
  $('#bus-q').addEventListener('input', busFilter);
  $('#bus-block').addEventListener('click', e => { const b = e.target.closest('.bchip'); if (!b) return; bk = b.dataset.bk; document.querySelectorAll('.bchip').forEach(x => x.classList.toggle('on', x === b)); busFilter(); });

  /* ================= 3. the city in facts ================= */
  const FACTS = [
    ['31,579', 'תושבים', 'נכון ל־1.10.2026, לפי הביטוח הלאומי', '#2563EB'],
    ['28%', 'ילדים ונוער', 'עד גיל 18', '#2A8AD6'],
    ['16%', 'אזרחים ותיקים', 'מתושבי העיר', '#12407A'],
    ['1949', 'העולים הראשונים', 'מרכזי קליטה ומעברות', '#12407A'],
    ['1954', 'מועצה מקומית', 'איחוד מרכזי הקליטה', '#0A6E9E'],
    ['1992', 'הכרזה כעיר', 'טירת כרמל הופכת לעיר', '#1E6FC2'],
    ['86,000', 'תושבים בעתיד', 'היעד של תוכנית המתאר', '#0E86B8'],
    ['12,000', 'דירות חדשות', 'מתוכננות בתוכנית המתאר', '#1557A8']
  ];
  const INFO = [
    ['pin', 'איפה אנחנו', 'מדרום לחיפה, בין כביש 4 ומישור החוף ממערב לבין מורדות הר הכרמל ממזרח, ומצפון למועצה האזורית חוף הכרמל.'],
    ['home', 'שכונות', 'העיר הוותיקה ומרכז העיר (סביב רחוב הרצל), שז"ר, דקר, עמידר, כהן, ביאליק, רמב"ם, גיורא, בן צבי, נווה גלים, גלי כרמל, הכלניות, נוף ים, נאות כרמל, מעלה נוף, רמת בגין, נווה אליאס, החותרים ואיילת הכרמל. בתכנון: שכונה חדשה במתחם תע"ש.'],
    ['building', 'עירייה', 'בניין העירייה נמצא ברחוב הרצל 6. מוקד עירוני 106 פועל 24 שעות ביממה. מרכזייה: 04-8547000.'],
    ['wave', 'מים וביוב', 'תאגיד המים והביוב של העיר הוא מעיינות החוף, תאגיד משותף לטירת כרמל ולקריית ביאליק (טירת כרמל הצטרפה אליו בשנת 2016). על תקלות מים וביוב מדווחים למוקד התאגיד, או למוקד העירוני 106.'],
    ['heart', 'בריאות', 'בעיר פועל המרכז לבריאות הנפש מעלה הכרמל, שאליו מגיעים קווי האוטובוס 44, 45, 47 ו־49.'],
    ['train', 'תחבורה', 'תחנת הרכבת והמרכזית חוף הכרמל צמודות לעיר מצפון. מנהרות הכרמל מקצרות את הדרך למפרץ חיפה.'],
    ['leaf', 'טבע', 'מעל העיר: פארק הכרמל, נחל גלים, נחל כלח ועין קדם. מדרום: חי בר כרמל ושמורת כלח־גלים.'],
    ['star', 'אנשים', 'מבני העיר: הכדורגלנים ראובן עטר, רועי עטר, מרקו בלבול, רפי כהן וחיים מגרלשווילי, והשחקן והקומיקאי שלום אסייג.'],
    ['crane', 'העיר של מחר', 'תוכנית המתאר מתכננת חוף רחצה עירוני, טיילת, שכונה חדשה במתחם תע"ש והתחדשות עירונית רחבה במרכז.']
  ];
  const NBH = [['העיר הוותיקה'], ['מרכז העיר'], ['שז"ר', 'renew'], ['דקר', 'renew'], ['עמידר', 'renew'], ['כהן', 'renew'], ['ביאליק', 'renew'], ['רמב"ם', 'renew'], ['גיורא', 'renew'], ['בן צבי', 'renew'],
    ['נווה גלים'], ['גלי כרמל'], ['הכלניות'], ['נוף ים'], ['נאות כרמל'], ['מעלה נוף'], ['רמת בגין'], ['נווה אליאס'], ['החותרים', 'new'], ['איילת הכרמל', 'new'], ['מתחם תע"ש', 'plan']];
  before(`<section class="shelf block" id="city-block" style="--c:#123E7C">
      <div class="shelf__h"><h2>טירת כרמל בקצרה <small>מספרים, עובדות ומה שכדאי לדעת</small></h2></div>
      <div class="facts">${FACTS.map(([n, l, d, c]) => `<div class="fact" style="--c:${c}"><b>${n}</b><span>${l}</span><small>${d}</small></div>`).join('')}</div>
      <h3 class="nbh__h">השכונות של טירת כרמל</h3>
      <div class="nbh">${NBH.map(([n, t]) => `<span class="nbh__i${t ? ' nbh__i--' + t : ''}">${n}${t === 'new' ? '<small>חדשה</small>' : t === 'plan' ? '<small>בתכנון</small>' : t === 'renew' ? '<small>התחדשות</small>' : ''}</span>`).join('')}</div>
      <p class="shelf__note">לפי מסמכי תוכנית המתאר הכוללנית של העיר. שכונות המסומנות "התחדשות" מיועדות להתחדשות עירונית.</p>
      <div class="infos">${INFO.map(([i, t, d]) => `<details class="info"><summary>${ic(i, 20)}<b>${t}</b></summary><p>${esc(d)}</p></details>`).join('')}</div>
      <p class="shelf__note">מקורות: המוסד לביטוח לאומי, מנהל התכנון, ויקיפדיה ועיתונות. מצאתם טעות? <button class="link" id="city-fb">ספרו לנו</button></p>
    </section>`, 'future');
  const cf = $('#city-fb'); if (cf) cf.addEventListener('click', () => { const b = $('#foot-feedback'); if (b) b.click(); });
  document.querySelectorAll('#city-block .info').forEach((d, i) => { if (i < 2 && innerWidth >= 1024) d.open = true; });

  /* ================= 4. municipal notices, placed between the sections ================= */
  const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const when = d => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); if (!m) return [esc(d || ''), false];
    const dt = new Date(+m[1], +m[2] - 1, +m[3]), days = Math.round((Date.now() - dt) / 864e5);
    return [days <= 0 ? 'היום' : days === 1 ? 'אתמול' : days < 7 ? `לפני ${days} ימים` : `${+m[3]} ב${MONTHS[+m[2] - 1]}`, days <= 31]; };
  const NOTICES = (CFG.notices || []).slice();
  const TAGC = ['#1557A8', '#2563EB', '#1E6FC2', '#0A6E9E', '#12407A', '#2A8AD6'];
  const notice = (n, i) => { const [w, fresh] = when(n.date), c = TAGC[i % TAGC.length], ep = n.ep && A.PLACES.find(p => p.id === n.ep);
    return `<aside class="notice" style="--c:${c}" aria-label="מודעת עירייה">
      <span class="notice__pin" aria-hidden="true">${ic('news', 22)}</span>
      <div class="notice__b"><span class="notice__k">לוח המודעות · ${esc(n.tag || 'עירייה')}${fresh ? '<em>חדש</em>' : ''}</span>
        <b>${esc(n.title)}</b><p>${esc(n.text || '')}</p>
        <span class="notice__m">${w}${n.src ? ' · ' + esc(n.src) : ''}</span></div>
      <div class="notice__act">${n.url ? `<a href="${esc(n.url)}" target="_blank" rel="noopener">לפרטים</a>` : ''}${ep ? `<button data-x="art-ep" data-id="${ep.id}">האזינו</button>` : ''}</div></aside>`; };
  const SLOTS = ['recent-block', 'top10-block', 'browse-block', 'shorts-block', 'radio', 'kids'];
  NOTICES.slice(0, SLOTS.length).forEach((n, i) => before(notice(n, i), SLOTS[i]));
  // the board itself: every notice + the municipality's channels
  before(`<section class="shelf block" id="board-block" style="--c:#1557A8">
      <div class="shelf__h"><h2>לוח המודעות של העירייה <small>עדכונים מהחודש האחרון</small></h2></div>
      <div class="board">${NOTICES.map((n, i) => { const [w, fresh] = when(n.date); return `<a class="bnote" style="--c:${TAGC[i % TAGC.length]}" href="${esc(n.url || '#')}" target="_blank" rel="noopener">
        <span class="bnote__k">${esc(n.tag || 'עירייה')}${fresh ? '<em>חדש</em>' : ''}</span><b>${esc(n.title)}</b><small>${w}${n.src ? ' · ' + esc(n.src) : ''}</small></a>`; }).join('')}</div>
      <div class="bus-more">
        <a class="pillc" style="--c:#1877F2" href="https://www.facebook.com/${FB}" target="_blank" rel="noopener">${ic('facebook', 18)}כל המודעות בפייסבוק של העירייה</a>
        <a class="pillc" style="--c:#111827" href="https://www.tiktok.com/@${(CFG.social && CFG.social.tiktok) || 'tiratcarmel.muni'}" target="_blank" rel="noopener">${ic('tiktok', 18)}טיקטוק העירייה</a>
        <a class="pillc" style="--c:#123E7C" href="https://www.tirat-carmel.muni.il/" target="_blank" rel="noopener">${ic('building', 18)}הודעות באתר העירייה</a>
      </div></section>`, 'live');

  /* ================= 5. photo gallery ================= */
  const G = CFG.gallery || [];
  const fbPlugin = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent('https://www.facebook.com/' + FB)}&tabs=timeline&width=500&height=640&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false`;
  after(`<section class="shelf block" id="gallery-block" style="--c:#2A8AD6">
      <div class="shelf__h"><h2>גלריית העיר <small>תמונות מעמוד הפייסבוק של העירייה</small></h2></div>
      ${G.length ? `<div class="gal">${G.map((g, i) => `<button class="gal__i" data-gi="${i}"><img src="${esc(g.src)}" alt="${esc(g.caption || 'תמונה מטירת כרמל')}" loading="lazy" onerror="this.closest('.gal__i').remove()"><span>${esc(g.caption || '')}</span></button>`).join('')}</div>` : ''}
      <div class="galfb">
        <div class="galfb__frame"><iframe title="עמוד הפייסבוק של עיריית טירת כרמל" data-src="${fbPlugin}" loading="lazy" scrolling="no" frameborder="0" allow="encrypted-media; picture-in-picture; web-share"></iframe>
          <div class="galfb__ph"><span>${ic('camera', 30)}</span><b>התמונות נטענות מפייסבוק</b><small>אם העמוד לא נטען, פתחו את האלבומים בכפתורים שלצד</small></div></div>
        <div class="galfb__side">
          <a class="galbtn" style="--c:#1877F2" href="https://www.facebook.com/${FB}/photos" target="_blank" rel="noopener">${ic('camera', 22)}<b>כל התמונות</b><small>אלבומי העירייה בפייסבוק</small></a>
          <a class="galbtn" style="--c:#2A8AD6" href="https://www.facebook.com/${FB}/videos" target="_blank" rel="noopener">${ic('youtube', 22)}<b>סרטונים</b><small>וידאו מאירועי העיר</small></a>
          <a class="galbtn" style="--c:#1E6FC2" href="https://www.facebook.com/${FB}/events" target="_blank" rel="noopener">${ic('calendar', 22)}<b>אירועים</b><small>מה קורה בקרוב</small></a>
          <button class="galbtn" style="--c:#0A6E9E" id="gal-photo">${ic('star', 22)}<b>צלמו את העיר</b><small>מסגרת podtc לתמונה שלכם</small></button>
        </div>
      </div></section>`, 'social');
  // load the Facebook frame only when the gallery scrolls into view
  const fr = $('#gallery-block iframe');
  if (fr && 'IntersectionObserver' in window) new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { fr.src = fr.dataset.src; o.disconnect(); } }), { root: $('#home'), rootMargin: '300px' }).observe(fr);
  else if (fr) fr.src = fr.dataset.src;
  const gp = $('#gal-photo'); if (gp) gp.addEventListener('click', () => { const s = document.getElementById('photo'); if (s) s.scrollIntoView({ behavior: 'smooth' }); });
  // lightbox for configured photos
  if (G.length) {
    document.body.insertAdjacentHTML('beforeend', `<div class="lightbox" id="lightbox" hidden role="dialog" aria-modal="true" aria-label="תמונה מוגדלת"><button class="x" aria-label="סגירה">✕</button><img alt=""><p></p></div>`);
    const lb = $('#lightbox');
    document.addEventListener('click', e => { const b = e.target.closest('[data-gi]'); if (b) { const g = G[+b.dataset.gi]; lb.querySelector('img').src = g.src; lb.querySelector('img').alt = g.caption || ''; lb.querySelector('p').textContent = g.caption || ''; lb.hidden = false; } else if (e.target.closest('#lightbox')) lb.hidden = true; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.hidden = true; });
  }

  /* ================= 6. search also finds bus lines, facts, services and links ================= */
  const EXTRA = [
    ...BUS.map(([n, a, b, note, k]) => ({ t: `קו ${n}: ${a} ⇄ ${b}`, s: `אוטובוס ${KIND[k][0]} · ${note}`, q: `קו ${n} אוטובוס ${a} ${b} ${note}`, go: 'bus-block', i: 'bus' })),
    ...INFO.map(([i, t, d]) => ({ t, s: d.slice(0, 70) + '…', q: t + ' ' + d, go: 'city-block', i })),
    ...NOTICES.map(n => ({ t: n.title, s: 'לוח המודעות · ' + (n.tag || ''), q: n.title + ' ' + (n.text || '') + ' מודעה הודעה', go: 'board-block', i: 'news' })),
    { t: 'רדיו חי', s: 'תחנות רדיו בשידור חי', q: 'רדיו תחנות גלגלצ חיפה מוזיקה', go: 'radio', i: 'radio' },
    { t: 'מזג אוויר וחי עכשיו', s: 'תחזית, ים, שבת וחדשות', q: 'מזג אוויר תחזית גשם ים גלים שבת חדשות', go: 'live', i: 'sun' },
    { t: 'שירותי העירייה', s: 'מוקד 106, תשלומים, דיווח מפגע', q: 'שירותים עירייה מוקד 106 ארנונה תשלום מפגע חירום טלפון', go: 'services', i: 'building' },
    { t: 'גלריית העיר', s: 'תמונות מהפייסבוק של העירייה', q: 'גלריה תמונות פייסבוק צילום', go: 'gallery-block', i: 'camera' },
    { t: 'קישורים שימושיים', s: 'אתרים ומספרי טלפון', q: 'קישורים אתרים רכבת וייז מתנס', go: 'links-block', i: 'link' },
    { t: 'סיורים מודרכים', s: 'מסלולי הליכה עם פודקאסט', q: 'סיור סיורים מסלול הליכה טיול', go: 'tours-block', i: 'walk' },
    { t: 'פינת הילדים', s: 'משחק, חידון ורדיו לילדים', q: 'ילדים משחק חידון משפחה', go: 'kids', i: 'game' },
    { t: 'הגדרות נגישות', s: 'גודל טקסט, ניגודיות ועוד', q: 'נגישות ניגודיות גודל טקסט', go: '@a11y', i: 'people' }
  ];
  function extraSearch() {
    const q = ($('#gsearch').value || '').trim(), box = $('#gsearch-res'); if (!box) return;
    const hits = q ? EXTRA.filter(x => x.q.includes(q) || x.t.includes(q)).slice(0, 12) : [];
    const old = box.querySelector('.search-extra'); if (old) old.remove();
    if (!hits.length) return;
    const empty = box.querySelector('.search-empty'); if (empty) empty.remove();
    box.insertAdjacentHTML('afterbegin', `<div class="search-extra"><p class="search-count">באתר</p>${hits.map(h => `<button class="srow srow--x" data-go="${h.go}"><span class="srow__ic">${ic(h.i, 20)}</span><span class="srow__t"><b>${esc(h.t)}</b><small>${esc(h.s)}</small></span></button>`).join('')}</div>`);
  }
  $('#gsearch').addEventListener('input', extraSearch);
  $('#btn-search').addEventListener('click', () => setTimeout(extraSearch, 0));
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    $('#search-close').click();
    if (b.dataset.go === '@a11y') { window.PodA11y && PodA11y.open(); return; }
    const el = document.getElementById(b.dataset.go); if (el) { el.classList.add('in'); setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  });
  // suggestions under the search field
  const chips = $('#gsearch-chips');
  if (chips) new MutationObserver(() => { if (chips.querySelector('.schip--q')) return;
    chips.insertAdjacentHTML('beforeend', ['קו 45', 'חוף', 'בית כנסת', 'רכבת', 'מוקד 106', 'מעיין'].map(t => `<button class="schip schip--q" data-sq="${t}">${t}</button>`).join('')); }).observe(chips, { childList: true });
  document.addEventListener('click', e => { const b = e.target.closest('[data-sq]'); if (!b) return; const f = $('#gsearch'); f.value = b.dataset.sq; f.dispatchEvent(new Event('input')); });

  // jump chips for the new sections
  if (jump) jump.insertAdjacentHTML('beforeend', `<a href="#bus-block">אוטובוסים</a><a href="#board-block">מודעות</a><a href="#city-block">על העיר</a><a href="#gallery-block">גלריה</a>`);
  if (window.PodIcons) PodIcons.hydrate();
})();
