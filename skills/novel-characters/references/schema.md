# Cast contract (version 1)

Required: `schemaVersion: 1`, `kind: "cast"`, `id`, `title`, nonempty `characters`.

Each character has a stable `id`, `name`, `aliases` array, `arc`, `personality`, `appearance`, English `imagePrompt`, English `voicePrompt`, nonempty exact `evidence` quotations, and `inferences` array. Arrays may be empty except evidence.

Use `--outline` to enforce complete roster membership and accepted names. Use `--source` for exact quotation checks; missing context is reported as skipped. Language quality and semantic agreement need Agent review, not a character-set heuristic.

`seed` copies accepted character IDs, names, and arcs, leaving design and evidence unfinished. `chunk` returns all source text in overlapping sections. The supplied sample is an independently runnable fixture with local source and outline snapshots.
