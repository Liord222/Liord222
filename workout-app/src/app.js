/* ================================================================== stage player */
let C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim();
  C = { stage: v('--stage'), grid: v('--grid'), grid2: v('--grid-2'), floor: v('--floor'), ground: v('--ground'), shadow: v('--shadow'), fig: v('--fig'), figHi: v('--fig-hi'), figLo: v('--fig-lo'), far: v('--fig-far'), cloth: v('--cloth'), clothFar: v('--cloth-far'), shoe: v('--shoe'), shoeFar: v('--shoe-far'), sole: v('--sole'), hair: v('--hair'), eq: v('--equip'), eqHi: v('--equip-hi'), eq2: v('--equip-2'), pad: v('--pad'), padHi: v('--pad-hi'), plate: v('--plate'), plateHi: v('--plate-hi'), cable: v('--cable'), muscle: v('--muscle'), accent: v('--accent') };
  C.halo = C.stage; C._fig = hexRgb(C.fig); C._hi = hexRgb(C.figHi); C._lo = hexRgb(C.figLo); C.fx = 0;
}
const player = { key: null, cv: null, g: null, raf: 0, clock: 0, last: 0, playing: !reduced, speed: 1, visible: true, phaseEl: null, btn: null, bar: null, phase: -1, lastT: 0.5, io: null, ro: null };
const PHASES = ['מאמץ · נשיפה', 'כיווץ', 'חזרה איטית · שאיפה', 'מתיחה'];
const ease = (x) => (1 - Math.cos(Math.PI * x)) / 2;
function fitCanvas(cv, cssW) {
  const dpr = Math.min(2.5, window.devicePixelRatio || 1), w = Math.max(120, Math.round(cssW * dpr));
  if (cv.width !== w) { cv.width = w; cv.height = Math.round((w * SH) / SW); }
}
function paintStage(t) {
  if (!player.cv) return;
  const g = player.g, k = player.cv.width / SW;
  g.setTransform(k, 0, 0, k, 0, 0); C.fx = k; renderAnim(g, player.key, t, C, false); C.fx = 0; player.lastT = t;
  if (player.bar) player.bar.style.transform = 'scaleX(' + t.toFixed(3) + ')';
}
function frame(now) {
  if (!player.cv || !player.playing) return;
  player.raf = requestAnimationFrame(frame);
  const dt = Math.min(80, now - (player.last || now)); player.last = now;
  if (!player.visible) return;
  player.clock += dt * player.speed;
  const ex = ANIM[player.key], tp = ex.tempo || [1.1, 0.25, 1.8, 0.35];
  let x = (player.clock / 1000) % (tp[0] + tp[1] + tp[2] + tp[3]), t, ph;
  if (x < tp[0]) { t = ease(x / tp[0]); ph = 0; } else if ((x -= tp[0]) < tp[1]) { t = 1; ph = 1; } else if ((x -= tp[1]) < tp[2]) { t = 1 - ease(x / tp[2]); ph = 2; } else { t = 0; ph = 3; }
  if (ph !== player.phase && player.phaseEl) { player.phase = ph; player.phaseEl.textContent = (ex.phases || PHASES)[ph]; player.phaseEl.classList.toggle('hot', ph < 2); }
  paintStage(t);
}
function setPlaying(on) {
  player.playing = on; cancelAnimationFrame(player.raf);
  if (player.btn) { player.btn.innerHTML = on ? ICON.pause : ICON.play; player.btn.setAttribute('aria-label', on ? 'השהה את ההדמיה' : 'נגן את ההדמיה'); }
  if (on) { player.last = 0; player.phase = -1; player.raf = requestAnimationFrame(frame); } else { if (player.phaseEl) { player.phaseEl.textContent = 'מושהה'; player.phaseEl.classList.remove('hot'); } paintStage(player.lastT); }
}
function startPlayer(cv, key, body) {
  stopPlayer();
  Object.assign(player, { cv, key, g: cv.getContext('2d'), phaseEl: $('.stage-phase', body), btn: $('.stage-play', body), bar: $('.tempo i', body), phase: -1, lastT: 0.5, clock: 0, visible: true });
  fitCanvas(cv, cv.getBoundingClientRect().width || 340);
  if (window.ResizeObserver) { player.ro = new ResizeObserver((en) => { if (!player.cv) return; fitCanvas(player.cv, en[0].contentRect.width); if (!player.playing) paintStage(player.lastT); }); player.ro.observe(cv); }
  if (window.IntersectionObserver) { player.io = new IntersectionObserver((en) => { player.visible = en[0].isIntersecting; }); player.io.observe(cv); }
  setPlaying(player.playing);
}
function stopPlayer() {
  cancelAnimationFrame(player.raf);
  if (player.ro) player.ro.disconnect(); if (player.io) player.io.disconnect();
  player.cv = null; player.ro = player.io = null;
}
function drawThumbs() {
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  for (const cv of $$('.ex-thumb')) {
    cv.width = Math.round(68 * dpr); cv.height = Math.round(49 * dpr);
    const g = cv.getContext('2d'), z = (cv.width / SW) * 1.3;
    g.setTransform(z, 0, 0, z, cv.width / 2 - 180 * z, cv.height / 2 - 142 * z); renderAnim(g, cv.dataset.anim, 0.5, C, true);
  }
}
function onTheme() { readColors(); drawThumbs(); if (player.cv && !player.playing) paintStage(player.lastT); }

