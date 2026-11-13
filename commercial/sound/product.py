"""The soundtrack of gymi's product film, synthesized like the commercial's (the instruments are score.py's).
    python product.py [out.wav]          -> $CM/audio/product.wav
30 seconds at 120 beats a minute (one beat is 12 film frames, a bar is two seconds). Quiet and exact: two single
notes under the opening words, a swell as the light slides over the phone, then a soft pulse with a plucked figure
under the features, the app's own tones where a finger lands, a breath before the name, one hit and a chord."""
import sys, os
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from score import SR, N, F, place, place_into, reverb, pluck, pad, kick, hat, clap, bass, app_tone, tick, whoosh, sweep, env, noise, hp, lp, sine

D, E, Fs, G, A, B, Cs = 146.83, 164.81, 185.0, 196.0, 220.0, 246.94, 277.18
BEAT = 0.5
# the cuts (in seconds): words, reveal, meet, character, plan, swap, game, home, name
CUT = dict(open=0.0, P1=3.0, P2=6.5, P3=10.0, P4=14.0, P5=17.5, P6=21.5, P7=25.5, end=27.5)
# a chord for every bar of the pulse: D, B minor, G, A
CHORDS = [(D, A, Fs * 2), (B / 2, Fs, D * 2), (G / 2, D, B), (A / 2, E, Cs * 2)]


