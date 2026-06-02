# AGENTS.md

Guidance for AI agents working in this repository.

## Project status

This repository is a **placeholder** for Kenneth's project (EA, marine engineering, and business ideas). As of the initial commit, it contains only `README.md`—no application source, package manifests, Docker setup, or CI configuration.

## Cursor Cloud specific instructions

### What is not in the repo yet

There is nothing to install, lint, test, or run beyond cloning the repository. Do not expect `package.json`, `Makefile`, `docker-compose.yml`, or similar until application code is added.

### VM update script

The startup update script is a no-op (`true`). No dependency refresh is required on each session.

### Verification when no app exists

To confirm the environment is usable before code lands:

- `git status` and `git log` should work from `/workspace`
- `cat README.md` should show the project title and description

### When application code is added

Update this section with:

- Required services (databases, APIs, etc.) and how to start them
- Dev server command(s) and default URLs/ports
- Lint and test commands
- Non-obvious env vars or secrets (reference names only; do not commit secrets)

Point agents at the canonical docs (`README.md`, `CONTRIBUTING.md`, or package scripts) rather than duplicating full command lists here unless something is easy to miss.

## Standard commands (current)

| Task | Command | Notes |
|------|---------|--------|
| Lint | N/A | Not configured |
| Test | N/A | Not configured |
| Dev server | N/A | Not configured |
| Build | N/A | Not configured |
