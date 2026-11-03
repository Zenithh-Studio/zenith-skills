# Pipeline contract (version 1)

Required: `schemaVersion: 1`, `kind: "pipeline"`, `id`, `title`, explicit `skillsDirectory`, `brief`, `stages`, `approvals`; optional source path relative to pipeline.json. Brief requires genre, positive episodeCount and targetSeconds, faithful/core/reimagined adaptationMode, and 16:9/9:16 aspectRatio. Style can be chosen before actual image generation.

Stage keys: outline, characters, art, script, staging, character-refs, storyboard. Each registration stores `paths` relative to pipeline.json, an upstream `inputs` fingerprint snapshot, current fingerprints, validation findings, status, and blockedBy. Reference assets may have multiple paths, one per character. Other stages register one artifact. Runtime-specific Agent tools are not required by orchestration.

Dependencies: outline → characters/art → script → staging → storyboard. Script also depends on outline; storyboard also depends on characters/art. Character references depend on characters and become a storyboard dependency when registered. With no registered references, storyboard/export may proceed and report missing images. Source changes invalidate outline through its input snapshot.

States: missing (unregistered), blocked (upstream not ready), invalid (failed validation), stale (upstream fingerprint differs), pending-approval (valid unapproved outline), ready. `register` snapshots current inputs and invokes the local stage CLI. `status` recomputes without writing; `refresh` saves status. `accept` requires valid current data and ready upstreams before updating input snapshots. All authored changes are performed by the Agent, not these status commands.

`approve --stage outline` records the current artifact-byte hash. `approve --stage character-refs --character C01` invokes that asset's confirm command and records its fingerprint; it requires a current cast design and actual user approval. Image versions maintain their own anchor approval fingerprint. Approvals do not grant permission for unrelated external actions.

The orchestrator passes available outline/cast/art/script/staging/source paths to each stage validator using executable argument arrays. Missing stage installations are reported rather than dynamically fetched. Paths are resolved relative to pipeline.json; `--skills-dir` overrides the saved installation directory after relocation.
