/* ================================================================== movements
   base = shared pose, a = lengthened position, b = contracted position. Poses use absolute joint angles
   (0 = right, 90 = up) or hand / ankle targets solved with inverse kinematics. */
def('inclineSmith', {
  view: 'side', mus: ['chest', 'delts', 'triceps'],
  base: { hip: [208, 186], torso: 140, legN: { to: [258, 229], bend: 1 } },
  a: { armN: { to: [182, 140], bend: -1, s: [0.6, 1] } }, b: { armN: { to: [182, 95], bend: -1, s: [1, 1] } },
  back(g, J, C) {
    K.tube(g, C, [124, 20], [124, G - 4], 7); K.tube(g, C, [124, 22], [196, 22], 6); K.tube(g, C, [182, 22], [182, G - 4], 3.4);
    for (let y = 60; y < 200; y += 24) K.dark(g, C, [124, y], [130, y - 3], 2.4);
    K.base(g, C, 112, 244); K.foot(g, C, 124, 26);
    K.pad(g, C, J.hip, J.sh, -12.5, 86, 9, 10); K.cushion(g, C, 216, 199, 38, 9, 6);
    K.dark(g, C, [214, 204], [214, G - 4], 5); K.dark(g, C, [176, 187], [170, G - 4], 5);
    K.plate(g, C, J.armN.c, 21);
  },
  front(g, J, C) { K.collar(g, C, J.armN.c); },
});
def('assistedPullup', {
  view: 'back', mus: ['lats', 'biceps'], tempo: [1.2, 0.3, 1.9, 0.4],
  base: { torso: 90, sw: 23, hw: 9, mirror: true, nofeet: true, legN: { a: [275, 270], s: [1, 0.3] } },
  a: { hip: [180, 158], armN: { to: [224, 44], bend: -1 } }, b: { hip: [180, 104], armN: { to: [224, 44], bend: -1 } },
  back(g, J, C) {
    K.tube(g, C, [106, 26], [106, G - 4], 8); K.tube(g, C, [254, 26], [254, G - 4], 8);
    K.tube(g, C, [106, 44], [150, 44], 4.5); K.tube(g, C, [254, 44], [210, 44], 4.5);
    capsule(g, [128, 44], [147, 44], 5.6, C.plate); capsule(g, [213, 44], [232, 44], 5.6, C.plate);
    K.stack(g, C, 254, 150, 224, (158 - J.hip[1]) * 0.4);
    K.dark(g, C, [254, 200], [204, J.legN.b[1] + 15], 5); K.pulley(g, C, [254, 200], 5);
    K.foot(g, C, 106, 34); K.foot(g, C, 254, 34);
  },
  front(g, J, C) {
    K.cushion(g, C, 180, J.legN.b[1] + 13, 76, 11, 0);
    for (const lg of [J.legF, J.legN]) { box(g, lg.c[0], lg.c[1] + 2, 12, 19, 0, C.shoe, 5); box(g, lg.c[0], lg.c[1] + 2, 6.5, 13, 0, C.sole, 3); }
  },
});
def('chestRow', {
  view: 'side', mus: ['lats', 'upback', 'biceps'],
  base: { hip: [150, 176], torso: 40, head: 30, legN: { to: [84, 221], bend: 1 }, footN: 300 },
  a: { armN: { to: [190, 207], bend: -1 } }, b: { armN: { to: [176, 166], bend: -1 } },
  back(g, J, C) {
    K.pad(g, C, J.hip, J.sh, 12.5, 72, 9, 4);
    K.dark(g, C, [184, 178], [184, G - 4], 6); K.dark(g, C, [154, 198], [146, G - 4], 5); K.cushion(g, C, 140, 199, 30, 8, 22);
    K.base(g, C, 128, 222); K.foot(g, C, 184, 22);
  },
  front(g, J, C) { K.dbSide(g, C, J.armN.c, 12); },
});
def('latRaise', {
  view: 'back', mus: ['delts'], tempo: [1.1, 0.35, 1.8, 0.3],
  base: { hip: [180, 170], torso: 90, sw: 23, hw: 9, mirror: true, legN: { a: [-72, -88], s: [0.45, 0.92] } },
  a: { armN: { a: [-83, -86] } }, b: { armN: { a: [-4, -10] } },
  back(g, J, C) { K.cushion(g, C, 180, 188, 58, 10, 0); K.dark(g, C, [180, 193], [180, G - 4], 7); K.base(g, C, 148, 212); },
  front(g, J, C) { K.dbEnd(g, C, J.armN.c); K.dbEnd(g, C, J.armF.c); },
});
def('machinePress', {
  view: 'side', mus: ['chest', 'triceps', 'delts'],
  base: { hip: [150, 186], torso: 100, head: 98, legN: { to: [202, 229], bend: 1 } },
  a: { armN: { to: [163, 146], bend: -1, s: [0.55, 1] } }, b: { armN: { to: [203, 144], bend: -1, s: [1, 1] } },
  back(g, J, C, t) {
    K.tube(g, C, [104, 48], [104, G - 4], 11); K.stack(g, C, 104, 150, 224, t * 22); K.tube(g, C, [104, 52], [158, 52], 6);
    K.pad(g, C, J.hip, J.sh, -12.5, 64, 9, 2); K.cushion(g, C, 158, 199, 44, 9, 0); K.dark(g, C, [156, 204], [156, G - 4], 6);
    K.base(g, C, 92, 218); K.dark(g, C, [158, 52], J.armN.c, 4.5); K.pulley(g, C, [158, 52], 5);
  },
  front(g, J, C) { K.grip(g, C, J.armN.c, 90, 14); },
});
def('pushdown', {
  view: 'side', mus: ['triceps'],
  base: { hip: [158, 143], torso: 80, head: 78, legN: { to: [164, 229], bend: 1 } },
  a: { armN: { a: [278, 52] } }, b: { armN: { a: [278, -80] } },
  back(g, J, C, t) { K.tower(g, C, 246, { pulley: [218, 38], lift: t * 24 }); K.cable(g, C, [[218, 44], J.armN.c]); },
  front(g, J, C) { K.rope(g, C, J.armN.c, J.armN.a2 + 90); },
});
def('dbCurl', {
  view: 'side', mus: ['biceps'],
  base: { hip: [176, 141], torso: 90, legN: { a: [270, 270] } },
  a: { armN: { a: [268, 274] } }, b: { armN: { a: [276, 432] } },
  front(g, J, C) { K.dbEnd(g, C, J.armN.c); },
});
def('hammerCurl', {
  view: 'side', mus: ['biceps', 'forearm'],
  base: { hip: [176, 141], torso: 90, legN: { a: [270, 270] } },
  a: { armN: { a: [268, 274] } }, b: { armN: { a: [276, 432] } },
  front(g, J, C) { K.dbSide(g, C, J.armN.c, J.armN.a2 + 90); },
});
def('cableCrunch', {
  view: 'side', mus: ['abs'], tempo: [1.2, 0.4, 1.8, 0.3],
  base: { hip: [182, 185.4], legN: { a: [278, 182] }, footN: 195 },
  a: { torso: 78, chest: 72, head: 62, armN: { to: [211, 126], bend: -1 } }, b: { torso: 68, chest: 2, head: -28, armN: { to: [233.5, 174.2], bend: -1 } },
  back(g, J, C, t) { K.tower(g, C, 284, { pulley: [258, 34], lift: t * 24 }); K.cable(g, C, [[258, 40], J.armN.c]); box(g, 186, G - 2.5, 60, 5, 0, C.pad, 2.5); },
  front(g, J, C) { K.rope(g, C, J.armN.c, J.armN.a2 + 90); },
});
def('hackSquat', {
  view: 'side', mus: ['quads', 'glutes'], tempo: [1.2, 0.2, 2.0, 0.3],
  base: { torso: 122, legN: { to: [238, 200], bend: 1 }, footN: 32 },
  a: { hip: [214.7, 162.7], armN: { to: [201, 125], bend: -1 } }, b: { hip: [193.5, 128.8], armN: { to: [180, 91], bend: -1 } },
  back(g, J, C) {
    const u = dir(122), n = [-u[1], u[0]], mid = lerp2(J.hip, J.sh, 0.5);
    K.tube(g, C, [122.9, 53.8], [234.3, 232], 8); K.tube(g, C, [122.9, 53.8], [122.9, G - 4], 6); K.base(g, C, 110, 284); K.foot(g, C, 122.9, 24);
    K.dark(g, C, [mid[0] - n[0] * 13, mid[1] - n[1] * 13], [mid[0] - n[0] * 20, mid[1] - n[1] * 20], 9);
    K.plate(g, C, [mid[0] - n[0] * 31 - u[0] * 16, mid[1] - n[1] * 31 - u[1] * 16], 15);
    K.pad(g, C, J.hip, J.sh, -12.5, 68, 9, 0);
    K.cushion(g, C, J.sh[0] + u[0] * 10 + 5, J.sh[1] + u[1] * 10 - 2, 22, 10, 32);
    box(g, 249, 205, 52, 6, 32, C.eq2, 3); K.dark(g, C, [256, 209], [264, G - 4], 5);
  },
});
def('rdl', {
  view: 'side', mus: ['hams', 'glutes', 'lowback'], tempo: [1.2, 0.25, 2.0, 0.3],
  base: { legN: { to: [176, 229], bend: 1 } },
  a: { hip: [150, 150], torso: 22, head: 16, armN: { to: [190, 193], bend: -1 } }, b: { hip: [172, 141], torso: 88, head: 88, armN: { to: [179, 154], bend: -1 } },
  back(g, J, C) { K.plate(g, C, J.armN.c, 21); },
  front(g, J, C) { K.collar(g, C, J.armN.c); },
});
def('legPress', {
  view: 'side', mus: ['quads', 'glutes'], tempo: [1.2, 0.2, 2.0, 0.3],
  base: { hip: [146, 198], torso: 150, head: 142, footN: 138, armN: { to: [140, 204], bend: 1 } },
  a: { legN: { to: [176.8, 163.8], bend: 1 } }, b: { legN: { to: [200.9, 137.1], bend: 1 } },
  back(g, J, C) {
    const p = dir(48), q = dir(138), an = J.footN.a, fc = [an[0] + p[0] * 10 + q[0] * 6.5, an[1] + p[1] * 10 + q[1] * 6.5];
    K.tube(g, C, [148, 226], [262, 99.4], 7); K.tube(g, C, [262, 99.4], [262, G - 4], 6); K.base(g, C, 70, 278); K.foot(g, C, 262, 24);
    K.pad(g, C, J.hip, J.sh, -12.5, 74, 9, 4); K.cushion(g, C, 152, 212, 36, 9, -18); K.dark(g, C, [116, 206], [116, G - 4], 5);
    box(g, fc[0] + p[0] * 14, fc[1] + p[1] * 14, 24, 26, 48, C.eq, 4); K.plate(g, C, [fc[0] + p[0] * 32, fc[1] + p[1] * 32], 16);
    box(g, fc[0], fc[1], 54, 6, 138, C.eq2, 3);
  },
});
def('seatedLegCurl', {
  view: 'side', mus: ['hams'],
  base: { hip: [138, 172], torso: 108, head: 100, footN: 'p', armN: { to: [160, 160], bend: -1 } },
  a: { legN: { a: [-2, -8] } }, b: { legN: { a: [-2, -112] } },
  back(g, J, C, t) {
    K.pad(g, C, J.hip, J.sh, -12.5, 66, 9, 2); K.cushion(g, C, 158, 185, 62, 9, 0);
    box(g, 146, 212, 50, 44, 0, C.eq, 5); K.stack(g, C, 146, 196, 230, t * 9); K.base(g, C, 112, 206);
    ring(g, J.legN.b, 7, C.eq2, C.eq, 2);
  },
  front(g, J, C) {
    const k = J.legN.b, an = J.legN.c, s = unit(k, an), n = [-s[1], s[0]], r = [an[0] - s[0] * 6 + n[0] * 10.5, an[1] - s[1] * 6 + n[1] * 10.5];
    K.dark(g, C, [k[0] + n[0] * 9, k[1] + n[1] * 9], r, 3.6); ring(g, r, 7, C.pad, C.padHi, 1.2); K.cushion(g, C, 171, 159.5, 28, 9, 0);
  },
});
def('standingCalf', {
  view: 'side', mus: ['calves'], tempo: [0.9, 0.5, 1.5, 0.6],
  base: { torso: 90, legN: { a: [270, 270] } },
  a: { hip: [176.4, 128.2], footN: 20, armN: { to: [189, 84], bend: -1 } }, b: { hip: [185.3, 115.9], footN: -38, armN: { to: [198, 72], bend: -1 } },
  back(g, J, C, t) {
    box(g, 190, 227, 42, 18, 0, C.eq, 3); capsule(g, [172, 219], [208, 219], 2.4, C.eq2);
    K.tube(g, C, [98, 30], [98, G - 4], 11); K.stack(g, C, 98, 150, 224, t * 12); K.foot(g, C, 98, 34); K.base(g, C, 86, 216);
    K.dark(g, C, [98, 52], [J.sh[0] - 4, J.sh[1] - 10], 5); K.pulley(g, C, [98, 52], 5);
    K.cushion(g, C, J.sh[0] - 2, J.sh[1] - 10, 26, 9, 0);
  },
});
def('pallof', {
  view: 'top', mus: ['core'], tempo: [1.3, 1.1, 1.3, 0.5],
  draw(g, t, C, glow) {
    const c = [208, 166], hand = [c[0], lerp(c[1] - 19, c[1] - 58, t)], s0 = lerp(0.22, 1, t);
    box(g, 56, 130, 30, 84, 0, C.eq, 6); for (let i = 0; i < 9; i++) box(g, 56, 100 + i * 7.4, 20, 5.4, 0, i < 4 ? C.plate : C.eq2, 1.4);
    K.pulley(g, C, [78, 130], 6.5); K.cable(g, C, [[84, 130], [hand[0] - 7, hand[1]]]);
    const mx = lerp(84, hand[0] - 7, 0.5), my = lerp(130, hand[1], 0.5), u = unit(hand, [84, 130]);
    g.fillStyle = C.cable; g.beginPath(); g.moveTo(mx + u[0] * 8, my + u[1] * 8); g.lineTo(mx - u[1] * 4.5, my + u[0] * 4.5); g.lineTo(mx + u[1] * 4.5, my - u[0] * 4.5); g.closePath(); g.fill();
    const armR = limb([c[0] + 23, c[1]], { to: [hand[0] + 3, hand[1]], bend: -1, s: [s0, 1] }, LEN.ua, LEN.fa);
    const armL = limb([c[0] - 23, c[1]], { to: [hand[0] - 3, hand[1]], bend: 1, s: [s0, 1] }, LEN.ua, LEN.fa);
    drawTop(g, C, c, [armL, armR], { feet: true, glow, ry: 14, headDy: 3, mus() { g.beginPath(); g.ellipse(c[0], c[1] - 6.5, 19, 5.6, 0, 0, TAU); g.fill(); } });
    K.grip(g, C, hand, 0, 14);
  },
});
def('reversePec', {
  view: 'top', mus: ['reardelt', 'upback'], tempo: [1.1, 0.35, 1.8, 0.3],
  draw(g, t, C, glow) {
    const c = [180, 172], at = (k) => [lerp(100, -8, k), lerp(96, -14, k)], aR = at(t);
    const arm = (s, a) => limb([c[0] + s * 23, c[1]], { a: s > 0 ? a : [180 - a[0], 180 - a[1]] }, LEN.ua, LEN.fa);
    const armR = arm(1, aR), armL = arm(-1, aR);
    box(g, c[0], c[1] - 78, 30, 56, 0, C.eq, 6); for (let i = 0; i < 6; i++) box(g, c[0], c[1] - 98 + i * 7.4, 20, 5.4, 0, i < 3 ? C.plate : C.eq2, 1.4);
    box(g, c[0], c[1] + 10, 44, 38, 0, C.eq2, 8);
    for (const a of [armL, armR]) K.dark(g, C, [c[0] + (a === armR ? 9 : -9), c[1] - 52], a.c, 3.4);
    drawTop(g, C, c, [armL, armR], {
      thighs: true, glow,
      mid() { K.dark(g, C, [c[0], c[1] - 50], [c[0], c[1] - 24], 7); K.cushion(g, C, c[0], c[1] - 19, 40, 10, 0); },
      mus() { for (const s of [-1, 1]) { g.beginPath(); g.ellipse(c[0] + s * 22, c[1] + 5, 6.5, 5, 0, 0, TAU); g.fill(); } g.beginPath(); g.ellipse(c[0], c[1] + 7.5, 13, 3.8, 0, 0, TAU); g.fill(); },
    });
    K.grip(g, C, armR.c, armR.a2 + 90, 10); K.grip(g, C, armL.c, armL.a2 + 90, 10);
  },
});
def('cableRow', {
  view: 'side', mus: ['lats', 'upback', 'biceps'],
  base: { hip: [128, 186], legN: { to: [210, 200], bend: 1 }, footN: 78 },
  a: { torso: 74, armN: { to: [204, 152], bend: -1 } }, b: { torso: 97, armN: { to: [146, 162], bend: -1 } },
  back(g, J, C, t) {
    K.cushion(g, C, 126, 200, 60, 9, 0); K.dark(g, C, [108, 205], [108, G - 4], 5); K.dark(g, C, [144, 205], [144, G - 4], 5);
    K.dark(g, C, [150, 222], [272, 222], 5); box(g, 221, 196, 6, 50, -12, C.eq2, 3);
    K.tower(g, C, 286, { pulley: [264, 158], lift: t * 24 }); K.cable(g, C, [[258, 158], J.armN.c]); K.base(g, C, 98, 300);
  },
  front(g, J, C) { K.grip(g, C, J.armN.c, 90, 14); },
});
def('shoulderPress', {
  view: 'side', mus: ['delts', 'triceps'],
  base: { hip: [158, 188], torso: 98, head: 95, legN: { to: [210, 229], bend: 1 } },
  a: { armN: { to: [166, 124], bend: -1, s: [0.6, 1] } }, b: { armN: { to: [164, 74], bend: -1, s: [1, 1] } },
  back(g, J, C, t) {
    K.tube(g, C, [106, 56], [106, G - 4], 11); K.stack(g, C, 106, 150, 224, t * 22);
    K.pad(g, C, J.hip, J.sh, -12.5, 68, 9, 4); K.cushion(g, C, 166, 201, 44, 9, 0); K.dark(g, C, [164, 206], [164, G - 4], 6);
    K.base(g, C, 94, 226); K.dark(g, C, [106, 98], J.armN.c, 4.5); K.pulley(g, C, [106, 98], 5);
  },
  front(g, J, C) { K.grip(g, C, J.armN.c, 0, 14); },
});
def('ohTriceps', {
  view: 'side', mus: ['triceps'],
  base: { hip: [176, 141], torso: 84, head: 84, legN: { a: [270, 270] } },
  a: { armN: { a: [78, 208] } }, b: { armN: { a: [78, 80] } },
  back(g, J, C, t) { K.tower(g, C, 94, { pulley: [118, 212], lift: t * 24 }); K.cable(g, C, [[122, 208], J.armN.c]); },
  front(g, J, C) { K.rope(g, C, J.armN.c, J.armN.a2 + 90); },
});
def('kneeRaise', {
  view: 'side', mus: ['abs'], tempo: [1.1, 0.35, 1.8, 0.4],
  base: { armN: { to: [180, 14], bend: -1 } },
  a: { hip: [180, 131], torso: 90, chest: 90, legN: { a: [272, 250] }, footN: 310 }, b: { hip: [188.9, 129.6], torso: 110, chest: 92, legN: { a: [380, 262] }, footN: 330 },
  back(g, J, C) { K.tube(g, C, [98, 8], [98, G - 4], 10); K.tube(g, C, [98, 14], [180, 14], 6); K.foot(g, C, 98, 34); K.base(g, C, 84, 156); },
  front(g, J, C) { ring(g, [180, 14], 5, C.eq2, C.eqHi, 1.6); },
});
def('bulgarian', {
  view: 'side', mus: ['quads', 'glutes'], tempo: [1.2, 0.2, 2.0, 0.3],
  base: { legN: { to: [212, 229], bend: 1 }, legF: { to: [136, 184], bend: 1 }, footN: 0, footF: 205, armN: { a: [270, 272] } },
  a: { hip: [178, 184], torso: 76 }, b: { hip: [180, 148], torso: 82 },
  back(g, J, C) { K.bench(g, C, 88, 150, 190); },
  front(g, J, C) { K.dbSide(g, C, J.armN.c, 0); },
});
function thrustBar(J) { const n = nrm(J.hip, J.mid); return [J.hip[0] + n[0] * 11 + 4, J.hip[1] + n[1] * 11]; }
def('hipThrust', {
  view: 'side', mus: ['glutes', 'hams'], tempo: [1.1, 0.5, 1.8, 0.3],
  base: { legN: { to: [208, 229], bend: 1 } },
  a: { hip: [153.5, 211.3], torso: 143, head: 120, armN: { to: [157, 203], bend: 1 } }, b: { hip: [164, 181.8], torso: 178, head: 152, armN: { to: [161, 171], bend: 1 } },
  back(g, J, C) { K.bench(g, C, 58, 110, 190); K.plate(g, C, thrustBar(J), 20); },
  front(g, J, C) { K.collar(g, C, thrustBar(J)); },
});
def('lyingLegCurl', {
  view: 'side', mus: ['hams'],
  base: { hip: [176, 166], torso: 4, head: 24, footN: 'p', armN: { to: [232, 192], bend: 1 } },
  a: { legN: { a: [183, 186] } }, b: { legN: { a: [183, 70] } },
  back(g, J, C, t) {
    K.cushion(g, C, 188, 181.5, 142, 11, 0); box(g, 192, 209, 70, 44, 0, C.eq, 5); K.stack(g, C, 192, 196, 228, t * 9); K.base(g, C, 128, 256);
    K.dark(g, C, [228, 190], [236, 194], 4); ring(g, [J.legN.b[0], J.legN.b[1] + 11], 7, C.eq2, C.eq, 2);
  },
  front(g, J, C) {
    const k = J.legN.b, an = J.legN.c, s = unit(k, an), n = [-s[1], s[0]], r = [an[0] - s[0] * 6 + n[0] * 10.5, an[1] - s[1] * 6 + n[1] * 10.5];
    K.dark(g, C, [k[0], k[1] + 11], r, 3.6); ring(g, r, 7, C.pad, C.padHi, 1.2);
  },
});
def('legExt', {
  view: 'side', mus: ['quads'],
  base: { hip: [140, 176], torso: 106, head: 98, footN: 'p', armN: { to: [150, 186], bend: -1 } },
  a: { legN: { a: [-2, 258] } }, b: { legN: { a: [-2, 354] } },
  back(g, J, C, t) {
    K.pad(g, C, J.hip, J.sh, -12.5, 66, 9, 2); K.cushion(g, C, 160, 189, 62, 9, 0);
    box(g, 148, 215, 50, 40, 0, C.eq, 5); K.stack(g, C, 148, 200, 230, t * 9); K.base(g, C, 112, 208);
    ring(g, J.legN.b, 7, C.eq2, C.eq, 2);
  },
  front(g, J, C) {
    const k = J.legN.b, an = J.legN.c, s = unit(k, an), n = [-s[1], s[0]], r = [an[0] - s[0] * 5 - n[0] * 10.5, an[1] - s[1] * 5 - n[1] * 10.5];
    K.dark(g, C, [k[0] - n[0] * 9, k[1] - n[1] * 9], r, 3.6); ring(g, r, 7, C.pad, C.padHi, 1.2);
  },
});
def('seatedCalf', {
  view: 'side', mus: ['calves'], tempo: [0.9, 0.5, 1.5, 0.6],
  base: { hip: [150, 184], torso: 92 },
  a: { legN: { to: [192.5, 217.6], bend: 1 }, footN: 18, armN: { to: [188.7, 159.6], bend: -1 } }, b: { legN: { to: [200.3, 206.4], bend: 1 }, footN: -34, armN: { to: [185, 150], bend: -1 } },
  back(g, J, C) {
    box(g, 213, 229, 36, 14, 0, C.eq, 3); capsule(g, [197, 222], [229, 222], 2.4, C.eq2);
    K.cushion(g, C, 148, 198, 48, 9, 0); K.dark(g, C, [148, 203], [148, G - 4], 6);
    K.tube(g, C, [266, 146], [266, G - 4], 8); K.foot(g, C, 266, 26); K.base(g, C, 124, 278);
  },
  front(g, J, C) {
    const k = J.legN.b, pc = [k[0] - 6, k[1] - 13];
    K.dark(g, C, pc, [266, 170], 4.5); K.pulley(g, C, [266, 170], 5); K.plate(g, C, lerp2(pc, [266, 170], 0.6), 12); K.cushion(g, C, pc[0], pc[1], 32, 9, 0);
  },
});

