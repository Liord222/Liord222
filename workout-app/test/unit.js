// Unit checks for the pure parts: the progression engine (plan.js + lib.js + prog.js) and the game layer (game.js): node test/unit.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = process.argv[2] || path.join(__dirname, '..', 'src');
const GAME = ['CHEST', 'chestOf', 'hashId', 'setsToNext', 'LIKE', 'liftedLike', 'streakOpen', 'coinsLeft', 'RARE', 'BOXES', 'BOX_COST', 'WEEK_COST', 'SHIELD_COST', 'PITY', 'BOX_FROM', 'kindOf', 'weekItem', 'rareOf', 'rollRare', 'boxLeft', 'boxDraw', 'boxOpen', 'weekBuy', 'shieldBuy', 'boxOf', 'boxClaim', 'fullWeeks', 'shieldStep', 'cleanBody', 'bodyPut', 'bodyDrop', 'bodyTrend', 'wkName', 'ownName', 'rxOf', 'goalRx', 'workMins', 'sameKind', 'fitPlanData', 'startKg', 'stepUp', 'orderOf', 'cleanSlot', 'XP', 'RANKS', 'REWARDS', 'BADGES', 'ORD', 'wkOrd', 'wkFull', 'tally', 'xpStep', 'levelOf', 'rankOf', 'nextReward', 'rewardsBetween', 'buildOf', 'weekIdx', 'archZero', 'totalsOf', 'archiveStep', 'streakOf', 'streakDays', 'medalSVG', 'fullWeek', 'roundsDone', 'earned', 'SHOP', 'shopItem', 'coinsOf', 'cleanShop', 'spentOf', 'coinsLeft', 'shopWear'];
const code = ['plan.js', 'lib.js', 'prog.js', 'game.js'].map((f) => fs.readFileSync(path.join(src, f), 'utf8')).join('\n') +
  '\n;globalThis.X = { PLAN, WEEKS, LIB, MUSCLE, PATTERN, EQUIP, EN, e1rm, repRange, roundTo, rirFor, score, nextTarget, adjustTarget, muscleVolume, landmark };' +
  '\n;globalThis.G = {' + GAME.map((k) => k + ': typeof ' + k + " === 'undefined' ? undefined : " + k).join(', ') + '};';
vm.runInThisContext(code);
const { PLAN, WEEKS, LIB, MUSCLE, PATTERN, EQUIP, EN, roundTo, rirFor, score, nextTarget, adjustTarget, muscleVolume, landmark } = globalThis.X;
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
eq('new meso, inside the range: one rep of the last round is kept', nextTarget({ kg: 62.5, reps: 9, rir: 0 }, O({ rir: 3 })), { kg: 62.5, reps: 7, mode: 'base' });
/* a lifter who reaches the top of the range every round gets more load: 60x10 at the end of round 1 leads to 62.5 by the end of round 2 */
{ let r = { kg: 60, reps: 10, rir: 0 }; for (let wk = 1; wk <= 4; wk++) { const t = nextTarget(r, O({ rir: rirFor(wk, 5) })); r = { kg: t.kg, reps: t.reps, rir: rirFor(wk, 5) }; } eq('five-week rounds still raise the load', r.kg > 60, true); }
eq('deload at the lightest step lowers the reps, not to 0 kg', nextTarget({ kg: 5, reps: 12, rir: 0 }, O({ dl: true, rir: 4, lo: 12, hi: 20, inc: 5 })), { kg: 5, reps: 7, mode: 'deload' });
eq('a weak workout mid-round is a step down, not a new round', nextTarget({ kg: 60, reps: 4, rir: 2 }, O({ rir: 1, lo: 6, hi: 10 })).mode, 'down');
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
eq('down-set at the lightest step keeps the weight', adjustTarget({ kg: 5, reps: 15, mode: 'reps' }, { kg: 5, reps: 9, tk: 5, tr: 15 }, O({ lo: 12, hi: 20, inc: 5 })), { kg: 5, reps: 15, mode: 'hold' });
eq('recalibration on big steps: the reps fit the load, or the load stays', adjustTarget({ kg: 20, reps: 13, mode: 'reps' }, { kg: 20, reps: 18, tk: 20, tr: 13 }, O({ lo: 12, hi: 15, inc: 5, rir: 0 })), { kg: 20, reps: 15, mode: 'hold' });
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
const weekVol = (d) => { const v = muscleVolume(WEEKS[d].flatMap((w) => PLAN[w].ex.map((e) => ({ mv: e.a, sets: e.sets })))); return Object.fromEntries(Object.keys(v).map((k) => [k, v[k].d + v[k].i])); };
const all = muscleVolume(WEEKS[4].flatMap((w) => PLAN[w].ex.map((e) => ({ mv: e.a, sets: e.sets }))));
const tot = Object.fromEntries(Object.keys(all).map((k) => [k, all[k].d + all[k].i]));
eq('plan volume', tot, { chest: 8, back: 13, delts: 12, fdelt: 6, biceps: 10, triceps: 9, quads: 13, hams: 10.5, glutes: 10, calves: 6, abs: 11 });
/* every week, whatever the number of days, trains every big muscle; more days give more work, never less */
eq('every week trains the big muscles', [2, 3, 4, 5].map((d) => ['chest', 'back', 'delts', 'quads', 'hams', 'biceps', 'triceps'].every((k) => weekVol(d)[k] >= 3)), [true, true, true, true]);
eq('more days give more work', [2, 3, 4, 5].map((d) => Math.round(Object.values(weekVol(d)).reduce((a, b) => a + b, 0))).every((v, i, a) => !i || v > a[i - 1]), true);
eq('the week has as many workouts as the days, none twice, every one of them a workout of the plan', [2, 3, 4, 5].map((d) => WEEKS[d].length === d && new Set(WEEKS[d]).size === d && WEEKS[d].every((w) => !!PLAN[w])), [true, true, true, true]);
eq('no slot id comes twice in the plan', new Set(PLAN.flatMap((w) => w.ex.map((e) => e.id))).size, PLAN.reduce((n, w) => n + w.ex.length, 0));
eq('no movement comes twice in a workout', PLAN.every((w) => new Set(w.ex.map((e) => e.a)).size === w.ex.length), true);
eq('every movement of the plan is in the library', PLAN.every((w) => w.ex.every((e) => !!LIB[e.a])), true);
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
t('workout titles', () => PLAN.map((w) => w.t), ['שריון', 'סלע', 'כנפיים', 'זינוק', 'מנוע', 'סערה', 'להבה', 'פטיש', 'עוגן', 'עמוד', 'נשימה']);
t('every workout says what it trains, in both languages', () => PLAN.every((w) => !!w.m && !!w.me && !!w.te), true);
t('workouts are numbered by their place in the week', () => [0, 1, 2, 3].map((w) => G.wkOrd(w)), ['אימון 1', 'אימון 2', 'אימון 3', 'אימון 4']);
t('a workout with no name of its own is called by its number', () => [G.wkFull(1), G.wkName(1)], ['אימון 2', 'אימון 2']);
t('a workout the lifter named is called by that name, with its number beside it where there is room', () => { globalThis.S = { cfg: { me: { names: { 1: 'יום רגליים' } } } }; const r = [G.wkFull(1), G.wkName(1), G.wkName(0)]; delete globalThis.S; return r; }, ['אימון 2 – יום רגליים', 'יום רגליים', 'אימון 1']);
t('a workout that is not in the week is called by what it trains', () => G.wkName(7), PLAN[7].m);

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
t('each of the first four workouts raises the level', () => { let xp = 0; return WEEKS[4].map((i) => PLAN[i]).map((w) => { xp += w.ex.reduce((n, e) => n + e.sets, 0) * G.XP.set + G.XP.done; return G.levelOf(xp).lvl; }); }, [2, 3, 4, 5]);

