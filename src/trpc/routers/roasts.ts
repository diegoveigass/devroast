import { z } from "zod";

import {
  createRoastSubmission,
  getRoastBySubmissionId,
  markRoastSubmissionFailed,
  persistRoastArtifacts,
} from "@/db/queries/roasts";
import { runRoastAnalysis } from "@/lib/roasts/analysis";
import {
  INVALID_PROVIDER_OUTPUT_CODE,
  PERSISTENCE_ERROR_CODE,
  PROVIDER_TIMEOUT_CODE,
  PROVIDER_UNAVAILABLE_CODE,
  RESULT_NOT_FOUND_CODE,
  RoastDomainError,
  roastDiffLineSchema,
  roastIssueSchema,
  roastModeSchema,
  roastVerdictSchema,
} from "@/lib/roasts/contracts";
import { resolveOpenAIModel } from "@/lib/roasts/providers/openai-provider";

import { publicProcedure, router } from "../init";

const REDACTED_TOKEN = "[REDACTED]";
const PERSISTENCE_ERROR_MESSAGE = "Unable to persist roast results.";
const FAILED_STATE_PERSISTENCE_MESSAGE =
  "Failed to persist failed submission state.";
const CREATE_SUBMISSION_ERROR_CODES = [
  PROVIDER_TIMEOUT_CODE,
  PROVIDER_UNAVAILABLE_CODE,
  INVALID_PROVIDER_OUTPUT_CODE,
  PERSISTENCE_ERROR_CODE,
] as const;
type CreateSubmissionErrorCode = (typeof CREATE_SUBMISSION_ERROR_CODES)[number];

const createSubmissionInputSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  roastMode: roastModeSchema,
  source: z.string().min(1).optional().default("web"),
});

const completedSubmissionSchema = z.object({
  code: z.string(),
  diffLines: z.array(
    roastDiffLineSchema.extend({ position: z.number().int().min(1) }),
  ),
  headline: z.string(),
  issues: z.array(
    roastIssueSchema.extend({ position: z.number().int().min(1) }),
  ),
  language: z.string().nullable(),
  lineCount: z.number().int().min(1),
  publicId: z.string(),
  roastMode: roastModeSchema,
  score: z.number().min(0).max(10),
  status: z.literal("completed"),
  submissionId: z.string().uuid(),
  summary: z.string(),
  verdict: roastVerdictSchema,
});

const processingSubmissionSchema = z.object({
  status: z.literal("processing"),
});

const failedSubmissionSchema = z.object({
  processingError: z.string(),
  status: z.literal("failed"),
});

const resultNotFoundSchema = z.object({
  code: z.literal(RESULT_NOT_FOUND_CODE),
  message: z.string(),
});

const createSubmissionSuccessSchema = z.object({
  publicId: z.string(),
  status: z.literal("completed"),
  submissionId: z.string().uuid(),
});

const createSubmissionErrorSchema = z.object({
  code: z.enum([...CREATE_SUBMISSION_ERROR_CODES]),
  message: z.string(),
  submissionId: z.string().uuid().optional(),
});

const createSubmissionOutputSchema = z.union([
  createSubmissionSuccessSchema,
  createSubmissionErrorSchema,
]);

const getBySubmissionIdOutputSchema = z.union([
  completedSubmissionSchema,
  failedSubmissionSchema,
  processingSubmissionSchema,
  resultNotFoundSchema,
]);

type CreateRoastsRouterDependencies = {
  createSubmissionRecord?: typeof createRoastSubmission;
  getSubmissionById?: typeof getRoastBySubmissionId;
  markSubmissionFailed?: typeof markRoastSubmissionFailed;
  persistAnalysis?: typeof persistRoastArtifacts;
  resolveProviderModel?: typeof resolveOpenAIModel;
  runAnalysis?: typeof runRoastAnalysis;
};

function sanitizeErrorMessage(message: string) {
  return message
    .replaceAll(/sk-[a-zA-Z0-9_-]+/g, REDACTED_TOKEN)
    .replaceAll(/Bearer\s+[a-zA-Z0-9._-]+/gi, `Bearer ${REDACTED_TOKEN}`)
    .replaceAll(
      /OPENAI_API_KEY\s*=\s*\S+/gi,
      `OPENAI_API_KEY=${REDACTED_TOKEN}`,
    );
}

