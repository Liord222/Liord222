"""The edit of the gymi commercial: takes the rendered shots and the soundtrack and makes the film.
    python make.py [--res 1920] [--render DIR] [--audio mix.wav] [--out gymi.mp4] [--crf 14] [--frames a-b] [--stills DIR]
What happens here, and not in the 3D renders:
  * the real world is framed 2.39:1; the bars open as we go into the phone and close as we come out
  * the last third of the dive: gymi's blue fills the frame, opens like an iris, and the app's own splash appears
  * gymi's world behind the floating phone: deep blue-black, a blue and a gold glow, drifting points of light
  * four titles, one per feature; the end card; whips between the shots of the montage
  * the grade: a soft bloom, a vignette, cool shadows and warm lights in the gym, a fine grain over everything
A missing frame is replaced by the nearest one that exists, so a draft rendered every few frames can be cut too."""
import os, sys, math, argparse, subprocess, shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
CM = os.environ.get('CM') or os.path.join(os.path.dirname(HERE), 'work')
ASSETS = os.path.join(os.path.dirname(HERE), 'assets')
FPS = 24
SEQ = [('S1', 120), ('S2a', 48), ('S2c', 72), ('S2d', 24), ('S3a', 36), ('S3b', 60), ('S4a', 48), ('S4b', 48), ('S4c', 60), ('S4d', 60), ('S5', 72), ('S6', 72)]
STUDIO = ('S3b', 'S4a', 'S4b', 'S4c', 'S4d', 'S6')
START = {}
_g = 0
for _n, _c in SEQ:
    START[_n] = _g
    _g += _c
TOTAL = _g
BLUE = np.array([33, 82, 224], np.float32) / 255
GOLD = np.array([242, 176, 46], np.float32) / 255
rng = np.random.default_rng(5)


