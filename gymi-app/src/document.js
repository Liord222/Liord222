// The document the shell shows: a small bridge script, the coach module, then the gymi page itself.
// The bridge stands in for what the page gets when it runs inside Claude, using the phone instead:
// the log is mirrored to the phone's own storage, exporting opens the share sheet, vibration becomes
// haptics, the screen stays awake during a workout, and the coach answers through the owner's API key.
import page from './gymiPage';
import coach from './coachBundle';

const KEY = 'ul4:v1';
/* a value that is safe to drop into an inline <script> */
const LS = String.fromCharCode(8232), PS = String.fromCharCode(8233);
const lit = (v) => JSON.stringify(v == null ? null : v).replace(/</g, '\\u003c').split(LS).join('\\u2028').split(PS).join('\\u2029');
/* a whole script that is safe inside <script>…</script> */
const inline = (js) => js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

function bridge(saved, theme, platform, hasKey) {
  return `(function () {
  var KEY = ${lit(KEY)}, saved = ${lit(saved)}, last = null, timer = 0, waits = {}, wn = 0;
  if (!window.ReactNativeWebView) {
    window.ReactNativeWebView = { postMessage: function (m) { parent.postMessage(m, '*'); } };
    window.addEventListener('message', function (e) { if (e.source === parent && e.data && typeof e.data.gymiRun === 'string') { try { (0, eval)(e.data.gymiRun); } catch (err) {} } });
  }
  var post = function (m) { try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {} };
  /* a question to the shell that gets an answer back */
  var call = function (m) { return new Promise(function (res) { var id = 'r' + (++wn); waits[id] = res; m.id = id; post(m); }); };
  window.__gymiReply = function (id, v) { var w = waits[id]; if (w) { delete waits[id]; w(v); } };
  window.GYMI_NATIVE = ${lit(platform)};
  window.GYMI_COACH = ${lit(!!hasKey)};
  window.gymiNative = { key: function () { post({ type: 'key-edit' }); }, lang: function (l) { post({ type: 'lang', lang: l === 'en' ? 'en' : 'he' }); } };
  document.documentElement.setAttribute('data-theme', ${lit(theme)});
  /* the phone keeps its own copy of the log: put it back if this view's storage came up empty */
  try { if (saved && !localStorage.getItem(KEY)) localStorage.setItem(KEY, saved); } catch (e) {}
  /* and every save is mirrored back to the phone */
  var flush = function () { clearTimeout(timer); if (last != null) { post({ type: 'save', data: last }); last = null; } };
  try {
    var set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      set.apply(this, arguments);
      if (k === KEY && this === window.localStorage) { last = String(v); clearTimeout(timer); timer = setTimeout(flush, 400); }
    };
  } catch (e) {}
  document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });
  window.addEventListener('pagehide', flush);
  try { Object.defineProperty(navigator, 'vibrate', { configurable: true, value: function (p) { post({ type: 'haptic', strong: Array.isArray(p) }); return true; } }); } catch (e) {}
  try {
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: function () {
      post({ type: 'awake', on: true });
      return Promise.resolve({ release: function () { post({ type: 'awake', on: false }); return Promise.resolve(); }, addEventListener: function () {} });
    } } });
  } catch (e) {}
  /* the coach: the page's question goes to Claude with the key the shell keeps in the phone's secure storage */
  var b64 = function (blob) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1] || ''); }; r.onerror = rej; r.readAsDataURL(blob); }); };
  var sample = function (input, opts) {
    opts = opts || {};
    var msgs = typeof input === 'string' ? [{ role: 'user', content: input }] : input.slice(), system = '';
    if (msgs.length > 1 && msgs[0].role === 'user' && msgs[1].role === 'user') { system = String(msgs[0].content); msgs = msgs.slice(1); }
    return Promise.all([call({ type: 'key-get' }), Promise.all((opts.images || []).map(b64))]).then(function (r) {
      if (!r[0]) return Promise.reject({ code: 'no_key', message: 'no key' });
      if (!window.gymiAsk) return Promise.reject({ code: 'upstream_error', message: 'coach module missing' });
      return window.gymiAsk({ key: r[0], system: system, messages: msgs, images: r[1], signal: opts.signal, onText: opts.onText });
    });
  };
  sample.limits = function () { return Promise.resolve({ images: { maxCount: 1 } }); };
  window.claude = { use: function (name) {
    if (name === 'sample') return Promise.resolve(sample);
    if (name === 'downloads') return Promise.resolve({ save: function (r) { post({ type: 'export', filename: String((r && r.filename) || 'gymi-log.csv'), data: String((r && r.data) || '') }); return Promise.resolve({ status: 'saved' }); } });
    return Promise.resolve(null);
  } };
})();`;
}

export function buildDocument(saved, theme, platform, hasKey) {
  return '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover,user-scalable=no">' +
    '<style>body{margin:0;font:14px -apple-system,system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}html,body{overscroll-behavior:none;-webkit-touch-callout:none}</style>' +
    '<script>' + bridge(saved, theme, platform, hasKey) + '</script><script>' + inline(coach) + '</script></head><body>' + page + '</body></html>';
}
