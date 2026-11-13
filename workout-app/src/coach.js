/* ================================================================== recovery check, exercise swap, mesocycle sheet */
const SORE = ['לא נתפס', 'החלים', 'עדיין תפוס'];
const fmtN = (v) => String(Math.round(v * 10) / 10);
/* muscles today's workout trains directly that have been trained before */
function preMuscles(w) { const out = []; for (const pe of planSlots(w)) { const mu = LIB[pe.a].p; if (!out.includes(mu) && lastTrained(mu)) out.push(mu); } return out; }
/* what the recovery answers change in today's workout, in words */
function soreEffects(w, sore) {
  const P = phaseNext(w), out = [];
  if (P.dl) return out;
  const a = planned(w, {}), b = planned(w, sore), s = live(w);
  for (const pe of planSlots(w)) { const d = b[pe.id] - a[pe.id]; if (d) out.push((d > 0 ? say('סט נוסף: ', 'One more set: ') : say('סט פחות: ', 'One set less: ')) + findEx(pe.id, s).nm); }
  for (const mu of Object.keys(sore)) if (sore[mu] === 2) out.push('חזרה פחות ל' + MUSCLE[mu].he);
  return out;
}
/* before the first set: did the muscles recover from their last workout? The question takes the screen until it is answered or skipped.
   One tap says yes. "Not quite" opens the muscles one by one: still sore takes a set off and stops a rep earlier; never sore after easy work adds a set */
function renderPre() {
  const box = $('#pre'), w = S.tab, s = live(w), mus = (s && hasDone(s)) || phase(w, s).dl ? [] : preMuscles(w);
  const sore = soreOf(w, s), left = mus.filter((m) => sore[m] == null).length, fx = soreEffects(w, sore), on = mus.length > 0 && S.preSkip !== w && (left > 0 || !!S.preOpen);
  $('#app').classList.toggle('pre-on', on);
  box.hidden = !on;
  if (!on) { box.innerHTML = ''; S.preOpen = false; return; }
  if (!S.preOpen) {
    box.innerHTML = '<div class="pre gate"><span class="pre-ic" aria-hidden="true">' + ICON.check + '</span><h2>' + say('השרירים התאוששו?', 'Have your muscles recovered?') + '</h2><p>' + say('מהאימון הקודם שלהם', 'Since they were last trained') + '</p>' +
      '<div class="pre-q"><button class="btn primary big" id="preAll" type="button">' + say('כן, הכול טוב', 'Yes, all good') + '</button><button class="btn big" id="preEdit" type="button">' + say('לא לגמרי', 'Not quite') + '</button></div>' +
      '<button class="link" id="preSkip" type="button">' + say('דלג', 'Skip') + '</button></div>';
    return;
  }
  box.innerHTML = '<div class="pre"><div class="pre-h"><b>' + say('מה עדיין תפוס?', 'What is still sore?') + '</b><button class="link" id="preAll" type="button">' + say('הכול החלים', 'All recovered') + '</button></div>' +
    mus.map((m) => '<div class="pre-row"><span>' + MUSCLE[m].he + '</span><div class="seg" role="group" aria-label="' + MUSCLE[m].he + '">' + SORE.map((t, v) => '<button type="button" data-mu="' + m + '" data-v="' + v + '" aria-pressed="' + (sore[m] === v) + '">' + t + '</button>').join('') + '</div></div>').join('') +
    (fx.length ? '<p class="pre-fx">' + fx.join(' · ') + '</p>' : '') + '<button class="btn primary big" id="preDone" type="button">' + say('המשך', 'Continue') + '</button></div>';
}
function afterPre() { renderPre(); renderHero(); renderList(); updateProgress(); renderDock(); }

/* ---- the exercise picker: change the exercise of a slot, or add one to a workout.
   For a change, movements of the same kind come first: they keep the slot's numbers and history. Any other is a tap on its muscle away ---- */
