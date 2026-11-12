/* ================================================================== helpers + data layer */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const Ltr = (s) => '<bdi dir="ltr">' + s + '</bdi>';
const reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const HOUR = 3600e3, LS_KEY = 'ul4:v1', STALE = 3 * HOUR;
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
};
/* S.sessions: id -> { id, v, w (workout 0-3), ts (start), end, upd, sets: { exerciseId: [ { kg, reps, done, t, pr } ] } } */
const S = { tab: 0, open: null, sessions: {}, sound: true, col: null, dirty: new Set(), gone: new Set(), touched: false, draft: null, edit: null, mini: false, resetAsk: false, banner: '' };

function loadLocal() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; } }
function saveLocal() {
  try {
    const keep = Object.values(S.sessions).sort((a, b) => b.ts - a.ts).slice(0, 80);
    localStorage.setItem(LS_KEY, JSON.stringify({ sessions: Object.fromEntries(keep.map((s) => [s.id, s])), sound: S.sound, dirty: Array.from(S.dirty), gone: Array.from(S.gone) }));
  } catch (e) { /* storage unavailable: keep working in memory */ }
}
const rowsOf = (s, exId) => (s && s.sets && s.sets[exId]) || [];
const isDone = (r) => !!(r && r.done);
const hasDone = (s) => Object.values(s.sets || {}).some((a) => (a || []).some(isDone));
const sorted = () => Object.values(S.sessions).sort((a, b) => b.ts - a.ts);
const live = (w) => sorted().find((x) => x.w === w && !x.end) || null;
function ensure(w) {
  let s = live(w);
  if (!s) { s = { id: 's' + Date.now().toString(36) + 'w' + w, v: 2, w, ts: Date.now(), end: 0, upd: Date.now(), sets: {} }; S.sessions[s.id] = s; }
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
    if (hasDone(s)) { s.end = lastT(s); touch(s, true); } else { delete S.sessions[s.id]; S.gone.add(s.id); S.dirty.add(s.id); schedule(s.id); }
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
const doneCount = (s, e) => rowsOf(s, e.id).slice(0, e.sets).filter(isDone).length;
const firstUndone = (s, e) => { const r = rowsOf(s, e.id); for (let i = 0; i < e.sets; i++) if (!isDone(r[i])) return i; return -1; };
const findEx = (id) => { for (const w of PLAN) for (const e of w.ex) if (e.id === id) return e; return null; };
const wkOf = (id) => PLAN.findIndex((w) => w.ex.some((e) => e.id === id));
const prevFor = (w, exId, notId) => sorted().find((x) => x.w === w && x.id !== notId && rowsOf(x, exId).some(isDone)) || null;
const e1rm = (kg, reps) => kg * (1 + reps / 30);
function repRange(e) { const p = String(e.reps).split('–').map((x) => parseInt(x, 10)); return [p[0], p[p.length - 1]]; }
/* best estimated strength logged for a movement (any workout slot); can leave out or isolate one session */
function bestFor(a, o) {
  let best = null; o = o || {};
  for (const s of Object.values(S.sessions)) for (const w of PLAN) for (const e of w.ex) {
    if (e.a !== a || (o.notS && s.id === o.notS) || (o.onlyS && s.id !== o.onlyS)) continue;
    rowsOf(s, e.id).forEach((r, i) => {
      if (!isDone(r) || r.kg == null || !(r.kg > 0) || r.reps == null || (o.skipEx === e.id && o.skipI === i)) return;
      const v = e1rm(r.kg, r.reps); if (!best || v > best.v) best = { v, kg: r.kg, reps: r.reps };
    });
  }
  return best;
}
/* weight to offer for a set: earlier set today, then the same set last time, then the same movement elsewhere */
function defaultKg(e, i, s) {
  const cur = rowsOf(s, e.id);
  for (let k = i - 1; k >= 0; k--) if (isDone(cur[k]) && cur[k].kg != null) return cur[k].kg;
  const p = prevFor(wkOf(e.id), e.id, s && s.id);
  if (p) { const r = rowsOf(p, e.id); if (isDone(r[i]) && r[i].kg != null) return r[i].kg; const any = r.filter((x) => isDone(x) && x.kg != null); if (any.length) return any[any.length - 1].kg; }
  for (const x of sorted()) for (const w of PLAN) for (const o of w.ex) { if (o.a !== e.a || o.id === e.id) continue; const any = rowsOf(x, o.id).filter((q) => isDone(q) && q.kg != null); if (any.length) return any[any.length - 1].kg; }
  return null;
}
function defaultReps(e, i, s) { const p = prevFor(wkOf(e.id), e.id, s && s.id), r = p && rowsOf(p, e.id)[i]; return isDone(r) && r.reps != null ? r.reps : null; }
function restText(e) { const a = e.rest[0], b = e.rest[1]; if (a >= 120 && a % 60 === 0 && b % 60 === 0) return Ltr(a === b ? a / 60 : a / 60 + '–' + b / 60) + ' דק׳'; return Ltr(a === b ? a : a + '–' + b) + ' שנ׳'; }
const restPlain = (e) => restText(e).replace(/<[^>]+>/g, '');
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
  const t = { cloud: 'נשמר בחשבון Claude שלך', local: 'נשמר במכשיר הזה בלבד', slow: 'אין חיבור לענן כרגע, נשמר במכשיר', error: 'השמירה בענן נכשלה, נשמר במכשיר' }[state];
  if (t) $('#syncNote').textContent = t;
}
function touch(s, quiet) { s.upd = Date.now(); S.dirty.add(s.id); if (!quiet) saveLocal(); schedule(s.id); }
function schedule(id, ms) { const w = W(id); clearTimeout(w.timer); w.timer = setTimeout(() => flush(id), ms == null ? 800 : ms); }
const docOf = (s) => JSON.parse(JSON.stringify({ v: 2, w: s.w, ts: s.ts, end: s.end || 0, upd: s.upd || s.ts, sets: s.sets || {} }));
async function flush(id) {
  const w = W(id);
  if (!S.col || !S.dirty.has(id)) return;
  if (w.busy) { w.again = true; return; }
  w.busy = true;
  const s = S.sessions[id];
  try {
    if (s) await S.col.doc(id).set(docOf(s)); else await S.col.doc(id).delete();
    if (!w.again) { S.dirty.delete(id); if (!s) S.gone.delete(id); }
    w.fail = 0; saveLocal(); setSync('cloud');
  } catch (e) {
    w.fail++; setSync('error');
    if (w.fail < 4) schedule(id, 2500 * w.fail + Math.random() * 900);
  } finally { w.busy = false; if (w.again) { w.again = false; schedule(id, 300); } }
}
const sig = (s) => !s ? '' : (s.end || 0) + '|' + Object.keys(s.sets || {}).sort().map((k) => k + ':' + (s.sets[k] || []).map((r) => (r ? [r.kg, r.reps, r.done ? 1 : 0, r.t || 0].join(',') : '-')).join(';')).join('|');
/* merge set by set: the row with the later timestamp wins, so two devices never wipe each other */
function mergeSession(a, b) {
  if (!a) return [b, false];
  let newer = (a.end || 0) > (b.end || 0);
  const out = { id: a.id, v: 2, w: a.w, ts: Math.min(a.ts, b.ts || a.ts), end: Math.max(a.end || 0, b.end || 0), upd: Math.max(a.upd || 0, b.upd || 0), sets: {} };
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
async function initCloud(onChange) {
  if (!window.claude || typeof window.claude.use !== 'function') { setSync('local'); return; }
  let slow = 0, first = true;
  try {
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    const uid = db && user ? await user.id() : null;
    if (!uid) { setSync('local'); return; }
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
        const before = sig(S.sessions[id]);
        const [m, newer] = mergeSession(S.sessions[id], { id, v: v.v || 1, w: v.w, ts: v.ts, end: v.end || 0, upd: v.upd || v.ts, sets: JSON.parse(JSON.stringify(v.sets || {})) });
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
    }, () => { clearTimeout(slow); setSync('local'); });
  } catch (e) { clearTimeout(slow); setSync('local'); }
}
window.addEventListener('online', () => { for (const id of S.dirty) schedule(id, 200); });
