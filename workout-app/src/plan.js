/* ================================================================== plan */
/* each workout: name = the English name kept in exports, t = the Hebrew title shown in the app */
const E = (id, a, name, sets, reps, rest, int, lvl, suf) => ({ id, a, name, sets, reps, rest, int, lvl, suf: suf || '' });
const PLAN = [
  { name: 'Upper A', t: 'גוף עליון A', ex: [
    E('ua1', 'inclineSmith', 'Incline Smith Machine Press', 3, '6–10', [120, 180], '1 חזרה לפני כשל', 2),
    E('ua2', 'assistedPullup', 'Assisted Pull-ups', 3, '6–10', [120, 120], '1 חזרה לפני כשל', 2),
    E('ua3', 'chestRow', 'Chest Supported Row', 3, '8–12', [120, 120], '1 חזרה לפני כשל', 2),
    E('ua4', 'latRaise', 'Chest Supported Lateral Raises', 3, '12–15', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('ua5', 'machinePress', 'Machine Chest Press', 2, '8–12', [90, 90], 'סט אחרון לכשל טכני', 3),
    E('ua6', 'pushdown', 'Triceps Pushdown', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('ua7', 'dbCurl', 'Dumbbell Curl', 2, '10–15', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('ua8', 'cableCrunch', 'Cable Crunch', 3, '10–15', [60, 60], 'חזרות קשות ומבוקרות', 0),
  ] },
  { name: 'Lower A', t: 'גוף תחתון A', ex: [
    E('la1', 'hackSquat', 'Hack Squat', 3, '6–10', [120, 180], '1–2 חזרות לפני כשל', 1),
    E('la2', 'rdl', 'Romanian Deadlift', 3, '8–10', [120, 180], '1–2 חזרות לפני כשל', 1),
    E('la3', 'legPress', 'Leg Press', 3, '10–15', [120, 120], '1 חזרה לפני כשל', 2),
    E('la4', 'seatedLegCurl', 'Seated Leg Curl', 3, '10–15', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('la5', 'standingCalf', 'Standing Calf Raises', 3, '12–18', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('la6', 'pallof', 'Pallof Press', 2, '12', [60, 60], 'שליטה מלאה', 0, 'לצד'),
  ] },
  { name: 'Upper B', t: 'גוף עליון B', ex: [
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
  { name: 'Lower B', t: 'גוף תחתון B', ex: [
    E('lb1', 'hackSquat', 'Hack Squat / Smith Squat', 3, '8–12', [120, 180], '1–2 חזרות לפני כשל', 1),
    E('lb2', 'bulgarian', 'Bulgarian Split Squat', 2, '8–10', [120, 120], '1–2 חזרות לפני כשל', 1, 'לרגל'),
    E('lb3', 'hipThrust', 'Hip Thrust', 3, '8–12', [120, 120], '1 חזרה לפני כשל', 2),
    E('lb4', 'lyingLegCurl', 'Lying Leg Curl', 3, '10–15', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('lb5', 'legExt', 'Leg Extension', 2, '12–15', [75, 75], 'סט אחרון לכשל טכני', 3),
    E('lb6', 'seatedCalf', 'Seated Calf Raises', 3, '12–20', [60, 60], 'סט אחרון לכשל טכני', 3),
    E('lb7', 'cableCrunch', 'Cable Crunch', 3, '10–15', [60, 60], 'חזרות קשות ומבוקרות', 0),
  ] },
];
/* how a workout is called in the app: "אימון ראשון – גוף עליון A" */
const ORD = ['ראשון', 'שני', 'שלישי', 'רביעי'];
const wkOrd = (w) => 'אימון ' + ORD[w];
const wkFull = (w) => wkOrd(w) + ' – ' + PLAN[w].t;
