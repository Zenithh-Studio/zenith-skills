# Outline contract (version 1)

The complete shape is illustrated by `../examples/sample.json`. Required top-level fields: `schemaVersion: 1`, `kind: "outline"`, `id`, `title`, `adaptation`, `characters`, `locations`, `props`, `beats`, `episodes`.

- Adaptation: `mode` is faithful/core/reimagined; `premise` and decisions are required. Each decision has `decision` text and a nonempty `evidence` array of exact source quotations. Use `--source` to verify evidence; without it the check is explicitly skipped.
- Characters: stable `id`, `name`, lead/support/functional `tier`, `arc`. Defaults cap tiers at 5/10/10; override in `params.characterLimits` for the production brief.
- Locations: stable `id`, `name`, optional `primary`. Props additionally require `purpose`. Beats have stable `id`, `description`, major/minor `weight`.
- Episodes: stable `id`, unique positive `number`, positive `targetSeconds`, `hook`, `cliff`, `synopsis`, and arrays `characterIds`, `locationIds`, `propIds`, `beatIds`. Every listed asset must appear in an episode. Props and beat claims may be empty.

`seed` accepts a brief JSON with `id` and `title` and intentionally produces an invalid draft. `chunk` exports the entire normalized source with overlapping offsets and its hash. `inventory` derives episode usage from canonical episode references. Reports default to HTML; `--md` requests text. Validation/checkup exit 1 for findings; malformed input or command usage exits 2.
