"""The soundtrack of the gymi commercial, made from nothing but arithmetic: every sound is synthesized here, so the
track is original and owned outright (no samples, no library music).
    python score.py [out.wav]
30 seconds, 48 kHz stereo. The film runs at 24 fps and the music at 120 beats a minute, so one beat is 12 frames
and every cut of the montage lands on a beat. The interface sounds are the app's own tones (workout-app/src/feel.js)."""
import sys, os, math
import numpy as np
from scipy import signal

SR = 48000
DUR = 30.0
N = int(SR * DUR)
rng = np.random.default_rng(11)
F = 1 / 24.0                      # one film frame


def t_(n):
    return np.arange(n) / SR


def env(n, a=0.005, d=0.2, curve=4.0):
    """a fast rise and an exponential fall"""
    t = t_(n)
    e = np.exp(-t * curve / max(d, 1e-4))
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def place(mix, snd, at, gain=1.0, pan=0.0):
    """adds a mono or stereo sound into the stereo mix at a time in seconds; pan -1 (left) .. 1 (right)"""
    i = int(at * SR)
    if i >= N or i + len(snd) <= 0:
        return
    if snd.ndim == 1:
        l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
        snd = np.stack([snd * l, snd * r], 1) * 1.4142
    j0 = max(0, -i)
    n = min(len(snd) - j0, N - max(i, 0))
    mix[max(i, 0):max(i, 0) + n] += snd[j0:j0 + n] * gain


def add(*xs):
    """sounds of different lengths, laid over one another from their starts"""
    out = np.zeros(max(len(x) for x in xs))
    for x in xs:
        out[:len(x)] += x
    return out


def noise(n):
    return rng.standard_normal(n)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'lowpass', fs=SR, output='sos'), x, axis=0)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'highpass', fs=SR, output='sos'), x, axis=0)


