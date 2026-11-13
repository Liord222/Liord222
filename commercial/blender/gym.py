"""A modern strength gym, built from code: black rubber floor in 1 m tiles, a lifting platform, a mirror wall, raw
concrete, an industrial black ceiling with rows of linear LED lights (each row is a light that can be switched on),
a dumbbell rack, power racks with loaded bars, a Smith machine with an incline bench (the exercise in the app's
demo), flat benches, a cable column, plate trees and kettlebells.
The camera enters from the door at y = -8 looking toward +Y. Units are metres."""
import bpy, math, random
from mathutils import Vector
from kit import principled, bump_noise, node, box, cyl, tube, plane, emission, area_light, link

R = random.Random(7)
X0, X1, Y0, Y1, ZC = -10.0, 10.0, -8.0, 11.0, 4.6


def mats():
    M = {}
    # the floor: black rubber with fine flecks, 1 m tiles with dark seams, a little sheen
    m = principled('rubber', (0.012, 0.012, 0.013), 0.72, 0.0, spec=0.22)
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    tc = node(nt, 'ShaderNodeTexCoord', (-1200, 0))
    br = node(nt, 'ShaderNodeTexBrick', (-900, 200))
    br.offset = 0.0
    br.squash = 1.0
    br.inputs['Scale'].default_value = 1.0
    br.inputs['Mortar Size'].default_value = 0.004
    br.inputs['Brick Width'].default_value = 1.0
    br.inputs['Row Height'].default_value = 1.0
    br.inputs['Color1'].default_value = (1, 1, 1, 1)
    br.inputs['Color2'].default_value = (1, 1, 1, 1)
    br.inputs['Mortar'].default_value = (0, 0, 0, 1)
    nt.links.new(tc.outputs['Object'], br.inputs['Vector'])
    vo = node(nt, 'ShaderNodeTexVoronoi', (-900, -100))
    vo.inputs['Scale'].default_value = 260.0
    nt.links.new(tc.outputs['Object'], vo.inputs['Vector'])
    fl = node(nt, 'ShaderNodeMapRange', (-650, -100))
    fl.inputs['From Min'].default_value, fl.inputs['From Max'].default_value = 0.0, 0.06
    fl.inputs['To Min'].default_value, fl.inputs['To Max'].default_value = 1.0, 0.0
    nt.links.new(vo.outputs['Distance'], fl.inputs['Value'])
    nz = node(nt, 'ShaderNodeTexNoise', (-900, -400))
    nz.inputs['Scale'].default_value = 3.0
    nz.inputs['Detail'].default_value = 8.0
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    col = node(nt, 'ShaderNodeMix', (-400, 100))
    col.data_type = 'RGBA'
    col.inputs[6].default_value = (0.009, 0.009, 0.01, 1)
    col.inputs[7].default_value = (0.07, 0.07, 0.075, 1)
    fm = node(nt, 'ShaderNodeMath', (-500, -100))
    fm.operation = 'MULTIPLY'
    fm.inputs[1].default_value = 0.22
    nt.links.new(fl.outputs['Result'], fm.inputs[0])
    nt.links.new(fm.outputs[0], col.inputs[0])
    mul = node(nt, 'ShaderNodeMix', (-200, 100))
    mul.data_type = 'RGBA'
    mul.blend_type = 'MULTIPLY'
    mul.inputs[0].default_value = 1.0
    nt.links.new(col.outputs[2], mul.inputs[6])
    nt.links.new(br.outputs['Color'], mul.inputs[7])
    nt.links.new(mul.outputs[2], p.inputs['Base Color'])
    rr = node(nt, 'ShaderNodeMapRange', (-400, -400))
    rr.inputs['To Min'].default_value, rr.inputs['To Max'].default_value = 0.5, 0.9
    nt.links.new(nz.outputs['Fac'], rr.inputs['Value'])
    nt.links.new(rr.outputs['Result'], p.inputs['Roughness'])
    bp = node(nt, 'ShaderNodeBump', (-300, -600))
    bp.inputs['Strength'].default_value = 0.35
    bp.inputs['Distance'].default_value = 0.002
    nt.links.new(br.outputs['Fac'], bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], p.inputs['Normal'])
    M['floor'] = m
    # oak boards of the lifting platform
    m = principled('oak', (0.33, 0.2, 0.11), 0.42, 0.0)
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    tc = node(nt, 'ShaderNodeTexCoord', (-1000, 0))
    wv = node(nt, 'ShaderNodeTexWave', (-800, 0))
    wv.inputs['Scale'].default_value = 7.0
    wv.inputs['Distortion'].default_value = 6.0
    wv.inputs['Detail'].default_value = 3.0
    nt.links.new(tc.outputs['Object'], wv.inputs['Vector'])
    cr = node(nt, 'ShaderNodeValToRGB', (-550, 0))
    cr.color_ramp.elements[0].color = (0.23, 0.13, 0.065, 1)
    cr.color_ramp.elements[1].color = (0.45, 0.29, 0.16, 1)
    nt.links.new(wv.outputs['Fac'], cr.inputs['Fac'])
    nt.links.new(cr.outputs['Color'], p.inputs['Base Color'])
    M['oak'] = m
    M['concrete'] = bump_noise(principled('concrete', (0.05, 0.05, 0.052), 0.86), scale=9, strength=0.35, detail=10, rough_var=(0.7, 0.95), dist=0.01)
    M['column'] = bump_noise(principled('column', (0.045, 0.045, 0.046), 0.8), scale=11, strength=0.3, detail=10, rough_var=(0.65, 0.9), dist=0.008)
    M['ceiling'] = principled('ceiling', (0.008, 0.008, 0.009), 0.8)
    M['mirror'] = principled('mirror', (0.92, 0.93, 0.94), 0.012, 1.0)
    M['steel'] = bump_noise(principled('powder', (0.022, 0.022, 0.025), 0.42, 0.0, spec=0.5), scale=600, strength=0.06, detail=2, dist=0.0003)
    M['steel_w'] = bump_noise(principled('powder_w', (0.16, 0.165, 0.17), 0.4, 0.0, spec=0.5), scale=600, strength=0.06, detail=2, dist=0.0003)
    M['chrome'] = principled('chrome', (0.86, 0.87, 0.9), 0.07, 1.0)
    M['knurl'] = bump_noise(principled('knurl', (0.7, 0.71, 0.74), 0.32, 1.0), scale=900, strength=0.5, detail=1, dist=0.0004)
    M['rubber'] = bump_noise(principled('plate', (0.017, 0.017, 0.019), 0.62, 0.0, spec=0.4), scale=200, strength=0.1, detail=4, dist=0.0004)
    M['pad'] = bump_noise(principled('pad', (0.016, 0.016, 0.018), 0.4, 0.0, spec=0.5, coat=0.15, coat_rough=0.3), scale=320, strength=0.12, detail=3, dist=0.0004)
    M['blue'] = principled('bumper_blue', (0.03, 0.09, 0.42), 0.55, 0.0)
    M['red'] = principled('bumper_red', (0.42, 0.03, 0.03), 0.55, 0.0)
    M['yellow'] = principled('bumper_yellow', (0.58, 0.42, 0.03), 0.55, 0.0)
    M['iron'] = bump_noise(principled('castiron', (0.03, 0.03, 0.032), 0.55, 0.6), scale=300, strength=0.25, detail=6, dist=0.0006)
    M['led'] = emission('led', (1.0, 0.97, 0.93), 0.0)
    M['warm'] = emission('warmled', (1.0, 0.82, 0.6), 0.0)
    M['sign'] = emission('exit', (0.1, 1.0, 0.35), 3.0)
    M['door'] = principled('doorframe', (0.04, 0.04, 0.045), 0.35, 1.0)
    M['outside'] = emission('daylight', (0.8, 0.88, 1.0), 0.5)
    M['accent'] = emission('accent', (0.13, 0.32, 1.0), 0.0)
    return M


