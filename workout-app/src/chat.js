/* ================================================================== chat with the coach ("אילון", answered by Claude) */
const chat = { msgs: [], turns: [], busy: false, ctl: null, img: null, imgUrl: '', sampleP: null, off: '', canImg: false };
/* the plan as it stands today: swaps, this week's set counts and how close to failure the week asks to go */
function planText() {
  return PLAN.map((w, i) => { const s = live(i), P = phase(i, s); return 'אימון ' + (i + 1) + ' – ' + w.name + (P.m ? ' (' + (P.dl ? 'שבוע דילואד' : 'שבוע ' + P.wk + ' מתוך ' + S.cfg.weeks + ' במזוציקל') + ', ' + rirText(P.rir) + ')' : '') + ':\n' + exList(i, s).map((e, j) => (j + 1) + '. [' + e.id + '] ' + e.name + ': ' + e.n0 + ' סטים × ' + e.reps + (e.suf ? ' ' + e.suf : '') + ' חזרות | מנוחה ' + restPlain(e)).join('\n'); }).join('\n\n');
}
const rules = () => 'אתה אילון, המאמן האישי בתוך gymi, אפליקציית האימונים של המשתמש. אתה עוזר AI (מבוסס Claude), ואם שואלים אותך על כך אתה אומר זאת בפשטות. ענה תמיד בעברית, בגובה העיניים, קצר וענייני (עד כ-120 מילים, אלא אם ביקשו פירוט).\n\n' +
  'התוכנית של המשתמש (Upper/Lower, ארבעה אימונים שמתבצעים במחזור לפי הסדר). בסוגריים המרובעים מופיע מזהה התרגיל:\n\n' + planText() + '\n\n' +
  'כללים:\n' +
  '- כששואלים אם תרגיל או מכשיר יכול להחליף תרגיל מהתוכנית, השורה הראשונה בתשובה היא בדיוק אחת מאלה: "פסיקה: מתאים", "פסיקה: מתאים חלקית" או "פסיקה: לא מומלץ". אחריה הסבר קצר (שרירי מטרה ודפוס תנועה), איך להתאים סטים, חזרות, מנוחה וקרבה לכשל, ודגש ביצוע אחד.\n' +
  '- בשאלות אחרות (טכניקה, משקל התחלתי, התקדמות) ענה ישר, בלי שורת פסיקה. כשיש בהקשר נתוני ביצוע קודמים, התבסס עליהם.\n' +
  '- אם צורפה תמונה, פתח את ההסבר בזיהוי של המכשיר או התרגיל שרואים בה ("בתמונה: ..."), כי בהודעות ההמשך התמונה כבר לא תהיה זמינה לך. אם התמונה לא ברורה, אמור מה אתה כן רואה ובקש צילום מזווית אחרת. אם נאמר שצורפה תמונה אבל היא לא הגיעה אליך, בקש לצרף אותה שוב.\n' +
  '- רישום סטים: כשהמשתמש מבקש לרשום סטים שעשה (למשל "רשום 60 קילו, 8 8 7" או "עשיתי 3 סטים של 12 בלי משקל"), אשר במשפט אחד מה נרשם, ובסוף התשובה הוסף שורה נפרדת בדיוק בפורמט הזה:\n' +
  '@@LOG {"ex":"<מזהה התרגיל>","sets":[[<משקל בק״ג או null>,<חזרות>],...]}\n' +
  '  השתמש בתרגיל שבהקשר אם לא צוין תרגיל אחר. אל תוסיף את השורה אם לא ביקשו לרשום, או אם חסר מספר החזרות (במקרה כזה שאל). אל תזכיר את השורה הזאת בטקסט.\n' +
  '- כשאין תחליף מדויק, הצע חלופה אחת או שתיים שנפוצות בחדרי כושר.\n' +
  '- שמור על כוונת התוכנית: אותה קבוצת שרירים, אותו טווח חזרות ואותה קרבה לכשל.\n' +
  '- האפליקציה מנהלת מזוציקל: כל שבוע מתקרבים בחזרה אחת לכשל, והשבוע האחרון הוא דילואד. היא קובעת יעד לכל סט (יותר חזרות או יותר משקל) ומאפשרת להחליף תרגיל בכפתור "החלף תרגיל" לתרגיל באותו דפוס תנועה. כששואלים על יעד, משקל או עצימות, התבסס על הנתונים שבהקשר.\n' +
  '- אין לך מידע רפואי על המשתמש. אם מוזכרים כאב או פציעה, המלץ להפסיק את התרגיל ולהתייעץ עם איש מקצוע.\n' +
  '- טקסט פשוט בלבד, בלי טבלאות ובלי כותרות. אפשר שורות קצרות שמתחילות ב-"• ".';
