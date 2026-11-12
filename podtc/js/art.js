/* podtc — an illustrated scene for every podcast topic.
 * Drawn as vector art in the site's blues (sky, hills, and one clear subject per topic),
 * so it stays sharp at any size, loads instantly and works offline. viewBox: 0 0 200 200. */
(function () {
  const N = '#0B2E59', D = '#123E7C', W = '#fff', L = '#BFE3F7', T = '#7CD0F2';
  // shared scenery
  const sun = (x, y, r = 16) => `<g class="a-sun"><circle cx="${x}" cy="${y}" r="${r + 9}" fill="${W}" opacity=".18"/><circle cx="${x}" cy="${y}" r="${r}" fill="${W}" opacity=".9"/></g>`;
  const cloud = (x, y, s = 1, cls = 'a-cloud') => `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})" fill="${W}" opacity=".85"><ellipse cx="0" cy="0" rx="16" ry="7"/><ellipse cx="-9" cy="-4" rx="9" ry="7"/><ellipse cx="6" cy="-6" rx="10" ry="8"/></g>`;
  const carmel = `<path d="M0 132 Q30 96 62 112 T120 92 T200 108 V200 H0z" fill="${W}" opacity=".22"/><path d="M0 150 Q46 122 92 138 T200 128 V200 H0z" fill="${D}" opacity=".55"/>`;
  const ground = `<path d="M0 168 Q60 158 110 164 T200 160 V200 H0z" fill="${N}"/>`;
  const tree = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-1.6" y="0" width="3.2" height="12" fill="${N}"/><circle cx="0" cy="-4" r="9" fill="${L}"/><circle cx="-5" cy="1" r="6" fill="${L}"/><circle cx="5" cy="1" r="6" fill="${L}"/></g>`;
  const cypress = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -30 Q7 -10 4 12 H-4 Q-7 -10 0 -30z" fill="${L}"/>`;
  const person = (x, y, s = 1, f = W) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${f}"><circle cx="0" cy="-15" r="4.5"/><path d="M-6 6 Q-6 -9 0 -9 Q6 -9 6 6z"/></g>`;
  const win = (x, y, w = 6, h = 9, f = T) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="${f}"/>`;
  const arch = (x, y, w = 10, h = 16, f = N) => `<path d="M${x} ${y + h} V${y + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 V${y + h}z" fill="${f}"/>`;

  const SCENES = {
    /* היסטוריה: stone houses of the old village, an arched gate and a palm */
    history: `${sun(152, 46)}${cloud(48, 40, .9)}${carmel}${ground}
      <rect x="34" y="112" width="58" height="56" fill="${W}"/><path d="M30 112 h66 v-7 h-8 v4 h-8 v-4 h-8 v4 h-8 v-4 h-8 v4 h-8 v-4 h-8 v4 h-2z" fill="${W}"/>
      ${arch(54, 132, 18, 36)}${win(40, 122)}${win(80, 122)}
      <rect x="98" y="128" width="46" height="40" fill="${L}"/><path d="M94 128 h54 l-8 -12 h-38z" fill="${W}"/>${arch(112, 144, 12, 24)}${win(130, 138, 7, 9, N)}
      <g stroke="${N}" stroke-width="1" opacity=".25"><path d="M34 140 h58 M34 154 h58 M98 148 h46"/></g>
      <g transform="translate(166 168)"><rect x="-2" y="-46" width="4" height="46" fill="${L}"/><g fill="${W}"><path d="M0 -46 q-22 -6 -26 10 q14 -12 26 -6z"/><path d="M0 -46 q22 -6 26 10 q-14 -12 -26 -6z"/><path d="M0 -46 q-10 -20 -24 -12 q16 0 24 14z"/><path d="M0 -46 q10 -20 24 -12 q-16 0 -24 14z"/></g></g>`,
    /* קהילה: neighbours between homes, a bench and a heart */
    community: `${sun(44, 44)}${cloud(140, 38)}${carmel}${ground}
      <rect x="18" y="104" width="46" height="64" fill="${W}"/>${win(26, 114)}${win(40, 114)}${win(52, 114, 6, 9)}${win(26, 132)}${win(40, 132)}${win(52, 132)}${win(26, 150)}${win(52, 150)}
      <rect x="138" y="94" width="46" height="74" fill="${L}"/>${win(146, 104, 6, 9, D)}${win(160, 104, 6, 9, D)}${win(172, 104, 6, 9, D)}${win(146, 122, 6, 9, D)}${win(160, 122, 6, 9, D)}${win(172, 122, 6, 9, D)}${win(146, 140, 6, 9, D)}${win(172, 140, 6, 9, D)}
      ${tree(84, 150, 1.1)}${tree(122, 152, .9)}
      ${person(86, 162, 1.1)}${person(102, 162, 1.3, T)}${person(118, 162, 1.1)}
      <path class="a-beat" d="M102 96 c-7 -10 -20 -2 -12 8 l12 12 l12 -12 c8 -10 -5 -18 -12 -8z" fill="${W}"/>`,
    /* תרבות: a stage, curtain, spotlight and music */
    culture: `<path d="M0 0 h200 v200 h-200z" fill="${N}" opacity=".25"/>
      <path d="M70 0 L20 170 H110z" fill="${W}" opacity=".16"/><path d="M130 0 L90 170 H180z" fill="${W}" opacity=".16"/>
      <path d="M0 0 h200 v26 q-14 14 -28 0 q-14 14 -29 0 q-14 14 -29 0 q-14 14 -29 0 q-14 14 -28 0 q-14 14 -29 0 q-14 14 -28 0z" fill="${W}"/>
      <path d="M0 26 q22 60 6 144 h-6z M200 26 q-22 60 -6 144 h6z" fill="${L}"/>
      <rect x="0" y="166" width="200" height="34" fill="${N}"/><rect x="0" y="162" width="200" height="6" fill="${W}"/>
      <g transform="translate(100 120)"><rect x="-2" y="6" width="4" height="40" fill="${W}"/><rect x="-14" y="44" width="28" height="4" rx="2" fill="${W}"/><rect x="-9" y="-28" width="18" height="34" rx="9" fill="${W}"/><path d="M-9 -16 h18 M-9 -8 h18" stroke="${D}" stroke-width="2"/><path d="M-15 -6 a15 15 0 0 0 30 0" fill="none" stroke="${W}" stroke-width="3"/></g>
      <g class="a-note" fill="${T}"><path d="M48 88 v-28 l16 -5 v26 a6 5 0 1 1 -3 -4 v-14 l-10 3 v20 a6 5 0 1 1 -3 -4z"/></g>
      <g class="a-note a-note2" fill="${W}"><path d="M150 76 v-22 l3 0 q8 4 6 12 q-2 -5 -6 -5 v17 a6 5 0 1 1 -3 -4z"/></g>`,
    /* טבע: the Carmel, pines, a stream and a deer */
    nature: `${sun(150, 44, 18)}${cloud(52, 36)}${cloud(108, 58, .6, 'a-cloud a-cloud2')}
      <path d="M0 118 L44 62 L78 104 L112 54 L160 110 L200 84 V200 H0z" fill="${W}" opacity=".22"/>${carmel}
      <path d="M0 162 Q60 150 110 160 T200 154 V200 H0z" fill="${N}"/>
      <path class="a-flow" d="M118 200 Q104 180 126 168 Q142 160 132 150" fill="none" stroke="${T}" stroke-width="7" stroke-linecap="round"/>
      ${cypress(26, 150, 1.3)}${cypress(44, 156, 1)}${tree(172, 146, 1.3)}${tree(150, 152, .9)}
      <g transform="translate(78 150)" fill="${W}"><path d="M0 0 h22 q5 0 5 5 v4 h-3 v10 h-3 v-10 h-12 v10 h-3 v-10 q-3 -1 -3 -5z"/><path d="M22 2 l6 -12 h5 l2 4 l-5 2 l-3 9z"/><path d="M30 -10 l-3 -8 M32 -10 l3 -8 M30 -14 l-4 -1 M33 -14 l4 -1" stroke="${W}" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`,
    /* העיר של מחר: towers rising, a crane and the sea line */
    future: `${sun(40, 40)}${cloud(120, 30, .8)}
      <rect x="0" y="150" width="200" height="50" fill="${D}" opacity=".5"/>
      <rect x="22" y="78" width="30" height="92" fill="${L}"/><rect x="60" y="48" width="34" height="122" fill="${W}"/><rect x="102" y="92" width="28" height="78" fill="${L}"/>
      <g fill="${D}">${[58, 70, 82, 94, 106, 118, 130, 142, 154].map(y => `<rect x="66" y="${y}" width="22" height="5"/>`).join('')}${[88, 102, 116, 130, 144, 156].map(y => `<rect x="27" y="${y}" width="20" height="5"/>`).join('')}${[102, 116, 130, 144, 156].map(y => `<rect x="107" y="${y}" width="18" height="5"/>`).join('')}</g>
      <path d="M60 48 l17 -14 l17 14z" fill="${T}"/>
      <g stroke="${W}" stroke-width="3" fill="none" stroke-linecap="round"><path d="M156 170 V44 M156 54 H112 M156 54 H180 M156 44 L126 54 M156 44 L176 54"/><path class="a-hook" d="M124 54 V86"/></g><rect class="a-hook" x="117" y="86" width="14" height="10" fill="${T}"/><rect x="170" y="54" width="12" height="10" fill="${W}"/>
      <path d="M0 170 Q50 164 100 170 T200 168 V200 H0z" fill="${N}"/><path class="a-flow" d="M10 184 q10 -5 20 0 t20 0 t20 0 M110 188 q10 -5 20 0 t20 0 t20 0" stroke="${T}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    /* אירועים חשובים: a memorial flame under the Carmel sky */
    memory: `<circle cx="100" cy="92" r="70" fill="${W}" opacity=".1"/><circle cx="100" cy="92" r="46" fill="${W}" opacity=".12"/>${carmel}${ground}
      ${cypress(34, 160, 1.5)}${cypress(54, 164, 1.1)}${cypress(166, 160, 1.5)}${cypress(146, 164, 1.1)}
      <path d="M76 168 h48 l-6 -52 h-36z" fill="${W}"/><rect x="68" y="164" width="64" height="8" rx="2" fill="${L}"/><rect x="80" y="110" width="40" height="8" rx="2" fill="${L}"/>
      <path d="M88 132 h24 M88 142 h24 M88 152 h16" stroke="${D}" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>
      <g class="a-flame"><path d="M100 60 q16 20 10 36 q-3 12 -10 14 q-7 -2 -10 -14 q-6 -16 10 -36z" fill="${W}"/><path d="M100 80 q8 10 5 20 q-2 7 -5 8 q-3 -1 -5 -8 q-3 -10 5 -20z" fill="${T}"/></g>
      <g fill="${W}" opacity=".8"><circle cx="30" cy="40" r="1.6"/><circle cx="62" cy="24" r="1.2"/><circle cx="150" cy="30" r="1.6"/><circle cx="176" cy="56" r="1.2"/><circle cx="124" cy="18" r="1.2"/></g>`,
    /* מבנים ובתי כנסת עתיקים: a domed stone hall with arched windows */
    heritage: `${sun(160, 40, 14)}${cloud(40, 44)}${carmel}${ground}
      <rect x="48" y="96" width="104" height="72" fill="${W}"/><path d="M70 96 a30 30 0 0 1 60 0z" fill="${L}"/><rect x="98" y="52" width="4" height="16" fill="${W}"/>
      <path d="M100 44 l3.5 6 h-7z M100 58 l-3.5 -6 h7z" fill="${W}"/>
      <path d="M44 96 h112 v-6 h-112z" fill="${L}"/>
      ${arch(88, 124, 24, 44)}${arch(58, 112, 14, 26, T)}${arch(128, 112, 14, 26, T)}
      <path d="M65 112 v26 M135 112 v26 M58 126 h14 M128 126 h14" stroke="${W}" stroke-width="1.6"/>
      <g stroke="${N}" stroke-width="1" opacity=".22"><path d="M48 112 h8 M144 112 h8 M48 146 h40 M112 146 h40 M48 158 h40 M112 158 h40"/></g>
      <rect x="40" y="166" width="120" height="6" fill="${L}"/>${cypress(28, 164, 1.4)}${cypress(174, 164, 1.4)}`,
    /* ספורט: a pitch, a goal and a ball in flight */
    sport: `${sun(36, 38, 14)}${cloud(150, 34, .9)}
      <path d="M0 84 h200 v24 h-200z" fill="${W}" opacity=".18"/><g fill="${W}" opacity=".5">${Array.from({ length: 22 }, (_, i) => `<circle cx="${6 + i * 9}" cy="${90 + (i % 2) * 7}" r="3"/>`).join('')}</g>
      <path d="M0 110 h200 v90 h-200z" fill="${N}"/><path d="M0 110 h200 v90 h-200z" fill="${D}" opacity=".5"/>
      <g fill="${W}" opacity=".1"><path d="M0 110 h40 l-20 90 h-20z M80 110 h40 l10 90 h-60z M160 110 h40 v90 h-10z"/></g>
      <g stroke="${W}" stroke-width="2.4" fill="none"><path d="M0 134 h200"/><ellipse cx="100" cy="168" rx="46" ry="14"/><path d="M100 134 v66"/></g>
      <g stroke="${W}" stroke-width="3.5" fill="none" stroke-linejoin="round"><path d="M128 134 v-34 h56 v34"/></g><g stroke="${W}" stroke-width=".8" opacity=".6"><path d="M134 100 v34 M142 100 v34 M150 100 v34 M158 100 v34 M166 100 v34 M174 100 v34 M128 108 h56 M128 116 h56 M128 124 h56"/></g>
      <path d="M40 150 Q80 60 120 96" fill="none" stroke="${W}" stroke-width="1.6" stroke-dasharray="3 5" opacity=".7"/>
      <g class="a-ball" transform="translate(106 86)"><circle r="13" fill="${W}"/><path d="M0 -5 l5 3.5 l-2 6 h-6 l-2 -6z" fill="${N}"/><path d="M0 -5 v-8 M5 -1.5 l7 -3 M3 4.5 l5 6 M-3 4.5 l-5 6 M-5 -1.5 l-7 -3" stroke="${N}" stroke-width="1.6"/></g>`,
    /* עירייה: the town hall with a flag and a clock */
    city: `${sun(160, 42, 14)}${cloud(46, 40)}${carmel}${ground}
      <rect x="40" y="96" width="120" height="72" fill="${W}"/><path d="M34 96 h132 l-66 -34z" fill="${L}"/><circle cx="100" cy="82" r="8" fill="${W}"/><path d="M100 77 v5 l4 2" stroke="${N}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <g fill="${L}"><rect x="50" y="102" width="8" height="60"/><rect x="70" y="102" width="8" height="60"/><rect x="122" y="102" width="8" height="60"/><rect x="142" y="102" width="8" height="60"/></g>
      ${arch(90, 124, 20, 44)}${win(60, 112, 8, 12, T)}${win(132, 112, 8, 12, T)}${win(60, 136, 8, 12, T)}${win(132, 136, 8, 12, T)}
      <rect x="32" y="164" width="136" height="8" rx="2" fill="${L}"/><rect x="26" y="170" width="148" height="6" rx="2" fill="${W}"/>
      <rect x="99" y="34" width="2.4" height="30" fill="${W}"/><path class="a-flag" d="M101.4 36 q9 -4 16 0 t14 0 v14 q-7 4 -14 0 t-16 0z" fill="${W}"/><path d="M106 43 h20" stroke="${T}" stroke-width="2.4"/>
      ${tree(22, 156, 1.1)}${tree(180, 156, 1.1)}`,
    /* מסלולי הליכה: a winding trail, a signpost and a hiker */
    trails: `${sun(152, 40, 16)}${cloud(50, 34)}
      <path d="M0 116 L50 60 L86 100 L124 50 L172 108 L200 86 V200 H0z" fill="${W}" opacity=".22"/><path d="M110 50 l14 0 l10 12 l-9 -3 l-6 5 l-5 -5 l-9 4z" fill="${W}" opacity=".7" transform="translate(-2 0)"/>${carmel}
      <path d="M0 160 Q60 146 110 158 T200 150 V200 H0z" fill="${N}"/>
      <path d="M84 200 Q70 178 104 170 Q138 162 120 146 Q106 134 132 126" fill="none" stroke="${W}" stroke-width="9" stroke-linecap="round" opacity=".9"/>
      <path class="a-flow" d="M84 200 Q70 178 104 170 Q138 162 120 146 Q106 134 132 126" fill="none" stroke="${D}" stroke-width="1.8" stroke-dasharray="5 6" stroke-linecap="round"/>
      <g transform="translate(40 166)"><rect x="-1.8" y="-34" width="3.6" height="34" fill="${W}"/><path d="M2 -32 h22 l6 5 l-6 5 h-22z" fill="${W}"/><path d="M-2 -18 h-20 l-6 5 l6 5 h20z" fill="${L}"/><rect x="8" y="-29" width="4" height="4" fill="${T}"/><rect x="13" y="-29" width="4" height="4" fill="${N}"/></g>
      <g transform="translate(150 148)" fill="${W}"><circle cx="0" cy="-22" r="5"/><path d="M-5 -15 h10 l2 16 l5 14 h-5 l-5 -12 l-3 12 h-5 l3 -16z"/><rect x="-11" y="-15" width="7" height="13" rx="2" fill="${T}"/><path d="M9 -8 l8 6 v20" stroke="${W}" stroke-width="2" fill="none" stroke-linecap="round"/></g>
      ${cypress(176, 150, 1.1)}${tree(16, 150, 1)}`,
    /* תחבורה: a train out of the Carmel tunnel and a bus on the road */
    transport: `${sun(42, 36, 14)}${cloud(132, 30, .9)}
      <path d="M96 150 Q130 60 200 70 V150z" fill="${W}" opacity=".22"/><path d="M120 150 Q150 92 200 96 V150z" fill="${D}" opacity=".55"/>
      <path d="M150 150 v-22 a16 16 0 0 1 32 0 v22z" fill="${N}"/>
      <rect x="0" y="150" width="200" height="50" fill="${N}"/><rect x="0" y="146" width="200" height="5" fill="${L}"/>
      <g class="a-train"><path d="M40 112 h112 q10 0 16 10 l6 24 h-134z" fill="${W}"/><path d="M40 112 h-40 v34 h40z" fill="${L}"/><g fill="${D}">${win(50, 120, 14, 12, D)}${win(70, 120, 14, 12, D)}${win(90, 120, 14, 12, D)}${win(110, 120, 14, 12, D)}<path d="M132 120 h20 q5 0 8 6 l3 6 h-31z"/>${win(6, 120, 12, 12, D)}${win(22, 120, 12, 12, D)}</g><rect x="0" y="138" width="174" height="3" fill="${T}"/><g fill="${N}"><circle cx="20" cy="148" r="5"/><circle cx="62" cy="148" r="5"/><circle cx="118" cy="148" r="5"/><circle cx="154" cy="148" r="5"/></g></g>
      <path d="M0 176 h200" stroke="${W}" stroke-width="2.4" stroke-dasharray="14 10" opacity=".7"/>
      <g class="a-bus" transform="translate(24 158)"><rect x="0" y="0" width="56" height="26" rx="5" fill="${T}"/><rect x="4" y="4" width="34" height="10" rx="2" fill="${N}"/><rect x="42" y="4" width="10" height="16" rx="2" fill="${N}"/><circle cx="14" cy="27" r="5" fill="${W}"/><circle cx="42" cy="27" r="5" fill="${W}"/></g>`,
    /* מהדורה: the daily briefing, a studio microphone on air */
    news: `<circle cx="100" cy="96" r="78" fill="${W}" opacity=".08"/><circle class="a-ring" cx="100" cy="96" r="58" fill="none" stroke="${W}" stroke-width="2" opacity=".35"/><circle class="a-ring a-ring2" cx="100" cy="96" r="40" fill="none" stroke="${W}" stroke-width="2" opacity=".5"/>
      <rect x="0" y="166" width="200" height="34" fill="${N}"/>
      <g transform="translate(100 100)"><rect x="-17" y="-52" width="34" height="62" rx="17" fill="${W}"/><path d="M-17 -30 h34 M-17 -18 h34 M-17 -6 h34" stroke="${D}" stroke-width="2.4"/><path d="M-27 -4 a27 27 0 0 0 54 0" fill="none" stroke="${W}" stroke-width="5" stroke-linecap="round"/><rect x="-2.5" y="23" width="5" height="34" fill="${W}"/><rect x="-24" y="56" width="48" height="8" rx="4" fill="${W}"/></g>
      <g transform="translate(40 34)"><rect x="-26" y="-11" width="52" height="22" rx="4" fill="${W}"/><circle class="a-beat" cx="-15" cy="0" r="4.5" fill="${D}"/><rect x="-6" y="-2.5" width="24" height="5" rx="2.5" fill="${D}" opacity=".55"/></g>`
  };
  SCENES.live = SCENES.news;
  const svg = cat => `<svg class="cover__art" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${SCENES[cat] || SCENES.city}</svg>`;
  window.PodArt = { svg, has: c => !!SCENES[c], topics: Object.keys(SCENES) };
})();
