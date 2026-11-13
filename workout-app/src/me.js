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
const glyph = (k, cls) => '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + GLYPH[k] + '</svg>';
const nf = (n) => Math.round(n).toLocaleString('en-US');
const pctOf = (L) => Math.max(0, Math.min(100, Math.round((L.into / L.need) * 100)));
const xpBar = (p, id) => '<span class="xpbar"><i' + (id ? ' id="' + id + '"' : '') + ' style="width:' + p + '%"></i></span>';
const tons = (kg) => { const t = kg / 1000; return t >= 100 ? nf(t) : (Math.round(t * 10) / 10).toLocaleString('en-US'); };
const avatar = (lvl, o) => avatarSVG(S.cfg.me.look, lvl, o);

/* the small level meter in the top row of a workout, and the level remembered for spotting a level-up */
function renderMe() {
  const P = meNow(), chip = $('#lvlChip');
  chip.innerHTML = '<span class="lv-badge">רמה ' + P.L.lvl + '</span>' + xpBar(pctOf(P.L));
  chip.setAttribute('aria-label', 'רמה ' + P.L.lvl + ', הפרופיל שלי');
  S.lvl = P.L.lvl;
  if (S.view === 'profile') renderProfile(P);
  return P;
}
/* the strip at the top of "today": who is training, at which level, and the run of weeks */
function playerHTML(P) {
  const me = S.cfg.me;
  return '<button class="player" id="playerBtn" type="button" aria-label="הפרופיל שלי: רמה ' + P.L.lvl + ', ' + P.rank.he + '"><span class="p-ava r' + P.rank.i + '">' + avatar(P.L.lvl, { bust: true }) + '</span>' +
    '<span class="p-txt"><b>' + (me.name ? 'היי, ' + esc(me.name) : 'היי!') + '</b><span class="p-rank"><span class="lv-badge">רמה ' + P.L.lvl + '</span>' + P.rank.he + '</span>' + xpBar(pctOf(P.L)) + '</span>' +
    (P.X.streak ? '<span class="p-streak" title="שבועות ברצף">' + glyph('flame') + '<b>' + P.X.streak + '</b></span>' : '') + '</button>';
}
function badgeHTML(b, on) { return '<li class="bdg' + (on ? ' on' : '') + '" aria-label="' + b.he + (on ? ', הושג' : ', עוד לא') + '"><span class="bdg-i">' + glyph(b.ic) + '</span><span>' + b.he + '</span></li>'; }
function renderProfile(P) {
  P = P || meNow();
  const me = S.cfg.me, L = P.L, nx = nextReward(L.lvl), have = new Set(Object.keys(me.badges).concat(earned(P.T, P.X)));
  const stat = (v, k) => '<div><b>' + v + '</b><span>' + k + '</span></div>';
  $('#profile').innerHTML = '<section class="pf-top">' + (me.made ? '<button class="icon-btn pf-edit" id="lookBtn" type="button" aria-label="עריכת הדמות">' + glyph('pen') + '</button>' : '') +
    '<div class="pf-stage">' + avatar(L.lvl) + '</div><h1 class="pf-name">' + (me.name ? esc(me.name) : 'הדמות שלי') + '</h1>' +
    '<p class="pf-rank"><span class="lv-badge">רמה ' + L.lvl + '</span>' + P.rank.he + '</p>' +
    '<div class="xp">' + xpBar(pctOf(L)) + '<div class="xp-l"><span>עוד ' + nf(L.need - L.into) + ' נק׳ לרמה ' + (L.lvl + 1) + '</span><span>' + Ltr(nf(L.into) + ' / ' + nf(L.need)) + '</span></div></div>' +
    (me.made ? '' : '<button class="btn primary" id="lookBtn" type="button">' + glyph('pen') + 'עיצוב הדמות</button>') + '</section>' +
    '<div class="pf-stats">' + stat(nf(P.T.wk), 'אימונים') + stat(P.X.streak, 'שבועות ברצף') + stat(nf(P.T.prs), 'שיאים') + stat(Ltr(tons(P.T.kg)), 'טון הורמו') + '</div>' +
    (nx ? '<section class="pf-next">' + glyph('gift') + '<span><small>הפרס הבא</small><b>' + nx.he + '</b></span><em>רמה ' + nx.at + '</em></section>' : '') +
    '<section class="pf-sec"><h2 class="sec">הישגים <small>' + have.size + '/' + BADGES.length + '</small></h2><ul class="badges">' + BADGES.map((b) => badgeHTML(b, have.has(b.id))).join('') + '</ul></section>' +
    '<section class="pf-sec"><h2 class="sec">איך צוברים נקודות</h2><div class="pf-how"><span><b>' + Ltr('+' + XP.set) + '</b>סט</span><span><b>' + Ltr('+' + XP.pr) + '</b>שיא אישי</span><span><b>' + Ltr('+' + XP.done) + '</b>סיום אימון</span></div></section>';
}

