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
  gear: '<circle cx="12" cy="12" r="3.1"/><path d="M12 2.9v2.5M12 18.6v2.5M21.1 12h-2.5M5.4 12H2.9M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4L5.6 5.6"/>',
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
    '<span class="p-txt"><b>' + (me.name ? say('היי, ', 'Hi, ') + '<bdi>' + esc(me.name) + '</bdi>' : say('היי!', 'Hi!')) + '</b><span class="p-rank"><span class="lv-badge">' + say('רמה ', 'Level ') + P.L.lvl + '</span>' + nm(P.rank) + '</span>' + xpBar(pctOf(P.L)) + '</span>' +
    (P.X.streak ? '<span class="p-streak" title="' + say('שבועות ברצף', 'Weeks in a row') + '">' + flameSVG() + '<b>' + P.X.streak + '</b></span>' : '') + '</button>';
}
function badgeHTML(b, on) { return '<li class="bdg' + (on ? ' on' : '') + '" aria-label="' + nm(b) + (on ? say(', הושג', ', earned') : say(', עוד לא', ', not yet')) + '"><span class="bdg-i">' + glyph(b.ic) + '</span><span>' + nm(b) + '</span></li>'; }
/* a coin of the kiosk */
const COIN = '<svg class="coin" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.6" fill="#F2B02E" stroke="#C98A12" stroke-width="1.6"/><path d="M10 5.5l1.35 2.75 3.05.45-2.2 2.15.5 3-2.7-1.45-2.7 1.45.5-3-2.2-2.15 3.05-.45z" fill="#C98A12"/></svg>';
/* the part of the figure that a thing of the kiosk is worn on, as a close view of the lifter's own character with that thing alone */
const CROP = { head: '56 4 88 88', eyes: '60 14 80 80', ears: '54 4 92 92', neck: '58 58 84 84', wrist: '104 112 80 80', hands: '104 124 80 80', feet: '56 176 88 88' };
const cropFig = (it, lvl) => avatarSVG(Object.assign({}, S.cfg.me.look, { wear: [it.id], gear: false }), lvl, { crop: CROP[it.slot], base: EXP_BASE[expNow()] || 0 });
/* the profile: the character on its stage with where it stands in the game, the kiosk, and the achievements, small */
function renderProfile(P) {
  P = P || meNow();
  const me = S.cfg.me, L = P.L, nx = nextReward(L.lvl), have = new Set(Object.keys(me.badges).concat(earned(P.T, P.X))), bal = coinsLeft(P.T.xp, me.shop);
  let si = 0; const stat = (v, k) => '<li style="--i:' + (si++) + '"><b>' + v + '</b><span>' + k + '</span></li>';
  /* the achievements in short: the last ones that were earned, then the next to go for. All of them are a tap away */
  const got = BADGES.filter((b) => have.has(b.id)), todo = BADGES.filter((b) => !have.has(b.id)), few = todo.length ? got.slice(-3).concat(todo).slice(0, 4) : got.slice(-4);
  /* the shelf in short: the next three things to buy; once everything is owned, the dearest three */
  const left = SHOP.filter((x) => !me.shop.own.includes(x.id)), peek = left.length ? left.slice(0, 3) : SHOP.slice(-3);
  $('#profile').innerHTML = '<section class="pf-top"><div class="pf-bar">' + (me.made ? '<button class="pf-ic pf-edit" id="lookBtn" type="button" aria-label="' + say('עריכת הדמות', 'Edit the character') + '">' + glyph('pen') + '</button>' : '<span></span>') +
    '<button class="pf-ic" id="setBtn" type="button" aria-label="' + say('הגדרות', 'Settings') + '">' + glyph('gear') + '</button></div>' +
    '<div class="pf-stage" id="pfStage">' + avatar(L.lvl) + '</div><h1 class="pf-name">' + (me.name ? '<bdi>' + esc(me.name) + '</bdi>' : say('הדמות שלי', 'My character')) + '</h1>' +
    '<p class="pf-rank"><span class="lv-badge">' + say('רמה ', 'Level ') + L.lvl + '</span>' + nm(P.rank) + '</p>' +
    '<div class="xp">' + xpBar(pctOf(L)) + '<p class="xp-l">' + say('עוד ' + nf(L.need - L.into) + ' נק׳ לרמה ', nf(L.need - L.into) + ' pts to level ') + (L.lvl + 1) + (nx ? ' · ' + say('ברמה ' + nx.at + ': ', 'At level ' + nx.at + ': ') + nm(nx) : '') + '</p></div>' +
    (me.made ? '' : '<button class="btn primary" id="lookBtn" type="button">' + glyph('pen') + say('עיצוב הדמות', 'Design the character') + '</button>') +
    '<ul class="pf-nums">' + stat(nf(P.T.wk), say('אימונים', 'workouts')) + stat(P.X.streak, say('שבועות ברצף', 'week streak')) + stat(nf(P.T.prs), say('שיאים', 'PRs')) + stat(Ltr(tons(P.T.kg)), say('טון הורמו', 'tons lifted')) + '</ul></section>' +
    '<section class="card next w0 kiosk" aria-label="' + say('הקיוסק', 'The kiosk') + '"><div class="next-top"><p class="k">' + say('הקיוסק', 'The kiosk') + '</p><span class="coin-tag" role="img" aria-label="' + say(nf(bal) + ' מטבעות', nf(bal) + ' coins') + '">' + COIN + nf(bal) + '</span></div>' +
    '<h2>' + say('ציוד לדמות שלך', 'Gear for your character') + '</h2><p class="meta">' + say('כל אימון מוסיף מטבעות', 'Every workout adds coins') + '</p>' +
    '<ul class="ks-peek" aria-hidden="true">' + peek.map((it) => '<li><span class="ks-pic">' + cropFig(it, L.lvl) + '</span><span class="pr">' + COIN + it.cost + '</span></li>').join('') + '</ul>' +
    '<button class="btn primary big" id="shopBtn" type="button">' + say('לקיוסק', 'To the kiosk') + '</button></section>' +
    '<section class="pf-sec"><div class="sec-h"><h2 class="sec">' + say('הישגים ', 'Achievements ') + '<small>' + have.size + '/' + BADGES.length + '</small></h2><button class="link" id="bdgAll" type="button" aria-expanded="' + !!S.bdgAll + '">' + (S.bdgAll ? say('פחות', 'Fewer') : say('כל ההישגים', 'All of them')) + '</button></div>' +
    '<ul class="badges">' + (S.bdgAll ? BADGES : few).map((b) => badgeHTML(b, have.has(b.id))).join('') + '</ul></section>';
}
/* ---- the kiosk. The character on the stage tries a thing on; coins buy it; what is owned goes on and off with a tap ---- */
function renderShop(pump) {
  const P = meNow(), me = S.cfg.me, shop = me.shop, bal = coinsLeft(P.T.xp, shop), sh = $('#sheet'), old = $('.sheet-in', sh), top = old ? old.scrollTop : 0;
  const it = shopItem(S.shopTry), own = !!it && shop.own.includes(it.id);
  /* what the figure on the stage wears: the wardrobe, with the thing that is being tried in place of what its slot held */
  const worn = it && !own ? shop.on.filter((k) => shopItem(k).slot !== it.slot).concat(it.id) : shop.on;
  const word = !it ? '<b>' + say('מה בא לך?', 'What takes your fancy?') + '</b><p>' + say('לוחצים על פריט כדי למדוד אותו על הדמות.', 'Tap a thing to try it on your character.') + '</p>'
    : own ? '<b>' + nm(it) + '</b><p>' + (shop.on.includes(it.id) ? say('עליך עכשיו. לחיצה נוספת מורידה.', 'On you now. Another tap takes it off.') : say('בארון שלך. לחיצה נוספת לובשת.', 'In your wardrobe. Another tap puts it on.')) + '</p>'
    : '<b>' + nm(it) + '</b>' + (bal >= it.cost ? '<button class="btn" id="shopBuy" type="button" data-buy="' + it.id + '">' + say('קנה ב-', 'Buy for ') + COIN + it.cost + '</button>'
      : '<p>' + (it.cost - bal === 1 ? say('חסר עוד מטבע אחד.', '1 more coin to go.') : say('חסרים עוד ' + (it.cost - bal) + ' מטבעות.', (it.cost - bal) + ' more coins to go.')) + ' ' + say('כל אימון מוסיף.', 'Every workout adds some.') + '</p>');
  const tile = (x) => {
    const o = shop.own.includes(x.id), on = shop.on.includes(x.id);
    return '<li><button class="ks-it' + (on ? ' on' : o ? ' own' : bal >= x.cost ? '' : ' far') + (S.shopTry === x.id ? ' try' : '') + '" type="button" data-shop="' + x.id + '" aria-pressed="' + on + '" aria-label="' + nm(x) + ', ' + (on ? say('עליך', 'on') : o ? say('בארון', 'owned') : x.cost + say(' מטבעות', ' coins')) + '">' +
      '<span class="ks-pic">' + cropFig(x, P.L.lvl) + '</span><b>' + nm(x) + '</b>' + (on ? '<span class="ks-st">' + ICON.check + say('עליך', 'On') + '</span>' : o ? '<span class="ks-st">' + say('ללבוש', 'Put on') + '</span>' : '<span class="ks-pr">' + COIN + x.cost + '</span>') + '</button></li>';
  };
  sh.innerHTML = '<div class="sheet-in ks" role="dialog" aria-modal="true" aria-label="' + say('הקיוסק', 'The kiosk') + '"><div class="ed-h"><div><p class="kicker">' + say('הקיוסק', 'The kiosk') + '</p><h2>' + say('ציוד לדמות', 'Gear for the character') + '</h2></div>' +
    '<span class="coin-tag dark" role="img" aria-label="' + say(nf(bal) + ' מטבעות', nf(bal) + ' coins') + '">' + COIN + nf(bal) + '</span><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    '<div class="ks-stage"><span class="ks-fig' + (pump ? ' pump' : '') + '" aria-hidden="true">' + avatarSVG(Object.assign({}, me.look, { wear: worn }), P.L.lvl, { base: EXP_BASE[expNow()] || 0 }) + '</span><div class="ks-say" aria-live="polite">' + word + '</div></div>' +
    '<ul class="ks-grid">' + SHOP.map(tile).join('') + '</ul>' +
    '<p class="ms-sub">' + say('כל 10 נקודות באימון הן מטבע. הרמה שלך לא יורדת כשקונים.', 'Every 10 points in a workout are a coin. Your level never drops when you buy.') + '</p></div>';
  $('.sheet-in', sh).scrollTop = top;
}
/* a tap on a thing: what is owned goes on or off; what is not is tried on */
function shopTap(id) {
  const me = S.cfg.me, it = shopItem(id); if (!it) return;
  if (me.shop.own.includes(id)) { const next = shopWear(me.shop, id, !me.shop.on.includes(id)); if (next) { me.shop = next; saveCfg(); renderMe(); } }
  S.shopTry = id; renderShop(true);
}
function shopBuyNow(id) {
  const me = S.cfg.me, xp = meNow().T.xp, next = shopBuy(me.shop, id, xp); if (!next) return;
  me.shop = next; saveCfg(); S.shopTry = id; S.shopBal = coinsLeft(xp, next); saveLocal();
  feel('coin', 'success'); renderMe(); renderShop(true);
  toast(COIN + '<b>' + say('שלך: ', 'Yours: ') + nm(shopItem(id)) + '</b>');
}
function openShop() { S.sheet = 'shop'; S.shopTry = null; renderShop(); $('#sheet').hidden = false; S.shopBal = coinsLeft(meNow().T.xp, S.cfg.me.shop); saveLocal(); markShop(); }
/* the profile's tab is marked once the coins have grown enough to buy something since the kiosk was last looked at */
function markShop() {
  const me = S.cfg.me, bal = coinsLeft(meNow().T.xp, me.shop), b = $('#tabbar [data-view="profile"]');
  if (b) b.classList.toggle('new', bal > (S.shopBal || 0) && SHOP.some((x) => !me.shop.own.includes(x.id) && x.cost <= bal));
}
/* ---- the journey: the levels as a road, from the first to the hundredth. Every stop is a level that opens something, and on the
   wide sides of the road stands the player's own character, dressed as it will be there ---- */
