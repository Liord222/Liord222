/* ================================================================== figure rig
   A 2D articulated person built on real body proportions (stature = 180 units):
   shoulder joint at 0.82 of stature, hip at 0.53, knee at 0.29, arm reach 66, 7.7 heads tall. */
const SW = 360, SH = 260, G = 236;
const LEN = { t1: 23, t2: 29, head: 21.5, ua: 33, fa: 33, th: 44, sh: 44, ankle: 7 };
const RAD = Math.PI / 180, TAU = Math.PI * 2;
const dir = (a) => [Math.cos(a * RAD), -Math.sin(a * RAD)];
const add = (p, v, k) => { const m = k === undefined ? 1 : k; return [p[0] + v[0] * m, p[1] + v[1] * m]; };
const angOf = (p, q) => Math.atan2(-(q[1] - p[1]), q[0] - p[0]) / RAD;
const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };
const nrm = (a, b) => { const u = unit(a, b); return [-u[1], u[0]]; };

/* two-bone limb: {a:[deg,deg]} forward kinematics, or {to:[x,y],bend:±1} inverse kinematics; s scales for foreshortening */
function limb(root, spec, l1, l2) {
  const s = spec.s || [1, 1];
  l1 *= s[0]; l2 *= s[1];
  if (spec.to) {
    const dx = spec.to[0] - root[0], dy = spec.to[1] - root[1];
    const d = Math.max(Math.abs(l1 - l2) + 0.5, Math.min(l1 + l2 - 0.4, Math.hypot(dx, dy)));
    const base = Math.atan2(-dy, dx);
    const A = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
    const a1 = (base + (spec.bend || 1) * A) / RAD;
    const b = add(root, dir(a1), l1), c = [root[0] + Math.cos(base) * d, root[1] - Math.sin(base) * d];
    return { a: root, b, c, a1, a2: angOf(b, c) };
  }
  const b = add(root, dir(spec.a[0]), l1);
  return { a: root, b, c: add(b, dir(spec.a[1]), l2), a1: spec.a[0], a2: spec.a[1] };
}
function mirrorSpec(s, cx) {
  const o = s.to ? { to: [2 * cx - s.to[0], s.to[1]], bend: -(s.bend || 1) } : { a: [180 - s.a[0], 180 - s.a[1]] };
  if (s.s) o.s = s.s;
  return o;
}
function normPose(p) {
  const o = Object.assign({}, p);
  if (o.chest === undefined) o.chest = o.torso;
  if (o.head === undefined) o.head = o.chest;
  if (!o.armF) o.armF = o.mirror ? mirrorSpec(o.armN, o.hip[0]) : o.armN;
  if (!o.legF) o.legF = o.mirror ? mirrorSpec(o.legN, o.hip[0]) : o.legN;
  if (o.footN === undefined) o.footN = 0;
  if (o.footF === undefined) o.footF = o.mirror && typeof o.footN === 'number' ? 180 - o.footN : o.footN;
  return o;
}
function mixSpec(a, b, t) {
  const o = {};
  if (a.to) { o.to = lerp2(a.to, b.to, t); o.bend = a.bend; } else o.a = lerp2(a.a, b.a, t);
  if (a.s || b.s) o.s = lerp2(a.s || [1, 1], b.s || [1, 1], t);
  return o;
}
function mixPose(A, B, t) {
  const f = (k) => (typeof A[k] === 'number' && typeof B[k] === 'number' ? lerp(A[k], B[k], t) : A[k]);
  return {
    hip: lerp2(A.hip, B.hip, t), torso: lerp(A.torso, B.torso, t), chest: lerp(A.chest, B.chest, t), head: lerp(A.head, B.head, t),
    sw: A.sw, hw: A.hw, nofeet: A.nofeet,
    armN: mixSpec(A.armN, B.armN, t), armF: mixSpec(A.armF, B.armF, t), legN: mixSpec(A.legN, B.legN, t), legF: mixSpec(A.legF, B.legF, t),
    footN: f('footN'), footF: f('footF'),
  };
}
function solve(p) {
  const hip = p.hip, mid = add(hip, dir(p.torso), LEN.t1), sh = add(mid, dir(p.chest), LEN.t2);
  const head = add(sh, dir(p.head), LEN.head);
  const sw = p.sw || 0, hw = p.hw || 0;
  const shN = [sh[0] + sw, sh[1]], shF = [sh[0] - sw, sh[1]], hpN = [hip[0] + hw, hip[1]], hpF = [hip[0] - hw, hip[1]];
  const armN = limb(shN, p.armN, LEN.ua, LEN.fa), armF = limb(shF, p.armF, LEN.ua, LEN.fa);
  const legN = limb(hpN, p.legN, LEN.th, LEN.sh), legF = limb(hpF, p.legF, LEN.th, LEN.sh);
  const foot = (lg, f) => ({ a: lg.c, f: f === 'p' ? lg.a2 + 90 : f });
  return { p, hip, mid, sh, head, shN, shF, hpN, hpF, armN, armF, legN, legF, footN: foot(legN, p.footN), footF: foot(legF, p.footF) };
}
/* point on the sole under the ball of the foot, and the ankle that puts the ball at a fixed spot */
const ballOf = (ft) => add(add(ft.a, dir(ft.f), 14), dir(ft.f - 90), LEN.ankle);
const ankleFor = (ball, f) => add(add(ball, dir(f), -14), dir(f - 90), -LEN.ankle);

