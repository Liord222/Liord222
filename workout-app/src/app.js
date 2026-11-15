/* ================================================================== workout UI */
const repWord = (mv) => (LIB[mv] && LIB[mv].hold ? say('שניות', 'seconds') : say('חזרות', 'reps'));
/* what today's set is trying to beat */
const MODE = () => ({ reps: [say('יותר חזרות', 'More reps'), 'g-reps'], weight: [say('יותר משקל', 'More weight'), 'g-wt'], hold: [say('כמו בפעם הקודמת', 'Same as last time'), ''], base: [say('התחלה חדשה', 'Fresh start'), ''], deload: [say('שבוע קל', 'Easy week'), ''], down: [say('פחות משקל', 'Less weight'), 'g-down'], cal: [say('משקל מעודכן', 'New weight'), 'g-cal'], start: [say('משקל התחלתי', 'Starting weight'), 'g-start'] });
function badge(T, e) {
  const M = T && MODE()[T.mode];
  if (!M) return '';
  const inv = LIB[e.mv].inv, t = inv && T.mode === 'weight' ? say('פחות סיוע', 'Less help') : inv && T.mode === 'down' ? say('יותר סיוע', 'More help') : T.mode === 'hold' && !T.ref ? say('כמו הסט הקודם', 'Same as the last set') : T.mode === 'start' && T.kg == null ? say('התחלה', 'First time') : M[0];
  return '<button class="goal ' + M[1] + '" id="dkWhy" type="button" aria-expanded="' + !!S.why + '">' + t + '</button>';
}
/* why the target is what it is, in one sentence */
function whyText(T, e) {
  const last = T.ref ? '<bdi>' + rowWords(T.ref) + '</bdi>' : '', inv = LIB[e.mv].inv;
  if (T.mode === 'reps') return last ? say('בפעם הקודמת עשית ' + last + '<br>היום מנסים יותר חזרות', 'Last time you did ' + last + '. Today, more reps.') : say('היום מנסים יותר חזרות', 'Today, more reps.');
  if (T.mode === 'weight') return inv ? say('הגעת לראש הטווח אז הסיוע יורד', 'You reached the top of the rep range, so the help comes down.') : say('הגעת לראש הטווח אז המשקל עולה', 'You reached the top of the rep range, so the weight goes up.');
  if (T.mode === 'hold') return last ? say('חוזרים על הפעם הקודמת<br>' + last, 'Repeat what you did last time: ' + last + '.') : say('ממשיכים כמו בסט הקודם', 'Carry on with what you did in the last set.');
  if (T.mode === 'start') return T.kg == null ? say('פעם ראשונה בתרגיל הזה<br>מתחילים באמצע הטווח', 'First time on this exercise: start in the middle of the rep range.') : say('זו הערכה ראשונה לפי הניסיון שלך<br>אפשר לשנות למשקל שמתאים לך', 'There is no history for this exercise yet, so this is a first guess from your experience. Move it to the weight that fits you.');
  if (T.mode === 'base') return say('סבב חדש מתחיל קל יותר', 'A new round starts easier, so the target is lower.');
  if (T.mode === 'deload') return say('שבוע קל עם פחות עומס כדי להתאושש', 'Easy week: less load, to recover.');
  if (T.mode === 'down') return inv ? say('הסט הקודם היה מתחת לטווח אז מוסיפים סיוע', 'The last set fell under the range, so the help goes up.') : say('הסט הקודם היה מתחת לטווח אז מורידים משקל', 'The last set fell under the range, so the weight comes down.');
  if (T.mode === 'cal') return say('עשית הרבה יותר מהיעד אז המשקל מתעדכן', 'You did far more than the target, so the weight is updated.');
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
  if (v !== 'workout') exIntroOff();
  S.view = v; $('#app').dataset.view = v; $('#app').dataset.w = posOf(S.tab) % 5;
  for (const b of $$('#tabbar [data-view]')) { if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
  if (v === 'profile') renderProfile(); else if (v === 'journey') renderJourney();
  if (!keep) window.scrollTo(0, 0);
  arrive(v);
}
/* a screen that is come to plays its entrance once: the class is taken off again, so that a redraw in place stays still */
function arrive(v) {
  const el = $('.v-' + v); if (!el || reduced) return;
  el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter');
  clearTimeout(S.enterT); S.enterT = setTimeout(() => el.classList.remove('enter'), 1500);
}
/* what belongs to the workout on screen (the open exercise, a set being edited, the rest and its Undo) is let go when another workout opens */
function leaveWorkout() { S.open = null; S.edit = null; S.drafts = {}; S.resetAsk = false; S.fbFor = null; S.preOpen = false; S.banner = ''; S.bannerKind = ''; clearTimeout(S.slideT); if (rest.on) { clearInterval(rest.iv); rest.on = false; rest.last = null; } }
/* open a workout: the one that is next (from the big button) or one picked from the week */
function openWorkout(w, picked) {
  if (picked) S.touched = true;
  if (w !== S.tab) leaveWorkout();
  /* the sample workout of the tour goes straight to its first exercise: the questions before a workout and the screen that
     opens an exercise are kept for the real one */
  const demo = typeof TR !== 'undefined' && TR.on && TR.steps.some((x) => x.leave);
  S.tab = w; if (demo) { setDay(w, 0); S.timeAsk = null; S.eqAsk = null; } setView('workout'); renderAll();
  /* a workout that has not begun opens on its first exercise, under the purple screen (after the questions before it, when there are any) */
  const s = live(w); if (!demo && !(s && hasDone(s)) && !$('#app').classList.contains('pre-on')) exIntro(shown(), true);
}
/* how long a workout really takes (see workMins) */
/* w: the workout the list belongs to, when today it may have been cut to a time the lifter chose */
const minsOf = (list, w) => (w != null && dayOf(w) ? workMins(list) : fullMins(list));
const bannerHTML = () => (S.banner ? '<div class="banner ' + (S.bannerKind || '') + '"><p>' + S.banner + '</p><button type="button" class="banner-x" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' : '');
/* the line of the road between two stops: (x in hundredths of the width, y in pixels), a curve that leaves and arrives straight down */
/* when a workout of this week was finished, in a word: today, yesterday, the day of the week, a date once a week has passed */
function dayWord(ts) {
  const d0 = new Date().setHours(0, 0, 0, 0), days = Math.round((d0 - new Date(ts).setHours(0, 0, 0, 0)) / 864e5);
  if (days <= 0) return say('היום', 'today');
  if (days === 1) return say('אתמול', 'yesterday');
  return new Intl.DateTimeFormat(LANG === 'en' ? 'en-GB' : 'he-IL', days < 7 ? { weekday: 'long' } : { day: 'numeric', month: 'numeric' }).format(ts);
}
/* ---- the week on the Workouts screen: the workouts of this pass through the plan, each with where it stands (done, under way, next,
   still to do). Nothing about the stages of the round stands here: the climb lives in the Journey ---- */
function weekModel(nu) {
  const M = S.cfg.meso, mine = mesoDone(M) ? [] : mesoSessions(M.id), W = week();
  const fin = {}; for (const i of W) fin[i] = mine.filter((x) => x.w === i && x.end).sort((a, b) => a.ts - b.ts);
  const r0 = ((fin[nu.next] || []).length) + 1;
  const SAY = { live: say('באמצע', 'in progress'), next: say('הבא', 'next'), done: say('הושלם', 'done'), todo: say('עוד לא', 'not yet') };
  const items = W.map((i, k) => {
    const L = live(i), on = !!(L && hasDone(L)), st = on ? 'live' : i === nu.next ? 'next' : fin[i].length >= r0 ? 'done' : 'todo';
    const o = { i, k, st, label: wkFull(i) + ', ' + SAY[st] };
    if (st === 'done') { const x = fin[i][r0 - 1]; o.when = x.end || x.ts; }
    else {
      const list = exList(i, on ? L : undefined); o.n = list.length; o.mins = minsOf(list, i);
      if (on) { o.total = list.reduce((n, e) => n + e.sets, 0); o.dn = list.reduce((n, e) => n + doneCount(L, e), 0); }
    }
    return o;
  });
  return { items, dn: items.filter((x) => x.st === 'done').length, on: items.some((x) => x.st === 'live'), first: !sorted().some(hasDone) };
}
/* the coach, under the week: where it stands, in a few words */
function coachSays(Wm, easy) {
  const left = Wm.items.length - Wm.dn;
  if (Wm.on) return say('ממשיכים את האימון מאיפה שעצרת', 'A workout is under way. Pick up where you stopped?');
  if (S.shieldAt && Date.now() - S.shieldAt < 2592e5) return say('המגן שמר על הרצף שלך', 'Your shield kept your streak');
  if (Wm.first) return say('האימון הראשון שלך מחכה', 'Your first workout is waiting. I\'m with you every set.');
  if (easy) return say('שבוע קל כדי שהגוף יתאושש', 'Easy week: fewer sets, far from failure. This is when the body builds.');
  const run = streakOpen(Object.values(S.sessions), S.cfg.me.arch, Date.now());
  if (run) return say('אימון אחד השבוע שומר על הרצף שלך', 'One workout this week keeps your run going');
  if (!Wm.dn) return say('שבוע חדש בוא נתחיל חזק', 'A new week. Start strong.');
  if (left === 1) return say('עוד אימון אחד וסגרת את השבוע', 'One more workout and the week is yours!');
  return say('עוד ' + left + ' אימונים לסגירת השבוע', left + ' more workouts to close the week');
}
function weekHTML(Wm, easy) {
  const row = (x) => {
    const sub = x.st === 'done' ? say('הושלם ', 'Done ') + dayWord(x.when) : x.st === 'live' ? x.dn + say(' מתוך ', ' of ') + x.total + say(' סטים', ' sets') : wkMus(x.i) + ' · ' + x.mins + say(' דק׳', ' min');
    const end = x.st === 'live' ? '<span class="wr-tag">' + say('באמצע', 'In progress') + '</span>' : x.st === 'next' ? '<span class="wr-tag">' + say('הבא', 'Next') + '</span>' : x.st === 'done' ? '' : '<span class="wr-go">' + ICON.fwd + '</span>';
    return '<li style="--i:' + x.k + '"><button class="tab ' + wkTone(x.i) + ' ' + x.st + '" type="button" data-tab="' + x.i + '" aria-label="' + x.label + '"' + (x.cur ? ' aria-current="true"' : '') + '>' +
      '<span class="dot" aria-hidden="true">' + (x.st === 'done' ? ICON.check : x.k + 1) + '</span><span class="wr-txt"><b>' + wkName(x.i) + '</b><span>' + sub + '</span>' +
      (x.st === 'live' ? '<span class="wr-bar" aria-hidden="true"><i style="width:' + Math.round((x.dn / Math.max(1, x.total)) * 100) + '%"></i></span>' : '') + '</span>' + end + '</button></li>';
  };
  const n = Wm.items.length;
  return '<section class="week' + (easy ? ' easy' : '') + '" aria-label="' + say('האימונים של השבוע', 'This week\'s workouts') + '"><div class="week-h"><h2>' + (easy ? say('שבוע קל', 'Easy week') : say('השבוע', 'This week')) + '</h2>' +
    '<button class="go-link" id="planBtn" type="button" aria-label="' + say('התוכנית שלי', 'My plan') + '">' + say('התוכנית', 'Plan') + ICON.fwd + '</button></div>' +
    '<p class="wk-meter" role="img" aria-label="' + Wm.dn + say(' מתוך ', ' of ') + n + say(' אימונים הושלמו', ' workouts done') + '"><span class="wk-segs">' + Wm.items.map((x) => '<i class="' + x.st + '"></i>').join('') + '</span><b>' + Wm.dn + say(' מתוך ', ' of ') + n + '</b></p>' +
    '<ol class="wk-list" id="tabs">' + Wm.items.map(row).join('') + '</ol>' +
    '<p class="wk-coach"><span class="ava" aria-hidden="true">' + coachFace() + '</span><span><b>' + say('אילון', 'Eilon') + '</b>' + coachSays(Wm, easy) + '</span></p></section>';
}
/* the first screen: the player, the workout that is next (or running), and the week */
function renderHome() {
  const nu = nextUp(), w = nu.live >= 0 ? nu.live : nu.next, s = live(w), list = exList(w, s), P = phase(w, s), me = meNow();
  const total = list.reduce((n, e) => n + e.sets, 0), dn = s ? list.reduce((n, e) => n + doneCount(s, e), 0) : 0, Wm = weekModel(nu);
  for (const x of Wm.items) x.cur = x.i === w;
  $('#home').innerHTML = playerHTML(me) + bannerHTML() +
    '<section class="card next ' + wkTone(w) + '" aria-label="' + (s ? say('האימון שבאמצע', 'The workout in progress') : say('האימון הבא', 'The next workout')) + '"><div class="next-top"><p class="k">' + (ownName(w) ? wkOrd(w) : s ? say('באמצע', 'In progress') : say('האימון הבא', 'Up next')) + '</p><span class="xp-tag" title="' + say('נקודות על אימון מלא', 'Points for the full workout') + '">' + Ltr('+' + nf(xpPlan(list))) + '</span></div><h2>' + wkName(w) + '</h2>' +
    '<p class="mus">' + wkMus(w) + '</p>' +
    '<p class="meta">' + (s ? dn + say(' מתוך ', ' of ') + total + say(' סטים', ' sets') : cnt(list.length, 'תרגילים', 'תרגיל אחד', 'exercises', 'exercise') + ' · ' + minsOf(list, w) + say(' דק׳', ' min')) + '</p>' +
    '<button class="btn primary big" id="homeGo" type="button" data-w="' + w + '">' + (s ? say('המשך אימון', 'Continue workout') : say('התחל אימון', 'Start workout')) + '</button></section>' +
    weekHTML(Wm, !!(P.m && P.dl));
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
  $('#app').dataset.w = posOf(S.tab) % 5;
  const sub = i >= 0 ? say('תרגיל ', 'Exercise ') + (i + 1) + say(' מתוך ', ' of ') + list.length : ownName(S.tab) ? wkOrd(S.tab) : '';
  $('#wkTitle').innerHTML = '<b>' + wkName(S.tab) + '</b>' + (sub ? '<span class="sub">' + sub + '</span>' : '');
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
    '<span class="ex-rx' + (part ? ' part' : '') + '">' + (part ? dn + say(' מתוך ', ' of ') + e.sets : cnt(off ? e.n0 : e.sets, 'סטים', 'סט אחד', 'sets', 'set') + ' · ' + Ltr(e.reps) + say(' חז׳', ' reps')) + '</span>' +
    '</button></li>';
}
/* a set on its button: the weight over the reps, each with its word; the reps alone when there is no weight */
const setVal = (r, mv) => (r.kg != null ? '<span class="sv"><b>' + Ltr(fmtKg(r.kg)) + '</b><small>' + say('ק״ג', 'kg') + '</small></span>' : '') + '<span class="sv"><b>' + (r.reps != null ? r.reps : '–') + '</b><small>' + repWord(mv) + '</small></span>';
/* the sets of the exercise on screen as one slim row: what was lifted, then what is aimed for */
function setsHTML(e) {
  const s = live(S.tab), r = rowsOf(s, e.id), cur = cursor(), fu = firstUndone(s, e), T0 = fu >= 0 ? targetOf(e, fu, s) : null;
  let h = '';
  for (let i = 0; i < e.sets; i++) {
    const row = r[i], on = isDone(row), isCur = !S.edit && !!cur && cur.e.id === e.id && cur.i === i, T = on ? null : i === fu ? T0 : targetOf(e, i, s), ed = on && !!S.edit && S.edit.ex === e.id && S.edit.i === i;
    const label = say('סט ', 'Set ') + (i + 1) + (on ? ': ' + rowWords(row) + (row.pr ? say(', שיא', ', personal best') : '') + say(', עריכה', ', edit') : T ? say(', יעד ', ', target ') + rowWords(T) : '');
    const pop = on && S.justDone && S.justDone.ex === e.id && S.justDone.i === i && Date.now() - S.justDone.t < 1200;
    h += '<button class="setp' + (on ? ' done' : isCur ? ' cur' : '') + (ed ? ' cur' : '') + (pop ? ' pop' + (row.pr ? ' pr-pop' : '') : '') + '" type="button" data-i="' + i + '" aria-label="' + label + '">' +
      (on ? (row.pr ? '<span class="pr" aria-hidden="true">' + glyph('star') + '</span>' : '') + '<span class="v">' + setVal(row, e.mv) + '</span>' : '<span class="hint">' + say('סט ', 'Set ') + (i + 1) + '</span>') + '</button>';
  }
  if (e.cut) h += '<p class="cut-note">' + (e.sets ? say('שאר הסטים בוטלו היום בגלל כאב', 'The remaining sets are off today because of pain.') : say('בוטל היום בגלל כאב', 'Off today because of pain.')) + '</p>';
  return h;
}
/* one question about the exercise that was just finished: three answers to tap. Pain is a quiet chip under them, which opens two more */
const LOAD = () => [say('קל מדי', 'Too easy'), say('בדיוק', 'Just right'), say('כבד מדי', 'Too heavy')];
function fbHTML(e, s, painOnly) {
  const f = (s && s.fb && s.fb[e.id]) || {}, hurt = painOnly || S.fbPain === e.id || f.pain > 0;
  if (painOnly) f.pain = f.pain || 0;
  const opt = (key, v, t) => '<button type="button" class="fb-o" data-fb="' + key + '" data-v="' + v + '" aria-pressed="' + (f[key] === v) + '">' + t + '</button>';
  return '<div class="fbk" data-ex="' + e.id + '">' +
    (f.pain === 2 || painOnly ? '' : '<div class="fb-row" role="group" aria-label="' + say('איך היה', 'How was it') + '">' + LOAD().map((t, v) => opt('load', v, t)).join('') + '</div>') +
    (hurt ? '<div class="fb-row pain" role="group" aria-label="' + say('כאב', 'Pain') + '">' + opt('pain', 1, say('כאב קל', 'Mild pain')) + opt('pain', 2, say('כאב חזק', 'Strong pain')) + '</div>'
      : '<button class="fb-pain" type="button" data-painask="' + e.id + '">' + say('משהו כאב לי', 'Something hurt') + '</button>') + '</div>';
}
/* after a strong pain report: what stops today, and a gentler movement to move to. A headline, one line, one action */
function painNote(e, s) {
  const f = s && s.fb && s.fb[e.id]; if (!f || f.pain !== 2) return '';
  const alt = gentleAlt(e), set = alt && S.cfg.swap[e.id] === alt, mu = LIB[e.mv].p;
  return '<div class="fb-stop"><b>' + say('היום עוצרים עם ' + MUSCLE[mu].he, muName(mu) + ': stopping for today') + '</b>' +
    (!alt ? '' : set ? '<p>' + say('מהאימון הבא ', 'From next workout: ') + mvName(alt) + '</p>'
      : '<p>' + (LIB[alt].jf ? say('נוח יותר למפרקים ', 'Easier on the joints: ') : say('אפשר במקום ', 'Instead, you could do: ')) + mvName(alt) + '</p><button class="btn" type="button" data-swapto="' + e.id + ':' + alt + '">' + say('להחליף מהאימון הבא', 'Swap from next workout') + '</button>') +
    '<p class="fine">' + say('אם הכאב נמשך כדאי להיבדק', 'If the pain goes on, have it checked.') + '</p></div>';
}
/* what is asked in this exercise, as one line of plain text. How many sets there are is what the row of sets shows */
function rxLine(e, s) {
  const rir = rirOf(e, s);
  return Ltr(e.reps) + ' ' + repWord(e.mv) + (e.suf ? ' ' + e.suf : '');
}
/* the muscles an exercise works, as chips: the main one in its colour, the helpers grey */
const TONE = { chest: 'chest', back: 'back', delts: 'sh', fdelt: 'sh', biceps: 'arm', triceps: 'arm', quads: 'leg', hams: 'leg', glutes: 'leg', calves: 'leg', abs: 'core' };
const toneOf = (mu) => TONE[mu] || 'core';
const musOf = (mv) => { const L = LIB[mv]; return [L.p].concat(L.s || []).filter((k, j, a) => MUSCLE[k] && a.indexOf(k) === j).slice(0, 3); };
const musChips = (mv) => '<p class="mus-chips tn-' + toneOf(LIB[mv].p) + '">' + musOf(mv).map((k, j) => '<span' + (j ? '' : ' class="p"') + '>' + muName(k) + '</span>').join('') + '</p>';
/* the demo, with the two things that are a tap away on its corners (the details of the exercise, and everything else), then the sets */
function bodyHTML(e) {
  return '<div class="stage-box"><div class="stage-wrap"><canvas class="stage" aria-hidden="true"></canvas></div></div>' +
    '<div class="ex-row"><button class="st-btn how" type="button">' + ICON.info + '<span>' + say('פירוט', 'Details') + '</span></button>' + musChips(e.mv) +
    '<button class="st-btn swp" type="button"' + (rowsOf(live(S.tab), e.id).some(isDone) ? ' aria-disabled="true"' : '') + '>' + ICON.swap + '<span>' + say('החלף', 'Swap') + '</span></button></div>' +
    '<div class="sets">' + setsHTML(e) + '</div>';
}
/* the exercise on screen: its name and what is asked, the demo, and the sets */
function focusHTML(e, i, n) {
  const off = e.cut && e.sets === 0, s = live(S.tab), full = !off && doneCount(s, e) >= e.sets;
  return '<li class="ex open' + (full ? ' done' : '') + (off ? ' off' : '') + '" data-id="' + e.id + '">' +
    '<div class="fx-head"><button class="fx-nav" id="exPrev" type="button" aria-label="' + say('התרגיל הקודם', 'Previous exercise') + '"' + (i > 0 ? '' : ' disabled') + '>' + ICON.back + '</button>' +
    '<div class="fx-t"><h1 class="ex-name">' + e.nm + '</h1><p class="fx-rx">' + rxLine(e, s) + '</p></div>' +
    '<button class="fx-nav" id="exNext" type="button" aria-label="' + say('התרגיל הבא', 'Next exercise') + '"' + (i < n - 1 ? '' : ' disabled') + '>' + ICON.fwd + '</button></div>' +
    '<div class="ex-body" id="body-' + e.id + '">' + bodyHTML(e) + '</div></li>';
}
/* ---- the details of an exercise, one tap away: what it asks, how it is done, what was done last time, the lifter's own note,
   and two actions (ask Eilon, skip it today) ---- */
function renderMore() {
  const e = S.open && findEx(S.open), sh = $('#sheet'); if (!e) { closeSheet(); return; }
  const s = live(S.tab), ref = refRow(e, 0, s), rated = !!s && rowsOf(s, e.id).some(isDone), alone = exList(S.tab, s).length < 2, rm = restMins(e), r = rirOf(e, s);
  const fact = (v, t) => '<li><b>' + v + '</b><span>' + t + '</span></li>';
  sh.innerHTML = '<div class="sheet-in mr hw" role="dialog" aria-modal="true" aria-label="' + say('פירוט התרגיל', 'Exercise details') + '"><div class="ed-h"><div><h2>' + e.nm + '</h2>' + (LANG === 'he' ? '<p class="en-name" lang="en">' + Ltr(esc(e.name)) + '</p>' : '') + '</div><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    musChips(e.mv) +
    '<ul class="hw-facts">' + fact(e.sets, e.sets === 1 ? say('סט', 'set') : say('סטים', 'sets')) + fact(Ltr(e.reps), repWord(e.mv)) + fact(Ltr(rm.v), rm.one ? say('דקה מנוחה', 'min rest') : say('דקות מנוחה', 'min rest')) + '</ul>' +
    '<p class="hw-rir">' + (r == null ? e.int : rirText(r)) + '</p>' +
    '<h3 class="hw-h">' + say('איך עושים', 'How to do it') + '</h3>' +
    '<ul class="cues">' + mvCues(e.mv).map((c) => '<li>' + c.replace(/\d+(?:[.,]\d+)?(?:\s?[–\-×]\s?\d+(?:[.,]\d+)?)+°?/g, (m) => Ltr(m)) + '</li>').join('') + '</ul>' +
    (e.a !== e.mv || LIB[e.mv].near ? '<p class="fine">' + say('ההדמיה מראה תנועה דומה', 'The demo shows a similar movement.') + '</p>' : '') +
    (ref && !ref.other ? '<p class="prev-line">' + say('פעם קודמת', 'Last time') + ' (' + ago(ref.ts) + '): ' + rowsOf(S.sessions[ref.sid], e.id).filter(isDone).map((x) => '<bdi>' + rowWords(x) + '</bdi>').join(' · ') + '</p>' : '') +
    '<label class="note"><span>' + say('הערה שלי', 'My note') + '</span><textarea class="note-in" rows="1" maxlength="200" placeholder="' + say('גובה מושב או דגש', 'Seat height, tempo, a cue') + '">' + esc(S.cfg.notes[e.mv] || '') + '</textarea></label>' +
    '<div class="hw-acts"><button class="btn" id="moreAsk" type="button">' + say('שאל את אילון', 'Ask Eilon') + '</button>' + (rated || alone ? '' : '<button class="btn" id="moreSkip" type="button">' + say('דלג עליו היום', 'Skip it today') + '</button>') + '</div>' +
    (rated ? '<section><h3>' + say('משהו כואב', 'Something hurts') + '</h3>' + fbHTML(e, s, true) + painNote(e, s) + '</section>' : '') + '</div>';
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
  if (id === 'moreAsk') { const x = S.open; closeSheet(); openChat(x); return true; }
  if (id === 'moreSwap') { const x = S.open; closeSheet(); if (x) openSwap(x); return true; }
  if (id === 'moreSkip') {
    /* out of today's workout: the next exercise takes its place on screen, and a line says what happened */
    const e = S.open && findEx(S.open), n = nextOpen();
    closeSheet();
    if (e && skipToday(e.id)) { S.touched = true; delete S.drafts[e.id]; S.open = n && n.id !== e.id ? n.id : null; toast(ICON.check + '<b>' + say('דילגנו היום על ', 'Skipped today: ') + e.nm + '</b>'); renderAll(); }
    return true;
  }
  return false;
}
function renderHistory() {
  const all = sorted().filter((x) => hasDone(x) && x.end), list = all.slice(0, S.histN || 6), df = dateFmt();
  renderGains(); renderBackup();
  /* each finished workout is one row; a tap opens it for fixing, moving to another day or deleting */
  $('#history').innerHTML = '<h2 class="sec">' + say('אימונים אחרונים', 'Recent workouts') + '</h2>' + (list.length ? '<ul class="rows hist">' + list.map((x) => { const mn = Math.max(1, Math.round((x.end - x.ts) / 60000)), prs = tally(x).prs; return '<li class="tap"><button class="row-b" type="button" data-edit="' + x.id + '" aria-label="' + wkFull(x.w) + say(', עריכה', ', edit') + '"><span class="h-ok" aria-hidden="true">' + ICON.check + '</span><span class="h-t">' + wkName(x.w) + '</span><span class="h-d">' + df.format(new Date(x.ts)).replace(',', '') + '</span><span class="h-s"><span>' + cnt(setsDone(x), 'סטים', 'סט אחד', 'sets', 'set') + '</span>' + (mn < 300 ? '<span>' + mn + say(' דק׳', ' min') + '</span>' : '') + (prs ? '<span class="pr">' + glyph('star') + cnt(prs, 'שיאים', 'שיא אחד', 'bests', 'best') + '</span>' : '') + '</span>' + ICON.fwd + '</button></li>'; }).join('') + '</ul>' + (all.length > list.length ? '<button class="link" id="histMore" type="button">' + say('עוד אימונים', 'More workouts') + '</button>' : '')
    : '<p class="empty-note">' + say('האימונים שתסיים יופיעו כאן', 'Workouts you finish will show up here.') + '</p>');
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
  try { await S.dl.save({ filename: 'gymi-backup-' + isoDay(new Date()) + '.json', data: backupData() }); S.backupNote = say('הגיבוי נשמר', 'The backup was saved.'); }
  catch (e) { if (e && e.code !== 'declined' && e.code !== 'rate_limited') S.backupNote = say('השמירה נכשלה', 'Saving failed.'); }
  renderBackup();
}
function importBackup(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    const r = restoreData(String(rd.result || ''));
    if (r) { sweep(); meSync(); if (!S.touched) S.tab = nextUp().next; S.open = null; if ((S.cfg.lang || autoLang()) !== LANG) applyLang(); }
    const kept = r && r.kept ? say('ההגדרות במכשיר חדשות יותר אז הן נשארו', "This device's settings are newer than the file's, so they were kept.") : '';
    S.backupNote = !r ? say('זה לא קובץ גיבוי של gymi', 'This is not a gymi backup file.') : r.n ? (r.n === 1 ? say('אימון אחד שוחזר', '1 workout was restored.') : r.n + say(' אימונים שוחזרו', ' workouts were restored.')) + (kept && '<br>' + kept) : kept || (r.cfg ? say('ההגדרות שוחזרו', 'The settings were restored.') : say('אין בקובץ שום דבר חדש', 'Nothing new in this file.'));
    renderAll();
  };
  rd.onerror = () => { S.backupNote = say('הקובץ לא נקרא', 'The file could not be read.'); renderBackup(); };
  rd.readAsText(file);
}
/* progress: how the best set of each movement moved since the mesocycle began */
function renderGains() {
  const M = S.cfg.meso, R = mesoSummary(M.id), sign = (p) => Ltr((p >= 0 ? '+' : '−') + Math.abs(p).toFixed(1) + '%');
  $('#progCap').textContent = say('סבב ', 'Round ') + M.n + (R.n ? ' · ' + R.n + (R.n === 1 ? say(' אימון', ' workout') : say(' אימונים', ' workouts')) : '');
  $('#gains').innerHTML = '<div class="sec-h"><h2 class="sec">' + say('הכוח שלך', 'Your strength') + '</h2>' + (R.n ? '<button class="go-link" type="button" data-sum="' + M.id + '">' + say('סיכום הסבב', 'Round summary') + ICON.fwd + '</button>' : '') + '</div>' + (R.gains.length ? '<ul class="rows">' + R.gains.slice(0, 5).map((g) => '<li><span class="g-t">' + mvName(g.mv) + '</span><span class="g-s">' + Ltr(fmtRow(g.first)) + arrow() + Ltr(fmtRow(g.best)) + '</span><span class="g-d ' + (g.pct > 0.4 ? 'up' : g.pct < -0.4 ? 'dn' : '') + '">' + sign(g.pct) + '</span></li>').join('') + '</ul>'
    : '<p class="empty-note">' + say('השינוי יופיע אחרי שני אימונים', 'The change shows after two workouts.') + '</p>');
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
  renderHero(); markCur(); fitStage();
}
function renderAll() { renderMe(); renderHome(); renderPre(); renderHero(); renderList(); renderHistory(); renderDock(); if (S.sheet === 'list') renderListSheet(); else if (S.sheet === 'set') renderSettings(); else if (S.sheet === 'shop') renderShop(); freshLogged(); markLive(); }
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
  S.touched = true; S.edit = null; S.why = false; openEx(n.id, true, d); renderDock();
}
/* the next exercise that still has a set to do, after a given one */
function nextAfter(id) { const s = live(S.tab), list = exList(S.tab, s), i = list.findIndex((x) => x.id === id), left = (x) => firstUndone(s, x) >= 0; return list.slice(i + 1).find(left) || list.find(left) || null; }
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
  sh.innerHTML = '<div class="sheet-in ls" role="dialog" aria-modal="true" aria-label="' + say('כל התרגילים', 'All exercises') + '"><div class="ed-h"><div><p class="kicker">' + (P.dl ? say('שבוע קל', 'Easy week') : wkOrd(S.tab)) + ' · ' + t.dn + say(' מתוך ', ' of ') + t.total + say(' סטים', ' sets') + '</p><h2>' + wkName(S.tab) + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    '<ol class="ex-list" id="allList">' + list.map((e, i) => rowHTML(e, i, s)).join('') + '</ol>' +
    '<div class="ls-links"><button class="link" id="editWk" type="button">' + say('עריכת האימון', 'Edit this workout') + '</button>' + ((!s || !hasDone(s)) && timeInfo(S.tab).opts.length ? '<button class="link" id="timeAgain" type="button">' + say('פחות זמן היום', 'Less time today') + '</button>' : '') + ((!s || !hasDone(s)) && !P.dl && preMuscles(S.tab).length ? '<button class="link" id="preAgain" type="button">' + say('שאלת ההתאוששות', 'Recovery check') + '</button>' : '') + '</div>' +
    (s ? '<div class="ls-act"><button class="btn big" id="finishBtn" type="button"' + (hasDone(s) ? '' : ' disabled') + '>' + say('סיים אימון', 'Finish workout') + '</button>' +
      (S.resetAsk ? '<span class="confirm"><span>' + say('למחוק את הרישום של האימון', 'Clear what was logged in this workout?') + '</span><button class="btn danger" id="resetYes" type="button">' + say('כן נקה', 'Yes, clear') + '</button><button class="btn" id="resetNo" type="button">' + say('ביטול', 'Cancel') + '</button></span>' : '<button class="link" id="resetBtn" type="button">' + say('נקה רישום', 'Clear the log') + '</button>') + '</div>' : '') + '</div>';
  $('.sheet-in', sh).scrollTop = top; markCur();
}
function openList() { S.sheet = 'list'; S.resetAsk = false; renderListSheet(); $('#sheet').hidden = false; }
/* clicks inside that list; returns true when the click was handled */
function listSheetClick(ev, id) {
  if (S.sheet !== 'list') return false;
  const li = ev.target.closest('#allList .ex');
  if (li) { const d = li.dataset.id; S.touched = true; S.edit = null; closeSheet(); openEx(d, true); renderDock(); return true; }
  if (id === 'editWk') { openMeso('ex', S.tab); return true; }
  if (id === 'preAgain') { S.preSkip = null; S.preOpen = true; closeSheet(); afterPre(); return true; }
  if (id === 'timeAgain') { delete S.day[S.tab]; S.timeAsk = S.tab; S.open = null; closeSheet(); afterPre(); return true; }
  if (id === 'finishBtn') { closeSheet(); finishWorkout(); return true; }
  if (id === 'resetBtn' || id === 'resetNo') { S.resetAsk = id === 'resetBtn'; renderListSheet(); return true; }
  if (id === 'resetYes') {
    const s = live(S.tab); if (s) { delete S.sessions[s.id]; S.gone.add(s.id); S.dirty.add(s.id); saveLocal(); schedule(s.id, 100); }
    clearInterval(rest.iv); rest.on = false; rest.last = null; S.resetAsk = false; S.edit = null; S.drafts = {}; S.fbFor = null; S.open = null; S.banner = ''; S.bannerKind = ''; letSleep();
    closeSheet(); renderAll(); return true;
  }
  return false;
}
function refreshOpenSets() { const e = S.open && findEx(S.open), li = e && $('#exList .ex.open .sets'); if (li) li.innerHTML = setsHTML(e); }

