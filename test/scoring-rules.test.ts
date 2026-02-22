import { describe, expect, test } from "bun:test";
import { scoreRuleBased } from "../src/scoring/rules.js";

describe("scoreRuleBased", () => {
	test("returns 0 when output is empty", () => {
		const score = scoreRuleBased({ output: "   ", taskType: "text" });
		expect(score).toBe(0);
	});

	test("returns 1 for code output with fences and no required patterns", () => {
		const score = scoreRuleBased({
			output: "```ts\nconsole.log('ok');\n```",
			taskType: "code",
		});
		expect(score).toBe(1);
	});

	test("returns 0.7 for code output without fences", () => {
		const score = scoreRuleBased({
			output: "console.log('ok');",
			taskType: "code",
		});
		expect(score).toBe(0.7);
	});

	test("returns 0.8 for non-code output with no required patterns", () => {
		const score = scoreRuleBased({
			output: "This is a plain explanation.",
			taskType: "text",
		});
		expect(score).toBe(0.8);
	});

	test("matches required patterns case-insensitively", () => {
		const score = scoreRuleBased({
			output: "Latency: 100ms. SUCCESS true.",
			requiredPatterns: ["latency", "success", "fallback"],
			taskType: "text",
		});
		expect(score).toBe(2 / 3);
	});
});
