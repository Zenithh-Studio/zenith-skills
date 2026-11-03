# zskills

Portable AI short-drama production skills. An Agent authors creative material; dependency-free Node.js tools validate, render, and hand it off.

Requires Node.js 22 or newer. No npm installation, API key, runtime-specific installer, or account is required for offline work.

## Install manually

Copy a directory from `skills/` into your Agent's skill directory, or ask the Agent to read its `SKILL.md` directly. Each production skill includes its own runtime and fixtures. For orchestration, supply the directory containing the stage skills with `--skills-dir`.

## Workflow

Outline → characters and art → screenplay → opening staging → storyboard → provider-neutral production pack. Character reference images branch from the character bible and feed visual references downstream.

Start with `skills/drama-pipeline/SKILL.md` for a complete project, or select one stage for an existing artifact. Outline direction and character anchor images require human approval. Other stages proceed after validation, unless a consequential decision is missing.

## Verify

```sh
node scripts/selftest.mjs
```

Every test is offline. Image adapter tests use a local fake executable; they do not demonstrate live image quality.

## Boundaries

This suite prepares production material and character references. Video generation, editing, TTS execution, and vendor-specific video protocols are outside v1. No generated report or image is committed by default.