/* ================================================================== dock: log a set with one tap, rest timer */
const rest = { on: false, start: 0, min: 0, max: 0, iv: 0, minHit: false, ended: 0, label: null, last: null, lit: -1 };
/* the 60 ticks around the rest ring, one for each second of a minute's turn */
const RT_TICKS = Array.from({ length: 60 }, (_, k) => { const a = (k / 60) * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a); return '<line x1="' + (100 + 93 * c).toFixed(1) + '" y1="' + (100 + 93 * s).toFixed(1) + '" x2="' + (100 + (k % 5 ? 98 : 99.5) * c).toFixed(1) + '" y2="' + (100 + (k % 5 ? 98 : 99.5) * s).toFixed(1) + '"/>'; }).join('');
let actx = null, wake = null, logBusy = false;
function primeAudio() { try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { actx = null; } }
function beep(n) {
  if (!S.sound || !actx) return;
  try {
    for (let i = 0; i < n; i++) {
      const o = actx.createOscillator(), gn = actx.createGain(), t = actx.currentTime + i * 0.3;
      o.type = 'sine'; o.frequency.value = n === 1 ? 587 : 784;
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.06, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
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
  const d = draftGet(e.id, i); if (d && d.kg !== undefined) return d.kg;
  if (T === undefined) T = targetOf(e, i, s);
  return T ? T.kg : null;
}
/* the reps shown for the next set: what the lifter dialled in, else the target, else the middle of the range */
function curReps(e, i, s, T) {
  const d = draftGet(e.id, i); if (d && d.reps != null) return d.reps;
  if (T === undefined) T = targetOf(e, i, s);
  if (T && T.reps != null) return T.reps;
  const rr = repRange(e); return Math.round((rr[0] + rr[1]) / 2);
}
/* what the lifter dialled in for the next set of an exercise, before it is logged. It is kept for each exercise, so a look at
   another one (or at the list) does not lose it */
const draftGet = (exId, i) => { const d = S.drafts[exId]; return d && d.i === i ? d : null; };
const draftOf = (t) => draftGet(t.e.id, t.i) || (S.drafts[t.e.id] = { ex: t.e.id, i: t.i });
const repsHTML = (r) => '<b>' + (r == null ? '—' : r) + '</b><small>' + repWord((shown() || {}).mv) + '</small>';
/* the weight and the reps as a screen reader says them: the value first, then what a tap does */
const kgSay = (kg) => say('משקל: ', 'Weight: ') + (kg == null ? say('בלי משקל', 'no weight') : fmtKg(kg) + say(' ק״ג', ' kg')) + say(', לחיצה להקלדה', ', tap to type');
const repsSay = (r) => say('חזרות: ', 'Reps: ') + (r == null ? '—' : r) + say(', לחיצה להקלדה', ', tap to type');
/* a value changed by the − and + buttons is said aloud */
function srSay(t) { const el = $('#srSay'); if (!el) return; el.textContent = ''; setTimeout(() => { el.textContent = t; }, 30); }
const kgHTML = (kg, bw, help) => (kg == null ? '<b class="word">' + (bw ? say('גוף', 'Body') : '0') + '</b><small>' + (bw ? say('משקל גוף', 'bodyweight') : say('ק״ג', 'kg')) + '</small>' : '<b>' + fmtKg(kg) + '</b><small>' + (help ? say('ק״ג סיוע', 'kg of help') : say('ק״ג', 'kg')) + '</small>');
const isBw = (mv) => !!(LIB[mv] && (LIB[mv].bw || LIB[mv].eq === 'bw'));
/* weight and reps, each with its own stepper. The weight's + and − say how far they go: up fast, down fine (see stepUp).
   A target is shown a shade lighter until it is confirmed or changed; a tap on a number opens typing */
function numsHTML(kg, reps, ghostKg, ghostReps, mv) {
  const inc = incOf(mv), up = inc, unit = say(' ק״ג', ' kg'), help = !!LIB[mv].inv;
  return '<div class="dk-nums"><div class="num" role="group" aria-label="' + say('משקל', 'Weight') + '"><button class="step" type="button" data-d="-1" aria-label="' + say('הפחת ', 'Take off ') + fmtKg(inc) + unit + '">' + Ltr('−' + fmtKg(inc)) + '</button>' +
    '<div class="dk-kg' + (ghostKg ? ' ghost' : '') + '" id="dkKg" role="button" tabindex="0" aria-label="' + kgSay(kg) + '">' + kgHTML(kg, isBw(mv), help) + '</div>' +
    '<button class="step" type="button" data-d="1" aria-label="' + say('הוסף ', 'Add ') + fmtKg(up) + unit + '">' + Ltr('+' + fmtKg(up)) + '</button></div>' +
    '<div class="num" role="group" aria-label="' + say('חזרות', 'Reps') + '"><button class="rstep" type="button" data-d="-1" aria-label="' + say('הפחת חזרה', 'One rep less') + '">−</button>' +
    '<div class="dk-reps' + (ghostReps ? ' ghost' : '') + '" id="dkReps" role="button" tabindex="0" aria-label="' + repsSay(reps) + '">' + repsHTML(reps) + '</div>' +
    '<button class="rstep" type="button" data-d="1" aria-label="' + say('הוסף חזרה', 'One rep more') + '">+</button></div></div>';
}
/* the question about the exercise that was just finished, as a card: in the rest screen, or above "Finish workout" after the last set */
function fbPanel(s) {
  const e = S.fbFor && s ? exList(S.tab, s).find((x) => x.id === S.fbFor) : null;
  if (!e) { S.fbFor = null; return ''; }
  return '<div class="fb-dock"><div class="fb-h"><b>' + say('איך היה', 'How was it?') + '</b><span>' + e.nm + '</span></div>' + fbHTML(e, s) + painNote(e, s) + '</div>';
}
/* a question that was left unanswered is not kept */
function dropFb() {
  const s = live(S.tab), f = s && s.fb && s.fb[S.fbFor];
  if (f && f.pump == null && f.load == null && !f.pain) { delete s.fb[S.fbFor]; s.ft = Date.now(); touch(s); }
  S.fbFor = null; S.fbPain = null;
}
function closeFb() {
  const id = S.fbFor, s = live(S.tab), e = id && findEx(id);
  S.fbFor = null; S.fbPain = null;
  /* answered with no rest running (every set was logged at once): the next exercise that has sets left takes the screen */
  const n = !rest.on && e && S.open === id && firstUndone(s, e) < 0 ? nextOpen() : null;
  if (n && n.id !== id) { openEx(n.id, true, 1); renderDock(); return; }
  renderDock(); if (id && S.open === id) refreshEx({ id });
}
/* "swap from the next workout", offered next to a pain report */
function swapNext(exId, mv) { swapTo(exId, mv, true); renderDock(); if (S.open) refreshEx({ id: S.open }); }
function renderDock() {
  const dock = $('#dock'), s = live(S.tab), fbp = fbPanel(s), done = say('כל הסטים בוצעו', 'Every set is done'), fin = '<button class="btn primary" id="dkFinish" type="button">' + say('סיים אימון', 'Finish workout') + '</button>';
  let cls = 'dock', h;
  if (rest.on) {
    /* the rest takes the whole screen: the time in the middle, what was just logged above it (and a way to take it back),
       the question about a finished exercise, and at the foot what comes next and the way on */
    const L = rest.last; cls += ' rest'; rest.lit = -1;
    h = '<div class="rt-top"><button class="rt-undo" id="rtUndo" type="button" aria-label="' + say('ביטול הסט שנרשם', 'Take back the set that was logged') + '"' + (L ? '' : ' hidden') + '>' + ICON.undo + '</button><span class="rt-k">' + say('מנוחה', 'Rest') + '</span><span class="rt-sp"></span></div>' +
      '<div class="rt"><div class="rt-ring"><svg viewBox="0 0 200 200" aria-hidden="true"><g class="rt-ticks" id="rtTicks">' + RT_TICKS + '</g><circle class="t" cx="100" cy="100" r="82"/><circle class="f" id="rtFill" cx="100" cy="100" r="82" pathLength="100"/><circle class="h" id="rtHead" cx="182" cy="100" r="7"/></svg>' +
      '<div class="rt-mid"><div class="rt-time" id="rtTime">0:00</div><div class="rt-word" id="rtWord"></div></div></div>' +
      '<div class="rt-adj"><button type="button" id="rtMinus" aria-label="' + say('הפחת 15 שניות', '15 seconds less') + '">' + Ltr('−15') + '</button><button type="button" id="rtPlus" aria-label="' + say('הוסף 15 שניות', '15 seconds more') + '">' + Ltr('+15') + '</button></div></div>' +
      '<div class="rt-foot"><button type="button" id="rtSkip" class="go">' + say('המשך', 'Continue') + '</button></div>';
  } else if (fbp && (S.fbFor === S.open || !anyLeft(s))) {
    /* no rest is running: the question stands above the way on, and never in its way */
    S.edit = null;
    h = fbp + (anyLeft(s) ? '<div class="dk-row"><div class="dk-msg">' + say('התרגיל הושלם', 'Exercise done') + '</div><button class="btn primary" id="dkNext" type="button">' + say('לתרגיל הבא', 'Next exercise') + ICON.fwd + '</button></div>'
      : '<div class="dk-row"><div class="dk-msg">' + done + '</div>' + fin + '</div>');
  } else if (S.edit && findEx(S.edit.ex) && isDone(rowsOf(s, S.edit.ex)[S.edit.i])) {
    const e = findEx(S.edit.ex), row = rowsOf(s, e.id)[S.edit.i];
    h = '<div class="dk-top"><span class="dk-set">' + say('עריכת סט ', 'Editing set ') + '<b>' + (S.edit.i + 1) + '</b></span>' +
      '<button class="btn danger" id="edDel" type="button">' + say('מחק סט', 'Delete set') + '</button><button class="btn primary" id="edClose" type="button">' + say('סיום', 'Done') + '</button></div>' + numsHTML(row.kg, row.reps, false, false, e.mv);
  } else {
    S.edit = null; if (S.fbFor) dropFb();
    const cur = cursor();
    if (cur) {
      /* the numbers of the target are the ones in the two boxes; the line above them only says which set this is */
      const e = cur.e, i = cur.i, T = targetOf(e, i, s), d = draftGet(e.id, i), note = S.cfg.notes[e.mv], why = S.why && T ? whyText(T, e) : '';
      h = '<div class="dk-top"><span class="dk-set">' + say('סט ', 'Set ') + '<b>' + (i + 1) + '</b>' + say(' מתוך ', ' of ') + e.sets + '</span>' + (T && ['reps', 'weight', 'down', 'cal'].includes(T.mode) ? badge(T, e) : '') + '</div>' +
        (why ? '<p class="dk-why">' + why + '</p>' : '') +
        (note ? '<p class="dk-note">' + ICON.pin + '<span>' + esc(note) + '</span></p>' : '') +
        numsHTML(curKg(e, i, s, T), curReps(e, i, s, T), !!T && !(d && d.kg !== undefined), !!T && !(d && d.reps != null), e.mv) +
        '<button class="hit" id="dkHit" type="button">' + ICON.check + '<span>' + say('סיימתי סט', 'Set done') + '</span></button>';
    } else if (anyLeft(s)) h = '<div class="dk-row"><div class="dk-msg">' + say('התרגיל הושלם', 'Exercise done') + '</div><button class="btn primary" id="dkNext" type="button">' + say('לתרגיל הבא', 'Next exercise') + ICON.fwd + '</button></div>';
    else h = '<div class="dk-row"><div class="dk-msg">' + done + '</div>' + (s && hasDone(s) ? fin : '') + '</div>';
  }
  dock.className = cls; dock.innerHTML = '<div class="dock-in">' + h + '</div>';
  if (rest.on) tickRest();
  fitStage();
}
/* the demo has one size on a given screen, whatever the exercise and whatever else is on the page (see .stage in styles.css) */
function fitStage() {}
function setKg(kg) {
  const t = dockTarget(); if (!t) return;
  kg = capKg(kg);
  if (t.edit) { const s = live(S.tab), row = rowsOf(s, t.e.id)[t.i]; if (!row) return; row.kg = kg; row.t = Date.now(); delete row.pr; if (isPr(s, t.e.id, t.e.mv, t.i, row.kg, row.reps)) row.pr = true; touch(s); refreshEx(t.e); renderMe(); }
  else draftOf(t).kg = kg;
  const box = $('#dkKg'); if (box) { box.classList.remove('ghost'); box.setAttribute('aria-label', kgSay(kg)); if (!$('input:not([switch])', box)) box.innerHTML = kgHTML(kg, isBw(t.e.mv), !!LIB[t.e.mv].inv); }
}
function stepKg(d) {
  const t = dockTarget(); if (!t) return;
  const s = live(S.tab), cur = t.edit ? (rowsOf(s, t.e.id)[t.i] || {}).kg : curKg(t.e, t.i, s);
  const inc = incOf(t.e.mv);
  setKg((cur == null ? 0 : cur) + (d > 0 ? inc : -inc));
  const k = dockTarget() && $('#dkKg'); if (k) srSay(k.getAttribute('aria-label').split(',')[0]);
}
function setReps(r) {
  const t = dockTarget(); if (!t || r == null || !(r >= 1)) return;
  r = capReps(r);
  if (t.edit) { const s = live(S.tab), row = rowsOf(s, t.e.id)[t.i]; if (!row) return; row.reps = r; row.t = Date.now(); delete row.pr; if (isPr(s, t.e.id, t.e.mv, t.i, row.kg, row.reps)) row.pr = true; touch(s); refreshEx(t.e); renderMe(); }
  else draftOf(t).reps = r;
  const box = $('#dkReps'); if (box) { box.classList.remove('ghost'); box.setAttribute('aria-label', repsSay(r)); if (!$('input:not([switch])', box)) box.innerHTML = repsHTML(r); }
}
function stepReps(d) {
  const t = dockTarget(); if (!t) return;
  const s = live(S.tab), cur = t.edit ? (rowsOf(s, t.e.id)[t.i] || {}).reps : curReps(t.e, t.i, s);
  setReps(Math.max(1, (cur || 0) + d));
  const r = $('#dkReps'); if (r) srSay(r.getAttribute('aria-label').split(',')[0]);
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
  const s = ensure(wkOf(e.id)), T = targetOf(e, i, s), arr = s.sets[e.id] || (s.sets[e.id] = []), pr = isPr(s, e.id, e.mv, i, kg, reps);
  arr[i] = { kg: kg == null ? null : kg, reps, done: true, t: Date.now() }; if (pr) arr[i].pr = true;
  if (T) { arr[i].tk = T.kg == null ? null : T.kg; arr[i].tr = T.reps; }
  touch(s); return pr;
}
/* the exercise is finished: ask how it went, once */
function askFb() { /* nothing is asked after an exercise any more (round 3): pain is told from the exercise's details */ }
function commitSet(e, i, kg, reps) {
  const s0 = ensure(wkOf(e.id)), T0 = targetOf(e, i, s0), good = !!T0 && T0.reps != null && reps >= T0.reps && (T0.kg == null || kg == null || kg >= T0.kg);
  const lv0 = S.lvl, pr = writeRow(e, i, kg, reps), s = live(S.tab), list = exList(S.tab, s), left = (x) => firstUndone(s, x) >= 0;
  e = list.find((x) => x.id === e.id);
  S.combo = good || pr ? (S.combo || 0) + 1 : 0;
  /* each good set in a row lifts the coin one step of a scale, up to an octave */
  sfx(pr ? 'pr' : 'set', pr ? 0 : [0, 2, 4, 5, 7, 9, 11, 12][Math.min(7, Math.max(0, (S.combo || 1) - 1))]); if (pr) haptic('pr'); popGain(XP.set + (pr ? XP.pr : 0), pr);
  S.justDone = { ex: e.id, i, t: Date.now() };
  delete S.drafts[e.id]; refreshEx(e); renderTabs(); renderHistory(); renderPre(); markLive();
  /* a new level is told once the points of the set have had their moment */
  renderMe(); setTimeout(() => bump(lv0), reduced ? 0 : pr ? 2300 : 1600);
  S.why = false;
  if (!left(e)) askFb(e, s);
  if (!list.some(left)) { stopRest(); return; }
  let nxt = e, label;
  if (left(e)) {
    const ni = firstUndone(s, e), T = targetOf(e, ni, s), inv = LIB[e.mv].inv, n = e.sets;
    label = () => say('סט ', 'Set ') + (ni + 1) + say(' מתוך ', ' of ') + n + (T && T.mode === 'down' ? ' · ' + (inv ? say('מוסיפים סיוע ', 'More help: ') : say('מורידים ל-', 'Down to ')) + fmtKg(T.kg) + say(' ק״ג', ' kg') : T && T.mode === 'cal' ? ' · ' + (inv ? say('פחות סיוע ', 'Less help: ') : say('מעלים ל-', 'Up to ')) + fmtKg(T.kg) + say(' ק״ג', ' kg') : '');
  } else { nxt = list.slice(list.indexOf(e) + 1).find(left) || list.find(left); const id = nxt.id; label = () => { const x = findEx(id); return x ? x.nm : ''; }; }
  startRest(e.rest[0], e.rest[1], label, { ex: e.id, i, kg, reps, pr });
  /* the exercise is finished: the next one slides in while the rest runs */
  clearTimeout(S.slideT);
  if (nxt !== e) S.slideT = setTimeout(() => { const L = rest.last; if (rest.on && L && L.ex === e.id && L.i === i && !left(e) && S.tab === wkOf(nxt.id) && S.open === e.id) { openEx(nxt.id, true, 1); renderDock(); } }, 750);
}
function clearRow(e, i) { const s = live(wkOf(e.id)); if (!s) return; const arr = s.sets[e.id] || (s.sets[e.id] = []); arr[i] = { kg: null, reps: null, done: false, t: Date.now() }; touch(s); }
function afterEdit(e) { refreshEx(e); renderMe(); renderTabs(); renderHistory(); renderDock(); markLive(); }
/* a rest is never longer than three minutes, on the clock or by adding to it */
const REST_TOP = 180;
function startRest(min, max, label, last) {
  clearInterval(rest.iv); max = Math.min(max, REST_TOP); min = Math.min(min, max);
  Object.assign(rest, { on: true, start: Date.now(), min, max, scale: max, minHit: false, ended: 0, label, last });
  S.edit = null; renderDock(); rest.iv = setInterval(tickRest, 100);
}
function tickRest() {
  if (!rest.on) return;
  const el = (Date.now() - rest.start) / 1000, left = Math.max(0, rest.max - el), d = $('#dock'), tm = $('#rtTime');
  if (!tm) return;
  tm.textContent = mmss(Math.ceil(left));
  const face = Math.max(rest.scale || rest.max, 1), fr = Math.max(0, Math.min(1, left / face)), a = fr * 2 * Math.PI, hd = $('#rtHead');
  $('#rtFill').style.strokeDashoffset = String(((1 - fr) * 100).toFixed(2));
  if (hd) { hd.setAttribute('cx', (100 + 82 * Math.cos(a)).toFixed(1)); hd.setAttribute('cy', (100 + 82 * Math.sin(a)).toFixed(1)); }
  const lit = Math.ceil(fr * 60), tk = $('#rtTicks');
  if (tk && lit !== rest.lit) { rest.lit = lit; [...tk.children].forEach((x, k) => x.classList.toggle('on', k < lit)); }
  /* the last half minute is the time to get ready (yellow), and at nothing left the clock says go (green). Time that is added takes both back */
  const soon = left > 0 && left <= Math.min(30, face / 2);
  if (soon && !rest.minHit) { rest.minHit = true; beep(1); } else if (!soon && left > 0) rest.minHit = false;
  if (left <= 0 && !rest.ended) { rest.ended = Date.now(); beep(2); haptic('heavy'); }
  d.classList.toggle('ready', soon && !rest.ended); d.classList.toggle('go', !!rest.ended);
  const word = rest.ended ? say('קדימה', 'Go') : soon ? say(S.cfg.me.look.body === 1 ? 'תתכונני' : 'תתכונן', 'Get ready') : say('מנוחה', 'Rest');
  $('#rtWord').textContent = word;
  if (rest.ended && Date.now() - rest.ended > 4000) stopRest();
}
function stopRest() {
  const L = rest.on ? rest.last : null;
  clearTimeout(S.slideT); clearInterval(rest.iv); rest.on = false; rest.last = null; if (S.fbFor && anyLeft(live(S.tab))) dropFb();
  /* the rest after the last set of an exercise is over: the next exercise opens, under its own purple screen */
  const done = L && findEx(L.ex), s = live(S.tab), nxt = done && s && firstUndone(s, done) < 0 ? nextAfter(done.id) : null;
  if (nxt && S.view === 'workout') { if (S.open !== nxt.id) openEx(nxt.id, true, 1); exIntro(nxt); }
  renderDock(); refreshOpenSets();
  /* a note that came during the rest moves off the name of the exercise, to the top of its drawing */
  const tt = $('#toast'); if (tt && !tt.hidden) tt.style.top = laneTop();
  for (const f of $$('.pts')) f.remove();
}
/* ---- a new exercise takes the screen: the exercise itself, drawn in large and moving on a soft backdrop, and under it its place
   in the workout, its name, the muscles and what it asks. It stays until "start" ---- */
const XI = { t: 0, g: 0 };
function exIntro(e, first) {
  const box = $('#exIntro'); if (!box || !e || window.__intro === false) return;
  /* the sample workout of the tour has no opening screens: Eilon is the one who speaks there */
  if (typeof TR !== 'undefined' && TR.on && TR.steps.some((x) => x.leave)) return;
  const list = exList(S.tab), i = list.findIndex((x) => x.id === e.id); if (i < 0) return;
  const fact = (b, t) => '<li><b>' + b + '</b><span>' + t + '</span></li>';
  const s0 = live(S.tab), back = !!first && !(s0 && hasDone(s0));
  const rm = restMins(e);
  box.className = 'xi xo';
  box.innerHTML = '<div class="xo-in" role="dialog" aria-modal="true" aria-labelledby="xiT">' +
    (back ? '<button class="xi-back" id="xiBack" type="button" aria-label="' + say('חזרה', 'Back') + '">' + ICON.back + '</button>' : '') +
    '<div class="xo-hero"><canvas class="xo-cv" aria-hidden="true"></canvas><p class="xo-k">' + say('תרגיל ', 'Exercise ') + (i + 1) + say(' מתוך ', ' of ') + list.length + '</p></div>' +
    '<div class="xo-body"><div class="xo-info"><h2 class="xo-t" id="xiT">' + e.nm + '</h2>' + musChips(e.mv) +
    '<ul class="xo-rx">' + fact(e.sets, e.sets === 1 ? say('סט', 'set') : say('סטים', 'sets')) + fact(Ltr(e.reps), repWord(e.mv)) + fact(Ltr(rm.v), rm.one ? say('דקה מנוחה', 'min rest') : say('דקות מנוחה', 'min rest')) + '</ul></div>' +
    '<button class="btn primary big xo-go" id="xiGo" type="button">' + say('התחל', 'Start') + '</button></div></div>';
  box.classList.remove('out'); box.hidden = false; void box.offsetWidth; box.classList.add('on');
  startPlayer($('.xo-cv', box), e.a, box, cssVar('--xo-bg'));
  haptic('step'); sfx('next');
  clearTimeout(XI.t); XI.t = setTimeout(() => { const b = $('#xiGo'); if (b) b.focus({ preventScroll: true }); }, 80);
}
function exIntroOff() {
  const box = $('#exIntro'); clearTimeout(XI.t); if (!box || box.hidden) return;
  box.classList.add('out'); box.classList.remove('on'); clearTimeout(XI.g);
  const st = $('#exList .stage'), cur = shown(); if (st && cur) startPlayer(st, cur.a, $('#exList'));
  XI.g = setTimeout(() => { if (box.classList.contains('out')) { box.hidden = true; box.innerHTML = ''; box.classList.remove('out'); } }, reduced ? 0 : 100);
}
function nudgeRest(d) {
  if (!rest.on) return;
  const el = (Date.now() - rest.start) / 1000;
  /* more rest counts from now when the time was already up, and never leaves more than three minutes on the clock */
  if (d > 0) { rest.max = Math.min(Math.max(rest.max, el) + d, el + REST_TOP); rest.ended = 0; }
  else rest.max = Math.max(el, rest.max + d);
  rest.scale = Math.max(rest.scale || 0, rest.max - el);
  tickRest();
}
function undoLast() {
  const L = rest.last, e = L && findEx(L.ex); if (!e) return;
  clearTimeout(S.slideT); clearRow(e, L.i); clearInterval(rest.iv); rest.on = false; rest.last = null;
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
/* the end of a workout, on the workout's own colour: the character cheers, the points count up, the level bar fills, and when
   a level is passed the screen says so. What opened on the way (a personal best, a reward, an achievement) follows, one at a time.
   Nothing here is small print.
   R: { y: the workout's tally, from / to: the level before and after it, got: achievements earned now } */
/* how long a finished workout took: from a minute before its first set to its end */
function durMins(s) {
  const ts = []; for (const k in s.sets || {}) for (const r of s.sets[k] || []) if (isDone(r) && r.t) ts.push(r.t);
  const a = ts.length ? Math.min.apply(null, ts) - 60e3 : s.ts || s.end;
  return Math.max(1, Math.min(300, Math.round((s.end - a) / 60e3)));
}
/* how much stronger than the last time this workout was done: the best set of each exercise both had, on average, in percent */
function betterPct(s) {
  const prev = sorted().find((x) => x.id !== s.id && x.w === s.w && x.end && x.end < s.end && hasDone(x)); if (!prev) return null;
  let sum = 0, n = 0;
  for (const pe of sessSlots(s)) {
    const mv = moveOf(pe, s); if (moveOf(pe, prev) !== mv) continue;
    const L = LIB[mv], top = (x) => rowsOf(x, pe.id).filter((r) => isDone(r) && r.reps != null).reduce((m, r) => Math.max(m, score(L, r.kg, r.reps)), 0), a = top(prev), b = top(s);
    if (a > 0 && b > 0) { sum += (b - a) / a; n++; }
  }
  return n ? Math.round((sum / n) * 1000) / 10 : null;
}
/* a number that runs up to its value */
function runUp(el, to, pre, suf, ms) {
  if (!el) return;
  const fmt = (v) => (pre || '') + (to % 1 ? v.toFixed(1) : nf(Math.round(v))) + (suf || '');
  if (reduced) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), step = (now) => { const k = Math.min(1, (now - t0) / (ms || 800)); el.textContent = fmt(to * (1 - Math.pow(1 - k, 3))); if (k < 1 && el.isConnected) requestAnimationFrame(step); };
  el.textContent = fmt(0); requestAnimationFrame(step);
}
/* a screen that covers everything (a new rank, a box that is opened) lives inside the app, and the Escape key answers it
   before anything under it hears the key */
function overlayKeys(el, onEsc) {
  const h = (ev) => { if (!el.isConnected) { document.removeEventListener('keydown', h, true); return; } if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); onEsc(); } };
  document.addEventListener('keydown', h, true);
}
/* a rank that was reached: the whole screen goes dark, the medal comes in, and a tap goes on */
function rankReveal(rank) {
  const old = $('#rankUp'); if (old) old.remove();
  const el = document.createElement('div'); el.id = 'rankUp'; el.className = 'rank-up'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', say('דרגה חדשה ', 'A new rank: ') + nm(rank));
  el.innerHTML = '<div class="ru-in"><span class="ru-rays" aria-hidden="true"></span><span class="ru-medal">' + medalSVG(rank.i) + '</span><p class="ru-k">' + say('דרגה חדשה', 'A new rank') + '</p><h2>' + nm(rank) + '</h2><button class="btn big" id="rankOk" type="button">' + say('יש', 'Yes') + '</button></div>';
  $('#app').appendChild(el);
  const done = () => { el.classList.add('out'); setTimeout(() => el.remove(), reduced ? 0 : 220); };
  overlayKeys(el, done);
  el.addEventListener('click', (ev) => { if (ev.target.closest('#rankOk') || ev.target === el) done(); });
  feel('glory', 'heavy'); setTimeout(() => { const b = $('#rankOk'); if (b) b.focus({ preventScroll: true }); }, 60);
}
function showSummary(s, R) {
  const y = R.y, up = R.to.lvl > R.from.lvl, opened = up ? rewardsBetween(R.from.lvl, R.to.lvl) : [], bk = boxOf(s), mins = durMins(s), pct = betterPct(s), better = pct != null && pct >= 1;
  const prs = exList(s.w, s).filter((e) => rowsOf(s, e.id).some((r) => isDone(r) && r.pr)).map((e) => e.nm);
  const chip = (cls, ic, t) => '<li class="' + cls + '">' + ic + '<b>' + t + '</b></li>';
  const chips = prs.slice(0, 3).map((n) => chip('gold', glyph('star'), say('שיא חדש ב', 'New best · ') + n))
    .concat(opened.map((r) => chip('', glyph('gift'), say('נפתח ', 'Unlocked ') + nm(r))));
  const tile = (id, v, t, cls) => '<li' + (cls ? ' class="' + cls + '"' : '') + '><b id="' + id + '" dir="ltr">' + v + '</b><span>' + t + '</span></li>';
  const sh = $('#sheet'); S.sheet = 'sum'; $('#toast').hidden = true;
  const who = S.cfg.me.name;
  sh.innerHTML = '<div class="sheet-in sum fin w' + s.w + '" role="dialog" aria-modal="true" aria-label="' + say('סיכום אימון', 'Workout summary') + '"><canvas class="confetti" id="confetti" aria-hidden="true"></canvas><span class="fin-rays" aria-hidden="true"></span>' +
    '<p class="sum-k">' + wkName(s.w) + say(' הושלם', ' complete') + (s.dl ? say(' · שבוע קל', ' · easy week') : '') + '</p>' +
    '<h2 class="fin-h">' + say('כל הכבוד', 'Well done') + (who ? ' <bdi>' + esc(who) + '</bdi>' : '') + '</h2>' +
    '<div class="sum-av" id="sumAv">' + avatar(up ? R.from.lvl : R.to.lvl, {}) + '</div>' +
    '<p class="fin-xp"><b id="stXp" dir="ltr">+' + nf(y.xp) + '</b><span>' + say('נקודות', 'points') + '</span></p>' +
    '<p class="sum-up" id="sumUp"' + (up ? '' : ' hidden') + '>' + glyph('star') + '<span>' + say('עלית לרמה ', 'You reached level ') + R.to.lvl + '</span></p>' +
    '<div class="sum-lv"><b class="lv-badge" id="sumLv">' + say('רמה ', 'Level ') + (up ? R.from.lvl : R.to.lvl) + '</b><span class="xpbar"><i id="sumBar" style="width:' + pctOf(R.from) + '%"></i></span><b class="sum-nx" id="sumNx">' + ((up ? R.from.lvl : R.to.lvl) + 1) + '</b></div>' +
    '<p class="sum-to" id="sumTo">' + say('עוד ' + cnt(setsToNext(R.to), 'סטים', 'סט אחד', 'sets', 'set') + ' לרמה ', cnt(setsToNext(R.to), 'סטים', 'סט אחד', 'sets', 'set') + ' to level ') + (R.to.lvl + 1) + '</p>' +
    '<ul class="sum-st">' + tile('stSets', y.sets, y.sets === 1 ? say('סט', 'set') : say('סטים', 'sets')) + tile('stMin', mins, mins === 1 ? say('דקה', 'minute') : say('דקות', 'minutes')) +
      (better ? tile('stPct', '+' + pct + '%', say('מהפעם הקודמת', 'on last time'), 'up') : y.prs ? tile('stPrs', y.prs, y.prs === 1 ? say('שיא', 'best') : say('שיאים', 'bests'), 'xp') : '') + '</ul>' +
    (chips.length ? '<ul class="sum-new">' + chips.join('') + '</ul>' : '') +
    '<div id="sumBox">' + sumBoxHTML(bk) + '</div>' +
    '<button class="btn primary big" id="sheetClose" type="button">' + say('המשך', 'Continue') + '</button></div>';
  sh.hidden = false; $('.sheet-in', sh).scrollTop = 0; $('#sheetClose').focus({ preventScroll: true });
  const av = () => $('#sumAv .av'), bar = () => $('#sumBar'), later = (ms, fn) => setTimeout(() => { if (S.sheet === 'sum' && $('#sumBar')) fn(); }, reduced ? 0 : ms);
  runUp($('#stSets'), y.sets, '', '', 700); runUp($('#stMin'), mins, '', '', 800);
  runUp($('#stXp'), y.xp, '+', '', 1200); if (better) runUp($('#stPct'), pct, '+', '%', 1000); else if (y.prs) runUp($('#stPrs'), y.prs, '', '', 700);
  /* a new rank is shown on the whole screen, with its medal, before anything else of the summary */
  if (up && window.__rank !== false && rankOf(R.to.lvl).i > rankOf(R.from.lvl).i) rankReveal(rankOf(R.to.lvl));
  if (av()) av().classList.add('cheer');
  if (!up) {
    confetti($('#confetti'), 40); feel('done');
    later(350, () => { bar().style.width = pctOf(R.to) + '%'; });
    return;
  }
  /* a level is passed: the bar runs to its end, the screen says it, the character becomes the one of the new level, and the bar starts again */
  sfx('done');
  later(350, () => { bar().style.width = '100%'; });
  later(1250, () => {
    const box = $('#sumAv'); box.innerHTML = avatar(R.to.lvl, { flex: true }); box.classList.add('pump');
    $('#sumLv').textContent = say('רמה ', 'Level ') + R.to.lvl; $('#sumLv').classList.add('pop'); $('#sumNx').textContent = R.to.lvl + 1; $('#sumUp').classList.add('show');
    bar().style.transition = 'none'; bar().style.width = '0%'; void bar().offsetWidth; bar().style.transition = ''; bar().style.width = pctOf(R.to) + '%';
    confetti($('#confetti'), 80); chime(); haptic('heavy');
  });
}
function finishWorkout() {
  const s = live(S.tab); if (!s || !hasDone(s)) return;
  clearInterval(rest.iv); rest.on = false; rest.last = null;
  s.end = Date.now(); s.mt = s.end; touch(s); letSleep();
  S.edit = null; S.drafts = {}; S.resetAsk = false; S.open = null; S.fbFor = null; S.preSkip = null; S.preOpen = false; S.banner = ''; S.bannerKind = ''; S.combo = 0; S.eqAsk = null; S.tab = nextUp().next;
  /* the level this workout started from: everything counted so far, without its own points */
  const y = tally(s), got = meSync(), P = meNow(), was = (S.reopened && S.reopened[s.id]) || 0, R = { y, from: levelOf(P.T.xp - y.xp + was), to: P.L, got };
  if (S.reopened) delete S.reopened[s.id];
  setView('home', true); renderAll(); S.sumAt = Date.now();
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
  if (S.edDel) return '<span class="confirm"><span>' + say('למחוק את האימון', 'Delete this workout?') + '</span><button class="btn danger" id="edDelYes" type="button">' + say('כן מחק', 'Yes, delete') + '</button><button class="btn" id="edDelNo" type="button">' + say('ביטול', 'Cancel') + '</button></span>';
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
/* the sheet that has just closed slides away: a picture of it, with nothing in it that can be pressed or found, while the page goes on at once */
function sheetGhost(sh) {
  const box = $('.sheet-in', sh); if (!box || reduced || !sh.parentNode) return;
  const g = document.createElement('div'), c = box.cloneNode(true);
  g.className = 'sheet ghost'; g.setAttribute('aria-hidden', 'true'); g.inert = true;
  for (const n of c.querySelectorAll('[id]')) n.removeAttribute('id');
  c.removeAttribute('role'); c.classList.remove('back'); c.style.setProperty('--from', box.style.transform || 'none'); c.style.transform = '';
  g.appendChild(c); sh.parentNode.insertBefore(g, sh); c.scrollTop = box.scrollTop;
  const end = () => g.remove();
  g.addEventListener('animationend', (e) => { if (e.target === c) end(); }); setTimeout(end, 450);
}
function closeSheet() {
  const sh = $('#sheet'); if (sh.hidden) return;
  const kind = S.sheet;
  /* the picker for adding an exercise was opened from the plan: closing it goes back there */
  if (kind === 'swap' && S.pick && S.pick.mode === 'add') { S.pick = null; S.sheet = 'meso'; renderMeso(); return; }
  sheetGhost(sh);
  sh.hidden = true; sh.innerHTML = ''; S.sheet = null; S.edSid = null; S.edDel = false; S.msAsk = null; S.msAdv = false; S.pick = null; S.blEdit = null; S.msPage = null; S.setPg = null; S.del = null;
  if (kind && kind !== 'sum' && kind !== 'list' && kind !== 'lv') renderAll();
}
function editorInput(rowEl) {
  const s = S.sessions[S.edSid]; if (!s || !rowEl) return;
  const exId = rowEl.dataset.ex, i = +rowEl.dataset.i, arr = s.sets[exId] || (s.sets[exId] = []), row = arr[i] || (arr[i] = { kg: null, reps: null, done: false });
  const kg = num($('[data-k="kg"]', rowEl).value), reps = num($('[data-k="reps"]', rowEl).value, true);
  row.kg = capKg(kg); row.reps = capReps(reps); row.done = row.reps != null; row.t = Date.now(); delete row.pr;
  const pe = planEx(exId); if (pe && row.done && isPr(s, exId, moveOf(pe, s), i, row.kg, row.reps)) row.pr = true;
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
  /* what the workout had brought when it was reopened: finishing it again counts only what is added after this */
  (S.reopened || (S.reopened = {}))[s.id] = tally(s).xp;
  if (s.w !== S.tab) leaveWorkout();
  S.tab = s.w; S.touched = true; S.open = null; S.edSid = null; S.edDel = false; S.sheet = null; setView('workout', true);
  const sh = $('#sheet'); sh.hidden = true; sh.innerHTML = '';
  renderAll();
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}
async function exportCsv() {
  if (!S.dl) return;
  const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"', lines = ['date,workout,exercise,set,kg,reps,week,deload,rir,target_kg,target_reps'];
  for (const s of sorted().reverse()) for (const e of exList(s.w, s)) rowsOf(s, e.id).forEach((r, i) => { if (isDone(r)) lines.push([isoDay(new Date(s.ts)), q(PLAN[s.w].name), q(e.name), i + 1, r.kg == null ? '' : r.kg, r.reps == null ? '' : r.reps, s.wk || '', s.dl ? 1 : '', s.rir == null ? '' : s.rir, r.tk == null ? '' : r.tk, r.tr == null ? '' : r.tr].join(',')); });
  try { await S.dl.save({ filename: 'gymi-log.csv', data: '﻿' + lines.join('\r\n') }); } catch (e) { if (e && e.code !== 'declined' && e.code !== 'rate_limited' && e.code !== 'write_failed') { S.dl = null; renderBackup(); } }
}
function onRemoteChange() {
  /* the account was deleted on another device: this one starts over too */
  if (S.wipedNow) { S.wipedNow = false; afterWipe(); return; }
  const a = document.activeElement;
  if (a && a.closest && (a.closest('#dock') || a.closest('#sheet') || a.closest('.note')) && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT')) return;
  sweep(); meSync(); if (!S.touched) S.tab = nextUp().next;
  const draw = () => { maybeOb(); if (S.sheet === 'meso') renderMeso(); else if (S.sheet !== 'ed' && S.sheet !== 'swap' && S.sheet !== 'look' && S.sheet !== 'sum') renderAll(); };
  /* the account speaks another language than the page does: the page changes to it under a fade, the opening too */
  if ((S.cfg.lang || autoLang()) === LANG) draw();
  else if (OB.on) obFade(() => { applyLang(); renderOb(); draw(); });
  else langFade(() => { applyLang(); draw(); });
}

/* ================================================================== wiring */
/* a click that redraws what it is in puts the keyboard back where it was: on the same control in the new drawing, or on the first one
   in its place, so a keyboard or screen-reader user is not sent back to the top of the page */
function holdFocus(box) {
  const keyOf = (a) => (a.id ? '#' + CSS.escape(a.id) : Array.from(a.attributes).filter((x) => /^data-/.test(x.name)).map((x) => '[' + x.name + '="' + CSS.escape(x.value) + '"]').join(''));
  box.addEventListener('click', () => {
    const a = document.activeElement; if (!a || a === box || !box.contains(a)) return;
    const key = keyOf(a);
    /* the redraw may come a moment later (a set is logged after its tap has been shown): watch for it for a second */
    const put = () => {
      const now = document.activeElement;
      if ((now && now !== document.body && document.contains(now)) || box.hidden || !box.getClientRects().length) return;
      const el = (key && box.querySelector(key)) || box.querySelector('#rtSkip,.hit,.btn.primary:not([disabled])') || box.querySelector('button:not([disabled]),[tabindex="0"],input,textarea');
      if (el) try { el.focus({ preventScroll: true }); } catch (e) { /* not focusable here */ }
    };
    const mo = new MutationObserver(put); mo.observe(box, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 1000); setTimeout(put, 0);
  }, true);
}
function wireApp() {
  $('#exIntro').addEventListener('click', (ev) => {
    if (ev.target.closest('#xiGo')) { exIntroOff(); return; }
    /* back from the first exercise: to today's workout, or to the question of time where that step is left out */
    if (ev.target.closest('#xiBack')) { exIntroOff(); preBack(window.__eq === false ? 'time' : 'eq'); }
  });
  for (const id of ['#dock', '#sheet', '#ob']) holdFocus($(id));
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
    if (ev.target.closest('.how')) { openMore(e.id); return; }
    if (ev.target.closest('.swp')) { if (rowsOf(live(S.tab), e.id).some(isDone)) { haptic('warn'); toast('<b>' + say('התרגיל כבר התחיל', 'This exercise is under way') + '</b>'); } else openSwap(e.id); return; }
    const p = ev.target.closest('.setp');
    if (p) {
      /* a done set opens for editing; the others only bring the bar back to the next set */
      S.touched = true; const i = +p.dataset.i, s = live(S.tab), on = isDone(rowsOf(s, e.id)[i]);
      if (rest.on) { clearInterval(rest.iv); rest.on = false; rest.last = null; }
      S.edit = on ? { ex: e.id, i } : null; delete S.drafts[e.id]; S.fbFor = null;
      refreshEx(e); renderDock(); if (on) keepAwake();
    }
  });
  /* a sideways drag on the exercise follows the finger. Let go past a third of the way, or with a flick, and the next exercise
     (or the one before) takes its place; short of that it springs back. Where there is no exercise that way it gives a
     little and no more. Up and down the page moves as a page does */
  let sw = null;
  const openCard = () => $('#exList .ex.open'), toward = (dx) => ((dx > 0) === (document.documentElement.dir !== 'ltr') ? 1 : -1);
  const neighbour = (d) => { const l = exList(S.tab), i = l.findIndex((x) => x.id === S.open); return l[i + d] || null; };
  list.addEventListener('touchstart', (ev) => { const t = ev.touches[0]; sw = ev.touches.length === 1 && !ev.target.closest('textarea,input,.seg') ? { x: t.clientX, y: t.clientY, t: Date.now(), on: false, dx: 0 } : null; }, { passive: true });
  list.addEventListener('touchmove', (ev) => {
    if (!sw) return;
    const t = ev.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
    if (!sw.on) {
      if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { sw = null; return; }
      if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      sw.on = true;
    }
    const el = openCard(); if (!el) return;
    sw.dx = neighbour(toward(dx)) ? dx : dx * 0.22;
    el.style.transition = 'none'; el.style.transform = 'translateX(' + sw.dx.toFixed(1) + 'px)'; el.style.opacity = String(1 - Math.min(0.45, Math.abs(sw.dx) / 520));
  }, { passive: true });
  const endSwipe = () => {
    const g = sw; sw = null; if (!g || !g.on) return;
    const el = openCard(), dx = g.dx, d = toward(dx), far = Math.abs(dx) > Math.min(130, window.innerWidth * 0.3), flick = Math.abs(dx) > 36 && Date.now() - g.t < 240;
    if (el) { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; }
    if ((far || flick) && neighbour(d)) { haptic('step'); stepEx(d); }
    else if (el && !reduced) { el.classList.add('snap'); setTimeout(() => el.classList.remove('snap'), 340); }
  };
  list.addEventListener('touchend', endSwipe, { passive: true }); list.addEventListener('touchcancel', endSwipe, { passive: true });
  const dock = $('#dock');
  /* the page keeps clear of the dock, however tall it gets */
  if (window.ResizeObserver) new ResizeObserver(() => { const h = dock.offsetHeight; if (h && !dock.classList.contains('rest')) { $('#app').style.setProperty('--dock-h', h + 'px'); fitStage(); } }).observe(dock);
  window.addEventListener('resize', fitStage);
  let hold = 0, rep = 0;
  const endHold = () => { clearTimeout(hold); clearInterval(rep); };
  dock.addEventListener('pointerdown', (ev) => {
    const st = ev.target.closest('.step,.rstep'); if (!st) return;
    /* the press is left to go on to the control (an iPhone ticks only then), and the hand feels each step */
    const d = +st.dataset.d, go = st.classList.contains('rstep') ? stepReps : stepKg; go(d); haptic('select'); endHold();
    hold = setTimeout(() => { rep = setInterval(() => { go(d); haptic('step'); }, st.classList.contains('rstep') ? 140 : 90); }, 380);
  });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) dock.addEventListener(t, endHold);
  /* a finger lifted anywhere, or the app put away, ends the repeat: the button under it may have been drawn again meanwhile */
  for (const t of ['pointerup', 'pointercancel']) window.addEventListener(t, endHold);
  window.addEventListener('blur', endHold); document.addEventListener('visibilitychange', endHold);
  dock.addEventListener('click', (ev) => {
    const t = ev.target, id = (t.closest('button,[role="button"]') || {}).id;
    /* the second tap of a double tap lands on the controls that have just appeared in place of the first: on the timer's buttons after
       "Set done", on "Set done" after Continue or Next exercise, on the questions after the last set. It is not meant for them */
    const quick = (t0, ms) => ev.detail !== 0 && Date.now() - (t0 || 0) < (ms || 250);
    /* the rest takes a third of a second to cover the screen: until it has, a tap was aimed at what stood there before */
    if ((rest.on && id && /^rt/.test(id) && quick(rest.start, 340)) || (id === 'dkHit' && quick(S.hitAt)) || ((id === 'dkFinish' || t.closest('[data-fb]')) && quick(S.justDone && S.justDone.t))) return;
    const st = t.closest('.step,.rstep'); if (st) { if (ev.detail === 0) (st.classList.contains('rstep') ? stepReps : stepKg)(+st.dataset.d); return; }
    const fbBtn = t.closest('[data-fb]'); if (fbBtn) { onFb(fbBtn.closest('.fbk').dataset.ex, fbBtn.dataset.fb, +fbBtn.dataset.v); return; }
    const pa = t.closest('[data-painask]'); if (pa) { S.fbPain = pa.dataset.painask; renderDock(); return; }
    const sn = t.closest('[data-swapto]'); if (sn) { const q = sn.dataset.swapto.split(':'); swapNext(q[0], q[1]); return; }
    if (id === 'dkHit') { S.touched = true; logSet(t.closest('#dkHit')); }
    else if (id === 'dkNext') { const n = nextOpen(); if (n) { S.touched = true; openEx(n.id, true, 1); S.hitAt = Date.now(); renderDock(); } }
    else if (id === 'dkReps') typeReps();
    else if (id === 'dkKg') typeKg();
    else if (id === 'dkFinish') finishWorkout();
    else if (id === 'dkWhy') { S.why = !S.why; renderDock(); }
    else if (id === 'rtSkip') { S.hitAt = Date.now(); stopRest(); }
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
  /* the sheet slides up when it opens (not when what is in it is drawn again) */
  new MutationObserver(() => {
    if (sheet.hidden || reduced) return;
    sheet.classList.remove('rise'); void sheet.offsetWidth; sheet.classList.add('rise');
    clearTimeout(sheet.riseT); sheet.riseT = setTimeout(() => sheet.classList.remove('rise'), 380);
  }).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
  /* and a finger can pull it back down from the top: far enough, or fast enough, and it closes; short of that it springs back */
  let pull = null;
  sheet.addEventListener('touchstart', (ev) => {
    const box = ev.target.closest('.sheet-in'), t = ev.touches[0];
    pull = box && ev.touches.length === 1 && box.scrollTop <= 0 && !ev.target.closest('input,textarea,select,.mu-row') ? { box, x: t.clientX, y: t.clientY, t: Date.now(), dy: 0, on: false } : null;
  }, { passive: true });
  sheet.addEventListener('touchmove', (ev) => {
    if (!pull) return;
    const t = ev.touches[0], dy = t.clientY - pull.y, dx = t.clientX - pull.x;
    if (!pull.on) {
      if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
      if (dy <= 0 || Math.abs(dx) > dy || pull.box.scrollTop > 0) { pull = null; return; }
      pull.on = true; pull.box.classList.remove('back'); sheet.classList.remove('rise');
    }
    if (ev.cancelable) ev.preventDefault();
    pull.dy = Math.max(0, dy - 8); pull.box.style.transform = 'translateY(' + pull.dy + 'px)';
  }, { passive: false });
  const letGo = () => {
    const p = pull; pull = null; if (!p || !p.on) return;
    const fast = p.dy / Math.max(1, Date.now() - p.t) > 0.5;
    if (p.box.isConnected && (p.dy > Math.min(140, p.box.offsetHeight * 0.3) || (fast && p.dy > 40))) { closeSheet(); return; }
    p.box.classList.add('back'); p.box.style.transform = ''; setTimeout(() => p.box.classList.remove('back'), 320);
  };
  sheet.addEventListener('touchend', letGo); sheet.addEventListener('touchcancel', letGo);
  sheet.addEventListener('click', (ev) => {
    const id = (ev.target.closest('button') || {}).id;
    /* a double tap on Finish: the second tap lands on the summary that has just opened, which must be seen */
    if (ev.detail !== 0 && Date.now() - (S.sumAt || 0) < 250) return;
    if (id === 'sumBoxBtn') { boxOpenNow(+ev.target.closest('button').dataset.open, false); return; }
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
  /* the tour is not one of them: what it lights is the real control behind it, which has to stay in reach (see tourGuard) */
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
  for (const el of [sheet, ob, tour]) watch.observe(el, { attributes: true, attributeFilter: ['hidden'] });
  sheet.addEventListener('input', (ev) => { const inp = ev.target.closest('.ed-row input'); if (inp) editorInput(inp.closest('.ed-row')); else if (ev.target.id === 'lkName') setName(ev.target.value); else if (ev.target.id === 'wkNameIn') setWkName(+ev.target.dataset.w, ev.target.value); else if (ev.target.id === 'delName' && S.del) { S.del.v = ev.target.value; const b = $('#delYes'); if (b) b.disabled = S.del.busy || !sameWord(S.del.v, delWord()); } });
  sheet.addEventListener('change', (ev) => {
    if (ev.target.id === 'edDate') { editorDate(ev.target.value); return; }
    const inp = ev.target.closest('.ed-row input');
    if (inp) { const rowEl = inp.closest('.ed-row'), s = S.sessions[S.edSid], r = s && rowsOf(s, rowEl.dataset.ex)[+rowEl.dataset.i]; if (r) { $('[data-k="kg"]', rowEl).value = r.kg != null ? fmtKg(r.kg) : ''; $('[data-k="reps"]', rowEl).value = r.reps != null ? r.reps : ''; } return; }
    if (ev.target.classList.contains('note-in')) { const e = S.open && findEx(S.open); if (e) saveNote(e.mv, ev.target.value); return; }
    coachSheetChange(ev); meSheetChange(ev);
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !$('#exIntro').hidden) { exIntroOff(); return; } if (ev.key === 'Escape' && !OB.on) { if (TR.on) tourEnd(); else if (!sheet.hidden) closeSheet(); else closeChat(); } });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onTheme);
  new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) return; if (rest.on) tickRest(); if (live(S.tab)) keepAwake(); });
  /* the phone's back button, when gymi runs inside its native shell: close what is open, else go back to today */
  window.gymiBack = () => {
    if (TR.on) { tourEnd(); return true; }
    if (!sheet.hidden) { if (S.sheet === 'meso' && S.msPage) { S.msPage = null; S.blEdit = null; renderMeso(); } else closeSheet(); return true; }
    if ($('#chat').classList.contains('open') && !matchMedia('(min-width:1000px)').matches) { closeChat(); return true; }
    if (OB.on) { if (OB.step > 0) { obStep(-1); return true; } if (S.cfg.me.ob) { closeOb(); return true; } return false; }
    if (S.view !== 'home') { renderHome(); setView('home'); return true; }
    return false;
  };
  setInterval(() => { if (sweep()) renderAll(); }, 60000);
}
