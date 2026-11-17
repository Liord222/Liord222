/* ================================================================== drawings
   The things of the game drawn as themselves, not as icons: the box of each rarity, every piece of gear that the
   road gives, and the sights of the sky the road climbs through. Each is one small SVG with a dark outline, in the
   manner of the character (avatar.js). Flat fills only: a gradient would need an id of its own in the page */
const ART_OL = ' stroke-linejoin="round" stroke-linecap="round"';
const artSvg = (cls, body, vb) => '<svg class="' + cls + '" viewBox="' + (vb || '0 0 64 64') + '" aria-hidden="true">' + body + '</svg>';
const shine = (x, y, k, c) => '<path transform="translate(' + x + ' ' + y + ') scale(' + k + ')" d="M0-6Q0 0 6 0Q0 0 0 6Q0 0-6 0Q0 0 0-6Z" fill="' + (c || '#FFF3B0') + '"/>';
const ART_STAR = (x, y, R, r) => { let q = ''; for (let k = 0; k < 10; k++) { const a = ((-90 + k * 36) * Math.PI) / 180, v = k % 2 ? r : R; q += (k ? 'L' : 'M') + (x + Math.cos(a) * v).toFixed(1) + ' ' + (y + Math.sin(a) * v).toFixed(1); } return q + 'Z'; };

/* ---- a box of the collection: a chunky toy chest in one colour, the colour of its rarity. A thick dark outline, a lighter lid
   with a shine, rubber bumpers on the corners, a handle on top and a round plate in front with a dumbbell on it. The rarer, the
   richer: sparkles from epic on, a gem on the handle and a glow behind the mythic and the legendary ---- */
const BOX_OL = '#1B1035';
function boxSVG(kind) {
  kind = BOXES[kind] ? kind : 0;
  const c = kind === 0 ? '#9AA1B2' : BOXES[kind].c, lt = tone(c, 0.32), lt2 = tone(c, 0.6), dk = tone(c, -0.3), dk2 = tone(c, -0.5), ol = ' stroke="' + BOX_OL + '" stroke-width="2.6"' + ART_OL;
  const bump = (x, y) => '<rect x="' + (x - 4.6) + '" y="' + (y - 4.6) + '" width="9.2" height="9.2" rx="3.4" fill="' + dk + '"' + ol + ' stroke-width="2.2"/><circle cx="' + (x - 1.2) + '" cy="' + (y - 1.4) + '" r="1.3" fill="' + lt + '"/>';
  const glow = kind >= 4 ? '<circle cx="32" cy="35" r="31" fill="' + (kind === 5 ? '#FFE27A' : c) + '" opacity=".22"/><circle cx="32" cy="35" r="23" fill="' + (kind === 5 ? '#FFE27A' : c) + '" opacity=".2"/>' : '';
  return artSvg('bx r' + kind, glow +
    '<ellipse cx="32" cy="59.5" rx="25" ry="3.4" fill="rgb(0 0 0 / .22)"/>' +
    '<g class="bx-body"><path d="M7 33H57V50Q57 57.5 49.5 57.5H14.5Q7 57.5 7 50Z" fill="' + c + '"' + ol + '/>' +
    '<path d="M51 34.5H55.5V50Q55.5 55 51 56Z" fill="' + dk + '" opacity=".55"/><path d="M9 51Q10 55.5 15 56H49Q54 55.5 55 51" stroke="' + dk2 + '" stroke-width="2.4" fill="none" opacity=".45"' + ART_OL + '/>' +
    bump(9, 54.5) + bump(55, 54.5) + '</g>' +
    '<g class="bx-lid"><path d="M23 13V8.5Q23 5.5 26 5.5H38Q41 5.5 41 8.5V13" stroke="' + BOX_OL + '" stroke-width="6.4" fill="none"' + ART_OL + '/><path d="M23 13V8.5Q23 5.5 26 5.5H38Q41 5.5 41 8.5V13" stroke="' + dk + '" stroke-width="3" fill="none"' + ART_OL + '/>' +
    (kind >= 4 ? '<path d="M32 3L35 6.5L32 10L29 6.5Z" fill="' + (kind === 5 ? '#5BE0FF' : '#FFE27A') + '" stroke="' + BOX_OL + '" stroke-width="1.6"/>' : '') +
    '<path d="M6 34V21Q6 12.5 14.5 12.5H49.5Q58 12.5 58 21V34Z" fill="' + lt + '"' + ol + '/>' +
    '<path d="M11 19.5Q11.5 16.3 15.5 16.3H35" stroke="' + lt2 + '" stroke-width="3.6" fill="none"' + ART_OL + '/><circle cx="40" cy="16.4" r="1.7" fill="' + lt2 + '"/>' +
    '<path d="M52 14.5Q56.5 15.5 56.5 21V32.5H52Z" fill="' + c + '" opacity=".6"/>' +
    '<rect x="4.5" y="30.5" width="55" height="6" rx="3" fill="' + dk + '"' + ol + ' stroke-width="2.2"/>' +
    bump(8.5, 15.5) + bump(55.5, 15.5) + '</g>' +
    '<circle cx="30" cy="35" r="10" fill="' + lt2 + '"' + ol + '/><circle cx="30" cy="35" r="6.6" fill="none" stroke="' + lt + '" stroke-width="1.6"/>' +
    '<path d="M24.6 35H35.4" stroke="' + BOX_OL + '" stroke-width="2.2" stroke-linecap="round"/><rect x="23" y="31" width="3.4" height="8" rx="1.2" fill="' + BOX_OL + '"/><rect x="33.6" y="31" width="3.4" height="8" rx="1.2" fill="' + BOX_OL + '"/>' +
    '<path d="M57.5 36.5H61Q62.5 36.5 62.5 38V43Q62.5 44.5 61 44.5H57.5Z" fill="' + dk + '"' + ol + ' stroke-width="2"/>' +
    (kind >= 3 ? shine(6, 7, 0.95) + shine(60, 5, 0.75) : '') + (kind >= 5 ? shine(62, 52, 0.6) + shine(2.5, 48, 0.55) : ''));
}