def room(M, C):
    plane('floor', X1 - X0, Y1 - Y0, ((X0 + X1) / 2, (Y0 + Y1) / 2, 0), mat=M['floor'], coll=C)
    plane('ceiling', X1 - X0, Y1 - Y0, ((X0 + X1) / 2, (Y0 + Y1) / 2, ZC), (math.pi, 0, 0), mat=M['ceiling'], coll=C)
    # far wall: a mirror band at the bottom, concrete above
    box('wall_far', (X1 - X0, 0.2, ZC), (0, Y1 + 0.1, ZC / 2), mat=M['concrete'], bev=0, coll=C)
    for i in range(10):
        x = X0 + 1.0 + i * 1.8
        box('mirror%d' % i, (1.76, 0.02, 2.1), (x + 0.88, Y1 - 0.01, 0.25 + 1.05), mat=M['mirror'], bev=0.002, coll=C)
    box('wall_left', (0.2, Y1 - Y0, ZC), (X0 - 0.1, (Y0 + Y1) / 2, ZC / 2), mat=M['concrete'], bev=0, coll=C)
    box('wall_right', (0.2, Y1 - Y0, ZC), (X1 + 0.1, (Y0 + Y1) / 2, ZC / 2), mat=M['concrete'], bev=0, coll=C)
    # back wall with the door the camera comes through
    box('wall_back_l', (9.2, 0.2, ZC), (X0 + 4.6, Y0 - 0.1, ZC / 2), mat=M['concrete'], bev=0, coll=C)
    box('wall_back_r', (9.2, 0.2, ZC), (X1 - 4.6, Y0 - 0.1, ZC / 2), mat=M['concrete'], bev=0, coll=C)
    box('wall_back_top', (1.6, 0.2, ZC - 2.4), (0, Y0 - 0.1, 2.4 + (ZC - 2.4) / 2), mat=M['concrete'], bev=0, coll=C)
    for sx in (-1, 1):
        box('doorjamb%d' % sx, (0.07, 0.26, 2.42), (sx * 0.83, Y0 - 0.1, 1.21), mat=M['door'], bev=0.006, coll=C)
    box('doorhead', (1.73, 0.26, 0.07), (0, Y0 - 0.1, 2.43), mat=M['door'], bev=0.006, coll=C)
    plane('outside', 4, 3, (0, Y0 - 1.5, 1.4), (math.pi / 2, 0, 0), mat=M['outside'], coll=C)
    box('exit', (0.36, 0.03, 0.14), (0, Y0 + 0.02, 2.62), mat=M['sign'], bev=0.004, coll=C)
    # two concrete columns for depth
    for x, y in ((-4.6, 2.5), (4.2, 5.5)):
        box('column', (0.5, 0.5, ZC), (x, y, ZC / 2), mat=M['column'], bev=0.01, coll=C)
    # ducts along the ceiling
    for x in (-6.0, 6.5):
        cyl('duct', 0.28, Y1 - Y0, (x, (Y0 + Y1) / 2, ZC - 0.45), (math.pi / 2, 0, 0), mat=M['steel_w'], verts=40, bev=0, coll=C)


