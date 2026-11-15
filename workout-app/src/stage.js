/* ================================================================== stage player */
let C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim();
  C = { stage: v('--stage'), grid: v('--grid'), grid2: v('--grid-2'), floor: v('--floor'), ground: v('--ground'), shadow: v('--shadow'), fig: v('--fig'), figHi: v('--fig-hi'), figLo: v('--fig-lo'), far: v('--fig-far'), cloth: v('--cloth'), clothFar: v('--cloth-far'), shoe: v('--shoe'), shoeFar: v('--shoe-far'), sole: v('--sole'), hair: v('--hair'), eq: v('--equip'), eqHi: v('--equip-hi'), eq2: v('--equip-2'), pad: v('--pad'), padHi: v('--pad-hi'), plate: v('--plate'), plateHi: v('--plate-hi'), cable: v('--cable'), muscle: v('--muscle'), accent: v('--accent'), surface: v('--surface') };
  C.halo = C.stage; C._fig = hexRgb(C.fig); C._hi = hexRgb(C.figHi); C._lo = hexRgb(C.figLo); C.fx = 0; worn_ = '';
}
/* the figure in the demos is the player's own character: its skin, hairstyle and beard, its shirt, the navy shorts,
   and the gear it has won (see rig.js). Worked out again only when the look, the level or the ground changes */
