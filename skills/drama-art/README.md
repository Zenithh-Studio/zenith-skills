# drama-art

Design reusable location and narrative-prop bibles for AI short drama, including consistency anchors, lighting variants, and scale-aware prompts. Use for production design, not screenplay or image generation.

Node.js 22+, no dependencies. Copy this directory anywhere and read [SKILL.md](SKILL.md).

```sh
node scripts/drama-art.mjs help
node scripts/drama-art.mjs validate examples/sample.json
node scripts/drama-art.mjs render examples/sample.json --out /tmp/drama-art-report.html
node scripts/selftest.mjs
```

Commands above run from this skill directory. Context-dependent checks report skipped inputs; production handoffs should supply the available upstream artifacts. See [schema](references/schema.md) for context flags. Reports are generated locally and remain editable through their JSON working data.

Reports support Export JSON, Copy JSON, and Review JSON. Review JSON exposes the current editable working data when downloads or clipboard access are restricted.
