(function () {
  var L = window.TCLinks, $ = function (id) { return document.getElementById(id); };
  var TOKEN_KEY = 'tc-links-token';
  var links = {};
  var lastShort = '';

  function getToken() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setToken(t) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) {} }

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
    links = data || {};
    render();
  }

  async function remove(code) {
    var token = getToken();
    if (!token) return $('settings').showModal();
    if (!confirm('למחוק את הקישור ' + code + '?')) return;
    try {
      var r = await L.updateLinks(token, function (all) { delete all[code]; }, 'Remove short link: ' + code);
      links = r.links; render(); toast('נמחק');
    } catch (e) { alert(e.message); }
  }

  function showResult(url) {
    lastShort = url;
    $('shortUrl').textContent = url.replace(/^https?:\/\//, '');
    $('shortUrl').href = url;
    $('qr').hidden = true; $('qr').innerHTML = '';
    $('result').hidden = false;
    $('result').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  $('form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var msg = $('msg'); msg.textContent = '';
    var long = $('long').value.trim();
    if (long && !/^https?:\/\//i.test(long)) long = 'https://' + long;
    if (!L.isSafeUrl(long)) { msg.textContent = 'זה לא נראה כמו קישור תקין.'; return; }
    var slug = $('slug').value.trim().toLowerCase();
    if (slug && !/^[a-z0-9_-]{1,40}$/.test(slug)) { msg.textContent = 'בסיומת מותר רק אותיות באנגלית, ספרות, מקף וקו תחתון.'; return; }
    if (slug && L.RESERVED.indexOf(slug) >= 0) { msg.textContent = 'הסיומת הזו תפוסה על ידי האתר. בחרו אחרת.'; return; }
    var token = getToken();
    if (!token) { $('settings').showModal(); return; }

    $('go').disabled = true; $('go').textContent = 'שומר…';
    try {
      var r = await L.updateLinks(token, function (all) {
        // Same long link already shortened (and no custom ending asked)? Reuse it.
        if (!slug) {
          for (var k in all) if (urlOf(all[k]) === long) return { code: k, existing: true };
        }
        var code = slug;
        if (code && all[code]) {
          if (urlOf(all[code]) === long) return { code: code, existing: true };
          throw new Error('הסיומת "' + code + '" כבר בשימוש לקישור אחר.');
        }
        if (!code) { do { code = randomCode(); } while (all[code] || L.RESERVED.indexOf(code) >= 0); }
        all[code] = { url: long, created: new Date().toISOString() };
        return { code: code };
      }, 'Add short link');
      links = r.links; render();
      showResult(shortUrl(r.result.code));
      if (r.result.existing) toast('הקישור הזה כבר קוצר בעבר');
      $('long').value = ''; $('slug').value = '';
    } catch (e) {
      msg.textContent = e.message;
    } finally {
      $('go').disabled = false; $('go').textContent = 'קצרו לי';
    }
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

  function openSettings() { $('token').value = getToken(); $('settings').showModal(); }
  $('openSettings').onclick = openSettings;
  $('openSettings2').onclick = openSettings;
  $('settings').addEventListener('close', function () {
    if ($('settings').returnValue === 'save') {
      setToken($('token').value.trim());
      $('setupNote').hidden = !!getToken();
      if (getToken()) toast('נשמר ✓');
    }
  });
  $('clearToken').onclick = function () {
    setToken(''); $('token').value = ''; $('settings').close(); $('setupNote').hidden = false; toast('נותק');
  };

  $('basePreview').textContent = L.siteRoot().replace(/^https?:\/\//, '');
  $('setupNote').hidden = !!getToken();
  refresh();
})();
