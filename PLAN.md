# PLAN: Cairn

A free, open-source web app to design a razor-sharp iPhone lock screen wallpaper that shows your time as a grid of dots, with **a rich live editor** and **personal events that live on the grid**, including anniversaries that add a new symbol every year.

> Revision 4 (2026-11-12). Editor with live preview. Three themes: Birthday, Anniversary, Goal. **Big dots at a fixed size; the unit adapts, the dots never shrink.** No branding, everything free.

---

## 1. Vision

A cairn is a pile of stones that marks a path. Each week is a stone; the moments that matter get a different shape.

- **Editor first**: a live iPhone preview next to a customization form. What you see is exactly what lands on the lock screen.
- **Three themes, each with its own symbol**: Birthday (a gift, your life in years), Anniversary (hearts, weeks toward the next one), Goal (a symbol you pick, such as a runner for a marathon).
- **Symbols that count**: a label like "8 years in love with Elisa" where the 8 is drawn as eight hearts. Every year adds one more symbol. No competitor found so far does this.
- **Sharper output**: vector rendering, rasterized at the device's exact native resolution.
- **Free, with no paywall**: every feature is available to everyone. No accounts, no forced branding.
- **Private by design**: the whole configuration lives in the URL. Nothing is stored on a server.

### Product principles

1. Everything is free. No premium tier, no locked fields.
2. No account, no database, no tracking of personal data.
3. Running cost must stay at zero (see section 11).
4. Open source (MIT) and portfolio-grade: tests, docs, ADRs.

### Non-goals (v1)

- Android support (same endpoint later, via a MacroDroid-style automation).
- Accounts, sync, or saved wallpapers on a server.
- Habit tracking and quotes (possible later, see roadmap).
- A plain Year calendar (365 dots) as a separate theme; it can come later.
- Multi-language UI (English only).

---

## 2. Reference analysis

### 2.1 thelifecalendar.com

| Aspect | What it does |
|---|---|
| Calendar types | Life (weeks), Year (365 dots), Goal (countdown) |
| Input | Birthday + iPhone model only |
| Delivery | Generated URL that returns an image |
| Automation | iOS Shortcut: daily at 6:00 AM, `Get Contents of URL` then `Set Wallpaper Photo` (Lock Screen), with *Crop to Subject* and *Show Preview* disabled |
| Customization | None visible |

Inspected up to the "Define your Wallpaper" step only.

### 2.2 weeklydots.com (main reference for the editor)

| Aspect | What it does |
|---|---|
| Calendar types | Life (about 4,680 dots, 90 years) and Year free; custom countdowns and habits are paid |
| Layout | Left: iPhone mockup with live preview (date, clock, wallpaper). Right: form. Tabs on top: Life, Year, Personal (locked), Habits |
| Fields | Birthday, title (paid), "lived / remaining" counters |
| Color | 9 preset dot colors |
| Background | Match, White, Black, iOS, Image |
| Dot shape | Circle, Square, Rounded, Custom |
| Grouping | None, Months, Decades, Full |
| Footer | None, Numbers, Quote |
| Other toggles | Axis labels (show/hide), branding (show/hide) |
| Actions | Download, Set Up Live Wallpaper |
| Themes | Obsidian, Ivory, Graphite, Ocean, Forest, Sunset |
| Pricing | Free tier; Premium $29 one-time (countdowns, habits, quotes, branding removal, multiple calendars) |

Not inspected: the "Set Up Live Wallpaper" flow and how their URL is built.

### 2.3 Where Cairn goes further

| Area | weeklydots | Cairn |
|---|---|---|
| Data | Birthday | Birthday, lifespan, time zone, iPhone model |
| Texts | Title is paid | Free title, subtitle and footer |
| Colors | 9 presets | Presets plus free pickers for past, future, current week, background |
| Shapes | 4 | Circle, square, rounded, diamond, heart, star; solid or outline |
| Grid | Grouping, axis labels | Grouping, axis labels, dot size, spacing, safe-area inset sliders |
| **Events** | None | Date, yearly recurrence, shape, color, ghost future anniversaries |
| Themes | Life and Year free | Birthday, Anniversary, Goal, all free |
| Symbols and labels | None | Flame, heart, custom icon; title and counter |
| Branding | Removal is paid | No branding at all |

