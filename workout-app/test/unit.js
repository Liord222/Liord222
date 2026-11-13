// Unit checks for the pure parts: the progression engine (plan.js + lib.js + prog.js) and the game layer (game.js): node test/unit.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = process.argv[2] || path.join(__dirname, '..', 'src');
const GAME = ['rxOf', 'orderOf', 'cleanSlot', 'XP', 'RANKS', 'REWARDS', 'BADGES', 'ORD', 'wkOrd', 'wkFull', 'tally', 'xpStep', 'levelOf', 'rankOf', 'nextReward', 'rewardsBetween', 'buildOf', 'weekIdx', 'archZero', 'totalsOf', 'archiveStep', 'streakOf', 'fullWeek', 'roundsDone', 'earned'];
const code = ['plan.js', 'lib.js', 'prog.js', 'game.js'].map((f) => { try { return fs.readFileSync(path.join(src, f), 'utf8'); } catch (e) { return ''; } }).join('\n') +
  '\n;globalThis.X = { PLAN, LIB, MUSCLE, PATTERN, EQUIP, EN, e1rm, repRange, roundTo, rirFor, score, nextTarget, adjustTarget, muscleVolume, landmark };' +
  '\n;globalThis.G = {' + GAME.map((k) => k + ': typeof ' + k + " === 'undefined' ? undefined : " + k).join(', ') + '};';
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


// ================================================================== the game layer: points, levels, the profile totals
const G = globalThis.G;
/* a check that fails (instead of crashing the run) while the function it needs does not exist yet */
const t = (name, fn, want) => { let got; try { got = fn(); } catch (e) { bad.push(name + ': ' + e.message); return; } eq(name, got, want); };
const ses = (o) => Object.assign({ id: 's1', w: 0, ts: 1000, end: 2000, sets: {} }, o);
const three = { ua1: [{ kg: 60, reps: 8, done: true }, { kg: 60, reps: 7, done: true, pr: true }, { kg: null, reps: null, done: false }], ua2: [{ kg: null, reps: 12, done: true }] };

// workout names in Hebrew, the way the owner asked for them
t('workout titles', () => PLAN.map((w) => w.t), ['גוף עליון A', 'גוף תחתון A', 'גוף עליון B', 'גוף תחתון B']);
t('workout ordinals', () => [0, 1, 2, 3].map((w) => G.wkOrd(w)), ['אימון ראשון', 'אימון שני', 'אימון שלישי', 'אימון רביעי']);
t('full workout name', () => G.wkFull(1), 'אימון שני – גוף תחתון A');

// points: 10 a set, 30 more for a personal best, 100 for finishing
t('points of a finished workout', () => G.tally(ses({ sets: three })), { sets: 3, prs: 1, kg: 900, xp: 160 });
t('a workout still running has no finish bonus', () => G.tally(ses({ end: 0, sets: three })).xp, 60);
t('a workout with no sets is worth nothing', () => G.tally(ses({ sets: { ua1: [{ kg: null, reps: null, done: false }] } })), { sets: 0, prs: 0, kg: 0, xp: 0 });

// levels: each one asks for 40 points more than the one before
t('level step', () => [1, 2, 3, 10].map((l) => G.xpStep(l)), [200, 240, 280, 560]);
t('level 1 at zero', () => G.levelOf(0), { lvl: 1, into: 0, need: 200 });
t('one point short of level 2', () => G.levelOf(199), { lvl: 1, into: 199, need: 200 });
t('level 2 exactly', () => G.levelOf(200), { lvl: 2, into: 0, need: 240 });
t('level 5 exactly', () => G.levelOf(1040), { lvl: 5, into: 0, need: 360 });
t('inside level 5', () => G.levelOf(1240), { lvl: 5, into: 200, need: 360 });
t('bad input is level 1', () => [G.levelOf(-5).lvl, G.levelOf(NaN).lvl, G.levelOf(undefined).lvl], [1, 1, 1]);
// the first week: every one of the four workouts lifts the level
t('each of the first four workouts raises the level', () => { let xp = 0; return PLAN.map((w) => { xp += w.ex.reduce((n, e) => n + e.sets, 0) * G.XP.set + G.XP.done; return G.levelOf(xp).lvl; }); }, [2, 3, 4, 5]);

