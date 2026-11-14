/* ================================================================== recovery check, exercise swap, mesocycle sheet */
const SORE = () => [say('לא נתפס', 'Never sore'), say('החלים', 'Recovered'), say('עדיין תפוס', 'Still sore')];
const fmtN = (v) => String(Math.round(v * 10) / 10);
/* muscles today's workout trains directly that have been trained before */
function preMuscles(w) { const out = []; for (const pe of planSlots(w)) { const mu = LIB[pe.a].p; if (!out.includes(mu) && lastTrained(mu)) out.push(mu); } return out; }
/* what the recovery answers change in today's workout, in words */
function soreEffects(w, sore) {
  const P = phaseNext(w), out = [];
  if (P.dl) return out;
  const a = planned(w, {}), b = planned(w, sore), s = live(w);
  for (const pe of planSlots(w)) { const d = b[pe.id] - a[pe.id]; if (d) out.push((d > 0 ? say('סט נוסף: ', 'One more set: ') : say('סט פחות: ', 'One set less: ')) + findEx(pe.id, s).nm); }
  for (const mu of Object.keys(sore)) if (sore[mu] === 2) out.push(say('חזרה פחות ל' + MUSCLE[mu].he, 'One rep less for ' + muLow(mu)));
  return out;
}
/* how long there is today: the choices that are shorter than the whole workout, each with what it keeps. null when the whole
   workout is short already, so that there is nothing to choose */
function timeChoices(w) {
  const all = exList(w, null, true), full = workMins(all), opts = [];
  for (const m of [30, 45, 60]) {
    /* a shorter day is worth asking about only when it saves ten minutes or more */
    if (m > full - 10) break;
    const ids = fitDay(w, m), list = ids ? all.filter((e) => ids.includes(e.id)) : all;
    if (list.length < all.length && !opts.some((o) => o.n === list.length)) opts.push({ m, n: list.length, mins: workMins(list) });
  }
  return opts.length ? { full, n: all.length, opts } : null;
}
/* before the first set, two things can take the screen, one after the other, each until it is answered.
   First: how long is there today? One tap, and the workout is cut to it for today (see setDay); the whole workout is one of the taps.
   Then: did the muscles recover from their last workout? One tap says yes. "Not quite" opens the muscles one by one: still sore
   takes a set off and stops a rep earlier; never sore after easy work adds a set */
