"""Turns captured app frames into phone-screen textures: the iPhone 17 Pro status bar (time, signal, battery), the
Dynamic Island, and the home indicator, drawn over the frame the way the phone draws them.
    python screens.py <in.png> <out.jpg>          (one frame)
    from screens import screenify                  (in a pipeline)"""
import sys
from PIL import Image, ImageDraw, ImageFont
import os

ASSETS = os.path.join(os.path.dirname(__file__), '..', 'assets')
_font = {}


def font(size, w=700):
    k = (size, w)
    if k not in _font:
        _font[k] = ImageFont.truetype(os.path.join(ASSETS, 'Rubik-%d.ttf' % w), size)
    return _font[k]


def screenify(im, island=True, home=True, status=True):
    """im: an RGB image of the 402×874 pt screen at any scale. Returns a new RGB image."""
    im = im.convert('RGB').copy()
    s = im.width / 402.0
    d = ImageDraw.Draw(im)
    # what is behind the status bar decides its ink
    px = im.resize((40, 4), Image.BILINEAR, box=(0, 0, im.width, int(50 * s))).getdata()
    lum = sum(0.3 * r + 0.59 * g + 0.11 * b for r, g, b in px) / len(px)
    ink = (255, 255, 255) if lum < 120 else (14, 17, 22)
    if status:
        # time, left of the island
        f = font(int(17 * s), 700)
        d.text((int(52 * s), int(31 * s)), '9:41', font=f, fill=ink, anchor='mm')
        # signal bars
        x0, yb = 300 * s, 37 * s
        for i in range(4):
            h = (4 + i * 2.6) * s
            d.rounded_rectangle([x0 + i * 4.6 * s, yb - h, x0 + i * 4.6 * s + 3.2 * s, yb], radius=1 * s, fill=ink)
        # wifi: three arcs and a dot
        cx, cy = 333 * s, 37 * s
        for i, r in enumerate((10.5, 7, 3.5)):
            d.arc([cx - r * s, cy - r * s - 3 * s, cx + r * s, cy + r * s - 3 * s], 225, 315, fill=ink, width=int(2.3 * s))
        d.ellipse([cx - 1.6 * s, cy - 4.2 * s, cx + 1.6 * s, cy - 1.0 * s], fill=ink)
        # battery
        bx, by = 350 * s, 26.5 * s
        d.rounded_rectangle([bx, by, bx + 25 * s, by + 12 * s], radius=3.5 * s, outline=ink, width=max(1, int(1.1 * s)))
        d.rounded_rectangle([bx + 2 * s, by + 2 * s, bx + 20 * s, by + 10 * s], radius=2 * s, fill=ink)
        d.rounded_rectangle([bx + 26 * s, by + 4 * s, bx + 27.6 * s, by + 8 * s], radius=0.8 * s, fill=ink)
    if island:
        w, h, y = 125 * s, 37 * s, 11 * s
        d.rounded_rectangle([im.width / 2 - w / 2, y, im.width / 2 + w / 2, y + h], radius=h / 2, fill=(0, 0, 0))
    if home:
        # the home indicator takes the ink that reads on what is behind it
        px = im.resize((20, 2), Image.BILINEAR, box=(int(130 * s), int(858 * s), int(272 * s), int(866 * s))).getdata()
        lb = sum(0.3 * r + 0.59 * g + 0.11 * b for r, g, b in px) / len(px)
        hc = (255, 255, 255) if lb < 120 else (14, 17, 22)
        w, h = 139 * s, 5 * s
        d.rounded_rectangle([im.width / 2 - w / 2, 866 * s - h, im.width / 2 + w / 2, 866 * s], radius=h / 2, fill=hc)
    return im


if __name__ == '__main__':
    screenify(Image.open(sys.argv[1])).save(sys.argv[2], quality=94)