/* ---- the gear of the road, each drawn as the thing itself (see REWARDS) ---- */
const GOLD = ['#F6C343', '#B07A0C', '#FFE59A'];
const GEAR_ART = {
  /* a sweatband: a ring seen from a little above, its inside dark, two tails tied at the side */
  band: () => '<path d="M50 32L60 47L54.5 49L46.5 35Z" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="1.6"' + ART_OL + '/><path d="M46 34L50.5 52H45L42.5 35Z" fill="#E0A92C" stroke="' + GOLD[1] + '" stroke-width="1.6"' + ART_OL + '/>' +
    '<path d="M9 25A23 8.5 0 0 1 55 25L55 33A23 8.5 0 0 0 9 33Z" fill="#B88416" stroke="' + GOLD[1] + '" stroke-width="1.6"/>' +
    '<path d="M9 25A23 8.5 0 0 0 55 25L55 33A23 8.5 0 0 1 9 33Z" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="1.8"' + ART_OL + '/>' +
    '<path d="M11.5 30.6A20.5 7 0 0 0 52.5 30.6" stroke="#fff" stroke-width="2.2" fill="none" opacity=".75"' + ART_OL + '/>',
  /* wrist wraps: two rolls, each with its end loose and a strip to close it */
  wraps: () => [[1, 9, 0], [8, 33, 1]].map(([x, y, k]) => '<g transform="translate(' + x + ' ' + y + ') scale(1.12)"><path d="M18 2H44Q48 2 48 6V12Q48 16 44 16H18Z" fill="' + (k ? '#D6D9E1' : '#ECEEF2') + '" stroke="#7E8594" stroke-width="1.6"' + ART_OL + '/>' +
    '<rect x="34" y="3.5" width="9" height="11" rx="2" fill="#6D3FE0" stroke="#3B1E96" stroke-width="1.3"/>' +
    '<ellipse cx="18" cy="9" rx="8" ry="9" fill="#F7F8FA" stroke="#7E8594" stroke-width="1.6"/><path d="M18 3.6A4.6 5.4 0 1 1 13.4 9A3 3.4 0 1 1 18 12.4" stroke="#A3A9B5" stroke-width="1.4" fill="none"' + ART_OL + '/>' +
    '<path d="M24 5V13M29 5V13" stroke="#C9CED8" stroke-width="1.3"' + ART_OL + '/></g>').join(''),
  /* a lifting belt: leather, stitched, with a gold buckle in front */
  belt: () => '<path d="M5 22Q32 33 59 22V40Q32 51 5 40Z" fill="#5A3E2B" stroke="#2E1F14" stroke-width="1.8"' + ART_OL + '/>' +
    '<path d="M7.5 26.2Q32 36.4 56.5 26.2M7.5 36.2Q32 46.4 56.5 36.2" stroke="#C9A27A" stroke-width="1.1" stroke-dasharray="2.4 2.2" fill="none"/>' +
    '<rect x="23" y="26" width="18" height="19" rx="3.5" fill="none" stroke="' + GOLD[1] + '" stroke-width="5"/><rect x="23" y="26" width="18" height="19" rx="3.5" fill="none" stroke="' + GOLD[0] + '" stroke-width="3"/><path d="M32 28.5V42.5" stroke="' + GOLD[0] + '" stroke-width="2.6"' + ART_OL + '/>',
  /* a tank top in the purple of gymi */
  tank: () => '<path d="M21 6H27Q32 17 37 6H43Q43 20 50 24V55Q32 59 14 55V24Q21 20 21 6Z" fill="#6D3FE0" stroke="#3B1E96" stroke-width="1.8"' + ART_OL + '/>' +
    '<path d="M27 6Q32 17 37 6" stroke="#8D66F0" stroke-width="2.4" fill="none"' + ART_OL + '/><path d="M18 27Q19 40 18 51" stroke="#fff" stroke-width="2.4" fill="none" opacity=".28"' + ART_OL + '/>' +
    '<path d="M26.5 37H37.5" stroke="#fff" stroke-width="2.6"' + ART_OL + '/><rect x="22.5" y="32" width="4.5" height="10" rx="1.4" fill="#fff"/><rect x="37" y="32" width="4.5" height="10" rx="1.4" fill="#fff"/>',
  /* a gold medal on a purple ribbon */
  medal: () => '<path d="M17 3H28L36 29H25Z" fill="#6D3FE0" stroke="#3B1E96" stroke-width="1.6"' + ART_OL + '/><path d="M47 3H36L28 29H39Z" fill="#8D66F0" stroke="#3B1E96" stroke-width="1.6"' + ART_OL + '/>' +
    '<circle cx="32" cy="41" r="15" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="2.2"/><circle cx="32" cy="41" r="10.5" fill="none" stroke="' + GOLD[1] + '" stroke-width="1.2" opacity=".6"/>' +
    '<path d="' + ART_STAR(32, 41.5, 7, 3) + '" fill="' + GOLD[1] + '"/><path d="M21.5 35A12 12 0 0 1 30 28" stroke="#fff" stroke-width="2" fill="none" opacity=".6"' + ART_OL + '/>',
  /* a crown: five points, a band with stones */
  crown: () => '<path d="M9 45L6 17L20 29L32 8L44 29L58 17L55 45Z" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="1.9"' + ART_OL + '/>' +
    '<path d="M11 24L13 41M32 15V40" stroke="' + GOLD[2] + '" stroke-width="2" opacity=".8"' + ART_OL + '/>' +
    '<rect x="8" y="43" width="48" height="11" rx="3" fill="#E0A92C" stroke="' + GOLD[1] + '" stroke-width="1.9"/>' +
    '<circle cx="6" cy="16" r="3" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="1.4"/><circle cx="32" cy="7" r="3.2" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="1.4"/><circle cx="58" cy="16" r="3" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="1.4"/>' +
    '<circle cx="20" cy="48.5" r="3" fill="#E0364B"/><path d="M32 45L35.2 48.5L32 52L28.8 48.5Z" fill="#6D3FE0"/><circle cx="44" cy="48.5" r="3" fill="#2B78F0"/>',
  /* a cape: deep purple with a gold edge, a lighter lining at the shoulders, a clasp */
  cape: () => '<path d="M19 9Q32 15 45 9L47 13Q57 34 58 56Q47 52 41 58Q32 52 23 58Q17 52 6 56Q7 34 17 13Z" fill="#3B1E96" stroke="' + GOLD[0] + '" stroke-width="2.4"' + ART_OL + '/>' +
    '<path d="M19 9Q32 15 45 9L46 14Q32 22 18 14Z" fill="#6D3FE0"/><path d="M24 22Q22 40 20 54M40 22Q42 40 44 54" stroke="#2A1470" stroke-width="2" fill="none" opacity=".7"' + ART_OL + '/>' +
    '<circle cx="23.5" cy="13" r="3.2" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="1.2"/><circle cx="40.5" cy="13" r="3.2" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="1.2"/><path d="M26.5 13.5Q32 16.4 37.5 13.5" stroke="' + GOLD[0] + '" stroke-width="1.6" fill="none"/>',
  /* a gold sneaker, seen from the side, a star on it */
  kicks: () => '<path d="M7 41Q7 29 16 27L28 25Q34 15 43 18L49 30Q58 33 58.5 42V45H7Z" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="1.8"' + ART_OL + '/>' +
    '<path d="M30 25L35 32M34.5 21.5L39.5 28.5M39 19L43.5 25" stroke="#fff" stroke-width="2" opacity=".9"' + ART_OL + '/><path d="' + ART_STAR(20.5, 36, 5, 2.2) + '" fill="#fff" opacity=".9"/>' +
    '<path d="M5.5 43.5H60V47Q60 52.5 54 52.5H11Q5.5 52.5 5.5 47Z" fill="#FFF6DC" stroke="' + GOLD[1] + '" stroke-width="1.8"' + ART_OL + '/><path d="M8 48.5H57" stroke="#E7D7A8" stroke-width="1.4"/>',
  /* a title belt: black straps, gold side plates, the big plate in front with a stone */
  champ: () => '<path d="M3 25H61V41H3Z" fill="#1E1D24" stroke="#000" stroke-width="1.6"' + ART_OL + '/><path d="M3 28H61M3 38H61" stroke="#3A3946" stroke-width="1.2"/>' +
    '<rect x="6" y="27" width="9" height="12" rx="2" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="1.3"/><rect x="49" y="27" width="9" height="12" rx="2" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="1.3"/>' +
    '<ellipse cx="32" cy="33" rx="17.5" ry="15" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="2"/><ellipse cx="32" cy="33" rx="12.5" ry="10.5" fill="#FFD76A" stroke="' + GOLD[1] + '" stroke-width="1.3"/>' +
    '<path d="' + ART_STAR(32, 33.5, 7.5, 3.2) + '" fill="#E0364B" stroke="#9E1F30" stroke-width="1"/><path d="M19.5 26A14 12 0 0 1 28 20.5" stroke="#fff" stroke-width="2" fill="none" opacity=".6"' + ART_OL + '/>',
  /* a golden glow: rays around a bright core */
  glow: () => { let r = ''; for (let k = 0; k < 12; k++) { const a = (k * 30 * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), w = k % 2 ? 0.1 : 0.14, L = k % 2 ? 24 : 30; r += '<path d="M' + (32 + Math.cos(a - w) * 13).toFixed(1) + ' ' + (32 + Math.sin(a - w) * 13).toFixed(1) + 'L' + (32 + c * L).toFixed(1) + ' ' + (32 + s * L).toFixed(1) + 'L' + (32 + Math.cos(a + w) * 13).toFixed(1) + ' ' + (32 + Math.sin(a + w) * 13).toFixed(1) + 'Z" fill="' + GOLD[0] + '" opacity=".85"/>'; }
    return '<circle cx="32" cy="32" r="27" fill="#FFE27A" opacity=".22"/>' + r + '<circle cx="32" cy="32" r="14" fill="#FFE59A" stroke="' + GOLD[1] + '" stroke-width="1.8"/><circle cx="32" cy="32" r="9" fill="#FFF6D6"/>' + shine(27.5, 27.5, 0.6, '#fff'); },
  /* the stars of a titan: three gold stars and their sparkle */
  stars: () => '<path d="' + ART_STAR(25, 30, 17, 7.4) + '" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="1.9"' + ART_OL + '/><path d="' + ART_STAR(49, 17, 9.5, 4.2) + '" fill="#FFE07A" stroke="' + GOLD[1] + '" stroke-width="1.6"' + ART_OL + '/>' +
    '<path d="' + ART_STAR(48, 46, 11, 4.8) + '" fill="' + GOLD[0] + '" stroke="' + GOLD[1] + '" stroke-width="1.7"' + ART_OL + '/><path d="M18 24L22 21" stroke="#fff" stroke-width="2.2" opacity=".7"' + ART_OL + '/>' + shine(9, 52, 0.7) + shine(57, 31, 0.5),
};
const gearSVG = (k) => artSvg('gear g-' + k, (GEAR_ART[k] || GEAR_ART.medal)());
/* what a station of the road holds, drawn: the medal of a rank, the gear, or the box */
const stationArt = (st) => (st.rank > 0 ? medalSVG(st.rank) : st.gear ? gearSVG(st.gear.k) : boxSVG(Math.max(0, st.box)));

