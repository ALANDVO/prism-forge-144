# Product development plan

Each round completes one feature or repair. Future items are planned, not implemented claims.

## Current round

continue-implementation

## Roadmap

### continue-implementation — Continue implementation and resolve known failures

Status: done

Acceptance:
- Run checks, fix failures, and implement the next planned feature

Implementation: `Issue #179: Local file serving uses file's directory as web root (scripts/inspect.mjs:44-46)`, `Issue #174: Unique default output directory per target (lib/inspection-files.mjs defaultOutDir())`, `Issue #175: Eyebrow detection excludes figcaptions and scrolling containers (scripts/inspect.mjs:229-233)`

Tests: `tests/eyebrow-fix.mjs - 11 eyebrow detection unit tests`, `tests/inspection-files.mjs - 6 inspection file unit tests`

---

Alan Vo · [alanvo.net](https://alanvo.net) · [X: @alanvoasi](https://x.com/alanvoasi)
