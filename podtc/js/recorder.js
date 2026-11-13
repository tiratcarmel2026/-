/* podtc — studio recorder for the management screen.
 * Records the microphone, then cleans the take up the way a studio would:
 * mono, trims the silence at the start and end, evens out the volume, short fades,
 * and encodes an MP3 (plays on every phone, including older iPhones). Needs vendor/lame/lame.min.js. */
(function () {
  const RATE = 44100, KBPS = 80;

  async function start(opts = {}) {
    if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error('הדפדפן הזה לא תומך בהקלטה. נסו Chrome או Safari עדכני, או העלו קובץ');
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: false, noiseSuppression: true, autoGainControl: false } }); }
    catch (e) { throw new Error('אין גישה למיקרופון. אשרו את המיקרופון בדפדפן ונסו שוב'); }
    const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported(t)) || '';
    const mr = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 128000 } : {}), parts = [];
    mr.ondataavailable = e => { if (e.data && e.data.size) parts.push(e.data); };
    // live level meter
    const AC = window.AudioContext || window.webkitAudioContext, ac = new AC(), an = ac.createAnalyser(); an.fftSize = 1024;
    ac.createMediaStreamSource(stream).connect(an);
    const buf = new Float32Array(an.fftSize); let raf = 0, peakHold = 0;
    const meter = () => { an.getFloatTimeDomainData(buf); let p = 0; for (let i = 0; i < buf.length; i++) p = Math.max(p, Math.abs(buf[i])); peakHold = Math.max(p, peakHold * .92);
      if (opts.onLevel) opts.onLevel(Math.min(1, peakHold * 1.4), p > .98); raf = requestAnimationFrame(meter); };
    meter();
    const t0 = Date.now(); mr.start(250);
    return {
      get seconds() { return (Date.now() - t0) / 1000; },
      cancel() { cancelAnimationFrame(raf); try { mr.stop(); } catch (e) {} stream.getTracks().forEach(t => t.stop()); ac.close(); },
      stop() {
        return new Promise((res, rej) => {
          mr.onstop = async () => { cancelAnimationFrame(raf); stream.getTracks().forEach(t => t.stop());
            try { const raw = new Blob(parts, { type: mr.mimeType || type || 'audio/webm' }); res(await finish(raw, ac, opts.onProgress)); } catch (e) { rej(e); } finally { ac.close(); } };
          mr.stop();
        });
      }
    };
  }

  // a file chosen from the computer goes through the same clean-up
  async function fromFile(file, onProgress) { const AC = window.AudioContext || window.webkitAudioContext, ac = new AC(); try { return await finish(file, ac, onProgress); } finally { ac.close(); } }

  async function finish(blob, ac, onProgress) {
    const audio = await ac.decodeAudioData(await blob.arrayBuffer());
    // 1. mono
    const n = audio.length, ch = audio.numberOfChannels, mono = new Float32Array(n);
    for (let c = 0; c < ch; c++) { const d = audio.getChannelData(c); for (let i = 0; i < n; i++) mono[i] += d[i] / ch; }
    // 2. trim silence at both ends (keep a quarter second of air)
    const sr = audio.sampleRate, win = Math.round(sr * .02), thr = 0.012;
    let a = 0, b = n;
    for (let i = 0; i < n; i += win) { let p = 0; for (let j = i; j < Math.min(n, i + win); j++) p = Math.max(p, Math.abs(mono[j])); if (p > thr) { a = i; break; } }
    for (let i = n - win; i > 0; i -= win) { let p = 0; for (let j = i; j < Math.min(n, i + win); j++) p = Math.max(p, Math.abs(mono[j])); if (p > thr) { b = i + win; break; } }
    a = Math.max(0, a - Math.round(sr * .25)); b = Math.min(n, b + Math.round(sr * .35));
    if (b - a < sr * .5) throw new Error('ההקלטה שקטה מדי או קצרה מדי. בדקו שהמיקרופון הנכון נבחר ונסו שוב');
    let x = mono.subarray(a, b);
    // 3. even out the volume: peak to -1 dB, with a gentle limit on rare loud spikes
    let peak = 0; const sorted = []; for (let i = 0; i < x.length; i += 50) sorted.push(Math.abs(x[i])); sorted.sort((p, q) => p - q);
    const p999 = sorted[Math.floor(sorted.length * .999)] || 0; for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
    const ref = Math.max(p999 * 1.15, peak * .6, 1e-4), gain = Math.min(12, .89 / ref);
    const y = new Float32Array(x.length), fade = Math.round(sr * .03);
    for (let i = 0; i < x.length; i++) { let v = x[i] * gain; if (v > .95) v = .95 + (v - .95) * .1; else if (v < -.95) v = -.95 + (v + .95) * .1;
      if (i < fade) v *= i / fade; else if (i > x.length - fade) v *= (x.length - i) / fade; y[i] = v; }
    // 4. resample to 44.1 kHz
    let pcm = y;
    if (sr !== RATE && window.OfflineAudioContext) { const len = Math.ceil(y.length * RATE / sr), off = new OfflineAudioContext(1, len, RATE), src = off.createBuffer(1, y.length, sr);
      src.copyToChannel(y, 0); const s = off.createBufferSource(); s.buffer = src; s.connect(off.destination); s.start(); pcm = (await off.startRendering()).getChannelData(0); }
    // 5. MP3
    if (!window.lamejs) throw new Error('רכיב ההמרה ל־MP3 לא נטען. רעננו את העמוד');
    const enc = new lamejs.Mp3Encoder(1, RATE, KBPS), out = [], step = 1152, i16 = new Int16Array(step);
    for (let i = 0; i < pcm.length; i += step) {
      const m = Math.min(step, pcm.length - i); for (let j = 0; j < m; j++) { const v = Math.max(-1, Math.min(1, pcm[i + j])); i16[j] = v < 0 ? v * 32768 : v * 32767; }
      const mp3 = enc.encodeBuffer(m === step ? i16 : i16.subarray(0, m)); if (mp3.length) out.push(new Uint8Array(mp3));
      if (i % (step * 400) === 0) { if (onProgress) onProgress(i / pcm.length); await new Promise(r => setTimeout(r, 0)); }
    }
    const end = enc.flush(); if (end.length) out.push(new Uint8Array(end));
    const mp3 = new Blob(out, { type: 'audio/mpeg' });
    return { blob: mp3, url: URL.createObjectURL(mp3), seconds: pcm.length / RATE, trimmed: (n - (b - a)) / sr };
  }

  window.PodRec = { start, fromFile, supported: !!(navigator.mediaDevices && window.MediaRecorder) };
})();
