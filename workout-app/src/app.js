/* ================================================================== workout UI */
const valHTML = (r) => Ltr(r.kg != null ? Ltr(fmtKg(r.kg)) + '<small><bdi>' + say(' ק״ג', ' kg') + '</bdi></small>' + Ltr(' × ' + (r.reps != null ? r.reps : '–')) : Ltr(r.reps != null ? r.reps : '–') + '<small><bdi>' + say(' חז׳', ' reps') + '</bdi></small>');
/* what today's set is trying to beat */
const MODE = () => ({ reps: [say('יותר חזרות', 'More reps'), 'g-reps'], weight: [say('יותר משקל', 'More weight'), 'g-wt'], hold: [say('כמו בפעם הקודמת', 'Same as last time'), ''], base: [say('התחלה חדשה', 'Fresh start'), ''], deload: [say('שבוע קל', 'Easy week'), ''], down: [say('פחות משקל', 'Less weight'), 'g-down'], cal: [say('משקל מעודכן', 'New weight'), 'g-cal'] });
function badge(T, e) {
  const M = T && MODE()[T.mode];
  if (!M) return '';
  const inv = LIB[e.mv].inv, t = inv && T.mode === 'weight' ? say('פחות סיוע', 'Less help') : inv && T.mode === 'down' ? say('יותר סיוע', 'More help') : M[0];
  return '<button class="goal ' + M[1] + '" id="dkWhy" type="button" aria-expanded="' + !!S.why + '">' + t + '</button>';
}
/* why the target is what it is, in one sentence */
function whyText(T, e) {
  const last = T.ref ? Ltr(fmtRow(T.ref)) : '', inv = LIB[e.mv].inv;
  if (T.mode === 'reps') return last ? say('בפעם הקודמת עשית ' + last + '. היום מנסים יותר חזרות.', 'Last time you did ' + last + '. Today, more reps.') : say('היום מנסים יותר חזרות.', 'Today, more reps.');
  if (T.mode === 'weight') return inv ? say('הגעת לראש טווח החזרות, אז הסיוע יורד.', 'You reached the top of the rep range, so the help comes down.') : say('הגעת לראש טווח החזרות, אז המשקל עולה.', 'You reached the top of the rep range, so the weight goes up.');
  if (T.mode === 'hold') return last ? say('חוזרים על מה שעשית בפעם הקודמת: ' + last + '.', 'Repeat what you did last time: ' + last + '.') : say('חוזרים על הפעם הקודמת.', 'Repeat last time.');
  if (T.mode === 'base') return say('סבב חדש מתחיל קל יותר, אז היעד נמוך.', 'A new round starts easier, so the target is lower.');
  if (T.mode === 'deload') return say('שבוע קל: פחות עומס, כדי להתאושש.', 'Easy week: less load, to recover.');
  if (T.mode === 'down') return inv ? say('הסט הקודם ירד מתחת לטווח, אז מוסיפים סיוע.', 'The last set fell under the range, so the help goes up.') : say('הסט הקודם ירד מתחת לטווח, אז מורידים משקל.', 'The last set fell under the range, so the weight comes down.');
  if (T.mode === 'cal') return say('עשית הרבה יותר מהיעד, אז המשקל מתעדכן.', 'You did far more than the target, so the weight is updated.');
  return '';
}
/* the exercise on screen: the one that was opened, else the first that still has a set to do, else the first */
function shown() {
  const s = live(S.tab), list = exList(S.tab, s);
  return (S.open && list.find((x) => x.id === S.open)) || list.find((x) => firstUndone(s, x) >= 0) || list[0] || null;
}
/* the set the dock is about: the next one of the exercise on screen. null once that exercise is finished */
function cursor() {
  const s = live(S.tab), e = shown(), i = e ? firstUndone(s, e) : -1;
  return i >= 0 ? { e, i } : null;
}
const anyLeft = (s) => exList(S.tab, s).some((x) => firstUndone(s, x) >= 0);
/* ---- four places: today, one workout, the profile, progress ---- */
function setView(v, keep) {
  S.view = v; $('#app').dataset.view = v; $('#app').dataset.w = S.tab;
  for (const b of $$('#tabbar [data-view]')) { if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
  if (v === 'profile') renderProfile();
  if (!keep) window.scrollTo(0, 0);
}
/* open a workout: the one that is next (from the big button) or one picked from the week */
function openWorkout(w, picked) {
  if (picked) S.touched = true;
  if (w !== S.tab) { S.open = null; S.edit = null; S.draft = null; S.resetAsk = false; S.fbFor = null; S.preOpen = false; S.banner = ''; S.bannerKind = ''; if (rest.on) { clearInterval(rest.iv); rest.on = false; rest.last = null; } }
  S.tab = w; setView('workout'); renderAll();
}
const minsOf = (list) => Math.round(list.reduce((n, e) => n + e.sets * (45 + (e.rest[0] + e.rest[1]) / 2), 0) / 300) * 5;
const bannerHTML = () => (S.banner ? '<div class="banner ' + (S.bannerKind || '') + '"><p>' + S.banner + '</p><button type="button" class="banner-x" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' : '');
/* today: the player, the workout that is next (or running), and the week as a path of four stops */
function renderHome() {
  const nu = nextUp(), w = nu.live >= 0 ? nu.live : nu.next, s = live(w), list = exList(w, s), P = phase(w, s), M = S.cfg.meso;
  const total = list.reduce((n, e) => n + e.sets, 0), dn = s ? list.reduce((n, e) => n + doneCount(s, e), 0) : 0;
  const ended = (i) => mesoSessions(M.id).filter((x) => x.w === i && x.end).length, over = mesoDone(M), base = ended(nu.next);
  const SAY = { live: say('באמצע', 'in progress'), next: say('הבא', 'next'), done: say('הושלם', 'complete'), todo: say('עוד לא', 'not yet') };
  const week = PLAN.map((x, i) => {
    const st = live(i) ? 'live' : i === nu.next ? 'next' : !over && ended(i) > base ? 'done' : 'todo';
    return '<button class="tab w' + i + ' ' + st + '" type="button" data-tab="' + i + '" aria-label="' + wkFull(i) + ', ' + SAY[st] + '"' + (i === w ? ' aria-current="true"' : '') + '><span class="dot" aria-hidden="true">' + (st === 'done' ? ICON.check : i + 1) + '</span><b>' + wkShort(i) + '</b></button>';
  }).join('');
  $('#home').innerHTML = playerHTML(meNow()) + bannerHTML() +
    '<section class="card next w' + w + '" aria-label="' + (s ? say('האימון שבאמצע', 'The workout in progress') : say('האימון הבא', 'The next workout')) + '"><div class="next-top"><p class="k">' + wkOrd(w) + '</p><span class="xp-tag" title="' + say('נקודות על אימון מלא', 'Points for the full workout') + '">' + Ltr('+' + xpPlan(list)) + '</span></div><h2>' + wkName(w) + '</h2>' +
    '<p class="meta">' + (s ? dn + say(' מתוך ', ' of ') + total + say(' סטים', ' sets') : cnt(list.length, 'תרגילים', 'תרגיל אחד', 'exercises', 'exercise') + ' · ' + minsOf(list) + say(' דק׳', ' min')) + '</p>' +
    '<button class="btn primary big" id="homeGo" type="button" data-w="' + w + '">' + (s ? say('המשך אימון', 'Continue workout') : say('התחל אימון', 'Start workout')) + '</button></section>' +
    '<section class="card week" aria-label="' + say('האימונים של השבוע', 'This week\'s workouts') + '"><div class="card-h"><h2>' + (!P.m ? say('השבוע', 'This week') : P.dl ? say('שבוע קל', 'Easy week') : say('שבוע ', 'Week ') + P.wk + ' <small>' + say('מתוך ', 'of ') + S.cfg.weeks + '</small>') + '</h2>' + '<button class="go-link" id="planBtn" type="button" aria-label="' + say('התוכנית והסבב', 'The plan and the round') + '">' + say('התוכנית', 'Plan') + ICON.fwd + '</button></div><div class="week-row" id="tabs">' + week + '</div></section>';
}
function renderTabs() { renderHome(); }
/* a workout that is under way is marked on "today", from wherever the lifter is looking */
function markLive() { const b = $('#tabbar [data-view="home"]'), on = nextUp().live >= 0; b.classList.toggle('live', on); const s = $('.tb-l', b); if (s) s.title = on ? say('אימון באמצע', 'A workout is in progress') : ''; }
const totals = () => { const s = live(S.tab), l = exList(S.tab, s); return { total: l.reduce((n, e) => n + e.sets, 0), dn: l.reduce((n, e) => n + doneCount(s, e), 0) }; };
/* how far the workout is: one quiet bar of the sets done */
function updateProgress() {
  const t = totals(), pct = t.total ? Math.round((Math.min(t.dn, t.total) / t.total) * 100) : 0;
  $('#wkBar').innerHTML = '<div class="bar" role="img" aria-label="' + t.dn + say(' מתוך ', ' of ') + t.total + say(' סטים', ' sets') + '"><i style="width:' + pct + '%"></i></div>';
}
/* the top of a workout: its name, and which exercise of it is on screen */
function renderHero() {
  const list = exList(S.tab), cur = $('#app').classList.contains('pre-on') ? null : shown(), i = cur ? list.findIndex((x) => x.id === cur.id) : -1;
  $('#app').dataset.w = S.tab;
  $('#wkTitle').innerHTML = '<b>' + wkName(S.tab) + '</b><span class="sub">' + (i >= 0 ? say('תרגיל ', 'Exercise ') + (i + 1) + say(' מתוך ', ' of ') + list.length : wkOrd(S.tab)) + '</span>';
  $('#hero').innerHTML = bannerHTML();
  updateProgress();
}
/* one row of the list of all exercises: its place, its name and what it asks for. Once it is under way, how far it is */
function rowHTML(e, i, s) {
  const dn = doneCount(s, e), off = e.cut && e.sets === 0, full = !off && dn >= e.sets, part = dn > 0 && !full && !off;
  return '<li class="ex' + (full ? ' done' : '') + (off ? ' off' : '') + '" data-id="' + e.id + '">' +
    '<button class="ex-head" type="button">' +
    '<span class="ex-n">' + (off ? '–' : full ? ICON.check : i + 1) + '</span>' +
    '<span class="ex-title"><span class="ex-name">' + e.nm + '</span>' + (e.cut ? '<span class="ex-sub">' + (off ? say('בוטל היום', 'Off today') : say('קוצר היום', 'Cut short today')) + '</span>' : '') + '</span>' +
    '<span class="ex-rx' + (part ? ' part' : '') + '">' + Ltr(part ? dn + '/' + e.sets : (off ? e.n0 : e.sets) + ' × ' + e.reps) + '</span>' +
    '</button></li>';
}
/* a set in short: weight × reps, or the reps alone with their unit when there is no weight */
const setVal = (r) => Ltr(fmtRow(r)) + (r.kg == null ? '<small> ' + say('חז׳', 'reps') + '</small>' : '');
/* the sets of the exercise on screen as one slim row: what was lifted, then what is aimed for */
function setsHTML(e) {
  const s = live(S.tab), r = rowsOf(s, e.id), cur = cursor(), fu = firstUndone(s, e), T0 = fu >= 0 ? targetOf(e, fu, s) : null;
  let h = '';
  for (let i = 0; i < e.sets; i++) {
    const row = r[i], on = isDone(row), isCur = !S.edit && !!cur && cur.e.id === e.id && cur.i === i, T = on ? null : i === fu ? T0 : targetOf(e, i, s), ed = on && !!S.edit && S.edit.ex === e.id && S.edit.i === i;
    const label = say('סט ', 'Set ') + (i + 1) + (on ? ': ' + fmtRow(row) + (row.pr ? say(', שיא', ', personal best') : '') + say(', עריכה', ', edit') : T ? say(', יעד ', ', target ') + fmtRow(T) : '');
    const pop = on && S.justDone && S.justDone.ex === e.id && S.justDone.i === i && Date.now() - S.justDone.t < 1200;
    h += '<button class="setp' + (on ? ' done' : isCur ? ' cur' : '') + (ed ? ' cur' : '') + (pop ? ' pop' + (row.pr ? ' pr-pop' : '') : '') + '" type="button" data-i="' + i + '" aria-label="' + label + '">' +
      (on ? (row.pr ? '<span class="pr" aria-hidden="true">' + glyph('star') + '</span>' : '') + '<span class="v">' + setVal(row) + '</span>' : '<span class="hint">' + (T ? setVal(T) : '–') + '</span>') + '</button>';
  }
  if (e.cut) h += '<p class="cut-note">' + (e.sets ? say('שאר הסטים בוטלו היום בגלל כאב.', 'The remaining sets are off today because of pain.') : say('בוטל היום בגלל כאב.', 'Off today because of pain.')) + '</p>';
  return h;
}
/* strength trend for one movement in its slot: the best set of each past workout */
function trendHTML(e) {
  const w = wkOf(e.id), pe = planEx(e.id), L = LIB[e.mv], pts = [];
  for (const s of sorted().reverse()) {
    if (s.w !== w || moveOf(pe, s) !== e.mv) continue;
    const rows = rowsOf(s, e.id).filter((x) => isDone(x) && x.reps != null); if (!rows.length) continue;
    const top = rows.reduce((a, b) => (score(L, b.kg, b.reps) > score(L, a.kg, a.reps) ? b : a));
    pts.push({ v: score(L, top.kg, top.reps), row: top, ts: s.ts });
  }
  const P = pts.slice(-12);
  if (P.length < 2) return '';
  const lo = Math.min.apply(null, P.map((p) => p.v)), hi = Math.max.apply(null, P.map((p) => p.v)), X = (i) => 6 + (i * 106) / (P.length - 1), Y = (v) => 38 - ((v - lo) / (hi - lo || 1)) * 32;
  const line = P.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join(' '), last = P[P.length - 1], prevP = P[P.length - 2];
  const d = prevP.v ? ((last.v - prevP.v) / prevP.v) * 100 : 0, cls = d > 0.4 ? 'up' : d < -0.4 ? 'dn' : '';
  return '<div class="trend"><span class="k">' + say('הכוח שלך · ' + P.length + ' אימונים', 'Your strength · ' + P.length + ' workouts') + '</span><span class="val">' + valHTML(last.row) + '</span>' +
    '<span class="d ' + cls + '">' + (cls === 'up' ? '▲ ' : cls === 'dn' ? '▼ ' : say('בלי שינוי', 'No change')) + (cls ? Ltr(Math.abs(d).toFixed(1) + '%') : '') + '</span>' +
    '<svg viewBox="0 0 118 44" role="img" aria-label="' + say('מגמת הכוח ב-' + P.length + ' האימונים האחרונים', 'Strength over the last ' + P.length + ' workouts') + '"><path d="' + line + ' L112 44 L6 44 Z" fill="var(--ink-3)" opacity=".12"/><path d="' + line + '" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + X(P.length - 1).toFixed(1) + '" cy="' + Y(last.v).toFixed(1) + '" r="4.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/></svg></div>';
}
/* one question about the exercise that was just finished. Pain is asked only when the lifter says something hurt */
const LOAD = () => [say('קל מדי', 'Too easy'), say('מתאים', 'Just right'), say('כבד מדי', 'Too heavy')];
function fbHTML(e, s) {
  const f = (s && s.fb && s.fb[e.id]) || {};
  const seg = (key, name, list, off) => '<div class="seg" role="group" aria-label="' + name + '">' + list.map((t, v) => '<button type="button" data-fb="' + key + '" data-v="' + (v + off) + '" aria-pressed="' + (f[key] === v + off) + '">' + t + '</button>').join('') + '</div>';
  return '<div class="fbk" data-ex="' + e.id + '">' + (f.pain === 2 ? '' : seg('load', say('איך היה', 'How was it'), LOAD(), 0)) +
    (S.fbPain === e.id || f.pain > 0 ? seg('pain', say('כאב', 'Pain'), [say('כאב קל', 'Mild pain'), say('כאב חזק', 'Strong pain')], 1) : '<button class="link" type="button" data-painask="' + e.id + '">' + say('משהו כאב?', 'Did something hurt?') + '</button>') + '</div>';
}
/* after a strong pain report: what stops today, and a gentler movement to move to. A headline, one line, one action */
function painNote(e, s) {
  const f = s && s.fb && s.fb[e.id]; if (!f || f.pain !== 2) return '';
  const alt = gentleAlt(e), set = alt && S.cfg.swap[e.id] === alt, mu = LIB[e.mv].p;
  return '<div class="fb-stop"><b>' + say(MUSCLE[mu].he + ': עוצרים להיום', muName(mu) + ': stopping for today') + '</b>' +
    (!alt ? '' : set ? '<p>' + say('מהאימון הבא: ', 'From next workout: ') + mvName(alt) + '</p>'
      : '<p>' + (LIB[alt].jf ? say('נוח יותר למפרקים: ', 'Easier on the joints: ') : say('אפשר במקום: ', 'Instead, you could do: ')) + mvName(alt) + '</p><button class="btn" type="button" data-swapto="' + e.id + ':' + alt + '">' + say('להחליף מהאימון הבא', 'Swap from next workout') + '</button>') +
    '<p class="fine">' + say('אם הכאב נמשך, כדאי להיבדק.', 'If the pain goes on, have it checked.') + '</p></div>';
}
/* what is asked in this exercise, as one line of plain text. How many sets there are is what the row of sets shows */
function rxLine(e, s) {
  const rir = rirOf(e, s);
  return Ltr(e.reps) + say(' חזרות', ' reps') + (e.suf ? ' ' + e.suf : '') + ' · ' + (rir == null ? e.int : rirText(rir));
}
function bodyHTML(e) {
  return '<button class="stage-wrap" type="button" aria-pressed="' + !player.playing + '"><canvas class="stage" aria-hidden="true"></canvas><span class="stage-play" aria-hidden="true">' + ICON.go + '</span></button>' +
    '<p class="muscles"><i></i><span>' + mvMus(e.mv) + '</span></p>' +
    '<div class="sets">' + setsHTML(e) + '</div>' +
    '<div class="ex-acts"><button class="act swap" type="button" aria-label="' + say('החלף תרגיל', 'Swap exercise') + '">' + ICON.swap + say('החלף', 'Swap') + '</button><button class="act how" type="button" aria-label="' + say('איך עושים את התרגיל', 'How to do the exercise') + '">' + ICON.go + say('איך?', 'How') + '</button><button class="act more" type="button">' + ICON.dots + say('עוד', 'More') + '</button></div>';
}
/* the exercise on screen: its name and what is asked, the demo, the sets, and three quiet actions */
function focusHTML(e, i, n) {
  const off = e.cut && e.sets === 0, s = live(S.tab), full = !off && doneCount(s, e) >= e.sets;
  return '<li class="ex open' + (full ? ' done' : '') + (off ? ' off' : '') + '" data-id="' + e.id + '">' +
    '<div class="fx-head"><button class="fx-nav" id="exPrev" type="button" aria-label="' + say('התרגיל הקודם', 'Previous exercise') + '"' + (i > 0 ? '' : ' disabled') + '>' + ICON.back + '</button>' +
    '<div class="fx-t"><h1 class="ex-name">' + e.nm + '</h1><p class="fx-rx">' + rxLine(e, s) + '</p></div>' +
    '<button class="fx-nav" id="exNext" type="button" aria-label="' + say('התרגיל הבא', 'Next exercise') + '"' + (i < n - 1 ? '' : ' disabled') + '>' + ICON.fwd + '</button></div>' +
    '<div class="ex-body" id="body-' + e.id + '">' + bodyHTML(e) + '</div></li>';
}
/* ---- one tap away: how to do the movement ---- */
function openHow(id) {
  const e = findEx(id), sh = $('#sheet'); if (!e) return;
  S.sheet = 'how';
  sh.innerHTML = '<div class="sheet-in hw" role="dialog" aria-modal="true" aria-label="' + say('איך עושים', 'How to do it') + '"><div class="ed-h"><div><p class="kicker">' + say('איך עושים', 'How to do it') + '</p><h2>' + e.nm + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    '<ul class="cues">' + mvCues(e.mv).map((c) => '<li>' + c + '</li>').join('') + '</ul>' +
    (e.a !== e.mv ? '<p class="fine">' + say('ההדמיה מראה תנועה דומה.', 'The demo shows a similar movement.') + '</p>' : '') + (LANG === 'he' ? '<p class="en-name">' + Ltr(esc(e.name)) + '</p>' : '') + '</div>';
  sh.hidden = false;
}
/* ---- one tap away: the lifter's note, what happened before, and the less common actions ---- */
function renderMore() {
  const e = S.open && findEx(S.open), sh = $('#sheet'); if (!e) { closeSheet(); return; }
  const s = live(S.tab), ref = refRow(e, 0, s), tr = trendHTML(e), fu = firstUndone(s, e), fill = fu >= 0 && e.sets - fu > 0 && !!targetOf(e, fu, s), rated = !!s && rowsOf(s, e.id).some(isDone);
  const dn = rowsOf(s, e.id).filter(isDone).length, dl = phase(S.tab, s).dl, inPlan = planIds(S.tab).includes(e.id);
  const hist = (ref && !ref.other ? '<p class="prev-line">' + say('פעם קודמת', 'Last time') + ' (' + ago(ref.ts) + '): ' + rowsOf(S.sessions[ref.sid], e.id).filter(isDone).map((x) => Ltr(fmtRow(x))).join(' · ') + '</p>' : '') + tr;
  sh.innerHTML = '<div class="sheet-in mr" role="dialog" aria-modal="true" aria-label="' + say('עוד', 'More') + '"><div class="ed-h"><div><p class="kicker">' + say('עוד', 'More') + '</p><h2>' + e.nm + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    '<label class="note"><span>' + say('הערה שנשארת עם התרגיל', 'A note that stays with this exercise') + '</span><textarea class="note-in" rows="2" maxlength="200" placeholder="' + say('גובה מושב, קצב, דגש', 'Seat height, tempo, a cue') + '">' + esc(S.cfg.notes[e.mv] || '') + '</textarea></label>' +
    (e.cut || dl || !inPlan ? '' : '<div class="m-row"><span>' + say('סטים בתרגיל', 'Sets in this exercise') + '</span><div class="stp"><button type="button" data-base="' + e.id + '" data-n="' + (e.n0 - 1) + '" aria-label="' + say('סט אחד פחות', 'One set less') + '"' + (e.n0 <= Math.max(1, dn) ? ' disabled' : '') + '>−</button><b>' + e.n0 + '</b><button type="button" data-base="' + e.id + '" data-n="' + (e.n0 + 1) + '" aria-label="' + say('סט נוסף', 'One more set') + '"' + (e.n0 >= MAX_SETS ? ' disabled' : '') + '>+</button></div></div>') +
    '<section><h3>' + say('היסטוריה', 'History') + '</h3>' + (hist || '<p class="empty-note">' + say('עוד אין היסטוריה לתרגיל הזה.', 'No history for this exercise yet.') + '</p>') + '</section>' +
    (rated ? '<section><h3>' + say('איך היה?', 'How was it?') + '</h3>' + fbHTML(e, s) + painNote(e, s) + '</section>' : '') +
    '<div class="mr-acts">' + (fill ? '<button class="btn" id="moreSame" type="button">' + say('רשום את כל הסטים לפי היעד', 'Log every set at its target') + '</button>' : '') + '<button class="btn ask" id="moreAsk" type="button">' + say('שאל את אילון', 'Ask Eilon') + '</button></div></div>';
}
function openMore(id) { if (!findEx(id)) return; S.sheet = 'more'; renderMore(); $('#sheet').hidden = false; }
function saveNote(mv, text) {
  const v = String(text || '').trim().slice(0, 200);
  if (!LIB[mv] || (S.cfg.notes[mv] || '') === v) return;
  if (v) S.cfg.notes[mv] = v; else delete S.cfg.notes[mv];
  saveCfg();
}
/* clicks inside those two sheets; returns true when the click was handled */
function exSheetClick(ev, id) {
  if (S.sheet !== 'more' && S.sheet !== 'how') return false;
  const fb = ev.target.closest('[data-fb]'), ask = ev.target.closest('[data-painask]'), sn = ev.target.closest('[data-swapto]');
  if (fb) { onFb(fb.closest('.fbk').dataset.ex, fb.dataset.fb, +fb.dataset.v); if (S.sheet === 'more') renderMore(); return true; }
  if (ask) { S.fbPain = ask.dataset.painask; renderMore(); return true; }
  if (sn) { const q = sn.dataset.swapto.split(':'); swapNext(q[0], q[1]); renderMore(); return true; }
  const st = S.sheet === 'more' && ev.target.closest('[data-base]');
  if (st) { const e = findEx(st.dataset.base); if (e) { S.touched = true; S.draft = null; setBase(e.id, +st.dataset.n); refreshEx(e); renderDock(); renderMore(); const again = $('#sheet [data-base][data-n="' + (+st.dataset.n > e.n0 ? e.n0 + 2 : e.n0 - 2) + '"]') || $('#sheet .stp button:not(:disabled)'); if (again) again.focus({ preventScroll: true }); } return true; }
  if (id === 'moreSame') { const e = findEx(S.open); closeSheet(); if (e) { S.touched = true; fillTargets(e); } return true; }
  if (id === 'moreAsk') { const x = S.open; closeSheet(); openChat(x); return true; }
  return false;
}
function renderHistory() {
  const all = sorted().filter((x) => hasDone(x) && x.end), list = all.slice(0, S.histN || 6), df = dateFmt();
  renderGains(); renderBackup();
  /* each finished workout is one row; a tap opens it for fixing, moving to another day or deleting */
  $('#history').innerHTML = '<h2 class="sec">' + say('אימונים אחרונים', 'Recent workouts') + '</h2>' + (list.length ? '<ul class="rows">' + list.map((x) => { const mn = Math.max(1, Math.round((x.end - x.ts) / 60000)); return '<li class="tap"><button class="row-b" type="button" data-edit="' + x.id + '" aria-label="' + wkFull(x.w) + say(', עריכה', ', edit') + '"><span class="h-t">' + wkName(x.w) + '</span><span class="h-s">' + df.format(new Date(x.ts)) + ' · ' + cnt(setsDone(x), 'סטים', 'סט אחד', 'sets', 'set') + (mn < 300 ? ' · ' + mn + say(' דק׳', ' min') : '') + '</span>' + ICON.fwd + '</button></li>'; }).join('') + '</ul>' + (all.length > list.length ? '<button class="link" id="histMore" type="button">' + say('עוד אימונים', 'More workouts') + '</button>' : '')
    : '<p class="empty-note">' + say('האימונים שתסיים יופיעו כאן.', 'Workouts you finish will show up here.') + '</p>');
}
/* one file with every workout and the settings: saved from here, or read back in */
function renderBackup() {
  const box = $('#backup'); if (!box) return;
  box.innerHTML = '<h3>' + say('גיבוי', 'Backup') + '</h3><div class="backup-act">' +
    (S.dl ? '<button class="btn" id="backupBtn" type="button">' + say('שמירה לקובץ', 'Save to a file') + '</button>' : '') + '<button class="btn" id="restoreBtn" type="button">' + say('שחזור מקובץ', 'Restore') + '</button>' + (S.dl && sorted().some((x) => hasDone(x) && x.end) ? '<button class="btn" id="exportBtn" type="button">' + say('ייצוא CSV', 'Export CSV') + '</button>' : '') + '</div>' +
    (S.backupNote ? '<p class="backup-note" role="status">' + S.backupNote + '</p>' : '') + '<p class="ms-sub" id="syncNote2">' + (S.syncT || '') + '</p>';
}
async function exportBackup() {
  if (!S.dl) return;
  try { await S.dl.save({ filename: 'gymi-backup-' + isoDay(new Date()) + '.json', data: backupData() }); S.backupNote = say('הגיבוי נשמר.', 'The backup was saved.'); }
  catch (e) { if (e && e.code !== 'declined' && e.code !== 'rate_limited') S.backupNote = say('השמירה נכשלה.', 'Saving failed.'); }
  renderBackup();
}
function importBackup(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    const r = restoreData(String(rd.result || ''));
    const kept = r && r.kept ? say('ההגדרות שבמכשיר הזה חדשות יותר מאלה שבקובץ, ולכן הן נשארו.', "This device's settings are newer than the file's, so they were kept.") : '';
    S.backupNote = !r ? say('זה לא קובץ גיבוי של gymi.', 'This is not a gymi backup file.') : r.n ? (r.n === 1 ? say('אימון אחד שוחזר.', '1 workout was restored.') : r.n + say(' אימונים שוחזרו.', ' workouts were restored.')) + (kept && ' ' + kept) : kept || (r.cfg ? say('ההגדרות שוחזרו.', 'The settings were restored.') : say('אין בקובץ שום דבר חדש.', 'Nothing new in this file.'));
    if (r) { sweep(); meSync(); if (!S.touched) S.tab = nextUp().next; S.open = null; }
    renderAll();
  };
  rd.onerror = () => { S.backupNote = say('הקובץ לא נקרא.', 'The file could not be read.'); renderBackup(); };
  rd.readAsText(file);
}
/* progress: how the best set of each movement moved since the mesocycle began */
function renderGains() {
  const M = S.cfg.meso, R = mesoSummary(M.id), sign = (p) => Ltr((p >= 0 ? '+' : '−') + Math.abs(p).toFixed(1) + '%');
  $('#progCap').textContent = say('סבב ', 'Round ') + M.n + (R.n ? ' · ' + R.n + (R.n === 1 ? say(' אימון', ' workout') : say(' אימונים', ' workouts')) : '');
  $('#gains').innerHTML = '<div class="sec-h"><h2 class="sec">' + say('הכוח שלך', 'Your strength') + '</h2>' + (R.n ? '<button class="go-link" type="button" data-sum="' + M.id + '">' + say('סיכום הסבב', 'Round summary') + ICON.fwd + '</button>' : '') + '</div>' + (R.gains.length ? '<ul class="rows">' + R.gains.slice(0, 5).map((g) => '<li><span class="g-t">' + mvName(g.mv) + '</span><span class="g-s">' + Ltr(fmtRow(g.first)) + arrow() + Ltr(fmtRow(g.best)) + '</span><span class="g-d ' + (g.pct > 0.4 ? 'up' : g.pct < -0.4 ? 'dn' : '') + '">' + sign(g.pct) + '</span></li>').join('') + '</ul>'
    : '<p class="empty-note">' + say('השינוי יופיע אחרי שני אימונים.', 'The change shows after two workouts.') + '</p>');
}
/* in the list of all exercises: mark the one on screen */
function markCur() { const cur = shown(); $$('#allList .ex').forEach((li) => li.classList.toggle('cur', !!cur && cur.id === li.dataset.id)); }
/* draw the exercise on screen. dir: 1 / -1 when it was reached by stepping forward / back, for the slide */
function renderList(dir) {
  stopPlayer();
  const s = live(S.tab), list = exList(S.tab, s), e = shown(), box = $('#exList');
  if (!e) { S.open = null; box.innerHTML = ''; updateProgress(); return; }
  S.open = e.id;
  box.innerHTML = focusHTML(e, list.findIndex((x) => x.id === e.id), list.length);
  if (dir && !reduced) box.firstElementChild.classList.add(dir > 0 ? 'in-next' : 'in-prev');
  startPlayer($('.stage', box), e.a, box);
  renderHero(); markCur();
}
function renderAll() { renderMe(); renderHome(); renderPre(); renderHero(); renderList(); renderHistory(); renderDock(); if (S.sheet === 'list') renderListSheet(); else if (S.sheet === 'set') renderSettings(); freshLogged(); markLive(); }
/* show another exercise of this workout */
function openEx(id, scroll, dir) {
  const e = findEx(id); if (!e || wkOf(id) !== S.tab) return;
  S.open = id; renderList(dir);
  if (scroll) window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}
