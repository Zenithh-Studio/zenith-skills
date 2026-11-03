# Contributing to zskills

Thanks for helping make AI short-drama production more reliable. Contributions can improve a skill's instructions, creative procedures, deterministic helpers, contracts, reports, or examples.

Read [AGENTS.md](AGENTS.md) for repository conventions and the [Code of Conduct](CODE_OF_CONDUCT.md) before participating. Report vulnerabilities through [SECURITY.md](SECURITY.md), rather than a public bug report.

## Propose a change

For a bug, describe the command or Agent request, expected result, actual result, Node.js version, operating system, and a minimal sanitized artifact that reproduces it. Do not include API keys, credentials, private source material, or personal information.

For a new skill, contract change, or substantial workflow change, explain the production problem and intended handoff before implementing it. Narrow fixes and documentation corrections can go directly to a pull request.

## Develop locally

Use Node.js 22 or newer. The skills use only its standard library; there is no npm installation step.

```sh
node scripts/selftest.mjs
node skills/drama-outline/scripts/selftest.mjs
```

The first command runs all skill and integration checks. The second is an example of a focused module check. Tests invoke local child processes and a fake image generator; they require no network, API key, paid quota, or live model. A restricted execution environment must permit those local child processes.

Use a fresh output directory when previewing the complete fixture tour:

```sh
node scripts/demo.mjs --out /tmp/zskills-contribution-demo
```

Open its index.html and inspect affected reports, image paths, and interactions. For staging changes, edit a position or control, review/export JSON, and validate the edited data. Do not commit generated reports, packs, images, local configuration, or secrets. Each skill's bundled examples and upstream snapshots are tracked test inputs.

## Keep skills portable

- Keep each production skill self-contained. Import only Node.js built-ins or files inside that skill directory.
- Keep SKILL.md concise, with accurate activation descriptions and links to detailed references.
- Write documentation, diagnostics, prompts, and fixtures in English. Preserve original evidence and approved dialogue verbatim.
- Separate Agent-authored creative work from deterministic operations. Tests must never claim that fake images demonstrate visual quality.
- Preserve stable IDs, append-only image versions, and content-bound approvals. Report missing inputs and stale artifacts explicitly.
- Update documentation, seed helpers, validators, and examples together when changing an artifact contract. Unsupported schema versions must fail clearly; explain migration requirements for breaking changes.
- When changing the shared CLI/report contract, update every local scripts/lib.mjs copy together. Integration tests check their equality and test isolated skill copies.

## Validate the behavior

Add tests for meaningful invariants and reproduced failures. Include relevant negative cases, such as invalid references, duplicate claims, stale approvals, missing image outputs, or incorrect timing. Avoid tests that only match headings or repeat implementation details.

Run the full suite after changes. For report changes, also check the rendered HTML: script compilation cannot establish that controls work or that a layout is readable. State any live provider behavior that remains unverified.

## Submit a pull request

Use Conventional Commits with the affected module as scope, for example:

```text
fix(drama-storyboard): preserve dialogue offsets within a cut
feat(character-refs): support another reference view
docs(repo): clarify offline validation
```

Keep commits focused and independently reviewable. Explain the concrete production problem, resulting behavior, validation performed, and any compatibility implications. Include before/after evidence for visual changes. Keep unrelated refactors out of a focused fix.

Contribute only material you have the right to share. Remove private or restricted story text from reproductions, and identify any third-party material and its license. Contributions are distributed under the repository's license in [LICENSE](LICENSE).
