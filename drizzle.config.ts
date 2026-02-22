import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dbCredentials: {
		url: "./data/engram.sqlite",
	},
	dialect: "sqlite",
	out: "./src/db/migrations",
	schema: "./src/db/schema.ts",
	strict: true,
	verbose: true,
});
