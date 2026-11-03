---
name: drama-staging
description: Plan and edit opening positions, presence, posture, and facing for screenplay scenes. Use for scene blocking before storyboarding, with an offline draggable report and deterministic handoff text.
---

# drama-staging

Read the screenplay and available location bible. Seed one opening plan per screenplay scene. Inspect actual location images if available; otherwise mark the plan `basis: design` and describe it as provisional.

Place every named scene character once, including later arrivals marked absent. Do not add extras unless the screenplay or user calls for them. Keep compass coordinates consistent across the location and anchor positions to known objects.

Render the editable HTML report. After the user exports edits, validate the exported artifact with screenplay context. Pass the exact `blocking` output to the first storyboard segment of each scene; later movement belongs to storyboarding.

Read [the contract](references/schema.md) before authoring JSON and [the production procedure](references/authoring.md) for creative decisions. `{baseDir}` is this skill directory.

Use `node {baseDir}/scripts/drama-staging.mjs help` for exact commands. Run `validate` before handing off; deliver the offline HTML report alongside its JSON. Read validation failures as structural findings, not a verdict on story or image quality. Preserve existing IDs, source quotations, and approved dialogue. When revising, update affected dependencies and rerun validation.
