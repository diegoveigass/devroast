import { pgEnum } from "drizzle-orm/pg-core";

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const roastModeEnum = pgEnum("roast_mode", ["honest", "full_roast"]);

export const roastVerdictEnum = pgEnum("roast_verdict", [
  "needs_serious_help",
  "rough",
  "salvageable",
  "solid",
]);

export const issueSeverityEnum = pgEnum("issue_severity", [
  "critical",
  "warning",
  "good",
]);

export const diffLineTypeEnum = pgEnum("diff_line_type", [
  "context",
  "removed",
  "added",
]);

export type SubmissionStatus = (typeof submissionStatusEnum.enumValues)[number];
export type RoastMode = (typeof roastModeEnum.enumValues)[number];
export type RoastVerdict = (typeof roastVerdictEnum.enumValues)[number];
export type IssueSeverity = (typeof issueSeverityEnum.enumValues)[number];
export type DiffLineType = (typeof diffLineTypeEnum.enumValues)[number];
