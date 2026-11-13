/* ================================================================== helpers + data layer */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const Ltr = (s) => '<bdi dir="ltr">' + s + '</bdi>';
const reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const HOUR = 3600e3, LS_KEY = 'ul4:v1', STALE = 3 * HOUR, MAX_SETS = 8;
const ICON = {
  play: '<svg class="i" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>',
  pause: '<svg class="i" viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  check: '<svg class="i" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  cam: '<svg class="i" viewBox="0 0 24 24"><path d="M4 8h3l1.6-2.2h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.4"/></svg>',
  x: '<svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  send: '<svg class="i" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  stop: '<svg class="i" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg>',
  snd: '<svg class="i" viewBox="0 0 24 24"><path d="M4 10v4h3l5 4V6L7 10z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>',
  mute: '<svg class="i" viewBox="0 0 24 24"><path d="M4 10v4h3l5 4V6L7 10z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  down: '<svg class="i" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  up: '<svg class="i" viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
  go: '<svg class="i" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
  swap: '<svg class="i" viewBox="0 0 24 24"><path d="M4 8h13M13 4l4 4-4 4M20 16H7M11 12l-4 4 4 4"/></svg>',
  pin: '<svg class="i" viewBox="0 0 24 24"><path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7"/></svg>',
  fwd: '<svg class="i" viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6"/></svg>',
  back: '<svg class="i" viewBox="0 0 24 24"><path d="M10 6l6 6-6 6"/></svg>',
  list: '<svg class="i" viewBox="0 0 24 24"><path d="M8.5 7h11M8.5 12h11M8.5 17h11"/><path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" stroke-width="2.6"/></svg>',
  chat: '<svg class="i" viewBox="0 0 24 24"><path d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-7l-4 3v-3H5A1.5 1.5 0 0 1 3.5 15V8A1.5 1.5 0 0 1 5 6.5z"/></svg>',
  clock: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.5l2.3 1.8M9.5 3.5h5"/></svg>',
  bell: '<svg class="i" viewBox="0 0 24 24"><path d="M6.5 8v8M3.5 10v4M17.5 8v8M20.5 10v4M6.5 12h11"/></svg>',
  cues: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12h.01"/></svg>',
};
/* S.sessions: id -> one workout:
   { id, v, w (workout 0-3), ts (start), end, mt, upd, sets: { slotId: [ { kg, reps, done, t, pr, tk, tr } ] },
     m (mesocycle id), wk (week in it), dl (deload), rir (reps in reserve asked for), n: { slotId: planned sets }, o: [slot ids in this workout's order],
     mv: { slotId: movement, when swapped }, sore: { muscle: 0 never | 1 healed in time | 2 still sore },
     fb: { slotId: { pain, pump, load } }, cut: { slotId: slot whose pain report cancelled it }, ft (time of the last change to these) }
   S.cfg: settings and the running mesocycle, one document shared by the viewer's devices */
/* S.cfg.me: the player. name and look (the character's choices, see avatar.js), made (when the character was set up),
   arch (totals of workouts too old to be kept on the device, see game.js), badges: { id: when it was earned } */
const meDef = () => ({ name: '', look: { skin: 1, hair: 1, hc: 0, beard: 0, shirt: 0 }, made: 0, arch: archZero(), badges: {} });
function normMe(v) {
  const d = meDef(), pick = (x, n, dflt) => (Number.isInteger(x) && x >= 0 && x < n ? x : dflt), pos = (x) => (typeof x === 'number' && isFinite(x) && x > 0 ? x : 0), obj = (x) => (x && typeof x === 'object' ? x : {});
  v = obj(v); const l = obj(v.look), a = obj(v.arch), b = obj(v.badges);
  const out = { name: typeof v.name === 'string' ? v.name.trim().slice(0, 16) : '', look: { skin: pick(l.skin, SKIN.length, d.look.skin), hair: pick(l.hair, HAIR.length, d.look.hair), hc: pick(l.hc, HAIRC.length, 0), beard: pick(l.beard, BEARD.length, 0), shirt: pick(l.shirt, SHIRT.length, 0) }, made: pos(v.made), arch: {}, badges: {} };
  for (const k of Object.keys(d.arch)) out.arch[k] = pos(a[k]);
  for (const x of BADGES) if (pos(b[x.id])) out.badges[x.id] = b[x.id];
  return out;
}
/* S.cfg.slots: exercises the lifter added to the plan, { id: { w, a, sets, reps, rest } }. They are never removed, so old workouts stay readable.
   S.cfg.order: { workout: [slot ids] } for a workout whose list was changed; a workout that is not there follows the plan */
