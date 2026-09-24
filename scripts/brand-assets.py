#!/usr/bin/env python3
"""Rebuild public/brand from the lockups in Logos/.

    python3 scripts/brand-assets.py           # writes public/brand
    python3 scripts/brand-assets.py --check   # contact sheets to /tmp instead, writes nothing
    python3 scripts/brand-assets.py --admin   # also cuts ../Brikc-It-Admin/public/brand

The admin panel shows the same two lockups on the same near-black and has no copy
of the sources, so its files are cut from here too. Its ground is darker than the
shop's, which is the background to check them against.

Needs Pillow and nothing else. Run it by hand when the logos change; there is no
npm script, because this runs about once a year.

The two lockups arrive in different shapes and each has a trap in it.

The horizontal one is a JPEG, so it has no alpha and the background has to be
keyed out.  Flooding in from the corners is not enough: the mark is a brick in a
display frame, and the *inside* of that frame is a white panel the flood can
never reach, as is the bowl of the "b".  Keyed from the corners alone they stay
opaque, which looks like nothing at all on a white page and like a lit slab on
the black header — which is exactly what shipped.  So the enclosed white regions
are found as well, and anything big enough to be a panel rather than a highlight
on the brushed metal is keyed too.

The vertical one is a PNG that already carries good alpha, and its RGB under
that alpha is a leftover dark red gradient.  Key it by whiteness like the other
one and nothing matches, so the whole gradient survives as an opaque square —
the faint lighter rectangle that was sitting in the footer.  Its alpha is the
answer; use it and leave the colour alone.

Both are then unmatted (an edge pixel is a blend of the art and the white it was
rendered on, so the white is divided back out — otherwise every edge keeps a
pale fringe that only shows up on a dark background) and scaled premultiplied,
which is the other way to grow a fringe.  Saved with a lossy colour channel and an exact
alpha, because a soft alpha is what turns a clean cut-out back into a slab.
"""

import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "brand"
ADMIN = ROOT.parent / "Brikc-It-Admin" / "public" / "brand"

# A pixel this white is background; this dark is paint. In between it is an
# edge, and gets partial alpha.
WHITE, PAINT = 246, 198
# Enclosed white bigger than this is a panel, not a specular highlight.
PANEL = 1000
# Tall enough for a 3x screen: the header draws at 48px, the footer at 112px.
HEIGHT_WIDE, HEIGHT_STACKED = 288, 360
ICON = 256


def min_channel(rgb):
    r, g, b = rgb.split()
    return ImageChops.darker(ImageChops.darker(r, g), b)


def enclosed_white(white, seeded):
    """White regions the corner flood could not reach, largest first."""
    w, h = white.size
    px = seeded.load()
    seen = bytearray(w * h)
    out = []
    for y in range(h):
        for x in range(w):
            if px[x, y] != 255 or seen[y * w + x]:
                continue
            seed = (x, y)
            q, n, box = deque([(x, y)]), 0, [x, y, x, y]
            seen[y * w + x] = 1
            while q:
                cx, cy = q.popleft()
                n += 1
                box[0], box[1] = min(box[0], cx), min(box[1], cy)
                box[2], box[3] = max(box[2], cx), max(box[3], cy)
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and px[nx, ny] == 255:
                        seen[ny * w + nx] = 1
                        q.append((nx, ny))
            out.append((n, seed, tuple(box)))
    out.sort(reverse=True)
    return out


def key_white(rgb):
    """Cut a white-matted render out of its background. Returns RGBA."""
    mn = min_channel(rgb)
    w, h = rgb.size
    white = mn.point(lambda v: 255 if v >= WHITE else 0)

    seeded = white.copy()
    for corner in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        if seeded.getpixel(corner) == 255:
            ImageDraw.floodfill(seeded, corner, 128, thresh=0)
    core = seeded.point(lambda v: 255 if v == 128 else 0)

    panels = [c for c in enclosed_white(white, seeded) if c[0] >= PANEL]
    print(f"    keyed {len(panels)} enclosed panel(s): " +
          ", ".join(f"{n}px at {box}" for n, _, box in panels))
    # Fill them in `seeded`, where the region is 255 — filling `core`, where it
    # is 0 along with the whole mark, floods straight out into the artwork.
    for _, seed, _ in panels:
        ImageDraw.floodfill(seeded, seed, 200, thresh=0)
    core = ImageChops.lighter(core, seeded.point(lambda v: 255 if v == 200 else 0))

    # Feather: inside the keyed region alpha is 0, and for a few pixels around
    # its edge alpha follows how white the pixel is.
    span = WHITE - PAINT
    ramp = mn.point(lambda v: 0 if v >= WHITE else 255 if v <= PAINT else int(255 * (WHITE - v) / span))
    band = ImageChops.subtract(core.filter(ImageFilter.MaxFilter(7)), core)
    alpha = Image.new("L", rgb.size, 255)
    alpha = Image.composite(ramp, alpha, band)
    alpha = Image.composite(Image.new("L", rgb.size, 0), alpha, core)

    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return unmatte(out, band)


