import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { roastModeEnum, submissionStatusEnum } from "./enums";

export const submissions = pgTable("submissions", {
  id: uuid().defaultRandom().primaryKey(),
  publicId: varchar({ length: 64 }).notNull().unique(),
  status: submissionStatusEnum().notNull().default("pending"),
  roastMode: roastModeEnum().notNull().default("full_roast"),
  source: varchar({ length: 32 }).notNull().default("web"),
  language: varchar({ length: 64 }),
  originalCode: text().notNull(),
  codeHash: varchar({ length: 64 }).notNull(),
  lineCount: integer().notNull(),
  isPublic: boolean().notNull().default(true),
  processingError: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
