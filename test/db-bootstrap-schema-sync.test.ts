import { Database } from "bun:sqlite";
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { getTableColumns } from "drizzle-orm";
import { createEngramDb } from "../src/db/index.js";
import { initializeSchema } from "../src/db/init.js";
import {
	artifactsTable,
	datasetsTable,
	promptsTable,
	resultsTable,
	runsTable,
} from "../src/db/schema.js";

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

describe("createEngramDb", () => {
	test("creates parent directories and applies pragma settings", () => {
		const rootPath = mkdtempSync(join(tmpdir(), "engram-db-bootstrap-"));

		try {
			const dbPath = join(rootPath, "nested", "state", "engram.sqlite");
			process.env.ENGRAM_DB_PATH = dbPath;

			const { dbPath: resolvedDbPath, sqlite } = createEngramDb();
			try {
				expect(resolvedDbPath).toBe(resolve(dbPath));
				expect(existsSync(resolve(dbPath))).toBe(true);
				expect(existsSync(dirname(resolve(dbPath)))).toBe(true);

				const journalMode = sqlite.query("PRAGMA journal_mode;").get() as {
					readonly journal_mode: string;
				};
				expect(journalMode.journal_mode.toLowerCase()).toBe("wal");

				const synchronous = sqlite.query("PRAGMA synchronous;").get() as {
					readonly synchronous: number;
				};
				expect(synchronous.synchronous).toBe(1);
			} finally {
				sqlite.close();
			}
		} finally {
			rmSync(rootPath, { force: true, recursive: true });
		}
	});
});

/** SQLite PRAGMA table_info row shape. */
interface TableInfoRow {
	readonly dflt_value: string | null;
	readonly name: string;
	readonly notnull: number;
	readonly pk: number;
	readonly type: string;
}

/** Map Drizzle column types to the SQLite type affinity used in raw DDL. */
const drizzleTypeToSqlite: Readonly<Record<string, string>> = {
	SQLiteBoolean: "INTEGER",
	SQLiteInteger: "INTEGER",
	SQLiteReal: "REAL",
	SQLiteText: "TEXT",
};

describe("schema synchronization", () => {
	test("keeps init SQL table columns aligned with drizzle schema", () => {
		const sqlite = new Database(":memory:", { strict: true });

		try {
			initializeSchema(sqlite);

			const schemaTables = [
				{ drizzle: artifactsTable, name: "artifacts" },
				{ drizzle: datasetsTable, name: "datasets" },
				{ drizzle: promptsTable, name: "prompts" },
				{ drizzle: resultsTable, name: "results" },
				{ drizzle: runsTable, name: "runs" },
			] as const;

			for (const table of schemaTables) {
				const drizzleColumns = getTableColumns(table.drizzle);
				const actualRows = sqlite
					.query(`PRAGMA table_info(${table.name})`)
					.all() as TableInfoRow[];
				const actualByName = new Map(actualRows.map((row) => [row.name, row]));

				const drizzleNames = Object.values(drizzleColumns)
					.map((col) => col.name)
					.sort();
				const actualNames = actualRows.map((row) => row.name).sort();
				expect(actualNames).toEqual(drizzleNames);

				for (const col of Object.values(drizzleColumns)) {
					const actual = actualByName.get(col.name);
					expect(actual).toBeDefined();
					if (!actual) continue;

					const expectedType =
						drizzleTypeToSqlite[col.columnType] ?? col.columnType;
					expect(actual.type).toBe(expectedType);

					if (!col.primary) {
						expect(actual.notnull).toBe(col.notNull ? 1 : 0);
					}

					if (col.hasDefault && col.default !== undefined) {
						expect(actual.dflt_value).toBe(String(col.default));
					}
				}
			}
		} finally {
			sqlite.close();
		}
	});
});
