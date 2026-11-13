/* ================================================================== the player's character
   One SVG figure, drawn from a few choices (skin, hair, beard, shirt) and from the level: the body fills out as the
   level climbs, and the gear opened along the way (see REWARDS) is worn from then on. The arms are two jointed groups,
   so a class on the root is enough to move between standing and flexing. */
const SKIN = [['#F9DCC4', '#E6B596'], ['#EFC09A', '#D69D72'], ['#D8A070', '#B87E50'], ['#B07A48', '#8C5C31'], ['#7A4E2D', '#5C381D']];
const HAIR = ['קירח', 'קצר', 'בלורית', 'מתולתל', 'ארוך'];
const HAIRS = () => (LANG === 'en' ? ['Bald', 'Short', 'Quiff', 'Curly', 'Long'] : HAIR);
const BEARDS = () => (LANG === 'en' ? ['None', 'Stubble', 'Full'] : BEARD);
const HAIRC = ['#26211F', '#4E3222', '#8B5E34', '#D9A94E', '#B9482B', '#A7ADB8'];
const BEARD = ['בלי', 'זיפים', 'מלא'];
const SHIRT = ['#2152E0', '#0E9F6E', '#E0364F', '#F08C1A', '#7B4BE0', '#3A4152'];
const tone = (hex, k) => mixRgb(hexRgb(hex), k < 0 ? [0, 0, 0] : [255, 255, 255], Math.abs(k));

