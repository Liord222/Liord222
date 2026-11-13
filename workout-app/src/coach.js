/* ================================================================== recovery check, exercise swap, mesocycle sheet */
const SORE = ['לא נתפס', 'החלים', 'עדיין תפוס'];
const fmtN = (v) => String(Math.round(v * 10) / 10);
/* muscles today's workout trains directly that have been trained before */
function preMuscles(w) { const out = []; for (const pe of PLAN[w].ex) { const mu = LIB[pe.a].p; if (!out.includes(mu) && lastTrained(mu)) out.push(mu); } return out; }
/* what the recovery answers change in today's workout, in words */
function soreEffects(w, sore) {
  const P = phaseNext(w), out = [];
  if (P.dl) return out;
  const a = planned(w, {}), b = planned(w, sore), s = live(w);
  for (const pe of PLAN[w].ex) { const d = b[pe.id] - a[pe.id]; if (d) out.push((d > 0 ? 'סט נוסף: ' : 'סט פחות: ') + findEx(pe.id, s).he); }
  for (const mu of Object.keys(sore)) if (sore[mu] === 2) out.push('חזרה פחות ל' + MUSCLE[mu].he);
  return out;
}
/* before the first set: did the muscles recover from their last workout? One tap says yes. "Not quite" opens the muscles one by one:
   still sore takes a set off and stops a rep earlier; never sore after easy work adds a set */
function renderPre() {
  const box = $('#pre'), w = S.tab, s = live(w), mus = (s && hasDone(s)) || phase(w, s).dl ? [] : preMuscles(w);
  if (!mus.length) { box.hidden = true; box.innerHTML = ''; return; }
  const sore = soreOf(w, s), left = mus.filter((m) => sore[m] == null).length, fx = soreEffects(w, sore);
  box.hidden = false;
  if (!S.preOpen) {
    box.innerHTML = left ? '<div class="pre one"><b>השרירים התאוששו?</b><div class="pre-q"><button class="btn primary" id="preAll" type="button">כן</button><button class="btn" id="preEdit" type="button">לא לגמרי</button></div></div>'
      : '<div class="pre done"><p>' + ICON.check + '<span>' + (fx.length ? fx.join(' · ') : 'התאוששות נרשמה') + '</span></p><button class="link" id="preEdit" type="button">שנה</button></div>';
    return;
  }
  box.innerHTML = '<div class="pre"><div class="pre-h"><b>מה עדיין תפוס?</b><button class="link" id="preAll" type="button">הכול החלים</button></div>' +
    mus.map((m) => '<div class="pre-row"><span>' + MUSCLE[m].he + '</span><div class="seg" role="group" aria-label="' + MUSCLE[m].he + '">' + SORE.map((t, v) => '<button type="button" data-mu="' + m + '" data-v="' + v + '" aria-pressed="' + (sore[m] === v) + '">' + t + '</button>').join('') + '</div></div>').join('') +
    (fx.length ? '<p class="pre-fx">' + fx.join(' · ') + '</p>' : '') + (left ? '' : '<button class="btn" id="preDone" type="button">סיום</button>') + '</div>';
}
function afterPre() { renderPre(); renderHero(); renderList(); updateProgress(); renderDock(); }

