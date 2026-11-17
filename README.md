# Cairn

Free, open-source iPhone lock screen wallpapers that show your time as a grid of dots.

A cairn is a pile of stones that marks a path. Each dot is a stone; the moment that matters gets a different shape.

## Themes

| Theme | Dots | Symbol | Counter |
|---|---|---|---|
| Birthday | One per year of a 90-year life | The current year is a flame | `34 years · 56 ahead` |
| Anniversary | 52 hearts, the weeks to the next anniversary | The current week is red | `8 years · 23 weeks to the 9th` |
| Goal | One per day until the target | The target is a star | `64d left · 27%` |

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
- The Goal theme uses a star as its symbol for now; the icon library comes later.
- The Shortcut guide explains how to build the Shortcut by hand; there is no shared iCloud Shortcut link yet.

## License

Code: [MIT](LICENSE). The bundled Geist font is licensed under the SIL Open Font License (`apps/web/server/assets/fonts/OFL.txt`). The heart, fire and star symbols are [Font Awesome Free](https://fontawesome.com) icons, licensed under [CC BY 4.0](https://fontawesome.com/license/free).
