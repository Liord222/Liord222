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
const avatar = (lvl, o) => avatarSVG(S.cfg.me.look, lvl, Object.assign({ base: EXP_BASE[expNow()] || 0 }, o));

/* refresh the player's side after the log changed, and remember the level so that a level-up can be spotted */
function renderMe() {
  const P = meNow();
  S.lvl = P.L.lvl;
  const me = $('#tbMe'); if (me) me.innerHTML = avatar(P.L.lvl, { bust: true });
  if (S.view === 'profile') renderProfile(P); else if (S.view === 'journey') renderJourney(P);
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
/* the profile: the character, where it stands in the game, and the achievements. One card, one row of medals, one way to the settings */
function renderProfile(P) {
  P = P || meNow();
  const me = S.cfg.me, L = P.L, nx = nextReward(L.lvl), have = new Set(Object.keys(me.badges).concat(earned(P.T, P.X)));
  const stat = (v, k) => '<li><b>' + v + '</b><span>' + k + '</span></li>';
  /* the achievements in short: the last ones that were earned, then the next to go for. All of them are a tap away */
  const got = BADGES.filter((b) => have.has(b.id)), todo = BADGES.filter((b) => !have.has(b.id)), few = todo.length ? got.slice(-3).concat(todo).slice(0, 4) : got.slice(-4);
  $('#profile').innerHTML = '<section class="pf-top">' + (me.made ? '<button class="icon-btn pf-edit" id="lookBtn" type="button" aria-label="' + say('עריכת הדמות', 'Edit the character') + '">' + glyph('pen') + '</button>' : '') +
    '<div class="pf-stage">' + avatar(L.lvl) + '</div><h1 class="pf-name">' + (me.name ? '<bdi>' + esc(me.name) + '</bdi>' : say('הדמות שלי', 'My character')) + '</h1>' +
    '<p class="pf-rank"><span class="lv-badge">' + say('רמה ', 'Level ') + L.lvl + '</span>' + nm(P.rank) + '</p>' +
    '<div class="xp">' + xpBar(pctOf(L)) + '<p class="xp-l">' + say('עוד ' + nf(L.need - L.into) + ' נק׳ לרמה ', nf(L.need - L.into) + ' pts to level ') + (L.lvl + 1) + (nx ? ' · ' + say('ברמה ' + nx.at + ': ', 'At level ' + nx.at + ': ') + nm(nx) : '') + '</p></div>' +
    (me.made ? '' : '<button class="btn primary" id="lookBtn" type="button">' + glyph('pen') + say('עיצוב הדמות', 'Design the character') + '</button>') +
    '<ul class="pf-nums">' + stat(nf(P.T.wk), say('אימונים', 'workouts')) + stat(P.X.streak, say('שבועות ברצף', 'week streak')) + stat(nf(P.T.prs), say('שיאים', 'PRs')) + stat(Ltr(tons(P.T.kg)), say('טון הורמו', 'tons lifted')) + '</ul></section>' +
    '<section class="pf-sec"><div class="sec-h"><h2 class="sec">' + say('הישגים ', 'Achievements ') + '<small>' + have.size + '/' + BADGES.length + '</small></h2><button class="link" id="bdgAll" type="button" aria-expanded="' + !!S.bdgAll + '">' + (S.bdgAll ? say('פחות', 'Fewer') : say('כל ההישגים', 'All of them')) + '</button></div>' +
    '<ul class="badges">' + (S.bdgAll ? BADGES : few).map((b) => badgeHTML(b, have.has(b.id))).join('') + '</ul></section>' +
    '<ul class="rows"><li class="tap"><button class="row-b one" id="setBtn" type="button"><span class="h-t">' + say('הגדרות', 'Settings') + '</span>' + ICON.fwd + '</button></li></ul>';
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
/* ---- settings: the language, what the plan is built on, sound and vibration, and the backup. Every choice is saved at once ---- */
function renderSettings() {
  const me = S.cfg.me, sh = $('#sheet'), old = $('.sheet-in', sh), top = old ? old.scrollTop : 0;
  const pick = (label, key, list, cur) => '<div class="lk-row col"><span>' + label + '</span><div class="seg" role="group" aria-label="' + label + '">' + list.map((o) => '<button type="button" data-set="' + key + '" data-v="' + o[0] + '" aria-pressed="' + (o[0] === cur) + '">' + o[1] + '</button>').join('') + '</div></div>';
  const tog = (label, key, on) => '<div class="set-row"><span>' + label + '</span><button class="tog" type="button" role="switch" aria-checked="' + on + '" aria-label="' + label + '" data-set="' + key + '" data-v="' + (on ? 0 : 1) + '"><i></i></button></div>';
  sh.innerHTML = '<div class="sheet-in st" role="dialog" aria-modal="true" aria-label="' + say('הגדרות', 'Settings') + '"><div class="ed-h"><div><h2>' + say('הגדרות', 'Settings') + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    pick(say('שפה', 'Language'), 'lang', LANGS, LANG) +
    pick(say('ניסיון', 'Experience'), 'exp', EXP().map((o, i) => [i, o[0]]), me.exp) +
    pick(say('מטרה', 'Goal'), 'goal', GOALS().map((o, i) => [i, o[0]]), me.goal) +
    '<div class="set-list">' + tog(say('צליל', 'Sound'), 'sound', !!S.sound) + tog(say('רטט', 'Vibration'), 'buzz', S.buzz !== false) + '</div>' +
    '<section class="backup" id="backup" aria-label="' + say('גיבוי', 'Backup') + '"></section>' +
    '<button class="link" id="obAgain" type="button">' + say('מסך הפתיחה', 'The opening screens') + '</button></div>';
  $('.sheet-in', sh).scrollTop = top; renderBackup();
}
function openSettings() { S.sheet = 'set'; S.backupNote = ''; renderSettings(); $('#sheet').hidden = false; }

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
  if (S.sheet !== 'set') return false;
  const b = ev.target.closest('button'); if (!b) return false;
  const k = b.dataset.set, v = b.dataset.v;
  if (b.id === 'obAgain') { closeSheet(); openOb(); }
  else if (b.id === 'backupBtn') exportBackup();
  else if (b.id === 'restoreBtn') $('#restoreFile').click();
  else if (b.id === 'exportBtn') exportCsv();
  else if (k === 'lang') { if (v !== LANG) langFade(() => setLang(v)); }
  else if (k === 'sound') { S.sound = v === '1'; saveLocal(); if (S.sound) sfx('set'); renderSettings(); }
  else if (k === 'buzz') { S.buzz = v === '1'; saveLocal(); if (HX.on) document.documentElement.dataset.hx = S.buzz ? 'on' : 'off'; haptic('success'); renderSettings(); }
  else if (k === 'exp' || k === 'goal') { const me = S.cfg.me; me[k] = +v; if (k === 'exp') applyExp(); else me.goals = [+v]; saveCfg(); renderAll(); }
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
    else if (b.id === 'bdgAll') { S.bdgAll = !S.bdgAll; renderProfile(); const again = $('#bdgAll'); if (again) again.focus({ preventScroll: true }); }
  });
  $('#journey').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-lv]'); if (b) openLevel(+b.dataset.lv); });
}