const J_PITCH = 140, J_TOP = 44;
const toGo = (n) => (n === 1 ? say('עוד רמה אחת', '1 level to go') : say('עוד ' + n + ' רמות', n + ' levels to go'));
function renderJourney(P) {
  P = P || meNow();
  const L = P.L, lvl = L.lvl, top = REWARDS[REWARDS.length - 1].at, nx = nextReward(lvl), N = REWARDS.length, H = J_TOP + (N - 1) * J_PITCH + 132;
  const cap = (a, b) => '<figcaption><b>' + a + '</b><span>' + b + '</span></figcaption>';
  let stops = '', trail = '';
  REWARDS.forEach((r, i) => {
    const x = 50 + STOP_X[i % 4] * AMP, y = J_TOP + i * J_PITCH, s = lvl >= r.at ? 'done' : nx && nx.at === r.at ? 'next' : 'later', side = STOP_X[i % 4] > 0 ? 'l' : 'r';
    stops += '<li class="stop ' + s + (r.at === top ? ' top' : '') + '" style="top:' + y + 'px;left:' + x + '%;--i:' + Math.min(i, 6) + '">' +
      '<button class="lv" type="button" data-lv="' + r.at + '" aria-label="' + say('רמה ', 'Level ') + r.at + ': ' + nm(r) + (s === 'done' ? say(', הושג', ', reached') : '') + '">' +
      (s === 'next' ? '<span class="go-chip" aria-hidden="true">' + toGo(r.at - lvl) + '</span>' : '') + '<span class="dot" aria-hidden="true">' + r.at + '</span><b>' + nm(r) + '</b></button>' +
      /* every second stop has a wide side: there the character stands as it will look at that level */
      (i % 2 && r.at !== top ? palHTML(side, avatar(r.at, { still: true }), '', 'pv') : '') + '</li>';
    if (i < N - 1) trail += trailSeg(x, y + 38, 50 + STOP_X[(i + 1) % 4] * AMP, y + 38 + J_PITCH, lvl >= REWARDS[i + 1].at);
  });
  $('#journey').innerHTML = '<section class="jr-hero" aria-label="' + say('המסע שלי', 'My journey') + '"><p class="jr-k">' + say('המסע שלך', 'Your journey') + '</p>' +
    '<h1>' + (lvl >= top ? say('רמה ' + lvl + '. מעבר לפסגה.', 'Level ' + lvl + '. Past the summit.') : say('מרמה ' + lvl + ' עד רמה ' + top, 'From level ' + lvl + ' to level ' + top)) + '</h1>' +
    '<div class="ob-ladder" aria-hidden="true"><figure class="now"><span class="ob-fig">' + avatar(lvl) + '</span>' + cap(say('רמה ', 'Level ') + lvl, say('היום', 'Today')) + '</figure>' +
    (lvl >= top ? '' : '<span class="ob-go">' + ICON.fwd + ICON.fwd + ICON.fwd + '</span><figure class="max"><span class="ob-fig">' + avatar(top) + '</span>' + cap(say('רמה ', 'Level ') + top, say('המטרה', 'The goal')) + '</figure>') + '</div>' +
    '<div class="jr-lv"><span class="lv-badge">' + say('רמה ', 'Level ') + lvl + '</span>' + xpBar(pctOf(L)) + '<span class="jr-nx" aria-hidden="true">' + (lvl + 1) + '</span></div>' +
    '<p class="jr-line">' + say('עוד ' + nf(L.need - L.into) + ' נק׳ לרמה ' + (lvl + 1), nf(L.need - L.into) + ' points to level ' + (lvl + 1)) + '</p></section>' +
    '<section class="road jr" aria-label="' + say('מה נפתח בדרך', 'What opens on the way') + '"><div class="road-h"><div><h2>' + say('מה נפתח בדרך', 'What opens on the way') + '</h2><p>' + say('כל סט שווה נקודות, והנקודות מעלות רמה', 'Every set earns points, and points raise the level') + '</p></div></div>' +
    '<div class="pw"><div class="pw-road" style="height:' + H + 'px"><svg class="pw-trail" viewBox="0 0 100 ' + H + '" preserveAspectRatio="none" aria-hidden="true">' + trail + '</svg><ol>' + stops + '</ol></div></div>' +
    '<p class="jr-after">' + say('ואחרי רמה 100? ממשיכים לעלות.', 'And after level 100? The levels keep going.') + '</p></section>';
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
const pinKeys = (attr, off) => ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) => (k === '' ? '<span></span>' : '<button type="button" class="pin-k" ' + attr + '="' + k + '"' + (off ? ' disabled' : '') + (k === 'del' ? ' aria-label="' + say('מחק ספרה', 'Delete a digit') + '">' + OBI.del : '>' + k) + '</button>')).join('');
const pinDots = (id, n) => '<div class="pin-dots" id="' + id + '" role="img" aria-label="' + say('ספרות שהוקלדו: ', 'Digits typed: ') + n + '">' + [0, 1, 2, 3].map((i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</div>';
/* the word that has to be typed to delete the account: the lifter's own name, or a plain word when there is none */
const delWord = () => S.cfg.me.name || say('מחק', 'delete');
const sameWord = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
function renderSettings() {
  const me = S.cfg.me, sh = $('#sheet'), old = $('.sheet-in', sh), pg = S.setPg || '', top = old && old.dataset.pg === pg ? old.scrollTop : 0;
  const x = '<button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button>';
  const page = (title, body) => '<div class="sheet-in st pg" data-pg="' + pg + '" role="dialog" aria-modal="true" aria-label="' + title + '"><div class="ed-h"><button class="fx-nav" type="button" data-setpg="" aria-label="' + say('חזרה להגדרות', 'Back to the settings') + '">' + ICON.back + '</button><div><h2>' + title + '</h2></div>' + x + '</div>' + body + '</div>';
  if (pg === 'pin' || (pg === 'del' && me.pin && !(S.pinFlow && S.pinFlow.ok))) { sh.innerHTML = page(pinTitle(), pinPageHTML()); return; }
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
      seg(say('מטרות', 'Goals'), 'goals', GOALS().map((o, i) => [i, o[0]]), me.goals, 'goal') +
      seg(say('זמן לאימון, בדקות', 'Time for a workout, in minutes'), 'time', [[30, '30'], [45, '45'], [60, '60'], [75, '75'], [0, say('לא משנה', 'Any')]], me.time, 'time', 'five') +
      seg(say('חדר הכושר', 'The gym'), 'eq', [[0, say('מלא', 'Full')], [1, say('בסיסי', 'Basic')], [2, say('לא בטוח', 'Not sure')]], me.eq, 'eq') +
      seg(say('אילון שואל איך היה', 'Eilon asks how it went'), 'fb', [[0, say('אף פעם', 'Never')], [1, say('בתרגילים הכבדים', 'On heavy lifts')], [2, say('תמיד', 'Always')]], me.fb, 'fb')) +
    (refit ? '<div class="st-note" role="status"><span>' + say('התשובות השתנו, והתוכנית נשארה כפי ששינית אותה.', 'The answers changed, and the plan stays as you changed it.') + '</span><button class="btn" id="setRefit" type="button">' + say('לבנות את התוכנית מחדש', 'Build the plan again') + '</button></div>' : '') +
    grp(say('צליל ומגע', 'Sound and touch'), tog(say('צליל', 'Sound'), 'sound', !!S.sound, 'sound') + tog(say('רטט', 'Vibration'), 'buzz', S.buzz !== false, 'buzz')) +
    grp(say('פרטיות', 'Privacy'), me.pin ? nav(say('שינוי הקוד', 'Change the code'), 'pinChange', say('פעיל', 'On'), 'pin') + nav(say('ביטול הקוד', 'Remove the code'), 'pinOff', '', 'pin', 'grey') : nav(say('קוד כניסה', 'Entry code'), 'pinSet', say('כבוי', 'Off'), 'pin')) +
    grp(say('גיבוי', 'Backup'), '<section class="backup" id="backup" aria-label="' + say('גיבוי', 'Backup') + '"></section>') +
    grp(say('עוד', 'More'), nav(say('סיור באפליקציה', 'A tour of the app'), 'tourAgain', '', 'tour', 'calm') + nav(say('מסך הפתיחה', 'The opening screens'), 'obAgain', '', 'film', 'calm')) +
    '<section class="st-g"><button class="st-row nav red" type="button" id="delAsk">' + setIcon('del', 'red') + '<span class="st-l">' + say('מחיקת החשבון', 'Delete the account') + '</span>' + ICON.fwd + '</button></section></div>';
  $('.sheet-in', sh).scrollTop = top; renderBackup();
}
function openSettings() { S.sheet = 'set'; S.backupNote = ''; S.setPg = null; S.pinFlow = null; S.del = null; S.setRefit = false; renderSettings(); $('#sheet').hidden = false; }
/* an answer that shapes the plan was changed. A plan that is still the one the app built follows the new answers at once; one the
   lifter changed by hand stays, and the settings offer to build it again (see renderSettings) */
function setAnswer(key, v) {
  const me = S.cfg.me, clean = me.exp != null && !planChanged();
  if (key === 'goals') { const g = me.goals.includes(v) ? me.goals.filter((x) => x !== v) : me.goals.concat(v).sort(); if (!g.length) return; me.goals = g; me.goal = g[0]; }
  else me[key] = v;
  if (key === 'exp') applyExp();
  if (me.exp != null && key !== 'fb') { if (clean) resetPlan(); S.setRefit = planChanged(); }
  saveCfg(); renderAll();
}
/* ---- the code: setting it, changing it and taking it off, on a page of the settings. F.step: cur (the code as it is), new, again ---- */
function pinTitle() { const m = (S.pinFlow || {}).mode; return m === 'off' ? say('ביטול הקוד', 'Remove the code') : m === 'change' ? say('שינוי הקוד', 'Change the code') : m === 'del' ? say('מחיקת החשבון', 'Delete the account') : say('קוד כניסה', 'Entry code'); }
function pinPageHTML() {
  const F = S.pinFlow, ask = F.step === 'cur' ? say('הקוד הנוכחי', 'The current code') : F.step === 'again' ? say('עוד פעם, לאישור', 'Once more, to confirm') : say('קוד חדש: 4 ספרות', 'A new code: 4 digits');
  return '<div class="st-pg ob-pin"><p class="pin-ask">' + ask + '</p>' + pinDots('setDots', F.buf.length) + '<p class="pin-err" id="setErr" aria-live="polite">' + (F.err || '') + '</p><div class="pin-pad">' + pinKeys('data-pk', false) + '</div>' +
    (F.mode === 'set' ? '<p class="ms-sub">' + say('הקוד יידרש כשפותחים את האפליקציה, וכדי למחוק את החשבון. אי אפשר לשחזר אותו.', 'The code is asked when the app opens, and to delete the account. It cannot be recovered.') + '</p>' : '') + '</div>';
}
function openPin(mode) { S.pinFlow = { mode, step: mode === 'set' ? 'new' : 'cur', buf: '', first: '', err: '', ok: false }; S.setPg = mode === 'del' ? 'del' : 'pin'; renderSettings(); }
function pinKey(k) {
  const F = S.pinFlow; if (!F || F.busy) return;
  if (k === 'del') F.buf = F.buf.slice(0, -1); else if (F.buf.length < 4) F.buf += k;
  $$('#setDots i').forEach((d, i) => d.classList.toggle('on', i < F.buf.length));
  if (F.err) { F.err = ''; const e = $('#setErr'); if (e) e.textContent = ''; }
  if (F.buf.length < 4) return;
  const typed = F.buf; F.buf = '';
  if (F.step === 'new') { F.first = typed; F.step = 'again'; renderSettings(); return; }
  if (F.step === 'again' && typed !== F.first) { F.step = 'new'; F.first = ''; F.err = say('הקודים לא תואמים. מתחילים מחדש.', 'The codes did not match. Let us start again.'); haptic('warn'); renderSettings(); return; }
  F.busy = true;
  pinHash(typed).then((h) => {
    F.busy = false; if (S.pinFlow !== F || S.sheet !== 'set') return;
    const me = S.cfg.me, lock = '<svg class="i ln" viewBox="0 0 24 24" aria-hidden="true">' + SET_I.pin + '</svg>';
    if (F.step === 'cur') {
      if (h !== me.pin) { F.err = say('הקוד לא נכון', 'That is not the code'); haptic('warn'); renderSettings(); return; }
      if (F.mode === 'off') { me.pin = ''; saveCfg(); S.setPg = null; S.pinFlow = null; renderSettings(); toast(lock + '<b>' + say('הקוד בוטל', 'The code is off') + '</b>'); return; }
      if (F.mode === 'del') { F.ok = true; renderSettings(); return; }
      F.step = 'new'; renderSettings(); return;
    }
    me.pin = h; saveCfg(); S.unlocked = true; S.setPg = null; S.pinFlow = null; renderSettings(); feel('set', 'success'); toast(lock + '<b>' + say('הקוד נשמר', 'The code is saved') + '</b>');
  });
}
/* ---- deleting the account: said plainly, confirmed by typing a word, and by the code when there is one ---- */
function delPageHTML() {
  const D = S.del || (S.del = { v: '', busy: false, note: '' }), word = delWord();
  return '<div class="st-del"><span class="st-del-i" aria-hidden="true"><svg class="i" viewBox="0 0 24 24">' + SET_I.del + '</svg></span><h3>' + say('למחוק את החשבון?', 'Delete the account?') + '</h3>' +
    '<p>' + say('כל האימונים, הדמות, המטבעות וההגדרות יימחקו מהמכשיר הזה ומהחשבון. אי אפשר לבטל את זה.', 'Every workout, the character, the coins and the settings will be erased from this device and from the account. This cannot be undone.') + '</p>' +
    (S.dl ? '<button class="link" id="backupBtn" type="button">' + say('קודם לשמור גיבוי לקובץ', 'Save a backup file first') + '</button>' : '') +
    '<label for="delName">' + say('כדי לאשר, כותבים כאן: ', 'To confirm, type: ') + '<b><bdi>' + esc(word) + '</bdi></b></label>' +
    '<input id="delName" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="24" value="' + esc(D.v) + '">' +
    (D.note ? '<p class="st-del-n" role="status">' + D.note + '</p>' : '') +
    '<button class="btn danger big" id="delYes" type="button"' + (D.busy || !sameWord(D.v, word) ? ' disabled' : '') + '>' + (D.busy ? say('מוחק…', 'Deleting…') : say('מחיקה לצמיתות', 'Delete for good')) + '</button>' +
    '<button class="btn big" data-setpg="" type="button">' + say('ביטול', 'Cancel') + '</button></div>';
}
const WIPE_FAIL = () => say('המחיקה לא הושלמה: אין חיבור לחשבון. אפשר לנסות שוב כשיש חיבור.', 'The deletion did not finish: the account could not be reached. Try again once you are connected.');
function delNow() {
  const D = S.del, me = S.cfg.me; if (!D || D.busy || !sameWord(D.v, delWord()) || (me.pin && !(S.pinFlow && S.pinFlow.ok))) return;
  D.busy = true; D.note = ''; renderSettings();
  wipeAccount().then((ok) => { if (ok) { afterWipe(); return; } D.busy = false; D.note = WIPE_FAIL(); if (S.sheet === 'set') renderSettings(); });
}
/* the account is gone: the page starts over where a new lifter starts, in the language it was in */
function afterWipe() {
  chat.msgs = []; chat.turns = []; S.setPg = null; S.pinFlow = null; S.del = null; S.bdgAll = false; S.unlocked = false;
  if (window.gymiNative && typeof window.gymiNative.forget === 'function') window.gymiNative.forget();
  if (!$('#sheet').hidden) closeSheet();
  closeChat(); applyLang(); setView('home'); renderAll(); renderMsgs(); maybeOb();
}
/* ---- the code at the door. A lifter who set a code is asked for it when the app opens, and again after the app was away for a
   while. It is a light lock for the phone in hand: what is kept is a hash of the code, beside the settings ---- */
const DOOR = { on: false, buf: '', err: '', tries: 0, until: 0, forgot: false, v: '', busy: false, note: '' }, AWAY_MS = 10 * 60000;
function lockDraw() {
  const box = $('#lock'), me = S.cfg.me, wait = DOOR.until > Date.now();
  box.setAttribute('aria-label', say('קוד כניסה', 'Entry code'));
  box.innerHTML = '<div class="lock-in">' + (DOOR.forgot
    ? '<h1>' + say('שכחת את הקוד?', 'Forgot the code?') + '</h1><div class="lock-forgot"><p>' + say('הקוד שמור רק אצלך, ואי אפשר לשחזר אותו. אפשר למחוק את החשבון ולהתחיל מחדש.', 'The code is kept only with you and cannot be recovered. You can delete the account and start again.') + '</p>' +
      '<label for="lockName">' + say('כדי למחוק, כותבים כאן: ', 'To delete, type: ') + '<b><bdi>' + esc(delWord()) + '</bdi></b></label><input id="lockName" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="24" value="' + esc(DOOR.v) + '">' +
      (DOOR.note ? '<p role="status">' + DOOR.note + '</p>' : '') +
      '<button class="btn danger" id="lockWipe" type="button"' + (DOOR.busy || !sameWord(DOOR.v, delWord()) ? ' disabled' : '') + '>' + (DOOR.busy ? say('מוחק…', 'Deleting…') : say('מחיקת החשבון והתחלה מחדש', 'Delete the account and start again')) + '</button>' +
      '<button class="btn quiet" id="lockBack" type="button">' + say('חזרה לקוד', 'Back to the code') + '</button></div>'
    : '<span class="lock-ava" aria-hidden="true">' + avatar(meNow().L.lvl, { bust: true }) + '</span><h1>' + (me.name ? say('היי, ', 'Hi, ') + '<bdi>' + esc(me.name) + '</bdi>' : say('היי!', 'Hi!')) + '</h1><p class="lock-sub">' + say('הקוד שלך, ונכנסים', 'Your code, and you are in') + '</p>' +
      pinDots('lockDots', DOOR.buf.length) + '<p class="pin-err" id="lockErr" aria-live="polite">' + (wait ? say('יותר מדי ניסיונות. עוד רגע אפשר לנסות שוב.', 'Too many tries. You can try again in a moment.') : DOOR.err) + '</p>' +
      '<div class="pin-pad">' + pinKeys('data-lk', wait) + '</div><button class="link" id="lockForgot" type="button">' + say('שכחתי את הקוד', 'I forgot the code') + '</button>') + '</div>';
}
/* the door closes when there is a code and it was not given yet (or the app was away long enough to ask again) */
function maybeLock() {
  if (DOOR.on) { if (!S.cfg.me.pin) unlock(); return; }
  if (S.unlocked || !S.cfg.me.pin || OB.on) return;
  DOOR.on = true; DOOR.buf = ''; DOOR.err = ''; DOOR.forgot = false; DOOR.v = ''; DOOR.note = ''; DOOR.busy = false;
  closeChat(); if (TR.on) tourEnd();
  lockDraw(); const box = $('#lock'); box.classList.remove('out'); box.hidden = false;
}
function unlock() {
  S.unlocked = true; DOOR.on = false; DOOR.tries = 0;
  const box = $('#lock'), gone = () => { if (!DOOR.on) { box.hidden = true; box.innerHTML = ''; box.classList.remove('out'); } };
  if (reduced) gone(); else { box.classList.add('out'); setTimeout(gone, 340); }
}
function lockKey(k) {
  if (!DOOR.on || DOOR.forgot || DOOR.busy || DOOR.until > Date.now()) return;
  if (k === 'del') DOOR.buf = DOOR.buf.slice(0, -1); else if (DOOR.buf.length < 4) DOOR.buf += k;
  $$('#lockDots i').forEach((d, i) => d.classList.toggle('on', i < DOOR.buf.length));
  if (DOOR.err) { DOOR.err = ''; const e = $('#lockErr'); if (e) e.textContent = ''; }
  if (DOOR.buf.length < 4) return;
  const typed = DOOR.buf; DOOR.busy = true;
  pinHash(typed).then((h) => {
    DOOR.busy = false; DOOR.buf = '';
    if (!DOOR.on) return;
    if (h === S.cfg.me.pin) { feel('set', 'success'); unlock(); return; }
    DOOR.tries++; haptic('warn'); DOOR.err = say('הקוד לא נכון', 'That is not the code');
    if (DOOR.tries >= 5) { DOOR.tries = 0; DOOR.until = Date.now() + 30000; setTimeout(() => { if (DOOR.on && !DOOR.forgot) { DOOR.err = ''; lockDraw(); } }, 30200); }
    lockDraw();
    const d = $('#lockDots'); if (d && !reduced) d.classList.add('bad');
  });
}
function lockWipe() {
  if (DOOR.busy || !sameWord(DOOR.v, delWord())) return;
  DOOR.busy = true; DOOR.note = ''; lockDraw();
  wipeAccount().then((ok) => {
    DOOR.busy = false;
    if (!ok) { DOOR.note = WIPE_FAIL(); lockDraw(); return; }
    DOOR.on = false; const box = $('#lock'); box.hidden = true; box.innerHTML = ''; afterWipe();
  });
}

/* ---- the character editor: name and looks; every choice is saved at once. One kind of choice is on screen at a time,
   picked from a row of tabs, so that the whole editor fits on one screen with the character above it ---- */
const LK = { tab: 'skin', busy: false, note: '' };
const LOOK_TABS = () => [['skin', say('עור', 'Skin')], ['hair', say('תספורת', 'Haircut')], ['hc', say('צבע שיער', 'Hair colour')], ['beard', say('זקן', 'Beard')], ['shirt', say('חולצה', 'Shirt')]];
/* a T-shirt, for the shirt colours: a colour is easier to choose on the thing it colours */
const TEE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 3.6c.7 1.3 1.9 2 3.4 2s2.7-.7 3.4-2l5.1 2.3-1.9 4.3-2.3-.9v11.2H7.7V9.3l-2.3.9-1.9-4.3z"/></svg>';
function lookRows() {
  const k = S.cfg.me.look, tabs = LOOK_TABS(), cur = tabs.find((t) => t[0] === LK.tab) || tabs[0], key = cur[0], label = cur[1];
  /* each colour says what it is the colour of: 'Shirt 3', not 'Option 3' three times over */
  const sw = (list, hex) => '<div class="lk-opts" style="--n:' + list.length + '">' + list.map((c, i) => '<button type="button" class="lk-sw" data-look="' + key + '" data-v="' + i + '" aria-pressed="' + (k[key] === i) + '" aria-label="' + label + ' ' + (i + 1) + '" style="--c:' + hex(c) + '"></button>').join('') + '</div>';
  const face = (look, i, name) => '<button type="button" class="lk-cut" data-look="' + key + '" data-v="' + i + '" aria-pressed="' + (k[key] === i) + '"><span class="lk-face" aria-hidden="true">' + avatarSVG(look, 1, { bust: true }) + '</span><small>' + name + '</small></button>';
  let body;
  if (key === 'skin') body = sw(SKIN, (c) => c[0]);
  else if (key === 'hair') body = '<div class="lk-cuts">' + HAIR_ORDER.map((i) => face(Object.assign({}, k, { hair: i }), i, hairName(i))).join('') + '</div>';
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
function setLook(key, v) {
  const me = S.cfg.me; if (!(key in me.look)) return;
  me.look[key] = v; me.made = me.made || Date.now(); saveCfg();
  lookDraw(false);
}
/* ---- the character from a photo: Eilon looks at it once and picks the closest of each choice. The photo is not kept ---- */
const LOOK_ASK = 'You are setting up a simple cartoon avatar for a fitness app. Look at the main person in the photo and pick the closest option in each list. ' +
  'Reply with one line of JSON and nothing else: {"skin":N,"hair":N,"hc":N,"beard":N}\n' +
  'skin, the tone from light to deep: 0 very fair, 1 fair, 2 light tan, 3 tan or olive, 4 brown, 5 deep brown.\n' +
  'hair, the cut: 0 bald or shaved, 1 short, 2 swept up, 3 curly, 4 long (past the chin), 5 a fringe over the forehead, 6 buzz cut, 7 side part, 8 medium (over the ears).\n' +
  'hc, the hair colour: 0 black, 1 dark brown, 2 brown, 3 light brown, 4 dark blond, 5 blond, 6 red or ginger, 7 grey or white.\n' +
  'beard: 0 none, 1 stubble or a short beard, 2 a full beard.\n' +
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
    if (o && o.none) { say2(say('לא מצאתי פנים בתמונה. אפשר לנסות תמונה אחרת.', 'I could not find a face in the photo. Try another one.')); return; }
    const me = S.cfg.me, lim = { skin: SKIN.length, hair: HAIR.length, hc: HAIRC.length, beard: BEARD.length }; let n = 0;
    if (o) for (const key of Object.keys(lim)) if (Number.isInteger(o[key]) && o[key] >= 0 && o[key] < lim[key]) { me.look[key] = o[key]; n++; }
    if (!o || !n) { say2(say('לא הצלחתי לקרוא את התמונה. אפשר לנסות שוב.', 'I could not read the photo. Try again.')); return; }
    me.made = me.made || Date.now(); saveCfg(); LK.note = say('הנה. אפשר לשנות כל פרט.', 'There. Every detail can still be changed.'); lookDraw(true); feel('set', 'success');
  } catch (e) {
    LK.busy = false; say2(say('לא הצלחתי לקרוא את התמונה כרגע. אפשר לבחור ידנית.', 'I could not read the photo right now. You can choose by hand.'));
  }
}
function setName(v) { const me = S.cfg.me, n = String(v || '').trim().slice(0, 16); if (n === me.name) return; me.name = n; me.made = me.made || Date.now(); saveCfg(); }
/* clicks and typing inside the sheet that belong to this file; returns true when the click was handled */
function meSheetClick(ev) {
  const lk = ev.target.closest('[data-look]'); if (lk) { setLook(lk.dataset.look, +lk.dataset.v); return true; }
  const tb = ev.target.closest('[data-lktab]'); if (tb) { lookTab(tb.dataset.lktab); return true; }
  if (ev.target.closest('#lkPhoto')) { $('#lkFile').click(); return true; }
  const buy = ev.target.closest('[data-buy]'); if (buy) { shopBuyNow(buy.dataset.buy); return true; }
  const thing = ev.target.closest('[data-shop]'); if (thing) { shopTap(thing.dataset.shop); return true; }
  if (S.sheet !== 'set') return false;
  const pk = ev.target.closest('[data-pk]'); if (pk) { pinKey(pk.dataset.pk); return true; }
  const pg = ev.target.closest('[data-setpg]'); if (pg) { S.setPg = pg.dataset.setpg || null; S.pinFlow = null; S.del = null; renderSettings(); return true; }
  const b = ev.target.closest('button'); if (!b) return false;
  const k = b.dataset.set, v = b.dataset.v;
  if (b.id === 'obAgain') { closeSheet(); openOb(); }
  else if (b.id === 'tourAgain') { closeSheet(); setTimeout(startTour, 380); }
  else if (b.id === 'setLook') { closeSheet(); openLook(); }
  else if (b.id === 'pinSet') openPin('set');
  else if (b.id === 'pinChange') openPin('change');
  else if (b.id === 'pinOff') openPin('off');
  else if (b.id === 'delAsk') { S.del = { v: '', busy: false, note: '' }; if (S.cfg.me.pin) openPin('del'); else { S.setPg = 'del'; renderSettings(); } }
  else if (b.id === 'delYes') delNow();
  else if (b.id === 'setRefit') { resetPlan(); S.setRefit = false; renderAll(); toast(ICON.check + '<b>' + say('התוכנית נבנתה מחדש', 'The plan was built again') + '</b>'); }
  else if (b.id === 'backupBtn') exportBackup();
  else if (b.id === 'restoreBtn') $('#restoreFile').click();
  else if (b.id === 'exportBtn') exportCsv();
  else if (k === 'lang') { if (v !== LANG) langFade(() => setLang(v)); }
  else if (k === 'sound') { S.sound = v === '1'; saveLocal(); if (S.sound) sfx('set'); renderSettings(); }
  else if (k === 'buzz') { S.buzz = v === '1'; saveLocal(); if (HX.on) document.documentElement.dataset.hx = S.buzz ? 'on' : 'off'; haptic('success'); renderSettings(); }
  else if (k === 'exp' || k === 'goals' || k === 'time' || k === 'eq' || k === 'fb') setAnswer(k, +v);
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
    else if (b.id === 'shopBtn') openShop();
    else if (b.id === 'bdgAll') { S.bdgAll = !S.bdgAll; renderProfile(); const again = $('#bdgAll'); if (again) again.focus({ preventScroll: true }); }
  });
  $('#journey').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-lv]'); if (b) openLevel(+b.dataset.lv); });
  const lock = $('#lock');
  lock.addEventListener('click', (ev) => {
    const k = ev.target.closest('[data-lk]'); if (k) { lockKey(k.dataset.lk); return; }
    const b = ev.target.closest('button'); if (!b) return;
    if (b.id === 'lockForgot') { DOOR.forgot = true; DOOR.v = ''; DOOR.note = ''; lockDraw(); const i = $('#lockName'); if (i) i.focus({ preventScroll: true }); }
    else if (b.id === 'lockBack') { DOOR.forgot = false; lockDraw(); }
    else if (b.id === 'lockWipe') lockWipe();
  });
  lock.addEventListener('input', (ev) => { if (ev.target.id !== 'lockName') return; DOOR.v = ev.target.value; const b = $('#lockWipe'); if (b) b.disabled = DOOR.busy || !sameWord(DOOR.v, delWord()); });
  document.addEventListener('keydown', (ev) => {
    if (!DOOR.on || DOOR.forgot || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (/^[0-9]$/.test(ev.key)) { lockKey(ev.key); ev.preventDefault(); } else if (ev.key === 'Backspace') { lockKey('del'); ev.preventDefault(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { S.awayAt = Date.now(); return; }
    if (S.cfg.me.pin && S.awayAt && Date.now() - S.awayAt > AWAY_MS) { S.unlocked = false; maybeLock(); }
  });
}