/* ---- primitives ---- */
function capsule(g, a, b, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
function ring(g, c, r, fill, stroke, lw) { g.beginPath(); g.arc(c[0], c[1], r, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1.5; g.stroke(); } }
function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function box(g, cx, cy, w, h, rot, col, r) { g.save(); g.translate(cx, cy); g.rotate(-(rot || 0) * RAD); g.fillStyle = col; rr(g, -w / 2, -h / 2, w, h, r === undefined ? 3 : r); g.fill(); g.restore(); }
/* closed smooth curve through points (Catmull-Rom) */
function blob(g, P) {
  const n = P.length;
  g.beginPath(); g.moveTo(P[0][0], P[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  g.closePath();
}
const hexRgb = (h) => { const s = (h || '#888888').replace('#', ''); const v = s.length === 3 ? s.replace(/./g, '$&$&') : s; return [parseInt(v.slice(0, 2), 16) || 0, parseInt(v.slice(2, 4), 16) || 0, parseInt(v.slice(4, 6), 16) || 0]; };
const mixRgb = (a, b, t) => 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
/* light comes from the upper front: a gradient across the limb gives it volume and fades out when the limb points at the light */
function lit(g, a, b, r, C) {
  const n = nrm(a, b), k = n[0] * 0.55 - n[1] * 0.83, s = k >= 0 ? 1 : -1, m = Math.min(1, Math.abs(k) * 1.25);
  const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
  const gr = g.createLinearGradient(cx + n[0] * r * s, cy + n[1] * r * s, cx - n[0] * r * s, cy - n[1] * r * s);
  gr.addColorStop(0, mixRgb(C._fig, C._hi, m)); gr.addColorStop(0.5, C.fig); gr.addColorStop(1, mixRgb(C._fig, C._lo, m));
  return gr;
}

/* ---- body outlines. Limbs: [fraction along the bone, offset across it]. For a limb hanging down, + is the back of the body. ---- */
const OUT = {
  thigh: [[-0.13, 0], [0, 9.6], [0.3, 9.6], [0.62, 7.8], [0.95, 6.2], [1.05, 0], [0.95, -6.4], [0.62, -8.4], [0.3, -9.6], [0, -9.2]],
  shank: [[-0.07, 0], [0, 6.0], [0.26, 8.0], [0.58, 5.6], [0.92, 3.5], [1.03, 0], [0.92, -3.4], [0.5, -4.5], [0.14, -5.6], [0, -5.9]],
  uarm: [[-0.16, 0], [-0.05, 6.0], [0.3, 6.3], [0.72, 5.0], [0.98, 4.3], [1.06, 0], [0.98, -4.3], [0.56, -6.1], [0.22, -6.0], [-0.05, -6.0]],
  farm: [[-0.07, 0], [0, 4.6], [0.24, 5.3], [0.58, 3.9], [0.8, 3.1], [0.9, 4.7], [1.06, 4.9], [1.17, 3.0], [1.19, 0], [1.17, -3.1], [1.04, -4.9], [0.9, -4.5], [0.8, -3.0], [0.5, -4.3], [0.2, -5.2], [0, -4.6]],
  shortsLeg: [[-0.13, 0], [0, 10.0], [0.3, 10.0], [0.45, 9.3], [0.47, 0], [0.45, -9.5], [0.3, -10.0], [0, -9.6]],
  /* torso: [fraction along the spine from hip to shoulder, offset; + is the front] */
  torso: [[-0.13, -2], [-0.04, -10], [0.08, -12.2], [0.22, -11.2], [0.4, -9.4], [0.6, -10.2], [0.8, -12.0], [0.95, -10.2], [1.06, -6], [1.09, 0.5], [1.03, 6.8], [0.88, 11.8], [0.7, 11.6], [0.52, 9.5], [0.32, 9.2], [0.14, 9.8], [0, 9.2], [-0.1, 4.8]],
  shorts: [[-0.13, -2.2], [-0.04, -10.4], [0.08, -12.6], [0.2, -11.7], [0.25, -11], [0.25, 0], [0.25, 9.8], [0.14, 10.2], [0, 9.6], [-0.1, 5.1]],
  /* head: [forward, up] from the head centre */
  head: [[0, 11.6], [6.4, 9.4], [9.3, 4.4], [9.9, 0.6], [11.3, -1.6], [9.6, -3.4], [9.2, -7.2], [6.4, -10.8], [1.5, -11.2], [-4.5, -9.4], [-8.6, -5.2], [-9.9, 1.0], [-8.2, 7.2], [-4.4, 10.6]],
  hair: [[7.6, 8.4], [3, 12.1], [-3.6, 11.8], [-8.8, 7.6], [-10.6, 1.2], [-9.4, -4.8], [-6.6, -6.6], [-5.6, -1.4], [-2.4, 2.8], [2.6, 5.6], [7.8, 6.2]],
  /* shoe: [along the foot, toward the sole] from the ankle */
  shoe: [[-6.8, 0.5], [-7.8, 5.6], [-5.5, 7.4], [13.5, 7.4], [20.4, 6.8], [21, 4.2], [17, 1.6], [10, -0.4], [5.2, -3.9], [-2.6, -4.4]],
  /* seen from behind / in front: symmetric limbs */
  thighB: [[-0.1, 0], [0, 9.2], [0.35, 9.0], [0.95, 6.2], [1.05, 0], [0.95, -6.2], [0.35, -9.0], [0, -9.2]],
  shankB: [[-0.06, 0], [0, 6.0], [0.28, 7.2], [0.92, 3.6], [1.03, 0], [0.92, -3.6], [0.28, -7.2], [0, -6.0]],
  uarmB: [[-0.14, 0], [-0.04, 6.2], [0.35, 6.0], [0.98, 4.3], [1.06, 0], [0.98, -4.3], [0.35, -6.0], [-0.04, -6.2]],
};
/* working-muscle overlays, in the same coordinates as the part they sit on */
const MUS = {
  chest: ['torso', [[1.0, 5.6], [0.88, 10.9], [0.7, 10.7], [0.6, 6.8], [0.72, 2.4], [0.96, 1.6]]],
  abs: ['torso', [[0.56, 7.8], [0.4, 7.9], [0.22, 8.2], [0.06, 8.4], [0.04, 3.4], [0.3, 2.6], [0.56, 2.8]]],
  lats: ['torso', [[0.9, -10], [0.72, -11], [0.52, -9.5], [0.38, -8.3], [0.42, -1.8], [0.7, -0.8], [0.9, -2.8]]],
  upback: ['torso', [[1.04, -5.0], [0.93, -8.8], [0.78, -10.2], [0.68, -6.2], [0.8, -1.8], [1.0, -1.4]]],
  lowback: ['torso', [[0.38, -7.8], [0.22, -9.4], [0.08, -10.6], [0.06, -4.4], [0.2, -2.8], [0.38, -3.0]]],
  glutes: ['torso', [[-0.1, -3], [-0.03, -9.6], [0.08, -11.6], [0.2, -10.4], [0.22, -4.5], [0.1, -0.5], [-0.06, 0]]],
  quads: ['thigh', [[0.1, -8.4], [0.35, -9.0], [0.65, -7.8], [0.92, -5.6], [0.92, -1.0], [0.5, -1.4], [0.1, -1.6]]],
  hams: ['thigh', [[0.12, 8.8], [0.4, 8.8], [0.7, 7.0], [0.94, 5.4], [0.94, 1.0], [0.5, 1.2], [0.12, 1.4]]],
  calves: ['shank', [[0.02, 5.4], [0.26, 7.4], [0.55, 5.2], [0.64, 1.0], [0.3, 1.0], [0.04, 0.8]]],
  delts: ['uarm', [[-0.14, 0], [-0.06, 5.4], [0.16, 5.8], [0.34, 2.8], [0.34, -2.8], [0.16, -5.6], [-0.06, -5.4]]],
  biceps: ['uarm', [[0.22, -5.6], [0.52, -5.7], [0.86, -4.0], [0.9, -0.6], [0.5, -0.3], [0.24, -0.6]]],
  triceps: ['uarm', [[0.22, 5.8], [0.46, 5.9], [0.8, 4.5], [0.92, 0.8], [0.5, 0.5], [0.24, 0.6]]],
  forearm: ['farm', [[0.04, 4.0], [0.25, 4.8], [0.6, 3.4], [0.7, -3.0], [0.3, -4.4], [0.04, -4.0]]],
};
const MGROUP = { chest: 't', abs: 't', lats: 't', upback: 't', lowback: 't', glutes: 'l', quads: 'l', hams: 'l', calves: 'l', delts: 'a', biceps: 'a', triceps: 'a', forearm: 'a' };

function bonePts(a, b, out) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  return out.map((p) => [a[0] + dx * p[0] - uy * p[1], a[1] + dy * p[0] + ux * p[1]]);
}
function part(g, a, b, out, fill, halo) {
  blob(g, bonePts(a, b, out));
  if (halo) { g.strokeStyle = halo; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke(); }
  g.fillStyle = fill; g.fill();
}
function spineFn(J) {
  const h = J.hip, m = J.mid, s = J.sh;
  return (t, v) => {
    const a = 1 - t, x = a * a * h[0] + 2 * a * t * m[0] + t * t * s[0], y = a * a * h[1] + 2 * a * t * m[1] + t * t * s[1];
    let tx = 2 * a * (m[0] - h[0]) + 2 * t * (s[0] - m[0]), ty = 2 * a * (m[1] - h[1]) + 2 * t * (s[1] - m[1]);
    const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
    return [x - ty * v, y + tx * v];
  };
}
function shoe(g, ft, fill, sole) {
  const x = dir(ft.f), y = dir(ft.f - 90), P = (p) => [ft.a[0] + x[0] * p[0] + y[0] * p[1], ft.a[1] + x[1] * p[0] + y[1] * p[1]];
  blob(g, OUT.shoe.map(P)); g.fillStyle = fill; g.fill();
  if (sole) { g.strokeStyle = sole; g.lineWidth = 1.7; g.lineCap = 'round'; g.beginPath(); const s0 = P([-6.2, 7.5]), s1 = P([19.8, 7.3]); g.moveTo(s0[0], s0[1]); g.lineTo(s1[0], s1[1]); g.stroke(); }
}
function glowOn(g, C, glow) { g.globalAlpha = 0.3 + 0.7 * glow; if (C.fx) { g.shadowColor = C.muscle; g.shadowBlur = 9 * glow * C.fx; } }
function glowOff(g) { g.globalAlpha = 1; g.shadowBlur = 0; g.shadowColor = 'transparent'; }
function muscleSet(g, J, C, ex, grp, glow, sp) {
  let any = false;
  for (const m of ex.mus) {
    if (MGROUP[m] !== grp) continue;
    if (!any) { glowOn(g, C, glow); any = true; }
    const d = MUS[m], f = d[0];
    const P = f === 'torso' ? d[1].map((p) => sp(p[0], p[1])) : f === 'thigh' ? bonePts(J.legN.a, J.legN.b, d[1]) : f === 'shank' ? bonePts(J.legN.b, J.legN.c, d[1]) : f === 'uarm' ? bonePts(J.armN.a, J.armN.b, d[1]) : bonePts(J.armN.b, J.armN.c, d[1]);
    blob(g, P); g.fillStyle = C.muscle; g.fill();
  }
  if (any) glowOff(g);
}
function headSide(g, J, C) {
  const up = unit(J.sh, J.head), fw = [-up[1], up[0]], c = J.head, P = (p) => [c[0] + fw[0] * p[0] + up[0] * p[1], c[1] + fw[1] * p[0] + up[1] * p[1]];
  capsule(g, add(J.sh, up, -2), add(c, up, -6), 9.6, C.fig);
  blob(g, OUT.head.map(P)); g.strokeStyle = C.halo; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke(); g.fillStyle = C.fig; g.fill();
  blob(g, OUT.hair.map(P)); g.fillStyle = C.hair; g.fill();
  const e = P([-1.4, -1.2]); g.beginPath(); g.ellipse(e[0], e[1], 1.7, 2.6, 0, 0, TAU); g.fillStyle = C.figLo; g.fill();
}
function drawSide(g, J, C, ex, glow) {
  const sp = spineFn(J), nf = J.p.nofeet;
  part(g, J.armF.a, J.armF.b, OUT.uarm, C.far); part(g, J.armF.b, J.armF.c, OUT.farm, C.far);
  part(g, J.legF.a, J.legF.b, OUT.thigh, C.far); part(g, J.legF.b, J.legF.c, OUT.shank, C.far);
  if (!nf) shoe(g, J.footF, C.shoeFar, null);
  part(g, J.legF.a, J.legF.b, OUT.shortsLeg, C.clothFar);
  blob(g, OUT.torso.map((p) => sp(p[0], p[1]))); g.strokeStyle = C.halo; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke(); g.fillStyle = lit(g, J.hip, J.sh, 11, C); g.fill();
  headSide(g, J, C);
  blob(g, OUT.shorts.map((p) => sp(p[0], p[1]))); g.fillStyle = C.cloth; g.fill();
  muscleSet(g, J, C, ex, 't', glow, sp);
  blob(g, bonePts(J.legN.a, J.legN.b, OUT.thigh)); g.strokeStyle = C.halo; g.lineWidth = 3; g.stroke();
  blob(g, bonePts(J.legN.b, J.legN.c, OUT.shank)); g.stroke();
  part(g, J.legN.a, J.legN.b, OUT.thigh, lit(g, J.legN.a, J.legN.b, 9, C)); part(g, J.legN.b, J.legN.c, OUT.shank, lit(g, J.legN.b, J.legN.c, 7, C));
  if (!nf) shoe(g, J.footN, C.shoe, C.sole);
  part(g, J.legN.a, J.legN.b, OUT.shortsLeg, C.cloth);
  muscleSet(g, J, C, ex, 'l', glow, sp);
  blob(g, bonePts(J.armN.a, J.armN.b, OUT.uarm)); g.strokeStyle = C.halo; g.lineWidth = 3; g.stroke();
  blob(g, bonePts(J.armN.b, J.armN.c, OUT.farm)); g.stroke();
  part(g, J.armN.a, J.armN.b, OUT.uarm, lit(g, J.armN.a, J.armN.b, 6, C)); part(g, J.armN.b, J.armN.c, OUT.farm, lit(g, J.armN.b, J.armN.c, 5, C));
  muscleSet(g, J, C, ex, 'a', glow, sp);
}
/* the same person seen from behind: upright torso, both sides visible */
function drawBack(g, J, C, ex, glow) {
  const cx = J.sh[0], sy = J.sh[1], hy = J.hip[1], nf = J.p.nofeet;
  for (const lg of [J.legF, J.legN]) {
    part(g, lg.a, lg.b, OUT.thighB, C.fig); part(g, lg.b, lg.c, OUT.shankB, C.fig);
    if (!nf) { box(g, lg.c[0], lg.c[1] + 4.5, 10.5, 9, 0, C.shoe, 3.5); box(g, lg.c[0], lg.c[1] + 8.2, 11.5, 2, 0, C.sole, 1); }
  }
  const R = [[5.4, sy - 9.5], [13, sy - 6.6], [22.4, sy - 3.4], [23.6, sy + 5], [21, sy + 14], [18.6, sy + 24], [14.8, sy + 35], [16.6, hy - 3], [17.4, hy + 6], [9, hy + 11.5]];
  const T = R.map((p) => [cx + p[0], p[1]]).concat(R.slice().reverse().map((p) => [cx - p[0], p[1]]));
  blob(g, T); g.strokeStyle = C.halo; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke(); g.fillStyle = C.fig; g.fill();
  const W = [[15.2, hy - 12], [16.8, hy - 3], [17.6, hy + 6], [9, hy + 12], [0, hy + 10.5]];
  blob(g, W.map((p) => [cx + p[0], p[1]]).concat(W.slice(0, 4).reverse().map((p) => [cx - p[0], p[1]]))); g.fillStyle = C.cloth; g.fill();
  for (const lg of [J.legF, J.legN]) part(g, lg.a, lg.b, [[-0.1, 0], [0, 9.6], [0.36, 9.4], [0.42, 0], [0.36, -9.4], [0, -9.6]], C.cloth);
  capsule(g, [cx, sy - 7], [cx, J.head[1] + 6], 10, C.fig);
  g.beginPath(); g.ellipse(cx, J.head[1], 8.8, 11.4, 0, 0, TAU); g.strokeStyle = C.halo; g.lineWidth = 3; g.stroke(); g.fillStyle = C.fig; g.fill();
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 9, J.head[1] + 1.5, 1.7, 2.7, 0, 0, TAU); g.fill(); }
  g.beginPath(); g.ellipse(cx, J.head[1] - 2, 9.3, 9.8, 0, 0, TAU); g.fillStyle = C.hair; g.fill();
  if (ex.mus.includes('lats')) {
    glowOn(g, C, glow); g.fillStyle = C.muscle;
    for (const s of [-1, 1]) { blob(g, [[19.4, sy + 9], [20, sy + 19], [15.4, sy + 32], [7.5, sy + 30], [8.5, sy + 13]].map((p) => [cx + s * p[0], p[1]])); g.fill(); }
    glowOff(g);
  }
  for (const arm of [J.armF, J.armN]) {
    blob(g, bonePts(arm.a, arm.b, OUT.uarmB)); g.strokeStyle = C.halo; g.lineWidth = 3; g.stroke(); blob(g, bonePts(arm.b, arm.c, OUT.farm)); g.stroke();
    part(g, arm.a, arm.b, OUT.uarmB, C.fig); part(g, arm.b, arm.c, OUT.farm, C.fig);
  }
  glowOn(g, C, glow); g.fillStyle = C.muscle;
  for (const arm of [J.armF, J.armN]) {
    if (ex.mus.includes('delts')) { blob(g, bonePts(arm.a, arm.b, [[-0.12, 0], [-0.04, 5.8], [0.2, 5.6], [0.34, 0], [0.2, -5.6], [-0.04, -5.8]])); g.fill(); }
    if (ex.mus.includes('biceps')) { blob(g, bonePts(arm.a, arm.b, [[0.3, 4.2], [0.6, 4.2], [0.88, 2.6], [0.88, -2.6], [0.6, -4.2], [0.3, -4.2]])); g.fill(); }
  }
  glowOff(g);
}
/* seen from above (the person faces the top of the stage) */
function drawTop(g, C, c, arms, o) {
  if (o.feet) for (const s of [-1, 1]) { g.beginPath(); g.ellipse(c[0] + s * 11.5, c[1] - 13, 5.2, 12, s * 0.12, 0, TAU); g.fillStyle = C.shoe; g.fill(); }
  if (o.thighs) for (const s of [-1, 1]) { capsule(g, [c[0] + s * 11, c[1] - 2], [c[0] + s * 17, c[1] - 44], 16, C.far); capsule(g, [c[0] + s * 11, c[1] - 2], [c[0] + s * 13.6, c[1] - 20], 17, C.clothFar); }
  if (o.mid) o.mid();
  g.beginPath(); g.ellipse(c[0], c[1], 26, o.ry || 12.5, 0, 0, TAU); g.strokeStyle = C.halo; g.lineWidth = 3; g.stroke(); g.fillStyle = C.fig; g.fill();
  if (o.mus) { glowOn(g, C, o.glow); g.fillStyle = C.muscle; o.mus(); glowOff(g); }
  for (const arm of arms) {
    blob(g, bonePts(arm.a, arm.b, OUT.uarmB)); g.strokeStyle = C.halo; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke(); blob(g, bonePts(arm.b, arm.c, OUT.farm)); g.stroke();
    part(g, arm.a, arm.b, OUT.uarmB, C.fig); part(g, arm.b, arm.c, OUT.farm, C.fig);
  }
  const hy = c[1] + (o.headDy || 0);
  g.beginPath(); g.moveTo(c[0] - 2.6, hy - 9); g.lineTo(c[0], hy - 13.4); g.lineTo(c[0] + 2.6, hy - 9); g.closePath(); g.fillStyle = C.fig; g.fill();
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(c[0] + s * 8.6, hy, 1.8, 2.8, 0, 0, TAU); g.fill(); }
  g.beginPath(); g.ellipse(c[0], hy, 8.6, 10.2, 0, 0, TAU); g.strokeStyle = C.halo; g.lineWidth = 2.5; g.stroke(); g.fillStyle = C.hair; g.fill();
}

