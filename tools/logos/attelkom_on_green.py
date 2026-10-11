#!/usr/bin/env python3
"""Makes images/Attelkom_logo.png: the owner's white Attelkom logo on the company's forest green.
Usage: python3 attelkom_on_green.py <white logo png> <out png>"""
import sys
from PIL import Image
FOREST_GREEN = (34, 139, 34, 255)   # #228B22
src, out = sys.argv[1:3]
logo = Image.open(src).convert('RGBA')
pad = round(logo.height * 0.14)
bg = Image.new('RGBA', (logo.width + 2 * pad, logo.height + 2 * pad), FOREST_GREEN)
bg.alpha_composite(logo, (pad, pad))
bg.convert('RGB').save(out, optimize=True)
print(f'wrote {out} {bg.size}')
