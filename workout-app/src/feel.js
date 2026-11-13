/* ================================================================== feel: every press answers
   A press is felt in the hand and seen under the finger (the control gives and springs back, see styles.css). Sound is
   kept for the few moments that earn it: a set logged, a personal best, a level, a finished workout. A click on every
   press was tried and was tiring.
   The hand feels a tick through the phone app's own engine, through the vibration of Android browsers, or on an iPhone
   browser through the one control Safari answers with a tick: a switch, and only when a finger itself lands on it or
   on its label (see dress() below). Sound and vibration each have a switch in the settings. */
const SFX = {
  set: [[587, 0, 0.11, 0.06, 'sine'], [880, 0.085, 0.2, 0.06, 'sine']],
  pr: [[659, 0, 0.1, 0.065, 'sine'], [880, 0.09, 0.1, 0.065, 'sine'], [1175, 0.18, 0.3, 0.07, 'sine']],
  coin: [[880, 0, 0.08, 0.05, 'sine'], [1175, 0.07, 0.16, 0.05, 'sine']],
  done: [[523, 0, 0.13, 0.07, 'sine'], [659, 0.12, 0.13, 0.07, 'sine'], [784, 0.24, 0.13, 0.07, 'sine'], [1047, 0.36, 0.5, 0.08, 'sine']],
};
/* one note: [frequency, start, length, volume, wave] with a soft start and a long tail, like a struck bar */
function sfx(kind) {
  const notes = SFX[kind]; if (!notes || !S.sound) return;
  primeAudio(); if (!actx) return;
  try {
    const t0 = actx.currentTime + 0.005;
    for (const n of notes) {
      const o = actx.createOscillator(), g = actx.createGain(), t = t0 + n[1], end = t + n[2] + 0.18;
      o.type = n[4]; o.frequency.setValueAtTime(n[0], t);
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
function flyPoints(el, n) {
  if (!el || !(n > 0) || reduced) return;
  const r = el.getBoundingClientRect(), f = document.createElement('span');
  f.className = 'fly'; f.setAttribute('aria-hidden', 'true'); f.textContent = '+' + n;
  f.style.left = r.left + r.width / 2 + 'px'; f.style.top = r.top + 4 + 'px';
  document.body.appendChild(f); setTimeout(() => f.remove(), 950);
}
/* the touch each press gets, by what the control is */
function touchOf(b) {
  if (b.id === 'dkHit' || b.id === 'homeGo' || b.id === 'obNext' || b.id === 'finishBtn' || b.id === 'dkFinish' || b.id === 'obMe') return 'success';
  if (b.matches('.step,.rstep,.stp button')) return 'step';
  if (b.matches('[data-close],#backBtn,#sheetClose,#chatClose,#exPrev,#obBack,#fbSkip,#edClose,#resetNo,#msNo,#edDelNo,[data-msp=""]')) return 'back';
  if (b.matches('[aria-pressed],[role="switch"],[role="radio"],[aria-checked],[data-pick],[data-sel],.seg button,.tab,#tabbar button')) return 'select';
  return 'tap';
}
/* saying yes sounds like a set that is done: starting a workout, choosing, saving */
const YES = '#homeGo,#preAll,#preDone,#dlYes,#edDone,.sw-b button,[data-add],#moreSame';
function wireFeel() {
  wireDress();
  /* first thing in every press, before the control does its work, so that the hand is answered at once */
  document.addEventListener('click', (ev) => {
    const t = ev.target;
    /* the press that the browser passes from a clear label to its switch: it is there to tick, and nothing else hears it */
    if (t && t.parentNode && t.parentNode.className === 'hx') { ev.stopPropagation(); return; }
    const b = t.closest && t.closest('button,[role="button"],a[href],select,summary,label.chat-ctx'); if (!b || b.disabled) return;
    primeAudio();
    /* under a clear label the finger has already been answered by the phone itself */
    if (!(HX.on && t.className === 'hx')) haptic(touchOf(b));
    if (b.matches(YES)) sfx('set');
  }, true);
  /* a weight or a number that is held down keeps ticking as it runs */
  document.addEventListener('pointerdown', (ev) => { const b = ev.target.closest && ev.target.closest('.step,.rstep'); if (b && (navigator.vibrate || window.gymiHaptic)) haptic('step'); }, true);
}
