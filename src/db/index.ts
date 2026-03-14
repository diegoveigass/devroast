import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

declare global {
  var __devroastPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  return new Pool({
    connectionString,
  });
}

const pool = globalThis.__devroastPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.__devroastPool = pool;
}

export const db = drizzle(pool, {
  schema,
  casing: "snake_case",
});

export { pool };
