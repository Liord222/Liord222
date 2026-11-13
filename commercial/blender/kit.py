"""Blender kit for the gymi commercial: render settings, materials, simple solids with bevelled edges.
Runs with the official Blender build as a Python module (pip install bpy==5.3.0, Python 3.13)."""
import bpy, bmesh, math
from mathutils import Vector, Euler

TAU = math.tau


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.unit_settings.system = 'METRIC'
    s.render.fps = 24
    return s


def render_settings(s, w=1920, h=1080, samples=64, transparent=False, blur=True, bounces=(6, 3, 3, 6), threshold=0.02, pct=100, view='AgX', look=('AgX - Medium High Contrast', 'Medium High Contrast')):
    s.render.engine = 'CYCLES'
    c = s.cycles
    c.device = 'CPU'
    c.samples = samples
    c.use_adaptive_sampling = True
    c.adaptive_threshold = threshold
    c.adaptive_min_samples = 0
    c.use_denoising = True
    try:
        c.denoiser = 'OPENIMAGEDENOISE'
        c.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
        c.denoising_prefilter = 'ACCURATE'
    except Exception as e:
        print('denoise settings', e)
    c.max_bounces, c.diffuse_bounces, c.glossy_bounces, c.transmission_bounces = bounces
    c.transparent_max_bounces = 8
    c.caustics_reflective = False
    c.caustics_refractive = False
    c.sample_clamp_indirect = 6
    c.blur_glossy = 1.0
    try:
        c.use_light_tree = True
    except Exception:
        pass
    s.render.resolution_x, s.render.resolution_y = w, h
    s.render.resolution_percentage = pct
    s.render.film_transparent = transparent
    s.render.use_motion_blur = blur
    s.render.motion_blur_shutter = 0.5
    s.render.image_settings.file_format = 'PNG'
    s.render.image_settings.color_mode = 'RGBA' if transparent else 'RGB'
    s.render.image_settings.color_depth = '8'
    s.render.use_persistent_data = True
    s.render.threads_mode = 'AUTO'
    vs = s.view_settings
    vs.view_transform = view
    for lk in look:
        try:
            vs.look = lk
            break
        except Exception:
            pass
    vs.exposure = 0.0
    s.render.film_transparent = transparent


# ------------------------------------------------------------------ materials
def principled(name, color=(0.5, 0.5, 0.5), rough=0.5, metal=0.0, **kw):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    for k, v in kw.items():
        key = {'aniso': 'Anisotropic', 'coat': 'Coat Weight', 'coat_rough': 'Coat Roughness', 'spec': 'Specular IOR Level',
               'ior': 'IOR', 'trans': 'Transmission Weight', 'emit': 'Emission Strength', 'emit_color': 'Emission Color',
               'sheen': 'Sheen Weight', 'aniso_rot': 'Anisotropic Rotation'}.get(k, k)
        inp = p.inputs[key]
        inp.default_value = (*v, 1) if isinstance(v, tuple) and len(v) == 3 else v
    return m


def node(nt, kind, loc=(0, 0), **props):
    n = nt.nodes.new(kind)
    n.location = loc
    for k, v in props.items():
        setattr(n, k, v)
    return n


def bump_noise(m, scale=40.0, strength=0.15, detail=6.0, rough_var=None, dist=0.0015):
    """a fine surface grain: a noise into the normal, and optionally into the roughness"""
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    tc = node(nt, 'ShaderNodeTexCoord', (-900, 0))
    nz = node(nt, 'ShaderNodeTexNoise', (-700, 0))
    nz.inputs['Scale'].default_value = scale
    nz.inputs['Detail'].default_value = detail
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    bp = node(nt, 'ShaderNodeBump', (-300, -200))
    bp.inputs['Strength'].default_value = strength
    bp.inputs['Distance'].default_value = dist
    nt.links.new(nz.outputs['Fac'], bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], p.inputs['Normal'])
    if rough_var:
        mr = node(nt, 'ShaderNodeMapRange', (-400, 200))
        mr.inputs['To Min'].default_value, mr.inputs['To Max'].default_value = rough_var
        nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
        nt.links.new(mr.outputs['Result'], p.inputs['Roughness'])
    return m