---

## 3. Core concept: events and anniversaries

The Life grid has one cell per week of life: 52 columns by `lifespanYears` rows.

- **One-off event**: the cell containing `date` gets the event's shape and color.
- **Yearly event**: for every year from `date` up to the lifespan, the cell containing that day gets the symbol. Past ones are solid; future ones are optional outlined ghosts (`showFuture`).
- **Current week**: always marked with the theme's accent.

### Edge cases to handle

- Feb 29 anniversaries (fall back to Feb 28).
- Several events in the same cell (priority order).
- Events before the birth date or after the lifespan (ignored, with a form warning).
- Event cell equals the current cell.
- Week boundaries: week-of-life is counted from the birthday (week 0 starts on the birth date); document the rule.
- Time zone: "today" is computed in the user's IANA time zone, not the server's.

---

## 4. The editor (heart of the product)

### 4.1 Layout

- **Desktop**: two columns. Left, a sticky iPhone mockup with the live wallpaper, date and clock. Right, the scrollable form.
- **Mobile**: preview on top (collapsible), form below, sticky action bar.
- **Tabs** above the preview: Birthday, Anniversary, Goal.
- **Actions**: `Download PNG` and `Set up live wallpaper`.
- **Share**: the page URL always encodes the current config, so a link reopens the same design.

### 4.2 Form sections

| Section | Controls |
|---|---|
| Basics | Depends on the theme (see 4.3), plus iPhone model and time zone (auto-detected) |
| Symbol | Theme default (gift, heart) or an icon from the library; color and size |
| Label | Text with placeholders, e.g. `{count} years in love with Elisa`; show the count as a number, as symbols, or both |
| Text | Title, subtitle, footer (none, numbers "lived / remaining", custom text) |
| Colors | Preset palettes; pickers for background, past, future, current |
| Background | Match theme, solid color, black (OLED) |
| Dots | Base shape, solid or outline, size, spacing |
| Grid | Grouping (none, months, decades, both), axis labels on/off |
| Layout | Top and bottom inset sliders (safe area), horizontal margin |
| Events | List with add, edit, delete, reorder; per event: label, date, recurrence, shape, color, size, fill, ghost future |
| Lock screen preview | Toggle clock and widgets overlay to check collisions |

Counters "weeks lived / remaining" are shown in the form and optionally in the footer.

### 4.3 Themes

A theme sets the grid, the default symbol and the default label. Everything stays editable.

| Theme | What the dots show | Default symbol | Inputs | Example title and counter |
|---|---|---|---|---|
| **Birthday** (life) | One dot per year of a 90-year life (15 × 6); the current year is the gift | Gift | Birth date, lifespan (default 90) | "My life in years" / "34 years · 56 ahead" |
| **Anniversary** | 52 hearts for the weeks toward the next anniversary; the current week is red; completed years live in the counter | Heart | Start date, name or subject | "In love with Elisa" / "8 years · 23 weeks to the 9th" |
| **Goal** | One dot per day (or week) from a start date to the target; the target is the symbol | Picked by the user (runner, plane, book, trophy...) | Target date, optional start date, event name | "New York City Marathon" / "63d left · 28%" |

Concept drafts for the three themes: `wallpapers/concepts/` in the design kit.

How symbols are used:

1. **Symbols as units** (Anniversary): every unit of the grid is drawn as the symbol (hearts instead of dots); the current one takes the accent color.
2. **Marker** (Birthday): the current unit is drawn as the symbol instead of a dot (a gift).
3. **Target** (Goal): the last dot is the symbol; the counter shows the time left and the percentage.

