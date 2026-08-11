# UI Screenshot Mockup Prompt Kit

A product-agnostic prompt set for generating **marketing-quality screenshot mockups of
any web app** — the polished 1920×1080 "product shots" you put on a landing page, a
portfolio case study, docs, a pitch deck, or an app-store listing.

Works in any AI tool that can write code: ChatGPT, Claude, Claude Code, Gemini, Copilot,
Cursor, Windsurf, v0, Lovable, Bolt, DeepSeek — anything that returns an HTML file.

**What you get:** one self-contained HTML file per screen (fonts, CSS and JS inlined),
rendered to PNG in light and dark. No frameworks, no build step, no network at render
time — so the image looks identical on every machine, forever.

**Why HTML and not an image model:** text stays crisp and spelled correctly, numbers line
up, tables and charts are real geometry, you can restyle all screens by changing a few
tokens, and you can re-render at any size. Image generators cannot do legible UI text.

---

## 0. Fill in this brief first

Everything in `{{DOUBLE_BRACES}}` below gets replaced from this brief. Spend ten minutes
here and the rest is mechanical — this is the whole difference between a generic-looking
mockup and one that reads as a real product.

```text
PRODUCT NAME:      {{e.g. Northwind Ops}}
ONE-LINE PITCH:    {{what it does, for whom}}
PRIMARY USER:      {{role that appears in the screenshots}}
DEMO PERSONA:      {{full name + role shown as the signed-in user}}
DEMO ORG/TENANT:   {{company name shown in the header}}

SCREENS (5–12):    {{Dashboard, …}}   ← list them; one file each

BRAND
  primary colour:  {{#hex}}
  accent colours:  {{2–5 hexes for icon tiles, badges, chart series}}
  neutrals:        {{page background, card, border, text, muted text}}
  font:            {{UI font + optional display/mono font}}
  corner radius:   {{e.g. 10px}}
  logo:            {{wordmark text, or a description of the mark}}

APP SHELL
  navigation:      {{sidebar | top bar | both}}
  nav items:       {{exact labels, in order, and which is active per screen}}
  header shows:    {{tenant, search, notifications, user chip, …}}

DEMO DATA (invent it — never use real customers)
  accounts:        {{4–8 believable but fictional company names}}
  people:          {{4–6 fictional names for tables/avatars}}
  domain nouns:    {{the objects your app manages: projects, scopes, invoices…}}
  plausible sizes: {{typical counts, currencies, dates, percentages}}
```

Two rules that decide whether it looks real:

1. **Use your product's actual vocabulary.** The nav labels, column headers and status
   names should match the real app word for word. Nothing screams "mockup" like generic
   labels ("Items", "Manage", "Overview") over a real product.
2. **Populate everything.** Empty states, three-row tables and round numbers look fake.
   Fill tables to the bottom of the card, use uneven values (87%, 3,942h, $6.42M), mix
   statuses, and give some rows a problem (blocked, over budget, renewal due).

---

## 1. Master prompt — paste once

