#!/usr/bin/env python3
"""Builds images/Jilmay_logo.svg: the 😊 face with the lowercase "jılmay" wordmark beside it.

This is the lockup the Jılmay site shows in its header (repo mjsbroadbent/jilmay: .logo-face is 😊 in
Noto Color Emoji at 30 px, .logo-word is "jılmay" in Nunito weight 900, 30 px, colour #16b350,
letter-spacing -1px, 4 px gap). The face is Noto Emoji's own drawing of U+1F60A (Apache License 2.0)
and the lettering is converted to outlines from Nunito (SIL Open Font License), so it looks the same
on every device. Usage:

    python3 jilmay_lockup.py <emoji_u1f60a.svg> <Nunito[wght].ttf> <out.svg>

Noto Emoji: git clone --depth 1 --filter=blob:none --no-checkout https://github.com/googlefonts/noto-emoji &&
            git -C noto-emoji checkout HEAD -- 2D/svg/emoji_u1f60a.svg
Nunito:     git clone --depth 1 --filter=blob:none --no-checkout https://github.com/google/fonts &&
            git -C fonts checkout HEAD -- "ofl/nunito/Nunito[wght].ttf"
"""
import re, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

face_path, font_path, out = sys.argv[1:4]
TEXT, COLOUR, WEIGHT = 'jılmay', '#16b350', 900
FACE, GAP, SIZE, TRACK = 30, 4, 30, -1   # px, as in the site's .logo styles

font = instantiateVariableFont(TTFont(font_path), {'wght': WEIGHT})
upm, cmap, glyphs, hmtx = font['head'].unitsPerEm, font.getBestCmap(), font.getGlyphSet(), font['hmtx']
s = SIZE / upm

# With line-height 1 the browser centres the em box on the face; the baseline sits at its ascent share.
asc, desc = font['hhea'].ascent, font['hhea'].descent
baseline = FACE / 2 + (asc + desc) / 2 * s

# Glyph outlines, with the font's pair kerning where it has a simple pair adjustment.
def kern_table():
    pairs = {}
    if 'GPOS' not in font:
        return pairs
    gpos = font['GPOS'].table
    for fr in gpos.FeatureList.FeatureRecord:
        if fr.FeatureTag != 'kern':
            continue
        for li in fr.Feature.LookupListIndex:
            lk = gpos.LookupList.Lookup[li]
            for st in lk.SubTable:
                st = getattr(st, 'ExtSubTable', st)
                if getattr(st, 'Format', 0) == 1 and hasattr(st, 'PairSet'):
                    for g1, ps in zip(st.Coverage.glyphs, st.PairSet):
                        for pvr in ps.PairValueRecord:
                            pairs.setdefault((g1, pvr.SecondGlyph), getattr(pvr.Value1, 'XAdvance', 0) or 0)
                elif getattr(st, 'Format', 0) == 2 and hasattr(st, 'Class1Record'):
                    cov = set(st.Coverage.glyphs)
                    for a in [cmap[ord(c)] for c in TEXT]:
                        for b in [cmap[ord(c)] for c in TEXT]:
                            if a in cov and (a, b) not in pairs:
                                rec = st.Class1Record[st.ClassDef1.classDefs.get(a, 0)].Class2Record[st.ClassDef2.classDefs.get(b, 0)]
                                v = getattr(rec.Value1, 'XAdvance', 0) or 0
                                if v:
                                    pairs[(a, b)] = v
    return pairs
kern = kern_table()

paths, x, prev = [], FACE + GAP, None
for ch in TEXT:
    g = cmap[ord(ch)]
    if prev:
        x += kern.get((prev, g), 0) * s
    pen = SVGPathPen(glyphs)
    glyphs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, baseline)))
    if pen.getCommands():
        paths.append(pen.getCommands())
    x += hmtx[g][0] * s + TRACK
    prev = g
width = x - TRACK
d = re.sub(r'(\d+\.\d{2})\d+', r'\1', ' '.join(paths))

face = open(face_path, encoding='utf-8').read()
face = re.sub(r'<\?xml[^>]*\?>', '', face)
inner = re.sub(r'^\s*<svg[^>]*>|</svg>\s*$', '', face.strip())
inner = re.sub(r'\s*\n\s*', '', inner)
inner = re.sub(r'id="([^"]+)"', r'id="jl-\1"', inner)
inner = re.sub(r'url\(#([^)]+)\)', r'url(#jl-\1)', inner)
inner = re.sub(r'href="#([^"]+)"', r'href="#jl-\1"', inner)
pad = 2
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
       f'width="{(width + 2 * pad) * 4:.0f}" height="{(FACE + 2 * pad) * 4:.0f}" '
       f'viewBox="{-pad} {-pad} {width + 2 * pad:.2f} {FACE + 2 * pad}">'
       f'<title>Jılmay</title>'
       f'<svg x="0" y="0" width="{FACE}" height="{FACE}" viewBox="0 0 128 128">{inner}</svg>'
       f'<path fill="{COLOUR}" d="{d}"/></svg>\n')
open(out, 'w', encoding='utf-8').write(svg)
print(f'{out}: {width:.1f} x {FACE} px lockup')