/* ================================================================== round 3: movements done with the body's own weight
   (a park with a bar and parallel bars, or a floor at home), with dumbbells at home, and a few more of the gym */
const floorMat = (g, C, x, w) => box(g, x, G - 2.5, w, 5, 0, C.pad, 2.5);
def('pushUp', {
  view: 'side', mus: ['chest', 'triceps', 'delts'], tempo: [1.0, 0.2, 1.6, 0.3],
  base: { legN: { to: [112, 216], bend: 1 }, footN: 262, armN: { to: [243, 231], bend: -1 } },
  a: { hip: [200, 213.5], torso: 1.6, head: 8 }, b: { hip: [194.2, 184.6], torso: 20.9, head: 22 },
});
def('kneePushUp', {
  view: 'side', mus: ['chest', 'triceps', 'delts'], tempo: [1.0, 0.2, 1.6, 0.3],
  base: { legN: { to: [112, 206], bend: 1 }, footN: 130, armN: { to: [236, 231], bend: -1 } },
  a: { hip: [193.5, 221.1], torso: 9, head: 14 }, b: { hip: [185, 201.4], torso: 37.2, head: 34 },
  back(g, J, C) { floorMat(g, C, 150, 64); },
});
def('declinePushUp', {
  view: 'side', mus: ['chest', 'delts', 'triceps'], tempo: [1.0, 0.2, 1.6, 0.3],
  base: { legN: { to: [105, 180], bend: 1 }, footN: 205, armN: { to: [243, 231], bend: -1 } },
  a: { hip: [190.7, 200.1], torso: -13.2, head: -4 }, b: { hip: [192.6, 171.2], torso: 5.75, head: 10 },
  back(g, J, C) { K.bench(g, C, 58, 122, 190); },
});
def('diamondPushUp', {
  view: 'side', mus: ['triceps', 'chest'], tempo: [1.0, 0.2, 1.6, 0.3],
  base: { legN: { to: [112, 216], bend: 1 }, footN: 262, armN: { to: [232, 231], bend: -1 } },
  a: { hip: [200, 213.5], torso: 1.6, head: 8 }, b: { hip: [194.2, 184.6], torso: 20.9, head: 22 },
});
def('dips', {
  view: 'side', mus: ['chest', 'triceps', 'delts'], tempo: [1.1, 0.2, 1.7, 0.3],
  base: { armN: { to: [182, 150], bend: -1 }, legN: { a: [268, 212], s: [1, 0.78] }, footN: 'p' },
  a: { hip: [170, 160], torso: 76, head: 72 }, b: { hip: [172, 137.2], torso: 82, head: 82 },
  back(g, J, C) { K.tube(g, C, [156, 150], [156, G - 4], 6); K.tube(g, C, [210, 150], [210, G - 4], 6); K.tube(g, C, [146, 150], [220, 150], 5); K.foot(g, C, 156, 24); K.foot(g, C, 210, 24); },
  front(g, J, C) { capsule(g, [172, 150], [192, 150], 5.6, C.plate); },
});
def('benchDip', {
  view: 'side', mus: ['triceps'], tempo: [1.0, 0.2, 1.6, 0.3],
  base: { armN: { to: [154, 185], bend: -1 }, legN: { to: [245, 222], bend: 1 }, footN: 62, torso: 110, head: 100 },
  a: { hip: [176, 199] }, b: { hip: [174, 170] },
  back(g, J, C) { K.bench(g, C, 92, 160, 186); },
});
def('pullUp', {
  view: 'back', mus: ['lats', 'biceps'], tempo: [1.2, 0.3, 1.9, 0.4],
  base: { torso: 90, sw: 23, hw: 9, mirror: true, legN: { a: [272, 268], s: [1, 0.55] }, armN: { to: [222, 32], bend: -1 } },
  a: { hip: [180, 140] }, b: { hip: [180, 96] },
  back(g, J, C) { K.tube(g, C, [100, 20], [100, G - 4], 8); K.tube(g, C, [260, 20], [260, G - 4], 8); K.tube(g, C, [100, 32], [260, 32], 5); K.foot(g, C, 100, 34); K.foot(g, C, 260, 34); },
});
def('chinUp', {
  view: 'back', mus: ['biceps', 'lats'], tempo: [1.2, 0.3, 1.9, 0.4],
  base: { torso: 90, sw: 23, hw: 9, mirror: true, legN: { a: [272, 268], s: [1, 0.55] }, armN: { to: [207, 32], bend: -1 } },
  a: { hip: [180, 140] }, b: { hip: [180, 98] },
  back(g, J, C) { K.tube(g, C, [100, 20], [100, G - 4], 8); K.tube(g, C, [260, 20], [260, G - 4], 8); K.tube(g, C, [100, 32], [260, 32], 5); K.foot(g, C, 100, 34); K.foot(g, C, 260, 34); },
});
def('australianRow', {
  view: 'side', mus: ['lats', 'upback', 'biceps'], tempo: [1.1, 0.3, 1.8, 0.3],
  base: { legN: { to: [262, 226], bend: 1 }, footN: 62, armN: { to: [155, 155], bend: -1 } },
  a: { hip: [174.7, 215.3], torso: 173, head: 168 }, b: { hip: [182.5, 188.3], torso: 154.6, head: 150 },
  back(g, J, C) { K.tube(g, C, [155, 155], [155, G - 4], 6); K.foot(g, C, 155, 26); },
  front(g, J, C) { ring(g, [155, 155], 5, C.eq2, C.eqHi, 1.6); },
});
def('pikePushUp', {
  view: 'side', mus: ['delts', 'triceps'], tempo: [1.0, 0.2, 1.6, 0.3],
  base: { legN: { to: [116, 222], bend: 1 }, footN: 258 },
  a: { hip: [180.6, 168.2], torso: -50, head: -34, armN: { to: [222, 231], bend: 1, s: [0.5, 1] } }, b: { hip: [146, 140], torso: -50.1, head: -52, armN: { to: [222, 231], bend: 1, s: [1, 1] } },
});
def('bwSquat', {
  view: 'side', mus: ['quads', 'glutes'], tempo: [1.2, 0.2, 2.0, 0.3],
  base: { legN: { to: [178, 229], bend: 1 } },
  a: { hip: [150, 186], torso: 58, head: 70, armN: { a: [8, 4] } }, b: { hip: [176, 141], torso: 88, head: 88, armN: { a: [-75, -70] } },
});
def('bwLunge', {
  view: 'side', mus: ['quads', 'glutes'], tempo: [1.2, 0.2, 2.0, 0.3],
  base: { legN: { to: [214, 229], bend: 1 }, legF: { to: [128, 220], bend: 1 }, footN: 0, footF: 248, armN: { a: [268, 278] } },
  a: { hip: [176, 186], torso: 84 }, b: { hip: [178, 150], torso: 88 },
});
def('gluteBridge', {
  view: 'side', mus: ['glutes', 'hams'], tempo: [1.1, 0.5, 1.8, 0.3],
  base: { legN: { to: [214, 229], bend: 1 }, armN: { a: [352, 356] }, head: 180 },
  a: { hip: [164, 222.2], torso: 182 }, b: { hip: [154.1, 193.4], torso: 216 },
  back(g, J, C) { floorMat(g, C, 160, 176); },
});
def('singleRdl', {
  view: 'side', mus: ['hams', 'glutes', 'lowback'], tempo: [1.2, 0.25, 2.0, 0.3],
  base: { legN: { to: [176, 229], bend: 1 }, armN: { a: [270, 272] }, footF: 'p' },
  a: { hip: [158, 147], torso: 14, head: 8, legF: { a: [192, 190] } }, b: { hip: [174, 141], torso: 88, head: 88, legF: { a: [268, 270] } },
});
def('plank', {
  view: 'side', mus: ['abs'], tempo: [1.6, 0.4, 1.6, 0.4],
  base: { legN: { to: [100, 214], bend: 1 }, footN: 262, armN: { a: [265, 2] }, torso: 7, head: 10 },
  a: { hip: [187.3, 204.4] }, b: { hip: [187.3, 201.4] },
  back(g, J, C) { floorMat(g, C, 180, 200); },
});
def('hollow', {
  view: 'side', mus: ['abs'], tempo: [1.4, 0.5, 1.4, 0.5],
  base: { hip: [178, 222], footN: 'p' },
  a: { torso: 170, chest: 164, head: 158, legN: { a: [10, 8] }, armN: { a: [172, 170] } }, b: { torso: 160, chest: 150, head: 142, legN: { a: [22, 18] }, armN: { a: [158, 154] } },
  back(g, J, C) { floorMat(g, C, 178, 190); },
});
def('lSit', {
  view: 'side', mus: ['abs'], tempo: [1.4, 0.6, 1.4, 0.5],
  base: { hip: [178, 164], torso: 90, armN: { to: [178, 176], bend: -1 }, footN: 'p' },
  a: { legN: { a: [350, 348] } }, b: { legN: { a: [366, 364] } },
  back(g, J, C) { K.tube(g, C, [152, 176], [152, G - 4], 6); K.tube(g, C, [206, 176], [206, G - 4], 6); K.tube(g, C, [142, 176], [216, 176], 5); K.foot(g, C, 152, 24); K.foot(g, C, 206, 24); },
  front(g, J, C) { capsule(g, [168, 176], [188, 176], 5.6, C.plate); },
});
def('legRaise', {
  view: 'side', mus: ['abs'], tempo: [1.2, 0.3, 1.9, 0.3],
  base: { hip: [150, 222], torso: 181, head: 180, armN: { a: [354, 358] }, footN: 'p' },
  a: { legN: { a: [8, 6] } }, b: { legN: { a: [86, 84] } },
  back(g, J, C) { floorMat(g, C, 150, 190); },
});
def('bwCalf', {
  view: 'side', mus: ['calves'], tempo: [0.9, 0.5, 1.5, 0.6],
  base: { torso: 90, legN: { a: [270, 270] }, armN: { a: [272, 285] } },
  a: { hip: [176.4, 128.2], footN: 20 }, b: { hip: [185.3, 115.9], footN: -38 },
  back(g, J, C) { box(g, 190, 227, 42, 18, 0, C.eq, 3); capsule(g, [172, 219], [208, 219], 2.4, C.eq2); },
});
def('proneY', {
  view: 'side', mus: ['delts', 'upback'], tempo: [1.1, 0.4, 1.6, 0.3],
  base: { hip: [150, 224], torso: 0, legN: { a: [180, 180] }, footN: 180 },
  a: { chest: 2, head: 2, armN: { a: [-4, -2] } }, b: { chest: 14, head: 16, armN: { a: [24, 20] } },
  back(g, J, C) { floorMat(g, C, 170, 230); },
});
def('dbFloorPress', {
  view: 'side', mus: ['chest', 'triceps', 'delts'],
  base: { hip: [176, 222], torso: 180, head: 180, legN: { to: [224, 229], bend: 1 } },
  a: { armN: { a: [20, 90], s: [0.15, 1] } }, b: { armN: { a: [90, 90], s: [1, 1] } },
  back(g, J, C) { floorMat(g, C, 160, 190); },
  front(g, J, C) { K.dbSide(g, C, J.armN.c, 0); },
});
def('dbRow', {
  view: 'side', mus: ['lats', 'upback', 'biceps'],
  base: { hip: [150, 150], torso: 8, head: 14, legN: { to: [144, 229], bend: 1 }, legF: { to: [178, 229], bend: 1 }, armF: { to: [208, 196], bend: -1 } },
  a: { armN: { to: [203, 207], bend: -1 } }, b: { armN: { to: [186, 156], bend: -1 } },
  back(g, J, C) { K.bench(g, C, 188, 262, 196); },
  front(g, J, C) { K.dbSide(g, C, J.armN.c, 0); },
});
def('dbHipThrust', {
  view: 'side', mus: ['glutes', 'hams'], tempo: [1.1, 0.5, 1.8, 0.3],
  base: { legN: { to: [208, 229], bend: 1 } },
  a: { hip: [153.5, 211.3], torso: 143, head: 120, armN: { to: [157, 203], bend: 1 } }, b: { hip: [164, 181.8], torso: 178, head: 152, armN: { to: [161, 171], bend: 1 } },
  back(g, J, C) { K.bench(g, C, 58, 110, 190); },
  front(g, J, C) { K.dbEnd(g, C, thrustBar(J)); },
});
def('dbOhExt', {
  view: 'side', mus: ['triceps'],
  base: { hip: [176, 141], torso: 88, head: 88, legN: { a: [270, 270] } },
  a: { armN: { a: [82, 214] } }, b: { armN: { a: [84, 84] } },
  front(g, J, C) { K.dbEnd(g, C, J.armN.c); },
});
def('dbLatRaise', {
  view: 'back', mus: ['delts'], tempo: [1.1, 0.35, 1.8, 0.3],
  base: { hip: [180, 141], torso: 90, sw: 23, hw: 9, mirror: true, legN: { a: [272, 270] } },
  a: { armN: { a: [-83, -86] } }, b: { armN: { a: [-4, -10] } },
  front(g, J, C) { K.dbEnd(g, C, J.armN.c); K.dbEnd(g, C, J.armF.c); },
});
def('benchPress', {
  view: 'side', mus: ['chest', 'triceps', 'delts'],
  base: { hip: [200, 180], torso: 180, head: 180, legN: { to: [246, 229], bend: 1 } },
  a: { armN: { to: [163, 163], bend: -1, s: [0.5, 1] } }, b: { armN: { to: [158, 115], bend: -1, s: [1, 1] } },
  back(g, J, C) {
    K.bench(g, C, 100, 224, 190); K.tube(g, C, [120, 100], [120, G - 4], 5); K.dark(g, C, [120, 108], [130, 104], 3); K.foot(g, C, 120, 22);
    K.plate(g, C, J.armN.c, 21);
  },
  front(g, J, C) { K.collar(g, C, J.armN.c); },
});
const squatBar = (J) => [J.sh[0] - 7, J.sh[1] - 3];
def('backSquat', {
  view: 'side', mus: ['quads', 'glutes'], tempo: [1.2, 0.2, 2.0, 0.3],
  base: { legN: { to: [180, 229], bend: 1 }, armN: { a: [250, 80] } },
  a: { hip: [152, 184], torso: 56, head: 68 }, b: { hip: [176, 141], torso: 86, head: 86 },
  back(g, J, C) { K.plate(g, C, squatBar(J), 21); },
  front(g, J, C) { K.collar(g, C, squatBar(J)); },
});
def('pecDeck', {
  view: 'top', mus: ['chest'], tempo: [1.1, 0.35, 1.8, 0.3],
  draw(g, t, C, glow) {
    const c = [180, 150], aR = [lerp(8, 62, t), lerp(80, 108, t)];
    const arm = (s, a) => limb([c[0] + s * 23, c[1]], { a: s > 0 ? a : [180 - a[0], 180 - a[1]] }, LEN.ua, LEN.fa);
    const armR = arm(1, aR), armL = arm(-1, aR);
    box(g, c[0], c[1] + 62, 30, 56, 0, C.eq, 6); for (let i = 0; i < 6; i++) box(g, c[0], c[1] + 42 + i * 7.4, 20, 5.4, 0, i < 3 ? C.plate : C.eq2, 1.4);
    for (const a of [armL, armR]) K.dark(g, C, [c[0] + (a === armR ? 30 : -30), c[1] + 20], a.b, 4);
    drawTop(g, C, c, [armL, armR], {
      thighs: true, glow,
      mid() { K.cushion(g, C, c[0], c[1] + 17, 48, 11, 0); },
      mus() { for (const s of [-1, 1]) { g.beginPath(); g.ellipse(c[0] + s * 11, c[1] - 6.5, 9.5, 4.6, 0, 0, TAU); g.fill(); } },
    });
    for (const a of [armL, armR]) { K.cushion(g, C, (a.b[0] + a.c[0]) / 2 + (a === armR ? 7 : -7), (a.b[1] + a.c[1]) / 2, 9, 24, 0); K.grip(g, C, a.c, a.a2 + 90, 10); }
  },
});
/* the two machines of the hips, seen from above: the knees open against the pads, or close against them */
function hipMachine(g, t, C, glow, out) {
  const c = [180, 176], open = out ? lerp(10, 34, t) : lerp(34, 10, t);
  box(g, c[0], c[1] + 58, 30, 50, 0, C.eq, 6); for (let i = 0; i < 5; i++) box(g, c[0], c[1] + 42 + i * 7.4, 20, 5.4, 0, i < 3 ? C.plate : C.eq2, 1.4);
  const knee = (s) => [c[0] + s * (14 + open), c[1] - 50 + open * 0.16], arm = (s) => limb([c[0] + s * 23, c[1]], { a: s > 0 ? [288, 250] : [252, 290], s: [0.5, 0.5] }, LEN.ua, LEN.fa);
  drawTop(g, C, c, [arm(-1), arm(1)], {
    glow, ry: 13,
    mid() {
      for (const s of [-1, 1]) {
        const k = knee(s), h = [c[0] + s * 11, c[1] - 2], padX = k[0] + s * (out ? 13 : -13);
        g.beginPath(); g.ellipse(k[0] + s * 2, k[1] - 16, 5.4, 12, s * 0.1, 0, TAU); g.fillStyle = C.shoe; g.fill();
        capsule(g, h, k, 16, C.far); capsule(g, h, lerp2(h, k, 0.45), 17, C.clothFar);
        K.dark(g, C, [c[0] + s * 4, c[1] + 30], [padX, k[1] + 6], 3.4); K.cushion(g, C, padX, k[1] - 2, 9, 26, 0);
      }
      K.cushion(g, C, c[0], c[1] + 17, 48, 11, 0);
      glowOn(g, C, glow); g.fillStyle = C.muscle;
      for (const s of [-1, 1]) { const k = knee(s), h = [c[0] + s * 11, c[1] - 2], m = lerp2(h, k, 0.5); g.beginPath(); g.ellipse(m[0] + s * (out ? 6 : -5), m[1], 3.4, 15, Math.atan2(k[0] - h[0], -(k[1] - h[1])), 0, TAU); g.fill(); }
      glowOff(g);
    },
  });
}
def('abductor', { view: 'top', mus: ['glutes'], tempo: [1.1, 0.4, 1.8, 0.3], draw(g, t, C, glow) { hipMachine(g, t, C, glow, true); } });
def('adductor', { view: 'top', mus: ['hams'], tempo: [1.1, 0.4, 1.8, 0.3], draw(g, t, C, glow) { hipMachine(g, t, C, glow, false); } });
def('facePull', {
  view: 'side', mus: ['delts', 'upback'], tempo: [1.1, 0.35, 1.8, 0.3],
  base: { hip: [150, 141], torso: 92, head: 90, legN: { to: [158, 229], bend: 1 } },
  a: { armN: { to: [212, 86], bend: 1, s: [1, 1] } }, b: { armN: { to: [172, 76], bend: 1, s: [0.6, 1] } },
  back(g, J, C, t) { K.tower(g, C, 268, { pulley: [240, 84], lift: t * 24 }); K.cable(g, C, [[240, 90], J.armN.c]); },
  front(g, J, C) { K.rope(g, C, J.armN.c, J.armN.a2 + 90); },
});

