# gymi — launch commercial, production plan

30 seconds, 24 fps (720 frames), 16:9 master. The real world is framed 2.39:1 (bars top and bottom); the moment we
enter the phone the bars open to the full frame, and they close again when we come back out. That one move carries
the story: a tight, uncertain world, then gymi opens it up.

## What is real, what is made

| Element | Source |
|---|---|
| Every screen inside the phone | The real app (`workout-app/index.html`, English), driven by a script and captured frame by frame at iPhone 17 Pro size (402×874 pt, 3×). Nothing is mocked except the search page in shot 2A, which is not part of gymi. |
| The character | The app's own avatar, as the app draws it. |
| Phone | Procedural model at iPhone 17 Pro proportions (150 × 71.9 × 8.75 mm), titanium frame, glass, camera plateau. |
| Gym | Procedural 3D set: rubber floor, racks, Smith machine, benches, dumbbells, plates, mirrors, ceiling light panels. |
| Music and sound | Synthesized for this film, so it is owned outright. The UI sounds use the app's own tones. |

**Not shown, because gymi does not have it:** turning a photo into an avatar (planned, not built). The character
designer, which does exist, takes its place. **No App Store screens:** gymi is not on the App Store yet, and its pages
are Apple's design. The discovery happens through a neutral search page instead.

**The young man.** A photoreal CG actor with believable acting is not reachable on this machine (4 CPU cores, no
GPU, no network for footage or scanned humans), and the brief says not to accept an artificial-looking one. So the
real-world shots are **his point of view**: we are him. His confusion is told by the camera (hesitant moves, looking
around, rack focus on intimidating equipment) and by the sound (his breathing). If you film three short live-action
plates (see the end of this file), they drop into the same cuts.

## Shot list

| # | Time | Frames | Shot | Sound |
|---|---|---|---|---|
| **1** | 0:00–0:05 | 0–119 | **The gym.** Black. Ceiling panels bang on one row at a time, revealing a big gym. POV push past the dumbbell rack, a hesitant look left and right; the Smith machine and racks loom. | Light switches, deep room tone, a plate drops far away, murmurs, his breath. |
| **2A** | 0:05–0:06.5 | 120–155 | **The phone.** Close-up: his phone on the edge of a bench, screen on a search for "gym workout for beginners". Among the results: gymi. | Room tone, distant clanks. |
| **2B** | 0:06.5–0:07 | 156–167 | A heavy plate slams the floor nearby; the bench jolts; the phone slides off. | BOOM, metal ring. |
| **2C** | 0:07–0:10 | 168–239 | **Slow motion.** The camera falls with the phone; it turns over; gym lights streak across the glass. | Everything drops an octave and stretches; a low rising tone; heartbeat. |
| **2D** | 0:10–0:10.5 | 240–251 | It hits the rubber floor, face up. | Sharp, precise impact. |
| **2E** | 0:10.5–0:11 | 252–263 | Silence. The screen wakes; gymi is right there. | Nothing, then one soft tone. |
| **3A** | 0:11–0:12.5 | 264–299 | **Into the phone.** The camera rushes down into the screen and through the gymi result; the bars open; black, then "gymi by Lior Dahan" (the app's real splash). | Whoosh, then the beat drops. |
| **3B** | 0:12.5–0:15 | 300–359 | In gymi's world (deep blue-black, blue and gold light) the phone rises and turns into a hero position. On screen: the real welcome, the character falling in, Eilon arriving. | Beat. |
| **4A** | 0:15–0:17 | 360–407 | **Your character.** The real character designer: skin, hair, shirt change; the avatar answers. It steps out of the screen into 3D space. | Taps, the app's coin sound. |
| **4B** | 0:17–0:19 | 408–455 | **Your plan.** Eilon offers the plan, line after line. | Ticks on each line. |
| **4C** | 0:19–0:21.5 | 456–515 | **Your coach.** The workout screen, the avatar doing the exercise. Tap *Swap*; the alternatives slide up; one tap; the new exercise. | Swipe, click. |
| **4D** | 0:21.5–0:24 | 516–575 | **Your game.** Set done, +10 flies, the set pops; *Level 5!*; a medal. The avatar flexes. | The app's set and level sounds. |
| **5A** | 0:24–0:25 | 576–599 | **Back to reality.** Pull out of the screen; the bars close; we are in the gym, lifting the phone off the floor. | Reverse whoosh; the room returns. |
| **5B** | 0:25–0:27 | 600–647 | Rack focus from the phone (his avatar on the Smith machine) to the real Smith machine. He walks to it. | Calm steps, a plate slides on. |
| **6** | 0:27–0:30 | 648–719 | **Final.** The phone floats in the dark, slow orbit, gymi's home screen; it turns into the logo. **gymi** · *Level up your fitness.* Fade to black at 0:29.5. | One final hit and a ringing chord. |

Words on screen: four, one per feature (*Your character. Your plan. Your coach. Your game.*), plus the end line.

## How it is made on this machine

- **Blender 5.3** (official build, as a Python module), Cycles on CPU with OpenImageDenoise.
- Full 3D animation only where the camera needs real parallax (shot 1, the phone itself in every shot). Shots where
  the camera barely moves use high-quality still plates with the phone rendered over them (shadows caught, the gym's
  own light reflected in the glass from a 360° render of the set).
- The app's screens are textures on the phone's display, one captured frame per film frame.
- Master: **1920×1080**. A 4K render needs a GPU: the scene scripts take `--res 3840` unchanged on a MacBook or RunPod.

## Live-action plates you could film (optional)

1. Walking in the gym door, camera behind at shoulder height, 5 s. 2. Close on his face looking around, unsure, 3 s.
3. Picking the phone up from the floor and looking at it, a small smile, 3 s. Phone on a tripod, 4K 24 fps, gym lights
on. They replace POV shots 1 and 5 one for one.