def unmatte(rgba, band):
    """Divide the white background back out of the partly-transparent edge."""
    px, bp = rgba.load(), band.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            if not bp[x, y]:
                continue
            r, g, b, a = px[x, y]
            if a == 0 or a == 255:
                continue
            f = a / 255
            px[x, y] = (*(min(255, max(0, round((c - 255 * (1 - f)) / f))) for c in (r, g, b)), a)
    return rgba


def scale(rgba, height):
    """Premultiplied resize — the plain one drags background colour into the edge."""
    w, h = rgba.size
    size = (max(1, round(w * height / h)), height)
    r, g, b, a = rgba.split()
    pre = [ImageChops.multiply(c, a) for c in (r, g, b)]
    pre = [c.resize(size, Image.LANCZOS) for c in pre]
    a2 = a.resize(size, Image.LANCZOS)
    ap = a2.load()
    for c in pre:
        cp = c.load()
        for y in range(size[1]):
            for x in range(size[0]):
                av = ap[x, y]
                cp[x, y] = 0 if av == 0 else min(255, round(cp[x, y] * 255 / av))
    return Image.merge("RGBA", (*pre, a2))


def blank_band(rgba):
    """The first row of the run of empty rows that splits mark from wordmark."""
    w, h = rgba.size
    a = rgba.getchannel("A").load()
    empty = [not any(a[x, y] > 8 for x in range(0, w, 2)) for y in range(h)]
    run = start = 0
    best = h
    for y, e in enumerate(empty + [False]):
        if e:
            if run == 0:
                start = y
            run += 1
        else:
            if run >= 3 and start > 0:
                best = start
                break
            run = 0
    return best


def build():
    """The three pieces of art at full resolution, cut out and unmatted."""
    wide = Image.open(ROOT / "Logos" / "Logo Horizontal.jpeg").convert("RGB")
    box = min_channel(wide).point(lambda v: 255 if v < 240 else 0).getbbox()
    wide = wide.crop((box[0] - 8, box[1] - 8, box[2] + 8, box[3] + 8))
    print(f"  horizontal: source {wide.size}")
    wide = key_white(wide)

    tall = Image.open(ROOT / "Logos" / "Logo Vertical.png").convert("RGBA")
    tall = tall.crop(tall.getchannel("A").getbbox())
    print(f"  vertical: source {tall.size}, using its own alpha")

    # The favicon is the mark alone, taken off the top of the vertical lockup —
    # the only copy of it whose frame is empty rather than filled with white.
    # The lockup splits at the one band of blank rows between mark and wordmark.
    mark = tall.crop((0, 0, tall.width, blank_band(tall)))
    mark = mark.crop(mark.getchannel("A").getbbox())
    side = max(mark.size) + max(mark.size) // 12
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.alpha_composite(mark, ((side - mark.width) // 2, (side - mark.height) // 2))
    print(f"  mark: {mark.size} squared to {square.size}")

    return {"wide": wide, "tall": tall, "mark": square}


# Where each cut-out lands, and how tall. The admin's sizes are its own, kept as
# they were so nothing in its layout shifts.
OUTPUTS = [
    (OUT, "logo.webp", "wide", HEIGHT_WIDE),
    (OUT, "logo-stacked.webp", "tall", HEIGHT_STACKED),
    (OUT, "icon.png", "mark", ICON),
    # The payment email's header. PNG because Outlook on Windows can't show WebP,
    # and 96 tall because it's shown at 40 — sharp on a phone's 2x screen.
    (OUT, "logo-email.png", "wide", 96),
]
ADMIN_OUTPUTS = [
    (ADMIN, "logo.png", "wide", 96),
    (ADMIN, "logo-stacked.png", "tall", 480),
    (ADMIN, "icon.png", "mark", ICON),
]


def main():
    check = "--check" in sys.argv
    art = build()
    targets = OUTPUTS + (ADMIN_OUTPUTS if "--admin" in sys.argv else [])

    for folder, name, piece, height in targets:
        im = scale(art[piece], height)
        where = "admin" if folder is ADMIN else "shop"
        if check:
            sheet = Image.new("RGB", (im.width * 2 + 30, im.height + 20), (128, 128, 128))
            for i, bg in enumerate([(11, 11, 13), (245, 245, 245)]):
                tile = Image.new("RGBA", im.size, bg + (255,))
                tile.alpha_composite(im)
                sheet.paste(tile.convert("RGB"), (10 + i * (im.width + 10), 10))
            path = Path("/tmp") / f"check-{where}-{name}.png"
            sheet.save(path)
            print(f"  {where}/{name}: contact sheet -> {path}")
            continue
        if not folder.is_dir():
            print(f"  {where}/{name}: SKIPPED, {folder} is not there")
            continue
        path = folder / name
        if path.suffix == ".png":
            im.save(path, "PNG", optimize=True)
        else:
            # Lossy for the colour, which is a glossy render and survives it;
            # alpha_quality=100 keeps the cut-out itself exact, and a soft alpha
            # is the one thing that would put the slab back.
            im.save(path, "WEBP", quality=90, alpha_quality=100, method=6)
        print(f"  {where}/{name}: {im.size} -> {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
