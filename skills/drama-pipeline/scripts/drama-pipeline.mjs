import { guardedValidation, inspection, list, text, main, isMain, read, save, hash, render } from './lib.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
export const modules = {
  outline: 'drama-outline',
  characters: 'drama-characters',
  art: 'drama-art',
  script: 'drama-script',
  staging: 'drama-staging',
  'character-refs': 'character-refs',
  storyboard: 'drama-storyboard'
};
export const dependencies = {
  outline: [],
  characters: ['outline'],
  art: ['outline'],
  script: ['outline', 'characters', 'art'],
  staging: ['script', 'art'],
  'character-refs': ['characters'],
  storyboard: ['script', 'staging', 'characters', 'art']
};
const fingerprint = path => existsSync(path) ? hash(readFileSync(path)) : null;
function validateDocument(doc) {
  const g = inspection(doc, 'pipeline');
  if (!doc || typeof doc !== 'object') return g.result();
  g.string(doc.skillsDirectory, '$.skillsDirectory');
  g.string(doc.brief?.genre, '$.brief.genre');
  g.check(Number.isInteger(doc.brief?.episodeCount) && doc.brief.episodeCount > 0, 'brief-episodes', '$.brief.episodeCount', 'Provide a positive episode count.');
  g.check(typeof doc.brief?.targetSeconds === 'number' && doc.brief.targetSeconds > 0, 'brief-duration', '$.brief.targetSeconds', 'Provide positive episode duration.');
  g.check(['faithful', 'core', 'reimagined'].includes(doc.brief?.adaptationMode), 'brief-mode', '$.brief.adaptationMode', 'Choose faithful, core, or reimagined.');
  g.check(['16:9', '9:16'].includes(doc.brief?.aspectRatio), 'brief-aspect', '$.brief.aspectRatio', 'Choose 16:9 or 9:16.');
  g.check(doc.stages && typeof doc.stages === 'object' && !Array.isArray(doc.stages), 'pipeline-stages', '$.stages', 'Provide a stage registry.');
  for (const [stage, record] of Object.entries(doc.stages ?? {})) {
    g.check(!!modules[stage], 'pipeline-stage', '$.stages.' + stage, 'Unknown stage.');
    g.array(record.paths, '$.stages.' + stage + '.paths');
    list(record.paths).forEach(p => g.string(p, '$.stages.' + stage + '.paths'));
  }
  return g.result();
}
export function init(brief, skillsDirectory, source = null) {
  if (!skillsDirectory) throw new Error('Provide --skills-dir explicitly.');
  const doc = {
    schemaVersion: 1,
    kind: 'pipeline',
    id: brief.id,
    title: brief.title,
    skillsDirectory: resolve(skillsDirectory),
    brief: {
      genre: brief.genre,
      episodeCount: brief.episodeCount,
      targetSeconds: brief.targetSeconds,
      adaptationMode: brief.adaptationMode ?? 'core',
      aspectRatio: brief.aspectRatio ?? '16:9',
      style: brief.style ?? 'To be chosen before image generation.'
    },
    source,
    stages: {},
    approvals: {
      outline: null,
      anchors: {}
    }
  };
  const result = validate(doc);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return doc;
}
function paths(doc, stage, pipelinePath) {
  return list(doc.stages[stage]?.paths).map(p => resolve(dirname(pipelinePath), p));
}
function inputs(doc, stage, pipelinePath) {
  const keys = [...dependencies[stage]];
  if (stage === 'storyboard' && doc.stages['character-refs']) keys.push('character-refs');
  const result = {};
  for (const key of keys) for (const p of paths(doc, key, pipelinePath)) result[key + ':' + relative(dirname(pipelinePath), p)] = fingerprint(p);
  if (stage === 'outline' && doc.source) {
    const p = resolve(dirname(pipelinePath), doc.source);
    result.source = fingerprint(p);
  }
  return result;
}
function command(doc, stage, args, skillsDir) {
  const name = modules[stage];
  const cli = join(resolve(skillsDir ?? doc.skillsDirectory), name, 'scripts', name + '.mjs');
  if (!existsSync(cli)) return {
    ok: false,
    issues: [{
      rule: 'missing-skill',
      path: stage,
      message: `Install ${name} in the supplied skills directory.`
    }],
    skipped: []
  };
  const run = spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
    shell: false,
    maxBuffer: 10 * 1024 * 1024
  });
  if (run.error) throw new Error('Stage invocation failed: ' + run.error.code);
  try {
    const result = JSON.parse(run.stdout);
    if (typeof result.ok === 'boolean') return result;
  } catch {}
  return {
    ok: false,
    issues: [{
      rule: 'stage-command',
      path: stage,
      message: run.stderr.trim() || `Stage exited ${run.status}.`
    }],
    skipped: []
  };
}
function checkStage(doc, stage, pipelinePath, skillsDir) {
  const args = [];
  for (const [key, flag] of [['outline', 'outline'], ['characters', 'cast'], ['art', 'art'], ['script', 'script'], ['staging', 'staging']]) {
    if (key === stage) continue;
    const p = paths(doc, key, pipelinePath)[0];
    if (p && existsSync(p)) args.push('--' + flag, p);
  }
  if (['outline', 'characters'].includes(stage) && doc.source) {
    const p = resolve(dirname(pipelinePath), doc.source);
    if (existsSync(p)) args.push('--source', p);
  }
  const checks = paths(doc, stage, pipelinePath).map(p => existsSync(p) ? command(doc, stage, ['validate', p, ...args], skillsDir) : {
    ok: false,
    issues: [{
      rule: 'missing-artifact',
      path: p,
      message: 'Registered artifact file is missing.'
    }],
    skipped: []
  });
  const issues = checks.flatMap(c => c.issues);
  if (['outline', 'characters'].includes(stage) && doc.source && !existsSync(resolve(dirname(pipelinePath), doc.source))) issues.push({
    rule: 'missing-source',
    path: doc.source,
    message: 'Restore the declared source file before validating this project.'
  });
  const artifactPath = paths(doc, stage, pipelinePath)[0];
  if (artifactPath && existsSync(artifactPath)) {
    const artifact = read(artifactPath);
    if (stage === 'outline') {
      if (list(artifact.episodes).length !== doc.brief.episodeCount || list(artifact.episodes).some(e => e.targetSeconds !== doc.brief.targetSeconds)) issues.push({
        rule: 'brief-episodes',
        path: '$.episodes',
        message: 'Match the accepted brief episode count and durations.'
      });
      if (artifact.adaptation?.mode !== doc.brief.adaptationMode) issues.push({
        rule: 'brief-adaptation',
        path: '$.adaptation.mode',
        message: 'Match the accepted adaptation mode.'
      });
    }
    if (stage === 'script' || stage === 'storyboard') {
      const upstreamPath = paths(doc, stage === 'script' ? 'outline' : 'script', pipelinePath)[0];
      if (upstreamPath && existsSync(upstreamPath)) {
        const expected = list(read(upstreamPath).episodes).map(e => e.id);
        if (JSON.stringify(list(artifact.episodes).map(e => e.id)) !== JSON.stringify(expected)) issues.push({
          rule: 'batch-incomplete',
          path: '$.episodes',
          message: 'Aggregate all accepted episodes in order before marking this stage ready.'
        });
      }
    }
    if (stage === 'storyboard' && artifact.aspectRatio !== doc.brief.aspectRatio) issues.push({
      rule: 'brief-aspect',
      path: '$.aspectRatio',
      message: 'Match the accepted brief aspect ratio.'
    });
  }
  return {
    ok: checks.length > 0 && checks.every(c => c.ok) && issues.length === 0,
    issues,
    skipped: checks.flatMap(c => c.skipped)
  };
}
export function refresh(doc, pipelinePath, skillsDir) {
  const result = structuredClone(doc);
  const validity = validate(result);
  if (!validity.ok) throw new Error(JSON.stringify(validity.issues));
  result.approvals ??= {
    outline: null,
    anchors: {}
  };
  for (const stage of Object.keys(modules)) {
    const record = result.stages[stage];
    if (!record) continue;
    const currentPaths = paths(result, stage, pipelinePath);
    record.fingerprints = Object.fromEntries(currentPaths.map(p => [relative(dirname(pipelinePath), p), fingerprint(p)]));
    record.validation = checkStage(result, stage, pipelinePath, skillsDir);
    const live = inputs(result, stage, pipelinePath);
    const stale = JSON.stringify(record.inputs ?? {}) !== JSON.stringify(live);
    const required = [...dependencies[stage]];
    if (stage === 'storyboard' && result.stages['character-refs']) required.push('character-refs');
    const blocked = required.filter(key => result.stages[key]?.status !== 'ready');
    if (stale) record.status = 'stale';else if (blocked.length) record.status = 'blocked';else if (!record.validation.ok) record.status = 'invalid';else if (stage === 'outline' && result.approvals.outline?.fingerprint !== hash({
      artifact: record.fingerprints,
      inputs: record.inputs
    })) record.status = 'pending-approval';else record.status = 'ready';
    record.blockedBy = blocked;
  }
  const next = [];
  for (const stage of Object.keys(modules)) {
    const record = result.stages[stage];
    if (record?.status === 'ready') continue;
    const prereq = dependencies[stage].filter(k => result.stages[k]?.status !== 'ready');
    if (!prereq.length) next.push({
      stage,
      status: record?.status ?? 'missing',
      action: record?.status === 'pending-approval' ? 'Show the outline and request approval.' : record?.status === 'stale' ? 'Reconcile upstream changes, validate, then accept the stage.' : record?.status === 'invalid' ? 'Read validation findings and repair or complete this artifact.' : `Read ${modules[stage]}/SKILL.md, author the artifact, and register it.`,
      optional: stage === 'character-refs'
    });
  }
  result.nextActions = next;
  return result;
}
export function register(doc, pipelinePath, stage, artifact, skillsDir) {
  if (!modules[stage]) throw new Error('Unknown stage.');
  const absolute = resolve(artifact);
  const data = read(absolute);
  const expected = {
    outline: 'outline',
    characters: 'cast',
    art: 'art',
    script: 'script',
    staging: 'staging',
    'character-refs': 'character-refs',
    storyboard: 'storyboard'
  }[stage];
  if (data.kind !== expected || data.schemaVersion !== 1) throw new Error('Artifact kind/version does not match stage.');
  const local = relative(dirname(pipelinePath), absolute);
  let registered = stage === 'character-refs' ? list(doc.stages[stage]?.paths).filter(p => {
    const path = resolve(dirname(pipelinePath), p);
    return existsSync(path) && read(path).characterId !== data.characterId;
  }) : [];
  registered.push(local);
  doc.stages[stage] = {
    paths: registered,
    inputs: inputs(doc, stage, pipelinePath)
  };
  return refresh(doc, pipelinePath, skillsDir);
}
export function accept(doc, pipelinePath, stage, skillsDir) {
  if (!doc.stages[stage]) throw new Error('Register the stage first.');
  const check = checkStage(doc, stage, pipelinePath, skillsDir);
  if (!check.ok) throw new Error('Repair validation findings before accepting a reconciled stage.');
  for (const key of dependencies[stage]) if (refresh(doc, pipelinePath, skillsDir).stages[key]?.status !== 'ready') throw new Error('Resolve upstream stage ' + key + ' first.');
  doc.stages[stage].inputs = inputs(doc, stage, pipelinePath);
  return refresh(doc, pipelinePath, skillsDir);
}
export function approve(doc, pipelinePath, stage, character, skillsDir) {
  let current = refresh(doc, pipelinePath, skillsDir);
  if (stage === 'outline') {
    const record = current.stages.outline;
    if (!record?.validation.ok || record.status === 'stale') throw new Error('Validate and reconcile the outline before approval.');
    current.approvals.outline = {
      fingerprint: hash({
        artifact: record.fingerprints,
        inputs: record.inputs
      }),
      approvedAt: new Date().toISOString()
    };
  } else if (stage === 'character-refs') {
    if (current.stages.characters?.status !== 'ready') throw new Error('Complete the current character bible first.');
    const assetPath = paths(current, stage, pipelinePath).find(p => read(p).characterId === character);
    if (!assetPath) throw new Error('Register a reference asset for this character first.');
    const asset = read(assetPath);
    const castPath = paths(current, 'characters', pipelinePath)[0];
    const cast = read(castPath).characters.find(c => c.id === character);
    if (!cast || cast.appearance !== asset.design.appearance || cast.imagePrompt !== asset.design.imagePrompt) throw new Error('Refresh the image asset design from the current cast before approval.');
    const name = modules[stage],
      cli = join(resolve(skillsDir ?? current.skillsDirectory), name, 'scripts', name + '.mjs');
    const run = spawnSync(process.execPath, [cli, 'confirm', assetPath], {
      encoding: 'utf8',
      shell: false
    });
    if (run.error || run.status !== 0) throw new Error('Anchor confirmation failed: ' + (run.error?.code ?? run.stderr.trim()));
    current.approvals.anchors ??= {};
    current.approvals.anchors[character] = {
      fingerprint: fingerprint(assetPath),
      approvedAt: new Date().toISOString()
    };
    current.stages[stage].inputs = inputs(current, stage, pipelinePath);
  } else throw new Error('Approval checkpoints are outline and character-refs.');
  return refresh(current, pipelinePath, skillsDir);
}
export function validate(doc, ctx = {}) {
  return guardedValidation(validateDocument, doc, ctx);
}
if (isMain(import.meta.url)) main({
  validate,
  options: ['skills-dir', 'stage', 'artifact', 'character'],
  help: 'drama-pipeline: init <brief.json> --skills-dir /path/to/skills [--source source.txt] --out pipeline.json\nregister <pipeline.json> --stage outline|characters|art|script|staging|character-refs|storyboard --artifact path\nstatus|resume|refresh <pipeline.json> [--skills-dir path]\naccept <pipeline.json> --stage STAGE (after reconciling upstream changes)\napprove <pipeline.json> --stage outline|character-refs [--character C01] (after user approval)\nvalidate|checkup|render <pipeline.json> [--out path] [--md]',
  commands: {
    init: ({
      file,
      opts,
      emit
    }) => {
      if (!opts.out) throw new Error('Provide --out pipeline.json.');
      const source = opts.source ? relative(dirname(resolve(opts.out)), resolve(opts.source)) : null;
      emit(init(read(file), opts['skills-dir'], source));
    },
    register: ({
      file,
      opts
    }) => {
      const doc = register(read(file), resolve(file), opts.stage, opts.artifact, opts['skills-dir']);
      save(file, doc);
      console.log(JSON.stringify(doc, null, 2));
    },
    status: ({
      file,
      opts,
      emit
    }) => emit(refresh(read(file), resolve(file), opts['skills-dir'])),
    resume: ({
      file,
      opts,
      emit
    }) => emit(refresh(read(file), resolve(file), opts['skills-dir']).nextActions),
    refresh: ({
      file,
      opts,
      emit
    }) => {
      const doc = refresh(read(file), resolve(file), opts['skills-dir']);
      save(file, doc);
      emit(doc);
    },
    accept: ({
      file,
      opts,
      emit
    }) => {
      const doc = accept(read(file), resolve(file), opts.stage, opts['skills-dir']);
      save(file, doc);
      emit(doc);
    },
    approve: ({
      file,
      opts,
      emit
    }) => {
      const doc = approve(read(file), resolve(file), opts.stage, opts.character, opts['skills-dir']);
      save(file, doc);
      emit(doc);
    }
  }
});