function renderPre() {
  const box = $('#pre'), w = S.tab, s = live(w), TC = (s && S.timeAsk !== w) || (s && hasDone(s)) || dayOf(w) ? null : timeChoices(w);
  if (TC) {
    const usual = S.cfg.me.time, tile = (v, mins, n, cls, tag) => '<button class="pre-t' + cls + '" type="button" data-time="' + v + '"><b>' + Ltr(mins) + '</b><span>' + say('דקות', 'minutes') + '</span><small>' + (tag ? tag + ' · ' : '') + cnt(n, 'תרגילים', 'תרגיל אחד', 'exercises', 'exercise') + '</small></button>';
    $('#app').classList.add('pre-on');
    if (box.hidden) S.preAt = Date.now();
    box.hidden = false;
    box.innerHTML = '<div class="pre gate time"><span class="pre-ic" aria-hidden="true">' + ICON.clock + '</span><h2>' + say('כמה זמן יש לך היום?', 'How much time do you have today?') + '</h2><p>' + say('אתאים את האימון לזמן שלך', 'I will fit the workout to your time') + '</p>' +
      '<div class="pre-times" role="group" aria-label="' + say('אורך האימון היום', 'Today\'s length') + '">' + TC.opts.map((o) => tile(o.m, o.mins, o.n, usual === o.m ? ' usual' : '', '')).join('') + tile(0, TC.full, TC.n, ' full', say('כל האימון', 'The whole workout')) + '</div></div>';
    return;
  }
  const mus = (s && hasDone(s)) || phase(w, s).dl ? [] : preMuscles(w);
  const sore = soreOf(w, s), left = mus.filter((m) => sore[m] == null).length, fx = soreEffects(w, sore), on = mus.length > 0 && S.preSkip !== w && (left > 0 || !!S.preOpen);
  $('#app').classList.toggle('pre-on', on);
  if (on && box.hidden) S.preAt = Date.now();
  box.hidden = !on;
  if (!on) { box.innerHTML = ''; S.preOpen = false; return; }
  if (!S.preOpen) {
    box.innerHTML = '<div class="pre gate"><h2>' + say('השרירים התאוששו?', 'Have your muscles recovered?') + '</h2><p>' + say('מהאימון הקודם שלהם', 'Since they were last trained') + '</p>' +
      '<div class="pre-q"><button class="btn primary big" id="preAll" type="button">' + say('כן, הכול טוב', 'Yes, all good') + '</button><button class="btn big" id="preEdit" type="button">' + say('לא לגמרי', 'Not quite') + '</button></div>' +
      '<button class="link" id="preSkip" type="button">' + say('דלג', 'Skip') + '</button></div>';
    return;
  }
  box.innerHTML = '<div class="pre"><div class="pre-h"><b>' + say('מה עדיין תפוס?', 'What is still sore?') + '</b><button class="link" id="preAll" type="button">' + say('הכול החלים', 'All recovered') + '</button></div>' +
    mus.map((m) => '<div class="pre-row"><span>' + muName(m) + '</span><div class="seg" role="group" aria-label="' + muName(m) + '">' + SORE().map((t, v) => '<button type="button" data-mu="' + m + '" data-v="' + v + '" aria-pressed="' + (sore[m] === v) + '">' + t + '</button>').join('') + '</div></div>').join('') +
    (fx.length ? '<p class="pre-fx">' + fx.join(' · ') + '</p>' : '') + '<button class="btn primary big" id="preDone" type="button">' + say('המשך', 'Continue') + '</button></div>';
}
function afterPre() { renderPre(); renderHero(); renderList(); updateProgress(); renderDock(); }

/* ---- the exercise picker: change the exercise of a slot, or add one to a workout.
   For a change, movements of the same kind come first: they keep the slot's numbers and history; every other one waits behind
   "other exercises". A tap on a row chooses it, and only then comes the one question a change needs: today only, or for good ---- */
