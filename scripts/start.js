#!/usr/bin/env node
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const standaloneServer = path.join(root, '.next', 'standalone', 'server.js');

// Load .env.local for local dev (Cranl injects env vars directly, so the file
// won't exist there — fall back silently).
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
  console.log(`[start] loaded env from ${path.relative(root, filePath)}`);
}

loadEnvFile(path.join(root, '.env.local'));

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log(`[start] copied ${path.relative(root, src)} -> ${path.relative(root, dest)}`);
}

if (fs.existsSync(standaloneServer)) {
  // Standalone output: copy static assets next to the standalone server, run db setup, then boot it.
  copyIfExists(
    path.join(root, 'public'),
    path.join(root, '.next', 'standalone', 'public')
  );
  copyIfExists(
    path.join(root, '.next', 'static'),
    path.join(root, '.next', 'standalone', '.next', 'static')
  );

  const dbSetup = spawnSync(process.execPath, [path.join(root, 'scripts', 'db-setup.js')], {
    stdio: 'inherit',
    env: process.env,
  });
  if (dbSetup.status !== 0) {
    console.error('[start] db-setup failed; continuing to boot server anyway');
  }

  const child = spawn(process.execPath, [standaloneServer], {
    stdio: 'inherit',
    env: {
      ...process.env,
      HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
      PORT: process.env.PORT || '3000',
    },
  });
  child.on('exit', (code) => process.exit(code ?? 0));
} else {
  // Fallback: no standalone build -> use `next start`
  const bin = process.platform === 'win32' ? 'next.cmd' : 'next';
  const child = spawn(path.join(root, 'node_modules', '.bin', bin), ['start'], {
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}
