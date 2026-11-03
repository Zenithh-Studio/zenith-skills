# drama-outline

Adapt a supplied novel or story into a short-drama outline with source evidence, episode beats, and a computed asset inventory. Use for adaptation planning, not screenplay dialogue.

Node.js 22+, no dependencies. Copy this directory anywhere and read [SKILL.md](SKILL.md).

```sh
node scripts/drama-outline.mjs help
node scripts/drama-outline.mjs validate examples/sample.json
node scripts/drama-outline.mjs render examples/sample.json --out /tmp/drama-outline-report.html
node scripts/selftest.mjs
```

Commands above run from this skill directory. Context-dependent checks report skipped inputs; production handoffs should supply the available upstream artifacts. See [schema](references/schema.md) for context flags. Reports are generated locally and remain editable through their JSON working data.

Reports support Export JSON, Copy JSON, and Review JSON. Review JSON exposes the current editable working data when downloads or clipboard access are restricted.
