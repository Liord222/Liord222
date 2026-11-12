// Checks the shell and its bridge in a real browser: node scripts/check-web.js  (needs playwright)
// It exports the web build, where the page runs in an iframe and talks to the shell with the same messages as on a phone.
const { chromium } = require('playwright'), { execFileSync } = require('child_process'), http = require('http'), fs = require('fs'), os = require('os'), path = require('path');
const root = path.join(__dirname, '..'), dist = fs.mkdtempSync(path.join(os.tmpdir(), 'gymi-web-'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.css': 'text/css' };
const ok = [], bad = [], errs = [];
const check = (name, cond, info) => (cond ? ok : bad).push(name + (cond ? '' : ' -> ' + JSON.stringify(info)));
(async () => {
  execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', dist], { cwd: root, stdio: 'ignore', env: Object.assign({}, process.env, { EXPO_OFFLINE: '1', CI: '1' }) });
  const srv = http.createServer((q, r) => {
    let f = path.join(dist, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, 'index.html');
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res));
  const url = 'http://127.0.0.1:' + srv.address().port + '/';
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', acceptDownloads: true }), p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const inner = async () => { await p.waitForSelector('iframe[title="gymi"]'); const f = p.frames().find((x) => x !== p.mainFrame()); await f.waitForSelector('#homeGo', { state: 'attached' }); return f; };
  await p.goto(url); let f = await inner(); await p.waitForTimeout(500);
  const txt = (sel) => f.evaluate((s) => (document.querySelector(s) || { innerText: '' }).innerText.replace(/\n/g, ' '), sel);
  check('the page boots inside the shell', (await txt('#home .next')).includes('Upper A') && (await f.evaluate(() => window.GYMI_NATIVE)) === 'web', await txt('#home'));
  check('the shell passes the phone\'s dark mode to the page', (await f.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark', 'theme');
  check('the page says it is saved on this device', (await txt('#syncNote')).includes('במכשיר'), await txt('#syncNote'));
  await f.click('#homeGo'); await f.waitForTimeout(400); await f.click('#dkStart'); await f.waitForTimeout(600);
  await f.click('#dkKg'); await f.fill('#dkKgIn', '60'); await p.keyboard.press('Enter'); await f.waitForTimeout(150);
  await f.click('#dkHit'); await f.waitForTimeout(1400);
  const copy = await p.evaluate(() => localStorage.getItem('gymi:log:v1'));
  check('a logged set is mirrored to the phone\'s storage', !!copy && copy.includes('"kg":60'), copy && copy.slice(0, 120));
  check('the back button returns from the workout to today', (await f.evaluate(() => [window.gymiBack(), S.view, window.gymiBack()].join())) === 'true,home,false', 'back');
  await f.click('#chatOpen'); await f.waitForTimeout(300);
  check('the coach tab explains that it is not connected in the app', (await txt('#msgs')).includes('אילון עוד לא מחובר'), await txt('#msgs'));
  // the web view's own storage is wiped: the phone's copy brings the log back
  await p.evaluate(() => localStorage.removeItem('ul4:v1')); await p.reload(); f = await inner(); await p.waitForTimeout(600);
  const back = await f.evaluate(() => { const s = Object.values(S.sessions)[0]; return s ? [Object.keys(S.sessions).length, s.sets.ua1[0].kg, s.sets.ua1[0].done, S.view].join() : 'none'; });
  check('the log comes back from the phone\'s copy after the page storage is emptied', back === '1,60,true,workout', back);
  await f.click('#finishBtn'); await f.waitForTimeout(500); await f.click('#sheetClose'); await f.waitForTimeout(300);
  await f.click('#tabbar [data-view="progress"]'); await f.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), f.click('#exportBtn')]);
  check('export hands the shell a csv file', !!dl && dl.suggestedFilename() === 'gymi-log.csv', dl && dl.suggestedFilename());
  console.log('PASS ' + ok.length); console.log('FAIL ' + bad.length + (bad.length ? ':\n  ' + bad.join('\n  ') : '')); console.log('ERRORS: ' + (errs.join(' | ') || 'none'));
  await b.close(); srv.close(); fs.rmSync(dist, { recursive: true, force: true });
  if (bad.length || errs.length) process.exit(1);
})().catch((e) => { console.log('PASS ' + ok.length, 'FAIL', bad); console.log('CRASH', String(e.message).split('\n').slice(0, 6).join('\n')); process.exit(1); });