const cfgDef = () => ({ upd: 0, weeks: 5, inc: {}, swap: {}, notes: {}, base: {}, slots: {}, order: {}, meso: { id: 'm1', n: 1, start: 0, early: 0, asked: '' }, past: [], me: meDef() });
const S = { view: 'home', cfgReady: false, tab: 0, open: null, sessions: {}, sound: true, col: null, dirty: new Set(), gone: new Set(), touched: false, draft: null, edit: null, mini: false, resetAsk: false, banner: '', bannerKind: '', cfg: cfgDef(), pre: {}, fbFor: null };
const clone = (x) => JSON.parse(JSON.stringify(x));
const SLOT_ID = /^c[a-z0-9]{4,20}$/;
function cleanSlots(v) { const out = {}; if (v && typeof v === 'object') for (const id of Object.keys(v).slice(0, 400)) { const c = SLOT_ID.test(id) ? cleanSlot(v[id]) : null; if (c) out[id] = c; } return out; }
function normCfg(v) {
  const d = cfgDef(), obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? clone(x) : {});
  v = v || {};
  return {
    upd: +v.upd || 0, weeks: clamp(Math.round(+v.weeks) || 5, 4, 7), inc: obj(v.inc), swap: obj(v.swap), notes: obj(v.notes), base: obj(v.base), slots: cleanSlots(v.slots), order: obj(v.order),
    meso: v.meso && v.meso.id ? { id: String(v.meso.id), n: +v.meso.n || 1, start: +v.meso.start || 0, early: +v.meso.early || 0, asked: String(v.meso.asked || '') } : d.meso,
    past: Array.isArray(v.past) ? clone(v.past).slice(-4) : [], me: normMe(v.me),
  };
}
function loadLocal() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; } }
function saveLocal() {
  try {
    const keep = Object.values(S.sessions).sort((a, b) => b.ts - a.ts).slice(0, 80);
    localStorage.setItem(LS_KEY, JSON.stringify({ sessions: Object.fromEntries(keep.map((s) => [s.id, s])), sound: S.sound, dirty: Array.from(S.dirty), gone: Array.from(S.gone), cfg: S.cfg, pre: S.pre }));
  } catch (e) { /* storage unavailable: keep working in memory */ }
}
function saveCfg() { S.cfg.upd = Date.now(); S.dirty.add('cfg'); saveLocal(); schedule('cfg'); }
const rowsOf = (s, exId) => (s && s.sets && s.sets[exId]) || [];
const isDone = (r) => !!(r && r.done);
const hasDone = (s) => Object.values(s.sets || {}).some((a) => (a || []).some(isDone));
const sorted = () => Object.values(S.sessions).sort((a, b) => b.ts - a.ts);
const live = (w) => sorted().find((x) => x.w === w && !x.end) || null;
/* ---- the plan as the lifter keeps it: the plan's own slots, plus added ones, in the order chosen for each workout ---- */
const SLOT = {};
PLAN.forEach((wk, w) => wk.ex.forEach((e) => { e.w = w; SLOT[e.id] = e; }));
const intOf = (lvl) => (lvl === 2 ? say('1 חזרה לפני כשל', '1 rep before failure') : lvl === 3 ? say('סט אחרון לכשל טכני', 'Last set to failure') : say('חזרות מבוקרות', 'Controlled reps'));
/* one slot by its id, in the shape of a plan slot. null for an id nobody knows */
function planEx(id) {
  if (SLOT[id]) return SLOT[id];
  const c = S.cfg.slots[id]; if (!c) return null;
  return { id, w: c.w, a: c.a, name: EN[c.a], sets: c.sets, reps: c.reps, rest: c.rest, int: intOf(rxOf(c.a).lvl), lvl: rxOf(c.a).lvl, suf: '', added: true };
}
const wkOf = (id) => { const pe = planEx(id); return pe ? pe.w : -1; };
const inWk = (w) => (id) => { const pe = planEx(id); return !!pe && pe.w === w; };
/* the slots of a workout as it is planned now */
const planIds = (w) => orderOf(PLAN[w].ex.map((e) => e.id), S.cfg.order[w], inWk(w));
const planSlots = (w) => planIds(w).map(planEx);
/* the slots of one workout that was started: the order it began with, then anything else that has sets in it */
function sessSlots(s) {
  const ok = inWk(s.w), ids = orderOf(planIds(s.w), s.o, ok).slice();
  for (const id of Object.keys(s.sets || {})) if (!ids.includes(id) && ok(id) && (s.sets[id] || []).some(isDone)) ids.push(id);
  return ids.map(planEx);
}
/* the movement done in a plan slot: a workout remembers its own, the next one follows the saved swaps */
const moveOf = (pe, s) => { const k = s ? s.mv && s.mv[pe.id] : S.cfg.swap[pe.id]; return k && LIB[k] ? k : pe.a; };
const incOf = (mv) => { const q = LIB[mv].eq, v = +S.cfg.inc[q]; return v > 0 ? v : EQUIP[q].inc; };

/* ---- mesocycle: a week is one pass through the four workouts; the last week is a deload ---- */
const mesoSessions = (id) => Object.values(S.sessions).filter((x) => x.m === id && hasDone(x));
/* a mesocycle is over once every one of the four workouts has had its deload */
function mesoDone(M) { const l = mesoSessions(M.id); return [0, 1, 2, 3].every((w) => l.some((x) => x.w === w && x.dl && x.end)); }
/* where the next workout of this type falls: mesocycle, week, deload or not, reps in reserve */
function phaseNext(w) {
  let M = S.cfg.meso, fresh = false;
  if (mesoDone(M)) { M = { id: 'm' + (M.n + 1), n: M.n + 1, early: 0 }; fresh = true; }
  const wk = 1 + mesoSessions(M.id).filter((x) => x.w === w).length, dl = !!M.early || wk >= S.cfg.weeks;
  return { m: M.id, n: M.n, wk, dl, rir: dl ? 4 : rirFor(wk, S.cfg.weeks), fresh };
}
function phase(w, s) {
  if (s && s.m) return { m: s.m, n: +String(s.m).slice(1) || 1, wk: s.wk || 1, dl: !!s.dl, rir: s.rir == null ? null : s.rir };
  if (s) return { m: null, n: 0, wk: 0, dl: false, rir: null };
  return phaseNext(w);
}
function newMeso() {
  const M = S.cfg.meso;
  S.cfg.past = (S.cfg.past || []).concat({ id: M.id, n: M.n, end: Date.now() }).slice(-4);
  S.cfg.meso = { id: 'm' + (M.n + 1), n: M.n + 1, start: Date.now(), early: 0, asked: '' };
  saveCfg();
}
/* recovery answers given before the workout exists are kept for half a day */
const preOf = (w) => { const p = S.pre[w]; return p && Date.now() - p.t < 12 * HOUR ? p.v : {}; };
const soreOf = (w, s) => (s ? s.sore || {} : preOf(w));
/* how the work felt for a muscle the last time it was rated: 0 easy, 1 right, 2 too much, null unknown */
function lastFelt(mu) {
  for (const x of sorted()) {
    if (!x.fb || !hasDone(x)) continue;
    const v = sessSlots(x).filter((pe) => LIB[moveOf(pe, x)].p === mu && x.fb[pe.id] && x.fb[pe.id].load != null).map((pe) => x.fb[pe.id].load);
    if (v.length) return Math.max.apply(null, v);
  }
  return null;
}
/* the most recent finished workout that trained a muscle directly */
const lastTrained = (mu) => sorted().find((x) => x.end && sessSlots(x).some((pe) => LIB[moveOf(pe, x)].p === mu && rowsOf(x, pe.id).some(isDone))) || null;
/* set count per slot for the next workout of this type: last week's count in this mesocycle (or the plan), then recovery feedback, or the deload cut */
function planned(w, sore) {
  const P = phaseNext(w), out = {};
  const prev = sorted().find((x) => x.w === w && x.m === P.m && !x.dl && x.n && hasDone(x));
  for (const pe of planSlots(w)) { const b = S.cfg.base[pe.id]; out[pe.id] = prev && prev.n[pe.id] != null && !(b && b.t > prev.ts) ? prev.n[pe.id] : b && b.n ? b.n : pe.sets; }
  if (P.dl) { for (const id of Object.keys(out)) out[id] = Math.max(1, Math.ceil(out[id] / 2)); return out; }
  for (const mu of Object.keys(sore || {})) {
    const ids = planSlots(w).filter((pe) => LIB[pe.a].p === mu).map((pe) => pe.id);
    if (sore[mu] === 2) { const id = ids.slice().reverse().find((k) => out[k] > 1); if (id) out[id]--; }
    else if (sore[mu] === 0 && lastFelt(mu) === 0) { const id = ids.find((k) => out[k] < MAX_SETS); if (id) out[id]++; }
  }
  return out;
}
/* fix a new workout's place in the mesocycle, its set counts and its swaps */
function stamp(s) {
  const P = phaseNext(s.w);
  if (P.fresh) newMeso();
  s.m = P.m; s.wk = P.wk; s.dl = P.dl ? 1 : 0; s.rir = P.rir; s.sore = Object.assign({}, preOf(s.w)); s.mv = {}; s.fb = {}; s.cut = {};
  s.o = planIds(s.w);
  for (const pe of planSlots(s.w)) { const k = S.cfg.swap[pe.id]; if (k && LIB[k] && k !== pe.a) s.mv[pe.id] = k; }
  s.n = planned(s.w, s.sore); s.ft = Date.now(); s.v = 3;
  delete S.pre[s.w];
}
function ensure(w) {
  let s = live(w);
  if (!s) { s = { id: 's' + Date.now().toString(36) + 'w' + w, v: 3, w, ts: Date.now(), end: 0, upd: Date.now(), sets: {} }; stamp(s); S.sessions[s.id] = s; }
  return s;
}
function lastT(s) { let t = s.ts; for (const a of Object.values(s.sets || {})) for (const r of a || []) if (r && r.t > t) t = r.t; return t; }
/* a workout left open for hours is closed at its last logged set, so "next up" moves on by itself */
function sweep() {
  let changed = false;
  for (const s of Object.values(S.sessions)) {
    if (s.end) continue;
    const idle = Date.now() - Math.max(lastT(s), s.upd || 0);
    if (idle < STALE) continue;
    if (hasDone(s)) { s.end = lastT(s); s.mt = Date.now(); touch(s, true); } else { delete S.sessions[s.id]; S.gone.add(s.id); S.dirty.add(s.id); schedule(s.id); }
    changed = true;
  }
  if (changed) saveLocal();
  return changed;
}
function nextUp() {
  const l = sorted().filter(hasDone);
  if (!l.length) return { next: 0, live: -1 };
  return l[0].end ? { next: (l[0].w + 1) % 4, live: -1 } : { next: l[0].w, live: l[0].w };
}

