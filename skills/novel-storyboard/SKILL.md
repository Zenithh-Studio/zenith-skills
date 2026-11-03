---
name: novel-storyboard
description: Turn screenplay beats and opening staging into timed segments, cuts, keyframe prompts, and provider-neutral production packs. Use for shot planning and production handoff, not video generation.
---

# novel-storyboard

Require a screenplay artifact. Seed scene openings from staging when available; in a complete pipeline staging is required. Split each scene into generation segments and cuts without changing approved dialogue or claiming a beat twice.

Keep the first segment's opening sentence exactly equal to canonical staging. Later segments describe the evolving positions. Choose shot sizes, camera motion, frame prompts, and explicit character/reference IDs. Maintain one declared aspect ratio. Derive timestamps and dialogue from screenplay claims rather than retyping them.

Validate coverage, order, timing, and staging before export. Attach only real keyframe/reference files. Missing images are reported in the production manifest. Deliver a report plus a provider-neutral pack; do not claim a video has been rendered.

Read [the contract](references/schema.md) before authoring JSON and [the production procedure](references/authoring.md) for creative decisions. `{baseDir}` is this skill directory.

Use `node {baseDir}/scripts/novel-storyboard.mjs help` for exact commands. Run `validate` before handing off; deliver the offline HTML report alongside its JSON. Read validation failures as structural findings, not a verdict on story or image quality. Preserve existing IDs, source quotations, and approved dialogue. When revising, update affected dependencies and rerun validation.
