"""gymi's world: a dark blue-black space where the phone floats. A broad soft key from above and in front draws a
clean stripe across the glass, a blue rim from the left and a gold rim from the right are the brand's two colours,
and two tall reflection cards (seen only in reflections) give the aluminium its edges. The background itself is added
in compositing, so the phone is rendered on a transparent film."""
import bpy, math
from kit import area_light, world_color, plane, emission, look_at

BLUE = (0.13, 0.32, 1.0)
GOLD = (1.0, 0.69, 0.18)


def build(key=70.0, rim=55.0):
    world_color((0.0035, 0.0045, 0.009), 1.0)
    k = area_light('key', 0.9, (0.05, 0.42, 0.62), energy=key, size_y=0.35, color=(1.0, 0.98, 0.95))
    look_at(k, (0, 0, 0))
    k.visible_glossy = True
    rb = area_light('rim_blue', 0.5, (-0.55, 0.15, -0.25), energy=rim, color=BLUE, size_y=0.9)
    look_at(rb, (0, 0, 0))
    rg = area_light('rim_gold', 0.5, (0.6, 0.25, -0.3), energy=rim * 0.75, color=GOLD, size_y=0.9)
    look_at(rg, (0, 0, 0))
    m = emission('card', (1, 1, 1), 2.2)
    for sx in (-1, 1):
        c = plane('card%d' % sx, 0.25, 1.2, (sx * 0.45, -0.1, 0.35), mat=m)
        look_at(c, (0, 0, 0))
        c.rotation_euler.rotate_axis('X', math.pi)
        c.visible_camera = False
        c.visible_diffuse = False
        c.visible_shadow = False
    return k, rb, rg