def lights(M, C):
    """rows of LED bars across the room, from the door to the mirrors. Each row has its own emission material and an
    area light under it, both named led_row<i>, so a shot can switch the rows on one after the other"""
    rows = []
    for i, y in enumerate([-6.0, -3.2, -0.4, 2.4, 5.2, 8.0]):
        em = emission('led_row%d' % i, (1.0, 0.965, 0.92), 0.0)
        objs = []
        for x in (-7.0, -3.5, 0.0, 3.5, 7.0):
            box('ledbar', (2.4, 0.07, 0.035), (x, y, ZC - 0.6), mat=em, bev=0.004, coll=C)
            for sx in (-1, 1):
                tube('wire', (x + sx * 1.0, y, ZC - 0.58), (x + sx * 1.0, y, ZC), 0.0015, mat=M['steel'], verts=6, coll=C)
            # the light it gives: a long thin area light just under the bar, invisible to the camera
            objs.append(area_light('led_row%d_light' % i, 2.4, (x, y, ZC - 0.64), energy=0.0, size_y=0.07, color=(1.0, 0.86, 0.7), spread=95, coll=C))
        rows.append((em, objs))
    # a warm wash on the far concrete above the mirrors
    wash = []
    for x in (-6, -2, 2, 6):
        wash.append(area_light('wash', 1.5, (x, Y1 - 0.6, ZC - 0.3), (math.radians(-150), 0, 0), energy=0.0, color=(1.0, 0.7, 0.45), spread=70, coll=C))
    # pools of warm light on the equipment, from spots in the ceiling: the room is dark between them
    for x, y, e in ((-3.0, 4.6, 900), (6.4, -1.5, 650), (6.4, 2.3, 650), (6.4, 6.1, 650), (-4.0, Y1 - 1.2, 700), (2.6, Y1 - 1.2, 700), (-0.55, -1.2, 520), (-9.0, 3.2, 500), (1.6, 3.6, 380)):
        ld = bpy.data.lights.new('spot', 'SPOT')
        ld.energy = 0.0
        ld.color = (1.0, 0.78, 0.55)
        ld.spot_size = math.radians(58)
        ld.spot_blend = 0.75
        ld.shadow_soft_size = 0.12
        ob = bpy.data.objects.new('spot', ld)
        link(ob, C)
        ob.location = (x, y, ZC - 0.05)
        ob['power'] = e
        wash.append(ob)
    # a cool strip of light along the foot of the mirrors (the one place the brand's blue is in the room)
    box('accentstrip', (X1 - X0 - 2, 0.03, 0.02), (0, Y1 - 0.06, 0.2), mat=M['accent'], bev=0, coll=C)
    return rows, wash


