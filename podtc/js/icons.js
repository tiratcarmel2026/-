/* podtc — thin line icons (24×24, stroke). Replaces emoji everywhere in the UI.
 * PodIcons.svg(name, size)  → inline <svg> string
 * PodIcons.cat(episode|category, size) → the icon of a topic
 * Static markup: <i data-icon="name" data-size="20"></i> is filled in on load. */
(function () {
  const P = {
    // topics
    columns: 'M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-6 10 6z',
    arch: 'M4 21V11a8 8 0 0116 0v10M4 21h16M9 21v-6a3 3 0 016 0v6',
    candle: 'M12 3c1.6 2 1.6 3.6 0 5.2-1.6-1.6-1.6-3.2 0-5.2zM9 10h6v11H9zM6 21h12',
    leaf: 'M12 22V12M12 12c0-5 3-9 8-10-1 5-4 9-8 10zM12 15c-1-4-4-6-8-6 1 4 4 6 8 6z',
    mountain: 'M3 20l6-11 4 6 3-4 5 9zM9 9l1.5-2.5',
    people: 'M9 11a3 3 0 100-6 3 3 0 000 6zM17 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c3 .3 6 2.2 6 5.5',
    note: 'M9 18V5l11-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z',
    ball: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7l4 3-1.5 4.5h-5L8 10zM12 3v4M21 10.5l-5-.5M15 21l-.5-6.5M9 21l.5-6.5M3 10.5l5-.5',
    building: 'M4 21V5l8-3v19M12 9h8v12M3 21h18M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2',
    crane: 'M4 21h16M8 21V4h1l10 4M9 8h10M8 4L4 8h4M17 8v5M15 13h4v3h-4z',
    train: 'M6 3h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2zM4 11h16M8 21l2-4M16 21l-2-4M8 14h.01M16 14h.01',
    mic: 'M9 6a3 3 0 016 0v5a3 3 0 01-6 0zM5 11a7 7 0 0014 0M12 18v3',
    book: 'M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5zM4 19.5A2.5 2.5 0 006.5 22H20v-5',
    // weather & live
    sun: 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
    'cloud-sun': 'M8 3v1M3.5 5.5l.7.7M2 10h1M12.5 5.5l-.7.7M5.2 12A4 4 0 1111 7.6M17.5 21H9a4 4 0 110-8 5 5 0 019.6 1.8A3.1 3.1 0 0117.5 21z',
    cloud: 'M17.5 19H8a5 5 0 110-10 6 6 0 0111.5 2.5A3.5 3.5 0 0117.5 19z',
    rain: 'M17.5 15H8a5 5 0 110-10 6 6 0 0111.5 2.5A3.5 3.5 0 0117.5 15zM8 21l1-3M12 21l1-3M16 21l1-3',
    storm: 'M17.5 15H8a5 5 0 110-10 6 6 0 0111.5 2.5A3.5 3.5 0 0117.5 15zM13 15l-2 4h3l-2 4',
    fog: 'M4 10h16M4 14h16M6 18h12M8 6h8',
    snow: 'M12 2v20M4.9 7l14.2 10M4.9 17L19.1 7',
    moon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
    wind: 'M3 8h11a3 3 0 10-3-3M3 12h15a3 3 0 11-3 3M3 16h8',
    wave: 'M2 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0',
    sunrise: 'M12 2v6M4.9 10.9l1.4 1.4M2 18h20M19.1 10.9l-1.4 1.4M17 18a5 5 0 00-10 0M8 6l4-4 4 4',
    calendar: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',
    star: 'M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.6 6.7 19.5l1.1-6L3.4 9.3l6-.8z',
    bulb: 'M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V16h8v-1.3A7 7 0 0012 2z',
    news: 'M4 4h13v16H6a2 2 0 01-2-2zM17 8h3v10a2 2 0 01-2 2M8 8h5M8 12h5M8 16h3',
    // services & UI
    phone: 'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.6a2 2 0 01-.5 2.1L8 9.7a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.8.3 1.7.6 2.6.7a2 2 0 011.7 2z',
    card: 'M2 5h20v14H2zM2 10h20M6 15h4',
    home: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',
    pin: 'M12 22s7-6.3 7-12a7 7 0 10-14 0c0 5.7 7 12 7 12zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    globe: 'M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20',
    facebook: 'M15 3h-2a4 4 0 00-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 011-1h2z',
    youtube: 'M2.5 7.2A3 3 0 014.6 5C6.4 4.5 12 4.5 12 4.5s5.6 0 7.4.5a3 3 0 012.1 2.2c.5 1.9.5 4.8.5 4.8s0 2.9-.5 4.8a3 3 0 01-2.1 2.2c-1.8.5-7.4.5-7.4.5s-5.6 0-7.4-.5a3 3 0 01-2.1-2.2C2 14.9 2 12 2 12s0-2.9.5-4.8zM10 15l5-3-5-3z',
    tiktok: 'M16 3c.4 2.4 2 4 4.5 4.3v3.2c-1.7 0-3.2-.5-4.5-1.4V16a6 6 0 11-6-6v3.3a2.7 2.7 0 102.7 2.7V3z',
    radio: 'M3 9h18v12H3zM7 9l11-5M8 17.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM14 13h4M14 16h4',
    game: 'M6 12h4M8 10v4M15 11h.01M18 13h.01M7 6h10a5 5 0 015 5v2a5 5 0 01-5 5H7a5 5 0 01-5-5v-2a5 5 0 015-5z',
    quiz: 'M12 22a10 10 0 100-20 10 10 0 000 20zM9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01',
    camera: 'M3 7h4l2-3h6l2 3h4v13H3zM12 17a4 4 0 100-8 4 4 0 000 8z',
    headphones: 'M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1v-6h3zM3 19a2 2 0 002 2h1v-6H3z',
    walk: 'M13 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM9 22l2-7 3 3v4M11 15l1-6-3 1-2 3M12 9l3 3 3 1',
    bike: 'M5.5 18a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM18.5 18a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM5.5 14.5l4-6h5l4 6M9.5 8.5l3 6H5.5M14.5 8.5l-1-3h-2',
    sofa: 'M4 11V8a2 2 0 012-2h12a2 2 0 012 2v3M2 13a2 2 0 014 0v2h12v-2a2 2 0 014 0v5H2zM5 18v2M19 18v2',
    siren: 'M12 2v2M4.9 4.9l1.4 1.4M19.1 4.9l-1.4 1.4M7 18v-5a5 5 0 0110 0v5M5 21h14v-3H5z',
    bus: 'M5 3h14a1 1 0 011 1v13H4V4a1 1 0 011-1zM4 11h16M7 21v-4M17 21v-4M8 14h.01M16 14h.01',
    car: 'M5 17h14v-5l-2-5H7l-2 5zM5 12h14M7.5 17v2M16.5 17v2',
    broom: 'M19 3l-7 7M9 9l6 6-3 6-9-9z M6 15l3 3',
    link: 'M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7',
    search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
    alert: 'M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01',
    download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
    mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
    share: 'M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5',
    heart: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',
    timer: 'M12 22a8 8 0 100-16 8 8 0 000 16zM12 10v4l2 2M9 2h6',
    trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3a3 3 0 01-3 4M7 5H4a3 3 0 003 4',
    fire: 'M12 22a7 7 0 007-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8a7 7 0 007 7z',
    print: 'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z',
    qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3'
  };
  const CAT = { history: 'columns', heritage: 'arch', memory: 'candle', nature: 'leaf', trails: 'mountain', community: 'people',
    culture: 'note', sport: 'ball', city: 'building', future: 'crane', transport: 'train', news: 'mic', live: 'book' };
  const TOUR = { 'village-spring': 'walk', heritage: 'arch', nature: 'leaf', family: 'people', tomorrow: 'bike' };
  const svg = (name, size = 22, sw) => {
    const d = P[name] || P.headphones;
    return `<svg class="ic" width="${size}" height="${size}" style="width:${size}px;height:${size}px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw || (size >= 48 ? 1.1 : 1.7)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  };
  const cat = (x, size) => svg(CAT[typeof x === 'string' ? x : (x && (x.live ? 'live' : x.category))] || 'headphones', size);
  const tour = (t, size) => svg(TOUR[t && t.id] || 'walk', size);
  function hydrate(root) {
    (root || document).querySelectorAll('[data-icon]:not([data-iconed])').forEach(el => {
      el.innerHTML = svg(el.dataset.icon, +el.dataset.size || 22); el.setAttribute('data-iconed', '');
    });
  }
  window.PodIcons = { svg, cat, tour, hydrate, has: n => !!P[n] };
  if (document.readyState !== 'loading') hydrate(); else document.addEventListener('DOMContentLoaded', () => hydrate());
})();
