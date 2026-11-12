/* ================================================================== movements
   base = shared pose, a = lengthened position, b = contracted position. Poses use absolute joint angles
   (0 = right, 90 = up) or hand / ankle targets solved with inverse kinematics. */
def('inclineSmith', {
  view: 'side', mus: ['chest', 'delts', 'triceps'], track: 'hand',
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
  view: 'back', mus: ['lats', 'biceps'], track: 'head', tempo: [1.2, 0.3, 1.9, 0.4],
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
  view: 'side', mus: ['lats', 'upback', 'biceps'], track: 'hand',
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
  view: 'back', mus: ['delts'], track: 'hands', tempo: [1.1, 0.35, 1.8, 0.3],
  base: { hip: [180, 170], torso: 90, sw: 23, hw: 9, mirror: true, legN: { a: [-72, -88], s: [0.45, 0.92] } },
  a: { armN: { a: [-83, -86] } }, b: { armN: { a: [-4, -10] } },
  back(g, J, C) { K.cushion(g, C, 180, 188, 58, 10, 0); K.dark(g, C, [180, 193], [180, G - 4], 7); K.base(g, C, 148, 212); },
  front(g, J, C) { K.dbEnd(g, C, J.armN.c); K.dbEnd(g, C, J.armF.c); },
});
def('machinePress', {
  view: 'side', mus: ['chest', 'triceps', 'delts'], track: 'hand',
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
  view: 'side', mus: ['triceps'], track: 'hand',
  base: { hip: [158, 143], torso: 80, head: 78, legN: { to: [164, 229], bend: 1 } },
  a: { armN: { a: [278, 52] } }, b: { armN: { a: [278, -80] } },
  back(g, J, C, t) { K.tower(g, C, 246, { pulley: [218, 38], lift: t * 24 }); K.cable(g, C, [[218, 44], J.armN.c]); },
  front(g, J, C) { K.rope(g, C, J.armN.c, J.armN.a2 + 90); },
});
def('dbCurl', {
  view: 'side', mus: ['biceps'], track: 'hand',
  base: { hip: [176, 141], torso: 90, legN: { a: [270, 270] } },
  a: { armN: { a: [268, 274] } }, b: { armN: { a: [276, 432] } },
  front(g, J, C) { K.dbEnd(g, C, J.armN.c); },
});
def('hammerCurl', {
  view: 'side', mus: ['biceps', 'forearm'], track: 'hand',
  base: { hip: [176, 141], torso: 90, legN: { a: [270, 270] } },
  a: { armN: { a: [268, 274] } }, b: { armN: { a: [276, 432] } },
  front(g, J, C) { K.dbSide(g, C, J.armN.c, J.armN.a2 + 90); },
});
def('cableCrunch', {
  view: 'side', mus: ['abs'], track: 'sh', tempo: [1.2, 0.4, 1.8, 0.3],
  base: { hip: [182, 185.4], legN: { a: [278, 182] }, footN: 195 },
  a: { torso: 78, chest: 72, head: 62, armN: { to: [211, 126], bend: -1 } }, b: { torso: 68, chest: 2, head: -28, armN: { to: [233.5, 174.2], bend: -1 } },
  back(g, J, C, t) { K.tower(g, C, 284, { pulley: [258, 34], lift: t * 24 }); K.cable(g, C, [[258, 40], J.armN.c]); box(g, 186, G - 2.5, 60, 5, 0, C.pad, 2.5); },
  front(g, J, C) { K.rope(g, C, J.armN.c, J.armN.a2 + 90); },
});
def('hackSquat', {
  view: 'side', mus: ['quads', 'glutes'], track: 'hip', tempo: [1.2, 0.2, 2.0, 0.3],
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
  view: 'side', mus: ['hams', 'glutes', 'lowback'], track: 'hand', tempo: [1.2, 0.25, 2.0, 0.3],
  base: { legN: { to: [176, 229], bend: 1 } },
  a: { hip: [150, 150], torso: 22, head: 16, armN: { to: [190, 193], bend: -1 } }, b: { hip: [172, 141], torso: 88, head: 88, armN: { to: [179, 154], bend: -1 } },
  back(g, J, C) { K.plate(g, C, J.armN.c, 21); },
  front(g, J, C) { K.collar(g, C, J.armN.c); },
});
def('legPress', {
  view: 'side', mus: ['quads', 'glutes'], track: 'ankle', tempo: [1.2, 0.2, 2.0, 0.3],
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
  view: 'side', mus: ['hams'], track: 'ankle',
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
  view: 'side', mus: ['calves'], track: 'hip', tempo: [0.9, 0.5, 1.5, 0.6],
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
  view: 'top', mus: ['core'], tempo: [1.3, 1.1, 1.3, 0.5], phases: ['דחיפה קדימה', 'החזק, בלי להסתובב', 'חזרה לחזה', 'ידיים על החזה'],
  draw(g, t, C, glow) {
    const c = [208, 166], hand = [c[0], lerp(c[1] - 19, c[1] - 58, t)], s0 = lerp(0.22, 1, t);
    box(g, 56, 130, 30, 84, 0, C.eq, 6); for (let i = 0; i < 9; i++) box(g, 56, 100 + i * 7.4, 20, 5.4, 0, i < 4 ? C.plate : C.eq2, 1.4);
    K.pulley(g, C, [78, 130], 6.5); K.cable(g, C, [[84, 130], [hand[0] - 7, hand[1]]]);
    const mx = lerp(84, hand[0] - 7, 0.5), my = lerp(130, hand[1], 0.5), u = unit(hand, [84, 130]);
    g.fillStyle = C.cable; g.beginPath(); g.moveTo(mx + u[0] * 8, my + u[1] * 8); g.lineTo(mx - u[1] * 4.5, my + u[0] * 4.5); g.lineTo(mx + u[1] * 4.5, my - u[0] * 4.5); g.closePath(); g.fill();
    drawTrack(g, [[c[0], c[1] - 19], [c[0], c[1] - 58]], C);
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
    for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 16; i++) pts.push(arm(s, at(i / 16)).c); drawTrack(g, pts, C); }
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
  view: 'side', mus: ['lats', 'upback', 'biceps'], track: 'hand',
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
  view: 'side', mus: ['delts', 'triceps'], track: 'hand',
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
  view: 'side', mus: ['triceps'], track: 'hand',
  base: { hip: [176, 141], torso: 84, head: 84, legN: { a: [270, 270] } },
  a: { armN: { a: [78, 208] } }, b: { armN: { a: [78, 80] } },
  back(g, J, C, t) { K.tower(g, C, 94, { pulley: [118, 212], lift: t * 24 }); K.cable(g, C, [[122, 208], J.armN.c]); },
  front(g, J, C) { K.rope(g, C, J.armN.c, J.armN.a2 + 90); },
});
def('kneeRaise', {
  view: 'side', mus: ['abs'], track: 'knee', tempo: [1.1, 0.35, 1.8, 0.4],
  base: { armN: { to: [180, 14], bend: -1 } },
  a: { hip: [180, 131], torso: 90, chest: 90, legN: { a: [272, 250] }, footN: 310 }, b: { hip: [188.9, 129.6], torso: 110, chest: 92, legN: { a: [380, 262] }, footN: 330 },
  back(g, J, C) { K.tube(g, C, [98, 8], [98, G - 4], 10); K.tube(g, C, [98, 14], [180, 14], 6); K.foot(g, C, 98, 34); K.base(g, C, 84, 156); },
  front(g, J, C) { ring(g, [180, 14], 5, C.eq2, C.eqHi, 1.6); },
});
def('bulgarian', {
  view: 'side', mus: ['quads', 'glutes'], track: 'hip', tempo: [1.2, 0.2, 2.0, 0.3],
  base: { legN: { to: [212, 229], bend: 1 }, legF: { to: [136, 184], bend: 1 }, footN: 0, footF: 205, armN: { a: [270, 272] } },
  a: { hip: [178, 184], torso: 76 }, b: { hip: [180, 148], torso: 82 },
  back(g, J, C) { K.bench(g, C, 88, 150, 190); },
  front(g, J, C) { K.dbSide(g, C, J.armN.c, 0); },
});
function thrustBar(J) { const n = nrm(J.hip, J.mid); return [J.hip[0] + n[0] * 11 + 4, J.hip[1] + n[1] * 11]; }
def('hipThrust', {
  view: 'side', mus: ['glutes', 'hams'], track: 'hip', tempo: [1.1, 0.5, 1.8, 0.3],
  base: { legN: { to: [208, 229], bend: 1 } },
  a: { hip: [153.5, 211.3], torso: 143, head: 120, armN: { to: [157, 203], bend: 1 } }, b: { hip: [164, 181.8], torso: 178, head: 152, armN: { to: [161, 171], bend: 1 } },
  back(g, J, C) { K.bench(g, C, 58, 110, 190); K.plate(g, C, thrustBar(J), 20); },
  front(g, J, C) { K.collar(g, C, thrustBar(J)); },
});
def('lyingLegCurl', {
  view: 'side', mus: ['hams'], track: 'ankle',
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
  view: 'side', mus: ['quads'], track: 'ankle',
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
  view: 'side', mus: ['calves'], track: 'knee', tempo: [0.9, 0.5, 1.5, 0.6],
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
