---
name: drama-script
description: Write structured short-drama screenplays with stable scene and beat IDs, source-aligned episode claims, English dialogue timing, and per-character line books. Use for screenplay writing, not shot planning.
---

# drama-script

Use the accepted outline and available cast/art bibles. Seed episode facts, then write screenplay scenes and beats in small batches. Keep action and dialogue separate; character behavior should reflect the cast bible, while location, lighting, and prop IDs come from the art bible.

Do not introduce camera cuts in the screenplay. Give every scene and beat a stable ID and retain it through edits. Claim the opening hook among the first three beats. Preserve approved dialogue exactly in later handoffs.

Use configurable English words-per-minute estimates; supplied measured `audioSeconds` takes precedence. Check duration before storyboarding. Revise the drama rather than padding with empty action to hit a clock. Deliver the report and use `linebook` when the user needs dialogue grouped with voice prompts.

Read [the contract](references/schema.md) before authoring JSON and [the production procedure](references/authoring.md) for creative decisions. `{baseDir}` is this skill directory.

Use `node {baseDir}/scripts/drama-script.mjs help` for exact commands. Run `validate` before handing off; deliver the offline HTML report alongside its JSON. Read validation failures as structural findings, not a verdict on story or image quality. Preserve existing IDs, source quotations, and approved dialogue. When revising, update affected dependencies and rerun validation.