/* step to the exercise before or after the one on screen */
function stepEx(d) {
  const list = exList(S.tab), i = list.findIndex((x) => x.id === S.open), n = list[i + d];
  if (!n) return;
  S.touched = true; S.draft = null; S.edit = null; S.why = false; openEx(n.id, true, d); renderDock();
}
/* the next exercise that still has a set to do, after the one on screen */
function nextOpen() { const s = live(S.tab), list = exList(S.tab, s), i = list.findIndex((x) => x.id === S.open), left = (x) => firstUndone(s, x) >= 0; return list.slice(i + 1).find(left) || list.find(left) || null; }
/* refresh the exercise on screen after its sets changed, without rebuilding the stage */
function refreshEx(e) {
  e = e && findEx(e.id);
  const li = e && $('#exList .ex[data-id="' + e.id + '"]');
  if (li) {
    const s = live(S.tab), off = e.cut && e.sets === 0;
    li.classList.toggle('done', !off && doneCount(s, e) >= e.sets); li.classList.toggle('off', off);
    $('.sets', li).innerHTML = setsHTML(e); $('.fx-rx', li).innerHTML = rxLine(e, s);
  }
  markCur(); updateProgress();
}
/* ---- every exercise of this workout in one list: jump to one, see the week, finish or clear the workout ---- */
function renderListSheet() {
  const sh = $('#sheet'), old = $('.sheet-in', sh), top = old ? old.scrollTop : 0, s = live(S.tab), list = exList(S.tab, s), t = totals(), P = phase(S.tab, s);
  sh.innerHTML = '<div class="sheet-in ls" role="dialog" aria-modal="true" aria-label="' + say('כל התרגילים', 'All exercises') + '"><div class="ed-h"><div><p class="kicker">' + (P.dl ? say('שבוע קל', 'Easy week') : wkOrd(S.tab)) + ' · ' + t.dn + '/' + t.total + say(' סטים', ' sets') + '</p><h2>' + wkName(S.tab) + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    '<ol class="ex-list" id="allList">' + list.map((e, i) => rowHTML(e, i, s)).join('') + '</ol>' +
    '<div class="ls-links"><button class="link" id="editWk" type="button">' + say('עריכת האימון', 'Edit this workout') + '</button>' + ((!s || !hasDone(s)) && !P.dl && preMuscles(S.tab).length ? '<button class="link" id="preAgain" type="button">' + say('שאלת ההתאוששות', 'Recovery check') + '</button>' : '') + '</div>' +
    (s ? '<div class="ls-act"><button class="btn big" id="finishBtn" type="button"' + (hasDone(s) ? '' : ' disabled') + '>' + say('סיים אימון', 'Finish workout') + '</button>' +
      (S.resetAsk ? '<span class="confirm"><span>' + say('למחוק את הרישום של האימון?', 'Clear what was logged in this workout?') + '</span><button class="btn danger" id="resetYes" type="button">' + say('כן, נקה', 'Yes, clear') + '</button><button class="btn" id="resetNo" type="button">' + say('ביטול', 'Cancel') + '</button></span>' : '<button class="link" id="resetBtn" type="button">' + say('נקה רישום', 'Clear the log') + '</button>') + '</div>' : '') + '</div>';
  $('.sheet-in', sh).scrollTop = top; markCur();
}
function openList() { S.sheet = 'list'; S.resetAsk = false; renderListSheet(); $('#sheet').hidden = false; }
/* clicks inside that list; returns true when the click was handled */
function listSheetClick(ev, id) {
  if (S.sheet !== 'list') return false;
  const li = ev.target.closest('#allList .ex');
  if (li) { const d = li.dataset.id; S.touched = true; S.draft = null; S.edit = null; closeSheet(); openEx(d, true); renderDock(); return true; }
  if (id === 'editWk') { openMeso('ex', S.tab); return true; }
  if (id === 'preAgain') { S.preSkip = null; S.preOpen = true; closeSheet(); afterPre(); return true; }
  if (id === 'finishBtn') { closeSheet(); finishWorkout(); return true; }
  if (id === 'resetBtn' || id === 'resetNo') { S.resetAsk = id === 'resetBtn'; renderListSheet(); return true; }
  if (id === 'resetYes') {
    const s = live(S.tab); if (s) { delete S.sessions[s.id]; S.gone.add(s.id); S.dirty.add(s.id); saveLocal(); schedule(s.id, 100); }
    clearInterval(rest.iv); rest.on = false; rest.last = null; S.resetAsk = false; S.edit = null; S.draft = null; S.fbFor = null; S.open = null; S.banner = ''; S.bannerKind = ''; letSleep();
    closeSheet(); renderAll(); return true;
  }
  return false;
}
function refreshOpenSets() { const e = S.open && findEx(S.open), li = e && $('#exList .ex.open .sets'); if (li) li.innerHTML = setsHTML(e); }

