#!/usr/bin/env python3
"""Makes the thumbnails and file details the site needs for everything in images/images.json.

- Article thumbnails: every SVG at 1x and 2x its display width, as images/thumb/<w>px-<name>.png
  (Wikipedia's naming). Rendering goes through ffmpeg's librsvg decoder (the same renderer
  Wikipedia uses), so thumbnails look as they will on screen.
- Media gallery thumbnails: every file at most 320 px wide and 240 px tall, as
  images/thumb/320px-<name>.jpg for photos and images/thumb/320px-<name>.png for drawings and logos.
- images/thumb/files.json: each file's pixel size, byte size and MIME type, shown in the media
  gallery and on the file pages.

Thumbnails no longer referenced by the manifest are deleted.
"""
import json, os, re, subprocess, sys
from PIL import Image

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
IMAGES = os.path.join(REPO, 'images')
THUMB = os.path.join(IMAGES, 'thumb')
GALLERY_W, GALLERY_H = 320, 240
MIME = {'.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp'}
os.makedirs(THUMB, exist_ok=True)


def svg_size(path):
    """Intrinsic size of an SVG from its width/height attributes, else its viewBox."""
    head = open(path, encoding='utf-8', errors='replace').read(4000)
    tag = re.search(r'<svg\b[^>]*>', head, re.S)
    tag = tag.group(0) if tag else ''
    num = lambda name: (m := re.search(rf'\b{name}="\s*([\d.]+)\s*(px)?\s*"', tag)) and float(m.group(1))
    w, h = num('width'), num('height')
    if not (w and h):
        vb = re.search(r'viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)', tag)
        if vb:
            w, h = float(vb.group(1)), float(vb.group(2))
    return (round(w), round(h)) if w and h else (None, None)


def render_svg(src, out, width):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-width', str(width), '-i', src,
                        '-frames:v', '1', out], capture_output=True, text=True)
    if r.returncode:
        sys.exit(f'ffmpeg failed on {os.path.basename(src)}: {r.stderr}')


manifest = json.load(open(os.path.join(IMAGES, 'images.json')))
wanted, info = set(), {}

# Article thumbnails for SVGs, at the width each placement shows them.
for e in manifest:
    if not e['file'].endswith('.svg'):
        continue
    for w in (e['width'], e['width'] * 2):
        name = f'{w}px-{e["file"][:-4]}.png'
        if name not in wanted:
            render_svg(os.path.join(IMAGES, e['file']), os.path.join(THUMB, name), w)
            print(f'thumb/{name}')
        wanted.add(name)

# Gallery thumbnails and file details, once per file.
for file in sorted({e['file'] for e in manifest}):
    src = os.path.join(IMAGES, file)
    stem, ext = os.path.splitext(file)
    ext = ext.lower()
    if ext == '.svg':
        w, h = svg_size(src)
        tw = GALLERY_W if not (w and h) else max(1, min(GALLERY_W, round(GALLERY_H * w / h)))
        name = f'{GALLERY_W}px-{stem}.png'
        if name not in wanted:   # may already exist as a 2x article thumbnail of the same width
            render_svg(src, os.path.join(THUMB, name), tw)
    else:
        with Image.open(src) as im:
            w, h = im.size
            t = im.copy()
            t.thumbnail((GALLERY_W, GALLERY_H), Image.LANCZOS)
            if ext in ('.jpg', '.jpeg'):
                name = f'{GALLERY_W}px-{stem}.jpg'
                t.convert('RGB').save(os.path.join(THUMB, name), quality=82, optimize=True, progressive=True)
            else:
                name = f'{GALLERY_W}px-{stem}.png'
                t.save(os.path.join(THUMB, name), optimize=True)
    wanted.add(name)
    print(f'thumb/{name}')
    info[file] = {'width': w, 'height': h, 'bytes': os.path.getsize(src), 'mime': MIME.get(ext, 'application/octet-stream'), 'thumb': name}

with open(os.path.join(THUMB, 'files.json'), 'w') as f:
    json.dump(info, f, indent=1, ensure_ascii=False)
    f.write('\n')
print(f'thumb/files.json ({len(info)} files)')

# Remove thumbnails no longer referenced by the manifest.
for f in os.listdir(THUMB):
    if f.endswith(('.png', '.jpg')) and f not in wanted:
        os.remove(os.path.join(THUMB, f))
        print(f'removed stale thumb/{f}')
