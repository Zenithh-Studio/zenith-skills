---
name: drama-pipeline
description: Coordinate an AI short-drama project across outline, design, screenplay, staging, storyboard, and character references with fingerprinted approvals and resumable artifact handoffs. Use for complete or resumed multi-stage production, not a single-stage request.
---

# drama-pipeline

Read the brief, source, and existing artifacts first. Ask together for missing genre, episode count, duration, and meaningful adaptation constraints. Initialize a project-local pipeline with an explicit skills directory. This orchestrator needs only the stage skills actually used; missing modules produce actionable installation findings.

Use `resume` to identify available work. Read that stage's SKILL.md, author its artifact, validate it with available context, and register the result. CLI routing does not generate creative content. Work sequentially unless the environment and user authorize delegation. Keep characters and art aligned with the accepted outline before writing the screenplay; stage every scene before storyboarding.

Stop for approval at the concrete outline and each actual character anchor. Show the report or image before recording approval. Existing approval is reusable only for its recorded content. Register multiple character-reference assets separately; each character gets an independent approval.

On resume, compare fingerprints and repair stale work. `accept` records that upstream changes were reconciled; it must not substitute for reading and revising the artifact. Preserve authored data and image versions. `status` and `resume` are read-only; `refresh` persists the latest findings. Continue unblocked text work while optional reference-image generation is pending.

Deliver artifact/report paths, remaining decisions, and missing assets. Never describe ready production material as a completed film.

Read [the contract](references/schema.md) before authoring JSON and [the production procedure](references/authoring.md) for creative decisions. `{baseDir}` is this skill directory.

Use `node {baseDir}/scripts/drama-pipeline.mjs help` for exact commands. Run `validate` before handing off; deliver the offline HTML report alongside its JSON. Read validation failures as structural findings, not a verdict on story or image quality. Preserve existing IDs, source quotations, and approved dialogue. When revising, update affected dependencies and rerun validation.
