"""Make a generated image look like it came out of an ordinary camera.

    python3 tools/comfyui/camera_look.py in.png out.jpg [--strength 1.0] [--seed N]

Steps, all subtle: a little lens softness, slight chromatic aberration toward
the corners, vignetting, a gentle desaturation and a faint colour cast,
luminance-weighted sensor noise, then JPEG compression at quality 85.
--strength scales everything (0.5 = lighter, 1.5 = heavier).
"""
import argparse
import numpy as np
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("dst")
ap.add_argument("--strength", type=float, default=1.0)
ap.add_argument("--seed", type=int, default=0)
a = ap.parse_args()
s = a.strength
rng = np.random.default_rng(a.seed)

im = Image.open(a.src).convert("RGB")
W, H = im.size

# 1. lens softness: generated images are sharp edge to edge
im = im.filter(ImageFilter.GaussianBlur(0.45 * s))
x = np.asarray(im).astype(np.float32) / 255.0

# 2. lateral chromatic aberration: scale red out and blue in, slightly
def scale_channel(ch, k):
    img = Image.fromarray((ch * 255).clip(0, 255).astype(np.uint8))
    nw, nh = round(W * k), round(H * k)
    big = img.resize((nw, nh), Image.BICUBIC)
    l, t = (nw - W) // 2, (nh - H) // 2
    if k >= 1:
        out = big.crop((l, t, l + W, t + H))
    else:
        out = Image.new("L", (W, H)); out.paste(big, (-l, -t))
        out = Image.fromarray(np.where(np.asarray(out) == 0, (ch * 255).astype(np.uint8), np.asarray(out)))
    return np.asarray(out).astype(np.float32) / 255.0
ca = 0.0012 * s
x[..., 0] = scale_channel(x[..., 0], 1 + ca)
x[..., 2] = scale_channel(x[..., 2], 1 - ca)

# 3. vignette
yy, xx = np.mgrid[0:H, 0:W]
r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / np.sqrt(2)
x *= (1 - 0.22 * s * r ** 2.2)[..., None]

# 4. tone: lift blacks a touch, pull saturation down, faint warm/green cast
lum = x @ np.array([0.299, 0.587, 0.114], np.float32)
x = lum[..., None] + (x - lum[..., None]) * (1 - 0.12 * s)
x = 0.015 * s + x * (1 - 0.03 * s)
x *= np.array([1.0 + 0.01 * s, 1.0 + 0.006 * s, 1.0 - 0.012 * s], np.float32)

# 5. sensor noise, stronger in the shadows, slightly chroma-correlated
lum = (x @ np.array([0.299, 0.587, 0.114], np.float32))[..., None]
sigma = (0.012 + 0.018 * (1 - lum)) * s
mono = rng.normal(0, 1, (H, W, 1)).astype(np.float32)
chroma = rng.normal(0, 0.35, (H, W, 3)).astype(np.float32)
x = x + sigma * (mono + chroma)

Image.fromarray((x.clip(0, 1) * 255).round().astype(np.uint8)).save(a.dst, quality=85, subsampling=2)
print("saved", a.dst)
