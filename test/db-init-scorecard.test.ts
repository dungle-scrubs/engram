import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { initializeSchema } from "../src/db/init.js";
import { buildDailyScorecard } from "../src/runner/scorecard.js";

describe("initializeSchema", () => {
	test("creates required tables and indexes and stays idempotent", () => {
		const sqlite = new Database(":memory:", { strict: true });

		try {
			initializeSchema(sqlite);
			initializeSchema(sqlite);

			const tableRows = sqlite
				.query("SELECT name FROM sqlite_master WHERE type = 'table'")
				.all() as Array<{ readonly name: string }>;
			const tableNames = tableRows.map((row) => row.name);

			for (const tableName of [
				"artifacts",
				"datasets",
				"prompts",
				"results",
				"runs",
			]) {
				expect(tableNames.includes(tableName)).toBe(true);
			}

			const indexRows = sqlite
				.query("SELECT name FROM sqlite_master WHERE type = 'index'")
				.all() as Array<{ readonly name: string }>;
			const indexNames = indexRows.map((row) => row.name);

			for (const indexName of [
				"idx_prompts_dataset",
				"idx_results_created_at",
				"idx_results_model",
				"idx_results_prompt",
				"idx_results_run",
				"idx_results_success",
				"idx_runs_dataset",
				"uidx_artifacts_sha256",
				"uidx_prompts_prompt_hash",
			]) {
				expect(indexNames.includes(indexName)).toBe(true);
			}
		} finally {
			sqlite.close();
		}
	});
});

describe("buildDailyScorecard", () => {
	test("returns zeroed metrics when no rows exist for a day", () => {
		const sqlite = new Database(":memory:", { strict: true });

		try {
			initializeSchema(sqlite);

			const scorecard = buildDailyScorecard(sqlite, "2026-02-22");
			expect(scorecard).toEqual({
				avgLatencyMs: 0,
				date: "2026-02-22",
				fallbackRate: 0,
				p95LatencyMs: 0,
				successRate: 0,
				total: 0,
			});
		} finally {
			sqlite.close();
		}
	});

	test("computes daily metrics from matching rows only", () => {
		const sqlite = new Database(":memory:", { strict: true });

		try {
			initializeSchema(sqlite);
			const dayStart = Date.parse("2026-02-22T00:00:00.000Z");

			const insertResult = sqlite.query(`
				INSERT INTO results (
					id,
					run_id,
					prompt_id,
					provider,
					model,
					params_hash,
					success,
					score,
					latency_ms,
					fallback_depth,
					error_code,
					output_ref,
					created_at_ms
				) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
			`);

			insertResult.run(
				"result-1",
				"run-1",
				"prompt-1",
				"provider-a",
				"model-a",
				"params-a",
				1,
				null,
				100,
				0,
				null,
				null,
				dayStart + 10,
			);
			insertResult.run(
				"result-2",
				"run-1",
				"prompt-2",
				"provider-a",
				"model-a",
				"params-a",
				0,
				null,
				400,
				2,
				null,
				null,
				dayStart + 20,
			);
			insertResult.run(
				"result-3",
				"run-2",
				"prompt-3",
				"provider-a",
				"model-a",
				"params-a",
				1,
				null,
				999,
				0,
				null,
				null,
				dayStart - 1,
			);

			const scorecard = buildDailyScorecard(sqlite, "2026-02-22");

			expect(scorecard.avgLatencyMs).toBe(250);
			expect(scorecard.date).toBe("2026-02-22");
			expect(scorecard.fallbackRate).toBe(0.5);
			expect(scorecard.p95LatencyMs).toBe(400);
			expect(scorecard.successRate).toBe(0.5);
			expect(scorecard.total).toBe(2);
		} finally {
			sqlite.close();
		}
	});
});
