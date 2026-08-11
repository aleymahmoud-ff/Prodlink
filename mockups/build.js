#!/usr/bin/env node
/* build.js — inline every shared asset into one self-contained file per screen.
 *
 *   node mockups/build.js
 *
 * Reads src/screens/<name>.html (a metadata block + a <main> element), wraps it in
 * the page template with the CSS, the icon sprite and the shell script inlined, and
 * writes dist/<name>.html. Nothing in dist/ fetches anything at render time. */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const SCREENS = path.join(SRC, 'screens');
const DIST = path.join(ROOT, 'dist');

const read = (p) => fs.readFileSync(p, 'utf8');

const css = [
  read(path.join(SRC, 'tokens.css')),
  read(path.join(SRC, 'shell.css')),
  read(path.join(SRC, 'components.css')),
].join('\n');

const sprite = read(path.join(SRC, 'icons.svg')).trim();
const shellJs = read(path.join(SRC, 'shell.js'));

/* ---- screen order: also the order screens are listed in CATALOG.md ---- */
const ORDER = [
  'login',
  'dashboard',
  'production',
  'waste',
  'approvals',
  'damage',
  'waste-export',
  'admin-users',
  'admin-lines',
  'admin-products',
  'admin-approval-levels',
];

function parseScreen(file) {
  const raw = read(file);
  const m = raw.match(/^\s*<!--([\s\S]*?)-->/);
  if (!m) throw new Error(`${path.basename(file)}: missing metadata block`);
  const meta = {};
  m[1].split('\n').forEach((line) => {
    const kv = line.match(/^\s*([a-z]+)\s*:\s*(.*?)\s*$/);
    if (kv) meta[kv[1]] = kv[2];
  });
  return { meta, body: raw.slice(m[0].length).trim() };
}

function render({ meta, body }) {
  const attrs = [
    `data-page="${meta.page || '/'}"`,
    `data-title="${meta.title || ''}"`,
    `data-subtitle="${meta.subtitle || ''}"`,
    `data-icon="${meta.icon || 'i-dashboard'}"`,
    `data-tone="${meta.tone || 'blue'}"`,
    `data-grad="${meta.grad || 'primary'}"`,
    meta.shell ? `data-shell="${meta.shell}"` : '',
  ].filter(Boolean).join(' ');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>ProdLink — ${meta.title || meta.name || ''}</title>
<meta name="description" content="${meta.name || ''} screen of ProdLink. Illustrative data.">
<style>
${css}</style>
</head>
<body ${attrs}>
${sprite}
<div class="canvas">
${body}
</div>
<script>
${shellJs}</script>
</body>
</html>
`;
}

fs.mkdirSync(DIST, { recursive: true });

const files = fs.readdirSync(SCREENS).filter((f) => f.endsWith('.html'));
const known = new Set(ORDER);
files.forEach((f) => {
  if (!known.has(path.basename(f, '.html'))) {
    console.warn(`  ! ${f} is not in ORDER — building it, but it will not be catalogued`);
  }
});

const names = ORDER.filter((n) => files.includes(`${n}.html`))
  .concat(files.map((f) => path.basename(f, '.html')).filter((n) => !known.has(n)));

let total = 0;
for (const name of names) {
  const screen = parseScreen(path.join(SCREENS, `${name}.html`));
  const html = render(screen);
  const out = path.join(DIST, `${name}.html`);
  fs.writeFileSync(out, html);
  total += html.length;
  console.log(`  ${name.padEnd(24)} ${(html.length / 1024).toFixed(1).padStart(6)} KB`);
}

/* A self-contained file must not reference anything external. */
let leaks = 0;
for (const name of names) {
  const html = read(path.join(DIST, `${name}.html`));
  const bad = html.match(/(?:src|href)="(?!#)(https?:|\/\/|\.\/|\.\.\/)[^"]*"/g);
  if (bad) {
    leaks += bad.length;
    console.error(`  ! ${name}: external reference ${bad.join(', ')}`);
  }
}

console.log(`\n${names.length} screens, ${(total / 1024).toFixed(0)} KB total, ${leaks} external references`);
process.exit(leaks ? 1 : 0);
