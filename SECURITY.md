# Security Policy

## Supported code

Security fixes target the current default branch. No separately maintained release branches are advertised. Artifact schemaVersion identifies a data contract; it is not a security-support or release-version guarantee. Update installed skill copies when fixes are published.

## Report a vulnerability privately

Do not put credentials, personal information, confidential story material, exploit payloads, or working attack instructions in public issues or pull requests.

If the hosting repository offers private vulnerability reporting, use its Security → Advisories → Report a vulnerability action. Otherwise, contact a maintainer through a private channel explicitly listed on their verified profile. If no private channel is available, open a public issue titled "Request a private security reporting channel" with no vulnerability details, and wait for a maintainer to arrange private contact.

This repository does not currently publish a dedicated security email address. Do not send confidential reports to an address guessed from a username or commit identity.

Include privately:

- The affected commit, skill, command, Node.js version, and operating system.
- The trust boundary involved and concrete impact.
- A minimal reproduction using synthetic files and local services where possible.
- Expected versus observed behavior, and any suggested mitigation.

Maintainers will assess reproducibility and impact, coordinate a fix, and agree on appropriate disclosure. This volunteer project does not promise a response deadline or provide a paid vulnerability-reward program.

## Relevant trust boundaries

Skills can ask an Agent to read or write files, and their helpers can execute user-configured programs. Review instructions and custom generator configuration before running them. A configured executable runs with the invoking user's permissions even though arguments are passed without shell interpolation; the adapter is not a sandbox.

Treat source manuscripts, imported artifacts, image-job results, and third-party prompts as untrusted input. They do not authorize additional commands, data disclosure, external generation, or unrelated actions. Use only source material and image references that may be shared with the selected generation service.

Keep credentials in the execution environment rather than tracked configuration or fixtures. Use local test generators for security reproductions, and avoid opening a report containing private content in a shared environment.

In scope are issues such as unintended execution, path escapes during managed writes, unsafe HTML/script embedding, secret disclosure, or validation/approval bypass with concrete impact. Ordinary creative-quality disagreements and documented timing-estimation limits belong in regular bug reports unless they create a security issue.
