#!/usr/bin/env python3
"""Cairn 'big dot' concepts: fixed dot size, the unit adapts. Sample data only."""
import sys, os
OUT = sys.argv[1]
W, H, S = 1179, 2556, 3            # iPhone 6.1" Dynamic Island
BG, PAST, FUT, ACC, LABEL, ROSE = "#0C0A09", "#E7E5E4", "#292524", "#F59E0B", "#78716C", "#EF4444"
FONT = "Geist, Inter, sans-serif"
COLS, PITCH, D = 13, 20*S, 12*S    # 20 pt pitch, 12 pt dot
# Font Awesome Free 6 solid (CC BY 4.0, https://fontawesome.com/license/free): (viewBox w, h, path). Mirrors packages/core/src/render.ts.
ICONS = {
    "heart": (512, 512, "m47.6 300.4l180.7 168.7c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9l180.7-168.7c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141c-45.6-7.6-92 7.3-124.6 39.9l-12 12l-12-12c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5"),
    "gift": (512, 512, "m190.5 68.8l34.8 59.2H152c-22.1 0-40-17.9-40-40s17.9-40 40-40h2.2c14.9 0 28.8 7.9 36.3 20.8M64 88c0 14.4 3.5 28 9.6 40H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h448c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32h-41.6c6.1-12 9.6-25.6 9.6-40c0-48.6-39.4-88-88-88h-2.2c-31.9 0-61.5 16.9-77.7 44.4L256 85.5l-24.1-41C215.7 16.9 186.1 0 154.2 0H152c-48.6 0-88 39.4-88 88m336 0c0 22.1-17.9 40-40 40h-73.3l34.8-59.2c7.6-12.9 21.4-20.8 36.3-20.8h2.2c22.1 0 40 17.9 40 40M32 288v176c0 26.5 21.5 48 48 48h144V288zm256 224h144c26.5 0 48-21.5 48-48V288H288z"),
    "star": (576, 512, "M316.9 18c-5.3-11-16.5-18-28.8-18s-23.4 7-28.8 18L195 150.3L51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329l-24.6 145.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5l128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329l104.2-103.1c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7l-143.7-21.2z"),
}

def icon(name, cx, cy, width, fill):
    w, h, d = ICONS[name]; k = width/w
    return f'<path d="{d}" transform="translate({cx-w*k/2:.2f} {cy-h*k/2:.2f}) scale({k:.5f})" fill="{fill}"/>'

def t(y, s, size, fill, weight=400, spans=None):
    if spans:  # two separate texts meeting at the centre line: robust in every renderer
        (a, ca), (b, cb) = spans; gap = size*0.35
        return (f'<text x="{W/2-gap}" y="{y}" font-family="{FONT}" font-size="{size}" fill="{ca}" text-anchor="end">{a}</text>'
                f'<text x="{W/2}" y="{y}" font-family="{FONT}" font-size="{size}" fill="{cb}" text-anchor="middle">·</text>'
                f'<text x="{W/2+gap}" y="{y}" font-family="{FONT}" font-size="{size}" fill="{cb}" text-anchor="start">{b}</text>')
    return f'<text x="{W/2}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="middle">{s}</text>'
# Hand-printed peaks, one per cell. Mirrors peak() in packages/core/src/render.ts (same seed, same sequence).
def stone(i, cx, cy, fill):
    seed = (i * 2654435761 + 12345) % 4294967296
    def rnd():
        nonlocal seed
        seed = (seed * 1664525 + 1013904223) % 4294967296
        return seed / 4294967296
    w, h, lean, base = D * (0.95 + 0.35 * rnd()), D * (0.8 + 0.35 * rnd()), D * (rnd() - 0.5) * 0.45, D * 0.5
    left, right, apex = (-w / 2, base), (w / 2, base), (lean, base - h)
    def edge(a, b, parts):
        out = []
        for t in range(1, parts):
            u = t / parts
            x = a[0] + (b[0] - a[0]) * u + (rnd() - 0.5) * D * 0.07
            y = a[1] + (b[1] - a[1]) * u + (rnd() - 0.5) * D * 0.07
            out.append((x, y))
        return out
    pts = [left, *edge(left, apex, 3), apex, *edge(apex, right, 3), right, *edge(right, left, 2)]
    d = "M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + "Z"
    return f'<path d="{d}" transform="translate({cx:g} {cy:g})" fill="{fill}" stroke="{fill}" stroke-width="{D * 0.05:g}" stroke-linejoin="round"/>'

