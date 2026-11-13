"""Packs the phone-screen textures of every shot into commercial/tex-pack (WebP, each different picture once), so the
film can be rendered on another machine without capturing the app again.   python pack_tex.py"""
import os, sys, json
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import prep_tex as P
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ui'))
from screens import screenify

OUT = os.path.join(os.path.dirname(__file__), '..', 'tex-pack')
os.makedirs(OUT, exist_ok=True)
manifest, done = {}, set()
for shot, frames in P.SHOTS.items():
    ids = []
    for take, f in frames:
        key = take.replace('/', '-') + ('' if take.startswith('search/') else '-%04d' % f)
        ids.append(key)
        if key not in done:
            done.add(key)
            screenify(Image.open(P.frame_path(take, f))).save(os.path.join(OUT, key + '.webp'), quality=90, method=4)
    manifest[shot] = ids
json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'))
print(len(done), 'pictures', sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, 'KB')
