/* ============================================================
 * game.js — core engine
 * ------------------------------------------------------------
 * Responsibilities:
 *   - Screen navigation (menu / intro / play / win)
 *   - Persistent stars + best score (localStorage)
 *   - Shared HUD (pause, mute, music buttons)
 *   - Tip "speech bubbles" with a read-aloud speaker button
 *   - Confetti + star award helpers used by every level
 *
 * Each level registers itself on  window.Levels[n]  with:
 *   { title, tip, start(stage, finish), stop() }
 * where finish(starsEarned) is called when the level is won.
 * ============================================================ */
(function () {
  'use strict';

  const STORAGE_KEY = 'nicky_clean_progress_v1';

  // ---- Level metadata (definitions live in level1/2/3.js) ----
  const LEVEL_INFO = [
    null,
    { n: 1, name: 'פינוי אשפה',     emoji: '🧹', tip: 'כל אחד יכול לעזור לשמור על העיר נקייה!' },
    { n: 2, name: 'מיון מיחזור',    emoji: '♻️', tip: 'זכוכית ובקבוקים הולכים לפח המיחזור.' },
    { n: 3, name: 'אוספים אחרי הכלב', emoji: '🐶', tip: 'תמיד אוספים את הקקי של הכלב וזורקים לפח.' }
  ];

  // ---- Persistent progress ----
  function loadProgress() {
    try {
      const p = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (p && p.stars) return p;
    } catch (e) {}
    return { stars: { 1: 0, 2: 0, 3: 0 }, totalStars: 0 };
  }
  function saveProgress(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) {}
  }
  function recordStars(level, earned) {
    const p = loadProgress();
    if (earned > (p.stars[level] || 0)) p.stars[level] = earned; // keep best
    p.totalStars = (p.stars[1] || 0) + (p.stars[2] || 0) + (p.stars[3] || 0);
    saveProgress(p);
    return p;
  }

  // ---- DOM helpers ----
  const $ = (sel) => document.querySelector(sel);
  const screens = {};
  let currentLevel = null;

  function show(name) {
    Object.values(screens).forEach(s => s.classList.remove('screen--active'));
    if (screens[name]) screens[name].classList.add('screen--active');
  }

  function starsHtml(count) {
    let s = '';
    for (let i = 0; i < 3; i++) s += `<span class="star ${i < count ? 'star--on' : ''}">★</span>`;
    return s;
  }

  // =========================================================
  // MAIN MENU
  // =========================================================
  function renderMenu() {
    const p = loadProgress();
    screens.menu.innerHTML = `
      <div class="menu">
        <div class="menu__nicky">${Nicky.html({ pose: 'wave' })}</div>
        <h1 class="menu__title">ניקי שומרת על הניקיון</h1>
        <p class="menu__subtitle">משחק לילדים של עיריית טירת כרמל 🌿</p>
        <div class="menu__total">⭐ סך הכל כוכבים: <b>${p.totalStars}</b> / 9</div>
        <div class="menu__levels">
          ${[1, 2, 3].map(n => {
            const info = LEVEL_INFO[n];
            return `
            <button class="levelcard" data-level="${n}">
              <span class="levelcard__emoji">${info.emoji}</span>
              <span class="levelcard__name">שלב ${n} — ${info.name}</span>
              <span class="levelcard__stars">${starsHtml(p.stars[n] || 0)}</span>
            </button>`;
          }).join('')}
        </div>
        <p class="menu__hint">בחרו שלב כדי להתחיל לשחק 👆</p>
      </div>`;
    screens.menu.querySelectorAll('.levelcard').forEach(btn => {
      btn.addEventListener('click', () => {
        Audio.sfx('tap');
        startIntro(parseInt(btn.dataset.level, 10));
      });
    });
  }

  // =========================================================
  // LEVEL INTRO (tip bubble + speaker)
  // =========================================================
  function startIntro(level) {
    const info = LEVEL_INFO[level];
    screens.intro.innerHTML = `
      <div class="intro">
        <button class="btn-back" aria-label="חזרה לתפריט">⟶ תפריט</button>
        <div class="intro__nicky">${Nicky.html({ pose: 'idle' })}</div>
        <div class="bubble">
          <p class="bubble__text">${info.tip}</p>
          <button class="bubble__speak" aria-label="הקראה">🔊 הקריאו לי</button>
        </div>
        <h2 class="intro__title">${info.emoji} שלב ${level}: ${info.name}</h2>
        <button class="btn-big btn-start">בואו נתחיל! ▶</button>
      </div>`;
    show('intro');
    Audio.speak(info.tip);

    screens.intro.querySelector('.btn-back').addEventListener('click', goMenu);
    screens.intro.querySelector('.bubble__speak').addEventListener('click', () => {
      Audio.sfx('tap'); Audio.speak(info.tip);
    });
    screens.intro.querySelector('.btn-start').addEventListener('click', () => {
      Audio.sfx('tap'); playLevel(level);
    });
  }

  // =========================================================
  // PLAY SCREEN — hosts the active level
  // =========================================================
  function buildHud(level) {
    return `
      <div class="hud">
        <button class="hud__btn" data-act="menu" aria-label="תפריט">🏠</button>
        <button class="hud__btn" data-act="pause" aria-label="השהיה">⏸️</button>
        <div class="hud__title">שלב ${level}: ${LEVEL_INFO[level].name}</div>
        <button class="hud__btn" data-act="music" aria-label="מוזיקה">${Audio.isMusicOn() ? '🎵' : '🔇'}</button>
        <button class="hud__btn" data-act="mute" aria-label="קול">${Audio.isMuted() ? '🔕' : '🔔'}</button>
      </div>
      <div class="scorebar">
        <div class="scorebar__score">ניקוד: <b id="score">0</b></div>
        <div class="progress"><div class="progress__fill" id="progressFill"></div></div>
      </div>`;
  }

  let paused = false;
  function playLevel(level) {
    const mod = window.Levels && window.Levels[level];
    if (!mod) { goMenu(); return; }
    currentLevel = mod;
    paused = false;

    screens.play.innerHTML = `
      ${buildHud(level)}
      <div class="stage" id="stage"></div>
      <div class="pause-overlay" id="pauseOverlay" hidden>
        <div class="pause-card">
          <h2>הפסקה ⏸️</h2>
          <button class="btn-big" data-act="resume">המשך ▶</button>
          <button class="btn-secondary" data-act="restart">מהתחלה ↻</button>
          <button class="btn-secondary" data-act="menu">תפריט 🏠</button>
        </div>
      </div>`;
    show('play');

    // HUD wiring
    screens.play.querySelectorAll('.hud__btn').forEach(b => {
      b.addEventListener('click', () => handleHud(b.dataset.act, level, b));
    });
    const overlay = $('#pauseOverlay');
    overlay.querySelector('[data-act="resume"]').addEventListener('click', () => togglePause(level));
    overlay.querySelector('[data-act="restart"]').addEventListener('click', () => { stopLevel(); playLevel(level); });
    overlay.querySelector('[data-act="menu"]').addEventListener('click', goMenu);

    const stage = $('#stage');
    const api = {
      stage,
      addScore,
      setProgress,
      isPaused: () => paused,
      confetti,
      sfx: Audio.sfx,
      speak: Audio.speak
    };
    mod.start(api, (stars) => winLevel(level, stars));
  }

  function handleHud(act, level, btn) {
    Audio.sfx('tap');
    if (act === 'menu') return goMenu();
    if (act === 'pause') return togglePause(level);
    if (act === 'music') { const on = Audio.toggleMusic(); btn.textContent = on ? '🎵' : '🔇'; }
    if (act === 'mute')  { const m = Audio.toggleMute();   btn.textContent = m ? '🔕' : '🔔'; }
  }

  function togglePause(level) {
    paused = !paused;
    $('#pauseOverlay').hidden = !paused;
  }

  let score = 0;
  function addScore(n) {
    score += n;
    const el = $('#score');
    if (el) { el.textContent = score; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  }
  function setProgress(frac) {
    const el = $('#progressFill');
    if (el) el.style.width = Math.max(0, Math.min(1, frac)) * 100 + '%';
  }

  function stopLevel() {
    if (currentLevel && currentLevel.stop) currentLevel.stop();
    currentLevel = null;
    score = 0;
  }

  // =========================================================
  // WIN SCREEN
  // =========================================================
  function winLevel(level, stars) {
    stopLevel();
    const p = recordStars(level, stars);
    Audio.sfx('win');
    confetti(60);

    const nextLevel = level < 3 ? level + 1 : null;
    screens.win.innerHTML = `
      <div class="win">
        <div class="win__nicky">${Nicky.html({ pose: 'cheer' })}</div>
        <h1 class="win__title">כל הכבוד! 🎉</h1>
        <div class="win__stars">${starsHtml(stars)}</div>
        <p class="win__msg">${LEVEL_INFO[level].tip}</p>
        <div class="win__buttons">
          ${nextLevel ? `<button class="btn-big" data-act="next">לשלב הבא ▶</button>` : `<button class="btn-big" data-act="menu">סיימנו! 🏆</button>`}
          <button class="btn-secondary" data-act="replay">שחקו שוב ↻</button>
          <button class="btn-secondary" data-act="menu">תפריט 🏠</button>
        </div>
      </div>`;
    show('win');
    Audio.speak('כל הכבוד! ' + LEVEL_INFO[level].tip);

    // animate the stars one by one
    const starEls = screens.win.querySelectorAll('.win__stars .star--on');
    starEls.forEach((s, i) => setTimeout(() => { s.classList.add('star--pop'); Audio.sfx('star'); }, 350 + i * 350));

    screens.win.querySelectorAll('[data-act]').forEach(b => {
      b.addEventListener('click', () => {
        Audio.sfx('tap');
        const act = b.dataset.act;
        if (act === 'menu') goMenu();
        else if (act === 'replay') startIntro(level);
        else if (act === 'next') startIntro(nextLevel);
      });
    });
  }

  function goMenu() {
    stopLevel();
    renderMenu();
    show('menu');
  }

  // =========================================================
  // CONFETTI (shared celebration effect)
  // =========================================================
  function confetti(amount) {
    const colors = ['#F4631E', '#1B4D89', '#3AA935', '#22A7E0', '#9CCB2C', '#FFC83D'];
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    document.body.appendChild(layer);
    for (let i = 0; i < (amount || 40); i++) {
      const c = document.createElement('span');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[(Math.random() * colors.length) | 0];
      c.style.animationDelay = (Math.random() * 0.4) + 's';
      c.style.transform = `rotate(${Math.random() * 360}deg)`;
      layer.appendChild(c);
    }
    setTimeout(() => layer.remove(), 2600);
  }

  // =========================================================
  // BOOT
  // =========================================================
  function init() {
    screens.menu  = $('#screen-menu');
    screens.intro = $('#screen-intro');
    screens.play  = $('#screen-play');
    screens.win   = $('#screen-win');

    renderMenu();
    show('menu');

    // First user gesture anywhere unlocks audio + starts music softly.
    document.body.addEventListener('pointerdown', function once() {
      Audio.ensureCtx();
      if (!Audio.isMusicOn()) Audio.startMusic();
      document.body.removeEventListener('pointerdown', once);
    }, { once: true });
  }

  document.addEventListener('DOMContentLoaded', init);

  // expose a couple of helpers for debugging / future use
  window.Game = { goMenu, loadProgress };
})();
