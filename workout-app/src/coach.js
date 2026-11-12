/* ================================================================== recovery check, exercise swap, mesocycle sheet */
const SORE = ['לא היה תפוס', 'החלים בדיוק בזמן', 'עדיין תפוס'];
const fmtN = (v) => String(Math.round(v * 10) / 10);
/* muscles today's workout trains directly that have been trained before */
function preMuscles(w) { const out = []; for (const pe of PLAN[w].ex) { const mu = LIB[pe.a].p; if (!out.includes(mu) && lastTrained(mu)) out.push(mu); } return out; }
/* what the recovery answers change in today's workout, in words */
function soreEffects(w, sore) {
  const P = phaseNext(w), out = [];
  if (P.dl) return out;
  const a = planned(w, {}), b = planned(w, sore), s = live(w);
  for (const pe of PLAN[w].ex) { const d = b[pe.id] - a[pe.id]; if (d) out.push((d > 0 ? 'סט נוסף ב-' : 'סט אחד פחות ב-') + Ltr(esc(findEx(pe.id, s).name))); }
  for (const mu of Object.keys(sore)) if (sore[mu] === 2) out.push('חזרה נוספת ברזרבה ל' + MUSCLE[mu].he);
  return out;
}
/* before the first set: how sore did each muscle get from its last workout? Still sore takes a set off and backs away from failure; never sore after easy work adds a set */
function renderPre() {
  const box = $('#pre'), w = S.tab, s = live(w), mus = (s && hasDone(s)) || phase(w, s).dl ? [] : preMuscles(w);
  if (!mus.length) { box.hidden = true; box.innerHTML = ''; return; }
  const sore = soreOf(w, s), left = mus.filter((m) => sore[m] == null).length, fx = soreEffects(w, sore);
  box.hidden = false;
  if (!left && !S.preOpen) {
    box.innerHTML = '<div class="pre done"><p>' + ICON.check + '<span><b>ההתאוששות נרשמה.</b> ' + (fx.length ? 'השפעה על היום: ' + fx.join(' · ') + '.' : 'האימון נשאר כמתוכנן.') + '</span></p><button class="link" id="preEdit" type="button">שנה</button></div>';
    return;
  }
  box.innerHTML = '<div class="pre"><div class="pre-h"><div><b>לפני שמתחילים: כמה השריר היה תפוס מהאימון הקודם?</b><span>האימון של היום מתעדכן לפי התשובות.</span></div><button class="link" id="preAll" type="button">הכול החלים בזמן</button></div>' +
    mus.map((m) => { const lt = lastTrained(m); return '<div class="pre-row"><span>' + MUSCLE[m].he + (lt ? '<small>אומן ' + ago(lt.ts) + '</small>' : '') + '</span><div class="seg" role="group" aria-label="' + MUSCLE[m].he + '">' + SORE.map((t, v) => '<button type="button" data-mu="' + m + '" data-v="' + v + '" aria-pressed="' + (sore[m] === v) + '">' + t + '</button>').join('') + '</div></div>'; }).join('') +
    (fx.length ? '<p class="pre-fx">השפעה על היום: ' + fx.join(' · ') + '.</p>' : '') + (left ? '' : '<button class="btn" id="preDone" type="button">סיום</button>') + '</div>';
}
function afterPre() { renderPre(); renderHero(); renderList(); updateProgress(); renderDock(); }

