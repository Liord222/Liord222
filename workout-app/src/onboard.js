/* ================================================================== language and the opening screens
   The opening screens are shown once. The coach asks a few short questions (language, name, experience, goal), the
   player designs a character, and the app is ready. Every answer can be changed later in the profile. */
const autoLang = () => (Object.keys(S.sessions).length || S.cfg.me.made || /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en');
/* the texts that are written in the page itself and not drawn by a render: [selector, attribute ('' = its text), the text] */
const STATIC = () => [
  ['#backBtn', 'aria-label', say('חזרה למסך הראשי', 'Back to the main screen')],
  ['#listBtn', 'aria-label', say('כל התרגילים', 'All exercises')],
  ['#tabbar', 'aria-label', say('ניווט ראשי', 'Main navigation')],
  ['#tabbar [data-view="home"] .tb-l', '', say('היום', 'Today')],
  ['#tabbar [data-view="profile"] .tb-l', '', say('פרופיל', 'Profile')],
  ['#tabbar [data-view="progress"] .tb-l', '', say('התקדמות', 'Progress')],
  ['#chatOpen .tb-l', '', say('אילון', 'Eilon')],
  ['#pre', 'aria-label', say('התאוששות מהאימון הקודם', 'Recovery since the last workout')],
  ['.v-progress .big', '', say('התקדמות', 'Progress')],
  ['#chat', 'aria-label', say('צ׳אט עם אילון', 'Chat with Eilon')],
  ['.chat-h h2', '', say('אילון', 'Eilon')],
  ['.chat-h p', '', say('המאמן שלך', 'Your coach')],
  ['#chatKey', 'aria-label', say('החיבור של אילון', 'Eilon\'s connection')],
  ['#chatKey', 'title', say('החיבור של אילון', 'Eilon\'s connection')],
  ['#chatNew', 'aria-label', say('שיחה חדשה', 'New chat')],
  ['#chatNew', 'title', say('שיחה חדשה', 'New chat')],
  ['#chatClose', 'aria-label', say('סגור את הצ׳אט', 'Close the chat')],
  ['.chat-ctx span', '', say('על', 'About')],
  ['#attachImg', 'alt', say('התמונה שצורפה', 'The attached photo')],
  ['.attach span', '', say('תישלח עם ההודעה', 'Goes with your message')],
  ['#attachX', 'aria-label', say('הסר את התמונה', 'Remove the photo')],
  ['#camBtn', 'aria-label', say('צלם את המכשיר', 'Take a photo of the machine')],
  ['#camBtn', 'title', say('צלם את המכשיר', 'Take a photo of the machine')],
  ['#galBtn', 'aria-label', say('בחר תמונה מהגלריה', 'Choose a photo from the gallery')],
  ['#galBtn', 'title', say('בחר תמונה מהגלריה', 'Choose a photo from the gallery')],
  ['#chatInput', 'aria-label', say('הודעה לאילון', 'Message to Eilon')],
  ['#dock', 'aria-label', say('רישום סטים וטיימר מנוחה', 'Set log and rest timer')],
];
function staticText() { for (const r of STATIC()) { const el = $(r[0]); if (!el) continue; if (r[1]) el.setAttribute(r[1], r[2]); else el.textContent = r[2]; } }
/* put the page in the chosen language: direction, the fixed texts of the page, and the notes that were kept as written text */
function applyLang() {
  const was = LANG;
  LANG = S.cfg.lang || autoLang();
  const dir = LANG === 'he' ? 'rtl' : 'ltr', app = $('#app');
  document.documentElement.lang = LANG; document.documentElement.dir = dir; app.lang = LANG; app.dir = dir;
  staticText();
  if (was !== LANG) { S.banner = ''; S.bannerKind = ''; S.backupNote = ''; setSync(); fillCtx(); chatText(); compNote(''); renderMsgs(); }
  /* inside the phone app, the shell's own screens follow the page */
  if (window.gymiNative && typeof window.gymiNative.lang === 'function') window.gymiNative.lang(LANG);
}
function setLang(l, keep) {
  if (l !== 'he' && l !== 'en') return;
  S.cfg.lang = l; applyLang();
  if (!keep) { saveCfg(); renderAll(); }
}

const OB = { on: false, step: 0, dir: 0, name: '', exp: null, goal: null };
const OB_LAST = 6;
const EXP = () => [[say('מתחיל', 'Beginner'), say('פחות מחצי שנה', 'Less than six months')], [say('מתאמן קבוע', 'Regular'), say('חצי שנה עד שנתיים', 'Six months to two years')], [say('מנוסה', 'Experienced'), say('יותר משנתיים', 'More than two years')]];
const GOALS = () => [[say('לבנות שריר', 'Build muscle')], [say('להתחזק', 'Get stronger')], [say('כושר ובריאות', 'Fitness and health')]];
const barsIcon = (n) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + [0, 1, 2].map((k) => '<path d="M' + (6 + k * 6) + ' 19v-' + (5 + k * 4) + '"' + (k < n ? '' : ' opacity=".25"') + '/>').join('') + '</svg>';
/* an icon on a tile of colour, for the answers and for the three promises at the end */
const tile = (ic, k) => '<i class="ic-tile w' + k + '" aria-hidden="true">' + ic + '</i>';
const OB_ICON = { exp: [tile(barsIcon(1), 1), tile(barsIcon(2), 0), tile(barsIcon(3), 2)], goal: [tile(ICON.bell, 0), tile(glyph('bolt'), 3), tile('<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.3-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.7 12 20 12 20z"/></svg>', 1)] };
/* the welcome is a small game: a tap on the character takes it up through the levels, filling out and earning its gear.
   Left alone, it climbs by itself */
const OB_SHOW = [1, 3, 8, 12, 20, 30, 40];
function obLevel(tap) {
  const box = $('#obAv'), chip = $('#obLv'), me = $('#obMe'); if (!box || !chip || !me || !OB.on || OB.step !== 0) return;
  OB.showI = (OB.showI + 1) % OB_SHOW.length;
  const lvl = OB_SHOW[OB.showI];
  box.innerHTML = avatarSVG(S.cfg.me.look, lvl);
  const av = $('.av', box);
  requestAnimationFrame(() => requestAnimationFrame(() => { if (av.isConnected) av.classList.add('flex'); }));
  clearTimeout(OB.flexT); OB.flexT = setTimeout(() => { if (av.isConnected) av.classList.remove('flex'); }, 1100);
  chip.textContent = say('רמה ', 'Level ') + lvl; chip.classList.remove('pop'); void chip.offsetWidth; chip.classList.add('pop');
  if (tap) { OB.tapT = Date.now(); me.classList.add('tapped'); me.classList.remove('bump'); void me.offsetWidth; me.classList.add('bump'); sfx('coin'); flyPoints(chip, XP.set); }
}
function obShow() {
  clearInterval(OB.showT); OB.showI = 0;
  if (reduced || OB.step !== 0) return;
  OB.showT = setInterval(() => {
    if (!OB.on || OB.step !== 0 || !$('#obAv')) { clearInterval(OB.showT); return; }
    if (OB.playT && Date.now() - OB.playT > 3400 && Date.now() - (OB.tapT || 0) > 2600) obLevel(false);
  }, 2400);
}
/* the curtain: a black screen with the name, as when a phone wakes up. It lifts by itself, or at a touch, onto the app
   or onto the opening screens. Not in the middle of a workout, and not in the phone app, which has a curtain of its own */
const SPLASH = { on: false, t: 0 };
function splash() {
  const el = $('#splash');
  if (!el || window.__splash === false || window.GYMI_NATIVE || nextUp().live >= 0) return;
  SPLASH.on = true; el.hidden = false;
  const lift = () => {
    if (!SPLASH.on) return;
    SPLASH.on = false; clearTimeout(SPLASH.t); el.classList.add('out');
    setTimeout(() => { el.hidden = true; el.classList.remove('out'); }, reduced ? 0 : 440);
    obPlay();
  };
  el.addEventListener('click', lift, { once: true });
  SPLASH.t = setTimeout(lift, reduced ? 800 : 1700);
}
/* the opening screens start to move only once the curtain is up */
function obPlay() { if (!OB.on || SPLASH.on) return; if (!OB.playT) OB.playT = Date.now(); $('#ob').classList.add('play'); }

/* a beginner starts with one set less on the exercises that have three or more; anyone else gets the plan as written.
   Only before the first logged set: after that the plan belongs to what the lifter has done with it */
function applyExp() {
  const me = S.cfg.me;
  if (meNow().T.sets > 0) return;
  /* x marks a count that was set here; a count the lifter chose in the plan has none and is left alone */
  for (const id of Object.keys(SLOT)) {
    const b = S.cfg.base[id]; if (b && !b.x) continue;
    if (me.exp === 0 && SLOT[id].sets >= 3) S.cfg.base[id] = { n: SLOT[id].sets - 1, t: Date.now(), x: 1 }; else delete S.cfg.base[id];
  }
}
function obHTML() {
  const st = OB.step, me = S.cfg.me, lvl = S.lvl || 1;
  const ask = (t, sub) => '<div class="ob-q"><span class="ava" aria-hidden="true">' + coachFace() + '</span><div class="ob-bub"><h1 id="obTitle">' + t + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div></div>';
  const opts = (key, list, cur) => '<div class="ob-opts" role="radiogroup" aria-labelledby="obTitle">' + list.map((o, i) => '<button type="button" class="ob-opt" role="radio" aria-checked="' + (cur === i) + '" data-ob="' + key + '" data-v="' + i + '">' + OB_ICON[key][i] + '<span><b>' + o[0] + '</b>' + (o[1] ? '<small>' + o[1] + '</small>' : '') + '</span><i class="ob-chk" aria-hidden="true">' + ICON.check + '</i></button>').join('') + '</div>';
  /* under a question the player's own character stands and waits, and cheers when an answer is chosen */
  const buddy = '<div class="ob-buddy" id="obBuddy" aria-hidden="true">' + avatarSVG(me.look, lvl) + '</div>';
  let body, cta = say('המשך', 'Continue'), can = true;
  if (st === 0) {
    cta = say('בואו נתחיל', "Let's start");
    body = '<div class="ob-stage"><div class="logo" role="img" aria-label="gymi by Lior Dahan"><span class="logo-w" aria-hidden="true">gym<span class="logo-i">i</span></span><small aria-hidden="true">by Lior Dahan</small></div>' +
      '<button class="ob-me" id="obMe" type="button" aria-label="' + say('הדמות שלך. כל הקשה מעלה אותה רמה', 'Your character. Every tap takes it up a level') + '"><span class="ob-rings" aria-hidden="true"><i></i><i></i></span><span class="ob-av" id="obAv">' + avatar(lvl) + '</span>' +
      '<span class="lv-badge ob-lv" id="obLv" aria-hidden="true">' + say('רמה ', 'Level ') + lvl + '</span><span class="ob-tap" aria-hidden="true">' + say('הקש עליי', 'Tap me') + '</span></button>' +
      '<div class="ob-q ob-hi"><span class="ava" aria-hidden="true">' + coachFace() + '</span><div class="ob-bub"><h1 id="obTitle">' + say('ברוכים הבאים ל-gymi', 'Welcome to gymi') + '</h1><p>' + say('אני אילון, המאמן שלך. נבנה לך תוכנית?', 'I am Eilon, your coach. Shall we build your plan?') + '</p></div></div></div>';
  } else if (st === 1) {
    body = ask(say('איך קוראים לך?', 'What is your name?')) + '<input class="ob-in-name" id="obName" type="text" maxlength="16" autocomplete="given-name" enterkeyhint="next" aria-labelledby="obTitle" placeholder="' + say('השם שלך', 'Your name') + '" value="' + esc(OB.name) + '">' + buddy;
  } else if (st === 2) {
    body = ask(say('כמה ניסיון יש לך בחדר כושר?', 'How much gym experience do you have?')) + opts('exp', EXP(), OB.exp) + buddy; can = OB.exp != null;
  } else if (st === 3) {
    body = ask(say('מה המטרה שלך?', 'What is your goal?')) + opts('goal', GOALS(), OB.goal) + buddy; can = OB.goal != null;
  } else if (st === 4) {
    body = ask(say('זו הדמות שלך', 'This is your character'), say('היא מתחזקת עם כל רמה, והיא שתדגים לך את התרגילים.', 'It grows with every level, and it shows you the exercises.')) + '<div class="lk-stage" id="lkStage">' + avatar(lvl) + '</div><div id="lkRows">' + lookRows() + '</div>';
  } else if (st === 5) {
    /* the coach offers the plan, one line after the other. Each line says what the app really does */
    const sets = Object.keys(SLOT).map((id) => (OB.exp === 0 && SLOT[id].sets >= 3 ? SLOT[id].sets - 1 : SLOT[id].sets)), lo = Math.min.apply(null, sets), hi = Math.max.apply(null, sets), wks = S.cfg.weeks;
    const line = (k, ic, b, sm) => '<li>' + tile(ic, k) + '<span><b>' + b + '</b><small>' + sm + '</small></span></li>';
    cta = say('נשמע טוב', 'Sounds good');
    body = ask(say('אני חושב שהתוכנית הזאת תתאים לך', 'I think this plan will suit you')) + '<ol class="ob-lines">' +
      line(0, ICON.bell, say('ארבעה אימונים בסבב', 'Four workouts in a cycle'), say('עליון, תחתון, עליון, תחתון', 'Upper, lower, upper, lower')) +
      line(1, barsIcon((OB.exp == null ? 1 : OB.exp) + 1), lo === hi ? cnt(lo, 'סטים לתרגיל', 'סט לתרגיל', 'sets an exercise', 'set an exercise') : say(lo + '–' + hi + ' סטים לתרגיל', lo + '–' + hi + ' sets an exercise'), say('לפי הניסיון שלך', 'By your experience') + (EXP()[OB.exp] ? ': ' + EXP()[OB.exp][0] : '')) +
      line(2, glyph('bolt'), say('כל שבוע קצת יותר', 'A little more every week'), say('סבב של ' + wks + ' שבועות, והאחרון קל', 'A round of ' + wks + ' weeks, and the last one is easy')) +
      line(3, ICON.swap, say('לא מתחבר לתרגיל?', 'Not into an exercise?'), say('מחליפים אותו בלחיצה', 'Swap it with one tap')) + '</ol>' + buddy;
  } else {
    const old = meNow().T.wk > 0;
    cta = old ? say('קדימה', "Let's go") : say('לאימון הראשון', 'To the first workout');
    body = '<div class="ob-hero done"><canvas class="confetti" id="obConfetti" aria-hidden="true"></canvas><div class="ob-av">' + avatar(lvl, { flex: true }) + '</div><h1 id="obTitle">' + (OB.name ? esc(OB.name) + say(', הכול מוכן!', ', you are all set!') : say('הכול מוכן!', 'You are all set!')) + '</h1>' +
      '<p class="ob-note">' + say('לא תחליף לייעוץ רפואי. יש כאב או מגבלה? קודם מתייעצים עם איש מקצוע.', 'Not medical advice. Pain or a condition? Talk to a professional first.') + '</p></div>';
  }
  const langs = '<div class="seg ob-lang" role="group" aria-label="' + LANG_LABEL + '">' + LANGS.map((l) => '<button type="button" data-lang="' + l[0] + '" aria-pressed="' + (LANG === l[0]) + '">' + l[1] + '</button>').join('') + '</div>';
  /* the first screen arrives with its whole entrance once; drawn again (a change of language) it is simply there */
  const quiet = st === 0 && OB.seen0; if (st === 0) OB.seen0 = true;
  return '<div class="ob-bg" aria-hidden="true">' + '<i></i>'.repeat(10) + '</div><div class="ob-in' + (quiet ? ' quiet' : '') + '" data-step="' + st + '"><div class="ob-top' + (st === 0 ? ' first' : '') + '">' + (st > 0 ? '<button class="fx-nav" id="obBack" type="button" aria-label="' + say('חזרה', 'Back') + '">' + ICON.back + '</button>' : langs) +
    (st > 0 ? '<div class="ob-prog" role="img" aria-label="' + say('שלב ' + st + ' מתוך ' + OB_LAST, 'Step ' + st + ' of ' + OB_LAST) + '"><i style="width:' + Math.round((st / OB_LAST) * 100) + '%"></i></div>' : '<span></span>') +
    (st === 0 ? '<button class="link" id="obSkip" type="button">' + say('דלג', 'Skip') + '</button>' : '<span class="ob-sp"></span>') + '</div>' +
    '<div class="ob-body' + (OB.dir > 0 ? ' in-next' : OB.dir < 0 ? ' in-prev' : '') + '">' + body + '</div>' +
    '<div class="ob-foot"><button class="btn primary big" id="obNext" type="button"' + (can ? '' : ' disabled') + '>' + cta + '</button></div></div>';
}
function cheer() {
  const av = $('#obBuddy .av'); if (!av) return;
  av.classList.add('flex'); clearTimeout(OB.flexT); OB.flexT = setTimeout(() => { if (av.isConnected) av.classList.remove('flex'); }, 1100);
}
function renderOb() {
  const el = $('#ob'); el.innerHTML = obHTML(); OB.dir = 0; el.dataset.step = OB.step;
  if (OB.step === 1) { const inp = $('#obName'); try { inp.focus({ preventScroll: true }); inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) { /* not focusable here */ } }
  if (OB.step === OB_LAST) { confetti($('#obConfetti'), 70); feel('done'); }
  el.scrollTop = 0; obShow(); obPlay();
}
function openOb() {
  const me = S.cfg.me;
  Object.assign(OB, { on: true, step: 0, dir: 0, seen0: false, tapT: 0, playT: 0, name: me.name || '', exp: me.exp, goal: me.goal });
  $('#ob').hidden = false; document.body.style.overflow = 'hidden'; renderOb();
}
function closeOb() { OB.on = false; clearInterval(OB.showT); const el = $('#ob'); el.hidden = true; el.classList.remove('play'); el.innerHTML = ''; if (!$('#chat').classList.contains('open')) document.body.style.overflow = ''; }
/* the answers are kept when the last screen is passed. skip: only remember that the screens were seen */
function obFinish(skip) {
  const me = S.cfg.me;
  if (!skip) { me.name = String(OB.name || '').trim().slice(0, 16); me.exp = OB.exp; me.goal = OB.goal; me.made = me.made || Date.now(); applyExp(); }
  me.ob = Date.now(); S.cfg.lang = LANG; saveCfg();
  closeOb(); renderAll();
}
function obStep(d) { const n = OB.step + d; if (n < 0) return; if (n > OB_LAST) { obFinish(false); return; } if (d > 0 && n < OB_LAST) sfx('set'); OB.step = n; OB.dir = d; renderOb(); }
/* show the opening screens when they are due: the settings are known, they were never passed, and no workout is in the middle */
function maybeOb() {
  if (OB.on) { if (S.cfg.me.ob) closeOb(); return; }
  if (S.cfgReady && !S.cfg.me.ob && nextUp().live < 0 && $('#sheet').hidden) openOb();
}
function wireOb() {
  const el = $('#ob');
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.id === 'obNext') obStep(1);
    else if (b.id === 'obBack') obStep(-1);
    else if (b.id === 'obSkip') obFinish(true);
    else if (b.id === 'obMe') obLevel(true);
    else if (b.dataset.lang) { setLang(b.dataset.lang, true); renderOb(); }
    /* an answer is marked where it stands: the screen does not arrive a second time */
    else if (b.dataset.ob) { OB[b.dataset.ob] = +b.dataset.v; for (const o of $$('.ob-opt', el)) o.setAttribute('aria-checked', String(o === b)); $('#obNext').disabled = false; cheer(); }
    else if (b.dataset.look) setLook(b.dataset.look, +b.dataset.v);
  });
  el.addEventListener('input', (ev) => { if (ev.target.id === 'obName') OB.name = ev.target.value; });
  el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target.id === 'obName') { ev.preventDefault(); obStep(1); } });
}
