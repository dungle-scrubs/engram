import { createHash } from "node:crypto";

/**
 * Create a stable hash for a dataset payload.
 *
 * @param payload - Arbitrary dataset payload to hash
 * @returns SHA-256 hash string
 */
export function hashDatasetPayload(payload: unknown): string {
	return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
