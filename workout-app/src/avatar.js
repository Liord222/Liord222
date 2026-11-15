/* ================================================================== the player's character
   One SVG figure, drawn from a few choices (skin, hair, beard, shirt) and from the level: the body fills out as the
   level climbs, and the gear opened along the way (see REWARDS) is worn from then on. The arms are two jointed groups,
   so a class on the root is enough to move between standing and flexing. */
const SKIN = [['#F8DEC9', '#E8BEA0'], ['#EFC4A0', '#D7A07A'], ['#DDAA80', '#C0885E'], ['#C18A5B', '#A06C42'], ['#8F5C38', '#714525'], ['#5F3C25', '#472B18']];
/* a haircut is drawn by its number; the list shows them in this order, each by the name a barber would use */
const HAIR = ['קרחת', 'קצר', 'מורם', 'מתולתל', 'ארוך', 'פוני', 'קצוץ', 'שביל בצד', 'בינוני', 'קוקו', 'פקעת', 'צמות', 'קארה', 'אפרו', 'מוהוק', 'קוקיות'];
const HAIR_EN = ['Bald', 'Short', 'Swept up', 'Curly', 'Long', 'Fringe', 'Buzz cut', 'Side part', 'Medium', 'Ponytail', 'Bun', 'Braids', 'Bob', 'Afro', 'Mohawk', 'Pigtails'];
/* the haircuts in the order they are offered: a boy's and a girl's, each list with every cut in it */
const HAIR_ORDER = [1, 6, 7, 5, 2, 3, 8, 13, 14, 4, 10, 9, 12, 11, 15, 0];
const HAIR_ORDER_F = [9, 10, 11, 12, 4, 15, 3, 13, 8, 5, 1, 7, 2, 6, 14, 0];
/* the figure: a boy's or a girl's build */
const BODY = () => [say('בן', 'Boy'), say('בת', 'Girl')];
const hairName = (i) => (LANG === 'en' ? HAIR_EN[i] : HAIR[i]);
const BEARDS = () => (LANG === 'en' ? ['None', 'Stubble', 'Full'] : BEARD);
const HAIRC = ['#1E1A18', '#3A2A21', '#5E4130', '#8A6446', '#B89058', '#DDBB78', '#A9502C', '#9B9AA0'];
const BEARD = ['בלי', 'זיפים', 'זקן מלא'];
/* shirts in the colours shirts come in: the gymi purple, white, black, grey, navy, olive, burgundy and sand */
const SHIRT = ['#6D3FE0', '#F2F2F4', '#1E1D24', '#8E8C97', '#25315E', '#5C6B3C', '#7A2340', '#CDBB9A'];
/* each clip of a patterned shirt needs a name of its own in the page */
let AV_N = 0;
/* hats that rise above the head: a portrait is cut wider for them (2: wider still) */
const HAT_TOP = { beanie: 1, ears: 1, horns: 1, halo: 1, propeller: 1, wreath: 1, party: 2, top: 2, cowboy: 2, viking: 2 };
const tone = (hex, k) => mixRgb(hexRgb(hex), k < 0 ? [0, 0, 0] : [255, 255, 255], Math.abs(k));
/* a colour of its own is taken only when it is a plain six-digit hex colour: it ends up inside the drawing's markup */
const ownHex = (v) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null);

/* o.bust: head and shoulders only, for small round portraits · o.flex: drawn flexing · o.still: no idle motion · o.grin: an open smile
   A look can also carry what only the coach has: a hair or shirt colour of its own (hairC, shirtC), the fringe (hair: 5),
   a stud in the ear (stud), and no gear whatever the level (gear: false). A player's look is cleaned to the choices above */
