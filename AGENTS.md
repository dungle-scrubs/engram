# AGENTS.md

This file provides guidance to AI coding agents when working with code in
this repository.

## Project snapshot

- `engram` is a Bun + TypeScript CLI/library for local evaluation storage
  and analysis.
- Current implemented scope is intentionally narrow:
  - SQLite schema initialization
  - storage path resolution
  - daily scorecards from stored results
  - checksum-based backup snapshots + verification
- Out of scope right now (from `README.md`): provider runners,
  judge adapters, parquet export pipelines.

## Common commands

```bash
bun install
```

```bash
# Development CLI entrypoint
bun run dev -- --help
bun run dev -- paths
bun run dev -- init-db
bun run dev -- scorecard --date 2026-02-21
bun run dev -- backup --to ~/Backups/engram
bun run dev -- verify-backup --path ~/Backups/engram/snapshot-<timestamp>
```

```bash
# Quality + build
bun run test
bun run typecheck
bun run lint
bun run lint:fix
bun run build
```

```bash
# Drizzle tooling
bun run db:generate
bun run db:migrate
```

### Tests

- Test runner: Bun (`bun test`)
- Run all tests: `bun run test`
- Watch mode: `bun run test:watch`
- Run a single test file: `bun test test/storage-backup-paths.test.ts`
- Run a single test by name: `bun test -t "checksum manifest"`

## Architecture (big picture)

### 1) Entry surfaces

- CLI entrypoint: `src/cli.ts` (Commander-based command routing)
- Library exports: `src/index.ts` (re-exports DB, scoring, backup,
  and types)
- Built CLI binary target: `dist/cli.js` via `package.json#bin.engram`

### 2) Persistence layer

- Path/environment resolution: `src/db/paths.ts`
  - `ENGRAM_DATA_DIR` overrides default `~/.engram`
  - `ENGRAM_DB_PATH` overrides `<dataDir>/engram.sqlite`
- DB creation: `src/db/index.ts`
  - Opens Bun SQLite DB
  - Applies WAL + `synchronous = NORMAL`
  - Returns both raw SQLite handle and Drizzle client
- Schema bootstrap at runtime: `src/db/init.ts`
  - `init-db` command executes raw SQL DDL + indexes
- Drizzle schema definition: `src/db/schema.ts`
  - Used by `drizzle-kit` commands

**Important:** schema lives in two places (`init.ts` raw SQL and
`schema.ts` Drizzle). Keep them synchronized when changing tables or
indexes.

### 3) Read/compute layer

- Daily aggregates: `src/runner/scorecard.ts`
  - Reads `results` rows by UTC day window (`created_at_ms` range)
  - Computes: total, success rate, fallback rate, avg latency,
    p95 latency
- Deterministic scoring helper: `src/scoring/rules.ts`
  - Lightweight rule matcher for code/text/vision outputs

### 4) Snapshot/backup layer

- `src/storage/backup.ts`:
  - Creates a timestamped snapshot directory
  - Copies DB and optional `artifacts/` + `parquet/`
  - Writes `manifest.json` with SHA-256 + file size for each
    snapshot file
  - Verification re-hashes files against manifest

### 5) Core types/utilities

- Shared record types: `src/types.ts`
- Dataset fingerprint utility: `src/datasets/version.ts`
  (`hashDatasetPayload`)

## Cross-file constraints to remember

- `scorecard` logic assumes `results.created_at_ms` is epoch
  milliseconds with UTC-compatible boundaries.
- Backup correctness depends on both manifest generation and verification
  behavior in `src/storage/backup.ts`; if snapshot contents change,
  update both create + verify logic.
- `drizzle.config.ts` points to `./data/engram.sqlite`, while runtime
  DB defaults resolve via env/home path logic. If DB location
  conventions change, update both runtime path resolution and Drizzle
  config expectations.

## Repository policy files check

- No project-level `.cursorrules`, `.cursor/rules/*`, or
  `.github/copilot-instructions.md` were found.
- No repository-root `AGENTS.md`/`CLAUDE.md` existed before this file.
