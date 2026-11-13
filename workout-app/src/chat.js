/* ================================================================== chat with the coach ("אילון", answered by Claude) */
const chat = { msgs: [], turns: [], busy: false, ctl: null, img: null, imgUrl: '', sampleP: null, off: '', canImg: false, limits: false, gen: 0 };
/* the coach has a face: the same figure as the player's, with a look of his own */
/* the coach's face: brown hair with a loose fringe, a clean chin, a stud in the ear, a light T-shirt and an open smile */
const COACH = { skin: 1, hair: 5, hairC: '#7A5232', beard: 0, shirtC: '#F3EDE0', stud: true, gear: false };
const coachFace = () => avatarSVG(COACH, 12, { bust: true, grin: true });
/* the plan as it stands today: swaps, this week's set counts and how close to failure the week asks to go */
function planText() {
  return PLAN.map((w, i) => {
    const s = live(i), P = phase(i, s);
    return wkFull(i) + (P.m ? ' (' + (P.dl ? say('שבוע קל', 'easy week') : say('שבוע ' + P.wk + ' מתוך ' + S.cfg.weeks + ' בסבב', 'week ' + P.wk + ' of ' + S.cfg.weeks + ' in the round')) + ', ' + rirText(P.rir) + ')' : '') + ':\n' +
      exList(i, s).map((e, j) => (j + 1) + '. [' + e.id + '] ' + say(e.he + ' (' + e.name + ')', e.name) + ': ' + e.n0 + say(' סטים × ', ' sets × ') + e.reps + (e.suf ? ' ' + e.suf : '') + say(' חזרות | מנוחה ', ' reps | rest ') + restPlain(e)).join('\n');
  }).join('\n\n');
}
/* what the opening screens learned about the lifter, for the coach */
function aboutUser() {
  const me = S.cfg.me, bits = [], exp = EXP()[me.exp], goal = GOALS()[me.goal];
  if (me.name) bits.push(say('שם: ', 'Name: ') + me.name);
  if (exp) bits.push(say('ניסיון בחדר כושר: ', 'Gym experience: ') + exp[0] + ' (' + exp[1] + ')');
  if (goal) bits.push(say('מטרה: ', 'Goal: ') + goal[0]);
  return bits.length ? say('על המשתמש: ', 'About the user: ') + bits.join(' · ') + say('. התאם את הטון ואת העצות לניסיון ולמטרה.', '. Fit your tone and your advice to the experience and the goal.') + '\n\n' : '';
}
const rulesHe = () => 'אתה אילון, המאמן האישי בתוך gymi, אפליקציית האימונים של המשתמש. אתה עוזר AI (מבוסס Claude), ואם שואלים אותך על כך אתה אומר זאת בפשטות. ענה תמיד בעברית, בגובה העיניים, קצר וענייני (עד כ-120 מילים, אלא אם ביקשו פירוט).\n\n' +
  'התוכנית של המשתמש (גוף עליון ותחתון, ארבעה אימונים שמתבצעים במחזור לפי הסדר). בסוגריים המרובעים מופיע מזהה התרגיל, ובסוגריים העגולים שמו באנגלית. באפליקציה התרגילים והאימונים מוצגים בעברית, אז השתמש בשמות העבריים:\n\n' + planText() + '\n\n' +
  aboutUser() + 'כללים:\n' +
  '- כששואלים אם תרגיל או מכשיר יכול להחליף תרגיל מהתוכנית, השורה הראשונה בתשובה היא בדיוק אחת מאלה: "פסיקה: מתאים", "פסיקה: מתאים חלקית" או "פסיקה: לא מומלץ". אחריה הסבר קצר (שרירי מטרה ודפוס תנועה), איך להתאים סטים, חזרות, מנוחה וקרבה לכשל, ודגש ביצוע אחד.\n' +
  '- בשאלות אחרות (טכניקה, משקל התחלתי, התקדמות) ענה ישר, בלי שורת פסיקה. כשיש בהקשר נתוני ביצוע קודמים, התבסס עליהם.\n' +
  '- אם צורפה תמונה, פתח את ההסבר בזיהוי של המכשיר או התרגיל שרואים בה ("בתמונה: ..."), כי בהודעות ההמשך התמונה כבר לא תהיה זמינה לך. אם התמונה לא ברורה, אמור מה אתה כן רואה ובקש צילום מזווית אחרת. אם נאמר שצורפה תמונה אבל היא לא הגיעה אליך, בקש לצרף אותה שוב.\n' +
  '- רישום סטים: כשהמשתמש מבקש לרשום סטים שעשה (למשל "רשום 60 קילו, 8 8 7" או "עשיתי 3 סטים של 12 בלי משקל"), אשר במשפט אחד מה נרשם, ובסוף התשובה הוסף שורה נפרדת בדיוק בפורמט הזה:\n' +
  '@@LOG {"ex":"<מזהה התרגיל>","sets":[[<משקל בק״ג או null>,<חזרות>],...]}\n' +
  '  השתמש בתרגיל שבהקשר אם לא צוין תרגיל אחר. אל תוסיף את השורה אם לא ביקשו לרשום, או אם חסר מספר החזרות (במקרה כזה שאל). אל תזכיר את השורה הזאת בטקסט.\n' +
  '- כשאין תחליף מדויק, הצע חלופה אחת או שתיים שנפוצות בחדרי כושר.\n' +
  '- שמור על כוונת התוכנית: אותה קבוצת שרירים, אותו טווח חזרות ואותה קרבה לכשל.\n' +
  '- האפליקציה מנהלת סבב אימונים של כמה שבועות: כל שבוע מתקרבים בחזרה אחת לכשל, והשבוע האחרון קל, כדי להתאושש. היא קובעת יעד לכל סט (יותר חזרות או יותר משקל) ומאפשרת להחליף כל תרגיל בכפתור "החלף תרגיל". כששואלים על יעד, משקל או עצימות, התבסס על הנתונים שבהקשר.\n' +
  '- דבר בשפה פשוטה. אל תשתמש במונחים כמו מזוציקל, דילואד או RIR: אמור "סבב", "שבוע קל" ו"חזרות לפני כשל".\n' +
  '- אין לך מידע רפואי על המשתמש. אם מוזכרים כאב או פציעה, המלץ להפסיק את התרגיל ולהתייעץ עם איש מקצוע.\n' +
  '- טקסט פשוט בלבד, בלי טבלאות ובלי כותרות. אפשר שורות קצרות שמתחילות ב-"• ".';
