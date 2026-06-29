/* ============================================================
 * level3.js — שלב 3: אוספים אחרי הכלב (Clean Up After the Dog)
 * ------------------------------------------------------------
 * A cute dog walks across the park and leaves little "presents"
 * on the grass. Nicky has a bag/scooper:
 *    1. Tap a poop  → it goes into Nicky's bag (counter goes up).
 *    2. Tap the bin → empty the bag into the bin (you score).
 * Teaches the responsible 2-step routine: pick up, then bin it.
 *
 * Win = every poop collected AND the bag emptied into the bin.
 * Stars by speed (the park gets clean quickly = more stars).
 * ============================================================ */
(function () {
  'use strict';

  const TOTAL = 6;
  const DROP_EVERY = 1700; // ms between the dog's "presents"

  let state = null;

  function start(api, finish) {
    const stage = api.stage;
    stage.className = 'stage stage--park';
    stage.innerHTML = `
      <div class="park-sky"></div>
      <div class="park-grass"></div>
      <div class="bin bin--green bin--park" id="parkBin">
        <div class="bin__lid"></div>
        <div class="bin__body">🗑️</div>
        <div class="bin__count" id="binCount" hidden>0</div>
      </div>
      <div class="dog" id="dog">🐶</div>
      <div class="bag-indicator" id="bagInd">👜 בשקית: <b id="bagCount">0</b></div>
      <div class="level-hint">👆 לחצו על הקקי, ואז לחצו על הפח כדי לזרוק!</div>`;

    state = {
      api, finish,
      dropped: 0, collected: 0, deposited: 0,
      bag: 0,
      dogX: 10, dogDir: 1,
      raf: null, dropTimer: null,
      startTime: Date.now(), finished: false
    };

    const dog = stage.querySelector('#dog');
    const bin = stage.querySelector('#parkBin');
    bin.addEventListener('click', () => depositBag(api));

    // Dog wanders back and forth across the park.
    function walk() {
      if (!state || state.finished) return;
      if (!api.isPaused()) {
        state.dogX += state.dogDir * 0.35;
        if (state.dogX > 86) { state.dogDir = -1; dog.classList.add('dog--flip'); }
        if (state.dogX < 8)  { state.dogDir = 1;  dog.classList.remove('dog--flip'); }
        dog.style.left = state.dogX + '%';
      }
      state.raf = requestAnimationFrame(walk);
    }
    state.raf = requestAnimationFrame(walk);

    // Drop the presents one at a time.
    state.dropTimer = setInterval(() => {
      if (api.isPaused() || !state) return;
      if (state.dropped >= TOTAL) { clearInterval(state.dropTimer); state.dropTimer = null; return; }
      dropPoop(api, state.dogX);
      state.dropped++;
    }, DROP_EVERY);

    // drop the first one quickly so kids see what to do
    setTimeout(() => { if (state) { dropPoop(api, state.dogX); state.dropped++; } }, 600);
  }

  function dropPoop(api, xPercent) {
    const stage = api.stage;
    const poop = document.createElement('button');
    poop.className = 'poop';
    poop.textContent = '💩';
    poop.setAttribute('aria-label', 'קקי');
    poop.style.left = Math.max(6, Math.min(90, xPercent + (Math.random() * 8 - 4))) + '%';
    poop.style.bottom = (8 + Math.random() * 22) + '%';
    poop.addEventListener('click', () => pickUp(poop, api));
    stage.appendChild(poop);
    poop.classList.add('poop--drop');
  }

  function pickUp(poop, api) {
    if (api.isPaused() || poop.classList.contains('poop--gone')) return;
    poop.classList.add('poop--gone');
    api.sfx('collect');
    setTimeout(() => poop.remove(), 250);
    state.collected++;
    state.bag++;
    updateBag(api);
  }

  function depositBag(api) {
    if (api.isPaused()) return;
    if (state.bag <= 0) {
      // nothing to throw yet — gentle nudge
      api.sfx('tap');
      return;
    }
    const bin = api.stage.querySelector('#parkBin');
    bin.classList.remove('bin--bounce'); void bin.offsetWidth; bin.classList.add('bin--bounce');
    api.sfx('correct');
    api.addScore(state.bag * 10);
    api.confetti(12);
    state.deposited += state.bag;
    state.bag = 0;
    updateBag(api);
    checkWin(api);
  }

  function updateBag(api) {
    const bagEl = api.stage.querySelector('#bagCount');
    if (bagEl) bagEl.textContent = state.bag;
    const ind = api.stage.querySelector('#bagInd');
    if (ind) { ind.classList.remove('bag-indicator--pulse'); void ind.offsetWidth; ind.classList.add('bag-indicator--pulse'); }
    api.setProgress(state.deposited / TOTAL);
  }

  function checkWin(api) {
    if (state.finished) return;
    if (state.dropped >= TOTAL && state.deposited >= TOTAL && state.bag === 0) {
      state.finished = true;
      const secs = (Date.now() - state.startTime) / 1000;
      const stars = secs < 22 ? 3 : secs < 38 ? 2 : 1;
      const hint = api.stage.querySelector('.level-hint');
      if (hint) { hint.textContent = '🎉 הגינה נקייה! אוספים אחרי הכלב!'; hint.classList.add('level-hint--win'); }
      api.confetti(40);
      setTimeout(() => state && state.finish(stars), 1200);
    }
  }

  function stop() {
    if (!state) return;
    if (state.raf) cancelAnimationFrame(state.raf);
    if (state.dropTimer) clearInterval(state.dropTimer);
    state = null;
  }

  window.Levels = window.Levels || {};
  window.Levels[3] = { start, stop };
})();
