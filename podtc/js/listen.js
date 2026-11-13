/* podtc — the light listening page that share links open (e/<episode>.html).
 * One episode, one big play button, nothing else to load: it opens fast inside WhatsApp's browser. */
(function () {
  const P = window.PODTC_PLACES || [], CATS = window.PODTC_CATEGORIES || {}, N = window.Narrator;
  const id = (document.documentElement.dataset.ep || location.pathname.split('/').pop().replace(/\.html$/, '')), ep = P.find(p => p.id === id);
  const $ = s => document.querySelector(s), esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SITE = new URL('../', location.href).href, here = location.href.split('#')[0];
  if (!ep) { location.replace(SITE); return; }
  if (ep.audio && !/^(https?:|\/)/.test(ep.audio)) ep.audio = '../' + ep.audio;
  if (ep.youtube) { /* an episode with a YouTube link is shared as that link; this page still plays it */ }
  const cat = CATS[ep.category] || { label: 'podtc' }, parts = N.split(ep.script);
  const mins = Math.max(1, Math.round(ep.script.split(/\s+/).length / 120));
  const more = P.filter(p => p.id !== ep.id && p.category === ep.category).concat(P.filter(p => p.category !== ep.category)).filter(p => (window.PODTC_SHARE_PAGES || []).includes(p.id)).slice(0, 4);
  const PLAY = '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path class="i-play" d="M8 5v14l11-7z"/><path class="i-pause" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
  $('#app').innerHTML = `
    <header class="lh"><a href="${SITE}" aria-label="podtc, לאתר המלא"><img src="../assets/wordmark-navy.png" alt="podtc"></a><a class="lh__site" href="${SITE}#${esc(ep.id)}">לאתר המלא ←</a></header>
    <main class="lc">
      <div class="lart">${window.PodArt ? PodArt.svg(ep.category, ep.id) : ''}<span class="leq" aria-hidden="true">${'<i></i>'.repeat(18)}</span></div>
      <span class="lk">${esc(cat.label)} · כ־${mins} דק׳</span>
      <h1>${esc(ep.title)}</h1><p class="lsub">${esc(ep.subtitle || '')}</p>
      <button class="lplay" id="lplay" aria-label="השמעה">${PLAY}</button>
      <div class="lbar" id="lbar" role="slider" aria-label="מיקום בפרק" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><i id="lprog"></i></div>
      <p class="lcap" id="lcap" aria-live="off">לחצו על הכפתור כדי להאזין</p>
      <div class="lshare"><span>שתפו</span>
        <a class="ls ls--wa" id="s-wa" target="_blank" rel="noopener">וואטסאפ</a><a class="ls ls--fb" id="s-fb" target="_blank" rel="noopener">פייסבוק</a><a class="ls ls--tg" id="s-tg" target="_blank" rel="noopener">טלגרם</a><button class="ls ls--copy" id="s-copy">העתקה</button></div>
      <details class="ltr"><summary>התמליל המלא</summary><div id="ltext">${parts.map((t, i) => `<span data-i="${i}">${esc(t)} </span>`).join('')}</div></details>
      <section class="lmap" aria-label="מיקום המקום"><h2 class="lmore__h">איפה זה</h2>
        <iframe title="מפה: ${esc(ep.title)}" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${(ep.lng - .004).toFixed(5)},${(ep.lat - .0028).toFixed(5)},${(ep.lng + .004).toFixed(5)},${(ep.lat + .0028).toFixed(5)}&layer=mapnik&marker=${ep.lat},${ep.lng}"></iframe>
        <div class="lmap__a"><a href="https://www.google.com/maps/dir/?api=1&destination=${ep.lat},${ep.lng}&travelmode=walking" target="_blank" rel="noopener">ניווט ברגל</a><a href="https://waze.com/ul?ll=${ep.lat},${ep.lng}&navigate=yes" target="_blank" rel="noopener">וייז</a><a href="${SITE}#${esc(ep.id)}">על המפה באתר</a></div>
        <small>המיקום משוער</small></section>
      ${more.length ? `<h2 class="lmore__h">פרקים נוספים</h2><div class="lmore">${more.map(p => `<a href="${esc(p.id)}.html"><span class="lmore__a">${window.PodArt ? PodArt.svg(p.category, p.id) : ''}</span><b>${esc(p.title)}</b><small>${esc((CATS[p.category] || {}).label || '')}</small></a>`).join('')}</div>` : ''}
      <a class="lcta" href="${SITE}">כל הפודקאסטים, החדשות והרדיו של טירת כרמל</a>
    </main>
    <footer class="lf">© כל הזכויות שמורות לעיריית טירת כרמל | האתר נבנה על ידי מחלקת דוברות והסברה | עיריית טירת כרמל</footer>`;
  const text = `"${ep.title}": ${ep.subtitle || ''}. האזינו ב־podtc`, u = encodeURIComponent(ep.youtube || here), t = encodeURIComponent(text);
  $('#s-wa').href = `https://wa.me/?text=${t}%20${u}`; $('#s-fb').href = `https://www.facebook.com/sharer/sharer.php?u=${u}`; $('#s-tg').href = `https://t.me/share/url?url=${u}&text=${t}`;
  $('#s-copy').onclick = () => (navigator.clipboard ? navigator.clipboard.writeText(ep.youtube || here) : Promise.reject()).then(() => { $('#s-copy').textContent = 'הועתק'; }, () => prompt('העתיקו את הקישור:', here));

  const spans = [...document.querySelectorAll('#ltext span')], active = () => ['playing', 'paused', 'skipping'].includes(N.state);
  const toggle = () => { const s = N.state; if (s === 'playing' || s === 'skipping') N.pause(); else if (s === 'paused') N.resume(); else { N.unlock(); N.play(ep); } };
  $('#lplay').addEventListener('click', toggle);
  N.on('state', s => { const on = s === 'playing' || s === 'skipping'; document.body.classList.toggle('playing', on); $('#lplay').setAttribute('aria-label', on ? 'השהיה' : 'השמעה');
    if (s === 'ended') { $('#lprog').style.width = '100%'; $('#lcap').textContent = 'תודה שהאזנתם. יש עוד פרקים למטה'; }
    if (s === 'unsupported') $('#lcap').textContent = 'הדפדפן הזה לא תומך בהקראה. אפשר לקרוא את התמליל למטה';
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = on ? 'playing' : 'paused'; });
  N.on('progress', f => { $('#lprog').style.width = Math.round(f * 100) + '%'; $('#lbar').setAttribute('aria-valuenow', Math.round(f * 100)); });
  N.on('chunk', i => { spans.forEach((el, j) => { el.classList.toggle('cur', j === i); el.classList.toggle('done', j < i); }); if (spans[i]) $('#lcap').textContent = spans[i].textContent.trim(); });
  N.on('silent', () => { $('#lcap').textContent = 'ההקראה לא התחילה במכשיר הזה. פתחו את התמליל כדי לקרוא'; document.querySelector('.ltr').open = true; });
  const seek = f => { const i = Math.min(spans.length - 1, Math.max(0, Math.floor(f * spans.length))); if (active()) N.seek(i); else { N.unlock(); N.play(ep); setTimeout(() => N.seek(i), 120); } };
  $('#lbar').addEventListener('click', e => { const r = $('#lbar').getBoundingClientRect(); seek((r.right - e.clientX) / r.width); });
  $('#ltext').addEventListener('click', e => { const sp = e.target.closest('span[data-i]'); if (sp) seek((+sp.dataset.i + .01) / spans.length); });
  document.addEventListener('keydown', e => { if (e.key === ' ' && e.target === document.body) { e.preventDefault(); toggle(); } });
  // lock-screen and headset controls; a recorded episode keeps playing when the listener leaves the page
  if ('mediaSession' in navigator) try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: ep.title, artist: 'podtc · עיריית טירת כרמל', album: cat.label, artwork: [{ src: `../assets/og/${ep.id}.png`, sizes: '1200x630', type: 'image/png' }, { src: '../assets/icon-512.png', sizes: '512x512', type: 'image/png' }] });
    navigator.mediaSession.setActionHandler('play', () => { if (N.state === 'paused') N.resume(); else if (!active()) N.play(ep); }); navigator.mediaSession.setActionHandler('pause', () => N.pause());
  } catch (e) {}
})();
