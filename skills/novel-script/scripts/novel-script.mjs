import { guardedValidation, inspection, list, reference, finite, beatSeconds, timing, main, isMain, read } from './lib.mjs';
export function seed(outline) {
  return {
    schemaVersion: 1,
    kind: 'script',
    id: outline.id + '-script',
    title: outline.title + ' — Screenplay',
    params: {
      wordsPerMinute: 150,
      actionSeconds: 2.5,
      tolerance: .15
    },
    episodes: list(outline.episodes).map(e => ({
      id: e.id,
      number: e.number,
      targetSeconds: e.targetSeconds,
      hook: e.hook,
      cliff: e.cliff,
      hookBeatId: '',
      outlineBeatIds: e.beatIds,
      scenes: []
    }))
  };
}
export function statistics(doc) {
  return list(doc.episodes).map(e => ({
    id: e.id,
    targetSeconds: e.targetSeconds,
    estimatedSeconds: list(e.scenes).flatMap(s => list(s.beats)).reduce((sum, b) => sum + beatSeconds(b, doc.params), 0)
  }));
}
export function linebook(doc, ctx = {}) {
  const groups = {};
  for (const e of list(doc.episodes)) for (const s of list(e.scenes)) for (const b of list(s.beats)) if (b.type === 'dialogue') {
    const group = groups[b.speakerId] ??= {
      speakerId: b.speakerId,
      voicePrompt: list(ctx.cast?.characters).find(c => c.id === b.speakerId)?.voicePrompt ?? null,
      lines: []
    };
    group.lines.push({
      episodeId: e.id,
      sceneId: s.id,
      beatId: b.id,
      line: b.line,
      delivery: b.delivery ?? '',
      seconds: beatSeconds(b, doc.params)
    });
  }
  return Object.values(groups);
}
function validateDocument(doc, ctx = {}) {
  const g = inspection(doc, 'script');
  if (!doc || typeof doc !== 'object') return g.result();
  const params = timing(g, doc.params);
  g.array(doc.episodes, '$.episodes');
  g.unique(doc.episodes, '$.episodes');
  const scenes = list(doc.episodes).flatMap(e => list(e.scenes));
  g.unique(scenes, '$.episodes[].scenes');
  g.unique(scenes.flatMap(s => list(s.beats)), '$.episodes[].scenes[].beats');
  for (const [ei, e] of list(doc.episodes).entries()) {
    const p = `$.episodes[${ei}]`;
    for (const key of ['hook', 'cliff']) g.string(e[key], p + '.' + key);
    g.check(Number.isInteger(e.number) && e.number > 0, 'episode-number', p + '.number', 'Use a positive episode number.');
    g.check(finite(e.targetSeconds) && e.targetSeconds > 0, 'duration', p + '.targetSeconds', 'Provide positive target seconds.');
    g.array(e.scenes, p + '.scenes');
    g.array(e.outlineBeatIds, p + '.outlineBeatIds', 0);
    const beats = list(e.scenes).flatMap(s => list(s.beats));
    g.check(beats.slice(0, 3).some(b => b.id === e.hookBeatId), 'hook-window', p + '.hookBeatId', 'Claim a beat among the first three beats for the opening hook.');
    let seconds = 0;
    for (const [si, s] of list(e.scenes).entries()) {
      const q = p + `.scenes[${si}]`;
      g.string(s.locationId, q + '.locationId');
      g.string(s.variantId, q + '.variantId');
      g.array(s.characterIds, q + '.characterIds', 0);
      g.array(s.propIds, q + '.propIds', 0);
      g.array(s.beats, q + '.beats');
      g.check(list(s.beats).some(b => b.type === 'action'), 'visual-action', q + '.beats', 'Include at least one visual action.');
      if (ctx.art) {
        reference(g, s.locationId, ctx.art.locations, q + '.locationId');
        const loc = list(ctx.art.locations).find(l => l.id === s.locationId);
        reference(g, s.variantId, loc?.variants, q + '.variantId');
        for (const id of list(s.propIds)) reference(g, id, ctx.art.props, q + '.propIds');
      }
      if (ctx.cast || ctx.outline) for (const id of list(s.characterIds)) reference(g, id, (ctx.cast ?? ctx.outline).characters, q + '.characterIds');
      for (const [bi, b] of list(s.beats).entries()) {
        const r = q + `.beats[${bi}]`;
        g.check(['action', 'dialogue'].includes(b.type), 'beat-type', r + '.type', 'Choose action or dialogue.');
        if (b.type === 'action') {
          g.string(b.action, r + '.action');
          g.check(b.line === undefined, 'exclusive-beat', r, 'Keep dialogue in a separate beat.');
        }
        if (b.type === 'dialogue') {
          g.string(b.line, r + '.line');
          g.string(b.speakerId, r + '.speakerId');
          g.check(b.action === undefined, 'exclusive-beat', r, 'Keep action in a separate beat.');
          g.check(b.speakerId === 'VO' || list(s.characterIds).includes(b.speakerId), 'speaker', r + '.speakerId', 'Speaker must be present in the scene or VO.');
        }
        if (b.seconds !== undefined) g.check(finite(b.seconds) && b.seconds > 0, 'duration', r + '.seconds', 'Use positive action seconds.');
        if (b.audioSeconds !== undefined) g.check(finite(b.audioSeconds) && b.audioSeconds > 0, 'audio-duration', r + '.audioSeconds', 'Use positive measured audio seconds.');
        seconds += beatSeconds(b, params);
      }
    }
    g.check(finite(seconds) && Math.abs(seconds - e.targetSeconds) <= e.targetSeconds * params.tolerance, 'episode-timing', p, `Estimated ${seconds.toFixed(2)}s; target ${e.targetSeconds}s with tolerance ${params.tolerance}.`);
    if (ctx.outline) {
      const original = list(ctx.outline.episodes).find(v => v.id === e.id);
      reference(g, e.id, ctx.outline.episodes, p + '.id');
      g.check(!original || original.targetSeconds === e.targetSeconds, 'outline-duration', p + '.targetSeconds', 'Use the accepted outline duration.');
      for (const id of list(e.outlineBeatIds)) reference(g, id, ctx.outline.beats, p + '.outlineBeatIds');
      for (const id of list(original?.beatIds)) g.check(list(e.outlineBeatIds).includes(id), 'outline-coverage', p + '.outlineBeatIds', `Missing accepted beat ${id}.`);
    }
  }
  for (const key of ['outline', 'art', 'cast']) if (!ctx[key]) g.skip(key + '-reconciliation', `Supply --${key} for upstream reconciliation.`);
  return g.result();
}
export function validate(doc, ctx = {}) {
  return guardedValidation(validateDocument, doc, ctx);
}
if (isMain(import.meta.url)) main({
  validate,
  help: 'novel-script: seed <outline.json> [--out script.json]\nvalidate|checkup|render <script.json> [--outline outline.json] [--cast cast.json] [--art art.json] [--out path] [--md]\nlinebook|stats <script.json> [--cast cast.json] [--out path]',
  commands: {
    seed: ({
      file,
      emit
    }) => emit(seed(read(file))),
    stats: ({
      file,
      emit
    }) => emit(statistics(read(file))),
    linebook: ({
      file,
      ctx,
      emit
    }) => emit(linebook(read(file), ctx))
  }
});
