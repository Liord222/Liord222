/* ================================================================== the game layer (pure functions, no page state)
   Every logged set earns points, a personal best earns more, and finishing a workout adds a bonus. Points add up to
   levels; levels carry a rank and open gear for the player's character. Everything is counted from the workout log,
   so a restored backup or a second device shows the same level. */
const XP = { set: 100, pr: 300, done: 1000 };
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
/* points needed to leave a level: 2,000 for the first, 400 more for each one after it. The first week of the plan is a level per workout */
const xpStep = (lvl) => 2000 + 400 * (lvl - 1);
/* the points to reach level n+1 add up to 200n² + 1800n, so the level comes straight from the points, without counting up one level at a time */
const xpTo = (n) => 200 * n * n + 1800 * n;
function levelOf(xp) {
  const t = xp > 0 && isFinite(xp) ? Math.floor(xp) : 0;
  let n = Math.max(0, Math.floor((Math.sqrt(32400 + 8 * t) - 180) / 40));
  for (let i = 0; i < 3 && n > 0 && xpTo(n) > t; i++) n--;
  for (let i = 0; i < 3 && xpTo(n + 1) <= t; i++) n++;
  return { lvl: n + 1, into: t - xpTo(n), need: xpStep(n + 1) };
}
const RANKS = [{ at: 1, he: 'טירון', en: 'Rookie' }, { at: 10, he: 'לוחם', en: 'Warrior' }, { at: 20, he: 'חיה', en: 'Beast' }, { at: 40, he: 'מכונה', en: 'Machine' }, { at: 70, he: 'אגדה', en: 'Legend' }, { at: 100, he: 'טיטאן', en: 'Titan' }];
/* the badge of a rank, richer at every rank: a shield on a belt with a stripe for each step. Bronze; silver with wings; gold with
   spikes; diamond; amethyst in purple flames; and the titan, red and gold in fire under a crown. Thick dark outlines, like the boxes */