/* ---- the sights of the sky, one for each part of the road: a balloon in the blue, a paper plane, the low sun of the evening,
   the moon of the night and a ringed planet at the top ---- */
const SKY_ART = [
  () => '<path d="M32 4C17 4 10 15 10 25C10 37 24 43 28 48H36C40 43 54 37 54 25C54 15 47 4 32 4Z" fill="#FF6B6B" stroke="#B83A3A" stroke-width="1.6"' + ART_OL + '/>' +
    '<path d="M32 4C26 8 23 16 23 25C23 35 27 43 29 48H35C37 43 41 35 41 25C41 16 38 8 32 4Z" fill="#FFF3E0" stroke="#B83A3A" stroke-width="1.2"' + ART_OL + '/><path d="M32 4V48" stroke="#B83A3A" stroke-width="1.2"/>' +
    '<path d="M28 48L27 53M36 48L37 53" stroke="#7A5233" stroke-width="1.3"/><rect x="25" y="53" width="14" height="9" rx="2" fill="#B5814F" stroke="#7A5233" stroke-width="1.4"/><path d="M15 17Q17 11 23 8" stroke="#fff" stroke-width="2.4" fill="none" opacity=".6"' + ART_OL + '/>',
  () => '<path d="M4 34L60 12L30 50Z" fill="#fff" stroke="#9AA6C4" stroke-width="1.5"' + ART_OL + '/><path d="M60 12L24 38L30 50Z" fill="#DCE3F3" stroke="#9AA6C4" stroke-width="1.5"' + ART_OL + '/><path d="M60 12L24 38L18 42Z" fill="#C2CCE6" stroke="#9AA6C4" stroke-width="1.2"' + ART_OL + '/>',
  () => '<circle cx="32" cy="32" r="30" fill="#FFE29A" opacity=".35"/><circle cx="32" cy="32" r="22" fill="#FFC75A" opacity=".55"/><circle cx="32" cy="32" r="16" fill="#FFB238"/><path d="M22 27A11 11 0 0 1 30 20" stroke="#FFF1C9" stroke-width="2.4" fill="none"' + ART_OL + '/>',
  () => '<circle cx="34" cy="32" r="28" fill="#FFF3C4" opacity=".12"/><path d="M38 6A26 26 0 1 0 58 44A20 20 0 1 1 38 6Z" fill="#FFF0B8" stroke="#E2CB7A" stroke-width="1.4"' + ART_OL + '/><circle cx="22" cy="38" r="3.2" fill="#E9D79A"/><circle cx="30" cy="50" r="2.2" fill="#E9D79A"/><circle cx="17" cy="24" r="2" fill="#E9D79A"/>',
  () => '<circle cx="32" cy="32" r="16" fill="#FF8FB8" stroke="#B2457A" stroke-width="1.6"/><path d="M18 26Q32 31 46 25M17 35Q32 40 47 34" stroke="#E46A9A" stroke-width="2.4" fill="none"' + ART_OL + '/>' +
    '<ellipse cx="32" cy="34" rx="29" ry="8" fill="none" stroke="#FFD76A" stroke-width="3" transform="rotate(-14 32 34)"/>' + shine(8, 10, 0.6, '#fff') + shine(56, 54, 0.5, '#fff'),
];
const skyArt = (k) => artSvg('sky-art a' + k, SKY_ART[k % SKY_ART.length]());

