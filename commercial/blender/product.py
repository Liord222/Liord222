"""The 3D shots of gymi's product film: the phone alone in a black studio, lit the way a product is lit, on a
transparent film (the black and the words are added in the edit, edit/product.py).
    blender -b --factory-startup --python product.py -- <shot> [--res 1920] [--samples 32] [--frames 1-48] [--step 1]
The studio is neutral: one broad soft key above, two tall white strips behind that draw the phone's edges, and white
cards seen only in the glass. No brand colour in the light; the blue is the phone's own body and the app's screens.
In the world of these shots +Y is up and the phone faces +Z, as in shots.py."""
import sys, os, math, time, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector
from kit import reset, render_settings, camera, look_at, world_color, area_light, plane, emission
import phone as PH
from shots import ease, ease_out, ease_in, span, lerp, bake_cam, bake_obj, screen_seq, hero, orbit, UP, use_gpu, R

SP = os.environ.get('CM') or os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'work')
WHITE = (1.0, 0.985, 0.97)
COOL = (0.92, 0.95, 1.0)


def studio(key=55.0, rim=40.0, cards=1.6):
    world_color((0.0012, 0.0012, 0.0014), 1.0)
    k = area_light('key', 1.1, (0.0, 0.55, 0.55), energy=key, size_y=0.28, color=WHITE)
    look_at(k, (0, 0, 0))
    k.visible_glossy = True
    rims = []
    for sx in (-1, 1):
        r = area_light('rim%d' % sx, 0.06, (sx * 0.55, 0.05, -0.32), energy=rim, color=COOL, size_y=1.1)
        look_at(r, (0, 0, 0))
        rims.append(r)
    m = emission('card', (1, 1, 1), cards)
    for sx in (-1, 1):
        c = plane('card%d' % sx, 0.22, 1.1, (sx * 0.42, 0.0, 0.42), mat=m)
        look_at(c, (0, 0, 0))
        c.rotation_euler.rotate_axis('X', math.pi)
        c.visible_camera = False
        c.visible_diffuse = False
        c.visible_shadow = False
    return k, rims


def phone(a, name, n, strength=1.0):
    root, scr = PH.build(screen_mat=screen_seq(os.path.join(a.tex, name), n, strength))
    return root


def P1(a):
    """The reveal. Black; a thin line of light slides along the back of the phone, over the lenses, down the frame.
    The phone turns, slowly, and shows its face: the screen wakes on gymi's name."""
    n = 84
    k, rims = studio(key=0.0, rim=0.0, cards=0.3)
    # the rims come up as the phone turns; the left one waits until the front has turned past it (on the way the
    # glass mirrors it: a white block across the screen)
    for r, (a0, a1) in zip(rims, ((66, 78), (30, 72))):
        r.data.energy = 0.0
        r.data.keyframe_insert('energy', frame=a0)
        r.data.energy = 40.0
        r.data.keyframe_insert('energy', frame=a1)
    k.data.energy = 0.0
    k.data.keyframe_insert('energy', frame=44)
    k.data.energy = 18.0
    k.data.keyframe_insert('energy', frame=80)
    # the sweep: a long thin strip of light that crosses in front of the phone, from right to left
    sw = area_light('sweep', 0.025, (0.4, 0.0, 0.3), energy=0.0, color=WHITE, size_y=0.9)
    for f in range(0, n + 2, 2):
        t = ease(span(f, 0, 46))
        sw.location = (lerp(0.42, -0.42, t), 0.06, 0.32)
        look_at(sw, (0, 0, 0))
        sw.keyframe_insert('location', frame=f)
        sw.keyframe_insert('rotation_euler', frame=f)
        sw.data.energy = 26.0 * math.sin(math.pi * span(f, 0, 50)) ** 0.7
        sw.data.keyframe_insert('energy', frame=f)
    root = phone(a, 'P1', n)

    def ph(f):
        t = ease(span(f, 30, 80))
        d, e = hero(f, n, 0.5)
        return d, (lerp(R(-12), R(-3), t) + e[0], lerp(R(215), R(360 - 8), t) + e[1], lerp(R(-6), R(1), t) + e[2])
    bake_obj(root, n, ph)
    cam = camera(lens=85, fstop=2.8, focus=0.3)

    def fn(f):
        t = ease(span(f, 0, 84))
        dist = lerp(0.3, 0.62, ease_in(span(f, 10, 84), 1.4))
        tgt = Vector((0.0, lerp(0.045, 0.0, t), 0.0))      # from the lenses to the whole phone
        loc = orbit(tgt, lerp(R(-8), R(0), t), dist, 0.0)
        return dict(loc=loc, target=tgt, up=UP, roll=lerp(R(-4), 0, t), focus=(loc - Vector((0, tgt.y, 0))).length, fstop=lerp(2.8, 5.6, t))
    bake_cam(cam, n, fn)
    return n


