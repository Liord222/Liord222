"""Contact sheet of a frame folder: python sheet.py <dir> <out.png> [every] [height]"""
import sys, os
from PIL import Image

d, out = sys.argv[1], sys.argv[2]
every = int(sys.argv[3]) if len(sys.argv) > 3 else 8
H = int(sys.argv[4]) if len(sys.argv) > 4 else 360
fs = sorted(f for f in os.listdir(d) if f.endswith('.png'))[::every]
ims = []
for f in fs:
    im = Image.open(os.path.join(d, f)).convert('RGB')
    ims.append(im.resize((round(im.width * H / im.height), H)))
cols = min(len(ims), 10)
rows = (len(ims) + cols - 1) // cols
w = ims[0].width
s = Image.new('RGB', (cols * (w + 6), rows * (H + 6)), (90, 90, 90))
for i, im in enumerate(ims):
    s.paste(im, ((i % cols) * (w + 6), (i // cols) * (H + 6)))
s.save(out)
print(out, len(ims))