let worn_ = '';
function wearLook() {
  const k = S.cfg && S.cfg.me && S.cfg.me.look; if (!k || !C.surface) return;
  const lvl = S.lvl || 1, key = [k.skin, k.hair, k.hc, k.beard, k.shirt, lvl, C.surface, C.muscle].join();
  if (key === worn_) return;
  worn_ = key;
  const sk = SKIN[k.skin] || SKIN[1], bg = hexRgb(C.surface), skin = hexRgb(sk[0]), shade = hexRgb(sk[1]), mu = hexRgb(C.muscle);
  const css = (a) => 'rgb(' + a.map((v) => Math.round(v)).join(',') + ')', to = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const gear = (g) => REWARDS.some((r) => r.k === g && r.at <= lvl), dark = bg[0] * 0.3 + bg[1] * 0.59 + bg[2] * 0.11 < 90;
  let shirt = hexRgb(SHIRT[k.shirt] || SHIRT[0]);
  /* a shirt too close to the colour that marks the working muscle would hide it: it goes darker */
  if (Math.hypot(shirt[0] - mu[0], shirt[1] - mu[1], shirt[2] - mu[2]) < 110) shirt = shirt.map((v) => Math.round(v * 0.55));
  /* and one the colour of the stage behind it (white on a light stage, black on a dark one) is shaded, so the figure stays whole */
  if (Math.hypot(shirt[0] - bg[0], shirt[1] - bg[1], shirt[2] - bg[2]) < 70) shirt = to(shirt, dark ? [255, 255, 255] : [0, 0, 0], 0.22);
  const shorts = dark ? [86, 96, 138] : [57, 65, 90], hairOn = (k.hair | 0) > 0, hc = HAIRC[k.hc] || HAIRC[0];
  C.fig = sk[0]; C.figLo = sk[1]; C._fig = skin; C._lo = shade; C._hi = to(skin, [255, 255, 255], 0.3);
  C.far = css(to(shade, bg, 0.22));
  C.hair = hairOn ? hc : sk[0];
  C.shirt = css(shirt); C._shirt = shirt; C._shirtHi = to(shirt, [255, 255, 255], 0.24); C._shirtLo = to(shirt, [0, 0, 0], 0.22); C.shirtFar = css(to(to(shirt, [0, 0, 0], 0.22), bg, 0.3));
  C.cloth = css(shorts); C.clothFar = css(to(shorts, bg, 0.42));
  C.av = { hair: k.hair | 0, beard: k.beard | 0, band: gear('band'), tank: gear('tank'), beardC: hairOn ? hc : '#4A3A30', browC: hairOn ? css(to(hexRgb(hc), [0, 0, 0], 0.15)) : '#4A3A30', bandC: k.shirt === 3 ? '#F4F5F7' : '#F2B93B' };
}
const player = { key: null, cv: null, g: null, raf: 0, clock: 0, last: 0, playing: !reduced, visible: true, btn: null, lastT: 0.5, io: null, ro: null, vh: SH, bg: '', under: false };
/* a colour of the page, by the name of its variable */
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const ease = (x) => (1 - Math.cos(Math.PI * x)) / 2;
/* the canvas has the shape of its box on the page (a card may be lower than the plan, on a short screen): the camera fits the demo to it */
function fitCanvas(cv) {
  const r = cv.getBoundingClientRect(), cw = cv.clientWidth || r.width || 340, ch = cv.clientHeight || r.height || (cw * SH) / SW;
  /* twice the pixels of the page at most: the demo is drawn anew at every frame, and a sharper canvas only made a phone slow */
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(120, Math.round(cw * dpr)), h = Math.max(60, Math.round((w * ch) / cw));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  player.vh = (SW * h) / w;
}
function paintStage(t) {
  if (!player.cv) return;
  const g = player.g, k = player.cv.width / SW;
  wearLook(); g.setTransform(k, 0, 0, k, 0, 0); C.fx = k; C.bg = C.halo = player.bg || C.surface; renderAnim(g, player.key, t, C, false, player.vh); C.fx = 0; C.bg = ''; C.halo = C.stage; player.lastT = t;
}
function frame(now) {
  /* out of sight (another tab of the app, scrolled away, or under the coach's chat on a phone): no more frames are asked for until it is seen again */
  if (!player.cv || !player.playing || !player.visible || chat.modal) { player.raf = 0; return; }
  player.raf = requestAnimationFrame(frame);
  /* a screen of 120 frames a second is drawn for at most 60: the movement looks the same, the phone does half the work */
  if (player.last && now - player.last < 14) return;
  /* under the rest, which covers the whole screen of a phone, nothing is drawn: the movement goes on and is seen again when it ends */
  if (rest.on && player.under) { player.clock += Math.min(80, now - (player.last || now)); player.last = now; return; }
  const dt = Math.min(80, now - (player.last || now)); player.last = now;
  player.clock += dt;
  const ex = ANIM[player.key], tp = ex.tempo || [1.1, 0.25, 1.8, 0.35];
  let x = (player.clock / 1000) % (tp[0] + tp[1] + tp[2] + tp[3]), t;
  if (x < tp[0]) t = ease(x / tp[0]); else if ((x -= tp[0]) < tp[1]) t = 1; else if ((x -= tp[1]) < tp[2]) t = 1 - ease(x / tp[2]); else t = 0;
  paintStage(t);
}
/* the demo is one button: a tap stops it, another starts it again */
function setPlaying(on) {
  player.playing = on; cancelAnimationFrame(player.raf); player.raf = 0;
  if (on) { player.last = 0; player.raf = requestAnimationFrame(frame); } else paintStage(player.lastT);
}
function startPlayer(cv, key, body, bg) {
  stopPlayer();
  /* the same demo, drawn again because something else on the page changed, goes on from where it was: it never jumps back to its start.
     bg: a backdrop of its own (the screen of a new exercise); otherwise the colour of the card */
  const same = key === player.key;
  Object.assign(player, { cv, key, g: cv.getContext('2d'), btn: cv.closest('.stage-wrap'), lastT: same ? player.lastT : 0.5, clock: same ? player.clock : 0, visible: true, bg: bg || '' });
  fitCanvas(cv); paintStage(player.lastT);
  if (window.ResizeObserver) { player.ro = new ResizeObserver(() => { if (!player.cv) return; fitCanvas(player.cv); paintStage(player.lastT); }); player.ro.observe(cv); }
  if (window.IntersectionObserver) { player.io = new IntersectionObserver((en) => { player.visible = en[0].isIntersecting; if (player.visible && player.playing && player.cv && !player.raf) { player.last = 0; player.raf = requestAnimationFrame(frame); } }); player.io.observe(cv); }
  setPlaying(player.playing);
}
/* the demo goes on where it stopped, once it can be seen again */
function wakePlayer() { if (player.cv && player.playing && player.visible && !player.raf) { player.last = 0; player.raf = requestAnimationFrame(frame); } }
function stopPlayer() {
  cancelAnimationFrame(player.raf); player.raf = 0;
  if (player.ro) player.ro.disconnect(); if (player.io) player.io.disconnect();
  player.cv = null; player.ro = player.io = null;
}
function drawThumbs() {
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  wearLook(); C.bg = C.halo = C.surface;
  for (const cv of $$('.ex-thumb')) {
    cv.width = Math.round(68 * dpr); cv.height = Math.round(49 * dpr);
    const g = cv.getContext('2d'), z = cv.width / SW;
    g.setTransform(z, 0, 0, z, 0, 0); renderAnim(g, cv.dataset.anim, 0.5, C, true);
  }
  C.bg = ''; C.halo = C.stage;
}
function onTheme() { readColors(); drawThumbs(); if (player.cv && !player.playing) paintStage(player.lastT); }