/* ---- swap: only movements of the same pattern and muscle, so the week keeps its shape ---- */
function openSwap(exId) {
  const e = findEx(exId); if (!e) return;
  const pe = planEx(exId), s = live(wkOf(exId)), started = !!s && rowsOf(s, exId).some(isDone), used = exList(wkOf(exId), s).map((x) => x.mv);
  const opt = (k) => {
    const o = LIB[k], b = bestFor(k);
    return '<li class="sw-opt"><canvas class="ex-thumb" data-anim="' + animOf(k) + '" aria-hidden="true"></canvas><div class="sw-t"><b>' + o.he + '</b><span>' + EQUIP[o.eq].he + ' · ' + Ltr(esc(EN[k])) + '</span>' +
      '<span class="tags">' + (k === pe.a ? '<span class="tagx">המקורי</span>' : '') + (o.jf ? '<span class="tagx ok">נוח למפרקים</span>' : '') + (used.includes(k) ? '<span class="tagx">כבר באימון</span>' : '') + (b ? '<span class="tagx">שיא ' + Ltr(fmtRow(b)) + '</span>' : '') + '</span></div>' +
      '<div class="sw-b">' + (started ? '' : '<button class="btn" type="button" data-sw="' + k + '" data-mode="today">רק היום</button>') + '<button class="btn primary" type="button" data-sw="' + k + '" data-mode="always">' + (started ? 'מהאימון הבא' : 'קבוע') + '</button></div></li>';
  };
  S.sheet = 'swap'; S.swEx = exId;
  const sh = $('#sheet');
  sh.innerHTML = '<div class="sheet-in sw" role="dialog" aria-modal="true" aria-label="החלפת תרגיל"><div class="ed-h"><div><p class="kicker">החלפת תרגיל</p><h2>' + e.he + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="סגור">' + ICON.x + '</button></div>' +
    '<p>אותו שריר, אותה תנועה. הסטים וההיסטוריה נשמרים.' + (started ? ' ההחלפה תחול מהאימון הבא.' : '') + '</p>' +
    '<ul class="sw-list">' + swapOptions(e).map(opt).join('') + '</ul>' +
    '<button class="btn ask" id="swAsk" type="button">' + ICON.cam + 'מכשיר אחר? שאל את אילון</button></div>';
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
      (st === 'ok' ? '' : '<span class="vol-flag">' + (st === 'under' ? '▼ מתחת למינימום (' + M.mev + ')' : '▲ מעל המקסימום (' + M.mrv + ')') + '</span>') + '</div>';
  }).join('');
}
function builderHTML() {
  return PLAN.map((wk, w) => {
    const s = live(w), dl = phase(w, s).dl;
    return '<div class="bl-w"><h4>' + wkFull(w) + (dl ? '<small>חצי מהסטים</small>' : '') + '</h4>' + exList(w, s).map((e) => '<div class="bl-row"><span class="bl-n"><b>' + e.he + '</b><small>' + MUSCLE[LIB[e.mv].p].he + ' · ' + Ltr(e.reps) + '</small></span>' +
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
  else if (S.msAsk === 'dl') act = '<span class="confirm"><span>להתחיל שבוע קל? אחריו מתחיל סבב חדש.</span><button class="btn primary" id="msDlYes" type="button">כן, שבוע קל</button><button class="btn" id="msNo" type="button">ביטול</button></span>';
  else if (S.msAsk === 'new') act = '<span class="confirm"><span>להתחיל סבב חדש משבוע 1?</span><button class="btn primary" id="msNewYes" type="button">כן, סבב חדש</button><button class="btn" id="msNo" type="button">ביטול</button></span>';
  else act = (M.early ? '<button class="btn" id="msDlOff" type="button">בטל שבוע קל</button>' : P.dl ? '' : '<button class="btn" id="msDl" type="button">שבוע קל עכשיו</button>') + '<button class="btn" id="msNew" type="button">סבב חדש</button>' +
    (mesoSessions(M.id).length ? '<button class="btn" type="button" data-sum="' + M.id + '">סיכום</button>' : '') + (past ? '<button class="btn" type="button" data-sum="' + past.id + '">סיכום סבב ' + past.n + '</button>' : '');
  sh.innerHTML = '<div class="sheet-in ms" role="dialog" aria-modal="true" aria-label="סבב ותוכנית"><div class="ed-h"><div><p class="kicker">סבב ' + P.n + (M.early && !over ? ' · שבוע קל מוקדם' : '') + '</p><h2>' + (P.dl ? 'שבוע קל' : 'שבוע ' + P.wk + ' <small>מתוך ' + W + '</small>') + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="סגור">' + ICON.x + '</button></div>' +
    '<ol class="wk-strip">' + strip + '</ol>' +
    '<p>כמה חזרות משאירים לפני כשל: כל שבוע חזרה אחת פחות. השבוע האחרון קל.</p>' +
    '<section><h3>סטים בשבוע לפי שריר</h3><p class="ms-sub">הרצועה הבהירה היא הטווח המומלץ.</p><div class="vol">' + volHTML(P.dl) + '</div></section>' +
    '<section><h3>סטים בתוכנית</h3><p class="ms-sub">שינוי חל מהאימון הבא.</p>' + builderHTML() + '</section>' +
    '<section><h3>קפיצת משקל</h3><div class="inc">' + Object.keys(EQUIP).map((k) => '<label class="inc-row"><span>' + EQUIP[k].he + '</span><select data-inc="' + k + '">' + INC_CHOICES.map((v) => '<option value="' + v + '"' + (v === (+S.cfg.inc[k] || EQUIP[k].inc) ? ' selected' : '') + '>' + v + ' ק״ג</option>').join('') + '</select></label>').join('') + '</div></section>' +
    '<section><h3>אורך הסבב</h3><div class="bl-row"><span class="bl-n"><b>' + W + ' שבועות</b><small>האחרון קל</small></span><div class="stp"><button type="button" data-weeks="' + (W - 1) + '" aria-label="שבוע פחות"' + (W <= 4 ? ' disabled' : '') + '>−</button><b>' + W + '</b><button type="button" data-weeks="' + (W + 1) + '" aria-label="שבוע נוסף"' + (W >= 7 ? ' disabled' : '') + '>+</button></div></div></section>' +
    '<div class="ed-act ms-act">' + act + '</div></div>';
  $('.sheet-in', sh).scrollTop = top;
}
function openMeso() { S.sheet = 'meso'; S.msAsk = null; renderMeso(); $('#sheet').hidden = false; }
/* the end-of-mesocycle card: volume from start to peak, strength per movement, and the movements that answered best */
/* what a finished workout brought, as one line on the sheets that take the place of the workout's own summary */
const xpLine = (R) => (R ? '<p class="xp-line"><span class="xp-tag">' + Ltr('+' + nf(R.y.xp)) + '</span><span>רמה ' + R.to.lvl + ' · ' + rankOf(R.to.lvl).he + (R.to.lvl > R.from.lvl ? ' · עלית רמה' : '') + '</span></p>' : '');
function showMesoSummary(id, justDone, R) {
  const M = mesoSummary(id), n = +String(id).slice(1) || 1, sh = $('#sheet'), avg = M.gains.length ? M.gains.reduce((a, g) => a + g.pct, 0) / M.gains.length : null;
  const sign = (p) => Ltr((p >= 0 ? '+' : '−') + Math.abs(p).toFixed(1) + '%');
  let body = '<p>עוד אין אימונים בסבב הזה.</p>';
  if (M.n) {
    body = '<div class="stats"><div><b>' + (M.sets ? fmtN(M.sets.peak) : '–') + '</b><span>סטים בשבוע השיא</span></div><div><b>' + (avg == null ? '–' : sign(avg)) + '</b><span>שינוי כוח</span></div><div><b>' + M.n + '</b><span>אימונים</span></div></div>' +
      (M.mus.length ? '<section><h3>סטים לפי שריר</h3><ul class="sum-list">' + M.mus.map((m) => '<li><span>' + MUSCLE[m.k].he + '</span><span>' + (m.weeks > 1 && m.peak !== m.start ? Ltr(fmtN(m.start) + ' ← ' + fmtN(m.peak)) + ' סטים בשבוע' : '<b>' + fmtN(m.peak) + '</b> סטים בשבוע') + '</span></li>').join('') + '</ul></section>' : '') +
      '<section><h3>שינוי כוח לפי תרגיל</h3>' + (M.gains.length ? '<ul class="sum-list">' + M.gains.slice(0, 14).map((g) => '<li><span>' + LIB[g.mv].he + '</span><span>' + Ltr(fmtRow(g.first)) + ' ← ' + Ltr(fmtRow(g.best)) + ' · <b class="' + (g.pct > 0.4 ? 'up' : g.pct < -0.4 ? 'dn' : '') + '">' + sign(g.pct) + '</b></span></li>').join('') + '</ul>' : '<p class="ms-sub">צריך שני אימונים של אותו תרגיל.</p>') + '</section>' +
      '<section><h3>התרגילים שהגיבו הכי טוב</h3>' + (M.top.length ? '<ul class="sum-list">' + M.top.map((t) => '<li><span>' + LIB[t.mv].he + '</span><span>תחושה ' + (t.pump >= 1.5 ? 'חזקה' : 'בינונית') + ' · ' + (t.pain === 0 ? 'בלי כאב' : 'כאב קל לפעמים') + '</span></li>').join('') + '</ul>' : '<p class="ms-sub">עוד אין מספיק משוב.</p>') + '</section>';
  }
  S.sheet = 'msum';
  sh.innerHTML = '<div class="sheet-in ms" role="dialog" aria-modal="true" aria-label="סיכום סבב"><div class="ed-h"><div><p class="kicker">' + (justDone ? 'הסבב הושלם' : 'סיכום') + '</p><h2>סבב ' + n + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="סגור">' + ICON.x + '</button></div>' + xpLine(R) + body +
    (justDone ? '<p>האימון הבא פותח סבב חדש.</p>' : '') + '<button class="btn primary big" id="sheetClose" type="button">סגור</button></div>';
  sh.hidden = false;
}
/* two workouts in a row fell short for two muscle groups or more: offer the deload now */
function showDeloadOffer(s, R) {
  const mus = Array.from(missedMuscles(s)).map((k) => MUSCLE[k].he), sh = $('#sheet');
  S.sheet = 'dlo';
  sh.innerHTML = '<div class="sheet-in" role="dialog" aria-modal="true" aria-label="הצעה לשבוע קל"><p class="kicker">' + wkOrd(s.w) + ' הושלם</p><h2>סימני עייפות</h2>' + xpLine(R) +
    '<p>פעמיים ברצף לא הגעת ליעד (היום: ' + mus.join(', ') + '). בדרך כלל זו עייפות שהצטברה.</p>' +
    '<p><b>שבוע קל:</b> חצי מהסטים ופחות משקל. אחריו מתחיל סבב חדש.</p>' +
    '<button class="btn primary big" id="dlYes" type="button">להתחיל שבוע קל</button><button class="btn big" data-close="1" type="button">לא עכשיו</button></div>';
  sh.hidden = false;
}
function startDeload() { S.cfg.meso.early = Date.now(); saveCfg(); S.bannerKind = ''; S.banner = '<b>שבוע קל התחיל.</b> חצי מהסטים ופחות משקל בארבעת האימונים הבאים.'; }
/* clicks inside the sheet that belong to this file; returns true when the click was handled */
function coachSheetClick(ev, id) {
  const b = ev.target.closest('button'), ds = b ? b.dataset : {};
  if (ds.sw) {
    const exId = S.swEx, now = swapTo(exId, ds.sw, ds.mode === 'always'), w = wkOf(exId);
    S.bannerKind = ''; S.banner = (now ? 'הוחלף: ' : 'מהאימון הבא: ') + LIB[ds.sw].he + (ds.mode === 'always' ? '' : ' (רק היום)') + '.';
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
  if (id === 'msNewYes') { newMeso(); S.msAsk = null; S.bannerKind = ''; S.banner = '<b>סבב ' + S.cfg.meso.n + ' התחיל.</b>'; closeSheet(); return true; }
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
