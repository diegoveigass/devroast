import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { issueSeverityEnum } from "./enums";
import { submissions } from "./submissions";

export const roastIssues = pgTable(
  "roast_issues",
  {
    id: uuid().defaultRandom().primaryKey(),
    submissionId: uuid()
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    severity: issueSeverityEnum().notNull(),
    title: text().notNull(),
    description: text().notNull(),
    position: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("roast_issues_submission_position_idx").on(
      table.submissionId,
      table.position,
    ),
  ],
);
