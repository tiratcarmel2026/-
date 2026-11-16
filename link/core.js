/* Tirat Carmel link shortener — shared settings and data access.
   The list of links lives in links.json at the repository root, on the branch below.
   New links are added by the "Short links" GitHub workflow from a pre-filled issue.
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

  // A pre-filled GitHub issue; the "Short links" workflow does the rest.
  function issueUrl(title, body) {
    return 'https://github.com/' + CFG.owner + '/' + CFG.repo + '/issues/new?title=' +
      encodeURIComponent(title) + '&body=' + encodeURIComponent(body || '');
  }

  function isSafeUrl(u) {
    try { var p = new URL(u); return p.protocol === 'http:' || p.protocol === 'https:'; } catch (e) { return false; }
  }

  window.TCLinks = {
    CFG: CFG, siteRoot: siteRoot, RESERVED: RESERVED,
    loadLinks: loadLinks, issueUrl: issueUrl, isSafeUrl: isSafeUrl
  };
})();
