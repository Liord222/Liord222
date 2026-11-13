"""Rows of frames, one row per folder: python row.py out.png dir [dir ...]   (frame height 200)"""
import sys, os
from PIL import Image
out, dirs = sys.argv[1], sys.argv[2:]
H = int(os.environ.get('H', 200))
rows = []
for d in dirs:
    fs = sorted(f for f in os.listdir(d) if f.endswith('.png'))
    ims = []
    for f in fs:
        im = Image.open(os.path.join(d, f)).convert('RGBA')
        bg = Image.new('RGBA', im.size, (40, 44, 60, 255)); bg.alpha_composite(im)
        ims.append(bg.convert('RGB').resize((round(im.width * H / im.height), H)))
    rows.append(ims)
W = max(sum(i.width + 4 for i in r) for r in rows)
s = Image.new('RGB', (W, len(rows) * (H + 4)), (90, 90, 90))
for y, r in enumerate(rows):
    x = 0
    for im in r:
        s.paste(im, (x, y * (H + 4))); x += im.width + 4
s.save(out); print(out, s.size)