const MEDAL_C = [['#E39A55', '#9A5420', '#FFC48C'], ['#CBD3E2', '#6B7487', '#F4F7FC'], ['#FFC83D', '#A86A07', '#FFE79A'], ['#6FD8FF', '#1F7FB0', '#D2F5FF'], ['#B97BFF', '#5A1FA8', '#E4CCFF'], ['#FF5A3C', '#8F1D10', '#FFD27A']];
function medalSVG(i) {
  i = Math.max(0, Math.min(5, i | 0));
  const c = MEDAL_C[i], O = '#1B1035', ol = ' stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
  const fire = (a, b) => '<path d="M32 2Q37 9 41 6Q41 13 47 13Q45 19 52 22L12 22Q19 19 17 13Q23 13 23 6Q27 9 32 2Z" fill="' + a + '"' + ol + '/><path d="M32 9Q35 13 38 12Q37 17 42 19H22Q27 17 26 12Q29 13 32 9Z" fill="' + b + '"/>';
  const wing = (k) => '<path transform="translate(32 0) scale(' + k + ' 1) translate(-32 0)" d="M14 22Q4 20 2 28Q6 28 7 31Q3 33 4 38Q9 36 11 38L14 36Z" fill="' + c[2] + '"' + ol + '/>';
  let chev = ''; const n = Math.min(3, i + 1);
  for (let k = 0; k < n; k++) { const y = 41 - k * 6.5 + (n - 1) * 3; chev += '<path d="M23.5 ' + (y - 4) + 'L32 ' + y + 'L40.5 ' + (y - 4) + '" stroke="' + O + '" stroke-width="5.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M23.5 ' + (y - 4) + 'L32 ' + y + 'L40.5 ' + (y - 4) + '" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; }
  const star = i >= 3 ? '<path d="' + 'M32 16.5L33.8 20.6L38.2 21L34.9 23.9L35.9 28.3L32 26L28.1 28.3L29.1 23.9L25.8 21L30.2 20.6Z' + '" fill="#fff"' + ol + ' stroke-width="1.8"/>' : '';
  return '<svg class="medal m' + i + '" viewBox="0 0 64 64" aria-hidden="true">' +
    (i >= 4 ? fire(i === 5 ? '#FF7A1A' : '#9B4DFF', i === 5 ? '#FFD23F' : '#E2C2FF') : '') +
    (i >= 1 ? wing(1) + wing(-1) : '') +
    '<rect x="5" y="29" width="54" height="14" rx="6" fill="' + c[1] + '"' + ol + '/>' +
    (i >= 2 ? '<path d="M18 16L20.5 6L25.5 13ZM46 16L43.5 6L38.5 13ZM28.5 11L32 1.5L35.5 11Z" fill="' + c[0] + '"' + ol + ' stroke-width="2.2"/>' : '') +
    '<path d="M32 9L50 15.5V31Q50 47.5 32 58Q14 47.5 14 31V15.5Z" fill="' + c[0] + '"' + ol + '/>' +
    '<path d="M32 14.5L45.5 19.5V31Q45.5 44 32 52.5Q18.5 44 18.5 31V19.5Z" fill="' + c[1] + '" opacity=".35"/>' +
    '<path d="M19 21L32 16" stroke="' + c[2] + '" stroke-width="2.6" stroke-linecap="round"/>' +
    (i === 3 ? '<path d="M32 9L50 15.5L32 30ZM14 31Q14 47.5 32 58L32 30Z" fill="#fff" opacity=".28"/>' : '') +
    (i === 5 ? '<path d="M21 11L23 3L28 8L32 1L36 8L41 3L43 11Z" fill="#FFD23F"' + ol + ' stroke-width="2"/>' : '') +
    chev + star + '</svg>';
}
function rankOf(lvl) { let i = 0; while (i + 1 < RANKS.length && RANKS[i + 1].at <= lvl) i++; return { i, at: RANKS[i].at, he: RANKS[i].he, en: RANKS[i].en }; }
/* the name of a rank, a reward or an achievement in the language of the page */
const nm = (x) => say(x.he, x.en || x.he);
/* the gear a level opens: the character wears it from then on (k names the gear) */
const REWARDS = [
  { at: 3, k: 'band', he: 'סרט ראש', en: 'Headband' }, { at: 8, k: 'wraps', he: 'רצועות יד', en: 'Wrist wraps' }, { at: 12, k: 'belt', he: 'חגורת הרמה', en: 'Lifting belt' },
  { at: 20, k: 'tank', he: 'גופייה', en: 'Tank top' }, { at: 30, k: 'medal', he: 'מדליה', en: 'A medal' }, { at: 40, k: 'crown', he: 'כתר', en: 'A crown' },
  { at: 50, k: 'cape', he: 'גלימה', en: 'A cape' }, { at: 60, k: 'kicks', he: 'נעלי זהב', en: 'Gold shoes' }, { at: 70, k: 'champ', he: 'חגורת אליפות', en: 'A title belt' },
  { at: 90, k: 'glow', he: 'הילת זהב', en: 'A golden glow' }, { at: 100, k: 'stars', he: 'כוכבי טיטאן', en: 'Titan stars' },
];
/* the stations of the road: every two or three levels something waits. A new rank (named by the rank alone), gear, or a box for the
   collection: the further along the road, the rarer the box. rank: its index or -1 · gear: the gear of that level, if any · box: how
   rare the box is, or -1 */
const RARE_HE = ['רגיל', 'נדיר', 'סופר נדיר', 'אפיק', 'מיתי', 'אגדי'], RARE_EN = ['Common', 'Rare', 'Super rare', 'Epic', 'Mythic', 'Legendary'];
const boxAt = (lvl) => (lvl < 12 ? 0 : lvl < 25 ? 1 : lvl < 45 ? 2 : lvl < 65 ? 3 : lvl < 90 ? 4 : 5);
const STATIONS = [];
for (let l = 2; l <= 100; l++) {
  const rank = RANKS.findIndex((r) => r.at === l), gear = REWARDS.find((r) => r.at === l) || null;
  if (rank < 0 && !gear && l % 5 !== 0 && l % 5 !== 3) continue;
  const box = rank > 0 || gear ? -1 : boxAt(l), of = rank > 0 ? RANKS[rank] : gear || { he: 'קופסת ' + RARE_HE[box], en: RARE_EN[box] + ' box' };
  STATIONS.push({ at: l, rank: rank > 0 ? rank : -1, gear, box, k: gear ? gear.k : undefined, he: of.he, en: of.en });
}
const nextReward = (lvl) => STATIONS.find((r) => r.at > lvl) || null;
const rewardsBetween = (a, b) => STATIONS.filter((r) => r.at > a && r.at <= b);
/* ---- the kiosk and the collection. What the character wears beyond what the levels open comes out of boxes: a box holds one
   thing of its kind, and never one that is owned already. Every hundred points earned are a coin, and coins buy boxes. The level
   and its points are never spent: the coins are counted beside them.
   A thing: id, slot (one thing of a slot is worn at a time), m (the model it is drawn by, see avatar.js), c (its colours),
   r (how rare it is, 0 to 5), n (what a model writes or draws on it) */
const RARE = [
  { he: RARE_HE[0], en: RARE_EN[0], c: '#8A90A0' }, { he: RARE_HE[1], en: RARE_EN[1], c: '#27A35A' }, { he: RARE_HE[2], en: RARE_EN[2], c: '#2B78F0' },
  { he: RARE_HE[3], en: RARE_EN[3], c: '#8B4DF0' }, { he: RARE_HE[4], en: RARE_EN[4], c: '#E0364B' }, { he: RARE_HE[5], en: RARE_EN[5], c: '#E8A317' },
];
/* a thing that was sold for one week only carries its own tag */
const LIMITED = { he: 'מהדורה שבועית', en: 'Weekly edition', c: '#0FA89A' };
/* the boxes: one for each rarity. A box gives a thing of its own rarity, and now and then a rarer one (odds: out of 1,000, by
   rarity). The rarer the box, the more coins it costs: a workout earns about 30 coins */
const BOX_ODDS = [[780, 180, 40, 0, 0, 0], [0, 750, 200, 50, 0, 0], [0, 0, 750, 200, 50, 0], [0, 0, 0, 800, 170, 30], [0, 0, 0, 0, 850, 150], [0, 0, 0, 0, 0, 1000]];
const BOXES = RARE.map((r, i) => ({ he: 'קופסת ' + r.he, en: r.en + ' box', c: r.c, cost: [40, 80, 150, 300, 600, 1200][i], odds: BOX_ODDS[i] }));
const WEEK_COST = 200, SHIELD_COST = 300, SHIELD_TOP = 1;
const SHOP = [];
const stock = (slot, rows) => { for (const x of rows) SHOP.push({ id: x[0], slot, m: x[1], c: x[2], r: x[3], he: x[4], en: x[5], n: x[6] }); };
stock('head', [
  ['cap', 'cap', ['#5229C4', '#3B1E96'], 0, 'כובע מצחייה סגול', 'Purple cap'], ['capR', 'cap', ['#D7263D', '#9E1328'], 0, 'כובע מצחייה אדום', 'Red cap'], ['capK', 'cap', ['#2A2933', '#121117'], 0, 'כובע מצחייה שחור', 'Black cap'],
  ['capW', 'cap', ['#F4F4F6', '#C9CED8'], 0, 'כובע מצחייה לבן', 'White cap'], ['capB', 'cap', ['#2F6FE0', '#1E4BA8'], 0, 'כובע מצחייה כחול', 'Blue cap'], ['capG', 'cap', ['#2FA36B', '#1F7A4D'], 0, 'כובע מצחייה ירוק', 'Green cap'],
  ['capY', 'cap', ['#F5C542', '#C9971C'], 1, 'כובע מצחייה צהוב', 'Yellow cap'], ['capP', 'cap', ['#F27BA5', '#C94F7C'], 1, 'כובע מצחייה ורוד', 'Pink cap'],
  ['snapK', 'snap', ['#22212A', '#D7263D', '#22212A'], 1, 'כובע שטוח שחור אדום', 'Black and red snapback'], ['snapW', 'snap', ['#F4F4F6', '#22212A', '#F4F4F6'], 1, 'כובע שטוח לבן', 'White snapback'],
  ['snapB', 'snap', ['#25315E', '#F5C542', '#2F6FE0'], 1, 'כובע שטוח כחול צהוב', 'Blue and yellow snapback'], ['snapP', 'snap', ['#6D3FE0', '#F2B93B', '#8B63F0'], 2, 'כובע שטוח סגול זהב', 'Purple and gold snapback'],
  ['snapG', 'snap', ['#5C6B3C', '#3E4A26', '#74854C'], 2, 'כובע שטוח צבאי', 'Army snapback'],
  ['beanie', 'beanie', ['#4A4857', '#3A3845', '#ECEBF0'], 0, 'כובע גרב אפור', 'Grey beanie'], ['beanieR', 'beanie', ['#D7263D', '#9E1328', '#F4F4F6'], 0, 'כובע גרב אדום', 'Red beanie'], ['beanieB', 'beanie', ['#2F6FE0', '#1E4BA8', null], 0, 'כובע גרב כחול', 'Blue beanie'],
  ['beanieK', 'beanie', ['#22212A', '#121117', null], 1, 'כובע גרב שחור', 'Black beanie'], ['beanieY', 'beanie', ['#E0A526', '#B57F12', '#FFF6DC'], 1, 'כובע גרב חרדל', 'Mustard beanie'],
  ['bucketS', 'bucket', ['#D9C6A0', '#C2AD82'], 1, 'כובע טמבל חול', 'Sand bucket hat'], ['bucketK', 'bucket', ['#22212A', '#121117'], 1, 'כובע טמבל שחור', 'Black bucket hat'],
  ['bucketB', 'bucket', ['#7FB8F0', '#5A97D6'], 2, 'כובע טמבל תכלת', 'Sky bucket hat'], ['bucketG', 'bucket', ['#5C6B3C', '#46532C'], 2, 'כובע טמבל זית', 'Olive bucket hat'],
  ['visorW', 'visor', ['#F4F4F6', '#D9DAE0'], 0, 'מצחיית שמש לבנה', 'White visor'], ['visorK', 'visor', ['#22212A', '#121117'], 1, 'מצחיית שמש שחורה', 'Black visor'], ['visorP', 'visor', ['#F27BA5', '#C94F7C'], 1, 'מצחיית שמש ורודה', 'Pink visor'],
  ['hbandR', 'band', ['#D7263D', '#FFFFFF'], 0, 'סרט זיעה אדום', 'Red headband'], ['hbandW', 'band', ['#F4F4F6', '#2F6FE0'], 0, 'סרט זיעה לבן', 'White headband'], ['hbandK', 'band', ['#22212A', '#F5C542'], 0, 'סרט זיעה שחור', 'Black headband'],
  ['hbandB', 'band', ['#2F6FE0', '#FFFFFF'], 1, 'סרט זיעה כחול', 'Blue headband'], ['bandanaR', 'bandana', ['#D7263D', '#FFFFFF'], 2, 'בנדנה אדומה', 'Red bandana'], ['bandanaK', 'bandana', ['#22212A', '#FFFFFF'], 2, 'בנדנה שחורה', 'Black bandana'],
  ['ears', 'ears', ['#22212A', '#F27BA5'], 2, 'אוזני חתול', 'Cat ears'], ['propeller', 'propeller', ['#D7263D', '#2F6FE0', '#F5C542'], 2, 'כובע פרופלור', 'Propeller cap'],
  ['cowboy', 'cowboy', ['#8A5A32', '#3E2A18'], 3, 'כובע בוקרים', 'Cowboy hat'], ['party', 'party', ['#F27BA5', '#FFFFFF', '#F5C542'], 3, 'כובע מסיבה', 'Party hat'], ['topK', 'top', ['#22212A', '#D7263D'], 3, 'מגבעת', 'Top hat'],
  ['wreath', 'wreath', ['#F2B93B', '#C98F1C'], 3, 'זר דפנה', 'Laurel wreath'], ['horns', 'horns', ['#D7263D', '#9E1328'], 4, 'קרניים אדומות', 'Red horns'], ['viking', 'viking', ['#B9BEC9', '#F1E6CF'], 4, 'קסדת ויקינג', 'Viking helmet'],
  ['halo', 'halo', ['#F2B93B', '#FFE9A6'], 5, 'הילה', 'Halo'],
]);
stock('eyes', [
  ['glasses', 'round', ['#2A2833', null], 0, 'משקפיים עגולים שחורים', 'Black round glasses'], ['roundG', 'round', ['#C98F1C', null], 0, 'משקפיים עגולים זהובים', 'Gold round glasses'], ['roundR', 'round', ['#D7263D', null], 0, 'משקפיים עגולים אדומים', 'Red round glasses'],
  ['roundB', 'round', ['#2F6FE0', null], 0, 'משקפיים עגולים כחולים', 'Blue round glasses'], ['roundT', 'round', ['#C94F7C', '#F27BA5'], 1, 'משקפיים עגולים ורודים', 'Rose round glasses'],
  ['squareK', 'square', ['#22212A'], 0, 'משקפיים מרובעים שחורים', 'Black square glasses'], ['squareT', 'square', ['#7A5232'], 0, 'משקפיים מרובעים חומים', 'Brown square glasses'], ['squareW', 'square', ['#F4F4F6'], 0, 'משקפיים מרובעים לבנים', 'White square glasses'],
  ['squareP', 'square', ['#6D3FE0'], 1, 'משקפיים מרובעים סגולים', 'Purple square glasses'],
  ['shades', 'shades', ['#15131C', '#15131C'], 0, 'משקפי שמש שחורים', 'Black sunglasses'], ['shadesT', 'shades', ['#7A5232', '#3E2A18'], 0, 'משקפי שמש חומים', 'Brown sunglasses'], ['shadesW', 'shades', ['#F4F4F6', '#22212A'], 1, 'משקפי שמש לבנים', 'White sunglasses'],
  ['shadesR', 'shades', ['#D7263D', '#3A0D14'], 1, 'משקפי שמש אדומים', 'Red sunglasses'], ['shadesB', 'shades', ['#22212A', '#2F9BE0'], 1, 'משקפי שמש כחולים', 'Blue sunglasses'],
  ['aviG', 'aviator', ['#C98F1C', '#3E3423'], 1, 'משקפי טייסים זהובים', 'Gold aviators'], ['aviS', 'aviator', ['#8E95A3', '#2F6FA8'], 1, 'משקפי טייסים כסופים', 'Silver aviators'], ['aviK', 'aviator', ['#22212A', '#5B5E6B'], 2, 'משקפי טייסים שחורים', 'Black aviators'],
  ['sportO', 'sport', ['#22212A', '#F28A2E', '#FFE2B8'], 1, 'משקפי ספורט כתומים', 'Orange sport shades'], ['sportB', 'sport', ['#F4F4F6', '#2F9BE0', '#D6F0FF'], 2, 'משקפי ספורט כחולים', 'Blue sport shades'],
  ['sportG', 'sport', ['#22212A', '#2FA36B', '#C9F5DD'], 2, 'משקפי ספורט ירוקים', 'Green sport shades'], ['sportP', 'sport', ['#F4F4F6', '#8B4DF0', '#E6D6FF'], 2, 'משקפי ספורט סגולים', 'Purple sport shades'],
  ['threeD', 'threeD', ['#F4F4F6', '#E0364B', '#2F6FE0'], 2, 'משקפי תלת מימד', '3D glasses'], ['heartR', 'heart', ['#9E1328', '#E0364B'], 2, 'משקפי לבבות אדומים', 'Red heart glasses'], ['heartP', 'heart', ['#C94F7C', '#F27BA5'], 3, 'משקפי לבבות ורודים', 'Pink heart glasses'],
  ['starY', 'star', ['#C9971C', '#F5C542'], 3, 'משקפי כוכבים', 'Star glasses'], ['goggles', 'goggles', ['#22212A', '#F4F4F6', '#F28A2E'], 3, 'משקפי סקי', 'Ski goggles'], ['mono', 'mono', ['#C98F1C'], 3, 'מונוקל', 'Monocle'],
  ['pixel', 'pixel', ['#15131C', '#FFFFFF'], 4, 'משקפי פיקסלים', 'Pixel shades'], ['gogglesG', 'goggles', ['#F2B93B', '#22212A', '#8B4DF0'], 4, 'משקפי סקי מוזהבים', 'Golden ski goggles'], ['laser', 'laser', ['#15131C', '#FF3B4E'], 5, 'משקף לייזר', 'Laser visor'],
]);
stock('shirt', [
  ['teeSky', 'plain', ['#7FB8F0'], 0, 'חולצה תכלת', 'Sky blue shirt'], ['teeMint', 'plain', ['#7FD6B4'], 0, 'חולצה מנטה', 'Mint shirt'], ['teeCoral', 'plain', ['#F2836B'], 0, 'חולצה אלמוג', 'Coral shirt'],
  ['teeYel', 'plain', ['#F5C542'], 0, 'חולצה צהובה', 'Yellow shirt'], ['teePink', 'plain', ['#F27BA5'], 0, 'חולצה ורודה', 'Pink shirt'],
  ['strNavy', 'stripes', ['#F2F2F4', '#25315E'], 0, 'חולצת פסים כחולה', 'Navy striped shirt'], ['strRed', 'stripes', ['#F2F2F4', '#D7263D'], 0, 'חולצת פסים אדומה', 'Red striped shirt'], ['strBlk', 'stripes', ['#22212A', '#8E8C97'], 0, 'חולצת פסים שחורה', 'Black striped shirt'],
  ['strGrn', 'stripes', ['#F2F2F4', '#2FA36B'], 1, 'חולצת פסים ירוקה', 'Green striped shirt'], ['strPnk', 'stripes', ['#6D3FE0', '#F27BA5'], 1, 'חולצת פסים סגולה', 'Purple striped shirt'],
  ['chestR', 'chest', ['#22212A', '#D7263D', '#FFFFFF'], 0, 'חולצה שחורה עם פס אדום', 'Black shirt with a red band'], ['chestB', 'chest', ['#F2F2F4', '#2F6FE0', '#25315E'], 0, 'חולצה לבנה עם פס כחול', 'White shirt with a blue band'],
  ['chestY', 'chest', ['#25315E', '#F5C542', '#FFFFFF'], 1, 'חולצה כחולה עם פס צהוב', 'Navy shirt with a yellow band'],
  ['ringW', 'ringer', ['#F2F2F4', '#D7263D'], 0, 'חולצה לבנה עם שוליים אדומים', 'White shirt with red trim'], ['ringK', 'ringer', ['#22212A', '#F5C542'], 1, 'חולצה שחורה עם שוליים צהובים', 'Black shirt with yellow trim'],
  ['poloW', 'polo', ['#F2F2F4', '#25315E'], 1, 'חולצת פולו לבנה', 'White polo'], ['poloG', 'polo', ['#2FA36B', '#F2F2F4'], 1, 'חולצת פולו ירוקה', 'Green polo'],
  ['jer7', 'jersey', ['#D7263D', '#FFFFFF', '#FFFFFF'], 1, 'חולצת קבוצה אדומה 7', 'Red jersey 7', 7], ['jer10', 'jersey', ['#2F6FE0', '#F5C542', '#FFFFFF'], 1, 'חולצת קבוצה כחולה 10', 'Blue jersey 10', 10],
  ['jer1', 'jersey', ['#F2F2F4', '#22212A', '#22212A'], 1, 'חולצת קבוצה לבנה 1', 'White jersey 1', 1], ['jer23', 'jersey', ['#F5C542', '#6D3FE0', '#6D3FE0'], 2, 'חולצת קבוצה צהובה 23', 'Yellow jersey 23', 23],
  ['jer9', 'jersey', ['#22212A', '#F2B93B', '#F2B93B'], 2, 'חולצת קבוצה שחורה 9', 'Black jersey 9', 9],
  ['logoBolt', 'logo', ['#22212A', '#F5C542'], 1, 'חולצת ברק', 'Lightning shirt', 'bolt'], ['logoStar', 'logo', ['#25315E', '#FFFFFF'], 1, 'חולצת כוכב', 'Star shirt', 'star'], ['logoHeart', 'logo', ['#F2F2F4', '#E0364B'], 1, 'חולצת לב', 'Heart shirt', 'heart'],
  ['logoDumb', 'logo', ['#8E8C97', '#22212A'], 1, 'חולצת משקולת', 'Dumbbell shirt', 'dumb'], ['logoSmile', 'logo', ['#2F6FE0', '#F5C542'], 2, 'חולצת סמיילי', 'Smiley shirt', 'smile'], ['logoFlame', 'logo', ['#22212A', '#F28A2E'], 2, 'חולצת להבה', 'Flame shirt', 'flame'],
  ['logoSkull', 'logo', ['#22212A', '#F2F2F4'], 2, 'חולצת גולגולת', 'Skull shirt', 'skull'], ['logoCrown', 'logo', ['#6D3FE0', '#F2B93B'], 2, 'חולצת כתר', 'Crown shirt', 'crown'],
  ['halfRB', 'half', ['#D7263D', '#25315E'], 2, 'חולצה חצויה אדום כחול', 'Red and navy split shirt'], ['halfKW', 'half', ['#22212A', '#F2F2F4'], 2, 'חולצה חצויה שחור לבן', 'Black and white split shirt'],
  ['sash', 'sash', ['#F2F2F4', '#D7263D'], 2, 'חולצה עם פס אלכסוני', 'Sash shirt'], ['camoG', 'camo', ['#5C6B3C', '#3E4A26', '#8A9A5B'], 2, 'חולצת הסוואה ירוקה', 'Green camo shirt'], ['camoS', 'camo', ['#8E8C97', '#55535E', '#C9CED8'], 3, 'חולצת הסוואה אפורה', 'Grey camo shirt'],
  ['tiedye', 'tiedye', ['#F27BA5', '#F5C542', '#7FB8F0', '#8B4DF0'], 3, 'חולצת טאי דאי', 'Tie-dye shirt'], ['tux', 'tux', ['#22212A', '#F4F4F6', '#D7263D'], 3, 'חולצת טוקסידו', 'Tuxedo shirt'],
  ['galaxy', 'galaxy', ['#1B1440', '#8B4DF0', '#2F9BE0'], 4, 'חולצת גלקסיה', 'Galaxy shirt'], ['heroT', 'hero', ['#D7263D', '#F5C542', '#22212A'], 4, 'חולצת גיבור על', 'Superhero shirt'], ['goldT', 'gold', ['#F2B93B', '#FFE9A6', '#C98F1C'], 5, 'חולצת זהב', 'Gold shirt'],
]);
stock('feet', [
  ['kicksW', 'kicks', ['#F4F4F6', '#C9CED8'], 0, 'נעליים לבנות', 'White sneakers'], ['kicksK', 'kicks', ['#22212A', '#F4F4F6'], 0, 'נעליים שחורות', 'Black sneakers'], ['kicksR', 'kicks', ['#D7263D', '#F4F4F6'], 0, 'נעליים אדומות', 'Red sneakers'],
  ['kicksP', 'kicks', ['#6D3FE0', '#F4F4F6'], 0, 'נעליים סגולות', 'Purple sneakers'], ['kicksB', 'kicks', ['#2F6FE0', '#F4F4F6'], 0, 'נעליים כחולות', 'Blue sneakers'], ['kicksG', 'kicks', ['#2FA36B', '#F4F4F6'], 0, 'נעליים ירוקות', 'Green sneakers'],
  ['kicksGy', 'kicks', ['#8E8C97', '#22212A'], 0, 'נעליים אפורות', 'Grey sneakers'], ['kicksY', 'kicks', ['#F5C542', '#22212A'], 1, 'נעליים צהובות', 'Yellow sneakers'], ['kicksPk', 'kicks', ['#F27BA5', '#F4F4F6'], 1, 'נעליים ורודות', 'Pink sneakers'],
  ['kicksO', 'kicks', ['#F28A2E', '#F4F4F6'], 1, 'נעליים כתומות', 'Orange sneakers'],
  ['runW', 'runner', ['#F4F4F6', '#2F6FE0', '#2F6FE0'], 0, 'נעלי ריצה לבנות', 'White runners'], ['runK', 'runner', ['#22212A', '#F5C542', '#F5C542'], 1, 'נעלי ריצה שחורות', 'Black runners'], ['runR', 'runner', ['#D7263D', '#22212A', '#FFFFFF'], 1, 'נעלי ריצה אדומות', 'Red runners'],
  ['runB', 'runner', ['#2F6FE0', '#F4F4F6', '#F28A2E'], 1, 'נעלי ריצה כחולות', 'Blue runners'], ['runG', 'runner', ['#B6F03C', '#22212A', '#22212A'], 2, 'נעלי ריצה ניאון', 'Neon runners'], ['runP', 'runner', ['#8B4DF0', '#F27BA5', '#FFFFFF'], 2, 'נעלי ריצה סגולות', 'Purple runners'],
  ['highK', 'high', ['#22212A', '#F4F4F6', '#F4F4F6'], 1, 'נעליים גבוהות שחורות', 'Black high-tops'], ['highR', 'high', ['#D7263D', '#F4F4F6', '#F4F4F6'], 1, 'נעליים גבוהות אדומות', 'Red high-tops'], ['highW', 'high', ['#F4F4F6', '#C9CED8', '#D7263D'], 1, 'נעליים גבוהות לבנות', 'White high-tops'],
  ['highB', 'high', ['#25315E', '#F4F4F6', '#F5C542'], 2, 'נעליים גבוהות כחולות', 'Navy high-tops'], ['highP', 'high', ['#F27BA5', '#F4F4F6', '#8B4DF0'], 2, 'נעליים גבוהות ורודות', 'Pink high-tops'],
  ['bootT', 'boot', ['#8A5A32', '#3E2A18', '#F5C542'], 1, 'מגפי עבודה חומים', 'Brown work boots'], ['bootK', 'boot', ['#22212A', '#55535E', '#D7263D'], 2, 'מגפיים שחורים', 'Black boots'], ['bootY', 'boot', ['#E0A526', '#3E2A18', '#3E2A18'], 2, 'מגפיים צהובים', 'Yellow boots'],
  ['slideK', 'slide', ['#22212A', '#22212A', '#F4F4F6'], 2, 'כפכפים עם גרביים', 'Slides with socks'], ['slideP', 'slide', ['#F27BA5', '#C94F7C', '#F4F4F6'], 3, 'כפכפים ורודים עם גרביים', 'Pink slides with socks'],
  ['neon', 'neon', ['#22212A', '#3CF0C8'], 3, 'נעליים זוהרות', 'Glowing sneakers'], ['chrome', 'chrome', ['#D5D9E1', '#8E95A3'], 3, 'נעלי כרום', 'Chrome sneakers'], ['wing', 'wing', ['#F4F4F6', '#F2B93B', '#FFFFFF'], 4, 'נעליים עם כנפיים', 'Winged shoes'],
  ['rocket', 'rocket', ['#D7263D', '#55535E', '#F5C542', '#FF7A2E'], 5, 'מגפי רקטה', 'Rocket boots'],
]);
stock('neck', [
  ['towel', 'towel', ['#F4F4F6', '#D9DAE0', '#C9B8F5'], 0, 'מגבת לבנה', 'White towel'], ['towelP', 'towel', ['#7C55E8', '#5229C4', '#FFFFFF'], 0, 'מגבת סגולה', 'Purple towel'], ['towelB', 'towel', ['#2F6FE0', '#1E4BA8', '#FFFFFF'], 0, 'מגבת כחולה', 'Blue towel'],
  ['towelR', 'towel', ['#D7263D', '#9E1328', '#FFFFFF'], 0, 'מגבת אדומה', 'Red towel'], ['tag', 'tag', ['#AEB4C0', '#D5D9E1', '#8E95A3'], 1, 'דסקית', 'Dog tag'], ['whistle', 'whistle', ['#22212A', '#D5D9E1', '#8E95A3'], 1, 'משרוקית', 'Whistle'],
  ['chainS', 'chain', ['#C9CED8', '#F4F4F6', '#8E95A3'], 1, 'שרשרת כסף', 'Silver chain'], ['scarfR', 'scarf', ['#D7263D', '#FFFFFF'], 1, 'צעיף אדום', 'Red scarf'], ['chain', 'chain', ['#F2B93B', '#FFD76A', '#C98F1C'], 2, 'שרשרת זהב', 'Gold chain'],
  ['bowK', 'bow', ['#22212A', '#3A3845'], 2, 'עניבת פרפר שחורה', 'Black bow tie'], ['bowR', 'bow', ['#D7263D', '#9E1328'], 2, 'עניבת פרפר אדומה', 'Red bow tie'], ['tieB', 'tie', ['#25315E', '#F5C542'], 2, 'עניבה', 'Necktie'],
  ['scarfB', 'scarf', ['#2F6FE0', '#F5C542'], 2, 'צעיף כחול', 'Blue scarf'], ['lei', 'lei', ['#F27BA5', '#F5C542', '#FFFFFF'], 3, 'זר פרחים', 'Flower lei'], ['chainB', 'chainB', ['#F2B93B', '#FFD76A', '#C98F1C'], 3, 'שרשרת זהב עבה', 'Heavy gold chain'],
]);
stock('wrist', [
  ['sweat', 'sweat', ['#D7263D', '#FFFFFF'], 0, 'מגני זיעה אדומים', 'Red sweatbands'], ['sweatW', 'sweat', ['#F4F4F6', '#2F6FE0'], 0, 'מגני זיעה לבנים', 'White sweatbands'], ['sweatK', 'sweat', ['#22212A', '#F5C542'], 0, 'מגני זיעה שחורים', 'Black sweatbands'],
  ['watch', 'watch', ['#1E1D24', '#EDEBFA', '#1E1D24'], 1, 'שעון ספורט', 'Sports watch'], ['watchR', 'watch', ['#D7263D', '#FFFFFF', '#9E1328'], 1, 'שעון אדום', 'Red watch'], ['watchW', 'watch', ['#F4F4F6', '#22212A', '#C9CED8'], 2, 'שעון חכם', 'Smart watch'],
  ['watchG', 'watch', ['#C98F1C', '#FFF6DC', '#C98F1C'], 3, 'שעון זהב', 'Gold watch'],
]);
stock('hands', [
  ['gloves', 'gloves', ['#1E1D24', '#6D3FE0'], 0, 'כפפות אימון שחורות', 'Black training gloves'], ['glovesR', 'gloves', ['#D7263D', '#FFFFFF'], 0, 'כפפות אימון אדומות', 'Red training gloves'], ['glovesW', 'gloves', ['#F4F4F6', '#22212A'], 1, 'כפפות אימון לבנות', 'White training gloves'],
  ['glovesB', 'gloves', ['#2F6FE0', '#F5C542'], 1, 'כפפות אימון כחולות', 'Blue training gloves'], ['boxR', 'boxing', ['#D7263D', '#FFFFFF'], 3, 'כפפות אגרוף אדומות', 'Red boxing gloves'], ['boxG', 'boxing', ['#F2B93B', '#22212A'], 4, 'כפפות אגרוף זהב', 'Gold boxing gloves'],
]);
stock('ears', [
  ['buds', 'buds', ['#F4F4F6', '#B9BEC9'], 0, 'אוזניות אלחוטיות לבנות', 'White earbuds'], ['budsK', 'buds', ['#22212A', '#55535E'], 1, 'אוזניות אלחוטיות שחורות', 'Black earbuds'], ['phones', 'phones', ['#1E1D24', '#1E1D24', '#6D3FE0'], 1, 'אוזניות קשת שחורות', 'Black headphones'],
  ['phonesW', 'phones', ['#F4F4F6', '#F4F4F6', '#D7263D'], 2, 'אוזניות קשת לבנות', 'White headphones'], ['phonesG', 'phones', ['#F2B93B', '#22212A', '#F2B93B'], 3, 'אוזניות קשת זהב', 'Gold headphones'],
]);
stock('hold', [
  ['shaker', 'shaker', ['#F4F4F6', '#B9BEC9', '#6D3FE0', '#D7263D'], 0, 'שייקר', 'Shaker'], ['bottle', 'bottle', ['#7FB8F0', '#2F6FE0', '#FFFFFF'], 0, 'בקבוק מים', 'Water bottle'], ['shakerK', 'shaker', ['#22212A', '#55535E', '#B6F03C', '#B6F03C'], 1, 'שייקר שחור', 'Black shaker'],
  ['banana', 'banana', ['#F5C542', '#7A5232'], 2, 'בננה', 'Banana'], ['dumb', 'dumb', ['#22212A', '#8E95A3'], 2, 'משקולת יד', 'Dumbbell'], ['trophy', 'trophy', ['#F2B93B', '#C98F1C'], 4, 'גביע', 'Trophy'],
]);
stock('back', [['wings', 'wings', ['#F4F4F6', '#D5D9E1'], 5, 'כנפיים', 'Wings']]);
const SHOP_BY = {}; for (const x of SHOP) SHOP_BY[x.id] = x;
/* the thing of the week: one each calendar week, sold for coins while the week lasts and never again. It is drawn by a model of
   the collection, in the colours of the season it was sold in: [dark, main, light, accent] */
const WEEKLY = [
  ['head', 'snap', 'כובע שטוח', 'snapback'], ['feet', 'runner', 'נעלי ריצה', 'runners'], ['shirt', 'stripes', 'חולצת פסים', 'striped shirt'], ['eyes', 'sport', 'משקפי ספורט', 'sport shades'],
  ['neck', 'scarf', 'צעיף', 'scarf'], ['head', 'beanie', 'כובע גרב', 'beanie'], ['feet', 'high', 'נעליים גבוהות', 'high-tops'], ['shirt', 'half', 'חולצה חצויה', 'split shirt'],
  ['eyes', 'shades', 'משקפי שמש', 'sunglasses'], ['ears', 'phones', 'אוזניות קשת', 'headphones'], ['head', 'bucket', 'כובע טמבל', 'bucket hat'], ['shirt', 'chest', 'חולצת פס', 'banded shirt'], ['hands', 'gloves', 'כפפות אימון', 'training gloves'],
];
const SEASON = [
  { he: 'חורף', en: 'Winter', c: ['#1E3A6E', '#5FB4F0', '#EAF6FF', '#FFFFFF'] }, { he: 'אביב', en: 'Spring', c: ['#1F7A4D', '#7FD6A0', '#FFF0F5', '#F27BA5'] },
  { he: 'קיץ', en: 'Summer', c: ['#C4641A', '#FFC93C', '#FFF6DC', '#1FA7C8'] }, { he: 'סתיו', en: 'Autumn', c: ['#6E2F1A', '#D9702E', '#F5E2C0', '#8A9A2E'] },
];
const WEEK_MEMO = {};
function weekItem(w) {
  if (!Number.isInteger(w) || w < 0 || w > 99999) return null;
  if (WEEK_MEMO[w]) return WEEK_MEMO[w];
  const d = new Date((w * 7 - 1) * 864e5), s = SEASON[Math.floor(((d.getUTCMonth() + 1) % 12) / 3)], t = WEEKLY[w % WEEKLY.length], c = s.c;
  const cols = { snap: [c[0], c[3], c[1]], runner: [c[1], c[0], c[3]], stripes: [c[2], c[1]], sport: [c[0], c[1], c[2]], scarf: [c[1], c[3]], beanie: [c[1], c[0], c[2]], high: [c[1], c[2], c[3]], half: [c[1], c[0]], shades: [c[0], c[1]], phones: [c[0], c[1], c[3]], bucket: [c[1], c[0]], chest: [c[0], c[1], c[2]], gloves: [c[1], c[0]] }[t[1]];
  return (WEEK_MEMO[w] = { id: 'wk' + w, slot: t[0], m: t[1], c: cols, r: 3, wk: w, he: t[2] + ' ' + s.he + ' ' + d.getUTCFullYear(), en: s.en + ' ' + d.getUTCFullYear() + ' ' + t[3] });
}
const shopItem = (id) => (typeof id !== 'string' ? null : SHOP_BY[id] || (/^wk\d{1,5}$/.test(id) ? weekItem(+id.slice(2)) : null));
/* the tag of a thing: how rare it is, or that it was a week's own */
const rareOf = (it) => (it.wk != null ? LIMITED : RARE[it.r] || RARE[0]);
const coinsOf = (xp) => Math.floor((xp > 0 && isFinite(xp) ? xp : 0) / 100);
/* what was paid, in the days when things were bought one by one, for the things of then */
const OLD_COST = { towel: 30, sweat: 35, towelP: 45, kicksW: 50, cap: 60, capR: 60, glasses: 60, shaker: 65, gloves: 70, kicksK: 70, capK: 75, beanie: 80, glovesR: 85, shades: 90, kicksR: 95, tag: 100, watch: 110, buds: 110, kicksP: 120, phones: 150, chain: 200, watchG: 220 };
/* a wardrobe read from a file or from the account. own: the things, each once · on: the worn ones, one to a slot · sp: the coins
   spent so far · inv: boxes that wait to be opened, by rarity (bx: 2 marks that; boxes kept from the days when a box was a kind
   of thing become common ones) · got: what boxes were already given for (workouts by their id, full weeks by theirs) · lv: the
   level up to which the boxes of the road were given (1 at the start, where the road has none) · n: boxes opened in all · sd: the seed of this lifter's luck ·
   sh: shields held · shw: the weeks a shield stood in for */
function cleanShop(v) {
  v = v && typeof v === 'object' ? v : {};
  const ok = (a) => (Array.isArray(a) ? a.filter((id, i) => !!shopItem(id) && a.indexOf(id) === i) : []), num = (x, top) => (Number.isFinite(x) && x > 0 ? Math.min(Math.floor(x), top) : 0);
  const own = ok(v.own), slots = {};
  const on = ok(v.on).filter((id) => { const s = shopItem(id).slot; if (!own.includes(id) || slots[s]) return false; slots[s] = 1; return true; });
  return { own, on, sp: Number.isFinite(v.sp) && v.sp >= 0 ? Math.floor(v.sp) : own.reduce((n, id) => n + (OLD_COST[id] || 0), 0), inv: BOXES.map((b, i) => (!Array.isArray(v.inv) ? 0 : v.bx === 2 ? num(v.inv[i], 99) : i ? 0 : num(v.inv.reduce((n, x) => n + num(x, 99), 0), 99))), bx: 2, lv: num(v.lv, 100) || 1,
    got: Array.isArray(v.got) ? v.got.filter((k, i, a) => typeof k === 'string' && k.length < 60 && a.indexOf(k) === i).slice(-200) : [], n: num(v.n, 1e6), sd: num(v.sd, 4294967295),
    sh: num(v.sh, SHIELD_TOP), shw: Array.isArray(v.shw) ? v.shw.filter((w, i, a) => Number.isInteger(w) && a.indexOf(w) === i).slice(-40) : [] };
}
const spentOf = (shop) => shop.sp || 0;
/* what is left to spend: never under zero, even when a deleted workout took points away after they were spent */
const coinsLeft = (xp, shop, ch) => Math.max(0, coinsOf(xp) + (ch > 0 && isFinite(ch) ? Math.floor(ch) : 0) - spentOf(shop));
/* putting a thing on takes off what was worn in its slot; null when it is not owned */
function shopWear(shop, id, on) {
  const it = shopItem(id); if (!it || !shop.own.includes(id)) return null;
  const rest = shop.on.filter((k) => k !== id && shopItem(k).slot !== it.slot);
  return Object.assign({}, shop, { own: shop.own.slice(), on: on ? rest.concat(id) : rest });
}
/* what is left to collect of one rarity */
const rareLeft = (shop, r) => SHOP.filter((x) => x.r === r && !shop.own.includes(x.id));
/* a box with nothing left to give: every thing of the rarities it holds is owned */
const boxEmpty = (shop, kind) => !BOXES[kind] || !BOXES[kind].odds.some((w, r) => w > 0 && rareLeft(shop, r).length);
/* a box is opened: one thing that is not owned yet, never a second of the same. How rare it is comes from the box's odds and the
   lifter's own luck (the seed and the number of boxes opened so far, so that opening again never gives another answer). When
   nothing is left of the rarity that came up, the box gives from the nearest rarity it holds; a box that was a gift (free) and
   holds nothing any more gives from the nearest rarity there is. Returns { it, shop }, or null */
function boxDraw(shop, kind, free) {
  const B = BOXES[kind]; if (!B) return null;
  const sd = shop.sd || 1, h = hashId(sd + ':' + shop.n + ':' + kind);
  let r = kind, a = 0; for (let i = 0; i < RARE.length; i++) { a += B.odds[i]; if (h % 1000 < a) { r = i; break; } }
  const order = [r]; for (let k = 0; k < RARE.length; k++) if (B.odds[k] > 0 && k !== r) order.push(k);
  if (free) { for (let k = kind + 1; k < RARE.length; k++) if (!order.includes(k)) order.push(k); for (let k = kind - 1; k >= 0; k--) if (!order.includes(k)) order.push(k); }
  let pool = []; for (const k of order) { pool = rareLeft(shop, k); if (pool.length) break; }
  if (!pool.length) return null;
  const it = pool[hashId(h + ':' + pool.length) % pool.length];
  return { it, shop: Object.assign({}, shop, { own: shop.own.concat(it.id), n: shop.n + 1, sd }) };
}
/* opening a box: one that waits (paid: false) or one bought now with coins.
   Returns { it, kind, shop }, or null when there is no box, not enough coins, or nothing left in it */
function boxOpen(shop, kind, paid, xp, ch) {
  const B = BOXES[kind]; if (!B || (paid ? coinsLeft(xp, shop, ch) < B.cost : !(shop.inv[kind] > 0))) return null;
  const d = boxDraw(shop, kind, !paid); if (!d) return null;
  const inv = shop.inv.slice(); if (!paid) inv[kind]--;
  return { it: d.it, kind, shop: Object.assign(d.shop, { inv, sp: spentOf(shop) + (paid ? B.cost : 0) }) };
}
/* the thing of the week is bought as it is: only in its own week, once, and it is put on at once. null when it cannot be */
function weekBuy(shop, w, now, xp, ch) {
  const it = weekItem(w); if (!it || w !== weekIdx(now) || shop.own.includes(it.id) || coinsLeft(xp, shop, ch) < WEEK_COST) return null;
  return shopWear(Object.assign({}, shop, { own: shop.own.concat(it.id), sp: spentOf(shop) + WEEK_COST }), it.id, true);
}
/* a shield for the streak: bought with coins and kept until a week goes by without a workout */
function shieldBuy(shop, xp, ch) {
  if (shop.sh >= SHIELD_TOP || coinsLeft(xp, shop, ch) < SHIELD_COST) return null;
  return Object.assign({}, shop, { sh: shop.sh + 1, sp: spentOf(shop) + SHIELD_COST });
}
/* ---- the body log: the lifter's height, and what the scale showed on the days it was written down. One entry for a day:
   d (the day, as 2026-11-15), kg, and for those who measure them fat (percent), waist (cm) and a note */
const BODY_TOP = 500;
const isDayStr = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d + 'T12:00:00'));
const num1 = (v, lo, hi) => (Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v * 10) / 10 : null);
function cleanBody(v) {
  v = v && typeof v === 'object' ? v : {};
  const seen = {}, log = [];
  for (const r of Array.isArray(v.log) ? v.log : []) {
    if (!r || !isDayStr(r.d) || seen[r.d]) continue;
    const kg = num1(r.kg, 20, 400); if (kg == null) continue;
    seen[r.d] = 1;
    const o = { d: r.d, kg }, fat = num1(r.fat, 2, 70), waist = num1(r.waist, 30, 250);
    if (fat != null) o.fat = fat;
    if (waist != null) o.waist = waist;
    if (typeof r.n === 'string' && r.n.trim()) o.n = r.n.trim().slice(0, 80);
    log.push(o);
  }
  log.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  return { h: num1(v.h, 100, 250) == null ? null : Math.round(v.h), log: log.slice(-BODY_TOP) };
}
/* a day is written: the newer entry takes the place of the older one of the same day */
const bodyPut = (body, row) => cleanBody({ h: body.h, log: body.log.filter((r) => r.d !== row.d).concat(row) });
const bodyDrop = (body, d) => cleanBody({ h: body.h, log: body.log.filter((r) => r.d !== d) });
/* where the weight stands: the last entry, the step from the one before it, and the change over the last thirty days of the log */
function bodyTrend(body) {
  const L = body.log; if (!L.length) return null;
  const at = (r) => Date.parse(r.d + 'T12:00:00'), last = L[L.length - 1], prev = L.length > 1 ? L[L.length - 2] : null, old = L.find((r) => at(last) - at(r) <= 30 * 864e5), r1 = (x) => Math.round(x * 10) / 10;
  return { last, step: prev ? r1(last.kg - prev.kg) : null, month: old && old !== last ? r1(last.kg - old.kg) : null };
}
/* how muscular the character is drawn: 0 at level 1, fully built at level 30 */
const buildOf = (lvl) => Math.max(0, Math.min(1, (lvl - 1) / 29));
/* calendar week of a moment, in the device's own time; weeks start on Sunday */
function weekIdx(ts) { const d = new Date(ts); return Math.floor((Math.floor((ts - d.getTimezoneOffset() * 60000) / 864e5) + 4) / 7); }