/* ---- the character sheet: name and looks; every choice is saved at once ---- */
function lookRows() {
  const k = S.cfg.me.look, sw = (key, list, hex) => '<div class="lk-opts" role="group">' + list.map((c, i) => '<button type="button" class="lk-sw" data-look="' + key + '" data-v="' + i + '" aria-pressed="' + (k[key] === i) + '" aria-label="אפשרות ' + (i + 1) + '" style="--c:' + hex(c) + '"></button>').join('') + '</div>';
  const seg = (key, list) => '<div class="seg" role="group">' + list.map((t, i) => '<button type="button" data-look="' + key + '" data-v="' + i + '" aria-pressed="' + (k[key] === i) + '">' + t + '</button>').join('') + '</div>';
  return '<div class="lk-row"><span>עור</span>' + sw('skin', SKIN, (c) => c[0]) + '</div><div class="lk-row"><span>שיער</span>' + seg('hair', HAIR) + '</div>' +
    '<div class="lk-row"><span>צבע שיער</span>' + sw('hc', HAIRC, (c) => c) + '</div><div class="lk-row"><span>זקן</span>' + seg('beard', BEARD) + '</div><div class="lk-row"><span>חולצה</span>' + sw('shirt', SHIRT, (c) => c) + '</div>';
}
function openLook() {
  const me = S.cfg.me, sh = $('#sheet');
  S.sheet = 'look';
  sh.innerHTML = '<div class="sheet-in lk" role="dialog" aria-modal="true" aria-label="הדמות שלי"><div class="ed-h"><div><h2>הדמות שלי</h2></div><button class="icon-btn" data-close="1" type="button" aria-label="סגור">' + ICON.x + '</button></div>' +
    '<div class="lk-stage" id="lkStage">' + avatar(S.lvl || 1) + '</div>' +
    '<label class="lk-row" for="lkName"><span>שם</span><input id="lkName" type="text" maxlength="16" autocomplete="off" placeholder="השם שלך" value="' + esc(me.name) + '"></label>' +
    '<div id="lkRows">' + lookRows() + '</div><button class="btn primary big" data-close="1" type="button">סיום</button></div>';
  sh.hidden = false;
}
function setLook(key, v) {
  const me = S.cfg.me; if (!(key in me.look)) return;
  me.look[key] = v; me.made = me.made || Date.now(); saveCfg();
  $('#lkStage').innerHTML = avatar(S.lvl || 1); $('#lkRows').innerHTML = lookRows();
}
function setName(v) { const me = S.cfg.me, n = String(v || '').trim().slice(0, 16); if (n === me.name) return; me.name = n; me.made = me.made || Date.now(); saveCfg(); }
/* clicks and typing inside the sheet that belong to this file; returns true when the click was handled */
function meSheetClick(ev) { const b = ev.target.closest('[data-look]'); if (!b) return false; setLook(b.dataset.look, +b.dataset.v); return true; }
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
      o.type = 'triangle'; o.frequency.value = f;
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.22, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + (i === 3 ? 0.5 : 0.18));
      o.connect(gn); gn.connect(actx.destination); o.start(t); o.stop(t + 0.55);
    });
  } catch (e) { /* no audio here */ }
}
function levelUp(lvl) { toast(glyph('star') + '<b>רמה ' + lvl + '!</b>'); chime(); buzz([50, 40, 50, 40, 120]); }
/* call after a change that may have earned points, with the level from before it */
function bump(lv0) { if (lv0 && S.lvl > lv0) levelUp(S.lvl); }
/* paper confetti over a sheet: a short burst that falls and stops by itself */
function confetti(cv, n) {
  if (!cv || reduced) return;
  const g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight, cs = getComputedStyle(document.documentElement);
  cv.width = W * dpr; cv.height = H * dpr; g.scale(dpr, dpr);
  const cols = ['--accent', '--ok', '--rest', '--muscle'].map((v) => cs.getPropertyValue(v).trim()), t0 = performance.now();
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
  $('#lvlChip').addEventListener('click', () => { closeChat(); setView('profile'); });
  $('#profile').addEventListener('click', (ev) => { if (ev.target.closest('#lookBtn')) openLook(); });
}
