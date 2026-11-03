---
name: drama-outline
description: Adapt a supplied novel or story into a short-drama outline with source evidence, episode beats, and a computed asset inventory. Use for adaptation planning, not screenplay dialogue.
---

# drama-outline

Read the supplied source before proposing adaptation decisions. Ask together for missing episode count, target duration, genre, and meaningful adaptation preferences. A user-authored original brief may serve as the source; label invented material as adaptation choices rather than quotations.

1. Use `chunk` for a source too long to read in one pass; cover every chunk and retain offsets. Never infer content from a title or silently omit a tail.
2. Author the premise, adaptation decisions with exact evidence, roster, locations, narrative props, and beats. Use `seed` only to create an unfinished scaffold.
3. Present the proposed cuts, character merges, and major reveals for approval before writing dependent production material. Do not invent approval. In a pipeline, record it through the orchestrator after the user responds.
4. Finish episode summaries in small batches, validate against the source, and review continuity. Compute the inventory rather than maintaining a second hand-authored list.

Read [the contract](references/schema.md) before authoring JSON and [the production procedure](references/authoring.md) for creative decisions. `{baseDir}` is this skill directory.

Use `node {baseDir}/scripts/drama-outline.mjs help` for exact commands. Run `validate` before handing off; deliver the offline HTML report alongside its JSON. Read validation failures as structural findings, not a verdict on story or image quality. Preserve existing IDs, source quotations, and approved dialogue. When revising, update affected dependencies and rerun validation.
