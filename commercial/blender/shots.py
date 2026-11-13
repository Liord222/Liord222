"""Every 3D shot of the gymi commercial. One process per shot:
    python shots.py <shot> [--res 1920] [--samples 24] [--frames 1-48] [--out DIR] [--tex DIR] [--step 1]
Gym shots (S1, S2a, S2c, S2d, S3a, S5) are rendered with the room; studio shots (S3b, S4a..S4d, S6) render the phone
alone on a transparent film, and the world behind it is added in the edit (edit/comp.py).
Frames are numbered from 1 within each shot. The camera and the phone are baked per frame from plain functions of
the frame number, so a shot reads top to bottom as what happens in it."""
import sys, os, math, time, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector, Euler, Quaternion
from kit import reset, render_settings, camera, look_at, world_color, area_light
import phone as PH

SP = os.environ.get('CM') or os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'work')
R = math.radians


# ------------------------------------------------------------------ small tools
def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def ease_out(t, p=3):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** p


def ease_in(t, p=3):
    t = max(0.0, min(1.0, t))
    return t ** p


def lerp(a, b, t):
    return a + (b - a) * t


def vlerp(a, b, t):
    return Vector(a).lerp(Vector(b), t)


def span(f, a, b):
    """0 before frame a, 1 after frame b"""
    return max(0.0, min(1.0, (f - a) / float(b - a)))


def wobble(f, seed=0.0, amp=1.0):
    """a hand that is never quite still: a few slow sines, in three axes"""
    t = f / 24.0
    return Vector((
        math.sin(t * 1.7 + seed) * 0.6 + math.sin(t * 3.1 + seed * 2.3) * 0.3 + math.sin(t * 6.3 + seed * 0.7) * 0.1,
        math.sin(t * 1.3 + seed * 1.9) * 0.6 + math.sin(t * 2.7 + seed * 0.4) * 0.3 + math.sin(t * 5.9 + seed * 3.1) * 0.1,
        math.sin(t * 1.1 + seed * 0.6) * 0.6 + math.sin(t * 3.7 + seed * 1.3) * 0.3 + math.sin(t * 7.1 + seed * 2.9) * 0.1)) * amp


def bake_cam(cam, n, fn):
    """fn(f) -> dict(loc, target, roll=0, lens=None, focus=None, fstop=None)"""
    cd = cam.data
    for f in range(0, n + 2):
        d = fn(f)
        cam.location = d['loc']
        look_at(cam, d['target'], d.get('roll', 0.0), d.get('up'))
        cam.keyframe_insert('location', frame=f)
        cam.keyframe_insert('rotation_euler', frame=f)
        if d.get('lens'):
            cd.lens = d['lens']
            cd.keyframe_insert('lens', frame=f)
        if d.get('focus') is not None:
            cd.dof.focus_distance = d['focus']
            cd.dof.keyframe_insert('focus_distance', frame=f)
        if d.get('fstop'):
            cd.dof.aperture_fstop = d['fstop']
            cd.dof.keyframe_insert('aperture_fstop', frame=f)


def bake_obj(ob, n, fn):
    """fn(f) -> (loc, quaternion or euler)"""
    ob.rotation_mode = 'QUATERNION'
    prev = None
    for f in range(0, n + 2):
        loc, rot = fn(f)
        q = rot if isinstance(rot, Quaternion) else Euler(rot, 'XYZ').to_quaternion()
        if prev is not None and prev.dot(q) < 0:
            q = -q
        prev = q.copy()
        ob.location = loc
        ob.rotation_quaternion = q
        ob.keyframe_insert('location', frame=f)
        ob.keyframe_insert('rotation_quaternion', frame=f)


def screen_seq(tex_dir, n, strength=1.0):
    first = os.path.join(tex_dir, '0001.jpg')
    return PH.screen_material('screen', seq_first=first, frames=n, strength=strength)


