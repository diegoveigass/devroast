import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { count, eq, like } from "drizzle-orm";

import { db } from "@/db";
import {
  roastDiffLines,
  roastIssues,
  roastResults,
  submissions,
} from "@/db/schema";
import {
  INVALID_PROVIDER_OUTPUT_CODE,
  PERSISTENCE_ERROR_CODE,
  PROVIDER_TIMEOUT_CODE,
  PROVIDER_UNAVAILABLE_CODE,
  RESULT_NOT_FOUND_CODE,
  RoastDomainError,
  type RoastProviderOutput,
} from "@/lib/roasts/contracts";
import { createTRPCContextInner } from "@/trpc/init";

import { createRoastsRouter } from "./roasts";

const TEST_CODE_PREFIX = "// trpc roasts test";

const ANALYSIS_OUTPUT: RoastProviderOutput = {
  score: 4.2,
  verdict: "rough",
  headline: "still somehow deployable",
  summary: "This code works, but only with emotional support.",
  issues: [
    {
      severity: "critical",
      title: "stateful spaghetti",
      description: "Too much mutable state leaks across the flow.",
    },
    {
      severity: "good",
      title: "clear function name",
      description: "At least the intent is readable at a glance.",
    },
  ],
  diffLines: [
    { lineType: "context", content: "function roast() {" },
    { lineType: "removed", content: "  var total = 0;" },
    { lineType: "added", content: "  const total = 0;" },
  ],
};

afterEach(async () => {
  await db
    .delete(submissions)
    .where(like(submissions.originalCode, `${TEST_CODE_PREFIX}%`));
});

function createTestCode(label: string) {
  return `${TEST_CODE_PREFIX} ${label}\nconsole.log("${label}");`;
}

function assertCreateCompleted(
  result: Awaited<
    ReturnType<Awaited<ReturnType<typeof createCaller>>["createSubmission"]>
  >,
): asserts result is {
  publicId: string;
  status: "completed";
  submissionId: string;
} {
  assert.ok("status" in result);
  assert.equal(result.status, "completed");
}

function assertCreateError(
  result: Awaited<
    ReturnType<Awaited<ReturnType<typeof createCaller>>["createSubmission"]>
  >,
): asserts result is {
  code:
    | typeof PROVIDER_UNAVAILABLE_CODE
    | typeof PROVIDER_TIMEOUT_CODE
    | typeof INVALID_PROVIDER_OUTPUT_CODE
    | typeof PERSISTENCE_ERROR_CODE;
  message: string;
  submissionId?: string;
} {
  assert.ok("code" in result);
}

function assertCompletedResult(
  result: Awaited<
    ReturnType<Awaited<ReturnType<typeof createCaller>>["getBySubmissionId"]>
  >,
): asserts result is {
  code: string;
  diffLines: Array<{
    content: string;
    lineType: "added" | "context" | "removed";
    position: number;
  }>;
  headline: string;
  issues: Array<{
    description: string;
    position: number;
    severity: "critical" | "good" | "warning";
    title: string;
  }>;
  language: string | null;
  lineCount: number;
  publicId: string;
  roastMode: "full_roast" | "honest";
  score: number;
  status: "completed";
  submissionId: string;
  summary: string;
  verdict: "needs_serious_help" | "rough" | "salvageable" | "solid";
} {
  assert.ok("status" in result);
  assert.equal(result.status, "completed");
}

function assertNotFoundResult(
  result: Awaited<
    ReturnType<Awaited<ReturnType<typeof createCaller>>["getBySubmissionId"]>
  >,
): asserts result is { code: typeof RESULT_NOT_FOUND_CODE; message: string } {
  assert.ok("code" in result);
  assert.equal(result.code, RESULT_NOT_FOUND_CODE);
}

async function createCaller(
  overrides: Parameters<typeof createRoastsRouter>[0] = {},
) {
  const router = createRoastsRouter(overrides);
  return router.createCaller(await createTRPCContextInner());
}

