import type { Database } from "bun:sqlite";

/** Daily aggregate metrics computed from result rows. */
export interface DailyScorecard {
	readonly avgLatencyMs: number;
	readonly date: string;
	readonly fallbackRate: number;
	readonly p95LatencyMs: number;
	readonly successRate: number;
	readonly total: number;
}

/**
 * Build a daily scorecard from results collected on a UTC date.
 *
 * @param sqlite - SQLite database handle
 * @param date - UTC date string (`YYYY-MM-DD`)
 * @returns Aggregate scorecard
 */
export function buildDailyScorecard(
	sqlite: Database,
	date: string,
): DailyScorecard {
	const dayStart = Date.parse(`${date}T00:00:00.000Z`);
	const dayEnd = dayStart + 24 * 60 * 60 * 1000;

	const rows = sqlite
		.query(
			`SELECT latency_ms, success, fallback_depth
			 FROM results
			 WHERE created_at_ms >= ?1 AND created_at_ms < ?2`,
		)
		.all(dayStart, dayEnd) as Array<{
		fallback_depth: number;
		latency_ms: number;
		success: number;
	}>;

	if (rows.length === 0) {
		return {
			avgLatencyMs: 0,
			date,
			fallbackRate: 0,
			p95LatencyMs: 0,
			successRate: 0,
			total: 0,
		};
	}

	const latencies = rows.map((row) => row.latency_ms).sort((a, b) => a - b);
	const latencyIndex = Math.min(
		latencies.length - 1,
		Math.floor(latencies.length * 0.95),
	);
	const p95LatencyMs = latencies[latencyIndex] ?? 0;
	const totalLatency = latencies.reduce((sum, value) => sum + value, 0);
	const successCount = rows.filter((row) => row.success === 1).length;
	const fallbackCount = rows.filter((row) => row.fallback_depth > 0).length;

	return {
		avgLatencyMs: totalLatency / latencies.length,
		date,
		fallbackRate: fallbackCount / rows.length,
		p95LatencyMs,
		successRate: successCount / rows.length,
		total: rows.length,
	};
}