def ease(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ease_out(t, p=3):
    t = min(1.0, max(0.0, t))
    return 1 - (1 - t) ** p


def span(f, a, b):
    return min(1.0, max(0.0, (f - a) / float(b - a)))


def lerp(a, b, t):
    return a + (b - a) * t


def where(g):
    for n, c in SEQ:
        if g < START[n] + c:
            return n, g - START[n] + 1
    return SEQ[-1][0], SEQ[-1][1]


# ------------------------------------------------------------------ pictures
class Film:
    def __init__(self, W, render):
        self.W = W
        self.H = int(round(W * 9 / 16 / 2) * 2)
        self.k = W / 1920.0
        self.render = render
        self.cache = {}
        self.fonts = {}
        yy, xx = np.mgrid[0:self.H, 0:W].astype(np.float32)
        self.xx, self.yy = xx, yy
        self.rr = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - self.H / 2) / (self.H / 2)) ** 2) / math.sqrt(2)
        # the distance from the middle as a true circle (0 in the middle, 1 in the corners)
        self.rc = np.sqrt((xx - W / 2) ** 2 + (yy - self.H / 2) ** 2) / (math.hypot(W, self.H) / 2)
        self.streaks = [(rng.uniform(0, math.tau), rng.uniform(0.08, 0.5), rng.uniform(0.25, 1.0), rng.uniform(1.0, 3.2)) for _ in range(90)]
        # points of light that drift up through gymi's world
        self.dots = [dict(x=rng.uniform(0, 1), y=rng.uniform(0, 1), r=rng.uniform(4, 34), a=rng.uniform(0.04, 0.16), v=rng.uniform(0.004, 0.02),
                          c=(BLUE if rng.random() < 0.6 else GOLD if rng.random() < 0.6 else np.ones(3, np.float32)), ph=rng.uniform(0, 6.28)) for _ in range(46)]

    def font(self, size, w=800):
        key = (int(size), w)
        if key not in self.fonts:
            self.fonts[key] = ImageFont.truetype(os.path.join(ASSETS, 'Rubik-%d.ttf' % w), int(size))
        return self.fonts[key]

    def path(self, shot, f):
        d = os.path.join(self.render, shot)
        p = os.path.join(d, '%04d.png' % f)
        if os.path.exists(p):
            return p
        for off in range(1, 80):
            for q in (f - off, f + off):
                p = os.path.join(d, '%04d.png' % q)
                if q >= 1 and os.path.exists(p):
                    return p
        return None

    def load(self, shot, f):
        """a rendered frame as float RGBA, fitted to the film's width"""
        p = self.path(shot, f)
        if p is None:
            return np.zeros((self.H, self.W, 4), np.float32)
        if p in self.cache:
            return self.cache[p]
        im = Image.open(p).convert('RGBA')
        h = int(round(self.W * im.height / im.width))
        if im.width != self.W:
            im = im.resize((self.W, h), Image.LANCZOS)
        a = np.asarray(im, np.float32) / 255
        if h != self.H:                       # a 2.39:1 frame sits in the middle of the 16:9 picture
            full = np.zeros((self.H, self.W, 4), np.float32)
            y0 = (self.H - h) // 2
            full[y0:y0 + h] = a[:self.H - y0]
            full[..., 3] = 1
            a = full
        self.cache = {p: a}
        return a

    def blur(self, a, radius, down=4):
        """a soft blur, done on a small copy"""
        h, w = a.shape[:2]
        im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))
        sm = im.resize((max(2, w // down), max(2, h // down)), Image.BILINEAR).filter(ImageFilter.GaussianBlur(max(0.3, radius / down)))
        return np.asarray(sm.resize((w, h), Image.BILINEAR), np.float32) / 255

    # -------------------------------------------------------------- looks
    def bars(self, a, amount):
        """the black bars of the 2.39:1 frame; amount 1 is closed to 2.39, 0 is the open 16:9 picture"""
        b = int(round((self.H - self.W / 2.39) / 2 * amount))
        if b > 0:
            a[:b] = 0
            a[-b:] = 0
        return a

    def finish(self, a, g, grain=0.016, vig=0.3, bloom=0.55, gym=False, thr=0.7):
        if gym:
            # the gym is lifted where it is dark and left alone where it is bright (a phone's screen must stay readable)
            a = np.clip(a, 0, 1)
            a = a * 1.45 / (1 + 0.45 * a)
        lum = np.clip(a @ np.array([0.2126, 0.7152, 0.0722], np.float32), 0, 1)
        if gym:
            # shadows that lean blue, lights that lean warm
            sh = ((1 - lum) ** 2)[..., None]
            hi = (lum ** 2)[..., None]
            a = a + sh * np.array([-0.010, 0.002, 0.020], np.float32) + hi * np.array([0.030, 0.010, -0.028], np.float32)
        if bloom:
            hot = np.clip(a - thr, 0, 1) * 2.2
            a = a + self.blur(hot, 26 * self.k, 8) * bloom + self.blur(hot, 7 * self.k, 4) * bloom * 0.5
        if vig:
            a = a * (1 - vig * np.clip(self.rr, 0, 1) ** 2.4)[..., None]
        if grain:
            n = rng.standard_normal((self.H // 2 + 1, self.W // 2 + 1)).astype(np.float32)
            n = np.repeat(np.repeat(n, 2, 0), 2, 1)[:self.H, :self.W]
            n = (n + rng.standard_normal((self.H, self.W)).astype(np.float32)) * 0.5
            a = a + (n * grain * (1.0 - 0.55 * np.clip(lum, 0, 1)))[..., None]
        return np.clip(a, 0, 1)

    def world(self, g, warm=1.0, cool=1.0):
        """gymi's world: what is behind the floating phone"""
        t = g / FPS
        W, H = self.W, self.H
        sw, sh = W // 8, H // 8
        y, x = np.mgrid[0:sh, 0:sw].astype(np.float32)
        x /= sw
        y /= sh
        a = np.zeros((sh, sw, 3), np.float32)
        a += np.array([0.012, 0.018, 0.045], np.float32) * (1 - y[..., None] * 0.7)

        def glow(cx, cy, rx, ry, col, amt):
            d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            return np.exp(-d * 2.2)[..., None] * col * amt

        a += glow(0.22 + 0.03 * math.sin(t * 0.5), 0.7 + 0.03 * math.cos(t * 0.4), 0.42, 0.55, BLUE, 0.42 * cool)
        a += glow(0.82 + 0.03 * math.cos(t * 0.45), 0.24 + 0.03 * math.sin(t * 0.38), 0.34, 0.42, GOLD, 0.16 * warm)
        a += glow(0.5, 0.52, 0.3, 0.5, BLUE, 0.16 * cool)
        im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
        # the points of light, soft, out of focus
        lay = Image.new('RGB', (W // 2, H // 2), (0, 0, 0))
        d = ImageDraw.Draw(lay)
        for p in self.dots:
            px = (p['x'] + 0.012 * math.sin(t * 0.7 + p['ph'])) * W / 2
            py = ((p['y'] - p['v'] * t * 2.2) % 1.1 - 0.05) * H / 2
            r = p['r'] * self.k / 2
            al = p['a'] * (0.75 + 0.25 * math.sin(t * 1.3 + p['ph']))
            col = tuple(int(c * 255 * al) for c in p['c'])
            d.ellipse([px - r, py - r, px + r, py + r], fill=col)
        lay = lay.filter(ImageFilter.GaussianBlur(3.2 * self.k)).resize((W, H), Image.BILINEAR)
        return np.asarray(im, np.float32) / 255 + np.asarray(lay, np.float32) / 255

    def over(self, bg, fg, alpha=1.0, spill=0.5):
        """the phone over its world, with the light of its screen spilling behind it"""
        al = fg[..., 3:4] * alpha
        if spill:
            lit = self.blur(fg[..., :3] * fg[..., 3:4], 60 * self.k, 8)
            bg = bg + lit * spill * alpha
        return bg * (1 - al) + fg[..., :3] * al

    def zoomblur(self, a, amount, n=7, cx=0.5, cy=0.5):
        """streaks out of the centre: the picture laid over larger copies of itself"""
        if amount <= 0.002:
            return a
        im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))
        acc = np.zeros_like(a)
        W, H = self.W, self.H
        for i in range(n):
            s = 1 + amount * i / (n - 1)
            w, h = int(W * s), int(H * s)
            big = im.resize((w, h), Image.BILINEAR)
            x0, y0 = int((w - W) * cx), int((h - H) * cy)
            acc += np.asarray(big.crop((x0, y0, x0 + W, y0 + H)), np.float32) / 255
        return acc / n

    def whip(self, a, amount, direction=1):
        """a sideways smear and shove, for the cuts of the montage"""
        if amount <= 0.01:
            return a
        w = max(3, int(amount * self.W * 0.22) | 1)
        sm = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).resize((self.W // 4, self.H // 4), Image.BILINEAR)
        sm = sm.filter(ImageFilter.BoxBlur(max(1, w // 8)) if False else ImageFilter.GaussianBlur(0))
        arr = np.asarray(sm, np.float32) / 255
        kw = max(3, w // 4)
        ker = np.ones(kw, np.float32) / kw
        pad = np.pad(arr, ((0, 0), (kw // 2, kw // 2), (0, 0)), mode='edge')
        cs = np.cumsum(pad, axis=1)
        sm_arr = (cs[:, kw - 1:] - np.concatenate([np.zeros_like(cs[:, :1]), cs[:, :-kw]], 1)) / kw
        out = np.asarray(Image.fromarray(np.clip(sm_arr[:, :arr.shape[1]] * 255, 0, 255).astype(np.uint8)).resize((self.W, self.H), Image.BILINEAR), np.float32) / 255
        shift = int(direction * amount * self.W * 0.18)
        return np.roll(out, shift, axis=1)

    # -------------------------------------------------------------- type
    def wordmark(self, size, by=True, alpha=1.0, by_alpha=1.0):
        """gymi's name as the app writes it: heavy, tight, the i in blue; "by Lior Dahan" under it, small and spaced"""
        f = self.font(size, 800)
        letters = 'gymi'
        track = -0.03 * size
        widths = [f.getlength(c) for c in letters]
        total = sum(widths) + track * (len(letters) - 1)
        pad = int(size * 0.5)
        W, H = int(total + pad * 2), int(size * 1.9 + pad)
        lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        x = pad
        for c, w in zip(letters, widths):
            col = (110, 147, 255, int(255 * alpha)) if c == 'i' else (255, 255, 255, int(255 * alpha))
            d.text((x, pad * 0.5), c, font=f, fill=col)
            x += w + track
        if by and by_alpha > 0:
            fs = self.font(size * 0.2, 500)
            txt = 'BY LIOR DAHAN'
            sp = size * 0.2 * 0.3
            tw = sum(fs.getlength(c) for c in txt) + sp * (len(txt) - 1)
            x = W / 2 - tw / 2
            for c in txt:
                d.text((x, pad * 0.5 + size * 1.28), c, font=fs, fill=(146, 153, 166, int(255 * alpha * by_alpha)))
                x += fs.getlength(c) + sp
        return lay

    def paste(self, a, lay, cx, cy, scale=1.0, alpha=1.0):
        """an RGBA layer onto the picture, centred at cx, cy (in pixels)"""
        if alpha <= 0.003:
            return a
        if abs(scale - 1) > 0.002:
            lay = lay.resize((max(1, int(lay.width * scale)), max(1, int(lay.height * scale))), Image.LANCZOS)
        x0, y0 = int(cx - lay.width / 2), int(cy - lay.height / 2)
        L = np.asarray(lay, np.float32) / 255
        xa, ya = max(0, x0), max(0, y0)
        xb, yb = min(self.W, x0 + lay.width), min(self.H, y0 + lay.height)
        if xb <= xa or yb <= ya:
            return a
        sub = L[ya - y0:yb - y0, xa - x0:xb - x0]
        al = sub[..., 3:4] * alpha
        a[ya:yb, xa:xb] = a[ya:yb, xa:xb] * (1 - al) + sub[..., :3] * al
        return a

    def title(self, a, text, side, f, n):
        """a feature's two words, on the side of the picture the phone is not on"""
        k = self.k
        tin = ease_out(span(f, 5, 17), 3)
        tout = 1 - ease(span(f, n - 5, n))
        al = tin * tout
        if al <= 0.003:
            return a
        font = self.font(104 * k, 800)
        lines = text.split('\n')
        lh = 112 * k
        tw = max(font.getlength(l) for l in lines)
        Wl, Hl = int(tw + 80 * k), int(lh * len(lines) + 90 * k)
        lay = Image.new('RGBA', (Wl, Hl), (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        x0 = 40 * k
        for i, l in enumerate(lines):
            d.text((x0, 8 * k + i * lh), l, font=font, fill=(255, 255, 255, 255))
        # a gold rule that grows under the words
        rw = (tw * 0.34) * ease_out(span(f, 9, 24), 3)
        y = 8 * k + len(lines) * lh + 22 * k
        d.rounded_rectangle([x0, y, x0 + rw, y + 10 * k], radius=5 * k, fill=(242, 176, 46, 255))
        cx = self.W * (0.27 if side > 0 else 0.73) + (1 - tin) * 70 * k * (-1 if side > 0 else 1)
        return self.paste(a, lay, cx, self.H * 0.5, 1.0, al)

    # -------------------------------------------------------------- the shots
    def frame(self, g):
        shot, f = where(g)
        n = dict(SEQ)[shot]
        k = self.k
        W, H = self.W, self.H
        if shot in ('S1', 'S2a', 'S2c', 'S2d'):
            a = self.load(shot, f)[..., :3].copy()
            if shot == 'S1':
                a *= ease(span(f, 0, 5))
            if shot == 'S2c':
                # slow motion is a little paler, and tighter round the phone
                lum = (a @ np.array([0.2126, 0.7152, 0.0722], np.float32))[..., None]
                a = lerp(a, lum, 0.12)
                a = self.finish(a, g, vig=0.45, gym=True, thr=0.94, bloom=0.4)
            elif shot == 'S2d' and f <= 5:
                a = self.finish(a, g, gym=True, thr=0.94, bloom=0.35)
                if f in (3, 4):
                    a = np.clip(a + 0.1 * (5 - f), 0, 1)        # the knock: a blink of light
            else:
                a = self.finish(a, g, gym=True, thr=(0.74 if shot == 'S1' else 0.94), bloom=(0.55 if shot == 'S1' else 0.35))
            return self.bars(a, 1.0)
        if shot == 'S3a':
            if f <= 24:
                a = self.load(shot, f)[..., :3].copy()
                a = self.zoomblur(a, 0.5 * ease(span(f, 9, 24)) ** 2, cx=0.5, cy=0.5)
                a = self.finish(a, g, gym=True, vig=0.3 * (1 - span(f, 14, 24)), thr=0.94, bloom=0.35)
                bl = ease(span(f, 18, 24))
                a = lerp(a, BLUE[None, None, :] * (1.0 + 0.35 * (1 - self.rr[..., None])), bl)
            else:
                # the iris: gymi's blue opens from the middle onto black, and the name is there
                t = (f - 24) / 12.0
                r = ease_out(t * 1.35, 2.2) * 1.25
                edge = np.clip((self.rc - r) / 0.05, 0, 1)[..., None]
                a = BLUE[None, None, :] * (1.0 + 0.35 * (1 - self.rr[..., None])) * edge
                ring = np.exp(-((self.rc - r) / 0.02) ** 2)[..., None]
                a = a + ring * np.array([0.55, 0.7, 1.0], np.float32) * (1 - t) * 0.9
                a = a.astype(np.float32)
                # light flying past as we fall in: thin streaks out of the middle, blue and gold
                if t < 0.85:
                    lay = Image.new('RGB', (W // 2, H // 2), (0, 0, 0))
                    d = ImageDraw.Draw(lay)
                    R0 = math.hypot(W, H) / 4
                    for ang, r0, ln, wd in self.streaks:
                        p0 = (r0 + t * 1.5) % 1.15
                        p1 = p0 + ln * (0.1 + 0.5 * t)
                        if p0 > r * 0.92:
                            continue
                        col = (255, 214, 120) if wd > 2.6 else (150, 185, 255)
                        fade = (1 - t / 0.85) * min(1.0, p0 * 4)
                        col = tuple(int(c * fade * 0.8) for c in col)
                        d.line([W / 4 + math.cos(ang) * p0 * R0, H / 4 + math.sin(ang) * p0 * R0, W / 4 + math.cos(ang) * min(p1, r) * R0, H / 4 + math.sin(ang) * min(p1, r) * R0], fill=col, width=max(1, int(wd * k / 2 + 0.5)))
                    lay = lay.filter(ImageFilter.GaussianBlur(0.8 * k)).resize((W, H), Image.BILINEAR)
                    a = a + np.asarray(lay, np.float32) / 255
                la = ease(span(t, 0.22, 0.6))
                lay = self.wordmark(170 * k, True, 1.0, ease(span(t, 0.55, 0.95)))
                a = self.paste(a, lay, W / 2, H / 2, lerp(1.3, 1.0, ease_out(span(t, 0.22, 0.8), 3)), la)
                a = self.finish(a, g, vig=0.2, bloom=0.4)
            return self.bars(a, 1 - ease(span(f, 17, 29)))
        if shot in STUDIO:
            fg = self.load(shot, f)
            if shot == 'S6':
                a = self.world(g, warm=1.2, cool=1.1) * ease(span(f, 0, 6))
                a = self.over(a, fg, ease(span(f, 0, 5)), spill=0.45)
                # the end card: the name, large, and one line
                t = span(f, 30, 50)
                if t > 0:
                    al = ease(t)
                    lay = self.wordmark(250 * k, False, 1.0)
                    cx = W * 0.665 + (1 - ease_out(t, 3)) * 60 * k
                    a = self.paste(a, lay, cx, H * 0.43, 1.0, al)
                    fnt = self.font(52 * k, 500)
                    line = 'Level up your fitness.'
                    tl = Image.new('RGBA', (int(fnt.getlength(line) + 40 * k), int(90 * k)), (0, 0, 0, 0))
                    ImageDraw.Draw(tl).text((20 * k, 10 * k), line, font=fnt, fill=(214, 222, 240, 255))
                    a = self.paste(a, tl, W * 0.665 + (1 - ease_out(span(f, 36, 56), 3)) * 40 * k, H * 0.615, 1.0, ease(span(f, 36, 54)))
                a = self.finish(a, g, vig=0.42, bloom=0.3, thr=0.86)
                return a * (1 - ease(span(f, 60, 72)))
            a = self.world(g)
            if shot == 'S3b':
                al = ease(span(f, 1, 9))
                a = self.over(a * al, fg, al, spill=0.5)
                # the name we came in on swells and is gone
                la = 1 - ease(span(f, 0, 9))
                if la > 0:
                    a = self.paste(a, self.wordmark(170 * k, True, 1.0), W / 2, H / 2, lerp(1.0, 1.7, ease(span(f, 0, 10))), la)
            else:
                a = self.over(a, fg, 1.0, spill=0.5)
                side = {'S4a': 1, 'S4b': -1, 'S4c': 1, 'S4d': -1}[shot]
                words = {'S4a': 'Your\ncharacter.', 'S4b': 'Your\nplan.', 'S4c': 'Your\ncoach.', 'S4d': 'Your\ngame.'}[shot]
                a = self.title(a, words, side, f, n)
                if shot == 'S4d':
                    # the turn of the phone is covered by a blink of gold
                    fl = math.exp(-((f - 30) / 2.6) ** 2)
                    a = a + fl * 0.5 * (GOLD[None, None, :] * 0.6 + 0.4) * (1 - self.rr[..., None] * 0.6)
            a = self.finish(a, g, vig=0.36, bloom=0.3, grain=0.012, thr=0.86)
            # whips on the cuts inside the montage, alternating sides
            if shot in ('S4a', 'S4b', 'S4c', 'S4d'):
                d = {'S4a': 1, 'S4b': -1, 'S4c': 1, 'S4d': -1}[shot]
                if f <= 3:
                    a = self.whip(a, (4 - f) / 3.0 * 0.9, -d)
                if f > n - 2 and shot != 'S4d':
                    a = self.whip(a, (f - (n - 2)) / 2.0 * 0.8, -d)
            if shot == 'S3b' and f > n - 2:
                a = self.whip(a, (f - (n - 2)) / 2.0 * 0.8, 1)
            if shot == 'S4d' and f > n - 5:
                # out of gymi's world: the picture rushes at us and goes white
                t = (f - (n - 5)) / 5.0
                a = self.zoomblur(a, 0.6 * t ** 2)
                a = np.clip(a + t ** 2 * 0.9, 0, 1)
            return a
        if shot == 'S5':
            a = self.load(shot, f)[..., :3].copy()
            a = self.zoomblur(a, 0.35 * (1 - ease(span(f, 1, 12))) ** 2)
            a = self.finish(a, g, gym=True, vig=0.3 * ease(span(f, 4, 20)), thr=lerp(0.94, 0.78, ease(span(f, 30, 44))), bloom=0.4)
            a = np.clip(a + (1 - ease(span(f, 0, 6))) * 0.9, 0, 1)      # out of the white
            a = self.bars(a, ease(span(f, 4, 22)))
            if f > n - 3:
                a = a * (1 - (f - (n - 3)) / 3.0)
            return a
        return np.zeros((H, W, 3), np.float32)


def ffmpeg_exe():
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        raise SystemExit('ffmpeg not found: install it, or pip install imageio-ffmpeg')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--res', type=int, default=1920)
    ap.add_argument('--render', default=os.path.join(CM, 'render'))
    ap.add_argument('--audio', default=os.path.join(CM, 'audio', 'mix.wav'))
    ap.add_argument('--out', default=os.path.join(CM, 'gymi-commercial.mp4'))
    ap.add_argument('--crf', type=int, default=14)
    ap.add_argument('--frames', default='')
    ap.add_argument('--stills', default='')
    a = ap.parse_args()
    film = Film(a.res, a.render)
    lo, hi = 0, TOTAL - 1
    if a.frames:
        lo, hi = (int(x) for x in a.frames.split('-'))
    if a.stills:
        os.makedirs(a.stills, exist_ok=True)
        for g in range(lo, hi + 1):
            Image.fromarray((np.clip(film.frame(g), 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(a.stills, '%04d.png' % g))
        return
    cmd = [ffmpeg_exe(), '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (film.W, film.H), '-r', str(FPS), '-i', '-']
    if os.path.exists(a.audio) and not a.frames:
        cmd += ['-i', a.audio, '-c:a', 'aac', '-b:a', '256k']
    cmd += ['-c:v', 'libx264', '-preset', 'slow', '-crf', str(a.crf), '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
            '-movflags', '+faststart', '-shortest', a.out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for g in range(lo, hi + 1):
        p.stdin.write((np.clip(film.frame(g), 0, 1) * 255 + 0.5).astype(np.uint8).tobytes())
        if g % 48 == 0:
            print('frame', g, flush=True)
    p.stdin.close()
    p.wait()
    print('wrote', a.out)


if __name__ == '__main__':
    main()
