#!/usr/bin/env node

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
 * Build an ISO UTC date string for today.
 *
 * @returns Date string in `YYYY-MM-DD` format
 */
function getUtcDateString(): string {
	return new Date().toISOString().slice(0, 10);
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
		.version("0.1.0");

	program
		.command("init-db")
		.description("Create the SQLite database and required tables")
		.action(() => {
			const { dbPath, sqlite } = createEngramDb();
			initializeSchema(sqlite);
			sqlite.close();
			console.log(`Initialized schema at ${dbPath}`);
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
			const scorecard = buildDailyScorecard(sqlite, options.date);
			sqlite.close();
			console.log(JSON.stringify(scorecard, null, 2));
		});

	program
		.command("backup")
		.description("Create a timestamped snapshot with checksum manifest")
		.requiredOption("--to <directory>", "Backup destination root directory")
		.action((options: { readonly to: string }) => {
			const snapshotDir = createBackupSnapshot(options.to);
			console.log(`Created snapshot: ${snapshotDir}`);
		});

	program
		.command("verify-backup")
		.description("Verify checksum integrity of an existing snapshot")
		.requiredOption("--path <snapshotDir>", "Snapshot directory path")
		.action((options: { readonly path: string }) => {
			const result = verifyBackupSnapshot(options.path);
			console.log(JSON.stringify(result, null, 2));
			if (!result.ok) {
				process.exitCode = 1;
			}
		});

	await program.parseAsync(process.argv);
}

await main();
