/* ================================================================== workout UI */
const valHTML = (r) => Ltr(r.kg != null ? Ltr(fmtKg(r.kg)) + '<small><bdi> ק״ג</bdi></small>' + Ltr(' × ' + (r.reps != null ? r.reps : '–')) : Ltr(r.reps != null ? r.reps : '–') + '<small><bdi> חז׳</bdi></small>');
/* what today's set is trying to beat */
const MODE = { reps: ['יעד: יותר חזרות', 'g-reps'], weight: ['יעד: יותר משקל', 'g-wt'], hold: ['לשמור על הביצוע', ''], base: ['בסיס חדש למזוציקל', ''], deload: ['דילואד', ''], down: ['המשקל ירד ב-10%', 'g-down'], cal: ['כויל מחדש', 'g-cal'] };
function badge(T, e) {
  if (!T || !MODE[T.mode]) return '';
  const inv = LIB[e.mv].inv, t = inv && T.mode === 'weight' ? 'יעד: פחות סיוע' : inv && T.mode === 'down' ? 'נוסף סיוע' : MODE[T.mode][0];
  return '<span class="goal ' + MODE[T.mode][1] + '">' + t + '</span>';
}
function cursor() {
  const s = live(S.tab), list = exList(S.tab, s);
  let e = S.open && list.find((x) => x.id === S.open);
  if (e && firstUndone(s, e) >= 0) return { e, i: firstUndone(s, e) };
  e = list.find((x) => firstUndone(s, x) >= 0);
  return e ? { e, i: firstUndone(s, e) } : null;
}
/* ---- three places: today, one workout, progress ---- */
function setView(v, keep) {
  S.view = v; $('#app').dataset.view = v;
  for (const b of $$('#tabbar [data-view]')) { if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
  if (!keep) window.scrollTo(0, 0);
}
/* open a workout: the one that is next (from the big button) or one picked from the week */
function openWorkout(w, picked) {
  if (picked) S.touched = true;
  if (w !== S.tab) { S.open = null; S.edit = null; S.draft = null; S.resetAsk = false; S.fbFor = null; S.preOpen = false; S.banner = ''; S.bannerKind = ''; if (rest.on) { clearInterval(rest.iv); rest.on = false; rest.last = null; } }
  S.tab = w; setView('workout'); renderAll(); if (!S.open) startTab();
}
const minsOf = (list) => Math.round(list.reduce((n, e) => n + e.sets * (45 + (e.rest[0] + e.rest[1]) / 2), 0) / 300) * 5;
const bannerHTML = () => (S.banner ? '<div class="banner ' + (S.bannerKind || '') + '"><p>' + S.banner + '</p><button type="button" class="banner-x" aria-label="סגור">' + ICON.x + '</button></div>' : '');
/* today: the workout that is next (or running) and where the week stands */
function renderHome() {
  const nu = nextUp(), w = nu.live >= 0 ? nu.live : nu.next, wk = PLAN[w], s = live(w), list = exList(w, s), P = phase(w, s), M = S.cfg.meso;
  const total = list.reduce((n, e) => n + e.sets, 0), dn = s ? list.reduce((n, e) => n + doneCount(s, e), 0) : 0;
  const ended = (i) => mesoSessions(M.id).filter((x) => x.w === i && x.end).length, over = mesoDone(M), base = ended(nu.next);
  const week = PLAN.map((x, i) => {
    const st = live(i) ? 'live' : i === nu.next ? 'next' : !over && ended(i) > base ? 'done' : 'todo';
    return '<button class="tab ' + st + '" type="button" data-tab="' + i + '"' + (i === w ? ' aria-current="true"' : '') + '><span class="dot" aria-hidden="true">' + (st === 'done' ? ICON.check : '') + '</span><b>' + x.name + '</b><small>' + { live: 'באמצע', next: 'הבא', done: 'הושלם', todo: '' }[st] + '</small></button>';
  }).join('');
  $('#home').innerHTML = '<div class="page-h"><p class="cap">' + (P.m ? 'מזוציקל ' + P.n + ' · ' + (P.dl ? 'שבוע דילואד' : 'שבוע ' + P.wk + ' מתוך ' + S.cfg.weeks) : 'ארבעה אימונים במחזור') + '</p><h1 class="big">היום</h1></div>' + bannerHTML() +
    '<section class="card next" aria-label="האימון הבא"><p class="k">' + (s ? 'באמצע אימון' : 'האימון הבא') + '</p><h2>' + wk.name + '</h2>' +
    '<p class="meta">' + wk.he + ' · ' + (s ? dn + ' מתוך ' + total + ' סטים בוצעו' : wk.ex.length + ' תרגילים · כ־' + minsOf(list) + ' דקות') + '</p>' +
    '<button class="btn primary big" id="homeGo" type="button" data-w="' + w + '">' + (s ? 'המשך אימון' : 'התחל אימון') + '</button></section>' +
    '<section class="card week" aria-label="האימונים של השבוע"><div class="card-h"><h2>השבוע</h2>' + (!P.dl && volWarn() ? '<em class="warn-pill">נפח</em>' : '') + '<button class="go-link" id="planBtn" type="button" aria-label="התוכנית והמזוציקל">התוכנית' + ICON.fwd + '</button></div><div class="week-row" id="tabs">' + week + '</div></section>';
}
function renderTabs() { renderHome(); }
const totals = () => { const s = live(S.tab), l = exList(S.tab, s); return { total: l.reduce((n, e) => n + e.sets, 0), dn: l.reduce((n, e) => n + doneCount(s, e), 0) }; };
function updateProgress() {
  const { dn, total } = totals(), arc = $('#ringArc'), txt = $('#ringTxt');
  if (arc) arc.style.strokeDashoffset = String(226.2 * (1 - (total ? dn / total : 0)));
  if (txt) txt.textContent = dn + '/' + total;
  const f = $('#finishBtn'); if (f) f.disabled = dn === 0;
}
function tickElapsed() {
  const el = $('#elapsed'), s = live(S.tab);
  if (el && s) el.innerHTML = 'באימון כבר <b>' + Ltr(mmss(Math.max(0, (Date.now() - s.ts) / 1000))) + '</b>';
}
function renderHero() {
  const wk = PLAN[S.tab], s = live(S.tab), list = exList(S.tab, s), total = list.reduce((n, e) => n + e.sets, 0), P = phase(S.tab, s), mins = minsOf(list);
  const prev = sorted().find((x) => x.w === S.tab && x.end && hasDone(x));
  const line2 = s ? '<span id="elapsed"></span>' : prev ? 'פעם קודמת ' + ago(prev.ts) + ': ' + setsDone(prev) + ' סטים' + (volume(prev) ? ', ' + volume(prev).toLocaleString('he-IL') + ' ק״ג' : '') : wk.ex.length + ' תרגילים · כ־' + mins + ' דקות';
  const meso = P.m ? '<button class="meso' + (P.dl ? ' dl' : '') + '" id="mesoBtn" type="button" aria-label="מזוציקל ותוכנית: פרטים והגדרות"><span>מזוציקל ' + P.n + ' · ' + (P.dl ? 'שבוע דילואד' : 'שבוע ' + P.wk + ' מתוך ' + S.cfg.weeks) + '</span><b>' + rirText(P.rir) + '</b>' + (!P.dl && volWarn() ? '<em>נפח</em>' : '') + ICON.fwd + '</button>' : '';
  $('#hero').innerHTML = bannerHTML() +
    '<div class="hero-card"><div><p class="kicker">אימון ' + (S.tab + 1) + ' מתוך 4 · ' + wk.he + '</p><h1>' + wk.name + '</h1><p class="meta">' + (s || prev ? wk.ex.length + ' תרגילים · כ־' + mins + ' דקות<br>' : '') + line2 + '</p></div>' +
    '<div class="ring" role="img" aria-label="התקדמות באימון"><svg viewBox="0 0 86 86" aria-hidden="true"><circle class="tr" cx="43" cy="43" r="36"/><circle class="pr" id="ringArc" cx="43" cy="43" r="36" stroke-dasharray="226.2" stroke-dashoffset="226.2"/></svg><div><b id="ringTxt">0/' + total + '</b><span>סטים</span></div></div></div>' + meso;
  tickElapsed();
}
const pipsHTML = (e, dn) => { let p = ''; for (let k = 0; k < e.sets; k++) p += '<i' + (k < dn ? ' class="on"' : '') + '></i>'; return p; };
function rowHTML(e, i, s) {
  const dn = doneCount(s, e), off = e.cut && e.sets === 0, full = !off && dn >= e.sets;
  const tags = (e.cut ? '<span class="tagx warn">' + (off ? 'בוטל היום' : 'קוצר היום') + '</span>' : '') + (lowPump(e.mv) ? '<span class="tagx hint">שווה להחליף</span>' : '') + (e.swapped ? '<span class="tagx">חלופה</span>' : '');
  return '<li class="ex' + (full ? ' done' : '') + (off ? ' off' : '') + '" data-id="' + e.id + '">' +
    '<button class="ex-head" type="button" aria-expanded="false" aria-controls="body-' + e.id + '">' +
    '<span class="ex-n">' + (off ? '–' : full ? ICON.check : i + 1) + '</span><canvas class="ex-thumb" data-anim="' + e.a + '" aria-hidden="true"></canvas>' +
    '<span class="ex-title"><span class="ex-name">' + esc(e.name) + '</span><span class="ex-sub">' + LIB[e.mv].he + '</span>' + (tags ? '<span class="tags">' + tags + '</span>' : '') + '</span>' +
    '<span class="ex-side"><span class="ex-rx">' + Ltr((off ? e.n0 : e.sets) + ' × ' + e.reps) + '</span><span class="pips" aria-hidden="true">' + pipsHTML(e, dn) + '</span></span>' +
    '</button><div class="ex-body" id="body-' + e.id + '" hidden></div></li>';
}
function setsHTML(e) {
  const s = live(S.tab), r = rowsOf(s, e.id), cur = s ? cursor() : null, rir = rirOf(e, s), fu = firstUndone(s, e), T0 = fu >= 0 ? targetOf(e, fu, s) : null, ref = refRow(e, 0, s);
  let h = '<div class="sets-h"><span>סטים</span><span>' + (s ? 'נגיעה בסט שבוצע פותחת עריכה' : 'הרישום נעשה בסרגל שלמטה') + '</span></div>';
  if (ref && !ref.other) h += '<p class="prev-line">פעם קודמת, ' + ago(ref.ts) + ': ' + rowsOf(S.sessions[ref.sid], e.id).filter(isDone).map((x) => Ltr(fmtRow(x))).join(' · ') + '</p>';
  for (let i = 0; i < e.sets; i++) {
    const row = r[i], on = isDone(row), isCur = !!cur && cur.e.id === e.id && cur.i === i, T = on ? null : i === fu ? T0 : targetOf(e, i, s);
    const fail = rir === 0 && i === e.sets - 1 ? '<em>עד כשל טכני</em>' : '';
    const mid = on ? '<span class="v">' + valHTML(row) + (row.pr ? '<span class="pr">שיא אישי</span>' : '') + '</span>'
      : '<span class="hint">' + (T ? '<span class="tg">' + Ltr(fmtRow(T)) + '</span>' + badge(T, e) : isCur ? 'הסט הבא' : 'עוד לא בוצע') + (fail ? ' · ' + fail : '') + '</span>';
    h += '<button class="setp' + (on ? ' done' : isCur ? ' cur' : '') + '" type="button" data-i="' + i + '"><span class="n">סט ' + (i + 1) + '</span>' + mid + '<span class="st">' + ICON.check + '</span></button>';
  }
  if (e.cut) h += '<p class="cut-note">' + (e.sets ? 'שאר הסטים' : 'התרגיל') + ' בוטל היום בגלל כאב חזק במפרק.</p>';
  if (T0 && e.sets - fu > 1) h += '<button class="btn same" type="button">רשום את שאר הסטים לפי היעד</button>';
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
  if (P.length < 2) return '<div class="trend"><span class="k">מגמת כוח</span><p>' + (P.length ? 'אימון אחד נרשם (' + Ltr(fmtRow(P[0].row)) + '). אחרי האימון הבא תופיע כאן מגמה.' : 'אחרי שני אימונים תופיע כאן המגמה של התרגיל.') + '</p></div>';
  const lo = Math.min.apply(null, P.map((p) => p.v)), hi = Math.max.apply(null, P.map((p) => p.v)), X = (i) => 6 + (i * 106) / (P.length - 1), Y = (v) => 38 - ((v - lo) / (hi - lo || 1)) * 32;
  const line = P.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join(' '), last = P[P.length - 1], prevP = P[P.length - 2];
  const d = prevP.v ? ((last.v - prevP.v) / prevP.v) * 100 : 0, cls = d > 0.4 ? 'up' : d < -0.4 ? 'dn' : '';
  return '<div class="trend"><span class="k">מגמת כוח · ' + P.length + ' אימונים</span><span class="val">' + valHTML(last.row) + '</span>' +
    '<span class="d ' + cls + '">' + (cls === 'up' ? '▲ עלייה של ' : cls === 'dn' ? '▼ ירידה של ' : 'בלי שינוי מהאימון הקודם') + (cls ? Ltr(Math.abs(d).toFixed(1) + '%') + ' מהאימון הקודם' : '') + '</span>' +
    '<svg viewBox="0 0 118 44" role="img" aria-label="מגמת הכוח ב-' + P.length + ' האימונים האחרונים"><path d="' + line + ' L112 44 L6 44 Z" fill="var(--ink-3)" opacity=".12"/><path d="' + line + '" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + X(P.length - 1).toFixed(1) + '" cy="' + Y(last.v).toFixed(1) + '" r="4.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/></svg></div>';
}
/* three one-tap answers about the exercise that was just finished */
const FB = [
  { k: 'pain', q: 'כאב במפרקים', o: ['בלי כאב', 'קל', 'חזק'] },
  { k: 'pump', q: 'פאמפ וחיבור לשריר', o: ['חלש', 'בינוני', 'חזק'] },
  { k: 'load', q: 'עומס העבודה', o: ['קל מדי', 'מתאים', 'יותר מדי'] },
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
    (!alt ? '' : set ? 'מהאימון הבא: ' + Ltr(esc(EN[alt])) + ' במקום התרגיל הזה. ' : (LIB[alt].jf ? 'חלופה נוחה יותר למפרקים באותו דפוס תנועה: ' : 'חלופה באותו דפוס תנועה: ') + Ltr(esc(EN[alt])) + '. <button class="link" type="button" data-swapto="' + e.id + ':' + alt + '">להחליף מהאימון הבא</button> ') + 'אם הכאב נמשך, כדאי להתייעץ עם איש מקצוע.</p>';
}
/* the feedback card inside the exercise; hidden while the dock is asking the same questions */
const fbWrap = (e, s) => (s && S.fbFor !== e.id && rowsOf(s, e.id).some(isDone) ? '<span class="rx-k">משוב על התרגיל</span>' + fbHTML(e, s) + painNote(e, s) : '');
function bodyHTML(e) {
  const s = live(S.tab), info = LIB[e.mv], view = { side: 'מבט מהצד', back: 'מבט מאחור', top: 'מבט מלמעלה' }[ANIM[e.a].view], rir = rirOf(e, s), fw = fbWrap(e, s);
  const lvl = rir == null ? e.lvl : rir >= 4 ? 0 : rir >= 2 ? 1 : rir === 1 ? 2 : 3;
  return '<div class="ex-a"><div class="stage-wrap"><canvas class="stage" role="img" aria-label="הדמיה של ' + esc(e.name) + '"></canvas>' +
    '<span class="stage-tag">' + view + (e.a !== e.mv ? ' · הדמיה של תנועה דומה' : '') + '</span><span class="stage-phase"></span>' +
    '<div class="stage-ctl"><button class="stage-speed" type="button" aria-pressed="' + (player.speed < 1) + '" aria-label="הילוך איטי">' + Ltr('½×') + '</button><button class="stage-play" type="button"></button></div>' +
    '<div class="tempo" aria-hidden="true"><i></i></div></div>' +
    '<div class="how"><p class="muscles"><i></i><span>' + info.m + '</span></p><ul class="cues">' + info.c.map((c) => '<li>' + c + '</li>').join('') + '</ul>' +
    '<label class="note"><span>' + ICON.pin + 'ההערה שלי לתרגיל</span><textarea class="note-in" rows="2" maxlength="200" placeholder="למשל: מושב בגובה 4, עצירה של שנייה למטה, ירידה של 3 שניות">' + esc(S.cfg.notes[e.mv] || '') + '</textarea></label></div></div>' +
    '<div class="ex-b"><div class="rx-row">' +
    '<div><span class="rx-k">סטים × חזרות</span><span class="rx-v">' + Ltr(e.n0 + ' × ' + e.reps) + (e.suf ? ' <small>' + e.suf + '</small>' : '') + '</span></div>' +
    '<div><span class="rx-k">מנוחה</span><span class="rx-v">' + restText(e).replace(/ (דק׳|שנ׳)/, ' <small>$1</small>') + '</span></div>' +
    '<div><span class="rx-k">' + (rir == null ? 'עצימות' : 'עצימות השבוע') + '</span><span class="chip l' + lvl + '">' + (rir == null ? e.int : rirText(rir)) + '</span></div></div>' +
    (lowPump(e.mv) ? '<p class="flag-line">' + ICON.swap + '<span>פאמפ חלש פעמיים ברצף בתרגיל הזה. שווה לשקול להחליף אותו.</span></p>' : '') +
    '<div class="sets">' + setsHTML(e) + '</div><div class="fb-wrap"' + (fw ? '' : ' hidden') + '>' + fw + '</div>' + trendHTML(e) +
    '<div class="ex-acts"><button class="btn swap" type="button">' + ICON.swap + 'החלף תרגיל</button><button class="btn ask" type="button">' + ICON.cam + 'המכשיר תפוס? שאל את אילון</button></div></div>';
}
function renderHistory() {
  const all = sorted().filter((x) => hasDone(x) && x.end), list = all.slice(0, S.histN || 6), df = new Intl.DateTimeFormat('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' }), s = live(S.tab);
  $('#wkAct').innerHTML = !s ? '' : '<button class="btn big" id="finishBtn" type="button">סיים אימון</button>' + (S.resetAsk ? '<span class="confirm"><span>למחוק את מה שנרשם באימון הזה?</span><button class="btn danger" id="resetYes" type="button">כן, נקה</button><button class="btn" id="resetNo" type="button">ביטול</button></span>' : '<button class="link" id="resetBtn" type="button">נקה את הרישום של האימון הזה</button>');
  renderGains(); renderBackup();
  $('#history').innerHTML = '<h2 class="sec">אימונים אחרונים</h2>' + (list.length ? '<ul class="rows">' + list.map((x) => { const v = volume(x), mn = Math.max(1, Math.round((x.end - x.ts) / 60000)); return '<li><span class="h-t">' + df.format(new Date(x.ts)) + ' · אימון ' + (x.w + 1) + ' ' + Ltr(PLAN[x.w].name) + '</span><span class="h-act">' + (S.delAsk === x.id ? '<button class="link" type="button" data-delyes="' + x.id + '">כן, למחוק</button><button class="link" type="button" data-delno="1">ביטול</button>' : '<button class="link" type="button" data-edit="' + x.id + '" aria-label="ערוך את האימון הזה">עריכה</button><button class="link" type="button" data-del="' + x.id + '" aria-label="מחק את האימון הזה מהרישום">מחק</button>') + '</span><span class="h-s">' + setsDone(x) + ' סטים' + (v ? ' · ' + v.toLocaleString('he-IL') + ' ק״ג' : '') + (mn < 300 ? ' · ' + mn + ' דק׳' : '') + (x.dl ? ' · דילואד' : x.wk ? ' · שבוע ' + x.wk : '') + '</span></li>'; }).join('') + '</ul>' + (all.length > list.length ? '<button class="link" id="histMore" type="button">הצג עוד אימונים</button>' : '')
    : '<p class="empty-note">כאן יופיעו האימונים שסיימת. כל אימון אפשר יהיה לערוך או למחוק.</p>') +
    (S.dl && list.length ? '<button class="link" id="exportBtn" type="button">ייצוא כל הרישום לקובץ CSV</button>' : '');
  updateProgress();
}
/* one file with every workout and the settings: saved from here, or read back in */
function renderBackup() {
  $('#backup').innerHTML = '<h2 class="sec">גיבוי והעברה</h2><p class="empty-note">קובץ אחד עם כל האימונים וההגדרות. כך מעבירים את הרישום בין gymi שבתוך Claude לבין האפליקציה בטלפון, לשני הכיוונים.</p><div class="backup-act">' +
    (S.dl ? '<button class="btn" id="backupBtn" type="button">שמירת גיבוי לקובץ</button>' : '') + '<button class="btn" id="restoreBtn" type="button">שחזור מקובץ גיבוי</button></div>' + (S.backupNote ? '<p class="backup-note" role="status">' + S.backupNote + '</p>' : '');
}
async function exportBackup() {
  if (!S.dl) return;
  try { await S.dl.save({ filename: 'gymi-backup-' + isoDay(new Date()) + '.json', data: backupData() }); S.backupNote = 'הגיבוי נשמר. כדי להעביר אותו, פותחים את gymi במקום השני ובוחרים "שחזור מקובץ גיבוי".'; }
  catch (e) { if (e && e.code !== 'declined' && e.code !== 'rate_limited') S.backupNote = 'לא הצלחתי לשמור את הקובץ.'; }
  renderBackup();
}
function importBackup(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    const r = restoreData(String(rd.result || ''));
    S.backupNote = !r ? 'זה לא קובץ גיבוי של gymi.' : r.n || r.cfg ? (r.n ? (r.n === 1 ? 'אימון אחד נוסף או עודכן' : r.n + ' אימונים נוספו או עודכנו') : 'ההגדרות עודכנו') + ' מהגיבוי.' : 'הקובץ נקרא. לא היה בו שום דבר שעוד לא נמצא כאן.';
    if (r) { sweep(); if (!S.touched) S.tab = nextUp().next; S.open = null; }
    renderAll();
  };
  rd.onerror = () => { S.backupNote = 'לא הצלחתי לקרוא את הקובץ.'; renderBackup(); };
  rd.readAsText(file);
}
/* progress: how the best set of each movement moved since the mesocycle began */
function renderGains() {
  const M = S.cfg.meso, R = mesoSummary(M.id), sign = (p) => Ltr((p >= 0 ? '+' : '−') + Math.abs(p).toFixed(1) + '%');
  $('#progCap').textContent = 'מזוציקל ' + M.n + (R.n ? ' · ' + R.n + (R.n === 1 ? ' אימון' : ' אימונים') : '');
  $('#gains').innerHTML = '<h2 class="sec">הכוח שלך</h2>' + (R.gains.length ? '<ul class="rows">' + R.gains.slice(0, 5).map((g) => '<li><span class="g-t">' + Ltr(esc(EN[g.mv])) + '</span><span class="g-s">' + Ltr(fmtRow(g.first)) + ' בהתחלה · ' + Ltr(fmtRow(g.best)) + ' בשיא</span><span class="g-d ' + (g.pct > 0.4 ? 'up' : g.pct < -0.4 ? 'dn' : '') + '">' + sign(g.pct) + '</span></li>').join('') + '</ul>'
    : '<p class="empty-note">אחרי שני אימונים של אותו תרגיל יופיע כאן השינוי בכוח.</p>') + (R.n ? '<button class="btn" type="button" data-sum="' + M.id + '">סיכום המזוציקל המלא</button>' : '');
}
function markCur() {
  const cur = live(S.tab) ? cursor() : null;
  $$('.ex').forEach((li) => li.classList.toggle('cur', !!cur && cur.e.id === li.dataset.id));
}
function renderList() {
  stopPlayer();
  const s = live(S.tab), list = exList(S.tab, s);
  $('#exList').innerHTML = list.map((e, i) => rowHTML(e, i, s)).join('');
  drawThumbs();
  const keep = S.open && list.some((e) => e.id === S.open) ? S.open : null;
  S.open = null; if (keep) openEx(keep, false); else markCur();
}
function renderAll() { renderHome(); renderHero(); renderPre(); renderList(); renderHistory(); renderDock(); }
function closeEx() {
  const li = $('.ex.open');
  if (li) { li.classList.remove('open'); const b = $('.ex-body', li); b.hidden = true; b.innerHTML = ''; $('.ex-head', li).setAttribute('aria-expanded', 'false'); }
  stopPlayer(); S.open = null;
}
function openEx(id, scroll) {
  const li = $('.ex[data-id="' + id + '"]'), e = findEx(id);
  if (!li || !e) return;
  closeEx();
  const body = $('.ex-body', li);
  body.innerHTML = bodyHTML(e); body.hidden = false;
  li.classList.add('open'); $('.ex-head', li).setAttribute('aria-expanded', 'true'); S.open = id;
  startPlayer($('.stage', body), e.a, body); markCur();
  if (scroll) li.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
}
/* refresh one exercise after its sets changed, without rebuilding the stage */
function refreshEx(e) {
  const li = $('.ex[data-id="' + e.id + '"]'); e = findEx(e.id); if (!li || !e) return;
  const s = live(S.tab), dn = doneCount(s, e), off = e.cut && e.sets === 0, full = !off && dn >= e.sets;
  li.classList.toggle('done', full); $('.ex-n', li).innerHTML = off ? '–' : full ? ICON.check : String(PLAN[S.tab].ex.findIndex((x) => x.id === e.id) + 1);
  $('.pips', li).innerHTML = pipsHTML(e, dn);
  const sets = $('.sets', li); if (sets) sets.innerHTML = setsHTML(e);
  const fw = $('.fb-wrap', li); if (fw) { const h = fbWrap(e, s); fw.innerHTML = h; fw.hidden = !h; }
  const tr = $('.trend', li); if (tr) tr.outerHTML = trendHTML(e);
  markCur(); updateProgress();
}
function refreshOpenSets() { const e = S.open && findEx(S.open), li = e && $('.ex.open .sets'); if (li) li.innerHTML = setsHTML(e); markCur(); }

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
  return '<div class="fb-dock"><div class="fb-h"><b>איך היה ' + Ltr(esc(e.name)) + '?</b><button class="link" id="fbSkip" type="button">' + (s.fb && s.fb[e.id] && s.fb[e.id].pain === 2 ? 'סגור' : 'דלג') + '</button></div>' + fbHTML(e, s) + painNote(e, s) + '</div>';
}
function closeFb() { const id = S.fbFor; S.fbFor = null; renderDock(); if (id && S.open === id) refreshEx({ id }); }
/* "swap from the next workout", offered next to a pain report */
function swapNext(exId, mv) { swapTo(exId, mv, true); renderDock(); if (S.open) refreshEx({ id: S.open }); }
function renderDock() {
  const dock = $('#dock'), wk = PLAN[S.tab], s = live(S.tab), fbp = fbPanel(s);
  let cls = 'dock', h;
  if (rest.on) {
    const L = rest.last; cls += ' rest';
    h = '<div class="rt"><div class="rt-time" id="rtTime">0:00</div><div class="rt-mid"><div class="rt-state" id="rtState"></div><div class="rt-track"><i id="rtFill"></i></div>' +
      (L ? '<div class="rt-log"><span>נרשם ' + Ltr(fmtRow(L)) + '</span>' + (L.pr ? '<span class="pr">שיא אישי</span>' : '') + '<button class="link" id="rtUndo" type="button">בטל</button></div>' : '') + '</div></div>' +
      '<div class="rt-btns"><button type="button" id="rtMinus" aria-label="הפחת 15 שניות">' + Ltr('−15') + '</button><button type="button" id="rtPlus" aria-label="הוסף 15 שניות">' + Ltr('+15') + '</button>' +
      '<button type="button" id="rtSound" aria-label="' + (S.sound ? 'השתק צליל' : 'הפעל צליל') + '">' + (S.sound ? ICON.snd : ICON.mute) + '</button><button type="button" id="rtSkip" class="go">המשך</button></div>' + fbp;
  } else if (fbp) {
    S.edit = null;
    h = fbp + (cursor() ? '' : '<div class="dk-row"><div class="dk-msg">כל הסטים בוצעו</div><button class="btn primary" id="dkFinish" type="button">סיים אימון</button></div>');
  } else if (S.edit && findEx(S.edit.ex) && isDone(rowsOf(s, S.edit.ex)[S.edit.i])) {
    const e = findEx(S.edit.ex), row = rowsOf(s, e.id)[S.edit.i];
    h = '<div class="dk-top"><div class="dk-go"><span class="dk-name">' + esc(e.name) + '</span><span class="dk-set">עריכת סט <b>' + (S.edit.i + 1) + '</b> · כל שינוי נשמר מיד</span></div>' +
      '<button class="btn danger" id="edDel" type="button">מחק סט</button><button class="btn primary" id="edClose" type="button">סיום</button></div>' + numsHTML(row.kg, row.reps, false, false);
  } else if (!s) {
    S.edit = null;
    const P = phase(S.tab, null);
    h = '<div class="dk-row"><div class="dk-msg">אימון ' + (S.tab + 1) + ' · ' + Ltr(wk.name) + '<small>' + (P.dl ? 'שבוע דילואד: חצי מהסטים ומשקל קל' : 'שבוע ' + P.wk + ' · ' + rirText(P.rir)) + '</small></div><button class="btn primary" id="dkStart" type="button">' + ICON.go + 'התחל אימון</button></div>';
  } else {
    S.edit = null;
    const cur = cursor();
    if (!cur) h = '<div class="dk-row"><div class="dk-msg">כל הסטים בוצעו<small>אפשר לסיים, או לגעת בסט כדי לתקן אותו</small></div><button class="btn primary" id="dkFinish" type="button">סיים אימון</button></div>';
    else {
      const e = cur.e, i = cur.i, T = targetOf(e, i, s), d = S.draft && S.draft.ex === e.id && S.draft.i === i ? S.draft : null, note = S.cfg.notes[e.mv];
      if (S.mini) cls += ' mini';
      h = '<div class="dk-top"><button class="dk-go" type="button" id="dkGo"><span class="dk-name">' + esc(e.name) + '</span><span class="dk-set">סט <b>' + (i + 1) + '</b> מתוך ' + e.sets + (T ? ' · יעד ' + Ltr(fmtRow(T)) : e.suf ? ' · ' + e.reps + ' ' + e.suf : '') + (T && T.ref && !T.ref.other ? ' · פעם קודמת ' + Ltr(fmtRow(T.ref)) : '') + '</span></button>' +
        '<button class="dk-ic coach" id="dkCoach" type="button" aria-label="שאל את אילון"><span class="ava" aria-hidden="true">א</span></button>' +
        '<button class="dk-ic" id="dkMini" type="button" aria-label="' + (S.mini ? 'הרחב את הסרגל' : 'מזער את הסרגל') + '">' + (S.mini ? ICON.up : ICON.down) + '</button></div>' +
        (note ? '<p class="dk-note">' + ICON.pin + '<span>' + esc(note) + '</span></p>' : '') +
        numsHTML(curKg(e, i, s, T), curReps(e, i, s, T), !!T && !(d && d.kg !== undefined), !!T && !(d && d.reps != null)) +
        '<p class="dk-lbl">' + (T ? badge(T, e) + '<span>יצא אחרת? מעדכנים את המספרים</span>' : '<span>בוחרים משקל וחזרות, ואז נגיעה אחת</span>') + '</p>' +
        '<button class="hit" id="dkHit" type="button">' + ICON.check + '<span>סיימתי סט</span></button>';
    }
  }
  dock.className = cls; dock.innerHTML = '<div class="dock-in">' + h + '</div>';
  if (rest.on) tickRest();
}
function setKg(kg) {
  const t = dockTarget(); if (!t) return;
  kg = kg == null || !(kg > 0) ? null : Math.round(kg * 100) / 100;
  if (t.edit) { const s = live(S.tab), row = rowsOf(s, t.e.id)[t.i]; if (!row) return; row.kg = kg; row.t = Date.now(); delete row.pr; touch(s); refreshEx(t.e); }
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
  if (t.edit) { const s = live(S.tab), row = rowsOf(s, t.e.id)[t.i]; if (!row) return; row.reps = r; row.t = Date.now(); delete row.pr; touch(s); refreshEx(t.e); }
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
  const pr = writeRow(e, i, kg, reps), s = live(S.tab), list = exList(S.tab, s), left = (x) => firstUndone(s, x) >= 0;
  e = list.find((x) => x.id === e.id);
  S.draft = null; refreshEx(e); renderTabs(); renderHistory(); renderPre();
  if (!$('#elapsed')) renderHero(), updateProgress();
  if (!left(e)) askFb(e, s);
  if (!list.some(left)) { stopRest(); return; }
  let nxt = e, label;
  if (left(e)) {
    const ni = firstUndone(s, e), T = targetOf(e, ni, s), inv = LIB[e.mv].inv;
    label = 'הבא: סט ' + (ni + 1) + ' מתוך ' + e.sets + (T && T.mode === 'down' ? ' · ' + (inv ? 'מוסיפים סיוע: ' : 'מורידים ל-') + fmtKg(T.kg) + ' ק״ג' : T && T.mode === 'cal' ? ' · ' + (inv ? 'פחות סיוע: ' : 'מעלים ל-') + fmtKg(T.kg) + ' ק״ג' : '');
  } else { nxt = list.slice(list.indexOf(e) + 1).find(left) || list.find(left); label = 'הבא: ' + nxt.name; }
  startRest(e.rest[0], e.rest[1], label, { ex: e.id, i, kg, reps, pr });
  if (nxt !== e) setTimeout(() => { if (S.tab === wkOf(nxt.id) && S.open === e.id) openEx(nxt.id, true); }, 750);
}
function clearRow(e, i) { const s = live(wkOf(e.id)); if (!s) return; const arr = s.sets[e.id] || (s.sets[e.id] = []); arr[i] = { kg: null, reps: null, done: false, t: Date.now() }; touch(s); }
function afterEdit(e) { refreshEx(e); renderTabs(); renderHistory(); renderDock(); }
/* log every remaining set of an exercise exactly at its target */
function fillTargets(e) {
  const s = ensure(S.tab);
  for (let i = firstUndone(s, e), n = 0; i >= 0 && n < MAX_SETS; i = firstUndone(s, e), n++) { const T = targetOf(e, i, s); if (!T) break; writeRow(e, i, T.kg, T.reps); }
  S.draft = null; keepAwake(); e = findEx(e.id);
  if (firstUndone(s, e) < 0) askFb(e, s);
  afterEdit(e); renderPre();
  if (!$('#elapsed')) renderHero(), updateProgress();
  const list = exList(S.tab, s), nxt = list.slice(list.findIndex((x) => x.id === e.id) + 1).find((x) => firstUndone(s, x) >= 0);
  if (firstUndone(s, e) < 0 && nxt) setTimeout(() => { if (S.open === e.id) openEx(nxt.id, true), renderDock(); }, 500);
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
  $('#rtState').innerHTML = '<b>' + (rest.ended ? 'קדימה, לסט הבא' : rest.minHit ? 'אפשר להתחיל' : 'מנוחה') + '</b> · ' + esc(rest.label);
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
  if (key === 'pump' && lowPump(e.mv) && !$('.ex[data-id="' + exId + '"] .tagx.hint')) renderList();
}
function skipFb() {
  const s = live(S.tab), f = s && s.fb && s.fb[S.fbFor];
  if (f && f.pump == null && f.load == null && f.pain !== 2) { delete s.fb[S.fbFor]; s.ft = Date.now(); touch(s); }
  closeFb();
}
function showSummary(s) {
  const wk = PLAN[s.w], total = exList(s.w, s).reduce((n, e) => n + e.sets, 0), v = volume(s), mn = Math.max(1, Math.round((s.end - s.ts) / 60000)), prs = prCount(s);
  const prev = sorted().find((x) => x.w === s.w && x.id !== s.id && x.end && hasDone(x)), pv = prev ? volume(prev) : 0, nu = nextUp();
  let cmp = '';
  if (pv && v && !s.dl) { const d = ((v - pv) / pv) * 100; cmp = Math.abs(d) < 0.5 ? 'אותו נפח כמו באימון הקודם של ' + Ltr(wk.name) + '.' : (d > 0 ? 'נפח גבוה ב-' : 'נפח נמוך ב-') + Ltr(Math.abs(d).toFixed(0) + '%') + ' מהאימון הקודם של ' + Ltr(wk.name) + '.'; }
  const sh = $('#sheet'); S.sheet = 'sum';
  sh.innerHTML = '<div class="sheet-in" role="dialog" aria-modal="true" aria-label="סיכום אימון"><p class="kicker">אימון ' + (s.w + 1) + ' הושלם' + (s.dl ? ' · דילואד' : s.wk ? ' · שבוע ' + s.wk : '') + '</p><h2>' + Ltr(wk.name) + '</h2>' +
    '<div class="stats"><div><b>' + setsDone(s) + '/' + total + '</b><span>סטים</span></div><div><b>' + (v ? v.toLocaleString('en-US') : '–') + '</b><span>ק״ג נפח כולל</span></div><div><b>' + mn + '</b><span>' + (mn === 1 ? 'דקה' : 'דקות') + '</span></div></div>' +
    '<p>' + (prs ? '<b>' + prs + (prs === 1 ? ' שיא אישי' : ' שיאים אישיים') + ' באימון הזה.</b> ' : '') + cmp + ' הבא בתור: אימון ' + (nu.next + 1) + ' · ' + Ltr(PLAN[nu.next].name) + '.</p>' +
    '<button class="btn primary big" id="sheetClose" type="button">סגור</button></div>';
  sh.hidden = false; $('#sheetClose').focus();
}
function finishWorkout() {
  const s = live(S.tab); if (!s || !hasDone(s)) return;
  clearInterval(rest.iv); rest.on = false; rest.last = null;
  s.end = Date.now(); s.mt = s.end; touch(s); letSleep();
  S.edit = null; S.draft = null; S.resetAsk = false; S.open = null; S.fbFor = null; S.banner = ''; S.bannerKind = ''; S.tab = nextUp().next;
  setView('home', true); renderAll();
  const M = S.cfg.meso;
  if (s.m === M.id && mesoDone(M)) showMesoSummary(M.id, s);
  else if (s.m === M.id && !s.dl && !M.early && M.asked !== s.id && fatigued()) { M.asked = s.id; saveCfg(); showDeloadOffer(s); }
  else showSummary(s);
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}
/* ---- fix the record afterwards: edit any set of a finished workout, move it to another day, reopen or delete it ---- */
function deleteSession(id) {
  if (!S.sessions[id]) return;
  delete S.sessions[id]; S.gone.add(id); S.dirty.add(id); saveLocal(); schedule(id, 100);
}
const isoDay = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function editorActions(s) {
  if (S.edDel) return '<span class="confirm"><span>למחוק את האימון הזה לגמרי?</span><button class="btn danger" id="edDelYes" type="button">כן, מחק</button><button class="btn" id="edDelNo" type="button">ביטול</button></span>';
  return '<button class="btn danger" id="edDelAsk" type="button">מחק אימון</button>' + (!live(s.w) && Date.now() - s.end < 12 * HOUR ? '<button class="btn" id="edReopen" type="button">המשך את האימון</button>' : '') + '<button class="btn primary" id="edDone" type="button">סיום</button>';
}
function openEditor(id) {
  const s = S.sessions[id]; if (!s) return;
  const wk = PLAN[s.w];
  let list = '';
  for (const e of exList(s.w, s)) {
    const r = rowsOf(s, e.id), n = Math.max(e.n0, r.length);
    list += '<section class="ed-ex"><h3>' + esc(e.name) + '</h3>';
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
  sh.innerHTML = '<div class="sheet-in ed" role="dialog" aria-modal="true" aria-label="עריכת אימון"><div class="ed-h"><div><p class="kicker">עריכת אימון ' + (s.w + 1) + (s.dl ? ' · דילואד' : s.wk ? ' · שבוע ' + s.wk : '') + '</p><h2>' + Ltr(wk.name) + '</h2></div><button class="icon-btn" id="sheetClose" type="button" aria-label="סגור">' + ICON.x + '</button></div>' +
    '<label class="ed-date" for="edDate"><span>תאריך האימון</span><input type="date" id="edDate" value="' + isoDay(new Date(s.ts)) + '" max="' + isoDay(new Date()) + '"></label>' +
    '<p class="ed-note">כל שינוי נשמר מיד. סט בלי מספר חזרות נחשב כלא בוצע.</p><div class="ed-list">' + list + '</div><div class="ed-act" id="edAct">' + editorActions(s) + '</div></div>';
  sh.hidden = false;
}
function closeSheet() {
  const sh = $('#sheet'); if (sh.hidden) return;
  const kind = S.sheet;
  sh.hidden = true; sh.innerHTML = ''; S.sheet = null; S.edSid = null; S.edDel = false; S.msAsk = null;
  if (kind && kind !== 'sum') renderAll();
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
  if (nt === s.ts) return;
  s.ts = nt; if (s.end) s.end = nt + len; s.mt = Date.now(); touch(s);
}
function editorReopen() {
  const s = S.sessions[S.edSid]; if (!s || live(s.w)) return;
  s.end = 0; s.mt = Date.now(); touch(s);
  S.tab = s.w; S.touched = true; S.open = null; S.edSid = null; S.edDel = false; S.sheet = null; setView('workout', true);
  const sh = $('#sheet'); sh.hidden = true; sh.innerHTML = '';
  renderAll();
  const first = exList(S.tab, s).find((e) => firstUndone(s, e) >= 0); if (first) { openEx(first.id, false); renderDock(); }
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
  sweep(); if (!S.touched) S.tab = nextUp().next;
  if (S.sheet === 'meso') renderMeso(); else if (S.sheet !== 'ed' && S.sheet !== 'swap') renderAll();
}
function startTab() {
  const first = exList(S.tab).find((e) => firstUndone(live(S.tab), e) >= 0); if (first) { openEx(first.id, false); renderDock(); }
}

/* ================================================================== wiring */
function wireApp() {
  $('#tabbar').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-view]'); if (!b) return;
    closeChat(); setView(b.dataset.view);
  });
  $('#backBtn').addEventListener('click', () => { renderHome(); setView('home'); });
  $('#topCoach').addEventListener('click', () => openChat(S.open));
  $('#home').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.classList.contains('banner-x')) { S.banner = ''; S.bannerKind = ''; renderHome(); renderHero(); updateProgress(); }
    else if (b.id === 'homeGo') openWorkout(+b.dataset.w, false);
    else if (b.id === 'planBtn') openMeso();
    else if (b.classList.contains('tab')) openWorkout(+b.dataset.tab, true);
  });
  const list = $('#exList');
  list.addEventListener('click', (ev) => {
    const li = ev.target.closest('.ex'); if (!li) return;
    const e = findEx(li.dataset.id), fbBtn = ev.target.closest('[data-fb]');
    if (fbBtn) { S.touched = true; onFb(e.id, fbBtn.dataset.fb, +fbBtn.dataset.v); return; }
    const sn = ev.target.closest('[data-swapto]'); if (sn) { const q = sn.dataset.swapto.split(':'); swapNext(q[0], q[1]); return; }
    if (ev.target.closest('.ex-head')) { S.touched = true; S.draft = null; if (S.open === e.id) closeEx(), markCur(); else openEx(e.id, false); if (!rest.on && !S.edit) renderDock(); return; }
    if (ev.target.closest('.stage-play')) { setPlaying(!player.playing); return; }
    const sp = ev.target.closest('.stage-speed'); if (sp) { player.speed = player.speed < 1 ? 1 : 0.5; sp.setAttribute('aria-pressed', String(player.speed < 1)); return; }
    if (ev.target.closest('.ask')) { openChat(e.id); return; }
    if (ev.target.closest('.swap')) { openSwap(e.id); return; }
    if (ev.target.closest('.same')) { S.touched = true; fillTargets(e); return; }
    const p = ev.target.closest('.setp');
    if (p) {
      S.touched = true; const i = +p.dataset.i, s = ensure(S.tab);
      if (rest.on) { clearInterval(rest.iv); rest.on = false; rest.last = null; }
      S.edit = isDone(rowsOf(s, e.id)[i]) ? { ex: e.id, i } : null; S.mini = false; S.draft = null; S.fbFor = null;
      renderHero(); renderHistory(); refreshEx(e); renderDock(); keepAwake();
    }
  });
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
    else if (id === 'dkReps') typeReps();
    else if (id === 'fbSkip') skipFb();
    else if (id === 'dkKg') typeKg();
    else if (id === 'dkStart') { S.touched = true; ensure(S.tab); primeAudio(); keepAwake(); S.mini = false; saveLocal(); renderHero(); renderPre(); renderList(); renderHistory(); renderTabs(); const c = cursor(); if (c && S.open !== c.e.id) openEx(c.e.id, true); else refreshOpenSets(); renderDock(); }
    else if (id === 'dkFinish') finishWorkout();
    else if (id === 'dkMini') { S.mini = !S.mini; renderDock(); }
    else if (id === 'dkCoach') { const c = cursor(); openChat(c ? c.e.id : S.open); }
    else if (id === 'dkGo') { const c = cursor(); if (c) { if (S.open !== c.e.id) openEx(c.e.id, true); else $('.ex.open').scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' }); } }
    else if (id === 'rtSkip') stopRest();
    else if (id === 'rtPlus') nudgeRest(15);
    else if (id === 'rtMinus') nudgeRest(-15);
    else if (id === 'rtUndo') undoLast();
    else if (id === 'rtSound') { S.sound = !S.sound; saveLocal(); if (S.sound) { primeAudio(); beep(1); } renderDock(); }
    else if (id === 'edClose') { S.edit = null; renderDock(); }
    else if (id === 'edDel') { const e = findEx(S.edit.ex); clearRow(e, S.edit.i); S.edit = null; afterEdit(e); }
  });
  dock.addEventListener('keydown', (ev) => {
    if (ev.target.id === 'dkKg' && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); typeKg(); }
    if (ev.target.id === 'dkReps' && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); typeReps(); }
  });
  const logClick = (ev) => {
    const id = (ev.target.closest('button') || {}).id;
    if (id === 'finishBtn') finishWorkout();
    else if (id === 'resetBtn') { S.resetAsk = true; renderHistory(); }
    else if (id === 'resetNo') { S.resetAsk = false; renderHistory(); }
    else if (id === 'resetYes') { const s = live(S.tab); if (s) { delete S.sessions[s.id]; S.gone.add(s.id); S.dirty.add(s.id); saveLocal(); schedule(s.id, 100); } clearInterval(rest.iv); rest.on = false; S.resetAsk = false; S.edit = null; S.draft = null; S.fbFor = null; S.banner = ''; S.bannerKind = ''; letSleep(); renderAll(); }
    else if (id === 'exportBtn') exportCsv();
    const b = ev.target.closest('button'), ds = b ? b.dataset : {};
    if (ds.del) { S.delAsk = ds.del; renderHistory(); }
    else if (ds.delno) { S.delAsk = null; renderHistory(); }
    else if (ds.delyes && S.sessions[ds.delyes]) { deleteSession(ds.delyes); S.delAsk = null; if (!S.touched) S.tab = nextUp().next; renderAll(); }
    else if (ds.edit) { S.delAsk = null; openEditor(ds.edit); }
    else if (id === 'histMore') { S.histN = (S.histN || 6) + 10; renderHistory(); }
    else if (ds.sum) showMesoSummary(ds.sum, false);
    else if (id === 'backupBtn') exportBackup();
    else if (id === 'restoreBtn') $('#restoreFile').click();
  };
  $('#restoreFile').addEventListener('change', (ev) => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; importBackup(f); });
  for (const box of ['#wkAct', '#history', '#gains', '#backup']) $(box).addEventListener('click', logClick);
  $('#hero').addEventListener('click', (ev) => {
    if (ev.target.closest('.banner-x')) { S.banner = ''; S.bannerKind = ''; renderHome(); renderHero(); updateProgress(); }
    else if (ev.target.closest('#mesoBtn')) openMeso();
  });
  const sheet = $('#sheet');
  sheet.addEventListener('click', (ev) => {
    const id = (ev.target.closest('button') || {}).id;
    if (ev.target === sheet || id === 'sheetClose' || id === 'edDone' || ev.target.closest('[data-close]')) { closeSheet(); return; }
    if (coachSheetClick(ev, id)) return;
    if (id === 'edDelAsk' || id === 'edDelNo') { S.edDel = id === 'edDelAsk'; $('#edAct').innerHTML = editorActions(S.sessions[S.edSid]); }
    else if (id === 'edDelYes') { deleteSession(S.edSid); if (!S.touched) S.tab = nextUp().next; closeSheet(); }
    else if (id === 'edReopen') editorReopen();
    const clr = ev.target.closest('.ed-clr');
    if (clr) { const rowEl = clr.closest('.ed-row'); $$('input', rowEl).forEach((x) => { x.value = ''; }); editorInput(rowEl); }
  });
  sheet.addEventListener('input', (ev) => { const inp = ev.target.closest('.ed-row input'); if (inp) editorInput(inp.closest('.ed-row')); });
  sheet.addEventListener('change', (ev) => { if (ev.target.id === 'edDate') editorDate(ev.target.value); else coachSheetChange(ev); });
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
