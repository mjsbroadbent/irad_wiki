#!/usr/bin/env python3
"""Builds images/FreeIrad.org_logo.svg: the red horse (owner's PNG) with "FREEIRAD.ORG" in bold beside it.

As on the site, the horse is a few pixels taller than the lettering. The text is outlined from Montserrat
Bold (SIL Open Font License), so it renders the same everywhere; the horse PNG is embedded.

    python3 freeirad_logo.py <horse.png> <Montserrat[wght].ttf> <out.svg> [text colour]
"""
import base64, io, re, sys
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

png, font_path, out = sys.argv[1:4]
colour = sys.argv[4] if len(sys.argv) > 4 else '#000000'
TEXT = 'FREEIRAD.ORG'
H = 100.0              # horse height in SVG units
CAP = H * 0.92         # cap height of the lettering: a little shorter than the horse
GAP = H * 0.14         # space between horse and text
PAD = H * 0.04

# Horse: crop to its visible pixels.
im = Image.open(png).convert('RGBA')
im = im.crop(im.split()[3].getbbox())
hw = H * im.width / im.height
buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
href = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

# Lettering.
font = instantiateVariableFont(TTFont(font_path), {'wght': 700})
gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font['hmtx']
cap_units = font['OS/2'].sCapHeight
s = CAP / cap_units
x0 = PAD + hw + GAP
base = PAD + H / 2 + CAP / 2           # centre the capitals on the horse
paths, x = [], x0
bp = BoundsPen(gs)
for ch in TEXT:
    g = cmap[ord(ch)]
    sp = SVGPathPen(gs)
    gs[g].draw(TransformPen(sp, (s, 0, 0, -s, x, base)))
    paths.append(re.sub(r'-?\d+\.\d+', lambda m: f'{float(m.group()):.2f}'.rstrip('0').rstrip('.'), sp.getCommands()))
    x += hmtx[g][0] * s
W = x + PAD
Ht = H + 2 * PAD

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W * 0.6:.0f}" height="{Ht * 0.6:.0f}" viewBox="0 0 {W:.2f} {Ht:.2f}">
<title>FREEIRAD.ORG logo</title>
<image x="{PAD:.2f}" y="{PAD:.2f}" width="{hw:.2f}" height="{H:.2f}" xlink:href="{href}" href="{href}"/>
<path fill="{colour}" d="{' '.join(paths)}"/>
</svg>
'''
open(out, 'w').write(svg)
print(f'wrote {out}: {W:.0f} x {Ht:.0f} units, {len(svg) // 1024} KB')
