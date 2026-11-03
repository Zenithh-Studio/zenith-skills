# novel-script

Write structured short-drama screenplays with stable scene and beat IDs, source-aligned episode claims, English dialogue timing, and per-character line books. Use for screenplay writing, not shot planning.

Node.js 22+, no dependencies. Copy this directory anywhere and read [SKILL.md](SKILL.md).

```sh
node scripts/novel-script.mjs help
node scripts/novel-script.mjs validate examples/sample.json
node scripts/novel-script.mjs render examples/sample.json --out /tmp/novel-script-report.html
node scripts/selftest.mjs
```

Commands above run from this skill directory. Context-dependent checks report skipped inputs; production handoffs should supply the available upstream artifacts. See [schema](references/schema.md) for context flags. Reports are generated locally and remain editable through their JSON working data.

Reports support Export JSON, Copy JSON, and Review JSON. Review JSON exposes the current editable working data when downloads or clipboard access are restricted.
