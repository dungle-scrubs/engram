import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const CLI_PATH = resolve(import.meta.dir, "../src/cli.ts");

/** Result payload for a single CLI invocation. */
interface CliRunResult {
	readonly code: number;
	readonly stderr: string;
	readonly stdout: string;
}

/**
 * Run the engram CLI with arguments and optional environment overrides.
 *
 * @param args - CLI arguments after the script path
 * @param envOverrides - Environment variables merged over process env
 * @returns Captured exit code, stdout, and stderr strings
 */
function runCli(
	args: readonly string[],
	envOverrides: Readonly<Record<string, string>> = {},
): CliRunResult {
	const result = Bun.spawnSync({
		cmd: ["bun", "run", CLI_PATH, ...args],
		env: {
			...process.env,
			...envOverrides,
		},
		stderr: "pipe",
		stdout: "pipe",
	});

	const decoder = new TextDecoder();
	return {
		code: result.exitCode ?? 1,
		stderr: decoder.decode(result.stderr).trim(),
		stdout: decoder.decode(result.stdout).trim(),
	};
}

describe("cli contract", () => {
	test("paths prints resolved JSON paths", () => {
		const rootPath = mkdtempSync(join(tmpdir(), "engram-cli-paths-"));

		try {
			const dataDir = join(rootPath, "data");
			const dbPath = join(rootPath, "db", "engram.sqlite");
			const result = runCli(["paths"], {
				ENGRAM_DATA_DIR: dataDir,
				ENGRAM_DB_PATH: dbPath,
			});

			expect(result.code).toBe(0);
			const payload = JSON.parse(result.stdout) as {
				readonly dataDir: string;
				readonly dbPath: string;
			};
			expect(payload).toEqual({
				dataDir: resolve(dataDir),
				dbPath: resolve(dbPath),
			});
		} finally {
			rmSync(rootPath, { force: true, recursive: true });
		}
	});

	test("init-db creates database at configured path", () => {
		const rootPath = mkdtempSync(join(tmpdir(), "engram-cli-init-"));

		try {
			const dbPath = join(rootPath, "nested", "engram.sqlite");
			const result = runCli(["init-db"], { ENGRAM_DB_PATH: dbPath });

			expect(result.code).toBe(0);
			expect(existsSync(resolve(dbPath))).toBe(true);
			expect(result.stdout).toContain("Initialized schema at");
			expect(result.stdout).toContain(resolve(dbPath));
		} finally {
			rmSync(rootPath, { force: true, recursive: true });
		}
	});

	test("verify-backup returns non-zero for a snapshot without manifest", () => {
		const rootPath = mkdtempSync(join(tmpdir(), "engram-cli-verify-"));

		try {
			const snapshotPath = join(rootPath, "snapshot");
			mkdirSync(snapshotPath, { recursive: true });
			const result = runCli(["verify-backup", "--path", snapshotPath]);

			expect(result.code).toBe(1);
			const payload = JSON.parse(result.stdout) as {
				readonly mismatches: readonly string[];
				readonly ok: boolean;
			};
			expect(payload.ok).toBe(false);
			expect(payload.mismatches).toEqual(["manifest.json missing"]);
		} finally {
			rmSync(rootPath, { force: true, recursive: true });
		}
	});

	test("backup and verify-backup succeed for initialized storage", () => {
		const rootPath = mkdtempSync(join(tmpdir(), "engram-cli-backup-"));

		try {
			const dataDir = join(rootPath, "data");
			const dbPath = join(dataDir, "engram.sqlite");
			const backupRoot = join(rootPath, "backups");
			const env = {
				ENGRAM_DATA_DIR: dataDir,
				ENGRAM_DB_PATH: dbPath,
			};

			const initResult = runCli(["init-db"], env);
			expect(initResult.code).toBe(0);

			const backupResult = runCli(["backup", "--to", backupRoot], env);
			expect(backupResult.code).toBe(0);
			expect(backupResult.stdout).toContain("Created snapshot:");

			const snapshotDir = backupResult.stdout
				.replace("Created snapshot:", "")
				.trim();
			const verifyResult = runCli(
				["verify-backup", "--path", snapshotDir],
				env,
			);

			expect(verifyResult.code).toBe(0);
			const payload = JSON.parse(verifyResult.stdout) as {
				readonly mismatches: readonly string[];
				readonly ok: boolean;
			};
			expect(payload.ok).toBe(true);
			expect(payload.mismatches).toEqual([]);
		} finally {
			rmSync(rootPath, { force: true, recursive: true });
		}
	});

	test("scorecard rejects invalid date format with non-zero exit", () => {
		const rootPath = mkdtempSync(join(tmpdir(), "engram-cli-scorecard-"));

		try {
			const dbPath = join(rootPath, "engram.sqlite");
			const result = runCli(["scorecard", "--date", "bad-date"], {
				ENGRAM_DB_PATH: dbPath,
			});

			expect(result.code).toBe(1);
			expect(result.stderr).toContain("Invalid UTC date format: bad-date");
		} finally {
			rmSync(rootPath, { force: true, recursive: true });
		}
	});
});
