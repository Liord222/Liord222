/* ================================================================== the game layer (pure functions, no page state)
   Every logged set earns points, a personal best earns more, and finishing a workout adds a bonus. Points add up to
   levels; levels carry a rank and open gear for the player's character. Everything is counted from the workout log,
   so a restored backup or a second device shows the same level. */
const XP = { set: 10, pr: 30, done: 100 };
/* what one workout is worth: sets, personal bests, kilograms moved and the points for them */
/* an assisted movement's weight is help, not load: it is no kilogram lifted (less help would count as less work) */
function helpOf(s, id) {
  const pe = typeof SLOT !== 'undefined' ? SLOT[id] : null, mv = (s && s.mv && s.mv[id]) || (pe ? pe.a : null);
  return isMv(mv) && !!LIB[mv].inv;
}
function tally(s) {
  let sets = 0, prs = 0, kg = 0;
  for (const [id, a] of Object.entries((s && s.sets) || {})) {
    const help = helpOf(s, id);
    for (const r of a || []) {
      if (!r || !r.done) continue;
      sets++; if (r.pr) prs++;
      if (!help && r.kg != null && r.reps != null) kg += r.kg * r.reps;
    }
  }
  return { sets, prs, kg: Math.round(kg), xp: sets * XP.set + prs * XP.pr + (sets && s.end ? XP.done : 0) };
}
/* points needed to leave a level: 200 for the first, 40 more for each one after it. The first week of the plan is a level per workout */
const xpStep = (lvl) => 200 + 40 * (lvl - 1);
/* the points to reach level n+1 add up to 20n² + 180n, so the level comes straight from the points, without counting up one level at a time */
const xpTo = (n) => 20 * n * n + 180 * n;
function levelOf(xp) {
  const t = xp > 0 && isFinite(xp) ? Math.floor(xp) : 0;
  let n = Math.max(0, Math.floor((Math.sqrt(32400 + 80 * t) - 180) / 40));
  for (let i = 0; i < 3 && n > 0 && xpTo(n) > t; i++) n--;
  for (let i = 0; i < 3 && xpTo(n + 1) <= t; i++) n++;
  return { lvl: n + 1, into: t - xpTo(n), need: xpStep(n + 1) };
}
const RANKS = [{ at: 1, he: 'טירון', en: 'Rookie' }, { at: 5, he: 'מתמיד', en: 'Regular' }, { at: 10, he: 'ספורטאי', en: 'Athlete' }, { at: 15, he: 'מכונה', en: 'Machine' }, { at: 20, he: 'חיה', en: 'Beast' }, { at: 30, he: 'אלוף', en: 'Champion' }, { at: 40, he: 'אגדה', en: 'Legend' }, { at: 50, he: 'טיטאן', en: 'Titan' }, { at: 75, he: 'אולימפי', en: 'Olympian' }, { at: 100, he: 'אגדה חיה', en: 'Living legend' }];
function rankOf(lvl) { let i = 0; while (i + 1 < RANKS.length && RANKS[i + 1].at <= lvl) i++; return { i, at: RANKS[i].at, he: RANKS[i].he, en: RANKS[i].en }; }
/* the name of a rank, a reward or an achievement in the language of the page */
const nm = (x) => say(x.he, x.en || x.he);
/* what a level opens: a new rank, or gear the character wears from then on (k names the gear) */
const REWARDS = [
  { at: 3, k: 'band', he: 'סרט ראש', en: 'Headband' }, { at: 5, he: 'דרגת מתמיד', en: 'Regular rank' }, { at: 8, k: 'wraps', he: 'רצועות יד', en: 'Wrist wraps' }, { at: 10, he: 'דרגת ספורטאי', en: 'Athlete rank' },
  { at: 12, k: 'belt', he: 'חגורת הרמה', en: 'Lifting belt' }, { at: 15, he: 'דרגת מכונה', en: 'Machine rank' }, { at: 20, k: 'tank', he: 'דרגת חיה וגופייה', en: 'Beast rank and a tank top' },
  { at: 30, k: 'medal', he: 'דרגת אלוף ומדליה', en: 'Champion rank and a medal' }, { at: 40, k: 'crown', he: 'דרגת אגדה וכתר', en: 'Legend rank and a crown' },
  /* past the crown the road goes on to the hundredth level: the gear of a champion, and at the end the stars of a legend */
  { at: 50, k: 'cape', he: 'דרגת טיטאן וגלימה', en: 'Titan rank and a cape' }, { at: 60, k: 'kicks', he: 'נעלי זהב', en: 'Gold shoes' }, { at: 75, k: 'champ', he: 'דרגת אולימפי וחגורת אליפות', en: 'Olympian rank and a title belt' },
  { at: 90, k: 'glow', he: 'הילת זהב', en: 'A golden glow' }, { at: 100, k: 'stars', he: 'דרגת אגדה חיה', en: 'Living legend rank' },
];
const nextReward = (lvl) => REWARDS.find((r) => r.at > lvl) || null;
const rewardsBetween = (a, b) => REWARDS.filter((r) => r.at > a && r.at <= b);
/* ---- the kiosk: what the character can wear beyond what the levels open. Every ten points earned are a coin, and coins buy.
   slot: one thing of a slot is worn at a time. The level and its points are never spent: the coins are counted beside them */
