// Local runtime: this file travels with the skill. Node.js built-ins only.
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { dirname, resolve, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
export const text = v => typeof v === 'string' && v.trim().length > 0;
export const list = v => Array.isArray(v) ? v : [];
export const finite = v => typeof v === 'number' && Number.isFinite(v);
export const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
export const read = path => JSON.parse(readFileSync(path, 'utf8'));
export function save(path, doc) {
  mkdirSync(dirname(resolve(path)), {
    recursive: true
  });
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(doc, null, 2) + '\n');
  renameSync(temporary, path);
}
export function inspection(doc, kind) {
  const issues = [],
    skipped = [];
  const check = (condition, rule, path, message) => {
    if (!condition) issues.push({
      rule,
      path,
      message
    });
  };
  const skip = (rule, message) => skipped.push({
    rule,
    message
  });
  const string = (v, path) => check(text(v), 'required-text', path, 'Provide non-empty text.');
  const array = (v, path, min = 1) => check(Array.isArray(v) && v.length >= min, 'required-array', path, `Provide an array with at least ${min} entries.`);
  const unique = (items, path) => {
    const seen = new Set();
    list(items).forEach((v, i) => {
      string(v?.id, `${path}[${i}].id`);
      check(!seen.has(v?.id), 'duplicate-id', `${path}[${i}].id`, 'Use a unique stable ID.');
      seen.add(v?.id);
    });
  };
  check(doc && typeof doc === 'object' && !Array.isArray(doc), 'document', '$', 'Provide a JSON object.');
  check(doc?.schemaVersion === 1, 'schema-version', '$.schemaVersion', 'Supported schemaVersion is 1.');
  check(doc?.kind === kind, 'artifact-kind', '$.kind', `Expected kind ${kind}.`);
  string(doc?.id, '$.id');
  string(doc?.title, '$.title');
  return {
    check,
    skip,
    string,
    array,
    unique,
    result: () => ({
      ok: issues.length === 0,
      issues,
      skipped
    })
  };
}
export function reference(g, id, items, path) {
  g.check(list(items).some(v => v?.id === id), 'reference', path, `Unknown reference: ${id}.`);
}
export function evidence(g, quotes, source, path) {
  g.array(quotes, path);
  list(quotes).forEach((q, i) => {
    g.string(q, `${path}[${i}]`);
    if (source !== undefined) g.check(text(q) && source.replace(/\r\n/g, '\n').includes(q.replace(/\r\n/g, '\n')), 'source-evidence', `${path}[${i}]`, 'Quotation must occur verbatim in the supplied source.');
  });
}
export function chunk(source, size = 12000, overlap = 300) {
  if (!Number.isInteger(size) || size < 1 || !Number.isInteger(overlap) || overlap < 0 || overlap >= size) throw new Error('Chunk size must be positive and overlap smaller than size.');
  const s = source.replace(/\r\n/g, '\n');
  const chunks = [];
  for (let start = 0; start < s.length;) {
    const end = Math.min(start + size, s.length);
    chunks.push({
      id: `chunk-${chunks.length + 1}`,
      start,
      end,
      text: s.slice(start, end)
    });
    if (end === s.length) break;
    start = end - overlap;
  }
  return {
    schemaVersion: 1,
    sourceHash: hash(s),
    characters: s.length,
    truncated: false,
    chunks
  };
}
export function beatSeconds(beat, params = {}) {
  if (finite(beat.audioSeconds) && beat.audioSeconds >= 0) return beat.audioSeconds;
  if (beat.type === 'dialogue') return (String(beat.line ?? '').match(/\S+/gu) ?? []).length * 60 / (params.wordsPerMinute ?? 150);
  return beat.seconds ?? params.actionSeconds ?? 2.5;
}
export function timing(g, params = {}) {
  const p = {
    wordsPerMinute: 150,
    actionSeconds: 2.5,
    tolerance: 0.15,
    ...params
  };
  g.check(finite(p.wordsPerMinute) && p.wordsPerMinute > 0, 'timing-parameter', '$.params.wordsPerMinute', 'Use a positive speaking rate.');
  g.check(finite(p.actionSeconds) && p.actionSeconds > 0, 'timing-parameter', '$.params.actionSeconds', 'Use a positive action duration.');
  g.check(finite(p.tolerance) && p.tolerance >= 0 && p.tolerance <= 1, 'timing-parameter', '$.params.tolerance', 'Use a tolerance between zero and one.');
  return p;
}
export function parse(argv) {
  const args = [],
    opts = {};
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (!item.startsWith('--')) {
      args.push(item);
      continue;
    }
    const key = item.slice(2);
    if (['md', 'html', 'help'].includes(key)) opts[key] = true;else {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Missing value for --${key}.`);
      opts[key] = argv[++i];
    }
  }
  return {
    args,
    opts
  };
}
export function context(opts) {
  const ctx = {};
  for (const key of ['outline', 'cast', 'art', 'script', 'staging']) if (opts[key]) ctx[key] = read(resolve(opts[key]));
  if (opts.source) ctx.source = readFileSync(resolve(opts.source), 'utf8');
  return ctx;
}
export const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
export const embed = doc => JSON.stringify(doc).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const label = s => s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
function fields(value, depth = 0) {
  if (value === null || value === undefined) return '<span class="muted">Not supplied</span>';
  if (typeof value !== 'object') return `<span>${escape(value)}</span>`;
  if (Array.isArray(value) && value.every(v => v === null || typeof v !== 'object')) return value.length ? `<span>${value.map(escape).join(' · ')}</span>` : '<span class="muted">None</span>';
  if (Array.isArray(value)) return value.length ? `<div class="entries">${value.map((v, i) => `<article><div class="index">${String(i + 1).padStart(2, '0')}</div>${fields(v, depth + 1)}</article>`).join('')}</div>` : '<span class="muted">None</span>';
  return `<dl>${Object.entries(value).map(([k, v]) => `<div class="field"><dt>${escape(label(k))}</dt><dd>${fields(v, depth + 1)}</dd></div>`).join('')}</dl>`;
}
export function markdown(doc, result) {
  const walk = (v, indent = '') => typeof v !== 'object' || v === null ? String(v ?? '') : Object.entries(v).map(([k, x]) => `${indent}- ${k}: ${x && typeof x === 'object' ? '\n' + walk(x, indent + '  ') : String(x)}`).join('\n');
  return `# ${doc.title}\n\nValidation: ${result.ok ? 'passed' : 'failed'}\n\n${walk(doc)}\n\n${walk(result)}\n`;
}
export function render(doc, result, {
  extra = '',
  images = []
} = {}) {
  const issues = result.issues.map(v => `<li><code>${escape(v.rule)} · ${escape(v.path)}</code> ${escape(v.message)}</li>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(doc.title)} · zskills</title>
<style>:root{font:16px/1.55 system-ui,sans-serif;color:#182b40;background:#edf1f4}*{box-sizing:border-box}body{margin:0}header{background:#152c42;color:#fff;padding:3rem max(5vw,1rem)}h1{font:500 clamp(2rem,5vw,3.6rem)/1.1 Georgia,serif;margin:.6rem 0}header p{color:#bfd0df;max-width:65ch}.eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:.75rem;color:#f6c875}main{max-width:1160px;margin:auto;padding:2rem 1rem}section{background:#fff;padding:1.5rem 2rem;margin-bottom:1rem;border-radius:8px;border:1px solid #d9e1e7}h2{font:500 1.6rem Georgia,serif;margin:.1rem 0 1.2rem}button,.button{font:inherit;border:1px solid #557184;border-radius:5px;padding:.5rem .9rem;cursor:pointer;background:#fff;color:#182b40}button:hover{background:#e6edf1}.status{display:inline-block;padding:.3rem .7rem;border-radius:4px;background:#dceee6;color:#205b41}.status.fail{background:#ffe1da;color:#923b29}dl{margin:0}.field{display:grid;grid-template-columns:minmax(120px,22%) 1fr;gap:1rem;padding:.65rem 0;border-bottom:1px solid #edf1f4}dt{font-size:.8rem;font-weight:650;color:#526c80}dd{margin:0;min-width:0;white-space:pre-wrap;overflow-wrap:anywhere}.entries{display:grid;gap:.7rem}article{padding:.9rem;background:#f5f7f9;border-radius:5px}.index{font-size:.7rem;color:#657e91;letter-spacing:.12em}article article{background:#fff}code{font-size:.8rem}.muted{color:#6d7d89}.actions{display:flex;gap:.7rem;flex-wrap:wrap}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}img{width:100%;max-height:360px;object-fit:contain;background:#f5f7f9}figure{margin:0}figcaption{font-size:.8rem}.warning{border-left:4px solid #d39842}footer{color:#617183;font-size:.8rem;padding:1rem}@media(max-width:650px){.field{grid-template-columns:1fr;gap:.2rem}section{padding:1rem}}@media print{button,.actions{display:none}section{break-inside:avoid}header{color:#182b40;background:#fff}}</style>
<header><div class="eyebrow">zskills / ${escape(doc.kind)}</div><h1>${escape(doc.title)}</h1><p>Production working document. Structural checks support editorial and visual review; they do not replace it.</p><div class="actions"><button id="download">Export JSON</button><button id="copy">Copy JSON</button><button id="review">Review JSON</button><button onclick="print()">Print</button></div></header>
<main><section id="json-preview" hidden><h2>Working JSON</h2><p>Copy this current data if your browser restricts downloads or clipboard access.</p><textarea aria-label="Working JSON export" readonly style="width:100%;min-height:300px;font:13px monospace"></textarea></section><section><h2>Validation</h2><span class="status ${result.ok ? '' : 'fail'}">${result.ok ? 'Passed' : 'Needs attention'}</span>${issues ? `<ul>${issues}</ul>` : '<p>No structural violations found.</p>'}${result.skipped.map(v => `<p class="muted">Skipped ${escape(v.rule)}: ${escape(v.message)}</p>`).join('')}</section>${extra}${images.length ? `<section><h2>Reference images</h2><div class="gallery">${images.map(i => `<figure><img src="${escape(i.src)}" alt="${escape(i.label)}"><figcaption>${escape(i.label)}</figcaption></figure>`).join('')}</div></section>` : ''}<section><h2>Production data</h2>${fields(doc)}</section><footer>zskills · Schema ${escape(doc.schemaVersion)} · Offline report</footer></main>
<script id="artifact" type="application/json">${embed(doc)}</script><script>let working=JSON.parse(document.getElementById('artifact').textContent);document.getElementById('review').onclick=()=>{const preview=document.getElementById('json-preview');preview.hidden=false;preview.querySelector('textarea').value=JSON.stringify(working,null,2);preview.scrollIntoView({behavior:'smooth'})};document.getElementById('download').onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(working,null,2)+'\\n'],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download=working.kind+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};document.getElementById('copy').onclick=async()=>{try{await navigator.clipboard.writeText(JSON.stringify(working,null,2));document.getElementById('copy').textContent='Copied'}catch{document.getElementById('copy').textContent='Use Export JSON'}};</script></html>`;
}
export function imageLink(file, input, output) {
  const absolute = resolve(dirname(input), file);
  return relative(output ? dirname(resolve(output)) : dirname(resolve(input)), absolute).split(sep).join('/').split('/').map(encodeURIComponent).join('/');
}
export function main(meta, argv = process.argv.slice(2)) {
  try {
    const {
      args,
      opts
    } = parse(argv);
    const [command, file] = args;
    const allowed = new Set(['out', 'md', 'html', 'help', 'outline', 'cast', 'art', 'script', 'staging', 'source', ...(meta.options ?? [])]);
    for (const k of Object.keys(opts)) if (!allowed.has(k)) throw new Error(`Unknown option --${k}.`);
    if (!command || command === 'help' || opts.help) {
      console.log(meta.help);
      return;
    }
    if (opts.md && opts.html) throw new Error('Choose either --md or --html.');
    const ctx = context(opts);
    const emit = value => {
      const s = typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n';
      if (opts.out) {
        mkdirSync(dirname(resolve(opts.out)), {
          recursive: true
        });
        writeFileSync(opts.out, s);
      } else process.stdout.write(s);
    };
    if (meta.commands?.[command]) {
      return meta.commands[command]({
        file,
        args: args.slice(1),
        opts,
        ctx,
        emit
      });
    }
    if (!['validate', 'checkup', 'render'].includes(command)) throw new Error(`Unknown command ${command}. See help.`);
    if (!file) throw new Error('Provide an artifact path.');
    const doc = read(file);
    ctx.artifactPath = resolve(file);
    const result = meta.validate(doc, ctx);
    if (command === 'render') emit(opts.md ? markdown(doc, result) : meta.render ? meta.render(doc, result, {
      file,
      opts,
      ctx
    }) : render(doc, result));else {
      emit(result);
      if (!result.ok) process.exitCode = 1;
    }
  } catch (e) {
    console.error(JSON.stringify({
      error: e.message
    }));
    process.exitCode = 2;
  }
}
export function isMain(url) {
  return process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === url;
}
export function guardedValidation(fn, doc, ctx = {}) {
  try {
    return fn(doc, ctx);
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    return {
      ok: false,
      issues: [{
        rule: 'structure',
        path: '$',
        message: 'Malformed artifact structure: ' + error.message
      }],
      skipped: []
    };
  }
}