def build():
    mix = np.zeros((N, 2))

    # ---- 0:00, the words on black: one note under each line, and a low air
    place(mix, reverb(pluck(D * 2, 2.2, 1.6, 0.5), 2.6, 0.55), 0.25, 0.9, pan=0.1)
    place(mix, reverb(pluck(A * 2, 2.2, 1.6, 0.5), 2.6, 0.55), 1.55, 0.9, pan=-0.1)
    place(mix, reverb(pad([D / 2, A / 2], 3.2, 0.9, 1.4), 2.0, 0.4), 0.0, 0.7)

    # ---- 0:03, the reveal: air that follows the line of light, a swell that opens, a riser into the name
    place(mix, reverb(whoosh(2.0, 400, 5000, 0.5), 1.6, 0.4), CUT['P1'] + 0.1, 0.5, pan=0.4)
    place(mix, reverb(pad([D / 2, A / 2, D, Fs], 3.6, 1.3, 2.4), 2.4, 0.5), CUT['P1'], 0.9)
    shimmer = np.zeros((int(3.4 * SR), 2))
    for i, f in enumerate([D * 4, A * 4, Fs * 4, D * 8, A * 4, Fs * 8]):
        place_into(shimmer, pluck(f, 1.2, 0.6, 0.3), 1.1 + i * 0.34, 0.5, pan=(i % 2) * 0.8 - 0.4)
    place(mix, reverb(shimmer, 2.4, 0.6), CUT['P1'], 0.5)
    place(mix, whoosh(0.9, 200, 7000, 0.7), CUT['P2'] - 0.9, 0.6)

    # ---- 0:06.5 to 0:25.5, the pulse: soft kick on one and three, a plucked figure in eighths, the chord in a pad
    t0, t1 = CUT['P2'], CUT['P7']
    bar = 0
    t = t0
    while t < t1 - 0.01:
        ch = CHORDS[bar % 4]
        lift = min(1.0, (t - t0) / 6.0)             # the figure grows for six seconds, then holds
        place(mix, reverb(pad([ch[0], ch[1], ch[2]], 2.05, 1.0, 0.3), 1.8, 0.45), t, 0.75)
        place(mix, bass(ch[0] / 2 if ch[0] > 120 else ch[0], 1.9, 0.6), t, 0.55)
        for b in range(4):
            at = t + b * BEAT
            if at >= t1:
                break
            if b in (0, 2):
                place(mix, kick(0.55), at, 0.7)
            if b in (1, 3) and t >= CUT['P4']:
                place(mix, reverb(clap(0.35), 0.9, 0.3), at, 0.35)
            if t >= CUT['P3']:
                place(mix, hat(0.6), at + BEAT / 2, 0.4, pan=0.3)
        figure = [ch[0] * 4, ch[1] * 2, ch[2] * 2, ch[1] * 2, ch[0] * 4, ch[2] * 2, ch[1] * 4, ch[2] * 2]
        for i, f in enumerate(figure):
            at = t + i * BEAT / 2
            if at < t1:
                place(mix, reverb(pluck(f, 0.4, 0.7 + 0.5 * lift, 0.8), 1.2, 0.35), at, 0.55, pan=0.35 if i % 2 else -0.35)
        t += 4 * BEAT
        bar += 1

    # the app where a finger lands (shot frames from prep_tex.py's timing of each take)
    ui = [(CUT['P3'] + 6 * F, 'tick'), (CUT['P3'] + 22 * F, 'tick'), (CUT['P3'] + 39 * F, 'tick'), (CUT['P3'] + 55 * F, 'coin'),
          (CUT['P4'] + 20 * F, 'tick'), (CUT['P4'] + 32 * F, 'tick'), (CUT['P4'] + 44 * F, 'tick'), (CUT['P4'] + 56 * F, 'coin'),
          (CUT['P5'] + 14 * F, 'tick'), (CUT['P5'] + 41 * F, 'tick'), (CUT['P5'] + 59 * F, 'set'),
          (CUT['P6'] + 6 * F, 'set'), (CUT['P6'] + 20 * F, 'pr'), (CUT['P6'] + 46 * F, 'done')]
    for at, kind in ui:
        s = tick(1.0) if kind == 'tick' else app_tone(kind)
        place(mix, reverb(s, 0.7, 0.2), at, 0.45 if kind == 'tick' else 0.6, pan=0.15)

    # ---- 0:25.5, home: the pulse stops, the chord breathes, a breath in before the name
    place(mix, reverb(pad([D, A, D * 2, Fs * 2], 2.2, 1.2, 0.4), 2.2, 0.5), CUT['P7'], 0.85)
    place(mix, whoosh(1.2, 300, 6000, 0.6), CUT['end'] - 1.2, 0.5)

    # ---- 0:27.5, the name: one hit, a chord that rings out to the end
    n = int(2.6 * SR)
    hit = np.tanh(sweep(150, 38, n, 0.25) * env(n, 0.001, 0.8, 3.2) * 2.0) * 0.75
    place(mix, hit, CUT['end'], 0.9)
    ring = np.zeros((n, 2))
    for i, f in enumerate([D, A, D * 2, Fs * 2, A * 2, D * 4, Fs * 4]):
        place_into(ring, pluck(f, 2.4, 1.3, 0.6), i * 0.014, 0.8, pan=(i % 3 - 1) * 0.5)
    place(mix, reverb(ring, 2.8, 0.55), CUT['end'], 1.0)
    place(mix, reverb(pad([D, A, D * 2, Fs * 2, A * 2], 2.4, 1.4, 0.02), 2.6, 0.5), CUT['end'], 0.9)

    # ---- master
    mix = hp(mix, 30)
    peak = np.max(np.abs(mix))
    mix = np.tanh(mix / peak * 1.8) / np.tanh(1.8) * 0.92
    f = int(0.8 * SR)
    mix[-f:] *= (np.linspace(1, 0, f) ** 1.5)[:, None]
    return mix


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.environ.get('CM', os.path.join(os.path.dirname(__file__), '..', 'work')), 'audio', 'product.wav')
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    mix = build()
    from scipy.io import wavfile
    wavfile.write(out, SR, (mix * 32767).astype(np.int16))
    rms = 20 * np.log10(np.sqrt(np.mean(mix ** 2)) + 1e-9)
    print('wrote', out, 'peak %.2f' % np.max(np.abs(mix)), 'rms %.1f dB' % rms)