def gym_scene(rows_on=None, power=1.0, spot=2.2):
    import gym
    world_color((0.0, 0.0, 0.0))
    M, rows, wash, sm = gym.build()
    if rows_on is None:
        gym.set_rows(rows, wash, [None] * 6, power=power, spot=spot)
    else:
        # the rows come on one after the other, and each pool of light with the row nearest to it
        gym.set_rows(rows, [], rows_on, power=power, spot=spot)
        ys = [-6.0, -3.2, -0.4, 2.4, 5.2, 8.0]
        for o in wash:
            e = (o['power'] * spot if 'power' in o else 120.0) * power
            i = min(range(6), key=lambda k: abs(ys[k] - o.location.y))
            o.data.energy = 0.0
            o.data.keyframe_insert('energy', frame=rows_on[i] - 1)
            o.data.energy = e
            o.data.keyframe_insert('energy', frame=rows_on[i])
        a = bpy.data.materials.get('accent')
        st = a.node_tree.nodes['Emission'].inputs['Strength']
        st.default_value = 0.0
        st.keyframe_insert('default_value', frame=rows_on[5] - 1)
        st.default_value = 6.0 * power
        st.keyframe_insert('default_value', frame=rows_on[5])
        for ob in list(bpy.data.objects) + list(bpy.data.materials):
            ad = getattr(ob, 'animation_data', None) or (getattr(ob, 'data', None) and getattr(ob.data, 'animation_data', None)) or (getattr(ob, 'node_tree', None) and ob.node_tree.animation_data)
            if ad and ad.action:
                from kit import fcurves_of
                for fc in fcurves_of(ad.action):
                    if fc.data_path in ('energy', 'nodes["Emission"].inputs[1].default_value', 'nodes["Emission"].inputs["Strength"].default_value') or 'default_value' in fc.data_path:
                        for kp in fc.keyframe_points:
                            kp.interpolation = 'CONSTANT'
    return M, rows, wash, sm


# where things are in the gym
BENCH = Vector((-0.55, -1.2, 0.0))          # the flat bench his phone lies on
PH_BENCH = Vector((-0.52, -1.735, 0.471))  # the phone on the end of the bench pad (its centre)
PH_FLOOR = Vector((-0.42, -2.08, 0.0052))   # where it comes to rest on the floor, face up
SMITH = Vector((-3.0, 4.6, 1.2))
YAW_FLOOR = R(-24)                           # how it lies on the floor


# ------------------------------------------------------------------ the shots
def S1(a):
    """The gym. Black; the lights come on row by row; we walk in, look left, look right."""
    n = 120
    rows_on = [8, 17, 26, 35, 44, 53]
    gym_scene(rows_on)
    cam = camera(lens=27, fstop=2.8, focus=6.0)

    def fn(f):
        t = f / n
        y = lerp(-7.45, -3.6, ease(t) * 0.55 + t * 0.45)
        step = math.sin(f / 24.0 * math.tau * 1.7)            # footsteps
        loc = Vector((0.12 + 0.04 * math.sin(f / 24.0 * math.tau * 0.85), y, 1.63 + 0.012 * step)) + wobble(f, 1.0, 0.012)
        # the look: ahead, then left to the Smith machine, then right to the racks, then nowhere in particular
        look = vlerp((-0.4, 6.0, 1.05), (-3.4, 4.2, 0.95), ease(span(f, 52, 78)))
        look = vlerp(look, (5.6, 2.0, 1.0), ease(span(f, 82, 106)))
        look = vlerp(look, (1.2, 5.0, 0.8), ease(span(f, 108, 120)))
        look = look + wobble(f, 4.0, 0.05)
        return dict(loc=loc, target=look, roll=R(0.6) * math.sin(f / 24.0 * 2.1), focus=lerp(7.0, 5.0, t))
    bake_cam(cam, n, fn)
    return n, 2.39


