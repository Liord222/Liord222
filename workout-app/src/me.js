/* ================================================================== the player's side of the page: level, profile, character, rewards */
const GLYPH = {
  flag: '<path d="M6 21V4M6 5h11l-2.5 4 2.5 4H6"/>',
  cal: '<rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8.6 14.6l2.2 2.2 4.6-4.6"/>',
  bolt: '<path d="M13 3L5.5 13.5H11L10 21l8-11h-5.5z"/>',
  bolt2: '<path d="M6 12l6-6 6 6M6 19l6-6 6 6"/>',
  bell: '<path d="M9 8.5a3.5 3.5 0 1 1 6 0M7.5 9h9l1.6 7.2a3 3 0 0 1-3 3.8H8.9a3 3 0 0 1-3-3.8z"/>',
  bell2: '<path d="M6.5 8v8M3.5 10v4M17.5 8v8M20.5 10v4M6.5 12h11"/>',
  flame: '<path d="M12 3.5c.5 3 4.5 5 4.5 9.3a4.5 4.5 0 0 1-9 0c0-1.6.7-2.9 1.7-3.8.3 1.4 1 2.2 1.9 2.6-.3-2.9.1-5.6.9-8.1z"/>',
  loop: '<path d="M4.5 11a7.6 7.6 0 0 1 13.4-4.4L19.5 8.5M19.5 4v4.5H15M19.5 13a7.6 7.6 0 0 1-13.4 4.4L4.5 15.5M4.5 20v-4.5H9"/>',
  plate: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.4"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/>',
  cup: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 3.6M16 6h3a3 3 0 0 1-3 3.6M12 13v4M8.5 20h7"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>',
  crown: '<path d="M4.5 17.5l-1-9 5 4L12 5.5l3.5 7 5-4-1 9zM5 20.5h14"/>',
  gift: '<path d="M4 10h16v10H4zM3 6.5h18V10H3zM12 6.5V20M12 6.5C10 3 6.5 3.5 7.5 5.5S12 6.5 12 6.5zM12 6.5c2-3.5 5.5-3 4.5-1S12 6.5 12 6.5z"/>',
  pen: '<path d="M4 20l1-4.5L16 4.5a2.1 2.1 0 0 1 3 3L8.5 19zM14 6.5l3 3"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.6v-3.2l-2.2-.5-.7-1.6 1.2-1.900-2.300-2.300-1.900 1.200-1.600-.700-.500-2.200H8.200l-.500 2.200-1.600.700-1.900-1.200-2.300 2.300 1.200 1.900-.700 1.600-2.200.500v3.200l2.200.500.700 1.600-1.200 1.900 2.300 2.300 1.900-1.200 1.600.700.500 2.200h3.200l.500-2.200 1.600-.700 1.900 1.200 2.300-2.300-1.200-1.900.700-1.600z" transform="translate(2.4 0) scale(.8) translate(1.200 3)"/>',
};
/* the streak's flame: drawn in two tones, not a line icon */
const flameSVG = () => '<svg class="flame" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.4 1.6c.5 3.6 6 6 6 12a6.4 6.4 0 0 1-12.8 0c0-2.5 1.1-4.4 2.6-5.7.3 1.8 1 2.9 2.1 3.5-.4-3.6.4-7 2.1-9.8z" fill="var(--flame)"/><path d="M12.1 11.6c.5 1.7 2.7 2.7 2.7 5.2a2.8 2.8 0 0 1-5.6 0c0-2.1 1.9-3 2.9-5.2z" fill="var(--flame-2)"/></svg>';
/* the colours a medal can have: fill and darker edge */
const glyph = (k, cls) => '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + GLYPH[k] + '</svg>';
const nf = (n) => Math.round(n).toLocaleString('en-US');
const pctOf = (L) => Math.max(0, Math.min(100, Math.round((L.into / L.need) * 100)));
const xpBar = (p, id) => '<span class="xpbar"><i' + (id ? ' id="' + id + '"' : '') + ' style="width:' + p + '%"></i></span>';
const tons = (kg) => { const t = kg / 1000; return t >= 100 ? nf(t) : (Math.round(t * 10) / 10).toLocaleString('en-US'); };
/* the player's character: built at least as far as the experience they came with (see EXP_BASE) */
const avatar = (lvl, o) => avatarSVG(Object.assign({}, S.cfg.me.look, { wear: S.cfg.me.shop.on }), lvl, Object.assign({ base: EXP_BASE[expNow()] || 0 }, o));

/* refresh the player's side after the log changed, and remember the level so that a level-up can be spotted */
function renderMe() {
  const P = meNow();
  S.lvl = P.L.lvl;
  const me = $('#tbMe'); if (me) me.innerHTML = avatar(P.L.lvl, { bust: true });
  if (S.view === 'profile') renderProfile(P); else if (S.view === 'journey') renderJourney(P);
  markShop();
  return P;
}
/* the strip at the top of "today": who is training, at which level, and the run of weeks */
function playerHTML(P) {
  const me = S.cfg.me;
  return '<button class="player" id="playerBtn" type="button" aria-label="' + say('הפרופיל שלי: רמה ', 'My profile: level ') + P.L.lvl + ', ' + nm(P.rank) + '"><span class="p-ava r' + P.rank.i + '">' + avatar(P.L.lvl, { bust: true }) + '</span>' +
    '<span class="p-txt"><b>' + (me.name ? say('היי ', 'Hi, ') + '<bdi>' + esc(me.name) + '</bdi>' : say('היי', 'Hi!')) + '</b><span class="p-rank"><span class="lv-badge">' + say('רמה ', 'Level ') + P.L.lvl + '</span>' + nm(P.rank) + '</span>' + xpBar(pctOf(P.L)) + '</span>' +
    (P.X.days ? '<span class="p-streak" title="' + say('ימים ברצף', 'Days in a row') + '">' + flameSVG() + '<b>' + P.X.days + '</b></span>' : '') + '</button>';
}
/* an achievement: earned ones shine; one that is still ahead shows how far along it is, in words and as a bar */
function badgeHTML(b, on, P) {
  const of = !on && P && b.of ? b.of(P.T, P.X) : null, cur = of ? Math.max(0, Math.min(of[0], of[1])) : 0, pct = of ? Math.round((cur / of[1]) * 100) : 0;
  return '<li class="bdg' + (on ? ' on' : '') + '" aria-label="' + nm(b) + (on ? say(', הושג', ', earned') : of ? ', ' + nf(cur) + say(' מתוך ', ' of ') + nf(of[1]) : say(', עוד לא', ', not yet')) + '"><span class="bdg-i">' + glyph(b.ic) + '</span><span class="bdg-t">' + nm(b) +
    (on ? '<small class="bdg-ok">' + ICON.check + say('הושג', 'Earned') + '</small>' : of ? '<small>' + nf(cur) + say(' מתוך ', ' of ') + nf(of[1]) + '</small><i class="bdg-bar"><i style="width:' + pct + '%"></i></i>' : '') + '</span></li>';
}
/* a coin of the kiosk */
const COIN = '<svg class="coin" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.6" fill="#F2B02E" stroke="#C98A12" stroke-width="1.6"/><path d="M10 5.5l1.35 2.75 3.05.45-2.2 2.15.5 3-2.7-1.45-2.7 1.45.5-3-2.2-2.15 3.05-.45z" fill="#C98A12"/></svg>';
/* the part of the figure that a thing of the kiosk is worn on, as a close view of the lifter's own character with that thing alone */
const CROP = { head: '56 2 88 88', eyes: '60 14 80 80', ears: '54 4 92 92', neck: '58 58 84 84', wrist: '104 112 80 80', hands: '104 124 80 80', hold: '18 126 80 80', feet: '56 176 88 88', shirt: '52 76 96 96', back: '6 28 188 188' };
/* a hat that rises above the head is shown from further away */
const cropOf = (it) => (it.slot === 'head' && HAT_TOP[it.m] ? (HAT_TOP[it.m] === 2 ? '46 -10 108 108' : '52 -6 96 96') : CROP[it.slot]);
const cropFig = (it, lvl) => avatarSVG(Object.assign({}, S.cfg.me.look, { wear: [it.id], gear: false }), lvl, { crop: cropOf(it), base: EXP_BASE[expNow()] || 0 });
/* the profile: the character on its stage with where it stands in the game, the kiosk, and the achievements, small */
function renderProfile(P) {
  P = P || meNow();
  const me = S.cfg.me, L = P.L, nx = nextReward(L.lvl), have = new Set(Object.keys(me.badges).concat(earned(P.T, P.X))), bal = coinsLeft(P.T.xp, me.shop, P.T.ch);
  let si = 0; const stat = (v, k) => '<li style="--i:' + (si++) + '"><b>' + v + '</b><span>' + k + '</span></li>';
  /* the achievements in short: the last ones that were earned, then the next to go for. All of them are a tap away */
  const got = BADGES.filter((b) => have.has(b.id)), todo = BADGES.filter((b) => !have.has(b.id)), few = todo.length ? got.slice(-3).concat(todo).slice(0, 4) : got.slice(-4);
  /* the shelf in short: the next three things to buy; once everything is owned, the dearest three */
  const owned = ownedOf(me.shop), wait = me.shop.inv.reduce((a, b) => a + b, 0), peek = me.shop.own.slice(-3).reverse().map(shopItem).filter(Boolean);
  $('#profile').innerHTML = '<section class="pf-top"><div class="pf-bar">' + (me.made ? '<button class="pf-ic pf-edit" id="lookBtn" type="button" aria-label="' + say('עריכת הדמות', 'Edit the character') + '">' + glyph('pen') + '</button>' : '<span></span>') +
    '<button class="pf-ic" id="setBtn" type="button" aria-label="' + say('הגדרות', 'Settings') + '">' + glyph('gear') + '</button></div>' +
    '<div class="pf-stage" id="pfStage">' + avatar(L.lvl) + '</div><h1 class="pf-name">' + (me.name ? '<bdi>' + esc(me.name) + '</bdi>' : say('הדמות שלי', 'My character')) + '</h1>' +
    '<p class="pf-rank">' + medalSVG(P.rank.i) + '<span class="lv-badge">' + say('רמה ', 'Level ') + L.lvl + '</span>' + nm(P.rank) + '</p>' +
    '<div class="xp">' + xpBar(pctOf(L)) + '<p class="xp-l">' + say('עוד ' + nf(L.need - L.into) + ' נקודות לרמה ', nf(L.need - L.into) + ' pts to level ') + (L.lvl + 1) + (nx ? '<br>' + say('ברמה ' + nx.at + ' ', 'At level ' + nx.at + ': ') + nm(nx) : '') + '</p></div>' +
    (me.made ? '' : '<button class="btn primary" id="lookBtn" type="button">' + glyph('pen') + say('עיצוב הדמות', 'Design the character') + '</button>') +
    '<ul class="pf-nums">' + stat(nf(P.T.wk), say('אימונים', 'workouts')) + stat(nf(P.X.days || 0), say('ימים ברצף', 'days in a row')) + stat(nf(P.T.prs), say('שיאים', 'PRs')) + '</ul></section>' +
    bodyCardHTML() +
    '<section class="card kiosk" aria-label="' + say('הקיוסק', 'The kiosk') + '">' + '<div class="ks-awn" aria-hidden="true"><i></i></div>' + '<div class="ks-card-in"><div class="ks-card-h"><div><p class="ks-k">' + say('הקיוסק', 'The kiosk') + '</p>' +
    '<h2>' + say('האוסף שלך', 'Your collection') + '</h2></div><span class="coin-tag" role="img" aria-label="' + say(nf(bal) + ' מטבעות', nf(bal) + ' coins') + '">' + COIN + nf(bal) + '</span></div>' +
    '<p class="meta">' + owned + say(' מתוך ', ' of ') + SHOP.length + say(' פריטים', ' things') + '</p><span class="ks-prog" aria-hidden="true"><i style="width:' + Math.max(owned ? 3 : 0, Math.round((owned / SHOP.length) * 100)) + '%"></i></span>' +
    (wait ? '<button class="ks-wait" id="shopWait" type="button">' + boxSVG(me.shop.inv.findIndex((n) => n > 0)) + '<b>' + (wait === 1 ? say('קופסה אחת מחכה לך', 'A box is waiting for you') : say(wait + ' קופסאות מחכות לך', wait + ' boxes are waiting for you')) + '</b>' + ICON.fwd + '</button>' : '') +
    '<ul class="ks-peek" aria-hidden="true">' + (peek.length ? peek.map((it) => '<li style="--rc:' + rareOf(it).c + '"><span class="ks-pic">' + cropFig(it, L.lvl) + '</span></li>') : [0, 2, 3].map((k) => '<li class="bxp">' + boxSVG(k) + '</li>')).join('') + '</ul>' +
    '<button class="btn ks-go big" id="shopBtn" type="button">' + say('לקיוסק', 'To the kiosk') + '</button></div></section>' +
    '<section class="pf-sec"><div class="sec-h"><h2 class="sec">' + say('הישגים ', 'Achievements ') + '<small>' + have.size + say(' מתוך ', ' of ') + BADGES.length + '</small></h2><button class="link" id="bdgAll" type="button" aria-expanded="' + !!S.bdgAll + '">' + (S.bdgAll ? say('פחות', 'Fewer') : say('כל ההישגים', 'All of them')) + '</button></div>' +
    '<ul class="badges">' + (S.bdgAll ? BADGES : few).map((b) => badgeHTML(b, have.has(b.id), P)).join('') + '</ul></section>';
}
/* ---- the kiosk. Coins buy boxes; a box gives one thing of its kind that is not owned yet; what is owned goes on and off with a
   tap. Beside the boxes stand the thing of the week and the shield of the streak, and under them the whole collection ---- */