/* The device keeps only the latest workouts, so the profile cannot be recounted from the log forever. Older workouts are
   folded into an archive: their totals up to the moment `until`, and the run of consecutive weeks (sw) ending in week lw.
   The archive counts its points in tens (a set was once 10 points and is now 100): what was folded before keeps its worth */
const archZero = () => ({ until: 0, xp: 0, wk: 0, sets: 0, prs: 0, kg: 0, sw: 0, lw: 0, ch: 0 });
function totalsOf(list, arch) {
  const t = { xp: arch.xp * 10, wk: arch.wk, sets: arch.sets, prs: arch.prs, kg: arch.kg, ch: arch.ch || 0 };
  for (const s of list) {
    if (s.ts <= arch.until) continue;
    const y = tally(s); if (!y.sets) continue;
    t.xp += y.xp; t.sets += y.sets; t.prs += y.prs; t.kg += y.kg; if (s.end) { t.wk++; t.ch += chestOf(s); }
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
    a.xp += y.xp / 10; a.wk++; a.sets += y.sets; a.prs += y.prs; a.kg += y.kg; a.ch = (a.ch || 0) + chestOf(s);
    if (!a.sw || w > a.lw + 1) a.sw = 1; else if (w === a.lw + 1) a.sw++;
    a.lw = w;
  }
  return a;
}
/* weeks in a row with at least one finished workout. The current week counts once it has one; until then the run stands on last week */
function streakOf(list, arch, now, shw) {
  const weeks = new Set(list.filter((s) => s.end && s.ts > arch.until && tally(s).sets).map((s) => weekIdx(s.ts)));
  if (arch.sw) weeks.add(arch.lw);
  /* a week that a shield stood in for counts as a week of the run */
  if (shw) for (const w of shw) weeks.add(w);
  const cur = weekIdx(now);
  let w = weeks.has(cur) ? cur : cur - 1, n = 0;
  while (weeks.has(w)) { n++; if (arch.sw && w === arch.lw) return n + arch.sw - 1; w--; }
  return n;
}
/* the same run in days: from the first workout of the first week of the run until today. It grows by a day each day for as
   long as no week goes by without a workout */
