#!/bin/sh
# Rebuilds every drawn image in images/ and its PNG thumbnails.
# Needs: node (18+) and ffmpeg built with librsvg. Everything else is vendored here.
set -e
cd "$(dirname "$0")"
node src/globe.mjs
node src/regional.mjs
node src/charts.mjs
node src/thematic.mjs
node src/cityplans.mjs
python3 thumbs.py
