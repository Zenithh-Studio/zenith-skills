# Screenplay contract (version 1)

Required: `schemaVersion: 1`, `kind: "script"`, `id`, `title`, and nonempty `episodes`. Optional params default to wordsPerMinute 150, actionSeconds 2.5, tolerance 0.15.

Episodes: unique stable `id`, positive `number`, positive `targetSeconds`, `hook`, `cliff`, `hookBeatId`, `outlineBeatIds` array, and nonempty `scenes`. The hook references one of the episode's first three beats. Subset episode batches are allowed.

Scenes: globally unique `id`, `locationId`, `variantId`, `characterIds`, `propIds`, and nonempty `beats` including visual action.

Beats: globally unique `id` and `type`. Action requires `action` and forbids `line`; optional positive `seconds` overrides the default action duration. Dialogue requires `speakerId`, `line`, and optional delivery; speaker is a scene character or `VO`. Optional positive `audioSeconds` is measured duration and overrides estimates. Dialogue estimate is whitespace-delimited word count × 60 / wordsPerMinute. Episode duration must remain within configured tolerance.

`--outline` reconciles episode IDs, target durations, cast IDs, and beat claims. `--cast` reconciles character IDs and enriches `linebook`. `--art` reconciles locations, lighting variant IDs, and prop IDs. Missing context is explicitly skipped. Timing remains an estimate until actual audio is supplied.
