"""Original soundtrack for the 60-second shelters video (synthesised here; no third-party music, no licensing).

    python3 -I tools/video/music.py WORK_DIR        -> WORK_DIR/music.wav

D major, 96 BPM, I–V–vi–IV. Pads from the start, bass and a light pulse while the camera flies, a bell arpeggio,
and a soft chime on every stop at the exact moment its pin lands (shelter = A, protected space = E, so the two
kinds also sound different). The pulse stops when the camera pulls back; the last chord rings out under the end card.
Timing is read from video.html and stops.js so sound and picture stay in sync.
"""
import json, pathlib, re, sys, wave
import numpy as np

WORK = pathlib.Path(sys.argv[1])
HERE = pathlib.Path(__file__).resolve().parent
html = (HERE / "video.html").read_text()
T = {k: float(v) for k, v in re.findall(r"(T_INTRO|T_IN|T_TOUR_END|T_ZOUT|T_OUT) = ([\d.]+)", html)}
stops = json.loads(re.search(r"window.VIDEO = (\{.*\});", (WORK / "stops.js").read_text()).group(1))["stops"]

SR, DUR = 44100, 60.0
N = int(SR * DUR)
t = np.arange(N) / SR
out = np.zeros(N)
BEAT = 60 / 96; BAR = 4 * BEAT
hz = lambda midi: 440 * 2 ** ((midi - 69) / 12)
# D – A – Bm – G  (midi roots 62, 57, 59, 55)
CHORDS = [(62, [0, 4, 7]), (57, [0, 4, 7]), (59, [0, 3, 7]), (55, [0, 4, 7])]


def env(n, a, r):
    e = np.ones(n); ai = min(n, int(a * SR)); ri = min(n - ai, int(r * SR))
    if ai: e[:ai] = np.linspace(0, 1, ai)
    if ri: e[-ri:] *= np.linspace(1, 0, ri)
    return e


def add(start, sig, gain=1.0):
    i = int(start * SR)
    if i >= N: return
    j = min(N, i + len(sig)); out[i:j] += gain * sig[: j - i]


def tone(f, dur, harm=(1, .5, .25, .12), detune=0.0):
    tt = np.arange(int(dur * SR)) / SR
    s = sum(a * np.sin(2 * np.pi * f * (k + 1) * tt) for k, a in enumerate(harm))
    if detune:
        s += sum(a * np.sin(2 * np.pi * f * (1 + detune) * (k + 1) * tt) for k, a in enumerate(harm))
    return s


def bell(f, dur=1.2):
    tt = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * f * tt) + .35 * np.sin(2 * np.pi * f * 2.76 * tt) + .15 * np.sin(2 * np.pi * f * 5.4 * tt)) * np.exp(-tt * 5.5)


# ---- pads: whole video, gentle swell in, long ring out
bar_starts = np.arange(0, DUR, BAR)
for b, bs in enumerate(bar_starts):
    root, iv = CHORDS[b % 4]
    final = bs + BAR > T["T_OUT"]          # the chord under the end card rings to the last frame
    dur = (DUR - bs) if final else BAR + 0.6
    for k in iv + [12]:
        f = hz(root + k)
        add(bs, tone(f, dur, (1, .35, .12), detune=0.004) * env(int(dur * SR), 0.5, 0.9 if not final else 3.0), 0.035)
    if final: break

# ---- bass: from the dive-in to the pull-back, on beats 1 and 3
for b, bs in enumerate(bar_starts):
    if bs < T["T_INTRO"] - 0.2 or bs >= T["T_TOUR_END"]: continue
    root = CHORDS[b % 4][0] - 24
    for beat in (0, 2):
        st = bs + beat * BEAT; d = BEAT * 1.8
        tt = np.arange(int(d * SR)) / SR
        add(st, (np.sin(2 * np.pi * hz(root) * tt) + .3 * np.sin(4 * np.pi * hz(root) * tt)) * np.exp(-tt * 2.2) * env(len(tt), .01, .1), 0.16)

# ---- pulse: soft kick on each beat, airy hat on the off-beats, while the camera flies
rng = np.random.default_rng(7)
for k in range(int(DUR / BEAT) + 1):
    st = k * BEAT
    if st < T["T_IN"] or st >= T["T_TOUR_END"]: continue
    tt = np.arange(int(.18 * SR)) / SR
    f = 50 + 70 * np.exp(-tt * 30)
    add(st, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 18), 0.22)
    nz = rng.standard_normal(int(.05 * SR)); nz = np.diff(nz, prepend=0)          # high-passed noise
    add(st + BEAT / 2, nz * np.exp(-np.arange(len(nz)) / SR * 70), 0.018)

# ---- bell arpeggio in eighths while flying
for k in range(int(DUR / (BEAT / 2)) + 1):
    st = k * BEAT / 2
    if st < T["T_IN"] or st >= T["T_TOUR_END"]: continue
    b = int(st // BAR); root, iv = CHORDS[b % 4]
    note = root + 12 + [0, iv[1], iv[2], 12, iv[2], iv[1], 0, iv[2]][k % 8]
    add(st, bell(hz(note), 0.9), 0.045)

# ---- riser into the flight, and a chime on every stop
rd = T["T_IN"] - T["T_INTRO"]
tt = np.arange(int(rd * SR)) / SR
add(T["T_INTRO"], rng.standard_normal(len(tt)) * (tt / rd) ** 2 * .5 * env(len(tt), .2, .15), 0.05)
per = (T["T_TOUR_END"] - T["T_IN"]) / len(stops)
for i, s in enumerate(stops):
    st = T["T_IN"] + per * (i + 1)
    add(st, bell(hz(81 if s["type"] == "shelter" else 88), 1.4), 0.10)     # A5 / E6

# ---- space (two feedback delays), gentle limiter, fades
wet = out.copy()
for d, g in ((0.187, .28), (0.311, .2)):
    di = int(d * SR)
    for rep in range(1, 4):
        wet[di * rep:] += out[: N - di * rep] * g ** rep
mix = np.tanh(wet * 1.6) / np.tanh(1.6)
mix *= env(N, 1.2, 2.5)
mix /= np.max(np.abs(mix)) / 0.89
pcm = (mix * 32767).astype(np.int16)
with wave.open(str(WORK / "music.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("music ->", WORK / "music.wav", f"({DUR:.0f}s, {len(stops)} chimes)")
