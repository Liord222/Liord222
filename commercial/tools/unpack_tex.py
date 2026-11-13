"""Unpacks commercial/tex-pack into work/tex/<shot>/0001.jpg ..., the image sequences the phone's screen plays.
python unpack_tex.py"""
import os, json
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.join(HERE, '..', 'tex-pack')
CM = os.environ.get('CM') or os.path.join(HERE, '..', 'work')
man = json.load(open(os.path.join(PACK, 'manifest.json')))
for shot, ids in man.items():
    out = os.path.join(CM, 'tex', shot)
    os.makedirs(out, exist_ok=True)
    last, im = None, None
    for i, key in enumerate(ids):
        if key != last:
            im = Image.open(os.path.join(PACK, key + '.webp')).convert('RGB')
            last = key
        im.save(os.path.join(out, '%04d.jpg' % (i + 1)), quality=94)
    print(shot, len(ids))
