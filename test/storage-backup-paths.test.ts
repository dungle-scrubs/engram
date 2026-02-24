import { afterEach, describe, expect, test } from "bun:test";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
	ensureParentDir,
	expandHomePath,
	resolveDataDir,
	resolveDbPath,
} from "../src/db/paths.js";
import {
	createBackupSnapshot,
	verifyBackupSnapshot,
} from "../src/storage/backup.js";

const originalDataDir = process.env.ENGRAM_DATA_DIR;
const originalDbPath = process.env.ENGRAM_DB_PATH;

afterEach(() => {
	if (originalDataDir === undefined) {
		delete process.env.ENGRAM_DATA_DIR;
	} else {
		process.env.ENGRAM_DATA_DIR = originalDataDir;
	}

	if (originalDbPath === undefined) {
		delete process.env.ENGRAM_DB_PATH;
	} else {
		process.env.ENGRAM_DB_PATH = originalDbPath;
	}
});

describe("path resolution", () => {
	test("expands leading home shorthand", () => {
		expect(expandHomePath("~/engram-path-test")).toBe(
			join(homedir(), "engram-path-test"),
		);
	});

	test("resolves data and db paths from environment overrides", () => {
		process.env.ENGRAM_DATA_DIR = "~/engram-custom-data";
		process.env.ENGRAM_DB_PATH = "~/engram-custom-db/custom.sqlite";

		expect(resolveDataDir()).toBe(
			resolve(join(homedir(), "engram-custom-data")),
		);
		expect(resolveDbPath()).toBe(
			resolve(join(homedir(), "engram-custom-db", "custom.sqlite")),
		);
	});

	test("creates missing parent directories", () => {
		const rootPath = mkdtempSync(join(tmpdir(), "engram-paths-"));

		try {
			const filePath = join(rootPath, "a", "b", "c", "db.sqlite");
			ensureParentDir(filePath);
			expect(existsSync(dirname(filePath))).toBe(true);
		} finally {
			rmSync(rootPath, { force: true, recursive: true });
		}
	});
});

describe("backup snapshots", () => {
	test("creates and verifies a snapshot with checksum manifest", () => {
		const rootPath = mkdtempSync(join(tmpdir(), "engram-backup-"));

		try {
			const dataDir = join(rootPath, "data");
			const backupDir = join(rootPath, "backups");
			const dbPath = join(dataDir, "engram.sqlite");

			process.env.ENGRAM_DATA_DIR = dataDir;
			process.env.ENGRAM_DB_PATH = dbPath;

			mkdirSync(join(dataDir, "artifacts"), { recursive: true });
			mkdirSync(join(dataDir, "parquet"), { recursive: true });
			writeFileSync(dbPath, "sqlite-placeholder");
			writeFileSync(join(dataDir, "artifacts", "artifact-1.txt"), "artifact");
			writeFileSync(join(dataDir, "parquet", "batch-1.parquet"), "parquet");

			const snapshotDir = createBackupSnapshot(backupDir);
			expect(existsSync(join(snapshotDir, "manifest.json"))).toBe(true);

			const verified = verifyBackupSnapshot(snapshotDir);
			expect(verified.ok).toBe(true);
			expect(verified.mismatches.length).toBe(0);

			writeFileSync(join(snapshotDir, "engram.sqlite"), "tampered");
			const tampered = verifyBackupSnapshot(snapshotDir);
			expect(tampered.ok).toBe(false);
			expect(
				tampered.mismatches.some((message) =>
					message.includes("engram.sqlite: checksum mismatch"),
				),
			).toBe(true);
		} finally {
			rmSync(rootPath, { force: true, recursive: true });
		}
	});

	test("throws when creating a snapshot without an existing database", () => {
		const rootPath = mkdtempSync(join(tmpdir(), "engram-backup-missing-db-"));

		try {
			const dataDir = join(rootPath, "data");
			const dbPath = join(dataDir, "engram.sqlite");
			const backupDir = join(rootPath, "backups");

			process.env.ENGRAM_DATA_DIR = dataDir;
			process.env.ENGRAM_DB_PATH = dbPath;

			expect(() => createBackupSnapshot(backupDir)).toThrow();
		} finally {
			rmSync(rootPath, { force: true, recursive: true });
		}
	});

	test("reports missing files that are listed in the manifest", () => {
		const rootPath = mkdtempSync(join(tmpdir(), "engram-backup-missing-file-"));

		try {
			const dataDir = join(rootPath, "data");
			const backupDir = join(rootPath, "backups");
			const dbPath = join(dataDir, "engram.sqlite");

			process.env.ENGRAM_DATA_DIR = dataDir;
			process.env.ENGRAM_DB_PATH = dbPath;

			mkdirSync(join(dataDir, "artifacts"), { recursive: true });
			writeFileSync(dbPath, "sqlite-placeholder");
			writeFileSync(join(dataDir, "artifacts", "artifact-1.txt"), "artifact");

			const snapshotDir = createBackupSnapshot(backupDir);
			rmSync(join(snapshotDir, "artifacts", "artifact-1.txt"), {
				force: true,
			});

			const result = verifyBackupSnapshot(snapshotDir);
			expect(result.ok).toBe(false);
			expect(result.mismatches).toContain("artifacts/artifact-1.txt: missing");
		} finally {
			rmSync(rootPath, { force: true, recursive: true });
		}
	});

	test("returns a clear failure when manifest.json is invalid", () => {
		const rootPath = mkdtempSync(
			join(tmpdir(), "engram-backup-invalid-manifest-"),
		);

		try {
			writeFileSync(join(rootPath, "manifest.json"), "{ invalid json }");
			const result = verifyBackupSnapshot(rootPath);
			expect(result.ok).toBe(false);
			expect(result.mismatches).toEqual(["manifest.json invalid"]);
		} finally {
			rmSync(rootPath, { force: true, recursive: true });
		}
	});

	test("returns a clear failure when manifest.json is missing", () => {
		const rootPath = mkdtempSync(join(tmpdir(), "engram-backup-no-manifest-"));

		try {
			const result = verifyBackupSnapshot(rootPath);
			expect(result.ok).toBe(false);
			expect(result.mismatches).toEqual(["manifest.json missing"]);
		} finally {
			rmSync(rootPath, { force: true, recursive: true });
		}
	});
});