/* what a kind of box carries on its front: a cap, glasses, a shirt, a shoe, a star */
const BOX_MARK = [
  '<path d="M22.5 47H40M24 47C24 40.4 27.4 36.4 32 36.4C36.6 36.4 40 40.4 40 47M40 47L45 48.6"/>',
  '<circle cx="26.4" cy="43" r="4.5"/><circle cx="37.6" cy="43" r="4.5"/><path d="M30.9 43H33.1"/>',
  '<path d="M27 35.4L21 39L23.4 43.6L26.2 42.2V51.4H37.8V42.2L40.6 43.6L43 39L37 35.4C36 37.4 34.2 38.4 32 38.4C29.8 38.4 28 37.4 27 35.4Z"/>',
  '<path d="M21.4 49V40.4L26.6 41L30 44.6L39 46.6C41.6 47.2 43 48.4 43 50.2V51H21.4Z"/>',
  '<path d="M32 35.2L34.5 40.3L40.1 41.1L36 45L37 50.6L32 48L27 50.6L28 45L23.900 41.100L29.500 40.300Z"/>',
];
function boxSVG(kind) {
  const c = BOXES[kind].c;
  return '<svg class="bx" viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="59" rx="22" ry="3.2" fill="rgb(0 0 0 / .14)"/>' +
    '<g class="bx-body"><rect x="9" y="27" width="46" height="30" rx="5" fill="' + c + '"/><rect x="9" y="27" width="46" height="6" fill="rgb(0 0 0 / .18)"/></g>' +
    '<g class="bx-mark" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' + BOX_MARK[kind] + '</g>' +
    '<g class="bx-lid"><rect x="6" y="17" width="52" height="12" rx="4" fill="' + c + '"/><rect x="6" y="17" width="52" height="5" rx="2.5" fill="#fff" opacity=".22"/><rect x="27.500" y="17" width="9" height="12" fill="#fff"/>' +
    '<path d="M32 17C26 7 16 9 19 15C21 18 27 18 32 17ZM32 17C38 7 48 9 45 15C43 18 37 18 32 17Z" fill="#fff"/></g></svg>';
}
const SHIELD_SVG = '<svg class="shd" viewBox="0 0 40 44" aria-hidden="true"><path d="M20 2.5L36 8V20.500C36 30.500 29.500 37.500 20 41.500C10.500 37.500 4 30.500 4 20.500V8Z" fill="#2B78F0" stroke="#1B4FB0" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 7.500L31.500 11.500V20.500C31.500 27.800 26.900 33 20 36.300Z" fill="#fff" opacity=".22"/><path d="M19.500 12C23.500 15.500 25.500 18.500 25.500 22.300C25.500 25.700 23.100 28 20 28C16.900 28 14.500 25.700 14.500 22.300C14.500 20 15.500 18.400 17 16.900C17.300 18.700 18 19.700 19.100 20.200C18.600 17.300 18.700 14.600 19.500 12Z" fill="#FFD76A"/></svg>';
const rareTag = (it) => { const r = rareOf(it); return '<span class="rr" style="--rc:' + r.c + '">' + nm(r) + '</span>'; };
const ownedOf = (shop) => SHOP.filter((x) => shop.own.includes(x.id)).length;
function renderShop(pump) {
  const P = meNow(), me = S.cfg.me, shop = me.shop, bal = coinsLeft(P.T.xp, shop, P.T.ch), sh = $('#sheet'), old = $('.sheet-in', sh), top = old ? old.scrollTop : 0, lvl = P.L.lvl;
  const it = shopItem(S.shopTry), have = ownedOf(shop), wait = shop.inv.reduce((a, b) => a + b, 0), wk = weekIdx(Date.now()), wIt = weekItem(wk), wOwn = shop.own.includes(wIt.id), dLeft = 7 - new Date().getDay();
  const short = (cost) => (cost - bal === 1 ? say('חסר עוד מטבע אחד', '1 more coin to go') : say('חסרים עוד ' + (cost - bal) + ' מטבעות', (cost - bal) + ' more coins to go'));
  const word = it && shop.own.includes(it.id) ? '<b>' + nm(it) + '</b>' + rareTag(it) + '<p>' + (shop.on.includes(it.id) ? say('עליך עכשיו', 'On you now') : say('בארון שלך', 'In your wardrobe')) + '</p>'
    : S.shopMsg ? '<b>' + S.shopMsg + '</b><p>' + say('כל אימון מוסיף מטבעות', 'Every workout adds coins') + '</p>'
    : '<b>' + say('פותחים קופסה ומגלים פריט', 'Open a box and find a thing') + '</b><p>' + (shop.pt >= PITY - 1 ? say('הקופסה הבאה אפיק לפחות', 'The next box is epic at least') : say('עוד ' + (PITY - shop.pt) + ' קופסאות ומובטח אפיק', (PITY - shop.pt) + ' more boxes and an epic is sure')) + '</p>';
  /* boxes that wait: from finished workouts and from full weeks */
  const waiting = wait ? '<section class="ks-sec"><h3>' + say('מחכות לך', 'Waiting for you') + '</h3><ul class="ks-boxes wait">' + BOXES.map((b, k) => (shop.inv[k] ? '<li><button class="ks-bx" type="button" data-open="' + k + '" aria-label="' + nm(b) + say(' לפתוח', ', open it') + '">' + boxSVG(k) +
    '<b>' + say(b.of[0], b.of[1]) + '</b>' + (shop.inv[k] > 1 ? '<span class="ks-n">' + shop.inv[k] + '</span>' : '') + '<span class="ks-st">' + say('לפתוח', 'Open') + '</span></button></li>' : '')).join('') + '</ul></section>' : '';
  const boxes = '<section class="ks-sec"><h3>' + say('קופסאות', 'Boxes') + '</h3><ul class="ks-boxes">' + BOXES.map((b, k) => {
    const all = SHOP.filter((x) => kindOf(x) === k).length, left = boxLeft(shop, k).length, full = !left;
    return '<li><button class="ks-bx' + (full ? ' full' : bal >= BOX_COST ? '' : ' far') + '" type="button" data-box="' + k + '"' + (full ? ' disabled' : '') + ' aria-label="' + nm(b) + ', ' + (full ? say('הכול אצלך', 'all yours') : BOX_COST + say(' מטבעות', ' coins')) + '">' + boxSVG(k) +
      '<b>' + say(b.of[0], b.of[1]) + '</b><small>' + (all - left) + say(' מתוך ', ' of ') + all + '</small>' + (full ? '<span class="ks-st">' + ICON.check + say('הכול אצלך', 'All yours') + '</span>' : '<span class="ks-pr">' + COIN + BOX_COST + '</span>') + '</button></li>';
  }).join('') + '</ul></section>';
  const week = '<section class="ks-sec"><h3>' + say('רק השבוע', 'This week only') + '<small>' + (dLeft === 1 ? say('יום אחרון', 'Last day') : say('עוד ' + dLeft + ' ימים', dLeft + ' days left')) + '</small></h3>' +
    '<div class="ks-week"><span class="ks-pic">' + cropFig(wIt, lvl) + '</span><div><b>' + nm(wIt) + '</b>' + rareTag(wIt) + '</div>' +
    (wOwn ? '<span class="ks-st">' + ICON.check + say('שלך', 'Yours') + '</span>' : '<button class="btn' + (bal >= WEEK_COST ? '' : ' far') + '" type="button" data-week="' + wk + '">' + COIN + WEEK_COST + '</button>') + '</div></section>';
  const shield = '<section class="ks-sec"><div class="ks-week ks-shield">' + SHIELD_SVG + '<div><b>' + say('מגן רצף', 'Streak shield') + '</b><p>' + say('שומר על הרצף אם פספסת שבוע', 'Keeps your streak through a missed week') + '</p></div>' +
    (shop.sh >= SHIELD_TOP ? '<span class="ks-st">' + ICON.check + say('יש לך מגן', 'You have one') + '</span>' : '<button class="btn' + (bal >= SHIELD_COST ? '' : ' far') + '" type="button" data-shield="1">' + COIN + SHIELD_COST + '</button>') + '</div></section>';
  /* the collection: what is owned is drawn and can be worn; what is not is a question mark in the colour of its rarity */
  const mine = shop.own.map(shopItem).filter(Boolean), shelf = S.shelf === 'me' || (S.shelf !== '' && BOXES[+S.shelf]) ? S.shelf : mine.length ? 'me' : '0';
  const tile = (x) => {
    const o = shop.own.includes(x.id), on = shop.on.includes(x.id), r = rareOf(x);
    return o ? '<li><button class="ks-it own' + (on ? ' on' : '') + (S.shopTry === x.id ? ' try' : '') + '" style="--rc:' + r.c + '" type="button" data-shop="' + x.id + '" aria-pressed="' + on + '" aria-label="' + nm(x) + ', ' + nm(r) + ', ' + (on ? say('עליך', 'on') : say('בארון', 'owned')) + '">' +
      '<span class="ks-pic">' + cropFig(x, lvl) + '</span><b>' + nm(x) + '</b>' + (on ? '<span class="ks-st">' + ICON.check + say('עליך', 'On') + '</span>' : '<span class="rr">' + nm(r) + '</span>') + '</button></li>'
      : '<li class="ks-q" style="--rc:' + r.c + '" role="img" aria-label="' + say('פריט שעוד לא גילית, ', 'A thing not found yet, ') + nm(r) + '">?</li>';
  };
  const list = shelf === 'me' ? mine.slice().reverse() : mine.filter((x) => x.wk != null && kindOf(x) === +shelf).concat(SHOP.filter((x) => kindOf(x) === +shelf).sort((a, b) => a.r - b.r));
  const got = list.filter((x) => shop.own.includes(x.id)), todo = list.filter((x) => !shop.own.includes(x.id));
  const chips = '<div class="ks-shelf" role="radiogroup" aria-label="' + say('מדפים', 'Shelves') + '">' + [['me', say('שלי', 'Mine'), mine.length]].concat(BOXES.map((b, k) => [String(k), say(b.of[0], b.of[1]), SHOP.filter((x) => kindOf(x) === k && shop.own.includes(x.id)).length])).map((x) =>
    '<button type="button" role="radio" data-shelf="' + x[0] + '" aria-checked="' + (x[0] === shelf) + '">' + x[1] + '<small>' + x[2] + '</small></button>').join('') + '</div>';
  const odds = '<div class="ks-odds"><b>' + say('הסיכוי בכל קופסה', 'The odds of every box') + '</b><ul>' + RARE.map((r) => '<li style="--rc:' + r.c + '"><i></i>' + nm(r) + '<span dir="ltr">' + r.w / 10 + '%</span></li>').join('') + '</ul></div>';
  sh.innerHTML = '<div class="sheet-in ks" role="dialog" aria-modal="true" aria-label="' + say('הקיוסק', 'The kiosk') + '">' + '<div class="ks-awn" aria-hidden="true"><i></i></div>' + '<div class="ed-h"><div><p class="kicker">' + say('הקיוסק', 'The kiosk') + '</p><h2>' + say('האוסף שלך', 'Your collection') + '</h2></div>' +
    '<span class="coin-tag dark" role="img" aria-label="' + say(nf(bal) + ' מטבעות', nf(bal) + ' coins') + '">' + COIN + nf(bal) + '</span><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    '<div class="ks-stage"><span class="ks-fig' + (pump ? ' pump' : '') + '" aria-hidden="true">' + avatarSVG(Object.assign({}, me.look, { wear: shop.on }), lvl, { base: EXP_BASE[expNow()] || 0 }) + '</span><div class="ks-say" aria-live="polite">' + word + '</div></div>' +
    waiting + boxes + week + shield +
    '<section class="ks-sec"><h3>' + say('האוסף', 'The collection') + '<small>' + have + say(' מתוך ', ' of ') + SHOP.length + '</small></h3>' + chips +
    (got.length ? '<ul class="ks-grid">' + got.map(tile).join('') + '</ul>' : shelf === 'me' ? '<p class="ks-none">' + say('עוד אין לך פריטים פותחים קופסה ומתחילים לאסוף', 'Nothing here yet. Open a box and start collecting') + '</p>' : '') +
    (todo.length ? '<p class="ks-more">' + say('עוד ' + todo.length + ' לגלות', todo.length + ' more to find') + '</p><ul class="ks-qs">' + todo.map(tile).join('') + '</ul>' : '') + '</section>' + odds +
    '<p class="ms-sub">' + say('כל 10 נקודות באימון הן מטבע והרמה שלך לא יורדת כשקונים', 'Every 10 points in a workout are a coin. Your level never drops when you buy.') + '</p></div>';
  $('.sheet-in', sh).scrollTop = top;
}
/* a tap on a thing that is owned: it goes on or off */
function shopTap(id) {
  const me = S.cfg.me, it = shopItem(id); if (!it || !me.shop.own.includes(id)) return;
  const next = shopWear(me.shop, id, !me.shop.on.includes(id)); if (!next) return;
  me.shop = next; saveCfg(); S.shopTry = id; S.shopMsg = ''; haptic('select'); renderMe(); renderShop(true);
}
/* after anything was bought or opened: the coins that are left are what the kiosk was last seen with */
function shopSaved() { const T = meNow().T; saveCfg(); S.shopBal = coinsLeft(T.xp, S.cfg.me.shop, T.ch); saveLocal(); markShop(); }
/* a box is opened: one that waited, or one bought now. What it holds is shown on the whole screen */
function boxOpenNow(kind, paid) {
  const me = S.cfg.me, T = meNow().T, bal = coinsLeft(T.xp, me.shop, T.ch);
  if (paid && bal < BOX_COST) { S.shopMsg = BOX_COST - bal === 1 ? say('חסר עוד מטבע אחד', '1 more coin to go') : say('חסרים עוד ' + (BOX_COST - bal) + ' מטבעות', (BOX_COST - bal) + ' more coins to go'); S.shopTry = null; haptic('warn'); if (S.sheet === 'shop') { renderShop(); $('.sheet-in', $('#sheet')).scrollTop = 0; } return false; }
  /* the seed of this lifter's luck is drawn once, with the first box */
  const res = boxOpen(me.shop.sd ? me.shop : Object.assign({}, me.shop, { sd: 1 + Math.floor(Math.random() * 4294967294) }), kind, paid, T.xp, T.ch);
  if (!res) return false;
  me.shop = res.shop; S.shopMsg = ''; S.shopTry = res.it.id; shopSaved();
  boxReveal(res.it, res.kind);
  return true;
}
function weekBuyNow(w) {
  const me = S.cfg.me, T = meNow().T, bal = coinsLeft(T.xp, me.shop, T.ch), next = weekBuy(me.shop, w, Date.now(), T.xp, T.ch);
  if (!next) { if (bal < WEEK_COST) { S.shopMsg = say('חסרים עוד ' + (WEEK_COST - bal) + ' מטבעות', (WEEK_COST - bal) + ' more coins to go'); S.shopTry = null; haptic('warn'); renderShop(); $('.sheet-in', $('#sheet')).scrollTop = 0; } return; }
  me.shop = next; S.shopMsg = ''; S.shopTry = 'wk' + w; shopSaved(); feel('coin', 'success'); renderMe(); renderShop(true); $('.sheet-in', $('#sheet')).scrollTop = 0;
  toast(COIN + '<b>' + say('שלך ', 'Yours: ') + nm(shopItem('wk' + w)) + '</b>');
}
function shieldBuyNow() {
  const me = S.cfg.me, T = meNow().T, bal = coinsLeft(T.xp, me.shop, T.ch), next = shieldBuy(me.shop, T.xp, T.ch);
  if (!next) { if (bal < SHIELD_COST && me.shop.sh < SHIELD_TOP) { S.shopMsg = say('חסרים עוד ' + (SHIELD_COST - bal) + ' מטבעות', (SHIELD_COST - bal) + ' more coins to go'); S.shopTry = null; haptic('warn'); renderShop(); $('.sheet-in', $('#sheet')).scrollTop = 0; } return; }
  me.shop = next; S.shopMsg = ''; shopSaved(); feel('coin', 'success'); renderShop();
  toast(say('<b>יש לך מגן רצף</b>', '<b>You have a streak shield</b>'));
}
/* what came out of a box, on the whole screen: the box waits for a tap, shakes, and opens on the thing in the colour of its rarity */
function boxReveal(it, kind) {
  const old = $('#boxUp'); if (old) old.remove();
  const r = rareOf(it), lvl = meNow().L.lvl, el = document.createElement('div');
  el.id = 'boxUp'; el.className = 'box-up'; el.style.setProperty('--rc', r.c); el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', nm(BOXES[kind]));
  el.innerHTML = '<canvas class="confetti" id="buConf" aria-hidden="true"></canvas><div class="bu-in"><span class="bu-rays" aria-hidden="true"></span>' +
    '<button class="bu-box" id="buBox" type="button" aria-label="' + say('לפתוח את הקופסה', 'Open the box') + '">' + boxSVG(kind) + '</button><p class="bu-hint" id="buHint">' + say('לחץ על הקופסה', 'Tap the box') + '</p>' +
    '<div class="bu-got" id="buGot" hidden><span class="bu-pic">' + cropFig(it, lvl) + '</span>' + rareTag(it) + '<h2>' + nm(it) + '</h2>' +
    '<div class="bu-act"><button class="btn big" id="buWear" type="button">' + say('ללבוש', 'Put it on') + '</button><button class="btn big ghost" id="buOk" type="button">' + say('המשך', 'Continue') + '</button></div></div></div>';
  $('#app').appendChild(el);
  let step = 0;
  const show = () => {
    if (step > 1 || !el.isConnected) return; step = 2;
    el.classList.remove('shake'); el.classList.add('open'); $('#buBox').hidden = true; $('#buHint').hidden = true; $('#buGot').hidden = false;
    el.setAttribute('aria-label', say('בקופסה ', 'In the box: ') + nm(it) + ', ' + nm(r));
    if (it.wk == null && it.r >= 3) { feel('glory', 'heavy'); confetti($('#buConf'), it.r >= 4 ? 110 : 70); } else if (it.r === 2) { sfx('pr'); haptic('success'); } else feel('coin', 'success');
    setTimeout(() => { const b = $('#buWear'); if (b) b.focus({ preventScroll: true }); }, 60);
  };
  const open = () => {
    if (step) return; step = 1; el.classList.add('shake'); haptic('select');
    /* four rising ticks while the box shakes, then it opens */
    if (!reduced) [0, 1, 2, 3].forEach((k) => setTimeout(() => { if (step === 1) sfx('set', k * 3); }, k * 210));
    setTimeout(show, reduced ? 0 : 900);
  };
  const done = (wear) => {
    if (wear) { const me = S.cfg.me, next = shopWear(me.shop, it.id, true); if (next) { me.shop = next; saveCfg(); } }
    el.classList.add('out'); setTimeout(() => el.remove(), reduced ? 0 : 200);
    renderMe(); if (S.sheet === 'shop') renderShop(true); else if (S.sheet === 'sum') sumBox();
  };
  el.addEventListener('click', (ev) => { if (ev.target.closest('#buBox')) open(); else if (ev.target.closest('#buWear')) done(true); else if (ev.target.closest('#buOk')) done(false); });
  overlayKeys(el, () => { if (!step) open(); else if (step === 2) done(false); });
  setTimeout(() => { const b = $('#buBox'); if (b && !b.hidden) b.focus({ preventScroll: true }); }, 60);
}
/* the box of the summary: the first one that waits, the one this workout ended with before the others */
function sumBoxHTML(first) {
  const inv = S.cfg.me.shop.inv, k = first >= 0 && inv[first] ? first : inv.findIndex((n) => n > 0);
  return k < 0 ? '' : '<button class="sum-chest" id="sumBoxBtn" type="button" data-open="' + k + '" aria-label="' + nm(BOXES[k]) + say(' לפתוח', ', open it') + '">' + boxSVG(k) + '<span class="ch-t"><b>' + nm(BOXES[k]) + '</b><small>' + say('לחץ לפתוח', 'Tap to open') + '</small></span></button>';
}
function sumBox() { const b = $('#sumBox'); if (b) b.innerHTML = sumBoxHTML(-1); }
function openShop() { S.sheet = 'shop'; S.shopTry = null; S.shopMsg = ''; S.shelf = ''; renderShop(); $('#sheet').hidden = false; S.shopBal = (() => { const T = meNow().T; return coinsLeft(T.xp, S.cfg.me.shop, T.ch); })(); saveLocal(); markShop(); }
/* the profile's tab is marked when a box waits, or once the coins have grown enough for a box since the kiosk was last looked at */
function markShop() {
  const me = S.cfg.me, T = meNow().T, bal = coinsLeft(T.xp, me.shop, T.ch), b = $('#tabbar [data-view="profile"]');
  if (b) b.classList.toggle('new', me.shop.inv.some((n) => n > 0) || (bal > (S.shopBal || 0) && bal >= BOX_COST));
}
/* ---- the body log: what the scale showed, day by day, with a few more things for those who measure them. One entry for a day */
const scaleSVG = (t) => '<svg class="scale" viewBox="0 0 96 96" aria-hidden="true"><rect x="6" y="8" width="84" height="84" rx="20" fill="#23212B"/><rect x="9" y="11" width="78" height="78" rx="17" fill="none" stroke="#fff" stroke-width="1.5" opacity=".12"/>' +
  '<rect x="22" y="17" width="52" height="24" rx="7" fill="#C9F7D4"/><text x="48" y="35" text-anchor="middle" font-family="Rubik,Arial,sans-serif" font-weight="800" font-size="16" fill="#12331C">' + t + '</text>' +
  [20, 54].map((x) => '<rect x="' + x + '" y="50" width="22" height="34" rx="11" fill="#383642"/><path d="M' + (x + 6) + ' 60h10M' + (x + 6) + ' 67h10M' + (x + 6) + ' 74h10" stroke="#565462" stroke-width="2" stroke-linecap="round"/>').join('') + '</svg>';
