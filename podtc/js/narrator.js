/* PODTC narrator — plays an episode: a pre-recorded mp3 if the place has one,
 * otherwise Hebrew text-to-speech (Web Speech API, he-IL voice).
 * Long texts are split into sentence chunks: some mobile browsers stop
 * speaking utterances that run longer than ~15 seconds. */
(function () {
  const synth = window.speechSynthesis;
  let voice = null, chunks = [], idx = 0, audioEl = null, state = 'idle';
  let listeners = { state: [], progress: [], chunk: [], voices: [], silent: [] };
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
               set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const RATE_KEY = 'podtc.rate';
  let rate = parseFloat(ls.get(RATE_KEY, '0.95')) || 0.95;   // a touch slower than default sounds less robotic
  let music = ls.get('podtc.music', '1') === '1';
  let paraEnds = new Set();   // chunk indexes that end a paragraph → longer pause
  let pitch = parseFloat(ls.get('podtc.pitch', '1')) || 1;
  let voiceURI = ls.get('podtc.voice', '');

  const isHe = v => /^(he|iw)/i.test(v.lang);
  const allVoices = () => synth ? synth.getVoices() : [];
  /* Hebrew voices first; prefer natural/online voices (Edge "Hila/Avri Online", Google, Apple Carmit) */
  function hebrewVoices() {
    const score = v => (/natural|online|neural/i.test(v.name) ? 0 : 1) + (/google|hila|avri|carmit|asaf/i.test(v.name) ? 0 : 1);
    return allVoices().filter(isHe).sort((a, b) => score(a) - score(b));
  }
  function pickVoice() {
    if (!synth) return null;
    const vs = allVoices();
    voice = (voiceURI && vs.find(v => v.voiceURI === voiceURI)) || hebrewVoices()[0] || null;
    return voice;
  }
  if (synth) {
    pickVoice();
    const onVoices = () => { pickVoice(); emit('voices', allVoices()); };
    if (synth.addEventListener) synth.addEventListener('voiceschanged', onVoices); else synth.onvoiceschanged = onVoices;
    setTimeout(onVoices, 600); // some browsers never fire voiceschanged
  }

  function emit(type, data) { listeners[type].forEach(fn => fn(data)); }
  function setState(s) {
    state = s; emit('state', s);
    if ((s === 'paused' || s === 'ended' || s === 'idle') && typeof Studio !== 'undefined') Studio.bed(false);
    if (s === 'playing' && music && typeof Studio !== 'undefined' && Studio.ready() && !audioEl) Studio.bed(true);
  }

  function split(text) {
    // split per paragraph so we know where the longer pauses go
    const paras = String(text).split(/\n+/).map(t => t.trim()).filter(Boolean);
    if (paras.length > 1) {
      const out = []; const ends = new Set();
      paras.forEach(p => { splitPara(p).forEach(c => out.push(c)); ends.add(out.length - 1); });
      split.lastEnds = ends; return out;
    }
    split.lastEnds = new Set([0]);
    const r = splitPara(text); split.lastEnds = new Set([r.length - 1]); return r;
  }
  function splitPara(text) {
    // protect decimals and clock times ("0.7", "16:23") so they are not read as sentence breaks
    const safe = text.replace(/\s+/g, ' ').replace(/(\d)\.(\d)/g, '$1\uE000$2').replace(/(\d):(\d)/g, '$1\uE001$2');
    const parts = (safe.match(/[^.!?:]+[.!?:]?/g) || [safe]).map(p => p.replace(/\uE000/g, '.').replace(/\uE001/g, ':'));
    // merge very short parts so speech flows naturally
    const out = [];
    parts.forEach(p => {
      p = p.trim(); if (!p) return;
      if (out.length && (out[out.length - 1].length + p.length) < 160) out[out.length - 1] += ' ' + p;
      else out.push(p);
    });
    return out;
  }

  /* Speech can fail silently (no Hebrew voice, the browser's speech engine stuck after a pause, or a
     first sentence spoken outside a tap). Each sentence is watched: if it never starts we retry once,
     without a fixed voice; if it still does not start, the music stops and the app is told ("silent"). */
  let watch = 0, tries = 0;
  function speakNext() {
    if (idx >= chunks.length) { setState('ended'); return; }
    emit('chunk', idx);
    const my = idx, u = new SpeechSynthesisUtterance(chunks[idx]);
    u.lang = voice ? voice.lang : 'he-IL'; u.rate = rate; u.pitch = pitch;
    if (voice && tries === 0) u.voice = voice;
    let started = false;
    const ok = () => { started = true; tries = 0; clearTimeout(watch); };
    u.onstart = ok;
    u.onboundary = ok;
    u.onend = () => {
      clearTimeout(watch); tries = 0;
      if (state !== 'playing' || my !== idx) return;
      const gap = paraEnds.has(idx) ? 650 : 220;   // breathe between sentences, longer between paragraphs
      idx++; emit('progress', idx / chunks.length);
      clearTimeout(speakNext.t); speakNext.t = setTimeout(() => { if (state === 'playing') speakNext(); }, gap);
    };
    u.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      clearTimeout(watch);
      if (tries < 1) { tries++; setTimeout(() => { if (state === 'playing' && my === idx) speakNext(); }, 250); return; }
      silent(e.error || 'error');
    };
    try { if (synth.paused) synth.resume(); synth.speak(u); } catch (e) { setState('unsupported'); return; }
    clearTimeout(watch);
    watch = setTimeout(() => {
      if (started || state !== 'playing' || my !== idx) return;
      if (synth.speaking && !synth.pending) return;                 // some engines never fire onstart: it is speaking, leave it
      if (tries < 1) { tries++; try { synth.cancel(); synth.resume(); } catch (e) {} setTimeout(() => { if (state === 'playing' && my === idx) speakNext(); }, 200); }
      else silent('no-start');
    }, 4500);
  }
  function silent(why) {
    tries = 0; clearTimeout(watch);
    try { synth.cancel(); } catch (e) {}
    setState('paused');                                              // also stops the music bed
    emit('silent', why);
  }

  /* jump straight to sentence i (tap on transcript) */
  function seek(i) {
    if (audioEl || !chunks.length) return;
    idx = Math.max(0, Math.min(chunks.length - 1, i));
    emit('progress', idx / chunks.length);
    if (state === 'playing') { setState('skipping'); synth.cancel(); setTimeout(() => { setState('playing'); speakNext(); }, 60); }
    else emit('chunk', idx);
  }
  function stop() {
    if (audioEl) { audioEl.pause(); audioEl = null; }
    clearTimeout(watch); tries = 0;
    if (synth) synth.cancel();
    chunks = []; idx = 0; setState('idle');
  }

  /* human recordings: a female and a male narrator; the listener's choice wins, the other one is the fallback */
  function recording(ep) {
    const pref = ls.get('podtc.narr', 'f'), f = ep.audioF || ep.audio, m = ep.audioM || ep.audio;
    if (pref === 'tts') return ep.audio && !ep.audioF && !ep.audioM ? ep.audio : '';
    return pref === 'm' ? (m || f || '') : (f || m || '');
  }
  function play(episode) {
    stop();
    const src = recording(episode);
    if (src) {
      audioEl = new Audio(src);
      audioEl.ontimeupdate = () => emit('progress', audioEl.currentTime / (audioEl.duration || 1));
      audioEl.onended = () => setState('ended');
      audioEl.onerror = () => { audioEl = null; playTTS(episode); };
      audioEl.playbackRate = rate;
      audioEl.play().then(() => setState('playing')).catch(() => { audioEl = null; playTTS(episode); });
      return;
    }
    playTTS(episode);
  }

  function playTTS(episode) {
    if (!synth) { setState('unsupported'); return; }
    chunks = split(episode.intro ? episode.intro + '.\n' + episode.script : episode.script);
    paraEnds = split.lastEnds || new Set();
    idx = 0; setState('playing'); emit('progress', 0);
    // podcast feel: a short sting, then the voice over a very soft music bed
    tries = 0;
    try { const pr = new SpeechSynthesisUtterance(' '); pr.volume = 0; pr.lang = 'he-IL'; if (synth.paused) synth.resume(); synth.speak(pr); } catch (e) {}
    if (music && Studio.ready()) { Studio.sting(); Studio.bed(true); clearTimeout(speakNext.t); speakNext.t = setTimeout(() => { if (state === 'playing') speakNext(); }, 1500); }
    else speakNext();
  }

  /* --- tiny "studio": jingle + ambient bed with WebAudio (no files, no network) --- */
  const Studio = (() => {
    let ctx = null, bedGain = null, bedNodes = [];
    const ready = () => !!ctx;
    function init() { try { const AC = window.AudioContext || window.webkitAudioContext; if (AC && !ctx) ctx = new AC(); if (ctx && ctx.state === 'suspended') ctx.resume(); } catch (e) {} }
    function tone(f, t, len, vol, type = 'sine') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .04); g.gain.exponentialRampToValueAtTime(.0008, t + len);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + len + .05);
    }
    function sting() {   // warm major-seventh arpeggio, ~1.3s
      if (!ctx) return; const t = ctx.currentTime + .02;
      [[392, 0], [493.9, .12], [587.3, .24], [740, .38]].forEach(([f, d]) => { tone(f, t + d, 1.1, .07, 'triangle'); tone(f / 2, t + d, 1.2, .03); });
    }
    function bed(on) {
      if (!ctx) return;
      const now = ctx.currentTime;
      if (on) {
        if (bedNodes.length) { bedGain.gain.cancelScheduledValues(now); bedGain.gain.linearRampToValueAtTime(.022, now + 1.5); return; }
        bedGain = ctx.createGain(); bedGain.gain.value = 0;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
        lp.connect(bedGain).connect(ctx.destination);
        [196, 246.9, 293.7, 196.6].forEach(f => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(lp); o.start(); bedNodes.push(o); });
        const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .08; lg.gain.value = 250; lfo.connect(lg).connect(lp.frequency); lfo.start(); bedNodes.push(lfo);
        bedGain.gain.linearRampToValueAtTime(.022, now + 2);
      } else if (bedGain) {
        bedGain.gain.cancelScheduledValues(now); bedGain.gain.setValueAtTime(bedGain.gain.value, now); bedGain.gain.linearRampToValueAtTime(0, now + 1.2);
        const nodes = bedNodes; bedNodes = []; setTimeout(() => nodes.forEach(o => { try { o.stop(); } catch (e) {} }), 1400);
      }
    }
    return { init, ready, sting, bed };
  })();

  function pause() {
    if (audioEl) { audioEl.pause(); setState('paused'); return; }
    if (synth && state === 'playing') { clearTimeout(watch); setState('paused'); synth.cancel(); } // resume restarts current sentence (more reliable than synth.pause on mobile)
  }
  function resume() {
    if (audioEl) { audioEl.play(); setState('playing'); return; }
    if (state === 'paused') { setState('playing'); speakNext(); }
  }
  /* jump between sentences (TTS) or ±15s (mp3) */
  function skip(delta) {
    if (audioEl) { audioEl.currentTime = Math.max(0, audioEl.currentTime + delta * 15); return; }
    if (!chunks.length) return;
    idx = Math.max(0, Math.min(chunks.length - 1, idx + delta));
    emit('progress', idx / chunks.length);
    if (state === 'playing') { setState('skipping'); synth.cancel(); setTimeout(() => { setState('playing'); speakNext(); }, 60); }
  }
  function setRate(r) { rate = r; localStorage.setItem(RATE_KEY, String(r)); if (audioEl) audioEl.playbackRate = r; }

  function setVoice(uri) { voiceURI = uri || ''; ls.set('podtc.voice', voiceURI); pickVoice(); }
  function setPitch(p) { pitch = p; ls.set('podtc.pitch', String(p)); }
  /* short sample in the chosen voice (only when no episode is playing) */
  function preview(text) {
    if (!synth || state === 'playing') return false;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text || 'שלום! אני הקול שיספר לכם את הסיפורים של טירת כרמל.');
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'he-IL';
    u.rate = rate; u.pitch = pitch;
    try { synth.speak(u); } catch (e) { return false; }
    return true;
  }
  /* iOS/Android require the first speech to start inside a user gesture. */
  function unlock() {
    Studio.init();
    if (!synth) return;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = 'he-IL'; synth.speak(u); } catch (e) {}
  }

  window.Narrator = {
    recording, setNarr(v) { ls.set('podtc.narr', v); }, get narr() { return ls.get('podtc.narr', 'f'); },
    setMusic(on) { music = !!on; ls.set('podtc.music', on ? '1' : '0'); if (!on) Studio.bed(false); }, get music() { return music; },
    isNatural: () => !!(voice && /natural|online|neural|google|premium|enhanced/i.test(voice.name + ' ' + voice.voiceURI)),
    play, pause, resume, stop, unlock, setRate, skip, seek, split, setVoice, setPitch, preview, hebrewVoices, allVoices,
    get rate() { return rate; }, get state() { return state; }, get pitch() { return pitch; },
    get voice() { return voice; }, get voiceURI() { return voiceURI; },
    hasHebrewVoice: () => !!pickVoice(), supported: !!synth,
    on(type, fn) { listeners[type].push(fn); }
  };
})();
