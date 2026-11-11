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
    return `<svg class="cover__pat" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="100" fill="var(--c,#1E3A8A)"/><circle cx="${(100 - cx).toFixed(1)}" cy="${(100 - cy).toFixed(1)}" r="26" fill="#fff" opacity=".12"/>
      <g fill="none" stroke="#fff" stroke-opacity=".3" stroke-width=".6">${rings.join('')}</g></svg>`;
  }
  /* size: 'xs' (list), 'sm' (tile), 'lg' (hero / player). label shows the title on the art. */
  function html(ep, opts = {}) {
    const { label = false, cls = '' } = opts;
    const img = ep && typeof ep.lat === 'number' && ep.id !== 'briefing'
      ? `<img class="cover__img" src="${tile(ep.lat, ep.lng)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : '';
    const mark = ep && ep.id === 'briefing' ? `<span class="cover__mark">${window.PodIcons ? PodIcons.svg('mic', 44, 1.4) : ''}</span>` : '';
    const cat = ep && window.PODTC_CATEGORIES && PODTC_CATEGORIES[ep.category];
    return `<span class="cover ${cls}" style="--c:${cat ? cat.color : '#1E3A8A'}">${pattern(ep ? ep.id : 'x')}${img}<span class="cover__tint"></span>${mark}
      ${label ? `<span class="cover__label"><small>podtc</small><b>${esc(ep.title)}</b></span>` : ''}</span>`;
  }
  window.PodCovers = { html, tile, pattern };
})();
