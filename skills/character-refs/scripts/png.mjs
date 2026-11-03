import { inflateSync } from 'node:zlib';
function crc(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
export function inspectPng(bytes){
 if(bytes.length>20*1024*1024||bytes.length<57||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('Expected a PNG image no larger than 20 MB.');
 let width,height,ended=false;const data=[];let count=0;
 for(let offset=8;offset<bytes.length;){if(offset+12>bytes.length)throw new Error('Truncated PNG chunk.');const n=bytes.readUInt32BE(offset),end=offset+12+n;if(end>bytes.length)throw new Error('Truncated PNG payload.');const type=bytes.subarray(offset+4,offset+8).toString();if(crc(bytes.subarray(offset+4,offset+8+n))!==bytes.readUInt32BE(offset+8+n))throw new Error('PNG checksum mismatch.');if(count++===0&&type!=='IHDR')throw new Error('PNG must start with IHDR.');if(type==='IHDR'){if(n!==13||width!==undefined)throw new Error('Invalid PNG header.');width=bytes.readUInt32BE(offset+8);height=bytes.readUInt32BE(offset+12);if(width<16||height<16||width*height>16000000)throw new Error('PNG dimensions must be at least 16px and at most 16 million pixels.');}if(type==='IDAT')data.push(bytes.subarray(offset+8,offset+8+n));if(type==='IEND'){ended=true;if(end!==bytes.length)throw new Error('Unexpected data after IEND.');break;}offset=end;}
 if(!ended||!data.length)throw new Error('Incomplete PNG image.');inflateSync(Buffer.concat(data),{maxOutputLength:128*1024*1024});return {width,height};
}