```text
You are a senior front-end engineer producing pixel-faithful HTML "screenshot" mockups
of a web app's screens, for use as marketing, portfolio and documentation images.

GOAL
Self-contained HTML pages that look like real, polished screenshots of a finished
product. Each page is a fixed {{1920}}×{{1080}} canvas, captured to PNG with headless
Chrome.

HARD CONSTRAINTS
- Vanilla HTML + CSS + a little vanilla JS. No frameworks, no build tooling, no Tailwind
  or CDN runtime, no external requests of any kind at render time.
- EVERY file must be self-contained: all CSS in a <style> block, all JS in a <script>
  block, fonts either inlined as base64 woff2 or a safe system stack, images as inline
  SVG or data: URIs. A screen must render correctly when that single file is opened on
  its own, in any folder.
- Icons: inline SVG paths (Lucide-style, 24×24 viewBox, stroke-width 2, round caps) via
  an SVG <symbol> sprite injected at the top of <body>; reference them with
  <svg class="icon"><use href="#i-name"/></svg>. No icon fonts, no icon libraries.
- Charts: hand-built inline SVG — lines, areas, bars, donuts, gauges, progress bars —
  with coordinates computed for the exact card width. No chart libraries.
- Theme: light by default; a dark variant applied by adding class "dark" to the canvas
  element when the URL contains ?theme=dark. Define every colour as a CSS custom
  property on :root and override the same names under .dark — never hard-code a colour
  in a component rule.
- Viewing: a small script scales the fixed canvas DOWN to fit smaller browser windows
  (transform: scale, transform-origin: top left, resize listener), forces scale 1 when
  the window is at least the canvas size, and honours ?fit=off to force 1:1 for capture.
- The app shell (navigation and header) must be identical on every screen. Generate it
  once in JS from a nav array and inject it around the page's single <main> element,
  driven by a data attribute on <body> (e.g. <body data-page="/dashboard">) that marks
  the active nav item. Never hand-write the shell into each page.

DESIGN SYSTEM (use exactly these values)
- Canvas: {{1920}}×{{1080}}. Corner radius {{10px}}. Base font size 14px.
- Font: {{FONT}} with a system fallback stack; {{MONO FONT}} for numbers.
- Light tokens:  page bg {{#hex}} · card {{#hex}} · nav surface {{#hex}} ·
  inner surface {{#hex}} · text {{#hex}} · muted text {{#hex}} · border {{#hex}}
- Dark tokens:   page bg {{#hex}} · card {{#hex}} · nav surface {{#hex}} ·
  inner surface {{#hex}} · text {{#hex}} · muted text {{#hex}} · border {{#hex}}
- Primary: {{#hex}} with {{#hex}} foreground. Active nav item: {{bg}} / {{text}}.
- Accents (each with a soft tint background for icon tiles and badges):
  {{blue #hex · green #hex · amber #hex · purple #hex · red #hex · teal #hex}}
- Chart series in order: {{#hex, #hex, #hex, #hex, #hex}}. Gridlines barely visible.
  Target/threshold lines dashed. Lighten every series in dark mode.
- Depth: 1px borders plus a very soft shadow. No heavy drop shadows, no gradients
  except optionally the logo mark, no glassmorphism, no rounded-pill everything.

APP SHELL (identical on every screen)
{{Describe it concretely, e.g.:}}
- Left sidebar {{256}}px: logo/wordmark at top; nav items {{exact labels in order}};
  the active item uses the active-nav tokens; below the list a divider, a collapse
  control, and a signed-in user card (avatar, name, role).
- Top bar {{57}}px: {{tenant name with an icon, a divider, a search field}} on the left;
  {{"Welcome back, <first name>", a notification bell with a small red count badge, and
  a user chip (avatar, name, role, chevron)}} on the right.
- Content area fills the rest with {{24}}px padding: page title ({{24}}px bold) and a
  muted one-line subtitle, then the screen's content.

PRODUCT CONTEXT
{{PRODUCT NAME}} is {{ONE-LINE PITCH}}. Core concepts: {{domain nouns and how they
relate}}. Demo tenant "{{DEMO ORG}}", signed-in persona "{{DEMO PERSONA}}".
Demo data to reuse consistently across every screen:
  accounts: {{names}}
  people:   {{names}}
  {{other domain lists}}
All data is illustrative and fictional. Never invent a real company's name, logo or
customer. Use realistic, POPULATED data so the screens look like a system in daily use:
uneven numbers, full tables, a mix of statuses, at least one item in trouble.

QUALITY BAR — a screen is done only when all of these hold
- Nothing is clipped and nothing overflows the canvas; no horizontal scrollbar.
- No large empty area at the bottom of a card. If a card looks sparse, add rows, or push
  a summary/footer to the bottom of it — do not leave dead space.
- Text uses real product vocabulary, never lorem ipsum and never placeholder labels.
- Numbers are internally consistent (totals equal the sum of their rows; counts in
  headings match the number of rows shown; percentages match their bars).
- Light and dark both look deliberate; nothing disappears against its background.

OUTPUT
Return complete files, never snippets or diffs. For each screen, one self-contained
.html file. Also produce a short CATALOG.md with a paragraph per screen: what it shows,
and where it should be used in marketing.

Reply "ready" and wait for me to request the first screen — do not generate anything yet.
```

> If your tool can't hold that much context, cut the QUALITY BAR section on the first
> paste and send it later as a follow-up when you review the output.

---

## 2. Per-screen prompt — repeat per screen

