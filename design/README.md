# Design kit

Design assets that match what the code renders. Colors and sizes mirror `packages/core`.

| Folder | Content |
|---|---|
| `concepts/` | Wallpaper concepts for the three themes: stones, with one Font Awesome marker each |
| `cover/` | File cover with the logo stones (the favicon uses the top two) |
| `tools/` | `concepts.py`, which regenerates `concepts/` (`python3 tools/concepts.py concepts`) |

Notes:

- `tools/concepts.py` mirrors the stone shapes in `packages/core/src/render.ts`: change both together.
- Concept data is sample data, not a real person.
