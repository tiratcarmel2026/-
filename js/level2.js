/* ============================================================
 * level2.js — שלב 2: מיון מיחזור (Sort the Recycling)
 * ------------------------------------------------------------
 * One item appears in the middle. The child DRAGS it into one of
 * two labelled bins:
 *    • "זכוכית ובקבוקים"  (glass & bottles)
 *    • "אשפה רגילה"        (regular trash)
 * Correct  → happy sound + points + next item.
 * Wrong    → gentle buzz, the item bounces back, and Nicky gives
 *            a short spoken hint. No harsh fail state.
 *
 * Win = all items sorted. Stars by accuracy (fewer mistakes).
 * Works with both touch and mouse (Pointer Events).
 * ============================================================ */
(function () {
  'use strict';

  // type: 'glass' goes to the recycling bin, 'trash' to regular.
  const ITEMS = [
    { emoji: '🍾', type: 'glass', name: 'בקבוק' },
    { emoji: '🫙', type: 'glass', name: 'צנצנת' },
    { emoji: '🍷', type: 'glass', name: 'כוס זכוכית' },
    { emoji: '🍌', type: 'trash', name: 'קליפת בננה' },
    { emoji: '🛍️', type: 'trash', name: 'שקית' },
    { emoji: '🥤', type: 'trash', name: 'כוס חד-פעמית' },
    { emoji: '🍶', type: 'glass', name: 'בקבוק זכוכית' },
    { emoji: '🍎', type: 'trash', name: 'שאריות אוכל' }
  ];

  const HINTS = {
    glass: 'זכוכית הולכת לפח הזכוכית!',
    trash: 'זה הולך לפח האשפה הרגילה.'
  };

  let state = null;

  function start(api, finish) {
    const stage = api.stage;
    stage.className = 'stage stage--sort';
    stage.innerHTML = `
      <div class="sort-top">
        <div class="sprite-mini">${Nicky.html({ pose: 'idle', cls: 'nicky--mini' })}</div>
        <div class="bubble bubble--small"><p class="bubble__text" id="sortHint">גררו כל פריט לפח הנכון 👇</p></div>
      </div>
      <div class="sort-itemzone" id="itemZone"></div>
      <div class="bins">
        <div class="dropbin" data-type="glass">
          <div class="dropbin__icon">♻️</div>
          <div class="dropbin__label">זכוכית ובקבוקים</div>
        </div>
        <div class="dropbin" data-type="trash">
          <div class="dropbin__icon">🗑️</div>
          <div class="dropbin__label">אשפה רגילה</div>
        </div>
      </div>`;

    // Shuffle the items for variety.
    const queue = ITEMS.slice().sort(() => Math.random() - 0.5);
    state = { queue, index: 0, mistakes: 0, total: queue.length, current: null, api, finish };

    nextItem();
  }

  function nextItem() {
    const { api } = state;
    if (state.index >= state.total) return win();
    const data = state.queue[state.index];
    const zone = api.stage.querySelector('#itemZone');

    const el = document.createElement('div');
    el.className = 'dragitem';
    el.textContent = data.emoji;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', data.name);
    zone.innerHTML = '';
    zone.appendChild(el);
    state.current = { el, data };

    api.setProgress(state.index / state.total);
    makeDraggable(el, data);
  }

  function makeDraggable(el, data) {
    const { api } = state;
    let dragging = false, startX = 0, startY = 0, homeX = 0, homeY = 0;

    function down(e) {
      if (api.isPaused()) return;
      dragging = true;
      el.setPointerCapture(e.pointerId);
      el.classList.add('dragitem--drag');
      const r = el.getBoundingClientRect();
      homeX = r.left; homeY = r.top;
      startX = e.clientX; startY = e.clientY;
    }
    function move(e) {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      el.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;
      highlightBinUnder(e.clientX, e.clientY);
    }
    function up(e) {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragitem--drag');
      clearBinHighlight();
      const bin = binUnder(e.clientX, e.clientY);
      if (bin) {
        if (bin.dataset.type === data.type) return drop(el, bin, true);
        return drop(el, bin, false);
      }
      // released in empty space → snap home
      el.style.transform = '';
    }

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  function binUnder(x, y) {
    return document.elementsFromPoint(x, y).find(n => n.classList && n.classList.contains('dropbin')) || null;
  }
  function highlightBinUnder(x, y) {
    clearBinHighlight();
    const b = binUnder(x, y);
    if (b) b.classList.add('dropbin--over');
  }
  function clearBinHighlight() {
    document.querySelectorAll('.dropbin--over').forEach(b => b.classList.remove('dropbin--over'));
  }

  function drop(el, bin, correct) {
    const { api } = state;
    if (correct) {
      api.sfx('correct');
      bin.classList.remove('dropbin--happy'); void bin.offsetWidth; bin.classList.add('dropbin--happy');
      el.classList.add('dragitem--into');
      api.addScore(10);
      api.confetti(14);
      state.index++;
      setTimeout(nextItem, 450);
    } else {
      // gentle, encouraging correction
      api.sfx('wrong');
      state.mistakes++;
      bin.classList.remove('dropbin--nope'); void bin.offsetWidth; bin.classList.add('dropbin--nope');
      const hint = HINTS[state.current.data.type];
      const hintEl = api.stage.querySelector('#sortHint');
      if (hintEl) hintEl.textContent = hint;
      api.speak(hint);
      el.classList.add('dragitem--bounce');
      el.style.transform = '';
      setTimeout(() => el.classList.remove('dragitem--bounce'), 500);
    }
  }

  function win() {
    const { api, finish } = state;
    api.setProgress(1);
    const stars = state.mistakes === 0 ? 3 : state.mistakes <= 2 ? 2 : 1;
    finish(stars);
  }

  function stop() { state = null; }

  window.Levels = window.Levels || {};
  window.Levels[2] = { start, stop };
})();
