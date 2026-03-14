import "dotenv/config";

import { defineConfig } from "drizzle-kit";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: {
    url: getRequiredEnv("DATABASE_URL"),
  },
  introspect: {
    casing: "camel",
  },
  verbose: true,
  strict: true,
});
