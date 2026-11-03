#!/usr/bin/env node
import { readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skills = join(root, 'skills');
let failures = 0;
for (const name of existsSync(skills) ? readdirSync(skills).sort() : []) {
  const test = join(skills, name, 'scripts/selftest.mjs');
  if (!existsSync(test)) { console.error(`Missing self-test: ${name}`); failures++; continue; }
  const result = spawnSync(process.execPath, [test], { stdio: 'inherit' });
  if (result.error || result.status !== 0) { console.error(result.error?.message ?? `Failed: ${name}`); failures++; }
}
const integration = join(root, 'scripts/integration.mjs');
if (existsSync(integration)) {
  const result = spawnSync(process.execPath, [integration], { stdio: 'inherit' });
  if (result.error || result.status !== 0) failures++;
}
if (failures) process.exitCode = 1;
else console.log('All available skill tests passed.');
