import type { Database } from "bun:sqlite";

/**
 * Initialize core engram tables and indexes.
 *
 * @param sqlite - SQLite database handle
 * @returns Nothing
 */
export function initializeSchema(sqlite: Database): void {
	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS datasets (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			version TEXT NOT NULL,
			created_at_ms INTEGER NOT NULL
		);

		CREATE TABLE IF NOT EXISTS prompts (
			id TEXT PRIMARY KEY NOT NULL,
			dataset_id TEXT NOT NULL REFERENCES datasets(id),
			prompt TEXT NOT NULL,
			prompt_hash TEXT NOT NULL,
			task_type TEXT NOT NULL,
			created_at_ms INTEGER NOT NULL
		);

		CREATE TABLE IF NOT EXISTS runs (
			id TEXT PRIMARY KEY NOT NULL,
			dataset_id TEXT NOT NULL REFERENCES datasets(id),
			policy_version TEXT NOT NULL,
			git_sha TEXT,
			created_at_ms INTEGER NOT NULL
		);

		CREATE TABLE IF NOT EXISTS results (
			id TEXT PRIMARY KEY NOT NULL,
			run_id TEXT NOT NULL REFERENCES runs(id),
			prompt_id TEXT NOT NULL REFERENCES prompts(id),
			provider TEXT NOT NULL,
			model TEXT NOT NULL,
			params_hash TEXT NOT NULL,
			success INTEGER NOT NULL,
			score REAL,
			latency_ms INTEGER NOT NULL,
			fallback_depth INTEGER NOT NULL DEFAULT 0,
			error_code TEXT,
			output_ref TEXT,
			created_at_ms INTEGER NOT NULL
		);

		CREATE TABLE IF NOT EXISTS artifacts (
			id TEXT PRIMARY KEY NOT NULL,
			storage_uri TEXT NOT NULL,
			sha256 TEXT NOT NULL,
			bytes INTEGER NOT NULL,
			created_at_ms INTEGER NOT NULL
		);

		CREATE UNIQUE INDEX IF NOT EXISTS uidx_prompts_prompt_hash
			ON prompts(prompt_hash);
		CREATE INDEX IF NOT EXISTS idx_prompts_dataset ON prompts(dataset_id);
		CREATE INDEX IF NOT EXISTS idx_runs_dataset ON runs(dataset_id);
		CREATE INDEX IF NOT EXISTS idx_results_run ON results(run_id);
		CREATE INDEX IF NOT EXISTS idx_results_prompt ON results(prompt_id);
		CREATE INDEX IF NOT EXISTS idx_results_model ON results(model);
		CREATE INDEX IF NOT EXISTS idx_results_success ON results(success);
		CREATE UNIQUE INDEX IF NOT EXISTS uidx_artifacts_sha256 ON artifacts(sha256);
		CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at_ms);
	`);
}
