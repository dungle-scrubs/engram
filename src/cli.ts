#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { createEngramDb } from "./db/index.js";
import { initializeSchema } from "./db/init.js";
import { resolveDataDir, resolveDbPath } from "./db/paths.js";
import { buildDailyScorecard } from "./runner/scorecard.js";
import {
	createBackupSnapshot,
	verifyBackupSnapshot,
} from "./storage/backup.js";

/**
 * Read the package version from the nearest `package.json`.
 *
 * @returns Semver version string
 */
function readPackageVersion(): string {
	const packagePath = resolve(import.meta.dirname ?? ".", "../package.json");
	const packageJson = JSON.parse(readFileSync(packagePath, "utf-8")) as {
		readonly version: string;
	};
	return packageJson.version;
}

/**
 * Build an ISO UTC date string for today.
 *
 * @returns Date string in `YYYY-MM-DD` format
 */
function getUtcDateString(): string {
	return new Date().toISOString().slice(0, 10);
}

/**
 * Print an error message and mark the command as failed.
 *
 * @param error - Unknown error thrown during command execution
 * @returns Nothing
 */
function failCommand(error: unknown): void {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exitCode = 1;
}

/**
 * Run the CLI program.
 *
 * @returns Promise resolving when command execution completes
 */
async function main(): Promise<void> {
	const program = new Command();

	program
		.name("engram")
		.description("Cheap-first eval runner + durable result store")
		.version(readPackageVersion());

	program
		.command("init-db")
		.description("Create the SQLite database and required tables")
		.action(() => {
			const { dbPath, sqlite } = createEngramDb();
			try {
				initializeSchema(sqlite);
				console.log(`Initialized schema at ${dbPath}`);
			} catch (error: unknown) {
				failCommand(error);
			} finally {
				sqlite.close();
			}
		});

	program
		.command("paths")
		.description("Print resolved storage paths")
		.action(() => {
			console.log(
				JSON.stringify(
					{ dataDir: resolveDataDir(), dbPath: resolveDbPath() },
					null,
					2,
				),
			);
		});

	program
		.command("scorecard")
		.description("Show aggregate daily metrics from stored results")
		.option("--date <yyyy-mm-dd>", "UTC date", getUtcDateString())
		.action((options: { readonly date: string }) => {
			const { sqlite } = createEngramDb();
			try {
				const scorecard = buildDailyScorecard(sqlite, options.date);
				console.log(JSON.stringify(scorecard, null, 2));
			} catch (error: unknown) {
				failCommand(error);
			} finally {
				sqlite.close();
			}
		});

	program
		.command("backup")
		.description("Create a timestamped snapshot with checksum manifest")
		.requiredOption("--to <directory>", "Backup destination root directory")
		.action((options: { readonly to: string }) => {
			try {
				const snapshotDir = createBackupSnapshot(options.to);
				console.log(`Created snapshot: ${snapshotDir}`);
			} catch (error: unknown) {
				failCommand(error);
			}
		});

	program
		.command("verify-backup")
		.description("Verify checksum integrity of an existing snapshot")
		.requiredOption("--path <snapshotDir>", "Snapshot directory path")
		.action((options: { readonly path: string }) => {
			try {
				const result = verifyBackupSnapshot(options.path);
				console.log(JSON.stringify(result, null, 2));
				if (!result.ok) {
					process.exitCode = 1;
				}
			} catch (error: unknown) {
				failCommand(error);
			}
		});

	await program.parseAsync(process.argv);
}

await main();