Extra events (section 3) can still be added on top of any theme.

Icon library: a small curated set drawn as cell-sized glyphs (candle, heart, star, runner, bike, plane, mountain, book, graduation cap, trophy, ring, baby, home). Source: an open-source icon set with a permissive license, simplified so each glyph stays readable at dot size (about 36 px at 3x).

---

## 5. Architecture

Stateless and isomorphic: the same pure function renders the preview, the download and the live image.

```
 Browser (Nuxt/Vue)                         Vercel (Nitro server route)
 ┌────────────────────┐   config → URL      ┌────────────────────────────┐
 │ Editor form        │ ──────────────────▶ │ GET /w/<config>.png        │
 │ live SVG preview   │                     │  decode → validate → SVG   │
 │ Download PNG       │                     │  → resvg-js → PNG (cached) │
 │ (canvas, no server)│                     └──────────────┬─────────────┘
 └─────────┬──────────┘                                    │ imports
           │ imports                                       │
           ▼                                               │
        packages/core:  render(config, now) → SVG string  ◀┘
                        (pure, no DOM, no Node APIs)
                                                           ▲
 iPhone Shortcut (daily) ── Get Contents of URL ───────────┘
```

Principles:

1. **Single source of truth**: `core` has no DOM or Node dependency.
2. **Stateless**: config is validated, compressed and base64url-encoded into the URL.
3. **Deterministic**: same config + same day = same image, so it is CDN-cacheable.
4. **Two delivery paths**: `Download PNG` runs fully in the browser (zero server cost); the live wallpaper uses the server route.

---

## 6. Stack

| Layer | Choice |
|---|---|
| Framework | Nuxt (Vue 3, TypeScript) |
| UI | Nuxt UI + Tailwind CSS v4 |
| Core | TypeScript package, validated with Valibot or Zod |
| Rasterizer (server) | `@resvg/resvg-js` on Vercel's Node runtime |
| Rasterizer (browser) | SVG drawn to a canvas, exported as PNG |
| Config encoding | `fflate` + base64url |
| Hosting | Vercel Hobby (free), auto-deploy from GitHub |
| Tests | Vitest (unit, snapshot), Playwright (e2e, visual regression) |
| Tooling | npm workspaces, ESLint, Prettier, GitHub Actions |

The editor page is client-only (`ssr: false`); the landing page is static.

---

## 7. Data model (draft)

```ts
type Config = {
  v: 1                        // schema version, for URL compatibility
  theme: "birthday" | "anniversary" | "goal"
  birthDate?: string          // birthday theme, ISO date
  lifespanYears: number       // default 90
  startDate?: string          // anniversary theme; optional for goal
  targetDate?: string         // goal theme
  subject?: string            // "Elisa", "New York City Marathon"
  symbol: { icon: IconId; color: string; size: number }
  label: { template: string; count: "number" | "symbols" | "both" }   // "{count} years in love with {subject}"
  timeZone: string            // IANA, e.g. "Europe/Rome"
  device: DeviceId
  text: { title?: string; subtitle?: string; footer: "none" | "numbers" | "custom"; footerText?: string }
  colors: { preset?: PaletteId; bg: string; past: string; future: string; current: string; label: string }
  dots: { shape: ShapeId; fill: "solid" | "outline"; size: number; gap: number }
  grid: { grouping: "none" | "months" | "decades" | "both"; axisLabels: boolean }
  layout: { insetTop?: number; insetBottom?: number; marginX?: number }   // points; override device preset
  events: EventItem[]
}

type EventItem = {
  id: string
  label: string
  date: string
  recurrence: "none" | "yearly"
  shape: ShapeId              // circle | square | rounded | diamond | heart | star
  color: string
  size: number                // relative to a cell
  fill: "solid" | "outline"
  showFuture: boolean
  priority: number
}
```

Anniversaries are **computed, never stored**. Always include `v` and keep a decoder per old version so old Shortcut URLs never break. Only values that differ from defaults are encoded, to keep URLs short.

