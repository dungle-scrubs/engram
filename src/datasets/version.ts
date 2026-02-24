import { createHash } from "node:crypto";

/**
 * Create a stable hash for a dataset payload.
 *
 * Uses `JSON.stringify` internally, so the hash is sensitive to object
 * key ordering.  Callers must ensure consistent key order (e.g. by
 * constructing literal objects or sorting keys before hashing) to get
 * reproducible digests across different code paths.
 *
 * @param payload - Arbitrary dataset payload to hash
 * @returns SHA-256 hex digest string
 */
export function hashDatasetPayload(payload: unknown): string {
	return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
