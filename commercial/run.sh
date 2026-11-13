#!/bin/bash
# The whole commercial with one command: textures, 3D renders, soundtrack, edit.
#   ./run.sh                      1080p
#   RES=3840 SAMPLES=64 ./run.sh  4K
# On a Mac it uses the Blender app (and its Metal GPU). Anywhere else, set BLENDER to a Blender program, or it
# installs Blender as a Python module. Rendering can be stopped and started again: finished frames are kept.
set -e
cd "$(dirname "$0")"
RES=${RES:-1920}; SAMPLES=${SAMPLES:-32}
export CM="${CM:-$PWD/work}"
mkdir -p "$CM"
[ -d "$CM/venv" ] || python3 -m venv "$CM/venv"
"$CM/venv/bin/pip" -q install numpy scipy pillow imageio-ffmpeg
[ -f "$CM/tex/S6/0072.jpg" ] || "$CM/venv/bin/python" tools/unpack_tex.py
if [ -z "$BLENDER" ] && [ -x /Applications/Blender.app/Contents/MacOS/Blender ]; then BLENDER=/Applications/Blender.app/Contents/MacOS/Blender; fi
if [ -z "$BLENDER" ]; then "$CM/venv/bin/pip" -q install bpy; export PY="$CM/venv/bin/python"; fi
export BLENDER
RES=$RES SAMPLES=$SAMPLES ./render_all.sh
"$CM/venv/bin/python" sound/score.py
"$CM/venv/bin/python" edit/make.py --res $RES --out "$CM/gymi-commercial-$RES.mp4"
echo "The film: $CM/gymi-commercial-$RES.mp4"
