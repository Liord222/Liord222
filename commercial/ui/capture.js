// Captures the real gymi app, frame by frame, for the commercial.
// The page runs under a virtual clock: every film frame (1/24 s) advances the app's own timers, CSS animations and
// canvas demos by exactly one frame, so nothing is sped up, slowed down or skipped.
//   node capture.js [take ...]      (no take: all of them)
// Output: $OUT/<take>/0000.png ... at 402×874 pt × SCALE, with the iPhone 17 Pro safe areas (62 pt top, 34 pt bottom).
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const OUT = process.env.OUT || path.join(process.env.CM || path.join(__dirname, '..', 'work'), 'ui');
const SCALE = +(process.env.SCALE || 2);
const APP = fs.readFileSync(path.join(__dirname, '../../workout-app/index.html'), 'utf8');
const UILANG = process.env.UILANG || 'he', NAME = UILANG === 'he' ? 'ליאור' : 'Sam';
const LOOK = { skin: 1, hair: 2, hc: 1, beard: 1, shirt: 0 };

/* a finger: a soft disc where the tap lands, then the click */
const TAP = `<style>.__tap{position:fixed;z-index:99999;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;background:rgba(14,17,22,.16);box-shadow:inset 0 0 0 2px rgba(255,255,255,.7),0 6px 20px rgba(0,0,0,.18);pointer-events:none;animation:__tap .5s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes __tap{0%{transform:scale(.55);opacity:0}22%{transform:scale(.92);opacity:1}100%{transform:scale(1.25);opacity:0}}</style>`;
function wrap(splash) {
  return '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>' +
    '<script>window.__splash=' + (splash ? 'true' : 'false') + ';window.__hx=false;' +
    'window.__tap=function(sel){var el=document.querySelector(sel);if(!el)return "missing "+sel;var r=el.getBoundingClientRect(),d=document.createElement("div");d.className="__tap";d.style.left=(r.left+r.width/2)+"px";d.style.top=(r.top+r.height/2)+"px";document.body.appendChild(d);setTimeout(function(){d.remove()},600);el.click();return "ok"};</script>' +
    TAP + '</head><body>' + APP + '</body></html>';
}
/* a lifter who has trained for three weeks: the plan has history, so every set has a target */
function history(now) {
  const day = 864e5, ses = {}; let k = 0;
  return { ses, k };
}
const fresh = { sound: false, buzz: false, dirty: [], gone: [], sessions: {}, cfg: { upd: 1, lang: UILANG, weeks: 5 } };

const TAKES = {
  /* the app opening: the black curtain, the scene, the character falling in, Eilon; a tap levels the character up */
  welcome: { frames: 112, splash: true, store: fresh, at: { 86: ['tap', '#obMe'], 100: ['tap', '#obMe'] } },
  /* the character designer, answered choice by choice, ending on the hero's look */
  character: {
    frames: 66, store: fresh, pre: 24,
    setup: `OB.name='${NAME}'; OB.exp=1; OB.goal=0; S.cfg.me.look={skin:3,hair:1,hc:0,beard:0,shirt:0}; OB.step=4; renderOb();`,
    at: { 6: ['tap', '#ob [data-look="hair"][data-v="2"]'], 19: ['tap', '#ob [data-look="skin"][data-v="1"]'], 32: ['tap', '#ob [data-look="hc"][data-v="1"]'], 45: ['tap', '#ob [data-look="beard"][data-v="1"]'] },
  },
  /* Eilon offers the plan, line after line */
  plan: { frames: 84, store: fresh, setup: `OB.name='${NAME}'; OB.exp=1; OB.goal=0; S.cfg.me.look=${JSON.stringify(LOOK)}; OB.step=5; renderOb();` },
  /* the workout: the character on the incline press; Swap; the alternatives; one tap */
  swap: { frames: 104, store: 'lifter', workout: true, xp: 2150, at: { 34: ['tap', '.ex.open .swap'], 58: ['tap', '#sheet .sw-row[data-sel]'], 74: ['tapAny', ['#sheet .sw-b [data-mode="today"]', '#sheet .sw-b [data-mode="always"]']] } },
  /* the game: a set is done, points fly, the level goes up */
  set: { frames: 72, store: 'lifter', workout: true, xp: 2235, at: { 10: ['tap', '#dkHit'] } },
  /* the end of a workout: confetti, what was unlocked */
  done: { frames: 72, store: 'lifter', workout: true, xp: 2238, setup: `const e=findEx(S.open); for(let i=0;i<3;i++) writeRow(e,i,47.5,10); renderAll();`, at: { 2: ['eval', `closeSheet && closeSheet(); openList();`], 8: ['tap', '#finishBtn'] } },
  /* today: the hero's home screen */
  home: { frames: 72, store: 'lifter', xp: 2300 },
  /* the demo of the exercise he is about to do, for the shot back in the gym */
  smith: { frames: 84, store: 'lifter', workout: true, xp: 2150 },
};

