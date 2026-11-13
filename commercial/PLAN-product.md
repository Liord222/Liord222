# gymi — the product film (Hebrew)

30 seconds, 24 fps, 16:9, in Hebrew. The commercial (`PLAN.md`) tells a story in a gym; this film shows the product
the way a product film does: the phone alone on black, lit like an object, one idea at a time, few words, large and
quiet, every cut on a beat. No gym, no brand-coloured light: the blue is the phone's body and the app's screens.

| # | Time | Frames | Picture | Words |
|---|---|---|---|---|
| open | 0:00–0:03 | 72 | Black. One line, then the next. | לא צריך לדעת הכול. / צריך רק להתחיל. |
| P1 | 0:03–0:06.5 | 84 | Macro on the lenses; a line of light slides over the back; the phone turns and its screen wakes on gymi's splash. | — |
| P2 | 0:06.5–0:10 | 84 | The phone low, cropped by the frame; the app opens: the curtain, the character, Eilon. | הכירו את gymi. / המאמן האישי שלך. |
| P3 | 0:10–0:14 | 96 | Phone on the left: the character designer, choice by choice. | דמות שהיא אתה. / בוחרים מראה, והיא מתחזקת יחד איתך. |
| P4 | 0:14–0:17.5 | 84 | The phone rises from below: Eilon lays out the plan. | תוכנית שנבנית בשבילך. / אילון, המאמן שלך, מתאים אותה לרמה ולמטרה. |
| P5 | 0:17.5–0:21.5 | 96 | Phone on the right: Swap, the alternatives, one tap. | המכשיר תפוס? מחליפים. / תרגיל חלופי, בהקשה אחת. |
| P6 | 0:21.5–0:25.5 | 96 | The set, the points, the level, the workout complete. | כל סט מקדם אותך. / נקודות, רמות ומדליות. כמו במשחק. |
| P7 | 0:25.5–0:27.5 | 48 | Home; the camera draws back; to black. | — |
| end | 0:27.5–0:30 | 60 | The wordmark, BY LIOR DAHAN, the line in blue to gold. | הכושר שלך. שלב אחרי שלב. |

Type: Rubik (300 for the opening, 500 for a feature's line, 400 in grey under it), set by a browser so the Hebrew
is shaped right to left (`ui/titles.js`; the words themselves are in `edit/product_copy.json`). The words arrive from
a little lower, out of a soft blur.

## Make it

```bash
./product.sh                       # 1080p, about half an hour on an M-series Mac
RES=3840 SAMPLES=64 ./product.sh   # 4K
```

| File | What it does |
|---|---|
| `ui/capture.js` | The app's takes, in Hebrew (`UILANG=he`, the default; the player is ליאור). |
| `tools/prep_tex.py` | `P1`..`P7`: which app frames each shot's screen plays. |
| `blender/product.py` | The black studio and the seven shots. |
| `sound/product.py` | The music (the instruments are `score.py`'s). |
| `edit/product.py` | The cut, the words, the end card. |
