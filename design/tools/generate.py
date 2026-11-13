#!/usr/bin/env python3
"""Cairn design assets generator.
Usage: python3 generate.py <output-dir>
Produces SVG wallpaper templates, examples, shapes, foundations, cover, app flow and design tokens.
Safe-area insets are PROVISIONAL and must be measured on real devices."""
import json, os, sys, math
from datetime import date

OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
FONT = "Geist, Inter, sans-serif"

PRIM = {
 "stone/50":"#FAFAF9","stone/100":"#F5F5F4","stone/200":"#E7E5E4","stone/300":"#D6D3D1","stone/400":"#A8A29E",
 "stone/500":"#78716C","stone/600":"#57534E","stone/700":"#44403C","stone/800":"#292524","stone/900":"#1C1917","stone/950":"#0C0A09",
 "amber/300":"#FCD34D","amber/400":"#FBBF24","amber/500":"#F59E0B","amber/600":"#D97706",
 "terracotta/400":"#E07A5F","terracotta/500":"#C8553D","terracotta/600":"#A63F2B",
 "rose/400":"#FB7185","rose/500":"#F43F5E","sage/400":"#A3B18A","sage/500":"#6B8F5E",
 "sky/400":"#38BDF8","sky/500":"#0EA5E9","base/white":"#FFFFFF","base/black":"#000000",
}
# name: (dark primitive, light primitive)
THEME = {
 "wallpaper/bg":("stone/950","stone/100"), "wallpaper/past":("stone/200","stone/700"),
 "wallpaper/future":("stone/800","stone/300"), "wallpaper/current":("amber/500","terracotta/500"),
 "wallpaper/label":("stone/500","stone/500"),
 "event/love":("rose/400","rose/500"), "event/milestone":("amber/300","amber/600"),
 "event/journey":("sky/400","sky/500"), "event/growth":("sage/400","sage/500"),
 "ui/bg/default":("stone/950","stone/50"), "ui/bg/surface":("stone/900","base/white"),
 "ui/bg/elevated":("stone/800","stone/100"), "ui/text/primary":("stone/50","stone/900"),
 "ui/text/secondary":("stone/400","stone/600"), "ui/text/muted":("stone/500","stone/500"),
 "ui/border/default":("stone/800","stone/200"), "ui/border/strong":("stone/600","stone/400"),
 "ui/accent/default":("amber/500","terracotta/500"), "ui/accent/on":("stone/950","base/white"),
 "guide/unsafe":("rose/500","rose/500"),
}
SIZE = {"spacing/1":4,"spacing/2":8,"spacing/3":12,"spacing/4":16,"spacing/6":24,"spacing/8":32,"spacing/12":48,
        "radius/sm":6,"radius/md":10,"radius/lg":16,"radius/full":9999}

def T(mode):
    i = 0 if mode == "dark" else 1
    return {k: PRIM[v[i]] for k, v in THEME.items()}

# id, models, width px, height px, native scale, cutout
DEVICES = [
 ("iphone-5.4-mini","12 mini, 13 mini",1080,2340,2.88,"notch"),
 ("iphone-6.1-notch","12, 12 Pro, 13, 13 Pro, 14",1170,2532,3,"notch"),
 ("iphone-6.1-island","14 Pro, 15, 15 Pro, 16",1179,2556,3,"island"),
 ("iphone-6.3","16 Pro, 17, 17 Pro",1206,2622,3,"island"),
 ("iphone-6.5-air","iPhone Air",1260,2736,3,"island"),
 ("iphone-6.7-notch","12 Pro Max, 13 Pro Max, 14 Plus",1284,2778,3,"notch"),
 ("iphone-6.7-island","14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus",1290,2796,3,"island"),
 ("iphone-6.9","16 Pro Max, 17 Pro Max",1320,2868,3,"island"),
]
# PROVISIONAL insets in points. Not from Apple. Measure on device (PLAN section 7.1b).
INSET_PT = {"top":280,"bottom":110,"side":28}
COLS, ROWS = 52, 80