/* ---- an exercise as it is done in one workout: the plan slot with that day's movement and set count ---- */
function view(pe, s, plan) {
  const mv = moveOf(pe, s), cut = !!(s && s.cut && s.cut[pe.id]);
  const n0 = s ? (s.n && s.n[pe.id] != null ? s.n[pe.id] : pe.sets) : plan[pe.id] != null ? plan[pe.id] : pe.sets;
  let n = n0;
  if (cut) { const r = rowsOf(s, pe.id); n = 0; r.forEach((x, i) => { if (isDone(x)) n = i + 1; }); n = Math.min(n, n0); }
  return { id: pe.id, a: animOf(mv), mv, name: mv === pe.a ? pe.name : EN[mv], he: LIB[mv].he, nm: say(LIB[mv].he, mv === pe.a ? pe.name : EN[mv]), sets: n, n0, plan: pe.sets, reps: pe.reps, rest: pe.rest, int: pe.int, lvl: pe.lvl, suf: pe.suf, cut, swapped: mv !== pe.a };
}
function exList(w, s) { if (s === undefined) s = live(w); const plan = s ? null : planned(w, preOf(w)); return (s ? sessSlots(s) : planSlots(w)).map((pe) => view(pe, s, plan)); }
function findEx(id, s) { const pe = planEx(id); if (!pe) return null; const w = wkOf(id); if (s === undefined) s = live(w); return view(pe, s, s ? null : planned(w, preOf(w))); }
const doneCount = (s, e) => rowsOf(s, e.id).slice(0, e.sets).filter(isDone).length;
const firstUndone = (s, e) => { const r = rowsOf(s, e.id); for (let i = 0; i < e.sets; i++) if (!isDone(r[i])) return i; return -1; };
/* reps in reserve for one exercise today: the week's number, one more when its muscle is still sore */
function rirOf(e, s) { const w = wkOf(e.id), P = phase(w, s); if (P.rir == null) return null; return Math.min(4, P.rir + (!P.dl && soreOf(w, s)[LIB[e.mv].p] === 2 ? 1 : 0)); }