const bodyGirl = () => S.cfg.me.look.body === 1;
const bodyDay = (d) => { const t = new Date(d + 'T12:00:00'), o = { weekday: 'short', day: 'numeric', month: 'numeric' }; if (t.getFullYear() !== new Date().getFullYear()) o.year = '2-digit'; return new Intl.DateTimeFormat(LANG === 'he' ? 'he-IL' : 'en-GB', o).format(t).replace(',', ''); };
/* the card of the log in the profile: a scale that shows the last weight */
function bodyCardHTML() {
  const T = bodyTrend(S.cfg.me.body), last = T && T.last;
  return '<button class="card body-card" id="bodyBtn" type="button" aria-label="' + say('יומן הגוף', 'Body log') + (last ? ', ' + fmtKg(last.kg) + say(' קילו', ' kg') : '') + '">' + scaleSVG(last ? fmtKg(last.kg) : '') +
    '<span class="bd-t"><b>' + say('יומן הגוף', 'Body log') + '</b><small>' + (last ? say('נשקלת ', 'Weighed ') + ago(Date.parse(last.d + 'T12:00:00')) : say('מתעדים כמה שוקלים בכל יום', 'What you weigh, day by day')) + '</small></span>' + ICON.fwd + '</button>';
}
/* the line of the weights, the newest at the end */
function bodyChart(log) {
  const L = log.slice(-30); if (L.length < 2) return '';
  const lo = Math.min.apply(null, L.map((r) => r.kg)), hi = Math.max.apply(null, L.map((r) => r.kg)), span = Math.max(1, hi - lo), W = 300, H = 84;
  const pt = L.map((r, i) => [+(8 + (i / (L.length - 1)) * (W - 16)).toFixed(1), +(12 + (1 - (r.kg - lo) / span) * (H - 26)).toFixed(1)]), line = pt.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(''), end = pt[pt.length - 1];
  return '<svg class="bd-chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + say('גרף המשקל', 'The weight chart') + '"><path d="' + line + 'L' + end[0] + ' ' + H + 'L' + pt[0][0] + ' ' + H + 'Z" class="bd-area"/><path d="' + line + '" class="bd-line"/><circle cx="' + end[0] + '" cy="' + end[1] + '" r="4.5" class="bd-dot"/></svg>';
}
const bdNew = (d) => { const b = S.cfg.me.body, r = b.log.find((x) => x.d === d), last = b.log[b.log.length - 1]; return { d, kg: r ? fmtKg(r.kg) : last ? fmtKg(last.kg) : '', fat: r && r.fat != null ? String(r.fat) : '', waist: r && r.waist != null ? String(r.waist) : '', n: (r && r.n) || '', h: b.h ? String(b.h) : '', more: !!(r && (r.fat != null || r.waist != null || r.n)), had: !!r }; };
/* what is typed is kept before the sheet is drawn again */
function bdRead() { const B = S.bd; if (!B) return; for (const k of ['kg', 'fat', 'waist', 'n', 'h']) { const el = $('#bd_' + k); if (el) B[k] = el.value; } }
function renderBody() {
  const B = S.bd || (S.bd = bdNew(isoDay(new Date()))), body = S.cfg.me.body, sh = $('#sheet'), old = $('.sheet-in', sh), top = old ? old.scrollTop : 0, today = isoDay(new Date()), T = bodyTrend(body), g = bodyGirl();
  const fld = (k, label, unit, mode, max) => '<label class="bd-f"><span>' + label + '</span><input id="bd_' + k + '" type="text" inputmode="' + mode + '" maxlength="' + max + '" autocomplete="off" value="' + esc(B[k]) + '">' + (unit ? '<small>' + unit + '</small>' : '') + '</label>';
  const trend = !T || T.month == null ? '' : '<p class="bd-trend ' + (T.month < 0 ? 'down' : T.month > 0 ? 'up' : '') + '">' + (T.month < 0 ? say('ירדת ' + fmtKg(-T.month) + ' קילו בחודש האחרון', 'Down ' + fmtKg(-T.month) + ' kg in the last month') : T.month > 0 ? say('עלית ' + fmtKg(T.month) + ' קילו בחודש האחרון', 'Up ' + fmtKg(T.month) + ' kg in the last month') : say('אותו משקל כמו לפני חודש', 'The same weight as a month ago')) + '</p>';
  const rows = body.log.slice().reverse().slice(0, 60).map((r, i, a) => { const prev = a[i + 1], dl = prev ? Math.round((r.kg - prev.kg) * 10) / 10 : 0;
    return '<li><button class="bd-r' + (r.d === B.d ? ' cur' : '') + '" type="button" data-bdrow="' + r.d + '" aria-label="' + bodyDay(r.d) + ', ' + fmtKg(r.kg) + say(' קילו, עריכה', ' kg, edit') + '"><span class="bd-d">' + (r.d === today ? say('היום', 'Today') : bodyDay(r.d)) + '</span><b>' + fmtKg(r.kg) + '<small>' + say('קילו', 'kg') + '</small></b>' +
      '<span class="bd-dl' + (dl < 0 ? ' down' : dl > 0 ? ' up' : '') + '">' + (dl ? (dl < 0 ? '▼ ' : '▲ ') + fmtKg(Math.abs(dl)) : '') + '</span>' +
      (r.fat != null || r.waist != null || r.n ? '<span class="bd-x">' + (r.fat != null ? '<i>' + fmtKg(r.fat) + say(' אחוז שומן', '% fat') + '</i>' : '') + (r.waist != null ? '<i>' + say('מותניים ', 'Waist ') + fmtKg(r.waist) + '</i>' : '') + (r.n ? '<i>' + esc(r.n) + '</i>' : '') + '</span>' : '') + '</button></li>'; }).join('');
  sh.innerHTML = '<div class="sheet-in bd" role="dialog" aria-modal="true" aria-label="' + say('יומן הגוף', 'Body log') + '"><div class="ed-h"><div><p class="kicker">' + say('יומן הגוף', 'Body log') + '</p><h2>' +
    (B.d === today ? (g ? say('כמה את שוקלת היום', 'What do you weigh today') : say('כמה אתה שוקל היום', 'What do you weigh today')) : say('כמה שקלת ביום הזה', 'What did you weigh that day')) + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    '<div class="bd-top"><span class="bd-scale" id="bdScale">' + scaleSVG(esc(B.kg)) + '</span>' +
    '<div class="bd-in"><div class="bd-kg"><button type="button" class="tq-st" data-bdst="-0.1" aria-label="' + say('100 גרם פחות', '100 grams less') + '">−</button><label class="tq-in"><input id="bd_kg" type="text" inputmode="decimal" maxlength="5" autocomplete="off" value="' + esc(B.kg) + '" aria-label="' + say('משקל בקילו', 'Weight in kg') + '"><span>' + say('קילו', 'kg') + '</span></label><button type="button" class="tq-st" data-bdst="0.1" aria-label="' + say('100 גרם יותר', '100 grams more') + '">+</button></div>' +
    '<label class="bd-date"><span>' + say('תאריך', 'Date') + '</span><input id="bdDate" type="date" max="' + today + '" value="' + B.d + '"></label></div></div>' +
    (B.more ? '<div class="bd-more">' + fld('fat', say('אחוז שומן', 'Body fat'), say('אחוז', '%'), 'decimal', 4) + fld('waist', say('היקף מותניים', 'Waist'), say('סנטימטר', 'cm'), 'decimal', 5) + fld('h', say('גובה', 'Height'), say('סנטימטר', 'cm'), 'numeric', 3) + fld('n', say('הערה', 'Note'), '', 'text', 80) + '</div>'
      : '<button class="link bd-more-b" id="bdMore" type="button">' + say('עוד פרטים', 'More details') + '</button>') +
    '<div class="bd-act"><button class="btn primary big" id="bdSave" type="button">' + say('שמור', 'Save') + '</button>' + (B.had ? '<button class="btn danger" id="bdDel" type="button">' + say('מחק את היום הזה', 'Delete this day') + '</button>' : '') + '</div>' +
    (body.log.length ? '<section class="bd-hist"><h3>' + say('מה שתיעדת', 'What you logged') + '<small>' + cnt(body.log.length, 'ימים', 'יום אחד', 'days', 'day') + '</small></h3>' + bodyChart(body.log) + trend + '<ul class="bd-rows">' + rows + '</ul></section>'
      : '<p class="ks-none">' + say('עוד אין כלום ביומן השקילה הראשונה מתחילה את הגרף', 'Nothing in the log yet. Your first weigh-in starts the chart') + '</p>') + '</div>';
  const inS = $('.sheet-in', sh); inS.scrollTop = top;
  inS.addEventListener('input', (ev) => { if (ev.target.id === 'bd_kg') { const t = $('#bdScale text'); if (t) t.textContent = ev.target.value.slice(0, 5); } });
  inS.addEventListener('change', (ev) => { if (ev.target.id !== 'bdDate') return; const d = ev.target.value; if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > today) { ev.target.value = B.d; return; } bdRead(); const keep = S.bd.more; S.bd = bdNew(d); S.bd.more = S.bd.more || keep; renderBody(); });
}
function openBody() { S.sheet = 'body'; S.bd = bdNew(isoDay(new Date())); renderBody(); $('#sheet').hidden = false; }
function bodySave() {
  bdRead(); const B = S.bd, me = S.cfg.me, kg = num(B.kg);
  if (kg == null || kg < 20 || kg > 400) { haptic('warn'); toast(say('<b>צריך לכתוב משקל במספרים</b>', '<b>Type your weight as a number</b>')); const el = $('#bd_kg'); if (el) el.focus(); return; }
  const row = { d: B.d, kg }, fat = num(B.fat), waist = num(B.waist), h = num(B.h, true);
  if (fat != null) row.fat = fat; if (waist != null) row.waist = waist; if (B.n.trim()) row.n = B.n.trim();
  me.body = bodyPut(h != null && h >= 100 && h <= 250 ? { h, log: me.body.log } : me.body, row); saveCfg();
  S.bd = bdNew(B.d); feel('coin', 'success'); renderMe(); renderBody(); toast(say('<b>נשמר ביומן</b>', '<b>Saved to the log</b>'));
}
function bodyClick(ev) {
  if (S.sheet !== 'body') return false;
  const stp = ev.target.closest('[data-bdst]'); if (stp) { bdRead(); const v = num(S.bd.kg); S.bd.kg = fmtKg(Math.round(clamp((v == null ? 70 : v) + +stp.dataset.bdst, 20, 400) * 10) / 10); haptic('select'); renderBody(); return true; }
  const row = ev.target.closest('[data-bdrow]'); if (row) { S.bd = bdNew(row.dataset.bdrow); S.bd.more = true; renderBody(); $('.sheet-in', $('#sheet')).scrollTop = 0; return true; }
  if (ev.target.closest('#bdMore')) { bdRead(); S.bd.more = true; renderBody(); return true; }
  if (ev.target.closest('#bdSave')) { bodySave(); return true; }
  if (ev.target.closest('#bdDel')) { const me = S.cfg.me; me.body = bodyDrop(me.body, S.bd.d); saveCfg(); S.bd = bdNew(isoDay(new Date())); renderMe(); renderBody(); toast(say('<b>נמחק מהיומן</b>', '<b>Deleted from the log</b>')); return true; }
  return false;
}
/* ---- the journey: the levels as a road, from the first to the hundredth. Every stop is a level that opens something, and on the
   wide sides of the road stands the player's own character, dressed as it will be there ---- */
