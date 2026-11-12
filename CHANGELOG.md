# Changelog

## 1.0.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-10-28

### Added
- Core inspection CLI (`scripts/inspect.mjs`) with Puppeteer-based page analysis
- File handling utilities (`lib/inspection-files.mjs`) with unique output directory derivation
- Design probes (`lib/probe.mjs`) including eyebrow/kicker detection
- Unit tests for inspection files and eyebrow detection fixes

### Fixed
- **Issue #179**: Local file serving now uses the file's directory as web root instead of cwd. This fixes root-relative asset paths (e.g., `/_astro/...`, `/style.css`) returning 404 when inspecting production builds.
- **Issue #174**: Default output directory is now unique per target (derived from file path or URL slug). Concurrent runs on different targets no longer overwrite each other's screenshots and reports.
- **Issue #175**: Eyebrow/kicker detection now correctly excludes:
  - Text inside `<figcaption>` elements
  - Text inside scrolling/clipping containers (overflow: auto, scroll, hidden with content extending beyond bounds)
  - Real kickers (short, uppercase labels above headings) are still detected correctly.

### Implementation Details
- `scripts/inspect.mjs` - Main CLI entry point with Commander.js
- `lib/inspection-files.mjs` - `defaultOutDir()`, `prepareOutDir()`, `screenshotPaths()`, `reportPath()`
- `lib/probe.mjs` - `findEyebrows()`, `isInFigcaption()`, `isInScrollingOrClippingContainer()`, `looksLikeKicker()`
- 13 unit tests passing (`tests/inspection-files.mjs`, `tests/eyebrow-fix.mjs`)

---

Alan Vo · [alanvo.net](https://alanvo.net) · [X: @alanvoasi](https://x.com/alanvoasi)
