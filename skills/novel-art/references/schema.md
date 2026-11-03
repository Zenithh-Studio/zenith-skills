# Art contract (version 1)

Required: `schemaVersion: 1`, `kind: "art"`, `id`, `title`, nonempty `locations`, and `props` array.

Every asset has stable `id`, `name`, at least three nonempty `anchors`, and optional `variantOf` referencing an acyclic asset in the same collection.

Locations have nonempty `variants`: each has unique `id`, `prompt`, optional description, and optional `image` path relative to the art artifact. Prompts explicitly describe an empty/unoccupied space or exclude people.

Props have `purpose`, `scale`, and nonempty `states` with unique `id`, `prompt`, optional `image`. Every state prompt includes its declared scale, "white background", and "no hands". These are explicit production checks, not semantic image inspection.

`--outline` checks both missing and unexpected IDs. `seed` creates an unfinished design scaffold. Reports rebase image links when `--out` changes the report directory.
