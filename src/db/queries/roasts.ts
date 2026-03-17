import { createHash, randomBytes } from "node:crypto";

import { and, asc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import {
  roastDiffLines,
  roastIssues,
  roastResults,
  submissions,
} from "@/db/schema";
import {
  PERSISTENCE_ERROR_CODE,
  RoastDomainError,
  type RoastMode,
  type RoastProviderOutput,
} from "@/lib/roasts/contracts";

type CreateSubmissionInput = {
  code: string;
  language?: string;
  roastMode: RoastMode;
  source?: string;
};

type PersistRoastArtifactsInput = {
  analysis: RoastProviderOutput;
  language?: string;
  provider?: string;
  providerModel?: string;
  submissionId: string;
};

type PersistRoastArtifactsOptions = {
  onAfterResultInsert?: () => void | Promise<void>;
};

function getCodeHash(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function createPublicId() {
  return `sub_${randomBytes(8).toString("hex")}`;
}

function createShareSlug() {
  return `share-${randomBytes(10).toString("hex")}`;
}

function toPersistenceError(error: unknown, submissionId?: string) {
  if (error instanceof RoastDomainError) {
    return error;
  }

  return new RoastDomainError(
    PERSISTENCE_ERROR_CODE,
    "Unable to persist roast results.",
    { cause: error, submissionId },
  );
}

async function getCompletedRoastByClause(
  whereClause:
    | ReturnType<typeof eq>
    | ReturnType<typeof and>
    | ReturnType<typeof or>,
) {
  const [result] = await db
    .select({
      submissionId: submissions.id,
      publicId: submissions.publicId,
      originalCode: submissions.originalCode,
      roastMode: submissions.roastMode,
      language: submissions.language,
      lineCount: submissions.lineCount,
      score: roastResults.score,
      verdict: roastResults.verdict,
      headline: roastResults.headline,
      summary: roastResults.summary,
      languageLabel: roastResults.languageLabel,
      shareSlug: roastResults.shareSlug,
      provider: roastResults.provider,
      providerModel: roastResults.providerModel,
      createdAt: roastResults.createdAt,
    })
    .from(submissions)
    .innerJoin(roastResults, eq(roastResults.submissionId, submissions.id))
    .where(whereClause)
    .limit(1);

  if (!result) {
    return null;
  }

  const [issues, diffLines] = await Promise.all([
    db
      .select({
        id: roastIssues.id,
        severity: roastIssues.severity,
        title: roastIssues.title,
        description: roastIssues.description,
        position: roastIssues.position,
      })
      .from(roastIssues)
      .where(eq(roastIssues.submissionId, result.submissionId))
      .orderBy(asc(roastIssues.position)),
    db
      .select({
        id: roastDiffLines.id,
        lineType: roastDiffLines.lineType,
        content: roastDiffLines.content,
        position: roastDiffLines.position,
      })
      .from(roastDiffLines)
      .where(eq(roastDiffLines.submissionId, result.submissionId))
      .orderBy(asc(roastDiffLines.position)),
  ]);

  return {
    ...result,
    diffLines,
    issues,
    status: "completed" as const,
  };
}

export async function createRoastSubmission(input: CreateSubmissionInput) {
  const [submission] = await db
    .insert(submissions)
    .values({
      codeHash: getCodeHash(input.code),
      language: input.language,
      lineCount: input.code.split("\n").length,
      originalCode: input.code,
      publicId: createPublicId(),
      roastMode: input.roastMode,
      source: input.source ?? "web",
      status: "processing",
    })
    .returning({
      id: submissions.id,
      publicId: submissions.publicId,
      status: submissions.status,
    });

  return submission;
}

export async function persistRoastArtifacts(
  input: PersistRoastArtifactsInput,
  options: PersistRoastArtifactsOptions = {},
) {
  try {
    await db.transaction(async (tx) => {
      await tx.insert(roastResults).values({
        headline: input.analysis.headline,
        languageLabel: input.language,
        provider: input.provider,
        providerModel: input.providerModel,
        score: input.analysis.score.toFixed(1),
        shareSlug: createShareSlug(),
        submissionId: input.submissionId,
        summary: input.analysis.summary,
        verdict: input.analysis.verdict,
      });

      await options.onAfterResultInsert?.();

      if (input.analysis.issues.length > 0) {
        await tx.insert(roastIssues).values(
          input.analysis.issues.map((issue, index) => ({
            description: issue.description,
            position: index + 1,
            severity: issue.severity,
            submissionId: input.submissionId,
            title: issue.title,
          })),
        );
      }

      if (input.analysis.diffLines.length > 0) {
        await tx.insert(roastDiffLines).values(
          input.analysis.diffLines.map((line, index) => ({
            content: line.content,
            lineType: line.lineType,
            position: index + 1,
            submissionId: input.submissionId,
          })),
        );
      }

      await tx
        .update(submissions)
        .set({
          processingError: null,
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(submissions.id, input.submissionId));
    });
  } catch (error) {
    throw toPersistenceError(error, input.submissionId);
  }
}

export async function markRoastSubmissionFailed(
  submissionId: string,
  processingError: string,
) {
  await db
    .update(submissions)
    .set({
      processingError,
      status: "failed",
      updatedAt: new Date(),
    })
    .where(eq(submissions.id, submissionId));
}

export async function getRoastBySubmissionId(submissionId: string) {
  const [submission] = await db
    .select({
      id: submissions.id,
      processingError: submissions.processingError,
      status: submissions.status,
    })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!submission) {
    return null;
  }

  if (submission.status === "failed") {
    return {
      processingError: submission.processingError,
      status: "failed" as const,
    };
  }

  if (submission.status === "pending" || submission.status === "processing") {
    return { status: "processing" as const };
  }

  return getCompletedRoastByClause(
    and(eq(submissions.id, submissionId), eq(submissions.status, "completed")),
  );
}

export async function getRoastByIdentifier(identifier: string) {
  return getCompletedRoastByClause(
    or(
      eq(submissions.publicId, identifier),
      eq(roastResults.shareSlug, identifier),
    ),
  );
}
