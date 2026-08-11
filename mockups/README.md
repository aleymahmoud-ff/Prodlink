# ProdLink screenshot mockups

Marketing-quality 1920×1080 product shots of ProdLink, built from the
[UI Screenshot Mockup Prompt Kit](PROMPT.md) applied to this codebase.

Eleven screens, each a self-contained HTML file rendered to PNG in light and dark. No
frameworks, no build tooling in the output, no network requests at render time — a
`dist/*.html` file renders identically when opened alone in an empty folder.

```
mockups/
├── PROMPT.md         the kit this pack was generated from
├── BRIEF.md          the kit's brief, filled in from the real app
├── OVERVIEW.md       what ProdLink is, in one page — the product write-up
├── CATALOG.md        what each screen shows and where to use it
├── build.js          inlines the shared assets into one file per screen
├── render.js         captures every screen to PNG, light and dark
├── gallery.js        packages a shareable folder + zip with an index gallery
├── src/
│   ├── tokens.css    every colour, twice — :root and .dark
│   ├── shell.css     canvas, sidebar, page header
│   ├── components.css cards, tables, badges, controls, charts, paper preview
│   ├── icons.svg     Lucide-style <symbol> sprite
│   ├── shell.js      nav array → sidebar + header, theme, scaler
│   └── screens/      one fragment per screen — metadata block + <main>
├── dist/             built, self-contained HTML (generated)
├── png/              rendered images (generated)
└── build/            the packaged folder and zip (generated, gitignored)
```

## Build and render

```bash
node mockups/build.js     # src/ → dist/*.html, and fails on any external reference
node mockups/render.js    # dist/ → png/*.png, light and dark

node mockups/render.js dashboard   # just one screen
SCALE=2 node mockups/render.js     # 3840×2160 retina masters
CHROME=/path/to/chrome node mockups/render.js   # if Chromium isn't auto-detected
```

## Package a shareable folder

```bash
node mockups/gallery.js   # → build/prodlink-mockups/ and build/prodlink-mockups.zip
```

The packaged folder holds `png/` (22 images), `html/` (the 11 self-contained pages), the
four docs, and an `index.html` contact sheet with a light/dark toggle and per-screen
download links. Open `index.html` straight from the filesystem — it needs no server.

`render.js` prefers a `headless_shell` binary because Chrome's *new* headless subtracts
window chrome from `--window-size`, which is what puts a grey band down the side of a
capture. Every URL is loaded with `?fit=off` so the canvas is pinned 1:1.

## Viewing

Open any `dist/*.html` directly. Query parameters:

| Parameter | Effect |
| --- | --- |
| `?theme=dark` | dark variant |
| `?fit=off` | pin the canvas to 1:1 (used for capture) |
| `?zoom=3&zx=1400&zy=600` | magnify a region — for checking a detail in a capture |

Without `fit=off` the canvas scales down to fit the window, so the files are readable in a
normal browser tab.

## Adding or changing a screen

1. Add `src/screens/<name>.html` — a metadata comment block, then a `<main>` element.
   An optional `<template id="page-actions">` supplies the buttons on the right of the
   page header.
2. Add `<name>` to `ORDER` in `build.js`.
3. `node mockups/build.js && node mockups/render.js <name>`.

Metadata keys: `name`, `title`, `subtitle`, `page` (drives the active nav item), `icon`
(sprite id), `tone` (accent token), `grad` (header tile gradient), and `shell: none` for
full-bleed screens like the login.

The sidebar and page header are generated once in `shell.js` from a nav array and injected
around each screen's `<main>` — never hand-written into a screen. `/admin` screens get the
settings sub-tabs the same way, via a `<nav class="subnav" data-subnav>` slot. Change the
shell or a token and every screen picks it up on the next build.

## Layout rules that keep the canvas exact

The canvas is fixed at 1920×1080, which leaves **944px** of content height below the
88px page header (1080 − 88 header − 48 padding). Sections use explicit heights that sum
to 944 including 20px gaps, with the last section on `flex:1`. Useful constants:

| Element | Height |
| --- | --- |
| card header | 70px |
| card footer (text only / with a button) | 42px / 64px |
| table `<thead>` | 39px |
| table row | set with `--rh` on `table.t.fixed` |
| list row | `.list-row.tight` 55px, `.list-row.tall` 64px |

Rows are sized so the last one lands on the bottom of its card. If a table clips, shrink
`--rh` or drop a row — never shrink the canvas.

## Constraints the build enforces

`build.js` exits non-zero if any built file references an external `src`/`href`. Beyond
that, the rules the screens follow by hand:

- Every colour comes from a CSS custom property defined in `tokens.css` and redefined
  under `.dark`. No colour is hard-coded in a component rule.
- Icons are inline SVG `<symbol>`s referenced with `<use>`, sprite injected at the top of
  `<body>`. No icon fonts, no icon libraries.
- Charts are hand-built SVG with coordinates computed for the exact card width.
- Fonts are the system stack — the same one `src/app/globals.css` uses — so there is
  nothing to inline and nothing to fetch.

## Pre-flight

- [x] Each file opens correctly on its own in an empty folder
- [x] Exactly 1920×1080, no letterboxing, no scrollbar
- [x] Light and dark rendered, both deliberate
- [x] Numbers reconcile — the waste donut sums to 214.6 kg, "8 products available" shows
      eight rows, "5 of 8 rows have a quantity" matches the filled inputs
- [x] No lorem ipsum, no placeholder labels — vocabulary matches `en.json`
- [x] No real customer, person or financial data anywhere
- [x] Nothing clipped, no dead space at the bottom of a card

## Keeping them current

When the real UI changes, edit `src/tokens.css` or `src/shell.js` and re-render every
screen in seconds. Stale mockups that no longer match the product are worse than none.