function pickOptions(P) {
  if (P.mode === 'swap' && P.mu === 'rec') return swapOptions(findEx(P.ex));
  const cur = P.mode === 'swap' ? findEx(P.ex).mv : null;
  return Object.keys(LIB).filter((k) => LIB[k].p === P.mu && k !== cur);
}
function renderPick() {
  const P = S.pick, sh = $('#sheet'), old = $('.sheet-in', sh), top = old ? old.scrollTop : 0, swap = P.mode === 'swap', e = swap ? findEx(P.ex) : null, w = swap ? wkOf(P.ex) : P.w;
  if (swap && !e) { closeSheet(); return; }
  const pe = swap ? planEx(P.ex) : null, s = live(w), started = swap && !!s && rowsOf(s, P.ex).some(isDone), used = exList(w, s).map((x) => x.mv), rec = swap && P.mu === 'rec';
  const same = (k) => swap && LIB[k].pat === LIB[pe.a].pat && LIB[k].p === LIB[pe.a].p;
  const opt = (k) => {
    const o = LIB[k], on = swap && P.sel === k;
    const meta = [[eqName(o.eq), ''], [o.jf ? say('נוח למפרקים', 'easy on the joints') : '', ' jf'], [swap && k === pe.a ? say('המקורי', 'the original') : '', ' og'], [used.includes(k) ? say('כבר באימון', 'already in this workout') : '', ' in']].filter((x) => x[0]).map((x) => '<i class="sw-tag' + x[1] + '">' + x[0] + '</i>').join(' ');
    return '<li class="sw-opt' + (on ? ' on' : '') + '"><button class="sw-row" type="button" ' + (swap ? 'data-sel="' + k + '" aria-expanded="' + on + '"' : 'data-add="' + k + '"') + '><span class="sw-pic"><canvas class="ex-thumb" data-anim="' + animOf(k) + '" aria-hidden="true"></canvas></span><span class="sw-t"><b>' + mvName(k) + '</b><span class="sw-tags">' + meta + '</span></span></button>' +
      (on ? '<div class="sw-b">' + (same(k) && !started ? '<button class="btn" type="button" data-sw="' + k + '" data-mode="today">' + say('רק היום', 'Today only') + '</button><button class="btn primary" type="button" data-sw="' + k + '" data-mode="always">' + say('קבוע', 'For good') + '</button>'
        : '<button class="btn primary" type="button" data-sw="' + k + '" data-mode="always">' + (started ? say('מהאימון הבא', 'From next workout') : say('החלף', 'Swap')) + '</button>') + '</div>' : '') + '</li>';
  };
  const mus = Object.keys(MUSCLE).filter((k) => Object.keys(LIB).some((m) => LIB[m].p === k)), chips = (swap ? [['rec', say('מומלץ', 'Suggested')]] : []).concat(mus.map((k) => [k, muName(k)]));
  const list = pickOptions(P);
  sh.innerHTML = '<div class="sheet-in sw" role="dialog" aria-modal="true" aria-label="' + (swap ? say('החלפת תרגיל', 'Swap exercise') : say('הוספת תרגיל', 'Add exercise')) + '"><div class="card next w' + w + ' sw-hero"><div class="next-top"><p class="k">' + (swap ? e.nm : say('הוספת תרגיל · ', 'Add exercise · ') + wkName(w)) + '</p><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div><h2>' + (swap ? say('במה להחליף?', 'Swap it for what?') : say('מה מוסיפים?', 'What to add?')) + '</h2>' +
    (swap ? '<p class="meta">' + (rec ? say('אותו שריר, אותה תנועה. ההיסטוריה נשמרת.', 'Same muscle, same movement. History is kept.') : say('תרגיל מסוג אחר מקבל סטים וחזרות שמתאימים לו.', 'A different kind of exercise gets sets and reps that suit it.')) + (started ? say(' ההחלפה תחול מהאימון הבא.', ' The change starts next workout.') : '') + '</p>' : '') + '</div>' +
    (rec ? '' : '<div class="mu-row" role="group" aria-label="' + say('סינון לפי שריר', 'Filter by muscle') + '">' + chips.map((c) => '<button type="button" data-pick="' + c[0] + '" aria-pressed="' + (c[0] === P.mu) + '">' + c[1] + '</button>').join('') + '</div>') +
    (list.length ? '<ul class="sw-list">' + list.map(opt).join('') + '</ul>' : '<p class="ms-sub">' + say('אין כאן תרגילים נוספים.', 'No other exercises here.') + '</p>') +
    (swap ? '<div class="sw-more">' + (rec ? '<button class="link" type="button" data-pick="' + LIB[pe.a].p + '">' + say('תרגילים אחרים', 'Other exercises') + '</button>' : '') + '<button class="link" id="swAsk" type="button">' + say('מכשיר אחר? שאל את אילון', 'Another machine? Ask Eilon') + '</button></div>' : '') + '</div>';
  $('.sheet-in', sh).scrollTop = top; sh.hidden = false; drawThumbs();
  /* the chosen muscle stays in sight in its row, and so do the buttons of the chosen exercise */
  const mu = $('.mu-row [aria-pressed="true"]', sh); if (mu && mu.scrollIntoView) mu.scrollIntoView({ inline: 'center', block: 'nearest' });
  const on = $('.sw-opt.on', sh); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
}
function openSwap(exId) { if (!findEx(exId)) return; S.sheet = 'swap'; S.swEx = exId; S.pick = { mode: 'swap', ex: exId, mu: 'rec' }; renderPick(); }
function openAdd(w) { S.sheet = 'swap'; S.pick = { mode: 'add', w, mu: w % 2 ? 'quads' : 'chest' }; renderPick(); }