const SHOP = [
  { id: 'towel', slot: 'neck', cost: 30, he: 'מגבת', en: 'Towel' }, { id: 'kicksW', slot: 'feet', cost: 50, he: 'נעליים לבנות', en: 'White sneakers' }, { id: 'cap', slot: 'head', cost: 60, he: 'כובע מצחייה', en: 'Cap' },
  { id: 'gloves', slot: 'hands', cost: 70, he: 'כפפות אימון', en: 'Training gloves' }, { id: 'shades', slot: 'eyes', cost: 90, he: 'משקפי שמש', en: 'Sunglasses' }, { id: 'watch', slot: 'wrist', cost: 110, he: 'שעון ספורט', en: 'Sports watch' },
  { id: 'kicksP', slot: 'feet', cost: 120, he: 'נעליים סגולות', en: 'Purple sneakers' }, { id: 'phones', slot: 'ears', cost: 150, he: 'אוזניות', en: 'Headphones' }, { id: 'chain', slot: 'neck', cost: 200, he: 'שרשרת זהב', en: 'Gold chain' },
];
const shopItem = (id) => SHOP.find((x) => x.id === id) || null;
const coinsOf = (xp) => Math.floor((xp > 0 && isFinite(xp) ? xp : 0) / 10);
/* a wardrobe read from a file or from the account: only things the kiosk sells, each owned once, and of the worn ones one to a slot */
function cleanShop(v) {
  const ok = (a) => (Array.isArray(a) ? a.filter((id, i) => !!shopItem(id) && a.indexOf(id) === i) : []);
  const own = ok(v && v.own), slots = {};
  return { own, on: ok(v && v.on).filter((id) => { const s = shopItem(id).slot; if (!own.includes(id) || slots[s]) return false; slots[s] = 1; return true; }) };
}
const spentOf = (shop) => shop.own.reduce((n, id) => n + shopItem(id).cost, 0);
/* what is left to spend: never under zero, even when a deleted workout took points away after they were spent */
const coinsLeft = (xp, shop) => Math.max(0, coinsOf(xp) - spentOf(shop));
/* putting a thing on takes off what was worn in its slot; null when it is not owned */
function shopWear(shop, id, on) {
  const it = shopItem(id); if (!it || !shop.own.includes(id)) return null;
  const rest = shop.on.filter((k) => k !== id && shopItem(k).slot !== it.slot);
  return { own: shop.own.slice(), on: on ? rest.concat(id) : rest };
}
/* buying: the coins must be there and the thing not owned yet. It is put on at once. null when it cannot be bought */
function shopBuy(shop, id, xp) {
  const it = shopItem(id); if (!it || shop.own.includes(id) || coinsLeft(xp, shop) < it.cost) return null;
  return shopWear({ own: shop.own.concat(id), on: shop.on }, id, true);
}
/* how muscular the character is drawn: 0 at level 1, fully built at level 30 */
const buildOf = (lvl) => Math.max(0, Math.min(1, (lvl - 1) / 29));
/* calendar week of a moment, in the device's own time; weeks start on Sunday */
function weekIdx(ts) { const d = new Date(ts); return Math.floor((Math.floor((ts - d.getTimezoneOffset() * 60000) / 864e5) + 4) / 7); }

/* The device keeps only the latest workouts, so the profile cannot be recounted from the log forever. Older workouts are
   folded into an archive: their totals up to the moment `until`, and the run of consecutive weeks (sw) ending in week lw. */
