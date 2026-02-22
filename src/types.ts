/** Supported high-level task categories for eval prompts. */
export type EvalTaskType = "code" | "text" | "vision";

/** Prompt row stored in the eval prompt bank. */
export interface EvalPromptRecord {
	readonly datasetId: string;
	readonly id: string;
	readonly prompt: string;
	readonly promptHash: string;
	readonly taskType: EvalTaskType;
}

/** Run metadata tracked for each evaluation execution. */
export interface EvalRunRecord {
	readonly createdAtMs: number;
	readonly datasetId: string;
	readonly gitSha?: string;
	readonly id: string;
	readonly policyVersion: string;
}

/** Per-model result row for a single prompt within a run. */
export interface EvalResultRecord {
	readonly errorCode?: string;
	readonly fallbackDepth: number;
	readonly id: string;
	readonly latencyMs: number;
	readonly model: string;
	readonly outputRef?: string;
	readonly paramsHash: string;
	readonly promptId: string;
	readonly provider: string;
	readonly runId: string;
	readonly score?: number;
	readonly success: boolean;
}

/** Binary/text artifact descriptor stored separately from result rows. */
export interface ArtifactRecord {
	readonly bytes: number;
	readonly id: string;
	readonly sha256: string;
	readonly storageUri: string;
}