def heart(cx, cy, fill, s=D*1.2): return icon("heart", cx, cy, s, fill)
def gift(cx, cy, s=D*1.15): return icon("gift", cx, cy, s, ACC)
def star(cx, cy, fill, s=D*1.3): return icon("star", cx, cy, s, fill)

def grid(n, draw, cols=COLS):
    """draw(i, cx, cy) -> svg. Dry-stone wall like render.ts: rows laid bottom-up from `base`,
    left to right, every other row shifted half a stone, the block centred like render.ts.
    Returns (svg, y of the top row, y of the base row)."""
    x0 = (W - ((cols-1)*PITCH + PITCH/2)) / 2
    rows = (n + cols - 1)//cols
    base = round(H*BLOCK_CENTER + ((rows-1)*PITCH + TITLE_GAP + 15*S*0.75 - COUNTER_GAP) / 2)
    top_shift = (cols - (n - (rows-1)*cols)) * PITCH / 2   # incomplete top row centred, like a cairn's peak
    out = []
    for i in range(n):
        r, c = divmod(i, cols)
        out.append(draw(i, x0 + c*PITCH + (r % 2)*PITCH/2 + (top_shift if r == rows-1 else 0), base - r*PITCH))
    return "".join(out), base - (rows-1)*PITCH, base

def page(parts): return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect id="background" width="{W}" height="{H}" fill="{BG}"/>{"".join(parts)}</svg>\n'
BLOCK_CENTER, TITLE_GAP, COUNTER_GAP = 0.57, 32*S, 33*S   # mirrors LAYOUT in render.ts

# 1. Goal: one stone per day, target day is a symbol
n, done = 89, 25
g, yt, yb = grid(n, lambda i, x, y: star(x, y, ACC) if i == n-1 else stone(i, x, y, PAST if i <= done else FUT))
goal = page([t(yt-TITLE_GAP, "New York City Marathon", 44, LABEL, 700), f'<g id="days">{g}</g>',
             t(yb+COUNTER_GAP, "", 34, LABEL, spans=[(f"{n-done-1}d left", ACC), ("28%", LABEL)])])

# 2. Anniversary: 52 peaks, the weeks toward the next anniversary; years live in the counter
years, weeks = 8, 29
g, yt, yb = grid(52, lambda i, x, y: heart(x, y, ROSE) if i == weeks else stone(i, x, y, PAST if i < weeks else FUT))
ann = page([t(yt-TITLE_GAP, "In love with Elisa", 44, LABEL, 700), f'<g id="weeks">{g}</g>',
            t(yb+COUNTER_GAP, "", 34, LABEL, spans=[("8 years", ROSE), (f"{52-weeks} weeks to the 9th", LABEL)])])

# 3. Birthday: one stone per year of a 90-year life, the current year is a gift
age = 34
g, yt, yb = grid(90, lambda i, x, y: gift(x, y) if i == age else stone(i, x, y, PAST if i < age else FUT))
bday = page([t(yt-TITLE_GAP, "My life in years", 44, LABEL, 700), f'<g id="years">{g}</g>',
             t(yb+COUNTER_GAP, "34 years", 34, ACC)])

for name, s in [("concept-goal", goal), ("concept-anniversary", ann), ("concept-birthday", bday)]:
    open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8").write(s)
