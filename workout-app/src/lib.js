/* ================================================================== movement library */
/* muscle groups with weekly set landmarks (direct sets + half sets for helpers): below mev is too little to grow, above mrv is more than most people recover from */
const MUSCLE = {
  chest: { he: 'חזה', mev: 8, mrv: 22 },
  back: { he: 'גב', mev: 10, mrv: 25 },
  delts: { he: 'כתף אמצעית ואחורית', mev: 8, mrv: 26 },
  fdelt: { he: 'כתף קדמית', mev: 0, mrv: 12 },
  biceps: { he: 'ביספס', mev: 8, mrv: 26 },
  triceps: { he: 'טרייספס', mev: 6, mrv: 18 },
  quads: { he: 'ארבע ראשי', mev: 8, mrv: 20 },
  hams: { he: 'ירך אחורית', mev: 6, mrv: 20 },
  glutes: { he: 'ישבן', mev: 0, mrv: 16 },
  calves: { he: 'שוקיים', mev: 8, mrv: 20 },
  abs: { he: 'בטן וליבה', mev: 0, mrv: 25 },
};
/* a swap is only offered inside the same movement pattern, so the week keeps its shape */
const PATTERN = {
  hpress: 'לחיצה אופקית או בשיפוע', vpress: 'לחיצה אנכית', vpull: 'משיכה אנכית', hpull: 'משיכה אופקית',
  raise: 'הרחקת כתף לצד', rearfly: 'הרחקה אופקית לאחור', ext: 'פשיטת מרפק', curl: 'כפיפת מרפק',
  flex: 'כפיפת גו', antirot: 'ייצוב נגד סיבוב', squat: 'סקוואט', lunge: 'סקוואט ברגל אחת',
  hinge: 'כפיפת ירך (הינג׳)', thrust: 'פשיטת ירך (גשר)', kcurl: 'כפיפת ברך', kext: 'פשיטת ברך', calf: 'הרמת עקבים',
};
/* equipment decides the smallest realistic weight jump (kg); each one can be changed in the settings */
const EQUIP = {
  bar: { he: 'מוט חופשי', inc: 2.5 }, smith: { he: 'סמית׳', inc: 2.5 }, plates: { he: 'מכונת פלטות', inc: 5 }, machine: { he: 'מכונת משקולות', inc: 5 },
  cable: { he: 'כבל', inc: 2.5 }, db: { he: 'משקולות יד', inc: 1 }, bw: { he: 'משקל גוף', inc: 1 },
};
const INC_CHOICES = [0.5, 1, 1.25, 2, 2.5, 5, 10];

/* per movement: Hebrew name, muscle line, p = primary muscle (a full set), s = helpers (half a set each), pat = movement pattern,
   eq = equipment, c = three form cues. inv: more weight means more help. bw: bodyweight. jf: easy on the joints.
   en + an: a swap option, shown with the demo of the closest movement in the plan. */
