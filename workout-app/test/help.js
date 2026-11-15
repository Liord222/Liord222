// What the suites share.
/* every set that is left of the exercise on screen is logged at its target, as a lifter who does exactly what was asked would
   log them one by one; a first guess is never logged this way. The next exercise then comes up by itself */
const fillAll = (pg) => pg.evaluate(() => {
  const sh = document.querySelector('#sheet'); if (sh && !sh.hidden) closeSheet();
  let e = findEx(S.open); const s = ensure(S.tab), lv0 = S.lvl;
  for (let i = firstUndone(s, e), n = 0; i >= 0 && n < MAX_SETS; i = firstUndone(s, e), n++) { const T = targetOf(e, i, s); if (!T || T.mode === 'start') break; writeRow(e, i, T.kg, T.reps); }
  delete S.drafts[e.id]; e = findEx(e.id); afterEdit(e); renderPre(); bump(lv0);
  const list = exList(S.tab, s), nxt = list.slice(list.findIndex((x) => x.id === e.id) + 1).find((x) => firstUndone(s, x) >= 0);
  if (firstUndone(s, e) < 0 && nxt) setTimeout(() => { if (S.open === e.id) { openEx(nxt.id, true, 1); renderDock(); } }, 500);
});
module.exports = { fillAll };
