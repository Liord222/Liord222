// Wraps ../index.html in the document skeleton the artifact viewer adds, so the page can be opened from disk.
const fs = require('fs'), os = require('os'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const head = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';
const file = path.join(os.tmpdir(), 'gymi-preview.html');
fs.writeFileSync(file, head + src + '</body></html>');
module.exports = file;