const J_PITCH = 128, J_HEAD = 104;
/* the journey crosses four worlds, each with its levels, its name and the colour of its land. The last climbs to the summit */
const WORLDS = [{ to: 10, he: 'הצעדים הראשונים', en: 'First steps' }, { to: 20, he: 'בונים כוח', en: 'Building strength' }, { to: 50, he: 'דרגות האלופים', en: 'The champion ranks' }, { to: 100, he: 'אל הפסגה', en: 'To the summit' }];
const worldOf = (at) => { const k = WORLDS.findIndex((w) => at <= w.to); return k < 0 ? WORLDS.length - 1 : k; };
const toGo = (n) => (n === 1 ? say('עוד רמה אחת', '1 level to go') : say('עוד ' + n + ' רמות', n + ' levels to go'));
const CROWN = '<svg class="jr-crown" viewBox="0 0 26 18" aria-hidden="true"><path d="M2.5 15.5L1.5 3.5l6.5 4.6L13 1.5l5 6.6 6.5-4.6-1 12z" fill="#FFD23F" stroke="#C98F1C" stroke-width="1.4" stroke-linejoin="round"/><circle cx="13" cy="10.6" r="1.8" fill="#D7263D"/></svg>';
function renderJourney(P) {
  P = P || meNow();
  const L = P.L, lvl = L.lvl, top = REWARDS[REWARDS.length - 1].at, nx = nextReward(lvl), N = REWARDS.length;
  const cap = (a, b) => '<figcaption><b>' + a + '</b><span>' + b + '</span></figcaption>';
  /* the map, world after world, top to bottom: each world opens with its sign, then its levels, then a hill down into the next */
  const pos = []; let y = 0, bands = '', signs = '', stops = '', trail = '';
  WORLDS.forEach((W, k) => {
    const items = REWARDS.map((r, i) => i).filter((i) => worldOf(REWARDS[i].at) === k), from = k ? WORLDS[k - 1].to + 1 : 1, y0 = y, last = k === WORLDS.length - 1;
    const got = items.filter((i) => lvl >= REWARDS[i].at).length, here = items.some((i) => nx && REWARDS[i].at === nx.at);
    y += J_HEAD;
    items.forEach((i, n) => { pos[i] = { x: REWARDS[i].at === top ? 50 : 50 + STOP_X[i % 4] * AMP, y }; y += n < items.length - 1 ? J_PITCH : 0; });
    y += last ? 330 : 168;
    signs += '<div class="jr-sign' + (got === items.length ? ' done' : here ? ' here' : '') + '" style="top:' + (y0 + 22) + 'px"><small>' + say('עולם ' + (k + 1) + ' · רמות ' + from + '–' + W.to, 'World ' + (k + 1) + ' · levels ' + from + '–' + W.to) + '</small><b>' + say(W.he, W.en) + '</b>' +
      '<span class="jr-got" aria-label="' + say(got + ' מתוך ' + items.length + ' נפתחו', got + ' of ' + items.length + ' open') + '">' + (got === items.length ? ICON.check : got + say(' מתוך ', ' of ') + items.length) + '</span></div>';
    bands += '<div class="jr-band b' + k + '" style="top:' + y0 + 'px;height:' + (y - y0 + 1) + 'px" aria-hidden="true">' + (last
      ? '<svg class="jr-peak" style="top:' + (pos[items[items.length - 1]].y - y0 + 112) + 'px" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 100V72L16 52L27 62L50 0L73 60L85 47L100 70V100Z" fill="#3B2C90"/><path d="M50 0L41.5 25L46.5 21L50 28L53.5 21L58.5 25Z" fill="#F4F2FF"/><path d="M0 100V86Q22 72 46 84T100 80V100Z" fill="#1B1347"/></svg>'
      : '<svg class="jr-hill" viewBox="0 0 100 40" preserveAspectRatio="none"><path class="bk" d="M0 40V22Q16 6 34 16T66 14T100 18V40Z"/><path class="f" d="M0 40V30Q20 18 42 28T78 24T100 28V40Z"/></svg>') + '</div>';
  });
  const H = y;
  REWARDS.forEach((r, i) => {
    const x = pos[i].x, s = lvl >= r.at ? 'done' : nx && nx.at === r.at ? 'next' : 'later', side = STOP_X[i % 4] > 0 ? 'l' : r.at === top ? 'r' : STOP_X[i % 4] < 0 ? 'r' : i % 8 < 4 ? 'r' : 'l';
    stops += '<li class="stop ' + s + ' j' + worldOf(r.at) + (r.at === top ? ' top' : '') + '" style="top:' + pos[i].y + 'px;left:' + x + '%;--i:' + Math.min(i, 6) + '">' +
      '<button class="lv" type="button" data-lv="' + r.at + '" aria-label="' + say('רמה ', 'Level ') + r.at + ': ' + nm(r) + (s === 'done' ? say(', הושג', ', reached') : '') + '">' +
      (s === 'next' ? '<span class="go-chip" aria-hidden="true">' + toGo(r.at - lvl) + '</span>' : '') + (r.at === top ? CROWN : '') + '<span class="dot' + (RANKS.some((k) => k.at === r.at) ? ' rk' : '') + '" aria-hidden="true">' + (RANKS.some((k) => k.at === r.at) ? medalSVG(rankOf(r.at).i) : s === 'done' ? ICON.check : r.at) + '</span><b>' + nm(r) + '</b></button>' +
      /* the lifter stands at the stop that is next; at every second stop beside it, the character as it will look at that level */
      (s === 'next' ? palHTML(side, avatar(lvl, { still: true }), say('אתה כאן', 'You are here'), 'me') : i % 2 && r.at !== top ? palHTML(side, avatar(r.at, { still: true }), '', 'pv') : '') + '</li>';
    if (i < N - 1) trail += trailSeg(x, pos[i].y + 38, pos[i + 1].x, pos[i + 1].y + 38, lvl >= REWARDS[i + 1].at);
  });
  $('#journey').innerHTML = '<section class="jr-top" aria-label="' + say('המסע שלי', 'My journey') + '"><div class="jr-rank">' + medalSVG(P.rank.i) + '<div><p class="jr-k">' + say('המסע שלך', 'Your journey') + '</p><h1>' + nm(P.rank) + '</h1></div><span class="lv-badge">' + say('רמה ', 'Level ') + lvl + '</span></div>' +
    '<div class="jr-lv">' + xpBar(pctOf(L)) + '<span class="jr-nx" aria-hidden="true">' + (lvl + 1) + '</span></div>' +
    '<p class="jr-line">' + say('עוד ' + nf(L.need - L.into) + ' נקודות לרמה ' + (lvl + 1), nf(L.need - L.into) + ' points to level ' + (lvl + 1)) + '</p>' +
    '<ol class="jr-ranks" aria-label="' + say('הדרגות', 'The ranks') + '">' + RANKS.map((k, i) => '<li class="' + (i < P.rank.i ? 'done' : i === P.rank.i ? 'cur' : '') + '">' + medalSVG(i) + '<b>' + nm(k) + '</b><small>' + say('רמה ', 'Level ') + k.at + '</small></li>').join('') + '</ol></section>' +
    '<section class="jr-map" aria-label="' + say('הפרסים בדרך', 'The prizes on the way') + '"><div class="jr-map-h"><h2>' + say('הפרסים בדרך', 'The prizes on the way') + '</h2></div>' +
    '<div class="jr-road" style="height:' + H + 'px">' + bands +
    '<div class="pw-road" style="height:' + H + 'px"><svg class="pw-trail" viewBox="0 0 100 ' + H + '" preserveAspectRatio="none" aria-hidden="true">' + trail + '</svg><ol>' + stops + '</ol></div>' + signs + '</div></section>' +
    (lvl >= top ? '' : '<section class="jr-goal" aria-label="' + say('המטרה', 'The goal') + '"><span class="jr-goal-fig" aria-hidden="true">' + avatar(top, { bust: true }) + '</span><div><b>' + say('רמה ' + top, 'Level ' + top) + '</b><small>' + toGo(top - lvl) + '</small></div></section>');
}
/* a stop of the journey, opened: the character as it will stand at that level */
function openLevel(at) {
  const r = REWARDS.find((x) => x.at === at); if (!r) return;
  const lvl = meNow().L.lvl, sh = $('#sheet');
  S.sheet = 'lv';
  sh.innerHTML = '<div class="sheet-in lvs" role="dialog" aria-modal="true" aria-label="' + say('רמה ', 'Level ') + at + '"><div class="ed-h"><div><p class="kicker">' + (lvl >= at ? say('כבר שלך', 'Already yours') : toGo(at - lvl)) + '</p><h2>' + say('רמה ', 'Level ') + at + '</h2></div>' +
    '<button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    '<div class="lvs-stage"><span class="lvs-fig">' + avatar(at, { flex: true }) + '</span></div><p class="lvs-t">' + glyph('gift') + '<span>' + nm(r) + '</span></p>' +
    '<button class="btn primary big" data-close="1" type="button">' + (lvl >= at ? say('סגור', 'Close') : say('ממשיכים לשם', 'On my way')) + '</button></div>';
  sh.hidden = false;
}
/* ---- settings. Every choice is saved at once. They stand in the order a lifter looks for them: me, my training, sound and touch,
   the code, my data, and at the foot, alone, the one thing that cannot be undone ---- */