def dumbbell(name, x, y, z, kg, M, C, axis='x'):
    """a hex dumbbell: knurled chrome handle, two rubber hex heads with steel caps"""
    s = 0.85 + kg / 60.0
    hr, hl = 0.055 * s, 0.07 * s
    rot = (0, math.pi / 2, 0) if axis == 'x' else (math.pi / 2, 0, 0)
    d = Vector((1, 0, 0)) if axis == 'x' else Vector((0, 1, 0))
    c = Vector((x, y, z))
    cyl(name + 'h', 0.016, 0.14, c, rot, mat=M['knurl'], verts=16, bev=0, coll=C)
    for sgn in (-1, 1):
        p = c + d * sgn * (0.07 + hl / 2)
        hx = cyl(name + 'hex', hr, hl, p, rot, mat=M['rubber'], verts=6, bev=0.004, smooth=False, coll=C)
        hx.rotation_euler.rotate_axis('Z', math.pi / 6)
        cyl(name + 'cap', hr * 0.42, 0.004, c + d * sgn * (0.07 + hl + 0.001), rot, mat=M['chrome'], verts=24, bev=0, coll=C)


def dumbbell_rack(M, C, x0, y, n=10):
    """a two-tier rack along the mirrors, with dumbbells from light to heavy"""
    L = n * 0.42
    for sx in (0, L / 2, L):
        for dy in (-0.25, 0.25):
            box('rackleg', (0.05, 0.05, 0.85), (x0 + sx, y + dy, 0.425), mat=M['steel'], coll=C)
    for z, dy in ((0.48, -0.08), (0.82, 0.12)):
        box('racktray', (L + 0.1, 0.34, 0.03), (x0 + L / 2, y + dy, z), (math.radians(-12), 0, 0), mat=M['steel'], coll=C)
    for i in range(n):
        kg = 4 + i * 4
        for row, (z, dy) in enumerate(((0.56, -0.08), (0.9, 0.12))):
            k = kg + row * 2
            dumbbell('db%d_%d' % (i, row), x0 + 0.21 + i * 0.42, y + dy, z + 0.02 + 0.055 * (0.85 + k / 60), k, M, C, axis='y')


