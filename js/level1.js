/* ============================================================
 * level1.js — שלב 1: פינוי אשפה (Collect the Trash)
 * ------------------------------------------------------------
 * Nicky stands on a street. Litter is scattered on the ground.
 * The child taps each piece of litter; it flies into the green
 * bin and the street gets cleaner. Move Nicky with the on-screen
 * arrows or the keyboard for fun (collection is tap-based so it
 * stays easy for ages 4–8).
 *
 * Win = all litter collected. Stars by how fast the street is clean.
 * ============================================================ */
(function () {
  'use strict';

  const TRASH = ['📄', '🥤', '🥫', '📰', '🧃', '🍬', '🗞️', '🧴'];
  const TOTAL = 8;

  let state = null;

  function start(api, finish) {
    const stage = api.stage;
    stage.className = 'stage stage--street';
    stage.innerHTML = `
      <div class="street-sky"></div>
      <div class="street-road"></div>
      <div class="bin bin--green" id="binTarget">
        <div class="bin__lid"></div>
        <div class="bin__body">♻️</div>
      </div>
      <div class="sprite nicky-sprite" id="nickyS">${Nicky.html({ pose: 'idle', cls: 'nicky--game' })}</div>
      <div class="move-controls">
        <button class="move-btn" data-dir="-1" aria-label="שמאלה">⬅️</button>
        <button class="move-btn" data-dir="1" aria-label="ימינה">➡️</button>
      </div>
      <div class="level-hint">👆 לחצו על הלכלוך כדי לזרוק אותו לפח!</div>`;

    const nicky = stage.querySelector('#nickyS');

    state = { collected: 0, startTime: Date.now(), nickyX: 50, raf: null, finished: false, items: [] };

    // Scatter litter across the lower part of the stage.
    for (let i = 0; i < TOTAL; i++) {
      const item = document.createElement('button');
      item.className = 'litter';
      item.textContent = TRASH[i % TRASH.length];
      item.style.left = (8 + Math.random() * 80) + '%';
      item.style.bottom = (14 + Math.random() * 26) + '%';
      item.setAttribute('aria-label', 'לכלוך');
      item.addEventListener('click', () => collect(item, api, finish));
      stage.appendChild(item);
      state.items.push(item);
    }

    positionNicky(nicky);

    // ---- Movement (buttons held + keyboard) ----
    let moveDir = 0;
    function step() {
      if (!state || state.finished) return;
      if (!api.isPaused() && moveDir !== 0) {
        state.nickyX = Math.max(6, Math.min(94, state.nickyX + moveDir * 0.8));
        positionNicky(nicky);
      }
      state.raf = requestAnimationFrame(step);
    }
    state.raf = requestAnimationFrame(step);

    stage.querySelectorAll('.move-btn').forEach(btn => {
      const dir = parseInt(btn.dataset.dir, 10);
      const on = () => { moveDir = dir; nicky.classList.add('nicky-sprite--walk'); };
      const off = () => { moveDir = 0; nicky.classList.remove('nicky-sprite--walk'); };
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); on(); });
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointerleave', off);
      btn.addEventListener('pointercancel', off);
    });
    state.keyHandler = (e) => {
      if (e.key === 'ArrowLeft') { moveDir = -1; }
      else if (e.key === 'ArrowRight') { moveDir = 1; }
    };
    state.keyUp = () => { moveDir = 0; };
    document.addEventListener('keydown', state.keyHandler);
    document.addEventListener('keyup', state.keyUp);

    function positionNicky(el) { el.style.left = state.nickyX + '%'; }
  }

  function collect(item, api, finish) {
    if (api.isPaused() || item.classList.contains('litter--gone')) return;
    item.classList.add('litter--gone');
    api.sfx('collect');

    // Fly the litter toward the bin.
    const stage = api.stage;
    const bin = stage.querySelector('#binTarget');
    const sr = stage.getBoundingClientRect();
    const ir = item.getBoundingClientRect();
    const br = bin.getBoundingClientRect();
    const dx = (br.left + br.width / 2) - (ir.left + ir.width / 2);
    const dy = (br.top + br.height / 2) - (ir.top + ir.height / 2);
    item.style.setProperty('--dx', dx + 'px');
    item.style.setProperty('--dy', dy + 'px');
    item.classList.add('litter--fly');

    bin.classList.remove('bin--bounce'); void bin.offsetWidth; bin.classList.add('bin--bounce');

    setTimeout(() => item.remove(), 600);

    state.collected++;
    api.addScore(10);
    api.setProgress(state.collected / TOTAL);

    if (state.collected >= TOTAL && !state.finished) {
      state.finished = true;
      const secs = (Date.now() - state.startTime) / 1000;
      const stars = secs < 18 ? 3 : secs < 30 ? 2 : 1;
      // little celebration on the clean street
      api.confetti(40);
      const hint = stage.querySelector('.level-hint');
      if (hint) { hint.textContent = '🎉 הרחוב נקי! כל הכבוד!'; hint.classList.add('level-hint--win'); }
      const nicky = stage.querySelector('#nickyS');
      if (nicky) nicky.classList.add('nicky-sprite--cheer');
      setTimeout(() => finish(stars), 1200);
    }
  }

  function stop() {
    if (!state) return;
    if (state.raf) cancelAnimationFrame(state.raf);
    if (state.keyHandler) document.removeEventListener('keydown', state.keyHandler);
    if (state.keyUp) document.removeEventListener('keyup', state.keyUp);
    state = null;
  }

  window.Levels = window.Levels || {};
  window.Levels[1] = { start, stop };
})();
