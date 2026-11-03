---
name: novel-characters
description: Create source-grounded character profiles, visual design specifications, and voice prompts for short drama. Use for character bibles; image generation belongs to a reference-image workflow.
---

# novel-characters

If an accepted outline exists, seed its roster and retain its IDs and names. Otherwise extract the roster from the supplied source, resolving aliases with evidence before merging identities. Read all relevant source passages; repeated names alone do not prove two people are the same.

Build personality, arc, visible design, and voice as separate fields. Quote exact source evidence and list unsupported design decisions under `inferences`. Keep design prompts in English and distinguish characters by visible and vocal traits. Do not invent images or claim a sheet exists because its prompt exists.

Validate against the source and available outline. Review the appearance/personality/prompt agreement, relationships, and voice distinction, then hand the cast artifact to screenplay or character reference work.

Read [the contract](references/schema.md) before authoring JSON and [the production procedure](references/authoring.md) for creative decisions. `{baseDir}` is this skill directory.

Use `node {baseDir}/scripts/novel-characters.mjs help` for exact commands. Run `validate` before handing off; deliver the offline HTML report alongside its JSON. Read validation failures as structural findings, not a verdict on story or image quality. Preserve existing IDs, source quotations, and approved dialogue. When revising, update affected dependencies and rerun validation.
