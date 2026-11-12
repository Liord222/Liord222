# gymi – אפליקציית טלפון (Expo)

המעטפת שמריצה את gymi כאפליקציה אמיתית ב-iPhone ובאנדרואיד. כל המוצר עצמו נמצא ב-`../workout-app`; כאן הוא נטען מתוך האפליקציה (עובד בלי אינטרנט), והרישום נשמר על הטלפון.

## הרצה על הטלפון דרך Expo Go

צריך מחשב עם Node ואת האפליקציה Expo Go בטלפון.

```bash
cd gymi-app
npm install
npx expo start
```

סורקים את קוד ה-QR שמופיע (ב-iPhone עם המצלמה, באנדרואיד מתוך Expo Go).

## התקנה כאפליקציה עצמאית (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview   # קובץ APK להתקנה ישירה
npx eas-cli@latest build --platform ios                         # דורש חשבון Apple Developer
npx eas-cli@latest submit --platform ios                        # העלאה ל-TestFlight
```

## אחרי שינוי ב-gymi עצמו

```bash
npm run sync   # בונה את ../workout-app ומטמיע אותו ב-src/gymiPage.js
npm test       # בודק את המעטפת בדפדפן (דורש playwright)
```

## מה המעטפת עושה

- שומרת עותק של הרישום באחסון של הטלפון, ומשחזרת אותו אם האחסון של הדף התרוקן.
- ייצוא CSV נפתח במסך השיתוף של הטלפון.
- רטט קצר ברישום סט ובסוף מנוחה, והמסך לא נכבה בזמן אימון.
- כפתור "חזרה" באנדרואיד סוגר את מה שפתוח, ומהמסך הראשי יוצא מהאפליקציה.
- מצב בהיר וכהה לפי הגדרות הטלפון.

## מה עוד אין

- אילון (הצ׳אט) עובד כרגע רק בגרסה שבתוך Claude.
- אין סנכרון בין מכשירים: הרישום נשמר על הטלפון הזה בלבד.
