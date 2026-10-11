#!/usr/bin/env python3
"""Rebuilds images/IradOne_logo.svg from the owner's Inkscape file with the lettering as outlines.

The original sets "IradOne" as live Montserrat Medium text, which browsers without Montserrat replace with
another font. This converts each glyph to a path using Montserrat (SIL Open Font License) at weight 500,
keeping the original positions, sizes and colours. Usage:

    python3 outline_iradone.py <iradone.svg> <Montserrat[wght].ttf> <out.svg>

Montserrat: git clone --depth 1 --filter=blob:none --no-checkout https://github.com/google/fonts &&
            git -C fonts checkout HEAD -- "ofl/montserrat/Montserrat[wght].ttf"
"""
import re, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

src, font_path, out = sys.argv[1:4]
svg = open(src, encoding='utf-8').read()

font = instantiateVariableFont(TTFont(font_path), {'wght': 500})
upm = font['head'].unitsPerEm
cmap = font.getBestCmap()
glyphs = font.getGlyphSet()
hmtx = font['hmtx']

# Pair kerning from the GPOS 'kern' feature (format 1 and 2 pair adjustments), as Inkscape/Pango apply it.
def build_kern():
    kern = {}
    if 'GPOS' not in font:
        return lambda a, b: 0
    gpos = font['GPOS'].table
    idx = [fr.FeatureIndex if hasattr(fr, 'FeatureIndex') else i for i, fr in enumerate(gpos.FeatureList.FeatureRecord)]
    lookups = set()
    for fr in gpos.FeatureList.FeatureRecord:
        if fr.FeatureTag == 'kern':
            lookups.update(fr.Feature.LookupListIndex)
    for li in lookups:
        lk = gpos.LookupList.Lookup[li]
        for st in lk.SubTable:
            if lk.LookupType == 9:
                st = st.ExtSubTable
            if getattr(st, 'LookupType', 2) != 2 and lk.LookupType not in (2, 9):
                continue
            if st.Format == 1:
                for g1, ps in zip(st.Coverage.glyphs, st.PairSet):
                    for pvr in ps.PairValueRecord:
                        v = getattr(pvr.Value1, 'XAdvance', 0) or 0
                        kern.setdefault((g1, pvr.SecondGlyph), v)
            elif st.Format == 2:
                c1, c2 = st.ClassDef1.classDefs, st.ClassDef2.classDefs
                cov = st.Coverage.glyphs
                def kern2(a, b, st=st, c1=c1, c2=c2, cov=cov):
                    if a not in cov:
                        return None
                    rec = st.Class1Record[c1.get(a, 0)].Class2Record[c2.get(b, 0)]
                    return getattr(rec.Value1, 'XAdvance', 0) or 0
                kern.setdefault(('__fmt2__', id(st)), kern2)
    fmt2 = [v for k, v in kern.items() if k[0] == '__fmt2__']
    def get(a, b):
        if (a, b) in kern:
            return kern[(a, b)]
        for f in fmt2:
            v = f(a, b)
            if v:
                return v
        return 0
    return get
kerning = build_kern()

def outline(text, x, y, size, fill):
    s = size / upm
    paths, pen_x, prev = [], x, None
    for ch in text:
        g = cmap.get(ord(ch))
        if g is None:
            continue
        if prev:
            pen_x += kerning(prev, g) * s
        if ch != ' ':
            sp = SVGPathPen(glyphs)
            glyphs[g].draw(TransformPen(sp, (s, 0, 0, -s, pen_x, y)))
            d = sp.getCommands()
            d = re.sub(r'-?\d+\.\d+', lambda m: f'{float(m.group()):.3f}'.rstrip('0').rstrip('.'), d)
            paths.append(d)
        pen_x += hmtx[g][0] * s
        prev = g
    return f'<path fill="{fill}" d="{" ".join(paths)}"/>'

# Pull the pieces out of the Inkscape file.
frame = re.search(r'<path[^>]*id="rect5273"[^>]*/>', svg, re.S).group(0)
frame_d = re.search(r'\sd="([^"]+)"', frame).group(1)
frame_tf = re.search(r'transform="([^"]+)"', frame).group(1)
frame_fill = re.search(r'fill:(#[0-9a-fA-F]{6})', frame).group(1)
texts = []
for t in re.finditer(r'<text\b(.*?)</text>', svg, re.S):
    body = t.group(1)
    size = float(re.search(r'font-size:([\d.]+)px', body).group(1))
    fill = re.search(r'fill:(#[0-9a-fA-F]{6})', body).group(1)
    span = re.search(r'<tspan[^>]*\sx="([\d.]+)"[^>]*\sy="([\d.]+)"[^>]*>([^<]*)</tspan>', body, re.S)
    texts.append((span.group(3), float(span.group(1)), float(span.group(2)), size, fill))
group_tf = re.search(r'<g\b[^>]*transform="([^"]+)"', svg, re.S).group(1)
vb = re.search(r'viewBox="([^"]+)"', svg).group(1)
w, h = (float(v) for v in vb.split()[2:])
px = 3.7795275591  # px per mm

out_svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{w * px:.1f}" height="{h * px:.1f}" viewBox="{vb}">
<title>IradOne logo</title>
<g transform="{group_tf}">
<path fill="{frame_fill}" transform="{frame_tf}" d="{frame_d}"/>
{chr(10).join(outline(*t) for t in texts)}
</g>
</svg>
'''
open(out, 'w', encoding='utf-8').write(out_svg)
print(f'wrote {out}: {len(texts)} text runs outlined')
