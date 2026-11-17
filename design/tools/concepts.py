#!/usr/bin/env python3
"""Cairn 'big dot' concepts: fixed dot size, the unit adapts. Sample data only."""
import sys, os
OUT = sys.argv[1]
W, H, S = 1179, 2556, 3            # iPhone 6.1" Dynamic Island
BG, PAST, FUT, ACC, LABEL, ROSE = "#0C0A09", "#E7E5E4", "#292524", "#F59E0B", "#78716C", "#EF4444"
FONT = "Geist, Inter, sans-serif"
COLS, PITCH, D = 15, 20*S, 12*S    # 20 pt pitch, 12 pt dot
X0 = (W - ((COLS-1)*PITCH + D)) / 2 + D/2
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
# Hand-drawn stones, 100 wide centered on 0,0. Mirrors STONES in packages/core/src/render.ts.
STONES = [
    "M-50 8C-51-10-30-27 0-28S50-14 50 6 28 27 0 27-49 24-50 8Z",
    "M-48 12C-50-6-34-30-6-31S47-24 49-6 36 26 8 27-46 28-48 12Z",
    "M-50 4C-47-13-22-23 6-23S50-12 50 6 34 24 0 24-52 18-50 4Z",
    "M-44 10C-48-12-26-32 2-31S45-14 46 4 30 30 0 29-42 28-44 10Z",
    "M-50 10C-50-4-38-22-12-26S42-22 49-2 40 25 6 27-50 24-50 10Z",
]
def stone(i, cx, cy, fill): return f'<path d="{STONES[(i*3 + (i >> 2)) % len(STONES)]}" transform="translate({cx:g} {cy:g}) scale({D*1.2/100:g})" fill="{fill}"/>'
def heart(cx, cy, fill, s=D*1.2): return icon("heart", cx, cy, s, fill)
def gift(cx, cy, s=D*1.15): return icon("gift", cx, cy, s, ACC)
def star(cx, cy, fill, s=D*1.3): return icon("star", cx, cy, s, fill)

def grid(n, y0, draw, cols=COLS):
    """draw(i, cx, cy) -> svg. Last row is left aligned like the reference."""
    out = []
    for i in range(n):
        r, c = divmod(i, cols)
        out.append(draw(i, X0 + c*PITCH, y0 + r*PITCH))
    rows = (n + cols - 1)//cols
    return "".join(out), y0 + (rows-1)*PITCH

def page(parts): return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect id="background" width="{W}" height="{H}" fill="{BG}"/>{"".join(parts)}</svg>\n'
TITLE_Y, GRID_Y = 1105, 1200

# 1. Goal: one stone per day, target day is a symbol
n, done = 89, 25
g, yb = grid(n, GRID_Y, lambda i, x, y: star(x, y, ACC) if i == n-1 else stone(i, x, y, PAST if i <= done else FUT))
goal = page([t(TITLE_Y, "New York City Marathon", 44, LABEL), f'<g id="days">{g}</g>',
             t(yb+100, "", 34, LABEL, spans=[(f"{n-done-1}d left", ACC), ("28%", LABEL)])])

# 2. Anniversary: 52 stones, the weeks toward the next anniversary; years live in the counter
years, weeks = 8, 29
hy = GRID_Y
hx0 = W/2 - (years-1)*PITCH*1.15/2
hearts = "".join(heart(hx0 + i*PITCH*1.15, hy, ROSE, D*1.5) for i in range(years))
g, yb = grid(52, GRID_Y, lambda i, x, y: heart(x, y, ROSE) if i == weeks else stone(i, x, y, PAST if i < weeks else FUT), cols=13)
# centre a 13-column block
shift = (COLS-13)*PITCH/2
ann = page([t(TITLE_Y, "In love with Elisa", 44, LABEL), f'<g id="weeks" transform="translate({shift:g} 0)">{g}</g>',
            t(yb+100, "", 34, LABEL, spans=[("8 years", ROSE), (f"{52-weeks} weeks to the 9th", LABEL)])])

# 3. Birthday: one stone per year of a 90-year life, the current year is a gift
age = 34
g, yb = grid(90, GRID_Y, lambda i, x, y: gift(x, y) if i == age else stone(i, x, y, PAST if i < age else FUT))
bday = page([t(TITLE_Y, "My life in years", 44, LABEL), f'<g id="years">{g}</g>',
             t(yb+100, "", 34, LABEL, spans=[("34 years", ACC), ("56 ahead", LABEL)])])

for name, s in [("concept-goal", goal), ("concept-anniversary", ann), ("concept-birthday", bday)]:
    open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8").write(s)
