import { describe, expect, test } from "bun:test";
import { hashDatasetPayload } from "../src/datasets/version.js";

describe("hashDatasetPayload", () => {
	test("returns a stable SHA-256 hash for the same payload", () => {
		const payload = {
			prompts: ["a", "b"],
			taskType: "text",
			version: 1,
		} as const;

		const firstHash = hashDatasetPayload(payload);
		const secondHash = hashDatasetPayload(payload);

		expect(firstHash).toBe(secondHash);
		expect(firstHash).toMatch(/^[0-9a-f]{64}$/);
	});

	test("returns a different hash when the payload changes", () => {
		const firstHash = hashDatasetPayload({ prompt: "hello" });
		const secondHash = hashDatasetPayload({ prompt: "hello!" });

		expect(firstHash).not.toBe(secondHash);
	});
});
