/* ================================================================== feel: every press answers
   A press is felt three ways at once: the control gives under the finger (styles.css), a light tick in the hand, and a soft
   click. The moments that matter get more: a set logged, a personal best, points, a level, a finished workout.
   Sounds are made on the spot (no files); the hand feels a tick through the phone app, the vibration of Android browsers,
   or on an iPhone browser through the one control Safari lets buzz (a hidden switch). Sound and vibration each have a
   switch in the settings. */
const SFX = {
  tap: [[1500, 0, 0.028, 0.045, 'triangle', 900]],
  select: [[1150, 0, 0.04, 0.06, 'triangle', 1500]],
  back: [[900, 0, 0.05, 0.05, 'triangle', 620]],
  step: [[2100, 0, 0.022, 0.035, 'triangle', 1700]],
  set: [[660, 0, 0.09, 0.16, 'sine'], [990, 0.07, 0.16, 0.16, 'sine']],
  pr: [[784, 0, 0.09, 0.15, 'sine'], [988, 0.08, 0.09, 0.15, 'sine'], [1319, 0.16, 0.26, 0.17, 'sine']],
  coin: [[1568, 0, 0.06, 0.07, 'triangle'], [2093, 0.05, 0.14, 0.07, 'triangle']],
  done: [[523, 0, 0.12, 0.15, 'triangle'], [659, 0.11, 0.12, 0.15, 'triangle'], [784, 0.22, 0.12, 0.15, 'triangle'], [1047, 0.34, 0.5, 0.17, 'triangle'], [784, 0.34, 0.5, 0.08, 'sine']],
  warn: [[440, 0, 0.12, 0.09, 'sine', 330]],
};
/* one note: [frequency, start, length, volume, wave, frequency it slides to] */
function sfx(kind) {
  const notes = SFX[kind]; if (!notes || !S.sound) return;
  primeAudio(); if (!actx) return;
  try {
    const t0 = actx.currentTime + 0.005;
    for (const n of notes) {
      const o = actx.createOscillator(), g = actx.createGain(), t = t0 + n[1], end = t + n[2];
      o.type = n[4]; o.frequency.setValueAtTime(n[0], t); if (n[5]) o.frequency.exponentialRampToValueAtTime(n[5], end);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(n[3], t + Math.min(0.012, n[2] / 3)); g.gain.exponentialRampToValueAtTime(0.0001, end);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(end + 0.02);
    }
  } catch (e) { /* no audio here */ }
}
/* the hand: kinds from lightest to strongest */
const HAPTIC = { tap: 6, select: 8, step: 5, back: 6, success: [14, 50, 22], pr: [18, 40, 18, 40, 30], heavy: [40, 30, 60], warn: [30, 60, 30] };
let feelSwitch = null;
function haptic(kind) {
  if (S.buzz === false || !HAPTIC[kind]) return;
  if (typeof window.gymiHaptic === 'function') { try { window.gymiHaptic(kind); } catch (e) { /* the shell is gone */ } return; }
  if (navigator.vibrate) { try { navigator.vibrate(HAPTIC[kind]); } catch (e) { /* unsupported */ } return; }
  /* an iPhone browser: toggling a switch control is the one thing Safari answers with a tick, and only during a tap */
  if (!feelSwitch) {
    feelSwitch = document.createElement('label');
    feelSwitch.setAttribute('aria-hidden', 'true');
    feelSwitch.style.cssText = 'position:fixed;width:1px;height:1px;left:-9px;top:-9px;opacity:0;pointer-events:none;overflow:hidden';
    feelSwitch.innerHTML = '<input type="checkbox" switch tabindex="-1">';
    document.body.appendChild(feelSwitch);
  }
  try { feelSwitch.click(); if (Array.isArray(HAPTIC[kind])) setTimeout(() => { try { feelSwitch.click(); } catch (e) { /* gone */ } }, 90); } catch (e) { /* not here */ }
}
let feltAt = 0;
/* sound and touch together; a richer answer from the code that knows what happened wins over the plain tick of the tap */
function feel(kind, touch) { feltAt = Date.now(); sfx(kind); haptic(touch || (kind === 'set' ? 'success' : kind === 'done' || kind === 'coin' ? 'heavy' : kind)); }
/* points that fly up from where they were earned */
function flyPoints(el, n) {
  if (!el || !(n > 0) || reduced) return;
  const r = el.getBoundingClientRect(), f = document.createElement('span');
  f.className = 'fly'; f.setAttribute('aria-hidden', 'true'); f.textContent = '+' + n;
  f.style.left = r.left + r.width / 2 + 'px'; f.style.top = r.top + 4 + 'px';
  document.body.appendChild(f); setTimeout(() => f.remove(), 950);
}
function wireFeel() {
  /* after the button's own work: a plain press gets a tick, unless that work already answered with something richer */
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('button,[role="button"],a[href]'); if (!b || b.disabled) return;
    primeAudio();
    if (Date.now() - feltAt < 120 || b.closest('.step,.rstep') || b.id === 'dkHit') return;
    const kind = b.matches('[data-close],#backBtn,#sheetClose,#chatClose,#exPrev,#fbSkip,#edClose,#resetNo,#msNo,#edDelNo') ? 'back' : b.matches('[aria-pressed],[role="switch"],[aria-checked],[data-pick],[data-sel],.seg button') ? 'select' : 'tap';
    sfx(kind); haptic(kind);
  });
}
