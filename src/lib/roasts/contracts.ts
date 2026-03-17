import { z } from "zod";

export const roastModeSchema = z.enum(["honest", "full_roast"]);

export const roastVerdictSchema = z.enum([
  "needs_serious_help",
  "rough",
  "salvageable",
  "solid",
]);

export const roastIssueSeveritySchema = z.enum(["critical", "warning", "good"]);
export const roastDiffLineTypeSchema = z.enum(["context", "removed", "added"]);

export const roastIssueSchema = z.object({
  severity: roastIssueSeveritySchema,
  title: z.string().min(1),
  description: z.string().min(1),
});

export const roastDiffLineSchema = z.object({
  lineType: roastDiffLineTypeSchema,
  content: z.string(),
});

export const roastProviderOutputSchema = z.object({
  score: z.number().min(0).max(10),
  verdict: roastVerdictSchema,
  headline: z.string().min(1),
  summary: z.string().min(1),
  issues: z.array(roastIssueSchema),
  diffLines: z.array(roastDiffLineSchema),
});

export const PROVIDER_TIMEOUT_CODE = "PROVIDER_TIMEOUT" as const;
export const PROVIDER_UNAVAILABLE_CODE = "PROVIDER_UNAVAILABLE" as const;
export const INVALID_PROVIDER_OUTPUT_CODE = "INVALID_PROVIDER_OUTPUT" as const;
export const PERSISTENCE_ERROR_CODE = "PERSISTENCE_ERROR" as const;
export const RESULT_NOT_FOUND_CODE = "RESULT_NOT_FOUND" as const;

export const roastDomainErrorCodeSchema = z.enum([
  PROVIDER_TIMEOUT_CODE,
  PROVIDER_UNAVAILABLE_CODE,
  INVALID_PROVIDER_OUTPUT_CODE,
  PERSISTENCE_ERROR_CODE,
  RESULT_NOT_FOUND_CODE,
]);

export type RoastMode = z.infer<typeof roastModeSchema>;
export type RoastProviderOutput = z.infer<typeof roastProviderOutputSchema>;
export type RoastDomainErrorCode = z.infer<typeof roastDomainErrorCodeSchema>;

type RoastDomainErrorInit = {
  cause?: unknown;
  submissionId?: string;
};

export class RoastDomainError extends Error {
  readonly code: RoastDomainErrorCode;
  readonly submissionId?: string;

  constructor(
    code: RoastDomainErrorCode,
    message: string,
    { cause, submissionId }: RoastDomainErrorInit = {},
  ) {
    super(message, { cause });
    this.name = "RoastDomainError";
    this.code = code;
    this.submissionId = submissionId;
  }
}
