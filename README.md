# zskills

Portable AI short-drama production skills. An Agent authors creative material; dependency-free Node.js tools validate, render, and hand it off.

Requires Node.js 22 or newer. No npm installation, API key, runtime-specific installer, or account is required for offline work.

## Install manually

Copy a directory from `skills/` into your Agent's skill directory, or ask the Agent to read its `SKILL.md` directly. Each production skill includes its own runtime and fixtures. For orchestration, supply the directory containing the stage skills with `--skills-dir`. When upgrading a manual installation, replace outdated skill copies with the current directory names to avoid duplicate discovery. Working artifact kinds and pipeline stage keys are unchanged.

## Workflow

Outline → characters and art → screenplay → opening staging → storyboard → provider-neutral production pack. Character reference images branch from the character bible and feed visual references downstream.

Start with `skills/drama-pipeline/SKILL.md` for a complete project, or select one stage for an existing artifact. Outline direction and character anchor images require human approval. Other stages proceed after validation, unless a consequential decision is missing.

## Choose a skill

| Skill | Working artifact | Main deliverable |
| --- | --- | --- |
| [drama-outline](skills/drama-outline/SKILL.md) | outline.json | Adaptation decisions and episode outline |
| [drama-characters](skills/drama-characters/SKILL.md) | cast.json | Character and voice bible |
| [drama-art](skills/drama-art/SKILL.md) | art.json | Locations, props, and state prompts |
| [drama-script](skills/drama-script/SKILL.md) | script.json | Screenplay and dialogue line book |
| [drama-staging](skills/drama-staging/SKILL.md) | staging.json | Editable opening scene plans |
| [drama-storyboard](skills/drama-storyboard/SKILL.md) | storyboard.json | Cuts, timeline, and production pack |
| [character-refs](skills/character-refs/SKILL.md) | Per-character asset.json | Actual reference images and gallery |
| [drama-pipeline](skills/drama-pipeline/SKILL.md) | pipeline.json | Status, approvals, and next actions |

## Start a project

From the repository root, initialize with a brief shaped like the bundled example, then ask your Agent to use `drama-pipeline`:

```sh
node skills/drama-pipeline/scripts/drama-pipeline.mjs init skills/drama-pipeline/examples/brief.json --skills-dir ./skills --source skills/drama-outline/examples/source.txt --out work/last-signal/pipeline.json
node skills/drama-pipeline/scripts/drama-pipeline.mjs resume work/last-signal/pipeline.json
```

The Agent authors each artifact, runs its validator, then registers it:

```sh
node skills/drama-pipeline/scripts/drama-pipeline.mjs register work/last-signal/pipeline.json --stage outline --artifact work/last-signal/outline.json
```

After the user has reviewed and approved that exact outline:

```sh
node skills/drama-pipeline/scripts/drama-pipeline.mjs approve work/last-signal/pipeline.json --stage outline
```

`resume` gives available next work. `status` is read-only; `refresh` persists current findings. After reconciling stale authored data, `accept --stage STAGE` records its new upstream snapshot. Registration and acceptance do not author missing content. Fingerprints use exact file bytes: even a formatting-only edit can require reconciliation.

## Explore the offline example

```sh
node scripts/demo.mjs --out /tmp/zskills-demo
```

Open the generated `index.html` to navigate all seven production reports and the neutral pack. This copies original fixtures and produces no model calls or images. The character gallery is visibly pending. The demo pipeline preserves the outline approval checkpoint rather than inventing user consent. Choose a new output directory for each run.

Reports open offline and export JSON. Use **Review JSON** to access current edited data when a browser limits downloads or clipboard access. Staging edits are saved in that browser; export and validate them before replacing working data.

## Verify

```sh
node scripts/selftest.mjs
```

The suite covers per-skill validation, a complete two-character image-adapter workflow, independent directory copies, cross-stage handoffs, revision/approval invalidation, report script compilation, and documented commands. Every test is offline. Image adapter tests use a local fake executable; they do not demonstrate live image quality.

## Boundaries

This suite prepares production material and character references. Video generation, editing, TTS execution, and vendor-specific video protocols are outside v1. No generated report or image is committed by default.

## Development

Each skill carries a small local runtime so copying it does not break imports. Runtime copies intentionally share a version-one contract; the integration test checks their equality. Change them together when modifying the common CLI/report contract. Stage-specific rules remain in their own modules. No formatter or test dependency is required by consumers.

Every schema is version 1. Unsupported versions fail explicitly; importing external artifacts requires deliberate conversion to the documented contracts. Generated work belongs outside tracked skill resources. Examples under each skill are standalone fixtures, including their local upstream snapshots.
