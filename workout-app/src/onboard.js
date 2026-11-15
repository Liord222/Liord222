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
  ['#tabbar [data-view="journey"] .tb-l', '', say('מסע', 'Journey')],
  ['#chatOpen .tb-l', '', say('אילון', 'Eilon')],
  ['#pre', 'aria-label', say('התאוששות מהאימון הקודם', 'Recovery since the last workout')],
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
  if (was !== LANG) { S.banner = ''; S.bannerKind = ''; S.backupNote = ''; setSync(); fillCtx(); chatText(); compNote(''); renderMsgs(); if (TR.on) tourDraw(); }
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
const OB = { on: false, step: 0, dir: 0, name: '', exp: null, goals: [], days: null, place: null, age: null, focus: [], pain: [], q: 0, time: null, eq: null, fb: 2, beat: 0 };
const OB_STEPS = ['film', 'name', 'exp', 'goals', 'days', 'place', 'quick', 'look', 'plan', 'done'];
const OB_LAST = OB_STEPS.length - 1;
const obIs = (k) => OB_STEPS[OB.step] === k;
const EXP = () => [[say('מתחיל', 'Beginner'), say('פחות מחצי שנה', 'Less than six months')], [say('קבוע', 'Regular'), say('חצי שנה עד שנתיים', 'Six months to two years')], [say('מנוסה', 'Experienced'), say('שנתיים עד חמש', 'Two to five years')], [say('ותיק', 'Veteran'), say('יותר מחמש שנים', 'More than five years')]];
/* how built the character is drawn for each answer, before a single level is earned */
const EXP_BASE = [0, 0.35, 0.62, 0.8];
/* the goals by their number (0 mass, 1 strength, 2 fitness and endurance, 3 getting lean, 4 health, 5 running), and the order they are offered in */
const GOALS = () => [[say('מסה', 'Muscle')], [say('כוח', 'Strength')], [say('כושר וסיבולת', 'Fitness and endurance')], [say('חיטוב', 'Getting lean')], [say('בריאות', 'Health')], [say('ריצות', 'Running')]];
const GOAL_ORDER = [3, 1, 2, 0, 4, 5];
/* where the lifter trains (see PLACES in prog.js), the body areas to ask more of (FOCUS), and what can hurt (PAIN) */
const WHERE = () => [say('חדר כושר', 'A gym'), say('קליסטניקס', 'Calisthenics'), say('בבית עם משקולות', 'Home with dumbbells'), say('בבית בלי ציוד', 'Home with no equipment')];
const AREAS = () => [say('חזה', 'Chest'), say('גב', 'Back'), say('כתפיים', 'Shoulders'), say('ידיים', 'Arms'), say('רגליים', 'Legs'), say('ישבן', 'Glutes'), say('בטן', 'Abs')];
const OUCH = () => [say('ברכיים', 'Knees'), say('גב תחתון', 'Lower back'), say('כתפיים', 'Shoulders'), say('מרפקים', 'Elbows'), say('פרקי ידיים', 'Wrists')];
/* the equipment an older answer about the gym left: null for all of it */
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
  flame: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.4c.6 3-1.2 4.4-2.6 6.2C8 11.300 7 12.800 7 14.800a5 5 0 0 0 10 0c0-1.7-.7-3-1.600-4.200-.5 1-1.200 1.600-2 1.900.5-2.800-.1-6.300-1.400-9.100z"/></svg>',
  bolt: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.4 3.4 6 13.200h5.200l-1 7.400 7.800-10h-5.400z"/></svg>',
  run: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="14.6" cy="4.6" r="2"/><path d="M6.200 11.200 9.400 8.600l3.400.6 2.200 3.200 3.200 1M12.800 9.200l-2 5 3.200 2.400.6 4.200M10.800 14.200l-2.400 2.400-3.600.2"/></svg>',
  park: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20.500V5.200M19 20.500V5.200M3.500 7.200h17M9.200 7.200v5.200M14.800 7.200v5.200M3.500 20.500h17"/></svg>',
  home: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.200 12 4.600l8 6.600M6.200 9.800v9.700h11.600V9.800M10 19.500v-5h4v5"/></svg>',
  crown: '<svg class="pl" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.500 8.200l4 3.600L12 5.400l4.500 6.400 4-3.600-1.600 10.200H5.100z"/></svg>',
};
/* the goals, each with a drawing of its own (by the goal's number): an arm, a dumbbell, a bolt, a flame, a heart, a running shoe */
const gi = (d) => '<svg class="gi-s" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
const GOAL_IC = [
  gi('<path d="M4 20h9.200c3.500 0 6.300-2.600 6.300-5.900 0-2.600-1.800-4.800-4.300-5.600-1.400-.5-2.900-.3-4.100.300L9.800 4.600c-.3-.9-1.200-1.400-2.100-1.100l-2 .6c-.9.3-1.400 1.200-1.100 2.100l1.600 4.600C5 12.800 4 15.800 4 20z"/><path d="M11.200 8.900c-1.500.9-2.300 2.300-2.300 3.900" fill="none" stroke="rgb(0 0 0 / .22)" stroke-width="1.400" stroke-linecap="round"/>'),
  gi('<rect x="1.800" y="9.200" width="3" height="5.600" rx="1.200"/><rect x="5.400" y="6.400" width="3.800" height="11.200" rx="1.500"/><rect x="9.200" y="10.600" width="5.600" height="2.800" rx=".8"/><rect x="14.800" y="6.400" width="3.800" height="11.200" rx="1.500"/><rect x="19.200" y="9.200" width="3" height="5.600" rx="1.200"/>'),
  gi('<path d="M13.800 2.400 5.400 13.500h5.400l-1.200 8.100 9-11.300h-5.700z"/>'),
  gi('<path d="M12.300 2.300c.9 3.500-1.400 5.200-3.100 7.400-1.500 1.900-2.700 3.700-2.700 6a5.500 5.500 0 0 0 11 0c0-2-.8-3.500-1.900-4.900-.5 1.200-1.300 1.900-2.300 2.200.7-3.300 0-7.400-1-10.700z"/>'),
  gi('<path d="M12 20.600s-7.600-4.600-7.600-10.300A4.300 4.300 0 0 1 12 7.600a4.300 4.300 0 0 1 7.600 2.700c0 5.700-7.600 10.300-7.600 10.300z"/>'),
  gi('<path d="M2.800 17.300v-1.100c0-1.200.7-2.100 1.700-2.400l3.600-1.200 2.300-4.900c.3-.7 1.100-1 1.800-.7l.9.400 1 3.100 3.400 1.900c2.300.7 3.700 1.800 3.700 3.500v1.400c0 .6-.4 1-1 1H3.800c-.6 0-1-.400-1-1z"/><path d="M11.200 10.800l-1.400 1M12.600 12.600l-1.400 1" fill="none" stroke="rgb(0 0 0 / .25)" stroke-width="1.200" stroke-linecap="round"/>'),
];
/* the experience the character is drawn with: the answer being given, while the opening is open */
const expNow = () => (OB.on && OB.exp != null ? OB.exp : S.cfg.me.exp);