def plate(name, r, w, loc, rot, mat, M, C):
    p = cyl(name, r, w, loc, rot, mat=mat, verts=64, bev=0.004, coll=C)
    cyl(name + 'hub', 0.05, w + 0.004, loc, rot, mat=M['chrome'], verts=32, bev=0.001, coll=C)
    return p


def barbell(name, x, y, z, M, C, plates=((0.225, 'blue'), (0.225, 'blue'), (0.2, 'rubber')), axis='x'):
    rot = (0, math.pi / 2, 0) if axis == 'x' else (math.pi / 2, 0, 0)
    d = Vector((1, 0, 0)) if axis == 'x' else Vector((0, 1, 0))
    c = Vector((x, y, z))
    cyl(name + 'shaft', 0.014, 1.31, c, rot, mat=M['knurl'], verts=16, bev=0, coll=C)
    for sgn in (-1, 1):
        cyl(name + 'collar', 0.03, 0.03, c + d * sgn * 0.67, rot, mat=M['chrome'], verts=24, bev=0.002, coll=C)
        cyl(name + 'sleeve', 0.025, 0.42, c + d * sgn * 0.9, rot, mat=M['chrome'], verts=24, bev=0.001, coll=C)
        off = 0.7
        for i, (r, m) in enumerate(plates):
            w = 0.055 if m != 'rubber' else 0.04
            off += w / 2
            plate(name + 'pl%d' % i, r, w, c + d * sgn * off, rot, M[m] if m in M else M['rubber'], M, C)
            off += w / 2 + 0.004


def power_rack(M, C, x, y, rot=0.0, loaded=True):
    """four 75 mm uprights with rows of holes, crossbeams, J-hooks, and a loaded bar on the hooks"""
    from mathutils import Matrix
    w, d, h = 1.22, 1.2, 2.3
    objs = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            objs.append(box('upright', (0.075, 0.075, h), (sx * w / 2, sy * d / 2, h / 2), mat=M['steel'], bev=0.006, coll=C))
            for k in range(28):
                objs.append(box('hole', (0.002, 0.022, 0.03), (sx * w / 2 - sx * 0.0375 + sx * 0.0, sy * d / 2, 0.45 + k * 0.05), mat=M['ceiling'], bev=0, coll=C))
    for sy in (-1, 1):
        objs.append(box('top', (w, 0.075, 0.075), (0, sy * d / 2, h - 0.04), mat=M['steel'], coll=C))
        objs.append(box('base', (w + 0.1, 0.09, 0.05), (0, sy * d / 2, 0.025), mat=M['steel'], coll=C))
    for sx in (-1, 1):
        objs.append(box('side', (0.075, d, 0.075), (sx * w / 2, 0, h - 0.04), mat=M['steel'], coll=C))
        objs.append(box('jhook', (0.06, 0.1, 0.08), (sx * w / 2, -d / 2 - 0.06, 1.35), mat=M['steel'], coll=C))
    if loaded:
        barbell('rackbar', 0, -d / 2 - 0.08, 1.4, M, C)
        objs += [o for o in C.objects if o.name.startswith('rackbar') and o.parent is None and o not in objs]
    root = bpy.data.objects.new('powerrack', None)
    link(root, C)
    for o in objs:
        if o.parent is None:
            o.parent = root
    root.location = (x, y, 0)
    root.rotation_euler.z = rot
    return root