// ranks and rewards
t('ranks', () => [1, 4, 5, 10, 19, 20, 30, 49, 50, 99, 100, 240].map((l) => G.rankOf(l).he), ['טירון', 'טירון', 'טירון', 'לוחם', 'לוחם', 'חיה', 'חיה', 'מכונה', 'מכונה', 'טיטאן', 'אגדה', 'אגדה']);
t('six ranks, each with a medal of its own', () => [G.RANKS.length, G.RANKS.map((r) => r.at), new Set(G.RANKS.map((r, i) => G.medalSVG(i))).size, G.medalSVG(0).startsWith('<svg')], [6, [1, 10, 20, 40, 70, 100], 6, true]);
t('rank index', () => [G.rankOf(1).i, G.rankOf(40).i, G.rankOf(100).i], [0, 3, 5]);
t('next reward', () => [G.nextReward(1).at, G.nextReward(3).at, G.nextReward(39).at, G.nextReward(40).at, G.nextReward(99).at, G.nextReward(100)], [3, 8, 40, 50, 100, null]);
t('the road of rewards runs to the hundredth level, each level once and in order', () => [G.REWARDS[G.REWARDS.length - 1].at, G.REWARDS.every((r, i, a) => !i || r.at > a[i - 1].at), G.RANKS.every((r) => r.at === 1 || G.REWARDS.some((x) => x.at === r.at))], [100, true, true]);
t('rewards opened by a level-up', () => [G.rewardsBetween(2, 8).map((r) => r.at), G.rewardsBetween(8, 8).length, G.rewardsBetween(1, 2).length], [[3, 8], 0, 0]);
t('the body grows with the level', () => [G.buildOf(1), G.buildOf(30), G.buildOf(200), G.buildOf(16) > G.buildOf(8)], [0, 1, 1, true]);

