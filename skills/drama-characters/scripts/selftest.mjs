import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validate } from './drama-characters.mjs';
const sample = JSON.parse(readFileSync(new URL('../examples/sample.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(sample);
assert.equal(validate(sample).ok, true, JSON.stringify(validate(sample)));
import { seed } from './drama-characters.mjs';
const outline = JSON.parse(readFileSync(new URL('../examples/outline.json', import.meta.url), 'utf8'));
const source = readFileSync(new URL('../examples/source.txt', import.meta.url), 'utf8');
assert.equal(validate(sample, {
  outline,
  source
}).ok, true);
let d = copy();
d.characters[0].evidence = ['Invented quote'];
assert.equal(validate(d, {
  source
}).ok, false);
d = copy();
d.characters.pop();
assert.equal(validate(d, {
  outline
}).ok, false);
d = copy();
d.characters[0].name = 'Someone else';
assert.equal(validate(d, {
  outline
}).ok, false);
d = copy();
d.characters[0].voicePrompt = '';
assert.equal(validate(d).ok, false);
assert.deepEqual(seed(outline).characters.map(v => v.id), ['C01', 'C02']);
assert.equal(validate(seed(outline)).ok, false);
console.log('drama-characters: all offline checks passed.');
