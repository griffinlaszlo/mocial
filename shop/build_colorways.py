#!/usr/bin/env python3
"""
Generates the tee print colorways from griffinchairlift.png and the
desktop-icon cutout mocial uses to launch the shop.

Why hue-shift instead of flat color replacement: the jacket (#1388b9) and
helmet (#f0303d) are the only two regions with a color unique to that part -
everything else (pants, ski poles, the chair frame, line art itself) shares
the same near-black stroke color, so it can't be recolored independently
without new source art that puts pants on their own layer/fill. Goggles and
gloves share their color with the beer bottle and chair highlights for the
same reason. That's why only jacket + helmet vary across colorways today.

Run again after editing PRESETS or swapping in a new griffinchairlift.png:
    python3 build_colorways.py
"""
import colorsys
import os
from PIL import Image, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(os.path.dirname(HERE), "griffinchairlift.png")
OUT_DIR = os.path.join(HERE, "assets")
ICON_OUT = os.path.join(os.path.dirname(HERE), "griffinchairlift-icon.png")

JACKET_REF = (19, 136, 185)   # sampled from the source art
HELMET_REF = (240, 48, 61)

MAX_PRINT_WIDTH = 900    # web-sized print art used in the mockup
ICON_WIDTH = 320         # desktop-icon cutout (mocial displays it much smaller)

# Each preset only needs to name where jacket/helmet land - hue and
# saturation come from the hex, brightness keeps the original art's shading
# by scaling relative to the reference swatch above.
PRESETS = [
    {"slug": "og-blue",      "label": "OG Blue",      "jacket": None,      "helmet": None},
    {"slug": "blackout",     "label": "Blackout",     "jacket": "#202020", "helmet": "#4a4a4a"},
    {"slug": "powder-white", "label": "Powder White", "jacket": "#eef3f6", "helmet": "#cfe8f5"},
    {"slug": "sunset",       "label": "Sunset",       "jacket": "#ff7a3d", "helmet": "#ff3d7a"},
    {"slug": "forest",       "label": "Forest",       "jacket": "#2f6b3c", "helmet": "#d9a92b"},
    {"slug": "bruise",       "label": "Bruise",       "jacket": "#6a3fb5", "helmet": "#e63e8c"},
]


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb_to_hsv255(rgb):
    r, g, b = (c / 255.0 for c in rgb)
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return int(round(h * 255)), int(round(s * 255)), int(round(v * 255))


def circular_hue_lut(target, full=10, zero=28):
    """255 within `full` of the target hue, ramping to 0 by `zero` away."""
    lut = []
    for h in range(256):
        d = abs(h - target)
        d = min(d, 256 - d)
        if d <= full:
            lut.append(255)
        elif d >= zero:
            lut.append(0)
        else:
            lut.append(int(round(255 * (zero - d) / (zero - full))))
    return lut


def ramp_lut(lo, hi):
    """0 at/under lo, 255 at/over hi, linear between - a soft threshold."""
    lut = []
    for v in range(256):
        if v <= lo:
            lut.append(0)
        elif v >= hi:
            lut.append(255)
        else:
            lut.append(int(round(255 * (v - lo) / (hi - lo))))
    return lut


def scale_lut(factor):
    lut = []
    for v in range(256):
        lut.append(max(0, min(255, int(round(v * factor)))))
    return lut


def recolor_part(rgb_img, H, S, V, ref_rgb, target_hex):
    """Hue/sat replaced from target_hex; value scaled to preserve shading."""
    rh, rs, rv = rgb_to_hsv255(ref_rgb)
    th, ts, tv = rgb_to_hsv255(hex_to_rgb(target_hex))

    # Soft mask: full weight for pixels near the reference hue AND clearly
    # saturated (excludes the near-black/gray line art, which shares the
    # jacket/helmet's hue space but has almost no saturation). The ramp
    # (rather than a hard cutoff) is what keeps antialiased edges clean.
    weight = ImageChops.multiply(H.point(circular_hue_lut(rh)), S.point(ramp_lut(90, 150)))

    factor = tv / max(rv, 1)
    new_v = V.point(scale_lut(factor))
    new_h = Image.new("L", H.size, th)
    new_s = Image.new("L", H.size, ts)
    recolored_rgb = Image.merge("HSV", (new_h, new_s, new_v)).convert("RGB")

    return Image.composite(recolored_rgb, rgb_img, weight)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    src = Image.open(SRC).convert("RGBA")
    alpha = src.split()[3]
    bbox = alpha.getbbox()  # same crop for every variant so they line up

    rgb = src.convert("RGB")
    H, S, V = rgb.convert("HSV").split()

    for preset in PRESETS:
        out_rgb = rgb
        if preset["jacket"]:
            out_rgb = recolor_part(out_rgb, H, S, V, JACKET_REF, preset["jacket"])
        if preset["helmet"]:
            out_rgb = recolor_part(out_rgb, H, S, V, HELMET_REF, preset["helmet"])

        final = out_rgb.convert("RGBA")
        final.putalpha(alpha)
        final = final.crop(bbox)

        w, h = final.size
        if w > MAX_PRINT_WIDTH:
            final = final.resize((MAX_PRINT_WIDTH, round(h * MAX_PRINT_WIDTH / w)), Image.LANCZOS)

        out_path = os.path.join(OUT_DIR, "tee-" + preset["slug"] + ".png")
        final.save(out_path, optimize=True)
        print("wrote", out_path, final.size)

    # Desktop icon: always the original colorway, trimmed the same way
    icon_src = src.crop(bbox)
    w, h = icon_src.size
    icon = icon_src.resize((ICON_WIDTH, round(h * ICON_WIDTH / w)), Image.LANCZOS)
    icon.save(ICON_OUT, optimize=True)
    print("wrote", ICON_OUT, icon.size)


if __name__ == "__main__":
    main()
