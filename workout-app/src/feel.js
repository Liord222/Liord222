/* ================================================================== feel: every press answers
   A press is felt in the hand and seen under the finger (the control gives and springs back, see styles.css). Sound is
   kept for the few moments that earn it: a set logged, a personal best, a level, a finished workout. A click on every
   press was tried and was tiring.
   The hand feels a tick through the phone app's own engine, through the vibration of Android browsers, or on an iPhone
   browser through the one control Safari answers with a tick: a switch, and only when a finger itself lands on it or
   on its label (see dress() below). Sound and vibration each have a switch in the settings. */
const SFX = {
  /* a step of the opening: two soft notes, barely there */
  step: [[523, 0, 0.07, 0.018, 'sine'], [784, 0.05, 0.14, 0.02, 'sine']],
  /* a logged set: a round drop that rises a fifth and rings, with a breath of the octave above it */
  set: [[659, 0, 0.08, 0.03, 'sine'], [988, 0.07, 0.24, 0.036, 'sine'], [1976, 0.07, 0.16, 0.008, 'sine']],
  /* a personal best: the same drop run up a chord, landing on a long note */
  pr: [[523, 0, 0.08, 0.03, 'sine'], [659, 0.07, 0.08, 0.03, 'sine'], [784, 0.14, 0.09, 0.032, 'sine'], [1047, 0.21, 0.5, 0.04, 'sine'], [2093, 0.23, 0.36, 0.008, 'sine']],
  coin: [[784, 0, 0.07, 0.026, 'sine'], [1047, 0.06, 0.16, 0.028, 'sine']],
  /* a new exercise comes in: two soft notes that rise */
  next: [[392, 0, 0.09, 0.024, 'sine'], [587, 0.08, 0.22, 0.026, 'sine']],
  done: [[523, 0, 0.12, 0.036, 'sine'], [659, 0.11, 0.12, 0.036, 'sine'], [784, 0.22, 0.12, 0.036, 'sine'], [1047, 0.33, 0.5, 0.044, 'sine'], [1568, 0.36, 0.4, 0.01, 'sine']],
  /* a small fanfare: a rising run that lands on an open chord and rings */
  glory: [[392, 0, 0.11, 0.03, 'sine'], [523, 0.1, 0.11, 0.03, 'sine'], [659, 0.2, 0.11, 0.032, 'sine'], [784, 0.3, 0.15, 0.034, 'sine'], [1047, 0.46, 0.7, 0.042, 'sine'], [784, 0.46, 0.7, 0.022, 'sine'], [1319, 0.5, 0.7, 0.018, 'sine']],
};
/* one note: [frequency, start, length, volume, wave] with a soft start and a long tail, like a struck bar */
/* up: semitones to lift the whole sound by (a run of good sets climbs a scale) */
function sfx(kind, up) {
  const notes = SFX[kind], lift = Math.pow(2, (up || 0) / 12); if (!notes || !S.sound) return;
  primeAudio(); if (!actx) return;
  try {
    const t0 = actx.currentTime + 0.005;
    for (const n of notes) {
      const o = actx.createOscillator(), g = actx.createGain(), t = t0 + n[1], end = t + n[2] + 0.18;
      o.type = n[4]; o.frequency.setValueAtTime(n[0] * lift, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(n[3], t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, end);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(end + 0.02);
    }
  } catch (e) { /* no audio here */ }
}
/* the hand: what each kind is on a phone that vibrates (milliseconds; under about 10 most phones give nothing at all) */
const HAPTIC = { tap: 14, select: 18, step: 10, back: 12, success: [22, 60, 34], pr: [26, 50, 26, 50, 44], heavy: [46, 40, 70], warn: [34, 70, 34] };
const TICKS = { success: 2, pr: 3, heavy: 2, warn: 2 };
/* an iPhone browser up to iOS 26.4: a switch toggled from a script, inside a press, was answered with a tick. From
   26.5 a scripted toggle is silent, so this only adds the extra ticks of a pattern on older phones */
function tick() {
  try {
    const l = document.createElement('label'); l.setAttribute('aria-hidden', 'true'); l.style.display = 'none';
    l.innerHTML = '<input type="checkbox" switch>';
    document.head.appendChild(l); l.click(); document.head.removeChild(l);
  } catch (e) { /* not here */ }
}
/* an iPhone browser from iOS 26.5: the phone ticks only when the finger itself lands on a switch or on its label. So
   every control wears a clear label over it, the label of a hidden switch of its own. The press reaches the control as
   before (it bubbles up from the label), the browser passes it on to the switch, and the switch ticks. Scrolling is
   untouched, since a label does nothing with a touch. Only where it helps: a touch screen with no vibration of its own
   and no phone app around the page */
const HX = { on: false, sel: 'button,[role="button"]' };
const wantsDress = () => window.__hx === true || (window.__hx !== false && !navigator.vibrate && typeof window.gymiHaptic !== 'function' && !!window.matchMedia && matchMedia('(pointer:coarse)').matches);
function dress() {
  if (!HX.on) return;
  for (const b of document.querySelectorAll(HX.sel)) {
    const last = b.lastElementChild, has = last && last.className === 'hx';
    /* a number that has turned into a field for typing: nothing may lie over it */
    if (b.querySelector('input:not([switch]),textarea,select')) { if (has) b.removeChild(last); continue; }
    if (has) continue;
    const l = document.createElement('label'); l.className = 'hx'; l.setAttribute('aria-hidden', 'true');
    l.innerHTML = '<input type="checkbox" switch>';
    if (!b.classList.contains('hxp') && getComputedStyle(b).position === 'static') b.classList.add('hxp');
    b.appendChild(l);
  }
}
function wireDress() {
  HX.on = wantsDress(); if (!HX.on) return;
  document.documentElement.dataset.hx = S.buzz === false ? 'off' : 'on';
  dress();
  if (window.MutationObserver) new MutationObserver(dress).observe(document.body, { childList: true, subtree: true });
}
function haptic(kind) {
  if (S.buzz === false || !HAPTIC[kind]) return;
  if (typeof window.gymiHaptic === 'function') { try { window.gymiHaptic(kind); } catch (e) { /* the shell is gone */ } return; }
  if (navigator.vibrate) { try { navigator.vibrate(HAPTIC[kind]); } catch (e) { /* unsupported */ } return; }
  tick(); for (let i = 1; i < (TICKS[kind] || 1); i++) setTimeout(tick, i * 110);
}
/* sound and touch together, for the moments that earn both */
function feel(kind, touch) { sfx(kind); haptic(touch || (kind === 'set' ? 'success' : kind === 'pr' ? 'pr' : 'heavy')); }
/* points that fly up from where they were earned */
function popGain(n, pr) {
  if (!(n > 0) || reduced) return;
  for (const o of $$('.pts')) o.remove();
  const f = document.createElement('div'); f.className = 'pts' + (pr ? ' pr' : ''); f.setAttribute('aria-hidden', 'true');
  let sparks = ''; const cnt = pr ? 10 : 6;
  for (let i = 0; i < cnt; i++) { const a = (i / cnt) * Math.PI * 2 + 0.4, d = pr ? 92 : 74; sparks += '<i style="--sx:' + (Math.cos(a) * d).toFixed(0) + 'px;--sy:' + (Math.sin(a) * d * 0.55).toFixed(0) + 'px;--sd:' + (i * 18) + 'ms"></i>'; }
  f.innerHTML = '<span class="pts-pill">' + sparks + glyph('bolt') + '<b>' + Ltr('+' + nf(n)) + '</b></span>' + (pr ? '<span class="pts-tag">' + glyph('star') + say('שיא חדש', 'New best') + '</span>' : '');
  document.body.appendChild(f); setTimeout(() => f.remove(), pr ? 2400 : 1700);
  requestAnimationFrame(() => { f.style.top = laneTop(); });
}
/* where a short note shows: over the top of the drawing of the exercise when it is on the screen; otherwise where its style puts it */
function laneTop() {
  const st = !rest.on && S.view === 'workout' && !S.sheet && document.querySelector('#exList .stage-wrap'), r = st && st.getBoundingClientRect();
  return r && r.top > 40 && r.top < innerHeight - 160 ? Math.round(r.top + 14) + 'px' : '';
}
/* the touch each press gets, by what the control is */
function touchOf(b) {
  if (b.id === 'dkHit' || b.id === 'homeGo' || b.id === 'obNext' || b.id === 'finishBtn' || b.id === 'dkFinish' || b.id === 'obMe') return 'success';
  if (b.matches('.step,.rstep,.stp button')) return 'step';
  if (b.matches('[data-close],#backBtn,#sheetClose,#chatClose,#exPrev,#obBack,#rtUndo,#edClose,#resetNo,#msNo,#edDelNo,[data-msp=""]')) return 'back';
  if (b.matches('[aria-pressed],[role="switch"],[role="radio"],[aria-checked],[data-pick],[data-sel],.seg button,.tab,#tabbar button')) return 'select';
  return 'tap';
}
/* saying yes sounds like a set that is done: starting a workout, choosing, saving */
const YES = '#homeGo,#preAll,#preDone,#dlYes,#edDone,.sw-b button,[data-add],#moreSame';
function wireFeel() {
  /* the sound of the app is made ready while nothing happens, after the page is up: made on the first press it held that press
     (Start workout) for a long moment on a phone. A press then only wakes it */
  const warm = () => { if (!actx) try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } };
  setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(warm, { timeout: 2500 }) : warm()), 1800);
  /* an iPhone shows a control as pressed (:active) only on a page that listens for touches */
  document.addEventListener('touchstart', () => {}, { passive: true });
  wireDress();
  /* first thing in every press, before the control does its work, so that the hand is answered at once */
  document.addEventListener('click', (ev) => {
    const t = ev.target;
    /* the press that the browser passes from a clear label to its switch: it is there to tick, and nothing else hears it */
    if (t && t.parentNode && t.parentNode.className === 'hx') { ev.stopPropagation(); return; }
    const b = t.closest && t.closest('button,[role="button"],a[href],select,summary,label.chat-ctx'); if (!b || b.disabled) return;
    primeAudio();
    /* under a clear label the finger has already been answered by the phone itself */
    /* a stepper was already felt when the finger came down on it (pointerdown below): once is enough */
    const k = touchOf(b);
    if (!(HX.on && t.className === 'hx') && !(k === 'step' && ev.detail > 0 && b.closest('.step,.rstep'))) haptic(k);
    if (b.matches(YES)) sfx('set');
  }, true);
  /* a weight or a number that is held down keeps ticking as it runs */
  document.addEventListener('pointerdown', (ev) => { const b = ev.target.closest && ev.target.closest('.step,.rstep'); if (b && (navigator.vibrate || window.gymiHaptic)) haptic('step'); }, true);
}
