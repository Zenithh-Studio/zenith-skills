# Repository conventions

- Write instructions, documentation, diagnostics, prompts, and fixtures in English.
- Keep each production skill portable: imports must stay inside its own directory or use Node.js built-ins.
- Agents author creative content. Scripts compute, validate, render, and exchange artifacts; they do not pretend to generate stories or images.
- Preserve stable IDs and approved dialogue. Never silently discard source text, authored work, or image versions.
- Ask for outline and character-anchor approval before dependent production work; approvals belong to content fingerprints.
- Keep entrypoints concise and route to references only when relevant.
- Run `node scripts/selftest.mjs` before completing changes. Add meaningful negative cases for deterministic behavior.
- Use Conventional Commits with skill-name scopes. Keep generated reports, production outputs, and local configuration out of Git.