/* ---- gym equipment kit ---- */
const K = {
  tube(g, C, a, b, w) { w = w || 5; capsule(g, a, b, w, C.eq); const n = nrm(a, b), s = n[1] < 0 || (n[1] === 0 && n[0] < 0) ? 1 : -1, o = w * 0.22 * s; capsule(g, [a[0] + n[0] * o, a[1] + n[1] * o], [b[0] + n[0] * o, b[1] + n[1] * o], Math.max(1, w * 0.26), C.eqHi); },
  dark(g, C, a, b, w) { capsule(g, a, b, w || 4.5, C.eq2); },
  foot(g, C, x, w) { box(g, x, G - 2.5, w || 24, 5, 0, C.eq2, 2.5); },
  base(g, C, x1, x2) { capsule(g, [x1, G - 3], [x2, G - 3], 5, C.eq2); },
  pad(g, C, a, b, off, len, th, shift) {
    const n = nrm(a, b), u = unit(a, b), k = shift || 0, cx = (a[0] + b[0]) / 2 + n[0] * off + u[0] * k, cy = (a[1] + b[1]) / 2 + n[1] * off + u[1] * k, rot = angOf(a, b), sgn = off > 0 ? -1 : 1;
    box(g, cx + n[0] * sgn * -2.2, cy + n[1] * sgn * -2.2, len - 6, th * 0.5, rot, C.eq2, 2);
    box(g, cx, cy, len, th, rot, C.pad, th / 2);
    capsule(g, [cx + n[0] * sgn * th * 0.24 - u[0] * (len / 2 - 7), cy + n[1] * sgn * th * 0.24 - u[1] * (len / 2 - 7)], [cx + n[0] * sgn * th * 0.24 + u[0] * (len / 2 - 7), cy + n[1] * sgn * th * 0.24 + u[1] * (len / 2 - 7)], 1.3, C.padHi);
  },
  cushion(g, C, cx, cy, w, h, rot) { box(g, cx, cy, w, h, rot, C.pad, h / 2); const d = dir(rot || 0); capsule(g, [cx - d[0] * (w / 2 - 6) + d[1] * h * 0.22, cy - d[1] * (w / 2 - 6) - d[0] * h * 0.22], [cx + d[0] * (w / 2 - 6) + d[1] * h * 0.22, cy + d[1] * (w / 2 - 6) - d[0] * h * 0.22], 1.3, C.padHi); },
  /* weight stack: the top plates travel with the movement */
  stack(g, C, x, top, bot, lift) {
    capsule(g, [x - 11, top - 34], [x - 11, bot], 2.4, C.eq2); capsule(g, [x + 11, top - 34], [x + 11, bot], 2.4, C.eq2); capsule(g, [x - 11, top - 34], [x + 11, top - 34], 2.4, C.eq2);
    const n = Math.floor((bot - top) / 6.2);
    capsule(g, [x, top - 30], [x, top - (lift || 0) + 2], 1.6, C.cable);
    for (let i = 0; i < n; i++) { const y = top + i * 6.2 - (i < 4 ? lift || 0 : 0); box(g, x, y + 2.4, 18, 4.8, 0, i < 4 ? C.plate : C.eq2, 1.4); }
    ring(g, [x + 5, top + 3 * 6.2 + 2.4 - (lift || 0)], 1.5, C.accent);
  },
  pulley(g, C, c, r) { r = r || 6; ring(g, c, r, C.eq2); ring(g, c, r - 2.3, C.stage); ring(g, c, 1.7, C.eq2); },
  cable(g, C, pts) { g.strokeStyle = C.cable; g.lineWidth = 1.5; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); },
  /* cable column with a weight stack; the pulley sits on an arm */
  tower(g, C, x, o) {
    K.tube(g, C, [x, 22], [x, G - 4], 11); K.stack(g, C, x, 150, 224, o.lift); K.foot(g, C, x, 34);
    const p = o.pulley; K.tube(g, C, [x, p[1] - 5], [p[0], p[1] - 5], 5); K.pulley(g, C, p, 6.5);
  },
  plate(g, C, c, r) { ring(g, c, r, C.plate); ring(g, c, r - 3.6, null, C.plateHi, 1.3); ring(g, c, r * 0.62, null, C.plateHi, 0.9); ring(g, c, r * 0.3, C.eq); ring(g, c, r * 0.12, C.eq2); },
  collar(g, C, c) { ring(g, c, 3.6, C.eq, C.eq2, 1.5); },
  grip(g, C, c, rot, len) { const d = dir(rot), h = (len || 14) / 2; capsule(g, add(c, d, -h), add(c, d, h), 3.6, C.eq2); capsule(g, add(c, d, -h + 2.5), add(c, d, h - 2.5), 4.6, C.plate); },
  rope(g, C, c, rot) { const d = dir(rot); capsule(g, add(c, d, -7), add(c, d, 7), 3.4, C.cable); ring(g, add(c, d, -8), 2.6, C.plate); ring(g, add(c, d, 8), 2.6, C.plate); },
  dbEnd(g, C, c) { g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * 60 + 30) * RAD; g[i ? 'lineTo' : 'moveTo'](c[0] + Math.cos(a) * 8.2, c[1] + Math.sin(a) * 8.2); } g.closePath(); g.fillStyle = C.plate; g.fill(); ring(g, c, 5, null, C.plateHi, 1.1); ring(g, c, 2, C.eq); },
  dbSide(g, C, c, rot) { const d = dir(rot); capsule(g, add(c, d, -8), add(c, d, 8), 3, C.eq); for (const s of [-1, 1]) { box(g, c[0] + d[0] * s * 10.5, c[1] + d[1] * s * 10.5, 8.5, 15.5, rot, C.plate, 2.8); capsule(g, [c[0] + d[0] * s * 10.5 - d[1] * 5, c[1] + d[1] * s * 10.5 + d[0] * 5], [c[0] + d[0] * s * 10.5 + d[1] * 5, c[1] + d[1] * s * 10.5 - d[0] * 5], 1, C.plateHi); } },
  bench(g, C, x1, x2, top) { K.cushion(g, C, (x1 + x2) / 2, top + 5.5, x2 - x1, 11, 0); K.dark(g, C, [x1 + 9, top + 11], [x1 + 6, G - 4], 4.5); K.dark(g, C, [x2 - 9, top + 11], [x2 - 6, G - 4], 4.5); K.foot(g, C, x1 + 6, 16); K.foot(g, C, x2 - 6, 16); },
};

