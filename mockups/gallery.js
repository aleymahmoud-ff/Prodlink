#!/usr/bin/env node
/* gallery.js — assemble a self-describing, downloadable folder of the mockups.
 *
 *   node mockups/gallery.js            → build/prodlink-mockups/ + prodlink-mockups.zip
 *
 * The folder holds the PNGs, the self-contained HTML, the docs, and an index.html
 * contact sheet that opens straight from the filesystem — no server needed. */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'build', 'prodlink-mockups');

/* screen order + one-line blurbs, mirroring CATALOG.md */
const SCREENS = [
  ['login', 'Sign In', 'Split brand panel and credentials form, with Google sign-in and the admin-only account notice.'],
  ['dashboard', 'Dashboard', "The whole product at a glance: today's stats, a seven-day output chart against target, waste by reason, and the recent activity feed."],
  ['production', 'Production Entry', 'Line filters, the bulk Today/Yesterday control, and the product grid with inline quantities and running totals.'],
  ['waste', 'Waste Entry', 'The waste form under its approval banner, plus a submission history spanning pending, approved and rejected.'],
  ['approvals', 'Waste Approvals', 'Four entries mid-workflow — approve to the next level, reject with a comment, or mark the paper form signed.'],
  ['damage', 'Damage Entry', 'Damage capture and recent records, deliberately simpler than waste: no approval chain.'],
  ['waste-export', 'Export Waste Report', 'Report filters beside a live preview of the signed ISO 22000 waste disposal record.'],
  ['admin-users', 'Settings — Users', 'Thirteen users across every role, with per-user line assignments and one deactivated account.'],
  ['admin-lines', 'Settings — Lines', 'Production lines with type, form approver and product counts; one line is missing its approver.'],
  ['admin-products', 'Settings — Products', 'The product catalog with line and category filters, CSV import, and units of measure.'],
  ['admin-approval-levels', 'Settings — Approval Levels', 'The configurable approval chain above a diagram tracing one entry through it.'],
];

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function indexHtml() {
  const cards = SCREENS.map(([id, name, blurb], i) => `
      <article class="card">
        <div class="shot">
          <img data-shot="${id}" src="png/${id}.png" alt="${esc(name)} screen of ProdLink" loading="${i < 2 ? 'eager' : 'lazy'}">
        </div>
        <div class="meta">
          <div class="row">
            <h2>${esc(name)}</h2>
            <code>${id}</code>
          </div>
          <p>${esc(blurb)}</p>
          <div class="links">
            <a href="png/${id}.png" download>Light PNG</a>
            <a href="png/${id}-dark.png" download>Dark PNG</a>
            <a href="html/${id}.html">Open HTML</a>
          </div>
        </div>
      </article>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ProdLink — Screenshot Mockups</title>
<style>
  :root {
    --bg: #f6f8fb; --card: #ffffff; --text: #0f172a; --muted: #64748b;
    --border: #e2e8f0; --accent: #2563eb; --shadow: 0 1px 2px rgba(15,23,42,.04), 0 14px 40px -20px rgba(15,23,42,.25);
  }
  :root:not([data-theme="light"]) { color-scheme: light dark; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #080d17; --card: #101a2c; --text: #e8eefb; --muted: #93a4bd;
      --border: #23304a; --accent: #60a5fa; --shadow: 0 1px 2px rgba(0,0,0,.4), 0 16px 44px -22px rgba(0,0,0,.8);
    }
  }
  :root[data-theme="dark"] {
    --bg: #080d17; --card: #101a2c; --text: #e8eefb; --muted: #93a4bd;
    --border: #23304a; --accent: #60a5fa; --shadow: 0 1px 2px rgba(0,0,0,.4), 0 16px 44px -22px rgba(0,0,0,.8);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 1240px; margin: 0 auto; padding: 48px 24px 72px; }
  header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
  h1 { margin: 0; font-size: 30px; letter-spacing: -0.025em; }
  .lede { margin: 10px 0 0; max-width: 680px; color: var(--muted); }
  .toggle {
    display: inline-flex; gap: 2px; padding: 4px; border: 1px solid var(--border);
    border-radius: 12px; background: var(--card);
  }
  .toggle button {
    font: inherit; font-size: 13px; font-weight: 600; padding: 7px 16px; border: 0;
    border-radius: 8px; background: transparent; color: var(--muted); cursor: pointer;
  }
  .toggle button[aria-pressed="true"] { background: var(--accent); color: #fff; }
  .note {
    margin: 28px 0 0; padding: 14px 18px; border: 1px solid var(--border);
    border-left: 3px solid var(--accent); border-radius: 10px; background: var(--card);
    color: var(--muted); font-size: 14px;
  }
  .grid { display: grid; gap: 28px; margin-top: 32px; }
  .card {
    background: var(--card); border: 1px solid var(--border); border-radius: 16px;
    overflow: hidden; box-shadow: var(--shadow);
  }
  .shot { background: var(--bg); border-bottom: 1px solid var(--border); }
  .shot img { display: block; width: 100%; height: auto; }
  .meta { padding: 18px 22px 22px; }
  .row { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  h2 { margin: 0; font-size: 18px; letter-spacing: -0.015em; }
  code {
    font: 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: var(--muted); background: var(--bg); border: 1px solid var(--border);
    padding: 2px 8px; border-radius: 6px;
  }
  .meta p { margin: 8px 0 0; color: var(--muted); font-size: 14px; }
  .links { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
  .links a {
    font-size: 13px; font-weight: 600; text-decoration: none; color: var(--accent);
    border: 1px solid var(--border); border-radius: 9px; padding: 7px 14px;
  }
  footer { margin-top: 48px; color: var(--muted); font-size: 13px; }
  footer a { color: var(--accent); }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div>
      <h1>ProdLink — Screenshot Mockups</h1>
      <p class="lede">Eleven screens at 1920&times;1080, light and dark. Click a screen name's
        <em>Open HTML</em> to view the live, self-contained page — it renders identically anywhere,
        with no network access.</p>
    </div>
    <div class="toggle" role="group" aria-label="Theme of the thumbnails">
      <button id="b-light" aria-pressed="true">Light</button>
      <button id="b-dark" aria-pressed="false">Dark</button>
    </div>
  </header>

  <p class="note"><strong>All data shown is illustrative and fictional.</strong> No real customer,
  employee, batch or figure appears in any image. Caption them accordingly wherever they are published.</p>

  <div class="grid">${cards}
  </div>

  <footer>
    <p>See <a href="OVERVIEW.md">OVERVIEW.md</a> for what ProdLink is and who it is for,
    <a href="CATALOG.md">CATALOG.md</a> for where to use each shot and ready-to-paste alt text,
    <a href="BRIEF.md">BRIEF.md</a> for the design tokens and demo data, and
    <a href="README.md">README.md</a> to rebuild or re-render.</p>
  </footer>
</div>

<script>
  var imgs = document.querySelectorAll('[data-shot]');
  var bl = document.getElementById('b-light');
  var bd = document.getElementById('b-dark');
  function set(dark) {
    imgs.forEach(function (img) {
      img.src = 'png/' + img.dataset.shot + (dark ? '-dark' : '') + '.png';
    });
    bl.setAttribute('aria-pressed', String(!dark));
    bd.setAttribute('aria-pressed', String(dark));
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
  bl.addEventListener('click', function () { set(false); });
  bd.addEventListener('click', function () { set(true); });
</script>
</body>
</html>
`;
}

/* ---- assemble ---- */

fs.rmSync(path.join(ROOT, 'build'), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'png'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'html'), { recursive: true });

