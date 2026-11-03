import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validate } from './drama-pipeline.mjs';
const sample = JSON.parse(readFileSync(new URL('../examples/sample.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(sample);
assert.equal(validate(sample).ok, true, JSON.stringify(validate(sample)));
import { init, validate as check } from './drama-pipeline.mjs';
const brief = {
  id: 'test',
  title: 'Test',
  genre: 'Suspense',
  episodeCount: 1,
  targetSeconds: 12
};
assert.equal(check(init(brief, '/tmp/skills')).ok, true);
assert.throws(() => init({
  ...brief,
  episodeCount: 0
}, '/tmp/skills'));
assert.throws(() => init(brief));
let d = copy();
d.stages.unknown = {
  paths: ['a.json']
};
assert.equal(validate(d).ok, false);
console.log('drama-pipeline: all offline checks passed.');