const rulesEn = () => 'You are Eilon, the personal coach inside gymi, the user\'s workout app. You are an AI assistant (built on Claude), and if you are asked about it you say so plainly. Always answer in English, at eye level, short and to the point (up to about 120 words, unless more detail was asked for).\n\n' +
  'The user\'s plan (upper and lower body, four workouts done in a cycle, in this order). The square brackets hold the id of each exercise. Use the exercise names as they are written here:\n\n' + planText() + '\n\n' +
  aboutUser() + 'Rules:\n' +
  '- When asked whether an exercise or a machine can replace an exercise from the plan, the first line of the answer is exactly one of these: "Verdict: Suitable", "Verdict: Partly suitable" or "Verdict: Not recommended". After it, a short explanation (target muscles and movement pattern), how to adjust sets, reps, rest and closeness to failure, and one form cue.\n' +
  '- For other questions (technique, starting weight, progress) answer directly, with no verdict line. When the context holds earlier results, build on them.\n' +
  '- If a photo is attached, open the explanation by naming the machine or the exercise seen in it ("In the photo: ..."), because in the following messages the photo will no longer be available to you. If the photo is unclear, say what you do see and ask for a shot from another angle. If you are told that a photo was attached but it did not reach you, ask to attach it again.\n' +
  '- Logging sets: when the user asks to log sets they did (for example "log 60 kg, 8 8 7" or "I did 3 sets of 12 with no weight"), confirm in one sentence what was logged, and at the end of the answer add a separate line in exactly this format:\n' +
  '@@LOG {"ex":"<exercise id>","sets":[[<weight in kg or null>,<reps>],...]}\n' +
  '  Use the exercise in the context if no other exercise was named. Do not add the line if you were not asked to log, or if the number of reps is missing (in that case, ask). Do not mention this line in the text.\n' +
  '- When there is no exact substitute, suggest one or two alternatives that are common in gyms.\n' +
  '- Keep the intent of the plan: the same muscle group, the same rep range and the same closeness to failure.\n' +
  '- The app runs a training round of several weeks: every week comes one rep closer to failure, and the last week is easy, for recovery. It sets a target for every set (more reps or more weight) and lets the user swap any exercise with the "Swap exercise" button. When asked about a target, a weight or intensity, build on the data in the context.\n' +
  '- Weights are in kilograms.\n' +
  '- Use plain language. Do not use terms such as mesocycle, deload or RIR: say "round", "easy week" and "reps before failure".\n' +
  '- You have no medical information about the user. If pain or an injury comes up, recommend stopping the exercise and consulting a professional.\n' +
  '- Plain text only, no tables and no headings. Short lines that start with "• " are fine.';
