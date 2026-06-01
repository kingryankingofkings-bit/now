import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@db/schema";
import * as relations from "@db/relations";
import { mkdirSync } from "fs";
import { dirname } from "path";

const fullSchema = { ...schema, ...relations };

const DB_PATH = process.env.DATABASE_URL?.replace("sqlite:", "") || "./data/mdk.db";

// Ensure data directory exists
try {
  mkdirSync(dirname(DB_PATH), { recursive: true });
} catch {
  // directory may already exist
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema: fullSchema });