---

## 8. Rendering spec

### 8.1 Device presets (v1: iPhone only)

Native pixel sizes, cross-checked against Apple's tech specs (iPhone 17 Pro / Pro Max), TechCrunch's iPhone 17 comparison, Use Your Loaf and iosref.com.

| Group | Models | Pixels (W × H) | Points |
|---|---|---|---|
| 5.4" | 12 mini, 13 mini | 1080 × 2340 | 375 × 812 (native scale 2.88x, not 3x) |
| 6.1" notch | 12, 12 Pro, 13, 13 Pro, 14 | 1170 × 2532 | 390 × 844 |
| 6.1" Dynamic Island | 14 Pro, 15, 15 Pro, 16 | 1179 × 2556 | 393 × 852 |
| 6.3" | 16 Pro, 17, 17 Pro | 1206 × 2622 | 402 × 874 |
| 6.5" | iPhone Air | 1260 × 2736 | 420 × 912 |
| 6.7" notch | 12 Pro Max, 13 Pro Max, 14 Plus | 1284 × 2778 | 428 × 926 |
| 6.7" Dynamic Island | 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus | 1290 × 2796 | 430 × 932 |
| 6.9" | 16 Pro Max, 17 Pro Max | 1320 × 2868 | 440 × 956 |

**Still to verify**: iPhone 16e, iPhone SE, and any iPhone released after the iPhone 17 family.

- The form lists models by name and maps them to these groups.
- Same resolution can mean a different cutout (notch vs Dynamic Island), so safe-area presets are per **model**.
- The 13 mini has a 2.88x native scale: work in pixels, not points × 3.

### 8.2 Safe areas: what is known and what must be checked

No official Apple figure for the lock screen clock and widget zone was found. The design kit uses **provisional** insets (280 pt top, 110 pt bottom, 28 pt sides) that are an estimate, not a spec.

To check on real devices:

- [ ] Cutout: notch (12 to 14) vs Dynamic Island (14 Pro and later).
- [ ] Clock size and style: iOS 26 added a resizable adaptive clock; iOS 27 reportedly adds a compact mode per wallpaper.
- [ ] Widget position: under the clock or at the bottom (since iOS 26).
- [ ] Bottom controls: flashlight, camera, home indicator.
- [ ] Notifications overlay, Always-On dimming, Display Zoom.
- [ ] Re-check after each major iOS release.

Approach: presets in points per model, measured with a calibration wallpaper; **inset sliders in the editor** so each user can adapt to their own clock and widgets.

### 8.3 Layout: fixed dot size, adaptive unit

Visual target (from the reference lock screen the owner likes): few, large dots; a title above; a small counter below; lots of empty space; color only where it carries meaning.

- **Dot size is fixed**: about 12 pt dots on a 20 pt pitch, 15 columns (36 px dots, 60 px pitch at 3x). Dots never shrink to fit more data.
- **Block structure**: title, optional symbol row, dot grid, counter line. The block sits in the safe area, roughly at mid-screen.
- **Dot budget**: about 15 × 8 = 120 dots at most, so the block stays compact.
- **When the data does not fit, the unit changes, not the dot**:
  1. Pick the largest unit that keeps the count within budget: days, then weeks, then months, then years. A 90-year life is 90 dots in years (4,680 in weeks would not fit).
  2. Or show only a **window**: for example the current year in weeks (52 dots) while the counter carries the total ("34 years").
  3. The user can override the unit; the editor warns when the count exceeds the budget and offers the window instead.
- **Counter line** always states what the dots cannot show: totals, time left, percentage. The accent color is used for the key number only.
- **Color**: neutral dots for past and future, one accent for "now" and for the symbol.
- Title and counter need an embedded font for resvg. Pixel-aligned centers, rendered at native resolution, never scaled afterwards.
- The dense 52 × 90 weekly grid from earlier revisions is dropped as a default. It may return as an optional "dense" layout later.