def reverb(x, secs=1.6, wet=0.3, bright=6000, pre=0.012):
    """a room: the sound convolved with a burst of noise that dies away, different in each ear"""
    n = int(secs * SR)
    out = np.zeros((len(x) + n, 2))
    xs = x if x.ndim == 2 else np.stack([x, x], 1)
    for c in range(2):
        ir = noise(n) * np.exp(-t_(n) * 6.9 / secs)
        ir = lp(ir, bright)
        ir[:int(pre * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
        y = signal.fftconvolve(xs[:, c], ir)[:len(out)]
        out[:len(y), c] = y
    dry = np.zeros_like(out)
    dry[:len(xs)] = xs
    return dry * (1 - wet * 0.3) + out * wet


def sine(f, n, phase=0.0):
    return np.sin(2 * np.pi * f * t_(n) + phase)


def sweep(f0, f1, n, curve=1.0):
    """a sine whose pitch glides from f0 to f1"""
    k = np.linspace(0, 1, n) ** curve
    f = f0 * (f1 / f0) ** k
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# ------------------------------------------------------------------ the instruments
def kick(g=1.0):
    n = int(0.42 * SR)
    body = sweep(150, 43, n, 0.35) * env(n, 0.001, 0.22, 4.5)
    click = hp(noise(n), 2500) * env(n, 0.0005, 0.008, 5) * 0.35
    return np.tanh((body * 1.5 + click) * 1.3) * g


def clap(g=1.0):
    n = int(0.3 * SR)
    x = bp(noise(n), 900, 4200)
    e = np.zeros(n)
    for d in (0.0, 0.011, 0.023):
        i = int(d * SR)
        e[i:] += env(n - i, 0.0005, 0.07, 5)
    return x * e * 0.6 * g


def hat(g=1.0, open_=False):
    n = int((0.22 if open_ else 0.05) * SR)
    return hp(noise(n), 7500) * env(n, 0.0005, 0.12 if open_ else 0.025, 5) * 0.28 * g


def bass(f, dur, g=1.0):
    n = int(dur * SR)
    t = t_(n)
    saw = signal.sawtooth(2 * np.pi * f * t) * 0.5 + sine(f, n) * 0.9 + sine(f * 2, n) * 0.18
    x = lp(saw, 420)
    e = np.minimum(1, t / 0.006) * np.exp(-t * 2.2) * np.minimum(1, (dur - t) / 0.02).clip(0)
    return np.tanh(x * e * 1.6) * 0.62 * g


def pluck(f, dur=0.32, g=1.0, bright=1.0):
    """a soft struck bar, the voice of the app's own sounds: a sine with a little of its octave and a quick fall"""
    n = int(dur * SR)
    x = sine(f, n) + sine(f * 2, n) * 0.22 * bright + sine(f * 3, n) * 0.07 * bright
    return x * env(n, 0.004, dur * 0.55, 4.2) * 0.2 * g


def pad(freqs, dur, g=1.0, attack=0.6):
    """a held chord: detuned saws through a filter that opens slowly"""
    n = int(dur * SR)
    t = t_(n)
    out = np.zeros((n, 2))
    for f in freqs:
        for det, pan in ((-0.004, -0.6), (0.0, 0.0), (0.005, 0.6)):
            x = signal.sawtooth(2 * np.pi * f * (1 + det) * t + rng.uniform(0, 6.28))
            l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
            out[:, 0] += x * l
            out[:, 1] += x * r
    out = lp(out, 1500)
    e = np.minimum(1, t / attack) * np.minimum(1, (dur - t) / 0.4).clip(0)
    return out * e[:, None] * 0.035 * g


def app_tone(kind, g=1.0):
    """the app's own sounds, note for note (feel.js): [frequency, start, length, volume]"""
    S = {'set': [[587, 0, 0.11, 0.06], [880, 0.085, 0.2, 0.06]],
         'pr': [[659, 0, 0.1, 0.065], [880, 0.09, 0.1, 0.065], [1175, 0.18, 0.3, 0.07]],
         'coin': [[880, 0, 0.08, 0.05], [1175, 0.07, 0.16, 0.05]],
         'done': [[523, 0, 0.13, 0.07], [659, 0.12, 0.13, 0.07], [784, 0.24, 0.13, 0.07], [1047, 0.36, 0.5, 0.08]]}[kind]
    n = int((max(s[1] + s[2] for s in S) + 0.25) * SR)
    out = np.zeros(n)
    for f, st, ln, vol in S:
        m = int((ln + 0.2) * SR)
        t = t_(m)
        e = np.minimum(1, t / 0.015) * np.exp(-t * 6.0 / (ln + 0.18))
        i = int(st * SR)
        out[i:i + m] += np.sin(2 * np.pi * f * t) * e * vol * 6
    return out * g


def tick(g=1.0, f=2100):
    n = int(0.03 * SR)
    return (sine(f, n) * 0.6 + hp(noise(n), 4000) * 0.4) * env(n, 0.0005, 0.008, 5) * 0.5 * g


def whoosh(dur, f0=300, f1=6000, g=1.0, rise=True):
    """air moving: noise through a filter that sweeps, swelling to its end (or dying from its start)"""
    n = int(dur * SR)
    x = noise(n)
    out = np.zeros(n)
    hop = 256
    for i in range(0, n, hop):
        k = i / n
        fc = f0 * (f1 / f0) ** (k if rise else 1 - k)
        seg = x[max(0, i - 2048):i + hop]
        y = bp(seg, fc * 0.6, min(fc * 1.7, SR / 2 - 200))
        out[i:i + hop] = y[-min(hop, len(y)):][:len(out[i:i + hop])]
    e = np.linspace(0, 1, n) ** 2.2 if rise else np.linspace(1, 0, n) ** 1.6
    return out * e * 0.5 * g


def thud(f=70, dur=0.5, g=1.0, click=0.3):
    n = int(dur * SR)
    return np.tanh((sweep(f * 2.2, f * 0.7, n, 0.3) * env(n, 0.001, dur * 0.5, 4) + lp(noise(n), 900) * env(n, 0.0005, 0.03, 5) * click) * 1.4) * g


def metal(f=820, dur=1.2, g=1.0):
    """an iron plate ringing: a handful of partials that are not in tune with one another"""
    n = int(dur * SR)
    out = np.zeros(n)
    for k, a in ((1.0, 1.0), (2.76, 0.6), (5.4, 0.35), (8.93, 0.2), (1.47, 0.4)):
        out += sine(f * k, n, rng.uniform(0, 6.28)) * a * np.exp(-t_(n) * (3.0 + k * 1.3))
    return out * 0.16 * g


# ------------------------------------------------------------------ the track
def build():
    mix = np.zeros((N, 2))

    # ---- the gym, 0:00 to 0:11 and 0:24 to 0:27: the room's own hum, far-off life
    def room(start, end, g=1.0):
        n = int((end - start) * SR)
        air = lp(np.stack([noise(n), noise(n)], 1), 380) * 0.05 + bp(np.stack([noise(n), noise(n)], 1), 1500, 5000) * 0.006
        hum = (sine(50, n) * 0.012 + sine(100, n) * 0.007 + sine(150, n) * 0.003)[:, None]
        x = (air + hum) * g
        f = int(0.25 * SR)
        x[:f] *= np.linspace(0, 1, f)[:, None]
        x[-f:] *= np.linspace(1, 0, f)[:, None]
        place(mix, x, start)

    room(0.0, 7.0, 1.0)
    room(24.2, 27.2, 0.8)
    # the lights: a relay shuts and the tubes catch, row by row, each further away
    for i, f in enumerate([8, 17, 26, 35, 44, 53]):
        n = int(0.5 * SR)
        clack = (hp(noise(n), 1800) * env(n, 0.0005, 0.012, 5) * 0.9 + sine(190, n) * env(n, 0.001, 0.05, 5) * 0.7)
        buzz = bp(noise(n), 90, 240) * env(n, 0.02, 0.4, 3) * 0.5
        place(mix, reverb(clack + buzz, 1.8, 0.35), f * F, 0.5 - i * 0.05, pan=-0.3 + i * 0.12)
    # far away: a plate goes down, someone racks a bar, voices that are only a murmur
    place(mix, reverb(add(thud(60, 0.5, 0.5), metal(640, 1.0, 0.5)), 2.6, 0.75), 2.85, 0.5, pan=0.6)
    place(mix, reverb(add(metal(1250, 0.7, 0.6), tick(1.0, 900)), 2.2, 0.7), 4.1, 0.3, pan=-0.6)
    place(mix, reverb(metal(980, 0.6, 0.5), 2.2, 0.7), 5.55, 0.25, pan=0.4)
    n = int(6.5 * SR)
    mur = bp(noise(n), 180, 900) * (0.5 + 0.5 * np.abs(lp(noise(n), 3.5) * 40).clip(0, 1))
    place(mix, reverb(mur * 0.02, 2.5, 0.8), 0.4, 1.0)
    # him: a breath in, a breath out
    for at, dur, g in ((3.35, 0.75, 0.05), (4.3, 0.95, 0.04)):
        n = int(dur * SR)
        b = bp(noise(n), 500, 2600) * np.sin(np.linspace(0, math.pi, n)) ** 1.5
        place(mix, b, at, g)

    # ---- 0:06.5, the plate that jolts the bench
    slam = add(thud(52, 0.9, 1.0, 0.6), metal(540, 1.6, 1.1), metal(1310, 0.9, 0.5))
    place(mix, reverb(slam, 2.4, 0.45), 6.5, 0.9, pan=0.25)

    # ---- 0:07 to 0:10, slow motion: the room sinks an octave; a low tone climbs; a heart
    n = int(3.0 * SR)
    t = t_(n)
    low = lp(np.stack([noise(n), noise(n)], 1), 140) * 0.16 * np.linspace(0.4, 1, n)[:, None]
    drone = (sweep(36, 58, n, 1.6) * 0.5 + sweep(72, 117, n, 1.6) * 0.14)[:, None] * (np.linspace(0, 1, n) ** 1.4)[:, None] * 0.34
    f = int(0.3 * SR)
    sm = low + drone
    sm[:f] *= np.linspace(0, 1, f)[:, None]
    place(mix, sm, 7.0)
    for at in (7.55, 8.5, 9.3):
        hb = thud(48, 0.3, 0.55, 0.05)
        place(mix, hb, at, 0.8)
        place(mix, hb, at + 0.16, 0.5)
    # the glass turning through the air, slowed
    place(mix, whoosh(1.4, 150, 900, 0.5), 7.7, 0.5, pan=-0.5)
    place(mix, whoosh(1.3, 200, 1400, 0.6), 8.7, 0.6, pan=0.5)

    # ---- 0:10, it lands: one hard knock, two small ones; then nothing
    n = int(0.25 * SR)
    crack = hp(noise(n), 2500) * env(n, 0.0003, 0.02, 5) * 0.9 + sine(1900, n) * env(n, 0.0003, 0.03, 5) * 0.25
    hit = np.tanh(add(thud(110, 0.25, 1.0, 0.8), crack) * 1.5)
    place(mix, reverb(hit, 0.9, 0.22), 10.0, 1.15)
    place(mix, reverb(hit, 0.6, 0.2), 10.0 + 6 * F, 0.35)
    place(mix, reverb(hit, 0.5, 0.2), 10.0 + 10 * F, 0.14)
    # the screen wakes: one soft tone, the app's own
    place(mix, reverb(app_tone('coin'), 1.4, 0.4), 10.56, 0.55)

    # ---- 0:11 to 0:12.5, into the phone: air rushing, a drop, the name
    place(mix, whoosh(0.95, 180, 9000, 1.2), 11.0, 1.0)
    place(mix, np.tanh(sweep(140, 30, int(0.9 * SR), 0.5) * env(int(0.9 * SR), 0.002, 0.6, 3.5) * 1.8), 11.9, 0.85)
    place(mix, reverb(hp(noise(int(0.4 * SR)), 5000) * env(int(0.4 * SR), 0.001, 0.25, 4) * 0.4, 1.8, 0.6), 11.9, 0.7)
    D, Fs, A, B, E, G, Cs = 146.83, 185.0, 220.0, 246.94, 164.81, 196.0, 277.18
    place(mix, reverb(pad([D, A, D * 2, Fs * 2, A * 2], 0.75, 1.6, 0.35), 1.2, 0.4), 11.85, 1.0)

    # ---- 0:12.5 to 0:24, the music. D major: D, Bm, G, A, four beats each, the bass on every beat pushing
    beat = 0.5
    t0 = 12.5
    chords = [(D, [D, Fs, A]), (B / 2 * 2, [B, D * 2, Fs * 2]), (G, [G, B, D * 2]), (A, [A, Cs * 2, E * 2])]
    arp = [0, 2, 1, 2, 0, 2, 1, 2]
    music = np.zeros((int(12.2 * SR), 2))

    def mplace(snd, at, gain=1.0, pan=0.0):
        place_into(music, snd, at, gain, pan)

    nbeats = 23
    for b in range(nbeats):
        at = b * beat
        root, tri = chords[(b // 4) % 4]
        mplace(kick(), at, 0.95)
        if b % 2 == 1:
            mplace(clap(), at, 0.8)
        for k in range(4):
            mplace(hat(0.9 if k % 2 == 0 else 0.55, open_=(k == 2 and b % 2 == 1)), at + k * beat / 4, 0.6, pan=0.25 if k % 2 else -0.2)
        br = root / 2 if root > 150 else root
        mplace(bass(br / 2 * 2 / 2, 0.22), at, 1.0)
        mplace(bass(br / 2 * 2 / 2, 0.2), at + beat * 0.5, 0.75)
        mplace(bass(br, 0.12), at + beat * 0.75, 0.5)
        for k in range(4):
            f = tri[arp[(b * 4 + k) % 8] % 3] * 4
            mplace(pluck(f, 0.3, 1.0), at + k * beat / 4, 0.75, pan=math.sin(b * 4 + k) * 0.5)
    for c in range(6):
        root, tri = chords[c % 4]
        dur = min(4 * beat, nbeats * beat - c * 4 * beat)
        if dur > 0.1:
            mplace(pad([f * 2 for f in tri] + [tri[0] * 4], dur + 0.15, 1.0, 0.05), c * 4 * beat, 1.0)
    # the kick ducks everything else a little, so that it breathes
    duck = np.ones(len(music))
    for b in range(nbeats):
        i = int(b * beat * SR)
        n = int(0.22 * SR)
        duck[i:i + n] = np.minimum(duck[i:i + n], np.linspace(0.45, 1.0, n))
    kick_track = np.zeros_like(music)
    for b in range(nbeats):
        place_into(kick_track, kick(), b * beat, 0.95)
    music = (music - kick_track) * duck[:, None] + kick_track
    music = reverb(music, 0.9, 0.1)[:len(music)]
    # the cut back to the gym: the music is swallowed
    end = int(nbeats * beat * SR)
    tail = int(0.35 * SR)
    music[end:end + tail] *= np.linspace(1, 0, tail)[:, None] ** 2
    music[end + tail:] = 0
    place(mix, music, t0, 0.8)
    # risers into the cuts of the montage, and the interface under the fingers
    for at in (15.0, 17.0, 19.0, 21.5):
        place(mix, whoosh(0.3, 500, 7000, 0.5), at - 0.28, 0.5)
    # (times of the taps and the app's own sounds come from what happens on the screen in each shot)
    ui = [
        (15.0 + 3 * F, 'tick'), (15.0 + 15 * F, 'tick'), (15.0 + 28 * F, 'tick'), (15.0 + 40 * F, 'coin'),            # the character's choices
        (17.0 + 8 * F, 'tick'), (17.0 + 16 * F, 'tick'), (17.0 + 24 * F, 'tick'), (17.0 + 32 * F, 'coin'),            # the plan, line by line
        (19.0 + 7 * F, 'tick'), (19.0 + 26 * F, 'tick'), (19.0 + 39 * F, 'set'),                                      # swap, choose, done
        (21.5 + 4 * F, 'set'), (21.5 + 10 * F, 'pr'), (21.5 + 32 * F, 'done'),                                        # the set, the level, the workout
    ]
    for at, kind in ui:
        s = tick(1.0) if kind == 'tick' else app_tone(kind)
        place(mix, reverb(s, 0.7, 0.2), at, 0.5 if kind == 'tick' else 0.75, pan=0.15)

    # ---- 0:24, back in the gym: the air comes back; steps; a chord that knows where it is going
    place(mix, whoosh(0.55, 200, 6000, 1.0, rise=False), 24.0, 0.9)
    place(mix, thud(55, 0.5, 0.7, 0.1), 24.0, 0.6)
    for i, at in enumerate((25.35, 25.9, 26.42, 26.9)):
        st = lp(thud(85, 0.16, 0.6, 0.5), 700)
        place(mix, reverb(st, 0.8, 0.3), at, 0.4, pan=-0.15 if i % 2 else 0.15)
    place(mix, reverb(pad([D, A, D * 2, Fs * 2], 2.9, 1.4, 1.6), 2.0, 0.5), 24.3, 0.9)
    place(mix, whoosh(0.7, 300, 5000, 0.8), 26.32, 0.7)

    # ---- 0:27, the name: one hit, a chord that rings out
    n = int(3.0 * SR)
    hit = np.tanh(sweep(160, 36, n, 0.25) * env(n, 0.001, 0.9, 3.2) * 2.0) * 0.9
    place(mix, hit, 27.0, 0.95)
    place(mix, reverb(hp(noise(int(0.5 * SR)), 3500) * env(int(0.5 * SR), 0.001, 0.3, 4) * 0.5, 2.6, 0.7), 27.0, 0.6)
    ring = np.zeros((n, 2))
    for i, f in enumerate([D, A, D * 2, Fs * 2, A * 2, D * 4, Fs * 4]):
        place_into(ring, pluck(f, 2.6, 1.4, 0.6), 0.0 + i * 0.012, 0.8, pan=(i % 3 - 1) * 0.5)
    place(mix, reverb(ring, 2.8, 0.55), 27.0, 1.0)
    place(mix, reverb(pad([D, A, D * 2, Fs * 2, A * 2], 2.3, 1.5, 0.02), 2.6, 0.5), 27.0, 1.0)
    place(mix, reverb(app_tone('done'), 2.0, 0.5), 27.9, 0.55)

    # ---- master: a soft ceiling, a fade out at the very end
    mix = hp(mix, 28)
    peak = np.max(np.abs(mix))
    mix = np.tanh(mix / peak * 2.2) / np.tanh(2.2) * 0.94
    f = int(0.55 * SR)
    mix[-f:] *= (np.linspace(1, 0, f) ** 1.5)[:, None]
    return mix


def place_into(buf, snd, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    if snd.ndim == 1:
        l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
        snd = np.stack([snd * l, snd * r], 1) * 1.4142
    n = min(len(snd), len(buf) - i)
    buf[i:i + n] += snd[:n] * gain


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.environ.get('CM', os.path.join(os.path.dirname(__file__), '..', 'work')), 'audio', 'mix.wav')
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    mix = build()
    from scipy.io import wavfile
    wavfile.write(out, SR, (mix * 32767).astype(np.int16))
    rms = 20 * np.log10(np.sqrt(np.mean(mix ** 2)) + 1e-9)
    print('wrote', out, 'peak %.2f' % np.max(np.abs(mix)), 'rms %.1f dB' % rms)