async function lifterStore(p0) {
  return p0.evaluate(([look, UILANG, NAME]) => {
    const now = Date.now(), day = 864e5, ses = {}; let k = 0;
    for (let wk = 1; wk <= 3; wk++) for (let w = 0; w < 4; w++) {
      const ts = now - ((3 - wk) * 7 + (5 - w) * 1.5 + 1) * day, id = 'e' + (++k), sets = {}, fb = {};
      for (const e of PLAN[w].ex) { const kg = 40 + wk * 2.5; sets[e.id] = Array.from({ length: e.sets }, (_, i) => ({ kg, reps: 8 + (i ? 0 : 1), done: true, t: ts + i * 6e4, tk: kg, tr: 8 })); fb[e.id] = { pain: 0, pump: 2, load: 1 }; }
      ses[id] = { id, v: 3, w, ts, end: ts + 3e6, mt: ts, upd: ts, ft: ts, m: 'm1', wk, dl: 0, rir: rirFor(wk, 5), n: {}, mv: {}, sore: {}, cut: {}, fb, sets };
    }
    return { sound: false, buzz: false, dirty: [], gone: [], sessions: ses, cfg: { upd: 5, lang: UILANG, weeks: 5, notes: {}, meso: { id: 'm1', n: 1, start: 0, early: 0 }, past: [], me: { name: NAME, made: 1, ob: Date.now(), exp: 1, goal: 0, look } } };
  }, [LOOK, UILANG, NAME]);
}

(async () => {
  const want = process.argv.slice(2), names = want.length ? want : Object.keys(TAKES);
  const b = await chromium.launch();
  const pages = { true: '/tmp/cm-splash.html', false: '/tmp/cm-app.html' };
  fs.writeFileSync(pages.true, wrap(true)); fs.writeFileSync(pages.false, wrap(false));
  /* the lifter's log is made by the app's own code */
  const p0 = await (await b.newContext()).newPage(); await p0.goto('file://' + pages.false); await p0.waitForTimeout(500);
  const lifter = await lifterStore(p0); await p0.context().close();
  for (const name of names) {
    const T = TAKES[name]; if (!T) { console.log('no take', name); continue; }
    const dir = path.join(OUT, name); fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: SCALE, locale: UILANG === 'he' ? 'he-IL' : 'en-US', colorScheme: 'light', hasTouch: false });
    const p = await ctx.newPage(), errs = []; p.on('pageerror', (e) => errs.push(e.message));
    const store = T.store === 'lifter' ? lifter : T.store;
    await p.addInitScript((s) => { localStorage.setItem('ul4:v1', JSON.stringify(s)); }, store);
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 62, bottom: 34, left: 0, right: 0 } });
    /* a first visit warms the fonts */
    await p.goto('file://' + pages[!!T.splash]); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
    const step = (ms) => new Promise((res) => { cdp.once('Emulation.virtualTimeBudgetExpired', res); cdp.send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: ms }); });
    if (T.splash) {
      await p.goto('about:blank');
      await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
      p.goto('file://' + pages.true, { waitUntil: 'commit' }).catch(() => {});
      await step(5);
    } else {
      await p.goto('file://' + pages.false); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
      if (T.xp != null) await p.evaluate((x) => { const t = meNow().T.xp, a = S.cfg.me.arch || {}; S.cfg.me.arch = Object.assign({ xp: 0, sets: 0, wk: 0, pr: 0, until: 0 }, a, { xp: (a.xp || 0) + (x - t) }); renderAll(); }, T.xp);
      if (T.workout) { await p.click('#homeGo'); await p.waitForTimeout(400); if (await p.$('#preAll')) { await p.click('#preAll'); await p.waitForTimeout(400); } }
      if (T.setup) { await p.evaluate(T.setup); }
      await p.waitForTimeout(300);
      await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
    }
    for (let i = 0; i < (T.pre || 0); i++) await step(1000 / 24);
    const log = [];
    for (let f = 0; f < T.frames; f++) {
      const a = T.at && T.at[f];
      if (a) {
        const r = a[0] === 'tap' ? await p.evaluate((s) => window.__tap(s), a[1])
          : a[0] === 'tapAny' ? await p.evaluate((l) => { for (const s of l) if (document.querySelector(s)) return window.__tap(s); return 'missing all'; }, a[1])
            : await p.evaluate(a[1]).then(() => 'ok');
        log.push(f + ':' + r);
      }
      await step(1000 / 24);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 402, height: 874, scale: SCALE } });
      fs.writeFileSync(path.join(dir, String(f).padStart(4, '0') + '.png'), Buffer.from(shot.data, 'base64'));
    }
    console.log(name, T.frames, 'frames', log.join(' '), errs.length ? 'ERRORS ' + errs.join(' | ') : '');
    await ctx.close();
  }
  await b.close();
})();