// the kiosk: coins, buying and wearing
t('every ten points are a coin, and odd totals are no coins at all', () => [0, 9, 10, 315, -40, NaN, Infinity].map((x) => G.coinsOf(x)), [0, 0, 1, 31, 0, 0, 0]);
/* ---- the collection: 180 things in five kinds of boxes and six rarities */
const HEX = /^#[0-9A-Fa-f]{6}$/, OLD_IDS = ['towel', 'sweat', 'towelP', 'kicksW', 'cap', 'capR', 'glasses', 'shaker', 'gloves', 'kicksK', 'capK', 'beanie', 'glovesR', 'shades', 'kicksR', 'tag', 'watch', 'buds', 'kicksP', 'phones', 'chain', 'watchG'];
const fresh = (o) => G.cleanShop(Object.assign({ sd: 7 }, o));
t('the collection holds 180 things, each once, with a slot, a model, colours, a rarity and a name in both languages', () => [G.SHOP.length, new Set(G.SHOP.map((x) => x.id)).size, G.SHOP.every((x) => x.slot && x.m && Array.isArray(x.c) && x.c.every((c) => c === null || HEX.test(c)) && HEX.test(x.c[0]) && x.r >= 0 && x.r <= 5 && x.he && x.en && !/[\u0590-\u05FF]/.test(x.en)), G.SHOP.filter((x) => /[.,!?:;"״׳()\-]/.test(x.he)).map((x) => x.he), new Set(G.SHOP.map((x) => x.he)).size, new Set(G.SHOP.map((x) => x.en)).size], [180, 180, true, [], 180, 180]);
t('five kinds of boxes share the collection, and six rarities, the highest the fewest', () => [G.BOXES.map((b, k) => G.SHOP.filter((x) => G.kindOf(x) === k).length), G.RARE.map((r, i) => G.SHOP.filter((x) => x.r === i).length), G.RARE.reduce((n, r) => n + r.w, 0), G.RARE.map((r) => r.he), G.BOXES.every((b, k) => [0, 1, 2, 3, 4, 5].every((r) => G.SHOP.some((x) => G.kindOf(x) === k && x.r === r)))], [[40, 30, 40, 30, 40], [53, 54, 40, 19, 9, 5], 1000, ['רגיל', 'נדיר', 'סופר נדיר', 'אפיק', 'מיתי', 'אגדי'], true]);
t('everything the kiosk sold before the boxes is still in the collection', () => OLD_IDS.filter((id) => !G.shopItem(id)), []);
t('the rarity of a box: half common, and three in a thousand legendary', () => [0, 499, 500, 779, 780, 909, 910, 969, 970, 996, 997, 999].map(G.rollRare), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
t('a box never gives a thing that is owned: forty hat boxes are forty different hats, and the forty-first is empty', () => { let shop = fresh(), got = []; for (let i = 0; i < 40; i++) { const d = G.boxDraw(shop, 0); got.push(d.it); shop = d.shop; } return [new Set(got.map((x) => x.id)).size, got.every((x) => G.kindOf(x) === 0), shop.n, G.boxDraw(shop, 0), G.boxLeft(shop, 0).length, G.boxLeft(shop, 1).length]; }, [40, true, 40, null, 0, 30]);
t('the same box opened again gives the same thing, and another lifter\'s luck is another', () => { const run = (sd) => { let shop = fresh({ sd }), ids = []; for (let i = 0; i < 12; i++) { const d = G.boxDraw(shop, i % 5); ids.push(d.it.id); shop = d.shop; } return ids.join(); }; return [run(7) === run(7), run(7) === run(8), G.boxDraw(fresh(), 2).it.id === G.boxDraw(fresh(), 2).it.id]; }, [true, false, true]);
t('after nine boxes with nothing epic the tenth is epic at least (while its kind still has one)', () => { const out = []; for (let sd = 1; sd <= 40; sd++) { let shop = fresh({ sd }), gap = 0, worst = 0; for (let i = 0; i < 40; i++) { const d = G.boxDraw(shop, i % 5); shop = d.shop; if (d.it.r >= 3) gap = 0; else { gap++; worst = Math.max(worst, gap); } } out.push(worst); } return [Math.max.apply(null, out) <= G.PITY - 1, G.boxDraw(fresh({ pt: 9 }), 0).it.r >= 3, G.boxDraw(fresh({ pt: 9 }), 0).shop.pt]; }, [true, true, 0]);
t('over many lifters the first box is common about half the time and legendary almost never', () => { const n = [0, 0, 0, 0, 0, 0]; for (let sd = 1; sd <= 4000; sd++) n[G.boxDraw(fresh({ sd }), sd % 5).it.r]++; return [n[0] > 1760 && n[0] < 2240, n[1] > 960 && n[1] < 1280, n[5] < 40, n[4] < 180]; }, [true, true, true, true]);
t('a box that waits is opened for nothing; a box that is bought takes its coins, and without them there is none', () => { const w = G.boxOpen(fresh({ inv: [1, 0, 0, 0, 0] }), 0, false, 0), b = G.boxOpen(fresh(), 2, true, 800), b2 = G.boxOpen(b.shop, 2, true, 800); return [w.shop.inv, w.shop.sp, w.shop.own.length, G.kindOf(w.it), G.boxOpen(w.shop, 0, false, 0), b.shop.sp, G.coinsLeft(800, b.shop), G.kindOf(b.it), b2, G.boxOpen(fresh(), 9, true, 9999)]; }, [[0, 0, 0, 0, 0], 0, 1, 0, null, 80, 0, 2, null, null]);
t('a kind that is all owned gives from the next kind', () => { const hats = G.SHOP.filter((x) => G.kindOf(x) === 0).map((x) => x.id), r = G.boxOpen(fresh({ own: hats }), 0, true, 5000); return [r.kind, G.kindOf(r.it), r.shop.own.length]; }, [1, 1, 41]);
t('once everything is owned there is nothing to open', () => G.boxOpen(fresh({ own: G.SHOP.map((x) => x.id), inv: [1, 1, 1, 1, 1] }), 3, false, 0), null);
t('a shield for the streak is bought with coins, and only one is held', () => { const a = G.shieldBuy(fresh(), 1200), b = G.shieldBuy(a, 9000); return [a.sh, a.sp, b, G.shieldBuy(fresh(), 1190)]; }, [1, 120, null, null]);
{
  const one = { a1: [{ kg: 50, reps: 8, done: true }] }, at = G.BOX_FROM + 864e5, fin = (id, o) => ses(Object.assign({ id, ts: at, end: at + 36e5, sets: one }, o)), ids = Array.from({ length: 600 }, (_, i) => 'b' + i), got = ids.map((id) => G.boxOf(fin(id)));
  const share = got.filter((k) => k >= 0).length / ids.length, hit = ids.find((id) => G.boxOf(fin(id)) >= 0), miss = ids.find((id) => G.boxOf(fin(id)) < 0);
  t('from the day of the boxes a finished workout ends with a box about one time in three, of every kind, and no longer with coins', () => [share > 0.25 && share < 0.43, new Set(got.filter((k) => k >= 0)).size, got.every((k) => k >= -1 && k < 5), ids.every((id) => G.chestOf(fin(id)) === 0), G.boxOf(fin(hit, { end: 0 })), G.boxOf(fin(hit, { sets: {} })), G.boxOf(fin(hit, { ts: G.BOX_FROM - 1 })), G.boxOf(null)], [true, 5, true, true, -1, -1, -1, -1]);
  t('a box is given once for the workout that earned it', () => { const a = G.boxClaim(fresh(), [fin(hit), fin(miss)], 4), k = G.boxOf(fin(hit)); return [a.inv[k], a.inv.reduce((x, y) => x + y, 0), a.got, G.boxClaim(a, [fin(hit), fin(miss)], 4), G.boxClaim(fresh(), [fin(miss)], 4)]; }, [1, 1, [hit], null, null]);
  t('a full week of the plan gives a box of its own, once', () => { const wk = (n) => [0, 1, 2, 3].slice(0, n).map((w) => fin(miss + 'w' + w, { w, m: 'r1', wk: 2 })).filter((x) => G.boxOf(x) < 0), full = wk(4), a = G.boxClaim(fresh(), full, full.length); return [G.fullWeeks(full, full.length), G.fullWeeks(full, full.length + 1), a.got, a.inv.reduce((x, y) => x + y, 0), G.boxClaim(a, full, full.length), G.fullWeeks([fin('q', { w: 0, m: 'r1', wk: 1, ts: G.BOX_FROM - 5 })], 1)]; }, [['r1/2'], [], ['fr1/2'], 1, null, []]);
}
t('a first workout does not buy a box yet, and three do', () => [G.coinsLeft(310, fresh()), G.boxOpen(fresh(), 0, true, 310), !!G.boxOpen(fresh(), 0, true, 800)], [31, null, true]);
t('a thing that is put on takes the place of what its slot held, and can be taken off', () => { let s = { own: ['towel', 'chain', 'cap'], on: ['towel', 'cap'] }; const a = G.shopWear(s, 'chain', true), b = G.shopWear(a, 'chain', false); return [a.on, b.on, G.shopWear(s, 'shades', true), s.on]; }, [['cap', 'chain'], ['cap'], null, ['towel', 'cap']]);
t('a wardrobe from before the boxes counts what was paid then; from then on what was spent is written down, and the coins left never go under zero', () => [G.spentOf(G.cleanShop({ own: ['towel', 'cap'], on: [] })), G.coinsLeft(1000, G.cleanShop({ own: ['towel', 'cap'], on: [] })), G.coinsLeft(200, G.cleanShop({ own: ['chain'], on: [] })), G.spentOf(G.cleanShop({ own: ['towel', 'cap', 'halo'], on: [], sp: 240 })), G.spentOf(G.cleanShop({ own: ['halo'], on: [] }))], [90, 10, 0, 240, 0]);
t('a wardrobe from a file is cleaned: only things that are sold, each once, worn only when owned, one to a slot', () => { const E = { own: [], on: [], sp: 0, inv: [0, 0, 0, 0, 0], got: [], n: 0, pt: 0, sd: 0, sh: 0, shw: [] }; return [G.cleanShop({ own: ['cap', 'cap', 'nope', 'towel', 'chain', 7, 'wk2970', 'wkx'], on: ['chain', 'towel', 'shades', 'cap'], inv: [2, -1, 'a', 500, 1.7], got: ['s1', 's1', 5], n: 12.9, pt: 44, sd: 99, sh: 7, shw: [3, 3, 'x'], sp: -4 }), G.cleanShop(null), G.cleanShop({ own: 'cap', on: {} })].map((x) => JSON.stringify(x)).concat(JSON.stringify(E)); }, [JSON.stringify({ own: ['cap', 'towel', 'chain', 'wk2970'], on: ['chain', 'cap'], sp: 290, inv: [2, 0, 0, 99, 1], got: ['s1'], n: 12, pt: 10, sd: 99, sh: 1, shw: [3] }), JSON.stringify({ own: [], on: [], sp: 0, inv: [0, 0, 0, 0, 0], got: [], n: 0, pt: 0, sd: 0, sh: 0, shw: [] }), JSON.stringify({ own: [], on: [], sp: 0, inv: [0, 0, 0, 0, 0], got: [], n: 0, pt: 0, sd: 0, sh: 0, shw: [] }), JSON.stringify({ own: [], on: [], sp: 0, inv: [0, 0, 0, 0, 0], got: [], n: 0, pt: 0, sd: 0, sh: 0, shw: [] })]);

// totals: the archive plus every workout newer than it
const zero = () => G.archZero();
t('totals of two workouts', () => G.totalsOf([ses({ sets: three }), ses({ id: 's2', ts: 3000, end: 0, sets: three })], zero()), { xp: 220, wk: 1, sets: 6, prs: 2, kg: 1800, ch: G.chestOf(ses({ sets: three })) });
/* ---- round 2: what makes a finished workout feel like something */
{
  const one = { a1: [{ kg: 50, reps: 8, done: true }] }, fin = (id) => ses({ id, sets: one }), ids = Array.from({ length: 600 }, (_, i) => 'x' + i), got = ids.map((id) => G.chestOf(fin(id)));
  const share = got.filter(Boolean).length / ids.length;
  t('a surprise chest: about one finished workout in three has one, with coins from the list, and the same workout always the same', () => [share > 0.25 && share < 0.43, got.every((n) => n === 0 || G.CHEST.includes(n)), ids.slice(0, 50).every((id, i) => G.chestOf(fin(id)) === got[i]), new Set(got.filter(Boolean)).size >= 4], [true, true, true, true]);
  const hit = ids.find((id) => G.chestOf(fin(id)) > 0);
  t('no chest for a workout that is not finished or has no set', () => [G.chestOf(ses({ id: hit, end: 0, sets: one })), G.chestOf(ses({ id: hit, sets: {} })), G.chestOf(null)], [0, 0, 0]);
  t('the chest\'s coins are in the totals, and stay there when the workout moves to the archive', () => { const L = [fin(hit)], a = G.archiveStep(L, zero(), 0); return [G.totalsOf(L, zero()).ch, a.ch, G.totalsOf(L, a).ch]; }, [G.chestOf(fin(hit)), G.chestOf(fin(hit)), G.chestOf(fin(hit))]);
  t('the kiosk can spend the chest\'s coins', () => [G.coinsLeft(0, G.cleanShop(null), 25), G.coinsLeft(100, G.cleanShop(null), 25), !!G.boxOpen(G.cleanShop({ sd: 3 }), 0, true, 0, 80), G.boxOpen(G.cleanShop({ sd: 3 }), 0, true, 0, 79), G.coinsLeft(0, G.cleanShop(null), -5)], [25, 35, true, null, 0]);
}
t('almost there: the next level is said in sets', () => [G.setsToNext({ lvl: 3, into: 270, need: 280 }), G.setsToNext({ lvl: 3, into: 0, need: 280 }), G.setsToNext({ lvl: 3, into: 279, need: 280 })], [1, 28, 1]);
t('what a workout lifted weighs as much as the heaviest thing it passes, and nothing under 300 kg', () => [G.liftedLike(299), G.liftedLike(300).en, G.liftedLike(4200).en, G.liftedLike(5000).he, G.liftedLike(90000).en], [null, 'a grizzly bear', 'a hippo', 'פיל', 'two buses']);
{
  const day = 864e5, now = Date.UTC(2026, 10, 18, 12), wk = (k) => ses({ id: 'k' + k, ts: now - k * 7 * day, end: now - k * 7 * day + 3600e3, sets: { a1: [{ kg: 50, reps: 8, done: true }] } });
  t('a run of weeks this week has not kept yet is said; once this week has a workout, or the run is short, nothing is', () => [G.streakOpen([wk(1), wk(2), wk(3)], zero(), now), G.streakOpen([wk(0), wk(1), wk(2)], zero(), now), G.streakOpen([wk(1)], zero(), now), G.streakOpen([], zero(), now)], [3, 0, 0, 0]);
}
t('archived workouts are not counted twice', () => G.totalsOf([ses({ sets: three }), ses({ id: 's2', ts: 3000, end: 4000, sets: three })], Object.assign(zero(), { until: 1500, xp: 5000, wk: 20, sets: 400, prs: 30, kg: 90000 })), { xp: 5160, wk: 21, sets: 403, prs: 31, kg: 90900, ch: G.chestOf(ses({ id: 's2', ts: 3000, end: 4000, sets: three })) });
const many = (n) => Array.from({ length: n }, (_, i) => ses({ id: 's' + (i + 1), ts: (i + 1) * 864e5 * 2, end: (i + 1) * 864e5 * 2 + 1, sets: { ua1: [{ kg: 50, reps: 10, done: true }] } }));
t('nothing to archive while the log is short', () => G.archiveStep(many(40), zero(), 40), null);
t('two workouts at the very moment the archive ends both go in, and none drops out of the totals', () => { const l = many(42); l[1].ts = l[2].ts; const a = G.archiveStep(l, zero(), 40), t2 = G.totalsOf(l, a); return [t2.wk, t2.sets]; }, [42, 42]);
t('help on an assisted movement is no kilogram lifted', () => { const inv = Object.keys(LIB).find((k) => LIB[k].inv); return G.tally({ end: 1, mv: { s1: inv }, sets: { s1: [{ kg: 40, reps: 8, done: true }], s2: [{ kg: 50, reps: 10, done: true }] } }).kg; }, 500);
t('the level comes straight from the points, even for a total no one reaches', () => [G.levelOf(199).lvl, G.levelOf(200).lvl, G.levelOf(440).lvl, G.levelOf(1e300).lvl > 1], [1, 2, 3, true]);
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
t('the streak in days runs from the first workout of the run until today', () => [G.streakDays([on(11, 9), on(11, 3), on(10, 27)], zero(), D(11, 13)), G.streakDays([on(11, 13)], zero(), D(11, 13)), G.streakDays([], zero(), D(11, 13)), G.streakDays([on(11, 9), on(10, 27)], zero(), D(11, 13)), G.streakDays([on(10, 27)], zero(), D(11, 13))], [18, 1, 0, 5, 0]);
t('a run whose first week is in the archive counts that week whole', () => G.streakDays([on(11, 9), on(11, 3)], Object.assign(zero(), { until: D(10, 28), sw: 6, lw: G.weekIdx(D(10, 27)) }), D(11, 13)), 56);
t('an open workout does not count', () => G.streakOf([Object.assign(on(11, 9), { end: 0 })], zero(), D(11, 13)), 0);
t('the archived run continues the streak', () => G.streakOf([on(11, 9), on(11, 3)], Object.assign(zero(), { until: D(10, 28), sw: 6, lw: G.weekIdx(D(10, 27)) }), D(11, 13)), 8);
t('the archived run is not counted twice in a shared week', () => G.streakOf([on(11, 9), on(11, 3)], Object.assign(zero(), { until: D(11, 2), sw: 6, lw: G.weekIdx(D(11, 2)) }), D(11, 13)), 7);
t('the thing of the week: one each week, in the colours of its season, bought only in its own week and only once', () => { const now = D(11, 13), w = G.weekIdx(now), it = G.weekItem(w), shop = G.weekBuy(fresh(), w, now, 1500), poor = G.weekBuy(fresh(), w, now, 1490); return [it.id === 'wk' + w, G.shopItem('wk' + w) === it, it.wk, G.weekItem(w + 1).id !== it.id, it.c.every((c) => HEX.test(c)), /סתיו 2026$/.test(it.he), /^Autumn 2026 /.test(it.en), shop.own, shop.on, shop.sp, poor, G.weekBuy(shop, w, now, 9000), G.weekBuy(fresh(), w - 1, now, 9000), G.rareOf(it).he, G.shopItem('wkabc'), G.shopItem('wk-3')]; }, [true, true, G.weekIdx(D(11, 13)), true, true, true, true, ['wk' + G.weekIdx(D(11, 13))], ['wk' + G.weekIdx(D(11, 13))], 150, null, null, null, 'מהדורה שבועית', null, null]);
t('the seasons of the weekly things follow the year', () => [[1, 15], [4, 15], [7, 15], [10, 15], [12, 15]].map((d) => G.weekItem(G.weekIdx(D(d[0], d[1]))).he.split(' ').slice(-2)[0]), ['חורף', 'אביב', 'קיץ', 'סתיו', 'חורף']);
t('a shield that is held stands in for one missed week, and the run goes on', () => {
  const now = D(11, 13), cur = G.weekIdx(now), L = [on(11, 3), on(10, 27)], held = fresh({ sh: 1 }), used = G.shieldStep(held, [on(10, 27), on(10, 20)], zero(), now);
  return [G.shieldStep(held, L, zero(), now), G.shieldStep(fresh(), [on(10, 27)], zero(), now), used.sh, used.shw, G.streakOf([on(10, 27), on(10, 20)], zero(), now), G.streakOf([on(10, 27), on(10, 20)], zero(), now, used.shw), G.streakDays([on(10, 27), on(10, 20)], zero(), now, used.shw), G.shieldStep(used, [on(10, 27), on(10, 20)], zero(), now), G.shieldStep(held, [on(10, 20)], zero(), now)];
}, [null, null, 0, [G.weekIdx(D(11, 13)) - 1], 0, 3, 25, null, null]);

// achievements
const wkOf4 = (m, wk, dl) => [0, 1, 2, 3].map((w) => ses({ id: m + wk + w, w, m, wk, dl: dl ? 1 : 0, ts: 1000 + w, end: 2000 + w, sets: three }));
t('all four workouts of one week', () => [G.fullWeek(wkOf4('m1', 2)), G.fullWeek(wkOf4('m1', 2).slice(1)), G.fullWeek(wkOf4('m1', 2).map((s, i) => (i ? s : Object.assign(s, { end: 0 }))))], [true, false, false]);
t('a finished round', () => [G.roundsDone(wkOf4('m1', 5, true)), G.roundsDone(wkOf4('m1', 2)), G.roundsDone(wkOf4('m1', 5, true).concat(wkOf4('m2', 5, true)))], [1, 0, 2]);
const X0 = { lvl: 1, streak: 0, fullWeek: false, rounds: 0 };
t('nothing earned at the start', () => G.earned({ xp: 0, wk: 0, sets: 0, prs: 0, kg: 0 }, X0), []);
t('the first workout', () => G.earned({ xp: 310, wk: 1, sets: 21, prs: 0, kg: 9000 }, X0), ['first']);
t('a seasoned lifter', () => G.earned({ xp: 20000, wk: 50, sets: 1000, prs: 25, kg: 100000 }, { lvl: 20, streak: 4, days: 28, fullWeek: true, rounds: 1 }), ['first', 'week', 'pr1', 'w10', 'streak4', 'pr25', 'w25', 'round', 'set1k', 'w50', 'lvl20']);
t('every achievement says how far along it is', () => { const T = { xp: 900, wk: 7, sets: 140, prs: 3, kg: 9000 }, X = { lvl: 4, streak: 2, days: 9, fullWeek: false, rounds: 0 }; return [G.BADGES.every((b) => { const o = b.of(T, X); return o.length === 2 && o[1] > 0 && (o[0] >= o[1]) === !!b.ok(T, X); }), G.BADGES.find((b) => b.id === 'w10').of(T, X), G.BADGES.find((b) => b.id === 'streak4').of(T, X)]; }, [true, [7, 10], [9, 28]]);
t('every achievement has a name and an icon', () => G.BADGES.filter((b) => !b.id || !b.he || !b.ic || typeof b.ok !== 'function').length, 0);

// ================================================================== changing the plan
// what a movement gets when the lifter adds it by hand: by the kind of movement it is
t('a big lift added by hand', () => G.rxOf('legPress'), { sets: 3, reps: '8–12', rest: [120, 120], lvl: 2 });
t('a small lift added by hand', () => G.rxOf('hammerCurl'), { sets: 2, reps: '10–15', rest: [75, 75], lvl: 3 });
t('calves and core have their own', () => [G.rxOf('seatedCalf').reps, G.rxOf('pallof').reps, G.rxOf('pallof').lvl], ['12–20', '10–15', 0]);
t('every movement in the library has a prescription', () => Object.keys(LIB).filter((k) => { const r = G.rxOf(k); return !r || !(r.sets >= 1) || !/^\d+–\d+$/.test(r.reps) || r.rest.length !== 2; }), []);
// the goals bend the written plan
t('no goal, or physique alone: the plan as written', () => [G.goalRx('6–10', [120, 180], [], 1), G.goalRx('6–10', [120, 180], [0], 1), G.goalRx('12–15', [75, 75], [0], 2)], [null, null, null]);
t('strength alone: the heavy lifts go low, with longer rests', () => [G.goalRx('6–10', [120, 180], [1], 1), G.goalRx('8–10', [120, 180], [1], 2), G.goalRx('8–12', [120, 120], [1], 1)], [{ reps: '4–6', rest: [150, 210] }, { reps: '5–8', rest: [150, 210] }, { reps: '6–8', rest: [150, 150] }]);
t('strength leaves the small lifts alone', () => [G.goalRx('12–15', [75, 75], [1], 1), G.goalRx('8–12', [90, 90], [1], 1), G.goalRx('12', [60, 60], [1], 1)], [null, null, null]);
t('a beginner who wants strength is not sent under five reps', () => G.goalRx('6–10', [120, 180], [1], 0), { reps: '5–8', rest: [120, 210] });
t('strength beside another goal bends half as far', () => [G.goalRx('6–10', [120, 180], [0, 1], 1), G.goalRx('8–12', [120, 120], [1, 2], 2)], [{ reps: '5–8', rest: [120, 210] }, { reps: '6–10', rest: [120, 150] }]);
t('fitness alone: every range a step higher, rests a quarter shorter', () => [G.goalRx('6–10', [120, 180], [2], 1), G.goalRx('12–15', [75, 75], [2], 1), G.goalRx('10–15', [60, 60], [2], 1), G.goalRx('12', [60, 60], [2], 1)], [{ reps: '8–12', rest: [90, 135] }, { reps: '12–20', rest: [60, 60] }, { reps: '12–15', rest: [45, 45] }, { reps: '12', rest: [45, 45] }]);
t('fitness beside another goal keeps the reps and trims the rests', () => [G.goalRx('12–15', [75, 75], [0, 2], 1), G.goalRx('10–15', [60, 60], [1, 2], 1), G.goalRx('8–15', [60, 60], [0, 2], 1)], [{ reps: '12–15', rest: [60, 60] }, { reps: '10–15', rest: [45, 45] }, { reps: '8–15', rest: [45, 45] }]);
t('a rest is never cut under 45 seconds, nor stretched over four minutes', () => [G.goalRx('10–15', [45, 50], [2], 1).rest, G.goalRx('6–10', [200, 230], [1], 1).rest], [[45, 45], [230, 240]]);
t('every range the plan and the library use is known to the bend or left as it is', () => { const all = new Set(); for (const w of PLAN) for (const e of w.ex) all.add(e.reps); for (const k of Object.keys(LIB)) all.add(G.rxOf(k).reps); return [...all].filter((r) => { const a = G.goalRx(r, [120, 180], [1], 1), b = G.goalRx(r, [60, 60], [2], 1); return (a && !/^\d+–\d+$/.test(a.reps)) || !b || !/^\d+(–\d+)?$/.test(b.reps); }); }, []);
// where the numbers start for a movement never logged
t('every movement with a weight has a place to start, on a step its equipment can be loaded with', () => Object.keys(LIB).filter((k) => { const L = LIB[k], inc = EQUIP[L.eq].inc; return [0, 1, 2, null].some((x) => { const kg = G.startKg(k, x); return L.bw || L.eq === 'bw' ? kg !== null : !(kg >= inc) || Math.abs(kg / inc - Math.round(kg / inc)) > 1e-9; }); }), []);
t('a movement done with the body\'s own weight starts with none', () => Object.keys(LIB).filter((k) => LIB[k].bw || LIB[k].eq === 'bw').map((k) => G.startKg(k, 1)), Object.keys(LIB).filter((k) => LIB[k].bw || LIB[k].eq === 'bw').map(() => null));
t('more experience starts heavier', () => Object.keys(LIB).filter((k) => { const a = G.startKg(k, 0), b = G.startKg(k, 1), c = G.startKg(k, 2); return a != null && !LIB[k].inv && !(a <= b && b <= c && a < c); }), []);
t('where more weight is more help, a beginner starts with the most', () => [G.startKg('assistedPullup', 0), G.startKg('assistedPullup', 1), G.startKg('assistedPullup', 2)], [50, 30, 20]);
t('a start is rounded to the lifter\'s own step when one is set', () => [G.startKg('inclineSmith', 1), G.startKg('inclineSmith', 0), G.startKg('inclineSmith', 0, 10), G.startKg('latRaise', 1), G.startKg('legPress', 2)], [40, 25, 20, 6, 140]);
t('up goes fast and down goes fine', () => [0.5, 1, 1.25, 2, 2.5, 5, 10].map((x) => G.stepUp(x)), [1, 2, 2.5, 4, 5, 5, 10]);
// how long a workout takes, and the plan fitted to its lifter
t('a workout takes its sets, its rests, the moves between exercises and a warm-up', () => [G.workMins([]), G.workMins([{ sets: 3, reps: '6–10', rest: [120, 180] }]), G.workMins(PLAN[0].ex), G.workMins(PLAN[1].ex)], [10, 15, 55, 50]);
(() => {
  const BASIC = ['db', 'bar', 'cable', 'bw'], fit = (a) => G.fitPlanData(Object.assign({ exp: 1, goals: [0], time: 0, ok: null }, a));
  const mins = (l) => G.workMins(l.map((x) => ({ sets: x.sets, reps: x.r, rest: x.t })));
  t('a full gym, any length, a regular lifter: the plan as it is written', () => fit({}).map((l, w) => l.map((x) => x.id + ':' + x.mv + ':' + x.sets + ':' + x.kind).join()), PLAN.map((wk) => wk.ex.map((e) => e.id + ':' + e.a + ':' + e.sets + ':').join()));
  t('a gym without machines: every movement is one it has the equipment for', () => fit({ ok: BASIC }).map((l) => l.filter((x) => !BASIC.includes(LIB[x.mv].eq)).map((x) => x.mv)), PLAN.map(() => []));
  t('and no movement comes twice in a workout, and none is left short', () => fit({ ok: BASIC }).map((l) => new Set(l.map((x) => x.mv)).size === l.length && l.length >= 4), PLAN.map(() => true));
  t('a swap keeps the slot and its numbers; another movement for the muscle brings its own', () => fit({ ok: BASIC }).every((l, w) => l.every((x) => { const e = PLAN[w].ex.find((y) => y.id === x.id); return x.kind === 'repl' ? x.full === G.rxOf(x.mv).sets && x.reps === G.rxOf(x.mv).reps : x.full === e.sets && x.reps === e.reps && (x.kind === 'swap') === (x.mv !== e.a); })), true);
  t('a slot is swapped for the same kind of movement where the gym has one', () => fit({ ok: BASIC }).every((l) => l.every((x) => x.kind !== 'repl' || !G.sameKind(PLAN.flatMap((w) => w.ex).find((e) => e.id === x.id).a).some((k) => BASIC.includes(LIB[k].eq) && !l.some((y) => y.mv === k && y.id !== x.id)))), true);
  t('a beginner does one set less where there were three or more', () => [fit({ exp: 0 }).every((l) => l.every((x) => x.sets === (x.full >= 3 ? x.full - 1 : x.full))), fit({ exp: 2 }).every((l) => l.every((x) => x.sets === x.full))], [true, true]);
  /* round 3: every answer changes the plan */
  const allIn = (a, f) => fit(a).map((l, w) => l.filter((x) => !f(LIB[x.mv], x)).map((x) => w + ':' + x.mv)).flat();
  t('an outdoor gym: only the body\'s own weight, on the bars it has and with no bench', () => [allIn({ place: 1 }, (L) => L.eq === 'bw' && L.need !== 'bench'), fit({ place: 1 }).some((l) => l.some((x) => LIB[x.mv].need === 'bar'))], [[], true]);
  t('home with dumbbells: dumbbells and the floor, and nothing that needs a bar, parallel bars or a bench', () => allIn({ place: 2 }, (L) => ['db', 'bw'].includes(L.eq) && !L.need), []);
  t('home with nothing: the body\'s own weight, and nothing to hang from', () => allIn({ place: 3 }, (L) => L.eq === 'bw' && !L.need), []);
  t('in every place every workout keeps at least four exercises, and none comes twice', () => [0, 1, 2, 3].flatMap((pl) => [0, 3].flatMap((exp) => fit({ place: pl, exp }).map((l, w) => (l.length >= 4 && new Set(l.map((x) => x.mv)).size === l.length ? '' : pl + ':' + exp + ':' + w + ':' + l.length)).filter(Boolean))), []);
  t('a beginner gets the easy versions and a veteran the hard ones', () => [fit({ place: 1, exp: 0 })[4].some((x) => x.mv === 'kneePushUp'), fit({ place: 1, exp: 3 })[4].some((x) => (LIB[x.mv].lv || 2) === 3)], [true, true]);
  t('what hurts is not loaded: sore knees and shoulders get the movements that are easy on them', () => { const P = (L) => ['squat', 'lunge', 'kext', 'vpress'].includes(L.pat); return allIn({ pain: [0, 2] }, (L) => L.jf || !P(L)); }, []);
  t('with nothing sore, nothing is swapped', () => fit({ pain: [] }).every((l) => l.every((x) => !x.kind)), true);
  t('the area that was asked for gets one more set on its first two exercises of each workout', () => { const a = fit({ focus: 1 }), b = fit({}); return a.map((l, w) => l.reduce((n, x, i) => n + x.sets - b[w][i].sets, 0)).join() === a.map((l) => Math.min(2, l.filter((x) => LIB[x.mv].p === 'back').length)).join(); }, true);
  t('a veteran does one more set on the lift that opens each workout', () => fit({ exp: 3 }).every((l) => l[0].sets === Math.min(5, l[0].full + 1) && l.slice(1).every((x) => x.sets === x.full)), true);
  t('from fifty the long rests are a little longer, and under sixteen nothing opens a workout under eight reps', () => { const o = fit({ age: 55 })[0][0], y = fit({ age: 14 })[0][0], n = fit({})[0][0]; return [o.t[0] - n.t[0], y.r, n.r]; }, [15, '8–12', '6–10']);
  t('cutting shortens every rest, health never goes heavy, and running lifts the reps of the legs only', () => { const c = fit({ goals: [3] })[1][0], h = fit({ goals: [4] })[1][0], r = fit({ goals: [5] }), n = fit({})[1][0]; return [n.t[0] - c.t[0], c.r === n.r, h.r, r[1][0].r, r[0][0].r]; }, [15, true, '8–12', '8–12', '6–10']);
  t('a week of one to seven workouts, each of different workouts that the plan has', () => [1, 2, 3, 4, 5, 6, 7].map((d) => (WEEKS[d] && WEEKS[d].length === d && new Set(WEEKS[d]).size === d && WEEKS[d].every((w) => !!PLAN[w]) ? '' : d)).filter(Boolean), []);
  for (const time of [30, 45, 60, 75]) t('a workout of ' + time + ' minutes runs no longer, unless it is down to four exercises', () => fit({ time }).map((l) => mins(l) <= time || l.length === 4), PLAN.map(() => true));
  t('what leaves is the end of the workout: the heavy lifts that open it stay', () => fit({ time: 30 }).map((l, w) => l.map((x) => x.id).join() === PLAN[w].ex.slice(0, l.length).map((e) => e.id).join()), PLAN.map(() => true));
  t('more time never means fewer exercises', () => { const n = [30, 45, 60, 75, 0].map((time) => fit({ time }).map((l) => l.length)); return n.every((a, i) => !i || a.every((v, w) => v >= n[i - 1][w])); }, true);
  t('a short workout keeps what it can, never less than four', () => fit({ time: 30, exp: 2, goals: [1] }).map((l) => l.length >= 4), PLAN.map(() => true));
  t('the reps and rests of the fitted plan are the ones the goals ask for', () => { const l = fit({ goals: [1] })[0][0], e = PLAN[0].ex[0]; return [l.reps, l.r, l.rest.join(), l.t.join(), e.reps]; }, ['6–10', '4–6', '120,180', '150,210', '6–10']);
  t('fitting leaves the plan itself as it was', () => { const before = JSON.stringify(PLAN); fit({ ok: BASIC, time: 30, exp: 0, goals: [1, 2] }); return JSON.stringify(PLAN) === before; }, true);
})();
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
t('a slot with an unknown movement, workout or rep range is refused', () => [G.cleanSlot({ w: 1, a: '<img>', sets: 3, reps: '8–12', rest: [60, 60] }), G.cleanSlot({ w: 40, a: 'legExt', sets: 3, reps: '8–12', rest: [60, 60] }), G.cleanSlot({ w: 1, a: 'legExt', sets: 3, reps: '<b>', rest: [60, 60] }), G.cleanSlot(null)], [null, null, null, null]);
t('a slot whose rep range is empty or upside down is refused', () => [G.cleanSlot({ w: 1, a: 'legExt', sets: 3, reps: '0–0', rest: [60, 60] }), G.cleanSlot({ w: 1, a: 'legExt', sets: 3, reps: '12–8', rest: [60, 60] }), G.cleanSlot({ w: 1, a: 'legExt', sets: 3, reps: '0', rest: [60, 60] }), G.cleanSlot({ w: 1, a: 'legExt', sets: 3, reps: '12', rest: [60, 60] }).reps], [null, null, null, '12']);

// ---- two languages: every text of the content has an English twin, and the helpers follow the language of the page
const HEB = /[\u0590-\u05FF]/, L = (code) => vm.runInThisContext(code), inEn = (fn) => { L("LANG = 'en'"); try { return fn(); } finally { L("LANG = 'he'"); } };
t('say() follows the language of the page', () => [L("say('שלום', 'Hello')"), inEn(() => L("say('שלום', 'Hello')"))], ['שלום', 'Hello']);
t('every movement has an English name, muscle line and three cues', () => inEn(() => Object.keys(LIB).filter((k) => { const c = L('mvCues')(k), all = [L('mvName')(k), L('mvMus')(k)].concat(c); return c.length !== 3 || all.some((x) => !x || HEB.test(x)); })), []);
t('in Hebrew the cues and the muscle line are the Hebrew ones', () => [L('mvCues')('legExt'), L('mvMus')('legExt')], [LIB.legExt.c, LIB.legExt.m]);
t('every muscle and every kind of equipment has an English name', () => inEn(() => Object.keys(MUSCLE).map((k) => L('muName')(k)).concat(Object.keys(EQUIP).map((k) => L('eqName')(k))).filter((x) => !x || HEB.test(x))), []);
t('a muscle inside an English sentence is in lower case', () => inEn(() => [L('muLow')('chest'), L('muLow')('quads')]), ['chest', 'quads']);
t('every note of the plan has its English', () => inEn(() => { const out = []; for (const w of PLAN) for (const e of w.ex) for (const x of [e.int, e.suf]) if (x && HEB.test(L('planNote')(x))) out.push(x); return out; }), []);
t('a workout is named in the language of the page', () => [G.wkFull(1), L('wkShort')(1), inEn(() => G.wkFull(1)), inEn(() => L('wkShort')(3))], ['אימון 2', 'אימון 2', 'Workout 2', 'Workout 4']);
t('every haircut and every world of the journey has its English name', () => { const lit = (file, name) => { const t = fs.readFileSync(path.join(src, file), 'utf8'), m = t.match(new RegExp('\\nconst ' + name + ' = (\\[.*\\]);')); return m ? vm.runInNewContext(m[1]) : null; }, he = lit('avatar.js', 'HAIR'), en = lit('avatar.js', 'HAIR_EN'), wd = lit('me.js', 'WORLDS'); return [!!he && !!en && he.length === en.length && en.every((x) => x && !HEB.test(x)), !!wd && wd.length === 4 && wd.every((w) => w.he && w.en && !HEB.test(w.en))]; }, [true, true]);
t('ranks, rewards and achievements have English names', () => inEn(() => G.RANKS.concat(G.REWARDS, G.BADGES).map((x) => L('nm')(x)).filter((x) => !x || HEB.test(x))), []);
/* ---- the body log */
t('the body log keeps one entry for a day, in the order of the days, with only numbers that make sense', () => G.cleanBody({ h: 178.4, log: [{ d: '2026-11-15', kg: 72.44 }, { d: '2026-11-10', kg: 73, fat: 14.26, waist: 82, n: '  אחרי ארוחה  ' }, { d: '2026-11-15', kg: 99 }, { d: 'nope', kg: 70 }, { d: '2026-11-12', kg: 5 }, { d: '2026-11-13', kg: 71, fat: 99, waist: 2 }, null] }), { h: 178, log: [{ d: '2026-11-10', kg: 73, fat: 14.3, waist: 82, n: 'אחרי ארוחה' }, { d: '2026-11-13', kg: 71 }, { d: '2026-11-15', kg: 72.4 }] });
t('a body log from nothing is empty', () => [G.cleanBody(null), G.cleanBody({ h: 30, log: 'x' })], [{ h: null, log: [] }, { h: null, log: [] }]);
t('a day that is written again takes the place of the old one, and a day can be taken out', () => { const a = G.bodyPut(G.cleanBody(null), { d: '2026-11-14', kg: 72 }), b = G.bodyPut(a, { d: '2026-11-14', kg: 71.5, fat: 15 }), c = G.bodyPut(b, { d: '2026-11-12', kg: 73 }); return [b.log, c.log.map((r) => r.d), G.bodyDrop(c, '2026-11-14').log.map((r) => r.d), G.bodyPut(a, { d: '2026-11-15', kg: 900 }).log.length]; }, [[{ d: '2026-11-14', kg: 71.5, fat: 15 }], ['2026-11-12', '2026-11-14'], ['2026-11-12'], 1]);
t('where the weight stands: the last entry, the step from the one before, and the change over a month', () => { const B = G.cleanBody({ log: [{ d: '2026-09-01', kg: 80 }, { d: '2026-10-20', kg: 76 }, { d: '2026-11-10', kg: 74.6 }, { d: '2026-11-15', kg: 74.2 }] }), T = G.bodyTrend(B); return [T.last.kg, T.step, T.month, G.bodyTrend(G.cleanBody(null)), G.bodyTrend(G.cleanBody({ log: [{ d: '2026-11-15', kg: 70 }] })).month]; }, [74.2, -0.4, -1.8, null, null]);
t('the rank of a level carries both names', () => [L('nm')(G.rankOf(12)), inEn(() => L('nm')(G.rankOf(12)))], ['לוחם', 'Warrior']);
t('a count takes the singular for one', () => [L("cnt(1, 'סטים', 'סט אחד', 'sets', 'set')"), L("cnt(3, 'סטים', 'סט אחד', 'sets', 'set')"), inEn(() => L("cnt(1, 'סטים', 'סט אחד', 'sets', 'set')")), inEn(() => L("cnt(3, 'סטים', 'סט אחד', 'sets', 'set')"))], ['סט אחד', '3 סטים', '1 set', '3 sets']);
t('"from, to" points the way the page is read', () => [L('arrow')(), inEn(() => L('arrow')())], [' ← ', ' → ']);

// ---- a guard: in the files that draw the screens, every Hebrew text sits inside say(...) or cnt(...), so that it has an English twin.
// The few texts that are Hebrew on purpose are listed here.
(() => {
  const KEEP = { 'chat.js': ['מתאים', 'מתאים חלקית'], 'avatar.js': ['קרחת', 'קצר', 'מורם', 'מתולתל', 'ארוך', 'פוני', 'קצוץ', 'שביל בצד', 'בינוני', 'קוקו', 'פקעת', 'צמות', 'קארה', 'אפרו', 'מוהוק', 'קוקיות', 'בלי', 'זיפים', 'זקן מלא'], 'me.js': ['הצעדים הראשונים', 'בונים כוח', 'דרגות האלופים', 'אל הפסגה'] };
  const spans = (s, re, firstArgOnly) => { const out = []; let m; while ((m = re.exec(s))) { let i = re.lastIndex, depth = 0, q = null; const a = i; for (; i < s.length; i++) { const c = s[i]; if (q) { if (c === '\\') i++; else if (c === q) q = null; } else if (c === "'" || c === '"' || c === '`') q = c; else if ('([{'.includes(c)) depth++; else if (')]}'.includes(c)) { if (!depth) break; depth--; } else if (c === ',' && !depth && firstArgOnly) break; } out.push([a, i]); } return out; };
  const open = [];
  for (const file of ['app.js', 'coach.js', 'me.js', 'chat.js', 'store.js', 'stage.js', 'onboard.js', 'boot.js', 'moves.js', 'avatar.js', 'prog.js', 'rig.js']) {
    let s; try { s = fs.readFileSync(path.join(src, file), 'utf8'); } catch (e) { continue; }
    /* the Hebrew rules of the coach are one Hebrew text on purpose */
    if (file === 'chat.js') { const a = s.indexOf('const rulesHe ='), b = s.indexOf('const rulesEn ='); if (a >= 0 && b > a) s = s.slice(0, a) + s.slice(b); }
    const done = spans(s, /\bsay\(/g, true).concat(spans(s, /\bcnt\(/g, false)), re = /'((?:[^'\\\n]|\\.)*)'/g; let m;
    while ((m = re.exec(s))) { if (!HEB.test(m[1]) || (KEEP[file] || []).includes(m[1]) || done.some((d) => d[0] <= m.index && m.index < d[1])) continue; open.push(file + ': ' + m[1].slice(0, 50)); }
  }
  t('no Hebrew text in the screens is left without an English twin', () => open, []);
  /* and no English side that still holds Hebrew letters */
  const mixed = [];
  for (const file of fs.readdirSync(src).filter((x) => x.endsWith('.js'))) { const s = fs.readFileSync(path.join(src, file), 'utf8'), re = /\bsay\('((?:[^'\\\n]|\\.)*)',\s*'((?:[^'\\\n]|\\.)*)'\)/g; let m; while ((m = re.exec(s))) if (HEB.test(m[2]) || !m[2].trim() !== !m[1].trim()) mixed.push(file + ': ' + m[0].slice(0, 70)); }
  t('the English side of a text holds no Hebrew letters', () => mixed, []);
})();

// ---- the library holds together: nothing a screen looks up can be missing
t('every movement has what the screens look up', () => {
  const out = [], KIND = L('RX_KIND');
  for (const k of Object.keys(LIB)) {
    const M = LIB[k];
    if (!EN[k]) out.push(k + ': no English name'); if (!M.he) out.push(k + ': no Hebrew name');
    if (!MUSCLE[M.p]) out.push(k + ': muscle'); for (const s of M.s || []) if (!MUSCLE[s]) out.push(k + ': helper ' + s);
    if (!EQUIP[M.eq]) out.push(k + ': equipment'); if (!KIND[M.pat]) out.push(k + ': no prescription for the pattern ' + M.pat);
    if (!M.m || !Array.isArray(M.c) || M.c.length !== 3) out.push(k + ': muscle line or cues');
    if (M.an && !LIB[M.an] && !/^[a-zA-Z]+$/.test(M.an)) out.push(k + ': stand-in animation');
    const rx = G.rxOf(k); if (!(rx.sets >= 1) || !/^\d+–\d+$/.test(rx.reps) || rx.rest.length !== 2) out.push(k + ': prescription');
  }
  for (const w of PLAN) for (const e of w.ex) { if (!LIB[e.a]) out.push(e.id + ': movement'); if (!(e.sets >= 1 && e.sets <= 8)) out.push(e.id + ': sets'); if (!/^\d+(–\d+)?$/.test(e.reps)) out.push(e.id + ': reps'); }
  const ids = PLAN.flatMap((w) => w.ex.map((e) => e.id)); if (new Set(ids).size !== ids.length) out.push('a slot id is used twice');
  return out;
}, []);

// ---- every demo draws: each movement paints a frame at several points of the motion, as the big demo and as a small picture
t('every movement draws its demo without an error', () => {
  const ctx = vm.createContext({ console });
  vm.runInContext(['plan.js', 'lib.js', 'prog.js', 'rig.js', 'moves.js'].map((f) => fs.readFileSync(path.join(src, f), 'utf8')).join('\n') + '\n;globalThis.D = { ANIM, LIB, animOf, renderAnim };', ctx);
  const D = ctx.D, out = [], calls = { n: 0 }, grad = { addColorStop() {} };
  const g = new Proxy({}, { get: (o, k) => (k in o ? o[k] : /Gradient$|^createPattern$/.test(String(k)) ? () => grad : k === 'measureText' ? () => ({ width: 10 }) : () => { calls.n++; }), set: (o, k, v) => { o[k] = v; return true; } });
  const C = new Proxy({ fx: 1, _fig: [128, 128, 128], _hi: [160, 160, 160], _lo: [96, 96, 96] }, { get: (o, k) => (k in o ? o[k] : '#808080') });
  for (const k of Object.keys(D.LIB)) if (!D.ANIM[D.animOf(k)]) out.push(k + ': no demo');
  for (const k of Object.keys(D.ANIM)) for (const thumb of [false, true]) for (const at of [0, 0.25, 0.5, 1]) {
    const before = calls.n; C.fx = thumb ? 0 : 1;
    try { D.renderAnim(g, k, at, C, thumb); } catch (e) { out.push(k + (thumb ? ' (small)' : '') + ' at ' + at + ': ' + e.message); break; }
    if (calls.n - before < 20) out.push(k + (thumb ? ' (small)' : '') + ' at ' + at + ': drew almost nothing');
  }
  return out;
}, []);

console.log('UNIT PASS ' + pass + ' FAIL ' + bad.length + (bad.length ? '\n  ' + bad.join('\n  ') : ''));
process.exit(bad.length ? 1 : 0);
