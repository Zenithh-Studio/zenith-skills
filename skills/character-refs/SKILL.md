---
name: character-refs
description: Generate and version character reference images through an Agent image tool or custom executable, using approved anchor images and tracked dependencies. Use when actual reference images are requested, not just design prompts.
---

# character-refs

Read the supplied cast or character description. Fill a design with visible appearance, an English prompt, and the user's chosen style; label inferred details rather than repeatedly interrogating the user. Use `seed` for a cast character.

Prepare a front-full job. If an Agent image tool is available, pass its prompt, dimensions, and actual references to that tool, inspect its output, and write a result JSON for `import`. Otherwise use `generate` with a user-configured custom executable. If neither capability exists, deliver the pending job and explain what output is needed; never claim an image exists.

Show the imported anchor to the user. Run `confirm` only after approval of that exact image. Then create front face, side, and back views as needed; every derivative references the approved anchor. Preserve every version and regenerate only missing/stale views. Changing the design or anchor invalidates dependent approval and images.

Validate local files, render the gallery, and visually review identity, angle, framing, and style. PNG checks establish file integrity and dimensions, not visual fidelity.

Read [the contract](references/schema.md) before authoring JSON and [the production procedure](references/authoring.md) for creative decisions. `{baseDir}` is this skill directory.

Use `node {baseDir}/scripts/character-refs.mjs help` for exact commands. Run `validate` before handing off; deliver the offline HTML report alongside its JSON. Read validation failures as structural findings, not a verdict on story or image quality. Preserve existing IDs, source quotations, and approved dialogue. When revising, update affected dependencies and rerun validation.