async function insertSubmissionRecord(
  values: Partial<typeof submissions.$inferInsert> & {
    originalCode: string;
    publicId: string;
  },
) {
  const [submission] = await db
    .insert(submissions)
    .values({
      codeHash: "hash",
      lineCount: values.originalCode.split("\n").length,
      roastMode: "honest",
      source: "web",
      status: "processing",
      ...values,
    })
    .returning({
      id: submissions.id,
      processingError: submissions.processingError,
      status: submissions.status,
    });

  return submission;
}

async function countArtifacts(submissionId: string) {
  const [resultRows, issueRows, diffRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(roastResults)
      .where(eq(roastResults.submissionId, submissionId)),
    db
      .select({ value: count() })
      .from(roastIssues)
      .where(eq(roastIssues.submissionId, submissionId)),
    db
      .select({ value: count() })
      .from(roastDiffLines)
      .where(eq(roastDiffLines.submissionId, submissionId)),
  ]);

  return {
    diffLines: diffRows[0]?.value ?? 0,
    issues: issueRows[0]?.value ?? 0,
    results: resultRows[0]?.value ?? 0,
  };
}

test("createSubmission success returns completed payload with UUID", async () => {
  const caller = await createCaller({
    runAnalysis: async () => ANALYSIS_OUTPUT,
  });

  const result = await caller.createSubmission({
    code: createTestCode("success"),
    language: "typescript",
    roastMode: "honest",
  });

  assertCreateCompleted(result);
  assert.match(result.submissionId, /^[0-9a-f-]{36}$/i);
  assert.match(result.publicId, /^sub_[a-z0-9]+$/);

  const stored = await caller.getBySubmissionId({
    submissionId: result.submissionId,
  });

  assertCompletedResult(stored);
  assert.equal(stored.language, "typescript");
  assert.equal(stored.score, ANALYSIS_OUTPUT.score);
});

test("manual language override persists and reads back", async () => {
  const caller = await createCaller({
    runAnalysis: async () => ANALYSIS_OUTPUT,
  });

  const created = await caller.createSubmission({
    code: createTestCode("manual-language"),
    language: "tsx",
    roastMode: "full_roast",
  });

  assertCreateCompleted(created);

  const result = await caller.getBySubmissionId({
    submissionId: created.submissionId,
  });

  assertCompletedResult(result);
  assert.equal(result.language, "tsx");
  assert.equal(result.roastMode, "full_roast");
});

test("getBySubmissionId returns processing", async () => {
  const submission = await insertSubmissionRecord({
    originalCode: createTestCode("processing"),
    publicId: "sub_processing_test",
    status: "processing",
  });

  const caller = await createCaller();
  const result = await caller.getBySubmissionId({
    submissionId: submission.id,
  });

  assert.deepEqual(result, { status: "processing" });
});

test("getBySubmissionId returns failed", async () => {
  const submission = await insertSubmissionRecord({
    originalCode: createTestCode("failed"),
    processingError: "Provider unavailable.",
    publicId: "sub_failed_test",
    status: "failed",
  });

  const caller = await createCaller();
  const result = await caller.getBySubmissionId({
    submissionId: submission.id,
  });

  assert.deepEqual(result, {
    processingError: "Provider unavailable.",
    status: "failed",
  });
});

test("getBySubmissionId returns typed RESULT_NOT_FOUND payload", async () => {
  const caller = await createCaller();
  const result = await caller.getBySubmissionId({
    submissionId: "11111111-1111-4111-8111-111111111111",
  });

  assertNotFoundResult(result);
  assert.match(result.message, /not found/i);
});

test("provider unavailable maps correctly", async () => {
  const caller = await createCaller({
    runAnalysis: async () => {
      throw new RoastDomainError(
        PROVIDER_UNAVAILABLE_CODE,
        "Provider offline OPENAI_API_KEY=sk-secret",
      );
    },
  });

  const result = await caller.createSubmission({
    code: createTestCode("provider-unavailable"),
    language: "typescript",
    roastMode: "honest",
  });

  assertCreateError(result);
  assert.equal(result.code, PROVIDER_UNAVAILABLE_CODE);
  assert.match(result.submissionId ?? "", /^[0-9a-f-]{36}$/i);
});