function drawTrack(g, pts, C) {
  if (!pts || pts.length < 2) return;
  let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  if (len < 8) return;
  g.save(); g.strokeStyle = C.accent; g.fillStyle = C.accent; g.globalAlpha = 0.9; g.lineWidth = 1.5; g.lineCap = 'butt'; g.setLineDash([3, 4]);
  g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); g.setLineDash([]);
  for (const p of [pts[0], pts[pts.length - 1]]) { g.beginPath(); g.arc(p[0], p[1], 2.4, 0, TAU); g.fill(); }
  g.restore();
}
function drawBackdrop(g, C, top) {
  g.fillStyle = C.stage; g.fillRect(0, 0, SW, SH);
  g.lineWidth = 1; g.strokeStyle = C.grid; g.beginPath();
  for (let x = 20; x < SW; x += 20) { g.moveTo(x, 0); g.lineTo(x, SH); }
  for (let y = 16; y < SH; y += 20) { g.moveTo(0, y); g.lineTo(SW, y); }
  g.stroke();
  g.strokeStyle = C.grid2; g.beginPath();
  for (let x = 80; x < SW; x += 100) { g.moveTo(x, 0); g.lineTo(x, SH); }
  for (let y = 36; y < SH; y += 100) { g.moveTo(0, y); g.lineTo(SW, y); }
  g.stroke();
  if (top) return;
  g.fillStyle = C.floor; g.fillRect(0, G, SW, SH - G);
  g.strokeStyle = C.ground; g.lineWidth = 2; g.beginPath(); g.moveTo(0, G); g.lineTo(SW, G); g.stroke();
  g.lineWidth = 1; g.beginPath(); for (let x = 20; x < SW; x += 20) { g.moveTo(x, G); g.lineTo(x - 5, G + 7); } g.stroke();
}

