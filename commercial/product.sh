#!/bin/bash
# gymi's product film with one command: the app's screens in Hebrew, the 3D phone, the words, the music, the edit.
#   ./product.sh                      1080p
#   RES=3840 SAMPLES=64 ./product.sh  4K
# The app is captured again only when its takes are missing (CAPTURE=1 forces it; needs Node and Playwright).
set -e
cd "$(dirname "$0")"
RES=${RES:-1920}; SAMPLES=${SAMPLES:-32}
export CM="${CM:-$PWD/work}"
mkdir -p "$CM"
[ -d "$CM/venv" ] || python3 -m venv "$CM/venv"
"$CM/venv/bin/pip" -q install numpy scipy pillow imageio-ffmpeg
if [ -n "$CAPTURE" ] || [ ! -f "$CM/ui/home/0047.png" ]; then UILANG=he SCALE=3 node ui/capture.js; fi
"$CM/venv/bin/python" tools/prep_tex.py P1 P2 P3 P4 P5 P6 P7
node ui/titles.js $RES
if [ -z "$BLENDER" ] && [ -x /Applications/Blender.app/Contents/MacOS/Blender ]; then BLENDER=/Applications/Blender.app/Contents/MacOS/Blender; fi
[ -n "$BLENDER" ] || { echo "set BLENDER to a Blender program"; exit 1; }
for s in P1 P2 P3 P4 P5 P6 P7; do
  (cd blender && "$BLENDER" -b --factory-startup --python product.py -- $s --res $RES --samples $SAMPLES --out "$CM/render-product" --tex "$CM/tex" 2>&1 | grep --line-buffered -E "DONE|Error|Traceback")
done
"$CM/venv/bin/python" sound/product.py
"$CM/venv/bin/python" edit/product.py --res $RES --out "$CM/gymi-product-$RES.mp4"
echo "The film: $CM/gymi-product-$RES.mp4"