const LIB = {
  inclineSmith: { he: 'לחיצת חזה בשיפוע עליון בסמית׳', m: 'חזה עליון · כתף קדמית · טרייספס', p: 'chest', s: ['fdelt', 'triceps'], pat: 'hpress', eq: 'smith', c: ['ספסל בשיפוע 30–45°, שכמות אסופות לאחור ולמטה', 'הורד את המוט לחזה העליון בשליטה', 'דחוף למעלה בלי לנעול מרפקים בכוח'] },
  assistedPullup: { he: 'מתח בסיוע (גרביטון)', m: 'רחב גבי · ביספס · גב עליון', p: 'back', s: ['biceps'], pat: 'vpull', eq: 'machine', inv: true, c: ['אחיזה מעט רחבה מהכתפיים', 'התחל מהשכמות ומשוך מרפקים למטה לכיוון הצלעות', 'ירידה איטית עד יישור כמעט מלא'] },
  chestRow: { he: 'חתירה בתמיכת חזה', m: 'רחב גבי · אמצע הגב · ביספס', p: 'back', s: ['biceps', 'delts'], pat: 'hpull', eq: 'plates', jf: true, c: ['החזה צמוד לכרית לאורך כל החזרה', 'משוך מרפקים לאחור לכיוון הירכיים', 'עצור שנייה בכיווץ וחזור עד מתיחה מלאה'] },
  latRaise: { he: 'הרחקות לצדדים בתמיכת חזה', m: 'כתף אמצעית', p: 'delts', s: [], pat: 'raise', eq: 'db', c: ['חזה על ספסל משופע, בלי תנופה מהגוף', 'הרם לצדדים עד גובה הכתפיים, מרפק מעט כפוף', 'הובל עם המרפקים והורד לאט'] },
  machinePress: { he: 'לחיצת חזה במכונה', m: 'חזה · טרייספס · כתף קדמית', p: 'chest', s: ['fdelt', 'triceps'], pat: 'hpress', eq: 'machine', jf: true, c: ['כוונן מושב כך שהידיות בגובה אמצע החזה', 'שכמות צמודות למשענת', 'דחוף קדימה וחזור לאט עד מתיחה בחזה'] },
  pushdown: { he: 'פשיטת מרפקים בפולי עליון', m: 'טרייספס', p: 'triceps', s: [], pat: 'ext', eq: 'cable', jf: true, c: ['מרפקים צמודים לגוף ולא זזים', 'יישר עד הסוף וכווץ', 'עלה בשליטה עד שהאמות מעט מעל קו המרפק'] },
  dbCurl: { he: 'כפיפת מרפקים עם משקולות יד', m: 'ביספס', p: 'biceps', s: [], pat: 'curl', eq: 'db', c: ['מרפקים צמודים לצד הגוף', 'כף היד פונה למעלה, עלה בלי תנופה מהגב', 'הורד לאט עד יישור מלא'] },
  cableCrunch: { he: 'כפיפות בטן בכבל', m: 'בטן ישרה', p: 'abs', s: [], pat: 'flex', eq: 'cable', c: ['על הברכיים, החבל צמוד לצידי הראש', 'עגל את הגב וקרב צלעות לאגן, הירכיים נשארות במקום', 'חזור לאט עד מתיחה בבטן'] },
  hackSquat: { he: 'האק סקוואט', m: 'ארבע ראשי · ישבן', p: 'quads', s: ['glutes'], pat: 'squat', eq: 'plates', c: ['גב ואגן צמודים לכרית, כפות רגליים ברוחב כתפיים', 'רד בשליטה עד עומק נוח, ברכיים בכיוון האצבעות', 'דחוף דרך כל כף הרגל'] },
  rdl: { he: 'דדליפט רומני', m: 'ירך אחורית · ישבן · זוקפי גב', p: 'hams', s: ['glutes'], pat: 'hinge', eq: 'bar', c: ['ברכיים מעט כפופות, שלח את האגן לאחור', 'המוט צמוד לרגליים והגב ישר', 'רד עד מתיחה בירך האחורית ועלה בדחיפת אגן קדימה'] },
  legPress: { he: 'לחיצת רגליים', m: 'ארבע ראשי · ישבן', p: 'quads', s: ['glutes'], pat: 'squat', eq: 'plates', jf: true, c: ['גב תחתון ואגן צמודים למושב', 'רד עמוק בלי שהאגן מתרומם מהכרית', 'דחוף בלי לנעול ברכיים'] },
  seatedLegCurl: { he: 'כפיפת ברכיים בישיבה', m: 'ירך אחורית', p: 'hams', s: [], pat: 'kcurl', eq: 'machine', jf: true, c: ['ציר המכונה מול הברך, כרית הירך נעולה', 'כופף עד הסוף וכווץ', 'חזור לאט עד יישור כמעט מלא'] },
  standingCalf: { he: 'הרמות עקבים בעמידה', m: 'תאומים (שוק)', p: 'calves', s: [], pat: 'calf', eq: 'machine', c: ['כריות כף הרגל על קצה המדרגה', 'רד למתיחה מלאה ועצור רגע', 'עלה גבוה על הבהונות, ברכיים כמעט ישרות'] },
  pallof: { he: 'פאלוף פרס (נגד סיבוב)', m: 'ליבה · אלכסונים', p: 'abs', s: [], pat: 'antirot', eq: 'cable', c: ['עמוד בניצב לכבל, ידיים מול עצם החזה', 'דחוף ישר קדימה והתנגד למשיכה לצד', 'אגן וכתפיים נשארים פונים קדימה, נשימה רגועה'] },
  cableRow: { he: 'חתירה בכבל בישיבה', m: 'רחב גבי · אמצע הגב · ביספס', p: 'back', s: ['biceps', 'delts'], pat: 'hpull', eq: 'cable', jf: true, c: ['גב זקוף וחזה פתוח', 'משוך את הידית לבטן, מרפקים קרוב לגוף', 'שחרר קדימה בשליטה בלי לעגל גב תחתון'] },
  shoulderPress: { he: 'לחיצת כתפיים במכונה', m: 'כתפיים · טרייספס', p: 'fdelt', s: ['delts', 'triceps'], pat: 'vpress', eq: 'machine', jf: true, c: ['גב צמוד למשענת, ידיות בגובה הכתפיים', 'דחוף למעלה בלי לקשת גב תחתון', 'הורד לאט עד גובה האוזניים'] },
  reversePec: { he: 'פרפר הפוך', m: 'כתף אחורית · אמצע הגב', p: 'delts', s: ['back'], pat: 'rearfly', eq: 'machine', jf: true, c: ['חזה צמוד לכרית, ידיים בגובה הכתפיים', 'פתח לצדדים בקשת רחבה, מרפק מעט כפוף', 'בלי להרים כתפיים לאוזניים, חזרה איטית'] },
  hammerCurl: { he: 'כפיפת פטישים', m: 'ברכיאליס · ביספס · אמה', p: 'biceps', s: [], pat: 'curl', eq: 'db', jf: true, c: ['כף היד פונה פנימה לאורך כל הדרך', 'מרפקים צמודים לגוף', 'עלה עד גובה הכתף והורד לאט'] },
  ohTriceps: { he: 'פשיטת מרפקים מעל הראש', m: 'טרייספס (ראש ארוך)', p: 'triceps', s: [], pat: 'ext', eq: 'cable', c: ['מרפקים פונים קדימה וקרובים לראש', 'הורד מאחורי הראש עד מתיחה מלאה', 'יישר למעלה, הזרוע העליונה לא זזה'] },
  kneeRaise: { he: 'הרמות ברכיים בתלייה', m: 'בטן תחתונה · כופפי ירך', p: 'abs', s: [], pat: 'flex', eq: 'bw', bw: true, c: ['תלייה יציבה, בלי נדנוד', 'הרם ברכיים לחזה וגלגל את האגן למעלה', 'הורד לאט, אל תיתן לרגליים ליפול'] },
  bulgarian: { he: 'סקוואט בולגרי', m: 'ארבע ראשי · ישבן', p: 'quads', s: ['glutes'], pat: 'lunge', eq: 'db', c: ['רגל אחורית על ספסל, רוב המשקל על הרגל הקדמית', 'רד ישר למטה, ברך קדמית בכיוון האצבעות', 'דחוף דרך העקב הקדמי'] },
  hipThrust: { he: 'היפ ת׳ראסט', m: 'ישבן · ירך אחורית', p: 'glutes', s: ['hams'], pat: 'thrust', eq: 'bar', c: ['שכמות על ספסל, כפות רגליים ברוחב אגן', 'דחוף אגן למעלה עד קו ישר מכתף לברך', 'סנטר לחזה ועצירה קצרה למעלה'] },
  lyingLegCurl: { he: 'כפיפת ברכיים בשכיבה', m: 'ירך אחורית', p: 'hams', s: [], pat: 'kcurl', eq: 'machine', c: ['אגן צמוד לספסל, הכרית מעל העקב', 'כופף לכיוון הישבן בלי להרים אגן', 'חזרה איטית עד יישור'] },
  legExt: { he: 'פשיטת ברכיים', m: 'ארבע ראשי', p: 'quads', s: [], pat: 'kext', eq: 'machine', c: ['ציר המכונה מול הברך, גב צמוד למשענת', 'יישר עד הסוף וכווץ לשנייה', 'הורד לאט'] },
  seatedCalf: { he: 'הרמות עקבים בישיבה', m: 'סוליאוס (שוק)', p: 'calves', s: [], pat: 'calf', eq: 'plates', jf: true, c: ['כרית מעל הברכיים, כריות כף הרגל על המדרגה', 'רד למתיחה מלאה', 'עלה גבוה ועצור רגע למעלה'] },

  /* swap options */
  inclineDb: { en: 'Incline Dumbbell Press', an: 'inclineSmith', he: 'לחיצת חזה בשיפוע עם משקולות יד', m: 'חזה עליון · כתף קדמית · טרייספס', p: 'chest', s: ['fdelt', 'triceps'], pat: 'hpress', eq: 'db', jf: true, c: ['ספסל בשיפוע 30–45°, משקולות מעל החזה העליון', 'הורד לאט עד מתיחה בחזה, מרפקים בזווית של כ-45° מהגוף', 'דחוף למעלה ומעט פנימה, בלי להקיש את המשקולות'] },
  dbShoulderPress: { en: 'Dumbbell Shoulder Press', an: 'shoulderPress', he: 'לחיצת כתפיים עם משקולות יד', m: 'כתפיים · טרייספס', p: 'fdelt', s: ['delts', 'triceps'], pat: 'vpress', eq: 'db', jf: true, c: ['ישיבה עם גב נתמך, משקולות בגובה האוזניים', 'דחוף למעלה בלי לקשת גב תחתון', 'הורד לאט עד שהמרפקים מעט מתחת לקו הכתפיים'] },
  smithShoulder: { en: 'Smith Machine Shoulder Press', an: 'shoulderPress', he: 'לחיצת כתפיים בסמית׳', m: 'כתפיים · טרייספס', p: 'fdelt', s: ['delts', 'triceps'], pat: 'vpress', eq: 'smith', c: ['ספסל כמעט זקוף, המוט יורד מול הפנים', 'אחיזה מעט רחבה מהכתפיים', 'הורד עד גובה הסנטר ודחוף בלי לנעול בכוח'] },
  latPulldown: { en: 'Lat Pulldown', an: 'assistedPullup', he: 'משיכת פולי עליון', m: 'רחב גבי · ביספס · גב עליון', p: 'back', s: ['biceps'], pat: 'vpull', eq: 'cable', jf: true, c: ['ירכיים נעולות מתחת לכרית, חזה מורם', 'משוך את המוט לחזה העליון, מרפקים למטה ולאחור', 'שחרר לאט עד יישור כמעט מלא'] },
  neutralPulldown: { en: 'Neutral-Grip Pulldown', an: 'assistedPullup', he: 'משיכת פולי עליון באחיזה ניטרלית', m: 'רחב גבי · ביספס · גב עליון', p: 'back', s: ['biceps'], pat: 'vpull', eq: 'cable', jf: true, c: ['ידיות מקבילות, כפות הידיים זו מול זו', 'משוך לחזה ושמור מרפקים קרוב לגוף', 'חזרה איטית עד מתיחה ברחב הגבי'] },
  machineRow: { en: 'Machine Row', an: 'chestRow', he: 'חתירה במכונה', m: 'רחב גבי · אמצע הגב · ביספס', p: 'back', s: ['biceps', 'delts'], pat: 'hpull', eq: 'machine', jf: true, c: ['חזה צמוד לכרית, הידיות מול הצלעות התחתונות', 'משוך מרפקים לאחור וכווץ שכמות', 'שחרר לאט עד מתיחה מלאה'] },
  cableLatRaise: { en: 'Cable Lateral Raise', an: 'latRaise', he: 'הרחקה לצד בכבל', m: 'כתף אמצעית', p: 'delts', s: [], pat: 'raise', eq: 'cable', jf: true, c: ['פולי תחתון, הכבל עובר מאחורי הגוף', 'הרם לצד עד גובה הכתף, מרפק מעט כפוף', 'הורד לאט ושמור על מתח רציף בכבל'] },
  machineLatRaise: { en: 'Machine Lateral Raise', an: 'latRaise', he: 'הרחקות לצדדים במכונה', m: 'כתף אמצעית', p: 'delts', s: [], pat: 'raise', eq: 'machine', jf: true, c: ['מרפקים צמודים לכריות, גב זקוף', 'הרם עם המרפקים עד גובה הכתפיים', 'הורד בשליטה בלי להניח את המשקל'] },
  cableRearFly: { en: 'Cable Rear Delt Fly', an: 'reversePec', he: 'פרפר הפוך בכבלים', m: 'כתף אחורית · אמצע הגב', p: 'delts', s: ['back'], pat: 'rearfly', eq: 'cable', jf: true, c: ['כבלים מוצלבים בגובה הכתפיים', 'פתח לצדדים בקשת רחבה, מרפק מעט כפוף', 'חזור לאט בלי להרים כתפיים'] },
  dbRearFly: { en: 'Chest-Supported Rear Delt Raise', an: 'reversePec', he: 'הרחקה אחורית בתמיכת חזה', m: 'כתף אחורית · אמצע הגב', p: 'delts', s: ['back'], pat: 'rearfly', eq: 'db', c: ['חזה על ספסל משופע, משקולות תלויות מתחת לכתפיים', 'הרם לצדדים עם מרפק מעט כפוף', 'עצור רגע למעלה והורד לאט'] },
  crossPushdown: { en: 'Single-Arm Cable Pushdown', an: 'pushdown', he: 'פשיטת מרפק ביד אחת בכבל', m: 'טרייספס', p: 'triceps', s: [], pat: 'ext', eq: 'cable', jf: true, c: ['מרפק צמוד לגוף, יד אחת על הידית', 'יישר עד הסוף וכווץ', 'עלה לאט עד שהאמה מעט מעל קו המרפק'] },
  cableCurl: { en: 'Cable Curl', an: 'dbCurl', he: 'כפיפת מרפקים בכבל', m: 'ביספס', p: 'biceps', s: [], pat: 'curl', eq: 'cable', jf: true, c: ['פולי תחתון, מרפקים צמודים לגוף', 'כופף עד הסוף בלי להזיז את הזרוע העליונה', 'הורד לאט ושמור על מתח רציף בכבל'] },
  preacher: { en: 'Preacher Curl Machine', an: 'dbCurl', he: 'כפיפת מרפקים במכונת פריצ׳ר', m: 'ביספס', p: 'biceps', s: [], pat: 'curl', eq: 'machine', c: ['בית השחי צמוד לקצה הכרית', 'כופף עד הסוף וכווץ', 'הורד לאט עד יישור כמעט מלא'] },
  machineCrunch: { en: 'Ab Crunch Machine', an: 'cableCrunch', he: 'כפיפות בטן במכונה', m: 'בטן ישרה', p: 'abs', s: [], pat: 'flex', eq: 'machine', jf: true, c: ['כוונן את המושב כך שהציר מול אמצע הבטן', 'עגל את הגב וקרב צלעות לאגן', 'חזור לאט עד מתיחה בבטן'] },
  kneelPallof: { en: 'Half-Kneeling Pallof Press', an: 'pallof', he: 'פאלוף פרס בכריעה', m: 'ליבה · אלכסונים', p: 'abs', s: [], pat: 'antirot', eq: 'cable', jf: true, c: ['ברך אחת על הרצפה, בניצב לכבל', 'דחוף ישר קדימה והתנגד למשיכה לצד', 'אגן יציב, ישבן מכווץ בצד של הברך שעל הרצפה'] },
  smithSquat: { en: 'Smith Machine Squat', an: 'hackSquat', he: 'סקוואט בסמית׳', m: 'ארבע ראשי · ישבן', p: 'quads', s: ['glutes'], pat: 'squat', eq: 'smith', c: ['כפות רגליים מעט קדימה מהמוט, ברוחב כתפיים', 'רד בשליטה עד עומק נוח, ברכיים בכיוון האצבעות', 'דחוף דרך כל כף הרגל'] },
  gobletSquat: { en: 'Goblet Squat', an: 'hackSquat', he: 'גובלט סקוואט', m: 'ארבע ראשי · ישבן', p: 'quads', s: ['glutes'], pat: 'squat', eq: 'db', jf: true, c: ['משקולת אחת צמודה לחזה, מרפקים פונים למטה', 'רד בין הברכיים עם גב זקוף', 'דחוף דרך כל כף הרגל'] },
  revLunge: { en: 'Reverse Lunge', an: 'bulgarian', he: 'מכרע לאחור', m: 'ארבע ראשי · ישבן', p: 'quads', s: ['glutes'], pat: 'lunge', eq: 'db', jf: true, c: ['צעד ארוך לאחור, רוב המשקל על הרגל הקדמית', 'רד עד שהברך האחורית כמעט נוגעת ברצפה', 'דחוף דרך העקב הקדמי וחזור לעמידה'] },
  smithSplit: { en: 'Smith Split Squat', an: 'bulgarian', he: 'ספליט סקוואט בסמית׳', m: 'ארבע ראשי · ישבן', p: 'quads', s: ['glutes'], pat: 'lunge', eq: 'smith', c: ['עמידת פסיעה קבועה מתחת למוט', 'רד ישר למטה, ברך קדמית בכיוון האצבעות', 'דחוף דרך העקב הקדמי'] },
  dbRdl: { en: 'Dumbbell Romanian Deadlift', an: 'rdl', he: 'דדליפט רומני עם משקולות יד', m: 'ירך אחורית · ישבן · זוקפי גב', p: 'hams', s: ['glutes'], pat: 'hinge', eq: 'db', jf: true, c: ['משקולות צמודות לירכיים, ברכיים מעט כפופות', 'שלח את האגן לאחור עם גב ישר', 'רד עד מתיחה בירך האחורית ועלה בדחיפת אגן'] },
  backExt: { en: '45° Back Extension', an: 'rdl', he: 'פשיטת גו בספסל 45°', m: 'ירך אחורית · ישבן · זוקפי גב', p: 'hams', s: ['glutes'], pat: 'hinge', eq: 'bw', bw: true, jf: true, c: ['הכרית מתחת לקפל הירך, רגליים נעולות', 'רד עם גב ישר עד מתיחה בירך האחורית', 'עלה עד קו ישר, בלי קשת יתר בגב'] },
  thrustMachine: { en: 'Hip Thrust Machine', an: 'hipThrust', he: 'היפ ת׳ראסט במכונה', m: 'ישבן · ירך אחורית', p: 'glutes', s: ['hams'], pat: 'thrust', eq: 'machine', jf: true, c: ['חגורה על קפל הירך, שכמות על המשענת', 'דחוף אגן למעלה עד פשיטה מלאה', 'עצירה קצרה למעלה וירידה איטית'] },
  singleLegExt: { en: 'Single-Leg Extension', an: 'legExt', he: 'פשיטת ברך ברגל אחת', m: 'ארבע ראשי', p: 'quads', s: [], pat: 'kext', eq: 'machine', jf: true, c: ['ציר המכונה מול הברך', 'יישר רגל אחת עד הסוף וכווץ לשנייה', 'הורד לאט, אותו מספר חזרות לכל רגל'] },
  pressCalf: { en: 'Leg Press Calf Raise', an: 'standingCalf', he: 'הרמות עקבים במכונת לחיצת רגליים', m: 'תאומים (שוק)', p: 'calves', s: [], pat: 'calf', eq: 'plates', jf: true, c: ['כריות כף הרגל על קצה המשטח, ברכיים כמעט ישרות', 'שחרר למתיחה מלאה', 'דחוף עם הבהונות עד הסוף ועצור רגע'] },
};
/* English name of every movement: swap options carry their own, plan movements take the name of their first slot */
const EN = {};
for (const w of PLAN) for (const e of w.ex) if (!EN[e.a]) EN[e.a] = e.name;
for (const k of Object.keys(LIB)) if (LIB[k].en) EN[k] = LIB[k].en;
const animOf = (mv) => LIB[mv].an || mv;
/* names in the language of the page */
const mvName = (k) => say(LIB[k].he, EN[k]);
const muName = (k) => say(MUSCLE[k].he, MUSCLE[k].en || MUSCLE[k].he);
const eqName = (k) => say(EQUIP[k].he, EQUIP[k].en || EQUIP[k].he);