function pickOptions(P) {
  if (P.mode === 'swap' && P.mu === 'rec') return swapOptions(findEx(P.ex));
  const cur = P.mode === 'swap' ? findEx(P.ex).mv : null;
  return Object.keys(LIB).filter((k) => LIB[k].p === P.mu && k !== cur);
}
function renderPick() {
  const P = S.pick, sh = $('#sheet'), old = $('.sheet-in', sh), top = old ? old.scrollTop : 0, swap = P.mode === 'swap', e = swap ? findEx(P.ex) : null, w = swap ? wkOf(P.ex) : P.w;
  if (swap && !e) { closeSheet(); return; }
  const pe = swap ? planEx(P.ex) : null, s = live(w), started = swap && !!s && rowsOf(s, P.ex).some(isDone), used = exList(w, s).map((x) => x.mv);
  const same = (k) => swap && LIB[k].pat === LIB[pe.a].pat && LIB[k].p === LIB[pe.a].p;
  const opt = (k) => {
    const o = LIB[k], b = bestFor(k), later = say('מהאימון הבא', 'From next time');
    return '<li class="sw-opt"><canvas class="ex-thumb" data-anim="' + animOf(k) + '" aria-hidden="true"></canvas><div class="sw-t"><b>' + mvName(k) + '</b><span>' + eqName(o.eq) + (LANG === 'he' ? ' · ' + Ltr(esc(EN[k])) : '') + '</span>' +
      '<span class="tags">' + (swap && k === pe.a ? '<span class="tagx">' + say('המקורי', 'The original') + '</span>' : '') + (o.jf ? '<span class="tagx ok">' + say('נוח למפרקים', 'Easy on the joints') + '</span>' : '') + (used.includes(k) ? '<span class="tagx">' + say('כבר באימון', 'Already in this workout') + '</span>' : '') + (b ? '<span class="tagx">' + say('שיא ', 'Best ') + Ltr(fmtRow(b)) + '</span>' : '') + '</span></div>' +
      '<div class="sw-b">' + (!swap ? '<button class="btn primary" type="button" data-add="' + k + '">' + say('הוסף', 'Add') + '</button>'
        : same(k) ? (started ? '' : '<button class="btn" type="button" data-sw="' + k + '" data-mode="today">' + say('רק היום', 'Today only') + '</button>') + '<button class="btn primary" type="button" data-sw="' + k + '" data-mode="always">' + (started ? later : say('קבוע', 'For good')) + '</button>'
        : '<button class="btn primary" type="button" data-sw="' + k + '" data-mode="always">' + (started ? later : say('החלף', 'Swap')) + '</button>') + '</div></li>';
  };
  const mus = Object.keys(MUSCLE).filter((k) => Object.keys(LIB).some((m) => LIB[m].p === k)), chips = (swap ? [['rec', say('מומלץ', 'Suggested')]] : []).concat(mus.map((k) => [k, muName(k)]));
  const list = pickOptions(P);
  sh.innerHTML = '<div class="sheet-in sw" role="dialog" aria-modal="true" aria-label="' + (swap ? say('החלפת תרגיל', 'Swap exercise') : say('הוספת תרגיל', 'Add exercise')) + '"><div class="ed-h"><div><p class="kicker">' + (swap ? say('החלפת תרגיל', 'Swap exercise') : say('הוספת תרגיל · ', 'Add exercise · ') + wkName(w)) + '</p><h2>' + (swap ? e.nm : say('מה מוסיפים?', 'What to add?')) + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    '<div class="mu-row" role="group" aria-label="' + say('סינון לפי שריר', 'Filter by muscle') + '">' + chips.map((c) => '<button type="button" data-pick="' + c[0] + '" aria-pressed="' + (c[0] === P.mu) + '">' + c[1] + '</button>').join('') + '</div>' +
    (swap ? '<p>' + (P.mu === 'rec' ? say('אותו שריר, אותה תנועה. הסטים וההיסטוריה נשמרים.', 'Same muscle, same movement. Sets and history are kept.') : say('תרגיל מסוג אחר מקבל סטים וחזרות שמתאימים לו.', 'A different kind of exercise gets sets and reps that suit it.')) + (started ? say(' ההחלפה תחול מהאימון הבא.', ' The change starts next workout.') : '') + '</p>' : '') +
    (list.length ? '<ul class="sw-list">' + list.map(opt).join('') + '</ul>' : '<p class="ms-sub">' + say('אין כאן תרגילים נוספים.', 'No other exercises here.') + '</p>') +
    (swap ? '<button class="btn ask" id="swAsk" type="button">' + ICON.cam + say('מכשיר אחר? שאל את אילון', 'Another machine? Ask Eilon') + '</button>' : '') + '</div>';
  $('.sheet-in', sh).scrollTop = top; sh.hidden = false; drawThumbs();
  /* the chosen muscle stays in sight in its row */
  const on = $('.mu-row [aria-pressed="true"]', sh); if (on && on.scrollIntoView) on.scrollIntoView({ inline: 'center', block: 'nearest' });
}
function openSwap(exId) { if (!findEx(exId)) return; S.sheet = 'swap'; S.swEx = exId; S.pick = { mode: 'swap', ex: exId, mu: 'rec' }; renderPick(); }
function openAdd(w) { S.sheet = 'swap'; S.pick = { mode: 'add', w, mu: w % 2 ? 'quads' : 'chest' }; renderPick(); }

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
/* each workout as a list: set counts by default; "reorder and remove" turns the rows into arrows and a cross; adding opens the picker */
function builderHTML() {
  return PLAN.map((wk, w) => {
    const s = live(w), dl = phase(w, s).dl, ids = planIds(w), ed = S.blEdit === w;
    return '<div class="bl-w"><h4>' + wkFull(w) + (dl ? '<small>' + say('חצי מהסטים', 'Half the sets') + '</small>' : '') + '</h4>' + exList(w, s).map((e) => {
      const k = ids.indexOf(e.id);
      return '<div class="bl-row"><span class="bl-n"><b>' + e.nm + '</b><small>' + muName(LIB[e.mv].p) + ' · ' + Ltr(e.reps) + '</small></span>' +
        (k < 0 ? '<span class="tagx">' + say('רק היום', 'Today only') + '</span>'
          : ed ? '<div class="bl-ed"><button type="button" data-mvs="' + e.id + '" data-d="-1" aria-label="' + say('הזז למעלה', 'Move up') + '"' + (k <= 0 ? ' disabled' : '') + '>' + ICON.up + '</button><button type="button" data-mvs="' + e.id + '" data-d="1" aria-label="' + say('הזז למטה', 'Move down') + '"' + (k >= ids.length - 1 ? ' disabled' : '') + '>' + ICON.down + '</button><button class="rm" type="button" data-rm="' + e.id + '" aria-label="' + say('הסר את ', 'Remove ') + e.nm + '"' + (ids.length <= 1 ? ' disabled' : '') + '>' + ICON.x + '</button></div>'
          : '<div class="stp"><button type="button" data-base="' + e.id + '" data-n="' + (e.n0 - 1) + '" aria-label="' + say('סט אחד פחות', 'One set less') + '"' + (dl || e.n0 <= 1 ? ' disabled' : '') + '>−</button><b>' + e.n0 + '</b><button type="button" data-base="' + e.id + '" data-n="' + (e.n0 + 1) + '" aria-label="' + say('סט נוסף', 'One more set') + '"' + (dl || e.n0 >= MAX_SETS ? ' disabled' : '') + '>+</button></div>') + '</div>';
    }).join('') + '<div class="bl-act"><button class="link" type="button" data-addw="' + w + '">' + say('+ הוסף תרגיל', '+ Add exercise') + '</button><button class="link" type="button" data-bled="' + w + '">' + (ed ? say('סיום', 'Done') : say('סידור והסרה', 'Reorder and remove')) + '</button></div></div>';
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
  else if (S.msAsk === 'plan') act = '<span class="confirm"><span>' + say('להחזיר את רשימת התרגילים המקורית?', 'Bring back the original list of exercises?') + '</span><button class="btn primary" id="planResetYes" type="button">' + say('כן, אפס', 'Yes, reset') + '</button><button class="btn" id="msNo" type="button">' + say('ביטול', 'Cancel') + '</button></span>';
  else if (S.msAsk === 'new') act = '<span class="confirm"><span>להתחיל סבב חדש משבוע 1?</span><button class="btn primary" id="msNewYes" type="button">כן, סבב חדש</button><button class="btn" id="msNo" type="button">ביטול</button></span>';
  else act = (M.early ? '<button class="btn" id="msDlOff" type="button">בטל שבוע קל</button>' : P.dl ? '' : '<button class="btn" id="msDl" type="button">שבוע קל עכשיו</button>') + '<button class="btn" id="msNew" type="button">סבב חדש</button>' +
    (mesoSessions(M.id).length ? '<button class="btn" type="button" data-sum="' + M.id + '">סיכום</button>' : '') + (past ? '<button class="btn" type="button" data-sum="' + past.id + '">סיכום סבב ' + past.n + '</button>' : '') +
    (planChanged() ? '<button class="btn" id="planReset" type="button">' + say('איפוס תרגילים', 'Reset exercises') + '</button>' : '');
  sh.innerHTML = '<div class="sheet-in ms" role="dialog" aria-modal="true" aria-label="סבב ותוכנית"><div class="ed-h"><div><p class="kicker">סבב ' + P.n + (M.early && !over ? ' · שבוע קל מוקדם' : '') + '</p><h2>' + (P.dl ? 'שבוע קל' : 'שבוע ' + P.wk + ' <small>מתוך ' + W + '</small>') + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="סגור">' + ICON.x + '</button></div>' +
    '<ol class="wk-strip">' + strip + '</ol>' +
    '<p>כמה חזרות משאירים לפני כשל: כל שבוע חזרה אחת פחות. השבוע האחרון קל.</p>' +
    '<section><h3>סטים בשבוע לפי שריר</h3><p class="ms-sub">הרצועה הבהירה היא הטווח המומלץ.</p><div class="vol">' + volHTML(P.dl) + '</div></section>' +
    '<section><h3>' + say('התרגילים והסטים', 'Exercises and sets') + '</h3>' + builderHTML() + '</section>' +
    '<section><h3>קפיצת משקל</h3><div class="inc">' + Object.keys(EQUIP).map((k) => '<label class="inc-row"><span>' + EQUIP[k].he + '</span><select data-inc="' + k + '">' + INC_CHOICES.map((v) => '<option value="' + v + '"' + (v === (+S.cfg.inc[k] || EQUIP[k].inc) ? ' selected' : '') + '>' + v + ' ק״ג</option>').join('') + '</select></label>').join('') + '</div></section>' +
    '<section><h3>אורך הסבב</h3><div class="bl-row"><span class="bl-n"><b>' + W + ' שבועות</b><small>האחרון קל</small></span><div class="stp"><button type="button" data-weeks="' + (W - 1) + '" aria-label="שבוע פחות"' + (W <= 4 ? ' disabled' : '') + '>−</button><b>' + W + '</b><button type="button" data-weeks="' + (W + 1) + '" aria-label="שבוע נוסף"' + (W >= 7 ? ' disabled' : '') + '>+</button></div></div></section>' +
    '<div class="ed-act ms-act">' + act + '</div></div>';
  $('.sheet-in', sh).scrollTop = top;
}
function openMeso() { S.sheet = 'meso'; S.msAsk = null; S.blEdit = null; renderMeso(); $('#sheet').hidden = false; }
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
  if (ds.pick && S.pick) { S.pick.mu = ds.pick; renderPick(); return true; }
  if (ds.add && S.pick) { const w = S.pick.w, id = addSlot(w, ds.add); S.pick = null; S.sheet = 'meso'; S.msAsk = null; renderMeso(); if (id) { const row = $('#sheet [data-base="' + id + '"]'); if (row) row.closest('.bl-row').scrollIntoView({ block: 'center' }); } return true; }
  if (ds.sw && S.pick) {
    const exId = S.pick.ex, pe = planEx(exId), w = wkOf(exId), mv = ds.sw, same = LIB[mv].pat === LIB[pe.a].pat && LIB[mv].p === LIB[pe.a].p;
    let now, at = exId;
    if (same) now = swapTo(exId, mv, ds.mode === 'always');
    else { const s = live(w); now = !(s && rowsOf(s, exId).some(isDone)); at = replaceSlot(exId, mv) || exId; }
    S.bannerKind = ''; S.banner = (now ? say('הוחלף: ', 'Swapped: ') : say('מהאימון הבא: ', 'From next workout: ')) + mvName(mv) + (ds.mode === 'always' ? '' : say(' (רק היום)', ' (today only)')) + '.';
    if (S.tab === w) S.open = now ? at : exId;
    S.draft = null; S.pick = null; closeSheet(); return true;
  }
  if (id === 'swAsk') { const exId = S.swEx; closeSheet(); openChat(exId); return true; }
  if (ds.base) { setBase(ds.base, +ds.n); renderMeso(); return true; }
  if (ds.addw) { openAdd(+ds.addw); return true; }
  if (ds.bled) { S.blEdit = S.blEdit === +ds.bled ? null : +ds.bled; renderMeso(); return true; }
  if (ds.mvs) { moveSlot(ds.mvs, +ds.d); renderMeso(); return true; }
  if (ds.rm) { removeSlot(ds.rm); renderMeso(); return true; }
  if (id === 'planReset') { S.msAsk = 'plan'; renderMeso(); return true; }
  if (id === 'planResetYes') { resetPlan(); S.msAsk = null; S.blEdit = null; renderMeso(); return true; }
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
    else if (b.id === 'preDone') { S.preOpen = false; S.preSkip = S.tab; }
    else if (b.id === 'preSkip') S.preSkip = S.tab;
    afterPre();
  });
}
