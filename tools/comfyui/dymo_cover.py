#!/usr/bin/env python3
"""Stick an embossed label-maker (Dymo-style) tape onto a photo, then photocopy the lot.

  python3 tools/comfyui/dymo_cover.py photo.png out.jpg --text "ZVEZDA IRAD" --at 0.5,0.62 --angle -2.5 --size 1000

--at is the label centre as fractions of width,height; --angle in degrees (positive = anticlockwise).
The photocopy pass: greyscale, crushed blacks, toner speckle, slight streaks, light paper edge.
"""
import argparse, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

FONT = "/usr/share/texmf/fonts/opentype/public/tex-gyre/texgyreheroscn-bold.otf"


def label(text, h=78, seed=1):
    rnd = random.Random(seed)
    font = ImageFont.truetype(FONT, int(h * 0.62))
    pad = int(h * 0.55)
    # letters one by one with the tiny jitter a hand-cranked wheel gives
    widths = [font.getbbox(c)[2] - font.getbbox(c)[0] if c != " " else int(h * 0.3) for c in text]
    gap = int(h * 0.09)
    w = pad * 2 + sum(widths) + gap * (len(text) - 1)
    tape = Image.new("L", (w, h), 48)
    # plastic sheen: faint horizontal banding and grain
    a = np.array(tape, dtype=np.float32)
    a += np.linspace(-14, 22, h)[:, None]
    a[:3, :] += 55; a[-2:, :] += 30          # glossy rim catches the light
    a += np.random.default_rng(seed).normal(0, 3, a.shape)
    tape = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    x = pad
    for c, cw in zip(text, widths):
        if c != " ":
            dy = rnd.randint(-2, 2)
            bb = font.getbbox(c)
            d.text((x - bb[0], (h - (bb[3] - bb[1])) // 2 - bb[1] + dy), c, font=font, fill=255)
        x += cw + gap
    # embossed plastic goes whitish but not paper-white, a little uneven
    stress = np.array(mask, dtype=np.float32) / 255
    noise = np.random.default_rng(seed + 1).normal(0, 0.08, stress.shape)
    face = Image.fromarray(np.clip((stress * (0.82 + noise)) * 255, 0, 255).astype(np.uint8))
    hi = ImageChops.offset(mask, -1, -1).filter(ImageFilter.GaussianBlur(0.6))
    sh = ImageChops.offset(mask, 2, 2).filter(ImageFilter.GaussianBlur(1.2))
    t = np.array(tape, dtype=np.float32)
    t = t - np.array(sh, dtype=np.float32) * 0.06 + np.array(hi, dtype=np.float32) * 0.15
    t = np.maximum(t, np.array(face, dtype=np.float32) * 0.92)
    tape = Image.fromarray(np.clip(t, 0, 255).astype(np.uint8))
    # cut ends: slightly slanted scissor cuts
    cut = Image.new("L", (w, h), 255)
    cd = ImageDraw.Draw(cut)
    s1, s2 = rnd.randint(2, 8), rnd.randint(2, 8)
    cd.polygon([(0, 0), (s1, 0), (0, h)], fill=0)
    cd.polygon([(w, h), (w - s2, h), (w, 0)], fill=0)
    return tape, cut


def photocopy(img, seed=3):
    rng = np.random.default_rng(seed)
    a = np.array(img.convert("L"), dtype=np.float32) / 255
    a = np.clip((a - 0.04) / 0.86, 0, 1) ** 1.05          # crush blacks, push contrast
    a = a + rng.normal(0, 0.022, a.shape)                  # toner grain
    specks = rng.random(a.shape)
    a[specks > 0.9993] = 0.0                               # black toner dots
    a[specks < 0.0004] = 1.0                               # dropouts
    streak = np.zeros(a.shape[1]); idx = rng.integers(0, a.shape[1], 3)
    streak[idx] = rng.uniform(0.04, 0.09, 3)
    a = a + np.convolve(streak, np.ones(3) / 3, "same")[None, :]  # faint drum streaks
    out = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--text", default="ZVEZDA IRAD")
    ap.add_argument("--at", default="0.5,0.62")
    ap.add_argument("--angle", type=float, default=-2.5)
    ap.add_argument("--height", type=int, default=78)
    ap.add_argument("--size", type=int, default=1000)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--border", type=float, default=0.035, help="white print margin, fraction of width (0 = none)")
    a = ap.parse_args()
    photo = Image.open(a.src).convert("L")
    tape, cut = label(a.text, a.height, a.seed)
    rt = tape.rotate(a.angle, expand=True, resample=Image.BICUBIC)
    rc = cut.rotate(a.angle, expand=True, resample=Image.BICUBIC)
    cx, cy = (float(v) for v in a.at.split(","))
    x, y = int(cx * photo.width - rt.width / 2), int(cy * photo.height - rt.height / 2)
    shadow = Image.new("L", photo.size, 0); shadow.paste(rc, (x + 3, y + 4))
    shadow = shadow.filter(ImageFilter.GaussianBlur(3))
    photo = ImageChops.subtract(photo, shadow.point(lambda v: v * 0.35))
    photo.paste(rt, (x, y), rc)
    if a.border:  # the photo was a print: white paper margin round it
        b = int(photo.width * a.border)
        paper = Image.new("L", (photo.width + 2 * b, photo.height + 2 * b), 236)
        paper.paste(photo, (b, b)); photo = paper
    out = photocopy(photo, a.seed).resize((a.size, a.size), Image.LANCZOS)
    out.save(a.out, quality=90)


if __name__ == "__main__":
    main()
