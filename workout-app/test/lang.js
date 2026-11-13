// The app in English, screen by screen: node test/lang.js  (needs playwright; SHOTS=dir saves screenshots)
// Starts from a log of three weeks, with English chosen in the settings on a Hebrew phone. At every stop nothing Hebrew may be
// left on screen (texts, labels for screen readers, placeholders), the layout runs left to right, and a change of language
// reaches what is already on screen.
const { chromium } = require('playwright'), path = require('path');
const PREVIEW = 'file://' + require('./wrap.js'), SHOTS = process.env.SHOTS;
const snap = (pg, name, full) => (SHOTS ? pg.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: !!full }) : null);
const ok = [], bad = [], errs = [];
const check = (name, cond, info) => (cond ? ok : bad).push(name + (cond ? '' : ' -> ' + JSON.stringify(info)));
const initScript = () => {
  window.__calls = [];
  const sample = async (input, opts) => {
    const last = input[input.length - 1].content, asked = last.split('\n\n').pop();
    window.__calls.push({ first: input[0].content, last });
    const full = /\blog\b/i.test(asked) ? 'Logged three sets of pull-ups.\n@@LOG {"ex":"ua2","sets":[[40,8],[40,8],[40,7]]}' : 'Verdict: Partly suitable\nIn the photo: a seated chest press.\n• Same muscle group, less work for the upper chest\n• Keep **3 sets × 6–10** and rest 2–3 min';
    await new Promise((r) => setTimeout(r, 30)); opts.onText({ text: full, delta: full });
    return { text: full, truncated: false };
  };
  sample.limits = async () => ({ images: { maxCount: 4 } });
  window.claude = { use: async (n) => (n === 'sample' ? sample : n === 'downloads' ? { save: async () => ({ status: 'saved' }) } : null) };
};
async function open(b, store, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: 2, locale: o.locale || 'he-IL' }), p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + String(e.stack || '').split('\n').slice(1, 3).join(' ')));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.addInitScript(initScript);
  if (store) await p.addInitScript((s) => { if (!localStorage.getItem('ul4:v1')) localStorage.setItem('ul4:v1', s); }, store);
  await p.goto(PREVIEW); await p.waitForTimeout(800);
  return p;
}
/* every Hebrew text left on the page: text nodes, and the attributes that are read out or shown. The names of the languages are theirs to keep */
const hebOn = (p) => p.evaluate(() => {
  const H = /[֐-׿]/, out = [], skip = '[data-lang],[data-set="lang"],.ob-lang,script,style', app = document.querySelector('#app');
  const w = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) if (H.test(n.nodeValue) && !n.parentElement.closest(skip)) out.push(n.nodeValue.trim().slice(0, 40));
  for (const el of app.querySelectorAll('*')) { if (el.matches(skip)) continue; for (const a of ['aria-label', 'title', 'placeholder', 'alt', 'label']) { const v = el.getAttribute(a); if (v && H.test(v)) out.push(a + '=' + v.slice(0, 40)); } }
  return out;
});
(async () => {
  const b = await chromium.launch();
  /* the log: three weeks of the four workouts, every set done, each exercise rated */
  let p = await open(b, null);
  const store = await p.evaluate(() => {
    const now = Date.now(), day = 864e5, ses = {}; let k = 0;
    for (let wk = 1; wk <= 3; wk++) for (let w = 0; w < 4; w++) {
      const ts = now - ((3 - wk) * 7 + (5 - w) * 1.5 + 1) * day, id = 'e' + (++k), sets = {}, fb = {};
      for (const e of PLAN[w].ex) { const kg = 40 + wk * 2.5; sets[e.id] = Array.from({ length: e.sets }, (_, i) => ({ kg, reps: 8 + (i ? 0 : 1), done: true, t: ts + i * 6e4, tk: kg, tr: 8 })); fb[e.id] = { pain: 0, pump: 2, load: 1 }; }
      ses[id] = { id, v: 3, w, ts, end: ts + 3e6, mt: ts, upd: ts, ft: ts, m: 'm1', wk, dl: 0, rir: rirFor(wk, 5), n: {}, mv: {}, sore: {}, cut: {}, fb, sets };
    }
    return JSON.stringify({ sound: false, dirty: [], gone: [], sessions: ses, cfg: { upd: 5, lang: 'en', weeks: 5, inc: {}, swap: {}, notes: {}, base: {}, meso: { id: 'm1', n: 1, start: 0, early: 0 }, past: [], me: { name: 'Sam', made: 1, ob: 1, exp: 1, goal: 0 } } });
  });
  await p.context().close();
  p = await open(b, store);
  const txt = (sel) => p.evaluate((s) => (document.querySelector(s) || { innerText: '' }).innerText.replace(/\n/g, ' '), sel);
  const clean = async (where) => { const h = await hebOn(p); check('nothing Hebrew is left: ' + where, h.length === 0, h.slice(0, 6)); };
  const tab = async (v) => { await p.click('#tabbar [data-view="' + v + '"]'); await p.waitForTimeout(250); };

  // ---- today
  check('the language of the settings wins over the language of the phone', (await p.evaluate(() => [LANG, document.documentElement.dir, document.documentElement.lang, document.querySelector('#app').dir].join())) === 'en,ltr,en,ltr', await p.evaluate(() => LANG));
  const home = await txt('#home');
  check('today is in English', home.includes('Hi, Sam') && home.includes('Level ') && home.includes('Workout 1') && home.includes('Upper Body A') && home.includes('8 exercises') && home.includes('Start workout') && home.includes('Week 4 of 5') && home.includes('Plan'), home);
  check('the tabs are in English', (await txt('#tabbar')).replace(/\s+/g, ' ').trim() === 'Today Profile Progress Eilon', await txt('#tabbar'));
  check('the week path uses the short English names', (await txt('#tabs')).replace(/\s+/g, ' ').includes('Upper A') && (await txt('#tabs')).includes('Lower B') && (await p.getAttribute('#tabs .tab[data-tab="0"]', 'aria-label')) === 'Workout 1 – Upper Body A, next', await txt('#tabs'));
  check('arrows that mean "onward" point right', (await p.evaluate(() => getComputedStyle(document.querySelector('#planBtn .i.dir')).transform)) === 'matrix(-1, 0, 0, 1, 0, 0)', 'transform');
  await clean('today'); await snap(p, 'en1-home', true);

  // ---- the workout: the recovery question, the exercise, the bar at the bottom
  await p.click('#homeGo'); await p.waitForTimeout(400);
  check('the recovery question is in English', (await txt('#pre')).includes('Have your muscles recovered?') && (await txt('#preAll')) === 'Yes, all good' && (await txt('#preEdit')) === 'Not quite' && (await txt('#preSkip')) === 'Skip', await txt('#pre'));
  await clean('the recovery question');
  await p.click('#preEdit'); await p.waitForTimeout(250);
  await p.click('#pre [data-mu="chest"][data-v="2"]'); await p.waitForTimeout(250);
  const pre = await txt('#pre');
  check('the muscles and what the answers change are in English', pre.includes('What is still sore?') && pre.includes('Chest') && pre.includes('Still sore') && pre.includes('Never sore') && pre.includes('One set less: Machine Chest Press') && pre.includes('One rep less for chest'), pre);
  await clean('the muscles one by one'); await snap(p, 'en2-pre');
  await p.click('#pre [data-mu="chest"][data-v="1"]'); await p.waitForTimeout(200); await p.click('#preDone'); await p.waitForTimeout(350);
  const ex = await txt('#exList .ex.open');
  check('the exercise is in English', (await txt('#exList .ex-name')) === 'Incline Smith Machine Press' && ex.includes('Exercise 1 of 8') && ex.includes('Rest 2–3 min') && ex.includes('Swap exercise') && ex.includes('Ask Eilon') && ex.includes('Upper chest · front delts · triceps') && ex.includes('Side view'), ex.slice(0, 300));
  check('its tabs and cues are in English, with no second name under them', (await txt('.fx-tabs')).replace(/\s+/g, ' ').trim() === 'How My note History' && (await p.$$eval('#fxPane .cues li', (l) => l.length)) === 3 && (await txt('#fxPane')).includes('Bench at 30–45°') && !(await p.$('#fxPane .en-name')), await txt('#fxPane'));
  check('the header of the workout is in English', (await txt('#wkTitle')).includes('Upper Body A') && (await p.getAttribute('#backBtn', 'aria-label')) === 'Back to the main screen' && (await p.getAttribute('#listBtn', 'aria-label')) === 'All exercises', await txt('#wkTitle'));
  const dock = await txt('#dock');
  check('the bar at the bottom is in English', dock.includes('Set 1 of 3') && dock.includes('target') && dock.includes('kg') && dock.includes('reps') && dock.includes('Set done') && (await p.getAttribute('#dkKg', 'aria-label')) === 'Weight, tap to type' && (await p.getAttribute('#dock', 'aria-label')) === 'Set log and rest timer', dock);
  await clean('the exercise'); await snap(p, 'en3-exercise', true);
  await p.click('.fx-tabs [data-fx="hist"]'); await p.waitForTimeout(200);
  check('history is in English', (await txt('#fxPane')).includes('Last time (') && (await txt('#fxPane')).includes('days ago') && (await txt('#fxPane')).includes('Your strength · 3 workouts'), await txt('#fxPane'));
  await p.click('.fx-tabs [data-fx="note"]'); await p.waitForTimeout(200);
  check('the note is in English', (await txt('#fxPane')).includes('A note that stays with this exercise') && (await p.getAttribute('.note-in', 'placeholder')) === 'Seat height, tempo, a cue', await txt('#fxPane'));
  await clean('history and note');
  await p.click('.fx-tabs [data-fx="cues"]'); await p.waitForTimeout(150);
  await p.click('#dkHit'); await p.waitForTimeout(600);
  const rt = await txt('#dock');
  check('the rest timer is in English', rt.includes('Rest') && rt.includes('Next: Set 2 of 3') && rt.includes('Logged') && rt.includes('Undo') && rt.includes('Continue') && (await p.getAttribute('#rtPlus', 'aria-label')) === '15 seconds more', rt);
  await clean('the rest timer'); await snap(p, 'en4-rest');
  /* a change of language reaches the timer that is already running */
  await p.evaluate(() => setLang('he')); await p.waitForTimeout(350);
  check('(the check itself sees Hebrew when there is some)', (await hebOn(p)).length > 20, (await hebOn(p)).length);
  check('the running timer follows a change of language', (await txt('#rtState')).includes('סט 2 מתוך 3') && (await p.evaluate(() => document.documentElement.dir)) === 'rtl' && (await txt('#tabbar')).includes('היום') && (await txt('#exList .ex-name')) === 'לחיצת חזה בשיפוע עליון בסמית׳', await txt('#rtState'));
  await p.evaluate(() => setLang('en')); await p.waitForTimeout(350);
  check('and back', (await txt('#rtState')).includes('Next: Set 2 of 3') && (await txt('#exList .ex-name')) === 'Incline Smith Machine Press', await txt('#rtState'));
  await p.click('#rtSkip'); await p.waitForTimeout(250);
  await p.click('.ex.open .same'); await p.waitForTimeout(500);
  const fb = await txt('#dock');
  check('the questions after an exercise are in English', fb.includes('How was it: Incline Smith Machine Press') && fb.includes('Pain') && fb.includes('None') && fb.includes('Feel in the muscle') && fb.includes('Load') && fb.includes('Too heavy') && fb.includes('Skip'), fb);
  await clean('the questions after an exercise'); await snap(p, 'en5-feedback');
  await p.click('#dock [data-fb="pain"][data-v="2"]'); await p.waitForTimeout(300);
  const pain = await txt('#dock');
  check('a pain report is answered in English', pain.includes('The remaining chest sets are off today.') && pain.includes('If the pain goes on, have it checked.') && pain.includes('Close'), pain);
  await clean('a pain report');
  await p.click('#dock [data-fb="pain"][data-v="0"]'); await p.waitForTimeout(200); await p.click('#dock [data-fb="pump"][data-v="2"]'); await p.click('#dock [data-fb="load"][data-v="1"]'); await p.waitForTimeout(900);

  // ---- the list of all exercises, the swap, the plan
  await p.click('#listBtn'); await p.waitForTimeout(300);
  const ls = await txt('#sheet');
  check('the list of exercises is in English', ls.includes('Workout 1') && ls.includes('sets') && ls.includes('Assisted Pull-ups') && ls.includes('Week 4 of 5') && ls.includes('Finish workout') && ls.includes('Clear the log'), ls.slice(0, 300));
  await clean('the list of exercises'); await snap(p, 'en6-list', true);
  await p.click('#resetBtn'); await p.waitForTimeout(200);
  check('clearing asks in English', (await txt('#sheet .confirm')).includes('Clear what was logged in this workout?') && (await txt('#resetYes')) === 'Yes, clear', await txt('#sheet .confirm'));
  await p.click('#resetNo'); await p.click('#sheet [data-close]'); await p.waitForTimeout(250);
  check('the next exercise has come up by itself', (await txt('#exList .ex-name')) === 'Assisted Pull-ups', await txt('#exList .ex-name'));
  await p.click('.ex.open .swap'); await p.waitForTimeout(350);
  const sw = await txt('#sheet');
  check('the swap sheet is in English', sw.includes('Swap exercise') && sw.includes('Suggested') && sw.includes('Chest') && sw.includes('Same muscle, same movement. Sets and history are kept.') && sw.includes('Lat Pulldown') && sw.includes('Cable') && sw.includes('Easy on the joints') && sw.includes('Today only') && sw.includes('For good') && sw.includes('Another machine? Ask Eilon'), sw.slice(0, 400));
  await clean('the swap sheet'); await snap(p, 'en7-swap', true);
  await p.click('#sheet [data-pick="quads"]'); await p.waitForTimeout(250); await clean('the swap sheet, another muscle');
  await p.click('#sheet [data-close]'); await p.waitForTimeout(250);
  await p.click('#listBtn'); await p.waitForTimeout(250); await p.click('#mesoBtn'); await p.waitForTimeout(350);
  const ms = await txt('#sheet');
  check('the plan sheet is in English', ms.includes('Round 1') && ms.includes('Week 4 of 5') && ms.includes('To failure') && ms.includes('Easy week') && ms.includes('Sets a week by muscle') && ms.includes('Exercises and sets') && ms.includes('Weight step') && ms.includes('Smith machine') && ms.includes('Length of a round') && ms.includes('5 weeks') && ms.includes('New round') && ms.includes('+ Add exercise') && ms.includes('Reorder and remove'), ms.slice(0, 500));
  check('the volume bars are read out in English', /^[A-Z][a-z ]+: [\d.]+ sets a week\. Suggested range: \d+ to \d+$/.test(await p.getAttribute('#sheet .vol-bar', 'aria-label')), await p.getAttribute('#sheet .vol-bar', 'aria-label'));
  await clean('the plan sheet'); await snap(p, 'en8-plan', true);
  await p.click('#sheet [data-bled="0"]'); await p.waitForTimeout(250); await clean('the plan sheet, reordering');
  await p.click('#sheet [data-bled="0"]'); await p.waitForTimeout(200);
  await p.click('#sheet [data-addw="1"]'); await p.waitForTimeout(350);
  check('adding an exercise is in English', (await txt('#sheet')).includes('Add exercise · Lower Body A') && (await txt('#sheet')).includes('What to add?') && (await txt('#sheet [data-add]')) === 'Add', (await txt('#sheet')).slice(0, 200));
  await clean('adding an exercise');
  await p.click('#sheet [data-close]'); await p.waitForTimeout(250);
  await p.click('#msDl'); await p.waitForTimeout(250);
  check('the questions of the plan sheet are in English', (await txt('#sheet .confirm')).includes('Start an easy week? A new round starts after it.') && (await txt('#msDlYes')) === 'Yes, easy week', await txt('#sheet .confirm'));
  await p.click('#msNo'); await p.waitForTimeout(150);
  await p.click('#sheet [data-sum="m1"]'); await p.waitForTimeout(350);
  const sum = await txt('#sheet');
  check('the round summary is in English', sum.includes('Summary') && sum.includes('Round 1') && sum.includes('sets in the top week') && sum.includes('strength change') && sum.includes('Sets by muscle') && sum.includes('Strength change by exercise') && sum.includes('The exercises that answered best') && sum.includes('Strong feel · no pain') && sum.includes('Close'), sum.slice(0, 500));
  check('changes read from left to right', sum.includes(' → ') && !sum.includes('←'), sum.slice(0, 300));
  await clean('the round summary'); await snap(p, 'en9-round', true);
  await p.click('#sheetClose'); await p.waitForTimeout(250);

  // ---- the coach
  await p.click('.ex.open .ask'); await p.waitForTimeout(350);
  const ch = await txt('#chat');
  check('the coach greets in English', ch.includes('Eilon') && ch.includes('Your coach') && ch.includes('Hi, I am Eilon') && ch.includes('The machine is taken. What instead?') && ch.includes('About') && (await p.getAttribute('#chatInput', 'placeholder')) === 'Ask Eilon' && (await p.getAttribute('#sendBtn', 'aria-label')) === 'Send', ch.slice(0, 300));
  check('the exercise picker of the chat is in English', (await p.evaluate(() => { const s = document.querySelector('#chatCtx'); return [s.options[0].text, s.querySelector('optgroup').label, s.selectedOptions[0].text].join('|'); })) === 'The whole plan|Workout 1 – Upper Body A|Assisted Pull-ups', await p.evaluate(() => document.querySelector('#chatCtx').selectedOptions[0].text));
  await clean('the chat, empty'); await snap(p, 'en10-chat');
  await p.fill('#chatInput', 'Can a seated chest press replace this?'); await p.click('#sendBtn'); await p.waitForTimeout(600);
  const call = await p.evaluate(() => window.__calls[0]);
  check('the coach gets his rules in English, with the plan and the lifter', !/[֐-׿]/.test(call.first) && call.first.startsWith('You are Eilon') && call.first.includes('Workout 1 – Upper Body A') && call.first.includes('1. [ua1] Incline Smith Machine Press: 3 sets × 6–10 reps | rest 2–3 min') && call.first.includes('About the user: Name: Sam · Gym experience: Regular (Six months to two years) · Goal: Build muscle') && call.first.includes('"Verdict: Partly suitable"'), call.first.slice(0, 200));
  check('the question goes with its context in English', !/[֐-׿]/.test(call.last) && call.last.startsWith('[Context from the app.') && call.last.includes('The question is about the exercise [ua2] "Assisted Pull-ups" (Workout 1): 3 sets × 6–10 reps, rest 2 min, To failure.') && call.last.includes('Recent results (kg×reps): 8 days ago: ') && call.last.endsWith('Can a seated chest press replace this?'), call.last);
  check('an English verdict is shown as a verdict', (await txt('#msgs .verdict.mid')) === 'Partly suitable' && (await txt('#msgs')).includes('About Assisted Pull-ups') && !(await txt('#msgs .msg.a')).includes('Verdict:'), await txt('#msgs'));
  await p.fill('#chatInput', 'log 40 kg 8 8 7'); await p.click('#sendBtn'); await p.waitForTimeout(700);
  check('sets logged by the coach are reported in English', (await txt('#msgs .logged')).includes('3 sets logged · Assisted Pull-ups') && (await txt('#msgs .logged .link')) === 'Undo', await txt('#msgs .logged'));
  await clean('the chat, with answers'); await snap(p, 'en11-chat-answers');
  await p.evaluate(() => setLang('he')); await p.waitForTimeout(300);
  check('a conversation that is on screen follows a change of language', (await txt('#msgs .logged')).includes('נרשמו 3 סטים · מתח בסיוע (גרביטון)') && (await txt('#msgs')).includes('על מתח בסיוע (גרביטון)') && (await p.getAttribute('#chatInput', 'placeholder')) === 'שאל את אילון' && (await txt('.chat-h')).includes('המאמן שלך'), await txt('#msgs .logged'));
  await p.evaluate(() => setLang('en')); await p.waitForTimeout(300);
  await p.click('#chatClose'); await p.waitForTimeout(250);

  // ---- the end of a workout
  await p.click('#listBtn'); await p.waitForTimeout(250); await p.click('#finishBtn'); await p.waitForTimeout(700);
  const end = await txt('#sheet');
  check('the end of a workout is in English', end.includes('Workout 1 complete') && end.includes('points') && end.includes('Level ') && end.includes('sets') && end.includes('minutes') && end.includes('PRs') && end.includes('Next: Workout 2 – Lower Body A') && end.includes('Continue'), end);
  await clean('the end of a workout'); await snap(p, 'en12-summary');
  await p.click('#sheetClose'); await p.waitForTimeout(300);
  /* the workout is over: the line about the sets the coach wrote stays, without an Undo that could no longer undo anything */
  await p.click('#chatOpen'); await p.waitForTimeout(300);
  check('sets the coach wrote cannot be "undone" once their workout is finished', (await txt('#msgs .logged')).includes('3 sets logged') && !(await p.isVisible('#msgs .logged .link')) && (await p.evaluate(() => { undoLog(chat.msgs.findIndex((m) => m.logged)); const s = sorted().find((x) => x.end && x.sets.ua2); return s.sets.ua2.filter((r) => r && r.done).length + ':' + !!chat.msgs.find((m) => m.logged).logged.undone; })) === '3:false', await txt('#msgs .logged'));
  await tab('home');

  // ---- progress
  await tab('progress');
  const pr = await txt('.v-progress');
  check('progress is in English', pr.includes('Progress') && /Round 1 · 13 workouts/.test(pr) && pr.includes('Your strength') && pr.includes(' → ') && pr.includes('Round summary') && pr.includes('Recent workouts') && pr.includes('More workouts') && pr.includes('Backup') && pr.includes('Save to a file') && pr.includes('Restore') && pr.includes('Export CSV') && pr.includes('Saved on this device'), pr.slice(0, 500));
  check('dates are written in English, with the month in letters', /[A-Z][a-z]{2},? \d{1,2} [A-Z][a-z]{2} · \d+ sets · \d+ min/.test(await txt('#history .h-s')), await txt('#history .h-s'));
  await clean('progress'); await snap(p, 'en13-progress', true);
  await p.click('#history [data-edit]'); await p.waitForTimeout(350);
  const ed = await txt('#sheet');
  check('fixing a finished workout is in English', ed.includes('Workout 1') && ed.includes('Upper Body A') && ed.includes('Date') && ed.includes('Set 1') && ed.includes('kg') && ed.includes('reps') && ed.includes('Delete workout') && ed.includes('Continue this workout') && ed.includes('Done') && (await p.getAttribute('#sheet .ed-row input', 'aria-label')) === 'Weight in set 1', ed.slice(0, 300));
  await clean('fixing a finished workout'); await snap(p, 'en14-editor', true);
  await p.click('#edDelAsk'); await p.waitForTimeout(200);
  check('deleting asks in English', (await txt('#edAct')).includes('Delete this workout?') && (await txt('#edDelYes')) === 'Yes, delete', await txt('#edAct'));
  await p.click('#edDelNo'); await p.click('#sheetClose'); await p.waitForTimeout(250);

  // ---- the profile and the character
  await tab('profile');
  const pf = await txt('#profile');
  check('the profile is in English', pf.includes('Sam') && /Level \d+/.test(pf) && /pts to level \d+/.test(pf) && pf.includes('workouts') && pf.includes('week streak') && pf.includes('PRs') && pf.includes('tons lifted') && pf.includes('Next reward') && pf.includes('Achievements') && pf.includes('First workout') && pf.includes('Settings') && pf.includes('Language') && pf.includes('Experience') && pf.includes('Regular') && pf.includes('Goal') && pf.includes('Build muscle') && pf.includes('How points are earned') && pf.includes('Personal best'), pf.slice(0, 600));
  check('an achievement is read out in English', /^[A-Za-z0-9 ]+, (earned|not yet)$/.test(await p.getAttribute('#profile .bdg', 'aria-label')), await p.getAttribute('#profile .bdg', 'aria-label'));
  await clean('the profile'); await snap(p, 'en15-profile', true);
  await p.click('#lookBtn'); await p.waitForTimeout(300);
  const lk = await txt('#sheet');
  check('the character sheet is in English', lk.includes('My character') && lk.includes('Name') && lk.includes('Skin') && lk.includes('Hair') && lk.includes('Curly') && lk.includes('Beard') && lk.includes('Stubble') && lk.includes('Shirt') && lk.includes('Done') && (await p.getAttribute('#lkName', 'placeholder')) === 'Your name' && (await p.getAttribute('#lkStage svg', 'aria-label')).startsWith('My character, level '), lk);
  await clean('the character sheet'); await snap(p, 'en16-look');
  await p.click('#sheet [data-close]'); await p.waitForTimeout(250);

  // ---- what is shown only now and then: drawn directly, each in turn
  await p.evaluate(() => { const s = sorted().find((x) => x.end), R = { y: tally(s), from: levelOf(100), to: levelOf(900), got: [] }; showDeloadOffer(s, R); });
  await p.waitForTimeout(200);
  check('the offer of an easy week is in English', (await txt('#sheet')).includes('Signs of fatigue') && (await txt('#sheet')).includes('Twice in a row you missed the target (today: ') && (await txt('#sheet')).includes('Start an easy week') && (await txt('#sheet')).includes('Not now') && (await txt('#sheet .xp-line')).includes('level up'), await txt('#sheet'));
  await clean('the offer of an easy week');
  await p.click('#sheet [data-close]'); await p.waitForTimeout(200);
  await p.evaluate(() => { const s = sorted().find((x) => x.end); showSummary(s, { y: tally(s), from: levelOf(100), to: levelOf(5000), got: ['first', 'week'] }); });
  await p.waitForTimeout(300);
  check('a level-up and its rewards are told in English', (await txt('#sheet')).includes('You reached level ') && (await txt('#sheet')).includes('Unlocked: Headband') && (await txt('#sheet')).includes('Achievement: First workout') && (await txt('#sheet')).includes('Achievement: Full week'), await txt('#sheet'));
  await clean('a level-up'); await snap(p, 'en17-levelup');
  await p.click('#sheetClose'); await p.waitForTimeout(250);
  await p.evaluate(() => { levelUp(7); });
  await p.waitForTimeout(150);
  check('the level-up note is in English', (await txt('#toast')) === 'Level 7!', await txt('#toast'));
  await p.evaluate(() => { startDeload(); renderHome(); }); await p.waitForTimeout(150);
  check('a banner is in English', (await txt('#home .banner')).includes('The easy week has started. Half the sets and less weight for the next four workouts.') && (await p.getAttribute('#home .banner-x', 'aria-label')) === 'Close', await txt('#home .banner'));
  await tab('home'); await clean('today, in an easy week');
  check('an easy week is named in English', (await txt('#home .week h2')) === 'Easy week', await txt('#home .week h2'));
  /* a banner is a written text: it does not outlive a change of language */
  await p.evaluate(() => setLang('he')); await p.waitForTimeout(250);
  check('a banner does not stay behind in the other language', !(await p.$('#home .banner')) && (await txt('#home .week h2')) === 'שבוע קל', await txt('#home'));
  await p.evaluate(() => { S.cfg.meso.early = 0; setLang('en'); }); await p.waitForTimeout(250);

  // ---- the language setting itself
  await tab('profile');
  await p.click('#profile [data-set="lang"][data-v="he"]'); await p.waitForTimeout(350);
  check('the setting turns the whole page to Hebrew', (await p.evaluate(() => [LANG, document.documentElement.dir, S.cfg.lang].join())) === 'he,rtl,he' && (await txt('#profile')).includes('הגדרות') && (await txt('#tabbar')).includes('פרופיל') && (await p.getAttribute('#profile [data-set="lang"][data-v="he"]', 'aria-pressed')) === 'true', await txt('#tabbar'));
  check('and it is kept', JSON.parse(await p.evaluate(() => localStorage.getItem('ul4:v1'))).cfg.lang === 'he', 'ls');
  await p.click('#profile [data-set="lang"][data-v="en"]'); await p.waitForTimeout(350);
  check('and back to English', (await p.evaluate(() => [LANG, document.documentElement.dir, S.cfg.lang].join())) === 'en,ltr,en' && (await txt('#profile')).includes('Settings'), await txt('#tabbar'));
  await clean('the profile, after two changes of language');
  await p.context().close();

  // ---- a wide screen: the bar at the bottom sits under the workout, on the side the page starts from
  for (const [lang, side] of [['en', 'left'], ['he', 'right']]) {
    const q = await open(b, JSON.stringify(Object.assign(JSON.parse(store), { cfg: Object.assign(JSON.parse(store).cfg, { lang }) })), { w: 1280, h: 800 });
    await q.click('#homeGo'); await q.waitForTimeout(350); await q.click('#preAll'); await q.waitForTimeout(350);
    const g = await q.evaluate(() => { const d = document.querySelector('#dock').getBoundingClientRect(), m = document.querySelector('.main').getBoundingClientRect(), c = document.querySelector('#chat').getBoundingClientRect(); return { dock: [Math.round(d.left), Math.round(d.right)], main: [Math.round(m.left), Math.round(m.right)], chat: [Math.round(c.left), Math.round(c.right)] }; });
    check('wide screen, ' + lang + ': the bar is under the workout, on the ' + side, g.dock[0] >= g.main[0] - 2 && g.dock[1] <= g.main[1] + 2 && (side === 'left' ? g.chat[0] > g.main[1] - 2 : g.chat[1] < g.main[0] + 2), g);
    await snap(q, 'en18-wide-' + lang);
    await q.context().close();
  }

  // ---- a first visit in English: the opening screens, then an app with nothing Hebrew in it
  p = await open(b, null, { locale: 'en-GB' });
  check('a first visit on an English phone opens in English', (await p.isVisible('#ob')) && (await p.evaluate(() => LANG)) === 'en' && (await hebOn(p)).length === 0, await hebOn(p));
  for (let i = 0; i < 6; i++) { if (i === 1) await p.fill('#obName', 'Ann'); if (i === 2 || i === 3) await p.click('.ob-opt[data-v="1"]'); if ((await hebOn(p)).length) bad.push('Hebrew on opening screen ' + i + ' -> ' + JSON.stringify(await hebOn(p))); await p.click('#obNext'); await p.waitForTimeout(350); }
  check('after the opening screens the app is in English', (await p.isHidden('#ob')) && (await p.evaluate(() => (document.querySelector('#home').innerText || '').includes('Hi, Ann'))) && (await hebOn(p)).length === 0, await hebOn(p));
  await p.context().close();

  await b.close();
  console.log('PASS ' + ok.length); console.log('FAIL ' + bad.length + (bad.length ? ':\n  ' + bad.join('\n  ') : '')); console.log('ERRORS: ' + (errs.join(' | ') || 'none'));
  process.exit(bad.length || errs.length ? 1 : 0);
})();
