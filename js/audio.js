/* ============================================================
 * audio.js — AudioManager
 * ------------------------------------------------------------
 * All sound is synthesised with the Web Audio API so there are
 * no audio files to ship. Includes:
 *   - short sound effects (collect / correct / wrong / star / win)
 *   - gentle looping background music
 *   - Hebrew text-to-speech for the tip bubbles (SpeechSynthesis)
 *
 * 👉 TO USE REAL SOUND FILES LATER:
 *    Replace the body of playTone()/sfx() with `new Audio('assets/..').play()`
 *    or load buffers into the AudioContext. The public API
 *    (Audio.sfx, Audio.toggleMute, Audio.toggleMusic, Audio.speak)
 *    can stay the same.
 * ============================================================ */
(function () {
  'use strict';

  let ctx = null;          // AudioContext (created on first user gesture)
  let masterGain = null;   // master volume for SFX
  let musicGain = null;    // separate gain for the music loop
  let musicTimer = null;   // setInterval handle for the melody
  let muted = false;
  let musicOn = false;

  // Lazily create the audio graph — browsers require a user gesture.
  function ensureCtx() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 0.6;
    masterGain.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.0;
    musicGain.connect(ctx.destination);
  }

  // Play one short note.
  function tone(freq, dur, type, when, gainVal, dest) {
    if (!ctx) return;
    const t0 = (when || ctx.currentTime);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gainVal || 0.5, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(dest || masterGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // Named sound effects.
  const SFX = {
    collect() { tone(660, 0.12, 'triangle'); tone(990, 0.12, 'triangle', ctx && ctx.currentTime + 0.06); },
    correct() {
      const t = ctx ? ctx.currentTime : 0;
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', t + i * 0.07, 0.5));
    },
    wrong() {
      // gentle, non-scary "try again" buzz
      tone(200, 0.18, 'sine', ctx && ctx.currentTime, 0.35);
      tone(150, 0.22, 'sine', ctx && ctx.currentTime + 0.1, 0.3);
    },
    star() {
      const t = ctx ? ctx.currentTime : 0;
      [880, 1175, 1568].forEach((f, i) => tone(f, 0.2, 'sine', t + i * 0.12, 0.45));
    },
    win() {
      const t = ctx ? ctx.currentTime : 0;
      const notes = [523, 659, 784, 1046, 784, 1046, 1318];
      notes.forEach((f, i) => tone(f, 0.22, 'triangle', t + i * 0.13, 0.5));
    },
    tap() { tone(440, 0.08, 'square', ctx && ctx.currentTime, 0.25); }
  };

  function sfx(name) {
    ensureCtx();
    if (!ctx || muted) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (SFX[name]) SFX[name]();
  }

  // ---- Gentle looping background music (simple major-key arpeggio) ----
  const MELODY = [523, 659, 784, 659, 587, 698, 880, 698]; // C E G E / D F A F
  let melodyStep = 0;
  function musicTick() {
    if (!ctx || !musicOn) return;
    if (ctx.state === 'suspended') ctx.resume();
    const f = MELODY[melodyStep % MELODY.length];
    tone(f, 0.4, 'sine', ctx.currentTime, 0.18, musicGain);
    tone(f / 2, 0.4, 'triangle', ctx.currentTime, 0.10, musicGain); // soft bass
    melodyStep++;
  }

  function startMusic() {
    ensureCtx();
    if (!ctx) return;
    musicOn = true;
    musicGain.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.3);
    if (!musicTimer) musicTimer = setInterval(musicTick, 320);
  }
  function stopMusic() {
    musicOn = false;
    if (ctx) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }
  function toggleMusic() {
    if (musicOn) stopMusic(); else startMusic();
    return musicOn;
  }

  function toggleMute() {
    muted = !muted;
    ensureCtx();
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.6;
    if (musicGain) musicGain.gain.value = (muted || !musicOn) ? 0 : 0.5;
    return muted;
  }
  function isMuted() { return muted; }
  function isMusicOn() { return musicOn; }

  // ---- Hebrew speech for the educational tips ----
  function speak(text) {
    if (muted) return;
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'he-IL';
      u.rate = 0.95;
      u.pitch = 1.15;
      const voices = window.speechSynthesis.getVoices();
      const he = voices.find(v => /he|iw/i.test(v.lang));
      if (he) u.voice = he;
      window.speechSynthesis.speak(u);
    } catch (e) { /* speech not critical */ }
  }

  // Pre-load voices (some browsers populate them asynchronously).
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  window.Audio = { sfx, toggleMute, toggleMusic, isMuted, isMusicOn, speak, startMusic, stopMusic, ensureCtx };
})();