/* o.bust: head and shoulders only, for small round portraits · o.flex: drawn flexing · o.still: no idle motion */
function avatarSVG(look, lvl, o) {
  o = o || {}; look = look || {};
  const b = buildOf(lvl), L = (a, z) => +(a + (z - a) * b).toFixed(1), has = (k) => REWARDS.some((r) => r.k === k && r.at <= lvl);
  const sk = SKIN[look.skin] || SKIN[1], skin = sk[0], shd = sk[1], hc = HAIRC[look.hc] || HAIRC[0], shirt = SHIRT[look.shirt] || SHIRT[0], shirt2 = tone(shirt, -0.18);
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
      '<g class="av-fore" style="transform-origin:' + sx + 'px 139px">' + ln(sx, 139, sx, 169, fa, skin) + (has('wraps') ? ln(sx, 161, sx, 168, fa + 1.8, '#ECEEF2') + ln(sx, 164.5, sx, 164.6, fa + 1.8, '#C9CED8') : '') + dot(sx, 175, L(6.6, 8.2), skin) + '</g></g>';
  };

  /* head: back hair first, so long hair falls behind the shoulders */
  const hair = look.hair | 0, hasHair = hair > 0, browC = hasHair ? tone(hc, -0.15) : '#4A3A30';
  const backHair = hair === 4 ? P('M72 52C67 30 83 18 100 18C117 18 133 30 128 52L131 93C124 100 116 98 114 91L114 70L86 70L86 91C84 98 76 100 69 93Z', hc) : '';
  const cap = 'M74 54C70.5 33 84 20 100 20C116 20 129.5 33 126 54C124 46 119.5 40 112 38.5C104 37 96 37 88 38.5C80.5 40 76 46 74 54Z';
  let topHair = '';
  if (hair === 1 || hair === 4) topHair = P(cap, hc);
  else if (hair === 2) topHair = P(cap, hc) + P('M80 31C83 15 110 9 124 25C116 22.5 108 25 100 29.5C93 33.5 86 34.5 80 31Z', hc) + '<path d="M90 24Q101 17 114 21" stroke="' + tone(hc, 0.22) + '" stroke-width="1.6" stroke-linecap="round" fill="none"/>';
  else if (hair === 3) topHair = P(cap, hc) + [[78, 41, 8], [84, 31, 8.5], [93, 25, 8.5], [103, 23, 8.5], [113, 26, 8.5], [121, 33, 8], [124.5, 43, 7], [76, 50, 5.5]].map((c) => dot(c[0], c[1], c[2], hc)).join('');
  const beardD = 'M75.5 55C75.5 72 86 85.5 100 85.5C114 85.5 124.5 72 124.5 55C121.5 62 117 64.5 112 64.5C108 61 92 61 88 64.5C83 64.5 78.5 62 75.5 55Z';
  const beard = look.beard === 2 ? P(beardD, hasHair ? hc : '#4A3A30') + '<ellipse cx="100" cy="69.3" rx="7.4" ry="3.9" fill="' + skin + '"/>' : look.beard === 1 ? P(beardD, hasHair ? hc : '#4A3A30', ' opacity=".26"') : '';
  const bandC = look.shirt === 2 ? '#F4F5F7' : '#E0364F';
  const band = has('band') ? P('M74.6 44.5C83 38.5 117 38.5 125.4 44.5L125.6 38.5C117 32 83 32 74.4 38.5Z', bandC) + P('M125 39.5L134 35.5L131 42.5ZM125 42L134.5 46L128.5 48.5Z', tone(bandC, -0.12)) : '';
  const crown = has('crown') ? '<g>' + P('M82 19L79.5 3.5L91 11L100 0.5L109 11L120.5 3.5L118 19Z', '#F2B93B', ' stroke="#C98F1C" stroke-width="1.5" stroke-linejoin="round"') + dot(100, 13, 2.2, '#E0364F') + '</g>' : '';
  const medal = has('medal') ? '<path d="M' + X(-nw + 1) + ' 91L100 113L' + X(nw - 1) + ' 91" stroke="#E0364F" stroke-width="3.4" stroke-linejoin="round" fill="none"/><circle cx="100" cy="117" r="7.4" fill="#F2B93B" stroke="#C98F1C" stroke-width="1.6"/><path d="M100 113.2l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill="#C98F1C"/>' : '';
  const belt = has('belt') ? '<rect x="' + X(-ww - 3) + '" y="144" width="' + ((ww + 3) * 2).toFixed(1) + '" height="11" rx="3.5" fill="#4A3628"/><rect x="94" y="145.5" width="12" height="8" rx="2" fill="none" stroke="#F2B93B" stroke-width="2.2"/>' : '';

  const head = '<ellipse cx="74.6" cy="56" rx="4.2" ry="6.2" fill="' + skin + '"/><ellipse cx="125.4" cy="56" rx="4.2" ry="6.2" fill="' + skin + '"/>' +
    P('M75 51C75 32 87 23.5 100 23.5C113 23.5 125 32 125 51C125 68 114 82 100 82C86 82 75 68 75 51Z', skin) + beard +
    '<g class="av-eyes"><ellipse cx="90.2" cy="56" rx="2.7" ry="3.1" fill="#1B1F27"/><ellipse cx="109.8" cy="56" rx="2.7" ry="3.1" fill="#1B1F27"/><circle cx="91.1" cy="54.9" r=".9" fill="#fff"/><circle cx="110.7" cy="54.9" r=".9" fill="#fff"/></g>' +
    '<path d="M85.4 49.8q4.6-3 9.4-.7M105.2 49.1q4.8-2.3 9.4.7" stroke="' + browC + '" stroke-width="2.1" stroke-linecap="round" fill="none"/>' +
    '<path d="M100 59.5q-2.6 3.4 0 4.6" stroke="' + shd + '" stroke-width="1.7" stroke-linecap="round" fill="none"/>' +
    '<path class="av-smile" d="M92.6 68Q100 74 107.4 68" stroke="#1B1F27" stroke-width="2.2" stroke-linecap="round" fill="none"/>' +
    '<g class="av-grin"><path d="M91.6 66.6Q100 78 108.4 66.6Z" fill="#1B1F27" stroke="#1B1F27" stroke-width="1.6" stroke-linejoin="round"/><path d="M94.4 67.3h11.2q-1 2.6-5.6 2.6t-5.6-2.6z" fill="#fff"/></g>' +
    topHair + band + crown;

  const body = '<g class="av-bod">' + (tank ? P(torso, skin) + P(tankTop, shirt) : P(torso, shirt)) + pecs + belt +
    '<rect x="' + X(-nw) + '" y="74" width="' + (nw * 2).toFixed(1) + '" height="20" rx="5" fill="' + skin + '"/><ellipse cx="100" cy="83.5" rx="' + nw + '" ry="4.2" fill="' + shd + '"/>' +
    (tank ? '' : '<path d="M' + X(-nw - 2.5) + ' 89.5Q100 99.5 ' + X(nw + 2.5) + ' 89.5" stroke="' + shirt2 + '" stroke-width="2.6" stroke-linecap="round" fill="none"/>') + medal + head + arm(-1) + arm(1) + '</g>';
  if (o.bust) return '<svg class="av bust' + (o.flex ? ' flex' : '') + '" viewBox="58 14 84 84" aria-hidden="true">' + backHair + body + '</svg>';

  const legs = [-1, 1].map((d) => ln(X(d * 11.5), 170, X(d * 12.5), 231, lg, skin)).join('') +
    [-1, 1].map((d) => { const x0 = d < 0 ? X(-12.5 - lg / 2 - 6) : X(12.5 - lg / 2 - 1); return '<rect x="' + x0 + '" y="232.5" width="' + (lg + 7).toFixed(1) + '" height="13.5" rx="6.5" fill="#3A4152"/><rect x="' + x0 + '" y="242.6" width="' + (lg + 7).toFixed(1) + '" height="3.4" rx="1.7" fill="#E7E9ED"/>'; }).join('') +
    P('M' + X(-ww - 1.5) + ' 149L' + X(ww + 1.5) + ' 149L' + X(13 + lg / 2 + 2.5) + ' 190L102.5 190L100 177L97.5 190L' + X(-13 - lg / 2 - 2.5) + ' 190Z', '#39415A', ' stroke="#39415A" stroke-width="4" stroke-linejoin="round"');
  return '<svg class="av' + (o.flex ? ' flex' : '') + (o.still ? ' still' : '') + '" viewBox="0 -6 200 258" role="img" aria-label="הדמות שלי, רמה ' + lvl + '">' +
    '<circle class="av-aura r' + rankOf(lvl).i + '" cx="100" cy="116" r="90"/><ellipse class="av-shadow" cx="100" cy="247" rx="48" ry="4.6"/>' +
    '<g class="av-fig">' + backHair + legs + body + '</g></svg>';
}
