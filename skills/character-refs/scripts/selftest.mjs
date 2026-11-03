import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validate } from './character-refs.mjs';
const sample = JSON.parse(readFileSync(new URL('../examples/sample.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(sample);
import { seed, prepare, importResult, confirm, state, approved, generate, current } from './character-refs.mjs';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { save, read } from './lib.mjs';
import { inspectPng } from './png.mjs';
const cast = JSON.parse(readFileSync(new URL('../examples/cast.json', import.meta.url), 'utf8'));
assert.equal(validate(sample).ok, false);
function png(w, h) {
  function chunk(type, data) {
    const bytes = Buffer.concat([Buffer.from(type), data]);
    let c = 0xffffffff;
    for (const b of bytes) {
      c ^= b;
      for (let i = 0; i < 8; i++) c = c >>> 1 ^ (c & 1 ? 0xedb88320 : 0);
    }
    const n = Buffer.alloc(4),
      sum = Buffer.alloc(4);
    n.writeUInt32BE(data.length);
    sum.writeUInt32BE((c ^ 0xffffffff) >>> 0);
    return Buffer.concat([n, bytes, sum]);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(w);
  header.writeUInt32BE(h, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.alloc(h * (1 + w * 4), 255).map((v, i) => i % (1 + w * 4) === 0 ? 0 : v))), chunk('IEND', Buffer.alloc(0))]);
}
const tmp = mkdtempSync(join(tmpdir(), 'zskills-refs-'));
try {
  const path = join(tmp, 'asset.json'),
    resultPath = join(tmp, 'result.json');
  let asset = seed(cast, 'C01');
  save(path, asset);
  assert.throws(() => prepare(asset, 'face-front', path));
  const job = prepare(asset, 'front-full', path);
  writeFileSync(join(tmp, 'generated.png'), png(job.width, job.height));
  importResult(asset, job, {
    jobId: job.id,
    model: 'fake-offline',
    file: 'generated.png'
  }, path, resultPath);
  assert.equal(approved(asset), false);
  confirm(asset, path);
  assert.equal(approved(asset), true);
  assert.equal(validate(asset, {
    cast,
    artifactPath: path
  }).ok, true);
  assert.throws(() => importResult(asset, job, {
    jobId: job.id,
    model: 'fake',
    file: 'generated.png'
  }, path, resultPath));
  const derived = prepare(asset, 'side-full', path);
  importResult(asset, derived, {
    jobId: derived.id,
    model: 'fake',
    file: 'generated.png'
  }, path, resultPath);
  assert.equal(state(asset, 'side-full'), 'current');
  const renewed = prepare(asset, 'front-full', path);
  importResult(asset, renewed, {
    jobId: renewed.id,
    model: 'fake',
    file: 'generated.png'
  }, path, resultPath);
  assert.equal(state(asset, 'side-full'), 'stale');
  assert.equal(approved(asset), false);
  confirm(asset, path);
  asset.design.style = 'Different style';
  assert.equal(state(asset, 'front-full'), 'stale');
  assert.equal(approved(asset), false);
  assert.throws(() => confirm(asset, path));
  asset = read(path);
  const fake = join(tmp, 'fake.mjs');
  writeFileSync(fake, `import {readFileSync,writeFileSync} from 'node:fs';\nimport {deflateSync} from 'node:zlib';\n${png.toString()}\nconst [req,res]=process.argv.slice(2);const j=JSON.parse(readFileSync(req));writeFileSync(res+'.png',png(j.width,j.height));writeFileSync(res,JSON.stringify({jobId:j.id,model:'fake-cli',file:res+'.png'}));`);
  generate(path, 'front-full', {
    executable: process.execPath,
    args: [fake, '{request}', '{result}']
  });
  assert.equal(current(read(path), 'front-full').model, 'fake-cli');
  assert.throws(() => generate(path, 'front-full', {
    executable: process.execPath,
    args: ['-e', 'process.exit(3)']
  }), /exit 3/);
  assert.throws(() => generate(path, 'front-full', {
    executable: process.execPath,
    args: ['-e', 'setTimeout(()=>{},1000)'],
    timeoutMs: 20
  }), /ETIMEDOUT/);
  assert.throws(() => generate(path, 'front-full', {
    executable: process.execPath,
    args: ['-e', '']
  }), /did not write/);
  assert.throws(() => inspectPng(Buffer.from('not an image')));
  const bad = png(16, 16);
  bad[25] ^= 1;
  assert.throws(() => inspectPng(bad), /checksum/);
  assert.ok(existsSync(join(tmp, read(path).views['front-full'][0].file)));
} finally {
  rmSync(tmp, {
    recursive: true,
    force: true
  });
}
console.log('character-refs: all offline checks passed.');
