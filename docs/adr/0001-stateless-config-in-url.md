# ADR 0001: Stateless, with the config in the URL

Date: 2026-11-12. Status: accepted.

## Context

The wallpaper must refresh daily through an iOS Shortcut, which can only fetch a URL. The project must cost nothing to run and should not hold personal data.

## Decision

The whole configuration is validated and encoded into the wallpaper URL (`/w/<config>.png`). The server decodes it, renders, and returns a PNG. There is no database and no account.

Rendering is one pure function, `render(config, today)`, shared by the browser preview and the server.

## Consequences

- No storage cost and no personal data kept server side.
- Responses are deterministic for a given day, so they can be cached on the CDN.
- The config schema is public API: every change must stay backward compatible (`v` field, one decoder per version).
- URLs grow with the number of options; compression and default-stripping are planned for milestone 1.
