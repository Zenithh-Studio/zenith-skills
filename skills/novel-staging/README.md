# novel-staging

Plan and edit opening positions, presence, posture, and facing for screenplay scenes. Use for scene blocking before storyboarding, with an offline draggable report and deterministic handoff text.

Node.js 22+, no dependencies. Copy this directory anywhere and read [SKILL.md](SKILL.md).

```sh
node scripts/novel-staging.mjs help
node scripts/novel-staging.mjs validate examples/sample.json
node scripts/novel-staging.mjs render examples/sample.json --out /tmp/novel-staging-report.html
node scripts/selftest.mjs
```

Commands above run from this skill directory. Context-dependent checks report skipped inputs; production handoffs should supply the available upstream artifacts. See [schema](references/schema.md) for context flags. Reports are generated locally and remain editable through their JSON working data.

Reports support Export JSON, Copy JSON, and Review JSON. Review JSON exposes the current editable working data when downloads or clipboard access are restricted.
