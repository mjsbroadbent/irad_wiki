#!/usr/bin/env python3
"""Renders PNG thumbnails for every SVG in images/images.json, at 1x and 2x its display width.

Output: images/thumb/<w>px-<name>.png, the naming Wikipedia uses. Rendering goes through
ffmpeg's librsvg decoder (the same renderer Wikipedia uses), so thumbnails look as they will on screen.
"""
import json, os, subprocess, sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
IMAGES = os.path.join(REPO, 'images')
THUMB = os.path.join(IMAGES, 'thumb')
os.makedirs(THUMB, exist_ok=True)

wanted = set()
for e in json.load(open(os.path.join(IMAGES, 'images.json'))):
    if not e['file'].endswith('.svg'):
        continue
    src = os.path.join(IMAGES, e['file'])
    stem = e['file'][:-4]
    for w in (e['width'], e['width'] * 2):
        out = os.path.join(THUMB, f'{w}px-{stem}.png')
        wanted.add(os.path.basename(out))
        r = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-width', str(w), '-i', src,
                            '-frames:v', '1', out], capture_output=True, text=True)
        if r.returncode:
            sys.exit(f'ffmpeg failed on {e["file"]}: {r.stderr}')
        print(f'thumb/{os.path.basename(out)}')

# Remove thumbnails no longer referenced by the manifest.
for f in os.listdir(THUMB):
    if f.endswith('.png') and f not in wanted:
        os.remove(os.path.join(THUMB, f))
        print(f'removed stale thumb/{f}')
