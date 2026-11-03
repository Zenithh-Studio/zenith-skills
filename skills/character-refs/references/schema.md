# Image asset and job contracts (version 1)

Asset: `schemaVersion: 1`, `kind: "character-refs"`, `id`, `title`, `characterId`, `design: {appearance,imagePrompt,style}`, `views` object, `anchorApproval` (initially null). The supplied sample is intentionally pending until a real image is imported.

Supported views: front-full (anchor, 768×1152), face-front (768×960), side-full and back-full (768×1152). `views[view]` is an append-only version array containing consecutive `version`, `jobId`, relative `file`, `sha256`, actual `model`, submitted `prompt`, `designHash`, `references`, dimensions, and timestamp. Derived versions record exactly one anchor reference: `{view,version,sha256}`. All views use the same design/style fingerprint. Anchor approval records its version, hash, design hash, and approval time.

`prepare` writes an image-job with unique `id`, asset/character IDs, design hash, view, width/height, English prompt, and absolute reference paths with their hashes. Send these to an available Agent tool; scripts do not call a runtime-specific image API.

Result JSON: `{ "jobId": "the prepared job id", "model": "actual generator identifier", "file": "output.png" }`. Relative output paths resolve beside the result JSON. `import` validates identity, current design/anchor, PNG integrity, exact dimensions, and records a new managed version without overwriting an old image. A job may be imported once.

Custom config: `{ "executable": "/absolute/path/to/generator", "args": ["--request", "{request}", "--result", "{result}"], "timeoutMs": 120000 }`. The executable receives job and result-file paths as distinct arguments, without a shell. It must write the result file and actual PNG. The config belongs outside version control; credentials remain inherited environment variables. Failed, timed-out, or output-less runs do not append versions. Use prepare/import to preserve a pending job when no adapter is configured.

`--cast` reconciles design fields. CLI validation checks all recorded image file hashes. Library callers supply `artifactPath` for that check. Validation fails for a missing/unapproved anchor or stale views; an approved anchor alone is a valid tier-one delivery. Further views are on demand.

Managed image paths include a stable asset-ID hash directory under images/, so multiple character asset files may safely share one project directory.
