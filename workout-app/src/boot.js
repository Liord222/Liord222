/* ================================================================== boot */
let booted = false;
function boot(data) {
  if (booted) return; booted = true;
  data = data || {};
  const d = loadLocal();
  if (d.sessions) S.sessions = d.sessions;
  if (typeof d.sound === 'boolean') S.sound = d.sound;
  if (typeof d.buzz === 'boolean') S.buzz = d.buzz;
  if (Array.isArray(d.dirty)) S.dirty = new Set(d.dirty);
  if (Array.isArray(d.gone)) S.gone = new Set(d.gone);
  if (d.cfg) S.cfg = normCfg(d.cfg);
  if (d.pre && typeof d.pre === 'object') S.pre = d.pre;
  sweep();
  /* a workout that was already running before mesocycles existed joins the current one where it stands */
  for (const s of Object.values(S.sessions)) if (!s.end && !s.m) { stamp(s); touch(s, true); }
  S.tab = typeof data.tab === 'number' && data.tab >= 0 && data.tab < 4 ? data.tab : nextUp().next;
  if (Array.isArray(data.msgs)) chat.msgs = data.msgs;
  if (Array.isArray(data.turns)) chat.turns = data.turns;
  applyLang();
  readColors(); wireApp(); wireCoach(); wireChat(); wireMe(); wireOb();
  setView(['workout', 'progress', 'home', 'profile'].includes(data.view) ? data.view : nextUp().live >= 0 ? 'workout' : 'home', true);
  S.open = typeof data.open === 'string' ? data.open : null;
  renderAll(); initChat();
  initCloud(onRemoteChange);
  if (window.claude && typeof window.claude.use === 'function') window.claude.use('downloads').then((dl) => { if (dl) { S.dl = dl; renderHistory(); } }).catch(() => {});
}
(function () {
  const hot = window.claude && window.claude.hot;
  try { if (hot && typeof hot.snapshot === 'function') hot.snapshot(() => ({ view: S.view, tab: S.tab, open: S.open, turns: chat.turns.slice(-16), msgs: chat.msgs.filter((m) => !m.live).slice(-24).map((m) => ({ role: m.role, text: m.text, hadImg: !!m.hadImg, ctx: m.ctx || '', note: m.note || '' })) })); } catch (e) { /* no live update here */ }
  try { if (hot && typeof hot.ready === 'function') { hot.ready(boot); setTimeout(() => boot({}), 1200); } else boot((hot && hot.data) || {}); } catch (e) { boot({}); }
})();
