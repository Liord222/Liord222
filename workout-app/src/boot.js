/* ================================================================== boot */
let booted = false;
function boot(data) {
  if (booted) return; booted = true;
  data = data || {};
  document.documentElement.lang = 'he'; document.documentElement.dir = 'rtl';
  const d = loadLocal();
  if (d.sessions) S.sessions = d.sessions;
  if (typeof d.sound === 'boolean') S.sound = d.sound;
  if (Array.isArray(d.dirty)) S.dirty = new Set(d.dirty);
  if (Array.isArray(d.gone)) S.gone = new Set(d.gone);
  sweep();
  S.tab = typeof data.tab === 'number' && data.tab >= 0 && data.tab < 4 ? data.tab : nextUp().next;
  if (Array.isArray(data.msgs)) chat.msgs = data.msgs;
  if (Array.isArray(data.turns)) chat.turns = data.turns;
  readColors(); wireApp(); wireChat(); renderAll(); initChat();
  const s = live(S.tab), first = (data.open && wkOf(data.open) === S.tab && findEx(data.open)) || PLAN[S.tab].ex.find((e) => firstUndone(s, e) >= 0) || PLAN[S.tab].ex[0];
  if (first) { openEx(first.id, false); renderDock(); }
  initCloud(onRemoteChange);
  if (window.claude && typeof window.claude.use === 'function') window.claude.use('downloads').then((dl) => { if (dl) { S.dl = dl; renderHistory(); } }).catch(() => {});
}
(function () {
  const hot = window.claude && window.claude.hot;
  try { if (hot && typeof hot.snapshot === 'function') hot.snapshot(() => ({ tab: S.tab, open: S.open, turns: chat.turns.slice(-16), msgs: chat.msgs.filter((m) => !m.live).slice(-24).map((m) => ({ role: m.role, text: m.text, hadImg: !!m.hadImg, ctx: m.ctx || '', note: m.note || '' })) })); } catch (e) { /* no live update here */ }
  try { if (hot && typeof hot.ready === 'function') { hot.ready(boot); setTimeout(() => boot({}), 1200); } else boot((hot && hot.data) || {}); } catch (e) { boot({}); }
})();