/* ================================================================== workout UI */
const valHTML = (r) => Ltr(r.kg != null ? Ltr(fmtKg(r.kg)) + '<small><bdi> ק״ג</bdi></small>' + Ltr(' × ' + (r.reps != null ? r.reps : '–')) : Ltr(r.reps != null ? r.reps : '–') + '<small><bdi> חז׳</bdi></small>');
function cursor() {
  const wk = PLAN[S.tab], s = live(S.tab);
  let e = S.open && wk.ex.find((x) => x.id === S.open);
  if (e && firstUndone(s, e) >= 0) return { e, i: firstUndone(s, e) };
  e = wk.ex.find((x) => firstUndone(s, x) >= 0);
  return e ? { e, i: firstUndone(s, e) } : null;
}
function renderTabs() {
  const nu = nextUp();
  $('#tabs').innerHTML = PLAN.map((w, i) => '<button class="tab" role="tab" type="button" data-tab="' + i + '" aria-selected="' + (i === S.tab) + '"><small>אימון ' + (i + 1) + '</small><b>' + w.name + '</b>' +
    (nu.live === i ? '<span class="flag live">באמצע</span>' : nu.next === i ? '<span class="flag">הבא בתור</span>' : '') + '</button>').join('');
}
const totals = () => { const wk = PLAN[S.tab], s = live(S.tab); return { total: wk.ex.reduce((n, e) => n + e.sets, 0), dn: wk.ex.reduce((n, e) => n + doneCount(s, e), 0) }; };
function updateProgress() {
  const { dn, total } = totals(), arc = $('#ringArc'), txt = $('#ringTxt');
  if (arc) arc.style.strokeDashoffset = String(226.2 * (1 - dn / total));
  if (txt) txt.textContent = dn + '/' + total;
  const f = $('#finishBtn'); if (f) f.disabled = dn === 0;
}
function tickElapsed() {
  const el = $('#elapsed'), s = live(S.tab);
  if (el && s) el.innerHTML = 'באימון כבר <b>' + Ltr(mmss(Math.max(0, (Date.now() - s.ts) / 1000))) + '</b>';
}
function renderHero() {
  const wk = PLAN[S.tab], s = live(S.tab), { total } = totals();
  const mins = Math.round(wk.ex.reduce((n, e) => n + e.sets * (45 + (e.rest[0] + e.rest[1]) / 2), 0) / 300) * 5;
  const prev = sorted().find((x) => x.w === S.tab && x.end && hasDone(x));
  const line2 = s ? '<span id="elapsed"></span>' : prev ? 'פעם קודמת ' + ago(prev.ts) + ': ' + setsDone(prev) + ' סטים' + (volume(prev) ? ', ' + volume(prev).toLocaleString('he-IL') + ' ק״ג' : '') : wk.ex.length + ' תרגילים · כ־' + mins + ' דקות';
  $('#hero').innerHTML = (S.banner ? '<div class="banner"><p>' + S.banner + '</p><button type="button" id="bannerX" aria-label="סגור">' + ICON.x + '</button></div>' : '') +
    '<div><p class="kicker">אימון ' + (S.tab + 1) + ' מתוך 4 · ' + wk.he + '</p><h1>' + wk.name + '</h1><p class="meta">' + (s || prev ? wk.ex.length + ' תרגילים · כ־' + mins + ' דקות<br>' : '') + line2 + '</p></div>' +
    '<div class="ring" role="img" aria-label="התקדמות באימון"><svg viewBox="0 0 86 86" aria-hidden="true"><circle class="tr" cx="43" cy="43" r="36"/><circle class="pr" id="ringArc" cx="43" cy="43" r="36" stroke-dasharray="226.2" stroke-dashoffset="226.2"/></svg><div><b id="ringTxt">0/' + total + '</b><span>סטים</span></div></div>';
  tickElapsed();
}
function rowHTML(e, i, s) {
  const dn = doneCount(s, e), full = dn >= e.sets;
  let pips = ''; for (let k = 0; k < e.sets; k++) pips += '<i' + (k < dn ? ' class="on"' : '') + '></i>';
  return '<li class="ex' + (full ? ' done' : '') + '" data-id="' + e.id + '">' +
    '<button class="ex-head" type="button" aria-expanded="false" aria-controls="body-' + e.id + '">' +
    '<span class="ex-n">' + (full ? ICON.check : i + 1) + '</span><canvas class="ex-thumb" data-anim="' + e.a + '" aria-hidden="true"></canvas>' +
    '<span class="ex-title"><span class="ex-name">' + esc(e.name) + '</span><span class="ex-sub">' + LIB[e.a].he + '</span></span>' +
    '<span class="ex-side"><span class="ex-rx">' + Ltr(e.sets + ' × ' + e.reps) + '</span><span class="pips" aria-hidden="true">' + pips + '</span></span>' +
    '</button><div class="ex-body" id="body-' + e.id + '" hidden></div></li>';
}
function setsHTML(e) {
  const s = live(S.tab), r = rowsOf(s, e.id), prev = prevFor(S.tab, e.id, s && s.id), cur = s ? cursor() : null;
  let h = '<div class="sets-h"><span>סטים</span><span>' + (s ? 'נגיעה בסט שבוצע פותחת עריכה' : 'הרישום נעשה בסרגל שלמטה') + '</span></div>';
  for (let i = 0; i < e.sets; i++) {
    const row = r[i], on = isDone(row), isCur = !!cur && cur.e.id === e.id && cur.i === i, pv = prev ? rowsOf(prev, e.id)[i] : null;
    const fail = e.lvl === 3 && i === e.sets - 1 ? '<em>עד כשל טכני</em>' : '';
    const mid = on ? '<span class="v">' + valHTML(row) + (row.pr ? '<span class="pr">שיא אישי</span>' : '') + '</span>'
      : '<span class="hint">' + (isCur ? 'הסט הבא' : isDone(pv) ? 'פעם קודמת ' + Ltr(fmtRow(pv)) : 'עוד לא בוצע') + (fail ? ' · ' + fail : '') + '</span>';
    h += '<button class="setp' + (on ? ' done' : isCur ? ' cur' : '') + '" type="button" data-i="' + i + '"><span class="n">סט ' + (i + 1) + '</span>' + mid + '<span class="st">' + ICON.check + '</span></button>';
  }
  if (prev && firstUndone(s, e) >= 0 && rowsOf(prev, e.id).some(isDone)) h += '<button class="btn same" type="button">רשום את שאר הסטים כמו בפעם הקודמת</button>';
  return h;
}
/* strength trend for one exercise slot: the best set of each past workout as estimated one-rep strength */
function trendHTML(e) {
  const w = wkOf(e.id), pts = [];
  for (const s of sorted().reverse()) {
    if (s.w !== w) continue;
    const rows = rowsOf(s, e.id).filter(isDone); if (!rows.length) continue;
    const weighted = rows.filter((r) => r.kg != null && r.kg > 0 && r.reps != null);
    const top = weighted.length ? weighted.reduce((a, b) => (e1rm(b.kg, b.reps) > e1rm(a.kg, a.reps) ? b : a)) : rows.reduce((a, b) => ((b.reps || 0) > (a.reps || 0) ? b : a));
    pts.push({ v: weighted.length ? e1rm(top.kg, top.reps) : top.reps || 0, row: top, ts: s.ts });
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
function bodyHTML(e) {
  const info = LIB[e.a], view = { side: 'מבט מהצד', back: 'מבט מאחור', top: 'מבט מלמעלה' }[ANIM[e.a].view];
  return '<div class="ex-a"><div class="stage-wrap"><canvas class="stage" role="img" aria-label="הדמיה של ' + esc(e.name) + '"></canvas>' +
    '<span class="stage-tag">' + view + '</span><span class="stage-phase"></span>' +
    '<div class="stage-ctl"><button class="stage-speed" type="button" aria-pressed="' + (player.speed < 1) + '" aria-label="הילוך איטי">' + Ltr('½×') + '</button><button class="stage-play" type="button"></button></div>' +
    '<div class="tempo" aria-hidden="true"><i></i></div></div>' +
    '<div class="how"><p class="muscles"><i></i><span>' + info.m + '</span></p><ul class="cues">' + info.c.map((c) => '<li>' + c + '</li>').join('') + '</ul></div></div>' +
    '<div class="ex-b"><div class="rx-row">' +
    '<div><span class="rx-k">סטים × חזרות</span><span class="rx-v">' + Ltr(e.sets + ' × ' + e.reps) + (e.suf ? ' <small>' + e.suf + '</small>' : '') + '</span></div>' +
    '<div><span class="rx-k">מנוחה</span><span class="rx-v">' + restText(e).replace(/ (דק׳|שנ׳)/, ' <small>$1</small>') + '</span></div>' +
    '<div><span class="rx-k">עצימות</span><span class="chip l' + e.lvl + '">' + e.int + '</span></div></div>' +
    '<div class="sets">' + setsHTML(e) + '</div>' + trendHTML(e) +
    '<button class="btn ask" type="button">' + ICON.cam + 'המכשיר תפוס? שאל את אילון על חלופה</button></div>';
}
function renderHistory() {
  const all = sorted().filter((x) => hasDone(x) && x.end), list = all.slice(0, S.histN || 6), df = new Intl.DateTimeFormat('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' }), s = live(S.tab);
  let act = '<div class="hist-act">';
  if (s) act += '<button class="btn primary" id="finishBtn" type="button">סיים אימון</button>' + (S.resetAsk ? '<span class="confirm"><span>למחוק את מה שנרשם באימון הזה?</span><button class="btn" id="resetYes" type="button">כן, נקה</button><button class="btn" id="resetNo" type="button">ביטול</button></span>' : '<button class="link" id="resetBtn" type="button">נקה את הרישום של האימון הזה</button>');
  if (S.dl && list.length) act += '<button class="link" id="exportBtn" type="button">ייצוא כל הרישום לקובץ CSV</button>';
  act += '</div>';
  $('#history').innerHTML = act + '<h2>אימונים אחרונים</h2>' + (list.length ? '<ul>' + list.map((x) => { const v = volume(x), mn = Math.max(1, Math.round((x.end - x.ts) / 60000)); return '<li><span class="h-t">' + df.format(new Date(x.ts)) + ' · אימון ' + (x.w + 1) + ' ' + Ltr(PLAN[x.w].name) + '</span><span class="h-act">' + (S.delAsk === x.id ? '<button class="link" type="button" data-delyes="' + x.id + '">כן, למחוק</button><button class="link" type="button" data-delno="1">ביטול</button>' : '<button class="link" type="button" data-edit="' + x.id + '" aria-label="ערוך את האימון הזה">עריכה</button><button class="link" type="button" data-del="' + x.id + '" aria-label="מחק את האימון הזה מהרישום">מחק</button>') + '</span><span class="h-s">' + setsDone(x) + ' סטים' + (v ? ' · ' + v.toLocaleString('he-IL') + ' ק״ג' : '') + (mn < 300 ? ' · ' + mn + ' דק׳' : '') + '</span></li>'; }).join('') + '</ul>' + (all.length > list.length ? '<button class="link" id="histMore" type="button">הצג עוד אימונים</button>' : '')
    : '<p>כאן יופיעו האימונים שסיימת. כל אימון אפשר יהיה לערוך או למחוק.</p>');
  updateProgress();
}
function markCur() {
  const cur = live(S.tab) ? cursor() : null;
  $$('.ex').forEach((li) => li.classList.toggle('cur', !!cur && cur.e.id === li.dataset.id));
}
function renderList() {
  stopPlayer();
  const wk = PLAN[S.tab], s = live(S.tab);
  $('#exList').innerHTML = wk.ex.map((e, i) => rowHTML(e, i, s)).join('');
  drawThumbs();
  const keep = S.open && wk.ex.some((e) => e.id === S.open) ? S.open : null;
  S.open = null; if (keep) openEx(keep, false); else markCur();
}
function renderAll() { renderTabs(); renderHero(); renderList(); renderHistory(); renderDock(); }
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
  const li = $('.ex[data-id="' + e.id + '"]'); if (!li) return;
  const s = live(S.tab), dn = doneCount(s, e), full = dn >= e.sets;
  li.classList.toggle('done', full); $('.ex-n', li).innerHTML = full ? ICON.check : String(PLAN[S.tab].ex.indexOf(e) + 1);
  $$('.pips i', li).forEach((d, k) => d.classList.toggle('on', k < dn));
  const sets = $('.sets', li); if (sets) sets.innerHTML = setsHTML(e);
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
function curKg(e, i, s) { const d = S.draft; return d && d.ex === e.id && d.i === i ? d.kg : defaultKg(e, i, s); }
const kgHTML = (kg) => (kg == null ? '<b>—</b><small>בלי משקל</small>' : '<b>' + fmtKg(kg) + '</b><small>ק״ג</small>');
function controlsHTML(e, kg, selReps, lastReps) {
  const rr2 = repRange(e), lo = rr2[0], hi = rr2[1];
  let chips = '';
  for (let r = Math.max(1, lo - 3); r <= hi + 3; r++) chips += '<button class="chip-r' + (r >= lo && r <= hi ? ' in' : '') + (r === lastReps ? ' last' : '') + (r === selReps ? ' sel' : '') + '" type="button" data-r="' + r + '" aria-label="' + r + ' חזרות">' + r + '</button>';
  return '<div class="dk-w"><span class="dk-lbl">משקל</span><button class="step" type="button" data-d="-1" aria-label="הפחת משקל">−</button>' +
    '<div class="dk-kg" id="dkKg" role="button" tabindex="0" aria-label="משקל, לחיצה להקלדה">' + kgHTML(kg) + '</div>' +
    '<button class="step" type="button" data-d="1" aria-label="הוסף משקל">+</button></div>' +
    '<div class="dk-r"><span class="dk-lbl">' + (selReps != null ? 'כמה חזרות היו בסט?' : 'כמה חזרות עשית? <b>נגיעה אחת רושמת את הסט</b>') + '</span><div class="chips" id="chips">' + chips + '<button class="chip-r more" type="button" id="repsMore">מספר אחר</button></div></div>';
}
function renderDock() {
  const d = $('#dock'), wk = PLAN[S.tab], s = live(S.tab);
  let cls = 'dock', h;
  if (rest.on) {
    const L = rest.last; cls += ' rest';
    h = '<div class="rt"><div class="rt-time" id="rtTime">0:00</div><div class="rt-mid"><div class="rt-state" id="rtState"></div><div class="rt-track"><i id="rtFill"></i></div>' +
      (L ? '<div class="rt-log"><span>נרשם ' + Ltr(fmtRow(L)) + '</span>' + (L.pr ? '<span class="pr">שיא אישי</span>' : '') + '<button class="link" id="rtUndo" type="button">בטל</button></div>' : '') + '</div>' +
      '<div class="rt-btns"><button type="button" id="rtMinus" class="opt" aria-label="הפחת 15 שניות">' + Ltr('−15') + '</button><button type="button" id="rtPlus" aria-label="הוסף 15 שניות">' + Ltr('+15') + '</button>' +
      '<button type="button" id="rtSound" class="opt" aria-label="' + (S.sound ? 'השתק צליל' : 'הפעל צליל') + '">' + (S.sound ? ICON.snd : ICON.mute) + '</button><button type="button" id="rtSkip" class="go">המשך</button></div></div>';
  } else if (S.edit && findEx(S.edit.ex) && isDone(rowsOf(s, S.edit.ex)[S.edit.i])) {
    const e = findEx(S.edit.ex), row = rowsOf(s, e.id)[S.edit.i];
    h = '<div class="dk-top"><div class="dk-go"><span class="dk-name">' + esc(e.name) + '</span><span class="dk-set">עריכת סט <b>' + (S.edit.i + 1) + '</b> · ' + Ltr(fmtRow(row)) + '</span></div>' +
      '<button class="btn" id="edDel" type="button">מחק סט</button><button class="btn primary" id="edClose" type="button">סיום</button></div>' + controlsHTML(e, row.kg, row.reps, null);
  } else if (!s) {
    S.edit = null;
    h = '<div class="dk-row"><div class="dk-msg">אימון ' + (S.tab + 1) + ' · ' + Ltr(wk.name) + '<small>בוחרים כמה חזרות עשית, והסט נרשם</small></div><button class="btn primary" id="dkStart" type="button">' + ICON.go + 'התחל אימון</button></div>';
  } else {
    S.edit = null;
    const cur = cursor();
    if (!cur) h = '<div class="dk-row"><div class="dk-msg">כל הסטים בוצעו<small>אפשר לסיים, או לגעת בסט כדי לתקן אותו</small></div><button class="btn primary" id="dkFinish" type="button">סיים אימון</button></div>';
    else {
      const e = cur.e, i = cur.i, pv = prevFor(S.tab, e.id, s.id), pr = pv ? rowsOf(pv, e.id)[i] : null;
      if (S.mini) cls += ' mini';
      h = '<div class="dk-top"><button class="dk-go" type="button" id="dkGo"><span class="dk-name">' + esc(e.name) + '</span><span class="dk-set">סט <b>' + (i + 1) + '</b> מתוך ' + e.sets + (isDone(pr) ? ' · פעם קודמת ' + Ltr(fmtRow(pr)) : e.suf ? ' · ' + e.reps + ' ' + e.suf : '') + '</span></button>' +
        '<button class="dk-ic coach" id="dkCoach" type="button" aria-label="שאל את אילון"><span class="ava" aria-hidden="true">א</span></button>' +
        '<button class="dk-ic" id="dkMini" type="button" aria-label="' + (S.mini ? 'הרחב את הסרגל' : 'מזער את הסרגל') + '">' + (S.mini ? ICON.up : ICON.down) + '</button></div>' +
        controlsHTML(e, curKg(e, i, s), null, defaultReps(e, i, s));
    }
  }
  d.className = cls; d.innerHTML = '<div class="dock-in">' + h + '</div>';
  const row = $('#chips'), ins = row ? $$('.chip-r.in', row) : [], mark = row && ($('.chip-r.sel', row) || $('.chip-r.last', row) || ins[Math.floor((ins.length - 1) / 2)]);
  if (mark) row.scrollLeft = mark.offsetLeft - row.clientWidth / 2 + mark.offsetWidth / 2;
  if (rest.on) tickRest();
}
function setKg(kg) {
  const t = dockTarget(); if (!t) return;
  kg = kg == null || !(kg > 0) ? null : Math.round(kg * 100) / 100;
  if (t.edit) { const s = live(S.tab), row = rowsOf(s, t.e.id)[t.i]; if (!row) return; row.kg = kg; row.t = Date.now(); delete row.pr; touch(s); refreshEx(t.e); }
  else S.draft = { ex: t.e.id, i: t.i, kg };
  const box = $('#dkKg'); if (box && !$('input', box)) box.innerHTML = kgHTML(kg);
}
function stepKg(d) {
  const t = dockTarget(); if (!t) return;
  const s = live(S.tab), cur = t.edit ? (rowsOf(s, t.e.id)[t.i] || {}).kg : curKg(t.e, t.i, s);
  setKg((cur == null ? 0 : cur) + d * (LIB[t.e.a].step || 2.5));
}
function typeKg() {
  const box = $('#dkKg'), t = dockTarget(); if (!box || !t || $('input', box)) return;
  const s = live(S.tab), cur = t.edit ? (rowsOf(s, t.e.id)[t.i] || {}).kg : curKg(t.e, t.i, s);
  box.innerHTML = '<input id="dkKgIn" type="text" inputmode="decimal" autocomplete="off" aria-label="משקל בק״ג" value="' + (cur == null ? '' : fmtKg(cur)) + '">';
  const inp = $('#dkKgIn'); inp.focus(); inp.select();
  const done = () => { const v = num(inp.value); box.innerHTML = ''; setKg(v); };
  inp.addEventListener('blur', done, { once: true });
  inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); inp.blur(); } });
}
function typeReps() {
  const row = $('#chips'); if (!row) return;
  row.outerHTML = '<div class="reps-in"><span><input id="repsIn" type="text" inputmode="numeric" autocomplete="off" aria-label="מספר החזרות"></span><button class="btn primary" id="repsOk" type="button">רשום</button></div>';
  $('#repsIn').focus();
}
function chooseReps(r, el) {
  const t = dockTarget(); if (!t || logBusy || r == null || r < 1 || r > 200) return;
  if (t.edit) { const s = live(S.tab), row = rowsOf(s, t.e.id)[t.i]; row.reps = r; row.t = Date.now(); delete row.pr; touch(s); S.edit = null; refreshEx(t.e); renderDock(); return; }
  const s = ensure(S.tab), kg = curKg(t.e, t.i, s);
  logBusy = true; if (el) el.classList.add('hit'); buzz(14); primeAudio(); keepAwake();
  setTimeout(() => { logBusy = false; commitSet(t.e, t.i, kg, r); }, el && !reduced ? 180 : 0);
}
function writeRow(e, i, kg, reps) {
  const s = ensure(wkOf(e.id)), before = bestFor(e.a, { notS: s.id }), today = bestFor(e.a, { onlyS: s.id, skipEx: e.id, skipI: i }), arr = s.sets[e.id] || (s.sets[e.id] = []);
  const v = kg != null && kg > 0 ? e1rm(kg, reps) : 0, pr = !!(before && v > before.v + 0.01 && (!today || v > today.v + 0.01));
  arr[i] = { kg: kg == null ? null : kg, reps, done: true, t: Date.now() }; if (pr) arr[i].pr = true;
  touch(s); return pr;
}
function commitSet(e, i, kg, reps) {
  const pr = writeRow(e, i, kg, reps), s = live(S.tab), wk = PLAN[S.tab], left = (x) => firstUndone(s, x) >= 0;
  S.draft = null; refreshEx(e); renderTabs(); renderHistory();
  if (!$('#elapsed')) renderHero(), updateProgress();
  if (!wk.ex.some(left)) { stopRest(); return; }
  let nxt = e, label;
  if (left(e)) label = 'הבא: סט ' + (firstUndone(s, e) + 1) + ' מתוך ' + e.sets;
  else { nxt = wk.ex.slice(wk.ex.indexOf(e) + 1).find(left) || wk.ex.find(left); label = 'הבא: ' + nxt.name; }
  startRest(e.rest[0], e.rest[1], label, { ex: e.id, i, kg, reps, pr });
  if (nxt !== e) setTimeout(() => { if (S.tab === wkOf(nxt.id) && S.open === e.id) openEx(nxt.id, true); }, 750);
}
function clearRow(e, i) { const s = live(wkOf(e.id)); if (!s) return; const arr = s.sets[e.id] || (s.sets[e.id] = []); arr[i] = { kg: null, reps: null, done: false, t: Date.now() }; touch(s); }
function afterEdit(e) { refreshEx(e); renderTabs(); renderHistory(); renderDock(); }
function sameAsLast(e) {
  const s = ensure(S.tab), prev = prevFor(S.tab, e.id, s.id); if (!prev) return;
  const p = rowsOf(prev, e.id), done = p.filter(isDone), fallback = done[done.length - 1];
  for (let i = 0; i < e.sets; i++) { const src = isDone(p[i]) ? p[i] : fallback; if (!isDone(rowsOf(s, e.id)[i]) && src) writeRow(e, i, src.kg, src.reps); }
  S.draft = null; keepAwake(); afterEdit(e);
  if (!$('#elapsed')) renderHero(), updateProgress();
  const wk = PLAN[S.tab], nxt = wk.ex.slice(wk.ex.indexOf(e) + 1).find((x) => firstUndone(s, x) >= 0);
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
  if (S.tab === wkOf(e.id) && S.open !== e.id) openEx(e.id, false);
  afterEdit(e);
}
function showSummary(s) {
  const wk = PLAN[s.w], total = wk.ex.reduce((n, e) => n + e.sets, 0), v = volume(s), mn = Math.max(1, Math.round((s.end - s.ts) / 60000)), prs = prCount(s);
  const prev = sorted().find((x) => x.w === s.w && x.id !== s.id && x.end && hasDone(x)), pv = prev ? volume(prev) : 0, nu = nextUp();
  let cmp = '';
  if (pv && v) { const d = ((v - pv) / pv) * 100; cmp = Math.abs(d) < 0.5 ? 'אותו נפח כמו באימון הקודם של ' + Ltr(wk.name) + '.' : (d > 0 ? 'נפח גבוה ב-' : 'נפח נמוך ב-') + Ltr(Math.abs(d).toFixed(0) + '%') + ' מהאימון הקודם של ' + Ltr(wk.name) + '.'; }
  const sh = $('#sheet');
  sh.innerHTML = '<div class="sheet-in" role="dialog" aria-modal="true" aria-label="סיכום אימון"><p class="kicker">אימון ' + (s.w + 1) + ' הושלם</p><h2>' + Ltr(wk.name) + '</h2>' +
    '<div class="stats"><div><b>' + setsDone(s) + '/' + total + '</b><span>סטים</span></div><div><b>' + (v ? v.toLocaleString('en-US') : '–') + '</b><span>ק״ג נפח כולל</span></div><div><b>' + mn + '</b><span>' + (mn === 1 ? 'דקה' : 'דקות') + '</span></div></div>' +
    '<p>' + (prs ? '<b>' + prs + (prs === 1 ? ' שיא אישי' : ' שיאים אישיים') + ' באימון הזה.</b> ' : '') + cmp + ' הבא בתור: אימון ' + (nu.next + 1) + ' · ' + Ltr(PLAN[nu.next].name) + '.</p>' +
    '<button class="btn primary big" id="sheetClose" type="button">סגור</button></div>';
  sh.hidden = false; $('#sheetClose').focus();
}
function finishWorkout() {
  const s = live(S.tab); if (!s || !hasDone(s)) return;
  clearInterval(rest.iv); rest.on = false; rest.last = null;
  s.end = Date.now(); s.mt = s.end; touch(s); letSleep();
  S.edit = null; S.draft = null; S.resetAsk = false; S.open = null; S.tab = nextUp().next;
  renderAll(); showSummary(s); window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
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
  for (const e of wk.ex) {
    const r = rowsOf(s, e.id), n = Math.max(e.sets, r.length);
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
  S.edSid = id; S.edDel = false;
  const sh = $('#sheet');
  sh.innerHTML = '<div class="sheet-in ed" role="dialog" aria-modal="true" aria-label="עריכת אימון"><div class="ed-h"><div><p class="kicker">עריכת אימון ' + (s.w + 1) + '</p><h2>' + Ltr(wk.name) + '</h2></div><button class="icon-btn" id="sheetClose" type="button" aria-label="סגור">' + ICON.x + '</button></div>' +
    '<label class="ed-date" for="edDate"><span>תאריך האימון</span><input type="date" id="edDate" value="' + isoDay(new Date(s.ts)) + '" max="' + isoDay(new Date()) + '"></label>' +
    '<p class="ed-note">כל שינוי נשמר מיד. סט בלי מספר חזרות נחשב כלא בוצע.</p><div class="ed-list">' + list + '</div><div class="ed-act" id="edAct">' + editorActions(s) + '</div></div>';
  sh.hidden = false;
}
function closeSheet() {
  const sh = $('#sheet'); if (sh.hidden) return;
  sh.hidden = true; sh.innerHTML = '';
  if (S.edSid) { S.edSid = null; S.edDel = false; renderAll(); }
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
  S.tab = s.w; S.touched = true; S.open = null; S.edSid = null; S.edDel = false;
  const sh = $('#sheet'); sh.hidden = true; sh.innerHTML = '';
  renderAll();
  const first = PLAN[S.tab].ex.find((e) => firstUndone(s, e) >= 0); if (first) { openEx(first.id, false); renderDock(); }
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}
async function exportCsv() {
  if (!S.dl) return;
  const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"', lines = ['date,workout,exercise,set,kg,reps'];
  for (const s of sorted().reverse()) for (const e of PLAN[s.w].ex) rowsOf(s, e.id).forEach((r, i) => { if (isDone(r)) lines.push([new Date(s.ts).toISOString().slice(0, 10), q(PLAN[s.w].name), q(e.name), i + 1, r.kg == null ? '' : r.kg, r.reps == null ? '' : r.reps].join(',')); });
  try { await S.dl.save({ filename: 'gymi-log.csv', data: '﻿' + lines.join('\r\n') }); } catch (e) { if (e && e.code !== 'declined' && e.code !== 'rate_limited') { S.dl = null; renderHistory(); } }
}
function onRemoteChange() {
  const a = document.activeElement;
  if (a && a.closest && a.closest('#dock') && a.tagName === 'INPUT') return;
  sweep(); if (!S.touched) S.tab = nextUp().next;
  renderAll();
}

/* ================================================================== wiring */
function wireApp() {
  $('#tabs').addEventListener('click', (ev) => {
    const b = ev.target.closest('.tab'); if (!b) return;
    S.tab = +b.dataset.tab; S.touched = true; S.open = null; S.edit = null; S.draft = null; S.resetAsk = false; S.banner = '';
    if (rest.on) { clearInterval(rest.iv); rest.on = false; rest.last = null; }
    renderAll();
    const first = PLAN[S.tab].ex.find((e) => firstUndone(live(S.tab), e) >= 0); if (first) { openEx(first.id, false); renderDock(); }
  });
  const list = $('#exList');
  list.addEventListener('click', (ev) => {
    const li = ev.target.closest('.ex'); if (!li) return;
    const e = findEx(li.dataset.id);
    if (ev.target.closest('.ex-head')) { S.touched = true; S.draft = null; if (S.open === e.id) closeEx(), markCur(); else openEx(e.id, false); if (!rest.on && !S.edit) renderDock(); return; }
    if (ev.target.closest('.stage-play')) { setPlaying(!player.playing); return; }
    const sp = ev.target.closest('.stage-speed'); if (sp) { player.speed = player.speed < 1 ? 1 : 0.5; sp.setAttribute('aria-pressed', String(player.speed < 1)); return; }
    if (ev.target.closest('.ask')) { openChat(e.id); return; }
    if (ev.target.closest('.same')) { S.touched = true; sameAsLast(e); return; }
    const p = ev.target.closest('.setp');
    if (p) {
      S.touched = true; const i = +p.dataset.i, s = ensure(S.tab);
      if (rest.on) { clearInterval(rest.iv); rest.on = false; rest.last = null; }
      S.edit = isDone(rowsOf(s, e.id)[i]) ? { ex: e.id, i } : null; S.mini = false; S.draft = null;
      renderHero(); updateProgress(); renderHistory(); refreshOpenSets(); renderDock(); keepAwake();
    }
  });
  const dock = $('#dock');
  let hold = 0, rep = 0;
  const endHold = () => { clearTimeout(hold); clearInterval(rep); };
  dock.addEventListener('pointerdown', (ev) => {
    const st = ev.target.closest('.step'); if (!st) return;
    ev.preventDefault(); const d = +st.dataset.d; stepKg(d); buzz(6); endHold();
    hold = setTimeout(() => { rep = setInterval(() => stepKg(d), 90); }, 380);
  });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) dock.addEventListener(t, endHold);
  dock.addEventListener('click', (ev) => {
    const t = ev.target, id = (t.closest('button,[role="button"]') || {}).id;
    const st = t.closest('.step'); if (st) { if (ev.detail === 0) stepKg(+st.dataset.d); return; }
    const ch = t.closest('.chip-r[data-r]'); if (ch) { S.touched = true; chooseReps(+ch.dataset.r, ch); return; }
    if (id === 'repsMore') typeReps();
    else if (id === 'repsOk') chooseReps(num($('#repsIn').value, true), null);
    else if (id === 'dkKg') typeKg();
    else if (id === 'dkStart') { S.touched = true; ensure(S.tab); primeAudio(); keepAwake(); S.mini = false; saveLocal(); renderHero(); updateProgress(); renderHistory(); renderTabs(); const c = cursor(); if (c && S.open !== c.e.id) openEx(c.e.id, true); else refreshOpenSets(); renderDock(); }
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
    if (ev.target.id === 'repsIn' && ev.key === 'Enter') { ev.preventDefault(); chooseReps(num(ev.target.value, true), null); }
  });
  $('#history').addEventListener('click', (ev) => {
    const id = (ev.target.closest('button') || {}).id;
    if (id === 'finishBtn') finishWorkout();
    else if (id === 'resetBtn') { S.resetAsk = true; renderHistory(); }
    else if (id === 'resetNo') { S.resetAsk = false; renderHistory(); }
    else if (id === 'resetYes') { const s = live(S.tab); if (s) { delete S.sessions[s.id]; S.gone.add(s.id); S.dirty.add(s.id); saveLocal(); schedule(s.id, 100); } clearInterval(rest.iv); rest.on = false; S.resetAsk = false; S.edit = null; S.draft = null; letSleep(); renderAll(); }
    else if (id === 'exportBtn') exportCsv();
    const b = ev.target.closest('button'), ds = b ? b.dataset : {};
    if (ds.del) { S.delAsk = ds.del; renderHistory(); }
    else if (ds.delno) { S.delAsk = null; renderHistory(); }
    else if (ds.delyes && S.sessions[ds.delyes]) { deleteSession(ds.delyes); S.delAsk = null; if (!S.touched) S.tab = nextUp().next; renderAll(); }
    else if (ds.edit) { S.delAsk = null; openEditor(ds.edit); }
    else if (id === 'histMore') { S.histN = (S.histN || 6) + 10; renderHistory(); }
  });
  $('#hero').addEventListener('click', (ev) => { if (ev.target.closest('#bannerX')) { S.banner = ''; renderHero(); updateProgress(); } });
  const sheet = $('#sheet');
  sheet.addEventListener('click', (ev) => {
    const id = (ev.target.closest('button') || {}).id;
    if (ev.target === sheet || id === 'sheetClose' || id === 'edDone') { closeSheet(); return; }
    if (id === 'edDelAsk' || id === 'edDelNo') { S.edDel = id === 'edDelAsk'; $('#edAct').innerHTML = editorActions(S.sessions[S.edSid]); }
    else if (id === 'edDelYes') { deleteSession(S.edSid); if (!S.touched) S.tab = nextUp().next; closeSheet(); }
    else if (id === 'edReopen') editorReopen();
    const clr = ev.target.closest('.ed-clr');
    if (clr) { const rowEl = clr.closest('.ed-row'); $$('input', rowEl).forEach((x) => { x.value = ''; }); editorInput(rowEl); }
  });
  sheet.addEventListener('input', (ev) => { const inp = ev.target.closest('.ed-row input'); if (inp) editorInput(inp.closest('.ed-row')); });
  sheet.addEventListener('change', (ev) => { if (ev.target.id === 'edDate') editorDate(ev.target.value); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { if (!sheet.hidden) closeSheet(); else closeChat(); } });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onTheme);
  new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) return; if (rest.on) tickRest(); if (live(S.tab)) keepAwake(); });
  setInterval(tickElapsed, 1000);
  setInterval(() => { if (sweep()) renderAll(); }, 60000);
}