/* best set logged for a movement, in any slot; can leave out or isolate one workout */
function bestFor(mv, o) {
  let best = null; o = o || {}; const L = LIB[mv];
  for (const s of Object.values(S.sessions)) for (const pe of sessSlots(s)) {
    if ((o.notS && s.id === o.notS) || (o.onlyS && s.id !== o.onlyS) || moveOf(pe, s) !== mv) continue;
    rowsOf(s, pe.id).forEach((r, i) => {
      if (!isDone(r) || r.kg == null || !(r.kg > 0) || r.reps == null || (o.skipEx === pe.id && o.skipI === i)) return;
      const v = score(L, r.kg, r.reps); if (!best || v > best.v) best = { v, kg: r.kg, reps: r.reps };
    });
  }
  return best;
}
/* the same set the last time this movement was trained in this slot (a deload is not a yardstick); failing that, the movement in another slot */
function refRow(e, i, s) {
  const w = wkOf(e.id), pe = planEx(e.id), not = s && s.id, all = sorted(), mu = LIB[e.mv].p;
  const pick = (x, id) => {
    const r = rowsOf(x, id), d = r.filter((q) => isDone(q) && q.reps != null); if (!d.length) return null;
    const row = isDone(r[i]) && r[i].reps != null ? r[i] : d[d.length - 1];
    return { kg: row.kg == null ? null : row.kg, reps: row.reps, rir: x.rir == null ? null : Math.min(4, x.rir + (x.sore && x.sore[mu] === 2 ? 1 : 0)), ts: x.ts, sid: x.id };
  };
  for (const x of all) { if (x.w !== w || x.id === not || x.dl || moveOf(pe, x) !== e.mv) continue; const r = pick(x, e.id); if (r) return r; }
  for (const x of all) {
    if (x.id === not || x.dl) continue;
    for (const o of sessSlots(x)) { if (o.id === e.id || moveOf(o, x) !== e.mv) continue; const r = pick(x, o.id); if (r) { r.other = true; return r; } }
  }
  return null;
}
/* what to aim for on set i: progress on last time, then re-aimed by the sets already done today. null when there is nothing to go on yet */
function targetOf(e, i, s) {
  const w = wkOf(e.id), L = LIB[e.mv], P = phase(w, s), rr = repRange(e), ref = refRow(e, i, s);
  const o = { lo: rr[0], hi: rr[1], inc: incOf(e.mv), rir: P.rir == null ? (ref && ref.rir != null ? ref.rir : 1) : P.rir, sore: !P.dl && soreOf(w, s)[L.p] === 2 ? 1 : 0, dl: P.dl, inv: !!L.inv };
  let T = !ref ? null : ref.other && !P.dl ? { kg: ref.kg, reps: clamp(ref.reps, o.lo, o.hi), mode: 'hold' } : nextTarget(ref, o);
  const cur = rowsOf(s, e.id);
  for (let k = i - 1; k >= 0; k--) if (isDone(cur[k]) && cur[k].reps != null) { T = adjustTarget(T, cur[k], o); break; }
  return T ? { kg: T.kg, reps: T.reps, mode: T.mode, ref } : null;
}

/* ---- feedback during the workout ---- */
/* severe joint pain stops the rest of today's work for that muscle; taking the answer back restores it */
function painCut(s, exId, on) {
  const cut = s.cut || (s.cut = {});
  if (!on) { for (const k of Object.keys(cut)) if (cut[k] === exId) delete cut[k]; return; }
  const mu = LIB[moveOf(planEx(exId), s)].p;
  for (const e of exList(s.w, s)) if (LIB[e.mv].p === mu && !e.cut && firstUndone(s, e) >= 0) cut[e.id] = exId;
}
function setFb(exId, key, v) {
  const s = live(wkOf(exId)); if (!s) return null;
  const fb = s.fb || (s.fb = {}), f = fb[exId] || (fb[exId] = { pain: null, pump: null, load: null }), was = f.pain;
  f[key] = v;
  if (key === 'pain' && (v === 2) !== (was === 2)) painCut(s, exId, v === 2);
  s.ft = Date.now(); touch(s);
  return f;
}
function setSore(w, mu, v) {
  const s = live(w);
  if (s) { if (hasDone(s)) return; s.sore = Object.assign({}, s.sore, { [mu]: v }); s.n = planned(w, s.sore); s.ft = Date.now(); touch(s); }
  else { S.pre[w] = { t: Date.now(), v: Object.assign({}, preOf(w), { [mu]: v }) }; saveLocal(); }
}
/* a movement that gave a weak pump the last two times it was rated is worth replacing */
function lowPump(mv) {
  let n = 0;
  for (const x of sorted()) for (const pe of sessSlots(x)) {
    const f = x.fb && x.fb[pe.id]; if (!f || f.pump == null || moveOf(pe, x) !== mv) continue;
    if (f.pump !== 0) return false; if (++n >= 2) return true;
  }
  return false;
}
/* muscles whose first set fell short of its target in a workout */
function missedMuscles(s) {
  const out = new Set();
  for (const pe of sessSlots(s)) { const r = rowsOf(s, pe.id)[0], L = LIB[moveOf(pe, s)]; if (isDone(r) && r.tr != null && score(L, r.kg, r.reps) < score(L, r.tk, r.tr) - 0.01) out.add(L.p); }
  return out;
}
/* fatigue is building up when the last two workouts each fell short for two muscle groups or more */
function fatigued() {
  const l = sorted().filter((x) => x.m === S.cfg.meso.id && x.end && !x.dl && hasDone(x)).slice(0, 2);
  return l.length === 2 && l.every((x) => missedMuscles(x).size >= 2);
}
/* swap options for a slot: the same movement pattern only, joint-friendly ones first */
function swapOptions(e) {
  const L = LIB[e.mv];
  return Object.keys(LIB).filter((k) => k !== e.mv && LIB[k].pat === L.pat && LIB[k].p === L.p).sort((a, b) => (LIB[b].jf ? 1 : 0) - (LIB[a].jf ? 1 : 0));
}
/* after a pain report: a movement of the same pattern that is not already in this workout, a joint-friendly one if there is one */
function gentleAlt(e) { const used = exList(wkOf(e.id)).map((x) => x.mv), o = swapOptions(e); return o.find((k) => LIB[k].jf && !used.includes(k)) || o.find((k) => !used.includes(k)) || o[0] || null; }
/* returns true when today's workout switched, false when the change waits for the next one */
function swapTo(exId, mv, always) {
  const pe = planEx(exId), w = wkOf(exId);
  if (!pe || !LIB[mv]) return false;
  if (always) { if (mv === pe.a) delete S.cfg.swap[exId]; else S.cfg.swap[exId] = mv; saveCfg(); }
  let s = live(w);
  if (!s && !always) s = ensure(w);
  if (!s || rowsOf(s, exId).some(isDone)) return !s;
  s.mv = Object.assign({}, s.mv); if (mv === pe.a) delete s.mv[exId]; else s.mv[exId] = mv;
  s.ft = Date.now(); touch(s);
  return true;
}
/* ---- changing the list of a workout: add, remove, move, or put a different kind of movement in a slot's place.
   A workout that is running follows, except for a slot that already has sets in it today ---- */
