/* ================================================================== the player's character
   One SVG figure, drawn from a few choices (skin, hair, beard, shirt) and from the level: the body fills out as the
   level climbs, and the gear opened along the way (see REWARDS) is worn from then on. The arms are two jointed groups,
   so a class on the root is enough to move between standing and flexing. */
const SKIN = [['#F8DEC9', '#E8BEA0'], ['#EFC4A0', '#D7A07A'], ['#DDAA80', '#C0885E'], ['#C18A5B', '#A06C42'], ['#8F5C38', '#714525'], ['#5F3C25', '#472B18']];
/* a haircut is drawn by its number; the list shows them in this order, each by the name a barber would use */
const HAIR = ['קרחת', 'קצר', 'מורם', 'מתולתל', 'ארוך', 'פוני', 'קצוץ', 'שביל בצד', 'בינוני'];
const HAIR_EN = ['Bald', 'Short', 'Swept up', 'Curly', 'Long', 'Fringe', 'Buzz cut', 'Side part', 'Medium'];
const HAIR_ORDER = [1, 6, 7, 5, 2, 3, 8, 4, 0];
const hairName = (i) => (LANG === 'en' ? HAIR_EN[i] : HAIR[i]);
const BEARDS = () => (LANG === 'en' ? ['None', 'Stubble', 'Full'] : BEARD);
const HAIRC = ['#1E1A18', '#3A2A21', '#5E4130', '#8A6446', '#B89058', '#DDBB78', '#A9502C', '#9B9AA0'];
const BEARD = ['בלי', 'זיפים', 'זקן מלא'];
/* shirts in the colours shirts come in: the gymi purple, white, black, grey, navy, olive, burgundy and sand */
const SHIRT = ['#6D3FE0', '#F2F2F4', '#1E1D24', '#8E8C97', '#25315E', '#5C6B3C', '#7A2340', '#CDBB9A'];
const tone = (hex, k) => mixRgb(hexRgb(hex), k < 0 ? [0, 0, 0] : [255, 255, 255], Math.abs(k));
/* a colour of its own is taken only when it is a plain six-digit hex colour: it ends up inside the drawing's markup */
const ownHex = (v) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null);

/* o.bust: head and shoulders only, for small round portraits · o.flex: drawn flexing · o.still: no idle motion · o.grin: an open smile
   A look can also carry what only the coach has: a hair or shirt colour of its own (hairC, shirtC), the fringe (hair: 5),
   a stud in the ear (stud), and no gear whatever the level (gear: false). A player's look is cleaned to the choices above */
