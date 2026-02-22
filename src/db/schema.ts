import {
	index,
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const datasetsTable = sqliteTable("datasets", {
	createdAtMs: integer("created_at_ms").notNull(),
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	version: text("version").notNull(),
});

export const promptsTable = sqliteTable(
	"prompts",
	{
		createdAtMs: integer("created_at_ms").notNull(),
		datasetId: text("dataset_id").notNull(),
		id: text("id").primaryKey(),
		prompt: text("prompt").notNull(),
		promptHash: text("prompt_hash").notNull(),
		taskType: text("task_type").notNull(),
	},
	(table) => ({
		datasetIndex: index("idx_prompts_dataset").on(table.datasetId),
		promptHashUnique: uniqueIndex("uidx_prompts_prompt_hash").on(
			table.promptHash,
		),
	}),
);

export const runsTable = sqliteTable(
	"runs",
	{
		createdAtMs: integer("created_at_ms").notNull(),
		datasetId: text("dataset_id").notNull(),
		gitSha: text("git_sha"),
		id: text("id").primaryKey(),
		policyVersion: text("policy_version").notNull(),
	},
	(table) => ({
		datasetIndex: index("idx_runs_dataset").on(table.datasetId),
	}),
);

export const resultsTable = sqliteTable(
	"results",
	{
		createdAtMs: integer("created_at_ms").notNull(),
		errorCode: text("error_code"),
		fallbackDepth: integer("fallback_depth").notNull().default(0),
		id: text("id").primaryKey(),
		latencyMs: integer("latency_ms").notNull(),
		model: text("model").notNull(),
		outputRef: text("output_ref"),
		paramsHash: text("params_hash").notNull(),
		promptId: text("prompt_id").notNull(),
		provider: text("provider").notNull(),
		runId: text("run_id").notNull(),
		score: real("score"),
		success: integer("success", { mode: "boolean" }).notNull(),
	},
	(table) => ({
		modelIndex: index("idx_results_model").on(table.model),
		promptIndex: index("idx_results_prompt").on(table.promptId),
		runIndex: index("idx_results_run").on(table.runId),
		statusIndex: index("idx_results_success").on(table.success),
	}),
);

export const artifactsTable = sqliteTable(
	"artifacts",
	{
		bytes: integer("bytes").notNull(),
		createdAtMs: integer("created_at_ms").notNull(),
		id: text("id").primaryKey(),
		sha256: text("sha256").notNull(),
		storageUri: text("storage_uri").notNull(),
	},
	(table) => ({
		shaIndex: uniqueIndex("uidx_artifacts_sha256").on(table.sha256),
	}),
);