/* ---- the first screen: Eilon waves and says hello; the character that will grow stands beside him ---- */
function filmHTML() {
  return '<div class="ob-film" id="obFilm" data-beat="0" aria-hidden="true"><div class="ob-cam"><div class="ob-set">' +
    '<span class="ob-glow"></span><span class="ob-floor"></span>' +
    '<span class="ob-coach">' + avatarSVG(COACH, COACH_LVL, {}) + '</span>' +
    '</div></div></div>';
}
function filmBeat() {
  const f = $('#obFilm'); clearTimeout(OB.beatT);
  if (!f || !OB.on || OB.step !== 0) return;
  const co = $('.ob-coach .av', f); if (co) { co.classList.add('grin'); OB.beatT = setTimeout(() => { if (co.isConnected) co.classList.add('wave'); }, reduced ? 0 : 950); }
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
const fitAns = (a) => ({ exp: a.exp, goals: a.goals || [], time: a.time, ok: a.place == null ? EQ_OK[a.eq] || null : null, place: a.place | 0, age: a.age || null, focus: a.focus, pain: a.pain || [] });
/* the plan is made for its lifter (see fitPlanData): the movements the gym has, the sets for this experience, and as many
   exercises as the time holds. It is written from the plan's own slots each time, so going through the opening again with
   other answers gives the plan those answers ask for. Only before the first logged set, like applyExp */
function fitPlan(again) {
  const me = S.cfg.me;
  if (!again && meNow().T.sets > 0) return;
  const now = Date.now(), cfg = S.cfg;
  cfg.swap = {}; cfg.order = {};
  /* again: the lifter asked for the plan back after changing it. The set counts and the slots that old workouts read stay as they are */
  if (!again) { cfg.slots = {}; cfg.base = {}; }
  fitPlanData(fitAns(me)).forEach((list, w) => {
    const ids = list.map((x, i) => {
      let id = x.id;
      if (x.kind === 'swap') cfg.swap[id] = x.mv;
      else if (x.kind === 'repl') {
        /* a slot that was made for this movement before is taken again */
        id = Object.keys(cfg.slots).find((k) => cfg.slots[k].w === w && cfg.slots[k].a === x.mv) || 'c' + now.toString(36) + w + i;
        if (!cfg.slots[id]) cfg.slots[id] = { w, a: x.mv, sets: x.full, reps: x.reps, rest: x.rest.slice() };
      }
      if (!again && x.sets !== x.full) cfg.base[id] = { n: x.sets, t: now, x: 1 };
      return id;
    });
    if (ids.join() !== PLAN[w].ex.map((e) => e.id).join()) cfg.order[w] = ids;
  });
  saveCfg();
}
/* the week the answers in the opening ask for */
const obWeek = () => WEEKS[OB.days] || week();
/* what the plan will be, before it is made: how many exercises a workout has, the sets they get, and how long it runs.
   A plan that was already trained stays as it is, so there the numbers are its own */
function planPreview() {
  const fresh = meNow().T.sets === 0, span = (a) => { const lo = Math.min.apply(null, a), hi = Math.max.apply(null, a); return lo === hi ? '' + lo : Ltr(lo + '–' + hi); };
  const all = fresh ? fitPlanData(fitAns(OB)) : null, lists = obWeek().map((w) => (fresh ? all[w].map((x) => ({ sets: x.sets, reps: x.r, rest: x.t })) : exList(w, undefined, true)));
  return { ex: span(lists.map((l) => l.length)), sets: span([].concat.apply([], lists.map((l) => l.map((e) => e.sets)))), mins: span(lists.map(fullMins)) };
}

/* what the plan is fitted to, one line for each, in the lifter's own answers */
const buildSteps = () => [
  [say('בוחר תרגילים לחדר כושר', 'Choosing exercises for a gym'), say('בוחר תרגילי קליסטניקס', 'Choosing calisthenics exercises'), say('בוחר תרגילים לבית עם משקולות', 'Choosing exercises for home with dumbbells'), say('בוחר תרגילים לבית בלי ציוד', 'Choosing exercises that need no equipment')][OB.place | 0],
  OB.days === 1 ? say('בונה שבוע של אימון אחד', 'Building a week of one workout') : say('בונה שבוע של ', 'Building a week of ') + (OB.days || 3) + say(' אימונים', ' workouts'),
  [say('קובע סטים למתחיל', 'Setting the sets for a beginner'), say('קובע סטים למתאמן קבוע', 'Setting the sets for a regular lifter'), say('קובע סטים למנוסה', 'Setting the sets for an experienced lifter'), say('קובע סטים לותיק', 'Setting the sets for a veteran')][OB.exp == null ? 1 : OB.exp],
  say('מכוון חזרות ומנוחות למטרות שלך', 'Tuning reps and rests to your goals'),
  OB.pain.length ? say('מחליף תרגילים שמעמיסים על מה שכואב', 'Swapping out what loads the sore spots') : OB.focus.length ? say('מוסיף סטים למה שחשוב לך', 'Adding sets where it matters to you') : say('מאזן בין כל השרירים', 'Balancing every muscle'),
  say('מחשב כמה זמן כל אימון לוקח', 'Working out how long each workout takes'),
];
/* a number in a big square, with a minus and a plus: the days of the week, the age */
const numBox = (id, v, unit, less, more) => '<div class="ob-num" role="group" aria-labelledby="obTitle"><button type="button" class="ob-st" data-obn="-1" aria-label="' + less + '">−</button>' +
  '<label class="ob-nbox"><input id="' + id + '" type="text" inputmode="numeric" maxlength="2" autocomplete="off" value="' + v + '" aria-label="' + unit + '"><span>' + unit + '</span></label>' +
  '<button type="button" class="ob-st" data-obn="1" aria-label="' + more + '">+</button></div>';
function obHTML() {
  const st = OB_STEPS[OB.step], nm = String(OB.name || '').trim();
  const ask = (t, sub, big) => '<div class="ob-q' + (big ? ' big' : '') + '"><span class="ob-eilon" aria-hidden="true">' + avatarSVG(COACH, COACH_LVL, big ? {} : { bust: true }) + '</span><div class="ob-bub"><h1 id="obTitle">' + t + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div></div>';
  const card = (key, i, ic, t, sub, on, multi) => '<button type="button" class="ob-opt" role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="' + on + '" data-ob="' + key + '" data-v="' + i + '"><i class="ob-ic" aria-hidden="true">' + ic + '</i><span><b>' + t + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span><i class="ob-chk" aria-hidden="true">' + ICON.check + '</i></button>';
  const group = (multi, inner, cls) => '<div class="ob-opts' + (cls || '') + '" role="' + (multi ? 'group' : 'radiogroup') + '" aria-labelledby="obTitle">' + inner + '</div>';
  const chip = (key, i, t, on, multi) => '<button type="button" class="ob-chip" role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="' + on + '" data-ob="' + key + '" data-v="' + i + '">' + t + '</button>';
  let body, cta = say('המשך', 'Continue'), can = true, quiet = false;
  if (st === 'film') {
    cta = say('בוא נתחיל', "Let's start");
    body = '<div class="ob-hello"><h1 id="obTitle">' + say('היי אני אילון', 'Hi, I am Eilon') + '</h1><p>' + say('נבנה לך תוכנית אישית', 'Let us build a plan of your own') + '</p></div>';
  } else if (st === 'name') {
    body = ask(say('איך קוראים לך', 'What is your name'), '', true) +
      '<div class="ob-name"><input class="ob-in-name" id="obName" type="text" dir="auto" maxlength="16" autocomplete="given-name" enterkeyhint="next" aria-labelledby="obTitle" placeholder="' + say('השם שלך', 'Your name') + '" value="' + esc(OB.name) + '"></div>';
  } else if (st === 'exp') {
    body = ask(say('כמה ניסיון יש לך', 'How much experience do you have')) +
      group(false, EXP().map((o, i) => card('exp', i, i < 3 ? platesIcon(i + 1) : OBI.crown, o[0], o[1], OB.exp === i)).join('')) +
      '<div class="ob-pre" id="obPre" aria-hidden="true">' + avatar(1) + '</div>';
    can = OB.exp != null;
  } else if (st === 'goals') {
    body = ask(say('מה חשוב לך', 'What matters to you')) +
      group(true, GOAL_ORDER.map((i) => card('goals', i, GOAL_IC[i], GOALS()[i][0], '', OB.goals.includes(i), true).replace('class="ob-ic"', 'class="ob-ic gi g' + i + '"')).join(''), ' g2');
    can = OB.goals.length > 0;
  } else if (st === 'days') {
    body = ask(say('כמה ימים בשבוע תתאמן', 'How many days a week will you train')) +
      numBox('obDays', OB.days || 3, say('ימים בשבוע', 'days a week'), say('יום פחות', 'One day less'), say('יום יותר', 'One day more'));
  } else if (st === 'place') {
    body = ask(say('איפה תתאמן', 'Where will you train')) +
      group(false, WHERE().map((t, i) => card('place', i, [OBI.gym, OBI.park, OBI.bell, OBI.home][i], t, '', OB.place === i)).join(''));
    can = OB.place != null;
  } else if (st === 'quick') {
    const q = OB.q | 0;
    if (q === 0) {
      body = ask(say('מה הגיל שלך', 'How old are you')) + numBox('obAge', OB.age || 25, say('שנים', 'years'), say('שנה פחות', 'One year less'), say('שנה יותר', 'One year more'));
    } else if (q === 1) {
      /* height and weight: not a must. What is written here is the first day of the body log */
      const box = (id, v, ph, unit, lab, mode, max) => '<label class="ob-nbox"><input id="' + id + '" type="text" inputmode="' + mode + '" maxlength="' + max + '" autocomplete="off" placeholder="' + ph + '" value="' + (v == null ? '' : v) + '" aria-label="' + lab + '"><span>' + unit + '</span></label>';
      body = ask(say('מה הגובה והמשקל שלך', 'Your height and weight')) + '<div class="ob-hw" role="group" aria-labelledby="obTitle">' + box('obH', OB.h, '170', say('סנטימטר', 'cm'), say('גובה בסנטימטר', 'Height in cm'), 'numeric', 3) + box('obKg', OB.kg, '70', say('קילו', 'kg'), say('משקל בקילו', 'Weight in kg'), 'decimal', 5) + '</div>' +
        '<button class="link ob-may" id="obHwSkip" type="button">' + say('דלג', 'Skip') + '</button>';
    } else if (q === 2) {
      body = ask(say('איזה אזור הכי חשוב לך', 'Which area matters most to you')) +
        '<div class="ob-chips" role="group" aria-labelledby="obTitle">' + chip('focus', -1, say('הכול', 'All of it'), !OB.focus.length, true).replace('class="ob-chip"', 'class="ob-chip all"') + AREAS().map((t, i) => chip('focus', i, t, OB.focus.includes(i), true)).join('') + '</div>';
    } else {
      body = ask(say('משהו כואב או רגיש', 'Does anything hurt')) +
        '<div class="ob-chips" role="group" aria-labelledby="obTitle">' + chip('pain', -1, say('הכול בסדר', 'All good'), !OB.pain.length, true).replace('class="ob-chip"', 'class="ob-chip all"') + OUCH().map((t, i) => chip('pain', i, t, OB.pain.includes(i), true)).join('') + '</div>';
    }
  } else if (st === 'look') {
    body = ask(say('האווטאר שלך', 'Your avatar')) +
      '<div class="ob-av"><div class="ob-av-fig"><div class="lk-stage" id="lkStage">' + avatar(S.lvl || 1) + '</div><div class="lk-photo-box" id="lkPhotoBox">' + lookPhoto() + '</div></div>' +
      '<div class="ob-av-ed lk-ed" id="lkRows">' + lookRows() + '</div></div>';
  } else if (st === 'plan' && OB.building) {
    can = false;
    body = ask(say('רגע אני בונה לך תוכנית', 'One moment, I am building your plan')) +
      '<div class="ob-build" id="obBuild"><div class="ob-ring" role="img" aria-label="' + say('בונה את התוכנית', 'Building the plan') + '"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="t" cx="60" cy="60" r="52"/><circle class="f" id="obRing" cx="60" cy="60" r="52" pathLength="100"/></svg><b id="obPct" aria-hidden="true">' + Ltr('0%') + '</b></div>' +
      '<ul class="ob-steps">' + buildSteps().map((t) => '<li><i aria-hidden="true">' + ICON.check + '</i><span>' + t + '</span></li>').join('') + '</ul></div>';
  } else if (st === 'plan') {
    const fresh = meNow().T.sets === 0, all = fresh ? fitPlanData(fitAns(OB)) : null, wk = obWeek();
    const lists = wk.map((w) => (fresh ? all[w].map((x) => ({ sets: x.sets, reps: x.r, rest: x.t })) : exList(w, undefined, true)));
    const pv = planPreview(), stat = (v, t) => '<li><b>' + v + '</b><span>' + t + '</span></li>';
    cta = say('נראה טוב', 'Looks good');
    body = ask(say('התוכנית שלך', 'Your plan')) +
      '<section class="ob-plan2' + (OB.reveal ? ' reveal' : '') + '" aria-label="' + say('התוכנית שלך', 'Your plan') + '">' +
      '<ul class="pl-stats">' + stat(wk.length, wk.length === 1 ? say('אימון בשבוע', 'workout a week') : say('אימונים בשבוע', 'workouts a week')) + stat(pv.mins, say('דקות לאימון', 'minutes each')) + stat(pv.ex, say('תרגילים באימון', 'exercises each')) + '</ul>' +
      '<ol class="ob-wks2">' + wk.map((w, k) => '<li style="--i:' + k + '"><i aria-hidden="true">' + (k + 1) + '</i><span><b>' + say('אימון ', 'Workout ') + (k + 1) + '</b><small>' + wkMus(w) + '</small></span><em><span><b>' + fullMins(lists[k]) + '</b>' + say(' דק׳', ' min') + '</span><small>' + cnt(lists[k].length, 'תרגילים', 'תרגיל אחד', 'exercises', 'exercise') + '</small></em></li>').join('') + '</ol>' +
      '<p class="ob-wk-tip">' + glyph('pen') + '<span>' + say('אפשר לתת לכל אימון שם משלך אחר כך', 'You can give each workout a name of your own later') + '</span></p></section>';
  } else {
    const old = meNow().T.wk > 0, cap = (a, b) => '<figcaption>' + a + '<b>' + b + '</b></figcaption>';
    cta = old ? say('קדימה', "Let's go") : say('לאימון הראשון', 'To the first workout');
    body = '<div class="ob-done"><canvas class="confetti" id="obConfetti" aria-hidden="true"></canvas><h1 id="obTitle">' + (nm ? '<bdi>' + esc(nm) + '</bdi> ' + say('הכול מוכן', 'you are all set') : say('הכול מוכן', 'You are all set')) + '</h1>' +
      '<p class="ob-sub">' + say('כל אימון מקרב אותך לרמה 100', 'Every workout takes you closer to level 100') + '</p>' +
      '<div class="ob-ladder" aria-hidden="true"><figure class="now"><span class="ob-fig">' + avatar(1) + '</span>' + cap(say('היום', 'Today'), say('רמה 1', 'Level 1')) + '</figure>' +
      '<span class="ob-go">' + ICON.fwd + ICON.fwd + ICON.fwd + '</span>' +
      '<figure class="max"><span class="ob-fig">' + avatar(100) + '</span>' + cap(say('המטרה', 'The goal'), say('רמה 100', 'Level 100')) + '</figure></div>' +
      '<p class="ob-note">' + say('האפליקציה לא מחליפה ייעוץ רפואי', 'The app does not replace medical advice') + '</p></div>';
  }
  const langs = '<div class="seg ob-lang" role="group" aria-labelledby="obLangL"><span class="sr" id="obLangL">' + LANG_LABEL + '</span>' + LANGS.map((l) => '<button type="button" data-lang="' + l[0] + '" lang="' + l[0] + '" aria-pressed="' + (LANG === l[0]) + '">' + l[1] + '</button>').join('') + '</div>';
  const first = st === 'film', fin = st === 'done', last = OB_LAST - 1;
  return (first ? filmHTML() : fin ? '<div class="ob-film fin" aria-hidden="true"></div>' : '') +
    '<div class="ob-in' + (first ? ' film' : '') + (fin ? ' fin' : '') + (OB.stay ? ' stay' : '') + '" data-step="' + OB.step + '" data-k="' + st + '"><div class="ob-top' + (first ? ' first' : '') + '">' +
    (first ? '<button class="ob-skip" id="obSkip" type="button">' + say('דלג', 'Skip') + ICON.fwd + '</button>' : '<button class="fx-nav" id="obBack" type="button" aria-label="' + say('חזרה', 'Back') + '">' + ICON.back + '</button>') +
    (first ? '<span class="ob-sp"></span>' : fin ? '<span></span>' : '<div class="ob-prog" role="img" aria-label="' + say('שלב ' + OB.step + ' מתוך ' + last, 'Step ' + OB.step + ' of ' + last) + '"><i style="width:' + Math.round((Math.min(OB.step, last) / last) * 100) + '%"></i></div>') +
    (first ? '<div class="logo ob-logo" role="img" aria-label="gymi by Lior Dahan"><span class="logo-w" aria-hidden="true">gym<span class="logo-i">i</span></span><small aria-hidden="true">by Lior Dahan</small></div>' : '<span class="ob-sp"></span>') + '</div>' +
    '<div class="ob-body' + (OB.dir ? ' in' : '') + '">' + body + '</div>' +
    '<div class="ob-foot"><button class="btn big' + (quiet ? '' : ' primary') + '" id="obNext" type="button"' + (can ? '' : ' disabled') + '>' + cta + '</button>' + (first ? langs : '') + '</div></div>';
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
const BUILD_MS = 780;
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
  if (obIs('days') && OB.days == null) OB.days = 3;
  if (obIs('quick') && (OB.q | 0) === 0 && OB.age == null) OB.age = 25;
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
  LK.tab = 'body'; LK.note = '';
  Object.assign(OB, { on: true, step: 0, dir: 0, beat: 0, q: 0, stay: false, building: false, reveal: false, playT: 0, stepAt: 0, was: me.ob, name: me.name || '', exp: me.exp, goals: (me.goals || []).slice(), time: me.time, eq: me.eq, days: me.days, place: me.place, age: me.age, focus: (me.focus || []).slice(), pain: (me.pain || []).slice(), fb: me.fb == null ? 2 : me.fb });
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
    me.place = OB.place == null ? 0 : OB.place; me.age = OB.age; if (OB.h || OB.kg) me.body = OB.kg ? bodyPut({ h: OB.h || me.body.h, log: me.body.log }, { d: isoDay(new Date()), kg: OB.kg }) : cleanBody({ h: OB.h, log: me.body.log }); me.focus = OB.focus.slice(); me.pain = OB.pain.slice(); me.time = null; me.fb = OB.fb; me.made = me.made || Date.now();
    if (OB.days != null && OB.days !== me.days) { me.days = OB.days; if (!live(S.tab)) S.tab = nextUp().next; }
    fitPlan();
  }
  me.ob = Date.now(); S.cfg.lang = LANG; saveCfg();
  closeOb(); setView('home'); renderAll();
  /* a lifter who has just come in is shown around, once */
  if (!skip && !me.tour) setTimeout(startTour, 700);
}
/* ---- the tour with Eilon. Once the opening is passed the screen goes dark but for one thing, and only that thing works: there
   is no skip. A lifter with no workout yet is taken through a sample of the first one (the start, a set, the rest, how it ends);
   what was logged on the way is taken back at the end of it. Then the journey, the profile and the chat. A step is one of:
   tap  - the lit control itself has to be pressed (the tour goes on when the app has moved on: done())
   free - the lit card is used as it is (typing, choosing), and the tour goes on when done()
   else - Eilon's own button goes on ---- */