const newSlotId = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
function setOrder(w, ids, liveIds) {
  S.cfg.order[w] = ids; saveCfg();
  const s = live(w);
  if (s && liveIds) { s.o = liveIds; s.ft = Date.now(); touch(s); }
}
/* the slot ids of the running workout, if there is one, ready to be changed alongside the plan */
const liveIds = (w) => { const s = live(w); return s ? sessSlots(s).map((pe) => pe.id) : null; };
function addSlot(w, mv, at, sets) {
  if (!PLAN[w] || !LIB[mv]) return null;
  const id = newSlotId(), rx = rxOf(mv), ids = planIds(w).slice(), now = liveIds(w), i = at == null || at < 0 ? ids.length : Math.min(at, ids.length);
  S.cfg.slots[id] = { w, a: mv, sets: clamp(sets || rx.sets, 1, MAX_SETS), reps: rx.reps, rest: rx.rest };
  ids.splice(i, 0, id);
  if (now) { const prev = ids[i - 1], k = prev ? now.indexOf(prev) + 1 : 0; now.splice(k > 0 || !prev ? k : now.length, 0, id); }
  setOrder(w, ids, now);
  return id;
}
/* false when it is the last exercise of its workout, which has to stay */
function removeSlot(id) {
  const w = wkOf(id), ids = w < 0 ? [] : planIds(w).slice(), s = w < 0 ? null : live(w);
  if (!ids.includes(id) || ids.length <= 1) return false;
  const started = !!s && rowsOf(s, id).some(isDone), now = liveIds(w);
  setOrder(w, ids.filter((x) => x !== id), now && !started ? now.filter((x) => x !== id) : now);
  return true;
}
function moveSlot(id, d) {
  const w = wkOf(id), ids = w < 0 ? [] : planIds(w).slice(), i = ids.indexOf(id), j = i + d;
  if (i < 0 || j < 0 || j >= ids.length) return false;
  const other = ids[j], now = liveIds(w);
  ids[i] = other; ids[j] = id;
  if (now) { const a = now.indexOf(id), b = now.indexOf(other); if (a >= 0 && b >= 0) { now[a] = other; now[b] = id; } }
  setOrder(w, ids, now);
  return true;
}
/* put another movement in a slot's place for good. The same kind of movement keeps the slot (and its numbers and history);
   a different kind gets a slot of its own with numbers that suit it. Returns the id of the slot that now holds it */
function replaceSlot(exId, mv) {
  const pe = planEx(exId), w = wkOf(exId);
  if (!pe || !LIB[mv]) return null;
  if (LIB[mv].pat === LIB[pe.a].pat && LIB[mv].p === LIB[pe.a].p) { swapTo(exId, mv, true); return exId; }
  const ids = planIds(w).slice(), i = ids.indexOf(exId), s = live(w), started = !!s && rowsOf(s, exId).some(isDone), now = liveIds(w), id = newSlotId(), rx = rxOf(mv);
  if (i < 0) return null;
  S.cfg.slots[id] = { w, a: mv, sets: rx.sets, reps: rx.reps, rest: rx.rest };
  ids[i] = id;
  if (now && !started) { const k = now.indexOf(exId); if (k >= 0) now[k] = id; else now.push(id); }
  setOrder(w, ids, started ? null : now);
  return id;
}
/* back to the plan as it was written: its own exercises, in its own order */
function resetPlan() {
  S.cfg.order = {}; S.cfg.swap = {}; saveCfg();
  for (let w = 0; w < PLAN.length; w++) { const s = live(w); if (s && s.o) { s.o = sessSlots(Object.assign({}, s, { o: null })).map((pe) => pe.id); s.ft = Date.now(); touch(s); } }
}
const planChanged = () => Object.keys(S.cfg.order).length > 0 || Object.keys(S.cfg.swap).length > 0;
function setBase(exId, n) {
  n = clamp(n, 1, MAX_SETS);
  S.cfg.base[exId] = { n, t: Date.now() }; saveCfg();
  const s = live(wkOf(exId));
  if (s && !s.dl && s.n && rowsOf(s, exId).filter(isDone).length <= n) { s.n = Object.assign({}, s.n, { [exId]: n }); s.ft = Date.now(); touch(s); }
}
/* the week as it stands now: every slot with its movement and planned sets */
function weekItems() { const out = []; for (let w = 0; w < 4; w++) for (const e of exList(w)) out.push({ id: e.id, w, mv: e.mv, sets: e.n0 }); return out; }
/* how many muscles sit under their minimum or over their maximum weekly volume as the week is planned now */
function volWarn() { const v = muscleVolume(weekItems()); return Object.keys(MUSCLE).filter((k) => landmark(k, v[k].d + v[k].i) !== 'ok').length; }
/* what one mesocycle did: sets per week (start and peak), strength change per movement, and the movements that answered best */
function mesoSummary(id) {
  const l = mesoSessions(id).sort((a, b) => a.ts - b.ts), wkSets = {}, mus = {}, lifts = {};
  for (const x of l) for (const pe of sessSlots(x)) {
    const mv = moveOf(pe, x), L = LIB[mv], rows = rowsOf(x, pe.id).filter((r) => isDone(r) && r.reps != null), f = x.fb && x.fb[pe.id];
    if (!rows.length) continue;
    const o = lifts[mv] || (lifts[mv] = { mv, first: null, best: null, pump: [], pain: [] });
    if (f) { if (f.pump != null) o.pump.push(f.pump); if (f.pain != null) o.pain.push(f.pain); }
    if (x.dl) continue;
    wkSets[x.wk] = (wkSets[x.wk] || 0) + rows.length;
    const add = (k, v) => { const m = mus[k] || (mus[k] = {}); m[x.wk] = (m[x.wk] || 0) + v; };
    add(L.p, rows.length); for (const k of L.s) add(k, rows.length * 0.5);
    const top = rows.reduce((a, b) => (score(L, b.kg, b.reps) > score(L, a.kg, a.reps) ? b : a)), v = score(L, top.kg, top.reps);
    if (!o.first) o.first = { v, row: top, wk: x.wk }; else if (!o.best || v > o.best.v) o.best = { v, row: top, wk: x.wk };
  }
  const span = (m) => { const ks = Object.keys(m).map(Number).sort((a, b) => a - b); if (!ks.length) return null; const peak = ks.reduce((a, b) => (m[b] > m[a] ? b : a)); return { start: m[ks[0]], peak: m[peak], peakWk: peak, weeks: ks.length }; };
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const gains = Object.values(lifts).filter((o) => o.first && o.best).map((o) => ({ mv: o.mv, first: o.first.row, best: o.best.row, pct: ((o.best.v - o.first.v) / o.first.v) * 100 })).sort((a, b) => b.pct - a.pct);
  const top = Object.values(lifts).filter((o) => o.pump.length).map((o) => ({ mv: o.mv, pump: avg(o.pump), pain: o.pain.length ? avg(o.pain) : 0 })).filter((o) => o.pump >= 1 && o.pain < 1).sort((a, b) => b.pump - 1.5 * b.pain - (a.pump - 1.5 * a.pain)).slice(0, 3);
  return { n: l.length, sets: span(wkSets), mus: Object.keys(MUSCLE).filter((k) => mus[k]).map((k) => Object.assign({ k }, span(mus[k]))), gains, top };
}

