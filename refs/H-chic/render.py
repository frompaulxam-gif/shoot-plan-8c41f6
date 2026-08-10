#!/usr/bin/env python3
"""Render 'kinda chic' carousel slides: photo, darkened, cream lowercase text centred."""
import os, sys, textwrap
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter

W, H = 1080, 1350                      # 4:5, matches the reference
FONT = "/System/Library/Fonts/HelveticaNeue.ttc"
FONT_IDX = 7                           # Light
CREAM = (242, 237, 226)
PHOTOS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "photos")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides")

def cover(img, w, h):
    """Scale and centre-crop to exactly w x h."""
    ar_t, ar_i = w / h, img.width / img.height
    if ar_i > ar_t:
        nh = h; nw = int(round(h * ar_i))
    else:
        nw = w; nh = int(round(w / ar_i))
    img = img.resize((nw, nh), Image.LANCZOS)
    return img.crop(((nw - w) // 2, (nh - h) // 2, (nw - w) // 2 + w, (nh - h) // 2 + h))

def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for wd in words:
        t = (cur + " " + wd).strip()
        if draw.textlength(t, font=font) <= max_w or not cur:
            cur = t
        else:
            lines.append(cur); cur = wd
    if cur: lines.append(cur)
    return lines

def scrim(img, strength=0.34):
    """Soft elliptical darkening centred on the text block, so cream type stays
    legible over bright areas (the neon sign, white outfits) without a hard box."""
    mask = Image.new("L", (img.width, img.height), 0)
    d = ImageDraw.Draw(mask)
    cx, cy = img.width // 2, int(img.height * 0.5)
    rx, ry = int(img.width * 0.46), int(img.height * 0.26)
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=int(255 * strength))
    mask = mask.filter(ImageFilter.GaussianBlur(radius=int(img.width * 0.10)))
    black = Image.new("RGB", img.size, (0, 0, 0))
    return Image.composite(black, img, mask)

def render(photo, line, out_path, dark=0.34):
    img = cover(Image.open(os.path.join(PHOTOS, photo)).convert("RGB"), W, H)
    img = ImageEnhance.Brightness(img).enhance(1 - dark)
    img = scrim(img)
    d = ImageDraw.Draw(img)
    size = 78
    font = ImageFont.truetype(FONT, size, index=FONT_IDX)
    max_w = int(W * 0.47)   # narrow measure: the reference stacks 3-5 short lines
    lines = wrap(d, line, font, max_w)
    while len(lines) > 6 and size > 46:
        size -= 6
        font = ImageFont.truetype(FONT, size, index=FONT_IDX)
        lines = wrap(d, line, font, max_w)
    lh = int(size * 1.30)
    total = lh * len(lines)
    y = (H - total) // 2
    for ln in lines:
        tw = d.textlength(ln, font=font)
        d.text(((W - tw) / 2, y), ln, font=font, fill=CREAM)
        y += lh
    img.save(out_path, "JPEG", quality=90, optimize=True)
    return out_path

if __name__ == "__main__":
    render(sys.argv[1], sys.argv[2], os.path.join(OUT, "_test.jpg"))
    print("wrote _test.jpg")
