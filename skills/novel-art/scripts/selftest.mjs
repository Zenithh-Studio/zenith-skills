import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validate } from './novel-art.mjs';
const sample = JSON.parse(readFileSync(new URL('../examples/sample.json',import.meta.url),'utf8'));
const copy = () => structuredClone(sample);
assert.equal(validate(sample).ok,true,JSON.stringify(validate(sample)));

import { seed } from './novel-art.mjs';
const outline=JSON.parse(readFileSync(new URL('../examples/outline.json',import.meta.url),'utf8'));
assert.equal(validate(sample,{outline}).ok,true);
let d=copy();d.props[0].states[0].prompt='A huge key';assert.ok(validate(d).issues.some(v=>v.rule==='prop-scale'));
d=copy();d.locations[0].anchors=[];assert.equal(validate(d).ok,false);
d=copy();d.locations[0].variantOf='L01';assert.ok(validate(d).issues.some(v=>v.rule==='variant-cycle'));
d=copy();d.props=[];assert.equal(validate(d,{outline}).ok,false);
assert.equal(seed(outline).locations[0].id,'L01');assert.equal(validate(seed(outline)).ok,false);

console.log('novel-art: all offline checks passed.');
