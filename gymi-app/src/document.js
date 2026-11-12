// The document the shell shows: a small bridge script, then the gymi page itself.
// The bridge stands in for what the page gets when it runs inside Claude, using the phone instead:
// the log is mirrored to the phone's own storage, exporting opens the share sheet, vibration becomes
// haptics, and the screen stays awake during a workout.
import page from './gymiPage';

const KEY = 'ul4:v1';
/* a value that is safe to drop into an inline <script> */
const LS = String.fromCharCode(8232), PS = String.fromCharCode(8233);
const lit = (v) => JSON.stringify(v == null ? null : v).replace(/</g, '\\u003c').split(LS).join('\\u2028').split(PS).join('\\u2029');

function bridge(saved, theme, platform) {
  return `(function () {
  var KEY = ${lit(KEY)}, saved = ${lit(saved)}, last = null, timer = 0;
  if (!window.ReactNativeWebView) {
    window.ReactNativeWebView = { postMessage: function (m) { parent.postMessage(m, '*'); } };
    window.addEventListener('message', function (e) { if (e.source === parent && e.data && typeof e.data.gymiRun === 'string') { try { (0, eval)(e.data.gymiRun); } catch (err) {} } });
  }
  var post = function (m) { try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {} };
  window.GYMI_NATIVE = ${lit(platform)};
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
  window.claude = { use: function (name) {
    if (name === 'downloads') return Promise.resolve({ save: function (r) { post({ type: 'export', filename: String((r && r.filename) || 'gymi-log.csv'), data: String((r && r.data) || '') }); return Promise.resolve({ status: 'saved' }); } });
    return Promise.resolve(null);
  } };
})();`;
}

export function buildDocument(saved, theme, platform) {
  return '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover,user-scalable=no">' +
    '<style>body{margin:0;font:14px -apple-system,system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}html,body{overscroll-behavior:none;-webkit-touch-callout:none}</style>' +
    '<script>' + bridge(saved, theme, platform) + '</script></head><body>' + page + '</body></html>';
}