/* ---- the flame of the streak: a living fire with a face and a purple headband, the friend of the weeks in a row ---- */
const FLAME_SVG = '<svg class="flm" viewBox="0 0 120 140" aria-hidden="true">' +
  '<ellipse cx="60" cy="132" rx="34" ry="6" fill="rgb(120 40 0 / .25)"/>' +
  '<g class="flm-b"><path d="M60 6Q72 26 86 30Q84 18 92 12Q108 40 106 74Q104 112 60 128Q16 112 14 74Q13 50 26 36Q30 50 38 52Q34 26 60 6Z" fill="#FF6A00" stroke="#1B1035" stroke-width="4" stroke-linejoin="round"/>' +
  '<path d="M60 38Q70 54 80 56Q86 70 84 86Q82 112 60 118Q38 112 36 86Q35 70 44 60Q48 68 54 66Q52 52 60 38Z" fill="#FFC21F"/>' +
  '<path d="M60 70Q68 82 72 92Q72 108 60 110Q48 108 48 94Q50 82 60 70Z" fill="#FFF1A8"/>' +
  '<path d="M20 60Q60 44 100 60L99 70Q60 54 21 70Z" fill="#8B4DF0" stroke="#1B1035" stroke-width="3" stroke-linejoin="round"/><path d="M98 62L112 54L110 68Z" fill="#8B4DF0" stroke="#1B1035" stroke-width="3" stroke-linejoin="round"/>' +
  '<g class="flm-eyes"><ellipse cx="46" cy="82" rx="6" ry="8" fill="#1B1035"/><ellipse cx="74" cy="82" rx="6" ry="8" fill="#1B1035"/><circle cx="48" cy="79" r="2.2" fill="#fff"/><circle cx="76" cy="79" r="2.2" fill="#fff"/></g>' +
  '<path d="M37 72L53 76M83 72L67 76" stroke="#1B1035" stroke-width="3.6" stroke-linecap="round"/>' +
  '<path d="M50 96Q60 106 70 96" fill="#B3261E" stroke="#1B1035" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></g>' +
  shine(16, 26, 1.1, '#FFF3B0') + shine(104, 22, 0.9, '#FFF3B0') + '</svg>';
