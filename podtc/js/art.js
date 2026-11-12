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
  /* ================= one scene per episode ================= */
  const sea = (y, o = 1) => `<path d="M0 ${y} Q25 ${y - 5} 50 ${y} T100 ${y} T150 ${y} T200 ${y} V200 H0z" fill="${N}" opacity="${o}"/><path class="a-flow" d="M8 ${y + 14} q10 -5 20 0 t20 0 t20 0 M100 ${y + 22} q10 -5 20 0 t20 0 t20 0 M40 ${y + 32} q10 -5 20 0 t20 0" stroke="${T}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  const tower = (x, y, w, h, f = W, wf = D) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/><g fill="${wf}">${Array.from({ length: Math.floor((h - 8) / 12) }, (_, i) => `<rect x="${x + 4}" y="${y + 7 + i * 12}" width="${w - 8}" height="5"/>`).join('')}</g>`;
  const house = (x, y, w, h, f = W, r = L) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/><path d="M${x - 4} ${y} h${w + 8} l-${w / 2 + 4} -${Math.round(w * .38)}z" fill="${r}"/>`;
  const tent = (x, y, s = 1, f = W) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -26 L24 0 H-24z" fill="${f}"/><path d="M0 -26 L7 0 H-7z" fill="${N}"/><path d="M0 -26 v-6" stroke="${W}" stroke-width="2" fill="none"/></g>`;
  const palm = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-2" y="-46" width="4" height="46" fill="${L}"/><g fill="${W}"><path d="M0 -46 q-22 -6 -26 10 q14 -12 26 -6z"/><path d="M0 -46 q22 -6 26 10 q-14 -12 -26 -6z"/><path d="M0 -46 q-10 -20 -24 -12 q16 0 24 14z"/><path d="M0 -46 q10 -20 24 -12 q-16 0 -24 14z"/></g></g>`;
  const lamp = (x, y, h = 40) => `<g transform="translate(${x} ${y})"><rect x="-1.2" y="${-h}" width="2.4" height="${h}" fill="${W}"/><path d="M0 ${-h} h9" stroke="${W}" stroke-width="2.4" fill="none"/><circle class="a-beat" cx="10" cy="${-h + 3}" r="3.4" fill="${T}"/></g>`;
  const star = (x, y, r = 2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${W}" opacity=".85"/>`;
  const flower = (x, y, s = 1) => `<g class="a-beat" transform="translate(${x} ${y}) scale(${s})" fill="${W}">${[0, 72, 144, 216, 288].map(r => `<ellipse cx="0" cy="-5" rx="3.2" ry="5" transform="rotate(${r})"/>`).join('')}<circle r="2.4" fill="${T}"/></g>`;
  const EP = {
    'old-core': SCENES.history, 'em-habanim': SCENES.heritage, municipality: SCENES.city, stadium: SCENES.sport, 'north-gate': SCENES.transport, 'trail-kelah-galim': SCENES.trails,
    /* שיכוני העולים: the transit camp of 1949 */
    maabara: `${sun(156, 42, 14)}${cloud(50, 38)}${carmel}${ground}
      ${tent(40, 166, 1.1)}${tent(86, 168, 1.35, L)}${tent(136, 166, 1.1)}${tent(174, 168, .8, L)}
      <rect x="14" y="120" width="2.4" height="48" fill="${W}"/><rect x="62" y="124" width="2.4" height="44" fill="${W}"/><path d="M15 122 Q39 132 63 126" stroke="${W}" stroke-width="1.6" fill="none"/>
      <g class="a-flag"><rect x="22" y="126" width="9" height="12" fill="${T}"/><rect x="35" y="129" width="8" height="10" fill="${W}"/><rect x="47" y="128" width="9" height="12" fill="${L}"/></g>
      <g transform="translate(112 176)"><rect x="-9" y="-7" width="18" height="12" rx="2" fill="${T}"/><path d="M-4 -7 v-4 h8 v4" stroke="${W}" stroke-width="2" fill="none"/></g>${person(152, 180, .9)}${person(162, 181, .7, T)}`,
    /* בית הספר של הכפר */
    'old-school': `${sun(40, 40, 14)}${cloud(140, 36)}${carmel}${ground}
      <rect x="44" y="104" width="112" height="64" fill="${W}"/><path d="M40 104 h120 v-7 h-120z" fill="${L}"/>
      <rect x="90" y="70" width="20" height="28" fill="${W}"/><path d="M86 70 h28 l-14 -12z" fill="${L}"/><g class="a-flag"><path d="M100 76 q7 2 7 10 h-14 q0 -8 7 -10z" fill="${T}"/><circle cx="100" cy="88" r="2" fill="${N}"/></g>
      ${arch(54, 116, 14, 26, T)}${arch(76, 116, 14, 26, T)}${arch(110, 116, 14, 26, T)}${arch(132, 116, 14, 26, T)}${arch(92, 138, 16, 30)}
      <g stroke="${N}" stroke-width="1" opacity=".22" fill="none"><path d="M44 150 h44 M112 150 h44 M44 160 h44 M112 160 h44"/></g>
      <g transform="translate(170 162) rotate(-8)"><path d="M-16 -8 q8 -5 16 0 q8 -5 16 0 v14 q-8 -5 -16 0 q-8 -5 -16 0z" fill="${W}"/><path d="M0 -8 v14" stroke="${D}" stroke-width="1.6" fill="none"/></g>${tree(22, 156, 1.1)}`,
    /* בית הכנסת בית תנחום */
    'beit-tanhum': `${carmel}${ground}${star(30, 30)}${star(170, 44, 1.5)}${star(60, 56, 1.3)}
      <path d="M52 168 V86 L100 52 L148 86 V168z" fill="${W}"/><path d="M46 88 L100 48 L154 88 l-4 6 L100 58 L50 94z" fill="${L}"/>
      <circle cx="100" cy="92" r="15" fill="${T}"/><path d="M100 79 l11 19 h-22z M100 105 l-11 -19 h22z" fill="none" stroke="${W}" stroke-width="2.2"/>
      ${arch(88, 126, 24, 42)}${arch(62, 118, 12, 26, T)}${arch(126, 118, 12, 26, T)}
      <g class="a-flame" transform="translate(100 150)" stroke="${T}" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M0 14 v-18 M-12 -4 q0 12 12 12 q12 0 12 -12 M-7 -4 q0 7 7 7 q7 0 7 -7"/></g>
      <rect x="44" y="166" width="112" height="6" fill="${L}"/>${cypress(26, 164, 1.3)}${cypress(176, 164, 1.3)}`,
    /* אזור התעשייה: from workshops to hi-tech */
    'industrial-zone': `${sun(36, 40, 13)}${carmel}${ground}
      <path d="M14 168 V122 l18 -14 v14 l18 -14 v14 l18 -14 v46z" fill="${W}"/><rect x="24" y="78" width="10" height="46" fill="${L}"/>
      <g class="a-cloud" fill="${W}" opacity=".8"><circle cx="30" cy="68" r="7"/><circle cx="40" cy="58" r="9"/><circle cx="54" cy="50" r="11"/></g>
      ${win(22, 140, 9, 9, D)}${win(38, 140, 9, 9, D)}${win(54, 140, 9, 9, D)}
      <path d="M82 138 h18 l-5 -6 M100 138 l-5 6" stroke="${W}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M112 168 V70 l66 -14 v112z" fill="${L}"/><g stroke="${D}" stroke-width="1.6" fill="none" opacity=".7"><path d="M112 88 l66 -10 M112 106 l66 -8 M112 124 l66 -6 M112 142 l66 -4 M134 66 v102 M156 61 v107"/></g>
      <g class="a-sun" transform="translate(145 40)" fill="${W}"><circle r="9" fill="none" stroke="${W}" stroke-width="5" stroke-dasharray="5 4.4"/><circle r="4"/></g>`,
    /* מתחם תע"ש: an old plant that becomes a neighbourhood */
    'imi-site': `${sun(160, 38, 13)}${cloud(60, 34)}${carmel}${ground}
      <path d="M12 168 V118 q22 -22 44 0 q22 -22 44 0 v50z" fill="${W}"/><rect x="24" y="134" width="20" height="34" fill="${N}"/><rect x="66" y="134" width="20" height="34" fill="${N}"/>
      <g stroke="${W}" stroke-width="2.2" fill="none"><path d="M6 168 v-22 M106 168 v-22 M6 150 h100 M6 158 h100"/></g>
      <g fill="none" stroke="${W}" stroke-width="2.2" stroke-dasharray="5 4" class="a-flow"><path d="M122 168 v-70 h24 v70 M152 168 v-92 h26 v92 M118 98 l16 -12 l16 12 M148 76 l17 -12 l17 12"/></g>
      <g fill="${T}" opacity=".85">${[108, 122, 136, 150].map(y => `<rect x="127" y="${y}" width="14" height="5"/>`).join('')}${[86, 100, 114, 128, 142, 156].map(y => `<rect x="157" y="${y}" width="16" height="5"/>`).join('')}</g>`,
    /* בין העיר לים */
    coast: `${sun(100, 92, 26)}${cloud(40, 40)}${cloud(160, 56, .7, 'a-cloud a-cloud2')}
      <path d="M0 110 h200 v90 h-200z" fill="${D}" opacity=".5"/><path d="M74 110 h52 l14 60 h-80z" fill="${W}" opacity=".25"/>${sea(128)}
      <path d="M0 176 Q60 160 200 172 V200 H0z" fill="${L}"/>
      <g transform="translate(150 176)"><rect x="-1.5" y="-34" width="3" height="36" fill="${N}"/><path d="M0 -38 q-24 2 -28 16 h56 q-4 -14 -28 -16z" fill="${W}"/><path d="M0 -38 q-8 4 -9 16 M0 -38 q8 4 9 16" stroke="${T}" stroke-width="2" fill="none"/></g>
      <g class="a-train" transform="translate(52 118)"><path d="M-14 0 h28 l-5 8 h-18z" fill="${W}"/><path d="M0 -24 v24 M0 -22 l12 18 h-12z" fill="${W}" stroke="${W}" stroke-width="1.5"/></g>`,
    /* מורדות הכרמל */
    'carmel-slopes': `${sun(40, 38, 14)}${cloud(150, 34)}
      <path d="M0 200 V96 L46 44 L92 110 L132 58 L200 120 V200z" fill="${W}" opacity=".22"/><path d="M0 200 V130 L52 78 L104 146 L150 100 L200 150 V200z" fill="${D}" opacity=".6"/>
      <path class="a-flow" d="M104 96 Q96 120 110 138 Q124 156 104 176 Q96 188 104 200" stroke="${T}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M96 96 h16" stroke="${W}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M0 200 V168 Q40 154 84 172 L84 200z M200 200 V160 Q160 150 124 172 L124 200z" fill="${N}"/>
      ${cypress(22, 164, 1.4)}${cypress(40, 170, 1)}${cypress(62, 172, 1.2)}${tree(162, 156, 1.2)}${tree(184, 160, .9)}${cypress(142, 168, 1)}
      <g class="a-note" fill="${W}"><path d="M70 60 q5 -6 10 0 q5 -6 10 0 q-5 -2 -10 3 q-5 -5 -10 -3z"/></g>`,
    /* שכונת נוף ים */
    'nof-yam': `${sun(160, 38, 14)}${cloud(48, 40)}<path d="M0 118 h200 v20 h-200z" fill="${D}" opacity=".45"/><path class="a-flow" d="M10 128 q10 -4 20 0 t20 0 M120 126 q10 -4 20 0 t20 0" stroke="${T}" stroke-width="2" fill="none"/>
      <path d="M0 150 Q60 126 120 140 T200 132 V200 H0z" fill="${N}"/>
      ${tower(22, 84, 30, 70, W)}${tower(60, 68, 30, 86, L)}${tower(98, 92, 30, 62, W)}
      <path d="M22 84 h30 v-6 h-30z M60 68 h30 v-6 h-30z M98 92 h30 v-6 h-30z" fill="${T}"/>
      <g transform="translate(158 172)" stroke="${W}" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M-18 0 L-8 -30 L2 0 M-12 -18 h8 M-8 -30 h34 M26 -30 v30"/><path class="a-ball" d="M10 -30 v16 M4 -14 h12"/></g>${tree(140, 164, .8)}`,
    /* שנות ה־80 */
    'shnot-80': `<path d="M0 0 h200 v200 h-200z" fill="${N}" opacity=".3"/><g stroke="${W}" stroke-width="1" opacity=".25" fill="none"><path d="M0 150 h200 M0 164 h200 M0 182 h200 M100 136 v64 M60 136 L20 200 M140 136 L180 200 M30 136 L-40 200 M170 136 L240 200"/></g><path d="M0 136 h200" stroke="${T}" stroke-width="2"/>
      <circle class="a-sun" cx="100" cy="96" r="44" fill="${W}" opacity=".16"/>
      <g transform="translate(100 104)"><path d="M-18 -44 L0 -30 L22 -52" stroke="${W}" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="-46" y="-30" width="92" height="64" rx="10" fill="${W}"/><rect x="-38" y="-22" width="58" height="48" rx="7" fill="${D}"/><circle cx="33" cy="-12" r="5" fill="${T}"/><circle cx="33" cy="4" r="5" fill="${L}"/><path d="M27 18 h12" stroke="${D}" stroke-width="2.4"/>
        <g class="a-flow" stroke="${T}" stroke-width="3" fill="none" stroke-dasharray="6 5"><path d="M-32 -8 h46 M-32 2 h46 M-32 12 h46"/></g><rect x="-30" y="34" width="8" height="8" fill="${L}"/><rect x="22" y="34" width="8" height="8" fill="${L}"/></g>
      <g class="a-note" fill="${W}"><path d="M30 60 v-22 l14 -4 v20 a5 4 0 1 1 -3 -3 v-11 l-8 2 v16 a5 4 0 1 1 -3 -3z"/></g><g class="a-note a-note2" transform="translate(166 164)"><rect x="-18" y="-11" width="36" height="22" rx="3" fill="${W}"/><circle cx="-7" cy="0" r="4.5" fill="${D}"/><circle cx="7" cy="0" r="4.5" fill="${D}"/></g>`,
    /* שריפת הכרמל */
    'fire-2010': `<path d="M0 0 h200 v200 h-200z" fill="${N}" opacity=".35"/><g class="a-cloud" fill="${W}" opacity=".3"><circle cx="60" cy="52" r="20"/><circle cx="90" cy="40" r="26"/><circle cx="126" cy="50" r="20"/></g>
      <path d="M0 200 V120 L50 76 L100 124 L146 84 L200 128 V200z" fill="${D}"/>
      <g class="a-flame" fill="${W}"><path d="M40 122 q12 -22 4 -40 q18 14 16 34 q8 -6 6 -16 q12 16 2 30z"/></g><g class="a-flame" fill="${T}"><path d="M48 124 q6 -12 3 -22 q10 9 8 22z"/></g>
      <g class="a-flame" fill="${W}" style="animation-delay:-.6s"><path d="M112 126 q12 -22 4 -40 q18 14 16 34 q8 -6 6 -16 q12 16 2 30z"/></g><g class="a-flame" fill="${T}"><path d="M120 128 q6 -12 3 -22 q10 9 8 22z"/></g>
      <path d="M0 200 V160 Q60 146 110 158 T200 152 V200z" fill="${N}"/>${cypress(20, 166, 1.3)}${cypress(176, 162, 1.3)}${tree(86, 160, 1)}
      <g class="a-train" transform="translate(140 34)"><path d="M-34 0 h56 q12 0 12 6 q0 5 -12 5 h-56 q-8 0 -8 -5 q0 -6 8 -6z" fill="${W}"/><path d="M-10 0 l-14 -14 h10 l18 14z M-34 2 l-8 -10 h6 l8 10z" fill="${L}"/><g class="a-flow" stroke="${T}" stroke-width="2.4" stroke-dasharray="4 5" fill="none" stroke-linecap="round"><path d="M-8 12 v30 M2 12 v36 M12 12 v28"/></g></g>`,
    /* פסיפס העליות */
    'aliyah-mosaic': `${sun(160, 36, 12)}
      <g transform="translate(22 26)">${Array.from({ length: 36 }, (_, i) => { const x = i % 6, y = Math.floor(i / 6), f = [W, L, T, D, W, T, L][(x * 3 + y * 5) % 7]; return `<rect x="${x * 18}" y="${y * 18}" width="16" height="16" rx="2" fill="${f}" opacity="${f === D ? .7 : .95}"/>`; }).join('')}</g>
      <path d="M0 150 h200 v50 h-200z" fill="${N}"/>
      <g transform="translate(150 168)"><rect x="-20" y="-16" width="40" height="28" rx="4" fill="${W}"/><path d="M-8 -16 v-7 h16 v7" stroke="${W}" stroke-width="3" fill="none"/><path d="M-20 -4 h40" stroke="${D}" stroke-width="2"/></g>
      <g transform="translate(108 176)"><rect x="-13" y="-10" width="26" height="20" rx="3" fill="${T}"/><path d="M-5 -10 v-5 h10 v5" stroke="${T}" stroke-width="2.4" fill="none"/></g>
      ${person(40, 180, 1.2)}${person(58, 182, .9, T)}${person(74, 180, 1.1, L)}
      <g class="a-train" transform="translate(150 90)" fill="${W}"><path d="M-22 0 h34 l10 -5 l-4 8 h-40z M-8 -1 l-8 -12 h6 l12 12z"/></g>`,
    /* טירת השקדים */
    almonds: `${sun(156, 44, 16)}${cloud(46, 30)}${carmel}${ground}
      <g stroke="${N}" stroke-width="7" fill="none" stroke-linecap="round"><path d="M96 170 Q92 130 104 104"/></g><g stroke="${N}" stroke-width="4.5" fill="none" stroke-linecap="round"><path d="M104 108 Q84 86 58 84 M102 116 Q130 96 152 100 M100 104 Q104 76 122 58 M98 110 Q76 100 62 112 M110 100 Q134 84 140 66"/></g>
      ${flower(58, 84, 1.5)}${flower(152, 100, 1.5)}${flower(122, 58, 1.6)}${flower(62, 112, 1.3)}${flower(140, 66, 1.3)}${flower(84, 92, 1.2)}${flower(126, 96, 1.2)}${flower(104, 78, 1.3)}${flower(76, 68, 1.1)}${flower(112, 112, 1.1)}
      <g class="a-note" fill="${W}"><ellipse cx="40" cy="140" rx="3" ry="5" transform="rotate(30 40 140)"/><ellipse cx="160" cy="146" rx="3" ry="5" transform="rotate(-20 160 146)"/><ellipse cx="72" cy="150" rx="3" ry="5" transform="rotate(60 72 150)"/></g>`,
    /* הכרמל של אונסק"ו */
    'unesco-carmel': `${cloud(40, 36)}${cloud(164, 52, .7, 'a-cloud a-cloud2')}${carmel}
      <path d="M0 160 Q60 146 110 158 T200 150 V200 H0z" fill="${N}"/>
      <g transform="translate(100 94)"><circle class="a-ring" r="52" fill="none" stroke="${W}" stroke-width="2" opacity=".4"/><circle r="40" fill="${W}"/><g fill="${T}"><path d="M-24 -14 q10 -10 22 -4 q4 8 -4 14 q-10 2 -12 12 q-10 -6 -6 -22z"/><path d="M6 6 q12 -6 22 2 q-2 14 -14 18 q-8 -8 -8 -20z"/><path d="M8 -30 q10 2 16 12 q-10 2 -16 -12z"/></g>
        <path d="M0 40 q-4 -20 0 -34" stroke="${D}" stroke-width="3" fill="none"/><path d="M0 14 q-14 -2 -18 -16 q16 0 18 16z M0 4 q14 -2 18 -16 q-16 0 -18 16z" fill="${D}"/></g>
      ${cypress(24, 164, 1.3)}${tree(176, 158, 1.2)}<g class="a-note" fill="${W}"><path d="M150 30 q6 -7 12 0 q6 -7 12 0 q-6 -2 -12 4 q-6 -6 -12 -4z"/></g>`,
    /* בית המוח'תאר */
    'mukhtar-house': `${sun(40, 40, 14)}${cloud(150, 40)}${carmel}${ground}
      <rect x="50" y="78" width="100" height="90" fill="${W}"/><path d="M46 78 h108 v-7 h-10 v4 h-9 v-4 h-9 v4 h-9 v-4 h-9 v4 h-9 v-4 h-9 v4 h-9 v-4 h-9 v4 h-9 v-4 h-8z" fill="${W}"/>
      ${arch(60, 90, 14, 24, T)}${arch(93, 90, 14, 24, T)}${arch(126, 90, 14, 24, T)}
      <rect x="54" y="116" width="92" height="5" fill="${L}"/><g stroke="${L}" stroke-width="2.4" fill="none"><path d="M58 121 v10 M70 121 v10 M82 121 v10 M94 121 v10 M106 121 v10 M118 121 v10 M130 121 v10 M142 121 v10 M54 131 h92"/></g>
      ${arch(88, 138, 24, 30)}${win(60, 142, 10, 14, D)}${win(130, 142, 10, 14, D)}
      <g transform="translate(160 132)"><path d="M-10 0 h10" stroke="${W}" stroke-width="2.4" fill="none"/><path d="M-4 0 h8 l2 12 h-12z" fill="${T}" class="a-beat"/></g>
      <g stroke="${N}" stroke-width="1" opacity=".22" fill="none"><path d="M50 150 h36 M114 150 h36 M50 160 h36 M114 160 h36"/></g>${palm(26, 168, .8)}`,
    /* מה מסתתר מתחת לרגליים */
    archaeology: `${sun(160, 34, 12)}<path d="M0 74 Q60 62 110 70 T200 66 V200 H0z" fill="${W}" opacity=".9"/><path d="M0 104 Q60 94 110 102 T200 98 V200 H0z" fill="${L}"/><path d="M0 138 Q60 128 110 136 T200 132 V200 H0z" fill="${D}"/><path d="M0 170 Q60 162 110 168 T200 164 V200 H0z" fill="${N}"/>
      ${tree(30, 60, 1)}${tree(60, 62, .8)}
      <g transform="translate(60 124)"><path d="M-12 -10 q-4 12 0 20 q12 8 24 0 q4 -8 0 -20z" fill="${W}"/><rect x="-9" y="-16" width="18" height="6" rx="2" fill="${W}"/><path d="M-12 -2 q12 5 24 0" stroke="${D}" stroke-width="2" fill="none"/><path d="M-12 -6 q-8 2 -4 10 M12 -6 q8 2 4 10" stroke="${W}" stroke-width="2.4" fill="none"/></g>
      <g transform="translate(138 160)"><rect x="-8" y="-34" width="16" height="34" fill="${W}"/><rect x="-12" y="-40" width="24" height="7" rx="2" fill="${W}"/><rect x="-12" y="-2" width="24" height="6" fill="${W}"/><path d="M-3 -32 v30 M3 -32 v30" stroke="${D}" stroke-width="1.4" opacity=".5" fill="none"/></g>
      <g fill="${W}"><circle cx="100" cy="150" r="5"/><circle cx="176" cy="118" r="4"/><path d="M20 156 l10 -4 l6 8 l-10 5z"/></g>
      <g class="a-hook" transform="translate(112 66) rotate(28)"><rect x="-2" y="-40" width="4" height="40" fill="${N}"/><path d="M-9 0 h18 v10 q-9 12 -18 0z" fill="${W}"/></g>`,
    /* קיץ 1948 */
    'summer-1948': `<path d="M0 0 h200 v200 h-200z" fill="${N}" opacity=".4"/><circle cx="150" cy="46" r="20" fill="${W}" opacity=".9"/><circle cx="141" cy="40" r="18" fill="${D}"/>
      ${star(30, 30)}${star(70, 20, 1.4)}${star(104, 44, 1.3)}${star(46, 62, 1.2)}${star(180, 84, 1.3)}
      <path d="M0 200 V140 Q50 96 110 112 T200 104 V200z" fill="${D}"/>
      <g fill="${N}"><rect x="52" y="112" width="26" height="24"/><rect x="82" y="100" width="22" height="30"/><rect x="108" y="108" width="30" height="24"/><rect x="142" y="98" width="20" height="28"/><path d="M92 100 a6 6 0 0 1 12 0z"/><rect x="150" y="80" width="5" height="18"/></g>
      <g fill="${T}" class="a-beat">${win(58, 120, 4, 6, T)}${win(114, 116, 4, 6, T)}</g>
      <path d="M0 200 V168 Q60 152 110 164 T200 158 V200z" fill="${N}"/>
      <g transform="translate(34 170)"><path d="M0 0 q-3 -14 2 -24" stroke="${W}" stroke-width="4" fill="none"/><g fill="${L}"><ellipse cx="-8" cy="-28" rx="12" ry="8"/><ellipse cx="10" cy="-30" rx="12" ry="9"/><ellipse cx="2" cy="-38" rx="10" ry="7"/></g></g>
      <path d="M100 200 Q96 184 112 176 Q128 168 118 156" stroke="${W}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>`,
    /* עין קדם */
    'ein-kedem': `${sun(42, 36, 12)}<path d="M0 200 V70 Q30 40 70 56 Q110 30 150 54 Q180 44 200 66 V200z" fill="${D}"/><path d="M0 200 V110 Q40 86 80 100 Q120 80 160 98 Q184 92 200 104 V200z" fill="${N}" opacity=".6"/>
      <path d="M72 168 V118 a28 28 0 0 1 56 0 V168z" fill="${N}"/><path d="M66 168 V118 a34 34 0 0 1 68 0 V168 h-6 V118 a28 28 0 0 0 -56 0 V168z" fill="${W}"/>
      <path class="a-flow" d="M100 124 v40" stroke="${T}" stroke-width="5" stroke-dasharray="6 5" fill="none" stroke-linecap="round"/>
      <ellipse cx="100" cy="178" rx="62" ry="14" fill="${T}"/><ellipse class="a-ring" cx="100" cy="178" rx="30" ry="6" fill="none" stroke="${W}" stroke-width="2"/><ellipse cx="100" cy="178" rx="14" ry="3" fill="none" stroke="${W}" stroke-width="1.6"/>
      <g fill="${L}"><ellipse cx="32" cy="168" rx="16" ry="8"/><ellipse cx="170" cy="170" rx="18" ry="8"/></g>
      <g transform="translate(160 150)"><path d="M0 14 q-2 -18 2 -30" stroke="${W}" stroke-width="3" fill="none"/><g fill="${W}"><path d="M2 -16 q-16 -10 -20 6 q12 -6 20 -6z M2 -16 q16 -10 20 6 q-12 -6 -20 -6z M2 -18 q-4 -16 -16 -14 q12 4 16 14z M2 -18 q4 -16 16 -14 q-12 4 -16 14z"/></g></g>`,
    /* המתנ"ס */
    matnas: `${sun(160, 38, 13)}${cloud(48, 36)}${carmel}${ground}
      <rect x="36" y="92" width="128" height="76" fill="${W}"/><path d="M30 92 h140 v-10 q-70 -18 -140 0z" fill="${T}"/>
      <rect x="84" y="126" width="32" height="42" fill="${N}"/><path d="M100 126 v42" stroke="${W}" stroke-width="1.6" fill="none"/>${win(46, 104, 28, 18, D)}${win(126, 104, 28, 18, D)}${win(46, 134, 28, 18, D)}${win(126, 134, 28, 18, D)}
      <g class="a-note"><circle cx="60" cy="113" r="6" fill="${W}"/><path d="M60 108 l3 2 l-1 4 h-4 l-1 -4z" fill="${D}"/></g>
      <g class="a-note a-note2" fill="${W}"><path d="M136 120 v-12 l9 -2 v11 a3 2.5 0 1 1 -2 -2 v-6 l-5 1 v9 a3 2.5 0 1 1 -2 -2z"/></g>
      <g transform="translate(60 143)"><ellipse rx="9" ry="7" fill="${W}"/><circle cx="-4" cy="-2" r="1.8" fill="${T}"/><circle cx="1" cy="-3" r="1.8" fill="${D}"/><circle cx="5" cy="0" r="1.8" fill="${L}"/></g>
      <g transform="translate(140 143)" fill="${W}"><path d="M-8 -5 q8 -5 16 0 v10 q-8 -5 -16 0z"/></g>
      ${person(20, 180, 1)}${person(182, 180, 1, T)}${person(170, 182, .7)}`,
    /* הילד מטירת כרמל שהפך לכוכב רוק */
    'gene-simmons': `<path d="M0 0 h200 v200 h-200z" fill="${N}" opacity=".4"/><path d="M40 0 L0 170 H70z M160 0 L130 170 H200z M100 0 L70 170 H130z" fill="${W}" opacity=".12"/>
      <rect x="0" y="170" width="200" height="30" fill="${N}"/><rect x="0" y="166" width="200" height="5" fill="${W}"/>
      <g class="a-ball" transform="translate(100 104) rotate(-28)"><rect x="-4" y="-78" width="8" height="70" fill="${L}"/><path d="M-9 -92 h18 l-3 16 h-12z" fill="${W}"/><g fill="${T}"><circle cx="-11" cy="-88" r="2.4"/><circle cx="11" cy="-88" r="2.4"/><circle cx="-11" cy="-80" r="2.4"/><circle cx="11" cy="-80" r="2.4"/></g>
        <path d="M0 -12 q-26 -8 -32 14 q-4 16 10 22 q-6 22 22 22 q28 0 22 -22 q14 -6 10 -22 q-6 -22 -32 -14z" fill="${W}"/><circle cx="0" cy="18" r="9" fill="${D}"/><rect x="-10" y="34" width="20" height="5" rx="2" fill="${D}"/>
        <g stroke="${D}" stroke-width=".9" fill="none"><path d="M-2 -76 v112 M0 -76 v112 M2 -76 v112"/></g></g>
      <g class="a-beat" fill="${W}"><path d="M34 44 l4 10 l11 1 l-8 7 l3 11 l-10 -6 l-10 6 l3 -11 l-8 -7 l11 -1z"/></g><g class="a-beat" fill="${T}" style="animation-delay:-.6s"><path d="M168 70 l3 7 l8 1 l-6 5 l2 8 l-7 -4 l-7 4 l2 -8 l-6 -5 l8 -1z"/></g>
      <g class="a-note" fill="${W}"><path d="M150 130 v-18 l11 -3 v16 a4 3.5 0 1 1 -2.4 -3 v-9 l-6.2 1.6 v13 a4 3.5 0 1 1 -2.4 -3z"/></g>`,
    /* כפר הנוער גלים */
    'kfar-galim': `${sun(36, 40, 14)}${cloud(120, 30)}<path d="M0 112 h200 v30 h-200z" fill="${D}" opacity=".5"/>${sea(134, .0)}
      <path d="M0 150 Q60 138 120 146 T200 142 V200 H0z" fill="${N}"/>
      ${house(34, 116, 44, 34, W, T)}${house(88, 108, 54, 42, L, W)}${win(42, 126, 9, 10, D)}${win(60, 126, 9, 10, D)}${win(96, 120, 9, 10, D)}${win(111, 120, 9, 10, D)}${win(126, 120, 9, 10, D)}${arch(108, 134, 12, 16)}
      ${palm(160, 152, .9)}${palm(180, 156, .7)}${tree(20, 148, .9)}
      <g class="a-train" transform="translate(150 120)"><path d="M-12 0 h24 l-4 7 h-16z" fill="${W}"/><path d="M0 -20 v20 M0 -18 l10 14 h-10z" fill="${W}" stroke="${W}" stroke-width="1.4"/></g>
      ${person(70, 178, 1)}${person(84, 178, 1, T)}${person(98, 178, 1)}<g class="a-ball"><circle cx="118" cy="176" r="5" fill="${W}"/></g>`,
    /* חי בר כרמל */
    'hai-bar': `${sun(44, 42, 16)}${cloud(140, 30)}<path d="M0 118 L44 62 L78 104 L112 54 L160 110 L200 84 V200 H0z" fill="${W}" opacity=".22"/>${carmel}
      <path d="M0 162 Q60 150 110 160 T200 154 V200 H0z" fill="${N}"/>
      <g class="a-train" transform="translate(140 52)" fill="${W}"><path d="M0 0 q-22 -16 -44 -6 q16 0 26 12 q-4 4 -2 8 q8 -2 12 -6 q12 2 28 -6 q-12 0 -20 -2z"/></g>
      <g transform="translate(62 146) scale(1.5)" fill="${W}"><path d="M0 0 h22 q5 0 5 5 v4 h-3 v11 h-3 v-11 h-12 v11 h-3 v-11 q-3 -1 -3 -5z"/><path d="M22 2 l6 -12 h5 l2 4 l-5 2 l-3 9z"/><g stroke="${W}" stroke-width="1.5" fill="none" stroke-linecap="round"><path d="M30 -10 l-4 -9 M32 -10 l4 -9 M29 -15 l-5 -1 M33 -15 l5 -1 M28 -18 l-3 -3 M34 -18 l3 -3"/></g><g fill="${T}"><circle cx="6" cy="4" r="1.2"/><circle cx="12" cy="6" r="1.2"/><circle cx="17" cy="3" r="1.2"/></g></g>
      <g transform="translate(140 164)" fill="${L}"><path d="M0 0 h14 q4 0 4 4 v3 h-2 v8 h-2 v-8 h-8 v8 h-2 v-8 q-2 -1 -2 -4z"/><path d="M14 1 l4 -8 h4 l1 3 l-4 1 l-2 6z"/></g>
      ${cypress(22, 156, 1.2)}${tree(184, 152, 1.1)}<g stroke="${W}" stroke-width="2" fill="none" opacity=".8"><path d="M0 186 h200 M10 178 v16 M40 178 v16 M70 178 v16 M100 178 v16 M130 178 v16 M160 178 v16 M190 178 v16"/></g>`,
    /* המטרונית */
    metronit: `${sun(40, 38, 13)}${cloud(150, 34)}${carmel}
      <rect x="0" y="150" width="200" height="50" fill="${N}"/><rect x="0" y="146" width="200" height="5" fill="${L}"/><path class="a-flow" d="M0 184 h200" stroke="${W}" stroke-width="2.4" stroke-dasharray="14 10" fill="none" opacity=".7"/>
      <g transform="translate(150 146)"><rect x="-26" y="-50" width="52" height="5" rx="2" fill="${W}"/><rect x="-22" y="-45" width="3" height="45" fill="${W}"/><rect x="19" y="-45" width="3" height="45" fill="${W}"/><rect x="-16" y="-38" width="32" height="22" rx="2" fill="${T}" opacity=".7"/><rect x="-14" y="-10" width="28" height="4" fill="${W}"/></g>${person(150, 146, .9)}
      <g class="a-train" transform="translate(4 110)"><rect x="0" y="0" width="64" height="44" rx="7" fill="${W}"/><rect x="70" y="0" width="58" height="44" rx="7" fill="${W}"/><g fill="${L}"><rect x="64" y="5" width="6" height="34"/></g><path d="M64 9 v26 M67 9 v26 M70 9 v26" stroke="${D}" stroke-width="1" fill="none"/>
        ${win(6, 8, 14, 16, D)}${win(24, 8, 14, 16, D)}${win(42, 8, 16, 16, D)}${win(76, 8, 14, 16, D)}${win(94, 8, 14, 16, D)}<path d="M112 8 h8 q4 0 4 5 v11 h-12z" fill="${D}"/>
        <rect x="0" y="30" width="128" height="5" fill="${T}"/><g fill="${N}"><circle cx="16" cy="45" r="6"/><circle cx="50" cy="45" r="6"/><circle cx="86" cy="45" r="6"/><circle cx="114" cy="45" r="6"/></g><g fill="${W}"><circle cx="16" cy="45" r="2.4"/><circle cx="50" cy="45" r="2.4"/><circle cx="86" cy="45" r="2.4"/><circle cx="114" cy="45" r="2.4"/></g></g>`,
    /* שכונת החותרים */
    hahotrim: `${sun(160, 36, 13)}${cloud(50, 34)}<path d="M0 104 h200 v18 h-200z" fill="${D}" opacity=".4"/>
      <path d="M0 132 Q60 118 120 126 T200 120 V200 H0z" fill="${D}" opacity=".7"/>
      ${house(20, 104, 34, 30, W, T)}${house(62, 96, 38, 38, L, W)}${house(108, 104, 34, 30, W, T)}${house(150, 98, 34, 36, L, W)}
      ${win(28, 112, 8, 9, D)}${win(40, 112, 8, 9, D)}${win(70, 106, 8, 9, D)}${win(84, 106, 8, 9, D)}${win(116, 112, 8, 9, D)}${win(128, 112, 8, 9, D)}${win(158, 108, 8, 9, D)}${win(170, 108, 8, 9, D)}
      ${sea(150)}
      <g class="a-train" transform="translate(96 166)"><path d="M-44 0 q44 12 88 0 l-8 8 h-72z" fill="${W}"/>${person(-18, 0, .8)}${person(0, 0, .8, T)}${person(18, 0, .8)}<g stroke="${W}" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M-18 -4 l-16 18 M0 -4 l-16 18 M18 -4 l-16 18"/></g></g>`,
    /* מרכז העיר מתחדש */
    'city-renewal': `${sun(36, 38, 13)}${cloud(100, 30, .8)}${carmel}${ground}
      <rect x="14" y="128" width="56" height="40" fill="${L}"/><path d="M14 128 h56 v-5 h-56z" fill="${W}"/>${win(20, 136, 8, 9, D)}${win(33, 136, 8, 9, D)}${win(46, 136, 8, 9, D)}${win(59, 136, 7, 9, D)}${win(20, 152, 8, 9, D)}${win(46, 152, 8, 9, D)}${win(59, 152, 7, 9, D)}
      <path d="M40 124 l-8 -10 M52 124 l6 -12" stroke="${W}" stroke-width="1.6" fill="none" opacity=".7"/>
      <path class="a-beat" d="M78 146 h18 l-6 -7 M96 146 l-6 7" stroke="${W}" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      ${tower(106, 52, 34, 116, W)}<path d="M106 52 h34 l-17 -12z" fill="${T}"/>${tower(146, 84, 26, 84, L)}
      <g stroke="${W}" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M186 168 V60 M186 68 H156 M186 68 h10 M186 60 L164 68"/><path class="a-hook" d="M162 68 v20"/></g><rect class="a-hook" x="156" y="88" width="12" height="9" fill="${T}"/>`,
    /* רוסטם בסטוני */
    bastuni: `${sun(160, 36, 12)}${cloud(46, 36)}${carmel}${ground}
      <rect x="30" y="92" width="140" height="10" fill="${W}"/><rect x="36" y="102" width="128" height="60" fill="${L}"/>
      <g fill="${W}">${[42, 58, 74, 90, 106, 122, 138, 154].map(x => `<rect x="${x}" y="102" width="6" height="60"/>`).join('')}</g><rect x="28" y="160" width="144" height="8" fill="${W}"/>
      <rect x="99" y="62" width="2.4" height="30" fill="${W}"/><path class="a-flag" d="M101.4 64 h22 v15 h-22z" fill="${W}"/><path d="M104 68 h16 M104 75 h16" stroke="${T}" stroke-width="2"/>
      <g transform="translate(100 176)"><path d="M-14 -14 h28 l-4 22 h-20z" fill="${T}"/><rect x="-1.5" y="-28" width="3" height="14" fill="${W}"/><rect x="-4" y="-36" width="8" height="10" rx="4" fill="${W}"/></g>
      <g class="a-note" transform="translate(40 60) rotate(-10)"><rect x="-16" y="-11" width="32" height="22" rx="2" fill="${W}"/><path d="M-12 -6 h14 M-12 -1 h24 M-12 4 h24" stroke="${D}" stroke-width="2" fill="none"/></g>`,
    /* ראובן עטר */
    atar: `${sun(36, 38, 14)}<path d="M0 84 h200 v24 h-200z" fill="${W}" opacity=".18"/><g fill="${W}" opacity=".5">${Array.from({ length: 22 }, (_, i) => `<circle cx="${6 + i * 9}" cy="${90 + (i % 2) * 7}" r="3"/>`).join('')}</g>
      <path d="M0 110 h200 v90 h-200z" fill="${N}"/><g fill="${W}" opacity=".08"><path d="M0 110 h40 l-20 90 h-20z M80 110 h40 l10 90 h-60z M160 110 h40 v90 h-10z"/></g>
      <g transform="translate(84 150)" fill="${W}"><circle cx="0" cy="-44" r="8"/><path d="M-9 -34 h18 l4 26 h-26z"/><path d="M-11 -32 l-16 14 l4 4 l14 -10z M11 -32 l14 -10 l3 5 l-14 12z"/><path d="M-8 -8 l-10 26 l6 2 l10 -22z M4 -8 l20 12 l14 -2 l-2 -6 l-10 0 l-14 -12z"/><path d="M-4 -30 v16" stroke="${D}" stroke-width="2.4" fill="none"/></g>
      <g transform="translate(134 166)"><circle r="10" fill="${W}"/><path d="M0 -4 l4 3 l-1.6 5 h-4.8 l-1.6 -5z" fill="${N}"/></g>
      <g transform="translate(160 76)" class="a-beat"><path d="M-12 -18 h24 v10 q0 14 -12 16 q-12 -2 -12 -16z" fill="${W}"/><path d="M-12 -14 q-9 0 -7 8 q2 6 9 6 M12 -14 q9 0 7 8 q-2 6 -9 6" stroke="${W}" stroke-width="2.6" fill="none"/><rect x="-2" y="8" width="4" height="8" fill="${W}"/><rect x="-9" y="16" width="18" height="5" rx="2" fill="${W}"/><path d="M0 -13 l2 4 h4 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 h4z" fill="${T}"/></g>`,
    /* החוף העירוני שבדרך */
    'beach-plan': `${sun(150, 56, 20)}${cloud(46, 36)}<path d="M0 104 h200 v96 h-200z" fill="${D}" opacity=".5"/>${sea(118)}
      <path d="M0 164 Q80 150 200 160 V200 H0z" fill="${L}"/><path d="M0 178 h200 v22 h-200z" fill="${W}"/><g stroke="${D}" stroke-width="1" opacity=".3" fill="none"><path d="M0 186 h200 M30 178 v22 M70 178 v22 M110 178 v22 M150 178 v22 M190 178 v22"/></g>
      ${lamp(24, 178, 44)}${lamp(104, 178, 44)}${lamp(176, 178, 44)}${palm(60, 178, .9)}${palm(140, 178, .8)}
      <g transform="translate(84 160)"><rect x="-1.4" y="-26" width="2.8" height="28" fill="${N}"/><path d="M0 -30 q-20 2 -23 13 h46 q-3 -11 -23 -13z" fill="${W}"/></g>
      <g transform="translate(124 174)" fill="${N}"><rect x="-12" y="-6" width="24" height="3"/><rect x="-10" y="-3" width="2.4" height="7"/><rect x="8" y="-3" width="2.4" height="7"/><rect x="-12" y="-13" width="24" height="3"/></g>${person(40, 176, .9, T)}${person(160, 176, .8)}`,
    /* ויצמן־ז'בוטינסקי: שבעה מגדלים */
    'weizmann-towers': `${sun(30, 34, 12)}${cloud(150, 26, .8)}
      ${tower(8, 74, 22, 76, L)}${tower(34, 54, 22, 96, W)}${tower(60, 66, 22, 84, L)}${tower(86, 40, 24, 110, W)}${tower(114, 62, 22, 88, L)}${tower(140, 50, 22, 100, W)}${tower(166, 72, 22, 78, L)}
      <g fill="${T}"><path d="M34 54 h22 l-11 -8z M86 40 h24 l-12 -9z M140 50 h22 l-11 -8z"/></g>
      <rect x="0" y="150" width="200" height="50" fill="${N}"/><rect x="0" y="146" width="200" height="5" fill="${W}"/>${tree(20, 144, .6)}${tree(74, 144, .6)}${tree(128, 144, .6)}${tree(184, 144, .6)}
      <rect x="0" y="162" width="200" height="30" fill="${D}"/><path class="a-flow" d="M0 190 h200" stroke="${T}" stroke-width="2" stroke-dasharray="8 6" fill="none"/>
      <g class="a-train" transform="translate(30 166)"><rect x="0" y="0" width="120" height="20" rx="9" fill="${W}"/>${win(8, 5, 14, 8, D)}${win(28, 5, 14, 8, D)}${win(48, 5, 14, 8, D)}${win(68, 5, 14, 8, D)}${win(88, 5, 20, 8, D)}<rect x="0" y="15" width="120" height="2.4" fill="${T}"/></g>
      <g transform="translate(174 158)"><circle r="11" fill="${W}"/><path d="M-6 5 v-10 l6 7 l6 -7 v10" stroke="${D}" stroke-width="2.6" fill="none" stroke-linejoin="round"/></g>`,
    /* רחוב הרצל */
    'herzl-street': `${sun(100, 70, 18)}${cloud(40, 34)}${cloud(164, 40, .7, 'a-cloud a-cloud2')}
      <path d="M0 200 V60 L74 108 V200z" fill="${W}"/><path d="M200 200 V52 L126 108 V200z" fill="${L}"/>
      <g fill="${D}"><path d="M10 84 l22 12 v16 l-22 -10z M40 100 l22 11 v14 l-22 -9z M190 78 l-22 14 v16 l22 -12z M160 98 l-22 12 v14 l22 -10z"/></g>
      <g class="a-flag"><path d="M4 124 l64 18 v10 l-64 -12z" fill="${T}"/><path d="M196 122 l-64 20 v10 l64 -14z" fill="${W}"/></g>
      <path d="M12 142 l18 5 v40 l-18 6z M40 150 l22 6 v26 l-22 6z M188 140 l-18 6 v40 l18 7z M160 150 l-22 6 v26 l22 6z" fill="${N}" opacity=".85"/>
      <path d="M74 200 L96 112 h8 L126 200z" fill="${N}"/><path class="a-flow" d="M100 118 V200" stroke="${W}" stroke-width="2.4" stroke-dasharray="9 8" fill="none"/>
      ${lamp(70, 190, 46)}<g transform="translate(130 190) scale(-1 1)">${lamp(0, 0, 46)}</g>${tree(84, 138, .6)}${tree(116, 138, .6)}${person(64, 196, .9, D)}${person(140, 196, .9, D)}`
  };
  SCENES.live = SCENES.news;
  const svg = (cat, id) => `<svg class="cover__art" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${(id && EP[id]) || SCENES[cat] || SCENES.city}</svg>`;
  window.PodArt = { svg, has: c => !!SCENES[c], hasEp: id => !!EP[id], topics: Object.keys(SCENES), episodes: Object.keys(EP) };
})();
