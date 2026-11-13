/* The words of the product film as transparent pictures, set by a real browser (Hebrew runs right to left, and the
   browser shapes it properly). One PNG per entry of edit/product_copy.json, trimmed to the words plus a margin.
     node ui/titles.js [res]        (res: the film's width, 1920 by default) -> $CM/titles/<res>/<id>.png */
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const RES = +(process.argv[2] || 1920), K = RES / 1920;
const CM = process.env.CM || path.join(__dirname, '..', 'work');
const OUT = path.join(CM, 'titles', String(RES));
const COPY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'edit', 'product_copy.json'), 'utf8'));
const FONT = (w) => 'data:font/ttf;base64,' + fs.readFileSync(path.join(__dirname, '..', 'assets', `Rubik-${w}.ttf`)).toString('base64');

/* sizes are for a 1920-wide film */
const STYLE = {
  open: 'font-weight:300; font-size:112px; line-height:1.12; letter-spacing:-0.5px; color:#f5f5f7;',
  head: 'font-weight:500; font-size:96px; line-height:1.08; letter-spacing:-1px; color:#f5f5f7;',
  sub: 'font-weight:400; font-size:44px; line-height:1.3; color:#a1a1a6;',
  end: 'font-weight:400; font-size:50px; line-height:1.2; background:linear-gradient(270deg,#6e93ff 0%,#a9b9ff 55%,#f2b02e 100%); -webkit-background-clip:text; background-clip:text; color:transparent;',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: RES, height: Math.round(RES * 9 / 16) }, deviceScaleFactor: 1 })).newPage();
  const faces = [300, 400, 500, 700, 800].map((w) => `@font-face{font-family:R;font-weight:${w};src:url('${FONT(w)}')}`).join('');
  for (const [id, c] of Object.entries(COPY)) {
    if (id === '_') continue;
    const lines = c.text.split('\n').map((l) => `<div>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`).join('');
    await p.setContent(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><style>${faces}
      html,body{margin:0;background:transparent}
      #t{display:inline-block;padding:${Math.round(24 * K)}px ${Math.round(30 * K)}px;font-family:R;white-space:nowrap;zoom:${K};${STYLE[c.style]}
         -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;font-feature-settings:'kern'}
      </style></head><body><span id="t">${lines}</span></body></html>`);
    await p.evaluate(async () => { await document.fonts.ready; if (![...document.fonts].some((f) => f.status === 'loaded')) throw new Error('Rubik did not load'); });
    const el = await p.$('#t');
    await el.screenshot({ path: path.join(OUT, id + '.png'), omitBackground: true });
  }
  await b.close();
  console.log('titles', OUT);
})();