/* ---- the player: totals, level and achievements, counted from the log (the rules are in game.js) ---- */
const KEEP = 40;
function meNow() {
  const A = S.cfg.me.arch, list = Object.values(S.sessions), T = totalsOf(list, A), L = levelOf(T.xp);
  return { T, L, rank: rankOf(L.lvl), X: { lvl: L.lvl, streak: streakOf(list, A, Date.now()), fullWeek: fullWeek(list), rounds: roundsDone(list) } };
}
/* keep the stored side of the profile in step with the log: old workouts move into the archive, new achievements get their date.
   Waits until the settings arrived from the account, so a new device never writes over an archive it has not seen yet. Returns the new achievements */
function meSync() {
  if (!S.cfgReady) return [];
  const me = S.cfg.me, got = [], a = archiveStep(Object.values(S.sessions), me.arch, KEEP);
  if (a) me.arch = a;
  const P = meNow();
  for (const id of earned(P.T, P.X)) if (!me.badges[id]) { me.badges[id] = Date.now(); got.push(id); }
  if (a || got.length) saveCfg();
  return got;
}
/* points a workout would bring if every planned set is done */
const xpPlan = (list) => list.reduce((n, e) => n + e.sets, 0) * XP.set + XP.done;

function restText(e) { const a = e.rest[0], b = e.rest[1]; if (a >= 120 && a % 60 === 0 && b % 60 === 0) return Ltr(a === b ? a / 60 : a / 60 + '–' + b / 60) + ' דק׳'; return Ltr(a === b ? a : a + '–' + b) + ' שנ׳'; }
const restPlain = (e) => restText(e).replace(/<[^>]+>/g, '');
const rirText = (r) => (r == null ? '' : r >= 4 ? 'רחוק מכשל' : r === 0 ? 'עד כשל' : r === 1 ? 'חזרה אחת לפני כשל' : r + ' חזרות לפני כשל');
function num(v, int) { const s = String(v == null ? '' : v).trim().replace(',', '.'); if (!/^\d+(\.\d+)?$/.test(s)) return null; const n = parseFloat(s); return int ? Math.round(n) : Math.round(n * 100) / 100; }
function volume(s) { let v = 0; for (const a of Object.values(s.sets || {})) for (const r of a || []) if (isDone(r) && r.kg != null && r.reps != null) v += r.kg * r.reps; return Math.round(v); }
function setsDone(s) { let n = 0; for (const a of Object.values(s.sets || {})) for (const r of a || []) if (isDone(r)) n++; return n; }
function prCount(s) { let n = 0; for (const a of Object.values(s.sets || {})) for (const r of a || []) if (isDone(r) && r.pr) n++; return n; }
function ago(ts) { const d = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / 864e5); return d <= 0 ? 'היום' : d === 1 ? 'אתמול' : 'לפני ' + d + ' ימים'; }
const fmtKg = (kg) => (kg == null ? '' : String(Math.round(kg * 100) / 100));
const fmtRow = (r) => (r.kg != null ? fmtKg(r.kg) + '×' : '') + (r.reps != null ? r.reps : '–');
const mmss = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

