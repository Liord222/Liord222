/* ================================================================== language and the opening screens
   The opening screens are shown once. The coach asks a few short questions (language, name, experience, goal), the
   player designs a character, and the app is ready. Every answer can be changed later in the profile. */
const autoLang = () => (Object.keys(S.sessions).length || S.cfg.me.made || /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en');
/* the texts that are written in the page itself and not drawn by a render: [selector, attribute ('' = its text), the text] */
const STATIC = () => [
  ['#backBtn', 'aria-label', say('חזרה למסך הראשי', 'Back to the main screen')],
  ['#listBtn', 'aria-label', say('כל התרגילים', 'All exercises')],
  ['#tabbar', 'aria-label', say('ניווט ראשי', 'Main navigation')],
  ['#tabbar [data-view="home"] .tb-l', '', say('אימונים', 'Workouts')],
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
/* a change of language is never a jump: what is on screen fades out, changes, and fades back in. Behind the curtain there
   is nothing to see, so there it changes at once. Changes that arrive while one is fading are made together with it */
const LF = { t: 0, q: [] };
function langFade(fn) {
  const app = $('#app');
  if (reduced || SPLASH.on || document.hidden) { fn(); return; }
  LF.q.push(fn); if (LF.q.length > 1) return;
  clearTimeout(LF.t); app.classList.remove('lang-in'); app.classList.add('lang-out');
  setTimeout(() => {
    const q = LF.q; LF.q = []; for (const f of q) f();
    app.classList.remove('lang-out'); app.classList.add('lang-in'); LF.t = setTimeout(() => app.classList.remove('lang-in'), 340);
  }, 150);
}

/* ================================================================== the opening
   A short film first: the camera finds Eilon, pulls back onto the player's character beside him, and pushes in on it as it
   grows. Then the questions, one a screen, each asked by Eilon from the same place, so that only what is asked changes. The
   answers build the plan: experience sets the sets, the time sets how many exercises, and the gym sets the machines */
const OB = { on: false, step: 0, dir: 0, name: '', exp: null, goals: [], time: null, eq: null, fb: 2, pin: '', pin1: '', pinBuf: '', pinErr: '', beat: 0 };
const OB_STEPS = ['film', 'name', 'exp', 'goals', 'time', 'eq', 'look', 'plan', 'pin', 'done'];
const OB_LAST = OB_STEPS.length - 1;
const obIs = (k) => OB_STEPS[OB.step] === k;
const EXP = () => [[say('מתחיל', 'Beginner'), say('פחות מחצי שנה', 'Less than six months')], [say('מתאמן קבוע', 'Regular'), say('חצי שנה עד שנתיים', 'Six months to two years')], [say('מנוסה', 'Experienced'), say('יותר משנתיים', 'More than two years')]];
/* how built the character is drawn for each answer, before a single level is earned: as one starts, half way, well trained */
const EXP_BASE = [0, 0.35, 0.62];
const GOALS = () => [[say('מראה ומבנה גוף', 'Physique'), say('מסה, חיטוב והגדרה', 'Size, shape and definition')], [say('כוח', 'Strength'), say('להרים יותר משקל', 'Lift heavier')], [say('כושר ובריאות', 'Fitness and health'), say('אנרגיה, יציבה וגוף בריא', 'Energy, posture and a healthy body')]];
const TIMES = () => [[30, say('קצר וממוקד', 'Short and focused')], [45, say('מאוזן', 'Balanced')], [60, say('אימון מלא', 'A full workout')], [75, say('ארוך ויסודי', 'Long and thorough')]];
const EQS = () => [[say('חדר כושר מלא', 'A full gym'), say('מכונות, כבלים, מוטות ומשקולות', 'Machines, cables, bars and dumbbells')], [say('חדר כושר בסיסי', 'A basic gym'), say('משקולות, מוטות וכבלים, בלי מכונות', 'Dumbbells, bars and cables, no machines')], [say('עוד לא יודע', 'Not sure yet'), say('מתחילים מחדר מלא, וכל תרגיל מתחלף בלחיצה', 'We start with a full gym; any exercise swaps with a tap')]];
/* the equipment each answer has: null for all of it */
const EQ_OK = [null, ['db', 'bar', 'cable', 'bw'], null];
/* a bar with one, two or three plates a side: the more there is on the bar, the longer one has trained */
const platesIcon = (n) => {
  const xs = [7.2, 4.2, 1.2], hs = n === 1 ? [10] : n === 2 ? [14, 10] : [17, 13, 9], r = (x, h) => '<rect x="' + x + '" y="' + (12 - h / 2) + '" width="2.4" height="' + h + '" rx="1.1"/>';
  return '<svg class="pl" viewBox="0 0 24 24" aria-hidden="true"><rect x=".4" y="11" width="23.2" height="2" rx="1"/>' + hs.map((h, i) => r(xs[i], h) + r(+(21.6 - xs[i]).toFixed(1), h)).join('') + '</svg>';
};
const OBI = {
  body: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.8" r="2.1"/><path d="M5 9.4c2.4 1 4.6 1.5 7 1.5s4.6-.5 7-1.5M12 10.9v4.6M12 15.5l-3 5.4M12 15.5l3 5.4"/></svg>',
  bell: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 7.5v9M17.5 7.5v9M3.8 10v4M20.2 10v4M6.5 12h11"/></svg>',
  heart: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.3-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.7 12 20 12 20z"/></svg>',
  gym: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5h17M5 20.5V9.2L12 4.6l7 4.6v11.3M9.2 20.5v-5.2h5.6v5.2"/></svg>',
  unsure: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6"/><path d="M9.7 9.5a2.4 2.4 0 1 1 3.5 2.2c-.8.4-1.2 1-1.2 1.8M12 16.6h.01"/></svg>',
  clock: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3 2"/></svg>',
  del: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 5.5h9.3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9.2L3.5 12z"/><path d="M12 9.6l4.6 4.8M16.6 9.6L12 14.4"/></svg>',
};
/* the experience the character is drawn with: the answer being given, while the opening is open */
const expNow = () => (OB.on && OB.exp != null ? OB.exp : S.cfg.me.exp);

/* ---- the film: three beats, each a camera move and a line. It plays by itself and goes round; a touch moves it on ---- */
const FILM = () => [
  say('היי, אני אילון. המאמן האישי שלך.', 'Hi, I am Eilon. Your personal coach.'),
  say('אבנה לך תוכנית שמתאימה בדיוק לך.', 'I will build a plan that fits you exactly.'),
  say('וכל אימון יעלה אותך רמה.', 'And every workout takes you up a level.'),
];
const BEAT_MS = 3200;
const storyHTML = () => FILM().map((_, i) => '<i class="' + (i < OB.beat ? 'full' : i === OB.beat ? 'run' : '') + '"><b></b></i>').join('');
function filmHTML() {
  return '<div class="ob-film" id="obFilm" data-beat="' + OB.beat + '" aria-hidden="true"><div class="ob-cam"><div class="ob-set">' +
    '<span class="ob-glow"></span><span class="ob-floor"></span>' +
    '<span class="ob-coach">' + avatarSVG(COACH, 16, {}) + '</span>' +
    '<span class="ob-you" id="obYou"><span class="y1">' + avatar(1) + '</span><span class="y2">' + avatar(30) + '</span><b class="lv-badge" id="obYouLv">' + say('רמה ', 'Level ') + '1</b></span>' +
    '</div></div></div>';
}
function filmBeat(n) {
  const f = $('#obFilm'); clearTimeout(OB.beatT);
  if (!f || !OB.on || OB.step !== 0) return;
  OB.beat = ((n % 3) + 3) % 3; f.dataset.beat = OB.beat;
  /* he waves as he says hello */
  const co = $('.ob-coach .av', f); if (co) { co.classList.toggle('wave', OB.beat === 0); co.classList.toggle('grin', OB.beat === 0); }
  const cap = $('#obCap'); if (cap) { cap.textContent = FILM()[OB.beat]; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); }
  const st = $('#obStory'); if (st) st.innerHTML = storyHTML();
  /* the last beat: the character grows and flexes, and its level climbs */
  const y2 = $('#obYou .y2 .av'), lv = $('#obYouLv');
  if (y2) { y2.classList.remove('flex'); if (OB.beat === 2) setTimeout(() => { if (y2.isConnected && OB.beat === 2) y2.classList.add('flex'); }, 650); }
  if (lv) {
    cancelAnimationFrame(OB.lvRaf);
    if (OB.beat !== 2) lv.textContent = say('רמה ', 'Level ') + 1;
    else { const t0 = performance.now(), step = (now) => { const k = Math.min(1, (now - t0) / 1100); lv.textContent = say('רמה ', 'Level ') + Math.round(1 + 29 * (1 - Math.pow(1 - k, 3))); if (k < 1 && lv.isConnected) OB.lvRaf = requestAnimationFrame(step); }; OB.lvRaf = requestAnimationFrame(step); }
  }
  if (!reduced) OB.beatT = setTimeout(() => filmBeat(OB.beat + 1), BEAT_MS);
}

/* the curtain: a black screen with the name, as when a phone wakes up. It lifts once the account has said which language
   to speak (so the first screen seen is already in it), or after a few seconds, or at a touch. Not in the middle of a
   workout, and not in the phone app, which has a curtain of its own */
const SPLASH = { on: false, t: 0, t0: 0 };
function splash() {
  const el = $('#splash');
  if (!el || window.__splash === false || window.GYMI_NATIVE || nextUp().live >= 0) return;
  SPLASH.on = true; SPLASH.t0 = Date.now(); el.hidden = false;
  const lift = () => {
    if (!SPLASH.on) return;
    SPLASH.on = false; clearTimeout(SPLASH.t); el.classList.add('out');
    setTimeout(() => { el.hidden = true; el.classList.remove('out'); }, reduced ? 0 : 440);
    obPlay();
  };
  const ready = () => { if (!SPLASH.on) return; if (S.cfgReady || Date.now() - SPLASH.t0 > 3200) lift(); else SPLASH.t = setTimeout(ready, 120); };
  el.addEventListener('click', lift, { once: true });
  SPLASH.t = setTimeout(ready, reduced ? 800 : 1500);
}
/* the opening starts to move only once the curtain is up */
function obPlay() { if (!OB.on || SPLASH.on) return; if (!OB.playT) OB.playT = Date.now(); $('#ob').classList.add('play'); if (OB.step === 0) filmBeat(OB.beat); }

/* a beginner starts with one set less on the exercises that have three or more; anyone else gets the plan as written.
   Only before the first logged set: after that the plan belongs to what the lifter has done with it */
function applyExp() {
  const me = S.cfg.me;
  if (meNow().T.sets > 0) return;
  /* x marks a count that was set here; a count the lifter chose in the plan has none and is left alone */
  for (let w = 0; w < PLAN.length; w++) for (const pe of planSlots(w)) {
    const b = S.cfg.base[pe.id]; if (b && !b.x) continue;
    if (me.exp === 0 && pe.sets >= 3) S.cfg.base[pe.id] = { n: pe.sets - 1, t: Date.now(), x: 1 }; else delete S.cfg.base[pe.id];
  }
}
/* the answers that shape the plan: the ones being given while the opening is open, else the ones that were kept */
const fitAns = (a) => ({ exp: a.exp, goals: a.goals || [], time: a.time, ok: EQ_OK[a.eq] || null });
/* the plan is made for its lifter (see fitPlanData): the movements the gym has, the sets for this experience, and as many
   exercises as the time holds. It is written from the plan's own slots each time, so going through the opening again with
   other answers gives the plan those answers ask for. Only before the first logged set, like applyExp */
function fitPlan() {
  const me = S.cfg.me;
  if (meNow().T.sets > 0) return;
  const now = Date.now(), cfg = S.cfg;
  cfg.swap = {}; cfg.slots = {}; cfg.order = {}; cfg.base = {};
  fitPlanData(fitAns(me)).forEach((list, w) => {
    const ids = list.map((x, i) => {
      let id = x.id;
      if (x.kind === 'swap') cfg.swap[id] = x.mv;
      else if (x.kind === 'repl') { id = 'c' + now.toString(36) + w + i; cfg.slots[id] = { w, a: x.mv, sets: x.full, reps: x.reps, rest: x.rest.slice() }; }
      if (x.sets !== x.full) cfg.base[id] = { n: x.sets, t: now, x: 1 };
      return id;
    });
    if (ids.join() !== PLAN[w].ex.map((e) => e.id).join()) cfg.order[w] = ids;
  });
  saveCfg();
}
/* what the plan will be, before it is made: how many exercises a workout has, the sets they get, and how long it runs.
   A plan that was already trained stays as it is, so there the numbers are its own */
function planPreview() {
  const fresh = meNow().T.sets === 0, span = (a) => { const lo = Math.min.apply(null, a), hi = Math.max.apply(null, a); return lo === hi ? '' + lo : Ltr(lo + '–' + hi); };
  const lists = fresh ? fitPlanData(fitAns(OB)).map((l) => l.map((x) => ({ sets: x.sets, reps: x.r, rest: x.t }))) : PLAN.map((x, w) => exList(w));
  return { ex: span(lists.map((l) => l.length)), sets: span([].concat.apply([], lists.map((l) => l.map((e) => e.sets)))), mins: span(lists.map(workMins)) };
}

async function pinHash(pin) {
  const text = 'gymi:' + pin;
  try {
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    /* no subtle crypto here: a plain mix of the digits, as long as the real one */
    let x = 2166136261; for (const c of text) x = Math.imul(x ^ c.charCodeAt(0), 16777619) >>> 0;
    return (x.toString(16).padStart(8, '0')).repeat(8);
  }
}

/* what the plan is fitted to, one line for each, in the lifter's own answers */
const buildSteps = () => [
  OB.eq === 1 ? say('בוחר תרגילים בלי מכונות', 'Choosing exercises that need no machines') : say('בוחר תרגילים לחדר כושר מלא', 'Choosing exercises for a full gym'),
  [say('קובע סטים למתחיל', 'Setting the sets for a beginner'), say('קובע סטים למתאמן קבוע', 'Setting the sets for a regular lifter'), say('קובע סטים למנוסה', 'Setting the sets for an experienced lifter')][OB.exp == null ? 1 : OB.exp],
  say('מכוון חזרות ומנוחות למטרות שלך', 'Tuning reps and rests to your goals'),
  OB.time ? say('מתאים כל אימון ל-', 'Fitting each workout into ') + Ltr(OB.time) + say(' דקות', ' minutes') : say('משאיר כל אימון באורך מלא', 'Keeping each workout at full length'),
];
function obHTML() {
  const st = OB_STEPS[OB.step], nm = String(OB.name || '').trim();
  /* Eilon, all of him, beside what he asks. On the first question he stands larger, above it */
  const ask = (t, sub, big) => '<div class="ob-q' + (big ? ' big' : '') + '"><span class="ob-eilon" aria-hidden="true">' + avatarSVG(COACH, 16, {}) + '</span><div class="ob-bub"><h1 id="obTitle">' + t + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div></div>';
  const card = (key, i, ic, t, sub, on, multi) => '<button type="button" class="ob-opt" role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="' + on + '" data-ob="' + key + '" data-v="' + i + '"><i class="ob-ic" aria-hidden="true">' + ic + '</i><span><b>' + t + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span><i class="ob-chk" aria-hidden="true">' + ICON.check + '</i></button>';
  const group = (multi, inner) => '<div class="ob-opts" role="' + (multi ? 'group' : 'radiogroup') + '" aria-labelledby="obTitle">' + inner + '</div>';
  let body, cta = say('המשך', 'Continue'), can = true, quiet = false;
  if (st === 'film') {
    cta = say('בואו נתחיל', "Let's start");
    body = '<div class="ob-head"><div class="logo" role="img" aria-label="gymi by Lior Dahan"><span class="logo-w" aria-hidden="true">gym<span class="logo-i">i</span></span><small aria-hidden="true">by Lior Dahan</small></div>' +
      '<h1 class="sr" id="obTitle">' + say('ברוכים הבאים ל-gymi', 'Welcome to gymi') + '</h1></div><div class="ob-tap" id="obTap"></div><p class="ob-cap in" id="obCap">' + FILM()[OB.beat] + '</p>';
  } else if (st === 'name') {
    body = ask(say('איך קוראים לך?', 'What is your name?'), '', true) +
      '<div class="ob-name"><input class="ob-in-name" id="obName" type="text" dir="auto" maxlength="16" autocomplete="given-name" enterkeyhint="next" aria-labelledby="obTitle" placeholder="' + say('השם שלך', 'Your name') + '" value="' + esc(OB.name) + '"><p class="ob-hint">' + say('ככה אילון יפנה אליך', 'So Eilon knows what to call you') + '</p></div>';
  } else if (st === 'exp') {
    body = ask(say('כמה ניסיון יש לך בחדר כושר?', 'How much gym experience do you have?')) +
      group(false, EXP().map((o, i) => card('exp', i, platesIcon(i + 1), o[0], o[1], OB.exp === i)).join('')) +
      '<div class="ob-pre" id="obPre" aria-hidden="true">' + avatar(1) + '</div>';
    can = OB.exp != null;
  } else if (st === 'goals') {
    body = ask(say('מה המטרות שלך?', 'What are your goals?'), say('אפשר לבחור כמה', 'Pick as many as you like')) +
      group(true, GOALS().map((o, i) => card('goals', i, [OBI.body, OBI.bell, OBI.heart][i], o[0], o[1], OB.goals.includes(i), true)).join(''));
    can = OB.goals.length > 0;
  } else if (st === 'time') {
    body = ask(say('כמה זמן יש לך לאימון?', 'How long can a workout take?'), say('אתאים לזה את מספר התרגילים', 'I will fit the number of exercises to it')) +
      '<div class="ob-times" role="radiogroup" aria-labelledby="obTitle">' + TIMES().map((t) => '<button type="button" class="ob-time" role="radio" aria-checked="' + (OB.time === t[0]) + '" data-ob="time" data-v="' + t[0] + '"><b>' + Ltr(t[0] === 75 ? '75+' : '' + t[0]) + '</b><span>' + say('דקות', 'minutes') + '</span><small>' + t[1] + '</small></button>').join('') +
      '<button type="button" class="ob-time any" role="radio" aria-checked="' + (OB.time === 0) + '" data-ob="time" data-v="0">' + OBI.clock + '<span>' + say('לא משנה לי', 'Any length') + '</span></button></div>';
    can = OB.time != null;
  } else if (st === 'eq') {
    body = ask(say('איפה תתאמן?', 'Where will you train?'), say('אבחר תרגילים שיש להם ציוד אצלך', 'I will pick exercises you have the equipment for')) +
      group(false, EQS().map((o, i) => card('eq', i, [OBI.gym, OBI.bell, OBI.unsure][i], o[0], o[1], OB.eq === i)).join(''));
    can = OB.eq != null;
  } else if (st === 'look') {
    body = ask(say('וזה אתה באפליקציה', 'And this is you in the app'), say('הדמות מתחזקת איתך, מרמה לרמה', 'It gets stronger with you, level by level')) +
      '<div class="ob-stage"><div class="lk-stage" id="lkStage">' + avatar(S.lvl || 1) + '</div><div class="lk-photo-box" id="lkPhotoBox">' + lookPhoto() + '</div></div>' +
      '<div class="ob-look lk-ed" id="lkRows">' + lookRows() + '</div>';
  } else if (st === 'plan' && OB.building) {
    can = false;
    body = ask(say('רגע, בונה לך תוכנית', 'One moment, building your plan'), say('לפי כל מה שסיפרת לי', 'From everything you told me')) +
      '<div class="ob-build" id="obBuild"><div class="ob-ring" role="img" aria-label="' + say('בונה את התוכנית', 'Building the plan') + '"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="t" cx="60" cy="60" r="52"/><circle class="f" id="obRing" cx="60" cy="60" r="52" pathLength="100"/></svg><b id="obPct" aria-hidden="true">' + Ltr('0%') + '</b></div>' +
      '<ul class="ob-steps">' + buildSteps().map((t) => '<li><i aria-hidden="true">' + ICON.check + '</i><span>' + t + '</span></li>').join('') + '</ul></div>';
  } else if (st === 'plan') {
    const P = planPreview(), stat = (v, t) => '<li><b>' + v + '</b><span>' + t + '</span></li>';
    cta = say('נשמע טוב', 'Sounds good');
    body = ask(say('התוכנית שלך מוכנה', 'Your plan is ready'), say('בניתי אותה לפי מה שסיפרת לי', 'I built it from what you told me')) +
      '<section class="card next w0 ob-plan' + (OB.reveal ? ' reveal' : '') + '" aria-label="' + say('התוכנית שלך', 'Your plan') + '"><p class="k">' + say('התוכנית שלך', 'Your plan') + '</p><h2>' + say('4 אימונים בסבב', '4 workouts a cycle') + '</h2>' +
      '<ul class="ob-stats">' + stat(P.ex, say('תרגילים באימון', 'exercises a workout')) + stat(P.sets, say('סטים לתרגיל', 'sets each')) + stat(P.mins, say('דקות לאימון', 'minutes a workout')) + '</ul>' +
      '<ol class="ob-wks">' + PLAN.map((x, i) => '<li><span class="w-dot w' + i + '"></span>' + wkName(i) + '</li>').join('') + '</ol><i class="ob-shine" aria-hidden="true"></i></section>' +
      '<div class="ob-fb"><span><b>' + say('אילון ישאל איך היה', 'Eilon asks how it went') + '</b><small>' + say('שאלה קצרה אחרי כל תרגיל, כדי לכוון את המשקל', 'A quick question after each exercise, to tune the weight') + '</small></span><button type="button" class="tog" role="switch" id="obFb" aria-checked="' + (OB.fb > 0) + '" aria-label="' + say('אילון ישאל איך היה', 'Eilon asks how it went') + '"><i></i></button></div>';
  } else if (st === 'pin') {
    cta = OB.pin ? say('המשך', 'Continue') : say('דלג בינתיים', 'Skip for now'); quiet = !OB.pin;
    body = ask(say('קוד אישי', 'A personal code'), OB.pin ? say('הקוד נשמר.', 'The code is saved.') : OB.pin1 ? say('עוד פעם, לאישור', 'Once more, to confirm') : say('4 ספרות. הקוד יידרש לפתיחת האפליקציה ולמחיקת החשבון.', '4 digits. It is asked when the app opens, and to delete the account.')) +
      '<div class="ob-pin"><div class="pin-dots' + (OB.pin ? ' ok' : '') + '" id="pinDots" role="img" aria-label="' + say('ספרות שהוקלדו: ', 'Digits typed: ') + (OB.pin ? 4 : OB.pinBuf.length) + '">' + [0, 1, 2, 3].map((i) => '<i class="' + (OB.pin || i < OB.pinBuf.length ? 'on' : '') + '"></i>').join('') + '</div>' +
      '<p class="pin-err" id="pinErr" aria-live="polite">' + (OB.pinErr || '') + '</p>' +
      '<div class="pin-pad">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) => (k === '' ? '<span></span>' : '<button type="button" class="pin-k" data-pin="' + k + '"' + (OB.pin ? ' disabled' : '') + (k === 'del' ? ' aria-label="' + say('מחק ספרה', 'Delete a digit') + '">' + OBI.del : '>' + k) + '</button>')).join('') + '</div></div>';
  } else {
    const old = meNow().T.wk > 0, cap = (a, b) => '<figcaption>' + a + '<b>' + b + '</b></figcaption>';
    cta = old ? say('קדימה', "Let's go") : say('לאימון הראשון', 'To the first workout');
    body = '<div class="ob-done"><canvas class="confetti" id="obConfetti" aria-hidden="true"></canvas><h1 id="obTitle">' + (nm ? '<bdi>' + esc(nm) + '</bdi>' + say(', הכול מוכן!', ', you are all set!') : say('הכול מוכן!', 'You are all set!')) + '</h1>' +
      '<p class="ob-sub">' + say('כל אימון מקרב אותך לרמה 100', 'Every workout takes you closer to level 100') + '</p>' +
      '<div class="ob-ladder" aria-hidden="true"><figure class="now"><span class="ob-fig">' + avatar(1) + '</span>' + cap(say('היום', 'Today'), say('רמה 1', 'Level 1')) + '</figure>' +
      '<span class="ob-go">' + ICON.fwd + ICON.fwd + ICON.fwd + '</span>' +
      '<figure class="max"><span class="ob-fig">' + avatar(100) + '</span>' + cap(say('המטרה', 'The goal'), say('רמה 100', 'Level 100')) + '</figure></div>' +
      '<p class="ob-note">' + say('לא תחליף לייעוץ רפואי. יש כאב או מגבלה? קודם מתייעצים עם איש מקצוע.', 'Not medical advice. Pain or a condition? Talk to a professional first.') + '</p></div>';
  }
  const langs = '<div class="seg ob-lang" role="group" aria-labelledby="obLangL"><span class="sr" id="obLangL">' + LANG_LABEL + '</span>' + LANGS.map((l) => '<button type="button" data-lang="' + l[0] + '" lang="' + l[0] + '" aria-pressed="' + (LANG === l[0]) + '">' + l[1] + '</button>').join('') + '</div>';
  const first = st === 'film', fin = st === 'done', last = OB_LAST - 1;
  return (first ? filmHTML() : fin ? '<div class="ob-film fin" aria-hidden="true"></div>' : '') +
    '<div class="ob-in' + (first ? ' film' : '') + (fin ? ' fin' : '') + (OB.stay ? ' stay' : '') + '" data-step="' + OB.step + '" data-k="' + st + '"><div class="ob-top' + (first ? ' first' : '') + '">' +
    (first ? langs : '<button class="fx-nav" id="obBack" type="button" aria-label="' + say('חזרה', 'Back') + '">' + ICON.back + '</button>') +
    (first ? '<div class="ob-story" id="obStory" aria-hidden="true">' + storyHTML() + '</div>' : fin ? '<span></span>' : '<div class="ob-prog" role="img" aria-label="' + say('שלב ' + OB.step + ' מתוך ' + last, 'Step ' + OB.step + ' of ' + last) + '"><i style="width:' + Math.round((Math.min(OB.step, last) / last) * 100) + '%"></i></div>') +
    (first ? '<button class="link" id="obSkip" type="button">' + say('דלג', 'Skip') + '</button>' : '<span class="ob-sp"></span>') + '</div>' +
    '<div class="ob-body' + (OB.dir ? ' in' : '') + '">' + body + '</div>' +
    '<div class="ob-foot"><button class="btn big' + (quiet ? '' : ' primary') + '" id="obNext" type="button"' + (can ? '' : ' disabled') + '>' + cta + '</button></div></div>';
}
/* the character under the experience question takes on the build of the answer */
function obPre() {
  const box = $('#obPre'); if (!box) return;
  box.innerHTML = avatar(1); const av = $('.av', box);
  box.classList.remove('pump'); void box.offsetWidth; box.classList.add('pump');
  requestAnimationFrame(() => requestAnimationFrame(() => { if (av && av.isConnected) av.classList.add('flex'); }));
  clearTimeout(OB.flexT); OB.flexT = setTimeout(() => { if (av && av.isConnected) av.classList.remove('flex'); }, 1200);
}
/* the timers of a screen's own show (the plan being built, the last screen) end with the screen */
function obClear() { for (const t of OB.ts || []) clearTimeout(t); OB.ts = []; cancelAnimationFrame(OB.buildRaf); }
/* the plan is built in front of the lifter: each thing it is fitted to is ticked in turn, the ring fills, and then the plan arrives */
const BUILD_MS = 640;
function obBuilt() { if (!OB.on || !obIs('plan') || !OB.building) return; OB.building = false; OB.reveal = true; renderOb(); }
function obBuild() {
  const lis = $$('#obBuild li'), ring = $('#obRing'), pct = $('#obPct'), t0 = performance.now(), all = lis.length * BUILD_MS;
  lis.forEach((li, i) => {
    OB.ts.push(setTimeout(() => { li.classList.add('on'); haptic('step'); }, i * BUILD_MS));
    OB.ts.push(setTimeout(() => li.classList.add('done'), (i + 1) * BUILD_MS - 110));
  });
  const step = (now) => { const k = Math.min(1, (now - t0) / all); if (ring) ring.style.strokeDashoffset = String(100 - k * 100); if (pct) pct.textContent = Math.round(k * 100) + '%'; if (k < 1 && pct && pct.isConnected) OB.buildRaf = requestAnimationFrame(step); };
  OB.buildRaf = requestAnimationFrame(step);
  OB.ts.push(setTimeout(obBuilt, all + 280));
}
/* the last screen: today's character cheers, and the one at level 100 arrives, flexes, and the paper flies */
function obFinale() {
  const now = $('.ob-ladder .now .av'), max = $('.ob-ladder .max .av');
  feel('done');
  if (reduced) { if (max) max.classList.add('flex'); return; }
  if (now) now.classList.add('cheer');
  OB.ts.push(setTimeout(() => { if (now && now.isConnected) now.classList.remove('cheer'); }, 2700));
  OB.ts.push(setTimeout(() => { if (max && max.isConnected) { max.classList.add('flex'); confetti($('#obConfetti'), 90); haptic('success'); } }, 1500));
}
function renderOb() {
  const el = $('#ob'); clearTimeout(OB.beatT); obClear();
  el.innerHTML = obHTML(); OB.dir = 0; OB.stay = false; el.dataset.step = OB.step; el.dataset.k = OB_STEPS[OB.step];
  if (obIs('name')) { const inp = $('#obName'); try { inp.focus({ preventScroll: true }); inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) { /* not focusable here */ } }
  if (obIs('plan')) { if (OB.building) obBuild(); else if (OB.reveal) { OB.reveal = false; feel('glory', 'success'); } }
  if (obIs('done')) obFinale();
  el.scrollTop = 0; obPlay();
}
/* the language changes under a short fade, never with a jump */
function obFade(fn) {
  const el = $('#ob'), box = $('.ob-in', el);
  if (!box || reduced) { fn(); return; }
  box.classList.add('out'); el.classList.add('swap');
  setTimeout(() => { fn(); el.classList.remove('swap'); el.classList.add('swapin'); clearTimeout(OB.swapT); OB.swapT = setTimeout(() => el.classList.remove('swapin'), 360); }, 170);
}
function openOb() {
  const me = S.cfg.me;
  LK.tab = 'skin'; LK.note = '';
  Object.assign(OB, { on: true, step: 0, dir: 0, beat: 0, stay: false, building: false, reveal: false, playT: 0, stepAt: 0, was: me.ob, name: me.name || '', exp: me.exp, goals: (me.goals || []).slice(), time: me.time, eq: me.eq, fb: me.fb == null ? 2 : me.fb, pin: me.pin || '', pin1: '', pinBuf: '', pinErr: '' });
  /* the language shown is the one kept: a look chosen on the way must not turn an English page Hebrew on the next visit */
  if (!S.cfg.lang) S.cfg.lang = LANG;
  $('#ob').hidden = false; document.body.style.overflow = 'hidden'; renderOb();
}
function closeOb() { OB.on = false; clearTimeout(OB.beatT); cancelAnimationFrame(OB.lvRaf); obClear(); OB.building = false; OB.reveal = false; const el = $('#ob'); el.hidden = true; el.classList.remove('play', 'swap', 'swapin'); el.innerHTML = ''; if (!(chat.modal && $('#chat').classList.contains('open'))) document.body.style.overflow = ''; }
/* the answers are kept when the last screen is passed. skip: only remember that the screens were seen */
function obFinish(skip) {
  const me = S.cfg.me;
  if (!skip) {
    me.name = String(OB.name || '').trim().slice(0, 16); me.exp = OB.exp; me.goals = OB.goals.slice(); me.goal = OB.goals.length ? OB.goals[0] : null;
    me.time = OB.time; me.eq = OB.eq; me.fb = OB.fb; if (OB.pin) me.pin = OB.pin; me.made = me.made || Date.now();
    fitPlan();
  }
  me.ob = Date.now(); S.cfg.lang = LANG; saveCfg();
  closeOb(); setView('home'); renderAll();
}
function obStep(d) {
  const n = OB.step + d; if (n < 0) return;
  OB.stepAt = Date.now();
  if (n > OB_LAST) { obFinish(false); return; }
  if (d > 0 && n < OB_LAST) sfx('set');
  /* Eilon stays where he stands from one question to the next: only the words and the answers arrive. (On the name he
     stands larger, in the middle, and the last screen has none of him, so there he arrives) */
  const side = (i) => i >= 2 && i < OB_LAST;
  OB.stay = side(OB.step) && side(n); OB.step = n; OB.dir = d; OB.pinErr = ''; OB.pin1 = ''; OB.pinBuf = '';
  /* the plan is built on the way forward only; on the way back it is simply there */
  const made = d > 0 && OB_STEPS[n] === 'plan'; OB.building = made && !reduced; OB.reveal = made && reduced;
  renderOb();
}
/* a digit of the code; the fourth asks for the code again, and the same code twice is kept */
function obPin(k) {
  if (OB.pin) return;
  if (k === 'del') OB.pinBuf = OB.pinBuf.slice(0, -1);
  else if (OB.pinBuf.length < 4) { OB.pinBuf += k; haptic('select'); }
  OB.pinErr = '';
  const dots = $$('#pinDots i'); dots.forEach((d, i) => d.classList.toggle('on', i < OB.pinBuf.length));
  const err = $('#pinErr'); if (err) err.textContent = '';
  if (OB.pinBuf.length < 4) return;
  const typed = OB.pinBuf;
  setTimeout(() => {
    if (!OB.on || !obIs('pin')) return;
    if (!OB.pin1) { OB.pin1 = typed; OB.pinBuf = ''; renderOb(); return; }
    if (typed !== OB.pin1) { OB.pin1 = ''; OB.pinBuf = ''; OB.pinErr = say('הקודים לא תואמים. מתחילים מחדש.', 'The codes did not match. Let us start again.'); renderOb(); haptic('warn'); return; }
    pinHash(typed).then((h) => { if (!OB.on || !obIs('pin')) return; OB.pin = h; OB.pin1 = ''; OB.pinBuf = ''; renderOb(); feel('set', 'success'); });
  }, 180);
}
/* show the opening screens when they are due: the settings are known, they were never passed, and no workout is in the middle */
function maybeOb() {
  /* passed on another device while open here: they close. Opened again from the profile, they were passed before, and stay */
  if (OB.on) { if (S.cfg.me.ob && S.cfg.me.ob !== OB.was) closeOb(); return; }
  if (S.cfgReady && !S.cfg.me.ob && nextUp().live < 0 && $('#sheet').hidden) openOb();
}
function wireOb() {
  const el = $('#ob');
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    /* a touch on the film moves it on to its next beat */
    if (!b) { if (OB.step === 0 && ev.target.closest('#obTap,.ob-film,.ob-cap')) filmBeat(OB.beat + 1); else if (ev.target.closest('#obBuild')) obBuilt(); return; }
    if (b.id === 'obNext') { if (ev.detail !== 0 && Date.now() - (OB.stepAt || 0) < 300) return; obStep(1); }
    else if (b.id === 'obBack') obStep(-1);
    else if (b.id === 'obSkip') obFinish(true);
    else if (b.id === 'obFb') { OB.fb = OB.fb > 0 ? 0 : 2; b.setAttribute('aria-checked', String(OB.fb > 0)); haptic('select'); }
    else if (b.dataset.pin) obPin(b.dataset.pin);
    else if (b.dataset.lang) { if (b.getAttribute('aria-pressed') === 'true') return; obFade(() => { setLang(b.dataset.lang, true); renderOb(); }); }
    /* an answer is marked where it stands: the screen does not arrive a second time */
    else if (b.dataset.ob) {
      const k = b.dataset.ob, v = +b.dataset.v;
      if (k === 'goals') { const i = OB.goals.indexOf(v); if (i >= 0) OB.goals.splice(i, 1); else OB.goals.push(v); b.setAttribute('aria-checked', String(i < 0)); $('#obNext').disabled = !OB.goals.length; }
      else { OB[k] = v; for (const o of $$('[data-ob="' + k + '"]', el)) o.setAttribute('aria-checked', String(o === b)); $('#obNext').disabled = false; }
      haptic('select');
      if (k === 'exp') obPre();
    }
    else if (b.dataset.look) setLook(b.dataset.look, +b.dataset.v);
    else if (b.dataset.lktab) lookTab(b.dataset.lktab);
    else if (b.id === 'lkPhoto') $('#lkFile').click();
  });
  el.addEventListener('input', (ev) => { if (ev.target.id === 'obName') OB.name = ev.target.value; });
  el.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.id === 'obName') { ev.preventDefault(); obStep(1); }
    else if (obIs('pin') && /^[0-9]$/.test(ev.key)) obPin(ev.key);
    else if (obIs('pin') && ev.key === 'Backspace') obPin('del');
  });
}