/* ================================================================== round 3: every movement of the library has its own drawing.
   These were shown with the demo of a similar movement; each now stands on its own equipment */
const inclineBench = (g, J, C) => { K.pad(g, C, J.hip, J.sh, -12.5, 86, 9, 10); K.cushion(g, C, 216, 199, 38, 9, 6); K.dark(g, C, [214, 204], [214, G - 4], 5); K.dark(g, C, [176, 187], [170, G - 4], 5); K.base(g, C, 156, 232); };
const seatBack = (g, J, C, x) => { K.pad(g, C, J.hip, J.sh, -12.5, 68, 9, 4); K.cushion(g, C, x + 8, 201, 44, 9, 0); K.dark(g, C, [x + 6, 206], [x + 6, G - 4], 6); K.base(g, C, x - 22, x + 40); };
const smithRail = (g, C, x) => { K.tube(g, C, [x - 58, 20], [x - 58, G - 4], 7); K.tube(g, C, [x - 58, 22], [x + 14, 22], 6); K.tube(g, C, [x, 22], [x, G - 4], 3.4); for (let y = 60; y < 200; y += 24) K.dark(g, C, [x - 58, y], [x - 52, y - 3], 2.4); K.foot(g, C, x - 58, 26); };
def('inclineDb', {
  view: 'side', mus: ['chest', 'delts', 'triceps'],
  base: { hip: [208, 186], torso: 140, legN: { to: [258, 229], bend: 1 } },
  a: { armN: { to: [182, 140], bend: -1, s: [0.6, 1] } }, b: { armN: { to: [182, 95], bend: -1, s: [1, 1] } },
  back(g, J, C) { inclineBench(g, J, C); },
  front(g, J, C) { K.dbSide(g, C, J.armN.c, 0); },
});
def('dbShoulderPress', {
  view: 'side', mus: ['delts', 'triceps'],
  base: { hip: [158, 188], torso: 98, head: 95, legN: { to: [210, 229], bend: 1 } },
  a: { armN: { to: [166, 124], bend: -1, s: [0.6, 1] } }, b: { armN: { to: [164, 74], bend: -1, s: [1, 1] } },
  back(g, J, C) { seatBack(g, J, C, 158); },
  front(g, J, C) { K.dbSide(g, C, J.armN.c, 0); },
});
def('smithShoulder', {
  view: 'side', mus: ['delts', 'triceps'],
  base: { hip: [158, 188], torso: 98, head: 95, legN: { to: [210, 229], bend: 1 } },
  a: { armN: { to: [170, 124], bend: -1, s: [0.6, 1] } }, b: { armN: { to: [170, 74], bend: -1, s: [1, 1] } },
  back(g, J, C) { smithRail(g, C, 170); seatBack(g, J, C, 158); K.plate(g, C, J.armN.c, 19); },
  front(g, J, C) { K.collar(g, C, J.armN.c); },
});
const pullSeat = (g, C, t, px) => { K.cushion(g, C, 150, 201, 44, 9, 0); K.dark(g, C, [150, 206], [150, G - 4], 6); K.cushion(g, C, 188, 170, 28, 8, 0); K.dark(g, C, [200, 174], [214, G - 4], 4.5); K.tower(g, C, 268, { pulley: [px, 30], lift: t * 24 }); K.base(g, C, 128, 284); };
def('latPulldown', {
  view: 'side', mus: ['lats', 'biceps'], tempo: [1.2, 0.3, 1.9, 0.4],
  base: { hip: [150, 188], legN: { to: [202, 229], bend: 1 } },
  a: { torso: 94, head: 96, armN: { to: [178, 62], bend: -1 } }, b: { torso: 101, head: 100, armN: { to: [170, 118], bend: -1 } },
  back(g, J, C, t) { pullSeat(g, C, t, 178); K.cable(g, C, [[178, 36], J.armN.c]); },
  front(g, J, C) { K.grip(g, C, J.armN.c, 0, 26); },
});
def('neutralPulldown', {
  view: 'side', mus: ['lats', 'biceps'], tempo: [1.2, 0.3, 1.9, 0.4],
  base: { hip: [150, 188], legN: { to: [202, 229], bend: 1 } },
  a: { torso: 94, head: 96, armN: { to: [174, 64], bend: -1 } }, b: { torso: 100, head: 100, armN: { to: [166, 122], bend: -1 } },
  back(g, J, C, t) { pullSeat(g, C, t, 174); K.cable(g, C, [[174, 36], [J.armN.c[0], J.armN.c[1] - 12]]); capsule(g, [J.armN.c[0] - 9, J.armN.c[1] - 12], [J.armN.c[0] + 9, J.armN.c[1] - 12], 2.6, C.eq2); },
  front(g, J, C) { K.grip(g, C, J.armN.c, 90, 13); },
});
def('machineRow', {
  view: 'side', mus: ['lats', 'upback', 'biceps'],
  base: { hip: [140, 188], torso: 92, head: 92, legN: { to: [194, 229], bend: 1 } },
  a: { armN: { to: [204, 146], bend: -1 } }, b: { armN: { to: [158, 154], bend: -1 } },
  back(g, J, C, t) {
    K.cushion(g, C, 142, 201, 44, 9, 0); K.dark(g, C, [142, 206], [142, G - 4], 6);
    K.tube(g, C, [246, 44], [246, G - 4], 11); K.stack(g, C, 246, 150, 224, t * 22); K.base(g, C, 120, 262);
    K.dark(g, C, [172, 226], [172, 168], 5); K.cushion(g, C, 170, 150, 34, 9, 90);
    K.dark(g, C, [246, 70], J.armN.c, 4.5); K.pulley(g, C, [246, 70], 5);
  },
  front(g, J, C) { K.grip(g, C, J.armN.c, 90, 14); },
});
def('cableLatRaise', {
  view: 'back', mus: ['delts'], tempo: [1.1, 0.35, 1.8, 0.3],
  base: { hip: [180, 141], torso: 90, sw: 23, hw: 9, mirror: true, legN: { a: [272, 270] } },
  a: { armN: { a: [-83, -86] } }, b: { armN: { a: [-4, -10] } },
  back(g, J, C) { K.tube(g, C, [84, 150], [84, G - 4], 9); K.foot(g, C, 84, 30); K.pulley(g, C, [94, 220], 5.5); K.cable(g, C, [[98, 218], J.armN.c]); },
  front(g, J, C) { K.grip(g, C, J.armN.c, J.armN.a2 + 90, 10); },
});
def('machineLatRaise', {
  view: 'back', mus: ['delts'], tempo: [1.1, 0.35, 1.8, 0.3],
  base: { hip: [180, 170], torso: 90, sw: 23, hw: 9, mirror: true, legN: { a: [-72, -88], s: [0.45, 0.92] } },
  a: { armN: { a: [-78, -30] } }, b: { armN: { a: [-6, 30] } },
  back(g, J, C, t) { K.tube(g, C, [180, 52], [180, G - 4], 13); K.stack(g, C, 180, 196, 228, t * 8); K.cushion(g, C, 180, 188, 58, 10, 0); K.base(g, C, 146, 214); },
  front(g, J, C) { for (const a of [J.armN, J.armF]) { K.dark(g, C, [180, 96], a.b, 3.6); K.cushion(g, C, a.b[0], a.b[1] - 7, 20, 8, a.a1); } },
});
def('cableRearFly', {
  view: 'top', mus: ['reardelt', 'upback'], tempo: [1.1, 0.35, 1.8, 0.3],
  draw(g, t, C, glow) {
    const c = [180, 176], aR = [lerp(112, -6, t), lerp(104, -12, t)];
    const arm = (s, a) => limb([c[0] + s * 23, c[1]], { a: s > 0 ? a : [180 - a[0], 180 - a[1]] }, LEN.ua, LEN.fa);
    const armR = arm(1, aR), armL = arm(-1, aR);
    for (const s of [-1, 1]) { box(g, c[0] + s * 96, 62, 22, 22, 0, C.eq, 5); K.pulley(g, C, [c[0] + s * 96, 62], 6); }
    K.cable(g, C, [[c[0] - 96, 62], armR.c]); K.cable(g, C, [[c[0] + 96, 62], armL.c]);
    drawTop(g, C, c, [armL, armR], {
      feet: true, glow, ry: 13,
      mus() { for (const s of [-1, 1]) { g.beginPath(); g.ellipse(c[0] + s * 22, c[1] + 5, 6.5, 5, 0, 0, TAU); g.fill(); } g.beginPath(); g.ellipse(c[0], c[1] + 7.5, 13, 3.8, 0, 0, TAU); g.fill(); },
    });
    K.grip(g, C, armR.c, armR.a2 + 90, 10); K.grip(g, C, armL.c, armL.a2 + 90, 10);
  },
});
def('dbRearFly', {
  view: 'side', mus: ['delts', 'upback'], tempo: [1.1, 0.35, 1.8, 0.3],
  base: { hip: [150, 148], torso: 10, head: 16, legN: { to: [152, 229], bend: 1 } },
  a: { armN: { a: [272, 270], s: [1, 1] } }, b: { armN: { a: [262, 250], s: [0.32, 0.36] } },
  front(g, J, C) { K.dbEnd(g, C, J.armN.c); },
});
def('crossPushdown', {
  view: 'side', mus: ['triceps'],
  base: { hip: [158, 143], torso: 80, head: 78, legN: { to: [164, 229], bend: 1 } },
  a: { armN: { a: [278, 52] } }, b: { armN: { a: [278, -80] } },
  back(g, J, C, t) { K.tower(g, C, 246, { pulley: [218, 38], lift: t * 24 }); K.cable(g, C, [[218, 44], J.armN.c]); },
  front(g, J, C) { K.grip(g, C, J.armN.c, J.armN.a2 + 90, 11); },
});
def('cableCurl', {
  view: 'side', mus: ['biceps'],
  base: { hip: [164, 141], torso: 90, legN: { a: [270, 270] } },
  a: { armN: { a: [268, 274] } }, b: { armN: { a: [276, 432] } },
  back(g, J, C, t) { K.tower(g, C, 262, { pulley: [234, 214], lift: t * 24 }); K.cable(g, C, [[228, 214], J.armN.c]); },
  front(g, J, C) { K.grip(g, C, J.armN.c, J.armN.a2 + 90, 14); },
});
def('preacher', {
  view: 'side', mus: ['biceps'],
  base: { hip: [150, 186], torso: 78, head: 76, legN: { to: [198, 229], bend: 1 } },
  a: { armN: { a: [-50, -44] } }, b: { armN: { a: [-50, 78] } },
  back(g, J, C, t) {
    K.cushion(g, C, 150, 199, 40, 9, 0); K.dark(g, C, [150, 204], [150, G - 4], 6); K.base(g, C, 128, 250);
    K.dark(g, C, [186, 176], [190, G - 4], 6); K.tube(g, C, [232, 150], [232, G - 4], 9); K.stack(g, C, 232, 190, 228, t * 9);
    K.dark(g, C, J.armN.b, J.armN.c, 3.4);
  },
  front(g, J, C) { K.cushion(g, C, (J.armN.a[0] + J.armN.b[0]) / 2 - 5, (J.armN.a[1] + J.armN.b[1]) / 2 + 7, 44, 9, -50); K.grip(g, C, J.armN.c, J.armN.a2 + 90, 12); },
});
def('machineCrunch', {
  view: 'side', mus: ['abs'], tempo: [1.2, 0.4, 1.8, 0.3],
  base: { hip: [150, 186], legN: { to: [200, 229], bend: 1 } },
  a: { torso: 98, chest: 94, head: 92, armN: { a: [62, 124] } }, b: { torso: 86, chest: 54, head: 34, armN: { a: [20, 96] } },
  back(g, J, C, t) {
    K.tube(g, C, [104, 52], [104, G - 4], 11); K.stack(g, C, 104, 150, 224, t * 22); K.base(g, C, 92, 214);
    K.cushion(g, C, 152, 199, 44, 9, 0); K.dark(g, C, [150, 204], [150, G - 4], 6); K.cushion(g, C, 134, 160, 9, 44, 0);
    K.dark(g, C, [104, 92], [J.sh[0] - 4, J.sh[1] - 14], 4.5); K.pulley(g, C, [104, 92], 5);
  },
  front(g, J, C) { K.cushion(g, C, J.sh[0] + 9, J.sh[1] + 4, 9, 28, J.p.chest - 90); },
});
function pallofTop(g, t, C, glow, kneel) {
  const c = [208, 166], hand = [c[0], lerp(c[1] - 19, c[1] - 58, t)], s0 = lerp(0.22, 1, t);
  box(g, 56, 130, 30, 84, 0, C.eq, 6); for (let i = 0; i < 9; i++) box(g, 56, 100 + i * 7.4, 20, 5.4, 0, i < 4 ? C.plate : C.eq2, 1.4);
  K.pulley(g, C, [78, 130], 6.5); K.cable(g, C, [[84, 130], [hand[0] - 7, hand[1]]]);
  const mx = lerp(84, hand[0] - 7, 0.5), my = lerp(130, hand[1], 0.5), u = unit(hand, [84, 130]);
  g.fillStyle = C.cable; g.beginPath(); g.moveTo(mx + u[0] * 8, my + u[1] * 8); g.lineTo(mx - u[1] * 4.5, my + u[0] * 4.5); g.lineTo(mx + u[1] * 4.5, my - u[0] * 4.5); g.closePath(); g.fill();
  const armR = limb([c[0] + 23, c[1]], { to: [hand[0] + 3, hand[1]], bend: -1, s: [s0, 1] }, LEN.ua, LEN.fa);
  const armL = limb([c[0] - 23, c[1]], { to: [hand[0] - 3, hand[1]], bend: 1, s: [s0, 1] }, LEN.ua, LEN.fa);
  /* kneeling: the shins lie behind the body on a mat, and no feet show in front */
  if (kneel) { box(g, c[0], c[1] + 26, 78, 62, 0, C.pad, 8); for (const s of [-1, 1]) { capsule(g, [c[0] + s * 11, c[1] + 6], [c[0] + s * 13, c[1] + 44], 13, C.far); g.beginPath(); g.ellipse(c[0] + s * 13, c[1] + 50, 5, 9, 0, 0, TAU); g.fillStyle = C.shoe; g.fill(); } }
  drawTop(g, C, c, [armL, armR], { feet: !kneel, glow, ry: 14, headDy: 3, mus() { g.beginPath(); g.ellipse(c[0], c[1] - 6.5, 19, 5.6, 0, 0, TAU); g.fill(); } });
  K.grip(g, C, hand, 0, 14);
}
def('kneelPallof', { view: 'top', mus: ['core'], tempo: [1.3, 1.1, 1.3, 0.5], draw(g, t, C, glow) { pallofTop(g, t, C, glow, true); } });
def('smithSquat', {
  view: 'side', mus: ['quads', 'glutes'], tempo: [1.2, 0.2, 2.0, 0.3],
  base: { legN: { to: [186, 229], bend: 1 }, armN: { a: [250, 80] } },
  a: { hip: [156, 184], torso: 62, head: 72 }, b: { hip: [176, 141], torso: 86, head: 86 },
  back(g, J, C) { smithRail(g, C, 173); K.plate(g, C, [173, squatBar(J)[1]], 21); },
  front(g, J, C) { K.collar(g, C, [173, squatBar(J)[1]]); },
});
def('gobletSquat', {
  view: 'side', mus: ['quads', 'glutes'], tempo: [1.2, 0.2, 2.0, 0.3],
  base: { legN: { to: [178, 229], bend: 1 }, armN: { a: [300, 74] } },
  a: { hip: [150, 186], torso: 64, head: 74 }, b: { hip: [176, 141], torso: 88, head: 88 },
  front(g, J, C) { K.dbSide(g, C, [J.armN.c[0], J.armN.c[1] + 4], 90); },
});
def('revLunge', {
  view: 'side', mus: ['quads', 'glutes'], tempo: [1.2, 0.2, 2.0, 0.3],
  base: { legN: { to: [208, 229], bend: 1 }, footN: 0, footF: 248, armN: { a: [270, 274] } },
  a: { hip: [174, 186], torso: 82, legF: { to: [122, 220], bend: 1 } }, b: { hip: [196, 142], torso: 88, legF: { to: [200, 229], bend: 1 } },
  front(g, J, C) { K.dbSide(g, C, J.armN.c, 0); },
});
def('smithSplit', {
  view: 'side', mus: ['quads', 'glutes'], tempo: [1.2, 0.2, 2.0, 0.3],
  base: { legN: { to: [214, 229], bend: 1 }, legF: { to: [128, 220], bend: 1 }, footN: 0, footF: 248, armN: { a: [250, 80] } },
  a: { hip: [176, 186], torso: 86 }, b: { hip: [178, 150], torso: 88 },
  back(g, J, C) { smithRail(g, C, 172); K.plate(g, C, [172, squatBar(J)[1]], 21); },
  front(g, J, C) { K.collar(g, C, [172, squatBar(J)[1]]); },
});
def('dbRdl', {
  view: 'side', mus: ['hams', 'glutes', 'lowback'], tempo: [1.2, 0.25, 2.0, 0.3],
  base: { legN: { to: [176, 229], bend: 1 } },
  a: { hip: [150, 150], torso: 22, head: 16, armN: { to: [190, 193], bend: -1 } }, b: { hip: [172, 141], torso: 88, head: 88, armN: { to: [179, 154], bend: -1 } },
  front(g, J, C) { K.dbSide(g, C, J.armN.c, 0); },
});
def('backExt', {
  view: 'side', mus: ['hams', 'glutes', 'lowback'], tempo: [1.2, 0.3, 1.9, 0.3],
  base: { hip: [176, 150], legN: { a: [225, 225] }, footN: 250 },
  a: { torso: -42, head: -52, armN: { a: [213, 23], s: [0.7, 0.7] } }, b: { torso: 45, head: 45, armN: { a: [300, 110], s: [0.7, 0.7] } },
  back(g, J, C) {
    K.tube(g, C, [104, 228], [196, 170], 6); K.dark(g, C, [190, 172], [198, G - 4], 6); K.dark(g, C, [122, 216], [118, G - 4], 5); K.base(g, C, 96, 224);
    K.cushion(g, C, 164, 170, 44, 10, 45); box(g, 106, 212, 9, 30, 45, C.eq2, 3);
  },
});
def('thrustMachine', {
  view: 'side', mus: ['glutes', 'hams'], tempo: [1.1, 0.5, 1.8, 0.3],
  base: { legN: { to: [208, 229], bend: 1 } },
  a: { hip: [153.5, 211.3], torso: 143, head: 120, armN: { to: [157, 203], bend: 1 } }, b: { hip: [164, 181.8], torso: 178, head: 152, armN: { to: [161, 171], bend: 1 } },
  back(g, J, C) { K.cushion(g, C, 92, 186, 56, 12, 28); K.dark(g, C, [84, 196], [78, G - 4], 6); K.base(g, C, 62, 276); K.dark(g, C, [262, 226], thrustBar(J), 5); K.pulley(g, C, [262, 226], 6); K.plate(g, C, [262, 204], 14); },
  front(g, J, C) { const b = thrustBar(J); box(g, b[0], b[1], 34, 9, angOf(J.hip, J.mid) + 4, C.pad, 4); },
});
def('singleLegExt', {
  view: 'side', mus: ['quads'],
  base: { hip: [140, 176], torso: 106, head: 98, footN: 'p', footF: 'p', armN: { to: [150, 186], bend: -1 }, legF: { a: [-2, 262] } },
  a: { legN: { a: [-2, 258] } }, b: { legN: { a: [-2, 354] } },
  back: ANIM.legExt.back, front: ANIM.legExt.front,
});
def('pressCalf', {
  view: 'side', mus: ['calves'], tempo: [0.9, 0.5, 1.5, 0.6],
  base: { hip: [146, 198], torso: 150, head: 142, armN: { to: [140, 204], bend: 1 } },
  a: { legN: { to: [199, 139.5], bend: 1 }, footN: 152 }, b: { legN: { to: [204, 133.5], bend: 1 }, footN: 120 },
  back: ANIM.legPress.back,
});
def('superman', {
  view: 'side', mus: ['lowback', 'glutes'], tempo: [1.1, 0.5, 1.6, 0.3],
  base: { hip: [150, 224], torso: 0, footN: 180 },
  a: { chest: 2, head: 2, armN: { a: [-4, -2] }, legN: { a: [180, 180] } }, b: { chest: 16, head: 20, armN: { a: [26, 22] }, legN: { a: [169, 166] } },
  back(g, J, C) { floorMat(g, C, 170, 230); },
});
def('doorRow', {
  view: 'side', mus: ['lats', 'upback', 'biceps'], tempo: [1.1, 0.3, 1.8, 0.3],
  base: { legN: { to: [224, 229], bend: 1 }, armN: { to: [228, 110], bend: -1 } },
  a: { hip: [186.8, 149.2], torso: 115, head: 112 }, b: { hip: [208.7, 142.3], torso: 100, head: 98 },
  back(g, J, C) { K.tube(g, C, [250, 24], [250, G - 4], 10); box(g, 244, 112, 6, 12, 0, C.eq2, 2); capsule(g, [246, 112], J.armN.c, 3, C.pad); },
  front(g, J, C) { ring(g, J.armN.c, 3.4, C.pad); },
});