### 8.4 Shape registry

Each shape is a function `(cx, cy, size) → SVG element`, registered by id. Adding a shape means one entry plus one snapshot test.

---

## 9. Design assets (current state)

- Design kit generated as files (`tools/generate.py`): 8 wallpaper templates with guides, example wallpapers (dark and light), 12 shapes, foundations sheet, cover, app flow, tokens (`cairn.css`, DTCG JSON for Figma).
- Theme "warm stone": stone grays with an amber accent (dark) and terracotta accent (light).
- Figma file "Cairn" is on the **Starter** plan: max 3 pages, variable modes not available, MCP tool calls are rate limited. Import is manual (see `IMPORTA-IN-FIGMA.md`).
- **Concepts for revision 4**: `wallpapers/concepts/` holds three big-dot drafts (Birthday, Anniversary, Goal).
- **To redo**: templates and examples for the big-dot layout on all 8 device groups, goal icons, and app flow and screens for the editor. The 52 × 80 templates and examples are outdated.

---

## 10. Roadmap

### M0: Spike (de-risk)
- [x] Nuxt + npm workspaces scaffold, CI skeleton
- [x] `core` renders the three themes to SVG with the big-dot layout (25 tests)
- [x] Server route converts SVG to PNG with `resvg-js` (verified locally with the production build)
- [ ] Deploy to Vercel Hobby and check bundle size, cold start and execution time there
- [ ] Browser-side download (today the Download button uses the server route)
- [ ] Test the URL in a real iOS Shortcut; measure safe areas with a calibration wallpaper

**Exit criteria**: a daily automation sets the lock screen from a deployed URL, at zero cost.

### M1: Core
- [ ] Config schema, URL codec with versioning and default-stripping
- [ ] Big-dot layout engine: fixed dot size, adaptive unit, window mode, title and counter
- [ ] Birthday theme (90 dots, one per year)
- [ ] Palettes, shapes, icon glyphs, current marker
- [ ] Label templates and symbol counter
- [ ] Unit and snapshot tests

### M2: Editor MVP
- [ ] Two-column editor with iPhone mockup and live preview
- [ ] Sections: Basics, Symbol, Label, Text, Colors, Background, Dots, Grid, Layout
- [ ] Download PNG, config in the page URL
- [ ] Landing page

### M3: Anniversary and Goal themes, events (the differentiator)
- [ ] Anniversary theme (heart, years as symbols)
- [ ] Goal theme (custom icon, countdown, event label)
- [ ] Extra one-off and yearly events on any theme; Events section in the editor
- [ ] Edge cases from section 3 covered by tests

### M4: Live wallpaper
- [ ] "Set up live wallpaper" guided flow (copy URL, Shortcut checklist)
- [ ] CDN caching and input hardening

### M5: Portfolio polish
- [ ] README with demo GIF and screenshots, `docs/architecture.md`, ADRs
- [ ] Accessibility and Lighthouse pass, live demo link

### Later (optional)
- Plain Year calendar, habits, quotes, image backgrounds, Android, short links.

---

## 11. Keeping it free

| Item | Choice | Cost |
|---|---|---|
| Hosting | Vercel Hobby | Free. Intended for non-commercial, personal projects; usage limits to verify before launch |
| Domain | `*.vercel.app` subdomain | Free. A custom domain is the only optional expense |
| Database, auth | None | Free by design |
| Download PNG | Rendered in the browser | No server usage |
| Live wallpaper | Server route + CDN cache | About one uncached request per user per day |
| Code, CI | Public GitHub repo, GitHub Actions | Free for public repos |
| UI, fonts | Nuxt UI, Tailwind, open-source fonts | Free |
| Design | Figma Starter + generated SVG kit | Free |

Risks to the "free" goal:

- **Traffic**: heavy use could exceed the free tier. Mitigations: long CDN cache, browser-side download as fallback, rate limiting.
- **Monetization**: if the project ever charges money, the Hobby plan no longer applies.
- **Abuse**: cap image dimensions, event count and text length; validate every request.

