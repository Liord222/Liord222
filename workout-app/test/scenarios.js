// Scenario checks that start from stored data: node test/scenarios.js  (needs playwright)
// An account from before mesocycles existed, the last deload of a mesocycle, the fresh mesocycle after it,
// backup and restore, and a long log whose oldest workouts move into the player's archive.
const { chromium } = require('playwright'), path = require('path');
const PREVIEW = 'file://' + require('./wrap.js'), SHOTS = process.env.SHOTS;
const snap = (pg, name, full) => (SHOTS ? pg.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: !!full }) : null);
const ok = [], bad = [], errs = [];
const check = (name, cond, info) => (cond ? ok : bad).push(name + (cond ? '' : ' -> ' + JSON.stringify(info)));
/* seeded copies have passed the opening screens, unless a scenario is about them (fresh: true) */
async function open(b, store, fresh, locale) {
  if (!fresh) { store = Object.assign({}, store); store.cfg = Object.assign({}, store.cfg); store.cfg.me = Object.assign({ ob: 1 }, store.cfg.me); }
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: locale || 'he-IL' }), p = await ctx.newPage();
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
  check('easy week: the running workout opens on its exercise, far from failure', (await p.evaluate(() => S.view + ':' + S.open)) === 'workout:lb1' && (await txt('.rx-chips')).includes('רחוק מכשל') && (await p.evaluate(() => findEx('lb1').sets)) === 3, [await txt('.rx-chips'), await p.evaluate(() => findEx('lb1').sets)]);
  await p.click('#listBtn'); await p.waitForTimeout(250);
  check('easy week: the list of exercises says so', (await txt('#mesoBtn')).includes('שבוע קל') && (await p.$$('#allList .ex')).length === 7, await txt('#mesoBtn'));
  await p.click('#finishBtn'); await p.waitForTimeout(500);
  const sheet = await txt('#sheet');
  check('finishing the last deload shows the mesocycle summary', sheet.includes('הסבב הושלם') && sheet.includes('שינוי כוח לפי תרגיל') && sheet.includes('לחיצת חזה בשיפוע עליון בסמית׳') && !sheet.includes('Incline') && sheet.includes('התרגילים שהגיבו הכי טוב') && sheet.includes('תחושה חזקה'), sheet.slice(0, 400));
  check('the round summary also shows what the workout earned', (await txt('#sheet .xp-line')).includes('+110') && (await txt('#sheet .xp-line')).includes('רמה'), await txt('#sheet .xp-line'));
  check('finishing every easy workout of a round is an achievement', (await p.evaluate(() => [S.cfg.me.badges.round > 0, S.cfg.me.badges.week > 0, roundsDone(Object.values(S.sessions))].join())) === 'true,true,1', await p.evaluate(() => JSON.stringify(S.cfg.me.badges)));
  await snap(p, 'h1-mesodone');
  const sm = await p.evaluate(() => { const r = mesoSummary('m1'); return { sets: r.sets, g: r.gains.map((x) => x.mv + ':' + x.pct.toFixed(1)), top: r.top.map((x) => x.mv) }; });
  check('summary numbers: weekly sets, strength change, best responders', sm.sets.start === 8 && sm.sets.peak === 8 && sm.g.length === 3 && sm.g.some((x) => x.startsWith('assistedPullup:') && !x.includes('-')) && sm.top.length === 3, sm);
  await p.click('#sheetClose'); await p.waitForTimeout(300);
  // ---- 3. the next workout opens mesocycle 2 ----
  check('after the deload: next workout is week 1 of mesocycle 2', (await p.evaluate(() => { const P = phaseNext(0); return [P.n, P.wk, P.rir].join(); })) === '2,1,3' && (await txt('#home .week h2')).includes('שבוע 1'), await txt('#home .week'));
  const t1 = await p.evaluate(() => { const e = findEx('ua1', null), t = targetOf(e, 0, null); return [t.kg, t.reps, t.mode, e.sets]; });
  check('new mesocycle starts further from failure, sets back to base', t1[2] === 'base' && t1[1] >= 6 && t1[1] <= 10 && t1[0] <= 62.5 && t1[3] === 3, t1);
  check('after the summary the app is back on today', (await p.evaluate(() => S.view)) === 'home' && (await txt('#home .next')).includes('גוף עליון A'), await txt('#home'));
  await p.click('#planBtn'); await p.waitForTimeout(300);
  check('mesocycle sheet between cycles offers the summary only', (await txt('.ms-act')).includes('סיכום סבב 1') && !(await p.$('#msDl')) && !(await p.$('#msNew')), await txt('.ms-act'));
  await p.click('#sheet [data-close]'); await p.waitForTimeout(200);
  await p.click('#homeGo'); await p.waitForTimeout(400); await p.click('#preAll'); await p.waitForTimeout(300); await p.click('#dkHit'); await p.waitForTimeout(600);
  const m2 = await p.evaluate(() => { const s = live(S.tab); return { cfg: S.cfg.meso.id, past: S.cfg.past.map((x) => x.id), m: s.m, wk: s.wk, rir: s.rir, dl: s.dl }; });
  check('starting it rolls the mesocycle over', m2.cfg === 'm2' && m2.past.join() === 'm1' && m2.m === 'm2' && m2.wk === 1 && m2.rir === 3 && m2.dl === 0, m2);
  await p.context().close();

  // ---- 4. backup and restore: the whole log moves to an empty copy of the app through one file ----
  /* the player in this copy: a character that was set up, and an archive of four workouts older than anything in the log */
  const me = { name: 'ליאור', look: { skin: 2, hair: 3, hc: 1, beard: 2, shirt: 4 }, made: 7, arch: { until: now - 100 * day, xp: 1000, wk: 4, sets: 60, prs: 3, kg: 30000, sw: 2, lw: 1 }, badges: { first: 5 } };
  /* the plan in this copy was changed: an added exercise in the second workout, and a workout that used it */
  const slots = { cabc12345: { w: 1, a: 'legExt', sets: 3, reps: '12–15', rest: [75, 75] } }, order = { 1: ['la1', 'cabc12345', 'la2', 'la3', 'la4', 'la5'] };
  const withAdded = Object.assign({}, ses, { cs1: Object.assign(mk('cs1', 1, 2 * day, 4, 0, 0, { cabc12345: [R(30, 12, now - 2 * day)], la1: [R(100, 8, now - 2 * day)] }), { o: order[1].slice() }) });
  p = await open(b, { sound: true, dirty: [], gone: [], sessions: withAdded, cfg: { upd: 9, weeks: 6, inc: { db: 2 }, swap: { ua5: 'inclineDb' }, notes: { hackSquat: 'מושב 4' }, base: { la5: { n: 4, t: 5 } }, slots, order, meso: { id: 'm1', n: 1, start: 0, early: 0 }, past: [], me } });
  const src = await p.evaluate(() => { const P = meNow(); return [P.T.xp, P.T.wk, P.L.lvl].join(); });
  const file = JSON.parse(await p.evaluate(() => backupData()));
  check('backup holds every workout, the settings and the player', file.app === 'gymi' && Object.keys(file.sessions).length === Object.keys(withAdded).length && file.cfg.weeks === 6 && file.cfg.me.name === 'ליאור' && file.cfg.me.arch.xp === 1000 && file.cfg.slots.cabc12345.a === 'legExt' && file.cfg.order[1].length === 6, Object.keys(file.sessions).length);
  await p.context().close();
  /* a file that was tampered with: text where numbers belong must not reach the page */
  file.sessions.evil = { id: 'evil', v: 3, w: 1, ts: now - 9 * day, end: now - 9 * day + 1e6, m: 'm1', wk: 1, n: { la1: '<img src=x onerror=alert(1)>' }, mv: { la1: '<b>x</b>' }, sets: { la1: [{ kg: '<img src=x>', reps: '<img src=x onerror=alert(1)>', done: true }, { kg: 50, reps: 8, done: true, t: now - 9 * day }] } };
  file.cfg.base.la1 = { n: '<img src=x onerror=alert(1)>', t: 1 };
  file.cfg.slots['bad id!'] = { w: 1, a: 'legExt', sets: 3, reps: '8–12', rest: [60, 60] }; file.cfg.slots.cevil0001 = { w: 1, a: '<img src=x>', sets: 3, reps: '8–12', rest: [60, 60] };
  file.cfg.order[1].push('cevil0001', '<img src=x>', 'ua1'); file.cfg.order[9] = ['la1'];
  p = await open(b, { sound: true, dirty: [], gone: [], sessions: {} }); txt = T(p);
  check('a fresh copy starts empty', (await p.evaluate(() => Object.keys(S.sessions).length)) === 0 && (await txt('#backup')).includes('שחזור מקובץ') && (await txt('#playerBtn')).includes('רמה 1'), await txt('#backup'));
  await p.click('#tabbar [data-view="progress"]'); await p.waitForTimeout(200);
  await p.setInputFiles('#restoreFile', { name: 'gymi-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(file)) }); await p.waitForTimeout(500);
  const got = await p.evaluate(() => ({ n: Object.keys(S.sessions).length, weeks: S.cfg.weeks, note: S.cfg.notes.hackSquat, swap: S.cfg.swap.ua5, base: S.cfg.base, evil: S.sessions.evil && S.sessions.evil.sets.la1.map((r) => [r.kg, r.reps, r.done]), evilN: S.sessions.evil && S.sessions.evil.n, evilMv: S.sessions.evil && S.sessions.evil.mv, img: document.querySelectorAll('img[src="x"]').length, fb: S.sessions.s01.fb.ua1 }));
  const pl = await p.evaluate(() => ({ slots: Object.keys(S.cfg.slots).join(), order: JSON.stringify(S.cfg.order), plan: planSlots(1).map((x) => x.a).join(), row: S.sessions.cs1 && S.sessions.cs1.sets.cabc12345 && S.sessions.cs1.sets.cabc12345[0].kg, o: S.sessions.cs1 && S.sessions.cs1.o.join(), list: exList(1, S.sessions.cs1).map((e) => e.mv).join() }));
  check('restore brings back the changed plan, and the workout that used the added exercise', pl.slots === 'cabc12345' && pl.order === '{"1":["la1","cabc12345","la2","la3","la4","la5"]}' && pl.plan === 'hackSquat,legExt,rdl,legPress,seatedLegCurl,standingCalf' && pl.row === 30 && pl.o === 'la1,cabc12345,la2,la3,la4,la5' && pl.list.startsWith('hackSquat,legExt'), pl);
  check('restore brings back the workouts and the settings', got.n === Object.keys(withAdded).length + 1 && got.weeks === 6 && got.note === 'מושב 4' && got.swap === 'inclineDb' && got.fb.pump === 2 && (await txt('#backup')).includes('אימונים שוחזרו') && (await txt('#history')).includes('גוף תחתון B'), [got.n, got.weeks, await txt('#backup')]);
  /* the tampered workout adds one finished workout of one set (110 points) to what the source copy had */
  const back = await p.evaluate(() => { const P = meNow(), m = S.cfg.me; return { xp: P.T.xp, wk: P.T.wk, name: m.name, look: m.look, made: m.made, first: m.badges.first, until: m.arch.until > 0 }; }), s0 = src.split(',').map(Number);
  check('restore brings the player back: character, archive and level', back.name === 'ליאור' && JSON.stringify(back.look) === JSON.stringify(me.look) && back.made === 7 && back.first === 5 && back.until && back.xp === s0[0] + 110 && back.wk === s0[1] + 1 && (await txt('#playerBtn')).includes('היי, ליאור'), [back, src]);
  check('restore keeps only numbers and known names from the file', got.img === 0 && JSON.stringify(got.evil) === '[[null,null,false],[50,8,true]]' && JSON.stringify(got.evilN) === '{}' && JSON.stringify(got.evilMv) === '{}' && got.base.la1 === undefined && got.base.la5.n === 4, got);
  await p.setInputFiles('#restoreFile', { name: 'gymi-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(file)) }); await p.waitForTimeout(400);
  check('restoring the same file again changes nothing', (await txt('#backup')).includes('אין בקובץ שום דבר חדש') && (await p.evaluate(() => Object.keys(S.sessions).length)) === got.n, await txt('#backup'));
  await p.setInputFiles('#restoreFile', { name: 'other.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') }); await p.waitForTimeout(300);
  check('a file that is not a gymi backup is refused', (await txt('#backup')).includes('זה לא קובץ גיבוי'), await txt('#backup'));
  /* a file whose player fields were tampered with: text is shown as text, unknown choices fall back to the defaults */
  const evil = { app: 'gymi', v: 1, at: now, sessions: {}, cfg: { upd: now + 1e6, weeks: 5, meso: { id: 'm1', n: 1 }, me: { name: '<img src=x onerror=alert(1)>', look: { skin: '<b>', hair: 99, hc: -1, beard: 1.5, shirt: 3 }, made: 5, arch: { until: '<i>', xp: -5, wk: 'a' }, badges: { first: '<u>', nope: 5 } } } };
  await p.setInputFiles('#restoreFile', { name: 'evil.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(evil)) }); await p.waitForTimeout(400);
  await p.click('#tabbar [data-view="profile"]'); await p.waitForTimeout(200);
  const ev = await p.evaluate(() => ({ me: S.cfg.me, img: document.querySelectorAll('img[src="x"]').length, name: document.querySelector('.pf-name').textContent }));
  check('player fields from a file are cleaned too', ev.img === 0 && ev.name === '<img src=x onerr' && JSON.stringify(ev.me.look) === '{"skin":1,"hair":1,"hc":0,"beard":0,"shirt":3}' && ev.me.arch.xp === 1000 && ev.me.badges.nope === undefined && ev.me.badges.first === 5, ev);
  await p.context().close();

  // ---- 5. a long log: workouts beyond the newest forty move into the archive, and the profile still counts them ----
  const long = {};
  for (let i = 0; i < 46; i++) { const ago = (140 - i * 3) * day, w = i % 4, id = ['ua1', 'la1', 'ub1', 'lb1'][w]; long['L' + i] = Object.assign(mk('L' + i, w, ago, 1 + (i >> 2) % 4, 0, 2, { [id]: [R(50, 8, now - ago), R(50, 8, now - ago)] }), { m: 'm' + (1 + (i >> 4)) }); }
  p = await open(b, { sound: true, dirty: [], gone: [], sessions: long }); txt = T(p);
  const A = await p.evaluate(() => { const P = meNow(), a = S.cfg.me.arch; return { until: a.until, awk: a.wk, axp: a.xp, wk: P.T.wk, xp: P.T.xp, sets: P.T.sets, lvl: P.L.lvl, badges: Object.keys(S.cfg.me.badges).sort().join(), streak: P.X.streak }; });
  check('the six oldest workouts were folded into the archive', A.until === long.L5.ts && A.awk === 6 && A.axp === 6 * 120, A);
  check('the profile still counts all of them', A.wk === 46 && A.sets === 92 && A.xp === 46 * 120 && A.lvl === (await p.evaluate(() => levelOf(5520).lvl)), A);
  check('achievements for a long log', A.badges === 'first,streak4,w10,w25,week' && A.streak >= 4, [A.badges, A.streak]);
  /* drop the archived workouts from the device, as happens once the log outgrows what is kept: nothing is lost */
  const kept = JSON.parse(await p.evaluate(() => { for (let i = 0; i < 6; i++) delete S.sessions['L' + i]; saveLocal(); return localStorage.getItem('ul4:v1'); }));
  await p.context().close();
  p = await open(b, kept); txt = T(p);
  const A2 = await p.evaluate(() => { const P = meNow(); return { n: Object.keys(S.sessions).length, wk: P.T.wk, xp: P.T.xp, lvl: P.L.lvl, week: !!S.cfg.me.badges.week }; });
  check('the level survives when the old workouts are gone from the device', A2.n === 40 && A2.wk === 46 && A2.xp === A.xp && A2.lvl === A.lvl && A2.week, A2);
  await p.click('#tabbar [data-view="profile"]'); await p.waitForTimeout(300); await snap(p, 'h5-profile-long', true);
  check('the profile page shows the long run', (await txt('.pf-stats')).startsWith('46 אימונים') && (await txt('#profile')).includes('רמה ' + A.lvl), await txt('.pf-stats'));
  /* a workout on the old side of the archive keeps its side when its date is edited, so it is neither counted twice nor lost */
  const moved = await p.evaluate(() => { const cut = S.cfg.me.arch.until, s = S.sessions.L6, d = new Date(Date.now() - 864e5), iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); S.edSid = 'L6'; editorDate(iso); const up = s.ts > cut; S.edSid = 'L6'; editorDate('2020-01-05'); return [up, s.ts > cut, meNow().T.wk].join(); });
  check('editing a date never crosses the archive line', moved === 'true,true,46', moved);
  await p.context().close();

  // ---- 6. a new player on an English phone: the opening screens in English, and a beginner's plan ----
  p = await open(b, { sound: true, dirty: [], gone: [], sessions: {} }, true, 'en-US'); txt = T(p);
  check('an English phone is met in English', (await p.isVisible('#ob')) && (await txt('#obTitle')) === 'Welcome to gymi' && (await p.evaluate(() => document.documentElement.dir)) === 'ltr' && (await p.getAttribute('#ob [data-lang="en"]', 'aria-pressed')) === 'true', await txt('#ob'));
  await p.click('#obNext'); await p.waitForTimeout(350); await p.fill('#obName', 'Sam'); await p.click('#obNext'); await p.waitForTimeout(350);
  await p.click('.ob-opt[data-v="0"]'); await p.click('#obNext'); await p.waitForTimeout(350);
  await p.click('.ob-opt[data-v="2"]'); await p.click('#obNext'); await p.waitForTimeout(350); await p.click('#obNext'); await p.waitForTimeout(500);
  await snap(p, 'h6-ready-en');
  check('the last screen is in English too', (await txt('#obTitle')) === 'Sam, you are all set!' && (await txt('#obNext')) === 'To the first workout' && !/[\u0590-\u05FF]/.test(await txt('#ob')), await txt('#ob'));
  await p.click('#obNext'); await p.waitForTimeout(400);
  const beg = await p.evaluate(() => ({ lang: S.cfg.lang, exp: S.cfg.me.exp, goal: S.cfg.me.goal, sets: [planned(0, {}).ua1, planned(0, {}).ua5, planned(1, {}).la1, planned(1, {}).la6].join(), tag: document.querySelector('#home .xp-tag').textContent, hidden: document.querySelector('#ob').hidden }));
  check('a beginner starts with one set less where there were three', beg.lang === 'en' && beg.exp === 0 && beg.goal === 2 && beg.sets === '2,2,2,2' && beg.tag === '+260' && beg.hidden, beg);
  /* the next visit starts from what this one kept (a new copy with the same storage: a reload right after a save can come too early for the test browser) */
  const keptEn = JSON.parse(await p.evaluate(() => localStorage.getItem('ul4:v1')));
  await p.context().close();
  p = await open(b, keptEn, true, 'en-US'); txt = T(p);
  check('the opening screens do not come back, and the language stays', (await p.isHidden('#ob')) && (await p.evaluate(() => LANG + ':' + document.documentElement.dir)) === 'en:ltr', await p.evaluate(() => LANG));
  await p.context().close();
  /* a copy that already has workouts, from before the opening screens existed: they are shown once, in Hebrew, and nothing in the plan changes */
  p = await open(b, { sound: true, dirty: [], gone: [], sessions: { s01: ses.s01 }, cfg: { upd: 3, weeks: 5, me: { name: 'ליאור', made: 4 } } }, true, 'en-US'); txt = T(p);
  check('an existing player sees the opening screens once, in the language the app always had', (await p.isVisible('#ob')) && (await txt('#obTitle')) === 'ברוכים הבאים ל-gymi', await txt('#obTitle'));
  await p.click('#obNext'); await p.waitForTimeout(350);
  check('with the name already there', (await p.inputValue('#obName')) === 'ליאור', await p.inputValue('#obName'));
  await p.click('#obNext'); await p.waitForTimeout(350); await p.click('.ob-opt[data-v="0"]'); await p.click('#obNext'); await p.waitForTimeout(350); await p.click('.ob-opt[data-v="0"]'); await p.click('#obNext'); await p.waitForTimeout(350); await p.click('#obNext'); await p.waitForTimeout(450);
  check('and is sent on, not to a "first" workout', (await txt('#obNext')) === 'קדימה', await txt('#obNext'));
  await p.click('#obNext'); await p.waitForTimeout(400);
  check('a plan that was already trained is left as it is', (await p.evaluate(() => [S.cfg.me.exp, planned(0, {}).ua1, Object.keys(S.cfg.base).length, S.cfg.lang].join())) === '0,3,0,he', await p.evaluate(() => JSON.stringify(S.cfg.base)));
  await p.context().close();

  // ---- 7. numbers at the edges: nothing typed, pasted, restored or written by the coach may leave an absurd set in the log ----
  p = await open(b, { sound: false, dirty: [], gone: [], sessions: {}, cfg: { upd: 3, weeks: 5 } }); txt = T(p);
  await p.click('#homeGo'); await p.waitForTimeout(350);
  await p.click('#dkKg'); await p.fill('#dkKgIn', '100000'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  await p.click('#dkReps'); await p.fill('#dkRepsIn', '5000'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  check('the bar caps a weight and a rep count that cannot be real', (await p.evaluate(() => document.querySelector('#dkKg b').textContent + '|' + document.querySelector('#dkReps b').textContent)) === '1000|200', [await txt('#dkKg'), await txt('#dkReps')]);
  await p.click('#dkKg'); await p.fill('#dkKgIn', '62,5'); await p.keyboard.press('Enter'); await p.click('#dkReps'); await p.fill('#dkRepsIn', '8'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  await p.click('#dkHit'); await p.waitForTimeout(500);
  check('a comma is read as a decimal point', (await p.evaluate(() => { const r = live(0).sets.ua1[0]; return r.kg + 'x' + r.reps; })) === '62.5x8', await p.evaluate(() => JSON.stringify(live(0).sets.ua1)));
  /* the coach writes sets through a line in his answer: only real numbers get in, and nothing valid means nothing happens */
  const logged = await p.evaluate(() => {
    const out = {}, before = Object.keys(S.sessions).length;
    out.none = applyLog('@@LOG {"ex":"la1","sets":[["abc",8],[50,"x"],[50,0],[50,-3],[2000,5]]}');
    out.started = Object.keys(S.sessions).length - before;
    const r = applyLog('@@LOG {"ex":"ua2","sets":[[-5,8],[0,9],["40",8],[40.25,7.6],[40,8],[40,8]]}');
    out.idx = r && r.idx.join(); out.rows = live(0).sets.ua2.map((x) => (x.kg == null ? '-' : x.kg) + 'x' + x.reps).join();
    out.bad = [applyLog('@@LOG {"ex":"nope","sets":[[40,8]]}'), applyLog('@@LOG {"ex":"ua2","sets":"all"}'), applyLog('@@LOG not json'), applyLog('no line here')].join();
    return out;
  });
  check('a line from the coach with nothing real in it writes nothing and starts no workout', logged.none === null && logged.started === 0, logged);
  check('a set with a weight that is no weight is left out, zero means no weight, and the rest is written in order', logged.idx === '0,1,2' && logged.rows === '-x9,40x8,40.25x8', logged);
  check('a line that names no exercise or holds no sets is ignored', logged.bad === ',,,', logged.bad);
  await p.click('#listBtn'); await p.waitForTimeout(250); await p.click('#finishBtn'); await p.waitForTimeout(500); await p.click('#sheetClose'); await p.waitForTimeout(250);
  await p.click('#tabbar [data-view="progress"]'); await p.waitForTimeout(250); await p.click('#history [data-edit]'); await p.waitForTimeout(300);
  await p.fill('#sheet .ed-row[data-ex="ua1"][data-i="0"] [data-k="kg"]', '99999'); await p.fill('#sheet .ed-row[data-ex="ua1"][data-i="0"] [data-k="reps"]', '9999'); await p.waitForTimeout(150);
  check('fixing a finished workout caps the numbers the same way', (await p.evaluate(() => { const r = Object.values(S.sessions)[0].sets.ua1[0]; return r.kg + 'x' + r.reps; })) === '1000x200', await p.evaluate(() => JSON.stringify(Object.values(S.sessions)[0].sets.ua1)));
  await p.click('#sheetClose'); await p.waitForTimeout(200);
  const rest = await p.evaluate(() => {
    const now = Date.now(), row = (kg, reps) => ({ kg, reps, done: true, t: now - 9e7 });
    restoreData(JSON.stringify({ app: 'gymi', v: 1, at: now, sessions: { zz1: { id: 'zz1', v: 3, w: 1, ts: now - 9e7, end: now - 8.9e7, sets: { la1: [row(1e12, 8), row(80, 1e9), row(80, 8.4), row(-4, 8), row('80', 8)] } } } }));
    return S.sessions.zz1.sets.la1.map((x) => (x.kg == null ? '-' : x.kg) + 'x' + x.reps).join();
  });
  check('a restored file cannot bring absurd numbers in', rest === '1000x8,80x200,80x8,-x8,-x8', rest);
  check('and the profile still adds up to a number', (await p.evaluate(() => { const P = meNow(); return [P.T.kg, P.T.xp, P.L.lvl].every((x) => Number.isFinite(x)); })), await p.evaluate(() => JSON.stringify(meNow().T)));
  await p.context().close();

  // ---- 8. "two days ago" stays two days when the clocks moved in between (a 23-hour day) ----
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'he-IL', timezoneId: 'America/New_York' }), q = await ctx.newPage();
    q.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    await q.clock.install({ time: new Date('2026-03-09T09:00:00-04:00') });
    await q.addInitScript((s) => { if (!localStorage.getItem('ul4:v1')) localStorage.setItem('ul4:v1', s); }, JSON.stringify({ sound: false, dirty: [], gone: [], sessions: {}, cfg: { upd: 3, me: { ob: 1 } } }));
    await q.goto(PREVIEW); await q.waitForTimeout(500);
    const days = await q.evaluate(() => { const at = (iso) => new Date(iso).getTime(); const he = [ago(at('2026-03-09T01:00:00-04:00')), ago(at('2026-03-08T23:00:00-04:00')), ago(at('2026-03-07T12:00:00-05:00')), ago(at('2026-03-04T12:00:00-05:00'))]; setLang('en'); return he.concat([ago(at('2026-03-07T12:00:00-05:00')), ago(at('2026-03-08T12:00:00-04:00'))]).join(' | '); });
    check('days are counted by the calendar, also across a clock change', days === 'היום | אתמול | לפני יומיים | לפני 5 ימים | 2 days ago | yesterday', days);
    await ctx.close();
  }

  // ---- 10. choices made by hand are not undone by something else ----
  p = await open(b, { sound: false, dirty: [], gone: [], sessions: {}, cfg: { upd: 3, weeks: 5 } }); txt = T(p);
  const byHand = await p.evaluate(() => {
    const n = () => [planned(0, {}).ua1, planned(0, {}).ua2, planned(0, {}).ua5].join();
    setBase('ua1', 5); const out = [n()];
    for (const exp of [1, 0, 2]) { S.cfg.me.exp = exp; applyExp(); out.push(n()); }
    return out.join(' | ');
  });
  check('a set count chosen by hand survives every change of experience', byHand === '5,3,2 | 5,3,2 | 5,2,2 | 5,3,2', byHand);
  await p.click('#tabbar [data-view="profile"]'); await p.waitForTimeout(250); await p.click('#lookBtn'); await p.waitForTimeout(250);
  await p.click('#lkName'); await p.keyboard.type('נועה'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  check('a name typed in the character sheet is kept when the sheet is closed with Escape', (await p.evaluate(() => S.cfg.me.name)) === 'נועה' && (await txt('.pf-name')) === 'נועה' && JSON.parse(await p.evaluate(() => localStorage.getItem('ul4:v1'))).cfg.me.name === 'נועה', await p.evaluate(() => S.cfg.me.name));
  await p.context().close();

  // ---- 11. the second tap of a double tap on "set done" lands where the timer's buttons have just appeared ----
  p = await open(b, { sound: false, dirty: [], gone: [], sessions: {}, cfg: { upd: 3, weeks: 5 } }); txt = T(p);
  await p.click('#homeGo'); await p.waitForTimeout(350);
  await p.click('#dkHit'); await p.waitForSelector('#rtSkip'); await p.click('#rtSkip'); await p.waitForTimeout(100);
  check('a double tap on "set done" logs one set and does not skip the rest', (await p.evaluate(() => rest.on + ':' + live(0).sets.ua1.filter((r) => r && r.done).length)) === 'true:1', await p.evaluate(() => rest.on));
  await p.waitForTimeout(500); await p.click('#rtSkip'); await p.waitForTimeout(150);
  check('a tap a moment later does skip it', (await p.evaluate(() => rest.on)) === false, 'rest');
  await p.context().close();

  // ---- 12. a long log: the account keeps every workout, the page asks only for the newest 60. Older ones are not sent again on every visit ----
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'he-IL' }), q = await ctx.newPage();
    q.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    const all = {};
    for (let i = 1; i <= 70; i++) { const ts = now - (80 - i) * day; all['K' + i] = { id: 'K' + i, v: 3, w: i % 4, ts, end: ts + 3e6, mt: ts, upd: ts, ft: ts, m: 'm1', wk: 1, dl: 0, rir: 3, n: {}, mv: {}, sore: {}, cut: {}, fb: {}, sets: { [['ua1', 'la1', 'ub1', 'lb1'][i % 4]]: [{ kg: 50, reps: 8, done: true, t: ts }] } }; }
    /* one more workout that only this device has (it was never sent), newer than anything in the account */
    const local = Object.assign({}, all, { Knew: Object.assign({}, all.K70, { id: 'Knew', ts: now - 3e7, end: now - 2.7e7, upd: now - 2.7e7 }) });
    await q.addInitScript(([store, cloud]) => {
      if (!localStorage.getItem('ul4:v1')) localStorage.setItem('ul4:v1', store);
      window.__sets = [];
      const docs = JSON.parse(cloud).sort((a, b2) => b2.ts - a.ts);
      const col = { orderBy() { return col; }, limit() { return col; },
        doc: (id) => ({ async set() { window.__sets.push(id); }, async delete() { window.__sets.push('del:' + id); }, onSnapshot(next) { setTimeout(() => next({ id, exists: false, data: () => undefined }), 5); return () => {}; } }),
        onSnapshot(next) { setTimeout(() => next({ docChanges: () => docs.slice(0, 60).map((d) => ({ type: 'added', doc: { id: d.id, data: () => d } })) }), 5); return () => {}; } };
      window.claude = { use: async (n) => (n === 'user' ? { id: async () => 'u1' } : n === 'db' ? { collection: () => col } : null) };
    }, [JSON.stringify({ sound: false, dirty: [], gone: [], sessions: local, cfg: { upd: 3, me: { ob: 1 } } }), JSON.stringify(Object.values(all))]);
    await q.goto(PREVIEW); await q.waitForTimeout(2500);
    const sent = (await q.evaluate(() => window.__sets)).filter((x) => x !== 'cfg');
    check('workouts older than what the account sent are not written to it again on every visit', sent.filter((x) => x !== 'Knew').length === 0, sent);
    check('a workout the account has not seen is still sent', sent.includes('Knew'), sent);
    check('and the whole log is still on the device', (await q.evaluate(() => Object.keys(S.sessions).length)) === 71, await q.evaluate(() => Object.keys(S.sessions).length));
    await ctx.close();
  }

  // ---- 13. while a sheet is open it is the only thing in reach, for the keyboard and for a screen reader ----
  p = await open(b, { sound: false, dirty: [], gone: [], sessions: {}, cfg: { upd: 3, weeks: 5 } }); txt = T(p);
  const reach = () => p.evaluate(() => ({ inSheet: document.querySelector('#sheet').contains(document.activeElement), at: document.activeElement && document.activeElement.id, behind: [document.querySelector('.brand').inert, document.querySelector('.cols').inert, document.querySelector('#dock').inert].join() }));
  check('with nothing open the page is in reach', (await reach()).behind === 'false,false,false', await reach());
  await p.focus('#planBtn'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  check('an open sheet takes the focus, and the page behind it is out of reach', (await reach()).inSheet && (await reach()).behind === 'true,true,true', await reach());
  for (let i = 0; i < 40; i++) await p.keyboard.press('Tab');
  check('Tab does not leave the sheet', (await reach()).inSheet, await reach());
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  check('closing it gives the page back, with the focus on what opened it', (await reach()).at === 'planBtn' && (await reach()).behind === 'false,false,false', await reach());
  await p.click('#tabbar [data-view="profile"]'); await p.waitForTimeout(200); await p.click('#obAgain'); await p.waitForTimeout(300);
  check('the opening screens take the page the same way', (await p.evaluate(() => document.querySelector('#ob').contains(document.activeElement))) && (await reach()).behind === 'true,true,true', await reach());
  await p.click('#obSkip'); await p.waitForTimeout(300);
  check('and give it back', (await reach()).behind === 'false,false,false', await reach());
  await p.context().close();

  // ---- 9. a narrow phone (320 px), in English, where the words are longest: nothing may reach past the screen ----
  {
    const ctx = await b.newContext({ viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, locale: 'en-US' }), q = await ctx.newPage();
    q.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    await q.addInitScript((s) => { if (!localStorage.getItem('ul4:v1')) localStorage.setItem('ul4:v1', s); }, JSON.stringify({ sound: false, dirty: [], gone: [], sessions: {}, cfg: { upd: 3, lang: 'en', me: { ob: 1, name: 'Maximilian-Alex' } } }));
    await q.goto(PREVIEW); await q.waitForTimeout(600);
    /* everything visible inside the bar at the bottom, and the page itself, against the width of the screen */
    const past = () => q.evaluate(() => { const out = []; if (document.documentElement.scrollWidth > innerWidth + 1) out.push('page'); for (const el of document.querySelectorAll('#dock *, #exList .ex.open *')) { const r = el.getBoundingClientRect(); if (r.width && r.height && !el.closest('canvas,svg,.tempo') && (r.right > innerWidth + 1 || r.left < -1)) out.push(el.tagName + '.' + el.className); } return out.slice(0, 5); });
    await q.click('#homeGo'); await q.waitForTimeout(350);
    check('narrow phone: the exercise and the bar fit the screen', (await past()).length === 0, await past());
    await q.click('#dkHit'); await q.waitForTimeout(500);
    check('narrow phone: the rest timer fits', (await past()).length === 0 && (await q.isVisible('#rtUndo')), await past());
    await q.click('#rtSkip'); await q.waitForTimeout(200); await q.click('.ex.open .same'); await q.waitForTimeout(450);
    check('narrow phone: the questions after an exercise fit, with their Skip in reach', (await past()).length === 0 && (await q.evaluate(() => { const r = document.querySelector('#fbSkip').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })), await past());
    await q.click('#dock [data-fb="pain"][data-v="2"]'); await q.waitForTimeout(300);
    check('narrow phone: a pain report fits too', (await past()).length === 0, await past());
    await snap(q, 'h9-narrow-pain');
    /* a text link is easy to hit: its tap area is larger than its letters */
    const tapH = await q.evaluate(() => { const b = document.querySelector('#fbSkip'), a = getComputedStyle(b, '::after'), r = b.getBoundingClientRect(); return r.height - parseFloat(a.top) - parseFloat(a.bottom); });
    check('a text link has a tap area of a finger\'s size', tapH >= 44, tapH);
    await ctx.close();
  }
  console.log('PASS ' + ok.length); console.log('FAIL ' + bad.length + (bad.length ? ':\n  ' + bad.join('\n  ') : '')); console.log('ERRORS: ' + (errs.join(' | ') || 'none'));
  await b.close();
})().catch((e) => { console.log('PASS ' + ok.length, 'FAIL', bad); console.log('CRASH', e.message.split('\n').slice(0, 5).join('\n')); process.exit(1); });