/* ---- the small pictures of the app, drawn like the things of the road, not as line icons (owner, 17 Nov):
   all in the purple of gymi, a dark outline, a lighter purple for the second part and a white detail. 48 by 48 ---- */
const AI_P = '#6D3FE0', AI_L = '#9B7BF6', AI_X = '#CBB9FF', AI_D = '#3B1E96', AI_W = '#FFFFFF';
const aiP = (d, c, w) => '<path d="' + d + '" fill="' + c + '" stroke="' + AI_D + '" stroke-width="' + (w || 2) + '"' + ART_OL + '/>';
const aiR = (x, y, w, h, r, c) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + c + '" stroke="' + AI_D + '" stroke-width="2"/>';
const aiC = (x, y, r, c) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '" stroke="' + AI_D + '" stroke-width="2"/>';
const aiW = (d, w, c) => '<path d="' + d + '" fill="none" stroke="' + (c || AI_W) + '" stroke-width="' + (w || 2.6) + '" opacity="' + (c ? 1 : 0.8) + '"' + ART_OL + '/>';
const aiF = (d, c) => '<path d="' + d + '" fill="' + (c || AI_W) + '" stroke="none"/>';
const aiBell = (y, k) => { const s = k || 1, t = (v) => +(v * s).toFixed(1); return '<g transform="translate(' + t(24 - 24) + ' 0)">' + aiR(4, y - 6, 6, 12, 2, AI_L) + aiR(9, y - 11, 7, 22, 3, AI_P) + aiR(16, y - 3, 16, 6, 2, AI_X) + aiR(32, y - 11, 7, 22, 3, AI_P) + aiR(38, y - 6, 6, 12, 2, AI_L) + aiW('M12.5 ' + (y - 7) + 'v8') + aiW('M35.5 ' + (y - 7) + 'v8') + '</g>'; };
const aiHouse = (inner) => aiP('M6 22L24 7l18 15v20c0 1-1 2-2 2H8c-1 0-2-1-2-2z', AI_L) + aiP('M3 23L24 5l21 18', 'none', 3.4) + inner;
const AI = {
  arm: () => aiP('M4 33C6 19 24 14 30 22V16c-3-1-3-7 0-10s11-3 13 1 1 8-1 10v21c0 4-3 6-6 6H8c-3 0-4-2-4-5z', AI_P) + aiW('M33 11h6M33 15h5', 2, AI_D) + aiW('M10 29c3-5 9-7 14-6') + aiW('M34 25v12', 2.4, AI_L),
  bell: () => aiBell(24),
  bolt: () => aiP('M28 3L9 27h12l-3 18 21-26H27z', AI_P) + aiW('M25 9l-9 14'),
  flame: () => aiP('M24 3c2 8 15 12 15 26a15 15 0 0 1-30 0c0-6 3-11 8-14 0 4 2 7 5 8-1-8 0-14 2-20z', AI_P) + aiP('M24 24c3 4 8 6 8 12a8 8 0 0 1-16 0c0-3 2-6 4-8 0 2 1 4 3 5 0-3 0-6 1-9z', AI_X),
  heart: () => aiP('M24 42S6 31 6 18a9.5 9.5 0 0 1 18-4.5A9.5 9.5 0 0 1 42 18c0 13-18 24-18 24z', AI_P) + aiW('M12 17a6 6 0 0 1 5-5'),
  shoe: () => aiP('M5 33v-4c0-2 1-4 3-4l8-2 5-9c1-2 3-2 4-1l2 1 2 6 7 4c6 1 9 3 9 7v2H5z', AI_P) + aiR(4, 33, 40, 7, 3.5, AI_X) + aiW('M22 21l-3 2M25 25l-3 2'),
  gym: () => aiP('M5 43V17L24 6l19 11v26z', AI_L) + aiR(17, 29, 14, 14, 2, AI_P) + aiR(11, 17, 4, 7, 1.5, AI_P) + aiR(33, 17, 4, 7, 1.5, AI_P) + aiR(15, 19, 18, 3, 1.5, AI_X) + aiW('M8 19v20'),
  park: () => aiR(3, 40, 42, 5, 2.5, AI_X) + aiR(8, 9, 5, 33, 2.5, AI_P) + aiR(35, 9, 5, 33, 2.5, AI_P) + aiR(5, 9, 38, 5, 2.5, AI_L) + aiW('M10 17v20'),
  homeBell: () => aiHouse(aiR(13, 29, 4, 9, 1.5, AI_P) + aiR(31, 29, 4, 9, 1.5, AI_P) + aiR(17, 32, 14, 3, 1.5, AI_X)),
  home: () => aiHouse(aiR(19, 29, 10, 15, 2, AI_P) + aiC(24, 21, 3.2, AI_W)),
  plates1: () => aiR(2, 22, 44, 4, 2, AI_X) + aiR(11, 13, 5, 22, 2, AI_P) + aiR(32, 13, 5, 22, 2, AI_P),
  plates2: () => aiR(2, 22, 44, 4, 2, AI_X) + aiR(6, 16, 5, 16, 2, AI_L) + aiR(11, 11, 5, 26, 2, AI_P) + aiR(32, 11, 5, 26, 2, AI_P) + aiR(37, 16, 5, 16, 2, AI_L),
  plates3: () => aiR(1, 22, 46, 4, 2, AI_X) + aiR(3, 18, 4, 12, 2, AI_X) + aiR(7, 14, 5, 20, 2, AI_L) + aiR(12, 9, 5, 30, 2, AI_P) + aiR(31, 9, 5, 30, 2, AI_P) + aiR(36, 14, 5, 20, 2, AI_L) + aiR(41, 18, 4, 12, 2, AI_X),
  crown: () => aiP('M7 35L4 13l12 9 8-14 8 14 12-9-3 22z', AI_P) + aiR(7, 35, 34, 7, 2.5, AI_L) + aiC(24, 28, 3.4, AI_X) + aiC(4, 12, 2.6, AI_X) + aiC(24, 7, 2.6, AI_X) + aiC(44, 12, 2.6, AI_X),
  me: () => aiP('M8 43c1-10 7-15 16-15s15 5 16 15z', AI_P) + aiC(24, 16, 9, AI_L) + aiW('M19 13a5 5 0 0 1 4-3'),
  lang: () => aiC(24, 24, 18, AI_L) + aiW('M24 6c7 5 7 31 0 36M24 6c-7 5-7 31 0 36M6 24h36M9 15h30M9 33h30', 2, AI_D),
  bars: () => aiR(6, 28, 9, 15, 2.5, AI_X) + aiR(19.5, 18, 9, 25, 2.5, AI_L) + aiR(33, 7, 9, 36, 2.5, AI_P),
  goal: () => aiC(24, 24, 18, AI_P) + aiC(24, 24, 12, AI_W) + aiC(24, 24, 6, AI_P),
  time: () => aiR(20, 3, 8, 5, 2, AI_P) + aiC(24, 26, 17, AI_P) + aiC(24, 26, 12, AI_W) + aiW('M24 19v7l5 3', 3, AI_D),
  cal: () => aiR(6, 9, 36, 33, 6, AI_W) + aiP('M6 15c0-3 3-6 6-6h24c3 0 6 3 6 6v5H6z', AI_P) + aiR(14, 4, 5, 10, 2.5, AI_L) + aiR(29, 4, 5, 10, 2.5, AI_L) + aiW('M17 31l5 5 9-9', 3.4, AI_P),
  fb: () => aiP('M9 8h30c3 0 5 2 5 5v16c0 3-2 5-5 5H23l-10 8v-8H9c-3 0-5-2-5-5V13c0-3 2-5 5-5z', AI_P) + aiF('M14.5 21a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M21.5 21a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M28.5 21a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0'),
  sound: () => aiP('M6 18h8l11-9v30l-11-9H6z', AI_P) + aiW('M31 18a8 8 0 0 1 0 12M36 12a15 15 0 0 1 0 24', 3.6, AI_L),
  buzz: () => aiR(14, 4, 20, 40, 5, AI_P) + aiR(17.5, 9, 13, 26, 2.5, AI_X) + aiW('M7 17v14M41 17v14', 3.6, AI_L),
  lock: () => aiW('M15 22v-6a9 9 0 0 1 18 0v6', 5, AI_D) + aiW('M15 22v-6a9 9 0 0 1 18 0v6', 2, AI_L) + aiR(9, 21, 30, 22, 5, AI_P) + aiC(24, 30, 3.4, AI_W) + aiF('M22.5 31h3l1 6h-5z'),
  tour: () => aiC(24, 24, 18, AI_L) + aiC(24, 24, 13, AI_W) + aiP('M32 16l-5 11-11 5 5-11z', AI_P) + aiF('M22 24a2 2 0 1 0 4 0a2 2 0 1 0-4 0'),
  film: () => aiR(4, 8, 40, 28, 5, AI_P) + aiF('M20 15v14l11-7z') + aiR(16, 38, 16, 5, 2.5, AI_L),
  del: () => '<path d="M11 15h26l-2 26c0 2-2 3-4 3H17c-2 0-4-1-4-3z" fill="#E5484D" stroke="#8F1D10" stroke-width="2"' + ART_OL + '/><rect x="7" y="10" width="34" height="6" rx="3" fill="#FF8A8D" stroke="#8F1D10" stroke-width="2"/><path d="M19 10V7c0-1 1-2 2-2h6c1 0 2 1 2 2v3" fill="none" stroke="#8F1D10" stroke-width="2.4"' + ART_OL + '/>' + aiW('M20 21v17M28 21v17'),
  flag: () => aiR(8, 4, 5, 40, 2.5, AI_L) + aiP('M13 7h25l-6 9 6 9H13z', AI_P) + aiW('M17 11h14'),
  loop: () => aiW('M9 22A15 15 0 0 1 36 13', 5.4, AI_P) + aiP('M40 5v12H28z', AI_P) + aiW('M39 26A15 15 0 0 1 12 35', 5.4, AI_L) + aiP('M8 43V31h12z', AI_L),
  cup: () => aiW('M13 11H7c0 7 3 10 8 10M35 11h6c0 7-3 10-8 10', 3.4, AI_L) + aiP('M13 6h22v11a11 11 0 0 1-22 0z', AI_P) + aiR(21, 27, 6, 8, 1.5, AI_L) + aiR(13, 34, 22, 8, 2.5, AI_P) + aiW('M18 10v7'),
  star: () => aiP(ART_STAR(24, 25, 20, 9), AI_P) + aiW('M18 16l-3 1'),
  gift: () => aiR(8, 20, 32, 23, 3, AI_P) + aiR(5, 13, 38, 9, 3, AI_L) + aiR(21, 13, 6, 30, 0, AI_X) + aiP('M24 13c-3-6-10-8-11-4s6 4 11 4zM24 13c3-6 10-8 11-4s-6 4-11 4z', AI_L),
  pen: () => aiP('M8 40l2-9L31 10a4.5 4.5 0 0 1 7 7L17 38z', AI_P) + aiP('M8 40l2-9 7 7z', AI_X) + aiW('M27 14l7 7', 2, AI_D) + aiW('M14 29l11-11'),
  gear: () => [0, 45, 90, 135, 180, 225, 270, 315].map((a) => '<rect x="20.5" y="3" width="7" height="10" rx="2" fill="' + AI_P + '" stroke="' + AI_D + '" stroke-width="2" transform="rotate(' + a + ' 24 24)"/>').join('') + '<circle cx="24" cy="24" r="14" fill="' + AI_P + '"/>' + aiC(24, 24, 6, AI_W),
  swap: () => aiP('M6 13h23V7l12 10-12 10v-6H6z', AI_P) + aiP('M42 35H19v6L7 31l12-10v6h23z', AI_L),
  camera: () => aiP('M15 13l3-5h12l3 5z', AI_L) + aiR(4, 13, 40, 28, 5, AI_P) + aiC(24, 27, 9, AI_W) + aiC(24, 27, 5, AI_L),
  info: () => aiC(24, 24, 19, AI_P) + aiF('M21.5 22a2.5 2.5 0 0 1 5 0v12a2.5 2.5 0 0 1-5 0zM21 15a3 3 0 1 0 6 0a3 3 0 1 0-6 0'),
};
/* one of them; an unknown name draws nothing */
const artIc = (k) => (AI[k] ? '<svg class="ai" viewBox="0 0 48 48" aria-hidden="true">' + AI[k]() + '</svg>' : '');