const SET_I = {
  me: '<circle cx="12" cy="8.2" r="3.6"/><path d="M4.8 20c.8-4 3.6-6 7.2-6s6.4 2 7.2 6"/>',
  lang: '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2M12 3.4c2.7 2.5 2.7 14.7 0 17.2M12 3.4c-2.7 2.5-2.7 14.7 0 17.2"/>',
  exp: '<path d="M5.5 19.5V14M12 19.5V9M18.5 19.5V4.5"/>',
  goal: '<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.3"/><path d="M12 12h.01" stroke-width="3"/>',
  time: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3 2"/>',
  days: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  eq: '<path d="M6.5 8v8M3.5 10v4M17.5 8v8M20.5 10v4M6.5 12h11"/>',
  fb: '<path d="M5 5.5h14v10h-8.6L6.5 19v-3.5H5z"/>',
  sound: '<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3zM15.6 9.2a4 4 0 0 1 0 5.6M18.2 6.8a7.6 7.6 0 0 1 0 10.4"/>',
  buzz: '<rect x="8" y="3.5" width="8" height="17" rx="2.2"/><path d="M4.4 9v6M19.6 9v6"/>',
  pin: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  tour: '<circle cx="12" cy="12" r="8.6"/><path d="M15.4 8.6l-1.9 4.9-4.9 1.9 1.9-4.9z"/>',
  film: '<rect x="4" y="5.5" width="16" height="13" rx="2.5"/><path d="M10.2 9.4v5.2l4.4-2.6z"/>',
  del: '<path d="M5 7h14M9.5 7V4.8h5V7M7 7l.8 12.2h8.4L17 7M10.3 10.5v5.5M13.7 10.5v5.5"/>',
};
const setIcon = (k, tone) => '<span class="st-i' + (tone ? ' ' + tone : '') + '" aria-hidden="true"><svg class="i" viewBox="0 0 24 24">' + SET_I[k] + '</svg></span>';
/* the word that has to be typed to delete the account: the lifter's own name, or a plain word when there is none */
const delWord = () => S.cfg.me.name || say('מחק', 'delete');
const sameWord = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
function renderSettings() {
  const me = S.cfg.me, sh = $('#sheet'), old = $('.sheet-in', sh), pg = S.setPg || '', top = old && old.dataset.pg === pg ? old.scrollTop : 0;
  const x = '<button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button>';
  const page = (title, body) => '<div class="sheet-in st pg" data-pg="' + pg + '" role="dialog" aria-modal="true" aria-label="' + title + '"><div class="ed-h"><button class="fx-nav" type="button" data-setpg="" aria-label="' + say('חזרה להגדרות', 'Back to the settings') + '">' + ICON.back + '</button><div><h2>' + title + '</h2></div>' + x + '</div>' + body + '</div>';
  if (pg === 'del') { sh.innerHTML = page(say('מחיקת החשבון', 'Delete the account'), delPageHTML()); return; }
  const seg = (label, key, list, cur, ic, cls) => '<div class="st-row col"><div class="st-h">' + setIcon(ic) + '<span class="st-l">' + label + '</span></div><div class="seg' + (cls ? ' ' + cls : '') + '" role="group" aria-label="' + label + '">' +
    list.map((o) => '<button type="button" data-set="' + key + '" data-v="' + o[0] + '" aria-pressed="' + (Array.isArray(cur) ? cur.includes(o[0]) : o[0] === cur) + '">' + o[1] + '</button>').join('') + '</div></div>';
  const tog = (label, key, on, ic) => '<div class="st-row">' + setIcon(ic) + '<span class="st-l">' + label + '</span><button class="tog" type="button" role="switch" aria-checked="' + on + '" aria-label="' + label + '" data-set="' + key + '" data-v="' + (on ? 0 : 1) + '"><i></i></button></div>';
  const nav = (label, id, val, ic, tone, cls) => '<button class="st-row nav' + (cls ? ' ' + cls : '') + '" type="button" id="' + id + '">' + setIcon(ic, tone) + '<span class="st-l">' + label + '</span>' + (val ? '<small>' + val + '</small>' : '') + ICON.fwd + '</button>';
  const grp = (title, rows) => '<div class="st-grp"><h3 class="st-t">' + title + '</h3><section class="st-g">' + rows + '</section></div>';
  /* an answer about the gym or the time was changed on a plan the lifter had already made their own: the plan stays, and can be built again */
  const refit = !!S.setRefit && me.exp != null && planChanged();
  sh.innerHTML = '<div class="sheet-in st" data-pg="" role="dialog" aria-modal="true" aria-label="' + say('הגדרות', 'Settings') + '"><div class="ed-h"><div><h2>' + say('הגדרות', 'Settings') + '</h2></div>' + x + '</div>' +
    grp(say('אני', 'Me'), nav(say('הדמות והשם', 'Character and name'), 'setLook', me.name ? '<bdi>' + esc(me.name) + '</bdi>' : '', 'me') + seg(say('שפה', 'Language'), 'lang', LANGS, LANG, 'lang', '')) +
    grp(say('האימון שלי', 'My training'),
      seg(say('ניסיון', 'Experience'), 'exp', EXP().map((o, i) => [i, o[0]]), me.exp, 'exp') +
      seg(say('מטרות', 'Goals'), 'goals', GOAL_ORDER.map((i) => [i, GOALS()[i][0]]), me.goals, 'goal') +
      seg(say('אימונים בשבוע', 'Workouts a week'), 'days', DAYS_OK.map((d) => [d, '' + d]), me.days || 4, 'days') +
      seg(say('איפה מתאמנים', 'Where you train'), 'place', [[0, say('חדר כושר', 'Gym')], [1, say('גינת כושר', 'Park')], [2, say('בית ומשקולות', 'Home, dumbbells')], [3, say('בית', 'Home')]], me.place == null ? 0 : me.place, 'place') +
      '') +
    (refit ? '<div class="st-note" role="status"><span>' + say('התשובות השתנו והתוכנית נשארה כפי ששינית אותה', 'The answers changed, and the plan stays as you changed it.') + '</span><button class="btn" id="setRefit" type="button">' + say('לבנות את התוכנית מחדש', 'Build the plan again') + '</button></div>' : '') +
    grp(say('צליל ומגע', 'Sound and touch'), tog(say('צליל', 'Sound'), 'sound', !!S.sound, 'sound') + tog(say('רטט', 'Vibration'), 'buzz', S.buzz !== false, 'buzz')) +
    grp(say('גיבוי', 'Backup'), '<section class="backup" id="backup" aria-label="' + say('גיבוי', 'Backup') + '"></section>') +
    grp(say('עוד', 'More'), nav(say('סיור באפליקציה', 'A tour of the app'), 'tourAgain', '', 'tour', 'calm') + nav(say('מסך הפתיחה', 'The opening screens'), 'obAgain', '', 'film', 'calm')) +
    '<section class="st-g"><button class="st-row nav red" type="button" id="delAsk">' + setIcon('del', 'red') + '<span class="st-l">' + say('מחיקת החשבון', 'Delete the account') + '</span>' + ICON.fwd + '</button></section></div>';
  $('.sheet-in', sh).scrollTop = top; renderBackup();
}
function openSettings() { S.sheet = 'set'; S.backupNote = ''; S.setPg = null; S.del = null; S.setRefit = false; renderSettings(); $('#sheet').hidden = false; }
/* an answer that shapes the plan was changed. A plan that is still the one the app built follows the new answers at once; one the
   lifter changed by hand stays, and the settings offer to build it again (see renderSettings) */
