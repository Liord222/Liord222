/* ================================================================== workout UI */
const valHTML = (r) => Ltr(r.kg != null ? Ltr(fmtKg(r.kg)) + '<small><bdi> ק״ג</bdi></small>' + Ltr(' × ' + (r.reps != null ? r.reps : '–')) : Ltr(r.reps != null ? r.reps : '–') + '<small><bdi> חז׳</bdi></small>');
/* what today's set is trying to beat */
const MODE = { reps: ['יותר חזרות', 'g-reps'], weight: ['יותר משקל', 'g-wt'], hold: ['כמו בפעם הקודמת', ''], base: ['התחלה חדשה', ''], deload: ['שבוע קל', ''], down: ['פחות משקל', 'g-down'], cal: ['משקל מעודכן', 'g-cal'] };
function badge(T, e) {
  if (!T || !MODE[T.mode]) return '';
  const inv = LIB[e.mv].inv, t = inv && T.mode === 'weight' ? 'פחות סיוע' : inv && T.mode === 'down' ? 'יותר סיוע' : MODE[T.mode][0];
  return '<span class="goal ' + MODE[T.mode][1] + '">' + t + '</span>';
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
  S.view = v; $('#app').dataset.view = v;
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
const bannerHTML = () => (S.banner ? '<div class="banner ' + (S.bannerKind || '') + '"><p>' + S.banner + '</p><button type="button" class="banner-x" aria-label="סגור">' + ICON.x + '</button></div>' : '');
/* today: the player, the workout that is next (or running), and the week as a path of four stops */
function renderHome() {
  const nu = nextUp(), w = nu.live >= 0 ? nu.live : nu.next, s = live(w), list = exList(w, s), P = phase(w, s), M = S.cfg.meso;
  const total = list.reduce((n, e) => n + e.sets, 0), dn = s ? list.reduce((n, e) => n + doneCount(s, e), 0) : 0;
  const ended = (i) => mesoSessions(M.id).filter((x) => x.w === i && x.end).length, over = mesoDone(M), base = ended(nu.next);
  const SAY = { live: 'באמצע', next: 'הבא', done: 'הושלם', todo: 'עוד לא' };
  const week = PLAN.map((x, i) => {
    const st = live(i) ? 'live' : i === nu.next ? 'next' : !over && ended(i) > base ? 'done' : 'todo';
    return '<button class="tab ' + st + '" type="button" data-tab="' + i + '" aria-label="' + wkFull(i) + ', ' + SAY[st] + '"' + (i === w ? ' aria-current="true"' : '') + '><span class="dot" aria-hidden="true">' + (st === 'done' ? ICON.check : i + 1) + '</span><b>' + x.t.replace('גוף ', '') + '</b></button>';
  }).join('');
  $('#home').innerHTML = playerHTML(meNow()) + bannerHTML() +
    '<section class="card next" aria-label="' + (s ? 'האימון שבאמצע' : 'האימון הבא') + '"><div class="next-top"><p class="k">' + wkOrd(w) + '</p><span class="xp-tag" title="נקודות על אימון מלא">' + Ltr('+' + xpPlan(list)) + '</span></div><h2>' + PLAN[w].t + '</h2>' +
    '<p class="meta">' + (s ? dn + ' מתוך ' + total + ' סטים' : list.length + ' תרגילים · ' + minsOf(list) + ' דק׳') + '</p>' +
    '<button class="btn primary big" id="homeGo" type="button" data-w="' + w + '">' + (s ? 'המשך אימון' : 'התחל אימון') + '</button></section>' +
    '<section class="card week" aria-label="האימונים של השבוע"><div class="card-h"><h2>' + (!P.m ? 'השבוע' : P.dl ? 'שבוע קל' : 'שבוע ' + P.wk + ' <small>מתוך ' + S.cfg.weeks + '</small>') + '</h2>' + (!P.dl && volWarn() ? '<em class="warn-pill">לבדוק סטים</em>' : '') + '<button class="go-link" id="planBtn" type="button" aria-label="התוכנית והסבב">התוכנית' + ICON.fwd + '</button></div><div class="week-row" id="tabs">' + week + '</div></section>';
}
function renderTabs() { renderHome(); }
const totals = () => { const s = live(S.tab), l = exList(S.tab, s); return { total: l.reduce((n, e) => n + e.sets, 0), dn: l.reduce((n, e) => n + doneCount(s, e), 0) }; };
/* one segment per exercise, filled by the sets done in it */
function updateProgress() {
  const s = live(S.tab), list = exList(S.tab, s), cur = shown(), i = cur ? list.findIndex((x) => x.id === cur.id) : -1;
  $('#wkBar').innerHTML = '<div class="segs" role="img" aria-label="' + say('תרגיל ', 'Exercise ') + (i + 1) + say(' מתוך ', ' of ') + list.length + '">' +
    list.map((e, k) => { const n = e.sets || 1, d = e.sets ? Math.min(doneCount(s, e), n) : 0; return '<i class="' + (k === i ? 'cur' : '') + (e.cut && !e.sets ? ' off' : '') + '"><b style="width:' + Math.round((d / n) * 100) + '%"></b></i>'; }).join('') + '</div>';
}
function tickElapsed() {
  const el = $('#elapsed'), s = live(S.tab);
  if (el && s) el.innerHTML = '<b>' + Ltr(mmss(Math.max(0, (Date.now() - s.ts) / 1000))) + '</b>';
}
/* the top of a workout: its name, the clock once it runs, and the progress strip */
function renderHero() {
  const s = live(S.tab);
  $('#wkTitle').innerHTML = '<b>' + wkName(S.tab) + '</b><span class="clock">' + (s ? ICON.clock + '<span id="elapsed"></span>' : wkOrd(S.tab)) + '</span>';
  $('#hero').innerHTML = bannerHTML();
  tickElapsed(); updateProgress();
}
const pipsHTML = (e, dn) => { let p = ''; for (let k = 0; k < e.sets; k++) p += '<i' + (k < dn ? ' class="on"' : '') + '></i>'; return p; };
const tagsOf = (e) => { const off = e.cut && e.sets === 0; return (e.cut ? '<span class="tagx warn">' + (off ? say('בוטל היום', 'Off today') : say('קוצר היום', 'Cut short today')) + '</span>' : '') + (lowPump(e.mv) ? '<span class="tagx hint">' + say('שווה להחליף', 'Worth swapping') + '</span>' : '') + (e.swapped ? '<span class="tagx">' + say('חלופה', 'Swapped') + '</span>' : ''); };
function rowHTML(e, i, s) {
  const dn = doneCount(s, e), off = e.cut && e.sets === 0, full = !off && dn >= e.sets, tags = tagsOf(e);
  return '<li class="ex' + (full ? ' done' : '') + (off ? ' off' : '') + '" data-id="' + e.id + '">' +
    '<button class="ex-head" type="button">' +
    '<span class="ex-n">' + (off ? '–' : full ? ICON.check : i + 1) + '</span><canvas class="ex-thumb" data-anim="' + e.a + '" aria-hidden="true"></canvas>' +
    '<span class="ex-title"><span class="ex-name">' + e.nm + '</span>' + (tags ? '<span class="tags">' + tags + '</span>' : '') + '</span>' +
    '<span class="ex-side"><span class="ex-rx">' + Ltr((off ? e.n0 : e.sets) + ' × ' + e.reps) + '</span><span class="pips" aria-hidden="true">' + pipsHTML(e, dn) + '</span></span>' +
    '</button></li>';
}
/* a set in short: weight × reps, or the reps alone with their unit when there is no weight */
const setVal = (r) => Ltr(fmtRow(r)) + (r.kg == null ? '<small> ' + say('חז׳', 'reps') + '</small>' : '');
/* the sets of the exercise on screen, one chip each: done ones show what was lifted, the rest show the target */
function setsHTML(e) {
  const s = live(S.tab), r = rowsOf(s, e.id), cur = cursor(), rir = rirOf(e, s), fu = firstUndone(s, e), T0 = fu >= 0 ? targetOf(e, fu, s) : null;
  let h = '';
  for (let i = 0; i < e.sets; i++) {
    const row = r[i], on = isDone(row), isCur = !!cur && cur.e.id === e.id && cur.i === i, T = on ? null : i === fu ? T0 : targetOf(e, i, s), ed = on && !!S.edit && S.edit.ex === e.id && S.edit.i === i;
    const fail = rir === 0 && i === e.sets - 1 && !on ? '<em>' + say('עד כשל', 'To failure') + '</em>' : '';
    h += '<button class="setp' + (on ? ' done' : isCur ? ' cur' : '') + (ed ? ' cur' : '') + '" type="button" data-i="' + i + '"' + (on ? ' aria-label="' + say('סט ', 'Set ') + (i + 1) + ': ' + fmtRow(row) + say(', עריכה', ', edit') + '"' : '') + '><span class="n">' + say('סט ', 'Set ') + (i + 1) + (on && row.pr ? '<span class="pr">' + say('שיא', 'PR') + '</span>' : '') + '<span class="st">' + ICON.check + '</span></span>' +
      (on ? '<span class="v">' + setVal(row) + '</span>' : '<span class="hint">' + (T ? '<span class="tg">' + setVal(T) + '</span>' : fail ? '' : '–') + fail + '</span>') + '</button>';
  }
  if (e.cut) h += '<p class="cut-note">' + (e.sets ? say('שאר הסטים בוטלו היום בגלל כאב.', 'The remaining sets are off today because of pain.') : say('בוטל היום בגלל כאב.', 'Off today because of pain.')) + '</p>';
  if (T0 && e.sets - fu > 1) h += '<button class="btn same" type="button">' + say('רשום הכול לפי היעד', 'Log all at target') + '</button>';
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
/* three one-tap answers about the exercise that was just finished */
const FB = [
  { k: 'pain', q: 'כאב', o: ['בלי', 'קל', 'חזק'] },
  { k: 'pump', q: 'תחושה בשריר', o: ['חלשה', 'בינונית', 'חזקה'] },
  { k: 'load', q: 'עומס', o: ['קל מדי', 'מתאים', 'כבד מדי'] },
];
function fbHTML(e, s) {
  const f = (s && s.fb && s.fb[e.id]) || {};
  return '<div class="fbk" data-ex="' + e.id + '">' + FB.map((q) => '<div class="fb-row"><span>' + q.q + '</span><div class="seg" role="group" aria-label="' + q.q + '">' +
    q.o.map((t, v) => '<button type="button" data-fb="' + q.k + '" data-v="' + v + '" aria-pressed="' + (f[q.k] === v) + '">' + t + '</button>').join('') + '</div></div>').join('') + '</div>';
}
/* after a severe pain report: what was cancelled, and a movement of the same pattern to move to */
function painNote(e, s) {
  const f = s && s.fb && s.fb[e.id]; if (!f || f.pain !== 2) return '';
  const alt = gentleAlt(e), set = alt && S.cfg.swap[e.id] === alt;
  return '<p class="fb-warn"><b>שאר הסטים ל' + MUSCLE[LIB[e.mv].p].he + ' בוטלו להיום.</b> ' +
    (!alt ? '' : set ? 'מהאימון הבא: ' + LIB[alt].he + '. ' : (LIB[alt].jf ? 'נוח יותר למפרקים: ' : 'חלופה: ') + LIB[alt].he + '. <button class="link" type="button" data-swapto="' + e.id + ':' + alt + '">להחליף מהאימון הבא</button> ') + 'אם הכאב נמשך, כדאי להיבדק.</p>';
}
/* the feedback card inside the exercise; hidden while the dock is asking the same questions */
/* shown once the exercise is finished (or once something was answered), so the answers can be changed later */
const fbWrap = (e, s) => (s && S.fbFor !== e.id && rowsOf(s, e.id).some(isDone) && (firstUndone(s, e) < 0 || (s.fb && s.fb[e.id])) ? '<span class="rx-k">' + say('איך היה?', 'How was it?') + '</span>' + fbHTML(e, s) + painNote(e, s) : '');
/* the three panes under the sets: how to do it, the lifter's own note, and what happened before */
const FXT = () => [['cues', say('דגשים', 'How')], ['note', say('הערה שלי', 'My note')], ['hist', say('היסטוריה', 'History')]];
function paneHTML(e) {
  const k = S.fxTab || 'cues', info = LIB[e.mv], s = live(S.tab);
  if (k === 'note') return '<label class="note"><span>' + ICON.pin + say('הערה שנשארת עם התרגיל', 'A note that stays with this exercise') + '</span><textarea class="note-in" rows="3" maxlength="200" placeholder="' + say('גובה מושב, קצב, דגש', 'Seat height, tempo, a cue') + '">' + esc(S.cfg.notes[e.mv] || '') + '</textarea></label>';
  if (k === 'hist') { const ref = refRow(e, 0, s), tr = trendHTML(e); return (ref && !ref.other ? '<p class="prev-line">' + say('פעם קודמת', 'Last time') + ' (' + ago(ref.ts) + '): ' + rowsOf(S.sessions[ref.sid], e.id).filter(isDone).map((x) => Ltr(fmtRow(x))).join(' · ') + '</p>' : '') + tr || '<p class="empty-note">' + say('עוד אין היסטוריה לתרגיל הזה.', 'No history for this exercise yet.') + '</p>'; }
  return '<ul class="cues">' + info.c.map((c) => '<li>' + c + '</li>').join('') + '</ul>' + (LANG === 'he' ? '<p class="en-name">' + Ltr(esc(e.name)) + '</p>' : '');
}
function bodyHTML(e) {
  const s = live(S.tab), info = LIB[e.mv], view = { side: say('מהצד', 'Side view'), back: say('מאחור', 'From behind'), top: say('מלמעלה', 'From above') }[ANIM[e.a].view], rir = rirOf(e, s), fw = fbWrap(e, s), tab = S.fxTab || 'cues';
  const lvl = rir == null ? e.lvl : rir >= 4 ? 0 : rir >= 2 ? 1 : rir === 1 ? 2 : 3;
  return '<div class="ex-a"><div class="stage-wrap"><canvas class="stage" role="img" aria-label="' + say('הדמיה של ', 'Demo of ') + e.nm + '"></canvas>' +
    '<span class="stage-tag">' + view + (e.a !== e.mv ? say(' · תנועה דומה', ' · similar movement') : '') + '</span><span class="stage-phase"></span>' +
    '<div class="stage-ctl"><button class="stage-speed" type="button" aria-pressed="' + (player.speed < 1) + '" aria-label="' + say('הילוך איטי', 'Slow motion') + '">' + Ltr('½×') + '</button><button class="stage-play" type="button"></button></div>' +
    '<div class="tempo" aria-hidden="true"><i></i></div></div>' +
    '<p class="muscles"><i></i><span>' + info.m + '</span></p></div>' +
    '<div class="ex-b"><div class="rx-chips"><span class="chipx ex-rx">' + Ltr(e.n0 + ' × ' + e.reps) + (e.suf ? ' <small>' + e.suf + '</small>' : '') + '</span><span class="chipx">' + say('מנוחה ', 'Rest ') + restText(e) + '</span><span class="chip l' + lvl + '">' + (rir == null ? e.int : rirText(rir)) + '</span></div>' +
    (lowPump(e.mv) ? '<p class="flag-line">' + ICON.swap + '<span>' + say('פעמיים כמעט לא הרגשת את השריר. שווה להחליף.', 'Twice in a row you barely felt the muscle. Worth swapping.') + '</span></p>' : '') +
    '<div class="sets">' + setsHTML(e) + '</div><div class="fb-wrap"' + (fw ? '' : ' hidden') + '>' + fw + '</div>' +
    '<div class="seg fx-tabs" role="tablist">' + FXT().map((t) => '<button type="button" role="tab" data-fx="' + t[0] + '" aria-selected="' + (t[0] === tab) + '" aria-pressed="' + (t[0] === tab) + '">' + t[1] + (t[0] === 'note' && S.cfg.notes[e.mv] ? '<i class="dot" aria-hidden="true"></i>' : '') + '</button>').join('') + '</div>' +
    '<div class="fx-pane" id="fxPane" role="tabpanel">' + paneHTML(e) + '</div>' +
    '<div class="ex-acts"><button class="btn swap" type="button">' + ICON.swap + say('החלף תרגיל', 'Swap exercise') + '</button><button class="btn ask" type="button">' + ICON.chat + say('שאל את אילון', 'Ask Eilon') + '</button></div></div>';
}
/* the exercise on screen */
function focusHTML(e, i, n) {
  const off = e.cut && e.sets === 0, full = !off && doneCount(live(S.tab), e) >= e.sets, tags = tagsOf(e);
  return '<li class="ex open' + (full ? ' done' : '') + (off ? ' off' : '') + '" data-id="' + e.id + '">' +
    '<div class="fx-head"><button class="fx-nav" id="exPrev" type="button" aria-label="' + say('התרגיל הקודם', 'Previous exercise') + '"' + (i > 0 ? '' : ' disabled') + '>' + ICON.back + '</button>' +
    '<div class="fx-t"><span class="fx-k">' + say('תרגיל ', 'Exercise ') + (i + 1) + say(' מתוך ', ' of ') + n + '</span><h1 class="ex-name">' + e.nm + '</h1>' + (tags ? '<span class="tags">' + tags + '</span>' : '') + '</div>' +
    '<button class="fx-nav" id="exNext" type="button" aria-label="' + say('התרגיל הבא', 'Next exercise') + '"' + (i < n - 1 ? '' : ' disabled') + '>' + ICON.fwd + '</button></div>' +
    '<div class="ex-body" id="body-' + e.id + '">' + bodyHTML(e) + '</div></li>';
}
function renderHistory() {
  const all = sorted().filter((x) => hasDone(x) && x.end), list = all.slice(0, S.histN || 6), df = new Intl.DateTimeFormat('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });
  renderGains(); renderBackup();
  /* each finished workout is one row; a tap opens it for fixing, moving to another day or deleting */
  $('#history').innerHTML = '<h2 class="sec">אימונים אחרונים</h2>' + (list.length ? '<ul class="rows">' + list.map((x) => { const mn = Math.max(1, Math.round((x.end - x.ts) / 60000)); return '<li class="tap"><button class="row-b" type="button" data-edit="' + x.id + '" aria-label="' + wkFull(x.w) + ', עריכה"><span class="h-t">' + PLAN[x.w].t + '</span><span class="h-s">' + df.format(new Date(x.ts)) + ' · ' + setsDone(x) + ' סטים' + (mn < 300 ? ' · ' + mn + ' דק׳' : '') + '</span><span class="xp-tag">' + Ltr('+' + tally(x).xp) + '</span>' + ICON.fwd + '</button></li>'; }).join('') + '</ul>' + (all.length > list.length ? '<button class="link" id="histMore" type="button">עוד אימונים</button>' : '')
    : '<p class="empty-note">האימונים שתסיים יופיעו כאן.</p>');
}
/* one file with every workout and the settings: saved from here, or read back in */
function renderBackup() {
  $('#backup').innerHTML = '<h2 class="sec">גיבוי</h2><div class="backup-act">' +
    (S.dl ? '<button class="btn" id="backupBtn" type="button">שמירה לקובץ</button>' : '') + '<button class="btn" id="restoreBtn" type="button">שחזור מקובץ</button>' + (S.dl && sorted().some((x) => hasDone(x) && x.end) ? '<button class="btn" id="exportBtn" type="button">ייצוא CSV</button>' : '') + '</div>' +
    (S.backupNote ? '<p class="backup-note" role="status">' + S.backupNote + '</p>' : '<p class="empty-note">הקובץ מעביר את הכול בין Claude לאפליקציה בטלפון.</p>');
}
async function exportBackup() {
  if (!S.dl) return;
  try { await S.dl.save({ filename: 'gymi-backup-' + isoDay(new Date()) + '.json', data: backupData() }); S.backupNote = 'הגיבוי נשמר.'; }
  catch (e) { if (e && e.code !== 'declined' && e.code !== 'rate_limited') S.backupNote = 'השמירה נכשלה.'; }
  renderBackup();
}
function importBackup(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    const r = restoreData(String(rd.result || ''));
    S.backupNote = !r ? 'זה לא קובץ גיבוי של gymi.' : r.n || r.cfg ? (r.n ? (r.n === 1 ? 'אימון אחד שוחזר.' : r.n + ' אימונים שוחזרו.') : 'ההגדרות שוחזרו.') : 'אין בקובץ שום דבר חדש.';
    if (r) { sweep(); meSync(); if (!S.touched) S.tab = nextUp().next; S.open = null; }
    renderAll();
  };
  rd.onerror = () => { S.backupNote = 'הקובץ לא נקרא.'; renderBackup(); };
  rd.readAsText(file);
}
/* progress: how the best set of each movement moved since the mesocycle began */
function renderGains() {
  const M = S.cfg.meso, R = mesoSummary(M.id), sign = (p) => Ltr((p >= 0 ? '+' : '−') + Math.abs(p).toFixed(1) + '%');
  $('#progCap').textContent = 'סבב ' + M.n + (R.n ? ' · ' + R.n + (R.n === 1 ? ' אימון' : ' אימונים') : '');
  $('#gains').innerHTML = '<h2 class="sec">הכוח שלך</h2>' + (R.gains.length ? '<ul class="rows">' + R.gains.slice(0, 5).map((g) => '<li><span class="g-t">' + LIB[g.mv].he + '</span><span class="g-s">' + Ltr(fmtRow(g.first)) + ' ← ' + Ltr(fmtRow(g.best)) + '</span><span class="g-d ' + (g.pct > 0.4 ? 'up' : g.pct < -0.4 ? 'dn' : '') + '">' + sign(g.pct) + '</span></li>').join('') + '</ul>'
    : '<p class="empty-note">אחרי שני אימונים של אותו תרגיל יופיע כאן השינוי.</p>') + (R.n ? '<button class="btn" type="button" data-sum="' + M.id + '">סיכום הסבב</button>' : '');
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
  updateProgress(); markCur();
}
function renderAll() { renderMe(); renderHome(); renderHero(); renderPre(); renderList(); renderHistory(); renderDock(); if (S.sheet === 'list') renderListSheet(); }
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
  S.touched = true; S.draft = null; S.edit = null; openEx(n.id, true, d); renderDock();
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
    $('.sets', li).innerHTML = setsHTML(e);
    const fw = $('.fb-wrap', li), h = fbWrap(e, s); fw.innerHTML = h; fw.hidden = !h;
    if ((S.fxTab || 'cues') === 'hist') $('#fxPane').innerHTML = paneHTML(e);
  }
  markCur(); updateProgress();
}
/* ---- every exercise of this workout in one list: jump to one, see the week, finish or clear the workout ---- */
function renderListSheet() {
  const sh = $('#sheet'), old = $('.sheet-in', sh), top = old ? old.scrollTop : 0, s = live(S.tab), list = exList(S.tab, s), t = totals(), P = phase(S.tab, s);
  sh.innerHTML = '<div class="sheet-in ls" role="dialog" aria-modal="true" aria-label="' + say('כל התרגילים', 'All exercises') + '"><div class="ed-h"><div><p class="kicker">' + wkOrd(S.tab) + ' · ' + t.dn + '/' + t.total + say(' סטים', ' sets') + '</p><h2>' + wkName(S.tab) + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    (P.m ? '<button class="meso' + (P.dl ? ' dl' : '') + '" id="mesoBtn" type="button" aria-label="' + say('התוכנית והסבב', 'The plan and the round') + '"><span>' + (P.dl ? say('שבוע קל', 'Easy week') : say('שבוע ' + P.wk + ' מתוך ' + S.cfg.weeks, 'Week ' + P.wk + ' of ' + S.cfg.weeks)) + '</span><b>' + rirText(P.rir) + '</b>' + ICON.fwd + '</button>' : '') +
    '<ol class="ex-list" id="allList">' + list.map((e, i) => rowHTML(e, i, s)).join('') + '</ol>' +
    ((!s || !hasDone(s)) && !P.dl && preMuscles(S.tab).length ? '<button class="link" id="preAgain" type="button">' + say('שאלת ההתאוששות', 'Recovery check') + '</button>' : '') +
    (s ? '<div class="ls-act"><button class="btn big" id="finishBtn" type="button"' + (hasDone(s) ? '' : ' disabled') + '>' + say('סיים אימון', 'Finish workout') + '</button>' +
      (S.resetAsk ? '<span class="confirm"><span>' + say('למחוק את הרישום של האימון?', 'Clear what was logged in this workout?') + '</span><button class="btn danger" id="resetYes" type="button">' + say('כן, נקה', 'Yes, clear') + '</button><button class="btn" id="resetNo" type="button">' + say('ביטול', 'Cancel') + '</button></span>' : '<button class="link" id="resetBtn" type="button">' + say('נקה רישום', 'Clear the log') + '</button>') + '</div>' : '') + '</div>';
  $('.sheet-in', sh).scrollTop = top; drawThumbs(); markCur();
}
function openList() { S.sheet = 'list'; S.resetAsk = false; renderListSheet(); $('#sheet').hidden = false; }
/* clicks inside that list; returns true when the click was handled */
function listSheetClick(ev, id) {
  if (S.sheet !== 'list') return false;
  const li = ev.target.closest('#allList .ex');
  if (li) { const d = li.dataset.id; S.touched = true; S.draft = null; S.edit = null; closeSheet(); openEx(d, true); renderDock(); return true; }
  if (id === 'mesoBtn') { openMeso(); return true; }
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
const rest = { on: false, start: 0, min: 0, max: 0, iv: 0, minHit: false, ended: 0, label: '', last: null };
let actx = null, wake = null, logBusy = false;
function primeAudio() { try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { actx = null; } }
function beep(n) {
  if (!S.sound || !actx) return;
  try {
    for (let i = 0; i < n; i++) {
      const o = actx.createOscillator(), gn = actx.createGain(), t = actx.currentTime + i * 0.3;
      o.type = 'sine'; o.frequency.value = n === 1 ? 660 : 880;
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.28, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      o.connect(gn); gn.connect(actx.destination); o.start(t); o.stop(t + 0.26);
    }
  } catch (e) { /* no audio here */ }
}
function buzz(p) { if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* unsupported */ } } }
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
const repsHTML = (r) => '<b>' + (r == null ? '—' : r) + '</b><small>חזרות</small>';
const kgHTML = (kg) => (kg == null ? '<b>—</b><small>בלי משקל</small>' : '<b>' + fmtKg(kg) + '</b><small>ק״ג</small>');
const xpChip = (n) => '<span class="xp-tag">' + Ltr('+' + n) + '</span>';
/* weight and reps, each with its own stepper. A target is shown a shade lighter until it is confirmed or changed; a tap on a number opens typing */
function numsHTML(kg, reps, ghostKg, ghostReps) {
  return '<div class="dk-nums"><div class="num" role="group" aria-label="משקל"><button class="step" type="button" data-d="-1" aria-label="הפחת משקל">−</button>' +
    '<div class="dk-kg' + (ghostKg ? ' ghost' : '') + '" id="dkKg" role="button" tabindex="0" aria-label="משקל, לחיצה להקלדה">' + kgHTML(kg) + '</div>' +
    '<button class="step" type="button" data-d="1" aria-label="הוסף משקל">+</button></div>' +
    '<div class="num" role="group" aria-label="חזרות"><button class="rstep" type="button" data-d="-1" aria-label="הפחת חזרה">−</button>' +
    '<div class="dk-reps' + (ghostReps ? ' ghost' : '') + '" id="dkReps" role="button" tabindex="0" aria-label="חזרות, לחיצה להקלדה">' + repsHTML(reps) + '</div>' +
    '<button class="rstep" type="button" data-d="1" aria-label="הוסף חזרה">+</button></div></div>';
}
function fbPanel(s) {
  const e = S.fbFor && s ? exList(S.tab, s).find((x) => x.id === S.fbFor) : null;
  if (!e) { S.fbFor = null; return ''; }
  return '<div class="fb-dock"><div class="fb-h"><b>' + say('איך היה: ', 'How was it: ') + e.nm + '</b><button class="link" id="fbSkip" type="button">' + (s.fb && s.fb[e.id] && s.fb[e.id].pain === 2 ? 'סגור' : 'דלג') + '</button></div>' + fbHTML(e, s) + painNote(e, s) + '</div>';
}
function closeFb() { const id = S.fbFor; S.fbFor = null; renderDock(); if (id && S.open === id) refreshEx({ id }); }
/* "swap from the next workout", offered next to a pain report */
function swapNext(exId, mv) { swapTo(exId, mv, true); renderDock(); if (S.open) refreshEx({ id: S.open }); }
function renderDock() {
  const dock = $('#dock'), s = live(S.tab), fbp = fbPanel(s), done = say('כל הסטים בוצעו', 'Every set is done'), fin = '<button class="btn primary" id="dkFinish" type="button">' + say('סיים אימון', 'Finish workout') + xpChip(XP.done) + '</button>';
  let cls = 'dock', h;
  if (rest.on) {
    const L = rest.last; cls += ' rest';
    h = '<div class="rt"><div class="rt-time" id="rtTime">0:00</div><div class="rt-mid"><div class="rt-state" id="rtState"></div><div class="rt-track"><i id="rtFill"></i></div>' +
      (L ? '<div class="rt-log"><span>' + say('נרשם ', 'Logged ') + Ltr(fmtRow(L)) + '</span>' + xpChip(XP.set + (L.pr ? XP.pr : 0)) + (L.pr ? '<span class="pr">' + say('שיא', 'PR') + '</span>' : '') + '<button class="link" id="rtUndo" type="button">' + say('בטל', 'Undo') + '</button></div>' : '') + '</div></div>' +
      '<div class="rt-btns"><button type="button" id="rtMinus" aria-label="' + say('הפחת 15 שניות', '15 seconds less') + '">' + Ltr('−15') + '</button><button type="button" id="rtPlus" aria-label="' + say('הוסף 15 שניות', '15 seconds more') + '">' + Ltr('+15') + '</button>' +
      '<button type="button" id="rtSound" aria-label="' + (S.sound ? say('השתק צליל', 'Mute the sound') : say('הפעל צליל', 'Turn the sound on')) + '">' + (S.sound ? ICON.snd : ICON.mute) + '</button><button type="button" id="rtSkip" class="go">' + say('המשך', 'Continue') + '</button></div>' + fbp;
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
      const e = cur.e, i = cur.i, T = targetOf(e, i, s), d = S.draft && S.draft.ex === e.id && S.draft.i === i ? S.draft : null, note = S.cfg.notes[e.mv];
      if (S.mini) cls += ' mini';
      h = '<div class="dk-top"><span class="dk-set">' + say('סט ', 'Set ') + '<b>' + (i + 1) + '</b>' + say(' מתוך ', ' of ') + e.sets + (T ? say(' · יעד ', ' · target ') + Ltr(fmtRow(T)) : e.suf ? ' · ' + e.reps + ' ' + e.suf : '') + (T ? badge(T, e) : '') + '</span>' +
        '<button class="dk-ic" id="dkMini" type="button" aria-label="' + (S.mini ? say('הרחב את הסרגל', 'Expand the bar') : say('מזער את הסרגל', 'Shrink the bar')) + '">' + (S.mini ? ICON.up : ICON.down) + '</button></div>' +
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
  kg = kg == null || !(kg > 0) ? null : Math.round(kg * 100) / 100;
  if (t.edit) { const s = live(S.tab), row = rowsOf(s, t.e.id)[t.i]; if (!row) return; row.kg = kg; row.t = Date.now(); delete row.pr; touch(s); refreshEx(t.e); renderMe(); }
  else draftOf(t).kg = kg;
  const box = $('#dkKg'); if (box) { box.classList.remove('ghost'); if (!$('input', box)) box.innerHTML = kgHTML(kg); }
}
function stepKg(d) {
  const t = dockTarget(); if (!t) return;
  const s = live(S.tab), cur = t.edit ? (rowsOf(s, t.e.id)[t.i] || {}).kg : curKg(t.e, t.i, s);
  setKg((cur == null ? 0 : cur) + d * incOf(t.e.mv));
}
function setReps(r) {
  const t = dockTarget(); if (!t || r == null || !(r >= 1)) return;
  r = Math.min(200, Math.round(r));
  if (t.edit) { const s = live(S.tab), row = rowsOf(s, t.e.id)[t.i]; if (!row) return; row.reps = r; row.t = Date.now(); delete row.pr; touch(s); refreshEx(t.e); renderMe(); }
  else draftOf(t).reps = r;
  const box = $('#dkReps'); if (box) { box.classList.remove('ghost'); if (!$('input', box)) box.innerHTML = repsHTML(r); }
}
function stepReps(d) {
  const t = dockTarget(); if (!t) return;
  const s = live(S.tab), cur = t.edit ? (rowsOf(s, t.e.id)[t.i] || {}).reps : curReps(t.e, t.i, s);
  setReps(Math.max(1, (cur || 0) + d));
}
/* a tap on a number turns it into a field; leaving the field or Enter keeps the value */
function typeIn(box, id, label, mode, val, done) {
  if (!box || $('input', box)) return;
  box.innerHTML = '<input id="' + id + '" type="text" inputmode="' + mode + '" autocomplete="off" aria-label="' + label + '" value="' + val + '">';
  const inp = $('#' + id); inp.focus(); inp.select();
  inp.addEventListener('blur', () => { const v = inp.value; box.innerHTML = ''; done(v); }, { once: true });
  inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); inp.blur(); } });
}
function typeKg() {
  const t = dockTarget(); if (!t) return;
  const s = live(S.tab), cur = t.edit ? (rowsOf(s, t.e.id)[t.i] || {}).kg : curKg(t.e, t.i, s);
  typeIn($('#dkKg'), 'dkKgIn', 'משקל בק״ג', 'decimal', cur == null ? '' : fmtKg(cur), (v) => setKg(num(v)));
}
function typeReps() {
  const t = dockTarget(); if (!t) return;
  const s = live(S.tab), cur = t.edit ? (rowsOf(s, t.e.id)[t.i] || {}).reps : curReps(t.e, t.i, s);
  typeIn($('#dkReps'), 'dkRepsIn', 'מספר החזרות', 'numeric', cur == null ? '' : cur, (v) => { const r = num(v, true), box = $('#dkReps'); if (r != null && r >= 1) setReps(r); else if (box) box.innerHTML = repsHTML(cur); });
}
/* the one tap: log the set as it stands in the dock */
function logSet(el) {
  const t = dockTarget(); if (!t || t.edit || logBusy) return;
  const s = ensure(S.tab), kg = curKg(t.e, t.i, s), r = curReps(t.e, t.i, s);
  if (r == null || r < 1 || r > 200) return;
  logBusy = true; if (el) el.classList.add('hit-on'); buzz(14); primeAudio(); keepAwake();
  setTimeout(() => { logBusy = false; commitSet(t.e, t.i, kg, r); }, el && !reduced ? 180 : 0);
}
function writeRow(e, i, kg, reps) {
  const s = ensure(wkOf(e.id)), L = LIB[e.mv], T = targetOf(e, i, s), before = bestFor(e.mv, { notS: s.id }), today = bestFor(e.mv, { onlyS: s.id, skipEx: e.id, skipI: i }), arr = s.sets[e.id] || (s.sets[e.id] = []);
  const v = kg != null && kg > 0 ? score(L, kg, reps) : 0, pr = !s.dl && !!(before && v > before.v + 0.01 && (!today || v > today.v + 0.01));
  arr[i] = { kg: kg == null ? null : kg, reps, done: true, t: Date.now() }; if (pr) arr[i].pr = true;
  if (T) { arr[i].tk = T.kg == null ? null : T.kg; arr[i].tr = T.reps; }
  touch(s); return pr;
}
/* the exercise is finished: ask how it went. "No pain" is preselected, pump and workload take one tap each */
function askFb(e, s) {
  const fb = s.fb || (s.fb = {});
  if (fb[e.id] && fb[e.id].pump != null && fb[e.id].load != null) return;
  if (!fb[e.id]) { fb[e.id] = { pain: 0, pump: null, load: null }; s.ft = Date.now(); touch(s); }
  S.fbFor = e.id;
}
function commitSet(e, i, kg, reps) {
  const lv0 = S.lvl, pr = writeRow(e, i, kg, reps), s = live(S.tab), list = exList(S.tab, s), left = (x) => firstUndone(s, x) >= 0;
  e = list.find((x) => x.id === e.id);
  S.draft = null; refreshEx(e); renderTabs(); renderHistory(); renderPre();
  renderMe(); bump(lv0);
  if (!$('#elapsed')) renderHero(), updateProgress();
  if (!left(e)) askFb(e, s);
  if (!list.some(left)) { stopRest(); return; }
  let nxt = e, label;
  if (left(e)) {
    const ni = firstUndone(s, e), T = targetOf(e, ni, s), inv = LIB[e.mv].inv;
    label = say('סט ', 'Set ') + (ni + 1) + say(' מתוך ', ' of ') + e.sets + (T && T.mode === 'down' ? ' · ' + (inv ? say('מוסיפים סיוע: ', 'More help: ') : say('מורידים ל-', 'Down to ')) + fmtKg(T.kg) + say(' ק״ג', ' kg') : T && T.mode === 'cal' ? ' · ' + (inv ? say('פחות סיוע: ', 'Less help: ') : say('מעלים ל-', 'Up to ')) + fmtKg(T.kg) + say(' ק״ג', ' kg') : '');
  } else { nxt = list.slice(list.indexOf(e) + 1).find(left) || list.find(left); label = nxt.nm; }
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
  if (!$('#elapsed')) renderHero(), updateProgress();
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
  if (left <= 0 && !rest.ended) { rest.ended = Date.now(); beep(2); buzz([180, 90, 180]); }
  d.classList.toggle('ready', rest.minHit && !rest.ended); d.classList.toggle('go', !!rest.ended);
  $('#rtState').innerHTML = '<b>' + (rest.ended ? 'קדימה' : rest.minHit ? 'אפשר להתחיל' : 'מנוחה') + '</b> · הבא: ' + esc(rest.label);
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
/* one answer about a finished exercise. Severe joint pain cancels what is left for that muscle today and points to a gentler movement */
function onFb(exId, key, v) {
  const f = setFb(exId, key, v), s = live(wkOf(exId)); if (!f || !s) return;
  const e = findEx(exId);
  if (key === 'pain') {
    /* set counts may have changed: redraw the queue, and stop a rest that no longer leads anywhere */
    if (rest.on && !cursor()) { clearInterval(rest.iv); rest.on = false; rest.last = null; }
    renderList(); renderHistory(); renderTabs(); renderDock();
  } else for (const el of $$('.fbk[data-ex="' + exId + '"]')) el.outerHTML = fbHTML(e, s);
  if (S.fbFor === exId && f.pump != null && f.load != null && f.pain !== 2) setTimeout(() => { if (S.fbFor === exId) closeFb(); }, 320);
  if (key === 'pump' && lowPump(e.mv) && S.open === exId && !$('#exList .tagx.hint')) renderList();
}
function skipFb() {
  const s = live(S.tab), f = s && s.fb && s.fb[S.fbFor];
  if (f && f.pump == null && f.load == null && f.pain !== 2) { delete s.fb[S.fbFor]; s.ft = Date.now(); touch(s); }
  closeFb();
}
/* the end of a workout: the points it brought, the level bar moving, and anything that opened on the way.
   R: { y: the workout's tally, from / to: the level before and after it, got: achievements earned now } */
function showSummary(s, R) {
  const total = exList(s.w, s).reduce((n, e) => n + e.sets, 0), mn = Math.max(1, Math.round((s.end - s.ts) / 60000)), y = R.y, up = R.to.lvl > R.from.lvl, nu = nextUp();
  const prev = sorted().find((x) => x.w === s.w && x.id !== s.id && x.end && hasDone(x)), pv = prev ? volume(prev) : 0;
  let cmp = '';
  if (pv && y.kg && !s.dl) { const d = ((y.kg - pv) / pv) * 100; if (Math.abs(d) >= 0.5) cmp = Ltr(Math.abs(d).toFixed(0) + '%') + (d > 0 ? ' יותר' : ' פחות') + ' מהפעם הקודמת · '; }
  const opened = up ? rewardsBetween(R.from.lvl, R.to.lvl) : [], stat = (v, k) => '<div><b>' + v + '</b><span>' + k + '</span></div>';
  const sh = $('#sheet'); S.sheet = 'sum';
  sh.innerHTML = '<div class="sheet-in sum" role="dialog" aria-modal="true" aria-label="סיכום אימון"><canvas class="confetti" id="confetti" aria-hidden="true"></canvas>' +
    '<p class="kicker">' + wkOrd(s.w) + ' הושלם' + (s.dl ? ' · שבוע קל' : '') + '</p><div class="sum-av">' + avatar(R.to.lvl, { flex: true }) + '</div>' +
    '<h2 class="sum-xp"><bdi dir="ltr" id="sumXp">+' + nf(y.xp) + '</bdi><small>נקודות</small></h2>' +
    (up ? '<p class="sum-up">' + glyph('star') + 'עלית לרמה ' + R.to.lvl + '</p>' : '') +
    '<div class="xp"><span class="xpbar"><i id="sumBar" style="width:' + (up ? 0 : pctOf(R.from)) + '%"></i></span><div class="xp-l"><span>רמה ' + R.to.lvl + ' · ' + rankOf(R.to.lvl).he + '</span><span>' + Ltr(nf(R.to.into) + ' / ' + nf(R.to.need)) + '</span></div></div>' +
    (opened.length || R.got.length ? '<ul class="sum-new">' + opened.map((r) => '<li>' + glyph('gift') + '<span>נפתח: ' + r.he + '</span></li>').join('') + R.got.map((id) => { const b = BADGES.find((x) => x.id === id); return '<li>' + glyph(b.ic) + '<span>הישג: ' + b.he + '</span></li>'; }).join('') + '</ul>' : '') +
    '<div class="stats">' + stat(y.sets + '/' + total, 'סטים') + stat(y.kg ? nf(y.kg) : '–', 'ק״ג') + stat(mn, 'דקות') + stat(y.prs, 'שיאים') + '</div>' +
    '<p class="sum-next">' + cmp + 'הבא: ' + wkFull(nu.next) + '</p>' +
    '<button class="btn primary big" id="sheetClose" type="button">המשך</button></div>';
  sh.hidden = false; $('#sheetClose').focus();
  countUp($('#sumXp'), y.xp); confetti($('#confetti'), up ? 110 : 50);
  requestAnimationFrame(() => requestAnimationFrame(() => { const b = $('#sumBar'); if (b) b.style.width = pctOf(R.to) + '%'; }));
  if (up) { chime(); buzz([50, 40, 50, 40, 120]); } else buzz(30);
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
  if (S.edDel) return '<span class="confirm"><span>למחוק את האימון?</span><button class="btn danger" id="edDelYes" type="button">כן, מחק</button><button class="btn" id="edDelNo" type="button">ביטול</button></span>';
  return '<button class="btn danger" id="edDelAsk" type="button">מחק אימון</button>' + (!live(s.w) && Date.now() - s.end < 12 * HOUR ? '<button class="btn" id="edReopen" type="button">המשך את האימון</button>' : '') + '<button class="btn primary" id="edDone" type="button">סיום</button>';
}
function openEditor(id) {
  const s = S.sessions[id]; if (!s) return;
  const wk = PLAN[s.w];
  let list = '';
  for (const e of exList(s.w, s)) {
    const r = rowsOf(s, e.id), n = Math.max(e.n0, r.length);
    list += '<section class="ed-ex"><h3>' + e.he + '</h3>';
    for (let i = 0; i < n; i++) {
      const row = r[i] || {}, on = isDone(row);
      list += '<div class="ed-row' + (on ? ' on' : '') + '" data-ex="' + e.id + '" data-i="' + i + '"><span>סט ' + (i + 1) + '</span>' +
        '<label class="ed-f"><input type="text" inputmode="decimal" autocomplete="off" data-k="kg" aria-label="משקל בסט ' + (i + 1) + '" value="' + (on && row.kg != null ? fmtKg(row.kg) : '') + '"><span>ק״ג</span></label><span aria-hidden="true">×</span>' +
        '<label class="ed-f"><input type="text" inputmode="numeric" autocomplete="off" data-k="reps" aria-label="חזרות בסט ' + (i + 1) + '" value="' + (on && row.reps != null ? row.reps : '') + '"><span>חז׳</span></label>' +
        '<button class="ed-clr" type="button" aria-label="נקה את סט ' + (i + 1) + '">' + ICON.x + '</button></div>';
    }
    list += '</section>';
  }
  S.edSid = id; S.edDel = false; S.sheet = 'ed';
  const sh = $('#sheet');
  sh.innerHTML = '<div class="sheet-in ed" role="dialog" aria-modal="true" aria-label="עריכת אימון"><div class="ed-h"><div><p class="kicker">' + wkOrd(s.w) + (s.dl ? ' · שבוע קל' : s.wk ? ' · שבוע ' + s.wk : '') + '</p><h2>' + wk.t + '</h2></div><button class="icon-btn" id="sheetClose" type="button" aria-label="סגור">' + ICON.x + '</button></div>' +
    '<label class="ed-date" for="edDate"><span>תאריך</span><input type="date" id="edDate" value="' + isoDay(new Date(s.ts)) + '" max="' + isoDay(new Date()) + '"></label>' +
    '<div class="ed-list">' + list + '</div><div class="ed-act" id="edAct">' + editorActions(s) + '</div></div>';
  sh.hidden = false;
}
function closeSheet() {
  const sh = $('#sheet'); if (sh.hidden) return;
  const kind = S.sheet;
  sh.hidden = true; sh.innerHTML = ''; S.sheet = null; S.edSid = null; S.edDel = false; S.msAsk = null;
  if (kind && kind !== 'sum' && kind !== 'list') renderAll();
}
function editorInput(rowEl) {
  const s = S.sessions[S.edSid]; if (!s || !rowEl) return;
  const exId = rowEl.dataset.ex, i = +rowEl.dataset.i, arr = s.sets[exId] || (s.sets[exId] = []), row = arr[i] || (arr[i] = { kg: null, reps: null, done: false });
  const kg = num($('[data-k="kg"]', rowEl).value), reps = num($('[data-k="reps"]', rowEl).value, true);
  row.kg = kg != null && kg > 0 ? kg : null; row.reps = reps != null && reps > 0 ? reps : null; row.done = row.reps != null; row.t = Date.now(); delete row.pr;
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
  try { await S.dl.save({ filename: 'gymi-log.csv', data: '﻿' + lines.join('\r\n') }); } catch (e) { if (e && e.code !== 'declined' && e.code !== 'rate_limited') { S.dl = null; renderHistory(); } }
}
function onRemoteChange() {
  const a = document.activeElement;
  if (a && a.closest && (a.closest('#dock') || a.closest('#sheet') || a.closest('.note')) && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT')) return;
  sweep(); meSync(); if (!S.touched) S.tab = nextUp().next;
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
  $('#topCoach').addEventListener('click', () => openChat(S.open));
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
    const e = findEx(li.dataset.id), fbBtn = ev.target.closest('[data-fb]'), nav = ev.target.closest('.fx-nav'), fx = ev.target.closest('[data-fx]');
    if (nav) { stepEx(nav.id === 'exNext' ? 1 : -1); return; }
    if (fx) { S.fxTab = fx.dataset.fx; for (const b of $$('.fx-tabs [data-fx]', li)) { const on = b === fx; b.setAttribute('aria-selected', String(on)); b.setAttribute('aria-pressed', String(on)); } $('#fxPane').innerHTML = paneHTML(e); return; }
    if (fbBtn) { S.touched = true; onFb(e.id, fbBtn.dataset.fb, +fbBtn.dataset.v); return; }
    const sn = ev.target.closest('[data-swapto]'); if (sn) { const q = sn.dataset.swapto.split(':'); swapNext(q[0], q[1]); return; }
    if (ev.target.closest('.stage-play')) { setPlaying(!player.playing); return; }
    const sp = ev.target.closest('.stage-speed'); if (sp) { player.speed = player.speed < 1 ? 1 : 0.5; sp.setAttribute('aria-pressed', String(player.speed < 1)); return; }
    if (ev.target.closest('.ask')) { openChat(e.id); return; }
    if (ev.target.closest('.swap')) { openSwap(e.id); return; }
    if (ev.target.closest('.same')) { S.touched = true; fillTargets(e); return; }
    const p = ev.target.closest('.setp');
    if (p) {
      /* a done set opens for editing; the others only bring the dock back to the next set */
      S.touched = true; const i = +p.dataset.i, s = live(S.tab), on = isDone(rowsOf(s, e.id)[i]);
      if (rest.on) { clearInterval(rest.iv); rest.on = false; rest.last = null; }
      S.edit = on ? { ex: e.id, i } : null; S.mini = false; S.draft = null; S.fbFor = null;
      refreshEx(e); renderDock(); if (on) keepAwake();
    }
  });
  /* a sideways swipe on the exercise steps to the one before or after it */
  let sw = null;
  list.addEventListener('touchstart', (ev) => { const t = ev.touches[0]; sw = ev.touches.length === 1 && !ev.target.closest('.stage-ctl,textarea,input,.seg') ? { x: t.clientX, y: t.clientY } : null; }, { passive: true });
  list.addEventListener('touchend', (ev) => {
    if (!sw) return; const t = ev.changedTouches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y; sw = null;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 45) stepEx((dx > 0) === (document.documentElement.dir !== 'ltr') ? 1 : -1);
  }, { passive: true });
  list.addEventListener('change', (ev) => {
    const ta = ev.target.closest('.note-in'), li = ta && ta.closest('.ex'); if (!li) return;
    const e = findEx(li.dataset.id), v = ta.value.trim().slice(0, 200);
    if ((S.cfg.notes[e.mv] || '') === v) return;
    if (v) S.cfg.notes[e.mv] = v; else delete S.cfg.notes[e.mv];
    saveCfg(); if (!rest.on) renderDock();
  });
  const dock = $('#dock');
  /* the page keeps clear of the dock, however tall it gets */
  if (window.ResizeObserver) new ResizeObserver(() => { const h = dock.offsetHeight; if (h) $('#app').style.setProperty('--dock-h', h + 'px'); }).observe(dock);
  let hold = 0, rep = 0;
  const endHold = () => { clearTimeout(hold); clearInterval(rep); };
  dock.addEventListener('pointerdown', (ev) => {
    const st = ev.target.closest('.step,.rstep'); if (!st) return;
    ev.preventDefault(); const d = +st.dataset.d, go = st.classList.contains('rstep') ? stepReps : stepKg; go(d); buzz(6); endHold();
    hold = setTimeout(() => { rep = setInterval(() => go(d), st.classList.contains('rstep') ? 140 : 90); }, 380);
  });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) dock.addEventListener(t, endHold);
  dock.addEventListener('click', (ev) => {
    const t = ev.target, id = (t.closest('button,[role="button"]') || {}).id;
    const st = t.closest('.step,.rstep'); if (st) { if (ev.detail === 0) (st.classList.contains('rstep') ? stepReps : stepKg)(+st.dataset.d); return; }
    const fbBtn = t.closest('[data-fb]'); if (fbBtn) { onFb(fbBtn.closest('.fbk').dataset.ex, fbBtn.dataset.fb, +fbBtn.dataset.v); return; }
    const sn = t.closest('[data-swapto]'); if (sn) { const q = sn.dataset.swapto.split(':'); swapNext(q[0], q[1]); return; }
    if (id === 'dkHit') { S.touched = true; logSet(t.closest('#dkHit')); }
    else if (id === 'dkNext') { const n = nextOpen(); if (n) { S.touched = true; S.draft = null; openEx(n.id, true, 1); renderDock(); } }
    else if (id === 'dkReps') typeReps();
    else if (id === 'fbSkip') skipFb();
    else if (id === 'dkKg') typeKg();
    else if (id === 'dkFinish') finishWorkout();
    else if (id === 'dkMini') { S.mini = !S.mini; renderDock(); }
    else if (id === 'rtSkip') stopRest();
    else if (id === 'rtPlus') nudgeRest(15);
    else if (id === 'rtMinus') nudgeRest(-15);
    else if (id === 'rtUndo') undoLast();
    else if (id === 'rtSound') { S.sound = !S.sound; saveLocal(); if (S.sound) { primeAudio(); beep(1); } renderDock(); }
    else if (id === 'edClose') { S.edit = null; renderDock(); refreshOpenSets(); }
    else if (id === 'edDel') { const e = findEx(S.edit.ex); clearRow(e, S.edit.i); S.edit = null; afterEdit(e); }
  });
  dock.addEventListener('keydown', (ev) => {
    if (ev.target.id === 'dkKg' && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); typeKg(); }
    if (ev.target.id === 'dkReps' && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); typeReps(); }
  });
  const logClick = (ev) => {
    const id = (ev.target.closest('button') || {}).id;
    if (id === 'exportBtn') exportCsv();
    const b = ev.target.closest('button'), ds = b ? b.dataset : {};
    if (ds.edit) openEditor(ds.edit);
    else if (id === 'histMore') { S.histN = (S.histN || 6) + 10; renderHistory(); }
    else if (ds.sum) showMesoSummary(ds.sum, false);
    else if (id === 'backupBtn') exportBackup();
    else if (id === 'restoreBtn') $('#restoreFile').click();
  };
  $('#restoreFile').addEventListener('change', (ev) => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; importBackup(f); });
  for (const box of ['#history', '#gains', '#backup']) $(box).addEventListener('click', logClick);
  $('#hero').addEventListener('click', (ev) => { if (ev.target.closest('.banner-x')) { S.banner = ''; S.bannerKind = ''; renderHome(); renderHero(); } });
  const sheet = $('#sheet');
  sheet.addEventListener('click', (ev) => {
    const id = (ev.target.closest('button') || {}).id;
    if (ev.target === sheet || id === 'sheetClose' || id === 'edDone' || ev.target.closest('[data-close]')) { closeSheet(); return; }
    if (listSheetClick(ev, id) || coachSheetClick(ev, id) || meSheetClick(ev)) return;
    if (id === 'edDelAsk' || id === 'edDelNo') { S.edDel = id === 'edDelAsk'; $('#edAct').innerHTML = editorActions(S.sessions[S.edSid]); }
    else if (id === 'edDelYes') { deleteSession(S.edSid); if (!S.touched) S.tab = nextUp().next; closeSheet(); }
    else if (id === 'edReopen') editorReopen();
    const clr = ev.target.closest('.ed-clr');
    if (clr) { const rowEl = clr.closest('.ed-row'); $$('input', rowEl).forEach((x) => { x.value = ''; }); editorInput(rowEl); }
  });
  sheet.addEventListener('input', (ev) => { const inp = ev.target.closest('.ed-row input'); if (inp) editorInput(inp.closest('.ed-row')); });
  sheet.addEventListener('change', (ev) => { if (ev.target.id === 'edDate') editorDate(ev.target.value); else { coachSheetChange(ev); meSheetChange(ev); } });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { if (!sheet.hidden) closeSheet(); else closeChat(); } });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onTheme);
  new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) return; if (rest.on) tickRest(); if (live(S.tab)) keepAwake(); });
  /* the phone's back button, when gymi runs inside its native shell: close what is open, else go back to today */
  window.gymiBack = () => {
    if (!sheet.hidden) { closeSheet(); return true; }
    if ($('#chat').classList.contains('open') && !matchMedia('(min-width:1000px)').matches) { closeChat(); return true; }
    if (S.view !== 'home') { renderHome(); setView('home'); return true; }
    return false;
  };
  setInterval(tickElapsed, 1000);
  setInterval(() => { if (sweep()) renderAll(); }, 60000);
}
