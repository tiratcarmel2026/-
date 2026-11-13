/* podtc — management screen.
 * Sign-in is checked against GitHub (the place the site is stored): user name + a personal access key.
 * Everything edited here is kept as a draft in this browser, can be previewed on the real site,
 * and "publish" writes one file (js/content.js) to the site's repository; the site updates in about a minute. */
(function () {
  const OWNER = 'tiratcarmel2026', REPO = '-', BRANCH = 'claude/nicky-cleanup-game-g4cvvu', DIR = 'podtc/', FILE = DIR + 'js/content.js';
  const API = 'https://api.github.com';
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));
  const PLACES0 = clone(window.PODTC_PLACES || []), CATS = window.PODTC_CATEGORIES || {}, CFG = window.PODTC_CONFIG || {};
  let token = '', user = '', C = {}, sha = null, dirty = false, tab = 'dash';

  const SECTIONS = [['articles-block', 'החדשות האחרונות'], ['services', 'שירותי העירייה'], ['bus-block', 'קווי אוטובוס'], ['board-block', 'לוח המודעות'], ['quick', 'בחירות מהירות'], ['hero', 'פרק היום'],
    ['near-block', 'קרוב אליכם'], ['top10-block', '10 פרקים שחובה לשמוע'], ['tours-block', 'סיורים מודרכים'], ['browse-block', 'גלו לפי נושא'], ['sections', 'כל הפודקאסטים לפי נושא'], ['share-band', 'פס השיתוף'],
    ['shorts-block', 'פרקים קצרים'], ['wrapped', 'ה־podtc שלכם'], ['live', 'חי עכשיו'], ['radio', 'רדיו בשידור חי'], ['city-block', 'טירת כרמל בקצרה'], ['future', 'העיר של מחר'], ['kids', 'פינת הילדים'],
    ['social', 'ברשתות החברתיות'], ['gallery-block', 'גלריית העיר'], ['photo', 'מסגרת לתמונה'], ['install-card', 'התקנה למסך הבית'], ['links-block', 'קישורים שימושיים']];
  const ARTICLES0 = [
    { title: 'פי 3 תושבים וחוף ים: תוכנית המתאר של טירת כרמל אושרה', src: 'מרכז הנדל"ן', link: 'https://www.nadlancenter.co.il/article/8168', ep: 'beach-plan' },
    { title: '1,200 דירות בטירת כרמל: אושרה תוכנית הענק של נופי רוממה וצמח המרמן', src: 'מרכז הנדל"ן', link: 'https://www.nadlancenter.co.il/article/15566', ep: 'weizmann-towers' },
    { title: 'תושבי הצפון נוהרים לרחוב שיהפוך לדיזנגוף', src: 'מעריב', link: 'https://www.maariv.co.il/economy/realestate/article-1350591', ep: 'herzl-street' },
    { title: 'למי קראתם פרבר? העיר שהפכה מתחת לרדאר ללהיט של הצפון', src: 'מעריב', link: 'https://www.maariv.co.il/economy/realestate/article-1211715', ep: 'nof-yam' },
    { title: 'מגדלים בטירת כרמל: תוכניות התחדשות ליותר מ־1,800 דירות יגיעו לדיון על הפקדה', src: 'מרכז הנדל"ן', link: 'https://www.nadlancenter.co.il/article/11512', ep: 'city-renewal' }];
  const catOpts = () => Object.keys(CATS).filter(k => k !== 'live' && k !== 'news').map(k => [k, CATS[k].label]);

  /* ---------------- GitHub ---------------- */
  const gh = (path, opt = {}) => fetch(API + path, Object.assign({}, opt, { headers: Object.assign({ Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token, 'X-GitHub-Api-Version': '2022-11-28' }, opt.headers || {}) }));
  const b64 = str => { const bytes = new TextEncoder().encode(str); let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); }); return btoa(s); };
  const unb64 = b => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), c => c.charCodeAt(0)));
  const enc = p => p.split('/').map(encodeURIComponent).join('/');
  async function signIn(u, t) {
    token = t.trim(); user = u.trim();
    const me = await gh('/user'); if (me.status === 401) throw new Error('שם המשתמש או מפתח הגישה שגויים');
    if (!me.ok) throw new Error('לא הצלחנו להתחבר (שגיאה ' + me.status + ')');
    const who = await me.json(); if (user && who.login.toLowerCase() !== user.toLowerCase()) throw new Error('מפתח הגישה שייך למשתמש אחר (' + who.login + ')');
    user = who.login;
    const rp = await gh(`/repos/${OWNER}/${encodeURIComponent(REPO)}`); if (!rp.ok) throw new Error('למשתמש הזה אין גישה לאתר');
    const repo = await rp.json(); if (!(repo.permissions && repo.permissions.push)) throw new Error('למפתח הגישה אין הרשאת כתיבה לאתר (Contents: Read and write)');
  }
  async function loadPublished() {
    const r = await gh(`/repos/${OWNER}/${encodeURIComponent(REPO)}/contents/${enc(FILE)}?ref=${encodeURIComponent(BRANCH)}`);
    if (r.status === 404) { sha = null; return { v: 1 }; }
    if (!r.ok) throw new Error('טעינת התוכן נכשלה (' + r.status + ')');
    const j = await r.json(); sha = j.sha; const txt = unb64(j.content); const a = txt.indexOf('{', txt.indexOf('PODTC_CONTENT')), b = txt.lastIndexOf('}');
    try { return JSON.parse(txt.slice(a, b + 1)); } catch (e) { return { v: 1 }; }
  }
  async function putFile(path, contentB64, message, knownSha) {
    const body = { message, content: contentB64, branch: BRANCH }; if (knownSha) body.sha = knownSha;
    const r = await gh(`/repos/${OWNER}/${encodeURIComponent(REPO)}/contents/${enc(path)}`, { method: 'PUT', body: JSON.stringify(body) });
    if (r.status === 409 || r.status === 422) throw new Error('מישהו אחר עדכן את האתר בינתיים. רעננו את העמוד ונסו שוב');
    if (!r.ok) throw new Error('השמירה נכשלה (' + r.status + ')');
    return r.json();
  }
  async function publish() {
    C.v = 1; C.updated = new Date().toISOString(); C.by = user;
    const txt = `/* podtc — content published from the management screen (admin.html). Do not edit by hand: use the screen. */\nwindow.PODTC_CONTENT = ${JSON.stringify(C, null, 1)};\n`;
    const res = await putFile(FILE, b64(txt), `podtc: content update from the management screen (${user})`, sha);
    sha = res.content && res.content.sha; dirty = false; saveDraft(); paintBar();
  }
  async function upload(file, folder) {
    const safe = file.name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-').replace(/^-+/, ''); const name = `${Date.now().toString(36)}-${safe || 'file'}`;
    const buf = new Uint8Array(await file.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    await putFile(`${DIR}uploads/${folder}/${name}`, btoa(s), `podtc: upload ${name}`);
    return `uploads/${folder}/${name}`;
  }

  /* ---------------- draft ---------------- */
  const saveDraft = () => { try { localStorage.setItem('podtc.draft', JSON.stringify(C)); } catch (e) {} };
  const touch = () => { dirty = true; saveDraft(); paintBar(); };
  function ensure() {
    C.episodes = C.episodes || {}; ['added', 'hidden', 'order'].forEach(k => { C.episodes[k] = C.episodes[k] || []; }); C.episodes.edits = C.episodes.edits || {};
    C.layout = C.layout || {}; C.layout.order = C.layout.order && C.layout.order.length ? C.layout.order : SECTIONS.map(s => s[0]); SECTIONS.forEach(s => { if (!C.layout.order.includes(s[0])) C.layout.order.push(s[0]); });
    C.layout.hidden = C.layout.hidden || []; C.texts = C.texts || {}; C.settings = C.settings || {}; C.blocks = C.blocks || []; C.live = C.live || {}; C.daily = C.daily || []; C.links = C.links || []; C.ticker = C.ticker || [];
    if (!Array.isArray(C.notices)) C.notices = clone(CFG.notices || []); if (!Array.isArray(C.articles)) C.articles = clone(ARTICLES0); if (!Array.isArray(C.gallery)) C.gallery = clone(CFG.gallery || []);
  }
  const toast = (m, bad) => { const t = $('#toast'); t.textContent = m; t.className = 'toast show' + (bad ? ' bad' : ''); clearTimeout(toast.t); toast.t = setTimeout(() => { t.className = 'toast'; }, 4200); };

  /* ---------------- generic list editor ---------------- */
  function field(f, val, path) {
    const id = 'f' + Math.random().toString(36).slice(2), v = val == null ? '' : val, common = `id="${id}" data-path="${esc(path)}" data-k="${f.k}"`;
    let ctl;
    if (f.type === 'area') ctl = `<textarea ${common} rows="${f.rows || 4}" placeholder="${esc(f.ph || '')}">${esc(v)}</textarea>`;
    else if (f.type === 'select') ctl = `<select ${common}>${f.options().map(([k, l]) => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    else ctl = `<input ${common} type="${f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}" ${f.type === 'number' ? 'step="any"' : ''} value="${esc(v)}" placeholder="${esc(f.ph || '')}" ${f.ltr ? 'dir="ltr"' : ''}>`;
    const up = f.upload ? `<label class="up"><input type="file" accept="${f.upload === 'audio' ? 'audio/*' : 'image/*'}" data-up="${f.upload}" data-for="${id}" hidden>העלאת קובץ</label>${f.upload === 'audio' ? `<button type="button" class="up up--rec" data-rec="${id}">● הקלטה</button>` : ''}` : '';
    return `<label class="fld${f.wide ? ' wide' : ''}"><span>${esc(f.label)}${f.help ? `<em>${esc(f.help)}</em>` : ''}</span><div class="fld__c">${ctl}${up}</div></label>`;
  }
  function listEditor(host, items, schema, opt) {
    const title = it => esc((opt.title && opt.title(it)) || 'פריט חדש');
    const paint = open => {
      host.innerHTML = `<div class="list">${items.map((it, i) => `<details class="item" ${open === i ? 'open' : ''} data-i="${i}"><summary><span class="item__n">${i + 1}</span><b>${title(it)}</b>${opt.badge ? opt.badge(it) : ''}
          <span class="item__act"><button data-mv="-1" title="הזזה למעלה" aria-label="הזזה למעלה">▲</button><button data-mv="1" title="הזזה למטה" aria-label="הזזה למטה">▼</button><button data-del title="מחיקה" aria-label="מחיקה" class="danger">✕</button></span></summary>
          <div class="item__b">${schema.map(f => field(f, it[f.k], String(i))).join('')}</div></details>`).join('') || '<p class="empty">אין פריטים עדיין.</p>'}</div>
        <button class="btn btn--add" data-add>+ ${esc(opt.add || 'הוספה')}</button>`;
    };
    paint(-1);
    host.onclick = e => {
      const b = e.target.closest('button'); if (!b) return; const it = e.target.closest('.item'), i = it ? +it.dataset.i : -1;
      if (b.dataset.add != null) { const n = opt.make ? opt.make() : {}; if (opt.top) { items.unshift(n); touch(); paint(0); } else { items.push(n); touch(); paint(items.length - 1); } }
      else if (b.dataset.del != null) { e.preventDefault(); if (confirm('למחוק את הפריט?')) { items.splice(i, 1); touch(); paint(-1); } }
      else if (b.dataset.mv) { e.preventDefault(); const j = i + +b.dataset.mv; if (j < 0 || j >= items.length) return; [items[i], items[j]] = [items[j], items[i]]; touch(); paint(-1); }
    };
    host.oninput = e => { const el = e.target; if (!el.dataset.k) return; const i = +el.dataset.path; items[i][el.dataset.k] = el.value; touch(); const s = el.closest('.item').querySelector('summary b'); if (s) s.innerHTML = title(items[i]); };
  }
  // file uploads (pictures, recordings)
  document.addEventListener('change', async e => {
    const inp = e.target; if (!inp.dataset || !inp.dataset.up || !inp.files[0]) return;
    const f = inp.files[0]; if (f.size > 25 * 1024 * 1024) { toast('הקובץ גדול מדי (עד 25MB)', true); return; }
    const lab = inp.closest('.up'); lab.classList.add('busy'); lab.lastChild.textContent = 'מעלה…';
    try { const url = await upload(f, inp.dataset.up === 'audio' ? 'audio' : 'images'); const target = document.getElementById(inp.dataset.for); target.value = url; target.dispatchEvent(new Event('input', { bubbles: true })); toast('הקובץ הועלה. הוא יהיה זמין באתר בעוד כדקה'); }
    catch (err) { toast(err.message, true); }
    lab.classList.remove('busy'); lab.lastChild.textContent = 'העלאת קובץ'; inp.value = '';
  });

  // record straight from the microphone (cleaned up and saved as MP3), listen, then keep or discard
  let rec = null;
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-rec]'); if (!b) return; e.preventDefault();
    if (rec && rec.btn === b) { clearInterval(rec.tick); b.textContent = 'מעבד…'; let r; try { r = await rec.c.stop(); } catch (x) { toast(x.message, true); b.textContent = '● הקלטה'; b.classList.remove('on'); rec = null; return; }
      b.classList.remove('on'); b.textContent = '● הקלטה'; rec = null; preview(b.closest('.fld'), r, path => { const t = document.getElementById(b.dataset.rec); t.value = path; t.dispatchEvent(new Event('input', { bubbles: true })); }); return; }
    if (rec) { toast('כבר מתבצעת הקלטה', true); return; }
    try { const c = await PodRec.start(); rec = { c, btn: b, tick: setInterval(() => { b.textContent = '■ עצירה ' + mmss(c.seconds); }, 500) }; b.classList.add('on'); }
    catch (x) { toast(x.message, true); }
  });
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  // a finished take: listen, keep (upload) or discard
  function preview(host, r, onSaved) {
    const old = host.querySelector('.recbox'); if (old) old.remove();
    host.insertAdjacentHTML('beforeend', `<div class="recbox"><audio controls src="${r.url}"></audio><span class="recbox__m">${mmss(r.seconds)} · ${r.blob.size > 1048576 ? (r.blob.size / 1048576).toFixed(1) + "MB" : Math.round(r.blob.size / 1024) + "KB"}</span><button type="button" class="btn btn--pri btn--sm" data-keep>שמירת ההקלטה</button><button type="button" class="btn btn--sm" data-drop>מחיקה</button></div>`);
    const box = host.querySelector('.recbox');
    box.querySelector('[data-drop]').onclick = () => { URL.revokeObjectURL(r.url); box.remove(); };
    box.querySelector('[data-keep]').onclick = async ev => { const k = ev.target; k.disabled = true; k.textContent = 'מעלה…';
      try { const path = await upload(new File([r.blob], 'recording.mp3', { type: 'audio/mpeg' }), 'audio'); onSaved(path); box.remove(); toast('ההקלטה נשמרה. לחצו "פרסום" כדי שתופיע באתר'); }
      catch (x) { toast(x.message, true); k.disabled = false; k.textContent = 'שמירת ההקלטה'; } };
    return box;
  }

  /* ---------------- recording studio: every episode, two narrators ---------------- */
  const VOICES = { f: { k: 'audioF', t: 'קריינית', d: 'קול נשי' }, m: { k: 'audioM', t: 'קריין', d: 'קול גברי' } };
  let sv = 'f', sid = null, take = null, live = null, prompter = 0;
  function setEp(id, k, v) { const E = C.episodes, add = E.added.find(a => a.id === id);
    if (add) { if (v) add[k] = v; else delete add[k]; } else { const ed = E.edits[id] = E.edits[id] || {}; if (v) ed[k] = v; else delete ed[k]; if (!Object.keys(ed).length) delete E.edits[id]; } touch(); }
  const recOf = (p, v) => p[VOICES[v].k] || '';
  function studio() {
    const list = episodes().filter(p => !C.episodes.hidden.includes(p.id)), done = v => list.filter(p => recOf(p, v)).length;
    if (!sid || !list.some(p => p.id === sid)) sid = (list.find(p => !recOf(p, sv)) || list[0] || {}).id;
    const ep = list.find(p => p.id === sid) || {}, has = recOf(ep, sv), V = VOICES[sv], pct = Math.round(done(sv) / Math.max(1, list.length) * 100);
    $('#main').innerHTML = `<h1>אולפן הקלטות</h1><p class="lead">מקליטים כאן את כל הפרקים בקול אנושי, בשני קולות: קריינית וקריין. המאזינים בוחרים באתר באיזה קול לשמוע. פרק שעוד לא הוקלט מושמע בקול האוטומטי.</p>
      <div class="st-top"><div class="st-voices" role="group" aria-label="מי מקליט">${Object.keys(VOICES).map(k => `<button class="st-v${k === sv ? ' on' : ''}" data-sv="${k}"><b>${VOICES[k].t}</b><small>${done(k)} מתוך ${list.length} פרקים</small></button>`).join('')}</div>
        <div class="st-prog"><span>${V.t}: הוקלטו ${done(sv)} מתוך ${list.length}</span><i><b style="width:${pct}%"></b></i></div></div>
      <div class="st">
        <nav class="st-list" aria-label="פרקים">${list.map((p, i) => `<button class="st-ep${p.id === sid ? ' on' : ''}${recOf(p, sv) ? ' ok' : ''}" data-sid="${esc(p.id)}"><span class="st-ep__n">${recOf(p, sv) ? '✓' : i + 1}</span><b>${esc(p.title)}</b></button>`).join('')}</nav>
        <section class="st-main">
          <div class="st-head"><div><span class="st-k">${esc((CATS[ep.category] || {}).label || '')} · כ־${Math.max(1, Math.round(String(ep.script || '').split(/\s+/).length / 120))} דק׳ הקראה</span><h2>${esc(ep.title || '')}</h2></div>
            ${has ? `<span class="tag tag--ok">יש הקלטה (${V.t})</span>` : `<span class="tag">עדיין לא הוקלט</span>`}</div>
          <div class="st-tp" id="st-tp" tabindex="0" aria-label="הטקסט להקראה">${String(ep.script || '').split(/\n+/).map(par => `<p>${esc(par)}</p>`).join('')}</div>
          <div class="st-ctl">
            <button class="st-rec" id="st-rec" aria-label="התחלת הקלטה"><i></i><span>הקלטה</span></button>
            <div class="st-meter" aria-hidden="true"><i id="st-lvl"></i></div><span class="st-time" id="st-time">0:00</span>
            <label class="st-scroll"><input type="checkbox" id="st-auto" checked> גלילה אוטומטית של הטקסט</label>
          </div>
          <p class="st-clip" id="st-clip" hidden>הקול חזק מדי, התרחקו קצת מהמיקרופון</p>
          <div id="st-take"></div>
          ${has ? `<div class="st-cur"><span>ההקלטה השמורה:</span><audio controls preload="none" src="${esc(has)}"></audio><button class="btn btn--sm" id="st-del">מחיקת ההקלטה</button></div>` : ''}
          <label class="st-file">או העלאת קובץ מוכן (mp3, m4a, wav)<input type="file" accept="audio/*" id="st-file"></label>
          <details class="st-tips"><summary>טיפים להקלטה טובה</summary><ol>
            <li>חדר קטן ושקט, עם וילונות או ארון בגדים, נשמע טוב יותר מחדר גדול וריק.</li><li>אוזניות עם מיקרופון או מיקרופון USB עדיפים על מיקרופון המחשב. החזיקו אותו בכף יד מהפה, קצת מהצד.</li>
            <li>קראו פעם אחת בשקט לפני ההקלטה. דברו לאט מעט ממה שנראה לכם טבעי, וחייכו: שומעים את זה.</li><li>טעיתם? עצרו שנייה וחזרו על המשפט. או פשוט הקליטו מחדש.</li>
            <li>השקט בהתחלה ובסוף נחתך אוטומטית, והעוצמה מאוזנת לבד.</li></ol></details>
        </section>
      </div>`;
    if (take) showTake();
  }
  function showTake() {
    const host = $('#st-take'); if (!host || !take) return;
    host.innerHTML = `<div class="recbox recbox--big"><audio controls src="${take.url}"></audio><span class="recbox__m">${mmss(take.seconds)} · ${take.blob.size > 1048576 ? (take.blob.size / 1048576).toFixed(1) + "MB" : Math.round(take.blob.size / 1024) + "KB"}${take.trimmed > .5 ? ` · נחתכו ${take.trimmed.toFixed(1)} שניות של שקט` : ''}</span>
      <button class="btn btn--pri" id="st-save">שמירה ומעבר לפרק הבא</button><button class="btn" id="st-redo">הקלטה מחדש</button></div>`;
  }
  async function saveTake() {
    const b = $('#st-save'); b.disabled = true; b.textContent = 'מעלה…';
    try { const path = await upload(new File([take.blob], `${sid}-${sv}.mp3`, { type: 'audio/mpeg' }), 'audio'); setEp(sid, VOICES[sv].k, path); URL.revokeObjectURL(take.url); take = null;
      const list = episodes().filter(p => !C.episodes.hidden.includes(p.id)), i = list.findIndex(p => p.id === sid), nx = list.slice(i + 1).concat(list.slice(0, i)).find(p => !recOf(p, sv));
      toast(nx ? 'נשמר! עוברים לפרק הבא. בסוף לחצו "פרסום"' : 'נשמר! כל הפרקים הוקלטו. לחצו "פרסום"'); if (nx) sid = nx.id; studio(); }
    catch (x) { toast(x.message, true); b.disabled = false; b.textContent = 'שמירה ומעבר לפרק הבא'; }
  }
  document.addEventListener('click', async e => {
    if (tab !== 'studio') return; const t = e.target;
    const v = t.closest('[data-sv]'); if (v && !live) { sv = v.dataset.sv; take = null; studio(); return; }
    const ep = t.closest('[data-sid]'); if (ep && !live) { if (take && !confirm('יש הקלטה שלא נשמרה. לעבור בכל זאת?')) return; take = null; sid = ep.dataset.sid; studio(); $('#main').scrollTop = 0; return; }
    if (t.closest('#st-rec')) {
      const btn = $('#st-rec');
      if (live) { clearInterval(live.tick); cancelAnimationFrame(prompter); btn.classList.remove('on'); btn.querySelector('span').textContent = 'מעבד…'; btn.disabled = true;
        try { take = await live.c.stop(); } catch (x) { toast(x.message, true); } live = null; btn.disabled = false; btn.querySelector('span').textContent = 'הקלטה'; document.body.classList.remove('recording'); showTake(); return; }
      if (take && !confirm('להקליט מחדש? ההקלטה הקודמת שלא נשמרה תימחק.')) return; take = null; $('#st-take').innerHTML = '';
      try { const c = await PodRec.start({ onLevel: (l, clip) => { const m = $('#st-lvl'); if (m) m.style.transform = `scaleX(${l})`; if (clip) { const w = $('#st-clip'); if (w) { w.hidden = false; clearTimeout(w.t); w.t = setTimeout(() => { w.hidden = true; }, 1800); } } } });
        live = { c, tick: setInterval(() => { const tm = $('#st-time'); if (tm) tm.textContent = mmss(c.seconds); }, 250) };
        btn.classList.add('on'); btn.querySelector('span').textContent = 'עצירה'; btn.setAttribute('aria-label', 'עצירת ההקלטה'); document.body.classList.add('recording');
        // teleprompter: scroll at reading pace (about 2 words a second)
        const tp = $('#st-tp'); tp.scrollTop = 0; const words = tp.textContent.split(/\s+/).length, total = Math.max(20, words / 2.0), t0 = performance.now();
        const roll = now => { if (!live) return; if ($('#st-auto').checked) { const max = tp.scrollHeight - tp.clientHeight; tp.scrollTop = Math.min(max, max * Math.max(0, (now - t0) / 1000 - 3) / total); } prompter = requestAnimationFrame(roll); }; prompter = requestAnimationFrame(roll);
      } catch (x) { toast(x.message, true); }
      return;
    }
    if (t.closest('#st-save')) return saveTake();
    if (t.closest('#st-redo')) { URL.revokeObjectURL(take.url); take = null; $('#st-take').innerHTML = ''; return; }
    if (t.closest('#st-del')) { if (confirm('למחוק את ההקלטה של הפרק הזה? הפרק יחזור להקראה האוטומטית.')) { setEp(sid, VOICES[sv].k, ''); studio(); } return; }
  });
  document.addEventListener('change', async e => {
    if (e.target.id !== 'st-file' || !e.target.files[0]) return; const f = e.target.files[0];
    if (f.size > 60 * 1024 * 1024) { toast('הקובץ גדול מדי', true); return; }
    toast('מעבד את הקובץ…'); try { take = await PodRec.fromFile(f); showTake(); } catch (x) { toast('לא הצלחנו לקרוא את הקובץ. נסו mp3 או m4a', true); } e.target.value = '';
  });
  document.addEventListener('keydown', e => { if (tab !== 'studio' || e.target.matches('input,textarea,select')) return; if (e.code === 'Space') { e.preventDefault(); const r = $('#st-rec'); if (r) r.click(); } });

  /* ---------------- screens ---------------- */
  const episodes = () => { const E = C.episodes; const all = PLACES0.map(p => Object.assign({}, p, E.edits[p.id] || {}, { _base: true })).concat(E.added.map(a => Object.assign({ _added: true }, a)));
    if (E.order.length) all.sort((a, b) => { const i = E.order.indexOf(a.id), j = E.order.indexOf(b.id); return (i < 0 ? 1e6 : i) - (j < 0 ? 1e6 : j); }); return all; };
  const EP_F = [
    { k: 'title', label: 'כותרת' }, { k: 'subtitle', label: 'כותרת משנה' },
    { k: 'category', label: 'נושא', type: 'select', options: catOpts },
    { k: 'audioF', label: 'הקלטה: קריינית', help: 'או הקליטו באולפן ההקלטות', ltr: true, upload: 'audio', ph: 'קישור לקובץ או העלאה' },
    { k: 'audioM', label: 'הקלטה: קריין', ltr: true, upload: 'audio', ph: 'קישור לקובץ או העלאה' },
    { k: 'youtube', label: 'קישור יוטיוב', help: 'אם קיים, השיתוף בוואטסאפ ישלח אותו והפרק יתנגן בתוך וואטסאפ', ltr: true, wide: true, ph: 'https://youtu.be/…' },
    { k: 'script', label: 'הטקסט של הפרק', type: 'area', rows: 9, wide: true, help: 'זה הטקסט שמוקרא ומוצג כתמליל' },
    { k: 'lat', label: 'קו רוחב', type: 'number', ltr: true }, { k: 'lng', label: 'קו אורך', type: 'number', ltr: true }];
  const SCREENS = {
    dash() {
      const E = C.episodes, n = episodes().length - E.hidden.length;
      return `<h1>שלום, ${esc(user)}</h1><p class="lead">כאן מנהלים את התוכן של podtc. כל שינוי נשמר כטיוטה במחשב הזה. לחצו "תצוגה מקדימה" כדי לראות אותו באתר, ו"פרסום" כדי שכולם יראו.</p>
        <div class="cards">${[['studio', episodes().filter(p => p.audioF || p.audioM).length, 'פרקים מוקלטים'], ['daily', C.daily.length, 'עדכונים יומיים'], ['eps', n, 'פרקים'], ['notices', C.notices.length, 'מודעות'], ['articles', C.articles.length, 'כתבות'], ['gallery', C.gallery.length, 'תמונות בגלריה'], ['blocks', C.blocks.length, 'בלוקים חופשיים'], ['layout', C.layout.hidden.length, 'מדורים מוסתרים']]
          .map(([t, v, l]) => `<button class="card" data-tab="${t}"><b>${v}</b><span>${l}</span></button>`).join('')}</div>
        <div class="tips"><h3>איך זה עובד</h3><ol><li><b>עורכים</b> באחת הלשוניות שבצד.</li><li><b>תצוגה מקדימה</b> פותחת את האתר עם השינויים, רק אצלכם.</li><li><b>פרסום</b> שולח את השינויים לאתר. העדכון מופיע לכולם בתוך דקה או שתיים.</li></ol>
          <p>${C.updated ? `פורסם לאחרונה: ${new Date(C.updated).toLocaleString('he-IL')}${C.by ? ' · ' + esc(C.by) : ''}` : 'עדיין לא פורסם תוכן מהמערכת.'}</p></div>`;
    },
    live() {
      const L = C.live, f = (k, l, ph, help, o) => field(Object.assign({ k, label: l, ph, help }, o || {}), L[k], 'live');
      return `<h1>שידור חי</h1><p class="lead">כשהשידור פעיל, מופיע בראש האתר נגן "שידור חי" אדום, וכפתור LIVE בכותרת מוביל אליו. משדרים מהטלפון דרך יוטיוב או פייסבוק (חינם), או דרך שירות רדיו אינטרנטי, ומדביקים כאן את הקישור.</p>
        <div class="form" id="live"><label class="sw sw--big wide"><input type="checkbox" data-k="on" ${L.on ? 'checked' : ''}><i></i><span>${L.on ? 'השידור פעיל באתר' : 'השידור כבוי'}</span></label>
          ${f('type', 'סוג השידור', '', '', { type: 'select', options: () => [['youtube', 'יוטיוב (וידאו או אודיו)'], ['facebook', 'פייסבוק לייב'], ['audio', 'רדיו אינטרנטי (קישור סטרים)']] })}
          ${f('url', 'קישור לשידור', 'https://youtube.com/live/…', 'ביוטיוב אפשר להשאיר ריק: יוצג השידור החי של ערוץ העירייה', { ltr: true })}
          ${f('title', 'כותרת', 'ישיבת מועצת העיר בשידור חי', '', { wide: true })}${f('text', 'תיאור קצר', '', '', { type: 'area', rows: 3, wide: true })}</div>
        <div class="tips"><h3>איך משדרים</h3><ol><li><b>יוטיוב:</b> באפליקציית יוטיוב בטלפון לוחצים על + ← "שידור חי". מעתיקים את הקישור ומדביקים כאן.</li><li><b>פייסבוק:</b> בעמוד העירייה לוחצים "שידור חי", ומדביקים כאן את הקישור לסרטון.</li><li><b>רדיו (קול בלבד):</b> פותחים תחנה חינמית בשירות כמו Zeno.fm, משדרים מהאפליקציה שלהם, ומדביקים כאן את קישור הסטרים.</li><li>מפעילים את המתג ולוחצים "פרסום". בסוף השידור מכבים ומפרסמים שוב.</li></ol></div>`;
    },
    push() {
      const P = C.push || {};
      return `<h1>התראות</h1><p class="lead">הודעה קצרה שקופצת לכל מי שהאתר פתוח אצלו, ולמי שאישר התראות היא מופיעה גם כהתראה במכשיר. מי שייכנס לאתר אחר כך יראה אותה בראש העמוד.</p>
        <div class="form" id="pushf">${field({ k: 'title', label: 'כותרת', ph: 'עדכון חשוב מעיריית טירת כרמל', wide: true }, '', 'p')}${field({ k: 'text', label: 'תוכן ההודעה', type: 'area', rows: 3, wide: true }, '', 'p')}${field({ k: 'url', label: 'קישור (לא חובה)', ltr: true, wide: true, ph: 'https://…' }, '', 'p')}
          <button class="btn btn--pri" id="push-send" type="button">הכנת ההתראה לשליחה</button><button class="btn" id="push-clear" type="button">הסרת ההתראה הנוכחית</button></div>
        <div class="tips"><h3>ההתראה הנוכחית</h3><p>${P.id ? `<b>${esc(P.title || '')}</b><br>${esc(P.text || '')}<br><small>${new Date(P.date).toLocaleString('he-IL')}</small>` : 'אין התראה פעילה.'}</p>
          <h3>חשוב לדעת</h3><p>ההתראה נשלחת כשלוחצים "פרסום". היא מגיעה למכשירים שבהם האתר פתוח או מותקן ופועל ברקע. התראות למכשירים שהאתר סגור בהם לגמרי דורשות שירות דחיפה חיצוני (למשל OneSignal, שיש לו מסלול חינמי).</p></div>`;
    },
    studio() { return ''; },
    daily() { return `<h1>העדכון היומי</h1><p class="lead">עדכון קולי קצר שמופיע בראש האתר. מקליטים כאן בקול שלכם או מעלים הקלטה מוכנה, מוסיפים כותרת וטקסט, ולוחצים "פרסום". העדכון העליון ברשימה הוא זה שמוצג; הקודמים נשמרים בארכיון.</p><div id="host"></div>
        <div class="tips"><h3>טיפים להקלטה</h3><ol><li>הקליטו בחדר שקט, כשהטלפון או המיקרופון קרובים לפה.</li><li>דקה עד שתיים זה האורך הנכון.</li><li>האזינו להקלטה לפני השמירה. אפשר למחוק ולהקליט שוב.</li></ol><p>אם אין הקלטה, העדכון יוקרא בקול האוטומטי לפי הטקסט שכתבתם.</p></div>`; },
    eps() { return `<h1>פרקים</h1><p class="lead">עריכת הטקסטים, הוספת פרקים חדשים, שינוי הסדר והעלאת הקלטות. פרק עם הקלטה מושמע בקול אמיתי במקום בהקראה האוטומטית.</p><div id="host"></div>`; },
    notices() { return `<h1>לוח המודעות</h1><p class="lead">המודעות מופיעות בלוח המודעות ובין המדורים בעמוד הראשי. הראשונה ברשימה מוצגת ראשונה.</p><div id="host"></div>`; },
    articles() { return `<h1>כתבות</h1><p class="lead">כתבות נבחרות במדור "החדשות האחרונות". כותרות חיות מהרשת מתווספות אליהן אוטומטית.</p><div id="host"></div>`; },
    gallery() { return `<h1>גלריה</h1><p class="lead">תמונות במדור "גלריית העיר". אפשר להעלות קובץ או להדביק קישור לתמונה.</p><div id="host"></div>`; },
    links() { return `<h1>קישורים</h1><p class="lead">קישורים שתוסיפו כאן יופיעו ראשונים במדור "קישורים שימושיים", לפני הקישורים הקבועים.</p><div id="host"></div>`; },
    blocks() { return `<h1>בלוקים חופשיים</h1><p class="lead">בלוק הוא כותרת, טקסט, תמונה וכפתור, שאפשר למקם אחרי כל מדור בעמוד הראשי. כך מוסיפים תוכן חדש בכל מקום באתר.</p><div id="host"></div>`; },
    ticker() { return `<h1>פס "מה חדש?"</h1><p class="lead">שורות שירוצו בפס העליון. אם הרשימה ריקה, הפס מציג הודעות אוטומטיות.</p><div id="host"></div>`; },
    layout() {
      return `<h1>מבנה העמוד הראשי</h1><p class="lead">גררו או השתמשו בחצים כדי לשנות את סדר המדורים, וכבו מדור כדי להסתיר אותו. שני הכרטיסים הראשיים שבראש העמוד נשארים תמיד למעלה.</p>
        <div class="list" id="lay">${C.layout.order.map(id => { const s = SECTIONS.find(x => x[0] === id); if (!s) return ''; const hid = C.layout.hidden.includes(id);
          return `<div class="row${hid ? ' off' : ''}" draggable="true" data-id="${id}"><span class="grip" aria-hidden="true">⋮⋮</span><b>${esc(s[1])}</b><span class="item__act"><button data-mv="-1" aria-label="הזזה למעלה">▲</button><button data-mv="1" aria-label="הזזה למטה">▼</button>
            <label class="sw"><input type="checkbox" ${hid ? '' : 'checked'} data-vis><i></i><span>${hid ? 'מוסתר' : 'מוצג'}</span></label></span></div>`; }).join('')}</div>`;
    },
    texts() {
      const T = C.texts, f = (k, l, ph, area) => field({ k, label: l, ph, type: area ? 'area' : 'text', rows: 3, wide: !!area }, T[k], 'texts');
      return `<h1>טקסטים</h1><p class="lead">הכותרות והמשפטים הקבועים באתר. שדה ריק משאיר את הטקסט המקורי.</p><div class="form" id="texts">
        <h3>הכרטיס הראשי</h3>${f('heroKicker', 'שורה עליונה', 'ברוכים הבאים ל־PODTC')}${f('heroTitle1', 'כותרת, שורה ראשונה', 'העיר מדברת.')}${f('heroTitle2', 'כותרת, שורה שנייה (בתכלת)', 'אנחנו מקשיבים.')}${f('heroText', 'טקסט', 'כל מה שקורה בעיר…', true)}
        <h3>כרטיס הרדיו</h3>${f('radioTitle', 'כותרת', 'רדיו PODTC')}${f('radioSub', 'שורת משנה', 'סיפורים, אנשים, מקומות וכל מה שביניהם')}
        <h3>כותרות מדורים</h3>${f('slogan', 'סיסמה בפס העליון', 'הקול של העיר, בכל מקום')}${f('newsTitle', 'כותרת מדור החדשות', 'החדשות האחרונות')}${f('podcastsTitle', 'כותרת מדור הפודקאסטים', 'הפודקאסטים שלנו')}${f('podcastsText', 'טקסט מתחת לכותרת הפודקאסטים', '', true)}
        <h3>תחתית האתר</h3>${f('footer', 'שורת זכויות', '© כל הזכויות שמורות לעיריית טירת כרמל | …', true)}</div>`;
    },
    settings() {
      const S = C.settings, f = (k, l, ph, help) => field({ k, label: l, ph, help, ltr: true }, S[k], 'settings');
      return `<h1>הגדרות</h1><p class="lead">חשבונות הרשתות החברתיות ושידור הרדיו.</p><div class="form" id="settings">
        <h3>רשתות חברתיות</h3>${f('facebook', 'עמוד הפייסבוק', 'TCarmel.muni', 'שם העמוד כפי שמופיע בכתובת')}${f('tiktok', 'טיקטוק', 'tiratcarmel.muni', 'בלי @')}${f('youtubeChannel', 'מזהה ערוץ יוטיוב', 'UC…')}
        <h3>מדידת כניסות</h3>${f('goatcounter', 'קוד GoatCounter', 'tiratcarmel', 'נרשמים בחינם ב־goatcounter.com ומדביקים כאן את שם האתר שבחרתם. בלי עוגיות ובלי מידע אישי')}
        <h3>רדיו</h3>${f('radioStream', 'כתובת שידור חי', 'https://…/stream.mp3', 'אם ריק, רדיו PODTC מנגן את הפרקים ברצף')}</div>
        <div class="tips"><h3>חשבון</h3><p>מחוברים כ־<b>${esc(user)}</b>. מפתח הגישה נשמר רק בדפדפן הזה.</p><button class="btn" id="discard">ביטול כל השינויים שלא פורסמו</button></div>`;
    }
  };
  const LISTS = {
    daily: () => [C.daily, [{ k: 'title', label: 'כותרת', wide: true, ph: 'מה חדש היום בטירת כרמל' }, { k: 'date', label: 'תאריך', type: 'date' }, { k: 'by', label: 'מי מדבר', ph: 'שם הדובר או הדוברת' },
      { k: 'audio', label: 'ההקלטה', help: 'הקלטה מהמיקרופון או קובץ', ltr: true, upload: 'audio', wide: true, ph: 'לחצו "הקלטה" או "העלאת קובץ"' }, { k: 'text', label: 'טקסט העדכון', type: 'area', rows: 6, wide: true, help: 'מוצג כתמליל, ומוקרא אם אין הקלטה' }],
      { title: d => (d.date ? d.date.split('-').reverse().join('.') + ' · ' : '') + (d.title || 'עדכון חדש'), add: 'עדכון חדש', badge: d => d.audio ? '<span class="tag tag--ok">הקלטה</span>' : '<span class="tag">טקסט בלבד</span>',
        make: () => ({ date: new Date().toISOString().slice(0, 10), title: '', text: '' }), top: true }],
    notices: () => [C.notices, [{ k: 'title', label: 'כותרת', wide: true }, { k: 'text', label: 'פירוט', type: 'area', rows: 3, wide: true }, { k: 'tag', label: 'תחום', ph: 'חינוך, תרבות…' }, { k: 'date', label: 'תאריך', type: 'date' }, { k: 'src', label: 'מקור', ph: 'עיריית טירת כרמל' }, { k: 'url', label: 'קישור לפרטים', ltr: true }],
      { title: n => n.title, add: 'מודעה חדשה', make: () => ({ date: new Date().toISOString().slice(0, 10), tag: 'עירייה', src: 'עיריית טירת כרמל' }) }],
    articles: () => [C.articles, [{ k: 'title', label: 'כותרת', wide: true }, { k: 'src', label: 'מקור', ph: 'שם האתר או העיתון' }, { k: 'link', label: 'קישור לכתבה', ltr: true }, { k: 'ep', label: 'פרק קשור', type: 'select', options: () => [['', 'ללא']].concat(episodes().map(p => [p.id, p.title])) }], { title: a => a.title, add: 'כתבה חדשה' }],
    gallery: () => [C.gallery, [{ k: 'src', label: 'תמונה', ltr: true, upload: 'image', wide: true, ph: 'קישור לתמונה או העלאה' }, { k: 'caption', label: 'כיתוב', wide: true }], { title: g => g.caption || g.src, add: 'תמונה חדשה' }],
    links: () => [C.links, [{ k: 'title', label: 'שם הקישור' }, { k: 'text', label: 'תיאור קצר' }, { k: 'url', label: 'כתובת', ltr: true, wide: true }], { title: l => l.title, add: 'קישור חדש' }],
    blocks: () => [C.blocks, [{ k: 'title', label: 'כותרת', wide: true }, { k: 'kicker', label: 'כותרת קטנה מעל', ph: 'למשל: חדש' }, { k: 'after', label: 'מיקום: אחרי המדור', type: 'select', options: () => SECTIONS },
      { k: 'text', label: 'טקסט', type: 'area', rows: 5, wide: true }, { k: 'image', label: 'תמונה', ltr: true, upload: 'image', wide: true }, { k: 'button', label: 'טקסט הכפתור', ph: 'לפרטים' }, { k: 'url', label: 'קישור הכפתור', ltr: true },
      { k: 'style', label: 'עיצוב', type: 'select', options: () => [['light', 'בהיר'], ['navy', 'כחול כהה'], ['cyan', 'תכלת'], ['sun', 'צהוב'], ['coral', 'אלמוג']] }], { title: b => b.title, add: 'בלוק חדש', make: () => ({ after: 'articles-block', style: 'light' }) }]
  };
  function show(t) {
    tab = t; document.querySelectorAll('.side button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    const main = $('#main'); main.innerHTML = SCREENS[t](); main.scrollTop = 0; const host = $('#host');
    if (LISTS[t]) { const [items, schema, opt] = LISTS[t](); listEditor(host, items, schema, opt); }
    if (t === 'ticker') { const rows = C.ticker.map(x => ({ t: x })); listEditor(host, rows, [{ k: 't', label: 'טקסט', wide: true }], { title: r => r.t, add: 'שורה חדשה' });
      const sync = () => { C.ticker = rows.map(r => r.t).filter(Boolean); saveDraft(); }; host.addEventListener('input', sync); host.addEventListener('click', () => setTimeout(sync, 0)); }
    if (t === 'eps') paintEpisodes(host);
    if (t === 'studio') studio();
    if (t === 'layout') wireLayout();
    if (t === 'live') { const fm = $('#live'); fm.oninput = fm.onchange = e => { const el = e.target; if (!el.dataset.k) return; if (el.type === 'checkbox') { C.live.on = el.checked; el.parentElement.querySelector('span').textContent = el.checked ? 'השידור פעיל באתר' : 'השידור כבוי'; } else C.live[el.dataset.k] = el.value; if (!C.live.type) C.live.type = 'youtube'; touch(); }; }
    if (t === 'push') { $('#push-send').onclick = () => { const g = k => $(`#pushf [data-k="${k}"]`).value.trim(); if (!g('title') && !g('text')) { toast('כתבו כותרת או תוכן', true); return; }
        C.push = { id: Date.now().toString(36), title: g('title'), text: g('text'), url: g('url'), date: new Date().toISOString() }; touch(); show('push'); toast('ההתראה מוכנה. לחצו "פרסום" כדי לשלוח אותה'); };
      $('#push-clear').onclick = () => { delete C.push; touch(); show('push'); }; }
    if (t === 'texts' || t === 'settings') $('#' + t).oninput = e => { const el = e.target; if (!el.dataset.k) return; if (el.value) C[t][el.dataset.k] = el.value; else delete C[t][el.dataset.k]; touch(); };
    const dc = $('#discard'); if (dc) dc.onclick = async () => { if (!confirm('לבטל את כל השינויים שלא פורסמו?')) return; C = await loadPublished(); ensure(); dirty = false; saveDraft(); paintBar(); show('dash'); toast('השינויים בוטלו'); };
  }
  function paintEpisodes(host, open) {
    const E = C.episodes, list = episodes();
    host.innerHTML = `<div class="list">${list.map((p, i) => { const hid = E.hidden.includes(p.id), ed = p._base && E.edits[p.id] && Object.keys(E.edits[p.id]).length;
      return `<details class="item${hid ? ' off' : ''}" data-id="${esc(p.id)}" ${open === p.id ? 'open' : ''}><summary><span class="item__n">${i + 1}</span><b>${esc(p.title || 'פרק חדש')}</b>
        <span class="tag">${esc((CATS[p.category] || {}).label || '')}</span>${p.audioF || p.audio ? '<span class="tag tag--ok">קריינית</span>' : ''}${p.audioM ? '<span class="tag tag--ok">קריין</span>' : ''}${p._added ? '<span class="tag tag--new">חדש</span>' : ed ? '<span class="tag tag--ed">נערך</span>' : ''}${hid ? '<span class="tag tag--off">מוסתר</span>' : ''}
        <span class="item__act"><button data-mv="-1" aria-label="הזזה למעלה">▲</button><button data-mv="1" aria-label="הזזה למטה">▼</button>${p._added ? '<button data-del class="danger" aria-label="מחיקה">✕</button>' : `<button data-hide>${hid ? 'הצגה' : 'הסתרה'}</button>`}</span></summary>
        <div class="item__b">${EP_F.map(f => field(f, p[f.k], p.id)).join('')}${p._base && ed ? '<button class="btn btn--sm" data-reset>שחזור הטקסט המקורי</button>' : ''}</div></details>`; }).join('')}</div><button class="btn btn--add" data-add>+ פרק חדש</button>`;
    host.onclick = e => {
      const b = e.target.closest('button'); if (!b) return; const it = e.target.closest('.item'), id = it && it.dataset.id;
      if (b.dataset.add != null) { const nid = 'ep-' + Date.now().toString(36); E.added.push({ id: nid, title: '', subtitle: '', category: 'city', script: '', lat: 32.761, lng: 34.9705 }); touch(); paintEpisodes(host, nid); return; }
      e.preventDefault();
      if (b.dataset.del != null) { if (confirm('למחוק את הפרק?')) { E.added = E.added.filter(a => a.id !== id); E.order = E.order.filter(x => x !== id); touch(); paintEpisodes(host); } }
      else if (b.dataset.hide != null) { E.hidden = E.hidden.includes(id) ? E.hidden.filter(x => x !== id) : E.hidden.concat(id); touch(); paintEpisodes(host); }
      else if (b.dataset.reset != null) { delete E.edits[id]; touch(); paintEpisodes(host, id); }
      else if (b.dataset.mv) { const ids = list.map(p => p.id), i = ids.indexOf(id), j = i + +b.dataset.mv; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; E.order = ids; touch(); paintEpisodes(host); }
    };
    host.oninput = e => { const el = e.target, k = el.dataset.k; if (!k) return; const id = el.dataset.path, add = E.added.find(a => a.id === id);
      if (add) add[k] = el.value; else { const base = PLACES0.find(p => p.id === id), ed = E.edits[id] = E.edits[id] || {}; if (String(base[k] == null ? '' : base[k]) === el.value) delete ed[k]; else ed[k] = el.value; if (!Object.keys(ed).length) delete E.edits[id]; }
      touch(); if (k === 'title') el.closest('.item').querySelector('summary b').textContent = el.value || 'פרק חדש'; };
  }
  function wireLayout() {
    const box = $('#lay'); let drag = null;
    const commit = () => { C.layout.order = [...box.children].map(r => r.dataset.id); touch(); };
    box.onclick = e => { const b = e.target.closest('button'); if (!b || !b.dataset.mv) return; const row = b.closest('.row'), sib = +b.dataset.mv < 0 ? row.previousElementSibling : row.nextElementSibling; if (!sib) return; if (+b.dataset.mv < 0) box.insertBefore(row, sib); else box.insertBefore(sib, row); commit(); };
    box.onchange = e => { if (e.target.dataset.vis == null) return; const row = e.target.closest('.row'), id = row.dataset.id, on = e.target.checked; C.layout.hidden = C.layout.hidden.filter(x => x !== id).concat(on ? [] : [id]); row.classList.toggle('off', !on); row.querySelector('.sw span').textContent = on ? 'מוצג' : 'מוסתר'; touch(); };
    box.addEventListener('dragstart', e => { drag = e.target.closest('.row'); if (drag) { drag.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; } });
    box.addEventListener('dragover', e => { e.preventDefault(); const over = e.target.closest('.row'); if (!drag || !over || over === drag) return; const r = over.getBoundingClientRect(); box.insertBefore(drag, e.clientY < r.top + r.height / 2 ? over : over.nextSibling); });
    box.addEventListener('dragend', () => { if (drag) { drag.classList.remove('drag'); drag = null; commit(); } });
  }
  function paintBar() { const s = $('#state'); if (s) { s.textContent = dirty ? 'יש שינויים שלא פורסמו' : 'הכול מפורסם'; s.className = 'state' + (dirty ? ' dirty' : ''); } const p = $('#publish'); if (p) p.disabled = !dirty; }

  /* ---------------- boot ---------------- */
  async function enter() {
    $('#login').hidden = true; $('#app').hidden = false; $('#who').textContent = user;
    let pub; try { pub = await loadPublished(); } catch (e) { toast(e.message, true); pub = { v: 1 }; }
    let draft = null; try { draft = JSON.parse(localStorage.getItem('podtc.draft') || 'null'); } catch (e) {}
    if (draft && JSON.stringify(draft) !== JSON.stringify(pub) && (draft.updated || '') >= (pub.updated || '') && confirm('נמצאה טיוטה שלא פורסמה במחשב הזה. להמשיך ממנה?')) { C = draft; dirty = true; } else C = pub;
    ensure(); paintBar(); show('dash');
  }
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault(); const btn = $('#login-btn'), err = $('#login-err'); err.textContent = ''; btn.disabled = true; btn.textContent = 'מתחבר…';
    try { await signIn($('#lu').value, $('#lp').value); const store = $('#lr').checked ? localStorage : sessionStorage; store.setItem('podtc.adm', JSON.stringify({ u: user, t: token })); await enter(); }
    catch (ex) { err.textContent = ex.message === 'Failed to fetch' ? 'אין חיבור ל־GitHub. בדקו את האינטרנט ונסו שוב' : ex.message; }
    btn.disabled = false; btn.textContent = 'כניסה';
  });
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-tab]'); if (t) { show(t.dataset.tab); document.body.classList.remove('menu'); return; }
    const id = e.target.id;
    if (id === 'menu-btn') document.body.classList.toggle('menu');
    else if (id === 'preview') { saveDraft(); try { localStorage.setItem('podtc.preview', '1'); } catch (x) {} window.open('./', 'podtc-preview'); }
    else if (id === 'publish') { const b = e.target; if (!confirm('לפרסם את השינויים לאתר? הם יופיעו לכולם בתוך דקה או שתיים.')) return; b.disabled = true; b.textContent = 'מפרסם…';
      try { await publish(); toast('פורסם! האתר יתעדכן בתוך דקה או שתיים'); if (tab === 'dash') show('dash'); } catch (ex) { toast(ex.message, true); b.disabled = false; } b.textContent = 'פרסום'; }
    else if (id === 'logout') { sessionStorage.removeItem('podtc.adm'); localStorage.removeItem('podtc.adm'); localStorage.removeItem('podtc.preview'); location.reload(); }
  });
  window.addEventListener('beforeunload', e => { if (dirty) saveDraft(); });
  (async () => { let s = null; try { s = JSON.parse(sessionStorage.getItem('podtc.adm') || localStorage.getItem('podtc.adm') || 'null'); } catch (e) {}
    if (s && s.t) { try { await signIn(s.u, s.t); await enter(); return; } catch (e) {} } $('#login').hidden = false; })();
})();