const TR = { on: false, i: 0, steps: [], iv: 0, was: null };
function tourSteps() {
  const full = !Object.keys(S.sessions).length, girl = S.cfg.me.look.body === 1;
  const A = [{ at: '#homeGo', tap: full, t: full ? say('זה האימון הראשון שלך תלחץ התחל ונעבור עליו ביחד', 'This is your first workout. Tap Start and we will go through it together') : say('מכאן מתחילים כל אימון', 'Every workout starts here'), done: () => S.view === 'workout' }];
  /* a short sample of the first workout: the numbers, a set, the rest. Its questions and its opening screen wait for the real one */
  if (full) A.push(
    { at: '#dock .dk-nums', t: say('כאן קובעים משקל וחזרות ולמעלה רואים איך עושים את התרגיל', 'Set the weight and the reps here. Above, you see how the exercise is done') },
    { at: '#dkHit', tap: 1, t: say('אחרי הסט לוחצים סיימתי סט', 'After the set, tap Set done'), done: () => rest.on },
    { at: '#rtSkip', tap: 1, t: say('השעון סופר לך מנוחה וכשמוכנים לוחצים המשך', 'The clock counts your rest. When you are ready, tap Continue'), done: () => !rest.on, leave: tourUndo }
  );
  A.push(
    { at: '#bodyBtn', enter: () => { if (S.view !== 'profile') setView('profile'); }, t: girl ? say('כאן השקילות שלך מתעדים כמה שוקלים בכל יום', 'Your weigh-ins: what you weigh, day by day') : say('זה יומן הגוף כאן אתה מתעד כמה אתה שוקל בכל יום', 'This is the body log. Write down here what you weigh, day by day') },
    { at: '#chatOpen', alt: '.chat-h', enter: () => { if (S.view !== 'home') setView('home'); window.scrollTo(0, 0); }, t: say('ואני תמיד כאן לכל שאלה', 'And I am always here for any question') }
  );
  return A;
}
/* each step of the tour speaks in a colour of its own */
const TOUR_C = ['#6D3FE0', '#2B78F0', '#12A679', '#F2792E', '#E0457B', '#6D3FE0'];
const tourEl = (st) => { const ok = (x) => (x && x.getBoundingClientRect().width > 0 ? x : null); return st && st.at ? ok($(st.at)) || ok(st.alt && $(st.alt)) : null; };
/* what the sample workout logged is taken back, and the workout waits untouched for the real first time */
function tourUndo() {
  const w = S.tab, sx = live(w);
  clearTimeout(S.slideT); clearInterval(rest.iv); rest.on = false; rest.last = null;
  if (sx) { delete S.sessions[sx.id]; S.dirty.delete(sx.id); }
  delete S.day[w]; S.timeAsk = null; S.eqAsk = null; S.eqOpen = false; S.miss = {}; S.combo = 0; S.open = null; S.edit = null; S.drafts = {}; S.justDone = null;
  for (const o of $$('.gain')) o.remove();
  exIntroOff(); saveLocal(); setView('home'); renderAll(); window.scrollTo(0, 0);
}
/* the light goes to what is spoken of, and Eilon stands on the half of the screen that it is not in. now: without the glide */
function tourPlace(now) {
  if (!TR.on) return;
  const st = TR.steps[TR.i], el = tourEl(st), box = $('#tour'), hole = $('#tourHole'), card = $('#tourCard');
  box.classList.toggle('now', !!now); box.classList.toggle('wait', !!st.at && !el);
  if (!st.at || !el) {
    /* nothing to light: the whole screen is dark and Eilon stands in the middle of it */
    hole.style.left = innerWidth / 2 + 'px'; hole.style.top = innerHeight / 2 + 'px'; hole.style.width = '0px'; hole.style.height = '0px';
    card.style.top = 'auto'; card.style.bottom = Math.round(innerHeight * 0.36) + 'px';
    return;
  }
  let r = el.getBoundingClientRect();
  /* what is spoken of is brought onto the screen first (the bar at the foot is always there) */
  if (!el.closest('#tabbar,#dock,#pre,#exIntro') && (r.top < 90 || r.bottom > innerHeight - 120)) { window.scrollTo(0, Math.max(0, window.scrollY + r.top - innerHeight * 0.3)); r = el.getBoundingClientRect(); }
  const pad = 7, x = r.left - pad, y = r.top - pad, w = r.width + pad * 2, h = r.height + pad * 2, low = y + h / 2 > innerHeight / 2;
  hole.style.left = x + 'px'; hole.style.top = y + 'px'; hole.style.width = w + 'px'; hole.style.height = h + 'px'; hole.style.borderRadius = Math.min(24, h / 2) + 'px';
  /* Eilon stands clear of what is lit: under it, over it, or where the screen has room when it fills most of the screen */
  const room = 150;
  if (!low && y + h + room < innerHeight) { card.style.top = y + h + 18 + 'px'; card.style.bottom = 'auto'; }
  else if (low && y > room) { card.style.top = 'auto'; card.style.bottom = innerHeight - y + 18 + 'px'; }
  else { card.style.top = '8px'; card.style.bottom = 'auto'; }
}
function tourShow() {
  const T = TR.steps, st = T[TR.i], card = $('#tourCard'), own = !st.tap && !st.free;
  $('#tourText').textContent = st.t; $('#tour').style.setProperty('--tc', TOUR_C[TR.i % TOUR_C.length]);
  $('#tourDots').innerHTML = T.map((_, i) => '<i' + (i === TR.i ? ' class="on"' : '') + '></i>').join('');
  const nx = $('#tourNext'); nx.hidden = !own; nx.textContent = TR.i === T.length - 1 ? say('מתחילים', 'Let\'s go') : say('הבא', 'Next');
  tourPlace(TR.i === 0);
  if (TR.i > 0 && !reduced) { card.classList.remove('hop'); void card.offsetWidth; card.classList.add('hop'); }
  if (own) nx.focus({ preventScroll: true });
}
/* the tour's own frame, in the language of the page (drawn again when the language changes under it) */
function tourDraw() {
  const box = $('#tour');
  box.setAttribute('aria-label', say('סיור קצר באפליקציה', 'A short tour of the app'));
  box.innerHTML = '<div class="tour-hole" id="tourHole"></div>' +
    '<div class="tour-card" id="tourCard"><span class="tour-fig" aria-hidden="true">' + avatarSVG(COACH, COACH_LVL, {}) + '</span>' +
    '<div class="tour-say" dir="' + (LANG === 'he' ? 'rtl' : 'ltr') + '"><p id="tourText" aria-live="polite"></p><div class="tour-foot"><span class="tour-dots" id="tourDots" aria-hidden="true"></span><button class="btn primary" id="tourNext" type="button"></button></div></div></div>';
  const av = $('.tour-fig .av', box); if (av) av.classList.add('grin');
  tourShow();
}
/* a few times a second: the light follows what it is on, and a step that waits for the app goes on when the app has moved */
function tourTick() {
  if (!TR.on) return;
  const st = TR.steps[TR.i], el = tourEl(st), act = st.tap || st.free;
  if (el) { TR.seen = TR.i; TR.gone = 0; } else TR.gone = (TR.gone || 0) + 1;
  /* the app has moved on from what was lit (or it went away by itself, as a rest that ran out does): the tour goes on */
  if (act && st.done && st.done() && (TR.seen === TR.i || TR.gone >= 6)) { tourGo(); return; }
  /* what this step is about never came (a step that this workout does not have), and a later one is already here: pass it over */
  if (act && st.at && !el && TR.steps.slice(TR.i + 1).some((x) => tourEl(x))) { tourGo(); return; }
  tourPlace(true);
}
function startTour() {
  if (TR.on || OB.on || !$('#sheet').hidden) return;
  closeChat(); if (S.view !== 'home') { renderHome(); setView('home'); }
  window.scrollTo(0, 0);
  TR.on = true; TR.i = 0; TR.seen = -1; TR.gone = 0; TR.steps = tourSteps();
  document.body.classList.add('touring');
  tourDraw(); $('#tour').hidden = false;
  clearInterval(TR.iv); TR.iv = setInterval(tourTick, 220);
}
function tourGo() {
  if (!TR.on) return;
  const st = TR.steps[TR.i];
  if (st.leave) st.leave();
  if (TR.i >= TR.steps.length - 1) { tourEnd(); return; }
  TR.i++; TR.gone = 0; if (TR.steps[TR.i].enter) TR.steps[TR.i].enter(); tourShow(); haptic('select');
}
const tourStep = tourGo;
function tourEnd() {
  if (!TR.on) return;
  /* left in the middle of the sample workout (the Escape key): what it logged is taken back all the same */
  const mid = TR.steps.slice(TR.i).find((x) => x.leave); if (mid && S.view === 'workout') mid.leave();
  TR.on = false; clearInterval(TR.iv); document.body.classList.remove('touring');
  const box = $('#tour'); box.hidden = true; box.innerHTML = '';
  if (!S.cfg.me.tour) { S.cfg.me.tour = Date.now(); saveCfg(); }
  window.scrollTo(0, 0);
  /* the page is back in reach a moment later: the way in is the next workout, and it shows it */
  setTimeout(() => { const go = $('#homeGo'); if (!go || TR.on || S.view !== 'home') return; go.focus({ preventScroll: true }); go.classList.add('nudge'); setTimeout(() => go.classList.remove('nudge'), 2600); }, 80);
}
/* while the tour is on, a touch or a key reaches only what is lit (when the step is one to press or to use) and Eilon's own card */
function tourGuard(ev) {
  if (!TR.on) return;
  const st = TR.steps[TR.i], t = ev.target, inCard = t && t.closest && t.closest('#tourCard');
  if (ev.type === 'keydown') { if (ev.key === 'Escape' || inCard) return; }
  else if (inCard) return;
  const el = tourEl(st);
  if ((st.tap || st.free) && el && t && el.contains(t)) return;
  ev.stopPropagation(); if (ev.cancelable) ev.preventDefault();
}
function obStep(d) {
  /* the three quick questions are one step of the opening: forward and back walk through them first */
  if (obIs('quick')) { const q = (OB.q | 0) + d; if (q >= 0 && q <= 3) { OB.q = q; OB.stepAt = Date.now(); OB.dir = d; OB.stay = true; if (d > 0) sfx('step'); renderOb(); return; } }
  const n = OB.step + d; if (n < 0) return;
  OB.stepAt = Date.now();
  if (OB_STEPS[n] === 'quick') OB.q = d > 0 ? 0 : 3;
  if (n > OB_LAST) { obFinish(false); return; }
  if (d > 0 && n < OB_LAST) sfx('step');
  /* Eilon stays where he stands from one question to the next: only the words and the answers arrive. (On the name he
     stands larger, in the middle, and the last screen has none of him, so there he arrives) */
  const side = (i) => i >= 2 && i < OB_LAST;
  OB.stay = side(OB.step) && side(n); OB.step = n; OB.dir = d;
  /* the plan is built on the way forward only; on the way back it is simply there */
  const made = d > 0 && OB_STEPS[n] === 'plan'; OB.building = made && !reduced; OB.reveal = made && reduced;
  renderOb();
}
/* a digit of the code; the fourth asks for the code again, and the same code twice is kept */
function maybeOb() {
  /* passed on another device while open here: they close. Opened again from the profile, they were passed before, and stay */
  if (OB.on) { if (S.cfg.me.ob && S.cfg.me.ob !== OB.was) closeOb(); return; }
  if (S.cfgReady && !S.cfg.me.ob && nextUp().live < 0 && $('#sheet').hidden) openOb();
}
function wireOb() {
  const tour = $('#tour');
  tour.addEventListener('click', (ev) => { if (ev.target.closest('#tourNext')) tourGo(); });
  for (const k of ['click', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'keydown', 'wheel']) document.addEventListener(k, tourGuard, { capture: true, passive: false });
  for (const t of ['resize', 'scroll']) window.addEventListener(t, () => { if (TR.on) tourPlace(true); }, { passive: true });
  const el = $('#ob');
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    /* a touch on the film moves it on to its next beat */
    if (!b) { if (ev.target.closest('#obBuild')) obBuilt(); return; }
    if (b.id === 'obNext') { if (ev.detail !== 0 && Date.now() - (OB.stepAt || 0) < 300) return; obStep(1); }
    else if (b.id === 'obBack') obStep(-1);
    else if (b.id === 'obSkip') obFinish(true);
    else if (b.id === 'obHwSkip') { OB.h = null; OB.kg = null; obStep(1); }
    /* the minus and the plus beside a number: the days of the week, the age */
    else if (b.dataset.obn) {
      const days = obIs('days'), inp = $(days ? '#obDays' : '#obAge'); if (!inp) return;
      const v = clamp((parseInt(inp.value, 10) || (days ? 3 : 25)) + +b.dataset.obn, days ? 1 : 10, days ? 7 : 99);
      inp.value = v; if (days) OB.days = v; else OB.age = v; $('#obNext').disabled = false; haptic('select');
    }
    else if (b.dataset.lang) { if (b.getAttribute('aria-pressed') === 'true') return; obFade(() => { setLang(b.dataset.lang, true); renderOb(); }); }
    /* an answer is marked where it stands: the screen does not arrive a second time */
    else if (b.dataset.ob) {
      const k = b.dataset.ob, v = +b.dataset.v;
      if (k === 'goals') { const i = OB.goals.indexOf(v); if (i >= 0) OB.goals.splice(i, 1); else OB.goals.push(v); b.setAttribute('aria-checked', String(i < 0)); $('#obNext').disabled = !OB.goals.length; }
      /* as many as wanted; "all" stands alone, and takes the others off */
      else if (k === 'focus' || k === 'pain') {
        if (v < 0) OB[k] = []; else { const i = OB[k].indexOf(v); if (i >= 0) OB[k].splice(i, 1); else OB[k].push(v); }
        for (const o of $$('[data-ob="' + k + '"]', el)) o.setAttribute('aria-checked', String(+o.dataset.v < 0 ? !OB[k].length : OB[k].includes(+o.dataset.v)));
      }
      else { OB[k] = v; for (const o of $$('[data-ob="' + k + '"]', el)) o.setAttribute('aria-checked', String(o === b)); $('#obNext').disabled = false; }
      haptic('select');
      if (k === 'exp') obPre();
    }
    else if (b.dataset.look) setLook(b.dataset.look, +b.dataset.v);
    else if (b.dataset.lktab) lookTab(b.dataset.lktab);
    else if (b.id === 'lkPhoto') $('#lkFile').click();
  });
  el.addEventListener('input', (ev) => {
    const t = ev.target;
    if (t.id === 'obName') OB.name = t.value;
    /* a number that is typed: kept when it is one that can be, and the way on waits for one */
    if (t.id === 'obH') { const v = parseInt(String(t.value).replace(/[^0-9]/g, ''), 10); OB.h = v >= 100 && v <= 250 ? v : null; }
    if (t.id === 'obKg') { const v = num(t.value); OB.kg = v != null && v >= 20 && v <= 400 ? v : null; }
    if (t.id === 'obDays' || t.id === 'obAge') {
      const days = t.id === 'obDays', v = parseInt(String(t.value).replace(/[^0-9]/g, ''), 10), ok = days ? v >= 1 && v <= 7 : v >= 10 && v <= 99;
      if (days) OB.days = ok ? v : null; else OB.age = ok ? v : null;
      $('#obNext').disabled = !ok;
    }
  });
  el.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.id === 'obName') { ev.preventDefault(); obStep(1); }
    if (ev.key === 'Enter' && (ev.target.id === 'obDays' || ev.target.id === 'obAge') && !$('#obNext').disabled) { ev.preventDefault(); obStep(1); }
  });
}