function isCreateSubmissionErrorCode(
  code: RoastDomainError["code"],
): code is CreateSubmissionErrorCode {
  return CREATE_SUBMISSION_ERROR_CODES.some((value) => value === code);
}

function withFailureStatePersistenceMessage(message: string) {
  return `${message} ${FAILED_STATE_PERSISTENCE_MESSAGE}`;
}

function toCreateSubmissionError(error: unknown, submissionId?: string) {
  if (error instanceof RoastDomainError) {
    if (error.code === PERSISTENCE_ERROR_CODE) {
      return {
        code: PERSISTENCE_ERROR_CODE,
        message: PERSISTENCE_ERROR_MESSAGE,
        submissionId: error.submissionId ?? submissionId,
      };
    }

    if (!isCreateSubmissionErrorCode(error.code)) {
      return {
        code: PERSISTENCE_ERROR_CODE,
        message: PERSISTENCE_ERROR_MESSAGE,
        submissionId: error.submissionId ?? submissionId,
      };
    }

    return {
      code: error.code as CreateSubmissionErrorCode,
      message: sanitizeErrorMessage(error.message),
      submissionId: error.submissionId ?? submissionId,
    };
  }

  return {
    code: PERSISTENCE_ERROR_CODE,
    message: PERSISTENCE_ERROR_MESSAGE,
    submissionId,
  };
}

export function createRoastsRouter(
  dependencies: CreateRoastsRouterDependencies = {},
) {
  const createSubmissionRecord =
    dependencies.createSubmissionRecord ?? createRoastSubmission;
  const getSubmissionById =
    dependencies.getSubmissionById ?? getRoastBySubmissionId;
  const markSubmissionFailed =
    dependencies.markSubmissionFailed ?? markRoastSubmissionFailed;
  const persistAnalysis = dependencies.persistAnalysis ?? persistRoastArtifacts;
  const resolveProviderModel =
    dependencies.resolveProviderModel ?? resolveOpenAIModel;
  const runAnalysis = dependencies.runAnalysis ?? runRoastAnalysis;

  return router({
    createSubmission: publicProcedure
      .input(createSubmissionInputSchema)
      .output(createSubmissionOutputSchema)
      .mutation(async ({ input }) => {
        let submission: Awaited<
          ReturnType<typeof createSubmissionRecord>
        > | null = null;

        try {
          submission = await createSubmissionRecord(input);

          const analysis = await runAnalysis({
            code: input.code,
            language: input.language,
            lineCount: input.code.split("\n").length,
            roastMode: input.roastMode,
          });

          await persistAnalysis({
            analysis,
            language: input.language,
            provider: "openai",
            providerModel: resolveProviderModel(),
            submissionId: submission.id,
          });

          return {
            publicId: submission.publicId,
            status: "completed" as const,
            submissionId: submission.id,
          };
        } catch (error) {
          const mappedError = toCreateSubmissionError(error, submission?.id);

          if (submission) {
            try {
              await markSubmissionFailed(
                submission.id,
                sanitizeErrorMessage(mappedError.message),
              );
            } catch {
              mappedError.message = withFailureStatePersistenceMessage(
                mappedError.message,
              );
            }
          }

          return mappedError;
        }
      }),
    getBySubmissionId: publicProcedure
      .input(z.object({ submissionId: z.string().uuid() }))
      .output(getBySubmissionIdOutputSchema)
      .query(async ({ input }) => {
        const submission = await getSubmissionById(input.submissionId);

        if (!submission) {
          return {
            code: RESULT_NOT_FOUND_CODE,
            message: `Roast result for submission ${input.submissionId} was not found.`,
          };
        }

        if (submission.status === "processing") {
          return { status: "processing" as const };
        }

        if ("processingError" in submission) {
          return {
            processingError:
              submission.processingError ??
              "Unexpected roast processing failure.",
            status: "failed" as const,
          };
        }

        return {
          code: submission.originalCode,
          diffLines: submission.diffLines,
          headline: submission.headline,
          issues: submission.issues,
          language: submission.language,
          lineCount: submission.lineCount,
          publicId: submission.publicId,
          roastMode: submission.roastMode,
          score: Number.parseFloat(String(submission.score)),
          status: "completed" as const,
          submissionId: submission.submissionId,
          summary: submission.summary,
          verdict: submission.verdict,
        };
      }),
  });
}

export const roastsRouter = createRoastsRouter();
