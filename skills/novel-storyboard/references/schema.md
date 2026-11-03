# Storyboard contract (version 1)

Required: `schemaVersion: 1`, `kind: "storyboard"`, `id`, `title`, `aspectRatio: 16:9|9:16`, nonempty `episodes`. Params default to maxSegmentSeconds 15, minCutSeconds 2, maxCutSeconds 5, tolerance 0.15.

Episode: screenplay `id`, nonempty `segments`. Segment: globally unique `id`, screenplay `sceneId`, `openingBlocking`, `soundscape`, nonempty `cuts`. Each cut has globally unique `id`, nonempty ordered `beatIds`, positive `seconds` within limits, `size` (extreme-wide/wide/medium/close/extreme-close), `camera`, `framePrompt`, `action`, `characterIds`, `references` array of `{id,file}`, optional `keyframe` path. All file paths are relative to the storyboard artifact.

`--script` is required for validation and export. Claims must match screenplay order exactly, once each, and remain inside their scene. Estimated or measured beat duration must fit its cut; segments and whole episodes obey limits. `--staging` validates exact first-segment opening text. The canonical sentence format is exercised against staging in integration tests.

`seed` imports screenplay scene IDs and canonical openings, leaving cuts unfinished. `export --out NEW_DIRECTORY` validates first and writes shots.json, timeline.json, dialogue.json, storyboard.json, prompts/, assets/, and manifest.json. It refuses an existing destination, uses a temporary directory before publication, hashes copied assets, and lists absent keyframes/reference files. Dialogue is always derived verbatim from the screenplay. Timeline offsets are derived per episode; keyframes use segment-local offsets. Pack IDs and schemaVersion identify the source artifact; no vendor-specific protocol is promised.