let missing = [];
for (const [id] of SCREENS) {
  for (const f of [`${id}.png`, `${id}-dark.png`]) {
    const src = path.join(ROOT, 'png', f);
    if (!fs.existsSync(src)) { missing.push(`png/${f}`); continue; }
    fs.copyFileSync(src, path.join(OUT, 'png', f));
  }
  const html = path.join(ROOT, 'dist', `${id}.html`);
  if (!fs.existsSync(html)) { missing.push(`dist/${id}.html`); continue; }
  fs.copyFileSync(html, path.join(OUT, 'html', `${id}.html`));
}

if (missing.length) {
  console.error(`Missing — run build.js and render.js first:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

for (const doc of ['OVERVIEW.md', 'CATALOG.md', 'BRIEF.md', 'README.md']) {
  fs.copyFileSync(path.join(ROOT, doc), path.join(OUT, doc));
}
fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml());

/* ---- zip ---- */

const zipName = 'prodlink-mockups.zip';
const zipPath = path.join(ROOT, 'build', zipName);
try {
  execFileSync('zip', ['-qr', zipName, 'prodlink-mockups'], { cwd: path.join(ROOT, 'build') });
} catch (e) {
  console.error('zip failed — the folder is still at build/prodlink-mockups/');
  process.exit(1);
}

const mb = (p) => (fs.statSync(p).size / 1024 / 1024).toFixed(1);
console.log(`build/prodlink-mockups/   ${SCREENS.length} screens · 22 images · index.html gallery`);
console.log(`build/${zipName}   ${mb(zipPath)} MB`);
