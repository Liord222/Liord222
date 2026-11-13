// The neutral search page, as two stills: as it was, and with gymi lit (the moment the screen wakes on the floor).
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(process.env.CM || path.join(__dirname, '..', 'work'), 'ui');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: +(process.env.SCALE || 2) }), p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 62, bottom: 34, left: 0, right: 0 } });
  await p.goto('file://' + path.join(__dirname, 'search.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  fs.mkdirSync(path.join(OUT, 'search'), { recursive: true });
  await p.screenshot({ path: path.join(OUT, 'search', 'plain.png') });
  await p.evaluate(() => document.body.classList.add('glow')); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, 'search', 'glow.png') });
  /* the gymi icon's place on the screen, for the dive into it */
  console.log(JSON.stringify(await p.evaluate(() => { const r = document.querySelector('.app img').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })));
  await b.close();
})();
