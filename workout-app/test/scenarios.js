// Scenario checks that start from stored data: node test/scenarios.js  (needs playwright)
// An account from before mesocycles existed, the last deload of a mesocycle, and the fresh mesocycle after it.
const { chromium } = require('playwright'), path = require('path');
const PREVIEW = 'file://' + require('./wrap.js'), SHOTS = process.env.SHOTS;
const snap = (pg, name, full) => (SHOTS ? pg.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: !!full }) : null);
const ok = [], bad = [], errs = [];
const check = (name, cond, info) => (cond ? ok : bad).push(name + (cond ? '' : ' -> ' + JSON.stringify(info)));
async function open(b, store) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }), p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.addInitScript((s) => { if (!localStorage.getItem('ul4:v1')) localStorage.setItem('ul4:v1', s); }, JSON.stringify(store));
  await p.goto(PREVIEW); await p.waitForTimeout(700);
  return p;
}
const T = (p) => (sel) => p.evaluate((s) => (document.querySelector(s) || { innerText: '' }).innerText.replace(/\n/g, ' '), sel);
(async () => {
  const b = await chromium.launch(), day = 864e5, now = Date.now();
  // ---- 1. data saved by the previous version: no mesocycle fields at all, one finished and one running workout ----
  const old = { sound: true, dirty: [], gone: [], sessions: {
    smwdg4s9ew2: { id: 'smwdg4s9ew2', v: 1, w: 2, ts: now - 5 * day, end: now - 5 * day + 3e6, upd: now - 5 * day, sets: { ub8: [{ kg: 8, reps: 12, done: true, t: now - 5 * day }, { kg: 8, reps: 12, done: true, t: now - 5 * day }] } },
    sliveold: { id: 'sliveold', v: 2, w: 3, ts: now - 6e5, end: 0, upd: now - 6e4, sets: { lb1: [{ kg: 90, reps: 9, done: true, t: now - 6e4 }] } } } };
  let p = await open(b, old), txt = T(p);
  const up = await p.evaluate(() => { const s = S.sessions.sliveold, o = S.sessions.smwdg4s9ew2, e = findEx('ub8', null), t = targetOf(e, 0, null); return { m: s.m, wk: s.wk, rir: s.rir, n: s.n && s.n.lb1, rows: s.sets.lb1.length, oldM: o.m === undefined, oldRows: o.sets.ub8.length, tab: S.tab, t: t && [t.kg, t.reps, t.mode] }; });
  check('old data: the running workout joins mesocycle 1, week 1', up.m === 'm1' && up.wk === 1 && up.rir === 3 && up.n === 3 && up.rows === 1 && up.tab === 3, up);
  check('old data: the finished workout is untouched and still feeds targets', up.oldM && up.oldRows === 2 && JSON.stringify(up.t) === '[8,13,"reps"]', up);
  check('old data: the running workout shows its target for the next set', (await txt('.dk-set')).includes('2') && (await txt('#dkKg')).startsWith('90') && !!(await p.$('#dkHit')), [await txt('.dk-set'), await txt('#dkKg')]);
  await p.click('#dkHit'); await p.waitForTimeout(500);
  check('old data: logging still works', (await p.evaluate(() => S.sessions.sliveold.sets.lb1.filter((r) => r && r.done).length)) === 2, 'rows');
  await p.context().close();

  // ---- 2. the last deload workout of a mesocycle ----
  const R = (kg, reps, t) => ({ kg, reps, done: true, t, tk: kg, tr: reps });
  const mk = (id, w, ago, wk, dl, rir, sets, fb) => ({ id, v: 3, w, ts: now - ago, end: now - ago + 3e6, mt: now - ago, upd: now - ago, ft: now - ago, m: 'm1', wk, dl, rir, n: {}, mv: {}, sore: {}, cut: {}, fb: fb || {}, sets });
  const ses = {};
  [[0, { ua1: [60, 8] }], [1, { la1: [100, 8] }], [2, { ub1: [40, 8] }], [3, { lb1: [90, 8] }]].forEach(([w, ex], k) => {
    const id = Object.keys(ex)[0], kg = ex[id][0];
    for (let wk = 1; wk <= 4; wk++) { const ago = (40 - wk * 7 - k) * day, kk = w === 2 ? kg - (wk - 1) * 5 : kg + (wk > 2 ? 2.5 : 0); ses['s' + w + wk] = mk('s' + w + wk, w, ago, wk, 0, 4 - wk, { [id]: [R(kk, 8 + (wk % 2), now - ago), R(kk, 8, now - ago)] }, { [id]: { pain: 0, pump: 2, load: 1 } }); }
    if (w < 3) ses['d' + w] = mk('d' + w, w, (4 - k) * day, 5, 1, 4, { [id]: [R(kg * 0.85, 8, now - (4 - k) * day)] });
  });
  ses.dlive = Object.assign(mk('dlive', 3, 6e5, 5, 1, 4, { lb1: [R(77.5, 8, now - 6e4)] }), { end: 0, upd: now - 6e4 });
  p = await open(b, { sound: true, dirty: [], gone: [], sessions: ses, cfg: { upd: 5, weeks: 5, inc: {}, swap: {}, notes: {}, base: {}, meso: { id: 'm1', n: 1, start: 0, early: 0 }, past: [] } }); txt = T(p);
  check('deload workout: hero and halved sets', (await txt('#mesoBtn')).includes('דילואד') && (await p.evaluate(() => findEx('lb1').sets)) === 3, [await txt('#mesoBtn'), await p.evaluate(() => findEx('lb1').sets)]);
  await p.click('#finishBtn'); await p.waitForTimeout(500);
  const sheet = await txt('#sheet');
  check('finishing the last deload shows the mesocycle summary', sheet.includes('המזוציקל הושלם') && sheet.includes('שינוי כוח לפי תרגיל') && sheet.includes('Incline Smith Machine Press') && sheet.includes('התרגילים שהגיבו הכי טוב') && sheet.includes('פאמפ חזק'), sheet.slice(0, 400));
  await snap(p, 'h1-mesodone');
  const sm = await p.evaluate(() => { const r = mesoSummary('m1'); return { sets: r.sets, g: r.gains.map((x) => x.mv + ':' + x.pct.toFixed(1)), top: r.top.map((x) => x.mv) }; });
  check('summary numbers: weekly sets, strength change, best responders', sm.sets.start === 8 && sm.sets.peak === 8 && sm.g.length === 3 && sm.g.some((x) => x.startsWith('assistedPullup:') && !x.includes('-')) && sm.top.length === 3, sm);
  await p.click('#sheetClose'); await p.waitForTimeout(300);
  // ---- 3. the next workout opens mesocycle 2 ----
  check('after the deload: next workout is week 1 of mesocycle 2', (await txt('#mesoBtn')).includes('מזוציקל 2') && (await txt('#mesoBtn')).includes('שבוע 1 מתוך 5') && (await txt('#mesoBtn')).includes('3 חזרות לפני כשל'), await txt('#mesoBtn'));
  const t1 = await p.evaluate(() => { const e = findEx('ua1', null), t = targetOf(e, 0, null); return [t.kg, t.reps, t.mode, e.sets]; });
  check('new mesocycle starts further from failure, sets back to base', t1[2] === 'base' && t1[1] >= 6 && t1[1] <= 10 && t1[0] <= 62.5 && t1[3] === 3, t1);
  await p.click('#mesoBtn'); await p.waitForTimeout(300);
  check('mesocycle sheet between cycles offers the summary only', (await txt('.ms-act')).includes('סיכום מזוציקל 1') && !(await p.$('#msDl')) && !(await p.$('#msNew')), await txt('.ms-act'));
  await p.click('#sheet [data-close]'); await p.waitForTimeout(200);
  await p.click('#dkStart'); await p.waitForTimeout(500);
  const m2 = await p.evaluate(() => { const s = live(S.tab); return { cfg: S.cfg.meso.id, past: S.cfg.past.map((x) => x.id), m: s.m, wk: s.wk, rir: s.rir, dl: s.dl }; });
  check('starting it rolls the mesocycle over', m2.cfg === 'm2' && m2.past.join() === 'm1' && m2.m === 'm2' && m2.wk === 1 && m2.rir === 3 && m2.dl === 0, m2);
  await p.context().close();
  console.log('PASS ' + ok.length); console.log('FAIL ' + bad.length + (bad.length ? ':\n  ' + bad.join('\n  ') : '')); console.log('ERRORS: ' + (errs.join(' | ') || 'none'));
  await b.close();
})().catch((e) => { console.log('PASS ' + ok.length, 'FAIL', bad); console.log('CRASH', e.message.split('\n').slice(0, 5).join('\n')); process.exit(1); });
