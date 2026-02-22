import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

/**
 * Expand a leading `~/` segment to the current user's home directory.
 *
 * @param inputPath - File-system path that may contain a home prefix
 * @returns Absolute or relative path with home prefix expanded
 */
export function expandHomePath(inputPath: string): string {
	if (inputPath.startsWith("~/")) {
		return join(homedir(), inputPath.slice(2));
	}
	return inputPath;
}

/**
 * Resolve the root data directory used by engram.
 *
 * Precedence:
 * 1. `ENGRAM_DATA_DIR`
 * 2. `~/.engram`
 *
 * @returns Absolute data directory path
 */
export function resolveDataDir(): string {
	const configuredPath = process.env.ENGRAM_DATA_DIR ?? "~/.engram";
	return resolve(expandHomePath(configuredPath));
}

/**
 * Resolve the SQLite database file path.
 *
 * Precedence:
 * 1. `ENGRAM_DB_PATH`
 * 2. `<dataDir>/engram.sqlite`
 *
 * @returns Absolute SQLite file path
 */
export function resolveDbPath(): string {
	const configuredPath = process.env.ENGRAM_DB_PATH;
	if (configuredPath) return resolve(expandHomePath(configuredPath));
	return resolve(join(resolveDataDir(), "engram.sqlite"));
}

/**
 * Ensure parent directories for a file path exist.
 *
 * @param filePath - Target file path
 * @returns Nothing
 */
export function ensureParentDir(filePath: string): void {
	const parentDir = dirname(filePath);
	if (!existsSync(parentDir)) {
		mkdirSync(parentDir, { recursive: true });
	}
}