def bench(M, C, x, y, rot=0.0, incline=0.0, name='bench'):
    """a flat (or inclined) bench: a padded top on a steel frame"""
    root = bpy.data.objects.new(name, None)
    link(root, C)
    objs = []
    pad = box(name + '_pad', (0.29, 1.16, 0.07), (0, 0, 0.43), mat=M['pad'], bev=0.025, coll=C)
    objs.append(pad)
    objs.append(box(name + '_padbase', (0.24, 1.1, 0.03), (0, 0, 0.385), mat=M['steel'], bev=0.004, coll=C))
    objs.append(box(name + '_spine', (0.08, 1.0, 0.06), (0, 0, 0.33), mat=M['steel'], coll=C))
    for sy in (-1, 1):
        objs.append(box(name + '_post', (0.07, 0.07, 0.3), (0, sy * 0.42, 0.17), mat=M['steel'], coll=C))
        objs.append(box(name + '_foot', (0.5, 0.07, 0.05), (0, sy * 0.45, 0.025), mat=M['steel'], coll=C))
        for sx in (-1, 1):
            cyl(name + '_cap', 0.03, 0.02, (sx * 0.25, sy * 0.45, 0.01), mat=M['rubber'], verts=16, bev=0, coll=C)
    if incline:
        pad.rotation_euler.x = incline
        pad.location = (0, 0.18, 0.52)
        objs.append(box(name + '_seat', (0.29, 0.38, 0.07), (0, -0.4, 0.45), mat=M['pad'], bev=0.025, coll=C))
    for o in C.objects:
        if o.name.startswith(name + '_') and o.parent is None:
            o.parent = root
    root.location = (x, y, 0)
    root.rotation_euler.z = rot
    return root


def smith(M, C, x, y):
    """a Smith machine: a frame with two chrome guide rods, a bar on carriages; an incline bench under the bar"""
    root = bpy.data.objects.new('smith', None)
    link(root, C)
    start = set(C.objects)
    w, d, h = 2.1, 1.4, 2.3
    for sx in (-1, 1):
        for sy in (-1, 1):
            box('sm_post', (0.08, 0.08, h), (sx * w / 2, sy * d / 2, h / 2), mat=M['steel'], bev=0.006, coll=C)
        tube('sm_rod', (sx * 0.86, 0, 0.12), (sx * 0.86, 0, h - 0.1), 0.0175, mat=M['chrome'], verts=24, coll=C)
        box('sm_rodtop', (0.14, 0.12, 0.06), (sx * 0.86, 0, h - 0.08), mat=M['steel'], coll=C)
        box('sm_rodbot', (0.14, 0.12, 0.06), (sx * 0.86, 0, 0.1), mat=M['steel'], coll=C)
        box('sm_carriage', (0.1, 0.09, 0.14), (sx * 0.86, 0, 1.25), mat=M['steel'], coll=C)
        for k in range(14):
            box('sm_hook', (0.03, 0.04, 0.02), (sx * w / 2, d / 2 + 0.04, 0.5 + k * 0.12), mat=M['chrome'], bev=0.003, coll=C)
    for sy in (-1, 1):
        box('sm_top', (w, 0.08, 0.08), (0, sy * d / 2, h - 0.04), mat=M['steel'], coll=C)
        box('sm_base', (w + 0.1, 0.1, 0.05), (0, sy * d / 2, 0.025), mat=M['steel'], coll=C)
    for sx in (-1, 1):
        box('sm_side', (0.08, d, 0.08), (sx * w / 2, 0, h - 0.04), mat=M['steel'], coll=C)
        box('sm_sbase', (0.1, d, 0.05), (sx * w / 2, 0, 0.025), mat=M['steel'], coll=C)
    cyl('sm_bar', 0.015, 2.05, (0, 0, 1.25), (0, math.pi / 2, 0), mat=M['knurl'], verts=16, bev=0, coll=C)
    for sx in (-1, 1):
        plate('sm_plate', 0.225, 0.055, (sx * 0.98, 0, 1.25), (0, math.pi / 2, 0), M['iron'], M, C)
    for o in set(C.objects) - start:
        if o.parent is None:
            o.parent = root
    bench(M, C, 0, -0.1, rot=math.pi / 2, incline=math.radians(28), name='smbench')
    bpy.data.objects['smbench'].parent = root
    bpy.data.objects['smbench'].rotation_euler.z = 0
    root.location = (x, y, 0)
    return root


