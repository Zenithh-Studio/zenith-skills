// Offline adapter fixture. Solid-color images are test data, not creative output.
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
const [requestPath, resultPath] = process.argv.slice(2);
const job = JSON.parse(readFileSync(requestPath, 'utf8'));
function chunk(type, data) {
  const bytes = Buffer.concat([Buffer.from(type), data]);
  let c = 0xffffffff;
  for (const b of bytes) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = c >>> 1 ^ (c & 1 ? 0xedb88320 : 0);
  }
  const length = Buffer.alloc(4),
    sum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  sum.writeUInt32BE((c ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, bytes, sum]);
}
const header = Buffer.alloc(13);
header.writeUInt32BE(job.width);
header.writeUInt32BE(job.height, 4);
header[8] = 8;
header[9] = 6;
const raw = Buffer.alloc(job.height * (1 + job.width * 4), 255);
for (let y = 0; y < job.height; y++) raw[y * (1 + job.width * 4)] = 0;
const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
writeFileSync(resultPath + '.png', png);
writeFileSync(resultPath, JSON.stringify({
  jobId: job.id,
  model: 'offline-fixture',
  file: resultPath + '.png'
}));
