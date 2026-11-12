# prism-forge-144 (Design Taste Skill)

> Work in progress. This checkpoint may be incomplete or fail tests. See PLAN.md and STATUS.md before use.


Agent skills that give coding agents taste: art direction, reference images and a browser check instead of generic AI pages.

## Installation

```bash
npm install
```

## Usage

Inspect a local HTML file:

```bash
node scripts/inspect.mjs path/to/page.html --widths 1440
```

Inspect a URL:

```bash
node scripts/inspect.mjs https://example.com --widths 1440 768
```

### Options

- `-w, --widths <widths...>` - Viewport widths to test (default: 1440)
- `-o, --out <dir>` - Output directory (default: derived from target)
- `-a, --allow <checks...>` - Checks to allow/suppress (e.g., `--allow eyebrow`)
- `--no-screenshots` - Skip screenshot capture

### Output

By default, screenshots and reports are saved to a unique directory under `.taste-skill/`:
- Local file `pages/about.html` → `.taste-skill/inspect-pages-about/`
- Local file `pages/about/index.html` → `.taste-skill/inspect-pages-about/`
- URL `https://example.com/path` → `.taste-skill/inspect-example-com-path/`

Each run creates:
- `report.txt` - Design issue findings
- `{width}px-fold.jpg` - Above-the-fold screenshot per viewport width

## Design Checks

### Eyebrow/Kicker Detection

Detects short, uppercase labels sitting directly above headings (common in editorial design). Excludes:
- Text inside `<figcaption>` elements
- Text inside scrolling/clipping containers (overflow: auto, scroll, hidden)

## Development

Run tests:

```bash
npm test
```

Or directly:

```bash
node --test tests/*.mjs
```

## Issues Fixed

- **#179**: Local file serving now uses the file's directory as web root (fixes root-relative asset 404s)
- **#174**: Unique default output directory per target prevents concurrent run conflicts
- **#175**: Eyebrow detection excludes figcaptions and scrolling content false positives

---

Alan Vo · [alanvo.net](https://alanvo.net) · [X: @alanvoasi](https://x.com/alanvoasi)

Maintainer: Alan Vo <alanvo@gmail.com>
