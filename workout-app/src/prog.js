/* ================================================================== progression engine (pure functions, no page state) */
const e1rm = (kg, reps) => kg * (1 + reps / 30);
function repRange(e) { const p = String(e.reps).split('–').map((x) => parseInt(x, 10)); return [p[0], p[p.length - 1]]; }
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
/* round a weight to what the equipment can really be loaded with; dir -1 rounds down, 1 up, 0 to the nearest step */
function roundTo(kg, inc, dir) {
  const q = kg / inc, n = dir < 0 ? Math.floor(q + 1e-9) : dir > 0 ? Math.ceil(q - 1e-9) : Math.round(q);
  return Math.max(0, Math.round(n * inc * 100) / 100);
}
/* reps in reserve asked for in a given week: the last hard week goes to failure, each week before it leaves one more rep (three at most); the final week is a deload */
function rirFor(wk, weeks) { return wk >= weeks ? 4 : Math.min(3, Math.max(0, weeks - 1 - wk)); }
/* one number for how strong a set was. Loaded lifts: estimated one-rep max. Assisted lifts: less help is better, a rep is worth about 2.5 kg. Bodyweight: reps */
function score(L, kg, reps) {
  if (L && L.inv) return 200 + (reps || 0) * 2.5 - (kg || 0);
  return kg != null && kg > 0 ? e1rm(kg, reps || 0) : reps || 0;
}

/* The target for one set, from the same set the last time this movement was trained.
   ref: { kg, reps, rir } where rir is the reps in reserve that workout asked for (null when unknown).
   o: { lo, hi, inc, rir, sore, dl, inv }. Returns { kg, reps, mode } with mode:
   reps = same weight, more reps · weight = top of the range was reached, the load goes up · hold = repeat it
   base = start of a mesocycle, further from failure · deload */
function nextTarget(ref, o) {
  if (!ref || ref.reps == null) return null;
  const lo = o.lo, hi = o.hi, inc = o.inc || 2.5, load = ref.kg != null && ref.kg > 0;
  if (o.dl) {
    if (!load) return { kg: ref.kg == null ? null : ref.kg, reps: Math.max(1, Math.round(ref.reps * 0.6)), mode: 'deload' };
    return { kg: o.inv ? roundTo(ref.kg * 1.15, inc, 1) : roundTo(ref.kg * 0.85, inc, -1), reps: clamp(ref.reps, Math.min(lo, ref.reps), hi), mode: 'deload' };
  }
  /* one step closer to failure than last time is worth one rep; the same distance still asks for one more; a new mesocycle starts further away and asks for fewer */
  const step = ref.rir == null ? 1 : ref.rir - o.rir;
  const raw = ref.reps + (step >= 0 ? Math.max(1, step) : step) - (o.sore ? 1 : 0);
  const modeOf = (r) => (r > ref.reps ? 'reps' : r === ref.reps ? 'hold' : 'base');
  if (!load) return { kg: ref.kg == null ? null : ref.kg, reps: Math.max(1, raw), mode: modeOf(raw) };
  if (raw > hi) {
    const up = o.inv ? roundTo(Math.max(0, ref.kg - inc), inc, 0) : roundTo(ref.kg + inc, inc, 0);
    const pred = o.inv ? Math.floor(raw - inc / 2.5) : Math.floor((e1rm(ref.kg, raw) / up - 1) * 30 + 1e-6);
    if (up !== ref.kg && pred >= lo) return { kg: up, reps: Math.min(pred, hi), mode: 'weight' };
    return { kg: ref.kg, reps: raw, mode: 'reps' };   /* the next jump is too big for this lift: keep adding reps first */
  }
  if (raw < lo) {
    /* too few reps to stay in the range at this load: bring the load down so the set lands inside it */
    if (o.inv) return { kg: roundTo(ref.kg + (lo - raw) * 2.5, inc, 1), reps: lo, mode: 'base' };
    const e = e1rm(ref.kg, Math.max(1, raw)), down = roundTo(e / (1 + lo / 30), inc, -1);
    if (down <= 0 || down >= ref.kg) return { kg: ref.kg, reps: lo, mode: 'base' };
    return { kg: down, reps: clamp(Math.floor((e / down - 1) * 30 + 1e-6), lo, hi), mode: 'base' };
  }
  return { kg: ref.kg, reps: raw, mode: modeOf(raw) };
}

/* Re-aim a later set after seeing the previous set done today.
   T: the planned target for this set (or null). last: { kg, reps, tk, tr } with the target that set had.
   down = the previous set fell under the rep range, so the load drops 10% · cal = far more reps than predicted, so the load is recalculated */
function adjustTarget(T, last, o) {
  if (!last || last.reps == null) return T;
  const lo = o.lo, hi = o.hi, inc = o.inc || 2.5, rir = o.rir || 0, load = last.kg != null && last.kg > 0;
  const want = clamp(T ? T.reps : last.tr != null ? last.tr : last.reps, lo, hi);
  if (load && !o.dl && last.reps < lo) {
    const kg = o.inv ? Math.max(roundTo(last.kg * 1.1, inc, 1), roundTo(last.kg + inc, inc, 0)) : Math.min(roundTo(last.kg * 0.9, inc, -1), roundTo(Math.max(0, last.kg - inc), inc, 0));
    return { kg, reps: want, mode: 'down' };
  }
  const beat = last.tk != null && last.tr != null && (o.inv ? last.kg <= last.tk : last.kg >= last.tk) && last.reps >= last.tr + Math.max(3, Math.round(last.tr * 0.25));
  if (load && !o.dl && beat) {
    let kg;
    if (o.inv) { kg = roundTo(Math.max(0, last.kg - (last.reps - want) * 2.5), inc, 1); if (kg >= last.kg) kg = roundTo(Math.max(0, last.kg - inc), inc, 0); }
    else { kg = roundTo((last.kg * (1 + (last.reps + rir) / 30)) / (1 + (want + rir) / 30), inc, 0); if (kg <= last.kg) kg = roundTo(last.kg + inc, inc, 0); }
    return { kg, reps: want, mode: 'cal' };
  }
  if (!T) return { kg: last.kg == null ? null : last.kg, reps: clamp(last.reps, lo, Math.max(hi, lo)), mode: 'hold' };
  if (last.kg != null && T.kg != null && last.kg !== T.kg) return { kg: last.kg, reps: clamp(last.reps, lo, hi), mode: T.mode === 'deload' ? 'deload' : 'hold' };
  return T;
}

/* weekly sets per muscle from a list of { mv, sets }: a full set for the primary muscle, half a set for each helper */
function muscleVolume(items) {
  const out = {};
  for (const k of Object.keys(MUSCLE)) out[k] = { d: 0, i: 0 };
  for (const it of items) {
    const L = LIB[it.mv]; if (!L || !(it.sets > 0)) continue;
    out[L.p].d += it.sets;
    for (const m of L.s || []) out[m].i += it.sets * 0.5;
  }
  return out;
}
const landmark = (k, total) => (total > MUSCLE[k].mrv ? 'over' : total < MUSCLE[k].mev ? 'under' : 'ok');
