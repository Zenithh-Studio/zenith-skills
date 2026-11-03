import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validate } from './novel-script.mjs';
const sample = JSON.parse(readFileSync(new URL('../examples/sample.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(sample);
assert.equal(validate(sample).ok, true, JSON.stringify(validate(sample)));
import { statistics, linebook, seed } from './novel-script.mjs';
import { beatSeconds } from './lib.mjs';
const ctx = Object.fromEntries(['outline', 'art', 'cast'].map(k => [k, JSON.parse(readFileSync(new URL('../examples/' + k + '.json', import.meta.url), 'utf8'))]));
assert.equal(validate(sample, ctx).ok, true, JSON.stringify(validate(sample, ctx)));
assert.equal(statistics(sample)[0].estimatedSeconds, 12);
assert.equal(beatSeconds({
  type: 'dialogue',
  line: 'Two words',
  audioSeconds: 3
}), 3);
assert.equal(beatSeconds({
  type: 'dialogue',
  line: 'Two words'
}, {
  wordsPerMinute: 120
}), 1);
assert.equal(linebook(sample, ctx)[0].voicePrompt, ctx.cast.characters[1].voicePrompt);
let d = copy();
d.episodes[0].scenes[0].beats[1].speakerId = 'missing';
assert.equal(validate(d, ctx).ok, false);
d = copy();
d.episodes[0].targetSeconds = 100;
assert.ok(validate(d).issues.some(v => v.rule === 'episode-timing'));
d = copy();
d.episodes[0].hookBeatId = 'BT04';
assert.ok(validate(d).issues.some(v => v.rule === 'hook-window'));
d = copy();
d.params.wordsPerMinute = 0;
assert.equal(validate(d).ok, false);
d = copy();
d.episodes[0].scenes[0].variantId = 'day';
assert.equal(validate(d, ctx).ok, false);
assert.equal(seed(ctx.outline).episodes[0].id, 'E01');
console.log('novel-script: all offline checks passed.');
