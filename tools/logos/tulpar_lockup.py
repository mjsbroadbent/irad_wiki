#!/usr/bin/env python3
"""Builds images/Tulpar_logo.svg: the Tulpar app icon with the lowercase "tulpar" wordmark beside it.

This is the lockup the Tulpar website shows in its header (repo mjsbroadbent/tulpar: favicon.svg plus
"tulpar" in Unbounded Bold, colour #054a60, letter-spacing -0.03em, 34 px icon, 10 px gap, 22 px text).
The lettering is converted to outlines from Unbounded (SIL Open Font License) so it looks the same
without the font installed. Usage:

    python3 tulpar_lockup.py <favicon.svg> <Unbounded[wght].ttf> <out.svg>

Unbounded: git clone --depth 1 --filter=blob:none --no-checkout https://github.com/google/fonts &&
           git -C fonts checkout HEAD -- "ofl/unbounded/Unbounded[wght].ttf"
"""
import re, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

icon_path, font_path, out = sys.argv[1:4]
TEXT, COLOUR, WEIGHT = 'tulpar', '#054a60', 700
ICON, GAP, SIZE, TRACK = 34, 10, 22, -0.03   # px, as in the site's .brand style

font = instantiateVariableFont(TTFont(font_path), {'wght': WEIGHT})
upm, cmap, glyphs, hmtx = font['head'].unitsPerEm, font.getBestCmap(), font.getGlyphSet(), font['hmtx']
s = SIZE / upm

# Vertical placement: the browser centres the text's line box on the icon.
asc, desc = font['hhea'].ascent, font['hhea'].descent
baseline = ICON / 2 + (asc + desc) / 2 * s

paths, x = [], ICON + GAP
for ch in TEXT:
    g = cmap[ord(ch)]
    pen = SVGPathPen(glyphs)
    glyphs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, baseline)))
    d = pen.getCommands()
    if d:
        paths.append(d)
    x += hmtx[g][0] * s + TRACK * SIZE
width = x - TRACK * SIZE

# Strip trailing zeros from the outline numbers to keep the file small.
d = re.sub(r'(\d+\.\d{2})\d+', r'\1', ' '.join(paths))

icon = open(icon_path, encoding='utf-8').read()
inner = re.sub(r'^\s*<svg[^>]*>|</svg>\s*$', '', icon.strip())
pad = 2
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{(width + 2 * pad) * 4:.0f}" height="{(ICON + 2 * pad) * 4:.0f}" '
       f'viewBox="{-pad} {-pad} {width + 2 * pad:.2f} {ICON + 2 * pad}">'
       f'<title>Tulpar</title>'
       f'<svg x="0" y="0" width="{ICON}" height="{ICON}" viewBox="0 0 512 512">{inner}</svg>'
       f'<path fill="{COLOUR}" d="{d}"/></svg>\n')
open(out, 'w', encoding='utf-8').write(svg)
print(f'{out}: {width:.1f} x {ICON} px lockup')
