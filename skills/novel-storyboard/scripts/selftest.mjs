import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validate } from './novel-storyboard.mjs';
const sample = JSON.parse(readFileSync(new URL('../examples/sample.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(sample);
import { seed, opening, production, exportPack } from './novel-storyboard.mjs';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const ctx = Object.fromEntries(['script', 'staging'].map(k => [k, JSON.parse(readFileSync(new URL('../examples/' + k + '.json', import.meta.url), 'utf8'))]));
assert.equal(validate(sample, ctx).ok, true, JSON.stringify(validate(sample, ctx)));
assert.equal(validate(sample).ok, false);
assert.equal(seed(ctx.script, ctx.staging).episodes[0].segments[0].openingBlocking, opening(ctx.staging.scenes[0]));
let d = copy();
d.episodes[0].segments[0].cuts[0].beatIds = ['BT02'];
assert.ok(validate(d, ctx).issues.some(v => v.rule === 'beat-coverage'));
d = copy();
d.episodes[0].segments[0].openingBlocking = 'A different opening';
assert.ok(validate(d, ctx).issues.some(v => v.rule === 'staging-handoff'));
d = copy();
d.episodes[0].segments[0].cuts[1].seconds = 2;
assert.ok(validate(d, ctx).issues.some(v => v.rule === 'beat-fit'));
const data = production(sample, ctx.script);
assert.equal(data.timeline.at(-1).endSeconds, 12);
assert.equal(data.dialogue[0].line, ctx.script.episodes[0].scenes[0].beats[1].line);
// Multiple spoken beats in a cut follow preceding action and each other.
const combined = copy();
combined.episodes[0].segments[0].cuts = [{
  ...combined.episodes[0].segments[0].cuts[0],
  beatIds: ['BT01', 'BT02', 'BT03', 'BT04'],
  seconds: 12
}];
assert.deepEqual(production(combined, ctx.script).dialogue.map(v => v.startSeconds), [2, 8]);
const temp = mkdtempSync(join(tmpdir(), 'zskills-board-'));
try {
  const input = join(temp, 'board.json');
  writeFileSync(input, JSON.stringify(sample));
  const out = join(temp, 'pack');
  assert.equal(exportPack(sample, ctx, input, out).missingAssets, 4);
  assert.ok(existsSync(join(out, 'manifest.json')));
  assert.throws(() => exportPack(sample, ctx, input, out));
} finally {
  rmSync(temp, {
    recursive: true,
    force: true
  });
}
console.log('novel-storyboard: all offline checks passed.');