def S2a(a):
    """His phone on the end of the bench, a search on its screen; a plate slams down; the bench jolts; it slides off."""
    n = 48
    gym_scene()
    root, scr = PH.build(screen_mat=screen_seq(os.path.join(a.tex, 'S2a'), n, 0.75))
    yaw = R(-32)                                                 # as it was put down: askew, its foot at the edge of the pad
    edge = Vector((0.0, -0.062, 0.0))

    def ph(f):
        if f <= 36:
            return PH_BENCH.copy(), (0, 0, yaw)
        t = (f - 36) / 12.0
        # the jolt lifts it a few millimetres and walks it over the edge; then it tips, foot first
        hop = 0.006 * math.sin(min(1.0, t * 3.0) * math.pi)
        slide = edge * ease_in(t, 1.6) * 1.9
        tip = R(78) * ease_in(span(f, 40, 49), 2.0)
        drop = 0.09 * ease_in(span(f, 42, 49), 2.0)
        return PH_BENCH + slide + Vector((0, 0, hop - drop)), (tip, R(6) * t, yaw + R(-9) * t)
    bake_obj(root, n, ph)
    cam = camera(lens=50, fstop=2.0, focus=0.42)

    def fn(f):
        t = f / n
        base = PH_BENCH + Vector((-0.27 + 0.03 * t, -0.25 + 0.02 * t, 0.13 - 0.015 * t))
        jolt = math.exp(-max(0, f - 36) / 3.5) * math.sin((f - 36) * 2.4) * 0.012 if f >= 36 else 0.0
        loc = base + wobble(f, 2.0, 0.0025) + Vector((jolt * 0.4, 0, jolt))
        tgt = PH_BENCH + Vector((0.0, 0.01, 0.0)) + (Vector((0, -0.05, -0.04)) * ease_in(span(f, 40, 48), 2))
        return dict(loc=loc, target=tgt, roll=R(3) + jolt * 1.5, focus=(tgt - loc).length)
    bake_cam(cam, n, fn)
    return n, 2.39


def S2c(a):
    """Slow motion: the phone turns over as it falls; the camera falls with it; the room's lights slide over its glass."""
    n = 72
    gym_scene()
    root, scr = PH.build(screen_mat=screen_seq(os.path.join(a.tex, 'S2c'), n, 0.75))
    top, bot = 0.92, 0.11          # slow motion takes its time: the fall is longer than the bench is high
    start = Vector((PH_BENCH.x, PH_BENCH.y - 0.14, top))
    end = Vector((PH_FLOOR.x, PH_FLOOR.y, bot))

    def ph(f):
        t = f / n
        k = 0.35 * t + 0.65 * t * t                                # gathering speed
        loc = start.lerp(end, k)
        # one and a quarter turns about its long axis, a slow half turn of yaw, ending face up
        spin = R(-78) + R(-360 - 282) * ease_out(t, 1.25) * 1.0
        q = Euler((0, 0, R(184) + (YAW_FLOOR - R(184) + R(360)) * 0 + R(-28) * t), 'XYZ').to_quaternion() @ Euler((spin * 0.56, 0, 0), 'XYZ').to_quaternion() @ Euler((0, R(360 + 0) * ease(t) * 1.0, 0), 'XYZ').to_quaternion()
        return loc, q
    bake_obj(root, n, ph)
    cam = camera(lens=72, fstop=1.8, focus=0.34)

    def fn(f):
        t = f / n
        k = 0.35 * t + 0.65 * t * t
        p = start.lerp(end, k)
        ang = R(205) + R(70) * ease(t)                              # it drifts round the phone as they fall
        dist = lerp(0.36, 0.27, ease(t))
        loc = Vector((p.x + math.cos(ang) * dist, p.y + math.sin(ang) * dist, p.z + lerp(-0.07, 0.04, ease(t))))
        loc.z = max(loc.z, 0.035)
        tgt = p + wobble(f, 3.0, 0.004)
        return dict(loc=loc + wobble(f, 5.0, 0.003), target=tgt, roll=R(8) * math.sin(t * math.pi * 0.9) - R(3), focus=(p - loc).length)
    bake_cam(cam, n, fn)
    return n, 2.39


def S2d(a):
    """It lands. One hard bounce, a small one, and it lies still, face up. Silence. The screen wakes."""
    n = 24
    gym_scene()
    root, scr = PH.build(screen_mat=screen_seq(os.path.join(a.tex, 'S2d'), n, 0.75))

    def ph(f):
        # down for 3 frames, a bounce of 4 cm tilting, a bounce of 8 mm, rest
        if f < 3:
            t = f / 3.0
            return PH_FLOOR + Vector((0, 0.03 * (1 - t), 0.2 * (1 - t) ** 1.2 + 0.0)), (R(-16) * (1 - t) + R(-4), R(9) * (1 - t), YAW_FLOOR + R(10) * (1 - t))
        if f < 9:
            t = (f - 3) / 6.0
            h = 0.042 * 4 * t * (1 - t)
            return PH_FLOOR + Vector((0, -0.006 * t, h)), (R(-4) + R(11) * math.sin(t * math.pi), R(-6) * math.sin(t * math.pi), YAW_FLOOR + R(-4) * t)
        if f < 13:
            t = (f - 9) / 4.0
            h = 0.008 * 4 * t * (1 - t)
            return PH_FLOOR + Vector((0, -0.006, h)), (R(-2.5) * math.sin(t * math.pi), 0, YAW_FLOOR + R(-4))
        return PH_FLOOR + Vector((0, -0.006, 0)), (0, 0, YAW_FLOOR + R(-4))
    bake_obj(root, n, ph)
    cam = camera(lens=40, fstop=2.0, focus=0.36)
    rest = PH_FLOOR + Vector((0, -0.006, 0))

    def fn(f):
        hit = math.exp(-max(0, f - 3) / 2.2) * math.sin((f - 3) * 2.8) * 0.006 if f >= 3 else 0.0
        push = ease(span(f, 10, 24))
        loc = rest + Vector((0.2 - 0.02 * push, -0.36 + 0.03 * push, 0.05 + 0.05 * push + hit))
        return dict(loc=loc, target=rest + Vector((0, 0.012, 0.012)), roll=R(-4) + hit * 2.0, focus=(rest - loc).length)
    bake_cam(cam, n, fn)
    return n, 2.39


