# drama-pipeline

Coordinate an AI short-drama project across outline, design, screenplay, staging, storyboard, and character references with fingerprinted approvals and resumable artifact handoffs. Use for complete or resumed multi-stage production, not a single-stage request.

Node.js 22+, no dependencies. Copy this directory anywhere and read [SKILL.md](SKILL.md).

```sh
node scripts/drama-pipeline.mjs help
node scripts/drama-pipeline.mjs validate examples/sample.json
node scripts/drama-pipeline.mjs render examples/sample.json --out /tmp/drama-pipeline-report.html
node scripts/selftest.mjs
```

Commands above run from this skill directory. Context-dependent checks report skipped inputs; production handoffs should supply the available upstream artifacts. See [schema](references/schema.md) for context flags. Reports are generated locally and remain editable through their JSON working data.

Reports support Export JSON, Copy JSON, and Review JSON. Review JSON exposes the current editable working data when downloads or clipboard access are restricted.