def top(a, name, n, d0, d1, low=0.05, rise=0.0, yaw0=-10, yaw1=6, tilt=-6, lens=60, key=55.0):
    """the phone low in the picture, the words above it: the camera eases in; the phone may rise into place"""
    studio(key=key)
    root = phone(a, name, n)

    def ph(f):
        d, e = hero(f, n, 0.8)
        t = f / n
        up = ease_out(span(f, 0, 40), 3.0)
        return d + Vector((0, -rise * (1 - up), 0)), (R(tilt) + e[0], lerp(R(yaw0), R(yaw1), ease(t)) + e[1], e[2])
    bake_obj(root, n, ph)
    cam = camera(lens=lens, fstop=5.6, focus=0.6)

    def fn(f):
        t = ease(f / n)
        dist = lerp(d0, d1, t)
        tgt = Vector((0.0, low, 0.0))
        loc = orbit(tgt, lerp(R(4), R(-3), t), dist, 0.0)
        return dict(loc=loc, target=tgt, up=UP, focus=loc.length)
    bake_cam(cam, n, fn)
    return n


def side(a, name, n, s, yaw0, yaw1, d0, d1, ang0, ang1, tilt=-5, lens=60):
    """the phone on one side, the words on the other; s=-1 puts the phone on the left (the words, in Hebrew, on the
    right, where they begin)"""
    studio()
    root = phone(a, name, n)

    def ph(f):
        d, e = hero(f, n, 0.8)
        return d, (R(tilt) + e[0], lerp(R(yaw0), R(yaw1), ease(f / n)) + e[1], R(1.0) * s + e[2])
    bake_obj(root, n, ph)
    cam = camera(lens=lens, fstop=5.6, focus=0.6)

    def fn(f):
        t = ease(f / n)
        dist = lerp(d0, d1, t)
        tgt = Vector((-s * dist * 0.125, 0.0, 0))
        loc = orbit(tgt, lerp(R(ang0), R(ang1), t), dist, 0.0)
        return dict(loc=loc, target=tgt, up=UP, focus=(Vector((0, 0, 0)) - loc).length)
    bake_cam(cam, n, fn)
    return n


def P2(a):
    """Meet gymi: the curtain lifts, the character falls in, Eilon arrives. The phone low, the name above."""
    return top(a, 'P2', 84, 0.5, 0.45, low=0.056, yaw0=-8, yaw1=5)


def P3(a):
    """Your character: the designer, choice by choice. The phone on the left."""
    return side(a, 'P3', 96, -1, 20, 4, 0.6, 0.54, 10, -2)


def P4(a):
    """Your plan: the phone rises into the picture from below while Eilon lays out the plan."""
    return top(a, 'P4', 84, 0.49, 0.45, low=0.056, rise=0.12, yaw0=8, yaw1=-5)


def P5(a):
    """Swap: the exercise, Swap, the choices, one tap. The phone on the right."""
    return side(a, 'P5', 96, 1, -20, -4, 0.6, 0.54, -10, 2)


def P6(a):
    """The game: a set, the points, the level; the workout complete. The phone low, the words above."""
    return top(a, 'P6', 96, 0.5, 0.45, low=0.056, yaw0=-10, yaw1=8)


def P7(a):
    """Home: the phone in the middle, turning away a little as the camera draws back; the edit fades it out."""
    n = 48
    studio(key=50.0)
    root = phone(a, 'P7', n)

    def ph(f):
        d, e = hero(f, n, 0.6)
        return d, (R(-4) + e[0], lerp(R(-4), R(-22), ease(f / n)) + e[1], e[2])
    bake_obj(root, n, ph)
    cam = camera(lens=60, fstop=5.6, focus=0.6)

    def fn(f):
        dist = lerp(0.5, 0.66, ease(f / n))
        loc = orbit((0, 0, 0), lerp(R(-2), R(4), ease(f / n)), dist, 0.0)
        return dict(loc=loc, target=(0, 0, 0), up=UP, focus=dist)
    bake_cam(cam, n, fn)
    return n


SHOTS = dict(P1=P1, P2=P2, P3=P3, P4=P4, P5=P5, P6=P6, P7=P7)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('shot')
    ap.add_argument('--res', type=int, default=1920)
    ap.add_argument('--samples', type=int, default=32)
    ap.add_argument('--frames', default='')
    ap.add_argument('--step', type=int, default=1)
    ap.add_argument('--out', default=os.path.join(SP, 'render-product'))
    ap.add_argument('--tex', default=os.path.join(SP, 'tex'))
    ap.add_argument('--device', default='auto')
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    a = ap.parse_args(argv)
    s = reset()
    render_settings(s, a.res, round(a.res * 9 / 16), a.samples, transparent=True, blur=True, view='Standard', look=('None',), threshold=0.03, bounces=(4, 2, 3, 4))
    if a.device != 'cpu':
        use_gpu(s)
    n = SHOTS[a.shot](a)
    s.frame_start, s.frame_end = 1, n
    fr = range(1, n + 1, a.step)
    if a.frames:
        lo, hi = (int(x) for x in a.frames.split('-'))
        fr = range(lo, hi + 1, a.step)
    out = os.path.join(a.out, a.shot)
    os.makedirs(out, exist_ok=True)
    t0 = time.time()
    for f in fr:
        dst = os.path.join(out, '%04d.png' % f)
        if os.path.exists(dst) and os.path.getsize(dst) > 1000 and not os.environ.get('REDO'):
            continue
        s.frame_set(f)
        s.render.filepath = dst
        t = time.time()
        bpy.ops.render.render(write_still=True)
        print('FRAME', a.shot, f, round(time.time() - t, 1), 's', flush=True)
    print('DONE', a.shot, len(list(fr)), 'frames', round(time.time() - t0), 's', flush=True)


if __name__ == '__main__':
    main()