/* ---- movement registry ---- */
const ANIM = {};
function def(key, o) {
  if (o.base) { o.A = normPose(Object.assign({}, o.base, o.a)); o.B = normPose(Object.assign({}, o.base, o.b)); }
  ANIM[key] = o;
}
const TRACK = { hand: (J) => [J.armN.c], hands: (J) => [J.armN.c, J.armF.c], ankle: (J) => [J.legN.c], knee: (J) => [J.legN.b], hip: (J) => [J.hip], head: (J) => [J.head], sh: (J) => [J.sh] };
function tracksOf(ex) {
  if (ex._tr || !ex.track || !ex.A) return ex._tr;
  const out = [];
  for (let i = 0; i <= 16; i++) TRACK[ex.track](solve(mixPose(ex.A, ex.B, i / 16))).forEach((p, k) => (out[k] || (out[k] = [])).push(p));
  return (ex._tr = out);
}
/* one frame. t: 0 = lengthened position, 1 = contracted; C.fx > 0 turns on the muscle glow */
function renderAnim(g, key, t, C, thumb) {
  const ex = ANIM[key];
  if (thumb) { g.fillStyle = C.stage; g.fillRect(0, 0, SW, SH); } else drawBackdrop(g, C, ex.view === 'top');
  if (ex.draw) { ex.draw(g, t, C, t); return; }
  const J = solve(mixPose(ex.A, ex.B, t));
  if (!thumb && ex.view === 'side') { g.fillStyle = C.shadow; g.beginPath(); g.ellipse((J.hip[0] + J.legN.c[0]) / 2, G + 4, 46, 4.2, 0, 0, TAU); g.fill(); }
  if (ex.back) ex.back(g, J, C, t);
  (ex.view === 'back' ? drawBack : drawSide)(g, J, C, ex, t);
  if (ex.front) ex.front(g, J, C, t);
  if (!thumb) (tracksOf(ex) || []).forEach((p) => drawTrack(g, p, C));
}
