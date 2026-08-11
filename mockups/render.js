#!/usr/bin/env node
/* render.js — capture every built screen to PNG, light and dark.
 *
 *   node mockups/render.js              # all screens, both themes
 *   node mockups/render.js dashboard    # one screen
 *   SCALE=2 node mockups/render.js      # 3840x2160 retina masters
 *
 * Uses a headless Chromium with an exact 1920x1080 viewport. Chrome's *new* headless
 * subtracts window chrome from --window-size, which is what puts a grey band down the
 * side of a capture — so this prefers the headless_shell binary, which does not. */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const PNG = path.join(ROOT, 'png');

const WIDTH = 1920;
const HEIGHT = 1080;
const SCALE = process.env.SCALE || '1';

const CANDIDATES = [
  process.env.CHROME,
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const chrome = CANDIDATES.find((c) => fs.existsSync(c));
if (!chrome) {
  console.error('No Chromium found. Set CHROME=/path/to/chrome and re-run.');
  process.exit(1);
}
const isShell = path.basename(chrome) === 'headless_shell';

fs.mkdirSync(PNG, { recursive: true });

const only = process.argv[2];
const screens = fs
  .readdirSync(DIST)
  .filter((f) => f.endsWith('.html'))
  .map((f) => path.basename(f, '.html'))
  .filter((n) => !only || n === only);

if (!screens.length) {
  console.error(only ? `No built screen named "${only}" — run build.js first.` : 'dist/ is empty — run build.js first.');
  process.exit(1);
}

function shoot(name, dark) {
  const out = path.join(PNG, `${name}${dark ? '-dark' : ''}.png`);
  const url = `file://${path.join(DIST, `${name}.html`)}?fit=off${dark ? '&theme=dark' : ''}`;
  const args = [
    isShell ? '--headless' : '--headless=old',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-sandbox',
    `--force-device-scale-factor=${SCALE}`,
    '--virtual-time-budget=3000',
    `--window-size=${WIDTH},${HEIGHT}`,
    `--screenshot=${out}`,
    url,
  ];
  execFileSync(chrome, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  return out;
}

console.log(`chrome: ${chrome}\nviewport: ${WIDTH}x${HEIGHT} @${SCALE}x\n`);

for (const name of screens) {
  for (const dark of [false, true]) {
    const out = shoot(name, dark);
    const kb = (fs.statSync(out).size / 1024).toFixed(0);
    console.log(`  ${path.basename(out).padEnd(30)} ${kb.padStart(5)} KB`);
  }
}

console.log(`\n${screens.length * 2} images in ${path.relative(process.cwd(), PNG)}/`);
