import { createHash } from "node:crypto";
import {
	copyFileSync,
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { resolveDataDir, resolveDbPath } from "../db/paths.js";

/** Hash manifest entry for a file captured in a backup snapshot. */
interface BackupManifestFile {
	readonly bytes: number;
	readonly path: string;
	readonly sha256: string;
}

/** Backup snapshot manifest persisted alongside copied files. */
interface BackupManifest {
	readonly createdAt: string;
	readonly files: BackupManifestFile[];
	readonly sourceDataDir: string;
	readonly sourceDbPath: string;
}

/**
 * Compute SHA-256 for a file.
 *
 * @param filePath - Absolute file path
 * @returns Hex digest string
 */
function hashFile(filePath: string): string {
	const hash = createHash("sha256");
	hash.update(readFileSync(filePath));
	return hash.digest("hex");
}

/**
 * Recursively list all files in a directory.
 *
 * @param rootPath - Root directory path
 * @returns Absolute file paths
 */
function listFiles(rootPath: string): string[] {
	const output: string[] = [];
	for (const entry of readdirSync(rootPath)) {
		const entryPath = join(rootPath, entry);
		const entryStats = statSync(entryPath);
		if (entryStats.isDirectory()) {
			output.push(...listFiles(entryPath));
			continue;
		}
		output.push(entryPath);
	}
	return output;
}

/**
 * Create a snapshot backup directory with checksum manifest.
 *
 * @param destinationRoot - Destination root directory
 * @returns Absolute snapshot directory path
 * @throws Error when source database is missing
 */
export function createBackupSnapshot(destinationRoot: string): string {
	const sourceDbPath = resolveDbPath();
	if (!existsSync(sourceDbPath)) {
		throw new Error(`Database does not exist: ${sourceDbPath}`);
	}

	const sourceDataDir = resolveDataDir();
	const snapshotName = `snapshot-${new Date().toISOString().replaceAll(":", "-")}`;
	const snapshotDir = resolve(join(destinationRoot, snapshotName));
	mkdirSync(snapshotDir, { recursive: true });

	const copiedDbPath = join(snapshotDir, basename(sourceDbPath));
	copyFileSync(sourceDbPath, copiedDbPath);

	const sourceArtifactsDir = join(sourceDataDir, "artifacts");
	if (existsSync(sourceArtifactsDir)) {
		cpSync(sourceArtifactsDir, join(snapshotDir, "artifacts"), {
			recursive: true,
		});
	}

	const sourceParquetDir = join(sourceDataDir, "parquet");
	if (existsSync(sourceParquetDir)) {
		cpSync(sourceParquetDir, join(snapshotDir, "parquet"), { recursive: true });
	}

	const files = listFiles(snapshotDir)
		.filter((filePath) => !filePath.endsWith("manifest.json"))
		.map((filePath) => ({
			bytes: statSync(filePath).size,
			path: relative(snapshotDir, filePath),
			sha256: hashFile(filePath),
		}));

	const manifest: BackupManifest = {
		createdAt: new Date().toISOString(),
		files,
		sourceDataDir,
		sourceDbPath,
	};

	writeFileSync(
		join(snapshotDir, "manifest.json"),
		`${JSON.stringify(manifest, null, 2)}\n`,
	);
	return snapshotDir;
}

/**
 * Verify checksum integrity for a backup snapshot.
 *
 * @param snapshotDir - Snapshot directory containing `manifest.json`
 * @returns Object containing validity and mismatch paths
 */
export function verifyBackupSnapshot(snapshotDir: string): {
	readonly mismatches: string[];
	readonly ok: boolean;
} {
	const manifestPath = join(snapshotDir, "manifest.json");
	if (!existsSync(manifestPath)) {
		return { mismatches: ["manifest.json missing"], ok: false };
	}

	const manifest = JSON.parse(
		readFileSync(manifestPath, "utf-8"),
	) as BackupManifest;
	const mismatches: string[] = [];

	for (const file of manifest.files) {
		const absoluteFilePath = join(snapshotDir, file.path);
		if (!existsSync(absoluteFilePath)) {
			mismatches.push(`${file.path}: missing`);
			continue;
		}
		const actualHash = hashFile(absoluteFilePath);
		if (actualHash !== file.sha256) {
			mismatches.push(`${file.path}: checksum mismatch`);
		}
	}

	return { mismatches, ok: mismatches.length === 0 };
}
