/* ================================================================== drawings
   The things of the game drawn as themselves, not as icons: the box of each rarity, every piece of gear that the
   road gives, and the sights of the sky the road climbs through. Each is one small SVG with a dark outline, in the
   manner of the character (avatar.js). Flat fills only: a gradient would need an id of its own in the page */
const ART_OL = ' stroke-linejoin="round" stroke-linecap="round"';
const artSvg = (cls, body, vb) => '<svg class="' + cls + '" viewBox="' + (vb || '0 0 64 64') + '" aria-hidden="true">' + body + '</svg>';
const shine = (x, y, k, c) => '<path transform="translate(' + x + ' ' + y + ') scale(' + k + ')" d="M0-6Q0 0 6 0Q0 0 0 6Q0 0-6 0Q0 0 0-6Z" fill="' + (c || '#FFF3B0') + '"/>';
const ART_STAR = (x, y, R, r) => { let q = ''; for (let k = 0; k < 10; k++) { const a = ((-90 + k * 36) * Math.PI) / 180, v = k % 2 ? r : R; q += (k ? 'L' : 'M') + (x + Math.cos(a) * v).toFixed(1) + ' ' + (y + Math.sin(a) * v).toFixed(1); } return q + 'Z'; };

/* ---- a box of the collection: a chest in the colour of its rarity, with metal bands and a lock. The rarer, the richer:
   gold bands from rare on, sparkles from epic on, and a glow behind the mythic and the legendary ---- */
const BOX_TRIM = [['#E9ECF2', '#8E95A3'], ['#FFD15C', '#B07A0C'], ['#FFD15C', '#B07A0C'], ['#FFD15C', '#B07A0C'], ['#FFE07A', '#B07A0C'], ['#FFFFFF', '#B9912E']];
function boxSVG(kind) {
  kind = BOXES[kind] ? kind : 0;
  const c = BOXES[kind].c, dk = tone(c, -0.38), lt = tone(c, 0.34), t = BOX_TRIM[kind], ol = ' stroke="' + dk + '" stroke-width="1.8"' + ART_OL;
  const band = (x, y, h) => '<rect x="' + x + '" y="' + y + '" width="6.5" height="' + h + '" fill="' + t[0] + '" stroke="' + t[1] + '" stroke-width="1.3"/>';
  return artSvg('bx r' + kind,
    (kind >= 4 ? '<circle cx="32" cy="33" r="30" fill="' + (kind === 5 ? '#FFE27A' : c) + '" opacity=".2"/><circle cx="32" cy="33" r="22" fill="' + (kind === 5 ? '#FFE27A' : c) + '" opacity=".18"/>' : '') +
    '<ellipse cx="32" cy="58.4" rx="25" ry="3.6" fill="rgb(0 0 0 / .2)"/>' +
    '<g class="bx-body"><path d="M8.5 31.5H55.5V52Q55.5 56.5 51 56.5H13Q8.5 56.5 8.5 52Z" fill="' + c + '"' + ol + '/>' +
    '<path d="M10 48.5H54V52Q54 55 51 55H13Q10 55 10 52Z" fill="' + dk + '" opacity=".28"/>' + band(13.5, 31.5, 25) + band(44, 31.5, 25) + '</g>' +
    '<g class="bx-lid"><path d="M6.5 32V22.5Q6.5 12 17 12H47Q57.5 12 57.5 22.5V32Z" fill="' + c + '"' + ol + '/>' +
    '<path d="M11.5 21.5Q12 16.2 17.5 16.2H46.5Q52 16.2 52.5 21.5" stroke="' + lt + '" stroke-width="3.2" fill="none"' + ART_OL + '/>' +
    band(13.5, 12, 19) + band(44, 12, 19) + '<rect x="5.5" y="29" width="53" height="5.5" rx="2.6" fill="' + t[0] + '" stroke="' + t[1] + '" stroke-width="1.3"/></g>' +
    '<path d="M26 27H38V37Q38 41.8 32 43.6Q26 41.8 26 37Z" fill="' + t[0] + '" stroke="' + t[1] + '" stroke-width="1.5"' + ART_OL + '/>' +
    (kind >= 4 ? '<path d="M32 29.6L35.4 33.4L32 38.6L28.6 33.4Z" fill="' + (kind === 5 ? '#8B4DF0' : '#FF5A7A') + '" stroke="' + t[1] + '" stroke-width="1"/><path d="M32 29.6L33.6 33.4H30.4Z" fill="#fff" opacity=".55"/>'
      : '<circle cx="32" cy="32.8" r="2.4" fill="' + dk + '"/><path d="M30.8 34.2H33.2L33.8 38.6H30.2Z" fill="' + dk + '"/>') +
    (kind >= 3 ? shine(7, 9, 0.9) + shine(57.5, 6.5, 0.7) : '') + (kind >= 5 ? shine(60, 41, 0.6) + shine(3.5, 44, 0.55) : ''));
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
