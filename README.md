# Cairn

A free, open-source iPhone Lock Screen wallpaper that grows one stone at a time.

A cairn is a pile of stones that marks a path. Each dot is a stone, laid from the bottom up; the current one takes the accent color, everything else is monochrome.

## Themes

| Theme | Stones | Accent stone | Counter |
|---|---|---|---|
| Birthday | One per year of a 90-year life | The current year | `34 years` |
| Anniversary | One per anniversary reached, plus the next one | The latest anniversary | `8 years · April 22, 2018` |
| Goal | One per day until the target | Today | `64d left · 27%` |

Dots have a fixed size. When the data does not fit, the unit grows (days, weeks, months, years) and the dots stay the same.

## How it works

- `packages/core` is a pure TypeScript function: `render(config, today)` returns an SVG string.
- `apps/web` is a Nuxt app. The editor previews that SVG live; the server route `GET /w/<config>.png` rasterizes the same SVG at the device's native resolution.
- The whole configuration is encoded in the URL. There is no account and no database.
- An iOS Shortcut fetches the URL every morning and sets it as the lock screen wallpaper.

## Getting started

Requirements: Node 22 or later (npm is included).

```bash
npm install
npm run dev        # editor at http://localhost:3000
npm test           # core unit and snapshot tests
npm run typecheck
npm run build
```

## Project structure

```
apps/web        Nuxt app: editor UI and the /w/<config>.png route
packages/core   Config schema, date math, layout, SVG renderer, tests
design          Design kit: concept wallpapers, cover, concept generator
docs/adr        Architecture Decision Records
```

## Known limits

- Safe-area positions are provisional estimates, not Apple figures. They still need to be measured on real devices.
- The Shortcut guide explains how to build the Shortcut by hand; there is no shared iCloud Shortcut link yet.

## License

Code: [MIT](LICENSE). The bundled Geist font is licensed under the SIL Open Font License (`apps/web/server/assets/fonts/OFL.txt`).