const dayIdx = (ts) => { const d = new Date(ts); return Math.floor((ts - d.getTimezoneOffset() * 60000) / 864e5); };
function streakDays(list, arch, now, shw) {
  const n = streakOf(list, arch, now, shw); if (!n) return 0;
  const ok = list.filter((s) => s.end && s.ts > arch.until && tally(s).sets), cur = weekIdx(now), first = (ok.some((s) => weekIdx(s.ts) === cur) ? cur : cur - 1) - n + 1;
  const ts = ok.filter((s) => weekIdx(s.ts) === first).map((s) => s.ts);
  /* a first week that is already in the archive is counted whole */
  return Math.max(1, ts.length ? dayIdx(now) - dayIdx(Math.min.apply(null, ts)) + 1 : n * 7);
}
/* ---- what makes a finished workout feel like something (round 2). Each is honest: it tells or gives only what is true.
   A surprise chest: about one finished workout in three ends with a chest of coins for the kiosk. Which ones, and how much, comes
   from the workout's own id, so every device agrees and nothing has to be stored; no one can tell in advance which workout has one */
const CHEST = [10, 10, 15, 15, 20, 20, 25, 40];
/* from the day the boxes came, the surprise of a finished workout is a box of a kind and no longer coins. The coins of the
   workouts before that day stay counted */