// ranks and rewards
t('ranks', () => [1, 4, 5, 10, 19, 20, 30, 99].map((l) => G.rankOf(l).he), ['טירון', 'טירון', 'מתמיד', 'ספורטאי', 'מכונה', 'חיה', 'אלוף', 'אגדה']);
t('rank index', () => [G.rankOf(1).i, G.rankOf(40).i], [0, 6]);
t('next reward', () => [G.nextReward(1).at, G.nextReward(3).at, G.nextReward(39).at, G.nextReward(40)], [3, 5, 40, null]);
t('rewards opened by a level-up', () => [G.rewardsBetween(2, 5).map((r) => r.at), G.rewardsBetween(5, 5).length, G.rewardsBetween(1, 2).length], [[3, 5], 0, 0]);
t('the body grows with the level', () => [G.buildOf(1), G.buildOf(30), G.buildOf(200), G.buildOf(16) > G.buildOf(8)], [0, 1, 1, true]);

// totals: the archive plus every workout newer than it
const zero = () => G.archZero();
t('totals of two workouts', () => G.totalsOf([ses({ sets: three }), ses({ id: 's2', ts: 3000, end: 0, sets: three })], zero()), { xp: 220, wk: 1, sets: 6, prs: 2, kg: 1800 });
t('archived workouts are not counted twice', () => G.totalsOf([ses({ sets: three }), ses({ id: 's2', ts: 3000, end: 4000, sets: three })], Object.assign(zero(), { until: 1500, xp: 5000, wk: 20, sets: 400, prs: 30, kg: 90000 })), { xp: 5160, wk: 21, sets: 403, prs: 31, kg: 90900 });
const many = (n) => Array.from({ length: n }, (_, i) => ses({ id: 's' + (i + 1), ts: (i + 1) * 864e5 * 2, end: (i + 1) * 864e5 * 2 + 1, sets: { ua1: [{ kg: 50, reps: 10, done: true }] } }));
t('nothing to archive while the log is short', () => G.archiveStep(many(40), zero(), 40), null);
t('the oldest workouts move into the archive', () => { const a = G.archiveStep(many(45), zero(), 40); return [a.until, a.xp, a.wk, a.sets, a.kg]; }, [5 * 864e5 * 2, 550, 5, 5, 2500]);
t('archiving never changes the totals', () => { const l = many(45), a = G.archiveStep(l, zero(), 40); return [G.totalsOf(l, a), G.archiveStep(l, a, 40)]; }, [G.totalsOf ? G.totalsOf(many(45), zero()) : 0, null]);
t('a workout that is still open is never archived over', () => { const l = many(45); l[2].end = 0; const a = G.archiveStep(l, zero(), 40); return [a.until, a.wk]; }, [2 * 864e5 * 2, 2]);
t('the archive remembers its run of weeks', () => { const a = G.archiveStep(many(45), zero(), 40); return [a.sw >= 1, a.lw === G.weekIdx(a.until)]; }, [true, true]);

// weeks in a row with a finished workout (weeks start on Sunday)
const D = (m, d, h) => new Date(2026, m - 1, d, h || 12).getTime(), on = (m, d) => ses({ id: 'd' + m + '-' + d, ts: D(m, d), end: D(m, d, 13), sets: three });
t('a week starts on Sunday', () => G.weekIdx(D(11, 8, 1)) - G.weekIdx(D(11, 7, 23)), 1);
t('no workouts, no streak', () => G.streakOf([], zero(), D(11, 13)), 0);
t('three weeks in a row', () => G.streakOf([on(11, 9), on(11, 3), on(10, 27)], zero(), D(11, 13)), 3);
t('a week that has not been trained yet does not break the streak', () => G.streakOf([on(11, 3), on(10, 27)], zero(), D(11, 13)), 2);
t('a missed week resets it', () => G.streakOf([on(11, 9), on(10, 27)], zero(), D(11, 13)), 1);
t('two weeks away end the streak', () => G.streakOf([on(10, 27)], zero(), D(11, 13)), 0);
t('an open workout does not count', () => G.streakOf([Object.assign(on(11, 9), { end: 0 })], zero(), D(11, 13)), 0);
t('the archived run continues the streak', () => G.streakOf([on(11, 9), on(11, 3)], Object.assign(zero(), { until: D(10, 28), sw: 6, lw: G.weekIdx(D(10, 27)) }), D(11, 13)), 8);
t('the archived run is not counted twice in a shared week', () => G.streakOf([on(11, 9), on(11, 3)], Object.assign(zero(), { until: D(11, 2), sw: 6, lw: G.weekIdx(D(11, 2)) }), D(11, 13)), 7);