const rules = () => (LANG === 'en' ? rulesEn() : rulesHe());
/* every fixed text of the chat by its code, in the language of the page. The codes are what is kept, so that a
   message that is already on screen follows a change of language */
const ERR = () => ({
  not_granted: say('לא אישרת לאילון לענות בדף הזה, ולכן הצ׳אט כבוי כרגע. אפשר לשנות את זה בהרשאות של הדף.', 'You did not allow Eilon to answer on this page, so the chat is off for now. You can change that in the permissions of the page.'),
  sampling_disabled: say('Claude לא זמין בחשבון הזה, ולכן הצ׳אט כבוי.', 'Claude is not available on this account, so the chat is off.'),
  rate_limited: say('הגעת למגבלת השימוש כרגע. נסה שוב בעוד כמה דקות.', 'You have reached the usage limit for now. Try again in a few minutes.'),
  session_expired: say('ההתחברות פגה. התחבר מחדש ל-Claude ונסה שוב.', 'Your session has expired. Sign in to Claude again and retry.'),
  image_rejected: say('לא הצלחתי לשלוח את התמונה. נסה לצלם שוב או לבחור תמונה אחרת.', 'The photo could not be sent. Take it again or choose another one.'),
  images_unavailable: say('אי אפשר לשלוח תמונות בתצוגה הזאת. תאר את המכשיר במילים.', 'Photos cannot be sent in this view. Describe the machine in words.'),
  refused: say('אילון לא ענה על השאלה הזאת. נסה לנסח אותה אחרת.', 'Eilon did not answer this question. Try wording it differently.'),
  empty_completion: say('לא התקבלה תשובה. נסה לנסח את השאלה בקצרה.', 'No answer came back. Try a shorter question.'),
  prompt_too_large: say('השיחה ארוכה מדי. פתח שיחה חדשה ונסה שוב.', 'The conversation is too long. Start a new chat and try again.'),
  upstream_error: say('התקשורת נקטעה. נסה לשלוח שוב.', 'The connection dropped. Try sending again.'),
  bad_key: say('המפתח לא התקבל אצל Anthropic. בדוק אותו בחיבור של אילון (סמל המפתח למעלה).', 'Anthropic did not accept the key. Check it in Eilon\'s connection (the key icon at the top).'),
  offline: say('אין חיבור לאינטרנט כרגע.', 'No internet connection right now.'),
  /* why the chat is off */
  native: say('כדי שאילון יענה באפליקציה צריך מפתח API של Anthropic. המפתח נשמר רק בטלפון הזה.', 'For Eilon to answer in the app, an Anthropic API key is needed. The key is kept only on this phone.'),
  outside: say('הצ׳אט פועל רק כשהדף פתוח בתוך Claude.', 'The chat works only when this page is open inside Claude.'),
  view: say('הצ׳אט לא זמין בתצוגה הזאת.', 'The chat is not available in this view.'),
  /* notes under an answer or above the message box */
  cut: say('התשובה נקטעה באמצע. בקש המשך או שאל שאלה קצרה יותר.', 'The answer was cut short. Ask for the rest, or ask a shorter question.'),
  cancelled: say('עצרת את התשובה.', 'You stopped the answer.'),
  no_image: say('לא הצלחתי לקרוא את התמונה. נסה לצלם שוב או לבחור קובץ JPG או PNG.', 'The photo could not be read. Take it again, or choose a JPG or PNG file.'),
});
const isErr = (c) => typeof c === 'string' && Object.prototype.hasOwnProperty.call(ERR(), c);
/* the text of a code; anything that is not a code is shown as it is */
const errText = (c) => (isErr(c) ? ERR()[c] : c || '');
const HIDE = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];
const stripCmd = (t) => t.replace(/^[ \t]*@@.*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
function splitVerdict(text, final) {
  const m = text.match(/^\s*(?:(?:פסיקה|verdict)\s*[:\-–]\s*)?(מתאים חלקית|לא מומלץ|מתאים|partly suitable|not recommended|suitable)\s*[.!]?\s*(\n|$)/i);
  if (!m || (!final && !m[2])) return null;
  const v = m[1].toLowerCase();
  return { kind: v === 'מתאים' || v === 'suitable' ? 'ok' : v === 'מתאים חלקית' || v === 'partly suitable' ? 'mid' : 'no', label: m[1], rest: text.slice(m[0].length) };
}
/* the exercise a message is about, under the name it has now */
const ctxName = (v) => { const e = v && findEx(v); return e ? e.nm : v || ''; };
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
  if (m.role === 'u') return '<div class="row u"><div class="msg u" dir="auto">' + (m.imgUrl ? '<img src="' + m.imgUrl + '" alt="' + say('התמונה ששלחת', 'The photo you sent') + '">' : m.hadImg ? '<span class="note">' + say('[תמונה]', '[photo]') + '</span>' : '') + esc(m.text) + (m.ctx ? '<span class="note">' + say('על ', 'About ') + esc(ctxName(m.ctx)) + '</span>' : '') + '</div></div>';
  const text = stripCmd(m.text || ''), face = '<span class="ava sm" aria-hidden="true">' + coachFace() + '</span>';
  if (!text) return '<div class="row a">' + face + '<div class="msg a">' + (m.live ? '<span class="think" role="status" aria-label="' + say('אילון חושב', 'Eilon is thinking') + '"><i></i><i></i><i></i></span>' : '<span class="note">' + say('נרשם.', 'Logged.') + '</span>') + loggedHTML(m, idx) + '</div></div>';
  const v = splitVerdict(text, !m.live);
  return '<div class="row a">' + face + '<div class="msg a" dir="auto">' + (v ? '<span class="verdict ' + v.kind + '">' + v.label + '</span>' + fmtText(v.rest) : fmtText(text)) + (m.note ? '<span class="note">' + esc(errText(m.note)) + '</span>' : '') + loggedHTML(m, idx) + '</div></div>';
}
function canUnlog(m) { const e = m && m.logged && !m.logged.undone && findEx(m.logged.ex), s = e && live(wkOf(e.id)); return !!s && (!m.logged.sid || m.logged.sid === s.id); }
/* an Undo that can no longer undo anything is taken off the page, without redrawing the conversation */
function freshLogged() { for (const b of $$('#msgs [data-unlog]')) if (!canUnlog(chat.msgs[+b.dataset.unlog])) b.hidden = true; }
function loggedHTML(m, idx) {
  if (!m.logged) return '';
  if (m.logged.undone) return '<div class="logged" style="color:var(--ink-3)">' + say('הרישום בוטל', 'The log was undone') + '</div>';
  const n = m.logged.idx.length;
  /* the sets can be taken back for as long as their workout is still running */
  return '<div class="logged"><span>' + (n === 1 ? say('נרשם סט אחד', '1 set logged') : say('נרשמו ' + n + ' סטים', n + ' sets logged')) + ' · ' + esc(ctxName(m.logged.ex) || m.logged.name || '') + '</span>' + (canUnlog(m) ? '<button class="link" type="button" data-unlog="' + idx + '">' + say('בטל', 'Undo') + '</button>' : '') + '</div>';
}
/* first things to ask, each with its sign */
const SUGS = () => [say('המכשיר תפוס. מה במקום?', 'The machine is taken. What instead?'), say('צילמתי מכשיר. הוא מתאים?', 'I took a photo of a machine. Does it fit?'), say('דגשים לתרגיל הזה', 'Cues for this exercise'), say('כמה משקל לשים היום?', 'How much weight today?')];
function renderMsgs() {
  const box = $('#msgs'), face = '<span class="ava big" aria-hidden="true">' + coachFace() + '</span>';
  $('#chatNew').hidden = !chat.msgs.length;
  if (chat.off) { box.innerHTML = '<div class="empty">' + face + '<strong>' + (chat.needKey ? say('חיבור אילון', 'Connect Eilon') : say('הצ׳אט לא זמין כרגע', 'The chat is not available right now')) + '</strong><span>' + esc(errText(chat.off)) + '</span>' + (chat.needKey ? '<button class="btn primary" id="coachKey" type="button">' + say('חיבור עם מפתח API', 'Connect with an API key') + '</button>' : '') + '</div>'; return; }
  if (!chat.msgs.length) {
    box.innerHTML = '<div class="empty">' + face + '<strong>' + say('היי, אני אילון', 'Hi, I am Eilon') + '</strong><span>' + say('צלם מכשיר או שאל שאלה. אפשר גם לכתוב מה עשית, ואני ארשום.', 'Snap a machine or ask a question. You can also tell me what you did and I will log it.') + '</span><div class="sugs">' +
      SUGS().map((s, i) => '<button class="sug" type="button" data-sug="' + i + '">' + s + '</button>').join('') + '</div></div>';
    return;
  }
  box.innerHTML = chat.msgs.map(msgHTML).join(''); box.scrollTop = box.scrollHeight;
}
function paintLast() {
  const box = $('#msgs'), el = box.lastElementChild, stick = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  if (el) el.outerHTML = msgHTML(chat.msgs[chat.msgs.length - 1], chat.msgs.length - 1);
  if (stick) box.scrollTop = box.scrollHeight;
}
function setBusy(on) { chat.busy = on; const b = $('#sendBtn'); b.innerHTML = on ? ICON.stop : ICON.send; b.setAttribute('aria-label', on ? say('עצור', 'Stop') : say('שלח', 'Send')); }
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
  } catch (e) { compNote(errText('no_image')); }
}
/* what the page knows, sent with each question: the open workout, the exercise in question and its recent log */
function ctxLine() {
  const id = $('#chatCtx').value, e = id && findEx(id);
  let t = say('[הקשר מהאפליקציה. האימון הפתוח כרגע: ', '[Context from the app. The workout that is open now: ') + wkFull(S.tab) + '.';
  if (e) {
    const w = wkOf(id);
    const cur = live(w), rir = rirOf(e, cur), fu = firstUndone(cur, e), T = fu >= 0 ? targetOf(e, fu, cur) : null, pe = planEx(id);
    t += say(' השאלה מתייחסת לתרגיל [' + e.id + '] "' + e.he + '" (' + e.name + ', ' + wkOrd(w) + '): ', ' The question is about the exercise [' + e.id + '] "' + e.name + '" (' + wkOrd(w) + '): ') + e.n0 + say(' סטים × ', ' sets × ') + e.reps + (e.suf ? ' ' + e.suf : '') + say(' חזרות, מנוחה ', ' reps, rest ') + restPlain(e) + (rir == null ? '' : ', ' + rirText(rir)) + '.';
    if (T) t += say(' היעד לסט הבא (סט ' + (fu + 1) + '): ', ' The target for the next set (set ' + (fu + 1) + '): ') + fmtRow(T) + '.';
    const hist = sorted().filter((s) => s.w === w && moveOf(pe, s) === e.mv && rowsOf(s, id).some(isDone)).slice(0, 3);
    if (hist.length) t += say(' ביצועים אחרונים (ק״ג×חזרות): ', ' Recent results (kg×reps): ') + hist.map((s) => (s.end ? ago(s.ts) : say('באימון הנוכחי', 'in the current workout')) + ': ' + rowsOf(s, id).filter(isDone).map(fmtRow).join(', ')).join(' | ') + '.';
    else t += say(' עוד אין רישום קודם לתרגיל הזה.', ' Nothing was logged for this exercise before.');
  }
  return { text: t + ']', id: e ? e.id : '' };
}
/* a reply may carry one "@@LOG {...}" line: sets to write into today's log */
function applyLog(text) {
  const m = text.match(/^[ \t]*@@LOG\s*(\{.*\})\s*$/m); if (!m) return null;
  let o; try { o = JSON.parse(m[1]); } catch (e) { return null; }
  const e = o && findEx(String(o.ex || '')); if (!e || !Array.isArray(o.sets)) return null;
  const w = wkOf(e.id), idx = [], lv0 = S.lvl;
  for (const p of o.sets.slice(0, 40)) {
    if (!Array.isArray(p)) continue;
    /* no weight is null or zero; a weight that is not a number is a mistake, and such a set is left out */
    const none = p[0] == null || p[0] === 0 || p[0] === '0', kg = none ? null : num(p[0]), reps = num(p[1], true);
    if ((!none && (kg == null || !(kg > 0) || kg > MAX_KG)) || reps == null || reps < 1 || reps > MAX_REPS) continue;
    /* the workout starts with the first set that is really written */
    const i = firstUndone(live(w), e);
    if (i < 0) break;
    writeRow(e, i, kg, reps); idx.push(i);
  }
  if (!idx.length) return null;
  S.touched = true; if (w === S.tab) { S.draft = null; if (rest.on) { clearInterval(rest.iv); rest.on = false; rest.last = null; } }
  renderAll(); bump(lv0); keepAwake();
  return { ex: e.id, name: e.nm, idx, sid: live(w).id };
}
function undoLog(i) {
  const m = chat.msgs[i], e = m && m.logged && findEx(m.logged.ex); if (!e || m.logged.undone) return;
  if (!canUnlog(m)) { renderMsgs(); return; }
  for (const k of m.logged.idx) clearRow(e, k);
  m.logged.undone = true; S.edit = null; renderAll(); renderMsgs();
}
async function sendChat(preset) {
  if (chat.busy) { if (chat.ctl) chat.ctl.abort(); return; }
  if (chat.off) return;
  const inp = $('#chatInput'), typed = (preset || inp.value).trim(), img = chat.img, imgUrl = chat.imgUrl;
  if (!typed && !img) { inp.focus(); return; }
  const text = typed || say('מה המכשיר שבתמונה, והאם הוא מתאים כתחליף?', 'What is the machine in the photo, and does it fit as a substitute?'), ctx = ctxLine(), gen = chat.gen, mine = () => gen === chat.gen;
  compNote(''); setBusy(true);
  chat.msgs.push({ role: 'u', text, imgUrl: img ? imgUrl : '', hadImg: !!img, ctx: ctx.id });
  const reply = { role: 'a', text: '', live: true }; chat.msgs.push(reply);
  chat.turns.push({ role: 'user', content: ctx.text + '\n\n' + text + (img ? say('\n\n[להודעה הזאת צורפה תמונה אחת]', '\n\n[One photo is attached to this message]') : '') });
  inp.value = ''; inp.style.height = ''; chat.img = null; chat.imgUrl = ''; $('#attach').hidden = true;
  renderMsgs();
  const undo = () => { chat.turns.pop(); chat.msgs.splice(chat.msgs.length - 2, 2); inp.value = typed; if (img) { chat.img = img; chat.imgUrl = imgUrl; $('#attach').hidden = false; $('#attachImg').src = imgUrl; } renderMsgs(); };
  let sample = null;
  try { sample = await chat.sampleP; } catch (e) { sample = null; }
  if (!mine()) return;
  if (!sample) { undo(); chat.needKey = !!window.GYMI_NATIVE; chat.off = window.GYMI_NATIVE ? 'native' : 'outside'; renderMsgs(); setBusy(false); return; }
  chat.ctl = new AbortController();
  try {
    const opts = { cache: false, signal: chat.ctl.signal, onText: (u) => { if (!mine()) return; reply.text = u.text; paintLast(); } };
    if (img) opts.images = [img];
    const res = await sample([{ role: 'user', content: rules() }].concat(chat.turns.slice(-16)), opts);
    if (!mine()) return;
    reply.text = res.text; reply.live = false; if (res.truncated) reply.note = 'cut';
    chat.turns.push({ role: 'assistant', content: res.text });
    const lg = res.truncated ? null : applyLog(res.text); if (lg) reply.logged = lg;
    renderMsgs();
  } catch (e) {
    if (!mine()) return;
    const code = (e && e.code) || 'upstream_error', part = e && e.text && stripCmd(e.text);
    if (code === 'no_key') { undo(); window.gymiCoach(false); }
    else if (code === 'api_error' && e.message) { undo(); compNote('Anthropic: ' + String(e.message).slice(0, 200)); }
    else if (HIDE.includes(code)) { undo(); chat.off = isErr(code) ? code : 'view'; renderMsgs(); }
    else if (part && code !== 'refused') { reply.text = part; reply.live = false; reply.note = isErr(code) ? code : 'upstream_error'; chat.turns.push({ role: 'assistant', content: part }); paintLast(); }
    else { undo(); if (code !== 'cancelled') compNote(errText(isErr(code) ? code : 'upstream_error')); if (code === 'images_unavailable') { chat.canImg = false; showImgBtns(); setAttach(null); chatText(); } }
  } finally { if (mine()) { chat.ctl = null; setBusy(false); } }
}
function showImgBtns() { $('#camBtn').hidden = $('#galBtn').hidden = !chat.canImg; }
/* the exercise picker follows the plan as it stands (swapped movements show under their own name) */
function fillCtx() {
  const sel = $('#chatCtx'), v = sel.value;
  sel.innerHTML = '<option value="">' + say('כל התוכנית', 'The whole plan') + '</option>' + PLAN.map((w, i) => '<optgroup label="' + wkFull(i) + '">' + exList(i).map((e) => '<option value="' + e.id + '">' + e.nm + '</option>').join('') + '</optgroup>').join('');
  sel.value = v;
}
/* the fixed texts of the message box: they depend on the language, and on whether photos can be sent */
function chatText() {
  $('#chatInput').placeholder = chat.canImg || !chat.limits ? say('שאל את אילון', 'Ask Eilon') : say('כתוב שם של מכשיר או תרגיל חלופי', 'Type the name of a machine or of another exercise');
  setBusy(chat.busy);
}
function initChat() {
  fillCtx(); chatText();
  for (const el of $$('.ava')) if (!el.firstChild) el.innerHTML = coachFace();
  const tb = $('#tbCoach'); if (tb && !tb.firstChild) tb.innerHTML = coachFace();
  $('#chatKey').hidden = !window.GYMI_NATIVE;
  chat.needKey = !!window.GYMI_NATIVE && !window.GYMI_COACH;
  /* in the phone app the coach answers only once the owner has saved an API key */
  if (chat.needKey) { chat.sampleP = Promise.resolve(null); chat.off = 'native'; renderMsgs(); return; }
  chat.off = '';
  if (!window.claude || typeof window.claude.use !== 'function') { chat.sampleP = Promise.resolve(null); chat.off = 'outside'; renderMsgs(); return; }
  chat.sampleP = window.claude.use('sample');
  chat.sampleP.then(async (sample) => {
    if (!sample) { chat.needKey = !!window.GYMI_NATIVE; chat.off = window.GYMI_NATIVE ? 'native' : 'view'; renderMsgs(); return; }
    try { const lim = await sample.limits(); chat.canImg = !!(lim && lim.images); } catch (e) { chat.canImg = false; }
    chat.limits = true; showImgBtns(); chatText();
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
  $('#chatKey').addEventListener('click', () => { if (window.gymiNative) window.gymiNative.key(); });
  /* the phone app calls this after a key was saved or removed */
  window.gymiCoach = (on) => { window.GYMI_COACH = !!on; initChat(); };
  $('#chatNew').addEventListener('click', () => { chat.gen++; if (chat.ctl) chat.ctl.abort(); chat.ctl = null; chat.msgs = []; chat.turns = []; setAttach(null); compNote(''); setBusy(false); renderMsgs(); });
  $('#sendBtn').addEventListener('click', () => sendChat());
  const inp = $('#chatInput');
  inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); sendChat(); } });
  inp.addEventListener('input', () => { inp.style.height = 'auto'; inp.style.height = Math.min(120, inp.scrollHeight + 2) + 'px'; });
  $('#msgs').addEventListener('click', (ev) => {
    const b = ev.target.closest('.sug'); if (b) { sendChat(SUGS()[+b.dataset.sug]); return; }
    const u = ev.target.closest('[data-unlog]'); if (u) undoLog(+u.dataset.unlog);
    if (ev.target.closest('#coachKey') && window.gymiNative) window.gymiNative.key();
  });
  $('#camBtn').addEventListener('click', () => $('#camFile').click());
  $('#galBtn').addEventListener('click', () => $('#galFile').click());
  for (const id of ['#camFile', '#galFile']) $(id).addEventListener('change', (ev) => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; pickImage(f); });
  $('#attachX').addEventListener('click', () => setAttach(null));
}