def cable_column(M, C, x, y, rot=0.0):
    root = bpy.data.objects.new('cable', None)
    link(root, C)
    start = set(C.objects)
    box('cb_frame_l', (0.08, 0.08, 2.4), (-0.3, 0, 1.2), mat=M['steel'], coll=C)
    box('cb_frame_r', (0.08, 0.08, 2.4), (0.3, 0, 1.2), mat=M['steel'], coll=C)
    box('cb_top', (0.7, 0.3, 0.1), (0, 0, 2.4), mat=M['steel'], coll=C)
    box('cb_shroud', (0.5, 0.06, 1.4), (0, 0.12, 1.1), mat=M['steel_w'], coll=C)
    for k in range(16):
        box('cb_stack', (0.42, 0.18, 0.045), (0, -0.05, 0.12 + k * 0.05), mat=M['iron'], bev=0.003, coll=C)
    tube('cb_guide', (-0.12, -0.05, 0.1), (-0.12, -0.05, 2.3), 0.01, mat=M['chrome'], coll=C)
    tube('cb_guide', (0.12, -0.05, 0.1), (0.12, -0.05, 2.3), 0.01, mat=M['chrome'], coll=C)
    tube('cb_cable', (0.0, -0.2, 2.3), (0.0, -0.4, 1.1), 0.003, mat=M['steel'], coll=C)
    cyl('cb_pulley', 0.06, 0.03, (0, -0.2, 2.32), (0, math.pi / 2, 0), mat=M['steel'], verts=24, coll=C)
    for o in set(C.objects) - start:
        if o.parent is None:
            o.parent = root
    root.location = (x, y, 0)
    root.rotation_euler.z = rot
    return root