def emission(name, color=(1, 1, 1), strength=10.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    e = node(nt, 'ShaderNodeEmission')
    e.inputs['Color'].default_value = (*color, 1)
    e.inputs['Strength'].default_value = strength
    o = node(nt, 'ShaderNodeOutputMaterial', (300, 0))
    nt.links.new(e.outputs[0], o.inputs['Surface'])
    return m


# ------------------------------------------------------------------ solids
def link(obj, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


def mesh_obj(name, bm, mat=None, smooth=False, coll=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    if mat:
        me.materials.append(mat)
    return link(ob, coll)


def bevel(ob, width=0.003, segs=2, angle=40):
    md = ob.modifiers.new('bevel', 'BEVEL')
    md.width = width
    md.segments = segs
    md.limit_method = 'ANGLE'
    md.angle_limit = math.radians(angle)
    md.harden_normals = False
    return ob


def box(name, size, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, bev=0.004, coll=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
    ob = mesh_obj(name, bm, mat, coll=coll)
    ob.location = loc
    ob.rotation_euler = rot
    if bev:
        bevel(ob, min(bev, min(size) * 0.45))
    return ob


def cyl(name, r, depth, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, verts=32, bev=0.0015, smooth=True, r2=None, coll=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=depth)
    ob = mesh_obj(name, bm, mat, smooth=smooth, coll=coll)
    if smooth:
        # caps stay flat, the side is smooth
        for p in ob.data.polygons:
            p.use_smooth = abs(p.normal.z) < 0.5
    ob.location = loc
    ob.rotation_euler = rot
    if bev:
        bevel(ob, bev, 2, 30)
    return ob


def tube(name, a, b, r, mat=None, verts=16, coll=None):
    """a round bar from point a to point b"""
    a, b = Vector(a), Vector(b)
    d = b - a
    ob = cyl(name, r, d.length, loc=(a + b) / 2, mat=mat, verts=verts, bev=0, coll=coll)
    ob.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    return ob


def plane(name, w, h, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, coll=None):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    for v in bm.verts:
        v.co.x *= w
        v.co.y *= h
    uv = bm.loops.layers.uv.new()
    for f in bm.faces:
        for l in f.loops:
            l[uv].uv = (l.vert.co.x / w + 0.5, l.vert.co.y / h + 0.5)
    ob = mesh_obj(name, bm, mat, coll=coll)
    ob.location = loc
    ob.rotation_euler = rot
    return ob


def rrect(w, h, r, n=10):
    """the outline of a rounded rectangle, centred, counter-clockwise, n points per corner"""
    r = min(r, w / 2 - 1e-5, h / 2 - 1e-5)
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def look_at(ob, target, roll=0.0, up=None):
    """aims an object's -Z at a point, with its +Y toward `up` (the world's +Z unless said otherwise)"""
    from mathutils import Matrix
    f = (Vector(target) - ob.location)
    if f.length < 1e-9:
        return
    f.normalize()
    u = Vector(up) if up is not None else Vector((0, 0, 1))
    r = f.cross(u)
    if r.length < 1e-6:
        r = f.cross(Vector((0, 1, 0)) if up is None else Vector((0, 0, 1)))
    r.normalize()
    v = r.cross(f)
    m = Matrix((r, v, -f)).transposed()
    ob.rotation_euler = m.to_euler('XYZ')
    if roll:
        ob.rotation_euler.rotate_axis('Z', roll)


def key(ob, path, frame, value=None, interp='BEZIER'):
    if value is not None:
        setattr(ob, path, value)
    ob.keyframe_insert(data_path=path, frame=frame)
    ad = ob.animation_data
    if ad and ad.action:
        for fc in fcurves_of(ad.action):
            if fc.data_path == path:
                for kp in fc.keyframe_points:
                    if abs(kp.co.x - frame) < 0.01:
                        kp.interpolation = interp


def fcurves_of(action):
    """the F-curves of an action (Blender 5 keeps them in layered channelbags)"""
    try:
        return list(action.fcurves)
    except Exception:
        pass
    out = []
    for layer in getattr(action, 'layers', []):
        for strip in layer.strips:
            for cb in strip.channelbags:
                out.extend(cb.fcurves)
    return out


def camera(name='cam', lens=35, loc=(0, 0, 0), target=None, fstop=None, focus=None, sensor=36):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_width = sensor
    cd.clip_start = 0.005
    cd.clip_end = 200
    ob = bpy.data.objects.new(name, cd)
    link(ob)
    ob.location = loc
    if target:
        look_at(ob, target)
    if fstop:
        cd.dof.use_dof = True
        cd.dof.aperture_fstop = fstop
        cd.dof.aperture_blades = 7
        if focus is not None:
            cd.dof.focus_distance = focus
    bpy.context.scene.camera = ob
    return ob


def area_light(name, size, loc, rot=(0, 0, 0), energy=100.0, color=(1, 1, 1), size_y=None, spread=180, cam=False, coll=None):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.shape = 'RECTANGLE'
    ld.size = size
    ld.size_y = size_y if size_y is not None else size
    ld.energy = energy
    ld.color = color
    ld.spread = math.radians(spread)
    ob = bpy.data.objects.new(name, ld)
    link(ob, coll)
    ob.location = loc
    ob.rotation_euler = rot
    ob.visible_camera = cam
    return ob


def world_color(color=(0, 0, 0), strength=1.0):
    w = bpy.data.worlds.new('world')
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (*color, 1)
    bg.inputs['Strength'].default_value = strength
    return w


def world_image(path, strength=1.0, rot_z=0.0):
    w = bpy.data.worlds.new('world')
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes.get('Background')
    env = node(nt, 'ShaderNodeTexEnvironment', (-400, 0))
    env.image = bpy.data.images.load(path)
    tc = node(nt, 'ShaderNodeTexCoord', (-800, 0))
    mp = node(nt, 'ShaderNodeMapping', (-600, 0))
    mp.inputs['Rotation'].default_value[2] = rot_z
    nt.links.new(tc.outputs['Generated'], mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], env.inputs['Vector'])
    nt.links.new(env.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = strength
    return w