const archZero = () => ({ until: 0, xp: 0, wk: 0, sets: 0, prs: 0, kg: 0, sw: 0, lw: 0 });
function totalsOf(list, arch) {
  const t = { xp: arch.xp, wk: arch.wk, sets: arch.sets, prs: arch.prs, kg: arch.kg };
  for (const s of list) {
    if (s.ts <= arch.until) continue;
    const y = tally(s); if (!y.sets) continue;
    t.xp += y.xp; t.sets += y.sets; t.prs += y.prs; t.kg += y.kg; if (s.end) t.wk++;
  }
  return t;
}
/* fold finished workouts beyond the newest `keep` into the archive. Returns the new archive, or null when there is nothing to fold */
function archiveStep(list, arch, keep) {
  const open = list.filter((s) => !s.end && s.ts > arch.until).reduce((m, s) => Math.min(m, s.ts), Infinity);
  const fin = list.filter((s) => s.end && s.ts > arch.until).sort((a, b) => b.ts - a.ts);
  let old = fin.slice(keep).filter((s) => s.ts < open);
  /* the archive ends at a moment: a kept workout that starts at that very moment would be left out of every total, so it goes in with the rest */
  if (old.length) { const top = old[0].ts; old = fin.filter((s) => s.ts <= top && s.ts < open); }
  old.reverse();
  if (!old.length) return null;
  const a = Object.assign({}, arch);
  for (const s of old) {
    const y = tally(s), w = weekIdx(s.ts);
    a.until = s.ts;
    if (!y.sets) continue;
    a.xp += y.xp; a.wk++; a.sets += y.sets; a.prs += y.prs; a.kg += y.kg;
    if (!a.sw || w > a.lw + 1) a.sw = 1; else if (w === a.lw + 1) a.sw++;
    a.lw = w;
  }
  return a;
}
/* weeks in a row with at least one finished workout. The current week counts once it has one; until then the run stands on last week */
function streakOf(list, arch, now) {
  const weeks = new Set(list.filter((s) => s.end && s.ts > arch.until && tally(s).sets).map((s) => weekIdx(s.ts)));
  if (arch.sw) weeks.add(arch.lw);
  const cur = weekIdx(now);
  let w = weeks.has(cur) ? cur : cur - 1, n = 0;
  while (weeks.has(w)) { n++; if (arch.sw && w === arch.lw) return n + arch.sw - 1; w--; }
  return n;
}
/* all four workouts of one week of a round were finished */
function fullWeek(list) {
  const seen = {};
  for (const s of list) if (s.end && s.m && s.wk) (seen[s.m + '/' + s.wk] || (seen[s.m + '/' + s.wk] = new Set())).add(s.w);
  return Object.values(seen).some((x) => x.size >= 4);
}
/* rounds whose easy last week was finished in all four workouts */
function roundsDone(list) {
  const seen = {};
  for (const s of list) if (s.end && s.m && s.dl) (seen[s.m] || (seen[s.m] = new Set())).add(s.w);
  return Object.values(seen).filter((x) => x.size >= 4).length;
}
/* achievements. T: the totals, X: { lvl, streak, fullWeek, rounds }. ic names the drawing in the profile */
const BADGES = [
  { id: 'first', he: 'אימון ראשון', en: 'First workout', ic: 'flag', ok: (T) => T.wk >= 1 },
  { id: 'week', he: 'שבוע מלא', en: 'Full week', ic: 'cal', ok: (T, X) => !!X.fullWeek },
  { id: 'pr1', he: 'שיא ראשון', en: 'First PR', ic: 'bolt', ok: (T) => T.prs >= 1 },
  { id: 'w10', he: '10 אימונים', en: '10 workouts', ic: 'bell', ok: (T) => T.wk >= 10 },
  { id: 'streak4', he: '4 שבועות ברצף', en: '4 weeks in a row', ic: 'flame', ok: (T, X) => X.streak >= 4 },
  { id: 'pr25', he: '25 שיאים', en: '25 PRs', ic: 'bolt2', ok: (T) => T.prs >= 25 },
  { id: 'w25', he: '25 אימונים', en: '25 workouts', ic: 'bell2', ok: (T) => T.wk >= 25 },
  { id: 'round', he: 'סבב שלם', en: 'Full round', ic: 'loop', ok: (T, X) => X.rounds >= 1 },
  { id: 'ton100', he: '100 טון', en: '100 tons', ic: 'plate', ok: (T) => T.kg >= 100000 },
  { id: 'w50', he: '50 אימונים', en: '50 workouts', ic: 'cup', ok: (T) => T.wk >= 50 },
  { id: 'lvl20', he: 'רמה 20', en: 'Level 20', ic: 'star', ok: (T, X) => X.lvl >= 20 },
  { id: 'w100', he: '100 אימונים', en: '100 workouts', ic: 'crown', ok: (T) => T.wk >= 100 },
];
const earned = (T, X) => BADGES.filter((b) => b.ok(T, X)).map((b) => b.id);
