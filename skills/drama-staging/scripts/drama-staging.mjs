import { guardedValidation, inspection, list, reference, finite, main, isMain, read, render, imageLink } from './lib.mjs';
export function stagingCore() {
  const facing = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  function blocking(scene) {
    return scene.places.filter(p => p.present).map(p => `${p.id} ${p.posture === 'sit' ? 'sits' : 'stands'} at (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) beside ${p.itemId}, facing ${p.facing}`).join('; ') + `. ${scene.extras > 0 ? `${scene.extras} extras ${scene.extrasWhere}` : 'No extras'}.`;
  }
  function move(doc, sceneId, id, x, y) {
    const scene = doc.scenes.find(s => s.id === sceneId);
    const p = scene.places.find(p => p.id === id);
    p.x = Math.max(0, Math.min(1, x));
    p.y = Math.max(0, Math.min(1, y));
    const items = doc.locations.find(l => l.id === scene.locationId).items;
    p.itemId = [...items].sort((a, b) => Math.hypot((a.box[0] + a.box[2]) / 2 - p.x, (a.box[1] + a.box[3]) / 2 - p.y) - Math.hypot((b.box[0] + b.box[2]) / 2 - p.x, (b.box[1] + b.box[3]) / 2 - p.y))[0]?.id ?? null;
    return p;
  }
  function collisions(scene) {
    const p = scene.places.filter(v => v.present);
    return p.flatMap((a, i) => p.slice(i + 1).filter(b => Math.hypot(a.x - b.x, a.y - b.y) < .05).map(b => `${a.id} overlaps ${b.id}`));
  }
  return {
    facing,
    blocking,
    move,
    collisions
  };
}
const core = stagingCore();
export const blocking = doc => list(doc.scenes).map(s => ({
  sceneId: s.id,
  episodeId: s.episodeId,
  text: core.blocking(s)
}));
export function seed(script, art = {}) {
  return {
    schemaVersion: 1,
    kind: 'staging',
    id: script.id + '-staging',
    title: script.title + ' — Staging',
    locations: [...new Set(list(script.episodes).flatMap(e => list(e.scenes).map(s => s.locationId)))].map(id => ({
      id,
      name: list(art.locations).find(l => l.id === id)?.name ?? id,
      basis: 'design',
      items: []
    })),
    scenes: list(script.episodes).flatMap(e => list(e.scenes).map(s => ({
      id: s.id,
      episodeId: e.id,
      locationId: s.locationId,
      places: list(s.characterIds).map(id => ({
        id,
        name: id,
        present: false,
        itemId: null,
        x: null,
        y: null,
        posture: null,
        facing: null
      })),
      extras: 0,
      extrasWhere: ''
    })))
  };
}
function validateDocument(doc, ctx = {}) {
  const g = inspection(doc, 'staging');
  if (!doc || typeof doc !== 'object') return g.result();
  g.array(doc.locations, '$.locations');
  g.unique(doc.locations, '$.locations');
  g.array(doc.scenes, '$.scenes');
  g.unique(doc.scenes, '$.scenes');
  list(doc.locations).forEach((l, i) => {
    const p = `$.locations[${i}]`;
    g.string(l.name, p + '.name');
    g.check(['image', 'design'].includes(l.basis), 'staging-basis', p + '.basis', 'Choose image or design; design-based positions remain provisional.');
    if (l.basis === 'image') g.string(l.image, p + '.image');
    g.array(l.items, p + '.items');
    g.unique(l.items, p + '.items');
    for (const item of list(l.items)) {
      g.string(item.name, p + '.items.name');
      g.check(Array.isArray(item.box) && item.box.length === 4 && item.box.every(v => finite(v) && v >= 0 && v <= 1) && item.box[0] < item.box[2] && item.box[1] < item.box[3], 'item-box', p + '.items.box', 'Use normalized [west,north,east,south] bounds.');
    }
    if (ctx.art) reference(g, l.id, ctx.art.locations, p + '.id');
  });
  list(doc.scenes).forEach((s, i) => {
    const p = `$.scenes[${i}]`;
    g.string(s.episodeId, p + '.episodeId');
    reference(g, s.locationId, doc.locations, p + '.locationId');
    g.array(s.places, p + '.places', 0);
    g.unique(s.places, p + '.places');
    const loc = list(doc.locations).find(l => l.id === s.locationId);
    for (const place of list(s.places)) {
      const q = p + '.places.' + place.id;
      g.string(place.name, q + '.name');
      g.check(typeof place.present === 'boolean', 'presence', q + '.present', 'Set opening presence explicitly.');
      if (place.present) {
        reference(g, place.itemId, loc?.items, q + '.itemId');
        g.check([place.x, place.y].every(v => finite(v) && v >= 0 && v <= 1), 'position', q, 'Use normalized x/y coordinates.');
        g.check(['sit', 'stand'].includes(place.posture), 'posture', q + '.posture', 'Choose sit or stand.');
        g.check(core.facing.includes(place.facing), 'facing', q + '.facing', 'Choose one of eight compass directions.');
      } else g.check(['itemId', 'x', 'y', 'posture', 'facing'].every(k => place[k] === null), 'absent-position', q, 'Absent characters have null position, posture, and facing.');
    }
    if (Array.isArray(s.places)) for (const collision of core.collisions(s)) g.check(false, 'collision', p + '.places', collision);
    g.check(Number.isInteger(s.extras) && s.extras >= 0, 'extras', p + '.extras', 'Use a nonnegative extras count.');
    if (s.extras > 0) g.string(s.extrasWhere, p + '.extrasWhere');
    if (ctx.script) {
      const ep = list(ctx.script.episodes).find(e => e.id === s.episodeId);
      const original = list(ep?.scenes).find(v => v.id === s.id);
      g.check(!!original, 'script-scene', p + '.id', 'Scene must belong to the stated screenplay episode.');
      g.check(!original || original.locationId === s.locationId, 'script-location', p + '.locationId', 'Keep the screenplay location.');
      if (original) {
        g.check(list(original.characterIds).length === list(s.places).length && list(original.characterIds).every(id => list(s.places).some(v => v.id === id)), 'opening-roster', p + '.places', 'Include exactly the screenplay scene roster, marking later arrivals absent.');
      }
    }
  });
  if (ctx.script) for (const e of list(ctx.script.episodes)) for (const s of list(e.scenes)) reference(g, s.id, doc.scenes, '$.scenes');else g.skip('script-reconciliation', 'Supply --script to check scene and opening rosters.');
  if (!ctx.art) g.skip('art-reconciliation', 'Supply --art to check locations.');
  return g.result();
}
export function renderStaging(doc, result, {
  file,
  opts
}) {
  const images = list(doc.locations).filter(v => v.image).map(v => ({
    src: imageLink(v.image, file, opts.out),
    label: v.name
  }));
  const extra = '<section><h2>Opening positions</h2><p>North is up. The reference camera looks north from the south. Drag a character, or change presence, posture, facing, and extras. Export JSON and validate it before handoff. Design-based plans are provisional.</p><div id="staging-editor"></div></section><style>.plan{position:relative;max-width:650px;aspect-ratio:1.5;background:repeating-linear-gradient(0deg,#f1f5f7 0 39px,#dce6eb 40px);border:1px solid #b3c3cd;margin:1rem 0}.object{position:absolute;border:1px solid #73909d;background:#d3e1e8aa;font-size:.75rem;overflow:hidden}.person{position:absolute;transform:translate(-50%,-50%);border-radius:50%;background:#edb85d;touch-action:none;padding:.5rem;z-index:1}.person:focus{outline:3px solid #30678b}.controls{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin:.5rem 0}select,input{font:inherit;max-width:240px}.live{white-space:pre-wrap;font-size:.85rem}</style>';
  const editor = String.raw`<script>
{
  const core = (${stagingCore.toString()})();
  const host = document.getElementById('staging-editor');
  const key = 'zskills-staging:' + working.id + ':' + document.getElementById('artifact').textContent;
  try {
    const saved = localStorage.getItem(key);
    if (saved) working = JSON.parse(saved);
  } catch {}
  function persist() {
    const badge = document.querySelector('.status');
    badge.textContent = 'Edited — export and validate';
    badge.className = 'status fail';
    try {
      localStorage.setItem(key, JSON.stringify(working));
    } catch {}
  }
  function draw() {
    host.replaceChildren();
    for (const scene of working.scenes) {
      const wrap = document.createElement('article');
      const title = document.createElement('h3');
      title.textContent = scene.id + ' · ' + scene.locationId;
      wrap.append(title);
      const plan = document.createElement('div');
      plan.className = 'plan';
      const location = working.locations.find(l => l.id === scene.locationId);
      for (const item of location.items) {
        const el = document.createElement('div');
        el.className = 'object';
        el.textContent = item.name;
        const [x, y, r, b] = item.box;
        Object.assign(el.style, {
          left: x * 100 + '%',
          top: y * 100 + '%',
          width: (r - x) * 100 + '%',
          height: (b - y) * 100 + '%'
        });
        plan.append(el);
      }
      wrap.append(plan);
      for (const p of scene.places) {
        if (p.present) {
          const token = document.createElement('button');
          token.className = 'person';
          token.textContent = p.name;
          token.setAttribute('aria-label', 'Move ' + p.name);
          token.style.left = p.x * 100 + '%';
          token.style.top = p.y * 100 + '%';
          token.onpointerdown = e => {
            token.setPointerCapture(e.pointerId);
          };
          token.onpointermove = e => {
            if (!token.hasPointerCapture(e.pointerId)) return;
            const box = plan.getBoundingClientRect();
            core.move(working, scene.id, p.id, (e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height);
            token.style.left = p.x * 100 + '%';
            token.style.top = p.y * 100 + '%';
          };
          token.onpointerup = () => {
            persist();
            draw();
          };
          token.onkeydown = e => {
            const delta = {
              ArrowLeft: [-.02, 0],
              ArrowRight: [.02, 0],
              ArrowUp: [0, -.02],
              ArrowDown: [0, .02]
            }[e.key];
            if (delta) {
              e.preventDefault();
              core.move(working, scene.id, p.id, p.x + delta[0], p.y + delta[1]);
              persist();
              draw();
            }
          };
          plan.append(token);
        }
        const row = document.createElement('div');
        row.className = 'controls';
        const name = document.createElement('strong');
        name.textContent = p.name;
        row.append(name);
        const presence = document.createElement('button');
        presence.textContent = p.present ? 'Present' : 'Absent';
        presence.onclick = () => {
          p.present = !p.present;
          if (p.present) {
            p.posture = 'stand';
            p.facing = 'north';
            core.move(working, scene.id, p.id, .5, .5);
          } else for (const k of ['itemId', 'x', 'y', 'posture', 'facing']) p[k] = null;
          persist();
          draw();
        };
        row.append(presence);
        if (p.present) for (const [field, choices] of [['posture', ['sit', 'stand']], ['facing', core.facing]]) {
          const select = document.createElement('select');
          select.setAttribute('aria-label', p.name + ' ' + field);
          for (const value of choices) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.append(option);
          }
          select.value = p[field];
          select.onchange = () => {
            p[field] = select.value;
            persist();
            draw();
          };
          row.append(select);
        }
        wrap.append(row);
      }
      const count = document.createElement('input');
      count.type = 'number';
      count.min = 0;
      count.value = scene.extras;
      count.setAttribute('aria-label', scene.id + ' extras count');
      count.onchange = () => {
        scene.extras = Number(count.value);
        persist();
        draw();
      };
      const where = document.createElement('input');
      where.value = scene.extrasWhere;
      where.placeholder = 'Where extras stand';
      where.setAttribute('aria-label', scene.id + ' extras position');
      where.onchange = () => {
        scene.extrasWhere = where.value;
        persist();
        draw();
      };
      wrap.append(count, where);
      const live = document.createElement('p');
      live.className = 'live';
      live.textContent = core.blocking(scene) + '\n' + core.collisions(scene).join('\n');
      wrap.append(live);
      host.append(wrap);
    }
  }
  draw();
}
</script>`;
  return render(doc, result, {
    extra,
    images
  }).replace('</html>', editor + '</html>');
}
export function validate(doc, ctx = {}) {
  return guardedValidation(validateDocument, doc, ctx);
}
if (isMain(import.meta.url)) main({
  validate,
  render: renderStaging,
  help: 'drama-staging: seed <script.json> [--art art.json] [--out staging.json]\nvalidate|checkup|render <staging.json> [--script script.json] [--art art.json] [--out path] [--md]\nblocking <staging.json>',
  commands: {
    seed: ({
      file,
      ctx,
      emit
    }) => emit(seed(read(file), ctx.art)),
    blocking: ({
      file,
      emit
    }) => emit(blocking(read(file)))
  }
});