---

## 12. Repository structure

```
.
├── PLAN.md
├── README.md
├── LICENSE                  # MIT
├── apps/
│   └── web/                 # Nuxt app: editor UI + server route /w/[config].png
├── packages/
│   └── core/                # schema, date math, layout, shapes, renderer
├── design/                  # wallpaper concepts, cover, concept generator
├── docs/
│   ├── architecture.md
│   └── adr/
├── e2e/
└── .github/
    ├── workflows/ci.yml
    └── ISSUE_TEMPLATE/
```

---

## 13. Testing strategy

- **Unit (Vitest)**: week and day math, anniversary expansion, Feb 29, collisions, codec round-trip, schema versioning, layout with grouping.
- **Snapshot**: SVG for fixed configs and a fixed `now`.
- **Visual regression (Playwright)**: PNG per device preset; browser and server output compared.
- **E2E**: edit the form, add an event, check the URL returns a PNG with the right dimensions.
- **Real-device checklist** per release.

---

## 14. Risks

| Risk | Mitigation |
|---|---|
| `resvg-js` bundle or cold start too heavy on Vercel Hobby | Measure in M0; fall back to `@resvg/resvg-wasm` |
| Browser and server PNGs differ (fonts, anti-aliasing) | Embed the same font in both; visual regression test |
| Safe areas wrong or changing with clock, widgets, iOS version | Calibration wallpaper, per-model presets, inset sliders |
| URL too long with many events and options | Default-stripping, compression, event cap |
| iOS changes the Shortcuts wallpaper action | Document steps, re-test each iOS release |
| Free tier exceeded | See section 11 |
| Scope creep from the bigger editor | Ship the Birthday theme first; Anniversary and Goal in M3; extras in "Later" |
| Icons unreadable at dot size | Curated, simplified glyphs; test at 36 px in M0 |

---

## 15. Decisions and open questions

**Decided**
- Name: Cairn
- Everything free, no paywall, no accounts
- Hosting: Vercel (Hobby)
- UI language: English
- Platform: iPhone only for v1
- Stack: Nuxt + Vue + Tailwind (Nuxt UI)
- Architecture: stateless, config encoded in the URL
- Device support: all 8 resolution groups
- Visual direction: warm stone, dark and light
- Life span: 90 years by default
- Layout: big dots at a fixed size (about 12 pt), title above, counter below; dots never shrink, the unit adapts or a window is shown
- No branding on the wallpaper
- Themes: Birthday (gift), Anniversary (hearts), Goal (custom icon), each with a label

**Open**
1. Repo name and domain for Cairn (check availability, and existing projects with the same name).
2. Birthday theme default: 90 dots in years, or the current year in weeks with the age in the counter.
3. Grouping and axis labels: still wanted with the big-dot layout, or dropped for a cleaner look.
4. Color palettes: how many presets, and their names.
5. Which icon set to base the glyphs on.

---

## Sources

- [thelifecalendar.com](https://thelifecalendar.com/)
- [weeklydots.com](https://www.weeklydots.com/) and [its Obsidian editor](https://www.weeklydots.com/obsidian)
- [iPhone 17 Pro tech specs (Apple)](https://www.apple.com/gw/iphone-17-pro/specs/)
- [iPhone 17 models compared (TechCrunch)](https://techcrunch.com/2025/09/12/all-of-the-iphone-17-models-compared/)
- [iPhone 17 Screen Sizes (Use Your Loaf)](https://useyourloaf.com/blog/iphone-17-screen-sizes/)
- [iOS Resolution (iosref.com)](https://iosref.com/res)
- [iOS 26 Lock Screen (MacRumors)](https://www.macrumors.com/guide/ios-26-lock-screen/)
- [iOS 27 Lock Screen (iGeeksBlog)](https://www.igeeksblog.com/ios-27-lock-screen-features/)
