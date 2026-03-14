import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { diffLineTypeEnum } from "./enums";
import { submissions } from "./submissions";

export const roastDiffLines = pgTable(
  "roast_diff_lines",
  {
    id: uuid().defaultRandom().primaryKey(),
    submissionId: uuid()
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    lineType: diffLineTypeEnum().notNull(),
    content: text().notNull(),
    position: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("roast_diff_lines_submission_position_idx").on(
      table.submissionId,
      table.position,
    ),
  ],
);
