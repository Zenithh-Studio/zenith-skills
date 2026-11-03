# novel-storyboard

Turn screenplay beats and opening staging into timed segments, cuts, keyframe prompts, and provider-neutral production packs. Use for shot planning and production handoff, not video generation.

Node.js 22+, no dependencies. Copy this directory anywhere and read [SKILL.md](SKILL.md).

```sh
node scripts/novel-storyboard.mjs help
node scripts/novel-storyboard.mjs validate examples/sample.json --script examples/script.json --staging examples/staging.json
node scripts/novel-storyboard.mjs render examples/sample.json --script examples/script.json --staging examples/staging.json --out /tmp/novel-storyboard-report.html
node scripts/selftest.mjs
```

Commands above run from this skill directory. Context-dependent checks report skipped inputs; production handoffs should supply the available upstream artifacts. See [schema](references/schema.md) for context flags. Reports are generated locally and remain editable through their JSON working data.
