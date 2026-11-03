import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validate } from './novel-outline.mjs';
const sample = JSON.parse(readFileSync(new URL('../examples/sample.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(sample);
assert.equal(validate(sample).ok, true, JSON.stringify(validate(sample)));
import { chunk } from './lib.mjs';
import { inventory, seed } from './novel-outline.mjs';
const source = readFileSync(new URL('../examples/source.txt', import.meta.url), 'utf8');
assert.equal(validate(sample, {
  source
}).ok, true);
let d = copy();
d.adaptation.decisions[0].evidence = ['Not in the source'];
assert.equal(validate(d, {
  source
}).ok, false);
d = copy();
d.characters.push(d.characters[0]);
assert.ok(validate(d).issues.some(v => v.rule === 'duplicate-id'));
d = copy();
d.episodes[0].locationIds = ['missing'];
assert.ok(validate(d).issues.some(v => v.rule === 'reference'));
d = copy();
d.episodes[0].hook = '';
assert.equal(validate(d).ok, false);
assert.deepEqual(inventory(sample).characters[0].episodeIds, ['E01']);
assert.equal(validate(seed({
  id: 'draft',
  title: 'Draft'
})).ok, false);
const c = chunk('0123456789'.repeat(10), 17, 3);
assert.equal(c.truncated, false);
assert.equal(c.chunks.at(-1).end, 100);
assert.ok(c.chunks.every(v => v.text === '0123456789'.repeat(10).slice(v.start, v.end)));
assert.throws(() => chunk('abc', 2, 2));
console.log('novel-outline: all offline checks passed.');
