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
const avatar = (lvl, o) => avatarSVG(S.cfg.me.look, lvl, o);

/* refresh the player's side after the log changed, and remember the level so that a level-up can be spotted */
function renderMe() {
  const P = meNow();
  S.lvl = P.L.lvl;
  const me = $('#tbMe'); if (me) me.innerHTML = avatar(P.L.lvl, { bust: true });
  if (S.view === 'profile') renderProfile(P);
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
    '<ul class="rows"><li class="tap"><button class="row-b one" id="setBtn" type="button"><span class="h-t">' + say('הגדרות', 'Settings') + '</span>' + ICON.fwd + '</button></li></ul>' +
    '<p class="pf-how">' + say('סט ', 'A set ') + Ltr('+' + XP.set) + ' · ' + say('שיא אישי ', 'a personal best ') + Ltr('+' + XP.pr) + ' · ' + say('סיום אימון ', 'a finished workout ') + Ltr('+' + XP.done) + '</p>';
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

/* ---- the character sheet: name and looks; every choice is saved at once ---- */
function lookRows() {
  /* each row is a named group, and each colour says what it is the colour of: 'Shirt 3', not 'Option 3' three times over */
  const k = S.cfg.me.look, sw = (key, list, hex, label) => '<div class="lk-opts" role="group" aria-label="' + label + '">' + list.map((c, i) => '<button type="button" class="lk-sw" data-look="' + key + '" data-v="' + i + '" aria-pressed="' + (k[key] === i) + '" aria-label="' + label + ' ' + (i + 1) + '" style="--c:' + hex(c) + '"></button>').join('') + '</div>';
  const seg = (key, list, label) => '<div class="seg" role="group" aria-label="' + label + '">' + list.map((t, i) => '<button type="button" data-look="' + key + '" data-v="' + i + '" aria-pressed="' + (k[key] === i) + '">' + t + '</button>').join('') + '</div>';
  const row = (label, body) => '<div class="lk-row col"><span aria-hidden="true">' + label + '</span>' + body + '</div>';
  const L = { skin: say('עור', 'Skin'), hair: say('שיער', 'Hair'), hc: say('צבע שיער', 'Hair colour'), beard: say('זקן', 'Beard'), shirt: say('חולצה', 'Shirt') };
  return row(L.skin, sw('skin', SKIN, (c) => c[0], L.skin)) + row(L.hair, seg('hair', HAIRS(), L.hair)) + row(L.hc, sw('hc', HAIRC, (c) => c, L.hc)) + row(L.beard, seg('beard', BEARDS(), L.beard)) + row(L.shirt, sw('shirt', SHIRT, (c) => c, L.shirt));
}
function openLook() {
  const me = S.cfg.me, sh = $('#sheet');
  S.sheet = 'look';
  sh.innerHTML = '<div class="sheet-in lk" role="dialog" aria-modal="true" aria-label="' + say('הדמות שלי', 'My character') + '"><div class="ed-h"><div><h2>' + say('הדמות שלי', 'My character') + '</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="' + say('סגור', 'Close') + '">' + ICON.x + '</button></div>' +
    '<div class="lk-stage" id="lkStage">' + avatar(S.lvl || 1) + '</div>' +
    '<label class="lk-row" for="lkName"><span>' + say('שם', 'Name') + '</span><input id="lkName" type="text" dir="auto" maxlength="16" autocomplete="off" placeholder="' + say('השם שלך', 'Your name') + '" value="' + esc(me.name) + '"></label>' +
    '<div id="lkRows">' + lookRows() + '</div><button class="btn primary big" data-close="1" type="button">' + say('סיום', 'Done') + '</button></div>';
  sh.hidden = false;
}
function setLook(key, v) {
  const me = S.cfg.me; if (!(key in me.look)) return;
  me.look[key] = v; me.made = me.made || Date.now(); saveCfg();
  $('#lkStage').innerHTML = avatar(S.lvl || 1); $('#lkRows').innerHTML = lookRows();
  if (player.cv && !player.playing) paintStage(player.lastT);
}
function setName(v) { const me = S.cfg.me, n = String(v || '').trim().slice(0, 16); if (n === me.name) return; me.name = n; me.made = me.made || Date.now(); saveCfg(); }
/* clicks and typing inside the sheet that belong to this file; returns true when the click was handled */
function meSheetClick(ev) {
  const lk = ev.target.closest('[data-look]'); if (lk) { setLook(lk.dataset.look, +lk.dataset.v); return true; }
  if (S.sheet !== 'set') return false;
  const b = ev.target.closest('button'); if (!b) return false;
  const k = b.dataset.set, v = b.dataset.v;
  if (b.id === 'obAgain') { closeSheet(); openOb(); }
  else if (b.id === 'backupBtn') exportBackup();
  else if (b.id === 'restoreBtn') $('#restoreFile').click();
  else if (b.id === 'exportBtn') exportCsv();
  else if (k === 'lang') setLang(v);
  else if (k === 'sound') { S.sound = v === '1'; saveLocal(); if (S.sound) sfx('set'); renderSettings(); }
  else if (k === 'buzz') { S.buzz = v === '1'; saveLocal(); if (HX.on) document.documentElement.dataset.hx = S.buzz ? 'on' : 'off'; haptic('success'); renderSettings(); }
  else if (k === 'exp' || k === 'goal') { const me = S.cfg.me; me[k] = +v; if (k === 'exp') applyExp(); saveCfg(); renderAll(); }
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
  $('#profile').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.id === 'lookBtn') openLook();
    else if (b.id === 'setBtn') openSettings();
    else if (b.id === 'bdgAll') { S.bdgAll = !S.bdgAll; renderProfile(); const again = $('#bdgAll'); if (again) again.focus({ preventScroll: true }); }
  });
}