/* ---- cloud sync: private per viewer; this device keeps a full local copy and pushes changes ---- */
const writers = new Map();
const W = (id) => { let w = writers.get(id); if (!w) { w = { timer: 0, busy: false, again: false, fail: 0 }; writers.set(id, w); } return w; };
function setSync(state) {
  const t = { cloud: 'נשמר בחשבון Claude', local: 'נשמר במכשיר הזה', slow: 'אין חיבור, נשמר במכשיר', error: 'אין חיבור, נשמר במכשיר' }[state];
  if (t) { S.syncT = t; $('#syncNote').textContent = t; const n = $('#syncNote2'); if (n) n.textContent = t; }
}
function touch(s, quiet) { s.upd = Date.now(); S.dirty.add(s.id); if (!quiet) saveLocal(); schedule(s.id); }
function schedule(id, ms) { const w = W(id); clearTimeout(w.timer); w.timer = setTimeout(() => flush(id), ms == null ? 800 : ms); }
const XK = ['m', 'wk', 'dl', 'rir', 'n', 'o', 'mv', 'sore', 'cut', 'fb'];
function docOf(s) { const d = { v: s.v || 2, w: s.w, ts: s.ts, end: s.end || 0, mt: s.mt || 0, upd: s.upd || s.ts, ft: s.ft || 0, sets: s.sets || {} }; for (const k of XK) if (s[k] != null) d[k] = s[k]; return clone(d); }
const cfgDoc = () => clone(Object.assign({ kind: 'cfg' }, S.cfg));
async function flush(id) {
  const w = W(id);
  if (!S.col || !S.dirty.has(id)) return;
  if (w.busy) { w.again = true; return; }
  w.busy = true;
  const s = S.sessions[id];
  try {
    if (id === 'cfg') await S.col.doc(id).set(cfgDoc()); else if (s) await S.col.doc(id).set(docOf(s)); else await S.col.doc(id).delete();
    if (!w.again) { S.dirty.delete(id); if (!s) S.gone.delete(id); }
    w.fail = 0; saveLocal(); setSync('cloud');
  } catch (e) {
    w.fail++; setSync('error');
    if (w.fail < 4) schedule(id, 2500 * w.fail + Math.random() * 900);
  } finally { w.busy = false; if (w.again) { w.again = false; schedule(id, 300); } }
}
const sig = (s) => !s ? '' : s.ts + '|' + (s.end || 0) + '|' + (s.ft || 0) + '|' + Object.keys(s.sets || {}).sort().map((k) => k + ':' + (s.sets[k] || []).map((r) => (r ? [r.kg, r.reps, r.done ? 1 : 0, r.t || 0].join(',') : '-')).join(';')).join('|');
/* merge set by set: the row with the later timestamp wins, so two devices never wipe each other */
function mergeSession(a, b) {
  if (!a) return [b, false];
  /* start and end follow whoever changed them last on purpose (finish, reopen, date edit); otherwise earliest start, latest end */
  const am = a.mt || 0, bm = b.mt || 0, meta = am > bm ? a : bm > am ? b : null;
  let newer = am > bm || (am === bm && (a.end || 0) > (b.end || 0));
  const out = { id: a.id, v: Math.max(a.v || 1, b.v || 1), w: a.w, ts: meta ? meta.ts : Math.min(a.ts, b.ts || a.ts), end: meta ? meta.end || 0 : Math.max(a.end || 0, b.end || 0), mt: Math.max(am, bm), upd: Math.max(a.upd || 0, b.upd || 0), sets: {} };
  /* the workout's plan (week, set counts, swaps, recovery and feedback answers) travels as one piece: the side that changed it last wins */
  const af = a.ft || 0, bf = b.ft || 0, F = af >= bf ? a : b, G = F === a ? b : a;
  for (const k of XK) { const v = F[k] != null ? F[k] : G[k]; if (v != null) out[k] = v; }
  out.ft = Math.max(af, bf); if (af > bf) newer = true;
  for (const k of new Set(Object.keys(a.sets || {}).concat(Object.keys(b.sets || {})))) {
    const x = (a.sets || {})[k] || [], y = (b.sets || {})[k] || [], arr = [];
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      const tx = x[i] ? x[i].t || 0 : -1, ty = y[i] ? y[i].t || 0 : -1;
      if (tx > ty) { arr[i] = x[i]; newer = true; } else arr[i] = y[i] || x[i] || null;
    }
    out.sets[k] = arr;
  }
  return [out, newer];
}
/* ---- backup: the whole log and the settings as one file, to carry between gymi inside Claude and the phone app ---- */
function backupData() { return JSON.stringify({ app: 'gymi', v: 1, at: Date.now(), sessions: S.sessions, cfg: S.cfg }); }
const numOr = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
/* a workout read from a file is rebuilt field by field, so nothing but numbers and known keys gets in */
function cleanSession(v, id) {
  if (!v || typeof v !== 'object' || !PLAN[v.w] || !(numOr(v.ts, 0) > 0)) return null;
  const slots = PLAN[v.w].ex.map((pe) => pe.id).concat(Object.keys(S.cfg.slots).filter((k) => S.cfg.slots[k].w === v.w)), s = { id, v: numOr(v.v, 1), w: v.w, ts: v.ts, end: numOr(v.end, 0), mt: numOr(v.mt, 0), upd: numOr(v.upd, v.ts), ft: numOr(v.ft, 0), sets: {} };
  const each = (o, fn) => { const out = {}; if (o && typeof o === 'object') for (const k of Object.keys(o)) { const r = fn(k, o[k]); if (r !== undefined) out[k] = r; } return out; };
  for (const k of slots) {
    const rows = v.sets && v.sets[k]; if (!Array.isArray(rows)) continue;
    s.sets[k] = rows.slice(0, MAX_SETS).map((r) => {
      r = r || {};
      const o = { kg: numOr(r.kg, 0) > 0 ? r.kg : null, reps: numOr(r.reps, 0) > 0 ? Math.round(r.reps) : null, done: false, t: numOr(r.t, v.ts) };
      o.done = !!r.done && o.reps != null; if (r.pr && o.done) o.pr = true;
      if (typeof r.tk === 'number') o.tk = r.tk; if (typeof r.tr === 'number') o.tr = r.tr;
      return o;
    });
  }
  if (typeof v.m === 'string' && /^m\d{1,4}$/.test(v.m)) {
    s.m = v.m; s.wk = clamp(Math.round(numOr(v.wk, 1)), 1, 12); s.dl = v.dl ? 1 : 0; s.rir = typeof v.rir === 'number' ? clamp(Math.round(v.rir), 0, 4) : null;
    s.n = each(v.n, (k, x) => (slots.includes(k) && numOr(x, 0) >= 1 ? clamp(Math.round(x), 1, MAX_SETS) : undefined));
    if (Array.isArray(v.o)) { const o = v.o.filter((k, i) => typeof k === 'string' && slots.includes(k) && v.o.indexOf(k) === i).slice(0, 40); if (o.length) s.o = o; }
    s.mv = each(v.mv, (k, x) => (slots.includes(k) && typeof x === 'string' && LIB[x] ? x : undefined));
    s.sore = each(v.sore, (k, x) => (MUSCLE[k] && [0, 1, 2].includes(x) ? x : undefined));
    s.cut = each(v.cut, (k, x) => (slots.includes(k) && slots.includes(x) ? x : undefined));
    const lvl = (x) => ([0, 1, 2].includes(x) ? x : null);
    s.fb = each(v.fb, (k, x) => (slots.includes(k) && x && typeof x === 'object' ? { pain: lvl(x.pain), pump: lvl(x.pump), load: lvl(x.load) } : undefined));
  }
  return s;
}
function cleanCfg(v) {
  const mid = (x) => typeof x === 'string' && /^m\d{1,4}$/.test(x), o = normCfg(v), slot = (k) => !!SLOT[k] || !!o.slots[k], pick = (src, fn) => { const out = {}; for (const k of Object.keys(src)) { const r = fn(k, src[k]); if (r !== undefined) out[k] = r; } return out; };
  o.inc = pick(o.inc, (k, x) => (EQUIP[k] && numOr(+x, 0) > 0 ? +x : undefined));
  o.swap = pick(o.swap, (k, x) => (slot(k) && typeof x === 'string' && LIB[x] ? x : undefined));
  o.notes = pick(o.notes, (k, x) => (LIB[k] && typeof x === 'string' && x.trim() ? x.slice(0, 200) : undefined));
  o.base = pick(o.base, (k, x) => (slot(k) && x && numOr(x.n, 0) >= 1 ? { n: clamp(Math.round(x.n), 1, MAX_SETS), t: numOr(x.t, 0) } : undefined));
  o.order = pick(o.order, (k, x) => { const w = +k, own = (id) => SLOT[id] ? SLOT[id].w === w : !!o.slots[id] && o.slots[id].w === w; if (!PLAN[w] || !Array.isArray(x)) return undefined; const ids = x.filter((id, i) => typeof id === 'string' && own(id) && x.indexOf(id) === i).slice(0, 40); return ids.length ? ids : undefined; });
  if (!mid(o.meso.id)) o.meso = cfgDef().meso;
  o.past = o.past.filter((p) => p && mid(p.id)).map((p) => ({ id: p.id, n: numOr(p.n, 1), end: numOr(p.end, 0) }));
  return o;
}
/* take a backup in: each workout is merged with the copy already here (the newer one wins), the settings follow the newer file */
function restoreData(text) {
  let d; try { d = JSON.parse(text); } catch (e) { return null; }
  if (!d || d.app !== 'gymi' || !d.sessions || typeof d.sessions !== 'object') return null;
  let n = 0, cfg = false;
  /* exercises that were added on the other side come first, so that the workouts that use them can be read */
  const theirSlots = cleanSlots(d.cfg && d.cfg.slots), mySlots = S.cfg.slots;
  let added = false;
  for (const id of Object.keys(theirSlots)) if (!mySlots[id]) { mySlots[id] = theirSlots[id]; added = true; }
  for (const id of Object.keys(d.sessions).slice(0, 2000)) {
    if (!/^[\w-]{1,40}$/.test(id)) continue;
    const r = cleanSession(d.sessions[id], id); if (!r) continue;
    const before = sig(S.sessions[id]), m = mergeSession(S.sessions[id], r)[0];
    S.gone.delete(id); S.sessions[id] = m;
    if (sig(m) !== before) { n++; S.dirty.add(id); schedule(id, 400); }
  }
  /* the player's side: the character follows the newer settings like everything else, but one that was set up is never replaced by none.
     The archive that reaches further and every achievement are kept whichever side wins */
  const mine = S.cfg.me, theirs = d.cfg && typeof d.cfg === 'object' ? normMe(d.cfg.me) : null;
  if (d.cfg && typeof d.cfg === 'object' && (+d.cfg.upd || 0) > S.cfg.upd) { S.cfg = cleanCfg(d.cfg); S.cfg.slots = Object.assign({}, mySlots, S.cfg.slots); S.dirty.add('cfg'); schedule('cfg'); cfg = true; }
  else if (added) { S.cfg.upd = Date.now(); S.dirty.add('cfg'); schedule('cfg'); cfg = true; }
  if (theirs) {
    const me = S.cfg.me, before = JSON.stringify(me), made = me.made ? null : mine.made ? mine : theirs.made ? theirs : null;
    me.arch = theirs.arch.until > mine.arch.until ? theirs.arch : mine.arch; me.badges = Object.assign({}, theirs.badges, mine.badges);
    if (made) { me.name = made.name; me.look = made.look; me.made = made.made; }
    if (JSON.stringify(me) !== before) { S.cfg.upd = Date.now(); S.dirty.add('cfg'); schedule('cfg'); cfg = true; }
  }
  saveLocal();
  return { n, cfg };
}
async function initCloud(onChange) {
  /* the settings are known for sure once the account answered, or once it is clear there is no account to wait for */
  const known = () => { if (!S.cfgReady) { S.cfgReady = true; onChange(); } };
  if (!window.claude || typeof window.claude.use !== 'function') { setSync('local'); known(); return; }
  let slow = 0, first = true;
  try {
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    const uid = db && user ? await user.id() : null;
    if (!uid) { setSync('local'); known(); return; }
    const col = db.collection('data/users/' + uid), seen = new Set();
    slow = setTimeout(() => setSync('slow'), 10000);
    col.orderBy('ts', 'desc').limit(60).onSnapshot((snap) => {
      clearTimeout(slow); S.col = col;
      let changed = false;
      for (const ch of snap.docChanges()) {
        const id = ch.doc.id;
        if (ch.type === 'removed') { if (seen.has(id) && !S.dirty.has(id) && S.sessions[id]) { delete S.sessions[id]; changed = true; } continue; }
        const v = ch.doc.data();
        if (!v || typeof v.w !== 'number' || S.gone.has(id)) continue;
        seen.add(id);
        const before = sig(S.sessions[id]), r = { id, v: v.v || 1, w: v.w, ts: v.ts, end: v.end || 0, mt: v.mt || 0, upd: v.upd || v.ts, ft: v.ft || 0, sets: clone(v.sets || {}) };
        for (const k of XK) if (v[k] != null) r[k] = clone(v[k]);
        const [m, newer] = mergeSession(S.sessions[id], r);
        S.sessions[id] = m;
        if (sig(m) !== before) changed = true;
        if (newer) { S.dirty.add(id); schedule(id, 400); }
      }
      if (first) {
        first = false;
        for (const s of Object.values(S.sessions)) if (!seen.has(s.id) && hasDone(s)) S.dirty.add(s.id);
        for (const id of S.dirty) schedule(id, 200);
      }
      saveLocal(); setSync('cloud');
      if (changed) onChange();
    }, () => { clearTimeout(slow); setSync('local'); known(); });
    /* settings and the mesocycle live in one document: the copy that was changed last wins */
    col.doc('cfg').onSnapshot((d) => {
      const v = d && d.exists ? d.data() : null, up = v ? +v.upd || 0 : 0;
      if (up > S.cfg.upd) {
        const mine = S.cfg.me, slots = S.cfg.slots; S.cfg = normCfg(v); S.dirty.delete('cfg');
        /* an exercise added on this device is never dropped: workouts already point at it */
        const lost = Object.keys(slots).filter((id) => !S.cfg.slots[id]);
        if (lost.length) { for (const id of lost) S.cfg.slots[id] = slots[id]; S.cfg.upd = Math.max(Date.now(), up + 1); S.dirty.add('cfg'); schedule('cfg', 600); }
        /* a copy of the page from before the profile existed saves the settings without the player: keep ours and send it back */
        if (!v.me && (mine.made || mine.arch.until || Object.keys(mine.badges).length)) { S.cfg.me = mine; S.cfg.upd = Math.max(Date.now(), up + 1); S.dirty.add('cfg'); schedule('cfg', 600); }
        saveLocal(); onChange();
      }
      else if (up < S.cfg.upd) { S.dirty.add('cfg'); schedule('cfg', 600); }
      known();
    }, () => known());
  } catch (e) { clearTimeout(slow); setSync('local'); known(); }
}
window.addEventListener('online', () => { for (const id of S.dirty) schedule(id, 200); });
