# Contributing

## Setup

```bash
bun install
bun run typecheck
bun run lint
bun run build
```

## Local CLI development

```bash
bun run dev -- --help
bun run dev -- init-db
bun run dev -- scorecard --date 2026-02-21
```

## Commit format

This repository uses Conventional Commits so release-please can generate
release PRs and changelog entries.

Examples:

- `feat: add backup prune command`
- `fix: avoid checksum mismatch on empty files`
- `chore: update drizzle-kit`

Use `!` for breaking changes (for example `feat!: rename scorecard schema`).

## Pull requests

Before opening a PR, run:

```bash
bun run typecheck
bun run lint
bun run build
```