def S3a(a):
    """The camera rushes down into the screen, through gymi's icon. (The last third of the shot is made in the edit.)"""
    n = 24
    gym_scene()
    root, scr = PH.build(screen_mat=screen_seq(os.path.join(a.tex, 'S3a'), 36, 0.8))
    rest = PH_FLOOR + Vector((0, -0.006, 0))
    root.location = rest
    root.rotation_euler = (0, 0, YAW_FLOOR + R(-4))
    # gymi's icon on the screen: 30..96 pt across, 214..280 pt down, of 402 × 874
    u, v = (63 / 402.0 - 0.5) * PH.SW, (0.5 - 247 / 874.0) * PH.SH
    yaw = YAW_FLOOR + R(-4)
    icon = rest + Vector((u * math.cos(yaw) - v * math.sin(yaw), u * math.sin(yaw) + v * math.cos(yaw), PH.T / 2))
    cam = camera(lens=40, fstop=2.4, focus=0.36)
    c0 = rest + Vector((0.18, -0.33, 0.1))

    def fn(f):
        t = ease_in(span(f, 0, 22), 2.4)
        up = ease(span(f, 0, 14))
        loc = c0.lerp(icon + Vector((0.0, -0.002, 0.0125)), t) + Vector((0, 0, 0.1 * math.sin(up * math.pi) * (1 - t)))
        tgt = vlerp(rest + Vector((0, 0.012, 0)), icon, ease(span(f, 0, 12)))
        # as it arrives it squares up with the screen
        roll = lerp(R(-4), -yaw, ease(span(f, 4, 20)))
        return dict(loc=loc, target=tgt, roll=roll, focus=max(0.012, (tgt - loc).length), lens=lerp(40, 28, t))
    bake_cam(cam, n, fn)
    return n, 16 / 9.0


def S5(a):
    """Out of the screen and back in the gym: the phone on the floor shows the exercise; up there, lit, is the machine."""
    n = 72
    gym_scene()
    root, scr = PH.build(screen_mat=screen_seq(os.path.join(a.tex, 'S5'), n, 0.8))
    rest = PH_FLOOR + Vector((0, -0.006, 0))
    yaw = R(159)                                                  # it lies with its top toward the Smith machine
    root.location = rest
    root.rotation_euler = (0, 0, yaw)
    # the demo picture on the screen: about 201 pt across, 300 pt down
    u, v = 0.0, (0.5 - 300 / 874.0) * PH.SH
    demo = rest + Vector((u * math.cos(yaw) - v * math.sin(yaw), u * math.sin(yaw) + v * math.cos(yaw), PH.T / 2))
    cam = camera(lens=30, fstop=2.0, focus=0.3)
    d = (Vector((SMITH.x, SMITH.y, 0)) - Vector((rest.x, rest.y, 0))).normalized()

    def fn(f):
        out = ease_out(span(f, 0, 20), 2.6)                        # the pull out of the screen
        rise = ease(span(f, 14, 46))                               # up, to a standing man's eyes
        walk = ease_in(span(f, 40, 72), 1.6)                       # and toward the machine
        p0 = demo + Vector((0, 0, 0.028))
        p1 = rest - d * 0.34 + Vector((0, 0, 0.3))
        p2 = rest - d * 0.2 + Vector((0, 0, 1.58))
        loc = p0.lerp(p1, out).lerp(p2, rise) + d * 1.5 * walk
        loc += wobble(f, 6.0, 0.006 * rise) + Vector((0, 0, 0.012 * math.sin(f / 24.0 * math.tau * 1.7) * walk))
        tgt = vlerp(demo, rest + Vector((0, 0, 0.0)), out)
        tgt = vlerp(tgt, SMITH, ease(span(f, 22, 48)))
        focus = lerp((rest - loc).length, (SMITH - loc).length, ease(span(f, 30, 46)))
        roll = lerp(-(yaw - R(180)) * 0 + R(0), 0, 1)
        return dict(loc=loc, target=tgt, roll=roll, focus=max(0.03, focus), lens=lerp(30, 35, rise), fstop=lerp(2.0, 2.8, rise))
    bake_cam(cam, n, fn)
    return n, 16 / 9.0


