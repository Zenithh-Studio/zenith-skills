---
name: drama-art
description: Design reusable location and narrative-prop bibles for AI short drama, including consistency anchors, lighting variants, and scale-aware prompts. Use for production design, not screenplay or image generation.
---

# drama-art

Seed accepted location and prop IDs from the outline, or use a supplied inventory. Design a few drawable consistency anchors for each asset. Derive lighting and prop states from the story rather than generating unused variants.

Location prompts describe unoccupied spaces. Prop prompts include scale, plain white background, and no hands. Track story-bearing props separately from ordinary set dressing. Keep the artifact focused on specifications; an optional `image` path means a real external image is available, not that this skill generated it.

Validate the inventory and prompt constraints, review visual distinctness and story fit, and deliver a report plus `art.json`. New states required by the screenplay should be added here before downstream work references them.

Read [the contract](references/schema.md) before authoring JSON and [the production procedure](references/authoring.md) for creative decisions. `{baseDir}` is this skill directory.

Use `node {baseDir}/scripts/drama-art.mjs help` for exact commands. Run `validate` before handing off; deliver the offline HTML report alongside its JSON. Read validation failures as structural findings, not a verdict on story or image quality. Preserve existing IDs, source quotations, and approved dialogue. When revising, update affected dependencies and rerun validation.
