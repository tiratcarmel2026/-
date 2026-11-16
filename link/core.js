/* Tirat Carmel link shortener — shared settings and data access.
   The list of links lives in links.json at the repository root, on the branch below.
   Short links are read straight from GitHub at click time, so a new link works
   within seconds, without waiting for the site to redeploy. */
(function () {
  var CFG = {
    owner: 'tiratcarmel2026',
    repo: '-',
    branch: 'claude/nicky-cleanup-game-g4cvvu', // the branch that holds links.json
    file: 'links.json',
    shortBase: '' // set to e.g. 'https://tiratcarmel.co.il/' if you connect your own domain
  };

  // Where the site lives: https://tiratcarmel2026.github.io/-/ on GitHub Pages, or "/" on a custom domain.
  function siteRoot() {
    if (CFG.shortBase) return CFG.shortBase;
    if (/\.github\.io$/.test(location.hostname)) return location.origin + '/' + CFG.repo + '/';
    return location.origin + '/';
  }

  // Top-level names already used by the site; a short code cannot take them.
  var RESERVED = ['podtc', 'link', 'js', 'css', 'assets', 'index.html', '404.html', 'links.json', 'readme.md', 'favicon.ico'];

  function api(path) {
    return 'https://api.github.com/repos/' + CFG.owner + '/' + encodeURIComponent(CFG.repo) + path;
  }

  function b64ToUtf8(b64) {
    var bin = atob(b64.replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function utf8ToB64(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  // Public read: GitHub API first (fresh), raw file next, then the copy deployed with the site.
  async function loadLinks() {
    var sources = [
      function () {
        return fetch(api('/contents/' + CFG.file + '?ref=' + encodeURIComponent(CFG.branch)),
          { headers: { Accept: 'application/vnd.github.raw+json' }, cache: 'no-store' });
      },
      function () {
        return fetch('https://raw.githubusercontent.com/' + CFG.owner + '/' + CFG.repo + '/' + CFG.branch + '/' + CFG.file + '?t=' + Date.now(), { cache: 'no-store' });
      },
      function () { return fetch(siteRoot() + CFG.file + '?t=' + Date.now(), { cache: 'no-store' }); }
    ];
    for (var i = 0; i < sources.length; i++) {
      try {
        var r = await sources[i]();
        if (r.ok) return await r.json();
      } catch (e) { /* try the next source */ }
    }
    return null;
  }

  // Authenticated read, returning the file's sha so it can be updated.
  async function readWithSha(token) {
    var r = await fetch(api('/contents/' + CFG.file + '?ref=' + encodeURIComponent(CFG.branch) + '&t=' + Date.now()), {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' }, cache: 'no-store'
    });
    if (r.status === 404) return { links: {}, sha: null };
    if (r.status === 401) throw new Error('הטוקן לא תקין או שפג תוקפו. עדכנו אותו בהגדרות.');
    if (!r.ok) throw new Error('שגיאה בקריאה מ-GitHub (' + r.status + ')');
    var j = await r.json();
    return { links: JSON.parse(b64ToUtf8(j.content) || '{}'), sha: j.sha };
  }

  // Change the list with mutate(links) and save it; retries once if someone saved in between.
  async function updateLinks(token, mutate, message) {
    for (var attempt = 0; attempt < 2; attempt++) {
      var cur = await readWithSha(token);
      var result = mutate(cur.links);
      var body = {
        message: message,
        content: utf8ToB64(JSON.stringify(cur.links, null, 2) + '\n'),
        branch: CFG.branch
      };
      if (cur.sha) body.sha = cur.sha;
      var r = await fetch(api('/contents/' + CFG.file), {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (r.ok) return { links: cur.links, result: result };
      if (r.status === 409 && attempt === 0) continue;
      if (r.status === 401) throw new Error('הטוקן לא תקין או שפג תוקפו. עדכנו אותו בהגדרות.');
      if (r.status === 403 || r.status === 404) throw new Error('לטוקן אין הרשאת כתיבה למאגר. ודאו שנתתם לו Contents: Read and write על המאגר ' + CFG.owner + '/' + CFG.repo + '.');
      throw new Error('השמירה ב-GitHub נכשלה (' + r.status + ')');
    }
  }

  function isSafeUrl(u) {
    try { var p = new URL(u); return p.protocol === 'http:' || p.protocol === 'https:'; } catch (e) { return false; }
  }

  window.TCLinks = {
    CFG: CFG, siteRoot: siteRoot, RESERVED: RESERVED,
    loadLinks: loadLinks, updateLinks: updateLinks, isSafeUrl: isSafeUrl
  };
})();