/* ---- swap: only movements of the same pattern and muscle, so the week keeps its shape ---- */
function openSwap(exId) {
  const e = findEx(exId); if (!e) return;
  const pe = planEx(exId), s = live(wkOf(exId)), started = !!s && rowsOf(s, exId).some(isDone), L = LIB[e.mv], used = exList(wkOf(exId), s).map((x) => x.mv);
  const opt = (k) => {
    const o = LIB[k], b = bestFor(k);
    return '<li class="sw-opt"><canvas class="ex-thumb" data-anim="' + animOf(k) + '" aria-hidden="true"></canvas><div class="sw-t"><b>' + esc(EN[k]) + '</b><span>' + o.he + ' · ' + EQUIP[o.eq].he + '</span>' +
      '<span class="tags">' + (k === pe.a ? '<span class="tagx">התרגיל המקורי בתוכנית</span>' : '') + (o.jf ? '<span class="tagx ok">נוח למפרקים</span>' : '') + (used.includes(k) ? '<span class="tagx">כבר באימון הזה</span>' : '') + (b ? '<span class="tagx">הכי טוב שלך ' + Ltr(fmtRow(b)) + '</span>' : '') + '</span></div>' +
      '<div class="sw-b">' + (started ? '' : '<button class="btn" type="button" data-sw="' + k + '" data-mode="today">רק היום</button>') + '<button class="btn primary" type="button" data-sw="' + k + '" data-mode="always">' + (started ? 'מהאימון הבא' : 'קבוע') + '</button></div></li>';
  };
  S.sheet = 'swap'; S.swEx = exId;
  const sh = $('#sheet');
  sh.innerHTML = '<div class="sheet-in sw" role="dialog" aria-modal="true" aria-label="החלפת תרגיל"><div class="ed-h"><div><p class="kicker">החלפת תרגיל · ' + PATTERN[L.pat] + '</p><h2>' + Ltr(esc(e.name)) + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="סגור">' + ICON.x + '</button></div>' +
    '<p>מוצגים רק תרגילים באותו דפוס תנועה ולאותו שריר, כדי שמבנה השבוע יישמר. מספר הסטים, טווח החזרות והעצימות נשארים, וההיסטוריה של שני התרגילים נשמרת.' + (started ? ' כבר רשמת סטים בתרגיל הזה היום, לכן ההחלפה תחול מהאימון הבא.' : '') + '</p>' +
    '<ul class="sw-list">' + swapOptions(e).map(opt).join('') + '</ul>' +
    '<button class="btn ask" id="swAsk" type="button">' + ICON.cam + 'מכשיר אחר? צלם ושאל את אילון</button></div>';
  sh.hidden = false; drawThumbs();
}

