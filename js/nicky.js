/* ============================================================
 * nicky.js — דמות ניקי (Nicky the puppet) as a reusable SVG
 * ------------------------------------------------------------
 * Nicky is the star of the game: orange-haired puppet with blue
 * denim overalls and lime-green sneakers (see reference art).
 *
 * This file draws Nicky with plain SVG shapes so the game runs
 * immediately with no external image files.
 *
 * 👉 TO USE THE REAL ARTWORK LATER:
 *    Drop a file at  assets/nicky.png  (or .svg) and set
 *    window.NICKY_IMAGE = 'assets/nicky.png'  before the game
 *    loads. Any call to Nicky.html() will then use the real
 *    picture instead of the placeholder SVG below.
 * ============================================================ */
(function () {
  'use strict';

  // Brand colours (Tirat Carmel)
  const C = {
    fur:    '#E0A24B',   // golden fur body
    furDk:  '#C98A36',
    hair:   '#F4631E',   // bright orange hair
    hairDk: '#D8500F',
    bow:    '#22A7E0',   // blue felt bows
    denim:  '#7FA8CF',   // light denim overalls
    denimDk:'#5E86AD',
    shoe:   '#9CCB2C',   // lime sneaker
    shoeOr: '#F4631E',   // orange sole/laces
    eye:    '#1B6FB0',
    mouth:  '#7A1F3D',
    tongue: '#E8557A',
    skin:   '#E8B96B'
  };

  /**
   * Returns an <svg> string of Nicky.
   * @param {Object} opts
   *   opts.pose  - 'wave' | 'idle' | 'cheer'  (controls arm position class)
   *   opts.id    - optional element id
   *   opts.cls   - optional extra css classes
   */
  function svg(opts) {
    opts = opts || {};
    const pose = opts.pose || 'idle';
    const id = opts.id ? `id="${opts.id}"` : '';
    const cls = `nicky nicky--${pose} ${opts.cls || ''}`;

    return `
<svg ${id} class="${cls}" viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-label="ניקי הבובה">
  <!-- ===== Hair (back) ===== -->
  <g class="nicky-hair">
    <path d="M40 120 q-30 30 -18 90 q22 -10 40 -28 q-18 -28 -22 -62z" fill="${C.hairDk}"/>
    <path d="M180 120 q30 30 18 90 q-22 -10 -40 -28 q18 -28 22 -62z" fill="${C.hairDk}"/>
    <path d="M52 90 q-44 18 -34 86 q26 -8 48 -30 q-12 -30 -14 -56z" fill="${C.hair}"/>
    <path d="M168 90 q44 18 34 86 q-26 -8 -48 -30 q12 -30 14 -56z" fill="${C.hair}"/>
  </g>

  <!-- ===== Bows ===== -->
  <g class="nicky-bow">
    <path d="M58 78 l18 -16 l4 20 z" fill="${C.bow}"/>
    <path d="M162 78 l-18 -16 l-4 20 z" fill="${C.bow}"/>
  </g>

  <!-- ===== Body / fur torso ===== -->
  <ellipse cx="110" cy="225" rx="62" ry="78" fill="${C.fur}"/>

  <!-- ===== Arms ===== -->
  <g class="nicky-arm nicky-arm--left">
    <path d="M58 185 q-34 18 -40 64 q14 6 26 -2 q12 -34 30 -44z" fill="${C.fur}"/>
    <ellipse cx="22" cy="250" rx="11" ry="12" fill="${C.furDk}"/>
  </g>
  <g class="nicky-arm nicky-arm--right">
    <path d="M162 185 q34 18 40 64 q-14 6 -26 -2 q-12 -34 -30 -44z" fill="${C.fur}"/>
    <ellipse cx="198" cy="250" rx="11" ry="12" fill="${C.furDk}"/>
  </g>

  <!-- ===== Legs + sneakers ===== -->
  <g>
    <rect x="78" y="278" width="24" height="34" rx="11" fill="${C.fur}"/>
    <rect x="118" y="278" width="24" height="34" rx="11" fill="${C.fur}"/>
    <g class="nicky-shoe">
      <ellipse cx="86" cy="312" rx="22" ry="11" fill="${C.shoe}"/>
      <ellipse cx="86" cy="316" rx="22" ry="7" fill="${C.shoeOr}"/>
      <path d="M74 308 l24 0 M76 312 l20 0" stroke="${C.shoeOr}" stroke-width="2"/>
    </g>
    <g class="nicky-shoe">
      <ellipse cx="134" cy="312" rx="22" ry="11" fill="${C.shoe}"/>
      <ellipse cx="134" cy="316" rx="22" ry="7" fill="${C.shoeOr}"/>
      <path d="M122 308 l24 0 M124 312 l20 0" stroke="${C.shoeOr}" stroke-width="2"/>
    </g>
  </g>

  <!-- ===== Denim overalls ===== -->
  <g>
    <path d="M74 200 h72 v66 q0 14 -14 14 h-44 q-14 0 -14 -14z" fill="${C.denim}"/>
    <rect x="86" y="216" width="48" height="34" rx="6" fill="${C.denimDk}" opacity="0.5"/>
    <path d="M82 196 l14 -28 l10 6 l-12 26z" fill="${C.denim}"/>
    <path d="M138 196 l-14 -28 l-10 6 l12 26z" fill="${C.denim}"/>
    <circle cx="92" cy="172" r="4" fill="${C.shoeOr}"/>
    <circle cx="128" cy="172" r="4" fill="${C.shoeOr}"/>
  </g>

  <!-- ===== Head ===== -->
  <ellipse cx="110" cy="120" rx="66" ry="60" fill="${C.fur}"/>
  <!-- cheeks -->
  <circle cx="62" cy="132" r="13" fill="${C.skin}"/>
  <circle cx="158" cy="132" r="13" fill="${C.skin}"/>

  <!-- ===== Eyes ===== -->
  <g>
    <circle cx="92" cy="108" r="20" fill="#fff" stroke="#F0B98A" stroke-width="3"/>
    <circle cx="128" cy="108" r="20" fill="#fff" stroke="#F0B98A" stroke-width="3"/>
    <circle cx="96" cy="110" r="10" fill="${C.eye}"/>
    <circle cx="124" cy="110" r="10" fill="${C.eye}"/>
    <circle cx="99" cy="107" r="3.4" fill="#fff"/>
    <circle cx="127" cy="107" r="3.4" fill="#fff"/>
  </g>

  <!-- ===== Nose ===== -->
  <ellipse cx="110" cy="128" rx="11" ry="9" fill="${C.furDk}"/>

  <!-- ===== Big happy mouth ===== -->
  <g>
    <path d="M82 142 q28 34 56 0 q-28 14 -56 0z" fill="${C.mouth}"/>
    <ellipse cx="110" cy="150" rx="13" ry="8" fill="${C.tongue}"/>
  </g>
</svg>`;
  }

  /**
   * Returns either the real image (if window.NICKY_IMAGE is set)
   * or the placeholder SVG, wrapped so styling is consistent.
   */
  function html(opts) {
    if (window.NICKY_IMAGE) {
      const pose = (opts && opts.pose) || 'idle';
      const cls = (opts && opts.cls) || '';
      return `<img class="nicky nicky--${pose} ${cls}" src="${window.NICKY_IMAGE}" alt="ניקי הבובה">`;
    }
    return svg(opts);
  }

  window.Nicky = { svg, html };
})();
