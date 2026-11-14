/* ================================================================== language
   Every text is written in both languages where it is used: say('עברית', 'English'). */
let LANG = 'he';
const say = (he, en) => (LANG === 'en' ? en : he);
/* the languages, each under its own name, and the label of the choice between them (read by both kinds of reader) */
const LANGS = [['he', 'עברית'], ['en', 'English']], LANG_LABEL = '<span lang="en">Language</span> · <span lang="he">שפה</span>';

/* ================================================================== plan */
/* each workout: name = the short English name kept in exports, t / te = the title shown in the app in Hebrew / English */
const E = (id, a, name, sets, reps, rest, int, lvl, suf) => ({ id, a, name, sets, reps, rest, int, lvl, suf: suf || '' });
const PLAN = [
  { name: 'Upper A', t: 'שריון', te: 'Armor', m: 'חזה · גב · זרועות', me: 'Chest · back · arms', ex: [
    E('ua1', 'inclineSmith', 'Incline Smith Machine Press', 3, '6–10', [120, 180], '1 חזרה לפני כשל', 2),
    E('ua2', 'assistedPullup', 'Assisted Pull-ups', 3, '6–10', [120, 120], '1 חזרה לפני כשל', 2),
    E('ua3', 'chestRow', 'Chest Supported Row', 3, '8–12', [120, 120], '1 חזרה לפני כשל', 2),
    E('ua4', 'latRaise', 'Chest Supported Lateral Raises', 3, '12–15', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('ua5', 'machinePress', 'Machine Chest Press', 2, '8–12', [90, 90], 'סט אחרון לכשל טכני', 3),
    E('ua6', 'pushdown', 'Triceps Pushdown', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('ua7', 'dbCurl', 'Dumbbell Curl', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('ua8', 'cableCrunch', 'Cable Crunch', 3, '10–15', [60, 60], 'חזרות קשות ומבוקרות', 0),
  ] },
  { name: 'Lower A', t: 'סלע', te: 'Bedrock', m: 'רגליים · ישבן', me: 'Legs · glutes', ex: [
    E('la1', 'hackSquat', 'Hack Squat', 3, '6–10', [120, 180], '1–2 חזרות לפני כשל', 1),
    E('la2', 'rdl', 'Romanian Deadlift', 3, '8–10', [120, 180], '1–2 חזרות לפני כשל', 1),
    E('la3', 'legPress', 'Leg Press', 3, '10–15', [120, 120], '1 חזרה לפני כשל', 2),
    E('la4', 'seatedLegCurl', 'Seated Leg Curl', 3, '10–15', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('la5', 'standingCalf', 'Standing Calf Raises', 3, '12–18', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('la6', 'pallof', 'Pallof Press', 2, '12', [60, 60], 'שליטה מלאה', 0, 'לצד'),
  ] },
  { name: 'Upper B', t: 'כנפיים', te: 'Wings', m: 'גב · כתפיים · זרועות', me: 'Back · shoulders · arms', ex: [
    E('ub1', 'assistedPullup', 'Assisted Pull-ups', 3, '6–10', [120, 120], '1 חזרה לפני כשל', 2),
    E('ub2', 'inclineSmith', 'Incline Smith Machine Press', 3, '8–12', [120, 120], '1 חזרה לפני כשל', 2),
    E('ub3', 'cableRow', 'Seated Cable Row', 3, '8–12', [90, 90], '1 חזרה לפני כשל', 2),
    E('ub4', 'latRaise', 'Chest Supported Lateral Raises', 3, '12–20', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('ub5', 'shoulderPress', 'Machine Shoulder Press', 2, '8–12', [90, 90], '1 חזרה לפני כשל', 2),
    E('ub6', 'reversePec', 'Reverse Pec Deck', 2, '12–20', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('ub7', 'hammerCurl', 'Hammer Curl', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('ub8', 'ohTriceps', 'Overhead Triceps Extension', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('ub9', 'kneeRaise', 'Hanging Knee Raises', 3, '8–15', [60, 60], 'חזרות נקיות', 0),
  ] },
  { name: 'Lower B', t: 'זינוק', te: 'Launch', m: 'ישבן · רגליים · בטן', me: 'Glutes · legs · core', ex: [
    E('lb1', 'hackSquat', 'Hack Squat / Smith Squat', 3, '8–12', [120, 180], '1–2 חזרות לפני כשל', 1),
    E('lb2', 'bulgarian', 'Bulgarian Split Squat', 2, '8–10', [120, 120], '1–2 חזרות לפני כשל', 1, 'לרגל'),
    E('lb3', 'hipThrust', 'Hip Thrust', 3, '8–12', [120, 120], '1 חזרה לפני כשל', 2),
    E('lb4', 'lyingLegCurl', 'Lying Leg Curl', 3, '10–15', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('lb5', 'legExt', 'Leg Extension', 2, '12–15', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('lb6', 'seatedCalf', 'Seated Calf Raises', 3, '12–20', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('lb7', 'cableCrunch', 'Cable Crunch', 3, '10–15', [60, 60], 'חזרות קשות ומבוקרות', 0),
  ] },
  /* ---- for two or three workouts a week: the whole body each time ---- */
  { name: 'Full A', t: 'מנוע', te: 'Engine', m: 'כל הגוף', me: 'Full body', ex: [
    E('fa1', 'hackSquat', 'Hack Squat', 3, '6–10', [120, 180], '1–2 חזרות לפני כשל', 1),
    E('fa2', 'inclineSmith', 'Incline Smith Machine Press', 3, '6–10', [120, 180], '1 חזרה לפני כשל', 2),
    E('fa3', 'chestRow', 'Chest Supported Row', 3, '8–12', [120, 120], '1 חזרה לפני כשל', 2),
    E('fa4', 'rdl', 'Romanian Deadlift', 2, '8–10', [120, 180], '1–2 חזרות לפני כשל', 1),
    E('fa5', 'latRaise', 'Chest Supported Lateral Raises', 2, '12–15', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('fa6', 'pushdown', 'Triceps Pushdown', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('fa7', 'cableCrunch', 'Cable Crunch', 2, '10–15', [60, 60], 'חזרות קשות ומבוקרות', 0),
  ] },
  { name: 'Full B', t: 'סערה', te: 'Storm', m: 'כל הגוף', me: 'Full body', ex: [
    E('fb1', 'legPress', 'Leg Press', 3, '10–15', [120, 120], '1 חזרה לפני כשל', 2),
    E('fb2', 'assistedPullup', 'Assisted Pull-ups', 3, '6–10', [120, 120], '1 חזרה לפני כשל', 2),
    E('fb3', 'machinePress', 'Machine Chest Press', 3, '8–12', [90, 120], '1 חזרה לפני כשל', 2),
    E('fb4', 'seatedLegCurl', 'Seated Leg Curl', 2, '10–15', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('fb5', 'shoulderPress', 'Machine Shoulder Press', 2, '8–12', [90, 90], '1 חזרה לפני כשל', 2),
    E('fb6', 'dbCurl', 'Dumbbell Curl', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('fb7', 'standingCalf', 'Standing Calf Raises', 2, '12–18', [60, 60], 'סט אחרון לכשל טכני', 3),
  ] },
  { name: 'Full C', t: 'להבה', te: 'Blaze', m: 'כל הגוף', me: 'Full body', ex: [
    E('fc1', 'hipThrust', 'Hip Thrust', 3, '8–12', [120, 120], '1 חזרה לפני כשל', 2),
    E('fc2', 'cableRow', 'Seated Cable Row', 3, '8–12', [90, 120], '1 חזרה לפני כשל', 2),
    E('fc3', 'inclineSmith', 'Incline Smith Machine Press', 3, '8–12', [120, 120], '1 חזרה לפני כשל', 2),
    E('fc4', 'bulgarian', 'Bulgarian Split Squat', 2, '8–10', [120, 120], '1–2 חזרות לפני כשל', 1, 'לרגל'),
    E('fc5', 'reversePec', 'Reverse Pec Deck', 2, '12–20', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('fc6', 'hammerCurl', 'Hammer Curl', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('fc7', 'ohTriceps', 'Overhead Triceps Extension', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('fc8', 'kneeRaise', 'Hanging Knee Raises', 2, '8–15', [60, 60], 'חזרות נקיות', 0),
  ] },
  /* ---- for five workouts a week: the upper and lower days, then pushing, pulling and legs ---- */
  { name: 'Push', t: 'פטיש', te: 'Hammer', m: 'חזה · כתפיים · טרייספס', me: 'Chest · shoulders · triceps', ex: [
    E('pu1', 'inclineSmith', 'Incline Smith Machine Press', 3, '6–10', [120, 180], '1 חזרה לפני כשל', 2),
    E('pu2', 'shoulderPress', 'Machine Shoulder Press', 3, '8–12', [90, 120], '1 חזרה לפני כשל', 2),
    E('pu3', 'machinePress', 'Machine Chest Press', 2, '8–12', [90, 90], 'סט אחרון לכשל טכני', 3),
    E('pu4', 'latRaise', 'Chest Supported Lateral Raises', 3, '12–20', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('pu5', 'pushdown', 'Triceps Pushdown', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('pu6', 'ohTriceps', 'Overhead Triceps Extension', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
  ] },
  { name: 'Pull', t: 'עוגן', te: 'Anchor', m: 'גב · ביספס · בטן', me: 'Back · biceps · core', ex: [
    E('pl1', 'assistedPullup', 'Assisted Pull-ups', 3, '6–10', [120, 120], '1 חזרה לפני כשל', 2),
    E('pl2', 'chestRow', 'Chest Supported Row', 3, '8–12', [120, 120], '1 חזרה לפני כשל', 2),
    E('pl3', 'cableRow', 'Seated Cable Row', 2, '8–12', [90, 90], '1 חזרה לפני כשל', 2),
    E('pl4', 'reversePec', 'Reverse Pec Deck', 2, '12–20', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('pl5', 'dbCurl', 'Dumbbell Curl', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('pl6', 'hammerCurl', 'Hammer Curl', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('pl7', 'cableCrunch', 'Cable Crunch', 3, '10–15', [60, 60], 'חזרות קשות ומבוקרות', 0),
  ] },
  { name: 'Legs', t: 'עמוד', te: 'Pillar', m: 'רגליים · ישבן · שוקיים', me: 'Legs · glutes · calves', ex: [
    E('lg1', 'hackSquat', 'Hack Squat', 3, '6–10', [120, 180], '1–2 חזרות לפני כשל', 1),
    E('lg2', 'rdl', 'Romanian Deadlift', 3, '8–10', [120, 180], '1–2 חזרות לפני כשל', 1),
    E('lg3', 'legExt', 'Leg Extension', 2, '12–15', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('lg4', 'lyingLegCurl', 'Lying Leg Curl', 3, '10–15', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('lg5', 'seatedCalf', 'Seated Calf Raises', 3, '12–20', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('lg6', 'pallof', 'Pallof Press', 2, '12', [60, 60], 'שליטה מלאה', 0, 'לצד'),
  ] },
];
/* ---- the week: which of the workouts above are trained, by how many workouts a week the lifter can do. Each workout keeps its
   place in PLAN for good (a workout that was logged names its workout by that place), so changing the number of days never
   changes what an old workout was ---- */
const WEEKS = { 2: [4, 5], 3: [4, 5, 6], 4: [0, 1, 2, 3], 5: [0, 1, 7, 8, 9] };
const DAYS_OK = [2, 3, 4, 5];
const week = () => WEEKS[typeof S !== 'undefined' && S.cfg && S.cfg.me && S.cfg.me.days] || WEEKS[4];
const inWeek = (w) => week().includes(w);
/* a workout's place in the week (0 for the first), and the colour that goes with that place */
const posOf = (w) => Math.max(0, week().indexOf(w));
const wkTone = (w) => 'w' + (posOf(w) % 5);
/* how a workout is called in the app: a name of its own ("שריון"), the muscles it trains, and its place in the week ("אימון ראשון") */
const ORD = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const wkName = (w) => say(PLAN[w].t, PLAN[w].te);
const wkMus = (w) => say(PLAN[w].m, PLAN[w].me);
const wkOrd = (w) => say('אימון ' + ORD[posOf(w)], 'Workout ' + (posOf(w) + 1));
const wkFull = (w) => wkOrd(w) + ' – ' + wkName(w);
const wkShort = (w) => wkName(w);
/* a count with its noun: "3 סטים" / "3 sets", "סט אחד" / "1 set" */
const cnt = (n, heN, he1, enN, en1) => (LANG === 'en' ? n + ' ' + (n === 1 ? en1 : enN) : n === 1 ? he1 : n + ' ' + heN);
/* "from → to", in the direction the page is read */
const arrow = () => say(' ← ', ' → ');
/* dates in the language of the page; in English the month is written out, so that day and month cannot be confused */
const dateFmt = () => (LANG === 'en' ? new Intl.DateTimeFormat(/^en\b/i.test(navigator.language || '') ? navigator.language : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : new Intl.DateTimeFormat('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' }));
/* the plan's own notes in English, by their Hebrew text */
const PLAN_EN = { '1 חזרה לפני כשל': '1 rep before failure', '1–2 חזרות לפני כשל': '1–2 reps before failure', 'סט אחרון לכשל טכני': 'Last set to failure', 'חזרות קשות ומבוקרות': 'Hard, controlled reps', 'שליטה מלאה': 'Full control', 'חזרות נקיות': 'Clean reps', 'לצד': 'per side', 'לרגל': 'per leg' };
const planNote = (he) => (he ? say(he, PLAN_EN[he] || he) : '');