function setAnswer(key, v) {
  const me = S.cfg.me, clean = me.exp != null && !planChanged();
  if (key === 'goals') { const g = me.goals.includes(v) ? me.goals.filter((x) => x !== v) : me.goals.concat(v).sort(); if (!g.length) return; me.goals = g; me.goal = g[0]; }
  else me[key] = v;
  if (key === 'exp') applyExp();
  /* another number of days is another week: the next workout is the first of it, unless one is under way */
  if (key === 'days' && !live(S.tab)) S.tab = nextUp().next;
  if (me.exp != null && key !== 'fb') { if (clean) resetPlan(); S.setRefit = planChanged(); }
  saveCfg(); renderAll();
}
/* ---- deleting the account: said plainly, and confirmed by typing a word ---- */
function delPageHTML() {
  const D = S.del || (S.del = { v: '', busy: false, note: '' }), word = delWord();
  return '<div class="st-del"><span class="st-del-i" aria-hidden="true"><svg class="i" viewBox="0 0 24 24">' + SET_I.del + '</svg></span><h3>' + say('למחוק את החשבון', 'Delete the account?') + '</h3>' +
    '<p>' + say('כל האימונים הדמות המטבעות וההגדרות יימחקו מהמכשיר הזה ומהחשבון אי אפשר לבטל את זה', 'Every workout, the character, the coins and the settings will be erased from this device and from the account. This cannot be undone.') + '</p>' +
    (S.dl ? '<button class="link" id="backupBtn" type="button">' + say('קודם לשמור גיבוי לקובץ', 'Save a backup file first') + '</button>' : '') +
    '<label for="delName">' + say('כדי לאשר כותבים כאן ', 'To confirm, type: ') + '<b><bdi>' + esc(word) + '</bdi></b></label>' +
    '<input id="delName" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="24" value="' + esc(D.v) + '">' +
    (D.note ? '<p class="st-del-n" role="status">' + D.note + '</p>' : '') +
    '<button class="btn danger big" id="delYes" type="button"' + (D.busy || !sameWord(D.v, word) ? ' disabled' : '') + '>' + (D.busy ? say('מוחק…', 'Deleting…') : say('מחיקה לצמיתות', 'Delete for good')) + '</button>' +
    '<button class="btn big" data-setpg="" type="button">' + say('ביטול', 'Cancel') + '</button></div>';
}
const WIPE_FAIL = () => say('המחיקה לא הושלמה אין חיבור לחשבון אפשר לנסות שוב כשיש חיבור', 'The deletion did not finish: the account could not be reached. Try again once you are connected.');
function delNow() {
  const D = S.del; if (!D || D.busy || !sameWord(D.v, delWord())) return;
  D.busy = true; D.note = ''; renderSettings();
  wipeAccount().then((ok) => { if (ok) { afterWipe(); return; } D.busy = false; D.note = WIPE_FAIL(); if (S.sheet === 'set') renderSettings(); });
}
/* the account is gone: the page starts over where a new lifter starts, in the language it was in */
function afterWipe() {
  chat.msgs = []; chat.turns = []; S.setPg = null; S.del = null; S.bdgAll = false;
  if (window.gymiNative && typeof window.gymiNative.forget === 'function') window.gymiNative.forget();
  if (!$('#sheet').hidden) closeSheet();
  closeChat(); applyLang(); setView('home'); renderAll(); renderMsgs(); maybeOb();
}
/* ---- the character editor: name and looks; every choice is saved at once. One kind of choice is on screen at a time,
   picked from a row of tabs, so that the whole editor fits on one screen with the character above it ---- */