/* ================================================================== dock: log a set with one tap, rest timer */
const rest = { on: false, start: 0, min: 0, max: 0, iv: 0, minHit: false, ended: 0, label: null, last: null };
let actx = null, wake = null, logBusy = false;
function primeAudio() { try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { actx = null; } }
function beep(n) {
  if (!S.sound || !actx) return;
  try {
    for (let i = 0; i < n; i++) {
      const o = actx.createOscillator(), gn = actx.createGain(), t = actx.currentTime + i * 0.3;
      o.type = 'sine'; o.frequency.value = n === 1 ? 587 : 784;
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.11, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(gn); gn.connect(actx.destination); o.start(t); o.stop(t + 0.32);
    }
  } catch (e) { /* no audio here */ }
}
function keepAwake() { if (navigator.wakeLock && !wake && !document.hidden) navigator.wakeLock.request('screen').then((l) => { wake = l; l.addEventListener('release', () => { wake = null; }); }).catch(() => {}); }
function letSleep() { if (wake) { try { wake.release(); } catch (e) { /* already released */ } wake = null; } }
function dockTarget() {
  if (S.edit) { const e = findEx(S.edit.ex); return e ? { e, i: S.edit.i, edit: true } : null; }
  const c = cursor(); return c ? { e: c.e, i: c.i, edit: false } : null;
}
/* the weight shown for the next set: what the lifter dialled in, else the target */
function curKg(e, i, s, T) {
  const d = S.draft; if (d && d.ex === e.id && d.i === i && d.kg !== undefined) return d.kg;
  if (T === undefined) T = targetOf(e, i, s);
  return T ? T.kg : null;
}
/* the reps shown for the next set: what the lifter dialled in, else the target, else the middle of the range */
function curReps(e, i, s, T) {
  const d = S.draft; if (d && d.ex === e.id && d.i === i && d.reps != null) return d.reps;
  if (T === undefined) T = targetOf(e, i, s);
  if (T && T.reps != null) return T.reps;
  const rr = repRange(e); return Math.round((rr[0] + rr[1]) / 2);
}
const draftOf = (t) => (S.draft && S.draft.ex === t.e.id && S.draft.i === t.i ? S.draft : (S.draft = { ex: t.e.id, i: t.i }));
const repsHTML = (r) => '<b>' + (r == null ? '—' : r) + '</b><small>' + say('חזרות', 'reps') + '</small>';
const kgHTML = (kg) => (kg == null ? '<b>—</b><small>' + say('בלי משקל', 'no weight') + '</small>' : '<b>' + fmtKg(kg) + '</b><small>' + say('ק״ג', 'kg') + '</small>');
const xpChip = (n) => '<span class="xp-tag">' + Ltr('+' + n) + '</span>';
/* weight and reps, each with its own stepper. A target is shown a shade lighter until it is confirmed or changed; a tap on a number opens typing */
function numsHTML(kg, reps, ghostKg, ghostReps) {
  return '<div class="dk-nums"><div class="num" role="group" aria-label="' + say('משקל', 'Weight') + '"><button class="step" type="button" data-d="-1" aria-label="' + say('הפחת משקל', 'Less weight') + '">−</button>' +
    '<div class="dk-kg' + (ghostKg ? ' ghost' : '') + '" id="dkKg" role="button" tabindex="0" aria-label="' + say('משקל, לחיצה להקלדה', 'Weight, tap to type') + '">' + kgHTML(kg) + '</div>' +
    '<button class="step" type="button" data-d="1" aria-label="' + say('הוסף משקל', 'More weight') + '">+</button></div>' +
    '<div class="num" role="group" aria-label="' + say('חזרות', 'Reps') + '"><button class="rstep" type="button" data-d="-1" aria-label="' + say('הפחת חזרה', 'One rep less') + '">−</button>' +
    '<div class="dk-reps' + (ghostReps ? ' ghost' : '') + '" id="dkReps" role="button" tabindex="0" aria-label="' + say('חזרות, לחיצה להקלדה', 'Reps, tap to type') + '">' + repsHTML(reps) + '</div>' +
    '<button class="rstep" type="button" data-d="1" aria-label="' + say('הוסף חזרה', 'One rep more') + '">+</button></div></div>';
}
function fbPanel(s) {
  const e = S.fbFor && s ? exList(S.tab, s).find((x) => x.id === S.fbFor) : null;
  if (!e) { S.fbFor = null; return ''; }
  return '<div class="fb-dock"><div class="fb-h"><b>' + say('איך היה: ', 'How was it: ') + e.nm + '</b><button class="link" id="fbSkip" type="button">' + (s.fb && s.fb[e.id] && s.fb[e.id].pain === 2 ? say('סגור', 'Close') : say('דלג', 'Skip')) + '</button></div>' + fbHTML(e, s) + painNote(e, s) + '</div>';
}
function closeFb() { const id = S.fbFor; S.fbFor = null; S.fbPain = null; renderDock(); if (id && S.open === id) refreshEx({ id }); }
/* "swap from the next workout", offered next to a pain report */
function swapNext(exId, mv) { swapTo(exId, mv, true); renderDock(); if (S.open) refreshEx({ id: S.open }); }
function renderDock() {
  const dock = $('#dock'), s = live(S.tab), fbp = fbPanel(s), done = say('כל הסטים בוצעו', 'Every set is done'), fin = '<button class="btn primary" id="dkFinish" type="button">' + say('סיים אימון', 'Finish workout') + xpChip(XP.done) + '</button>';
  let cls = 'dock', h;
  if (rest.on) {
    /* the rest: the time, what comes next, one way on. The set that was just logged can still be taken back */
    const L = rest.last; cls += ' rest';
    h = '<div class="rt"><div class="rt-time" id="rtTime">0:00</div><div class="rt-mid"><div class="rt-state" id="rtState"></div><div class="rt-track"><i id="rtFill"></i></div></div></div>' +
      '<div class="rt-btns"><button type="button" id="rtMinus" aria-label="' + say('הפחת 15 שניות', '15 seconds less') + '">' + Ltr('−15') + '</button><button type="button" id="rtPlus" aria-label="' + say('הוסף 15 שניות', '15 seconds more') + '">' + Ltr('+15') + '</button>' +
      '<button type="button" id="rtSkip" class="go">' + say('המשך', 'Continue') + '</button></div>' +
      (L ? '<div class="rt-log"><span>' + say('נרשם ', 'Logged ') + Ltr(fmtRow(L)) + (L.pr ? say(' · שיא אישי', ' · personal best') : '') + '</span>' + xpChip(XP.set + (L.pr ? XP.pr : 0)) + '<button class="link" id="rtUndo" type="button">' + say('בטל', 'Undo') + '</button></div>' : '') + fbp;
  } else if (fbp) {
    S.edit = null;
    h = fbp + (anyLeft(s) ? '' : '<div class="dk-row"><div class="dk-msg">' + done + '</div>' + fin + '</div>');
  } else if (S.edit && findEx(S.edit.ex) && isDone(rowsOf(s, S.edit.ex)[S.edit.i])) {
    const e = findEx(S.edit.ex), row = rowsOf(s, e.id)[S.edit.i];
    h = '<div class="dk-top"><span class="dk-set">' + say('עריכת סט ', 'Editing set ') + '<b>' + (S.edit.i + 1) + '</b></span>' +
      '<button class="btn danger" id="edDel" type="button">' + say('מחק סט', 'Delete set') + '</button><button class="btn primary" id="edClose" type="button">' + say('סיום', 'Done') + '</button></div>' + numsHTML(row.kg, row.reps, false, false);
  } else {
    S.edit = null;
    const cur = cursor();
    if (cur) {
      /* the numbers of the target are the ones in the two boxes; the line above them only says which set this is */
      const e = cur.e, i = cur.i, T = targetOf(e, i, s), d = S.draft && S.draft.ex === e.id && S.draft.i === i ? S.draft : null, note = S.cfg.notes[e.mv], why = S.why && T ? whyText(T, e) : '';
      h = '<div class="dk-top"><span class="dk-set">' + say('סט ', 'Set ') + '<b>' + (i + 1) + '</b>' + say(' מתוך ', ' of ') + e.sets + '</span>' + (T ? badge(T, e) : '') + '</div>' +
        (why ? '<p class="dk-why">' + why + '</p>' : '') +
        (note ? '<p class="dk-note">' + ICON.pin + '<span>' + esc(note) + '</span></p>' : '') +
        numsHTML(curKg(e, i, s, T), curReps(e, i, s, T), !!T && !(d && d.kg !== undefined), !!T && !(d && d.reps != null)) +
        '<button class="hit" id="dkHit" type="button">' + ICON.check + '<span>' + say('סיימתי סט', 'Set done') + '</span>' + xpChip(XP.set) + '</button>';
    } else if (anyLeft(s)) h = '<div class="dk-row"><div class="dk-msg">' + say('התרגיל הושלם', 'Exercise done') + '</div><button class="btn primary" id="dkNext" type="button">' + say('לתרגיל הבא', 'Next exercise') + ICON.fwd + '</button></div>';
    else h = '<div class="dk-row"><div class="dk-msg">' + done + '</div>' + (s && hasDone(s) ? fin : '') + '</div>';
  }
  dock.className = cls; dock.innerHTML = '<div class="dock-in">' + h + '</div>';
  if (rest.on) tickRest();
}
function setKg(kg) {
  const t = dockTarget(); if (!t) return;
  kg = capKg(kg);
  if (t.edit) { const s = live(S.tab), row = rowsOf(s, t.e.id)[t.i]; if (!row) return; row.kg = kg; row.t = Date.now(); delete row.pr; touch(s); refreshEx(t.e); renderMe(); }
  else draftOf(t).kg = kg;
  const box = $('#dkKg'); if (box) { box.classList.remove('ghost'); if (!$('input:not([switch])', box)) box.innerHTML = kgHTML(kg); }
}
function stepKg(d) {
  const t = dockTarget(); if (!t) return;
  const s = live(S.tab), cur = t.edit ? (rowsOf(s, t.e.id)[t.i] || {}).kg : curKg(t.e, t.i, s);
  setKg((cur == null ? 0 : cur) + d * incOf(t.e.mv));
}
function setReps(r) {
  const t = dockTarget(); if (!t || r == null || !(r >= 1)) return;
  r = capReps(r);
  if (t.edit) { const s = live(S.tab), row = rowsOf(s, t.e.id)[t.i]; if (!row) return; row.reps = r; row.t = Date.now(); delete row.pr; touch(s); refreshEx(t.e); renderMe(); }
  else draftOf(t).reps = r;
  const box = $('#dkReps'); if (box) { box.classList.remove('ghost'); if (!$('input:not([switch])', box)) box.innerHTML = repsHTML(r); }
}
function stepReps(d) {
  const t = dockTarget(); if (!t) return;
  const s = live(S.tab), cur = t.edit ? (rowsOf(s, t.e.id)[t.i] || {}).reps : curReps(t.e, t.i, s);
  setReps(Math.max(1, (cur || 0) + d));
}
/* a tap on a number turns it into a field; leaving the field or Enter keeps the value */
function typeIn(box, id, label, mode, val, done) {
  if (!box || $('input:not([switch])', box)) return;
  box.innerHTML = '<input id="' + id + '" type="text" inputmode="' + mode + '" autocomplete="off" aria-label="' + label + '" value="' + val + '">';
  const inp = $('#' + id); inp.focus(); inp.select();
  inp.addEventListener('blur', () => { const v = inp.value; box.innerHTML = ''; done(v); }, { once: true });
  inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); inp.blur(); } });
}
function typeKg() {
  const t = dockTarget(); if (!t) return;
  const s = live(S.tab), cur = t.edit ? (rowsOf(s, t.e.id)[t.i] || {}).kg : curKg(t.e, t.i, s);
  typeIn($('#dkKg'), 'dkKgIn', say('משקל בק״ג', 'Weight in kg'), 'decimal', cur == null ? '' : fmtKg(cur), (v) => setKg(num(v)));
}
function typeReps() {
  const t = dockTarget(); if (!t) return;
  const s = live(S.tab), cur = t.edit ? (rowsOf(s, t.e.id)[t.i] || {}).reps : curReps(t.e, t.i, s);
  typeIn($('#dkReps'), 'dkRepsIn', say('מספר החזרות', 'Number of reps'), 'numeric', cur == null ? '' : cur, (v) => { const r = num(v, true), box = $('#dkReps'); if (r != null && r >= 1) setReps(r); else if (box) box.innerHTML = repsHTML(cur); });
}
/* the one tap: log the set as it stands in the dock */
function logSet(el) {
  const t = dockTarget(); if (!t || t.edit || logBusy) return;
  const s = ensure(S.tab), kg = curKg(t.e, t.i, s), r = curReps(t.e, t.i, s);
  if (r == null || r < 1 || r > MAX_REPS) return;
  logBusy = true; if (el) el.classList.add('hit-on'); primeAudio(); keepAwake();
  setTimeout(() => { logBusy = false; commitSet(t.e, t.i, kg, r); }, el && !reduced ? 180 : 0);
}
function writeRow(e, i, kg, reps) {
  kg = capKg(kg); reps = capReps(reps) || 1;
  const s = ensure(wkOf(e.id)), L = LIB[e.mv], T = targetOf(e, i, s), before = bestFor(e.mv, { notS: s.id }), today = bestFor(e.mv, { onlyS: s.id, skipEx: e.id, skipI: i }), arr = s.sets[e.id] || (s.sets[e.id] = []);
  const v = kg != null && kg > 0 ? score(L, kg, reps) : 0, pr = !s.dl && !!(before && v > before.v + 0.01 && (!today || v > today.v + 0.01));
  arr[i] = { kg: kg == null ? null : kg, reps, done: true, t: Date.now() }; if (pr) arr[i].pr = true;
  if (T) { arr[i].tk = T.kg == null ? null : T.kg; arr[i].tr = T.reps; }
  touch(s); return pr;
}
/* the exercise is finished: ask how it went, once */
function askFb(e, s) {
  const fb = s.fb || (s.fb = {});
  if (fb[e.id] && fb[e.id].load != null) return;
  if (!fb[e.id]) { fb[e.id] = { pain: 0, pump: null, load: null }; s.ft = Date.now(); touch(s); }
  S.fbFor = e.id; S.fbPain = null;
}
function commitSet(e, i, kg, reps) {
  const lv0 = S.lvl, pr = writeRow(e, i, kg, reps), s = live(S.tab), list = exList(S.tab, s), left = (x) => firstUndone(s, x) >= 0;
  e = list.find((x) => x.id === e.id);
  sfx(pr ? 'pr' : 'set'); if (pr) haptic('pr'); flyPoints($('#dkHit'), XP.set + (pr ? XP.pr : 0));
  S.justDone = { ex: e.id, i, t: Date.now() };
  S.draft = null; refreshEx(e); renderTabs(); renderHistory(); renderPre();
  renderMe(); bump(lv0);
  S.why = false;
  if (!left(e)) askFb(e, s);
  if (!list.some(left)) { stopRest(); return; }
  let nxt = e, label;
  if (left(e)) {
    const ni = firstUndone(s, e), T = targetOf(e, ni, s), inv = LIB[e.mv].inv, n = e.sets;
    label = () => say('סט ', 'Set ') + (ni + 1) + say(' מתוך ', ' of ') + n + (T && T.mode === 'down' ? ' · ' + (inv ? say('מוסיפים סיוע: ', 'More help: ') : say('מורידים ל-', 'Down to ')) + fmtKg(T.kg) + say(' ק״ג', ' kg') : T && T.mode === 'cal' ? ' · ' + (inv ? say('פחות סיוע: ', 'Less help: ') : say('מעלים ל-', 'Up to ')) + fmtKg(T.kg) + say(' ק״ג', ' kg') : '');
  } else { nxt = list.slice(list.indexOf(e) + 1).find(left) || list.find(left); const id = nxt.id; label = () => { const x = findEx(id); return x ? x.nm : ''; }; }
  startRest(e.rest[0], e.rest[1], label, { ex: e.id, i, kg, reps, pr });
  /* the exercise is finished: the next one slides in while the rest runs */
  if (nxt !== e) setTimeout(() => { if (S.tab === wkOf(nxt.id) && S.open === e.id) openEx(nxt.id, true, 1); }, 750);
}
function clearRow(e, i) { const s = live(wkOf(e.id)); if (!s) return; const arr = s.sets[e.id] || (s.sets[e.id] = []); arr[i] = { kg: null, reps: null, done: false, t: Date.now() }; touch(s); }
function afterEdit(e) { refreshEx(e); renderMe(); renderTabs(); renderHistory(); renderDock(); }
/* log every remaining set of an exercise exactly at its target */
function fillTargets(e) {
  const s = ensure(S.tab), lv0 = S.lvl;
  for (let i = firstUndone(s, e), n = 0; i >= 0 && n < MAX_SETS; i = firstUndone(s, e), n++) { const T = targetOf(e, i, s); if (!T) break; writeRow(e, i, T.kg, T.reps); }
  S.draft = null; keepAwake(); e = findEx(e.id);
  if (firstUndone(s, e) < 0) askFb(e, s);
  afterEdit(e); renderPre(); bump(lv0);
  const list = exList(S.tab, s), nxt = list.slice(list.findIndex((x) => x.id === e.id) + 1).find((x) => firstUndone(s, x) >= 0);
  if (firstUndone(s, e) < 0 && nxt) setTimeout(() => { if (S.open === e.id) openEx(nxt.id, true, 1), renderDock(); }, 500);
}
function startRest(min, max, label, last) {
  clearInterval(rest.iv);
  Object.assign(rest, { on: true, start: Date.now(), min, max, minHit: false, ended: 0, label, last });
  S.edit = null; renderDock(); rest.iv = setInterval(tickRest, 200);
}
function tickRest() {
  if (!rest.on) return;
  const el = (Date.now() - rest.start) / 1000, left = Math.max(0, rest.max - el), d = $('#dock'), tm = $('#rtTime');
  if (!tm) return;
  tm.textContent = mmss(Math.ceil(left)); $('#rtFill').style.width = Math.min(100, (el / rest.max) * 100) + '%';
  if (rest.min < rest.max && !rest.minHit && el >= rest.min && left > 0) { rest.minHit = true; beep(1); }
  if (left <= 0 && !rest.ended) { rest.ended = Date.now(); beep(2); haptic('heavy'); }
  d.classList.toggle('ready', rest.minHit && !rest.ended); d.classList.toggle('go', !!rest.ended);
  $('#rtState').innerHTML = '<b>' + (rest.ended ? say('קדימה', 'Go') : rest.minHit ? say('אפשר להתחיל', 'Ready when you are') : say('מנוחה', 'Rest')) + '</b><span>' + say('הבא: ', 'Next: ') + esc(rest.label ? rest.label() : '') + '</span>';
  if (rest.ended && Date.now() - rest.ended > 4000) stopRest();
}
function stopRest() { clearInterval(rest.iv); rest.on = false; rest.last = null; renderDock(); refreshOpenSets(); }
function nudgeRest(d) {
  if (!rest.on) return;
  rest.max = Math.max(5, rest.max + d); rest.min = Math.min(rest.min, rest.max);
  if (rest.ended && (Date.now() - rest.start) / 1000 < rest.max) rest.ended = 0;
  tickRest();
}
function undoLast() {
  const L = rest.last, e = L && findEx(L.ex); if (!e) return;
  clearRow(e, L.i); clearInterval(rest.iv); rest.on = false; rest.last = null;
  if (S.fbFor === e.id) S.fbFor = null;
  if (S.tab === wkOf(e.id) && S.open !== e.id) openEx(e.id, false);
  afterEdit(e);
}
/* one answer about a finished exercise. Strong pain stops what is left for that muscle today and points to a gentler movement.
   A pain answer that is tapped again is taken back */
