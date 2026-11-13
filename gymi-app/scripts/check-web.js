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
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', acceptDownloads: true, locale: 'he-IL' }), p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/status of 401/.test(m.text())) errs.push('CONSOLE ' + m.text()); });  // the 401 is this script's own test
  const inner = async () => { await p.waitForSelector('iframe[title="gymi"]'); const f = p.frames().find((x) => x !== p.mainFrame()); await f.waitForSelector('#homeGo', { state: 'attached' }); return f; };
  await p.goto(url); let f = await inner(); await p.waitForTimeout(500);
  check('a new phone is met by the opening screens', await f.isVisible('#ob'), 'ob');
  await f.click('#obSkip'); await f.waitForTimeout(300);
  const txt = (sel) => f.evaluate((s) => (document.querySelector(s) || { innerText: '' }).innerText.replace(/\n/g, ' '), sel);
  check('the page boots inside the shell', (await txt('#home .next')).includes('גוף עליון A') && (await txt('#playerBtn')).includes('רמה 1') && (await f.evaluate(() => window.GYMI_NATIVE)) === 'web', await txt('#home'));
  check('the shell passes the phone\'s dark mode to the page', (await f.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark', 'theme');
  check('the page says it is saved on this device', (await txt('#syncNote')).includes('במכשיר'), await txt('#syncNote'));
  await f.click('#homeGo'); await f.waitForTimeout(600);
  await f.click('#dkKg'); await f.fill('#dkKgIn', '60'); await p.keyboard.press('Enter'); await f.waitForTimeout(150);
  await f.click('#dkHit'); await f.waitForTimeout(1400);
  const copy = await p.evaluate(() => localStorage.getItem('gymi:log:v1'));
  check('a logged set is mirrored to the phone\'s storage', !!copy && copy.includes('"kg":60'), copy && copy.slice(0, 120));
  // the player: with no account to wait for, the profile counts the log at once and keeps the character on the phone
  check('the set earned its points on the phone too', (await f.evaluate(() => [meNow().T.xp, S.cfgReady].join())) === '10,true', await f.evaluate(() => meNow().T.xp));
  check('the back button returns from the workout to today', (await f.evaluate(() => [window.gymiBack(), S.view, window.gymiBack()].join())) === 'true,home,false', 'back');
  await f.click('#chatOpen'); await f.waitForTimeout(300);
  // ---- the coach: a key saved in the shell, then a question answered by Claude (the API is answered by this script) ----
  const sse = ['message_start', 'content_block_start', 'content_block_delta', 'content_block_delta', 'content_block_stop', 'message_delta', 'message_stop'];
  const data = [{ type: 'message_start', message: { id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1 } } }, { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }, { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'פסיקה: מתאים\n' } }, { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'סקוואט בסמית׳ מחליף טוב את ההאק.' } }, { type: 'content_block_stop', index: 0 }, { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 12 } }, { type: 'message_stop' }];
  const calls = []; let status = 200;
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' };
  await ctx.route('https://api.anthropic.com/**', (route) => {
    const q = route.request();
    if (q.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    calls.push({ url: q.url(), headers: q.headers(), body: JSON.parse(q.postData() || '{}') });
    if (status !== 200) return route.fulfill({ status, headers: Object.assign({ 'content-type': 'application/json' }, cors), body: JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }) });
    return route.fulfill({ status: 200, headers: Object.assign({ 'content-type': 'text/event-stream' }, cors), body: sse.map((e, i) => 'event: ' + e + '\ndata: ' + JSON.stringify(data[i]) + '\n\n').join('') });
  });
  check('without a key the coach tab offers to connect', (await txt('#msgs')).includes('חיבור עם מפתח API') && !(await f.evaluate(() => window.GYMI_COACH)), await txt('#msgs'));
  await f.click('#coachKey'); await p.waitForSelector('[data-testid="keyInput"]');
  await p.fill('[data-testid="keyInput"]', 'sk-ant-test-000000000000000000000000'); await p.click('[data-testid="keySave"]'); await p.waitForTimeout(500);
  check('saving a key connects the coach', (await f.evaluate(() => window.GYMI_COACH)) === true && (await txt('#msgs')).includes('היי, אני אילון') && (await p.evaluate(() => localStorage.getItem('gymi.anthropic.key'))) === 'sk-ant-test-000000000000000000000000', await txt('#msgs'));
  await f.fill('#chatInput', 'ההאק תפוס, מה במקום?'); await f.click('#sendBtn'); await p.waitForTimeout(1500);
  const c0 = calls[0] || { headers: {}, body: {} };
  check('the question goes to Claude through the SDK with the saved key', calls.length === 1 && c0.url.includes('/v1/messages') && String(c0.headers.authorization || c0.headers['x-api-key']).includes('sk-ant-test-000000000000000000000000') && c0.body.model === 'claude-opus-5-5' && c0.body.stream === true && c0.body.fallbacks === 'default' && String(c0.headers['anthropic-beta']).includes('server-side-fallback') && String(c0.body.system).includes('אתה אילון') && c0.body.messages[0].role === 'user' && String(c0.body.messages[0].content).includes('ההאק תפוס'), [calls.length, c0.url, c0.body.model, c0.body.fallbacks, c0.headers['anthropic-beta'], c0.body.stream, String(c0.body.system).slice(0, 40), JSON.stringify(c0.body.messages).slice(0, 300)]);
  check('the streamed answer is shown, with its verdict', (await txt('.verdict')) === 'מתאים' && (await txt('#msgs')).includes('סקוואט בסמית׳ מחליף טוב'), await txt('#msgs'));
  status = 401; await f.fill('#chatInput', 'עוד שאלה'); await f.click('#sendBtn'); await p.waitForTimeout(1500);
  check('a key that Anthropic rejects is explained', (await txt('#compNote')).includes('המפתח לא התקבל'), await txt('#compNote'));
  status = 200;
  await f.click('#chatKey'); await p.waitForSelector('[data-testid="keyRemove"]'); await p.click('[data-testid="keyRemove"]'); await p.waitForTimeout(500);
  check('removing the key disconnects the coach', (await f.evaluate(() => window.GYMI_COACH)) === false && (await txt('#msgs')).includes('חיבור עם מפתח API') && (await p.evaluate(() => localStorage.getItem('gymi.anthropic.key'))) === null, await txt('#msgs'));
  // the web view's own storage is wiped: the phone's copy brings the log back
  await p.evaluate(() => localStorage.removeItem('ul4:v1')); await p.reload(); f = await inner(); await p.waitForTimeout(600);
  const back = await f.evaluate(() => { const s = Object.values(S.sessions)[0]; return s ? [Object.keys(S.sessions).length, s.sets.ua1[0].kg, s.sets.ua1[0].done, S.view].join() : 'none'; });
  check('the log comes back from the phone\'s copy after the page storage is emptied', back === '1,60,true,workout', back);
  await f.evaluate(() => setView('profile')); await f.waitForTimeout(300); await f.click('#lookBtn'); await f.waitForTimeout(200);
  await f.fill('#lkName', 'ליאור'); await f.dispatchEvent('#lkName', 'change'); await f.click('#sheet [data-look="shirt"][data-v="1"]'); await f.click('#sheet [data-close]'); await p.waitForTimeout(700);
  const kept = JSON.parse(await p.evaluate(() => localStorage.getItem('gymi:log:v1')) || '{}');
  check('the character is kept in the phone\'s copy', (await txt('.pf-name')) === 'ליאור' && !!kept.cfg && kept.cfg.me.name === 'ליאור' && kept.cfg.me.look.shirt === 1, kept.cfg && kept.cfg.me);
  await f.evaluate(() => { setView('workout', true); });
  await f.click('#listBtn'); await f.waitForTimeout(300); await f.click('#finishBtn'); await f.waitForTimeout(500); await f.click('#sheetClose'); await f.waitForTimeout(300);
  await f.click('#tabbar [data-view="progress"]'); await f.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), f.click('#exportBtn')]);
  check('export hands the shell a csv file', !!dl && dl.suggestedFilename() === 'gymi-log.csv', dl && dl.suggestedFilename());
  console.log('PASS ' + ok.length); console.log('FAIL ' + bad.length + (bad.length ? ':\n  ' + bad.join('\n  ') : '')); console.log('ERRORS: ' + (errs.join(' | ') || 'none'));
  await b.close(); srv.close(); fs.rmSync(dist, { recursive: true, force: true });
  if (bad.length || errs.length) process.exit(1);
})().catch((e) => { console.log('PASS ' + ok.length, 'FAIL', bad); console.log('CRASH', String(e.message).split('\n').slice(0, 6).join('\n')); process.exit(1); });
