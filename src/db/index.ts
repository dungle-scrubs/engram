import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { ensureParentDir, resolveDbPath } from "./paths.js";

/** Drizzle client bundle with raw SQLite handle and absolute DB path. */
export interface EngramDb {
	readonly db: ReturnType<typeof drizzle>;
	readonly dbPath: string;
	readonly sqlite: Database;
}

/**
 * Create an engram database client.
 *
 * @returns Drizzle + SQLite handles
 */
export function createEngramDb(): EngramDb {
	const dbPath = resolveDbPath();
	ensureParentDir(dbPath);
	const sqlite = new Database(dbPath, { create: true, strict: true });
	sqlite.exec("PRAGMA journal_mode = WAL;");
	sqlite.exec("PRAGMA synchronous = NORMAL;");
	const db = drizzle(sqlite);
	return { db, dbPath, sqlite };
}
