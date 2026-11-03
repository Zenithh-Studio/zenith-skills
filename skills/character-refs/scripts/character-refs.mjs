import { guardedValidation, inspection, list, text, finite, main, isMain, read, save, hash, render, imageLink } from './lib.mjs';
import { inspectPng } from './png.mjs';
import { readFileSync, existsSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
export const views = {
  'front-full': {
    width: 768,
    height: 1152,
    prompt: 'Front view, full body, neutral standing pose.'
  },
  'face-front': {
    width: 768,
    height: 960,
    prompt: 'Front-facing head and shoulders, clearly visible facial details.'
  },
  'side-full': {
    width: 768,
    height: 1152,
    prompt: 'Full body, strict right-facing profile.'
  },
  'back-full': {
    width: 768,
    height: 1152,
    prompt: 'Full body, directly from behind.'
  }
};
export const designHash = asset => hash({
  characterId: asset.characterId,
  design: asset.design
});
export const current = (asset, view) => list(asset.views?.[view]).at(-1);
export function state(asset, view) {
  const v = current(asset, view);
  if (!v) return 'missing';
  if (v.designHash !== designHash(asset)) return 'stale';
  if (list(v.references).some(ref => {
    const actual = current(asset, ref.view);
    return !actual || actual.version !== ref.version || actual.sha256 !== ref.sha256 || actual.designHash !== designHash(asset);
  })) return 'stale';
  return 'current';
}
export function approved(asset) {
  const v = current(asset, 'front-full');
  return !!v && state(asset, 'front-full') === 'current' && asset.anchorApproval?.sha256 === v.sha256 && asset.anchorApproval?.version === v.version && asset.anchorApproval?.designHash === designHash(asset);
}
export function seed(cast, id, style = 'Neutral studio reference, plain light background.') {
  const c = list(cast.characters).find(c => c.id === id);
  if (!c) throw new Error('Character ID not found in cast.');
  return {
    schemaVersion: 1,
    kind: 'character-refs',
    id: c.id + '-refs',
    title: c.name + ' — Character References',
    characterId: c.id,
    design: {
      appearance: c.appearance,
      imagePrompt: c.imagePrompt,
      style
    },
    views: {},
    anchorApproval: null
  };
}
function validateDocument(asset, ctx = {}) {
  const g = inspection(asset, 'character-refs');
  if (!asset || typeof asset !== 'object') return g.result();
  g.string(asset.characterId, '$.characterId');
  for (const k of ['appearance', 'imagePrompt', 'style']) g.string(asset.design?.[k], '$.design.' + k);
  g.check(asset.views && typeof asset.views === 'object' && !Array.isArray(asset.views), 'views', '$.views', 'Provide a view-to-version-array object.');
  for (const [view, versions] of Object.entries(asset.views ?? {})) {
    g.check(!!views[view], 'view', '$.views.' + view, 'Use a supported reference view.');
    g.array(versions, '$.views.' + view);
    let n = 0;
    for (const v of list(versions)) {
      const p = `$.views.${view}[${n++}]`;
      g.check(v.version === n, 'image-version', p + '.version', 'Append consecutive image versions, starting at one.');
      for (const k of ['jobId', 'file', 'sha256', 'model', 'prompt', 'designHash', 'createdAt']) g.string(v[k], p + '.' + k);
      g.array(v.references, p + '.references', 0);
      if (view !== 'front-full') g.check(list(v.references).length === 1 && v.references[0].view === 'front-full', 'anchor-reference', p + '.references', 'Derived views must reference exactly the anchor.');else g.check(list(v.references).length === 0, 'anchor-reference', p + '.references', 'The anchor has no image reference.');
      if (ctx.artifactPath) {
        const path = resolve(dirname(ctx.artifactPath), v.file);
        g.check(existsSync(path), 'image-file', p + '.file', 'Image file is missing.');
        if (existsSync(path)) g.check(hash(readFileSync(path)) === v.sha256, 'image-integrity', p + '.sha256', 'Image bytes differ from the recorded hash.');
      }
    }
    g.check(state(asset, view) === 'current', 'stale-image', '$.views.' + view, 'Regenerate this view after its design or anchor changed.');
  }
  g.check(!!current(asset, 'front-full'), 'missing-anchor', '$.views.front-full', 'Prepare and import an anchor image.');
  g.check(approved(asset), 'anchor-approval', '$.anchorApproval', 'Show the current anchor to the user and record approval before deriving views.');
  if (ctx.cast) {
    const c = list(ctx.cast.characters).find(v => v.id === asset.characterId);
    g.check(!!c && c.appearance === asset.design?.appearance && c.imagePrompt === asset.design?.imagePrompt, 'cast-design', '$.design', 'Refresh design fields from the current cast before reusing images.');
  } else g.skip('cast-design', 'Supply --cast to reconcile the current character design.');
  if (!ctx.artifactPath) g.skip('image-integrity', 'Validate through the CLI or provide artifactPath to verify local image hashes.');
  return g.result();
}
export function prepare(asset, view, assetPath) {
  if (!views[view]) throw new Error('Unknown view. Supported: ' + Object.keys(views).join(', '));
  if (view !== 'front-full' && !approved(asset)) throw new Error('Current anchor approval is required before derived views.');
  const anchor = current(asset, 'front-full');
  const references = view === 'front-full' ? [] : [{
    view: 'front-full',
    version: anchor.version,
    sha256: anchor.sha256,
    file: resolve(dirname(assetPath), anchor.file)
  }];
  for (const ref of references) if (!existsSync(ref.file) || hash(readFileSync(ref.file)) !== ref.sha256) throw new Error('Anchor file is missing or has changed.');
  return {
    schemaVersion: 1,
    kind: 'image-job',
    id: randomUUID(),
    assetId: asset.id,
    characterId: asset.characterId,
    view,
    designHash: designHash(asset),
    ...views[view],
    prompt: [asset.design.imagePrompt, asset.design.style, views[view].prompt].join(' '),
    references
  };
}
export function importResult(asset, job, result, assetPath, resultPath) {
  if (job.schemaVersion !== 1 || job.kind !== 'image-job' || !views[job.view] || job.assetId !== asset.id || job.characterId !== asset.characterId || job.designHash !== designHash(asset) || result.jobId !== job.id || !text(result.model) || !text(result.file)) throw new Error('Result/job identity, model, or current design does not match.');
  if (Object.values(asset.views).flat().some(v => v.jobId === job.id)) throw new Error('This job was already imported. Prepare a new job to regenerate.');
  if (job.view !== 'front-full') {
    if (!approved(asset)) throw new Error('Anchor approval has expired.');
    const ref = job.references?.[0],
      anchor = current(asset, 'front-full');
    const anchorPath = resolve(dirname(assetPath), anchor.file);
    if (!existsSync(anchorPath) || hash(readFileSync(anchorPath)) !== anchor.sha256) throw new Error('Anchor file changed after job preparation.');
    if (job.references?.length !== 1 || ref.view !== 'front-full' || ref.version !== anchor.version || ref.sha256 !== anchor.sha256) throw new Error('Job references an obsolete anchor.');
  }
  const bytes = readFileSync(resolve(dirname(resultPath), result.file)),
    size = inspectPng(bytes);
  if (size.width !== job.width || size.height !== job.height) throw new Error(`Expected ${job.width}x${job.height}, received ${size.width}x${size.height}.`);
  const versions = asset.views[job.view] ??= [];
  const version = versions.length + 1;
  const file = `images/${hash(asset.id).slice(0, 16)}/${job.view}.v${version}.png`;
  const path = resolve(dirname(assetPath), file);
  if (existsSync(path)) throw new Error('Image version path already exists; refusing overwrite.');
  mkdirSync(dirname(path), {
    recursive: true
  });
  writeFileSync(path, bytes, {
    flag: 'wx'
  });
  versions.push({
    version,
    jobId: job.id,
    file,
    sha256: hash(bytes),
    model: result.model,
    prompt: job.prompt,
    designHash: job.designHash,
    references: job.references.map(({
      view,
      version,
      sha256
    }) => ({
      view,
      version,
      sha256
    })),
    width: size.width,
    height: size.height,
    createdAt: new Date().toISOString()
  });
  if (job.view === 'front-full') asset.anchorApproval = null;
  save(assetPath, asset);
  return asset;
}
export function confirm(asset, assetPath) {
  const anchor = current(asset, 'front-full');
  if (!anchor || state(asset, 'front-full') !== 'current') throw new Error('Import a current anchor first.');
  const path = resolve(dirname(assetPath), anchor.file);
  if (!existsSync(path) || hash(readFileSync(path)) !== anchor.sha256) throw new Error('Anchor file is missing or has changed.');
  asset.anchorApproval = {
    sha256: anchor.sha256,
    version: anchor.version,
    designHash: designHash(asset),
    approvedAt: new Date().toISOString()
  };
  save(assetPath, asset);
  return asset;
}
export function generate(assetPath, view, config) {
  const asset = read(assetPath),
    job = prepare(asset, view, assetPath);
  if (!config || !text(config.executable) || !Array.isArray(config.args) || !config.args.every(v => typeof v === 'string')) throw new Error('Configure an executable and argument array, or use prepare/import with an Agent image tool.');
  const temp = mkdtempSync(join(tmpdir(), 'zskills-image-job-'));
  try {
    const request = join(temp, 'request.json'),
      result = join(temp, 'result.json');
    save(request, job);
    const args = config.args.map(v => v.replaceAll('{request}', request).replaceAll('{result}', result));
    const timeout = config.timeoutMs ?? 120000;
    if (!Number.isInteger(timeout) || timeout <= 0) throw new Error('timeoutMs must be a positive integer.');
    const run = spawnSync(config.executable, args, {
      shell: false,
      timeout,
      maxBuffer: 256 * 1024
    });
    if (run.error) throw new Error('Custom generator failed: ' + run.error.code);
    if (run.status !== 0) throw new Error('Custom generator failed with exit ' + run.status + '.');
    if (!existsSync(result)) throw new Error('Custom generator did not write result.json.');
    importResult(asset, job, read(result), assetPath, result);
    return {
      assetPath,
      view,
      status: state(asset, view)
    };
  } finally {
    rmSync(temp, {
      recursive: true,
      force: true
    });
  }
}
export function renderRefs(doc, result, {
  file,
  opts
}) {
  const images = Object.keys(doc.views ?? {}).filter(v => current(doc, v)).map(view => ({
    src: imageLink(current(doc, view).file, file, opts.out),
    label: `${view} · v${current(doc, view).version} · ${state(doc, view)}`
  }));
  return render(doc, result, {
    images
  });
}
export function validate(doc, ctx = {}) {
  return guardedValidation(validateDocument, doc, ctx);
}
if (isMain(import.meta.url)) main({
  validate,
  render: renderRefs,
  options: ['character', 'style', 'view', 'job', 'result', 'config'],
  help: 'character-refs: seed <cast.json> --character C01 [--style text] [--out asset.json]\nvalidate|checkup|render <asset.json> [--cast cast.json] [--out path]\nprepare <asset.json> --view front-full|face-front|side-full|back-full --out job.json\nimport <asset.json> --job job.json --result result.json\nconfirm <asset.json> (only after user approval)\ngenerate <asset.json> --view VIEW --config config.local.json',
  commands: {
    seed: ({
      file,
      opts,
      emit
    }) => emit(seed(read(file), opts.character, opts.style)),
    prepare: ({
      file,
      opts,
      emit
    }) => {
      if (!opts.out) throw new Error('Provide --out job.json.');
      emit(prepare(read(file), opts.view, resolve(file)));
    },
    import: ({
      file,
      opts
    }) => {
      importResult(read(file), read(opts.job), read(opts.result), resolve(file), resolve(opts.result));
      console.log('Image imported; inspect it before approval.');
    },
    confirm: ({
      file
    }) => {
      confirm(read(file), resolve(file));
      console.log('Anchor approval recorded for its current fingerprint.');
    },
    generate: ({
      file,
      opts
    }) => console.log(JSON.stringify(generate(resolve(file), opts.view, read(opts.config))))
  }
});