const BOX_FROM = Date.UTC(2026, 10, 15);
function hashId(id) { let h = 2166136261; const t = String(id || ''); for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
function chestOf(s) {
  if (!s || !s.end || !s.id || !tally(s).sets || s.ts >= BOX_FROM) return 0;
  const h = hashId(s.id);
  return h % 100 < 34 ? CHEST[(h >>> 8) % CHEST.length] : 0;
}
/* the box a finished workout ends with (how rare it is), or -1: about one workout in three, the same on every device */
function boxOf(s) {
  if (!s || !s.end || !s.id || !tally(s).sets || !(s.ts >= BOX_FROM)) return -1;
  const h = hashId(s.id), r = (h >>> 8) % 100;
  return h % 100 < 34 ? (r < 70 ? 0 : r < 95 ? 1 : 2) : -1;
}
/* the key of a full week: a week of the plan in which every one of its workouts was finished (need: how many it has) */
function fullWeeks(list, need) {
  const seen = {};
  for (const s of list) if (s.end && s.m && s.wk && s.ts >= BOX_FROM && tally(s).sets) (seen[s.m + '/' + s.wk] || (seen[s.m + '/' + s.wk] = new Set())).add(s.w);
  return Object.keys(seen).filter((k) => seen[k].size >= Math.max(1, need));
}
/* the boxes a lifter has earned and was not given yet: one for a finished workout that ends with one (once, by its id), a rare
   one for every full week (once, by the week), and the boxes of the road for the levels reached since the last time.
   Returns the wardrobe with them, or null when there is nothing new */
function boxClaim(shop, list, need, lvl) {
  const got = new Set(shop.got), inv = shop.inv.slice(), add = []; let lv = shop.lv || 1, n = 0;
  const put = (kind) => { inv[kind] = Math.min(99, inv[kind] + 1); n++; };
  const give = (key, kind) => { if (got.has(key)) return; got.add(key); add.push(key); put(kind); };
  for (const s of list) { const k = boxOf(s); if (k >= 0) give(s.id, k); }
  for (const k of fullWeeks(list, need)) give('f' + k, 1);
  if (lvl > lv) { for (const st of STATIONS) if (st.box >= 0 && st.at > lv && st.at <= lvl) put(st.box); lv = Math.min(100, Math.floor(lvl)); }
  return n || lv !== (shop.lv || 1) ? Object.assign({}, shop, { inv, lv, got: shop.got.concat(add).slice(-200) }) : null;
}
/* the shield of the streak does its work by itself: when last week went by without a workout and the week before it was part of
   a run, a shield that is held stands in for that week. Returns the wardrobe after it, or null when there is nothing to do */
function shieldStep(shop, list, arch, now) {
  if (!(shop.sh > 0)) return null;
  const weeks = new Set(list.filter((s) => s.end && s.ts > arch.until && tally(s).sets).map((s) => weekIdx(s.ts)));
  if (arch.sw) weeks.add(arch.lw);
  for (const w of shop.shw) weeks.add(w);
  const cur = weekIdx(now);
  if (weeks.has(cur - 1) || !weeks.has(cur - 2)) return null;
  return Object.assign({}, shop, { sh: shop.sh - 1, shw: shop.shw.concat(cur - 1).slice(-40) });
}
/* almost there: the next level in sets, the unit the lifter actually does */
const setsToNext = (L) => Math.max(1, Math.ceil((L.need - L.into) / XP.set));
/* a run of weeks that this week has not kept yet: the length of the run, when it is two weeks or more and this week has no workout */
function streakOpen(list, arch, now) {
  const cur = weekIdx(now);
  if (list.some((s) => s.end && s.ts > arch.until && weekIdx(s.ts) === cur && tally(s).sets)) return 0;
  const n = streakOf(list, arch, now);
  return n >= 2 ? n : 0;
}
