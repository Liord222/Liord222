// End-to-end check in a real browser with a fake Claude runtime: node test/e2e.js [light|dark]  (needs playwright; SHOTS=dir saves screenshots)
// The fake database lives in this Node process, so a second browser context behaves like a second device on the same account.
const { chromium } = require('playwright'), path = require('path');
const PREVIEW = 'file://' + require('./wrap.js'), SHOTS = process.env.SHOTS;
const snap = (pg, name, full) => (SHOTS ? pg.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: !!full }) : null);
const cloud = {};
const initScript = () => {
  const docs = {}, subs = [], dsubs = []; window.__docs = docs; window.__calls = []; window.__saved = [];
  const snapDoc = (k) => ({ id: k.split('/').pop(), exists: k in docs, data: () => (k in docs ? JSON.parse(JSON.stringify(docs[k])) : undefined), metadata: { fromCache: false, hasPendingWrites: false } });
  const emit = (type, k, old) => {
    subs.forEach((s) => { if (k.startsWith(s.path + '/')) s.next({ docs: [], metadata: { fromCache: false }, docChanges: () => [{ type, doc: type === 'removed' ? { id: k.split('/').pop(), exists: true, data: () => old } : snapDoc(k) }] }); });
    dsubs.forEach((s) => { if (s.k === k) s.next(snapDoc(k)); });
  };
  window.__remote = (k, json) => { const had = k in docs; docs[k] = JSON.parse(json); emit(had ? 'modified' : 'added', k); };
  const mkDoc = (path) => ({
    id: path.split('/').pop(), path,
    async set(d) { const had = path in docs; docs[path] = JSON.parse(JSON.stringify(d)); await window.__cloudSet(path, JSON.stringify(d)); setTimeout(() => emit(had ? 'modified' : 'added', path), 5); },
    async delete() { const old = docs[path]; delete docs[path]; await window.__cloudSet(path, null); window.__deleted = (window.__deleted || 0) + 1; setTimeout(() => emit('removed', path, old), 5); },
    onSnapshot(next) { dsubs.push({ k: path, next }); window.__cloudAll().then((json) => { Object.assign(docs, JSON.parse(json)); next(snapDoc(path)); }); return () => {}; },
  });
  const mkCol = (path) => {
    const q = {
      path, where() { return q; }, orderBy() { return q; }, limit() { return q; }, doc: (id) => mkDoc(path + '/' + id),
      onSnapshot(next) {
        subs.push({ path, next });
        window.__cloudAll().then((json) => { Object.assign(docs, JSON.parse(json)); const ks = Object.keys(docs).filter((k) => k.startsWith(path + '/')); next({ docs: ks.map(snapDoc), metadata: { fromCache: false }, docChanges: () => ks.map((k) => ({ type: 'added', doc: snapDoc(k) })) }); });
        return () => {};
      },
    };
    return q;
  };
  const sample = async (input, opts) => {
    const last = input[input.length - 1].content;
    window.__calls.push({ turns: input.length, first: input[0].content, last, hasImg: !!(opts && opts.images) });
    const full = /רשום/.test(last) ? 'רשמתי לך שלושה סטים במתח.\n@@LOG {"ex":"ua2","sets":[[40,8],[40,8],[40,7]]}' : 'פסיקה: מתאים חלקית\nבתמונה: מכונת לחיצת חזה בישיבה.\n• אותה קבוצת שרירים, פחות דגש על החזה העליון\n• שמור על **3 סטים × 6–10** ומנוחה של 2–3 דק׳';
    let acc = ''; for (const ch of full.match(/[\s\S]{1,16}/g)) { await new Promise((r) => setTimeout(r, 25)); acc += ch; opts.onText({ text: acc, delta: ch }); }
    return { text: full, truncated: false, modelTierApplied: 'default' };
  };
  sample.limits = async () => ({ maxPromptBytes: 262144, images: { maxCount: 4, maxInputBytes: 2e7, mediaTypes: ['image/jpeg', 'image/png'] } });
  window.claude = { use: async (n) => (n === 'sample' ? sample : n === 'db' ? { doc: mkDoc, collection: mkCol } : n === 'user' ? { id: async () => 'u_test' } : n === 'downloads' ? { save: async (r) => { window.__saved.push(r.filename + ':' + r.data.length); return { status: 'saved' }; } } : null) };
};
const pages = [];
async function device(b, scheme) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme });
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + String(e.stack || '').split('\n').slice(1, 3).join(' ')));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.exposeFunction('__cloudSet', (k, v) => {
    if (v === null) delete cloud[k]; else cloud[k] = JSON.parse(v);
    if (v !== null) for (const o of pages) if (o !== p) o.evaluate(([kk, vv]) => window.__remote && window.__remote(kk, vv), [k, v]).catch(() => {});
  });
  await p.exposeFunction('__cloudAll', () => JSON.stringify(cloud));
  await p.addInitScript(initScript);
  await p.goto(PREVIEW); await p.waitForTimeout(900);
  pages.push(p);
  return { p, errs };
}
const ok = [], bad = [], ERR = [];
const report = () => { if (process.env.LIST) console.log(ok.join('\n')); console.log('PASS ' + ok.length); console.log('FAIL ' + bad.length + (bad.length ? ':\n  ' + bad.join('\n  ') : '')); console.log('ERRORS: ' + (ERR.map((e) => e.join(' | ')).filter(Boolean).join(' | ') || 'none')); };
const sess = () => Object.keys(cloud).filter((k) => typeof cloud[k].w === 'number').map((k) => cloud[k]);
(async () => {
  const scheme = process.argv[2] || 'light', b = await chromium.launch(), A = await device(b, scheme), p = A.p; ERR.push(A.errs);
  const check = (name, cond, info) => (cond ? ok : bad).push(name + (cond ? '' : ' -> ' + JSON.stringify(info)));
  const T = (pg) => (sel) => pg.evaluate((s) => (document.querySelector(s) || { innerText: '' }).innerText.replace(/\n/g, ' '), sel);
  const txt = T(p), shot = (n, pg) => snap(pg || p, n);
  /* the stop on the week's path that is next or running: its spoken label carries the full workout name and its state */
  const cur = (pg) => pg.getAttribute('.tab[aria-current="true"]', 'aria-label');
  /* the workout screen shows one exercise: the list of all of them is a sheet, and so is finishing early */
  const list = async (pg) => { await pg.click('#listBtn'); await pg.waitForTimeout(250); };
  const go = async (pg, id) => { await list(pg); await pg.click('#allList .ex[data-id="' + id + '"] .ex-head'); await pg.waitForTimeout(350); };
  const finish = async (pg) => { await list(pg); await pg.click('#finishBtn'); };
  const pane = async (pg, k) => { await pg.click('.fx-tabs [data-fx="' + k + '"]'); await pg.waitForTimeout(150); };
  const tally2 = (pg) => pg.evaluate(() => { const t = totals(); return t.dn + '/' + t.total; });
  // the dock: type the reps, then one tap logs the set
  const reps = async (pg, n) => { await pg.click('#dkReps'); await pg.fill('#dkRepsIn', String(n)); await pg.keyboard.press('Enter'); await pg.waitForTimeout(120); };
  const log = async (pg, n) => { await reps(pg, n); await pg.click('#dkHit'); };
  const tab = async (pg, v) => { await pg.click('#tabbar [data-view="' + v + '"]'); await pg.waitForTimeout(250); };

  // ---------- first workout, nothing logged before ----------
  check('today flags a volume warning', (await txt('#home .warn-pill')) === 'לבדוק סטים', await txt('#home .week'));
  check('the top of the page is the logo alone, centred', (await p.evaluate(() => { const l = document.querySelector('.logo').getBoundingClientRect(); return Math.abs(l.left + l.width / 2 - innerWidth / 2) < 2 && !document.querySelector('.credit') && getComputedStyle(document.querySelector('#syncNote')).display === 'none'; })), 'logo');
  check('opens on today, with the next workout and the week', (await p.evaluate(() => S.view)) === 'home' && (await txt('#home .next')).includes('אימון ראשון') && (await txt('#home .next')).includes('גוף עליון A') && (await cur(p)) === 'אימון ראשון – גוף עליון A, הבא', [await txt('#home'), await cur(p)]);
  check('the whole page is in Hebrew: no English workout or exercise names on screen', !/Upper|Lower|Press|Curl|Squat|Row/.test(await txt('#home')) && !/[A-Za-z]{4,}/.test((await p.evaluate(() => [...document.querySelectorAll('.ex-name')].map((x) => x.textContent).join(' ')))), await txt('#home'));
  check('a new player starts at level 1 with nothing earned', (await txt('#playerBtn')).includes('רמה 1') && (await txt('#playerBtn')).includes('טירון') && (await p.evaluate(() => meNow().T.xp)) === 0, await txt('#playerBtn'));
  check('the next workout shows what it is worth', (await txt('#home .next .xp-tag')) === '+310', await txt('#home .next'));
  await shot('g0-home');
  await p.click('#homeGo'); await p.waitForTimeout(600);
  check('a workout opens on one exercise, ready to log', (await p.evaluate(() => S.view)) === 'workout' && (await p.$$('#exList .ex')).length === 1 && (await txt('.fx-k')) === 'תרגיל 1 מתוך 8' && (await txt('#exList .ex-name')) === 'לחיצת חזה בשיפוע עליון בסמית׳' && !!(await p.$('#dkHit')) && (await txt('#wkTitle')).includes('גוף עליון A') && (await p.evaluate(() => !live(0))), [await txt('.fx-head'), await txt('#wkTitle')]);
  check('the progress strip has a segment for every exercise', (await p.$$('#wkBar .segs i')).length === 8 && (await p.$$('#wkBar .segs i.cur')).length === 1, await p.$$eval('#wkBar .segs i', (a) => a.length));
  check('the exercise shows its numbers and the first week\'s intensity', (await txt('.rx-chips')).replace(/\s/g, '').includes('3×6–10') && (await txt('.rx-chips')).includes('מנוחה') && (await txt('.rx-chips')).includes('3 חזרות לפני כשל') && (await p.$$('.ex.open .setp')).length === 3, await txt('.rx-chips'));
  check('how-to cues are open by default, the other panes are a tap away', (await p.$$('#fxPane .cues li')).length === 3 && (await p.getAttribute('.fx-tabs [data-fx="cues"]', 'aria-selected')) === 'true', await txt('#fxPane'));
  await pane(p, 'hist');
  check('history pane is empty before the first workout', (await txt('#fxPane')).includes('עוד אין היסטוריה'), await txt('#fxPane'));
  await pane(p, 'cues');
  await p.click('#exNext'); await p.waitForTimeout(350);
  check('the arrows step between exercises', (await txt('.fx-k')) === 'תרגיל 2 מתוך 8' && (await p.evaluate(() => S.open)) === 'ua2' && (await p.$$('#exList .ex')).length === 1, await txt('.fx-head'));
  await p.click('#exPrev'); await p.waitForTimeout(350);
  check('and back, and the first one has nothing before it', (await p.evaluate(() => S.open)) === 'ua1' && (await p.isDisabled('#exPrev')), await p.evaluate(() => S.open));
  await p.click('#dkKg'); await p.fill('#dkKgIn', '60'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  await shot('g1-log');
  await log(p, 8); await p.waitForTimeout(500);
  check('one tap logs the set and starts rest', (await txt('.rt-log')).includes('60×8'), await txt('#dock'));
  check('a logged set earns 10 points, shown next to it', (await txt('.rt-log .xp-tag')) === '+10' && (await p.evaluate(() => meNow().T.xp)) === 10, await txt('.rt-log'));
  check('the first set starts the workout and its clock', (await p.evaluate(() => !!live(0))) && !!(await p.$('#elapsed')) && (await p.evaluate(() => document.querySelector('#wkBar .segs i.cur b').style.width)) === '33%', await txt('#wkTitle'));
  await p.click('#rtSkip'); await p.waitForTimeout(200);
  check('weight carries to the next set, with a one-tap target', (await txt('#dkKg')).startsWith('60') && (await txt('.dk-set')).includes('2') && (await txt('#dkReps')).startsWith('8') && !!(await p.$('#dkReps.ghost')), [await txt('#dkKg'), await txt('.dk-set'), await txt('#dkReps')]);
  check('target is greyed until confirmed', !!(await p.$('#dkKg.ghost')), 'ghost');
  await p.dispatchEvent('.step[data-d="1"]', 'pointerdown'); await p.dispatchEvent('.step[data-d="1"]', 'pointerup');
  check('stepper adds one step', (await txt('#dkKg')).startsWith('62.5') && !(await p.$('#dkKg.ghost')), await txt('#dkKg'));
  await log(p, 7); await p.waitForTimeout(450);
  await p.click('#rtUndo'); await p.waitForTimeout(250);
  check('undo returns to the same set and takes its points back', (await txt('.dk-set')).includes('2') && (await p.$$('.ex.open .setp.done')).length === 1 && (await p.evaluate(() => meNow().T.xp)) === 10, await txt('.dk-set'));
  await log(p, 9); await p.waitForTimeout(450); await p.click('#rtSkip'); await p.waitForTimeout(150);
  await p.click('.ex.open .setp[data-i="0"]'); await p.waitForTimeout(200);
  await reps(p, 10); await p.click('#edClose'); await p.waitForTimeout(200);
  const sets = await p.evaluate(() => [...document.querySelectorAll('.ex.open .setp')].map((x) => x.innerText.replace(/\n/g, ' ')));
  check('editing a logged set', sets[0].includes('60') && sets[0].includes('10') && sets[1].includes('9') && !sets[1].includes('שיא'), sets);
  check('two of the 21 sets are done', (await tally2(p)) === '2/21', await tally2(p));
  // pinned note
  await pane(p, 'note');
  await p.fill('.ex.open .note-in', 'מושב בגובה 4, עצירה למטה'); await p.dispatchEvent('.ex.open .note-in', 'change'); await p.waitForTimeout(200);
  check('pinned note is saved and shown in the dock', (await txt('.dk-note')).includes('מושב בגובה 4') && (await p.evaluate(() => S.cfg.notes.inclineSmith)) === 'מושב בגובה 4, עצירה למטה', await txt('#dock'));
  await p.click('#topCoach'); await p.waitForTimeout(250);
  check('the coach chat opens tidy: a face, four first questions, and what the question is about', !!(await p.$('#chat .chat-h .ava svg')) && !!(await p.$('#msgs .ava.big svg')) && (await p.$$('#msgs .sug')).length === 4 && (await p.isHidden('#chatNew')) && (await p.$eval('#chatCtx', (el) => el.value)) === 'ua1' && !!(await p.$('.composer .chat-ctx #chatCtx')), await txt('#msgs'));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC', 'base64');
  await p.setInputFiles('#galFile', { name: 'm.png', mimeType: 'image/png', buffer: png }); await p.waitForTimeout(300);
  await p.fill('#chatInput', 'זה מתאים במקום?'); await p.click('#sendBtn'); await p.waitForTimeout(900);
  await p.selectOption('#chatCtx', 'ua2'); await p.fill('#chatInput', 'רשום לי 40 קילו 8 8 7'); await p.click('#sendBtn'); await p.waitForTimeout(900);
  const calls = await p.evaluate(() => window.__calls.map((c) => ({ img: c.hasImg, ctx: c.last, first: c.first })));
  check('photo goes to the coach with the exercise context', calls[0].img && calls[0].ctx.includes('[ua1]') && calls[0].ctx.includes('60×10') && calls[0].ctx.includes('היעד לסט הבא'), calls[0].ctx);
  check('coach knows the week and its RIR', calls[0].first.includes('שבוע 1 מתוך 5') && calls[0].first.includes('3 חזרות לפני כשל'), calls[0].first.slice(0, 400));
  check('coach gets the Hebrew names with the English ones beside them', calls[0].first.includes('אימון ראשון – גוף עליון A') && calls[0].first.includes('[ua2] מתח בסיוע (גרביטון) (Assisted Pull-ups)') && calls[0].ctx.includes('"לחיצת חזה בשיפוע עליון בסמית׳"'), calls[0].first.slice(300, 700));
  check('answers come from the coach\'s face, and a new chat is on offer once there is one', (await p.$$('#msgs .row.a .ava svg')).length === 2 && (await p.$$('#msgs .row.u')).length === 2 && !(await p.isHidden('#chatNew')), await txt('#msgs'));
  check('verdict badge and hidden command line', (await txt('.verdict')) === 'מתאים חלקית' && !(await txt('#msgs')).includes('@@'), await txt('#msgs'));
  check('chat message logs sets', (await txt('.logged')).includes('3'), await txt('.logged'));
  await p.click('#chatClose'); await p.waitForTimeout(1000);
  const c0 = sess()[0];
  check('cloud copy has both exercises and the mesocycle fields', !!c0 && c0.sets.ua2.length === 3 && c0.sets.ua1[0].reps === 10 && c0.m === 'm1' && c0.wk === 1 && c0.rir === 3 && c0.n.ua1 === 3, c0);
  check('settings document reached the cloud', !!cloud['data/users/u_test/cfg'] && cloud['data/users/u_test/cfg'].notes.inclineSmith.includes('מושב'), Object.keys(cloud));
  await list(p);
  check('the list of all exercises shows the workout at a glance', (await p.$$('#allList .ex')).length === 8 && (await txt('#sheet .kicker')).includes('5/21') && (await p.$$('#allList .ex[data-id="ua2"] .pips i.on')).length === 3 && (await p.$$('#allList .ex.cur')).length === 1 && (await txt('#mesoBtn')).includes('שבוע 1 מתוך 5') && (await txt('#mesoBtn')).includes('3 חזרות לפני כשל'), await txt('#sheet'));
  await p.click('#finishBtn'); await p.waitForTimeout(500);
  check('summary and next workout', (await txt('#sheet')).includes('5/21') && (await txt('#sheet')).includes('אימון ראשון הושלם') && (await txt('#sheet')).includes('הבא: אימון שני – גוף תחתון A') && (await cur(p)) === 'אימון שני – גוף תחתון A, הבא' && (await p.evaluate(() => S.view)) === 'home', [await txt('#sheet'), await cur(p)]);
  await p.waitForTimeout(900); await shot('g1a-reward');
  check('the summary is the reward: 5 sets and the finish bonus, no level yet', (await txt('#sumXp')) === '+150' && (await txt('#sheet .xp')).includes('רמה 1') && (await txt('#sheet .xp')).includes('150 / 200') && !(await p.$('.sum-up')) && !!(await p.$('#sheet .av.flex')) && (await p.evaluate(() => document.querySelector('#sumBar').style.width)) === '75%', await txt('#sheet'));
  check('the first finished workout is an achievement', (await txt('.sum-new')).includes('אימון ראשון') && (await p.evaluate(() => S.cfg.me.badges.first > 0)), await txt('#sheet'));
  await p.click('#sheetClose'); await p.waitForTimeout(1200);
  // ---------- the profile: the character, the level and what was earned ----------
  await tab(p, 'profile'); await shot('g1p-profile');
  const pf = await txt('#profile');
  check('profile shows the level, the points to the next one and the totals', pf.includes('רמה 1') && pf.includes('טירון') && pf.includes('עוד 50 נק׳ לרמה 2') && pf.includes('150 / 200') && (await txt('.pf-stats')).startsWith('1 אימונים') && pf.includes('הפרס הבא') && pf.includes('סרט ראש'), pf.slice(0, 300));
  check('profile lists the achievements, one of them earned', (await p.$$('.bdg')).length === 12 && (await p.evaluate(() => [...document.querySelectorAll('.bdg.on')].map((x) => x.innerText.trim()).join())) === 'אימון ראשון', await txt('.badges'));
  check('the achievement reached the cloud with the settings', cloud['data/users/u_test/cfg'].me.badges.first > 0, cloud['data/users/u_test/cfg'].me);
  await p.click('#lookBtn'); await p.waitForTimeout(250);
  await p.fill('#lkName', 'ליאור'); await p.dispatchEvent('#lkName', 'change');
  await p.click('#sheet [data-look="shirt"][data-v="2"]'); await p.click('#sheet [data-look="hair"][data-v="3"]'); await p.waitForTimeout(200); await shot('g1q-look');
  check('the character sheet redraws the figure with each choice', (await p.evaluate(() => document.querySelector('#lkStage').innerHTML.includes('#E0364F') && document.querySelector('#sheet [data-look="shirt"][data-v="2"]').getAttribute('aria-pressed'))) === 'true' && (await p.evaluate(() => S.cfg.me.look.hair)) === 3, await p.evaluate(() => JSON.stringify(S.cfg.me)));
  await p.click('#sheet [data-close]'); await p.waitForTimeout(1200);
  check('the name and the look are kept and shown', (await txt('.pf-name')) === 'ליאור' && !!(await p.$('.pf-edit')) && cloud['data/users/u_test/cfg'].me.name === 'ליאור' && cloud['data/users/u_test/cfg'].me.look.shirt === 2, cloud['data/users/u_test/cfg'].me);
  await tab(p, 'home');
  check('today greets the player by name', (await txt('#playerBtn')).includes('היי, ליאור') && (await p.evaluate(() => document.querySelector('#playerBtn .av.bust').innerHTML.includes('#E0364F'))), await txt('#playerBtn'));
  await p.click('#playerBtn'); await p.waitForTimeout(200);
  check('the player strip opens the profile', (await p.evaluate(() => S.view)) === 'profile' && (await p.evaluate(() => document.querySelector('#tabbar [data-view="profile"]').getAttribute('aria-current'))) === 'page', await p.evaluate(() => S.view));
  check('finished workout reached the cloud', sess()[0].end > 0, sess()[0].end);
  await tab(p, 'progress'); await shot('g1b-progress');
  await p.click('#history [data-edit]'); await p.waitForTimeout(250);
  await p.click('#edReopen'); await p.waitForTimeout(500);
  check('reopen continues the same workout', !!(await p.$('.tab.live')) && (await tally2(p)) === '5/21' && !!(await p.$('#dkHit')) && (await p.evaluate(() => S.view)) === 'workout' && (await p.evaluate(() => meNow().T.xp)) === 50, [await cur(p), await tally2(p)]);
  await finish(p); await p.waitForTimeout(400); await p.click('#sheetClose'); await p.waitForTimeout(1200);
  check('still one workout in the cloud after reopen', sess().length === 1 && sess()[0].end > 0, Object.keys(cloud));
  check('nothing was deleted from the cloud', !(await p.evaluate(() => window.__deleted)), 'deleted');

  // ---------- a second device: empty local storage, same account ----------
  const B = await device(b, scheme), q = B.p; ERR.push(B.errs); await q.waitForTimeout(400);
  const t2 = T(q);
  check('second device: next up is workout 2', (await cur(q)) === 'אימון שני – גוף תחתון A, הבא' && (await t2('#history')).includes('5 סטים') && (await t2('#history .xp-tag')) === '+150', [await cur(q), await t2('#history')]);
  check('second device: the same player, level and character', (await t2('#playerBtn')).includes('היי, ליאור') && (await q.evaluate(() => [meNow().T.xp, S.cfg.me.look.shirt, S.cfg.me.badges.first > 0].join())) === '150,2,true', await t2('#playerBtn'));
  check('second device: the note arrived with the settings', (await q.evaluate(() => S.cfg.notes.inclineSmith || '')).includes('מושב'), 'note');
  await q.click('.tab[data-tab="0"]'); await q.waitForTimeout(400);
  check('recovery check is one question that takes the screen before the workout', (await t2('#pre')).includes('השרירים התאוששו?') && !(await q.$('#pre [data-mu]')) && !(await q.isVisible('#exList')) && !(await q.isVisible('#dock')), await t2('#pre'));
  await q.click('#preEdit'); await q.waitForTimeout(200);
  check('"not quite" opens the muscles one by one', (await t2('#pre')).includes('חזה') && (await t2('#pre')).includes('עדיין תפוס'), await t2('#pre'));
  await q.click('#preAll'); await q.waitForTimeout(250);
  check('once answered the question steps aside and the first exercise shows', !(await q.isVisible('#pre')) && (await q.isVisible('#exList')) && (await q.isVisible('#dkHit')) && (await q.evaluate(() => JSON.stringify(preOf(0)))) === '{"chest":1,"back":1}', await q.evaluate(() => JSON.stringify(preOf(0))));
  check('week 2 asks for one rep closer to failure', (await q.evaluate(() => { const P = phase(0, null); return P.wk + ':' + P.rir; })) === '2:2' && (await t2('.rx-chips')).includes('2 חזרות לפני כשל'), await t2('.rx-chips'));
  await pane(q, 'hist');
  check('second device: last time shown', (await t2('.ex.open .prev-line')).includes('60×10'), await t2('#fxPane'));
  await shot('g2-target', q);
  check('beat weight: top of the range last time moves the load up', (await t2('#dkKg')).startsWith('62.5') && (await t2('.dk-set')).includes('62.5×9') && (await t2('.dk-set .goal')) === 'יותר משקל' && (await t2('.ex.open .setp.cur')).includes('62.5×9'), [await t2('#dkKg'), await t2('.dk-set'), await t2('.ex.open .sets')]);
  await q.click('#dkHit'); await q.waitForTimeout(1500);
  const cB = sess().find((x) => !x.end);
  check('one tap on the check logs exactly the target', !!cB && cB.sets.ua1[0].kg === 62.5 && cB.sets.ua1[0].reps === 9 && cB.sets.ua1[0].tk === 62.5 && cB.sets.ua1[0].tr === 9 && cB.wk === 2 && cB.rir === 2, cB && cB.sets.ua1);
  check('live sync back to the first device', !!(await p.$('.tab.live')) && (await cur(p)).endsWith('באמצע'), await cur(p));
  check('a personal best is worth 30 more', (await t2('.rt-log .xp-tag')) === '+40' && (await t2('.rt-log .pr')) === 'שיא' && (await q.evaluate(() => meNow().T.xp)) === 190, await t2('.rt-log'));
  await q.click('#rtSkip'); await q.waitForTimeout(100);
  await q.click('.ex.open .same'); await q.waitForTimeout(400);
  check('"log the rest at target" fills the remaining sets', (await q.evaluate(() => doneCount(live(0), findEx('ua1')))) === 3, await q.evaluate(() => doneCount(live(0), findEx('ua1'))));
  check('crossing 200 points is a level-up, said at once', (await q.evaluate(() => [meNow().T.xp, S.lvl, document.querySelector('#toast').hidden].join())) === '210,2,false' && (await t2('#toast')) === 'רמה 2!', [await q.evaluate(() => meNow().T.xp), await t2('#toast')]);
  check('finished exercise asks for feedback', (await t2('.fb-dock')).includes('תחושה בשריר') && (await t2('.fb-dock')).includes('עומס') && (await t2('.fb-dock')).includes('איך היה: לחיצת חזה בשיפוע עליון בסמית׳'), await t2('#dock'));
  await p.waitForTimeout(400);
  check('the first device follows the level without a fanfare of its own', (await p.evaluate(() => [S.lvl, document.querySelector('#toast').hidden].join())) === '2,true', await p.evaluate(() => S.lvl));
  await shot('g3-feedback', q);
  await q.click('.fb-dock [data-fb="pump"][data-v="2"]'); await q.click('.fb-dock [data-fb="load"][data-v="1"]'); await q.waitForTimeout(1400);
  const fbB = (sess().find((x) => !x.end) || {}).fb;
  check('feedback saved and the panel closes', !(await q.$('.fb-dock')) && !!fbB && fbB.ua1.pump === 2 && fbB.ua1.load === 1 && fbB.ua1.pain === 0, fbB);
  check('the finished exercise made way for the next one', (await q.evaluate(() => S.open)) === 'ua2' && (await t2('.fx-k')) === 'תרגיל 2 מתוך 8' && (await q.evaluate(() => document.querySelector('#wkBar .segs i b').style.width)) === '100%', await t2('.fx-head'));
  await q.click('#exPrev'); await q.waitForTimeout(350);
  check('a finished exercise offers the next one, and keeps its answers for changing', (await t2('#dock')).includes('התרגיל הושלם') && !!(await q.$('#dkNext')) && (await t2('.ex.open .fb-wrap')).includes('תחושה בשריר') && (await q.getAttribute('.ex.open .fb-wrap [data-fb="pump"][data-v="2"]', 'aria-pressed')) === 'true', await t2('#dock'));
  await q.click('#dkNext'); await q.waitForTimeout(350);
  check('"next exercise" moves on to the first one with sets left', (await q.evaluate(() => S.open)) === 'ua2' && !!(await q.$('#dkHit')), await q.evaluate(() => S.open));
  await q.click('#backBtn'); await q.waitForTimeout(200); await tab(q, 'progress');
  if (await q.$('#exportBtn')) { await q.click('#exportBtn'); await q.waitForTimeout(200); }
  await tab(q, 'home'); await q.click('#homeGo'); await q.waitForTimeout(400);
  check('export offers a csv', (await q.evaluate(() => window.__saved.length)) === 1, 'saved');

  // ---------- swap inside the same movement pattern ----------
  await go(q, 'ua5');
  check('the list jumps straight to an exercise', (await q.evaluate(() => S.open)) === 'ua5' && (await t2('.fx-k')) === 'תרגיל 5 מתוך 8' && (await q.isHidden('#sheet')), await t2('.fx-head'));
  await q.click('.ex.open .swap'); await q.waitForTimeout(300); await shot('g4-swap', q);
  const swNames = await q.evaluate(() => [...document.querySelectorAll('.sw-opt .sw-t b')].map((x) => x.textContent));
  check('swap offers only the same movement pattern', swNames.length === 2 && swNames.includes('לחיצת חזה בשיפוע עם משקולות יד') && swNames.includes('לחיצת חזה בשיפוע עליון בסמית׳') && (await t2('.sw-opt .sw-t')).includes('Incline Dumbbell Press'), swNames);
  await q.click('.sw-opt [data-sw="inclineDb"][data-mode="always"]'); await q.waitForTimeout(1300);
  await pane(q, 'cues');
  check('swap keeps the slot: new name, same sets and reps', (await t2('.ex[data-id="ua5"] .ex-name')) === 'לחיצת חזה בשיפוע עם משקולות יד' && (await t2('.ex[data-id="ua5"] .en-name')) === 'Incline Dumbbell Press' && (await t2('.ex[data-id="ua5"] .ex-rx')).replace(/\s/g, '') === '2×8–12' && (await t2('.ex[data-id="ua5"] .stage-tag')).includes('תנועה דומה'), [await t2('.ex[data-id="ua5"] .fx-head'), await t2('.ex[data-id="ua5"] .rx-chips'), await t2('#fxPane')]);
  const sw = await q.evaluate(() => ({ cfg: S.cfg.swap.ua5, mv: live(0).mv.ua5, chest: muscleVolume(weekItems()).chest }));
  check('swap is stored and the weekly chest volume is unchanged', sw.cfg === 'inclineDb' && sw.mv === 'inclineDb' && sw.chest.d === 8, sw);
  check('swap reached the cloud settings', cloud['data/users/u_test/cfg'].swap.ua5 === 'inclineDb', cloud['data/users/u_test/cfg'].swap);

  // ---------- mesocycle sheet: volume landmarks, set counts, increments ----------
  await list(q); await q.click('#mesoBtn'); await q.waitForTimeout(300); await shot('g5-meso', q);
  const ms = await t2('#sheet');
  check('mesocycle sheet shows the RIR ramp and a deload', ms.includes('3 חזרות') && ms.includes('עד כשל') && ms.includes('שבוע קל') && !/מזוציקל|דילואד|RIR/.test(ms), ms.slice(0, 200));
  const flags = await q.evaluate(() => [...document.querySelectorAll('.vol-row')].map((r) => r.querySelector('.vol-n').textContent + ':' + r.querySelector('.vol-v b').textContent + ':' + (r.querySelector('.vol-flag') ? r.querySelector('.vol-flag').textContent : '')));
  check('fractional volume and the below-minimum warning', flags.some((f) => f.startsWith('חזה:8:') && !f.includes('מתחת')) && flags.some((f) => f.startsWith('שוקיים:6:') && f.includes('מתחת למינימום')) && flags.some((f) => f.startsWith('ירך אחורית:10.5:')), flags);
  await q.click('[data-base="la5"][data-n="4"]'); await q.waitForTimeout(150); await q.click('[data-base="lb6"][data-n="4"]'); await q.waitForTimeout(200);
  const flags2 = await q.evaluate(() => [...document.querySelectorAll('.vol-row')].map((r) => r.querySelector('.vol-n').textContent + ':' + r.querySelector('.vol-v b').textContent + ':' + (r.querySelector('.vol-flag') ? 'flag' : '')));
  check('adding sets in the builder clears the warning', flags2.includes('שוקיים:8:'), flags2);
  await q.selectOption('select[data-inc="db"]', '2'); await q.waitForTimeout(150);
  check('weight increment per equipment is customisable', (await q.evaluate(() => [incOf('dbCurl'), incOf('inclineSmith')])).join() === '2,2.5', 'inc');
  await q.click('#sheet [data-close]'); await q.waitForTimeout(300);

  // ---------- history-driven checks on the first device: seed a past Lower A, then train it ----------
  await finish(q); await q.waitForTimeout(1300); await shot('g5b-levelup', q);
  check('the summary celebrates the level that was reached in this workout', (await t2('#sumXp')) === '+160' && (await t2('.sum-up')) === 'עלית לרמה 2' && (await t2('#sheet .xp')).includes('110 / 240') && (await q.evaluate(() => document.querySelector('#sumBar').style.width)) === '46%', await t2('#sheet'));
  await q.click('#sheetClose'); await q.waitForTimeout(1200);
  await p.evaluate(() => {
    const day = 864e5, t0 = Date.now() - 4 * day, R = (kg, reps) => ({ kg, reps, done: true, t: t0 + 1000, tk: kg, tr: reps });
    S.sessions.seedLA = { id: 'seedLA', v: 3, w: 1, ts: t0, end: t0 + 3600e3, mt: t0 + 3600e3, upd: t0 + 3600e3, ft: t0, m: 'm1', wk: 1, dl: 0, rir: 3, n: { la1: 3, la2: 3, la3: 3, la4: 3, la5: 3, la6: 2 }, mv: {}, sore: {}, cut: {},
      fb: { la2: { pain: 0, pump: 1, load: 0 }, la4: { pain: 0, pump: 1, load: 0 }, la5: { pain: 0, pump: 0, load: 1 } },
      sets: { la1: [R(100, 8), R(100, 8), R(100, 7)], la2: [R(80, 9), R(80, 9), R(80, 8)], la3: [R(200, 12), R(200, 11), R(200, 10)], la4: [R(40, 12), R(40, 11), R(40, 10)], la5: [R(60, 14), R(60, 13), R(60, 12)], la6: [R(15, 12), R(15, 12)] } };
    touch(S.sessions.seedLA); S.tab = 1; S.touched = true; S.open = null; setView('workout', true); renderAll(); startTab();
  });
  await p.waitForTimeout(400); await p.click('#preEdit'); await p.waitForTimeout(200); await shot('g6-pre');
  check('recovery check lists the muscles of this workout', (await txt('#pre')).includes('ארבע ראשי') && (await txt('#pre')).includes('ירך אחורית') && (await txt('#pre')).includes('שוקיים'), await txt('#pre'));
  const rx = (id) => p.evaluate((i) => { const e = findEx(i); return e.sets + '×' + e.reps; }, id);
  await p.click('#pre [data-mu="quads"][data-v="2"]'); await p.waitForTimeout(250);
  check('still sore: one set off and one more rep in reserve', (await rx('la3')) === '2×10–15' && (await rx('la1')) === '3×6–10' && (await txt('#pre')).includes('סט פחות: לחיצת רגליים') && (await txt('#pre')).includes('חזרה פחות לארבע ראשי') && (await p.evaluate(() => rirOf(findEx('la1'), live(1)))) === 3, [await rx('la3'), await txt('#pre')]);
  await p.click('#pre [data-mu="hams"][data-v="0"]'); await p.waitForTimeout(250);
  check('never sore after easy work: one set added', (await rx('la2')) === '4×8–10' && (await txt('#pre')).includes('סט נוסף'), [await rx('la2'), await txt('#pre')]);
  await p.click('#pre [data-mu="calves"][data-v="1"]'); await p.click('#pre [data-mu="abs"][data-v="1"]').catch(() => {}); await p.waitForTimeout(250);
  check('low pump twice in a row is not flagged after one workout', (await p.evaluate(() => lowPump(findEx('la5').mv))) === false, 'lowPump');
  await p.click('#preDone'); await p.waitForTimeout(400);
  check('"continue" closes the recovery step with the answers kept', !(await p.isVisible('#pre')) && (await p.isVisible('#dkHit')) && (await rx('la3')) === '2×10–15' && (await rx('la2')) === '4×8–10', [await rx('la3'), await rx('la2')]);
  // sore quads hold last week's performance instead of adding a rep
  check('sore muscle holds the target', (await txt('.dk-set')).includes('יעד 100×8') && (await txt('.dk-set .goal')) === 'כמו בפעם הקודמת', await txt('.dk-set'));
  await log(p, 12); await p.waitForTimeout(500);
  check('calibration: far more reps than predicted re-aims the next set', (await txt('.rt-state')).includes('מעלים ל-') && (await p.evaluate(() => { const T = targetOf(findEx('la1'), 1, live(1)); return T.mode + ':' + T.kg; })).startsWith('cal:1'), [await txt('.rt-state'), await p.evaluate(() => JSON.stringify(targetOf(findEx('la1'), 1, live(1))))]);
  await p.click('#rtSkip'); await p.waitForTimeout(200); await shot('g7-cal');
  const calKg = await p.evaluate(() => targetOf(findEx('la1'), 1, live(1)).kg);
  check('calibrated weight is rounded to the equipment step', calKg % 5 === 0 && calKg > 100 && (await txt('#dkKg')).startsWith(String(calKg)) && (await txt('.dk-set .goal')) === 'משקל מעודכן', [calKg, await txt('#dkKg'), await txt('.dk-set')]);
  await log(p, 4); await p.waitForTimeout(500); await p.click('#rtSkip'); await p.waitForTimeout(200);
  const dn = await p.evaluate(() => targetOf(findEx('la1'), 2, live(1)));
  check('down-set: under the range drops the load 10%', dn.mode === 'down' && dn.kg <= calKg * 0.9 && dn.kg % 5 === 0 && dn.reps >= 6 && dn.reps <= 10 && (await txt('.dk-set .goal')) === 'פחות משקל', dn);
  await p.click('#dkHit'); await p.waitForTimeout(500);
  check('feedback panel sits in the rest dock', (await txt('.dock.rest .fb-dock')).includes('כאב') && (await txt('.dock.rest .fb-dock')).includes('האק סקוואט'), await txt('#dock'));
  await p.click('.fb-dock [data-fb="pain"][data-v="2"]'); await p.waitForTimeout(400);
  const cut = await p.evaluate(() => ({ cut: live(1).cut, la3: findEx('la3').sets, off: findEx('la3').cut && document.querySelectorAll('#wkBar .segs i.off').length === 1 ? 'off' : '', banner: document.querySelector('.fb-dock .fb-warn') ? document.querySelector('.fb-dock .fb-warn').innerText : '' }));
  check('severe joint pain cancels the rest of that muscle today and suggests a gentler movement', cut.cut.la3 === 'la1' && cut.la3 === 0 && cut.off.includes('off') && cut.banner.includes('בוטלו') && cut.banner.includes('גובלט סקוואט') && cut.banner.includes('נוח יותר למפרקים'), cut);
  await p.waitForTimeout(1500); await shot('g8-pain'); await p.click('.fb-dock [data-swapto]'); await p.waitForTimeout(300);
  check('accepting the suggestion swaps from the next workout', (await p.evaluate(() => S.cfg.swap.la1)) === 'gobletSquat' && (await txt('.fb-dock .fb-warn')).includes('מהאימון הבא') && (await p.evaluate(() => findEx('la1').mv)) === 'hackSquat', await p.evaluate(() => S.cfg.swap));
  await p.click('.fb-dock [data-fb="pump"][data-v="0"]'); await p.click('.fb-dock [data-fb="load"][data-v="2"]'); await p.waitForTimeout(600);
  // second weak pump in a row on calves -> swap hint
  await p.evaluate(() => { onFb('la5', 'pump', 0); });
  await list(p);
  check('weak pump twice in a row flags the exercise in the list', (await txt('#allList .ex[data-id="la5"]')).includes('שווה להחליף'), await txt('#allList .ex[data-id="la5"]'));
  await p.click('#allList .ex[data-id="la5"] .ex-head'); await p.waitForTimeout(350);
  check('and on its own screen, with the reason', (await txt('.ex.open .fx-head')).includes('שווה להחליף') && (await txt('.ex.open .flag-line')).includes('לא הרגשת את השריר'), await txt('.ex.open .fx-head'));
  await p.evaluate(() => { delete live(1).fb.la5; renderList(); });

  // ---------- fatigue: two workouts in a row short of target for two muscles -> deload offer ----------
  await p.evaluate(() => {
    /* the workout right before this one, so the two short workouts are consecutive */
    const t0 = Date.now() - 2000, R = (kg, reps, tr) => ({ kg, reps, done: true, t: t0 + 500, tk: kg, tr });
    S.sessions.seedUB = { id: 'seedUB', v: 3, w: 2, ts: t0, end: t0 + 1000, mt: t0 + 1000, upd: t0 + 1000, ft: t0, m: 'm1', wk: 1, dl: 0, rir: 3, n: {}, mv: {}, sore: {}, cut: {}, fb: {},
      sets: { ub1: [R(40, 6, 8)], ub2: [R(55, 7, 9)], ub3: [R(50, 10, 10)] } };
    touch(S.sessions.seedUB);
    const s = live(1); s.sets.la2 = [{ kg: 80, reps: 7, done: true, t: Date.now(), tk: 80, tr: 10 }]; s.sets.la5 = [{ kg: 60, reps: 10, done: true, t: Date.now(), tk: 60, tr: 15 }]; touch(s); renderAll();
  });
  check('fatigue detector sees two short workouts', (await p.evaluate(() => [Array.from(missedMuscles(S.sessions.seedUB)).length, Array.from(missedMuscles(live(1))).length].join())) === '2,2', await p.evaluate(() => [Array.from(missedMuscles(S.sessions.seedUB)), Array.from(missedMuscles(live(1)))]));
  await finish(p); await p.waitForTimeout(500); await shot('g9-deload');
  check('deload is offered after the second short workout', (await txt('#sheet')).includes('סימני עייפות') && !!(await p.$('#dlYes')), await txt('#sheet'));
  await p.click('#dlYes'); await p.waitForTimeout(400);
  const dl = await p.evaluate(() => { const P = phaseNext(1), e = findEx('la4', null), T = targetOf(e, 0, null); return { dl: P.dl, rir: P.rir, sets: planned(1, {}).la4, kg: T.kg, mode: T.mode, early: S.cfg.meso.early > 0 }; });
  check('deload week: half the sets, 15% lighter, far from failure', dl.dl && dl.rir === 4 && dl.sets === 2 && dl.kg === 30 && dl.mode === 'deload' && dl.early, dl);
  check('no recovery questions in a deload week', !(await p.$('#pre .pre')), await txt('#pre'));
  check('today says it is an easy week', (await txt('#home .week h2')) === 'שבוע קל' && (await p.evaluate(() => phaseNext(1).dl)), await txt('#home .week'));

  // ---------- mesocycle summary ----------
  const sum = await p.evaluate(() => { const R = mesoSummary('m1'); return { n: R.n, sets: R.sets, gains: R.gains.map((g) => g.mv + ':' + g.pct.toFixed(1)), mus: R.mus.length }; });
  check('mesocycle summary has volume and strength', sum.n >= 3 && !!sum.sets && sum.sets.peak >= sum.sets.start && sum.mus > 3 && sum.gains.some((g) => g.startsWith('inclineSmith:')), sum);
  await p.evaluate(() => showMesoSummary('m1', false)); await p.waitForTimeout(300); await shot('g10-summary');
  check('summary card renders', (await txt('#sheet')).includes('שינוי כוח לפי תרגיל') && (await txt('#sheet')).includes('סטים לפי שריר') && (await txt('#sheet')).includes('הגיבו הכי טוב'), (await txt('#sheet')).slice(0, 300));
  await p.click('#sheetClose'); await p.waitForTimeout(300);

  // ---------- fix a past workout on the second device ----------
  const doneId = Object.keys(cloud).find((k) => cloud[k].end > 0 && cloud[k].w === 0 && cloud[k].wk === 1), ts0 = cloud[doneId].ts;
  await q.evaluate((id) => openEditor(id.split('/').pop()), doneId); await q.waitForTimeout(250);
  await q.fill('.ed-row[data-ex="ua1"][data-i="0"] [data-k="kg"]', '65'); await q.fill('.ed-row[data-ex="ua1"][data-i="0"] [data-k="reps"]', '12');
  await q.click('.ed-row[data-ex="ua1"][data-i="1"] .ed-clr');
  await q.fill('.ed-row[data-ex="ua3"][data-i="0"] [data-k="reps"]', '9');
  const y = new Date(Date.now() - 864e5), yIso = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
  await q.fill('#edDate', yIso); await q.dispatchEvent('#edDate', 'change');
  await q.click('#edDone'); await q.waitForTimeout(1300);
  const ed = cloud[doneId];
  check('editor: weight and reps corrected in the cloud', ed.sets.ua1[0].kg === 65 && ed.sets.ua1[0].reps === 12, ed.sets.ua1);
  check('editor: cleared set is no longer done, added set is', ed.sets.ua1[1].done === false && ed.sets.ua3[0].done === true && ed.sets.ua3[0].reps === 9, [ed.sets.ua1[1], ed.sets.ua3]);
  check('editor: workout moved one day back', Math.abs(ts0 - ed.ts - 864e5) < 4000e3 && ed.end > ed.ts, [ts0, ed.ts, ed.end]);
  const onA = await p.evaluate((id) => { const s = S.sessions[id.split('/').pop()]; return s ? [s.sets.ua1[0].reps, s.sets.ua1[1].done, s.ts, s.wk] : null; }, doneId);
  check('editor: first device received the correction', !!onA && onA[0] === 12 && onA[1] === false && onA[2] === ed.ts && onA[3] === 1, onA);
  const before = sess().length;
  await q.evaluate((id) => { deleteSession(id.split('/').pop()); renderAll(); }, doneId); await q.waitForTimeout(700);
  check('deleting a finished workout removes it here and in the cloud', sess().length === before - 1, [before, sess().length]);
  await p.waitForTimeout(300);
  // ---------- a copy of the page from before the profile existed saves the settings: the player must survive ----------
  const oldCfg = Object.assign({}, cloud['data/users/u_test/cfg'], { upd: Date.now() + 1000, weeks: 6 }); delete oldCfg.me;
  cloud['data/users/u_test/cfg'] = oldCfg;
  await p.evaluate((j) => window.__remote('data/users/u_test/cfg', j), JSON.stringify(oldCfg)); await p.waitForTimeout(1600);
  const kept = await p.evaluate(() => [S.cfg.weeks, S.cfg.me.name, S.cfg.me.look.shirt, !!S.cfg.me.badges.first].join()), back = cloud['data/users/u_test/cfg'].me;
  check('settings saved by an older copy of the page do not erase the player', kept === '6,ליאור,2,true' && !!back && back.name === 'ליאור' && back.badges.first > 0, [kept, back]);
  await snap(p, 'g11-end', true);
  report();
  await b.close();
})().catch((e) => { report(); console.log('CRASH', e.message.split('\n').slice(0, 6).join('\n')); process.exit(1); });