const LK = { tab: 'skin', busy: false, note: '' };
const LOOK_TABS = () => [['body', say('דמות', 'Figure')], ['skin', say('עור', 'Skin')], ['hair', say('תספורת', 'Haircut')], ['hc', say('צבע שיער', 'Hair colour')]].concat(S.cfg.me.look.body === 1 ? [] : [['beard', say('זקן', 'Beard')]]).concat([['shirt', say('חולצה', 'Shirt')]]);
/* a T-shirt, for the shirt colours: a colour is easier to choose on the thing it colours */
const TEE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 3.6c.7 1.3 1.9 2 3.4 2s2.7-.7 3.4-2l5.1 2.3-1.9 4.3-2.3-.9v11.2H7.7V9.3l-2.3.9-1.9-4.3z"/></svg>';
function lookRows() {
  const k = S.cfg.me.look, tabs = LOOK_TABS(), cur = tabs.find((t) => t[0] === LK.tab) || tabs[0], key = cur[0], label = cur[1];
  /* each colour says what it is the colour of: 'Shirt 3', not 'Option 3' three times over */
  const sw = (list, hex) => '<div class="lk-opts" style="--n:' + list.length + '">' + list.map((c, i) => '<button type="button" class="lk-sw" data-look="' + key + '" data-v="' + i + '" aria-pressed="' + (k[key] === i) + '" aria-label="' + label + ' ' + (i + 1) + '" style="--c:' + hex(c) + '"></button>').join('') + '</div>';
  const face = (look, i, name) => '<button type="button" class="lk-cut" data-look="' + key + '" data-v="' + i + '" aria-pressed="' + (k[key] === i) + '"><span class="lk-face" aria-hidden="true">' + avatarSVG(look, 1, { bust: true }) + '</span><small>' + name + '</small></button>';
  let body;
  if (key === 'body') body = '<div class="lk-cuts two">' + BODY().map((t, i) => '<button type="button" class="lk-cut lk-bod" data-look="body" data-v="' + i + '" aria-pressed="' + ((k.body | 0) === i) + '"><span class="lk-face" aria-hidden="true">' + avatarSVG(bodyLook(k, i), 1, { still: true }) + '</span><small>' + t + '</small></button>').join('') + '</div>';
  else if (key === 'skin') body = sw(SKIN, (c) => c[0]);
  else if (key === 'hair') body = '<div class="lk-cuts">' + (k.body === 1 ? HAIR_ORDER_F : HAIR_ORDER).map((i) => face(Object.assign({}, k, { hair: i }), i, hairName(i))).join('') + '</div>';
  else if (key === 'hc') body = sw(HAIRC, (c) => c);
  else if (key === 'beard') body = '<div class="lk-cuts three">' + BEARDS().map((t, i) => face(Object.assign({}, k, { beard: i }), i, t)).join('') + '</div>';
  else body = '<div class="lk-tees">' + SHIRT.map((c, i) => '<button type="button" class="lk-tee" data-look="shirt" data-v="' + i + '" aria-pressed="' + (k.shirt === i) + '" aria-label="' + label + ' ' + (i + 1) + '" style="--c:' + c + '">' + TEE + '</button>').join('') + '</div>';
  return '<div class="lk-tabs" role="tablist" aria-label="' + say('מה לשנות', 'What to change') + '">' + tabs.map((t) => '<button type="button" role="tab" data-lktab="' + t[0] + '" aria-selected="' + (t[0] === key) + '">' + t[1] + '</button>').join('') + '</div>' +
    '<div class="lk-pane" role="tabpanel" aria-label="' + label + '">' + body + '</div>';
}
/* the button that makes the character from a photo: only where Eilon can be shown one */
const CAM = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.6-2.2h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.4"/></svg>';
function lookPhoto() {
  if (!chat.canImg) return '';
  return '<button type="button" class="lk-photo" id="lkPhoto"' + (LK.busy ? ' disabled' : '') + '>' + (LK.busy ? '<i class="spin" aria-hidden="true"></i>' + say('מסתכל…', 'Looking…') : CAM + say('ליצור מתמונה', 'Make it from a photo')) + '</button>' +
    '<p class="lk-note" id="lkNote" role="status"' + (LK.note ? '' : ' hidden') + '>' + (LK.note || '') + '</p>';
}
function lookTab(t) { LK.tab = t; const box = $('#lkRows'); if (box) box.innerHTML = lookRows(); haptic('select'); }
function lookDraw(pump) {
  const st = $('#lkStage'), rows = $('#lkRows'), ph = $('#lkPhotoBox');
  if (st) { st.innerHTML = avatar(S.lvl || 1); if (pump) { st.classList.remove('pump'); void st.offsetWidth; st.classList.add('pump'); } }
  if (rows) rows.innerHTML = lookRows();
  if (ph) ph.innerHTML = lookPhoto();
  if (player.cv && !player.playing) paintStage(player.lastT);
}
function openLook() {
  const me = S.cfg.me, sh = $('#sheet');
  S.sheet = 'look'; LK.note = '';
  sh.innerHTML = '<div class="sheet-in lk" role="dialog" aria-modal="true" aria-label="' + say('הדמות שלי', 'My character') + '"><div class="ed-h"><div><h2>' + say('הדמות שלי', 'My character') + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    '<div class="lk-stage" id="lkStage">' + avatar(S.lvl || 1) + '</div><div class="lk-photo-box" id="lkPhotoBox">' + lookPhoto() + '</div>' +
    '<label class="lk-row" for="lkName"><span>' + say('שם', 'Name') + '</span><input id="lkName" type="text" dir="auto" maxlength="16" autocomplete="off" placeholder="' + say('השם שלך', 'Your name') + '" value="' + esc(me.name) + '"></label>' +
    '<div class="lk-ed" id="lkRows">' + lookRows() + '</div><button class="btn primary big" data-close="1" type="button">' + say('סיום', 'Done') + '</button></div>';
  sh.hidden = false;
}
/* a look as it becomes with a figure chosen: a girl keeps no beard, and the plain short cut she started with becomes a ponytail */
function bodyLook(k, v) { const o = Object.assign({}, k, { body: v }); if (v === 1) { o.beard = 0; if (k.body !== 1 && k.hair === 1) o.hair = 9; } return o; }
function setLook(key, v) {
  const me = S.cfg.me; if (!(key in me.look)) return;
  if (key === 'body') { if ((me.look.body | 0) === v) return; Object.assign(me.look, bodyLook(me.look, v)); me.made = me.made || Date.now(); saveCfg(); lookDraw(true); return; }
  me.look[key] = v; me.made = me.made || Date.now(); saveCfg();
  lookDraw(false);
}
/* ---- the character from a photo: Eilon looks at it once and picks the closest of each choice. The photo is not kept ---- */
const LOOK_ASK = 'You are setting up a simple cartoon avatar for a fitness app. Look at the main person in the photo and pick the closest option in each list. ' +
  'Reply with one line of JSON and nothing else: {"body":N,"skin":N,"hair":N,"hc":N,"beard":N}\n' +
  'body, the figure: 0 a man or a boy, 1 a woman or a girl.\n' +
  'skin, the tone from light to deep: 0 very fair, 1 fair, 2 light tan, 3 tan or olive, 4 brown, 5 deep brown.\n' +
  'hair, the cut: 0 bald or shaved, 1 short, 2 swept up, 3 curly, 4 long and loose (past the chin), 5 a fringe over the forehead, 6 buzz cut, 7 side part, 8 medium (over the ears), 9 a ponytail, 10 a bun on top, 11 two braids, 12 a bob (to the chin), 13 an afro, 14 a mohawk, 15 two pigtails.\n' +
  'hc, the hair colour: 0 black, 1 dark brown, 2 brown, 3 light brown, 4 dark blond, 5 blond, 6 red or ginger, 7 grey or white.\n' +
  'beard: 0 none, 1 stubble or a short beard, 2 a full beard (always 0 for body 1).\n' +
  'If no person can be seen in the photo, reply {"none":true}.';