```text
Now produce {{screen-name}}.html — the "{{Screen Name}}" screen.
Use the shared shell and design system, with <body data-page="{{/route}}"> so
"{{Screen Name}}" is the active nav item.

Layout and content:
{{Describe top to bottom, in rows. Name the components and give real values, e.g.:}}
- Page header: title "{{…}}", subtitle "{{…}}", and on the right {{buttons/filters}}.
- Row 1: {{4–5}} stat cards — {{label + value + delta each}}.
- Row 2 (left, ~{{2/3}} width): {{chart type}} showing {{what}}, {{time range}},
  with {{legend / target line}}.
- Row 2 (right): {{list or breakdown}} with {{N}} rows.
- Row 3: a {{table}} with columns {{…}} and {{N}} populated rows, plus a footer showing
  {{"Showing X of Y" and pagination}}.

Fill the full canvas height — no dead space at the bottom of any card.
Return the complete self-contained file.
```

**Screen archetypes** — most SaaS marketing packs are built from these seven. Pick the
ones your product actually has:

| Archetype | Shows off | Typical content |
| --- | --- | --- |
| Dashboard / home | the whole product at a glance | greeting, stat row, one big chart, a task or activity list |
| List / index | scale and data richness | filter bar, dense table, status badges, progress bars, pagination |
| Detail record | depth per object | header with key facts, tabs, timeline, side panel of metadata |
| Create / edit form | how easy input is | grouped fields, smart defaults, inline hint or validation notice |
| Board / pipeline | process and flow | 4–6 tinted columns, cards with owner, value, due date, a blocked one |
| Analytics | insight | tab row, KPI cards, a chart pair, a ranked table with trend arrows |
| Settings / admin | maturity and control | sub-tabs, toggles, permission matrix, sessions, plan/usage |

---

## 3. Fix-up prompts

Paste these when the first attempt misses. They fix the failures that actually happen:

```text
It looks generic. Increase the visual specificity: use our exact nav labels and column
headers, add secondary lines under primary values (id, date, owner), vary the badge
colours by meaning, and make one row show a problem state.
```
```text
There is dead space at the bottom of {{card}}. Add {{N}} more realistic rows, or pin a
summary footer to the bottom of that card so it fills its height.
```
```text
Content is clipped at the canvas edge. Reduce that section to what fits at
{{1920}}×{{1080}} — fewer rows, tighter gaps — rather than letting it overflow.
```
```text
The numbers do not reconcile: {{heading says 6 but 5 rows are shown / total ≠ sum}}.
Make every count, total and percentage internally consistent.
```
```text
Dark mode is broken: {{what disappears}}. Every colour must come from a CSS variable
that is redefined under .dark — no hard-coded colours inside component rules.
```
```text
The file references external assets. Inline everything — CSS, JS, fonts and images — so
this single file renders correctly when opened alone in an empty folder.
```

---

## 4. Rendering to PNG

**The viewport must be exactly your canvas size**, or the page gets scaled and
letterboxed. Chrome's *new* headless mode subtracts window chrome from `--window-size`,
which is the most common cause of a grey band down the side of the image.

Windows (PowerShell):

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=old --disable-gpu `
  --hide-scrollbars --force-device-scale-factor=1 --virtual-time-budget=3000 `
  --window-size=1920,1080 --screenshot="png\dashboard.png" `
  "file:///C:/path/to/dashboard.html?fit=off"
```

macOS / Linux:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=old --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --virtual-time-budget=3000 --window-size=1920,1080 \
  --screenshot="png/dashboard.png" "file://$PWD/dashboard.html?fit=off"