/* ---- mesocycle sheet: the weekly ramp, volume per muscle against its landmarks, set counts, increments ---- */
function volHTML(dl) {
  const vol = muscleVolume(weekItems()), pct = (v) => Math.min(100, (v / 30) * 100).toFixed(1);
  return Object.keys(MUSCLE).map((k) => {
    const v = vol[k], tot = v.d + v.i, M = MUSCLE[k], st = dl ? 'ok' : landmark(k, tot);
    return '<div class="vol-row ' + st + '"><span class="vol-n">' + muName(k) + '</span>' +
      '<div class="vol-bar" role="img" aria-label="' + muName(k) + ': ' + fmtN(tot) + say(' סטים בשבוע. הטווח המומלץ: ', ' sets a week. Suggested range: ') + M.mev + say(' עד ', ' to ') + M.mrv + '"><i class="band" style="inset-inline-start:' + pct(M.mev) + '%;width:' + pct(M.mrv - M.mev) + '%"></i><i class="val" style="width:' + pct(tot) + '%"></i></div>' +
      '<span class="vol-v"><b>' + fmtN(tot) + '</b></span>' +
      (st === 'ok' ? '' : '<span class="vol-flag">' + (st === 'under' ? say('▼ מתחת למינימום (', '▼ Below the minimum (') + M.mev + ')' : say('▲ מעל המקסימום (', '▲ Above the maximum (') + M.mrv + ')') + '</span>') + '</div>';
  }).join('');
}
/* one workout as a list: set counts by default; "reorder and remove" turns the rows into arrows and a cross; adding opens the picker */
function builderHTML(w) {
  const s = live(w), dl = phase(w, s).dl, ids = planIds(w), ed = S.blEdit === w;
  return (dl ? '<p class="ms-sub">' + say('שבוע קל: חצי מהסטים.', 'Easy week: half the sets.') + '</p>' : '') + '<div class="bl-w">' + exList(w, s, true).map((e) => {
    const k = ids.indexOf(e.id);
    return '<div class="bl-row"><span class="bl-n"><b>' + e.nm + '</b><small>' + muName(LIB[e.mv].p) + ' · ' + Ltr(e.reps) + '</small></span>' +
      (k < 0 ? '<small class="bl-once">' + say('רק היום', 'Today only') + '</small>'
        : ed ? '<div class="bl-ed"><button type="button" data-mvs="' + e.id + '" data-d="-1" aria-label="' + say('הזז למעלה', 'Move up') + '"' + (k <= 0 ? ' disabled' : '') + '>' + ICON.up + '</button><button type="button" data-mvs="' + e.id + '" data-d="1" aria-label="' + say('הזז למטה', 'Move down') + '"' + (k >= ids.length - 1 ? ' disabled' : '') + '>' + ICON.down + '</button><button class="rm" type="button" data-rm="' + e.id + '" aria-label="' + say('הסר את ', 'Remove ') + e.nm + '"' + (ids.length <= 1 ? ' disabled' : '') + '>' + ICON.x + '</button></div>'
        : '<div class="stp"><button type="button" data-base="' + e.id + '" data-n="' + (e.n0 - 1) + '" aria-label="' + say('סט אחד פחות', 'One set less') + '"' + (dl || e.n0 <= Math.max(1, rowsOf(s, e.id).filter(isDone).length) ? ' disabled' : '') + '>−</button><b>' + e.n0 + '</b><button type="button" data-base="' + e.id + '" data-n="' + (e.n0 + 1) + '" aria-label="' + say('סט נוסף', 'One more set') + '"' + (dl || e.n0 >= MAX_SETS ? ' disabled' : '') + '>+</button></div>') + '</div>';
  }).join('') + '</div><div class="bl-act"><button class="link" type="button" data-addw="' + w + '">' + say('+ הוסף תרגיל', '+ Add exercise') + '</button><button class="link" type="button" data-bled="' + w + '">' + (ed ? say('סיום', 'Done') : say('סידור והסרה', 'Reorder and remove')) + '</button></div>';
}
/* The plan opens as a short menu: where the round stands, the four workouts, and the few things that can be set.
   Each of them has a page of its own (S.msPage: 'ex' for the workout S.msW, 'vol', 'inc'), one tap in and one tap back */
