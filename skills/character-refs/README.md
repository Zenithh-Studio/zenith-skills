# character-refs

Generate and version character reference images through an Agent image tool or custom executable, using approved anchor images and tracked dependencies. Use when actual reference images are requested, not just design prompts.

Node.js 22+, no dependencies. Copy this directory anywhere and read [SKILL.md](SKILL.md).

```sh
node scripts/character-refs.mjs help
node scripts/character-refs.mjs checkup examples/sample.json  # expected pending-anchor findings
node scripts/character-refs.mjs render examples/sample.json --out /tmp/character-refs-report.html
node scripts/selftest.mjs
```

Commands above run from this skill directory. Context-dependent checks report skipped inputs; production handoffs should supply the available upstream artifacts. See [schema](references/schema.md) for context flags. Reports are generated locally and remain editable through their JSON working data.

Reports support Export JSON, Copy JSON, and Review JSON. Review JSON exposes the current editable working data when downloads or clipboard access are restricted.