/* ---- mesocycle sheet: the weekly ramp, volume per muscle against its landmarks, set counts, increments ---- */
function volHTML(dl) {
  const vol = muscleVolume(weekItems()), pct = (v) => Math.min(100, (v / 30) * 100).toFixed(1);
  return Object.keys(MUSCLE).map((k) => {
    const v = vol[k], tot = v.d + v.i, M = MUSCLE[k], st = dl ? 'ok' : landmark(k, tot);
    return '<div class="vol-row ' + st + '"><span class="vol-n">' + M.he + '</span>' +
      '<div class="vol-bar" role="img" aria-label="' + M.he + ': ' + fmtN(tot) + ' סטים בשבוע. הטווח המומלץ: ' + M.mev + ' עד ' + M.mrv + '"><i class="band" style="inset-inline-start:' + pct(M.mev) + '%;width:' + pct(M.mrv - M.mev) + '%"></i><i class="val" style="width:' + pct(tot) + '%"></i></div>' +
      '<span class="vol-v"><b>' + fmtN(tot) + '</b><small>' + Ltr(fmtN(v.d) + ' + ' + fmtN(v.i)) + '</small></span>' +
      (st === 'ok' ? '' : '<span class="vol-flag">' + (st === 'under' ? '▼ מתחת למינימום היעיל (' + M.mev + ' סטים)' : '▲ מעל מה שאפשר להתאושש ממנו (' + M.mrv + ' סטים)') + '</span>') + '</div>';
  }).join('');
}
function builderHTML() {
  return PLAN.map((wk, w) => {
    const s = live(w), dl = phase(w, s).dl;
    return '<div class="bl-w"><h4>אימון ' + (w + 1) + ' · ' + Ltr(wk.name) + (dl ? '<small>שבוע קל: חצי מהסטים</small>' : '') + '</h4>' + exList(w, s).map((e) => '<div class="bl-row"><span class="bl-n"><b>' + esc(e.name) + '</b><small>' + MUSCLE[LIB[e.mv].p].he + ' · ' + Ltr(e.reps) + ' חזרות</small></span>' +
      '<div class="stp"><button type="button" data-base="' + e.id + '" data-n="' + (e.n0 - 1) + '" aria-label="סט אחד פחות"' + (dl || e.n0 <= 1 ? ' disabled' : '') + '>−</button><b>' + e.n0 + '</b><button type="button" data-base="' + e.id + '" data-n="' + (e.n0 + 1) + '" aria-label="סט נוסף"' + (dl || e.n0 >= MAX_SETS ? ' disabled' : '') + '>+</button></div></div>').join('') + '</div>';
  }).join('');
}
function renderMeso() {
  const sh = $('#sheet'), old = $('.sheet-in', sh), top = old ? old.scrollTop : 0, M = S.cfg.meso, s = live(S.tab), P = phase(S.tab, s), W = S.cfg.weeks, past = (S.cfg.past || []).filter((p) => mesoSessions(p.id).length).slice(-1)[0];
  if (!P.m) P.n = M.n;
  let strip = '';
  for (let k = 1; k <= W; k++) { const d = k === W, cur = P.dl ? d : k === P.wk; strip += '<li class="' + (cur ? 'cur' : '') + (d ? ' dl' : '') + '"' + (cur ? ' aria-current="step"' : '') + '><small>שבוע ' + k + '</small><b>' + (d ? 'שבוע קל' : ((r) => (r === 0 ? 'עד כשל' : r === 1 ? 'חזרה 1' : r + ' חזרות'))(rirFor(k, W))) + '</b></li>'; }
  /* the last mesocycle is complete and the next workout opens a new one: nothing to steer until then */
  const over = mesoDone(M);
  let act;
  if (over) act = '<span class="ms-sub">סבב ' + M.n + ' הושלם. האימון הבא פותח את סבב ' + (M.n + 1) + '.</span><button class="btn" type="button" data-sum="' + M.id + '">סיכום סבב ' + M.n + '</button>';
  else if (S.msAsk === 'dl') act = '<span class="confirm"><span>להפוך את האימונים הבאים לשבוע קל (חצי מהסטים, 15% פחות משקל)? אחריו יתחיל סבב חדש.</span><button class="btn primary" id="msDlYes" type="button">כן, שבוע קל</button><button class="btn" id="msNo" type="button">ביטול</button></span>';
  else if (S.msAsk === 'new') act = '<span class="confirm"><span>לסגור את הסבב הזה ולהתחיל חדש משבוע 1? הרישום נשמר.</span><button class="btn primary" id="msNewYes" type="button">כן, סבב חדש</button><button class="btn" id="msNo" type="button">ביטול</button></span>';
  else act = (M.early ? '<button class="btn" id="msDlOff" type="button">בטל את השבוע הקל המוקדם</button>' : P.dl ? '' : '<button class="btn" id="msDl" type="button">שבוע קל עכשיו</button>') + '<button class="btn" id="msNew" type="button">סבב חדש</button>' +
    (mesoSessions(M.id).length ? '<button class="btn" type="button" data-sum="' + M.id + '">סיכום עד עכשיו</button>' : '') + (past ? '<button class="btn" type="button" data-sum="' + past.id + '">סיכום סבב ' + past.n + '</button>' : '');
  sh.innerHTML = '<div class="sheet-in ms" role="dialog" aria-modal="true" aria-label="סבב ותוכנית"><div class="ed-h"><div><p class="kicker">סבב ' + P.n + (M.early && !over ? ' · שבוע קל מוקדם' : '') + '</p><h2>' + (P.dl ? 'שבוע קל' : 'שבוע ' + P.wk + ' <small>מתוך ' + W + '</small>') + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="סגור">' + ICON.x + '</button></div>' +
    '<ol class="wk-strip">' + strip + '</ol>' +
    '<p>בכל שבוע כתוב כמה חזרות משאירים לפני כשל. כל שבוע מתקרבים בחזרה אחת, והיעד לכל סט עולה בהתאם: עוד חזרה באותו משקל, או יותר משקל כשמגיעים לראש הטווח. השבוע האחרון קל, כדי להתאושש.</p>' +
    '<section><h3>סטים בשבוע לפי שריר</h3><p class="ms-sub">סט מלא לשריר הראשי וחצי סט לשריר מסייע (המספרים הקטנים: ישירים + עקיפים). הרצועה הבהירה היא הטווח המומלץ: מהמינימום היעיל ועד המקסימום שאפשר להתאושש ממנו.' + (P.dl ? ' בשבוע קל יש פחות סטים בכוונה.' : '') + '</p><div class="vol">' + volHTML(P.dl) + '</div></section>' +
    '<section><h3>סטים בתוכנית</h3><p class="ms-sub">שינוי כאן חל מהאימון הבא של אותו תרגיל. במהלך הסבב האפליקציה מוסיפה או מורידה סט לפי משוב ההתאוששות.</p>' + builderHTML() + '</section>' +
    '<section><h3>קפיצת משקל לפי ציוד</h3><p class="ms-sub">היעדים מעוגלים לקפיצה הקטנה ביותר שאפשר להעמיס בפועל.</p><div class="inc">' + Object.keys(EQUIP).map((k) => '<label class="inc-row"><span>' + EQUIP[k].he + '</span><select data-inc="' + k + '">' + INC_CHOICES.map((v) => '<option value="' + v + '"' + (v === (+S.cfg.inc[k] || EQUIP[k].inc) ? ' selected' : '') + '>' + v + ' ק״ג</option>').join('') + '</select></label>').join('') + '</div></section>' +
    '<section><h3>אורך הסבב</h3><div class="bl-row"><span class="bl-n"><b>' + W + ' שבועות</b><small>' + (W - 1) + ' שבועות עבודה ושבוע קל</small></span><div class="stp"><button type="button" data-weeks="' + (W - 1) + '" aria-label="שבוע פחות"' + (W <= 4 ? ' disabled' : '') + '>−</button><b>' + W + '</b><button type="button" data-weeks="' + (W + 1) + '" aria-label="שבוע נוסף"' + (W >= 7 ? ' disabled' : '') + '>+</button></div></div></section>' +
    '<div class="ed-act ms-act">' + act + '</div></div>';
  $('.sheet-in', sh).scrollTop = top;
}
function openMeso() { S.sheet = 'meso'; S.msAsk = null; renderMeso(); $('#sheet').hidden = false; }
/* the end-of-mesocycle card: volume from start to peak, strength per movement, and the movements that answered best */
function showMesoSummary(id, justDone) {
  const R = mesoSummary(id), n = +String(id).slice(1) || 1, sh = $('#sheet'), avg = R.gains.length ? R.gains.reduce((a, g) => a + g.pct, 0) / R.gains.length : null;
  const sign = (p) => Ltr((p >= 0 ? '+' : '−') + Math.abs(p).toFixed(1) + '%');
  let body = '<p>עוד אין אימונים רשומים בסבב הזה.</p>';
  if (R.n) {
    body = '<div class="stats"><div><b>' + (R.sets ? fmtN(R.sets.peak) : '–') + '</b><span>סטים בשבוע השיא' + (R.sets && R.sets.start !== R.sets.peak ? ' (בהתחלה ' + fmtN(R.sets.start) + ')' : '') + '</span></div><div><b>' + (avg == null ? '–' : sign(avg)) + '</b><span>שינוי כוח ממוצע</span></div><div><b>' + R.n + '</b><span>אימונים</span></div></div>' +
      (R.mus.length ? '<section><h3>סטים לפי שריר</h3><ul class="sum-list">' + R.mus.map((m) => '<li><span>' + MUSCLE[m.k].he + '</span><span>' + (m.weeks > 1 && m.peak !== m.start ? fmtN(m.start) + ' סטים בשבוע הראשון, <b>' + fmtN(m.peak) + '</b> בשיא (שבוע ' + m.peakWk + ')' : '<b>' + fmtN(m.peak) + '</b> סטים בשבוע') + '</span></li>').join('') + '</ul></section>' : '') +
      '<section><h3>שינוי כוח לפי תרגיל</h3>' + (R.gains.length ? '<ul class="sum-list">' + R.gains.slice(0, 14).map((g) => '<li><span>' + Ltr(esc(EN[g.mv])) + '</span><span>' + Ltr(fmtRow(g.first)) + ' בהתחלה, ' + Ltr(fmtRow(g.best)) + ' בשיא · <b class="' + (g.pct > 0.4 ? 'up' : g.pct < -0.4 ? 'dn' : '') + '">' + sign(g.pct) + '</b></span></li>').join('') + '</ul>' : '<p class="ms-sub">צריך לפחות שני אימונים של אותו תרגיל כדי להשוות.</p>') + '</section>' +
      '<section><h3>התרגילים שהגיבו הכי טוב</h3>' + (R.top.length ? '<ul class="sum-list">' + R.top.map((t) => '<li><span>' + Ltr(esc(EN[t.mv])) + '</span><span>תחושה ' + (t.pump >= 1.5 ? 'חזקה' : 'בינונית') + ' בשריר · ' + (t.pain === 0 ? 'בלי כאב במפרקים' : 'כאב קל לפעמים') + '</span></li>').join('') + '</ul>' : '<p class="ms-sub">אין עדיין מספיק משוב. התשובות על התחושה בשריר ועל כאב בסוף כל תרגיל הן מה שמזין את הדירוג הזה.</p>') + '</section>';
  }
  S.sheet = 'msum';
  sh.innerHTML = '<div class="sheet-in ms" role="dialog" aria-modal="true" aria-label="סיכום סבב"><div class="ed-h"><div><p class="kicker">' + (justDone ? 'הסבב הושלם' : 'סיכום') + '</p><h2>סבב ' + n + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="סגור">' + ICON.x + '</button></div>' + body +
    (justDone ? '<p>האימון הבא פותח סבב חדש: מספר הסטים חוזר לבסיס והעצימות חוזרת ל-3 חזרות לפני כשל.</p>' : '') + '<button class="btn primary big" id="sheetClose" type="button">סגור</button></div>';
  sh.hidden = false;
}
/* two workouts in a row fell short for two muscle groups or more: offer the deload now */
function showDeloadOffer(s) {
  const mus = Array.from(missedMuscles(s)).map((k) => MUSCLE[k].he), sh = $('#sheet');
  S.sheet = 'dlo';
  sh.innerHTML = '<div class="sheet-in" role="dialog" aria-modal="true" aria-label="הצעה לשבוע קל"><p class="kicker">אימון ' + (s.w + 1) + ' הושלם</p><h2>סימני עייפות</h2>' +
    '<p>בשני האימונים האחרונים לא הגעת ליעד בשתי קבוצות שריר או יותר (היום: ' + mus.join(', ') + '). כשזה קורה ברצף, בדרך כלל זו עייפות מצטברת ולא יום חלש.</p>' +
    '<p><b>שבוע קל:</b> חצי מהסטים, 15% פחות משקל ורחוק מכשל, בכל ארבעת האימונים. אחריו מתחיל סבב חדש.</p>' +
    '<button class="btn primary big" id="dlYes" type="button">להתחיל שבוע קל עכשיו</button><button class="btn big" data-close="1" type="button">לא עכשיו, להמשיך כרגיל</button></div>';
  sh.hidden = false;
}
function startDeload() { S.cfg.meso.early = Date.now(); saveCfg(); S.bannerKind = ''; S.banner = '<b>שבוע קל התחיל.</b> בארבעת האימונים הבאים: חצי מהסטים, 15% פחות משקל ורחוק מכשל. אחריהם מתחיל סבב חדש.'; }
/* clicks inside the sheet that belong to this file; returns true when the click was handled */
function coachSheetClick(ev, id) {
  const b = ev.target.closest('button'), ds = b ? b.dataset : {};
  if (ds.sw) {
    const exId = S.swEx, now = swapTo(exId, ds.sw, ds.mode === 'always'), w = wkOf(exId);
    S.bannerKind = ''; S.banner = (now ? 'הוחלף ל-' : 'מהאימון הבא: ') + Ltr(esc(EN[ds.sw])) + (ds.mode === 'always' ? '' : ' (רק היום)') + '. הסטים, טווח החזרות וההיסטוריה נשמרים.';
    if (S.tab === w) S.open = exId;
    S.draft = null; closeSheet(); return true;
  }
  if (id === 'swAsk') { const exId = S.swEx; closeSheet(); openChat(exId); return true; }
  if (ds.base) { setBase(ds.base, +ds.n); renderMeso(); return true; }
  if (ds.weeks) { S.cfg.weeks = clamp(+ds.weeks, 4, 7); saveCfg(); renderMeso(); return true; }
  if (ds.sum) { showMesoSummary(ds.sum, false); return true; }
  if (id === 'msDl' || id === 'msNew' || id === 'msNo') { S.msAsk = id === 'msDl' ? 'dl' : id === 'msNew' ? 'new' : null; renderMeso(); return true; }
  if (id === 'msDlYes') { startDeload(); S.msAsk = null; closeSheet(); return true; }
  if (id === 'msDlOff') { S.cfg.meso.early = 0; saveCfg(); renderMeso(); return true; }
  if (id === 'msNewYes') { newMeso(); S.msAsk = null; S.bannerKind = ''; S.banner = '<b>סבב ' + S.cfg.meso.n + ' התחיל.</b> האימון הבא הוא שבוע 1.'; closeSheet(); return true; }
  if (id === 'dlYes') { startDeload(); closeSheet(); return true; }
  return false;
}
function coachSheetChange(ev) {
  const sel = ev.target.closest('select[data-inc]'); if (!sel) return;
  const k = sel.dataset.inc, v = +sel.value;
  if (!EQUIP[k] || !(v > 0)) return;
  if (v === EQUIP[k].inc) delete S.cfg.inc[k]; else S.cfg.inc[k] = v;
  saveCfg();
}
function wireCoach() {
  $('#pre').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    S.touched = true;
    if (b.dataset.mu) setSore(S.tab, b.dataset.mu, +b.dataset.v);
    else if (b.id === 'preAll') { const s = live(S.tab), sore = soreOf(S.tab, s); for (const m of preMuscles(S.tab)) if (sore[m] == null) setSore(S.tab, m, 1); S.preOpen = false; }
    else if (b.id === 'preEdit') S.preOpen = true;
    else if (b.id === 'preDone') S.preOpen = false;
    afterPre();
  });
}
