#!/usr/bin/env python3
"""Recreate the three day weather card, matching the supplied screenshot."""
from PIL import Image, ImageDraw, ImageFont
import math, os

HN = "/System/Library/Fonts/HelveticaNeue.ttc"
def f(sz, bold=False): return ImageFont.truetype(HN, sz, index=1 if bold else 0)

W, H = 1000, 268
CARD = (255, 255, 255)
INK, GREY, DIV = (26, 26, 26), (138, 138, 138), (222, 222, 222)
SUN, CLOUD = (255, 205, 46), (158, 158, 158)
BAR_H = 12

DAYS = [
    ("Thu", "13th", "sun",   "35", "18", (232, 68, 44)),
    ("Fri", "14th", "cloud", "28", "13", (242, 109, 61)),
    ("Sat", "15th", "cloud", "24", "11", (245, 148, 58)),
]

def sun(d, cx, cy, r):
    for i in range(8):
        a = math.radians(i * 45)
        x1, y1 = cx + math.cos(a) * (r + 7), cy + math.sin(a) * (r + 7)
        x2, y2 = cx + math.cos(a) * (r + 19), cy + math.sin(a) * (r + 19)
        d.line([x1, y1, x2, y2], fill=SUN, width=7)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=SUN)

def cloud_sun(d, cx, cy, r):
    # rays first so the cloud sits over them
    for i in range(8):
        a = math.radians(i * 45 - 20)
        x1, y1 = cx + math.cos(a) * (r + 6), cy + math.sin(a) * (r + 6)
        x2, y2 = cx + math.cos(a) * (r + 18), cy + math.sin(a) * (r + 18)
        d.line([x1, y1, x2, y2], fill=SUN, width=7)
    # a soft cloud from overlapping circles plus a base
    d.ellipse([cx - r - 4, cy - 10, cx + r * 0.5, cy + r * 0.85], fill=CLOUD)
    d.ellipse([cx - r * 0.45, cy - r * 0.9, cx + r * 0.95, cy + r * 0.6], fill=CLOUD)
    d.ellipse([cx - r * 0.05, cy - r * 0.35, cx + r + 6, cy + r * 0.85], fill=CLOUD)
    d.rounded_rectangle([cx - r - 4, cy + r * 0.2, cx + r + 6, cy + r * 0.9], radius=int(r * 0.45), fill=CLOUD)

img = Image.new("RGB", (W, H), CARD)
d = ImageDraw.Draw(img)
colw = W / 3

for i, (day, date, icon, hi, lo, bar) in enumerate(DAYS):
    x0 = i * colw
    if i:  # divider
        d.line([x0, 16, x0, H - BAR_H - 16], fill=DIV, width=2)

    # heading, day bold then the date in grey beside it
    fb, fr = f(40, True), f(40)
    wd = d.textlength(day + " ", font=fb); wt = d.textlength(date, font=fr)
    tx = x0 + (colw - (wd + wt)) / 2
    d.text((tx, 26), day + " ", font=fb, fill=INK)
    d.text((tx + wd, 26), date, font=fr, fill=GREY)

    # icon on the left of the column, temps on the right
    icx, icy = x0 + colw * 0.31, 158
    (sun if icon == "sun" else cloud_sun)(d, icx, icy, 27)

    fh, fl = f(46, True), f(44)
    hx = x0 + colw * 0.60
    d.text((hx, 118), hi + "°", font=fh, fill=INK)
    d.text((hx, 172), lo + "°", font=fl, fill=GREY)

    d.rectangle([x0 + 2, H - BAR_H, x0 + colw - 2, H], fill=bar)

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "weather-card.png")
img.save(out)
print("wrote", out, img.size)