function avatarSVG(look, lvl, o) {
  o = o || {}; look = look || {};
  /* what is worn from the collection: one thing to a slot */
  const W = {}; if (Array.isArray(look.wear)) for (const id of look.wear) { const it = shopItem(id); if (it) W[it.slot] = it; }
  const b = Math.max(buildOf(lvl), o.base || 0), L = (a, z) => +(a + (z - a) * b).toFixed(1), has = (k) => look.gear !== false && REWARDS.some((r) => r.k === k && r.at <= lvl);
  const sk = SKIN[look.skin] || SKIN[1], skin = sk[0], shd = sk[1], hc = ownHex(look.hairC) || HAIRC[look.hc] || HAIRC[0], shirt = W.shirt ? W.shirt.c[0] : ownHex(look.shirtC) || SHIRT[look.shirt] || SHIRT[0], shirt2 = tone(shirt, -0.18);
  /* a girl's figure: narrower shoulders, a waist and hips, slimmer arms; she grows strong with the levels just the same */
  const fem = look.body === 1;
  const sw = fem ? L(27, 36) : L(31, 43), cw = fem ? L(25, 33) : L(27, 39), ww = fem ? L(19, 21.5) : L(22, 25), nw = fem ? L(7.2, 9.2) : L(8, 11.5), ua = fem ? L(11, 15.5) : L(12, 19), fa = fem ? L(9.4, 12.4) : L(10, 14.5), lg = fem ? L(16, 19.5) : L(16, 21), sy = L(96, 93.5), tank = has('tank'), hip = fem ? 6.5 : 1.5;
  const glove = W.hands ? W.hands.c : null, wr = W.wrist, f1 = (v) => +v.toFixed(1);
  const ln = (x1, y1, x2, y2, w, c) => '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" fill="none"/>';
  const dot = (x, y, r, c) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '"/>';
  const P = (d, c, extra) => '<path d="' + d + '" fill="' + c + '"' + (extra || '') + '/>';
  const X = (v) => +(100 + v).toFixed(1);

  /* the torso outline, shared by the shirt and (under a tank top) the bare chest */
  const torso = 'M' + X(-nw - 2) + ' 89L' + X(-sw + 7) + ' ' + sy + 'Q' + X(-sw - 1) + ' ' + (sy + 1) + ' ' + X(-sw - 1) + ' 106L' + X(-cw) + ' 120Q' + X(-ww - 1) + ' 140 ' + X(-ww) + ' 156L' + X(ww) + ' 156Q' + X(ww + 1) + ' 140 ' + X(cw) + ' 120L' + X(sw + 1) + ' 106Q' + X(sw + 1) + ' ' + (sy + 1) + ' ' + X(sw - 7) + ' ' + sy + 'L' + X(nw + 2) + ' 89Q100 97 ' + X(-nw - 2) + ' 89Z';
  const tankTop = 'M' + X(-nw - 6) + ' 91Q' + X(-nw - 5) + ' 112 ' + X(-cw + 1) + ' 121Q' + X(-ww - 1) + ' 140 ' + X(-ww) + ' 156L' + X(ww) + ' 156Q' + X(ww + 1) + ' 140 ' + X(cw - 1) + ' 121Q' + X(nw + 5) + ' 112 ' + X(nw + 6) + ' 91L' + X(nw + 1) + ' 91Q100 108 ' + X(-nw - 1) + ' 91Z';
  const pecs = fem ? '<path d="M' + X(-cw * 0.74) + ' 111Q' + X(-cw * 0.38) + ' 125 99.4 116.5M' + X(cw * 0.74) + ' 111Q' + X(cw * 0.38) + ' 125 100.6 116.5" stroke="' + (tank ? shd : shirt2) + '" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".6"/>' : b > 0.3 ? '<path d="M' + X(-cw * 0.74) + ' 119Q' + X(-cw * 0.38) + ' 127 99 121M' + X(cw * 0.74) + ' 119Q' + X(cw * 0.38) + ' 127 101 121" stroke="' + (tank ? shd : shirt2) + '" stroke-width="1.7" stroke-linecap="round" fill="none" opacity="' + Math.min(0.75, (b - 0.3) * 1.4).toFixed(2) + '"/>' : '';
  /* small shapes that several things share */
  const starP = (x, y, R, r) => { let q = ''; for (let k = 0; k < 10; k++) { const a = ((-90 + k * 36) * Math.PI) / 180, v = k % 2 ? r : R; q += (k ? 'L' : 'M') + f1(x + Math.cos(a) * v) + ' ' + f1(y + Math.sin(a) * v); } return q + 'Z'; };
  const heartP = (x, y, k) => 'M' + f1(x) + ' ' + f1(y + 6.8 * k) + 'C' + f1(x - 10 * k) + ' ' + f1(y - 0.2 * k) + ' ' + f1(x - 5.6 * k) + ' ' + f1(y - 8.6 * k) + ' ' + f1(x) + ' ' + f1(y - 3 * k) + 'C' + f1(x + 5.6 * k) + ' ' + f1(y - 8.6 * k) + ' ' + f1(x + 10 * k) + ' ' + f1(y - 0.2 * k) + ' ' + f1(x) + ' ' + f1(y + 6.8 * k) + 'Z';
  const spark = (x, y, r, c) => '<path d="M' + x + ' ' + (y - r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z" fill="' + c + '"/>';
  /* a shirt of the collection: its first colour is the shirt itself; what its model draws on it is cut to the shirt's outline */
  let shirtArt = '', sleeve2 = null, cuffC = null, collarC = null;
  if (W.shirt && W.shirt.m !== 'plain') {
    const c = W.shirt.c, sm = W.shirt.m, band = (y, h, col, op) => '<rect x="40" y="' + y + '" width="120" height="' + h + '" fill="' + col + '"' + (op ? ' opacity="' + op + '"' : '') + '/>';
    let art = '';
    if (sm === 'stripes') art = [0, 1, 2, 3, 4, 5].map((k) => band(96 + k * 11, 5, c[1])).join('');
    else if (sm === 'chest') art = band(108, 10, c[1]) + band(120.6, 2.6, c[2]);
    else if (sm === 'ringer') { cuffC = c[1]; collarC = c[1]; }
    else if (sm === 'polo') { collarC = c[1]; art = P('M90.6 89.4L100 99.4L95.4 105.4L86.4 93.4Z', c[1]) + P('M109.4 89.4L100 99.4L104.6 105.4L113.6 93.4Z', c[1]) + '<path d="M100 100v14" stroke="' + tone(c[0], -0.2) + '" stroke-width="1.4"/>' + dot(100, 105, 1.2, c[1]) + dot(100, 110.6, 1.2, c[1]); }
    else if (sm === 'jersey') { collarC = c[1]; art = band(84, 14, c[1]) + band(151, 6, c[1]) + '<text x="100" y="136" text-anchor="middle" font-family="Rubik,Arial,sans-serif" font-weight="800" font-size="25" fill="' + c[2] + '">' + (W.shirt.n | 0) + '</text>'; }
    else if (sm === 'logo') {
      const e = W.shirt.n, k = c[1];
      art = e === 'bolt' ? P('M103.4 107L91.4 124.4h7.4l-3.2 12.6 13-17.6h-7.4z', k) : e === 'star' ? P(starP(100, 121, 11, 4.6), k) : e === 'heart' ? P(heartP(100, 121.4, 1.1), k)
        : e === 'flame' ? P('M100 107C106.4 113.4 109.6 118.6 109.6 124.6C109.6 130.6 105.4 134.8 100 134.8C94.6 134.8 90.4 130.6 90.4 124.6C90.4 120.8 92 118 94.6 115.4C95 118.6 96.4 120.4 98.2 121.2C97.4 116 98.2 111.2 100 107Z', k) + P('M100 123C102.4 125.4 103.6 127.2 103.6 129.2C103.6 131.4 102 133 100 133C98 133 96.4 131.4 96.4 129.2C96.4 127.2 97.6 125.4 100 123Z', '#FFE08A')
        : e === 'dumb' ? '<g fill="' + k + '"><rect x="90" y="119.2" width="20" height="3.6" rx="1.2"/><rect x="85.6" y="113.6" width="5.4" height="14.8" rx="2"/><rect x="109" y="113.6" width="5.4" height="14.8" rx="2"/><rect x="82.4" y="116.4" width="3" height="9.2" rx="1.3"/><rect x="114.600" y="116.4" width="3" height="9.2" rx="1.3"/></g>'
        : e === 'skull' ? P('M100 108.6C93.4 108.6 89 113.2 89 119.2C89 122.8 90.6 125.4 93 127V131.6H107V127C109.400 125.4 111 122.8 111 119.2C111 113.2 106.600 108.600 100 108.600Z', k) + dot(95.6, 119.6, 2.5, c[0]) + dot(104.4, 119.6, 2.5, c[0]) + '<path d="M97 128v3.400M100 128v3.400M103 128v3.400" stroke="' + c[0] + '" stroke-width="1.1"/>'
        : e === 'crown' ? P('M88.6 130L86.4 113L93.4 118.8L100 109.6L106.600 118.800L113.600 113L111.400 130Z', k) + dot(100, 124.4, 1.8, c[0])
        : '<circle cx="100" cy="121" r="11" fill="' + k + '"/>' + dot(96, 118, 1.6, c[0]) + dot(104, 118, 1.6, c[0]) + '<path d="M94.4 123.4Q100 129 105.600 123.400" stroke="' + c[0] + '" stroke-width="1.9" fill="none" stroke-linecap="round"/>';
    }
    else if (sm === 'half') { sleeve2 = c[1]; art = '<rect x="100" y="80" width="70" height="90" fill="' + c[1] + '"/>'; }
    else if (sm === 'sash') art = P('M52 100L66 86L150 152L138 166Z', c[1]) + '<path d="M56 96L144 164" stroke="' + tone(c[1], -0.2) + '" stroke-width="1.2" opacity=".5"/>';
    else if (sm === 'camo') art = [[78, 104, 11, 6], [106, 99, 13, 5.4], [126, 112, 9, 7], [88, 122, 12, 7], [113, 130, 11, 6], [76, 141, 9, 6], [98, 147, 12, 5], [124, 146, 9, 6], [64, 118, 7, 5], [134, 128, 7, 5]].map((q, i) => '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="' + q[2] + '" ry="' + q[3] + '" fill="' + c[1 + (i % 2)] + '"/>').join('');
    else if (sm === 'tiedye') art = [54, 44, 34, 24, 14, 6].map((r, i) => '<circle cx="100" cy="124" r="' + r + '" fill="' + c[(i + 1) % 4] + '"/>').join('');
    else if (sm === 'tux') art = P('M90 88Q100 99 110 88L105 157H95Z', c[1]) + P('M90 88L99 118L84 104Z', tone(c[0], 0.14)) + P('M110 88L101 118L116 104Z', tone(c[0], 0.14)) + P('M100 97L92 92.6V101.4ZM100 97L108 92.600V101.400Z', c[2]) + dot(100, 112, 1.4, c[0]) + dot(100, 124, 1.4, c[0]) + dot(100, 136, 1.4, c[0]);
    else if (sm === 'galaxy') art = '<ellipse cx="82" cy="110" rx="24" ry="13" fill="' + c[1] + '" opacity=".55"/><ellipse cx="118" cy="136" rx="26" ry="14" fill="' + c[2] + '" opacity=".5"/><ellipse cx="104" cy="120" rx="12" ry="7" fill="#F27BA5" opacity=".35"/>' +
      [[70, 100, 1], [92, 96, 0.8], [110, 104, 1.2], [126, 118, 0.9], [78, 128, 0.8], [96, 140, 1.1], [118, 150, 0.8], [86, 150, 0.9], [130, 102, 0.8], [66, 140, 0.7]].map((q) => dot(q[0], q[1], q[2], '#fff')).join('') + spark(104, 122, 4.4, '#fff') + spark(76, 114, 2.6, '#fff');
    else if (sm === 'hero') art = band(143, 6, c[1]) + P('M100 104L115 114.4L100 138L85 114.400Z', c[1], ' stroke="' + c[2] + '" stroke-width="2" stroke-linejoin="round"') + P('M102.6 109.6L94.6 122.4h4.6l-2 9 8.200-12.400h-4.600z', c[2]);
    else if (sm === 'gold') art = P('M48 152L90 82H102L60 152Z', '#fff', ' opacity=".34"') + P('M86 162L128 92H134L92 162Z', '#fff', ' opacity=".22"') + band(150, 7, c[2], 0.35) + spark(118, 108, 4.6, c[1]) + spark(84, 136, 3.4, c[1]) + spark(108, 142, 2.6, '#fff');
    if (art) { const cid = 'avc' + (AV_N = (AV_N + 1) % 1000000); shirtArt = '<clipPath id="' + cid + '"><path d="' + (tank ? tankTop : torso) + '"/></clipPath><g clip-path="url(#' + cid + ')">' + art + '</g>'; }
  }
  /* what the left hand holds; the hand is drawn over it and closes on it */
  const holdArt = (sx) => {
    const h = W.hold, c = h.c, x = (v) => f1(sx + v);
    if (h.m === 'shaker') return '<rect x="' + x(-6.5) + '" y="170" width="13" height="25" rx="3.6" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="1.2"/><rect x="' + x(-6.5) + '" y="180" width="13" height="7" fill="' + c[2] + '"/><rect x="' + x(-5.4) + '" y="165.6" width="10.8" height="5.4" rx="1.6" fill="' + c[3] + '"/>';
    if (h.m === 'bottle') return '<rect x="' + x(-5.6) + '" y="169" width="11.2" height="27" rx="4.4" fill="' + c[0] + '"/><rect x="' + x(-5.6) + '" y="180" width="11.2" height="8" fill="' + c[2] + '" opacity=".85"/><rect x="' + x(-3.4) + '" y="163.4" width="6.8" height="6.6" rx="1.6" fill="' + c[1] + '"/>';
    if (h.m === 'banana') return P('M' + x(-8.6) + ' 165C' + x(-8) + ' 180 ' + x(0) + ' 190.4 ' + x(11.4) + ' 189.6C' + x(3.4) + ' 185 ' + x(-2.6) + ' 177 ' + x(-4.4) + ' 164.4Z', c[0], ' stroke="' + tone(c[0], -0.22) + '" stroke-width="1" stroke-linejoin="round"') + '<path d="M' + x(-8.4) + ' 165.2L' + x(-4.6) + ' 164.6" stroke="' + c[1] + '" stroke-width="2.6" stroke-linecap="round"/>' + dot(x(10.8), 189.4, 1.3, c[1]);
    if (h.m === 'dumb') return '<rect x="' + x(-12) + '" y="173.2" width="24" height="3.8" rx="1.6" fill="' + c[1] + '"/>' + [-1, 1].map((k) => '<rect x="' + x(k * 13.6 - 3.2) + '" y="166.6" width="6.4" height="17" rx="2.4" fill="' + c[0] + '"/><rect x="' + x(k * 18.2 - 1.6) + '" y="169" width="3.2" height="12.2" rx="1.4" fill="' + c[0] + '"/>').join('');
    if (h.m === 'trophy') return '<path d="M' + x(-9) + ' 152.6H' + x(9) + 'V159C' + x(9) + ' 165.6 ' + x(5) + ' 169.6 ' + x(0) + ' 169.6C' + x(-5) + ' 169.6 ' + x(-9) + ' 165.6 ' + x(-9) + ' 159Z" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<path d="M' + x(-9) + ' 155.4Q' + x(-14.6) + ' 156 ' + x(-13.6) + ' 160.6Q' + x(-12.6) + ' 164 ' + x(-8) + ' 164.2M' + x(9) + ' 155.4Q' + x(14.6) + ' 156 ' + x(13.6) + ' 160.6Q' + x(12.6) + ' 164 ' + x(8) + ' 164.2" stroke="' + c[1] + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<rect x="' + x(-1.8) + '" y="169" width="3.6" height="12" fill="' + c[1] + '"/><rect x="' + x(-6.6) + '" y="181" width="13.2" height="4.4" rx="1.6" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="1"/><path d="M' + x(-4.8) + ' 155.6V161.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>';
    return '';
  };
  const arm = (d) => {
    const sx = X(d * sw), bi = X(d * (sw + ua * 0.34));
    return '<g class="av-arm ' + (d < 0 ? 'l' : 'r') + '" style="transform-origin:' + sx + 'px 104px">' + ln(sx, 104, sx, 139, ua, skin) +
      '<ellipse class="av-bi" style="transform-origin:' + sx + 'px 122px" cx="' + bi + '" cy="122" rx="' + (ua * 0.44).toFixed(1) + '" ry="' + L(9, 12.5) + '" fill="' + skin + '"/>' +
      (tank ? dot(sx, 104, +(ua / 2 + 1.5).toFixed(1), skin) : ln(sx, 104, sx, 118, ua + 4, d > 0 && sleeve2 ? sleeve2 : shirt) + (cuffC ? '<rect x="' + f1(sx - ua / 2 - 2) + '" y="114" width="' + f1(ua + 4) + '" height="3.4" fill="' + cuffC + '"/>' : '')) +
      '<g class="av-fore" style="transform-origin:' + sx + 'px 139px">' + ln(sx, 139, sx, 169, fa, skin) + (has('wraps') ? ln(sx, 161, sx, 168, fa + 1.8, '#ECEEF2') + ln(sx, 164.5, sx, 164.6, fa + 1.8, '#C9CED8') : '') +
      (wr && wr.m === 'sweat' ? ln(sx, 161.6, sx, 167.6, fa + 2.6, wr.c[0]) + '<rect x="' + (sx - (fa + 2.6) / 2).toFixed(1) + '" y="163.8" width="' + (fa + 2.6).toFixed(1) + '" height="1.7" fill="' + wr.c[1] + '"/>' : '') +
      (d > 0 && wr && wr.m === 'watch' ? ln(sx, 153.6, sx, 156.4, fa + 1.6, wr.c[0]) + '<rect x="' + (sx - 3.8).toFixed(1) + '" y="151.2" width="7.6" height="7.6" rx="2.2" fill="' + wr.c[1] + '" stroke="' + wr.c[2] + '" stroke-width="1.6"/>' + dot(sx, 155, 1, wr.c[2]) : '') +
      (d < 0 && W.hold ? holdArt(sx) : '') +
      (glove ? (W.hands.m === 'boxing' ? dot(sx, 176.6, L(8.8, 10.4), glove[0]) + dot(f1(sx - d * L(6.6, 7.8)), 173.4, 3.7, glove[0]) + '<rect x="' + f1(sx - fa / 2 - 1.6) + '" y="164.6" width="' + f1(fa + 3.2) + '" height="4.8" rx="1.8" fill="' + glove[1] + '"/><path d="M' + f1(sx - 3.8) + ' 172.6Q' + sx + ' 169.8 ' + f1(sx + 3.8) + ' 172.6" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".45"/>'
        : dot(sx, 175, L(6.9, 8.5), glove[0]) + ln(sx, 169.4, sx, 170.6, fa + 1.4, glove[1])) : dot(sx, 175, L(6.6, 8.2), skin)) + '</g></g>';
  };

  /* head: back hair first, so long hair falls behind the shoulders */
  const hair = look.hair | 0, hasHair = hair > 0, browC = hasHair ? tone(hc, -0.15) : '#4A3A30';
  const backHair = hair === 9 ? P('M114 33C133 36 140 62 133.5 88C131.5 96 124.5 97.5 122.4 91C127 74 125 54 112.5 40Z', hc) + '<path d="M120 46Q129 62 126 84" stroke="' + tone(hc, 0.2) + '" stroke-width="1.4" fill="none" opacity=".6"/>'
    : hair === 12 ? P('M71.4 54C67.6 30 83.6 18 100 18C116.4 18 132.4 30 128.6 54L130.4 79C125.6 86 118.6 85 116.6 78L116.6 62L83.4 62L83.4 78C81.4 85 74.4 86 69.6 79Z', hc)
    : hair === 13 ? '<ellipse cx="100" cy="42" rx="36.5" ry="31.5" fill="' + hc + '"/>' + [[67, 38, 8], [72, 22, 8.5], [85, 12, 9], [100, 9, 9], [115, 12, 9], [128, 22, 8.5], [133, 38, 8], [131, 53, 7], [69, 53, 7]].map((c) => dot(c[0], c[1], c[2], hc)).join('')
    : hair === 4 ? P('M72 52C67 30 83 18 100 18C117 18 133 30 128 52L131 93C124 100 116 98 114 91L114 70L86 70L86 91C84 98 76 100 69 93Z', hc) : '';
  const cap = 'M74 54C70.5 33 84 20 100 20C116 20 129.5 33 126 54C124 46 119.5 40 112 38.5C104 37 96 37 88 38.5C80.5 40 76 46 74 54Z';
  let topHair = '';
  const tie = (x, y) => '<ellipse cx="' + x + '" cy="' + y + '" rx="3.2" ry="2.4" fill="#D7263D"/>';
  if (hair === 1 || hair === 4 || hair === 9) topHair = P(cap, hc) + (hair === 9 ? '<path d="M84 25Q100 18 118 27" stroke="' + tone(hc, 0.22) + '" stroke-width="1.5" stroke-linecap="round" fill="none"/>' + tie(119.5, 35.5) : '');
  else if (hair === 10) topHair = dot(100, 15.5, 10.5, hc) + '<path d="M93 12Q100 7.5 107 12" stroke="' + tone(hc, 0.24) + '" stroke-width="1.5" stroke-linecap="round" fill="none"/>' + '<rect x="93" y="22" width="14" height="4" rx="2" fill="#D7263D"/>' + P(cap, hc);
  else if (hair === 11) topHair = P(cap, hc) + '<path d="M100 21.5V35" stroke="' + tone(hc, -0.25) + '" stroke-width="1.3" stroke-linecap="round"/>' +
    [-1, 1].map((d) => [0, 1, 2, 3, 4, 5].map((k) => '<ellipse cx="' + X(d * (26.4 - k * 0.5)) + '" cy="' + (60 + k * 9) + '" rx="' + (5.6 - k * 0.25).toFixed(2) + '" ry="5.6" fill="' + (k % 2 ? tone(hc, 0.08) : hc) + '"/>').join('') + tie(X(d * 23.6), 113)).join('');
  else if (hair === 12) topHair = P(cap, hc) + P('M75 47C78 32 92 25 108 27C96 30 88 37 84 47Z', tone(hc, 0.06));
  else if (hair === 13) topHair = P(cap, hc) + [[80, 40, 4.6], [88, 35.5, 4.6], [96, 34, 4.6], [104, 34, 4.6], [112, 35.5, 4.6], [120, 40, 4.6]].map((c) => dot(c[0], c[1], c[2], hc)).join('');
  else if (hair === 14) topHair = P('M75.4 50.5C74.8 33 87 24.4 100 24.4C113 24.4 125.2 33 124.6 50.5C122.4 43.4 116.4 39.6 108.4 38.7C102.6 38 97.4 38 91.6 38.7C83.6 39.6 77.6 43.4 75.4 50.5Z', hc, ' opacity=".42"') +
    P('M92.6 39C91.4 24 94.6 11 100 4.5C105.4 11 108.6 24 107.4 39Q100 37 92.6 39Z', hc) + '<path d="M100 9V36" stroke="' + tone(hc, 0.2) + '" stroke-width="1.4" fill="none" opacity=".7"/>';
  else if (hair === 15) topHair = P(cap, hc) + [-1, 1].map((d) => P('M' + X(d * 22) + ' 37C' + X(d * 38) + ' 39 ' + X(d * 43) + ' 62 ' + X(d * 36) + ' 82C' + X(d * 31.5) + ' 70 ' + X(d * 29.5) + ' 54 ' + X(d * 21) + ' 45Z', hc) + tie(X(d * 26), 39.5)).join('');
  else if (hair === 2) topHair = P(cap, hc) + P('M80 31C83 15 110 9 124 25C116 22.5 108 25 100 29.5C93 33.5 86 34.5 80 31Z', hc) + '<path d="M90 24Q101 17 114 21" stroke="' + tone(hc, 0.22) + '" stroke-width="1.6" stroke-linecap="round" fill="none"/>';
  else if (hair === 3) topHair = P(cap, hc) + [[78, 41, 8], [84, 31, 8.5], [93, 25, 8.5], [103, 23, 8.5], [113, 26, 8.5], [121, 33, 8], [124.5, 43, 7], [76, 50, 5.5]].map((c) => dot(c[0], c[1], c[2], hc)).join('');
  else if (hair === 6) topHair = P('M75.4 50.5C74.8 33 87 24.4 100 24.4C113 24.4 125.2 33 124.6 50.5C122.4 43.4 116.4 39.6 108.4 38.7C102.6 38 97.4 38 91.6 38.7C83.6 39.6 77.6 43.4 75.4 50.5Z', hc, ' opacity=".82"');
  else if (hair === 7) topHair = P(cap, hc) + P('M77 41C79 26 95 17.5 112 20.5C121.5 22.4 128 30.5 127.6 41.5C122.6 33.2 113.4 29.4 103 30.4C93.6 31.3 84.6 35 77 41Z', hc) +
    '<path d="M93.5 22.5Q90.2 29.8 88.6 38" stroke="' + tone(hc, 0.26) + '" stroke-width="1.5" stroke-linecap="round" fill="none"/>';
  else if (hair === 8) topHair = P('M71.8 60.5C66.8 33 82 18.4 100 18.4C118 18.4 133.2 33 128.2 60.5C126.4 55 125.2 50.6 123.2 46.4C117.4 40.6 109.2 38.4 100 38.4C90.8 38.4 82.6 40.6 76.8 46.4C74.8 50.6 73.6 55 71.8 60.5Z', hc) +
    '<path d="M86 24.5Q95 21 104 24.2M108 23.6Q116 25.4 121 31" stroke="' + tone(hc, 0.22) + '" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".8"/>';
  /* the fringe: full on top, falling straight over the forehead in loose strands that reach the brows */
  else if (hair === 5) topHair = P('M73.6 54C70 39 74.5 24 86 18.5Q91 13.8 97 16.6Q102.5 12.6 109.5 16.2C121.5 19.5 130.2 38 126.4 54C125.2 50 124 46.8 121.8 45Q119.6 47.8 116.2 47.4Q115.4 45 114.2 43.2Q111.8 47.6 107.6 48.2Q106.6 45.4 105.6 43.4Q103 48 98.6 48.6Q97.4 45.8 96.4 43.6Q94.2 47.4 89.8 47.8Q88.6 45.2 87.6 43Q85.6 46.2 81.6 46.4Q80.4 44.6 79.6 43.2Q77.4 46 75.6 50Q74.4 52 73.6 54Z', hc) +
    '<path d="M112.6 25.5Q116.4 34 115.6 44M102.6 20.5Q106.2 31 106.6 44.2M93.4 21Q95.2 32 97.4 44.4M85 26.5Q86.2 35 88.6 43.8" stroke="' + tone(hc, 0.24) + '" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".75"/>';
  const beardD = 'M75.5 55C75.5 72 86 85.5 100 85.5C114 85.5 124.5 72 124.5 55C121.5 62 117 64.5 112 64.5C108 61 92 61 88 64.5C83 64.5 78.5 62 75.5 55Z';
  const beard = fem ? '' : look.beard === 2 ? P(beardD, hasHair ? hc : '#4A3A30') + '<ellipse cx="100" cy="69.3" rx="7.4" ry="3.9" fill="' + skin + '"/>' : look.beard === 1 ? P(beardD, hasHair ? hc : '#4A3A30', ' opacity=".26"') : '';
  /* gear is won in the game, so it is gold */
  const bandC = '#F2B93B';
  const hw = W.head, hatOn = !!hw, dome = 'M73.2 47C71.4 28.5 84.6 17 100 17C115.4 17 128.6 28.5 126.8 47Q100 39.5 73.2 47Z', brim = 'M69.6 47.4Q100 36.6 130.4 47.4Q132 50.8 128.6 52Q100 43.4 71.4 52Q68 50.8 69.6 47.4Z';
  const band = has('band') && !hatOn ? P('M74.6 44.5C83 38.5 117 38.5 125.4 44.5L125.6 38.5C117 32 83 32 74.4 38.5Z', bandC) + P('M125 39.5L134 35.5L131 42.5ZM125 42L134.5 46L128.5 48.5Z', tone(bandC, -0.12)) : '';
  const crown = has('crown') && !hatOn ? '<g>' + P('M82 19L79.5 3.5L91 11L100 0.5L109 11L120.5 3.5L118 19Z', '#F2B93B', ' stroke="#C98F1C" stroke-width="1.5" stroke-linejoin="round"') + dot(100, 13, 2.2, '#6D3FE0') + '</g>' : '';
  const hatArt = (it) => {
    const c = it.c, m = it.m;
    if (m === 'cap') return P(dome, c[0]) + P(brim, c[1]) + dot(100, 17.6, 2.1, c[1]) + '<path d="M100 19.5V38" stroke="' + c[1] + '" stroke-width="1.2" opacity=".55"/>';
    if (m === 'snap') return P(dome, c[0]) + P('M85 43.6C83.6 29 90.4 20 100 20C109.6 20 116.4 29 115 43.6Q100 40.4 85 43.6Z', c[2]) + '<rect x="66.5" y="43.2" width="67" height="7.8" rx="3.7" fill="' + c[1] + '"/>' + dot(100, 17.8, 2.1, c[1]);
    if (m === 'beanie') return P('M73 45C71.6 26.5 85 15.5 100 15.5C115 15.5 128.4 26.5 127 45Z', c[0]) + '<path d="M86 22.5Q84 33 84.6 42M100 16.5V42M114 22.5Q116 33 115.4 42" stroke="' + tone(c[0], 0.14) + '" stroke-width="2" fill="none"/>' +
      P('M71.4 40.6Q100 34 128.6 40.6L129.2 50Q100 43.2 70.8 50Z', c[1]) + '<path d="M78 41v6.4M85 39.6v6.6M92 38.8v6.6M100 38.5v6.6M108 38.8v6.6M115 39.6v6.6M122 41v6.4" stroke="' + tone(c[1], 0.16) + '" stroke-width="2.2" stroke-linecap="round"/>' + (c[2] ? dot(100, 13.6, 5.6, c[2]) : '');
    if (m === 'bucket') return P('M77.5 43C76.5 27 87 19.5 100 19.5C113 19.5 123.5 27 122.5 43Z', c[0]) + P('M63.5 52.5Q67 41 77.5 41.6Q100 36.4 122.5 41.6Q133 41 136.5 52.5Q100 44 63.5 52.5Z', c[1]) + '<path d="M79.5 36.6Q100 32 120.5 36.6" stroke="' + tone(c[0], -0.22) + '" stroke-width="1.2" fill="none" opacity=".6"/>';
    if (m === 'visor') return P('M74 45.5Q100 37.5 126 45.5L126.4 39.5Q100 31.5 73.6 39.5Z', c[0]) + P(brim, c[1]);
    if (m === 'band') return P('M74.6 44.5C83 38.5 117 38.5 125.4 44.5L125.6 37.5C117 31 83 31 74.4 37.5Z', c[0]) + '<path d="M74.8 41Q100 34.6 125.2 41" stroke="' + c[1] + '" stroke-width="1.6" fill="none"/>';
    if (m === 'bandana') return P('M74.2 45.5C83 39 117 39 125.8 45.5L126 32.5C117 25.5 83 25.5 74 32.5Z', c[0]) + P('M125 35L136.5 30L133 39.5ZM125 40L137.5 45.5L129.5 48Z', tone(c[0], -0.14)) + [[83, 37.4], [91.5, 34.8], [100, 33.9], [108.5, 34.8], [117, 37.4]].map((q) => dot(q[0], q[1], 1.4, c[1])).join('');
    if (m === 'ears') return '<path d="M76 41Q100 22 124 41" stroke="' + c[0] + '" stroke-width="3" fill="none" stroke-linecap="round"/>' + [-1, 1].map((d) => P('M' + X(d * 20.5) + ' 31L' + X(d * 18.5) + ' 11.5L' + X(d * 5.5) + ' 24Z', c[0], ' stroke="' + c[0] + '" stroke-width="2" stroke-linejoin="round"') + P('M' + X(d * 16.6) + ' 26.6L' + X(d * 15.6) + ' 17L' + X(d * 9.4) + ' 23Z', c[1])).join('');
    if (m === 'propeller') return P(dome, c[0]) + P('M100 17C93 17 87.6 28 86.6 43Q100 40.6 113.4 43C112.4 28 107 17 100 17Z', c[1]) + P(brim, c[2]) + '<path d="M100 17V9.6" stroke="#4A4857" stroke-width="2"/><rect x="85" y="6.6" width="30" height="4" rx="2" fill="' + c[2] + '"/>' + dot(100, 8.6, 2.6, c[0]);
    if (m === 'cowboy') return P('M57 39Q72 49.5 100 45.5Q128 49.5 143 39Q136 54.5 100 51Q64 54.5 57 39Z', tone(c[0], -0.14)) + P('M80.5 45C78.5 27 84 14.5 92 14.5Q100 20.5 108 14.5C116 14.5 121.5 27 119.5 45Q100 40.5 80.5 45Z', c[0]) + '<path d="M80.8 40.6Q100 36 119.2 40.6" stroke="' + c[1] + '" stroke-width="3.4" fill="none"/>';
    if (m === 'party') return P('M85.5 31L100 -3L114.5 31Q100 27 85.5 31Z', c[0]) + '<path d="M96.4 6H103.6M92.4 15.4H107.6M88.6 24.4H111.4" stroke="' + c[1] + '" stroke-width="3"/>' + dot(100, -2.6, 3.4, c[2]);
    if (m === 'top') return '<rect x="82" y="-2" width="36" height="32" rx="3" fill="' + c[0] + '"/><rect x="82" y="20.5" width="36" height="6.5" fill="' + c[1] + '"/><ellipse cx="100" cy="30.5" rx="30" ry="5" fill="' + c[0] + '"/><path d="M87 3V17" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".22"/>';
    if (m === 'wreath') return [[76.5, 45, -72], [76.2, 38, -60], [78, 31, -46], [82, 25, -32], [87.5, 20.5, -18], [94, 18, -6]].map((q, k) => [-1, 1].map((d) => { const x = d < 0 ? q[0] : 200 - q[0]; return '<ellipse cx="' + x + '" cy="' + q[1] + '" rx="5.2" ry="2.5" transform="rotate(' + (d < 0 ? q[2] : -q[2]) + ' ' + x + ' ' + q[1] + ')" fill="' + c[k % 2] + '"/>'; }).join('')).join('');
    if (m === 'horns') return [-1, 1].map((d) => P('M' + X(d * 16.5) + ' 28C' + X(d * 21.5) + ' 21 ' + X(d * 21.5) + ' 12 ' + X(d * 17) + ' 5C' + X(d * 15) + ' 13 ' + X(d * 11) + ' 18.5 ' + X(d * 5.5) + ' 21.5Z', c[0], ' stroke="' + c[1] + '" stroke-width="1.2" stroke-linejoin="round"')).join('');
    if (m === 'viking') return [-1, 1].map((d) => P('M' + X(d * 38.5) + ' 7C' + X(d * 44) + ' 18 ' + X(d * 40) + ' 31 ' + X(d * 26) + ' 36L' + X(d * 20.5) + ' 26.5C' + X(d * 29.5) + ' 24 ' + X(d * 35) + ' 16.5 ' + X(d * 38.5) + ' 7Z', c[1], ' stroke="' + tone(c[1], -0.25) + '" stroke-width="1.1" stroke-linejoin="round"')).join('') +
      P('M74.4 46.5C72.4 28 85 17 100 17C115 17 127.6 28 125.6 46.5Q100 40 74.4 46.5Z', c[0]) + '<path d="M74.2 45.4Q100 38.6 125.8 45.4M100 17.5V40" stroke="' + tone(c[0], -0.3) + '" stroke-width="4" fill="none"/>' + dot(86, 41.4, 1.3, tone(c[0], 0.4)) + dot(114, 41.4, 1.3, tone(c[0], 0.4));
    if (m === 'halo') return '<ellipse class="av-pulse" cx="100" cy="8" rx="27" ry="9" fill="' + c[1] + '" opacity=".3"/><ellipse cx="100" cy="8" rx="21" ry="5.4" fill="none" stroke="' + c[0] + '" stroke-width="4.2"/><ellipse cx="100" cy="7.4" rx="21" ry="5.4" fill="none" stroke="' + c[1] + '" stroke-width="1.3" opacity=".9"/>';
    return '';
  };
  const hat = hw ? hatArt(hw) : '';
  const eyesArt = (it) => {
    const c = it.c, m = it.m, lens = (fn) => fn(90.2) + fn(109.8);
    if (m === 'round') return '<g fill="' + (c[1] || '#fff') + '" fill-opacity="' + (c[1] ? '.42' : '.22') + '" stroke="' + c[0] + '" stroke-width="1.9"><circle cx="90.2" cy="56" r="6.8"/><circle cx="109.8" cy="56" r="6.8"/><path d="M97 55.2Q100 53.4 103 55.2M83.4 54.8L76 53.4M116.6 54.8L124 53.4" fill="none" stroke-linecap="round"/></g>';
    if (m === 'square' || m === 'threeD') return '<g stroke="' + c[0] + '" stroke-width="1.9"><rect x="82.6" y="50.2" width="15" height="11.6" rx="2.8" fill="' + (c[1] || '#fff') + '" fill-opacity="' + (c[1] ? '.8' : '.2') + '"/><rect x="102.4" y="50.2" width="15" height="11.6" rx="2.8" fill="' + (c[2] || '#fff') + '" fill-opacity="' + (c[2] ? '.8' : '.2') + '"/><path d="M97.6 55.2H102.4M82.6 54.6L76 53.4M117.4 54.6L124 53.4" fill="none" stroke-linecap="round"/></g>';
    if (m === 'shades') return '<g><path d="M82 54L75.6 53M118 54L124.4 53" stroke="' + c[0] + '" stroke-width="2" stroke-linecap="round"/><rect x="81.8" y="50" width="16.6" height="11.4" rx="4.8" fill="' + c[1] + '" stroke="' + c[0] + '" stroke-width="1.3"/><rect x="101.6" y="50" width="16.6" height="11.4" rx="4.8" fill="' + c[1] + '" stroke="' + c[0] + '" stroke-width="1.3"/><path d="M98 54.4h4" stroke="' + c[0] + '" stroke-width="2"/><path d="M85.6 52.6l3.4 5.4M105.4 52.6l3.4 5.4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".3"/></g>';
    if (m === 'aviator') return '<g stroke="' + c[0] + '" stroke-width="1.4"><path d="M81.6 51.4Q90 49.4 98.2 51.4Q99 59.6 93.4 62.4Q86.6 63.8 82.8 59.2Q81 55.4 81.6 51.4Z" fill="' + c[1] + '"/><path d="M118.4 51.4Q110 49.4 101.8 51.4Q101 59.6 106.6 62.4Q113.4 63.8 117.2 59.2Q119 55.4 118.4 51.4Z" fill="' + c[1] + '"/><path d="M98.2 52H101.8M98 54.8Q100 53.6 102 54.8M81.6 52.6H75.6M118.4 52.6H124.4" fill="none" stroke-linecap="round"/></g><path d="M85 53.4l3 4.600M112 53.400l3 4.600" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".35"/>';
    if (m === 'sport') return '<path d="M79 54L74.4 53M121 54L125.6 53" stroke="' + c[0] + '" stroke-width="2.4" stroke-linecap="round"/><path d="M78.8 52.4Q100 47.4 121.2 52.4Q122.4 59.6 115 61.8Q107.4 62.8 103 58.4Q100 56.4 97 58.4Q92.6 62.8 85 61.8Q77.6 59.6 78.8 52.4Z" fill="' + c[1] + '" stroke="' + c[0] + '" stroke-width="1.5" stroke-linejoin="round"/><path d="M84 53.6Q92 51.6 97 53" stroke="' + c[2] + '" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".8"/>';
    if (m === 'heart') return lens((x) => P(heartP(x, 55.6, 0.92), c[1], ' stroke="' + c[0] + '" stroke-width="1.4" stroke-linejoin="round"')) + '<path d="M97.4 54.6H102.6M81.8 53.6L75.8 53M118.2 53.6L124.2 53" stroke="' + c[0] + '" stroke-width="1.6" stroke-linecap="round"/>';
    if (m === 'star') return lens((x) => P(starP(x, 56, 9, 4.2), c[1], ' stroke="' + c[0] + '" stroke-width="1.3" stroke-linejoin="round"')) + '<path d="M97.6 55.6H102.4M82 54.4L75.8 53.2M118 54.4L124.2 53.2" stroke="' + c[0] + '" stroke-width="1.6" stroke-linecap="round"/>';
    if (m === 'goggles') return '<path d="M73.4 53.4L80 52.6M126.6 53.4L120 52.6" stroke="' + c[0] + '" stroke-width="6.4"/><rect x="79.4" y="47.4" width="41.2" height="17" rx="7.6" fill="' + c[1] + '"/><rect x="82" y="49.8" width="36" height="12.2" rx="5.6" fill="' + c[2] + '"/><path d="M86 52.4Q93 50.6 99 52M103.6 51.6Q108 51 111 51.8" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".55"/>';
    if (m === 'mono') return '<circle cx="109.8" cy="56" r="7.6" fill="#fff" fill-opacity=".25" stroke="' + c[0] + '" stroke-width="2"/><path d="M117 58.6Q124.6 68 121.6 82" stroke="' + c[0] + '" stroke-width="1.1" fill="none" stroke-dasharray="1.6 1.6"/>';
    if (m === 'pixel') return '<g fill="' + c[0] + '"><rect x="76" y="50" width="48" height="3.4"/><rect x="80.4" y="50" width="17.6" height="7.4"/><rect x="83.8" y="57.4" width="10.8" height="3.4"/><rect x="102" y="50" width="17.6" height="7.4"/><rect x="105.4" y="57.4" width="10.8" height="3.4"/></g><g fill="' + c[1] + '"><rect x="83.8" y="52" width="3.4" height="2.6"/><rect x="87.2" y="54.6" width="3.4" height="2.6"/><rect x="105.4" y="52" width="3.4" height="2.6"/><rect x="108.8" y="54.6" width="3.4" height="2.6"/></g>';
    if (m === 'laser') return '<rect x="77.6" y="50.4" width="44.8" height="10.6" rx="5.3" fill="' + c[0] + '"/><ellipse class="av-pulse" cx="100" cy="55.7" rx="25" ry="7" fill="' + c[1] + '" opacity=".3"/><rect x="81.6" y="53.6" width="36.8" height="4.2" rx="2.1" fill="' + c[1] + '"/><rect x="84" y="54.7" width="20" height="1.4" rx=".7" fill="#fff" opacity=".85"/>';
    return '';
  };
  const specs = W.eyes ? eyesArt(W.eyes) : '';
  const earArt = !W.ears ? '' : W.ears.m === 'buds' ? [73.4, 126.6].map((x) => '<ellipse cx="' + x + '" cy="55.2" rx="3.5" ry="3.9" fill="' + W.ears.c[0] + '" stroke="' + W.ears.c[1] + '" stroke-width="1"/><path d="M' + x + ' 58.6v6.6" stroke="' + W.ears.c[0] + '" stroke-width="2.8" stroke-linecap="round"/>').join('')
    : '<path d="M72.6 52C70.4 26.5 85.5 13.6 100 13.6C114.5 13.6 129.6 26.5 127.4 52" stroke="' + W.ears.c[0] + '" stroke-width="4.4" stroke-linecap="round" fill="none"/><rect x="66.6" y="46" width="10.4" height="20" rx="5" fill="' + W.ears.c[1] + '"/><rect x="123" y="46" width="10.4" height="20" rx="5" fill="' + W.ears.c[1] + '"/><rect x="68.6" y="50" width="3.6" height="12" rx="1.8" fill="' + W.ears.c[2] + '"/><rect x="127.8" y="50" width="3.6" height="12" rx="1.8" fill="' + W.ears.c[2] + '"/>';
  /* round the neck: a towel that hangs down both sides of the chest, a chain, a tie, a scarf */
  const neckOf = (it) => {
    const c = it.c, m = it.m;
    if (m === 'towel') return [-1, 1].map((d) => P('M' + X(d * (nw + 3.6)) + ' 87.5L' + X(d * (nw + 7.2)) + ' 127Q' + X(d * (nw + 2)) + ' 129.4 ' + X(d * (nw - 3.4)) + ' 127.4L' + X(d * (nw - 2.6)) + ' 89.5Z', c[0], ' stroke="' + c[1] + '" stroke-width="1" stroke-linejoin="round"') + ln(X(d * (nw + 5.6)), 121, X(d * (nw - 2.6)), 121.4, 1.6, c[2])).join('');
    if (m === 'tag') return '<path d="M' + X(-nw + 1) + ' 90.5Q100 106 ' + X(nw - 1) + ' 90.5" stroke="' + c[0] + '" stroke-width="2.2" stroke-dasharray="0.1 3.1" stroke-linecap="round" fill="none"/><rect x="95.4" y="99.6" width="9.2" height="13.4" rx="3.2" fill="' + c[1] + '" stroke="' + c[2] + '" stroke-width="1.2"/><path d="M97.8 105h4.4M97.8 108h3" stroke="' + c[2] + '" stroke-width="1" stroke-linecap="round"/>';
    if (m === 'chain') return '<path d="M' + X(-nw + 1) + ' 90.5Q100 110 ' + X(nw - 1) + ' 90.5" stroke="' + c[0] + '" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="100" cy="101.4" r="3.3" fill="' + c[1] + '" stroke="' + c[2] + '" stroke-width="1.3"/>';
    if (m === 'chainB') return '<path d="M' + X(-nw) + ' 90Q100 118 ' + X(nw) + ' 90" stroke="' + c[0] + '" stroke-width="4.8" stroke-linecap="round" stroke-dasharray="0.1 5.6" fill="none"/><circle cx="100" cy="108.4" r="6.6" fill="' + c[1] + '" stroke="' + c[2] + '" stroke-width="1.6"/>' + P(starP(100, 108.4, 4.4, 1.9), c[2]);
    if (m === 'whistle') return '<path d="M' + X(-nw + 1) + ' 90.5L100 109L' + X(nw - 1) + ' 90.5" stroke="' + c[0] + '" stroke-width="1.7" stroke-linejoin="round" fill="none"/><rect x="104" y="109.2" width="6" height="3.8" rx="1" fill="' + c[1] + '" stroke="' + c[2] + '" stroke-width="1"/><rect x="93.6" y="107.4" width="13" height="7.6" rx="3.6" fill="' + c[1] + '" stroke="' + c[2] + '" stroke-width="1.1"/>' + dot(97.4, 111.2, 1.5, c[2]);
    if (m === 'bow') return P('M100 93.6L90.4 88.4V98.8ZM100 93.6L109.6 88.4V98.8Z', c[0], ' stroke="' + c[1] + '" stroke-width="1" stroke-linejoin="round"') + '<rect x="97.4" y="90.8" width="5.2" height="5.6" rx="1.6" fill="' + c[1] + '"/>';
    if (m === 'tie') return P('M96.4 91.4H103.6L102 96.6H98ZM98 96.6H102L105.4 125L100 131.4L94.6 125Z', c[0]) + '<path d="M97.4 105.4L102.6 108.4M96.6 113.4L103.4 117M96 121.4L104 125.4" stroke="' + c[1] + '" stroke-width="1.7"/>';
    if (m === 'scarf') return P('M' + X(-nw - 4.5) + ' 83.5Q100 95.5 ' + X(nw + 4.5) + ' 83.5L' + X(nw + 5.5) + ' 93Q100 105 ' + X(-nw - 5.5) + ' 93Z', c[0]) + '<rect x="' + X(nw - 4) + '" y="96" width="11" height="30" rx="2.4" fill="' + c[0] + '"/><path d="M' + X(nw - 4) + ' 104h11M' + X(nw - 4) + ' 112h11" stroke="' + c[1] + '" stroke-width="2.6"/>' +
      '<path d="M' + X(nw - 2.4) + ' 126v4M' + X(nw + 1.5) + ' 126v4M' + X(nw + 5.4) + ' 126v4" stroke="' + c[0] + '" stroke-width="1.8" stroke-linecap="round"/><path d="M' + X(-nw - 3) + ' 89Q100 100.4 ' + X(nw + 3) + ' 89" stroke="' + c[1] + '" stroke-width="2" fill="none"/>';
    if (m === 'lei') return [0.04, 0.14, 0.24, 0.34, 0.45, 0.55, 0.66, 0.76, 0.86, 0.96].map((t, k) => { const ax = X(-nw - 7), bx = X(nw + 7), u = 1 - t, x = f1(u * u * ax + 2 * t * u * 100 + t * t * bx), y = f1(u * u * 91 + 2 * t * u * 136 + t * t * 91); return dot(x, y, 4, c[k % 2]) + dot(x, y, 1.3, c[2]); }).join('');
    return '';
  };
  const neckArt = W.neck ? neckOf(W.neck) : '';
  /* on the back, behind the whole figure */
  const backArt = !W.back ? '' : [-1, 1].map((d) => { const c = W.back.c, q = (v) => X(d * (sw - 5 + v)); return P('M' + q(0) + ' 102C' + q(16) + ' 76 ' + q(42) + ' 66 ' + q(60) + ' 78C' + q(50) + ' 84 ' + q(50) + ' 92 ' + q(56) + ' 102C' + q(46) + ' 104 ' + q(44) + ' 112 ' + q(48) + ' 124C' + q(38) + ' 122 ' + q(34) + ' 130 ' + q(34) + ' 144C' + q(20) + ' 136 ' + q(6) + ' 124 ' + q(0) + ' 102Z', c[0], ' stroke="' + c[1] + '" stroke-width="1.6" stroke-linejoin="round"') +
    '<path d="M' + q(8) + ' 104Q' + q(28) + ' 90 ' + q(50) + ' 82M' + q(10) + ' 112Q' + q(28) + ' 106 ' + q(46) + ' 106M' + q(12) + ' 120Q' + q(24) + ' 122 ' + q(38) + ' 128" stroke="' + c[1] + '" stroke-width="1.3" fill="none" stroke-linecap="round"/>'; }).join('');
  const medal = has('medal') ? '<path d="M' + X(-nw + 1) + ' 91L100 113L' + X(nw - 1) + ' 91" stroke="#6D3FE0" stroke-width="3.4" stroke-linejoin="round" fill="none"/><circle cx="100" cy="117" r="7.4" fill="#F2B93B" stroke="#C98F1C" stroke-width="1.6"/><path d="M100 113.2l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill="#C98F1C"/>' : '';
  /* the lifting belt turns into a title belt: gold, with a plate in the middle */
  const belt = has('champ') ? '<rect x="' + X(-ww - 3.5) + '" y="143" width="' + ((ww + 3.5) * 2).toFixed(1) + '" height="13" rx="4" fill="#F2B93B" stroke="#C98F1C" stroke-width="1.4"/><ellipse cx="100" cy="149.5" rx="11.5" ry="9" fill="#FFD76A" stroke="#C98F1C" stroke-width="1.8"/>' + dot(100, 149.5, 3.2, '#6D3FE0')
    : has('belt') ? '<rect x="' + X(-ww - 3) + '" y="144" width="' + ((ww + 3) * 2).toFixed(1) + '" height="11" rx="3.5" fill="#4A3628"/><rect x="94" y="145.5" width="12" height="8" rx="2" fill="none" stroke="#F2B93B" stroke-width="2.2"/>' : '';
  /* past the crown: a cape that hangs from the shoulders behind the figure, held by two gold clasps */
  const cape = has('cape') ? P('M' + X(-sw + 3) + ' ' + (sy + 2) + 'Q' + X(-sw - 17) + ' 150 ' + X(-sw - 11) + ' 210Q100 224 ' + X(sw + 11) + ' 210Q' + X(sw + 17) + ' 150 ' + X(sw - 3) + ' ' + (sy + 2) + 'Z', '#3B1E96', ' stroke="#F2B93B" stroke-width="2.2" stroke-linejoin="round"') +
    '<path d="M' + X(-sw - 12) + ' 178Q100 194 ' + X(sw + 12) + ' 178" stroke="#2A1470" stroke-width="2" fill="none" opacity=".55"/>' : '';
  const clasp = cape ? dot(X(-nw - 5), 93.5, 2.7, '#F2B93B') + dot(X(nw + 5), 93.5, 2.7, '#F2B93B') : '';
  const fw = W.feet, shoe = fw ? fw.c : has('kicks') ? ['#F2B93B', '#FFF6DC'] : ['#3A4152', '#E7E9ED'], glow = has('glow') ? '<g class="av-glow"><circle cx="100" cy="116" r="97" fill="#F2B93B" opacity=".1"/><circle cx="100" cy="116" r="80" fill="#F2B93B" opacity=".12"/><circle cx="100" cy="116" r="62" fill="#F2B93B" opacity=".14"/></g>' : '';
  const star4 = (x, y, r, d) => '<path class="av-spark" style="animation-delay:' + d + 's" d="M' + x + ' ' + (y - r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z" fill="#FFD76A"/>';
  const stars = has('stars') ? star4(24, 56, 7, 0) + star4(176, 44, 6, 0.5) + star4(13, 138, 5, 1) + star4(187, 128, 7, 1.4) + star4(36, 208, 5, 0.8) + star4(167, 214, 6, 0.3) : '';

  const head = '<ellipse cx="74.6" cy="56" rx="4.2" ry="6.2" fill="' + skin + '"/><ellipse cx="125.4" cy="56" rx="4.2" ry="6.2" fill="' + skin + '"/>' +
    P('M75 51C75 32 87 23.5 100 23.5C113 23.5 125 32 125 51C125 68 114 82 100 82C86 82 75 68 75 51Z', skin) + beard +
    '<g class="av-eyes"><ellipse cx="90.2" cy="56" rx="2.7" ry="3.1" fill="#1B1F27"/><ellipse cx="109.8" cy="56" rx="2.7" ry="3.1" fill="#1B1F27"/><circle cx="91.1" cy="54.9" r=".9" fill="#fff"/><circle cx="110.7" cy="54.9" r=".9" fill="#fff"/></g>' +
    '<path d="M85.4 49.8q4.6-3 9.4-.7M105.2 49.1q4.8-2.3 9.4.7" stroke="' + browC + '" stroke-width="2.1" stroke-linecap="round" fill="none"/>' +
    '<path d="M100 59.5q-2.6 3.4 0 4.6" stroke="' + shd + '" stroke-width="1.7" stroke-linecap="round" fill="none"/>' +
    (fem ? '<path d="M87.4 53.6l-2.8-2M87 55.6l-3 -.6M112.6 53.6l2.8-2M113 55.6l3-.6" stroke="#1B1F27" stroke-width="1.3" stroke-linecap="round"/>' : '') +
    '<path class="av-smile" d="M92.6 68Q100 74 107.4 68" stroke="' + (fem ? '#A8475C' : '#1B1F27') + '" stroke-width="2.2" stroke-linecap="round" fill="none"/>' +
    '<g class="av-grin"><path d="M91.6 66.6Q100 78 108.4 66.6Z" fill="#1B1F27" stroke="#1B1F27" stroke-width="1.6" stroke-linejoin="round"/><path d="M94.4 67.3h11.2q-1 2.6-5.6 2.6t-5.6-2.6z" fill="#fff"/></g>' +
    topHair + band + crown + hat + specs + earArt +
    (look.stud ? '<circle cx="127.6" cy="58.2" r="1.35" fill="#C9CED8" stroke="#7C8492" stroke-width=".6"/><circle cx="126.8" cy="61.3" r="1.15" fill="#C9CED8" stroke="#7C8492" stroke-width=".6"/>' : '');

  const body = '<g class="av-bod">' + (tank ? P(torso, skin) + P(tankTop, shirt) : P(torso, shirt)) + shirtArt + pecs + belt +
    '<rect x="' + X(-nw) + '" y="74" width="' + (nw * 2).toFixed(1) + '" height="20" rx="5" fill="' + skin + '"/><ellipse cx="100" cy="83.5" rx="' + nw + '" ry="4.2" fill="' + shd + '"/>' +
    (tank ? '' : '<path d="M' + X(-nw - 2.5) + ' 89.5Q100 99.5 ' + X(nw + 2.5) + ' 89.5" stroke="' + (collarC || shirt2) + '" stroke-width="2.6" stroke-linecap="round" fill="none"/>') + clasp + medal + neckArt + head + arm(-1) + arm(1) + '</g>';
  /* a bust is cut round under the hair: with the crown on, the frame takes in its points */
  if (o.bust) return '<svg class="av bust' + (o.flex ? ' flex' : '') + (o.grin ? ' grin' : '') + '" viewBox="' + (hw && HAT_TOP[hw.m] === 2 ? '49 -7 102 102' : crown || (hw && HAT_TOP[hw.m]) ? '51 -1 98 98' : '58 14 84 84') + '" aria-hidden="true">' + backHair + body + '</svg>';

  /* a shoe: the sneaker of every day, or the one of the collection by its model */
  const shoeArt = (d) => {
    const x0 = d < 0 ? X(-12.5 - lg / 2 - 6) : X(12.5 - lg / 2 - 1), w = +(lg + 7).toFixed(1), xc = f1(x0 + w / 2), lx = X(d * 12.5), sm = fw ? fw.m : 'kicks', c = shoe;
    const base = '<rect x="' + x0 + '" y="232.5" width="' + w + '" height="13.5" rx="6.5" fill="' + c[0] + '"/><rect x="' + x0 + '" y="242.6" width="' + w + '" height="3.4" rx="1.7" fill="' + c[1] + '"/>';
    const ankle = (y, col) => '<rect x="' + f1(lx - lg / 2 - 1.2) + '" y="' + y + '" width="' + f1(lg + 2.4) + '" height="' + (237 - y) + '" rx="3.4" fill="' + col + '"/>';
    if (sm === 'runner') return base + '<path d="M' + f1(xc - 3 * d) + ' 241.4L' + f1(xc + 1.6 * d) + ' 234.8M' + f1(xc + 1.6 * d) + ' 241.4L' + f1(xc + 6.2 * d) + ' 234.8" stroke="' + c[2] + '" stroke-width="2.1" stroke-linecap="round"/>';
    if (sm === 'high') return ankle(222, c[0]) + base + '<rect x="' + f1(d < 0 ? x0 : x0 + w - 8.4) + '" y="234.4" width="8.4" height="8.2" rx="4.1" fill="' + c[2] + '"/><path d="M' + f1(lx - 3.4) + ' 226H' + f1(lx + 3.4) + 'M' + f1(lx - 3.4) + ' 230.2H' + f1(lx + 3.4) + '" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".75"/>';
    if (sm === 'boot') return ankle(216, c[0]) + base + '<rect x="' + x0 + '" y="241.4" width="' + w + '" height="4.8" rx="1.8" fill="' + c[1] + '"/><path d="M' + f1(lx - 3.6) + ' 220.6H' + f1(lx + 3.6) + 'M' + f1(lx - 3.6) + ' 225H' + f1(lx + 3.6) + 'M' + f1(lx - 3.6) + ' 229.4H' + f1(lx + 3.6) + '" stroke="' + c[2] + '" stroke-width="1.4" stroke-linecap="round"/>';
    if (sm === 'slide') return ankle(223, c[2]) + '<rect x="' + x0 + '" y="232.5" width="' + w + '" height="13.5" rx="6.5" fill="' + c[2] + '"/><rect x="' + x0 + '" y="242.2" width="' + w + '" height="3.8" rx="1.7" fill="' + c[1] + '"/><rect x="' + f1(xc - w * 0.3) + '" y="233" width="' + f1(w * 0.6) + '" height="8.6" rx="2.8" fill="' + c[0] + '"/>';
    if (sm === 'neon') return '<ellipse class="av-pulse" cx="' + xc + '" cy="246.2" rx="' + f1(w / 2 + 3.5) + '" ry="3.6" fill="' + c[1] + '" opacity=".55"/>' + base + '<path d="M' + f1(xc - 4) + ' 238.4H' + f1(xc + 4) + '" stroke="' + c[1] + '" stroke-width="1.6" stroke-linecap="round"/>';
    if (sm === 'chrome') return base + '<path d="M' + f1(x0 + 4.4) + ' 236.2H' + f1(x0 + w - 7.6) + '" stroke="#fff" stroke-width="1.9" stroke-linecap="round" opacity=".85"/><path d="M' + f1(x0 + 6) + ' 239.6H' + f1(x0 + w - 11) + '" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".5"/>';
    if (sm === 'wing') return base + [0, 1, 2].map((k) => { const cx = f1(lx + d * (lg / 2 + 4.6 + k * 1.2)), cy = f1(231.4 - k * 4.4); return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="7.6" ry="2.5" transform="rotate(' + d * (-22 - k * 15) + ' ' + cx + ' ' + cy + ')" fill="' + c[2] + '" stroke="' + c[1] + '" stroke-width=".9"/>'; }).join('');
    if (sm === 'rocket') return '<path class="av-flick" d="M' + f1(xc - 5.6) + ' 244Q' + f1(xc - 6.6) + ' 249.6 ' + xc + ' 251.8Q' + f1(xc + 6.6) + ' 249.6 ' + f1(xc + 5.6) + ' 244Z" fill="' + c[3] + '"/><path class="av-flick" d="M' + f1(xc - 3) + ' 244Q' + f1(xc - 3.4) + ' 247.6 ' + xc + ' 249.4Q' + f1(xc + 3.4) + ' 247.6 ' + f1(xc + 3) + ' 244Z" fill="' + c[2] + '"/>' +
      ankle(219, c[0]) + base + '<rect x="' + f1(lx - lg / 2 - 2) + '" y="224" width="' + f1(lg + 4) + '" height="3.4" rx="1.4" fill="' + c[1] + '"/><rect x="' + x0 + '" y="241" width="' + w + '" height="5" rx="1.8" fill="' + c[1] + '"/>';
    return base;
  };
  const legs = [-1, 1].map((d) => ln(X(d * 11.5), 170, X(d * 12.5), 231, lg, skin)).join('') +
    [-1, 1].map(shoeArt).join('') +
    P('M' + X(-ww - hip) + ' 149L' + X(ww + hip) + ' 149L' + X(13 + lg / 2 + 2.5) + ' 190L102.5 190L100 177L97.5 190L' + X(-13 - lg / 2 - 2.5) + ' 190Z', '#39415A', ' stroke="#39415A" stroke-width="4" stroke-linejoin="round"');
  if (o.crop) return '<svg class="av still" viewBox="' + o.crop + '" aria-hidden="true"><g class="av-fig">' + backHair + backArt + legs + body + '</g></svg>';
  return '<svg class="av' + (o.flex ? ' flex' : '') + (o.still ? ' still' : '') + '" viewBox="0 -6 200 258" role="img" aria-label="' + say('הדמות שלי, רמה ', 'My character, level ') + lvl + '">' +
    '<circle class="av-aura r' + rankOf(lvl).i + '" cx="100" cy="116" r="90"/>' + glow + '<ellipse class="av-shadow" cx="100" cy="247" rx="48" ry="4.6"/>' +
    '<g class="av-fig">' + backHair + cape + backArt + legs + body + '</g>' + stars + '</svg>';
}
