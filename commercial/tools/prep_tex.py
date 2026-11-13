"""Builds the phone-screen texture sequence of every shot from the captured app takes: each film frame of a shot
gets the app frame it should show (takes can be sped up, held or joined), with the status bar, the Dynamic Island
and the home indicator drawn on. Files are numbered by the shot's own frame, from 0001, so Blender can play them
as an image sequence that starts at frame 1.
    python prep_tex.py [shot ...]"""
import os, sys, json
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ui'))
from screens import screenify

SP = os.environ.get('CM') or os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'work')
UI, TEX = os.path.join(SP, 'ui'), os.path.join(SP, 'tex')


def seg(take, a, b, n):
    """n film frames that play take frames a..b (inclusive), evenly"""
    return [(take, round(a + (b - a) * i / max(1, n - 1))) for i in range(n)]


def hold(take, f, n):
    return [(take, f)] * n


# what each shot's screen shows, frame by frame (the frame counts match shots.py)
SHOTS = {
    'S2a': hold('search/plain', 0, 48),
    'S2c': hold('search/plain', 0, 72),
    'S2d': hold('search/plain', 0, 12) + hold('search/glow', 0, 12),
    'S3a': hold('search/glow', 0, 36),
    'S3b': seg('welcome', 44, 108, 60),
    'S4a': seg('character', 2, 65, 48),
    'S4b': seg('plan', 4, 83, 48),
    'S4c': seg('swap', 26, 100, 60),
    'S4d': seg('set', 4, 46, 30) + seg('done', 7, 50, 30),
    'S5': seg('smith', 0, 71, 72),
    'S6': seg('home', 0, 71, 72),
}


def frame_path(take, f):
    if take.startswith('search/'):
        return os.path.join(UI, take + '.png')
    return os.path.join(UI, take, '%04d.png' % f)


def build(name):
    out = os.path.join(TEX, name)
    os.makedirs(out, exist_ok=True)
    cache = {}
    for i, (take, f) in enumerate(SHOTS[name]):
        src = frame_path(take, f)
        if src not in cache:
            cache.clear()
            cache[src] = screenify(Image.open(src))
        cache[src].save(os.path.join(out, '%04d.jpg' % (i + 1)), quality=93)
    json.dump({'frames': len(SHOTS[name])}, open(os.path.join(out, 'info.json'), 'w'))
    print(name, len(SHOTS[name]))


if __name__ == '__main__':
    for n in (sys.argv[1:] or list(SHOTS)):
        build(n)