test("provider timeout maps correctly", async () => {
  const caller = await createCaller({
    runAnalysis: async () => {
      throw new RoastDomainError(PROVIDER_TIMEOUT_CODE, "Timed out");
    },
  });

  const result = await caller.createSubmission({
    code: createTestCode("provider-timeout"),
    language: "typescript",
    roastMode: "honest",
  });

  assertCreateError(result);
  assert.equal(result.code, PROVIDER_TIMEOUT_CODE);
  assert.match(result.submissionId ?? "", /^[0-9a-f-]{36}$/i);
});

test("invalid provider payload maps correctly", async () => {
  const caller = await createCaller({
    runAnalysis: async () => {
      throw new RoastDomainError(
        INVALID_PROVIDER_OUTPUT_CODE,
        "Provider payload is invalid.",
      );
    },
  });

  const result = await caller.createSubmission({
    code: createTestCode("invalid-provider-output"),
    language: "typescript",
    roastMode: "honest",
  });

  assertCreateError(result);
  assert.equal(result.code, INVALID_PROVIDER_OUTPUT_CODE);
  assert.match(result.submissionId ?? "", /^[0-9a-f-]{36}$/i);
});

test("persistence failure maps correctly", async () => {
  const caller = await createCaller({
    persistAnalysis: async (input) => {
      const { persistRoastArtifacts } = await import("@/db/queries/roasts");

      await persistRoastArtifacts(input, {
        onAfterResultInsert: () => {
          throw new Error("simulated persistence failure");
        },
      });
    },
    runAnalysis: async () => ANALYSIS_OUTPUT,
  });

  const result = await caller.createSubmission({
    code: createTestCode("persistence-failure"),
    language: "typescript",
    roastMode: "honest",
  });

  assertCreateError(result);
  assert.equal(result.code, PERSISTENCE_ERROR_CODE);
  assert.match(result.submissionId ?? "", /^[0-9a-f-]{36}$/i);
});

test("failed status with sanitized processingError persists on provider failure", async () => {
  const caller = await createCaller({
    runAnalysis: async () => {
      throw new RoastDomainError(
        PROVIDER_UNAVAILABLE_CODE,
        "Missing OPENAI_API_KEY=sk-live-secret and Bearer sk-bearer-secret",
      );
    },
  });

  const result = await caller.createSubmission({
    code: createTestCode("sanitized-provider-error"),
    language: "typescript",
    roastMode: "honest",
  });

  assertCreateError(result);
  assert.equal(result.code, PROVIDER_UNAVAILABLE_CODE);
  assert.ok(result.submissionId);

  const [submission] = await db
    .select({
      processingError: submissions.processingError,
      status: submissions.status,
    })
    .from(submissions)
    .where(eq(submissions.id, result.submissionId));

  assert.equal(submission?.status, "failed");
  assert.match(submission?.processingError ?? "", /\[REDACTED\]/);
  assert.doesNotMatch(submission?.processingError ?? "", /sk-live-secret/);
  assert.doesNotMatch(submission?.processingError ?? "", /sk-bearer-secret/);
});

test("failed transactional persist leaves no partial result, issue, or diff rows", async () => {
  const caller = await createCaller({
    persistAnalysis: async (input) => {
      const { persistRoastArtifacts } = await import("@/db/queries/roasts");

      await persistRoastArtifacts(input, {
        onAfterResultInsert: () => {
          throw new Error("rollback please");
        },
      });
    },
    runAnalysis: async () => ANALYSIS_OUTPUT,
  });

  const result = await caller.createSubmission({
    code: createTestCode("rollback-safety"),
    language: "typescript",
    roastMode: "honest",
  });

  assertCreateError(result);
  assert.equal(result.code, PERSISTENCE_ERROR_CODE);
  assert.ok(result.submissionId);

  const artifacts = await countArtifacts(result.submissionId);

  assert.deepEqual(artifacts, {
    diffLines: 0,
    issues: 0,
    results: 0,
  });
});
