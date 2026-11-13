"""The edit of gymi's product film: the phone on black, the words in Hebrew, the soundtrack.
    python product.py [--res 1920] [--render DIR] [--audio product.wav] [--out gymi-product.mp4] [--frames a-b] [--stills DIR]
The film, 30 seconds, every cut on a beat of the music:
  0:00   two lines on black: "לא צריך לדעת הכול." / "צריך רק להתחיל."
  0:03   P1  the reveal: a line of light slides over the back of the phone; it turns; the screen wakes on the name
  0:06.5 P2  "הכירו את gymi." above the phone; the opening of the app
  0:10   P3  your character (the phone on the left, the words on the right)
  0:14   P4  your plan (the phone rises from below)
  0:17.5 P5  swap (the phone on the right, the words on the left)
  0:21.5 P6  the game
  0:25.5 P7  home; the picture goes to black
  0:27.5 the name, and the line under it
The words are pictures set by a browser (ui/titles.js), because Hebrew has to be shaped right to left; the phone is
rendered on a transparent film (blender/product.py). Everything else is done here."""
import os, sys, math, argparse, subprocess
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make import Film, ease, ease_out, span, lerp, ffmpeg_exe, rng, CM, FPS

SEQ = [('open', 72), ('P1', 84), ('P2', 84), ('P3', 96), ('P4', 84), ('P5', 96), ('P6', 96), ('P7', 48), ('end', 60)]
START, _g = {}, 0
for _n, _c in SEQ:
    START[_n] = _g
    _g += _c
TOTAL = _g


def where(g):
    for n, c in SEQ:
        if g < START[n] + c:
            return n, g - START[n] + 1, c
    return SEQ[-1][0], SEQ[-1][1], SEQ[-1][1]


class Product(Film):
    def __init__(self, W, render, titles):
        super().__init__(W, render)
        self.titles = titles
        self.tl = {}
        # the black is not quite black: a soft lift in the middle, like a stage
        lift = np.exp(-((self.xx - W / 2) ** 2 / (0.5 * W) ** 2 + (self.yy - self.H * 0.55) ** 2 / (0.6 * self.H) ** 2))
        self.stage = (lift[..., None] * np.array([0.030, 0.031, 0.036], np.float32)).astype(np.float32)

    def layer(self, id_):
        if id_ not in self.tl:
            self.tl[id_] = Image.open(os.path.join(self.titles, id_ + '.png')).convert('RGBA')
        return self.tl[id_]

    def words(self, a, id_, f, t_in, t_out, x, y, anchor='c', rise=22):
        """a line that arrives the way a product film's words do: from a little lower, out of a soft blur, and
        leaves by fading. x, y is where its anchor lands: 'c' its centre, 'r' its right edge, 'l' its left edge;
        y is always its top"""
        tin = ease_out(span(f, t_in, t_in + 16), 2.6)
        tout = 1 - ease(span(f, t_out, t_out + 8)) if t_out else 1.0
        al = tin * tout
        if al <= 0.003:
            return a
        lay = self.layer(id_)
        if tin < 0.999:
            lay = lay.filter(ImageFilter.GaussianBlur((1 - tin) * 9 * self.k))
        cx = {'c': x, 'r': x - lay.width / 2, 'l': x + lay.width / 2}[anchor]
        cy = y + lay.height / 2 + (1 - tin) * rise * self.k
        return self.paste(a, lay, cx, cy, 1.0, al)

    def phone(self, shot, f, alpha=1.0):
        fg = self.load(shot, f)
        return self.over(self.stage.copy(), fg, alpha, spill=0.07)

    def head_sub(self, a, h, s, f, n, layout, t0=8):
        W, H, k = self.W, self.H, self.k
        out = n - 8
        if layout == 'top':
            a = self.words(a, h, f, t0, out, W / 2, H * 0.085)
            a = self.words(a, s, f, t0 + 8, out, W / 2, H * 0.085 + self.layer(h).height - 6 * k)
        else:
            # the block of words in the half the phone is not in; Hebrew lines keep to the right of the block
            bw = max(self.layer(h).width, self.layer(s).width)
            right = W * 0.9 if layout == 'right' else W * 0.1 + bw
            top = H / 2 - (self.layer(h).height + self.layer(s).height) / 2
            a = self.words(a, h, f, t0, out, right, top, 'r')
            a = self.words(a, s, f, t0 + 8, out, right, top + self.layer(h).height + 4 * k, 'r')
        return a

    def frame(self, g):
        shot, f, n = where(g)
        W, H, k = self.W, self.H, self.k
        if shot == 'open':
            a = self.stage.copy() * 0.6
            a = self.words(a, 'o1', f, 4, 32, W / 2, H / 2 - self.layer('o1').height / 2)
            a = self.words(a, 'o2', f, 38, 66, W / 2, H / 2 - self.layer('o2').height / 2)
            return self.finish(a, g, grain=0.008, vig=0.0, bloom=0.0)
        if shot == 'end':
            a = self.stage.copy() * 0.8
            tin = ease_out(span(f, 3, 22), 2.4)
            mark = self.wordmark(150 * k, by=True, alpha=1.0, by_alpha=ease(span(f, 14, 30)))
            a = self.paste(a, mark, W / 2, H * 0.45, lerp(1.05, 1.0, tin), tin)
            a = self.words(a, 'end', f, 16, None, W / 2, H * 0.45 + mark.height * 0.42)
            a = a * (1 - ease(span(f, n - 12, n)))
            return self.finish(a, g, grain=0.008, vig=0.0, bloom=0.2, thr=0.8)
        a = self.phone(shot, f)
        if shot == 'P1':
            a = a * ease(span(f, 0, 10))
        if shot == 'P2':
            a = self.head_sub(a, 'p2h', 'p2s', f, n, 'top', 14)
        if shot == 'P3':
            a = self.head_sub(a, 'p3h', 'p3s', f, n, 'right')
        if shot == 'P4':
            a = self.head_sub(a, 'p4h', 'p4s', f, n, 'top', 12)
        if shot == 'P5':
            a = self.head_sub(a, 'p5h', 'p5s', f, n, 'left')
        if shot == 'P6':
            a = self.head_sub(a, 'p6h', 'p6s', f, n, 'top')
        if shot == 'P7':
            a = a * (1 - ease(span(f, n - 18, n)))
        return self.finish(a, g, grain=0.008, vig=0.12, bloom=0.22, thr=0.88)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--res', type=int, default=1920)
    ap.add_argument('--render', default=os.path.join(CM, 'render-product'))
    ap.add_argument('--titles', default='')
    ap.add_argument('--audio', default=os.path.join(CM, 'audio', 'product.wav'))
    ap.add_argument('--out', default=os.path.join(CM, 'gymi-product.mp4'))
    ap.add_argument('--crf', type=int, default=14)
    ap.add_argument('--frames', default='')
    ap.add_argument('--stills', default='')
    a = ap.parse_args()
    film = Product(a.res, a.render, a.titles or os.path.join(CM, 'titles', str(a.res)))
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
