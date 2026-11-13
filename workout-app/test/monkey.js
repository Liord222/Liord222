// A monkey at the controls: node test/monkey.js [steps] [seed]  (needs playwright)
// Taps whatever can be tapped and types odd things into whatever can be typed in, in both languages, from an empty log and
// from a full one. After every step the page must be free of errors, and every few steps the log and the screen must still
// make sense. A failure prints the seed and the last actions, so the run can be repeated.
const { chromium } = require('playwright');
const PREVIEW = 'file://' + require('./wrap.js');
const STEPS = +process.argv[2] || 350, SEED0 = +process.argv[3] || 1;
const TYPED = ['', '0', '5', '8', '12', '62,5', '40.25', '999999', 'abc', '-3', ' 7 ', '1e3', '٣', '😀', '<b>x</b>', '"\'&'];
const initScript = () => {
  const sample = async (input, opts) => {
    const asked = input[input.length - 1].content.split('\n\n').pop(), full = /\d/.test(asked) ? 'ok\n@@LOG {"ex":"ua2","sets":[[40,8],[0,9],["x",3]]}' : 'Verdict: Suitable\nfine <i>x</i> & "y"';
    await new Promise((r) => setTimeout(r, 20)); opts.onText({ text: full, delta: full });
    return { text: full, truncated: false };
  };
  sample.limits = async () => ({ images: { maxCount: 1 } });
  window.claude = { use: async (n) => (n === 'sample' ? sample : null) };
};
/* what can be acted on right now: visible, enabled, and really on top at its own centre */
const targets = () => {
  const out = [], vw = innerWidth, vh = innerHeight;
  for (const el of document.querySelectorAll('#app button, #app [role="button"], #app select, #app input:not([type="file"]):not([type="hidden"]), #app textarea')) {
    if (el.disabled || el.id === 'restoreBtn') continue;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    const x = Math.min(vw - 2, Math.max(2, r.left + r.width / 2)), y = r.top + r.height / 2;
    if (y < 2 || y > vh - 2) continue;
    const top = document.elementFromPoint(x, y); if (!top || !(el === top || el.contains(top) || top.contains(el))) continue;
    out.push({ x, y, tag: el.tagName, type: el.type || '', id: el.id || (el.className && String(el.className).split(' ')[0]) || el.tagName, opts: el.tagName === 'SELECT' ? el.options.length : 0 });
  }
  return out;
};
/* the log and the screen must make sense */
const sane = () => {
  const bad = [], P = meNow();
  for (const k of ['kg', 'xp', 'sets', 'prs', 'wk']) if (!Number.isFinite(P.T[k]) || P.T[k] < 0) bad.push('total ' + k + '=' + P.T[k]);
  if (!Number.isFinite(P.L.lvl) || P.L.lvl < 1) bad.push('level');
  const live = {};
  for (const s of Object.values(S.sessions)) {
    if (!PLAN[s.w]) bad.push('workout index'); if (!(s.ts > 0)) bad.push('ts');
    if (!s.end) { live[s.w] = (live[s.w] || 0) + 1; }
    for (const a of Object.values(s.sets || {})) for (const r of a || []) { if (!r) continue; if (r.kg != null && !(r.kg > 0 && r.kg <= 1000)) bad.push('kg ' + r.kg); if (r.reps != null && !(r.reps >= 1 && r.reps <= 200)) bad.push('reps ' + r.reps); if (r.done && r.reps == null) bad.push('done without reps'); }
  }
  for (const w of Object.keys(live)) if (live[w] > 1) bad.push('two running workouts of type ' + w);
  if (document.documentElement.scrollWidth > innerWidth + 1) bad.push('page wider than the screen');
  const sheet = document.querySelector('#sheet');
  if (sheet.hidden !== !S.sheet) bad.push('sheet state ' + S.sheet + ' hidden=' + sheet.hidden);
  if (OB.on === document.querySelector('#ob').hidden) bad.push('opening screens state');
  const lock = document.body.style.overflow === 'hidden', need = OB.on || (document.querySelector('#chat').classList.contains('open') && !matchMedia('(min-width:1000px)').matches);
  if (lock && !need) bad.push('page scroll is locked with nothing open');
  if (S.view === 'workout' && !document.querySelector('#app').classList.contains('pre-on') && exList(S.tab).length && !document.querySelector('#exList .ex.open')) bad.push('workout screen with no exercise');
  for (const k of Object.keys(S.cfg.slots)) if (!LIB[S.cfg.slots[k].a]) bad.push('slot with no movement');
  for (let w = 0; w < 4; w++) if (!planIds(w).length) bad.push('workout ' + w + ' has no exercises');
  return bad;
};
const seedFull = () => {
  const now = Date.now(), day = 864e5, ses = {}; let k = 0;
  for (let wk = 1; wk <= 3; wk++) for (let w = 0; w < 4; w++) {
    const ts = now - ((3 - wk) * 7 + (5 - w) * 1.5 + 1) * day, id = 'e' + (++k), sets = {}, fb = {};
    for (const e of PLAN[w].ex) { const kg = 40 + wk * 2.5; sets[e.id] = Array.from({ length: e.sets }, (_, i) => ({ kg, reps: 8 + (i ? 0 : 1), done: true, t: ts + i * 6e4, tk: kg, tr: 8 })); fb[e.id] = { pain: 0, pump: 2, load: 1 }; }
    ses[id] = { id, v: 3, w, ts, end: ts + 3e6, mt: ts, upd: ts, ft: ts, m: 'm1', wk, dl: 0, rir: rirFor(wk, 5), n: {}, mv: {}, sore: {}, cut: {}, fb, sets };
  }
  return ses;
};
(async () => {
  const b = await chromium.launch(); let failed = 0;
  let p0 = await (await b.newContext()).newPage(); await p0.goto(PREVIEW); await p0.waitForTimeout(400);
  const full = await p0.evaluate(seedFull); await p0.context().close();
  for (const run of [{ lang: 'he', w: 390, full: false }, { lang: 'en', w: 320, full: true }, { lang: 'he', w: 1100, full: true }, { lang: 'en', w: 390, full: false, fresh: true }]) {
    let seed = SEED0 * 7919 + run.w + (run.lang === 'en' ? 13 : 0);
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }, pick = (a) => a[Math.floor(rnd() * a.length)];
    const ctx = await b.newContext({ viewport: { width: run.w, height: run.w > 1000 ? 800 : 700 }, locale: run.lang === 'en' ? 'en-US' : 'he-IL', reducedMotion: 'reduce' }), p = await ctx.newPage();
    const errs = [], acts = [], seen = new Set();
    const W = { dkHit: 9, rtSkip: 4, homeGo: 5, preAll: 5, preDone: 4, obNext: 4, dkNext: 5, dkFinish: 3, finishBtn: 2, sheetClose: 3, chatOpen: 0.3, topCoach: 0.2, chatInput: 0.3, sendBtn: 0.5, chatClose: 4, obSkip: 0.5, resetBtn: 0.3, resetYes: 0.3, edDelYes: 0.4 };
    p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + String(e.stack || '').split('\n').slice(1, 3).join(' ')));
    p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
    p.on('dialog', (d) => d.dismiss().catch(() => {}));
    await p.addInitScript(initScript);
    await p.addInitScript((s) => { if (!localStorage.getItem('ul4:v1')) localStorage.setItem('ul4:v1', s); }, JSON.stringify({ sound: false, dirty: [], gone: [], sessions: run.full ? full : {}, cfg: { upd: 3, lang: run.lang, weeks: 5, me: run.fresh ? {} : { ob: 1, name: 'Mo' } } }));
    await p.goto(PREVIEW); await p.waitForTimeout(600);
    let why = '';
    for (let i = 0; i < STEPS && !why; i++) {
      const T = await p.evaluate(targets);
      if (!T.length) { await p.mouse.wheel(0, pick([-400, 400])); await p.waitForTimeout(40); acts.push('scroll'); continue; }
      /* some taps move a workout along and are worth more tries; the chat is a place to pass through, not to stay in */
      const wt = (t) => (W[t.id] != null ? W[t.id] : 1), sum = T.reduce((n, t) => n + wt(t), 0);
      let roll = rnd() * sum, t = T[0]; for (const c of T) { roll -= wt(c); if (roll <= 0) { t = c; break; } }
      const r = rnd(); seen.add(t.id);
      if (t.tag === 'SELECT') { acts.push('select ' + t.id); await p.evaluate(([x, y, k]) => { const el = document.elementFromPoint(x, y), s = el && (el.closest('select') || el.querySelector('select') || el); if (s && s.options) { s.selectedIndex = k % s.options.length; s.dispatchEvent(new Event('change', { bubbles: true })); } }, [t.x, t.y, Math.floor(rnd() * 50)]); }
      else if (t.tag === 'INPUT' || t.tag === 'TEXTAREA') {
        const v = pick(TYPED); acts.push('type ' + t.id + ' ' + JSON.stringify(v));
        await p.mouse.click(t.x, t.y); if (t.type !== 'date') { await p.keyboard.press('Control+A'); await p.keyboard.type(v); } await p.keyboard.press(pick(['Enter', 'Tab', 'Escape']));
      } else if (r < 0.04) { acts.push('back'); await p.evaluate(() => window.gymiBack()); }
      else if (r < 0.07) { acts.push('escape'); await p.keyboard.press('Escape'); }
      else if (r < 0.09) { const l = pick(['he', 'en']); acts.push('lang ' + l); await p.evaluate((x) => setLang(x), l); }
      else if (r < 0.11) { acts.push('double ' + t.id); await p.mouse.dblclick(t.x, t.y); }
      else { acts.push(t.id); await p.mouse.click(t.x, t.y); }
      await p.waitForTimeout(rnd() < 0.15 ? 260 : 35);
      if (errs.length) why = errs.join(' | ');
      else if (i % 12 === 11) { const bad = await p.evaluate(sane); if (bad.length) why = 'NOT SANE: ' + bad.join(', '); }
    }
    if (!why) { await p.waitForTimeout(900); const bad = await p.evaluate(sane); if (bad.length) why = 'NOT SANE: ' + bad.join(', '); else if (errs.length) why = errs.join(' | '); }
    const name = run.lang + ' ' + run.w + (run.full ? ' full log' : run.fresh ? ' first visit' : ' empty log');
    if (why) { failed++; console.log('FAIL ' + name + ' seed ' + SEED0 + ' after ' + acts.length + ' steps: ' + why + '\n  last: ' + acts.slice(-14).join(' > ')); }
    else console.log('ok   ' + name + ' · ' + acts.length + ' steps on ' + seen.size + ' different controls · ' + (await p.evaluate(() => { const P = meNow(); return P.T.wk + ' workouts finished, ' + P.T.sets + ' sets, level ' + P.L.lvl; })));
    if (process.env.ACTS) console.log('  ' + acts.join(' > '));
    await ctx.close();
  }
  await b.close();
  console.log(failed ? 'MONKEY FAIL ' + failed : 'MONKEY PASS');
  process.exit(failed ? 1 : 0);
})();
