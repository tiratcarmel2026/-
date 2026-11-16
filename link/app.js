(function () {
  var L = window.TCLinks, $ = function (id) { return document.getElementById(id); };
  var links = {};
  var lastShort = '';
  var pollTimer = null;

  function toast(text) {
    var t = $('toast'); t.textContent = text; t.classList.add('on');
    clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('on'); }, 1800);
  }
  function shortUrl(code) { return L.siteRoot() + code; }
  function urlOf(v) { return typeof v === 'string' ? v : v && v.url; }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove();
    }
    toast('הועתק ✓');
  }

  function randomCode() {
    var abc = 'abcdefghjkmnpqrstuvwxyz23456789', s = '';
    var buf = new Uint32Array(5); crypto.getRandomValues(buf);
    for (var i = 0; i < buf.length; i++) s += abc[buf[i] % abc.length];
    return s;
  }

  function render() {
    var q = $('search').value.trim().toLowerCase();
    var codes = Object.keys(links).sort(function (a, b) {
      return String((links[b] && links[b].created) || '').localeCompare(String((links[a] && links[a].created) || ''));
    }).filter(function (c) { return !q || c.indexOf(q) >= 0 || String(urlOf(links[c])).toLowerCase().indexOf(q) >= 0; });

    var ul = $('list'); ul.innerHTML = '';
    if (!codes.length) {
      var li = document.createElement('li'); li.className = 'empty';
      li.textContent = Object.keys(links).length ? 'לא נמצאו תוצאות' : 'עוד אין קישורים. צרו את הראשון למעלה.';
      ul.appendChild(li); return;
    }
    codes.forEach(function (code) {
      var li = document.createElement('li');
      var body = document.createElement('div'); body.className = 'item__body';
      var a = document.createElement('a'); a.className = 'item__short'; a.href = shortUrl(code); a.target = '_blank'; a.rel = 'noopener';
      a.textContent = shortUrl(code).replace(/^https?:\/\//, '');
      var lg = document.createElement('div'); lg.className = 'item__long'; lg.textContent = urlOf(links[code]); lg.title = urlOf(links[code]);
      body.appendChild(a); body.appendChild(lg);
      var btns = document.createElement('div'); btns.className = 'item__btns';
      var c = document.createElement('button'); c.className = 'mini'; c.textContent = '📋'; c.title = 'העתקה'; c.setAttribute('aria-label', 'העתקה');
      c.onclick = function () { copy(shortUrl(code)); };
      var d = document.createElement('button'); d.className = 'mini'; d.textContent = '🗑️'; d.title = 'מחיקה'; d.setAttribute('aria-label', 'מחיקה');
      d.onclick = function () { remove(code); };
      btns.appendChild(c); btns.appendChild(d);
      li.appendChild(body); li.appendChild(btns); ul.appendChild(li);
    });
  }

  async function refresh() {
    var data = await L.loadLinks();
    if (data) links = data;
    render();
    return links;
  }

  // Check every few seconds until done(links) is true, for up to 3 minutes.
  function waitFor(done, onDone, onTimeout) {
    clearInterval(pollTimer);
    var tries = 0;
    pollTimer = setInterval(async function () {
      tries++;
      var l = await refresh();
      if (done(l)) { clearInterval(pollTimer); onDone(); }
      else if (tries >= 36) { clearInterval(pollTimer); onTimeout && onTimeout(); }
    }, 5000);
  }

  function setStatus(html, done) {
    $('status').innerHTML = html;
    $('result').classList.toggle('done', !!done);
  }

  function remove(code) {
    if (!confirm('למחוק את הקישור ' + code + '?')) return;
    window.open(L.issueUrl('delete: ' + code, 'מחיקת הקישור הקצר ' + shortUrl(code)), '_blank', 'noopener');
    toast('אשרו את המחיקה בלשונית של GitHub');
    waitFor(function (l) { return !l[code]; }, function () { toast('נמחק ✓'); });
  }

  function showResult(code, pending, issueHref) {
    lastShort = shortUrl(code);
    $('shortUrl').textContent = lastShort.replace(/^https?:\/\//, '');
    $('shortUrl').href = lastShort;
    $('qr').hidden = true; $('qr').innerHTML = '';
    if (pending) {
      setStatus('⏳ נפתחה לשונית של GitHub. לחצו שם על הכפתור הירוק <b>Create</b> (או <b>Submit new issue</b>) וחזרו לכאן.' +
        '<small>לא נפתחה לשונית? <a href="' + issueHref + '" target="_blank" rel="noopener">לחצו כאן</a>. הקישור יהיה פעיל תוך כחצי דקה מהאישור.</small>');
    } else {
      setStatus('✅ הקישור הקצר מוכן ופעיל', true);
    }
    $('result').hidden = false;
    $('result').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  $('form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var msg = $('msg'); msg.textContent = '';
    var long = $('long').value.trim();
    if (long && !/^https?:\/\//i.test(long)) long = 'https://' + long;
    if (!L.isSafeUrl(long)) { msg.textContent = 'זה לא נראה כמו קישור תקין.'; return; }
    var slug = $('slug').value.trim().toLowerCase();
    if (slug && !/^[a-z0-9_-]{1,40}$/.test(slug)) { msg.textContent = 'בסיומת מותר רק אותיות באנגלית, ספרות, מקף וקו תחתון.'; return; }
    if (slug && L.RESERVED.indexOf(slug) >= 0) { msg.textContent = 'הסיומת הזו תפוסה על ידי האתר. בחרו אחרת.'; return; }

    // Already shortened?
    if (slug && links[slug]) {
      if (urlOf(links[slug]) === long) { showResult(slug, false); return; }
      msg.textContent = 'הסיומת "' + slug + '" כבר בשימוש לקישור אחר. בחרו אחרת.'; return;
    }
    if (!slug) {
      for (var k in links) if (urlOf(links[k]) === long) { showResult(k, false); toast('הקישור הזה כבר קוצר בעבר'); return; }
    }

    var code = slug;
    if (!code) { do { code = randomCode(); } while (links[code] || L.RESERVED.indexOf(code) >= 0); }
    var href = L.issueUrl('link: ' + code, long);
    window.open(href, '_blank', 'noopener');
    showResult(code, true, href);
    $('long').value = ''; $('slug').value = '';
    waitFor(function (l) { return l[code] && urlOf(l[code]) === long; },
      function () { setStatus('✅ הקישור הקצר מוכן ופעיל', true); toast('הקישור פעיל ✓'); },
      function () { setStatus('⌛ עוד לא קיבלנו אישור מ-GitHub. ודאו שלחצתם על Create בלשונית של GitHub, ורעננו את הדף בעוד דקה.'); });
  });

  $('copy').onclick = function () { copy(lastShort); };
  $('share').onclick = function () {
    if (navigator.share) navigator.share({ url: lastShort }).catch(function () {});
    else copy(lastShort);
  };
  $('qrBtn').onclick = function () {
    var box = $('qr');
    if (!box.hidden) { box.hidden = true; return; }
    var qr = qrcode(0, 'M'); qr.addData(lastShort); qr.make();
    box.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    box.hidden = false;
  };
  $('search').addEventListener('input', render);

  $('basePreview').textContent = L.siteRoot().replace(/^https?:\/\//, '');
  refresh();
})();
