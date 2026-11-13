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
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme, locale: 'he-IL' });
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
/* "continue" in the rest timer; a tap in the first moment after the timer appears is taken for the tail of a double tap and ignored */
const skip = async (pg) => { await pg.waitForTimeout(350); await pg.click('#rtSkip'); };
  const more = async (pg) => { await pg.click('.ex.open .more'); await pg.waitForTimeout(250); };
  const shut = async (pg) => { await pg.click('#sheet [data-close]'); await pg.waitForTimeout(250); };
  const tally2 = (pg) => pg.evaluate(() => { const t = totals(); return t.dn + '/' + t.total; });
  // the dock: type the reps, then one tap logs the set
  const reps = async (pg, n) => { await pg.click('#dkReps'); await pg.fill('#dkRepsIn', String(n)); await pg.keyboard.press('Enter'); await pg.waitForTimeout(120); };
  const log = async (pg, n) => { await reps(pg, n); await pg.click('#dkHit'); };
  const tab = async (pg, v) => { await pg.click('#tabbar [data-view="' + v + '"]'); await pg.waitForTimeout(250); };

  // ---------- the opening screens: the coach asks, the player answers, once ----------
  const cfgK = 'data/users/u_test/cfg';
  check('a new player is met by the opening screens', (await p.isVisible('#ob')) && (await txt('#obTitle')) === 'ברוכים הבאים ל-gymi' && (await p.getAttribute('#ob [data-lang="he"]', 'aria-pressed')) === 'true' && (await p.evaluate(() => S.cfg.me.ob)) === 0, await txt('#ob'));
  await p.click('#ob [data-lang="en"]'); await p.waitForTimeout(150);
  check('the language is chosen on the first screen', (await txt('#obTitle')) === 'Welcome to gymi' && (await p.evaluate(() => document.documentElement.dir + ':' + document.documentElement.lang + ':' + document.querySelector('#app').dir)) === 'ltr:en:ltr' && (await txt('#obNext')) === "Let's start", await txt('#ob'));
  await p.click('#ob [data-lang="he"]'); await p.waitForTimeout(150); await shot('o1-welcome');
  await p.click('#obNext'); await p.waitForTimeout(400);
  check('first question: the name, ready for typing', (await txt('#obTitle')) === 'איך קוראים לך?' && (await p.evaluate(() => document.activeElement.id)) === 'obName' && !!(await p.$('#ob .ob-q .ava svg')), await txt('#ob'));
  await p.fill('#obName', 'ליאור'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  check('experience has to be chosen before going on', (await txt('#obTitle')).includes('ניסיון') && (await p.isDisabled('#obNext')) && (await p.$$('.ob-opt')).length === 3, await txt('#ob'));
  await p.click('.ob-opt[data-v="1"]'); await p.waitForTimeout(150); await shot('o2-experience');
  check('the chosen answer is marked', (await p.getAttribute('.ob-opt[data-v="1"]', 'aria-checked')) === 'true' && (await p.getAttribute('.ob-opt[data-v="0"]', 'aria-checked')) === 'false' && !(await p.isDisabled('#obNext')), 'exp');
  await p.click('#obNext'); await p.waitForTimeout(400);
  await p.click('.ob-opt[data-v="0"]'); await p.click('#obNext'); await p.waitForTimeout(400);
  check('the character is designed on its own screen', (await txt('#obTitle')) === 'זו הדמות שלך' && !!(await p.$('#ob #lkStage svg')), await txt('#ob'));
  await p.click('#ob [data-look="hair"][data-v="2"]'); await p.waitForTimeout(150); await shot('o3-character');
  await p.click('#obBack'); await p.waitForTimeout(350);
  check('back returns to the question before, with its answer kept', (await txt('#obTitle')) === 'מה המטרה שלך?' && (await p.getAttribute('.ob-opt[data-v="0"]', 'aria-checked')) === 'true', await txt('#ob'));
  await p.click('#obNext'); await p.waitForTimeout(350); await p.click('#obNext'); await p.waitForTimeout(600); await shot('o4-ready');
  check('the last screen greets by name', (await txt('#obTitle')) === 'ליאור, הכול מוכן!' && (await txt('#obNext')) === 'לאימון הראשון' && !!(await p.$('#ob .av.flex')) && (await txt('.ob-note')).includes('ייעוץ רפואי'), await txt('#ob'));
  await p.click('#obNext'); await p.waitForTimeout(1400);
  const obA = await p.evaluate(() => { const m = S.cfg.me; return [m.name, m.exp, m.goal, m.look.hair, m.ob > 0, m.made > 0, S.cfg.lang, document.querySelector('#ob').hidden, planned(0, {}).ua1].join(); });
  check('the answers are kept and the app opens', obA === 'ליאור,1,0,2,true,true,he,true,3' && !!cloud[cfgK] && cloud[cfgK].me.ob > 0 && cloud[cfgK].me.exp === 1 && cloud[cfgK].lang === 'he', [obA, cloud[cfgK] && cloud[cfgK].me]);
  // ---------- first workout, nothing logged before ----------
  check('today stays quiet: the warning about weekly sets waits in the plan', !(await p.$('#home .warn-pill')) && (await p.evaluate(() => volWarn())) > 0, await txt('#home .week'));
  check('the top of the page is the logo alone, centred', (await p.evaluate(() => { const l = document.querySelector('.logo').getBoundingClientRect(); return Math.abs(l.left + l.width / 2 - innerWidth / 2) < 2 && !document.querySelector('.credit') && getComputedStyle(document.querySelector('#syncNote')).display === 'none'; })), 'logo');
  check('opens on today, with the next workout and the week', (await p.evaluate(() => S.view)) === 'home' && (await txt('#home .next')).includes('אימון ראשון') && (await txt('#home .next')).includes('גוף עליון A') && (await cur(p)) === 'אימון ראשון – גוף עליון A, הבא', [await txt('#home'), await cur(p)]);
  check('the whole page is in Hebrew: no English workout or exercise names on screen', !/Upper|Lower|Press|Curl|Squat|Row/.test(await txt('#home')) && !/[A-Za-z]{4,}/.test((await p.evaluate(() => [...document.querySelectorAll('.ex-name')].map((x) => x.textContent).join(' ')))), await txt('#home'));
  check('a new player starts at level 1 with nothing earned', (await txt('#playerBtn')).includes('רמה 1') && (await txt('#playerBtn')).includes('טירון') && (await p.evaluate(() => meNow().T.xp)) === 0, await txt('#playerBtn'));
  check('the next workout shows what it is worth', (await txt('#home .next .xp-tag')) === '+310', await txt('#home .next'));
  await shot('g0-home');
  await p.click('#homeGo'); await p.waitForTimeout(600);
  check('a workout opens on one exercise, ready to log', (await p.evaluate(() => S.view)) === 'workout' && (await p.$$('#exList .ex')).length === 1 && (await txt('#wkTitle .sub')) === 'תרגיל 1 מתוך 8' && (await txt('#exList .ex-name')) === 'לחיצת חזה בשיפוע עליון בסמית׳' && !!(await p.$('#dkHit')) && (await txt('#wkTitle')).includes('גוף עליון A') && (await p.evaluate(() => !live(0))), [await txt('.fx-head'), await txt('#wkTitle')]);
  check('one quiet bar shows how far the workout is', (await p.getAttribute('#wkBar .bar', 'aria-label')) === '0 מתוך 21 סטים' && (await p.$$('#wkBar .bar i')).length === 1, await p.getAttribute('#wkBar .bar', 'aria-label'));
  check('the exercise says what is asked in one line, with a cell for every set and nothing else to press', (await txt('.fx-rx')) === '6–10 חזרות · 3 חזרות לפני כשל' && (await p.$$('.ex.open .setp')).length === 3 && (await p.$$('#exList .ex.open button')).length === 9, await txt('.fx-rx'));
  await p.click('.ex.open .how'); await p.waitForTimeout(250);
  check('how to do it is one tap away: three cues and the name in English', (await p.$$('#sheet .cues li')).length === 3 && (await txt('#sheet .en-name')) === 'Incline Smith Machine Press', await txt('#sheet'));
  await shut(p);
  await more(p);
  check('history is empty before the first workout, and there is no target to log by yet', (await txt('#sheet')).includes('עוד אין היסטוריה') && !(await p.$('#moreSame')), await txt('#sheet'));
  await shut(p);
  await p.click('#exNext'); await p.waitForTimeout(350);
  check('the arrows step between exercises', (await txt('#wkTitle .sub')) === 'תרגיל 2 מתוך 8' && (await p.evaluate(() => S.open)) === 'ua2' && (await p.$$('#exList .ex')).length === 1, await txt('.fx-head'));
  await p.click('#exPrev'); await p.waitForTimeout(350);
  check('and back, and the first one has nothing before it', (await p.evaluate(() => S.open)) === 'ua1' && (await p.isDisabled('#exPrev')), await p.evaluate(() => S.open));
  await p.evaluate(() => { window.__felt = []; window.gymiHaptic = (k) => window.__felt.push(k); });
  await p.click('#exNext'); await p.waitForTimeout(250); await p.click('#exPrev'); await p.waitForTimeout(250);
  check('a plain press is felt: a tap going forward, a softer one going back', (await p.evaluate(() => window.__felt.join())) === 'tap,back', await p.evaluate(() => window.__felt.join()));
  await p.evaluate(() => { window.__felt = []; });
  await p.click('#dkKg'); await p.fill('#dkKgIn', '60'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  await shot('g1-log');
  /* what the hand and the ear get: the shell's touch hook records each kind */
  await p.evaluate(() => { window.__felt = []; });
  await reps(p, 8); await p.click('#dkHit'); await p.waitForTimeout(260);
  const fly = await p.evaluate(() => { const f = document.querySelector('.fly'); return f ? f.textContent : ''; });
  await p.waitForTimeout(240);
  check('logging a set is felt as a success, once, and its points fly up from the button', (await p.evaluate(() => window.__felt.join())) === 'success' && fly === '+10' && !!(await p.$('.ex.open .setp.pop[data-i="0"]')), [await p.evaluate(() => window.__felt.join()), fly]);
  await p.waitForTimeout(700);
  check('(the flying points are gone again)', !(await p.$('.fly')), 'fly');
  await p.evaluate(() => { delete window.gymiHaptic; });
  check('one tap logs the set and starts rest', (await txt('.rt-log')).includes('60×8'), await txt('#dock'));
  check('a logged set earns 10 points, shown next to it', (await txt('.rt-log .xp-tag')) === '+10' && (await p.evaluate(() => meNow().T.xp)) === 10, await txt('.rt-log'));
  check('the first set starts the workout and moves the bar', (await p.evaluate(() => !!live(0))) && (await p.evaluate(() => document.querySelector('#wkBar .bar i').style.width)) === '5%', await p.getAttribute('#wkBar .bar', 'aria-label'));
  await skip(p); await p.waitForTimeout(200);
  check('weight carries to the next set, with a one-tap target', (await txt('#dkKg')).startsWith('60') && (await txt('.dk-set')).includes('2') && (await txt('#dkReps')).startsWith('8') && !!(await p.$('#dkReps.ghost')), [await txt('#dkKg'), await txt('.dk-set'), await txt('#dkReps')]);
  check('target is greyed until confirmed', !!(await p.$('#dkKg.ghost')), 'ghost');
  await p.dispatchEvent('.step[data-d="1"]', 'pointerdown'); await p.dispatchEvent('.step[data-d="1"]', 'pointerup');
  check('stepper adds one step', (await txt('#dkKg')).startsWith('62.5') && !(await p.$('#dkKg.ghost')), await txt('#dkKg'));
  await log(p, 7); await p.waitForTimeout(450);
  await p.click('#rtUndo'); await p.waitForTimeout(250);
  check('undo returns to the same set and takes its points back', (await txt('.dk-set')).includes('2') && (await p.$$('.ex.open .setp.done')).length === 1 && (await p.evaluate(() => meNow().T.xp)) === 10, await txt('.dk-set'));
  await log(p, 9); await p.waitForTimeout(450); await skip(p); await p.waitForTimeout(150);
  await p.click('.ex.open .setp[data-i="0"]'); await p.waitForTimeout(200);
  await reps(p, 10); await p.click('#edClose'); await p.waitForTimeout(200);
  const sets = await p.evaluate(() => [...document.querySelectorAll('.ex.open .setp')].map((x) => x.innerText.replace(/\n/g, ' ')));
  check('editing a logged set', sets[0].includes('60') && sets[0].includes('10') && sets[1].includes('9') && !(await p.$('.ex.open .setp[data-i="1"] .pr')), sets);
  check('two of the 21 sets are done', (await tally2(p)) === '2/21', await tally2(p));
  // pinned note
  await more(p);
  await p.fill('#sheet .note-in', 'מושב בגובה 4, עצירה למטה'); await p.dispatchEvent('#sheet .note-in', 'change'); await p.waitForTimeout(150); await shut(p);
  check('pinned note is saved and shown in the dock', (await txt('.dk-note')).includes('מושב בגובה 4') && (await p.evaluate(() => S.cfg.notes.inclineSmith)) === 'מושב בגובה 4, עצירה למטה', await txt('#dock'));
  // the number of sets of this exercise, changed from where the lifter is
  await more(p);
  check('"more" holds the number of sets of the exercise', (await txt('#sheet .mr .stp b')) === '3' && (await txt('#sheet .mr .m-row')).includes('סטים בתרגיל') && (await p.getAttribute('#sheet .mr .stp button:last-child', 'aria-label')) === 'סט נוסף', await txt('#sheet'));
  await p.click('#sheet [data-base="ua1"][data-n="4"]'); await p.waitForTimeout(200);
  check('one more set from there: today and the plan follow, and the sheet stays where it was', (await p.evaluate(() => [findEx('ua1').sets, S.cfg.base.ua1.n, live(0).n.ua1, S.sheet].join())) === '4,4,4,more' && (await p.$$('.ex.open .setp')).length === 4 && (await tally2(p)) === '2/22' && (await txt('#sheet .mr .stp b')) === '4' && (await p.evaluate(() => !!document.activeElement.closest('#sheet .stp'))), [await tally2(p), await txt('#sheet .mr .stp')]);
  await p.click('#sheet [data-base="ua1"][data-n="3"]'); await p.waitForTimeout(150); await p.click('#sheet [data-base="ua1"][data-n="2"]'); await p.waitForTimeout(200);
  check('the number cannot go under the sets that were done', (await p.evaluate(() => findEx('ua1').sets)) === 2 && (await p.isDisabled('#sheet .mr .stp button:first-child')) && (await tally2(p)) === '2/20', await txt('#sheet .mr .stp'));
  await p.click('#sheet [data-base="ua1"][data-n="3"]'); await p.waitForTimeout(200); await shut(p);
  check('(back to three sets, and the next one is asked for)', (await p.evaluate(() => findEx('ua1').sets)) === 3 && (await tally2(p)) === '2/21' && !!(await p.$('#dkHit')) && (await txt('.dk-set')).includes('3'), await txt('#dock'));
  check('a workout that is under way is marked on "today"', !!(await p.$('#tabbar [data-view="home"].live')) && (await p.evaluate(() => getComputedStyle(document.querySelector('#tabbar [data-view="home"]'), '::after').width)) === '9px', 'live');
  await more(p); await p.click('#moreAsk'); await p.waitForTimeout(250);
  check('the coach chat opens tidy: a face, four first questions, and what the question is about', !!(await p.$('#chat .chat-h .ava svg')) && !!(await p.$('#msgs .ava.big svg')) && (await p.$$('#msgs .sug')).length === 4 && (await p.isHidden('#chatNew')) && (await p.$eval('#chatCtx', (el) => el.value)) === 'ua1' && !!(await p.$('.composer .chat-ctx #chatCtx')), await txt('#msgs'));
  const face = await p.evaluate(() => { const el = document.querySelector('#msgs .ava.big svg'), h = el.outerHTML; return { grin: el.classList.contains('grin'), bust: el.classList.contains('bust'), studs: (h.match(/#C9CED8/g) || []).length, band: h.includes('#E0364F'), shirt: h.includes('#F3EDE0'), hair: h.includes('#7A5232'), beard: /opacity="\.26"/.test(h), same: h === document.querySelector('#chat .chat-h .ava svg').outerHTML }; });
  check('the coach has a face of his own: a fringe, a stud in the ear, an open smile, a light shirt and no gear', face.grin && face.bust && face.studs === 2 && !face.band && face.shirt && face.hair && !face.beard && face.same, face);
  const own = await p.evaluate(() => { const plain = avatarSVG({ skin: 1, hair: 1, hc: 0, beard: 0, shirt: 0 }, 12, { bust: true }), odd = avatarSVG({ skin: 1, hair: 1, hc: 0, beard: 0, shirt: 0, hairC: '"><img src=x>', shirtC: 'red' }, 12, { bust: true }); return { band: plain.includes('#E0364F'), grin: plain.includes('av bust grin'), safe: odd === plain, me: JSON.stringify(Object.keys(S.cfg.me.look).sort()) }; });
  check('a player\'s character is drawn as before, and takes no colour that is not one of its own choices', own.band && !own.grin && own.safe && own.me === '["beard","hair","hc","shirt","skin"]', own);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC', 'base64');
  await p.setInputFiles('#galFile', { name: 'm.png', mimeType: 'image/png', buffer: png }); await p.waitForTimeout(300);
  await p.fill('#chatInput', 'זה מתאים במקום?'); await p.click('#sendBtn'); await p.waitForTimeout(900);
  await p.selectOption('#chatCtx', 'ua2'); await p.fill('#chatInput', 'רשום לי 40 קילו 8 8 7'); await p.click('#sendBtn'); await p.waitForTimeout(900);
  const calls = await p.evaluate(() => window.__calls.map((c) => ({ img: c.hasImg, ctx: c.last, first: c.first })));
  check('photo goes to the coach with the exercise context', calls[0].img && calls[0].ctx.includes('[ua1]') && calls[0].ctx.includes('60×10') && calls[0].ctx.includes('היעד לסט הבא'), calls[0].ctx);
  check('coach knows who is asking', calls[0].first.includes('שם: ליאור') && calls[0].first.includes('ניסיון בחדר כושר: מתאמן קבוע') && calls[0].first.includes('מטרה: לבנות שריר'), calls[0].first.slice(0, 700));
  check('coach knows the week and its RIR', calls[0].first.includes('שבוע 1 מתוך 5') && calls[0].first.includes('3 חזרות לפני כשל'), calls[0].first.slice(0, 400));
  check('coach gets the Hebrew names with the English ones beside them', calls[0].first.includes('אימון ראשון – גוף עליון A') && calls[0].first.includes('[ua2] מתח בסיוע (גרביטון) (Assisted Pull-ups)') && calls[0].ctx.includes('"לחיצת חזה בשיפוע עליון בסמית׳"'), calls[0].first.slice(300, 700));
  check('answers come from the coach\'s face, and a new chat is on offer once there is one', (await p.$$('#msgs .row.a .ava svg')).length === 2 && (await p.$$('#msgs .row.u')).length === 2 && !(await p.isHidden('#chatNew')), await txt('#msgs'));
  check('verdict badge and hidden command line', (await txt('.verdict')) === 'מתאים חלקית' && !(await txt('#msgs')).includes('@@'), await txt('#msgs'));
  check('chat message logs sets', (await txt('.logged')).includes('3'), await txt('.logged'));
  /* "new chat" while an answer is still streaming: the old exchange is gone for good, with no error and nothing put back in the box */
  await p.selectOption('#chatCtx', ''); await p.fill('#chatInput', 'שאלה שנקטעת באמצע'); await p.click('#sendBtn'); await p.waitForTimeout(90);
  await p.click('#chatNew'); await p.waitForTimeout(900);
  const fresh = await p.evaluate(() => ({ msgs: chat.msgs.length, turns: chat.turns.length, busy: chat.busy, box: document.querySelector('#chatInput').value, note: document.querySelector('#compNote').hidden, empty: !!document.querySelector('#msgs .empty'), send: document.querySelector('#sendBtn').getAttribute('aria-label') }));
  check('a new chat in the middle of an answer starts clean', fresh.msgs === 0 && fresh.turns === 0 && !fresh.busy && fresh.box === '' && fresh.note && fresh.empty && fresh.send === 'שלח', fresh);
  await p.fill('#chatInput', 'זה מתאים במקום?'); await p.click('#sendBtn'); await p.waitForTimeout(900);
  check('and the next question is answered as the first of a new conversation', (await p.evaluate(() => chat.turns.map((t) => t.role).join())) === 'user,assistant' && (await p.$$('#msgs .row.a')).length === 1 && (await txt('.verdict')) === 'מתאים חלקית', await p.evaluate(() => chat.turns.map((t) => t.role).join()));
  await p.click('#chatClose'); await p.waitForTimeout(1000);
  const c0 = sess()[0];
  check('cloud copy has both exercises and the mesocycle fields', !!c0 && c0.sets.ua2.length === 3 && c0.sets.ua1[0].reps === 10 && c0.m === 'm1' && c0.wk === 1 && c0.rir === 3 && c0.n.ua1 === 3, c0);
  check('settings document reached the cloud', !!cloud['data/users/u_test/cfg'] && cloud['data/users/u_test/cfg'].notes.inclineSmith.includes('מושב'), Object.keys(cloud));
  await list(p);
  check('the list of all exercises shows the workout at a glance: plain rows, no pictures', (await p.$$('#allList .ex')).length === 8 && (await txt('#sheet .kicker')).includes('5/21') && (await txt('#allList .ex[data-id="ua1"] .ex-rx')) === '2/3' && !!(await p.$('#allList .ex[data-id="ua2"].done .ex-n svg')) && (await txt('#allList .ex[data-id="ua3"] .ex-rx')) === '3 × 8–12' && (await p.$$('#allList .ex.cur')).length === 1 && !(await p.$('#allList canvas')) && (await p.$$('#allList .ex-head > *')).length === 24 && !!(await p.$('#editWk')), await txt('#sheet'));
  await p.click('#finishBtn'); await p.waitForTimeout(500);
  check('summary and next workout', (await txt('#sheet')).includes('5/21') && (await txt('#sheet')).includes('אימון ראשון הושלם') && (await txt('#sheet')).includes('הבא: אימון שני – גוף תחתון A') && (await cur(p)) === 'אימון שני – גוף תחתון A, הבא' && (await p.evaluate(() => S.view)) === 'home', [await txt('#sheet'), await cur(p)]);
  await p.waitForTimeout(900); await shot('g1a-reward');
  check('the summary is the reward: 5 sets and the finish bonus, no level yet', (await txt('#sumXp')) === '+150' && (await txt('#sheet .xp')).includes('רמה 1') && (await txt('#sheet .xp')).includes('150 / 200') && !(await p.$('.sum-up')) && !!(await p.$('#sheet .av.flex')) && (await p.evaluate(() => document.querySelector('#sumBar').style.width)) === '75%', await txt('#sheet'));
  check('the first finished workout is an achievement', (await txt('.sum-new')).includes('אימון ראשון') && (await p.evaluate(() => S.cfg.me.badges.first > 0)), await txt('#sheet'));
  await p.click('#sheetClose'); await p.waitForTimeout(1200);
  // ---------- the profile: the character, the level and what was earned ----------
  await tab(p, 'profile'); await shot('g1p-profile');
  const pf = await txt('#profile');
  check('profile shows the level, the points to the next one, the next reward and the totals, in one card', pf.includes('רמה 1') && pf.includes('טירון') && pf.includes('עוד 50 נק׳ לרמה 2') && pf.includes('ברמה 3: סרט ראש') && (await txt('.pf-top .pf-nums')).replace(/\s+/g, ' ').startsWith('1 אימונים') && (await p.$$('#profile > *')).length === 4 && pf.includes('סט +10 · שיא אישי +30 · סיום אימון +100'), pf.slice(0, 300));
  check('profile shows a few achievements: the one earned, then the next to go for', (await p.$$('.bdg')).length === 4 && (await p.evaluate(() => [...document.querySelectorAll('.bdg.on')].map((x) => x.innerText.trim()).join())) === 'אימון ראשון' && (await txt('.pf-sec .sec')).replace(/\s+/g, ' ') === 'הישגים 1/12', await txt('.badges'));
  await p.click('#bdgAll'); await p.waitForTimeout(200);
  check('all of them are a tap away, and a tap puts them away again', (await p.$$('.bdg')).length === 12 && (await p.getAttribute('#bdgAll', 'aria-expanded')) === 'true' && (await p.evaluate(() => document.activeElement.id)) === 'bdgAll', await txt('.badges'));
  await p.click('#bdgAll'); await p.waitForTimeout(200);
  check('(put away)', (await p.$$('.bdg')).length === 4, await txt('.badges'));
  check('the achievement reached the cloud with the settings', cloud['data/users/u_test/cfg'].me.badges.first > 0, cloud['data/users/u_test/cfg'].me);
  await p.click('#lookBtn'); await p.waitForTimeout(250);
  await p.fill('#lkName', 'ליאור'); await p.dispatchEvent('#lkName', 'change');
  await p.click('#sheet [data-look="shirt"][data-v="2"]'); await p.click('#sheet [data-look="hair"][data-v="3"]'); await p.waitForTimeout(200); await shot('g1q-look');
  check('the character sheet redraws the figure with each choice', (await p.evaluate(() => document.querySelector('#lkStage').innerHTML.includes('#E0364F') && document.querySelector('#sheet [data-look="shirt"][data-v="2"]').getAttribute('aria-pressed'))) === 'true' && (await p.evaluate(() => S.cfg.me.look.hair)) === 3, await p.evaluate(() => JSON.stringify(S.cfg.me)));
  await p.click('#sheet [data-close]'); await p.waitForTimeout(1200);
  check('the name and the look are kept and shown', (await txt('.pf-name')) === 'ליאור' && !!(await p.$('.pf-edit')) && cloud['data/users/u_test/cfg'].me.name === 'ליאור' && cloud['data/users/u_test/cfg'].me.look.shirt === 2, cloud['data/users/u_test/cfg'].me);
  await tab(p, 'home');
  check('today greets the player by name', (await txt('#playerBtn')).includes('היי, ליאור') && (await p.evaluate(() => document.querySelector('#playerBtn .av.bust').innerHTML.includes('#E0364F'))), await txt('#playerBtn'));
  check('with the workout finished the mark on "today" is gone', !(await p.$('#tabbar .live')), 'live');
  await p.evaluate(() => setSync('error')); await p.waitForTimeout(150);
  check('with no connection the phone says so in one quiet line', (await p.isVisible('#syncNote')) && (await txt('#syncNote')) === 'אין חיבור, נשמר במכשיר' && (await p.evaluate(() => document.querySelector('#app').dataset.sync)) === 'off' && (await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)), await txt('.brand'));
  await p.evaluate(() => setSync('cloud')); await p.waitForTimeout(150);
  check('and the line goes away when the connection is back', (await p.isHidden('#syncNote')) && (await p.evaluate(() => document.querySelector('#app').dataset.sync)) === 'on', await txt('.brand'));
  await p.click('#playerBtn'); await p.waitForTimeout(200);
  check('the player strip opens the profile', (await p.evaluate(() => S.view)) === 'profile' && (await p.evaluate(() => document.querySelector('#tabbar [data-view="profile"]').getAttribute('aria-current'))) === 'page', await p.evaluate(() => S.view));
  check('the profile is the character and its game: no settings on it', !(await p.$('#profile [data-set]')) && !(await p.$('#profile .seg')), await txt('#profile'));
  await p.click('#setBtn'); await p.waitForTimeout(250);
  await p.click('#sheet [data-set="goal"][data-v="1"]'); await p.waitForTimeout(200);
  check('the answers can be changed in the settings', (await p.evaluate(() => S.cfg.me.goal)) === 1 && (await p.getAttribute('#sheet [data-set="goal"][data-v="1"]', 'aria-pressed')) === 'true' && (await p.getAttribute('#sheet [data-set="exp"][data-v="1"]', 'aria-pressed')) === 'true' && (await p.getAttribute('#sheet [data-set="lang"][data-v="he"]', 'aria-pressed')) === 'true', await txt('#sheet'));
  await p.click('#sheet [data-set="buzz"]'); await p.waitForTimeout(150);
  check('vibration is a switch, and it is kept on this device', (await p.getAttribute('#sheet [data-set="buzz"]', 'aria-checked')) === 'false' && (await p.getAttribute('#sheet [data-set="buzz"]', 'role')) === 'switch' && (await p.evaluate(() => [S.buzz, JSON.parse(localStorage.getItem('ul4:v1')).buzz].join())) === 'false,false', await txt('#sheet'));
  await p.click('#sheet [data-set="buzz"]'); await p.waitForTimeout(150);
  check('(and back on)', (await p.getAttribute('#sheet [data-set="buzz"]', 'aria-checked')) === 'true' && (await p.evaluate(() => S.buzz)) === true, await txt('#sheet'));
  await p.click('#sheet [data-set="lang"][data-v="en"]'); await p.waitForTimeout(250);
  check('the language can be changed in the settings, and the sheet follows at once', (await p.evaluate(() => [LANG, document.documentElement.dir, S.cfg.lang].join())) === 'en,ltr,en' && (await txt('#sheet')).includes('Language') && (await txt('#sheet h2')) === 'Settings' && (await txt('#sheet')).includes('Backup'), await txt('#sheet'));
  await p.click('#sheet [data-set="lang"][data-v="he"]'); await p.waitForTimeout(250);
  await p.click('#obAgain'); await p.waitForTimeout(300);
  check('the opening screens can be seen again, with the answers filled in, and the settings are out of the way', (await p.isVisible('#ob')) && (await txt('#obTitle')) === 'ברוכים הבאים ל-gymi' && (await p.isHidden('#sheet')), await txt('#ob'));
  await p.click('#obNext'); await p.waitForTimeout(350);
  check('and they remember the name', (await p.inputValue('#obName')) === 'ליאור', await p.inputValue('#obName'));
  await p.click('#obBack'); await p.waitForTimeout(300); await p.click('#obSkip'); await p.waitForTimeout(300);
  check('skip closes them without changing anything', (await p.isHidden('#ob')) && (await p.evaluate(() => [S.cfg.me.name, S.cfg.me.exp, S.cfg.me.goal].join())) === 'ליאור,1,1', await p.evaluate(() => JSON.stringify(S.cfg.me)));
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
  check('second device: next up is workout 2', (await cur(q)) === 'אימון שני – גוף תחתון A, הבא' && (await t2('#history')).includes('5 סטים') && !(await q.$('#history .xp-tag')) && (await q.$$('#history .row-b > *')).length === 3, [await cur(q), await t2('#history')]);
  check('second device: the opening screens are not shown again', (await q.isHidden('#ob')) && (await q.evaluate(() => S.cfg.me.ob > 0 && S.cfg.me.exp === 1)), await q.evaluate(() => JSON.stringify(S.cfg.me)));
  check('second device: the same player, level and character', (await t2('#playerBtn')).includes('היי, ליאור') && (await q.evaluate(() => [meNow().T.xp, S.cfg.me.look.shirt, S.cfg.me.badges.first > 0].join())) === '150,2,true', await t2('#playerBtn'));
  check('second device: the note arrived with the settings', (await q.evaluate(() => S.cfg.notes.inclineSmith || '')).includes('מושב'), 'note');
  await q.click('.tab[data-tab="0"]'); await q.waitForTimeout(400);
  check('recovery check is one question that takes the screen before the workout', (await t2('#pre')).includes('השרירים התאוששו?') && !(await q.$('#pre [data-mu]')) && !(await q.isVisible('#exList')) && !(await q.isVisible('#dock')), await t2('#pre'));
  await q.click('#preEdit'); await q.waitForTimeout(200);
  check('"not quite" opens the muscles one by one', (await t2('#pre')).includes('חזה') && (await t2('#pre')).includes('עדיין תפוס'), await t2('#pre'));
  await q.click('#preAll'); await q.waitForTimeout(250);
  check('once answered the question steps aside and the first exercise shows', !(await q.isVisible('#pre')) && (await q.isVisible('#exList')) && (await q.isVisible('#dkHit')) && (await q.evaluate(() => JSON.stringify(preOf(0)))) === '{"chest":1,"back":1}', await q.evaluate(() => JSON.stringify(preOf(0))));
  check('week 2 asks for one rep closer to failure', (await q.evaluate(() => { const P = phase(0, null); return P.wk + ':' + P.rir; })) === '2:2' && (await t2('.fx-rx')).includes('2 חזרות לפני כשל'), await t2('.fx-rx'));
  await more(q);
  check('second device: last time shown', (await t2('#sheet .prev-line')).includes('60×10'), await t2('#sheet'));
  await shut(q);
  await shot('g2-target', q);
  check('beat weight: top of the range last time moves the load up', (await t2('#dkKg')).startsWith('62.5') && (await t2('#dkReps')).startsWith('9') && (await t2('.dk-top .goal')) === 'יותר משקל' && (await t2('.ex.open .setp.cur')).includes('62.5×9') && !(await t2('.dk-set')).includes('62.5'), [await t2('#dkKg'), await t2('.dk-top'), await t2('.ex.open .sets')]);
  await q.click('#dkWhy'); await q.waitForTimeout(150);
  check('a tap on the goal says why, and another tap puts it away', (await t2('.dk-why')).includes('הגעת לראש טווח החזרות, אז המשקל עולה'), await t2('#dock'));
  await q.click('#dkWhy'); await q.waitForTimeout(150);
  check('(the reason is gone again)', !(await q.$('.dk-why')), await t2('#dock'));
  await q.click('#dkHit'); await q.waitForTimeout(1500);
  const cB = sess().find((x) => !x.end);
  check('one tap on the check logs exactly the target', !!cB && cB.sets.ua1[0].kg === 62.5 && cB.sets.ua1[0].reps === 9 && cB.sets.ua1[0].tk === 62.5 && cB.sets.ua1[0].tr === 9 && cB.wk === 2 && cB.rir === 2, cB && cB.sets.ua1);
  check('live sync back to the first device', !!(await p.$('.tab.live')) && (await cur(p)).endsWith('באמצע'), await cur(p));
  check('a personal best is worth 30 more', (await t2('.rt-log .xp-tag')) === '+40' && (await t2('.rt-log')).includes('שיא אישי') && (await q.evaluate(() => meNow().T.xp)) === 190, await t2('.rt-log'));
  await skip(q); await q.waitForTimeout(100);
  await more(q); await q.click('#moreSame'); await q.waitForTimeout(400);
  check('"log the rest at target" fills the remaining sets', (await q.evaluate(() => doneCount(live(0), findEx('ua1')))) === 3, await q.evaluate(() => doneCount(live(0), findEx('ua1'))));
  check('crossing 200 points is a level-up, said at once', (await q.evaluate(() => [meNow().T.xp, S.lvl, document.querySelector('#toast').hidden].join())) === '210,2,false' && (await t2('#toast')) === 'רמה 2!', [await q.evaluate(() => meNow().T.xp), await t2('#toast')]);
  check('a finished exercise asks one question', (await q.$$('.fb-dock [data-fb]')).length === 3 && (await t2('.fb-dock')).includes('כבד מדי') && (await t2('.fb-dock')).includes('משהו כאב?') && (await t2('.fb-dock')).includes('איך היה: לחיצת חזה בשיפוע עליון בסמית׳'), await t2('#dock'));
  await p.waitForTimeout(400);
  check('the first device follows the level without a fanfare of its own', (await p.evaluate(() => [S.lvl, document.querySelector('#toast').hidden].join())) === '2,true', await p.evaluate(() => S.lvl));
  await shot('g3-feedback', q);
  await q.click('.fb-dock [data-fb="load"][data-v="1"]'); await q.waitForTimeout(1400);
  const fbB = (sess().find((x) => !x.end) || {}).fb;
  check('feedback saved and the panel closes', !(await q.$('.fb-dock')) && !!fbB && fbB.ua1.load === 1 && fbB.ua1.pain === 0, fbB);
  check('the finished exercise made way for the next one', (await q.evaluate(() => S.open)) === 'ua2' && (await t2('#wkTitle .sub')) === 'תרגיל 2 מתוך 8' && (await q.evaluate(() => document.querySelector('#wkBar .bar i').style.width)) === '14%', await t2('#wkTitle'));
  await q.click('#exPrev'); await q.waitForTimeout(350);
  check('a finished exercise offers the next one', (await t2('#dock')).includes('התרגיל הושלם') && !!(await q.$('#dkNext')), await t2('#dock'));
  await more(q);
  check('and keeps its answer for changing, under "more"', (await q.getAttribute('#sheet [data-fb="load"][data-v="1"]', 'aria-pressed')) === 'true' && (await t2('#sheet')).includes('משהו כאב?') && !(await q.$('#moreSame')), await t2('#sheet'));
  await shut(q);
  await q.click('#dkNext'); await q.waitForTimeout(350);
  check('"next exercise" moves on to the first one with sets left', (await q.evaluate(() => S.open)) === 'ua2' && !!(await q.$('#dkHit')), await q.evaluate(() => S.open));
  await q.click('#backBtn'); await q.waitForTimeout(200); await tab(q, 'progress');
  check('progress holds the strength and the workouts, and nothing else', !(await q.$('#backup')) && (await q.$$('.v-progress > section')).length === 2, await t2('.v-progress'));
  await tab(q, 'profile'); await q.click('#setBtn'); await q.waitForTimeout(250);
  check('the backup waits in the settings', (await t2('#backup')).includes('שמירה לקובץ') && (await t2('#backup')).includes('שחזור מקובץ') && (await t2('#backup')).includes('ייצוא CSV') && (await t2('#syncNote2')).length > 4, await t2('#backup'));
  await q.click('#exportBtn'); await q.waitForTimeout(200); await q.click('#sheet [data-close]'); await q.waitForTimeout(250);
  await tab(q, 'home'); await q.click('#homeGo'); await q.waitForTimeout(400);
  check('export offers a csv', (await q.evaluate(() => window.__saved.length)) === 1, 'saved');

  // ---------- swap inside the same movement pattern ----------
  await go(q, 'ua5');
  check('the list jumps straight to an exercise', (await q.evaluate(() => S.open)) === 'ua5' && (await t2('#wkTitle .sub')) === 'תרגיל 5 מתוך 8' && (await q.isHidden('#sheet')), await t2('.fx-head'));
  await q.click('.ex.open .swap'); await q.waitForTimeout(300); await shot('g4-swap', q);
  const swNames = await q.evaluate(() => [...document.querySelectorAll('.sw-opt .sw-t b')].map((x) => x.textContent));
  check('swap offers only the same movement pattern', swNames.length === 2 && swNames.includes('לחיצת חזה בשיפוע עם משקולות יד') && swNames.includes('לחיצת חזה בשיפוע עליון בסמית׳') && (await t2('.sw-opt .sw-t')).includes('משקולות יד') && !(await t2('#sheet .sw-list')).match(/[A-Za-z]{4}/) && (await t2('#sheet h2')) === 'במה להחליף?' && (await t2('#sheet .kicker')) === 'לחיצת חזה במכונה', swNames);
  check('the swap sheet opens quiet: the suggestions, and nothing to answer yet', !(await q.$('#sheet .mu-row')) && !(await q.$('#sheet .sw-b')) && (await q.$$('#sheet .sw-list button')).length === 2 && !(await q.$('#sheet .tagx')), await t2('#sheet'));
  await q.click('.sw-row[data-sel="inclineDb"]'); await q.waitForTimeout(250);
  check('a tap on an exercise asks the one thing a change needs: today only, or for good', (await q.$$('#sheet .sw-b .btn')).length === 2 && (await t2('#sheet .sw-b')).replace(/\s+/g, ' ').trim() === 'רק היום קבוע' && (await q.getAttribute('.sw-row[data-sel="inclineDb"]', 'aria-expanded')) === 'true', await t2('#sheet'));
  await q.click('.sw-opt [data-sw="inclineDb"][data-mode="always"]'); await q.waitForTimeout(1300);
  await q.click('.ex.open .how'); await q.waitForTimeout(250);
  check('swap keeps the slot: new name, same sets and reps, and a word that the demo is of a similar movement', (await t2('.ex[data-id="ua5"] .ex-name')) === 'לחיצת חזה בשיפוע עם משקולות יד' && (await t2('#sheet .en-name')) === 'Incline Dumbbell Press' && (await t2('.ex[data-id="ua5"] .fx-rx')).includes('8–12 חזרות') && (await q.$$('.ex[data-id="ua5"] .setp')).length === 2 && (await t2('#sheet')).includes('תנועה דומה'), [await t2('.ex[data-id="ua5"] .fx-head'), await t2('#sheet')]);
  await shut(q);
  const sw = await q.evaluate(() => ({ cfg: S.cfg.swap.ua5, mv: live(0).mv.ua5, chest: muscleVolume(weekItems()).chest }));
  check('swap is stored and the weekly chest volume is unchanged', sw.cfg === 'inclineDb' && sw.mv === 'inclineDb' && sw.chest.d === 8, sw);
  check('swap reached the cloud settings', cloud['data/users/u_test/cfg'].swap.ua5 === 'inclineDb', cloud['data/users/u_test/cfg'].swap);

  // ---------- change exercises freely: any exercise by its muscle, then add, move and remove in the plan ----------
  const cfgKey = 'data/users/u_test/cfg';
  await go(q, 'ua6'); await q.click('.ex.open .swap'); await q.waitForTimeout(300);
  check('the picker opens on the suggested swaps', !(await q.$('#sheet .mu-row')) && (await q.$$('.sw-opt')).length === 2 && (await t2('.sw-more')).includes('תרגילים אחרים') && (await t2('.sw-more')).includes('שאל את אילון'), await t2('#sheet'));
  await q.click('.sw-more [data-pick]'); await q.waitForTimeout(250);
  check('"other exercises" brings every muscle, starting from the one in hand', (await q.getAttribute('.mu-row [data-pick="triceps"]', 'aria-pressed')) === 'true' && (await q.$$('.mu-row [data-pick]')).length === 12 && !(await q.$('.sw-more [data-pick]')), await t2('.mu-row'));
  await q.click('.mu-row [data-pick="biceps"]'); await q.waitForTimeout(250); await shot('g4b-pick', q);
  const bi = await q.$$eval('.sw-opt .sw-t b', (a) => a.map((x) => x.textContent));
  check('a muscle lists every exercise for it', bi.length === 4 && bi.includes('כפיפת פטישים') && bi.includes('כפיפת מרפקים בכבל') && !(await q.$('#sheet .sw-b')), bi);
  await q.click('.sw-row[data-sel="hammerCurl"]'); await q.waitForTimeout(250);
  check('an exercise of another kind has one answer: swap', (await q.$$('#sheet .sw-b .btn')).length === 1 && (await t2('#sheet .sw-b')).trim() === 'החלף', await t2('#sheet .sw-b'));
  await q.click('.sw-opt [data-sw="hammerCurl"]'); await q.waitForTimeout(1400);
  const rp = await q.evaluate(() => { const ids = planIds(0), id = ids[5], c = S.cfg.slots[id] || {}, s = live(0); return { n: ids.length, old: ids.indexOf('ua6'), a: c.a, reps: c.reps, sets: c.sets, w: c.w, open: S.open === id, o: s.o.includes(id) && !s.o.includes('ua6'), name: document.querySelector('#exList .ex-name').textContent, rx: document.querySelector('.fx-rx').textContent.replace(/\s/g, '') + '|' + document.querySelectorAll('#exList .setp').length, tri: muscleVolume(weekItems()).triceps.d, kept: !!planEx('ua6') }; });
  check('a different kind of exercise takes the slot\'s place, with numbers of its own', rp.n === 8 && rp.old === -1 && rp.a === 'hammerCurl' && rp.reps === '10–15' && rp.sets === 2 && rp.w === 0 && rp.open && rp.o && rp.name === 'כפיפת פטישים' && rp.rx.startsWith('10–15') && rp.rx.endsWith('|2') && rp.tri === 2 && rp.kept, rp);
  check('the changed list reached the cloud with the settings', Object.keys(cloud[cfgKey].slots).length === 1 && cloud[cfgKey].order[0].length === 8 && !cloud[cfgKey].order[0].includes('ua6'), cloud[cfgKey].order);
  await p.waitForTimeout(400);
  check('the other device follows the changed list', (await p.evaluate(() => planSlots(0).map((x) => x.a)[5])) === 'hammerCurl', await p.evaluate(() => planIds(0)));
  await list(q); await q.click('#editWk'); await q.waitForTimeout(300);
  check('"edit this workout" opens the plan on the workout in hand', (await q.evaluate(() => [S.sheet, S.msPage, S.msW].join())) === 'meso,ex,0' && (await t2('#sheet h2')) === 'גוף עליון A' && !!(await q.$('#sheet [data-base="ua1"]')) && (await q.$$('#sheet .bl-row')).length === 8, await t2('#sheet'));
  await q.click('#sheet [data-msp=""]'); await q.waitForTimeout(250);
  const menu = await t2('#sheet');
  check('the plan is a short menu: the round, the four workouts and the few things to set', (await q.$$('#sheet .m-row')).length === 8 && (await q.$$('#sheet [data-msw]')).length === 4 && menu.includes('גוף תחתון B') && menu.includes('8 תרגילים') && menu.includes('סטים בשבוע לפי שריר') && menu.includes('קפיצת משקל') && menu.includes('שבועות בסבב') && !(await q.$('#sheet .bl-row')) && !(await q.$('#sheet .vol-row')) && !(await q.$('#sheet select')) && (await q.evaluate(() => { const el = document.querySelector('#sheet .sheet-in'); return el.scrollHeight <= el.clientHeight + 1; })), menu);
  await q.click('#sheet [data-msw="3"]'); await q.waitForTimeout(250);
  await q.click('[data-addw="3"]'); await q.waitForTimeout(300);
  check('adding an exercise opens the picker on a muscle of that workout', (await t2('#sheet .kicker')).includes('הוספת תרגיל') && (await t2('#sheet .kicker')).includes('גוף תחתון B') && (await q.getAttribute('.mu-row [data-pick="quads"]', 'aria-pressed')) === 'true' && !(await q.$('.mu-row [data-pick="rec"]')), await t2('#sheet .kicker'));
  await q.click('.sw-opt [data-add="legPress"]'); await q.waitForTimeout(350); await shot('g4c-builder', q);
  const ad = await q.evaluate(() => { const ids = planIds(3), c = S.cfg.slots[ids[ids.length - 1]] || {}; return { n: ids.length, a: c.a, reps: c.reps, sheet: S.sheet, id: ids[ids.length - 1] }; });
  check('the added exercise joins the end of its workout, and the plan is back on screen', ad.n === 8 && ad.a === 'legPress' && ad.reps === '8–12' && ad.sheet === 'meso' && !!(await q.$('#sheet [data-base="' + ad.id + '"]')), ad);
  await q.click('[data-bled="3"]'); await q.waitForTimeout(200);
  await q.click('[data-mvs="' + ad.id + '"][data-d="-1"]'); await q.waitForTimeout(200);
  check('the arrows move an exercise within its workout', (await q.evaluate((id) => planIds(3).indexOf(id), ad.id)) === 6 && (await q.evaluate(() => planIds(3)[7])) === 'lb7', await q.evaluate(() => planIds(3)));
  await q.click('[data-rm="lb7"]'); await q.waitForTimeout(200);
  check('the cross takes an exercise off its workout, and old workouts can still read it', (await q.evaluate(() => [planIds(3).includes('lb7'), planIds(3).length, !!planEx('lb7'), wkOf('lb7')].join())) === 'false,7,true,3', await q.evaluate(() => planIds(3)));
  await q.click('[data-bled="3"]'); await q.waitForTimeout(200);
  check('"done" brings the set counts back', !!(await q.$('#sheet [data-base="lb1"]')) && !(await q.$('#sheet [data-rm]')), 'builder');
  await q.evaluate(() => window.gymiBack()); await q.waitForTimeout(250);
  check('the phone\'s back button steps from a page of the plan to its menu, where a changed plan can be reset', (await q.evaluate(() => [S.sheet, S.msPage].join())) === 'meso,' && !!(await q.$('#planReset')) && (await q.isVisible('#sheet')), await t2('#sheet'));
  await q.click('#sheet [data-close]'); await q.waitForTimeout(300);
  // ---------- mesocycle sheet: volume landmarks, set counts, increments ----------
  await list(q); await q.click('#editWk'); await q.waitForTimeout(300); await q.click('#sheet [data-msp=""]'); await q.waitForTimeout(250); await shot('g5-meso', q);
  const ms = await t2('#sheet');
  check('mesocycle sheet shows the RIR ramp and a deload', ms.includes('3 חזרות') && ms.includes('עד כשל') && ms.includes('שבוע קל') && !/מזוציקל|דילואד|RIR/.test(ms), ms.slice(0, 200));
  check('the menu says when a muscle is out of its range', (await t2('#sheet [data-msp="vol"]')).includes('שריר אחד מחוץ לטווח'), await t2('#sheet [data-msp="vol"]'));
  await q.click('#sheet [data-msp="vol"]'); await q.waitForTimeout(250);
  const flags = await q.evaluate(() => [...document.querySelectorAll('.vol-row')].map((r) => r.querySelector('.vol-n').textContent + ':' + r.querySelector('.vol-v b').textContent + ':' + (r.querySelector('.vol-flag') ? r.querySelector('.vol-flag').textContent : '')));
  check('fractional volume and the below-minimum warning', flags.some((f) => f.startsWith('חזה:8:') && !f.includes('מתחת')) && flags.some((f) => f.startsWith('שוקיים:6:') && f.includes('מתחת למינימום')) && flags.some((f) => f.startsWith('ירך אחורית:10.5:')), flags);
  for (const [w, id] of [[1, 'la5'], [3, 'lb6']]) { await q.click('#sheet [data-msp=""]'); await q.waitForTimeout(200); await q.click('#sheet [data-msw="' + w + '"]'); await q.waitForTimeout(200); await q.click('[data-base="' + id + '"][data-n="4"]'); await q.waitForTimeout(200); }
  await q.click('#sheet [data-msp=""]'); await q.waitForTimeout(200);
  check('with the sets added, the menu has nothing to warn about', !(await q.$('#sheet [data-msp="vol"] small')), await t2('#sheet [data-msp="vol"]'));
  await q.click('#sheet [data-msp="vol"]'); await q.waitForTimeout(250);
  const flags2 = await q.evaluate(() => [...document.querySelectorAll('.vol-row')].map((r) => r.querySelector('.vol-n').textContent + ':' + r.querySelector('.vol-v b').textContent + ':' + (r.querySelector('.vol-flag') ? 'flag' : '')));
  check('adding sets in the builder clears the warning', flags2.includes('שוקיים:8:'), flags2);
  await q.click('#sheet [data-msp=""]'); await q.waitForTimeout(200); await q.click('#sheet [data-msp="inc"]'); await q.waitForTimeout(250);
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
  check('what the old "muscle feel" answer fed is gone with the question', (await p.evaluate(() => typeof lowPump)) === 'undefined' && (await p.evaluate(() => 'top' in mesoSummary(S.cfg.meso.id))) === false, 'lowPump');
  await p.click('#preDone'); await p.waitForTimeout(400);
  check('"continue" closes the recovery step with the answers kept', !(await p.isVisible('#pre')) && (await p.isVisible('#dkHit')) && (await rx('la3')) === '2×10–15' && (await rx('la2')) === '4×8–10', [await rx('la3'), await rx('la2')]);
  // sore quads hold last week's performance instead of adding a rep
  check('sore muscle holds the target', (await txt('#dkKg')).startsWith('100') && (await txt('#dkReps')).startsWith('8') && (await txt('.dk-top .goal')) === 'כמו בפעם הקודמת', await txt('.dk-top'));
  await log(p, 12); await p.waitForTimeout(500);
  check('calibration: far more reps than predicted re-aims the next set', (await txt('.rt-state')).includes('מעלים ל-') && (await p.evaluate(() => { const T = targetOf(findEx('la1'), 1, live(1)); return T.mode + ':' + T.kg; })).startsWith('cal:1'), [await txt('.rt-state'), await p.evaluate(() => JSON.stringify(targetOf(findEx('la1'), 1, live(1))))]);
  await skip(p); await p.waitForTimeout(200); await shot('g7-cal');
  const calKg = await p.evaluate(() => targetOf(findEx('la1'), 1, live(1)).kg);
  check('calibrated weight is rounded to the equipment step', calKg % 5 === 0 && calKg > 100 && (await txt('#dkKg')).startsWith(String(calKg)) && (await txt('.dk-top .goal')) === 'משקל מעודכן', [calKg, await txt('#dkKg'), await txt('.dk-top')]);
  await log(p, 4); await p.waitForTimeout(500); await skip(p); await p.waitForTimeout(200);
  const dn = await p.evaluate(() => targetOf(findEx('la1'), 2, live(1)));
  check('down-set: under the range drops the load 10%', dn.mode === 'down' && dn.kg <= calKg * 0.9 && dn.kg % 5 === 0 && dn.reps >= 6 && dn.reps <= 10 && (await txt('.dk-top .goal')) === 'פחות משקל', dn);
  await p.click('#dkHit'); await p.waitForTimeout(500);
  check('feedback panel sits in the rest dock', (await txt('.dock.rest .fb-dock')).includes('משהו כאב?') && (await txt('.dock.rest .fb-dock')).includes('האק סקוואט'), await txt('#dock'));
  await p.click('.fb-dock [data-painask]'); await p.waitForTimeout(150); await p.click('.fb-dock [data-fb="pain"][data-v="2"]'); await p.waitForTimeout(400);
  const cut = await p.evaluate(() => ({ cut: live(1).cut, la3: findEx('la3').sets, off: findEx('la3').cut, card: document.querySelector('.fb-dock .fb-stop') ? document.querySelector('.fb-dock .fb-stop').innerText : '', asked: document.querySelectorAll('.fb-dock [data-fb="load"]').length }));
  check('strong pain stops that muscle for today and offers a gentler movement, in a few calm words', cut.cut.la3 === 'la1' && cut.la3 === 0 && cut.off && cut.card.includes('עוצרים להיום') && cut.card.includes('גובלט סקוואט') && cut.card.includes('נוח יותר למפרקים') && cut.card.includes('כדאי להיבדק') && cut.asked === 0, cut);
  await p.waitForTimeout(1500); await shot('g8-pain'); await p.click('.fb-dock [data-swapto]'); await p.waitForTimeout(300);
  check('accepting the suggestion swaps from the next workout', (await p.evaluate(() => S.cfg.swap.la1)) === 'gobletSquat' && (await txt('.fb-dock .fb-stop')).includes('מהאימון הבא') && !(await p.$('.fb-dock [data-swapto]')) && (await p.evaluate(() => findEx('la1').mv)) === 'hackSquat', await p.evaluate(() => S.cfg.swap));
  await p.click('#fbSkip'); await p.waitForTimeout(400);
  check('closing the note leaves the answer in place', !(await p.$('.fb-dock')) && (await p.evaluate(() => live(1).fb.la1.pain)) === 2, await txt('#dock'));
  await go(p, 'la5');

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
  check('summary card renders', (await txt('#sheet')).includes('שינוי כוח לפי תרגיל') && (await txt('#sheet')).includes('סטים בשבוע לפי שריר') && !(await txt('#sheet')).includes('הגיבו') && !(await p.$('#sheet .stats')) && (await txt('#sheet .sum-line')).includes('אימונים') && (await p.$$eval('#sheet .sum-list li', (l) => l.every((x) => x.children.length === 2))), (await txt('#sheet')).slice(0, 300));
  await p.click('#sheetClose'); await p.waitForTimeout(300);

  // ---------- fix a past workout on the second device ----------
  const doneId = Object.keys(cloud).find((k) => cloud[k].end > 0 && cloud[k].w === 0 && cloud[k].wk === 1), ts0 = cloud[doneId].ts;
  await q.evaluate((id) => openEditor(id.split('/').pop()), doneId); await q.waitForTimeout(250);
  const edN = await q.$$eval('#sheet .ed-ex', (l) => l.length);
  check('the editor of a past workout opens on what was logged; the rest waits behind one link', edN >= 1 && edN < 8 && (await t2('#edAll')).includes('שלא נרשמ') && !(await q.$('.ed-row[data-ex="ua8"]')), [edN, await t2('#edAll')]);
  await q.click('#edAll'); await q.waitForTimeout(250);
  check('(the link brings every exercise)', (await q.$$('#sheet .ed-ex')).length === 8 && !(await q.$('#edAll')), await q.$$eval('#sheet .ed-ex', (l) => l.length));
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