```

Dark variant: add `&theme=dark` to the URL and `-dark` to the filename.
Retina/2× for high-DPI displays: `--force-device-scale-factor=2` (gives a 3840×2160 PNG).

**If `--headless=old` is unavailable** in your Chrome build, use Playwright, which always
gives an exact viewport:

```bash
npm i -D playwright && npx playwright install chromium
```
```js
// shot.js — node shot.js dashboard.html png/dashboard.png
const { chromium } = require('playwright');
(async () => {
  const [src, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await p.goto('file://' + require('path').resolve(src) + '?fit=off');
  await p.screenshot({ path: out });
  await b.close();
})();
```

**No command line at all:** open the file in Chrome → DevTools (F12) → device toolbar
(Ctrl/Cmd+Shift+M) → set 1920×1080 → ⋮ menu → *Capture screenshot*. Or print to PDF with
a 1920×1080 custom paper size.

---

## 5. Notes per tool

- **Chat-only tools (ChatGPT, Claude, Gemini, DeepSeek):** ask for **one complete file
  per message**. If a response gets truncated, say "continue from `<!-- ROW 3 -->`" —
  never stitch two half-files by hand. Ask it to keep the shared CSS/JS byte-identical
  across screens so all files stay consistent.
- **Agentic coding tools (Claude Code, Cursor, Windsurf, Copilot agent):** these can
  write real files, so let them keep the shared CSS/JS in one place and add a tiny build
  step that inlines everything into the shipped files. That is exactly how the example
  pack in this folder is organised (`src/` → `build.js` → self-contained files).
- **App builders (v0, Lovable, Bolt):** they default to React + Tailwind. State plainly
  "plain HTML + inline CSS in a single file, no React, no Tailwind, no imports" or you
  will get a project you cannot screenshot cleanly.
- **Any tool:** if the output opens as unstyled serif text, the CSS didn't travel with
  the file. That is the single most common failure — insist on inlining.

---

## 6. Using the images on a portfolio or marketing site

- **Sizes.** Ship the 1920×1080 PNG as the master. For the web, export ~1600px wide WebP
  (usually 5–10× smaller than PNG at the same visual quality) and keep the PNG for
  decks. For an Open Graph / social preview, render a dedicated 1200×630 crop rather
  than letting the platform squash a 16:9 image.
- **Presentation.** A subtle browser frame or a slight perspective tilt makes a flat
  screen read as "product" instead of "diagram" — but never fake a URL bar showing a
  domain you don't own. A plain rounded-corner image with a soft shadow on a tinted
  background is the safe, modern default.
- **Pairs sell better than singles.** Light + dark of the same screen, or before/after
  of a workflow, communicates more than two unrelated screens.
- **Order for a case study.** Lead with the dashboard (the "whole product" shot), then
  the screen that shows your hardest problem solved, then one detail/settings screen for
  credibility. Three to five images beats eleven.
- **Say what they are.** These are faithful mockups with fictional data, not captures of
  a live customer account. A caption like "Illustrative data" is honest, costs nothing,
  and protects you — especially in a portfolio, where a reviewer may assume the numbers
  are a real client's.
- **Data hygiene, non-negotiable.** No real client names, logos, emails, phone numbers,
  revenue figures or internal identifiers — not even blurred, and not in a table cell
  someone can zoom into. Invent every name. If your product serves named brands, use
  invented companies in the same industry instead.
- **Accessibility and SEO.** Give each image a descriptive `alt` that says what the
  screen does ("Dashboard showing weekly hours, team utilisation and open tasks"), not
  "screenshot 1".
- **Keep them alive.** When the real UI changes, edit the tokens or the one shared shell
  and re-render every screen in seconds. Stale mockups that no longer match the product
  are worse than none.

---

## 7. Pre-flight checklist

Before a screen goes on your site:

- [ ] Opens correctly as a single file in an empty folder
- [ ] Exactly {{1920}}×{{1080}}, no letterboxing, no scrollbar
- [ ] Light and dark both rendered and both look intentional
- [ ] Every number, total and count reconciles
- [ ] No lorem ipsum, no "Item 1", no placeholder avatars
- [ ] No real customer, person or financial data anywhere
- [ ] Spelling of product terms matches the real app
- [ ] Nothing clipped; no dead space at the bottom of a card
- [ ] Exported at web size (WebP) with a descriptive alt text written

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Unstyled serif text | CSS/JS didn't travel with the file | Inline everything into the one file |
| Grey band right/bottom of the PNG | Viewport smaller than the canvas, so the page auto-scaled | `--headless=old` or Playwright; add `?fit=off` |
| Wrong or fallback font | Font fetched from the network at render time | Inline the woff2 as base64, or use a system stack |
| Icons missing / empty boxes | Sprite injected after the markup that references it, or an icon library was assumed | Inject the `<symbol>` sprite at the top of `<body>`; use inline SVG only |
| Content cut off at the bottom | More content than the fixed canvas allows | Cut rows; do not shrink the canvas |
| Screens drift apart visually | Shell copied into each page | One shell definition, injected; regenerate all screens after any change |

---

## Worked example

`PROMPT-EXAMPLE-CLIENTPLUS.md` in this folder is this kit fully filled in for a real
product (ClientPlus, a consultancy operations platform), and the 11 screens it produced
are right here to compare against. Read it alongside the blank kit when you're unsure how
specific a section should get — the answer is almost always "more specific than you think".
