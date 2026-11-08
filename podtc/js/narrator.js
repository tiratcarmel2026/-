/* PODTC narrator — plays an episode: a pre-recorded mp3 if the place has one,
 * otherwise Hebrew text-to-speech (Web Speech API, he-IL voice).
 * Long texts are split into sentence chunks: some mobile browsers stop
 * speaking utterances that run longer than ~15 seconds. */
(function () {
  const synth = window.speechSynthesis;
  let voice = null, chunks = [], idx = 0, audioEl = null, state = 'idle';
  let listeners = { state: [], progress: [], chunk: [] };
  const RATE_KEY = 'podtc.rate';
  let rate = parseFloat(localStorage.getItem(RATE_KEY) || '1') || 1;

  function pickVoice() {
    if (!synth) return null;
    const vs = synth.getVoices();
    voice = vs.find(v => /^he|^iw/i.test(v.lang) && /google|carmit|asaf|hila|avri/i.test(v.name))
         || vs.find(v => /^he|^iw/i.test(v.lang)) || null;
    return voice;
  }
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }

  function emit(type, data) { listeners[type].forEach(fn => fn(data)); }
  function setState(s) { state = s; emit('state', s); }

  function split(text) {
    const parts = text.replace(/\s+/g, ' ').match(/[^.!?:]+[.!?:]?/g) || [text];
    // merge very short parts so speech flows naturally
    const out = [];
    parts.forEach(p => {
      p = p.trim(); if (!p) return;
      if (out.length && (out[out.length - 1].length + p.length) < 160) out[out.length - 1] += ' ' + p;
      else out.push(p);
    });
    return out;
  }

  function speakNext() {
    if (idx >= chunks.length) { setState('ended'); return; }
    emit('chunk', idx);
    const u = new SpeechSynthesisUtterance(chunks[idx]);
    u.lang = 'he-IL'; u.rate = rate; u.pitch = 1;
    if (voice) u.voice = voice;
    u.onend = () => { if (state !== 'playing') return; idx++; emit('progress', idx / chunks.length); speakNext(); };
    u.onerror = (e) => { if (e.error === 'interrupted' || e.error === 'canceled') return; idx++; speakNext(); };
    try { synth.speak(u); } catch (e) { setState('unsupported'); }
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
    if (synth) synth.cancel();
    chunks = []; idx = 0; setState('idle');
  }

  function play(episode) {
    stop();
    if (episode.audio) {
      audioEl = new Audio(episode.audio);
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
    chunks = split(episode.intro ? episode.intro + '. ' + episode.script : episode.script);
    idx = 0; setState('playing'); emit('progress', 0); speakNext();
  }

  function pause() {
    if (audioEl) { audioEl.pause(); setState('paused'); return; }
    if (synth && state === 'playing') { setState('paused'); synth.cancel(); } // resume restarts current sentence (more reliable than synth.pause on mobile)
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

  /* iOS/Android require the first speech to start inside a user gesture. */
  function unlock() {
    if (!synth) return;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = 'he-IL'; synth.speak(u); } catch (e) {}
  }

  window.Narrator = {
    play, pause, resume, stop, unlock, setRate, skip, seek, split,
    get rate() { return rate; }, get state() { return state; },
    hasHebrewVoice: () => !!pickVoice(), supported: !!synth,
    on(type, fn) { listeners[type].push(fn); }
  };
})();
