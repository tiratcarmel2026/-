/* PODTC live content — when you're somewhere without a curated episode,
 * pull nearby articles from Hebrew Wikipedia (CORS-enabled API, origin=*)
 * and turn the intro into a short narrated episode. Results are cached. */
(function () {
  const API = 'https://he.wikipedia.org/w/api.php';
  const CACHE_KEY = 'podtc.wikiCache.v1';
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch (e) {}
  const save = () => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) {} };

  async function nearby(lat, lng, radius = 1500) {
    const key = lat.toFixed(3) + ',' + lng.toFixed(3);
    if (cache[key] && Date.now() - cache[key].t < 7 * 864e5) return cache[key].items;
    const url = `${API}?action=query&format=json&origin=*&generator=geosearch&ggscoord=${lat}|${lng}` +
      `&ggsradius=${radius}&ggslimit=15&prop=extracts|coordinates&exintro=1&explaintext=1&exsentences=12`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('wiki ' + res.status);
    const data = await res.json();
    const pages = Object.values((data.query && data.query.pages) || {});
    const items = pages
      .filter(p => p.extract && p.extract.length > 120 && p.coordinates)
      .map(p => toEpisode(p, lat, lng))
      .sort((a, b) => a.dist - b.dist);
    cache[key] = { t: Date.now(), items }; save();
    return items;
  }

  function trim(text, max = 1100) {
    text = text.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim(); // drop parentheticals (dates/transliterations read badly)
    if (text.length <= max) return text;
    const cut = text.slice(0, max); const end = cut.lastIndexOf('.');
    return end > 300 ? cut.slice(0, end + 1) : cut + '…';
  }

  function toEpisode(p, lat, lng) {
    const c = p.coordinates[0];
    return {
      id: 'wiki-' + p.pageid, title: p.title, subtitle: 'מתוך ויקיפדיה העברית', emoji: '📖',
      lat: c.lat, lng: c.lon, radius: 120, live: true,
      dist: window.PodGeo.distance(lat, lng, c.lat, c.lon),
      intro: `אתם נמצאים ליד ${p.title}`,
      script: trim(p.extract) + ' המידע נלקח מוויקיפדיה העברית.',
      sources: ['https://he.wikipedia.org/wiki/' + encodeURIComponent(p.title.replace(/ /g, '_'))]
    };
  }

  window.PodWiki = { nearby };
})();
