# novel-outline

Adapt a supplied novel or story into a short-drama outline with source evidence, episode beats, and a computed asset inventory. Use for adaptation planning, not screenplay dialogue.

Node.js 22+, no dependencies. Copy this directory anywhere and read [SKILL.md](SKILL.md).

```sh
node scripts/novel-outline.mjs help
node scripts/novel-outline.mjs validate examples/sample.json
node scripts/novel-outline.mjs render examples/sample.json --out /tmp/novel-outline-report.html
node scripts/selftest.mjs
```

Commands above run from this skill directory. Context-dependent checks report skipped inputs; production handoffs should supply the available upstream artifacts. See [schema](references/schema.md) for context flags. Reports are generated locally and remain editable through their JSON working data.
