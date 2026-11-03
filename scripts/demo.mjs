#!/usr/bin/env node
// Reproducible offline fixture tour; no user approvals or live image generation.
import { mkdirSync, existsSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { init, register } from '../skills/drama-pipeline/scripts/drama-pipeline.mjs';
import { exportPack } from '../skills/novel-storyboard/scripts/novel-storyboard.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv.slice(2);
if (arg.length !== 2 || arg[0] !== '--out') throw new Error('Usage: node scripts/demo.mjs --out NEW_DIRECTORY');
const out = resolve(arg[1]);
if (existsSync(out)) throw new Error('Choose a new output directory.');
mkdirSync(out, {
  recursive: true
});
const read = p => JSON.parse(readFileSync(p, 'utf8'));
const stages = {
  outline: 'novel-outline',
  characters: 'novel-characters',
  art: 'novel-art',
  script: 'novel-script',
  staging: 'novel-staging',
  storyboard: 'novel-storyboard',
  'character-refs': 'character-refs'
};
for (const [stage, name] of Object.entries(stages)) copyFileSync(join(root, 'skills', name, 'examples/sample.json'), join(out, stage + '.json'));
copyFileSync(join(root, 'skills/novel-outline/examples/source.txt'), join(out, 'source.txt'));
let project = init(read(join(root, 'skills/drama-pipeline/examples/brief.json')), join(root, 'skills'), 'source.txt');
for (const [stage, name] of Object.entries(stages)) {
  const artifact = join(out, stage + '.json');
  project = register(project, join(out, 'pipeline.json'), stage, artifact);
  const args = [join(root, 'skills', name, 'scripts', name + '.mjs'), 'render', artifact, '--out', join(out, stage + '.html')];
  for (const [key, flag] of [['outline', 'outline'], ['characters', 'cast'], ['art', 'art'], ['script', 'script'], ['staging', 'staging']]) if (key !== stage) args.push('--' + flag, join(out, key + '.json'));
  if (['outline', 'characters'].includes(stage)) args.push('--source', join(out, 'source.txt'));
  const run = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });
  if (run.error || run.status !== 0) throw new Error(run.error?.message ?? run.stderr);
}
writeFileSync(join(out, 'pipeline.json'), JSON.stringify(project, null, 2) + '\n');
exportPack(read(join(out, 'storyboard.json')), {
  script: read(join(out, 'script.json')),
  staging: read(join(out, 'staging.json'))
}, join(out, 'storyboard.json'), join(out, 'production'));
writeFileSync(join(out, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>zskills · The Last Signal</title><style>body{font:17px/1.6 system-ui;max-width:950px;margin:4rem auto;padding:0 1.5rem;background:#edf1f4;color:#182b40}h1{font:3rem Georgia}a{color:#235c80}li{padding:.6rem}section{padding:2rem;background:white;border-radius:8px}</style><section><p>zskills / offline fixture tour</p><h1>The Last Signal</h1><p>An original micro-scene demonstrates the complete artifact chain. No images or video have been generated. The reference gallery remains pending; production export lists missing keyframes. The pipeline awaits actual outline approval.</p><ul>${Object.entries(stages).map(([stage, name]) => `<li><a href="${stage}.html">${name}</a> · <a href="${stage}.json">working JSON</a></li>`).join('')}</ul><p><a href="production/manifest.json">Production manifest</a> · <a href="production/timeline.json">Timeline</a> · <a href="production/dialogue.json">Dialogue</a> · <a href="pipeline.json">Pipeline status</a></p></section></html>`);
console.log(join(out, 'index.html'));
