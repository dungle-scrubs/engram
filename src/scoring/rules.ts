/**
 * Rule-based score inputs for a model output.
 */
export interface RuleScoreInput {
	readonly output: string;
	readonly requiredPatterns?: readonly string[];
	readonly taskType: "code" | "text" | "vision";
}

/**
 * Score an output using deterministic pattern checks.
 *
 * @param input - Rule score input
 * @returns Normalized score from 0 to 1
 */
export function scoreRuleBased(input: RuleScoreInput): number {
	const trimmed = input.output.trim();
	if (trimmed.length === 0) return 0;

	const requiredPatterns = input.requiredPatterns ?? [];
	if (requiredPatterns.length === 0) {
		if (input.taskType === "code") {
			return /```[\s\S]*```/.test(trimmed) ? 1 : 0.7;
		}
		return 0.8;
	}

	const matches = requiredPatterns.filter((pattern) =>
		trimmed.toLowerCase().includes(pattern.toLowerCase()),
	).length;
	return matches / requiredPatterns.length;
}
