/* podtc — cover art, the way podcast apps do it: every episode gets a square artwork.
 * The artwork is a real aerial photo of the place (Esri World Imagery tile at the place's
 * coordinates), tinted to the app's blue in CSS. If the photo can't load (offline / blocked),
 * a generated blue "contour" pattern unique to the episode is shown instead. */
(function () {
  const lon2x = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
  const lat2y = (lat, z) => { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z); };
  const tile = (lat, lng, z = 17) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${lat2y(lat, z)}/${lon2x(lng, z)}`;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* generated artwork: topographic rings + a soft sun, seeded by the episode id */
  function pattern(seed) {
    let h = hash(seed); const rnd = () => (h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296;
    const cx = 20 + rnd() * 60, cy = 20 + rnd() * 60, rings = [];
    for (let i = 1; i <= 9; i++) {
      const r = i * (7 + rnd() * 2.5), wob = 1 + rnd() * .25;
      rings.push(`<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(r * wob).toFixed(1)}" ry="${(r / wob).toFixed(1)}" transform="rotate(${Math.round(rnd() * 180)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`);
    }
    return `<svg class="cover__pat" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>
      <rect width="100" height="100" fill="var(--c,#1E3A8A)"/><rect width="100" height="100" fill="url(#cg)"/><circle cx="${(100 - cx).toFixed(1)}" cy="${(100 - cy).toFixed(1)}" r="26" fill="#fff" opacity=".12"/>
      <g class="cover__rings" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width=".6">${rings.join('')}</g></svg>`;
  }
  /* Illustrated artwork (no photos): the topic colour, a soft light, slowly drifting
   contour rings and the topic's line icon. label shows the title on the art. */
  function html(ep, opts = {}) {
    const { label = false, cls = '' } = opts;
    const cat = ep && window.PODTC_CATEGORIES && PODTC_CATEGORIES[ep.category];
    const ic = window.PodIcons ? (ep && ep.id === 'briefing' ? PodIcons.svg('mic', 44, 1.4) : PodIcons.cat(ep && ep.category ? ep : 'city', 44)) : '';
    const sd = ep ? hash(ep.id) % 360 : 0;
    return `<span class="cover cover--art ${cls}" style="--c:${cat ? cat.color : '#1E3A8A'};--r:${sd}deg" role="img" aria-label="${esc(ep ? ep.title : '')}">${pattern(ep ? ep.id : 'x')}<span class="cover__mark">${ic}</span>
      ${label ? `<span class="cover__label"><small>podtc</small><b>${esc(ep.title)}</b></span>` : ''}</span>`;
  }
  window.PodCovers = { html, tile, pattern };
})();