// achievements
const wkOf4 = (m, wk, dl) => [0, 1, 2, 3].map((w) => ses({ id: m + wk + w, w, m, wk, dl: dl ? 1 : 0, ts: 1000 + w, end: 2000 + w, sets: three }));
t('all four workouts of one week', () => [G.fullWeek(wkOf4('m1', 2)), G.fullWeek(wkOf4('m1', 2).slice(1)), G.fullWeek(wkOf4('m1', 2).map((s, i) => (i ? s : Object.assign(s, { end: 0 }))))], [true, false, false]);
t('a finished round', () => [G.roundsDone(wkOf4('m1', 5, true)), G.roundsDone(wkOf4('m1', 2)), G.roundsDone(wkOf4('m1', 5, true).concat(wkOf4('m2', 5, true)))], [1, 0, 2]);
const X0 = { lvl: 1, streak: 0, fullWeek: false, rounds: 0 };
t('nothing earned at the start', () => G.earned({ xp: 0, wk: 0, sets: 0, prs: 0, kg: 0 }, X0), []);
t('the first workout', () => G.earned({ xp: 310, wk: 1, sets: 21, prs: 0, kg: 9000 }, X0), ['first']);
t('a seasoned lifter', () => G.earned({ xp: 20000, wk: 50, sets: 1000, prs: 25, kg: 100000 }, { lvl: 20, streak: 4, fullWeek: true, rounds: 1 }), ['first', 'week', 'pr1', 'w10', 'streak4', 'pr25', 'w25', 'round', 'ton100', 'w50', 'lvl20']);
t('every achievement has a name and an icon', () => G.BADGES.filter((b) => !b.id || !b.he || !b.ic || typeof b.ok !== 'function').length, 0);

// ================================================================== changing the plan
// what a movement gets when the lifter adds it by hand: by the kind of movement it is
t('a big lift added by hand', () => G.rxOf('legPress'), { sets: 3, reps: '8–12', rest: [120, 120], lvl: 2 });
t('a small lift added by hand', () => G.rxOf('hammerCurl'), { sets: 2, reps: '10–15', rest: [75, 75], lvl: 3 });
t('calves and core have their own', () => [G.rxOf('seatedCalf').reps, G.rxOf('pallof').reps, G.rxOf('pallof').lvl], ['12–20', '10–15', 0]);
t('every movement in the library has a prescription', () => Object.keys(LIB).filter((k) => { const r = G.rxOf(k); return !r || !(r.sets >= 1) || !/^\d+–\d+$/.test(r.reps) || r.rest.length !== 2; }), []);
// the order of a workout: the saved one, cleaned, else the plan's own
const known = (id) => ['a', 'b', 'c', 'x'].includes(id);
t('no saved order: the plan\'s own', () => G.orderOf(['a', 'b', 'c'], undefined, known), ['a', 'b', 'c']);
t('a saved order wins', () => G.orderOf(['a', 'b', 'c'], ['c', 'x', 'a'], known), ['c', 'x', 'a']);
t('unknown and repeated slots are dropped', () => G.orderOf(['a', 'b', 'c'], ['c', 'zz', 'c', 'a', 5, null], known), ['c', 'a']);
t('an order with nothing left falls back to the plan', () => G.orderOf(['a', 'b', 'c'], ['zz'], known), ['a', 'b', 'c']);
t('a saved order that is not a list is ignored', () => G.orderOf(['a', 'b'], { 0: 'a' }, known), ['a', 'b']);
// a slot read from a file or from the account is rebuilt field by field
t('a clean slot passes', () => G.cleanSlot({ w: 1, a: 'legExt', sets: 3, reps: '12–15', rest: [75, 75] }), { w: 1, a: 'legExt', sets: 3, reps: '12–15', rest: [75, 75] });
t('a slot is clamped to sane numbers', () => G.cleanSlot({ w: 2, a: 'dbCurl', sets: 99, reps: '10–15', rest: [1, 9999] }), { w: 2, a: 'dbCurl', sets: 8, reps: '10–15', rest: [15, 600] });
t('a slot with an unknown movement, workout or rep range is refused', () => [G.cleanSlot({ w: 1, a: '<img>', sets: 3, reps: '8–12', rest: [60, 60] }), G.cleanSlot({ w: 7, a: 'legExt', sets: 3, reps: '8–12', rest: [60, 60] }), G.cleanSlot({ w: 1, a: 'legExt', sets: 3, reps: '<b>', rest: [60, 60] }), G.cleanSlot(null)], [null, null, null, null]);

console.log('UNIT PASS ' + pass + ' FAIL ' + bad.length + (bad.length ? '\n  ' + bad.join('\n  ') : ''));
process.exit(bad.length ? 1 : 0);