def plate_tree(M, C, x, y):
    start = set(C.objects)
    box('pt_base', (0.6, 0.6, 0.05), (x, y, 0.025), mat=M['steel'], coll=C)
    box('pt_post', (0.07, 0.07, 1.2), (x, y, 0.6), mat=M['steel'], coll=C)
    for k, (z, dx) in enumerate(((0.35, 1), (0.35, -1), (0.75, 1), (0.75, -1))):
        cyl('pt_peg', 0.025, 0.3, (x + dx * 0.15, y, z), (0, math.pi / 2, 0), mat=M['chrome'], verts=16, bev=0, coll=C)
        for j in range(3 - k // 2):
            r = 0.225 - j * 0.04 if k < 2 else 0.12 + j * 0.02
            plate('pt_plate', r, 0.045, (x + dx * (0.06 + j * 0.05), y, z), (0, math.pi / 2, 0), M['rubber'] if j else M['iron'], M, C)


def kettlebell(M, C, x, y, s=1.0):
    cyl('kb_body', 0.11 * s, 0.17 * s, (x, y, 0.09 * s), mat=M['iron'], verts=32, bev=0.03 * s, coll=C)
    tor = bpy.data.objects.new('kb_handle', None)
    tube('kb_h1', (x - 0.07 * s, y, 0.17 * s), (x - 0.06 * s, y, 0.28 * s), 0.013 * s, mat=M['iron'], verts=10, coll=C)
    tube('kb_h2', (x + 0.07 * s, y, 0.17 * s), (x + 0.06 * s, y, 0.28 * s), 0.013 * s, mat=M['iron'], verts=10, coll=C)
    tube('kb_h3', (x - 0.065 * s, y, 0.28 * s), (x + 0.065 * s, y, 0.28 * s), 0.013 * s, mat=M['iron'], verts=10, coll=C)


def platform(M, C, x, y):
    box('platform_wood', (1.2, 2.4, 0.04), (x, y, 0.02), mat=M['oak'], bev=0.003, coll=C)
    for sx in (-1, 1):
        box('platform_rubber', (0.9, 2.4, 0.04), (x + sx * 1.05, y, 0.02), mat=M['rubber'], bev=0.003, coll=C)


def build(with_lights=True):
    C = bpy.data.collections.new('gym')
    bpy.context.scene.collection.children.link(C)
    M = mats()
    room(M, C)
    rows, wash = lights(M, C) if with_lights else ([], [])
    dumbbell_rack(M, C, -6.6, Y1 - 0.75, n=12)
    dumbbell_rack(M, C, 1.4, Y1 - 0.75, n=10)
    for y in (-1.5, 2.3, 6.1):
        platform(M, C, 6.4, y)
        power_rack(M, C, 6.4, y, rot=math.pi / 2)
    sm = smith(M, C, -3.0, 4.6)
    bench(M, C, -0.55, -1.2, rot=math.radians(4), name='flatbench')
    bench(M, C, 1.6, 3.6, rot=math.radians(80), name='bench2')
    bench(M, C, -1.4, 7.6, rot=math.radians(-12), name='bench3')
    cable_column(M, C, -9.4, 4.8, rot=-math.pi / 2)
    cable_column(M, C, -9.4, 1.6, rot=-math.pi / 2)
    plate_tree(M, C, 3.9, 0.4)
    plate_tree(M, C, 4.0, 7.9)
    for i in range(6):
        kettlebell(M, C, -9.5 + 0.0, -4.5 + i * 0.38, 0.8 + i * 0.08)
    # a few loose plates and dumbbells on the floor, as a gym in use leaves them
    plate('loose1', 0.225, 0.055, (2.3, -3.4, 0.0285), (0, 0, 0.3), M['rubber'], M, C)
    plate('loose2', 0.2, 0.045, (2.32, -3.38, 0.075), (0, 0, 0.9), M['blue'], M, C)
    dumbbell('floordb', -2.0, -2.9, 0.06, 12, M, C)
    merge(C)
    return M, rows, wash, sm


def merge(C):
    """the whole room as one mesh (its modifiers applied): a thousand small objects cost far more to hand to the
    renderer on every frame than their triangles cost to draw"""
    dg = bpy.context.evaluated_depsgraph_get()
    objs = [o for o in C.objects if o.type == 'MESH']
    for o in objs:
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        o.modifiers.clear()
        o.data = me
    bpy.context.view_layer.update()
    with bpy.context.temp_override(active_object=objs[0], object=objs[0], selected_objects=objs, selected_editable_objects=objs):
        bpy.ops.object.join()
    objs[0].name = 'gym_mesh'
    return objs[0]


def set_rows(rows, wash, frame_on, power=1.0, bar=40.0, light=20.0, washw=120.0, accent=6.0, spot=3.4):
    """switch each row of lights on at its frame (constant keys: a light is off, then on). frame_on[i] None = always on"""
    def k(target, path_obj, attr, f, on, val):
        pass
    for i, (em, objs) in enumerate(rows):
        f = frame_on[i] if i < len(frame_on) else None
        st = em.node_tree.nodes['Emission'].inputs['Strength']
        lights_ = [o for o in objs if o.type == 'LIGHT']
        if f is None:
            st.default_value = bar * power
            for o in lights_:
                o.data.energy = light * power
            continue
        st.default_value = 0.0
        st.keyframe_insert('default_value', frame=f - 1)
        st.default_value = bar * power
        st.keyframe_insert('default_value', frame=f)
        for o in lights_:
            o.data.energy = 0.0
            o.data.keyframe_insert('energy', frame=f - 1)
            o.data.energy = light * power
            o.data.keyframe_insert('energy', frame=f)
    for o in wash:
        o.data.energy = (o["power"] * spot if "power" in o else washw) * power
    a = bpy.data.materials.get('accent')
    if a:
        a.node_tree.nodes['Emission'].inputs['Strength'].default_value = accent * power