async function lookFromPhoto(file) {
  if (!file || LK.busy) return;
  const say2 = (t) => { LK.note = t || ''; const ph = $('#lkPhotoBox'); if (ph) ph.innerHTML = lookPhoto(); };
  LK.busy = true; say2('');
  try {
    const blob = await shrinkImage(file, 1024), sample = await chat.sampleP;
    if (!sample) throw new Error('no coach');
    const res = await sample([{ role: 'user', content: LOOK_ASK }], { cache: false, images: [blob] });
    const m = String((res && res.text) || '').match(/\{[^{}]*\}/); let o = null;
    try { o = m ? JSON.parse(m[0]) : null; } catch (e) { o = null; }
    LK.busy = false;
    if (o && o.none) { say2(say('לא מצאתי פנים בתמונה אפשר לנסות תמונה אחרת', 'I could not find a face in the photo. Try another one.')); return; }
    const me = S.cfg.me, lim = { body: 2, skin: SKIN.length, hair: HAIR.length, hc: HAIRC.length, beard: BEARD.length }; let n = 0;
    if (o) for (const key of Object.keys(lim)) if (Number.isInteger(o[key]) && o[key] >= 0 && o[key] < lim[key]) { me.look[key] = o[key]; n++; }
    if (me.look.body === 1) me.look.beard = 0;
    if (!o || !n) { say2(say('לא הצלחתי לקרוא את התמונה אפשר לנסות שוב', 'I could not read the photo. Try again.')); return; }
    me.made = me.made || Date.now(); saveCfg(); LK.note = say('הנה אפשר לשנות כל פרט', 'There. Every detail can still be changed.'); lookDraw(true); feel('set', 'success');
  } catch (e) {
    LK.busy = false; say2(say('לא הצלחתי לקרוא את התמונה כרגע אפשר לבחור ידנית', 'I could not read the photo right now. You can choose by hand.'));
  }
}
function setName(v) { const me = S.cfg.me, n = String(v || '').trim().slice(0, 16); if (n === me.name) return; me.name = n; me.made = me.made || Date.now(); saveCfg(); }
/* clicks and typing inside the sheet that belong to this file; returns true when the click was handled */
function meSheetClick(ev) {
  if (bodyClick(ev)) return true;
  const lk = ev.target.closest('[data-look]'); if (lk) { setLook(lk.dataset.look, +lk.dataset.v); return true; }
  const tb = ev.target.closest('[data-lktab]'); if (tb) { lookTab(tb.dataset.lktab); return true; }
  if (ev.target.closest('#lkPhoto')) { $('#lkFile').click(); return true; }
  const opn = ev.target.closest('[data-open]'); if (opn) { boxOpenNow(+opn.dataset.open, false); return true; }
  const bxb = ev.target.closest('[data-box]'); if (bxb) { boxOpenNow(+bxb.dataset.box, true); return true; }
  const wkb = ev.target.closest('[data-week]'); if (wkb) { weekBuyNow(+wkb.dataset.week); return true; }
  if (ev.target.closest('[data-shield]')) { shieldBuyNow(); return true; }
  const thing = ev.target.closest('[data-shop]'); if (thing) { shopTap(thing.dataset.shop); return true; }
  const shelfB = ev.target.closest('[data-shelf]'); if (shelfB) { S.shelf = shelfB.dataset.shelf; haptic('select'); renderShop(); return true; }
  if (S.sheet !== 'set') return false;
  const pg = ev.target.closest('[data-setpg]'); if (pg) { S.setPg = pg.dataset.setpg || null; S.del = null; renderSettings(); return true; }
  const b = ev.target.closest('button'); if (!b) return false;
  const k = b.dataset.set, v = b.dataset.v;
  if (b.id === 'obAgain') { closeSheet(); openOb(); }
  else if (b.id === 'tourAgain') { closeSheet(); setTimeout(startTour, 380); }
  else if (b.id === 'setLook') { closeSheet(); openLook(); }
  else if (b.id === 'delAsk') { S.del = { v: '', busy: false, note: '' }; S.setPg = 'del'; renderSettings(); }
  else if (b.id === 'delYes') delNow();
  else if (b.id === 'setRefit') { resetPlan(); S.setRefit = false; renderAll(); toast(ICON.check + '<b>' + say('התוכנית נבנתה מחדש', 'The plan was built again') + '</b>'); }
  else if (b.id === 'backupBtn') exportBackup();
  else if (b.id === 'restoreBtn') $('#restoreFile').click();
  else if (b.id === 'exportBtn') exportCsv();
  else if (k === 'lang') { if (v !== LANG) langFade(() => setLang(v)); }
  else if (k === 'sound') { S.sound = v === '1'; saveLocal(); if (S.sound) sfx('set'); renderSettings(); }
  else if (k === 'buzz') { S.buzz = v === '1'; saveLocal(); if (HX.on) document.documentElement.dataset.hx = S.buzz ? 'on' : 'off'; haptic('success'); renderSettings(); }
  else if (k === 'exp' || k === 'goals' || k === 'days' || k === 'place' || k === 'fb') setAnswer(k, +v);
  else return false;
  return true;
}
function meSheetChange(ev) { if (ev.target.id === 'lkName') setName(ev.target.value); }

/* ---- rewards: a short note when the level climbs mid-workout, and the celebration at the end ---- */
let toastT = 0;
function toast(html) {
  const el = $('#toast'); el.innerHTML = html; el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2800);
}
function chime() {
  if (!S.sound || !actx) return;
  try {
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = actx.createOscillator(), gn = actx.createGain(), t = actx.currentTime + i * 0.11;
      o.type = 'sine'; o.frequency.value = f;
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.08, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + (i === 3 ? 0.5 : 0.18));
      o.connect(gn); gn.connect(actx.destination); o.start(t); o.stop(t + 0.55);
    });
  } catch (e) { /* no audio here */ }
}
function levelUp(lvl) { toast(glyph('star') + '<b>' + say('רמה ', 'Level ') + lvl + '!</b>'); chime(); haptic('heavy'); }
/* call after a change that may have earned points, with the level from before it */
function bump(lv0) { if (lv0 && S.lvl > lv0) levelUp(S.lvl); }
/* paper confetti over a sheet: a short burst that falls and stops by itself */
function confetti(cv, n) {
  if (!cv || reduced) return;
  const g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight, cs = getComputedStyle(document.documentElement);
  cv.width = W * dpr; cv.height = H * dpr; g.scale(dpr, dpr);
  const cols = ['--w0', '--w1', '--w2', '--accent-soft', '--gold', '--flame-2'].map((v) => cs.getPropertyValue(v).trim()), t0 = performance.now();
  const ps = Array.from({ length: n }, (_, i) => ({ x: W / 2 + (Math.random() - 0.5) * 60, y: H * 0.34, vx: (Math.random() - 0.5) * 9, vy: -5 - Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, w: 5 + Math.random() * 5, c: cols[i % cols.length] }));
  const step = (now) => {
    const t = now - t0; g.clearRect(0, 0, W, H);
    if (t > 2400 || !cv.isConnected) return;
    g.globalAlpha = Math.min(1, (2400 - t) / 500);
    for (const p of ps) { p.vy += 0.26; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); g.restore(); }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
/* a number that counts up to its value */
function countUp(el, to) {
  if (!el) return;
  if (reduced || !(to > 0)) { el.textContent = '+' + nf(to); return; }
  const t0 = performance.now(), step = (now) => { const k = Math.min(1, (now - t0) / 700); el.textContent = '+' + nf(to * (1 - Math.pow(1 - k, 3))); if (k < 1 && el.isConnected) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function wireMe() {
  $('#lkFile').addEventListener('change', (ev) => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; lookFromPhoto(f); });
  $('#profile').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.id === 'lookBtn') openLook();
    else if (b.id === 'setBtn') openSettings();
    else if (b.id === 'shopBtn' || b.id === 'shopWait') openShop();
    else if (b.id === 'bodyBtn') openBody();
    else if (b.id === 'bdgAll') { S.bdgAll = !S.bdgAll; renderProfile(); const again = $('#bdgAll'); if (again) again.focus({ preventScroll: true }); }
  });
  $('#journey').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-lv]'); if (b) openLevel(+b.dataset.lv); });
}
