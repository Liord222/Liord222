// Wraps ../index.html in the document skeleton the artifact viewer adds, so the page can be opened from disk.
const fs = require('fs'), os = require('os'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const head = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';
/* HX=1 dresses every control as on an iPhone browser (a clear label over it, see feel.js), to prove that presses still arrive */
const hx = process.env.HX === '1';
/* one file per checkout: a run from another worktree must not swap the build under test. Moved into place in one step: several runs of this checkout share it */
const tag = require('crypto').createHash('sha1').update(path.join(__dirname, '..')).digest('hex').slice(0, 10);
const file = path.join(os.tmpdir(), 'gymi-preview-' + tag + (hx ? '-hx' : '') + '.html');
/* the black curtain of the first seconds is left out, unless a test asks for it (window.__splash = true before the page loads) */
fs.writeFileSync(file + '.' + process.pid, head + '<script>if(window.__splash===undefined)window.__splash=false</script>' + (hx ? '<script>window.__hx=true</script>' : '') + src + '</body></html>'); fs.renameSync(file + '.' + process.pid, file);
module.exports = file;
