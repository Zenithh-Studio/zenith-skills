import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validate } from './novel-staging.mjs';
const sample = JSON.parse(readFileSync(new URL('../examples/sample.json',import.meta.url),'utf8'));
const copy = () => structuredClone(sample);
assert.equal(validate(sample).ok,true,JSON.stringify(validate(sample)));

import { stagingCore, blocking, seed } from './novel-staging.mjs';
const ctx=Object.fromEntries(['script','art'].map(k=>[k,JSON.parse(readFileSync(new URL('../examples/'+k+'.json',import.meta.url),'utf8'))]));
assert.equal(validate(sample,ctx).ok,true);
let d=copy();d.scenes[0].places.pop();assert.equal(validate(d,ctx).ok,false);
d=copy();d.scenes[0].places[1].x=d.scenes[0].places[0].x;d.scenes[0].places[1].y=d.scenes[0].places[0].y;assert.ok(validate(d).issues.some(v=>v.rule==='collision'));
d=copy();d.scenes[0].places[0].present=false;assert.equal(validate(d).ok,false);
const core=stagingCore();const browser=new Function('return ('+stagingCore.toString()+')()')();
assert.deepEqual(browser.blocking(sample.scenes[0]),core.blocking(sample.scenes[0]));
d=copy();core.move(d,'SC01','C01',4,-2);assert.equal(d.scenes[0].places[0].x,1);assert.equal(d.scenes[0].places[0].y,0);
assert.match(blocking(sample)[0].text,/C01 stands/);assert.equal(seed(ctx.script,ctx.art).scenes[0].id,'SC01');

console.log('novel-staging: all offline checks passed.');
