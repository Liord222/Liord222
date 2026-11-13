/* ================================================================== stage player */
let C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim();
  C = { stage: v('--stage'), grid: v('--grid'), grid2: v('--grid-2'), floor: v('--floor'), ground: v('--ground'), shadow: v('--shadow'), fig: v('--fig'), figHi: v('--fig-hi'), figLo: v('--fig-lo'), far: v('--fig-far'), cloth: v('--cloth'), clothFar: v('--cloth-far'), shoe: v('--shoe'), shoeFar: v('--shoe-far'), sole: v('--sole'), hair: v('--hair'), eq: v('--equip'), eqHi: v('--equip-hi'), eq2: v('--equip-2'), pad: v('--pad'), padHi: v('--pad-hi'), plate: v('--plate'), plateHi: v('--plate-hi'), cable: v('--cable'), muscle: v('--muscle'), accent: v('--accent') };
  C.halo = C.stage; C._fig = hexRgb(C.fig); C._hi = hexRgb(C.figHi); C._lo = hexRgb(C.figLo); C.fx = 0;
}
const player = { key: null, cv: null, g: null, raf: 0, clock: 0, last: 0, playing: !reduced, speed: 1, visible: true, phaseEl: null, btn: null, bar: null, phase: -1, lastT: 0.5, io: null, ro: null };
const PHASES = () => [say('מאמץ · נשיפה', 'Effort · breathe out'), say('כיווץ', 'Squeeze'), say('חזרה איטית · שאיפה', 'Slow return · breathe in'), say('מתיחה', 'Stretch')];
const ease = (x) => (1 - Math.cos(Math.PI * x)) / 2;
function fitCanvas(cv, cssW) {
  const dpr = Math.min(2.5, window.devicePixelRatio || 1), w = Math.max(120, Math.round(cssW * dpr));
  if (cv.width !== w) { cv.width = w; cv.height = Math.round((w * SH) / SW); }
}
function paintStage(t) {
  if (!player.cv) return;
  const g = player.g, k = player.cv.width / SW;
  g.setTransform(k, 0, 0, k, 0, 0); C.fx = k; renderAnim(g, player.key, t, C, false); C.fx = 0; player.lastT = t;
  if (player.bar) player.bar.style.transform = 'scaleX(' + t.toFixed(3) + ')';
}
function frame(now) {
  /* out of sight (another tab of the app, scrolled away): no more frames are asked for until it is seen again */
  if (!player.cv || !player.playing || !player.visible) { player.raf = 0; return; }
  player.raf = requestAnimationFrame(frame);
  const dt = Math.min(80, now - (player.last || now)); player.last = now;
  player.clock += dt * player.speed;
  const ex = ANIM[player.key], tp = ex.tempo || [1.1, 0.25, 1.8, 0.35];
  let x = (player.clock / 1000) % (tp[0] + tp[1] + tp[2] + tp[3]), t, ph;
  if (x < tp[0]) { t = ease(x / tp[0]); ph = 0; } else if ((x -= tp[0]) < tp[1]) { t = 1; ph = 1; } else if ((x -= tp[1]) < tp[2]) { t = 1 - ease(x / tp[2]); ph = 2; } else { t = 0; ph = 3; }
  if (ph !== player.phase && player.phaseEl) { player.phase = ph; player.phaseEl.textContent = (ex.phases ? ex.phases() : PHASES())[ph]; player.phaseEl.classList.toggle('hot', ph < 2); }
  paintStage(t);
}
function setPlaying(on) {
  player.playing = on; cancelAnimationFrame(player.raf);
  if (player.btn) { player.btn.innerHTML = on ? ICON.pause : ICON.play; player.btn.setAttribute('aria-label', on ? say('השהה את ההדמיה', 'Pause the demo') : say('נגן את ההדמיה', 'Play the demo')); }
  if (on) { player.last = 0; player.phase = -1; player.raf = requestAnimationFrame(frame); } else { if (player.phaseEl) { player.phaseEl.textContent = say('מושהה', 'Paused'); player.phaseEl.classList.remove('hot'); } paintStage(player.lastT); }
}
function startPlayer(cv, key, body) {
  stopPlayer();
  Object.assign(player, { cv, key, g: cv.getContext('2d'), phaseEl: $('.stage-phase', body), btn: $('.stage-play', body), bar: $('.tempo i', body), phase: -1, lastT: 0.5, clock: 0, visible: true });
  fitCanvas(cv, cv.getBoundingClientRect().width || 340);
  if (window.ResizeObserver) { player.ro = new ResizeObserver((en) => { if (!player.cv) return; fitCanvas(player.cv, en[0].contentRect.width); if (!player.playing) paintStage(player.lastT); }); player.ro.observe(cv); }
  if (window.IntersectionObserver) { player.io = new IntersectionObserver((en) => { player.visible = en[0].isIntersecting; if (player.visible && player.playing && player.cv && !player.raf) { player.last = 0; player.raf = requestAnimationFrame(frame); } }); player.io.observe(cv); }
  setPlaying(player.playing);
}
function stopPlayer() {
  cancelAnimationFrame(player.raf); player.raf = 0;
  if (player.ro) player.ro.disconnect(); if (player.io) player.io.disconnect();
  player.cv = null; player.ro = player.io = null;
}
function drawThumbs() {
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  for (const cv of $$('.ex-thumb')) {
    cv.width = Math.round(68 * dpr); cv.height = Math.round(49 * dpr);
    const g = cv.getContext('2d'), z = (cv.width / SW) * 1.3;
    g.setTransform(z, 0, 0, z, cv.width / 2 - 180 * z, cv.height / 2 - 142 * z); renderAnim(g, cv.dataset.anim, 0.5, C, true);
  }
}
function onTheme() { readColors(); drawThumbs(); if (player.cv && !player.playing) paintStage(player.lastT); }