function onFb(exId, key, v) {
  const was = live(wkOf(exId)); if (!was) return;
  if (key === 'pain' && was.fb && was.fb[exId] && was.fb[exId].pain === v) v = 0;
  const f = setFb(exId, key, v), s = live(wkOf(exId)); if (!f || !s) return;
  if (key === 'pain') {
    /* set counts may have changed: redraw, and stop a rest that no longer leads anywhere */
    if (rest.on && !cursor()) { clearInterval(rest.iv); rest.on = false; rest.last = null; }
    renderList(); renderHistory(); renderTabs(); renderDock();
  } else renderDock();
  if (S.fbFor === exId && f.load != null && f.pain !== 2) setTimeout(() => { if (S.fbFor === exId) closeFb(); }, 320);
}
function skipFb() {
  const s = live(S.tab), f = s && s.fb && s.fb[S.fbFor];
  if (f && f.pump == null && f.load == null && f.pain !== 2 && !f.pain) { delete s.fb[S.fbFor]; s.ft = Date.now(); touch(s); }
  closeFb();
}
/* the end of a workout: the points it brought, the level bar moving, and anything that opened on the way.
   R: { y: the workout's tally, from / to: the level before and after it, got: achievements earned now } */
function showSummary(s, R) {
  const total = exList(s.w, s).reduce((n, e) => n + e.sets, 0), mn = Math.max(1, Math.round((s.end - s.ts) / 60000)), y = R.y, up = R.to.lvl > R.from.lvl, nu = nextUp();
  const prev = sorted().find((x) => x.w === s.w && x.id !== s.id && x.end && hasDone(x)), pv = prev ? volume(prev) : 0;
  let cmp = '';
  if (pv && y.kg && !s.dl) { const d = ((y.kg - pv) / pv) * 100; if (Math.abs(d) >= 0.5) cmp = Ltr(Math.abs(d).toFixed(0) + '%') + (d > 0 ? say(' יותר', ' more') : say(' פחות', ' less')) + say(' מהפעם הקודמת · ', ' than last time · '); }
  const opened = up ? rewardsBetween(R.from.lvl, R.to.lvl) : [];
  const sh = $('#sheet'); S.sheet = 'sum';
  sh.innerHTML = '<div class="sheet-in sum w' + s.w + '" role="dialog" aria-modal="true" aria-label="' + say('סיכום אימון', 'Workout summary') + '"><canvas class="confetti" id="confetti" aria-hidden="true"></canvas>' +
    '<p class="kicker">' + wkOrd(s.w) + say(' הושלם', ' complete') + (s.dl ? say(' · שבוע קל', ' · easy week') : '') + '</p><div class="sum-av">' + avatar(R.to.lvl, { flex: true }) + '</div>' +
    '<h2 class="sum-xp"><bdi dir="ltr" id="sumXp">+' + nf(y.xp) + '</bdi><small>' + say('נקודות', 'points') + '</small></h2>' +
    (up ? '<p class="sum-up">' + glyph('star') + say('עלית לרמה ', 'You reached level ') + R.to.lvl + '</p>' : '') +
    '<div class="xp"><span class="xpbar"><i id="sumBar" style="width:' + (up ? 0 : pctOf(R.from)) + '%"></i></span><div class="xp-l"><span>' + say('רמה ', 'Level ') + R.to.lvl + ' · ' + nm(rankOf(R.to.lvl)) + '</span><span>' + Ltr(nf(R.to.into) + ' / ' + nf(R.to.need)) + '</span></div></div>' +
    (opened.length || R.got.length ? '<ul class="sum-new">' + opened.map((r) => '<li>' + glyph('gift') + '<span>' + say('נפתח: ', 'Unlocked: ') + nm(r) + '</span></li>').join('') + R.got.map((id) => { const b = BADGES.find((x) => x.id === id); return '<li>' + glyph(b.ic) + '<span>' + say('הישג: ', 'Achievement: ') + nm(b) + '</span></li>'; }).join('') + '</ul>' : '') +
    '<p class="sum-line">' + [y.sets + '/' + total + say(' סטים', ' sets'), y.kg ? Ltr(nf(y.kg)) + say(' ק״ג', ' kg') : '', mn + say(' דק׳', ' min'), y.prs ? (y.prs === 1 ? say('שיא אחד', '1 PR') : y.prs + say(' שיאים', ' PRs')) : ''].filter(Boolean).join(' · ') + '</p>' +
    '<p class="sum-next">' + cmp + say('הבא: ', 'Next: ') + wkFull(nu.next) + '</p>' +
    '<button class="btn primary big" id="sheetClose" type="button">' + say('המשך', 'Continue') + '</button></div>';
  sh.hidden = false; $('#sheetClose').focus();
  countUp($('#sumXp'), y.xp); confetti($('#confetti'), up ? 110 : 50);
  requestAnimationFrame(() => requestAnimationFrame(() => { const b = $('#sumBar'); if (b) b.style.width = pctOf(R.to) + '%'; }));
  if (up) { chime(); haptic('heavy'); } else feel('done');
}
function finishWorkout() {
  const s = live(S.tab); if (!s || !hasDone(s)) return;
  clearInterval(rest.iv); rest.on = false; rest.last = null;
  s.end = Date.now(); s.mt = s.end; touch(s); letSleep();
  S.edit = null; S.draft = null; S.resetAsk = false; S.open = null; S.fbFor = null; S.preSkip = null; S.preOpen = false; S.banner = ''; S.bannerKind = ''; S.tab = nextUp().next;
  /* the level this workout started from: everything counted so far, without its own points */
  const y = tally(s), got = meSync(), P = meNow(), R = { y, from: levelOf(P.T.xp - y.xp), to: P.L, got };
  setView('home', true); renderAll();
  const M = S.cfg.meso;
  if (s.m === M.id && mesoDone(M)) showMesoSummary(M.id, s, R);
  else if (s.m === M.id && !s.dl && !M.early && M.asked !== s.id && fatigued()) { M.asked = s.id; saveCfg(); showDeloadOffer(s, R); }
  else showSummary(s, R);
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}
/* ---- fix the record afterwards: edit any set of a finished workout, move it to another day, reopen or delete it ---- */
function deleteSession(id) {
  if (!S.sessions[id]) return;
  delete S.sessions[id]; S.gone.add(id); S.dirty.add(id); saveLocal(); schedule(id, 100);
}
const isoDay = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function editorActions(s) {
  if (S.edDel) return '<span class="confirm"><span>' + say('למחוק את האימון?', 'Delete this workout?') + '</span><button class="btn danger" id="edDelYes" type="button">' + say('כן, מחק', 'Yes, delete') + '</button><button class="btn" id="edDelNo" type="button">' + say('ביטול', 'Cancel') + '</button></span>';
  return '<button class="btn danger" id="edDelAsk" type="button">' + say('מחק אימון', 'Delete workout') + '</button>' + (!live(s.w) && Date.now() - s.end < 12 * HOUR ? '<button class="btn" id="edReopen" type="button">' + say('המשך את האימון', 'Continue this workout') + '</button>' : '') + '<button class="btn primary" id="edDone" type="button">' + say('סיום', 'Done') + '</button>';
}
function openEditor(id, all) {
  const s = S.sessions[id]; if (!s) return;
  let list = '', skipped = 0;
  for (const e of exList(s.w, s)) {
    const r = rowsOf(s, e.id), n = Math.max(e.n0, r.length);
    if (!all && !r.some(isDone)) { skipped++; continue; }
    list += '<section class="ed-ex"><h3>' + e.nm + '</h3>';
    for (let i = 0; i < n; i++) {
      const row = r[i] || {}, on = isDone(row);
      list += '<div class="ed-row' + (on ? ' on' : '') + '" data-ex="' + e.id + '" data-i="' + i + '"><span>' + say('סט ', 'Set ') + (i + 1) + '</span>' +
        '<label class="ed-f"><input type="text" inputmode="decimal" autocomplete="off" data-k="kg" aria-label="' + say('משקל בסט ', 'Weight in set ') + (i + 1) + '" value="' + (on && row.kg != null ? fmtKg(row.kg) : '') + '"><span>' + say('ק״ג', 'kg') + '</span></label><span aria-hidden="true">×</span>' +
        '<label class="ed-f"><input type="text" inputmode="numeric" autocomplete="off" data-k="reps" aria-label="' + say('חזרות בסט ', 'Reps in set ') + (i + 1) + '" value="' + (on && row.reps != null ? row.reps : '') + '"><span>' + say('חז׳', 'reps') + '</span></label>' +
        '<button class="ed-clr" type="button" aria-label="' + say('נקה את סט ', 'Clear set ') + (i + 1) + '">' + ICON.x + '</button></div>';
    }
    list += '</section>';
  }
  S.edSid = id; S.edDel = false; S.sheet = 'ed';
  const sh = $('#sheet'), old = all ? $('.sheet-in', sh) : null, top = old ? old.scrollTop : 0;
  sh.innerHTML = '<div class="sheet-in ed" role="dialog" aria-modal="true" aria-label="' + say('עריכת אימון', 'Edit workout') + '"><div class="ed-h"><div><p class="kicker">' + wkOrd(s.w) + (s.dl ? say(' · שבוע קל', ' · easy week') : s.wk ? say(' · שבוע ', ' · week ') + s.wk : '') + '</p><h2>' + wkName(s.w) + '</h2></div><button class="icon-btn" id="sheetClose" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    '<label class="ed-date" for="edDate"><span>' + say('תאריך', 'Date') + '</span><input type="date" id="edDate" value="' + isoDay(new Date(s.ts)) + '" max="' + isoDay(new Date()) + '"></label>' +
    '<div class="ed-list">' + list + '</div>' + (skipped ? '<button class="link" id="edAll" type="button">' + say('עוד ', 'Also ') + cnt(skipped, 'תרגילים שלא נרשמו', 'תרגיל אחד שלא נרשם', 'exercises that were not logged', 'exercise that was not logged') + '</button>' : '') +
    '<div class="ed-act" id="edAct">' + editorActions(s) + '</div></div>';
  $('.sheet-in', sh).scrollTop = top; sh.hidden = false;
}
function closeSheet() {
  const sh = $('#sheet'); if (sh.hidden) return;
  const kind = S.sheet;
  /* the picker for adding an exercise was opened from the plan: closing it goes back there */
  if (kind === 'swap' && S.pick && S.pick.mode === 'add') { S.pick = null; S.sheet = 'meso'; renderMeso(); return; }
  sh.hidden = true; sh.innerHTML = ''; S.sheet = null; S.edSid = null; S.edDel = false; S.msAsk = null; S.pick = null; S.blEdit = null; S.msPage = null;
  if (kind && kind !== 'sum' && kind !== 'list') renderAll();
}
function editorInput(rowEl) {
  const s = S.sessions[S.edSid]; if (!s || !rowEl) return;
  const exId = rowEl.dataset.ex, i = +rowEl.dataset.i, arr = s.sets[exId] || (s.sets[exId] = []), row = arr[i] || (arr[i] = { kg: null, reps: null, done: false });
  const kg = num($('[data-k="kg"]', rowEl).value), reps = num($('[data-k="reps"]', rowEl).value, true);
  row.kg = capKg(kg); row.reps = capReps(reps); row.done = row.reps != null; row.t = Date.now(); delete row.pr;
  rowEl.classList.toggle('on', row.done); touch(s);
}
function editorDate(val) {
  const s = S.sessions[S.edSid]; if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(val)) return;
  const old = new Date(s.ts), p = val.split('-').map(Number), len = s.end ? s.end - s.ts : 0;
  let nt = new Date(p[0], p[1] - 1, p[2], old.getHours(), old.getMinutes(), old.getSeconds()).getTime();
  if (nt + len > Date.now()) nt = Date.now() - len - 60000;
  const cut = S.cfg.me.arch.until; if (cut) nt = s.ts <= cut ? Math.min(nt, cut) : Math.max(nt, cut + 1);
  if (nt === s.ts) return;
  s.ts = nt; if (s.end) s.end = nt + len; s.mt = Date.now(); touch(s);
}
function editorReopen() {
  const s = S.sessions[S.edSid]; if (!s || live(s.w)) return;
  s.end = 0; s.mt = Date.now(); touch(s);
  S.tab = s.w; S.touched = true; S.open = null; S.edSid = null; S.edDel = false; S.sheet = null; setView('workout', true);
  const sh = $('#sheet'); sh.hidden = true; sh.innerHTML = '';
  renderAll();
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}
async function exportCsv() {
  if (!S.dl) return;
  const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"', lines = ['date,workout,exercise,set,kg,reps,week,deload,rir,target_kg,target_reps'];
  for (const s of sorted().reverse()) for (const e of exList(s.w, s)) rowsOf(s, e.id).forEach((r, i) => { if (isDone(r)) lines.push([new Date(s.ts).toISOString().slice(0, 10), q(PLAN[s.w].name), q(e.name), i + 1, r.kg == null ? '' : r.kg, r.reps == null ? '' : r.reps, s.wk || '', s.dl ? 1 : '', s.rir == null ? '' : s.rir, r.tk == null ? '' : r.tk, r.tr == null ? '' : r.tr].join(',')); });
  try { await S.dl.save({ filename: 'gymi-log.csv', data: '﻿' + lines.join('\r\n') }); } catch (e) { if (e && e.code !== 'declined' && e.code !== 'rate_limited') { S.dl = null; renderBackup(); } }
}
function onRemoteChange() {
  const a = document.activeElement;
  if (a && a.closest && (a.closest('#dock') || a.closest('#sheet') || a.closest('.note')) && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT')) return;
  sweep(); meSync(); if (!S.touched) S.tab = nextUp().next;
  if ((S.cfg.lang || autoLang()) !== LANG) applyLang();
  maybeOb();
  if (S.sheet === 'meso') renderMeso(); else if (S.sheet !== 'ed' && S.sheet !== 'swap' && S.sheet !== 'look' && S.sheet !== 'sum') renderAll();
}
function startTab() { S.open = null; renderList(); renderDock(); }

/* ================================================================== wiring */
function wireApp() {
  $('#tabbar').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-view]'); if (!b) return;
    closeChat(); setView(b.dataset.view);
  });
  $('#backBtn').addEventListener('click', () => { renderHome(); setView('home'); });
  $('#listBtn').addEventListener('click', openList);
  $('#home').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.classList.contains('banner-x')) { S.banner = ''; S.bannerKind = ''; renderHome(); renderHero(); }
    else if (b.id === 'homeGo') openWorkout(+b.dataset.w, false);
    else if (b.id === 'playerBtn') setView('profile');
    else if (b.id === 'planBtn') openMeso();
    else if (b.classList.contains('tab')) openWorkout(+b.dataset.tab, true);
  });
  const list = $('#exList');
  list.addEventListener('click', (ev) => {
    const li = ev.target.closest('.ex'); if (!li) return;
    const e = findEx(li.dataset.id), nav = ev.target.closest('.fx-nav');
    if (nav) { stepEx(nav.id === 'exNext' ? 1 : -1); return; }
    /* a tap on the demo stops it and starts it again */
    if (ev.target.closest('.stage-wrap')) { setPlaying(!player.playing); return; }
    if (ev.target.closest('.swap')) { openSwap(e.id); return; }
    if (ev.target.closest('.how')) { openHow(e.id); return; }
    if (ev.target.closest('.more')) { openMore(e.id); return; }
    const p = ev.target.closest('.setp');
    if (p) {
      /* a done set opens for editing; the others only bring the bar back to the next set */
      S.touched = true; const i = +p.dataset.i, s = live(S.tab), on = isDone(rowsOf(s, e.id)[i]);
      if (rest.on) { clearInterval(rest.iv); rest.on = false; rest.last = null; }
      S.edit = on ? { ex: e.id, i } : null; S.draft = null; S.fbFor = null;
      refreshEx(e); renderDock(); if (on) keepAwake();
    }
  });
  /* a sideways swipe on the exercise steps to the one before or after it */
  let sw = null;
  list.addEventListener('touchstart', (ev) => { const t = ev.touches[0]; sw = ev.touches.length === 1 && !ev.target.closest('textarea,input,.seg') ? { x: t.clientX, y: t.clientY } : null; }, { passive: true });
  list.addEventListener('touchend', (ev) => {
    if (!sw) return; const t = ev.changedTouches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y; sw = null;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 45) stepEx((dx > 0) === (document.documentElement.dir !== 'ltr') ? 1 : -1);
  }, { passive: true });
  const dock = $('#dock');
  /* the page keeps clear of the dock, however tall it gets */
  if (window.ResizeObserver) new ResizeObserver(() => { const h = dock.offsetHeight; if (h) $('#app').style.setProperty('--dock-h', h + 'px'); }).observe(dock);
  let hold = 0, rep = 0;
  const endHold = () => { clearTimeout(hold); clearInterval(rep); };
  dock.addEventListener('pointerdown', (ev) => {
    const st = ev.target.closest('.step,.rstep'); if (!st) return;
    ev.preventDefault(); const d = +st.dataset.d, go = st.classList.contains('rstep') ? stepReps : stepKg; go(d); endHold();
    hold = setTimeout(() => { rep = setInterval(() => { go(d); haptic('step'); }, st.classList.contains('rstep') ? 140 : 90); }, 380);
  });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) dock.addEventListener(t, endHold);
  dock.addEventListener('click', (ev) => {
    const t = ev.target, id = (t.closest('button,[role="button"]') || {}).id;
    /* the second tap of a double tap on "set done" lands on the timer's buttons, which have just appeared in its place: it is not a wish to skip the rest */
    if (rest.on && id && /^rt/.test(id) && Date.now() - rest.start < 250) return;
    const st = t.closest('.step,.rstep'); if (st) { if (ev.detail === 0) (st.classList.contains('rstep') ? stepReps : stepKg)(+st.dataset.d); return; }
    const fbBtn = t.closest('[data-fb]'); if (fbBtn) { onFb(fbBtn.closest('.fbk').dataset.ex, fbBtn.dataset.fb, +fbBtn.dataset.v); return; }
    const pa = t.closest('[data-painask]'); if (pa) { S.fbPain = pa.dataset.painask; renderDock(); return; }
    const sn = t.closest('[data-swapto]'); if (sn) { const q = sn.dataset.swapto.split(':'); swapNext(q[0], q[1]); return; }
    if (id === 'dkHit') { S.touched = true; logSet(t.closest('#dkHit')); }
    else if (id === 'dkNext') { const n = nextOpen(); if (n) { S.touched = true; S.draft = null; openEx(n.id, true, 1); renderDock(); } }
    else if (id === 'dkReps') typeReps();
    else if (id === 'fbSkip') skipFb();
    else if (id === 'dkKg') typeKg();
    else if (id === 'dkFinish') finishWorkout();
    else if (id === 'dkWhy') { S.why = !S.why; renderDock(); }
    else if (id === 'rtSkip') stopRest();
    else if (id === 'rtPlus') nudgeRest(15);
    else if (id === 'rtMinus') nudgeRest(-15);
    else if (id === 'rtUndo') undoLast();
    else if (id === 'edClose') { S.edit = null; renderDock(); refreshOpenSets(); }
    else if (id === 'edDel') { const e = findEx(S.edit.ex); clearRow(e, S.edit.i); S.edit = null; afterEdit(e); }
  });
  dock.addEventListener('keydown', (ev) => {
    if (ev.target.id === 'dkKg' && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); typeKg(); }
    if (ev.target.id === 'dkReps' && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); typeReps(); }
  });
  const logClick = (ev) => {
    const b = ev.target.closest('button'), id = b ? b.id : '', ds = b ? b.dataset : {};
    if (ds.edit) openEditor(ds.edit);
    else if (id === 'histMore') { S.histN = (S.histN || 6) + 10; renderHistory(); }
    else if (ds.sum) showMesoSummary(ds.sum, false);
  };
  $('#restoreFile').addEventListener('change', (ev) => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; importBackup(f); });
  for (const box of ['#history', '#gains']) $(box).addEventListener('click', logClick);
  $('#hero').addEventListener('click', (ev) => { if (ev.target.closest('.banner-x')) { S.banner = ''; S.bannerKind = ''; renderHome(); renderHero(); } });
  const sheet = $('#sheet');
  sheet.addEventListener('click', (ev) => {
    const id = (ev.target.closest('button') || {}).id;
    if (ev.target === sheet || id === 'sheetClose' || id === 'edDone' || ev.target.closest('[data-close]')) { closeSheet(); return; }
    if (listSheetClick(ev, id) || exSheetClick(ev, id) || coachSheetClick(ev, id) || meSheetClick(ev)) return;
    if (id === 'edDelAsk' || id === 'edDelNo') { S.edDel = id === 'edDelAsk'; $('#edAct').innerHTML = editorActions(S.sessions[S.edSid]); }
    else if (id === 'edDelYes') { deleteSession(S.edSid); if (!S.touched) S.tab = nextUp().next; closeSheet(); }
    else if (id === 'edReopen') editorReopen();
    else if (id === 'edAll') openEditor(S.edSid, true);
    const clr = ev.target.closest('.ed-clr');
    if (clr) { const rowEl = clr.closest('.ed-row'); $$('input:not([switch])', rowEl).forEach((x) => { x.value = ''; }); editorInput(rowEl); }
  });
  /* a sheet or the opening screens, while open, are the only thing in reach: the focus moves in, the page behind is out of reach
     (for the keyboard and for a screen reader), and on closing the focus goes back to what opened it */
  const behind = [$('.brand'), $('.cols'), dock], ob = $('#ob'); let opener = null;
  const modal = () => {
    const box = !ob.hidden ? ob : !sheet.hidden ? $('.sheet-in', sheet) : null;
    for (const el of behind) el.inert = !!box;
    if (box) {
      if (!opener) { const a = document.activeElement; opener = a && a !== document.body ? { el: a, id: a.id } : {}; }
      if (!box.contains(document.activeElement)) { box.tabIndex = -1; box.focus({ preventScroll: true }); }
    } else if (opener) {
      const o = opener, el = o.el && o.el.isConnected ? o.el : o.id ? document.getElementById(o.id) : null; opener = null;
      if (el && el.focus) el.focus({ preventScroll: true });
    }
  };
  const watch = new MutationObserver(modal);
  watch.observe(sheet, { attributes: true, attributeFilter: ['hidden'] }); watch.observe(ob, { attributes: true, attributeFilter: ['hidden'] });
  sheet.addEventListener('input', (ev) => { const inp = ev.target.closest('.ed-row input'); if (inp) editorInput(inp.closest('.ed-row')); else if (ev.target.id === 'lkName') setName(ev.target.value); });
  sheet.addEventListener('change', (ev) => {
    if (ev.target.id === 'edDate') { editorDate(ev.target.value); return; }
    const inp = ev.target.closest('.ed-row input');
    if (inp) { const rowEl = inp.closest('.ed-row'), s = S.sessions[S.edSid], r = s && rowsOf(s, rowEl.dataset.ex)[+rowEl.dataset.i]; if (r) { $('[data-k="kg"]', rowEl).value = r.kg != null ? fmtKg(r.kg) : ''; $('[data-k="reps"]', rowEl).value = r.reps != null ? r.reps : ''; } return; }
    if (ev.target.classList.contains('note-in')) { const e = S.open && findEx(S.open); if (e) saveNote(e.mv, ev.target.value); return; }
    coachSheetChange(ev); meSheetChange(ev);
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !OB.on) { if (!sheet.hidden) closeSheet(); else closeChat(); } });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onTheme);
  new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) return; if (rest.on) tickRest(); if (live(S.tab)) keepAwake(); });
  /* the phone's back button, when gymi runs inside its native shell: close what is open, else go back to today */
  window.gymiBack = () => {
    if (!sheet.hidden) { if (S.sheet === 'meso' && S.msPage) { S.msPage = null; S.blEdit = null; renderMeso(); } else closeSheet(); return true; }
    if ($('#chat').classList.contains('open') && !matchMedia('(min-width:1000px)').matches) { closeChat(); return true; }
    if (OB.on) { if (OB.step > 0) { obStep(-1); return true; } return false; }
    if (S.view !== 'home') { renderHome(); setView('home'); return true; }
    return false;
  };
  setInterval(() => { if (sweep()) renderAll(); }, 60000);
}