const ERR = {
  not_granted: 'לא אישרת לאילון לענות בדף הזה, ולכן הצ׳אט כבוי כרגע. אפשר לשנות את זה בהרשאות של הדף.',
  sampling_disabled: 'Claude לא זמין בחשבון הזה, ולכן הצ׳אט כבוי.',
  rate_limited: 'הגעת למגבלת השימוש כרגע. נסה שוב בעוד כמה דקות.',
  session_expired: 'ההתחברות פגה. התחבר מחדש ל-Claude ונסה שוב.',
  image_rejected: 'לא הצלחתי לשלוח את התמונה. נסה לצלם שוב או לבחור תמונה אחרת.',
  images_unavailable: 'אי אפשר לשלוח תמונות בתצוגה הזאת. תאר את המכשיר במילים.',
  refused: 'אילון לא ענה על השאלה הזאת. נסה לנסח אותה אחרת.',
  empty_completion: 'לא התקבלה תשובה. נסה לנסח את השאלה בקצרה.',
  prompt_too_large: 'השיחה ארוכה מדי. פתח שיחה חדשה ונסה שוב.',
  upstream_error: 'התקשורת נקטעה. נסה לשלוח שוב.',
};
const HIDE = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];
const stripCmd = (t) => t.replace(/^[ \t]*@@.*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
function splitVerdict(text, final) {
  const m = text.match(/^\s*(?:פסיקה\s*[:\-–]\s*)?(מתאים חלקית|לא מומלץ|מתאים)\s*[.!]?\s*(\n|$)/);
  if (!m || (!final && !m[2])) return null;
  return { kind: m[1] === 'מתאים' ? 'ok' : m[1] === 'מתאים חלקית' ? 'mid' : 'no', label: m[1], rest: text.slice(m[0].length) };
}
function fmtText(text) {
  let html = '', list = false;
  for (const raw of esc(text).split('\n')) {
    const ln = raw.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/^#+\s*/, '').replace(/\d+(?:[.,]\d+)?(?:\s?[–\-×xX]\s?\d+(?:[.,]\d+)?)+/g, '<bdi dir="ltr">$&</bdi>'), m = ln.match(/^\s*[•\-*]\s+(.*)$/);
    if (m) { if (!list) { html += '<ul>'; list = true; } html += '<li>' + m[1] + '</li>'; continue; }
    if (list) { html += '</ul>'; list = false; }
    if (ln.trim()) html += '<p>' + ln + '</p>';
  }
  return html + (list ? '</ul>' : '');
}
function msgHTML(m, idx) {
  if (m.role === 'u') return '<div class="msg u" dir="auto">' + (m.imgUrl ? '<img src="' + m.imgUrl + '" alt="התמונה ששלחת">' : m.hadImg ? '<span class="note">[תמונה]</span>' : '') + esc(m.text) + (m.ctx ? '<span class="note">לגבי ' + esc(m.ctx) + '</span>' : '') + '</div>';
  const text = stripCmd(m.text || '');
  if (!text) return '<div class="msg a"><span class="think">' + (m.live ? 'אילון חושב…' : 'נרשם.') + '</span>' + loggedHTML(m, idx) + '</div>';
  const v = splitVerdict(text, !m.live);
  return '<div class="msg a" dir="auto">' + (v ? '<span class="verdict ' + v.kind + '">' + v.label + '</span>' + fmtText(v.rest) : fmtText(text)) + (m.note ? '<span class="note">' + esc(m.note) + '</span>' : '') + loggedHTML(m, idx) + '</div>';
}
function loggedHTML(m, idx) {
  if (!m.logged) return '';
  if (m.logged.undone) return '<div class="logged" style="color:var(--ink-3)">הרישום בוטל</div>';
  return '<div class="logged"><span>' + (m.logged.idx.length === 1 ? 'נרשם סט אחד' : 'נרשמו ' + m.logged.idx.length + ' סטים') + ' · ' + Ltr(esc(m.logged.name)) + '</span><button class="link" type="button" data-unlog="' + idx + '">בטל</button></div>';
}
const SUGS = ['המכשיר תפוס. מה אפשר לעשות במקום?', 'צילמתי מכשיר אחר. הוא מתאים כתחליף?', 'תן לי דגשי ביצוע לתרגיל הזה', 'כמה משקל כדאי לי לשים היום?'];
function renderMsgs() {
  const box = $('#msgs');
  if (chat.off) { box.innerHTML = '<div class="empty"><strong>הצ׳אט לא זמין כרגע</strong><span>' + esc(chat.off) + '</span></div>'; return; }
  if (!chat.msgs.length) {
    box.innerHTML = '<div class="empty"><strong>היי, אני אילון. מה צריך?</strong><span>צלם מכשיר או כתוב שם של תרגיל, ואגיד לך אם הוא מחליף טוב את מה שבתוכנית. אפשר גם לכתוב לי מה עשית, למשל "60 קילו, 8 8 7", ואני ארשום את הסטים.</span><div class="sugs">' +
      SUGS.map((s, i) => '<button class="sug" type="button" data-sug="' + i + '">' + s + '</button>').join('') + '</div></div>';
    return;
  }
  box.innerHTML = chat.msgs.map(msgHTML).join(''); box.scrollTop = box.scrollHeight;
}
function paintLast() {
  const box = $('#msgs'), el = box.lastElementChild, stick = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  if (el) el.outerHTML = msgHTML(chat.msgs[chat.msgs.length - 1], chat.msgs.length - 1);
  if (stick) box.scrollTop = box.scrollHeight;
}
function setBusy(on) { chat.busy = on; const b = $('#sendBtn'); b.innerHTML = on ? ICON.stop : ICON.send; b.setAttribute('aria-label', on ? 'עצור' : 'שלח'); }
function compNote(t) { const n = $('#compNote'); n.textContent = t || ''; n.hidden = !t; }
function setAttach(blob) {
  if (chat.imgUrl && !chat.msgs.some((m) => m.imgUrl === chat.imgUrl)) URL.revokeObjectURL(chat.imgUrl);
  chat.img = blob || null; chat.imgUrl = blob ? URL.createObjectURL(blob) : '';
  $('#attach').hidden = !blob; if (blob) $('#attachImg').src = chat.imgUrl;
}
async function pickImage(file) {
  if (!file) return;
  compNote('');
  try {
    let src = null;
    if (window.createImageBitmap) { try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { src = null; } }
    if (!src) src = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); });
    const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight, k = Math.min(1, 1600 / Math.max(w, h)), cv = document.createElement('canvas');
    cv.width = Math.round(w * k); cv.height = Math.round(h * k); cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
    const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.86));
    if (!blob) throw new Error('encode');
    setAttach(blob); $('#chatInput').focus();
  } catch (e) { compNote('לא הצלחתי לקרוא את התמונה. נסה לצלם שוב או לבחור קובץ JPG או PNG.'); }
}
/* what the page knows, sent with each question: the open workout, the exercise in question and its recent log */
function ctxLine() {
  const id = $('#chatCtx').value, e = id && findEx(id);
  let t = '[הקשר מהאפליקציה. האימון הפתוח כרגע: אימון ' + (S.tab + 1) + ' · ' + PLAN[S.tab].name + '.';
  if (e) {
    const w = wkOf(id);
    const cur = live(w), rir = rirOf(e, cur), fu = firstUndone(cur, e), T = fu >= 0 ? targetOf(e, fu, cur) : null, pe = planEx(id);
    t += ' השאלה מתייחסת לתרגיל [' + e.id + '] "' + e.name + '" (אימון ' + (w + 1) + '): ' + e.n0 + ' סטים × ' + e.reps + (e.suf ? ' ' + e.suf : '') + ' חזרות, מנוחה ' + restPlain(e) + (rir == null ? '' : ', ' + rirText(rir)) + '.';
    if (T) t += ' היעד לסט הבא (סט ' + (fu + 1) + '): ' + fmtRow(T) + '.';
    const hist = sorted().filter((s) => s.w === w && moveOf(pe, s) === e.mv && rowsOf(s, id).some(isDone)).slice(0, 3);
    if (hist.length) t += ' ביצועים אחרונים (ק״ג×חזרות): ' + hist.map((s) => (s.end ? ago(s.ts) : 'באימון הנוכחי') + ': ' + rowsOf(s, id).filter(isDone).map(fmtRow).join(', ')).join(' | ') + '.';
    else t += ' עוד אין רישום קודם לתרגיל הזה.';
  }
  return { text: t + ']', name: e ? e.name : '' };
}
/* a reply may carry one "@@LOG {...}" line: sets to write into today's log */
function applyLog(text) {
  const m = text.match(/^[ \t]*@@LOG\s*(\{.*\})\s*$/m); if (!m) return null;
  let o; try { o = JSON.parse(m[1]); } catch (e) { return null; }
  const e = o && findEx(String(o.ex || '')); if (!e || !Array.isArray(o.sets)) return null;
  const w = wkOf(e.id), idx = [];
  for (const p of o.sets) {
    if (!Array.isArray(p)) continue;
    const s = ensure(w), i = firstUndone(s, e), kg = p[0] == null ? null : num(p[0]), reps = num(p[1], true);
    if (i < 0) break;
    if (reps == null || reps < 1 || reps > 200 || (kg != null && kg > 1000)) continue;
    writeRow(e, i, kg, reps); idx.push(i);
  }
  if (!idx.length) return null;
  S.touched = true; if (w === S.tab) { S.draft = null; if (rest.on) { clearInterval(rest.iv); rest.on = false; rest.last = null; } }
  renderAll(); keepAwake();
  return { ex: e.id, name: e.name, idx };
}
function undoLog(i) {
  const m = chat.msgs[i], e = m && m.logged && findEx(m.logged.ex); if (!e || m.logged.undone) return;
  for (const k of m.logged.idx) clearRow(e, k);
  m.logged.undone = true; S.edit = null; renderAll(); renderMsgs();
}
async function sendChat(preset) {
  if (chat.busy) { if (chat.ctl) chat.ctl.abort(); return; }
  if (chat.off) return;
  const inp = $('#chatInput'), typed = (preset || inp.value).trim(), img = chat.img, imgUrl = chat.imgUrl;
  if (!typed && !img) { inp.focus(); return; }
  const text = typed || 'מה המכשיר שבתמונה, והאם הוא מתאים כתחליף?', ctx = ctxLine();
  compNote(''); setBusy(true);
  chat.msgs.push({ role: 'u', text, imgUrl: img ? imgUrl : '', hadImg: !!img, ctx: ctx.name });
  const reply = { role: 'a', text: '', live: true }; chat.msgs.push(reply);
  chat.turns.push({ role: 'user', content: ctx.text + '\n\n' + text + (img ? '\n\n[להודעה הזאת צורפה תמונה אחת]' : '') });
  inp.value = ''; inp.style.height = ''; chat.img = null; chat.imgUrl = ''; $('#attach').hidden = true;
  renderMsgs();
  const undo = () => { chat.turns.pop(); chat.msgs.splice(chat.msgs.length - 2, 2); inp.value = typed; if (img) { chat.img = img; chat.imgUrl = imgUrl; $('#attach').hidden = false; $('#attachImg').src = imgUrl; } renderMsgs(); };
  let sample = null;
  try { sample = await chat.sampleP; } catch (e) { sample = null; }
  if (!sample) { undo(); chat.off = 'הצ׳אט פועל רק כשהדף פתוח בתוך Claude.'; renderMsgs(); setBusy(false); return; }
  chat.ctl = new AbortController();
  try {
    const opts = { cache: false, signal: chat.ctl.signal, onText: (u) => { reply.text = u.text; paintLast(); } };
    if (img) opts.images = [img];
    const res = await sample([{ role: 'user', content: rules() }].concat(chat.turns.slice(-16)), opts);
    reply.text = res.text; reply.live = false; if (res.truncated) reply.note = 'התשובה נקטעה באמצע. בקש המשך או שאל שאלה קצרה יותר.';
    chat.turns.push({ role: 'assistant', content: res.text });
    const lg = res.truncated ? null : applyLog(res.text); if (lg) reply.logged = lg;
    renderMsgs();
  } catch (e) {
    const code = (e && e.code) || 'upstream_error', part = e && e.text && stripCmd(e.text);
    if (HIDE.includes(code)) { undo(); chat.off = ERR[code] || 'הצ׳אט לא זמין בתצוגה הזאת.'; renderMsgs(); }
    else if (part && code !== 'refused') { reply.text = part; reply.live = false; reply.note = code === 'cancelled' ? 'עצרת את התשובה.' : ERR[code] || ERR.upstream_error; chat.turns.push({ role: 'assistant', content: part }); paintLast(); }
    else { undo(); if (code !== 'cancelled') compNote(ERR[code] || ERR.upstream_error); if (code === 'images_unavailable') { chat.canImg = false; showImgBtns(); setAttach(null); } }
  } finally { chat.ctl = null; setBusy(false); }
}
function showImgBtns() { $('#camBtn').hidden = $('#galBtn').hidden = !chat.canImg; }
/* the exercise picker follows the plan as it stands (swapped movements show under their own name) */
function fillCtx() {
  const sel = $('#chatCtx'), v = sel.value;
  sel.innerHTML = '<option value="">כל התוכנית (שאלה כללית)</option>' + PLAN.map((w, i) => '<optgroup label="אימון ' + (i + 1) + ' · ' + w.name + '">' + exList(i).map((e) => '<option value="' + e.id + '">' + esc(e.name) + '</option>').join('') + '</optgroup>').join('');
  sel.value = v;
}
function initChat() {
  fillCtx();
  if (!window.claude || typeof window.claude.use !== 'function') { chat.sampleP = Promise.resolve(null); chat.off = 'הצ׳אט פועל רק כשהדף פתוח בתוך Claude.'; renderMsgs(); return; }
  chat.sampleP = window.claude.use('sample');
  chat.sampleP.then(async (sample) => {
    if (!sample) { chat.off = 'הצ׳אט לא זמין בתצוגה הזאת.'; renderMsgs(); return; }
    try { const lim = await sample.limits(); chat.canImg = !!(lim && lim.images); } catch (e) { chat.canImg = false; }
    showImgBtns();
    if (!chat.canImg) $('#chatInput').placeholder = 'כתוב שם של מכשיר או תרגיל חלופי';
  }).catch(() => {});
  renderMsgs();
}
function openChat(exId) {
  fillCtx();
  if (exId) $('#chatCtx').value = exId;
  $('#chat').classList.add('open'); $('#app').classList.add('chat-on');
  if (!matchMedia('(min-width:1000px)').matches) document.body.style.overflow = 'hidden'; else $('#chatInput').focus();
}
function closeChat() { $('#chat').classList.remove('open'); $('#app').classList.remove('chat-on'); document.body.style.overflow = ''; }
function wireChat() {
  $('#chatOpen').addEventListener('click', () => openChat(S.view === 'workout' ? S.open : null));
  $('#chatClose').addEventListener('click', closeChat);
  $('#chatNew').addEventListener('click', () => { if (chat.ctl) chat.ctl.abort(); chat.msgs = []; chat.turns = []; setAttach(null); compNote(''); renderMsgs(); });
  $('#sendBtn').addEventListener('click', () => sendChat());
  const inp = $('#chatInput');
  inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); sendChat(); } });
  inp.addEventListener('input', () => { inp.style.height = 'auto'; inp.style.height = Math.min(120, inp.scrollHeight + 2) + 'px'; });
  $('#msgs').addEventListener('click', (ev) => {
    const b = ev.target.closest('.sug'); if (b) { sendChat(SUGS[+b.dataset.sug]); return; }
    const u = ev.target.closest('[data-unlog]'); if (u) undoLog(+u.dataset.unlog);
  });
  $('#camBtn').addEventListener('click', () => $('#camFile').click());
  $('#galBtn').addEventListener('click', () => $('#galFile').click());
  for (const id of ['#camFile', '#galFile']) $(id).addEventListener('change', (ev) => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; pickImage(f); });
  $('#attachX').addEventListener('click', () => setAttach(null));
}
