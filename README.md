# engram

Cheap-first evaluation runner and durable result store.

This project is intentionally separate from model routing libraries. Route
selection stays stateless in consumers, while `engram` stores benchmark
history, scorecards, and backup snapshots that can be reused across projects.

## Goals

- Run low-cost model evaluations at scale.
- Keep a local-first evaluation database you own.
- Preserve expensive historical results with redundant backups.
- Provide simple CLI commands that work without cloud dependencies.

## Current scope

This scaffold includes:

- SQLite schema initialization (`init-db`).
- Storage path resolution (`paths`).
- Daily aggregate scorecards from stored results (`scorecard`).
- Snapshot backup creation with checksum manifests (`backup`).
- Snapshot integrity verification (`verify-backup`).

It does not yet include full provider runners, judge adapters, or parquet
export pipelines.

## Install

```bash
bun install
```

## CLI

```bash
# Show effective storage paths
engram paths

# Initialize the SQLite schema
engram init-db

# Daily aggregate metrics (UTC date defaults to today)
engram scorecard --date 2026-02-21

# Create a checksum snapshot
engram backup --to ~/Backups/engram

# Verify a snapshot
engram verify-backup --path ~/Backups/engram/snapshot-2026-02-21T16-00-00.000Z
```

## Environment variables

- `ENGRAM_DATA_DIR` (default: `~/.engram`)
- `ENGRAM_DB_PATH` (default: `<dataDir>/engram.sqlite`)

## Development

```bash
bun run test
bun run typecheck
bun run lint
bun run build
```

## Release automation

This repository is configured with release-please for GitHub release PRs and
changelog/version updates. It is intentionally **not** configured to publish to
npm automatically.

## Project policies

- Contributing guide: `CONTRIBUTING.md`
- Security policy: `SECURITY.md`
- License: `LICENSE`
