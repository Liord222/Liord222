// Assembles the single-file page from src/ parts: node build.js
const fs = require('fs'), path = require('path');
const read = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const js = ['plan.js', 'lib.js', 'prog.js', 'game.js', 'rig.js', 'moves.js', 'avatar.js', 'store.js', 'stage.js', 'app.js', 'feel.js', 'coach.js', 'me.js', 'chat.js', 'onboard.js', 'boot.js'].map(read).join('\n');
const html = '<title>gymi</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap">\n' +
  '<style>\n' + read('styles.css') + '</style>\n' + read('body.html') + '\n<script>\n\'use strict\';\n' + js + '</script>\n';
/* written under another name and moved into place, so that nothing ever reads half a page */
const out = path.join(__dirname, 'index.html'), tmp = out + '.' + process.pid + '.tmp';
fs.writeFileSync(tmp, html); fs.renameSync(tmp, out);
console.log('built index.html', (html.length / 1024).toFixed(1) + ' KB');
