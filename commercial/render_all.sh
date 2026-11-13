#!/bin/bash
# Renders every 3D shot of the commercial, one after the other. Frames that already exist are skipped, so the script
# can be stopped and started again.
#   RES=1920 SAMPLES=24 OUT=work/render ./render_all.sh [shot ...]
# PY is the Python that has Blender in it (pip install bpy), or leave it unset and set BLENDER to a Blender program.
cd "$(dirname "$0")/blender"
RES=${RES:-1920}; SAMPLES=${SAMPLES:-24}; CM=${CM:-$(cd .. && pwd)/work}; OUT=${OUT:-$CM/render}
SHOTS=${@:-S1 S2a S2c S2d S3a S5 S3b S4a S4b S4c S4d S6}
export CM
for s in $SHOTS; do
  if [ -n "$BLENDER" ]; then
    "$BLENDER" -b --factory-startup --python shots.py -- $s --res $RES --samples $SAMPLES --out "$OUT" --tex "$CM/tex" $EXTRA 2>&1 | grep --line-buffered -E "FRAME|DONE|Error|Traceback"
  else
    ${PY:-python3} shots.py $s --res $RES --samples $SAMPLES --out "$OUT" --tex "$CM/tex" $EXTRA 2>&1 | grep --line-buffered -E "FRAME|DONE|Error|Traceback"
  fi
done
echo ALLDONE
