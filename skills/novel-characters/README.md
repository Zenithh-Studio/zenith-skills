# novel-characters

Create source-grounded character profiles, visual design specifications, and voice prompts for short drama. Use for character bibles; image generation belongs to a reference-image workflow.

Node.js 22+, no dependencies. Copy this directory anywhere and read [SKILL.md](SKILL.md).

```sh
node scripts/novel-characters.mjs help
node scripts/novel-characters.mjs validate examples/sample.json
node scripts/novel-characters.mjs render examples/sample.json --out /tmp/novel-characters-report.html
node scripts/selftest.mjs
```

Commands above run from this skill directory. Context-dependent checks report skipped inputs; production handoffs should supply the available upstream artifacts. See [schema](references/schema.md) for context flags. Reports are generated locally and remain editable through their JSON working data.

Reports support Export JSON, Copy JSON, and Review JSON. Review JSON exposes the current editable working data when downloads or clipboard access are restricted.