# ---- gymi's world: the phone alone, on a transparent film
def studio_scene(a, name, n, key=70.0, rim=55.0, strength=1.0):
    import studio
    studio.build(key=key, rim=rim)
    root, scr = PH.build(screen_mat=screen_seq(os.path.join(a.tex, name), n, strength))
    return root


def hero(f, n, drift=1.0):
    """the phone at rest in gymi's world is never still: it breathes"""
    t = f / 24.0
    return Vector((0, 0, 0.004 * math.sin(t * 1.9) * drift)), (R(2.0) * math.sin(t * 1.3) * drift, R(3.0) * math.sin(t * 1.05 + 1.0) * drift, R(1.0) * math.sin(t * 0.9) * drift)


UP = (0, 1, 0)


def orbit(target, ang, dist, lift=0.0):
    """a camera place in front of the phone: ang turns it round the phone's long axis, lift raises it"""
    return Vector((target[0] + math.sin(ang) * dist, target[1] + lift, target[2] + math.cos(ang) * dist))


def S3b(a):
    """Inside. The phone rises out of the dark, turning, into its hero position: the app opens, the character falls in."""
    n = 60
    root = studio_scene(a, 'S3b', n)

    def ph(f):
        t = ease_out(span(f, 0, 44), 3.0)
        d, e = hero(f, n, t)
        loc = Vector((0.0, lerp(-0.3, 0.0, t), lerp(-0.1, 0.0, t))) + d
        rot = (lerp(R(-70), R(-5), t) + e[0], lerp(R(-205), R(-12), t) + e[1], lerp(R(30), R(2), t) + e[2])
        return loc, rot
    bake_obj(root, n, ph)
    cam = camera(lens=62, fstop=4.0, focus=0.5)

    def fn(f):
        t = ease_out(span(f, 0, 50), 2.2)
        loc = orbit((0, 0.004, 0), lerp(R(10), R(4), t), lerp(0.74, 0.56, t), -0.02)
        return dict(loc=loc, target=(0.0, 0.004, 0), up=UP, roll=lerp(R(-8), R(0), t), focus=loc.length)
    bake_cam(cam, n, fn)
    return n, None


def feature(a, name, n, side, yaw0, yaw1, y0, y1, d0, d1, ang0, ang1, tilt=-7, flip=None):
    """one feature of the montage: the phone stands to one side of the picture (the word goes on the other), turning
    a little; the camera drifts round it and along it"""
    root = studio_scene(a, name, n)

    def ph(f):
        d, e = hero(f, n)
        t = f / n
        turn = R(360) * ease(span(f, flip[0], flip[1])) if flip else 0.0
        return d, (R(tilt) + e[0], lerp(R(yaw0), R(yaw1), ease(t)) + turn + e[1], R(1.5) * side + e[2])
    bake_obj(root, n, ph)
    cam = camera(lens=70, fstop=3.5, focus=0.4)

    def fn(f):
        t = ease(f / n)
        dist = lerp(d0, d1, t)
        y = lerp(y0, y1, t)
        tgt = Vector((-side * dist * 0.115, y, 0))          # looking past the phone puts it to one side
        loc = orbit(tgt, lerp(R(ang0), R(ang1), t), dist, -0.015)
        return dict(loc=loc, target=tgt, up=UP, roll=lerp(R(2.5), R(-1.5), t) * side, focus=(Vector((0, y, 0)) - loc).length)
    bake_cam(cam, n, fn)
    return n, None


