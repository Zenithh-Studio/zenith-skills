#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, cpSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { Script } from 'node:vm';
import { init, register, refresh, approve, accept } from '../skills/drama-pipeline/scripts/drama-pipeline.mjs';
import { seed as seedRefs, generate } from '../skills/character-refs/scripts/character-refs.mjs';
import { seed as seedBoard, validate as validateBoard, exportPack } from '../skills/drama-storyboard/scripts/drama-storyboard.mjs';
import { blocking } from '../skills/drama-staging/scripts/drama-staging.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  skills = join(root, 'skills');
const tmp = mkdtempSync(join(tmpdir(), 'zskills-integration-'));
const read = p => JSON.parse(readFileSync(p, 'utf8'));
const save = (p, d) => writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
function run(cli, args, cwd = root) {
  const r = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });
  assert.equal(r.error, undefined, r.error?.message);
  return r;
}
try {
  const names = {
    outline: 'drama-outline',
    characters: 'drama-characters',
    art: 'drama-art',
    script: 'drama-script',
    staging: 'drama-staging',
    storyboard: 'drama-storyboard'
  };
  for (const [stage, name] of Object.entries(names)) cpSync(join(skills, name, 'examples/sample.json'), join(tmp, stage + '.json'));
  cpSync(join(skills, 'drama-outline/examples/source.txt'), join(tmp, 'source.txt'));
  const pipelinePath = join(tmp, 'pipeline.json');
  let project = init({
    id: 'last-signal',
    title: 'The Last Signal',
    genre: 'Suspense',
    episodeCount: 1,
    targetSeconds: 12
  }, skills, 'source.txt');
  project = register(project, pipelinePath, 'outline', join(tmp, 'outline.json'));
  assert.equal(project.stages.outline.status, 'pending-approval');
  project = register(project, pipelinePath, 'characters', join(tmp, 'characters.json'));
  assert.equal(project.stages.characters.status, 'blocked');
  project = approve(project, pipelinePath, 'outline');
  assert.equal(project.stages.characters.status, 'ready');
  for (const stage of ['art', 'script', 'staging']) project = register(project, pipelinePath, stage, join(tmp, stage + '.json'));
  assert.equal(project.stages.staging.status, 'ready', JSON.stringify(project.stages));
  const board = read(join(tmp, 'storyboard.json')),
    script = read(join(tmp, 'script.json')),
    staging = read(join(tmp, 'staging.json'));
  assert.equal(seedBoard(script, staging).episodes[0].segments[0].openingBlocking, blocking(staging)[0].text);
  assert.equal(board.episodes[0].segments[0].openingBlocking, blocking(staging)[0].text);
  // Generate real PNG bytes offline through an executable adapter for both characters.
  const castBytes = readFileSync(join(tmp, 'characters.json'), 'utf8');
  const cast = JSON.parse(castBytes);
  for (const c of cast.characters) {
    const assetPath = join(tmp, c.id + '-refs.json');
    save(assetPath, seedRefs(cast, c.id));
    generate(assetPath, 'front-full', {
      executable: process.execPath,
      args: [join(root, 'scripts/fixtures/fake-image-generator.mjs'), '{request}', '{result}']
    });
    project = register(project, pipelinePath, 'character-refs', assetPath);
    project = approve(project, pipelinePath, 'character-refs', c.id);
    generate(assetPath, 'face-front', {
      executable: process.execPath,
      args: [join(root, 'scripts/fixtures/fake-image-generator.mjs'), '{request}', '{result}']
    });
  }
  project = refresh(project, pipelinePath);
  assert.equal(project.stages['character-refs'].status, 'ready');
  project = register(project, pipelinePath, 'storyboard', join(tmp, 'storyboard.json'));
  assert.equal(project.stages.storyboard.status, 'ready', JSON.stringify(project.stages.storyboard));
  const image = read(join(tmp, 'C01-refs.json')).views['front-full'][0].file;
  board.episodes[0].segments[0].cuts[0].references = [{
    id: 'C01',
    file: image
  }];
  save(join(tmp, 'storyboard.json'), board);
  const out = join(tmp, 'production');
  exportPack(board, {
    script,
    staging
  }, join(tmp, 'storyboard.json'), out);
  const manifest = read(join(out, 'manifest.json'));
  assert.equal(manifest.files.length, 1);
  assert.equal(manifest.missingAssets.length, 4);
  assert.ok(existsSync(join(out, manifest.files[0].file)));
  assert.equal(read(join(out, 'dialogue.json'))[0].line, script.episodes[0].scenes[0].beats[1].line);
  // Revisions invalidate only their descendants; authored images and dialogue remain.
  const old = read(join(tmp, 'characters.json'));
  old.characters[0].appearance += ' A red scarf.';
  save(join(tmp, 'characters.json'), old);
  project = refresh(project, pipelinePath);
  assert.equal(project.stages['character-refs'].status, 'stale');
  assert.equal(project.stages.script.status, 'stale');
  assert.equal(project.stages.outline.status, 'ready');
  assert.ok(existsSync(join(tmp, image)));
  assert.throws(() => approve(project, pipelinePath, 'character-refs', 'C01'), /Refresh the image asset design/);
  // Restore and reconcile only after validating the current upstreams.
  writeFileSync(join(tmp, 'characters.json'), castBytes);
  project = refresh(project, pipelinePath);
  assert.equal(project.stages.script.status, 'ready');
  const outline = read(join(tmp, 'outline.json'));
  outline.adaptation.premise += ' Time is running out.';
  save(join(tmp, 'outline.json'), outline);
  project = refresh(project, pipelinePath);
  assert.equal(project.stages.outline.status, 'pending-approval');
  assert.equal(project.stages.characters.status, 'stale');
  project = approve(project, pipelinePath, 'outline');
  project = accept(project, pipelinePath, 'characters');
  assert.equal(project.stages.characters.status, 'ready');
  // Missing installations remain actionable; no installation side effects.
  const unavailable = refresh(project, pipelinePath, join(tmp, 'unavailable'));
  assert.ok(unavailable.stages.outline.validation.issues.some(v => v.rule === 'missing-skill'));
  // Source revisions revoke outline approval even when its own JSON is unchanged.
  const originalSource = readFileSync(join(tmp, 'source.txt'), 'utf8');
  writeFileSync(join(tmp, 'source.txt'), originalSource + '\nA distant whistle sounded.');
  project = refresh(project, pipelinePath);
  assert.equal(project.stages.outline.status, 'stale');
  project = accept(project, pipelinePath, 'outline');
  assert.equal(project.stages.outline.status, 'pending-approval');
  project = approve(project, pipelinePath, 'outline');
  assert.equal(project.stages.outline.status, 'ready');
  // Runtime copies intentionally share one CLI/report contract.
  const runtime = readFileSync(join(skills, 'drama-outline/scripts/lib.mjs'), 'utf8');
  for (const name of readdirSync(skills)) assert.equal(readFileSync(join(skills, name, 'scripts/lib.mjs'), 'utf8'), runtime, name + ' runtime drift');
  const demo = run(join(root, 'scripts/demo.mjs'), ['--out', join(tmp, 'demo')]);
  assert.equal(demo.status, 0, demo.stderr);
  assert.ok(existsSync(join(tmp, 'demo/index.html')));
  assert.equal(read(join(tmp, 'demo/pipeline.json')).stages.outline.status, 'pending-approval');
  // A declared missing source cannot silently become a skipped check.
  const savedSource = readFileSync(join(tmp, 'source.txt'));
  rmSync(join(tmp, 'source.txt'));
  const missingSource = refresh(project, pipelinePath);
  assert.equal(missingSource.stages.outline.validation.ok, false);
  writeFileSync(join(tmp, 'source.txt'), savedSource);
  // Invalid nested shapes produce structured diagnostics, and report scripts compile.
  for (const [stage, name] of Object.entries(names)) {
    const api = await import(pathToFileURL(join(skills, name, 'scripts', name + '.mjs')));
    const malformed = read(join(tmp, stage + '.json'));
    if (malformed.episodes) malformed.episodes = [null];else if (malformed.characters) malformed.characters = [null];else if (malformed.locations) malformed.locations = [null];
    assert.equal(api.validate(malformed, {
      script,
      staging
    }).ok, false, name + ' must diagnose malformed nested data');
    const report = join(tmp, stage + '.html');
    const args = ['render', join(tmp, stage + '.json'), '--out', report];
    if (stage === 'storyboard') args.push('--script', join(tmp, 'script.json'), '--staging', join(tmp, 'staging.json'));
    const rendered = run(join(skills, name, 'scripts', name + '.mjs'), args);
    assert.equal(rendered.status, 0, rendered.stderr);
    const html = readFileSync(report, 'utf8');
    for (const match of html.matchAll(/<script(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/g)) new Script(match[1]);
  }
  // Reference image links rebase relative to the report, and embedded data stays inert.
  const {
    render,
    embed,
    imageLink
  } = await import('../skills/drama-outline/scripts/lib.mjs');
  const hostile = {
    schemaVersion: 1,
    kind: 'outline',
    id: 'hostile',
    title: '<script>danger</script>'
  };
  assert.ok(!embed(hostile).includes('<script>'));
  assert.ok(render(hostile, {
    ok: true,
    issues: [],
    skipped: []
  }).includes('&lt;script&gt;danger&lt;/script&gt;'));
  assert.equal(imageLink('images/a b.png', join(tmp, 'input.json'), join(tmp, 'reports/out.html')), '../images/a%20b.png');
  // Every directory travels independently; its self-test cannot reach sibling code.
  for (const name of readdirSync(skills)) {
    const isolated = join(tmp, 'isolated', name);
    cpSync(join(skills, name), isolated, {
      recursive: true
    });
    const result = run(join(isolated, 'scripts/selftest.mjs'), [], isolated);
    assert.equal(result.status, 0, result.stderr);
    for (const f of readdirSync(join(isolated, 'scripts')).filter(n => n.endsWith('.mjs'))) {
      const source = readFileSync(join(isolated, 'scripts', f), 'utf8');
      assert.doesNotMatch(source, /(?:from\s*|import\s*\()['"]\.\.\//, name + ' has a parent import');
    }
  }
  // Run every documented README command, including expected pending-image checkup.
  for (const name of readdirSync(skills)) {
    const dir = join(skills, name),
      doc = readFileSync(join(dir, 'README.md'), 'utf8');
    for (const line of doc.split('\n').filter(l => l.startsWith('node '))) {
      const args = line.split(/\s+#/)[0].trim().split(/\s+/).slice(1);
      const result = run(resolve(dir, args.shift()), args, dir);
      assert.equal(result.status, name === 'character-refs' && line.includes('checkup') ? 1 : 0, name + ': ' + line + '\n' + result.stderr);
    }
  }
  console.log('Integration: full production, approvals, revisions, exports, portability, and README commands passed.');
} finally {
  rmSync(tmp, {
    recursive: true,
    force: true
  });
}
