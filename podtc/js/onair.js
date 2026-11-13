/* podtc — live broadcast, announcements and share links.
 * Live: when the management screen switches a broadcast on, a red "on air" player opens the page
 * (YouTube or Facebook video, or an audio stream). Announcements: a banner for everyone who opens the site,
 * and a device notification for people who allowed notifications. Share links point to a light listening
 * page with a rich preview (or to YouTube, when an episode has a YouTube link, so it plays inside WhatsApp). */
(function () {
  const A = window.PodApp, N = window.Narrator, CFG = window.PODTC_CONFIG || {}, $ = s => document.querySelector(s); if (!A) return;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const BASE = location.origin + location.pathname.replace(/[^/]*$/, '');
  const PAGES = window.PODTC_SHARE_PAGES || [];

  /* ---------- share links ---------- */
  window.PodShareUrl = ep => !ep || ep.live || /^(briefing|daily-)/.test(ep.id) ? BASE : ep.youtube ? ep.youtube : PAGES.includes(ep.id) ? `${BASE}e/${ep.id}.html` : `${BASE}#${ep.id}`;

  /* ---------- audio stream (live radio) ---------- */
  let au = null;
  function stream(url, title) {
    if (!au) { au = new Audio(); au.preload = 'none'; au.addEventListener('playing', () => paint(true)); au.addEventListener('pause', () => paint(false)); au.addEventListener('error', () => { paint(false); A.toast('השידור לא זמין כרגע. נסו שוב בעוד רגע'); }); }
    if (!au.paused) { au.pause(); return; }
    try { if (N && A.isActive && A.isActive()) N.pause(); } catch (e) {}
    if (au.src !== url) au.src = url; au.play().catch(() => {});
    if ('mediaSession' in navigator) try { navigator.mediaSession.metadata = new MediaMetadata({ title: title || 'שידור חי', artist: 'podtc · עיריית טירת כרמל', artwork: [{ src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png' }] }); } catch (e) {}
  }
  function paint(on) { document.body.classList.toggle('stream-on', on); const s = $('#rrad-st'); if (s && (on || s.dataset.live)) { s.textContent = on ? 'שידור חי עכשיו' : 'מוכן לשידור'; s.dataset.live = on ? 1 : ''; } }
  if (N && N.on) N.on('state', s => { if (s === 'playing' && au && !au.paused) au.pause(); });
  // a permanent radio stream set in the management screen takes over the PODTC radio buttons
  const RS = CFG.radio && CFG.radio.stream;
  if (RS) document.addEventListener('click', e => { if (e.target.closest('#rrad-play, #rlive, [data-rgo="@radio"]')) { e.stopImmediatePropagation(); e.preventDefault(); stream(RS, CFG.radio.name); } }, true);

  /* ---------- live broadcast ---------- */
  const L = window.PODTC_LIVE;
  if (L && L.on) {
    const yt = u => { const m = /(?:youtu\.be\/|[?&]v=|\/live\/|\/embed\/|\/shorts\/)([\w-]{11})/.exec(u || ''); return m && m[1]; };
    const ch = CFG.social && CFG.social.youtubeChannel;
    let media = '';
    if (L.type === 'audio' && L.url) media = `<button class="onair__play" id="onair-play" aria-label="האזנה לשידור החי"><svg viewBox="0 0 24 24" width="30" height="30" style="width:30px;height:30px;fill:currentColor;stroke:none" aria-hidden="true"><path class="i-play" d="M8 5v14l11-7z"/></svg></button><span class="onair__eq" aria-hidden="true">${'<i></i>'.repeat(28)}</span>`;
    else if (L.type === 'facebook' && L.url) media = `<div class="onair__frame"><iframe title="שידור חי" src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(L.url)}&show_text=false&autoplay=false" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>`;
    else { const id = yt(L.url), src = id ? `https://www.youtube.com/embed/${id}?rel=0&playsinline=1` : ch ? `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(ch)}&playsinline=1` : '';
      media = src ? `<div class="onair__frame"><iframe title="שידור חי" src="${src}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>` : ''; }
    const link = L.url && /^https?:/.test(L.url) && L.type !== 'audio' ? `<a class="onair__open" href="${esc(L.url)}" target="_blank" rel="noopener">פתיחה באפליקציה ←</a>` : '';
    const ref = $('.rhero');
    if (ref && media) ref.insertAdjacentHTML('beforebegin', `<section class="onair onair--${esc(L.type || 'youtube')}" id="onair" aria-label="שידור חי">
        <div class="onair__b"><span class="onair__k"><i></i>שידור חי עכשיו</span><h2>${esc(L.title || 'אנחנו בשידור חי')}</h2>${L.text ? `<p>${esc(L.text)}</p>` : ''}${link}
          <div class="onair__share" data-surl="${esc(L.url && L.type !== 'audio' ? L.url : BASE)}" data-stext="${esc('שידור חי מטירת כרמל: ' + (L.title || ''))}"><span>שתפו את השידור</span>
            ${[['wa', 'וואטסאפ', 'chat'], ['fb', 'פייסבוק', 'facebook'], ['tg', 'טלגרם', 'send'], ['copy', 'העתקת קישור', 'link']].map(([k, l, i]) => `<button class="pshare pshare--${k}" data-ps="${k}" aria-label="שיתוף: ${l}">${window.PodIcons ? PodIcons.svg(i, 18) : ''}</button>`).join('')}</div></div>
        <div class="onair__m">${media}</div></section>`);
    const pb = $('#onair-play'); if (pb) pb.addEventListener('click', () => stream(L.url, L.title));
    // the LIVE button in the masthead leads to the broadcast
    const rl = $('#rlive'); if (rl && $('#onair')) { rl.classList.add('rlive--on'); const sp = rl.querySelector('span'); if (sp) sp.textContent = 'שידור חי עכשיו';
      rl.addEventListener('click', e => { e.stopImmediatePropagation(); $('#home').scrollTo({ top: 0, behavior: 'smooth' }); if (pb) stream(L.url, L.title); }, true); }
    document.body.classList.add('has-onair');
  }

  /* ---------- announcements ---------- */
  const seen = () => { try { return localStorage.getItem('podtc.push.seen') || ''; } catch (e) { return ''; } };
  const mark = id => { try { localStorage.setItem('podtc.push.seen', id); } catch (e) {} };
  const canNotify = 'Notification' in window;
  async function notify(P) {
    if (!canNotify || Notification.permission !== 'granted') return;
    const opt = { body: P.text || '', icon: 'assets/icon-192.png', badge: 'assets/icon-192.png', tag: 'podtc-' + P.id, data: { url: P.url || BASE }, dir: 'rtl', lang: 'he' };
    try { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (reg && reg.showNotification) await reg.showNotification(P.title || 'podtc', opt); else new Notification(P.title || 'podtc', opt); } catch (e) {}
  }
  function banner(P, fresh) {
    const old = $('#annc'); if (old) old.remove();
    const url = P.url && /^(https?:|#|\.\/)/.test(P.url) ? P.url : '';
    document.body.insertAdjacentHTML('beforeend', `<div class="annc" id="annc" role="status"><span class="annc__ic" aria-hidden="true">${window.PodIcons ? PodIcons.svg('alert', 22) : ''}</span>
      <div class="annc__b"><b>${esc(P.title || 'עדכון מעיריית טירת כרמל')}</b>${P.text ? `<p>${esc(P.text)}</p>` : ''}
        <span class="annc__a">${url ? `<a href="${esc(url)}" ${/^https?:/.test(url) ? 'target="_blank" rel="noopener"' : ''}>לפרטים</a>` : ''}${canNotify && Notification.permission === 'default' ? '<button id="annc-allow">קבלו התראות למכשיר</button>' : ''}</span></div>
      <button class="annc__x" id="annc-x" aria-label="סגירה">✕</button></div>`);
    $('#annc-x').onclick = () => { mark(P.id); $('#annc').remove(); };
    const al = $('#annc-allow'); if (al) al.onclick = async () => { const r = await Notification.requestPermission(); al.remove(); A.toast(r === 'granted' ? 'מעולה, תקבלו התראות כשיהיה עדכון' : 'ההתראות לא אושרו'); };
    if (fresh) notify(P);
  }
  const P0 = window.PODTC_PUSH; let last = P0 && P0.id;
  if (P0 && P0.id && seen() !== P0.id && Date.now() - new Date(P0.date || 0) < 7 * 864e5) setTimeout(() => banner(P0, true), 4200);
  // while the site is open (or installed and running), look for a new announcement every few minutes
  async function poll() {
    try { const r = await fetch('js/content.js?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return; const t = await r.text(); const a = t.indexOf('{', t.indexOf('PODTC_CONTENT')), b = t.lastIndexOf('}'); const P = (JSON.parse(t.slice(a, b + 1)) || {}).push;
      if (P && P.id && P.id !== last) { last = P.id; if (seen() !== P.id) banner(P, true); } } catch (e) {}
  }
  if (!window.PODTC_PREVIEW) setInterval(poll, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !window.PODTC_PREVIEW) poll(); });
  // a permanent "get notifications" switch in the footer
  const fl = $('.foot__links'); if (fl && canNotify) { fl.insertAdjacentHTML('beforeend', `<button class="link" id="notif-on">${Notification.permission === 'granted' ? 'התראות פעילות' : 'קבלת התראות'}</button>`);
    $('#notif-on').onclick = async e => { if (Notification.permission === 'granted') { A.toast('ההתראות כבר פעילות במכשיר הזה'); return; } const r = await Notification.requestPermission(); e.target.textContent = r === 'granted' ? 'התראות פעילות' : 'קבלת התראות'; A.toast(r === 'granted' ? 'מעולה, תקבלו התראות כשיהיה עדכון' : 'ההתראות חסומות. אפשר לאשר אותן בהגדרות הדפדפן'); }; }
  if (window.PodIcons) PodIcons.hydrate();
})();
