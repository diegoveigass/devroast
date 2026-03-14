import {
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { roastVerdictEnum } from "./enums";
import { submissions } from "./submissions";

export const roastResults = pgTable("roast_results", {
  id: uuid().defaultRandom().primaryKey(),
  submissionId: uuid()
    .notNull()
    .unique()
    .references(() => submissions.id, { onDelete: "cascade" }),
  score: numeric({ precision: 3, scale: 1 }).notNull(),
  verdict: roastVerdictEnum().notNull(),
  headline: text().notNull(),
  summary: text().notNull(),
  languageLabel: varchar({ length: 64 }),
  shareSlug: varchar({ length: 128 }).notNull().unique(),
  provider: varchar({ length: 64 }),
  providerModel: varchar({ length: 128 }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
