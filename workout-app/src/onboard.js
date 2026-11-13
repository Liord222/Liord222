/* ================================================================== language and the opening screens
   The opening screens are shown once. The coach asks a few short questions (language, name, experience, goal), the
   player designs a character, and the app is ready. Every answer can be changed later in the profile. */
const autoLang = () => (Object.keys(S.sessions).length || S.cfg.me.made || /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en');
/* the texts that are written in the page itself and not drawn by a render: [selector, attribute ('' = its text), the text] */
const STATIC = () => [
  ['#backBtn', 'aria-label', say('חזרה למסך הראשי', 'Back to the main screen')],
  ['#topCoach', 'aria-label', say('שאל את אילון', 'Ask Eilon')],
  ['#listBtn', 'aria-label', say('כל התרגילים', 'All exercises')],
  ['#tabbar', 'aria-label', say('ניווט ראשי', 'Main navigation')],
  ['#tabbar [data-view="home"] span', '', say('היום', 'Today')],
  ['#tabbar [data-view="profile"] span', '', say('פרופיל', 'Profile')],
  ['#tabbar [data-view="progress"] span', '', say('התקדמות', 'Progress')],
  ['#chatOpen span', '', say('אילון', 'Eilon')],
  ['#pre', 'aria-label', say('התאוששות מהאימון הקודם', 'Recovery since the last workout')],
  ['.v-progress .big', '', say('התקדמות', 'Progress')],
  ['#backup', 'aria-label', say('גיבוי', 'Backup')],
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
const OB_LAST = 5;
const EXP = () => [[say('מתחיל', 'Beginner'), say('פחות מחצי שנה', 'Less than six months')], [say('מתאמן קבוע', 'Regular'), say('חצי שנה עד שנתיים', 'Six months to two years')], [say('מנוסה', 'Experienced'), say('יותר משנתיים', 'More than two years')]];
const GOALS = () => [[say('לבנות שריר', 'Build muscle')], [say('להתחזק', 'Get stronger')], [say('כושר ובריאות', 'Fitness and health')]];
const barsIcon = (n) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + [0, 1, 2].map((k) => '<path d="M' + (6 + k * 6) + ' 19v-' + (5 + k * 4) + '"' + (k < n ? '' : ' opacity=".25"') + '/>').join('') + '</svg>';
const OB_ICON = { exp: [barsIcon(1), barsIcon(2), barsIcon(3)], goal: [ICON.bell, glyph('bolt'), '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.3-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.7 12 20 12 20z"/></svg>'] };

/* a beginner starts with one set less on the exercises that have three or more; anyone else gets the plan as written.
   Only before the first logged set: after that the plan belongs to what the lifter has done with it */
function applyExp() {
  const me = S.cfg.me;
  if (meNow().T.sets > 0) return;
  for (const id of Object.keys(SLOT)) { if (me.exp === 0 && SLOT[id].sets >= 3) S.cfg.base[id] = { n: SLOT[id].sets - 1, t: Date.now() }; else delete S.cfg.base[id]; }
}
function obHTML() {
  const st = OB.step, me = S.cfg.me, lvl = S.lvl || 1;
  const ask = (t, sub) => '<div class="ob-q"><span class="ava" aria-hidden="true">' + coachFace() + '</span><div class="ob-bub"><h1 id="obTitle">' + t + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div></div>';
  const opts = (key, list, cur) => '<div class="ob-opts" role="radiogroup" aria-labelledby="obTitle">' + list.map((o, i) => '<button type="button" class="ob-opt" role="radio" aria-checked="' + (cur === i) + '" data-ob="' + key + '" data-v="' + i + '">' + OB_ICON[key][i] + '<span><b>' + o[0] + '</b>' + (o[1] ? '<small>' + o[1] + '</small>' : '') + '</span><i class="ob-chk" aria-hidden="true">' + ICON.check + '</i></button>').join('') + '</div>';
  let body, cta = say('המשך', 'Continue'), can = true;
  if (st === 0) {
    cta = say('בואו נתחיל', "Let's start");
    body = '<div class="ob-hero"><div class="logo" role="img" aria-label="gymi by Lior Dahan"><span class="logo-w" aria-hidden="true">gym<span class="logo-i">i</span></span><small aria-hidden="true">by Lior Dahan</small></div>' +
      '<div class="ob-av">' + avatar(lvl) + '</div><h1 id="obTitle">' + say('ברוכים הבאים ל-gymi', 'Welcome to gymi') + '</h1><p>' + say('תוכנית כוח של ארבעה אימונים, שמרגישה כמו משחק.', 'A four-workout strength plan that plays like a game.') + '</p>' +
      '<div class="seg ob-lang" role="group" aria-label="' + LANG_LABEL + '">' + LANGS.map((l) => '<button type="button" data-lang="' + l[0] + '" aria-pressed="' + (LANG === l[0]) + '">' + l[1] + '</button>').join('') + '</div></div>';
  } else if (st === 1) {
    body = ask(say('איך קוראים לך?', 'What is your name?')) + '<input class="ob-in-name" id="obName" type="text" maxlength="16" autocomplete="given-name" enterkeyhint="next" aria-labelledby="obTitle" placeholder="' + say('השם שלך', 'Your name') + '" value="' + esc(OB.name) + '">';
  } else if (st === 2) {
    body = ask(say('כמה ניסיון יש לך בחדר כושר?', 'How much gym experience do you have?'), say('לפי זה נקבע כמה סטים יהיו בהתחלה.', 'This sets how many sets you start with.')) + opts('exp', EXP(), OB.exp); can = OB.exp != null;
  } else if (st === 3) {
    body = ask(say('מה המטרה שלך?', 'What is your goal?'), say('אילון, המאמן, יתאים לזה את העצות שלו.', 'Eilon, your coach, will fit his advice to it.')) + opts('goal', GOALS(), OB.goal); can = OB.goal != null;
  } else if (st === 4) {
    body = ask(say('זו הדמות שלך', 'This is your character'), say('היא מתחזקת ומקבלת ציוד ככל שעולים רמות.', 'It grows stronger and earns gear as you level up.')) + '<div class="lk-stage" id="lkStage">' + avatar(lvl) + '</div><div id="lkRows">' + lookRows() + '</div>';
  } else {
    const old = meNow().T.wk > 0, fact = (ic, t) => '<li>' + ic + '<span>' + t + '</span></li>';
    cta = old ? say('קדימה', "Let's go") : say('לאימון הראשון', 'To the first workout');
    body = '<div class="ob-hero done"><canvas class="confetti" id="obConfetti" aria-hidden="true"></canvas><div class="ob-av">' + avatar(lvl, { flex: true }) + '</div><h1 id="obTitle">' + (OB.name ? esc(OB.name) + say(', הכול מוכן!', ', you are all set!') : say('הכול מוכן!', 'You are all set!')) + '</h1>' +
      '<ul class="ob-facts">' + fact(ICON.bell, say('ארבעה אימונים, תרגיל אחד בכל פעם', 'Four workouts, one exercise at a time')) + fact(glyph('bolt'), say('כל סט שווה נקודות', 'Every set earns points')) + fact(glyph('star'), say('עולים רמות, והדמות מתחזקת', 'Level up and your character grows')) + '</ul>' +
      '<p class="ob-note">' + say('האפליקציה אינה תחליף לייעוץ רפואי. אם יש כאב או מגבלה, מתייעצים קודם עם איש מקצוע.', 'This app is not medical advice. If you have pain or a condition, talk to a professional first.') + '</p></div>';
  }
  return '<div class="ob-in"><div class="ob-top">' + (st > 0 ? '<button class="fx-nav" id="obBack" type="button" aria-label="' + say('חזרה', 'Back') + '">' + ICON.back + '</button>' : '<span class="ob-sp"></span>') +
    (st > 0 ? '<div class="ob-prog" role="img" aria-label="' + say('שלב ' + st + ' מתוך ' + OB_LAST, 'Step ' + st + ' of ' + OB_LAST) + '"><i style="width:' + Math.round((st / OB_LAST) * 100) + '%"></i></div>' : '<span></span>') +
    (st === 0 ? '<button class="link" id="obSkip" type="button">' + say('דלג', 'Skip') + '</button>' : '<span class="ob-sp"></span>') + '</div>' +
    '<div class="ob-body' + (OB.dir > 0 ? ' in-next' : OB.dir < 0 ? ' in-prev' : '') + '">' + body + '</div>' +
    '<div class="ob-foot"><button class="btn primary big" id="obNext" type="button"' + (can ? '' : ' disabled') + '>' + cta + '</button></div></div>';
}
function renderOb() {
  const el = $('#ob'); el.innerHTML = obHTML(); OB.dir = 0;
  if (OB.step === 1) { const inp = $('#obName'); try { inp.focus({ preventScroll: true }); inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) { /* not focusable here */ } }
  if (OB.step === OB_LAST) { confetti($('#obConfetti'), 70); buzz([40, 30, 40]); }
  el.scrollTop = 0;
}
function openOb() {
  const me = S.cfg.me;
  Object.assign(OB, { on: true, step: 0, dir: 0, name: me.name || '', exp: me.exp, goal: me.goal });
  $('#ob').hidden = false; document.body.style.overflow = 'hidden'; renderOb();
}
function closeOb() { OB.on = false; const el = $('#ob'); el.hidden = true; el.innerHTML = ''; if (!$('#chat').classList.contains('open')) document.body.style.overflow = ''; }
/* the answers are kept when the last screen is passed. skip: only remember that the screens were seen */
function obFinish(skip) {
  const me = S.cfg.me;
  if (!skip) { me.name = String(OB.name || '').trim().slice(0, 16); me.exp = OB.exp; me.goal = OB.goal; me.made = me.made || Date.now(); applyExp(); }
  me.ob = Date.now(); S.cfg.lang = LANG; saveCfg();
  closeOb(); renderAll();
}
function obStep(d) { const n = OB.step + d; if (n < 0) return; if (n > OB_LAST) { obFinish(false); return; } OB.step = n; OB.dir = d; renderOb(); }
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
    else if (b.dataset.lang) { setLang(b.dataset.lang, true); renderOb(); }
    else if (b.dataset.ob) { OB[b.dataset.ob] = +b.dataset.v; renderOb(); }
    else if (b.dataset.look) setLook(b.dataset.look, +b.dataset.v);
  });
  el.addEventListener('input', (ev) => { if (ev.target.id === 'obName') OB.name = ev.target.value; });
  el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target.id === 'obName') { ev.preventDefault(); obStep(1); } });
}