function avatarSVG(look, lvl, o) {
  o = o || {}; look = look || {};
  const wear = (k) => Array.isArray(look.wear) && look.wear.includes(k);
  const b = Math.max(buildOf(lvl), o.base || 0), L = (a, z) => +(a + (z - a) * b).toFixed(1), has = (k) => look.gear !== false && REWARDS.some((r) => r.k === k && r.at <= lvl);
  const sk = SKIN[look.skin] || SKIN[1], skin = sk[0], shd = sk[1], hc = ownHex(look.hairC) || HAIRC[look.hc] || HAIRC[0], shirt = ownHex(look.shirtC) || SHIRT[look.shirt] || SHIRT[0], shirt2 = tone(shirt, -0.18);
  const sw = L(31, 43), cw = L(27, 39), ww = L(22, 25), nw = L(8, 11.5), ua = L(12, 19), fa = L(10, 14.5), lg = L(16, 21), sy = L(96, 93.5), tank = has('tank');
  const ln = (x1, y1, x2, y2, w, c) => '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" fill="none"/>';
  const dot = (x, y, r, c) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '"/>';
  const P = (d, c, extra) => '<path d="' + d + '" fill="' + c + '"' + (extra || '') + '/>';
  const X = (v) => +(100 + v).toFixed(1);

  /* the torso outline, shared by the shirt and (under a tank top) the bare chest */
  const torso = 'M' + X(-nw - 2) + ' 89L' + X(-sw + 7) + ' ' + sy + 'Q' + X(-sw - 1) + ' ' + (sy + 1) + ' ' + X(-sw - 1) + ' 106L' + X(-cw) + ' 120Q' + X(-ww - 1) + ' 140 ' + X(-ww) + ' 156L' + X(ww) + ' 156Q' + X(ww + 1) + ' 140 ' + X(cw) + ' 120L' + X(sw + 1) + ' 106Q' + X(sw + 1) + ' ' + (sy + 1) + ' ' + X(sw - 7) + ' ' + sy + 'L' + X(nw + 2) + ' 89Q100 97 ' + X(-nw - 2) + ' 89Z';
  const tankTop = 'M' + X(-nw - 6) + ' 91Q' + X(-nw - 5) + ' 112 ' + X(-cw + 1) + ' 121Q' + X(-ww - 1) + ' 140 ' + X(-ww) + ' 156L' + X(ww) + ' 156Q' + X(ww + 1) + ' 140 ' + X(cw - 1) + ' 121Q' + X(nw + 5) + ' 112 ' + X(nw + 6) + ' 91L' + X(nw + 1) + ' 91Q100 108 ' + X(-nw - 1) + ' 91Z';
  const pecs = b > 0.3 ? '<path d="M' + X(-cw * 0.74) + ' 119Q' + X(-cw * 0.38) + ' 127 99 121M' + X(cw * 0.74) + ' 119Q' + X(cw * 0.38) + ' 127 101 121" stroke="' + (tank ? shd : shirt2) + '" stroke-width="1.7" stroke-linecap="round" fill="none" opacity="' + Math.min(0.75, (b - 0.3) * 1.4).toFixed(2) + '"/>' : '';
  const arm = (d) => {
    const sx = X(d * sw), bi = X(d * (sw + ua * 0.34));
    return '<g class="av-arm ' + (d < 0 ? 'l' : 'r') + '" style="transform-origin:' + sx + 'px 104px">' + ln(sx, 104, sx, 139, ua, skin) +
      '<ellipse class="av-bi" style="transform-origin:' + sx + 'px 122px" cx="' + bi + '" cy="122" rx="' + (ua * 0.44).toFixed(1) + '" ry="' + L(9, 12.5) + '" fill="' + skin + '"/>' +
      (tank ? dot(sx, 104, +(ua / 2 + 1.5).toFixed(1), skin) : ln(sx, 104, sx, 118, ua + 4, shirt)) +
      '<g class="av-fore" style="transform-origin:' + sx + 'px 139px">' + ln(sx, 139, sx, 169, fa, skin) + (has('wraps') ? ln(sx, 161, sx, 168, fa + 1.8, '#ECEEF2') + ln(sx, 164.5, sx, 164.6, fa + 1.8, '#C9CED8') : '') +
      (d > 0 && wear('watch') ? ln(sx, 153.6, sx, 156.4, fa + 1.6, '#1E1D24') + '<rect x="' + (sx - 3.6).toFixed(1) + '" y="151.4" width="7.2" height="7.2" rx="2" fill="#EDEBFA" stroke="#1E1D24" stroke-width="1.5"/>' : '') +
      (wear('gloves') ? dot(sx, 175, L(6.9, 8.5), '#1E1D24') + ln(sx, 169.4, sx, 170.6, fa + 1.4, '#6D3FE0') : dot(sx, 175, L(6.6, 8.2), skin)) + '</g></g>';
  };

  /* head: back hair first, so long hair falls behind the shoulders */
  const hair = look.hair | 0, hasHair = hair > 0, browC = hasHair ? tone(hc, -0.15) : '#4A3A30';
  const backHair = hair === 4 ? P('M72 52C67 30 83 18 100 18C117 18 133 30 128 52L131 93C124 100 116 98 114 91L114 70L86 70L86 91C84 98 76 100 69 93Z', hc) : '';
  const cap = 'M74 54C70.5 33 84 20 100 20C116 20 129.5 33 126 54C124 46 119.5 40 112 38.5C104 37 96 37 88 38.5C80.5 40 76 46 74 54Z';
  let topHair = '';
  if (hair === 1 || hair === 4) topHair = P(cap, hc);
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
  const beard = look.beard === 2 ? P(beardD, hasHair ? hc : '#4A3A30') + '<ellipse cx="100" cy="69.3" rx="7.4" ry="3.9" fill="' + skin + '"/>' : look.beard === 1 ? P(beardD, hasHair ? hc : '#4A3A30', ' opacity=".26"') : '';
  /* gear is won in the game, so it is gold */
  const bandC = '#F2B93B';
  const capOn = wear('cap');
  const band = has('band') && !capOn ? P('M74.6 44.5C83 38.5 117 38.5 125.4 44.5L125.6 38.5C117 32 83 32 74.4 38.5Z', bandC) + P('M125 39.5L134 35.5L131 42.5ZM125 42L134.5 46L128.5 48.5Z', tone(bandC, -0.12)) : '';
  const crown = has('crown') && !capOn ? '<g>' + P('M82 19L79.5 3.5L91 11L100 0.5L109 11L120.5 3.5L118 19Z', '#F2B93B', ' stroke="#C98F1C" stroke-width="1.5" stroke-linejoin="round"') + dot(100, 13, 2.2, '#6D3FE0') + '</g>' : '';
  const hat = capOn ? P('M73.2 47C71.4 28.5 84.6 17 100 17C115.4 17 128.6 28.5 126.8 47Q100 39.5 73.2 47Z', '#5229C4') + P('M69.6 47.4Q100 36.6 130.4 47.4Q132 50.8 128.6 52Q100 43.4 71.4 52Q68 50.8 69.6 47.4Z', '#3B1E96') + dot(100, 17.6, 2.1, '#3B1E96') + '<path d="M100 19.5V38" stroke="#3B1E96" stroke-width="1.2" opacity=".55"/>' : '';
  const shades = wear('shades') ? '<g><path d="M82 54L75.6 53M118 54L124.4 53" stroke="#15131C" stroke-width="2" stroke-linecap="round"/><rect x="81.8" y="50" width="16.6" height="11.4" rx="4.8" fill="#15131C"/><rect x="101.6" y="50" width="16.6" height="11.4" rx="4.8" fill="#15131C"/><path d="M98 54.4h4" stroke="#15131C" stroke-width="2"/><path d="M85.6 52.6l3.4 5.4M105.4 52.6l3.4 5.4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".3"/></g>' : '';
  const phones = wear('phones') ? '<path d="M72.6 52C70.4 26.5 85.5 13.6 100 13.6C114.5 13.6 129.6 26.5 127.4 52" stroke="#1E1D24" stroke-width="4.4" stroke-linecap="round" fill="none"/><rect x="66.6" y="46" width="10.4" height="20" rx="5" fill="#1E1D24"/><rect x="123" y="46" width="10.4" height="20" rx="5" fill="#1E1D24"/><rect x="68.6" y="50" width="3.6" height="12" rx="1.8" fill="#6D3FE0"/><rect x="127.8" y="50" width="3.6" height="12" rx="1.8" fill="#6D3FE0"/>' : '';
  /* round the neck: a towel that hangs down both sides of the chest, or a gold chain */
  const towel = wear('towel') ? [-1, 1].map((d) => P('M' + X(d * (nw + 3.6)) + ' 87.5L' + X(d * (nw + 7.2)) + ' 127Q' + X(d * (nw + 2)) + ' 129.4 ' + X(d * (nw - 3.4)) + ' 127.4L' + X(d * (nw - 2.6)) + ' 89.5Z', '#F4F4F6', ' stroke="#D9DAE0" stroke-width="1" stroke-linejoin="round"') + ln(X(d * (nw + 5.6)), 121, X(d * (nw - 2.6)), 121.4, 1.6, '#C9B8F5')).join('') : '';
  const chain = wear('chain') ? '<path d="M' + X(-nw + 1) + ' 90.5Q100 110 ' + X(nw - 1) + ' 90.5" stroke="#F2B93B" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="100" cy="101.4" r="3.3" fill="#FFD76A" stroke="#C98F1C" stroke-width="1.3"/>' : '';
  const medal = has('medal') ? '<path d="M' + X(-nw + 1) + ' 91L100 113L' + X(nw - 1) + ' 91" stroke="#6D3FE0" stroke-width="3.4" stroke-linejoin="round" fill="none"/><circle cx="100" cy="117" r="7.4" fill="#F2B93B" stroke="#C98F1C" stroke-width="1.6"/><path d="M100 113.2l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill="#C98F1C"/>' : '';
  /* the lifting belt turns into a title belt: gold, with a plate in the middle */
  const belt = has('champ') ? '<rect x="' + X(-ww - 3.5) + '" y="143" width="' + ((ww + 3.5) * 2).toFixed(1) + '" height="13" rx="4" fill="#F2B93B" stroke="#C98F1C" stroke-width="1.4"/><ellipse cx="100" cy="149.5" rx="11.5" ry="9" fill="#FFD76A" stroke="#C98F1C" stroke-width="1.8"/>' + dot(100, 149.5, 3.2, '#6D3FE0')
    : has('belt') ? '<rect x="' + X(-ww - 3) + '" y="144" width="' + ((ww + 3) * 2).toFixed(1) + '" height="11" rx="3.5" fill="#4A3628"/><rect x="94" y="145.5" width="12" height="8" rx="2" fill="none" stroke="#F2B93B" stroke-width="2.2"/>' : '';
  /* past the crown: a cape that hangs from the shoulders behind the figure, held by two gold clasps */
  const cape = has('cape') ? P('M' + X(-sw + 3) + ' ' + (sy + 2) + 'Q' + X(-sw - 17) + ' 150 ' + X(-sw - 11) + ' 210Q100 224 ' + X(sw + 11) + ' 210Q' + X(sw + 17) + ' 150 ' + X(sw - 3) + ' ' + (sy + 2) + 'Z', '#3B1E96', ' stroke="#F2B93B" stroke-width="2.2" stroke-linejoin="round"') +
    '<path d="M' + X(-sw - 12) + ' 178Q100 194 ' + X(sw + 12) + ' 178" stroke="#2A1470" stroke-width="2" fill="none" opacity=".55"/>' : '';
  const clasp = cape ? dot(X(-nw - 5), 93.5, 2.7, '#F2B93B') + dot(X(nw + 5), 93.5, 2.7, '#F2B93B') : '';
  const shoe = wear('kicksW') ? ['#F4F4F6', '#C9CED8'] : wear('kicksP') ? ['#6D3FE0', '#F4F4F6'] : has('kicks') ? ['#F2B93B', '#FFF6DC'] : ['#3A4152', '#E7E9ED'], glow = has('glow') ? '<g class="av-glow"><circle cx="100" cy="116" r="97" fill="#F2B93B" opacity=".1"/><circle cx="100" cy="116" r="80" fill="#F2B93B" opacity=".12"/><circle cx="100" cy="116" r="62" fill="#F2B93B" opacity=".14"/></g>' : '';
  const star4 = (x, y, r, d) => '<path class="av-spark" style="animation-delay:' + d + 's" d="M' + x + ' ' + (y - r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z" fill="#FFD76A"/>';
  const stars = has('stars') ? star4(24, 56, 7, 0) + star4(176, 44, 6, 0.5) + star4(13, 138, 5, 1) + star4(187, 128, 7, 1.4) + star4(36, 208, 5, 0.8) + star4(167, 214, 6, 0.3) : '';

  const head = '<ellipse cx="74.6" cy="56" rx="4.2" ry="6.2" fill="' + skin + '"/><ellipse cx="125.4" cy="56" rx="4.2" ry="6.2" fill="' + skin + '"/>' +
    P('M75 51C75 32 87 23.5 100 23.5C113 23.5 125 32 125 51C125 68 114 82 100 82C86 82 75 68 75 51Z', skin) + beard +
    '<g class="av-eyes"><ellipse cx="90.2" cy="56" rx="2.7" ry="3.1" fill="#1B1F27"/><ellipse cx="109.8" cy="56" rx="2.7" ry="3.1" fill="#1B1F27"/><circle cx="91.1" cy="54.9" r=".9" fill="#fff"/><circle cx="110.7" cy="54.9" r=".9" fill="#fff"/></g>' +
    '<path d="M85.4 49.8q4.6-3 9.4-.7M105.2 49.1q4.8-2.3 9.4.7" stroke="' + browC + '" stroke-width="2.1" stroke-linecap="round" fill="none"/>' +
    '<path d="M100 59.5q-2.6 3.4 0 4.6" stroke="' + shd + '" stroke-width="1.7" stroke-linecap="round" fill="none"/>' +
    '<path class="av-smile" d="M92.6 68Q100 74 107.4 68" stroke="#1B1F27" stroke-width="2.2" stroke-linecap="round" fill="none"/>' +
    '<g class="av-grin"><path d="M91.6 66.6Q100 78 108.4 66.6Z" fill="#1B1F27" stroke="#1B1F27" stroke-width="1.6" stroke-linejoin="round"/><path d="M94.4 67.3h11.2q-1 2.6-5.6 2.6t-5.6-2.6z" fill="#fff"/></g>' +
    topHair + band + crown + hat + shades + phones +
    (look.stud ? '<circle cx="127.6" cy="58.2" r="1.35" fill="#C9CED8" stroke="#7C8492" stroke-width=".6"/><circle cx="126.8" cy="61.3" r="1.15" fill="#C9CED8" stroke="#7C8492" stroke-width=".6"/>' : '');

  const body = '<g class="av-bod">' + (tank ? P(torso, skin) + P(tankTop, shirt) : P(torso, shirt)) + pecs + belt +
    '<rect x="' + X(-nw) + '" y="74" width="' + (nw * 2).toFixed(1) + '" height="20" rx="5" fill="' + skin + '"/><ellipse cx="100" cy="83.5" rx="' + nw + '" ry="4.2" fill="' + shd + '"/>' +
    (tank ? '' : '<path d="M' + X(-nw - 2.5) + ' 89.5Q100 99.5 ' + X(nw + 2.5) + ' 89.5" stroke="' + shirt2 + '" stroke-width="2.6" stroke-linecap="round" fill="none"/>') + clasp + medal + chain + towel + head + arm(-1) + arm(1) + '</g>';
  /* a bust is cut round under the hair: with the crown on, the frame takes in its points */
  if (o.bust) return '<svg class="av bust' + (o.flex ? ' flex' : '') + (o.grin ? ' grin' : '') + '" viewBox="' + (crown ? '51 -1 98 98' : '58 14 84 84') + '" aria-hidden="true">' + backHair + body + '</svg>';

  const legs = [-1, 1].map((d) => ln(X(d * 11.5), 170, X(d * 12.5), 231, lg, skin)).join('') +
    [-1, 1].map((d) => { const x0 = d < 0 ? X(-12.5 - lg / 2 - 6) : X(12.5 - lg / 2 - 1); return '<rect x="' + x0 + '" y="232.5" width="' + (lg + 7).toFixed(1) + '" height="13.5" rx="6.5" fill="' + shoe[0] + '"/><rect x="' + x0 + '" y="242.6" width="' + (lg + 7).toFixed(1) + '" height="3.4" rx="1.7" fill="' + shoe[1] + '"/>'; }).join('') +
    P('M' + X(-ww - 1.5) + ' 149L' + X(ww + 1.5) + ' 149L' + X(13 + lg / 2 + 2.5) + ' 190L102.5 190L100 177L97.5 190L' + X(-13 - lg / 2 - 2.5) + ' 190Z', '#39415A', ' stroke="#39415A" stroke-width="4" stroke-linejoin="round"');
  if (o.crop) return '<svg class="av still" viewBox="' + o.crop + '" aria-hidden="true"><g class="av-fig">' + backHair + legs + body + '</g></svg>';
  return '<svg class="av' + (o.flex ? ' flex' : '') + (o.still ? ' still' : '') + '" viewBox="0 -6 200 258" role="img" aria-label="' + say('הדמות שלי, רמה ', 'My character, level ') + lvl + '">' +
    '<circle class="av-aura r' + rankOf(lvl).i + '" cx="100" cy="116" r="90"/>' + glow + '<ellipse class="av-shadow" cx="100" cy="247" rx="48" ry="4.6"/>' +
    '<g class="av-fig">' + backHair + cape + legs + body + '</g>' + stars + '</svg>';
}