function renderMeso() {
  const sh = $('#sheet'), old = $('.sheet-in', sh), pg = S.msPage || 'menu', top = old && old.dataset.pg === pg ? old.scrollTop : 0, M = S.cfg.meso, s = live(S.tab), P = phase(S.tab, s), W = S.cfg.weeks, past = (S.cfg.past || []).filter((p) => mesoSessions(p.id).length).slice(-1)[0];
  if (!P.m) P.n = M.n;
  const x = '<button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button>';
  const page = (title, body) => '<div class="sheet-in ms pg" data-pg="' + pg + '" role="dialog" aria-modal="true" aria-label="' + title + '"><div class="ed-h"><button class="fx-nav" type="button" data-msp="" aria-label="' + say('חזרה לתוכנית', 'Back to the plan') + '">' + ICON.back + '</button><div><h2>' + title + '</h2></div>' + x + '</div>' + body + '</div>';
  if (pg === 'ex') sh.innerHTML = page(wkName(S.msW), builderHTML(S.msW));
  else if (pg === 'vol') sh.innerHTML = page(say('סטים בשבוע לפי שריר', 'Sets a week by muscle'), '<p>' + say('הרצועה הבהירה היא הטווח המומלץ.', 'The light band is the suggested range.') + '</p><div class="vol">' + volHTML(P.dl) + '</div>');
  else if (pg === 'inc') sh.innerHTML = page(say('קפיצת משקל', 'Weight step'), '<p>' + say('בכמה המשקל עולה בכל פעם, לפי הציוד.', 'How much the weight goes up each time, by equipment.') + '</p><div class="inc">' + Object.keys(EQUIP).map((k) => '<label class="inc-row"><span>' + eqName(k) + '</span><select data-inc="' + k + '">' + INC_CHOICES.map((v) => '<option value="' + v + '"' + (v === (+S.cfg.inc[k] || EQUIP[k].inc) ? ' selected' : '') + '>' + v + say(' ק״ג', ' kg') + '</option>').join('') + '</select></label>').join('') + '</div>');
  else {
    let strip = '';
    for (let k = 1; k <= W; k++) { const d = k === W, cur = P.dl ? d : k === P.wk; strip += '<li class="' + (cur ? 'cur' : '') + (d ? ' dl' : '') + '"' + (cur ? ' aria-current="step"' : '') + '><small>' + say('שבוע ', 'Week ') + k + '</small><b>' + (d ? say('שבוע קל', 'Easy week') : ((r) => (r === 0 ? say('עד כשל', 'To failure') : r === 1 ? say('חזרה אחת', '1 rep') : r + say(' חזרות', ' reps')))(rirFor(k, W))) + '</b></li>'; }
    const row = (attr, title, val, warn) => '<li><button class="m-row" type="button" ' + attr + '><span>' + title + '</span>' + (val ? '<small' + (warn ? ' class="warn"' : '') + '>' + val + '</small>' : '') + ICON.fwd + '</button></li>';
    /* the last mesocycle is complete and the next workout opens a new one: nothing to steer until then */
    const over = mesoDone(M), off = P.dl ? 0 : volWarn(), ask = (q, yes, id) => '<span class="confirm"><span>' + q + '</span><button class="btn primary" id="' + id + '" type="button">' + yes + '</button><button class="btn" id="msNo" type="button">' + say('ביטול', 'Cancel') + '</button></span>';
    let act;
    if (over) act = '<p class="ms-sub">' + say('סבב ', 'Round ') + M.n + say(' הושלם. האימון הבא פותח את סבב ', ' is complete. The next workout opens round ') + (M.n + 1) + '.</p>';
    else if (S.msAsk === 'dl') act = ask(say('להתחיל שבוע קל? אחריו מתחיל סבב חדש.', 'Start an easy week? A new round starts after it.'), say('כן, שבוע קל', 'Yes, easy week'), 'msDlYes');
    else if (S.msAsk === 'plan') act = ask(say('להחזיר את רשימת התרגילים המקורית?', 'Bring back the original list of exercises?'), say('כן, אפס', 'Yes, reset'), 'planResetYes');
    else if (S.msAsk === 'new') act = ask(say('להתחיל סבב חדש משבוע 1?', 'Start a new round from week 1?'), say('כן, סבב חדש', 'Yes, new round'), 'msNewYes');
    else act = (M.early ? '<button class="link" id="msDlOff" type="button">' + say('בטל שבוע קל', 'Cancel the easy week') + '</button>' : P.dl ? '' : '<button class="link" id="msDl" type="button">' + say('שבוע קל עכשיו', 'Easy week now') + '</button>') + '<button class="link" id="msNew" type="button">' + say('סבב חדש', 'New round') + '</button>' +
      (planChanged() ? '<button class="link" id="planReset" type="button">' + say('איפוס תרגילים', 'Reset exercises') + '</button>' : '');
    sh.innerHTML = '<div class="sheet-in ms" data-pg="menu" role="dialog" aria-modal="true" aria-label="' + say('סבב ותוכנית', 'Round and plan') + '"><div class="ed-h"><div><p class="kicker">' + say('סבב ', 'Round ') + P.n + (M.early && !over ? say(' · שבוע קל מוקדם', ' · early easy week') : '') + '</p><h2>' + (P.dl ? say('שבוע קל', 'Easy week') : say('שבוע ', 'Week ') + P.wk + ' <small>' + say('מתוך ', 'of ') + W + '</small>') + '</h2></div>' + x + '</div>' +
      '<ol class="wk-strip">' + strip + '</ol>' +
      '<p>' + say('כל שבוע חזרה אחת קרוב יותר לכשל. האחרון קל.', 'Each week one rep closer to failure. The last is easy.') + '</p>' +
      '<ul class="menu" aria-label="' + say('האימונים', 'The workouts') + '">' + PLAN.map((_, w) => row('data-msw="' + w + '"', '<i class="w-dot w' + w + '" aria-hidden="true"></i>' + wkName(w), cnt(planIds(w).length, 'תרגילים', 'תרגיל אחד', 'exercises', 'exercise'))).join('') + '</ul>' +
      '<ul class="menu" aria-label="' + say('הסבב', 'The round') + '">' + row('data-msp="vol"', say('סטים בשבוע לפי שריר', 'Sets a week by muscle'), off ? cnt(off, 'שרירים מחוץ לטווח', 'שריר אחד מחוץ לטווח', 'muscles out of range', 'muscle out of range') : '', true) + row('data-msp="inc"', say('קפיצת משקל', 'Weight step'), '') +
      '<li class="m-row"><span>' + say('שבועות בסבב', 'Weeks in a round') + '</span><div class="stp"><button type="button" data-weeks="' + (W - 1) + '" aria-label="' + say('שבוע פחות', 'One week less') + '"' + (W <= 4 ? ' disabled' : '') + '>−</button><b>' + W + '</b><button type="button" data-weeks="' + (W + 1) + '" aria-label="' + say('שבוע נוסף', 'One week more') + '"' + (W >= 7 ? ' disabled' : '') + '>+</button></div></li>' +
      (mesoSessions(M.id).length ? row('data-sum="' + M.id + '"', say('סיכום הסבב', 'Summary of this round'), '') : '') + (past ? row('data-sum="' + past.id + '"', say('סיכום סבב ', 'Summary of round ') + past.n, '') : '') + '</ul>' +
      '<div class="ms-act">' + act + '</div></div>';
  }
  $('.sheet-in', sh).scrollTop = top;
}
function openMeso(page, w) { S.sheet = 'meso'; S.msAsk = null; S.blEdit = null; S.msPage = page || null; S.msW = w == null ? S.tab : w; renderMeso(); $('#sheet').hidden = false; }
/* the end-of-mesocycle card: the round in one line, then the strength of each movement and the weekly sets of each muscle */
/* what a finished workout brought, as one line on the sheets that take the place of the workout's own summary */
const xpLine = (R) => (R ? '<p class="xp-line"><span class="xp-tag">' + Ltr('+' + nf(R.y.xp)) + '</span><span>' + say('רמה ', 'Level ') + R.to.lvl + ' · ' + nm(rankOf(R.to.lvl)) + (R.to.lvl > R.from.lvl ? say(' · עלית רמה', ' · level up') : '') + '</span></p>' : '');
function showMesoSummary(id, justDone, R) {
  const M = mesoSummary(id), n = +String(id).slice(1) || 1, sh = $('#sheet'), avg = M.gains.length ? M.gains.reduce((a, g) => a + g.pct, 0) / M.gains.length : null;
  const sign = (p) => Ltr((p >= 0 ? '+' : '−') + Math.abs(p).toFixed(1) + '%');
  let body = '<p>' + say('עוד אין אימונים בסבב הזה.', 'No workouts in this round yet.') + '</p>';
  if (M.n) {
    body = '<p class="sum-line">' + [cnt(M.n, 'אימונים', 'אימון אחד', 'workouts', 'workout'), avg == null ? '' : say('כוח ', 'strength ') + sign(avg), M.sets ? say('עד ', 'up to ') + fmtN(M.sets.peak) + say(' סטים בשבוע', ' sets a week') : ''].filter(Boolean).join(' · ') + '</p>' +
      '<section><h3>' + say('שינוי כוח לפי תרגיל', 'Strength change by exercise') + '</h3>' + (M.gains.length ? '<ul class="sum-list">' + M.gains.slice(0, 14).map((g) => '<li><span>' + mvName(g.mv) + '</span><b class="' + (g.pct > 0.4 ? 'up' : g.pct < -0.4 ? 'dn' : '') + '">' + sign(g.pct) + '</b></li>').join('') + '</ul>' : '<p class="ms-sub">' + say('צריך שני אימונים של אותו תרגיל.', 'It takes two workouts of the same exercise.') + '</p>') + '</section>' +
      (M.mus.length ? '<section><h3>' + say('סטים בשבוע לפי שריר', 'Sets a week by muscle') + '</h3><ul class="sum-list">' + M.mus.map((m) => '<li><span>' + muName(m.k) + '</span><b>' + (m.weeks > 1 && m.peak !== m.start ? Ltr(fmtN(m.start)) + arrow() + Ltr(fmtN(m.peak)) : fmtN(m.peak)) + '</b></li>').join('') + '</ul></section>' : '');
  }
  S.sheet = 'msum';
  sh.innerHTML = '<div class="sheet-in ms" role="dialog" aria-modal="true" aria-label="' + say('סיכום סבב', 'Round summary') + '"><div class="ed-h"><div><p class="kicker">' + (justDone ? say('הסבב הושלם', 'Round complete') : say('סיכום', 'Summary')) + '</p><h2>' + say('סבב ', 'Round ') + n + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' + xpLine(R) + body +
    (justDone ? '<p>' + say('האימון הבא פותח סבב חדש.', 'The next workout opens a new round.') + '</p>' : '') + '<button class="btn primary big" id="sheetClose" type="button">' + say('סגור', 'Close') + '</button></div>';
  sh.hidden = false;
}
/* two workouts in a row fell short for two muscle groups or more: offer the deload now */
function showDeloadOffer(s, R) {
  const mus = Array.from(missedMuscles(s)).map((k) => muLow(k)), sh = $('#sheet');
  S.sheet = 'dlo';
  sh.innerHTML = '<div class="sheet-in" role="dialog" aria-modal="true" aria-label="' + say('הצעה לשבוע קל', 'An easy week is suggested') + '"><p class="kicker">' + wkOrd(s.w) + say(' הושלם', ' complete') + '</p><h2>' + say('סימני עייפות', 'Signs of fatigue') + '</h2>' + xpLine(R) +
    '<p>' + say('פעמיים ברצף לא הגעת ליעד (היום: ', 'Twice in a row you missed the target (today: ') + mus.join(', ') + say('). בדרך כלל זו עייפות שהצטברה.', '). That is usually fatigue that has built up.') + '</p>' +
    '<p><b>' + say('שבוע קל:', 'Easy week:') + '</b>' + say(' חצי מהסטים ופחות משקל. אחריו מתחיל סבב חדש.', ' half the sets and less weight. A new round starts after it.') + '</p>' +
    '<button class="btn primary big" id="dlYes" type="button">' + say('להתחיל שבוע קל', 'Start an easy week') + '</button><button class="btn big" data-close="1" type="button">' + say('לא עכשיו', 'Not now') + '</button></div>';
  sh.hidden = false;
}
function startDeload() { S.cfg.meso.early = Date.now(); saveCfg(); S.bannerKind = ''; S.banner = '<b>' + say('שבוע קל התחיל.', 'The easy week has started.') + '</b>' + say(' חצי מהסטים ופחות משקל בארבעת האימונים הבאים.', ' Half the sets and less weight for the next four workouts.'); }
/* clicks inside the sheet that belong to this file; returns true when the click was handled */
function coachSheetClick(ev, id) {
  const b = ev.target.closest('button'), ds = b ? b.dataset : {};
  if (ds.pick && S.pick) { S.pick.mu = ds.pick; S.pick.sel = null; renderPick(); return true; }
  if (ds.sel && S.pick) { S.pick.sel = S.pick.sel === ds.sel ? null : ds.sel; renderPick(); return true; }
  if (ds.add && S.pick) { const w = S.pick.w, id = addSlot(w, ds.add); S.pick = null; S.sheet = 'meso'; S.msAsk = null; S.msPage = 'ex'; S.msW = w; renderMeso(); if (id) { const row = $('#sheet [data-base="' + id + '"]'); if (row) row.closest('.bl-row').scrollIntoView({ block: 'center' }); } return true; }
  if (ds.sw && S.pick) {
    const exId = S.pick.ex, pe = planEx(exId), w = wkOf(exId), mv = ds.sw, same = LIB[mv].pat === LIB[pe.a].pat && LIB[mv].p === LIB[pe.a].p;
    let now, at = exId;
    if (same) now = swapTo(exId, mv, ds.mode === 'always');
    else { const s = live(w); now = !(s && rowsOf(s, exId).some(isDone)); at = replaceSlot(exId, mv) || exId; }
    S.bannerKind = ''; S.banner = (now ? say('הוחלף: ', 'Swapped: ') : say('מהאימון הבא: ', 'From next workout: ')) + mvName(mv) + (ds.mode === 'always' ? '' : say(' (רק היום)', ' (today only)')) + '.';
    if (S.tab === w) S.open = now ? at : exId;
    S.drafts = {}; S.pick = null; closeSheet(); return true;
  }
  if (id === 'swAsk') { const exId = S.swEx; closeSheet(); openChat(exId); return true; }
  if (ds.msw != null) { S.msPage = 'ex'; S.msW = clamp(+ds.msw || 0, 0, PLAN.length - 1); S.blEdit = null; S.msAsk = null; renderMeso(); return true; }
  if (ds.msp != null) { S.msPage = ds.msp === 'vol' || ds.msp === 'inc' ? ds.msp : null; S.blEdit = null; S.msAsk = null; renderMeso(); return true; }
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
  if (id === 'msNewYes') { newMeso(); S.msAsk = null; S.bannerKind = ''; S.banner = '<b>' + say('סבב ', 'Round ') + S.cfg.meso.n + say(' התחיל.', ' has started.') + '</b>'; closeSheet(); return true; }
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
    /* the second tap of a double tap on "Start workout" lands on the question that has just appeared: it is not an answer */
    if (ev.detail !== 0 && Date.now() - (S.preAt || 0) < 400) return;
    const b = ev.target.closest('button'); if (!b) return;
    S.touched = true;
    if (b.dataset.time != null) { setDay(S.tab, +b.dataset.time); S.timeAsk = null; S.open = null; haptic('select'); afterPre(); renderHome(); return; }
    if (b.dataset.mu) setSore(S.tab, b.dataset.mu, +b.dataset.v);
    else if (b.id === 'preAll') { const s = live(S.tab), sore = soreOf(S.tab, s); for (const m of preMuscles(S.tab)) if (sore[m] == null) setSore(S.tab, m, 1); S.preOpen = false; }
    else if (b.id === 'preEdit') S.preOpen = true;
    else if (b.id === 'preDone') { S.preOpen = false; S.preSkip = S.tab; }
    else if (b.id === 'preSkip') S.preSkip = S.tab;
    afterPre();
  });
}