def layout(W, H, scale):
    top, bottom, side = (round(INSET_PT[k]*scale) for k in ("top","bottom","side"))
    sw, sh = W-2*side, H-top-bottom
    pitch = min(sw//COLS, sh//ROWS)
    d = round(pitch*0.68)
    if (pitch-d) % 2: d -= 1
    gw, gh = pitch*COLS, pitch*ROWS
    gx, gy = side+(sw-gw)//2, top+(sh-gh)//2
    return dict(top=top,bottom=bottom,side=side,sw=sw,sh=sh,pitch=pitch,d=d,gw=gw,gh=gh,gx=gx,gy=gy)

def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">\n{body}\n</svg>\n'

def text(x, y, s, size, fill, weight=400, anchor="start", extra=""):
    return f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" {extra}>{s}</text>'

def write(path, content):
    p = os.path.join(OUT, path); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8").write(content)

# ---------- shapes (drawn in a box of side s centred at cx, cy)
HEART = "M24 42C24 42 6 30 6 17.5C6 11 11 6 17 6C20.5 6 23 8 24 10.5C25 8 27.5 6 31 6C37 6 42 11 42 17.5C42 30 24 42 24 42Z"
SHAPES = ["circle","square","rounded","diamond","heart","star"]

def shape(kind, cx, cy, s, color, outline=False, opacity=1.0):
    sw = max(1.5, s*0.11) if outline else 0
    paint = (f'fill="none" stroke="{color}" stroke-width="{sw:.2f}" stroke-linejoin="round"' if outline else f'fill="{color}"')
    if opacity < 1: paint += f' opacity="{opacity}"'
    r = s/2 - sw/2
    if kind == "circle":
        return f'<circle cx="{cx}" cy="{cy}" r="{r:.2f}" {paint}/>'
    if kind in ("square","rounded"):
        rx = r*0.45 if kind == "rounded" else 0
        return f'<rect x="{cx-r:.2f}" y="{cy-r:.2f}" width="{2*r:.2f}" height="{2*r:.2f}" rx="{rx:.2f}" {paint}/>'
    if kind == "diamond":
        pts = f"{cx},{cy-r:.2f} {cx+r:.2f},{cy} {cx},{cy+r:.2f} {cx-r:.2f},{cy}"
        return f'<polygon points="{pts}" {paint}/>'
    if kind == "star":
        pts = []
        for i in range(10):
            rad = r if i % 2 == 0 else r*0.45
            a = -math.pi/2 + i*math.pi/5
            pts.append(f"{cx+rad*math.cos(a):.2f},{cy+rad*math.sin(a)+r*0.05:.2f}")
        return f'<polygon points="{" ".join(pts)}" {paint}/>'
    if kind == "heart":
        k = (s - sw)/36  # heart path spans 36 units (6..42)
        return f'<path d="{HEART}" transform="translate({cx-24*k:.2f} {cy-24*k:.2f}) scale({k:.4f})" {paint.replace(f"{sw:.2f}", f"{sw/k:.2f}") if outline else paint}/>'
    raise ValueError(kind)

# ---------- wallpaper template (guides only)
def template(dev):
    id_, models, W, H, scale, cut = dev
    L = layout(W, H, scale); t = T("dark"); g = t["guide/unsafe"]; fs = round(W*0.021)
    b = [f'<rect id="background" width="{W}" height="{H}" fill="{t["wallpaper/bg"]}"/>', '<g id="guides-provisional">']
    b.append(f'<rect id="unsafe-top" x="0" y="0" width="{W}" height="{L["top"]}" fill="{g}" opacity="0.16"/>')
    b.append(f'<rect id="unsafe-bottom" x="0" y="{H-L["bottom"]}" width="{W}" height="{L["bottom"]}" fill="{g}" opacity="0.16"/>')
    b.append(f'<rect id="unsafe-left" x="0" y="{L["top"]}" width="{L["side"]}" height="{L["sh"]}" fill="{g}" opacity="0.10"/>')
    b.append(f'<rect id="unsafe-right" x="{W-L["side"]}" y="{L["top"]}" width="{L["side"]}" height="{L["sh"]}" fill="{g}" opacity="0.10"/>')
    if cut == "island":
        cw, ch, cy = round(126*scale), round(37*scale), round(11*scale)
        b.append(f'<rect id="dynamic-island-schematic" x="{(W-cw)//2}" y="{cy}" width="{cw}" height="{ch}" rx="{ch//2}" fill="#000000" stroke="{g}" stroke-width="2"/>')
    else:
        cw, ch = round(160*scale), round(34*scale)
        b.append(f'<rect id="notch-schematic" x="{(W-cw)//2}" y="{-ch}" width="{cw}" height="{2*ch}" rx="{round(ch*0.6)}" fill="#000000" stroke="{g}" stroke-width="2"/>')
    b.append(text(W//2, round(L["top"]*0.50), "UNSAFE TOP: date, clock, widgets", fs, g, 600, "middle"))
    b.append(text(W//2, round(L["top"]*0.50)+round(fs*1.5), f'provisional {INSET_PT["top"]} pt = {L["top"]} px. Measure on device', fs, g, 400, "middle"))
    b.append(text(W//2, H-L["bottom"]//2, f'UNSAFE BOTTOM: flashlight, camera, home indicator ({INSET_PT["bottom"]} pt = {L["bottom"]} px, provisional)', round(fs*0.8), g, 600, "middle"))
    b.append('</g>')
    b.append(f'<rect id="safe-area" x="{L["side"]}" y="{L["top"]}" width="{L["sw"]}" height="{L["sh"]}" fill="none" stroke="{g}" stroke-width="2" stroke-dasharray="12 10"/>')
    b.append(f'<rect id="grid-area" x="{L["gx"]}" y="{L["gy"]}" width="{L["gw"]}" height="{L["gh"]}" fill="{t["wallpaper/future"]}" fill-opacity="0.35" stroke="{t["wallpaper/current"]}" stroke-width="2"/>')
    cx = W//2; cy = L["gy"]+L["gh"]//2; c = t["wallpaper/past"]
    lines = [(f"{id_}", 1.6, 600), (models, 1.0, 400), (f"{W} x {H} px  |  scale {scale}x", 1.0, 400),
             (f"grid {COLS} x {ROWS}  |  {L['gw']} x {L['gh']} px", 1.0, 400), (f"pitch {L['pitch']} px  |  dot {L['d']} px", 1.0, 400)]
    y = cy - round(fs*4)
    for s, k, wgt in lines:
        b.append(text(cx, y, s, round(fs*1.3*k), c, wgt, "middle")); y += round(fs*2.2)
    return svg(W, H, "\n".join(b))

# ---------- example wallpaper (sample data, not a real person)
BIRTH = date(1992, 3, 10); TODAY = date(2026, 11, 11)
EVENTS = [  # label, date, yearly, shape, token, ghost future
 ("Engagement", date(2019, 9, 21), True, "heart", "event/love", True),
 ("Graduation", date(2016, 7, 15), False, "star", "event/milestone", False),
 ("Moved abroad", date(2021, 4, 3), False, "diamond", "event/journey", False),
 ("First marathon", date(2023, 10, 8), False, "rounded", "event/growth", False),
]
def bday(y):
    try: return date(y, BIRTH.month, BIRTH.day)
    except ValueError: return date(y, 2, 28)
def cell(d):
    age = d.year - BIRTH.year - (1 if d < bday(d.year) else 0)
    last = bday(BIRTH.year + age)
    return age, min(COLS-1, (d - last).days // 7)
def anniv(d, y):
    try: return date(y, d.month, d.day)
    except ValueError: return date(y, 2, 28)

def example(dev, mode):
    id_, models, W, H, scale, cut = dev
    L = layout(W, H, scale); t = T(mode); p, d = L["pitch"], L["d"]
    now = cell(TODAY); now_i = now[0]*COLS + now[1]
    marks = {}
    for label, dt, yearly, shp, tok, ghost in EVENTS:
        years = range(dt.year, BIRTH.year+ROWS+1) if yearly else [dt.year]
        for y in years:
            a = anniv(dt, y); r, c = cell(a)
            if not (0 <= r < ROWS): continue
            future = a > TODAY
            if future and not ghost: continue
            marks.setdefault((r, c), (shp, t[tok], future))
    past, fut, ev = [], [], []
    for r in range(ROWS):
        for c in range(COLS):
            cx = L["gx"] + c*p + p/2; cy = L["gy"] + r*p + p/2
            cxs, cys = (f"{cx:g}", f"{cy:g}")
            i = r*COLS + c
            if (r, c) in marks:
                shp, col, future = marks[(r, c)]
                ev.append(shape(shp, cx, cy, p-1, col, outline=future, opacity=0.7 if future else 1))
            elif i == now_i: continue
            elif i < now_i: past.append(f'<circle cx="{cxs}" cy="{cys}" r="{d/2:g}"/>')
            else: fut.append(f'<circle cx="{cxs}" cy="{cys}" r="{d/2:g}"/>')
    ncx = L["gx"] + now[1]*p + p/2; ncy = L["gy"] + now[0]*p + p/2
    b = [f'<rect id="background" width="{W}" height="{H}" fill="{t["wallpaper/bg"]}"/>',
         f'<g id="weeks-future" fill="{t["wallpaper/future"]}">' + "".join(fut) + '</g>',
         f'<g id="weeks-past" fill="{t["wallpaper/past"]}">' + "".join(past) + '</g>',
         f'<g id="week-current"><circle cx="{ncx:g}" cy="{ncy:g}" r="{(p-1)/2:g}" fill="{t["wallpaper/current"]}"/></g>',
         '<g id="events">' + "".join(ev) + '</g>']
    return svg(W, H, "\n".join(b)), now_i

# ---------- build
os.makedirs(OUT, exist_ok=True)
for dev in DEVICES:
    write(f"wallpapers/templates/{dev[0]}_{dev[2]}x{dev[3]}.svg", template(dev))
dev63 = DEVICES[3]
for mode in ("dark", "light"):
    s, now_i = example(dev63, mode)
    write(f"wallpapers/examples/example_{dev63[0]}_{mode}.svg", s)

# shapes: individual + sheet
for k in SHAPES:
    for o in (False, True):
        write(f"shapes/cell-{k}-{'outline' if o else 'solid'}.svg", svg(48, 48, shape(k, 24, 24, 44, PRIM["stone/200"], o)))
b = [f'<rect width="760" height="330" rx="24" fill="{PRIM["stone/950"]}"/>', text(40, 56, "Cairn shapes", 24, PRIM["stone/50"], 600)]
for i, k in enumerate(SHAPES):
    x = 90 + i*116
    b.append(shape(k, x, 130, 56, PRIM["stone/200"])); b.append(shape(k, x, 220, 56, PRIM["stone/200"], True))
    b.append(text(x, 290, k, 15, PRIM["stone/400"], 400, "middle"))
write("shapes/shapes-sheet.svg", svg(760, 330, "\n".join(b)))

# foundations specimen
def swatch_block(title, items, x, y, bg, fg, sub):
    o = [text(x, y, title, 20, fg, 600)]
    for i, (name, hx) in enumerate(items):
        cx = x + (i % 6)*200; cy = y + 24 + (i//6)*108
        o.append(f'<rect x="{cx}" y="{cy}" width="180" height="56" rx="10" fill="{hx}" stroke="{sub}" stroke-opacity="0.35"/>')
        o.append(text(cx, cy+76, name, 13, fg, 500)); o.append(text(cx, cy+93, hx, 12, sub))
    return o, y + 24 + ((len(items)+5)//6)*108 + 30
b = [f'<rect width="1280" height="1780" fill="{PRIM["stone/950"]}"/>', text(40, 70, "Cairn foundations", 40, PRIM["stone/50"], 600),
     text(40, 104, "Primitives and semantic theme tokens. Dark is the default mode.", 16, PRIM["stone/400"])]
y = 160
o, y = swatch_block("Primitives", list(PRIM.items()), 40, y, None, PRIM["stone/50"], PRIM["stone/400"]); b += o
o, y = swatch_block("Theme / Dark", list(T("dark").items()), 40, y, None, PRIM["stone/50"], PRIM["stone/400"]); b += o
b.append(f'<rect x="0" y="{y-20}" width="1280" height="{1780-(y-20)}" fill="{PRIM["stone/50"]}"/>')
o, y = swatch_block("Theme / Light", list(T("light").items()), 40, y+30, None, PRIM["stone/900"], PRIM["stone/600"]); b += o
write("foundations/foundations.svg", svg(1280, 1780, "\n".join(b)))

# cover
c = PRIM
b = [f'<rect width="1600" height="900" fill="{c["stone/950"]}"/>',
     f'<ellipse cx="1210" cy="610" rx="170" ry="62" fill="{c["stone/700"]}"/>',
     f'<ellipse cx="1200" cy="492" rx="120" ry="50" fill="{c["stone/400"]}"/>',
     f'<ellipse cx="1212" cy="396" rx="78" ry="38" fill="{c["stone/200"]}"/>',
     f'<ellipse cx="1204" cy="326" rx="40" ry="24" fill="{c["amber/500"]}"/>',
     text(120, 420, "Cairn", 168, c["stone/50"], 600),
     text(126, 492, "Your life in weeks, with the moments that mark the path.", 30, c["stone/400"]),
     text(126, 760, "iPhone lock screen wallpaper generator  |  Design file", 20, c["stone/500"])]
write("cover/cover.svg", svg(1600, 900, "\n".join(b)))

# app flow
def card(x, y, w, h, n, title, lines):
    o = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="{c["stone/900"]}" stroke="{c["stone/800"]}" stroke-width="1.5"/>',
         text(x+24, y+40, n, 13, c["amber/500"], 600), text(x+24, y+70, title, 21, c["stone/50"], 600)]
    for i, l in enumerate(lines): o.append(text(x+24, y+104+i*24, l, 14.5, c["stone/400"]))
    return o
def arrow(x1, y, x2):
    return [f'<line x1="{x1+8}" y1="{y}" x2="{x2-16}" y2="{y}" stroke="{c["amber/500"]}" stroke-width="2"/>',
            f'<polygon points="{x2-18},{y-6} {x2-6},{y} {x2-18},{y+6}" fill="{c["amber/500"]}"/>']
def row(y, items, w, h, gap, x0, prefix):
    o = []
    for i, (title, lines) in enumerate(items):
        x = x0 + i*(w+gap); o += card(x, y, w, h, f"{prefix}{i+1}", title, lines)
        if i < len(items)-1: o += arrow(x+w, y+h//2, x+w+gap)
    return o
user = [("Landing", ["What Cairn is", "Sample wallpapers", "CTA: Create yours"]),
        ("Setup", ["Birth date, lifespan", "iPhone model", "Time zone (auto)", "Theme and base shape"]),
        ("Events", ["Add, edit, reorder", "Date and recurrence", "Shape, color, size, fill", "Ghost future anniversaries"]),
        ("Preview", ["Live SVG in iPhone frame", "Top and bottom inset sliders", "Dark and light check"]),
        ("Install", ["Copy wallpaper URL", "Shortcut checklist", "Download PNG once"])]
system = [("iOS Shortcut", ["Automation, daily 6:00", "Run Immediately"]),
          ("GET /w/config.png", ["Get Contents of URL", "CDN cache hit or miss"]),
          ("Decode + validate", ["base64url, inflate", "Schema version v"]),
          ("render(config, now)", ["packages/core", "Pure function, SVG out"]),
          ("resvg-js", ["SVG to PNG", "Native device pixels"]),
          ("Set Wallpaper Photo", ["Lock Screen", "No crop, no preview"])]
b = [f'<rect width="1920" height="820" fill="{c["stone/950"]}"/>', text(40, 70, "Cairn app flow", 36, c["stone/50"], 600),
     text(40, 130, "USER FLOW", 14, c["stone/500"], 600, extra='letter-spacing="2"')]
b += row(150, user, 320, 230, 50, 40, "STEP ")
b.append(text(40, 480, "SYSTEM FLOW (every day, no user action)", 14, c["stone/500"], 600, extra='letter-spacing="2"'))
b += row(500, system, 268, 170, 46, 40, "")
b.append(text(40, 740, "The same render(config, now) runs in the browser preview and on the server, so the preview matches the wallpaper.", 15, c["stone/400"]))
write("app-flow/app-flow.svg", svg(1920, 820, "\n".join(b)))

# ---------- tokens
def rgb(h): return [round(int(h[i:i+2], 16)/255, 4) for i in (1, 3, 5)]
def color_tok(h): return {"$type": "color", "$value": {"colorSpace": "srgb", "components": rgb(h), "alpha": 1, "hex": h}}
def nest(flat, leaf):
    root = {}
    for name, v in flat.items():
        node = root; parts = name.split("/")
        for p in parts[:-1]: node = node.setdefault(p, {})
        node[parts[-1]] = leaf(v)
    return root
write("tokens/figma/primitives.tokens.json", json.dumps(nest(PRIM, color_tok), indent=2))
write("tokens/figma/theme.dark.tokens.json", json.dumps(nest(T("dark"), color_tok), indent=2))
write("tokens/figma/theme.light.tokens.json", json.dumps(nest(T("light"), color_tok), indent=2))
write("tokens/figma/size.tokens.json", json.dumps(nest(SIZE, lambda v: {"$type": "number", "$value": v}), indent=2))
write("tokens/tokens.json", json.dumps({"primitives": PRIM, "theme": {"dark": T("dark"), "light": T("light")},
      "themeAliases": {k: {"dark": v[0], "light": v[1]} for k, v in THEME.items()}, "size": SIZE,
      "devices": [dict(id=d[0], models=d[1], width=d[2], height=d[3], scale=d[4], cutout=d[5], provisionalInsetsPt=INSET_PT, **{k: layout(d[2], d[3], d[4])[k] for k in ("pitch", "d", "gx", "gy", "gw", "gh")}) for d in DEVICES]}, indent=2))
v = lambda n: "--" + n.replace("/", "-")
css = ["/* Cairn design tokens. Generated by tools/generate.py */", "@theme {"]
css += [f"  --color-{n.replace('base/','').replace('/','-')}: {h};" for n, h in PRIM.items()]
css += [f"  {v(n)}: {x}px;" for n, x in SIZE.items()] + ["}", "", ":root, [data-theme='dark'] {"]
css += [f"  {v(n)}: var(--color-{a[0].replace('base/','').replace('/','-')});" for n, a in THEME.items()] + ["}", "", "[data-theme='light'] {"]
css += [f"  {v(n)}: var(--color-{a[1].replace('base/','').replace('/','-')});" for n, a in THEME.items()] + ["}", ""]
write("tokens/cairn.css", "\n".join(css))

print("now week index:", now_i, "of", COLS*ROWS)
for d in DEVICES: print(d[0], d[2], d[3], layout(d[2], d[3], d[4]))
