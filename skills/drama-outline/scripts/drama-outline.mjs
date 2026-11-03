import { guardedValidation, inspection, list, reference, evidence, finite, chunk, main, isMain } from './lib.mjs';
import { readFileSync } from 'node:fs';
export function inventory(doc) {
  return Object.fromEntries(['characters', 'locations', 'props'].map(key => [key, list(doc[key]).map(item => ({
    ...item,
    episodeIds: list(doc.episodes).filter(ep => list(ep[key === 'characters' ? 'characterIds' : key === 'locations' ? 'locationIds' : 'propIds']).includes(item.id)).map(ep => ep.id)
  }))]));
}
function validateDocument(doc, ctx = {}) {
  const g = inspection(doc, 'outline');
  if (!doc || typeof doc !== 'object') return g.result();
  g.string(doc.adaptation?.premise, '$.adaptation.premise');
  g.check(['faithful', 'core', 'reimagined'].includes(doc.adaptation?.mode), 'adaptation-mode', '$.adaptation.mode', 'Choose faithful, core, or reimagined.');
  g.array(doc.adaptation?.decisions, '$.adaptation.decisions');
  list(doc.adaptation?.decisions).forEach((d, i) => {
    g.string(d.decision, `$.adaptation.decisions[${i}].decision`);
    evidence(g, d.evidence, ctx.source, `$.adaptation.decisions[${i}].evidence`);
  });
  if (ctx.source === undefined) g.skip('source-evidence', 'Supply --source original.txt to check quotations verbatim.');
  for (const key of ['characters', 'locations', 'props', 'beats', 'episodes']) {
    g.array(doc[key], `$.${key}`, key === 'props' ? 0 : 1);
    g.unique(doc[key], `$.${key}`);
  }
  list(doc.characters).forEach((v, i) => {
    g.string(v.name, `$.characters[${i}].name`);
    g.string(v.arc, `$.characters[${i}].arc`);
    g.check(['lead', 'support', 'functional'].includes(v.tier), 'character-tier', `$.characters[${i}].tier`, 'Choose lead, support, or functional.');
  });
  for (const key of ['locations', 'props']) list(doc[key]).forEach((v, i) => g.string(v.name, `$.${key}[${i}].name`));
  list(doc.props).forEach((v, i) => g.string(v.purpose, `$.props[${i}].purpose`));
  list(doc.beats).forEach((v, i) => {
    g.string(v.description, `$.beats[${i}].description`);
    g.check(['major', 'minor'].includes(v.weight), 'beat-weight', `$.beats[${i}].weight`, 'Choose major or minor.');
  });
  const numbers = new Set();
  list(doc.episodes).forEach((ep, i) => {
    const p = `$.episodes[${i}]`;
    g.check(Number.isInteger(ep.number) && ep.number > 0 && !numbers.has(ep.number), 'episode-number', p + '.number', 'Use unique positive episode numbers.');
    numbers.add(ep.number);
    g.check(finite(ep.targetSeconds) && ep.targetSeconds > 0, 'duration', p + '.targetSeconds', 'Use a positive duration in seconds.');
    for (const key of ['hook', 'cliff', 'synopsis']) g.string(ep[key], p + '.' + key);
    for (const [ids, key] of [['characterIds', 'characters'], ['locationIds', 'locations'], ['propIds', 'props'], ['beatIds', 'beats']]) {
      g.array(ep[ids], p + '.' + ids, ids === 'propIds' || ids === 'beatIds' ? 0 : 1);
      for (const id of list(ep[ids])) reference(g, id, doc[key], p + '.' + ids);
    }
  });
  const limits = {
    lead: 5,
    support: 10,
    functional: 10,
    ...doc.params?.characterLimits
  };
  for (const tier of ['lead', 'support', 'functional']) g.check(list(doc.characters).filter(v => v.tier === tier).length <= limits[tier], 'cast-budget', '$.characters', `Exceeded configured ${tier} budget (${limits[tier]}).`);
  for (const [key, items] of Object.entries(inventory(doc))) for (const v of items) g.check(v.episodeIds.length > 0, 'unused-asset', `$.${key}.${v.id}`, 'Assign the asset to an episode or remove it.');
  return g.result();
}
export function seed(input) {
  return {
    schemaVersion: 1,
    kind: 'outline',
    id: input.id,
    title: input.title,
    adaptation: {
      mode: 'core',
      premise: '',
      decisions: []
    },
    characters: [],
    locations: [],
    props: [],
    beats: [],
    episodes: []
  };
}
export function validate(doc, ctx = {}) {
  return guardedValidation(validateDocument, doc, ctx);
}
if (isMain(import.meta.url)) main({
  validate,
  help: 'drama-outline: validate|checkup|render <outline.json> [--source text.txt] [--out path] [--md]\nchunk <source.txt> [--size 12000] [--overlap 300] [--out chunks.json]\nseed <brief.json> [--out outline.json]\ninventory <outline.json>',
  options: ['size', 'overlap'],
  commands: {
    chunk: ({
      file,
      opts,
      emit
    }) => emit(chunk(readFileSync(file, 'utf8'), Number(opts.size ?? 12000), Number(opts.overlap ?? 300))),
    seed: ({
      file,
      emit
    }) => emit(seed(JSON.parse(readFileSync(file, 'utf8')))),
    inventory: ({
      file,
      emit
    }) => emit(inventory(JSON.parse(readFileSync(file, 'utf8'))))
  }
}, process.argv.slice(2));
