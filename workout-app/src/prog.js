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
    const kg = o.inv ? roundTo(ref.kg * 1.15, inc, 1) : roundTo(ref.kg * 0.85, inc, -1);
    /* at the lightest step there is no lighter load: the deload comes from the reps, as without weight */
    if (!o.inv && !(kg > 0)) return { kg: ref.kg, reps: Math.max(1, Math.round(ref.reps * 0.6)), mode: 'deload' };
    return { kg, reps: clamp(ref.reps, Math.min(lo, ref.reps), hi), mode: 'deload' };
  }
  /* one step closer to failure than last time is worth one rep; the same distance still asks for one more; a new mesocycle starts further away and asks for fewer.
     One rep of the round is carried over it: else a round that climbs from the restart to the top of the range would start the same way again, and the load never goes up */
  const step = ref.rir == null ? 1 : ref.rir - o.rir;
  const raw = ref.reps + (step >= 0 ? Math.max(1, step) : step + 1) - (o.sore ? 1 : 0);
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
    /* a new round says so; in the middle of one it is a step down after a weak workout */
    const fresh = step < 0, md = fresh ? 'base' : 'down';
    if (o.inv) return { kg: roundTo(ref.kg + (lo - raw) * 2.5, inc, 1), reps: lo, mode: md };
    const e = e1rm(ref.kg, Math.max(1, raw)), down = roundTo(e / (1 + lo / 30), inc, -1);
    if (down <= 0 || down >= ref.kg) return { kg: ref.kg, reps: lo, mode: fresh ? 'base' : 'hold' };
    return { kg: down, reps: clamp(Math.floor((e / down - 1) * 30 + 1e-6), lo, hi), mode: md };
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
    /* already at the lightest step: no load is lighter, and a set with no weight would lose it for good */
    if (!o.inv && !(kg > 0)) return { kg: last.kg, reps: want, mode: 'hold' };
    return { kg, reps: want, mode: 'down' };
  }
  const beat = last.tk != null && last.tr != null && (o.inv ? last.kg <= last.tk : last.kg >= last.tk) && last.reps >= last.tr + Math.max(3, Math.round(last.tr * 0.25));
  if (load && !o.dl && beat) {
    let kg;
    if (o.inv) { kg = roundTo(Math.max(0, last.kg - (last.reps - want) * 2.5), inc, 1); if (kg >= last.kg) kg = roundTo(Math.max(0, last.kg - inc), inc, 0); }
    else {
      /* the set just done says how strong the lifter is today; the reps are those that strength gives at the load that can really be loaded */
      const e = last.kg * (1 + (last.reps + rir) / 30), at = (k) => Math.floor((e / k - 1) * 30 + 1e-6) - rir;
      kg = roundTo(e / (1 + (want + rir) / 30), inc, 0);
      if (kg <= last.kg) {
        /* the strength rounds back to the same load: one full step up, with the reps that step allows. Too big a step for the range: stay, and ask for the reps it was done with */
        kg = roundTo(last.kg + inc, inc, 0);
        if (at(kg) < lo) return { kg: last.kg, reps: clamp(last.reps, lo, hi), mode: 'hold' };
        return { kg, reps: clamp(at(kg), lo, hi), mode: 'cal' };
      }
    }
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

/* ---- changing the plan ---- */
/* what a movement gets when the lifter adds it by hand, by the kind of movement it is: sets, rep range, rest and how hard (lvl as in the plan) */
const RX = { big: { sets: 3, reps: '8–12', rest: [120, 120], lvl: 2 }, small: { sets: 2, reps: '10–15', rest: [75, 75], lvl: 3 }, calf: { sets: 3, reps: '12–20', rest: [60, 60], lvl: 3 }, core: { sets: 3, reps: '10–15', rest: [60, 60], lvl: 0 } };
const RX_KIND = { hpress: 'big', vpress: 'big', vpull: 'big', hpull: 'big', squat: 'big', lunge: 'big', hinge: 'big', thrust: 'big', raise: 'small', rearfly: 'small', ext: 'small', curl: 'small', kcurl: 'small', kext: 'small', calf: 'calf', flex: 'core', antirot: 'core' };
/* ---- the goals bend the written plan (goals: any of 0 physique, 1 strength, 2 fitness and health; exp: 0 for a beginner).
   Strength takes the heavy lifts that open a workout (a range that starts at eight or under, and two minutes of rest or
   more) lower, with longer rests; fitness and health takes every range a step higher, with shorter rests. Physique is the
   plan as written, and a goal that is chosen beside another bends half as far. A beginner is never sent under five reps.
   Returns the bent { reps, rest }, or null where the plan stands as it is written ---- */
const RX_LOW = [{ '6–10': '5–8', '8–10': '6–8', '8–12': '6–10' }, { '6–10': '4–6', '8–10': '5–8', '8–12': '6–8' }];
const RX_HIGH = { '6–10': '8–12', '8–10': '10–12', '8–12': '10–15', '10–15': '12–15', '12–15': '12–20' };
function goalRx(reps, rest, goals, exp) {
  const g = Array.isArray(goals) ? goals : [];
  if (!g.length || !Array.isArray(rest)) return null;
  const str = g.includes(1), fit = g.includes(2), many = g.length > 1, m = /^(\d+)–\d+$/.exec(String(reps));
  const heavy = !!m && +m[1] <= 8 && rest[0] >= 120, r15 = (v) => Math.round(v / 15) * 15;
  if (str && heavy) {
    const k = many || exp === 0 ? 0 : 1;
    return { reps: RX_LOW[k][reps] || reps, rest: [rest[0] + (k ? 30 : 0), Math.min(240, rest[1] + 30)] };
  }
  if (fit) {
    const k = many ? 0 : 1, cut = (v) => Math.max(45, k ? r15(v * 0.75) : v - 15);
    return { reps: (k && RX_HIGH[reps]) || reps, rest: [cut(rest[0]), cut(rest[1])] };
  }
  return null;
}
function rxOf(mv) { const r = RX[RX_KIND[LIB[mv].pat] || 'small']; return { sets: r.sets, reps: r.reps, rest: r.rest.slice(), lvl: r.lvl }; }
/* ---- where the numbers start for a movement that was never logged: a first guess at its weight, by its kind and its
   equipment, for a regular lifter, scaled by experience and rounded to what the equipment can be loaded with. It is only a
   place to start from: the lifter moves it to the weight that fits, and the first sets calibrate it. null for a movement
   done with the body's own weight. Where more weight means more help, a beginner starts with the most of it ---- */
const START_KG = {
  hpress: { smith: 40, machine: 40, plates: 40, bar: 40, db: 14, cable: 20 }, vpress: { smith: 30, machine: 30, bar: 30, db: 10 },
  vpull: { cable: 45, machine: 45 }, hpull: { cable: 40, machine: 40, plates: 40, bar: 40, db: 16 },
  raise: { db: 6, cable: 5, machine: 20 }, rearfly: { db: 5, cable: 5, machine: 25 }, ext: { cable: 20, db: 8, machine: 25 }, curl: { db: 8, cable: 15, machine: 20, bar: 20 },
  flex: { cable: 30, machine: 30 }, antirot: { cable: 10 },
  squat: { plates: 60, smith: 50, bar: 50, machine: 50, db: 14 }, lunge: { db: 10, smith: 30, bar: 30 }, hinge: { bar: 50, smith: 50, db: 14 }, thrust: { bar: 60, smith: 60, machine: 60 },
  kcurl: { machine: 30 }, kext: { machine: 40 }, calf: { machine: 50, plates: 40, smith: 50 },
};
const START_OWN = { legPress: 100, pressCalf: 80, singleLegExt: 20, assistedPullup: 30 };
const START_EXP = [0.6, 1, 1.4];
function startKg(mv, exp, inc) {
  const L = LIB[mv]; if (!L || L.bw || L.eq === 'bw') return null;
  const base = START_OWN[mv] != null ? START_OWN[mv] : (START_KG[L.pat] || {})[L.eq]; if (!(base > 0)) return null;
  const k = START_EXP[exp] == null ? 1 : START_EXP[exp], step = inc > 0 ? inc : EQUIP[L.eq].inc;
  return Math.max(step, roundTo(L.inv ? base / k : base * k, step, 0));
}
/* the − and + beside the weight do not step alike: + goes up fast (two of the equipment's steps, where a step is under 5 kg),
   − comes down one step at a time. So any weight is a few taps away: up past it, then down onto it */
const stepUp = (inc) => (inc < 5 ? inc * 2 : inc);
/* ---- how long a list of exercises really takes: each set (setting up, then the reps), the rest after every set but the last of
   an exercise, the move to the next one, and a warm-up. To the nearest five minutes ---- */
function workMins(list) {
  const sec = list.reduce((n, e) => {
    if (!e.sets) return n;
    const r = String(e.reps || '').match(/\d+/g) || [10], reps = (+r[0] + +(r[1] || r[0])) / 2, rest = (e.rest[0] + e.rest[1]) / 2;
    return n + e.sets * (15 + reps * 3.5) + (e.sets - 1) * rest + 90;
  }, 300);
  return Math.max(10, Math.round(sec / 300) * 5);
}
/* the movements that can stand in for one: the same pattern and the same main muscle, joint-friendly ones first */
const sameKind = (mv) => { const L = LIB[mv]; return Object.keys(LIB).filter((k) => k !== mv && LIB[k].pat === L.pat && LIB[k].p === L.p).sort((a, b) => (LIB[b].jf ? 1 : 0) - (LIB[a].jf ? 1 : 0)); };
/* ---- the plan fitted to its lifter, as data. ans: { exp (0 for a beginner), goals, time (minutes a workout may take, 0 or null
   for any), ok (the equipment the gym has, null for all of it) }. For each workout, the slots it keeps, in order:
   { id, mv, kind, full, sets, reps, rest, r, t }
   - a movement the gym has no equipment for gives its slot to one of the same kind that the gym has (kind 'swap': the slot and
     its numbers stay), or to another for the same muscle, with the numbers that suit that one ('repl'), or leaves the workout;
   - full is the number of sets as written, sets what this lifter does: a beginner does one less where there were three or more;
   - reps and rest are as written, r and t as the goals bend them;
   - while a workout runs longer than the time and keeps more than four exercises, its last one leaves ---- */
const FIT_MIN = 4;
function fitPlanData(ans) {
  const ok = ans.ok || null, mins = (list) => workMins(list.map((x) => ({ sets: x.sets, reps: x.r, rest: x.t })));
  return PLAN.map((wk) => {
    const used = wk.ex.map((e) => e.a); let list = [];
    wk.ex.forEach((e, i) => {
      let mv = e.a, full = e.sets, reps = e.reps, rest = e.rest, kind = '';
      if (ok && !ok.includes(LIB[mv].eq)) {
        const fits = (k) => ok.includes(LIB[k].eq) && !used.includes(k), same = sameKind(mv).find(fits), near = same ? null : Object.keys(LIB).find((k) => LIB[k].p === LIB[mv].p && fits(k));
        if (same) { kind = 'swap'; mv = same; }
        else if (near) { const rx = rxOf(near); kind = 'repl'; mv = near; full = rx.sets; reps = rx.reps; rest = rx.rest; }
        else { used[i] = null; return; }
        used[i] = mv;
      }
      const g = goalRx(reps, rest, ans.goals, ans.exp) || { reps, rest };
      list.push({ id: e.id, mv, kind, full, sets: ans.exp === 0 && full >= 3 ? full - 1 : full, reps, rest, r: g.reps, t: g.rest });
    });
    if (ans.time) while (list.length > FIT_MIN && mins(list) > ans.time) list = list.slice(0, -1);
    return list;
  });
}
/* the slots of a workout in order: the saved order with unknown and repeated ids dropped, else the plan's own */
function orderOf(dflt, saved, known) {
  if (!Array.isArray(saved)) return dflt;
  const out = saved.filter((id, i) => typeof id === 'string' && known(id) && saved.indexOf(id) === i);
  return out.length ? out : dflt;
}
/* a slot the lifter added, read from a file or from the account: rebuilt field by field, null when it makes no sense */
function cleanSlot(v) {
  if (!v || typeof v !== 'object' || !PLAN[v.w] || !isMv(v.a) || typeof v.reps !== 'string' || !/^\d{1,2}(–\d{1,2})?$/.test(v.reps) || !Array.isArray(v.rest)) return null;
  const rr = repRange(v); if (!(rr[0] >= 1) || rr[1] < rr[0]) return null;
  const sec = (x) => clamp(Math.round(+x) || 60, 15, 600);
  return { w: v.w, a: v.a, sets: clamp(Math.round(+v.sets) || 1, 1, 8), reps: v.reps, rest: [sec(v.rest[0]), sec(v.rest[1])] };
}