def S4a(a):
    """Your character: the designer. The phone on the right; the camera eases back from the figure to the choices."""
    return feature(a, 'S4a', 48, side=1, yaw0=-24, yaw1=-6, y0=0.022, y1=0.004, d0=0.36, d1=0.44, ang0=-10, ang1=4)


def S4b(a):
    """Your plan: the coach's lines arrive. The phone on the left."""
    return feature(a, 'S4b', 48, side=-1, yaw0=26, yaw1=8, y0=0.03, y1=0.012, d0=0.38, d1=0.45, ang0=12, ang1=-3)


def S4c(a):
    """Your coach: the exercise, a tap on Swap, the choices slide up, one tap. The phone on the right."""
    return feature(a, 'S4c', 60, side=1, yaw0=-26, yaw1=-4, y0=0.012, y1=-0.006, d0=0.4, d1=0.46, ang0=-12, ang1=5)


def S4d(a):
    """Your game: a set is done and the level goes up; one full turn of the phone (a flash in the edit) and the workout
    is complete: confetti, points, what was unlocked. The phone on the left."""
    return feature(a, 'S4d', 60, side=-1, yaw0=22, yaw1=6, y0=-0.012, y1=0.004, d0=0.38, d1=0.47, ang0=10, ang1=-4, flip=(25, 35))


def S6(a):
    """The last picture: the phone floats in the dark, the camera moves round it; home, then the name."""
    n = 72
    root = studio_scene(a, 'S6', n, key=60.0, rim=75.0)

    def ph(f):
        d, e = hero(f, n, 0.7)
        t = f / n
        return d + Vector((lerp(0.0, -0.085, ease(span(f, 26, 54))), 0, 0)), (R(-5) + e[0], lerp(R(30), R(-14), ease_out(t, 1.6)) + e[1], R(1.5) + e[2])
    bake_obj(root, n, ph)
    cam = camera(lens=58, fstop=4.0, focus=0.5)

    def fn(f):
        t = f / n
        dist = lerp(0.52, 0.6, ease(t))
        loc = orbit((0, 0, 0), lerp(R(-14), R(8), ease(t)), dist, -0.02)
        return dict(loc=loc, target=(0.0, 0.0, 0), up=UP, roll=0.0, focus=dist)
    bake_cam(cam, n, fn)
    return n, None


SHOTS = dict(S1=S1, S2a=S2a, S2c=S2c, S2d=S2d, S3a=S3a, S5=S5, S3b=S3b, S4a=S4a, S4b=S4b, S4c=S4c, S4d=S4d, S6=S6)
STUDIO = ('S3b', 'S4a', 'S4b', 'S4c', 'S4d', 'S6')


def use_gpu(s):
    """a graphics card when there is one (Metal on a Mac, OptiX or CUDA on Nvidia); otherwise the processor"""
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        for kind in ('METAL', 'OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
            try:
                prefs.compute_device_type = kind
            except Exception:
                continue
            prefs.get_devices()
            devs = [d for d in prefs.devices if d.type == kind]
            if devs:
                for d in prefs.devices:
                    d.use = d.type == kind
                s.cycles.device = 'GPU'
                print('GPU', kind, [d.name for d in devs], flush=True)
                return True
    except Exception as e:
        print('no gpu:', e, flush=True)
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('shot')
    ap.add_argument('--res', type=int, default=1920)
    ap.add_argument('--samples', type=int, default=24)
    ap.add_argument('--frames', default='')
    ap.add_argument('--step', type=int, default=1)
    ap.add_argument('--out', default=os.path.join(SP, 'render'))
    ap.add_argument('--tex', default=os.path.join(SP, 'tex'))
    ap.add_argument('--noblur', action='store_true')
    ap.add_argument('--threshold', type=float, default=0.03)
    ap.add_argument('--device', default='auto', help='auto, cpu or gpu')
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    a = ap.parse_args(argv)
    s = reset()
    studio_shot = a.shot in STUDIO
    render_settings(s, a.res, round(a.res * 9 / 16), a.samples, transparent=studio_shot, blur=not a.noblur, view='Standard', look=('None',), threshold=a.threshold,
                    bounces=((4, 2, 3, 4) if studio_shot else (5, 2, 3, 4)))
    if a.device != 'cpu':
        use_gpu(s)
    n, aspect = SHOTS[a.shot](a)
    if aspect:
        s.render.resolution_y = int(round(a.res / aspect / 2) * 2)
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
