"""An iPhone-17-Pro-sized phone: 71.9 × 150 × 8.75 mm, a rounded aluminium body in deep blue, black front glass
with the display (the app's frames as an image sequence), a full-width camera plateau on the back with three lenses.
No logos. The phone's origin is its centre; it faces +Z, its top is +Y."""
import bpy, bmesh, math
from mathutils import Vector
from kit import principled, bump_noise, node, mesh_obj, rrect, cyl, box, link, emission

W, H, T = 0.0719, 0.150, 0.00875
RC = 0.0112          # corner radius of the body seen from the front
RE = 0.0026          # roundness of the edge between the sides and the faces
SW, SH, RS = 0.06743, 0.1466, 0.0094   # the display: 402:874, corner radius
BODY = (0.052, 0.085, 0.165)           # deep blue anodised aluminium


def loft_body(name, w, h, rc, t, re, mat, steps=6, n=12, coll=None):
    """a slab with a rounded outline whose edges are rounded too: rings of the outline, each inset and raised along a
    quarter circle at the back, straight up the side, and a quarter circle into the front"""
    prof = []
    for i in range(steps + 1):
        a = math.pi / 2 * i / steps
        prof.append((re * (1 - math.sin(a)), -t / 2 + re * (1 - math.cos(a))))
    for i in range(steps + 1):
        a = math.pi / 2 * i / steps
        prof.append((re * (1 - math.cos(a)), t / 2 - re + re * math.sin(a)))
    bm = bmesh.new()
    rings = []
    for inset, z in prof:
        pts = rrect(w - 2 * inset, h - 2 * inset, rc - inset, n)
        rings.append([bm.verts.new((x, y, z)) for x, y in pts])
    m = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(m):
            f = bm.faces.new((a[i], a[(i + 1) % m], b[(i + 1) % m], b[i]))
            f.smooth = True
    back = bm.faces.new(list(reversed(rings[0])))
    front = bm.faces.new(rings[-1])
    back.smooth = front.smooth = False
    bm.normal_update()
    ob = mesh_obj(name, bm, mat, coll=coll)
    return ob


def disc(name, w, h, r, z, mat, n=12, uv=True, coll=None):
    """a flat rounded rectangle at height z, facing +Z, with UVs over its full extent"""
    bm = bmesh.new()
    c = bm.verts.new((0, 0, z))
    ring = [bm.verts.new((x, y, z)) for x, y in rrect(w, h, r, n)]
    layer = bm.loops.layers.uv.new() if uv else None
    for i in range(len(ring)):
        f = bm.faces.new((c, ring[i], ring[(i + 1) % len(ring)]))
        if layer:
            for l in f.loops:
                l[layer].uv = (l.vert.co.x / w + 0.5, l.vert.co.y / h + 0.5)
    ob = mesh_obj(name, bm, mat, coll=coll)
    return ob


def screen_material(name='screen', seq_first=None, frames=1, strength=1.6, still=None):
    """the display: the app's frame as light, under glass that reflects the room"""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (0.0, 0.0, 0.0, 1)
    p.inputs['Roughness'].default_value = 0.035
    p.inputs['Specular IOR Level'].default_value = 0.5
    p.inputs['Emission Strength'].default_value = strength
    tex = node(nt, 'ShaderNodeTexImage', (-500, 0))
    tex.interpolation = 'Cubic'
    tex.extension = 'EXTEND'
    if seq_first or still:
        img = bpy.data.images.load(seq_first or still)
        if seq_first:
            img.source = 'SEQUENCE'
            tex.image = img
            u = tex.image_user
            u.frame_duration = frames
            u.frame_start = 1
            u.frame_offset = 0
            u.use_auto_refresh = True
        else:
            tex.image = img
    nt.links.new(tex.outputs['Color'], p.inputs['Emission Color'])
    m['tex'] = tex.name
    return m


def build(coll=None, screen_mat=None, name='phone'):
    body_m = bump_noise(principled('alu', BODY, 0.34, 1.0), scale=900, strength=0.04, detail=2, dist=0.0002)
    glass_m = principled('frontglass', (0.004, 0.004, 0.005), 0.03, 0.0, spec=0.5)
    back_m = principled('backglass', (0.06, 0.09, 0.17), 0.48, 0.0, spec=0.45)
    lens_m = principled('lens', (0.002, 0.002, 0.003), 0.02, 0.0, coat=1.0, coat_rough=0.01)
    ring_m = principled('lensring', (0.55, 0.57, 0.62), 0.22, 1.0)
    dark_m = principled('dark', (0.01, 0.01, 0.012), 0.35, 0.0)
    flash_m = principled('flash', (0.75, 0.72, 0.6), 0.25, 0.0)
    root = bpy.data.objects.new(name, None)
    link(root, coll)
    root.empty_display_size = 0.05
    parts = []
    body = loft_body(name + '_body', W, H, RC, T, RE, body_m, coll=coll)
    parts.append(body)
    # the front glass sits just proud of the body, nearly as large; the display sits on it
    parts.append(disc(name + '_glass', W - 0.0011, H - 0.0011, RC - 0.0006, T / 2 + 0.00005, glass_m, coll=coll))
    scr = disc(name + '_screen', SW, SH, RS, T / 2 + 0.00012, screen_mat or screen_material(), coll=coll)
    parts.append(scr)
    # the back: a glass panel below the plateau
    parts.append(disc(name + '_back', W - 0.006, H * 0.71, RC - 0.003, -T / 2 - 0.00005, back_m, uv=False, coll=coll))
    parts[-1].location.y = -H * 0.13
    parts[-1].rotation_euler.x = math.pi
    # the camera plateau, full width, at the top of the back
    pl = loft_body(name + '_plateau', W - 0.003, 0.0355, 0.0095, 0.0026, 0.0011, body_m, steps=4, n=8, coll=coll)
    pl.location = (0, H / 2 - 0.0035 - 0.0355 / 2, -T / 2 - 0.0012)
    parts.append(pl)
    zb = -T / 2 - 0.0026
    for i, (x, y) in enumerate(((-0.0215, 0.0577), (-0.0215, 0.0402), (-0.0057, 0.049))):
        ring = cyl(name + '_ring%d' % i, 0.0078, 0.0016, (x, y, zb - 0.0006), mat=ring_m, verts=48, bev=0.0003, coll=coll)
        lens = cyl(name + '_lens%d' % i, 0.0062, 0.0016, (x, y, zb - 0.0009), mat=lens_m, verts=48, bev=0.0002, coll=coll)
        parts += [ring, lens]
    parts.append(cyl(name + '_flash', 0.0028, 0.0006, (0.0205, 0.0577, zb), mat=flash_m, verts=24, bev=0, coll=coll))
    parts.append(cyl(name + '_lidar', 0.0026, 0.0006, (0.0205, 0.0402, zb), mat=dark_m, verts=24, bev=0, coll=coll))
    # buttons: action and volume on the left, power and camera control on the right
    for nm, x, y, h in (('act', -1, 0.042, 0.009), ('volup', -1, 0.024, 0.016), ('voldn', -1, 0.006, 0.016), ('power', 1, 0.028, 0.022), ('camctl', 1, -0.018, 0.019)):
        parts.append(box(name + '_' + nm, (0.0012, h, 0.0032), (x * (W / 2 + 0.0004), y, 0), mat=body_m, bev=0.0005, coll=coll))
    for p in parts:
        p.parent = root
    root['screen'] = scr.name
    return root, scr
