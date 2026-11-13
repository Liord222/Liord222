# gymi — the launch commercial

A 30-second film made entirely from code (and a second one, the Hebrew product film: `PLAN-product.md`, `./product.sh`): the real app captured frame by frame, a 3D phone and gym built in
Blender, an original synthesized soundtrack, and an edit that puts them together. `PLAN.md` is the shot list.

## Make it

```bash
./run.sh                       # 1080p
RES=3840 SAMPLES=64 ./run.sh   # 4K (wants a GPU: a Mac with Blender installed uses Metal by itself)
```

The film lands in `work/gymi-commercial-<res>.mp4`. Needs `python3` and either the Blender app (4.2 or newer; on a
Mac it is found in /Applications) or nothing at all (Blender is then installed as a Python module and renders on
the processor, slowly). Rendering can be stopped and started again.

## The pieces

| Folder | What it does |
|---|---|
| `ui/` | `capture.js` drives the real app (`../workout-app/index.html`) under a virtual clock and saves every frame at iPhone 17 Pro size. `screens.py` draws the phone's status bar and island on top. `search.html` is the one screen that is not gymi: the neutral search page of shot 2. |
| `tex-pack/` | The captured screens, packed (so the film can be rendered without capturing again). `tools/unpack_tex.py` turns them into the image sequences the phone plays. |
| `blender/` | `phone.py` (the phone), `gym.py` (the gym), `studio.py` (gymi's world), `shots.py` (every shot: camera and phone, frame by frame). |
| `sound/score.py` | The whole soundtrack, synthesized: room, impact, music at 120 bpm, the app's own interface tones. |
| `edit/make.py` | The cut: bars, the dive into the screen, backgrounds, titles, grade, encode. |

To change what the screens show, edit `ui/capture.js` and `tools/prep_tex.py`, capture again
(`node ui/capture.js && node ui/search.js && python tools/prep_tex.py && python tools/pack_tex.py`; needs Node and
Playwright), and run again.
