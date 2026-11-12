// Unit checks for the pure progression engine (plan.js + lib.js + prog.js): node test/unit.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = process.argv[2] || path.join(__dirname, '..', 'src');
const code = ['plan.js', 'lib.js', 'prog.js'].map((f) => fs.readFileSync(path.join(src, f), 'utf8')).join('\n') +
  '\n;globalThis.X = { PLAN, LIB, MUSCLE, PATTERN, EQUIP, EN, e1rm, repRange, roundTo, rirFor, score, nextTarget, adjustTarget, muscleVolume, landmark };';
vm.runInThisContext(code);
const { PLAN, LIB, MUSCLE, PATTERN, EQUIP, EN, roundTo, rirFor, score, nextTarget, adjustTarget, muscleVolume, landmark } = globalThis.X;
let pass = 0; const bad = [];
const eq = (name, got, want) => { if (JSON.stringify(got) === JSON.stringify(want)) pass++; else bad.push(name + ': got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want)); };
const O = (x) => Object.assign({ lo: 6, hi: 10, inc: 2.5, rir: 2, sore: 0, dl: false, inv: false }, x);

// RIR ramp: 3, 2, 1, 0, then a deload at 4
eq('rir 5 weeks', [1, 2, 3, 4, 5].map((w) => rirFor(w, 5)), [3, 2, 1, 0, 4]);
eq('rir 4 weeks', [1, 2, 3, 4].map((w) => rirFor(w, 4)), [2, 1, 0, 4]);
eq('rir 7 weeks', [1, 2, 3, 4, 5, 6, 7].map((w) => rirFor(w, 7)), [3, 3, 3, 2, 1, 0, 4]);
eq('rir past the end is still a deload', rirFor(9, 5), 4);

// rounding to real increments
eq('round nearest', roundTo(67.1, 2.5, 0), 67.5);
eq('round down', roundTo(54, 2.5, -1), 52.5);
eq('round up', roundTo(46, 5, 1), 50);
eq('round dumbbell', roundTo(11.4, 1, 0), 11);

// beat reps: same weight, one more rep
eq('beat reps', nextTarget({ kg: 60, reps: 8, rir: 3 }, O()), { kg: 60, reps: 9, mode: 'reps' });
eq('beat reps, unknown old rir', nextTarget({ kg: 60, reps: 8, rir: null }, O()), { kg: 60, reps: 9, mode: 'reps' });
eq('same rir still asks one more', nextTarget({ kg: 60, reps: 8, rir: 2 }, O()), { kg: 60, reps: 9, mode: 'reps' });
// beat weight: top of the range last time
eq('beat weight', nextTarget({ kg: 60, reps: 10, rir: 3 }, O()), { kg: 62.5, reps: 9, mode: 'weight' });
eq('beat weight on dumbbells', nextTarget({ kg: 10, reps: 15, rir: 3 }, O({ lo: 10, hi: 15, inc: 1 })), { kg: 11, reps: 11, mode: 'weight' });
// a jump too big for the lift: keep adding reps
eq('jump too big keeps reps', nextTarget({ kg: 20, reps: 15, rir: 3 }, O({ lo: 10, hi: 15, inc: 5 })), { kg: 20, reps: 16, mode: 'reps' });
// still sore: hold instead of progressing
eq('sore holds', nextTarget({ kg: 60, reps: 8, rir: 3 }, O({ sore: 1 })), { kg: 60, reps: 8, mode: 'hold' });
// new mesocycle: 0 RIR last time, 3 RIR now
eq('new meso, inside the range', nextTarget({ kg: 62.5, reps: 9, rir: 0 }, O({ rir: 3 })), { kg: 62.5, reps: 6, mode: 'base' });
const nm = nextTarget({ kg: 60, reps: 9, rir: 0 }, O({ rir: 3, lo: 8, hi: 12 }));
eq('new meso, under the range lowers the load', [nm.kg < 60, nm.reps >= 8 && nm.reps <= 12, nm.mode], [true, true, 'base']);
// deload: 15% lighter, same reps
eq('deload', nextTarget({ kg: 60, reps: 9, rir: 0 }, O({ dl: true, rir: 4 })), { kg: 50, reps: 9, mode: 'deload' });
eq('deload bodyweight', nextTarget({ kg: null, reps: 12, rir: 0 }, O({ dl: true, rir: 4, lo: 8, hi: 15 })), { kg: null, reps: 7, mode: 'deload' });
// bodyweight: reps only
eq('bodyweight reps', nextTarget({ kg: null, reps: 12, rir: 3 }, O({ lo: 8, hi: 15 })), { kg: null, reps: 13, mode: 'reps' });
// assisted pull-ups: progress means less help
eq('assisted: beat reps', nextTarget({ kg: 40, reps: 8, rir: 3 }, O({ inv: true, inc: 5 })), { kg: 40, reps: 9, mode: 'reps' });
eq('assisted: less help', nextTarget({ kg: 40, reps: 10, rir: 3 }, O({ inv: true, inc: 5 })), { kg: 35, reps: 9, mode: 'weight' });
eq('no reference', nextTarget(null, O()), null);

// down-set: under the range on the previous set, 10% off
eq('down-set', adjustTarget({ kg: 60, reps: 8, mode: 'reps' }, { kg: 60, reps: 4, tk: 60, tr: 9 }, O()), { kg: 52.5, reps: 8, mode: 'down' });
eq('down-set always drops at least a step', adjustTarget({ kg: 10, reps: 12, mode: 'reps' }, { kg: 10, reps: 7, tk: 10, tr: 12 }, O({ lo: 10, hi: 15, inc: 5 })), { kg: 5, reps: 12, mode: 'down' });
eq('assisted down-set adds help', adjustTarget({ kg: 40, reps: 8, mode: 'reps' }, { kg: 40, reps: 3, tk: 40, tr: 9 }, O({ inv: true, inc: 5 })), { kg: 45, reps: 8, mode: 'down' });
// calibration: 15 reps where 10 were predicted at 2 RIR
eq('calibration', adjustTarget({ kg: 60, reps: 10, mode: 'reps' }, { kg: 60, reps: 15, tk: 60, tr: 10 }, O({ lo: 8, hi: 12 })), { kg: 67.5, reps: 10, mode: 'cal' });
eq('two extra reps is not a recalibration', adjustTarget({ kg: 60, reps: 10, mode: 'reps' }, { kg: 60, reps: 12, tk: 60, tr: 10 }, O({ lo: 8, hi: 12 })), { kg: 60, reps: 10, mode: 'reps' });
// the lifter chose another weight today: follow it
eq('follows the weight used today', adjustTarget({ kg: 60, reps: 9, mode: 'reps' }, { kg: 55, reps: 10, tk: 60, tr: 9 }, O()), { kg: 55, reps: 10, mode: 'hold' });
eq('after a calibrated set the new weight sticks', adjustTarget({ kg: 60, reps: 9, mode: 'reps' }, { kg: 67.5, reps: 10, tk: 67.5, tr: 10 }, O({ lo: 8, hi: 12 })), { kg: 67.5, reps: 10, mode: 'hold' });
eq('no history: repeat the first set', adjustTarget(null, { kg: 30, reps: 11 }, O({ lo: 8, hi: 12 })), { kg: 30, reps: 11, mode: 'hold' });
eq('normal: keep the plan', adjustTarget({ kg: 60, reps: 8, mode: 'reps' }, { kg: 60, reps: 9, tk: 60, tr: 9 }, O()), { kg: 60, reps: 8, mode: 'reps' });

// scores
eq('score loaded', Math.round(score(LIB.inclineSmith, 60, 10)), 80);
eq('score assisted: less help wins', score(LIB.assistedPullup, 35, 8) > score(LIB.assistedPullup, 40, 8), true);
eq('score bodyweight', score(LIB.kneeRaise, null, 12), 12);

// fractional volume: bench = 1 chest + 0.5 front delts + 0.5 triceps
const v1 = muscleVolume([{ mv: 'inclineSmith', sets: 3 }]);
eq('fractional volume', [v1.chest, v1.fdelt, v1.triceps, v1.back], [{ d: 3, i: 0 }, { d: 0, i: 1.5 }, { d: 0, i: 1.5 }, { d: 0, i: 0 }]);
const all = muscleVolume(PLAN.flatMap((w) => w.ex.map((e) => ({ mv: e.a, sets: e.sets }))));
const tot = Object.fromEntries(Object.keys(all).map((k) => [k, all[k].d + all[k].i]));
eq('plan volume', tot, { chest: 8, back: 13, delts: 12, fdelt: 6, biceps: 10, triceps: 9, quads: 13, hams: 10.5, glutes: 10, calves: 6, abs: 11 });
eq('landmarks', [landmark('calves', 6), landmark('chest', 8), landmark('chest', 23)], ['under', 'ok', 'over']);

// library integrity: every movement is complete, every swap option has a demo, every plan slot has a partner in its pattern
const libBad = Object.keys(LIB).filter((k) => { const L = LIB[k]; return !MUSCLE[L.p] || !PATTERN[L.pat] || !EQUIP[L.eq] || !Array.isArray(L.s) || L.s.some((m) => !MUSCLE[m]) || L.c.length !== 3 || !EN[k] || (L.an && (!LIB[L.an] || LIB[L.an].an)); });
eq('library entries complete', libBad, []);
const lonely = PLAN.flatMap((w) => w.ex).filter((e) => !Object.keys(LIB).some((k) => k !== e.a && LIB[k].pat === LIB[e.a].pat && LIB[k].p === LIB[e.a].p)).map((e) => e.id);
eq('every slot has a swap in the same pattern and muscle', lonely, []);

console.log('UNIT PASS ' + pass + ' FAIL ' + bad.length + (bad.length ? '\n  ' + bad.join('\n  ') : ''));
process.exit(bad.length ? 1 : 0);
