# ADR 0002: Fixed dot size, adaptive unit

Date: 2026-11-12. Status: accepted.

## Context

Earlier drafts drew a dense 52 × 80 weekly grid (4,160 dots). On a lock screen the dots were tiny, symbols such as hearts were unreadable, and the look was busy.

## Decision

Dots keep a fixed size (12 pt on a 20 pt pitch, 15 columns) and the block holds at most about 120 dots. When the data does not fit, the unit grows (days, weeks, months, years) or only a window is shown. A counter line under the grid states what the dots cannot show.

## Consequences

- Symbols are readable and the wallpaper stays minimal.
- A 90-year life is 90 dots in years instead of 4,680 in weeks.
- The dense weekly grid is no longer the default; it may return as an optional layout.
