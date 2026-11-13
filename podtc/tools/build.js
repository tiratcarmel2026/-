/* Builds the files the site actually loads:
 *   css/site.css      every stylesheet, in order, in one file (minified when csso is available)
 * Scripts stay as separate files on purpose: one big script blocks the page longer on phones.
 * The source files are listed in tools/sources.json (the order matters). Run from the podtc folder:
 *   node tools/build.js            (with csso / terser installed globally or via NODE_PATH, the bundles are minified)
 * After a build, bump the version in sw.js so returning visitors get the new files. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const src = JSON.parse(fs.readFileSync(path.join(__dirname, 'sources.json'), 'utf8'));
const tryReq = m => { try { return require(m); } catch (e) { return null; } };
const csso = tryReq('csso');
(async () => {
  // the bundle lives in css/, so relative links inside files from other folders are re-pointed
  let css = src.css.map(f => { let t = fs.readFileSync(path.join(root, f), 'utf8'); const dir = path.posix.dirname(f);
    if (dir !== 'css') t = t.replace(/url\((['"]?)(?!data:|https?:|\/|#)([^'")]+)\1\)/g, (m, q, u) => `url(${q}../${dir}/${u}${q})`);
    return `/* ${f} */\n` + t; }).join('\n');
  if (csso) css = csso.minify(css, { restructure: false }).css;   // no restructuring: rule order is what makes the layers work
  fs.writeFileSync(path.join(root, 'css/site.css'), `/* podtc — built by tools/build.js from ${src.css.length} files; edit the sources, not this file */\n` + css);
  const kb = f => (fs.statSync(path.join(root, f)).size / 1024).toFixed(0) + ' KB';
  console.log('css/site.css', kb('css/site.css'), csso ? '(minified)' : '(not minified)');
})();
